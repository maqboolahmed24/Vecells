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

SUITE_DOC_PATH = DOCS_TEST_DIR / "273_phase3_more_info_resafety_endpoint_approval_suite.md"
CASE_MATRIX_DOC_PATH = DOCS_TEST_DIR / "273_phase3_decision_cycle_case_matrix.md"
LAB_PATH = DOCS_FRONTEND_DIR / "273_decision_cycle_assurance_lab.html"

MORE_INFO_CASES_PATH = DATA_DIR / "273_more_info_checkpoint_cases.csv"
RESAFETY_CASES_PATH = DATA_DIR / "273_resafety_cases.csv"
ENDPOINT_CASES_PATH = DATA_DIR / "273_endpoint_and_approval_cases.csv"
EXPECTATIONS_PATH = DATA_DIR / "273_expected_dispositions_and_settlements.json"
RESULTS_PATH = DATA_DIR / "273_suite_results.json"
DEFECT_LOG_PATH = DATA_DIR / "273_defect_log_and_remediation.json"

VALIDATOR_PATH = ROOT / "tools" / "test" / "validate_273_phase3_decision_cycle_suite.py"
SERVICE_TEST_PATH = SERVICE_TEST_DIR / "273_phase3_decision_cycle_assurance.integration.test.js"
PLAYWRIGHT_PATHS = [
    PLAYWRIGHT_DIR / "273_phase3_decision_cycle.helpers.ts",
    PLAYWRIGHT_DIR / "273_decision_cycle_multi_actor.spec.ts",
    PLAYWRIGHT_DIR / "273_endpoint_and_approval.spec.ts",
    PLAYWRIGHT_DIR / "273_decision_cycle_visual_and_accessibility.spec.ts",
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
        MORE_INFO_CASES_PATH,
        RESAFETY_CASES_PATH,
        ENDPOINT_CASES_PATH,
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

    more_info_rows = load_csv(MORE_INFO_CASES_PATH)
    resafety_rows = load_csv(RESAFETY_CASES_PATH)
    endpoint_rows = load_csv(ENDPOINT_CASES_PATH)
    expectations = load_json(EXPECTATIONS_PATH)
    results = load_json(RESULTS_PATH)
    defect_log = load_json(DEFECT_LOG_PATH)

    require(results["taskId"] == "seq_273", "273_RESULTS_TASK_ID_DRIFT")
    require(results["visualMode"] == "Decision_Cycle_Assurance_Lab", "273_RESULTS_VISUAL_MODE_DRIFT")
    require(results["suiteVerdict"] == "passed_with_repository_fix", "273_RESULTS_VERDICT_DRIFT")
    require(results["summary"]["totalCaseCount"] == 15, "273_TOTAL_CASE_COUNT_DRIFT")
    require(results["summary"]["passedCaseCount"] == 15, "273_PASSED_CASE_COUNT_DRIFT")
    require(results["summary"]["fixedDefectCount"] == 1, "273_FIXED_DEFECT_COUNT_DRIFT")
    require(results["repositoryFixRefs"] == ["DCA273_DEF_001"], "273_REPOSITORY_FIX_REF_DRIFT")

    require(defect_log["taskId"] == "seq_273", "273_DEFECT_LOG_TASK_ID_DRIFT")
    require(len(defect_log["defects"]) == 1, "273_DEFECT_LOG_COUNT_DRIFT")
    defect = defect_log["defects"][0]
    require(defect["defectId"] == "DCA273_DEF_001", "273_DEFECT_ID_DRIFT")
    require(defect["status"] == "fixed", "273_DEFECT_STATUS_DRIFT")
    require(
        defect["fixedIn"]
        == ["/Users/test/Code/V/services/command-api/src/phase3-approval-escalation.ts"],
        "273_DEFECT_FIXED_IN_DRIFT",
    )

    require(len(more_info_rows) == 5, "273_MORE_INFO_CASE_COUNT_DRIFT")
    require(len(resafety_rows) == 4, "273_RESAFETY_CASE_COUNT_DRIFT")
    require(len(endpoint_rows) == 6, "273_ENDPOINT_CASE_COUNT_DRIFT")
    require(
        [row["caseId"] for row in more_info_rows]
        == ["DCA273_001", "DCA273_002", "DCA273_003", "DCA273_004", "DCA273_005"],
        "273_MORE_INFO_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in resafety_rows]
        == ["DCA273_006", "DCA273_007", "DCA273_008", "DCA273_009"],
        "273_RESAFETY_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in endpoint_rows]
        == ["DCA273_010", "DCA273_011", "DCA273_012", "DCA273_013", "DCA273_014", "DCA273_015"],
        "273_ENDPOINT_CASE_ORDER_DRIFT",
    )
    require(
        {row["actualResult"] for row in more_info_rows + resafety_rows + endpoint_rows} == {"passed"},
        "273_CASE_RESULT_DRIFT",
    )

    require(len(expectations["moreInfoExpectations"]) == 5, "273_MORE_INFO_EXPECTATION_COUNT_DRIFT")
    require(len(expectations["resafetyExpectations"]) == 4, "273_RESAFETY_EXPECTATION_COUNT_DRIFT")
    require(
        len(expectations["endpointAndApprovalExpectations"]) == 6,
        "273_ENDPOINT_EXPECTATION_COUNT_DRIFT",
    )
    require(
        expectations["endpointAndApprovalExpectations"][4]["expectedRemediationRef"] == "DCA273_DEF_001",
        "273_REMEDIATION_EXPECTATION_DRIFT",
    )

    for token in [
        "Decision_Cycle_Assurance_Lab",
        "more-info loop is provably governed",
        "DecisionEpoch and EndpointDecisionBinding",
        "repository now fixes it",
        "validate:273-phase3-decision-cycle-suite",
    ]:
        require(token in suite_doc, f"273_SUITE_DOC_MARKER_MISSING:{token}")

    for token in [
        "`15` explicit case rows",
        "More-Info Checkpoint And Reminder",
        "Delta And Re-Safety",
        "Endpoint Decision, Approval, And Escalation",
        "DCA273_DEF_001",
    ]:
        require(token in case_matrix_doc, f"273_CASE_MATRIX_MARKER_MISSING:{token}")

    for token in [
        "Decision_Cycle_Assurance_Lab",
        "ScenarioFamilyRail",
        "PatientReplyWindowBoard",
        "DeltaAndResafetyInspector",
        "EndpointAuthorityRail",
        "ApprovalAndEscalationLedger",
        "DefectAndRemediationPanel",
        "active_checkpoint",
        "late_review",
        "expired_window",
        "superseded_cycle",
        "blocked_repair",
        "approval_required",
        "urgent_escalation",
        "DCA273_DEF_001",
    ]:
        require(token in lab, f"273_LAB_MARKER_MISSING:{token}")

    for token in [
        "accepted_late_review",
        "superseded_duplicate",
        "expired_rejected",
        "blocked_repair",
        "MORE_INFO_TASK_CYCLE_MISMATCH",
        "ENDPOINT_PAYLOAD_MINIMUM_NOT_MET",
        "blocked_approval_gate",
        "SELF_APPROVAL_BLOCKED",
        "APPROVER_ROLE_REQUIRED",
        "STALE_ESCALATION_EPOCH",
    ]:
        require(token in service_test, f"273_SERVICE_SUITE_MARKER_MISSING:{token}")

    require(
        '"validate:273-phase3-decision-cycle-suite": "python3 ./tools/test/validate_273_phase3_decision_cycle_suite.py"'
        in package_text,
        "273_PACKAGE_SCRIPT_MISSING",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:273-phase3-decision-cycle-suite")
        == "python3 ./tools/test/validate_273_phase3_decision_cycle_suite.py",
        "273_ROOT_SCRIPT_UPDATE_MISSING",
    )

    multi_actor = read_text(PLAYWRIGHT_PATHS[1])
    endpoint_ui = read_text(PLAYWRIGHT_PATHS[2])
    visual = read_text(PLAYWRIGHT_PATHS[3])

    for token in [
        "openPatientConversationRoute",
        "openStaffMoreInfoRoute",
        "ApprovalReviewStage",
        "PatientConversationRoute",
        "ProtectedCompositionFreezeFrame",
    ]:
        require(token in multi_actor, f"273_MULTI_ACTOR_MARKER_MISSING:{token}")

    for token in [
        "PatientMoreInfoReplySurface",
        "EndpointReasoningStage",
        "ApprovalReviewStage",
        "EscalationCommandSurface",
        "SELF_APPROVAL_BLOCKED",
    ]:
        require(token in endpoint_ui, f"273_ENDPOINT_UI_MARKER_MISSING:{token}")

    for token in [
        "startDecisionCycleLabServer",
        "273-active-checkpoint.png",
        "273-decision-cycle-aria-snapshots.json",
        "DecisionCycleAssuranceLab",
    ]:
        require(token in visual, f"273_VISUAL_MARKER_MISSING:{token}")

    print("273 phase3 decision-cycle suite artifacts validated")


if __name__ == "__main__":
    main()
