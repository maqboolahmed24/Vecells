#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "runtime-resilience-baseline"

BACKUP_SCHEMA_PATH = DATA_DIR / "backup_set_manifest_schema.json"
READINESS_SCHEMA_PATH = DATA_DIR / "operational_readiness_snapshot_schema.json"
ESSENTIAL_FUNCTION_MAP_PATH = DATA_DIR / "essential_function_map.json"
RECOVERY_TIER_CATALOG_PATH = DATA_DIR / "recovery_tier_catalog.json"
READINESS_MATRIX_PATH = DATA_DIR / "readiness_coverage_matrix.csv"
CATALOG_PATH = DATA_DIR / "resilience_baseline_catalog.json"
DESIGN_DOC_PATH = DOCS_DIR / "101_backup_restore_and_operational_readiness_baseline.md"
RULES_DOC_PATH = DOCS_DIR / "101_essential_function_map_and_recovery_tiers.md"
HTML_PATH = DOCS_DIR / "101_resilience_baseline_cockpit.html"
SPEC_PATH = PLAYWRIGHT_DIR / "resilience-baseline-cockpit.spec.js"
BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_resilience_baseline.py"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
GENERATE_SCRIPT_PATH = TOOLS_DIR / "generate-backup-manifests.ts"
RESTORE_SCRIPT_PATH = TOOLS_DIR / "run-restore-rehearsal.ts"
COMPILE_SCRIPT_PATH = TOOLS_DIR / "compile-operational-readiness.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-resilience-baseline-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-resilience-baseline.ts"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "resilience-baseline.ts"
UNIT_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "resilience-baseline.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_101 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        BACKUP_SCHEMA_PATH,
        READINESS_SCHEMA_PATH,
        ESSENTIAL_FUNCTION_MAP_PATH,
        RECOVERY_TIER_CATALOG_PATH,
        READINESS_MATRIX_PATH,
        CATALOG_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        SHARED_SCRIPT_PATH,
        GENERATE_SCRIPT_PATH,
        RESTORE_SCRIPT_PATH,
        COMPILE_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        UNIT_TEST_PATH,
        PUBLIC_API_TEST_PATH,
        WORKFLOW_CI_PATH,
        WORKFLOW_PROMOTION_PATH,
    ]:
        assert_exists(path)

    backup_schema = load_json(BACKUP_SCHEMA_PATH)
    readiness_schema = load_json(READINESS_SCHEMA_PATH)
    essential_map = load_json(ESSENTIAL_FUNCTION_MAP_PATH)
    recovery_tier_catalog = load_json(RECOVERY_TIER_CATALOG_PATH)
    readiness_rows = load_csv(READINESS_MATRIX_PATH)
    catalog = load_json(CATALOG_PATH)

    if backup_schema["title"] != "BackupSetManifest":
        fail("BackupSetManifest schema title drifted.")
    if backup_schema["properties"]["manifestState"]["enum"] != ["current", "stale", "missing"]:
        fail("Backup manifest states drifted.")
    if readiness_schema["title"] != "OperationalReadinessSnapshot":
        fail("OperationalReadinessSnapshot schema title drifted.")
    expected_readiness_states = {
        "exact_and_ready",
        "stale_rehearsal_evidence",
        "missing_backup_manifest",
        "blocked_restore_proof",
        "tuple_drift",
        "assurance_or_freeze_blocked",
    }
    if set(readiness_schema["properties"]["readinessState"]["enum"]) != expected_readiness_states:
        fail("Operational readiness states drifted.")

    if catalog["task_id"] != "par_101":
        fail("Resilience baseline catalog drifted off par_101.")
    if catalog["visual_mode"] != "Resilience_Baseline_Cockpit":
        fail("Resilience baseline visual mode drifted.")
    summary = catalog["summary"]
    scenarios = catalog["scenarios"]
    scenario_details = catalog["scenarioDetails"]
    if summary["scenario_count"] != len(scenarios) or len(scenarios) != len(scenario_details):
        fail("Scenario counts drifted.")
    if summary["scenario_count"] != 6:
        fail("par_101 must publish 6 resilience scenarios.")
    if summary["environment_count"] != len({row["environmentRing"] for row in scenarios}):
        fail("environment_count drifted.")
    if summary["essential_function_count"] != 9:
        fail("par_101 must publish 9 essential functions.")

    actual_states = {row["actualReadinessState"] for row in scenarios}
    if actual_states != expected_readiness_states:
        fail(f"Expected readiness states {expected_readiness_states}, found {actual_states}.")

    expected_scenarios = {
        "LOCAL_EXACT_READY",
        "LOCAL_STALE_REHEARSAL",
        "CI_PREVIEW_MISSING_BACKUP_MANIFEST",
        "INTEGRATION_BLOCKED_RESTORE_PROOF",
        "PREPROD_TUPLE_DRIFT",
        "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
    }
    scenario_ids = {row["scenarioId"] for row in scenarios}
    if scenario_ids != expected_scenarios:
        fail(f"Scenario coverage drifted: {scenario_ids ^ expected_scenarios}")

    readiness_counts = {
        "exact_ready_count": "exact_and_ready",
        "stale_rehearsal_count": "stale_rehearsal_evidence",
        "missing_manifest_count": "missing_backup_manifest",
        "blocked_restore_count": "blocked_restore_proof",
        "tuple_drift_count": "tuple_drift",
        "freeze_blocked_count": "assurance_or_freeze_blocked",
    }
    for summary_key, readiness_state in readiness_counts.items():
        expected_count = sum(1 for row in scenarios if row["actualReadinessState"] == readiness_state)
        if summary[summary_key] != expected_count:
            fail(f"{summary_key} drifted.")

    detail_by_id = {row["scenarioId"]: row for row in scenario_details}
    exact_ready_detail = detail_by_id["LOCAL_EXACT_READY"]
    if summary["backup_manifest_count"] != len(exact_ready_detail["manifests"]):
        fail("backup_manifest_count drifted.")
    if summary["runbook_binding_count"] != len(exact_ready_detail["runbookBindings"]):
        fail("runbook_binding_count drifted.")
    if summary["restore_run_count"] != len(exact_ready_detail["restoreRuns"]):
        fail("restore_run_count drifted.")
    if summary["recovery_evidence_pack_count"] != len(exact_ready_detail["evidencePacks"]):
        fail("recovery_evidence_pack_count drifted.")

    if catalog["exact_ready_snapshot_ref"] != exact_ready_detail["snapshot"][
        "operationalReadinessSnapshotId"
    ]:
        fail("exact_ready_snapshot_ref drifted from the exact-ready snapshot.")

    for scenario in scenarios:
        detail = detail_by_id[scenario["scenarioId"]]
        snapshot = detail["snapshot"]
        if snapshot["operationalReadinessSnapshotId"] != scenario["snapshotId"]:
            fail(f"{scenario['scenarioId']} lost snapshot linkage.")
        if snapshot["readinessState"] != scenario["actualReadinessState"]:
            fail(f"{scenario['scenarioId']} lost readiness-state linkage.")
        if snapshot["resilienceTupleHash"] != scenario["tupleHash"]:
            fail(f"{scenario['scenarioId']} lost tuple-hash linkage.")
        if len(snapshot["functionVerdicts"]) != summary["essential_function_count"]:
            fail(f"{scenario['scenarioId']} lost full essential-function coverage.")

    if essential_map["task_id"] != "par_101":
        fail("Essential function map drifted off par_101.")
    if essential_map["visual_mode"] != "Resilience_Baseline_Cockpit":
        fail("Essential function map visual mode drifted.")
    essential_functions = essential_map["essentialFunctionMap"]
    if essential_map["summary"]["essential_function_count"] != len(essential_functions):
        fail("Essential function count drifted.")
    if len(essential_functions) != summary["essential_function_count"]:
        fail("Essential function map drifted from resilience catalog coverage.")
    for row in essential_functions:
        if not row["requiredBackupScopeRefs"]:
            fail(f"{row['functionCode']} lost requiredBackupScopeRefs.")
        if not row["requiredJourneyProofRefs"]:
            fail(f"{row['functionCode']} lost requiredJourneyProofRefs.")
        if not row["currentRunbookBindingRefs"]:
            fail(f"{row['functionCode']} lost currentRunbookBindingRefs.")
        if not row["currentOperationalReadinessSnapshotRef"]:
            fail(f"{row['functionCode']} lost currentOperationalReadinessSnapshotRef.")

    if recovery_tier_catalog["task_id"] != "par_101":
        fail("Recovery tier catalog drifted off par_101.")
    if recovery_tier_catalog["visual_mode"] != "Resilience_Baseline_Cockpit":
        fail("Recovery tier visual mode drifted.")
    recovery_tiers = recovery_tier_catalog["recoveryTiers"]
    if recovery_tier_catalog["summary"]["tier_count"] != len(recovery_tiers):
        fail("Recovery tier count drifted.")
    if len(recovery_tiers) != summary["essential_function_count"]:
        fail("Recovery tier coverage drifted from essential-function coverage.")
    if {row["functionCode"] for row in recovery_tiers} != {row["functionCode"] for row in essential_functions}:
        fail("Recovery tiers and essential-function map lost function alignment.")

    if len(readiness_rows) != summary["scenario_count"] * summary["essential_function_count"]:
        fail("Readiness coverage matrix row count drifted.")
    scenario_row_counts: dict[str, int] = {}
    for row in readiness_rows:
        scenario_row_counts[row["scenario_id"]] = scenario_row_counts.get(row["scenario_id"], 0) + 1
    for scenario_id in expected_scenarios:
        if scenario_row_counts.get(scenario_id) != summary["essential_function_count"]:
            fail(f"{scenario_id} lost readiness matrix coverage.")

    if len(catalog["gap_resolutions"]) != 2:
        fail("Gap resolution coverage drifted.")
    if len(catalog["follow_on_dependencies"]) != 2:
        fail("Follow-on dependency coverage drifted.")
    gap_ids = {row["gapId"] for row in catalog["gap_resolutions"]}
    if "GAP_RESOLUTION_BACKUP_RUNTIME_PREVIEW_TARGETS" not in gap_ids:
        fail("Resilience baseline catalog lost preview-target gap resolution.")
    dependency_ids = {row["dependencyId"] for row in catalog["follow_on_dependencies"]}
    if "FOLLOW_ON_DEPENDENCY_102_CANARY_CONSUMES_READINESS" not in dependency_ids:
        fail("Resilience baseline catalog lost canary readiness follow-on.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:resilience-baseline",
        "ci:rehearse-resilience-baseline",
        "ci:verify-resilience-baseline",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_resilience_baseline.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_101 builder.")
    if "validate:resilience-baseline" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:resilience-baseline.")
    if "validate:resilience-baseline" not in scripts["check"]:
        fail("Root check script is missing validate:resilience-baseline.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "resilience-baseline-cockpit.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_101 spec.")

    for token in [
        "validate:resilience-baseline",
        "ci:rehearse-resilience-baseline",
        "ci:verify-resilience-baseline",
        "build_resilience_baseline.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(PARALLEL_GATE_PATH, "resilience-baseline-cockpit.spec.js")
    assert_contains(INDEX_PATH, 'export * from "./resilience-baseline";')
    for token in [
        "BackupSetManifest",
        "OperationalReadinessSnapshot",
        "createBackupSetManifest",
        "validateBackupSetManifest",
        "runRestoreRehearsal",
        "buildRecoveryEvidencePack",
        "compileOperationalReadinessSnapshot",
        "createResilienceBaselineSimulationHarness",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "generates tuple-bound backup manifests with source digest evidence",
        "publishes restore runs that stop at journey-validation-pending without pretending readiness",
        "fails closed on stale rehearsal evidence",
        "fails closed when a required backup manifest is missing",
        "fails closed on tuple drift between evidence and the current publication tuple",
        "blocks readiness when assurance or freeze posture is active",
        "keeps the essential function map and recovery tiers fully covered by backup scopes",
    ]:
        assert_contains(UNIT_TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the resilience baseline simulation harness")

    combined_docs = (
        DESIGN_DOC_PATH.read_text(encoding="utf-8")
        + RULES_DOC_PATH.read_text(encoding="utf-8")
    )
    for marker in [
        "# 101 Backup Restore And Operational Readiness Baseline",
        "# 101 Essential Function Map And Recovery Tiers",
        "OperationalReadinessSnapshot",
        "BackupSetManifest",
        "GAP_RESOLUTION_BACKUP_RUNTIME_PREVIEW_TARGETS",
        "GAP_RUNBOOK_BINDING_PRODUCTION_REHEARSAL_WINDOWS",
    ]:
        if marker not in combined_docs:
            fail(f"Docs lost required marker: {marker}")

    for marker in [
        'data-testid="cockpit-masthead"',
        'data-testid="readiness-summary"',
        'data-testid="filter-scenario"',
        'data-testid="filter-readiness"',
        'data-testid="scenario-grid"',
        'data-testid="scenario-table"',
        'data-testid="manifest-table"',
        'data-testid="essential-function-table"',
        'data-testid="inspector"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_contains(HTML_PATH, marker)

    for probe in [
        "filter behavior and synchronized selection",
        "manifest and essential-function table fallback",
        "keyboard flow",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks and blocker readability",
    ]:
        assert_contains(SPEC_PATH, probe)

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-resilience-baseline")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-resilience-baseline")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-resilience-baseline")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-resilience-baseline")

    print("resilience baseline validated")


if __name__ == "__main__":
    main()
