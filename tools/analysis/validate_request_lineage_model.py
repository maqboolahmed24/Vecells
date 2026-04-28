#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from build_request_lineage_model import (
    ENDPOINTS,
    ENDPOINT_MATRIX_CSV_PATH,
    ENDPOINT_MATRIX_DOC_PATH,
    ENDPOINT_STATE_MACHINE_MMD_PATH,
    EXTERNAL_TOUCHPOINT_CSV_PATH,
    EXTERNAL_TOUCHPOINT_DOC_PATH,
    EXTERNAL_TOUCHPOINTS,
    GAP_REGISTER,
    GAP_REPORT_DOC_PATH,
    LINEAGE_MODEL_DOC_PATH,
    ORTHOGONAL_BLOCKERS,
    PATIENT_ACTION_CSV_PATH,
    PATIENT_ACTION_DOC_PATH,
    PATIENT_ACTIONS,
    REQUEST_LINEAGE_SEQUENCE,
    REQUEST_SEQUENCE_MMD_PATH,
    STATE_AXES,
    STATE_AXES_DOC_PATH,
    STATE_MACHINES,
    TRANSITIONS_JSON_PATH,
    TRANSITION_RULES_DOC_PATH,
)


MANDATORY_ENDPOINT_IDS = {
    "urgent_diversion",
    "degraded_acceptance_fallback_review",
    "triage_more_info_cycle",
    "duplicate_review",
    "self_care",
    "admin_resolution",
    "clinician_messaging",
    "callback",
    "local_booking",
    "local_waitlist_continuation",
    "network_hub_coordination",
    "pharmacy_first_referral_loop",
    "patient_contact_route_repair",
    "patient_identity_hold_recovery",
    "support_replay_resend_restore",
}

MANDATORY_PATIENT_ACTION_IDS = {
    "action_reply_more_info",
    "action_message_reply",
    "action_callback_response",
    "action_manage_appointment",
    "action_accept_waitlist_offer",
    "action_accept_decline_network_alternative",
    "action_pharmacy_choice",
    "action_pharmacy_consent",
    "action_contact_route_repair",
    "action_identity_correction_recovery",
}

MANDATORY_TOUCHPOINT_IDS = {
    "ext_nhs_login",
    "ext_secure_link_and_notification_rail",
    "ext_telephony_and_ivr_provider",
    "ext_message_delivery_provider",
    "ext_booking_supplier_adapter",
    "ext_network_booking_adapter",
    "ext_practice_ack_delivery_rail",
    "ext_pharmacy_directory",
    "ext_pharmacy_dispatch_transport",
    "ext_pharmacy_outcome_ingest",
    "ext_embedded_host_bridge",
}

EXPECTED_AXIS_IDS = {item["axis_id"] for item in STATE_AXES}
EXPECTED_ENDPOINT_IDS = {item["endpoint_id"] for item in ENDPOINTS}
EXPECTED_PATIENT_ACTION_IDS = {item["action_id"] for item in PATIENT_ACTIONS}
EXPECTED_TOUCHPOINT_IDS = {item["touchpoint_id"] for item in EXTERNAL_TOUCHPOINTS}
EXPECTED_GAP_IDS = {item["item_id"] for item in GAP_REGISTER}
EXPECTED_MACHINE_IDS = {item["machine_id"] for item in STATE_MACHINES}
EXPECTED_BLOCKER_IDS = {item["blocker_id"] for item in ORTHOGONAL_BLOCKERS}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> dict:
    assert_true(path.exists(), f"Missing JSON artifact: {path}")
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_true(path.exists(), f"Missing CSV artifact: {path}")
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing documentation artifact: {path}")
    return path.read_text()


def find_endpoint(payload: dict, endpoint_id: str) -> dict:
    for item in payload["endpoints"]:
        if item["endpoint_id"] == endpoint_id:
            return item
    raise AssertionError(endpoint_id)


def find_action(payload: dict, action_id: str) -> dict:
    for item in payload["patient_actions"]:
        if item["action_id"] == action_id:
            return item
    raise AssertionError(action_id)


def find_touchpoint(payload: dict, touchpoint_id: str) -> dict:
    for item in payload["external_touchpoints"]:
        if item["touchpoint_id"] == touchpoint_id:
            return item
    raise AssertionError(touchpoint_id)


def find_machine(payload: dict, machine_id: str) -> dict:
    for item in payload["state_machines"]:
        if item["machine_id"] == machine_id:
            return item
    raise AssertionError(machine_id)


def validate_payload(payload: dict) -> None:
    assert_true(payload["model_id"] == "request_lineage_model_v1", "Unexpected model_id.")
    assert_true(payload["upstream_inputs"]["requirement_registry_rows"] > 0, "Requirement registry input was not consumed.")
    assert_true(payload["upstream_inputs"]["summary_conflict_rows"] > 0, "Summary conflict input was not consumed.")
    assert_true(payload["upstream_inputs"]["route_family_rows"] > 0, "Route family inventory input was not consumed.")
    assert_true(payload["upstream_inputs"]["conformance_seed_rows"] > 0, "Conformance seed input was not consumed.")

    axis_ids = {item["axis_id"] for item in payload["state_axes"]}
    assert_true(axis_ids == EXPECTED_AXIS_IDS, "State axes drifted from the canonical set.")

    safety_axis = next(item for item in payload["state_axes"] if item["axis_id"] == "safety_state")
    workflow_axis = next(item for item in payload["state_axes"] if item["axis_id"] == "workflow_state")
    identity_axis = next(item for item in payload["state_axes"] if item["axis_id"] == "identity_state")

    assert_true(
        {"urgent_diversion_required", "urgent_diverted"}.issubset(set(safety_axis["allowed_values"])),
        "Safety axis is missing urgent_diversion_required or urgent_diverted.",
    )
    assert_true(
        workflow_axis["allowed_values"]
        == ["submitted", "intake_normalized", "triage_ready", "triage_active", "handoff_active", "outcome_recorded", "closed"],
        "workflowState values drifted from the canonical milestone vocabulary.",
    )
    assert_true("patientRef" in identity_axis["transition_law"], "Identity axis no longer states that patientRef derives from IdentityBinding.")

    blocker_ids = {item["blocker_id"] for item in payload["orthogonal_blockers"]}
    assert_true(blocker_ids == EXPECTED_BLOCKER_IDS, "Closure blocker catalog drifted from the expected blocker set.")

    endpoint_ids = {item["endpoint_id"] for item in payload["endpoints"]}
    assert_true(endpoint_ids == EXPECTED_ENDPOINT_IDS, "Endpoint inventory drifted from the expected set.")
    assert_true(MANDATORY_ENDPOINT_IDS.issubset(endpoint_ids), "Mandatory endpoint coverage is incomplete.")

    for item in payload["endpoints"]:
        for field in [
            "entry_conditions",
            "owning_aggregate",
            "authoritative_success",
            "ambiguity_mode",
            "recovery_path",
            "patient_actionability",
            "request_milestone_effect",
            "closure_rule",
        ]:
            assert_true(bool(item[field]), f"{item['endpoint_id']} is missing {field}.")
        assert_true(bool(item["source_refs"]), f"{item['endpoint_id']} is missing source refs.")

    for aggregate_name in [
        "AdminResolutionCase",
        "ClinicianMessageThread",
        "CallbackCase",
        "BookingCase",
        "HubCoordinationCase",
        "PharmacyCase",
    ]:
        assert_true(
            any(aggregate_name in item["owning_aggregate"] for item in payload["endpoints"])
            or any(aggregate_name == item["aggregate_name"] for item in payload["child_aggregates"]),
            f"{aggregate_name} is missing from the endpoint or child aggregate model.",
        )

    urgent = find_endpoint(payload, "urgent_diversion")
    assert_true("UrgentDiversionSettlement" in urgent["authoritative_success"], "Urgent diversion lacks explicit settlement proof.")
    assert_true("urgent_diversion_required" in urgent["ambiguity_mode"], "Urgent diversion no longer keeps urgent_diversion_required distinct.")

    more_info = find_endpoint(payload, "triage_more_info_cycle")
    for token in ["late_review", "expired", "superseded"]:
        assert_true(token in more_info["ambiguity_mode"], f"More-info cycle ambiguity is missing {token}.")
    assert_true("MoreInfoResponseDisposition" in more_info["authoritative_success"], "More-info cycle lacks response disposition proof.")

    booking = find_endpoint(payload, "local_booking")
    assert_true("BookingConfirmationTruthProjection" in booking["authoritative_success"], "Local booking lacks confirmation truth projection.")
    assert_true("ExternalConfirmationGate" in booking["ambiguity_mode"], "Local booking ambiguity no longer references ExternalConfirmationGate.")
    assert_true("LifecycleCoordinator" in booking["closure_rule"], "Local booking no longer defers closure to LifecycleCoordinator.")

    waitlist = find_endpoint(payload, "local_waitlist_continuation")
    assert_true("callback" in waitlist["recovery_path"].lower(), "Waitlist continuation no longer falls back to callback.")
    assert_true("hub" in waitlist["recovery_path"].lower(), "Waitlist continuation no longer falls back to hub.")

    hub = find_endpoint(payload, "network_hub_coordination")
    assert_true("expired" in hub["ambiguity_mode"], "Hub coordination no longer keeps offer expiry explicit.")
    assert_true("ack" in hub["ambiguity_mode"].lower(), "Hub coordination no longer keeps practice acknowledgement debt explicit.")
    assert_true(
        "return_to_practice" in hub["recovery_path"] or "return to practice" in hub["recovery_path"].lower(),
        "Hub coordination no longer keeps return-to-practice in hub ownership.",
    )

    pharmacy = find_endpoint(payload, "pharmacy_first_referral_loop")
    assert_true("PharmacyConsentCheckpoint" in pharmacy["authoritative_success"], "Pharmacy loop no longer requires consent checkpoint truth.")
    assert_true("PharmacyDispatchAttempt" in pharmacy["authoritative_success"], "Pharmacy loop no longer requires dispatch proof truth.")
    assert_true(
        "outcome_reconciliation_pending" in pharmacy["ambiguity_mode"] or "weak" in pharmacy["ambiguity_mode"].lower(),
        "Pharmacy loop no longer keeps weak or ambiguous outcome states explicit.",
    )
    assert_true("LifecycleCoordinator" in pharmacy["closure_rule"], "Pharmacy loop no longer defers closure to LifecycleCoordinator.")

    identity = find_endpoint(payload, "patient_identity_hold_recovery")
    assert_true("IdentityRepairCase" in identity["owning_aggregate"], "Identity hold no longer routes through IdentityRepairCase.")

    support = find_endpoint(payload, "support_replay_resend_restore")
    assert_true("SupportReplayRestoreSettlement" in support["authoritative_success"], "Support replay / restore no longer requires restore settlement.")

    action_ids = {item["action_id"] for item in payload["patient_actions"]}
    assert_true(action_ids == EXPECTED_PATIENT_ACTION_IDS, "Patient action inventory drifted from the expected set.")
    assert_true(MANDATORY_PATIENT_ACTION_IDS.issubset(action_ids), "Mandatory patient actions are missing.")

    for item in payload["patient_actions"]:
        for field in [
            "route_context",
            "route_intent_binding",
            "command_semantics",
            "freshness_check",
            "safety_preemption_rule",
            "recovery_behavior",
        ]:
            assert_true(bool(item[field]), f"{item['action_id']} is missing {field}.")
        assert_true(bool(item["source_refs"]), f"{item['action_id']} is missing source refs.")

    pharmacy_choice = find_action(payload, "action_pharmacy_choice")
    assert_true("/pharmacy/:pharmacyCaseId/choose" in pharmacy_choice["route_context"], "Pharmacy choice route context drifted.")

    contact_repair = find_action(payload, "action_contact_route_repair")
    assert_true("same current patient shell" in contact_repair["route_context"].lower(), "Contact-route repair is no longer same-shell.")

    identity_recovery = find_action(payload, "action_identity_correction_recovery")
    assert_true("IdentityRepairCase" in identity_recovery["route_intent_binding"], "Identity correction no longer binds IdentityRepairCase.")

    touchpoint_ids = {item["touchpoint_id"] for item in payload["external_touchpoints"]}
    assert_true(touchpoint_ids == EXPECTED_TOUCHPOINT_IDS, "External touchpoint inventory drifted from the expected set.")
    assert_true(MANDATORY_TOUCHPOINT_IDS.issubset(touchpoint_ids), "Mandatory external touchpoints are missing.")
    deferred_touchpoints = [item["touchpoint_id"] for item in payload["external_touchpoints"] if item["scope_posture"] == "deferred"]
    assert_true(deferred_touchpoints == ["ext_embedded_host_bridge"], "Only the embedded host bridge should be deferred in this pack.")

    gap_ids = {item["item_id"] for item in payload["gap_register"]}
    assert_true(gap_ids == EXPECTED_GAP_IDS, "Gap register drifted from the expected set.")

    machine_ids = {item["machine_id"] for item in payload["state_machines"]}
    assert_true(machine_ids == EXPECTED_MACHINE_IDS, "State machine inventory drifted from the expected set.")

    request_machine = find_machine(payload, "request_workflow_state")
    assert_true(
        any(
            item["from_state"] == "outcome_recorded"
            and item["to_state"] == "closed"
            and "RequestClosureRecord" in "; ".join(item["proof_objects"])
            for item in request_machine["transitions"]
        ),
        "Request workflow state machine no longer closes through RequestClosureRecord.",
    )

    more_info_machine = find_machine(payload, "more_info_cycle_state")
    assert_true(
        any(item["to_state"] == "expired" for item in more_info_machine["transitions"])
        and any(item["to_state"] == "superseded" for item in more_info_machine["transitions"]),
        "More-info state machine no longer models expiry and supersession explicitly.",
    )

    booking_machine = find_machine(payload, "booking_case_state")
    booking_states = set(booking_machine["states"])
    assert_true(
        {"confirmation_pending", "supplier_reconciliation_pending", "waitlisted"}.issubset(booking_states),
        "Booking state machine no longer preserves pending or reconciliation states.",
    )

    waitlist_machine = find_machine(payload, "waitlist_continuation_state")
    assert_true(
        {"callback_expected", "hub_review_pending", "expired"}.issubset(set(waitlist_machine["states"])),
        "Waitlist state machine no longer preserves callback/hub/expired continuation states.",
    )

    hub_machine = find_machine(payload, "hub_coordination_case_state")
    assert_true(
        {"booked_pending_practice_ack", "callback_transfer_pending", "escalated_back"}.issubset(set(hub_machine["states"])),
        "Hub state machine no longer preserves practice-ack, callback transfer, or escalated-back states.",
    )

    pharmacy_machine = find_machine(payload, "pharmacy_case_state")
    assert_true(
        {"outcome_reconciliation_pending", "no_contact_return_pending", "urgent_bounce_back"}.issubset(set(pharmacy_machine["states"])),
        "Pharmacy state machine no longer preserves reconciliation, no-contact, or urgent return states.",
    )


def validate_csvs(payload: dict) -> None:
    endpoint_rows = load_csv(ENDPOINT_MATRIX_CSV_PATH)
    patient_action_rows = load_csv(PATIENT_ACTION_CSV_PATH)
    touchpoint_rows = load_csv(EXTERNAL_TOUCHPOINT_CSV_PATH)

    assert_true(len(endpoint_rows) == len(ENDPOINTS), "Endpoint CSV row count drifted.")
    assert_true(len(patient_action_rows) == len(PATIENT_ACTIONS), "Patient-action CSV row count drifted.")
    assert_true(len(touchpoint_rows) == len(EXTERNAL_TOUCHPOINTS), "External-touchpoint CSV row count drifted.")

    assert_true(
        {row["endpoint_id"] for row in endpoint_rows} == EXPECTED_ENDPOINT_IDS,
        "Endpoint CSV IDs do not match the JSON model.",
    )
    assert_true(
        {row["action_id"] for row in patient_action_rows} == EXPECTED_PATIENT_ACTION_IDS,
        "Patient-action CSV IDs do not match the JSON model.",
    )
    assert_true(
        {row["touchpoint_id"] for row in touchpoint_rows} == EXPECTED_TOUCHPOINT_IDS,
        "Touchpoint CSV IDs do not match the JSON model.",
    )

    for row in endpoint_rows:
        assert_true(bool(row["authoritative_success"]), f"{row['endpoint_id']} CSV row is missing authoritative_success.")
        assert_true(bool(row["ambiguity_mode"]), f"{row['endpoint_id']} CSV row is missing ambiguity_mode.")
        assert_true(bool(row["recovery_path"]), f"{row['endpoint_id']} CSV row is missing recovery_path.")
        assert_true(bool(row["source_refs"]), f"{row['endpoint_id']} CSV row is missing source_refs.")

    for row in patient_action_rows:
        for field in [
            "route_intent_binding",
            "command_semantics",
            "freshness_check",
            "safety_preemption_rule",
            "recovery_behavior",
            "source_refs",
        ]:
            assert_true(bool(row[field]), f"{row['action_id']} CSV row is missing {field}.")

    for row in touchpoint_rows:
        for field in [
            "interaction_purpose",
            "required_proof",
            "ambiguity_mode",
            "degraded_fallback",
            "scope_posture",
            "source_refs",
        ]:
            assert_true(bool(row[field]), f"{row['touchpoint_id']} CSV row is missing {field}.")


def validate_docs() -> None:
    model_doc = load_text(LINEAGE_MODEL_DOC_PATH)
    axes_doc = load_text(STATE_AXES_DOC_PATH)
    endpoint_doc = load_text(ENDPOINT_MATRIX_DOC_PATH)
    transitions_doc = load_text(TRANSITION_RULES_DOC_PATH)
    action_doc = load_text(PATIENT_ACTION_DOC_PATH)
    touchpoint_doc = load_text(EXTERNAL_TOUCHPOINT_DOC_PATH)
    gap_doc = load_text(GAP_REPORT_DOC_PATH)
    sequence_mmd = load_text(REQUEST_SEQUENCE_MMD_PATH)
    state_mmd = load_text(ENDPOINT_STATE_MACHINE_MMD_PATH)

    for token in [
        "Request Lineage Model",
        "LifecycleCoordinator is the only cross-domain authority",
        "Lineage Stages",
        "Child Aggregate Ownership Model",
    ]:
        assert_true(token in model_doc, f"Lineage model doc missing token: {token}")

    for token in [
        "Orthogonal Axes",
        "urgent_diversion_required",
        "urgent_diverted",
        "Request.workflowState",
        "Closure Blocker Classes",
    ]:
        assert_true(token in axes_doc, f"State axes doc missing token: {token}")

    for token in [
        "Urgent diversion",
        "Degraded acceptance and fallback review",
        "Local waitlist continuation",
        "Network / hub coordination",
        "Pharmacy First referral loop",
        "Support replay, resend, and restore touchpoints",
    ]:
        assert_true(token in endpoint_doc, f"Endpoint matrix doc missing token: {token}")

    for token in [
        "Global Guard Rules",
        "request_workflow_state",
        "more_info_cycle_state",
        "hub_coordination_case_state",
        "pharmacy_case_state",
    ]:
        assert_true(token in transitions_doc, f"Transition rules doc missing token: {token}")

    for token in [
        "Reply to more-info",
        "Pharmacy choice",
        "Pharmacy consent",
        "Contact-route repair",
        "Identity correction or recovery",
    ]:
        assert_true(token in action_doc, f"Patient action doc missing token: {token}")

    for token in [
        "External Touchpoint Matrix",
        "NHS login rail",
        "Local booking supplier adapter",
        "Pharmacy referral transport adapter",
        "Trusted embedded host bridge",
    ]:
        assert_true(token in touchpoint_doc, f"External touchpoint doc missing token: {token}")

    for gap_id in EXPECTED_GAP_IDS:
        assert_true(gap_id in gap_doc, f"Gap report doc missing {gap_id}.")

    for token in [
        "SubmissionPromotionRecord",
        "MoreInfoCycle",
        "SupportReplayRestoreSettlement",
        "RequestClosureRecord",
    ]:
        assert_true(token in sequence_mmd, f"Sequence mermaid missing token: {token}")

    for token in [
        "DuplicateReview",
        "UrgentRequired",
        "ConfirmationPending",
        "ContactRepair",
        "Closed --> [*]",
    ]:
        assert_true(token in state_mmd, f"State-machine mermaid missing token: {token}")

    assert_true(sequence_mmd.strip() == REQUEST_LINEAGE_SEQUENCE.strip(), "Sequence mermaid drifted from the generator.")


def main() -> None:
    payload = load_json(TRANSITIONS_JSON_PATH)
    validate_payload(payload)
    validate_csvs(payload)
    validate_docs()
    print("request_lineage_model validation passed")


if __name__ == "__main__":
    main()
