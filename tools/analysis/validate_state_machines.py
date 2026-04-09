#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

from build_state_machine_atlas import (
    ATLAS_DOC_PATH,
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    GUARD_MATRIX_CSV_PATH,
    GUARDS_DOC_PATH,
    ILLEGAL_DOC_PATH,
    ILLEGAL_TRANSITIONS_JSON_PATH,
    INVARIANTS_DOC_PATH,
    INVARIANTS_JSON_PATH,
    MANDATORY_INVARIANT_IDS,
    MANDATORY_MACHINE_NAMES,
    RELATIONSHIPS_MMD_PATH,
    SOURCE_PRECEDENCE,
    STATE_MACHINES_JSON_PATH,
    TRANSITION_TABLE_CSV_PATH,
    TRANSITIONS_DOC_PATH,
    build_invariants,
    build_machine_specs,
    ensure_prerequisites,
    load_json,
    object_lookup,
)


DELIVERABLES = [
    STATE_MACHINES_JSON_PATH,
    TRANSITION_TABLE_CSV_PATH,
    INVARIANTS_JSON_PATH,
    GUARD_MATRIX_CSV_PATH,
    ILLEGAL_TRANSITIONS_JSON_PATH,
    ATLAS_DOC_PATH,
    INVARIANTS_DOC_PATH,
    TRANSITIONS_DOC_PATH,
    GUARDS_DOC_PATH,
    ILLEGAL_DOC_PATH,
    ATLAS_HTML_PATH,
    RELATIONSHIPS_MMD_PATH,
]

ALLOWED_AXIS_TYPES = {
    "lifecycle",
    "workflow",
    "identity",
    "safety",
    "settlement",
    "gate",
    "lease",
    "publication",
    "trust",
    "continuity",
    "case_local",
    "other",
}

CANONICAL_MACHINES = {
    "SubmissionEnvelope.state",
    "Request.workflowState",
    "Request.safetyState",
    "Request.identityState",
    "Episode.state",
    "TelephonyEvidenceReadinessAssessment.usabilityState",
    "TelephonyContinuationEligibility.eligibilityState",
    "IdentityBinding.bindingState",
    "Session.sessionState",
    "Session.routeAuthorityState",
    "AccessGrant.grantState",
    "DuplicateCluster.reviewStatus",
    "FallbackReviewCase.patientVisibleState",
    "RequestLifecycleLease.state",
    "RequestClosureRecord.decision",
    "CapacityReservation.state",
    "ExternalConfirmationGate.state",
    "RouteIntentBinding.bindingState",
    "CommandSettlementRecord.authoritativeOutcomeState",
    "AudienceSurfaceRuntimeBinding.bindingState",
}

EXPECTED_COORDINATOR_OWNED = {
    "Request.workflowState",
    "Episode.state",
    "RequestClosureRecord.decision",
}

CHILD_DOMAIN_NOTE_TOKENS = {
    "TriageTask.status": "does not own canonical Request.workflowState",
    "CallbackCase.state": "LifecycleCoordinator",
    "ClinicianMessageThread.state": "transport success",
    "BookingCase.status": "must never be copied into Request.workflowState",
    "HubCoordinationCase.status": "truth projection",
    "PharmacyCase.status": "case-local only",
    "AdminResolutionCase.state": "reopen boundary review",
}

MANDATORY_STATE_VALUES = {
    "Request.safetyState": {
        "urgent_diversion_required",
        "urgent_diverted",
    },
    "MoreInfoReplyWindowCheckpoint.replyWindowState": {
        "late_review",
        "expired",
        "superseded",
        "settled",
    },
    "CallbackCase.state": {
        "awaiting_outcome_evidence",
        "contact_route_repair_pending",
        "awaiting_retry",
        "reopened",
    },
    "ClinicianMessageThread.state": {
        "delivery_failed",
        "contact_route_repair_pending",
        "reopened",
    },
    "BookingCase.status": {
        "confirmation_pending",
        "supplier_reconciliation_pending",
        "waitlisted",
        "fallback_to_hub",
        "callback_fallback",
    },
    "WaitlistFallbackObligation.transferState": {
        "armed",
        "transfer_pending",
        "transferred",
    },
    "HubCoordinationCase.status": {
        "callback_transfer_pending",
        "confirmation_pending",
        "booked_pending_practice_ack",
    },
    "HubOfferToConfirmationTruthProjection.confirmationTruthState": {
        "confirmation_pending",
        "confirmed_pending_practice_ack",
        "disputed",
        "expired",
    },
    "PharmacyCase.status": {
        "consent_pending",
        "outcome_reconciliation_pending",
        "urgent_bounce_back",
        "no_contact_return_pending",
    },
    "PharmacyDispatchAttempt.status": {
        "transport_accepted",
        "proof_pending",
        "proof_satisfied",
        "reconciliation_required",
    },
    "AssistiveCapabilityTrustEnvelope.trustState": {
        "degraded",
        "quarantined",
        "frozen",
    },
    "AudienceSurfaceRuntimeBinding.bindingState": {
        "publishable_live",
        "recovery_only",
        "read_only",
        "blocked",
    },
    "ResilienceSurfaceRuntimeBinding.bindingState": {
        "live",
        "diagnostic_only",
        "recovery_only",
        "blocked",
    },
    "CrossPhaseConformanceScorecard.scorecardState": {
        "blocked",
        "stale",
        "exact",
    },
}

MANDATORY_ISSUE_IDS = {
    "ISSUE_SM_REQUEST_WORKFLOW_STATE_TRIAGE_ACTIVE_CONFIRMATION_PENDING",
    "ISSUE_SM_REQUEST_SAFETY_STATE_URGENT_DIVERSION_REQUIRED_SCREEN_CLEAR",
    "ISSUE_SM_MORE_INFO_REPLY_WINDOW_EXPIRED_SETTLED",
    "ISSUE_SM_CALLBACK_CASE_STATE_ATTEMPT_IN_PROGRESS_COMPLETED",
    "ISSUE_SM_CLINICIAN_MESSAGE_THREAD_SENT_CLOSED",
    "ISSUE_SM_WAITLIST_FALLBACK_TRANSFER_ARMED_SATISFIED",
    "ISSUE_SM_HUB_COORDINATION_CASE_STATUS_CONFIRMATION_PENDING_BOOKED",
    "ISSUE_SM_PHARMACY_DISPATCH_STATUS_TRANSPORT_ACCEPTED_PROOF_SATISFIED",
    "ISSUE_SM_PHARMACY_CASE_STATUS_OUTCOME_RECONCILIATION_PENDING_OUTCOME_RECORDED",
    "ISSUE_SM_ASSISTIVE_TRUST_ENVELOPE_DEGRADED_TRUSTED",
    "ISSUE_SM_CROSS_PHASE_SCORECARD_BLOCKED_EXACT",
}

KNOWN_UPSTREAM_OBJECT_GAPS = {
    "GovernanceContinuityEvidenceBundle",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_true(path.exists(), f"Missing CSV artifact: {path}")
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing documentation artifact: {path}")
    return path.read_text()


def find_machine(atlas: dict, canonical_name: str) -> dict:
    for row in atlas["machines"]:
        if row["canonical_name"] == canonical_name:
            return row
    raise AssertionError(canonical_name)


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_007 deliverable: {path}")


def validate_prerequisites() -> dict[str, int]:
    upstream = ensure_prerequisites()
    for key, value in upstream.items():
        assert_true(value > 0, f"Upstream input is empty: {key}")
    return upstream


def validate_machine_payload(atlas: dict, invariants: dict, illegal_payload: dict, upstream: dict[str, int]) -> None:
    assert_true(atlas["atlas_id"] == "vecells_state_machine_atlas_v1", "Unexpected atlas_id.")
    assert_true(atlas["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted.")
    assert_true(atlas["upstream_inputs"] == upstream, "Upstream input metadata drifted.")

    machines = atlas["machines"]
    summary = atlas["summary"]
    expected_specs = build_machine_specs()
    expected_names = {spec.canonical_name for spec in expected_specs}
    expected_ids = {spec.machine_id for spec in expected_specs}

    machine_names = {row["canonical_name"] for row in machines}
    machine_ids = {row["machine_id"] for row in machines}
    assert_true(len(machines) == len(expected_specs), "Machine count drifted from the generator.")
    assert_true(machine_names == expected_names, "Machine canonical names drifted from the generator.")
    assert_true(machine_ids == expected_ids, "Machine IDs drifted from the generator.")
    assert_true(MANDATORY_MACHINE_NAMES.issubset(machine_names), "Mandatory machine coverage is incomplete.")

    assert_true(summary["machine_count"] == len(machines), "Machine summary count mismatch.")
    assert_true(summary["state_count"] == sum(len(row["states"]) for row in machines), "State summary count mismatch.")
    assert_true(
        summary["transition_count"] == sum(len(row["legal_transitions"]) for row in machines),
        "Transition summary count mismatch.",
    )
    assert_true(
        summary["guard_count"] == len({guard for row in machines for guard in row["required_guards"]}),
        "Guard summary count mismatch.",
    )
    assert_true(
        summary["proof_count"] == len({proof for row in machines for proof in row["required_authoritative_proofs"]}),
        "Proof summary count mismatch.",
    )
    assert_true(summary["invariant_count"] == len(invariants["invariants"]), "Invariant summary count mismatch.")
    assert_true(
        summary["conflict_count"] == illegal_payload["summary"]["total_conflict_count"],
        "Conflict summary count mismatch.",
    )

    catalog_lookup = object_lookup()
    coordinator_owned_names = {
        row["canonical_name"]
        for row in machines
        if row["whether_transition_is_coordinator_owned"]
    }
    assert_true(
        coordinator_owned_names == EXPECTED_COORDINATOR_OWNED,
        "Coordinator-owned machine coverage drifted from the canonical set.",
    )

    all_transition_ids: set[str] = set()
    all_state_usage: dict[str, set[str]] = {}

    for row in machines:
        for key in [
            "machine_id",
            "canonical_name",
            "owning_object_id",
            "owning_object_name",
            "state_axis_type",
            "machine_family",
            "bounded_context",
            "phase_tags",
            "source_file",
            "source_heading_or_block",
            "supporting_source_refs",
            "states",
            "initial_state",
            "terminal_states",
            "supersession_states",
            "legal_transitions",
            "illegal_transitions",
            "transition_triggers",
            "required_guards",
            "required_authoritative_proofs",
            "required_related_objects",
            "degraded_or_recovery_states",
            "closure_blocker_interactions",
            "whether_transition_is_coordinator_owned",
            "related_machine_ids",
            "notes",
        ]:
            assert_true(key in row, f"{row.get('machine_id', 'unknown')} is missing field {key}.")

        assert_true(row["state_axis_type"] in ALLOWED_AXIS_TYPES, f"{row['machine_id']} uses invalid state_axis_type.")
        assert_true(row["owning_object_name"] in catalog_lookup, f"{row['machine_id']} points at unknown owning object.")
        assert_true(
            row["owning_object_id"] == catalog_lookup[row["owning_object_name"]]["object_id"],
            f"{row['machine_id']} owning object ID drifted from object catalog.",
        )
        assert_true(bool(row["notes"]), f"{row['machine_id']} is missing notes.")

        states = row["states"]
        state_values = [state["value"] for state in states]
        assert_true(states, f"{row['machine_id']} has no states.")
        assert_true(len(state_values) == len(set(state_values)), f"{row['machine_id']} has duplicate state values.")
        assert_true(row["initial_state"] in state_values, f"{row['machine_id']} initial state is invalid.")
        assert_true(
            set(row["terminal_states"]).issubset(state_values),
            f"{row['machine_id']} terminal states are not all in the state list.",
        )
        assert_true(
            set(row["supersession_states"]).issubset(state_values),
            f"{row['machine_id']} supersession states are not all in the state list.",
        )

        for state in states:
            all_state_usage.setdefault(state["value"], set()).add(row["machine_id"])

        transition_ids = []
        union_guards: set[str] = set()
        union_proofs: set[str] = set()
        union_related_objects: set[str] = set()
        union_degraded_states: set[str] = {
            state["value"]
            for state in states
            if state["classification"] in {"degraded", "recovery", "supersession"}
        }

        for transition in row["legal_transitions"]:
            transition_ids.append(transition["transition_id"])
            all_transition_ids.add(transition["transition_id"])

            assert_true(
                transition["from_state"] in state_values and transition["to_state"] in state_values,
                f"{transition['transition_id']} points at an unknown state.",
            )
            assert_true(bool(transition["trigger"]), f"{transition['transition_id']} is missing a trigger.")
            assert_true(bool(transition["guards"]), f"{transition['transition_id']} is missing guards.")
            assert_true(bool(transition["authoritative_proofs"]), f"{transition['transition_id']} is missing authoritative proofs.")
            assert_true(bool(transition["related_objects"]), f"{transition['transition_id']} is missing related objects.")
            assert_true(bool(transition["source_refs"]), f"{transition['transition_id']} is missing source refs.")

            union_guards.update(transition["guards"])
            union_proofs.update(transition["authoritative_proofs"])
            union_related_objects.update(transition["related_objects"])
            if transition["degraded_posture"]:
                union_degraded_states.add(transition["degraded_posture"])

        assert_true(len(transition_ids) == len(set(transition_ids)), f"{row['machine_id']} has duplicate transition IDs.")
        assert_true(
            row["transition_triggers"] == [transition["trigger"] for transition in row["legal_transitions"]],
            f"{row['machine_id']} transition triggers drifted from legal transition order.",
        )
        assert_true(set(row["required_guards"]) == union_guards, f"{row['machine_id']} required guards drifted.")
        assert_true(
            set(row["required_authoritative_proofs"]) == union_proofs,
            f"{row['machine_id']} required authoritative proofs drifted.",
        )
        assert_true(
            set(row["required_related_objects"]) == union_related_objects,
            f"{row['machine_id']} required related objects drifted.",
        )
        assert_true(
            set(row["degraded_or_recovery_states"]) == union_degraded_states,
            f"{row['machine_id']} degraded/recovery state coverage drifted.",
        )

        if row["canonical_name"] in CANONICAL_MACHINES:
            assert_true(
                row["machine_family"] == "canonical_shared_control",
                f"{row['canonical_name']} must remain canonical_shared_control.",
            )

        if row["canonical_name"] in CHILD_DOMAIN_NOTE_TOKENS:
            token = CHILD_DOMAIN_NOTE_TOKENS[row["canonical_name"]]
            assert_true(token in row["notes"], f"{row['canonical_name']} notes lost required ownership guard.")
            assert_true(
                row["whether_transition_is_coordinator_owned"] is False,
                f"{row['canonical_name']} must stay case-local, not coordinator-owned.",
            )

    duplicate_terms = {
        state_value: sorted(machine_ids)
        for state_value, machine_ids in all_state_usage.items()
        if len(machine_ids) > 1
    }
    conflict_lookup = {
        row["state_value"]: sorted(row["machine_ids"])
        for row in illegal_payload["state_term_conflicts"]
    }
    assert_true(conflict_lookup == duplicate_terms, "Reused state-term conflicts drifted from actual state reuse.")

    for canonical_name, required_states in MANDATORY_STATE_VALUES.items():
        machine = find_machine(atlas, canonical_name)
        state_values = {state["value"] for state in machine["states"]}
        assert_true(
            required_states.issubset(state_values),
            f"{canonical_name} is missing mandatory gap-closure states: {sorted(required_states - state_values)}",
        )

    closure_machine = find_machine(atlas, "RequestClosureRecord.decision")
    closure_guard_text = " ".join(closure_machine["required_guards"])
    assert_true("blockingDuplicateClusterRefs" in closure_guard_text, "Closure guard lost duplicate blocker coverage.")
    assert_true("blockingFallbackCaseRefs" in closure_guard_text, "Closure guard lost fallback blocker coverage.")
    assert_true("blockingIdentityRepairRefs" in closure_guard_text, "Closure guard lost identity blocker coverage.")
    assert_true("blockingGrantRefs" in closure_guard_text, "Closure guard lost grant blocker coverage.")
    assert_true("blockingReachabilityRefs" in closure_guard_text, "Closure guard lost reachability blocker coverage.")
    assert_true("blockingConfirmationRefs" in closure_guard_text, "Closure guard lost confirmation blocker coverage.")
    assert_true("blockingReconciliationRefs" in closure_guard_text, "Closure guard lost reconciliation blocker coverage.")

    workflow_machine = find_machine(atlas, "Request.workflowState")
    assert_true(
        {state["value"] for state in workflow_machine["states"]}
        == {
            "submitted",
            "intake_normalized",
            "triage_ready",
            "triage_active",
            "handoff_active",
            "outcome_recorded",
            "closed",
        },
        "Request.workflowState drifted from the milestone-only vocabulary.",
    )


def validate_invariants(invariant_payload: dict, illegal_payload: dict, atlas: dict) -> None:
    assert_true(invariant_payload["library_id"] == "vecells_cross_phase_invariants_v1", "Unexpected invariant library_id.")
    rows = invariant_payload["invariants"]
    expected = build_invariants()
    expected_ids = {row.invariant_id for row in expected}
    actual_ids = {row["invariant_id"] for row in rows}

    assert_true(len(rows) == len(expected), "Invariant count drifted from the generator.")
    assert_true(actual_ids == expected_ids, "Invariant IDs drifted from the generator.")
    assert_true(MANDATORY_INVARIANT_IDS.issubset(actual_ids), "Mandatory invariant coverage is incomplete.")
    assert_true(
        invariant_payload["summary"]["invariant_count"] == len(rows),
        "Invariant summary count mismatch.",
    )
    assert_true(
        invariant_payload["summary"]["phase_scope_count"] == len({phase for row in rows for phase in row["phase_scope"]}),
        "Invariant phase-scope count mismatch.",
    )

    machine_ids = {row["machine_id"] for row in atlas["machines"]}
    known_issue_ids = {row["issue_id"] for row in illegal_payload["illegal_transition_rows"]}
    known_objects = set(object_lookup()) | KNOWN_UPSTREAM_OBJECT_GAPS

    for row in rows:
        assert_true(bool(row["canonical_wording"]), f"{row['invariant_id']} is missing canonical wording.")
        assert_true(bool(row["scope"]), f"{row['invariant_id']} is missing scope.")
        assert_true(bool(row["affected_machine_ids"]), f"{row['invariant_id']} is missing affected machines.")
        assert_true(bool(row["affected_objects"]), f"{row['invariant_id']} is missing affected objects.")
        assert_true(bool(row["related_guards"]), f"{row['invariant_id']} is missing related guards.")
        assert_true(bool(row["related_proofs"]), f"{row['invariant_id']} is missing related proofs.")
        assert_true(bool(row["source_refs"]), f"{row['invariant_id']} is missing source refs.")
        assert_true(bool(row["test_hint"]), f"{row['invariant_id']} is missing test hint.")
        assert_true(bool(row["phase_scope"]), f"{row['invariant_id']} is missing phase scope.")
        assert_true(set(row["affected_machine_ids"]).issubset(machine_ids), f"{row['invariant_id']} references unknown machines.")
        assert_true(set(row["affected_objects"]).issubset(known_objects), f"{row['invariant_id']} references unknown objects.")
        assert_true(
            set(row["violating_transition_refs"]).issubset(known_issue_ids),
            f"{row['invariant_id']} references unknown illegal-transition IDs.",
        )


def validate_illegal_payload(illegal_payload: dict, atlas: dict, invariant_payload: dict) -> None:
    assert_true(illegal_payload["register_id"] == "vecells_illegal_transitions_v1", "Unexpected illegal register_id.")
    illegal_rows = illegal_payload["illegal_transition_rows"]
    conflict_rows = illegal_payload["state_term_conflicts"]

    assert_true(
        illegal_payload["summary"]["illegal_transition_count"] == len(illegal_rows),
        "Illegal-transition summary count mismatch.",
    )
    assert_true(
        illegal_payload["summary"]["state_term_conflict_count"] == len(conflict_rows),
        "State-term conflict summary count mismatch.",
    )
    assert_true(
        illegal_payload["summary"]["total_conflict_count"] == len(illegal_rows) + len(conflict_rows),
        "Total conflict summary count mismatch.",
    )

    machine_ids = {row["machine_id"] for row in atlas["machines"]}
    invariant_ids = {row["invariant_id"] for row in invariant_payload["invariants"]}
    issue_ids = set()

    for row in illegal_rows:
        issue_ids.add(row["issue_id"])
        assert_true(row["machine_id"] in machine_ids, f"{row['issue_id']} references unknown machine.")
        assert_true(bool(row["dangerous_interpretation"]), f"{row['issue_id']} is missing dangerous interpretation.")
        assert_true(bool(row["canonical_correction"]), f"{row['issue_id']} is missing canonical correction.")
        assert_true(bool(row["source_refs"]), f"{row['issue_id']} is missing source refs.")
        assert_true(bool(row["forensic_refs"]), f"{row['issue_id']} is missing forensic refs.")
        assert_true(
            set(row["related_invariant_ids"]).issubset(invariant_ids),
            f"{row['issue_id']} references unknown invariant IDs.",
        )

    assert_true(MANDATORY_ISSUE_IDS.issubset(issue_ids), "Mandatory illegal-transition coverage is incomplete.")

    for row in conflict_rows:
        assert_true(bool(row["machine_ids"]), f"{row['issue_id']} is missing machine bindings.")
        assert_true(len(row["machine_ids"]) > 1, f"{row['issue_id']} must bind more than one machine.")
        assert_true(bool(row["canonical_correction"]), f"{row['issue_id']} is missing canonical correction.")


def validate_csvs(atlas: dict) -> None:
    transition_rows = load_csv(TRANSITION_TABLE_CSV_PATH)
    guard_rows = load_csv(GUARD_MATRIX_CSV_PATH)

    expected_transition_count = atlas["summary"]["transition_count"]
    assert_true(len(transition_rows) == expected_transition_count, "Transition CSV row count mismatch.")
    assert_true(len(guard_rows) == expected_transition_count, "Guard matrix row count mismatch.")

    transition_ids = {row["transition_id"] for row in transition_rows}
    guard_transition_ids = {row["transition_id"] for row in guard_rows}
    assert_true(transition_ids == guard_transition_ids, "Guard matrix drifted from transition CSV.")

    for row in transition_rows:
        for field in [
            "transition_id",
            "machine_id",
            "canonical_name",
            "from_state",
            "to_state",
            "trigger",
            "guards",
            "authoritative_proofs",
            "related_objects",
            "source_refs",
        ]:
            assert_true(bool(row[field]), f"Transition CSV field {field} is empty for {row.get('transition_id', '?')}.")

    for row in guard_rows:
        for field in [
            "transition_id",
            "machine_id",
            "canonical_name",
            "from_state",
            "to_state",
            "trigger",
            "guards",
            "authoritative_proofs",
            "degraded_posture_if_missing",
            "source_refs",
        ]:
            assert_true(bool(row[field]), f"Guard CSV field {field} is empty for {row.get('transition_id', '?')}.")


def validate_docs(atlas: dict, invariant_payload: dict) -> None:
    atlas_doc = load_text(ATLAS_DOC_PATH)
    invariants_doc = load_text(INVARIANTS_DOC_PATH)
    transitions_doc = load_text(TRANSITIONS_DOC_PATH)
    guards_doc = load_text(GUARDS_DOC_PATH)
    illegal_doc = load_text(ILLEGAL_DOC_PATH)
    mermaid_text = load_text(RELATIONSHIPS_MMD_PATH)

    for token in [
        "# 07 State Machine Atlas",
        "This atlas freezes Vecells state ownership before implementation.",
        "## Machine Inventory",
        "SM_REQUEST_WORKFLOW_STATE",
        "SM_PHARMACY_DISPATCH_STATUS",
    ]:
        assert_true(token in atlas_doc, f"Atlas doc is missing token: {token}")

    for invariant_id in MANDATORY_INVARIANT_IDS:
        assert_true(invariant_id in invariants_doc, f"Invariants doc is missing {invariant_id}.")

    for token in [
        "# 07 Transition Tables",
        "Transition ID",
        "SM_REQUEST_WORKFLOW_STATE__TRIAGE_ACTIVE__HANDOFF_ACTIVE",
        "SM_PHARMACY_DISPATCH_STATUS__PROOF_PENDING__PROOF_SATISFIED",
    ]:
        assert_true(token in transitions_doc, f"Transition doc is missing token: {token}")

    for token in [
        "# 07 Guard And Proof Matrix",
        "Degraded Posture If Missing",
        "SM_EXTERNAL_CONFIRMATION_GATE__PENDING__CONFIRMED",
    ]:
        assert_true(token in guards_doc, f"Guard doc is missing token: {token}")

    for token in [
        "# 07 Illegal Transition And Conflict Report",
        "## High-Signal Illegal Transitions",
        "## Reused State Terms",
        "CONFLICT_STATE_TERM_EXPIRED",
        "ISSUE_SM_CROSS_PHASE_SCORECARD_BLOCKED_EXACT",
    ]:
        assert_true(token in illegal_doc, f"Illegal doc is missing token: {token}")

    assert_true("graph LR" in mermaid_text, "Mermaid graph header is missing.")
    for row in atlas["machines"]:
        assert_true(row["machine_id"] in mermaid_text, f"Mermaid graph is missing {row['machine_id']}.")
    for row in invariant_payload["invariants"]:
        assert_true(row["invariant_id"] in mermaid_text, f"Mermaid graph is missing {row['invariant_id']}.")


def validate_html(atlas: dict, invariant_payload: dict, illegal_payload: dict) -> None:
    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Atlas HTML is missing marker: {marker}")

    for token in [
        "State Observatory",
        "location.hash",
        "hashchange",
        "Machine view loaded",
        "Invariant view loaded",
    ]:
        assert_true(token in html_text, f"Atlas HTML is missing token: {token}")

    remote_asset_patterns = [
        r'src=["\']https?://',
        r'href=["\']https?://',
        r'url\(https?://',
    ]
    assert_true(
        not any(re.search(pattern, html_text) for pattern in remote_asset_patterns),
        "Atlas HTML must not load remote assets.",
    )

    match = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html_text, re.S)
    assert_true(match is not None, "Atlas HTML is missing the embedded JSON payload.")
    assert_true("&quot;" not in match.group(1), "Atlas HTML must not HTML-escape the embedded JSON payload.")
    embedded = json.loads(match.group(1))

    assert_true(
        embedded["machine_payload"]["atlas_id"] == atlas["atlas_id"],
        "Embedded atlas_id drifted from JSON artifact.",
    )
    assert_true(
        embedded["machine_payload"]["summary"]["machine_count"] == atlas["summary"]["machine_count"],
        "Embedded machine summary drifted from JSON artifact.",
    )
    assert_true(
        len(embedded["machine_payload"]["machines"]) == len(atlas["machines"]),
        "Embedded machine rows drifted from JSON artifact.",
    )
    assert_true(
        len(embedded["invariant_payload"]["invariants"]) == len(invariant_payload["invariants"]),
        "Embedded invariant rows drifted from JSON artifact.",
    )
    assert_true(
        len(embedded["illegal_payload"]["illegal_transition_rows"]) == len(illegal_payload["illegal_transition_rows"]),
        "Embedded illegal rows drifted from JSON artifact.",
    )
    assert_true(
        len(embedded["illegal_payload"]["state_term_conflicts"]) == len(illegal_payload["state_term_conflicts"]),
        "Embedded state-term conflicts drifted from JSON artifact.",
    )


def main() -> None:
    validate_deliverables()
    upstream = validate_prerequisites()
    atlas = load_json(STATE_MACHINES_JSON_PATH)
    invariant_payload = load_json(INVARIANTS_JSON_PATH)
    illegal_payload = load_json(ILLEGAL_TRANSITIONS_JSON_PATH)
    validate_machine_payload(atlas, invariant_payload, illegal_payload, upstream)
    validate_invariants(invariant_payload, illegal_payload, atlas)
    validate_illegal_payload(illegal_payload, atlas, invariant_payload)
    validate_csvs(atlas)
    validate_docs(atlas, invariant_payload)
    validate_html(atlas, invariant_payload, illegal_payload)
    print(
        json.dumps(
            {
                "status": "ok",
                "machine_count": atlas["summary"]["machine_count"],
                "transition_count": atlas["summary"]["transition_count"],
                "invariant_count": invariant_payload["summary"]["invariant_count"],
                "conflict_count": illegal_payload["summary"]["total_conflict_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
