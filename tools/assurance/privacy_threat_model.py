#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"
ANALYSIS_DIR = ROOT / "data" / "analysis"

TASK_ID = "par_126"
GENERATED_AT = "2026-04-14T00:00:00Z"
REVIEWED_AT = "2026-04-14"
VISUAL_MODE = "Privacy_Threat_Atlas"

DOC_THREAT_MODEL_PATH = DOCS_DIR / "126_privacy_threat_model.md"
DOC_BACKLOG_PATH = DOCS_DIR / "126_dpia_backlog.md"
DOC_FLOW_PATH = DOCS_DIR / "126_privacy_data_flow_inventory.md"
DOC_TRACEABILITY_PATH = DOCS_DIR / "126_privacy_control_traceability_matrix.md"
DOC_RULES_PATH = DOCS_DIR / "126_minimum_necessary_break_glass_and_disclosure_rules.md"
DOC_TRIGGERS_PATH = DOCS_DIR / "126_privacy_change_triggers_and_dpia_rerun_rules.md"
DOC_TRACKS_PATH = DOCS_DIR / "126_mock_now_vs_actual_privacy_strategy.md"
HTML_ATLAS_PATH = DOCS_DIR / "126_privacy_threat_atlas.html"

THREAT_REGISTER_PATH = DATA_DIR / "privacy_threat_register.csv"
FLOW_INVENTORY_PATH = DATA_DIR / "privacy_data_flow_inventory.json"
BACKLOG_PATH = DATA_DIR / "dpia_backlog.csv"
TRACEABILITY_PATH = DATA_DIR / "privacy_control_traceability.json"
ROLE_MATRIX_PATH = DATA_DIR / "privacy_role_and_review_matrix.csv"

MOCK_TRACK = "mock_current"
ACTUAL_TRACK = "actual_pending"
MIXED_TRACK = "mixed"
TRACKS = {MOCK_TRACK, ACTUAL_TRACK, MIXED_TRACK}
RISK_STATES = {"open", "bounded", "blocked_by_unknown", "accepted_pending_signoff"}

EXPECTED_PAR_125_OUTPUTS = [
    ROOT / "docs" / "assurance" / "125_clinical_risk_review_cadence.md",
    ROOT / "docs" / "assurance" / "125_clinical_signoff_matrix.md",
    ROOT / "docs" / "assurance" / "125_change_classification_and_assurance_triggers.md",
    ROOT / "data" / "assurance" / "clinical_risk_review_raci.csv",
    ROOT / "data" / "assurance" / "clinical_signoff_workflow_state_machine.json",
    ROOT / "data" / "assurance" / "clinical_signoff_gate_requirements.json",
    ROOT / "data" / "assurance" / "clinical_review_calendar_seed.json",
]

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/126.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
    "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
    "blueprint/phase-2-identity-and-echoes.md#Canonical event privacy posture",
    "blueprint/patient-portal-experience-architecture-blueprint.md#6. Security, privacy, and trust presentation",
    "blueprint/staff-operations-and-support-blueprint.md#Support, servicing-site, hub, and practice audience separation",
    "blueprint/platform-frontend-blueprint.md#UIEventVisibilityProfile and UITelemetryDisclosureFence",
    "blueprint/blueprint-init.md#Purpose-of-use, break-glass, consent, immutable audit, support replay, and AI governance",
    "blueprint/phase-8-the-assistive-layer.md#DPIA rerun and assistive trust triggers",
    "blueprint/phase-9-the-assurance-ledger.md#Audit explorer, break-glass review, and support replay",
    "blueprint/forensic-audit-findings.md#Findings 26, 53, 91, 95, 118, and 120",
    "data/analysis/data_classification_matrix.csv",
    "data/analysis/acting_scope_tuple_matrix.csv",
    "data/analysis/route_to_scope_requirements.csv",
    "data/analysis/access_grant_runtime_tuple_manifest.json",
    "data/analysis/contact_route_snapshot_manifest.json",
    "data/analysis/break_glass_scope_rules.json",
    "data/analysis/telemetry_redaction_policy.json",
    "data/analysis/audit_event_disclosure_matrix.csv",
    "data/analysis/ui_telemetry_vocabulary.json",
    "data/analysis/gateway_surface_manifest.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/assurance/dcb0129_hazard_register.json",
    "data/assurance/im1_artifact_index.json",
    "data/assurance/124_nhs_login_application_artifact_index.json",
]

REQUIRED_INPUTS = {
    "data_classification_matrix": ANALYSIS_DIR / "data_classification_matrix.csv",
    "acting_scope_tuple_matrix": ANALYSIS_DIR / "acting_scope_tuple_matrix.csv",
    "route_to_scope_requirements": ANALYSIS_DIR / "route_to_scope_requirements.csv",
    "access_grant_runtime_tuple_manifest": ANALYSIS_DIR / "access_grant_runtime_tuple_manifest.json",
    "contact_route_snapshot_manifest": ANALYSIS_DIR / "contact_route_snapshot_manifest.json",
    "break_glass_scope_rules": ANALYSIS_DIR / "break_glass_scope_rules.json",
    "telemetry_redaction_policy": ANALYSIS_DIR / "telemetry_redaction_policy.json",
    "audit_event_disclosure_matrix": ANALYSIS_DIR / "audit_event_disclosure_matrix.csv",
    "ui_telemetry_vocabulary": ANALYSIS_DIR / "ui_telemetry_vocabulary.json",
    "gateway_surface_manifest": ANALYSIS_DIR / "gateway_surface_manifest.json",
    "runtime_topology_manifest": ANALYSIS_DIR / "runtime_topology_manifest.json",
    "dcb0129_hazard_register": DATA_DIR / "dcb0129_hazard_register.json",
    "im1_artifact_index": DATA_DIR / "im1_artifact_index.json",
    "nhs_login_application_artifact_index": DATA_DIR / "nhs_login_application_artifact_index.json",
}

REVIEW_TRIGGER_CATALOG = [
    {
        "reviewTriggerId": "RTR_126_SPRINT_PRIVACY_DELTA",
        "label": "Sprint privacy delta review",
        "whenToRun": "Run when a current sprint changes one processing activity, disclosure surface, or control family.",
        "sourceBlueprintRefs": [
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
            "prompt/126.md#Mock_now_execution",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE",
        "label": "Release or runtime tuple change",
        "whenToRun": "Run when route publication, runtime binding, gateway surface, or release parity changes can alter who sees what.",
        "sourceBlueprintRefs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "blueprint/platform-frontend-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA",
        "label": "Break-glass or investigation scope delta",
        "whenToRun": "Run when replay, export, legal hold, or break-glass scope rules change.",
        "sourceBlueprintRefs": [
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "data/analysis/break_glass_scope_rules.json#rules",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE",
        "label": "Provider or sub-processor change",
        "whenToRun": "Run when live provider onboarding, external-adapter processor assignment, or transfer geography changes.",
        "sourceBlueprintRefs": [
            "prompt/126.md#Actual_production_strategy_later",
            "data/assurance/im1_artifact_index.json#conversion_workflow",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_TELEMETRY_SCHEMA_OR_DEBUG_SCOPE_DELTA",
        "label": "Telemetry schema or debug scope delta",
        "whenToRun": "Run when event vocabulary, diagnostic output, browser-visible traces, or masking rules expand.",
        "sourceBlueprintRefs": [
            "blueprint/platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "data/analysis/ui_telemetry_vocabulary.json#vocabularyEntries",
            "data/analysis/telemetry_redaction_policy.json#rules",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_ASSISTIVE_OR_MODEL_DELTA",
        "label": "Assistive or model delta",
        "whenToRun": "Run when prompt context, provenance, shadow mode, draft insertion, or surfaced rationale changes.",
        "sourceBlueprintRefs": [
            "blueprint/phase-8-the-assistive-layer.md#Any live assistive artifact must materialize under VisibilityProjectionPolicy",
            "prompt/126.md#assistive and model-backed privacy risk",
        ],
    },
    {
        "reviewTriggerId": "RTR_126_IDENTITY_OR_SECURE_LINK_SCOPE_DELTA",
        "label": "Identity or secure-link scope delta",
        "whenToRun": "Run when secure links, local session ceilings, scope claims, or wrong-patient repair behavior change.",
        "sourceBlueprintRefs": [
            "blueprint/phase-2-identity-and-echoes.md#AccessGrant",
            "data/analysis/access_grant_runtime_tuple_manifest.json#runtime_tuples",
            "data/analysis/nhs_login_scope_claim_matrix.csv",
        ],
    },
]

ROLE_CATALOG = [
    {
        "roleId": "ROLE_PRODUCT_OWNER",
        "roleTitle": "Product Owner",
        "reviewEventId": "PRIV_REVIEW_SPRINT_DELTA",
        "responsibility": "Owns minimization decisions for product scope and confirms why each processing activity exists.",
        "decisionType": "scope_and_priority",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "privacy_threat_register.csv",
            "dpia_backlog.csv",
        ],
        "noSelfApprovalBoundary": "Cannot singularly close high-risk or actual-production backlog items without privacy, security, and governance concurrence.",
        "escalationTargetRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "prerequisiteGapRefs": [],
        "sourceBlueprintRefs": [
            "prompt/126.md#Mission",
            "blueprint/blueprint-init.md#Core product framing",
        ],
        "notes": "Product ownership is necessary for purpose-of-use discipline but is not itself a privacy signoff substitute.",
    },
    {
        "roleId": "ROLE_ENGINEERING_LEAD",
        "roleTitle": "Engineering Lead",
        "reviewEventId": "PRIV_REVIEW_RUNTIME_AND_DISCLOSURE_CHANGE",
        "responsibility": "Confirms the runtime, projection, gateway, and telemetry controls are real authorization and disclosure controls rather than cosmetic shell behavior.",
        "decisionType": "technical_control_implementation",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "privacy_control_traceability.json",
            "privacy_data_flow_inventory.json",
        ],
        "noSelfApprovalBoundary": "Cannot mark a material privacy risk as closed without independent privacy and release review.",
        "escalationTargetRole": "ROLE_SECURITY_LEAD",
        "prerequisiteGapRefs": [],
        "sourceBlueprintRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
            "blueprint/platform-frontend-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
        "notes": "Engineering is accountable for turning visibility and masking rules into enforceable code and tests.",
    },
    {
        "roleId": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "roleTitle": "Privacy Lead / DPO Placeholder",
        "reviewEventId": "PRIV_REVIEW_DPIA_BACKLOG_AND_BREAK_GLASS",
        "responsibility": "Owns the DPIA-ready backlog, controller or processor questions, transparency obligations, and break-glass review burden.",
        "decisionType": "privacy_governance",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "dpia_backlog.csv",
            "privacy_role_and_review_matrix.csv",
            "126_mock_now_vs_actual_privacy_strategy.md",
        ],
        "noSelfApprovalBoundary": "Placeholder role may curate the backlog now but actual production acceptance remains pending named appointment and signoff policy.",
        "escalationTargetRole": "ROLE_GOVERNANCE_RELEASE_APPROVER",
        "prerequisiteGapRefs": [
            "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
        ],
        "sourceBlueprintRefs": [
            "prompt/126.md#Actual_production_strategy_later",
            "blueprint/phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",
        ],
        "notes": "The placeholder remains explicit so actual production signoff does not get implied before the governance model is published.",
    },
    {
        "roleId": "ROLE_CLINICAL_SAFETY_LEAD",
        "roleTitle": "Clinical Safety Lead",
        "reviewEventId": "PRIV_REVIEW_CLINICAL_AND_PATIENT_IMPACT",
        "responsibility": "Checks whether privacy drift changes patient-safe flows, wrong-patient repair, break-glass burden, or callback safety posture.",
        "decisionType": "clinical_safety_dependency_review",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "data/assurance/dcb0129_hazard_register.json",
            "privacy_threat_register.csv",
        ],
        "noSelfApprovalBoundary": "Clinical safety review is required for high-impact disclosure or wrong-patient scenarios and stays provisional until par_125 outputs are published.",
        "escalationTargetRole": "ROLE_GOVERNANCE_RELEASE_APPROVER",
        "prerequisiteGapRefs": [
            "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-1-the-red-flag-gate.md#Clinical safety documentation and incremental evidence updates",
            "data/assurance/dcb0129_hazard_register.json#hazards",
        ],
        "notes": "Privacy and clinical safety are linked where disclosure or repair drift can affect care delivery.",
    },
    {
        "roleId": "ROLE_SECURITY_LEAD",
        "roleTitle": "Security Lead",
        "reviewEventId": "PRIV_REVIEW_SECURITY_AND_TELEMETRY_SCOPE",
        "responsibility": "Checks browser-visible diagnostics, secrets adjacency, telemetry masking, transport boundaries, and processor handoff posture.",
        "decisionType": "security_and_transport_review",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "privacy_control_traceability.json",
            "privacy_data_flow_inventory.json",
        ],
        "noSelfApprovalBoundary": "Cannot downgrade raw event or debug exposure risk without runtime evidence of masking and disclosure fences.",
        "escalationTargetRole": "ROLE_GOVERNANCE_RELEASE_APPROVER",
        "prerequisiteGapRefs": [],
        "sourceBlueprintRefs": [
            "blueprint/phase-2-identity-and-echoes.md#Raw identity values are never emitted on the bus",
            "data/analysis/runtime_topology_manifest.json#trust_zone_boundaries",
        ],
        "notes": "Security review is required whenever telemetry or adapter boundaries change.",
    },
    {
        "roleId": "ROLE_GOVERNANCE_RELEASE_APPROVER",
        "roleTitle": "Governance and Release Approver",
        "reviewEventId": "PRIV_REVIEW_RELEASE_CANDIDATE_AND_ACTUAL_UPGRADE",
        "responsibility": "Owns the point where mock-now bounded risks can become accepted_pending_signoff or actual-production gated obligations.",
        "decisionType": "release_and_governance_gate",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "privacy_control_traceability.json",
            "126_mock_now_vs_actual_privacy_strategy.md",
            "126_privacy_change_triggers_and_dpia_rerun_rules.md",
        ],
        "noSelfApprovalBoundary": "No release, onboarding, or actual-production promotion may rely on a self-authored privacy checklist alone.",
        "escalationTargetRole": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "prerequisiteGapRefs": [
            "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
        ],
        "sourceBlueprintRefs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseApprovalFreeze",
            "blueprint/phase-9-the-assurance-ledger.md#AssuranceSurfaceRuntimeBinding",
        ],
        "notes": "This role closes neither controller assignment nor processor evidence gaps by assertion; those remain explicit backlog rows.",
    },
    {
        "roleId": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "roleTitle": "Service Owner / Operations Reviewer",
        "reviewEventId": "PRIV_REVIEW_INCIDENT_AND_BREAK_GLASS",
        "responsibility": "Checks support replay, incident, fallback review, and break-glass routes against real operational necessity.",
        "decisionType": "operational_necessity_review",
        "mockOrActualState": MIXED_TRACK,
        "requiredInputs": [
            "privacy_data_flow_inventory.json",
            "privacy_control_traceability.json",
        ],
        "noSelfApprovalBoundary": "Operational convenience cannot widen minimum-necessary ceilings or turn replay into ordinary read access.",
        "escalationTargetRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "prerequisiteGapRefs": [],
        "sourceBlueprintRefs": [
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "data/analysis/break_glass_scope_rules.json#rules",
        ],
        "notes": "This role owns practical break-glass burden and expiry evidence.",
    },
]


def control_item(
    control_id: str,
    title: str,
    layer: str,
    category: str,
    summary: str,
    source_refs: list[str],
    current_evidence_refs: list[str],
    actual_upgrade_refs: list[str],
    owner_role: str,
    forbidden_shortcuts: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "controlId": control_id,
        "controlTitle": title,
        "controlLayer": layer,
        "controlCategory": category,
        "summary": summary,
        "sourceBlueprintRefs": source_refs,
        "currentEvidenceRefs": current_evidence_refs,
        "actualProductionUpgradeRefs": actual_upgrade_refs,
        "ownerRole": owner_role,
        "forbiddenAuthorityShortcuts": forbidden_shortcuts or [],
    }


CONTROL_CATALOG = [
    control_item(
        "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
        "VisibilityProjectionPolicy and runtime-bound audience ceilings",
        "platform_runtime_publication",
        "visibility_and_minimum_necessary",
        "All materialized detail stays bound to the current VisibilityProjectionPolicy, AudienceSurfaceRuntimeBinding, and route scope requirements; no later shell or replay layer may widen audience scope after projection.",
        [
            "blueprint/phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "data/analysis/route_to_scope_requirements.csv",
            "data/analysis/acting_scope_tuple_matrix.csv",
        ],
        [
            "data/analysis/route_to_scope_requirements.csv#RSR_054_GWS_HUB_QUEUE_RF_HUB_QUEUE",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_STAFF_SINGLE_ORG",
            "data/analysis/gateway_surface_manifest.json#route_publications",
        ],
        [
            "docs/assurance/125_clinical_signoff_matrix.md",
            "live_controller_processor_roster",
        ],
        "ROLE_ENGINEERING_LEAD",
        ["ui collapse", "decorative shell behavior"],
    ),
    control_item(
        "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
        "Classification ceilings and minimum-necessary contracts",
        "platform_runtime_publication",
        "visibility_and_minimum_necessary",
        "Data-classification ceilings decide preview, detail, artifact, telemetry, log, and replay exposure classes before a surface can render or export anything.",
        [
            "data/analysis/data_classification_matrix.csv",
            "blueprint/blueprint-init.md#Purpose-of-use and break-glass",
        ],
        [
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_AUDIT_REPLAY_BUNDLE",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_DERIVATION_PACKAGE",
        ],
        [
            "retention_and_transfer_schedule",
            "controller_processor_assignment_matrix",
        ],
        "ROLE_PRIVACY_LEAD_PLACEHOLDER",
    ),
    control_item(
        "CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1",
        "ScopedMutationGate and ActingScopeTuple enforcement",
        "platform_runtime_publication",
        "scope_and_authorization",
        "Every consequential mutation or deep read must bind one current ActingScopeTuple, purpose-of-use row, and scoped mutation decision rather than ambient session state.",
        [
            "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
            "data/analysis/acting_scope_tuple_matrix.csv",
        ],
        [
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_PATIENT_AUTHENTICATED",
            "data/analysis/acting_scope_tuple_matrix.csv#ACT_STAFF_SINGLE_ORG",
            "data/analysis/scoped_mutation_gate_decision_table.csv",
        ],
        [
            "docs/assurance/125_clinical_signoff_matrix.md",
            "named_break_glass_approver_roster",
        ],
        "ROLE_ENGINEERING_LEAD",
        ["local cache", "route change"],
    ),
    control_item(
        "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        "Route intent, runtime binding, and release parity checks",
        "platform_runtime_publication",
        "release_and_runtime_posture",
        "Writable or detailed posture depends on current route intent, runtime publication, and release parity tuples, not on locally remembered UI calmness.",
        [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "data/analysis/gateway_surface_manifest.json#route_publications",
            "data/analysis/runtime_topology_manifest.json#service_runtime_bindings",
        ],
        [
            "data/analysis/gateway_surface_manifest.json#route_publications",
            "data/analysis/runtime_topology_manifest.json#service_runtime_bindings",
            "data/analysis/release_publication_parity_records.json",
        ],
        [
            "release_approval_freeze_with_privacy_attestation",
        ],
        "ROLE_GOVERNANCE_RELEASE_APPROVER",
        ["decorative shell behavior"],
    ),
    control_item(
        "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
        "UI telemetry disclosure fence and redaction vocabulary",
        "ui_runtime_publication",
        "telemetry_and_browser_visibility",
        "Browser-visible events, transitions, and diagnostics emit only the PHI-safe vocabulary allowed by UITelemetryDisclosureFence and the published redaction rules.",
        [
            "blueprint/platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "data/analysis/ui_telemetry_vocabulary.json#vocabularyEntries",
            "data/analysis/telemetry_redaction_policy.json#rules",
        ],
        [
            "data/analysis/ui_telemetry_vocabulary.json#summary",
            "data/analysis/telemetry_redaction_policy.json#event_family_policies",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_UI_TELEMETRY_WORKSPACE",
        ],
        [
            "browser_debug_tooling_review_pack",
            "production_telemetry_retention_evidence",
        ],
        "ROLE_SECURITY_LEAD",
    ),
    control_item(
        "CTRL_126_CANONICAL_EVENT_MASKING_V1",
        "Canonical event masking and log reference-only posture",
        "platform_runtime_publication",
        "telemetry_and_browser_visibility",
        "Raw identity values, phone numbers, and contact claims do not cross the internal event spine or structured logs; events carry references, hashes, or masked forms only.",
        [
            "blueprint/phase-2-identity-and-echoes.md#Raw identity values are never emitted on the bus",
            "data/analysis/audit_event_disclosure_matrix.csv",
        ],
        [
            "data/analysis/audit_event_disclosure_matrix.csv#EV_CANONICAL_EVENT_BUS",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_STRUCTURED_LOG_RUNTIME",
        ],
        [
            "production_log_retention_and_redaction_pack",
        ],
        "ROLE_SECURITY_LEAD",
    ),
    control_item(
        "CTRL_126_CONTACT_ROUTE_SNAPSHOT_REPAIR_V1",
        "ContactRouteSnapshot repair and governed communication previews",
        "platform_runtime_publication",
        "communications_and_reachability",
        "Callbacks, notifications, and resends stay bound to current contact-route snapshots and repair journeys; stale previews or bounces may not silently reuse outdated destinations.",
        [
            "data/analysis/contact_route_snapshot_manifest.json#snapshots",
            "data/analysis/contact_route_snapshot_manifest.json#repair_journeys",
            "blueprint/callback-and-clinician-messaging-loop.md",
        ],
        [
            "data/analysis/contact_route_snapshot_manifest.json#summary",
        ],
        [
            "live_notification_processor_roster",
            "telephony_transcription_supplier_register",
        ],
        "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
    ),
    control_item(
        "CTRL_126_BREAK_GLASS_SCOPE_ENVELOPE_V1",
        "Break-glass scope envelope, expiry, and review burden",
        "operational_governance_review",
        "break_glass_and_investigation",
        "Break-glass is a distinct purpose-of-use and governed scope envelope with expiry, masking, export limits, and review burden; it is never a role flag or convenience toggle.",
        [
            "data/analysis/break_glass_scope_rules.json#rules",
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
        ],
        [
            "data/analysis/break_glass_scope_rules.json#rules",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_AUDIT_REPLAY_BUNDLE",
        ],
        [
            "named_break_glass_approver_roster",
            "deployer_break_glass_policy_pack",
        ],
        "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
    ),
    control_item(
        "CTRL_126_GATEWAY_ADAPTER_BOUNDARY_V1",
        "Gateway surface, trust-boundary, and adapter disclosure control",
        "platform_runtime_publication",
        "cross_org_and_external_adapter",
        "Cross-organisation and external-adapter flows may disclose only through published gateway surfaces, trust-zone boundaries, and capability-scoped downstream contracts.",
        [
            "data/analysis/gateway_surface_manifest.json#boundary_rows",
            "data/analysis/runtime_topology_manifest.json#trust_zone_boundaries",
            "prompt/126.md#cross-organisation and external-adapter disclosure risk",
        ],
        [
            "data/analysis/gateway_surface_manifest.json#boundary_rows",
            "data/analysis/runtime_topology_manifest.json#blocked_crossings",
            "data/assurance/im1_artifact_index.json#conversion_workflow",
        ],
        [
            "live_processor_and_subprocessor_register",
            "provider_contract_and_transfer_evidence",
        ],
        "ROLE_SECURITY_LEAD",
    ),
    control_item(
        "CTRL_126_FROZEN_BUNDLE_AND_EXPORT_GOVERNANCE_V1",
        "Frozen bundle, legal-hold, replay, and export governance",
        "operational_governance_review",
        "break_glass_and_investigation",
        "Frozen bundles, legal holds, fallback review, replay, and governed export stay read-only, scope-bound, and audit-witnessed rather than becoming an informal side channel.",
        [
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_ASSURANCE_PACK",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_AUDIT_REPLAY_BUNDLE",
            "blueprint/phase-9-the-assurance-ledger.md#Legal hold and evidence graph",
        ],
        [
            "data/analysis/audit_record_schema.json",
            "data/analysis/audit_event_disclosure_matrix.csv",
        ],
        [
            "deployer_legal_hold_policy",
            "named_investigation_reviewer_roster",
        ],
        "ROLE_GOVERNANCE_RELEASE_APPROVER",
    ),
    control_item(
        "CTRL_126_EMBEDDED_CHANNEL_PRIVACY_POSTURE_V1",
        "Embedded and constrained-browser privacy posture",
        "ui_runtime_publication",
        "embedded_and_constrained_browser",
        "Embedded and constrained-browser channels stay bound to their own compatibility and artifact-mode truth so they cannot inherit standalone browser detail, deep-link, or telemetry behavior.",
        [
            "blueprint/phase-7-inside-the-nhs-app.md",
            "blueprint/platform-frontend-blueprint.md#Artifact mode truth",
            "data/analysis/gateway_surface_manifest.json#route_publications",
        ],
        [
            "data/analysis/gateway_surface_manifest.json#route_publications",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_UI_TELEMETRY_EMBEDDED",
        ],
        [
            "embedded_channel_manifest_attestation",
            "host_bridge_processor_assignment",
        ],
        "ROLE_ENGINEERING_LEAD",
    ),
    control_item(
        "CTRL_126_ASSISTIVE_PROVENANCE_AND_RERUN_V1",
        "Assistive provenance, shadow-mode limits, and DPIA rerun triggers",
        "operational_governance_review",
        "assistive_and_model_governance",
        "Assistive and model-backed features stay optional, provenance-carrying, shadow-mode-first, and explicitly rerun the DPIA backlog when context, prompt scope, rationale visibility, or draft insertion changes.",
        [
            "blueprint/phase-8-the-assistive-layer.md#Any live assistive artifact must materialize under VisibilityProjectionPolicy",
            "prompt/126.md#assistive and model-backed privacy risk",
        ],
        [
            "docs/architecture/93_edge_correlation_spine_explorer.html",
            "data/analysis/ui_telemetry_vocabulary.json#vocabularyEntries",
        ],
        [
            "assistive_capability_trust_envelope_register",
            "model_supplier_and_subprocessor_register",
            "formal_dpia_rerun_record",
        ],
        "ROLE_PRIVACY_LEAD_PLACEHOLDER",
    ),
]

CONTROL_BY_ID = {row["controlId"]: row for row in CONTROL_CATALOG}
ROLE_BY_ID = {row["roleId"]: row for row in ROLE_CATALOG}
REVIEW_TRIGGER_BY_ID = {row["reviewTriggerId"]: row for row in REVIEW_TRIGGER_CATALOG}

PREREQUISITE_GAPS = [
    {
        "gapId": "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
        "title": "Clinical-risk cadence and signoff outputs from par_125 are not yet published",
        "status": "blocked_on_parallel_task",
        "closureTarget": "par_125",
        "ownerRole": "ROLE_CLINICAL_SAFETY_LEAD",
        "impact": (
            "Formal actual-production privacy acceptance cannot progress beyond accepted_pending_signoff "
            "because the named review cadence, no-self-approval graph, and gate requirements are still pending."
        ),
        "missingArtifacts": [str(path.relative_to(ROOT)) for path in EXPECTED_PAR_125_OUTPUTS if not path.exists()],
        "workaround": (
            "Keep the privacy threat model and DPIA backlog live now, but preserve provisional reviewers and "
            "explicitly block any claim that actual-production privacy signoff is complete."
        ),
        "sourceBlueprintRefs": [
            "prompt/125.md",
            "tools/assurance/validate_clinical_signoff_matrix.py",
            "prompt/126.md#Actual_production_strategy_later",
        ],
    }
]

GAP_RESOLUTIONS = [
    {
        "gapResolutionId": "GAP_RESOLUTION_PRIVACY_THREAT_SUPPORT_REPLAY_DRIFT_V1",
        "summary": "The corpus treats replay and investigation scope as control law rather than as a standalone privacy threat sentence, so this pack publishes a bounded threat row for excess investigation access and support replay drift.",
        "sourceBlueprintRefs": [
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "blueprint/forensic-audit-findings.md#Finding 95",
        ],
    },
    {
        "gapResolutionId": "GAP_RESOLUTION_PRIVACY_THREAT_TELEMETRY_DISCLOSURE_V1",
        "summary": "Telemetry disclosure posture existed across route, shell, and observability documents; this pack joins it into explicit threat and control rows so event privacy is machine-readable.",
        "sourceBlueprintRefs": [
            "blueprint/platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "data/analysis/audit_event_disclosure_matrix.csv",
        ],
    },
    {
        "gapResolutionId": "GAP_RESOLUTION_PRIVACY_THREAT_ASSISTIVE_RERUN_V1",
        "summary": "Assistive privacy reruns were described as change-control obligations; this pack turns them into explicit threat, control, and backlog rows now.",
        "sourceBlueprintRefs": [
            "blueprint/phase-8-the-assistive-layer.md#DPIA rerun and related change-control triggers",
            "prompt/126.md#assistive and model-backed privacy risk",
        ],
    },
]

PROCESSING_ACTIVITIES = [
    {
        "flowId": "FLOW_126_INGRESS_INTAKE",
        "activityFamily": "public_intake_and_draft_capture",
        "processingDomain": "intake_capture",
        "processingActivity": "Public intake draft capture, evidence upload quarantine, and fallback review handoff.",
        "canonicalObjectRefs": ["SubmissionEnvelope", "EvidenceCaptureBundle", "FallbackReviewCase"],
        "dataSubjectClasses": ["prospective_patient", "patient_delegate"],
        "dataClasses": ["free_text_narrative", "attachment_binary", "contact_preference", "draft_metadata"],
        "entrySurfaces": ["surf_patient_intake_web", "rf_intake_self_service"],
        "channelProfiles": ["browser_public"],
        "audienceTiers": ["patient_public"],
        "actorScopes": ["ACT_PATIENT_PUBLIC_INTAKE"],
        "purposesOfUse": ["public_status"],
        "storageOrTransitBoundaries": [
            "browser_ephemeral_to_submission_envelope",
            "submission_envelope_to_quarantine_and_object_storage",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-001"],
        "controlRefs": [
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_DERIVATION_PACKAGE",
            "data/analysis/gateway_surface_manifest.json#grp::rf_intake_self_service",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#SubmissionEnvelope",
            "blueprint/phase-1-the-red-flag-gate.md#Upload quarantine and fallback review",
        ],
        "notes": "The mock estate proves envelope and quarantine behavior now, but actual processor and retention evidence still need production assignments.",
    },
    {
        "flowId": "FLOW_126_IDENTITY_AND_SESSION",
        "activityFamily": "authenticated_patient_portal_and_secure_links",
        "processingDomain": "identity_session_bridge",
        "processingActivity": "Secure-link redemption, local session upgrade, NHS login return handling, and wrong-patient repair.",
        "canonicalObjectRefs": ["AccessGrant", "RouteIntentBinding", "IdentityRepairFreezeRecord"],
        "dataSubjectClasses": ["patient"],
        "dataClasses": ["identity_claim_reference", "session_token_material", "grant_descriptor", "masked_contact_claim"],
        "entrySurfaces": ["rf_patient_secure_link_recovery", "rf_patient_home", "rf_patient_requests"],
        "channelProfiles": ["browser_secure_link", "browser_authenticated"],
        "audienceTiers": ["patient_grant_scoped", "patient_authenticated"],
        "actorScopes": ["ACT_PATIENT_GRANT_RECOVERY", "ACT_PATIENT_AUTHENTICATED"],
        "purposesOfUse": ["secure_link_recovery", "authenticated_self_service"],
        "storageOrTransitBoundaries": [
            "opaque_signed_link_to_gateway",
            "gateway_to_access_grant_service_and_local_session",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-002"],
        "controlRefs": [
            "CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/access_grant_runtime_tuple_manifest.json#runtime_tuples",
            "data/analysis/nhs_login_scope_claim_matrix.csv",
            "data/assurance/124_nhs_login_application_artifact_index.json#artifacts",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-2-identity-and-echoes.md#AccessGrant",
            "blueprint/phase-2-identity-and-echoes.md#IdentityRepairFreezeRecord",
        ],
        "notes": "Current evidence is simulator-first and honest about local session ceilings; actual production login onboarding remains a later upgrade path.",
    },
    {
        "flowId": "FLOW_126_VISIBILITY_AND_AUDIENCE",
        "activityFamily": "internal_staff_workspace_and_support_replay",
        "processingDomain": "audience_visibility_projection",
        "processingActivity": "Projection materialization across patient, staff, support, operations, hub, governance, and pharmacy shells.",
        "canonicalObjectRefs": ["VisibilityProjectionPolicy", "AudienceSurfaceRuntimeBinding", "SupportReplayRestoreSettlement"],
        "dataSubjectClasses": ["patient", "staff_member"],
        "dataClasses": ["task_summary", "masked_subject_ref", "artifact_descriptor", "governed_preview_detail"],
        "entrySurfaces": ["rf_staff_workspace", "rf_support_workspace", "rf_operations_board", "rf_hub_queue", "rf_governance_shell", "rf_pharmacy_shell"],
        "channelProfiles": ["browser_workspace", "browser_support", "browser_ops"],
        "audienceTiers": ["origin_practice_clinical", "support", "operations_control", "hub_desk", "governance_review", "servicing_site"],
        "actorScopes": ["ACT_STAFF_SINGLE_ORG", "ACT_OPERATIONS_WATCH", "ACT_HUB_CROSS_ORG"],
        "purposesOfUse": ["operational_care_delivery", "support_recovery", "operational_control", "governance_review"],
        "storageOrTransitBoundaries": [
            "projection_read_models_to_governed_shells",
            "support_replay_bundle_to_investigation_scope_envelope",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-003", "PRIV-126-004"],
        "controlRefs": [
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
            "CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/route_to_scope_requirements.csv",
            "data/analysis/acting_scope_tuple_matrix.csv",
            "data/analysis/gateway_surface_manifest.json#route_publications",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/platform-frontend-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
        "notes": "Support replay and cross-org surfaces remain privacy-critical because continuity and calm UI do not authorize deeper reads.",
    },
    {
        "flowId": "FLOW_126_COMMUNICATIONS_AND_REACHABILITY",
        "activityFamily": "message_callback_notification_and_contact_route_repairs",
        "processingDomain": "communications_and_reachability",
        "processingActivity": "Callback, notification, bounce, resend, and transcription handling across patient and staff journeys.",
        "canonicalObjectRefs": ["ContactRouteSnapshot", "ReachabilityAssessment", "CallbackCase"],
        "dataSubjectClasses": ["patient"],
        "dataClasses": ["contact_route_descriptor", "message_preview", "transcript_fragment", "reachability_status"],
        "entrySurfaces": ["rf_patient_messages", "rf_patient_secure_link_recovery", "rf_staff_workspace"],
        "channelProfiles": ["browser_authenticated", "telephony", "notification_worker"],
        "audienceTiers": ["patient_authenticated", "support", "origin_practice_operations"],
        "actorScopes": ["ACT_PATIENT_AUTHENTICATED", "ACT_STAFF_SINGLE_ORG"],
        "purposesOfUse": ["authenticated_self_service", "support_recovery", "operational_care_delivery"],
        "storageOrTransitBoundaries": [
            "contact_route_snapshot_store_to_notification_worker",
            "telephony_transcription_to_review_bundle",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-006"],
        "controlRefs": [
            "CTRL_126_CONTACT_ROUTE_SNAPSHOT_REPAIR_V1",
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/contact_route_snapshot_manifest.json#summary",
            "data/analysis/contact_route_snapshot_manifest.json#repair_journeys",
        ],
        "sourceBlueprintRefs": [
            "blueprint/callback-and-clinician-messaging-loop.md",
            "blueprint/phase-2-identity-and-echoes.md#Telephony-specific privacy-safe evidence handling",
        ],
        "notes": "The mock estate proves bounded previews and repair journeys now; live telephony and notification processor details remain pending.",
    },
    {
        "flowId": "FLOW_126_EXTERNAL_ADAPTERS",
        "activityFamily": "local_booking_network_coordination_and_pharmacy_loops",
        "processingDomain": "external_adapter_exchange",
        "processingActivity": "Local booking, network coordination, pharmacy, telephony, MESH, and IM1 adapter exchanges.",
        "canonicalObjectRefs": ["GatewayBffSurface", "AdapterContractProfile", "ExternalAssuranceObligation"],
        "dataSubjectClasses": ["patient"],
        "dataClasses": ["appointment_descriptor", "organisation_routing_ref", "pharmacy_handoff_descriptor", "adapter_payload_reference"],
        "entrySurfaces": ["rf_patient_appointments", "rf_hub_case_management", "rf_pharmacy_shell"],
        "channelProfiles": ["browser_authenticated", "internal_adapter", "mesh_like_transport"],
        "audienceTiers": ["patient_authenticated", "hub_desk", "servicing_site", "pharmacy_console"],
        "actorScopes": ["ACT_PATIENT_AUTHENTICATED", "ACT_HUB_CROSS_ORG", "ACT_STAFF_SINGLE_ORG"],
        "purposesOfUse": ["authenticated_self_service", "operational_care_delivery", "coordination"],
        "storageOrTransitBoundaries": [
            "gateway_surface_to_application_core",
            "application_core_to_external_adapter_boundary",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-007"],
        "controlRefs": [
            "CTRL_126_GATEWAY_ADAPTER_BOUNDARY_V1",
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/gateway_surface_manifest.json#boundary_rows",
            "data/analysis/runtime_topology_manifest.json#trust_zone_boundaries",
            "data/assurance/im1_artifact_index.json#artifacts",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-4-the-booking-engine.md",
            "blueprint/phase-5-the-network-horizon.md",
            "blueprint/phase-6-the-pharmacy-loop.md",
        ],
        "notes": "Current proofs cover bounded mock exchanges and trust boundaries, while live controller or processor and transfer evidence remain pending.",
    },
    {
        "flowId": "FLOW_126_OBSERVABILITY_AND_AUDIT",
        "activityFamily": "audit_observability_and_privacy_safe_telemetry",
        "processingDomain": "observability_and_audit",
        "processingActivity": "Canonical events, UI telemetry, structured logs, diagnostics, and immutable audit links.",
        "canonicalObjectRefs": ["CanonicalEventEnvelope", "UITelemetryDisclosureFence", "AuditRecord"],
        "dataSubjectClasses": ["patient", "staff_member", "operator"],
        "dataClasses": ["event_descriptor", "masked_subject_ref", "route_descriptor", "audit_link"],
        "entrySurfaces": ["rf_patient_home", "rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
        "channelProfiles": ["browser", "internal_event_bus", "worker_log"],
        "audienceTiers": ["patient_authenticated", "support", "operations_control", "governance_review"],
        "actorScopes": ["ACT_PATIENT_AUTHENTICATED", "ACT_STAFF_SINGLE_ORG", "ACT_OPERATIONS_WATCH"],
        "purposesOfUse": ["authenticated_self_service", "support_recovery", "operational_control", "governance_review"],
        "storageOrTransitBoundaries": [
            "ui_to_gateway_observation",
            "runtime_service_to_event_spine",
            "event_spine_to_audit_ledger",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-005"],
        "controlRefs": [
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/audit_event_disclosure_matrix.csv",
            "data/analysis/ui_telemetry_vocabulary.json#summary",
            "data/analysis/telemetry_redaction_policy.json#event_family_policies",
        ],
        "sourceBlueprintRefs": [
            "blueprint/platform-frontend-blueprint.md#UIEventVisibilityProfile",
            "blueprint/phase-2-identity-and-echoes.md#CanonicalEventEnvelope",
            "blueprint/phase-9-the-assurance-ledger.md#Immutable audit",
        ],
        "notes": "The repo already publishes the vocabulary and ceilings; this pack joins them into a DPIA-ready threat model.",
    },
    {
        "flowId": "FLOW_126_FROZEN_AND_INVESTIGATION",
        "activityFamily": "frozen_bundles_evidence_quarantine_and_fallback_review",
        "processingDomain": "frozen_evidence_and_investigation",
        "processingActivity": "Frozen bundle handling, legal hold, fallback review, support replay, and investigation exports.",
        "canonicalObjectRefs": ["ReleaseApprovalFreeze", "FallbackReviewCase", "BreakGlassReviewRecord", "InvestigationScopeEnvelope"],
        "dataSubjectClasses": ["patient", "staff_member"],
        "dataClasses": ["frozen_artifact_bundle", "investigation_note", "masked_replay_detail", "audit_export"],
        "entrySurfaces": ["rf_support_workspace", "rf_governance_shell", "rf_operations_drilldown"],
        "channelProfiles": ["browser_support", "browser_governance", "governed_export"],
        "audienceTiers": ["support", "governance_review", "operations_control"],
        "actorScopes": ["ACT_STAFF_SINGLE_ORG", "ACT_OPERATIONS_WATCH", "ACT_GOVERNANCE_PLATFORM"],
        "purposesOfUse": ["support_recovery", "investigation_break_glass", "governance_review"],
        "storageOrTransitBoundaries": [
            "evidence_store_to_investigation_scope_envelope",
            "investigation_scope_envelope_to_governed_export",
        ],
        "mockOrActualState": MIXED_TRACK,
        "threatRefs": ["PRIV-126-008"],
        "controlRefs": [
            "CTRL_126_BREAK_GLASS_SCOPE_ENVELOPE_V1",
            "CTRL_126_FROZEN_BUNDLE_AND_EXPORT_GOVERNANCE_V1",
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/break_glass_scope_rules.json#rules",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_AUDIT_REPLAY_BUNDLE",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "prompt/126.md#frozen bundles, evidence quarantine, and fallback review",
        ],
        "notes": "Break-glass and replay are treated as a separate privacy control family, not a hidden support privilege.",
    },
    {
        "flowId": "FLOW_126_EMBEDDED_AND_CONSTRAINED",
        "activityFamily": "embedded_or_constrained_browser_paths",
        "processingDomain": "embedded_and_constrained_browser",
        "processingActivity": "Embedded bridge, constrained browser handoff, artifact preview, deep links, and hosted channel telemetry.",
        "canonicalObjectRefs": ["AudienceSurfaceRuntimeBinding", "ArtifactPresentationShell", "UITelemetryDisclosureFence"],
        "dataSubjectClasses": ["patient"],
        "dataClasses": ["route_descriptor", "artifact_mode_descriptor", "masked_subject_ref", "host_compatibility_state"],
        "entrySurfaces": ["rf_patient_home", "rf_patient_requests", "rf_patient_appointments"],
        "channelProfiles": ["embedded_patient_channel", "constrained_browser"],
        "audienceTiers": ["patient_embedded_authenticated"],
        "actorScopes": ["ACT_PATIENT_EMBEDDED"],
        "purposesOfUse": ["embedded_authenticated"],
        "storageOrTransitBoundaries": [
            "embedded_host_to_gateway_surface",
            "artifact_presentation_shell_to_governed_download_or_handoff",
        ],
        "mockOrActualState": ACTUAL_TRACK,
        "threatRefs": ["PRIV-126-009"],
        "controlRefs": [
            "CTRL_126_EMBEDDED_CHANNEL_PRIVACY_POSTURE_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "currentEvidenceRefs": [
            "data/analysis/gateway_surface_manifest.json#route_publications",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_UI_TELEMETRY_EMBEDDED",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-7-inside-the-nhs-app.md",
            "prompt/126.md#embedded or constrained-browser privacy drift",
        ],
        "notes": "The compatibility seam exists now, but actual host and processor evidence are still later-path obligations.",
    },
    {
        "flowId": "FLOW_126_ASSISTIVE_AND_MODEL",
        "activityFamily": "assistive_shadow_mode_and_visible_assistance",
        "processingDomain": "assistive_and_model_governance",
        "processingActivity": "Assistive shadow mode, visible assistance, provenance capture, rationale rendering, and draft insertion controls.",
        "canonicalObjectRefs": ["AssistiveSurfaceBinding", "AssistiveCapabilityTrustEnvelope", "ProvenanceRecord"],
        "dataSubjectClasses": ["patient", "staff_member"],
        "dataClasses": ["prompt_context_descriptor", "rationale_fragment", "candidate_hash", "provenance_pointer"],
        "entrySurfaces": ["rf_staff_workspace", "rf_support_workspace", "rf_governance_shell"],
        "channelProfiles": ["browser_workspace", "sidecar_assistive_service"],
        "audienceTiers": ["origin_practice_clinical", "support", "governance_review", "assistive_adjunct"],
        "actorScopes": ["ACT_STAFF_SINGLE_ORG", "ACT_GOVERNANCE_PLATFORM"],
        "purposesOfUse": ["operational_care_delivery", "support_recovery", "assistive_companion", "governance_review"],
        "storageOrTransitBoundaries": [
            "workspace_context_to_assistive_shadow_buffer",
            "assistive_output_to_provenance_and_review_store",
        ],
        "mockOrActualState": ACTUAL_TRACK,
        "threatRefs": ["PRIV-126-010"],
        "controlRefs": [
            "CTRL_126_ASSISTIVE_PROVENANCE_AND_RERUN_V1",
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
        ],
        "currentEvidenceRefs": [
            "docs/architecture/93_edge_correlation_spine_explorer.html",
            "data/analysis/ui_telemetry_vocabulary.json#vocabularyEntries",
        ],
        "sourceBlueprintRefs": [
            "blueprint/phase-8-the-assistive-layer.md",
            "prompt/126.md#assistive and model-backed privacy risk",
        ],
        "notes": "Assistive rollout is planned rather than live, so this flow is explicitly actual_pending and rerun-trigger heavy.",
    },
]

BACKLOG_ITEMS = [
    {
        "backlogId": "DPIA-126-001",
        "architecturalSeam": "intake_capture_and_attachment_handling",
        "title": "Lock intake evidence minimization, unsafe attachment handling, and fallback review exposure ceilings.",
        "priority": "high",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "mock_traceable_actual_retention_pending",
        "triggeringProcessingActivities": ["FLOW_126_INGRESS_INTAKE"],
        "threatRefs": ["PRIV-126-001"],
        "ownerRole": "ROLE_PRODUCT_OWNER",
        "reviewTriggerRefs": ["RTR_126_SPRINT_PRIVACY_DELTA"],
        "prerequisiteGapRefs": [],
        "nextStep": "Publish named retention periods, live malware or quarantine processor assignments, and fallback-review redaction acceptance criteria.",
        "sourceBlueprintRefs": [
            "prompt/126.md#intake evidence over-collection",
            "blueprint/phase-1-the-red-flag-gate.md",
        ],
        "notes": "Do not convert this item to production-ready until live retention and processor evidence exists.",
    },
    {
        "backlogId": "DPIA-126-002",
        "architecturalSeam": "identity_session_and_subject_binding",
        "title": "Complete controller-grade review of secure-link, local session, NHS login, and wrong-patient repair disclosures.",
        "priority": "high",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "mock_traceable_actual_onboarding_pending",
        "triggeringProcessingActivities": ["FLOW_126_IDENTITY_AND_SESSION"],
        "threatRefs": ["PRIV-126-002"],
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_IDENTITY_OR_SECURE_LINK_SCOPE_DELTA", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "prerequisiteGapRefs": [],
        "nextStep": "Preserve the current threat IDs while adding live NHS login, link issuance, and identity repair retention and processor evidence later.",
        "sourceBlueprintRefs": [
            "prompt/126.md#identity and session leakage",
            "data/assurance/124_nhs_login_application_artifact_index.json#artifacts",
        ],
        "notes": "Current evidence is useful now but remains honest about mock-local onboarding boundaries.",
    },
    {
        "backlogId": "DPIA-126-003",
        "architecturalSeam": "audience_visibility_and_projection",
        "title": "Confirm audience-tier separation, support replay scope, and projection freshness limits across all shells.",
        "priority": "high",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "runtime_contracts_published_formal_signoff_pending",
        "triggeringProcessingActivities": ["FLOW_126_VISIBILITY_AND_AUDIENCE"],
        "threatRefs": ["PRIV-126-003", "PRIV-126-004"],
        "ownerRole": "ROLE_ENGINEERING_LEAD",
        "reviewTriggerRefs": ["RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE", "RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA"],
        "prerequisiteGapRefs": ["PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING"],
        "nextStep": "Carry the current runtime and route binding laws into the formal signoff graph once par_125 is published.",
        "sourceBlueprintRefs": [
            "prompt/126.md#audience visibility and projection seam",
            "blueprint/staff-operations-and-support-blueprint.md",
        ],
        "notes": "The control plane exists now, but actual production approval is still blocked on the missing signoff matrix.",
    },
    {
        "backlogId": "DPIA-126-004",
        "architecturalSeam": "telemetry_observability_and_debug",
        "title": "Freeze telemetry, event, log, and debug output to PHI-safe vocabularies and explicit redaction evidence.",
        "priority": "high",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "mock_traceable_actual_monitoring_pending",
        "triggeringProcessingActivities": ["FLOW_126_OBSERVABILITY_AND_AUDIT"],
        "threatRefs": ["PRIV-126-005"],
        "ownerRole": "ROLE_SECURITY_LEAD",
        "reviewTriggerRefs": ["RTR_126_TELEMETRY_SCHEMA_OR_DEBUG_SCOPE_DELTA", "RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE"],
        "prerequisiteGapRefs": [],
        "nextStep": "Attach live monitoring scope, retention evidence, and debug-tooling controls without changing the threat or control identifiers.",
        "sourceBlueprintRefs": [
            "prompt/126.md#telemetry, observability, and debug seam",
            "data/analysis/audit_event_disclosure_matrix.csv",
        ],
        "notes": "This backlog item exists because privacy-safe telemetry was previously implied but not joined into one DPIA-ready queue.",
    },
    {
        "backlogId": "DPIA-126-005",
        "architecturalSeam": "communications_and_reachability",
        "title": "Document live communication processors, preview limits, bounce repair rules, and transcription disclosure ceilings.",
        "priority": "high",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "mock_traceable_actual_supplier_assignment_pending",
        "triggeringProcessingActivities": ["FLOW_126_COMMUNICATIONS_AND_REACHABILITY"],
        "threatRefs": ["PRIV-126-006"],
        "ownerRole": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "reviewTriggerRefs": ["RTR_126_SPRINT_PRIVACY_DELTA", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "prerequisiteGapRefs": [],
        "nextStep": "Preserve current repair contracts and add named telephony, notification, and transcription processors later.",
        "sourceBlueprintRefs": [
            "prompt/126.md#message, callback, notification, and contact-route privacy drift",
            "data/analysis/contact_route_snapshot_manifest.json#repair_journeys",
        ],
        "notes": "Supportive preview convenience does not override current contact-route freshness or disclosure ceilings.",
    },
    {
        "backlogId": "DPIA-126-006",
        "architecturalSeam": "external_adapter_and_cross_org_disclosure",
        "title": "Complete controller or processor, transfer, and contractual evidence for cross-organisation and external-adapter disclosures.",
        "priority": "critical",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "mock_traceable_actual_contractual_evidence_missing",
        "triggeringProcessingActivities": ["FLOW_126_EXTERNAL_ADAPTERS"],
        "threatRefs": ["PRIV-126-007"],
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE", "RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE"],
        "prerequisiteGapRefs": ["PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING"],
        "nextStep": "Bind the live provider and sub-processor register, transfer evidence, and contract pack to the existing threat and control IDs.",
        "sourceBlueprintRefs": [
            "prompt/126.md#external adapter / cross-organisation disclosure seam",
            "data/assurance/im1_artifact_index.json#conversion_workflow",
        ],
        "notes": "This is the clearest actual-production backlog seam because live processors are not known yet.",
    },
    {
        "backlogId": "DPIA-126-007",
        "architecturalSeam": "frozen_evidence_and_investigation",
        "title": "Turn break-glass, legal-hold, replay, and export into named privacy approvals with expiry and review evidence.",
        "priority": "critical",
        "mockOrActualState": MIXED_TRACK,
        "currentEvidenceState": "rules_published_named_approver_roster_pending",
        "triggeringProcessingActivities": ["FLOW_126_FROZEN_AND_INVESTIGATION"],
        "threatRefs": ["PRIV-126-008"],
        "ownerRole": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "reviewTriggerRefs": ["RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA"],
        "prerequisiteGapRefs": ["PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING"],
        "nextStep": "Attach named reviewers, expiry evidence, and deployer policy documents while keeping current scope-envelope rules intact.",
        "sourceBlueprintRefs": [
            "prompt/126.md#frozen evidence and investigation seam",
            "data/analysis/break_glass_scope_rules.json#rules",
        ],
        "notes": "Break-glass is now its own DPIA bundle rather than an implicit support-side exception.",
    },
    {
        "backlogId": "DPIA-126-008",
        "architecturalSeam": "embedded_and_constrained_browser",
        "title": "Freeze embedded and constrained-browser handoff posture before any live host integration expands subject-visible detail.",
        "priority": "high",
        "mockOrActualState": ACTUAL_TRACK,
        "currentEvidenceState": "actual_evidence_pending",
        "triggeringProcessingActivities": ["FLOW_126_EMBEDDED_AND_CONSTRAINED"],
        "threatRefs": ["PRIV-126-009"],
        "ownerRole": "ROLE_ENGINEERING_LEAD",
        "reviewTriggerRefs": ["RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "prerequisiteGapRefs": [],
        "nextStep": "Publish live host, bridge, and processor assignments without widening the embedded threat surface identifiers.",
        "sourceBlueprintRefs": [
            "prompt/126.md#embedded or constrained-browser privacy drift",
            "blueprint/phase-7-inside-the-nhs-app.md",
        ],
        "notes": "Current Phase 0 evidence is compatibility-only and should not be read as live deployment approval.",
    },
    {
        "backlogId": "DPIA-126-009",
        "architecturalSeam": "assistive_and_model_governance",
        "title": "Publish the formal DPIA rerun and controller-review bundle for assistive shadow mode, rationale display, and draft insertion.",
        "priority": "critical",
        "mockOrActualState": ACTUAL_TRACK,
        "currentEvidenceState": "actual_evidence_pending",
        "triggeringProcessingActivities": ["FLOW_126_ASSISTIVE_AND_MODEL"],
        "threatRefs": ["PRIV-126-010"],
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_ASSISTIVE_OR_MODEL_DELTA", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "prerequisiteGapRefs": ["PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING"],
        "nextStep": "Do not promote assistive capability beyond shadow-mode planning until provenance, supplier, and rerun evidence exist.",
        "sourceBlueprintRefs": [
            "prompt/126.md#assistive and model-backed privacy risk",
            "blueprint/phase-8-the-assistive-layer.md",
        ],
        "notes": "This row intentionally stays actual_pending because the assistive path is planned rather than live.",
    },
]

BACKLOG_BY_ID = {row["backlogId"]: row for row in BACKLOG_ITEMS}

THREATS = [
    {
        "threatId": "PRIV-126-001",
        "threatFamily": "intake_over_collection_and_attachment_exposure",
        "processingDomain": "intake_capture",
        "processingActivity": "Public intake draft capture, evidence upload quarantine, and fallback review handoff.",
        "dataSubjectClass": "prospective_patient|patient_delegate",
        "dataClass": "free_text_narrative|attachment_binary|contact_preference|draft_metadata",
        "entrySurface": "surf_patient_intake_web|rf_intake_self_service",
        "channelProfile": "browser_public",
        "audienceTier": "patient_public",
        "actorScope": "ACT_PATIENT_PUBLIC_INTAKE",
        "purposeOfUse": "public_status",
        "storageOrTransitBoundary": "browser_ephemeral->submission_envelope->quarantine_and_object_storage",
        "riskScenario": "Intake captures more narrative or attachment detail than the current request path needs, then fallback or recovery states expose broader previews than the governing classification ceiling allows.",
        "sourceBlueprintRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#SubmissionEnvelope",
            "blueprint/phase-1-the-red-flag-gate.md#Upload quarantine and fallback review",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_DERIVATION_PACKAGE",
        ],
        "requiredControls": [
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-001",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "open",
        "ownerRole": "ROLE_PRODUCT_OWNER",
        "reviewTriggerRefs": ["RTR_126_SPRINT_PRIVACY_DELTA"],
        "notes": "Mock-now evidence is good enough for engineering, but actual retention and processor evidence remain pending.",
    },
    {
        "threatId": "PRIV-126-002",
        "threatFamily": "identity_and_session_leakage",
        "processingDomain": "identity_session_bridge",
        "processingActivity": "Secure-link redemption, local session upgrade, NHS login return handling, and wrong-patient repair.",
        "dataSubjectClass": "patient",
        "dataClass": "identity_claim_reference|session_token_material|grant_descriptor|masked_contact_claim",
        "entrySurface": "rf_patient_secure_link_recovery|rf_patient_home|rf_patient_requests",
        "channelProfile": "browser_secure_link|browser_authenticated",
        "audienceTier": "patient_grant_scoped|patient_authenticated",
        "actorScope": "ACT_PATIENT_GRANT_RECOVERY|ACT_PATIENT_AUTHENTICATED",
        "purposeOfUse": "secure_link_recovery|authenticated_self_service",
        "storageOrTransitBoundary": "opaque_signed_link->gateway->access_grant_service->local_session",
        "riskScenario": "A local session, continuation link, or login bridge exposes the wrong subject, retains stale grant detail, or leaves wrong-patient repair state visible across later renders.",
        "sourceBlueprintRefs": [
            "blueprint/phase-2-identity-and-echoes.md#AccessGrant",
            "blueprint/phase-2-identity-and-echoes.md#IdentityRepairFreezeRecord",
            "data/analysis/access_grant_runtime_tuple_manifest.json#runtime_tuples",
        ],
        "requiredControls": [
            "CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-002",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "bounded",
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_IDENTITY_OR_SECURE_LINK_SCOPE_DELTA", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "notes": "The simulator-first estate proves the control family now, while live onboarding details remain a later evidence upgrade.",
    },
    {
        "threatId": "PRIV-126-003",
        "threatFamily": "stale_or_widened_visibility_projection",
        "processingDomain": "audience_visibility_projection",
        "processingActivity": "Projection materialization across patient, staff, support, operations, hub, governance, and pharmacy shells.",
        "dataSubjectClass": "patient|staff_member",
        "dataClass": "task_summary|masked_subject_ref|artifact_descriptor|governed_preview_detail",
        "entrySurface": "rf_staff_workspace|rf_support_workspace|rf_operations_board|rf_hub_queue|rf_governance_shell|rf_pharmacy_shell",
        "channelProfile": "browser_workspace|browser_support|browser_ops",
        "audienceTier": "origin_practice_clinical|support|operations_control|hub_desk|governance_review|servicing_site",
        "actorScope": "ACT_STAFF_SINGLE_ORG|ACT_OPERATIONS_WATCH|ACT_HUB_CROSS_ORG",
        "purposeOfUse": "operational_care_delivery|support_recovery|operational_control|governance_review",
        "storageOrTransitBoundary": "projection_read_models->governed_shells",
        "riskScenario": "A stale or mismatched VisibilityProjectionPolicy, AudienceSurfaceRuntimeBinding, or replay restore settlement widens detail across subject, organisation, or purpose-of-use boundaries.",
        "sourceBlueprintRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "blueprint/platform-frontend-blueprint.md#AudienceSurfaceRuntimeBinding",
            "blueprint/forensic-audit-findings.md#Finding 95",
        ],
        "requiredControls": [
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-003",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "open",
        "ownerRole": "ROLE_ENGINEERING_LEAD",
        "reviewTriggerRefs": ["RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE"],
        "notes": "This is one of the bounded threat rows derived from control-law and forensic findings rather than from a single named privacy sentence.",
    },
    {
        "threatId": "PRIV-126-004",
        "threatFamily": "audience_overreach_and_acting_scope_failure",
        "processingDomain": "audience_visibility_projection",
        "processingActivity": "Projection materialization across patient, staff, support, operations, hub, governance, and pharmacy shells.",
        "dataSubjectClass": "patient|staff_member",
        "dataClass": "task_summary|masked_subject_ref|artifact_descriptor|governed_preview_detail",
        "entrySurface": "rf_staff_workspace|rf_support_workspace|rf_operations_board|rf_hub_queue|rf_governance_shell|rf_pharmacy_shell",
        "channelProfile": "browser_workspace|browser_support|browser_ops",
        "audienceTier": "origin_practice_clinical|support|operations_control|hub_desk|governance_review|servicing_site",
        "actorScope": "ACT_STAFF_SINGLE_ORG|ACT_OPERATIONS_WATCH|ACT_HUB_CROSS_ORG|ACT_GOVERNANCE_PLATFORM",
        "purposeOfUse": "operational_care_delivery|support_recovery|operational_control|governance_review",
        "storageOrTransitBoundary": "route_scope_tuple->mutation_gate->projection_materialization",
        "riskScenario": "Support, hub, servicing-site, operations, or governance users receive broader subject or organisation coverage because purpose-of-use drift or acting-scope binding is weak or stale.",
        "sourceBlueprintRefs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "data/analysis/acting_scope_tuple_matrix.csv",
            "data/analysis/route_to_scope_requirements.csv",
        ],
        "requiredControls": [
            "CTRL_126_SCOPED_MUTATION_AND_ACTING_SCOPE_V1",
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-003",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "bounded",
        "ownerRole": "ROLE_ENGINEERING_LEAD",
        "reviewTriggerRefs": ["RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE", "RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA"],
        "notes": "Audience separation is a control-plane problem, not a shell-layout or continuity problem.",
    },
    {
        "threatId": "PRIV-126-005",
        "threatFamily": "telemetry_event_and_debug_disclosure",
        "processingDomain": "observability_and_audit",
        "processingActivity": "Canonical events, UI telemetry, structured logs, diagnostics, and immutable audit links.",
        "dataSubjectClass": "patient|staff_member|operator",
        "dataClass": "event_descriptor|masked_subject_ref|route_descriptor|audit_link",
        "entrySurface": "rf_patient_home|rf_staff_workspace|rf_operations_board|rf_governance_shell",
        "channelProfile": "browser|internal_event_bus|worker_log",
        "audienceTier": "patient_authenticated|support|operations_control|governance_review",
        "actorScope": "ACT_PATIENT_AUTHENTICATED|ACT_STAFF_SINGLE_ORG|ACT_OPERATIONS_WATCH",
        "purposeOfUse": "authenticated_self_service|support_recovery|operational_control|governance_review",
        "storageOrTransitBoundary": "ui->gateway_observation->runtime_event_spine->audit_ledger",
        "riskScenario": "Raw PHI, contact values, or identity claims leak through UI telemetry, canonical events, browser-visible diagnostics, or structured logs because disclosure fences or masking rules drift.",
        "sourceBlueprintRefs": [
            "blueprint/platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "blueprint/phase-2-identity-and-echoes.md#Raw identity values are never emitted on the bus",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_CANONICAL_EVENT_BUS",
        ],
        "requiredControls": [
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-004",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "bounded",
        "ownerRole": "ROLE_SECURITY_LEAD",
        "reviewTriggerRefs": ["RTR_126_TELEMETRY_SCHEMA_OR_DEBUG_SCOPE_DELTA"],
        "notes": "This threat explicitly closes the gap where event privacy was implied but not machine-readable.",
    },
    {
        "threatId": "PRIV-126-006",
        "threatFamily": "communications_and_contact_route_privacy_drift",
        "processingDomain": "communications_and_reachability",
        "processingActivity": "Callback, notification, bounce, resend, and transcription handling across patient and staff journeys.",
        "dataSubjectClass": "patient",
        "dataClass": "contact_route_descriptor|message_preview|transcript_fragment|reachability_status",
        "entrySurface": "rf_patient_messages|rf_patient_secure_link_recovery|rf_staff_workspace",
        "channelProfile": "browser_authenticated|telephony|notification_worker",
        "audienceTier": "patient_authenticated|support|origin_practice_operations",
        "actorScope": "ACT_PATIENT_AUTHENTICATED|ACT_STAFF_SINGLE_ORG",
        "purposeOfUse": "authenticated_self_service|support_recovery|operational_care_delivery",
        "storageOrTransitBoundary": "contact_route_snapshot_store->notification_or_telephony_processors",
        "riskScenario": "A preview, resend, bounce workflow, or transcription review reuses stale contact-route evidence or exposes more message content than the current repair and minimization rules permit.",
        "sourceBlueprintRefs": [
            "blueprint/callback-and-clinician-messaging-loop.md",
            "data/analysis/contact_route_snapshot_manifest.json#repair_journeys",
        ],
        "requiredControls": [
            "CTRL_126_CONTACT_ROUTE_SNAPSHOT_REPAIR_V1",
            "CTRL_126_MINIMUM_NECESSARY_CLASSIFICATION_V1",
            "CTRL_126_CANONICAL_EVENT_MASKING_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-005",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "open",
        "ownerRole": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "reviewTriggerRefs": ["RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE", "RTR_126_SPRINT_PRIVACY_DELTA"],
        "notes": "Current repair flows are well-defined, but live supplier and processor evidence are still outstanding.",
    },
    {
        "threatId": "PRIV-126-007",
        "threatFamily": "cross_org_and_external_adapter_disclosure",
        "processingDomain": "external_adapter_exchange",
        "processingActivity": "Local booking, network coordination, pharmacy, telephony, MESH, and IM1 adapter exchanges.",
        "dataSubjectClass": "patient",
        "dataClass": "appointment_descriptor|organisation_routing_ref|pharmacy_handoff_descriptor|adapter_payload_reference",
        "entrySurface": "rf_patient_appointments|rf_hub_case_management|rf_pharmacy_shell",
        "channelProfile": "browser_authenticated|internal_adapter|mesh_like_transport",
        "audienceTier": "patient_authenticated|hub_desk|servicing_site|pharmacy_console",
        "actorScope": "ACT_PATIENT_AUTHENTICATED|ACT_HUB_CROSS_ORG|ACT_STAFF_SINGLE_ORG",
        "purposeOfUse": "authenticated_self_service|operational_care_delivery|coordination",
        "storageOrTransitBoundary": "gateway_surface->application_core->external_adapter_boundary",
        "riskScenario": "Cross-organisation and external-adapter flows disclose more patient, routing, or operational detail than the specific supplier capability, trust boundary, or purpose-of-use row permits.",
        "sourceBlueprintRefs": [
            "prompt/126.md#cross-organisation and external-adapter disclosure risk",
            "data/analysis/gateway_surface_manifest.json#boundary_rows",
            "data/analysis/runtime_topology_manifest.json#trust_zone_boundaries",
        ],
        "requiredControls": [
            "CTRL_126_GATEWAY_ADAPTER_BOUNDARY_V1",
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-006",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "blocked_by_unknown",
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "notes": "Residual risk remains blocked_by_unknown until live processors, transfers, and provider contracts are named.",
    },
    {
        "threatId": "PRIV-126-008",
        "threatFamily": "frozen_bundle_legal_hold_and_break_glass_excess_access",
        "processingDomain": "frozen_evidence_and_investigation",
        "processingActivity": "Frozen bundle handling, legal hold, fallback review, support replay, and investigation exports.",
        "dataSubjectClass": "patient|staff_member",
        "dataClass": "frozen_artifact_bundle|investigation_note|masked_replay_detail|audit_export",
        "entrySurface": "rf_support_workspace|rf_governance_shell|rf_operations_drilldown",
        "channelProfile": "browser_support|browser_governance|governed_export",
        "audienceTier": "support|governance_review|operations_control",
        "actorScope": "ACT_STAFF_SINGLE_ORG|ACT_OPERATIONS_WATCH|ACT_GOVERNANCE_PLATFORM",
        "purposeOfUse": "support_recovery|investigation_break_glass|governance_review",
        "storageOrTransitBoundary": "evidence_store->investigation_scope_envelope->governed_export",
        "riskScenario": "A frozen bundle, legal hold, or break-glass replay path exposes more evidence than the current investigation envelope, expiry window, or export ceiling allows.",
        "sourceBlueprintRefs": [
            "blueprint/phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "data/analysis/break_glass_scope_rules.json#rules",
            "data/analysis/data_classification_matrix.csv#CLS_ARTIFACT_ART_AUDIT_REPLAY_BUNDLE",
        ],
        "requiredControls": [
            "CTRL_126_BREAK_GLASS_SCOPE_ENVELOPE_V1",
            "CTRL_126_FROZEN_BUNDLE_AND_EXPORT_GOVERNANCE_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-007",
        "mockOrActualState": MIXED_TRACK,
        "residualRiskState": "bounded",
        "ownerRole": "ROLE_SERVICE_OWNER_OPERATIONS_REVIEWER",
        "reviewTriggerRefs": ["RTR_126_BREAK_GLASS_OR_INVESTIGATION_SCOPE_DELTA"],
        "notes": "Break-glass now appears as an explicit DPIA control family with review and expiry burden.",
    },
    {
        "threatId": "PRIV-126-009",
        "threatFamily": "embedded_and_constrained_browser_privacy_drift",
        "processingDomain": "embedded_and_constrained_browser",
        "processingActivity": "Embedded bridge, constrained browser handoff, artifact preview, deep links, and hosted channel telemetry.",
        "dataSubjectClass": "patient",
        "dataClass": "route_descriptor|artifact_mode_descriptor|masked_subject_ref|host_compatibility_state",
        "entrySurface": "rf_patient_home|rf_patient_requests|rf_patient_appointments",
        "channelProfile": "embedded_patient_channel|constrained_browser",
        "audienceTier": "patient_embedded_authenticated",
        "actorScope": "ACT_PATIENT_EMBEDDED",
        "purposeOfUse": "embedded_authenticated",
        "storageOrTransitBoundary": "embedded_host->gateway_surface->artifact_presentation_shell",
        "riskScenario": "A constrained or embedded browser inherits standalone deep-link, artifact, or telemetry behavior and therefore exposes more route or subject detail than the channel contract permits.",
        "sourceBlueprintRefs": [
            "blueprint/phase-7-inside-the-nhs-app.md",
            "data/analysis/audit_event_disclosure_matrix.csv#EV_UI_TELEMETRY_EMBEDDED",
        ],
        "requiredControls": [
            "CTRL_126_EMBEDDED_CHANNEL_PRIVACY_POSTURE_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
            "CTRL_126_ROUTE_RUNTIME_PUBLICATION_PARITY_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-008",
        "mockOrActualState": ACTUAL_TRACK,
        "residualRiskState": "blocked_by_unknown",
        "ownerRole": "ROLE_ENGINEERING_LEAD",
        "reviewTriggerRefs": ["RTR_126_RELEASE_OR_RUNTIME_TUPLE_CHANGE", "RTR_126_PROVIDER_OR_SUBPROCESSOR_CHANGE"],
        "notes": "The repo only carries compatibility seams here, so live host and processor evidence remain explicitly pending.",
    },
    {
        "threatId": "PRIV-126-010",
        "threatFamily": "assistive_and_model_backed_privacy_risk",
        "processingDomain": "assistive_and_model_governance",
        "processingActivity": "Assistive shadow mode, visible assistance, provenance capture, rationale rendering, and draft insertion controls.",
        "dataSubjectClass": "patient|staff_member",
        "dataClass": "prompt_context_descriptor|rationale_fragment|candidate_hash|provenance_pointer",
        "entrySurface": "rf_staff_workspace|rf_support_workspace|rf_governance_shell",
        "channelProfile": "browser_workspace|sidecar_assistive_service",
        "audienceTier": "origin_practice_clinical|support|governance_review|assistive_adjunct",
        "actorScope": "ACT_STAFF_SINGLE_ORG|ACT_GOVERNANCE_PLATFORM",
        "purposeOfUse": "operational_care_delivery|support_recovery|assistive_companion|governance_review",
        "storageOrTransitBoundary": "workspace_context->assistive_shadow_buffer->provenance_and_review_store",
        "riskScenario": "Prompt context, rationale snippets, replay logs, or draft insertions expose more subject detail than shadow mode, provenance, and current review posture permit; the DPIA rerun does not happen when it should.",
        "sourceBlueprintRefs": [
            "blueprint/phase-8-the-assistive-layer.md",
            "prompt/126.md#assistive and model-backed privacy risk",
        ],
        "requiredControls": [
            "CTRL_126_ASSISTIVE_PROVENANCE_AND_RERUN_V1",
            "CTRL_126_VISIBILITY_PROJECTION_POLICY_V1",
            "CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1",
        ],
        "linkedDpiaBacklogItemRef": "DPIA-126-009",
        "mockOrActualState": ACTUAL_TRACK,
        "residualRiskState": "blocked_by_unknown",
        "ownerRole": "ROLE_PRIVACY_LEAD_PLACEHOLDER",
        "reviewTriggerRefs": ["RTR_126_ASSISTIVE_OR_MODEL_DELTA"],
        "notes": "This explicitly closes the gap where assistive privacy rerun logic would otherwise stay deferred to later.",
    },
]

THREAT_BY_ID = {row["threatId"]: row for row in THREATS}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def join_pipe(values: list[str]) -> str:
    return "|".join(values)


def render_markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header_line = "| " + " | ".join(headers) + " |"
    separator_line = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header_line, separator_line, *body])


def summarize_inputs() -> dict[str, Any]:
    loaded: dict[str, Any] = {}
    for key, path in REQUIRED_INPUTS.items():
        require(path.exists(), f"Required input missing for par_126: {path}")
        if path.suffix == ".json":
            loaded[key] = read_json(path)
        else:
            loaded[key] = read_csv(path)
    return loaded


def build_prerequisite_snapshot(inputs: dict[str, Any]) -> list[dict[str, Any]]:
    snapshot = []
    for key, path in REQUIRED_INPUTS.items():
        snapshot.append(
            {
                "prerequisiteId": f"PREREQ_126_{key.upper()}",
                "path": str(path.relative_to(ROOT)),
                "status": "available",
                "pathExists": True,
            }
        )
    snapshot.append(
        {
            "prerequisiteId": "PREREQ_125_CLINICAL_SIGNOFF_PACK",
            "path": "docs/assurance/125_clinical_signoff_matrix.md",
            "status": "blocked_on_parallel_task",
            "pathExists": (ROOT / "docs" / "assurance" / "125_clinical_signoff_matrix.md").exists(),
        }
    )
    return snapshot


def build_flow_inventory(inputs: dict[str, Any], prerequisite_snapshot: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "reviewed_at": REVIEWED_AT,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "processing_activity_count": len(PROCESSING_ACTIVITIES),
            "threat_count": len(THREATS),
            "control_family_count": len(CONTROL_CATALOG),
            "prerequisite_count": len(prerequisite_snapshot),
            "classification_row_count": len(inputs["data_classification_matrix"]),
            "route_scope_requirement_count": len(inputs["route_to_scope_requirements"]),
            "telemetry_vocabulary_count": len(inputs["ui_telemetry_vocabulary"]["vocabularyEntries"]),
        },
        "prerequisite_snapshot": prerequisite_snapshot,
        "prerequisite_gaps": PREREQUISITE_GAPS,
        "processing_activities": PROCESSING_ACTIVITIES,
    }


def build_traceability() -> dict[str, Any]:
    mappings = []
    for threat in THREATS:
        controls = [CONTROL_BY_ID[control_id] for control_id in threat["requiredControls"]]
        grouped = {
            "platformRuntimePublication": [row["controlId"] for row in controls if row["controlLayer"] == "platform_runtime_publication"],
            "uiRuntimePublication": [row["controlId"] for row in controls if row["controlLayer"] == "ui_runtime_publication"],
            "operationalGovernanceReview": [row["controlId"] for row in controls if row["controlLayer"] == "operational_governance_review"],
            "futureOnboardingOrContractual": sorted({ref for row in controls for ref in row["actualProductionUpgradeRefs"]}),
        }
        mappings.append(
            {
                "threatId": threat["threatId"],
                "linkedBacklogId": threat["linkedDpiaBacklogItemRef"],
                "controlRefs": threat["requiredControls"],
                "controlLayers": grouped,
                "reviewTriggerRefs": threat["reviewTriggerRefs"],
                "ownerRole": threat["ownerRole"],
                "antiPatternReminder": [
                    "UI collapse is not an authorization boundary.",
                    "Local cache is not a disclosure control.",
                    "Decorative shell behavior is not a privacy safeguard.",
                ],
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "reviewed_at": REVIEWED_AT,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "control_family_count": len(CONTROL_CATALOG),
            "threat_mapping_count": len(mappings),
            "review_trigger_count": len(REVIEW_TRIGGER_CATALOG),
            "prerequisite_gap_count": len(PREREQUISITE_GAPS),
        },
        "prerequisite_gaps": PREREQUISITE_GAPS,
        "gap_resolutions": GAP_RESOLUTIONS,
        "review_trigger_catalog": REVIEW_TRIGGER_CATALOG,
        "controlFamilyCatalog": CONTROL_CATALOG,
        "threatControlMappings": mappings,
    }


def build_csv_rows() -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, str]]]:
    threat_rows = []
    for threat in THREATS:
        threat_rows.append(
            {
                "threatId": threat["threatId"],
                "threatFamily": threat["threatFamily"],
                "processingDomain": threat["processingDomain"],
                "processingActivity": threat["processingActivity"],
                "dataSubjectClass": threat["dataSubjectClass"],
                "dataClass": threat["dataClass"],
                "entrySurface": threat["entrySurface"],
                "channelProfile": threat["channelProfile"],
                "audienceTier": threat["audienceTier"],
                "actorScope": threat["actorScope"],
                "purposeOfUse": threat["purposeOfUse"],
                "storageOrTransitBoundary": threat["storageOrTransitBoundary"],
                "riskScenario": threat["riskScenario"],
                "sourceBlueprintRefs": join_pipe(threat["sourceBlueprintRefs"]),
                "requiredControls": join_pipe(threat["requiredControls"]),
                "linkedDpiaBacklogItemRef": threat["linkedDpiaBacklogItemRef"],
                "mockOrActualState": threat["mockOrActualState"],
                "residualRiskState": threat["residualRiskState"],
                "ownerRole": threat["ownerRole"],
                "reviewTriggerRefs": join_pipe(threat["reviewTriggerRefs"]),
                "notes": threat["notes"],
            }
        )

    backlog_rows = []
    for row in BACKLOG_ITEMS:
        backlog_rows.append(
            {
                "backlogId": row["backlogId"],
                "architecturalSeam": row["architecturalSeam"],
                "title": row["title"],
                "priority": row["priority"],
                "mockOrActualState": row["mockOrActualState"],
                "currentEvidenceState": row["currentEvidenceState"],
                "triggeringProcessingActivities": join_pipe(row["triggeringProcessingActivities"]),
                "threatRefs": join_pipe(row["threatRefs"]),
                "ownerRole": row["ownerRole"],
                "reviewTriggerRefs": join_pipe(row["reviewTriggerRefs"]),
                "prerequisiteGapRefs": join_pipe(row["prerequisiteGapRefs"]),
                "nextStep": row["nextStep"],
                "sourceBlueprintRefs": join_pipe(row["sourceBlueprintRefs"]),
                "notes": row["notes"],
            }
        )

    role_rows = []
    for row in ROLE_CATALOG:
        role_rows.append(
            {
                "roleId": row["roleId"],
                "roleTitle": row["roleTitle"],
                "reviewEventId": row["reviewEventId"],
                "responsibility": row["responsibility"],
                "decisionType": row["decisionType"],
                "mockOrActualState": row["mockOrActualState"],
                "requiredInputs": join_pipe(row["requiredInputs"]),
                "noSelfApprovalBoundary": row["noSelfApprovalBoundary"],
                "escalationTargetRole": row["escalationTargetRole"],
                "prerequisiteGapRefs": join_pipe(row["prerequisiteGapRefs"]),
                "sourceBlueprintRefs": join_pipe(row["sourceBlueprintRefs"]),
                "notes": row["notes"],
            }
        )
    return threat_rows, backlog_rows, role_rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    require(rows, f"Cannot write empty CSV: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def build_atlas_payload(flow_inventory: dict[str, Any], traceability: dict[str, Any]) -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "generatedAt": GENERATED_AT,
        "reviewedAt": REVIEWED_AT,
        "summary": {
            "threatCount": len(THREATS),
            "backlogCount": len(BACKLOG_ITEMS),
            "flowCount": len(PROCESSING_ACTIVITIES),
            "controlCount": len(CONTROL_CATALOG),
            "openOrBlockedCount": len([row for row in THREATS if row["residualRiskState"] in {"open", "blocked_by_unknown"}]),
        },
        "prerequisiteGaps": PREREQUISITE_GAPS,
        "reviewTriggers": REVIEW_TRIGGER_CATALOG,
        "flows": PROCESSING_ACTIVITIES,
        "threats": THREATS,
        "backlog": BACKLOG_ITEMS,
        "controls": CONTROL_CATALOG,
        "traceability": traceability["threatControlMappings"],
        "flowInventorySummary": flow_inventory["summary"],
    }


def build_atlas_html(payload: dict[str, Any]) -> str:
    payload_json = json.dumps(payload, indent=2)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>126 Privacy Threat Atlas</title>
    <link rel="stylesheet" href="../../packages/design-system/src/foundation.css" />
    <style>
      :root {{
        color-scheme: light;
        --atlas-canvas: var(--sys-surface-canvas, #F7F8FA);
        --atlas-shell: var(--sys-surface-shell, #EEF2F6);
        --atlas-panel: var(--sys-surface-panel, #FFFFFF);
        --atlas-inset: var(--sys-surface-inset, #E8EEF3);
        --atlas-text-strong: var(--sys-text-strong, #0F1720);
        --atlas-text: var(--sys-text-default, #24313D);
        --atlas-text-muted: var(--sys-text-muted, #5E6B78);
        --atlas-border: var(--sys-border-subtle, #D6DEE6);
        --atlas-active: var(--sys-state-active-border, #2F6FED);
        --atlas-privacy: #5B61F6;
        --atlas-review: #B7791F;
        --atlas-danger: #B42318;
        --atlas-shadow: 0 14px 28px rgba(15, 23, 32, 0.08);
      }}

      * {{
        box-sizing: border-box;
      }}

      body {{
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(180deg, color-mix(in oklab, var(--atlas-shell) 70%, white), var(--atlas-canvas));
        color: var(--atlas-text);
        font-family: var(--font-body, "Inter", "Segoe UI", sans-serif);
      }}

      .sr-only {{
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }}

      .atlas-root {{
        min-height: 100vh;
      }}

      .atlas-masthead {{
        position: sticky;
        top: 0;
        z-index: 20;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 24px;
        border-bottom: 1px solid var(--atlas-border);
        background: color-mix(in oklab, var(--atlas-panel) 90%, white);
        backdrop-filter: blur(10px);
      }}

      .atlas-wordmark {{
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: var(--atlas-text-strong);
        font-weight: 700;
        letter-spacing: 0.01em;
      }}

      .atlas-wordmark svg {{
        width: 22px;
        height: 22px;
      }}

      .atlas-masthead-meta {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }}

      .atlas-chip {{
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--atlas-border);
        background: var(--atlas-shell);
        color: var(--atlas-text-muted);
        font-size: 0.85rem;
      }}

      .atlas-shell {{
        max-width: 1520px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 24px;
      }}

      .atlas-layout {{
        display: grid;
        grid-template-columns: 288px minmax(0, 1fr) 392px;
        gap: 24px;
        align-items: start;
      }}

      .atlas-root[data-layout-mode="lg"] .atlas-layout {{
        grid-template-columns: 288px minmax(0, 1fr);
      }}

      .atlas-root[data-layout-mode="lg"] .atlas-inspector {{
        grid-column: 1 / -1;
      }}

      .atlas-root[data-layout-mode="md"] .atlas-layout {{
        grid-template-columns: 1fr;
      }}

      .atlas-panel {{
        background: color-mix(in oklab, var(--atlas-panel) 94%, white);
        border: 1px solid var(--atlas-border);
        border-radius: 24px;
        box-shadow: var(--atlas-shadow);
      }}

      .atlas-filter-rail,
      .atlas-inspector {{
        position: sticky;
        top: 96px;
      }}

      .atlas-filter-rail,
      .atlas-inspector,
      .atlas-main {{
        display: grid;
        gap: 16px;
      }}

      .atlas-panel-inner {{
        padding: 18px 18px 20px;
        display: grid;
        gap: 14px;
      }}

      .atlas-section-title,
      .atlas-panel h1,
      .atlas-panel h2,
      .atlas-panel h3,
      .atlas-panel p {{
        margin: 0;
      }}

      .atlas-copy {{
        display: grid;
        gap: 8px;
      }}

      .atlas-copy h1 {{
        color: var(--atlas-text-strong);
        font-size: clamp(1.4rem, 1.5vw + 1rem, 2rem);
      }}

      .atlas-copy p {{
        color: var(--atlas-text-muted);
        line-height: 1.5;
      }}

      .atlas-filter-group {{
        display: grid;
        gap: 10px;
      }}

      .atlas-filter-group-title {{
        color: var(--atlas-text-strong);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }}

      .atlas-filter-buttons,
      .atlas-threat-list,
      .atlas-kpis,
      .atlas-flow-diagram,
      .atlas-control-columns,
      .atlas-review-list {{
        display: grid;
        gap: 10px;
      }}

      .atlas-filter-buttons {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}

      .atlas-filter-button,
      .atlas-threat-button {{
        width: 100%;
        border: 1px solid var(--atlas-border);
        background: var(--atlas-shell);
        color: var(--atlas-text);
        border-radius: 16px;
        padding: 10px 12px;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      }}

      .atlas-filter-button[aria-pressed="true"],
      .atlas-threat-button[aria-pressed="true"] {{
        border-color: var(--atlas-active);
        background: color-mix(in oklab, var(--atlas-panel) 70%, var(--atlas-active));
        color: var(--atlas-text-strong);
      }}

      .atlas-threat-button[data-risk-state="blocked_by_unknown"] {{
        border-left: 4px solid var(--atlas-danger);
      }}

      .atlas-threat-button[data-risk-state="open"] {{
        border-left: 4px solid var(--atlas-review);
      }}

      .atlas-threat-button[data-risk-state="bounded"] {{
        border-left: 4px solid var(--atlas-privacy);
      }}

      .atlas-kpis {{
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }}

      .atlas-root[data-layout-mode="md"] .atlas-kpis {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}

      .atlas-kpi {{
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--atlas-border);
        background: var(--atlas-shell);
        display: grid;
        gap: 6px;
      }}

      .atlas-kpi strong {{
        color: var(--atlas-text-strong);
        font-size: 1.4rem;
      }}

      .atlas-diagram-wrap,
      .atlas-table-wrap {{
        padding: 16px;
        border-radius: 20px;
        border: 1px solid var(--atlas-border);
        background: var(--atlas-shell);
        display: grid;
        gap: 12px;
      }}

      .atlas-flow-diagram {{
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }}

      .atlas-root[data-layout-mode="lg"] .atlas-flow-diagram {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}

      .atlas-root[data-layout-mode="md"] .atlas-flow-diagram,
      .atlas-control-columns {{
        grid-template-columns: 1fr;
      }}

      .atlas-flow-card,
      .atlas-control-card,
      .atlas-review-item {{
        border: 1px solid var(--atlas-border);
        background: color-mix(in oklab, var(--atlas-panel) 88%, var(--atlas-shell));
        border-radius: 18px;
        padding: 14px;
        display: grid;
        gap: 8px;
      }}

      .atlas-flow-card[data-selected="true"],
      .atlas-backlog-row[data-linked="selected"],
      .atlas-control-card[data-selected="true"] {{
        border-color: var(--atlas-active);
        box-shadow: inset 0 0 0 1px var(--atlas-active);
      }}

      .atlas-pill-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }}

      .atlas-pill {{
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--atlas-inset);
        color: var(--atlas-text-muted);
        font-size: 0.78rem;
      }}

      .atlas-matrix {{
        display: grid;
        gap: 8px;
        grid-template-columns: 180px repeat(4, minmax(0, 1fr));
      }}

      .atlas-root[data-layout-mode="md"] .atlas-matrix {{
        grid-template-columns: 140px repeat(4, minmax(0, 1fr));
      }}

      .atlas-matrix-cell {{
        border-radius: 14px;
        padding: 10px;
        border: 1px solid var(--atlas-border);
        background: color-mix(in oklab, var(--atlas-panel) 88%, var(--atlas-shell));
        min-height: 54px;
        display: grid;
        align-content: space-between;
      }}

      .atlas-matrix-cell strong {{
        color: var(--atlas-text-strong);
      }}

      .atlas-control-columns {{
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }}

      .atlas-control-column {{
        display: grid;
        gap: 10px;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }}

      th,
      td {{
        border-bottom: 1px solid var(--atlas-border);
        padding: 10px 8px;
        text-align: left;
        vertical-align: top;
      }}

      th {{
        color: var(--atlas-text-strong);
        font-weight: 600;
      }}

      .atlas-backlog-row[data-linked="hidden"] {{
        opacity: 0.55;
      }}

      .atlas-inspector-block {{
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--atlas-border);
        background: var(--atlas-shell);
        display: grid;
        gap: 10px;
      }}

      .atlas-meta-list {{
        display: grid;
        gap: 8px;
      }}

      .atlas-meta-row {{
        display: grid;
        gap: 4px;
      }}

      .atlas-meta-label {{
        color: var(--atlas-text-muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }}

      @media (prefers-reduced-motion: reduce) {{
        *, *::before, *::after {{
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }}
      }}
    </style>
  </head>
  <body>
    <div
      class="atlas-root"
      data-testid="privacy-threat-atlas-root"
      data-mode="{VISUAL_MODE}"
      data-layout-mode="xl"
      data-selected-threat-id=""
      data-selected-flow-id=""
      data-selected-backlog-id=""
      data-motion-mode="standard"
    >
      <header class="atlas-masthead" data-testid="privacy-threat-atlas-masthead">
        <div class="atlas-wordmark" aria-label="Vecells privacy threat atlas">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 2v20M3 7l18 10M21 7 3 17" stroke="currentColor" stroke-width="1.1" opacity=".7"/>
          </svg>
          <span>Vecells</span>
        </div>
        <div class="atlas-masthead-meta">
          <span class="atlas-chip">Mode: {VISUAL_MODE}</span>
          <span class="atlas-chip" data-testid="layout-indicator">Layout: xl</span>
          <span class="atlas-chip" data-testid="motion-indicator">Motion: standard</span>
        </div>
      </header>

      <div class="atlas-shell">
        <section class="atlas-panel atlas-panel-inner">
          <div class="atlas-copy">
            <h1>Privacy threat model, data-flow inventory, and DPIA backlog for the simulator-first Vecells baseline.</h1>
            <p>
              This atlas joins the current runtime, scope, telemetry, replay, and adapter controls into one
              audit-friendly privacy surface. It keeps <code>mock_current</code>, <code>actual_pending</code>, and
              <code>mixed</code> rows separate instead of pretending the mock estate is already production-approved.
            </p>
          </div>
          <div class="atlas-kpis" data-testid="summary-kpis"></div>
        </section>

        <div class="atlas-layout">
          <nav class="atlas-filter-rail" aria-label="Threat filters" data-testid="filter-rail"></nav>

          <main class="atlas-main" data-testid="diagram-canvas">
            <section class="atlas-panel atlas-panel-inner" aria-labelledby="flow-diagram-title">
              <h2 id="flow-diagram-title" class="atlas-section-title">Data-flow diagram</h2>
              <div class="atlas-diagram-wrap">
                <div class="atlas-flow-diagram" data-testid="data-flow-diagram"></div>
              </div>
              <div class="atlas-table-wrap">
                <table data-testid="data-flow-table">
                  <caption class="sr-only">Data flow table parity</caption>
                  <thead>
                    <tr><th>Flow</th><th>Domain</th><th>Track</th><th>Linked threats</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="atlas-panel atlas-panel-inner" aria-labelledby="threat-matrix-title">
              <h2 id="threat-matrix-title" class="atlas-section-title">Threat-density matrix</h2>
              <div class="atlas-diagram-wrap">
                <div class="atlas-matrix" data-testid="threat-density-matrix"></div>
              </div>
              <div class="atlas-table-wrap">
                <table data-testid="threat-table">
                  <caption class="sr-only">Threat register parity table</caption>
                  <thead>
                    <tr><th>Threat</th><th>Domain</th><th>Risk</th><th>Track</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="atlas-panel atlas-panel-inner" aria-labelledby="control-braid-title">
              <h2 id="control-braid-title" class="atlas-section-title">Control-trace braid</h2>
              <div class="atlas-diagram-wrap">
                <div class="atlas-control-columns" data-testid="control-trace-braid"></div>
              </div>
              <div class="atlas-table-wrap">
                <table data-testid="control-table">
                  <caption class="sr-only">Control trace parity table</caption>
                  <thead>
                    <tr><th>Control</th><th>Layer</th><th>Category</th><th>Owner</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="atlas-panel atlas-panel-inner" aria-labelledby="backlog-title">
              <h2 id="backlog-title" class="atlas-section-title">DPIA backlog</h2>
              <div class="atlas-table-wrap">
                <table data-testid="backlog-table">
                  <caption class="sr-only">Backlog parity table</caption>
                  <thead>
                    <tr><th>Backlog item</th><th>Seam</th><th>Track</th><th>Evidence state</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="atlas-panel atlas-panel-inner" aria-labelledby="timeline-title">
              <h2 id="timeline-title" class="atlas-section-title">Review-trigger timeline</h2>
              <div class="atlas-review-list" data-testid="review-trigger-timeline"></div>
            </section>
          </main>

          <aside class="atlas-inspector" aria-label="Threat inspector" data-testid="inspector-panel"></aside>
        </div>
      </div>
    </div>

    <script id="atlas-payload" type="application/json">{payload_json}</script>
    <script>
      const payload = JSON.parse(document.getElementById("atlas-payload").textContent);
      const root = document.querySelector("[data-testid='privacy-threat-atlas-root']");
      const filterRail = document.querySelector("[data-testid='filter-rail']");
      const inspector = document.querySelector("[data-testid='inspector-panel']");
      const flowDiagram = document.querySelector("[data-testid='data-flow-diagram']");
      const flowTableBody = document.querySelector("[data-testid='data-flow-table'] tbody");
      const threatMatrix = document.querySelector("[data-testid='threat-density-matrix']");
      const threatTableBody = document.querySelector("[data-testid='threat-table'] tbody");
      const controlColumns = document.querySelector("[data-testid='control-trace-braid']");
      const controlTableBody = document.querySelector("[data-testid='control-table'] tbody");
      const backlogTableBody = document.querySelector("[data-testid='backlog-table'] tbody");
      const reviewList = document.querySelector("[data-testid='review-trigger-timeline']");
      const kpis = document.querySelector("[data-testid='summary-kpis']");
      const layoutIndicator = document.querySelector("[data-testid='layout-indicator']");
      const motionIndicator = document.querySelector("[data-testid='motion-indicator']");

      const threatById = new Map(payload.threats.map((row) => [row.threatId, row]));
      const controlById = new Map(payload.controls.map((row) => [row.controlId, row]));
      const backlogById = new Map(payload.backlog.map((row) => [row.backlogId, row]));
      const triggerById = new Map(payload.reviewTriggers.map((row) => [row.reviewTriggerId, row]));
      const traceabilityByThreatId = new Map(payload.traceability.map((row) => [row.threatId, row]));

      const state = {{
        domain: "all",
        audience: "all",
        track: "all",
        risk: "all",
        selectedThreatId: payload.threats[0]?.threatId || "",
      }};

      function compactText(value) {{
        return String(value).replaceAll("|", ", ");
      }}

      function updateLayoutMode() {{
        const width = window.innerWidth;
        const mode = width >= 1360 ? "xl" : width >= 960 ? "lg" : "md";
        root.dataset.layoutMode = mode;
        layoutIndicator.textContent = `Layout: ${{mode}}`;
      }}

      function updateMotionMode() {{
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const mode = prefersReduced ? "reduced" : "standard";
        root.dataset.motionMode = mode;
        motionIndicator.textContent = `Motion: ${{mode}}`;
      }}

      function currentVisibleThreats() {{
        return payload.threats.filter((threat) => {{
          if (state.domain !== "all" && threat.processingDomain !== state.domain) return false;
          if (state.audience !== "all" && !threat.audienceTier.split("|").includes(state.audience)) return false;
          if (state.track !== "all" && threat.mockOrActualState !== state.track) return false;
          if (state.risk !== "all" && threat.residualRiskState !== state.risk) return false;
          return true;
        }});
      }}

      function ensureSelectedThreat() {{
        const visibleThreats = currentVisibleThreats();
        if (!visibleThreats.length) {{
          state.selectedThreatId = "";
          root.dataset.selectedThreatId = "";
          root.dataset.selectedFlowId = "";
          root.dataset.selectedBacklogId = "";
          return;
        }}
        if (!visibleThreats.some((threat) => threat.threatId === state.selectedThreatId)) {{
          state.selectedThreatId = visibleThreats[0].threatId;
        }}
        const selected = threatById.get(state.selectedThreatId);
        root.dataset.selectedThreatId = selected.threatId;
        const selectedFlow = payload.flows.find((flow) => flow.threatRefs.includes(selected.threatId));
        root.dataset.selectedFlowId = selectedFlow?.flowId || "";
        root.dataset.selectedBacklogId = selected.linkedDpiaBacklogItemRef;
      }}

      function renderKpis() {{
        const summary = payload.summary;
        const items = [
          ["Threat rows", summary.threatCount],
          ["Backlog items", summary.backlogCount],
          ["Flows", summary.flowCount],
          ["Open or blocked", summary.openOrBlockedCount],
        ];
        kpis.innerHTML = items
          .map(([label, value]) => `
            <div class="atlas-kpi">
              <span class="atlas-meta-label">${{label}}</span>
              <strong>${{value}}</strong>
            </div>
          `)
          .join("");
      }}

      function filterValuesFor(key, extractor) {{
        return Array.from(new Set(payload.threats.flatMap((row) => extractor(row)))).sort();
      }}

      function renderFilters() {{
        const domains = filterValuesFor("domain", (row) => [row.processingDomain]);
        const audiences = filterValuesFor("audience", (row) => row.audienceTier.split("|"));
        const tracks = Array.from(new Set(payload.threats.map((row) => row.mockOrActualState)));
        const risks = Array.from(new Set(payload.threats.map((row) => row.residualRiskState)));
        const groups = [
          ["domain", "Domain", domains],
          ["audience", "Audience tier", audiences],
          ["track", "Track", tracks],
          ["risk", "Residual risk", risks],
        ];

        const selectedGap = payload.prerequisiteGaps[0];
        const visibleThreats = currentVisibleThreats();

        filterRail.innerHTML = `
          <section class="atlas-panel atlas-panel-inner">
            <div class="atlas-copy">
              <h2>Threat filters</h2>
              <p>Filter by domain, audience tier, mock/actual state, and residual risk without losing the current inspector context.</p>
            </div>
            ${{
              groups
                .map(([key, label, values]) => `
                  <div class="atlas-filter-group">
                    <div class="atlas-filter-group-title">${{label}}</div>
                    <div class="atlas-filter-buttons" role="group" aria-label="${{label}}">
                      <button class="atlas-filter-button" data-filter-key="${{key}}" data-filter-value="all" aria-pressed="${{state[key] === "all"}}" data-testid="${{key}}-filter-all">All</button>
                      ${{
                        values
                          .map(
                            (value) => `<button class="atlas-filter-button" data-filter-key="${{key}}" data-filter-value="${{value}}" aria-pressed="${{state[key] === value}}" data-testid="${{key}}-filter-${{value}}">${{value}}</button>`,
                          )
                          .join("")
                      }}
                    </div>
                  </div>
                `)
                .join("")
            }}
          </section>
          <section class="atlas-panel atlas-panel-inner">
            <div class="atlas-copy">
              <h2>Threat register</h2>
              <p>${{visibleThreats.length}} visible threat rows.</p>
            </div>
            <div class="atlas-threat-list" data-testid="threat-list" role="listbox" aria-label="Privacy threats">
              ${{
                visibleThreats
                  .map(
                    (threat, index) => `
                      <button
                        class="atlas-threat-button"
                        data-threat-id="${{threat.threatId}}"
                        data-risk-state="${{threat.residualRiskState}}"
                        data-threat-index="${{index}}"
                        aria-pressed="${{state.selectedThreatId === threat.threatId}}"
                        role="option"
                      >
                        <strong>${{threat.threatId}}</strong><br />
                        <span>${{threat.threatFamily.replaceAll("_", " ")}}</span>
                      </button>
                    `,
                  )
                  .join("")
              }}
            </div>
          </section>
          <section class="atlas-panel atlas-panel-inner">
            <div class="atlas-copy">
              <h2>Prerequisite gap</h2>
              <p>${{selectedGap.title}}</p>
            </div>
            <div class="atlas-pill-row">
              <span class="atlas-pill">${{selectedGap.status}}</span>
              <span class="atlas-pill">${{selectedGap.closureTarget}}</span>
            </div>
          </section>
        `;

        filterRail.querySelectorAll(".atlas-filter-button").forEach((button) => {{
          button.addEventListener("click", () => {{
            state[button.dataset.filterKey] = button.dataset.filterValue;
            render();
          }});
        }});

        const threatButtons = Array.from(filterRail.querySelectorAll(".atlas-threat-button"));
        threatButtons.forEach((button) => {{
          button.addEventListener("click", () => {{
            state.selectedThreatId = button.dataset.threatId;
            render();
          }});
        }});

        filterRail.querySelector("[data-testid='threat-list']").addEventListener("keydown", (event) => {{
          const buttons = Array.from(filterRail.querySelectorAll(".atlas-threat-button"));
          const currentIndex = buttons.indexOf(document.activeElement);
          if (event.key === "ArrowDown" && currentIndex >= 0) {{
            event.preventDefault();
            buttons[(currentIndex + 1) % buttons.length].focus();
          }}
          if (event.key === "ArrowUp" && currentIndex >= 0) {{
            event.preventDefault();
            buttons[(currentIndex - 1 + buttons.length) % buttons.length].focus();
          }}
          if ((event.key === "Enter" || event.key === " ") && document.activeElement?.dataset?.threatId) {{
            event.preventDefault();
            state.selectedThreatId = document.activeElement.dataset.threatId;
            render();
          }}
        }});
      }}

      function renderFlows(selectedThreat) {{
        flowDiagram.innerHTML = payload.flows
          .map((flow) => {{
            const selected = flow.threatRefs.includes(selectedThreat.threatId);
            return `
              <article class="atlas-flow-card" data-flow-id="${{flow.flowId}}" data-selected="${{selected}}" data-testid="flow-card-${{flow.flowId}}">
                <div class="atlas-meta-label">${{flow.flowId}}</div>
                <strong>${{flow.processingActivity}}</strong>
                <div class="atlas-pill-row">
                  <span class="atlas-pill">${{flow.processingDomain}}</span>
                  <span class="atlas-pill">${{flow.mockOrActualState}}</span>
                </div>
                <p>${{flow.notes}}</p>
              </article>
            `;
          }})
          .join("");

        flowTableBody.innerHTML = payload.flows
          .map((flow) => `
            <tr data-flow-id="${{flow.flowId}}" data-linked="${{flow.threatRefs.includes(selectedThreat.threatId) ? "selected" : "hidden"}}">
              <td>${{flow.flowId}}</td>
              <td>${{flow.processingDomain}}</td>
              <td>${{flow.mockOrActualState}}</td>
              <td>${{flow.threatRefs.join(", ")}}</td>
            </tr>
          `)
          .join("");
      }}

      function renderThreatMatrix(visibleThreats) {{
        const domains = Array.from(new Set(payload.threats.map((row) => row.processingDomain)));
        const riskStates = ["open", "bounded", "accepted_pending_signoff", "blocked_by_unknown"];
        threatMatrix.innerHTML = `
          <div class="atlas-meta-label">Domain</div>
          ${{
            riskStates.map((risk) => `<div class="atlas-meta-label">${{risk}}</div>`).join("")
          }}
          ${{
            domains
              .map((domain) => {{
                const cells = riskStates
                  .map((risk) => {{
                    const count = visibleThreats.filter((threat) => threat.processingDomain === domain && threat.residualRiskState === risk).length;
                    return `<div class="atlas-matrix-cell"><span>${{count ? "Visible" : "None"}}</span><strong>${{count}}</strong></div>`;
                  }})
                  .join("");
                return `<div class="atlas-matrix-cell"><strong>${{domain}}</strong></div>${{cells}}`;
              }})
              .join("")
          }}
        `;

        threatTableBody.innerHTML = visibleThreats
          .map((threat) => `
            <tr data-threat-id="${{threat.threatId}}">
              <td>${{threat.threatId}}</td>
              <td>${{threat.processingDomain}}</td>
              <td>${{threat.residualRiskState}}</td>
              <td>${{threat.mockOrActualState}}</td>
            </tr>
          `)
          .join("");
      }}

      function renderControls(selectedThreat) {{
        const mapping = traceabilityByThreatId.get(selectedThreat.threatId);
        const selectedControls = mapping.controlRefs.map((controlId) => controlById.get(controlId));
        const groups = [
          ["Runtime and publication", mapping.controlLayers.platformRuntimePublication.concat(mapping.controlLayers.uiRuntimePublication)],
          ["Operational review", mapping.controlLayers.operationalGovernanceReview],
          ["Actual-production upgrades", mapping.controlLayers.futureOnboardingOrContractual],
        ];

        controlColumns.innerHTML = groups
          .map(([label, refs]) => `
            <div class="atlas-control-column">
              <div class="atlas-meta-label">${{label}}</div>
              ${{
                refs
                  .map((ref) => {{
                    const control = controlById.get(ref);
                    if (control) {{
                      return `
                        <article class="atlas-control-card" data-control-id="${{control.controlId}}" data-selected="true">
                          <strong>${{control.controlTitle}}</strong>
                          <span>${{control.controlCategory}}</span>
                        </article>
                      `;
                    }}
                    return `
                      <article class="atlas-control-card" data-control-id="${{ref}}" data-selected="true">
                        <strong>${{ref}}</strong>
                        <span>actual-production evidence upgrade</span>
                      </article>
                    `;
                  }})
                  .join("")
              }}
            </div>
          `)
          .join("");

        controlTableBody.innerHTML = selectedControls
          .map((control) => `
            <tr data-control-id="${{control.controlId}}">
              <td>${{control.controlId}}</td>
              <td>${{control.controlLayer}}</td>
              <td>${{control.controlCategory}}</td>
              <td>${{control.ownerRole}}</td>
            </tr>
          `)
          .join("");
      }}

      function renderBacklog(selectedThreat) {{
        backlogTableBody.innerHTML = payload.backlog
          .map((item) => {{
            const linked = item.threatRefs.includes(selectedThreat.threatId) ? "selected" : "hidden";
            return `
              <tr class="atlas-backlog-row" data-linked="${{linked}}" data-backlog-id="${{item.backlogId}}">
                <td>${{item.backlogId}}</td>
                <td>${{item.architecturalSeam}}</td>
                <td>${{item.mockOrActualState}}</td>
                <td>${{item.currentEvidenceState}}</td>
              </tr>
            `;
          }})
          .join("");
      }}

      function renderTimeline(selectedThreat) {{
        const backlog = backlogById.get(selectedThreat.linkedDpiaBacklogItemRef);
        const triggerIds = Array.from(new Set([...(selectedThreat.reviewTriggerRefs || []), ...(backlog.reviewTriggerRefs || [])]));
        reviewList.innerHTML = triggerIds
          .map((triggerId) => {{
            const trigger = triggerById.get(triggerId);
            return `
              <article class="atlas-review-item" data-trigger-id="${{triggerId}}">
                <div class="atlas-meta-label">${{triggerId}}</div>
                <strong>${{trigger.label}}</strong>
                <p>${{trigger.whenToRun}}</p>
              </article>
            `;
          }})
          .join("");
      }}

      function renderInspector(selectedThreat) {{
        const backlog = backlogById.get(selectedThreat.linkedDpiaBacklogItemRef);
        inspector.innerHTML = `
          <section class="atlas-panel atlas-panel-inner">
            <div class="atlas-copy">
              <h2>Threat inspector</h2>
              <p>Selection syncs the diagram, control braid, backlog rows, and review timeline.</p>
            </div>
            <div class="atlas-inspector-block">
              <div class="atlas-meta-label">Selected threat</div>
              <h3 data-testid="selected-threat-id">${{selectedThreat.threatId}}</h3>
              <p>${{selectedThreat.riskScenario}}</p>
              <div class="atlas-pill-row">
                <span class="atlas-pill">${{selectedThreat.processingDomain}}</span>
                <span class="atlas-pill">${{selectedThreat.mockOrActualState}}</span>
                <span class="atlas-pill">${{selectedThreat.residualRiskState}}</span>
              </div>
            </div>
            <div class="atlas-inspector-block">
              <div class="atlas-meta-list">
                <div class="atlas-meta-row">
                  <span class="atlas-meta-label">Audience tier</span>
                  <strong>${{compactText(selectedThreat.audienceTier)}}</strong>
                </div>
                <div class="atlas-meta-row">
                  <span class="atlas-meta-label">Purpose of use</span>
                  <strong>${{compactText(selectedThreat.purposeOfUse)}}</strong>
                </div>
                <div class="atlas-meta-row">
                  <span class="atlas-meta-label">Linked backlog</span>
                  <strong data-testid="selected-backlog-id">${{backlog.backlogId}}</strong>
                </div>
                <div class="atlas-meta-row">
                  <span class="atlas-meta-label">Owner role</span>
                  <strong>${{selectedThreat.ownerRole}}</strong>
                </div>
              </div>
            </div>
            <div class="atlas-inspector-block">
              <div class="atlas-meta-label">Current notes</div>
              <p>${{selectedThreat.notes}}</p>
            </div>
          </section>
        `;
      }}

      function render() {{
        ensureSelectedThreat();
        renderKpis();
        renderFilters();
        const visibleThreats = currentVisibleThreats();
        if (!visibleThreats.length) {{
          flowDiagram.innerHTML = "";
          flowTableBody.innerHTML = "";
          threatMatrix.innerHTML = "";
          threatTableBody.innerHTML = "";
          controlColumns.innerHTML = "";
          controlTableBody.innerHTML = "";
          backlogTableBody.innerHTML = "";
          reviewList.innerHTML = "";
          inspector.innerHTML = `<section class="atlas-panel atlas-panel-inner"><p>No threats match the current filters.</p></section>`;
          return;
        }}
        const selectedThreat = threatById.get(state.selectedThreatId);
        renderFlows(selectedThreat);
        renderThreatMatrix(visibleThreats);
        renderControls(selectedThreat);
        renderBacklog(selectedThreat);
        renderTimeline(selectedThreat);
        renderInspector(selectedThreat);
      }}

      window.addEventListener("resize", () => {{
        updateLayoutMode();
      }});
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {{
        updateMotionMode();
      }});

      updateLayoutMode();
      updateMotionMode();
      render();
    </script>
  </body>
</html>
"""


def build_threat_model_doc(prerequisite_snapshot: list[dict[str, Any]]) -> str:
    table = render_markdown_table(
        ["Threat", "Domain", "Track", "Residual risk", "Backlog"],
        [
            [
                threat["threatId"],
                threat["processingDomain"],
                threat["mockOrActualState"],
                threat["residualRiskState"],
                threat["linkedDpiaBacklogItemRef"],
            ]
            for threat in THREATS
        ],
    )
    return textwrap.dedent(
        f"""\
        # 126 Privacy Threat Model

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`  
        Visual mode: `{VISUAL_MODE}`

        ## Mission

        Publish one joined privacy architecture set for Vecells that engineering, release, governance, and later provider-onboarding work can all extend. The threat model is grounded in the current simulator-first Phase 0 algorithm, but it stays honest about live controller, processor, transfer, retention, and signoff evidence that is still pending.

        ## Mock_now_execution

        - Use the current mock-provider estate, seeded fixtures, runtime publication rows, scope tuples, telemetry vocabularies, and replay controls as the real baseline.
        - Keep every threat row tagged as `mock_current`, `actual_pending`, or `mixed`.
        - Reuse the published control plane names from the blueprint and validated Phase 0 outputs; do not create a second privacy vocabulary.

        ## Actual_production_strategy_later

        - Preserve the same threat IDs, backlog IDs, flow IDs, and control IDs.
        - Upgrade the artifacts with live controller or processor assignments, provider and sub-processor details, transfer evidence, retention evidence, named reviewers, and formal signoff records.
        - Do not collapse current rehearsal evidence into production-ready claims.

        ## Prerequisite gap

        - `PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING` is still open because the formal clinical signoff outputs from `par_125` are not yet published.
        - The privacy threat model therefore keeps some rows at `accepted_pending_signoff` or `blocked_by_unknown` instead of claiming completion.

        ## Threat register summary

        - Threat count: `{len(THREATS)}`
        - Processing activity count: `{len(PROCESSING_ACTIVITIES)}`
        - Control family count: `{len(CONTROL_CATALOG)}`
        - Open or blocked rows: `{len([row for row in THREATS if row["residualRiskState"] in {"open", "blocked_by_unknown"}])}`

        {table}

        ## Threat families covered

        - Intake over-collection, unsafe attachments, and fallback over-exposure
        - Identity and session leakage across local bridge, secure links, and wrong-patient repair
        - Stale or widened visibility due to missing or stale `VisibilityProjectionPolicy`
        - Audience overreach and acting-scope failures
        - PHI leakage through canonical events, UI telemetry, logs, and diagnostics
        - Communication, callback, notification, and contact-route drift
        - Cross-organisation and external-adapter disclosure risk
        - Frozen-bundle, legal-hold, replay, and break-glass excess access
        - Embedded and constrained-browser privacy drift
        - Assistive and model-backed privacy risk with DPIA rerun triggers

        ## Source-traceable prerequisites

        {render_markdown_table(
            ["Prerequisite", "Status", "Path"],
            [[row["prerequisiteId"], row["status"], row["path"]] for row in prerequisite_snapshot],
        )}
        """
    )


def build_backlog_doc() -> str:
    table = render_markdown_table(
        ["Backlog", "Seam", "Track", "Priority", "Threats"],
        [
            [
                row["backlogId"],
                row["architecturalSeam"],
                row["mockOrActualState"],
                row["priority"],
                ", ".join(row["threatRefs"]),
            ]
            for row in BACKLOG_ITEMS
        ],
    )
    return textwrap.dedent(
        f"""\
        # 126 DPIA Backlog

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - Treat the backlog as immediately actionable engineering and governance work, not as a placeholder for a later DPIA rewrite.
        - Backlog items are grouped by architectural seam so work can be assigned across product, engineering, privacy, security, and operations now.

        ## Actual_production_strategy_later

        - Preserve the current seam grouping and backlog IDs.
        - Upgrade each item with controller or processor names, live contracts, transfer evidence, retention evidence, and formal signoff records.

        ## Backlog table

        {table}

        ## Priority notes

        - `DPIA-126-006`, `DPIA-126-007`, and `DPIA-126-009` remain the strongest `actual_pending` obligations because they depend on live external processors, named review rosters, or future assistive rollout.
        - `DPIA-126-003` and `DPIA-126-007` carry `PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING`, because the final review cadence and signoff graph are not yet published.
        """
    )


def build_flow_doc(flow_inventory: dict[str, Any]) -> str:
    table = render_markdown_table(
        ["Flow", "Activity family", "Track", "Linked threats"],
        [
            [
                row["flowId"],
                row["activityFamily"],
                row["mockOrActualState"],
                ", ".join(row["threatRefs"]),
            ]
            for row in PROCESSING_ACTIVITIES
        ],
    )
    return textwrap.dedent(
        f"""\
        # 126 Privacy Data Flow Inventory

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - The flow inventory covers the real simulator-first baseline: intake, authenticated portal, secure-link recovery, telephony and transcription, staff and support workspace, booking and adapter exchanges, audit and observability, frozen evidence, and assistive planning.
        - The flow inventory is source-traceable to current route, classification, scope, telemetry, and trust-boundary artifacts.

        ## Actual_production_strategy_later

        - Live controller or processor assignments, sub-processor lists, transfer evidence, retention evidence, and channel-specific monitoring must be added to these same flow IDs.

        ## Flow table

        {table}

        ## Current source counts

        - Classification rows available: `{flow_inventory["summary"]["classification_row_count"]}`
        - Route scope rows available: `{flow_inventory["summary"]["route_scope_requirement_count"]}`
        - Telemetry vocabulary rows available: `{flow_inventory["summary"]["telemetry_vocabulary_count"]}`
        """
    )


def build_traceability_doc(traceability: dict[str, Any]) -> str:
    table = render_markdown_table(
        ["Threat", "Controls", "Operational review", "Actual upgrades"],
        [
            [
                row["threatId"],
                ", ".join(row["controlLayers"]["platformRuntimePublication"] + row["controlLayers"]["uiRuntimePublication"]),
                ", ".join(row["controlLayers"]["operationalGovernanceReview"]) or "none",
                ", ".join(row["controlLayers"]["futureOnboardingOrContractual"]) or "none",
            ]
            for row in traceability["threatControlMappings"]
        ],
    )
    return textwrap.dedent(
        f"""\
        # 126 Privacy Control Traceability Matrix

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - Trace every threat to real control-plane contracts already published by the repo: `VisibilityProjectionPolicy`, `ScopedMutationGate`, `UITelemetryDisclosureFence`, scope tuples, runtime bindings, classification ceilings, trust boundaries, replay rules, and break-glass envelopes.
        - Keep UI calmness, route collapse, and local cache behavior out of the control column because they are not authorization boundaries.

        ## Actual_production_strategy_later

        - Add controller or processor, contract, transfer, and named-approver evidence through the `futureOnboardingOrContractual` column without renaming the control families.

        ## Matrix

        {table}

        ## Explicit anti-patterns

        - UI collapse is not an authorization boundary.
        - Local cache is not a disclosure control.
        - Decorative shell behavior is not a privacy safeguard.
        """
    )


def build_rules_doc() -> str:
    return textwrap.dedent(
        f"""\
        # 126 Minimum Necessary, Break Glass, and Disclosure Rules

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - Apply the current classification ceilings, acting-scope tuples, route-scope rows, replay envelopes, and telemetry redaction rules exactly as already published in the repository.
        - Treat break-glass as a distinct purpose-of-use row with expiry and review burden, not as an ambient support privilege.

        ## Actual_production_strategy_later

        - Bind these same rules to live deployer policy documents, named approvers, processor assignments, and transfer evidence.
        - Do not loosen the rules for actual production; only add stronger evidence and named owners.

        ## Minimum-necessary law

        - Classification ceilings decide preview, detail, artifact, telemetry, log, and replay exposure before a shell can render.
        - Audience tier, purpose-of-use, acting scope, and runtime binding must agree before deeper detail appears.
        - Cross-organisation surfaces require an explicit scope tuple and may not widen after projection.

        ## Break-glass law

        - Break-glass is a governed purpose-of-use row, not a role flag.
        - Every break-glass session needs an investigation scope envelope, explicit expiry, masked detail ceilings, and review burden.
        - Replay, export, and legal hold remain read-only and scope-bound.

        ## Telemetry and disclosure law

        - UI telemetry must prove a `UITelemetryDisclosureFence`.
        - Canonical events and structured logs may emit references, hashes, and masked descriptors, but never raw identity values, phone numbers, message bodies, or free-text clinical narrative.
        - Browser-visible diagnostics remain bound to the same disclosure ceilings.

        ## Non-controls

        - UI collapse is not an authorization boundary.
        - Local cache is not a disclosure control.
        - Decorative shell behavior is not a privacy safeguard.
        """
    )


def build_trigger_doc() -> str:
    table = render_markdown_table(
        ["Trigger", "When to rerun", "Why it matters"],
        [
            [row["reviewTriggerId"], row["label"], row["whenToRun"]]
            for row in REVIEW_TRIGGER_CATALOG
        ],
    )
    return textwrap.dedent(
        f"""\
        # 126 Privacy Change Triggers and DPIA Rerun Rules

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - Publish the rerun rules now so privacy-sensitive changes do not wait for live provider onboarding or assistive rollout before they become explicit.
        - Re-run the backlog when scope tuples, route bindings, replay envelopes, telemetry schemas, provider boundaries, or assistive capabilities change materially.

        ## Actual_production_strategy_later

        - Keep the same trigger IDs and add named governance events, approvers, and evidence references rather than replacing the trigger model.

        ## Trigger catalog

        {table}
        """
    )


def build_tracks_doc() -> str:
    return textwrap.dedent(
        f"""\
        # 126 Mock Now vs Actual Privacy Strategy

        Task: `{TASK_ID}`  
        Reviewed at: `{REVIEWED_AT}`

        ## Mock_now_execution

        - The current privacy architecture is real and reusable now.
        - Current evidence may rely on seeded processors, local NHS login rehearsal, IM1 readiness placeholders, deterministic route and scope rows, and published telemetry vocabularies.
        - `mock_current` rows must never be described as production-ready evidence.

        ## Actual_production_strategy_later

        Preserve the current threat IDs, flow IDs, backlog IDs, and control IDs, then upgrade them with:

        - named controller and processor assignments
        - live provider and sub-processor inventories
        - transfer, residency, and retention evidence
        - production monitoring and review cadence evidence
        - formal signoff and rerun records

        ## Explicit blockers

        - `PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING`
        - live provider and sub-processor details for booking, telephony, MESH, pharmacy, and IM1 paths
        - embedded host and assistive processor evidence
        """
    )


def write_docs(flow_inventory: dict[str, Any], traceability: dict[str, Any], prerequisite_snapshot: list[dict[str, Any]]) -> None:
    docs = {
        DOC_THREAT_MODEL_PATH: build_threat_model_doc(prerequisite_snapshot),
        DOC_BACKLOG_PATH: build_backlog_doc(),
        DOC_FLOW_PATH: build_flow_doc(flow_inventory),
        DOC_TRACEABILITY_PATH: build_traceability_doc(traceability),
        DOC_RULES_PATH: build_rules_doc(),
        DOC_TRIGGERS_PATH: build_trigger_doc(),
        DOC_TRACKS_PATH: build_tracks_doc(),
    }
    for path, contents in docs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(contents, encoding="utf-8")


def main() -> None:
    inputs = summarize_inputs()
    prerequisite_snapshot = build_prerequisite_snapshot(inputs)
    flow_inventory = build_flow_inventory(inputs, prerequisite_snapshot)
    traceability = build_traceability()
    threat_rows, backlog_rows, role_rows = build_csv_rows()

    write_csv(THREAT_REGISTER_PATH, threat_rows)
    write_json(FLOW_INVENTORY_PATH, flow_inventory)
    write_csv(BACKLOG_PATH, backlog_rows)
    write_json(TRACEABILITY_PATH, traceability)
    write_csv(ROLE_MATRIX_PATH, role_rows)

    atlas_payload = build_atlas_payload(flow_inventory, traceability)
    HTML_ATLAS_PATH.write_text(build_atlas_html(atlas_payload), encoding="utf-8")
    write_docs(flow_inventory, traceability, prerequisite_snapshot)


if __name__ == "__main__":
    main()
