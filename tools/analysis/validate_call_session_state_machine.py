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
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-call-session-state-machine.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "103_phase2_call_session_state_machine.sql"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = ROOT / "services" / "command-api" / "tests" / "telephony-call-session-state-machine.integration.test.js"
ARCH_DOC = ROOT / "docs" / "architecture" / "188_call_session_state_machine_design.md"
API_DOC = ROOT / "docs" / "api" / "188_call_session_event_and_menu_capture_contract.md"
OPS_DOC = ROOT / "docs" / "operations" / "188_call_session_timeout_and_rebuild_rules.md"
EVENT_SCHEMA = ROOT / "data" / "contracts" / "188_call_session_event.schema.json"
MENU_SCHEMA = ROOT / "data" / "contracts" / "188_menu_selection_capture.schema.json"
PROJECTION_SCHEMA = ROOT / "data" / "contracts" / "188_call_session_projection.schema.json"
TIMEOUT_SCHEMA = ROOT / "data" / "contracts" / "188_call_session_timeout_policy.schema.json"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "188_call_session_transition_matrix.csv"
PRECEDENCE_MATRIX = ROOT / "data" / "analysis" / "188_out_of_order_event_precedence_matrix.csv"
MENU_MAPPING = ROOT / "data" / "analysis" / "188_menu_capture_mapping.csv"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_CALL_SESSION.json"

GAP_FILES = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CALL_SESSION_EVENT_TAXONOMY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CALL_SESSION_TIMEOUT_POLICY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CALL_SESSION_MENU_CORRECTION_APPEND_ONLY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CALL_SESSION_PROVIDER_COMPLETED_NOT_CLOSED.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CALL_SESSION_URGENT_LIVE_CONTINUES_EVIDENCE.json",
]

SOURCE_MARKERS = {
    "TelephonyCallSessionService",
    "CallSessionAggregate",
    "CallSessionCanonicalEvent",
    "MenuSelectionCapture",
    "TelephonyUrgentLiveAssessmentRecord",
    "TelephonySafetyPreemptionRecord",
    "CallSessionSupportProjection",
    "CallSessionTimeoutPolicy",
    "callSessionEventFromNormalizedTelephonyEvent",
    "rebuildCallSessionFromEvents",
    "createCallSessionStateMachineApplication",
    "TEL_SESSION_188_MENU_CAPTURE_APPENDED",
    "TEL_SESSION_188_MENU_CORRECTION_APPENDED",
    "TEL_SESSION_188_DUPLICATE_EVENT_REPLAY_COLLAPSED",
    "TEL_SESSION_188_PROVIDER_COMPLETION_NOT_PLATFORM_CLOSED",
    "TEL_SESSION_188_PROMOTION_SHORTCUT_BLOCKED",
    "TEL_SESSION_188_URGENT_LIVE_PREEMPTION_OPENED",
    "support_safe_masked_projection",
    "phase2-call-session-timeout-policy-188.v1",
}

EVENT_TYPES = {
    "call_initiated",
    "call_answered",
    "menu_captured",
    "identity_step_started",
    "identity_resolved",
    "identity_partial",
    "identity_attempt_failed",
    "recording_promised",
    "recording_available",
    "provider_error",
    "call_abandoned",
    "call_completed",
    "urgent_live_signal_observed",
    "operator_override_requested",
    "manual_followup_requested",
    "transcript_readiness_recorded",
    "evidence_readiness_assessed",
    "continuation_eligibility_settled",
    "continuation_sent",
    "request_seeded",
    "submission_promoted",
    "call_closed",
}

MIGRATION_MARKERS = {
    "phase2_call_session_canonical_events",
    "phase2_call_session_aggregates",
    "phase2_menu_selection_captures",
    "phase2_telephony_urgent_live_assessments",
    "phase2_telephony_safety_preemption_records",
    "phase2_call_session_support_projections",
    "phase2_call_session_rebuild_checkpoints",
    "phase2_call_session_timeout_policies",
    "TelephonyCallSessionService",
    "support_safe_masked_projection",
    "phase2-call-session-state-machine-188.v1",
    "phase2-call-session-timeout-policy-188.v1",
}

SERVICE_MARKERS = {
    "telephony_call_session_event_append",
    "/internal/telephony/call-sessions/{callSessionRef}/events",
    "CallSessionEventContract",
    "telephony_call_session_rebuild",
    "/internal/telephony/call-sessions/{callSessionRef}/rebuild",
    "CallSessionRebuildContract",
    "telephony_call_session_projection_current",
    "/internal/telephony/call-sessions/{callSessionRef}/projection",
    "CallSessionProjectionContract",
}

DOC_MARKERS = {
    "TelephonyCallSessionService",
    "CallSessionAggregate",
    "CallSessionCanonicalEvent",
    "MenuSelectionCapture",
    "CallSessionSupportProjection",
    "TelephonyUrgentLiveAssessment",
    "SafetyPreemptionRecord",
    "provider completion",
    "append-only",
    "idempotency",
    "support-safe",
    "phase2-call-session-timeout-policy-188.v1",
}

GAP_IDS = {
    "GAP_RESOLVED_PHASE2_CALL_SESSION_EVENT_TAXONOMY",
    "GAP_RESOLVED_PHASE2_CALL_SESSION_TIMEOUT_POLICY",
    "GAP_RESOLVED_PHASE2_CALL_SESSION_MENU_CORRECTION_APPEND_ONLY",
    "GAP_RESOLVED_PHASE2_CALL_SESSION_PROVIDER_COMPLETED_NOT_CLOSED",
    "GAP_RESOLVED_PHASE2_CALL_SESSION_URGENT_LIVE_CONTINUES_EVIDENCE",
}


def fail(message: str) -> None:
    raise SystemExit(f"[call-session-state-machine] {message}")


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
    if checklist_state("par_187") != "X":
        fail("par_187 must be complete before par_188")
    if checklist_state("par_188") not in {"-", "X"}:
        fail("par_188 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | EVENT_TYPES | GAP_IDS)
    forbid_markers(
        "source",
        source,
        {
            "console.log",
            "rawPhoneNumber",
            "fullPhoneNumber",
            "rawPayload",
            "recordingUrl",
            "PARALLEL_INTERFACE_GAP_PHASE2_CALL_SESSION.json",
        },
    )
    if source.count("idempotencyKey") < 10:
        fail("source must implement idempotent event application")
    if source.count("MenuSelectionCapture") < 8:
        fail("source must model durable menu captures")
    if source.count("rebuild") < 6:
        fail("source must implement deterministic rebuild")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, OPS_DOC])
    require_markers("docs", combined, DOC_MARKERS | GAP_IDS | EVENT_TYPES)
    forbid_markers("docs", combined, {"PARALLEL_INTERFACE_GAP_PHASE2_CALL_SESSION.json"})


def validate_schemas() -> None:
    expected_titles = {
        EVENT_SCHEMA: "CallSessionCanonicalEvent",
        MENU_SCHEMA: "MenuSelectionCapture",
        PROJECTION_SCHEMA: "CallSessionSupportProjection",
        TIMEOUT_SCHEMA: "CallSessionTimeoutPolicy",
    }
    for path, title in expected_titles.items():
        schema = load_json(path)
        if schema.get("title") != title:
            fail(f"{path.relative_to(ROOT)} title must be {title}")
    require_markers("event schema", read(EVENT_SCHEMA), EVENT_TYPES)
    require_markers(
        "menu schema",
        read(MENU_SCHEMA),
        {"MENU_SYMPTOMS", "MENU_MEDS", "MENU_ADMIN", "MENU_RESULTS", "correctionOfCaptureRef"},
    )
    require_markers(
        "projection schema",
        read(PROJECTION_SCHEMA),
        {"support_safe_masked_projection", "maskedCallerFragment", "currentUrgentLivePosture"},
    )
    require_markers(
        "timeout schema",
        read(TIMEOUT_SCHEMA),
        {"180", "240", "600", "recording_missing", "manual_followup_required"},
    )


def validate_analysis() -> None:
    transition_rows = list(csv.DictReader(read(TRANSITION_MATRIX).splitlines()))
    if len(transition_rows) < 20:
        fail("transition matrix must contain legal and illegal transitions")
    transition_states = {row.get("to_state") for row in transition_rows}
    for state in {"urgent_live_only", "continuation_eligible", "evidence_ready", "request_seeded"}:
        if state not in transition_states:
            fail(f"transition matrix missing state {state}")
    precedence_rows = list(csv.DictReader(read(PRECEDENCE_MATRIX).splitlines()))
    case_ids = {row.get("case_id") for row in precedence_rows}
    for case_id in {
        "TEL188_DUPLICATE_CALL_START",
        "TEL188_COMPLETED_BEFORE_MENU",
        "TEL188_RECORDING_AFTER_COMPLETION",
        "TEL188_PROVIDER_ERROR_AFTER_PROGRESS",
        "TEL188_LATE_OPERATOR_CORRECTION",
        "TEL188_PROMOTION_SHORTCUT",
    }:
        if case_id not in case_ids:
            fail(f"precedence matrix missing {case_id}")
    menu_rows = list(csv.DictReader(read(MENU_MAPPING).splitlines()))
    menu_codes = {row.get("normalized_menu_code") for row in menu_rows}
    for code in {"MENU_SYMPTOMS", "MENU_MEDS", "MENU_ADMIN", "MENU_RESULTS", "MENU_UNKNOWN"}:
        if code not in menu_codes:
            fail(f"menu mapping missing {code}")


def validate_gap_resolutions() -> None:
    for path in GAP_FILES:
        payload = load_json(path)
        for key in (
            "taskId",
            "sourceAmbiguity",
            "decisionTaken",
            "whyThisFitsTheBlueprint",
            "operationalRisk",
            "followUpIfPolicyChanges",
        ):
            if not payload.get(key):
                fail(f"{path.relative_to(ROOT)} missing {key}")


def validate_tests() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        test,
        {
            "legal early transitions",
            "promotion shortcuts",
            "duplicate event replay",
            "out-of-order events",
            "abandonment",
            "provider-error",
            "urgent-live bootstrap",
            "rebuilds",
            "normalized telephony events",
            "expectSupportSafe",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:call-session-state-machine")
        != "python3 ./tools/analysis/validate_call_session_state_machine.py"
    ):
        fail("package.json missing validate:call-session-state-machine script")
    expected_chain = (
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
            fail(f"package.json {name} chain missing call-session validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing call-session validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:call-session-state-machine")
        != "python3 ./tools/analysis/validate_call_session_state_machine.py"
    ):
        fail("root_script_updates missing validate:call-session-state-machine")


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
    validate_analysis()
    validate_gap_resolutions()
    validate_tests()
    validate_scripts()
    validate_gap_artifact_absent()
    print("[call-session-state-machine] validation passed")


if __name__ == "__main__":
    main()
