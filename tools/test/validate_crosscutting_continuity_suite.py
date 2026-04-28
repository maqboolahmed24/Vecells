#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
KERNEL = ROOT / "packages" / "domain-kernel" / "src" / "patient-support-phase2-integration.ts"
SUPPORT_SOURCE = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx"
SUITE_DOC = ROOT / "docs" / "tests" / "224_patient_support_record_artifact_continuity_suite.md"
MATRIX_DOC = ROOT / "docs" / "tests" / "224_patient_support_record_artifact_case_matrix.md"
LAB = ROOT / "docs" / "frontend" / "224_patient_support_continuity_assurance_lab.html"
CASE_MATRIX = ROOT / "data" / "test" / "224_continuity_case_matrix.csv"
EXPECTATIONS = ROOT / "data" / "test" / "224_expected_settlements_and_recoveries.json"
RECORD_CASES = ROOT / "data" / "test" / "224_record_parity_and_visibility_cases.csv"
SUPPORT_CASES = ROOT / "data" / "test" / "224_support_masking_and_fallback_cases.csv"
RESULTS = ROOT / "data" / "test" / "224_suite_results.json"
DEFECT_LOG = ROOT / "data" / "test" / "224_defect_log_and_remediation.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "224_patient_support_record_artifact_continuity.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "seq_224_crosscutting_Playwright_or_other_appropriate_tooling_testing_run_patient_account_support_and_record_artifact_continuity_suites"
PREREQUISITES = [
    "par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces",
    "par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views",
    "par_222_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_masking_read_only_fallback_and_contextual_playbook_panels",
    "seq_223_crosscutting_merge_Playwright_or_other_appropriate_tooling_integrate_patient_account_and_support_surfaces_with_phase2_identity_and_status_models",
]

REQUIRED_FAMILIES = {
    "patient_shell_continuity",
    "support_continuity",
    "patient_support_parity",
    "record_artifact_parity",
    "masking_disclosure_fallback",
    "cross_state_auth_and_recovery",
    "accessibility_resilience",
}

REQUIRED_SCREENSHOTS = {
    "224-patient-home-requests-detail.png",
    "224-patient-more-info-deep-link.png",
    "224-patient-callback-repair.png",
    "224-patient-messages-thread.png",
    "224-patient-request-refresh.png",
    "224-patient-stale-more-info.png",
    "224-support-entry-inbox-ticket.png",
    "224-support-ticket-route-tabs.png",
    "224-support-history-knowledge.png",
    "224-support-observe-only.png",
    "224-support-route-intent-fallback.png",
    "224-support-return-to-inbox.png",
    "224-patient-support-live-parity.png",
    "224-patient-support-repair-parity.png",
    "224-patient-support-provisional-parity.png",
    "224-record-artifact-verified-summary.png",
    "224-record-chart-table-fallback.png",
    "224-record-source-only-handoff.png",
    "224-record-restricted-placeholder.png",
    "224-support-history-summary-first.png",
    "224-support-history-disclosure-widen.png",
    "224-support-knowledge-limited-scope.png",
    "224-support-read-only-artifact.png",
    "224-auth-signed-out-recovery.png",
    "224-auth-identity-hold.png",
    "224-keyboard-core-routes.png",
    "224-reduced-motion-equivalence.png",
    "224-high-zoom-request-detail.png",
    "224-assurance-lab.png",
    "224-assurance-lab-mobile.png",
}

REQUIRED_ARIA = {
    "224-patient-home-aria.json",
    "224-patient-request-detail-aria.json",
    "224-patient-records-aria.json",
    "224-patient-messages-aria.json",
    "224-support-entry-aria.json",
    "224-support-ticket-aria.json",
    "224-support-fallback-aria.json",
    "224-assurance-lab-aria.json",
}

REQUIRED_TRACES = {
    "224-patient-family-trace.zip",
    "224-support-family-trace.zip",
    "224-parity-family-trace.zip",
    "224-record-family-trace.zip",
    "224-masking-family-trace.zip",
    "224-auth-family-trace.zip",
    "224-accessibility-family-trace.zip",
    "224-reduced-motion-trace.zip",
}


def fail(message: str) -> None:
    raise SystemExit(f"[crosscutting-continuity-suite] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> object:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def require_markers(label: str, text: str, markers: set[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for prerequisite in PREREQUISITES:
      if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 224 must be claimed or complete in checklist")


def validate_docs() -> None:
    require_markers(
        "suite doc",
        read(SUITE_DOC),
        {
            "Portal_Support_Continuity_Assurance_Lab",
            "Playwright",
            "same-shell",
            "Demographic evidence",
            "CONT224_001",
            "CONT224_002",
            "mock-now",
        },
    )
    require_markers(
        "matrix doc",
        read(MATRIX_DOC),
        {
            "224_continuity_case_matrix.csv",
            "patient shell continuity",
            "support continuity",
            "record-artifact parity",
            "machine-readable alignment",
        },
    )
    require_markers(
        "lab",
        read(LAB),
        {
            "Portal_Support_Continuity_Assurance_Lab",
            "ScenarioFamilyRail",
            "ContinuityOutcomeGrid",
            "ParityWitnessBoard",
            "FallbackAndRecoveryMatrix",
            "DefectAndRemediationPanel",
            "window.__portalSupportContinuityAssuranceLabData",
        },
    )


def validate_data() -> tuple[list[dict[str, str]], dict[str, object], dict[str, object], dict[str, object]]:
    matrix_rows = csv_rows(CASE_MATRIX)
    if len(matrix_rows) < 28:
        fail("continuity case matrix is unexpectedly small")
    families = {row["scenario_family"] for row in matrix_rows}
    missing_families = REQUIRED_FAMILIES.difference(families)
    if missing_families:
        fail(f"case matrix missing scenario families: {sorted(missing_families)}")

    expectations = load_json(EXPECTATIONS)
    if not isinstance(expectations, dict) or expectations.get("taskId") != TASK:
        fail("expectations file has wrong taskId")
    if expectations.get("visualMode") != "Portal_Support_Continuity_Assurance_Lab":
        fail("expectations visual mode drifted")
    expected_families = expectations.get("familyExpectations", [])
    if len(expected_families) != len(REQUIRED_FAMILIES):
        fail("expectations must cover every required family")

    record_rows = csv_rows(RECORD_CASES)
    support_rows = csv_rows(SUPPORT_CASES)
    if len(record_rows) != 4:
        fail("record parity case subset drifted")
    if len(support_rows) != 4:
        fail("support masking subset drifted")

    defect_log = load_json(DEFECT_LOG)
    if not isinstance(defect_log, dict) or defect_log.get("status") != "resolved":
        fail("defect log must be resolved")
    defects = defect_log.get("defects", [])
    defect_ids = {defect.get("defectId") for defect in defects}
    if defect_ids != {"CONT224_001", "CONT224_002"}:
        fail("defect log must record the two 224 remediation defects")

    results = load_json(RESULTS)
    if not isinstance(results, dict) or results.get("taskId") != TASK:
        fail("results file has wrong taskId")
    if results.get("overallStatus") != "passed":
        fail("overall continuity suite status must be passed")
    if results.get("visualMode") != "Portal_Support_Continuity_Assurance_Lab":
        fail("results visual mode drifted")
    if results.get("statusVocabulary") != ["passed", "failed", "blocked_external", "not_applicable"]:
        fail("results status vocabulary drifted")
    if results.get("repositoryOwnedDefectFinding") != "resolved_in_seq_224":
        fail("results must record resolved repository-owned defects")
    if results.get("fixedDefectIds") != ["CONT224_001", "CONT224_002"]:
        fail("results fixedDefectIds drifted")

    case_results = results.get("caseResults", [])
    if len(case_results) != len(matrix_rows):
        fail("results case count must match continuity matrix")
    result_ids = {row.get("caseId") for row in case_results}
    matrix_ids = {row["case_id"] for row in matrix_rows}
    if result_ids != matrix_ids:
        fail("results case ids do not match matrix case ids")
    if any(row.get("status") != "passed" for row in case_results):
        fail("all 224 case results must be passed")
    for row in case_results:
        if not row.get("actualResult"):
            fail(f"case {row.get('caseId')} is missing actualResult")
        if not row.get("evidencePaths"):
            fail(f"case {row.get('caseId')} is missing evidencePaths")

    status_counts = results.get("statusCounts", {})
    if status_counts.get("passed") != len(matrix_rows) or status_counts.get("failed") != 0:
        fail("status counts drifted from case results")

    family_results = results.get("familyResults", [])
    if len(family_results) != len(REQUIRED_FAMILIES):
        fail("family results must cover every required family")
    family_status = {row.get("family"): row.get("status") for row in family_results}
    if set(family_status) != REQUIRED_FAMILIES:
        fail("family results names drifted")
    if any(status != "passed" for status in family_status.values()):
        fail("every family result must be passed")

    if results.get("externalRequestViolations") != []:
        fail("externalRequestViolations must be empty")

    return matrix_rows, expectations, results, defect_log


def validate_sources() -> None:
    require_markers(
        "kernel",
        read(KERNEL),
        {
            "/ops/support/tickets/:supportTicketId/actions/:actionKey",
            "controlled_resend",
            "repair_required",
        },
    )
    require_markers(
        "support source",
        read(SUPPORT_SOURCE),
        {
            "Demographic evidence",
            "Auth claim",
            "Identity evidence",
            "Patient preference",
            "Support reachability",
        },
    )


def validate_scripts() -> None:
    script_line = '"validate:crosscutting-continuity-suite": "python3 ./tools/test/validate_crosscutting_continuity_suite.py"'
    if script_line not in read(PACKAGE_JSON):
        fail("package.json missing validate:crosscutting-continuity-suite")
    if "validate:crosscutting-continuity-suite" not in read(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing validate:crosscutting-continuity-suite")


def validate_playwright() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        {
            "224_patient_support_record_artifact_continuity",
            "Portal_Support_Continuity_Assurance_Lab",
            "tracing.start",
            "tracing.stop",
            "224-patient-support-repair-parity.png",
            "224-assurance-lab-mobile.png",
            "224-reduced-motion-trace.zip",
            "224_suite_results.json",
        },
    )


def validate_outputs(results: dict[str, object]) -> None:
    for file_name in REQUIRED_SCREENSHOTS | REQUIRED_ARIA | REQUIRED_TRACES:
        if not (OUTPUT_DIR / file_name).exists():
            fail(f"missing Playwright output: output/playwright/{file_name}")

    for collection_key in ("screenshotEvidence", "ariaEvidence", "traceEvidence"):
        collection = results.get(collection_key, [])
        if not isinstance(collection, list) or not collection:
            fail(f"{collection_key} must be a populated list")
        for path_ref in collection:
            path_obj = ROOT / path_ref
            if not path_obj.exists():
                fail(f"results references missing evidence path {path_ref}")


def main() -> None:
    validate_checklist()
    validate_docs()
    matrix_rows, expectations, results, defect_log = validate_data()
    validate_sources()
    validate_scripts()
    validate_playwright()
    validate_outputs(results)
    print("cross-cutting continuity suite validation passed")


if __name__ == "__main__":
    main()
