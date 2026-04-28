#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
BLUEPRINT_DIR = ROOT / "blueprint"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "analysis"

SOURCE_FILES = [
    "blueprint-init.md",
    "phase-cards.md",
    "vecells-complete-end-to-end-flow.md",
    "phase-0-the-foundation-protocol.md",
    "forensic-audit-findings.md",
    "platform-frontend-blueprint.md",
    "platform-runtime-and-release-blueprint.md",
    "patient-account-and-communications-blueprint.md",
    "staff-operations-and-support-blueprint.md",
    "phase-3-the-human-checkpoint.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
]

SUMMARY_SOURCES = {
    "blueprint-init.md",
    "phase-cards.md",
    "vecells-complete-end-to-end-flow.md",
}

CRITICAL_DIMENSIONS = {
    "state_vocabulary",
    "object_ownership",
    "runtime_release",
}

ALLOWED_CLASSIFICATIONS = {
    "exact_match",
    "terminology_drift",
    "underspecified_summary",
    "canonical_conflict",
    "obsolete_summary",
    "unresolved_gap",
}

REQUIRED_CONCEPT_IDS = {
    "STATE_SUBMISSION_ENVELOPE",
    "STATE_WORKFLOW_MILESTONES",
    "STATE_SAFETY_AXIS",
    "STATE_IDENTITY_AXIS_PATIENTREF",
    "STATE_BLOCKER_ORTHOGONALITY",
    "OWNERSHIP_LIFECYCLE_COORDINATOR",
    "MUTATION_ROUTE_INTENT_BINDING",
    "MUTATION_COMMAND_SETTLEMENT_RECORD",
    "TRUTH_EXTERNAL_CONFIRMATION_GATE",
    "TRUTH_CHILD_DOMAIN_STATE_WRITES",
    "RUNTIME_RELEASE_APPROVAL_FREEZE",
    "RUNTIME_CHANNEL_RELEASE_FREEZE",
    "RUNTIME_ASSURANCE_SLICE_TRUST",
    "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT",
    "UI_SHELL_FAMILY_OWNERSHIP",
    "UI_SAME_OBJECT_SAME_SHELL",
    "ASSURANCE_EVIDENCE_GRAPH",
    "ASSURANCE_CONTINUITY_EVIDENCE",
    "ASSURANCE_OPERATIONAL_READINESS",
    "PROGRAMME_CONFORMANCE_SCORECARD",
    "SCOPE_DEFERRED_NHS_APP",
}

REQUIRED_ALIAS_EXPECTATIONS = {
    "ownershipState": "identityState",
    "identity_hold": "IdentityRepairCase + closure blocker metadata",
    "reconciliation_required": "case-local gate or confirmation pending term, never canonical Request.workflowState",
    "Request(workflowState = draft)": "SubmissionEnvelope.state = draft",
    "generic success toast": "CommandSettlementRecord",
}

SPECIAL_ALIAS_ROWS = [
    {
        "concept_id": "STATE_IDENTITY_AXIS_PATIENTREF",
        "alias": "ownershipState",
        "preferred_term": "identityState",
        "alias_status": "deprecated",
        "rationale": "Normalize one-off schema or summary wording back to the canonical `identityState` axis.",
    },
    {
        "concept_id": "STATE_BLOCKER_ORTHOGONALITY",
        "alias": "identity_hold",
        "preferred_term": "IdentityRepairCase + closure blocker metadata",
        "alias_status": "forbidden",
        "rationale": "Represent wrong-patient freeze through `IdentityRepairCase`, blocker refs, and release settlement rather than a workflow state label.",
    },
    {
        "concept_id": "STATE_WORKFLOW_MILESTONES",
        "alias": "reconciliation_required",
        "preferred_term": "case-local gate or confirmation pending term, never canonical Request.workflowState",
        "alias_status": "forbidden",
        "rationale": "Use booking or pharmacy case-local ambiguity terms plus `ExternalConfirmationGate` instead of putting `reconciliation_required` on `Request.workflowState`.",
    },
    {
        "concept_id": "STATE_SUBMISSION_ENVELOPE",
        "alias": "Request(workflowState = draft)",
        "preferred_term": "SubmissionEnvelope.state = draft",
        "alias_status": "forbidden",
        "rationale": "Pre-submit draft belongs to `SubmissionEnvelope.state`, not `Request.workflowState`.",
    },
    {
        "concept_id": "MUTATION_COMMAND_SETTLEMENT_RECORD",
        "alias": "generic success toast",
        "preferred_term": "CommandSettlementRecord",
        "alias_status": "deprecated",
        "rationale": "Local acknowledgement is not authoritative outcome; normalize calmness and recovery posture through `CommandSettlementRecord`.",
    },
]

PHASE_SEED_ROWS = [
    {
        "phase_id": "phase_0",
        "phase_title": "The Foundation Protocol",
        "canonical_refs": [
            "phase-0-the-foundation-protocol.md#0B",
            "platform-frontend-blueprint.md#0.2",
            "platform-runtime-and-release-blueprint.md#Runtime rules",
        ],
        "summary_refs": [
            "phase-cards.md#Card 1: Phase 0 - The Foundation Protocol",
            "blueprint-init.md#3. The canonical request model",
            "vecells-complete-end-to-end-flow.md",
        ],
        "concept_ids": [
            "STATE_SUBMISSION_ENVELOPE",
            "STATE_WORKFLOW_MILESTONES",
            "STATE_SAFETY_AXIS",
            "STATE_IDENTITY_AXIS_PATIENTREF",
            "STATE_BLOCKER_ORTHOGONALITY",
            "OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE",
            "OWNERSHIP_LIFECYCLE_COORDINATOR",
            "MUTATION_ROUTE_INTENT_BINDING",
            "MUTATION_COMMAND_ACTION_RECORD",
            "MUTATION_COMMAND_SETTLEMENT_RECORD",
            "RUNTIME_RELEASE_APPROVAL_FREEZE",
            "RUNTIME_CHANNEL_RELEASE_FREEZE",
            "RUNTIME_ASSURANCE_SLICE_TRUST",
            "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT",
            "PROGRAMME_CONFORMANCE_SCORECARD",
        ],
        "required_evidence_classes": [
            "VerificationScenario",
            "ReleaseContractVerificationMatrix",
            "ControlStatusSnapshot",
            "AssuranceSliceTrustRecord",
        ],
        "required_runtime_publication_tuples": [
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "RuntimePublicationBundle",
            "DesignContractPublicationBundle",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_1",
        "phase_title": "The Red Flag Gate",
        "canonical_refs": [
            "phase-1-the-red-flag-gate.md",
            "phase-0-the-foundation-protocol.md#4 Canonical ingest",
        ],
        "summary_refs": [
            "phase-cards.md#Card 2: Phase 1 - The Red Flag Gate",
            "blueprint-init.md#4. The end-to-end patient journey",
        ],
        "concept_ids": [
            "STATE_SUBMISSION_ENVELOPE",
            "STATE_SAFETY_AXIS",
            "UI_SAME_OBJECT_SAME_SHELL",
            "MUTATION_RECOVERY_ENVELOPES",
        ],
        "required_evidence_classes": [
            "PatientReceiptConsistencyEnvelope",
            "ExperienceContinuityControlEvidence",
            "ControlStatusSnapshot",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_2",
        "phase_title": "Identity and Echoes",
        "canonical_refs": [
            "phase-2-identity-and-echoes.md",
            "phase-0-the-foundation-protocol.md#5 Identity binding",
        ],
        "summary_refs": [
            "phase-cards.md#Card 3: Phase 2 - Identity and Echoes",
            "blueprint-init.md#10. Identity, consent, security, and policy",
        ],
        "concept_ids": [
            "STATE_IDENTITY_AXIS_PATIENTREF",
            "MUTATION_ROUTE_INTENT_BINDING",
            "MUTATION_COMMAND_SETTLEMENT_RECORD",
            "SCOPE_DEFERRED_NHS_APP",
        ],
        "required_evidence_classes": [
            "IdentityRepairEvidenceBundle",
            "ControlStatusSnapshot",
            "ExperienceContinuityControlEvidence",
        ],
        "required_runtime_publication_tuples": [
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_3",
        "phase_title": "The Human Checkpoint",
        "canonical_refs": [
            "phase-3-the-human-checkpoint.md",
            "staff-operations-and-support-blueprint.md",
            "platform-frontend-blueprint.md#6. Staff, hub, support, and operations experience algorithm",
        ],
        "summary_refs": [
            "phase-cards.md#Card 4: Phase 3 - The Human Checkpoint",
            "blueprint-init.md#5. Clinical workspace and operational workflow",
        ],
        "concept_ids": [
            "OWNERSHIP_LIFECYCLE_COORDINATOR",
            "UI_SHELL_FAMILY_OWNERSHIP",
            "UI_SAME_OBJECT_SAME_SHELL",
            "TRUTH_CHILD_DOMAIN_STATE_WRITES",
            "ASSURANCE_CONTINUITY_EVIDENCE",
        ],
        "required_evidence_classes": [
            "ExperienceContinuityControlEvidence",
            "ControlStatusSnapshot",
            "WorkspaceSliceTrustProjection",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "ReleaseRecoveryDisposition",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_4",
        "phase_title": "The Booking Engine",
        "canonical_refs": [
            "phase-4-the-booking-engine.md",
            "phase-0-the-foundation-protocol.md#10 Capacity reservation",
        ],
        "summary_refs": [
            "phase-cards.md#Card 5: Phase 4 - The Booking Engine",
            "blueprint-init.md#6. Booking and access continuity",
        ],
        "concept_ids": [
            "TRUTH_RESERVATION_TRUTH",
            "TRUTH_EXTERNAL_CONFIRMATION_GATE",
            "TRUTH_REOPEN_AND_BOUNCE_BACK",
            "TRUTH_CHILD_DOMAIN_STATE_WRITES",
            "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT",
        ],
        "required_evidence_classes": [
            "BookingConfirmationTruthProjection",
            "ExperienceContinuityControlEvidence",
            "ControlStatusSnapshot",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "ReleasePublicationParityRecord",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_5",
        "phase_title": "The Network Horizon",
        "canonical_refs": [
            "phase-5-the-network-horizon.md",
            "phase-0-the-foundation-protocol.md#10 Capacity reservation",
        ],
        "summary_refs": [
            "phase-cards.md#Card 6: Phase 5 - The Network Horizon",
            "blueprint-init.md#6. Booking and access continuity",
        ],
        "concept_ids": [
            "TRUTH_RESERVATION_TRUTH",
            "TRUTH_EXTERNAL_CONFIRMATION_GATE",
            "TRUTH_REOPEN_AND_BOUNCE_BACK",
            "TRUTH_CHILD_DOMAIN_STATE_WRITES",
        ],
        "required_evidence_classes": [
            "HubContinuityEvidenceProjection",
            "ControlStatusSnapshot",
            "ExperienceContinuityControlEvidence",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "ReleaseRecoveryDisposition",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_6",
        "phase_title": "The Pharmacy Loop",
        "canonical_refs": [
            "phase-6-the-pharmacy-loop.md",
            "phase-0-the-foundation-protocol.md#11 Pharmacy choice",
        ],
        "summary_refs": [
            "phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop",
            "blueprint-init.md#7. Pharmacy First pathway",
        ],
        "concept_ids": [
            "TRUTH_DISPATCH_PROOF",
            "TRUTH_REOPEN_AND_BOUNCE_BACK",
            "TRUTH_CHILD_DOMAIN_STATE_WRITES",
            "MUTATION_RECOVERY_ENVELOPES",
        ],
        "required_evidence_classes": [
            "PharmacyDispatchSettlement",
            "PharmacyOutcomeSettlement",
            "ExperienceContinuityControlEvidence",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "AudienceSurfaceRuntimeBinding",
            "ReleaseRecoveryDisposition",
        ],
    },
    {
        "phase_id": "phase_7",
        "phase_title": "Inside the NHS App",
        "canonical_refs": [
            "phase-7-inside-the-nhs-app.md",
            "platform-frontend-blueprint.md#0.2",
        ],
        "summary_refs": [
            "phase-cards.md#Card 8: Phase 7 - Inside the NHS App (Deferred channel expansion)",
            "blueprint-init.md#14. Programme Baseline With NHS App Deferred",
        ],
        "concept_ids": [
            "UI_CHANNEL_PROFILE_CONSTRAINTS",
            "SCOPE_DEFERRED_NHS_APP",
            "RUNTIME_CHANNEL_RELEASE_FREEZE",
        ],
        "required_evidence_classes": [
            "ControlStatusSnapshot",
            "ExperienceContinuityControlEvidence",
            "AssuranceSliceTrustRecord",
        ],
        "required_runtime_publication_tuples": [
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "RuntimePublicationBundle",
        ],
    },
    {
        "phase_id": "phase_8",
        "phase_title": "The Assistive Layer",
        "canonical_refs": [
            "phase-8-the-assistive-layer.md",
            "platform-frontend-blueprint.md#Assistive companion and control-surface contract",
        ],
        "summary_refs": [
            "phase-cards.md#Card 9: Phase 8 - The Assistive Layer",
            "vecells-complete-end-to-end-flow.md",
        ],
        "concept_ids": [
            "UI_SAME_OBJECT_SAME_SHELL",
            "ASSURANCE_CONTINUITY_EVIDENCE",
            "RUNTIME_ASSURANCE_SLICE_TRUST",
        ],
        "required_evidence_classes": [
            "AssistiveFeedbackChain",
            "ExperienceContinuityControlEvidence",
            "AssuranceSliceTrustRecord",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "ReleaseRecoveryDisposition",
            "AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "phase_id": "phase_9",
        "phase_title": "The Assurance Ledger",
        "canonical_refs": [
            "phase-9-the-assurance-ledger.md",
            "platform-runtime-and-release-blueprint.md#Operational readiness contract",
        ],
        "summary_refs": [
            "phase-cards.md#Card 10: Phase 9 - The Assurance Ledger",
            "blueprint-init.md#11. Analytics and assurance",
        ],
        "concept_ids": [
            "ASSURANCE_EVIDENCE_GRAPH",
            "ASSURANCE_CONTINUITY_EVIDENCE",
            "ASSURANCE_OPERATIONAL_READINESS",
            "PROGRAMME_CONFORMANCE_SCORECARD",
        ],
        "required_evidence_classes": [
            "AssuranceEvidenceGraphSnapshot",
            "AssuranceGraphCompletenessVerdict",
            "OperationalReadinessSnapshot",
        ],
        "required_runtime_publication_tuples": [
            "RuntimePublicationBundle",
            "ReleaseWatchTuple",
            "WaveObservationPolicy",
        ],
    },
]


CONCEPTS: list[dict[str, Any]] = [
    {
        "concept_id": "STATE_SUBMISSION_ENVELOPE",
        "dimension": "state_vocabulary",
        "preferred_term": "SubmissionEnvelope.state owns draft and pre-promotion lifecycle",
        "keywords": [
            "SubmissionEnvelope.state",
            "submissionEnvelopeState",
            "Request(workflowState = draft)",
            "ready_to_promote",
            "promoted",
        ],
        "aliases": ["draft request", "request draft state"],
        "deprecated_aliases": ["Request(workflowState = draft)"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Use `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote | promoted | abandoned | expired`; do not model draft as `Request.workflowState`.",
        "losing_sources": ["blueprint-init.md", "phase-cards.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject any canonical schema or summary text that stores draft state on `Request.workflowState`.",
        "affected_phases": ["phase_0", "phase_1", "phase_2", "cross_phase"],
        "required_evidence_classes": ["SubmissionPromotionRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_STATE_001 draft semantics can drift back into request-level state if summary docs stay vague."],
        "query_terms": ["SubmissionEnvelope", "ready_to_promote", "Request(workflowState = draft)"],
    },
    {
        "concept_id": "STATE_WORKFLOW_MILESTONES",
        "dimension": "state_vocabulary",
        "preferred_term": "Request.workflowState is milestone-only",
        "keywords": [
            "workflowState",
            "submitted",
            "intake_normalized",
            "triage_ready",
            "triage_active",
            "handoff_active",
            "outcome_recorded",
            "reconciliation_required",
            "identity_hold",
        ],
        "aliases": ["workflow status", "reconciliation_required", "identity_hold"],
        "forbidden_aliases": ["reconciliation_required", "identity_hold"],
        "classification": "canonical_conflict",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Normalize `Request.workflowState` to milestone-only values: `submitted`, `intake_normalized`, `triage_ready`, `triage_active`, `handoff_active`, `outcome_recorded`, `closed`.",
        "losing_sources": [
            "forensic-audit-findings.md",
            "phase-4-the-booking-engine.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail any new summary, schema, or projection contract that introduces blocker or reconciliation labels into `Request.workflowState`.",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["ControlStatusSnapshot", "DecisionEpoch"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_STATE_002 downstream domains may still mirror case-local ambiguity into canonical workflow state."],
        "query_terms": ["workflowState", "reconciliation_required", "identity_hold", "milestone-only"],
    },
    {
        "concept_id": "STATE_SAFETY_AXIS",
        "dimension": "state_vocabulary",
        "preferred_term": "Request.safetyState is a persisted orthogonal axis",
        "keywords": [
            "safetyState",
            "urgent_diversion_required",
            "urgent_diverted",
            "residual_risk_flagged",
            "screen_clear",
        ],
        "aliases": ["urgent or not urgent", "binary urgent state"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Persist `Request.safetyState` independently of workflow milestones and keep `urgent_diversion_required` separate from `urgent_diverted`.",
        "losing_sources": ["blueprint-init.md", "vecells-complete-end-to-end-flow.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary text that collapses urgent diversion requirement and completion into one state.",
        "affected_phases": ["phase_0", "phase_1", "phase_3", "phase_6", "cross_phase"],
        "required_evidence_classes": ["SafetyDecisionRecord", "UrgentDiversionSettlement"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_STATE_003 summary prose can still blur residual review and urgent-diversion completion if it avoids the named axis."],
        "query_terms": ["safetyState", "urgent_diversion_required", "urgent_diverted", "residual_risk_flagged"],
    },
    {
        "concept_id": "STATE_IDENTITY_AXIS_PATIENTREF",
        "dimension": "state_vocabulary",
        "preferred_term": "identityState plus nullable patientRef derived from IdentityBinding",
        "keywords": [
            "identityState",
            "patientRef",
            "currentIdentityBindingRef",
            "ownershipState",
            "IdentityBinding",
        ],
        "aliases": ["ownershipState"],
        "deprecated_aliases": ["ownershipState"],
        "classification": "canonical_conflict",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Use `identityState = anonymous | partial_match | matched | claimed`; treat `patientRef` as nullable and derive it only from settled `IdentityBinding`.",
        "losing_sources": ["forensic-audit-findings.md", "blueprint-init.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject any summary or schema that assumes unconditional `patientRef` or uses `ownershipState` instead of `identityState`.",
        "affected_phases": ["phase_0", "phase_2", "phase_7", "cross_phase"],
        "required_evidence_classes": ["IdentityRepairEvidenceBundle", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_STATE_004 route-level auth copy can still imply stable identity before claim and binding settle."],
        "query_terms": ["identityState", "patientRef", "currentIdentityBindingRef", "ownershipState"],
    },
    {
        "concept_id": "STATE_BLOCKER_ORTHOGONALITY",
        "dimension": "state_vocabulary",
        "preferred_term": "blockers remain orthogonal to workflow milestones",
        "keywords": [
            "blockers must remain orthogonal",
            "currentClosureBlockerRefs",
            "currentConfirmationGateRefs",
            "workflowState",
            "identity_hold",
            "reconciliation_required",
        ],
        "aliases": ["workflow holds", "reconciliation workflow state"],
        "forbidden_aliases": ["identity_hold", "reconciliation_required"],
        "classification": "canonical_conflict",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Represent duplicate review, identity repair, fallback recovery, reachability repair, and confirmation ambiguity in blocker or gate refs, never as workflow milestones.",
        "losing_sources": ["forensic-audit-findings.md", "phase-4-the-booking-engine.md", "phase-6-the-pharmacy-loop.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail any summary or codegen rule that serializes blockers as workflow milestones.",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["RequestClosureRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_STATE_005 child-case summaries may still hide blocker semantics behind calm milestone prose."],
        "query_terms": ["currentClosureBlockerRefs", "currentConfirmationGateRefs", "identity_hold", "reconciliation_required"],
    },
    {
        "concept_id": "OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE",
        "dimension": "object_ownership",
        "preferred_term": "SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership",
        "keywords": [
            "SubmissionEnvelope",
            "RequestLineage",
            "LineageCaseLink",
            "child case",
            "same governed intake lineage",
        ],
        "aliases": ["single request shell", "same request lineage shell"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Keep pre-submit capture on `SubmissionEnvelope`, canonical submitted work on `Request`, continuity on `RequestLineage`, and phase-local work on child cases linked through `LineageCaseLink`.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_1", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["SubmissionPromotionRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": [],
        "query_terms": ["SubmissionEnvelope", "RequestLineage", "LineageCaseLink", "child case"],
    },
    {
        "concept_id": "OWNERSHIP_LIFECYCLE_COORDINATOR",
        "dimension": "object_ownership",
        "preferred_term": "LifecycleCoordinator alone derives canonical Request milestone change and closure",
        "keywords": [
            "LifecycleCoordinator",
            "sole cross-domain authority",
            "derive Request.workflowState",
            "child domains emit facts",
        ],
        "aliases": ["coordinator-owned closure"],
        "classification": "canonical_conflict",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Triage, booking, hub, pharmacy, support, and assistive domains emit facts, milestones, blockers, and evidence; only `LifecycleCoordinator` derives canonical request milestone change and closure.",
        "losing_sources": [
            "phase-3-the-human-checkpoint.md",
            "phase-4-the-booking-engine.md",
            "phase-5-the-network-horizon.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Block any summary or schema implying a child domain writes canonical request close/reopen state directly.",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["DecisionEpoch", "ControlStatusSnapshot", "RequestClosureRecord"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_OWNERSHIP_001 phased delivery could reintroduce direct state writes if child-case summaries are copied into API contracts."],
        "query_terms": ["LifecycleCoordinator", "directly write canonical request state", "child domains emit facts"],
    },
    {
        "concept_id": "OWNERSHIP_VISIBILITY_POLICY",
        "dimension": "object_ownership",
        "preferred_term": "VisibilityProjectionPolicy owns materialization and calmness eligibility",
        "keywords": [
            "VisibilityProjectionPolicy",
            "MinimumNecessaryContract",
            "before data is materialized",
            "visibility posture",
        ],
        "aliases": ["visibility policy ownership"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Visibility, masking, and section posture must resolve through `VisibilityProjectionPolicy` and related contracts before projection materialization or calm trust cues render.",
        "losing_sources": ["blueprint-init.md", "patient-account-and-communications-blueprint.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary-layer language that implies projections can materialize before visibility or masking policy is compiled.",
        "affected_phases": ["phase_0", "phase_1", "phase_3", "phase_4", "phase_6", "cross_phase"],
        "required_evidence_classes": ["ControlStatusSnapshot", "ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_OWNERSHIP_002 summary docs can still treat placeholders as presentation-only instead of policy-owned state."],
        "query_terms": ["VisibilityProjectionPolicy", "before data is materialized", "MinimumNecessaryContract"],
    },
    {
        "concept_id": "UI_SHELL_FAMILY_OWNERSHIP",
        "dimension": "ui_shell_semantics",
        "preferred_term": "ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency",
        "keywords": [
            "ShellFamilyOwnershipContract",
            "RouteFamilyOwnershipClaim",
            "shell ownership",
            "route family",
            "same shell",
        ],
        "aliases": ["route-prefix shell ownership", "layout resemblance shell ownership"],
        "classification": "terminology_drift",
        "canonical_winner_source": "platform-frontend-blueprint.md",
        "resolution_summary": "Shell residency is governed by `ShellFamilyOwnershipContract` and `RouteFamilyOwnershipClaim`, not route prefixes, feature names, or layout resemblance.",
        "losing_sources": ["phase-cards.md", "blueprint-init.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail any new summary or IA doc that infers shell ownership from URL prefix or feature area alone.",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "phase_8", "cross_phase"],
        "required_evidence_classes": ["ExperienceContinuityControlEvidence", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["DesignContractPublicationBundle", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_UI_001 route-family drift can still produce detached mini-shells if summary docs stay informal."],
        "query_terms": ["ShellFamilyOwnershipContract", "RouteFamilyOwnershipClaim", "shell ownership"],
    },
    {
        "concept_id": "UI_SAME_OBJECT_SAME_SHELL",
        "dimension": "ui_shell_semantics",
        "preferred_term": "same object, same shell",
        "keywords": [
            "same object, same shell",
            "same-shell",
            "shellContinuityKey",
            "entityContinuityKey",
            "ContinuityTransitionCheckpoint",
        ],
        "aliases": ["same request shell", "same-shell recovery"],
        "classification": "exact_match",
        "canonical_winner_source": "platform-frontend-blueprint.md",
        "resolution_summary": "If the continuity keys remain valid, adjacent child states morph inside the existing shell and preserve selected anchor, status strip, and bounded recovery posture.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_1", "phase_3", "phase_4", "phase_5", "phase_6", "phase_8", "cross_phase"],
        "required_evidence_classes": ["ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["DesignContractPublicationBundle", "AudienceSurfaceRuntimeBinding"],
        "open_risks": [],
        "query_terms": ["same object, same shell", "same-shell", "shellContinuityKey", "entityContinuityKey"],
    },
    {
        "concept_id": "UI_CHANNEL_PROFILE_CONSTRAINTS",
        "dimension": "ui_shell_semantics",
        "preferred_term": "channel profiles constrain shell posture without redefining the shell family",
        "keywords": [
            "channelProfile",
            "embedded",
            "constrained_browser",
            "ReleaseApprovalFreeze",
            "ChannelReleaseFreezeRecord",
            "deferred channel",
        ],
        "aliases": ["NHS App hard gate", "embedded shell as separate app"],
        "classification": "terminology_drift",
        "canonical_winner_source": "platform-frontend-blueprint.md",
        "resolution_summary": "Embedded, constrained-browser, and browser handoff change channel posture and affordances, but not the owning shell family; NHS App remains a deferred channel-expansion phase rather than a present hard gate.",
        "losing_sources": ["blueprint-init.md", "phase-cards.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary language that treats NHS App embedded delivery as a current baseline hard gate or separate native workflow.",
        "affected_phases": ["phase_0", "phase_2", "phase_7", "cross_phase"],
        "required_evidence_classes": ["ExperienceContinuityControlEvidence", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_UI_002 channel summaries can still overstate embedded rollout scope if deferred posture is not explicit."],
        "query_terms": ["channelProfile", "embedded", "deferred channel", "ChannelReleaseFreezeRecord"],
    },
    {
        "concept_id": "MUTATION_ROUTE_INTENT_BINDING",
        "dimension": "patient_continuity_and_mutation_controls",
        "preferred_term": "RouteIntentBinding is the canonical post-submit mutation fence",
        "keywords": [
            "RouteIntentBinding",
            "route intent",
            "post-submit mutation",
            "route family",
        ],
        "aliases": ["route-local actionability", "generic continuation link"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Every post-submit mutation binds one live `RouteIntentBinding` over route family, session, subject binding, fence epoch, and publication posture.",
        "losing_sources": ["blueprint-init.md", "phase-cards.md", "vecells-complete-end-to-end-flow.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject patient or staff mutation summaries that describe live actions without a bound route-intent tuple.",
        "affected_phases": ["phase_0", "phase_1", "phase_2", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["CommandActionRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["AudienceSurfaceRuntimeBinding", "RuntimePublicationBundle"],
        "open_risks": ["RISK_MUTATION_001 summary prose can still describe mutable posture before route intent is validated."],
        "query_terms": ["RouteIntentBinding", "route intent", "post-submit mutation"],
    },
    {
        "concept_id": "MUTATION_COMMAND_ACTION_RECORD",
        "dimension": "patient_continuity_and_mutation_controls",
        "preferred_term": "CommandActionRecord is the canonical mutation envelope",
        "keywords": [
            "CommandActionRecord",
            "command action",
            "authoritative action record",
        ],
        "aliases": ["local action receipt"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Every consequence-bearing post-submit mutation emits one durable `CommandActionRecord` tied to the active route-intent tuple and governing object version.",
        "losing_sources": ["phase-cards.md", "phase-3-the-human-checkpoint.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail route summaries that mention mutation without a durable action-envelope record.",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["CommandActionRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_MUTATION_002 teams may keep local receipts but omit the canonical action envelope."],
        "query_terms": ["CommandActionRecord", "TaskCommandSettlement", "action record"],
    },
    {
        "concept_id": "MUTATION_COMMAND_SETTLEMENT_RECORD",
        "dimension": "patient_continuity_and_mutation_controls",
        "preferred_term": "CommandSettlementRecord is the authoritative outcome for visible mutation state",
        "keywords": [
            "CommandSettlementRecord",
            "settlement",
            "authoritative outcome",
            "TransitionEnvelope",
        ],
        "aliases": ["local acknowledgement", "success toast", "delivery-only reassurance"],
        "deprecated_aliases": ["generic success toast"],
        "classification": "underspecified_summary",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "UI calmness, success, stale recovery, and continuation posture must advance from authoritative `CommandSettlementRecord`, not optimistic UI or delivery-only signals.",
        "losing_sources": ["phase-cards.md", "blueprint-init.md", "forensic-audit-findings.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary or UI contracts that collapse local acknowledgement into final authoritative outcome.",
        "affected_phases": ["phase_0", "phase_1", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["CommandSettlementRecord", "ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle", "ReleaseRecoveryDisposition"],
        "open_risks": ["RISK_MUTATION_003 same-shell confirmations can still understate settlement and recovery posture."],
        "query_terms": ["CommandSettlementRecord", "settlement", "success toast", "authoritative outcome"],
    },
    {
        "concept_id": "MUTATION_RECOVERY_ENVELOPES",
        "dimension": "patient_continuity_and_mutation_controls",
        "preferred_term": "same-shell recovery uses typed recovery and continuation envelopes",
        "keywords": [
            "PatientActionRecoveryEnvelope",
            "RecoveryContinuationToken",
            "PatientNavReturnContract",
            "SupportReplayRestoreSettlement",
            "same-shell recovery",
        ],
        "aliases": ["expired link handling", "browser return"],
        "classification": "exact_match",
        "canonical_winner_source": "patient-account-and-communications-blueprint.md",
        "resolution_summary": "Recover stale, expired, denied-scope, blocked-policy, and replay-return paths inside the same shell through typed continuation and return contracts.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_1", "phase_2", "phase_4", "phase_6", "phase_9", "cross_phase"],
        "required_evidence_classes": ["ExperienceContinuityControlEvidence", "SupportReplayRestoreSettlement"],
        "required_runtime_publication_tuples": ["ReleaseRecoveryDisposition", "AudienceSurfaceRuntimeBinding"],
        "open_risks": [],
        "query_terms": ["PatientActionRecoveryEnvelope", "RecoveryContinuationToken", "PatientNavReturnContract", "SupportReplayRestoreSettlement"],
    },
    {
        "concept_id": "TRUTH_RESERVATION_TRUTH",
        "dimension": "booking_hub_pharmacy_truth_semantics",
        "preferred_term": "reservation truth comes from CapacityReservation and ReservationTruthProjection",
        "keywords": [
            "CapacityReservation",
            "ReservationTruthProjection",
            "reservation truth",
            "false exclusivity",
        ],
        "aliases": ["countdown copy as hold", "offer implies exclusivity"],
        "classification": "terminology_drift",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Visible booking exclusivity and hold truth come from `ReservationAuthority`, `CapacityReservation`, and `ReservationTruthProjection`, not countdown copy or supplier hints.",
        "losing_sources": ["phase-cards.md", "blueprint-init.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject booking summaries that imply exclusivity without reservation-truth contracts.",
        "affected_phases": ["phase_0", "phase_4", "phase_5", "cross_phase"],
        "required_evidence_classes": ["ControlStatusSnapshot", "ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_BOOKING_001 summary text can still imply harder booking guarantees than the reservation authority proves."],
        "query_terms": ["CapacityReservation", "ReservationTruthProjection", "false exclusivity"],
    },
    {
        "concept_id": "TRUTH_EXTERNAL_CONFIRMATION_GATE",
        "dimension": "booking_hub_pharmacy_truth_semantics",
        "preferred_term": "ExternalConfirmationGate governs ambiguous booking and dispatch truth",
        "keywords": [
            "ExternalConfirmationGate",
            "confirmation pending",
            "ambiguous supplier truth",
            "confirmation gate",
        ],
        "aliases": ["premature booked state", "generic reconciliation_required"],
        "classification": "terminology_drift",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Use `ExternalConfirmationGate` and case-local truth projections for ambiguous external booking or dispatch states; never imply final booked or referred calmness before the gate clears.",
        "losing_sources": ["phase-cards.md", "phase-4-the-booking-engine.md", "phase-6-the-pharmacy-loop.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary language that implies authoritative external success before confirmation-gate resolution.",
        "affected_phases": ["phase_0", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["BookingConfirmationTruthProjection", "PharmacyDispatchSettlement"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_BOOKING_002 summary cards can still over-promise external truth if they skip the gate vocabulary."],
        "query_terms": ["ExternalConfirmationGate", "confirmation pending", "premature booked", "ambiguous supplier truth"],
    },
    {
        "concept_id": "TRUTH_DISPATCH_PROOF",
        "dimension": "booking_hub_pharmacy_truth_semantics",
        "preferred_term": "pharmacy calmness depends on dispatch proof, not transport acceptance alone",
        "keywords": [
            "dispatch proof",
            "authoritativeDispatchProofState",
            "transportAcceptanceState",
            "providerAcceptanceState",
            "proof_pending",
        ],
        "aliases": ["mailbox delivered equals referred", "accepted for processing equals resolved"],
        "classification": "terminology_drift",
        "canonical_winner_source": "phase-6-the-pharmacy-loop.md",
        "resolution_summary": "Separate transport acceptance, provider acceptance, and authoritative dispatch proof, and keep patient or staff calmness pending until dispatch proof and any confirmation gate satisfy the transport class.",
        "losing_sources": ["blueprint-init.md", "vecells-complete-end-to-end-flow.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail pharmacy summary text that equates send acceptance with final referral truth.",
        "affected_phases": ["phase_0", "phase_6", "cross_phase"],
        "required_evidence_classes": ["PharmacyDispatchSettlement", "ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_PHARMACY_001 transport-level acknowledgements can still masquerade as final referral truth."],
        "query_terms": ["dispatch proof", "authoritativeDispatchProofState", "transportAcceptanceState", "providerAcceptanceState"],
    },
    {
        "concept_id": "TRUTH_REOPEN_AND_BOUNCE_BACK",
        "dimension": "booking_hub_pharmacy_truth_semantics",
        "preferred_term": "bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth",
        "keywords": [
            "bounce-back",
            "reopen",
            "FallbackReviewCase",
            "same request lineage",
            "same-shell pending",
        ],
        "aliases": ["generic bounce-back", "detached reopen workflow"],
        "classification": "terminology_drift",
        "canonical_winner_source": "vecells-complete-end-to-end-flow.md",
        "resolution_summary": "When accepted progress degrades, reopen or bounce back inside the same lineage using explicit fallback, exception, or recovery cases rather than detached secondary workflows.",
        "losing_sources": ["blueprint-init.md", "phase-6-the-pharmacy-loop.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["ExperienceContinuityControlEvidence", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ReleaseRecoveryDisposition", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_RECOVERY_001 reopen semantics may fork if summary docs revert to generic return wording."],
        "query_terms": ["bounce-back", "reopen", "FallbackReviewCase", "same request lineage"],
    },
    {
        "concept_id": "TRUTH_CHILD_DOMAIN_STATE_WRITES",
        "dimension": "booking_hub_pharmacy_truth_semantics",
        "preferred_term": "child domains emit milestones and evidence; they do not write canonical Request state directly",
        "keywords": [
            "write canonical request state directly",
            "TriageMilestoneSignal",
            "BookingOutcomeMilestone",
            "HubCoordinationMilestone",
            "PharmacyOutcomeMilestone",
            "LifecycleCoordinator",
        ],
        "aliases": ["domain-local request close", "child workflow owns canonical milestone"],
        "classification": "canonical_conflict",
        "canonical_winner_source": "forensic-audit-findings.md",
        "resolution_summary": "Normalize triage, booking, hub, and pharmacy outputs to case-local milestones, gates, and leases that `LifecycleCoordinator` consumes to derive canonical request state.",
        "losing_sources": [
            "phase-3-the-human-checkpoint.md",
            "phase-4-the-booking-engine.md",
            "phase-5-the-network-horizon.md",
            "phase-6-the-pharmacy-loop.md",
        ],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summary text or contracts that let a child domain claim final canonical request milestone ownership.",
        "affected_phases": ["phase_3", "phase_4", "phase_5", "phase_6", "cross_phase"],
        "required_evidence_classes": ["DecisionEpoch", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle"],
        "open_risks": ["RISK_OWNERSHIP_003 downstream bounded contexts can drift back into direct canonical state writes under delivery pressure."],
        "query_terms": ["write canonical request state directly", "BookingOutcomeMilestone", "HubCoordinationMilestone", "PharmacyOutcomeMilestone", "TriageMilestoneSignal"],
    },
    {
        "concept_id": "RUNTIME_RELEASE_APPROVAL_FREEZE",
        "dimension": "runtime_release",
        "preferred_term": "ReleaseApprovalFreeze binds the promotable approval tuple",
        "keywords": [
            "ReleaseApprovalFreeze",
            "approval tuple",
            "promotion gate",
            "release freeze",
        ],
        "aliases": ["bundle hash only release gate"],
        "classification": "exact_match",
        "canonical_winner_source": "platform-runtime-and-release-blueprint.md",
        "resolution_summary": "Freeze runtime, schema, config, compatibility, and bridge posture through one `ReleaseApprovalFreeze` tuple before writable exposure or promotion.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_4", "phase_7", "phase_9", "cross_phase"],
        "required_evidence_classes": ["ReleaseGateEvidence", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ReleaseApprovalFreeze", "ReleasePublicationParityRecord"],
        "open_risks": [],
        "query_terms": ["ReleaseApprovalFreeze", "promotion gate", "approval tuple"],
    },
    {
        "concept_id": "RUNTIME_CHANNEL_RELEASE_FREEZE",
        "dimension": "runtime_release",
        "preferred_term": "ChannelReleaseFreezeRecord fences mutable channel posture",
        "keywords": [
            "ChannelReleaseFreezeRecord",
            "channel freeze",
            "embedded",
            "channel-specific routes",
        ],
        "aliases": ["manifest-only channel guard"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-0-the-foundation-protocol.md",
        "resolution_summary": "Freeze embedded or channel-specific mutability through `ChannelReleaseFreezeRecord` in combination with `ReleaseApprovalFreeze` and route recovery disposition.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_2", "phase_7", "phase_9", "cross_phase"],
        "required_evidence_classes": ["WaveGuardrailSnapshot", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ChannelReleaseFreezeRecord", "ReleaseApprovalFreeze"],
        "open_risks": [],
        "query_terms": ["ChannelReleaseFreezeRecord", "channel freeze", "embedded"],
    },
    {
        "concept_id": "RUNTIME_ASSURANCE_SLICE_TRUST",
        "dimension": "runtime_release",
        "preferred_term": "AssuranceSliceTrustRecord governs degraded or quarantined operational truth",
        "keywords": [
            "AssuranceSliceTrustRecord",
            "degraded",
            "quarantined",
            "trustLowerBound",
        ],
        "aliases": ["green dashboard despite degraded trust"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-9-the-assurance-ledger.md",
        "resolution_summary": "Use `AssuranceSliceTrustRecord` as the authoritative trust fence for runtime, operations, governance, and assistive write posture.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_8", "phase_9", "cross_phase"],
        "required_evidence_classes": ["AssuranceSliceTrustRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ReleaseTrustFreezeVerdict", "RuntimePublicationBundle"],
        "open_risks": [],
        "query_terms": ["AssuranceSliceTrustRecord", "trustLowerBound", "degraded", "quarantined"],
    },
    {
        "concept_id": "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT",
        "dimension": "runtime_release",
        "preferred_term": "RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple",
        "keywords": [
            "RuntimePublicationBundle",
            "DesignContractPublicationBundle",
            "ReleasePublicationParityRecord",
            "AudienceSurfaceRuntimeBinding",
            "DesignContractLintVerdict",
        ],
        "aliases": ["token export as sidecar", "route-local manifest convention"],
        "classification": "terminology_drift",
        "canonical_winner_source": "platform-runtime-and-release-blueprint.md",
        "resolution_summary": "Treat runtime publication, parity, route contracts, design contracts, and surface bindings as one exact published tuple before calm or writable posture remains live.",
        "losing_sources": ["phase-cards.md", "blueprint-init.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Fail any summary or publication contract that treats token export or route manifests as separable from the live runtime tuple.",
        "affected_phases": ["phase_0", "phase_4", "phase_7", "phase_8", "phase_9", "cross_phase"],
        "required_evidence_classes": ["ReleasePublicationParityRecord", "ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle", "DesignContractPublicationBundle", "AudienceSurfaceRuntimeBinding"],
        "open_risks": ["RISK_RUNTIME_001 design-contract and runtime-publication language can still drift if summary docs compress them into generic manifest wording."],
        "query_terms": ["RuntimePublicationBundle", "DesignContractPublicationBundle", "ReleasePublicationParityRecord", "AudienceSurfaceRuntimeBinding"],
    },
    {
        "concept_id": "ASSURANCE_EVIDENCE_GRAPH",
        "dimension": "assurance_semantics",
        "preferred_term": "AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof",
        "keywords": [
            "AssuranceEvidenceGraphSnapshot",
            "AssuranceGraphCompletenessVerdict",
            "evidence graph",
            "graph-coherent system",
        ],
        "aliases": ["parallel local evidence lists"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-9-the-assurance-ledger.md",
        "resolution_summary": "Assurance, retention, replay, recovery, and standards proof must converge through one deterministic evidence graph and completeness verdict.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_9", "cross_phase"],
        "required_evidence_classes": ["AssuranceEvidenceGraphSnapshot", "AssuranceGraphCompletenessVerdict"],
        "required_runtime_publication_tuples": ["ReleaseWatchTuple"],
        "open_risks": [],
        "query_terms": ["AssuranceEvidenceGraphSnapshot", "AssuranceGraphCompletenessVerdict", "graph-coherent system"],
    },
    {
        "concept_id": "ASSURANCE_CONTINUITY_EVIDENCE",
        "dimension": "assurance_semantics",
        "preferred_term": "continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence",
        "keywords": [
            "ExperienceContinuityControlEvidence",
            "continuity evidence",
            "OpsContinuityEvidenceProjection",
            "GovernanceContinuityEvidenceBundle",
            "PL_CONT",
        ],
        "aliases": ["continuity as narrative only"],
        "classification": "terminology_drift",
        "canonical_winner_source": "phase-9-the-assurance-ledger.md",
        "resolution_summary": "Treat patient-home actionability, thread settlement, booking manage, support replay, assistive session, workspace completion, and pharmacy-console settlement as evidence-producing continuity controls with shared ops and governance consumption.",
        "losing_sources": ["phase-cards.md", "forensic-audit-findings.md", "vecells-complete-end-to-end-flow.md"],
        "summary_patch_required": True,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject summaries that describe calm continuity behavior without naming the continuity evidence tuple that proves it.",
        "affected_phases": ["phase_0", "phase_4", "phase_5", "phase_6", "phase_8", "phase_9", "cross_phase"],
        "required_evidence_classes": [
            "ExperienceContinuityControlEvidence",
            "OpsContinuityEvidenceSlice",
            "GovernanceContinuityEvidenceBundle",
        ],
        "required_runtime_publication_tuples": ["ReleaseWatchTuple", "RuntimePublicationBundle"],
        "open_risks": ["RISK_ASSURANCE_001 user-facing calmness can still outrun proof if continuity evidence is summarized too loosely."],
        "query_terms": ["ExperienceContinuityControlEvidence", "OpsContinuityEvidenceProjection", "GovernanceContinuityEvidenceBundle", "PL_CONT"],
    },
    {
        "concept_id": "ASSURANCE_OPERATIONAL_READINESS",
        "dimension": "assurance_semantics",
        "preferred_term": "OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority",
        "keywords": [
            "OperationalReadinessSnapshot",
            "RecoveryControlPosture",
            "RunbookBindingRecord",
            "RestoreRun",
            "FailoverRun",
            "ChaosRun",
        ],
        "aliases": ["runbooks and dashboards only"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-9-the-assurance-ledger.md",
        "resolution_summary": "Restore, failover, and resilience posture must be justified through `OperationalReadinessSnapshot`, bound runbook records, and authoritative recovery settlements rather than loose runbooks or dashboards.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_9", "cross_phase"],
        "required_evidence_classes": ["OperationalReadinessSnapshot", "RecoveryEvidencePack"],
        "required_runtime_publication_tuples": ["ReleaseWatchTuple", "RuntimePublicationBundle"],
        "open_risks": [],
        "query_terms": ["OperationalReadinessSnapshot", "RecoveryControlPosture", "RunbookBindingRecord", "RestoreRun", "FailoverRun", "ChaosRun"],
    },
    {
        "concept_id": "PROGRAMME_CONFORMANCE_SCORECARD",
        "dimension": "assurance_semantics",
        "preferred_term": "CrossPhaseConformanceScorecard defines machine-auditable programme alignment",
        "keywords": [
            "CrossPhaseConformanceScorecard",
            "PhaseConformanceRow",
            "no phase summary may remain complete",
        ],
        "aliases": ["summary-only done definition"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-cards.md",
        "resolution_summary": "Programme planning, runtime proof, governance proof, ops proof, and Phase 9 exit criteria reconcile through one `CrossPhaseConformanceScorecard` over machine-auditable rows.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": False,
        "lint_rule_hint": "",
        "affected_phases": ["phase_0", "phase_1", "phase_2", "phase_3", "phase_4", "phase_5", "phase_6", "phase_7", "phase_8", "phase_9", "cross_phase"],
        "required_evidence_classes": ["ControlStatusSnapshot", "AssuranceSliceTrustRecord", "ExperienceContinuityControlEvidence"],
        "required_runtime_publication_tuples": ["RuntimePublicationBundle", "ReleaseWatchTuple"],
        "open_risks": [],
        "query_terms": ["CrossPhaseConformanceScorecard", "PhaseConformanceRow", "no phase summary may remain complete"],
    },
    {
        "concept_id": "SCOPE_DEFERRED_NHS_APP",
        "dimension": "programme_scope",
        "preferred_term": "NHS App embedded delivery is deferred baseline scope, not a current hard gate",
        "keywords": [
            "deferred channel",
            "deferred baseline",
            "NHS App integration is a deferred channel-expansion phase",
            "Phase 7",
        ],
        "aliases": ["NHS App hard gate", "current hard-gate delivery"],
        "classification": "exact_match",
        "canonical_winner_source": "phase-cards.md",
        "resolution_summary": "Treat Phase 7 as deferred channel expansion while keeping its guardrail contracts visible in the summary layer.",
        "losing_sources": [],
        "summary_patch_required": False,
        "lint_rule_recommended": True,
        "lint_rule_hint": "Reject planning summaries that treat NHS App embedded delivery as required before the core 0-6, 8, and 9 baseline completes.",
        "affected_phases": ["phase_7", "cross_phase"],
        "required_evidence_classes": ["ControlStatusSnapshot"],
        "required_runtime_publication_tuples": ["ReleaseApprovalFreeze", "ChannelReleaseFreezeRecord"],
        "open_risks": [],
        "query_terms": ["deferred channel", "deferred baseline", "Phase 7", "NHS App integration is a deferred channel-expansion phase"],
    },
]


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_markdown_sections(text: str) -> tuple[list[str], list[dict[str, Any]]]:
    lines = text.splitlines()
    sections: list[dict[str, Any]] = []
    for idx, line in enumerate(lines, start=1):
        match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not match:
            continue
        sections.append(
            {
                "level": len(match.group(1)),
                "heading": normalize_space(match.group(2)),
                "line": idx,
            }
        )
    for index, section in enumerate(sections):
        section["end_line"] = (
            sections[index + 1]["line"] - 1 if index + 1 < len(sections) else len(lines)
        )
    return lines, sections


def current_heading(line_number: int, sections: list[dict[str, Any]]) -> str:
    heading = "Document body"
    for section in sections:
        if section["line"] <= line_number:
            heading = section["heading"]
        else:
            break
    return heading


def build_segments(lines: list[str], sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    current: list[str] = []
    start_line = 1
    for index, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if not stripped:
            if current:
                text = normalize_space(" ".join(current))
                segments.append(
                    {
                        "text": text,
                        "start_line": start_line,
                        "heading": current_heading(start_line, sections),
                    }
                )
                current = []
            continue
        if not current:
            start_line = index
        if stripped.startswith("#"):
            continue
        current.append(stripped)
    if current:
        segments.append(
            {
                "text": normalize_space(" ".join(current)),
                "start_line": start_line,
                "heading": current_heading(start_line, sections),
            }
        )
    return segments


def load_source_index() -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for filename in SOURCE_FILES:
        text = read_text(BLUEPRINT_DIR / filename)
        lines, sections = parse_markdown_sections(text)
        index[filename] = {
            "text": text,
            "lines": lines,
            "sections": sections,
            "segments": build_segments(lines, sections),
        }
    return index


def score_segment(segment_text: str, terms: list[str]) -> int:
    lowered = segment_text.lower()
    score = 0
    for term in terms:
        term_lower = term.lower()
        if term_lower in lowered:
            score += 5 if term_lower == term_lower.strip("`") else 3
    return score


def best_source_match(source_index: dict[str, Any], concept: dict[str, Any]) -> dict[str, Any]:
    terms = concept["keywords"] + concept.get("aliases", []) + concept.get("deprecated_aliases", []) + concept.get("forbidden_aliases", [])
    best: dict[str, Any] | None = None
    for segment in source_index["segments"]:
        score = score_segment(segment["text"], terms)
        if score <= 0:
            continue
        candidate = {
            "heading": segment["heading"],
            "line": segment["start_line"],
            "excerpt": segment["text"][:420],
            "score": score,
        }
        if best is None or candidate["score"] > best["score"] or (
            candidate["score"] == best["score"] and candidate["line"] < best["line"]
        ):
            best = candidate
    if best is None:
        return {
            "status": "not_addressed",
            "heading": "",
            "line": "",
            "excerpt": "",
            "matched_terms": [],
        }
    excerpt_lower = best["excerpt"].lower()
    matched_terms = [
        term
        for term in terms
        if term.lower() in excerpt_lower
    ]
    return {
        "status": "addressed",
        "heading": best["heading"],
        "line": best["line"],
        "excerpt": best["excerpt"],
        "matched_terms": matched_terms,
    }


def load_requirement_registry() -> list[dict[str, Any]]:
    registry_path = DATA_DIR / "requirement_registry.jsonl"
    rows = []
    for line in registry_path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def related_requirement_ids(
    registry_rows: list[dict[str, Any]], concept: dict[str, Any]
) -> list[str]:
    query_terms = [term.lower() for term in concept.get("query_terms", [])]
    related = []
    for row in registry_rows:
        if row["canonicality"] not in {"canonical", "derived_from_canonical_gap_closure"}:
            continue
        blob = " ".join(
            [
                row["requirement_title"],
                row["source_heading_or_logical_block"],
                row["direct_quote_or_precise_paraphrase"],
                row["expected_behavior"],
            ]
        ).lower()
        if any(term in blob for term in query_terms):
            related.append(row["requirement_id"])
    return sorted(set(related))


def source_column_name(filename: str) -> str:
    return f"source__{slugify(filename)}"


def source_note(match: dict[str, Any]) -> str:
    if match["status"] == "not_addressed":
        return "not addressed"
    return f"{match['heading']} (line {match['line']}): {match['excerpt']}"


def build_matrix_rows() -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    source_index = load_source_index()
    registry_rows = load_requirement_registry()

    matrix_rows: list[dict[str, Any]] = []
    conflict_rows: list[dict[str, Any]] = []
    alias_rows: list[dict[str, Any]] = []
    concept_summaries: list[dict[str, Any]] = []

    for concept in CONCEPTS:
        row: dict[str, Any] = {
            "concept_id": concept["concept_id"],
            "dimension": concept["dimension"],
            "preferred_term": concept["preferred_term"],
            "classification": concept["classification"],
            "canonical_winner_source": concept["canonical_winner_source"],
            "resolution_summary": concept["resolution_summary"],
            "summary_patch_required": "yes" if concept["summary_patch_required"] else "no",
            "lint_rule_recommended": "yes" if concept["lint_rule_recommended"] else "no",
            "lint_rule_hint": concept["lint_rule_hint"],
            "losing_sources": "|".join(concept["losing_sources"]),
            "affected_phases": "|".join(concept["affected_phases"]),
            "required_evidence_classes": "|".join(concept["required_evidence_classes"]),
            "required_runtime_publication_tuples": "|".join(concept["required_runtime_publication_tuples"]),
            "open_risks": "|".join(concept["open_risks"]),
        }
        source_matches = {}
        summary_addressed = 0
        for filename in SOURCE_FILES:
            match = best_source_match(source_index[filename], concept)
            source_matches[filename] = match
            if filename in SUMMARY_SOURCES and match["status"] == "addressed":
                summary_addressed += 1
            row[source_column_name(filename)] = source_note(match)

        related_ids = related_requirement_ids(registry_rows, concept)
        row["related_requirement_ids"] = "|".join(related_ids)

        concept_payload = {
            "concept_id": concept["concept_id"],
            "dimension": concept["dimension"],
            "preferred_term": concept["preferred_term"],
            "classification": concept["classification"],
            "canonical_winner": {
                "source_file": concept["canonical_winner_source"],
                "normalized_wording": concept["resolution_summary"],
            },
            "losing_sources": concept["losing_sources"],
            "summary_patch_required": concept["summary_patch_required"],
            "lint_rule_recommended": concept["lint_rule_recommended"],
            "lint_rule_hint": concept["lint_rule_hint"],
            "affected_phases": concept["affected_phases"],
            "required_evidence_classes": concept["required_evidence_classes"],
            "required_runtime_publication_tuples": concept["required_runtime_publication_tuples"],
            "open_risks": concept["open_risks"],
            "related_requirement_ids": related_ids,
            "source_expressions": {
                filename: source_matches[filename]
                for filename in SOURCE_FILES
            },
        }
        concept_summaries.append(concept_payload)

        if concept["classification"] != "exact_match":
            conflict_rows.append(concept_payload)

        alias_rows.append(
            {
                "concept_id": concept["concept_id"],
                "alias": concept["preferred_term"],
                "preferred_term": concept["preferred_term"],
                "alias_status": "preferred",
                "rationale": "Preferred canonical wording.",
            }
        )
        for alias in concept.get("aliases", []):
            alias_rows.append(
                {
                    "concept_id": concept["concept_id"],
                    "alias": alias,
                    "preferred_term": concept["preferred_term"],
                    "alias_status": "allowed",
                    "rationale": "Alias may appear in prose, but downstream work should normalize to the preferred term.",
                }
            )
        for alias in concept.get("deprecated_aliases", []):
            alias_rows.append(
                {
                    "concept_id": concept["concept_id"],
                    "alias": alias,
                    "preferred_term": concept["preferred_term"],
                    "alias_status": "deprecated",
                    "rationale": "Legacy wording remains traceable but should not appear in new summary or schema language.",
                }
            )
        for alias in concept.get("forbidden_aliases", []):
            alias_rows.append(
                {
                    "concept_id": concept["concept_id"],
                    "alias": alias,
                    "preferred_term": concept["preferred_term"],
                    "alias_status": "forbidden",
                    "rationale": "This wording would contradict the canonical contract if reused in new work.",
                }
            )

        row["summary_source_coverage"] = summary_addressed
        matrix_rows.append(row)

    alias_rows.extend(SPECIAL_ALIAS_ROWS)

    return matrix_rows, conflict_rows, alias_rows, concept_summaries


def phase_alignment_status(phase_row: dict[str, Any], concept_lookup: dict[str, dict[str, Any]]) -> str:
    if phase_row["phase_id"] == "phase_7":
        return "deferred_scope"
    non_exact = [
        concept_lookup[concept_id]
        for concept_id in phase_row["concept_ids"]
        if concept_lookup[concept_id]["classification"] != "exact_match"
    ]
    if non_exact:
        return "aligned_with_recorded_decisions"
    return "aligned_seeded"


def build_conformance_seed(concept_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    concept_lookup = {item["concept_id"]: item for item in concept_summaries}
    rows = []
    for phase in PHASE_SEED_ROWS:
        non_exact = [
            concept_id
            for concept_id in phase["concept_ids"]
            if concept_lookup[concept_id]["classification"] != "exact_match"
        ]
        open_risks = []
        for concept_id in phase["concept_ids"]:
            open_risks.extend(concept_lookup[concept_id]["open_risks"])
        rows.append(
            {
                "phase_id": phase["phase_id"],
                "phase_title": phase["phase_title"],
                "canonical_refs": phase["canonical_refs"],
                "summary_refs": phase["summary_refs"],
                "alignment_status": phase_alignment_status(phase, concept_lookup),
                "blocking_conflicts": non_exact,
                "required_evidence_classes": phase["required_evidence_classes"],
                "required_runtime_publication_tuples": phase["required_runtime_publication_tuples"],
                "open_risks": sorted(set(open_risks)),
            }
        )
    return {
        "seed_id": "cross_phase_conformance_seed_v1",
        "rows": rows,
    }


def write_csv(matrix_rows: list[dict[str, Any]]) -> None:
    fieldnames = [
        "concept_id",
        "dimension",
        "preferred_term",
        "classification",
        "canonical_winner_source",
        "resolution_summary",
        "summary_patch_required",
        "lint_rule_recommended",
        "lint_rule_hint",
        "losing_sources",
        "affected_phases",
        "required_evidence_classes",
        "required_runtime_publication_tuples",
        "open_risks",
        "related_requirement_ids",
        "summary_source_coverage",
    ] + [source_column_name(filename) for filename in SOURCE_FILES]
    with (DATA_DIR / "summary_reconciliation_matrix.csv").open(
        "w", encoding="utf-8", newline=""
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in matrix_rows:
            writer.writerow(row)


def write_json(conflict_rows: list[dict[str, Any]], alias_rows: list[dict[str, Any]], conformance_seed: dict[str, Any]) -> None:
    (DATA_DIR / "summary_conflicts.json").write_text(
        json.dumps(
            {
                "conflict_pack_id": "summary_conflicts_v1",
                "sources_compared": SOURCE_FILES,
                "rows": conflict_rows,
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "canonical_term_aliases.json").write_text(
        json.dumps(
            {
                "alias_map_id": "canonical_term_aliases_v1",
                "rows": alias_rows,
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )
    (DATA_DIR / "cross_phase_conformance_seed.json").write_text(
        json.dumps(conformance_seed, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def write_docs(matrix_rows: list[dict[str, Any]], conflict_rows: list[dict[str, Any]], alias_rows: list[dict[str, Any]], conformance_seed: dict[str, Any]) -> None:
    by_dimension = defaultdict(list)
    for row in matrix_rows:
        by_dimension[row["dimension"]].append(row)

    classification_counts = Counter(row["classification"] for row in matrix_rows)
    matrix_lines = [
        "# Summary reconciliation matrix",
        "",
        f"The reconciliation matrix compares {len(matrix_rows)} summary-layer concepts across {len(SOURCE_FILES)} required sources, using task 001's registry as the canonical term and requirement backbone.",
        "",
        "## Classification counts",
        "",
        "| Classification | Count |",
        "| --- | --- |",
    ]
    for classification, count in sorted(classification_counts.items()):
        matrix_lines.append(f"| `{classification}` | {count} |")
    matrix_lines.extend(
        [
            "",
            "## Concept matrix",
            "",
            "| Concept | Dimension | Classification | Canonical winner | Summary patch | Lint |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )
    for row in matrix_rows:
        matrix_lines.append(
            f"| `{row['concept_id']}` {row['preferred_term']} | `{row['dimension']}` | `{row['classification']}` | `{row['canonical_winner_source']}` | `{row['summary_patch_required']}` | `{row['lint_rule_recommended']}` |"
        )
    matrix_lines.extend(
        [
            "",
            "## Dimension notes",
            "",
        ]
    )
    for dimension, rows in sorted(by_dimension.items()):
        matrix_lines.append(f"### {dimension}")
        matrix_lines.append("")
        for row in rows:
            matrix_lines.append(
                f"- `{row['concept_id']}`: {row['resolution_summary']}"
            )
        matrix_lines.append("")
    (DOCS_DIR / "02_summary_reconciliation_matrix.md").write_text(
        "\n".join(matrix_lines) + "\n",
        encoding="utf-8",
    )

    decision_lines = [
        "# Summary reconciliation decisions",
        "",
        f"This decision pack records all {len(conflict_rows)} non-exact summary-layer discrepancies, including the canonical winner, normalized wording, losing sources, and future lint posture.",
        "",
    ]
    for row in conflict_rows:
        decision_lines.extend(
            [
                f"## {row['concept_id']} - {row['preferred_term']}",
                "",
                f"- Classification: `{row['classification']}`",
                f"- Canonical winner: `{row['canonical_winner']['source_file']}`",
                f"- Losing sources: {', '.join(row['losing_sources']) or 'none'}",
                f"- Normalized wording: {row['canonical_winner']['normalized_wording']}",
                f"- Summary patch required: `{'yes' if row['summary_patch_required'] else 'no'}`",
                f"- Future lint rule: `{row['lint_rule_hint'] or 'not required'}`",
                f"- Related requirement ids: {', '.join(row['related_requirement_ids']) or 'none'}",
                "",
            ]
        )
    (DOCS_DIR / "02_summary_reconciliation_decisions.md").write_text(
        "\n".join(decision_lines) + "\n",
        encoding="utf-8",
    )

    glossary_lines = [
        "# Canonical term glossary",
        "",
        "This glossary maps preferred terms, allowed aliases, deprecated legacy phrases, and forbidden phrasings used by the summary layer.",
        "",
        "| Alias | Preferred term | Status | Concept |",
        "| --- | --- | --- | --- |",
    ]
    seen = set()
    for row in alias_rows:
        key = (row["alias"], row["preferred_term"], row["alias_status"])
        if key in seen:
            continue
        seen.add(key)
        glossary_lines.append(
            f"| `{row['alias']}` | `{row['preferred_term']}` | `{row['alias_status']}` | `{row['concept_id']}` |"
        )
    glossary_lines.extend(
        [
            "",
            "## Required normalizations",
            "",
            "- `ownershipState` normalizes to `identityState`.",
            "- Generic `reconciliation_required` may remain case-local, but it must not appear as canonical `Request.workflowState`.",
            "- `Request(workflowState = draft)` normalizes to `SubmissionEnvelope.state = draft`.",
            "- Local acknowledgement or delivery proof normalizes to authoritative `CommandSettlementRecord` outcome semantics before calmness advances.",
        ]
    )
    (DOCS_DIR / "02_canonical_term_glossary.md").write_text(
        "\n".join(glossary_lines) + "\n",
        encoding="utf-8",
    )

    conformance_lines = [
        "# Cross-phase conformance seed",
        "",
        "This seed establishes one machine-readable row per phase so later runtime, governance, and Phase 9 proof can reconcile against the same alignment frame.",
        "",
        "| Phase | Alignment status | Blocking conflicts | Required evidence classes | Required runtime/publication tuples |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in conformance_seed["rows"]:
        conformance_lines.append(
            f"| `{row['phase_id']}` {row['phase_title']} | `{row['alignment_status']}` | "
            f"{', '.join(row['blocking_conflicts']) or 'none'} | "
            f"{', '.join(row['required_evidence_classes'])} | "
            f"{', '.join(row['required_runtime_publication_tuples'])} |"
        )
    (DOCS_DIR / "02_cross_phase_conformance_seed.md").write_text(
        "\n".join(conformance_lines) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    matrix_rows, conflict_rows, alias_rows, concept_summaries = build_matrix_rows()
    conformance_seed = build_conformance_seed(concept_summaries)
    write_csv(matrix_rows)
    write_json(conflict_rows, alias_rows, conformance_seed)
    write_docs(matrix_rows, conflict_rows, alias_rows, conformance_seed)


if __name__ == "__main__":
    main()
