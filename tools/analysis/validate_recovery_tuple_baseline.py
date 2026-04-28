#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

ESSENTIAL_PATH = DATA_DIR / "essential_function_map.json"
TIERS_PATH = DATA_DIR / "recovery_tiers.json"
BACKUP_PATH = DATA_DIR / "backup_scope_matrix.csv"
POSTURE_PATH = DATA_DIR / "recovery_control_posture_rules.json"
EVIDENCE_PATH = DATA_DIR / "recovery_evidence_artifact_catalog.csv"
RESTORE_SCHEMA_PATH = DATA_DIR / "restore_run_schema.json"
PACKAGE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "recovery-control-posture.schema.json"

EXPECTED_FUNCTIONS = 9
EXPECTED_POSTURE_COUNTS = {
    "live_control": 3,
    "diagnostic_only": 2,
    "governed_recovery": 2,
    "blocked": 2,
}


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    essential = read_json(ESSENTIAL_PATH)
    tiers = read_json(TIERS_PATH)
    backup_rows = read_csv(BACKUP_PATH)
    posture = read_json(POSTURE_PATH)
    evidence_rows = read_csv(EVIDENCE_PATH)
    restore_schema = read_json(RESTORE_SCHEMA_PATH)
    package_schema = read_json(PACKAGE_SCHEMA_PATH)

    essential_rows = essential["essentialFunctionMap"]
    tier_rows = tiers["recoveryTiers"]
    posture_rows = posture["postureRules"]

    require(len(essential_rows) == EXPECTED_FUNCTIONS, "Essential function count drifted.")
    require(len(tier_rows) == EXPECTED_FUNCTIONS, "Recovery tier count drifted.")
    require(len(posture_rows) == EXPECTED_FUNCTIONS, "Recovery posture scope count drifted.")
    require(len(evidence_rows) == EXPECTED_FUNCTIONS * 2, "Recovery evidence artifact count drifted.")

    function_codes = [row["functionCode"] for row in essential_rows]
    require(len(set(function_codes)) == EXPECTED_FUNCTIONS, "Function codes are no longer unique.")
    tier_function_codes = [row["functionCode"] for row in tier_rows]
    require(set(tier_function_codes) == set(function_codes), "Tier rows drifted from the function map.")
    posture_function_codes = [row["functionCode"] for row in posture_rows]
    require(
        set(posture_function_codes) == set(function_codes),
        "Recovery posture rows drifted from the function map.",
    )

    backup_ids = {row["backup_set_manifest_id"] for row in backup_rows}
    require(len(backup_ids) == len(backup_rows), "Backup manifest ids are no longer unique.")
    require(
        all(row["immutability_state"] == "immutable" for row in backup_rows),
        "Backup manifest immutability drifted from the resilience baseline.",
    )
    require(
        any(row["manifest_state"] == "stale" for row in backup_rows),
        "The matrix no longer proves that stale manifests stay visible but non-authoritative.",
    )

    posture_counts = {key: 0 for key in EXPECTED_POSTURE_COUNTS}
    for row in posture_rows:
        posture_counts[row["postureState"]] += 1
        require(row["requiredRunbookBindingRefs"], f"{row['scopeRef']} lost runbook refs.")
        require(row["allowedActionRefs"], f"{row['scopeRef']} lost allowed actions.")
        require(
            set(row["currentBackupSetManifestRefs"]).issubset(backup_ids),
            f"{row['scopeRef']} references an unknown backup manifest.",
        )
        require(
            all(ref in backup_ids for ref in row["currentBackupSetManifestRefs"]),
            f"{row['scopeRef']} drifted from the backup matrix.",
        )
        if row["postureState"] == "live_control":
            require(
                row["restoreValidationFreshnessState"] == "fresh"
                and row["dependencyCoverageState"] == "complete"
                and row["journeyRecoveryCoverageState"] == "exact"
                and row["backupManifestState"] == "current"
                and not row["blockerRefs"],
                f"{row['scopeRef']} is marked live_control without a fully aligned tuple.",
            )
        else:
            require(
                row["blockerRefs"] or row["backupManifestState"] != "current" or row["journeyRecoveryCoverageState"] != "exact",
                f"{row['scopeRef']} lost its fail-closed explanation for non-live posture.",
            )

    require(posture_counts == EXPECTED_POSTURE_COUNTS, "Recovery posture distribution drifted.")

    tier_rows_by_function = {row["functionCode"]: row for row in tier_rows}
    for function_row in essential_rows:
        tier_row = tier_rows_by_function[function_row["functionCode"]]
        require(
            set(tier_row["requiredBackupScopeRefs"]).issubset(backup_ids),
            f"{function_row['functionCode']} tier references unknown backup scopes.",
        )
        require(
            tier_row["requiredJourneyProofRefs"],
            f"{function_row['functionCode']} tier lost journey proof refs.",
        )

    evidence_scope_refs = {row["scope_ref"] for row in evidence_rows}
    require(
        evidence_scope_refs == {row["scopeRef"] for row in posture_rows},
        "Recovery evidence artifacts no longer cover every posture scope.",
    )

    require(restore_schema["title"] == "RestoreRun", "RestoreRun schema title drifted.")
    require(
        "restoreRunId" in restore_schema["required"]
        and "resilienceActionSettlementRef" in restore_schema["required"],
        "RestoreRun schema lost authoritative settlement requirements.",
    )
    require(
        package_schema["title"] == "RecoveryControlPosture",
        "Package schema title drifted from RecoveryControlPosture.",
    )
    require(
        "postureState" in package_schema["required"]
        and "releaseRecoveryDispositionRef" in package_schema["required"],
        "Recovery control package schema lost critical posture fields.",
    )

    print("seq_060 recovery tuple baseline validation passed")


if __name__ == "__main__":
    main()
