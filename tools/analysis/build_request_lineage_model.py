#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

PRODUCT_SCOPE_PATH = DATA_DIR / "product_scope_matrix.json"
SUMMARY_CONFLICTS_PATH = DATA_DIR / "summary_conflicts.json"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
SHELL_MAP_PATH = DATA_DIR / "shell_ownership_map.json"
REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
CONFORMANCE_SEED_PATH = DATA_DIR / "cross_phase_conformance_seed.json"

TRANSITIONS_JSON_PATH = DATA_DIR / "request_lineage_transitions.json"
ENDPOINT_MATRIX_CSV_PATH = DATA_DIR / "endpoint_matrix.csv"
PATIENT_ACTION_CSV_PATH = DATA_DIR / "patient_action_route_binding.csv"
EXTERNAL_TOUCHPOINT_CSV_PATH = DATA_DIR / "external_touchpoint_matrix.csv"

LINEAGE_MODEL_DOC_PATH = DOCS_DIR / "05_request_lineage_model.md"
STATE_AXES_DOC_PATH = DOCS_DIR / "05_request_lineage_state_axes.md"
ENDPOINT_MATRIX_DOC_PATH = DOCS_DIR / "05_endpoint_matrix.md"
TRANSITION_RULES_DOC_PATH = DOCS_DIR / "05_transition_and_guard_rules.md"
PATIENT_ACTION_DOC_PATH = DOCS_DIR / "05_patient_action_to_route_binding_matrix.md"
EXTERNAL_TOUCHPOINT_DOC_PATH = DOCS_DIR / "05_external_touchpoint_matrix.md"
GAP_REPORT_DOC_PATH = DOCS_DIR / "05_lineage_gap_report.md"
REQUEST_SEQUENCE_MMD_PATH = DOCS_DIR / "05_request_lineage_sequence.mmd"
ENDPOINT_STATE_MACHINE_MMD_PATH = DOCS_DIR / "05_endpoint_state_machine.mmd"

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "phase-3-the-human-checkpoint.md / phase-4-the-booking-engine.md / phase-5-the-network-horizon.md / phase-6-the-pharmacy-loop.md",
    "callback-and-clinician-messaging-loop.md / self-care-content-and-admin-resolution-blueprint.md / patient-portal-experience-architecture-blueprint.md / staff-operations-and-support-blueprint.md",
    "phase-cards.md",
    "vecells-complete-end-to-end-flow.md",
    "forensic-audit-findings.md",
    "blueprint-init.md",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n")


def flatten(value: Any) -> str:
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def md_cell(value: Any) -> str:
    if isinstance(value, list):
        return "<br>".join(str(item) for item in value) if value else ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    separator_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    body_rows = ["| " + " | ".join(md_cell(cell) for cell in row) + " |" for row in rows]
    return "\n".join([header_row, separator_row, *body_rows])


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: flatten(row.get(field, "")) for field in fieldnames})


STATE_AXES = [
    {
        "axis_id": "submission_envelope_state",
        "governing_object": "SubmissionEnvelope.state",
        "allowed_values": [
            "draft",
            "evidence_pending",
            "ready_to_promote",
            "promoted",
            "abandoned",
            "expired",
        ],
        "transition_law": "Draft and pre-promotion lifecycle stays on SubmissionEnvelope; request draft state is forbidden.",
        "why_it_is_orthogonal": "Envelope capture, expiry, and recovery must not be collapsed into canonical request workflow milestones.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#15. Downstream conformance requirements",
            "blueprint-init.md#3. The canonical request model",
            "forensic-audit-findings.md#Finding 09 - Upload and audio quarantine rules were absent",
        ],
    },
    {
        "axis_id": "workflow_state",
        "governing_object": "Request.workflowState",
        "allowed_values": [
            "submitted",
            "intake_normalized",
            "triage_ready",
            "triage_active",
            "handoff_active",
            "outcome_recorded",
            "closed",
        ],
        "transition_law": "Only LifecycleCoordinator derives cross-domain milestone change and closure; child domains emit milestones and blockers only.",
        "why_it_is_orthogonal": "Booking ambiguity, pharmacy reconciliation, duplicate review, repair, and confirmation gates are blocker facts, not workflow states.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
            "phase-0-the-foundation-protocol.md#Canonical request model",
            "blueprint-init.md#3. The canonical request model",
            "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly",
        ],
    },
    {
        "axis_id": "safety_state",
        "governing_object": "Request.safetyState",
        "allowed_values": [
            "not_screened",
            "screen_clear",
            "residual_risk_flagged",
            "urgent_diversion_required",
            "urgent_diverted",
        ],
        "transition_law": "urgent_diversion_required and urgent_diverted are separate durable states; diversion is complete only after UrgentDiversionSettlement.",
        "why_it_is_orthogonal": "Urgent issuance proof must survive queueing, repair, and fallback without pretending that urgent-required already means urgent-settled.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#15. Downstream conformance requirements",
            "phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm",
            "blueprint-init.md#3. The canonical request model",
            "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
        ],
    },
    {
        "axis_id": "identity_state",
        "governing_object": "Request.identityState",
        "allowed_values": [
            "anonymous",
            "partial_match",
            "matched",
            "claimed",
        ],
        "transition_law": "patientRef is nullable and must be derived from governed IdentityBinding; wrong-patient correction must enter IdentityRepairCase.",
        "why_it_is_orthogonal": "Identity hold and correction are lineage-level blocker facts and must never be smuggled into workflow or child-case status fields.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#5 Identity binding",
            "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated patientRef as unconditional",
        ],
    },
]

ORTHOGONAL_BLOCKERS = [
    {
        "blocker_id": "blk_lifecycle_lease_and_stale_owner",
        "blocker_class": "Active or broken lease / stale-owner recovery",
        "canonical_objects": [
            "RequestLifecycleLease",
            "ReviewActionLease",
            "StaleOwnershipRecoveryRecord",
        ],
        "closure_rule": "Any active, releasing, broken, or unremediated expired lease blocks closure and writable calmness.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#LifecycleCoordinator close evaluation",
            "phase-3-the-human-checkpoint.md#RequestLifecycleLease and stale-owner recovery rules",
        ],
    },
    {
        "blocker_id": "blk_duplicate_review",
        "blocker_class": "Duplicate review still unresolved",
        "canonical_objects": [
            "DuplicateCluster",
            "DuplicateResolutionDecision",
        ],
        "closure_rule": "same_episode_candidate and review_required duplicate work remain explicit review blockers; silent merge is forbidden.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
            "phase-1-the-red-flag-gate.md#Duplicate handling",
            "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
        ],
    },
    {
        "blocker_id": "blk_fallback_review",
        "blocker_class": "Fallback review still open",
        "canonical_objects": [
            "FallbackReviewCase",
        ],
        "closure_rule": "Artifact quarantine, degraded receipt, or manual safety fallback remain closure blockers until governed review settles.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
            "vecells-complete-end-to-end-flow.md#Unified Intake, Identity, Evidence, and Safety",
            "forensic-audit-findings.md#Finding 58 - RequestClosureRecord omitted fallback-review blockers",
        ],
    },
    {
        "blocker_id": "blk_identity_repair",
        "blocker_class": "Identity hold or wrong-patient correction",
        "canonical_objects": [
            "IdentityRepairCase",
            "IdentityRepairFreezeRecord",
            "IdentityRepairReleaseSettlement",
        ],
        "closure_rule": "PHI-bearing work freezes while IdentityRepairCase is active; closure requires release settlement or governed compensation.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "forensic-audit-findings.md#Finding 59 - RequestClosureRecord omitted identity-repair blockers",
        ],
    },
    {
        "blocker_id": "blk_reachability_and_route_repair",
        "blocker_class": "Reachability dependency or contact-route repair still unresolved",
        "canonical_objects": [
            "ReachabilityDependency",
            "ReachabilityAssessmentRecord",
            "ContactRouteRepairJourney",
        ],
        "closure_rule": "Broken callback, message, reminder, booking, hub, or pharmacy reachability keeps the lineage in repair posture until rebound proof exists.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.9 ReachabilityDependency",
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
        ],
    },
    {
        "blocker_id": "blk_external_confirmation_and_reconciliation",
        "blocker_class": "External confirmation or reconciliation still unresolved",
        "canonical_objects": [
            "ExternalConfirmationGate",
            "BookingConfirmationTruthProjection",
            "HubOfferToConfirmationTruthProjection",
            "PharmacyDispatchAttempt",
        ],
        "closure_rule": "Ambiguous booking, hub, or pharmacy dispatch truth blocks closure until the current gate clears or policy downgrades it to a non-closure operational debt.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Booking, hub, and pharmacy continuity algorithm",
            "phase-4-the-booking-engine.md#Booking confirmation and reconciliation",
            "phase-5-the-network-horizon.md#Hub commit algorithm",
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "forensic-audit-findings.md#Finding 67 - event catalogue lacked external confirmation-gate lifecycle events",
        ],
    },
    {
        "blocker_id": "blk_more_info_and_pending_assimilation",
        "blocker_class": "More-info cycle or accepted response still pending assimilation",
        "canonical_objects": [
            "MoreInfoReplyWindowCheckpoint",
            "MoreInfoResponseDisposition",
            "EvidenceAssimilationRecord",
            "MaterialDeltaAssessment",
        ],
        "closure_rule": "Any cycle in open, reminder_due, or late_review posture, or any accepted response pending assimilation or safety settlement, blocks closure.",
        "source_refs": [
            "phase-3-the-human-checkpoint.md#MoreInfoCycle",
            "phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object",
            "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
        ],
    },
    {
        "blocker_id": "blk_phi_grants_and_release_freeze",
        "blocker_class": "PHI-bearing grant, release, or visibility tuple drift",
        "canonical_objects": [
            "AccessGrantScopeEnvelope",
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "AudienceSurfaceRuntimeBinding",
        ],
        "closure_rule": "Writable PHI-bearing grants and release tuples must either remain valid for the open path or be superseded into governed recovery before closure settles.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            "phase-0-the-foundation-protocol.md#Closure evaluation",
            "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
        ],
    },
]

LINEAGE_STAGES = [
    {
        "stage_id": "stage_01_entry_channels",
        "order": 1,
        "stage_name": "Entry channels",
        "governing_objects": [
            "SubmissionIngressRecord",
            "IntakeConvergenceContract",
            "CallSession",
        ],
        "trigger_conditions": [
            "Patient starts on web",
            "Patient calls phone or IVR",
            "Secure-link continuation resumes accepted progress",
            "Support-assisted capture re-enters the same lineage",
        ],
        "durable_records": [
            "SubmissionIngressRecord",
            "transportCorrelationId",
            "sourceLineageRef",
        ],
        "control_records": [
            "channelCapabilityCeiling",
            "contactAuthorityClass",
            "receiptConsistencyKey",
        ],
        "patient_effect": "One intake lineage regardless of channel; phone and digital paths do not fork into separate back-office systems.",
        "staff_effect": "Support-assisted capture remains an ingress variant, not a hidden operational product.",
        "blockers_and_guards": [
            "Channel and grant posture must validate before writable continuation",
            "Wrong-lane or frozen-channel resumes fail to governed recovery",
        ],
        "degraded_behavior": "Telephony degradation, continuation challenge, or manual-only disposition stay on the same intake lineage.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#4. Canonical ingest and request promotion",
            "phase-2-identity-and-echoes.md#Telephony continuation and evidence readiness",
            "vecells-complete-end-to-end-flow.md#All User Entry Channels",
        ],
    },
    {
        "stage_id": "stage_02_identity_and_access_resolution",
        "order": 2,
        "stage_name": "Auth, claim, and identity resolution",
        "governing_objects": [
            "IdentityBinding",
            "SessionEstablishmentDecision",
            "AccessGrantRedemptionRecord",
            "TelephonyContinuationContext",
        ],
        "trigger_conditions": [
            "Authenticated browser entry",
            "Secure-link redemption",
            "Telephony verification or challenge",
            "Support-guided claim or resume",
        ],
        "durable_records": [
            "IdentityBinding",
            "Session",
            "PostAuthReturnIntent",
        ],
        "control_records": [
            "subjectBindingVersion",
            "sessionEpoch",
            "routeAuthorityState",
            "AccessGrantSupersessionRecord",
        ],
        "patient_effect": "Claim, step-up, and resume are governed; auth never stands in for writable claim or consent.",
        "staff_effect": "Identity contradictions become explicit repair work rather than silent patientRef mutation.",
        "blockers_and_guards": [
            "Wrong-patient suspicion opens IdentityRepairCase",
            "Stale binding or session drift returns recovery-only posture",
        ],
        "degraded_behavior": "manual_only or recovery_only posture preserves the active lineage anchor without granting unsafe writes.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#5 Identity binding",
            "phase-2-identity-and-echoes.md#Session and continuation contracts",
            "blueprint-init.md#10. Identity, consent, security, and policy",
        ],
    },
    {
        "stage_id": "stage_03_durable_submission_envelope",
        "order": 3,
        "stage_name": "Durable SubmissionEnvelope or call-session shell",
        "governing_objects": [
            "SubmissionEnvelope",
            "DraftSessionLease",
            "DraftRecoveryRecord",
            "CallSession",
        ],
        "trigger_conditions": [
            "Accepted intake progress exists but governed submit has not yet promoted a Request",
        ],
        "durable_records": [
            "SubmissionEnvelope",
            "MutationSettlement",
            "DraftRecoveryRecord",
        ],
        "control_records": [
            "releaseApprovalFreezeRef",
            "channelReleaseFreezeState",
            "sessionEpochRef",
            "manifestVersionRef",
        ],
        "patient_effect": "The same envelope survives reload, challenge, and continuation without becoming a draft Request.",
        "staff_effect": "Support can see or assist the same envelope lineage without inventing a second capture store.",
        "blockers_and_guards": [
            "Expired lease or superseded grant opens governed recovery",
            "Embedded or route freeze posture blocks writable resume",
        ],
        "degraded_behavior": "Expired or abandoned envelopes create DraftRecoveryRecord rather than silent loss of progress.",
        "source_refs": [
            "phase-1-the-red-flag-gate.md#SubmissionEnvelope and resume rules",
            "phase-0-the-foundation-protocol.md#Canonical ingest and request promotion",
            "forensic-audit-findings.md#Finding 09 - Upload and audio quarantine rules were absent",
        ],
    },
    {
        "stage_id": "stage_04_evidence_capture_and_quarantine",
        "order": 4,
        "stage_name": "Evidence capture, readiness, and quarantine",
        "governing_objects": [
            "EvidenceReadinessAssessment",
            "Artifact quarantine",
            "FallbackReviewCase",
            "TelephonyTranscriptReadinessRecord",
        ],
        "trigger_conditions": [
            "Patient or staff adds upload, audio, transcript, or post-submit evidence",
        ],
        "durable_records": [
            "capture bundle",
            "artifact quarantine record",
            "TelephonyManualReviewDisposition",
        ],
        "control_records": [
            "malware scan outcome",
            "evidenceReadinessState",
            "transport parity witness",
        ],
        "patient_effect": "Unsafe or unreadable evidence still yields governed degraded receipt instead of vanishing.",
        "staff_effect": "Manual review or quarantine work is explicit and traceable.",
        "blockers_and_guards": [
            "Unreadable or unsafe evidence must not silently promote",
            "urgent-live without routine evidence routes to fallback or urgent path",
        ],
        "degraded_behavior": "FallbackReviewCase holds degraded acceptance, manual safety review, and the SLA anchor.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
            "vecells-complete-end-to-end-flow.md#Unified Intake, Identity, Evidence, and Safety",
            "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
        ],
    },
    {
        "stage_id": "stage_05_governed_submit_and_promotion",
        "order": 5,
        "stage_name": "Governed submit and immutable promotion",
        "governing_objects": [
            "SubmissionPromotionRecord",
            "IdempotencyRecord",
            "SubmissionEnvelope",
        ],
        "trigger_conditions": [
            "Evidence is safety-usable or urgent-live eligible and submit is requested",
        ],
        "durable_records": [
            "SubmissionPromotionRecord",
            "immutable EvidenceSnapshot",
            "normalized submission payload",
        ],
        "control_records": [
            "idempotency key",
            "draft grant supersession",
            "request/status consistency keys",
        ],
        "patient_effect": "Promotion is exact-once and replays previous accepted results instead of minting duplicate requests.",
        "staff_effect": "Promotion provenance is immutable and replay-safe.",
        "blockers_and_guards": [
            "Stale lease, grant, or route tuple fails to recovery",
            "manual-only evidence cannot silently promote",
        ],
        "degraded_behavior": "Accepted retry returns prior accepted result; unsafe promotion remains blocked behind review.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Canonical ingest and request promotion",
            "phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm",
            "blueprint-init.md#3. The canonical request model",
        ],
    },
    {
        "stage_id": "stage_06_duplicate_replay_and_branching",
        "order": 6,
        "stage_name": "Replay, same-request attach, and duplicate review branching",
        "governing_objects": [
            "IdempotencyRecord",
            "DuplicatePairEvidence",
            "DuplicateResolutionDecision",
            "DuplicateCluster",
        ],
        "trigger_conditions": [
            "Promotion or return evidence matches an existing lineage or related episode candidate",
        ],
        "durable_records": [
            "DuplicateResolutionDecision",
            "DuplicateCluster(review_required)",
            "branchDecisionRef",
        ],
        "control_records": [
            "continuity witness",
            "candidate competition proof",
            "ReplayCollisionReview when divergent payloads share identifiers",
        ],
        "patient_effect": "A retry can safely collapse onto the same lineage, but near-equal candidates cannot disappear into silent merge.",
        "staff_effect": "Review-required duplicate work appears explicitly in triage and closure blocker views.",
        "blockers_and_guards": [
            "same_episode_candidate never auto-attaches",
            "DuplicateCluster(review_required) blocks closure until resolved",
        ],
        "degraded_behavior": "Divergent replay opens review instead of creating a calm success or hidden second write.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
            "phase-1-the-red-flag-gate.md#Duplicate handling",
            "blueprint-init.md#8. Operations, control, and orchestration",
        ],
    },
    {
        "stage_id": "stage_07_request_creation_and_normalization",
        "order": 7,
        "stage_name": "Canonical Request creation and normalization",
        "governing_objects": [
            "Request",
            "RequestLineage",
            "PatientJourneyLineage",
            "SubmissionPromotionRecord",
        ],
        "trigger_conditions": [
            "Promotion resolves to a new lineage rather than prior accepted replay or same-request attach",
        ],
        "durable_records": [
            "Request",
            "RequestLineage",
            "PatientJourneyLineage",
        ],
        "control_records": [
            "requestLineageRef",
            "latestLineageCaseLinkRef",
            "currentIdentityBindingRef",
        ],
        "patient_effect": "Patient receipt and later continuity bind to one canonical request lineage.",
        "staff_effect": "The queue sees milestone state only; child detail stays off Request.workflowState.",
        "blockers_and_guards": [
            "workflowState stays milestone-only",
            "patientRef remains derived from IdentityBinding",
        ],
        "degraded_behavior": "If ingest or normalization cannot produce routine truth, the lineage stays in fallback or repair instead of partial request creation.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Canonical request model",
            "phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "blueprint-init.md#3. The canonical request model",
        ],
    },
    {
        "stage_id": "stage_08_safety_and_urgent_diversion",
        "order": 8,
        "stage_name": "Safety screening and urgent diversion",
        "governing_objects": [
            "SafetyDecisionRecord",
            "UrgentDiversionSettlement",
            "ReachabilityDependency",
        ],
        "trigger_conditions": [
            "Routine promotion completes",
            "Material delta or contact-safety relevant evidence enters",
        ],
        "durable_records": [
            "SafetyDecisionRecord",
            "SafetyPreemptionRecord when required",
            "UrgentDiversionSettlement",
        ],
        "control_records": [
            "requestedSafetyState",
            "resultingSafetyEpoch",
            "activeReachabilityDependencyRefs",
        ],
        "patient_effect": "Urgent guidance appears as a durable urgent branch, not as a transient pre-submit warning.",
        "staff_effect": "Residual-risk and urgent-required posture remains explicit in queue and review ranking.",
        "blockers_and_guards": [
            "urgent_diversion_required and urgent_diverted are separate durable states",
            "Engine failure or degraded evidence routes to fallback review",
        ],
        "degraded_behavior": "Routine flow halts until urgent settlement or fallback review settles.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Safety algorithm",
            "phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm",
            "blueprint-init.md#3. The canonical request model",
        ],
    },
    {
        "stage_id": "stage_09_triage_task_creation_and_queue_entry",
        "order": 9,
        "stage_name": "Triage task creation and queue entry",
        "governing_objects": [
            "TriageTask",
            "RequestLifecycleLease",
            "QueueRankSnapshot",
        ],
        "trigger_conditions": [
            "Safety settles to screen_clear or residual_risk_flagged",
        ],
        "durable_records": [
            "TriageTask",
            "QueueRankSnapshot",
            "RequestLifecycleLease",
        ],
        "control_records": [
            "priorityBand",
            "fairness floor",
            "residual-risk rule IDs",
        ],
        "patient_effect": "One receipt and ETA emerge from canonical queueing rather than dashboard-only ordering.",
        "staff_effect": "Queue rank, fairness, and reviewer-fit suggestions stay deterministic and auditable.",
        "blockers_and_guards": [
            "Queue order comes from QueueRankPlan and QueueRankSnapshot",
            "Triage task ownership is lease-fenced",
        ],
        "degraded_behavior": "Stale owner or broken lease opens stale-owner recovery instead of silent queue reset.",
        "source_refs": [
            "phase-3-the-human-checkpoint.md#Queue and ownership rules",
            "blueprint-init.md#8. Operations, control, and orchestration",
            "vecells-complete-end-to-end-flow.md#Triage, Review, and Reopen",
        ],
    },
    {
        "stage_id": "stage_10_triage_review_more_info_and_approval",
        "order": 10,
        "stage_name": "Triage review, more-info, supersession, and approval",
        "governing_objects": [
            "ReviewSession",
            "MoreInfoCycle",
            "MoreInfoReplyWindowCheckpoint",
            "DecisionEpoch",
            "ApprovalCheckpoint",
        ],
        "trigger_conditions": [
            "Reviewer claims live triage work",
            "Need for more evidence or approval emerges",
        ],
        "durable_records": [
            "ReviewBaselineSnapshot",
            "MoreInfoCycle",
            "MoreInfoResponseDisposition",
            "DecisionSupersessionRecord",
            "ApprovalEvidenceBundle",
        ],
        "control_records": [
            "reviewVersionRef",
            "ownershipEpoch",
            "fencingToken",
            "current DecisionEpoch",
        ],
        "patient_effect": "More-info, secure-link resume, late reply, expiry, and same-shell recovery all derive from one checkpoint.",
        "staff_effect": "Superseded judgment context stays visible; stale reviews fail closed into bounded recovery.",
        "blockers_and_guards": [
            "Exactly one actionable MoreInfoCycle per lineage at a time",
            "Late, superseded, duplicate, expired, and blocked-repair replies are explicit dispositions",
            "Approval is bound to DecisionEpoch, not generic task state",
        ],
        "degraded_behavior": "Delivery failure or route invalidation routes to controlled repair or callback fallback, never silent close.",
        "source_refs": [
            "phase-3-the-human-checkpoint.md#MoreInfoCycle",
            "phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object",
            "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
            "forensic-audit-findings.md#Finding 21 - Human approval boundary was too coarse",
        ],
    },
    {
        "stage_id": "stage_11_endpoint_decision_and_launch",
        "order": 11,
        "stage_name": "Endpoint decision, direct outcome, or downstream child-case launch",
        "governing_objects": [
            "EndpointDecision",
            "DecisionEpoch",
            "EndpointDecisionSettlement",
            "LineageCaseLink",
        ],
        "trigger_conditions": [
            "Current unsuperseded review snapshot is ready for endpoint commitment",
        ],
        "durable_records": [
            "EndpointDecision",
            "DecisionEpoch",
            "LineageCaseLink",
            "BookingIntent or PharmacyIntent when needed",
        ],
        "control_records": [
            "decisionEpochRef",
            "lineageFenceEpoch",
            "routeIntentTupleHash",
        ],
        "patient_effect": "Patient-facing next steps remain tied to one authoritative outcome or child-case lineage.",
        "staff_effect": "Stale downstream launch is blocked before any child service can act.",
        "blockers_and_guards": [
            "Direct self-care/admin only when the current boundary decision allows it",
            "Booking and pharmacy launches must validate current unsuperseded DecisionEpoch",
        ],
        "degraded_behavior": "Stale or superseded endpoint decisions settle stale_recoverable instead of creating hidden child work.",
        "source_refs": [
            "phase-3-the-human-checkpoint.md#EndpointDecision and DecisionEpoch",
            "phase-3-the-human-checkpoint.md#Direct outcome and downstream handoff",
            "forensic-audit-findings.md#Finding 20 - Endpoint choice lacked a durable decision object",
            "forensic-audit-findings.md#Finding 22 - Direct outcomes and downstream handoffs were collapsed",
        ],
    },
    {
        "stage_id": "stage_12_child_case_execution_and_patient_continuity",
        "order": 12,
        "stage_name": "Child-case execution, same-shell continuity, and bounded repair",
        "governing_objects": [
            "LineageCaseLink",
            "BookingCase",
            "HubCoordinationCase",
            "PharmacyCase",
            "CallbackCase",
            "ClinicianMessageThread",
            "AdminResolutionCase",
        ],
        "trigger_conditions": [
            "Direct outcome is recorded or a downstream case acknowledges ownership",
        ],
        "durable_records": [
            "child aggregate record",
            "case-local truth projection or expectation envelope",
            "current confirmation gate or blocker refs",
        ],
        "control_records": [
            "same-shell route intent",
            "continuity evidence",
            "surface route contract",
            "runtime publication tuple",
        ],
        "patient_effect": "Requests, messages, appointments, pharmacy, and recovery work stay in the same patient shell when continuity is recoverable.",
        "staff_effect": "Workspace, hub, pharmacy console, and support replay preserve anchor and causal settlement across child work.",
        "blockers_and_guards": [
            "Child aggregates own detailed lifecycle; Request.workflowState remains milestone-only",
            "Ambiguity and repair are expressed through local truth objects plus request-level blockers",
        ],
        "degraded_behavior": "Contact-route repair, identity hold, read-only provenance, and same-shell recovery replace detached error pages.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
            "patient-portal-experience-architecture-blueprint.md#Primary navigation model",
            "callback-and-clinician-messaging-loop.md#Patient conversation surface contract",
            "phase-4-the-booking-engine.md#Frontend work",
            "phase-5-the-network-horizon.md#Frontend work",
            "phase-6-the-pharmacy-loop.md#Frontend work",
        ],
    },
    {
        "stage_id": "stage_13_support_ops_and_governance_overlays",
        "order": 13,
        "stage_name": "Support replay, operations, and governance overlays",
        "governing_objects": [
            "SupportTicket",
            "SupportReplayRestoreSettlement",
            "InvestigationScopeEnvelope",
            "GovernanceReviewPackage",
        ],
        "trigger_conditions": [
            "Operator replay, resend, restore, release, or audit work touches live lineage truth",
        ],
        "durable_records": [
            "SupportMutationAttempt",
            "SupportActionSettlement",
            "InvestigationTimelineReconstruction",
        ],
        "control_records": [
            "mask scope",
            "replay checkpoint",
            "support action lease",
            "governance scope token",
        ],
        "patient_effect": "Support repair can restore the live path, but only after restore settlement proves the current tuple.",
        "staff_effect": "Observe, replay, and resend remain bounded overlays instead of hidden direct production access.",
        "blockers_and_guards": [
            "Replay mode cannot silently reopen live mutation",
            "Support resend cannot arm a second live effect while awaiting external truth",
        ],
        "degraded_behavior": "Observe-only, replay restore, or handoff posture replaces unsafe live mutation.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            "staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint-init.md#9. Support and assurance surfaces",
        ],
    },
    {
        "stage_id": "stage_14_closure_evaluation_and_reopen",
        "order": 14,
        "stage_name": "Closure evaluation, defer, or governed reopen",
        "governing_objects": [
            "LifecycleCoordinator",
            "RequestClosureRecord",
            "currentConfirmationGateRefs",
            "currentClosureBlockerRefs",
        ],
        "trigger_conditions": [
            "No open triage or child workflow claims settled outcome without open blockers",
        ],
        "durable_records": [
            "RequestClosureRecord(decision = defer | close)",
        ],
        "control_records": [
            "blockingLineageCaseLinkRefs",
            "blockingDuplicateClusterRefs",
            "blockingReconciliationRefs",
            "blockingPreemptionRefs",
        ],
        "patient_effect": "Closed is only emitted after coordinator-reviewed empty blocker set; no endpoint can quietly self-close the request.",
        "staff_effect": "Open blockers remain visible as explicit closure debt rather than implicit queue disappearance.",
        "blockers_and_guards": [
            "No active lease or stale-owner recovery",
            "No unresolved approval, ExternalConfirmationGate, DuplicateCluster, FallbackReviewCase, IdentityRepairCase, PHI-bearing grant issue, or reachability repair",
            "No LineageCaseLink remains proposed, acknowledged, active, or returned without governed settlement",
        ],
        "degraded_behavior": "Coordinator persists RequestClosureRecord(decision = defer) and preserves live blocker posture instead of forcing calm completion.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
            "phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
            "phase-3-the-human-checkpoint.md#Closure and reopen rules",
            "forensic-audit-findings.md#Finding 45 - Closure lacked a no-open-lease and no-open-exception invariant",
            "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
            "forensic-audit-findings.md#Finding 60 - RequestClosureRecord omitted PHI-grant and reachability blockers",
        ],
    },
]

CHILD_AGGREGATES = [
    {
        "aggregate_id": "agg_admin_resolution_case",
        "case_family": "admin_resolution",
        "aggregate_name": "AdminResolutionCase",
        "entry_gate": "Direct endpoint decision chooses admin_resolution under an active SelfCareBoundaryDecision.",
        "authoritative_truth": "AdminResolutionSettlement(result = completed) plus matching AdminResolutionCompletionArtifact.",
        "ambiguity_truth": "AdviceAdminDependencySet or boundary reopen flips the case to blocked, reopened, or stale_recoverable instead of quiet completion.",
        "recovery_contracts": [
            "SelfCareBoundaryDecision.reopenState",
            "AdviceAdminDependencySet",
            "TransitionEnvelope",
        ],
        "request_milestone_effect": "Direct outcome can emit outcome_recorded, but request closure still requires LifecycleCoordinator.",
        "patient_shell_continuity": "Same request shell with bounded admin follow-up, read-only provenance, or recovery in place.",
        "staff_owner_shell": "staff workspace",
        "source_refs": [
            "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
            "phase-3-the-human-checkpoint.md#Endpoint rail direct outcomes",
        ],
    },
    {
        "aggregate_id": "agg_clinician_message_thread",
        "case_family": "clinician_message",
        "aggregate_name": "ClinicianMessageThread",
        "entry_gate": "Direct endpoint decision launches clinician_message with a current unsuperseded DecisionEpoch.",
        "authoritative_truth": "MessageDeliveryEvidenceBundle and ThreadResolutionGate decide delivery, repair, callback escalation, reopen, and close.",
        "ambiguity_truth": "Delivery dispute, expiry, route repair, or pending reply review keep the thread open and block calm closure.",
        "recovery_contracts": [
            "MessageDispatchEnvelope",
            "ThreadExpectationEnvelope",
            "ThreadResolutionGate",
            "ContactRouteRepairJourney",
        ],
        "request_milestone_effect": "Thread close is local; request closure remains coordinator-owned.",
        "patient_shell_continuity": "Same patient messages cluster with read-only, repair, or awaiting-review posture.",
        "staff_owner_shell": "staff workspace / support ticket workspace",
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Clinician message domain",
            "phase-3-the-human-checkpoint.md#Callback and clinician-message endpoints",
        ],
    },
    {
        "aggregate_id": "agg_callback_case",
        "case_family": "callback",
        "aggregate_name": "CallbackCase",
        "entry_gate": "Endpoint decision, waitlist fallback, hub fallback, or controlled callback escalation creates a callback lineage branch.",
        "authoritative_truth": "CallbackOutcomeEvidenceBundle plus CallbackResolutionGate decide retry, escalation, completion, cancel, or expiry.",
        "ambiguity_truth": "No-answer, provider failure, route invalid, or stale promise leaves expectation and repair truth live; callback promise never closes on timer alone.",
        "recovery_contracts": [
            "CallbackIntentLease",
            "CallbackExpectationEnvelope",
            "CallbackResolutionGate",
            "ContactRouteRepairJourney",
        ],
        "request_milestone_effect": "Callback completion is child-case local; request closure still waits for LifecycleCoordinator and empty blockers.",
        "patient_shell_continuity": "Same messages cluster or callback child route with explicit retry / repair posture.",
        "staff_owner_shell": "staff workspace / hub desk",
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Callback domain",
            "phase-4-the-booking-engine.md#Waitlist fallback",
            "phase-5-the-network-horizon.md#No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
        ],
    },
    {
        "aggregate_id": "agg_booking_case",
        "case_family": "booking",
        "aggregate_name": "BookingCase",
        "entry_gate": "Direct endpoint decision launches BookingIntent; booking acknowledges the current proposed LineageCaseLink.",
        "authoritative_truth": "BookingConfirmationTruthProjection(confirmationTruthState = confirmed) plus AppointmentRecord are the only final booked truth.",
        "ambiguity_truth": "confirmation_pending, supplier_reconciliation_pending, or disputed supplier truth create ExternalConfirmationGate and block booked reassurance.",
        "recovery_contracts": [
            "BookingConfirmationTruthProjection",
            "ExternalConfirmationGate",
            "WaitlistFallbackObligation",
            "ContactRouteRepairJourney",
        ],
        "request_milestone_effect": "Acknowledged booking ownership moves request to handoff_active; confirmed authoritative outcome emits outcome_recorded.",
        "patient_shell_continuity": "Same appointments/manage shell; selected anchor and offer summary remain visible through pending or repair posture.",
        "staff_owner_shell": "staff workspace",
        "source_refs": [
            "phase-4-the-booking-engine.md#Booking case model and state machine",
            "phase-0-the-foundation-protocol.md#Booking, waitlist, hub, and pharmacy continuity algorithm",
        ],
    },
    {
        "aggregate_id": "agg_hub_coordination_case",
        "case_family": "hub",
        "aggregate_name": "HubCoordinationCase",
        "entry_gate": "Booking or triage fallback opens a child LineageCaseLink(caseFamily = hub) under the same request lineage.",
        "authoritative_truth": "HubOfferToConfirmationTruthProjection plus generation-bound PracticeAcknowledgementRecord govern selected, pending, booked, and closeable hub truth.",
        "ambiguity_truth": "confirmation_pending, disputed, expired offer tuples, or outstanding practice acknowledgement keep the case open and visible.",
        "recovery_contracts": [
            "AlternativeOfferSession",
            "HubFallbackRecord",
            "ExternalConfirmationGate",
            "PracticeAcknowledgementRecord",
        ],
        "request_milestone_effect": "Hub ownership keeps request handoff_active until authoritative hub outcome is recorded; request close still requires LifecycleCoordinator.",
        "patient_shell_continuity": "Same patient shell with open-choice alternatives, callback-only recovery, or return-to-practice provenance in place.",
        "staff_owner_shell": "hub desk",
        "source_refs": [
            "phase-5-the-network-horizon.md#Network coordination contract, case model, and state machine",
            "phase-5-the-network-horizon.md#No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
        ],
    },
    {
        "aggregate_id": "agg_pharmacy_case",
        "case_family": "pharmacy",
        "aggregate_name": "PharmacyCase",
        "entry_gate": "Direct endpoint decision launches PharmacyIntent and the pharmacy service acknowledges the current LineageCaseLink(caseFamily = pharmacy).",
        "authoritative_truth": "PharmacyConsentCheckpoint must be satisfied before dispatch, and PharmacyDispatchAttempt authoritativeProofRef plus PharmacyOutcomeRecord or PharmacyBounceBackRecord govern later truth.",
        "ambiguity_truth": "dispatch proof pending, outcome_reconciliation_pending, weak match, or no-contact return keep the case open and block closure.",
        "recovery_contracts": [
            "PharmacyChoiceProof",
            "PharmacyConsentCheckpoint",
            "PharmacyDispatchAttempt",
            "ExternalConfirmationGate",
            "PharmacyBounceBackRecord",
        ],
        "request_milestone_effect": "Acknowledged pharmacy ownership moves request to handoff_active; authoritative resolved outcome emits outcome_recorded.",
        "patient_shell_continuity": "Patient choice, instructions, status, consent renewal, and repair stay bounded to the same request shell.",
        "staff_owner_shell": "pharmacy console / support ticket workspace",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "phase-0-the-foundation-protocol.md#Pharmacy choice, consent, dispatch, and reconciliation algorithm",
        ],
    },
]

ENDPOINTS = [
    {
        "endpoint_id": "urgent_diversion",
        "endpoint_name": "Urgent diversion",
        "endpoint_class": "direct_outcome",
        "entry_conditions": "SafetyDecisionRecord requests urgent_diversion_required or urgent-live preemption lands before routine triage can continue.",
        "owning_aggregate": "SafetyDecisionRecord plus UrgentDiversionSettlement",
        "authoritative_success": "UrgentDiversionSettlement(settlementState = issued) and Request.safetyState = urgent_diverted.",
        "ambiguity_mode": "urgent_diversion_required remains durable until settlement proof exists; urgent-required is not equivalent to urgent-diverted.",
        "recovery_path": "FallbackReviewCase or governed urgent escalation if routine evidence is degraded; no quiet return to routine flow.",
        "patient_actionability": "Same intake or request shell morphs to urgent guidance; no ordinary self-service CTA survives the urgent branch.",
        "request_milestone_effect": "Routine path stops; canonical closure is not evaluated from the urgent branch itself.",
        "closure_rule": "No direct request closure; urgent issuance is separate from workflowState closed.",
        "external_touchpoints": [
            "ext_telephony_and_ivr_provider",
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 45",
            "Finding 57",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Safety algorithm",
            "phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm",
            "blueprint-init.md#3. The canonical request model",
        ],
    },
    {
        "endpoint_id": "degraded_acceptance_fallback_review",
        "endpoint_name": "Degraded acceptance and fallback review",
        "endpoint_class": "continuity_control",
        "entry_conditions": "Evidence is unsafe, unreadable, contradictory, urgent-live-only, or the ingest/safety chain cannot settle routine truth.",
        "owning_aggregate": "FallbackReviewCase",
        "authoritative_success": "FallbackReviewCase creation with durable degraded receipt and later governed manual disposition; no calmer success exists before that case settles.",
        "ambiguity_mode": "Receipt may be degraded, but accepted progress must remain attached to one current FallbackReviewCase instead of generic error.",
        "recovery_path": "Manual review, repaired evidence, or urgent diversion settlement re-enters the same lineage; silent discard is forbidden.",
        "patient_actionability": "Same intake or request shell shows degraded receipt, fallback review status, and safe next action.",
        "request_milestone_effect": "Request may be held before or after routine creation; closure remains blocked while FallbackReviewCase is open.",
        "closure_rule": "LifecycleCoordinator must treat open fallback review as a blocker.",
        "external_touchpoints": [
            "ext_artifact_store_and_scan",
        ],
        "audit_findings": [
            "Finding 12",
            "Finding 58",
            "Finding 61",
            "Finding 63",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
            "vecells-complete-end-to-end-flow.md#Unified Intake, Identity, Evidence, and Safety",
            "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
        ],
    },
    {
        "endpoint_id": "triage_more_info_cycle",
        "endpoint_name": "More-info cycle and patient reply return",
        "endpoint_class": "triage_child_cycle",
        "entry_conditions": "Reviewer needs more information before endpoint commitment.",
        "owning_aggregate": "MoreInfoCycle",
        "authoritative_success": "MoreInfoResponseDisposition(accepted_in_window | accepted_late_review) plus EvidenceAssimilationRecord and MaterialDeltaAssessment.",
        "ambiguity_mode": "late_review, superseded_duplicate, expired_rejected, and blocked_repair are explicit dispositions; no link TTL or client timer can infer calmer truth.",
        "recovery_path": "ContactRouteRepairJourney, callback fallback, or same-shell stale/expired recovery depending on checkpoint posture.",
        "patient_actionability": "Reply stays in the same request shell or secure-link respond-to-request mode while the checkpoint is actionable.",
        "request_milestone_effect": "Request.workflowState remains triage_active; closure is blocked while MoreInfoReplyWindowCheckpoint is open or accepted reply is pending assimilation.",
        "closure_rule": "No direct close; LifecycleCoordinator must treat open more-info or pending assimilation as blockers.",
        "external_touchpoints": [
            "ext_secure_link_and_notification_rail",
            "ext_message_delivery_provider",
        ],
        "audit_findings": [
            "Finding 18",
            "Finding 19",
            "Finding 25",
        ],
        "source_refs": [
            "phase-3-the-human-checkpoint.md#MoreInfoCycle",
            "phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object",
            "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
        ],
    },
    {
        "endpoint_id": "duplicate_review",
        "endpoint_name": "Duplicate review branch",
        "endpoint_class": "continuity_control",
        "entry_conditions": "Replay does not collapse through exact idempotency and the lineage is a same_episode_candidate or review-required duplicate.",
        "owning_aggregate": "DuplicateCluster",
        "authoritative_success": "DuplicateResolutionDecision resolves same_request_attach, same_episode_link, related_episode_link, or review_required history without silent merge.",
        "ambiguity_mode": "DuplicateCluster(review_required) remains explicit review work until a human or policy-backed resolution is persisted.",
        "recovery_path": "Return to triage with preserved pairwise evidence and candidate-competition proof; no auto-attach from review-required posture.",
        "patient_actionability": "Patient surfaces show continuity-safe status but do not imply hidden attach or closure while review is open.",
        "request_milestone_effect": "Request may stay triage_ready or triage_active, but closure is blocked while DuplicateCluster(review_required) remains unresolved.",
        "closure_rule": "LifecycleCoordinator must treat unresolved duplicate review as a hard blocker.",
        "external_touchpoints": [],
        "audit_findings": [
            "Finding 57",
            "Finding 65",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
            "phase-1-the-red-flag-gate.md#Duplicate handling",
            "forensic-audit-findings.md#Finding 57 - RequestClosureRecord omitted duplicate-cluster blockers",
        ],
    },
    {
        "endpoint_id": "self_care",
        "endpoint_name": "Self-care and safety-net outcome",
        "endpoint_class": "direct_outcome",
        "entry_conditions": "Endpoint decision chooses self_care_and_safety_net and the current SelfCareBoundaryDecision stays informational_only.",
        "owning_aggregate": "SelfCareBoundaryDecision plus AdviceRenderSettlement",
        "authoritative_success": "AdviceRenderSettlement(renderState = renderable) under the current DecisionEpoch and boundaryTupleHash.",
        "ambiguity_mode": "Advice invalidation, quarantine, release freeze, or dependency reopen blocks calm render and forces recovery or clinician re-entry.",
        "recovery_path": "SelfCareExperienceProjection degrades to read-only, placeholder, or reopened clinician review in the same shell.",
        "patient_actionability": "Same request shell shows safety-net content, not a detached success page.",
        "request_milestone_effect": "Direct outcome can emit outcome_recorded; request closure still waits for LifecycleCoordinator and empty blockers.",
        "closure_rule": "No direct canonical close from advice render alone.",
        "external_touchpoints": [
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 22",
            "Finding 45",
        ],
        "source_refs": [
            "self-care-content-and-admin-resolution-blueprint.md#Self-care content governance",
            "phase-3-the-human-checkpoint.md#Endpoint rail direct outcomes",
        ],
    },
    {
        "endpoint_id": "admin_resolution",
        "endpoint_name": "Admin resolution",
        "endpoint_class": "direct_outcome_with_child_case",
        "entry_conditions": "Endpoint decision chooses admin_resolution and the current boundary stays bounded_admin_only.",
        "owning_aggregate": "AdminResolutionCase",
        "authoritative_success": "AdminResolutionSettlement(result = completed) plus AdminResolutionCompletionArtifact.",
        "ambiguity_mode": "Waiting_dependency, blocked_pending_safety, stale_recoverable, or boundary reopen keep the case live and block quiet completion.",
        "recovery_path": "AdviceAdminDependencySet or SelfCareBoundaryDecision.reopenState routes same-shell repair or clinician re-entry.",
        "patient_actionability": "Same request shell with bounded operational follow-up and explicit waiting or recovery wording.",
        "request_milestone_effect": "Outcome_recorded may be emitted once authoritative completion exists; request close still requires LifecycleCoordinator.",
        "closure_rule": "No child-domain direct closure; dependency blockers and grants remain request-level closure debt.",
        "external_touchpoints": [
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 22",
            "Finding 45",
        ],
        "source_refs": [
            "self-care-content-and-admin-resolution-blueprint.md#Admin-resolution domain",
            "phase-3-the-human-checkpoint.md#Endpoint rail direct outcomes",
        ],
    },
    {
        "endpoint_id": "clinician_messaging",
        "endpoint_name": "Clinician messaging",
        "endpoint_class": "downstream_case",
        "entry_conditions": "Endpoint decision launches clinician_message from the current unsuperseded DecisionEpoch.",
        "owning_aggregate": "ClinicianMessageThread",
        "authoritative_success": "MessageDeliveryEvidenceBundle plus ThreadResolutionGate decide delivered, repaired, escalated_to_callback, reopened, or closed truth.",
        "ambiguity_mode": "Delivery failed, disputed, expired, or awaiting_review posture remains explicit and cannot collapse into silent closure.",
        "recovery_path": "Controlled resend, channel change, attachment recovery, callback escalation, or ContactRouteRepairJourney.",
        "patient_actionability": "Same patient messages cluster keeps thread, receipts, and repair state in shell.",
        "request_milestone_effect": "Thread closure is local; request close still waits for coordinator review of blockers.",
        "closure_rule": "No message service may close the Request directly.",
        "external_touchpoints": [
            "ext_message_delivery_provider",
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 23",
            "Finding 25",
            "Finding 66",
        ],
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Clinician message domain",
            "phase-3-the-human-checkpoint.md#Callback and clinician-message endpoints",
            "forensic-audit-findings.md#Finding 23 - Clinician messaging had contradictory loop-and-close semantics",
        ],
    },
    {
        "endpoint_id": "callback",
        "endpoint_name": "Callback",
        "endpoint_class": "downstream_case",
        "entry_conditions": "Endpoint decision, waitlist fallback, or hub fallback creates a callback lineage branch.",
        "owning_aggregate": "CallbackCase",
        "authoritative_success": "CallbackOutcomeEvidenceBundle plus CallbackResolutionGate decide retry, escalate, complete, cancel, or expire truth.",
        "ambiguity_mode": "No-answer, route_invalid, provider_failure, or stale callback promise remains explicit; callback windows are expectation envelopes, not completion proof.",
        "recovery_path": "Retry, reschedule, controlled escalation, or ContactRouteRepairJourney in the same shell.",
        "patient_actionability": "Same patient messages / callback child route preserves promise, repair, and response state.",
        "request_milestone_effect": "Callback completion may settle local case truth; request closure still requires LifecycleCoordinator.",
        "closure_rule": "No callback service may close the Request directly.",
        "external_touchpoints": [
            "ext_telephony_and_ivr_provider",
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 24",
            "Finding 25",
            "Finding 66",
        ],
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Callback domain",
            "phase-3-the-human-checkpoint.md#Callback and clinician-message endpoints",
            "forensic-audit-findings.md#Finding 24 - Callback handling had contradictory loop-and-close semantics",
        ],
    },
    {
        "endpoint_id": "local_booking",
        "endpoint_name": "Local booking",
        "endpoint_class": "downstream_case",
        "entry_conditions": "Endpoint decision launches booking and provider capability resolution supports local booking.",
        "owning_aggregate": "BookingCase",
        "authoritative_success": "BookingConfirmationTruthProjection(confirmationTruthState = confirmed) plus AppointmentRecord after durable provider reference or same-commit read-after-write proof.",
        "ambiguity_mode": "confirmation_pending, supplier_reconciliation_pending, and disputed supplier truth require ExternalConfirmationGate and block booked reassurance.",
        "recovery_path": "Stay in confirmation_pending, contact repair, waitlist fallback, callback fallback, or hub transfer; never optimistic booked copy.",
        "patient_actionability": "Same appointments/manage shell preserves selected anchor and truthful pending or recovery posture.",
        "request_milestone_effect": "Booking ownership sets handoff_active; confirmed authoritative outcome can emit outcome_recorded.",
        "closure_rule": "Closure waits for LifecycleCoordinator and no unresolved confirmation gate.",
        "external_touchpoints": [
            "ext_booking_supplier_adapter",
        ],
        "audit_findings": [
            "Finding 27",
            "Finding 28",
            "Finding 29",
            "Finding 30",
            "Finding 31",
            "Finding 32",
            "Finding 72",
            "Finding 73",
            "Finding 74",
        ],
        "source_refs": [
            "phase-4-the-booking-engine.md#Booking case model and state machine",
            "phase-4-the-booking-engine.md#Commit and confirmation algorithm",
            "forensic-audit-findings.md#Finding 31 - No ambiguous confirmation or reconciliation state for bookings",
        ],
    },
    {
        "endpoint_id": "local_waitlist_continuation",
        "endpoint_name": "Local waitlist continuation",
        "endpoint_class": "downstream_case_continuation",
        "entry_conditions": "Local booking cannot immediately confirm an appointment but policy allows deadline-governed waitlist continuation.",
        "owning_aggregate": "BookingCase plus WaitlistContinuationTruthProjection",
        "authoritative_success": "WaitlistContinuationTruthProjection and WaitlistDeadlineEvaluation are the only honest current truth for waiting, offer_available, accepted_pending_booking, callback_expected, hub_review_pending, or expired posture.",
        "ambiguity_mode": "Expired or superseded offers, stale capacity truth, or overdue deadline posture must remain visible through current continuation truth rather than generic still-waiting copy.",
        "recovery_path": "WaitlistFallbackObligation routes to callback or hub when local continuation is no longer safe; no indefinite local waitlist.",
        "patient_actionability": "Same appointments shell keeps offer or preference summary visible while dominant action switches to fallback or recovery.",
        "request_milestone_effect": "Request stays handoff_active until authoritative booking or governed fallback transfer settles.",
        "closure_rule": "No closure while waitlist continuation, fallback obligation, or callback/hub transfer debt remains open.",
        "external_touchpoints": [
            "ext_booking_supplier_adapter",
        ],
        "audit_findings": [
            "Finding 33",
            "Finding 45",
        ],
        "source_refs": [
            "phase-4-the-booking-engine.md#Waitlist continuation",
            "phase-4-the-booking-engine.md#Patient waitlist truth",
            "forensic-audit-findings.md#Finding 33 - Waitlist logic lacked per-capacity exclusivity and deadline fallback",
        ],
    },
    {
        "endpoint_id": "network_hub_coordination",
        "endpoint_name": "Network / hub coordination",
        "endpoint_class": "downstream_case",
        "entry_conditions": "Local booking is unsupported, degraded, or deadline-unsafe, or triage routes directly to hub coordination.",
        "owning_aggregate": "HubCoordinationCase",
        "authoritative_success": "HubOfferToConfirmationTruthProjection(confirm = confirmed) plus current-generation PracticeAcknowledgementRecord where policy requires acknowledgement.",
        "ambiguity_mode": "Alternative offers may become expired or superseded in hub ownership, and confirmation_pending, disputed, or ack_pending posture stays explicit through the truth projection.",
        "recovery_path": "AlternativeOfferRegenerationSettlement, HubFallbackRecord(callback_request | callback_transfer | return_to_practice), or read-only provenance while stale choices are blocked.",
        "patient_actionability": "Same patient shell keeps selected offer or callback fallback visible; no detached hub patient mini-product.",
        "request_milestone_effect": "Hub ownership keeps request handoff_active until authoritative booked or returned outcome is settled.",
        "closure_rule": "Closure waits for LifecycleCoordinator and a HubOfferToConfirmationTruthProjection.closureState = closable.",
        "external_touchpoints": [
            "ext_network_booking_adapter",
            "ext_practice_ack_delivery_rail",
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 34",
            "Finding 40",
            "Finding 45",
            "Finding 67",
            "Finding 76",
        ],
        "source_refs": [
            "phase-5-the-network-horizon.md#Network coordination contract, case model, and state machine",
            "phase-5-the-network-horizon.md#Alternative offer and commit algorithms",
            "forensic-audit-findings.md#Finding 34 - Hub coordination lacked ranked patient choice, authoritative confirmation, and practice-visibility debt",
        ],
    },
    {
        "endpoint_id": "pharmacy_first_referral_loop",
        "endpoint_name": "Pharmacy First referral loop",
        "endpoint_class": "downstream_case",
        "entry_conditions": "Endpoint decision chooses pharmacy_first_candidate and a PharmacyCase acknowledges the current lineage link.",
        "owning_aggregate": "PharmacyCase",
        "authoritative_success": "PharmacyConsentCheckpoint must be satisfied before dispatch, PharmacyDispatchAttempt must hold authoritative dispatch proof, and later outcome truth must settle through PharmacyOutcomeRecord or PharmacyBounceBackRecord.",
        "ambiguity_mode": "Dispatch proof pending, outcome_reconciliation_pending, weak or unmatched outcome evidence, no_contact_return_pending, and urgent_bounce_back are explicit pharmacy-local states that must not auto-close the request.",
        "recovery_path": "Same-shell consent renewal, route repair, bounce-back reopen, urgent return, or controlled reconciliation review; no direct GP record mutation.",
        "patient_actionability": "Patient pharmacy choice, consent, instructions, and status stay inside the same patient shell while the servicing site uses the pharmacy console.",
        "request_milestone_effect": "Pharmacy ownership sets handoff_active; only authoritative resolved outcome may emit outcome_recorded.",
        "closure_rule": "No closure while consent, dispatch proof, reachability, or outcome matching remains unresolved; LifecycleCoordinator still owns close.",
        "external_touchpoints": [
            "ext_pharmacy_directory",
            "ext_pharmacy_dispatch_transport",
            "ext_pharmacy_outcome_ingest",
        ],
        "audit_findings": [
            "Finding 35",
            "Finding 36",
            "Finding 37",
            "Finding 38",
            "Finding 39",
            "Finding 40",
            "Finding 67",
            "Finding 77",
            "Finding 78",
            "Finding 79",
        ],
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "phase-0-the-foundation-protocol.md#Pharmacy choice, consent, dispatch, and reconciliation algorithm",
            "forensic-audit-findings.md#Finding 37 - Pharmacy dispatch lacked ack, retry, and expiry behavior",
        ],
    },
    {
        "endpoint_id": "patient_contact_route_repair",
        "endpoint_name": "Patient contact-route repair",
        "endpoint_class": "recovery_path",
        "entry_conditions": "Any active callback, message, reminder, waitlist, hub, pharmacy, or outcome-confirmation dependency loses trusted reachability.",
        "owning_aggregate": "ReachabilityDependency plus ContactRouteRepairJourney",
        "authoritative_success": "ContactRouteVerificationCheckpoint(rebindState = rebound) plus ReachabilityAssessmentRecord(clear, routeAuthorityState = current).",
        "ambiguity_mode": "Stale, disputed, or broken reachability posture must stay visible and cannot be inferred healthy from profile data or transport optimism.",
        "recovery_path": "Same shell morphs into ContactRouteRepairJourney with the blocked action summary still pinned in context.",
        "patient_actionability": "Always same-shell; no detached settings redirect is valid when a live lineage action is blocked.",
        "request_milestone_effect": "Repair is orthogonal blocker truth; it does not mutate workflowState directly but blocks closure and calm success.",
        "closure_rule": "LifecycleCoordinator must treat unresolved reachability repair as closure debt.",
        "external_touchpoints": [
            "ext_secure_link_and_notification_rail",
            "ext_message_delivery_provider",
            "ext_telephony_and_ivr_provider",
        ],
        "audit_findings": [
            "Finding 25",
            "Finding 60",
            "Finding 66",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Reachability repair algorithm",
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "patient-portal-experience-architecture-blueprint.md#Messages and callback continuity rules",
        ],
    },
    {
        "endpoint_id": "patient_identity_hold_recovery",
        "endpoint_name": "Patient identity hold and correction recovery",
        "endpoint_class": "recovery_path",
        "entry_conditions": "Wrong-patient, binding dispute, or subject conflict is detected on an active lineage.",
        "owning_aggregate": "IdentityRepairCase",
        "authoritative_success": "IdentityRepairReleaseSettlement plus corrected or revalidated IdentityBinding; patientRef changes only through that governed chain.",
        "ambiguity_mode": "Identity hold remains active while any branch disposition is quarantined, compensation_pending, or awaiting corrected binding.",
        "recovery_path": "Same shell shifts to PatientIdentityHoldProjection, rotates grants, and blocks PHI-bearing actions until repair settles.",
        "patient_actionability": "Same patient shell or secure-link recovery mode with explicit hold reason and next safe action.",
        "request_milestone_effect": "Identity repair is a blocker fact; it never becomes a request workflowState value.",
        "closure_rule": "No closure while IdentityRepairCase is active or PHI-bearing grants remain mismatched.",
        "external_touchpoints": [
            "ext_nhs_login",
            "ext_secure_link_and_notification_rail",
        ],
        "audit_findings": [
            "Finding 59",
            "Finding 60",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
            "blueprint-init.md#10. Identity, consent, security, and policy",
            "forensic-audit-findings.md#Finding 59 - RequestClosureRecord omitted identity-repair blockers",
        ],
    },
    {
        "endpoint_id": "support_replay_resend_restore",
        "endpoint_name": "Support replay, resend, and restore touchpoints",
        "endpoint_class": "support_overlay",
        "entry_conditions": "Support needs to replay, observe, resend, reissue, repair delivery, or restore a lineage-bound surface.",
        "owning_aggregate": "SupportTicket plus SupportReplayRestoreSettlement",
        "authoritative_success": "SupportReplayRestoreSettlement must attest the live tuple before mutation, and any resend or repair must settle through the same authoritative delivery or command chain.",
        "ambiguity_mode": "Replay drift, mask-scope drift, or awaiting_external resend posture keeps support in observe_only or read-only recovery; no hidden second effect chain is legal.",
        "recovery_path": "Stay in support replay / observe, require restore settlement, or hand off to governance or the owning live shell.",
        "patient_actionability": "Patient sees the repaired outcome only through the owning request, message, callback, booking, hub, or pharmacy shell once the canonical chain settles.",
        "request_milestone_effect": "Support can restore or repair the live path but cannot directly close or rewrite canonical request truth.",
        "closure_rule": "Support work cannot bypass LifecycleCoordinator, IdentityRepairCase, or current confirmation / reachability blockers.",
        "external_touchpoints": [
            "ext_secure_link_and_notification_rail",
            "ext_message_delivery_provider",
            "ext_telephony_and_ivr_provider",
        ],
        "audit_findings": [
            "Finding 25",
            "Finding 67",
        ],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            "staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint-init.md#9. Support and assurance surfaces",
        ],
    },
]

PATIENT_ACTIONS = [
    {
        "action_id": "action_reply_more_info",
        "patient_action": "Reply to more-info",
        "route_context": "Requests detail or secure-link respond-to-request mode in the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = respond_more_info, governingObject = MoreInfoCycle, lineageFenceEpoch, responseRouteIntentBindingRef, requestReturnBundleRef).",
        "command_semantics": "One patient reply command settles MoreInfoResponseDisposition; only accepted_in_window or accepted_late_review may mint EvidenceAssimilationRecord and MaterialDeltaAssessment.",
        "freshness_check": "Current MoreInfoReplyWindowCheckpoint must be open, reminder_due, or late_review; the cycle must still be current and unsuperseded.",
        "safety_preemption_rule": "Any potentially_clinical or contact_safety_relevant delta reruns canonical safety before routine triage resumes.",
        "recovery_behavior": "expired_rejected, superseded_duplicate, blocked_repair, or stale tuple opens same-shell recovery or ContactRouteRepairJourney; no detached link-expired success page.",
        "source_refs": [
            "phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object",
            "phase-0-the-foundation-protocol.md#RouteIntentBinding",
        ],
    },
    {
        "action_id": "action_message_reply",
        "patient_action": "Message reply",
        "route_context": "Messages cluster / thread child route inside the patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = message_reply, governingObject = ClinicianMessageThread, thread version tuple, visibility tuple, lineage fence).",
        "command_semantics": "Patient reply appends to the current thread, then settles EvidenceAssimilationRecord and any ThreadResolutionGate update under the current thread tuple.",
        "freshness_check": "ThreadExpectationEnvelope.replyCapabilityState must be live and the current RouteIntentBinding, release tuple, and continuity evidence must still match.",
        "safety_preemption_rule": "Clinically material or contact-safety-relevant replies trigger MaterialDeltaAssessment and SafetyPreemptionRecord before routine review continues.",
        "recovery_behavior": "Delivery dispute, blocked visibility, stale thread version, or route repair keeps the same cluster shell open in repair or read-only posture.",
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Clinician message domain",
            "patient-portal-experience-architecture-blueprint.md#Messages list and cluster shell",
        ],
    },
    {
        "action_id": "action_callback_response",
        "patient_action": "Callback response",
        "route_context": "Messages cluster callback child route or bounded callback-response entry in the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = callback_response, governingObject = CallbackCase, callback fence, current expectation envelope tuple).",
        "command_semantics": "The response settles against the active CallbackCase fence and updates CallbackOutcomeEvidenceBundle or CallbackResolutionGate rather than free-text local state.",
        "freshness_check": "CallbackExpectationEnvelope must still be current, writable, and bound to the same reachability and continuity tuple.",
        "safety_preemption_rule": "Any callback outcome that introduces clinically material evidence or contact-risk delta reruns canonical safety / reachability classification.",
        "recovery_behavior": "Missed window, route invalidation, or stale callback tuple falls to same-shell repair, retry, or read-only provenance.",
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Callback domain",
            "patient-portal-experience-architecture-blueprint.md#Messages and callback continuity rules",
        ],
    },
    {
        "action_id": "action_manage_appointment",
        "patient_action": "Manage appointment",
        "route_context": "Appointments manage route inside the patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = appointment_manage_mutation, governingObject = AppointmentRecord or BookingCase manage tuple, confirmation truth projection, capability lease).",
        "command_semantics": "Cancel, reschedule, callback request, or details update must settle through CommandActionRecord and current manage capability lease; local acknowledgement is never authoritative.",
        "freshness_check": "BookingConfirmationTruthProjection must still permit manage posture and the capability set must be live, not stale, blocked, or expired.",
        "safety_preemption_rule": "Material symptom change, identity drift, or contact-risk change blocks ordinary manage posture and routes to review or repair.",
        "recovery_behavior": "pending_confirmation, read-only manage, or ContactRouteRepairJourney keeps the same appointment anchor pinned in shell.",
        "source_refs": [
            "phase-4-the-booking-engine.md#Manage appointment",
            "patient-account-and-communications-blueprint.md#Core projections",
        ],
    },
    {
        "action_id": "action_accept_waitlist_offer",
        "patient_action": "Accept waitlist offer",
        "route_context": "Appointments waitlist offer card inside the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = waitlist_offer_response, governingObject = WaitlistOffer, continuationFenceEpoch, reservation truth tuple, waitlist truth tuple).",
        "command_semantics": "Offer acceptance mutates the current WaitlistOffer and BookingCase only if the same continuation fence, reservation truth, and deadline evaluation still match.",
        "freshness_check": "Current WaitlistContinuationTruthProjection must still show offer_available and the offer must not be expired or superseded.",
        "safety_preemption_rule": "If new evidence or contact-risk change threatens the live dependency, acceptance is blocked and the case reroutes to repair or review.",
        "recovery_behavior": "Expired, superseded, or fallback_due waitlist posture switches the same shell to callback or hub fallback instead of pretending the offer is still live.",
        "source_refs": [
            "phase-4-the-booking-engine.md#Waitlist continuation",
            "phase-0-the-foundation-protocol.md#Waitlist continuity algorithm",
        ],
    },
    {
        "action_id": "action_accept_decline_network_alternative",
        "patient_action": "Accept or decline network alternative",
        "route_context": "Patient appointments / request-detail hub alternative card, still inside the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = network_offer_response, governingObject = AlternativeOfferSession, offerFenceEpoch, truthTupleHash, visibleOfferSetHash).",
        "command_semantics": "Accept, decline, or callback-request settles against the live AlternativeOfferSession and HubOfferToConfirmationTruthProjection, not browser-local ranking state.",
        "freshness_check": "Access grant, subject binding, release tuple, offerFenceEpoch, and current truthTupleHash must all still match.",
        "safety_preemption_rule": "If clinical slack or newer evidence invalidates the current offer set, mutation freezes and the case regenerates or falls back before acceptance can continue.",
        "recovery_behavior": "Expired or superseded offer sets stay visible as read-only provenance while callback-only recovery or regenerated alternatives take over in shell.",
        "source_refs": [
            "phase-5-the-network-horizon.md#Alternative offers and patient choice",
            "phase-5-the-network-horizon.md#No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics",
        ],
    },
    {
        "action_id": "action_pharmacy_choice",
        "patient_action": "Pharmacy choice",
        "route_context": "Patient pharmacy child route (/pharmacy/:pharmacyCaseId/choose) inside the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = pharmacy_choice, governingObject = PharmacyChoiceSession, choice proof tuple, provider selection binding, lineage fence).",
        "command_semantics": "Patient selection commits against the current PharmacyChoiceSession, PharmacyChoiceProof, and selectionBindingHash; stale recommendations cannot mutate current provider choice.",
        "freshness_check": "Choice session, visible choice set hash, provider capability snapshot, and continuity tuple must still be current and unsuperseded.",
        "safety_preemption_rule": "Timing guardrail drift, new symptoms, or wrong-patient hold block selection and return the case to repair or clinician review.",
        "recovery_behavior": "Expired or superseded choice sets reopen same-shell re-selection or recovery; suppressed unsafe providers never become silently selectable.",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "phase-0-the-foundation-protocol.md#Pharmacy choice, consent, dispatch, and reconciliation algorithm",
        ],
    },
    {
        "action_id": "action_pharmacy_consent",
        "patient_action": "Pharmacy consent",
        "route_context": "Patient pharmacy child route (/pharmacy/:pharmacyCaseId/instructions or /status) inside the same patient shell.",
        "route_intent_binding": "RouteIntentBinding(actionScope = pharmacy_consent, governingObject = PharmacyConsentCheckpoint, selected provider tuple, pathway, scope, package fingerprint, lineage fence).",
        "command_semantics": "Consent capture or renewal creates PharmacyConsentRecord and refreshes PharmacyConsentCheckpoint; dispatch is illegal until the refreshed checkpoint is satisfied.",
        "freshness_check": "Current provider, pathway, scope, package fingerprint, and selection binding must still match the latest consent checkpoint and choice proof.",
        "safety_preemption_rule": "Material evidence drift, identity repair, or reachability failure freezes calm instructions and reroutes the shell to renewal or repair.",
        "recovery_behavior": "renewal_required, withdrawn, revoked_post_dispatch, or recovery_required posture stays same-shell and blocks dispatch until revalidated.",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "phase-0-the-foundation-protocol.md#Pharmacy consent checkpoint",
        ],
    },
    {
        "action_id": "action_contact_route_repair",
        "patient_action": "Contact-route repair",
        "route_context": "Same current patient shell through ContactRouteRepairJourney.",
        "route_intent_binding": "RouteIntentBinding(actionScope = contact_route_repair, governingObject = ContactRouteRepairJourney, bound ReachabilityDependency, reachabilityEpoch, parent route tuple).",
        "command_semantics": "Repair updates the governed contact route and verification checkpoint for the live dependency instead of writing profile state as if the blocked action had already succeeded.",
        "freshness_check": "The current ReachabilityAssessmentRecord must still show blocked, disputed, or stale posture for the same dependency and reachabilityEpoch.",
        "safety_preemption_rule": "A dependency-triggered contact change is contact_safety_relevant whenever it threatens callback, message, waitlist, pharmacy, or other active continuity promises.",
        "recovery_behavior": "The blocked action summary remains pinned in shell until ContactRouteVerificationCheckpoint.rebindState = rebound and reachability clears.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Reachability repair algorithm",
            "patient-portal-experience-architecture-blueprint.md#Messages and callback continuity rules",
        ],
    },
    {
        "action_id": "action_identity_correction_recovery",
        "patient_action": "Identity correction or recovery",
        "route_context": "Same current patient shell via PatientIdentityHoldProjection, or secure-link recovery when the current shell can no longer remain writable.",
        "route_intent_binding": "RouteIntentBinding(actionScope = identity_correction_or_claim_resume, governingObject = IdentityRepairCase, frozenIdentityBindingRef, subjectBindingVersion, lineage fence).",
        "command_semantics": "Correction, claim, or release proceeds only through IdentityRepairCase, IdentityBinding, and IdentityRepairReleaseSettlement; patientRef is never overwritten in place.",
        "freshness_check": "The current active IdentityRepairCase and binding tuple must still match; stale grant redemption cannot bypass identity hold.",
        "safety_preemption_rule": "While identity repair is active, PHI-bearing actions remain blocked and any new evidence is classified against the frozen binding until release or compensation.",
        "recovery_behavior": "Same-shell identity-hold messaging, grant rotation, and bounded recovery persist until IdentityRepairReleaseSettlement attests the corrected lineage.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase",
            "blueprint-init.md#10. Identity, consent, security, and policy",
        ],
    },
]

EXTERNAL_TOUCHPOINTS = [
    {
        "touchpoint_id": "ext_nhs_login",
        "lineage_area": "Identity, claim, and authenticated return",
        "dependency_name": "NHS login rail",
        "interaction_purpose": "Authenticate or step up the patient before writable portal or recovery actions continue.",
        "required_proof": "SessionEstablishmentDecision plus current Session and IdentityBinding tuple.",
        "ambiguity_mode": "Expired auth, stale subject binding, or claim_pending means read-only or recovery-only posture, not writable success.",
        "degraded_fallback": "Secure-link continuation or bounded recovery without pretending the user is already claimed.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-2-identity-and-echoes.md#Session and continuation contracts",
            "product_scope_matrix.json#cap_identity_binding_and_session_authority",
        ],
    },
    {
        "touchpoint_id": "ext_secure_link_and_notification_rail",
        "lineage_area": "Receipt, more-info, callback expectation, route repair, and continuity prompts",
        "dependency_name": "Secure-link and notification delivery rail",
        "interaction_purpose": "Deliver secure links, receipts, more-info prompts, callback notices, repair prompts, and controlled patient notifications.",
        "required_proof": "AdapterDispatchAttempt and AdapterReceiptCheckpoint bound to the current grant, route intent, and visibility tuple.",
        "ambiguity_mode": "Transport accepted is not delivery truth; bounced, disputed, or expired sends remain explicit repair posture.",
        "degraded_fallback": "Same-shell degraded receipt, controlled resend, or support repair; no silent reminder drift.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Command and adapter effect ledger",
            "callback-and-clinician-messaging-loop.md#Delivery, callback-window, and settlement confidence model",
        ],
    },
    {
        "touchpoint_id": "ext_telephony_and_ivr_provider",
        "lineage_area": "Phone intake, telephony callback, and urgent live handling",
        "dependency_name": "Telephony and IVR provider",
        "interaction_purpose": "Capture call ingress, callback attempts, voicemail, and live urgent handling.",
        "required_proof": "CallbackAttemptRecord or telephony ingress record linked to AdapterReceiptCheckpoint and outcome evidence.",
        "ambiguity_mode": "Duplicate dial outcomes, missing route evidence, or provider failure stay in reconcile_required or repair posture.",
        "degraded_fallback": "Callback retry, manual review, secure-link continuation, or urgent manual escalation.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-2-identity-and-echoes.md#Telephony continuation and evidence readiness",
            "callback-and-clinician-messaging-loop.md#Callback domain",
        ],
    },
    {
        "touchpoint_id": "ext_artifact_store_and_scan",
        "lineage_area": "Evidence capture, upload quarantine, and audio/transcript handling",
        "dependency_name": "Binary artifact storage and malware / readiness processing",
        "interaction_purpose": "Persist uploads or recordings, scan, transcribe, and classify readiness before promotion or review.",
        "required_proof": "Artifact quarantine outcome, transcript readiness, and evidence-readiness record tied to the capture bundle.",
        "ambiguity_mode": "Unsafe, unsupported, unreadable, or missing artifacts cannot silently disappear or pretend to be usable.",
        "degraded_fallback": "FallbackReviewCase with degraded receipt and manual review.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
            "phase-2-identity-and-echoes.md#Telephony transcript readiness",
        ],
    },
    {
        "touchpoint_id": "ext_message_delivery_provider",
        "lineage_area": "Clinician messaging and reminder delivery",
        "dependency_name": "Asynchronous messaging delivery provider",
        "interaction_purpose": "Deliver clinician messages, reminders, and thread-linked outbound communication.",
        "required_proof": "MessageDeliveryEvidenceBundle accepted through AdapterReceiptCheckpoint for the current MessageDispatchEnvelope.",
        "ambiguity_mode": "Provider acceptance without delivery evidence stays pending, disputed, failed, or expired rather than delivered.",
        "degraded_fallback": "Controlled resend, support repair, callback escalation, or contact-route repair.",
        "scope_posture": "baseline",
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Clinician message domain",
            "phase-5-the-network-horizon.md#Reminder and communication publication",
        ],
    },
    {
        "touchpoint_id": "ext_booking_supplier_adapter",
        "lineage_area": "Local booking, confirmation, and waitlist",
        "dependency_name": "Local booking supplier adapter",
        "interaction_purpose": "Search supply, hold or select capacity, commit booking, confirm provider truth, and manage appointment mutations.",
        "required_proof": "BookingConfirmationTruthProjection with durable provider proof or same-commit read-after-write, plus any current ExternalConfirmationGate resolution.",
        "ambiguity_mode": "Async supplier acceptance, disputed callbacks, and reconciliation_required must stay explicit and block booked reassurance.",
        "degraded_fallback": "Waitlist continuation, callback fallback, hub transfer, or recovery-required posture.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-4-the-booking-engine.md#Commit and confirmation algorithm",
            "product_scope_matrix.json#cap_local_booking_orchestrator",
        ],
    },
    {
        "touchpoint_id": "ext_network_booking_adapter",
        "lineage_area": "Hub coordination and cross-site booking",
        "dependency_name": "Cross-site or hub booking adapter",
        "interaction_purpose": "Validate, re-check, and commit cross-site appointments once hub coordination selects a candidate.",
        "required_proof": "HubOfferToConfirmationTruthProjection current truth tuple plus authoritative commit / confirmation evidence.",
        "ambiguity_mode": "Pending_confirmation, disputed, expired offer tuples, or imported confirmation mismatch stay visible and block closeability.",
        "degraded_fallback": "AlternativeOfferRegenerationSettlement, callback fallback, or return_to_practice.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-5-the-network-horizon.md#Hub commit algorithm",
            "product_scope_matrix.json#cap_network_coordination_desk",
        ],
    },
    {
        "touchpoint_id": "ext_practice_ack_delivery_rail",
        "lineage_area": "Hub practice visibility and acknowledgement debt",
        "dependency_name": "Practice acknowledgement delivery rail",
        "interaction_purpose": "Send and evidence continuity messages or acknowledgement requests back to the origin practice for hub bookings.",
        "required_proof": "Current-generation PracticeAcknowledgementRecord with matching ackGeneration and truthTupleHash.",
        "ambiguity_mode": "Transport acceptance alone cannot clear practice acknowledgement debt; failed, disputed, expired, or stale-generation acks remain open.",
        "degraded_fallback": "Recovery_required visibility posture, overdue acknowledgement timers, or operational escalation without calm close.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-5-the-network-horizon.md#PracticeAcknowledgementRecord",
            "phase-5-the-network-horizon.md#Hub commit algorithm",
        ],
    },
    {
        "touchpoint_id": "ext_pharmacy_directory",
        "lineage_area": "Pharmacy provider discovery and patient choice",
        "dependency_name": "Pharmacy directory / discovery API",
        "interaction_purpose": "Find eligible pharmacies, opening posture, capability, and safe provider choice set.",
        "required_proof": "PharmacyDirectorySnapshot, provider capability snapshots, and current PharmacyChoiceProof.",
        "ambiguity_mode": "Stale capability, unsafe timing, or hidden-provider drift forces warning, suppression, or same-shell regeneration instead of fake choice certainty.",
        "degraded_fallback": "Fresh same-shell directory regeneration or clinician fallback when no safe provider remains.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "product_scope_matrix.json#cap_pharmacy_referral_dispatch_and_outcome_loop",
        ],
    },
    {
        "touchpoint_id": "ext_pharmacy_dispatch_transport",
        "lineage_area": "Pharmacy referral dispatch and proof chain",
        "dependency_name": "Pharmacy referral transport adapter",
        "interaction_purpose": "Dispatch frozen referral packages through approved transport and observe transport or provider proof.",
        "required_proof": "PharmacyDispatchAttempt.authoritativeProofRef under the active TransportAssuranceProfile and ExternalConfirmationGate.",
        "ambiguity_mode": "Transport accepted or provider accepted is not enough unless the current assurance profile says that proof class is sufficient.",
        "degraded_fallback": "Same-shell proof-pending posture, redispatch only under fresh tuple, or controlled reconciliation review.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "phase-0-the-foundation-protocol.md#Pharmacy dispatch and confirmation gate algorithm",
        ],
    },
    {
        "touchpoint_id": "ext_pharmacy_outcome_ingest",
        "lineage_area": "Pharmacy consultation outcome return",
        "dependency_name": "Structured pharmacy outcome ingest or agreed local return channel",
        "interaction_purpose": "Ingest consultation summary, bounce-back, urgent return, or no-contact outcomes back into governed GP workflow.",
        "required_proof": "PharmacyOutcomeRecord or PharmacyBounceBackRecord correlated to the current PharmacyCase and outcome matching tuple.",
        "ambiguity_mode": "Weakly matched or unmatched outcomes stay in outcome_reconciliation_pending and cannot auto-close the request.",
        "degraded_fallback": "Controlled reconciliation review, urgent bounce-back, no-contact return handling, or reachability repair.",
        "scope_posture": "baseline",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
            "forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",
        ],
    },
    {
        "touchpoint_id": "ext_embedded_host_bridge",
        "lineage_area": "Embedded patient channel parity",
        "dependency_name": "Trusted embedded host bridge",
        "interaction_purpose": "Reuse the same patient shell in an NHS App-style embedded context under manifest-pinned, bridge-negotiated controls.",
        "required_proof": "PatientEmbeddedSessionProjection plus manifest tuple and release posture.",
        "ambiguity_mode": "Embedded drift, bridge mismatch, or frozen channel posture must degrade to read-only or handoff, not silent continued writes.",
        "degraded_fallback": "Safe browser handoff or bounded recovery inside the same patient shell.",
        "scope_posture": "deferred",
        "source_refs": [
            "phase-7-the-inside-the-nhs-app.md#deferred embedded channel expansion",
            "product_scope_matrix.json#cap_nhs_app_embedded_channel",
        ],
    },
]

GAP_REGISTER = [
    {
        "item_id": "GAP_005_001",
        "kind": "GAP",
        "status": "open_bounded",
        "summary": "Public intake and telephony route URLs are still derived labels rather than published route contracts.",
        "effect_area": "Entry-channel route publishing",
        "resolution_or_risk": "This pack uses the seq_004 derived route families as continuity-safe placeholders; later frontend route-contract work must publish final URL contracts without changing shell ownership.",
        "source_refs": [
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "data/analysis/route_family_inventory.csv#rf_intake_self_service",
        ],
    },
    {
        "item_id": "ASSUMPTION_005_001",
        "kind": "ASSUMPTION",
        "status": "resolved_with_corpus_priority",
        "summary": "Patient hub alternatives live in the same patient shell and align most closely with the appointments/manage route family.",
        "effect_area": "Patient route binding for hub coordination",
        "resolution_or_risk": "Phase 5 explicitly requires the same patient shell and offer-card grammar as local booking, so the matrix binds network alternatives to the appointments/request-detail shell rather than inventing a standalone patient hub shell.",
        "source_refs": [
            "phase-5-the-network-horizon.md#Alternative offers and patient choice",
            "data/analysis/route_family_inventory.csv#rf_patient_appointments",
        ],
    },
    {
        "item_id": "GAP_005_002",
        "kind": "GAP",
        "status": "resolved_with_corpus_priority",
        "summary": "Patient pharmacy child routes are explicit in Phase 6 but were not enumerated as a separate patient route family in seq_004 inventory.",
        "effect_area": "Patient pharmacy route binding",
        "resolution_or_risk": "This task uses the Phase 6 routes `/pharmacy/:pharmacyCaseId/choose`, `/instructions`, and `/status` as bounded same-shell child routes and leaves later route-family publication as follow-on work.",
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Frontend work",
            "docs/architecture/04_shell_and_route_family_ownership.md",
        ],
    },
    {
        "item_id": "GAP_005_003",
        "kind": "GAP",
        "status": "open_bounded",
        "summary": "Generic contact-route repair entry remains parent-route-scoped rather than a published global patient URL family.",
        "effect_area": "Cross-endpoint repair routing",
        "resolution_or_risk": "The matrix encodes repair as a same-shell child contract over ContactRouteRepairJourney. Later route publication work must expose concrete paths without detaching repair from the blocked action anchor.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#Reachability repair algorithm",
            "patient-portal-experience-architecture-blueprint.md#Messages and callback continuity rules",
        ],
    },
    {
        "item_id": "GAP_005_004",
        "kind": "GAP",
        "status": "open_bounded",
        "summary": "Support resend and restore touchpoints are canonically fenced, but final operator-facing URLs and tool affordances remain later route-publication work.",
        "effect_area": "Support replay / repair UI publishing",
        "resolution_or_risk": "The canonical contract is SupportReplayRestoreSettlement plus support action leases. Later support-shell tasks must publish exact action URLs without weakening restore gates.",
        "source_refs": [
            "phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
        ],
    },
    {
        "item_id": "RISK_005_001",
        "kind": "RISK",
        "status": "open_bounded",
        "summary": "Later API and frontend work could accidentally compress ambiguous external truth back into generic success copy.",
        "effect_area": "Booking, hub, pharmacy, messaging, and callback projections",
        "resolution_or_risk": "Later tasks must preserve the named confirmation, expectation, and repair objects as the only patient-safe truth and must not shortcut them with local toasts or status enums.",
        "source_refs": [
            "forensic-audit-findings.md#Finding 31 - No ambiguous confirmation or reconciliation state for bookings",
            "forensic-audit-findings.md#Finding 37 - Pharmacy dispatch lacked ack, retry, and expiry behavior",
            "forensic-audit-findings.md#Finding 25 - Delivery receipts, bounce handling, and controlled resend were missing",
        ],
    },
]

STATE_MACHINES = [
    {
        "machine_id": "request_workflow_state",
        "governing_object": "Request.workflowState",
        "states": [
            "submitted",
            "intake_normalized",
            "triage_ready",
            "triage_active",
            "handoff_active",
            "outcome_recorded",
            "closed",
        ],
        "transitions": [
            {
                "from_state": "submitted",
                "to_state": "intake_normalized",
                "guard_rule": "Governed promotion succeeded and canonical normalization settled.",
                "proof_objects": [
                    "SubmissionPromotionRecord",
                ],
            },
            {
                "from_state": "intake_normalized",
                "to_state": "triage_ready",
                "guard_rule": "Routine request creation finished and the lineage is ready for queue entry.",
                "proof_objects": [
                    "Request",
                    "RequestLineage",
                ],
            },
            {
                "from_state": "triage_ready",
                "to_state": "triage_active",
                "guard_rule": "Triage-side RequestLifecycleLease is acquired and the task first leaves triage_ready.",
                "proof_objects": [
                    "RequestLifecycleLease",
                    "TriageTask",
                ],
            },
            {
                "from_state": "triage_active",
                "to_state": "handoff_active",
                "guard_rule": "A downstream child case acknowledges the current LineageCaseLink and the handoff milestone is emitted.",
                "proof_objects": [
                    "LineageCaseLink",
                ],
            },
            {
                "from_state": "triage_active",
                "to_state": "outcome_recorded",
                "guard_rule": "A direct authoritative outcome is recorded from the current unsuperseded DecisionEpoch.",
                "proof_objects": [
                    "EndpointDecisionSettlement",
                ],
            },
            {
                "from_state": "handoff_active",
                "to_state": "outcome_recorded",
                "guard_rule": "A child aggregate emits an authoritative outcome milestone with the required proof object.",
                "proof_objects": [
                    "BookingConfirmationTruthProjection",
                    "HubOfferToConfirmationTruthProjection",
                    "PharmacyOutcomeRecord",
                    "CallbackResolutionGate",
                    "ThreadResolutionGate",
                    "AdminResolutionSettlement",
                ],
            },
            {
                "from_state": "outcome_recorded",
                "to_state": "closed",
                "guard_rule": "LifecycleCoordinator persists RequestClosureRecord(decision = close) after all blockers clear.",
                "proof_objects": [
                    "RequestClosureRecord",
                ],
            },
        ],
        "source_refs": [
            "blueprint-init.md#3. The canonical request model",
            "phase-3-the-human-checkpoint.md#Request milestone derivation",
            "phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator",
        ],
    },
    {
        "machine_id": "request_safety_state",
        "governing_object": "Request.safetyState",
        "states": [
            "not_screened",
            "screen_clear",
            "residual_risk_flagged",
            "urgent_diversion_required",
            "urgent_diverted",
        ],
        "transitions": [
            {
                "from_state": "not_screened",
                "to_state": "screen_clear",
                "guard_rule": "Canonical safety engine settles clear_routine.",
                "proof_objects": ["SafetyDecisionRecord"],
            },
            {
                "from_state": "not_screened",
                "to_state": "residual_risk_flagged",
                "guard_rule": "Canonical safety engine settles residual_review.",
                "proof_objects": ["SafetyDecisionRecord"],
            },
            {
                "from_state": "not_screened",
                "to_state": "urgent_diversion_required",
                "guard_rule": "Canonical safety engine settles urgent_required or urgent_live.",
                "proof_objects": ["SafetyDecisionRecord"],
            },
            {
                "from_state": "urgent_diversion_required",
                "to_state": "urgent_diverted",
                "guard_rule": "UrgentDiversionSettlement is issued for the current SafetyDecisionRecord.",
                "proof_objects": ["UrgentDiversionSettlement"],
            },
        ],
        "source_refs": [
            "blueprint-init.md#3. The canonical request model",
            "phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm",
            "phase-0-the-foundation-protocol.md#Safety algorithm",
        ],
    },
    {
        "machine_id": "more_info_cycle_state",
        "governing_object": "MoreInfoCycle.state",
        "states": [
            "draft",
            "awaiting_delivery",
            "awaiting_patient_reply",
            "awaiting_late_review",
            "response_received",
            "review_resumed",
            "expired",
            "superseded",
            "cancelled",
        ],
        "transitions": [
            {
                "from_state": "draft",
                "to_state": "awaiting_delivery",
                "guard_rule": "Exactly one current cycle, checkpoint, and reminder schedule are created from authoritative server time.",
                "proof_objects": ["MoreInfoReplyWindowCheckpoint", "MoreInfoReminderSchedule"],
            },
            {
                "from_state": "awaiting_delivery",
                "to_state": "awaiting_patient_reply",
                "guard_rule": "Prompt is durably issued through the current delivery chain.",
                "proof_objects": ["CommandSettlementRecord"],
            },
            {
                "from_state": "awaiting_patient_reply",
                "to_state": "response_received",
                "guard_rule": "Current response is accepted_in_window or accepted_late_review.",
                "proof_objects": ["MoreInfoResponseDisposition"],
            },
            {
                "from_state": "awaiting_patient_reply",
                "to_state": "awaiting_late_review",
                "guard_rule": "Reply window passes into late_review without full expiry.",
                "proof_objects": ["MoreInfoReplyWindowCheckpoint"],
            },
            {
                "from_state": "awaiting_patient_reply",
                "to_state": "expired",
                "guard_rule": "Checkpoint state becomes expired or settled and policy forbids late acceptance.",
                "proof_objects": ["MoreInfoReplyWindowCheckpoint"],
            },
            {
                "from_state": "awaiting_patient_reply",
                "to_state": "superseded",
                "guard_rule": "A replacement cycle is explicitly issued and old reply grants are revoked.",
                "proof_objects": ["MoreInfoReplyWindowCheckpoint", "MoreInfoReminderSchedule"],
            },
            {
                "from_state": "response_received",
                "to_state": "review_resumed",
                "guard_rule": "Evidence assimilation and any required re-safety are settled.",
                "proof_objects": ["EvidenceAssimilationRecord", "MaterialDeltaAssessment"],
            },
        ],
        "source_refs": [
            "phase-3-the-human-checkpoint.md#MoreInfoCycle",
            "phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object",
        ],
    },
    {
        "machine_id": "callback_case_state",
        "governing_object": "CallbackCase",
        "states": [
            "created",
            "queued",
            "scheduled",
            "ready_for_attempt",
            "attempt_in_progress",
            "awaiting_outcome_evidence",
            "answered",
            "no_answer",
            "voicemail_left",
            "contact_route_repair_pending",
            "awaiting_retry",
            "escalation_review",
            "completed",
            "cancelled",
            "expired",
            "closed",
        ],
        "transitions": [
            {
                "from_state": "queued",
                "to_state": "scheduled",
                "guard_rule": "Active CallbackIntentLease still matches request ownership and route tuple.",
                "proof_objects": ["CallbackIntentLease"],
            },
            {
                "from_state": "scheduled",
                "to_state": "ready_for_attempt",
                "guard_rule": "Service window is live and ownership fence still matches.",
                "proof_objects": ["CallbackIntentLease"],
            },
            {
                "from_state": "ready_for_attempt",
                "to_state": "attempt_in_progress",
                "guard_rule": "Current attempt fence creates or reuses one CallbackAttemptRecord.",
                "proof_objects": ["CallbackAttemptRecord"],
            },
            {
                "from_state": "attempt_in_progress",
                "to_state": "awaiting_outcome_evidence",
                "guard_rule": "Provider acknowledges or the call side effect is in flight but not yet evidence-settled.",
                "proof_objects": ["AdapterReceiptCheckpoint"],
            },
            {
                "from_state": "awaiting_outcome_evidence",
                "to_state": "answered",
                "guard_rule": "Answered outcome is evidence-bound.",
                "proof_objects": ["CallbackOutcomeEvidenceBundle"],
            },
            {
                "from_state": "awaiting_outcome_evidence",
                "to_state": "no_answer",
                "guard_rule": "No-answer outcome is evidence-bound.",
                "proof_objects": ["CallbackOutcomeEvidenceBundle"],
            },
            {
                "from_state": "awaiting_outcome_evidence",
                "to_state": "contact_route_repair_pending",
                "guard_rule": "Route evidence or delivery posture proves current contact repair is required.",
                "proof_objects": ["CallbackOutcomeEvidenceBundle", "ReachabilityAssessmentRecord"],
            },
            {
                "from_state": "answered",
                "to_state": "completed",
                "guard_rule": "CallbackResolutionGate decides complete.",
                "proof_objects": ["CallbackResolutionGate"],
            },
            {
                "from_state": "no_answer",
                "to_state": "awaiting_retry",
                "guard_rule": "CallbackResolutionGate decides retry.",
                "proof_objects": ["CallbackResolutionGate"],
            },
        ],
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Callback domain",
        ],
    },
    {
        "machine_id": "clinician_message_thread_state",
        "governing_object": "ClinicianMessageThread",
        "states": [
            "drafted",
            "approved",
            "sent",
            "delivered",
            "patient_replied",
            "awaiting_clinician_review",
            "delivery_failed",
            "contact_route_repair_pending",
            "closed",
            "reopened",
        ],
        "transitions": [
            {
                "from_state": "drafted",
                "to_state": "approved",
                "guard_rule": "Approval-required content has a current ApprovalCheckpoint or equivalent approval proof.",
                "proof_objects": ["ApprovalCheckpoint"],
            },
            {
                "from_state": "approved",
                "to_state": "sent",
                "guard_rule": "Current MessageDispatchEnvelope is created under the live request and review fences.",
                "proof_objects": ["MessageDispatchEnvelope"],
            },
            {
                "from_state": "sent",
                "to_state": "delivered",
                "guard_rule": "Delivery truth is evidence-bound.",
                "proof_objects": ["MessageDeliveryEvidenceBundle"],
            },
            {
                "from_state": "sent",
                "to_state": "delivery_failed",
                "guard_rule": "Delivery failure or dispute is evidence-bound.",
                "proof_objects": ["MessageDeliveryEvidenceBundle"],
            },
            {
                "from_state": "delivery_failed",
                "to_state": "contact_route_repair_pending",
                "guard_rule": "Active reachability dependency requires repair before live send can continue.",
                "proof_objects": ["ReachabilityAssessmentRecord", "ContactRouteRepairJourney"],
            },
            {
                "from_state": "delivered",
                "to_state": "patient_replied",
                "guard_rule": "A current patient reply is accepted and correlated to the thread.",
                "proof_objects": ["EvidenceAssimilationRecord"],
            },
            {
                "from_state": "patient_replied",
                "to_state": "awaiting_clinician_review",
                "guard_rule": "Reply intake settled and the thread remains open for review.",
                "proof_objects": ["ThreadResolutionGate"],
            },
            {
                "from_state": "awaiting_clinician_review",
                "to_state": "closed",
                "guard_rule": "ThreadResolutionGate decides close and no callback escalation or repair remains.",
                "proof_objects": ["ThreadResolutionGate"],
            },
        ],
        "source_refs": [
            "callback-and-clinician-messaging-loop.md#Clinician message domain",
        ],
    },
    {
        "machine_id": "booking_case_state",
        "governing_object": "BookingCase.status",
        "states": [
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
        ],
        "transitions": [
            {
                "from_state": "handoff_received",
                "to_state": "capability_checked",
                "guard_rule": "Source DecisionEpoch and current proposed LineageCaseLink still match.",
                "proof_objects": ["BookingCase", "LineageCaseLink"],
            },
            {
                "from_state": "searching_local",
                "to_state": "offers_ready",
                "guard_rule": "Current SlotSetSnapshot and capability tuple are live.",
                "proof_objects": ["SlotSetSnapshot"],
            },
            {
                "from_state": "offers_ready",
                "to_state": "commit_pending",
                "guard_rule": "The selected candidate and reservation truth survive revalidation under the active fences.",
                "proof_objects": ["BookingTransaction", "ReservationTruthProjection"],
            },
            {
                "from_state": "commit_pending",
                "to_state": "booked",
                "guard_rule": "Authoritative provider proof or same-commit read-after-write exists.",
                "proof_objects": ["BookingConfirmationTruthProjection", "AppointmentRecord"],
            },
            {
                "from_state": "commit_pending",
                "to_state": "confirmation_pending",
                "guard_rule": "Provider acceptance is async or incomplete.",
                "proof_objects": ["ExternalConfirmationGate", "BookingConfirmationTruthProjection"],
            },
            {
                "from_state": "commit_pending",
                "to_state": "supplier_reconciliation_pending",
                "guard_rule": "Supplier truth is ambiguous or contradictory.",
                "proof_objects": ["ExternalConfirmationGate", "BookingConfirmationTruthProjection"],
            },
            {
                "from_state": "offers_ready",
                "to_state": "waitlisted",
                "guard_rule": "Policy allows local waitlist continuation.",
                "proof_objects": ["WaitlistEntry", "WaitlistContinuationTruthProjection"],
            },
            {
                "from_state": "waitlisted",
                "to_state": "fallback_to_hub",
                "guard_rule": "WaitlistFallbackObligation requires hub transfer.",
                "proof_objects": ["WaitlistFallbackObligation", "HubCoordinationCase"],
            },
            {
                "from_state": "waitlisted",
                "to_state": "callback_fallback",
                "guard_rule": "WaitlistFallbackObligation requires callback transfer.",
                "proof_objects": ["WaitlistFallbackObligation", "CallbackCase"],
            },
        ],
        "source_refs": [
            "phase-4-the-booking-engine.md#Booking case model and state machine",
            "phase-4-the-booking-engine.md#Waitlist continuation",
        ],
    },
    {
        "machine_id": "waitlist_continuation_state",
        "governing_object": "WaitlistContinuationTruthProjection.patientVisibleState",
        "states": [
            "waiting_for_offer",
            "offer_available",
            "accepted_pending_booking",
            "callback_expected",
            "hub_review_pending",
            "expired",
            "closed",
        ],
        "transitions": [
            {
                "from_state": "waiting_for_offer",
                "to_state": "offer_available",
                "guard_rule": "A current WaitlistOffer is issued under the same continuation fence.",
                "proof_objects": ["WaitlistOffer", "WaitlistContinuationTruthProjection"],
            },
            {
                "from_state": "offer_available",
                "to_state": "accepted_pending_booking",
                "guard_rule": "Patient accepted the live offer and booking confirmation is still pending.",
                "proof_objects": ["WaitlistOffer", "ReservationTruthProjection"],
            },
            {
                "from_state": "waiting_for_offer",
                "to_state": "callback_expected",
                "guard_rule": "WaitlistFallbackObligation requires callback transfer.",
                "proof_objects": ["WaitlistFallbackObligation", "CallbackExpectationEnvelope"],
            },
            {
                "from_state": "waiting_for_offer",
                "to_state": "hub_review_pending",
                "guard_rule": "WaitlistFallbackObligation requires hub transfer.",
                "proof_objects": ["WaitlistFallbackObligation", "HubCoordinationCase"],
            },
            {
                "from_state": "offer_available",
                "to_state": "expired",
                "guard_rule": "Offer or waitlist deadline expires or is superseded.",
                "proof_objects": ["WaitlistDeadlineEvaluation", "WaitlistOffer"],
            },
        ],
        "source_refs": [
            "phase-4-the-booking-engine.md#Waitlist continuation",
        ],
    },
    {
        "machine_id": "hub_coordination_case_state",
        "governing_object": "HubCoordinationCase.status",
        "states": [
            "created",
            "alternatives_offered",
            "patient_choice_pending",
            "candidate_revalidating",
            "native_booking_pending",
            "confirmation_pending",
            "booked_pending_practice_ack",
            "booked",
            "callback_transfer_pending",
            "escalated_back",
            "closed",
        ],
        "transitions": [
            {
                "from_state": "created",
                "to_state": "alternatives_offered",
                "guard_rule": "A real AlternativeOfferSession and HubOfferToConfirmationTruthProjection are created.",
                "proof_objects": ["AlternativeOfferSession", "HubOfferToConfirmationTruthProjection"],
            },
            {
                "from_state": "alternatives_offered",
                "to_state": "patient_choice_pending",
                "guard_rule": "Offer is actually delivered or the phone read-back session begins.",
                "proof_objects": ["AlternativeOfferSession", "CommandSettlementRecord"],
            },
            {
                "from_state": "patient_choice_pending",
                "to_state": "candidate_revalidating",
                "guard_rule": "Patient selects a current candidate under the live truthTupleHash and offer fence.",
                "proof_objects": ["HubOfferToConfirmationTruthProjection"],
            },
            {
                "from_state": "candidate_revalidating",
                "to_state": "native_booking_pending",
                "guard_rule": "Current candidate survives revalidation against supply, snapshot expiry, and policy.",
                "proof_objects": ["HubCommitAttempt"],
            },
            {
                "from_state": "native_booking_pending",
                "to_state": "confirmation_pending",
                "guard_rule": "Authoritative confirmation is still async or below threshold.",
                "proof_objects": ["ExternalConfirmationGate", "HubOfferToConfirmationTruthProjection"],
            },
            {
                "from_state": "native_booking_pending",
                "to_state": "booked_pending_practice_ack",
                "guard_rule": "Hub confirmation exists but current-generation practice acknowledgement is still pending.",
                "proof_objects": ["HubOfferToConfirmationTruthProjection", "PracticeAcknowledgementRecord"],
            },
            {
                "from_state": "booked_pending_practice_ack",
                "to_state": "booked",
                "guard_rule": "Current ackGeneration is satisfied for the live truth tuple.",
                "proof_objects": ["PracticeAcknowledgementRecord", "HubOfferToConfirmationTruthProjection"],
            },
            {
                "from_state": "patient_choice_pending",
                "to_state": "callback_transfer_pending",
                "guard_rule": "Fallback card or callback request is selected and callback linkage is still pending.",
                "proof_objects": ["HubFallbackRecord", "CallbackExpectationEnvelope"],
            },
            {
                "from_state": "patient_choice_pending",
                "to_state": "escalated_back",
                "guard_rule": "Offers expire, become unsafe, or callback / return-to-practice is the only safe path.",
                "proof_objects": ["AlternativeOfferRegenerationSettlement", "HubFallbackRecord"],
            },
        ],
        "source_refs": [
            "phase-5-the-network-horizon.md#Network coordination contract, case model, and state machine",
            "phase-5-the-network-horizon.md#Alternative offers and patient choice",
            "phase-5-the-network-horizon.md#Hub commit algorithm",
        ],
    },
    {
        "machine_id": "pharmacy_case_state",
        "governing_object": "PharmacyCase.status",
        "states": [
            "candidate_received",
            "rules_evaluating",
            "ineligible_returned",
            "eligible_choice_pending",
            "provider_selected",
            "consent_pending",
            "package_ready",
            "dispatch_pending",
            "consultation_outcome_pending",
            "resolved_by_pharmacy",
            "unresolved_returned",
            "urgent_bounce_back",
            "no_contact_return_pending",
            "outcome_reconciliation_pending",
            "closed",
        ],
        "transitions": [
            {
                "from_state": "candidate_received",
                "to_state": "rules_evaluating",
                "guard_rule": "PharmacyCase exists on the current lineage link and rule pack evaluation starts.",
                "proof_objects": ["PharmacyCase"],
            },
            {
                "from_state": "rules_evaluating",
                "to_state": "eligible_choice_pending",
                "guard_rule": "Current rule pack and evidence allow pharmacy choice.",
                "proof_objects": ["PathwayEligibilityEvaluation", "PharmacyChoiceSession"],
            },
            {
                "from_state": "rules_evaluating",
                "to_state": "ineligible_returned",
                "guard_rule": "Eligibility or exclusion rules reject the pathway and route the case back to practice.",
                "proof_objects": ["PathwayEligibilityEvaluation"],
            },
            {
                "from_state": "eligible_choice_pending",
                "to_state": "provider_selected",
                "guard_rule": "A provider is durably selected from the current choice session.",
                "proof_objects": ["PharmacyChoiceSession", "PharmacyChoiceProof"],
            },
            {
                "from_state": "provider_selected",
                "to_state": "consent_pending",
                "guard_rule": "Consent does not yet satisfy the current provider, pathway, scope, and package tuple.",
                "proof_objects": ["PharmacyConsentCheckpoint"],
            },
            {
                "from_state": "consent_pending",
                "to_state": "package_ready",
                "guard_rule": "Current consent checkpoint is satisfied and the package is frozen for dispatch.",
                "proof_objects": ["PharmacyConsentCheckpoint", "PharmacyReferralPackage"],
            },
            {
                "from_state": "package_ready",
                "to_state": "dispatch_pending",
                "guard_rule": "A fenced PharmacyDispatchAttempt starts under the current transport plan.",
                "proof_objects": ["PharmacyDispatchAttempt"],
            },
            {
                "from_state": "dispatch_pending",
                "to_state": "consultation_outcome_pending",
                "guard_rule": "Dispatch proof reaches the threshold required by the active transport assurance profile.",
                "proof_objects": ["PharmacyDispatchAttempt", "ExternalConfirmationGate"],
            },
            {
                "from_state": "consultation_outcome_pending",
                "to_state": "resolved_by_pharmacy",
                "guard_rule": "Authoritative pharmacy outcome is accepted.",
                "proof_objects": ["PharmacyOutcomeRecord"],
            },
            {
                "from_state": "consultation_outcome_pending",
                "to_state": "unresolved_returned",
                "guard_rule": "Routine return requires governed reopen.",
                "proof_objects": ["PharmacyBounceBackRecord"],
            },
            {
                "from_state": "consultation_outcome_pending",
                "to_state": "urgent_bounce_back",
                "guard_rule": "Urgent return requires elevated reopen.",
                "proof_objects": ["PharmacyBounceBackRecord"],
            },
            {
                "from_state": "consultation_outcome_pending",
                "to_state": "no_contact_return_pending",
                "guard_rule": "No-contact outcome is explicit and cannot auto-close.",
                "proof_objects": ["PharmacyBounceBackRecord"],
            },
            {
                "from_state": "consultation_outcome_pending",
                "to_state": "outcome_reconciliation_pending",
                "guard_rule": "Outcome evidence is weak, ambiguous, or contradictory.",
                "proof_objects": ["PharmacyOutcomeRecord"],
            },
        ],
        "source_refs": [
            "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
        ],
    },
]

REQUEST_LINEAGE_SEQUENCE = """sequenceDiagram
    actor Patient
    participant Intake as Intake and Identity
    participant Safety as SafetyOrchestrator
    participant Triage as Triage Workspace
    participant Child as Child Case
    participant Support as Support / Replay
    participant Life as LifecycleCoordinator

    Patient->>Intake: submit, call, or resume
    Intake->>Intake: SubmissionIngressRecord + SubmissionEnvelope
    Intake->>Intake: IdentityBinding / secure-link / claim checks
    alt wrong-patient or binding dispute
        Intake->>Intake: open IdentityRepairCase
        Intake-->>Patient: same-shell identity hold and recovery
    else routine capture continues
        Intake->>Intake: capture evidence, quarantine, readiness
    end
    alt degraded evidence or ingest failure
        Intake->>Support: open FallbackReviewCase
        Support-->>Patient: degraded receipt with same-lineage recovery
    else governed submit
        Intake->>Intake: SubmissionPromotionRecord + Request + RequestLineage
        Intake->>Safety: canonical safety decision
    end
    alt urgent diversion required
        Safety->>Life: urgent milestone and blocker facts
        Safety-->>Patient: urgent guidance until UrgentDiversionSettlement
    else routine triage
        Safety->>Triage: create TriageTask + RequestLifecycleLease
        Triage-->>Patient: receipt and status
        opt more-info needed
            Triage-->>Patient: MoreInfoCycle prompt
            Patient->>Triage: reply or late reply
            Triage->>Safety: re-safety when material delta exists
        end
        alt direct outcome
            Triage->>Life: outcome milestone with authoritative proof
        else downstream case
            Triage->>Child: create LineageCaseLink + child case
            Child-->>Patient: same-shell child status, pending, or repair posture
            opt support replay or resend affects the lineage
                Support->>Support: SupportReplayRestoreSettlement before live repair
                Support->>Child: bounded restore or resend
            end
            Child->>Life: handoff and outcome milestones, blockers, and gates
        end
        Life->>Life: evaluate RequestClosureRecord with leases, blockers, gates, grants, and lineage links
        alt blockers remain
            Life-->>Patient: keep lineage open with truthful blocker posture
        else closeable
            Life-->>Patient: closed status after RequestClosureRecord(decision = close)
        end
    end
"""

ENDPOINT_STATE_MACHINE = """stateDiagram-v2
    [*] --> SubmissionEnvelope
    SubmissionEnvelope --> RequestSubmitted: SubmissionPromotionRecord
    SubmissionEnvelope --> FallbackReview: degraded ingest or quarantine
    SubmissionEnvelope --> IdentityHold: wrong-patient or binding dispute

    RequestSubmitted --> IntakeNormalized
    IntakeNormalized --> TriageReady
    TriageReady --> TriageActive: RequestLifecycleLease + TriageTask

    TriageActive --> UrgentRequired: SafetyDecisionRecord
    UrgentRequired --> UrgentDiverted: UrgentDiversionSettlement

    TriageActive --> MoreInfoCycle: MoreInfoCycle current
    MoreInfoCycle --> TriageActive: accepted reply + assimilation
    MoreInfoCycle --> ContactRepair: blocked_repair or degraded delivery

    TriageActive --> DuplicateReview: DuplicateCluster(review_required)
    DuplicateReview --> TriageActive: DuplicateResolutionDecision

    TriageActive --> DirectOutcome: Self-care or admin-resolution
    DirectOutcome --> OutcomeRecorded: authoritative direct settlement

    TriageActive --> ChildCaseActive: LineageCaseLink acknowledged
    state ChildCaseActive {
        [*] --> Messaging
        [*] --> Callback
        [*] --> Booking
        [*] --> Waitlist
        [*] --> Hub
        [*] --> Pharmacy
        Messaging --> ContactRepair: delivery_failed or repair_route
        Callback --> ContactRepair: route_invalid or repair_required
        Booking --> Waitlist: waitlisted
        Booking --> ConfirmationPending: ExternalConfirmationGate
        Waitlist --> Callback: callback fallback
        Waitlist --> Hub: hub fallback
        Hub --> Callback: callback transfer
        Hub --> ReopenToPractice: return_to_practice
        Pharmacy --> ContactRepair: reachability blocked
        Pharmacy --> ReopenToPractice: unresolved_returned or urgent_bounce_back
    }

    ConfirmationPending --> ChildCaseActive: authoritative proof restored
    ContactRepair --> ChildCaseActive: reachability rebound
    IdentityHold --> TriageActive: IdentityRepairReleaseSettlement
    FallbackReview --> TriageActive: manual recovery settled

    ChildCaseActive --> OutcomeRecorded: authoritative child outcome recorded
    OutcomeRecorded --> ClosureEvaluation
    ClosureEvaluation --> Closed: RequestClosureRecord(decision = close)
    ClosureEvaluation --> TriageActive: blocker, gate, lease, or reopen still active
    Closed --> [*]
"""


def build_payload() -> dict[str, Any]:
    product_scope = load_json(PRODUCT_SCOPE_PATH)
    conflicts = load_json(SUMMARY_CONFLICTS_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    shell_map = load_json(SHELL_MAP_PATH)
    conformance_seed = load_json(CONFORMANCE_SEED_PATH)

    upstream_inputs = {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "summary_conflict_rows": len(conflicts["rows"]),
        "scope_matrix_rows": len(product_scope["rows"]),
        "route_family_rows": len(route_rows),
        "shell_type_rows": len(shell_map["shells"]),
        "conformance_seed_rows": len(conformance_seed["rows"]),
    }

    return {
        "model_id": "request_lineage_model_v1",
        "mission": product_scope["mission"],
        "baseline_statement": product_scope["current_delivery_baseline_statement"],
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream_inputs,
        "state_axes": STATE_AXES,
        "orthogonal_blockers": ORTHOGONAL_BLOCKERS,
        "lineage_stages": LINEAGE_STAGES,
        "child_aggregates": CHILD_AGGREGATES,
        "endpoints": ENDPOINTS,
        "patient_actions": PATIENT_ACTIONS,
        "external_touchpoints": EXTERNAL_TOUCHPOINTS,
        "gap_register": GAP_REGISTER,
        "state_machines": STATE_MACHINES,
        "mermaid": {
            "request_lineage_sequence": REQUEST_LINEAGE_SEQUENCE,
            "endpoint_state_machine": ENDPOINT_STATE_MACHINE,
        },
    }


def write_model_doc(payload: dict[str, Any]) -> None:
    stage_table = render_table(
        [
            "Stage",
            "Governing Objects",
            "Durable Records",
            "Patient Effect",
            "Blockers / Guards",
            "Degraded / Exception",
            "Source Refs",
        ],
        [
            [
                item["stage_name"],
                item["governing_objects"],
                item["durable_records"],
                item["patient_effect"],
                item["blockers_and_guards"],
                item["degraded_behavior"],
                item["source_refs"],
            ]
            for item in payload["lineage_stages"]
        ],
    )

    aggregate_table = render_table(
        [
            "Aggregate",
            "Case Family",
            "Entry Gate",
            "Authoritative Truth",
            "Ambiguity / Recovery",
            "Patient Continuity",
            "Source Refs",
        ],
        [
            [
                item["aggregate_name"],
                item["case_family"],
                item["entry_gate"],
                item["authoritative_truth"],
                [item["ambiguity_truth"], *item["recovery_contracts"]],
                item["patient_shell_continuity"],
                item["source_refs"],
            ]
            for item in payload["child_aggregates"]
        ],
    )

    content = "\n".join(
        [
            "# Request Lineage Model",
            "",
            "## Summary",
            "",
            f"- Lineage stages mapped: {len(payload['lineage_stages'])}",
            f"- Child aggregates mapped: {len(payload['child_aggregates'])}",
            f"- Endpoint rows mapped: {len(payload['endpoints'])}",
            f"- Patient action rows mapped: {len(payload['patient_actions'])}",
            f"- External touchpoints mapped: {len(payload['external_touchpoints'])}",
            "",
            "## Baseline Line",
            "",
            f"- {payload['baseline_statement']}",
            f"- Upstream requirement registry rows consumed: {payload['upstream_inputs']['requirement_registry_rows']}",
            f"- Upstream summary conflict rows consumed: {payload['upstream_inputs']['summary_conflict_rows']}",
            f"- Upstream route family rows consumed: {payload['upstream_inputs']['route_family_rows']}",
            "",
            "## Canonical Lineage Rules",
            "",
            "- One Request is created only by governed promotion of a SubmissionEnvelope.",
            "- RequestLineage plus LineageCaseLink preserve continuity; child domains own detailed lifecycle but not canonical closure.",
            "- workflowState, submissionEnvelopeState, safetyState, and identityState stay orthogonal.",
            "- Ambiguity, repair, duplicate review, fallback review, and confirmation gates remain blocker facts rather than extra workflow states.",
            "- LifecycleCoordinator is the only cross-domain authority that can persist RequestClosureRecord and write Request.workflowState = closed.",
            "",
            "## Source Precedence",
            "",
            *[f"- {item}" for item in payload["source_precedence"]],
            "",
            "## Lineage Stages",
            "",
            stage_table,
            "",
            "## Child Aggregate Ownership Model",
            "",
            aggregate_table,
        ]
    )
    write_text(LINEAGE_MODEL_DOC_PATH, content)


def write_state_axes_doc(payload: dict[str, Any]) -> None:
    axes_table = render_table(
        [
            "Axis",
            "Governing Object",
            "Allowed Values",
            "Transition Law",
            "Why Orthogonal",
            "Source Refs",
        ],
        [
            [
                item["axis_id"],
                item["governing_object"],
                item["allowed_values"],
                item["transition_law"],
                item["why_it_is_orthogonal"],
                item["source_refs"],
            ]
            for item in payload["state_axes"]
        ],
    )

    blocker_table = render_table(
        [
            "Blocker Class",
            "Canonical Objects",
            "Closure Rule",
            "Source Refs",
        ],
        [
            [
                item["blocker_class"],
                item["canonical_objects"],
                item["closure_rule"],
                item["source_refs"],
            ]
            for item in payload["orthogonal_blockers"]
        ],
    )

    content = "\n".join(
        [
            "# Request Lineage State Axes",
            "",
            "## Orthogonal Axes",
            "",
            "The canonical request model uses four explicit axes. Confirmation pending, duplicate review, fallback review, identity hold, reachability repair, and other repair or ambiguity facts stay outside Request.workflowState.",
            "",
            axes_table,
            "",
            "## Closure Blocker Classes",
            "",
            "LifecycleCoordinator evaluates blocker facts separately from milestone state. No endpoint may imply canonical closure until these blocker classes are empty or explicitly downgraded by policy.",
            "",
            blocker_table,
        ]
    )
    write_text(STATE_AXES_DOC_PATH, content)


def write_endpoint_matrix_doc(payload: dict[str, Any]) -> None:
    table = render_table(
        [
            "Endpoint",
            "Class",
            "Entry Conditions",
            "Owning Aggregate",
            "Authoritative Success",
            "Ambiguity",
            "Recovery",
            "Same-Shell Patient Actionability",
            "Source Refs",
        ],
        [
            [
                item["endpoint_name"],
                item["endpoint_class"],
                item["entry_conditions"],
                item["owning_aggregate"],
                item["authoritative_success"],
                item["ambiguity_mode"],
                item["recovery_path"],
                item["patient_actionability"],
                item["source_refs"],
            ]
            for item in payload["endpoints"]
        ],
    )

    content = "\n".join(
        [
            "# Endpoint Matrix",
            "",
            "## Summary",
            "",
            f"- Endpoint rows: {len(payload['endpoints'])}",
            "- Covers urgent diversion, fallback review, self-care, admin resolution, messaging, callback, booking, waitlist, hub, pharmacy, recovery, and support replay touchpoints.",
            "- No endpoint row implies direct Request closure without LifecycleCoordinator review.",
            "",
            table,
        ]
    )
    write_text(ENDPOINT_MATRIX_DOC_PATH, content)


def write_transition_rules_doc(payload: dict[str, Any]) -> None:
    lines = [
        "# Transition And Guard Rules",
        "",
        "## Global Guard Rules",
        "",
        "- Every mutating path validates the current RouteIntentBinding, release tuple, continuity evidence, and governing object fence before changing durable truth.",
        "- Child domains may emit milestones, blockers, and evidence, but only LifecycleCoordinator may derive canonical closure.",
        "- No success state exists without the named authoritative proof object for that domain.",
        "- External ambiguity, repair, and duplicate-review states remain explicit and never collapse into generic success or generic error.",
        "",
        "## State Machines",
        "",
    ]

    for machine in payload["state_machines"]:
        transition_table = render_table(
            ["From", "To", "Guard Rule", "Proof Objects"],
            [
                [
                    item["from_state"],
                    item["to_state"],
                    item["guard_rule"],
                    item["proof_objects"],
                ]
                for item in machine["transitions"]
            ],
        )
        lines.extend(
            [
                f"### {machine['machine_id']}",
                "",
                f"- Governing object: `{machine['governing_object']}`",
                f"- States: {', '.join(machine['states'])}",
                f"- Source refs: {', '.join(machine['source_refs'])}",
                "",
                transition_table,
                "",
            ]
        )

    write_text(TRANSITION_RULES_DOC_PATH, "\n".join(lines))


def write_patient_action_doc(payload: dict[str, Any]) -> None:
    table = render_table(
        [
            "Patient Action",
            "Route Context",
            "Required RouteIntentBinding",
            "Command Semantics",
            "Freshness Check",
            "Safety Preemption",
            "Recovery Behavior",
            "Source Refs",
        ],
        [
            [
                item["patient_action"],
                item["route_context"],
                item["route_intent_binding"],
                item["command_semantics"],
                item["freshness_check"],
                item["safety_preemption_rule"],
                item["recovery_behavior"],
                item["source_refs"],
            ]
            for item in payload["patient_actions"]
        ],
    )
    content = "\n".join(
        [
            "# Patient Action To Route Binding Matrix",
            "",
            "Every post-submit patient action is route-bound, freshness-checked, and safety-aware. The shell must recover in place when the route tuple, reachability, visibility, or binding posture drifts.",
            "",
            table,
        ]
    )
    write_text(PATIENT_ACTION_DOC_PATH, content)


def write_external_touchpoint_doc(payload: dict[str, Any]) -> None:
    table = render_table(
        [
            "Dependency",
            "Lineage Area",
            "Purpose",
            "Required Proof",
            "Ambiguity Mode",
            "Degraded Fallback",
            "Scope",
            "Source Refs",
        ],
        [
            [
                item["dependency_name"],
                item["lineage_area"],
                item["interaction_purpose"],
                item["required_proof"],
                item["ambiguity_mode"],
                item["degraded_fallback"],
                item["scope_posture"],
                item["source_refs"],
            ]
            for item in payload["external_touchpoints"]
        ],
    )
    content = "\n".join(
        [
            "# External Touchpoint Matrix",
            "",
            "These touchpoints are cataloged for later integration work only. Provisioning is out of scope for seq_005.",
            "",
            table,
        ]
    )
    write_text(EXTERNAL_TOUCHPOINT_DOC_PATH, content)


def write_gap_report_doc(payload: dict[str, Any]) -> None:
    table = render_table(
        [
            "ID",
            "Kind",
            "Status",
            "Summary",
            "Effect Area",
            "Resolution / Risk",
            "Source Refs",
        ],
        [
            [
                item["item_id"],
                item["kind"],
                item["status"],
                item["summary"],
                item["effect_area"],
                item["resolution_or_risk"],
                item["source_refs"],
            ]
            for item in payload["gap_register"]
        ],
    )
    content = "\n".join(
        [
            "# Lineage Gap Report",
            "",
            "Only bounded residual issues remain. Wherever the corpus was strong enough, this task resolved the gap by applying the source precedence rules rather than inventing new behavior.",
            "",
            table,
        ]
    )
    write_text(GAP_REPORT_DOC_PATH, content)


def write_json_and_csv(payload: dict[str, Any]) -> None:
    write_text(TRANSITIONS_JSON_PATH, json.dumps(payload, indent=2))

    endpoint_rows = [
        {
            "endpoint_id": item["endpoint_id"],
            "endpoint_name": item["endpoint_name"],
            "endpoint_class": item["endpoint_class"],
            "entry_conditions": item["entry_conditions"],
            "owning_aggregate": item["owning_aggregate"],
            "authoritative_success": item["authoritative_success"],
            "ambiguity_mode": item["ambiguity_mode"],
            "recovery_path": item["recovery_path"],
            "patient_actionability": item["patient_actionability"],
            "request_milestone_effect": item["request_milestone_effect"],
            "closure_rule": item["closure_rule"],
            "external_touchpoints": item["external_touchpoints"],
            "audit_findings": item["audit_findings"],
            "source_refs": item["source_refs"],
        }
        for item in payload["endpoints"]
    ]
    write_csv(
        ENDPOINT_MATRIX_CSV_PATH,
        [
            "endpoint_id",
            "endpoint_name",
            "endpoint_class",
            "entry_conditions",
            "owning_aggregate",
            "authoritative_success",
            "ambiguity_mode",
            "recovery_path",
            "patient_actionability",
            "request_milestone_effect",
            "closure_rule",
            "external_touchpoints",
            "audit_findings",
            "source_refs",
        ],
        endpoint_rows,
    )

    write_csv(
        PATIENT_ACTION_CSV_PATH,
        [
            "action_id",
            "patient_action",
            "route_context",
            "route_intent_binding",
            "command_semantics",
            "freshness_check",
            "safety_preemption_rule",
            "recovery_behavior",
            "source_refs",
        ],
        payload["patient_actions"],
    )

    write_csv(
        EXTERNAL_TOUCHPOINT_CSV_PATH,
        [
            "touchpoint_id",
            "lineage_area",
            "dependency_name",
            "interaction_purpose",
            "required_proof",
            "ambiguity_mode",
            "degraded_fallback",
            "scope_posture",
            "source_refs",
        ],
        payload["external_touchpoints"],
    )


def main() -> None:
    payload = build_payload()
    write_json_and_csv(payload)
    write_model_doc(payload)
    write_state_axes_doc(payload)
    write_endpoint_matrix_doc(payload)
    write_transition_rules_doc(payload)
    write_patient_action_doc(payload)
    write_external_touchpoint_doc(payload)
    write_gap_report_doc(payload)
    write_text(REQUEST_SEQUENCE_MMD_PATH, payload["mermaid"]["request_lineage_sequence"])
    write_text(ENDPOINT_STATE_MACHINE_MMD_PATH, payload["mermaid"]["endpoint_state_machine"])


if __name__ == "__main__":
    main()
