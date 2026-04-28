#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
ARTIFACTS_DIR = ROOT / ".artifacts" / "runtime-resilience-baseline" / "generated"

ESSENTIAL_MAP_PATH = DATA_DIR / "essential_function_map.json"
RECOVERY_TIERS_SEED_PATH = DATA_DIR / "recovery_tiers.json"
RECOVERY_TIER_CATALOG_PATH = DATA_DIR / "recovery_tier_catalog.json"
BACKUP_SCHEMA_PATH = DATA_DIR / "backup_set_manifest_schema.json"
READINESS_SCHEMA_PATH = DATA_DIR / "operational_readiness_snapshot_schema.json"
READINESS_MATRIX_PATH = DATA_DIR / "readiness_coverage_matrix.csv"
CATALOG_PATH = DATA_DIR / "resilience_baseline_catalog.json"
DOC_PATH = DOCS_DIR / "101_backup_restore_and_operational_readiness_baseline.md"
RULES_DOC_PATH = DOCS_DIR / "101_essential_function_map_and_recovery_tiers.md"
HTML_PATH = DOCS_DIR / "101_resilience_baseline_cockpit.html"

TASK_ID = "par_101"
VISUAL_MODE = "Resilience_Baseline_Cockpit"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

SCENARIOS = [
    ("local", None),
    ("local", "LOCAL_STALE_REHEARSAL"),
    ("ci-preview", "CI_PREVIEW_MISSING_BACKUP_MANIFEST"),
    ("integration", "INTEGRATION_BLOCKED_RESTORE_PROOF"),
    ("preprod", "PREPROD_TUPLE_DRIFT"),
    ("preprod", "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED"),
]


def run_rehearsal(environment: str, scenario_id: str | None) -> Path:
    slug = f"{environment}__{scenario_id or 'exact_ready'}"
    output_dir = ARTIFACTS_DIR / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        "pnpm",
        "exec",
        "tsx",
        str(ROOT / "tools" / "runtime-resilience-baseline" / "run-resilience-baseline-rehearsal.ts"),
        "--environment",
        environment,
        "--output-dir",
        str(output_dir),
    ]
    if scenario_id:
        command.extend(["--scenario-id", scenario_id])
    subprocess.run(command, check=True, cwd=ROOT)
    return output_dir


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_backup_manifest_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/backup_set_manifest_schema.json",
        "title": "BackupSetManifest",
        "type": "object",
        "required": [
            "backupSetManifestId",
            "environmentRing",
            "datasetScopeRef",
            "datasetLabel",
            "storeRef",
            "storeClass",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "releaseWatchTupleRef",
            "waveObservationPolicyRef",
            "buildProvenanceRef",
            "backupJobRef",
            "backupJobKind",
            "essentialFunctionRefs",
            "sourceDigestEntries",
            "backupArtifactRef",
            "backupArtifactDigest",
            "retentionPolicyRef",
            "immutabilityState",
            "restoreCompatibilityDigestRef",
            "manifestTupleHash",
            "manifestState",
            "capturedAt",
            "verifiedAt",
            "blockerRefs",
            "sourceRefs",
        ],
        "properties": {
            "backupSetManifestId": {"type": "string"},
            "environmentRing": {"type": "string"},
            "datasetScopeRef": {"type": "string"},
            "datasetLabel": {"type": "string"},
            "storeRef": {"type": "string"},
            "storeClass": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "releaseWatchTupleRef": {"type": "string"},
            "waveObservationPolicyRef": {"type": "string"},
            "buildProvenanceRef": {"type": "string"},
            "previewEnvironmentRef": {"type": ["string", "null"]},
            "backupJobRef": {"type": "string"},
            "backupJobKind": {
                "type": "string",
                "enum": [
                    "transactional_snapshot",
                    "fhir_snapshot",
                    "object_manifest",
                    "event_log_export",
                    "projection_snapshot",
                    "worm_audit_export",
                ],
            },
            "essentialFunctionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "sourceDigestEntries": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["sourceRef", "relativePath", "digest", "sizeBytes"],
                    "properties": {
                        "sourceRef": {"type": "string"},
                        "relativePath": {"type": "string"},
                        "digest": {"type": "string"},
                        "sizeBytes": {"type": "integer", "minimum": 0},
                    },
                },
            },
            "backupArtifactRef": {"type": "string"},
            "backupArtifactDigest": {"type": "string"},
            "retentionPolicyRef": {"type": "string"},
            "immutabilityState": {
                "type": "string",
                "enum": ["immutable", "worm_ready", "append_only"],
            },
            "restoreCompatibilityDigestRef": {"type": "string"},
            "manifestTupleHash": {"type": "string"},
            "manifestState": {"type": "string", "enum": ["current", "stale", "missing"]},
            "capturedAt": {"type": "string"},
            "verifiedAt": {"type": "string"},
            "blockerRefs": {"type": "array", "items": {"type": "string"}},
            "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_readiness_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/operational_readiness_snapshot_schema.json",
        "title": "OperationalReadinessSnapshot",
        "type": "object",
        "required": [
            "operationalReadinessSnapshotId",
            "environmentRing",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "releaseWatchTupleRef",
            "waveObservationPolicyRef",
            "buildProvenanceRef",
            "buildProvenanceState",
            "resilienceTupleHash",
            "requiredAssuranceSliceRefs",
            "activeFreezeRefs",
            "essentialFunctionRefs",
            "backupSetManifestRefs",
            "runbookBindingRefs",
            "latestRestoreRunRefs",
            "latestRecoveryEvidencePackRefs",
            "readinessState",
            "blockerRefs",
            "freshnessCeilingAt",
            "compiledAt",
            "functionVerdicts",
            "sourceRefs",
        ],
        "properties": {
            "operationalReadinessSnapshotId": {"type": "string"},
            "environmentRing": {"type": "string"},
            "previewEnvironmentRef": {"type": ["string", "null"]},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "releaseWatchTupleRef": {"type": "string"},
            "waveObservationPolicyRef": {"type": "string"},
            "buildProvenanceRef": {"type": "string"},
            "buildProvenanceState": {
                "type": "string",
                "enum": ["verified", "quarantined", "revoked", "superseded", "drifted"],
            },
            "resilienceTupleHash": {"type": "string"},
            "requiredAssuranceSliceRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "activeFreezeRefs": {"type": "array", "items": {"type": "string"}},
            "essentialFunctionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "backupSetManifestRefs": {"type": "array", "items": {"type": "string"}},
            "runbookBindingRefs": {"type": "array", "items": {"type": "string"}},
            "latestRestoreRunRefs": {"type": "array", "items": {"type": "string"}},
            "latestRecoveryEvidencePackRefs": {"type": "array", "items": {"type": "string"}},
            "readinessState": {
                "type": "string",
                "enum": [
                    "exact_and_ready",
                    "stale_rehearsal_evidence",
                    "missing_backup_manifest",
                    "blocked_restore_proof",
                    "tuple_drift",
                    "assurance_or_freeze_blocked",
                ],
            },
            "blockerRefs": {"type": "array", "items": {"type": "string"}},
            "freshnessCeilingAt": {"type": "string"},
            "compiledAt": {"type": "string"},
            "functionVerdicts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": [
                        "functionCode",
                        "recoveryTierRef",
                        "runbookBindingState",
                        "backupManifestState",
                        "restoreState",
                        "evidencePackState",
                        "readinessState",
                        "blockerRefs",
                    ],
                    "properties": {
                        "functionCode": {"type": "string"},
                        "recoveryTierRef": {"type": "string"},
                        "runbookBindingState": {
                            "type": "string",
                            "enum": ["current", "stale", "rehearsal_due"],
                        },
                        "backupManifestState": {
                            "type": "string",
                            "enum": ["current", "stale", "missing"],
                        },
                        "restoreState": {
                            "type": "string",
                            "enum": [
                                "journey_validated",
                                "journey_validation_pending",
                                "data_restored",
                                "blocked",
                            ],
                        },
                        "evidencePackState": {
                            "type": "string",
                            "enum": ["current", "stale", "blocked", "superseded"],
                        },
                        "readinessState": {
                            "type": "string",
                            "enum": [
                                "exact_and_ready",
                                "stale_rehearsal_evidence",
                                "missing_backup_manifest",
                                "blocked_restore_proof",
                                "tuple_drift",
                                "assurance_or_freeze_blocked",
                            ],
                        },
                        "blockerRefs": {"type": "array", "items": {"type": "string"}},
                    },
                },
            },
            "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def load_rehearsal(path: Path) -> dict[str, Any]:
    return {
        "context": load_json(path / "scenario-context.json"),
        "summary": load_json(path / "rehearsal-summary.json"),
        "manifests": load_json(path / "backup-set-manifests.json"),
        "runbook_bindings": load_json(path / "runbook-bindings.json"),
        "restore_runs": load_json(path / "restore-runs.json"),
        "evidence_packs": load_json(path / "recovery-evidence-packs.json"),
        "snapshot": load_json(path / "operational-readiness-snapshot.json"),
    }


def build_recovery_lookup(exact_ready: dict[str, Any]) -> tuple[dict[str, list[str]], dict[str, list[str]], dict[str, str]]:
    backup_scope_lookup: dict[str, list[str]] = {}
    journey_lookup: dict[str, list[str]] = {}
    runbook_lookup: dict[str, str] = {}
    manifests = exact_ready["manifests"]
    for function_code in exact_ready["snapshot"]["essentialFunctionRefs"]:
        backup_scope_lookup[function_code] = [
            manifest["datasetScopeRef"]
            for manifest in manifests
            if function_code in manifest["essentialFunctionRefs"]
        ]
    for restore_run in exact_ready["restore_runs"]:
        journey_lookup[restore_run["functionCode"]] = restore_run["requiredJourneyProofRefs"]
    for binding in exact_ready["runbook_bindings"]:
        runbook_lookup[binding["functionCode"]] = binding["runbookBindingRecordId"]
    return backup_scope_lookup, journey_lookup, runbook_lookup


def build_essential_function_map(
    exact_ready: dict[str, Any],
    backup_scope_lookup: dict[str, list[str]],
    journey_lookup: dict[str, list[str]],
    runbook_lookup: dict[str, str],
) -> dict[str, Any]:
    seed = load_json(ESSENTIAL_MAP_PATH)
    rows: list[dict[str, Any]] = []
    for row in seed["essentialFunctionMap"]:
        function_code = row["functionCode"]
        updated = dict(row)
        updated["currentRunbookBindingRefs"] = [runbook_lookup[function_code]]
        updated["currentOperationalReadinessSnapshotRef"] = exact_ready["snapshot"][
            "operationalReadinessSnapshotId"
        ]
        updated["requiredBackupScopeRefs"] = backup_scope_lookup[function_code]
        updated["requiredJourneyProofRefs"] = journey_lookup[function_code]
        updated["requiredAssuranceSliceRefs"] = exact_ready["context"]["tuple"][
            "requiredAssuranceSliceRefs"
        ]
        updated["readinessScenarioRefs"] = [scenario["summary"]["scenarioId"] for scenario in scenario_payloads]
        rows.append(updated)

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": GENERATED_AT[:10],
        "visual_mode": VISUAL_MODE,
        "summary": {
            "essential_function_count": len(rows),
            "tier_0_count": sum(
                1
                for row in rows
                if "RELEASE_GOVERNANCE" in row["recoveryTierRef"]
                or "PLATFORM_RECOVERY_CONTROL" in row["recoveryTierRef"]
            ),
            "recovery_only_count": sum(1 for row in rows if row["functionState"] == "recovery_only"),
        },
        "gap_resolutions": [
            "GAP_RESOLUTION_BACKUP_RUNTIME_PREVIEW_TARGETS::Backup payloads and restore targets are exercised against faithful local and non-production emulation directories that preserve the canonical schemas and tuple semantics.",
            "GAP_RUNBOOK_BINDING_PRODUCTION_REHEARSAL_WINDOWS::Production-grade runbooks stay machine-bound here, but their live rehearsal cadence remains marked through the readiness snapshot instead of treated as informal wiki currency.",
        ],
        "essentialFunctionMap": rows,
    }


def build_recovery_tier_catalog(
    exact_ready: dict[str, Any],
    backup_scope_lookup: dict[str, list[str]],
    journey_lookup: dict[str, list[str]],
) -> dict[str, Any]:
    seed = load_json(RECOVERY_TIERS_SEED_PATH)
    rows = []
    for row in seed["recoveryTiers"]:
        function_code = row["functionCode"]
        updated = dict(row)
        updated["requiredBackupScopeRefs"] = backup_scope_lookup[function_code]
        updated["requiredJourneyProofRefs"] = journey_lookup[function_code]
        updated["currentOperationalReadinessSnapshotRef"] = exact_ready["snapshot"][
            "operationalReadinessSnapshotId"
        ]
        rows.append(updated)

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": GENERATED_AT[:10],
        "visual_mode": VISUAL_MODE,
        "summary": {
            "tier_count": len(rows),
            "priority_0_count": sum(1 for row in rows if row["restorePriority"] == 0),
            "priority_1_count": sum(1 for row in rows if row["restorePriority"] == 1),
            "priority_2_count": sum(1 for row in rows if row["restorePriority"] == 2),
            "priority_3_plus_count": sum(1 for row in rows if row["restorePriority"] >= 3),
        },
        "recoveryTiers": rows,
    }


def build_catalog(scenarios: list[dict[str, Any]]) -> dict[str, Any]:
    readiness_counts: dict[str, int] = {}
    for payload in scenarios:
        state = payload["snapshot"]["readinessState"]
        readiness_counts[state] = readiness_counts.get(state, 0) + 1

    exact_ready = next(
        payload for payload in scenarios if payload["snapshot"]["readinessState"] == "exact_and_ready"
    )
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": GENERATED_AT,
        "captured_on": GENERATED_AT[:10],
        "mission": "Implement the Phase 0 resilience baseline by binding backup coverage, restore rehearsal evidence, runbook freshness, and tuple-aware readiness verdicts into one machine-readable operational snapshot.",
        "source_precedence": [
            "prompt/101.md",
            "prompt/shared_operating_contract_096_to_105.md",
            "data/analysis/runtime_publication_bundles.json",
            "data/analysis/release_publication_parity_records.json",
            "data/analysis/release_watch_pipeline_catalog.json",
            "data/analysis/build_provenance_manifest.json",
            "data/analysis/essential_function_map.json",
            "data/analysis/recovery_tiers.json",
        ],
        "gap_resolutions": [
            {
                "gapId": "GAP_RESOLUTION_BACKUP_RUNTIME_PREVIEW_TARGETS",
                "summary": "Backup and restore drills execute now against deterministic local and non-production artifact copies that preserve the same BackupSetManifest, RestoreRun, RecoveryEvidencePack, and OperationalReadinessSnapshot semantics used later in production.",
            },
            {
                "gapId": "GAP_RUNBOOK_BINDING_PRODUCTION_REHEARSAL_WINDOWS",
                "summary": "Runbook bindings are machine-readable and freshness-scored now, while richer production rehearsal approvals remain a follow-on hardening seam rather than loose wiki authority.",
            },
        ],
        "follow_on_dependencies": [
            {
                "dependencyId": "FOLLOW_ON_DEPENDENCY_101_PRODUCTION_BACKUP_PROVIDER_HARDENING",
                "summary": "Production-grade snapshot orchestration, immutable archival tiers, and operator approval flows may strengthen the same baseline objects without replacing them.",
            },
            {
                "dependencyId": "FOLLOW_ON_DEPENDENCY_102_CANARY_CONSUMES_READINESS",
                "summary": "par_102 should consume the OperationalReadinessSnapshot outputs here instead of reconstructing restore posture from dashboards or logs.",
            },
        ],
        "summary": {
            "scenario_count": len(scenarios),
            "environment_count": len({payload["context"]["environmentRing"] for payload in scenarios}),
            "essential_function_count": len(exact_ready["snapshot"]["essentialFunctionRefs"]),
            "backup_manifest_count": len(exact_ready["manifests"]),
            "runbook_binding_count": len(exact_ready["runbook_bindings"]),
            "restore_run_count": len(exact_ready["restore_runs"]),
            "recovery_evidence_pack_count": len(exact_ready["evidence_packs"]),
            "exact_ready_count": readiness_counts.get("exact_and_ready", 0),
            "stale_rehearsal_count": readiness_counts.get("stale_rehearsal_evidence", 0),
            "missing_manifest_count": readiness_counts.get("missing_backup_manifest", 0),
            "blocked_restore_count": readiness_counts.get("blocked_restore_proof", 0),
            "tuple_drift_count": readiness_counts.get("tuple_drift", 0),
            "freeze_blocked_count": readiness_counts.get("assurance_or_freeze_blocked", 0),
        },
        "scenarios": [
            {
                "scenarioId": payload["context"]["scenarioId"],
                "environmentRing": payload["context"]["environmentRing"],
                "expectedReadinessState": payload["context"]["expectedReadinessState"],
                "actualReadinessState": payload["snapshot"]["readinessState"],
                "blockerRefs": payload["snapshot"]["blockerRefs"],
                "snapshotId": payload["snapshot"]["operationalReadinessSnapshotId"],
                "tupleHash": payload["context"]["resilienceTupleHash"],
                "manifestCount": len(payload["manifests"]),
                "restoreRunCount": len(payload["restore_runs"]),
                "evidencePackCount": len(payload["evidence_packs"]),
            }
            for payload in scenarios
        ],
        "scenarioDetails": [
            {
                "scenarioId": payload["context"]["scenarioId"],
                "manifests": payload["manifests"],
                "runbookBindings": payload["runbook_bindings"],
                "restoreRuns": payload["restore_runs"],
                "evidencePacks": payload["evidence_packs"],
                "snapshot": payload["snapshot"],
            }
            for payload in scenarios
        ],
        "exact_ready_snapshot_ref": exact_ready["snapshot"]["operationalReadinessSnapshotId"],
    }


def build_matrix_rows(scenarios: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for payload in scenarios:
        scenario_id = payload["context"]["scenarioId"]
        environment_ring = payload["context"]["environmentRing"]
        for verdict in payload["snapshot"]["functionVerdicts"]:
            rows.append(
                {
                    "scenario_id": scenario_id,
                    "environment_ring": environment_ring,
                    "function_code": verdict["functionCode"],
                    "readiness_state": verdict["readinessState"],
                    "backup_manifest_state": verdict["backupManifestState"],
                    "restore_state": verdict["restoreState"],
                    "evidence_pack_state": verdict["evidencePackState"],
                    "runbook_binding_state": verdict["runbookBindingState"],
                    "blocker_refs": "; ".join(verdict["blockerRefs"]),
                }
            )
    return rows


def build_baseline_doc(catalog: dict[str, Any]) -> str:
    scenarios = "\n".join(
        f"| `{row['scenarioId']}` | `{row['environmentRing']}` | `{row['actualReadinessState']}` | `{', '.join(row['blockerRefs']) or 'none'}` |"
        for row in catalog["scenarios"]
    )
    return dedent(
        f"""
        # 101 Backup Restore And Operational Readiness Baseline

        The resilience baseline is now runtime-bound instead of documentation-bound. `BackupSetManifest`, `RestoreRun`, `RecoveryEvidencePack`, runbook bindings, and `OperationalReadinessSnapshot` all resolve through the same release tuple that `par_094`, `par_097`, `par_099`, and `par_100` already publish.

        ## What This Publishes

        - deterministic backup manifests for transactional, FHIR, projection, object-storage, event-spine, and WORM evidence scopes
        - restore rehearsals that prove `data_restored` and `journey_validated` or `journey_validation_pending`, not merely backup existence
        - machine-readable runbook freshness and blocker state for every essential function
        - one readiness snapshot that fails closed on stale evidence, missing manifests, restore blockers, tuple drift, or freeze posture

        ## Scenario Coverage

        | Scenario | Environment | Readiness | Blockers |
        | --- | --- | --- | --- |
        {scenarios}

        ## Gap Resolutions

        - `GAP_RESOLUTION_BACKUP_RUNTIME_PREVIEW_TARGETS`: Local and non-production rehearsals materialize real payload copies under `.artifacts/runtime-resilience-baseline/*` so the same schemas and tuple hashes stay valid before provider cutover.
        - `GAP_RUNBOOK_BINDING_PRODUCTION_REHEARSAL_WINDOWS`: Runbook bindings are freshness-scored now, and production-specific approval envelopes remain a follow-on overlay instead of a replacement authority.
        """
    ).strip()


def build_rules_doc(essential_map: dict[str, Any], tier_catalog: dict[str, Any]) -> str:
    essential_rows = "\n".join(
        f"| `{row['functionCode']}` | `{row['functionLabel']}` | `{row['recoveryTierRef']}` | `{', '.join(row['requiredBackupScopeRefs'])}` | `{', '.join(row['requiredJourneyProofRefs'])}` | `{', '.join(row['currentRunbookBindingRefs'])}` |"
        for row in essential_map["essentialFunctionMap"]
    )
    tier_rows = "\n".join(
        f"| `{row['functionCode']}` | `{row['tierCode']}` | `{row['rto']}` | `{row['rpo']}` | `{row['restorePriority']}` |"
        for row in tier_catalog["recoveryTiers"]
    )
    return dedent(
        f"""
        # 101 Essential Function Map And Recovery Tiers

        ## Essential Function Coverage

        | Function | Label | Recovery tier | Backup scopes | Journey proof | Runbook binding |
        | --- | --- | --- | --- | --- | --- |
        {essential_rows}

        ## Recovery Tier Commitments

        | Function | Tier | RTO | RPO | Restore priority |
        | --- | --- | --- | --- | --- |
        {tier_rows}

        ## Readiness Rules

        - `exact_and_ready` is legal only while the current tuple matches every backup manifest, runbook binding, restore run, and recovery evidence pack.
        - `stale_rehearsal_evidence` applies when a runbook is stale, a restore pack expired, or journey validation stopped at pending.
        - `missing_backup_manifest` applies when any required backup scope is absent or explicitly marked missing.
        - `blocked_restore_proof` applies when restore execution or evidence packing published an explicit blocker.
        - `tuple_drift` applies when any readiness input no longer matches the current runtime publication tuple.
        - `assurance_or_freeze_blocked` applies when the release tuple carries an active freeze or assurance block even if recovery artifacts are otherwise current.
        """
    ).strip()


def build_html(catalog: dict[str, Any], matrix_rows: list[dict[str, Any]]) -> str:
    payload = json.dumps(
        {
            "catalog": catalog,
            "matrixRows": matrix_rows,
        },
        separators=(",", ":"),
    )
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>101 Resilience Baseline Cockpit</title>
            <style>
              :root {{
                color-scheme: light;
                --bg: #f4f2eb;
                --panel: rgba(255, 255, 255, 0.86);
                --text: #16222d;
                --muted: #526170;
                --line: rgba(22, 34, 45, 0.12);
                --ready: #0f766e;
                --stale: #a16207;
                --blocked: #b91c1c;
                --drift: #7c3aed;
                --freeze: #1d4ed8;
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                font-family: "Iowan Old Style", "Palatino Linotype", serif;
                color: var(--text);
                background:
                  radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 32rem),
                  radial-gradient(circle at top right, rgba(29, 78, 216, 0.12), transparent 28rem),
                  linear-gradient(180deg, #f7f5ee 0%, var(--bg) 100%);
              }}
              body[data-reduced-motion="true"] * {{
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }}
              .shell {{
                display: grid;
                grid-template-columns: minmax(0, 1.45fr) minmax(22rem, 0.95fr);
                gap: 1.5rem;
                padding: 1.5rem;
                max-width: 1600px;
                margin: 0 auto;
              }}
              .main-column, .side-column {{
                display: grid;
                gap: 1rem;
                align-content: start;
              }}
              .panel {{
                background: var(--panel);
                border: 1px solid var(--line);
                border-radius: 1.25rem;
                padding: 1rem 1.1rem;
                box-shadow: 0 18px 46px rgba(22, 34, 45, 0.08);
                backdrop-filter: blur(10px);
              }}
              .masthead {{
                display: grid;
                gap: 0.75rem;
              }}
              .eyebrow {{
                letter-spacing: 0.16em;
                text-transform: uppercase;
                font-size: 0.74rem;
                color: var(--muted);
              }}
              h1, h2 {{
                margin: 0;
                font-weight: 600;
              }}
              .summary-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
                gap: 0.75rem;
              }}
              .summary-card {{
                border: 1px solid var(--line);
                border-radius: 1rem;
                padding: 0.8rem;
                background: rgba(255, 255, 255, 0.68);
              }}
              .summary-card strong {{
                display: block;
                font-size: 1.7rem;
              }}
              .filters {{
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
              }}
              select {{
                min-width: 13rem;
                border-radius: 999px;
                border: 1px solid var(--line);
                padding: 0.6rem 0.85rem;
                background: white;
                color: var(--text);
              }}
              .scenario-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: 0.75rem;
              }}
              .scenario-card {{
                border: 1px solid var(--line);
                border-radius: 1rem;
                padding: 0.95rem;
                background: rgba(255, 255, 255, 0.72);
                text-align: left;
                cursor: pointer;
              }}
              .scenario-card[data-selected="true"] {{
                border-color: var(--text);
                box-shadow: inset 0 0 0 1px var(--text);
              }}
              [data-readiness-state="exact_and_ready"] {{ border-left: 0.45rem solid var(--ready); }}
              [data-readiness-state="stale_rehearsal_evidence"] {{ border-left: 0.45rem solid var(--stale); }}
              [data-readiness-state="missing_backup_manifest"],
              [data-readiness-state="blocked_restore_proof"] {{ border-left: 0.45rem solid var(--blocked); }}
              [data-readiness-state="tuple_drift"] {{ border-left: 0.45rem solid var(--drift); }}
              [data-readiness-state="assurance_or_freeze_blocked"] {{ border-left: 0.45rem solid var(--freeze); }}
              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.95rem;
              }}
              th, td {{
                text-align: left;
                padding: 0.6rem 0.5rem;
                border-bottom: 1px solid var(--line);
                vertical-align: top;
              }}
              tbody tr[data-selected="true"] {{
                background: rgba(22, 34, 45, 0.07);
              }}
              button.table-row {{
                all: unset;
                display: contents;
                cursor: pointer;
              }}
              .pill {{
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                border-radius: 999px;
                padding: 0.2rem 0.55rem;
                font-size: 0.78rem;
                background: rgba(22, 34, 45, 0.08);
              }}
              .blockers {{
                display: flex;
                gap: 0.35rem;
                flex-wrap: wrap;
              }}
              .inspector-copy {{
                display: grid;
                gap: 0.6rem;
                color: var(--muted);
              }}
              @media (max-width: 1160px) {{
                .shell {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="shell">
              <main class="main-column">
                <section class="panel masthead" data-testid="cockpit-masthead">
                  <div class="eyebrow">Phase 0 resilience baseline</div>
                  <h1>Backup, restore, and readiness now resolve through one tuple.</h1>
                  <p>
                    The cockpit is a read-only lens over machine-readable backup manifests, restore evidence,
                    runbook freshness, and operational readiness snapshots. It is not a source of truth.
                  </p>
                </section>
                <section class="panel" data-testid="readiness-summary">
                  <div class="summary-grid" id="summary-grid"></div>
                </section>
                <section class="panel">
                  <div class="filters">
                    <label>
                      <span class="eyebrow">Scenario</span><br />
                      <select data-testid="filter-scenario" id="filter-scenario"></select>
                    </label>
                    <label>
                      <span class="eyebrow">Readiness</span><br />
                      <select data-testid="filter-readiness" id="filter-readiness"></select>
                    </label>
                  </div>
                </section>
                <section class="panel" data-testid="scenario-grid">
                  <h2>Scenario cards</h2>
                  <div class="scenario-grid" id="scenario-grid-body"></div>
                </section>
                <section class="panel" data-testid="scenario-table">
                  <h2>Scenario table</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Environment</th>
                        <th>Readiness</th>
                        <th>Blockers</th>
                      </tr>
                    </thead>
                    <tbody id="scenario-table-body"></tbody>
                  </table>
                </section>
                <section class="panel" data-testid="manifest-table">
                  <h2>Backup manifests</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Scope</th>
                        <th>State</th>
                        <th>Functions</th>
                        <th>Digest entries</th>
                      </tr>
                    </thead>
                    <tbody id="manifest-table-body"></tbody>
                  </table>
                </section>
                <section class="panel" data-testid="essential-function-table">
                  <h2>Essential function coverage</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Function</th>
                        <th>Readiness</th>
                        <th>Runbook</th>
                        <th>Restore</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody id="function-table-body"></tbody>
                  </table>
                </section>
              </main>
              <aside class="side-column">
                <section class="panel" data-testid="inspector">
                  <h2>Inspector</h2>
                  <div class="inspector-copy" id="inspector-copy"></div>
                </section>
              </aside>
            </div>
            <script id="resilience-baseline-data" type="application/json">{payload}</script>
            <script>
              const payload = JSON.parse(document.getElementById("resilience-baseline-data").textContent);
              const scenarios = payload.catalog.scenarios;
              const summaryGrid = document.getElementById("summary-grid");
              const scenarioGrid = document.getElementById("scenario-grid-body");
              const scenarioTableBody = document.getElementById("scenario-table-body");
              const manifestTableBody = document.getElementById("manifest-table-body");
              const functionTableBody = document.getElementById("function-table-body");
              const inspectorCopy = document.getElementById("inspector-copy");
              const filterScenario = document.getElementById("filter-scenario");
              const filterReadiness = document.getElementById("filter-readiness");
              const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              document.body.dataset.reducedMotion = reducedMotion ? "true" : "false";

              const summaryEntries = [
                ["Scenarios", payload.catalog.summary.scenario_count],
                ["Exact ready", payload.catalog.summary.exact_ready_count],
                ["Stale evidence", payload.catalog.summary.stale_rehearsal_count],
                ["Tuple drift", payload.catalog.summary.tuple_drift_count],
                ["Freeze blocked", payload.catalog.summary.freeze_blocked_count],
              ];

              const scenarioArtifacts = new Map();
              payload.matrixRows.forEach((row) => {{
                if (!scenarioArtifacts.has(row.scenario_id)) {{
                  scenarioArtifacts.set(row.scenario_id, []);
                }}
                scenarioArtifacts.get(row.scenario_id).push(row);
              }});
              const scenarioDetails = new Map(
                payload.catalog.scenarioDetails.map((detail) => [detail.scenarioId, detail]),
              );

              const exactReadyId = payload.catalog.scenarios.find((row) => row.actualReadinessState === "exact_and_ready")?.scenarioId ?? payload.catalog.scenarios[0].scenarioId;
              let selectedScenarioId = exactReadyId;

              function formatState(value) {{
                return value.replace(/_/g, " ");
              }}

              function renderSummary() {{
                summaryGrid.innerHTML = summaryEntries
                  .map(([label, value]) => `<article class="summary-card"><span class="eyebrow">${{label}}</span><strong>${{value}}</strong></article>`)
                  .join("");
              }}

              function renderFilters() {{
                const scenarioOptions = ["all", ...scenarios.map((row) => row.scenarioId)];
                const readinessOptions = [
                  "all",
                  "exact_and_ready",
                  "stale_rehearsal_evidence",
                  "missing_backup_manifest",
                  "blocked_restore_proof",
                  "tuple_drift",
                  "assurance_or_freeze_blocked",
                ];
                filterScenario.innerHTML = scenarioOptions
                  .map((value) => `<option value="${{value}}">${{value === "all" ? "All scenarios" : value}}</option>`)
                  .join("");
                filterReadiness.innerHTML = readinessOptions
                  .map((value) => `<option value="${{value}}">${{value === "all" ? "All readiness states" : formatState(value)}}</option>`)
                  .join("");
              }}

              function filteredScenarios() {{
                return scenarios.filter((row) => {{
                  const scenarioMatch = filterScenario.value === "all" || row.scenarioId === filterScenario.value;
                  const readinessMatch = filterReadiness.value === "all" || row.actualReadinessState === filterReadiness.value;
                  return scenarioMatch && readinessMatch;
                }});
              }}

              function syncSelection(list) {{
                if (!list.some((row) => row.scenarioId === selectedScenarioId)) {{
                  selectedScenarioId = list[0]?.scenarioId ?? selectedScenarioId;
                }}
              }}

              function renderScenarioCollections() {{
                const visible = filteredScenarios();
                syncSelection(visible);
                scenarioGrid.innerHTML = visible
                  .map((row) => `
                    <button
                      type="button"
                      class="scenario-card"
                      data-testid="scenario-card-${{row.scenarioId}}"
                      data-readiness-state="${{row.actualReadinessState}}"
                      data-selected="${{row.scenarioId === selectedScenarioId}}"
                      data-scenario-id="${{row.scenarioId}}">
                      <div class="eyebrow">${{row.environmentRing}}</div>
                      <strong>${{row.scenarioId}}</strong>
                      <p class="pill">${{formatState(row.actualReadinessState)}}</p>
                      <div class="blockers">${{(row.blockerRefs.length ? row.blockerRefs : ["none"]).map((entry) => `<span class="pill">${{entry}}</span>`).join("")}}</div>
                    </button>
                  `)
                  .join("");

                scenarioTableBody.innerHTML = visible
                  .map((row) => `
                    <tr data-testid="scenario-row-${{row.scenarioId}}" data-selected="${{row.scenarioId === selectedScenarioId}}" data-readiness-state="${{row.actualReadinessState}}" data-scenario-id="${{row.scenarioId}}">
                      <td>${{row.scenarioId}}</td>
                      <td>${{row.environmentRing}}</td>
                      <td>${{formatState(row.actualReadinessState)}}</td>
                      <td>${{row.blockerRefs.join(", ") || "none"}}</td>
                    </tr>
                  `)
                  .join("");
              }}

              function renderInspector() {{
                const scenario = scenarios.find((row) => row.scenarioId === selectedScenarioId) ?? scenarios[0];
                const functionRows = scenarioArtifacts.get(scenario.scenarioId) ?? [];
                const detail = scenarioDetails.get(scenario.scenarioId);
                inspectorCopy.innerHTML = `
                  <div><strong>${{scenario.scenarioId}}</strong></div>
                  <div>Environment: ${{scenario.environmentRing}}</div>
                  <div>Readiness: ${{formatState(scenario.actualReadinessState)}}</div>
                  <div>Tuple: <code>${{scenario.tupleHash}}</code></div>
                  <div>Blockers: ${{scenario.blockerRefs.join(", ") || "none"}}</div>
                  <div>Functions covered: ${{functionRows.length}}</div>
                  <div>Manifests: ${{detail?.manifests.length ?? 0}}</div>
                `;
                functionTableBody.innerHTML = functionRows
                  .map((row) => `
                    <tr data-readiness-state="${{row.readiness_state}}">
                      <td>${{row.function_code}}</td>
                      <td>${{formatState(row.readiness_state)}}</td>
                      <td>${{formatState(row.runbook_binding_state)}}</td>
                      <td>${{formatState(row.restore_state)}}</td>
                      <td>${{formatState(row.evidence_pack_state)}}</td>
                    </tr>
                  `)
                  .join("");

                manifestTableBody.innerHTML = (detail?.manifests ?? [])
                  .map((manifest, index) => `
                    <tr data-testid="manifest-row-${{index}}">
                      <td>${{manifest.datasetScopeRef}}</td>
                      <td>${{formatState(manifest.manifestState)}}</td>
                      <td>${{manifest.essentialFunctionRefs.join(", ")}}</td>
                      <td>${{manifest.sourceDigestEntries.length}}</td>
                    </tr>
                  `)
                  .join("");
              }}

              function selectScenarioById(scenarioId) {{
                selectedScenarioId = scenarioId;
                renderScenarioCollections();
                renderInspector();
              }}

              scenarioGrid.addEventListener("click", (event) => {{
                const node = event.target.closest("[data-scenario-id]");
                if (node) {{
                  selectScenarioById(node.dataset.scenarioId);
                }}
              }});

              scenarioGrid.addEventListener("keydown", (event) => {{
                const node = event.target.closest("[data-scenario-id]");
                if (node && (event.key === "Enter" || event.key === " ")) {{
                  event.preventDefault();
                  selectScenarioById(node.dataset.scenarioId);
                }}
              }});

              scenarioTableBody.addEventListener("click", (event) => {{
                const node = event.target.closest("[data-scenario-id]");
                if (node) {{
                  selectScenarioById(node.dataset.scenarioId);
                }}
              }});

              filterScenario.addEventListener("change", () => {{
                renderScenarioCollections();
                renderInspector();
              }});
              filterReadiness.addEventListener("change", () => {{
                renderScenarioCollections();
                renderInspector();
              }});

              renderSummary();
              renderFilters();
              renderScenarioCollections();
              renderInspector();
            </script>
          </body>
        </html>
        """
    ).strip()


scenario_payloads = [load_rehearsal(run_rehearsal(environment, scenario_id)) for environment, scenario_id in SCENARIOS]
exact_ready_payload = next(
    payload for payload in scenario_payloads if payload["snapshot"]["readinessState"] == "exact_and_ready"
)
backup_scope_lookup, journey_lookup, runbook_lookup = build_recovery_lookup(exact_ready_payload)
essential_map = build_essential_function_map(
    exact_ready_payload,
    backup_scope_lookup,
    journey_lookup,
    runbook_lookup,
)
tier_catalog = build_recovery_tier_catalog(
    exact_ready_payload,
    backup_scope_lookup,
    journey_lookup,
)
catalog = build_catalog(scenario_payloads)
matrix_rows = build_matrix_rows(scenario_payloads)

write_json(BACKUP_SCHEMA_PATH, build_backup_manifest_schema())
write_json(READINESS_SCHEMA_PATH, build_readiness_schema())
write_json(ESSENTIAL_MAP_PATH, essential_map)
write_json(RECOVERY_TIER_CATALOG_PATH, tier_catalog)
write_json(CATALOG_PATH, catalog)
write_csv(
    READINESS_MATRIX_PATH,
    [
        "scenario_id",
        "environment_ring",
        "function_code",
        "readiness_state",
        "backup_manifest_state",
        "restore_state",
        "evidence_pack_state",
        "runbook_binding_state",
        "blocker_refs",
    ],
    matrix_rows,
)
write_text(DOC_PATH, build_baseline_doc(catalog))
write_text(RULES_DOC_PATH, build_rules_doc(essential_map, tier_catalog))
write_text(HTML_PATH, build_html(catalog, matrix_rows))
