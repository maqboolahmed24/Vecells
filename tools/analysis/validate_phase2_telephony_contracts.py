#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CALL_SESSION_SCHEMA = ROOT / "data/contracts/173_call_session.schema.json"
PROVIDER_EVENT_SCHEMA = ROOT / "data/contracts/173_telephony_provider_event.schema.json"
TRANSCRIPT_SCHEMA = ROOT / "data/contracts/173_transcript_readiness_record.schema.json"
READINESS_SCHEMA = ROOT / "data/contracts/173_evidence_readiness_assessment.schema.json"
CONTINUATION_SCHEMA = ROOT / "data/contracts/173_continuation_eligibility.schema.json"
MANUAL_REVIEW_SCHEMA = ROOT / "data/contracts/173_manual_review_disposition.schema.json"
CONTINUATION_CONTEXT_SCHEMA = ROOT / "data/contracts/173_telephony_continuation_context.schema.json"
TRANSITION_MATRIX = ROOT / "data/analysis/173_call_state_transition_matrix.csv"
READINESS_TABLE = ROOT / "data/analysis/173_readiness_truth_table.csv"
PROVIDER_MAPPING = ROOT / "data/analysis/173_provider_event_mapping.csv"
GAP_LOG = ROOT / "data/analysis/173_telephony_gap_log.json"
ARCHITECTURE_DOC = ROOT / "docs/architecture/173_telephony_call_session_and_readiness_contract.md"
API_DOC = ROOT / "docs/api/173_telephony_event_normalization_and_recording_contracts.md"
SECURITY_DOC = ROOT / "docs/security/173_audio_quarantine_transcript_derivation_and_manual_review_rules.md"
FRONTEND_SPEC = ROOT / "docs/frontend/173_mobile_continuation_and_ops_state_experience_spec.md"
BOARD = ROOT / "docs/frontend/173_telephony_readiness_board.html"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/173_telephony_readiness_board.spec.js"
CHECKLIST = ROOT / "prompt/checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

CALL_STATES = {
    "initiated",
    "menu_selected",
    "identity_in_progress",
    "identity_resolved",
    "identity_partial",
    "recording_expected",
    "recording_available",
    "evidence_preparing",
    "evidence_pending",
    "urgent_live_only",
    "continuation_eligible",
    "evidence_ready",
    "continuation_sent",
    "request_seeded",
    "submitted",
    "closed",
    "identity_failed",
    "abandoned",
    "provider_error",
    "manual_followup_required",
    "manual_audio_review_required",
    "recording_missing",
    "transcript_degraded",
}

USABILITY_STATES = {
    "awaiting_recording",
    "awaiting_transcript",
    "awaiting_structured_capture",
    "urgent_live_only",
    "safety_usable",
    "manual_review_only",
    "unusable_terminal",
}

PROMOTION_READINESS = {"blocked", "continuation_only", "ready_to_seed", "ready_to_promote"}
CONTINUATION_RECOMMENDATIONS = {
    "continuation_seeded_verified",
    "continuation_challenge",
    "manual_only",
}
MANUAL_TRIGGERS = {
    "recording_missing",
    "transcript_degraded",
    "contradictory_capture",
    "identity_ambiguous",
    "handset_untrusted",
    "urgent_live_without_routine_evidence",
}
REQUIRED_FORBIDDEN_SUBMIT_FROM = {
    "recording_available",
    "evidence_pending",
    "urgent_live_only",
    "continuation_eligible",
}
REQUIRED_GAP_IDS = {
    "GAP_RESOLVED_PHASE2_TELEPHONY_PROVIDER_NORMALIZATION_V1",
    "GAP_RESOLVED_PHASE2_TELEPHONY_RECORDING_NOT_READY_V1",
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_READINESS_BOUND_V1",
    "GAP_RESOLVED_PHASE2_TELEPHONY_MANUAL_REVIEW_CONTRACT_V1",
    "GAP_RESOLVED_PHASE2_TELEPHONY_MOBILE_CONTINUATION_GRAMMAR_V1",
    "GAP_RESOLVED_PHASE2_TELEPHONY_IDEMPOTENT_REBUILD_V1",
}
REQUIRED_BOARD_MARKERS = {
    "Telephony_Readiness_Board",
    "telephony_echo_mark",
    "readiness-summary-strip",
    "mobile-continuation-preview",
    "mobile-preview-parity",
    "state-rail",
    "state-filter",
    "provider-event-filter",
    "readiness-filter",
    "call-state-braid",
    "call-state-transition-table",
    "readiness-ladder",
    "readiness-truth-table",
    "continuation-gate-strip",
    "provider-event-mapping-table",
    "parity-table",
    "inspector",
    "--masthead-height: 72px",
    "--left-rail-width: 300px",
    "--right-inspector-width: 408px",
    "--mobile-artboard-width: 390px",
    "1640px",
    "prefers-reduced-motion",
}
REQUIRED_SPEC_MARKERS = {
    "state selection synchronization",
    "provider-event and readiness-table parity",
    "urgent-live-only and manual-review-only rendering",
    "mobile continuation preview parity",
    "keyboard traversal and landmarks",
    "reducedMotion equivalence",
    "diagram/table parity",
    "Telephony_Readiness_Board",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase2-telephony-contracts] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    text = require_file(path)
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    text = require_file(path)
    try:
        return list(csv.DictReader(text.splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def enum_at(schema: dict[str, Any], *keys: str) -> set[str]:
    node: Any = schema
    for key in keys:
        node = node[key]
    return set(node["enum"])


def property_names(schema: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(schema, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            names.update(properties.keys())
        for value in schema.values():
            names.update(property_names(value))
    elif isinstance(schema, list):
        for item in schema:
            names.update(property_names(item))
    return names


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def validate_schemas() -> None:
    expected_titles = {
        CALL_SESSION_SCHEMA: "CallSession",
        PROVIDER_EVENT_SCHEMA: "TelephonyProviderEvent",
        TRANSCRIPT_SCHEMA: "TelephonyTranscriptReadinessRecord",
        READINESS_SCHEMA: "TelephonyEvidenceReadinessAssessment",
        CONTINUATION_SCHEMA: "TelephonyContinuationEligibility",
        MANUAL_REVIEW_SCHEMA: "TelephonyManualReviewDisposition",
        CONTINUATION_CONTEXT_SCHEMA: "TelephonyContinuationContext",
    }
    schemas = {path: load_json(path) for path in expected_titles}
    for path, expected_title in expected_titles.items():
        if schemas[path].get("title") != expected_title:
            fail(f"{path.relative_to(ROOT)} title must be {expected_title}")

    call_states = enum_at(schemas[CALL_SESSION_SCHEMA], "$defs", "callState")
    if call_states != CALL_STATES:
        fail("CallSession callState enum does not exactly match frozen Phase 2 telephony states")

    if enum_at(schemas[READINESS_SCHEMA], "properties", "usabilityState") != USABILITY_STATES:
        fail("TelephonyEvidenceReadinessAssessment usabilityState enum drifted")
    if enum_at(schemas[READINESS_SCHEMA], "properties", "promotionReadiness") != PROMOTION_READINESS:
        fail("TelephonyEvidenceReadinessAssessment promotionReadiness enum must match Phase 0")
    if enum_at(schemas[CONTINUATION_SCHEMA], "properties", "grantFamilyRecommendation") != CONTINUATION_RECOMMENDATIONS:
        fail("TelephonyContinuationEligibility recommendation enum drifted")
    if enum_at(schemas[MANUAL_REVIEW_SCHEMA], "properties", "triggerClass") != MANUAL_TRIGGERS:
        fail("TelephonyManualReviewDisposition triggerClass enum drifted")

    continuation_text = require_file(CONTINUATION_SCHEMA)
    if "manual_only_creates_no_redeemable_grant" not in continuation_text:
        fail("continuation eligibility schema must explicitly make manual_only no-grant")
    if "no_redeemable_grant" not in continuation_text:
        fail("continuation eligibility schema must expose no_redeemable_grant")

    provider_props = property_names(schemas[PROVIDER_EVENT_SCHEMA])
    forbidden_provider_fields = {"rawPayload", "rawProviderPayload", "vendorSpecificPayload"}
    if provider_props & forbidden_provider_fields:
        fail("provider event schema leaks raw provider payload fields below normalization")
    provider_text = require_file(PROVIDER_EVENT_SCHEMA)
    if "normalization_boundary_only" not in provider_text:
        fail("provider event schema must freeze normalization_boundary_only payload storage")


def validate_transition_matrix() -> None:
    rows = load_csv(TRANSITION_MATRIX)
    if not rows:
        fail("transition matrix is empty")

    seen_states: set[str] = set()
    inbound = {state: 0 for state in CALL_STATES}
    outbound = {state: 0 for state in CALL_STATES}
    forbidden_submit_from: set[str] = set()
    routine_submit_rows = 0

    for row in rows:
        transition_id = row.get("transition_id", "")
        from_state = row.get("from_state", "")
        to_state = row.get("to_state", "")
        allowed = row.get("allowed", "")
        routine_submission_allowed = row.get("routine_submission_allowed", "")
        writes = row.get("resulting_record_writes", "")

        if not transition_id:
            fail("transition row missing transition_id")
        if from_state != "__start__" and from_state not in CALL_STATES:
            fail(f"{transition_id} has unknown from_state {from_state}")
        if to_state not in CALL_STATES:
            fail(f"{transition_id} has unknown to_state {to_state}")
        if allowed not in {"true", "false"}:
            fail(f"{transition_id} allowed must be true or false")
        if routine_submission_allowed not in {"true", "false"}:
            fail(f"{transition_id} routine_submission_allowed must be true or false")

        if from_state in CALL_STATES:
            outbound[from_state] += 1
            seen_states.add(from_state)
        inbound[to_state] += 1
        seen_states.add(to_state)

        if to_state == "submitted" and allowed == "false":
            forbidden_submit_from.add(from_state)

        if routine_submission_allowed == "true":
            routine_submit_rows += 1
            if to_state != "submitted":
                fail(f"{transition_id} allows routine submission without entering submitted state")
            if "TelephonyEvidenceReadinessAssessment:safety_usable:ready_to_promote" not in writes:
                fail(f"{transition_id} allows routine submission without safety_usable ready_to_promote write")
            if "SubmissionPromotionRecord:canonical_intake" not in writes:
                fail(f"{transition_id} allows routine submission without canonical intake promotion")
        elif to_state == "submitted" and allowed == "true":
            fail(f"{transition_id} submits without routine_submission_allowed=true")

    missing_seen = CALL_STATES - seen_states
    if missing_seen:
        fail(f"transition matrix missing states: {', '.join(sorted(missing_seen))}")
    missing_inbound = [state for state, count in inbound.items() if count == 0]
    missing_outbound = [state for state, count in outbound.items() if count == 0]
    if missing_inbound:
        fail(f"states lack explicit inbound transition rules: {', '.join(sorted(missing_inbound))}")
    if missing_outbound:
        fail(f"states lack explicit outbound transition rules: {', '.join(sorted(missing_outbound))}")

    missing_forbidden = REQUIRED_FORBIDDEN_SUBMIT_FROM - forbidden_submit_from
    if missing_forbidden:
        fail(f"missing explicit forbidden routine-submit rows from: {', '.join(sorted(missing_forbidden))}")
    if routine_submit_rows != 1:
        fail("exactly one routine submission transition should be allowed")


def validate_readiness_table() -> None:
    rows = load_csv(READINESS_TABLE)
    if not rows:
        fail("readiness truth table is empty")

    seen_usability: set[str] = set()
    seen_manual_triggers: set[str] = set()
    seen_recommendations: set[str] = set()

    for row in rows:
        case_id = row.get("readiness_case_id", "")
        usability = row.get("usabilityState", "")
        promotion = row.get("promotionReadiness", "")
        routine = row.get("routine_submission_allowed", "")
        recommendation = row.get("continuation_recommendation", "")
        grant = row.get("grant_issuance", "")
        trigger = row.get("manual_review_trigger", "")

        if usability not in USABILITY_STATES:
            fail(f"{case_id} has invalid usabilityState {usability}")
        if promotion not in PROMOTION_READINESS:
            fail(f"{case_id} has invalid promotionReadiness {promotion}")
        if routine not in {"true", "false"}:
            fail(f"{case_id} routine_submission_allowed must be true or false")
        if recommendation not in CONTINUATION_RECOMMENDATIONS:
            fail(f"{case_id} has invalid continuation recommendation {recommendation}")

        seen_usability.add(usability)
        seen_recommendations.add(recommendation)
        if trigger != "none":
            seen_manual_triggers.add(trigger)

        if routine == "true" and not (
            usability == "safety_usable" and promotion == "ready_to_promote"
        ):
            fail(f"{case_id} allows routine submission before safety_usable ready_to_promote")
        if routine == "false" and usability != "safety_usable" and promotion == "ready_to_promote":
            fail(f"{case_id} has ready_to_promote without safety_usable")
        if recommendation == "manual_only" and grant != "no_redeemable_grant":
            fail(f"{case_id} manual_only can issue or imply redeemable grant")
        if grant == "no_redeemable_grant" and recommendation != "manual_only":
            fail(f"{case_id} no-grant row must use manual_only recommendation")
        if recommendation == "continuation_seeded_verified" and grant != "canonical_access_grant_seeded":
            fail(f"{case_id} seeded recommendation must use canonical seeded AccessGrant")
        if recommendation == "continuation_challenge" and grant != "canonical_access_grant_challenge":
            fail(f"{case_id} challenge recommendation must use canonical challenge AccessGrant")

    missing_usability = USABILITY_STATES - seen_usability
    if missing_usability:
        fail(f"readiness truth table missing usability states: {', '.join(sorted(missing_usability))}")
    missing_recommendations = CONTINUATION_RECOMMENDATIONS - seen_recommendations
    if missing_recommendations:
        fail(f"readiness truth table missing continuation recommendations: {', '.join(sorted(missing_recommendations))}")
    missing_triggers = MANUAL_TRIGGERS - seen_manual_triggers
    if missing_triggers:
        fail(f"readiness truth table missing manual triggers: {', '.join(sorted(missing_triggers))}")


def validate_provider_mapping() -> None:
    rows = load_csv(PROVIDER_MAPPING)
    if not rows:
        fail("provider event mapping is empty")

    allowed_boundaries = {"payload_ref_only", "normalized_event_only"}
    for row in rows:
        family = row.get("provider_event_family", "")
        canonical_event = row.get("canonical_event_type", "")
        boundary = row.get("provider_payload_boundary", "")
        consumers = row.get("allowed_domain_consumers", "")
        idempotency = row.get("idempotency_key_basis", "")

        if not family or not canonical_event:
            fail("provider mapping row missing event family or canonical event")
        if boundary not in allowed_boundaries:
            fail(f"{family} leaks provider payload boundary {boundary}")
        if not consumers:
            fail(f"{family} missing allowed domain consumers")
        if not idempotency:
            fail(f"{family} missing idempotency key basis")
        joined = " ".join(row.values()).lower()
        if re.search(r"raw[_ -]?payload|vendor[_ -]?specific|provider json", joined):
            fail(f"{family} leaks provider payload details below normalization boundary")


def validate_gap_log_and_docs() -> None:
    gap_log = load_json(GAP_LOG)
    actual_gap_ids = {item.get("gapId") for item in gap_log.get("gapClosures", [])}
    missing = REQUIRED_GAP_IDS - actual_gap_ids
    if missing:
        fail(f"gap log missing closures: {', '.join(sorted(missing))}")

    docs = {
        "architecture doc": require_file(ARCHITECTURE_DOC),
        "api doc": require_file(API_DOC),
        "security doc": require_file(SECURITY_DOC),
        "frontend spec": require_file(FRONTEND_SPEC),
    }
    required_doc_terms = {
        "TelephonyEvidenceReadinessAssessment",
        "TelephonyContinuationEligibility",
        "TelephonyManualReviewDisposition",
        "manual_only",
        "no redeemable grant",
        "normalization boundary",
        "canonical intake",
    }
    for label, text in docs.items():
        require_markers(label, text, required_doc_terms)
    require_markers("frontend spec", docs["frontend spec"], REQUIRED_SPEC_MARKERS)


def validate_board_and_playwright() -> None:
    board = require_file(BOARD)
    require_markers("telephony readiness board", board, REQUIRED_BOARD_MARKERS)
    for state_name in ["urgent_live_only", "manual_review_only", "manual_only"]:
        if state_name not in board:
            fail(f"board missing {state_name} rendering")
    for source_name in [
        "173_call_state_transition_matrix.csv",
        "173_readiness_truth_table.csv",
        "173_provider_event_mapping.csv",
    ]:
        if source_name not in board:
            fail(f"board does not read {source_name}")

    parity_terms = [
        "call-state-braid",
        "call-state-transition-table",
        "readiness-ladder",
        "readiness-truth-table",
        "continuation-gate-strip",
        "mobile-continuation-preview",
        "mobile-preview-parity",
        "provider-event-mapping-table",
    ]
    for term in parity_terms:
        if term not in board:
            fail(f"board implies or displays missing parity marker {term}")

    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers("playwright spec", spec, REQUIRED_SPEC_MARKERS)
    if "--run" not in spec:
        fail("playwright spec must support --run")


def validate_package_wiring() -> None:
    root_package = load_json(ROOT_PACKAGE)
    scripts = root_package.get("scripts", {})
    validate_script = "validate:phase2-telephony-contracts"
    if scripts.get(validate_script) != "python3 ./tools/analysis/validate_phase2_telephony_contracts.py":
        fail("root package missing validate:phase2-telephony-contracts")
    for script_name in ["bootstrap", "check"]:
        if validate_script not in scripts.get(script_name, ""):
            fail(f"root package {script_name} does not include {validate_script}")

    root_updates = require_file(ROOT_SCRIPT_UPDATES)
    if validate_script not in root_updates:
        fail("root_script_updates.py missing phase2 telephony validation script")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    playwright_scripts = playwright_package.get("scripts", {})
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "173_telephony_readiness_board.spec.js" not in playwright_scripts.get(script_name, ""):
            fail(f"tests/playwright package {script_name} missing 173 telephony board spec")


def validate_checklist_status() -> None:
    checklist = require_file(CHECKLIST)
    if "[-] seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts" not in checklist and (
        "[X] seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts" not in checklist
    ):
        fail("checklist does not show seq_173 claimed or complete")


def main() -> None:
    validate_schemas()
    validate_transition_matrix()
    validate_readiness_table()
    validate_provider_mapping()
    validate_gap_log_and_docs()
    validate_board_and_playwright()
    validate_package_wiring()
    validate_checklist_status()
    print("[phase2-telephony-contracts] ok")


if __name__ == "__main__":
    main()
