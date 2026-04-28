#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
BLUEPRINT_DIR = ROOT / "blueprint"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
ALIAS_MAP_PATH = DATA_DIR / "canonical_term_aliases.json"
SCOPE_MATRIX_PATH = DATA_DIR / "product_scope_matrix.json"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
CHANNEL_INVENTORY_PATH = DATA_DIR / "channel_inventory.json"
PERSONA_CATALOG_PATH = DATA_DIR / "persona_catalog.json"
SHELL_MAP_PATH = DATA_DIR / "shell_ownership_map.json"
REQUEST_LINEAGE_MODEL_PATH = DATA_DIR / "request_lineage_transitions.json"

GLOSSARY_CSV_PATH = DATA_DIR / "canonical_domain_glossary.csv"
OBJECT_CATALOG_JSON_PATH = DATA_DIR / "object_catalog.json"
RELATIONSHIPS_CSV_PATH = DATA_DIR / "object_relationships.csv"
OBJECT_ALIAS_MAP_JSON_PATH = DATA_DIR / "object_alias_map.json"
OBJECT_KIND_TAXONOMY_JSON_PATH = DATA_DIR / "object_kind_taxonomy.json"
TRACEABILITY_JSONL_PATH = DATA_DIR / "object_source_traceability.jsonl"

GLOSSARY_DOC_PATH = DOCS_DIR / "06_canonical_domain_glossary.md"
OBJECT_CATALOG_DOC_PATH = DOCS_DIR / "06_object_catalog.md"
OBJECT_TAXONOMY_DOC_PATH = DOCS_DIR / "06_object_taxonomy_and_kind_model.md"
RELATIONSHIP_DOC_PATH = DOCS_DIR / "06_object_relationship_map.md"
ALIAS_DOC_PATH = DOCS_DIR / "06_aliases_deprecated_terms_and_forbidden_shorthand.md"
GAP_REPORT_DOC_PATH = DOCS_DIR / "06_object_catalog_gap_report.md"
ATLAS_HTML_PATH = DOCS_DIR / "06_domain_glossary_atlas.html"
MERMAID_PATH = DOCS_DIR / "06_object_relationship_map.mmd"

PARSE_SOURCE_FILES = [
    "phase-0-the-foundation-protocol.md",
    "phase-1-the-red-flag-gate.md",
    "phase-2-identity-and-echoes.md",
    "phase-3-the-human-checkpoint.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "phase-7-inside-the-nhs-app.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
    "platform-frontend-blueprint.md",
    "platform-runtime-and-release-blueprint.md",
    "patient-portal-experience-architecture-blueprint.md",
    "patient-account-and-communications-blueprint.md",
    "staff-operations-and-support-blueprint.md",
    "staff-workspace-interface-architecture.md",
    "operations-console-frontend-blueprint.md",
    "pharmacy-console-frontend-architecture.md",
    "governance-admin-console-frontend-blueprint.md",
    "platform-admin-and-config-blueprint.md",
    "callback-and-clinician-messaging-loop.md",
    "self-care-content-and-admin-resolution-blueprint.md",
    "canonical-ui-contract-kernel.md",
    "design-token-foundation.md",
    "accessibility-and-content-system-contract.md",
    "ux-quiet-clarity-redesign.md",
]

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "phase-1-the-red-flag-gate.md",
    "phase-2-identity-and-echoes.md",
    "phase-3-the-human-checkpoint.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "phase-7-inside-the-nhs-app.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
    "platform-frontend-blueprint.md",
    "platform-runtime-and-release-blueprint.md",
    "patient-portal-experience-architecture-blueprint.md",
    "patient-account-and-communications-blueprint.md",
    "staff-operations-and-support-blueprint.md",
    "staff-workspace-interface-architecture.md",
    "operations-console-frontend-blueprint.md",
    "pharmacy-console-frontend-architecture.md",
    "governance-admin-console-frontend-blueprint.md",
    "platform-admin-and-config-blueprint.md",
    "callback-and-clinician-messaging-loop.md",
    "self-care-content-and-admin-resolution-blueprint.md",
    "canonical-ui-contract-kernel.md",
    "design-token-foundation.md",
    "accessibility-and-content-system-contract.md",
    "ux-quiet-clarity-redesign.md",
    "phase-cards.md",
    "vecells-complete-end-to-end-flow.md",
    "vecells-complete-end-to-end-flow.mmd",
    "forensic-audit-findings.md",
    "blueprint-init.md",
]

SOURCE_RANK = {name: index for index, name in enumerate(SOURCE_PRECEDENCE)}
GENERIC_STOPWORDS = {
    "Accepted",
    "Access",
    "Account",
    "Action",
    "Admin",
    "Alternative",
    "Appointment",
    "Approval",
    "Artifact",
    "Assistive",
    "Assurance",
    "Attempt",
    "Binding",
    "Booking",
    "Callback",
    "Canonical",
    "Capture",
    "Case",
    "Channel",
    "Channels",
    "Claim",
    "Clinical",
    "Comms",
    "Config",
    "Confirmation",
    "Continuity",
    "Delivery",
    "Evidence",
    "Exception",
    "Experience",
    "Fallback",
    "Freshness",
    "Governance",
    "Grant",
    "Guard",
    "Guards",
    "Hub",
    "Identity",
    "Intake",
    "Issue",
    "Lifecycle",
    "Live",
    "Local",
    "Manage",
    "Message",
    "Messaging",
    "More",
    "Need",
    "New",
    "Offer",
    "Operations",
    "Outcome",
    "Patient",
    "Pending",
    "Pharmacy",
    "Platform",
    "Policy",
    "Provider",
    "Queue",
    "Reachability",
    "Record",
    "Recovery",
    "Replay",
    "Reply",
    "Request",
    "Reservation",
    "Response",
    "Review",
    "Route",
    "Run",
    "Safety",
    "Scope",
    "Search",
    "Session",
    "Signal",
    "Staff",
    "Status",
    "Submission",
    "Support",
    "Thread",
    "Transition",
    "Urgent",
}

PHASE0_HEADING_RE = re.compile(r"^####\s+([0-9A-Za-z.]+)\s+(.+?)\s*$")
BOLD_OBJECT_RE = re.compile(r"^\*\*([A-Z][A-Za-z0-9]+)\*\*\s*$")
HEADING_RE = re.compile(r"^(#{2,4})\s+(.*\S)\s*$")
BACKTICK_OBJECT_RE = re.compile(r"`([A-Z][A-Za-z0-9]+)`")
CAMEL_TOKEN_RE = re.compile(r"\b[A-Z][A-Za-z0-9]+\b")
MULTI_SEGMENT_OBJECT_RE = re.compile(r"\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b")

PHASE_LABELS = {
    "phase-0-the-foundation-protocol.md": "phase_0_foundation",
    "phase-1-the-red-flag-gate.md": "phase_1_red_flag_gate",
    "phase-2-identity-and-echoes.md": "phase_2_identity_and_echoes",
    "phase-3-the-human-checkpoint.md": "phase_3_human_checkpoint",
    "phase-4-the-booking-engine.md": "phase_4_booking_engine",
    "phase-5-the-network-horizon.md": "phase_5_network_horizon",
    "phase-6-the-pharmacy-loop.md": "phase_6_pharmacy_loop",
    "phase-7-inside-the-nhs-app.md": "phase_7_embedded_channel_deferred",
    "phase-8-the-assistive-layer.md": "phase_8_assistive_layer",
    "phase-9-the-assurance-ledger.md": "phase_9_assurance_ledger",
    "platform-frontend-blueprint.md": "cross_cutting_frontend_runtime",
    "platform-runtime-and-release-blueprint.md": "cross_cutting_runtime_release",
    "patient-portal-experience-architecture-blueprint.md": "cross_cutting_patient_portal",
    "patient-account-and-communications-blueprint.md": "cross_cutting_patient_account",
    "staff-operations-and-support-blueprint.md": "cross_cutting_staff_operations_support",
    "staff-workspace-interface-architecture.md": "cross_cutting_staff_workspace",
    "operations-console-frontend-blueprint.md": "cross_cutting_operations_console",
    "pharmacy-console-frontend-architecture.md": "cross_cutting_pharmacy_console",
    "governance-admin-console-frontend-blueprint.md": "cross_cutting_governance_console",
    "platform-admin-and-config-blueprint.md": "cross_cutting_platform_admin",
    "callback-and-clinician-messaging-loop.md": "cross_cutting_callback_and_messaging",
    "self-care-content-and-admin-resolution-blueprint.md": "cross_cutting_self_care_admin_resolution",
    "canonical-ui-contract-kernel.md": "cross_cutting_ui_contract",
    "design-token-foundation.md": "cross_cutting_design_tokens",
    "accessibility-and-content-system-contract.md": "cross_cutting_accessibility_content",
    "ux-quiet-clarity-redesign.md": "cross_cutting_ux_redesign",
    "vecells-complete-end-to-end-flow.md": "audited_flow_baseline",
    "vecells-complete-end-to-end-flow.mmd": "audited_flow_baseline",
    "forensic-audit-findings.md": "forensic_patch_guidance",
    "blueprint-init.md": "orientation_summary",
}

CONTEXT_OWNER = {
    "foundation_control_plane": "Foundation control plane",
    "foundation_identity_access": "Identity and access control",
    "foundation_runtime_experience": "Frontend continuity runtime",
    "triage_human_checkpoint": "Triage domain",
    "booking": "Booking domain",
    "hub_coordination": "Hub coordination domain",
    "pharmacy": "Pharmacy loop domain",
    "callback_messaging": "Callback and messaging domain",
    "self_care_admin_resolution": "Self-care and admin-resolution domain",
    "assistive": "Assistive control plane",
    "assurance_and_governance": "Assurance and governance spine",
    "frontend_runtime": "Frontend continuity runtime",
    "runtime_release": "Runtime publication control plane",
    "patient_experience": "Patient experience projections",
    "staff_support_operations": "Staff, support, and operations control",
    "platform_configuration": "Platform administration and configuration",
    "design_system": "UI and design contract system",
    "audited_flow_gap": "Cross-phase gap register",
    "unknown": "Programme architecture registry",
}

CONTEXT_READERS = {
    "foundation_control_plane": ["platform services", "phase domains", "assurance"],
    "foundation_identity_access": ["patient shells", "staff shells", "support", "assurance"],
    "foundation_runtime_experience": ["patient shells", "staff shells", "hub shell", "support"],
    "triage_human_checkpoint": ["clinical workspace", "patient projections", "assurance"],
    "booking": ["patient appointments", "staff workspace", "support", "assurance"],
    "hub_coordination": ["hub shell", "patient alternatives", "origin practice visibility", "assurance"],
    "pharmacy": ["patient pharmacy status", "pharmacy console", "support", "assurance"],
    "callback_messaging": ["patient conversation shell", "clinical workspace", "support"],
    "self_care_admin_resolution": ["patient request detail", "staff workspace", "support"],
    "assistive": ["clinical workspace", "assistive ops", "assurance"],
    "assurance_and_governance": ["operations console", "governance surfaces", "retention/export flows"],
    "frontend_runtime": ["all interactive shells"],
    "runtime_release": ["runtime control plane", "governance", "operations"],
    "patient_experience": ["patient portal surfaces", "embedded channel"],
    "staff_support_operations": ["staff workspace", "support desk", "ops desk"],
    "platform_configuration": ["governance/admin surfaces"],
    "design_system": ["frontend build/runtime", "design publication consumers"],
    "audited_flow_gap": ["later architecture tasks", "validators", "assurance"],
    "unknown": ["architecture consumers"],
}

FLOW_GAP_NAMES = {
    "AssistiveAnnouncementContract",
    "OpsBoardStateSnapshot",
    "OpsContinuityEvidenceSlice",
    "RecoveryEvidencePack",
    "VisualizationFallbackContract",
    "VisualizationParityProjection",
    "VisualizationTableContract",
}

MANDATORY_OBJECT_NAMES = {
    "SubmissionEnvelope",
    "SubmissionPromotionRecord",
    "RequestLineage",
    "LineageCaseLink",
    "Episode",
    "Request",
    "IdentityBinding",
    "IdentityRepairCase",
    "AccessGrant",
    "DuplicateCluster",
    "EvidenceAssimilationRecord",
    "MaterialDeltaAssessment",
    "SafetyPreemptionRecord",
    "SafetyDecisionRecord",
    "UrgentDiversionSettlement",
    "ReachabilityDependency",
    "RequestLifecycleLease",
    "RequestClosureRecord",
    "ProviderCapabilityMatrix",
    "BookingProviderAdapterBinding",
    "CapacityReservation",
    "ExternalConfirmationGate",
    "PharmacyCorrelationRecord",
    "VisibilityProjectionPolicy",
    "MinimumNecessaryContract",
    "FallbackReviewCase",
    "RouteIntentBinding",
    "CommandActionRecord",
    "CommandSettlementRecord",
    "ReleaseApprovalFreeze",
    "ChannelReleaseFreezeRecord",
    "AssuranceSliceTrustRecord",
    "PatientNavUrgencyDigest",
    "PatientNavReturnContract",
    "RecoveryContinuationToken",
    "PatientActionRecoveryEnvelope",
    "PatientReceiptEnvelope",
    "SupportReplayRestoreSettlement",
    "AudienceSurfaceRouteContract",
    "DesignContractPublicationBundle",
    "RuntimePublicationBundle",
    "PersistentShell",
    "ShellContinuityFrame",
    "ContinuityTransitionCheckpoint",
    "AudienceSurfaceRuntimeBinding",
    "UIEventEnvelope",
    "UITransitionSettlementRecord",
    "UITelemetryDisclosureFence",
    "ArtifactPresentationContract",
    "ArtifactSurfaceBinding",
    "ArtifactParityDigest",
    "OutboundNavigationGrant",
    "MoreInfoCycle",
    "DecisionEpoch",
    "ApprovalCheckpoint",
    "BookingIntent",
    "PharmacyIntent",
    "CallbackCase",
    "CallbackIntentLease",
    "ClinicianMessageThread",
    "MessageDispatchEnvelope",
    "BookingCase",
    "HubCoordinationCase",
    "PharmacyCase",
    "AdminResolutionCase",
    "AssistiveInvocationGrant",
    "AssistiveReleaseCandidate",
    "AssuranceLedgerEntry",
    "EvidenceArtifact",
    "AssuranceEvidenceGraphSnapshot",
    "ControlStatusSnapshot",
    "InvestigationScopeEnvelope",
    "RetentionLifecycleBinding",
    "DeletionCertificate",
    "ArchiveManifest",
}

OBJECT_KIND_DEFINITIONS = [
    {"object_kind": "aggregate", "definition": "Durable domain truth with its own lifecycle and mutation rules."},
    {"object_kind": "record", "definition": "Append-only or immutable record of a fact, attempt, decision, or observation."},
    {"object_kind": "case", "definition": "Durable operational case with domain-local workflow and blockers."},
    {"object_kind": "thread", "definition": "Durable conversational or message-centric workflow lineage."},
    {"object_kind": "projection", "definition": "Derived read model or truth bridge for a surface or downstream consumer."},
    {"object_kind": "digest", "definition": "Condensed, read-optimized derivative for prioritization or concise display."},
    {"object_kind": "contract", "definition": "Published or compiled rule contract consumed across runtime boundaries."},
    {"object_kind": "policy", "definition": "Rule or policy source governing decision, visibility, or publication behavior."},
    {"object_kind": "bundle", "definition": "Versioned bundle or package of related contracts, artifacts, or proofs."},
    {"object_kind": "manifest", "definition": "Published manifest enumerating members, artifacts, or runtime composition."},
    {"object_kind": "tuple", "definition": "Explicit tuple object used to bind scope, lineage, or publication facts."},
    {"object_kind": "token", "definition": "Short-lived continuation or correlation token."},
    {"object_kind": "grant", "definition": "Capability or access grant governing what the holder may do."},
    {"object_kind": "lease", "definition": "Fenced ownership or exclusivity primitive with expiry and takeover semantics."},
    {"object_kind": "gate", "definition": "Gate or fence that must be satisfied before work may proceed or settle."},
    {"object_kind": "blocker", "definition": "Explicit blocker object keeping work or closure open until satisfied."},
    {"object_kind": "witness", "definition": "Proof-bearing witness or certificate object."},
    {"object_kind": "settlement", "definition": "Authoritative settlement or completion proof for an action or transition."},
    {"object_kind": "checkpoint", "definition": "Current checkpoint that governs actionability, TTL, or admissibility."},
    {"object_kind": "event_contract", "definition": "Canonical event namespace member, milestone, signal, or envelope contract."},
    {"object_kind": "descriptor", "definition": "Descriptor or binding object that names runtime, surface, or scope shape."},
    {"object_kind": "artifact", "definition": "Published or rendered artifact with governed presentation or proof role."},
    {"object_kind": "namespace", "definition": "Namespace object used to group event or telemetry contracts."},
    {"object_kind": "other", "definition": "Bounded concept retained because the corpus relies on it, but it does not fit a stronger primary kind."},
]

OBJECT_KIND_OVERRIDES = {
    "Request": "aggregate",
    "Episode": "aggregate",
    "SubmissionEnvelope": "aggregate",
    "RequestLineage": "aggregate",
    "LineageCaseLink": "aggregate",
    "IdentityBinding": "aggregate",
    "Session": "other",
    "CapabilityDecision": "descriptor",
    "AccessGrant": "grant",
    "DuplicateCluster": "aggregate",
    "ReachabilityDependency": "blocker",
    "RequestLifecycleLease": "lease",
    "ReleaseApprovalFreeze": "gate",
    "ChannelReleaseFreezeRecord": "record",
    "VisibilityProjectionPolicy": "policy",
    "ProviderCapabilityMatrix": "descriptor",
    "BookingProviderAdapterBinding": "descriptor",
    "PersistentShell": "descriptor",
    "ShellContinuityFrame": "descriptor",
    "AudienceSurfaceRouteContract": "contract",
    "AudienceSurfaceRuntimeBinding": "descriptor",
    "ArtifactSurfaceBinding": "descriptor",
    "ArtifactParityDigest": "digest",
    "UIEventEnvelope": "event_contract",
    "UITransitionSettlementRecord": "settlement",
    "UITelemetryDisclosureFence": "gate",
    "MoreInfoCycle": "case",
    "DecisionEpoch": "checkpoint",
    "ApprovalCheckpoint": "checkpoint",
    "EndpointDecision": "record",
    "BookingIntent": "descriptor",
    "PharmacyIntent": "descriptor",
    "CallbackCase": "case",
    "ClinicianMessageThread": "thread",
    "BookingCase": "case",
    "HubCoordinationCase": "case",
    "PharmacyCase": "case",
    "AdminResolutionCase": "case",
    "AdviceEligibilityGrant": "grant",
    "AssistiveInvocationGrant": "grant",
    "AssistiveVisibilityPolicy": "policy",
    "AssistiveSurfaceBinding": "descriptor",
    "AssistiveRunSettlement": "settlement",
    "AssuranceEvidenceGraphSnapshot": "record",
    "AssuranceEvidenceGraphEdge": "record",
    "ControlStatusSnapshot": "record",
    "ExperienceContinuityControlEvidence": "record",
    "AssuranceSliceTrustRecord": "record",
    "AssuranceSurfaceRuntimeBinding": "descriptor",
    "RetentionLifecycleBinding": "descriptor",
    "ArchiveManifest": "manifest",
    "DeletionCertificate": "witness",
    "SecurityIncident": "case",
    "NearMissReport": "record",
    "PostIncidentReview": "record",
    "CanonicalEventNamespace": "namespace",
    "CanonicalEventContract": "event_contract",
    "FhirRepresentationContract": "contract",
    "RuntimeTopologyManifest": "manifest",
    "FrontendContractManifest": "manifest",
    "ProjectionContractFamily": "descriptor",
    "ProjectionContractVersion": "descriptor",
    "ProjectionContractVersionSet": "bundle",
    "ReleasePublicationParityRecord": "record",
    "BuildProvenanceRecord": "record",
    "BinaryArtifactDelivery": "artifact",
    "ArtifactByteGrant": "grant",
    "AssuranceLedgerEntry": "record",
    "EvidenceArtifact": "artifact",
    "VisualizationFallbackContract": "contract",
    "VisualizationTableContract": "contract",
    "VisualizationParityProjection": "projection",
    "AssistiveAnnouncementContract": "contract",
    "OpsBoardStateSnapshot": "record",
    "OpsContinuityEvidenceSlice": "projection",
    "RecoveryEvidencePack": "bundle",
    "HubCoordinationMilestone": "event_contract",
    "HubReturnSignal": "event_contract",
    "HubContinuationLease": "lease",
    "PharmacyOutcomeMilestone": "event_contract",
    "PharmacyReopenSignal": "event_contract",
    "PharmacyContinuationLease": "lease",
}

CONTEXT_OVERRIDES = {
    "Request": "foundation_control_plane",
    "RequestLineage": "foundation_control_plane",
    "LineageCaseLink": "foundation_control_plane",
    "SubmissionEnvelope": "foundation_control_plane",
    "IdentityBinding": "foundation_identity_access",
    "Session": "foundation_identity_access",
    "AccessGrant": "foundation_identity_access",
    "CapabilityDecision": "foundation_identity_access",
    "PersistentShell": "frontend_runtime",
    "ShellContinuityFrame": "frontend_runtime",
    "ContinuityTransitionCheckpoint": "frontend_runtime",
    "AudienceSurfaceRuntimeBinding": "frontend_runtime",
    "UIEventEnvelope": "frontend_runtime",
    "UITransitionSettlementRecord": "frontend_runtime",
    "UITelemetryDisclosureFence": "frontend_runtime",
    "ArtifactPresentationContract": "frontend_runtime",
    "ArtifactSurfaceBinding": "frontend_runtime",
    "ArtifactParityDigest": "frontend_runtime",
    "OutboundNavigationGrant": "frontend_runtime",
    "MoreInfoCycle": "triage_human_checkpoint",
    "BookingCase": "booking",
    "HubCoordinationCase": "hub_coordination",
    "PharmacyCase": "pharmacy",
    "CallbackCase": "callback_messaging",
    "ClinicianMessageThread": "callback_messaging",
    "AdminResolutionCase": "self_care_admin_resolution",
    "AssistiveInvocationGrant": "assistive",
    "AssuranceSliceTrustRecord": "assurance_and_governance",
    "AssuranceEvidenceGraphSnapshot": "assurance_and_governance",
    "ControlStatusSnapshot": "assurance_and_governance",
    "InvestigationScopeEnvelope": "assurance_and_governance",
    "DeletionCertificate": "assurance_and_governance",
    "ArchiveManifest": "assurance_and_governance",
    "SecurityIncident": "assurance_and_governance",
    "NearMissReport": "assurance_and_governance",
    "PostIncidentReview": "assurance_and_governance",
    "AssuranceLedgerEntry": "assurance_and_governance",
    "EvidenceArtifact": "assurance_and_governance",
    "UIProjectionVisibilityReceipt": "runtime_release",
    "CanonicalEventNamespace": "runtime_release",
    "CanonicalEventContract": "runtime_release",
    "FhirRepresentationContract": "runtime_release",
    "RuntimeTopologyManifest": "runtime_release",
    "FrontendContractManifest": "runtime_release",
    "ProfileSelectionResolution": "runtime_release",
    "SurfaceStateKernelBinding": "runtime_release",
    "ProjectionContractFamily": "runtime_release",
    "ProjectionContractVersion": "runtime_release",
    "ProjectionContractVersionSet": "runtime_release",
    "ReleasePublicationParityRecord": "runtime_release",
    "BuildProvenanceRecord": "runtime_release",
    "AssistiveAnnouncementContract": "audited_flow_gap",
    "VisualizationFallbackContract": "audited_flow_gap",
    "VisualizationTableContract": "audited_flow_gap",
    "VisualizationParityProjection": "audited_flow_gap",
    "OpsBoardStateSnapshot": "audited_flow_gap",
    "OpsContinuityEvidenceSlice": "audited_flow_gap",
    "RecoveryEvidencePack": "audited_flow_gap",
}

DO_NOT_CONFUSE = {
    "Request": ["SubmissionEnvelope", "RequestLineage", "LineageCaseLink"],
    "SubmissionEnvelope": ["Request", "RequestLineage"],
    "RequestLineage": ["Request", "LineageCaseLink", "SubmissionEnvelope"],
    "LineageCaseLink": ["RequestLineage", "Request"],
    "Session": ["AccessGrant", "IdentityBinding", "CapabilityDecision"],
    "AccessGrant": ["Session", "IdentityBinding", "CapabilityDecision"],
    "IdentityBinding": ["Session", "AccessGrant", "CapabilityDecision"],
    "BookingConfirmationTruthProjection": ["AppointmentRecord", "BookingTransaction", "ExternalConfirmationGate"],
    "HubOfferToConfirmationTruthProjection": ["HubCoordinationCase", "HubAppointmentRecord", "PracticeAcknowledgementRecord"],
    "PharmacyOutcomeTruthProjection": ["PharmacyOutcomeRecord", "PharmacyOutcomeReconciliationGate", "PharmacyCase"],
    "CommandSettlementRecord": ["TaskCommandSettlement", "ConversationCommandSettlement", "UITransitionSettlementRecord"],
    "PersistentShell": ["ShellContinuityFrame", "PatientShellConsistencyProjection"],
}

STATE_MACHINE_HINTS = {
    "Request": ["request_workflow_state", "request_safety_state"],
    "MoreInfoCycle": ["more_info_cycle_state"],
    "CallbackCase": ["callback_case_state"],
    "ClinicianMessageThread": ["clinician_message_thread_state"],
    "BookingCase": ["booking_case_state"],
    "WaitlistEntry": ["waitlist_continuation_state"],
    "WaitlistFallbackObligation": ["waitlist_continuation_state"],
    "WaitlistContinuationTruthProjection": ["waitlist_continuation_state"],
    "HubCoordinationCase": ["hub_coordination_case_state"],
    "PharmacyCase": ["pharmacy_case_state"],
}

EVENT_HINTS = {
    "Request": ["request.workflow_milestone_derived"],
    "MoreInfoCycle": ["triage.more_info_issued", "triage.more_info_response_received"],
    "CallbackCase": ["callback.attempt_started", "callback.outcome_recorded"],
    "ClinicianMessageThread": ["thread.dispatch_requested", "thread.delivery_evidence_recorded"],
    "BookingCase": ["booking.case_created", "booking.confirmation_pending"],
    "HubCoordinationCase": ["hub.case_created", "hub.practice_ack_pending"],
    "PharmacyCase": ["pharmacy.case_created", "pharmacy.outcome_ingest_requested"],
    "HubCoordinationMilestone": ["hub.milestone"],
    "HubReturnSignal": ["hub.return_signal"],
    "PharmacyOutcomeMilestone": ["pharmacy.outcome_milestone"],
    "PharmacyReopenSignal": ["pharmacy.reopen_signal"],
}

MANUAL_RELATIONSHIPS = [
    ("SubmissionEnvelope", "references", "RequestLineage", "Submission promotion keeps one lineage spine."),
    ("RequestLineage", "contains", "LineageCaseLink", "Child workflows join through explicit lineage links."),
    ("Request", "references", "IdentityBinding", "Nullable patientRef derives from IdentityBinding rather than direct ownership shorthand."),
    ("AccessGrant", "binds", "IdentityBinding", "Grant scope must stay distinct from subject binding."),
    ("RequestClosureRecord", "references", "Request", "Closure is coordinator-owned request truth."),
    ("MoreInfoReplyWindowCheckpoint", "guards", "MoreInfoCycle", "Checkpoint governs due-state, late-review, and expiry posture."),
    ("MoreInfoReminderSchedule", "references", "MoreInfoCycle", "Reminder cadence is bound to one current cycle."),
    ("MoreInfoResponseDisposition", "settles", "MoreInfoCycle", "Response disposition explains acceptance, expiry, or supersession."),
    ("DecisionEpoch", "guards", "EndpointDecision", "Endpoint choice stays valid only while the current epoch is live."),
    ("ApprovalCheckpoint", "guards", "DecisionEpoch", "Irreversible action approval is fenced by the current epoch."),
    ("CallbackResolutionGate", "guards", "CallbackCase", "Callback completion, retry, or escalation must route through the resolution gate."),
    ("MessageDispatchEnvelope", "references", "ClinicianMessageThread", "Dispatch remains attached to one message thread."),
    ("ThreadResolutionGate", "guards", "ClinicianMessageThread", "Thread closure, reopen, or escalation is gate-controlled."),
    ("BookingCase", "references", "BookingConfirmationTruthProjection", "Booking surfaces derive from the current confirmation truth projection."),
    ("BookingCase", "guards", "ExternalConfirmationGate", "Ambiguous external confirmation must remain explicit on the booking lineage."),
    ("WaitlistFallbackObligation", "blocks", "BookingCase", "Fallback debt keeps booking continuation honest."),
    ("HubCoordinationCase", "references", "HubOfferToConfirmationTruthProjection", "Hub patient and practice posture derives from the current truth projection."),
    ("HubOfferToConfirmationTruthProjection", "projects", "HubAppointmentRecord", "Hub truth projection materializes booked and practice-visible state."),
    ("HubFallbackRecord", "references", "HubCoordinationCase", "Fallback continuity must stay attached to the active hub case."),
    ("PharmacyCase", "references", "PharmacyDispatchAttempt", "Dispatch lineage stays attached to the active pharmacy case."),
    ("PharmacyOutcomeReconciliationGate", "blocks", "PharmacyCase", "Weak or ambiguous outcome truth blocks ordinary closure."),
    ("PharmacyOutcomeTruthProjection", "projects", "PharmacyOutcomeRecord", "Patient and staff pharmacy truth derives from the current outcome record and gate posture."),
    ("AdminResolutionSettlement", "settles", "AdminResolutionCase", "Admin-resolution completion must settle the owning case."),
    ("AssistiveSurfaceBinding", "binds", "PersistentShell", "Assistive behavior is always bound to the owning shell."),
    ("AssistiveRunSettlement", "settles", "AssistiveInvocationGrant", "Assistive runs require bounded invocation proof."),
    ("AssuranceEvidenceGraphSnapshot", "contains", "AssuranceLedgerEntry", "Graph snapshots are built from typed ledger rows."),
    ("AssuranceEvidenceGraphSnapshot", "contains", "EvidenceArtifact", "Graph snapshots join admissible evidence artifacts."),
    ("DeletionCertificate", "proves", "RetentionLifecycleBinding", "Deletion proof is admissible only against the governing retention binding."),
    ("ArchiveManifest", "references", "RetentionLifecycleBinding", "Archive outputs remain governed by retention lifecycle binding."),
    ("RuntimePublicationBundle", "publishes", "AudienceSurfaceRuntimeBinding", "Runtime publication activates audience-surface bindings."),
    ("DesignContractPublicationBundle", "publishes", "AudienceSurfaceRouteContract", "Design-contract publication ships route-family contracts."),
]

HIGH_RISK_SPOTLIGHTS = [
    {
        "title": "Request vs RequestLineage",
        "body": "Request is the cross-domain canonical record. RequestLineage is the continuity spine. LineageCaseLink joins child workflows without turning them into workflowState values.",
    },
    {
        "title": "Session vs AccessGrant",
        "body": "Session is not a substitute for AccessGrant or IdentityBinding. Authentication posture, grant scope, and subject binding remain distinct control-plane objects.",
    },
    {
        "title": "Truth Projection vs Authoritative Record",
        "body": "BookingConfirmationTruthProjection, HubOfferToConfirmationTruthProjection, and PharmacyOutcomeTruthProjection summarize authoritative state. They do not replace the owning case, record, or confirmation gate.",
    },
]

ALIAS_OBJECT_MAP = {
    "STATE_SUBMISSION_ENVELOPE": ["SubmissionEnvelope"],
    "STATE_WORKFLOW_MILESTONES": ["Request"],
    "STATE_SAFETY_AXIS": ["SafetyDecisionRecord", "UrgentDiversionSettlement", "Request"],
    "STATE_IDENTITY_AXIS_PATIENTREF": ["IdentityBinding", "Request"],
    "STATE_BLOCKER_ORTHOGONALITY": ["RequestClosureRecord", "IdentityRepairCase", "ExternalConfirmationGate"],
    "OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE": ["SubmissionEnvelope", "Request", "RequestLineage", "LineageCaseLink"],
    "OWNERSHIP_LIFECYCLE_COORDINATOR": ["LifecycleCoordinator", "Request", "RequestClosureRecord"],
    "MUTATION_ROUTE_INTENT_BINDING": ["RouteIntentBinding"],
    "MUTATION_COMMAND_ACTION_RECORD": ["CommandActionRecord"],
    "MUTATION_COMMAND_SETTLEMENT_RECORD": ["CommandSettlementRecord"],
    "TRUTH_EXTERNAL_CONFIRMATION_GATE": ["ExternalConfirmationGate", "BookingConfirmationTruthProjection", "HubOfferToConfirmationTruthProjection"],
    "TRUTH_CHILD_DOMAIN_STATE_WRITES": ["BookingCase", "HubCoordinationCase", "PharmacyCase", "Request"],
    "RUNTIME_RELEASE_APPROVAL_FREEZE": ["ReleaseApprovalFreeze"],
    "RUNTIME_CHANNEL_RELEASE_FREEZE": ["ChannelReleaseFreezeRecord"],
    "RUNTIME_ASSURANCE_SLICE_TRUST": ["AssuranceSliceTrustRecord"],
    "RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT": ["RuntimePublicationBundle", "DesignContractPublicationBundle", "AudienceSurfaceRuntimeBinding", "AudienceSurfaceRouteContract"],
    "UI_SHELL_FAMILY_OWNERSHIP": ["PersistentShell", "ShellFamilyOwnershipContract", "RouteFamilyOwnershipClaim"],
    "UI_SAME_OBJECT_SAME_SHELL": ["PersistentShell", "ShellContinuityFrame", "ContinuityTransitionCheckpoint"],
    "ASSURANCE_EVIDENCE_GRAPH": ["AssuranceEvidenceGraphSnapshot", "AssuranceGraphCompletenessVerdict"],
    "ASSURANCE_CONTINUITY_EVIDENCE": ["ExperienceContinuityControlEvidence"],
    "ASSURANCE_OPERATIONAL_READINESS": ["OperationalReadinessSnapshot", "RunbookBindingRecord"],
    "SCOPE_DEFERRED_NHS_APP": ["PatientEmbeddedSessionProjection"],
}

SEED_OBJECTS = [
    {
        "canonical_name": "LifecycleCoordinator",
        "source_file": "phase-0-the-foundation-protocol.md",
        "section": "Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm",
        "line_no": 447,
        "description": "LifecycleCoordinator is the sole cross-domain authority for request milestone change, closure evaluation, and governed reopen.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "TriageTask",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "3A. Review-task contract and workspace state",
        "line_no": 24,
        "description": "TriageTask is the durable human-checkpoint task object that keeps queue ownership, review freshness, endpoint choice, and downstream launch attached to one request lineage.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ReviewBaselineSnapshot",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "3A. Review-task contract and workspace state",
        "line_no": 30,
        "description": "ReviewBaselineSnapshot freezes the evidence, policy bundle, and anchor basis for a live review session so stale decisions can be superseded instead of replayed optimistically.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ReviewSessionLease",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "3A. Review-task contract and workspace state",
        "line_no": 30,
        "description": "ReviewSessionLease keeps staff review ownership fenced and distinct from request-level lifecycle authority.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "InformationRequestWindow",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "More-info and patient response flow",
        "line_no": 599,
        "description": "InformationRequestWindow is the structured more-info request posture that precedes and governs the live MoreInfoCycle reply window.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ResponseAssimilationRecord",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "More-info and patient response flow",
        "line_no": 612,
        "description": "ResponseAssimilationRecord captures response dedupe, classification, and delta assimilation before re-safety or review resume.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ApprovalEvidenceBundle",
        "source_file": "phase-3-the-human-checkpoint.md",
        "section": "Approval and endpoint decision flow",
        "line_no": 995,
        "description": "ApprovalEvidenceBundle packages decision epoch, baseline, and drift evidence before irreversible clinical action may proceed.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "CallbackCase",
        "source_file": "callback-and-clinician-messaging-loop.md",
        "section": "Callback lifecycle objects and invariants",
        "line_no": 30,
        "description": "CallbackCase is the durable callback child case linked to exactly one LineageCaseLink(caseFamily = callback).",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ClinicianMessageThread",
        "source_file": "callback-and-clinician-messaging-loop.md",
        "section": "Clinician messaging lifecycle objects and invariants",
        "line_no": 139,
        "description": "ClinicianMessageThread is the durable message-domain child workflow linked to exactly one LineageCaseLink(caseFamily = clinician_message).",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ScopedMutationGate",
        "source_file": "phase-5-the-network-horizon.md",
        "section": "Commit and fallback algorithms",
        "line_no": 783,
        "description": "ScopedMutationGate binds governing object version, scope tuple, lineage fence, and policy tuple before consequence-bearing mutation may start.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ReservationAuthority",
        "source_file": "phase-4-the-booking-engine.md",
        "section": "4A. Booking contract, case model, and state machine",
        "line_no": 54,
        "description": "ReservationAuthority is the booking-side fence behind offer selection and confirmation; it is not a substitute for request ownership.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "AdapterContractProfile",
        "source_file": "phase-4-the-booking-engine.md",
        "section": "4B. Provider capability and adapter compilation",
        "line_no": 279,
        "description": "AdapterContractProfile names the supplier-specific operation contract compiled into BookingProviderAdapterBinding.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "DependencyDegradationProfile",
        "source_file": "phase-4-the-booking-engine.md",
        "section": "4B. Provider capability and adapter compilation",
        "line_no": 279,
        "description": "DependencyDegradationProfile governs degraded fallback mode when an adapter or downstream dependency no longer supports the requested path.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "UIEventEnvelope",
        "source_file": "platform-frontend-blueprint.md",
        "section": "UI event vocabulary and emission law",
        "line_no": 3023,
        "description": "UIEventEnvelope is the canonical frontend observability envelope; it binds object descriptor, shell, route intent, continuity frame, and redaction-safe event class before emission.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "UITransitionSettlementRecord",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication and controlled migrations",
        "line_no": 1416,
        "description": "UITransitionSettlementRecord captures visible transition settlement so local acknowledgement, projection visibility, and authoritative outcome stay separable.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "UITelemetryDisclosureFence",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication and controlled migrations",
        "line_no": 1416,
        "description": "UITelemetryDisclosureFence proves that route params, PHI-bearing fragments, and operational identifiers were redacted to the allowed disclosure class before UI telemetry left the shell.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "UIProjectionVisibilityReceipt",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication and controlled migrations",
        "line_no": 1658,
        "description": "UIProjectionVisibilityReceipt records that a visible production control action became projection-visible under the active runtime publication tuple.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "CanonicalEventNamespace",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "CanonicalEventNamespace groups event contracts that must publish with the runtime tuple before routes, projections, and telemetry semantics are live.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "CanonicalEventContract",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "CanonicalEventContract names a published event contract that must ship with runtime publication and design-contract parity.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "FhirRepresentationContract",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "FhirRepresentationContract publishes the FHIR mapping contract that downstream adapters and referral packages must consume consistently.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "RuntimeTopologyManifest",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "RuntimeTopologyManifest enumerates the live topology, publication refs, and runtime-consumption readiness for a promoted build.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "FrontendContractManifest",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "FrontendContractManifest packages the frontend-side contract surface that must publish before routes and projections are writable.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ProfileSelectionResolution",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "ProfileSelectionResolution records which published profile bundle the runtime selected for a given audience surface and environment posture.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "SurfaceStateKernelBinding",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "SurfaceStateKernelBinding binds a surface contract family to the live runtime kernel so route-local drift cannot invent private state semantics.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ProjectionContractFamily",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "ProjectionContractFamily groups related projection contracts under one published contract lineage.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ProjectionContractVersion",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "ProjectionContractVersion names one versioned projection contract in the runtime publication tuple.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ProjectionContractVersionSet",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "ProjectionContractVersionSet packages the coherent set of projection contract versions that a live surface may consume.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ReleasePublicationParityRecord",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "ReleasePublicationParityRecord proves that release publication, route coverage, contract publication, and runtime activation stayed in parity for the live build.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "BuildProvenanceRecord",
        "source_file": "platform-runtime-and-release-blueprint.md",
        "section": "Runtime publication completeness",
        "line_no": 1651,
        "description": "BuildProvenanceRecord carries runtime-consumption state and provenance so unpublished or unverified tuples cannot masquerade as live.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "BinaryArtifactDelivery",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Audited artifact mode baseline",
        "line_no": 12,
        "description": "BinaryArtifactDelivery is the bounded artifact-mode object for governed byte delivery under current parity, masking, and channel posture.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "ArtifactByteGrant",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Audited artifact mode baseline",
        "line_no": 12,
        "description": "ArtifactByteGrant is the bounded grant authorizing byte delivery or handoff for an artifact under the active route and return contract.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "PatientPortalEntryProjection",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Patient degraded-mode baseline",
        "line_no": 17,
        "description": "PatientPortalEntryProjection is the entry-shell projection that keeps degraded patient entry anchored to the last safe summary and next safe action.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "PatientSectionSurfaceState",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Patient degraded-mode baseline",
        "line_no": 17,
        "description": "PatientSectionSurfaceState is the section-level patient surface posture object used to degrade requests, records, booking, and messaging consistently inside the same shell.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "AssuranceLedgerEntry",
        "source_file": "phase-9-the-assurance-ledger.md",
        "section": "Assurance evidence graph contract",
        "line_no": 160,
        "description": "AssuranceLedgerEntry is the durable assurance ledger primitive implied by the evidence graph and control-status sections; graph snapshots and admissible artifacts depend on it even though the corpus does not give it one standalone schema block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "EvidenceArtifact",
        "source_file": "phase-9-the-assurance-ledger.md",
        "section": "Assurance evidence graph contract",
        "line_no": 160,
        "description": "EvidenceArtifact is the umbrella artifact primitive implied by graph snapshots, continuity packs, retention outputs, and recovery proof references across the assurance corpus.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "AssistiveAnnouncementContract",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Assistive announcement and acknowledgement baseline",
        "line_no": 15,
        "description": "The audited flow relies on AssistiveAnnouncementContract as the policy artifact that constrains when narration may speak and how replay collapses to one current-state summary, but the corpus does not yet provide one standalone schema block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "VisualizationFallbackContract",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Visualization parity baseline",
        "line_no": 16,
        "description": "The audited flow relies on VisualizationFallbackContract to decide when charts must degrade to table or summary posture, but the corpus has not yet formalized the object in one canonical block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "VisualizationTableContract",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Visualization parity baseline",
        "line_no": 16,
        "description": "The audited flow relies on VisualizationTableContract to guarantee table/list parity beside charts and matrices, but the corpus has not yet formalized the object in one canonical block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "VisualizationParityProjection",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Visualization parity baseline",
        "line_no": 16,
        "description": "The audited flow relies on VisualizationParityProjection to keep chart, matrix, and table views in parity, but the corpus has not yet formalized the object in one canonical block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "OpsBoardStateSnapshot",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Operations continuity diagnosis baseline",
        "line_no": 14,
        "description": "The audited flow relies on OpsBoardStateSnapshot as the preserved operations diagnosis baseline, but the corpus does not yet expose one standalone schema block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "OpsContinuityEvidenceSlice",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Operations continuity diagnosis baseline",
        "line_no": 14,
        "description": "The audited flow relies on OpsContinuityEvidenceSlice as the operations-facing slice over continuity proof, but the corpus does not yet expose one standalone schema block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "RecoveryEvidencePack",
        "source_file": "vecells-complete-end-to-end-flow.md",
        "section": "Resilience and recovery baseline",
        "line_no": 18,
        "description": "The audited flow relies on RecoveryEvidencePack as the recovery-proof package consumed by readiness and resilience posture, but the corpus has not yet formalized it in one canonical block.",
        "extraction_mode": "gap",
    },
    {
        "canonical_name": "HubCoordinationMilestone",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 75 patch response",
        "line_no": 462,
        "description": "HubCoordinationMilestone is the event contract emitted by hub coordination so LifecycleCoordinator can derive request-level milestone changes without child-domain direct writes.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "HubReturnSignal",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 75 patch response",
        "line_no": 462,
        "description": "HubReturnSignal is the hub-native return event consumed by LifecycleCoordinator instead of letting hub state overwrite canonical request truth.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "HubContinuationLease",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 75 patch response",
        "line_no": 462,
        "description": "HubContinuationLease is the hub-native lease that keeps callback, return, or confirmation-pending continuation explicit without collapsing it into request workflow state.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "PharmacyOutcomeMilestone",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 76 patch response",
        "line_no": 468,
        "description": "PharmacyOutcomeMilestone is the pharmacy-native milestone event consumed by LifecycleCoordinator after correlation, blocker evaluation, and re-safety.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "PharmacyReopenSignal",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 76 patch response",
        "line_no": 468,
        "description": "PharmacyReopenSignal is the pharmacy-native reopen event used to return work without directly mutating canonical request truth.",
        "extraction_mode": "implied",
    },
    {
        "canonical_name": "PharmacyContinuationLease",
        "source_file": "forensic-audit-findings.md",
        "section": "Finding 76 patch response",
        "line_no": 468,
        "description": "PharmacyContinuationLease is the pharmacy-native continuation lease that keeps dispatch, outcome, bounce-back, and reopen truth explicit on PharmacyCase.",
        "extraction_mode": "implied",
    },
]


@dataclass
class ObjectBlock:
    canonical_name: str
    source_file: str
    section: str
    block_label: str
    line_no: int
    schema_line: str
    description: str
    body_text: str
    extraction_mode: str

    @property
    def source_ref(self) -> str:
        return f"{self.source_file}#L{self.line_no}"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")


def flatten(value: Any) -> str:
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def md_cell(value: Any) -> str:
    if isinstance(value, list):
        return "<br>".join(escape_md(str(item)) for item in value) if value else ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    return escape_md(str(value))


def escape_md(value: str) -> str:
    return value.replace("|", "\\|")


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    divider_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    body_rows = ["| " + " | ".join(md_cell(cell) for cell in row) + " |" for row in rows]
    return "\n".join([header_row, divider_row, *body_rows])


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    ensure_parent(path)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: flatten(row.get(field, "")) for field in fieldnames})


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    for line in path.read_text().splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def object_id_for(name: str, gap: bool = False) -> str:
    normalized = re.sub(r"[^A-Za-z0-9]+", "_", name).upper().strip("_")
    prefix = "GAP_OBJECT" if gap else "OBJ"
    return f"{prefix}_{normalized}"


def extract_phase0_names(title: str) -> list[str]:
    single_segment_allowlist = {"Episode", "Request", "Session"}
    names = sorted(set(MULTI_SEGMENT_OBJECT_RE.findall(title)))
    for candidate in single_segment_allowlist:
        if title == candidate:
            names.append(candidate)
    if not names and " and " in title:
        for chunk in title.split(" and "):
            chunk = chunk.strip()
            if MULTI_SEGMENT_OBJECT_RE.fullmatch(chunk):
                names.append(chunk)
    return names


def block_is_object_heading(source_file: str, line: str) -> tuple[list[str], str] | None:
    if source_file == "phase-0-the-foundation-protocol.md":
        match = PHASE0_HEADING_RE.match(line)
        if not match:
            return None
        title = match.group(2)
        names = extract_phase0_names(title)
        if not names:
            return None
        return names, title
    match = BOLD_OBJECT_RE.match(line)
    if not match:
        return None
    name = match.group(1)
    return [name], name


def extract_block_body(lines: list[str], start_index: int, source_file: str) -> tuple[str, str]:
    collected: list[str] = []
    for line in lines[start_index + 1 :]:
        if block_is_object_heading(source_file, line):
            break
        heading_match = HEADING_RE.match(line)
        if heading_match and len(heading_match.group(1)) <= 3:
            break
        collected.append(line.rstrip())
    body_lines = [line for line in collected]
    schema_line = ""
    remaining_lines = body_lines
    for index, line in enumerate(body_lines):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("`") and stripped.endswith("`"):
            schema_line = stripped
            remaining_lines = body_lines[index + 1 :]
        break
    paragraphs: list[str] = []
    buffer: list[str] = []
    for line in remaining_lines:
        stripped = line.strip()
        if not stripped:
            if buffer:
                paragraphs.append(" ".join(buffer).strip())
                buffer = []
            continue
        buffer.append(stripped)
    if buffer:
        paragraphs.append(" ".join(buffer).strip())
    description = paragraphs[0] if paragraphs else ""
    body_text = " ".join(paragraphs[:3]).strip()
    return schema_line, (description or body_text)


def parse_object_blocks(source_file: str) -> list[ObjectBlock]:
    text = (BLUEPRINT_DIR / source_file).read_text()
    lines = text.splitlines()
    blocks: list[ObjectBlock] = []
    section_stack: dict[int, str] = {}
    for index, line in enumerate(lines):
        heading_match = HEADING_RE.match(line)
        if heading_match:
            level = len(heading_match.group(1))
            if level <= 3:
                section_stack[level] = heading_match.group(2).strip()
                for stale_level in list(section_stack):
                    if stale_level > level:
                        del section_stack[stale_level]
        object_heading = block_is_object_heading(source_file, line)
        if not object_heading:
            continue
        names, label = object_heading
        schema_line, description = extract_block_body(lines, index, source_file)
        if not description:
            description = f"Explicit schema block for {label} in {source_file}."
        current_section = " / ".join(section_stack[level] for level in sorted(section_stack))
        block_label = label
        for name in names:
            blocks.append(
                ObjectBlock(
                    canonical_name=name,
                    source_file=source_file,
                    section=current_section or block_label,
                    block_label=block_label,
                    line_no=index + 1,
                    schema_line=schema_line,
                    description=description,
                    body_text=description,
                    extraction_mode="explicit",
                )
            )
    return blocks


def build_mentions() -> dict[str, list[str]]:
    mentions: dict[str, list[str]] = defaultdict(list)
    for source_file in SOURCE_PRECEDENCE:
        source_path = BLUEPRINT_DIR / source_file
        if not source_path.exists():
            continue
        for line_number, line in enumerate(source_path.read_text().splitlines(), start=1):
            for name in BACKTICK_OBJECT_RE.findall(line):
                mentions[name].append(f"{source_file}#L{line_number}")
    return mentions


def source_priority(source_file: str) -> int:
    return SOURCE_RANK.get(source_file, 999)


def infer_object_kind(name: str) -> str:
    if name in OBJECT_KIND_OVERRIDES:
        return OBJECT_KIND_OVERRIDES[name]
    if name.endswith("Case"):
        return "case"
    if name.endswith("Thread"):
        return "thread"
    if name.endswith("Projection"):
        return "projection"
    if name.endswith("Digest"):
        return "digest"
    if name.endswith("Contract") or name.endswith("Grammar"):
        return "contract"
    if name.endswith("Policy") or name.endswith("PolicyPack"):
        return "policy"
    if name.endswith("Bundle") or name.endswith("Package") or name.endswith("Pack"):
        return "bundle"
    if name.endswith("Manifest"):
        return "manifest"
    if name.endswith("Tuple"):
        return "tuple"
    if name.endswith("Token"):
        return "token"
    if name.endswith("Grant"):
        return "grant"
    if name.endswith("Lease"):
        return "lease"
    if name.endswith("Gate") or name.endswith("Fence") or name.endswith("Freeze"):
        return "gate"
    if name.endswith("Checkpoint"):
        return "checkpoint"
    if name.endswith("Witness") or name.endswith("Certificate") or name.endswith("Verdict"):
        return "witness"
    if name.endswith("Settlement"):
        return "settlement"
    if name.endswith("Namespace"):
        return "namespace"
    if name.endswith("Signal") or name.endswith("Milestone") or name.endswith("Envelope") and name.startswith("UIEvent"):
        return "event_contract"
    if name.endswith("Artifact"):
        return "artifact"
    if name.endswith("Binding") or name.endswith("Descriptor") or name.endswith("Profile"):
        return "descriptor"
    if name.endswith("Record") or name.endswith("Snapshot") or name.endswith("Decision") or name.endswith("Assessment") or name.endswith("Evaluation") or name.endswith("Disposition") or name.endswith("Attempt"):
        return "record"
    if name.endswith("Envelope"):
        return "record"
    if name.endswith("State"):
        return "descriptor"
    return "other"


def infer_context(name: str, source_file: str, section: str) -> str:
    if name in CONTEXT_OVERRIDES:
        return CONTEXT_OVERRIDES[name]
    lower_section = section.lower()
    if source_file == "phase-0-the-foundation-protocol.md":
        if "real-time interaction" in lower_section or "experience topology" in lower_section:
            return "foundation_runtime_experience"
        if "identity" in lower_section or name in {"AccessGrant", "Session", "CapabilityDecision"}:
            return "foundation_identity_access"
        return "foundation_control_plane"
    if source_file == "phase-3-the-human-checkpoint.md":
        return "triage_human_checkpoint"
    if source_file == "phase-4-the-booking-engine.md":
        return "booking"
    if source_file == "phase-5-the-network-horizon.md":
        return "hub_coordination"
    if source_file == "phase-6-the-pharmacy-loop.md":
        return "pharmacy"
    if source_file == "callback-and-clinician-messaging-loop.md":
        return "callback_messaging"
    if source_file == "self-care-content-and-admin-resolution-blueprint.md":
        return "self_care_admin_resolution"
    if source_file == "phase-8-the-assistive-layer.md":
        return "assistive"
    if source_file == "phase-9-the-assurance-ledger.md":
        return "assurance_and_governance"
    if source_file in {
        "platform-frontend-blueprint.md",
        "patient-portal-experience-architecture-blueprint.md",
        "canonical-ui-contract-kernel.md",
        "design-token-foundation.md",
        "accessibility-and-content-system-contract.md",
        "ux-quiet-clarity-redesign.md",
    }:
        return "frontend_runtime"
    if source_file == "platform-runtime-and-release-blueprint.md":
        return "runtime_release"
    if source_file == "patient-account-and-communications-blueprint.md":
        return "patient_experience"
    if source_file in {
        "staff-operations-and-support-blueprint.md",
        "staff-workspace-interface-architecture.md",
        "operations-console-frontend-blueprint.md",
        "pharmacy-console-frontend-architecture.md",
    }:
        return "staff_support_operations"
    if source_file in {
        "governance-admin-console-frontend-blueprint.md",
        "platform-admin-and-config-blueprint.md",
    }:
        return "platform_configuration"
    return "unknown"


def infer_durability(kind: str, name: str) -> str:
    if kind in {"projection", "digest"}:
        return "derived_projection"
    if kind in {"token", "lease"}:
        return "ephemeral_runtime"
    if kind in {"record", "settlement", "witness", "event_contract"}:
        return "append_only"
    if kind == "artifact" and "Presentation" not in name:
        return "append_only"
    return "durable"


def infer_owner(name: str, context: str) -> str:
    if name == "LifecycleCoordinator":
        return "LifecycleCoordinator"
    if name == "UIEventEnvelope":
        return "Frontend telemetry contract"
    return CONTEXT_OWNER.get(context, "Programme architecture registry")


def infer_write_authority(kind: str, owner: str) -> str:
    if kind in {"projection", "digest"}:
        return f"Derived by {owner}; direct client writes are forbidden."
    if kind in {"policy", "contract", "bundle", "manifest", "tuple", "descriptor"}:
        return f"Published or compiled by {owner}; supersede by version, never patch in place."
    if kind in {"token", "grant", "lease", "checkpoint", "gate"}:
        return f"Minted, rotated, or revoked only by {owner} under canonical fences."
    if kind in {"record", "settlement", "witness", "event_contract", "artifact"}:
        return f"Appended or emitted by {owner}; immutable after recording."
    if kind in {"case", "thread", "aggregate", "blocker"}:
        return f"Mutated only by {owner} under lineage, lease, and route-intent guards."
    return f"Governed by {owner} with no uncontrolled local writes."


def infer_mutability(kind: str) -> str:
    if kind in {"projection", "digest"}:
        return "Recomputed or superseded from authoritative sources; never edited as source of truth."
    if kind in {"policy", "contract", "bundle", "manifest", "tuple", "descriptor"}:
        return "Versioned and superseded; do not patch the active revision in place."
    if kind in {"token", "grant", "lease", "checkpoint", "gate"}:
        return "Rotate or replace through governed transitions; stale copies must fail closed."
    if kind in {"record", "settlement", "witness", "event_contract", "artifact"}:
        return "Append-only or immutable after issue."
    return "Durable lifecycle with compare-and-set or lease-guarded mutation."


def infer_identity_implications(name: str, context: str) -> str:
    name_lower = name.lower()
    if any(token in name_lower for token in ["identity", "patient", "grant", "session", "scope", "consent", "secure", "claim"]):
        return "Carries subject-binding, access-scope, or consent implications; wrong-patient repair and minimum-necessary rules apply."
    if context in {"patient_experience", "callback_messaging", "booking", "pharmacy"}:
        return "May expose subject-scoped data through lineage-bound projections; subject identity and grant posture must already be valid."
    if context in {"assurance_and_governance", "staff_support_operations"}:
        return "May reference subject-linked evidence but must remain masked or audience-filtered outside the permitted purpose of use."
    return "No standalone subject identity authority; inherits the governing lineage subject posture."


def infer_visibility_implications(kind: str, context: str) -> str:
    if kind in {"projection", "digest", "artifact"}:
        return "Visibility is audience-tiered and must degrade to placeholder, summary-only, or read-only posture when continuity or publication drift occurs."
    if kind in {"policy", "contract", "descriptor"}:
        return "Used to compile visibility or route posture rather than to expose raw subject detail directly."
    if context in {"assurance_and_governance", "staff_support_operations"}:
        return "Subject detail is audience-filtered and minimum-necessary constrained."
    return "May participate in visibility checks, but downstream projections remain the audience-facing surface."


def infer_external_dependencies(name: str, context: str) -> str:
    if context == "booking":
        return "Depends on booking provider adapters, external confirmation proof, or waitlist/hub fallback contracts."
    if context == "hub_coordination":
        return "Depends on cross-site capacity ingestion, native booking adapters, and practice acknowledgement rails."
    if context == "pharmacy":
        return "Depends on pharmacy directory, dispatch transport, provider capability snapshots, and outcome ingestion."
    if context == "callback_messaging":
        return "Depends on telephony, messaging delivery, or reachability rails."
    if context == "runtime_release":
        return "Depends on build, publication, migration, and runtime activation control planes."
    if context == "patient_experience":
        return "Depends on patient portal, secure-link, or embedded-channel runtime posture."
    if "Assistive" in name or context == "assistive":
        return "Depends on assistive rollout, trust, freeze, and provenance controls; no mandatory AI path is implied."
    return "No external dependency beyond the canonical platform runtime and publication posture."


def infer_truth_role(name: str, kind: str) -> str:
    if name in {"Request", "SubmissionEnvelope", "RequestLineage", "IdentityBinding", "AccessGrant"}:
        return "Authoritative foundation truth; downstream projections or child cases may not replace it."
    if name in {"BookingCase", "HubCoordinationCase", "PharmacyCase", "CallbackCase", "ClinicianMessageThread", "AdminResolutionCase", "MoreInfoCycle"}:
        return "Authoritative child-domain workflow truth; may emit milestones or blockers but may never write canonical Request.workflowState directly."
    if kind == "projection":
        return "Read-side truth bridge; never substitutes for the authoritative case, record, or gate it summarizes."
    if kind == "settlement":
        return "Authoritative proof that a guarded action or transition settled."
    if kind == "checkpoint":
        return "Current actionability or admissibility checkpoint."
    if kind == "lease":
        return "Current fencing authority for exclusive work."
    if kind == "grant":
        return "Current capability or access authority."
    if kind == "gate":
        return "Current guard that blocks or allows consequence-bearing progress."
    if kind == "policy":
        return "Compiled rule source that governs downstream runtime or visibility decisions."
    if kind == "contract":
        return "Published cross-boundary contract that downstream runtime must consume without drift."
    if kind == "event_contract":
        return "Canonical event/milestone/signal contract, distinct from the durable object it reports on."
    return "Bounded program object retained because downstream architecture depends on its distinct semantics."


def infer_state_machines(name: str, context: str, request_lineage_model: dict[str, Any]) -> list[str]:
    if name in STATE_MACHINE_HINTS:
        return STATE_MACHINE_HINTS[name]
    machine_ids = {item["machine_id"] for item in request_lineage_model["state_machines"]}
    inferred: list[str] = []
    if context == "booking" and "booking_case_state" in machine_ids:
        inferred.append("booking_case_state")
    if context == "hub_coordination" and "hub_coordination_case_state" in machine_ids:
        inferred.append("hub_coordination_case_state")
    if context == "pharmacy" and "pharmacy_case_state" in machine_ids:
        inferred.append("pharmacy_case_state")
    if context == "callback_messaging":
        for candidate in ["callback_case_state", "clinician_message_thread_state"]:
            if candidate in machine_ids:
                inferred.append(candidate)
    if context == "triage_human_checkpoint" and "more_info_cycle_state" in machine_ids:
        inferred.append("more_info_cycle_state")
    return inferred


def infer_event_refs(name: str) -> list[str]:
    return EVENT_HINTS.get(name, [])


def field_tokens(schema_line: str) -> list[str]:
    if not schema_line:
        return []
    payload = schema_line.strip().strip("`")
    return [part.strip() for part in payload.split(",") if part.strip()]


def classify_relation(source_kind: str, source_name: str, field_name: str) -> str:
    lower_field = field_name.lower()
    if "supersed" in lower_field:
        return "supersedes"
    if source_kind == "projection":
        return "projects"
    if source_kind == "digest":
        return "projects"
    if source_kind == "settlement":
        return "settles"
    if source_kind in {"gate", "checkpoint", "lease"}:
        return "guards"
    if source_kind == "blocker":
        return "blocks"
    if source_kind == "witness":
        return "proves"
    if source_kind in {"bundle", "manifest"}:
        return "contains"
    if source_kind in {"policy", "contract"}:
        return "governs"
    if source_kind in {"descriptor", "grant", "token"} or "bind" in lower_field:
        return "binds"
    if source_kind == "event_contract":
        return "emits"
    if source_kind == "artifact":
        return "materializes"
    return "references"


def match_known_name(field_name: str, names_by_normalized: dict[str, str]) -> str | None:
    lower = normalize_name(field_name)
    best_match = ""
    for normalized_name, canonical_name in names_by_normalized.items():
        if normalized_name and normalized_name in lower and len(normalized_name) > len(best_match):
            best_match = normalized_name
    return names_by_normalized.get(best_match)


def build_flow_required_names(mentions: dict[str, list[str]], explicit_names: set[str]) -> set[str]:
    flow_md_text = (BLUEPRINT_DIR / "vecells-complete-end-to-end-flow.md").read_text()
    flow_mmd_text = (BLUEPRINT_DIR / "vecells-complete-end-to-end-flow.mmd").read_text()
    flow_names = set(BACKTICK_OBJECT_RE.findall(flow_md_text))
    allowed_names = set(explicit_names) | set(mentions) | {seed["canonical_name"] for seed in SEED_OBJECTS}
    for token in CAMEL_TOKEN_RE.findall(flow_mmd_text):
        if token in GENERIC_STOPWORDS:
            continue
        if token in allowed_names or token in FLOW_GAP_NAMES:
            flow_names.add(token)
    return flow_names


def bounded_source_refs(refs: list[str], limit: int = 8) -> list[str]:
    seen: list[str] = []
    for ref in refs:
        if ref not in seen:
            seen.append(ref)
    return seen[:limit]


def ensure_prerequisites() -> dict[str, Any]:
    required_paths = {
        "requirement_registry": REQUIREMENT_REGISTRY_PATH,
        "canonical_term_aliases": ALIAS_MAP_PATH,
        "product_scope_matrix": SCOPE_MATRIX_PATH,
        "route_family_inventory": ROUTE_FAMILY_PATH,
        "channel_inventory": CHANNEL_INVENTORY_PATH,
        "persona_catalog": PERSONA_CATALOG_PATH,
        "shell_ownership_map": SHELL_MAP_PATH,
        "request_lineage_model": REQUEST_LINEAGE_MODEL_PATH,
    }
    missing = [key for key, path in required_paths.items() if not path.exists()]
    if missing:
        raise SystemExit(
            "PREREQUISITE_GAP_OBJECT_CATALOG: missing prerequisite outputs -> "
            + ", ".join(missing)
        )

    requirement_rows = load_jsonl(REQUIREMENT_REGISTRY_PATH)
    alias_payload = load_json(ALIAS_MAP_PATH)
    scope_payload = load_json(SCOPE_MATRIX_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    channel_payload = load_json(CHANNEL_INVENTORY_PATH)
    persona_payload = load_json(PERSONA_CATALOG_PATH)
    shell_payload = load_json(SHELL_MAP_PATH)
    request_lineage_model = load_json(REQUEST_LINEAGE_MODEL_PATH)

    if not requirement_rows:
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: requirement registry is empty.")
    if not alias_payload.get("rows"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: canonical alias map is empty.")
    if not scope_payload.get("rows"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: product scope matrix is empty.")
    if not route_rows:
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: route family inventory is empty.")
    if not channel_payload.get("channels"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: channel inventory is empty.")
    if not persona_payload.get("personas"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: persona catalog is empty.")
    if not shell_payload.get("shells"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: shell ownership map is empty.")
    if not request_lineage_model.get("child_aggregates"):
        raise SystemExit("PREREQUISITE_GAP_OBJECT_CATALOG: request-lineage model is empty.")

    return {
        "requirement_registry_rows": len(requirement_rows),
        "canonical_term_alias_rows": len(alias_payload["rows"]),
        "product_scope_rows": len(scope_payload["rows"]),
        "route_family_rows": len(route_rows),
        "channel_rows": len(channel_payload["channels"]),
        "persona_rows": len(persona_payload["personas"]),
        "shell_rows": len(shell_payload["shells"]),
        "request_lineage_child_aggregates": len(request_lineage_model["child_aggregates"]),
    }


def merge_blocks(blocks: list[ObjectBlock]) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[ObjectBlock]] = defaultdict(list)
    for block in blocks:
        grouped[block.canonical_name].append(block)

    merged: dict[str, dict[str, Any]] = {}
    for canonical_name, items in grouped.items():
        sorted_items = sorted(items, key=lambda item: (source_priority(item.source_file), item.line_no, item.source_file))
        merged[canonical_name] = {
            "canonical_block": sorted_items[0],
            "supporting_blocks": sorted_items,
        }
    return merged


def add_seed_blocks(merged_blocks: dict[str, dict[str, Any]]) -> None:
    for seed in SEED_OBJECTS:
        block = ObjectBlock(
            canonical_name=seed["canonical_name"],
            source_file=seed["source_file"],
            section=seed["section"],
            block_label=seed["canonical_name"],
            line_no=seed["line_no"],
            schema_line="",
            description=seed["description"],
            body_text=seed["description"],
            extraction_mode=seed["extraction_mode"],
        )
        current = merged_blocks.get(seed["canonical_name"])
        if current is None:
            merged_blocks[seed["canonical_name"]] = {
                "canonical_block": block,
                "supporting_blocks": [block],
            }
            continue
        current["supporting_blocks"].append(block)
        blocks_sorted = sorted(current["supporting_blocks"], key=lambda item: (source_priority(item.source_file), item.line_no, item.source_file))
        current["canonical_block"] = blocks_sorted[0]
        current["supporting_blocks"] = blocks_sorted


def build_alias_rows(alias_payload: dict[str, Any], name_to_object_id: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    object_names = set(name_to_object_id)
    for item in alias_payload["rows"]:
        related_names = [name for name in ALIAS_OBJECT_MAP.get(item["concept_id"], []) if name in object_names]
        related_object_ids = [name_to_object_id[name] for name in related_names]
        alias = item["alias"]
        preferred_term = item["preferred_term"]
        if alias in object_names:
            resolution_class = "exact_alias_to_canonical_object"
            canonical_object_name = alias
        elif preferred_term in object_names:
            resolution_class = "exact_alias_to_canonical_object"
            canonical_object_name = preferred_term
        elif item["alias_status"] in {"deprecated", "forbidden"}:
            resolution_class = "deprecated_shorthand"
            canonical_object_name = related_names[0] if related_names else ""
        elif related_names:
            resolution_class = "ambiguous_phrase_requiring_context"
            canonical_object_name = related_names[0]
        else:
            resolution_class = "not_an_object_phrase"
            canonical_object_name = ""
        rows.append(
            {
                "alias": alias,
                "preferred_term": preferred_term,
                "concept_id": item["concept_id"],
                "alias_status": item["alias_status"],
                "resolution_class": resolution_class,
                "canonical_object_name": canonical_object_name,
                "canonical_object_id": name_to_object_id.get(canonical_object_name, ""),
                "related_object_ids": related_object_ids,
                "rationale": item["rationale"],
            }
        )
    return rows


def glossary_rows_from_controls(
    route_rows: list[dict[str, str]],
    channel_payload: dict[str, Any],
    persona_payload: dict[str, Any],
    shell_payload: dict[str, Any],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for shell in shell_payload["shells"]:
        term = f"{shell['shell_type']} shell"
        rows.append(
            {
                "term_id": f"GLOSSARY_SHELL_{shell['shell_type'].upper()}",
                "canonical_term": term,
                "entry_type": "shell_type",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "descriptor",
                "definition": shell["continuity_contract"],
                "do_not_confuse_with": "",
                "source_refs": shell["source_refs"],
                "notes": "Catalogued as a shell contract concept, not a domain aggregate.",
            }
        )
    for channel_profile in channel_payload["channel_profiles"]:
        rows.append(
            {
                "term_id": f"GLOSSARY_CHANNEL_PROFILE_{channel_profile.upper()}",
                "canonical_term": channel_profile,
                "entry_type": "channel_profile",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "descriptor",
                "definition": f"Channel profile `{channel_profile}` as normalized by the audience-surface inventory.",
                "do_not_confuse_with": "",
                "source_refs": ["04_channel_inventory.md"],
                "notes": "Catalogued as a channel profile concept, not a domain aggregate.",
            }
        )
    for channel in channel_payload["channels"]:
        rows.append(
            {
                "term_id": f"GLOSSARY_CHANNEL_{channel['channel_id'].upper()}",
                "canonical_term": channel["channel_name"],
                "entry_type": "channel",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "descriptor",
                "definition": channel["continuity_implications"][0],
                "do_not_confuse_with": "",
                "source_refs": channel["source_refs"],
                "notes": "Catalogued as a channel concept, not a domain aggregate.",
            }
        )
    for tier in persona_payload["base_audience_tiers"]:
        rows.append(
            {
                "term_id": f"GLOSSARY_AUDIENCE_{tier['tier'].upper()}",
                "canonical_term": tier["tier"],
                "entry_type": "audience_tier",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "descriptor",
                "definition": tier["definition"],
                "do_not_confuse_with": "",
                "source_refs": [tier["source_ref"]],
                "notes": "Catalogued as an audience tier concept, not a domain aggregate.",
            }
        )
    for tier in persona_payload["derived_audience_tiers"]:
        rows.append(
            {
                "term_id": f"GLOSSARY_AUDIENCE_{tier['tier'].upper()}",
                "canonical_term": tier["tier"],
                "entry_type": "audience_tier",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "descriptor",
                "definition": tier["reason"],
                "do_not_confuse_with": "",
                "source_refs": ["04_audience_tier_model.md"],
                "notes": f"Coverage basis: {tier['coverage_basis']}",
            }
        )
    for row in route_rows:
        rows.append(
            {
                "term_id": f"GLOSSARY_ROUTE_{row['route_family_id'].upper()}",
                "canonical_term": row["route_family"],
                "entry_type": "route_family",
                "object_id": "",
                "resolution_class": "glossary_only",
                "bounded_context": "frontend_runtime",
                "object_kind": "contract",
                "definition": row["primary_surface_name"],
                "do_not_confuse_with": "",
                "source_refs": row["source_refs"].split("; "),
                "notes": "Catalogued as a route-family contract concept, not a domain aggregate.",
            }
        )
    return rows


def build_catalog() -> dict[str, Any]:
    upstream_inputs = ensure_prerequisites()
    alias_payload = load_json(ALIAS_MAP_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    channel_payload = load_json(CHANNEL_INVENTORY_PATH)
    persona_payload = load_json(PERSONA_CATALOG_PATH)
    request_lineage_model = load_json(REQUEST_LINEAGE_MODEL_PATH)

    explicit_blocks: list[ObjectBlock] = []
    for source_file in PARSE_SOURCE_FILES:
        explicit_blocks.extend(parse_object_blocks(source_file))

    merged_blocks = merge_blocks(explicit_blocks)
    add_seed_blocks(merged_blocks)

    mentions = build_mentions()
    flow_required_names = build_flow_required_names(mentions, set(merged_blocks))
    for flow_name in sorted(flow_required_names):
        if flow_name in merged_blocks:
            continue
        seed = next((item for item in SEED_OBJECTS if item["canonical_name"] == flow_name), None)
        if seed is None:
            extraction_mode = "gap" if flow_name in FLOW_GAP_NAMES else "implied"
            description = (
                f"{flow_name} is referenced by the audited flow baseline and must remain queryable even though the corpus does not provide one stronger canonical object block yet."
                if extraction_mode == "gap"
                else f"{flow_name} is clearly relied upon by the audited flow or phase prose even though it lacks a standalone canonical block."
            )
            seed = {
                "canonical_name": flow_name,
                "source_file": "vecells-complete-end-to-end-flow.md",
                "section": "Audited flow baseline",
                "line_no": 1,
                "description": description,
                "extraction_mode": extraction_mode,
            }
        merged_blocks[flow_name] = {
            "canonical_block": ObjectBlock(
                canonical_name=seed["canonical_name"],
                source_file=seed["source_file"],
                section=seed["section"],
                block_label=seed["canonical_name"],
                line_no=seed["line_no"],
                schema_line="",
                description=seed["description"],
                body_text=seed["description"],
                extraction_mode=seed["extraction_mode"],
            ),
            "supporting_blocks": [
                ObjectBlock(
                    canonical_name=seed["canonical_name"],
                    source_file=seed["source_file"],
                    section=seed["section"],
                    block_label=seed["canonical_name"],
                    line_no=seed["line_no"],
                    schema_line="",
                    description=seed["description"],
                    body_text=seed["description"],
                    extraction_mode=seed["extraction_mode"],
                )
            ],
        }

    names_by_normalized = {normalize_name(name): name for name in merged_blocks}
    provisional_gap_names = {
        name
        for name, entry in merged_blocks.items()
        if entry["canonical_block"].extraction_mode == "gap"
    }
    name_to_object_id = {
        name: object_id_for(name, gap=name in provisional_gap_names)
        for name in merged_blocks
    }
    alias_rows = build_alias_rows(alias_payload, name_to_object_id)

    aliases_by_object: dict[str, list[str]] = defaultdict(list)
    deprecated_by_object: dict[str, list[str]] = defaultdict(list)
    for row in alias_rows:
        canonical_name = row["canonical_object_name"]
        if not canonical_name:
            continue
        if row["resolution_class"] == "exact_alias_to_canonical_object" and row["alias"] != canonical_name:
            aliases_by_object[canonical_name].append(row["alias"])
        if row["resolution_class"] == "deprecated_shorthand":
            deprecated_by_object[canonical_name].append(row["alias"])

    object_rows: list[dict[str, Any]] = []
    relationships: list[dict[str, Any]] = []
    traceability_rows: list[dict[str, Any]] = []
    relationship_seen: set[tuple[str, str, str]] = set()

    for canonical_name in sorted(merged_blocks):
        entry = merged_blocks[canonical_name]
        block = entry["canonical_block"]
        kind = infer_object_kind(canonical_name)
        context = infer_context(canonical_name, block.source_file, block.section)
        gap = block.extraction_mode == "gap"
        object_id = object_id_for(canonical_name, gap=gap)
        supporting_refs = bounded_source_refs(
            [item.source_ref for item in entry["supporting_blocks"]]
            + mentions.get(canonical_name, [])
        )
        owner = infer_owner(canonical_name, context)
        read_consumers = CONTEXT_READERS.get(context, ["architecture consumers"])
        state_machine_refs = infer_state_machines(canonical_name, context, request_lineage_model)
        related_event_refs = infer_event_refs(canonical_name)
        fields = field_tokens(block.schema_line)
        related_names: list[str] = []
        for token in fields:
            field_name = token.split("=")[0].strip()
            if not field_name.lower().endswith(("ref", "refs", "recordid", "id")):
                continue
            matched_name = match_known_name(field_name, names_by_normalized)
            if matched_name and matched_name != canonical_name:
                related_names.append(matched_name)
                relation_type = classify_relation(kind, canonical_name, field_name)
                relationship_key = (object_id, relation_type, name_to_object_id[matched_name])
                if relationship_key not in relationship_seen:
                    relationships.append(
                        {
                            "source_object_id": object_id,
                            "source_name": canonical_name,
                            "relationship_type": relation_type,
                            "target_object_id": name_to_object_id[matched_name],
                            "target_name": matched_name,
                            "evidence": f"{block.block_label} field `{field_name}`",
                            "source_ref": block.source_ref,
                            "notes": "",
                        }
                    )
                    relationship_seen.add(relationship_key)
        related_names.extend(name for name in DO_NOT_CONFUSE.get(canonical_name, []) if name in merged_blocks)
        related_object_ids = [name_to_object_id[name] for name in sorted(set(related_names)) if name in name_to_object_id]

        row = {
            "object_id": object_id,
            "canonical_name": canonical_name,
            "object_kind": kind,
            "bounded_context": context,
            "phase_of_first_authoritative_introduction": PHASE_LABELS.get(block.source_file, "unknown"),
            "canonical_source_file": block.source_file,
            "canonical_source_heading_or_block": f"{block.section} / {block.block_label}",
            "supporting_source_refs": supporting_refs,
            "canonical_definition": block.description,
            "why_it_exists": (
                f"Provides the canonical {kind} required by the {context.replace('_', ' ')} layer so later architecture and runtime work do not collapse it into a neighboring object family."
            ),
            "authoritative_owner": owner,
            "write_authority": infer_write_authority(kind, owner),
            "read_consumers": read_consumers,
            "durability_class": infer_durability(kind, canonical_name),
            "mutability_rule": infer_mutability(kind),
            "identity_or_subject_implications": infer_identity_implications(canonical_name, context),
            "visibility_or_masking_implications": infer_visibility_implications(kind, context),
            "external_dependency_implications": infer_external_dependencies(canonical_name, context),
            "authoritative_success_or_truth_role": infer_truth_role(canonical_name, kind),
            "related_state_machine_refs": state_machine_refs,
            "related_event_refs": related_event_refs,
            "related_object_ids": related_object_ids,
            "aliases": sorted(set(aliases_by_object.get(canonical_name, []))),
            "deprecated_or_forbidden_terms": sorted(set(deprecated_by_object.get(canonical_name, []))),
            "secondary_tags": sorted(
                set(
                    [
                        kind,
                        context,
                        PHASE_LABELS.get(block.source_file, "unknown"),
                        block.extraction_mode,
                    ]
                )
            ),
            "do_not_confuse_with": [name_to_object_id[name] for name in DO_NOT_CONFUSE.get(canonical_name, []) if name in name_to_object_id],
            "notes": (
                "GAP_OBJECT surfaced from audited flow or cross-source prose; keep bounded until a dedicated canonical schema block exists."
                if gap
                else (
                    "Projection objects summarize authoritative truth and must never be mistaken for owning aggregates."
                    if kind == "projection"
                    else (
                        "Child-domain object; may not write canonical Request.workflowState directly."
                        if canonical_name in {"MoreInfoCycle", "BookingCase", "HubCoordinationCase", "PharmacyCase", "CallbackCase", "ClinicianMessageThread", "AdminResolutionCase"}
                        else ""
                    )
                )
            ),
        }
        object_rows.append(row)
        traceability_rows.append(
            {
                "object_id": object_id,
                "canonical_name": canonical_name,
                "extraction_mode": block.extraction_mode,
                "canonical_source_ref": block.source_ref,
                "canonical_source_heading_or_block": row["canonical_source_heading_or_block"],
                "supporting_source_refs": supporting_refs,
                "schema_line": block.schema_line.strip("`"),
                "related_object_ids": related_object_ids,
                "aliases": row["aliases"],
                "deprecated_or_forbidden_terms": row["deprecated_or_forbidden_terms"],
                "state_machine_refs": state_machine_refs,
                "event_refs": related_event_refs,
            }
        )

    row_by_name = {row["canonical_name"]: row for row in object_rows}
    for source_name, relationship_type, target_name, evidence in MANUAL_RELATIONSHIPS:
        if source_name not in row_by_name or target_name not in row_by_name:
            continue
        relationship_key = (
            row_by_name[source_name]["object_id"],
            relationship_type,
            row_by_name[target_name]["object_id"],
        )
        if relationship_key in relationship_seen:
            continue
        source_block = merged_blocks[source_name]["canonical_block"]
        relationships.append(
            {
                "source_object_id": row_by_name[source_name]["object_id"],
                "source_name": source_name,
                "relationship_type": relationship_type,
                "target_object_id": row_by_name[target_name]["object_id"],
                "target_name": target_name,
                "evidence": evidence,
                "source_ref": source_block.source_ref,
                "notes": "Curated relationship seed for high-risk control-plane semantics.",
            }
        )
        relationship_seen.add(relationship_key)

    object_rows.sort(key=lambda item: item["object_id"])
    traceability_rows.sort(key=lambda item: item["object_id"])
    relationships.sort(key=lambda item: (item["source_object_id"], item["relationship_type"], item["target_object_id"]))

    glossary_rows: list[dict[str, Any]] = []
    for row in object_rows:
        glossary_rows.append(
            {
                "term_id": row["object_id"],
                "canonical_term": row["canonical_name"],
                "entry_type": "object",
                "object_id": row["object_id"],
                "resolution_class": "canonical_object",
                "bounded_context": row["bounded_context"],
                "object_kind": row["object_kind"],
                "definition": row["canonical_definition"],
                "do_not_confuse_with": "; ".join(row["do_not_confuse_with"]),
                "source_refs": row["supporting_source_refs"],
                "notes": row["notes"],
            }
        )
    for alias_row in alias_rows:
        glossary_rows.append(
            {
                "term_id": f"ALIAS_{re.sub(r'[^A-Za-z0-9]+', '_', alias_row['alias']).upper()}",
                "canonical_term": alias_row["alias"],
                "entry_type": "alias",
                "object_id": alias_row["canonical_object_id"],
                "resolution_class": alias_row["resolution_class"],
                "bounded_context": "",
                "object_kind": "",
                "definition": alias_row["preferred_term"],
                "do_not_confuse_with": "; ".join(alias_row["related_object_ids"]),
                "source_refs": [alias_row["concept_id"]],
                "notes": alias_row["rationale"],
            }
        )
    glossary_rows.extend(glossary_rows_from_controls(route_rows, channel_payload, persona_payload, load_json(SHELL_MAP_PATH)))
    glossary_rows.sort(key=lambda item: (item["entry_type"], item["canonical_term"].lower(), item["term_id"]))

    kind_counter = Counter(row["object_kind"] for row in object_rows)
    context_counter = Counter(row["bounded_context"] for row in object_rows)
    gap_rows = [row for row in object_rows if row["object_id"].startswith("GAP_OBJECT_")]
    authoritative_count = sum(
        1
        for row in object_rows
        if row["object_kind"] in {"aggregate", "case", "thread", "record", "settlement", "checkpoint", "gate", "lease", "grant", "witness", "blocker"}
        and not row["object_id"].startswith("GAP_OBJECT_")
    )

    taxonomy_payload = {
        "taxonomy_id": "vecells_object_kind_taxonomy_v1",
        "object_kind_model": [
            {
                **entry,
                "count": kind_counter.get(entry["object_kind"], 0),
            }
            for entry in OBJECT_KIND_DEFINITIONS
        ],
        "families": [
            {
                "family_id": "domain_truths",
                "label": "Domain truths and child workflows",
                "included_kinds": ["aggregate", "case", "thread", "record", "settlement", "checkpoint", "gate", "lease", "grant", "witness", "blocker"],
                "count": sum(kind_counter.get(kind, 0) for kind in ["aggregate", "case", "thread", "record", "settlement", "checkpoint", "gate", "lease", "grant", "witness", "blocker"]),
            },
            {
                "family_id": "projection_and_surface",
                "label": "Projection, digest, artifact, and surface descriptors",
                "included_kinds": ["projection", "digest", "descriptor", "artifact"],
                "count": sum(kind_counter.get(kind, 0) for kind in ["projection", "digest", "descriptor", "artifact"]),
            },
            {
                "family_id": "publication_and_policy",
                "label": "Policy, contract, bundle, manifest, tuple, namespace, and event contracts",
                "included_kinds": ["policy", "contract", "bundle", "manifest", "tuple", "namespace", "event_contract"],
                "count": sum(kind_counter.get(kind, 0) for kind in ["policy", "contract", "bundle", "manifest", "tuple", "namespace", "event_contract"]),
            },
            {
                "family_id": "gaps",
                "label": "Bounded gap objects",
                "included_kinds": sorted({row["object_kind"] for row in gap_rows}),
                "count": len(gap_rows),
            },
        ],
    }

    alias_payload_out = {
        "alias_map_id": "vecells_object_alias_map_v1",
        "rows": alias_rows,
    }

    catalog_payload = {
        "catalog_id": "vecells_object_catalog_v1",
        "mission": "Canonical object catalog and glossary for the Vecells programme.",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream_inputs,
        "summary": {
            "object_count": len(object_rows),
            "gap_object_count": len(gap_rows),
            "authoritative_object_count": authoritative_count,
            "projection_count": kind_counter.get("projection", 0),
            "gate_or_blocker_count": kind_counter.get("gate", 0) + kind_counter.get("blocker", 0) + kind_counter.get("checkpoint", 0),
            "relationship_count": len(relationships),
            "glossary_row_count": len(glossary_rows),
        },
        "high_risk_confusions": HIGH_RISK_SPOTLIGHTS,
        "kind_counts": dict(sorted(kind_counter.items())),
        "context_counts": dict(sorted(context_counter.items())),
        "objects": object_rows,
        "gaps": [
            {
                "object_id": row["object_id"],
                "canonical_name": row["canonical_name"],
                "bounded_context": row["bounded_context"],
                "source_ref": row["supporting_source_refs"][0] if row["supporting_source_refs"] else row["canonical_source_file"],
                "why_bounded": row["notes"],
            }
            for row in gap_rows
        ],
        "assumptions": [
            "ASSUMPTION_OBJECT_001: Flow-only nouns were retained as explicit gap or implied objects when the corpus clearly depends on them.",
            "ASSUMPTION_OBJECT_002: Route families, shell types, audience tiers, and channel profiles stay glossary concepts or contract artifacts rather than being promoted to aggregates.",
            "ASSUMPTION_OBJECT_003: Child-domain cases remain distinct from canonical Request milestone truth even when the flow baseline uses summary verbs like booked or resolved.",
        ],
        "risks": [
            "RISK_OBJECT_001: Flow-only gap objects still need stronger standalone blueprint blocks if later implementation tasks require field-level schemas.",
            "RISK_OBJECT_002: Runtime publication/event-contract objects remain more prose-backed than schema-backed and should be formalized before code generation depends on them mechanically.",
        ],
    }

    write_csv(
        GLOSSARY_CSV_PATH,
        glossary_rows,
        [
            "term_id",
            "canonical_term",
            "entry_type",
            "object_id",
            "resolution_class",
            "bounded_context",
            "object_kind",
            "definition",
            "do_not_confuse_with",
            "source_refs",
            "notes",
        ],
    )
    write_json(OBJECT_CATALOG_JSON_PATH, catalog_payload)
    write_csv(
        RELATIONSHIPS_CSV_PATH,
        relationships,
        [
            "source_object_id",
            "source_name",
            "relationship_type",
            "target_object_id",
            "target_name",
            "evidence",
            "source_ref",
            "notes",
        ],
    )
    write_json(OBJECT_ALIAS_MAP_JSON_PATH, alias_payload_out)
    write_json(OBJECT_KIND_TAXONOMY_JSON_PATH, taxonomy_payload)
    write_jsonl(TRACEABILITY_JSONL_PATH, traceability_rows)

    glossary_doc = "\n".join(
        [
            "# 06 Canonical Domain Glossary",
            "",
            "The machine-readable glossary is authoritative in `data/analysis/canonical_domain_glossary.csv`. This document summarizes the semantic atlas that later architecture and code-generation work should consume.",
            "",
            "## Summary",
            "",
            render_table(
                ["Measure", "Count"],
                [
                    ["Catalogued objects", len(object_rows)],
                    ["Glossary rows", len(glossary_rows)],
                    ["Alias rows", len(alias_rows)],
                    ["Glossary-only control concepts", len(glossary_rows) - len(object_rows) - len(alias_rows)],
                    ["Gap objects", len(gap_rows)],
                ],
            ),
            "",
            "## High-Risk Alias Resolutions",
            "",
            render_table(
                ["Alias", "Resolution class", "Preferred term / object", "Related objects"],
                [
                    [
                        row["alias"],
                        row["resolution_class"],
                        row["preferred_term"],
                        row["canonical_object_name"] or "; ".join(row["related_object_ids"]),
                    ]
                    for row in alias_rows[:24]
                ],
            ),
            "",
            "## Control Concepts",
            "",
            render_table(
                ["Term", "Entry type", "Definition", "Notes"],
                [
                    [row["canonical_term"], row["entry_type"], row["definition"], row["notes"]]
                    for row in glossary_rows
                    if row["entry_type"] in {"shell_type", "route_family", "channel_profile", "channel", "audience_tier"}
                ][:40],
            ),
        ]
    )
    write_text(GLOSSARY_DOC_PATH, glossary_doc)

    object_catalog_doc = "\n".join(
        [
            "# 06 Object Catalog",
            "",
            "The full machine-readable catalog lives in `data/analysis/object_catalog.json`. This index keeps the primary fields reviewable in one human-readable document.",
            "",
            "## Counts",
            "",
            render_table(
                ["Object kind", "Count"],
                [[kind, count] for kind, count in sorted(kind_counter.items())],
            ),
            "",
            "## Catalog Index",
            "",
            render_table(
                ["Object ID", "Canonical name", "Kind", "Context", "Phase", "Owner", "Source"],
                [
                    [
                        row["object_id"],
                        row["canonical_name"],
                        row["object_kind"],
                        row["bounded_context"],
                        row["phase_of_first_authoritative_introduction"],
                        row["authoritative_owner"],
                        row["canonical_source_file"],
                    ]
                    for row in object_rows
                ],
            ),
        ]
    )
    write_text(OBJECT_CATALOG_DOC_PATH, object_catalog_doc)

    object_taxonomy_doc = "\n".join(
        [
            "# 06 Object Taxonomy And Kind Model",
            "",
            "This taxonomy separates domain truths, control-plane primitives, runtime/publication contracts, and surface projections so later tasks do not flatten them into one noun bucket.",
            "",
            "## Kind Model",
            "",
            render_table(
                ["Kind", "Definition", "Count"],
                [
                    [entry["object_kind"], entry["definition"], entry["count"]]
                    for entry in taxonomy_payload["object_kind_model"]
                ],
            ),
            "",
            "## Family Model",
            "",
            render_table(
                ["Family", "Kinds", "Count"],
                [
                    [entry["label"], entry["included_kinds"], entry["count"]]
                    for entry in taxonomy_payload["families"]
                ],
            ),
        ]
    )
    write_text(OBJECT_TAXONOMY_DOC_PATH, object_taxonomy_doc)

    relationship_doc = "\n".join(
        [
            "# 06 Object Relationship Map",
            "",
            "Relationships are extracted from schema refs, truth-bridge cues, and bounded do-not-confuse mappings. The CSV is authoritative for machine use.",
            "",
            "## Relationship Counts",
            "",
            render_table(
                ["Relationship", "Count"],
                [
                    [name, count]
                    for name, count in sorted(Counter(item["relationship_type"] for item in relationships).items())
                ],
            ),
            "",
            "## Key Relationships",
            "",
            render_table(
                ["Source", "Relationship", "Target", "Evidence"],
                [
                    [
                        item["source_name"],
                        item["relationship_type"],
                        item["target_name"],
                        item["evidence"],
                    ]
                    for item in relationships[:120]
                ],
            ),
        ]
    )
    write_text(RELATIONSHIP_DOC_PATH, relationship_doc)

    alias_doc = "\n".join(
        [
            "# 06 Aliases, Deprecated Terms, And Forbidden Shorthand",
            "",
            "The alias map prevents terminology drift from collapsing orthogonal objects, state axes, or runtime contracts into vague prose.",
            "",
            "## Alias Classes",
            "",
            render_table(
                ["Resolution class", "Count"],
                [
                    [name, count]
                    for name, count in sorted(Counter(item["resolution_class"] for item in alias_rows).items())
                ],
            ),
            "",
            "## Alias Registry",
            "",
            render_table(
                ["Alias", "Status", "Resolution", "Preferred term", "Related objects"],
                [
                    [
                        item["alias"],
                        item["alias_status"],
                        item["resolution_class"],
                        item["preferred_term"],
                        item["canonical_object_name"] or item["related_object_ids"],
                    ]
                    for item in alias_rows
                ],
            ),
        ]
    )
    write_text(ALIAS_DOC_PATH, alias_doc)

    gap_doc = "\n".join(
        [
            "# 06 Object Catalog Gap Report",
            "",
            "Gap objects are retained because the corpus relies on them semantically, but they still lack one stronger canonical schema block. They are bounded rather than silently omitted.",
            "",
            "## Gap Objects",
            "",
            render_table(
                ["Object ID", "Canonical name", "Context", "Source", "Why bounded"],
                [
                    [
                        row["object_id"],
                        row["canonical_name"],
                        row["bounded_context"],
                        row["canonical_source_file"],
                        row["notes"],
                    ]
                    for row in gap_rows
                ],
            ),
            "",
            "## Risks",
            "",
            "\n".join(f"- {risk}" for risk in catalog_payload["risks"]),
            "",
            "## Assumptions",
            "",
            "\n".join(f"- {assumption}" for assumption in catalog_payload["assumptions"]),
        ]
    )
    write_text(GAP_REPORT_DOC_PATH, gap_doc)

    focus_names = [
        "SubmissionEnvelope",
        "RequestLineage",
        "Request",
        "IdentityBinding",
        "AccessGrant",
        "RouteIntentBinding",
        "CommandSettlementRecord",
        "MoreInfoCycle",
        "CallbackCase",
        "ClinicianMessageThread",
        "BookingCase",
        "HubCoordinationCase",
        "PharmacyCase",
        "AdminResolutionCase",
        "PersistentShell",
        "AudienceSurfaceRuntimeBinding",
        "AssuranceSliceTrustRecord",
        "AssuranceEvidenceGraphSnapshot",
    ]
    focus_ids = {name_to_object_id[name] for name in focus_names if name in name_to_object_id}
    mermaid_edges = [
        item
        for item in relationships
        if item["source_object_id"] in focus_ids and item["target_object_id"] in focus_ids
    ][:48]
    mermaid_lines = ["graph LR"]
    for row in object_rows:
        if row["object_id"] in focus_ids:
            mermaid_lines.append(f'  {row["object_id"]}["{row["canonical_name"]}"]')
    for edge in mermaid_edges:
        mermaid_lines.append(
            f'  {edge["source_object_id"]} -->|"{edge["relationship_type"]}"| {edge["target_object_id"]}'
        )
    write_text(MERMAID_PATH, "\n".join(mermaid_lines))

    atlas_payload = {
        "catalog": {
            "summary": catalog_payload["summary"],
            "objects": [
                {
                    "object_id": row["object_id"],
                    "canonical_name": row["canonical_name"],
                    "object_kind": row["object_kind"],
                    "bounded_context": row["bounded_context"],
                    "phase": row["phase_of_first_authoritative_introduction"],
                    "owner": row["authoritative_owner"],
                    "definition": row["canonical_definition"],
                    "truth_role": row["authoritative_success_or_truth_role"],
                    "aliases": row["aliases"],
                    "deprecated_terms": row["deprecated_or_forbidden_terms"],
                    "source_file": row["canonical_source_file"],
                    "source_block": row["canonical_source_heading_or_block"],
                    "supporting_refs": row["supporting_source_refs"],
                    "state_machines": row["related_state_machine_refs"],
                    "events": row["related_event_refs"],
                    "related_object_ids": row["related_object_ids"],
                    "do_not_confuse_with": row["do_not_confuse_with"],
                    "durability_class": row["durability_class"],
                    "mutability_rule": row["mutability_rule"],
                    "visibility_implications": row["visibility_or_masking_implications"],
                    "identity_implications": row["identity_or_subject_implications"],
                    "external_implications": row["external_dependency_implications"],
                    "notes": row["notes"],
                }
                for row in object_rows
            ],
            "relationships": relationships,
            "spotlights": HIGH_RISK_SPOTLIGHTS,
            "context_counts": dict(sorted(context_counter.items())),
            "kind_counts": dict(sorted(kind_counter.items())),
        }
    }
    atlas_template = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vecells Domain Glossary Atlas</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #F5F7FA;
      --surface: #FFFFFF;
      --ink: #121826;
      --ink-muted: #475467;
      --border: #D0D5DD;
      --cobalt: #335CFF;
      --teal: #0F8B8D;
      --success: #0F9D58;
      --warning: #C98900;
      --danger: #C24141;
      --lavender: #6E59D9;
      --chart: #98A2B3;
      --shadow: 0 8px 24px rgba(18,24,38,0.06);
      --radius: 16px;
      --rail-width: 280px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { min-height: 100vh; }
    a { color: inherit; }
    button, input, select { font: inherit; }
    :focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
    .page-shell { max-width: 1440px; margin: 0 auto; padding: 0 32px 32px; }
    .site-header { height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 14px; font-weight: 600; letter-spacing: 0.01em; }
    .brand-mark { width: 34px; height: 34px; position: relative; }
    .brand-mark span { position: absolute; width: 10px; height: 10px; border-radius: 999px; background: var(--cobalt); }
    .brand-mark span:nth-child(1) { left: 0; top: 12px; }
    .brand-mark span:nth-child(2) { left: 12px; top: 0; background: var(--teal); }
    .brand-mark span:nth-child(3) { right: 0; bottom: 0; background: var(--lavender); }
    .brand-mark::before, .brand-mark::after { content: ""; position: absolute; border-top: 2px solid rgba(51,92,255,0.35); transform-origin: left center; }
    .brand-mark::before { left: 5px; top: 17px; width: 14px; transform: rotate(-42deg); }
    .brand-mark::after { left: 17px; top: 9px; width: 12px; transform: rotate(42deg); }
    .meta-tag { padding: 8px 12px; border-radius: 999px; background: rgba(51,92,255,0.08); color: var(--cobalt); font-size: 13px; }
    .layout { display: grid; grid-template-columns: var(--rail-width) minmax(0, 1fr); gap: 24px; align-items: start; }
    .rail, .hero-card, .table-panel, .detail-panel, .spotlight-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); }
    .rail { padding: 20px; position: sticky; top: 16px; }
    .rail h2, .section-title { margin: 0 0 14px; font-size: 16px; line-height: 24px; font-weight: 600; }
    .rail p { margin: 0 0 18px; font-size: 13px; line-height: 20px; color: var(--ink-muted); }
    .filter-group { margin-bottom: 18px; }
    .filter-group label { display: block; margin-bottom: 6px; font-size: 12px; line-height: 18px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .filter-group input, .filter-group select { width: 100%; border: 1px solid var(--border); background: #fff; border-radius: 12px; padding: 10px 12px; color: var(--ink); }
    .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip-row button { border: 1px solid var(--border); background: #fff; color: var(--ink); border-radius: 999px; padding: 7px 10px; font-size: 12px; line-height: 18px; cursor: pointer; transition: border-color 140ms, color 140ms, transform 140ms; }
    .chip-row button.active { border-color: var(--cobalt); color: var(--cobalt); }
    .spotlight-card { margin-top: 18px; padding: 16px; }
    .spotlight-label { color: var(--lavender); font-size: 12px; line-height: 18px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .spotlight-title { margin: 0 0 6px; font-size: 16px; line-height: 24px; font-weight: 600; }
    .spotlight-body { margin: 0; font-size: 13px; line-height: 20px; color: var(--ink-muted); }
    .hero { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .hero-card { padding: 20px; min-height: 128px; }
    .hero-card h3 { margin: 0 0 8px; font-size: 13px; line-height: 20px; color: var(--ink-muted); font-weight: 500; }
    .hero-card strong { display: block; font-size: 28px; line-height: 34px; font-weight: 600; margin-bottom: 8px; }
    .hero-card span { font-size: 13px; line-height: 20px; color: var(--ink-muted); }
    .hero-card.accent { background: linear-gradient(140deg, rgba(51,92,255,0.1), rgba(15,139,141,0.08)); }
    .content-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.95fr); gap: 24px; align-items: start; }
    .table-panel { overflow: hidden; }
    .panel-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 18px 20px 12px; border-bottom: 1px solid var(--border); }
    .panel-header p { margin: 0; font-size: 13px; line-height: 20px; color: var(--ink-muted); }
    .table-wrap { max-height: calc(100vh - 220px); overflow: auto; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; line-height: 20px; }
    th, td { padding: 12px 14px; border-bottom: 1px solid rgba(208,213,221,0.8); text-align: left; vertical-align: top; background: #fff; }
    th { position: sticky; top: 0; z-index: 4; font-weight: 600; color: var(--ink-muted); background: #FBFCFD; }
    th.sticky, td.sticky { position: sticky; left: 0; z-index: 3; background: inherit; }
    th.sticky-2, td.sticky-2 { position: sticky; left: 126px; z-index: 3; background: inherit; }
    tr[data-selected="true"] td { background: rgba(51,92,255,0.05); }
    tr:hover td { background: rgba(51,92,255,0.03); }
    .row-button { appearance: none; border: none; background: transparent; color: inherit; padding: 0; font: inherit; text-align: left; cursor: pointer; width: 100%; }
    .kind-chip, .state-chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 4px 8px; font-size: 12px; line-height: 18px; white-space: nowrap; }
    .kind-chip { background: rgba(51,92,255,0.08); color: var(--cobalt); }
    .state-chip.gap { background: rgba(194,65,65,0.08); color: var(--danger); }
    .state-chip.authoritative { background: rgba(15,157,88,0.08); color: var(--success); }
    .detail-panel { padding: 20px; position: sticky; top: 16px; min-height: 520px; }
    .detail-placeholder { color: var(--ink-muted); font-size: 14px; line-height: 22px; }
    .detail-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; }
    .detail-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 18px; }
    .detail-section { margin-top: 18px; }
    .detail-section h3 { margin: 0 0 8px; font-size: 13px; line-height: 20px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-section p, .detail-section li { margin: 0; font-size: 14px; line-height: 22px; color: var(--ink); }
    .detail-list { margin: 0; padding-left: 18px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .mini-card { border: 1px solid rgba(208,213,221,0.9); border-radius: 14px; padding: 12px; background: #FBFCFD; }
    .mini-card strong { display: block; font-size: 12px; line-height: 18px; color: var(--ink-muted); margin-bottom: 4px; }
    .mini-card span { font-size: 13px; line-height: 20px; }
    .graph-shell { border: 1px solid rgba(208,213,221,0.9); border-radius: 14px; background: #FBFCFD; padding: 12px; }
    svg { width: 100%; height: 300px; display: block; }
    .graph-note { font-size: 12px; line-height: 18px; color: var(--ink-muted); margin-top: 8px; }
    .parity-list { margin: 10px 0 0; padding-left: 18px; font-size: 13px; line-height: 20px; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .empty-state { padding: 18px 20px 24px; color: var(--ink-muted); font-size: 14px; line-height: 22px; }
    @media (max-width: 1180px) {
      .page-shell { padding: 0 20px 24px; }
      .layout { grid-template-columns: 1fr; }
      .rail, .detail-panel { position: static; }
      .hero { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .page-shell { padding: 0 16px 20px; }
      .hero { grid-template-columns: 1fr; }
      .detail-grid { grid-template-columns: 1fr; }
      th.sticky-2, td.sticky-2 { left: 102px; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { scroll-behavior: auto !important; transition: none !important; }
    }
    @media print {
      body { background: #fff; }
      .rail, .hero, .table-panel, .meta-tag { display: none !important; }
      .layout, .content-grid { display: block; }
      .detail-panel { position: static; box-shadow: none; border-color: #c7ccd5; }
    }
  </style>
</head>
<body data-testid="atlas-shell">
  <div class="page-shell">
    <header class="site-header">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <div style="font-size: 14px; line-height: 22px; color: var(--ink-muted);">Vecells architecture atlas</div>
          <div style="font-size: 20px; line-height: 28px;">Canonical domain glossary and object catalog</div>
        </div>
      </div>
      <div class="meta-tag">Static local atlas</div>
    </header>
    <div class="layout">
      <aside class="rail" data-testid="atlas-nav" aria-label="Taxonomy and glossary filters">
        <h2>Filters</h2>
        <p>Use taxonomy filters to separate authoritative objects, projections, runtime controls, and bounded gaps without collapsing them into one noun family.</p>
        <div class="filter-group">
          <label for="search-input">Search names and aliases</label>
          <input id="search-input" data-testid="filter-search" type="search" placeholder="RequestLineage, ownershipState, confirmation gate">
        </div>
        <div class="filter-group">
          <label for="kind-filter">Object kind</label>
          <select id="kind-filter" data-testid="filter-kind"></select>
        </div>
        <div class="filter-group">
          <label for="phase-filter">Phase / source layer</label>
          <select id="phase-filter" data-testid="filter-phase"></select>
        </div>
        <div class="filter-group">
          <label for="owner-filter">Authoritative owner</label>
          <select id="owner-filter" data-testid="filter-owner"></select>
        </div>
        <div class="filter-group">
          <label>Bounded context chips</label>
          <div class="chip-row" id="context-chips" data-testid="filter-context-chips"></div>
        </div>
        <section class="spotlight-card" data-testid="spotlight-strip" aria-live="polite">
          <div class="spotlight-label">Glossary spotlight</div>
          <h3 class="spotlight-title" id="spotlight-title"></h3>
          <p class="spotlight-body" id="spotlight-body"></p>
        </section>
      </aside>
      <main>
        <section class="hero" data-testid="hero-summary" aria-label="Catalog summary">
          <article class="hero-card accent"><h3>Objects</h3><strong id="count-objects"></strong><span>Canonical catalog rows</span></article>
          <article class="hero-card"><h3>Authoritative</h3><strong id="count-authoritative"></strong><span>Foundation truths, cases, records, leases, and gates</span></article>
          <article class="hero-card"><h3>Projections</h3><strong id="count-projections"></strong><span>Read-side and cross-surface truth bridges</span></article>
          <article class="hero-card"><h3>Gates and blockers</h3><strong id="count-gates"></strong><span>Checkpoints, gates, blockers, and freezes</span></article>
          <article class="hero-card"><h3>Bounded gaps</h3><strong id="count-gaps"></strong><span>Flow-visible nouns still awaiting stronger schema blocks</span></article>
        </section>
        <section class="content-grid">
          <section class="table-panel" aria-labelledby="table-heading">
            <div class="panel-header">
              <div>
                <h2 class="section-title" id="table-heading">Searchable object table</h2>
                <p id="table-summary">All catalog rows. Use the table and the detail panel together; the graph never stands alone.</p>
              </div>
            </div>
            <div class="table-wrap">
              <table data-testid="object-table">
                <thead>
                  <tr>
                    <th class="sticky">Object ID</th>
                    <th class="sticky-2">Canonical name</th>
                    <th>Kind</th>
                    <th>Bounded context</th>
                    <th>Phase</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody id="object-table-body"></tbody>
              </table>
            </div>
            <div class="empty-state" id="empty-state" hidden data-testid="empty-state">No objects match the current filters. Clear one or more controls to restore the full catalog.</div>
          </section>
          <aside class="detail-panel" data-testid="detail-panel" aria-live="polite">
            <div class="detail-placeholder" id="detail-placeholder">Select an object to inspect definition, traceability, relationships, aliases, and do-not-confuse guidance.</div>
            <div id="detail-content" hidden>
              <h2 class="detail-title" id="detail-title"></h2>
              <div class="detail-meta" id="detail-meta"></div>
              <div class="detail-grid" id="detail-grid"></div>
              <section class="detail-section">
                <h3>Definition</h3>
                <p id="detail-definition"></p>
              </section>
              <section class="detail-section">
                <h3>Truth role</h3>
                <p id="detail-truth"></p>
              </section>
              <section class="detail-section">
                <h3>Source traceability</h3>
                <ul class="detail-list" id="detail-sources"></ul>
              </section>
              <section class="detail-section">
                <h3>Aliases and forbidden shorthand</h3>
                <ul class="detail-list" id="detail-aliases"></ul>
              </section>
              <section class="detail-section">
                <h3>Do not confuse with</h3>
                <ul class="detail-list" id="detail-confusions"></ul>
              </section>
              <section class="detail-section">
                <h3>Relationship canvas</h3>
                <div class="graph-shell" data-testid="relationship-graph">
                  <svg id="relationship-svg" role="img" aria-label="Selected object relationship graph"></svg>
                  <div class="graph-note">Adjacent list parity is provided below. The graph is a view, not the source of truth.</div>
                </div>
                <ul class="parity-list" id="relationship-parity-list" data-testid="relationship-parity-list"></ul>
              </section>
            </div>
          </aside>
        </section>
      </main>
    </div>
  </div>
  <div class="visually-hidden" id="announcer" aria-live="polite"></div>
  <script id="atlas-data" type="application/json">__ATLAS_DATA__</script>
  <script>
    const atlas = JSON.parse(document.getElementById("atlas-data").textContent);
    const objects = atlas.catalog.objects;
    const relationships = atlas.catalog.relationships;
    const objectMap = new Map(objects.map((item) => [item.object_id, item]));
    const relationMap = new Map();
    relationships.forEach((edge) => {
      const list = relationMap.get(edge.source_object_id) || [];
      list.push(edge);
      relationMap.set(edge.source_object_id, list);
    });

    const filters = {
      search: document.getElementById("search-input"),
      kind: document.getElementById("kind-filter"),
      phase: document.getElementById("phase-filter"),
      owner: document.getElementById("owner-filter"),
      contexts: document.getElementById("context-chips"),
    };
    const body = document.getElementById("object-table-body");
    const emptyState = document.getElementById("empty-state");
    const announcer = document.getElementById("announcer");
    const tableSummary = document.getElementById("table-summary");
    const spotlightTitle = document.getElementById("spotlight-title");
    const spotlightBody = document.getElementById("spotlight-body");

    let selectedContext = "";
    let selectedObjectId = "";
    let filteredObjects = [...objects];
    let spotlightIndex = 0;

    function uniqueValues(key) {
      return Array.from(new Set(objects.map((item) => item[key]).filter(Boolean))).sort();
    }

    function populateSelect(select, values, label) {
      const options = [`<option value="">All ${label}</option>`].concat(
        values.map((value) => `<option value="${value}">${value}</option>`)
      );
      select.innerHTML = options.join("");
    }

    populateSelect(filters.kind, uniqueValues("object_kind"), "kinds");
    populateSelect(filters.phase, uniqueValues("phase"), "phases");
    populateSelect(filters.owner, uniqueValues("owner"), "owners");

    uniqueValues("bounded_context").forEach((context) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = context;
      button.dataset.context = context;
      button.addEventListener("click", () => {
        selectedContext = selectedContext === context ? "" : context;
        Array.from(filters.contexts.querySelectorAll("button")).forEach((node) => {
          node.classList.toggle("active", node.dataset.context === selectedContext);
        });
        applyFilters();
      });
      filters.contexts.appendChild(button);
    });

    function fuzzyMatch(item, search) {
      if (!search) {
        return true;
      }
      const haystack = [
        item.object_id,
        item.canonical_name,
        item.object_kind,
        item.bounded_context,
        item.owner,
        item.definition,
        ...(item.aliases || []),
        ...(item.deprecated_terms || []),
      ]
        .join(" ")
        .toLowerCase();
      const normalizedSearch = search.toLowerCase().trim();
      if (!normalizedSearch) {
        return true;
      }
      return normalizedSearch.split(/\\s+/).every((token) => haystack.includes(token));
    }

    function computeVisibleObjects() {
      return objects.filter((item) => {
        if (filters.kind.value && item.object_kind !== filters.kind.value) return false;
        if (filters.phase.value && item.phase !== filters.phase.value) return false;
        if (filters.owner.value && item.owner !== filters.owner.value) return false;
        if (selectedContext && item.bounded_context !== selectedContext) return false;
        return fuzzyMatch(item, filters.search.value);
      });
    }

    function statusChip(item) {
      if (item.object_id.startsWith("GAP_OBJECT_")) {
        return '<span class="state-chip gap">Gap object</span>';
      }
      return '<span class="state-chip authoritative">Catalogued</span>';
    }

    function updateHero(visibleObjects) {
      const authoritative = visibleObjects.filter((item) => !item.object_id.startsWith("GAP_OBJECT_") && ["aggregate", "case", "thread", "record", "settlement", "checkpoint", "gate", "lease", "grant", "witness", "blocker"].includes(item.object_kind)).length;
      const projections = visibleObjects.filter((item) => item.object_kind === "projection").length;
      const gates = visibleObjects.filter((item) => ["gate", "blocker", "checkpoint"].includes(item.object_kind)).length;
      const gaps = visibleObjects.filter((item) => item.object_id.startsWith("GAP_OBJECT_")).length;
      document.getElementById("count-objects").textContent = String(visibleObjects.length);
      document.getElementById("count-authoritative").textContent = String(authoritative);
      document.getElementById("count-projections").textContent = String(projections);
      document.getElementById("count-gates").textContent = String(gates);
      document.getElementById("count-gaps").textContent = String(gaps);
    }

    function renderTable(visibleObjects) {
      body.innerHTML = "";
      visibleObjects.forEach((item) => {
        const row = document.createElement("tr");
        row.dataset.selected = item.object_id === selectedObjectId ? "true" : "false";
        row.innerHTML = `
          <td class="sticky"><button class="row-button" type="button" data-object-id="${item.object_id}">${item.object_id}</button></td>
          <td class="sticky-2"><button class="row-button" type="button" data-object-id="${item.object_id}">${item.canonical_name}</button></td>
          <td><span class="kind-chip">${item.object_kind}</span></td>
          <td>${item.bounded_context}</td>
          <td>${item.phase}</td>
          <td>${item.owner}</td>
        `;
        row.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => selectObject(item.object_id, true));
          button.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectObject(item.object_id, true);
            }
          });
        });
        body.appendChild(row);
      });
      emptyState.hidden = visibleObjects.length > 0;
      tableSummary.textContent = `${visibleObjects.length} visible rows. Deep-linkable object ids appear in the first column.`;
    }

    function relationListFor(objectId) {
      return relationships.filter((edge) => edge.source_object_id === objectId || edge.target_object_id === objectId);
    }

    function renderGraph(objectId) {
      const svg = document.getElementById("relationship-svg");
      const parityList = document.getElementById("relationship-parity-list");
      const selected = objectMap.get(objectId);
      const edges = relationListFor(objectId).slice(0, 10);
      parityList.innerHTML = "";
      if (!selected) {
        svg.innerHTML = "";
        return;
      }
      const neighbors = [];
      edges.forEach((edge) => {
        const neighborId = edge.source_object_id === objectId ? edge.target_object_id : edge.source_object_id;
        if (!neighbors.includes(neighborId)) {
          neighbors.push(neighborId);
        }
      });
      const width = 520;
      const height = 300;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 105;
      const nodes = [{ id: objectId, label: selected.canonical_name, x: centerX, y: centerY, active: true }];
      neighbors.slice(0, 8).forEach((neighborId, index, array) => {
        const angle = (Math.PI * 2 * index) / Math.max(array.length, 1);
        const neighbor = objectMap.get(neighborId);
        nodes.push({
          id: neighborId,
          label: neighbor ? neighbor.canonical_name : neighborId,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          active: false,
        });
      });
      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      const lines = edges
        .filter((edge) => nodeById.has(edge.source_object_id) && nodeById.has(edge.target_object_id))
        .map((edge) => {
          const source = nodeById.get(edge.source_object_id);
          const target = nodeById.get(edge.target_object_id);
          return `
            <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="#98A2B3" stroke-width="1.5"></line>
            <text x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 - 4}" fill="#475467" font-size="11" text-anchor="middle">${edge.relationship_type}</text>
          `;
        })
        .join("");
      const circles = nodes
        .map((node) => {
          const fill = node.active ? "#335CFF" : "#FFFFFF";
          const stroke = node.active ? "#335CFF" : "#0F8B8D";
          const textFill = node.active ? "#FFFFFF" : "#121826";
          return `
            <g>
              <circle cx="${node.x}" cy="${node.y}" r="34" fill="${fill}" stroke="${stroke}" stroke-width="2"></circle>
              <text x="${node.x}" y="${node.y - 2}" fill="${textFill}" font-size="11" font-weight="600" text-anchor="middle">${node.label.slice(0, 18)}</text>
            </g>
          `;
        })
        .join("");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.innerHTML = `${lines}${circles}`;
      edges.forEach((edge) => {
        const neighborId = edge.source_object_id === objectId ? edge.target_object_id : edge.source_object_id;
        const neighbor = objectMap.get(neighborId);
        const item = document.createElement("li");
        item.textContent = `${edge.relationship_type}: ${neighbor ? neighbor.canonical_name : neighborId} (${edge.evidence})`;
        parityList.appendChild(item);
      });
    }

    function renderDetail(objectId) {
      const placeholder = document.getElementById("detail-placeholder");
      const content = document.getElementById("detail-content");
      const item = objectMap.get(objectId);
      if (!item) {
        placeholder.hidden = false;
        content.hidden = true;
        return;
      }
      placeholder.hidden = true;
      content.hidden = false;
      document.getElementById("detail-title").textContent = item.canonical_name;
      document.getElementById("detail-meta").innerHTML = `
        <span class="kind-chip">${item.object_kind}</span>
        <span class="kind-chip">${item.bounded_context}</span>
        <span class="kind-chip">${item.phase}</span>
        ${statusChip(item)}
      `;
      document.getElementById("detail-grid").innerHTML = `
        <div class="mini-card"><strong>Object ID</strong><span>${item.object_id}</span></div>
        <div class="mini-card"><strong>Owner</strong><span>${item.owner}</span></div>
        <div class="mini-card"><strong>Durability</strong><span>${item.durability_class}</span></div>
        <div class="mini-card"><strong>Mutability</strong><span>${item.mutability_rule}</span></div>
      `;
      document.getElementById("detail-definition").textContent = item.definition;
      document.getElementById("detail-truth").textContent = item.truth_role;
      document.getElementById("detail-sources").innerHTML = [
        `<li>${item.source_file} / ${item.source_block}</li>`,
        ...item.supporting_refs.map((ref) => `<li>${ref}</li>`),
      ].join("");
      const aliasEntries = [];
      if (item.aliases.length) {
        aliasEntries.push(`<li>Aliases: ${item.aliases.join(", ")}</li>`);
      }
      if (item.deprecated_terms.length) {
        aliasEntries.push(`<li>Deprecated or forbidden: ${item.deprecated_terms.join(", ")}</li>`);
      }
      if (!aliasEntries.length) {
        aliasEntries.push("<li>No secondary alias rows were carried into this object.</li>");
      }
      document.getElementById("detail-aliases").innerHTML = aliasEntries.join("");
      const confusionEntries = item.do_not_confuse_with
        .map((id) => objectMap.get(id))
        .filter(Boolean)
        .map((neighbor) => `<li>${neighbor.canonical_name}</li>`);
      document.getElementById("detail-confusions").innerHTML = confusionEntries.length ? confusionEntries.join("") : "<li>No explicit confusion pair recorded.</li>";
      renderGraph(objectId);
    }

    function syncSelection() {
      const visibleIds = new Set(filteredObjects.map((item) => item.object_id));
      if (selectedObjectId && !visibleIds.has(selectedObjectId)) {
        selectedObjectId = filteredObjects[0] ? filteredObjects[0].object_id : "";
      }
      if (!selectedObjectId && filteredObjects[0]) {
        selectedObjectId = filteredObjects[0].object_id;
      }
      renderTable(filteredObjects);
      renderDetail(selectedObjectId);
    }

    function applyFilters(announce = true) {
      filteredObjects = computeVisibleObjects();
      updateHero(filteredObjects);
      syncSelection();
      if (announce) {
        announcer.textContent = `${filteredObjects.length} objects visible after filter change.`;
      }
    }

    function selectObject(objectId, updateHash) {
      selectedObjectId = objectId;
      renderTable(filteredObjects);
      renderDetail(objectId);
      if (updateHash) {
        history.replaceState(null, "", `#${objectId}`);
      }
      announcer.textContent = `${objectMap.get(objectId)?.canonical_name || objectId} selected.`;
    }

    [filters.search, filters.kind, filters.phase, filters.owner].forEach((node) => {
      node.addEventListener("input", () => applyFilters());
      node.addEventListener("change", () => applyFilters());
    });

    function loadHashSelection() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && objectMap.has(hash)) {
        selectedObjectId = hash;
      }
      applyFilters(false);
      if (selectedObjectId) {
        renderDetail(selectedObjectId);
      }
    }

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && objectMap.has(hash)) {
        selectedObjectId = hash;
        syncSelection();
      }
    });

    function rotateSpotlight() {
      const item = atlas.catalog.spotlights[spotlightIndex % atlas.catalog.spotlights.length];
      spotlightTitle.textContent = item.title;
      spotlightBody.textContent = item.body;
      spotlightIndex += 1;
    }

    rotateSpotlight();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.setInterval(rotateSpotlight, 4800);
    }
    loadHashSelection();
  </script>
</body>
</html>
"""
    atlas_json = json.dumps(atlas_payload).replace("</", "<\\/")
    write_text(ATLAS_HTML_PATH, atlas_template.replace("__ATLAS_DATA__", atlas_json))

    return catalog_payload


def main() -> None:
    catalog_payload = build_catalog()
    print(
        json.dumps(
            {
                "catalog_id": catalog_payload["catalog_id"],
                "object_count": catalog_payload["summary"]["object_count"],
                "gap_object_count": catalog_payload["summary"]["gap_object_count"],
                "relationship_count": catalog_payload["summary"]["relationship_count"],
                "glossary_row_count": catalog_payload["summary"]["glossary_row_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
