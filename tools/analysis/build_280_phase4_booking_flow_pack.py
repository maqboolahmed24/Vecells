#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import html
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
TASK_ID = "seq_280"
VISUAL_MODE = "Booking_Flow_Contract_Atlas"
CONTRACT_VERSION = "280.phase4.booking-flow-freeze.v1"


def repo_path(relative: str) -> str:
    return str(ROOT / relative)


def write_text(relative: str, content: str) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(relative: str, payload: object) -> None:
    write_text(relative, json.dumps(payload, indent=2))


def write_csv(relative: str, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    rule = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(str(cell).replace("|", "\\|") for cell in row) + " |" for row in rows]
    return "\n".join([header, rule, *body])


def stable_json(payload: object) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def lower_hex(payload: object) -> str:
    return hashlib.sha256(stable_json(payload).encode("utf-8")).hexdigest()


def digest(prefix: str, payload: object) -> str:
    return f"{prefix}_{lower_hex(payload)[:16]}"


def enum_string(values: list[str], description: str) -> dict[str, object]:
    return {"type": "string", "enum": values, "description": description}


def ref_string(description: str, nullable: bool = False) -> dict[str, object]:
    return {
        "type": ["string", "null"] if nullable else "string",
        "minLength": 0 if nullable else 1,
        "description": description,
    }


def iso_timestamp(description: str) -> dict[str, object]:
    return {"type": "string", "format": "date-time", "description": description}


SEARCH_COVERAGE_STATES = ["complete", "partial_coverage", "timeout", "degraded", "failed"]
SEARCH_VIEW_STATES = [
    "renderable",
    "partial_coverage",
    "stale_refresh_required",
    "no_supply_confirmed",
    "support_fallback",
]
RESERVATION_TRUTH_STATES = [
    "exclusive_held",
    "truthful_nonexclusive",
    "pending_confirmation",
    "confirmed",
    "disputed",
    "released",
    "expired",
    "revalidation_required",
    "unavailable",
]
DISPLAY_EXCLUSIVITY_STATES = ["exclusive", "nonexclusive", "none"]
COUNTDOWN_MODES = ["none", "hold_expiry"]
LOCAL_ACK_STATES = ["not_started", "accepted_locally", "receipt_rendered"]
PROCESSING_ACCEPTANCE_STATES = [
    "not_dispatched",
    "accepted_for_processing",
    "awaiting_external_confirmation",
    "dispatch_failed",
]
EXTERNAL_OBSERVATION_STATES = [
    "none",
    "provider_reference_seen",
    "read_after_write_seen",
    "provider_pending",
    "failed",
    "disputed",
]
AUTHORITATIVE_OUTCOME_STATES = [
    "booking_in_progress",
    "confirmation_pending",
    "reconciliation_required",
    "booked",
    "failed",
    "expired",
    "released",
]
CONFIRMATION_TRUTH_STATES = [
    "booking_in_progress",
    "confirmation_pending",
    "reconciliation_required",
    "confirmed",
    "failed",
    "expired",
    "superseded",
]
PATIENT_VISIBILITY_STATES = [
    "selected_slot_pending",
    "provisional_receipt",
    "booked_summary",
    "recovery_required",
]
MANAGE_EXPOSURE_STATES = ["hidden", "summary_only", "writable", "recovery_only"]
ARTIFACT_EXPOSURE_STATES = ["hidden", "summary_only", "handoff_ready", "recovery_only"]
REMINDER_EXPOSURE_STATES = ["blocked", "pending_schedule", "scheduled", "suppressed"]
APPOINTMENT_MANAGE_ACTIONS = [
    "appointment_cancel",
    "appointment_reschedule",
    "appointment_detail_update",
    "reminder_change",
]
MANAGE_RESULTS = [
    "applied",
    "supplier_pending",
    "stale_recoverable",
    "unsupported_capability",
    "safety_preempted",
    "reconciliation_required",
]
CONTINUITY_VALIDATION_STATES = ["trusted", "degraded", "stale", "blocked"]
WAITLIST_REQUIRED_FALLBACK_ROUTES = [
    "stay_local_waitlist",
    "callback_fallback",
    "fallback_to_hub",
    "support_fallback",
    "booking_failed",
]


SOURCE_REFS = {
    "phase4_booking": "blueprint/phase-4-the-booking-engine.md",
    "phase0_foundation": "blueprint/phase-0-the-foundation-protocol.md",
    "patient_portal": "blueprint/patient-portal-experience-architecture-blueprint.md",
    "patient_account": "blueprint/patient-account-and-communications-blueprint.md",
    "runtime": "blueprint/platform-runtime-and-release-blueprint.md",
    "frontend": "blueprint/platform-frontend-blueprint.md",
    "booking_case_pack": "docs/architecture/278_phase4_booking_case_contract_and_state_machine.md",
    "booking_capability_pack": "docs/architecture/279_phase4_provider_capability_matrix_and_adapter_seam.md",
}


FORMULAS = {
    "SnapshotSelectable": {
        "name": "SnapshotSelectable(q,t)",
        "expression": "SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef matches the active BookingCase version] * 1[q.policyBundleHash matches the active compiled policy bundle] * 1[q.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * 1[q.capabilityTupleHash matches the current BookingCapabilityResolution.capabilityTupleHash] * 1[q.coverageState in {complete, partial_coverage}] * 1[recoveryState(q).viewState != stale_refresh_required]",
        "machineFields": [
            "expiresAt",
            "caseVersionRef",
            "policyBundleHash",
            "providerAdapterBindingHash",
            "capabilityTupleHash",
            "coverageState",
            "recoveryState.viewState",
        ],
        "inputObjects": ["SlotSetSnapshot", "SlotSnapshotRecoveryState", "BookingCase", "BookingCapabilityResolution"],
        "failurePosture": "selection may preserve provenance and day anchor, but confirm-path mutation must fail closed and require refresh or governed recovery before a slot can be committed",
    },
    "windowClass": {
        "name": "windowClass(s)",
        "expression": "windowClass(s) = 2 for inside clinically preferred window, 1 for inside clinically acceptable window, 0 for outside window",
        "machineFields": [
            "preferredWindowStartAt",
            "preferredWindowEndAt",
            "acceptableWindowStartAt",
            "acceptableWindowEndAt",
            "slotStartAtEpoch",
        ],
        "orderedValues": [
            {"value": 2, "meaning": "inside clinically preferred window"},
            {"value": 1, "meaning": "inside clinically acceptable window"},
            {"value": 0, "meaning": "outside window"},
        ],
    },
    "earliestStart_b": {
        "name": "earliestStart_b",
        "expression": "earliestStart_b = min_{u : windowClass(u)=b} startAtEpoch(u)",
        "machineFields": ["windowClass", "startAtEpoch"],
    },
    "Frontier_b": {
        "name": "Frontier_b",
        "expression": "Frontier_b = { s : windowClass(s)=b and startAtEpoch(s) <= earliestStart_b + Delta_reorder_b }",
        "machineFields": ["windowClass", "startAtEpoch", "earliestStart_b", "Delta_reorder_b"],
        "compiledFrom": "SearchPolicy.sameBandReorderSlackMinutesByWindow",
    },
    "softScore": {
        "name": "softScore(s)",
        "expression": "softScore(s) = w_delay * f_delay(s) + w_continuity * f_continuity(s) + w_site * f_site(s) + w_tod * f_tod(s) + w_travel * f_travel(s) + w_modality * f_modality(s)",
        "machineFields": [
            "w_delay",
            "w_continuity",
            "w_site",
            "w_tod",
            "w_travel",
            "w_modality",
            "f_delay",
            "f_continuity",
            "f_site",
            "f_tod",
            "f_travel",
            "f_modality",
        ],
        "constraints": [
            "sum w_* = 1",
            "do not include both waitMinutes and waitDays in the same linear score",
        ],
    },
    "RevalidationPass": {
        "name": "RevalidationPass(tx,t)",
        "expression": "RevalidationPass(tx,t) = SnapshotSelectable(SlotSetSnapshot(tx.snapshotId),t) * 1[tx.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * LiveSupplierBookable(tx.selectedSlotRef,t) * PolicySatisfied(tx.selectedSlotRef, tx.policyBundleHash) * RouteWritable(tx,t) * VersionFresh(tx.preflightVersion, tx.selectedSlotRef, t)",
        "machineFields": [
            "snapshotId",
            "providerAdapterBindingHash",
            "selectedSlotRef",
            "policyBundleHash",
            "preflightVersion",
            "routeIntentBindingRef",
            "surfacePublicationRef",
            "runtimePublicationBundleRef",
        ],
        "subPredicates": ["SnapshotSelectable", "RouteWritable"],
        "sameShellFailure": "keep the selected slot visible in the same shell and degrade to bounded refresh, read-only recovery, placeholder, or safe browser handoff instead of generic failure",
    },
    "RouteWritable": {
        "name": "RouteWritable(tx,t)",
        "expression": "RouteWritable(tx,t) = 1[AudienceSurfaceRouteContract live and surface publication current and RuntimePublicationBundle live and PatientShellConsistencyProjection valid and, when embedded, PatientEmbeddedSessionProjection valid]",
        "machineFields": [
            "surfaceRouteContractRef",
            "surfacePublicationRef",
            "runtimePublicationBundleRef",
            "patientShellConsistencyProjectionRef",
            "patientEmbeddedSessionProjectionRef",
        ],
        "failClosedOutcome": "confirm may not proceed if route publication is stale or withdrawn, if shell consistency no longer matches the booking lineage, or if embedded session posture has drifted",
    },
    "Cancelable": {
        "name": "Cancelable(a,t)",
        "expression": "Cancelable(a,t) = 1[a.status = booked and startAt(a) - t >= cancelCutoff(a) and no live AppointmentManageCommand fence exists for a]",
        "machineFields": ["appointmentStatus", "startAt", "cancelCutoff", "liveCommandFence"],
    },
    "Reschedulable": {
        "name": "Reschedulable(a,t)",
        "expression": "Reschedulable(a,t) = 1[a.status = booked and startAt(a) - t >= amendCutoff(a) and no live AppointmentManageCommand fence exists for a]",
        "machineFields": ["appointmentStatus", "startAt", "amendCutoff", "liveCommandFence"],
    },
}


ATLAS_STAGES = [
    {
        "stageId": "search_snapshot",
        "label": "Search snapshot",
        "accent": "#3158E0",
        "summary": "Search is a snapshot-producing operation. Selection and commit consume persisted snapshot truth, not live supplier lists.",
        "primaryFormulaId": "SnapshotSelectable",
        "contracts": [
            "280_slot_search_session.schema.json",
            "280_provider_search_slice.schema.json",
            "280_temporal_normalization_envelope.schema.json",
            "280_canonical_slot_identity.schema.json",
            "280_slot_set_snapshot.schema.json",
            "280_slot_snapshot_recovery_state.schema.json",
        ],
    },
    {
        "stageId": "ranking_frontier",
        "label": "Ranking frontier",
        "accent": "#5B61F6",
        "summary": "Hard filters run before a versioned rank plan computes frontier-safe soft reordering inside clinically bounded timeliness bands.",
        "primaryFormulaId": "softScore",
        "contracts": ["280_rank_plan_and_capacity_rank_proof_contract.json"],
    },
    {
        "stageId": "offer_session",
        "label": "Offer session",
        "accent": "#5B61F6",
        "summary": "OfferSession binds selected candidates, rank proof, and one current reservation-truth projection without implying exclusivity from session TTL alone.",
        "primaryFormulaId": "Frontier_b",
        "contracts": ["280_offer_session.schema.json", "280_reservation_truth_projection_contract.json"],
    },
    {
        "stageId": "reservation_truth",
        "label": "Reservation truth",
        "accent": "#3158E0",
        "summary": "Reserved wording, hold countdowns, and truthful nonexclusive posture can render only from ReservationTruthProjection.",
        "primaryFormulaId": "SnapshotSelectable",
        "contracts": ["280_reservation_truth_projection_contract.json"],
    },
    {
        "stageId": "commit_revalidation",
        "label": "Commit revalidation",
        "accent": "#B7791F",
        "summary": "Commit separates local acknowledgement, processing acceptance, external observation, and authoritative outcome, and it fails closed on stale route, policy, or supplier truth.",
        "primaryFormulaId": "RevalidationPass",
        "contracts": ["280_booking_transaction.schema.json", "280_waitlist_and_fallback_interface_stubs.json"],
    },
    {
        "stageId": "confirmation_truth",
        "label": "Confirmation truth",
        "accent": "#0F766E",
        "summary": "Booked summary, manage, artifact, and reminder exposure appear only when confirmation truth is confirmed with durable proof or same-commit read-after-write.",
        "primaryFormulaId": "RouteWritable",
        "contracts": ["280_booking_confirmation_truth_projection.schema.json"],
    },
    {
        "stageId": "manage_continuity",
        "label": "Manage continuity",
        "accent": "#0F766E",
        "summary": "Manage exposure depends on current capability, continuity evidence, and route writability, not on page shape or appointment presence.",
        "primaryFormulaId": "Cancelable",
        "contracts": ["280_appointment_manage_and_reminder_contract_bundle.json"],
    },
    {
        "stageId": "waitlist_fallback",
        "label": "Waitlist and fallback",
        "accent": "#B42318",
        "summary": "No-supply, expired offer, and failed commit branches already depend on typed waitlist and fallback truth, so those seams are frozen now.",
        "primaryFormulaId": "SnapshotSelectable",
        "contracts": [
            "280_waitlist_and_fallback_interface_stubs.json",
            "PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json",
        ],
    },
]


CONTRACT_SPLIT_ROWS = [
    {
        "contract": "SlotSearchSession",
        "file": "data/contracts/280_slot_search_session.schema.json",
        "phaseStage": "4C",
        "authority": "Snapshot-producing search session, fenced to case version, policy bundle, capability tuple, and adapter binding",
        "primaryConsumers": "patient booking shell, staff booking shell, commit preflight",
        "whySeparate": "keeps live supplier lists from leaking directly into selection or commit",
    },
    {
        "contract": "ProviderSearchSlice",
        "file": "data/contracts/280_provider_search_slice.schema.json",
        "phaseStage": "4C",
        "authority": "per-provider coverage, degradation, and raw payload lineage",
        "primaryConsumers": "coverage truth, partial-coverage copy, support fallback routing",
        "whySeparate": "distinguishes complete, partial, timeout, and degraded coverage",
    },
    {
        "contract": "TemporalNormalizationEnvelope",
        "file": "data/contracts/280_temporal_normalization_envelope.schema.json",
        "phaseStage": "4C",
        "authority": "timezone, DST, and clock-skew correctness",
        "primaryConsumers": "normalization, dedupe, rank plan, appointment rendering",
        "whySeparate": "prevents supplier-local timestamps from forking booking truth",
    },
    {
        "contract": "CanonicalSlotIdentity",
        "file": "data/contracts/280_canonical_slot_identity.schema.json",
        "phaseStage": "4C",
        "authority": "dedupe-safe slot identity and stable tie-break key",
        "primaryConsumers": "snapshot index, rank proof, offer session, commit",
        "whySeparate": "prevents distinct inventory from collapsing under aliasing",
    },
    {
        "contract": "SlotSetSnapshot",
        "file": "data/contracts/280_slot_set_snapshot.schema.json",
        "phaseStage": "4C",
        "authority": "frozen searchable and selectable slot set with checksum and recovery posture",
        "primaryConsumers": "rank proof, offer session, commit preflight",
        "whySeparate": "selection and commit must consume persisted snapshot truth",
    },
    {
        "contract": "SlotSnapshotRecoveryState",
        "file": "data/contracts/280_slot_snapshot_recovery_state.schema.json",
        "phaseStage": "4C",
        "authority": "renderable vs partial vs stale vs no-supply vs support-fallback view state",
        "primaryConsumers": "patient copy, support path, same-shell recovery",
        "whySeparate": "empty results are not enough to imply no supply",
    },
    {
        "contract": "RankPlan and CapacityRankProof",
        "file": "data/contracts/280_rank_plan_and_capacity_rank_proof_contract.json",
        "phaseStage": "4D",
        "authority": "frontier-safe rank plan, proof, explanations, and patient cue law",
        "primaryConsumers": "offer list, compare mode, support replay, operations diagnostics",
        "whySeparate": "keeps ordering stable across pagination, grouping, and replay",
    },
    {
        "contract": "OfferSession",
        "file": "data/contracts/280_offer_session.schema.json",
        "phaseStage": "4D",
        "authority": "selected candidate, proof hash, and interaction TTL over pre-ranked offers",
        "primaryConsumers": "selection shell, compare mode, commit start",
        "whySeparate": "OfferSession.expiresAt is not proof of exclusivity",
    },
    {
        "contract": "ReservationTruthProjection",
        "file": "data/contracts/280_reservation_truth_projection_contract.json",
        "phaseStage": "4D/4E",
        "authority": "sole authority for exclusivity, truthful-nonexclusive, pending-confirmation, release, and expiry language",
        "primaryConsumers": "offer cards, waitlist cards, selected slot cards",
        "whySeparate": "selected means held is explicitly forbidden",
    },
    {
        "contract": "BookingTransaction",
        "file": "data/contracts/280_booking_transaction.schema.json",
        "phaseStage": "4E",
        "authority": "append-only commit chain with local, processing, external, and authoritative states",
        "primaryConsumers": "booking commit, reconciliation, request detail, support",
        "whySeparate": "appointment rows or accepted processing alone may not imply booked truth",
    },
    {
        "contract": "BookingConfirmationTruthProjection",
        "file": "data/contracts/280_booking_confirmation_truth_projection.schema.json",
        "phaseStage": "4E/4F",
        "authority": "sole audience-safe authority for booked summary, manage, artifact, and reminder exposure",
        "primaryConsumers": "patient shells, request detail, manage shell, reminder and artifact surfaces",
        "whySeparate": "async or disputed confirmation must stay first-class and same-shell",
    },
    {
        "contract": "AppointmentManage and Reminder bundle",
        "file": "data/contracts/280_appointment_manage_and_reminder_contract_bundle.json",
        "phaseStage": "4F",
        "authority": "manage command, settlement, continuity evidence, reminder plan, and artifact rules",
        "primaryConsumers": "cancel, reschedule, reminder change, detail update, artifact handoff",
        "whySeparate": "manage cannot infer capability or safety from page shape",
    },
    {
        "contract": "Waitlist and fallback stubs",
        "file": "data/contracts/280_waitlist_and_fallback_interface_stubs.json",
        "phaseStage": "4C/4E/4F",
        "authority": "typed continuation truth for no-supply, expired offer, revalidation failure, and fallback transfer",
        "primaryConsumers": "search recovery, commit failure routing, callback or hub transfer",
        "whySeparate": "waitlist or fallback is already part of truthful booking semantics",
    },
]


STATE_TABLE_ROWS = [
    {
        "stateId": "search_renderable",
        "phaseStage": "4C",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "truthful_nonexclusive",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Slots are available to review and choose.",
        "sameShellPosture": "normal selection allowed",
    },
    {
        "stateId": "search_partial_coverage",
        "phaseStage": "4C",
        "snapshotRecoveryState": "partial_coverage",
        "reservationTruthState": "truthful_nonexclusive",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Availability may be incomplete; support help stays visible.",
        "sameShellPosture": "selection allowed with bounded warning",
    },
    {
        "stateId": "search_stale_refresh",
        "phaseStage": "4C",
        "snapshotRecoveryState": "stale_refresh_required",
        "reservationTruthState": "revalidation_required",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Selection freezes in place until refresh restores current truth.",
        "sameShellPosture": "anchor preserved, confirm blocked",
    },
    {
        "stateId": "search_no_supply_confirmed",
        "phaseStage": "4C",
        "snapshotRecoveryState": "no_supply_confirmed",
        "reservationTruthState": "unavailable",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "callback_fallback",
        "dominantNarrative": "Search completed exhaustively for the current policy and no directly bookable supply remains.",
        "sameShellPosture": "recovery and continuation only",
    },
    {
        "stateId": "offer_selected_nonexclusive",
        "phaseStage": "4D",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "truthful_nonexclusive",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Selected state persists, but copy must still say availability is confirmed when you book.",
        "sameShellPosture": "selected anchor preserved",
    },
    {
        "stateId": "offer_selected_exclusive_hold",
        "phaseStage": "4D",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "exclusive_held",
        "bookingTransactionState": "not_started",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Reserved-for-you wording and hold countdown are legal only from ReservationTruthProjection.",
        "sameShellPosture": "real hold countdown allowed",
    },
    {
        "stateId": "commit_pending_provisional",
        "phaseStage": "4E",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "pending_confirmation",
        "bookingTransactionState": "accepted_for_processing",
        "confirmationTruthState": "booking_in_progress",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Local acknowledgement and provisional receipt are visible, but booked reassurance is still blocked.",
        "sameShellPosture": "pending receipt in place",
    },
    {
        "stateId": "confirmation_pending",
        "phaseStage": "4E",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "pending_confirmation",
        "bookingTransactionState": "awaiting_external_confirmation",
        "confirmationTruthState": "confirmation_pending",
        "manageExposureState": "hidden",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "The supplier or external gate is still settling; manage and reminder exposure remain hidden.",
        "sameShellPosture": "selected slot or provisional summary stays visible",
    },
    {
        "stateId": "reconciliation_required",
        "phaseStage": "4E",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "disputed",
        "bookingTransactionState": "provider_pending",
        "confirmationTruthState": "reconciliation_required",
        "manageExposureState": "hidden",
        "waitlistRoute": "support_fallback",
        "dominantNarrative": "Contradictory or weak supplier truth keeps the same shell in governed recovery.",
        "sameShellPosture": "recovery only, provenance preserved",
    },
    {
        "stateId": "confirmed_booked",
        "phaseStage": "4E",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "confirmed",
        "bookingTransactionState": "provider_reference_seen",
        "confirmationTruthState": "confirmed",
        "manageExposureState": "writable",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Booked summary, writable manage posture, and pending reminder scheduling are now legal.",
        "sameShellPosture": "calm manage entry",
    },
    {
        "stateId": "manage_pending",
        "phaseStage": "4F",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "confirmed",
        "bookingTransactionState": "provider_reference_seen",
        "confirmationTruthState": "confirmed",
        "manageExposureState": "writable",
        "waitlistRoute": "stay_local_waitlist",
        "dominantNarrative": "Manage action can return supplier_pending without losing the appointment summary or anchor.",
        "sameShellPosture": "same-shell pending",
    },
    {
        "stateId": "manage_stale_recoverable",
        "phaseStage": "4F",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "confirmed",
        "bookingTransactionState": "provider_reference_seen",
        "confirmationTruthState": "confirmed",
        "manageExposureState": "recovery_only",
        "waitlistRoute": "support_fallback",
        "dominantNarrative": "Manage summary remains visible, but ordinary controls freeze until continuity proof refreshes.",
        "sameShellPosture": "bounded recovery only",
    },
]


SCENARIOS = [
    {
        "scenarioId": "SCN_280_RENDERABLE_SNAPSHOT",
        "stageId": "search_snapshot",
        "label": "Renderable search snapshot",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "truthful_nonexclusive",
        "confirmationTruthState": "booking_in_progress",
        "manageResult": "supplier_pending",
        "dominantAction": "select_slot",
        "sameShellPosture": "normal selection allowed",
    },
    {
        "scenarioId": "SCN_280_PARTIAL_COVERAGE",
        "stageId": "search_snapshot",
        "label": "Partial coverage with explicit bounded copy",
        "snapshotRecoveryState": "partial_coverage",
        "reservationTruthState": "truthful_nonexclusive",
        "confirmationTruthState": "booking_in_progress",
        "manageResult": "supplier_pending",
        "dominantAction": "keep_support_help_visible",
        "sameShellPosture": "selection allowed with warning",
    },
    {
        "scenarioId": "SCN_280_STALE_REFRESH_REQUIRED",
        "stageId": "search_snapshot",
        "label": "Stale snapshot requires refresh",
        "snapshotRecoveryState": "stale_refresh_required",
        "reservationTruthState": "revalidation_required",
        "confirmationTruthState": "booking_in_progress",
        "manageResult": "stale_recoverable",
        "dominantAction": "refresh_in_place",
        "sameShellPosture": "selected day anchor preserved",
    },
    {
        "scenarioId": "SCN_280_EXCLUSIVE_HOLD",
        "stageId": "reservation_truth",
        "label": "Exclusive hold backed by ReservationAuthority",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "exclusive_held",
        "confirmationTruthState": "booking_in_progress",
        "manageResult": "supplier_pending",
        "dominantAction": "confirm_booking",
        "sameShellPosture": "real hold countdown visible",
    },
    {
        "scenarioId": "SCN_280_PROVISIONAL_RECEIPT",
        "stageId": "commit_revalidation",
        "label": "Commit accepted for processing",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "pending_confirmation",
        "confirmationTruthState": "booking_in_progress",
        "manageResult": "supplier_pending",
        "dominantAction": "wait_for_authoritative_confirmation",
        "sameShellPosture": "selected slot or receipt stays visible",
    },
    {
        "scenarioId": "SCN_280_CONFIRMATION_PENDING",
        "stageId": "confirmation_truth",
        "label": "Authoritative confirmation still pending",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "pending_confirmation",
        "confirmationTruthState": "confirmation_pending",
        "manageResult": "supplier_pending",
        "dominantAction": "stay_pending",
        "sameShellPosture": "booked reassurance still blocked",
    },
    {
        "scenarioId": "SCN_280_CONFIRMED",
        "stageId": "confirmation_truth",
        "label": "Confirmed booking with durable proof",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "confirmed",
        "confirmationTruthState": "confirmed",
        "manageResult": "applied",
        "dominantAction": "manage_appointment",
        "sameShellPosture": "calm booked summary allowed",
    },
    {
        "scenarioId": "SCN_280_MANAGE_STALE",
        "stageId": "manage_continuity",
        "label": "Manage continuity stale",
        "snapshotRecoveryState": "renderable",
        "reservationTruthState": "confirmed",
        "confirmationTruthState": "confirmed",
        "manageResult": "stale_recoverable",
        "dominantAction": "refresh_manage_continuity",
        "sameShellPosture": "summary preserved, controls frozen",
    },
    {
        "scenarioId": "SCN_280_WAITLIST_FALLBACK",
        "stageId": "waitlist_fallback",
        "label": "No supply confirmed to callback fallback",
        "snapshotRecoveryState": "no_supply_confirmed",
        "reservationTruthState": "unavailable",
        "confirmationTruthState": "failed",
        "manageResult": "unsupported_capability",
        "dominantAction": "callback_fallback",
        "sameShellPosture": "continuation or support route only",
    },
]


WAITLIST_STUBS = {
    "WaitlistEntry": {
        "requiredFields": [
            "waitlistEntryId",
            "bookingCaseId",
            "slotSearchSessionRef",
            "slotSetSnapshotRef",
            "policyBundleHash",
            "providerAdapterBindingRef",
            "providerAdapterBindingHash",
            "capabilityTupleHash",
            "requiredFallbackRoute",
            "offerabilityState",
            "createdAt",
        ],
        "states": ["active", "offered", "expired", "transferred", "closed"],
    },
    "WaitlistDeadlineEvaluation": {
        "requiredFields": [
            "waitlistDeadlineEvaluationId",
            "waitlistEntryRef",
            "deadlineAt",
            "riskState",
            "governingPolicyBundleHash",
            "evaluatedAt",
        ],
        "riskStates": ["within_window", "at_risk", "expired"],
    },
    "WaitlistFallbackObligation": {
        "requiredFields": [
            "waitlistFallbackObligationId",
            "bookingCaseId",
            "requiredFallbackRoute",
            "reasonCode",
            "requiredByAt",
            "supportRouteRef",
            "typedTransferRef",
            "createdAt",
        ],
        "requiredFallbackRoutes": WAITLIST_REQUIRED_FALLBACK_ROUTES,
    },
    "WaitlistContinuationTruthProjection": {
        "requiredFields": [
            "waitlistContinuationTruthProjectionId",
            "bookingCaseId",
            "waitlistEntryRef",
            "requiredFallbackRoute",
            "continuationTruthState",
            "patientVisibilityState",
            "createdAt",
        ],
        "continuationTruthStates": [
            "stay_local_waitlist",
            "callback_fallback",
            "fallback_to_hub",
            "support_fallback",
            "booking_failed",
        ],
    },
}


EXTERNAL_REFERENCE_NOTES = """# 280 External Reference Notes

Reviewed on 2026-04-18. These sources were support material only. When they differed in emphasis or left room for interpretation, the local blueprint remained authoritative.

## Borrowed support

1. HL7 FHIR R4 Slot
   - URL: <https://hl7.org/fhir/R4/slot.html>
   - Borrowed: slot state alone does not imply transactional exclusivity or final booking truth.
   - Applied to: canonical-slot identity, truthful-nonexclusive offer posture, and the rejection of raw slot presence as commit proof.

2. HL7 FHIR R4 Appointment
   - URL: <https://hl7.org/fhir/R4/appointment.html>
   - Borrowed: appointment resources are outcome-carrying records, but they still need stronger confirmation discipline than simple local acknowledgement or detached object presence.
   - Applied to: `BookingConfirmationTruthProjection`, authoritative proof classes, and reminder or artifact gating.

3. NHS England Digital GP Connect developer guidance
   - URL: <https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7>
   - Borrowed: appointment-management and booking integrations have explicit bounded capability and confirmation rules, not generic success semantics.
   - Applied to: typed adapter-binding refs, capability-safe manage exposure, and same-shell pending or reconciliation posture.

4. NHS App appointments guidance
   - URL: <https://digital.nhs.uk/services/nhs-app/nhs-app-features/appointments>
   - Borrowed: booking and appointment posture must stay calm, summary-first, and explicit about what the patient can actually do next.
   - Applied to: booked-summary exposure, manage-entry wording, and reminder or artifact suppression before confirmation truth is live.

5. NHS App hospital and specialist appointments help
   - URL: <https://www.nhs.uk/nhs-app/help/appointments/hospital-and-other-appointments/>
   - Borrowed: straight-language appointment help and recovery cues when online pathways are incomplete.
   - Applied to: support-fallback copy, same-shell recovery posture, and typed waitlist or fallback seams.

6. NHS Service Manual content guidance
   - URL: <https://service-manual.nhs.uk/content>
   - Borrowed: calm, direct wording with no inflated certainty.
   - Applied to: patient and staff narrative rules in recovery, pending-confirmation, and support-fallback states.

7. NHS Service Manual error-message guidance
   - URL: <https://service-manual.nhs.uk/design-system/components/error-message>
   - Borrowed: visible recovery cues should explain what changed and what the user can do next without collapsing into generic failure.
   - Applied to: stale-refresh, revalidation-failure, and manage recovery rules.

8. Playwright screenshots, trace viewer, and aria snapshots
   - URLs:
     - <https://playwright.dev/docs/screenshots>
     - <https://playwright.dev/docs/trace-viewer>
     - <https://playwright.dev/docs/aria-snapshots>
   - Borrowed: interactive proof should validate selection sync, keyboard traversal, screenshots, and aria-backed atlas parity.
   - Applied to: the 280 atlas proof and deterministic output artifact naming.

## Borrowed visual support

1. Linear changelog
   - URL: <https://linear.app/changelog>
   - Borrowed: low-noise operational and transactional framing.

2. Vercel Academy nested layouts
   - URL: <https://vercel.com/academy/nextjs-foundations/nested-layouts>
   - Borrowed: persistent rail-plus-canvas hierarchy.

3. Vercel dashboard navigation
   - URL: <https://vercel.com/changelog/new-dashboard-navigation-available>
   - Borrowed: restrained navigation with stable route context.

4. IBM Carbon data-table usage
   - URL: <https://carbondesignsystem.com/components/data-table/usage/>
   - Borrowed: dense but scan-safe lower ledgers and matrices.

5. NHS Service Manual typography
   - URL: <https://service-manual.nhs.uk/design-system/styles/typography>
   - Borrowed: calm hierarchy and accessible line lengths.

## Rejected or constrained interpretations

1. Rejected: the booking UI can talk directly to live supplier lists.
   - Why: the local blueprint is explicit that search resolves to governed snapshots with freshness and recovery posture.

2. Rejected: selected means held.
   - Why: `ReservationTruthProjection` is the sole authority for exclusivity and hold countdowns.

3. Rejected: appointment record presence or accepted-for-processing equals booked.
   - Why: `BookingConfirmationTruthProjection` requires authoritative outcome plus durable proof or same-commit read-after-write.

4. Rejected: async or disputed confirmation can still look calm.
   - Why: pending and reconciliation are first-class same-shell states.

5. Rejected: manage can infer capability or safety from page shape.
   - Why: manage exposure must bind current capability, continuity evidence, route writability, and safety-preemption law.

6. Rejected: waitlist or fallback is somebody else’s problem later.
   - Why: search, offer, and commit already depend on typed continuation truth.
"""


VISUAL_REFERENCE_NOTES = {
    "taskId": TASK_ID,
    "visualMode": VISUAL_MODE,
    "reviewedAt": TODAY,
    "sources": [
        {
            "name": "Playwright Screenshots",
            "url": "https://playwright.dev/docs/screenshots",
            "borrowed": "Deterministic proof capture for atlas states and reduced-motion screenshots.",
            "appliedTo": ["desktop screenshots", "mobile-reduced screenshots"],
        },
        {
            "name": "Playwright Trace Viewer",
            "url": "https://playwright.dev/docs/trace-viewer",
            "borrowed": "Interactive evidence for selection-sync behaviour.",
            "appliedTo": ["stage selection proof", "formula selection proof"],
        },
        {
            "name": "Playwright Aria Snapshots",
            "url": "https://playwright.dev/docs/aria-snapshots",
            "borrowed": "Landmark and parity validation for the atlas.",
            "appliedTo": ["aria snapshot output", "keyboard navigation proof"],
        },
        {
            "name": "Linear changelog",
            "url": "https://linear.app/changelog",
            "borrowed": "Muted chrome and high-signal inspector treatment.",
            "appliedTo": ["masthead", "right inspector", "quiet rails"],
        },
        {
            "name": "Vercel Academy nested layouts",
            "url": "https://vercel.com/academy/nextjs-foundations/nested-layouts",
            "borrowed": "Persistent left-rail, center-canvas, right-inspector shell discipline.",
            "appliedTo": ["atlas layout"],
        },
        {
            "name": "Vercel dashboard navigation",
            "url": "https://vercel.com/changelog/new-dashboard-navigation-available",
            "borrowed": "Calm stage navigation and route framing.",
            "appliedTo": ["left flow-stage rail"],
        },
        {
            "name": "IBM Carbon data table usage",
            "url": "https://carbondesignsystem.com/components/data-table/usage/",
            "borrowed": "Dense lower formula, schema, and parity tables.",
            "appliedTo": ["lower ledgers", "manage-state matrix"],
        },
        {
            "name": "NHS Service Manual typography",
            "url": "https://service-manual.nhs.uk/design-system/styles/typography",
            "borrowed": "Readable type hierarchy with restrained emphasis.",
            "appliedTo": ["type scale", "paragraph rhythm"],
        },
        {
            "name": "NHS Service Manual content guidance",
            "url": "https://service-manual.nhs.uk/content",
            "borrowed": "Direct language and explicit next-step wording.",
            "appliedTo": ["inspector copy", "state summaries", "fallback wording"],
        },
        {
            "name": "NHS Service Manual error message",
            "url": "https://service-manual.nhs.uk/design-system/components/error-message",
            "borrowed": "Clear recovery cues without alarmist phrasing.",
            "appliedTo": ["stale and blocked state copy"],
        },
    ],
}


def build_schema_base(title: str, description: str) -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"vecells://contracts/{title}",
        "title": title,
        "description": description,
        "type": "object",
        "additionalProperties": False,
        "x-taskId": TASK_ID,
        "x-contractVersion": CONTRACT_VERSION,
    }


def build_slot_search_session_schema() -> dict[str, object]:
    schema = build_schema_base(
        "SlotSearchSession",
        "Governed search session contract for Phase 4 booking snapshot production.",
    )
    schema["required"] = [
        "slotSearchSessionId",
        "bookingCaseId",
        "caseVersionRef",
        "searchPolicyRef",
        "policyBundleHash",
        "providerAdapterBindingRef",
        "providerAdapterBindingHash",
        "capabilityResolutionRef",
        "capabilityTupleHash",
        "selectionAudience",
        "requestedActionScope",
        "routeIntentBindingRef",
        "routeIntentTupleHash",
        "providerSearchSliceRefs",
        "slotSetSnapshotRef",
        "coverageState",
        "createdAt",
        "expiresAt",
    ]
    schema["properties"] = {
        "slotSearchSessionId": ref_string("Stable search-session identifier."),
        "bookingCaseId": ref_string("Owning BookingCase identifier."),
        "caseVersionRef": ref_string("Active BookingCase version at session creation."),
        "searchPolicyRef": ref_string("Compiled SearchPolicy reference from 278."),
        "policyBundleHash": ref_string("Hash of the active compiled policy bundle."),
        "providerAdapterBindingRef": ref_string("Current BookingProviderAdapterBinding reference from 279."),
        "providerAdapterBindingHash": ref_string("Current BookingProviderAdapterBinding hash from 279."),
        "capabilityResolutionRef": ref_string("Current BookingCapabilityResolution reference from 279."),
        "capabilityTupleHash": ref_string("Current BookingCapabilityResolution capabilityTupleHash."),
        "selectionAudience": enum_string(["patient", "staff"], "Audience that owns the search shell."),
        "requestedActionScope": enum_string(
            ["search_slots", "book_slot", "view_appointment", "request_staff_assist"],
            "Requested booking action scope.",
        ),
        "routeIntentBindingRef": ref_string("Current route-intent binding ref."),
        "surfaceRouteContractRef": ref_string("Current surface route contract ref.", nullable=True),
        "surfacePublicationRef": ref_string("Current surface publication ref.", nullable=True),
        "runtimePublicationBundleRef": ref_string("Current runtime publication bundle ref.", nullable=True),
        "routeIntentTupleHash": ref_string("Hash of the current route-intent tuple."),
        "queryEnvelope": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "requestedStartAt",
                "requestedEndAt",
                "timeZone",
                "modality",
                "sitePreferences",
                "sameBandReorderSlackMinutesByWindow",
            ],
            "properties": {
                "requestedStartAt": iso_timestamp("Requested search start time."),
                "requestedEndAt": iso_timestamp("Requested search end time."),
                "timeZone": ref_string("Search-time display timezone."),
                "modality": enum_string(["in_person", "remote", "either"], "Requested modality posture."),
                "sitePreferences": {"type": "array", "items": {"type": "string"}},
                "sameBandReorderSlackMinutesByWindow": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["preferred", "acceptable"],
                    "properties": {
                        "preferred": {"type": "integer", "minimum": 0},
                        "acceptable": {"type": "integer", "minimum": 0},
                    },
                },
            },
        },
        "temporalNormalizationEnvelopeRef": ref_string("Linked TemporalNormalizationEnvelope ref.", nullable=True),
        "providerSearchSliceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        "slotSetSnapshotRef": ref_string("Current SlotSetSnapshot ref."),
        "coverageState": enum_string(SEARCH_COVERAGE_STATES, "Aggregated provider coverage state."),
        "createdAt": iso_timestamp("Search-session creation time."),
        "expiresAt": iso_timestamp("Snapshot selectability expiry time."),
    }
    schema["x-formulas"] = {"SnapshotSelectable": FORMULAS["SnapshotSelectable"]}
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["booking_case_pack"], SOURCE_REFS["booking_capability_pack"]]
    return schema


def build_provider_search_slice_schema() -> dict[str, object]:
    schema = build_schema_base(
        "ProviderSearchSlice",
        "Per-provider search slice covering coverage truth, degradation, and raw payload lineage.",
    )
    schema["required"] = [
        "providerSearchSliceId",
        "slotSearchSessionRef",
        "supplierRef",
        "searchWindowStartAt",
        "searchWindowEndAt",
        "coverageState",
        "returnedRawCount",
        "normalizedCount",
        "deduplicatedCount",
        "filteredCount",
        "surfacedCount",
        "rawPayloadRef",
        "completedAt",
    ]
    schema["properties"] = {
        "providerSearchSliceId": ref_string("Stable ProviderSearchSlice identifier."),
        "slotSearchSessionRef": ref_string("Owning SlotSearchSession ref."),
        "supplierRef": ref_string("Supplier or source system reference."),
        "searchWindowStartAt": iso_timestamp("Slice-specific lower time bound."),
        "searchWindowEndAt": iso_timestamp("Slice-specific upper time bound."),
        "coverageState": enum_string(SEARCH_COVERAGE_STATES, "Provider coverage or degradation state."),
        "returnedRawCount": {"type": "integer", "minimum": 0},
        "normalizedCount": {"type": "integer", "minimum": 0},
        "deduplicatedCount": {"type": "integer", "minimum": 0},
        "filteredCount": {"type": "integer", "minimum": 0},
        "surfacedCount": {"type": "integer", "minimum": 0},
        "rejectReasonCounters": {
            "type": "object",
            "additionalProperties": {"type": "integer", "minimum": 0},
            "description": "Reject counters for filter and supplier-specific unsupported reasons.",
        },
        "rawPayloadRef": ref_string("Audit-safe raw payload reference."),
        "degradationReasonRefs": {"type": "array", "items": {"type": "string"}},
        "completedAt": iso_timestamp("Completion or final timeout timestamp."),
    }
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["runtime"]]
    return schema


def build_temporal_normalization_envelope_schema() -> dict[str, object]:
    schema = build_schema_base(
        "TemporalNormalizationEnvelope",
        "Timezone, DST, and clock-skew normalization contract for booking slot search and commit.",
    )
    schema["required"] = [
        "temporalNormalizationEnvelopeId",
        "slotSearchSessionRef",
        "sourceTimeZone",
        "displayTimeZone",
        "clockSkewMilliseconds",
        "ambiguousLocalTimePolicy",
        "normalizationVersionRef",
        "generatedAt",
    ]
    schema["properties"] = {
        "temporalNormalizationEnvelopeId": ref_string("Stable normalization-envelope identifier."),
        "slotSearchSessionRef": ref_string("Owning SlotSearchSession ref."),
        "sourceTimeZone": ref_string("Supplier or source timezone."),
        "displayTimeZone": ref_string("Audience-safe normalized timezone."),
        "clockSkewMilliseconds": {"type": "integer"},
        "ambiguousLocalTimePolicy": enum_string(
            ["prefer_fold_0", "prefer_fold_1", "require_supplier_offset", "reject_until_resolved"],
            "Policy for ambiguous DST local timestamps.",
        ),
        "dstBoundaryRefs": {"type": "array", "items": {"type": "string"}},
        "normalizationVersionRef": ref_string("Versioned normalization rule bundle ref."),
        "generatedAt": iso_timestamp("Normalization timestamp."),
    }
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["runtime"]]
    return schema


def build_canonical_slot_identity_schema() -> dict[str, object]:
    schema = build_schema_base(
        "CanonicalSlotIdentity",
        "Deduplication-safe canonical slot identity contract.",
    )
    schema["required"] = [
        "canonicalSlotIdentityId",
        "supplierRef",
        "capacityUnitRef",
        "scheduleRef",
        "locationRef",
        "practitionerRef",
        "serviceRef",
        "slotStartAtEpoch",
        "slotEndAtEpoch",
        "modality",
        "canonicalTieBreakKey",
        "identityStrength",
        "sourceHash",
    ]
    schema["properties"] = {
        "canonicalSlotIdentityId": ref_string("Stable canonical slot identity ref."),
        "supplierRef": ref_string("Supplier ref."),
        "supplierSlotRef": ref_string("Supplier-local slot identifier.", nullable=True),
        "capacityUnitRef": ref_string("Canonical capacity unit ref."),
        "scheduleRef": ref_string("Canonical schedule ref."),
        "locationRef": ref_string("Canonical location ref."),
        "practitionerRef": ref_string("Canonical practitioner or clinician-type ref."),
        "serviceRef": ref_string("Canonical service ref."),
        "slotStartAtEpoch": {"type": "integer", "description": "Normalized start epoch milliseconds."},
        "slotEndAtEpoch": {"type": "integer", "description": "Normalized end epoch milliseconds."},
        "modality": enum_string(["in_person", "remote"], "Canonical modality."),
        "canonicalTieBreakKey": ref_string("Stable ordering tie-break key."),
        "identityStrength": enum_string(["strong", "medium", "weak"], "Strength of slot-identity proof."),
        "sourceHash": ref_string("Hash of source-identifying normalized input."),
    }
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["phase0_foundation"]]
    return schema


def build_slot_set_snapshot_schema() -> dict[str, object]:
    schema = build_schema_base(
        "SlotSetSnapshot",
        "Persisted searchable and selectable slot set for one SlotSearchSession.",
    )
    schema["required"] = [
        "slotSetSnapshotId",
        "searchSessionId",
        "searchPolicyRef",
        "caseVersionRef",
        "policyBundleHash",
        "providerAdapterBindingRef",
        "providerAdapterBindingHash",
        "capabilityResolutionRef",
        "capabilityTupleHash",
        "slotCount",
        "candidateCount",
        "snapshotChecksum",
        "candidateIndexRef",
        "filterPlanVersion",
        "rankPlanVersion",
        "coverageState",
        "recoveryStateRef",
        "fetchedAt",
        "expiresAt",
    ]
    schema["properties"] = {
        "slotSetSnapshotId": ref_string("Stable SlotSetSnapshot identifier."),
        "searchSessionId": ref_string("Owning SlotSearchSession ref."),
        "searchPolicyRef": ref_string("Owning SearchPolicy ref."),
        "caseVersionRef": ref_string("BookingCase version bound into the snapshot."),
        "policyBundleHash": ref_string("Compiled policy bundle hash."),
        "providerAdapterBindingRef": ref_string("Binding ref from 279."),
        "providerAdapterBindingHash": ref_string("Binding hash from 279."),
        "capabilityResolutionRef": ref_string("Capability resolution ref from 279."),
        "capabilityTupleHash": ref_string("Capability tuple hash from 279."),
        "slotCount": {"type": "integer", "minimum": 0},
        "candidateCount": {"type": "integer", "minimum": 0},
        "snapshotChecksum": ref_string("Checksum over the persisted normalized candidate set."),
        "candidateIndexRef": ref_string("Frozen candidate index ref."),
        "filterPlanVersion": ref_string("Versioned hard-filter plan ref."),
        "rankPlanVersion": ref_string("Versioned RankPlan ref."),
        "coverageState": enum_string(SEARCH_COVERAGE_STATES, "Aggregated coverage state."),
        "recoveryStateRef": ref_string("Current SlotSnapshotRecoveryState ref."),
        "fetchedAt": iso_timestamp("Snapshot fetch completion time."),
        "expiresAt": iso_timestamp("Snapshot selectability expiry time."),
    }
    schema["x-formulas"] = {"SnapshotSelectable": FORMULAS["SnapshotSelectable"]}
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["booking_capability_pack"]]
    return schema


def build_slot_snapshot_recovery_state_schema() -> dict[str, object]:
    schema = build_schema_base(
        "SlotSnapshotRecoveryState",
        "Same-shell recovery-state authority for slot-search surfaces.",
    )
    schema["required"] = [
        "slotSnapshotRecoveryStateId",
        "slotSetSnapshotRef",
        "viewState",
        "coverageState",
        "reasonCodes",
        "supportHelpVisible",
        "generatedAt",
    ]
    schema["properties"] = {
        "slotSnapshotRecoveryStateId": ref_string("Stable recovery-state ref."),
        "slotSetSnapshotRef": ref_string("Owning SlotSetSnapshot ref."),
        "viewState": enum_string(SEARCH_VIEW_STATES, "Renderable recovery state for the booking shell."),
        "coverageState": enum_string(SEARCH_COVERAGE_STATES, "Coverage state used to derive viewState."),
        "reasonCodes": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        "supportHelpVisible": {"type": "boolean"},
        "sameShellActionRef": ref_string("Dominant same-shell action or recovery route ref.", nullable=True),
        "generatedAt": iso_timestamp("Recovery state generation time."),
    }
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["patient_portal"]]
    return schema


def build_rank_plan_contract() -> dict[str, object]:
    sample_rank_plan = {
        "rankPlanId": "RANK_PLAN_280_DEFAULT",
        "rankPlanVersion": "280.rank-plan.default.v1",
        "preferredWindowMinutes": 2880,
        "acceptableWindowMinutes": 10080,
        "sameBandReorderSlackMinutesByWindow": {"preferred": 180, "acceptable": 240},
        "weights": {
            "w_delay": 0.36,
            "w_continuity": 0.21,
            "w_site": 0.14,
            "w_tod": 0.12,
            "w_travel": 0.10,
            "w_modality": 0.07,
        },
        "taus": {"tau_delay": 240, "tau_tod": 120, "tau_travel": 60},
        "stableTieBreakRule": "canonicalTieBreakKey ascending",
    }
    proof_rows = [
        {
            "candidateRank": 1,
            "canonicalSlotIdentityRef": "slot_identity_280_001",
            "windowClass": 2,
            "frontierMembership": True,
            "softScore": 0.887,
            "patientReasonCueRefs": ["cue_soonest", "cue_best_match"],
        },
        {
            "candidateRank": 2,
            "canonicalSlotIdentityRef": "slot_identity_280_002",
            "windowClass": 2,
            "frontierMembership": True,
            "softScore": 0.842,
            "patientReasonCueRefs": ["cue_same_day"],
        },
        {
            "candidateRank": 3,
            "canonicalSlotIdentityRef": "slot_identity_280_003",
            "windowClass": 1,
            "frontierMembership": False,
            "softScore": 0.731,
            "patientReasonCueRefs": ["cue_good_match"],
        },
    ]
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "definitions": {
            "RankPlan": {
                "requiredFields": [
                    "rankPlanId",
                    "rankPlanVersion",
                    "preferredWindowMinutes",
                    "acceptableWindowMinutes",
                    "sameBandReorderSlackMinutesByWindow",
                    "weights",
                    "taus",
                    "stableTieBreakRule",
                ],
                "constraints": [
                    "sum w_* = 1",
                    "do not include both waitMinutes and waitDays in the same linear score",
                ],
            },
            "CapacityRankProof": {
                "requiredFields": [
                    "capacityRankProofId",
                    "slotSetSnapshotRef",
                    "rankPlanVersion",
                    "proofChecksum",
                    "orderedCandidateRefs",
                    "generatedAt",
                ],
                "stableOrderingRule": [
                    "higher windowClass first",
                    "inside Frontier_b sort by softScore desc, startAtEpoch asc, canonicalTieBreakKey asc",
                    "outside Frontier_b sort by startAtEpoch asc, softScore desc, canonicalTieBreakKey asc",
                ],
            },
            "CapacityRankExplanation": {
                "requiredFields": [
                    "capacityRankExplanationId",
                    "canonicalSlotIdentityRef",
                    "rankFeatures",
                    "windowClass",
                    "frontierMembership",
                    "patientReasonCueRefs",
                ],
            },
            "CapacityRankDisclosurePolicy": {
                "requiredFields": [
                    "capacityRankDisclosurePolicyId",
                    "patientSafeFields",
                    "staffReplayFields",
                    "operationsFields",
                ]
            },
        },
        "formulas": {
            key: FORMULAS[key]
            for key in ["windowClass", "earliestStart_b", "Frontier_b", "softScore"]
        },
        "normalizedFeatureDefinitions": {
            "f_delay": "exp(-waitMinutes(s) / tau_delay)",
            "f_continuity": "continuityScore(s)",
            "f_site": "1 for preferred site, 0.5 for neutral site, 0 otherwise",
            "f_tod": "exp(-abs(midpointLocalMinutes(s) - preferredMidpointMinutes) / tau_tod)",
            "f_travel": "exp(-travelMinutes(s) / tau_travel)",
            "f_modality": "1 for preferred modality, 0 otherwise",
        },
        "sampleRankPlan": sample_rank_plan,
        "sampleCapacityRankProof": {
            "capacityRankProofId": digest("crp", proof_rows),
            "slotSetSnapshotRef": "snapshot_280_renderable",
            "rankPlanVersion": sample_rank_plan["rankPlanVersion"],
            "proofChecksum": lower_hex(proof_rows),
            "orderedCandidateRefs": [row["canonicalSlotIdentityRef"] for row in proof_rows],
            "generatedAt": f"{TODAY}T10:00:00Z",
            "rankedCandidates": proof_rows,
        },
        "x-sourceRefs": [SOURCE_REFS["phase4_booking"], SOURCE_REFS["patient_portal"]],
    }


def build_offer_session_schema() -> dict[str, object]:
    schema = build_schema_base(
        "OfferSession",
        "OfferSession contract over pre-ranked candidates, not raw supplier slot ids.",
    )
    schema["required"] = [
        "offerSessionId",
        "bookingCaseId",
        "slotSetSnapshotRef",
        "rankPlanVersion",
        "capacityRankProofRef",
        "selectionToken",
        "selectedCandidateHash",
        "selectedCanonicalSlotIdentityRef",
        "reservationTruthProjectionRef",
        "selectionProofHash",
        "truthMode",
        "expiresAt",
    ]
    schema["properties"] = {
        "offerSessionId": ref_string("Stable OfferSession identifier."),
        "bookingCaseId": ref_string("Owning BookingCase identifier."),
        "slotSetSnapshotRef": ref_string("Selected SlotSetSnapshot ref."),
        "rankPlanVersion": ref_string("Current RankPlan version ref."),
        "capacityRankProofRef": ref_string("Current CapacityRankProof ref."),
        "selectionToken": ref_string("Interaction-scoped selection token."),
        "selectedCandidateHash": ref_string("Hash of the selected candidate proof row."),
        "selectedCanonicalSlotIdentityRef": ref_string("Canonical slot identity ref."),
        "reservationTruthProjectionRef": ref_string("Current ReservationTruthProjection ref."),
        "selectionProofHash": ref_string("Hash of the exact proof tuple shown to the user."),
        "truthMode": enum_string(
            ["truthful_nonexclusive", "exclusive_hold", "degraded_manual_pending"],
            "Interaction truth mode for the dominant offer.",
        ),
        "compareModeState": enum_string(["list", "calendar", "compare"], "Visible offer presentation mode."),
        "expiresAt": iso_timestamp("Interaction TTL. Never proof of exclusivity by itself."),
    }
    schema["x-formulas"] = {"Frontier_b": FORMULAS["Frontier_b"], "softScore": FORMULAS["softScore"]}
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["phase0_foundation"]]
    return schema


def build_reservation_truth_projection_contract() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "schemaVersion": "2020-12",
        "title": "ReservationTruthProjection",
        "requiredFields": [
            "reservationTruthProjectionId",
            "capacityReservationRef",
            "canonicalReservationKey",
            "sourceDomain",
            "sourceObjectRef",
            "selectedAnchorRef",
            "truthState",
            "displayExclusivityState",
            "countdownMode",
            "exclusiveUntilAt",
            "reservationVersionRef",
            "truthBasisHash",
            "projectionFreshnessEnvelopeRef",
            "reasonRefs",
            "generatedAt",
        ],
        "truthStates": RESERVATION_TRUTH_STATES,
        "displayExclusivityStates": DISPLAY_EXCLUSIVITY_STATES,
        "countdownModes": COUNTDOWN_MODES,
        "laws": [
            "ReservationTruthProjection is the sole user-visible authority for reservation language, hold countdowns, and truthful nonexclusive wording on booking, waitlist, hub, and equivalent capacity-claim surfaces.",
            "displayExclusivityState = exclusive is legal only while the linked CapacityReservation.state = held, commitMode = exclusive_hold, the linked CapacityIdentity remains strong enough for exclusivity, and ReservationTruth(r,t) = 1.",
            "countdownMode = hold_expiry is legal only when the linked reservation is actually held and the expiry is the real hold expiry. OfferSession.expiresAt, WaitlistOffer.offerExpiryAt, client-local timers, or selection TTLs alone may not drive a hold countdown.",
            "truthState = truthful_nonexclusive must render explicit live-confirmation semantics and may not render reserved-for-you language.",
            "truthState = pending_confirmation may preserve the selected capacity claim and explain that the system is confirming the booking, but it may not widen into final booked reassurance without the governing authoritative settlement.",
            "If the linked reservation expires, is released, is superseded, becomes disputed, or fails the current freshness or truth-basis check, the projection must degrade to released, expired, revalidation_required, or unavailable immediately and suppress stale exclusivity or countdown state in place.",
        ],
        "examples": {
            "truthfulNonexclusive": {
                "truthState": "truthful_nonexclusive",
                "displayExclusivityState": "nonexclusive",
                "countdownMode": "none",
                "dominantCue": "available and confirmed when you book",
            },
            "exclusiveHeld": {
                "truthState": "exclusive_held",
                "displayExclusivityState": "exclusive",
                "countdownMode": "hold_expiry",
                "dominantCue": "held for you until the real hold expiry",
            },
        },
        "x-sourceRefs": [SOURCE_REFS["phase0_foundation"], SOURCE_REFS["phase4_booking"]],
    }


def build_booking_transaction_schema() -> dict[str, object]:
    schema = build_schema_base(
        "BookingTransaction",
        "Append-only booking commit contract separating acknowledgement, processing, external observation, and authoritative outcome.",
    )
    schema["required"] = [
        "bookingTransactionId",
        "bookingCaseId",
        "snapshotId",
        "canonicalReservationKey",
        "selectedCandidateHash",
        "policyBundleHash",
        "providerAdapterBindingRef",
        "providerAdapterBindingHash",
        "idempotencyKey",
        "preflightVersion",
        "reservationVersion",
        "reservationTruthProjectionRef",
        "confirmationTruthProjectionRef",
        "selectedSlotRef",
        "localAckState",
        "processingAcceptanceState",
        "externalObservationState",
        "authoritativeOutcomeState",
        "createdAt",
    ]
    schema["properties"] = {
        "bookingTransactionId": ref_string("Stable booking-transaction identifier."),
        "bookingCaseId": ref_string("Owning BookingCase identifier."),
        "snapshotId": ref_string("Governing SlotSetSnapshot ref."),
        "canonicalReservationKey": ref_string("Canonical reservation key."),
        "selectedCandidateHash": ref_string("Hash of the selected candidate proof."),
        "policyBundleHash": ref_string("Compiled policy bundle hash."),
        "providerAdapterBindingRef": ref_string("Current BookingProviderAdapterBinding ref."),
        "providerAdapterBindingHash": ref_string("Current BookingProviderAdapterBinding hash."),
        "idempotencyKey": ref_string("Exact-once idempotency key."),
        "preflightVersion": ref_string("Preflight version token."),
        "reservationVersion": ref_string("ReservationAuthority version token."),
        "reservationTruthProjectionRef": ref_string("Current ReservationTruthProjection ref."),
        "confirmationTruthProjectionRef": ref_string("Current BookingConfirmationTruthProjection ref."),
        "selectedSlotRef": ref_string("Selected canonical slot ref."),
        "localAckState": enum_string(LOCAL_ACK_STATES, "Local acknowledgement state."),
        "processingAcceptanceState": enum_string(PROCESSING_ACCEPTANCE_STATES, "Dispatch or supplier-processing state."),
        "externalObservationState": enum_string(EXTERNAL_OBSERVATION_STATES, "Observed supplier-side state."),
        "authoritativeOutcomeState": enum_string(AUTHORITATIVE_OUTCOME_STATES, "Authoritative booking outcome state."),
        "compensationDispositionState": enum_string(
            ["none", "required", "suppressed", "completed"],
            "Compensation seam posture when commit or post-commit work diverges.",
        ),
        "externalConfirmationGateRef": ref_string("Linked ExternalConfirmationGate ref.", nullable=True),
        "adapterDispatchAttemptRef": ref_string("Linked AdapterDispatchAttempt ref.", nullable=True),
        "createdAt": iso_timestamp("Transaction creation time."),
        "updatedAt": iso_timestamp("Transaction update time."),
    }
    schema["x-formulas"] = {
        "RevalidationPass": FORMULAS["RevalidationPass"],
        "RouteWritable": FORMULAS["RouteWritable"],
    }
    schema["x-sourceRefs"] = [SOURCE_REFS["phase4_booking"], SOURCE_REFS["phase0_foundation"], SOURCE_REFS["booking_capability_pack"]]
    return schema


def build_booking_confirmation_truth_projection_schema() -> dict[str, object]:
    schema = build_schema_base(
        "BookingConfirmationTruthProjection",
        "Sole audience-safe authority for booking outcome posture.",
    )
    schema["required"] = [
        "bookingConfirmationTruthProjectionId",
        "bookingCaseRef",
        "bookingTransactionRef",
        "selectedSlotRef",
        "appointmentRecordRef",
        "externalConfirmationGateRef",
        "commandSettlementRecordRef",
        "latestReceiptCheckpointRef",
        "authoritativeProofClass",
        "confirmationTruthState",
        "patientVisibilityState",
        "manageExposureState",
        "artifactExposureState",
        "reminderExposureState",
        "continuityEvidenceRef",
        "truthBasisHash",
        "projectionFreshnessEnvelopeRef",
        "settlementRevision",
        "generatedAt",
    ]
    schema["properties"] = {
        "bookingConfirmationTruthProjectionId": ref_string("Stable confirmation-truth projection id."),
        "bookingCaseRef": ref_string("Owning BookingCase ref."),
        "bookingTransactionRef": ref_string("Owning BookingTransaction ref."),
        "selectedSlotRef": ref_string("Selected slot ref."),
        "appointmentRecordRef": ref_string("AppointmentRecord ref.", nullable=True),
        "externalConfirmationGateRef": ref_string("Linked ExternalConfirmationGate ref.", nullable=True),
        "commandSettlementRecordRef": ref_string("Current CommandSettlementRecord ref.", nullable=True),
        "latestReceiptCheckpointRef": ref_string("Current AdapterReceiptCheckpoint ref.", nullable=True),
        "providerReference": ref_string("Durable provider reference when present.", nullable=True),
        "authoritativeProofClass": enum_string(
            ["none", "durable_provider_reference", "same_commit_read_after_write", "reconciled_confirmation"],
            "Proof class for confirmed booking truth.",
        ),
        "confirmationTruthState": enum_string(CONFIRMATION_TRUTH_STATES, "Authoritative confirmation truth state."),
        "patientVisibilityState": enum_string(PATIENT_VISIBILITY_STATES, "Patient-safe visibility posture."),
        "manageExposureState": enum_string(MANAGE_EXPOSURE_STATES, "Manage exposure state."),
        "artifactExposureState": enum_string(ARTIFACT_EXPOSURE_STATES, "Artifact exposure state."),
        "reminderExposureState": enum_string(REMINDER_EXPOSURE_STATES, "Reminder exposure state."),
        "continuityEvidenceRef": ref_string("Linked BookingContinuityEvidenceProjection ref."),
        "truthBasisHash": ref_string("Truth-basis hash."),
        "projectionFreshnessEnvelopeRef": ref_string("Projection freshness envelope ref."),
        "settlementRevision": {"type": "integer", "minimum": 1},
        "generatedAt": iso_timestamp("Generation timestamp."),
    }
    schema["x-laws"] = [
        "BookingConfirmationTruthProjection is the sole audience-safe authority for booking commit outcome posture across patient booking shells, request-detail booking cards, appointment-manage surfaces, reminder and artifact affordances, staff-assisted booking panels, and support or operations booking summaries.",
        "confirmationTruthState = confirmed is legal only when the linked BookingTransaction.authoritativeOutcomeState = booked, the current CommandSettlementRecord agrees, and either a durable provider reference or same-commit read-after-write proof binds to that same transaction lineage.",
        "Local acknowledgement, accepted-for-processing, provider acceptance, callback arrival without a hard match, detached appointment rows, or stale AppointmentRecord presence may widen pending explanation but they may not produce booked_summary, writable manage, handoff_ready artifacts, or scheduled reminders.",
        "Duplicate confirm clicks, refresh re-entry, outbox replay, and callback replay must monotonically advance the same current projection for the active transaction chain.",
    ]
    schema["x-sourceRefs"] = [SOURCE_REFS["phase0_foundation"], SOURCE_REFS["phase4_booking"], SOURCE_REFS["patient_portal"]]
    return schema


def build_appointment_manage_bundle() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "commandDefinitions": {
            "AppointmentManageCommand": {
                "requiredFields": [
                    "commandId",
                    "appointmentId",
                    "bookingCaseId",
                    "actionScope",
                    "routeIntentBindingRef",
                    "canonicalObjectDescriptorRef",
                    "governingObjectVersionRef",
                    "routeContractDigestRef",
                    "routeIntentTupleHash",
                    "routeProfileRef",
                    "policyBundleRef",
                    "capabilityResolutionRef",
                    "providerAdapterBindingRef",
                    "providerAdapterBindingHash",
                    "adapterContractProfileRef",
                    "capabilityTupleHash",
                    "freshnessToken",
                    "governingFenceEpoch",
                    "surfaceRouteContractRef",
                    "surfacePublicationRef",
                    "runtimePublicationBundleRef",
                    "releaseRecoveryDispositionRef",
                    "idempotencyKey",
                    "submittedByMode",
                    "submittedAt",
                ],
                "actionScopeEnum": APPOINTMENT_MANAGE_ACTIONS,
            },
            "BookingManageSettlement": {
                "requiredFields": [
                    "settlementId",
                    "bookingCaseId",
                    "appointmentId",
                    "actionScope",
                    "routeIntentBindingRef",
                    "canonicalObjectDescriptorRef",
                    "governingObjectVersionRef",
                    "routeIntentTupleHash",
                    "capabilityResolutionRef",
                    "capabilityTupleHash",
                    "result",
                    "receiptTextRef",
                    "experienceContinuityEvidenceRef",
                    "causalToken",
                    "transitionEnvelopeRef",
                    "surfacePublicationRef",
                    "runtimePublicationBundleRef",
                    "releaseRecoveryDispositionRef",
                    "routeFreezeDispositionRef",
                    "recoveryRouteRef",
                    "presentationArtifactRef",
                    "recordedAt",
                ],
                "resultEnum": MANAGE_RESULTS,
            },
            "BookingContinuityEvidenceProjection": {
                "requiredFields": [
                    "bookingContinuityEvidenceProjectionId",
                    "bookingCaseId",
                    "appointmentId",
                    "controlCode",
                    "routeFamilyRef",
                    "routeContinuityEvidenceContractRef",
                    "selectedAnchorRef",
                    "selectedAnchorTupleHashRef",
                    "surfacePublicationRef",
                    "runtimePublicationBundleRef",
                    "latestManageSettlementRef",
                    "latestRecoveryRouteRef",
                    "experienceContinuityEvidenceRef",
                    "continuityTupleHash",
                    "validationState",
                    "blockingRefs",
                    "capturedAt",
                ],
                "validationStateEnum": CONTINUITY_VALIDATION_STATES,
            },
            "ReminderPlan": {
                "requiredFields": [
                    "reminderPlanId",
                    "appointmentId",
                    "bookingCaseId",
                    "templateVersionRef",
                    "channelContractRefs",
                    "scheduleState",
                    "nextPlannedSendAt",
                    "latestReceiptCheckpointRef",
                ],
                "scheduleStates": ["blocked", "pending_schedule", "scheduled", "cancelled", "failed"],
            },
            "AppointmentPresentationArtifact": {
                "requiredFields": [
                    "appointmentPresentationArtifactId",
                    "appointmentId",
                    "artifactPresentationContractRef",
                    "artifactExposureState",
                    "summaryRef",
                    "handoffChannelRefs",
                    "generatedAt",
                ],
            },
        },
        "predicates": {
            "Cancelable": FORMULAS["Cancelable"],
            "Reschedulable": FORMULAS["Reschedulable"],
            "RouteWritable": FORMULAS["RouteWritable"],
        },
        "routeRules": [
            "Cancel, reschedule, reminder, and detail-update child states stay inside the same booking shell and can show supplier pending, stale or changed availability, safety review required, and controlled recovery or support fallback without route reset.",
            "Manage exposure remains live only while BookingCapabilityProjection, PatientShellConsistencyProjection, surface publication, and, when embedded, PatientEmbeddedSessionProjection remain valid for the same appointment lineage.",
            "Calendar, reminder, attendance, and browser-handoff actions stay summary-first through AppointmentPresentationArtifact under ArtifactPresentationContract.",
        ],
        "safetyPreemptionRule": "If the submitted payload includes symptom change, worsening condition, or other clinically meaningful free text, do not mutate the appointment directly. First settle EvidenceAssimilationRecord, MaterialDeltaAssessment, EvidenceClassificationDecision, SafetyPreemptionRecord, and SafetyDecisionRecord, then return BookingManageSettlement.result = safety_preempted.",
        "x-sourceRefs": [SOURCE_REFS["phase4_booking"], SOURCE_REFS["phase0_foundation"], SOURCE_REFS["patient_portal"]],
    }


def build_waitlist_and_fallback_stubs() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "stubDefinitions": WAITLIST_STUBS,
        "laws": [
            "An empty candidate set is not enough to conclude there is no supply.",
            "The platform may show no_supply_confirmed only when all required ProviderSearchSlice records have settled to complete coverage for the current search policy.",
            "If RevalidationPass(tx,t) = 0, the system must refresh the current WaitlistDeadlineEvaluation, WaitlistFallbackObligation, and WaitlistContinuationTruthProjection when local continuation is still in play.",
            "Failed or ambiguous supplier outcome must preserve or refresh the current WaitlistFallbackObligation until authoritative booking or durable fallback transfer exists.",
        ],
        "sameShellRecoveryRules": [
            "support_fallback routes to assisted booking without pretending search completed cleanly",
            "callback_fallback keeps the selected or last safe booking anchor visible only as provenance",
            "fallback_to_hub is read-only provenance plus governed handoff status",
        ],
        "x-sourceRefs": [SOURCE_REFS["phase4_booking"], SOURCE_REFS["patient_portal"], SOURCE_REFS["patient_account"]],
    }


def build_gap_log() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "gaps": [
            {
                "gapId": "PHASE4_GAP_280_001",
                "missingSurface": "Deep waitlist offer lifecycle and patient response rules",
                "expectedOwnerTrack": "phase4_waitlist_runtime",
                "temporaryFallback": "280 publishes WaitlistEntry, WaitlistDeadlineEvaluation, WaitlistFallbackObligation, and WaitlistContinuationTruthProjection as typed stubs only.",
                "riskIfUnresolved": "Search, offer, and commit could otherwise branch on prose-only continuation meaning.",
                "typedSeams": [
                    "WaitlistEntry.waitlistEntryId",
                    "WaitlistFallbackObligation.requiredFallbackRoute",
                    "WaitlistContinuationTruthProjection.continuationTruthState",
                ],
            },
            {
                "gapId": "PHASE4_GAP_280_002",
                "missingSurface": "Staff-assisted fallback execution and callback or hub downstream completion",
                "expectedOwnerTrack": "phase4_assisted_booking_runtime",
                "temporaryFallback": "280 freezes typed transfer refs and same-shell route rules without implementing downstream assisted workflows.",
                "riskIfUnresolved": "Commit or no-supply branches could hide a required fallback dependency behind generic failure language.",
                "typedSeams": [
                    "WaitlistFallbackObligation.typedTransferRef",
                    "BookingManageSettlement.recoveryRouteRef",
                    "AppointmentPresentationArtifact.artifactPresentationContractRef",
                ],
            },
            {
                "gapId": "PHASE4_GAP_280_003",
                "missingSurface": "Live supplier adapters, read-after-write, and confirmation-gate execution",
                "expectedOwnerTrack": "phase4_booking_runtime",
                "temporaryFallback": "280 publishes the exact transaction and projection law but leaves provider execution later.",
                "riskIfUnresolved": "Confirmation, reminder, or artifact posture could drift if implementation invents local shortcuts.",
                "typedSeams": [
                    "BookingTransaction.providerAdapterBindingRef",
                    "BookingConfirmationTruthProjection.authoritativeProofClass",
                    "BookingManageSettlement.result",
                ],
            },
        ],
    }


def build_docs() -> tuple[str, str, str]:
    authority_rows = [
        [row["contract"], row["phaseStage"], row["authority"], row["whySeparate"]]
        for row in CONTRACT_SPLIT_ROWS
    ]
    formula_rows = [
        [FORMULAS[key]["name"], FORMULAS[key]["expression"], ", ".join(FORMULAS[key]["machineFields"][:4]) + (" ..." if len(FORMULAS[key]["machineFields"]) > 4 else "")]
        for key in ["SnapshotSelectable", "Frontier_b", "softScore", "RevalidationPass", "RouteWritable", "Cancelable", "Reschedulable"]
    ]
    architecture = f"""# 280 Phase 4 slot snapshot, offer, commit, and manage contract pack

This pack freezes the Booking Phase 4 path from search through manage against the exact authority chain published in `278` and `279`.

- `SlotSearchSession`, `ProviderSearchSlice`, `TemporalNormalizationEnvelope`, `CanonicalSlotIdentity`, `SlotSetSnapshot`, and `SlotSnapshotRecoveryState` freeze search as a snapshot-producing operation.
- `RankPlan`, `CapacityRankProof`, `CapacityRankExplanation`, and `OfferSession` freeze ranking and selection over persisted snapshot truth.
- `ReservationTruthProjection` remains the sole authority for exclusivity and truthful hold posture.
- `BookingTransaction` and `BookingConfirmationTruthProjection` freeze commit, confirmation, and compensation semantics.
- `AppointmentManageCommand`, `BookingManageSettlement`, `BookingContinuityEvidenceProjection`, `ReminderPlan`, and `AppointmentPresentationArtifact` freeze manage and continuity semantics.
- typed waitlist and fallback seams are published now because search, offer, and commit already depend on them.

## Contract split

{md_table(["Contract", "Phase", "Authority", "Why separate"], authority_rows)}

## Mandatory formulas

{md_table(["Formula", "Expression", "Machine fields"], formula_rows)}

## Core closures

1. Search resolves to governed snapshots with explicit freshness and recovery posture.
2. Selection state alone never implies exclusivity; only `ReservationTruthProjection` may do that.
3. Appointment record presence or accepted-for-processing alone never implies booked truth.
4. Pending and reconciliation remain first-class same-shell states.
5. Manage exposure binds current capability, continuity evidence, and route writability.
6. Waitlist and fallback semantics are typed now instead of deferred as prose debt.

## Published files

{md_table(["File", "Purpose"], [[row["file"], row["authority"]] for row in CONTRACT_SPLIT_ROWS])}

Additional typed gap publication: [PHASE4 interface gap]({repo_path('data/analysis/PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json')}).
"""

    api_doc = f"""# 280 Phase 4 booking search, offer, commit, and manage contracts

Later runtime work must consume these contracts directly. It may not invent new slot, hold, pending, confirmation, or manage meaning in code or UI.

## Route-family contract

| Route family | Governing authority | Allowed calm posture | Same-shell recovery |
| --- | --- | --- | --- |
| `/booking/search` | `SlotSetSnapshot` + `SlotSnapshotRecoveryState` | only when `viewState = renderable` | partial, stale-refresh, no-supply, or support-fallback in place |
| `/booking/offers` | `OfferSession` + `CapacityRankProof` + `ReservationTruthProjection` | selection may persist | selection freezes or recovery routes in place |
| `/booking/confirm` | `BookingTransaction` + `ReservationTruthProjection` + `BookingConfirmationTruthProjection` | none before authoritative confirmation truth | provisional receipt, pending, or reconciliation in place |
| `/booking/manage` | `BookingConfirmationTruthProjection` + `BookingContinuityEvidenceProjection` | only while confirmed + writable + continuity trusted | stale, unsupported, safety-preempted, or reconciliation in place |
| `/booking/reminders` | `BookingConfirmationTruthProjection` + `ReminderPlan` | only while reminder exposure is scheduled | blocked or summary-only |
| `/booking/artifacts` | `BookingConfirmationTruthProjection` + `AppointmentPresentationArtifact` | only while artifact exposure is handoff-ready | summary-only or recovery-only |

## Confirmation and manage exposure

Patient and staff shells may render actionability only from the current truth projections.

- `ReservationTruthProjection` controls exclusivity and hold wording.
- `BookingConfirmationTruthProjection` controls booked summary, manage exposure, artifact exposure, and reminder exposure.
- `BookingManageSettlement` controls same-shell manage results.

Manage exposure is live only while the current capability tuple, binding, route publication, runtime publication bundle, shell consistency, and continuity evidence still validate the same appointment lineage.

## Contract refs consumed from 279

- `BookingCapabilityResolution.capabilityTupleHash`
- `BookingProviderAdapterBinding.bookingProviderAdapterBindingId`
- `BookingProviderAdapterBinding.bindingHash`
- `BookingProviderAdapterBinding.commitContractRef`
- `BookingProviderAdapterBinding.authoritativeReadContractRef`
- `BookingProviderAdapterBinding.manageSupportContractRef`

If any of those refs drift, selection, commit, or manage must degrade to stale or recovery posture instead of inventing a local interpretation.
"""

    security_doc = f"""# 280 Phase 4 reservation truth, revalidation, and manage guardrails

This pack closes the Phase 4 booking truth gaps that are most likely to create false confidence or unsafe writable posture.

## Guardrails

1. Search and commit do not talk to live supplier lists directly.
   - Search resolves to `SlotSetSnapshot`.
   - Commit reuses `SnapshotSelectable(q,t)` and `RevalidationPass(tx,t)`.

2. Selected does not mean held.
   - `OfferSession.expiresAt` is interaction TTL only.
   - reserved wording and hold countdowns may render only from the current `ReservationTruthProjection`.

3. Accepted-for-processing is never equivalent to booked.
   - `BookingTransaction` separates `localAckState`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState`.
   - `BookingConfirmationTruthProjection` is the sole authority for patient or staff booked reassurance.

4. Pending and disputed confirmation are not calm.
   - `confirmation_pending` and `reconciliation_required` are first-class same-shell states.
   - manage, artifact, and reminder exposure remain hidden or summary-only until confirmed.

5. Manage exposure is capability- and continuity-bound.
   - `RouteWritable(tx,t)` binds route publication, runtime publication, shell consistency, and embedded-session validity.
   - `BookingContinuityEvidenceProjection.validationState` must remain `trusted` before writable manage posture stays live.

6. Waitlist and fallback semantics are typed now.
   - `WaitlistFallbackObligation.requiredFallbackRoute` is the authority for no-supply and failed-commit continuation.

## Required exact formulas

- `{FORMULAS['SnapshotSelectable']['expression']}`
- `{FORMULAS['RevalidationPass']['expression']}`
- `{FORMULAS['RouteWritable']['expression']}`
- `{FORMULAS['Cancelable']['expression']}`
- `{FORMULAS['Reschedulable']['expression']}`

## Recovery posture

The same shell must preserve the last safe slot, appointment, or selection anchor whenever truth becomes stale, blocked, pending, or recovery-only. The system may not widen calmness by using toasts, detached appointment rows, reminder-plan existence, or route-local booleans.
"""
    return architecture, api_doc, security_doc


def build_atlas_html() -> str:
    reservation_rows = [
        {"state": state, "meaning": meaning}
        for state, meaning in [
            ("exclusive_held", "Real held reservation with lawful hold countdown."),
            ("truthful_nonexclusive", "Selected offer is still subject to live confirmation."),
            ("pending_confirmation", "Capacity claim is preserved while booking confirmation is still pending."),
            ("confirmed", "Reservation and booking truth have converged."),
            ("disputed", "Supplier or callback truth is contradictory."),
            ("released", "Previously visible claim is released."),
            ("expired", "Previously visible claim expired."),
            ("revalidation_required", "Snapshot or route truth drifted and must refresh."),
            ("unavailable", "Capacity is no longer safely claimable."),
        ]
    ]
    confirmation_rows = [
        {"state": state, "meaning": meaning}
        for state, meaning in [
            ("booking_in_progress", "Local acknowledgement or dispatch may exist, but final truth is unresolved."),
            ("confirmation_pending", "External or weak confirmation is still pending."),
            ("reconciliation_required", "Contradictory or ambiguous confirmation needs governed recovery."),
            ("confirmed", "Booked summary, manage, artifacts, and reminders may widen according to exposure state."),
            ("failed", "Booking failed and must stay in recovery posture."),
            ("expired", "Pending confirmation timed out."),
            ("superseded", "A newer transaction or lineage superseded this projection."),
        ]
    ]
    manage_rows = [
        {"result": result, "meaning": meaning}
        for result, meaning in [
            ("applied", "Manage mutation applied and authoritative continuity still validates."),
            ("supplier_pending", "Manage mutation is accepted locally but still waiting on supplier truth."),
            ("stale_recoverable", "Refresh or reconcile before another ordinary mutation."),
            ("unsupported_capability", "Current route, supplier, or audience cannot perform the requested manage action."),
            ("safety_preempted", "Clinical content must route back into governed request review."),
            ("reconciliation_required", "Supplier or continuity truth is contradictory."),
        ]
    ]
    atlas_data = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "stages": ATLAS_STAGES,
        "formulas": [FORMULAS[key] for key in ["SnapshotSelectable", "windowClass", "Frontier_b", "softScore", "RevalidationPass", "RouteWritable", "Cancelable", "Reschedulable"]],
        "contractSplitRows": CONTRACT_SPLIT_ROWS,
        "stateTableRows": STATE_TABLE_ROWS,
        "scenarios": SCENARIOS,
        "reservationRows": reservation_rows,
        "confirmationRows": confirmation_rows,
        "manageRows": manage_rows,
    }
    escaped_payload = html.escape(json.dumps(atlas_data))
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>280 Booking Flow Contract Atlas</title>
    <style>
      :root {{
        --canvas: #f7f8fa;
        --shell: #eef2f6;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f1720;
        --text-default: #24313d;
        --text-muted: #5e6b78;
        --accent-search: #3158e0;
        --accent-offer: #5b61f6;
        --accent-confirmed: #0f766e;
        --accent-pending: #b7791f;
        --accent-blocked: #b42318;
        --border: #d6dee7;
        --shadow: 0 10px 24px rgba(15, 23, 32, 0.06);
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        background: linear-gradient(180deg, var(--shell), var(--canvas));
        color: var(--text-default);
      }}
      .atlas-root {{
        min-height: 100vh;
        padding: 18px 20px 32px;
      }}
      .frame {{
        max-width: 1680px;
        margin: 0 auto;
        display: grid;
        gap: 16px;
        min-width: 0;
      }}
      .masthead {{
        min-height: 72px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }}
      .wordmark {{
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        letter-spacing: 0;
        color: var(--text-strong);
      }}
      .wordmark svg {{ width: 24px; height: 24px; }}
      .layout {{
        display: grid;
        gap: 16px;
        grid-template-columns: 300px minmax(0, 1fr) 420px;
        align-items: start;
        min-width: 0;
      }}
      .panel {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
        min-width: 0;
      }}
      .rail, .inspector {{
        padding: 14px;
      }}
      .rail h2, .inspector h2, .canvas h2 {{
        margin: 0 0 10px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
      }}
      .button-list {{
        display: grid;
        gap: 8px;
      }}
      button {{
        font: inherit;
        color: inherit;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 10px 12px;
        text-align: left;
        cursor: pointer;
      }}
      button[aria-pressed="true"] {{
        border-color: var(--active-accent, var(--accent-search));
        box-shadow: inset 0 0 0 1px var(--active-accent, var(--accent-search));
        background: color-mix(in srgb, var(--active-accent, var(--accent-search)) 8%, white);
      }}
      button:focus-visible, a:focus-visible {{
        outline: 3px solid color-mix(in srgb, var(--active-accent, var(--accent-search)) 45%, white);
        outline-offset: 2px;
      }}
      .button-label {{
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
      }}
      .button-note {{
        color: var(--text-muted);
        font-size: 13px;
        margin-top: 4px;
      }}
      .canvas {{
        padding: 14px;
        display: grid;
        gap: 14px;
      }}
      .diagram-grid {{
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
      .diagram {{
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--canvas);
        padding: 12px;
        min-width: 0;
      }}
      .diagram h3 {{
        margin: 0 0 10px;
        font-size: 14px;
        color: var(--text-strong);
      }}
      .ladder, .pipeline {{
        display: grid;
        gap: 8px;
      }}
      .node {{
        border-radius: 6px;
        padding: 10px;
        background: white;
        border: 1px solid var(--border);
      }}
      .node strong {{
        display: block;
        color: var(--text-strong);
      }}
      .node small {{
        color: var(--text-muted);
      }}
      .inspector-card {{
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--canvas);
        padding: 12px;
        margin-bottom: 10px;
        min-width: 0;
      }}
      .inspector-card p,
      .inspector-card li,
      .inspector-card strong,
      #inspector-contracts {{
        overflow-wrap: anywhere;
        word-break: break-word;
      }}
      .lower-grid {{
        display: grid;
        gap: 16px;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        table-layout: fixed;
      }}
      th, td {{
        padding: 10px 9px;
        border-top: 1px solid var(--border);
        vertical-align: top;
        overflow-wrap: anywhere;
        word-break: break-word;
      }}
      thead th {{
        border-top: none;
        color: var(--text-strong);
        background: var(--inset);
        font-weight: 600;
      }}
      .token {{
        display: inline-block;
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--inset);
        color: var(--text-strong);
        font-size: 12px;
        line-height: 1.4;
      }}
      .muted {{ color: var(--text-muted); }}
      .accent-search {{ color: var(--accent-search); }}
      .accent-offer {{ color: var(--accent-offer); }}
      .accent-confirmed {{ color: var(--accent-confirmed); }}
      .accent-pending {{ color: var(--accent-pending); }}
      .accent-blocked {{ color: var(--accent-blocked); }}
      .skip-link {{
        position: absolute;
        left: 12px;
        top: -40px;
        background: white;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px 10px;
      }}
      .skip-link:focus {{
        top: 12px;
      }}
      @media (max-width: 1200px) {{
        .layout {{
          grid-template-columns: 1fr;
        }}
      }}
      @media (max-width: 820px) {{
        .atlas-root {{
          padding: 14px;
        }}
        .diagram-grid {{
          grid-template-columns: 1fr;
        }}
        .masthead {{
          align-items: flex-start;
          flex-direction: column;
        }}
      }}
      @media (prefers-reduced-motion: reduce) {{
        * {{
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
        }}
      }}
    </style>
  </head>
  <body>
    <a class="skip-link" href="#atlas-main">Skip to atlas content</a>
    <div
      class="atlas-root"
      data-testid="BookingFlowContractAtlas"
      data-visual-mode="Booking_Flow_Contract_Atlas"
      data-active-stage="search_snapshot"
      data-active-formula="SnapshotSelectable"
      id="atlas-main"
    >
      <div class="frame">
        <section class="masthead panel" data-testid="BookingFlowAtlasMasthead" aria-label="Booking flow masthead">
          <div>
            <div class="wordmark">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 12h5l3-5 3 10 3-5h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span>Vecells</span>
              <span class="muted">Booking_Flow_Contract_Atlas</span>
            </div>
            <p style="margin:8px 0 0; max-width: 920px;">
              Search, ranking, reservation, commit, confirmation, and manage truth are frozen here as one bounded contract pack.
            </p>
          </div>
          <div class="token" data-testid="AtlasVersionToken">{CONTRACT_VERSION}</div>
        </section>

        <div class="layout">
          <aside class="panel rail" data-testid="BookingFlowStageRail" aria-label="Booking flow stage rail">
            <h2>Flow stages</h2>
            <div class="button-list" id="stage-buttons"></div>
            <div style="height:12px"></div>
            <h2>Formula rail</h2>
            <div class="button-list" id="formula-buttons"></div>
          </aside>

          <section class="panel canvas" data-testid="BookingFlowCanvas" aria-label="Booking flow atlas canvas">
            <div class="diagram-grid">
              <section class="diagram" data-testid="SnapshotPipelineRegion">
                <h3>Snapshot pipeline</h3>
                <div class="pipeline" id="snapshot-pipeline"></div>
                <table data-testid="SnapshotPipelineTable" aria-label="Snapshot pipeline table">
                  <thead><tr><th>Stage</th><th>Purpose</th></tr></thead>
                  <tbody id="snapshot-table-body"></tbody>
                </table>
              </section>

              <section class="diagram" data-testid="RankingFrontierRegion">
                <h3>Ranking frontier rail</h3>
                <div class="pipeline" id="frontier-rail"></div>
                <table data-testid="RankingFrontierTable" aria-label="Ranking frontier table">
                  <thead><tr><th>Formula</th><th>Use</th></tr></thead>
                  <tbody id="frontier-table-body"></tbody>
                </table>
              </section>

              <section class="diagram" data-testid="ReservationTruthLadderRegion">
                <h3>Reservation truth ladder</h3>
                <div class="ladder" id="reservation-ladder"></div>
                <table data-testid="ReservationTruthTable" aria-label="Reservation truth table">
                  <thead><tr><th>Truth state</th><th>Meaning</th></tr></thead>
                  <tbody id="reservation-table-body"></tbody>
                </table>
              </section>

              <section class="diagram" data-testid="ConfirmationTruthLadderRegion">
                <h3>Confirmation truth ladder</h3>
                <div class="ladder" id="confirmation-ladder"></div>
                <table data-testid="ConfirmationTruthTable" aria-label="Confirmation truth table">
                  <thead><tr><th>Truth state</th><th>Meaning</th></tr></thead>
                  <tbody id="confirmation-table-body"></tbody>
                </table>
              </section>
            </div>

            <section class="diagram" data-testid="ManageStateMatrixRegion">
              <h3>Manage-state matrix</h3>
              <table data-testid="ManageStateMatrixTable" aria-label="Manage-state matrix">
                <thead><tr><th>Settlement result</th><th>Meaning</th></tr></thead>
                <tbody id="manage-table-body"></tbody>
              </table>
            </section>

            <section class="lower-grid" data-testid="BookingFlowLowerLedgers">
              <section class="diagram">
                <h3>Formula ledger</h3>
                <table data-testid="FormulaLedgerTable" aria-label="Formula ledger">
                  <thead><tr><th>Formula</th><th>Expression</th><th>Fields</th></tr></thead>
                  <tbody id="formula-ledger-body"></tbody>
                </table>
              </section>
              <section class="diagram">
                <h3>Contract split</h3>
                <table data-testid="ContractSplitTable" aria-label="Contract split table">
                  <thead><tr><th>Contract</th><th>Authority</th><th>Reason</th></tr></thead>
                  <tbody id="contract-split-body"></tbody>
                </table>
              </section>
              <section class="diagram">
                <h3>Revalidation, commit, and manage state table</h3>
                <table data-testid="BookingFlowStateTable" aria-label="Booking flow state table">
                  <thead><tr><th>State</th><th>Snapshot</th><th>Reservation</th><th>Confirmation</th><th>Posture</th></tr></thead>
                  <tbody id="state-table-body"></tbody>
                </table>
              </section>
            </section>
          </section>

          <aside class="panel inspector" data-testid="BookingFlowInspector" aria-label="Booking flow inspector">
            <h2>Inspector</h2>
            <div class="inspector-card">
              <strong id="inspector-stage-label">Search snapshot</strong>
              <p id="inspector-stage-summary" style="margin:8px 0 0;"></p>
            </div>
            <div class="inspector-card">
              <strong id="inspector-formula-label">SnapshotSelectable(q,t)</strong>
              <p id="inspector-formula-expression" style="margin:8px 0 0;"></p>
            </div>
            <div class="inspector-card">
              <strong>Bound contracts</strong>
              <ul id="inspector-contracts" style="padding-left: 18px; margin: 8px 0 0;"></ul>
            </div>
            <div class="inspector-card">
              <strong>Scenario parity</strong>
              <table data-testid="ScenarioParityTable" aria-label="Scenario parity table">
                <thead><tr><th>Scenario</th><th>Dominant action</th><th>Same-shell posture</th></tr></thead>
                <tbody id="scenario-parity-body"></tbody>
              </table>
            </div>
          </aside>
        </div>
      </div>
      <script id="atlas-data" type="application/json">{escaped_payload}</script>
      <script>
        const decoder = document.createElement("textarea");
        decoder.innerHTML = document.getElementById("atlas-data").textContent;
        const data = JSON.parse(decoder.value);
        const root = document.querySelector("[data-testid='BookingFlowContractAtlas']");
        const stageButtons = document.getElementById("stage-buttons");
        const formulaButtons = document.getElementById("formula-buttons");
        const stageMap = new Map(data.stages.map((stage) => [stage.stageId, stage]));
        const formulaMap = new Map(data.formulas.map((formula) => [formula.name.replace(/\\(.*$/, ""), formula]));
        let activeStageId = data.stages[0].stageId;
        let activeFormulaKey = data.stages[0].primaryFormulaId;

        function accentFor(stageId) {{
          const stage = stageMap.get(stageId);
          return stage ? stage.accent : "#3158E0";
        }}

        function setActiveStage(stageId) {{
          activeStageId = stageId;
          const stage = stageMap.get(stageId);
          if (stage) {{
            activeFormulaKey = stage.primaryFormulaId;
          }}
          render();
        }}

        function setActiveFormula(formulaKey) {{
          activeFormulaKey = formulaKey;
          const owner = data.stages.find((stage) => stage.primaryFormulaId === formulaKey);
          if (owner) {{
            activeStageId = owner.stageId;
          }}
          render();
        }}

        function renderButtons() {{
          stageButtons.innerHTML = "";
          formulaButtons.innerHTML = "";
          data.stages.forEach((stage) => {{
            const button = document.createElement("button");
            button.type = "button";
            button.id = `StageButton-${{stage.stageId}}`;
            button.setAttribute("aria-pressed", String(stage.stageId === activeStageId));
            button.style.setProperty("--active-accent", stage.accent);
            button.innerHTML = `<span class="button-label"><strong>${{stage.label}}</strong><span class="token">${{stage.contracts.length}}</span></span><span class="button-note">${{stage.summary}}</span>`;
            button.addEventListener("click", () => setActiveStage(stage.stageId));
            stageButtons.appendChild(button);
          }});
          data.formulas.forEach((formula) => {{
            const key = formula.name.replace(/\\(.*$/, "");
            const button = document.createElement("button");
            button.type = "button";
            button.id = `FormulaButton-${{key}}`;
            button.setAttribute("aria-pressed", String(key === activeFormulaKey));
            button.style.setProperty("--active-accent", accentFor(activeStageId));
            button.innerHTML = `<span class="button-label"><strong>${{formula.name}}</strong></span><span class="button-note">${{formula.machineFields.slice(0, 3).join(", ")}}</span>`;
            button.addEventListener("click", () => setActiveFormula(key));
            formulaButtons.appendChild(button);
          }});
        }}

        function renderTables() {{
          document.getElementById("snapshot-pipeline").innerHTML = data.stages
            .slice(0, 3)
            .map((stage) => `<div class="node"><strong>${{stage.label}}</strong><small>${{stage.summary}}</small></div>`)
            .join("");
          document.getElementById("snapshot-table-body").innerHTML = data.stages
            .slice(0, 3)
            .map((stage) => `<tr><td>${{stage.label}}</td><td>${{stage.summary}}</td></tr>`)
            .join("");
          document.getElementById("frontier-rail").innerHTML = ["windowClass", "Frontier_b", "softScore"]
            .map((key) => formulaMap.get(key))
            .filter(Boolean)
            .map((formula) => `<div class="node"><strong>${{formula.name}}</strong><small>${{formula.expression}}</small></div>`)
            .join("");
          document.getElementById("frontier-table-body").innerHTML = ["windowClass", "Frontier_b", "softScore"]
            .map((key) => formulaMap.get(key))
            .filter(Boolean)
            .map((formula) => `<tr><td>${{formula.name}}</td><td>${{formula.expression}}</td></tr>`)
            .join("");
          document.getElementById("reservation-ladder").innerHTML = data.reservationRows
            .map((row) => `<div class="node"><strong>${{row.state}}</strong><small>${{row.meaning}}</small></div>`)
            .join("");
          document.getElementById("reservation-table-body").innerHTML = data.reservationRows
            .map((row) => `<tr><td>${{row.state}}</td><td>${{row.meaning}}</td></tr>`)
            .join("");
          document.getElementById("confirmation-ladder").innerHTML = data.confirmationRows
            .map((row) => `<div class="node"><strong>${{row.state}}</strong><small>${{row.meaning}}</small></div>`)
            .join("");
          document.getElementById("confirmation-table-body").innerHTML = data.confirmationRows
            .map((row) => `<tr><td>${{row.state}}</td><td>${{row.meaning}}</td></tr>`)
            .join("");
          document.getElementById("manage-table-body").innerHTML = data.manageRows
            .map((row) => `<tr><td>${{row.result}}</td><td>${{row.meaning}}</td></tr>`)
            .join("");
          document.getElementById("formula-ledger-body").innerHTML = data.formulas
            .map((formula) => `<tr><td>${{formula.name}}</td><td>${{formula.expression}}</td><td>${{formula.machineFields.join(", ")}}</td></tr>`)
            .join("");
          document.getElementById("contract-split-body").innerHTML = data.contractSplitRows
            .map((row) => `<tr><td>${{row.contract}}</td><td>${{row.authority}}</td><td>${{row.whySeparate}}</td></tr>`)
            .join("");
          document.getElementById("state-table-body").innerHTML = data.stateTableRows
            .map((row) => `<tr><td>${{row.stateId}}</td><td>${{row.snapshotRecoveryState}}</td><td>${{row.reservationTruthState}}</td><td>${{row.confirmationTruthState}}</td><td>${{row.sameShellPosture}}</td></tr>`)
            .join("");
        }}

        function renderInspector() {{
          const stage = stageMap.get(activeStageId);
          const formula = formulaMap.get(activeFormulaKey);
          root.dataset.activeStage = activeStageId;
          root.dataset.activeFormula = activeFormulaKey;
          root.style.setProperty("--active-accent", accentFor(activeStageId));
          document.getElementById("inspector-stage-label").textContent = stage.label;
          document.getElementById("inspector-stage-summary").textContent = stage.summary;
          document.getElementById("inspector-formula-label").textContent = formula.name;
          document.getElementById("inspector-formula-expression").textContent = formula.expression;
          document.getElementById("inspector-contracts").innerHTML = stage.contracts
            .map((contract) => `<li>${{contract}}</li>`)
            .join("");
          const parity = data.scenarios.filter((scenario) => scenario.stageId === activeStageId);
          document.getElementById("scenario-parity-body").innerHTML = parity
            .map((scenario) => `<tr><td>${{scenario.label}}</td><td>${{scenario.dominantAction}}</td><td>${{scenario.sameShellPosture}}</td></tr>`)
            .join("");
        }}

        function render() {{
          renderButtons();
          renderTables();
          renderInspector();
        }}

        render();
      </script>
    </div>
  </body>
</html>
"""


def write_outputs() -> None:
    architecture_doc, api_doc, security_doc = build_docs()
    write_text("docs/architecture/280_phase4_slot_snapshot_offer_commit_manage_contract_pack.md", architecture_doc)
    write_text("docs/api/280_phase4_booking_search_offer_commit_manage_contracts.md", api_doc)
    write_text("docs/security/280_phase4_reservation_truth_revalidation_and_manage_guardrails.md", security_doc)
    write_text("docs/frontend/280_phase4_booking_flow_contract_atlas.html", build_atlas_html())

    write_json("data/contracts/280_slot_search_session.schema.json", build_slot_search_session_schema())
    write_json("data/contracts/280_provider_search_slice.schema.json", build_provider_search_slice_schema())
    write_json("data/contracts/280_temporal_normalization_envelope.schema.json", build_temporal_normalization_envelope_schema())
    write_json("data/contracts/280_canonical_slot_identity.schema.json", build_canonical_slot_identity_schema())
    write_json("data/contracts/280_slot_set_snapshot.schema.json", build_slot_set_snapshot_schema())
    write_json("data/contracts/280_slot_snapshot_recovery_state.schema.json", build_slot_snapshot_recovery_state_schema())
    write_json("data/contracts/280_rank_plan_and_capacity_rank_proof_contract.json", build_rank_plan_contract())
    write_json("data/contracts/280_offer_session.schema.json", build_offer_session_schema())
    write_json("data/contracts/280_reservation_truth_projection_contract.json", build_reservation_truth_projection_contract())
    write_json("data/contracts/280_booking_transaction.schema.json", build_booking_transaction_schema())
    write_json("data/contracts/280_booking_confirmation_truth_projection.schema.json", build_booking_confirmation_truth_projection_schema())
    write_json("data/contracts/280_appointment_manage_and_reminder_contract_bundle.json", build_appointment_manage_bundle())
    write_json("data/contracts/280_waitlist_and_fallback_interface_stubs.json", build_waitlist_and_fallback_stubs())

    write_text("data/analysis/280_external_reference_notes.md", EXTERNAL_REFERENCE_NOTES)
    write_json("data/analysis/280_visual_reference_notes.json", VISUAL_REFERENCE_NOTES)
    write_csv(
        "data/analysis/280_contract_split_matrix.csv",
        CONTRACT_SPLIT_ROWS,
        ["contract", "file", "phaseStage", "authority", "primaryConsumers", "whySeparate"],
    )
    write_csv(
        "data/analysis/280_revalidation_commit_and_manage_state_table.csv",
        STATE_TABLE_ROWS,
        [
            "stateId",
            "phaseStage",
            "snapshotRecoveryState",
            "reservationTruthState",
            "bookingTransactionState",
            "confirmationTruthState",
            "manageExposureState",
            "waitlistRoute",
            "dominantNarrative",
            "sameShellPosture",
        ],
    )
    write_json("data/analysis/PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json", build_gap_log())


def main() -> None:
    write_outputs()


if __name__ == "__main__":
    main()
