#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-edge-ingestion.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "102_phase2_telephony_edge_ingestion.sql"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = ROOT / "services" / "command-api" / "tests" / "telephony-edge-ingestion.integration.test.js"
ARCH_DOC = ROOT / "docs" / "architecture" / "187_telephony_edge_and_webhook_ingestion_design.md"
API_DOC = ROOT / "docs" / "api" / "187_telephony_provider_webhook_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "187_webhook_signature_validation_and_provider_boundary_controls.md"
PROVIDER_MAPPING = ROOT / "data" / "analysis" / "187_provider_event_mapping.csv"
DISORDER_CASES = ROOT / "data" / "analysis" / "187_webhook_idempotency_and_disorder_cases.json"
RAW_RECEIPT_SCHEMA = ROOT / "data" / "contracts" / "187_telephony_raw_receipt.schema.json"
NORMALIZED_EVENT_SCHEMA = ROOT / "data" / "contracts" / "187_telephony_normalized_event.schema.json"
CALL_SESSION_SCHEMA = ROOT / "data" / "contracts" / "187_telephony_call_session_bootstrap.schema.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_VENDOR_PAYLOAD_LEAKAGE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_UNSIGNED_CALLBACK_TRUST_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_DUPLICATE_CALLBACK_SIDE_EFFECTS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_OUT_OF_ORDER_BLINDNESS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_REPLAY_PATH_V1",
}

SOURCE_MARKERS = {
    "TelephonyEdgeService",
    "TelephonyWebhookWorker",
    "TelephonyProviderAdapter",
    "TelephonyRawWebhookReceipt",
    "NormalizedTelephonyEvent",
    "TelephonyIngestionIdempotencyRecord",
    "TelephonyDisorderBufferEntry",
    "TelephonyEdgeCallSession",
    "createSimulatorTelephonyProviderAdapter",
    "signSimulatorWebhookPayload",
    "createInMemoryTelephonyEdgeRepository",
    "createTelephonyEdgeIngestionApplication",
    "receiveProviderWebhook",
    "processPending",
    "applyNormalizedEvent",
    "createHmac",
    "timingSafeEqual",
    "IdentityAuditAndMaskingService",
    "provider_payload_shape_stops_at_normalizer",
    "normalization_boundary_only",
    "edge_quarantine_short_retention",
    "empty_fast_ack",
    "call_started",
    "menu_selection_captured",
    "recording_expected",
    "recording_available",
    "call_abandoned",
    "provider_error_recorded",
    "TEL_EDGE_187_SIGNATURE_VALIDATED",
    "TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED",
    "TEL_EDGE_187_OUT_OF_ORDER_BUFFERED",
    "TEL_EDGE_187_CALL_SESSION_BOOTSTRAPPED",
}

MIGRATION_MARKERS = {
    "phase2_telephony_provider_adapter_contracts",
    "phase2_telephony_raw_webhook_receipts",
    "phase2_telephony_normalized_events",
    "phase2_telephony_ingestion_idempotency_records",
    "phase2_telephony_disorder_buffer_entries",
    "phase2_telephony_call_session_bootstrap_records",
    "phase2_telephony_webhook_worker_outbox",
    "created_by_authority = 'TelephonyEdgeService'",
    "created_by_authority = 'TelephonyWebhookWorker'",
    "payload_storage_rule = 'normalization_boundary_only'",
    "provider_payload_shape_stops_at_normalizer",
    "edge_quarantine_short_retention",
    "idempotency_key TEXT NOT NULL UNIQUE",
}

SERVICE_MARKERS = {
    "telephony_edge_provider_webhook",
    "/internal/telephony/webhooks/{providerRef}",
    "TelephonyProviderWebhookContract",
    "telephony_webhook_worker_drain",
    "/internal/telephony/webhook-worker/drain",
    "TelephonyWebhookWorkerDrainContract",
    "telephony_call_session_bootstrap_current",
    "/internal/telephony/call-sessions/{callSessionRef}",
    "TelephonyCallSessionBootstrapProjectionContract",
}

DOC_MARKERS = {
    "TelephonyEdgeService",
    "TelephonyWebhookWorker",
    "NormalizedTelephonyEvent",
    "TelephonyRawWebhookReceipt",
    "HMAC-SHA256",
    "timingSafeEqual",
    "empty acknowledgement",
    "raw receipt",
    "quarantine",
    "maskedCallerRef",
    "recordingArtifactRef",
    "providerPayloadRef",
    "idempotency",
    "out-of-order",
}

REQUIRED_CALLBACK_CLASSES = {
    "call.started",
    "call.ringing",
    "call.answered",
    "menu.selected",
    "ivr.branch",
    "recording.expected",
    "recording.available",
    "recording.status.available",
    "call.completed",
    "call.abandoned",
    "provider.error",
    "delivery.failed",
    "continuation.delivery",
}

REQUIRED_CASE_IDS = {
    "TEL187_VALID_SIGNATURE_FAST_ACK",
    "TEL187_BAD_SIGNATURE_REJECTED",
    "TEL187_DUPLICATE_CALLBACK_COLLAPSED",
    "TEL187_IDEMPOTENCY_COLLISION_REJECTED",
    "TEL187_RECORDING_BEFORE_START_BUFFERED",
    "TEL187_RAW_PAYLOAD_QUARANTINED_ONLY",
    "TEL187_LATE_RECORDING_AFTER_TERMINAL_PRESERVED",
    "TEL187_PROVIDER_ERROR_NORMALIZED",
}


def fail(message: str) -> None:
    raise SystemExit(f"[telephony-edge-ingestion] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def forbid_markers(label: str, text: str, markers: set[str]) -> None:
    present = sorted(marker for marker in markers if marker in text)
    if present:
        fail(f"{label} contains forbidden markers: {', '.join(present)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    for task_id in ["par_180", "par_181", "par_182", "par_183", "par_184", "par_185", "par_186"]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_187")
    if checklist_state("par_187") not in {"-", "X"}:
        fail("par_187 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | REQUIRED_GAPS | REQUIRED_CALLBACK_CLASSES)
    forbid_markers(
        "source",
        source,
        {
            "console.log",
            "rawPhoneNumber",
            "fullPhoneNumber",
            "document.cookie",
            "localStorage",
            "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE.json",
        },
    )
    if source.count("providerPayloadRef") < 2:
        fail("source must route provider payloads through providerPayloadRef")
    if source.count("idempotencyKey") < 10:
        fail("source must implement idempotent webhook ingestion")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS | REQUIRED_GAPS | REQUIRED_CALLBACK_CLASSES)
    forbid_markers("docs", combined, {"PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE.json"})


def validate_schemas() -> None:
    expected_titles = {
        RAW_RECEIPT_SCHEMA: "TelephonyRawWebhookReceipt",
        NORMALIZED_EVENT_SCHEMA: "NormalizedTelephonyEvent",
        CALL_SESSION_SCHEMA: "TelephonyEdgeCallSession",
    }
    for path, title in expected_titles.items():
        schema = load_json(path)
        if schema.get("title") != title:
            fail(f"{path.relative_to(ROOT)} title must be {title}")
    normalized_text = read(NORMALIZED_EVENT_SCHEMA)
    require_markers(
        "normalized event schema",
        normalized_text,
        {
            "provider_payload_shape_stops_at_normalizer",
            "normalization_boundary_only",
            "call_started",
            "menu_selection_captured",
            "recording_available",
            "provider_error_recorded",
            "maskedCallerRef",
            "recordingArtifactRef",
        },
    )


def validate_mapping() -> None:
    try:
        rows = list(csv.DictReader(read(PROVIDER_MAPPING).splitlines()))
    except csv.Error as error:
        fail(f"{PROVIDER_MAPPING.relative_to(ROOT)} is invalid CSV: {error}")
    if not rows:
        fail("provider event mapping is empty")
    callback_classes = {row.get("provider_callback_class") for row in rows}
    missing_callbacks = sorted(REQUIRED_CALLBACK_CLASSES - callback_classes)
    if missing_callbacks:
        fail(f"provider mapping missing callback classes: {', '.join(missing_callbacks)}")
    gap_closures = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gap_closures)
    if missing_gaps:
        fail(f"provider mapping missing gap closures: {', '.join(missing_gaps)}")


def validate_cases() -> None:
    payload = load_json(DISORDER_CASES)
    if payload.get("schemaVersion") != "187.phase2.telephony-edge.v1":
        fail("cases JSON has wrong schemaVersion")
    cases = payload.get("cases")
    if not isinstance(cases, list):
        fail("cases JSON must contain cases array")
    case_ids = {case.get("caseId") for case in cases if isinstance(case, dict)}
    missing_cases = sorted(REQUIRED_CASE_IDS - case_ids)
    if missing_cases:
        fail(f"cases JSON missing cases: {', '.join(missing_cases)}")
    gaps = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"cases JSON missing gap closures: {', '.join(missing_gaps)}")
    require_markers(
        "cases JSON",
        json.dumps(payload),
        {
            "signature_failed",
            "duplicate_replayed",
            "idempotency_collision_rejected",
            "waiting_for_call_started",
            "provider_payload_shape_stops_at_normalizer",
            "recordingArtifactRef",
        },
    )


def validate_tests() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        test,
        {
            "TelephonyEdgeService",
            "TelephonyWebhookWorker",
            "signature",
            "duplicate callbacks",
            "out-of-order",
            "raw receipts",
            "canonical",
            "call-session",
            "provider-neutral",
            "telephony_provider_simulator",
            "expectNoDownstreamLeak",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:telephony-edge-ingestion")
        != "python3 ./tools/analysis/validate_telephony_edge_ingestion.py"
    ):
        fail("package.json missing validate:telephony-edge-ingestion script")
    expected_chain = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if expected_chain not in scripts.get(name, ""):
            fail(f"package.json {name} chain missing telephony edge validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing telephony edge validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:telephony-edge-ingestion")
        != "python3 ./tools/analysis/validate_telephony_edge_ingestion.py"
    ):
        fail("root_script_updates missing validate:telephony-edge-ingestion")


def validate_adjacent_validators() -> None:
    for path in (
        ROOT / "tools" / "analysis" / "validate_identity_audit_and_masking.py",
        ROOT / "tools" / "analysis" / "validate_authenticated_portal_projections.py",
        ROOT / "tools" / "analysis" / "validate_signed_in_request_ownership.py",
        ROOT / "tools" / "analysis" / "validate_pds_enrichment_flow.py",
        ROOT / "tools" / "analysis" / "validate_identity_repair_chain.py",
        ROOT / "tools" / "analysis" / "validate_access_grant_supersession_workflows.py",
    ):
        if "validate:telephony-edge-ingestion" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not accept telephony edge validator chain")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; coherent sibling seams were available")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_service_definition()
    validate_docs()
    validate_schemas()
    validate_mapping()
    validate_cases()
    validate_tests()
    validate_scripts()
    validate_adjacent_validators()
    validate_gap_artifact_absent()
    print("[telephony-edge-ingestion] validation passed")


if __name__ == "__main__":
    main()
