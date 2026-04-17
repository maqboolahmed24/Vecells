#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_DIR = ROOT / "docs" / "tests"
DATA_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

SUITE_DOC_PATH = DOCS_DIR / "137_release_restore_canary_rehearsal_suite.md"
TRUTH_MATRIX_DOC_PATH = DOCS_DIR / "137_release_watch_and_recovery_truth_matrix.md"
COCKPIT_PATH = DOCS_DIR / "137_release_rehearsal_cockpit.html"

REHEARSAL_CASES_PATH = DATA_DIR / "137_rehearsal_cases.csv"
WAVE_CASES_PATH = DATA_DIR / "137_wave_observation_cases.csv"
RESTORE_CASES_PATH = DATA_DIR / "137_restore_readiness_cases.csv"
EXPECTATIONS_PATH = DATA_DIR / "137_release_rehearsal_expectations.json"
RESULTS_PATH = DATA_DIR / "137_rehearsal_results.json"

SPEC_PATH = PLAYWRIGHT_DIR / "137_release_rehearsal_cockpit.spec.js"
NODE_TEST_PATH = ROOT / "infra" / "preview-environments" / "tests" / "release-restore-canary-rehearsal-suite.test.mjs"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_release_restore_canary_rehearsal_suite.py"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

REQUIRED_MAIN_CASE_IDS = [
    "PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT",
    "LOCAL_RELEASE_FREEZE_PARTIAL_GATEWAY_SURFACES",
    "PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION",
    "LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION",
    "LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION",
    "CI_PREVIEW_PAUSE_ON_CONSTRAINED_GUARDRAIL",
    "INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH",
    "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    "LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK",
    "INTEGRATION_RESTORE_BLOCKED_PROOF_PREVENTS_CONTROL",
    "PREPROD_TUPLE_DRIFT_KEEPS_RECOVERY_WITHHELD",
]

REQUIRED_WAVE_CASE_IDS = [
    "LOCAL_CANARY_START_HAPPY_PATH",
    "LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION",
    "CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL",
    "INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH",
    "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    "LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE",
]

REQUIRED_RESTORE_CASE_IDS = [
    "LOCAL_EXACT_READY",
    "LOCAL_STALE_REHEARSAL",
    "CI_PREVIEW_MISSING_BACKUP_MANIFEST",
    "INTEGRATION_BLOCKED_RESTORE_PROOF",
    "PREPROD_TUPLE_DRIFT",
    "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
]

REQUIRED_SPECS = [
    "preview-environment-control-room.spec.js",
    "release-candidate-freeze-board.spec.js",
    "release-watch-pipeline-cockpit.spec.js",
    "resilience-baseline-cockpit.spec.js",
    "canary-and-rollback-cockpit.spec.js",
]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_137 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        SUITE_DOC_PATH,
        TRUTH_MATRIX_DOC_PATH,
        COCKPIT_PATH,
        REHEARSAL_CASES_PATH,
        WAVE_CASES_PATH,
        RESTORE_CASES_PATH,
        EXPECTATIONS_PATH,
        RESULTS_PATH,
        SPEC_PATH,
        NODE_TEST_PATH,
        BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    rehearsal_cases = read_csv(REHEARSAL_CASES_PATH)
    wave_cases = read_csv(WAVE_CASES_PATH)
    restore_cases = read_csv(RESTORE_CASES_PATH)
    expectations = read_json(EXPECTATIONS_PATH)
    results = read_json(RESULTS_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if results["task_id"] != "seq_137":
        fail("seq_137 results drifted off task id.")
    if results["visual_mode"] != "Release_Rehearsal_Cockpit":
        fail("seq_137 visual mode drifted.")
    if results["suiteVerdict"] != "rehearsal_exact_live_withheld":
        fail("seq_137 suite verdict drifted.")
    if expectations["task_id"] != "seq_137":
        fail("seq_137 expectations drifted off task id.")

    summary = results["summary"]
    if summary["rehearsal_case_count"] != len(rehearsal_cases):
        fail("Rehearsal case count drifted.")
    if summary["wave_observation_case_count"] != len(wave_cases):
        fail("Wave observation case count drifted.")
    if summary["restore_readiness_case_count"] != len(restore_cases):
        fail("Restore readiness case count drifted.")
    if summary["rehearsal_case_count"] != 11:
        fail("seq_137 must publish 11 rehearsal cases.")
    if summary["wave_observation_case_count"] != 6:
        fail("seq_137 must publish 6 wave observation cases.")
    if summary["restore_readiness_case_count"] != 6:
        fail("seq_137 must publish 6 restore readiness cases.")

    if summary["applied_allowed_case_count"] != 0:
        fail("seq_137 must keep applied success impossible under the current Phase 0 ceiling.")
    if summary["live_control_reopened_count"] != 0:
        fail("seq_137 must keep live control reopening at zero.")
    if summary["preview_live_advertisement_count"] != 0:
        fail("seq_137 must keep preview live advertisement at zero.")

    if [row["caseId"] for row in rehearsal_cases] != REQUIRED_MAIN_CASE_IDS:
        fail("seq_137 main case order drifted.")
    if [row["observationCaseId"] for row in wave_cases] != REQUIRED_WAVE_CASE_IDS:
        fail("seq_137 wave case order drifted.")
    if [row["restoreCaseId"] for row in restore_cases] != REQUIRED_RESTORE_CASE_IDS:
        fail("seq_137 restore case order drifted.")

    preview_case = next(
        row for row in rehearsal_cases if row["caseId"] == "PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT"
    )
    if preview_case["outcomeState"] != "withheld":
        fail("Preview tuple case must remain withheld.")
    if preview_case["allowedShellPostureAfter"] != "preview_banner_only":
        fail("Preview tuple case lost preview-banner-only posture.")

    start_case = next(
        row
        for row in rehearsal_cases
        if row["caseId"] == "LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION"
    )
    if start_case["outcomeState"] != "accepted_pending_observation":
        fail("Canary start case lost accepted-pending-observation truth.")

    widen_case = next(
        row
        for row in rehearsal_cases
        if row["caseId"] == "LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION"
    )
    if widen_case["outcomeState"] != "satisfied_but_live_withheld":
        fail("Widen case must stay satisfied-but-live-withheld.")

    rollback_case = next(
        row
        for row in rehearsal_cases
        if row["caseId"] == "INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH"
    )
    if rollback_case["outcomeState"] != "rollback_required":
        fail("Rollback case lost rollback_required truth.")

    kill_switch_case = next(
        row
        for row in rehearsal_cases
        if row["caseId"] == "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE"
    )
    if kill_switch_case["interactiveControlState"] != "suppressed":
        fail("Kill-switch case must suppress interactive controls.")

    local_restore = next(row for row in restore_cases if row["restoreCaseId"] == "LOCAL_EXACT_READY")
    if local_restore["liveAuthorityRestored"] != "no":
        fail("Local exact ready restore must not reopen live authority.")

    blocked_restore = next(
        row for row in restore_cases if row["restoreCaseId"] == "INTEGRATION_BLOCKED_RESTORE_PROOF"
    )
    if blocked_restore["recoveryControlPosture"] != "restore_blocked":
        fail("Integration blocked restore lost restore_blocked posture.")

    tuple_drift_restore = next(
        row for row in restore_cases if row["restoreCaseId"] == "PREPROD_TUPLE_DRIFT"
    )
    if tuple_drift_restore["recoveryControlPosture"] != "tuple_drift_recovery_only":
        fail("Preprod tuple drift lost tuple-drift recovery posture.")

    if any(row["appliedAllowed"] != "no" for row in wave_cases):
        fail("Wave observation cases must keep appliedAllowed at no.")
    if not any(row["settlementState"] == "rollback_required" for row in wave_cases):
        fail("Wave observation cases lost rollback_required settlement coverage.")

    if expectations["required_case_ids"] != REQUIRED_MAIN_CASE_IDS:
        fail("Expectations main case ids drifted.")
    if expectations["required_wave_observation_case_ids"] != REQUIRED_WAVE_CASE_IDS:
        fail("Expectations wave case ids drifted.")
    if expectations["required_restore_case_ids"] != REQUIRED_RESTORE_CASE_IDS:
        fail("Expectations restore case ids drifted.")
    if expectations["orchestrated_spec_refs"] != REQUIRED_SPECS:
        fail("Expectations orchestrated spec refs drifted.")

    assert_contains(SUITE_DOC_PATH, "Current suite verdict: `rehearsal_exact_live_withheld`")
    assert_contains(TRUTH_MATRIX_DOC_PATH, "Restore is not complete when data loads")
    assert_contains(COCKPIT_PATH, 'data-testid="release-rehearsal-cockpit"')
    assert_contains(COCKPIT_PATH, 'data-testid="cockpit-masthead"')
    assert_contains(COCKPIT_PATH, 'data-testid="tuple-hash-badge"')
    assert_contains(COCKPIT_PATH, 'data-testid="blocked-action-count"')
    assert_contains(COCKPIT_PATH, 'data-testid="wave-ladder"')
    assert_contains(COCKPIT_PATH, 'data-testid="observation-window-chart"')
    assert_contains(COCKPIT_PATH, 'data-testid="restore-timeline"')
    assert_contains(COCKPIT_PATH, 'data-testid="freeze-trust-ribbon"')
    assert_contains(COCKPIT_PATH, 'data-testid="action-results-table"')
    assert_contains(COCKPIT_PATH, 'data-testid="restore-readiness-table"')
    assert_contains(COCKPIT_PATH, 'data-testid="inspector-settlement-chain"')
    assert_contains(COCKPIT_PATH, "prefers-reduced-motion: reduce")
    assert_contains(COCKPIT_PATH, "renderObservation")
    assert_contains(COCKPIT_PATH, "renderRestore")
    assert_contains(COCKPIT_PATH, "renderWave")

    for fragment in [
        "freeze-state suppression of interactive controls",
        "canary start/widen/rollback state transitions",
        "restore timeline rendering and readiness gating",
        "runChildSpec",
        "release-candidate-freeze-board.spec.js",
        "canary-and-rollback-cockpit.spec.js",
    ]:
        assert_contains(SPEC_PATH, fragment)
    assert_contains(NODE_TEST_PATH, "seq_137")

    expected_validate_script = "python3 ./tools/test/validate_release_restore_canary_rehearsal.py"
    if root_package["scripts"].get("validate:release-restore-canary-rehearsal") != expected_validate_script:
        fail("Root package lost validate:release-restore-canary-rehearsal.")
    if ROOT_SCRIPT_UPDATES.get("validate:release-restore-canary-rehearsal") != expected_validate_script:
        fail("root_script_updates.py lost validate:release-restore-canary-rehearsal.")

    builder_fragment = "python3 ./tools/analysis/build_release_restore_canary_rehearsal_suite.py"
    if builder_fragment not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost the seq_137 builder.")
    if builder_fragment not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("root_script_updates.py codegen lost the seq_137 builder.")

    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:release-restore-canary-rehearsal" not in root_package["scripts"][script_name]:
            fail(f"Root package {script_name} lost seq_137 validation.")
        if "pnpm validate:release-restore-canary-rehearsal" not in ROOT_SCRIPT_UPDATES[script_name]:
            fail(f"root_script_updates.py {script_name} lost seq_137 validation.")

    needle = "137_release_rehearsal_cockpit.spec.js"
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if needle not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package {script_name} lost {needle}.")

    print(
        json.dumps(
            {
                "task_id": "seq_137",
                "rehearsal_cases": summary["rehearsal_case_count"],
                "blocked_actions": summary["blocked_action_count"],
                "applied_allowed_case_count": summary["applied_allowed_case_count"],
                "live_control_reopened_count": summary["live_control_reopened_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
