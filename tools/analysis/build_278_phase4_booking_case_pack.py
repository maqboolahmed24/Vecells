#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
TASK_ID = "seq_278"
VISUAL_MODE = "Booking_Case_State_Atlas"
CONTRACT_VERSION = "278.phase4.booking-case-freeze.v1"


REQUIRED_STATES = [
    "handoff_received",
    "capability_checked",
    "searching_local",
    "offers_ready",
    "selecting",
    "revalidating",
    "commit_pending",
    "booked",
    "confirmation_pending",
    "supplier_reconciliation_pending",
    "waitlisted",
    "fallback_to_hub",
    "callback_fallback",
    "booking_failed",
    "managed",
    "closed",
]


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


def yaml_scalar(value: object) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    if text == "" or any(token in text for token in [":", "#", "{", "}", "[", "]", ",", "\n"]):
        return json.dumps(text)
    if text.strip() != text:
        return json.dumps(text)
    return text


def to_yaml(value: object, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, child in value.items():
            if isinstance(child, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.append(to_yaml(child, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(child)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for child in value:
            if isinstance(child, (dict, list)):
                nested = to_yaml(child, indent + 2).splitlines()
                first = nested[0].lstrip()
                lines.append(f"{prefix}- {first}")
                lines.extend(f"{' ' * (indent + 2)}{line.lstrip()}" for line in nested[1:])
            else:
                lines.append(f"{prefix}- {yaml_scalar(child)}")
        return "\n".join(lines)
    return f"{prefix}{yaml_scalar(value)}"


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    rule = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(cell.replace("|", "\\|") for cell in row) + " |" for row in rows]
    return "\n".join([header, rule, *body])


def ref_string(description: str, nullable: bool = False, target_field: str | None = None) -> dict[str, object]:
    payload: dict[str, object] = {
        "type": ["string", "null"] if nullable else "string",
        "minLength": 1 if not nullable else 0,
        "description": description,
    }
    if target_field:
        payload["x-phase4TargetField"] = target_field
    return payload


def enum_string(values: list[str], description: str) -> dict[str, object]:
    return {"type": "string", "enum": values, "description": description}


STATE_FAMILIES = [
    {
        "familyId": "intake",
        "label": "Intake",
        "summary": "Phase 3 handoff has been acknowledged but the booking kernel has not yet opened search truth.",
        "states": ["handoff_received", "capability_checked"],
    },
    {
        "familyId": "search",
        "label": "Search",
        "summary": "Local booking is live, the search policy is current, and the shell is moving through offer discovery and slot choice.",
        "states": ["searching_local", "offers_ready", "selecting", "revalidating"],
    },
    {
        "familyId": "commit",
        "label": "Commit",
        "summary": "A chosen slot is crossing reservation, confirmation, or reconciliation truth boundaries.",
        "states": ["commit_pending", "booked", "confirmation_pending", "supplier_reconciliation_pending"],
    },
    {
        "familyId": "continuation",
        "label": "Continuation",
        "summary": "Local booking could not settle directly and now depends on waitlist, callback, hub, or explicit failure truth.",
        "states": ["waitlisted", "fallback_to_hub", "callback_fallback", "booking_failed"],
    },
    {
        "familyId": "managed",
        "label": "Manage and Close",
        "summary": "An authoritative appointment exists or the booking branch is durably finished.",
        "states": ["managed", "closed"],
    },
]


STATE_DETAILS = {
    "handoff_received": {
        "summary": "The booking branch exists only as a direct-resolution handoff and proposed lineage child link.",
        "dominant_authority": "Phase 3 BookingIntent plus the proposed LineageCaseLink.",
        "predicate": "Phase 3 BookingIntent is unsuperseded, ownership fences are current, and the booking link is still the proposed child for the request lineage.",
        "route_cue": "Summary-only booking launch card inside the patient or staff shell.",
    },
    "capability_checked": {
        "summary": "The case has validated current booking capability, route publication, trust, and identity posture but has not opened a live slot search yet.",
        "dominant_authority": "BookingCapabilityResolution and BookingCapabilityProjection.",
        "predicate": "The bound capability tuple still matches route, publication, trust, and governing-object posture for the active audience.",
        "route_cue": "Capability gate summary with allowed next actions.",
    },
    "searching_local": {
        "summary": "The case is actively running local search under one SearchPolicy and one current capability tuple.",
        "dominant_authority": "SearchPolicy plus BookingCapabilityResolution plus SlotSetSnapshot.",
        "predicate": "Capability is live for search and the case owns one active SearchPolicy.",
        "route_cue": "Search-first workspace with calm loading, empty, or partial posture inside the same shell.",
    },
    "offers_ready": {
        "summary": "Current snapshot and offer session expose a lawful set of local choices.",
        "dominant_authority": "OfferSession plus ReservationTruthProjection plus rank proof.",
        "predicate": "A live OfferSession exists and the linked snapshot remains selectable for the active case version and policy bundle.",
        "route_cue": "Offer list or calendar with explicit rank disclosure and truthful hold wording.",
    },
    "selecting": {
        "summary": "The shell holds a chosen slot candidate but not yet a fresh revalidation outcome.",
        "dominant_authority": "OfferSession selection tuple and the selected anchor tuple hash.",
        "predicate": "One offered slot is selected and its tuple hash still resolves to the same canonical slot identity.",
        "route_cue": "Selection state that preserves the chosen slot anchor across same-shell child routes.",
    },
    "revalidating": {
        "summary": "The selected slot is being checked against supplier truth and the original SearchPolicy before commit can start.",
        "dominant_authority": "BookingTransaction preflight, SearchPolicy, and current capability tuple.",
        "predicate": "A chosen slot is undergoing the authoritative supplier or local preflight check for the same policy bundle.",
        "route_cue": "Selected slot remains visible while writable mutation is temporarily paused.",
    },
    "commit_pending": {
        "summary": "A commit path is in flight and must not be mistaken for final booking.",
        "dominant_authority": "BookingTransaction and ReservationTruthProjection.",
        "predicate": "Reservation and request fences are live, dispatch has started, and authoritative outcome is still pending.",
        "route_cue": "Pending confirmation wording stays summary-first and suppresses false calmness.",
    },
    "booked": {
        "summary": "The commit path has authoritative booking proof and can now open management posture.",
        "dominant_authority": "BookingConfirmationTruthProjection and AppointmentRecord.",
        "predicate": "Confirmation truth is confirmed and an AppointmentRecord exists on the same lineage.",
        "route_cue": "Booked summary transitions into management inside the same shell.",
    },
    "confirmation_pending": {
        "summary": "The supplier has accepted or is processing the booking but durable confirmation truth is still pending.",
        "dominant_authority": "BookingConfirmationTruthProjection.",
        "predicate": "Confirmation truth state is confirmation_pending and the same transaction chain remains current.",
        "route_cue": "Chosen slot or booked summary stays visible until authoritative settlement lands.",
    },
    "supplier_reconciliation_pending": {
        "summary": "Supplier truth is ambiguous or disputed and the case must preserve provenance while freezing mutation.",
        "dominant_authority": "ExternalConfirmationGate and BookingConfirmationTruthProjection.",
        "predicate": "Confirmation truth state is reconciliation_required and a reconciliation gate is attached to the same lineage.",
        "route_cue": "Same-shell recovery posture with explicit reconciliation explanation.",
    },
    "waitlisted": {
        "summary": "The case is still lawfully waiting for local supply and has not yet crossed into callback or hub fallback.",
        "dominant_authority": "WaitlistEntry, WaitlistDeadlineEvaluation, and WaitlistContinuationTruthProjection.",
        "predicate": "Active WaitlistEntry exists, offerabilityState is waitlist_safe or at_risk, and required fallback route remains stay_local_waitlist.",
        "route_cue": "Waitlist truth remains visible with deadline risk and dominant next step.",
    },
    "fallback_to_hub": {
        "summary": "Local booking has durably transferred to the hub path.",
        "dominant_authority": "WaitlistFallbackObligation and HubCoordinationCase typed seam.",
        "predicate": "Current fallback obligation requires hub and a hub coordination child link exists for the same booking lineage.",
        "route_cue": "Read-only provenance plus governed handoff status.",
    },
    "callback_fallback": {
        "summary": "Local booking has durably transferred to governed callback handling.",
        "dominant_authority": "WaitlistFallbackObligation and CallbackCase typed seam.",
        "predicate": "Current fallback obligation requires callback and the linked CallbackCase plus CallbackExpectationEnvelope exist on the same fallback fence.",
        "route_cue": "Read-only provenance plus callback expectation summary.",
    },
    "booking_failed": {
        "summary": "The current local booking branch ended without an active waitlist or fallback continuation.",
        "dominant_authority": "BookingException and continuation truth.",
        "predicate": "No active continuation path remains and the current booking attempt has failed under the authoritative outcome chain.",
        "route_cue": "Recovery-only branch summary with no local writable controls.",
    },
    "managed": {
        "summary": "An authoritative appointment exists and the case has entered its manage lifecycle.",
        "dominant_authority": "AppointmentRecord, BookingConfirmationTruthProjection, and BookingManageSettlement.",
        "predicate": "Appointment exists with authoritative confirmation proof and manage posture is not hidden.",
        "route_cue": "Appointment summary with manage, cancel, or reschedule child routes.",
    },
    "closed": {
        "summary": "The booking branch is durably finished, but request closure remains a coordinator decision.",
        "dominant_authority": "BookingCase branch settlement only; not request closure.",
        "predicate": "Case-level work is finished and no further booking mutation is legal for the active lineage branch.",
        "route_cue": "Summary-only review or appointment history view.",
    },
}


AUTHORITY_AXES = [
    {
        "axisId": "case_state",
        "label": "Booking case workflow",
        "governingField": "BookingCase.status",
        "ownerTask": "seq_278",
        "notes": "Top-level workflow status only.",
    },
    {
        "axisId": "capability_state",
        "label": "Capability truth",
        "governingField": "BookingCapabilityResolution.capabilityState",
        "ownerTask": "seq_279",
        "notes": "Search or manage eligibility must not be inferred from BookingCase.status.",
    },
    {
        "axisId": "reservation_truth",
        "label": "Reservation and hold truth",
        "governingField": "ReservationTruthProjection.truthState",
        "ownerTask": "seq_280",
        "notes": "Holds, exclusivity, and offer expiry stay on reservation truth, not case state.",
    },
    {
        "axisId": "confirmation_truth",
        "label": "Confirmation truth",
        "governingField": "BookingConfirmationTruthProjection.confirmationTruthState",
        "ownerTask": "seq_280",
        "notes": "Booked wording, manage exposure, and artifact readiness derive from confirmation truth only.",
    },
    {
        "axisId": "manage_posture",
        "label": "Manage posture",
        "governingField": "BookingManageSettlement + manage exposure fields",
        "ownerTask": "seq_280",
        "notes": "Cancel, reschedule, and reminder posture are separate from top-level case state.",
    },
    {
        "axisId": "route_publication_posture",
        "label": "Route publication and recovery",
        "governingField": "SurfacePublication + RuntimePublicationBundle + RouteFreezeDisposition + ReleaseRecoveryDisposition",
        "ownerTask": "seq_278",
        "notes": "Same-shell writability is publication-governed and can degrade without changing the booking workflow state.",
    },
]


LINEAGE_RULES = [
    {
        "field": "sourceDecisionEpochRef",
        "summary": "Mandatory lineage from Phase 3 decision truth into every Phase 4 mutation path.",
        "rule": "Case creation, search, select, confirm, waitlist, callback fallback, and hub fallback must validate the current unsuperseded triage decision epoch before mutating.",
    },
    {
        "field": "sourceDecisionSupersessionRef",
        "summary": "Replacement triage epochs freeze booking mutation in place.",
        "rule": "If supersession appears after shell open, selected slot and summary provenance may remain visible but every mutation degrades to governed same-shell recovery.",
    },
    {
        "field": "lineageCaseLinkRef",
        "summary": "The only canonical join from request lineage to booking work.",
        "rule": "Case creation moves the booking child link from proposed to acknowledged and later child links must not overwrite it.",
    },
    {
        "field": "requestLifecycleLeaseRef",
        "summary": "Booking mutation remains lease-bound to the request lifecycle.",
        "rule": "Confirm, waitlist, hub fallback, callback fallback, cancel, reschedule, reminder, and staff-assisted actions must present the current request lifecycle lease.",
    },
    {
        "field": "ownershipEpoch",
        "summary": "One active request ownership epoch fences booking mutation.",
        "rule": "Ownership drift creates or reuses stale-owner recovery and freezes mutation until reacquire.",
    },
    {
        "field": "identityRepairBranchDispositionRef",
        "summary": "Wrong-patient correction can quarantine live booking posture without erasing provenance.",
        "rule": "Pending_freeze, quarantined, and compensation_pending preserve summary provenance only; live booking returns only after released settlement.",
    },
    {
        "field": "patientShellConsistencyProjectionRef",
        "summary": "All patient routes stay inside one governed signed-in shell.",
        "rule": "Same-shell booking and appointment routes may mutate only when shell continuity remains current.",
    },
    {
        "field": "patientEmbeddedSessionProjectionRef",
        "summary": "Embedded entry is separately validated and can freeze writes.",
        "rule": "Embedded mode without a current embedded-session projection must degrade to route freeze or release recovery.",
    },
    {
        "field": "surfaceRouteContractRef",
        "summary": "Booking and appointment routes are explicit route-family contracts, not browser-history conventions.",
        "rule": "Every booking child route remains publication-governed and same-shell.",
    },
    {
        "field": "surfacePublicationRef",
        "summary": "Live route publication determines whether mutation remains available.",
        "rule": "Stale, conflict, or withdrawn publication freezes in place rather than silently leaving controls live.",
    },
    {
        "field": "runtimePublicationBundleRef",
        "summary": "Runtime publication is part of the same-shell safety boundary.",
        "rule": "Shell writability depends on the live bundle, not only local route state.",
    },
    {
        "field": "routeFreezeDispositionRef",
        "summary": "Route-freeze posture explains why the shell became read-only or recovery-only.",
        "rule": "Select, confirm, cancel, and reschedule surfaces must freeze in place with explicit recovery posture.",
    },
    {
        "field": "releaseRecoveryDispositionRef",
        "summary": "Release recovery can override calm route posture without changing booking workflow state.",
        "rule": "Release recovery applies to booking routes and appointment manage flows before any local browser heuristics.",
    },
]


TRANSITIONS = [
    {
        "transitionId": "T278_001",
        "from": "handoff_received",
        "to": "capability_checked",
        "predicateId": "P278_HANDOFF_ACKNOWLEDGED",
        "predicate": "Current BookingIntent is unsuperseded, its proposed LineageCaseLink is still current for the request lineage, and request ownership fences are valid for case creation.",
        "controllingObject": "BookingIntent + LineageCaseLink",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_002",
        "from": "capability_checked",
        "to": "searching_local",
        "predicateId": "P278_CAPABILITY_LIVE_FOR_SEARCH",
        "predicate": "BookingCapabilityResolution.capabilityState is live_self_service or live_staff_assist for the active audience, binding hashes remain current, and route publication plus trust posture still match the capability tuple.",
        "controllingObject": "BookingCapabilityResolution + BookingCapabilityProjection",
        "ownerTask": "seq_279",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_003",
        "from": "searching_local",
        "to": "offers_ready",
        "predicateId": "P278_OFFERS_DISCLOSED",
        "predicate": "A live OfferSession exists on the active BookingCase version, policy bundle, capability binding, and selectable snapshot.",
        "controllingObject": "OfferSession + SlotSetSnapshot",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_004",
        "from": "searching_local",
        "to": "waitlisted",
        "predicateId": "P278_WAITLIST_SAFE",
        "predicate": "Active WaitlistEntry exists, WaitlistDeadlineEvaluation.offerabilityState is waitlist_safe or at_risk, and WaitlistFallbackObligation.requiredFallbackRoute remains stay_local_waitlist.",
        "controllingObject": "WaitlistEntry + WaitlistDeadlineEvaluation + WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_005",
        "from": "searching_local",
        "to": "callback_fallback",
        "predicateId": "P278_CALLBACK_REQUIRED",
        "predicate": "Current WaitlistFallbackObligation.requiredFallbackRoute equals callback and the same fallback fence already owns a linked CallbackCase plus CallbackExpectationEnvelope.",
        "controllingObject": "WaitlistFallbackObligation + CallbackCase seam",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_006",
        "from": "searching_local",
        "to": "fallback_to_hub",
        "predicateId": "P278_HUB_REQUIRED",
        "predicate": "Current WaitlistFallbackObligation.requiredFallbackRoute equals hub and the same booking lineage already owns a durably created HubCoordinationCase.",
        "controllingObject": "WaitlistFallbackObligation + HubCoordinationCase seam",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_007",
        "from": "searching_local",
        "to": "booking_failed",
        "predicateId": "P278_SEARCH_FAILED_NO_CONTINUATION",
        "predicate": "The current local booking attempt ended without an active continuation path, waitlist, or durable fallback transfer.",
        "controllingObject": "BookingException + continuation truth",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_008",
        "from": "offers_ready",
        "to": "selecting",
        "predicateId": "P278_SLOT_CHOSEN",
        "predicate": "One offered slot and its tuple hash have been selected from the current OfferSession.",
        "controllingObject": "OfferSession",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_009",
        "from": "offers_ready",
        "to": "waitlisted",
        "predicateId": "P278_WAITLIST_CHOSEN_FROM_OFFERS",
        "predicate": "The case elects or is forced into waitlist and an active WaitlistEntry plus safe waitlist truth exist.",
        "controllingObject": "WaitlistEntry + WaitlistContinuationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_010",
        "from": "offers_ready",
        "to": "callback_fallback",
        "predicateId": "P278_OFFERS_TO_CALLBACK",
        "predicate": "Fallback obligation now requires callback and no safe local continuation remains.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_011",
        "from": "offers_ready",
        "to": "fallback_to_hub",
        "predicateId": "P278_OFFERS_TO_HUB",
        "predicate": "Fallback obligation now requires hub and a hub coordination transfer has been durably started.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_012",
        "from": "offers_ready",
        "to": "booking_failed",
        "predicateId": "P278_OFFERS_EXHAUSTED",
        "predicate": "Current offer generation ended and no lawful local continuation survived.",
        "controllingObject": "OfferSession + BookingException",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_013",
        "from": "selecting",
        "to": "revalidating",
        "predicateId": "P278_REVALIDATION_STARTED",
        "predicate": "A chosen slot is being checked against supplier state and the original SearchPolicy.",
        "controllingObject": "BookingTransaction preflight",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_014",
        "from": "selecting",
        "to": "offers_ready",
        "predicateId": "P278_SELECTION_CLEARED",
        "predicate": "Selected slot or anchor was explicitly cleared while the offer session remained live.",
        "controllingObject": "OfferSession",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_015",
        "from": "selecting",
        "to": "waitlisted",
        "predicateId": "P278_SELECTION_TO_WAITLIST",
        "predicate": "The case joins waitlist from the selection posture and the waitlist truth remains safe.",
        "controllingObject": "WaitlistEntry + WaitlistContinuationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_016",
        "from": "selecting",
        "to": "callback_fallback",
        "predicateId": "P278_SELECTION_TO_CALLBACK",
        "predicate": "Selection was invalidated and fallback obligation now requires callback.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_017",
        "from": "selecting",
        "to": "fallback_to_hub",
        "predicateId": "P278_SELECTION_TO_HUB",
        "predicate": "Selection was invalidated and fallback obligation now requires hub transfer.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_018",
        "from": "selecting",
        "to": "booking_failed",
        "predicateId": "P278_SELECTION_FAILED",
        "predicate": "Selection is no longer actionable and no safe local continuation survives.",
        "controllingObject": "BookingException",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_019",
        "from": "revalidating",
        "to": "commit_pending",
        "predicateId": "P278_PREFLIGHT_VALID",
        "predicate": "Current supplier or local preflight passed against the same SearchPolicy, capability tuple, and request ownership fences.",
        "controllingObject": "BookingTransaction",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_020",
        "from": "revalidating",
        "to": "offers_ready",
        "predicateId": "P278_PREFLIGHT_REFRESH_REQUIRED",
        "predicate": "Current slot can no longer be committed but the offer session remains recoverable for the same case version and policy bundle.",
        "controllingObject": "BookingTransaction + OfferSession",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_021",
        "from": "revalidating",
        "to": "waitlisted",
        "predicateId": "P278_PREFLIGHT_TO_WAITLIST",
        "predicate": "Preflight proves no safe immediate local commit and the current waitlist path remains safe.",
        "controllingObject": "WaitlistEntry + WaitlistDeadlineEvaluation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_022",
        "from": "revalidating",
        "to": "callback_fallback",
        "predicateId": "P278_PREFLIGHT_TO_CALLBACK",
        "predicate": "Preflight or freshness drift triggered callback fallback obligation on the same lineage.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_023",
        "from": "revalidating",
        "to": "fallback_to_hub",
        "predicateId": "P278_PREFLIGHT_TO_HUB",
        "predicate": "Preflight or freshness drift triggered hub fallback obligation on the same lineage.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
    {
        "transitionId": "T278_024",
        "from": "revalidating",
        "to": "booking_failed",
        "predicateId": "P278_PREFLIGHT_FAILED",
        "predicate": "No safe continuation survived revalidation failure.",
        "controllingObject": "BookingException + continuation truth",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_025",
        "from": "commit_pending",
        "to": "booked",
        "predicateId": "P278_COMMIT_CONFIRMED",
        "predicate": "Authoritative proof exists as durable provider reference or same-commit read-after-write, an AppointmentRecord exists, and confirmation truth is confirmed.",
        "controllingObject": "BookingTransaction + BookingConfirmationTruthProjection + AppointmentRecord",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_026",
        "from": "commit_pending",
        "to": "confirmation_pending",
        "predicateId": "P278_COMMIT_WAITING_CONFIRMATION",
        "predicate": "Commit path is accepted for processing but confirmation truth is still pending.",
        "controllingObject": "BookingTransaction + BookingConfirmationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_027",
        "from": "commit_pending",
        "to": "supplier_reconciliation_pending",
        "predicateId": "P278_COMMIT_AMBIGUOUS",
        "predicate": "Commit path observed ambiguous or disputed supplier truth and opened an external confirmation gate.",
        "controllingObject": "BookingTransaction + ExternalConfirmationGate",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_028",
        "from": "commit_pending",
        "to": "waitlisted",
        "predicateId": "P278_COMMIT_TO_WAITLIST",
        "predicate": "Commit could not settle immediately and waitlist continuation remains lawful.",
        "controllingObject": "WaitlistEntry + WaitlistContinuationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_029",
        "from": "commit_pending",
        "to": "callback_fallback",
        "predicateId": "P278_COMMIT_TO_CALLBACK",
        "predicate": "Commit path degraded into callback fallback under the current fallback obligation.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_030",
        "from": "commit_pending",
        "to": "fallback_to_hub",
        "predicateId": "P278_COMMIT_TO_HUB",
        "predicate": "Commit path degraded into hub fallback under the current fallback obligation.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_031",
        "from": "commit_pending",
        "to": "booking_failed",
        "predicateId": "P278_COMMIT_FAILED",
        "predicate": "Commit path failed with no active continuation path.",
        "controllingObject": "BookingTransaction + BookingException",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_032",
        "from": "booked",
        "to": "managed",
        "predicateId": "P278_MANAGE_LIFECYCLE_OPEN",
        "predicate": "AppointmentRecord exists with authoritative confirmation truth and manage posture is now exposed.",
        "controllingObject": "AppointmentRecord + BookingConfirmationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates",
    },
    {
        "transitionId": "T278_033",
        "from": "confirmation_pending",
        "to": "managed",
        "predicateId": "P278_PENDING_TO_MANAGED",
        "predicate": "Pending confirmation settled into authoritative confirmed appointment truth.",
        "controllingObject": "BookingConfirmationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_034",
        "from": "confirmation_pending",
        "to": "supplier_reconciliation_pending",
        "predicateId": "P278_PENDING_TO_RECONCILIATION",
        "predicate": "Pending confirmation degraded into ambiguous or disputed supplier truth.",
        "controllingObject": "ExternalConfirmationGate",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_035",
        "from": "confirmation_pending",
        "to": "booking_failed",
        "predicateId": "P278_PENDING_FAILED",
        "predicate": "Supplier or authoritative read path rejected the booking and no continuation survives.",
        "controllingObject": "BookingConfirmationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_036",
        "from": "confirmation_pending",
        "to": "callback_fallback",
        "predicateId": "P278_PENDING_TO_CALLBACK",
        "predicate": "Pending confirmation crossed into callback fallback under current continuation truth.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_037",
        "from": "confirmation_pending",
        "to": "fallback_to_hub",
        "predicateId": "P278_PENDING_TO_HUB",
        "predicate": "Pending confirmation crossed into hub fallback under current continuation truth.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_038",
        "from": "supplier_reconciliation_pending",
        "to": "managed",
        "predicateId": "P278_RECONCILIATION_CONFIRMED",
        "predicate": "Reconciliation produced authoritative confirmed appointment truth on the same lineage.",
        "controllingObject": "ExternalConfirmationGate + BookingConfirmationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_039",
        "from": "supplier_reconciliation_pending",
        "to": "booking_failed",
        "predicateId": "P278_RECONCILIATION_FAILED",
        "predicate": "Reconciliation closed with authoritative failure and no continuation survives.",
        "controllingObject": "ExternalConfirmationGate + BookingException",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_040",
        "from": "supplier_reconciliation_pending",
        "to": "callback_fallback",
        "predicateId": "P278_RECONCILIATION_TO_CALLBACK",
        "predicate": "Reconciliation requires callback fallback on the same booking lineage.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_041",
        "from": "supplier_reconciliation_pending",
        "to": "fallback_to_hub",
        "predicateId": "P278_RECONCILIATION_TO_HUB",
        "predicate": "Reconciliation requires hub fallback on the same booking lineage.",
        "controllingObject": "WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
    },
    {
        "transitionId": "T278_042",
        "from": "waitlisted",
        "to": "selecting",
        "predicateId": "P278_WAITLIST_OFFER_VISIBLE",
        "predicate": "WaitlistContinuationTruthProjection.patientVisibleState is offer_available and the active offer still resolves to the same booking case lineage.",
        "controllingObject": "WaitlistContinuationTruthProjection + WaitlistOffer",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_043",
        "from": "waitlisted",
        "to": "revalidating",
        "predicateId": "P278_WAITLIST_ACCEPTED_PENDING_BOOKING",
        "predicate": "Waitlist offer was accepted and the released slot is being revalidated for booking.",
        "controllingObject": "WaitlistOffer + BookingTransaction",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_044",
        "from": "waitlisted",
        "to": "callback_fallback",
        "predicateId": "P278_WAITLIST_TO_CALLBACK",
        "predicate": "Current waitlist truth says callback_expected or fallback obligation requires callback.",
        "controllingObject": "WaitlistContinuationTruthProjection + WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_045",
        "from": "waitlisted",
        "to": "fallback_to_hub",
        "predicateId": "P278_WAITLIST_TO_HUB",
        "predicate": "Current waitlist truth says hub_review_pending or fallback obligation requires hub.",
        "controllingObject": "WaitlistContinuationTruthProjection + WaitlistFallbackObligation",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_046",
        "from": "waitlisted",
        "to": "booking_failed",
        "predicateId": "P278_WAITLIST_EXPIRED",
        "predicate": "Waitlist continuation truth is expired and no active fallback survives.",
        "controllingObject": "WaitlistContinuationTruthProjection",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_047",
        "from": "waitlisted",
        "to": "managed",
        "predicateId": "P278_WAITLIST_CONFIRMED",
        "predicate": "Waitlist path produced authoritative appointment truth and the case entered manage posture.",
        "controllingObject": "BookingConfirmationTruthProjection + AppointmentRecord",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_048",
        "from": "managed",
        "to": "searching_local",
        "predicateId": "P278_MANAGE_REBOOK",
        "predicate": "A reschedule or immediate rebook flow opens replacement search under the same shell and current booking lineage.",
        "controllingObject": "AppointmentManageCommand + BookingCase",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates",
    },
    {
        "transitionId": "T278_049",
        "from": "managed",
        "to": "supplier_reconciliation_pending",
        "predicateId": "P278_MANAGE_RECONCILIATION",
        "predicate": "Appointment manage mutation is waiting on disputed or ambiguous supplier truth.",
        "controllingObject": "BookingManageSettlement + ExternalConfirmationGate",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates",
    },
    {
        "transitionId": "T278_050",
        "from": "managed",
        "to": "closed",
        "predicateId": "P278_MANAGE_FINISHED",
        "predicate": "Manage lifecycle is durably finished for the booking branch and no further booking mutation remains.",
        "controllingObject": "BookingManageSettlement",
        "ownerTask": "seq_280",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates",
    },
    {
        "transitionId": "T278_051",
        "from": "callback_fallback",
        "to": "closed",
        "predicateId": "P278_CALLBACK_BRANCH_CLOSED",
        "predicate": "Callback transfer is durably acknowledged and the booking branch has no remaining local mutation path.",
        "controllingObject": "CallbackCase seam + LineageCaseLink",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_052",
        "from": "fallback_to_hub",
        "to": "closed",
        "predicateId": "P278_HUB_BRANCH_CLOSED",
        "predicate": "Hub transfer is durably acknowledged and the booking branch has no remaining local mutation path.",
        "controllingObject": "HubCoordinationCase seam + LineageCaseLink",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
    },
    {
        "transitionId": "T278_053",
        "from": "booking_failed",
        "to": "closed",
        "predicateId": "P278_FAILURE_BRANCH_CLOSED",
        "predicate": "Failure branch has no active continuation or manage posture and remains booking-branch-local only.",
        "controllingObject": "BookingException",
        "ownerTask": "seq_278",
        "sourceRef": "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
    },
]


ROUTES = [
    {
        "routeId": "patient_appointments_list",
        "path": "/appointments",
        "transitionType": "same_shell_section_switch",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentListProjection",
        "objectAnchor": "appointment_list",
        "dominantAction": "review_or_manage",
        "supportedStates": ["managed", "waitlisted", "closed"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/appointments",
        ],
    },
    {
        "routeId": "patient_booking_workspace",
        "path": "/bookings/:bookingCaseId",
        "transitionType": "same_object_child",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentWorkspaceProjection",
        "objectAnchor": "booking_case",
        "dominantAction": "search_or_resume",
        "supportedStates": [
            "handoff_received",
            "capability_checked",
            "searching_local",
            "offers_ready",
            "selecting",
            "revalidating",
            "commit_pending",
            "confirmation_pending",
            "supplier_reconciliation_pending",
            "waitlisted",
        ],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/bookings/:bookingCaseId",
        ],
    },
    {
        "routeId": "patient_booking_select",
        "path": "/bookings/:bookingCaseId/select",
        "transitionType": "same_object_child",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentWorkspaceProjection",
        "objectAnchor": "selected_offer_or_slot",
        "dominantAction": "select_slot",
        "supportedStates": ["offers_ready", "selecting", "waitlisted"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/bookings/:bookingCaseId/select",
        ],
    },
    {
        "routeId": "patient_booking_confirm",
        "path": "/bookings/:bookingCaseId/confirm",
        "transitionType": "same_object_child",
        "historyPolicy": "replace",
        "projectionRef": "PatientAppointmentWorkspaceProjection",
        "objectAnchor": "selected_slot_confirmation",
        "dominantAction": "confirm_slot",
        "supportedStates": ["selecting", "revalidating", "commit_pending", "confirmation_pending", "supplier_reconciliation_pending"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/bookings/:bookingCaseId/confirm",
        ],
    },
    {
        "routeId": "patient_appointment_summary",
        "path": "/appointments/:appointmentId",
        "transitionType": "same_section_object_switch",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentManageProjection",
        "objectAnchor": "appointment_summary",
        "dominantAction": "review_appointment",
        "supportedStates": ["managed", "closed", "supplier_reconciliation_pending"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/appointments/:appointmentId",
        ],
    },
    {
        "routeId": "patient_appointment_manage",
        "path": "/appointments/:appointmentId/manage",
        "transitionType": "same_object_child",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentManageProjection",
        "objectAnchor": "appointment_manage",
        "dominantAction": "manage_appointment",
        "supportedStates": ["managed", "supplier_reconciliation_pending"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/appointments/:appointmentId/manage",
        ],
    },
    {
        "routeId": "patient_appointment_cancel",
        "path": "/appointments/:appointmentId/cancel",
        "transitionType": "same_object_child",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentManageProjection",
        "objectAnchor": "appointment_cancel",
        "dominantAction": "cancel_appointment",
        "supportedStates": ["managed", "supplier_reconciliation_pending"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/appointments/:appointmentId/cancel",
        ],
    },
    {
        "routeId": "patient_appointment_reschedule",
        "path": "/appointments/:appointmentId/reschedule",
        "transitionType": "same_object_child",
        "historyPolicy": "push",
        "projectionRef": "PatientAppointmentManageProjection",
        "objectAnchor": "appointment_reschedule",
        "dominantAction": "reschedule_appointment",
        "supportedStates": ["managed", "searching_local", "supplier_reconciliation_pending"],
        "sameShell": True,
        "sourceRefs": [
            "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
            "blueprint/patient-portal-experience-architecture-blueprint.md#/appointments/:appointmentId/reschedule",
        ],
    },
]


PROJECTIONS = [
    {
        "projectionId": "PatientAppointmentListProjection",
        "routes": ["/appointments"],
        "surfaceStates": ["loading", "empty_actionable", "ready", "partial", "recovery_required"],
        "dominantTruths": [
            "activeWaitlistOfferTruthRefs[]",
            "activeWaitlistContinuationTruthRefs[]",
            "manageCapabilityDigestRef",
        ],
        "summary": "List-shell truth for upcoming appointments, waitlist cards, and manage-entry actions.",
    },
    {
        "projectionId": "PatientAppointmentWorkspaceProjection",
        "routes": [
            "/bookings/:bookingCaseId",
            "/bookings/:bookingCaseId/select",
            "/bookings/:bookingCaseId/confirm",
        ],
        "surfaceStates": [
            "searching",
            "offers_ready",
            "selecting",
            "revalidating",
            "confirmation_pending",
            "fallback_required",
            "recovery_required",
        ],
        "dominantTruths": [
            "selectedReservationTruthRef",
            "selectedConfirmationTruthRef",
            "selectedWaitlistContinuationTruthRef",
            "capacityRankProofRef",
            "rankDisclosurePolicyRef",
        ],
        "summary": "Single read model for slot discovery, selection, revalidation, confirm posture, and fallback guidance.",
    },
    {
        "projectionId": "PatientAppointmentManageProjection",
        "routes": [
            "/appointments/:appointmentId",
            "/appointments/:appointmentId/manage",
            "/appointments/:appointmentId/cancel",
            "/appointments/:appointmentId/reschedule",
        ],
        "surfaceStates": [
            "ready",
            "supplier_pending",
            "reconciliation_required",
            "read_only",
            "recovery_required",
        ],
        "dominantTruths": [
            "latestManageSettlementRef",
            "latestBookingTransactionRef",
            "bookingConfirmationTruthRef",
        ],
        "summary": "Manage-shell truth for cancel, reschedule, repair, and same-anchor pending states.",
    },
    {
        "projectionId": "PatientAppointmentArtifactProjection",
        "routes": [
            "/appointments/:appointmentId",
            "/appointments/:appointmentId/manage",
        ],
        "surfaceStates": [
            "summary_only",
            "renderable",
            "handoff_ready",
            "placeholder_only",
            "recovery_required",
        ],
        "dominantTruths": [
            "appointmentPresentationArtifactRef",
            "bookingConfirmationTruthRef",
            "outboundNavigationGrantRef",
        ],
        "summary": "Artifact and attendance-summary projection bound to the same appointment anchor and return contract.",
    },
]


API_SURFACE = [
    {
        "method": "POST",
        "path": "/v1/bookings/cases",
        "purpose": "Create one BookingCase from one current BookingIntent handoff and acknowledge lineage ownership.",
        "ownerTask": "par_282",
    },
    {
        "method": "GET",
        "path": "/v1/bookings/cases/{bookingCaseId}",
        "purpose": "Read the current BookingCase and authoritative same-shell route posture.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:search",
        "purpose": "Resolve current SearchPolicy and start or refresh local slot search against the active capability tuple.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:select-slot",
        "purpose": "Select one offered slot under the current OfferSession and selected-anchor tuple hash.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:confirm",
        "purpose": "Start the BookingTransaction commit path under request and reservation fences.",
        "ownerTask": "par_282",
    },
    {
        "method": "GET",
        "path": "/v1/appointments/{appointmentId}",
        "purpose": "Read one authoritative AppointmentRecord plus manage posture projection.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/appointments/{appointmentId}:cancel",
        "purpose": "Run managed appointment cancellation under current fences and capability truth.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/appointments/{appointmentId}:reschedule",
        "purpose": "Start replacement search under the governing BookingCase and current manage posture.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:join-waitlist",
        "purpose": "Join or refresh waitlist continuation under current local-booking truth.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:fallback-callback",
        "purpose": "Transfer current booking lineage into callback fallback when required fallback route is callback.",
        "ownerTask": "par_282",
    },
    {
        "method": "POST",
        "path": "/v1/bookings/cases/{bookingCaseId}:fallback-hub",
        "purpose": "Transfer current booking lineage into hub fallback when required fallback route is hub.",
        "ownerTask": "par_282",
    },
]


EVENT_CATALOG = [
    {
        "eventName": "booking.case.created",
        "canonicalEventContractRef": "CEC_BOOKING_CASE_CREATED",
        "schemaPath": None,
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Missing concrete event schema today; frozen here so downstream tasks may implement without renaming.",
    },
    {
        "eventName": "booking.capability.resolved",
        "canonicalEventContractRef": "CEC_BOOKING_CAPABILITY_RESOLVED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.capability.resolved.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "capability_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_283",
        "notes": "Concrete schema already exists and remains part of the canonical catalog.",
    },
    {
        "eventName": "booking.slots.fetched",
        "canonicalEventContractRef": "CEC_BOOKING_SLOTS_FETCHED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.slots.fetched.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and names slot-fetch lifecycle truth.",
    },
    {
        "eventName": "booking.offers.created",
        "canonicalEventContractRef": "CEC_BOOKING_OFFERS_CREATED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.offers.created.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.slot.selected",
        "canonicalEventContractRef": "CEC_BOOKING_SLOT_SELECTED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.slot.selected.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.slot.revalidated",
        "canonicalEventContractRef": "CEC_BOOKING_SLOT_REVALIDATED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.slot.revalidated.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.slot.revalidation.failed",
        "canonicalEventContractRef": "CEC_BOOKING_SLOT_REVALIDATION_FAILED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.slot.revalidation.failed.v1.schema.json"),
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.commit.started",
        "canonicalEventContractRef": "CEC_BOOKING_COMMIT_STARTED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.commit.started.v1.schema.json"),
        "governingAggregate": "BookingTransaction",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.commit.confirmation_pending",
        "canonicalEventContractRef": "CEC_BOOKING_COMMIT_CONFIRMATION_PENDING",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.commit.confirmation_pending.v1.schema.json"),
        "governingAggregate": "BookingTransaction",
        "stateAxis": "confirmation_truth",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.commit.reconciliation_pending",
        "canonicalEventContractRef": "CEC_BOOKING_COMMIT_RECONCILIATION_PENDING",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.commit.reconciliation_pending.v1.schema.json"),
        "governingAggregate": "BookingTransaction",
        "stateAxis": "confirmation_truth",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.commit.confirmed",
        "canonicalEventContractRef": "CEC_BOOKING_COMMIT_CONFIRMED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.commit.confirmed.v1.schema.json"),
        "governingAggregate": "BookingTransaction",
        "stateAxis": "confirmation_truth",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.commit.ambiguous",
        "canonicalEventContractRef": "CEC_BOOKING_COMMIT_AMBIGUOUS",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.commit.ambiguous.v1.schema.json"),
        "governingAggregate": "BookingTransaction",
        "stateAxis": "confirmation_truth",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.confirmation.truth.updated",
        "canonicalEventContractRef": "CEC_BOOKING_CONFIRMATION_TRUTH_UPDATED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.confirmation.truth.updated.v1.schema.json"),
        "governingAggregate": "BookingConfirmationTruthProjection",
        "stateAxis": "confirmation_truth",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.appointment.created",
        "canonicalEventContractRef": "CEC_BOOKING_APPOINTMENT_CREATED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.appointment.created.v1.schema.json"),
        "governingAggregate": "AppointmentRecord",
        "stateAxis": "manage_posture",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.reminders.scheduled",
        "canonicalEventContractRef": "CEC_BOOKING_REMINDERS_SCHEDULED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.reminders.scheduled.v1.schema.json"),
        "governingAggregate": "AppointmentRecord",
        "stateAxis": "manage_posture",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.cancelled",
        "canonicalEventContractRef": "CEC_BOOKING_CANCELLED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.cancelled.v1.schema.json"),
        "governingAggregate": "AppointmentRecord",
        "stateAxis": "manage_posture",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.reschedule.started",
        "canonicalEventContractRef": "CEC_BOOKING_RESCHEDULE_STARTED",
        "schemaPath": repo_path("packages/event-contracts/schemas/booking/booking.reschedule.started.v1.schema.json"),
        "governingAggregate": "AppointmentRecord",
        "stateAxis": "manage_posture",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete schema already exists and remains canonical.",
    },
    {
        "eventName": "booking.waitlist.joined",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_JOINED",
        "schemaPath": None,
        "governingAggregate": "WaitlistEntry",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.deadline_evaluated",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_DEADLINE_EVALUATED",
        "schemaPath": None,
        "governingAggregate": "WaitlistDeadlineEvaluation",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.offer.sent",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_OFFER_SENT",
        "schemaPath": None,
        "governingAggregate": "WaitlistOffer",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.offer.accepted",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_OFFER_ACCEPTED",
        "schemaPath": None,
        "governingAggregate": "WaitlistOffer",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.offer.expired",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_OFFER_EXPIRED",
        "schemaPath": None,
        "governingAggregate": "WaitlistOffer",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.offer.superseded",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_OFFER_SUPERSEDED",
        "schemaPath": None,
        "governingAggregate": "WaitlistOffer",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.waitlist.fallback.required",
        "canonicalEventContractRef": "CEC_BOOKING_WAITLIST_FALLBACK_REQUIRED",
        "schemaPath": None,
        "governingAggregate": "WaitlistFallbackObligation",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Waitlist contracts are frozen here, but concrete event schema is still a later implementation seam.",
    },
    {
        "eventName": "booking.fallback.callback_requested",
        "canonicalEventContractRef": "CEC_BOOKING_FALLBACK_CALLBACK_REQUESTED",
        "schemaPath": None,
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Callback-fallback branch is frozen here; transport implementation stays later-owned.",
    },
    {
        "eventName": "booking.fallback.hub_requested",
        "canonicalEventContractRef": "CEC_BOOKING_FALLBACK_HUB_REQUESTED",
        "schemaPath": None,
        "governingAggregate": "BookingCase",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Hub-fallback branch is frozen here; downstream hub implementation stays later-owned.",
    },
    {
        "eventName": "booking.exception.raised",
        "canonicalEventContractRef": "CEC_BOOKING_EXCEPTION_RAISED",
        "schemaPath": None,
        "governingAggregate": "BookingException",
        "stateAxis": "case_state",
        "freezeOwnerTask": "seq_278",
        "implementationOwnerTask": "par_282",
        "notes": "Concrete event schema is still a later implementation seam.",
    },
]


INTERFACE_GAPS = [
    {
        "gapId": "PHASE4_GAP_278_001",
        "missingSurface": "Booking capability tuple and adapter binding compiler",
        "expectedOwnerTask": "seq_279",
        "temporaryFallback": "BookingCase freezes typed refs to BookingCapabilityResolution, BookingCapabilityProjection, and BookingProviderAdapterBinding without implementing their internals here.",
        "riskIfUnresolved": "Capability truth could drift into case-state or browser-local heuristics.",
        "followUpAction": "279 must publish frozen capability tuple and adapter binding contracts that these refs point to.",
        "typedSeams": [
            "activeCapabilityResolutionRef -> BookingCapabilityResolution",
            "activeCapabilityProjectionRef -> BookingCapabilityProjection",
            "activeProviderAdapterBindingRef -> BookingProviderAdapterBinding",
        ],
    },
    {
        "gapId": "PHASE4_GAP_278_002",
        "missingSurface": "Search snapshot, offer, reservation, confirmation, waitlist, and appointment deep contracts",
        "expectedOwnerTask": "seq_280",
        "temporaryFallback": "BookingCase schema freezes typed refs and state predicates for search, offer, waitlist, confirmation, appointment, and manage flows without redefining those deeper objects here.",
        "riskIfUnresolved": "Later Phase 4 tracks could rename or locally improvise offer, waitlist, confirmation, or manage truth.",
        "followUpAction": "280 must freeze the referenced object families and their authoritative truth axes exactly as named here.",
        "typedSeams": [
            "currentOfferSessionRef -> OfferSession",
            "selectedSlotRef -> CanonicalSlotIdentity / NormalizedSlot",
            "appointmentRef -> AppointmentRecord",
            "latestConfirmationTruthProjectionRef -> BookingConfirmationTruthProjection",
            "waitlistEntryRef -> WaitlistEntry",
            "activeWaitlistFallbackObligationRef -> WaitlistFallbackObligation",
            "latestWaitlistContinuationTruthProjectionRef -> WaitlistContinuationTruthProjection",
        ],
    },
    {
        "gapId": "PHASE4_GAP_278_003",
        "missingSurface": "Concrete event schemas for newly frozen waitlist, fallback, and case-creation events",
        "expectedOwnerTask": "par_282",
        "temporaryFallback": "278 freezes canonical event names, governing aggregates, and implementation-owner mapping in the event catalog.",
        "riskIfUnresolved": "Implementations could emit renamed or semantically ambiguous events even if the case kernel is otherwise correct.",
        "followUpAction": "282 must add concrete event-contract schemas for the null-schema catalog rows without changing names or governing aggregates.",
        "typedSeams": [
            "booking.case.created",
            "booking.waitlist.joined",
            "booking.waitlist.deadline_evaluated",
            "booking.waitlist.offer.sent",
            "booking.waitlist.offer.accepted",
            "booking.waitlist.offer.expired",
            "booking.waitlist.offer.superseded",
            "booking.waitlist.fallback.required",
            "booking.fallback.callback_requested",
            "booking.fallback.hub_requested",
            "booking.exception.raised",
        ],
    },
]


REFERENCE_NOTES = {
    "taskId": TASK_ID,
    "reviewedOn": TODAY,
    "references": [
        {
            "title": "Confirmation page",
            "publisher": "NHS digital service manual",
            "url": "https://service-manual.nhs.uk/design-system/patterns/confirmation-page",
            "borrowed": "Calm transactional confirmation hierarchy: one clear confirmation panel, next-step wording, and limited component count.",
            "rejected": "Detached final-success pages as the dominant booking experience; the local blueprint requires same-shell child-route continuity instead.",
        },
        {
            "title": "Design accessibility guidance",
            "publisher": "NHS digital service manual",
            "url": "https://service-manual.nhs.uk/accessibility/design",
            "borrowed": "Explicit heading order, skip-link discipline, and semantic structure guidance for the atlas and patient-route summaries.",
            "rejected": "Treating section changes as separate-page resets; the local blueprint requires focus-safe same-shell continuity.",
        },
        {
            "title": "Developing a Keyboard Interface",
            "publisher": "W3C WAI-ARIA Authoring Practices Guide",
            "url": "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
            "borrowed": "Predictable focus movement, visible focus persistence, and composite-widget keyboard conventions for the interactive atlas.",
            "rejected": "Any focus movement that follows layout convenience instead of logical reading order or preserved active state.",
        },
        {
            "title": "Landmark Regions",
            "publisher": "W3C WAI-ARIA Authoring Practices Guide",
            "url": "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/",
            "borrowed": "Named landmark regions and explicit semantic segmentation for atlas canvas, inspector, and lower evidence tables.",
            "rejected": "Over-fragmenting the atlas into too many unlabeled panels; the value of landmarks drops when regions become excessive.",
        },
        {
            "title": "Changelog",
            "publisher": "Linear",
            "url": "https://linear.app/changelog",
            "borrowed": "Quiet hierarchy, dimmer navigation treatment, and dense-but-stable operational scanning cues.",
            "rejected": "Issue-tracker-specific chrome or highly branded interaction metaphors that do not fit booking-case contract review.",
        },
        {
            "title": "Nested Layouts",
            "publisher": "Vercel Academy",
            "url": "https://vercel.com/academy/nextjs-foundations/nested-layouts",
            "borrowed": "Persistent section chrome and child-route continuity as the visual model for booking same-shell route families.",
            "rejected": "Recomputing layout state on every child-route move; the local blueprint already fixes continuity on route-family contracts.",
        },
        {
            "title": "New dashboard redesign is now the default",
            "publisher": "Vercel",
            "url": "https://vercel.com/changelog/dashboard-navigation-redesign-rollout",
            "borrowed": "Consistent tabs and a stable side-rail hierarchy across peer route families.",
            "rejected": "Floating mobile bottom-bar behavior or collapsible nav patterns that would obscure booking-state inspection.",
        },
        {
            "title": "Data table usage",
            "publisher": "IBM Carbon Design System",
            "url": "https://carbondesignsystem.com/components/data-table/usage/",
            "borrowed": "Dense table layout with clear toolbar ownership, scanning-friendly row treatment, and explicit hover/focus distinctions.",
            "rejected": "Treating evidence tables as generic admin grids with inline mutation affordances; 278 is a contract atlas, not a CRUD board.",
        },
        {
            "title": "LocatorAssertions",
            "publisher": "Playwright",
            "url": "https://playwright.dev/docs/api/class-locatorassertions",
            "borrowed": "Locator screenshot assertions as the reference posture for deterministic visual proof.",
            "rejected": "Using brittle pixel checks without stable locator scope or settled page state.",
        },
        {
            "title": "Snapshot testing",
            "publisher": "Playwright",
            "url": "https://playwright.dev/docs/aria-snapshots",
            "borrowed": "ARIA snapshot assertions as the model for machine-readable agreement on semantic structure.",
            "rejected": "Visual-only proof without accessible-structure parity for the atlas.",
        },
    ],
}


BOOKING_INTENT_REQUIRED = [
    "intentId",
    "episodeRef",
    "requestId",
    "requestLineageRef",
    "sourceTriageTaskRef",
    "lineageCaseLinkRef",
    "priorityBand",
    "timeframe",
    "modality",
    "clinicianType",
    "continuityPreference",
    "accessNeeds",
    "patientPreferenceSummary",
    "createdFromDecisionId",
    "decisionEpochRef",
    "decisionSupersessionRecordRef",
    "lifecycleLeaseRef",
    "leaseAuthorityRef",
    "leaseTtlSeconds",
    "ownershipEpoch",
    "fencingToken",
    "currentLineageFenceEpoch",
    "intentState",
    "commandActionRecordRef",
    "commandSettlementRecordRef",
    "lifecycleClosureAuthority",
    "createdAt",
    "updatedAt",
    "version",
]


BOOKING_CASE_REQUIRED = [
    "bookingCaseId",
    "episodeRef",
    "requestId",
    "requestLineageRef",
    "lineageCaseLinkRef",
    "originTriageTaskRef",
    "bookingIntentId",
    "sourceDecisionEpochRef",
    "sourceDecisionSupersessionRef",
    "patientRef",
    "tenantId",
    "providerContext",
    "activeCapabilityResolutionRef",
    "activeCapabilityProjectionRef",
    "activeProviderAdapterBindingRef",
    "status",
    "searchPolicyRef",
    "currentOfferSessionRef",
    "selectedSlotRef",
    "appointmentRef",
    "latestConfirmationTruthProjectionRef",
    "waitlistEntryRef",
    "activeWaitlistFallbackObligationRef",
    "latestWaitlistContinuationTruthProjectionRef",
    "exceptionRef",
    "activeIdentityRepairCaseRef",
    "identityRepairBranchDispositionRef",
    "identityRepairReleaseSettlementRef",
    "requestLifecycleLeaseRef",
    "ownershipEpoch",
    "staleOwnerRecoveryRef",
    "patientShellConsistencyProjectionRef",
    "patientEmbeddedSessionProjectionRef",
    "surfaceRouteContractRef",
    "surfacePublicationRef",
    "runtimePublicationBundleRef",
    "routeFreezeDispositionRef",
    "releaseRecoveryDispositionRef",
    "closureAuthority",
    "createdAt",
    "updatedAt",
]


def build_booking_intent_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/278_booking_intent_handoff.schema.json",
        "title": "278 BookingIntent handoff",
        "description": "Executable Phase 3 to Phase 4 handoff contract. Phase 4 must start from this lineage-bound seed instead of browser-local booking state.",
        "type": "object",
        "additionalProperties": False,
        "required": BOOKING_INTENT_REQUIRED,
        "properties": {
            "intentId": ref_string("Stable BookingIntent identifier."),
            "episodeRef": ref_string("Episode ref carried from triage lineage."),
            "requestId": ref_string("Canonical request identifier."),
            "requestLineageRef": ref_string("Canonical RequestLineage identifier."),
            "sourceTriageTaskRef": ref_string("Origin triage task identifier."),
            "lineageCaseLinkRef": ref_string("Proposed booking child link minted during Phase 3 handoff."),
            "priorityBand": {"type": "string", "description": "Priority band carried from triage."},
            "timeframe": {"type": "string", "description": "Requested timeframe summary carried from triage."},
            "modality": {"type": "string", "description": "Requested modality carried from triage."},
            "clinicianType": {"type": "string", "description": "Requested clinician type carried from triage."},
            "continuityPreference": {"type": "string", "description": "Continuity preference carried from triage."},
            "accessNeeds": {"type": "string", "description": "Access-needs summary carried from triage."},
            "patientPreferenceSummary": {"type": "string", "description": "Patient preference summary emitted by Phase 3."},
            "createdFromDecisionId": ref_string("Endpoint decision that created the handoff."),
            "decisionEpochRef": ref_string(
                "Current live DecisionEpoch at handoff time.",
                target_field="sourceDecisionEpochRef",
            ),
            "decisionSupersessionRecordRef": ref_string(
                "Decision supersession record captured at handoff time, if any.",
                nullable=True,
                target_field="sourceDecisionSupersessionRef",
            ),
            "lifecycleLeaseRef": ref_string(
                "Request lifecycle lease captured at handoff time.",
                target_field="requestLifecycleLeaseRef",
            ),
            "leaseAuthorityRef": ref_string("Authority that minted the lifecycle lease."),
            "leaseTtlSeconds": {
                "type": "integer",
                "minimum": 1,
                "description": "Lease TTL carried from Phase 3.",
            },
            "ownershipEpoch": {
                "type": "integer",
                "minimum": 0,
                "description": "Request ownership epoch captured at handoff time.",
                "x-phase4TargetField": "ownershipEpoch",
            },
            "fencingToken": ref_string("Single-writer fence token captured at handoff time."),
            "currentLineageFenceEpoch": {
                "type": "integer",
                "minimum": 0,
                "description": "Current lineage fence epoch at handoff time.",
            },
            "intentState": enum_string(
                ["proposed", "acknowledged", "superseded", "recovery_only"],
                "Governed handoff posture. Booking launch is legal only while the intent remains proposed or acknowledged on the current lineage.",
            ),
            "commandActionRecordRef": ref_string("Phase 3 command action record for the handoff."),
            "commandSettlementRecordRef": ref_string("Phase 3 settlement record for the handoff."),
            "lifecycleClosureAuthority": {
                "const": "LifecycleCoordinator",
                "description": "Booking handoff does not close the request; LifecycleCoordinator remains the only closure authority.",
            },
            "createdAt": {"type": "string", "format": "date-time"},
            "updatedAt": {"type": "string", "format": "date-time"},
            "version": {"type": "integer", "minimum": 1},
        },
        "x-governedInvariants": [
            "Phase 4 must start from BookingIntent lineage and may not open a blank appointment page.",
            "decisionEpochRef maps directly onto BookingCase.sourceDecisionEpochRef and must still match the current unsuperseded triage decision before booking mutation begins.",
            "decisionSupersessionRecordRef maps directly onto BookingCase.sourceDecisionSupersessionRef and freezes mutation when superseded.",
            "lifecycleLeaseRef, ownershipEpoch, fencingToken, and currentLineageFenceEpoch preserve request ownership into BookingCase creation and all later mutation paths.",
            "LifecycleCoordinator remains the only request-closure authority; the booking branch may settle only its own lineage work.",
        ],
    }


def build_booking_case_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/278_booking_case.schema.json",
        "title": "278 BookingCase",
        "description": "Durable BookingCase aggregate freeze pack. Top-level workflow state remains distinct from capability, reservation, confirmation, manage, and route-publication truth.",
        "type": "object",
        "additionalProperties": False,
        "required": BOOKING_CASE_REQUIRED,
        "properties": {
            "bookingCaseId": ref_string("Stable BookingCase identifier."),
            "episodeRef": ref_string("Episode ref."),
            "requestId": ref_string("Canonical request identifier."),
            "requestLineageRef": ref_string("Canonical RequestLineage identifier."),
            "lineageCaseLinkRef": ref_string("Current booking LineageCaseLink for the request lineage."),
            "originTriageTaskRef": ref_string("Triage task that opened the booking branch."),
            "bookingIntentId": ref_string("Source BookingIntent identifier."),
            "sourceDecisionEpochRef": ref_string("Current governing triage decision epoch."),
            "sourceDecisionSupersessionRef": ref_string("Current supersession record for the source decision, if any.", nullable=True),
            "patientRef": ref_string("Bound patient or subject ref."),
            "tenantId": ref_string("Tenant identifier."),
            "providerContext": {
                "type": "object",
                "additionalProperties": False,
                "required": ["practiceRef", "careSetting"],
                "properties": {
                    "practiceRef": ref_string("Practice or serving organisation reference."),
                    "supplierHintRef": ref_string("Current supplier hint, if known.", nullable=True),
                    "careSetting": {"type": "string", "description": "Care setting or service line descriptor."},
                },
            },
            "activeCapabilityResolutionRef": ref_string("Current BookingCapabilityResolution ref.", nullable=True),
            "activeCapabilityProjectionRef": ref_string("Current BookingCapabilityProjection ref.", nullable=True),
            "activeProviderAdapterBindingRef": ref_string("Current BookingProviderAdapterBinding ref.", nullable=True),
            "status": enum_string(REQUIRED_STATES, "Durable BookingCase workflow status."),
            "searchPolicyRef": ref_string("Current SearchPolicy ref.", nullable=True),
            "currentOfferSessionRef": ref_string("Current OfferSession ref.", nullable=True),
            "selectedSlotRef": ref_string("Current selected slot ref.", nullable=True),
            "appointmentRef": ref_string("Current authoritative AppointmentRecord ref.", nullable=True),
            "latestConfirmationTruthProjectionRef": ref_string("Current BookingConfirmationTruthProjection ref.", nullable=True),
            "waitlistEntryRef": ref_string("Current WaitlistEntry ref.", nullable=True),
            "activeWaitlistFallbackObligationRef": ref_string("Current WaitlistFallbackObligation ref.", nullable=True),
            "latestWaitlistContinuationTruthProjectionRef": ref_string("Current WaitlistContinuationTruthProjection ref.", nullable=True),
            "exceptionRef": ref_string("Current BookingException ref.", nullable=True),
            "activeIdentityRepairCaseRef": ref_string("Current identity-repair case ref.", nullable=True),
            "identityRepairBranchDispositionRef": ref_string("Current identity-repair branch disposition ref.", nullable=True),
            "identityRepairReleaseSettlementRef": ref_string("Identity-repair release settlement ref.", nullable=True),
            "requestLifecycleLeaseRef": ref_string("Current request lifecycle lease ref."),
            "ownershipEpoch": {
                "type": "integer",
                "minimum": 0,
                "description": "Current request ownership epoch for the booking branch.",
            },
            "staleOwnerRecoveryRef": ref_string("Current stale-owner recovery ref.", nullable=True),
            "patientShellConsistencyProjectionRef": ref_string("Signed-in patient shell consistency projection ref.", nullable=True),
            "patientEmbeddedSessionProjectionRef": ref_string("Embedded patient session projection ref.", nullable=True),
            "surfaceRouteContractRef": ref_string("AudienceSurfaceRouteContract governing booking routes."),
            "surfacePublicationRef": ref_string("Current surface publication ref."),
            "runtimePublicationBundleRef": ref_string("Current RuntimePublicationBundle ref."),
            "routeFreezeDispositionRef": ref_string("Current RouteFreezeDisposition ref.", nullable=True),
            "releaseRecoveryDispositionRef": ref_string("Current ReleaseRecoveryDisposition ref.", nullable=True),
            "closureAuthority": {
                "const": "LifecycleCoordinator",
                "description": "BookingCase settles booking truth only. LifecycleCoordinator remains the request-closure authority.",
            },
            "createdAt": {"type": "string", "format": "date-time"},
            "updatedAt": {"type": "string", "format": "date-time"},
        },
        "x-authorityAxes": AUTHORITY_AXES,
        "x-governedInvariants": [
            "BookingCase.status is the top-level workflow only and must not be reused as capability, reservation, confirmation, manage, or route-publication truth.",
            "sourceDecisionEpochRef and lineageCaseLinkRef remain binding for search, select, confirm, waitlist, callback fallback, hub fallback, cancel, and reschedule.",
            "Identity repair, route publication, and release recovery may freeze mutation in place without silently changing booking workflow status.",
            "No booking branch may close the request directly; LifecycleCoordinator derives request closure from downstream milestones.",
            "No orphan booking lineage is allowed: current booking, appointment, waitlist, fallback, and confirmation refs must either be typed seams or null.",
        ],
    }


def build_search_policy_schema() -> dict[str, object]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/278_search_policy.schema.json",
        "title": "278 SearchPolicy",
        "description": "Governed booking SearchPolicy freeze pack. Search truth compiles patient, continuity, accessibility, travel, and route/audience policy inputs into one stable bundle hash.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "policyId",
            "timeframeEarliest",
            "timeframeLatest",
            "modality",
            "clinicianType",
            "continuityPreference",
            "sitePreference",
            "accessibilityNeeds",
            "maxTravelTime",
            "bookabilityPolicy",
            "selectionAudience",
            "patientChannelMode",
            "policyBundleHash",
            "sameBandReorderSlackMinutesByWindow",
        ],
        "properties": {
            "policyId": ref_string("Stable SearchPolicy identifier."),
            "timeframeEarliest": {"type": "string", "format": "date-time"},
            "timeframeLatest": {"type": "string", "format": "date-time"},
            "modality": {"type": "string", "description": "Requested modality."},
            "clinicianType": {"type": "string", "description": "Requested clinician type or service."},
            "continuityPreference": {"type": "string", "description": "Continuity preference carried from triage or manage flows."},
            "sitePreference": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 0,
                "description": "Preferred sites or site clusters in priority order.",
            },
            "accessibilityNeeds": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 0,
                "description": "Accessibility or accommodation needs that filter or explain booking options.",
            },
            "maxTravelTime": {
                "type": "integer",
                "minimum": 0,
                "description": "Travel-time policy in minutes.",
            },
            "bookabilityPolicy": {
                "type": "string",
                "description": "Compiled local-booking policy bundle posture.",
            },
            "selectionAudience": enum_string(
                ["patient_self_service", "staff_assist"],
                "Audience whose capabilities and fallback posture govern the search.",
            ),
            "patientChannelMode": enum_string(
                ["signed_in_shell", "embedded_nhs_app", "staff_proxy"],
                "Channel mode governing route publication and continuity constraints.",
            ),
            "policyBundleHash": ref_string("Compiled policy-bundle hash used by snapshots, offer sessions, and commit paths."),
            "sameBandReorderSlackMinutesByWindow": {
                "type": "object",
                "description": "Per window-class slack minutes for same-band reordering.",
                "additionalProperties": {"type": "integer", "minimum": 0},
            },
        },
        "x-governedInvariants": [
            "SearchPolicy is stable input truth; browser-local sort, filters, or calendar mode may not rewrite policyBundleHash.",
            "Selection audience is part of the policy bundle and must match the active capability tuple.",
            "Policy bundle hash is propagated into snapshot, offer session, and booking transaction truth.",
        ],
    }


def build_state_machine() -> dict[str, object]:
    state_rows = []
    for family in STATE_FAMILIES:
        for state in family["states"]:
            detail = STATE_DETAILS[state]
            state_rows.append(
                {
                    "stateId": state,
                    "familyId": family["familyId"],
                    "familyLabel": family["label"],
                    "summary": detail["summary"],
                    "dominantAuthority": detail["dominant_authority"],
                    "entryPredicateSummary": detail["predicate"],
                    "routeCue": detail["route_cue"],
                }
            )

    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "visualMode": VISUAL_MODE,
        "aggregate": "BookingCase",
        "closureAuthority": "LifecycleCoordinator",
        "stateFamilies": STATE_FAMILIES,
        "states": state_rows,
        "authorityAxes": AUTHORITY_AXES,
        "transitions": TRANSITIONS,
        "prohibitedInterpretations": [
            "BookingCase.status may not imply capability state, reservation truth, or confirmation truth by itself.",
            "Booking child routes are same-shell child states, not detached mini-apps.",
            "BookingCase may not close the request directly.",
            "Late triage supersession or wrong-patient freeze may not be ignored after booking opens.",
        ],
    }


def build_route_registry() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "contractVersion": CONTRACT_VERSION,
        "visualMode": VISUAL_MODE,
        "routeFamilies": [
            {
                "routeId": route["routeId"],
                "path": route["path"],
                "sameShell": route["sameShell"],
                "transitionType": route["transitionType"],
                "historyPolicy": route["historyPolicy"],
                "projectionRef": route["projectionRef"],
                "objectAnchor": route["objectAnchor"],
                "dominantAction": route["dominantAction"],
                "supportedStates": route["supportedStates"],
                "publicationControls": [
                    "PatientShellConsistencyProjection",
                    "AudienceSurfaceRouteContract",
                    "SurfacePublication",
                    "RuntimePublicationBundle",
                    "RouteFreezeDisposition",
                    "ReleaseRecoveryDisposition",
                ],
                "returnContractRequired": True,
                "selectedAnchorPolicy": "preserve_last_safe_anchor",
                "closureAuthority": "LifecycleCoordinator",
                "sourceRefs": route["sourceRefs"],
            }
            for route in ROUTES
        ],
    }


def build_projection_bundle() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "bundleId": "278_patient_appointment_projection_bundle",
        "bundleVersion": CONTRACT_VERSION,
        "closureAuthority": "LifecycleCoordinator",
        "projections": [
            {
                "projectionId": projection["projectionId"],
                "routes": projection["routes"],
                "surfaceStates": projection["surfaceStates"],
                "dominantTruths": projection["dominantTruths"],
                "summary": projection["summary"],
                "sameShell": True,
                "selectedAnchorPolicy": "preserve_last_safe_anchor",
                "continuityRequirements": [
                    "PatientShellConsistencyProjection",
                    "AudienceSurfaceRouteContract",
                    "SurfacePublication",
                    "RuntimePublicationBundle",
                    "RouteFreezeDisposition",
                    "ReleaseRecoveryDisposition",
                    "PatientNavReturnContract",
                ],
            }
            for projection in PROJECTIONS
        ],
        "bundleInvariants": [
            "Booking list, workspace, confirm, manage, cancel, and reschedule routes stay inside one PersistentShell.",
            "SelectedAnchor and return contract survive same-object child-route transitions while continuity is unchanged.",
            "Browser history is not the authority for writability; explicit route, publication, and recovery contracts are.",
            "Quiet success remains suppressed until authoritative confirmation truth or governed manage settlement is current.",
        ],
    }


def build_event_catalog() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "catalogId": "278_booking_case_event_catalog",
        "catalogVersion": CONTRACT_VERSION,
        "closureAuthority": "LifecycleCoordinator",
        "events": EVENT_CATALOG,
        "apiSurfaceSkeleton": API_SURFACE,
    }


def booking_case_transition_matrix_rows() -> list[dict[str, object]]:
    rows = []
    for transition in TRANSITIONS:
        rows.append(
            {
                "transitionId": transition["transitionId"],
                "fromState": transition["from"],
                "toState": transition["to"],
                "predicateId": transition["predicateId"],
                "controllingObject": transition["controllingObject"],
                "ownerTask": transition["ownerTask"],
                "sourceRef": transition["sourceRef"],
                "predicate": transition["predicate"],
            }
        )
    return rows


def route_projection_matrix_rows() -> list[dict[str, object]]:
    rows = []
    for route in ROUTES:
        matched_projection = next(
            projection for projection in PROJECTIONS if projection["projectionId"] == route["projectionRef"]
        )
        rows.append(
            {
                "routeId": route["routeId"],
                "path": route["path"],
                "projectionRef": route["projectionRef"],
                "transitionType": route["transitionType"],
                "historyPolicy": route["historyPolicy"],
                "dominantAction": route["dominantAction"],
                "supportedStates": ",".join(route["supportedStates"]),
                "surfaceStates": ",".join(matched_projection["surfaceStates"]),
                "sameShell": "true" if route["sameShell"] else "false",
            }
        )
    return rows


def build_gap_log() -> dict[str, object]:
    return {
        "taskId": TASK_ID,
        "generatedAt": TODAY,
        "visualMode": VISUAL_MODE,
        "gapState": "typed_seams_published",
        "gaps": [
            {
                "gapId": gap["gapId"],
                "missingSurface": gap["missingSurface"],
                "expectedOwnerTask": gap["expectedOwnerTask"],
                "temporaryFallback": gap["temporaryFallback"],
                "riskIfUnresolved": gap["riskIfUnresolved"],
                "followUpAction": gap["followUpAction"],
            }
            for gap in INTERFACE_GAPS
        ],
    }


def booking_intent_doc_table() -> str:
    rows = [
        ["`intentId`", "Stable Phase 3 seed id", "Preserve exactly; BookingCase stores this as `bookingIntentId`."],
        ["`lineageCaseLinkRef`", "Booking child branch join", "Case creation must acknowledge, not replace, this child link."],
        ["`decisionEpochRef`", "Source decision epoch", "Maps to `BookingCase.sourceDecisionEpochRef`."],
        ["`decisionSupersessionRecordRef`", "Source decision supersession", "Maps to `BookingCase.sourceDecisionSupersessionRef`."],
        ["`lifecycleLeaseRef`", "Request lifecycle lease", "Maps to `BookingCase.requestLifecycleLeaseRef`."],
        ["`ownershipEpoch`", "Request ownership epoch", "Maps to `BookingCase.ownershipEpoch`."],
        ["`fencingToken`", "Single-writer fence", "Must still validate before booking mutation."],
    ]
    return md_table(["Field", "Meaning", "Phase 4 rule"], rows)


def write_docs(
    state_machine: dict[str, object],
    route_registry: dict[str, object],
    projection_bundle: dict[str, object],
    event_catalog: dict[str, object],
) -> None:
    architecture_rows = [
        [state, STATE_DETAILS[state]["dominant_authority"], STATE_DETAILS[state]["summary"]]
        for state in REQUIRED_STATES
    ]
    transition_rows = [
        [transition["from"], transition["to"], transition["controllingObject"], transition["predicateId"]]
        for transition in TRANSITIONS
    ]
    axis_rows = [
        [axis["label"], axis["governingField"], axis["ownerTask"], axis["notes"]] for axis in AUTHORITY_AXES
    ]
    seam_rows = [
        [gap["missingSurface"], gap["expectedOwnerTask"], "; ".join(gap["typedSeams"])]
        for gap in INTERFACE_GAPS
    ]

    write_text(
        "docs/architecture/278_phase4_booking_case_contract_and_state_machine.md",
        f"""
# 278 Phase 4 BookingCase Contract and State Machine

`seq_278` freezes the Phase 4 booking case kernel. This pack is deliberately narrow: it fixes the durable BookingIntent handoff, BookingCase aggregate, SearchPolicy contract, top-level state vocabulary, legal transition graph, route-family laws, and patient projection bundle without stealing ownership from `seq_279` or `seq_280`.

## Kernel boundary

- Phase 3 already ends with a governed `BookingIntent`; Phase 4 must wrap that lineage rather than starting from blank browser state.
- `BookingCase.status` is the top-level booking workflow only.
- Capability truth, reservation truth, confirmation truth, manage posture, and route-publication posture remain separate authorities.
- `LifecycleCoordinator` remains the only request-closure authority.

## BookingIntent handoff freeze

{booking_intent_doc_table()}

## BookingCase state vocabulary

{md_table(["State", "Dominant authority", "Meaning"], architecture_rows)}

## Authority separation

{md_table(["Axis", "Governing field", "Owner", "Notes"], axis_rows)}

## Legal transition graph

{md_table(["From", "To", "Controlling object", "Predicate id"], transition_rows)}

Every conditional edge is backed by one governing predicate in `/data/contracts/278_booking_case_state_machine.json`. The graph rejects the common drift modes called out in the prompt:

1. case state does not stand in for capability state
2. reservation or confirmation truth does not collapse into `status`
3. superseded or wrong-patient lineage cannot continue mutating just because the booking shell is already open
4. callback and hub fallback remain explicit branch states, not quiet route redirects

## Lineage, route, and lease rules

{md_table(
    ["Binding", "Why it exists", "Rule"],
    [[row["field"], row["summary"], row["rule"]] for row in LINEAGE_RULES],
)}

## Later-owned typed seams

{md_table(["Missing surface", "Owner task", "Typed seams"], seam_rows)}

Those gaps are also published machine-readably in `/data/analysis/PHASE4_INTERFACE_GAP_BOOKING_CASE_KERNEL.json`. They are typed seams, not prose TODOs.

## Event and API freeze

- the event catalog is frozen in `/data/contracts/278_booking_case_event_catalog.json`
- the API skeleton is frozen there and expanded narratively in `/docs/api/278_phase4_booking_case_route_and_projection_contract.md`
- missing concrete event schemas are explicitly catalogued with `implementationOwnerTask` instead of left implicit
""",
    )

    route_rows = [
        [route["path"], route["projectionRef"], route["transitionType"], route["historyPolicy"], route["dominantAction"]]
        for route in ROUTES
    ]
    projection_rows = [
        [projection["projectionId"], ", ".join(projection["routes"]), ", ".join(projection["surfaceStates"])]
        for projection in PROJECTIONS
    ]
    api_rows = [[entry["method"], entry["path"], entry["purpose"], entry["ownerTask"]] for entry in API_SURFACE]

    write_text(
        "docs/api/278_phase4_booking_case_route_and_projection_contract.md",
        f"""
# 278 Phase 4 Booking Case Route and Projection Contract

This document freezes the patient-side route family and projection bundle that later Phase 4 frontend and backend tasks must consume.

## Route-family registry

{md_table(["Path", "Projection", "Transition type", "History policy", "Dominant action"], route_rows)}

### Governing rules

1. All booking and appointment routes stay inside one signed-in `PersistentShell`.
2. `/bookings/:bookingCaseId/select -> /bookings/:bookingCaseId/confirm` uses `historyPolicy = replace` until authoritative settlement lands.
3. `SelectedAnchor`, return contract, continuity evidence, and publication posture are explicit contract fields, not browser-history guesswork.
4. Route publication drift freezes the shell in place through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`; it does not silently leave stale controls live.

## Patient projection bundle

{md_table(["Projection", "Routes", "Surface states"], projection_rows)}

## API surface skeleton

{md_table(["Method", "Path", "Purpose", "Later owner"], api_rows)}

## Closure law

The booking surface may create, search, select, confirm, waitlist, cancel, reschedule, or transfer fallback state. It does **not** close the canonical request. `LifecycleCoordinator` remains the only request-closure authority.
""",
    )

    security_rows = [[row["field"], row["rule"]] for row in LINEAGE_RULES]
    write_text(
        "docs/security/278_phase4_booking_lineage_epoch_and_identity_repair_rules.md",
        f"""
# 278 Phase 4 Booking Lineage, Epoch, and Identity Repair Rules

This pack fixes the security and recovery invariants that must survive every later Phase 4 implementation.

## Binding rules

{md_table(["Binding", "Enforcement rule"], security_rows)}

## Fail-closed invariants

1. Source decision supersession freezes booking mutation before search, select, confirm, waitlist join, callback fallback, hub fallback, cancel, or reschedule.
2. Wrong-patient correction preserves summary provenance only; live booking may return only after released identity-repair settlement.
3. Request lifecycle lease drift or ownership epoch drift creates stale-owner recovery and blocks mutation in place.
4. Publication drift or release recovery freezes routes in place rather than redirecting to detached fallback pages.
5. Booking branch closure is not request closure; only `LifecycleCoordinator` may derive request closure after downstream milestones converge.

## Explicit non-goals

- no browser-local booking truth
- no route-local success pages that bypass confirmation truth
- no booking-local closure authority
- no implicit lineage repair by hiding old references
""",
    )


def atlas_layout_positions() -> dict[str, tuple[int, int]]:
    return {
        "handoff_received": (50, 52),
        "capability_checked": (270, 52),
        "searching_local": (510, 52),
        "offers_ready": (770, 52),
        "selecting": (1020, 52),
        "revalidating": (50, 196),
        "commit_pending": (300, 196),
        "booked": (560, 196),
        "confirmation_pending": (820, 196),
        "supplier_reconciliation_pending": (1070, 196),
        "waitlisted": (120, 340),
        "callback_fallback": (380, 340),
        "fallback_to_hub": (640, 340),
        "booking_failed": (900, 340),
        "managed": (380, 484),
        "closed": (740, 484),
    }


def build_atlas_html(
    state_machine: dict[str, object],
    route_registry: dict[str, object],
    projection_bundle: dict[str, object],
    event_catalog: dict[str, object],
) -> str:
    atlas_data = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "stateFamilies": STATE_FAMILIES,
        "stateDetails": {
            state: {
                "summary": STATE_DETAILS[state]["summary"],
                "dominantAuthority": STATE_DETAILS[state]["dominant_authority"],
                "entryPredicate": STATE_DETAILS[state]["predicate"],
                "routeCue": STATE_DETAILS[state]["route_cue"],
            }
            for state in REQUIRED_STATES
        },
        "transitions": TRANSITIONS,
        "routes": ROUTES,
        "projections": PROJECTIONS,
        "lineageRules": LINEAGE_RULES,
        "authorityAxes": AUTHORITY_AXES,
        "apiSurface": API_SURFACE,
        "events": EVENT_CATALOG,
        "positions": atlas_layout_positions(),
    }

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>278 Booking Case State Atlas</title>
    <style>
      :root {{
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --text-strong: #0F1720;
        --text-default: #24313D;
        --text-muted: #5E6B78;
        --accent-lineage: #3158E0;
        --accent-booking: #0F766E;
        --accent-pending: #B7791F;
        --accent-blocked: #B42318;
        --border: #D6DEE6;
        --shadow: 0 16px 32px rgba(15, 23, 32, 0.08);
      }}

      * {{
        box-sizing: border-box;
      }}

      html, body {{
        margin: 0;
        background: var(--canvas);
        color: var(--text-default);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }}

      body {{
        padding: 24px;
      }}

      .atlas-shell {{
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }}

      .masthead {{
        height: 72px;
        background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.7));
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
      }}

      .brand {{
        display: flex;
        align-items: center;
        gap: 14px;
      }}

      .brand svg {{
        width: 28px;
        height: 28px;
      }}

      .brand-word {{
        font-size: 0.96rem;
        font-weight: 700;
        color: var(--text-strong);
      }}

      .masthead-copy {{
        display: flex;
        flex-direction: column;
        gap: 2px;
      }}

      .masthead-title {{
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-strong);
      }}

      .masthead-subtitle {{
        font-size: 0.9rem;
        color: var(--text-muted);
      }}

      .masthead-meta {{
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        color: var(--text-muted);
        font-size: 0.86rem;
      }}

      .chip {{
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--inset);
        border: 1px solid var(--border);
        white-space: normal;
        overflow-wrap: anywhere;
      }}

      .shell-grid {{
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr) 408px;
        gap: 18px;
        align-items: start;
      }}

      .shell-grid > *,
      .diagram-table-pair > * {{
        min-width: 0;
      }}

      .panel {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow);
      }}

      .panel-header {{
        padding: 18px 18px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }}

      .panel-title {{
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-strong);
        overflow-wrap: anywhere;
      }}

      .panel-subtitle {{
        font-size: 0.82rem;
        color: var(--text-muted);
        overflow-wrap: anywhere;
      }}

      .state-rail {{
        padding: 10px 12px 14px;
        display: grid;
        gap: 14px;
      }}

      .family-block {{
        background: var(--shell);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 10px;
        display: grid;
        gap: 8px;
      }}

      .family-block h3 {{
        margin: 0;
        font-size: 0.86rem;
        color: var(--text-strong);
      }}

      .family-block p {{
        margin: 0;
        font-size: 0.76rem;
        color: var(--text-muted);
        line-height: 1.45;
      }}

      .state-button,
      .route-button {{
        width: 100%;
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 12px;
        padding: 10px 12px;
        text-align: left;
        color: var(--text-default);
        font: inherit;
        cursor: pointer;
        transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
        overflow-wrap: anywhere;
      }}

      .state-button:hover,
      .route-button:hover {{
        border-color: rgba(49, 88, 224, 0.35);
      }}

      .state-button[aria-pressed="true"],
      .route-button[aria-pressed="true"] {{
        border-color: var(--accent-lineage);
        background: rgba(49, 88, 224, 0.08);
        color: var(--text-strong);
      }}

      .state-button:focus-visible,
      .route-button:focus-visible,
      .atlas-region:focus-visible,
      .table-scroll:focus-visible {{
        outline: 3px solid rgba(49, 88, 224, 0.32);
        outline-offset: 2px;
      }}

      .button-kicker {{
        display: block;
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-bottom: 3px;
      }}

      .button-title {{
        font-size: 0.86rem;
        font-weight: 700;
        color: inherit;
      }}

      .button-summary {{
        font-size: 0.74rem;
        color: var(--text-muted);
        margin-top: 4px;
        line-height: 1.4;
      }}

      .canvas-stack {{
        display: grid;
        gap: 18px;
      }}

      .atlas-region {{
        padding: 18px;
        display: grid;
        gap: 16px;
      }}

      .lattice-grid {{
        position: relative;
        min-height: 620px;
        background: linear-gradient(180deg, rgba(238,242,246,0.72), rgba(247,248,250,0.92));
        border: 1px solid var(--border);
        border-radius: 16px;
        overflow: hidden;
      }}

      .lattice-grid svg {{
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }}

      .state-node {{
        position: absolute;
        width: 188px;
        min-height: 84px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fff;
        padding: 12px 14px;
        box-shadow: 0 10px 22px rgba(15, 23, 32, 0.08);
        cursor: pointer;
        transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
        overflow-wrap: anywhere;
      }}

      .state-node.active {{
        border-color: var(--accent-booking);
        box-shadow: 0 16px 32px rgba(15, 118, 110, 0.18);
      }}

      .state-node.related {{
        border-color: rgba(183, 121, 31, 0.58);
      }}

      .state-node-label {{
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-bottom: 5px;
      }}

      .state-node-title {{
        font-size: 0.92rem;
        font-weight: 700;
        color: var(--text-strong);
        margin-bottom: 4px;
      }}

      .state-node-summary {{
        font-size: 0.74rem;
        line-height: 1.45;
        color: var(--text-muted);
      }}

      .diagram-table-pair {{
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 14px;
      }}

      .braid-strip,
      .route-ladder,
      .projection-map {{
        display: grid;
        gap: 12px;
        background: var(--shell);
        border-radius: 14px;
        border: 1px solid var(--border);
        padding: 14px;
      }}

      .braid-row {{
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }}

      .braid-token,
      .projection-card {{
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 12px;
        padding: 12px;
        overflow-wrap: anywhere;
      }}

      .braid-token strong,
      .projection-card strong {{
        display: block;
        color: var(--text-strong);
        font-size: 0.82rem;
        margin-bottom: 4px;
      }}

      .braid-token span,
      .projection-card span {{
        font-size: 0.74rem;
        line-height: 1.4;
        color: var(--text-muted);
      }}

      .route-list {{
        display: grid;
        gap: 10px;
      }}

      .projection-map {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}

      .projection-card.active {{
        border-color: var(--accent-lineage);
        background: rgba(49, 88, 224, 0.06);
      }}

      .inspector {{
        padding: 18px;
        display: grid;
        gap: 16px;
        position: sticky;
        top: 24px;
      }}

      .inspector-section {{
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px;
        background: var(--shell);
        min-width: 0;
      }}

      .inspector-section h3 {{
        margin: 0 0 8px;
        font-size: 0.84rem;
        color: var(--text-strong);
      }}

      .inspector-section p,
      .inspector-section li {{
        margin: 0;
        font-size: 0.76rem;
        line-height: 1.5;
        color: var(--text-default);
        overflow-wrap: anywhere;
      }}

      .inspector-section ul {{
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 6px;
      }}

      .lower-grid {{
        display: grid;
        gap: 18px;
      }}

      .table-shell {{
        display: grid;
        gap: 12px;
        padding: 18px;
      }}

      .table-scroll {{
        overflow: auto;
        border: 1px solid var(--border);
        border-radius: 14px;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        min-width: 720px;
      }}

      th,
      td {{
        border-bottom: 1px solid var(--border);
        padding: 11px 12px;
        text-align: left;
        vertical-align: top;
        font-size: 0.78rem;
        line-height: 1.45;
      }}

      th {{
        position: sticky;
        top: 0;
        background: #f8fafc;
        color: var(--text-strong);
        font-weight: 700;
      }}

      tr.active-row {{
        background: rgba(49, 88, 224, 0.06);
      }}

      .legend {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 0.74rem;
        color: var(--text-muted);
      }}

      .legend span {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }}

      .legend i {{
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display: inline-block;
      }}

      @media (prefers-reduced-motion: reduce) {{
        *, *::before, *::after {{
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }}
      }}

      @media (max-width: 1220px) {{
        .shell-grid {{
          grid-template-columns: 1fr;
        }}

        .inspector {{
          position: static;
        }}

        .diagram-table-pair {{
          grid-template-columns: 1fr;
        }}
      }}

      @media (max-width: 760px) {{
        body {{
          padding: 14px;
        }}

        .masthead {{
          height: auto;
          min-height: 72px;
          padding: 16px;
          align-items: start;
          gap: 12px;
          flex-direction: column;
        }}

        .projection-map {{
          grid-template-columns: 1fr;
        }}

        .braid-row {{
          grid-template-columns: 1fr;
        }}

        table {{
          min-width: 560px;
        }}
      }}
    </style>
  </head>
  <body>
    <div
      class="atlas-shell"
      data-testid="BookingCaseStateAtlas"
      data-visual-mode="{VISUAL_MODE}"
      data-reduced-motion="no-preference"
      data-active-state="handoff_received"
      data-active-route="/bookings/:bookingCaseId"
    >
      <header class="masthead panel" data-testid="BookingCaseAtlasMasthead">
        <div class="brand">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="booking_case_lattice_mark" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#3158E0"></stop>
                <stop offset="100%" stop-color="#0F766E"></stop>
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#booking_case_lattice_mark)"></rect>
            <path d="M14 18h20M14 24h20M14 30h12" stroke="#F7F8FA" stroke-width="3" stroke-linecap="round"></path>
          </svg>
          <div class="masthead-copy">
            <div class="brand-word">Vecells</div>
            <div class="masthead-title">Booking Case State Atlas</div>
            <div class="masthead-subtitle">Phase 4 contract freeze for BookingIntent handoff, BookingCase workflow, and patient route continuity.</div>
          </div>
        </div>
        <div class="masthead-meta">
          <span class="chip">Task {TASK_ID}</span>
          <span class="chip">Contract {CONTRACT_VERSION}</span>
          <span class="chip">Visual mode {VISUAL_MODE}</span>
        </div>
      </header>

      <div class="shell-grid">
        <aside class="panel state-rail" data-testid="StateFamilyRail" aria-label="Booking state families">
          <div class="panel-header">
            <div class="panel-title">State family rail</div>
            <div class="panel-subtitle">One top-level workflow vocabulary. Capability, reservation, confirmation, and route publication stay separate.</div>
          </div>
        </aside>

        <main class="canvas-stack">
          <section class="panel atlas-region" data-testid="CaseStateLatticeRegion" aria-labelledby="lattice-title">
            <div>
              <div class="panel-title" id="lattice-title">Case-state lattice</div>
              <div class="panel-subtitle">Select a state or route family to synchronize the lattice, inspector, and evidence tables.</div>
            </div>
            <div class="legend" aria-label="State legend">
              <span><i style="background:#0F766E"></i> active state</span>
              <span><i style="background:#B7791F"></i> route-related state</span>
              <span><i style="background:#3158E0"></i> lineage emphasis</span>
            </div>
            <div class="lattice-grid atlas-region" tabindex="0" data-testid="CaseStateLattice" aria-label="Booking case state lattice">
              <svg data-testid="CaseStateLatticeEdges" aria-hidden="true"></svg>
            </div>
          </section>

          <section class="diagram-table-pair">
            <div class="panel atlas-region" data-testid="LineageFenceBraid" tabindex="0" aria-labelledby="braid-title">
              <div>
                <div class="panel-title" id="braid-title">Lineage-and-fence braid</div>
                <div class="panel-subtitle">Late supersession, identity repair, publication drift, and request ownership all stay binding after booking opens.</div>
              </div>
              <div class="braid-strip" data-testid="LineageFenceBraidDiagram"></div>
            </div>
            <div class="panel table-shell" data-testid="LineageFenceBraidTableShell">
              <div class="panel-title">Lineage parity table</div>
              <div class="table-scroll" tabindex="0" data-testid="LineageFenceBraidTable">
                <table>
                  <thead>
                    <tr><th>Binding</th><th>Rule</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="diagram-table-pair">
            <div class="panel atlas-region" data-testid="RouteFamilyLadder" tabindex="0" aria-labelledby="route-title">
              <div>
                <div class="panel-title" id="route-title">Route-family ladder</div>
                <div class="panel-subtitle">Booking list, choose, confirm, manage, cancel, and reschedule stay inside one patient shell.</div>
              </div>
              <div class="route-ladder">
                <div class="route-list" data-testid="RouteFamilyButtons"></div>
              </div>
            </div>
            <div class="panel table-shell" data-testid="RouteFamilyTableShell">
              <div class="panel-title">Route ownership parity</div>
              <div class="table-scroll" tabindex="0" data-testid="RouteFamilyTable">
                <table>
                  <thead>
                    <tr><th>Path</th><th>Projection</th><th>Transition type</th><th>History policy</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="diagram-table-pair">
            <div class="panel atlas-region" data-testid="PatientProjectionMap" tabindex="0" aria-labelledby="projection-title">
              <div>
                <div class="panel-title" id="projection-title">Patient-projection map</div>
                <div class="panel-subtitle">Projection truth stays explicit so later frontend work cannot improvise booking semantics page by page.</div>
              </div>
              <div class="projection-map" data-testid="ProjectionCards"></div>
            </div>
            <div class="panel table-shell" data-testid="ProjectionTableShell">
              <div class="panel-title">Projection parity table</div>
              <div class="table-scroll" tabindex="0" data-testid="ProjectionTable">
                <table>
                  <thead>
                    <tr><th>Projection</th><th>Routes</th><th>Surface states</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        <aside class="panel inspector" data-testid="InspectorPanel" aria-live="polite">
          <div class="panel-title">Inspector</div>
          <div class="panel-subtitle">Selected state and route family remain synchronized here.</div>
          <div class="inspector-section" data-testid="InspectorStateSummary">
            <h3>State</h3>
            <p id="inspector-state-label"></p>
          </div>
          <div class="inspector-section" data-testid="InspectorStatePredicate">
            <h3>Governing predicate</h3>
            <p id="inspector-state-predicate"></p>
          </div>
          <div class="inspector-section" data-testid="InspectorRouteSummary">
            <h3>Route family</h3>
            <p id="inspector-route-label"></p>
          </div>
          <div class="inspector-section" data-testid="InspectorAuthorityAxes">
            <h3>Authority separation</h3>
            <ul id="inspector-authority-list"></ul>
          </div>
          <div class="inspector-section" data-testid="InspectorLinkedProjections">
            <h3>Linked projections</h3>
            <ul id="inspector-projection-list"></ul>
          </div>
        </aside>
      </div>

      <section class="lower-grid">
        <div class="panel table-shell" data-testid="TransitionTableShell">
          <div class="panel-title">Transition evidence</div>
          <div class="panel-subtitle">Filtered by the selected state and visually aligned to the lattice.</div>
          <div class="table-scroll" tabindex="0" data-testid="TransitionTable">
            <table>
              <thead>
                <tr><th>From</th><th>To</th><th>Predicate</th><th>Controlling object</th><th>Owner</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div class="panel table-shell" data-testid="ApiSurfaceTableShell">
          <div class="panel-title">API and event skeleton</div>
          <div class="panel-subtitle">Later tasks may implement these seams, but they may not rename them.</div>
          <div class="table-scroll" tabindex="0" data-testid="ApiSurfaceTable">
            <table>
              <thead>
                <tr><th>Method or event</th><th>Path or contract</th><th>Owner</th><th>Status</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <script id="atlas-data" type="application/json">{html.escape(json.dumps(atlas_data))}</script>
    <script>
      const atlasDataNode = document.getElementById("atlas-data");
      const atlasDataDecoder = document.createElement("textarea");
      atlasDataDecoder.innerHTML = atlasDataNode.textContent;
      const data = JSON.parse(atlasDataDecoder.value);
      const root = document.querySelector("[data-testid='BookingCaseStateAtlas']");
      root.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference";

      const stateRail = document.querySelector("[data-testid='StateFamilyRail']");
      const lattice = document.querySelector("[data-testid='CaseStateLattice']");
      const latticeEdges = document.querySelector("[data-testid='CaseStateLatticeEdges']");
      const braidDiagram = document.querySelector("[data-testid='LineageFenceBraidDiagram']");
      const braidTableBody = document.querySelector("[data-testid='LineageFenceBraidTable'] tbody");
      const routeButtons = document.querySelector("[data-testid='RouteFamilyButtons']");
      const routeTableBody = document.querySelector("[data-testid='RouteFamilyTable'] tbody");
      const projectionCards = document.querySelector("[data-testid='ProjectionCards']");
      const projectionTableBody = document.querySelector("[data-testid='ProjectionTable'] tbody");
      const transitionTableBody = document.querySelector("[data-testid='TransitionTable'] tbody");
      const apiTableBody = document.querySelector("[data-testid='ApiSurfaceTable'] tbody");

      let activeState = "handoff_received";
      let activeRoute = "/bookings/:bookingCaseId";

      function titleCase(value) {{
        return value.replaceAll("_", " ");
      }}

      function routeRecord(path) {{
        return data.routes.find((route) => route.path === path);
      }}

      function projectionRecord(id) {{
        return data.projections.find((projection) => projection.projectionId === id);
      }}

      function connectedStatesForRoute(path) {{
        const route = routeRecord(path);
        return new Set(route ? route.supportedStates : []);
      }}

      function buildRail() {{
        data.stateFamilies.forEach((family, familyIndex) => {{
          const block = document.createElement("section");
          block.className = "family-block";
          block.innerHTML = `<h3>${{family.label}}</h3><p>${{family.summary}}</p>`;
          family.states.forEach((state, stateIndex) => {{
            const detail = data.stateDetails[state];
            const button = document.createElement("button");
            button.type = "button";
            button.className = "state-button";
            button.dataset.state = state;
            button.dataset.testid = `StateButton-${{state}}`;
            button.setAttribute("data-testid", `StateButton-${{state}}`);
            button.setAttribute("aria-pressed", state === activeState ? "true" : "false");
            button.innerHTML = `
              <span class="button-kicker">${{family.label}}</span>
              <span class="button-title">${{titleCase(state)}}</span>
              <span class="button-summary">${{detail.summary}}</span>
            `;
            button.addEventListener("click", () => selectState(state));
            button.addEventListener("keydown", (event) => {{
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              const peers = Array.from(stateRail.querySelectorAll(".state-button"));
              const index = peers.indexOf(button);
              const nextIndex = event.key === "ArrowDown" ? Math.min(peers.length - 1, index + 1) : Math.max(0, index - 1);
              peers[nextIndex].focus();
            }});
            block.appendChild(button);
          }});
          stateRail.appendChild(block);
        }});
      }}

      function drawLattice() {{
        const positions = data.positions;
        const nodes = Object.entries(positions);
        const lines = data.transitions.map((transition) => {{
          const from = positions[transition.from];
          const to = positions[transition.to];
          if (!from || !to) return "";
          const [fromX, fromY] = from;
          const [toX, toY] = to;
          const startX = fromX + 188;
          const startY = fromY + 42;
          const endX = toX;
          const endY = toY + 42;
          const midX = (startX + endX) / 2;
          return `<path d="M${{startX}} ${{startY}} C ${{midX}} ${{startY}}, ${{midX}} ${{endY}}, ${{endX}} ${{endY}}" stroke="${{transition.from === activeState || transition.to === activeState ? '#3158E0' : '#CBD5E1'}}" stroke-width="${{transition.from === activeState || transition.to === activeState ? 2.6 : 1.4}}" fill="none" opacity="${{transition.from === activeState || transition.to === activeState ? 1 : 0.8}}" />`;
        }}).join("");
        latticeEdges.setAttribute("viewBox", "0 0 1280 620");
        latticeEdges.innerHTML = lines;
        lattice.querySelectorAll(".state-node").forEach((node) => node.remove());
        const relatedStates = connectedStatesForRoute(activeRoute);
        nodes.forEach(([state, [x, y]]) => {{
          const detail = data.stateDetails[state];
          const button = document.createElement("button");
          button.type = "button";
          button.className = "state-node";
          if (state === activeState) button.classList.add("active");
          if (relatedStates.has(state) && state !== activeState) button.classList.add("related");
          button.style.left = `${{x}}px`;
          button.style.top = `${{y}}px`;
          button.dataset.state = state;
          button.setAttribute("data-testid", `StateNode-${{state}}`);
          button.innerHTML = `
            <div class="state-node-label">${{titleCase(state)}}</div>
            <div class="state-node-title">${{detail.dominantAuthority}}</div>
            <div class="state-node-summary">${{detail.routeCue}}</div>
          `;
          button.addEventListener("click", () => selectState(state));
          lattice.appendChild(button);
        }});
      }}

      function buildBraid() {{
        const rows = [
          data.lineageRules.slice(0, 4),
          data.lineageRules.slice(4, 8),
          data.lineageRules.slice(8),
        ];
        braidDiagram.innerHTML = rows.map((row) => `
          <div class="braid-row">
            ${{row.map((entry) => `
              <div class="braid-token" data-testid="BraidToken-${{entry.field}}">
                <strong>${{entry.field}}</strong>
                <span>${{entry.summary}}</span>
              </div>
            `).join("")}}
          </div>
        `).join("");
        braidTableBody.innerHTML = data.lineageRules.map((entry) => `
          <tr><td><strong>${{entry.field}}</strong><br /><span style="color:#5E6B78">${{entry.summary}}</span></td><td>${{entry.rule}}</td></tr>
        `).join("");
      }}

      function buildRoutes() {{
        routeButtons.innerHTML = "";
        data.routes.forEach((route) => {{
          const button = document.createElement("button");
          button.type = "button";
          button.className = "route-button";
          button.dataset.route = route.path;
          button.setAttribute("data-testid", `RouteButton-${{route.routeId}}`);
          button.setAttribute("aria-pressed", route.path === activeRoute ? "true" : "false");
          button.innerHTML = `
            <span class="button-kicker">${{route.transitionType}}</span>
            <span class="button-title">${{route.path}}</span>
            <span class="button-summary">${{route.projectionRef}} · dominant action: ${{route.dominantAction}}</span>
          `;
          button.addEventListener("click", () => selectRoute(route.path));
          button.addEventListener("keydown", (event) => {{
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const peers = Array.from(routeButtons.querySelectorAll(".route-button"));
            const index = peers.indexOf(button);
            const nextIndex = event.key === "ArrowDown" ? Math.min(peers.length - 1, index + 1) : Math.max(0, index - 1);
            peers[nextIndex].focus();
          }});
          routeButtons.appendChild(button);
        }});
      }}

      function renderRouteTable() {{
        routeTableBody.innerHTML = data.routes.map((route) => `
          <tr class="${{route.path === activeRoute ? "active-row" : ""}}">
            <td><strong>${{route.path}}</strong></td>
            <td>${{route.projectionRef}}</td>
            <td>${{route.transitionType}}</td>
            <td>${{route.historyPolicy}}</td>
          </tr>
        `).join("");
      }}

      function renderProjectionMap() {{
        projectionCards.innerHTML = data.projections.map((projection) => `
          <article class="projection-card ${{projection.projectionId === routeRecord(activeRoute).projectionRef ? "active" : ""}}" data-testid="ProjectionCard-${{projection.projectionId}}">
            <strong>${{projection.projectionId}}</strong>
            <span>${{projection.summary}}</span>
          </article>
        `).join("");
        projectionTableBody.innerHTML = data.projections.map((projection) => `
          <tr class="${{projection.projectionId === routeRecord(activeRoute).projectionRef ? "active-row" : ""}}">
            <td><strong>${{projection.projectionId}}</strong></td>
            <td>${{projection.routes.join(", ")}}</td>
            <td>${{projection.surfaceStates.join(", ")}}</td>
          </tr>
        `).join("");
      }}

      function renderTransitions() {{
        transitionTableBody.innerHTML = data.transitions
          .filter((transition) => transition.from === activeState || transition.to === activeState)
          .map((transition) => `
            <tr class="active-row">
              <td>${{transition.from}}</td>
              <td>${{transition.to}}</td>
              <td><strong>${{transition.predicateId}}</strong><br /><span style="color:#5E6B78">${{transition.predicate}}</span></td>
              <td>${{transition.controllingObject}}</td>
              <td>${{transition.ownerTask}}</td>
            </tr>
          `)
          .join("");
      }}

      function renderApiSurface() {{
        const eventRows = data.events.map((event) => ({{
          label: event.eventName,
          detail: event.canonicalEventContractRef,
          owner: event.implementationOwnerTask,
          status: event.schemaPath ? "schema_present" : "catalog_frozen_only",
        }}));
        const apiRows = data.apiSurface.map((entry) => ({{
          label: entry.method,
          detail: entry.path,
          owner: entry.ownerTask,
          status: "api_surface_frozen",
        }}));
        const rows = [...apiRows, ...eventRows];
        apiTableBody.innerHTML = rows.map((row) => `
          <tr>
            <td>${{row.label}}</td>
            <td>${{row.detail}}</td>
            <td>${{row.owner}}</td>
            <td>${{row.status}}</td>
          </tr>
        `).join("");
      }}

      function renderInspector() {{
        const state = data.stateDetails[activeState];
        const route = routeRecord(activeRoute);
        const projection = projectionRecord(route.projectionRef);
        root.dataset.activeState = activeState;
        root.dataset.activeRoute = activeRoute;
        document.getElementById("inspector-state-label").innerHTML = `<strong>${{activeState}}</strong><br />${{state.summary}}<br /><span style="color:#5E6B78">${{state.dominantAuthority}}</span>`;
        document.getElementById("inspector-state-predicate").textContent = state.entryPredicate;
        document.getElementById("inspector-route-label").innerHTML = `<strong>${{route.path}}</strong><br />${{route.transitionType}} · history ${{route.historyPolicy}} · dominant action ${{route.dominantAction}}`;
        document.getElementById("inspector-authority-list").innerHTML = data.authorityAxes.map((axis) => `
          <li><strong>${{axis.label}}</strong>: ${{axis.governingField}}</li>
        `).join("");
        document.getElementById("inspector-projection-list").innerHTML = projection.dominantTruths.map((truth) => `
          <li>${{projection.projectionId}} uses <strong>${{truth}}</strong></li>
        `).join("");

        stateRail.querySelectorAll(".state-button").forEach((button) => {{
          button.setAttribute("aria-pressed", button.dataset.state === activeState ? "true" : "false");
        }});
        routeButtons.querySelectorAll(".route-button").forEach((button) => {{
          button.setAttribute("aria-pressed", button.dataset.route === activeRoute ? "true" : "false");
        }});
      }}

      function renderAll() {{
        drawLattice();
        renderRouteTable();
        renderProjectionMap();
        renderTransitions();
        renderApiSurface();
        renderInspector();
      }}

      function selectState(state) {{
        activeState = state;
        renderAll();
      }}

      function selectRoute(path) {{
        activeRoute = path;
        renderAll();
      }}

      buildRail();
      buildBraid();
      buildRoutes();
      renderAll();
    </script>
  </body>
</html>
"""


def write_atlas_html(
    state_machine: dict[str, object],
    route_registry: dict[str, object],
    projection_bundle: dict[str, object],
    event_catalog: dict[str, object],
) -> None:
    write_text(
        "docs/frontend/278_phase4_booking_case_state_atlas.html",
        build_atlas_html(state_machine, route_registry, projection_bundle, event_catalog),
    )


def main() -> None:
    booking_intent_schema = build_booking_intent_schema()
    booking_case_schema = build_booking_case_schema()
    search_policy_schema = build_search_policy_schema()
    state_machine = build_state_machine()
    route_registry = build_route_registry()
    projection_bundle = build_projection_bundle()
    event_catalog = build_event_catalog()
    gap_log = build_gap_log()

    write_docs(state_machine, route_registry, projection_bundle, event_catalog)
    write_atlas_html(state_machine, route_registry, projection_bundle, event_catalog)

    write_json("data/contracts/278_booking_intent_handoff.schema.json", booking_intent_schema)
    write_json("data/contracts/278_booking_case.schema.json", booking_case_schema)
    write_json("data/contracts/278_search_policy.schema.json", search_policy_schema)
    write_json("data/contracts/278_booking_case_state_machine.json", state_machine)
    write_text("data/contracts/278_patient_booking_route_family_registry.yaml", to_yaml(route_registry))
    write_json("data/contracts/278_patient_appointment_projection_bundle.json", projection_bundle)
    write_json("data/contracts/278_booking_case_event_catalog.json", event_catalog)
    write_json("data/analysis/278_visual_reference_notes.json", REFERENCE_NOTES)
    write_csv(
        "data/analysis/278_booking_case_transition_matrix.csv",
        booking_case_transition_matrix_rows(),
        [
            "transitionId",
            "fromState",
            "toState",
            "predicateId",
            "controllingObject",
            "ownerTask",
            "sourceRef",
            "predicate",
        ],
    )
    write_csv(
        "data/analysis/278_route_and_projection_matrix.csv",
        route_projection_matrix_rows(),
        [
            "routeId",
            "path",
            "projectionRef",
            "transitionType",
            "historyPolicy",
            "dominantAction",
            "supportedStates",
            "surfaceStates",
            "sameShell",
        ],
    )
    write_json("data/analysis/278_booking_case_gap_log.json", gap_log)
    write_json("data/analysis/PHASE4_INTERFACE_GAP_BOOKING_CASE_KERNEL.json", {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "contractVersion": CONTRACT_VERSION,
        "gaps": INTERFACE_GAPS,
    })


if __name__ == "__main__":
    main()
