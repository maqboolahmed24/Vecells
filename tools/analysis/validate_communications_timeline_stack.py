#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
SOURCE = ROOT / "services" / "command-api" / "src" / "authenticated-portal-projections.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "communications-timeline-visibility-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "214_communications_timeline_and_visibility_design.md"
SECURITY_DOC = (
    ROOT
    / "docs"
    / "security"
    / "214_communications_preview_visibility_and_receipt_controls.md"
)
HTML_ATLAS = ROOT / "docs" / "frontend" / "214_communications_timeline_visibility_atlas.html"
MERMAID = ROOT / "docs" / "frontend" / "214_conversation_tuple_alignment.mmd"
CONTRACT = ROOT / "data" / "contracts" / "214_communications_timeline_contract.json"
MATRIX = ROOT / "data" / "analysis" / "214_preview_visibility_and_placeholder_matrix.csv"
CASES = ROOT / "data" / "analysis" / "214_receipt_callback_reminder_alignment_cases.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "214_communications_timeline_visibility_atlas.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules"

REQUIRED_PROJECTIONS = {
    "PatientCommunicationsTimelineProjection",
    "PatientConversationCluster",
    "ConversationThreadProjection",
    "ConversationSubthreadProjection",
    "PatientConversationPreviewDigest",
    "PatientCommunicationVisibilityProjection",
    "ConversationCallbackCardProjection",
    "PatientCallbackStatusProjection",
    "PatientReceiptEnvelope",
    "ConversationCommandSettlement",
    "PatientComposerLease",
    "ConversationTimelineAnchor",
}

REQUIRED_ROUTES = {
    "patient_portal_messages_index",
    "patient_portal_message_cluster",
    "patient_portal_message_thread",
    "patient_portal_message_callback_status",
    "patient_portal_message_cluster_hydration",
    "/v1/me/messages",
    "/v1/me/messages/{clusterId}",
    "/v1/me/messages/{clusterId}/thread/{threadId}",
    "/v1/me/messages/{clusterId}/callback/{callbackCaseId}",
    "/v1/me/messages/{clusterId}/hydrate",
}

REQUIRED_REASON_CODES = {
    "PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED",
    "PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER",
    "PORTAL_214_STEP_UP_PLACEHOLDER",
    "PORTAL_214_RECOVERY_ONLY_PLACEHOLDER",
    "PORTAL_214_TUPLE_ALIGNMENT_VERIFIED",
    "PORTAL_214_TUPLE_ALIGNMENT_DRIFT",
    "PORTAL_214_LOCAL_SUCCESS_NOT_FINAL",
    "PORTAL_214_DELIVERY_FAILURE_VISIBLE",
    "PORTAL_214_DISPUTE_VISIBLE",
    "PORTAL_214_BLOCKER_REPAIR_DOMINATES",
    "PORTAL_214_CALLBACK_STATUS_COMPATIBILITY",
}

REQUIRED_REGIONS = {
    "Conversation_Braid_Atlas",
    "MessageListRowStates",
    "ClusterShellStates",
    "CallbackCardStates",
    "PlaceholderStepUpBoards",
    "TupleAlignmentDiagrams",
    "DeliveryFailureDisputeBoards",
    "ReceiptSettlementBoard",
    "ChronologyBoard",
}

REQUIRED_SCREENSHOTS = {
    "214-overview.png",
    "214-placeholders.png",
    "214-tuple.png",
    "214-callback.png",
    "214-receipts.png",
    "214-failures.png",
    "214-mobile-placeholders.png",
    "214-reduced-motion.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[communications-timeline-stack] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    prereq = "par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections"
    if f"- [X] {prereq}" not in checklist:
        fail("task 212 prerequisite is not complete")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 214 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | REQUIRED_REASON_CODES
        | {
            "CommunicationsTimelineAssembler",
            "CommunicationVisibilityResolver",
            "assembleCommunicationsTimelineProjection",
            "resolveConversationCommunicationVisibility",
            "conversationThreadTupleHash",
            "calmSettledLanguageAllowed",
            "local_ack_is_not_authoritative_settlement_214",
        },
    )
    for forbidden in (
        "ConversationCallbackCardProjection_as_second_callback_truth = true",
        "local_ack_as_authoritative_settlement = true",
        "transport_acceptance_as_settled_delivery = true",
        "window.localStorage",
        "document.cookie",
    ):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers("service definition", service_definition, REQUIRED_ROUTES | REQUIRED_PROJECTIONS)


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(SECURITY_DOC), read(MERMAID)])
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_ROUTES
        | REQUIRED_REASON_CODES
        | {
            "CommunicationsTimelineAssembler",
            "CommunicationVisibilityResolver",
            "GOV.UK",
            "NHS service manual",
            "Playwright",
            "WCAG",
            "same-shell",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Conversation_Braid_Atlas":
        fail("contract visual mode drifted")
    require_markers("contract", json.dumps(contract), REQUIRED_PROJECTIONS | REQUIRED_ROUTES)
    for forbidden in (
        "ConversationCallbackCardProjection_as_second_callback_truth",
        "local_ack_as_authoritative_settlement",
        "transport_acceptance_as_settled_delivery",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden source {forbidden}")

    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 10:
        fail("placeholder matrix needs at least ten rows")
    for column in {
        "case_id",
        "preview_mode",
        "placeholder_kind",
        "placeholder_visible",
        "reason_code",
        "next_step",
        "atlas_region",
    }:
        if column not in rows[0]:
            fail(f"matrix missing column {column}")
    preview_modes = {row["preview_mode"] for row in rows}
    for mode in {
        "public_safe_summary",
        "authenticated_summary",
        "step_up_required",
        "suppressed_recovery_only",
    }:
        if mode not in preview_modes:
            fail(f"matrix missing preview mode {mode}")
    reason_codes = {row["reason_code"] for row in rows}
    for reason_code in REQUIRED_REASON_CODES - {"PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED"}:
        if reason_code not in reason_codes:
            fail(f"matrix missing reason code {reason_code}")

    cases = json.loads(read(CASES))
    if cases.get("visualMode") != "Conversation_Braid_Atlas":
        fail("cases visual mode drifted")
    require_markers(
        "cases",
        json.dumps(cases),
        REQUIRED_PROJECTIONS
        | {
            "message_reply_pending_review",
            "callback_card_uses_212_projection",
            "reminder_bounced_visible",
            "provider_dispute_visible",
            "tuple_drift_blocks_composer",
            "step_up_placeholder_keeps_row",
        },
    )


def validate_atlas_and_playwright() -> None:
    atlas = read(HTML_ATLAS)
    require_markers(
        "atlas",
        atlas,
        REQUIRED_REGIONS
        | REQUIRED_PROJECTIONS
        | REQUIRED_REASON_CODES
        | {
            "role=\"tablist\"",
            "aria-selected",
            "datetime=",
            "prefers-reduced-motion",
        },
    )
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_REGIONS
        | {
            "ariaSnapshot",
            "ArrowRight",
            "reducedMotion",
            "output/playwright/214-overview.png",
            "output/playwright/214-mobile-placeholders.png",
        },
    )
    missing = [
        name for name in sorted(REQUIRED_SCREENSHOTS) if not (OUTPUT_DIR / name).exists()
    ]
    if missing:
        fail("missing Playwright screenshots: " + ", ".join(missing))


def validate_backend_tests() -> None:
    tests = read(BACKEND_TEST)
    require_markers(
        "backend test",
        tests,
        REQUIRED_PROJECTIONS
        | REQUIRED_REASON_CODES
        | {
            "local acknowledgement",
            "delivery failures",
            "provider disputes",
            "PatientCallbackStatusProjection",
            "tuple alignment fails",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    expected = "python3 ./tools/analysis/validate_communications_timeline_stack.py"
    if package.get("scripts", {}).get("validate:communications-timeline-stack") != expected:
        fail("package.json missing validate:communications-timeline-stack script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:communications-timeline-stack": "python3 ./tools/analysis/validate_communications_timeline_stack.py"' not in root_updates:
        fail("root_script_updates missing validate:communications-timeline-stack")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_docs()
    validate_contract_and_analysis()
    validate_atlas_and_playwright()
    validate_backend_tests()
    validate_scripts()
    print("[communications-timeline-stack] validation passed")


if __name__ == "__main__":
    main()
