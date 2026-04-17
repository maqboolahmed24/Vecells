#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from hashlib import sha256
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_074"
VISUAL_MODE = "Reservation_Confirmation_Truth_Lab"
GENERATED_AT = "2026-04-12T00:00:00+00:00"
CAPTURED_ON = "2026-04-12"

MANIFEST_PATH = DATA_DIR / "capacity_reservation_manifest.json"
MATRIX_PATH = DATA_DIR / "reservation_truth_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "external_confirmation_gate_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "74_capacity_reservation_and_confirmation_gate_design.md"
RULES_DOC_PATH = DOCS_DIR / "74_reservation_truth_and_confirmation_rules.md"
LAB_PATH = DOCS_DIR / "74_reservation_confirmation_truth_lab.html"
SPEC_PATH = TESTS_DIR / "reservation-confirmation-truth-lab.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/074.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.14 CapacityReservation",
    "blueprint/phase-0-the-foundation-protocol.md#1.14A ReservationTruthProjection",
    "blueprint/phase-0-the-foundation-protocol.md#1.15 ExternalConfirmationGate",
    "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
    "blueprint/phase-5-the-network-horizon.md#Hub commit and confirmation rules",
    "blueprint/phase-6-the-pharmacy-loop.md#Dispatch proof and confirmation-gate rules",
    "blueprint/forensic-audit-findings.md#Finding 72",
    "blueprint/forensic-audit-findings.md#Finding 73",
    "blueprint/forensic-audit-findings.md#Finding 74",
    "packages/domains/identity_access/src/reservation-confirmation-backbone.ts",
    "services/command-api/src/reservation-confirmation.ts",
]

THRESHOLD_POLICY = {
    "policyRef": "external_confirmation_thresholds::par_074_v1",
    "tauHold": 0.55,
    "tauConfirm": 0.82,
    "deltaConfirm": 0.18,
    "weakManualMinSourceFamilies": 2,
}


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    ensure_parent(path)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def digest(seed: str) -> str:
    return sha256(seed.encode("utf-8")).hexdigest()


def base_case(
    scenario_id: str,
    title: str,
    reservation_state: str,
    commit_mode: str,
    truth_state: str,
    display_exclusivity_state: str,
    countdown_mode: str,
    assurance_level: str,
    source_domain: str,
    source_object_ref: str,
    selected_anchor_ref: str,
    supplier_observed_at: str,
    *,
    expires_at: str | None = None,
    confirmed_at: str | None = None,
    released_at: str | None = None,
    terminal_reason_code: str | None = None,
    gate: dict[str, object] | None = None,
    evidence: list[dict[str, object]] | None = None,
    validators: list[dict[str, str]] | None = None,
    note: str,
) -> dict[str, object]:
    reservation_id = f"reservation::{scenario_id}"
    truth_basis_hash = digest(f"truth-basis::{scenario_id}")
    active_fencing_token = digest(f"fencing::{scenario_id}")
    reservation_version = 1
    reservation_version_ref = f"{reservation_id}@v{reservation_version}"
    return {
        "scenarioId": scenario_id,
        "title": title,
        "assuranceLevel": assurance_level,
        "sourceRefs": SOURCE_PRECEDENCE,
        "note": note,
        "reservation": {
            "reservationId": reservation_id,
            "capacityIdentityRef": f"capacity::{scenario_id}",
            "canonicalReservationKey": f"canonical::{scenario_id}",
            "sourceDomain": source_domain,
            "holderRef": f"holder::{scenario_id}",
            "state": reservation_state,
            "commitMode": commit_mode,
            "reservationVersion": reservation_version,
            "activeFencingToken": active_fencing_token,
            "truthBasisHash": truth_basis_hash,
            "supplierObservedAt": supplier_observed_at,
            "revalidatedAt": supplier_observed_at,
            "expiresAt": expires_at,
            "confirmedAt": confirmed_at,
            "releasedAt": released_at,
            "supersededByReservationRef": None,
            "terminalReasonCode": terminal_reason_code,
        },
        "projection": {
            "reservationTruthProjectionId": f"projection::{scenario_id}",
            "capacityReservationRef": reservation_id,
            "canonicalReservationKey": f"canonical::{scenario_id}",
            "sourceDomain": source_domain,
            "sourceObjectRef": source_object_ref,
            "selectedAnchorRef": selected_anchor_ref,
            "truthState": truth_state,
            "displayExclusivityState": display_exclusivity_state,
            "countdownMode": countdown_mode,
            "exclusiveUntilAt": expires_at if countdown_mode == "hold_expiry" else None,
            "reservationVersionRef": reservation_version_ref,
            "truthBasisHash": truth_basis_hash,
            "projectionFreshnessEnvelopeRef": f"freshness::{scenario_id}",
            "reasonRefs": [],
            "generatedAt": supplier_observed_at,
            "projectionRevision": 1,
        },
        "gate": gate,
        "evidence": evidence or [],
        "validators": validators or [],
    }


CASES = [
    base_case(
        scenario_id="soft_selection_without_hold",
        title="Soft selection keeps focus without inventing exclusivity.",
        reservation_state="soft_selected",
        commit_mode="truthful_nonexclusive",
        truth_state="truthful_nonexclusive",
        display_exclusivity_state="nonexclusive",
        countdown_mode="none",
        assurance_level="none",
        source_domain="booking_local",
        source_object_ref="offer_session_074_soft",
        selected_anchor_ref="slot_card_074_soft",
        supplier_observed_at="2026-04-12T20:00:00Z",
        evidence=[
            {
                "evidenceRef": "ev_focus_only",
                "sourceFamily": "selection_focus",
                "polarity": "positive",
                "summary": "Focused card anchor retained for the chosen slot.",
                "hardMatchStatus": "not_applicable",
                "impact": "Selection stays sticky, but exclusivity remains unavailable.",
            }
        ],
        validators=[
            {
                "validatorId": "soft_selected_never_exclusive",
                "status": "pass",
                "rule": "`soft_selected` is focus posture only.",
                "detail": "The projection renders truthful nonexclusive copy and no countdown.",
            },
            {
                "validatorId": "countdown_requires_real_hold",
                "status": "pass",
                "rule": "Countdown copy requires a real held reservation and expiry.",
                "detail": "No hold expiry is shown for selection-only posture.",
            },
        ],
        note="Offer focus stays visible, but the substrate refuses reserved-for-you language.",
    ),
    base_case(
        scenario_id="exclusive_hold_with_real_expiry",
        title="Real exclusive hold unlocks the only legal countdown.",
        reservation_state="held",
        commit_mode="exclusive_hold",
        truth_state="exclusive_held",
        display_exclusivity_state="exclusive",
        countdown_mode="hold_expiry",
        assurance_level="strong",
        source_domain="booking_local",
        source_object_ref="offer_session_074_exclusive",
        selected_anchor_ref="slot_card_074_exclusive",
        supplier_observed_at="2026-04-12T20:05:00Z",
        expires_at="2026-04-12T20:14:00Z",
        evidence=[
            {
                "evidenceRef": "ev_real_hold_token",
                "sourceFamily": "supplier_hold_token",
                "polarity": "positive",
                "summary": "Supplier-issued hold token bound to the active fencing token.",
                "hardMatchStatus": "not_applicable",
                "impact": "Exclusive language and countdown are legal while the hold remains live.",
            }
        ],
        validators=[
            {
                "validatorId": "exclusive_requires_hold",
                "status": "pass",
                "rule": "Exclusive copy requires `state = held`, `commitMode = exclusive_hold`, and a real expiry.",
                "detail": "The projection binds to the live hold and its real expiry.",
            },
            {
                "validatorId": "client_timer_forbidden",
                "status": "pass",
                "rule": "Client timers and offer TTLs cannot drive hold countdowns.",
                "detail": "The countdown comes from the reservation expiry, not UI-local state.",
            },
        ],
        note="This is the only visible posture allowed to show reserved-for-you timing.",
    ),
    base_case(
        scenario_id="truthful_nonexclusive_offer",
        title="Truthful nonexclusive availability remains actionable without false hold cues.",
        reservation_state="soft_selected",
        commit_mode="truthful_nonexclusive",
        truth_state="truthful_nonexclusive",
        display_exclusivity_state="nonexclusive",
        countdown_mode="none",
        assurance_level="none",
        source_domain="booking_waitlist",
        source_object_ref="waitlist_offer_074_truthful",
        selected_anchor_ref="waitlist_card_074_truthful",
        supplier_observed_at="2026-04-12T20:10:00Z",
        evidence=[
            {
                "evidenceRef": "ev_live_supplier_window",
                "sourceFamily": "availability_refresh",
                "polarity": "positive",
                "summary": "Live supplier availability says the slot remains currently bookable.",
                "hardMatchStatus": "not_applicable",
                "impact": "CTA remains available, but exclusivity claims stay blocked.",
            }
        ],
        validators=[
            {
                "validatorId": "truthful_nonexclusive_copy",
                "status": "pass",
                "rule": "`truthful_nonexclusive` must stay explicitly nonexclusive.",
                "detail": "The card copy says available when you book, not reserved.",
            },
            {
                "validatorId": "pending_confirmation_not_implied",
                "status": "pass",
                "rule": "No final confirmation or hold reassurance appears without the governing substrate.",
                "detail": "The projection offers actionability without inventing calmness.",
            },
        ],
        note="Selection and actionability remain useful without turning freshness into ownership.",
    ),
    base_case(
        scenario_id="immediate_authoritative_confirmation",
        title="Immediate authoritative confirmation can settle without a weak gate.",
        reservation_state="confirmed",
        commit_mode="exclusive_hold",
        truth_state="confirmed",
        display_exclusivity_state="none",
        countdown_mode="none",
        assurance_level="strong",
        source_domain="hub_booking",
        source_object_ref="hub_commit_attempt_074_immediate",
        selected_anchor_ref="hub_card_074_immediate",
        supplier_observed_at="2026-04-12T20:15:00Z",
        confirmed_at="2026-04-12T20:15:06Z",
        expires_at="2026-04-12T20:16:00Z",
        evidence=[
            {
                "evidenceRef": "ev_authoritative_provider_reference",
                "sourceFamily": "provider_reference",
                "polarity": "positive",
                "summary": "Durable provider reference observed on the same canonical reservation key.",
                "hardMatchStatus": "satisfied",
                "impact": "Final reassurance is legal without external confirmation ambiguity.",
            }
        ],
        validators=[
            {
                "validatorId": "strong_path_authoritative_proof",
                "status": "pass",
                "rule": "Immediate authoritative proof may settle without a weak/manual gate.",
                "detail": "The reservation and projection both reach confirmed with durable proof.",
            },
            {
                "validatorId": "closure_no_pending_gate",
                "status": "pass",
                "rule": "Closure-blocking ambiguity disappears only when authoritative confirmation exists.",
                "detail": "No pending external gate remains for this strong-path case.",
            },
        ],
        note="A durable provider reference is enough to move directly to confirmed truth.",
    ),
    base_case(
        scenario_id="pending_external_confirmation",
        title="Async acceptance remains visibly pending until the gate clears.",
        reservation_state="pending_confirmation",
        commit_mode="exclusive_hold",
        truth_state="pending_confirmation",
        display_exclusivity_state="none",
        countdown_mode="none",
        assurance_level="moderate",
        source_domain="hub_booking",
        source_object_ref="hub_commit_attempt_074_pending",
        selected_anchor_ref="hub_card_074_pending",
        supplier_observed_at="2026-04-12T20:20:00Z",
        expires_at="2026-04-12T20:28:00Z",
        gate={
            "gateId": "gate::pending_external_confirmation",
            "state": "pending",
            "transportMode": "partner_api_async",
            "assuranceLevel": "moderate",
            "priorProbability": 0.42,
            "posteriorLogOdds": -0.173271,
            "confirmationConfidence": 0.456791,
            "competingGateMargin": 1.0,
            "confirmationDeadlineAt": "2026-04-12T20:40:00Z",
            "sourceFamilyRefs": ["adapter_receipt"],
            "requiredHardMatchRefs": ["provider_reference_match"],
            "satisfiedHardMatchRefs": [],
            "failedHardMatchRefs": [],
            "contradictoryEvidenceRefs": [],
        },
        evidence=[
            {
                "evidenceRef": "ev_074_pending_ack",
                "sourceFamily": "adapter_receipt",
                "polarity": "positive",
                "summary": "Adapter receipt accepted the commit for processing.",
                "hardMatchStatus": "pending",
                "impact": "The booking remains pending confirmation instead of booked.",
            }
        ],
        validators=[
            {
                "validatorId": "pending_requires_gate",
                "status": "pass",
                "rule": "`pending_confirmation` reservations require an active `ExternalConfirmationGate`.",
                "detail": "The async supplier path retains a visible gate reference.",
            },
            {
                "validatorId": "pending_not_final_reassurance",
                "status": "pass",
                "rule": "Pending confirmation may not collapse into final booked truth.",
                "detail": "The confidence stays below the confirm threshold and hard matches remain open.",
            },
            {
                "validatorId": "moderate_gate_thresholds",
                "status": "pass",
                "rule": "Moderate assurance paths still need hard matches plus thresholds before confirmation.",
                "detail": "Receipt-only evidence holds the gate in pending state.",
            },
        ],
        note="The user-facing copy must stay provisional until strong enough proof arrives.",
    ),
    base_case(
        scenario_id="contradictory_competing_confirmation",
        title="Contradictory evidence remains durable and closure-blocking.",
        reservation_state="disputed",
        commit_mode="degraded_manual_pending",
        truth_state="disputed",
        display_exclusivity_state="none",
        countdown_mode="none",
        assurance_level="weak",
        source_domain="pharmacy_dispatch",
        source_object_ref="dispatch_attempt_074_disputed",
        selected_anchor_ref="pharmacy_row_074_disputed",
        supplier_observed_at="2026-04-12T20:25:00Z",
        terminal_reason_code="CONTRADICTORY_CONFIRMATION_EVIDENCE",
        gate={
            "gateId": "gate::contradictory_competing_confirmation",
            "state": "disputed",
            "transportMode": "manual_partner_fax",
            "assuranceLevel": "weak",
            "priorProbability": 0.5,
            "posteriorLogOdds": -0.16,
            "confirmationConfidence": 0.460085,
            "competingGateMargin": -0.279915,
            "confirmationDeadlineAt": "2026-04-12T20:45:00Z",
            "sourceFamilyRefs": ["callback_feed", "transport_receipt"],
            "requiredHardMatchRefs": ["package_hash_match", "recipient_route_match"],
            "satisfiedHardMatchRefs": ["package_hash_match"],
            "failedHardMatchRefs": ["recipient_route_match"],
            "contradictoryEvidenceRefs": ["ev_074_disputed_conflicting_callback"],
        },
        evidence=[
            {
                "evidenceRef": "ev_074_disputed_transport_ack",
                "sourceFamily": "transport_receipt",
                "polarity": "positive",
                "summary": "Transport acceptance arrived for the dispatch attempt.",
                "hardMatchStatus": "partial",
                "impact": "One hard match is satisfied, but confirmation remains incomplete.",
            },
            {
                "evidenceRef": "ev_074_disputed_conflicting_callback",
                "sourceFamily": "callback_feed",
                "polarity": "negative",
                "summary": "Conflicting callback rejects the recipient route on the same tuple.",
                "hardMatchStatus": "failed",
                "impact": "The gate becomes disputed and the reservation truth remains blocked.",
            },
        ],
        validators=[
            {
                "validatorId": "contradiction_forces_dispute",
                "status": "pass",
                "rule": "Contradictory evidence must move the gate to `disputed`.",
                "detail": "The callback conflict remains explicit and durable.",
            },
            {
                "validatorId": "hard_match_failure_visible",
                "status": "pass",
                "rule": "Hard-match failure cannot disappear into generic reconciliation text.",
                "detail": "The failed recipient-route match stays in the gate record.",
            },
            {
                "validatorId": "competing_margin_blocks_confirmation",
                "status": "pass",
                "rule": "Competing confidence below `deltaConfirm` blocks confirmation.",
                "detail": "The margin stays negative against a competing candidate.",
            },
        ],
        note="Ambiguous or conflicting truth remains visible instead of being softened into generic pending copy.",
    ),
    base_case(
        scenario_id="weak_manual_two_family_confirmation",
        title="Manual confirmation needs independent corroboration before calm copy is legal.",
        reservation_state="confirmed",
        commit_mode="degraded_manual_pending",
        truth_state="confirmed",
        display_exclusivity_state="none",
        countdown_mode="none",
        assurance_level="manual",
        source_domain="pharmacy_dispatch",
        source_object_ref="dispatch_attempt_074_manual_confirmed",
        selected_anchor_ref="pharmacy_row_074_manual_confirmed",
        supplier_observed_at="2026-04-12T20:30:00Z",
        confirmed_at="2026-04-12T20:32:00Z",
        gate={
            "gateId": "gate::weak_manual_two_family_confirmation",
            "state": "confirmed",
            "transportMode": "manual_partner_phone",
            "assuranceLevel": "manual",
            "priorProbability": 0.48,
            "posteriorLogOdds": 1.978381,
            "confirmationConfidence": 0.878507,
            "competingGateMargin": 0.878507,
            "confirmationDeadlineAt": "2026-04-12T20:50:00Z",
            "sourceFamilyRefs": ["document_scan", "phone_witness"],
            "requiredHardMatchRefs": ["package_hash_match", "patient_identity_match"],
            "satisfiedHardMatchRefs": ["package_hash_match", "patient_identity_match"],
            "failedHardMatchRefs": [],
            "contradictoryEvidenceRefs": [],
        },
        evidence=[
            {
                "evidenceRef": "ev_074_manual_phone_witness",
                "sourceFamily": "phone_witness",
                "polarity": "positive",
                "summary": "Phone witness confirms the patient identity on the same tuple.",
                "hardMatchStatus": "satisfied",
                "impact": "One independent family contributes a positive hard match.",
            },
            {
                "evidenceRef": "ev_074_manual_document_scan",
                "sourceFamily": "document_scan",
                "polarity": "positive",
                "summary": "Document scan proves the package hash against the outbound artifact.",
                "hardMatchStatus": "satisfied",
                "impact": "Second independent family clears corroboration and hard-match law.",
            },
        ],
        validators=[
            {
                "validatorId": "manual_requires_two_families",
                "status": "pass",
                "rule": "Weak or manual paths require at least two independent source families.",
                "detail": "Phone witness and document scan corroborate the same attempt.",
            },
            {
                "validatorId": "manual_requires_hard_matches",
                "status": "pass",
                "rule": "Required hard matches must be satisfied before weak/manual confirmation may settle.",
                "detail": "Both package and identity matches are satisfied.",
            },
            {
                "validatorId": "manual_requires_tau_confirm",
                "status": "pass",
                "rule": "Weak/manual confirmation still needs `tauConfirm` and `deltaConfirm` thresholds.",
                "detail": "The confidence clears `tauConfirm` and the margin stays above `deltaConfirm`.",
            },
            {
                "validatorId": "manual_final_reassurance",
                "status": "pass",
                "rule": "Final reassurance is legal only after the gate is confirmed.",
                "detail": "The reservation and gate both reach confirmed state.",
            },
        ],
        note="Manual and weak pathways become calm only after corroborated, threshold-clearing proof.",
    ),
    base_case(
        scenario_id="expired_hold_without_confirmation",
        title="Expired holds degrade in place and remove stale exclusivity immediately.",
        reservation_state="expired",
        commit_mode="exclusive_hold",
        truth_state="expired",
        display_exclusivity_state="none",
        countdown_mode="none",
        assurance_level="none",
        source_domain="booking_local",
        source_object_ref="offer_session_074_expired",
        selected_anchor_ref="slot_card_074_expired",
        supplier_observed_at="2026-04-12T20:35:00Z",
        expires_at="2026-04-12T20:36:00Z",
        terminal_reason_code="HOLD_EXPIRED",
        evidence=[
            {
                "evidenceRef": "ev_hold_expired",
                "sourceFamily": "reservation_timeout",
                "polarity": "negative",
                "summary": "The real hold expiry passed without authoritative confirmation.",
                "hardMatchStatus": "not_applicable",
                "impact": "Stale exclusivity and countdown copy are suppressed in place.",
            }
        ],
        validators=[
            {
                "validatorId": "expired_degrades_immediately",
                "status": "pass",
                "rule": "Expired reservations degrade the projection immediately.",
                "detail": "The truth state is expired and no countdown survives.",
            },
            {
                "validatorId": "expired_not_silent_success",
                "status": "pass",
                "rule": "Expired or released truth may not flatten into success.",
                "detail": "The terminal reason remains visible and closure-blocking calmness stays off.",
            },
        ],
        note="Expired holds do not linger as quiet exclusivity in the UI.",
    ),
]


def finalize_cases() -> list[dict[str, object]]:
    for case in CASES:
        projection = case["projection"]
        if case["scenarioId"] == "soft_selection_without_hold":
            projection["reasonRefs"] = ["selection_is_not_exclusivity"]
        elif case["scenarioId"] == "exclusive_hold_with_real_expiry":
            projection["reasonRefs"] = ["real_exclusive_hold"]
        elif case["scenarioId"] == "truthful_nonexclusive_offer":
            projection["reasonRefs"] = ["selection_is_not_exclusivity", "subject_to_live_confirmation"]
        elif case["scenarioId"] == "immediate_authoritative_confirmation":
            projection["reasonRefs"] = ["authoritative_confirmation_seen"]
        elif case["scenarioId"] == "pending_external_confirmation":
            projection["reasonRefs"] = ["awaiting_external_confirmation"]
        elif case["scenarioId"] == "contradictory_competing_confirmation":
            projection["reasonRefs"] = ["reservation_disputed"]
        elif case["scenarioId"] == "weak_manual_two_family_confirmation":
            projection["reasonRefs"] = ["authoritative_confirmation_seen"]
        elif case["scenarioId"] == "expired_hold_without_confirmation":
            projection["reasonRefs"] = ["reservation_expired"]
    return CASES


def build_manifest(cases: list[dict[str, object]]) -> dict[str, object]:
    summary_rows = []
    for case in cases:
        reservation = case["reservation"]
        projection = case["projection"]
        gate = case["gate"]
        summary_rows.append(
            {
                "scenarioId": case["scenarioId"],
                "title": case["title"],
                "reservationState": reservation["state"],
                "commitMode": reservation["commitMode"],
                "truthState": projection["truthState"],
                "displayExclusivityState": projection["displayExclusivityState"],
                "countdownMode": projection["countdownMode"],
                "assuranceLevel": case["assuranceLevel"],
                "gateState": gate["state"] if gate else "not_required",
                "sourceDomain": reservation["sourceDomain"],
                "selectedAnchorRef": projection["selectedAnchorRef"],
                "reservationVersionRef": projection["reservationVersionRef"],
                "truthBasisHash": projection["truthBasisHash"],
                "activeFencingToken": reservation["activeFencingToken"],
                "note": case["note"],
            }
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Freeze authoritative reservation truth and external confirmation gate law so later booking, hub, and pharmacy surfaces cannot overstate exclusivity, countdowns, or final calmness.",
        "source_precedence": SOURCE_PRECEDENCE,
        "threshold_policy": THRESHOLD_POLICY,
        "summary": {
            "scenario_count": len(cases),
            "reservation_count": len(cases),
            "projection_count": len(cases),
            "gate_case_count": sum(1 for case in cases if case["gate"] is not None),
            "held_count": sum(1 for case in cases if case["reservation"]["state"] == "held"),
            "pending_confirmation_count": sum(
                1 for case in cases if case["reservation"]["state"] == "pending_confirmation"
            ),
            "confirmed_count": sum(1 for case in cases if case["reservation"]["state"] == "confirmed"),
            "disputed_count": sum(1 for case in cases if case["reservation"]["state"] == "disputed"),
            "expired_count": sum(1 for case in cases if case["reservation"]["state"] == "expired"),
            "truthful_nonexclusive_count": sum(
                1 for case in cases if case["projection"]["truthState"] == "truthful_nonexclusive"
            ),
            "countdown_enabled_count": sum(
                1 for case in cases if case["projection"]["countdownMode"] == "hold_expiry"
            ),
            "final_reassurance_legal_count": sum(
                1
                for case in cases
                if case["projection"]["truthState"] == "confirmed"
                and (
                    case["gate"] is None
                    or case["gate"]["state"] == "confirmed"
                )
            ),
            "evidence_atom_count": sum(len(case["evidence"]) for case in cases),
            "validator_row_count": sum(len(case["validators"]) for case in cases),
        },
        "validators": [
            "`ReservationTruthProjection` is the sole user-visible authority for exclusivity, countdowns, and truthful nonexclusive wording.",
            "`soft_selected` may never imply ownership or reserved-for-you language.",
            "Countdown copy is legal only when a real `held` reservation carries a real expiry.",
            "`pending_confirmation`, `disputed`, `released`, and `expired` may not flatten into success.",
            "Weak or manual confirmation requires hard matches, threshold clearance, and at least two source families before `confirmed` is legal.",
            "Contradictory evidence and failed hard matches remain durable and closure-blocking.",
        ],
        "scenarios": summary_rows,
    }


def build_matrix_rows(cases: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for case in cases:
        reservation = case["reservation"]
        projection = case["projection"]
        gate = case["gate"] or {}
        rows.append(
            {
                "scenario_id": case["scenarioId"],
                "title": case["title"],
                "reservation_state": reservation["state"],
                "commit_mode": reservation["commitMode"],
                "truth_state": projection["truthState"],
                "display_exclusivity_state": projection["displayExclusivityState"],
                "countdown_mode": projection["countdownMode"],
                "assurance_level": case["assuranceLevel"],
                "gate_state": gate.get("state", "not_required"),
                "source_domain": reservation["sourceDomain"],
                "source_object_ref": projection["sourceObjectRef"],
                "selected_anchor_ref": projection["selectedAnchorRef"],
                "reservation_version_ref": projection["reservationVersionRef"],
                "truth_basis_hash": projection["truthBasisHash"],
                "active_fencing_token": reservation["activeFencingToken"],
                "exclusive_until_at": projection["exclusiveUntilAt"] or "",
                "confirmation_confidence": gate.get("confirmationConfidence", ""),
                "competing_gate_margin": gate.get("competingGateMargin", ""),
                "source_family_count": len(gate.get("sourceFamilyRefs", [])),
                "countdown_legal": "yes" if projection["countdownMode"] == "hold_expiry" else "no",
                "final_reassurance_legal": (
                    "yes"
                    if projection["truthState"] == "confirmed"
                    and (not case["gate"] or case["gate"]["state"] == "confirmed")
                    else "no"
                ),
                "note": case["note"],
            }
        )
    return rows


def build_casebook(cases: list[dict[str, object]]) -> dict[str, object]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "case_count": len(cases),
            "gate_case_count": sum(1 for case in cases if case["gate"] is not None),
            "contradictory_case_count": sum(
                1 for case in cases if case["gate"] and case["gate"]["state"] == "disputed"
            ),
            "manual_case_count": sum(1 for case in cases if case["assuranceLevel"] == "manual"),
            "evidence_atom_count": sum(len(case["evidence"]) for case in cases),
            "validator_row_count": sum(len(case["validators"]) for case in cases),
        },
        "cases": cases,
    }


def build_design_doc(manifest: dict[str, object]) -> str:
    summary = manifest["summary"]
    return dedent(
        f"""
        # 74 Capacity Reservation And Confirmation Gate Design

        `par_074` publishes the authoritative reservation-truth substrate for booking, hub, and pharmacy work. The generated pack freezes {summary["scenario_count"]} canonical simulator scenarios, {summary["gate_case_count"]} gate-backed confirmation cases, and one browser lab that proves the truth-in-advertising rules at the UI boundary.

        ## Core law

        - `CapacityReservation` is the canonical reservation state holder. Soft focus, exclusive holds, pending confirmation, final confirmation, release, expiry, and dispute stay distinct and durable.
        - `ReservationTruthProjection` is the sole user-visible authority for exclusivity language, hold countdowns, and truthful nonexclusive wording.
        - `ExternalConfirmationGate` is mandatory whenever external truth is async, weak, or manual.

        ## Truth boundaries

        `soft_selected` is only focus posture. It may preserve the active row or card but may never imply ownership, exclusivity, or a reserved-for-you timer. `exclusive_held` exists only while the underlying reservation is genuinely held under `commitMode = exclusive_hold` and carries the real hold expiry.

        `pending_confirmation` is not a soft synonym for success. It is a durable waiting posture that must remain visible until authoritative confirmation clears or the gate moves to `disputed` or `expired`.

        ## Persistence and simulator

        The runtime seam persists three artifacts:

        - `capacity_reservations`
        - `reservation_truth_projections`
        - `external_confirmation_gates`

        The deterministic simulator uses the same model law as production and covers:

        - soft selection without exclusivity
        - real exclusive hold with countdown
        - truthful nonexclusive availability
        - immediate authoritative confirmation
        - pending external confirmation
        - contradictory and competing evidence
        - corroborated weak/manual confirmation
        - expired hold degradation
        """
    ).strip()


def build_rules_doc(manifest: dict[str, object], casebook: dict[str, object]) -> str:
    summary = manifest["summary"]
    return dedent(
        f"""
        # 74 Reservation Truth And Confirmation Rules

        The frozen rule set below is the law later booking, hub, and pharmacy surfaces must respect. This pack currently carries {summary["validator_row_count"]} explicit validator rows and {casebook["summary"]["evidence_atom_count"]} evidence atoms across the canonical simulator.

        ## Fail-closed rules

        - `soft_selected` may not be rendered or persisted as exclusivity. It is focus posture only.
        - Countdown copy is legal only when a real held reservation exposes the real hold expiry.
        - `pending_confirmation` may preserve the selected claim, but it may not widen into final booked or referred reassurance.
        - Weak or manual confirmation may not settle without every required hard match, `confirmationConfidence >= tauConfirm`, `competingGateMargin >= deltaConfirm`, and at least two independent source families.
        - Contradictory evidence, failed hard matches, or competing ambiguity below `deltaConfirm` force `disputed`.
        - `released`, `expired`, and `disputed` remain durable, visible outcomes for that claim and may not flatten into success.

        ## Gate thresholds

        - `tauHold = {THRESHOLD_POLICY["tauHold"]}`
        - `tauConfirm = {THRESHOLD_POLICY["tauConfirm"]}`
        - `deltaConfirm = {THRESHOLD_POLICY["deltaConfirm"]}`
        - `weakManualMinSourceFamilies = {THRESHOLD_POLICY["weakManualMinSourceFamilies"]}`

        ## Simulator contract

        - Strong-path immediate confirmation may settle without an external gate only when authoritative provider proof already exists.
        - Moderate async confirmation remains pending with a visible gate until hard matches and thresholds clear.
        - Weak/manual dispatch paths remain blocked until independent corroboration arrives.
        - Contradictory or competing evidence remains visible in the gate and blocks closure.
        """
    ).strip()


def build_lab_html(manifest: dict[str, object], casebook: dict[str, object], matrix_rows: list[dict[str, object]]) -> str:
    manifest_json = json.dumps(manifest, separators=(",", ":"))
    casebook_json = json.dumps(casebook, separators=(",", ":"))
    matrix_json = json.dumps(matrix_rows, separators=(",", ":"))
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Reservation Confirmation Truth Lab</title>
            <style>
              :root {
                --canvas: #F8F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F8;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border: #E2E8F0;
                --reservation: #3559E6;
                --truth: #0EA5A4;
                --confirmation: #7C3AED;
                --warning: #C98900;
                --blocked: #C24141;
                --shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
                --radius-lg: 24px;
                --transition-fast: 120ms ease;
                --transition-med: 180ms ease;
                --transition-slow: 220ms ease;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                color: var(--text-default);
                background:
                  radial-gradient(circle at top right, rgba(53, 89, 230, 0.08), transparent 26%),
                  linear-gradient(180deg, #fbfcff 0%, var(--canvas) 56%);
              }
              body[data-reduced-motion="true"] * {
                transition: none !important;
                animation: none !important;
                scroll-behavior: auto !important;
              }
              .shell { max-width: 1500px; margin: 0 auto; padding: 24px; }
              .masthead {
                min-height: 72px;
                display: flex;
                gap: 18px;
                align-items: center;
                justify-content: space-between;
                padding: 18px 22px;
                background: rgba(255, 255, 255, 0.88);
                border: 1px solid rgba(226, 232, 240, 0.92);
                border-radius: 24px;
                box-shadow: var(--shadow);
                backdrop-filter: blur(14px);
              }
              .brand { display: flex; align-items: center; gap: 14px; }
              .brand-mark {
                width: 42px;
                height: 42px;
                border-radius: 16px;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.14), rgba(124, 58, 237, 0.14));
                border: 1px solid rgba(53, 89, 230, 0.18);
              }
              .brand-copy h1 { margin: 0; font-size: 1.08rem; color: var(--text-strong); }
              .brand-copy p { margin: 4px 0 0; font-size: 0.92rem; color: var(--text-muted); }
              .masthead-metrics {
                display: grid;
                grid-template-columns: repeat(5, minmax(96px, 1fr));
                gap: 10px;
                width: min(760px, 100%);
              }
              .metric {
                background: var(--inset);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 10px 12px;
                min-height: 52px;
              }
              .metric-label {
                font-size: 0.74rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }
              .metric-value {
                margin-top: 6px;
                font-size: 1.34rem;
                font-weight: 700;
                color: var(--text-strong);
              }
              .workspace {
                margin-top: 22px;
                display: grid;
                grid-template-columns: 304px minmax(0, 1fr) 408px;
                gap: 20px;
                align-items: start;
              }
              .panel {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
              }
              .left-rail, .state-rail, .truth-card-strip, .confidence-panel, .inspector, .table-panel {
                padding: 18px;
              }
              .left-rail { background: linear-gradient(180deg, var(--panel), #fbfcff); }
              .left-rail h2, .center-stack h2, .inspector h2, .table-panel h2 {
                margin: 0 0 6px;
                font-size: 0.98rem;
                color: var(--text-strong);
              }
              .panel-subtle {
                margin: 0 0 14px;
                color: var(--text-muted);
                font-size: 0.9rem;
                line-height: 1.45;
              }
              .control-group { display: grid; gap: 8px; margin-bottom: 16px; }
              label { font-size: 0.8rem; font-weight: 600; color: var(--text-default); }
              select {
                width: 100%;
                min-height: 44px;
                border: 1px solid var(--border);
                border-radius: 14px;
                background: var(--inset);
                color: var(--text-default);
                padding: 0 14px;
              }
              select:focus-visible, button:focus-visible {
                outline: 3px solid rgba(53, 89, 230, 0.18);
                outline-offset: 2px;
              }
              .filter-note {
                margin-top: 12px;
                padding: 14px;
                border-radius: 16px;
                background: linear-gradient(180deg, rgba(53, 89, 230, 0.09), rgba(14, 165, 164, 0.08));
                color: var(--text-default);
                font-size: 0.9rem;
                line-height: 1.5;
              }
              .center-stack { display: grid; gap: 18px; }
              .state-rail { min-height: 240px; background: linear-gradient(180deg, #ffffff 0%, #f6f8fc 100%); }
              .state-list { display: grid; gap: 10px; margin-top: 14px; }
              .state-row {
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 10px;
                align-items: center;
                padding: 12px 14px;
                border-radius: 16px;
                background: var(--rail);
                border: 1px solid transparent;
                cursor: pointer;
              }
              .state-row[data-selected="true"] {
                border-color: rgba(53, 89, 230, 0.32);
                background: rgba(53, 89, 230, 0.08);
                transform: translateX(2px);
              }
              .state-chip { width: 11px; height: 11px; border-radius: 999px; }
              .chip-held { background: var(--reservation); }
              .chip-pending_confirmation { background: var(--confirmation); }
              .chip-confirmed { background: var(--truth); }
              .chip-disputed { background: var(--blocked); }
              .chip-expired { background: var(--warning); }
              .chip-soft_selected { background: #94A3B8; }
              .parity { margin-top: 12px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.45; }
              .card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                gap: 14px;
              }
              .truth-card {
                min-height: 170px;
                border-radius: 20px;
                border: 1px solid var(--border);
                background: linear-gradient(180deg, #ffffff, #f8fafe);
                padding: 16px;
                text-align: left;
                cursor: pointer;
              }
              .truth-card:hover { transform: translateY(-1px); border-color: rgba(14, 165, 164, 0.25); }
              .truth-card[data-selected="true"] {
                border-color: rgba(14, 165, 164, 0.36);
                box-shadow: 0 18px 42px rgba(14, 165, 164, 0.12);
                background: linear-gradient(180deg, rgba(14, 165, 164, 0.06), #ffffff);
              }
              .card-topline { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
              .eyebrow {
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
              }
              .card-title { margin: 8px 0 0; font-size: 1rem; color: var(--text-strong); }
              .card-note { margin: 10px 0 14px; color: var(--text-muted); font-size: 0.88rem; line-height: 1.45; }
              .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
              .pill {
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 0.75rem;
                font-weight: 600;
                background: var(--rail);
                color: var(--text-default);
              }
              .pill.gate-confirmed { background: rgba(14, 165, 164, 0.14); color: var(--truth); }
              .pill.gate-pending { background: rgba(124, 58, 237, 0.12); color: var(--confirmation); }
              .pill.gate-disputed { background: rgba(194, 65, 65, 0.12); color: var(--blocked); }
              .pill.gate-not_required { background: rgba(148, 163, 184, 0.14); color: var(--text-muted); }
              .confidence-panel { background: linear-gradient(180deg, rgba(124, 58, 237, 0.08), rgba(255, 255, 255, 0.92)); }
              .confidence-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin-top: 14px;
              }
              .confidence-metric {
                padding: 14px;
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.84);
                border: 1px solid rgba(124, 58, 237, 0.12);
              }
              .confidence-metric strong {
                display: block;
                font-size: 1.1rem;
                color: var(--text-strong);
                margin-top: 8px;
              }
              .confidence-bar {
                margin-top: 16px;
                height: 12px;
                border-radius: 999px;
                background: rgba(124, 58, 237, 0.12);
                overflow: hidden;
              }
              .confidence-fill { height: 100%; background: linear-gradient(90deg, var(--confirmation), #a855f7); }
              .inspector { position: sticky; top: 24px; }
              .inspector-block { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
              .inspector-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
              .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.82rem; word-break: break-all; }
              .table-stack { margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
              table { width: 100%; border-collapse: collapse; }
              th, td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                text-align: left;
                vertical-align: top;
                font-size: 0.85rem;
              }
              th {
                color: var(--text-muted);
                font-weight: 600;
                font-size: 0.74rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
              }
              tr:last-child td { border-bottom: none; }
              .status-pass { color: var(--truth); font-weight: 700; }
              .status-pending { color: var(--confirmation); font-weight: 700; }
              .status-disputed { color: var(--blocked); font-weight: 700; }
              .empty-state {
                padding: 16px;
                border-radius: 16px;
                background: var(--inset);
                color: var(--text-muted);
              }
              @media (max-width: 1180px) {
                .workspace { grid-template-columns: 1fr; }
                .inspector { position: static; }
                .table-stack { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <script id="manifest-json" type="application/json">__MANIFEST_JSON__</script>
            <script id="casebook-json" type="application/json">__CASEBOOK_JSON__</script>
            <script id="matrix-json" type="application/json">__MATRIX_JSON__</script>
            <div class="shell">
              <header class="masthead" role="banner">
                <div class="brand">
                  <div class="brand-mark" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="1.5" y="1.5" width="21" height="21" rx="8" stroke="#3559E6"></rect>
                      <path d="M7 17V7h5.2c2.7 0 4.1 1.2 4.1 3.2 0 1.3-.7 2.2-1.8 2.7L17 17h-2.8l-2.2-3.6H9.4V17H7Zm2.4-5.7h2.4c1.2 0 1.9-.4 1.9-1.3 0-.9-.7-1.4-1.9-1.4H9.4v2.7Z" fill="#0F172A"></path>
                    </svg>
                  </div>
                  <div class="brand-copy">
                    <h1>Vecells Reservation Confirmation Truth Lab</h1>
                    <p>Reservation_Confirmation_Truth_Lab</p>
                  </div>
                </div>
                <div class="masthead-metrics">
                  <div class="metric"><div class="metric-label">Held</div><div class="metric-value" data-testid="masthead-held-count">0</div></div>
                  <div class="metric"><div class="metric-label">Pending</div><div class="metric-value" data-testid="masthead-pending-count">0</div></div>
                  <div class="metric"><div class="metric-label">Confirmed</div><div class="metric-value" data-testid="masthead-confirmed-count">0</div></div>
                  <div class="metric"><div class="metric-label">Disputed</div><div class="metric-value" data-testid="masthead-disputed-count">0</div></div>
                  <div class="metric"><div class="metric-label">Expired</div><div class="metric-value" data-testid="masthead-expired-count">0</div></div>
                </div>
              </header>
              <div class="workspace">
                <aside class="panel left-rail" aria-label="Filter rail">
                  <h2>Truth filters</h2>
                  <p class="panel-subtle">Filter by canonical reservation state, commit mode, and assurance level. The selected truth card drives every downstream panel.</p>
                  <div class="control-group">
                    <label for="state-filter">Reservation state</label>
                    <select id="state-filter" data-testid="state-filter">
                      <option value="all">All states</option>
                      <option value="soft_selected">Soft selected</option>
                      <option value="held">Held</option>
                      <option value="pending_confirmation">Pending confirmation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="disputed">Disputed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label for="commit-mode-filter">Commit mode</label>
                    <select id="commit-mode-filter" data-testid="commit-mode-filter">
                      <option value="all">All commit modes</option>
                      <option value="exclusive_hold">exclusive_hold</option>
                      <option value="truthful_nonexclusive">truthful_nonexclusive</option>
                      <option value="degraded_manual_pending">degraded_manual_pending</option>
                    </select>
                  </div>
                  <div class="control-group">
                    <label for="assurance-filter">Assurance level</label>
                    <select id="assurance-filter" data-testid="assurance-filter">
                      <option value="all">All assurance levels</option>
                      <option value="strong">strong</option>
                      <option value="moderate">moderate</option>
                      <option value="weak">weak</option>
                      <option value="manual">manual</option>
                      <option value="none">none</option>
                    </select>
                  </div>
                  <div class="filter-note">Calmness is never inferred from card focus, browser timers, or transport acceptance alone. This board only advertises what the canonical reservation and gate truth currently permit.</div>
                </aside>
                <main class="center-stack">
                  <section class="panel state-rail" data-testid="state-rail">
                    <h2>Reservation-state rail</h2>
                    <p class="panel-subtle">Visible scenarios grouped by authoritative reservation posture.</p>
                    <div class="state-list" id="state-list"></div>
                    <div class="parity" data-testid="state-rail-parity"></div>
                  </section>
                  <section class="panel truth-card-strip" data-testid="truth-card-strip">
                    <h2>Truth card strip</h2>
                    <p class="panel-subtle">Each card binds one reservation, one truth projection, and the currently governing assurance posture.</p>
                    <div class="card-grid" id="card-grid"></div>
                  </section>
                  <section class="panel confidence-panel" data-testid="confidence-panel">
                    <h2>Confirmation-confidence panel</h2>
                    <p class="panel-subtle">Gate confidence, competing margin, and source-family corroboration for the selected scenario.</p>
                    <div id="confidence-content"></div>
                    <div class="parity" data-testid="confidence-parity"></div>
                  </section>
                  <div class="table-stack">
                    <section class="panel table-panel" data-testid="evidence-table">
                      <h2>Evidence table</h2>
                      <p class="panel-subtle">Positive, negative, and contradictory atoms bound to the selected truth tuple.</p>
                      <div id="evidence-content"></div>
                    </section>
                    <section class="panel table-panel" data-testid="validator-table">
                      <h2>Validator table</h2>
                      <p class="panel-subtle">Fail-closed rule outcomes for the selected scenario.</p>
                      <div id="validator-content"></div>
                    </section>
                  </div>
                </main>
                <aside class="panel inspector" data-testid="inspector" aria-label="Inspector">
                  <h2>Inspector</h2>
                  <p class="panel-subtle">Reservation, projection, and gate details for the selected scenario.</p>
                  <div id="inspector-content"></div>
                </aside>
              </div>
            </div>
            <script>
              const manifest = JSON.parse(document.getElementById("manifest-json").textContent);
              const casebook = JSON.parse(document.getElementById("casebook-json").textContent);
              const matrixRows = JSON.parse(document.getElementById("matrix-json").textContent);
              const cases = casebook.cases;
              const uiState = {
                stateFilter: "all",
                commitModeFilter: "all",
                assuranceFilter: "all",
                selectedScenarioId: cases[0] ? cases[0].scenarioId : null,
              };
              const stateOrder = ["soft_selected", "held", "pending_confirmation", "confirmed", "disputed", "expired"];
              const stateLabels = {
                soft_selected: "Soft selected",
                held: "Held",
                pending_confirmation: "Pending confirmation",
                confirmed: "Confirmed",
                disputed: "Disputed",
                expired: "Expired",
              };

              function setReducedMotion() {
                const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                document.body.setAttribute("data-reduced-motion", reduced ? "true" : "false");
              }
              setReducedMotion();
              window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", setReducedMotion);

              function visibleCases() {
                return cases.filter((entry) => {
                  if (uiState.stateFilter !== "all" && entry.reservation.state !== uiState.stateFilter) return false;
                  if (uiState.commitModeFilter !== "all" && entry.reservation.commitMode !== uiState.commitModeFilter) return false;
                  if (uiState.assuranceFilter !== "all" && entry.assuranceLevel !== uiState.assuranceFilter) return false;
                  return true;
                });
              }

              function ensureSelection(visible) {
                if (!visible.length) {
                  uiState.selectedScenarioId = null;
                  return;
                }
                if (!visible.some((entry) => entry.scenarioId === uiState.selectedScenarioId)) {
                  uiState.selectedScenarioId = visible[0].scenarioId;
                }
              }

              function selectedCase(visible) {
                return visible.find((entry) => entry.scenarioId === uiState.selectedScenarioId) || null;
              }

              function renderMasthead(visible) {
                const count = (stateKey) => visible.filter((entry) => entry.reservation.state === stateKey).length;
                document.querySelector("[data-testid='masthead-held-count']").textContent = String(count("held"));
                document.querySelector("[data-testid='masthead-pending-count']").textContent = String(count("pending_confirmation"));
                document.querySelector("[data-testid='masthead-confirmed-count']").textContent = String(count("confirmed"));
                document.querySelector("[data-testid='masthead-disputed-count']").textContent = String(count("disputed"));
                document.querySelector("[data-testid='masthead-expired-count']").textContent = String(count("expired"));
              }

              function renderStateRail(visible, selected) {
                const counts = new Map();
                visible.forEach((entry) => counts.set(entry.reservation.state, (counts.get(entry.reservation.state) || 0) + 1));
                const mount = document.getElementById("state-list");
                mount.innerHTML = "";
                stateOrder.forEach((stateKey) => {
                  if (!counts.has(stateKey)) return;
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "state-row";
                  button.setAttribute("data-testid", `state-rail-item-${stateKey}`);
                  button.setAttribute("data-selected", selected && selected.reservation.state === stateKey ? "true" : "false");
                  button.innerHTML = `<span class="state-chip chip-${stateKey}"></span><span>${stateLabels[stateKey] || stateKey}</span><strong>${counts.get(stateKey)}</strong>`;
                  button.addEventListener("click", () => {
                    const match = visible.find((entry) => entry.reservation.state === stateKey);
                    if (match) {
                      uiState.selectedScenarioId = match.scenarioId;
                      render();
                    }
                  });
                  mount.appendChild(button);
                });
                document.querySelector("[data-testid='state-rail-parity']").textContent = `${visible.length} visible scenarios across ${counts.size} reservation states.`;
              }

              function pill(text, extraClass) {
                return `<span class="pill ${extraClass || ""}">${text}</span>`;
              }

              function renderCards(visible, selected) {
                const mount = document.getElementById("card-grid");
                mount.innerHTML = "";
                if (!visible.length) {
                  mount.innerHTML = '<div class="empty-state">No scenarios match the current filter set.</div>';
                  return;
                }
                visible.forEach((entry, index) => {
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "truth-card";
                  button.setAttribute("data-testid", `truth-card-${entry.scenarioId}`);
                  button.setAttribute("data-selected", selected && selected.scenarioId === entry.scenarioId ? "true" : "false");
                  button.setAttribute("aria-pressed", selected && selected.scenarioId === entry.scenarioId ? "true" : "false");
                  button.dataset.index = String(index);
                  const gateState = entry.gate ? entry.gate.state : "not_required";
                  button.innerHTML = `
                    <div class="card-topline">
                      <div>
                        <div class="eyebrow">${entry.reservation.state.replaceAll("_", " ")}</div>
                        <h3 class="card-title">${entry.title}</h3>
                      </div>
                      ${pill(entry.assuranceLevel, "")}
                    </div>
                    <p class="card-note">${entry.note}</p>
                    <div class="pill-row">
                      ${pill(entry.projection.truthState, "")}
                      ${pill(entry.reservation.commitMode, "")}
                      ${pill(entry.gate ? entry.gate.state : "no gate", `gate-${gateState}`)}
                    </div>
                  `;
                  button.addEventListener("click", () => {
                    uiState.selectedScenarioId = entry.scenarioId;
                    render();
                  });
                  button.addEventListener("keydown", (event) => {
                    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
                    event.preventDefault();
                    const currentIndex = visible.findIndex((candidate) => candidate.scenarioId === entry.scenarioId);
                    const nextIndex = Math.min(Math.max(currentIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1), 0), visible.length - 1);
                    const next = visible[nextIndex];
                    if (!next) return;
                    uiState.selectedScenarioId = next.scenarioId;
                    render();
                    requestAnimationFrame(() => {
                      document.querySelector(`[data-testid="truth-card-${next.scenarioId}"]`)?.focus();
                    });
                  });
                  mount.appendChild(button);
                });
              }

              function renderConfidencePanel(selected) {
                const mount = document.getElementById("confidence-content");
                const parity = document.querySelector("[data-testid='confidence-parity']");
                if (!selected) {
                  mount.innerHTML = '<div class="empty-state">Select a scenario to inspect confidence posture.</div>';
                  parity.textContent = "No visible scenario is currently selected.";
                  return;
                }
                if (!selected.gate) {
                  mount.innerHTML = '<div class="empty-state">This path does not require an external confirmation gate. Final reassurance is controlled directly by authoritative reservation proof.</div>';
                  parity.textContent = "No external confirmation gate is required for the selected scenario.";
                  return;
                }
                const confidence = Number(selected.gate.confirmationConfidence);
                const margin = Number(selected.gate.competingGateMargin);
                mount.innerHTML = `
                  <div class="confidence-grid">
                    <div class="confidence-metric">Confidence<strong>${(confidence * 100).toFixed(1)}%</strong></div>
                    <div class="confidence-metric">Competing margin<strong>${margin.toFixed(2)}</strong></div>
                    <div class="confidence-metric">Gate state<strong>${selected.gate.state}</strong></div>
                  </div>
                  <div class="confidence-bar" aria-hidden="true"><div class="confidence-fill" style="width:${Math.max(0, Math.min(confidence * 100, 100)).toFixed(1)}%"></div></div>
                `;
                parity.textContent = `Gate ${selected.gate.state} at ${(confidence * 100).toFixed(1)}% confidence with ${selected.gate.sourceFamilyRefs.length} source families.`;
              }

              function definitionRow(label, value, className) {
                return `<div><div class="eyebrow">${label}</div><div class="${className || ""}">${value}</div></div>`;
              }

              function renderInspector(selected) {
                const mount = document.getElementById("inspector-content");
                if (!selected) {
                  mount.innerHTML = '<div class="empty-state">No scenario selected.</div>';
                  return;
                }
                const reservation = selected.reservation;
                const projection = selected.projection;
                const gate = selected.gate;
                const gateHtml = gate
                  ? `<div class="inspector-grid">
                      ${definitionRow("Gate ID", gate.gateId, "mono")}
                      ${definitionRow("State", gate.state, "")}
                      ${definitionRow("Assurance", gate.assuranceLevel, "")}
                      ${definitionRow("Deadline", gate.confirmationDeadlineAt, "mono")}
                    </div>`
                  : '<div class="empty-state">No gate required for the selected scenario.</div>';
                mount.innerHTML = `
                  <div>
                    <div class="eyebrow">${selected.scenarioId}</div>
                    <h3 class="card-title">${selected.title}</h3>
                    <p class="panel-subtle">${selected.note}</p>
                  </div>
                  <div class="inspector-block">
                    <h2>Reservation</h2>
                    <div class="inspector-grid">
                      ${definitionRow("State", reservation.state, "")}
                      ${definitionRow("Commit mode", reservation.commitMode, "")}
                      ${definitionRow("Source domain", reservation.sourceDomain, "")}
                      ${definitionRow("Version ref", projection.reservationVersionRef, "mono")}
                    </div>
                    <div class="inspector-grid" style="margin-top:12px;">
                      ${definitionRow("Truth hash", projection.truthBasisHash, "mono")}
                      ${definitionRow("Fencing token", reservation.activeFencingToken, "mono")}
                    </div>
                  </div>
                  <div class="inspector-block">
                    <h2>Projection</h2>
                    <div class="inspector-grid">
                      ${definitionRow("Truth state", projection.truthState, "")}
                      ${definitionRow("Display", projection.displayExclusivityState, "")}
                      ${definitionRow("Countdown", projection.countdownMode, "")}
                      ${definitionRow("Selected anchor", projection.selectedAnchorRef, "mono")}
                    </div>
                  </div>
                  <div class="inspector-block"><h2>Gate</h2>${gateHtml}</div>
                `;
              }

              function renderEvidence(selected) {
                const mount = document.getElementById("evidence-content");
                if (!selected || !selected.evidence.length) {
                  mount.innerHTML = '<div class="empty-state">No external evidence atoms are required for this scenario.</div>';
                  return;
                }
                const rows = selected.evidence.map((row, index) => `
                  <tr data-testid="evidence-row-${index}">
                    <td class="mono">${row.evidenceRef}</td>
                    <td>${row.sourceFamily}</td>
                    <td>${row.polarity}</td>
                    <td>${row.hardMatchStatus}</td>
                    <td>${row.impact}</td>
                  </tr>
                `).join("");
                mount.innerHTML = `<table><thead><tr><th>Evidence</th><th>Family</th><th>Polarity</th><th>Hard match</th><th>Impact</th></tr></thead><tbody>${rows}</tbody></table>`;
              }

              function renderValidators(selected) {
                const mount = document.getElementById("validator-content");
                if (!selected || !selected.validators.length) {
                  mount.innerHTML = '<div class="empty-state">No validator rows are available.</div>';
                  return;
                }
                const rows = selected.validators.map((row, index) => `
                  <tr data-testid="validator-row-${index}">
                    <td class="mono">${row.validatorId}</td>
                    <td class="status-${row.status}">${row.status}</td>
                    <td>${row.rule}</td>
                    <td>${row.detail}</td>
                  </tr>
                `).join("");
                mount.innerHTML = `<table><thead><tr><th>Validator</th><th>Status</th><th>Rule</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`;
              }

              function render() {
                const visible = visibleCases();
                ensureSelection(visible);
                const selected = selectedCase(visible);
                renderMasthead(visible);
                renderStateRail(visible, selected);
                renderCards(visible, selected);
                renderConfidencePanel(selected);
                renderInspector(selected);
                renderEvidence(selected);
                renderValidators(selected);
              }

              document.getElementById("state-filter").addEventListener("change", (event) => {
                uiState.stateFilter = event.target.value;
                render();
              });
              document.getElementById("commit-mode-filter").addEventListener("change", (event) => {
                uiState.commitModeFilter = event.target.value;
                render();
              });
              document.getElementById("assurance-filter").addEventListener("change", (event) => {
                uiState.assuranceFilter = event.target.value;
                render();
              });

              render();
            </script>
          </body>
        </html>
        """
    ).strip()
    return (
        template.replace("__MANIFEST_JSON__", manifest_json)
        .replace("__CASEBOOK_JSON__", casebook_json)
        .replace("__MATRIX_JSON__", matrix_json)
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(
          ROOT,
          "docs",
          "architecture",
          "74_reservation_confirmation_truth_lab.html",
        );
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "capacity_reservation_manifest.json");
        const CASEBOOK_PATH = path.join(
          ROOT,
          "data",
          "analysis",
          "external_confirmation_gate_casebook.json",
        );

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/74_reservation_confirmation_truth_lab.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : "application/json; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4374, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing lab HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
          const url =
            process.env.RESERVATION_CONFIRMATION_LAB_URL ??
            "http://127.0.0.1:4374/docs/architecture/74_reservation_confirmation_truth_lab.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='state-filter']").waitFor();
            await page.locator("[data-testid='commit-mode-filter']").waitFor();
            await page.locator("[data-testid='assurance-filter']").waitFor();
            await page.locator("[data-testid='state-rail']").waitFor();
            await page.locator("[data-testid='truth-card-strip']").waitFor();
            await page.locator("[data-testid='confidence-panel']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='evidence-table']").waitFor();
            await page.locator("[data-testid='validator-table']").waitFor();

            const initialCards = await page.locator("button[data-testid^='truth-card-']").count();
            assertCondition(
              initialCards === MANIFEST.summary.scenario_count,
              `Expected ${MANIFEST.summary.scenario_count} truth cards, found ${initialCards}.`,
            );

            await page.locator("[data-testid='state-filter']").selectOption("confirmed");
            const confirmedCards = await page.locator("button[data-testid^='truth-card-']").count();
            assertCondition(confirmedCards === 2, `Expected 2 confirmed cards, found ${confirmedCards}.`);

            await page.locator("[data-testid='assurance-filter']").selectOption("manual");
            const manualCards = await page.locator("button[data-testid^='truth-card-']").count();
            assertCondition(manualCards === 1, `Expected 1 manual card, found ${manualCards}.`);

            const manualCard = page.locator(
              "[data-testid='truth-card-weak_manual_two_family_confirmation']",
            );
            await manualCard.click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("weak_manual_two_family_confirmation") &&
                inspectorText.includes("gate::weak_manual_two_family_confirmation"),
              "Inspector lost selection synchronization for the manual confirmation scenario.",
            );
            const selectedState = await page
              .locator("[data-testid='state-rail-item-confirmed']")
              .getAttribute("data-selected");
            assertCondition(
              selectedState === "true",
              "State rail did not synchronize to the selected truth card.",
            );
            const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
            assertCondition(evidenceRows === 2, `Expected 2 evidence rows, found ${evidenceRows}.`);
            const confidenceParity = await page
              .locator("[data-testid='confidence-parity']")
              .textContent();
            assertCondition(
              confidenceParity.includes("2 source families"),
              "Confidence parity text drifted from the selected gate.",
            );

            await page.locator("[data-testid='state-filter']").selectOption("all");
            await page.locator("[data-testid='assurance-filter']").selectOption("all");
            await page.locator("[data-testid='commit-mode-filter']").selectOption("all");
            const firstCard = page.locator("[data-testid='truth-card-soft_selection_without_hold']");
            await firstCard.focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator("[data-testid='truth-card-exclusive_hold_with_real_expiry']")
              .getAttribute("data-selected");
            assertCondition(secondSelected === "true", "ArrowDown did not advance to the next truth card.");

            const railParity = await page.locator("[data-testid='state-rail-parity']").textContent();
            assertCondition(railParity.includes("8 visible scenarios"), "State rail parity text drifted.");
            assertCondition(CASEBOOK.summary.case_count === 8, "Casebook summary drifted.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
          } finally {
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const reservationConfirmationTruthLabManifest = {
          task: MANIFEST.task_id,
          scenarios: MANIFEST.summary.scenario_count,
          coverage: [
            "state and assurance filtering",
            "selection synchronization",
            "chart and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
            "accessibility smoke checks",
          ],
        };
        """
    ).strip()


def main() -> None:
    cases = finalize_cases()
    manifest = build_manifest(cases)
    matrix_rows = build_matrix_rows(cases)
    casebook = build_casebook(cases)

    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, matrix_rows)
    write_json(CASEBOOK_PATH, casebook)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(RULES_DOC_PATH, build_rules_doc(manifest, casebook))
    write_text(LAB_PATH, build_lab_html(manifest, casebook, matrix_rows))
    write_text(SPEC_PATH, build_spec())


if __name__ == "__main__":
    main()
