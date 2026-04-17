#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
SOURCE = ROOT / "services" / "command-api" / "src" / "support-repair-and-replay.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "support-repair-and-replay-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "219_controlled_resend_delivery_repair_and_replay_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "219_controlled_resend_replay_webhook_and_metadata_controls.md"
HTML_ATLAS = ROOT / "docs" / "frontend" / "219_support_repair_and_replay_atlas.html"
MERMAID = ROOT / "docs" / "frontend" / "219_support_repair_chain_and_replay_restore.mmd"
CONTRACT = ROOT / "data" / "contracts" / "219_support_repair_and_replay_contract.json"
IDEMPOTENCY_MATRIX = ROOT / "data" / "analysis" / "219_repair_attempt_idempotency_matrix.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "219_replay_boundary_and_restore_cases.json"
PROVIDER_HYGIENE = ROOT / "data" / "analysis" / "219_provider_metadata_and_webhook_hygiene.json"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "219_support_repair_and_replay_atlas.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations"
TASK_PROMPT_NAME = (
    "par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations"
)

PREREQUISITES = [
    "seq_209_crosscutting_open_patient_account_and_support_surface_tracks_gate",
    "par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules",
    "par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries",
]

REQUIRED_OBJECTS = {
    "SupportOmnichannelTimelineProjection",
    "SupportMutationAttempt",
    "SupportActionRecord",
    "SupportActionSettlement",
    "CommunicationReplayRecord",
    "SupportReplayCheckpoint",
    "SupportReplayEvidenceBoundary",
    "SupportReplayDeltaReview",
    "SupportReplayReleaseDecision",
    "SupportReplayRestoreSettlement",
    "SupportRouteIntentToken",
    "SupportContinuityEvidenceProjection",
    "SupportReadOnlyFallbackProjection",
    "SupportActionWorkbenchProjection",
    "SupportReachabilityPostureProjection",
    "SupportRepairChainView",
    "MessageDispatchEnvelope",
    "MessageDeliveryEvidenceBundle",
    "ThreadExpectationEnvelope",
    "ThreadResolutionGate",
    "AdapterReceiptCheckpoint",
    "ProviderSafeMetadataBundle",
}

REQUIRED_ROUTES = {
    "POST /ops/support/tickets/:supportTicketId/communication-repair/preview",
    "POST /ops/support/tickets/:supportTicketId/communication-repair/commit",
    "POST /ops/support/tickets/:supportTicketId/replay/start",
    "POST /ops/support/tickets/:supportTicketId/replay/release",
    "GET /ops/support/tickets/:supportTicketId/timeline",
    "GET /ops/support/tickets/:supportTicketId/restore-status",
}

REQUIRED_ROUTE_IDS = {
    "support_communication_repair_preview",
    "support_communication_repair_commit",
    "support_replay_start",
    "support_replay_release",
    "support_ticket_timeline_current",
    "support_repair_restore_status",
}

REQUIRED_BOARDS = {
    "Support_Replay_Control_Atlas",
    "RepairLifecycleBoard",
    "IdempotencyDuplicateBoard",
    "TimelineSettlementAlignmentBoard",
    "ReplayCheckpointBoundaryBoard",
    "DeltaReviewBoard",
    "RestoreFallbackBoard",
    "ProviderCallbackHygieneBoard",
    "MetadataHygieneBoard",
}

REQUIRED_SCREENSHOTS = {
    "219-atlas-repair-lifecycle.png",
    "219-atlas-idempotency.png",
    "219-atlas-timeline-settlement.png",
    "219-atlas-replay-boundary.png",
    "219-atlas-delta-review.png",
    "219-atlas-restore-fallback.png",
    "219-atlas-provider-callback.png",
    "219-atlas-metadata-hygiene.png",
    "219-atlas-mobile.png",
    "219-atlas-reduced-motion.png",
    "219-atlas.png",
}

REQUIRED_REASON_CODES = {
    "SUPPORT_219_REPAIR_CHAIN_CANONICAL_COMMUNICATION_BOUND",
    "SUPPORT_219_REPAIR_DEDUPE_REUSED_LIVE_ATTEMPT",
    "SUPPORT_219_REPAIR_AWAITING_EXTERNAL_SETTLEMENT",
    "SUPPORT_219_REPAIR_DENIED_BY_THREAD_RESOLUTION_GATE",
    "SUPPORT_219_REPAIR_STALE_RECOVERABLE",
    "SUPPORT_219_REPAIR_MANUAL_HANDOFF_REQUIRED",
    "SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED",
    "SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_REJECTED",
    "SUPPORT_219_PROVIDER_METADATA_SAFE_CORRELATION_ONLY",
    "SUPPORT_219_REPLAY_CHECKPOINT_FROZEN",
    "SUPPORT_219_REPLAY_BOUNDARY_EXCLUDES_DRAFTS_AND_LATER_PROOF",
    "SUPPORT_219_REPLAY_RELEASE_DELTA_REVIEW_REQUIRED",
    "SUPPORT_219_REPLAY_RESTORE_LIVE_CONTROLS_REARMED",
    "SUPPORT_219_REPLAY_RESTORE_BLOCKED_READ_ONLY_FALLBACK",
}


def fail(message: str) -> None:
    raise SystemExit(f"[support-repair-and-replay-stack] {message}")


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
    for prerequisite in PREREQUISITES:
        if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK_PROMPT_NAME}" not in checklist and f"- [X] {TASK_PROMPT_NAME}" not in checklist:
        fail("task 219 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_OBJECTS
        | REQUIRED_ROUTES
        | REQUIRED_REASON_CODES
        | {
            "SupportRepairChainAssembler",
            "ReplayCheckpointService",
            "ReplayRestoreService",
            "Support_Replay_Control_Atlas",
            "createSupportRepairAndReplayApplication",
            "previewCommunicationRepair",
            "commitCommunicationRepair",
            "reconcileProviderCallback",
            "startReplay",
            "releaseReplay",
            "getSupportTimeline",
            "getRestoreStatus",
            "validateProviderMetadataHygiene",
            "X-Twilio-Signature",
            "X-Twilio-Email-Event-Webhook-Signature",
            "sendgrid.categories.direct_patient_identifier",
            "sendgrid.unique_args.direct_patient_identifier",
            "sendgrid.custom_args.direct_patient_identifier",
            "governingThreadTupleHash",
            "governingSubthreadTupleHash",
        },
    )
    for forbidden in (
        "acceptedAsDeliveryTruthWithoutSignature: true",
        "phiInProviderMetadata: true",
        "directPatientIdentifierInProviderMetadata: true",
        "window.localStorage",
        "document.cookie",
    ):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        REQUIRED_ROUTE_IDS
        | REQUIRED_OBJECTS
        | {
            "/ops/support/tickets/{supportTicketId}/communication-repair/preview",
            "/ops/support/tickets/{supportTicketId}/communication-repair/commit",
            "/ops/support/tickets/{supportTicketId}/replay/start",
            "/ops/support/tickets/{supportTicketId}/replay/release",
            "/ops/support/tickets/{supportTicketId}/timeline",
            "/ops/support/tickets/{supportTicketId}/restore-status",
        },
    )


def validate_backend_test() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend test",
        test,
        REQUIRED_OBJECTS
        | REQUIRED_ROUTE_IDS
        | {
            "createSupportRepairAndReplayApplication",
            "one live SupportMutationAttempt",
            "canonical communication and support lineage chain",
            "validates provider callbacks",
            "starts replay with an explicit checkpoint",
            "falls back same-shell",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(SECURITY_DOC), read(MERMAID)])
    require_markers(
        "docs",
        combined,
        REQUIRED_OBJECTS
        | REQUIRED_ROUTES
        | REQUIRED_REASON_CODES
        | {
            "Support_Replay_Control_Atlas",
            "same-shell",
            "X-Twilio-Signature",
            "X-Twilio-Email-Event-Webhook-Signature",
            "SendGrid categories",
            "unique_args",
            "custom_args",
            "OWASP Authorization",
            "OWASP Logging",
            "Playwright ARIA snapshots",
            "Playwright screenshots",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Support_Replay_Control_Atlas":
        fail("contract visual mode drifted")
    require_markers("contract", json.dumps(contract), REQUIRED_OBJECTS | REQUIRED_ROUTES)
    for forbidden in [
        "sendgrid.categories.direct_patient_identifier",
        "sendgrid.unique_args.direct_patient_identifier",
        "sendgrid.custom_args.direct_patient_identifier",
        "twilio.status_callback_url.direct_patient_identifier",
    ]:
        if forbidden not in contract.get("providerMetadataPolicy", {}).get("forbidden", []):
            fail(f"contract missing forbidden provider metadata field {forbidden}")

    with IDEMPOTENCY_MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 12:
        fail("idempotency matrix needs at least twelve rows")
    for column in {
        "case_id",
        "repair_kind",
        "thread_gate",
        "evidence_status",
        "existing_live_attempt",
        "idempotency_key_relation",
        "expected_decision",
        "external_effect_delta",
        "settlement_result",
        "atlas_region",
    }:
        if column not in rows[0]:
            fail(f"idempotency matrix missing column {column}")
    decisions = {row["expected_decision"] for row in rows}
    for decision in {"created_new_attempt", "exact_replay", "reuse_live_attempt", "denied_scope", "read_only_fallback"}:
        if decision not in decisions:
            fail(f"idempotency matrix missing decision {decision}")
    if any(row["external_effect_delta"] not in {"0", "1"} for row in rows):
        fail("idempotency matrix external effect delta must be 0 or 1")

    replay_cases = json.loads(read(REPLAY_CASES))
    if replay_cases.get("visualMode") != "Support_Replay_Control_Atlas":
        fail("replay cases visual mode drifted")
    cases = replay_cases.get("cases", [])
    if len(cases) < 6:
        fail("replay cases need at least six cases")
    case_text = json.dumps(replay_cases)
    require_markers(
        "replay cases",
        case_text,
        {
            "SupportReplayCheckpoint",
            "SupportReplayEvidenceBoundary",
            "SupportReplayDeltaReview",
            "SupportRouteIntentToken",
            "SupportContinuityEvidenceProjection",
            "SupportReplayRestoreSettlement",
            "live_restored",
            "read_only_fallback",
            "awaiting_external_hold",
            "drafts",
            "later_confirmations",
        },
    )

    provider_hygiene = json.loads(read(PROVIDER_HYGIENE))
    provider_text = json.dumps(provider_hygiene)
    require_markers(
        "provider hygiene",
        provider_text,
        {
            "X-Twilio-Signature",
            "X-Twilio-Email-Event-Webhook-Signature",
            "sendgrid.categories.phi",
            "sendgrid.unique_args.phi",
            "sendgrid.custom_args.phi",
            "acceptedAsDeliveryTruthWithoutSignature",
            "correlationId",
            "causalToken",
        },
    )
    for provider in provider_hygiene.get("providers", []):
        if provider.get("acceptedAsDeliveryTruthWithoutSignature") is not False:
            fail("provider hygiene must fail closed without signature validation")

    gap = json.loads(read(GAP))
    if gap.get("expectedOwnerTask") != "par_219":
        fail("repair replay gap expected owner drifted")
    if gap.get("closureStatus") != "resolved_by_par_219":
        fail("repair replay gap not marked resolved by par_219")


def validate_atlas_and_playwright() -> None:
    atlas = read(HTML_ATLAS)
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "atlas",
        atlas,
        REQUIRED_BOARDS
        | REQUIRED_OBJECTS
        | REQUIRED_ROUTES
        | {
            "window.__supportReplayControlAtlasData",
            "provider callback",
            "metadata hygiene",
            "prefers-reduced-motion",
        },
    )
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_BOARDS
        | REQUIRED_OBJECTS
        | {
            "ariaSnapshot",
            "mobile viewport",
            "reduced motion",
            "assertNoOverflow",
            "219-atlas-repair-lifecycle.png",
            "219-atlas-metadata-hygiene.png",
        },
    )
    for screenshot in REQUIRED_SCREENSHOTS:
        if not (OUTPUT_DIR / screenshot).exists():
            fail(f"missing Playwright screenshot: output/playwright/{screenshot}")


def validate_root_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    expected = "python3 ./tools/analysis/validate_support_repair_and_replay_stack.py"
    script = package.get("scripts", {}).get("validate:support-repair-and-replay-stack")
    if script != expected:
        fail("root package missing validate:support-repair-and-replay-stack script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    require_markers(
        "root_script_updates",
        root_updates,
        {"validate:support-repair-and-replay-stack", expected},
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_backend_test()
    validate_docs()
    validate_contract_and_analysis()
    validate_atlas_and_playwright()
    validate_root_scripts()
    print("[support-repair-and-replay-stack] validation passed")


if __name__ == "__main__":
    main()
