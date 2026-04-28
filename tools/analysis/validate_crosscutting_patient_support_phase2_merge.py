#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
KERNEL = ROOT / "packages" / "domain-kernel" / "src" / "patient-support-phase2-integration.ts"
PATIENT_HOME = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx"
PATIENT_WORKFLOW = ROOT / "apps" / "patient-web" / "src" / "patient-more-info-callback-contact-repair.tsx"
PATIENT_RECORDS = ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.tsx"
PATIENT_AUTH = ROOT / "apps" / "patient-web" / "src" / "auth-callback-recovery.tsx"
PATIENT_CLAIM = ROOT / "apps" / "patient-web" / "src" / "claim-resume-identity-hold.tsx"
PATIENT_BRIDGE = ROOT / "apps" / "patient-web" / "src" / "patient-support-phase2-bridge.tsx"
PATIENT_BRIDGE_CSS = ROOT / "apps" / "patient-web" / "src" / "patient-support-phase2-bridge.css"
SUPPORT_SOURCE = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx"
ARCH_DOC = ROOT / "docs" / "architecture" / "223_crosscutting_patient_support_phase2_integration.md"
SECURITY_DOC = ROOT / "docs" / "security" / "223_identity_status_and_masking_merge_rules.md"
TEST_DOC = ROOT / "docs" / "tests" / "223_patient_support_integration_matrix.md"
LAB = ROOT / "docs" / "frontend" / "223_patient_support_identity_status_integration_lab.html"
CONTRACT = ROOT / "data" / "contracts" / "223_crosscutting_identity_status_surface_bundle.json"
PARITY_MATRIX = ROOT / "data" / "analysis" / "223_patient_support_status_parity_matrix.csv"
RECOVERY_CASES = ROOT / "data" / "analysis" / "223_cross_route_recovery_and_read_only_cases.json"
MERGE_GAP = ROOT / "data" / "analysis" / "223_merge_gap_log.json"
SUPPORT_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "223_patient_support_identity_status_integration.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "seq_223_crosscutting_merge_Playwright_or_other_appropriate_tooling_integrate_patient_account_and_support_surfaces_with_phase2_identity_and_status_models"
PREREQUISITES = [
    "par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces",
    "par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views",
    "par_222_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_masking_read_only_fallback_and_contextual_playbook_panels",
]

REQUIRED_SCREENSHOTS = {
    "223-patient-request-parity.png",
    "223-patient-repair-parity.png",
    "223-patient-record-step-up.png",
    "223-auth-signed-out-parity.png",
    "223-claim-identity-hold-parity.png",
    "223-support-ticket-parity.png",
    "223-support-history-parity.png",
    "223-support-replay-read-only.png",
    "223-integration-lab.png",
    "223-integration-lab-mobile.png",
    "223-reduced-motion-parity.png",
}

REQUIRED_ARIA_FILES = {
    "223-patient-request-aria.json",
    "223-support-ticket-aria.json",
    "223-integration-lab-aria.json",
}


def fail(message: str) -> None:
    raise SystemExit(f"[crosscutting-patient-support-phase2-merge] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


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
        fail("task 223 is not claimed or complete in checklist")


def validate_sources() -> None:
    require_markers(
        "shared kernel",
        read(KERNEL),
        {
            "PatientSupportPhase2TruthKernel",
            "Portal_Support_Identity_Status_Integration_Lab",
            "request_211_a",
            "lineage_211_a",
            "support_ticket_218_delivery_failure",
            "repair_required",
            "read_only_recovery",
        },
    )
    require_markers(
        "patient bridge",
        read(PATIENT_BRIDGE),
        {
            "PatientSupportPhase2Bridge",
            "PatientSupportContactDomains",
            "Auth claim",
            "Identity evidence",
            "Patient preference",
            "Support reachability",
        },
    )
    require_markers(
        "patient bridge css",
        read(PATIENT_BRIDGE_CSS),
        {
            ".patient-phase2-bridge",
            ".patient-phase2-bridge__domains",
        },
    )
    for label, path in (
        ("patient home", PATIENT_HOME),
        ("patient workflow", PATIENT_WORKFLOW),
        ("patient records", PATIENT_RECORDS),
        ("patient auth", PATIENT_AUTH),
        ("patient claim", PATIENT_CLAIM),
    ):
        require_markers(
            label,
            read(path),
            {
                "resolvePortalSupportPhase2Context",
                "PatientSupportPhase2Bridge",
                "data-truth-kernel",
                "data-shared-request-ref",
                "data-cause-class",
                "data-canonical-status-label",
            },
        )
    require_markers(
        "support source",
        read(SUPPORT_SOURCE),
        {
            "resolvePortalSupportPhase2Context",
            "phase2Context",
            "data-truth-kernel",
            "data-shared-request-ref",
            "Canonical status",
            "Patient next action",
            "Auth claim",
            "Support reachability",
        },
    )


def validate_docs() -> None:
    require_markers(
        "architecture doc",
        read(ARCH_DOC),
        {
            "PatientSupportPhase2TruthKernel",
            "request_211_a",
            "lineage_211_a",
            "support_ticket_218_delivery_failure",
            "repair_required",
            "read_only_recovery",
            "Playwright proves",
        },
    )
    require_markers(
        "security doc",
        read(SECURITY_DOC),
        {
            "Auth claim",
            "Identity evidence",
            "Demographic evidence",
            "Patient preference",
            "Support reachability",
            "read_only_recovery",
        },
    )
    require_markers(
        "test doc",
        read(TEST_DOC),
        {
            "223-patient-request-parity.png",
            "223-support-replay-read-only.png",
            "step_up_required",
            "session_recovery_required",
        },
    )
    require_markers(
        "lab",
        read(LAB),
        {
            "Portal_Support_Identity_Status_Integration_Lab",
            "RouteFamilyParityMap",
            "IdentityStatusCauseLadder",
            "PatientSupportRecoveryMatrix",
            "MaskingAndRestrictionParityTable",
            "SeamResolutionPanel",
            "window.__portalSupportIdentityStatusIntegrationLabData",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Portal_Support_Identity_Status_Integration_Lab":
        fail("contract visualMode drifted")
    if contract.get("truthKernel") != "PatientSupportPhase2TruthKernel":
        fail("contract truthKernel drifted")
    if len(contract.get("routeSurfaces", [])) < 16:
        fail("contract route surface count drifted")
    contact_domains = contract.get("contactDomains", {})
    for key in (
        "authClaim",
        "identityEvidence",
        "demographicEvidence",
        "communicationPreference",
        "supportReachability",
    ):
        if key not in contact_domains:
            fail(f"contract missing contact domain: {key}")

    with PARITY_MATRIX.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 10:
        fail("parity matrix is unexpectedly small")
    status_labels = {row["canonical_status_label"] for row in rows}
    if "Reply needed" not in status_labels or "Read-only recovery" not in status_labels:
        fail("parity matrix missing expected canonical status labels")

    recovery_cases = json.loads(read(RECOVERY_CASES))
    if len(recovery_cases.get("cases", [])) < 6:
        fail("cross-route recovery case coverage is unexpectedly small")

    merge_gap = json.loads(read(MERGE_GAP))
    if merge_gap.get("openGaps") != []:
        fail("merge gap log still reports open gaps")
    if len(merge_gap.get("resolvedSeams", [])) < 3:
        fail("merge gap log is missing resolved seams")

    support_gap = json.loads(read(SUPPORT_GAP))
    if support_gap.get("par223IntegrationStatus") != "resolved_for_patient_support_phase2_identity_status_merge":
        fail("support gap artifact missing 223 integration status")


def validate_scripts() -> None:
    script_line = '"validate:crosscutting-patient-support-phase2-merge": "python3 ./tools/analysis/validate_crosscutting_patient_support_phase2_merge.py"'
    if script_line not in read(ROOT_PACKAGE):
        fail("package.json missing validate:crosscutting-patient-support-phase2-merge script")
    if "validate:crosscutting-patient-support-phase2-merge" not in read(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing validate:crosscutting-patient-support-phase2-merge")


def validate_playwright() -> None:
    require_markers(
        "playwright spec",
        read(PLAYWRIGHT_SPEC),
        {
            "223_patient_support_identity_status_integration",
            "PatientSupportPhase2Bridge",
            "data-canonical-status-label",
            "223-integration-lab.png",
            "223-support-ticket-parity.png",
            "223-patient-request-parity.png",
            "RouteFamilyParityMap",
            "IdentityStatusCauseLadder",
        },
    )
    for file_name in REQUIRED_SCREENSHOTS | REQUIRED_ARIA_FILES:
        if not (OUTPUT_DIR / file_name).exists():
            fail(f"missing Playwright output: output/playwright/{file_name}")


def main() -> None:
    validate_checklist()
    validate_sources()
    validate_docs()
    validate_contract_and_analysis()
    validate_scripts()
    validate_playwright()
    print("crosscutting patient/support Phase 2 merge validation passed")


if __name__ == "__main__":
    main()
