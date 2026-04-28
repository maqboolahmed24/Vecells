#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_TEST_DIR = ROOT / "docs" / "tests"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
DATA_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
SERVICE_TEST_DIR = ROOT / "services" / "command-api" / "tests"

SUITE_DOC_PATH = DOCS_TEST_DIR / "275_phase3_self_care_admin_reopen_suite.md"
CASE_MATRIX_DOC_PATH = DOCS_TEST_DIR / "275_phase3_boundary_and_reopen_case_matrix.md"
LAB_PATH = DOCS_FRONTEND_DIR / "275_boundary_reopen_assurance_lab.html"

BOUNDARY_CASES_PATH = DATA_DIR / "275_boundary_classification_cases.csv"
ADMIN_CASES_PATH = DATA_DIR / "275_admin_waiting_and_completion_cases.csv"
DEPENDENCY_CASES_PATH = DATA_DIR / "275_dependency_and_reopen_cases.csv"
PARITY_CASES_PATH = DATA_DIR / "275_patient_staff_parity_cases.csv"
EXPECTATIONS_PATH = DATA_DIR / "275_expected_boundary_and_settlement_outputs.json"
RESULTS_PATH = DATA_DIR / "275_suite_results.json"
DEFECT_LOG_PATH = DATA_DIR / "275_defect_log_and_remediation.json"

VALIDATOR_PATH = ROOT / "tools" / "test" / "validate_275_phase3_boundary_reopen_suite.py"
SERVICE_TEST_PATH = SERVICE_TEST_DIR / "275_phase3_boundary_reopen_assurance.integration.test.js"
PLAYWRIGHT_PATHS = [
    PLAYWRIGHT_DIR / "275_phase3_boundary.helpers.ts",
    PLAYWRIGHT_DIR / "275_boundary_and_admin_multi_actor.spec.ts",
    PLAYWRIGHT_DIR / "275_boundary_reopen_visuals.spec.ts",
    PLAYWRIGHT_DIR / "275_dependency_and_completion_artifact.spec.ts",
]
PACKAGE_PATH = ROOT / "package.json"


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        SUITE_DOC_PATH,
        CASE_MATRIX_DOC_PATH,
        LAB_PATH,
        BOUNDARY_CASES_PATH,
        ADMIN_CASES_PATH,
        DEPENDENCY_CASES_PATH,
        PARITY_CASES_PATH,
        EXPECTATIONS_PATH,
        RESULTS_PATH,
        DEFECT_LOG_PATH,
        VALIDATOR_PATH,
        SERVICE_TEST_PATH,
        PACKAGE_PATH,
    ] + PLAYWRIGHT_PATHS:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    suite_doc = read_text(SUITE_DOC_PATH)
    case_matrix_doc = read_text(CASE_MATRIX_DOC_PATH)
    lab = read_text(LAB_PATH)
    service_test = read_text(SERVICE_TEST_PATH)
    package_text = read_text(PACKAGE_PATH)

    boundary_rows = load_csv(BOUNDARY_CASES_PATH)
    admin_rows = load_csv(ADMIN_CASES_PATH)
    dependency_rows = load_csv(DEPENDENCY_CASES_PATH)
    parity_rows = load_csv(PARITY_CASES_PATH)
    expectations = load_json(EXPECTATIONS_PATH)
    results = load_json(RESULTS_PATH)
    defect_log = load_json(DEFECT_LOG_PATH)

    require(results["taskId"] == "seq_275", "275_RESULTS_TASK_ID_DRIFT")
    require(
        results["visualMode"] == "Boundary_Reopen_Assurance_Lab",
        "275_RESULTS_VISUAL_MODE_DRIFT",
    )
    require(
        results["suiteVerdict"] == "passed_without_repository_fix",
        "275_RESULTS_VERDICT_DRIFT",
    )
    require(results["summary"]["totalCaseCount"] == 16, "275_TOTAL_CASE_COUNT_DRIFT")
    require(results["summary"]["passedCaseCount"] == 16, "275_PASSED_CASE_COUNT_DRIFT")
    require(results["summary"]["fixedDefectCount"] == 0, "275_FIXED_DEFECT_COUNT_DRIFT")
    require(results["repositoryFixRefs"] == [], "275_REPOSITORY_FIX_REF_DRIFT")

    require(defect_log["taskId"] == "seq_275", "275_DEFECT_LOG_TASK_ID_DRIFT")
    require(
        defect_log["status"] == "no_repository_defect_found",
        "275_DEFECT_LOG_STATUS_DRIFT",
    )
    require(defect_log["defects"] == [], "275_DEFECT_LOG_COUNT_DRIFT")

    require(len(boundary_rows) == 5, "275_BOUNDARY_CASE_COUNT_DRIFT")
    require(len(admin_rows) == 4, "275_ADMIN_CASE_COUNT_DRIFT")
    require(len(dependency_rows) == 4, "275_DEPENDENCY_CASE_COUNT_DRIFT")
    require(len(parity_rows) == 3, "275_PARITY_CASE_COUNT_DRIFT")
    require(
        [row["caseId"] for row in boundary_rows]
        == [
            "BAR275_001",
            "BAR275_002",
            "BAR275_003",
            "BAR275_004",
            "BAR275_005",
        ],
        "275_BOUNDARY_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in admin_rows]
        == ["BAR275_006", "BAR275_007", "BAR275_008", "BAR275_009"],
        "275_ADMIN_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in dependency_rows]
        == ["BAR275_010", "BAR275_011", "BAR275_012", "BAR275_013"],
        "275_DEPENDENCY_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in parity_rows]
        == ["BAR275_014", "BAR275_015", "BAR275_016"],
        "275_PARITY_CASE_ORDER_DRIFT",
    )
    require(
        {row["actualResult"] for row in boundary_rows + admin_rows + dependency_rows + parity_rows}
        == {"passed"},
        "275_CASE_RESULT_DRIFT",
    )

    require(len(expectations["boundaryExpectations"]) == 5, "275_BOUNDARY_EXPECTATION_COUNT_DRIFT")
    require(
        len(expectations["adminAndWaitingExpectations"]) == 4,
        "275_ADMIN_EXPECTATION_COUNT_DRIFT",
    )
    require(
        len(expectations["dependencyAndReopenExpectations"]) == 4,
        "275_DEPENDENCY_EXPECTATION_COUNT_DRIFT",
    )
    require(len(expectations["parityExpectations"]) == 3, "275_PARITY_EXPECTATION_COUNT_DRIFT")

    for token in [
        "Boundary_Reopen_Assurance_Lab",
        "self-care and bounded admin-resolution remain separated by the canonical boundary decision",
        "bounded admin waiting and completion remain typed, artifact-bound, and blocker-aware",
        "no repository-owned consequence defect remained after rerun",
        "validate:275-phase3-boundary-reopen-suite",
    ]:
        require(token in suite_doc, f"275_SUITE_DOC_MARKER_MISSING:{token}")

    for token in [
        "`16` explicit case rows",
        "Boundary classification",
        "Advice render, waiting, and completion artifacts",
        "Dependency, release-watch, and reopen",
        "Patient, staff, and support parity",
    ]:
        require(token in case_matrix_doc, f"275_CASE_MATRIX_MARKER_MISSING:{token}")

    for token in [
        "Boundary_Reopen_Assurance_Lab",
        "ScenarioFamilyRail",
        "BoundaryDecisionBoard",
        "DependencyAndBlockerMatrix",
        "CompletionArtifactInspector",
        "ReopenTriggerLedger",
        "ParityAcrossPatientStaffSupport",
        "DefectAndRemediationPanel",
        "self_care_live",
        "admin_waiting_dependency",
        "admin_completed_artifact",
        "stale_epoch_freeze",
        "release_watch_quarantined",
        "reopened_boundary",
    ]:
        require(token in lab, f"275_LAB_MARKER_MISSING:{token}")

    for token in [
        "task_reopened_requires_clinician_review",
        "release_trust_quarantined",
        "ADMIN_RESOLUTION_COMPLETION_ARTIFACT_REQUIRED",
        "blocked_pending_identity",
        "admin_resolution_manual_reopen_requested",
        "reopen_required",
    ]:
        require(token in service_test, f"275_SERVICE_SUITE_MARKER_MISSING:{token}")

    require(
        '"validate:275-phase3-boundary-reopen-suite": "python3 ./tools/test/validate_275_phase3_boundary_reopen_suite.py"'
        in package_text,
        "275_PACKAGE_SCRIPT_MISSING",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:275-phase3-boundary-reopen-suite")
        == "python3 ./tools/test/validate_275_phase3_boundary_reopen_suite.py",
        "275_ROOT_SCRIPT_UPDATE_MISSING",
    )

    helper = read_text(PLAYWRIGHT_PATHS[0])
    multi_actor = read_text(PLAYWRIGHT_PATHS[1])
    visual = read_text(PLAYWRIGHT_PATHS[2])
    dependency = read_text(PLAYWRIGHT_PATHS[3])

    for token in [
        "startBoundaryReopenLabServer",
        "openBoundaryReopenScenario",
        "selectConsequenceRow",
        "writeBoundaryAriaSnapshots",
    ]:
        require(token in helper, f"275_HELPER_MARKER_MISSING:{token}")

    for token in [
        "admin_waiting_dependency",
        "admin_completed_artifact",
        "reopened_boundary",
        "ParityAcrossPatientStaffSupport",
        "Support sees the prior artifact as provenance only and may not mark the case calm-success.",
    ]:
        require(token in multi_actor, f"275_MULTI_ACTOR_MARKER_MISSING:{token}")

    for token in [
        "275-lab-self-care-live.png",
        "275-route-admin-completed.png",
        "275-boundary-reopen-aria-snapshots.json",
        "BoundaryReopenAssuranceLab",
    ]:
        require(token in visual, f"275_VISUAL_MARKER_MISSING:{token}")

    for token in [
        "Self-care confirmation draft",
        "admin_resolution_completion_artifact::task-208::document-issued",
        "reopen_required",
        "stale_recoverable",
    ]:
        require(token in dependency, f"275_DEPENDENCY_MARKER_MISSING:{token}")

    print("275 phase3 boundary reopen suite artifacts validated")


if __name__ == "__main__":
    main()
