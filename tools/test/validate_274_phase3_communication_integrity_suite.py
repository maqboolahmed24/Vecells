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

SUITE_DOC_PATH = DOCS_TEST_DIR / "274_phase3_callback_message_reachability_suite.md"
CASE_MATRIX_DOC_PATH = DOCS_TEST_DIR / "274_phase3_communication_case_matrix.md"
LAB_PATH = DOCS_FRONTEND_DIR / "274_communication_repair_integrity_lab.html"

CALLBACK_CASES_PATH = DATA_DIR / "274_callback_cases.csv"
MESSAGE_CASES_PATH = DATA_DIR / "274_message_delivery_cases.csv"
REPAIR_CASES_PATH = DATA_DIR / "274_reachability_repair_cases.csv"
PARITY_CASES_PATH = DATA_DIR / "274_patient_staff_support_parity_cases.csv"
EXPECTATIONS_PATH = DATA_DIR / "274_expected_communication_settlements.json"
RESULTS_PATH = DATA_DIR / "274_suite_results.json"
DEFECT_LOG_PATH = DATA_DIR / "274_defect_log_and_remediation.json"

VALIDATOR_PATH = ROOT / "tools" / "test" / "validate_274_phase3_communication_integrity_suite.py"
SERVICE_TEST_PATH = SERVICE_TEST_DIR / "274_phase3_communication_integrity_assurance.integration.test.js"
PLAYWRIGHT_PATHS = [
    PLAYWRIGHT_DIR / "274_phase3_communication.helpers.ts",
    PLAYWRIGHT_DIR / "274_communication_integrity_multi_actor.spec.ts",
    PLAYWRIGHT_DIR / "274_callback_and_message_visuals.spec.ts",
    PLAYWRIGHT_DIR / "274_reachability_repair_and_support.spec.ts",
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
        CALLBACK_CASES_PATH,
        MESSAGE_CASES_PATH,
        REPAIR_CASES_PATH,
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

    callback_rows = load_csv(CALLBACK_CASES_PATH)
    message_rows = load_csv(MESSAGE_CASES_PATH)
    repair_rows = load_csv(REPAIR_CASES_PATH)
    parity_rows = load_csv(PARITY_CASES_PATH)
    expectations = load_json(EXPECTATIONS_PATH)
    results = load_json(RESULTS_PATH)
    defect_log = load_json(DEFECT_LOG_PATH)

    require(results["taskId"] == "seq_274", "274_RESULTS_TASK_ID_DRIFT")
    require(
        results["visualMode"] == "Communication_Repair_Integrity_Lab",
        "274_RESULTS_VISUAL_MODE_DRIFT",
    )
    require(
        results["suiteVerdict"] == "passed_without_repository_fix",
        "274_RESULTS_VERDICT_DRIFT",
    )
    require(results["summary"]["totalCaseCount"] == 17, "274_TOTAL_CASE_COUNT_DRIFT")
    require(results["summary"]["passedCaseCount"] == 17, "274_PASSED_CASE_COUNT_DRIFT")
    require(results["summary"]["fixedDefectCount"] == 0, "274_FIXED_DEFECT_COUNT_DRIFT")
    require(results["repositoryFixRefs"] == [], "274_REPOSITORY_FIX_REF_DRIFT")

    require(defect_log["taskId"] == "seq_274", "274_DEFECT_LOG_TASK_ID_DRIFT")
    require(
        defect_log["status"] == "no_repository_defect_found",
        "274_DEFECT_LOG_STATUS_DRIFT",
    )
    require(defect_log["defects"] == [], "274_DEFECT_LOG_COUNT_DRIFT")

    require(len(callback_rows) == 6, "274_CALLBACK_CASE_COUNT_DRIFT")
    require(len(message_rows) == 4, "274_MESSAGE_CASE_COUNT_DRIFT")
    require(len(repair_rows) == 4, "274_REPAIR_CASE_COUNT_DRIFT")
    require(len(parity_rows) == 3, "274_PARITY_CASE_COUNT_DRIFT")
    require(
        [row["caseId"] for row in callback_rows]
        == [
            "CIR274_001",
            "CIR274_002",
            "CIR274_003",
            "CIR274_004",
            "CIR274_005",
            "CIR274_006",
        ],
        "274_CALLBACK_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in message_rows]
        == ["CIR274_007", "CIR274_008", "CIR274_009", "CIR274_010"],
        "274_MESSAGE_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in repair_rows]
        == ["CIR274_011", "CIR274_012", "CIR274_013", "CIR274_014"],
        "274_REPAIR_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in parity_rows]
        == ["CIR274_015", "CIR274_016", "CIR274_017"],
        "274_PARITY_CASE_ORDER_DRIFT",
    )
    require(
        {row["actualResult"] for row in callback_rows + message_rows + repair_rows + parity_rows}
        == {"passed"},
        "274_CASE_RESULT_DRIFT",
    )

    require(len(expectations["callbackExpectations"]) == 6, "274_CALLBACK_EXPECTATION_COUNT_DRIFT")
    require(len(expectations["messageExpectations"]) == 4, "274_MESSAGE_EXPECTATION_COUNT_DRIFT")
    require(
        len(expectations["reachabilityRepairExpectations"]) == 4,
        "274_REPAIR_EXPECTATION_COUNT_DRIFT",
    )
    require(len(expectations["parityExpectations"]) == 3, "274_PARITY_EXPECTATION_COUNT_DRIFT")

    for token in [
        "Communication_Repair_Integrity_Lab",
        "callback truth is provable from leases, attempts, outcomes, and resolution gates",
        "support-local provisional work may not calm patient posture",
        "no repository-owned communication defect remained after rerun",
        "validate:274-phase3-communication-integrity-suite",
    ]:
        require(token in suite_doc, f"274_SUITE_DOC_MARKER_MISSING:{token}")

    for token in [
        "`17` explicit case rows",
        "Callback intent and scheduling",
        "Clinician-message delivery and dispute",
        "Reachability repair",
        "Patient, staff, and support parity",
    ]:
        require(token in case_matrix_doc, f"274_CASE_MATRIX_MARKER_MISSING:{token}")

    for token in [
        "Communication_Repair_Integrity_Lab",
        "ScenarioFamilyRail",
        "CallbackLifecycleBoard",
        "MessageDeliveryTruthLadder",
        "ReachabilityRepairWorkbench",
        "ParityAcrossPatientStaffSupport",
        "DefectAndRemediationPanel",
        "callback_pending",
        "callback_no_answer",
        "callback_invalid_route",
        "message_delivered",
        "message_disputed",
        "repair_required",
        "stale_recoverable",
    ]:
        require(token in lab, f"274_LAB_MARKER_MISSING:{token}")

    for token in [
        "CALLBACK_OUTCOME_EVIDENCE_REQUIRED",
        "CALLBACK_VOICEMAIL_POLICY_BLOCKED",
        "provider_failure",
        "route_invalid",
        "MESSAGE_DELIVERY_CONTRADICTION_REQUIRES_DISPUTE",
        "attachment_recovery",
        "bindingState).toBe(\"repair_required\")",
        "manual_handoff_required",
    ]:
        require(token in service_test, f"274_SERVICE_SUITE_MARKER_MISSING:{token}")

    require(
        '"validate:274-phase3-communication-integrity-suite": "python3 ./tools/test/validate_274_phase3_communication_integrity_suite.py"'
        in package_text,
        "274_PACKAGE_SCRIPT_MISSING",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:274-phase3-communication-integrity-suite")
        == "python3 ./tools/test/validate_274_phase3_communication_integrity_suite.py",
        "274_ROOT_SCRIPT_UPDATE_MISSING",
    )

    multi_actor = read_text(PLAYWRIGHT_PATHS[1])
    visual = read_text(PLAYWRIGHT_PATHS[2])
    repair = read_text(PLAYWRIGHT_PATHS[3])

    for token in [
        "openPatientConversationRoute",
        "openSupportRoute",
        "CallbackDetailSurface",
        "PatientResponseThreadPanel",
        "support replay lost the governed communication-recovery posture",
    ]:
        require(token in multi_actor, f"274_MULTI_ACTOR_MARKER_MISSING:{token}")

    for token in [
        "startCommunicationIntegrityLabServer",
        "274-callback-pending.png",
        "274-communication-aria-snapshots.json",
        "CommunicationRepairIntegrityLab",
    ]:
        require(token in visual, f"274_VISUAL_MARKER_MISSING:{token}")

    for token in [
        "CallbackRouteRepairPrompt",
        "Repair workbench",
        "Confirm contact details",
        "Open replay restore",
        "data-contact-repair-state",
    ]:
        require(token in repair, f"274_REPAIR_MARKER_MISSING:{token}")

    print("274 phase3 communication integrity suite artifacts validated")


if __name__ == "__main__":
    main()
