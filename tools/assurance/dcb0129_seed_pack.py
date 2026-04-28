#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"
TASK_ID = "par_121"
BASELINE_DATE = "2026-04-14"
DEFAULT_NEXT_REVIEW = "2026-07-14"
DEFAULT_REVIEW_NOTE = (
    "Baseline reviewed on 2026-04-14 against the current NHS clinical safety guidance posture and "
    "the local Vecells blueprint corpus. Keep the seed pack versioned because NHS clinical safety "
    "standards and onboarding expectations may refresh."
)
NON_APPLICABILITY_RECORD_ID = "SAFETY_NON_APPLICABILITY_RECORD_V1"

REQUIRED_HAZARD_FIELDS = [
    "hazard_id",
    "hazard_title",
    "hazard_family",
    "phase_scope",
    "source_blueprint_refs",
    "hazard_description",
    "trigger_condition",
    "failure_mode",
    "clinical_harm_path",
    "affected_actor_types",
    "affected_channels",
    "affected_objects",
    "causal_controls_existing",
    "causal_controls_required",
    "verification_evidence_refs",
    "residual_risk_statement",
    "severity_band",
    "likelihood_band",
    "initial_risk_band",
    "residual_risk_band",
    "review_owner_role",
    "independent_reviewer_role",
    "status",
    "last_reviewed_at",
    "next_review_due_at",
    "change_trigger_refs",
    "notes",
    "standards_version",
    "review_note",
]

HAZARD_CSV_COLUMNS = REQUIRED_HAZARD_FIELDS + [
    "canonical_invariant_refs",
    "platform_service_refs",
    "route_runtime_publication_control_refs",
    "operational_procedure_refs",
]

TRACEABILITY_CSV_COLUMNS = [
    "hazard_id",
    "hazard_title",
    "hazard_family",
    "canonical_invariant_refs",
    "platform_service_refs",
    "route_runtime_publication_control_refs",
    "operational_procedure_refs",
    "review_event_refs",
    "existing_control_refs",
    "required_control_refs",
    "verification_evidence_refs",
    "notes",
]

ROLE_LABELS = {
    "ROLE_MANUFACTURER_CSO": "Manufacturer Clinical Safety Officer (provisional placeholder)",
    "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER": "Independent Clinical Safety Reviewer (provisional placeholder)",
    "ROLE_CLINICAL_SAFETY_COORDINATOR": "Clinical Safety Coordinator",
    "ROLE_IDENTITY_DOMAIN_LEAD": "Identity Domain Lead",
    "ROLE_TRIAGE_RULESET_OWNER": "Triage Ruleset Owner",
    "ROLE_RELEASE_MANAGER": "Release Manager",
    "ROLE_BOOKING_DOMAIN_LEAD": "Booking Domain Lead",
    "ROLE_NETWORK_COORDINATION_LEAD": "Network Coordination Lead",
    "ROLE_PHARMACY_DOMAIN_LEAD": "Pharmacy Domain Lead",
    "ROLE_SUPPORT_WORKFLOW_LEAD": "Support Workflow Lead",
    "ROLE_ASSISTIVE_SAFETY_COORDINATOR": "Assistive Safety Coordinator",
    "ROLE_PRODUCT_SAFETY_APPROVER": "Product Safety Approver",
}

ROLE_PLACEHOLDERS = [
    {
        "gap_id": "GAP_ROLE_DEFINITION_MANUFACTURER_CSO_V1",
        "placeholder_role": "ROLE_MANUFACTURER_CSO",
        "gap_statement": (
            "The named DCB0129 Clinical Safety Officer is not yet recorded in-repo, so the seed pack "
            "uses a placeholder role until the signoff matrix and named owner pack land."
        ),
        "closure_target": "par_125",
    },
    {
        "gap_id": "GAP_ROLE_DEFINITION_INDEPENDENT_REVIEWER_V1",
        "placeholder_role": "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        "gap_statement": (
            "Independent clinical safety review authority is required for high-severity changes, but "
            "the named reviewer roster is not yet fixed in-repo."
        ),
        "closure_target": "par_125",
    },
    {
        "gap_id": "GAP_ROLE_DEFINITION_CHANGE_AUTHORITY_COORDINATOR_V1",
        "placeholder_role": "ROLE_CLINICAL_SAFETY_COORDINATOR",
        "gap_statement": (
            "Change-control coordination is modeled now as a placeholder operational role so review "
            "events can be assigned deterministically before the governance shell and cadence pack settle."
        ),
        "closure_target": "par_125",
    },
]

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/121.md",
    "prompt/shared_operating_contract_116_to_125.md",
    "blueprint/phase-cards.md#Long-lead assurance tracks",
    "blueprint/phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm",
    "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
    "blueprint/phase-2-identity-and-echoes.md#Identity, callback, and telephony safety discipline",
    "blueprint/phase-4-the-booking-engine.md#Booking confirmation and capability truth",
    "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
    "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation and bounce-back safety",
    "blueprint/phase-8-the-assistive-layer.md#No self-approval and independent safety signoff",
    "blueprint/phase-9-the-assurance-ledger.md#Assurance ledger, evidence graph, and operational state contracts",
    "blueprint/blueprint-init.md#Core product and safety framing",
    "blueprint/forensic-audit-findings.md#Safety-relevant defect classes",
]

STANDARDS_VERSION = {
    "baseline_id": "NHS_CLINICAL_SAFETY_BASELINE_REVIEWED_2026_04_14",
    "manufacturer_standard": "DCB0129",
    "deployer_companion_standard": "DCB0160",
    "reviewed_at": BASELINE_DATE,
    "source_note": (
        "Vecells treats DCB0129 as the manufacturer-side clinical risk management frame and DCB0160 "
        "as the deployer-side companion. This seed pack deliberately records a review timestamp and "
        "review note rather than assuming a static forever-template."
    ),
}

PREREQUISITES = [
    {
        "prerequisite_id": "PREREQ_REQ_TRACEABILITY_BASELINE",
        "path": "data/analysis/cross_phase_invariants.json",
        "purpose": "Canonical invariant anchors used by hazard-to-control traceability.",
    },
    {
        "prerequisite_id": "PREREQ_MASTER_RISK_REGISTER",
        "path": "data/analysis/master_risk_register.json",
        "purpose": "Existing programme risk posture and manufacturer CSO ownership baseline.",
    },
    {
        "prerequisite_id": "PREREQ_MUTATION_GATE",
        "path": "data/analysis/live_mutation_gate_rules.json",
        "purpose": "Stale-writable and decision-epoch safety controls.",
    },
    {
        "prerequisite_id": "PREREQ_DUPLICATE_CLUSTER",
        "path": "data/analysis/duplicate_cluster_manifest.json",
        "purpose": "Replay, silent merge, and same-request attach controls.",
    },
    {
        "prerequisite_id": "PREREQ_REACHABILITY_SNAPSHOT",
        "path": "data/analysis/contact_route_snapshot_manifest.json",
        "purpose": "Reachability and callback dependency safety controls.",
    },
    {
        "prerequisite_id": "PREREQ_EVIDENCE_ASSIMILATION",
        "path": "data/analysis/evidence_assimilation_casebook.json",
        "purpose": "Canonical evidence classification, material delta, and safety preemption controls.",
    },
    {
        "prerequisite_id": "PREREQ_BOOKING_CAPABILITY",
        "path": "data/analysis/gp_booking_capability_evidence.json",
        "purpose": "Booking capability and confirmation truth controls.",
    },
    {
        "prerequisite_id": "PREREQ_GATEWAY_SURFACES",
        "path": "data/analysis/gateway_surface_manifest.json",
        "purpose": "Audience-surface runtime binding and route publication controls.",
    },
    {
        "prerequisite_id": "PREREQ_RELEASE_PARITY",
        "path": "data/analysis/release_publication_parity_records.json",
        "purpose": "Release/publication parity control anchor for calm or writable posture.",
    },
    {
        "prerequisite_id": "PREREQ_RUNTIME_TOPOLOGY",
        "path": "data/analysis/runtime_topology_manifest.json",
        "purpose": "Runtime topology and trust-boundary baseline for safety controls.",
    },
    {
        "prerequisite_id": "PREREQ_EXTERNAL_ASSURANCE_OBLIGATIONS",
        "path": "data/analysis/external_assurance_obligations.csv",
        "purpose": "Existing external-assurance workstream split between supplier and deployer obligations.",
    },
    {
        "prerequisite_id": "PREREQ_PHARMACY_ACCESS_PATHS",
        "path": "data/analysis/pharmacy_referral_transport_decision_register.json",
        "purpose": "Seeded pharmacy referral and transport truth used by the pharmacy hazards.",
    },
]

GAP_RESOLUTIONS = [
    {
        "gap_id": "GAP_RESOLUTION_HAZARD_DERIVATION_STALE_WRITABLE_UI_V1",
        "resolution": (
            "The blueprint forbids stale writable surfaces and publication drift through invariants rather "
            "than by naming a single hazard sentence, so this seed pack derives a bounded hazard from those "
            "explicit fail-closed rules."
        ),
    },
    {
        "gap_id": "GAP_RESOLUTION_HAZARD_DERIVATION_CALLBACK_PROMISE_FAILURE_V1",
        "resolution": (
            "The callback and more-info failure mode is expressed in the corpus as expectation, dependency, "
            "and repair law; the seed pack converts that into a clinical hazard statement for the DCB0129 log."
        ),
    },
    {
        "gap_id": "GAP_RESOLUTION_HAZARD_DERIVATION_SUPPORT_REPLAY_DISCLOSURE_V1",
        "resolution": (
            "The forensic findings describe stale replay and wrong-subject restore as control failures. The "
            "seed pack transparently derives a clinical hazard from those findings rather than omitting them."
        ),
    },
    {
        "gap_id": "GAP_RESOLUTION_HAZARD_DERIVATION_ASSISTIVE_MISUSE_V1",
        "resolution": (
            "Assistive misuse is a future-facing safety class in the blueprint. The seed pack records it now "
            "as deferred-but-known so later live assistive work extends the same register."
        ),
    },
]


def control_item(
    control_id: str,
    title: str,
    layer: str,
    refs: list[str],
    evidence_refs: list[str],
    procedure_refs: list[str],
    status: str = "active_seed_control",
) -> dict[str, Any]:
    return {
        "control_id": control_id,
        "control_title": title,
        "control_layer": layer,
        "architectural_control_refs": refs,
        "evidence_placeholder_refs": evidence_refs,
        "operational_procedure_refs": procedure_refs,
        "status": status,
    }


CONTROL_CATALOG = [
    control_item(
        "CTRL_IDENTITY_REPAIR_FREEZE",
        "IdentityRepairFreezeRecord and IdentityRepairReleaseSettlement must gate any suspected wrong-subject correction.",
        "domain_invariant",
        [
            "blueprint/phase-2-identity-and-echoes.md#IdentityBindingAuthority",
            "blueprint/phase-2-identity-and-echoes.md#IdentityRepairSignal",
            "blueprint/phase-2-identity-and-echoes.md#IdentityRepairFreezeRecord",
        ],
        ["EVID_IDENTITY_REPAIR_VALIDATION", "EVID_ACCESS_GRANT_VALIDATION"],
        ["PROC_IDENTITY_REPAIR_ESCALATION"],
    ),
    control_item(
        "CTRL_EVIDENCE_ASSIMILATION_PREEMPTION",
        "EvidenceAssimilationRecord, MaterialDeltaAssessment, and SafetyPreemptionRecord must settle before calm continuation resumes.",
        "domain_invariant",
        [
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceAssimilationRecord",
            "blueprint/phase-0-the-foundation-protocol.md#MaterialDeltaAssessment",
            "blueprint/phase-0-the-foundation-protocol.md#SafetyPreemptionRecord",
        ],
        ["EVID_EVIDENCE_ASSIMILATION_VALIDATION"],
        ["PROC_RULESET_CHANGE_DELTA_REVIEW"],
    ),
    control_item(
        "CTRL_DUPLICATE_ATTACH_FENCE",
        "DuplicatePairEvidence and DuplicateResolutionDecision must fence any merge or attach path.",
        "workflow_fence",
        [
            "blueprint/phase-0-the-foundation-protocol.md#DuplicatePairEvidence",
            "blueprint/phase-0-the-foundation-protocol.md#DuplicateResolutionDecision",
            "blueprint/phase-0-the-foundation-protocol.md#ReplayCollisionReview",
        ],
        ["EVID_DUPLICATE_CLUSTER_VALIDATION"],
        ["PROC_POST_INCIDENT_RETRO_REVIEW"],
    ),
    control_item(
        "CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH",
        "DecisionEpoch and live mutation gates must fail closed on stale evidence, stale ownership, or stale writable posture.",
        "runtime_gate",
        [
            "blueprint/phase-0-the-foundation-protocol.md#DecisionEpoch",
            "data/analysis/live_mutation_gate_rules.json",
            "blueprint/phase-0-the-foundation-protocol.md#ReviewActionLease",
        ],
        ["EVID_MUTATION_GATE_VALIDATION"],
        ["PROC_RELEASE_PUBLICATION_DRIFT_REVIEW"],
    ),
    control_item(
        "CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING",
        "AudienceSurfaceRuntimeBinding and ReleasePublicationParityRecord remain the sole calm/writable authority.",
        "publication_parity",
        [
            "blueprint/phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding",
            "blueprint/phase-0-the-foundation-protocol.md#ReleasePublicationParityRecord",
            "data/analysis/gateway_surface_manifest.json",
        ],
        ["EVID_GATEWAY_SURFACE_VALIDATION", "EVID_RELEASE_PARITY_VALIDATION"],
        ["PROC_RELEASE_PUBLICATION_DRIFT_REVIEW"],
    ),
    control_item(
        "CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION",
        "ReachabilityAssessmentRecord and callback expectation envelopes must stay authoritative across promise and repair paths.",
        "communications_guard",
        [
            "blueprint/phase-0-the-foundation-protocol.md#ReachabilityAssessmentRecord",
            "blueprint/phase-0-the-foundation-protocol.md#ReachabilityDependency",
            "blueprint/phase-0-the-foundation-protocol.md#CommunicationEnvelope",
        ],
        ["EVID_REACHABILITY_VALIDATION", "EVID_COMMUNICATION_ENVELOPE_VALIDATION"],
        ["PROC_CALLBACK_PROMISE_REPAIR"],
    ),
    control_item(
        "CTRL_TELEPHONY_EVIDENCE_READINESS",
        "TelephonyEvidenceReadinessAssessment must hold telephony requests until evidence is genuinely safety-usable.",
        "adapter_gate",
        [
            "blueprint/phase-2-identity-and-echoes.md#TelephonyEvidenceReadinessAssessment",
            "blueprint/phase-2-identity-and-echoes.md#IntakeConvergenceContract",
        ],
        ["EVID_TELEPHONY_READINESS_VALIDATION"],
        ["PROC_TELEPHONY_PATH_CHANGE_REVIEW"],
    ),
    control_item(
        "CTRL_RESERVATION_TRUTH_AND_WAITLIST_FALLBACK",
        "ReservationTruthProjection and WaitlistFallbackObligation must govern hold language and safe fallback.",
        "booking_control",
        [
            "blueprint/phase-0-the-foundation-protocol.md#ReservationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#WaitlistFallbackObligation",
            "blueprint/phase-0-the-foundation-protocol.md#WaitlistContinuationTruthProjection",
        ],
        ["EVID_RESERVATION_QUEUE_VALIDATION"],
        ["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW"],
    ),
    control_item(
        "CTRL_BOOKING_CONFIRMATION_GATE",
        "BookingConfirmationTruthProjection and ExternalConfirmationGate must prevent false booked reassurance.",
        "booking_control",
        [
            "blueprint/phase-0-the-foundation-protocol.md#BookingConfirmationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#ExternalConfirmationGate",
            "data/analysis/gp_booking_capability_evidence.json",
        ],
        ["EVID_BOOKING_CAPABILITY_PROOF"],
        ["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW"],
    ),
    control_item(
        "CTRL_HUB_VISIBILITY_POLICY",
        "HubPracticeVisibilityPolicy and NetworkCoordinationPolicyEvaluation must fence hub visibility and fallback exposure.",
        "network_policy",
        [
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "blueprint/phase-0-the-foundation-protocol.md#HubPracticeVisibilityPolicy",
            "blueprint/phase-0-the-foundation-protocol.md#NetworkCoordinationPolicyEvaluation",
        ],
        ["EVID_HUB_POLICY_PLACEHOLDER_V1"],
        ["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_PHARMACY_CONSENT_CHECKPOINT",
        "PharmacyConsentCheckpoint and revocation records must fence dispatch against stale or superseded consent.",
        "pharmacy_control",
        [
            "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentCheckpoint",
            "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentRevocationRecord",
            "data/analysis/pharmacy_referral_transport_decision_register.json",
        ],
        ["EVID_PHARMACY_CONSENT_PLACEHOLDER_V1"],
        ["PROC_PHARMACY_BOUNCE_BACK_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_PHARMACY_DISPATCH_AND_OUTCOME_RECONCILIATION",
        "Dispatch proof, outcome reconciliation, and bounce-back reopen gates must block unsafe auto-close.",
        "pharmacy_control",
        [
            "blueprint/phase-0-the-foundation-protocol.md#PharmacyDispatchSettlement",
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
            "blueprint/phase-6-the-pharmacy-loop.md#PharmacyBounceBackRecord",
        ],
        ["EVID_PHARMACY_RECONCILIATION_PLACEHOLDER_V1"],
        ["PROC_PHARMACY_BOUNCE_BACK_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_SUPPORT_REPLAY_RESTORE",
        "SupportReplayRestoreSettlement and InvestigationScopeEnvelope must fence replay and resend repair work.",
        "support_control",
        [
            "blueprint/phase-0-the-foundation-protocol.md#SupportReplayRestoreSettlement",
            "blueprint/phase-9-the-assurance-ledger.md#InvestigationScopeEnvelope",
            "blueprint/phase-9-the-assurance-ledger.md#InvestigationTimelineReconstruction",
        ],
        ["EVID_SUPPORT_REPLAY_VALIDATION"],
        ["PROC_SUPPORT_REPLAY_SCOPE_REVIEW"],
    ),
    control_item(
        "CTRL_ASSISTIVE_TRUST_AND_HUMAN_APPROVAL",
        "AssistiveCapabilityTrustEnvelope and HumanApprovalGateAssessment must fence any assistive suggestion or writeback path.",
        "assistive_control",
        [
            "blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
            "blueprint/phase-8-the-assistive-layer.md#HumanApprovalGateAssessment",
            "blueprint/phase-0-the-foundation-protocol.md#AssistiveFeedbackChain",
        ],
        ["EVID_ASSISTIVE_APPROVAL_GRAPH_PLACEHOLDER_V1", "EVID_ASSISTIVE_SHADOW_SLICE_PLACEHOLDER_V1"],
        ["PROC_ASSISTIVE_RELEASE_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_NO_SELF_APPROVAL_RELEASE_GRAPH",
        "No self-approval and independent safety signoff must be enforced for high-severity safety changes.",
        "governance_control",
        [
            "blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph",
            "blueprint/phase-8-the-assistive-layer.md#No self-approval and independent safety signoff",
            "blueprint/phase-9-the-assurance-ledger.md#Pack generation and export must be deterministic",
        ],
        ["EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1"],
        ["PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_ASSURANCE_LEDGER_PACKAGING",
        "AssuranceEvidenceGraphSnapshot must preserve deterministic packaging and evidence completeness.",
        "assurance_control",
        [
            "blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot",
            "blueprint/phase-9-the-assurance-ledger.md#packVersionHash",
            "data/analysis/external_assurance_obligations.csv",
        ],
        ["EVID_ASSURANCE_GRAPH_PLACEHOLDER_V1"],
        ["PROC_ANNUAL_BASELINE_REVIEW"],
        status="placeholder_seed_control",
    ),
    control_item(
        "CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD",
        "Each material change must update the hazard register or record an explicit non-applicability decision.",
        "change_control",
        [
            "data/analysis/master_risk_register.json",
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
        ],
        ["EVID_CHANGE_DELTA_RECORD"],
        ["PROC_CHANGE_NON_APPLICABILITY_DECISION"],
    ),
    control_item(
        "CTRL_WORKSPACE_TRUST_ENVELOPE",
        "WorkspaceTrustEnvelope must block calm or writable posture when review truth drifts.",
        "workspace_control",
        [
            "blueprint/phase-0-the-foundation-protocol.md#WorkspaceTrustEnvelope",
            "blueprint/phase-0-the-foundation-protocol.md#DecisionDock",
            "blueprint/phase-0-the-foundation-protocol.md#SelectedAnchor",
        ],
        ["EVID_WORKSPACE_TRUST_VALIDATION"],
        ["PROC_RELEASE_PUBLICATION_DRIFT_REVIEW"],
    ),
]


def evidence_item(
    evidence_id: str,
    title: str,
    owner_role: str,
    state: str,
    refs: list[str],
    task_refs: list[str],
) -> dict[str, Any]:
    return {
        "evidence_id": evidence_id,
        "evidence_title": title,
        "owner_role": owner_role,
        "evidence_state": state,
        "source_or_artifact_refs": refs,
        "task_refs": task_refs,
    }


EVIDENCE_CATALOG = [
    evidence_item(
        "EVID_DCB0129_SEED_PACK_V1",
        "This task's DCB0129 seed pack and validator output.",
        "ROLE_CLINICAL_SAFETY_COORDINATOR",
        "seeded_current",
        [
            "docs/assurance/121_dcb0129_clinical_risk_management_plan.md",
            "data/assurance/dcb0129_hazard_register.json",
            "tools/assurance/validate_dcb0129_seed_pack.py",
        ],
        [TASK_ID],
    ),
    evidence_item(
        "EVID_IDENTITY_REPAIR_VALIDATION",
        "Identity repair and reachability validation evidence.",
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "available_upstream",
        [
            "data/analysis/identity_repair_casebook.json",
            "tools/analysis/validate_identity_repair_and_reachability.py",
        ],
        ["par_068"],
    ),
    evidence_item(
        "EVID_ACCESS_GRANT_VALIDATION",
        "Access-grant validation evidence for grant and callback fencing.",
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "available_upstream",
        [
            "data/analysis/access_grant_runtime_tuple_manifest.json",
            "tools/analysis/validate_access_grant_service.py",
        ],
        ["par_067"],
    ),
    evidence_item(
        "EVID_EVIDENCE_ASSIMILATION_VALIDATION",
        "Evidence assimilation and safety orchestrator validation output.",
        "ROLE_TRIAGE_RULESET_OWNER",
        "available_upstream",
        [
            "data/analysis/evidence_assimilation_casebook.json",
            "tools/analysis/validate_assimilation_and_safety.py",
        ],
        ["par_079"],
    ),
    evidence_item(
        "EVID_DUPLICATE_CLUSTER_VALIDATION",
        "Duplicate cluster and resolution validation output.",
        "ROLE_PRODUCT_SAFETY_APPROVER",
        "available_upstream",
        [
            "data/analysis/duplicate_cluster_manifest.json",
            "tools/analysis/validate_duplicate_models.py",
        ],
        ["seq_068"],
    ),
    evidence_item(
        "EVID_MUTATION_GATE_VALIDATION",
        "Scoped mutation gate validation output.",
        "ROLE_RELEASE_MANAGER",
        "available_upstream",
        [
            "data/analysis/live_mutation_gate_rules.json",
            "tools/analysis/validate_scoped_mutation_gate.py",
        ],
        ["par_056"],
    ),
    evidence_item(
        "EVID_REACHABILITY_VALIDATION",
        "Reachability model validation output.",
        "ROLE_SUPPORT_WORKFLOW_LEAD",
        "available_upstream",
        [
            "data/analysis/contact_route_snapshot_manifest.json",
            "tools/analysis/validate_reachability_models.py",
        ],
        ["par_066"],
    ),
    evidence_item(
        "EVID_COMMUNICATION_ENVELOPE_VALIDATION",
        "Communication and callback envelope control placeholder seeded from the canonical communication model.",
        "ROLE_SUPPORT_WORKFLOW_LEAD",
        "placeholder_seeded",
        ["blueprint/phase-0-the-foundation-protocol.md#CommunicationEnvelope"],
        ["phase_2_follow_on"],
    ),
    evidence_item(
        "EVID_TELEPHONY_READINESS_VALIDATION",
        "Telephony readiness lab output and validator.",
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "available_upstream",
        [
            "data/analysis/32_telephony_lab_pack.json",
            "tools/analysis/validate_telephony_lab_pack.py",
        ],
        ["seq_032"],
    ),
    evidence_item(
        "EVID_RESERVATION_QUEUE_VALIDATION",
        "Reservation and queue-control validation output.",
        "ROLE_BOOKING_DOMAIN_LEAD",
        "available_upstream",
        [
            "data/analysis/capacity_reservation_manifest.json",
            "tools/analysis/validate_reservation_authority_and_queue_ranking.py",
        ],
        ["par_081"],
    ),
    evidence_item(
        "EVID_BOOKING_CAPABILITY_PROOF",
        "Booking capability evidence bundle.",
        "ROLE_BOOKING_DOMAIN_LEAD",
        "available_upstream",
        ["data/analysis/gp_booking_capability_evidence.json"],
        ["seq_063"],
    ),
    evidence_item(
        "EVID_GATEWAY_SURFACE_VALIDATION",
        "Gateway surface validation output used by runtime/publication controls.",
        "ROLE_RELEASE_MANAGER",
        "available_upstream",
        [
            "data/analysis/gateway_surface_manifest.json",
            "tools/analysis/validate_gateway_surfaces.py",
        ],
        ["par_090"],
    ),
    evidence_item(
        "EVID_RELEASE_PARITY_VALIDATION",
        "Release publication parity and runtime publication validation output.",
        "ROLE_RELEASE_MANAGER",
        "available_upstream",
        [
            "data/analysis/release_publication_parity_records.json",
            "tools/analysis/validate_runtime_publication_bundle.py",
        ],
        ["par_094"],
    ),
    evidence_item(
        "EVID_HUB_POLICY_PLACEHOLDER_V1",
        "Hub coordination safety evidence placeholder pending the named hub policy pack.",
        "ROLE_NETWORK_COORDINATION_LEAD",
        "placeholder_seeded",
        [
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "data/analysis/hub_option_and_timer_matrix.csv",
        ],
        ["phase_5_follow_on"],
    ),
    evidence_item(
        "EVID_PHARMACY_CONSENT_PLACEHOLDER_V1",
        "Pharmacy consent checkpoint evidence placeholder seeded against the transport decision register.",
        "ROLE_PHARMACY_DOMAIN_LEAD",
        "placeholder_seeded",
        [
            "data/analysis/pharmacy_referral_transport_decision_register.json",
            "data/analysis/pharmacy_provider_assurance_gaps.json",
        ],
        ["phase_6_follow_on"],
    ),
    evidence_item(
        "EVID_PHARMACY_RECONCILIATION_PLACEHOLDER_V1",
        "Pharmacy outcome reconciliation evidence placeholder.",
        "ROLE_PHARMACY_DOMAIN_LEAD",
        "placeholder_seeded",
        [
            "data/analysis/pharmacy_update_record_path_matrix.csv",
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
        ],
        ["phase_6_follow_on"],
    ),
    evidence_item(
        "EVID_SUPPORT_REPLAY_VALIDATION",
        "Support replay restore control evidence.",
        "ROLE_SUPPORT_WORKFLOW_LEAD",
        "available_upstream",
        [
            "data/analysis/domain_package_manifest.json",
            "tools/analysis/validate_request_lineage_model.py",
        ],
        ["seq_005", "seq_091"],
    ),
    evidence_item(
        "EVID_ASSISTIVE_APPROVAL_GRAPH_PLACEHOLDER_V1",
        "Assistive approval graph placeholder requiring independent safety signoff before live visible assistive change.",
        "ROLE_ASSISTIVE_SAFETY_COORDINATOR",
        "placeholder_seeded",
        ["blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph"],
        ["phase_8_follow_on"],
    ),
    evidence_item(
        "EVID_ASSISTIVE_SHADOW_SLICE_PLACEHOLDER_V1",
        "Assistive shadow-slice and rollout proof placeholder.",
        "ROLE_ASSISTIVE_SAFETY_COORDINATOR",
        "placeholder_seeded",
        ["blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityRolloutVerdict"],
        ["phase_8_follow_on"],
    ),
    evidence_item(
        "EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1",
        "Release approval graph placeholder used by no-self-approval policy.",
        "ROLE_RELEASE_MANAGER",
        "placeholder_seeded",
        ["blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph"],
        ["phase_8_follow_on", "par_125"],
    ),
    evidence_item(
        "EVID_ASSURANCE_GRAPH_PLACEHOLDER_V1",
        "Assurance evidence graph placeholder for later deterministic pack export.",
        "ROLE_CLINICAL_SAFETY_COORDINATOR",
        "placeholder_seeded",
        ["blueprint/phase-9-the-assurance-ledger.md#AssuranceEvidenceGraphSnapshot"],
        ["phase_9_follow_on"],
    ),
    evidence_item(
        "EVID_CHANGE_DELTA_RECORD",
        "Hazard delta or non-applicability entry required on every material safety change.",
        "ROLE_CLINICAL_SAFETY_COORDINATOR",
        "seeded_current",
        [
            "docs/assurance/121_change_control_and_safety_update_workflow.md",
            "data/assurance/dcb0129_review_events.json",
        ],
        [TASK_ID],
    ),
    evidence_item(
        "EVID_WORKSPACE_TRUST_VALIDATION",
        "Workspace trust envelope validation evidence.",
        "ROLE_RELEASE_MANAGER",
        "available_upstream",
        [
            "tools/analysis/validate_governance_shell_seed_routes.py",
            "tools/analysis/validate_operations_shell_seed_routes.py",
        ],
        ["par_117", "par_119"],
    ),
]


def procedure_item(procedure_id: str, title: str, owner_role: str, summary: str) -> dict[str, Any]:
    return {
        "procedure_id": procedure_id,
        "procedure_title": title,
        "owner_role": owner_role,
        "summary": summary,
    }


PROCEDURE_CATALOG = [
    procedure_item(
        "PROC_ANNUAL_BASELINE_REVIEW",
        "Annual DCB0129 baseline review",
        "ROLE_MANUFACTURER_CSO",
        "Review the whole seed pack, standards baseline, hazards, controls, evidence state, and renewal dates.",
    ),
    procedure_item(
        "PROC_RULESET_CHANGE_DELTA_REVIEW",
        "Ruleset change safety delta review",
        "ROLE_TRIAGE_RULESET_OWNER",
        "Any material rule, threshold, or evidence-classification change must update the hazard log or record non-applicability.",
    ),
    procedure_item(
        "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW",
        "Independent review for high-severity safety changes",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        "High-severity hazards and changes require an independent reviewer and no self-approval.",
    ),
    procedure_item(
        "PROC_RELEASE_PUBLICATION_DRIFT_REVIEW",
        "Release/publication drift review",
        "ROLE_RELEASE_MANAGER",
        "Freeze writable posture and re-review parity when runtime publication, manifests, or bundles drift.",
    ),
    procedure_item(
        "PROC_IDENTITY_REPAIR_ESCALATION",
        "Identity repair escalation",
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "Open identity hold, freeze downstream actions, and confirm release settlement before recovery.",
    ),
    procedure_item(
        "PROC_CALLBACK_PROMISE_REPAIR",
        "Callback promise and more-info repair",
        "ROLE_SUPPORT_WORKFLOW_LEAD",
        "If a promised callback or follow-up path becomes unsafe, reopen the same case and repair reachability or guidance truth.",
    ),
    procedure_item(
        "PROC_TELEPHONY_PATH_CHANGE_REVIEW",
        "Telephony path change review",
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "Review evidence-readiness, continuation, and callback replay protections on telephony changes.",
    ),
    procedure_item(
        "PROC_BOOKING_AND_NETWORK_POLICY_REVIEW",
        "Booking and network safety policy review",
        "ROLE_BOOKING_DOMAIN_LEAD",
        "Review confirmation, waitlist fallback, alternative expiry, and hub visibility rules whenever booking/network logic changes.",
    ),
    procedure_item(
        "PROC_PHARMACY_BOUNCE_BACK_REVIEW",
        "Pharmacy bounce-back and reconciliation review",
        "ROLE_PHARMACY_DOMAIN_LEAD",
        "Review consent, dispatch proof, reconciliation, and bounce-back reopen logic before case close is allowed.",
    ),
    procedure_item(
        "PROC_SUPPORT_REPLAY_SCOPE_REVIEW",
        "Support replay scope and resend review",
        "ROLE_SUPPORT_WORKFLOW_LEAD",
        "Confirm scope, masking, and stale-truth fences before support replay or resend actions become live.",
    ),
    procedure_item(
        "PROC_ASSISTIVE_RELEASE_REVIEW",
        "Assistive safety release review",
        "ROLE_ASSISTIVE_SAFETY_COORDINATOR",
        "Visible assistive changes require trust-envelope review, no self-approval, and independent safety signoff.",
    ),
    procedure_item(
        "PROC_CHANGE_NON_APPLICABILITY_DECISION",
        "Safety non-applicability decision",
        "ROLE_CLINICAL_SAFETY_COORDINATOR",
        "A change may close only after a hazard delta or explicit non-applicability record is attached.",
    ),
    procedure_item(
        "PROC_POST_INCIDENT_RETRO_REVIEW",
        "Post-incident clinical safety retro",
        "ROLE_MANUFACTURER_CSO",
        "Any incident or near miss touching a seeded hazard must reopen hazard review and residual-risk assessment.",
    ),
]


def trigger_item(trigger_id: str, title: str, source_refs: list[str], review_owner_role: str) -> dict[str, Any]:
    return {
        "trigger_id": trigger_id,
        "trigger_title": title,
        "source_refs": source_refs,
        "review_owner_role": review_owner_role,
    }


CHANGE_TRIGGER_CATALOG = [
    trigger_item(
        "TRIGGER_RULESET_CHANGE",
        "Clinical ruleset, classification, or threshold change",
        [
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceAssimilationRecord",
        ],
        "ROLE_TRIAGE_RULESET_OWNER",
    ),
    trigger_item(
        "TRIGGER_IDENTITY_PROVIDER_CHANGE",
        "Identity provider, callback, secure-link, or binding flow change",
        [
            "blueprint/phase-2-identity-and-echoes.md#IdentityBindingAuthority",
            "blueprint/phase-2-identity-and-echoes.md#callback replay protection",
        ],
        "ROLE_IDENTITY_DOMAIN_LEAD",
    ),
    trigger_item(
        "TRIGGER_TELEPHONY_PATH_CHANGE",
        "Telephony capture, readiness, or continuation path change",
        [
            "blueprint/phase-2-identity-and-echoes.md#TelephonyEvidenceReadinessAssessment",
            "blueprint/phase-2-identity-and-echoes.md#telephony-evidence-readiness gating tests",
        ],
        "ROLE_IDENTITY_DOMAIN_LEAD",
    ),
    trigger_item(
        "TRIGGER_BOOKING_POLICY_CHANGE",
        "Booking, reservation, or confirmation logic change",
        [
            "blueprint/phase-0-the-foundation-protocol.md#BookingConfirmationTruthProjection",
            "blueprint/phase-4-the-booking-engine.md#booking confirmation",
        ],
        "ROLE_BOOKING_DOMAIN_LEAD",
    ),
    trigger_item(
        "TRIGGER_NETWORK_POLICY_CHANGE",
        "Network alternative ranking, expiry, or hub visibility change",
        [
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "blueprint/phase-0-the-foundation-protocol.md#HubPracticeVisibilityPolicy",
        ],
        "ROLE_NETWORK_COORDINATION_LEAD",
    ),
    trigger_item(
        "TRIGGER_PHARMACY_FLOW_CHANGE",
        "Pharmacy consent, dispatch, or outcome reconciliation change",
        [
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
            "blueprint/phase-6-the-pharmacy-loop.md#Practice visibility, operations queue, and pharmacy exception handling",
        ],
        "ROLE_PHARMACY_DOMAIN_LEAD",
    ),
    trigger_item(
        "TRIGGER_SUPPORT_REPLAY_CHANGE",
        "Support replay, resend, or contact-route repair change",
        [
            "blueprint/phase-9-the-assurance-ledger.md#InvestigationScopeEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
        ],
        "ROLE_SUPPORT_WORKFLOW_LEAD",
    ),
    trigger_item(
        "TRIGGER_RELEASE_PUBLICATION_DRIFT",
        "Runtime publication, release parity, or environment drift",
        [
            "blueprint/phase-0-the-foundation-protocol.md#ReleasePublicationParityRecord",
            "blueprint/phase-9-the-assurance-ledger.md#Pack generation and export must be deterministic",
        ],
        "ROLE_RELEASE_MANAGER",
    ),
    trigger_item(
        "TRIGGER_ASSISTIVE_POLICY_CHANGE",
        "Assistive visible-slice, trust, approval, or rollout policy change",
        [
            "blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph",
            "blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
        ],
        "ROLE_ASSISTIVE_SAFETY_COORDINATOR",
    ),
    trigger_item(
        "TRIGGER_INCIDENT_OR_NEAR_MISS",
        "Clinical safety incident, near miss, or audit finding mapped to an existing hazard family",
        [
            "blueprint/phase-9-the-assurance-ledger.md#Assurance ledger, evidence graph, and operational state contracts",
            "blueprint/forensic-audit-findings.md#Finding 91 - Stale writable posture",
        ],
        "ROLE_MANUFACTURER_CSO",
    ),
]


def review_event(
    review_event_id: str,
    title: str,
    review_type: str,
    cadence_days: int | None,
    trigger_refs: list[str],
    owner_role: str,
    independent_reviewer_role: str,
    linked_path_ids: list[str],
) -> dict[str, Any]:
    return {
        "review_event_id": review_event_id,
        "review_event_title": title,
        "review_type": review_type,
        "cadence_days": cadence_days,
        "trigger_refs": trigger_refs,
        "owner_role": owner_role,
        "independent_reviewer_role": independent_reviewer_role,
        "linked_change_control_paths": linked_path_ids,
        "requires_hazard_update": True,
        "supports_non_applicability_record": True,
        "no_self_approval": True,
        "required_close_tokens": ["hazard_register_updated", "evidence_refs_refreshed", "safety_case_delta_recorded"],
        "alternative_close_tokens": ["non_applicability_recorded"],
    }


CHANGE_CONTROL_PATHS = [
    {
        "path_id": "PATH_RULESET_CHANGE",
        "path_title": "Clinical ruleset and safety-threshold change",
        "trigger_refs": ["TRIGGER_RULESET_CHANGE"],
        "required_steps": [
            "impact_triage",
            "hazard_delta_or_non_applicability_record",
            "test_evidence_refresh",
            "independent_review_if_high_severity",
            "safety_case_delta_record",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed", "safety_case_delta_recorded"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "high",
    },
    {
        "path_id": "PATH_IDENTITY_AND_TELEPHONY_CHANGE",
        "path_title": "Identity, callback, secure-link, or telephony safety change",
        "trigger_refs": ["TRIGGER_IDENTITY_PROVIDER_CHANGE", "TRIGGER_TELEPHONY_PATH_CHANGE"],
        "required_steps": [
            "binding_and_callback_impact_check",
            "hazard_delta_or_non_applicability_record",
            "repair_and_replay_test_refresh",
            "independent_review_if_high_severity",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "high",
    },
    {
        "path_id": "PATH_BOOKING_AND_NETWORK_CHANGE",
        "path_title": "Booking, reservation, network alternative, or hub visibility change",
        "trigger_refs": ["TRIGGER_BOOKING_POLICY_CHANGE", "TRIGGER_NETWORK_POLICY_CHANGE"],
        "required_steps": [
            "capability_and_visibility_review",
            "hazard_delta_or_non_applicability_record",
            "fallback_and_confirmation_test_refresh",
            "independent_review_if_high_severity",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed", "safety_case_delta_recorded"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "high",
    },
    {
        "path_id": "PATH_PHARMACY_CHANGE",
        "path_title": "Pharmacy consent, dispatch, reconciliation, or bounce-back change",
        "trigger_refs": ["TRIGGER_PHARMACY_FLOW_CHANGE"],
        "required_steps": [
            "consent_and_dispatch_truth_review",
            "hazard_delta_or_non_applicability_record",
            "reconciliation_and_reopen_test_refresh",
            "independent_review_if_high_severity",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed", "safety_case_delta_recorded"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "high",
    },
    {
        "path_id": "PATH_SUPPORT_AND_RELEASE_DRIFT",
        "path_title": "Support replay, resend, or release/publication drift change",
        "trigger_refs": ["TRIGGER_SUPPORT_REPLAY_CHANGE", "TRIGGER_RELEASE_PUBLICATION_DRIFT"],
        "required_steps": [
            "scope_and_publication_parity_review",
            "hazard_delta_or_non_applicability_record",
            "restore_and_runtime_validation_refresh",
            "independent_review_if_high_severity",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "high",
    },
    {
        "path_id": "PATH_ASSISTIVE_RELEASE_CHANGE",
        "path_title": "Assistive visible-slice or approval-graph change",
        "trigger_refs": ["TRIGGER_ASSISTIVE_POLICY_CHANGE"],
        "required_steps": [
            "approval_graph_refresh",
            "hazard_delta_or_non_applicability_record",
            "trust_and_disclosure_evidence_refresh",
            "independent_review_required",
        ],
        "close_tokens": ["hazard_register_updated", "evidence_refs_refreshed", "safety_case_delta_recorded"],
        "alternative_close_tokens": ["non_applicability_recorded"],
        "no_self_approval": True,
        "independent_review_required_if_residual_risk_band_at_least": "medium",
    },
]

REVIEW_EVENTS = [
    review_event(
        "REV_ANNUAL_BASELINE_REVIEW",
        "Annual DCB0129 baseline review",
        "scheduled",
        365,
        ["TRIGGER_INCIDENT_OR_NEAR_MISS"],
        "ROLE_MANUFACTURER_CSO",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_RULESET_CHANGE", "PATH_BOOKING_AND_NETWORK_CHANGE", "PATH_PHARMACY_CHANGE"],
    ),
    review_event(
        "REV_RULESET_CHANGE_DELTA",
        "Clinical ruleset delta review",
        "change_triggered",
        None,
        ["TRIGGER_RULESET_CHANGE"],
        "ROLE_TRIAGE_RULESET_OWNER",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_RULESET_CHANGE"],
    ),
    review_event(
        "REV_IDENTITY_AND_TELEPHONY_CHANGE",
        "Identity, callback, and telephony safety review",
        "change_triggered",
        None,
        ["TRIGGER_IDENTITY_PROVIDER_CHANGE", "TRIGGER_TELEPHONY_PATH_CHANGE"],
        "ROLE_IDENTITY_DOMAIN_LEAD",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_IDENTITY_AND_TELEPHONY_CHANGE"],
    ),
    review_event(
        "REV_BOOKING_AND_NETWORK_CHANGE",
        "Booking and network safety review",
        "change_triggered",
        None,
        ["TRIGGER_BOOKING_POLICY_CHANGE", "TRIGGER_NETWORK_POLICY_CHANGE"],
        "ROLE_BOOKING_DOMAIN_LEAD",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_BOOKING_AND_NETWORK_CHANGE"],
    ),
    review_event(
        "REV_PHARMACY_CHANGE",
        "Pharmacy safety review",
        "change_triggered",
        None,
        ["TRIGGER_PHARMACY_FLOW_CHANGE"],
        "ROLE_PHARMACY_DOMAIN_LEAD",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_PHARMACY_CHANGE"],
    ),
    review_event(
        "REV_SUPPORT_AND_RELEASE_DRIFT",
        "Support replay and publication drift review",
        "change_triggered",
        None,
        ["TRIGGER_SUPPORT_REPLAY_CHANGE", "TRIGGER_RELEASE_PUBLICATION_DRIFT"],
        "ROLE_RELEASE_MANAGER",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_SUPPORT_AND_RELEASE_DRIFT"],
    ),
    review_event(
        "REV_ASSISTIVE_RELEASE_CHANGE",
        "Assistive release and approval review",
        "change_triggered",
        None,
        ["TRIGGER_ASSISTIVE_POLICY_CHANGE"],
        "ROLE_ASSISTIVE_SAFETY_COORDINATOR",
        "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        ["PATH_ASSISTIVE_RELEASE_CHANGE"],
    ),
]

HAZARD_TAXONOMY = [
    {
        "hazard_family": "identity_authorization",
        "family_title": "Identity and authorization hazards",
        "family_summary": "Wrong-subject binding, callback or secure-link confusion, and access-scope drift that can expose or act on the wrong record.",
        "source_refs": [
            "blueprint/phase-2-identity-and-echoes.md#IdentityBindingAuthority",
            "blueprint/phase-0-the-foundation-protocol.md#AccessGrantScopeEnvelope",
        ],
    },
    {
        "hazard_family": "safety_screening_triage",
        "family_title": "Safety-screening and triage hazards",
        "family_summary": "Urgent-diversion miss, delayed re-safety, or fail-open classification when clinically meaningful evidence arrives.",
        "source_refs": [
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceAssimilationRecord",
        ],
    },
    {
        "hazard_family": "workflow_concurrency_replay",
        "family_title": "Workflow, concurrency, and replay hazards",
        "family_summary": "Silent merge, wrong-lineage attach, stale decision epoch, or duplicate/replay collisions that produce unsafe actions.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#DuplicateResolutionDecision",
            "blueprint/forensic-audit-findings.md#Finding 91 - Stale writable posture",
        ],
    },
    {
        "hazard_family": "booking_network_pharmacy",
        "family_title": "Booking, network, and pharmacy hazards",
        "family_summary": "Unsafe booking reassurance, wrong-site offers, missing fallback, consent drift, weak dispatch proof, or unsafe pharmacy close.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
        ],
    },
    {
        "hazard_family": "visibility_runtime_publication",
        "family_title": "Visibility, runtime, and publication hazards",
        "family_summary": "Stale runtime publication, drifted writable posture, or false calmness caused by publication/runtime mismatch.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ReleasePublicationParityRecord",
            "blueprint/phase-9-the-assurance-ledger.md#Projection integrity is a separate quantity, not a UI styling choice",
        ],
    },
    {
        "hazard_family": "communications_reachability",
        "family_title": "Communications and reachability hazards",
        "family_summary": "Promised callback or more-info paths failing after patient expectation has been set, or wrong-subject resend/repair actions.",
        "source_refs": [
            "blueprint/phase-2-identity-and-echoes.md#callback replay protection",
            "blueprint/phase-0-the-foundation-protocol.md#ReachabilityDependency",
        ],
    },
    {
        "hazard_family": "assistive_change_control",
        "family_title": "Future assistive and change-control hazards",
        "family_summary": "Deferred-but-known hazards where assistive suggestions, rollout, or approval posture could bypass human checkpoint and independent review.",
        "source_refs": [
            "blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph",
            "blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
        ],
    },
]


def hazard_item(
    *,
    hazard_id: str,
    hazard_title: str,
    hazard_family: str,
    phase_scope: list[str],
    source_blueprint_refs: list[str],
    hazard_description: str,
    trigger_condition: str,
    failure_mode: str,
    clinical_harm_path: str,
    affected_actor_types: list[str],
    affected_channels: list[str],
    affected_objects: list[str],
    causal_controls_existing: list[str],
    causal_controls_required: list[str],
    verification_evidence_refs: list[str],
    residual_risk_statement: str,
    severity_band: str,
    likelihood_band: str,
    initial_risk_band: str,
    residual_risk_band: str,
    review_owner_role: str,
    independent_reviewer_role: str,
    status: str,
    change_trigger_refs: list[str],
    notes: str,
    canonical_invariant_refs: list[str],
    platform_service_refs: list[str],
    route_runtime_publication_control_refs: list[str],
    operational_procedure_refs: list[str],
) -> dict[str, Any]:
    return {
        "hazard_id": hazard_id,
        "hazard_title": hazard_title,
        "hazard_family": hazard_family,
        "phase_scope": phase_scope,
        "source_blueprint_refs": source_blueprint_refs,
        "hazard_description": hazard_description,
        "trigger_condition": trigger_condition,
        "failure_mode": failure_mode,
        "clinical_harm_path": clinical_harm_path,
        "affected_actor_types": affected_actor_types,
        "affected_channels": affected_channels,
        "affected_objects": affected_objects,
        "causal_controls_existing": causal_controls_existing,
        "causal_controls_required": causal_controls_required,
        "verification_evidence_refs": verification_evidence_refs,
        "residual_risk_statement": residual_risk_statement,
        "severity_band": severity_band,
        "likelihood_band": likelihood_band,
        "initial_risk_band": initial_risk_band,
        "residual_risk_band": residual_risk_band,
        "review_owner_role": review_owner_role,
        "independent_reviewer_role": independent_reviewer_role,
        "status": status,
        "last_reviewed_at": BASELINE_DATE,
        "next_review_due_at": DEFAULT_NEXT_REVIEW,
        "change_trigger_refs": change_trigger_refs,
        "notes": notes,
        "standards_version": STANDARDS_VERSION["baseline_id"],
        "review_note": DEFAULT_REVIEW_NOTE,
        "canonical_invariant_refs": canonical_invariant_refs,
        "platform_service_refs": platform_service_refs,
        "route_runtime_publication_control_refs": route_runtime_publication_control_refs,
        "operational_procedure_refs": operational_procedure_refs,
    }


HAZARDS = [
    hazard_item(
        hazard_id="HZ-121-001",
        hazard_title="Wrong-patient identity binding or correction failure allows care actions on the wrong subject.",
        hazard_family="identity_authorization",
        phase_scope=["phase0", "phase1", "phase2"],
        source_blueprint_refs=[
            "blueprint/phase-2-identity-and-echoes.md#IdentityBindingAuthority",
            "blueprint/phase-2-identity-and-echoes.md#IdentityRepairFreezeRecord",
            "blueprint/phase-0-the-foundation-protocol.md#AccessGrantScopeEnvelope",
        ],
        hazard_description=(
            "A callback, telephony verification, secure-link uplift, or support correction binds or re-exposes a "
            "request to the wrong patient, or fails to hold the lineage in identity repair while correction is in progress."
        ),
        trigger_condition=(
            "Any identity, callback, or secure-link flow observes subject conflict, stale binding, or binding supersession."
        ),
        failure_mode=(
            "Wrong subject remains bound, or a superseded binding is treated as current and writable."
        ),
        clinical_harm_path=(
            "Wrong patient receives advice, follow-up, booking, or disclosure; the right patient may miss urgent or routine care."
        ),
        affected_actor_types=["patient", "staff_reviewer", "support_operator", "hub_coordinator", "pharmacist"],
        affected_channels=["browser", "secure_link", "telephony", "support_console"],
        affected_objects=["RequestLineage", "IdentityBinding", "IdentityRepairCase", "AccessGrant"],
        causal_controls_existing=["CTRL_IDENTITY_REPAIR_FREEZE", "CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_IDENTITY_REPAIR_VALIDATION", "EVID_ACCESS_GRANT_VALIDATION"],
        residual_risk_statement=(
            "Residual risk remains medium until named CSO and independent reviewer roles are attached to live onboarding and "
            "identity repair evidence is rehearsed with real provider callbacks."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="extreme",
        residual_risk_band="medium",
        review_owner_role="ROLE_MANUFACTURER_CSO",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_IDENTITY_PROVIDER_CHANGE", "TRIGGER_TELEPHONY_PATH_CHANGE"],
        notes="Primary manufacturer-side identity hazard seed.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#Mutate only current truth",
            "blueprint/phase-2-identity-and-echoes.md#IdentityBindingAuthority",
        ],
        platform_service_refs=["IdentityBindingAuthority", "AccessGrantService"],
        route_runtime_publication_control_refs=[
            "AudienceSurfaceRuntimeBinding",
            "ReleasePublicationParityRecord",
        ],
        operational_procedure_refs=["PROC_IDENTITY_REPAIR_ESCALATION", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-002",
        hazard_title="Urgent-diversion miss or delayed safety preemption after clinically meaningful evidence changes.",
        hazard_family="safety_screening_triage",
        phase_scope=["phase0", "phase1", "phase2", "phase4", "phase5", "phase6"],
        source_blueprint_refs=[
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
            "blueprint/phase-0-the-foundation-protocol.md#EvidenceAssimilationRecord",
            "blueprint/phase-0-the-foundation-protocol.md#SafetyPreemptionRecord",
        ],
        hazard_description=(
            "Later evidence, extractor disagreement, or contradiction arrives after a calm state has already been shown, but "
            "the platform does not reopen safety or blocks urgent diversion too late."
        ),
        trigger_condition=(
            "Any patient reply, callback outcome, pharmacy return, support capture, or late artifact is classified as "
            "potentially clinical or contact-safety-relevant."
        ),
        failure_mode=(
            "Evidence is misclassified or no new safety epoch is opened, so routine flow continues after a safety-relevant change."
        ),
        clinical_harm_path=(
            "Urgent case remains in routine flow, or staff/patient are falsely reassured while clinically meaningful change has not been re-reviewed."
        ),
        affected_actor_types=["patient", "triage_reviewer", "support_operator", "booking_coordinator"],
        affected_channels=["browser", "telephony", "secure_link", "support_console"],
        affected_objects=["EvidenceAssimilationRecord", "MaterialDeltaAssessment", "SafetyDecisionRecord", "Request"],
        causal_controls_existing=["CTRL_EVIDENCE_ASSIMILATION_PREEMPTION"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_EVIDENCE_ASSIMILATION_VALIDATION", "EVID_CHANGE_DELTA_RECORD"],
        residual_risk_statement=(
            "Residual risk remains medium until challenge-set evidence and named signoff owners are attached to every active rule pack."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="extreme",
        residual_risk_band="medium",
        review_owner_role="ROLE_MANUFACTURER_CSO",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_RULESET_CHANGE", "TRIGGER_INCIDENT_OR_NEAR_MISS"],
        notes="Seed hazard for red-flag monotonicity and incremental ruleset evidence.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#Mandatory preemption rule",
            "blueprint/phase-1-the-red-flag-gate.md#full rule decision-table coverage",
        ],
        platform_service_refs=["EvidenceAssimilationCoordinator", "SafetyPolicyEngine"],
        route_runtime_publication_control_refs=["StatusStripAuthority", "WorkspaceTrustEnvelope"],
        operational_procedure_refs=["PROC_RULESET_CHANGE_DELTA_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-003",
        hazard_title="Duplicate silent merge or wrong-lineage attach hides distinct clinical work.",
        hazard_family="workflow_concurrency_replay",
        phase_scope=["phase0", "phase1", "phase2"],
        source_blueprint_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#DuplicateResolutionDecision",
            "blueprint/phase-2-identity-and-echoes.md#same_episode_candidate",
            "blueprint/forensic-audit-findings.md#Finding 91 - Stale writable posture",
        ],
        hazard_description=(
            "Replay, duplicate clustering, or same-episode linkage silently collapses distinct clinical intent or evidence into an existing request."
        ),
        trigger_condition=(
            "Identifier reuse, callback replay, telephony continuation, or same-request attach evaluation runs against an ambiguous candidate set."
        ),
        failure_mode=(
            "The platform auto-merges, auto-attaches, or preserves stale reviewer context without governed duplicate evidence and decision fencing."
        ),
        clinical_harm_path=(
            "Distinct request disappears, safety state is inherited from the wrong lineage, or patient communications and downstream actions target the wrong work item."
        ),
        affected_actor_types=["patient", "triage_reviewer", "support_operator"],
        affected_channels=["browser", "telephony", "support_console"],
        affected_objects=["DuplicateCluster", "DuplicatePairEvidence", "DuplicateResolutionDecision", "RequestLineage"],
        causal_controls_existing=["CTRL_DUPLICATE_ATTACH_FENCE", "CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_DUPLICATE_CLUSTER_VALIDATION", "EVID_CHANGE_DELTA_RECORD"],
        residual_risk_statement=(
            "Residual risk stays medium because duplicate thresholds and competition margins will still evolve with live traffic."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_MANUFACTURER_CSO",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_IDENTITY_PROVIDER_CHANGE", "TRIGGER_INCIDENT_OR_NEAR_MISS"],
        notes="Bounded from duplicate and replay controls already present in the blueprint and forensic patch set.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#same_request_attach",
            "blueprint/phase-0-the-foundation-protocol.md#ReplayCollisionReview",
        ],
        platform_service_refs=["ReplayCollisionReview", "DuplicateClusterEvaluator"],
        route_runtime_publication_control_refs=["DecisionEpoch", "WorkspaceTrustEnvelope"],
        operational_procedure_refs=["PROC_POST_INCIDENT_RETRO_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-004",
        hazard_title="Stale writable UI or runtime/publication drift enables an unsafe action from stale truth.",
        hazard_family="visibility_runtime_publication",
        phase_scope=["phase0", "phase4", "phase5", "phase6"],
        source_blueprint_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#ReleasePublicationParityRecord",
            "blueprint/phase-0-the-foundation-protocol.md#WorkspaceTrustEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 91 - Stale writable posture",
        ],
        hazard_description=(
            "A surface stays calm or writable after runtime, publication, selected-anchor, or trust truth has drifted away from the active command path."
        ),
        trigger_condition=(
            "Route contract, bundle, selected anchor, publication parity, or review version changes while the operator still has armed controls."
        ),
        failure_mode=(
            "Local UI state or cached publication posture overrides the current release/runtime truth tuple."
        ),
        clinical_harm_path=(
            "Stale action commits booking, messaging, or other care-path change against superseded evidence, ownership, or publication state."
        ),
        affected_actor_types=["staff_reviewer", "hub_coordinator", "pharmacist", "operations_user"],
        affected_channels=["browser", "ops_console", "hub_console", "pharmacy_console"],
        affected_objects=["AudienceSurfaceRuntimeBinding", "ReleasePublicationParityRecord", "WorkspaceTrustEnvelope"],
        causal_controls_existing=[
            "CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH",
            "CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING",
            "CTRL_WORKSPACE_TRUST_ENVELOPE",
        ],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=[
            "EVID_MUTATION_GATE_VALIDATION",
            "EVID_GATEWAY_SURFACE_VALIDATION",
            "EVID_RELEASE_PARITY_VALIDATION",
            "EVID_WORKSPACE_TRUST_VALIDATION",
        ],
        residual_risk_statement=(
            "Residual risk remains medium until every high-impact surface family is proven against the same release/publication tuple in live rehearsal."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_RELEASE_MANAGER",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_RELEASE_PUBLICATION_DRIFT", "TRIGGER_BOOKING_POLICY_CHANGE"],
        notes="Derived through GAP_RESOLUTION_HAZARD_DERIVATION_STALE_WRITABLE_UI_V1.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#Mutate only current truth",
            "blueprint/phase-0-the-foundation-protocol.md#StatusStripAuthority",
        ],
        platform_service_refs=["RuntimePublicationBundle", "StatusStripAuthority"],
        route_runtime_publication_control_refs=[
            "AudienceSurfaceRuntimeBinding",
            "ReleasePublicationParityRecord",
            "WorkspaceTrustEnvelope",
        ],
        operational_procedure_refs=["PROC_RELEASE_PUBLICATION_DRIFT_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-005",
        hazard_title="More-info or callback delay after patient expectation has been set leaves unsafe unanswered need.",
        hazard_family="communications_reachability",
        phase_scope=["phase0", "phase2", "phase4", "phase5", "phase6"],
        source_blueprint_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#ReachabilityDependency",
            "blueprint/phase-0-the-foundation-protocol.md#CommunicationEnvelope",
            "blueprint/phase-2-identity-and-echoes.md#telephony capture failure after patient expectation has been set",
        ],
        hazard_description=(
            "The patient is promised a callback, more-info exchange, or further update, but the platform does not keep the reachability dependency safe when the route degrades."
        ),
        trigger_condition=(
            "A callback expectation, more-info request, or reminder path exists while reachability becomes blocked, stale, disputed, or superseded."
        ),
        failure_mode=(
            "Promise state stays calm, or repair is not opened when the contact route is no longer safe enough for the active dependency."
        ),
        clinical_harm_path=(
            "Patient waits for follow-up that will not happen, urgent change is missed, or care is delayed because the dependency failure is hidden."
        ),
        affected_actor_types=["patient", "support_operator", "staff_reviewer"],
        affected_channels=["browser", "sms", "voice", "email", "support_console"],
        affected_objects=["ReachabilityDependency", "ReachabilityAssessmentRecord", "CommunicationEnvelope"],
        causal_controls_existing=["CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_REACHABILITY_VALIDATION", "EVID_COMMUNICATION_ENVELOPE_VALIDATION"],
        residual_risk_statement=(
            "Residual risk stays medium until contact-route repair is rehearsed across all live provider lanes and promise texts."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_MANUFACTURER_CSO",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_TELEPHONY_PATH_CHANGE", "TRIGGER_SUPPORT_REPLAY_CHANGE"],
        notes="Derived through GAP_RESOLUTION_HAZARD_DERIVATION_CALLBACK_PROMISE_FAILURE_V1.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#Reachability-risk function",
            "blueprint/phase-0-the-foundation-protocol.md#ConversationThreadProjection",
        ],
        platform_service_refs=["ReachabilityGovernor", "CommunicationEnvelopeProjection"],
        route_runtime_publication_control_refs=["PatientShellConsistencyProjection", "WorkspaceTrustEnvelope"],
        operational_procedure_refs=["PROC_CALLBACK_PROMISE_REPAIR", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-006",
        hazard_title="Telephony or continuation route fails after follow-up is promised or before safety-usable evidence is ready.",
        hazard_family="communications_reachability",
        phase_scope=["phase0", "phase2"],
        source_blueprint_refs=[
            "blueprint/phase-2-identity-and-echoes.md#TelephonyEvidenceReadinessAssessment",
            "blueprint/phase-2-identity-and-echoes.md#telephony capture failure after patient expectation has been set",
            "blueprint/phase-2-identity-and-echoes.md#callback replay protection",
        ],
        hazard_description=(
            "Telephony parity is attempted, but the recording/transcript path or continuation grant path fails after the patient has been told the service will follow up."
        ),
        trigger_condition=(
            "Recording, transcript, callback, or SMS continuation flow degrades before the evidence or follow-up route becomes safe enough to use."
        ),
        failure_mode=(
            "Phone-origin work seeds normal flow too early, or replay/confusion makes the callback or continuation path appear safely consumable when it is not."
        ),
        clinical_harm_path=(
            "Urgent or routine issue is not re-entered into the safety pipeline, or the patient receives incorrect follow-up expectation and no safe recovery path."
        ),
        affected_actor_types=["patient", "telephony_operator", "support_operator"],
        affected_channels=["voice", "sms", "support_console"],
        affected_objects=["TelephonyEvidenceReadinessAssessment", "AccessGrant", "UrgentDiversionSettlement"],
        causal_controls_existing=["CTRL_TELEPHONY_EVIDENCE_READINESS", "CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_TELEPHONY_READINESS_VALIDATION", "EVID_ACCESS_GRANT_VALIDATION"],
        residual_risk_statement=(
            "Residual risk remains medium until live telephony provider callbacks and replay paths are rehearsed under representative failure conditions."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_MANUFACTURER_CSO",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_TELEPHONY_PATH_CHANGE", "TRIGGER_IDENTITY_PROVIDER_CHANGE"],
        notes="Telephony-specific DCB0129 seed hazard for Phase 2 parity.",
        canonical_invariant_refs=[
            "blueprint/phase-2-identity-and-echoes.md#telephony-evidence-readiness gating tests",
            "blueprint/phase-2-identity-and-echoes.md#urgent-required-versus-urgent-issued tests",
        ],
        platform_service_refs=["TelephonyEvidenceReadinessAssessment", "AccessGrantService"],
        route_runtime_publication_control_refs=["RouteIntentBinding", "AudienceSurfaceRuntimeBinding"],
        operational_procedure_refs=["PROC_TELEPHONY_PATH_CHANGE_REVIEW", "PROC_CALLBACK_PROMISE_REPAIR"],
    ),
    hazard_item(
        hazard_id="HZ-121-007",
        hazard_title="Local booking confirmation ambiguity or wrong booking outcome is shown as confirmed.",
        hazard_family="booking_network_pharmacy",
        phase_scope=["phase0", "phase4"],
        source_blueprint_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#BookingConfirmationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#ExternalConfirmationGate",
            "blueprint/phase-4-the-booking-engine.md#booking confirmation",
        ],
        hazard_description=(
            "A booking commit or manage flow displays booked reassurance, writable manage posture, or artifact readiness before confirmation truth is authoritative."
        ),
        trigger_condition=(
            "Booking transaction settles as pending, ambiguous, or weakly confirmed while patient/staff views still resolve a calm booked state."
        ),
        failure_mode=(
            "Confirmation truth is inferred from transport success, adapter optimism, or stale UI state instead of the bound confirmation projection."
        ),
        clinical_harm_path=(
            "Patient believes an appointment exists when it does not, or staff stop escalation because a false booked state hides a failed or ambiguous booking."
        ),
        affected_actor_types=["patient", "booking_coordinator", "staff_reviewer"],
        affected_channels=["browser", "staff_console", "hub_console"],
        affected_objects=["BookingCase", "BookingConfirmationTruthProjection", "ExternalConfirmationGate"],
        causal_controls_existing=["CTRL_BOOKING_CONFIRMATION_GATE", "CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_BOOKING_CAPABILITY_PROOF", "EVID_RELEASE_PARITY_VALIDATION"],
        residual_risk_statement=(
            "Residual risk remains medium until every booking provider lane proves exact confirmation and fallback behavior under representative degraded conditions."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_BOOKING_DOMAIN_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_BOOKING_POLICY_CHANGE", "TRIGGER_RELEASE_PUBLICATION_DRIFT"],
        notes="Booking reassurance must never outrun authoritative confirmation truth.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#BookingConfirmationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#ExternalConfirmationGate",
        ],
        platform_service_refs=["BookingConfirmationTruthProjection", "ExternalConfirmationGate"],
        route_runtime_publication_control_refs=["AudienceSurfaceRuntimeBinding", "ReleasePublicationParityRecord"],
        operational_procedure_refs=["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-008",
        hazard_title="Network alternative expiry, wrong-site offer, or fallback failure leads to unsafe booking decision.",
        hazard_family="booking_network_pharmacy",
        phase_scope=["phase0", "phase5"],
        source_blueprint_refs=[
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "blueprint/phase-0-the-foundation-protocol.md#ReservationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#WaitlistFallbackObligation",
        ],
        hazard_description=(
            "Hub/network flows present a wrong-site or expired offer, suppress a callback/hub fallback, or let a committed alternative outrun truthful availability."
        ),
        trigger_condition=(
            "Alternative-offer ranking, expiry, or visibility changes while a patient or coordinator is still acting from a previously selected anchor."
        ),
        failure_mode=(
            "Non-authoritative alternative truth, missing expiry fence, or missing fallback obligation makes an unsafe offer look valid."
        ),
        clinical_harm_path=(
            "Urgent case is delayed in hub, wrong site/time is selected, or the patient is not told the real fallback when the alternative has expired."
        ),
        affected_actor_types=["patient", "hub_coordinator", "booking_coordinator"],
        affected_channels=["browser", "hub_console", "staff_console"],
        affected_objects=["WaitlistContinuationTruthProjection", "ReservationTruthProjection", "HubCoordinationCase"],
        causal_controls_existing=["CTRL_RESERVATION_TRUTH_AND_WAITLIST_FALLBACK"],
        causal_controls_required=["CTRL_HUB_VISIBILITY_POLICY", "CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_RESERVATION_QUEUE_VALIDATION", "EVID_HUB_POLICY_PLACEHOLDER_V1"],
        residual_risk_statement=(
            "Residual risk remains medium until real hub/provider visibility policies and acknowledgement debt flows are evidence-backed."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_NETWORK_COORDINATION_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_NETWORK_POLICY_CHANGE", "TRIGGER_BOOKING_POLICY_CHANGE"],
        notes="Explicitly seeded from the phase 5 safety obligations list.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#WaitlistContinuationTruthProjection",
            "blueprint/phase-0-the-foundation-protocol.md#SelectedAnchor",
        ],
        platform_service_refs=["ReservationTruthProjection", "HubCoordinationPolicyEvaluator"],
        route_runtime_publication_control_refs=["HubContinuityEvidenceProjection", "AudienceSurfaceRuntimeBinding"],
        operational_procedure_refs=["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-009",
        hazard_title="Hub wrong-practice visibility or acknowledgement debt exposes or delays the wrong case.",
        hazard_family="booking_network_pharmacy",
        phase_scope=["phase0", "phase5"],
        source_blueprint_refs=[
            "blueprint/phase-5-the-network-horizon.md#Clinical safety obligations",
            "blueprint/phase-0-the-foundation-protocol.md#HubPracticeVisibilityPolicy",
            "blueprint/phase-0-the-foundation-protocol.md#NetworkCoordinationPolicyEvaluation",
        ],
        hazard_description=(
            "Hub desk or practice-facing visibility exposes a case to the wrong practice or leaves a clinically urgent case hidden behind acknowledgement debt."
        ),
        trigger_condition=(
            "Cross-org booking coordination, acknowledgement generation, or policy tuple changes while a case is still visible in hub operations."
        ),
        failure_mode=(
            "Visibility policy, practice acknowledgement state, or manage exposure drifts from the current hub coordination tuple."
        ),
        clinical_harm_path=(
            "Case is seen by the wrong practice, or the right practice misses an urgent or time-sensitive alternative because the acknowledgement path is not truthful."
        ),
        affected_actor_types=["hub_coordinator", "practice_staff", "patient"],
        affected_channels=["hub_console", "staff_console"],
        affected_objects=["HubCoordinationCase", "HubPracticeVisibilityPolicy", "NetworkCoordinationPolicyEvaluation"],
        causal_controls_existing=["CTRL_HUB_VISIBILITY_POLICY"],
        causal_controls_required=["CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING", "CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_HUB_POLICY_PLACEHOLDER_V1", "EVID_RELEASE_PARITY_VALIDATION"],
        residual_risk_statement=(
            "Residual risk remains medium until hub practice visibility and ack-debt rules are connected to named evidence owners and operational rehearsal."
        ),
        severity_band="high",
        likelihood_band="unlikely",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_NETWORK_COORDINATION_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_NETWORK_POLICY_CHANGE", "TRIGGER_RELEASE_PUBLICATION_DRIFT"],
        notes="Extends the phase 5 hub safety obligations into the manufacturer-side hazard log.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#HubPracticeVisibilityPolicy",
            "blueprint/phase-0-the-foundation-protocol.md#SelectedAnchor",
        ],
        platform_service_refs=["HubPracticeVisibilityPolicy", "NetworkCoordinationPolicyEvaluation"],
        route_runtime_publication_control_refs=["AudienceSurfaceRuntimeBinding", "WorkspaceTrustEnvelope"],
        operational_procedure_refs=["PROC_BOOKING_AND_NETWORK_POLICY_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-010",
        hazard_title="Pharmacy consent drift or stale checkpoint is treated as still valid for dispatch.",
        hazard_family="booking_network_pharmacy",
        phase_scope=["phase0", "phase6"],
        source_blueprint_refs=[
            "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentCheckpoint",
            "blueprint/phase-6-the-pharmacy-loop.md#consent revoked after dispatch",
            "blueprint/phase-6-the-pharmacy-loop.md#stale or superseded pharmacy consent treated as still valid",
        ],
        hazard_description=(
            "A pharmacy referral or follow-up action proceeds using consent truth that is stale, revoked, superseded, or mismatched to the selected provider."
        ),
        trigger_condition=(
            "Pharmacy dispatch or redispatch happens after provider choice, consent scope, or revocation truth has changed."
        ),
        failure_mode=(
            "Consent checkpoint is not refreshed, or patient-facing and provider-facing truth diverge from the authoritative consent record."
        ),
        clinical_harm_path=(
            "Unsafe or unauthorized referral is sent, patient loses control over disclosure, or later reconciliation is performed against the wrong consent basis."
        ),
        affected_actor_types=["patient", "pharmacist", "staff_reviewer"],
        affected_channels=["browser", "pharmacy_console", "staff_console"],
        affected_objects=["PharmacyCase", "PharmacyConsentCheckpoint", "PharmacyConsentRevocationRecord"],
        causal_controls_existing=["CTRL_PHARMACY_CONSENT_CHECKPOINT"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_PHARMACY_CONSENT_PLACEHOLDER_V1", "EVID_CHANGE_DELTA_RECORD"],
        residual_risk_statement=(
            "Residual risk remains medium until consent backfill and refresh behavior are proven under real transport/provider change."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_PHARMACY_DOMAIN_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_PHARMACY_FLOW_CHANGE"],
        notes="Pharmacy consent safety seed from phase 6 transport and consent law.",
        canonical_invariant_refs=[
            "blueprint/phase-6-the-pharmacy-loop.md#PharmacyConsentCheckpoint",
            "blueprint/phase-0-the-foundation-protocol.md#Consent",
        ],
        platform_service_refs=["PharmacyConsentCheckpoint", "PharmacyDispatchSettlement"],
        route_runtime_publication_control_refs=["PharmacyConsoleContinuityEvidenceProjection", "AudienceSurfaceRuntimeBinding"],
        operational_procedure_refs=["PROC_PHARMACY_BOUNCE_BACK_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-011",
        hazard_title="Pharmacy dispatch proof ambiguity, weak-match outcome, or unsafe close hides unresolved care.",
        hazard_family="booking_network_pharmacy",
        phase_scope=["phase0", "phase6"],
        source_blueprint_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#authoritativeDispatchProofState",
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
            "blueprint/phase-6-the-pharmacy-loop.md#low-confidence reconciliations can no longer auto-close a case",
        ],
        hazard_description=(
            "Manual or degraded dispatch proof, low-confidence outcome match, or bounce-back evidence is treated as sufficient to settle the pharmacy case."
        ),
        trigger_condition=(
            "Dispatch confirmation is pending, disputed, weakly matched, or reopened by a bounce-back or unresolved provider response."
        ),
        failure_mode=(
            "Case closes from weak evidence, or a bounce-back path does not reopen the originating care pathway."
        ),
        clinical_harm_path=(
            "Patient is told the pharmacy pathway completed when supply, advice, or escalation is still unresolved, delaying necessary care."
        ),
        affected_actor_types=["patient", "pharmacist", "staff_reviewer"],
        affected_channels=["pharmacy_console", "staff_console", "browser"],
        affected_objects=["PharmacyDispatchSettlement", "PharmacyBounceBackRecord", "PharmacyCase"],
        causal_controls_existing=["CTRL_PHARMACY_DISPATCH_AND_OUTCOME_RECONCILIATION"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_PHARMACY_RECONCILIATION_PLACEHOLDER_V1", "EVID_CHANGE_DELTA_RECORD"],
        residual_risk_statement=(
            "Residual risk remains medium until real outcome-reconciliation evidence and bounce-back reopen flows are attached to the same control catalog."
        ),
        severity_band="high",
        likelihood_band="possible",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_PHARMACY_DOMAIN_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_PHARMACY_FLOW_CHANGE", "TRIGGER_INCIDENT_OR_NEAR_MISS"],
        notes="Manufacturer-side seed hazard for unsafe auto-close from pharmacy outcome ambiguity.",
        canonical_invariant_refs=[
            "blueprint/phase-0-the-foundation-protocol.md#No pharmacy case may auto-close from weakly correlated, email-only, or operator-entered outcome evidence",
            "blueprint/phase-6-the-pharmacy-loop.md#Outcome reconciliation",
        ],
        platform_service_refs=["PharmacyOutcomeReconciliation", "PharmacyBounceBackRecord"],
        route_runtime_publication_control_refs=["PharmacyConsoleContinuityEvidenceProjection", "WorkspaceTrustEnvelope"],
        operational_procedure_refs=["PROC_PHARMACY_BOUNCE_BACK_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-012",
        hazard_title="Support replay, contact-route repair, or resend action exposes the wrong subject or stale truth.",
        hazard_family="communications_reachability",
        phase_scope=["phase0", "phase2", "phase9"],
        source_blueprint_refs=[
            "blueprint/phase-9-the-assurance-ledger.md#InvestigationScopeEnvelope",
            "blueprint/forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
            "blueprint/phase-0-the-foundation-protocol.md#SupportReplayRestoreSettlement",
        ],
        hazard_description=(
            "Support tooling replays, resends, or repairs a route using stale scope, stale selected anchor, or stale subject truth."
        ),
        trigger_condition=(
            "Support operator resumes or resends communication from a replay surface while scope, masking, or restore settlement has drifted."
        ),
        failure_mode=(
            "Restore gate is bypassed, or the same support flow can act on a stale request/subject after trust or scope changed."
        ),
        clinical_harm_path=(
            "Wrong subject is contacted, stale instruction is reissued, or a clinically meaningful communication path is repaired against the wrong lineage."
        ),
        affected_actor_types=["support_operator", "patient", "staff_reviewer"],
        affected_channels=["support_console", "sms", "email", "voice"],
        affected_objects=["SupportReplayRestoreSettlement", "InvestigationScopeEnvelope", "CommunicationEnvelope"],
        causal_controls_existing=["CTRL_SUPPORT_REPLAY_RESTORE", "CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION"],
        causal_controls_required=["CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD"],
        verification_evidence_refs=["EVID_SUPPORT_REPLAY_VALIDATION", "EVID_REACHABILITY_VALIDATION"],
        residual_risk_statement=(
            "Residual risk remains medium until support replay and resend flows are covered by route-specific restore rehearsals and named operational owners."
        ),
        severity_band="high",
        likelihood_band="unlikely",
        initial_risk_band="high",
        residual_risk_band="medium",
        review_owner_role="ROLE_SUPPORT_WORKFLOW_LEAD",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="seeded_open",
        change_trigger_refs=["TRIGGER_SUPPORT_REPLAY_CHANGE", "TRIGGER_INCIDENT_OR_NEAR_MISS"],
        notes="Derived through GAP_RESOLUTION_HAZARD_DERIVATION_SUPPORT_REPLAY_DISCLOSURE_V1.",
        canonical_invariant_refs=[
            "blueprint/phase-9-the-assurance-ledger.md#InvestigationTimelineReconstruction",
            "blueprint/phase-0-the-foundation-protocol.md#SupportReplayRestoreSettlement",
        ],
        platform_service_refs=["SupportReplayRestoreSettlement", "InvestigationTimelineReconstruction"],
        route_runtime_publication_control_refs=["InvestigationScopeEnvelope", "ReleasePublicationParityRecord"],
        operational_procedure_refs=["PROC_SUPPORT_REPLAY_SCOPE_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
    hazard_item(
        hazard_id="HZ-121-013",
        hazard_title="Assistive output or assistive release change bypasses independent safety signoff or leaves stale controls armed.",
        hazard_family="assistive_change_control",
        phase_scope=["phase0", "phase8", "phase9"],
        source_blueprint_refs=[
            "blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph",
            "blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
            "blueprint/phase-8-the-assistive-layer.md#No self-approval and independent safety signoff",
        ],
        hazard_description=(
            "Assistive suggestions, insert posture, or rollout state become visible or actionable without the required human approval, no-self-approval, and trust-envelope gating."
        ),
        trigger_condition=(
            "Assistive capability, trust state, release candidate, or approval graph changes while visible assistive controls remain armed."
        ),
        failure_mode=(
            "Feature flag, local UI state, or rollout slice bypasses the bound trust envelope or approval graph, including self-approval by the proposer."
        ),
        clinical_harm_path=(
            "Clinical or operational decisions are unduly influenced by untrusted assistive output, or stale assistive controls remain actionable after policy drift."
        ),
        affected_actor_types=["staff_reviewer", "operations_user", "assistive_operator"],
        affected_channels=["staff_console", "ops_console", "assistive_console"],
        affected_objects=["AssistiveCapabilityTrustEnvelope", "AssistiveFeedbackChain", "AssistiveReleaseActionRecord"],
        causal_controls_existing=["CTRL_ASSISTIVE_TRUST_AND_HUMAN_APPROVAL"],
        causal_controls_required=[
            "CTRL_NO_SELF_APPROVAL_RELEASE_GRAPH",
            "CTRL_ASSURANCE_LEDGER_PACKAGING",
            "CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD",
        ],
        verification_evidence_refs=[
            "EVID_ASSISTIVE_APPROVAL_GRAPH_PLACEHOLDER_V1",
            "EVID_ASSISTIVE_SHADOW_SLICE_PLACEHOLDER_V1",
            "EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1",
        ],
        residual_risk_statement=(
            "Residual risk remains high until the live assistive release graph, named independent reviewer, and slice-specific shadow evidence exist."
        ),
        severity_band="high",
        likelihood_band="unlikely",
        initial_risk_band="high",
        residual_risk_band="high",
        review_owner_role="ROLE_ASSISTIVE_SAFETY_COORDINATOR",
        independent_reviewer_role="ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER",
        status="future_detail_pending",
        change_trigger_refs=["TRIGGER_ASSISTIVE_POLICY_CHANGE", "TRIGGER_RELEASE_PUBLICATION_DRIFT"],
        notes="Deferred-but-known placeholder seeded via GAP_RESOLUTION_HAZARD_DERIVATION_ASSISTIVE_MISUSE_V1.",
        canonical_invariant_refs=[
            "blueprint/phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
            "blueprint/phase-8-the-assistive-layer.md#ReleaseApprovalGraph",
        ],
        platform_service_refs=["AssistiveCapabilityTrustEnvelope", "ReleaseApprovalGraph"],
        route_runtime_publication_control_refs=["RuntimePublicationBundle", "AudienceSurfaceRouteContract"],
        operational_procedure_refs=["PROC_ASSISTIVE_RELEASE_REVIEW", "PROC_HIGH_SEVERITY_INDEPENDENT_REVIEW"],
    ),
]


def join_list(values: list[str]) -> str:
    return "|".join(values)


def relative_ref(path: Path, from_dir: Path) -> str:
    return path.relative_to(ROOT).as_posix() if from_dir == ROOT else Path(path.relative_to(from_dir)).as_posix()


def ensure_prerequisites() -> list[dict[str, Any]]:
    snapshot = []
    missing = []
    for item in PREREQUISITES:
        absolute = ROOT / item["path"]
        exists = absolute.exists()
        status = "available" if exists else f"PREREQUISITE_GAP_{item['prerequisite_id']}"
        snapshot.append(
            {
                **item,
                "absolute_path": str(absolute),
                "status": status,
            }
        )
        if not exists:
            missing.append(item["prerequisite_id"])
    if missing:
        raise SystemExit("Missing DCB0129 seed prerequisites: " + ", ".join(sorted(missing)))
    return snapshot


def build_traceability_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for hazard in HAZARDS:
        rows.append(
            {
                "hazard_id": hazard["hazard_id"],
                "hazard_title": hazard["hazard_title"],
                "hazard_family": hazard["hazard_family"],
                "canonical_invariant_refs": join_list(hazard["canonical_invariant_refs"]),
                "platform_service_refs": join_list(hazard["platform_service_refs"]),
                "route_runtime_publication_control_refs": join_list(hazard["route_runtime_publication_control_refs"]),
                "operational_procedure_refs": join_list(hazard["operational_procedure_refs"]),
                "review_event_refs": join_list(review_event_refs_for_hazard(hazard)),
                "existing_control_refs": join_list(hazard["causal_controls_existing"]),
                "required_control_refs": join_list(hazard["causal_controls_required"]),
                "verification_evidence_refs": join_list(hazard["verification_evidence_refs"]),
                "notes": hazard["notes"],
            }
        )
    return rows


def review_event_refs_for_hazard(hazard: dict[str, Any]) -> list[str]:
    refs: list[str] = []
    trigger_ids = set(hazard["change_trigger_refs"])
    for event in REVIEW_EVENTS:
        if trigger_ids.intersection(event["trigger_refs"]):
            refs.append(event["review_event_id"])
    if "REV_ANNUAL_BASELINE_REVIEW" not in refs:
        refs.append("REV_ANNUAL_BASELINE_REVIEW")
    return refs


def hazard_csv_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for hazard in HAZARDS:
        row: dict[str, str] = {}
        for column in HAZARD_CSV_COLUMNS:
            value = hazard[column]
            row[column] = join_list(value) if isinstance(value, list) else str(value)
        rows.append(row)
    return rows


def safety_case_outline(prerequisite_snapshot: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "safety_case_id": "vecells_dcb0129_safety_case_seed_v1",
        "standards_version": STANDARDS_VERSION,
        "review_note": DEFAULT_REVIEW_NOTE,
        "source_precedence": SOURCE_PRECEDENCE,
        "manufacturer_boundary": {
            "statement": (
                "This pack covers manufacturer-side clinical risk management scaffolding for Vecells. "
                "Deployer-side DCB0160 ownership, local pathways, and local signoff stay separate and are "
                "referenced as follow-on obligations rather than silently merged into DCB0129 scope."
            ),
            "deployer_follow_on_refs": ["par_122", "par_123", "par_124", "par_125"],
        },
        "product_scope": {
            "intended_use": (
                "Vecells is a primary-care access and operations layer spanning web, NHS App jump-off, "
                "telephony continuation, booking, hub coordination, pharmacy referral loops, staff review, "
                "and later assistive overlays."
            ),
            "phase_seed_scope": ["phase0", "phase1", "phase2", "phase4", "phase5", "phase6", "phase8", "phase9"],
            "out_of_scope_now": [
                "Local deployer DCB0160 acceptance",
                "Named live provider attestation",
                "Live assistive visible-commit approval graph",
            ],
        },
        "governance_roles": [
            {"role_id": role_id, "role_label": label}
            for role_id, label in ROLE_LABELS.items()
        ],
        "role_placeholders": ROLE_PLACEHOLDERS,
        "hazard_taxonomy_refs": [family["hazard_family"] for family in HAZARD_TAXONOMY],
        "architecture_layers": [
            {
                "layer_id": "domain_invariants",
                "layer_title": "Canonical domain invariants",
                "control_refs": [
                    "CTRL_IDENTITY_REPAIR_FREEZE",
                    "CTRL_EVIDENCE_ASSIMILATION_PREEMPTION",
                    "CTRL_DUPLICATE_ATTACH_FENCE",
                    "CTRL_BOOKING_CONFIRMATION_GATE",
                ],
            },
            {
                "layer_id": "runtime_and_publication",
                "layer_title": "Runtime, publication, and writable posture controls",
                "control_refs": [
                    "CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH",
                    "CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING",
                    "CTRL_WORKSPACE_TRUST_ENVELOPE",
                ],
            },
            {
                "layer_id": "communications_and_reachability",
                "layer_title": "Reachability, callback, telephony, and support replay controls",
                "control_refs": [
                    "CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION",
                    "CTRL_TELEPHONY_EVIDENCE_READINESS",
                    "CTRL_SUPPORT_REPLAY_RESTORE",
                ],
            },
            {
                "layer_id": "booking_network_and_pharmacy",
                "layer_title": "Booking, network, and pharmacy operational truth",
                "control_refs": [
                    "CTRL_RESERVATION_TRUTH_AND_WAITLIST_FALLBACK",
                    "CTRL_HUB_VISIBILITY_POLICY",
                    "CTRL_PHARMACY_CONSENT_CHECKPOINT",
                    "CTRL_PHARMACY_DISPATCH_AND_OUTCOME_RECONCILIATION",
                ],
            },
            {
                "layer_id": "assurance_and_change_control",
                "layer_title": "Safety governance, evidence packaging, and no-self-approval",
                "control_refs": [
                    "CTRL_ASSISTIVE_TRUST_AND_HUMAN_APPROVAL",
                    "CTRL_NO_SELF_APPROVAL_RELEASE_GRAPH",
                    "CTRL_ASSURANCE_LEDGER_PACKAGING",
                    "CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD",
                ],
            },
        ],
        "control_catalog": CONTROL_CATALOG,
        "evidence_catalog": EVIDENCE_CATALOG,
        "review_event_refs": [event["review_event_id"] for event in REVIEW_EVENTS],
        "change_control_path_refs": [path["path_id"] for path in CHANGE_CONTROL_PATHS],
        "prerequisite_snapshot": prerequisite_snapshot,
        "gap_resolutions": GAP_RESOLUTIONS + ROLE_PLACEHOLDERS,
        "section_outline": [
            {
                "section_id": "SC-1",
                "title": "Product scope, intended use, and manufacturer boundary",
                "evidence_refs": ["EVID_DCB0129_SEED_PACK_V1"],
            },
            {
                "section_id": "SC-2",
                "title": "Safety governance, roles, and no-self-approval policy",
                "evidence_refs": ["EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1", "EVID_CHANGE_DELTA_RECORD"],
            },
            {
                "section_id": "SC-3",
                "title": "Hazard identification method, taxonomy, and source traceability",
                "evidence_refs": ["EVID_DCB0129_SEED_PACK_V1", "EVID_DUPLICATE_CLUSTER_VALIDATION"],
            },
            {
                "section_id": "SC-4",
                "title": "Control strategy by architectural layer",
                "evidence_refs": ["EVID_MUTATION_GATE_VALIDATION", "EVID_GATEWAY_SURFACE_VALIDATION"],
            },
            {
                "section_id": "SC-5",
                "title": "Verification evidence plan and placeholder ownership",
                "evidence_refs": [item["evidence_id"] for item in EVIDENCE_CATALOG],
            },
            {
                "section_id": "SC-6",
                "title": "Residual-risk review, review events, and signoff readiness",
                "evidence_refs": ["EVID_CHANGE_DELTA_RECORD", "EVID_ASSURANCE_GRAPH_PLACEHOLDER_V1"],
            },
        ],
        "summary": {
            "hazard_count": len(HAZARDS),
            "hazard_family_count": len(HAZARD_TAXONOMY),
            "control_count": len(CONTROL_CATALOG),
            "evidence_count": len(EVIDENCE_CATALOG),
            "review_event_count": len(REVIEW_EVENTS),
            "change_control_path_count": len(CHANGE_CONTROL_PATHS),
        },
    }


def hazard_register(prerequisite_snapshot: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "register_id": "vecells_dcb0129_hazard_register_seed_v1",
        "standards_version": STANDARDS_VERSION,
        "review_note": DEFAULT_REVIEW_NOTE,
        "source_precedence": SOURCE_PRECEDENCE,
        "manufacturer_boundary": "DCB0129 seed pack for the supplier/manufacturer only.",
        "deployer_boundary_note": (
            "Local pathway ownership, deployer-side DCB0160 evidence, and local workflow acceptance are "
            "separate follow-on workstreams and are not treated as closed by this seed pack."
        ),
        "prerequisite_snapshot": prerequisite_snapshot,
        "hazard_taxonomy": HAZARD_TAXONOMY,
        "gap_resolutions": GAP_RESOLUTIONS,
        "hazards": HAZARDS,
        "summary": {
            "hazard_count": len(HAZARDS),
            "high_severity_count": len([hazard for hazard in HAZARDS if hazard["severity_band"] == "high"]),
            "future_detail_pending_count": len([hazard for hazard in HAZARDS if hazard["status"] == "future_detail_pending"]),
        },
    }


def review_events_payload() -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "review_event_set_id": "vecells_dcb0129_review_events_v1",
        "standards_version": STANDARDS_VERSION,
        "review_note": DEFAULT_REVIEW_NOTE,
        "non_applicability_record_id": NON_APPLICABILITY_RECORD_ID,
        "change_trigger_catalog": CHANGE_TRIGGER_CATALOG,
        "operational_procedure_catalog": PROCEDURE_CATALOG,
        "review_events": REVIEW_EVENTS,
        "change_control_paths": CHANGE_CONTROL_PATHS,
    }


def markdown_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    header = "| " + " | ".join(label for _, label in columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = []
    for row in rows:
        cells = []
        for key, _ in columns:
            value = row.get(key, "")
            if isinstance(value, list):
                text = "<br>".join(str(item) for item in value)
            else:
                text = str(value)
            cells.append(text.replace("\n", " "))
        body.append("| " + " | ".join(cells) + " |")
    return "\n".join([header, divider, *body])


def artifacts_list(from_dir: Path) -> str:
    targets = [
        DOCS_DIR / "121_dcb0129_clinical_risk_management_plan.md",
        DOCS_DIR / "121_dcb0129_hazard_log_structure.md",
        DOCS_DIR / "121_dcb0129_clinical_safety_case_structure.md",
        DOCS_DIR / "121_hazard_identification_and_control_taxonomy.md",
        DOCS_DIR / "121_change_control_and_safety_update_workflow.md",
        DATA_DIR / "dcb0129_hazard_register.json",
        DATA_DIR / "dcb0129_hazard_register.csv",
        DATA_DIR / "dcb0129_hazard_to_control_traceability.csv",
        DATA_DIR / "dcb0129_safety_case_outline.json",
        DATA_DIR / "dcb0129_review_events.json",
        ROOT / "tools" / "assurance" / "validate_dcb0129_seed_pack.py",
    ]
    lines = []
    for path in targets:
        relative = Path(path.relative_to(ROOT)).as_posix()
        if from_dir == DOCS_DIR:
            link = Path("..") / ".." / relative
            lines.append(f"- [`{path.name}`]({link.as_posix()})")
        else:
            lines.append(f"- `{relative}`")
    return "\n".join(lines)


def render_risk_management_plan(
    prerequisite_snapshot: list[dict[str, Any]],
    safety_case: dict[str, Any],
) -> str:
    role_rows = [{"role_id": item["role_id"], "role_label": item["role_label"]} for item in safety_case["governance_roles"]]
    review_rows = [
        {
            "review_event_id": event["review_event_id"],
            "review_event_title": event["review_event_title"],
            "review_type": event["review_type"],
            "owner_role": event["owner_role"],
            "independent_reviewer_role": event["independent_reviewer_role"],
        }
        for event in REVIEW_EVENTS
    ]
    prereq_rows = [
        {
            "prerequisite_id": item["prerequisite_id"],
            "path": item["path"],
            "status": item["status"],
            "purpose": item["purpose"],
        }
        for item in prerequisite_snapshot
    ]
    return f"""# 121 DCB0129 Clinical Risk Management Plan

This document establishes the initial manufacturer-side DCB0129 clinical risk management baseline for Vecells. It is deliberately machine-readable and source-traceable rather than a one-off PDF narrative.

## Standards Baseline

- `standards_version`: `{STANDARDS_VERSION["baseline_id"]}`
- `manufacturer_standard`: `{STANDARDS_VERSION["manufacturer_standard"]}`
- `deployer_companion_standard`: `{STANDARDS_VERSION["deployer_companion_standard"]}`
- `reviewed_at`: `{STANDARDS_VERSION["reviewed_at"]}`
- `review_note`: {DEFAULT_REVIEW_NOTE}

## Boundary

- Manufacturer scope: architecture, seeded hazards, controls, evidence ownership, change-control hooks, and independent-review policy for Vecells as a supplier product.
- Deployer scope: local operational workflow acceptance, local pathway signoff, and DCB0160 deployment evidence remain separate follow-on packs.

## Section A — `Mock_now_execution`

- Seed the DCB0129 hazard register, safety-case outline, review events, and traceability table now.
- Use current blueprint law, current upstream machine-readable artifacts, and placeholder evidence owners where later phases are still pending.
- Treat missing named owners and future live-provider evidence as explicit gaps, not silent omissions.

## Section B — `Actual_production_strategy_later`

- Attach named Clinical Safety Officer, named independent reviewer roster, real provider onboarding evidence, and live rehearsal evidence to the same schema rather than replacing it.
- Promote placeholder evidence rows to live evidence rows while preserving stable hazard IDs, control IDs, and review-event IDs.
- Re-run the same validator before every release, onboarding pack, or major workflow change.

## Governance Roles

{markdown_table(role_rows, [("role_id", "Role ID"), ("role_label", "Role")])}

## Review Cadence

{markdown_table(review_rows, [("review_event_id", "Review Event"), ("review_event_title", "Purpose"), ("review_type", "Type"), ("owner_role", "Owner"), ("independent_reviewer_role", "Independent Reviewer")])}

## Prerequisite Snapshot

{markdown_table(prereq_rows, [("prerequisite_id", "Prerequisite"), ("path", "Artifact"), ("status", "Status"), ("purpose", "Purpose")])}

## Artifact Set

{artifacts_list(DOCS_DIR)}
"""


def render_hazard_log_structure() -> str:
    schema_rows = [{"field": field, "meaning": field.replace("_", " ")} for field in HAZARD_CSV_COLUMNS]
    hazard_rows = [
        {
            "hazard_id": hazard["hazard_id"],
            "hazard_title": hazard["hazard_title"],
            "hazard_family": hazard["hazard_family"],
            "severity_band": hazard["severity_band"],
            "status": hazard["status"],
        }
        for hazard in HAZARDS
    ]
    taxonomy_rows = [
        {
            "hazard_family": family["hazard_family"],
            "family_title": family["family_title"],
            "family_summary": family["family_summary"],
        }
        for family in HAZARD_TAXONOMY
    ]
    return f"""# 121 DCB0129 Hazard Log Structure

This document defines the seeded hazard-log schema used by [`dcb0129_hazard_register.json`](../../data/assurance/dcb0129_hazard_register.json) and [`dcb0129_hazard_register.csv`](../../data/assurance/dcb0129_hazard_register.csv).

## Section A — `Mock_now_execution`

- Keep one canonical hazard ID per hazard statement.
- Preserve explicit `source_blueprint_refs[]`, control refs, evidence refs, owner roles, review dates, and change-trigger refs.
- Record known future assistive hazards as `future_detail_pending` instead of dropping them from the register.

## Section B — `Actual_production_strategy_later`

- Add live evidence and residual-risk decisions by extending the same rows.
- Do not fork separate spreadsheets for provider onboarding, release safety, or operational exceptions.

## Hazard Taxonomy

{markdown_table(taxonomy_rows, [("hazard_family", "Family"), ("family_title", "Title"), ("family_summary", "Summary")])}

## Hazard Register Fields

{markdown_table(schema_rows, [("field", "Field"), ("meaning", "Meaning")])}

## Seeded Hazards

{markdown_table(hazard_rows, [("hazard_id", "Hazard"), ("hazard_title", "Title"), ("hazard_family", "Family"), ("severity_band", "Severity"), ("status", "Status")])}
"""


def render_safety_case_structure(safety_case: dict[str, Any]) -> str:
    section_rows = [
        {
            "section_id": section["section_id"],
            "title": section["title"],
            "evidence_refs": section["evidence_refs"],
        }
        for section in safety_case["section_outline"]
    ]
    layer_rows = [
        {
            "layer_id": layer["layer_id"],
            "layer_title": layer["layer_title"],
            "control_refs": layer["control_refs"],
        }
        for layer in safety_case["architecture_layers"]
    ]
    return f"""# 121 DCB0129 Clinical Safety Case Structure

This document mirrors the architecture Vecells is actually building. It is the human-readable counterpart to [`dcb0129_safety_case_outline.json`](../../data/assurance/dcb0129_safety_case_outline.json).

## Section A — `Mock_now_execution`

- Use the current Phase 0 to Phase 9 architecture as the actual safety-case frame.
- Bind seeded controls to the same invariants, services, and runtime/publication laws already present in-repo.

## Section B — `Actual_production_strategy_later`

- Add signed evidence, challenge-set outputs, onboarding attestations, and deployer companion evidence to these same sections.
- Keep the architecture-layer and evidence IDs stable so later packs remain diffable.

## Safety Case Sections

{markdown_table(section_rows, [("section_id", "Section"), ("title", "Title"), ("evidence_refs", "Evidence Refs")])}

## Control Strategy By Architecture Layer

{markdown_table(layer_rows, [("layer_id", "Layer"), ("layer_title", "Purpose"), ("control_refs", "Control Refs")])}
"""


def render_taxonomy_doc() -> str:
    control_rows = [
        {
            "control_id": control["control_id"],
            "control_layer": control["control_layer"],
            "control_title": control["control_title"],
            "status": control["status"],
        }
        for control in CONTROL_CATALOG
    ]
    gap_rows = [
        {
            "gap_id": gap["gap_id"],
            "resolution": gap["resolution"] if "resolution" in gap else gap["gap_statement"],
        }
        for gap in [*GAP_RESOLUTIONS, *ROLE_PLACEHOLDERS]
    ]
    return f"""# 121 Hazard Identification And Control Taxonomy

This document explains how the seed hazards are grouped and how the control catalog maps back to architecture law.

## Section A — `Mock_now_execution`

- Use the seven hazard families in [`dcb0129_hazard_register.json`](../../data/assurance/dcb0129_hazard_register.json).
- Keep controls explicit and machine-addressable rather than hidden in prose.

## Section B — `Actual_production_strategy_later`

- Replace placeholder evidence rows with live provider, release, or rehearsal evidence while keeping control IDs stable.
- Resolve gap placeholders into named roles and signed evidence without changing hazard lineage.

## Control Catalog

{markdown_table(control_rows, [("control_id", "Control"), ("control_layer", "Layer"), ("control_title", "Summary"), ("status", "Status")])}

## Gap Resolutions

{markdown_table(gap_rows, [("gap_id", "Gap"), ("resolution", "Resolution")])}
"""


def render_change_control_doc() -> str:
    trigger_rows = [
        {
            "trigger_id": trigger["trigger_id"],
            "trigger_title": trigger["trigger_title"],
            "review_owner_role": trigger["review_owner_role"],
        }
        for trigger in CHANGE_TRIGGER_CATALOG
    ]
    path_rows = [
        {
            "path_id": path["path_id"],
            "path_title": path["path_title"],
            "trigger_refs": path["trigger_refs"],
            "close_tokens": path["close_tokens"],
            "alternative_close_tokens": path["alternative_close_tokens"],
        }
        for path in CHANGE_CONTROL_PATHS
    ]
    return f"""# 121 Change Control And Safety Update Workflow

This workflow makes safety upkeep part of normal engineering change control. Every material change either updates the hazard pack or records explicit non-applicability.

## Section A — `Mock_now_execution`

1. Triage the change against the trigger catalog.
2. Update the matching hazard row or append `{NON_APPLICABILITY_RECORD_ID}`.
3. Refresh the traceability row and affected evidence refs.
4. Run [`validate_dcb0129_seed_pack.py`](../../tools/assurance/validate_dcb0129_seed_pack.py).
5. Require independent review for any high-severity hazard or residual high-risk delta.

## Section B — `Actual_production_strategy_later`

1. Attach live provider, deployment, or release evidence to the same change-control path.
2. Preserve the same close tokens so audit, assurance, and release packs can prove a change did not skip safety review.
3. Keep no-self-approval enforced through the same review-event and path IDs.

## Trigger Catalog

{markdown_table(trigger_rows, [("trigger_id", "Trigger"), ("trigger_title", "Meaning"), ("review_owner_role", "Owner")])}

## Change-Control Paths

{markdown_table(path_rows, [("path_id", "Path"), ("path_title", "Title"), ("trigger_refs", "Triggers"), ("close_tokens", "Required Close Tokens"), ("alternative_close_tokens", "Alternative Close Tokens")])}

## Non-Negotiable Approval Rules

- High-severity hazards may not close without `ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER`.
- The proposer may not approve their own high-severity safety change.
- A change path may not close without `hazard_register_updated` or `non_applicability_recorded`.
"""


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(path: Path, content: str) -> None:
    path.write_text(content.strip() + "\n", encoding="utf-8")


def write_seed_pack() -> dict[str, Any]:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    prerequisite_snapshot = ensure_prerequisites()
    safety_case = safety_case_outline(prerequisite_snapshot)
    register = hazard_register(prerequisite_snapshot)
    reviews = review_events_payload()
    traceability_rows = build_traceability_rows()

    write_json(DATA_DIR / "dcb0129_hazard_register.json", register)
    write_csv(DATA_DIR / "dcb0129_hazard_register.csv", HAZARD_CSV_COLUMNS, hazard_csv_rows())
    write_csv(DATA_DIR / "dcb0129_hazard_to_control_traceability.csv", TRACEABILITY_CSV_COLUMNS, traceability_rows)
    write_json(DATA_DIR / "dcb0129_safety_case_outline.json", safety_case)
    write_json(DATA_DIR / "dcb0129_review_events.json", reviews)

    write_markdown(DOCS_DIR / "121_dcb0129_clinical_risk_management_plan.md", render_risk_management_plan(prerequisite_snapshot, safety_case))
    write_markdown(DOCS_DIR / "121_dcb0129_hazard_log_structure.md", render_hazard_log_structure())
    write_markdown(DOCS_DIR / "121_dcb0129_clinical_safety_case_structure.md", render_safety_case_structure(safety_case))
    write_markdown(DOCS_DIR / "121_hazard_identification_and_control_taxonomy.md", render_taxonomy_doc())
    write_markdown(DOCS_DIR / "121_change_control_and_safety_update_workflow.md", render_change_control_doc())

    return {
        "task_id": TASK_ID,
        "hazard_count": len(HAZARDS),
        "control_count": len(CONTROL_CATALOG),
        "evidence_count": len(EVIDENCE_CATALOG),
        "review_event_count": len(REVIEW_EVENTS),
    }


def main() -> None:
    summary = write_seed_pack()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
