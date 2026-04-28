#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import textwrap
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROMPT_DIR = ROOT / "prompt"
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "risk"

CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "summary_conflicts": DATA_DIR / "summary_conflicts.json",
    "programme_milestones": DATA_DIR / "programme_milestones.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "safety_hazards": DATA_DIR / "safety_hazard_register_seed.csv",
    "architecture_gaps": DATA_DIR / "architecture_gap_register.json",
    "adr_index": DATA_DIR / "adr_index.json",
    "persona_catalog": DATA_DIR / "persona_catalog.json",
    "channel_inventory": DATA_DIR / "channel_inventory.json",
    "critical_path": DATA_DIR / "critical_path_summary.json",
    "release_gate_matrix": DATA_DIR / "release_gate_matrix.csv",
    "security_control_matrix": DATA_DIR / "security_control_matrix.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
    "external_assurance_obligations": DATA_DIR / "external_assurance_obligations.csv",
}

MASTER_RISK_REGISTER_MD = DOCS_DIR / "18_master_risk_register.md"
DEPENDENCY_WATCHLIST_MD = DOCS_DIR / "18_dependency_watchlist.md"
RISK_TREATMENT_MD = DOCS_DIR / "18_risk_treatment_matrix.md"
RISK_REVIEW_MODEL_MD = DOCS_DIR / "18_risk_review_operating_model.md"
WATCHLIST_LOG_MD = DOCS_DIR / "18_watchlist_decision_log.md"
WATCHTOWER_HTML = DOCS_DIR / "18_risk_watchtower.html"

MASTER_RISK_REGISTER_CSV = DATA_DIR / "master_risk_register.csv"
MASTER_RISK_REGISTER_JSON = DATA_DIR / "master_risk_register.json"
DEPENDENCY_WATCHLIST_CSV = DATA_DIR / "dependency_watchlist.csv"
DEPENDENCY_WATCHLIST_JSON = DATA_DIR / "dependency_watchlist.json"
RISK_HEATMAP_JSON = DATA_DIR / "risk_heatmap.json"
RISK_TASK_LINKS_CSV = DATA_DIR / "risk_task_links.csv"
RISK_GATE_LINKS_CSV = DATA_DIR / "risk_gate_links.csv"

CHECKLIST_PATTERN = re.compile(r"- \[(.| )\] (seq|par)_(\d{3})_(.+?) \(prompt/(\d+)\.md\)$")
FINDING_PATTERN = re.compile(r"Finding[s]? (\d+)")

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/018.md",
    "prompt/shared_operating_contract_016_to_020.md",
    "data/analysis/summary_conflicts.json",
    "data/analysis/programme_milestones.json",
    "data/analysis/external_dependencies.json",
    "data/analysis/regulatory_workstreams.json",
    "data/analysis/architecture_gap_register.json",
    "data/analysis/adr_index.json",
    "blueprint/platform-admin-and-config-blueprint.md#StandardsBaselineMap",
    "blueprint/platform-admin-and-config-blueprint.md#DependencyLifecycleRecord",
    "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
    "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/phase-9-the-assurance-ledger.md#Assurance graph completeness and incident workflow",
    "blueprint/forensic-audit-findings.md#Findings 91, 95, 104-120",
]

REQUIRED_FINDING_IDS = [
    "FINDING_091",
    "FINDING_095",
    "FINDING_104",
    "FINDING_105",
    "FINDING_106",
    "FINDING_107",
    "FINDING_108",
    "FINDING_109",
    "FINDING_110",
    "FINDING_111",
    "FINDING_112",
    "FINDING_113",
    "FINDING_114",
    "FINDING_115",
    "FINDING_116",
    "FINDING_117",
    "FINDING_118",
    "FINDING_119",
    "FINDING_120",
]

LIKELIHOOD_SCORE = {"low": 1, "medium": 2, "high": 3, "extreme": 4}
IMPACT_SCORE = {"low": 1, "medium": 2, "high": 3, "extreme": 4}
DETECTABILITY_SCORE = {"easy": 1, "moderate": 2, "hard": 3}

BASE_SCOPE_MAP = {
    "baseline_required": "current",
    "optional_flagged": "optional",
    "future_optional": "optional",
    "deferred_phase7": "deferred",
    "current": "current",
    "deferred": "deferred",
    "optional": "optional",
}

CLASS_DEFAULTS = {
    "product_logic": {
        "likelihood": "high",
        "impact_patient_safety": "high",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "medium",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_CLINICAL_PRODUCT_LEAD",
        "persona_refs": [
            "patient_anonymous_intake",
            "patient_authenticated_portal",
            "clinician_designated_reviewer",
            "support_desk_agent",
        ],
        "channel_refs": ["browser_web", "telephony_ivr", "sms_secure_link_continuation"],
    },
    "architecture": {
        "likelihood": "medium",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_PROGRAMME_ARCHITECT",
        "persona_refs": [
            "patient_authenticated_portal",
            "clinician_designated_reviewer",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser"],
    },
    "integration": {
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "hard",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "persona_refs": [
            "patient_authenticated_portal",
            "hub_coordinator",
            "pharmacy_servicing_assurance_user",
            "support_desk_agent",
        ],
        "channel_refs": [
            "browser_web",
            "outbound_notification_delivery",
            "outbound_callback_delivery",
        ],
    },
    "external_dependency": {
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "extreme",
        "impact_release": "extreme",
        "detectability": "moderate",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "persona_refs": [
            "patient_authenticated_portal",
            "phone_ivr_caller",
            "hub_coordinator",
            "pharmacy_servicing_assurance_user",
            "operations_control_room_operator",
        ],
        "channel_refs": [
            "browser_web",
            "telephony_ivr",
            "outbound_notification_delivery",
            "outbound_callback_delivery",
        ],
    },
    "clinical_safety": {
        "likelihood": "high",
        "impact_patient_safety": "extreme",
        "impact_service": "high",
        "impact_privacy": "high",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "hard",
        "owner_role": "ROLE_MANUFACTURER_CSO",
        "persona_refs": [
            "patient_anonymous_intake",
            "patient_authenticated_portal",
            "phone_ivr_caller",
            "clinician_designated_reviewer",
        ],
        "channel_refs": ["browser_web", "telephony_ivr", "sms_secure_link_continuation"],
    },
    "privacy": {
        "likelihood": "medium",
        "impact_patient_safety": "medium",
        "impact_service": "medium",
        "impact_privacy": "extreme",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "hard",
        "owner_role": "ROLE_DPO",
        "persona_refs": [
            "patient_authenticated_portal",
            "patient_grant_scoped_recovery",
            "support_desk_agent",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser", "sms_secure_link_continuation"],
    },
    "security": {
        "likelihood": "medium",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "high",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_SECURITY_LEAD",
        "persona_refs": [
            "support_desk_agent",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser"],
    },
    "release": {
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "extreme",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "extreme",
        "detectability": "moderate",
        "owner_role": "ROLE_RELEASE_MANAGER",
        "persona_refs": [
            "patient_authenticated_portal",
            "support_desk_agent",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser", "embedded_webview"],
    },
    "resilience": {
        "likelihood": "medium",
        "impact_patient_safety": "high",
        "impact_service": "extreme",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "extreme",
        "detectability": "hard",
        "owner_role": "ROLE_SRE_LEAD",
        "persona_refs": [
            "patient_authenticated_portal",
            "support_desk_agent",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser", "outbound_notification_delivery"],
    },
    "operational": {
        "likelihood": "medium",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_OPERATIONS_LEAD",
        "persona_refs": [
            "support_desk_agent",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser"],
    },
    "delivery": {
        "likelihood": "high",
        "impact_patient_safety": "low",
        "impact_service": "medium",
        "impact_privacy": "low",
        "impact_delivery": "extreme",
        "impact_release": "high",
        "detectability": "easy",
        "owner_role": "ROLE_PROGRAMME_DIRECTOR",
        "persona_refs": [
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web"],
    },
    "dependency_hygiene": {
        "likelihood": "medium",
        "impact_patient_safety": "low",
        "impact_service": "medium",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD",
        "persona_refs": [
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web"],
    },
    "governance": {
        "likelihood": "medium",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "high",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "owner_role": "ROLE_GOVERNANCE_LEAD",
        "persona_refs": [
            "support_desk_agent",
            "operations_control_room_operator",
            "governance_admin_lead",
        ],
        "channel_refs": ["browser_web", "constrained_browser"],
    },
}

RISK_CLASS_OVERRIDES = {
    "RISK_MUTATION_001": "architecture",
    "RISK_MUTATION_002": "product_logic",
    "RISK_MUTATION_003": "release",
    "RISK_OWNERSHIP_001": "governance",
    "RISK_OWNERSHIP_003": "architecture",
    "RISK_ASSURANCE_001": "release",
    "RISK_BOOKING_001": "product_logic",
    "RISK_BOOKING_002": "integration",
    "RISK_PHARMACY_001": "integration",
    "RISK_RECOVERY_001": "resilience",
    "RISK_RUNTIME_001": "release",
    "RISK_STATE_001": "product_logic",
    "RISK_STATE_002": "product_logic",
    "RISK_STATE_003": "product_logic",
    "RISK_STATE_004": "privacy",
    "RISK_STATE_005": "product_logic",
    "RISK_UI_001": "architecture",
    "RISK_UI_002": "architecture",
    "HZ_DUPLICATE_SUPPRESSION_OR_MERGE": "clinical_safety",
    "HZ_TELEPHONY_EVIDENCE_INADEQUACY": "clinical_safety",
    "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE": "clinical_safety",
    "HZ_WRONG_PATIENT_BINDING": "privacy",
    "FINDING_091": "architecture",
    "FINDING_095": "release",
    "FINDING_112": "resilience",
    "FINDING_114": "governance",
    "FINDING_115": "architecture",
    "FINDING_116": "operational",
    "FINDING_118": "release",
    "FINDING_119": "operational",
    "GAP_015_ALERT_DESTINATION_BINDING": "operational",
    "GAP_015_HSM_SIGNING_KEY_PROVISIONING": "security",
    "GAP_016_ARTIFACT_MODE_TRUTH": "architecture",
    "GAP_016_ASSISTIVE_CENTRALITY": "governance",
    "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT": "release",
    "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT": "resilience",
    "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY": "architecture",
    "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY": "architecture",
    "GAP_016_PHASE7_DEFERRED_CHANNEL": "delivery",
    "GAP_016_SCATTERED_DECISION_FREEZE": "governance",
    "GAP_016_TENANT_SCOPE_DRIFT": "governance",
    "RISK_016_ASSISTIVE_OVERREACH": "governance",
    "RISK_016_CANONICAL_CLOSURE_DRIFT": "product_logic",
    "RISK_016_DIRECT_FHIR_TRUTH_DRIFT": "architecture",
    "RISK_016_DISCLOSURE_FENCE_DRIFT": "privacy",
    "RISK_016_HIDDEN_BFF_BOUNDARY": "architecture",
    "RISK_016_PROJECTION_OR_SETTLEMENT_DRIFT": "architecture",
    "RISK_016_SIBLING_CONTEXT_REACH_THROUGH": "architecture",
    "RISK_016_SUPPLIER_LOGIC_IN_CORE": "architecture",
    "RISK_016_TOPOLOGY_BYPASS": "security",
    "RISK_016_TRANSPORT_AS_TRUTH": "architecture",
    "RISK_EXT_NHS_LOGIN_DELAY": "external_dependency",
    "RISK_EXT_IM1_SCAL_DELAY": "external_dependency",
    "RISK_EXT_MESH_DELAY": "external_dependency",
    "RISK_EXT_COMMS_VENDOR_DELAY": "external_dependency",
    "RISK_EXT_BOOKING_PROVIDER_GAP": "external_dependency",
    "RISK_EXT_PHARMACY_PROVIDER_GAP": "external_dependency",
    "RISK_DEPENDENCY_HYGIENE_WATCHLIST_DRIFT": "dependency_hygiene",
    "RISK_STANDARDS_BASELINE_DRIFT": "dependency_hygiene",
    "RISK_RESTORE_EVIDENCE_STALENESS": "resilience",
}

RISK_TITLE_OVERRIDES = {
    "FINDING_091": "Route, settlement, release, and trust controls drift out of the shared control plane",
    "FINDING_095": "Governance watch tuples and recovery posture drift away from runtime release truth",
    "FINDING_112": "Restore authority depends on stale runbooks or dashboard confidence instead of rehearsed evidence",
    "FINDING_114": "Tenant and acting-scope tuple drift leaves cross-organisation actions writable",
    "FINDING_115": "Artifact preview and handoff mode truth drifts across constrained channels",
    "FINDING_116": "Accessibility announcement truth replays stale or misleading cues",
    "FINDING_118": "Design-contract publication drifts outside the published runtime tuple",
    "FINDING_119": "Operations continuity incidents rebase to newer proof without preserving the original continuity question",
    "GAP_015_ALERT_DESTINATION_BINDING": "Alert destinations remain unbound to exact tenant and service-owner rotations",
    "GAP_015_HSM_SIGNING_KEY_PROVISIONING": "HSM-backed signing keys remain a live release-control seam",
    "GAP_016_ARTIFACT_MODE_TRUTH": "Artifact mode truth remains vulnerable to runtime drift",
    "GAP_016_ASSISTIVE_CENTRALITY": "Assistive capability can still appear architecturally central",
    "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT": "Design and runtime publication tuple can still drift",
    "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT": "Operations and governance continuity evidence can diverge",
    "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY": "Patient degraded-mode posture can collapse back into route-local behavior",
    "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY": "Phase 0 control-plane obligations can be mistaken for phase-local hardening",
    "GAP_016_PHASE7_DEFERRED_CHANNEL": "Deferred Phase 7 can leak into current-baseline evidence chains",
    "GAP_016_SCATTERED_DECISION_FREEZE": "Architecture decisions can scatter back into prose instead of machine-readable control",
    "GAP_016_TENANT_SCOPE_DRIFT": "ActingScopeTuple enforcement can drift across governance, support, and hub work",
    "RISK_016_ASSISTIVE_OVERREACH": "Assistive workflows overreach human-in-the-loop and same-shell trust boundaries",
    "RISK_016_CANONICAL_CLOSURE_DRIFT": "Canonical closure truth drifts away from lifecycle and child-domain evidence",
    "RISK_016_DIRECT_FHIR_TRUTH_DRIFT": "FHIR or partner shapes become hidden write truth",
    "RISK_016_DISCLOSURE_FENCE_DRIFT": "Disclosure fence and artifact mode truth drift between channels",
    "RISK_016_HIDDEN_BFF_BOUNDARY": "Generic BFF shortcuts hide route-family publication and trust boundaries",
    "RISK_016_PROJECTION_OR_SETTLEMENT_DRIFT": "Projection-first reads drift away from authoritative settlement",
    "RISK_016_SIBLING_CONTEXT_REACH_THROUGH": "Sibling bounded contexts reach through package boundaries",
    "RISK_016_SUPPLIER_LOGIC_IN_CORE": "Supplier-specific capability logic leaks into the core model",
    "RISK_016_TOPOLOGY_BYPASS": "Trust zones and browser-to-gateway boundaries are bypassed",
    "RISK_016_TRANSPORT_AS_TRUTH": "Transport acknowledgements are mistaken for domain truth",
    "RISK_EXT_NHS_LOGIN_DELAY": "NHS login partner onboarding or redirect proof delay stalls the current baseline",
    "RISK_EXT_IM1_SCAL_DELAY": "IM1 and SCAL readiness lag blocks Phase 0 assurance merge and later booking reach",
    "RISK_EXT_MESH_DELAY": "MESH and secure-message readiness lag blocks cross-organisation messaging truth",
    "RISK_EXT_COMMS_VENDOR_DELAY": "Notifications, telephony, transcription, or scanning onboarding drifts past the engineering path",
    "RISK_EXT_BOOKING_PROVIDER_GAP": "Booking supplier capability evidence remains ambiguous too late in the programme",
    "RISK_EXT_PHARMACY_PROVIDER_GAP": "Pharmacy directory, transport, or outcome observation posture remains weak",
    "RISK_DEPENDENCY_HYGIENE_WATCHLIST_DRIFT": "Dependency hygiene findings can remain ownerless or timeless",
    "RISK_STANDARDS_BASELINE_DRIFT": "Standards-baseline and exception posture can drift without explicit watch tuples",
    "RISK_RESTORE_EVIDENCE_STALENESS": "Restore readiness can look green while rehearsal evidence is stale",
}

MANUAL_EXTRA_RISKS = [
    {
        "risk_id": "RISK_EXT_NHS_LOGIN_DELAY",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_nhs_login_rail",
            "data/analysis/regulatory_workstreams.json#WS_INTEROPERABILITY_EVIDENCE",
            "prompt/018.md#Mandatory risk families",
        ],
        "finding_refs": ["FINDING_114"],
        "problem_statement": "The current baseline assumes NHS login onboarding, redirect inventory, and subject-binding proof arrive before wider patient-authenticated flows open.",
        "failure_mode": "Partner approval, redirect mismatch, or stale onboarding evidence leaves signed-in or recovery flows blocked or misleadingly writable.",
        "leading_indicators": [
            "NHS login partner onboarding task still marked blocked",
            "redirect URI inventory differs across environments",
            "subject-binding proof remains mock-only while current-baseline tasks depend on it",
        ],
        "trigger_conditions": [
            "seq_024 or seq_025 slips behind the external-readiness gate",
            "auth callback proof exists without writable authority proof",
            "privacy or safety review rejects current subject-binding posture",
        ],
        "affected_dependency_refs": ["dep_nhs_login_rail"],
        "affected_gate_refs": ["GATE_EXTERNAL_TO_FOUNDATION", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE"],
        "affected_task_refs": ["seq_021", "seq_023", "seq_024", "seq_025", "seq_039", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_0", "phase_2"],
        "affected_persona_refs": ["patient_authenticated_portal", "patient_grant_scoped_recovery"],
        "affected_channel_refs": ["browser_web", "sms_secure_link_continuation"],
        "requirement_tokens": ["NHS login", "IdentityBinding", "RouteIntentBinding"],
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "high",
        "impact_delivery": "extreme",
        "impact_release": "extreme",
        "detectability": "moderate",
        "current_control_refs": [
            "dep_nhs_login_rail",
            "WS_INTEROPERABILITY_EVIDENCE",
            "WS_DATA_PROTECTION_PRIVACY",
            "MS_EXT_NHS_LOGIN_ONBOARDING",
        ],
        "control_strength": "partial",
        "mitigation_actions": [
            "Keep redirect and credential inventory under one onboarding pack before patient-authenticated milestones proceed.",
            "Bind seq_024 and seq_025 proof into the external-readiness gate and Phase 0 long-lead merge gate.",
            "Preserve local mock or bounded recovery posture until live onboarding proof is current.",
        ],
        "contingency_actions": [
            "Hold signed-in rollout and keep grant-scoped recovery in bounded read-only posture.",
            "Use support-assisted recovery without widening writable ownership claims.",
        ],
        "target_due_ref": "GATE_EXTERNAL_TO_FOUNDATION",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "status": "open",
        "notes": "This is an explicit onboarding delay risk, not just a dependency watch row.",
    },
    {
        "risk_id": "RISK_EXT_IM1_SCAL_DELAY",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_im1_pairing_programme",
            "data/analysis/regulatory_workstreams.json#WS_INTEROPERABILITY_EVIDENCE",
        ],
        "finding_refs": [],
        "problem_statement": "IM1 prerequisite and SCAL readiness must be visible before Phase 0 claims interoperability readiness.",
        "failure_mode": "The programme reaches foundation merge or booking design work without the supplier and standards path required to convert architecture into credible implementation sequencing.",
        "leading_indicators": [
            "IM1 or SCAL packs remain draft-only",
            "booking-provider capability evidence remains provisional",
            "interop workstream artifacts are stale at gate time",
        ],
        "trigger_conditions": [
            "seq_026 remains incomplete at the external-readiness gate",
            "IM1 evidence is detached from the current release candidate or assurance tuple",
        ],
        "affected_dependency_refs": ["dep_im1_pairing_programme", "dep_local_booking_supplier_adapters", "dep_gp_system_supplier_paths"],
        "affected_gate_refs": ["GATE_EXTERNAL_TO_FOUNDATION", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE"],
        "affected_task_refs": ["seq_021", "seq_026", "seq_036", "seq_039", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_0", "phase_4"],
        "affected_persona_refs": ["clinician_designated_reviewer", "practice_operational_staff", "hub_coordinator"],
        "affected_channel_refs": ["browser_web"],
        "requirement_tokens": ["IM1", "SCAL", "AdapterContractProfile", "ExternalConfirmationGate"],
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "extreme",
        "impact_release": "extreme",
        "detectability": "moderate",
        "current_control_refs": ["dep_im1_pairing_programme", "WS_INTEROPERABILITY_EVIDENCE", "MS_EXT_IM1_SCAL_READINESS"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Keep IM1 and supplier-path evidence as explicit long-lead milestones with owner and due references.",
            "Force booking and provider assumptions through seq_040 degraded-mode freeze if evidence is still partial.",
        ],
        "contingency_actions": [
            "Use local simulator and manual capability matrix posture where baseline permits it.",
            "Delay supplier-specific booking commitments behind capability-proof milestones.",
        ],
        "target_due_ref": "GATE_P0_LONG_LEAD_ASSURANCE_MERGE",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "status": "open",
        "notes": "",
    },
    {
        "risk_id": "RISK_EXT_MESH_DELAY",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_cross_org_secure_messaging_mesh",
            "data/analysis/regulatory_workstreams.json#WS_INTEROPERABILITY_EVIDENCE",
        ],
        "finding_refs": [],
        "problem_statement": "Cross-organisation messaging readiness is a named dependency for hub and support flows, not a later implementation detail.",
        "failure_mode": "Hub coordination and cross-organisation communication are designed against a transport path that has not yet been onboarded or simulated credibly.",
        "leading_indicators": [
            "MESH mailbox or secure-message onboarding remains blocked",
            "cross-org fallback rules stay undocumented",
            "hub or support messaging paths rely on generic email fallback only",
        ],
        "trigger_conditions": [
            "seq_028 or seq_039 slips while later hub milestones remain on the critical path",
            "cross-org acknowledgement is inferred from non-authoritative transport signals",
        ],
        "affected_dependency_refs": ["dep_cross_org_secure_messaging_mesh"],
        "affected_gate_refs": ["GATE_EXTERNAL_TO_FOUNDATION", "GATE_P5_PARALLEL_MERGE"],
        "affected_task_refs": ["seq_021", "seq_028", "seq_039", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_5", "cross_phase_controls"],
        "affected_persona_refs": ["hub_coordinator", "support_desk_agent", "operations_control_room_operator"],
        "affected_channel_refs": ["browser_web", "outbound_notification_delivery"],
        "requirement_tokens": ["MESH", "HubCoordination", "ConversationCommandSettlement"],
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "current_control_refs": ["dep_cross_org_secure_messaging_mesh", "WS_INTEROPERABILITY_EVIDENCE"],
        "control_strength": "weak",
        "mitigation_actions": [
            "Keep MESH onboarding and fallback semantics explicit in the dependency watchlist and seq_040 assumption freeze.",
            "Bind cross-org messaging evidence into Phase 5 merge and release review.",
        ],
        "contingency_actions": [
            "Fallback to bounded manual messaging or callback paths with clear operator debt.",
            "Keep patient or hub calmness pending until authoritative communication proof exists.",
        ],
        "target_due_ref": "GATE_P5_PARALLEL_MERGE",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
        "status": "watching",
        "notes": "",
    },
    {
        "risk_id": "RISK_EXT_COMMS_VENDOR_DELAY",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_email_notification_provider",
            "data/analysis/external_dependencies.json#dep_sms_notification_provider",
            "data/analysis/external_dependencies.json#dep_telephony_ivr_recording_provider",
            "data/analysis/external_dependencies.json#dep_transcription_processing_provider",
            "data/analysis/external_dependencies.json#dep_malware_scanning_provider",
        ],
        "finding_refs": ["FINDING_112"],
        "problem_statement": "Telephony, notification, transcription, and malware-scanning suppliers are long-lead delivery dependencies with safety and disclosure impact.",
        "failure_mode": "Vendor onboarding slips while routes and notifications are designed as if the live providers, receipts, and fallback semantics already exist.",
        "leading_indicators": [
            "Account setup tasks remain unstarted",
            "manual checkpoint debt grows without owner",
            "secure-link or callback fallback posture remains unresolved",
        ],
        "trigger_conditions": [
            "seq_031 to seq_035 remain incomplete at external-readiness or release-review time",
            "delivery or transcription truth is inferred from provider acceptance only",
        ],
        "affected_dependency_refs": [
            "dep_email_notification_provider",
            "dep_sms_notification_provider",
            "dep_telephony_ivr_recording_provider",
            "dep_transcription_processing_provider",
            "dep_malware_scanning_provider",
        ],
        "affected_gate_refs": ["GATE_EXTERNAL_TO_FOUNDATION", "GATE_P0_LONG_LEAD_ASSURANCE_MERGE", "GATE_RELEASE_READINESS"],
        "affected_task_refs": ["seq_021", "seq_031", "seq_032", "seq_033", "seq_034", "seq_035", "seq_039", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_0", "phase_1", "phase_2", "phase_3"],
        "affected_persona_refs": [
            "patient_anonymous_intake",
            "phone_ivr_caller",
            "support_desk_agent",
            "operations_control_room_operator",
        ],
        "affected_channel_refs": [
            "telephony_ivr",
            "sms_secure_link_continuation",
            "outbound_notification_delivery",
            "outbound_callback_delivery",
        ],
        "requirement_tokens": ["notification delivery", "telephony", "transcription", "quarantine"],
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "high",
        "impact_delivery": "extreme",
        "impact_release": "high",
        "detectability": "moderate",
        "current_control_refs": ["external_dependencies.json", "dependency_simulator_strategy.json", "WS_TECHNICAL_SECURITY_ASSURANCE"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Track vendor onboarding, simulator posture, and manual checkpoints in one dependency watchlist row per supplier.",
            "Require seq_039 and seq_040 to freeze manual recovery and degraded-mode defaults before feature phases proceed.",
        ],
        "contingency_actions": [
            "Use simulator or manual fallback posture where baseline permits it.",
            "Keep receipts, calmness, and writable follow-up pending until authoritative provider proof exists.",
        ],
        "target_due_ref": "GATE_EXTERNAL_TO_FOUNDATION",
        "owner_role": "ROLE_COMMUNICATIONS_PLATFORM_LEAD",
        "status": "open",
        "notes": "",
    },
    {
        "risk_id": "RISK_EXT_BOOKING_PROVIDER_GAP",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_local_booking_supplier_adapters",
            "data/analysis/external_dependencies.json#dep_gp_system_supplier_paths",
        ],
        "finding_refs": [],
        "problem_statement": "Booking implementation can outrun real supplier capability evidence, leaving slot truth, confirmation, or fallback semantics under-specified.",
        "failure_mode": "Phase 4 or Phase 5 coding proceeds on optimistic supplier assumptions and later discovers missing capability, ambiguous confirmation, or hidden exclusivity constraints.",
        "leading_indicators": [
            "supplier capability evidence remains provisional",
            "waitlist or confirmation fallback paths remain assumption-only",
            "booking merge gate depends on simulator-only truth late in the cycle",
        ],
        "trigger_conditions": [
            "seq_036 remains unresolved before booking merge work starts",
            "provider capability snapshots or external confirmation semantics differ from the architecture freeze",
        ],
        "affected_dependency_refs": ["dep_local_booking_supplier_adapters", "dep_gp_system_supplier_paths", "dep_network_capacity_partner_feeds"],
        "affected_gate_refs": ["GATE_P4_PARALLEL_MERGE", "GATE_P5_PARALLEL_MERGE"],
        "affected_task_refs": ["seq_036", "seq_038", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_4", "phase_5"],
        "affected_persona_refs": ["patient_authenticated_portal", "practice_operational_staff", "hub_coordinator"],
        "affected_channel_refs": ["browser_web"],
        "requirement_tokens": ["CapacityReservation", "ExternalConfirmationGate", "ReservationTruthProjection"],
        "likelihood": "high",
        "impact_patient_safety": "medium",
        "impact_service": "high",
        "impact_privacy": "low",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "current_control_refs": ["dep_local_booking_supplier_adapters", "dep_gp_system_supplier_paths", "MS_EXT_PROVIDER_PATHS_AND_EVIDENCE"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Keep supplier capability evidence visible in the dependency watchlist and booking/provider assumption freeze.",
            "Block booking merge if authoritative confirmation semantics still rely on generic transport or local hold assumptions.",
        ],
        "contingency_actions": [
            "Use manual booking or callback fallback where truthful and explicitly disclosed.",
            "Keep non-exclusive offer posture and remove calm booked copy until confirmation proof exists.",
        ],
        "target_due_ref": "GATE_P4_PARALLEL_MERGE",
        "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
        "status": "watching",
        "notes": "",
    },
    {
        "risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
        "source_type": "dependency_inventory",
        "source_refs": [
            "data/analysis/external_dependencies.json#dep_pharmacy_directory_dohs",
            "data/analysis/external_dependencies.json#dep_pharmacy_referral_transport",
            "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
        ],
        "finding_refs": [],
        "problem_statement": "Directory truth, dispatch transport, and outcome observation must all line up before pharmacy calmness or closure can be treated as trustworthy.",
        "failure_mode": "Phase 6 reaches dispatch or outcome work with weak provider discovery, weak transport proof, or unmatched outcome semantics.",
        "leading_indicators": [
            "directory or transport onboarding remains onboarding-only at Phase 6 entry",
            "pharmacy outcome observation path still lacks authoritative proof",
            "manual outcome reconciliation debt remains open",
        ],
        "trigger_conditions": [
            "seq_037 or seq_040 remains incomplete at pharmacy entry",
            "dispatch acceptance is treated as closure or patient reassurance",
        ],
        "affected_dependency_refs": [
            "dep_pharmacy_directory_dohs",
            "dep_pharmacy_referral_transport",
            "dep_pharmacy_outcome_observation",
        ],
        "affected_gate_refs": ["GATE_P6_PARALLEL_MERGE", "GATE_P6_EXIT"],
        "affected_task_refs": ["seq_037", "seq_038", "seq_040"],
        "affected_phase_refs": ["external_readiness", "phase_6"],
        "affected_persona_refs": ["patient_authenticated_portal", "pharmacy_servicing_assurance_user", "support_desk_agent"],
        "affected_channel_refs": ["browser_web", "outbound_notification_delivery"],
        "requirement_tokens": ["PharmacyDispatchAttempt", "Dispatch proof", "PharmacyCase"],
        "likelihood": "high",
        "impact_patient_safety": "high",
        "impact_service": "high",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "hard",
        "current_control_refs": ["dep_pharmacy_directory_dohs", "dep_pharmacy_referral_transport", "dep_pharmacy_outcome_observation"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Keep directory, dispatch, and outcome observation as three separate watch rows with explicit fallback strategy.",
            "Require pharmacy merge and exit gates to read those watch rows, not inferred green status.",
        ],
        "contingency_actions": [
            "Use manual callback or GP fallback rather than asserting successful pharmacy handoff.",
            "Freeze calm patient copy and closure while outcome observation remains ambiguous.",
        ],
        "target_due_ref": "GATE_P6_PARALLEL_MERGE",
        "owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
        "status": "watching",
        "notes": "",
    },
    {
        "risk_id": "RISK_DEPENDENCY_HYGIENE_WATCHLIST_DRIFT",
        "source_type": "blueprint",
        "source_refs": [
            "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
            "blueprint/platform-admin-and-config-blueprint.md#DependencyLifecycleRecord",
            "prompt/018.md#Mandatory risk families",
        ],
        "finding_refs": [],
        "problem_statement": "Dependency and standards hygiene warnings can remain orphaned in admin tooling unless they gain owners, review cadence, and gate consequences.",
        "failure_mode": "Current-baseline dependencies drift into unsupported exceptions or stale standards posture without blocking gates or prompting mitigation tasks.",
        "leading_indicators": [
            "watchlist rows lack next review references",
            "ownerless standards exceptions accumulate",
            "release review sees warnings but no explicit risk or gate link",
        ],
        "trigger_conditions": [
            "dependency hygiene finding is opened without owner role",
            "policy compatibility alert persists across a release freeze",
        ],
        "affected_dependency_refs": ["dep_standards_baseline_map", "dep_alert_destination_binding"],
        "affected_gate_refs": ["GATE_PLAN_EXTERNAL_ENTRY", "GATE_RELEASE_READINESS"],
        "affected_task_refs": ["seq_018", "seq_020", "seq_040"],
        "affected_phase_refs": ["planning", "phase_0", "programme_release"],
        "affected_persona_refs": ["operations_control_room_operator", "governance_admin_lead"],
        "affected_channel_refs": ["browser_web"],
        "requirement_tokens": ["StandardsDependencyWatchlist", "DependencyLifecycleRecord", "PolicyCompatibilityAlert"],
        "likelihood": "medium",
        "impact_patient_safety": "low",
        "impact_service": "medium",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "current_control_refs": ["StandardsDependencyWatchlist", "PolicyCompatibilityAlert", "ConfigCompilationRecord"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Carry every standards or dependency hygiene warning into the watchlist with owner, cadence, and gate links.",
            "Fail release review when compatibility alerts remain timeless or evidence-free.",
        ],
        "contingency_actions": [
            "Freeze promotion and fall back to the last known supported tuple.",
        ],
        "target_due_ref": "GATE_RELEASE_READINESS",
        "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD",
        "status": "open",
        "notes": "",
    },
    {
        "risk_id": "RISK_STANDARDS_BASELINE_DRIFT",
        "source_type": "blueprint",
        "source_refs": [
            "blueprint/platform-admin-and-config-blueprint.md#StandardsBaselineMap",
            "blueprint/platform-admin-and-config-blueprint.md#StandardsExceptionRecord",
        ],
        "finding_refs": [],
        "problem_statement": "Standards-baseline, exception, and policy-compatibility posture can drift independently of the exact release tuple under review.",
        "failure_mode": "A release package inherits a standards exception or baseline mismatch that never becomes an explicit blocker or mitigation obligation.",
        "leading_indicators": [
            "standards watchlist hash changes without a fresh review package",
            "exception records lack time-bound review or linked evidence",
            "production promotion gate references stale standards posture",
        ],
        "trigger_conditions": [
            "ConfigCompilationRecord or review package is superseded while standards posture stays readable but not re-approved.",
        ],
        "affected_dependency_refs": ["dep_standards_baseline_map"],
        "affected_gate_refs": ["GATE_RELEASE_READINESS", "GATE_BAU_TRANSFER"],
        "affected_task_refs": ["seq_018", "seq_020", "seq_040"],
        "affected_phase_refs": ["planning", "phase_0", "programme_release"],
        "affected_persona_refs": ["governance_admin_lead", "operations_control_room_operator"],
        "affected_channel_refs": ["browser_web"],
        "requirement_tokens": ["StandardsBaselineMap", "StandardsExceptionRecord", "ReleaseApprovalFreeze"],
        "likelihood": "medium",
        "impact_patient_safety": "low",
        "impact_service": "medium",
        "impact_privacy": "medium",
        "impact_delivery": "high",
        "impact_release": "high",
        "detectability": "moderate",
        "current_control_refs": ["StandardsBaselineMap", "StandardsExceptionRecord", "ReleaseApprovalFreeze"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Bind standards posture to the same review package, watchlist hash, and release tuple as promotion decisions.",
        ],
        "contingency_actions": ["Block promotion and keep the current published tuple."],
        "target_due_ref": "GATE_RELEASE_READINESS",
        "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD",
        "status": "watching",
        "notes": "",
    },
    {
        "risk_id": "RISK_RESTORE_EVIDENCE_STALENESS",
        "source_type": "assurance_workstream",
        "source_refs": [
            "data/analysis/regulatory_workstreams.json#WS_OPERATIONAL_RESILIENCE_RESTORE",
            "blueprint/forensic-audit-findings.md#Finding 112 - Resilience restore authority still depended on loose runbooks and dashboards",
        ],
        "finding_refs": ["FINDING_112"],
        "problem_statement": "Restore readiness can still appear green while the real restore chain, runbooks, or rehearsal evidence are stale.",
        "failure_mode": "Operators rely on dashboards or historical rehearsal confidence instead of current tuple-bound restore evidence when a continuity incident occurs.",
        "leading_indicators": [
            "restore rehearsal evidence is older than the current release tuple",
            "runbook references lack the current publication hash",
            "BAU handover references stale operational readiness snapshots",
        ],
        "trigger_conditions": [
            "release review proceeds without a fresh restore drill bound to the current candidate",
            "incident or recovery posture changes but restore evidence hash does not",
        ],
        "affected_dependency_refs": ["dep_restore_rehearsal_evidence", "dep_assurance_evidence_graph"],
        "affected_gate_refs": ["GATE_RELEASE_READINESS", "GATE_WAVE1_OBSERVATION", "GATE_BAU_TRANSFER"],
        "affected_task_refs": ["seq_018", "seq_020"],
        "affected_phase_refs": ["phase_0", "phase_9", "programme_release"],
        "affected_persona_refs": ["operations_control_room_operator", "governance_admin_lead"],
        "affected_channel_refs": ["browser_web"],
        "requirement_tokens": ["OperationalReadinessSnapshot", "ReleaseRecoveryDisposition", "AssuranceGraphCompletenessVerdict"],
        "likelihood": "medium",
        "impact_patient_safety": "high",
        "impact_service": "extreme",
        "impact_privacy": "medium",
        "impact_delivery": "medium",
        "impact_release": "extreme",
        "detectability": "hard",
        "current_control_refs": ["WS_OPERATIONAL_RESILIENCE_RESTORE", "OperationalReadinessSnapshot", "ReleaseRecoveryDisposition"],
        "control_strength": "partial",
        "mitigation_actions": [
            "Bind restore rehearsal evidence to the current candidate and BAU handover tuple.",
            "Keep incident and release gates consuming the same restore evidence dependency row.",
        ],
        "contingency_actions": [
            "Freeze promotion, widen observation windows, and use bounded recovery posture until a fresh rehearsal is complete.",
        ],
        "target_due_ref": "GATE_RELEASE_READINESS",
        "owner_role": "ROLE_SRE_LEAD",
        "status": "open",
        "notes": "",
    },
]

INTERNAL_DEPENDENCY_ROWS = [
    {
        "dependency_id": "dep_standards_baseline_map",
        "dependency_name": "Standards baseline and exception map",
        "dependency_type": "standards_baseline",
        "baseline_scope": "current",
        "source_refs": [
            "blueprint/platform-admin-and-config-blueprint.md#StandardsBaselineMap",
            "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": [],
        "linked_standards_watch_refs": ["StandardsBaselineMap", "StandardsDependencyWatchlist", "StandardsExceptionRecord"],
        "lifecycle_state": "current",
        "required_for_milestone_refs": ["MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE", "MS_PRG_RELEASE_READINESS"],
        "required_for_gate_refs": ["GATE_PLAN_EXTERNAL_ENTRY", "GATE_RELEASE_READINESS"],
        "blast_radius_scope": "programme-wide standards posture and release gating",
        "monitoring_signals": [
            "Standards watchlist hash remains stable for the current review package",
            "No open promotion-blocking compatibility alerts",
        ],
        "degradation_mode": "promotion_blocked_until_exception_or_baseline_updates_settle",
        "fallback_strategy": "Keep the current published tuple and require explicit, time-bound exception evidence.",
        "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD",
        "next_review_ref": "GATE_RELEASE_READINESS",
        "notes": "Internal dependency row added by seq_018 so standards hygiene cannot stay ownerless.",
    },
    {
        "dependency_id": "dep_release_publication_tuple_pipeline",
        "dependency_name": "Runtime publication and release tuple pipeline",
        "dependency_type": "infra_component",
        "baseline_scope": "current",
        "source_refs": [
            "data/analysis/release_gate_matrix.csv",
            "data/analysis/supply_chain_and_provenance_matrix.json",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": ["runtime_publication_pipeline"],
        "linked_standards_watch_refs": [],
        "lifecycle_state": "current",
        "required_for_milestone_refs": ["MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE", "MS_PRG_RELEASE_READINESS"],
        "required_for_gate_refs": ["GATE_P0_PARALLEL_FOUNDATION_OPEN", "GATE_RELEASE_READINESS", "GATE_WAVE1_OBSERVATION"],
        "blast_radius_scope": "all live audience surfaces, release tuples, and wave guardrails",
        "monitoring_signals": [
            "RuntimePublicationBundle hash matches DesignContractPublicationBundle hash set",
            "ReleasePublicationParityRecord exists for the candidate",
        ],
        "degradation_mode": "freeze_release_and_keep_last_published_tuple",
        "fallback_strategy": "Hold promotion and route all operators to the last known-good published tuple.",
        "owner_role": "ROLE_RELEASE_MANAGER",
        "next_review_ref": "GATE_RELEASE_READINESS",
        "notes": "",
    },
    {
        "dependency_id": "dep_assurance_evidence_graph",
        "dependency_name": "Assurance evidence graph completeness engine",
        "dependency_type": "infra_component",
        "baseline_scope": "current",
        "source_refs": [
            "data/analysis/regulatory_workstreams.json#WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            "blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": [],
        "linked_standards_watch_refs": [],
        "lifecycle_state": "current",
        "required_for_milestone_refs": ["MS_P9_PROOF_AND_EXIT_PACK", "MS_PRG_CURRENT_BASELINE_CONFORMANCE"],
        "required_for_gate_refs": ["GATE_CURRENT_BASELINE_CONFORMANCE", "GATE_BAU_TRANSFER"],
        "blast_radius_scope": "all release, conformance, retention, and BAU evidence admissibility",
        "monitoring_signals": [
            "AssuranceGraphCompletenessVerdict remains admissible for the current candidate",
            "Evidence export rows still point to the same graph hash",
        ],
        "degradation_mode": "approval_and_archive_actions_fail_closed",
        "fallback_strategy": "Stop signoff and archive operations until the graph is regenerated and complete.",
        "owner_role": "ROLE_ASSURANCE_PLATFORM_LEAD",
        "next_review_ref": "GATE_CURRENT_BASELINE_CONFORMANCE",
        "notes": "",
    },
    {
        "dependency_id": "dep_hsm_signing_key_provisioning",
        "dependency_name": "HSM-backed signing key provisioning seam",
        "dependency_type": "security_control",
        "baseline_scope": "current",
        "source_refs": [
            "data/analysis/architecture_gap_register.json#GAP_015_HSM_SIGNING_KEY_PROVISIONING",
            "data/analysis/security_control_matrix.csv",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": [],
        "linked_standards_watch_refs": [],
        "lifecycle_state": "blocked",
        "required_for_milestone_refs": ["MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE", "MS_PRG_RELEASE_READINESS"],
        "required_for_gate_refs": ["GATE_RELEASE_READINESS"],
        "blast_radius_scope": "release signing, provenance, and emergency exception control",
        "monitoring_signals": [
            "HSM-backed signing key not yet bound to the chosen supply-chain path",
            "release evidence still references placeholder signing material",
        ],
        "degradation_mode": "promotion_blocked_for_live_release",
        "fallback_strategy": "Keep non-production verification only and block live promotion until HSM provisioning is complete.",
        "owner_role": "ROLE_SECURITY_LEAD",
        "next_review_ref": "GATE_RELEASE_READINESS",
        "notes": "Inherited open gap from seq_015 and seq_016.",
    },
    {
        "dependency_id": "dep_alert_destination_binding",
        "dependency_name": "Alert-routing destination and on-call binding",
        "dependency_type": "runbook_dependency",
        "baseline_scope": "current",
        "source_refs": [
            "data/analysis/architecture_gap_register.json#GAP_015_ALERT_DESTINATION_BINDING",
            "data/analysis/incident_and_alert_routing_matrix.csv",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": [],
        "linked_standards_watch_refs": [],
        "lifecycle_state": "blocked",
        "required_for_milestone_refs": ["MS_P9_PROOF_AND_EXIT_PACK", "MS_PRG_RELEASE_READINESS"],
        "required_for_gate_refs": ["GATE_RELEASE_READINESS", "GATE_WAVE1_OBSERVATION"],
        "blast_radius_scope": "incident escalation, watch tuple response, and continuity recovery",
        "monitoring_signals": [
            "Alert routes still use placeholder destination identifiers",
            "role-to-rotation mapping is not yet tenant- or service-owner bound",
        ],
        "degradation_mode": "incident_response_relies_on_manual_broadcast",
        "fallback_strategy": "Use controlled manual escalation lists and freeze optimistic alert-coverage claims.",
        "owner_role": "ROLE_OPERATIONS_LEAD",
        "next_review_ref": "GATE_RELEASE_READINESS",
        "notes": "Inherited open gap from seq_015 and seq_016.",
    },
    {
        "dependency_id": "dep_restore_rehearsal_evidence",
        "dependency_name": "Restore rehearsal and recovery evidence pack",
        "dependency_type": "runbook_dependency",
        "baseline_scope": "current",
        "source_refs": [
            "data/analysis/regulatory_workstreams.json#WS_OPERATIONAL_RESILIENCE_RESTORE",
            "data/analysis/release_gate_matrix.csv",
        ],
        "linked_external_inventory_refs": [],
        "linked_adapter_profile_refs": [],
        "linked_standards_watch_refs": [],
        "lifecycle_state": "current",
        "required_for_milestone_refs": ["MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF", "MS_PRG_BAU_HANDOVER_AND_ARCHIVE"],
        "required_for_gate_refs": ["GATE_RELEASE_READINESS", "GATE_BAU_TRANSFER"],
        "blast_radius_scope": "restore authority, operational readiness, and BAU handover",
        "monitoring_signals": [
            "Restore rehearsal pack is current for the candidate",
            "runbook steps match the current region and trust-zone topology",
        ],
        "degradation_mode": "recovery_posture_downgrades_to_review_required",
        "fallback_strategy": "Hold BAU transfer and widen observation until a fresh rehearsal pack is produced.",
        "owner_role": "ROLE_SRE_LEAD",
        "next_review_ref": "GATE_RELEASE_READINESS",
        "notes": "",
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_018_SIMULATOR_NOT_HEALTHY",
        "decision": "Simulator or manual fallback posture counts as watch or replaceable-by-simulator, never as the dependency being fully healthy.",
        "source_refs": [
            "prompt/018.md#Non-negotiable risk/watchlist rules",
            "data/analysis/dependency_truth_and_fallback_matrix.csv",
        ],
    },
    {
        "assumption_id": "ASSUMPTION_018_RESOLVED_ADR_GAPS_STAY_VISIBLE",
        "decision": "Resolved architecture gaps remain in the register as retired or guarded rows so later gate tasks can prove they were deliberately closed rather than forgotten.",
        "source_refs": [
            "data/analysis/architecture_gap_register.json",
            "prompt/018.md#Execution steps",
        ],
    },
    {
        "assumption_id": "ASSUMPTION_018_INTERNAL_WATCH_ROWS",
        "decision": "Standards, release-publication, evidence-graph, HSM, alert-routing, and restore-rehearsal seams are added as internal dependency watch rows because the prompt requires one merged watch posture, not only external inventory rows.",
        "source_refs": [
            "prompt/018.md#Mandatory gap closures",
            "blueprint/platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
        ],
    },
]

ADDITIONAL_FINDING_REFS = {
    "RISK_ASSURANCE_001": [
        "FINDING_104",
        "FINDING_105",
        "FINDING_106",
        "FINDING_107",
        "FINDING_108",
        "FINDING_109",
        "FINDING_110",
        "FINDING_111",
        "FINDING_113",
        "FINDING_119",
    ],
    "RISK_RUNTIME_001": ["FINDING_095", "FINDING_104", "FINDING_118"],
    "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY": ["FINDING_091", "FINDING_104", "FINDING_105", "FINDING_107"],
    "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT": ["FINDING_095", "FINDING_106", "FINDING_119"],
    "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY": ["FINDING_120"],
    "GAP_016_ARTIFACT_MODE_TRUTH": ["FINDING_115"],
    "GAP_016_TENANT_SCOPE_DRIFT": ["FINDING_114"],
    "RISK_UI_001": ["FINDING_117"],
    "RISK_UI_002": ["FINDING_120"],
    "RISK_RESTORE_EVIDENCE_STALENESS": ["FINDING_112"],
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    headers: list[str] = []
    for row in rows:
        for key in row:
            if key not in headers:
                headers.append(key)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    separator = ["---"] * len(headers)
    body = [headers, separator]
    body.extend([[str(cell) for cell in row] for row in rows])
    return "\n".join("| " + " | ".join(row) + " |" for row in body)


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def flatten(values: list[list[str]]) -> list[str]:
    result: list[str] = []
    for value in values:
        result.extend(value)
    return result


def humanize_identifier(value: str) -> str:
    parts = value.replace("_", " ").replace("-", " ").split()
    words: list[str] = []
    for part in parts:
        if part.isupper() and len(part) > 1:
            words.append(part)
        elif part.lower() in {"ui", "fhir", "nhs", "im1", "mesh", "hsm", "dcb0129", "dpia"}:
            words.append(part.upper())
        else:
            words.append(part.capitalize())
    return " ".join(words)


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def phase_for_task(num: int, slug: str) -> str:
    if num <= 20:
        return "planning"
    if num <= 40:
        return "external_readiness"
    if slug.startswith("phase0_") or 41 <= num <= 138:
        return "phase_0"
    if slug.startswith("phase1_") or 139 <= num <= 169:
        return "phase_1"
    if slug.startswith("phase2_") or 170 <= num <= 208:
        return "phase_2"
    if slug.startswith("crosscutting_") or 209 <= num <= 225:
        return "cross_phase_controls"
    if slug.startswith("phase3_") or 226 <= num <= 277:
        return "phase_3"
    if slug.startswith("phase4_") or 278 <= num <= 310:
        return "phase_4"
    if slug.startswith("phase5_") or 311 <= num <= 341:
        return "phase_5"
    if slug.startswith("phase6_") or 342 <= num <= 372:
        return "phase_6"
    if slug.startswith("phase7_") or 373 <= num <= 402:
        return "phase_7"
    if slug.startswith("phase8_") or 403 <= num <= 431:
        return "phase_8"
    if slug.startswith("phase9_") or 432 <= num <= 471:
        return "phase_9"
    return "programme_release"


def parse_checklist() -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for line in CHECKLIST_PATH.read_text().splitlines():
        match = CHECKLIST_PATTERN.match(line)
        if not match:
            continue
        marker, kind, number, slug, prompt_number = match.groups()
        num = int(number)
        task_ref = f"{kind}_{num:03d}"
        tasks.append(
            {
                "task_id": task_ref,
                "task_ref": task_ref,
                "kind": kind,
                "num": num,
                "slug": slug,
                "prompt_ref": f"prompt/{prompt_number}.md",
                "phase_ref": phase_for_task(num, slug),
                "title": slug.replace("_", " "),
                "status_marker": marker,
            }
        )
    if len(tasks) != 489:
        raise SystemExit(f"PREREQUISITE_GAP_CHECKLIST_COUNT: expected 489 tasks, found {len(tasks)}")
    return tasks


def resolve_requirement_ids(requirement_index: list[tuple[str, str]], tokens: list[str], limit: int = 14) -> list[str]:
    resolved: list[str] = []
    for token in tokens:
        needle = normalize_text(token)
        if not needle:
            continue
        for requirement_id, blob in requirement_index:
            if needle in blob and requirement_id not in resolved:
                resolved.append(requirement_id)
                if len(resolved) >= limit:
                    return resolved
    return resolved


def extract_finding_refs(source_refs: list[str], requirement_ids: list[str] | None = None) -> list[str]:
    findings: list[str] = []
    for source_ref in source_refs:
        for match in FINDING_PATTERN.findall(source_ref):
            findings.append(f"FINDING_{int(match):03d}")
    for requirement_id in requirement_ids or []:
        if requirement_id.startswith("GAP-FINDING-"):
            suffix = requirement_id.split("-")[-1]
            findings.append(f"FINDING_{int(suffix):03d}")
    return unique(findings)


def lowest_task_ref(task_refs: list[str]) -> str:
    if not task_refs:
        return ""
    return sorted(task_refs, key=lambda value: int(value.split("_")[1]))[0]


def critical_relevance(
    affected_task_refs: list[str],
    affected_gate_refs: list[str],
    affected_dependency_refs: list[str],
    critical_task_refs: set[str],
    critical_gate_ids: set[str],
    long_lead_dependencies: set[str],
) -> str:
    if set(affected_gate_refs) & critical_gate_ids:
        return "on_path"
    if set(affected_task_refs) & critical_task_refs:
        return "on_path"
    if set(affected_dependency_refs) & long_lead_dependencies:
        return "on_path"
    if affected_gate_refs or affected_task_refs or affected_dependency_refs:
        return "near_path"
    return "off_path"


def compute_gate_impact(status: str, critical_path_state: str, affected_gate_refs: list[str]) -> str:
    if status in {"open", "mitigating"} and (critical_path_state == "on_path" or affected_gate_refs):
        return "blocking"
    if affected_gate_refs or critical_path_state != "off_path":
        return "watch"
    return "none"


def score_risk(row: dict[str, Any]) -> int:
    impact_total = sum(
        IMPACT_SCORE[row[field]]
        for field in [
            "impact_patient_safety",
            "impact_service",
            "impact_privacy",
            "impact_delivery",
            "impact_release",
        ]
    )
    phase_factor = min(3, max(1, len(row["affected_phase_refs"])))
    critical_factor = {"on_path": 4, "near_path": 2, "off_path": 0}[row["critical_path_relevance"]]
    gate_factor = {"blocking": 3, "watch": 1, "none": 0}[row["gate_impact"]]
    return (
        LIKELIHOOD_SCORE[row["likelihood"]] * 4
        + impact_total
        + DETECTABILITY_SCORE[row["detectability"]] * 2
        + phase_factor
        + critical_factor
        + gate_factor
    )


def normalize_phase_ref(phase_ref: str) -> str:
    if phase_ref.startswith("phase_") or phase_ref in {"planning", "external_readiness", "cross_phase_controls", "programme_release"}:
        return phase_ref
    if phase_ref.startswith("phase_0"):
        return "phase_0"
    if phase_ref.startswith("phase_1"):
        return "phase_1"
    if phase_ref.startswith("phase_2"):
        return "phase_2"
    if phase_ref.startswith("phase_3"):
        return "phase_3"
    if phase_ref.startswith("phase_4"):
        return "phase_4"
    if phase_ref.startswith("phase_5"):
        return "phase_5"
    if phase_ref.startswith("phase_6"):
        return "phase_6"
    if phase_ref.startswith("phase_7"):
        return "phase_7"
    if phase_ref.startswith("phase_8"):
        return "phase_8"
    if phase_ref.startswith("phase_9"):
        return "phase_9"
    if phase_ref == "cross_phase":
        return "cross_phase_controls"
    return phase_ref


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("PREREQUISITE_GAP_018_INPUTS: missing required inputs: " + ", ".join(missing))

    tasks = parse_checklist()
    requirement_rows = load_jsonl(REQUIRED_INPUTS["requirement_registry"])
    requirement_index = [
        (row["requirement_id"], normalize_text(json.dumps(row, sort_keys=True)))
        for row in requirement_rows
    ]

    summary_conflicts = load_json(REQUIRED_INPUTS["summary_conflicts"])
    programme = load_json(REQUIRED_INPUTS["programme_milestones"])
    dependencies_payload = load_json(REQUIRED_INPUTS["external_dependencies"])
    workstreams_payload = load_json(REQUIRED_INPUTS["regulatory_workstreams"])
    hazards = load_csv(REQUIRED_INPUTS["safety_hazards"])
    architecture_gaps = load_json(REQUIRED_INPUTS["architecture_gaps"])
    adr_index = load_json(REQUIRED_INPUTS["adr_index"])
    personas = load_json(REQUIRED_INPUTS["persona_catalog"])
    channels = load_json(REQUIRED_INPUTS["channel_inventory"])
    critical_path = load_json(REQUIRED_INPUTS["critical_path"])
    release_gate_rows = load_csv(REQUIRED_INPUTS["release_gate_matrix"])
    security_controls = load_csv(REQUIRED_INPUTS["security_control_matrix"])
    tooling_rows = load_csv(REQUIRED_INPUTS["tooling_scorecard"])
    external_assurance_rows = load_csv(REQUIRED_INPUTS["external_assurance_obligations"])

    return {
        "tasks": tasks,
        "requirement_index": requirement_index,
        "summary_conflicts": summary_conflicts,
        "programme": programme,
        "dependencies_payload": dependencies_payload,
        "workstreams_payload": workstreams_payload,
        "hazards": hazards,
        "architecture_gaps": architecture_gaps,
        "adr_index": adr_index,
        "personas": personas,
        "channels": channels,
        "critical_path": critical_path,
        "release_gate_rows": release_gate_rows,
        "security_controls": security_controls,
        "tooling_rows": tooling_rows,
        "external_assurance_rows": external_assurance_rows,
    }


def build_context(prereqs: dict[str, Any]) -> dict[str, Any]:
    tasks = prereqs["tasks"]
    programme = prereqs["programme"]
    milestones = programme["milestones"]
    gates = programme["merge_gates"]
    dependencies = prereqs["dependencies_payload"]["dependencies"]

    tasks_by_ref = {row["task_ref"]: row for row in tasks}
    tasks_by_num = {row["num"]: row for row in tasks}
    milestones_by_id = {row["milestone_id"]: row for row in milestones}
    gates_by_id = {row["merge_gate_id"]: row for row in gates}
    dependency_by_id = {row["dependency_id"]: row for row in dependencies}
    workstreams_by_id = {row["workstream_id"]: row for row in prereqs["workstreams_payload"]["workstreams"]}
    hazard_by_id = {row["hazard_id"]: row for row in prereqs["hazards"]}
    issue_by_id = {row["issue_id"]: row for row in prereqs["architecture_gaps"]["issues"]}
    persona_ids = {row["persona_id"] for row in prereqs["personas"]["personas"]}
    channel_ids = {row["channel_id"] for row in prereqs["channels"]["channels"]}

    summary_risk_rows: dict[str, dict[str, Any]] = {}
    for row in prereqs["summary_conflicts"]["rows"]:
        for open_risk in row.get("open_risks", []):
            risk_id = open_risk.split()[0]
            summary_risk_rows.setdefault(risk_id, row)

    adr_risk_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for adr in prereqs["adr_index"]["adrs"]:
        for risk_id in adr.get("linked_risk_ids", []):
            adr_risk_map[risk_id].append(adr)

    risk_milestone_refs: dict[str, list[str]] = defaultdict(list)
    risk_gate_refs: dict[str, list[str]] = defaultdict(list)
    risk_task_refs: dict[str, list[str]] = defaultdict(list)
    risk_dependency_refs: dict[str, list[str]] = defaultdict(list)
    dependency_milestone_refs: dict[str, list[str]] = defaultdict(list)
    dependency_gate_refs: dict[str, list[str]] = defaultdict(list)
    dependency_task_refs: dict[str, list[str]] = defaultdict(list)
    critical_task_refs: set[str] = set()

    for milestone in milestones:
        if milestone["milestone_id"] in prereqs["critical_path"]["critical_path_milestone_ids"]:
            critical_task_refs.update(milestone["source_task_refs"])
        for risk_id in milestone.get("required_risk_ids", []):
            risk_milestone_refs[risk_id].append(milestone["milestone_id"])
            risk_task_refs[risk_id].extend(milestone["source_task_refs"])
            risk_dependency_refs[risk_id].extend(milestone.get("required_dependency_refs", []))
        for dependency_id in milestone.get("required_dependency_refs", []):
            dependency_milestone_refs[dependency_id].append(milestone["milestone_id"])
            dependency_task_refs[dependency_id].extend(milestone["source_task_refs"])

    for gate in gates:
        for risk_id in gate.get("required_risk_posture_refs", []):
            risk_gate_refs[risk_id].append(gate["merge_gate_id"])
            risk_dependency_refs[risk_id].extend(gate.get("required_dependency_refs", []))
        for dependency_id in gate.get("required_dependency_refs", []):
            dependency_gate_refs[dependency_id].append(gate["merge_gate_id"])

    long_lead_dependencies: set[str] = set()
    for dep_id, milestone_ids in dependency_milestone_refs.items():
        if any(mid in prereqs["critical_path"]["long_lead_milestone_ids"] for mid in milestone_ids):
            long_lead_dependencies.add(dep_id)

    return {
        "tasks_by_ref": tasks_by_ref,
        "tasks_by_num": tasks_by_num,
        "milestones_by_id": milestones_by_id,
        "gates_by_id": gates_by_id,
        "dependency_by_id": dependency_by_id,
        "workstreams_by_id": workstreams_by_id,
        "hazard_by_id": hazard_by_id,
        "issue_by_id": issue_by_id,
        "summary_risk_rows": summary_risk_rows,
        "adr_risk_map": adr_risk_map,
        "risk_milestone_refs": {key: unique(value) for key, value in risk_milestone_refs.items()},
        "risk_gate_refs": {key: unique(value) for key, value in risk_gate_refs.items()},
        "risk_task_refs": {key: unique(value) for key, value in risk_task_refs.items()},
        "risk_dependency_refs": {key: unique(value) for key, value in risk_dependency_refs.items()},
        "dependency_milestone_refs": {key: unique(value) for key, value in dependency_milestone_refs.items()},
        "dependency_gate_refs": {key: unique(value) for key, value in dependency_gate_refs.items()},
        "dependency_task_refs": {key: unique(value) for key, value in dependency_task_refs.items()},
        "critical_task_refs": critical_task_refs,
        "critical_gate_ids": set(prereqs["critical_path"]["critical_gate_ids"]),
        "long_lead_dependencies": long_lead_dependencies,
        "persona_ids": persona_ids,
        "channel_ids": channel_ids,
    }


def risk_title(risk_id: str, fallback: str = "") -> str:
    if risk_id in RISK_TITLE_OVERRIDES:
        return RISK_TITLE_OVERRIDES[risk_id]
    return fallback or humanize_identifier(risk_id)


def risk_class_for_id(risk_id: str) -> str:
    return RISK_CLASS_OVERRIDES.get(risk_id, "delivery")


def risk_defaults(risk_class: str) -> dict[str, Any]:
    return CLASS_DEFAULTS[risk_class]


def safe_personas(values: list[str], context: dict[str, Any]) -> list[str]:
    defaults = [value for value in values if value in context["persona_ids"]]
    return defaults


def safe_channels(values: list[str], context: dict[str, Any]) -> list[str]:
    defaults = [value for value in values if value in context["channel_ids"]]
    return defaults


def enrich_common_fields(row: dict[str, Any], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    risk_class = row["risk_class"]
    defaults = risk_defaults(risk_class)

    row["affected_phase_refs"] = unique(normalize_phase_ref(value) for value in row.get("affected_phase_refs", []))
    row["affected_task_refs"] = unique(row.get("affected_task_refs", []))
    row["affected_gate_refs"] = unique(row.get("affected_gate_refs", []))
    row["affected_dependency_refs"] = unique(row.get("affected_dependency_refs", []))
    row["affected_persona_refs"] = safe_personas(row.get("affected_persona_refs", defaults["persona_refs"]), context)
    row["affected_channel_refs"] = safe_channels(row.get("affected_channel_refs", defaults["channel_refs"]), context)

    requirement_ids = unique(row.get("affected_requirement_ids", []))
    requirement_tokens = row.pop("requirement_tokens", [])
    requirement_ids.extend(resolve_requirement_ids(prereqs["requirement_index"], requirement_tokens))
    row["affected_requirement_ids"] = unique(requirement_ids)

    row["likelihood"] = row.get("likelihood", defaults["likelihood"])
    row["impact_patient_safety"] = row.get("impact_patient_safety", defaults["impact_patient_safety"])
    row["impact_service"] = row.get("impact_service", defaults["impact_service"])
    row["impact_privacy"] = row.get("impact_privacy", defaults["impact_privacy"])
    row["impact_delivery"] = row.get("impact_delivery", defaults["impact_delivery"])
    row["impact_release"] = row.get("impact_release", defaults["impact_release"])
    row["detectability"] = row.get("detectability", defaults["detectability"])
    row["owner_role"] = row.get("owner_role", defaults["owner_role"])
    row["control_strength"] = row.get("control_strength", "partial")
    row["status"] = row.get("status", "watching")
    row["linked_milestone_refs"] = unique(row.get("linked_milestone_refs", []))
    row["current_control_refs"] = unique(row.get("current_control_refs", []))
    row["mitigation_actions"] = unique(row.get("mitigation_actions", []))
    row["contingency_actions"] = unique(row.get("contingency_actions", []))
    row["finding_refs"] = unique(row.get("finding_refs", []) + ADDITIONAL_FINDING_REFS.get(row["risk_id"], []))
    row["source_refs"] = unique(row.get("source_refs", []))

    row["critical_path_relevance"] = critical_relevance(
        row["affected_task_refs"],
        row["affected_gate_refs"],
        row["affected_dependency_refs"],
        context["critical_task_refs"],
        context["critical_gate_ids"],
        context["long_lead_dependencies"],
    )
    row["gate_impact"] = row.get("gate_impact", compute_gate_impact(row["status"], row["critical_path_relevance"], row["affected_gate_refs"]))
    row["dependency_lifecycle_states"] = []
    row["risk_score"] = score_risk(row)
    if not row.get("target_due_ref"):
        row["target_due_ref"] = row["affected_gate_refs"][0] if row["affected_gate_refs"] else lowest_task_ref(row["affected_task_refs"])
    return row


def build_summary_risk(risk_id: str, source_row: dict[str, Any], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    requirement_ids = unique(source_row.get("related_requirement_ids", []))
    source_refs = [source_row["canonical_winner"]["source_file"]] + source_row.get("losing_sources", [])
    source_refs.extend(
        [
            f"{source_file}#{details['heading']}"
            for source_file, details in source_row.get("source_expressions", {}).items()
            if details.get("heading")
        ]
    )
    finding_refs = extract_finding_refs(source_refs, requirement_ids)
    if risk_id.startswith("FINDING_"):
        finding_refs.append(risk_id)
    linked_milestones = context["risk_milestone_refs"].get(risk_id, [])
    linked_gates = context["risk_gate_refs"].get(risk_id, [])
    affected_task_refs = context["risk_task_refs"].get(risk_id, [])
    affected_dependency_refs = context["risk_dependency_refs"].get(risk_id, [])

    row = {
        "risk_id": risk_id,
        "risk_title": risk_title(risk_id, source_row["preferred_term"]),
        "risk_class": risk_class_for_id(risk_id),
        "source_type": "derived_gap_closure",
        "source_refs": source_refs,
        "finding_refs": finding_refs,
        "problem_statement": source_row["canonical_winner"]["normalized_wording"],
        "failure_mode": source_row["open_risks"][0] if source_row.get("open_risks") else source_row["preferred_term"],
        "leading_indicators": unique(
            [
                source_row.get("lint_rule_hint", ""),
                f"Missing evidence class: {source_row['required_evidence_classes'][0]}" if source_row.get("required_evidence_classes") else "",
                f"Runtime tuple drift across {source_row['required_runtime_publication_tuples'][0]}" if source_row.get("required_runtime_publication_tuples") else "",
            ]
        ),
        "trigger_conditions": unique(
            [
                "Summary or architecture text compresses the canonical control into generic prose.",
                "A gate or release tuple remains green while the stronger canonical primitive is absent from evidence.",
                "A current-baseline flow relies on publication or shell posture that the canonical winner says must fail closed.",
            ]
        ),
        "affected_phase_refs": source_row.get("affected_phases", []),
        "affected_requirement_ids": requirement_ids,
        "affected_task_refs": affected_task_refs,
        "affected_gate_refs": linked_gates,
        "affected_dependency_refs": affected_dependency_refs,
        "affected_persona_refs": [],
        "affected_channel_refs": [],
        "current_control_refs": unique(
            source_row.get("required_evidence_classes", [])
            + source_row.get("required_runtime_publication_tuples", [])
            + linked_milestones
            + linked_gates
        )[:10],
        "mitigation_actions": unique(
            [
                source_row["canonical_winner"]["normalized_wording"],
                source_row.get("lint_rule_hint", ""),
                f"Keep linked gates blocked until {source_row['preferred_term']} is represented in current evidence." if linked_gates else "",
            ]
        ),
        "contingency_actions": [
            "Freeze writable or calm posture and fall back to the last authoritative summary or read-only state.",
            "Escalate to architecture or release review instead of inventing route-local exceptions.",
        ],
        "linked_milestone_refs": linked_milestones,
        "notes": f"{source_row['classification']} risk carried forward from seq_002 summary reconciliation.",
    }
    return enrich_common_fields(row, prereqs, context)


def build_hazard_risk(risk_id: str, source_row: dict[str, str], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    workstream_ids = [value.strip() for value in source_row.get("primary_workstream_ids", "").split(";") if value.strip()]
    workstream_controls = [workstream_id for workstream_id in workstream_ids if workstream_id in context["workstreams_by_id"]]
    source_refs = [ref.strip() for ref in source_row.get("source_refs", "").split(";") if ref.strip()]
    linked_milestones = context["risk_milestone_refs"].get(risk_id, [])
    linked_gates = context["risk_gate_refs"].get(risk_id, [])
    row = {
        "risk_id": risk_id,
        "risk_title": source_row["hazard_title"],
        "risk_class": risk_class_for_id(risk_id),
        "source_type": "assurance_workstream",
        "source_refs": source_refs,
        "finding_refs": extract_finding_refs(source_refs),
        "problem_statement": source_row["description"],
        "failure_mode": source_row["potential_harms"],
        "leading_indicators": [
            value.strip()
            for value in source_row.get("required_evidence", "").split(";")
            if value.strip()
        ],
        "trigger_conditions": [
            value.strip()
            for value in source_row.get("initiating_change_classes", "").split(";")
            if value.strip()
        ],
        "affected_phase_refs": [milestone["source_phase_refs"][0] for milestone_id, milestone in context["milestones_by_id"].items() if milestone_id in linked_milestones],
        "affected_requirement_ids": resolve_requirement_ids(
            prereqs["requirement_index"],
            [source_row["hazard_title"], source_row["description"]],
        ),
        "affected_task_refs": context["risk_task_refs"].get(risk_id, []),
        "affected_gate_refs": linked_gates,
        "affected_dependency_refs": context["risk_dependency_refs"].get(risk_id, []),
        "affected_persona_refs": [],
        "affected_channel_refs": [],
        "current_control_refs": unique(
            [value.strip() for value in source_row.get("required_controls", "").split(";") if value.strip()]
            + [value.strip() for value in source_row.get("required_evidence", "").split(";") if value.strip()]
            + workstream_controls
        ),
        "control_strength": "partial",
        "mitigation_actions": unique(
            [
                value.strip()
                for value in (
                    source_row.get("required_controls", "") + ";" + source_row.get("required_evidence", "")
                ).split(";")
                if value.strip()
            ]
            + workstream_controls
        ),
        "contingency_actions": [
            "Hold the linked gate and keep the experience in explicit safety-review or recovery posture.",
            "Escalate through the named safety and privacy signoff chain before widening writable actions.",
        ],
        "owner_role": source_row.get("required_independent_signoff", "").split(";")[0].strip() or "ROLE_MANUFACTURER_CSO",
        "status": "mitigating",
        "linked_milestone_refs": linked_milestones,
        "notes": "Mandatory seed hazard carried forward as a live risk row and gate input.",
    }
    return enrich_common_fields(row, prereqs, context)


def build_issue_risk(risk_id: str, source_row: dict[str, Any], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    related_adrs = [
        adr
        for adr in prereqs["adr_index"]["adrs"]
        if adr["adr_id"] in source_row.get("linked_adr_ids", [])
    ]
    task_refs = unique(flatten([adr.get("required_follow_on_task_refs", []) for adr in related_adrs])) or ["seq_016", "seq_017", "seq_018", "seq_020"]
    row = {
        "risk_id": risk_id,
        "risk_title": source_row["title"],
        "risk_class": risk_class_for_id(risk_id),
        "source_type": "derived_gap_closure",
        "source_refs": source_row.get("source_refs", []),
        "finding_refs": extract_finding_refs(source_row.get("source_refs", [])),
        "problem_statement": source_row["summary"],
        "failure_mode": source_row["title"],
        "leading_indicators": [
            f"ADR set or control pack no longer covers {source_row['title'].lower()}",
            "Later tasks stop carrying the issue into risk or gate inputs",
        ],
        "trigger_conditions": [
            "A gate or release tuple no longer points to the ADR or machine-readable control that originally resolved the issue.",
        ],
        "affected_phase_refs": unique(flatten([adr.get("affected_phase_refs", []) for adr in related_adrs])) or ["planning"],
        "affected_requirement_ids": unique(flatten([adr.get("linked_requirement_ids", []) for adr in related_adrs])),
        "affected_task_refs": task_refs,
        "affected_gate_refs": [],
        "affected_dependency_refs": [],
        "affected_persona_refs": [],
        "affected_channel_refs": [],
        "current_control_refs": unique(source_row.get("linked_adr_ids", [])),
        "control_strength": "strong" if source_row["status"] == "resolved" else "partial",
        "mitigation_actions": [
            source_row["summary"],
            "Keep the linked ADRs and validators in the gate evidence chain.",
        ],
        "contingency_actions": [
            "Fail the affected gate and re-open the linked ADR validation obligation.",
        ],
        "owner_role": "ROLE_PROGRAMME_ARCHITECT",
        "status": {
            "resolved": "retired",
            "open": "open",
            "deferred": "accepted_with_guardrails",
        }[source_row["status"]],
        "linked_milestone_refs": [],
        "notes": f"Inherited from seq_016 architecture gap register with status {source_row['status']}.",
    }
    return enrich_common_fields(row, prereqs, context)


def build_adr_risk(risk_id: str, adrs: list[dict[str, Any]], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    source_refs = unique(flatten([adr.get("source_refs", []) for adr in adrs]))
    linked_tasks = unique(flatten([adr.get("required_follow_on_task_refs", []) for adr in adrs]))
    linked_requirements = unique(flatten([adr.get("linked_requirement_ids", []) for adr in adrs]))
    affected_phases = unique(flatten([adr.get("affected_phase_refs", []) for adr in adrs]))
    contracts = unique(flatten([adr.get("linked_contract_refs", []) for adr in adrs]))
    obligations = unique(flatten([adr.get("validation_obligations", []) for adr in adrs]))
    row = {
        "risk_id": risk_id,
        "risk_title": risk_title(risk_id, adrs[0]["title"]),
        "risk_class": risk_class_for_id(risk_id),
        "source_type": "adr",
        "source_refs": source_refs,
        "finding_refs": extract_finding_refs(source_refs) + ([risk_id] if risk_id.startswith("FINDING_") else []),
        "problem_statement": unique([adr["decision"] for adr in adrs])[0],
        "failure_mode": "Accepted architecture decisions drift back into implementation shortcuts or local truth.",
        "leading_indicators": obligations[:3] or ["Linked ADR validation obligations are missing from the current plan."],
        "trigger_conditions": [
            "A follow-on task omits the ADR contract from its gate or evidence pack.",
            "A later phase or release tuple reintroduces the rejected alternative.",
        ],
        "affected_phase_refs": affected_phases,
        "affected_requirement_ids": linked_requirements,
        "affected_task_refs": linked_tasks,
        "affected_gate_refs": [],
        "affected_dependency_refs": [],
        "affected_persona_refs": [],
        "affected_channel_refs": [],
        "current_control_refs": unique([adr["adr_id"] for adr in adrs] + contracts),
        "control_strength": "partial",
        "mitigation_actions": obligations[:4] or ["Carry the ADR decision into the linked implementation, traceability, and gate tasks."],
        "contingency_actions": [
            "Block the next gate and force explicit exception review if the ADR contract is no longer satisfied.",
        ],
        "owner_role": "ROLE_PROGRAMME_ARCHITECT",
        "status": "watching",
        "linked_milestone_refs": [],
        "notes": f"Derived from {', '.join(adr['adr_id'] for adr in adrs)}.",
    }
    return enrich_common_fields(row, prereqs, context)


def build_manual_risk(spec: dict[str, Any], prereqs: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    row = {
        "risk_title": risk_title(spec["risk_id"]),
        "risk_class": risk_class_for_id(spec["risk_id"]),
        **spec,
        "linked_milestone_refs": unique(
            flatten(
                [
                    context["dependency_milestone_refs"].get(dep_id, [])
                    for dep_id in spec.get("affected_dependency_refs", [])
                ]
            )
        ),
    }
    return enrich_common_fields(row, prereqs, context)


def build_risk_rows(prereqs: dict[str, Any], context: dict[str, Any]) -> list[dict[str, Any]]:
    programme_risk_ids = set(context["risk_milestone_refs"]) | set(context["risk_gate_refs"])
    issue_risk_ids = set(context["issue_by_id"])
    adr_risk_ids = set(context["adr_risk_map"])
    all_risk_ids = sorted(programme_risk_ids | issue_risk_ids | adr_risk_ids | {row["risk_id"] for row in MANUAL_EXTRA_RISKS})

    risk_rows: list[dict[str, Any]] = []
    manual_by_id = {row["risk_id"]: row for row in MANUAL_EXTRA_RISKS}
    for risk_id in all_risk_ids:
        if risk_id in manual_by_id:
            risk_rows.append(build_manual_risk(manual_by_id[risk_id], prereqs, context))
            continue
        if risk_id in context["hazard_by_id"]:
            risk_rows.append(build_hazard_risk(risk_id, context["hazard_by_id"][risk_id], prereqs, context))
            continue
        if risk_id in context["issue_by_id"]:
            risk_rows.append(build_issue_risk(risk_id, context["issue_by_id"][risk_id], prereqs, context))
            continue
        if risk_id in context["summary_risk_rows"]:
            risk_rows.append(build_summary_risk(risk_id, context["summary_risk_rows"][risk_id], prereqs, context))
            continue
        if risk_id in context["adr_risk_map"]:
            risk_rows.append(build_adr_risk(risk_id, context["adr_risk_map"][risk_id], prereqs, context))
            continue
        raise SystemExit(f"GAP_018_UNMAPPED_RISK_ID: {risk_id}")

    risk_rows.sort(key=lambda row: (-row["risk_score"], row["risk_id"]))
    return risk_rows


def dependency_type_for_external(dep: dict[str, Any]) -> str:
    dep_class = dep["dependency_class"]
    if dep_class in {"identity_auth", "embedded_channel"}:
        return "external_approval"
    if dep_class in {"booking_supplier", "gp_system", "pharmacy_directory", "pharmacy_outcome", "pharmacy_transport"}:
        return "supplier_capability"
    if dep_class == "content_or_standards_source":
        return "standards_baseline"
    return "external_service"


def dependency_state_for_external(dep: dict[str, Any]) -> str:
    scope = BASE_SCOPE_MAP[dep["baseline_scope"]]
    if scope == "deferred":
        return "deferred"
    if scope == "optional" and dep.get("simulator_allowed") in {"yes", "partial"}:
        return "replaceable_by_simulator"
    if dep["dependency_class"] == "content_or_standards_source":
        return "current"
    if dep.get("blocked_by_prior_approval_or_contract"):
        return "onboarding"
    if dep.get("simulator_allowed") in {"yes", "partial"}:
        return "planned"
    return "current"


def blast_radius_for_external(dep: dict[str, Any]) -> str:
    dep_class = dep["dependency_class"]
    if dep_class == "identity_auth":
        return "patient authentication, writable posture, and recovery continuity"
    if dep_class in {"booking_supplier", "gp_system"}:
        return "booking, waitlist, and provider confirmation truth"
    if dep_class.startswith("pharmacy_"):
        return "pharmacy referral, dispatch proof, and closure posture"
    if dep_class in {"telephony", "transcription"}:
        return "telephony ingress, evidence readiness, and callback repair"
    if dep_class in {"sms", "email"}:
        return "notification, secure-link, and patient reassurance posture"
    if dep_class == "messaging_transport":
        return "cross-organisation messaging and hub coordination"
    if dep_class == "embedded_channel":
        return "deferred embedded channel readiness and publication control"
    if dep_class == "content_or_standards_source":
        return "standards posture, governance evidence, and release gating"
    return "partner-facing capability and current-baseline delivery"


def build_external_watch_row(dep: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    dependency_id = dep["dependency_id"]
    baseline_scope = BASE_SCOPE_MAP[dep["baseline_scope"]]
    lifecycle_state = dependency_state_for_external(dep)
    milestone_refs = context["dependency_milestone_refs"].get(dependency_id, [])
    gate_refs = context["dependency_gate_refs"].get(dependency_id, [])
    monitoring_signals = unique(
        [dep["authoritative_success_proof"]]
        + dep.get("non_authoritative_signals", [])[:2]
        + dep.get("manual_checkpoints", [])[:1]
    )[:4]
    return {
        "dependency_id": dependency_id,
        "dependency_name": dep["dependency_name"],
        "dependency_type": dependency_type_for_external(dep),
        "baseline_scope": baseline_scope,
        "source_refs": unique(dep.get("source_file_refs", [])),
        "linked_external_inventory_refs": [dependency_id],
        "linked_adapter_profile_refs": [dep["adapter_contract_family"]] if dep.get("adapter_contract_family") else [],
        "linked_standards_watch_refs": ["StandardsDependencyWatchlist"] if dep["dependency_class"] == "content_or_standards_source" else [],
        "lifecycle_state": lifecycle_state,
        "required_for_milestone_refs": milestone_refs,
        "required_for_gate_refs": gate_refs,
        "blast_radius_scope": blast_radius_for_external(dep),
        "monitoring_signals": monitoring_signals,
        "degradation_mode": "; ".join(dep.get("ambiguity_modes", [])[:2]) or "degradation_not_yet_classified",
        "fallback_strategy": "; ".join(dep.get("fallback_or_recovery_modes", [])[:2] or [dep.get("local_stub_strategy", "")]).strip(),
        "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD" if dep["dependency_class"] == "content_or_standards_source" else "ROLE_INTEROPERABILITY_LEAD",
        "next_review_ref": gate_refs[0] if gate_refs else (milestone_refs[0] if milestone_refs else "seq_040"),
        "notes": dep.get("notes", ""),
    }


def build_dependency_watchlist(context: dict[str, Any]) -> list[dict[str, Any]]:
    rows = [build_external_watch_row(dep, context) for dep in context["dependency_by_id"].values()]
    rows.extend(INTERNAL_DEPENDENCY_ROWS)
    rows.sort(key=lambda row: (row["baseline_scope"], row["dependency_id"]))
    return rows


def inject_dependency_states(risk_rows: list[dict[str, Any]], dependency_rows: list[dict[str, Any]]) -> None:
    state_by_dependency = {row["dependency_id"]: row["lifecycle_state"] for row in dependency_rows}
    for risk_row in risk_rows:
        risk_row["dependency_lifecycle_states"] = unique(
            [state_by_dependency[dep_id] for dep_id in risk_row["affected_dependency_refs"] if dep_id in state_by_dependency]
        )


def build_risk_task_links(risk_rows: list[dict[str, Any]], tasks_by_ref: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for risk in risk_rows:
        for task_ref in risk["affected_task_refs"]:
            task = tasks_by_ref.get(task_ref)
            if not task:
                continue
            rows.append(
                {
                    "risk_id": risk["risk_id"],
                    "risk_title": risk["risk_title"],
                    "task_id": task_ref,
                    "task_title": task["title"],
                    "task_phase_ref": task["phase_ref"],
                    "risk_class": risk["risk_class"],
                    "risk_status": risk["status"],
                    "critical_path_relevance": risk["critical_path_relevance"],
                    "link_reason": "Affected task mitigates, gates, or is exposed by the risk.",
                }
            )
    rows.sort(key=lambda row: (row["task_id"], row["risk_id"]))
    return rows


def build_risk_gate_links(risk_rows: list[dict[str, Any]], gates_by_id: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for risk in risk_rows:
        for gate_ref in risk["affected_gate_refs"]:
            gate = gates_by_id.get(gate_ref)
            if not gate:
                continue
            rows.append(
                {
                    "risk_id": risk["risk_id"],
                    "risk_title": risk["risk_title"],
                    "gate_id": gate_ref,
                    "gate_title": gate["gate_title"],
                    "gate_type": gate["gate_type"],
                    "baseline_scope": gate["baseline_scope"],
                    "risk_class": risk["risk_class"],
                    "gate_impact": risk["gate_impact"],
                    "link_reason": "Gate cannot be considered green while this linked risk remains blocking or watchlisted.",
                }
            )
    rows.sort(key=lambda row: (row["gate_id"], row["risk_id"]))
    return rows


def build_forensic_finding_coverage(risk_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    coverage_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for risk in risk_rows:
        for finding_id in risk["finding_refs"]:
            coverage_map[finding_id].append(risk)
    rows: list[dict[str, Any]] = []
    for finding_id in REQUIRED_FINDING_IDS:
        risks = coverage_map.get(finding_id, [])
        status = "missing"
        if risks:
            if any(risk["status"] in {"open", "mitigating"} for risk in risks):
                status = "open_or_mitigating"
            elif any(risk["status"] == "accepted_with_guardrails" for risk in risks):
                status = "accepted_with_guardrails"
            elif all(risk["status"] == "retired" for risk in risks):
                status = "closed_control"
            else:
                status = "watching"
        rows.append(
            {
                "finding_id": finding_id,
                "risk_ids": [risk["risk_id"] for risk in risks],
                "status": status,
            }
        )
    return rows


def build_heatmap_payload(risk_rows: list[dict[str, Any]], dependency_rows: list[dict[str, Any]]) -> dict[str, Any]:
    def max_impact(row: dict[str, Any]) -> str:
        values = [
            row["impact_patient_safety"],
            row["impact_service"],
            row["impact_privacy"],
            row["impact_delivery"],
            row["impact_release"],
        ]
        return max(values, key=lambda value: IMPACT_SCORE[value])

    cells: list[dict[str, Any]] = []
    for likelihood in ["low", "medium", "high", "extreme"]:
        for impact in ["low", "medium", "high", "extreme"]:
            matching = [
                row["risk_id"]
                for row in risk_rows
                if row["likelihood"] == likelihood and max_impact(row) == impact
            ]
            cells.append(
                {
                    "likelihood": likelihood,
                    "impact": impact,
                    "risk_count": len(matching),
                    "risk_ids": matching,
                    "sample_risk_id": matching[0] if matching else "",
                }
            )

    return {
        "heatmap_id": "vecells_master_risk_heatmap_v1",
        "summary": {
            "risk_count": len(risk_rows),
            "open_count": sum(1 for row in risk_rows if row["status"] in {"open", "mitigating", "watching"}),
            "blocking_count": sum(1 for row in risk_rows if row["gate_impact"] == "blocking"),
            "critical_path_count": sum(1 for row in risk_rows if row["critical_path_relevance"] == "on_path"),
            "dependency_current_count": sum(1 for row in dependency_rows if row["lifecycle_state"] == "current"),
            "dependency_degraded_or_blocked_count": sum(1 for row in dependency_rows if row["lifecycle_state"] in {"degraded", "blocked"}),
        },
        "cells": cells,
        "class_counts": dict(sorted(Counter(row["risk_class"] for row in risk_rows).items())),
        "status_counts": dict(sorted(Counter(row["status"] for row in risk_rows).items())),
        "dependency_state_counts": dict(sorted(Counter(row["lifecycle_state"] for row in dependency_rows).items())),
    }


def build_dependency_watchlist_payload(dependency_rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "watchlist_id": "vecells_dependency_watchlist_v1",
        "mission": "Merge external onboarding, supplier capability, standards hygiene, release-control seams, and runbook dependencies into one reviewable watchlist.",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "dependency_count": len(dependency_rows),
            "current_count": sum(1 for row in dependency_rows if row["baseline_scope"] == "current"),
            "deferred_count": sum(1 for row in dependency_rows if row["baseline_scope"] == "deferred"),
            "optional_count": sum(1 for row in dependency_rows if row["baseline_scope"] == "optional"),
            "lifecycle_counts": dict(sorted(Counter(row["lifecycle_state"] for row in dependency_rows).items())),
            "type_counts": dict(sorted(Counter(row["dependency_type"] for row in dependency_rows).items())),
        },
        "assumptions": ASSUMPTIONS,
        "dependencies": dependency_rows,
    }


def build_master_risk_payload(risk_rows: list[dict[str, Any]], dependency_rows: list[dict[str, Any]], finding_coverage: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "register_id": "vecells_master_risk_register_v1",
        "mission": "Merge architecture, product, external, assurance, operational, standards, and release posture into one authoritative master risk register.",
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "summary": {
            "risk_count": len(risk_rows),
            "open_or_mitigating_count": sum(1 for row in risk_rows if row["status"] in {"open", "mitigating", "watching"}),
            "high_or_extreme_count": sum(1 for row in risk_rows if row["likelihood"] in {"high", "extreme"}),
            "blocking_gate_impact_count": sum(1 for row in risk_rows if row["gate_impact"] == "blocking"),
            "critical_path_count": sum(1 for row in risk_rows if row["critical_path_relevance"] == "on_path"),
            "class_counts": dict(sorted(Counter(row["risk_class"] for row in risk_rows).items())),
            "status_counts": dict(sorted(Counter(row["status"] for row in risk_rows).items())),
            "owner_counts": dict(sorted(Counter(row["owner_role"] for row in risk_rows).items())),
        },
        "dependency_health_summary": build_dependency_watchlist_payload(dependency_rows)["summary"],
        "forensic_finding_coverage": finding_coverage,
        "risks": risk_rows,
    }


def render_master_register_doc(payload: dict[str, Any]) -> str:
    rows = payload["risks"]
    top_rows = rows[:12]
    class_rows = [[risk_class, count] for risk_class, count in payload["summary"]["class_counts"].items()]
    top_table = [
        [
            row["risk_id"],
            row["risk_title"],
            row["risk_class"],
            row["status"],
            row["gate_impact"],
            row["critical_path_relevance"],
            row["risk_score"],
            row["owner_role"],
        ]
        for row in top_rows
    ]
    finding_rows = [
        [row["finding_id"], row["status"], ", ".join(row["risk_ids"]) or "-"]
        for row in payload["forensic_finding_coverage"]
    ]
    return textwrap.dedent(
        f"""
        # 18 Master Risk Register

        Seq_018 consolidates the Vecells risk posture across the blueprint corpus, forensic findings, ADR freeze, external dependency inventory, workstream pack, tooling baseline, and programme gate model.

        ## Summary

        - Total risks: {payload["summary"]["risk_count"]}
        - Open, watching, or mitigating: {payload["summary"]["open_or_mitigating_count"]}
        - Blocking gate impact: {payload["summary"]["blocking_gate_impact_count"]}
        - Critical-path relevant: {payload["summary"]["critical_path_count"]}

        ## Risk Classes

        {render_table(["Risk class", "Count"], class_rows)}

        ## Highest-Score Risks

        {render_table(
            ["Risk", "Title", "Class", "Status", "Gate impact", "Path", "Score", "Owner"],
            top_table,
        )}

        ## Required Forensic Coverage

        {render_table(["Finding", "Coverage status", "Mapped risks"], finding_rows)}

        ## Notes

        - Risks linked to critical-path milestones or critical gates are explicitly scored and marked so later gate tasks can fail closed.
        - Resolved architecture gaps remain present as retired or guarded rows so seq_020 can still consume them as evidence.
        - Simulator or manual fallback never upgrades a dependency to fully healthy status.
        """
    ).strip()


def render_dependency_watchlist_doc(payload: dict[str, Any]) -> str:
    rows = payload["dependencies"]
    current_rows = [row for row in rows if row["baseline_scope"] == "current"][:16]
    lifecycle_rows = [[state, count] for state, count in payload["summary"]["lifecycle_counts"].items()]
    current_table = [
        [
            row["dependency_id"],
            row["dependency_name"],
            row["dependency_type"],
            row["lifecycle_state"],
            row["owner_role"],
            row["next_review_ref"],
        ]
        for row in current_rows
    ]
    return textwrap.dedent(
        f"""
        # 18 Dependency Watchlist

        The dependency watchlist merges external onboarding, supplier capability, standards hygiene, security seams, and restore or alerting runbook dependencies into one machine-readable posture.

        ## Summary

        - Total dependencies: {payload["summary"]["dependency_count"]}
        - Current baseline: {payload["summary"]["current_count"]}
        - Deferred: {payload["summary"]["deferred_count"]}
        - Optional: {payload["summary"]["optional_count"]}

        ## Lifecycle Distribution

        {render_table(["Lifecycle state", "Count"], lifecycle_rows)}

        ## Current-Baseline Watch Rows

        {render_table(["Dependency", "Name", "Type", "State", "Owner", "Next review"], current_table)}

        ## Watch Rules

        - `current` means the dependency is in the baseline and has an explicit health signal and fallback posture.
        - `onboarding` means the dependency is required but still approval- or provisioning-bound.
        - `replaceable_by_simulator` means the baseline can continue with governed simulator or manual fallback, but the row remains watchlisted.
        - `blocked` means a current-baseline release or gate cannot go green without resolving the seam.
        """
    ).strip()


def render_treatment_doc(risk_rows: list[dict[str, Any]]) -> str:
    treatment_rows = [
        [
            row["risk_id"],
            row["status"],
            row["control_strength"],
            row["target_due_ref"],
            row["owner_role"],
            row["mitigation_actions"][0] if row["mitigation_actions"] else "",
            row["contingency_actions"][0] if row["contingency_actions"] else "",
        ]
        for row in risk_rows[:18]
    ]
    return textwrap.dedent(
        f"""
        # 18 Risk Treatment Matrix

        {render_table(
            ["Risk", "Status", "Control strength", "Target due ref", "Owner", "Primary mitigation", "Primary contingency"],
            treatment_rows,
        )}

        ## Treatment Discipline

        - `open` means the risk is still materially live and needs explicit mitigation before the named due reference.
        - `watching` means a control exists but later tasks and gates must keep consuming it.
        - `mitigating` means the current plan is actively reducing exposure but the gate remains sensitive to drift.
        - `accepted_with_guardrails` is allowed only for deferred or explicitly bounded non-baseline exposure.
        - `retired` means the control moved from generic risk into a machine-readable closed control, but the row remains traceable.
        """
    ).strip()


def render_review_model_doc(risk_payload: dict[str, Any], dependency_payload: dict[str, Any]) -> str:
    owner_rows = [[owner, count] for owner, count in risk_payload["summary"]["owner_counts"].items()]
    dependency_types = [[dep_type, count] for dep_type, count in dependency_payload["summary"]["type_counts"].items()]
    return textwrap.dedent(
        f"""
        # 18 Risk Review Operating Model

        This review model makes risks and dependency watch posture consumable by planning, release, and assurance gates without re-reading the whole corpus.

        ## Risk Ownership Split

        {render_table(["Owner role", "Risk count"], owner_rows)}

        ## Dependency Ownership Split

        {render_table(["Dependency type", "Count"], dependency_types)}

        ## Review Cadence

        - Weekly programme risk review: open, mitigating, and blocked current-baseline rows.
        - Gate-preparation review: every risk with `gate_impact = blocking` or `critical_path_relevance = on_path`.
        - External dependency review: onboarding, blocked, and replaceable-by-simulator rows before external-readiness and Phase 0 long-lead gates.
        - Release and resilience review: release, resilience, dependency-hygiene, HSM, alert-routing, and restore-rehearsal rows before release readiness and BAU handover.
        """
    ).strip()


def render_decision_log_doc(risk_rows: list[dict[str, Any]], dependency_rows: list[dict[str, Any]]) -> str:
    notable_risks = [row for row in risk_rows if row["status"] in {"retired", "accepted_with_guardrails"}][:12]
    decision_rows = [
        [row["risk_id"], row["status"], row["notes"], row["target_due_ref"]]
        for row in notable_risks
    ]
    internal_dependencies = [row for row in dependency_rows if not row["linked_external_inventory_refs"]]
    internal_rows = [
        [row["dependency_id"], row["dependency_name"], row["lifecycle_state"], row["notes"]]
        for row in internal_dependencies
    ]
    return textwrap.dedent(
        f"""
        # 18 Watchlist Decision Log

        ## Register Decisions

        {render_table(["Risk or gap", "Status", "Decision note", "Due ref"], decision_rows)}

        ## Internal Dependency Rows Added In Seq_018

        {render_table(["Dependency", "Name", "State", "Notes"], internal_rows)}

        ## Assumptions

        {render_table(
            ["Assumption", "Decision"],
            [[row["assumption_id"], row["decision"]] for row in ASSUMPTIONS],
        )}
        """
    ).strip()


def build_html(payload: dict[str, Any]) -> str:
    return textwrap.dedent(
        """\
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Vecells Risk Watchtower</title>
          <link rel="icon" href="data:," />
          <style>
            :root {
              color-scheme: light;
              --canvas: #F5F7FA;
              --shell: #FFFFFF;
              --inset: #EEF2F6;
              --text-strong: #101828;
              --text-default: #1D2939;
              --text-muted: #475467;
              --border-subtle: #E4E7EC;
              --border-default: #D0D5DD;
              --watch: #335CFF;
              --warning: #B54708;
              --critical: #B42318;
              --healthy: #027A48;
              --muted-watch: #667085;
              --shadow: 0 18px 44px rgba(16, 24, 40, 0.08);
              --ring: 0 0 0 2px rgba(51, 92, 255, 0.18);
            }

            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
            body { min-height: 100vh; }
            .page { max-width: 1440px; margin: 0 auto; padding: 24px; }
            .summary-band {
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,251,252,0.98));
              border: 1px solid var(--border-default);
              border-radius: 28px;
              padding: 24px;
              box-shadow: var(--shadow);
              display: grid;
              gap: 20px;
            }
            .summary-top {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 20px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .brand svg { width: 48px; height: 48px; }
            .brand h1 { margin: 0; font-size: 1.7rem; color: var(--text-strong); }
            .brand p { margin: 2px 0 0; color: var(--text-muted); max-width: 780px; }
            .chip-row, .stats, .filters, .state-strip, .selection-strip { display: flex; flex-wrap: wrap; gap: 10px; }
            .chip, .state-chip, .selection-strip span {
              min-height: 28px;
              border-radius: 999px;
              border: 1px solid var(--border-default);
              padding: 6px 10px;
              background: var(--inset);
              font-size: 0.85rem;
            }
            .chip.watch, .state-chip.watch { border-color: rgba(51, 92, 255, 0.28); color: var(--watch); }
            .chip.blocked, .state-chip.blocked { border-color: rgba(180, 35, 24, 0.28); color: var(--critical); }
            .chip.healthy, .state-chip.healthy { border-color: rgba(2, 122, 72, 0.28); color: var(--healthy); }
            .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .stat {
              background: var(--shell);
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
              padding: 14px 16px;
            }
            .stat strong { display: block; color: var(--text-strong); font-size: 1.3rem; margin-bottom: 4px; }
            .filters label { display: grid; gap: 6px; font-size: 0.85rem; color: var(--text-muted); }
            .filters select {
              min-height: 44px;
              min-width: 180px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              padding: 0 12px;
              background: var(--shell);
              color: var(--text-default);
            }
            .workspace {
              margin-top: 20px;
              display: grid;
              grid-template-columns: minmax(0, 1fr) 380px;
              gap: 20px;
              align-items: start;
            }
            .main {
              display: grid;
              gap: 20px;
            }
            .panel {
              background: var(--shell);
              border: 1px solid var(--border-default);
              border-radius: 24px;
              box-shadow: var(--shadow);
            }
            .panel-header {
              padding: 18px 20px 0;
            }
            .panel-header h2 { margin: 0; font-size: 1.05rem; color: var(--text-strong); }
            .panel-header p { margin: 6px 0 0; color: var(--text-muted); font-size: 0.9rem; }
            .visual-grid {
              display: grid;
              grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
              gap: 20px;
            }
            .heatmap-panel, .dependency-panel { min-height: 420px; }
            .heatmap-grid {
              padding: 18px 20px 20px;
              display: grid;
              grid-template-columns: 90px repeat(4, minmax(0, 1fr));
              gap: 8px;
              min-height: 420px;
            }
            .axis-label {
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--text-muted);
              font-size: 0.82rem;
              background: var(--inset);
              border-radius: 14px;
              border: 1px solid var(--border-subtle);
            }
            .heat-cell {
              min-height: 88px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.95));
              display: grid;
              gap: 4px;
              place-content: center;
              padding: 10px;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
            }
            .heat-cell strong { font-size: 1.25rem; color: var(--text-strong); }
            .heat-cell small { color: var(--text-muted); text-align: center; }
            .heat-cell.has-risk { background: linear-gradient(180deg, rgba(255, 245, 245, 0.98), rgba(255, 238, 236, 0.98)); }
            .heat-cell.medium { background: linear-gradient(180deg, rgba(255, 249, 240, 0.98), rgba(255, 244, 226, 0.98)); }
            .heat-cell.low { background: linear-gradient(180deg, rgba(245, 247, 250, 0.98), rgba(238, 242, 246, 0.98)); }
            .dependency-panel-inner { padding: 18px 20px 20px; display: grid; gap: 14px; min-height: 420px; }
            .dependency-list {
              display: grid;
              gap: 10px;
              align-content: start;
              max-height: 500px;
              overflow: auto;
              padding-right: 4px;
            }
            .dependency-button {
              text-align: left;
              width: 100%;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: var(--shell);
              padding: 14px;
              display: grid;
              gap: 6px;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
            }
            .dependency-button strong { color: var(--text-strong); }
            .dependency-button .meta, .risk-button .meta { display: flex; flex-wrap: wrap; gap: 8px; color: var(--text-muted); font-size: 0.82rem; }
            .risk-table-wrap { padding: 12px 16px 18px; overflow: auto; }
            table { width: 100%; border-collapse: collapse; min-width: 980px; }
            th, td {
              padding: 12px 10px;
              border-bottom: 1px solid var(--border-subtle);
              text-align: left;
              vertical-align: top;
              font-size: 0.9rem;
            }
            th { color: var(--text-muted); font-weight: 600; }
            .risk-button {
              width: 100%;
              text-align: left;
              border: 0;
              background: transparent;
              padding: 0;
              cursor: pointer;
              color: inherit;
              display: grid;
              gap: 4px;
            }
            .risk-button strong { color: var(--text-strong); }
            .inspector {
              position: sticky;
              top: 24px;
              min-height: 720px;
              padding: 20px;
              display: grid;
              gap: 14px;
            }
            .inspector h2 { margin: 0; color: var(--text-strong); }
            .inspector p { margin: 0; color: var(--text-muted); }
            .detail-grid { display: grid; gap: 12px; }
            .detail-row {
              display: grid;
              gap: 6px;
              padding: 12px 14px;
              border-radius: 18px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
            }
            .detail-row strong { color: var(--text-strong); }
            .detail-row code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 0.82rem;
              white-space: pre-wrap;
            }
            button:focus-visible, select:focus-visible {
              outline: none;
              box-shadow: var(--ring);
              border-color: rgba(51, 92, 255, 0.45);
            }
            .is-selected { border-color: rgba(51, 92, 255, 0.45) !important; box-shadow: var(--ring); transform: translateY(-1px); }
            .empty {
              color: var(--text-muted);
              padding: 16px;
              border: 1px dashed var(--border-default);
              border-radius: 18px;
              background: var(--inset);
            }
            @media (max-width: 1180px) {
              .workspace { grid-template-columns: 1fr; }
              .inspector { position: relative; top: 0; min-height: auto; }
            }
            @media (max-width: 980px) {
              .visual-grid { grid-template-columns: 1fr; }
              .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 800px) {
              .page { padding: 16px; }
              .summary-top { flex-direction: column; }
              .stats { grid-template-columns: 1fr; }
              .filters { flex-direction: column; }
              .filters label { width: 100%; }
              .filters select { width: 100%; min-width: 0; }
              .heatmap-grid { grid-template-columns: 72px repeat(4, minmax(0, 1fr)); }
            }
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <section class="summary-band" data-testid="risk-summary-band">
              <div class="summary-top">
                <div class="brand">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="4" y="4" width="40" height="40" rx="14" fill="#335CFF"></rect>
                    <path d="M16 17h15.5c4.1 0 7.5 3.4 7.5 7.5S35.6 32 31.5 32H20.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M16 17v15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"></path>
                  </svg>
                  <div>
                    <h1>Risk watchtower</h1>
                    <p>Signal_Sentinel merges critical-path risk, dependency posture, and gate consequence into one calm command deck.</p>
                  </div>
                </div>
                <div class="chip-row" id="summary-chips"></div>
              </div>
              <div class="stats" id="summary-stats"></div>
              <div class="filters">
                <label>
                  Risk class
                  <select id="filter-risk-class">
                    <option value="all">All risk classes</option>
                  </select>
                </label>
                <label>
                  Lifecycle state
                  <select id="filter-lifecycle">
                    <option value="all">All lifecycle states</option>
                  </select>
                </label>
                <label>
                  Critical path relevance
                  <select id="filter-path">
                    <option value="all">All path states</option>
                    <option value="on_path">On path</option>
                    <option value="near_path">Near path</option>
                    <option value="off_path">Off path</option>
                  </select>
                </label>
              </div>
            </section>

            <div class="workspace">
              <main class="main">
                <section class="visual-grid">
                  <section class="panel heatmap-panel">
                    <div class="panel-header">
                      <h2>Risk heatmap</h2>
                      <p>Likelihood versus highest impact, with direct drill-through into the selected risk row and table parity below.</p>
                    </div>
                    <div class="heatmap-grid" id="heatmap-grid" data-testid="risk-heatmap"></div>
                  </section>

                  <section class="panel dependency-panel" data-testid="dependency-watch-panel">
                    <div class="panel-header">
                      <h2>Dependency watch</h2>
                      <p>External onboarding, standards hygiene, security seams, and restore or alerting dependencies live in the same watch posture.</p>
                    </div>
                    <div class="dependency-panel-inner">
                      <div class="state-strip" id="dependency-state-strip"></div>
                      <div class="dependency-list" id="dependency-list"></div>
                    </div>
                  </section>
                </section>

                <section class="panel">
                  <div class="panel-header">
                    <h2>Master risk register</h2>
                    <p>Every row below is source-traceable, scored, linked to tasks and gates, and paired with mitigation plus contingency posture.</p>
                  </div>
                  <div class="risk-table-wrap">
                    <table data-testid="risk-table">
                      <thead>
                        <tr>
                          <th>Risk</th>
                          <th>Class</th>
                          <th>Status</th>
                          <th>Path</th>
                          <th>Gate impact</th>
                          <th>Score</th>
                          <th>Owner</th>
                          <th>Due ref</th>
                        </tr>
                      </thead>
                      <tbody id="risk-table-body"></tbody>
                    </table>
                  </div>
                </section>
              </main>

              <aside class="panel inspector" data-testid="risk-inspector">
                <h2>Inspector</h2>
                <p>Select a heatmap cell, risk row, or dependency watch row.</p>
                <div class="selection-strip" id="selection-strip"></div>
                <div class="detail-grid" id="inspector-body"></div>
              </aside>
            </div>
          </div>

          <script id="watchtower-data" type="application/json">__SAFE_JSON__</script>
          <script>
            const DATA = JSON.parse(document.getElementById("watchtower-data").textContent);
            const risks = DATA.risks;
            const dependencies = DATA.dependencies;

            const state = {
              riskClass: "all",
              lifecycle: "all",
              path: "all",
              selectedType: "risk",
              selectedId: risks[0]?.risk_id || dependencies[0]?.dependency_id || "",
            };

            const dom = {
              riskClass: document.getElementById("filter-risk-class"),
              lifecycle: document.getElementById("filter-lifecycle"),
              path: document.getElementById("filter-path"),
              summaryChips: document.getElementById("summary-chips"),
              summaryStats: document.getElementById("summary-stats"),
              heatmapGrid: document.getElementById("heatmap-grid"),
              dependencyStateStrip: document.getElementById("dependency-state-strip"),
              dependencyList: document.getElementById("dependency-list"),
              riskTableBody: document.getElementById("risk-table-body"),
              selectionStrip: document.getElementById("selection-strip"),
              inspectorBody: document.getElementById("inspector-body"),
            };

            function uniqueValues(rows, field) {
              return Array.from(new Set(rows.map((row) => row[field]).filter(Boolean))).sort();
            }

            function initFilters() {
              uniqueValues(risks, "risk_class").forEach((value) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                dom.riskClass.appendChild(option);
              });
              uniqueValues(dependencies, "lifecycle_state").forEach((value) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                dom.lifecycle.appendChild(option);
              });
              [dom.riskClass, dom.lifecycle, dom.path].forEach((select) => {
                select.addEventListener("change", () => {
                  state.riskClass = dom.riskClass.value;
                  state.lifecycle = dom.lifecycle.value;
                  state.path = dom.path.value;
                  render();
                });
              });
            }

            function filteredRisks() {
              return risks.filter((row) => {
                if (state.riskClass !== "all" && row.risk_class !== state.riskClass) return false;
                if (state.path !== "all" && row.critical_path_relevance !== state.path) return false;
                if (state.lifecycle !== "all" && !row.dependency_lifecycle_states.includes(state.lifecycle)) return false;
                return true;
              });
            }

            function filteredDependencies() {
              return dependencies.filter((row) => {
                if (state.lifecycle !== "all" && row.lifecycle_state !== state.lifecycle) return false;
                return true;
              });
            }

            function selectedRisk() {
              return risks.find((row) => row.risk_id === state.selectedId) || filteredRisks()[0] || null;
            }

            function selectedDependency() {
              return dependencies.find((row) => row.dependency_id === state.selectedId) || filteredDependencies()[0] || null;
            }

            function setSelection(type, id) {
              state.selectedType = type;
              state.selectedId = id;
              renderInspector();
              syncSelectedState();
            }

            function syncSelectedState() {
              document.querySelectorAll(".is-selected").forEach((node) => node.classList.remove("is-selected"));
              const selector = state.selectedType === "risk"
                ? `[data-risk-id="${CSS.escape(state.selectedId)}"]`
                : `[data-dependency-id="${CSS.escape(state.selectedId)}"]`;
              document.querySelectorAll(selector).forEach((node) => node.classList.add("is-selected"));
            }

            function renderSummary() {
              const visibleRisks = filteredRisks();
              const visibleDependencies = filteredDependencies();
              const openCount = visibleRisks.filter((row) => ["open", "watching", "mitigating"].includes(row.status)).length;
              const blockingCount = visibleRisks.filter((row) => row.gate_impact === "blocking").length;
              const criticalCount = visibleRisks.filter((row) => row.critical_path_relevance === "on_path").length;
              const unhealthyDependencies = visibleDependencies.filter((row) => ["blocked", "degraded", "onboarding"].includes(row.lifecycle_state)).length;

              dom.summaryChips.innerHTML = `
                <span class="chip watch">visible risks: ${visibleRisks.length}</span>
                <span class="chip blocked">blocking gate impact: ${blockingCount}</span>
                <span class="chip watch">critical path: ${criticalCount}</span>
                <span class="chip healthy">dependencies in view: ${visibleDependencies.length}</span>
              `;
              dom.summaryStats.innerHTML = [
                ["Open or watching", openCount],
                ["Blocking risks", blockingCount],
                ["Critical-path risks", criticalCount],
                ["Dependencies needing attention", unhealthyDependencies],
              ].map(([label, value]) => `
                <div class="stat">
                  <strong>${value}</strong>
                  <span>${label}</span>
                </div>
              `).join("");
            }

            function maxImpact(row) {
              const order = { low: 1, medium: 2, high: 3, extreme: 4 };
              return [row.impact_patient_safety, row.impact_service, row.impact_privacy, row.impact_delivery, row.impact_release]
                .sort((a, b) => order[b] - order[a])[0];
            }

            function renderHeatmap() {
              const visibleRisks = filteredRisks();
              const likelihoods = ["low", "medium", "high", "extreme"];
              const impacts = ["low", "medium", "high", "extreme"];
              const cells = [];
              cells.push('<div class="axis-label"></div>');
              impacts.forEach((impact) => {
                cells.push(`<div class="axis-label">${impact}</div>`);
              });
              likelihoods.forEach((likelihood) => {
                cells.push(`<div class="axis-label">${likelihood}</div>`);
                impacts.forEach((impact) => {
                  const rows = visibleRisks.filter((row) => row.likelihood === likelihood && maxImpact(row) === impact);
                  const sample = rows[0];
                  const heatClass = rows.length >= 3 ? "has-risk" : rows.length >= 1 ? "medium" : "low";
                  cells.push(`
                    <button
                      type="button"
                      class="heat-cell ${heatClass}"
                      data-risk-id="${sample ? sample.risk_id : ""}"
                      data-risk-class="${sample ? sample.risk_class : ""}"
                      data-lifecycle-state="${sample ? sample.dependency_lifecycle_states.join(",") : ""}"
                      data-gate-impact="${sample ? sample.gate_impact : ""}"
                    >
                      <strong>${rows.length}</strong>
                      <small>${likelihood} / ${impact}</small>
                    </button>
                  `);
                });
              });
              dom.heatmapGrid.innerHTML = cells.join("");
              dom.heatmapGrid.querySelectorAll(".heat-cell").forEach((button) => {
                button.addEventListener("click", () => {
                  if (button.dataset.riskId) {
                    setSelection("risk", button.dataset.riskId);
                  }
                });
              });
            }

            function renderDependencies() {
              const rows = filteredDependencies();
              const stateCounts = rows.reduce((acc, row) => {
                acc[row.lifecycle_state] = (acc[row.lifecycle_state] || 0) + 1;
                return acc;
              }, {});
              dom.dependencyStateStrip.innerHTML = Object.entries(stateCounts).map(([label, count]) => `
                <span class="state-chip ${label === "current" ? "healthy" : label === "blocked" ? "blocked" : "watch"}">${label}: ${count}</span>
              `).join("") || '<span class="empty">No dependencies match the current lifecycle filter.</span>';
              dom.dependencyList.innerHTML = rows.map((row) => `
                <button
                  type="button"
                  class="dependency-button"
                  data-dependency-id="${row.dependency_id}"
                  data-lifecycle-state="${row.lifecycle_state}"
                >
                  <strong>${row.dependency_name}</strong>
                  <div class="meta">
                    <span>${row.dependency_type}</span>
                    <span>${row.lifecycle_state}</span>
                    <span>${row.owner_role}</span>
                  </div>
                  <span>${row.fallback_strategy}</span>
                </button>
              `).join("");
              dom.dependencyList.querySelectorAll(".dependency-button").forEach((button) => {
                button.addEventListener("click", () => setSelection("dependency", button.dataset.dependencyId));
              });
            }

            function renderRiskTable() {
              const rows = filteredRisks();
              dom.riskTableBody.innerHTML = rows.map((row) => `
                <tr
                  data-risk-id="${row.risk_id}"
                  data-risk-class="${row.risk_class}"
                  data-lifecycle-state="${row.dependency_lifecycle_states.join(",")}"
                  data-gate-impact="${row.gate_impact}"
                >
                  <td>
                    <button type="button" class="risk-button" data-risk-id="${row.risk_id}">
                      <strong>${row.risk_title}</strong>
                      <span class="meta"><span>${row.risk_id}</span><span>${row.owner_role}</span></span>
                    </button>
                  </td>
                  <td>${row.risk_class}</td>
                  <td>${row.status}</td>
                  <td>${row.critical_path_relevance}</td>
                  <td>${row.gate_impact}</td>
                  <td>${row.risk_score}</td>
                  <td>${row.owner_role}</td>
                  <td><code>${row.target_due_ref}</code></td>
                </tr>
              `).join("");
              dom.riskTableBody.querySelectorAll("[data-risk-id]").forEach((button) => {
                button.addEventListener("click", () => setSelection("risk", button.dataset.riskId));
              });
            }

            function renderInspector() {
              dom.selectionStrip.innerHTML = "";
              if (state.selectedType === "dependency") {
                const row = selectedDependency();
                if (!row) {
                  dom.inspectorBody.innerHTML = '<div class="empty">No dependency matches the current filter state.</div>';
                  return;
                }
                dom.selectionStrip.innerHTML = `
                  <span>${row.dependency_id}</span>
                  <span>${row.lifecycle_state}</span>
                  <span>${row.baseline_scope}</span>
                `;
                dom.inspectorBody.innerHTML = `
                  <div class="detail-row"><strong>Dependency</strong><span>${row.dependency_name}</span></div>
                  <div class="detail-row"><strong>Type</strong><span>${row.dependency_type}</span></div>
                  <div class="detail-row"><strong>Blast radius</strong><span>${row.blast_radius_scope}</span></div>
                  <div class="detail-row"><strong>Monitoring signals</strong><code>${row.monitoring_signals.join("\\n")}</code></div>
                  <div class="detail-row"><strong>Degradation mode</strong><span>${row.degradation_mode}</span></div>
                  <div class="detail-row"><strong>Fallback strategy</strong><span>${row.fallback_strategy}</span></div>
                  <div class="detail-row"><strong>Required milestones</strong><code>${row.required_for_milestone_refs.join(", ") || "-"}</code></div>
                  <div class="detail-row"><strong>Required gates</strong><code>${row.required_for_gate_refs.join(", ") || "-"}</code></div>
                  <div class="detail-row"><strong>Next review</strong><code>${row.next_review_ref}</code></div>
                  <div class="detail-row"><strong>Notes</strong><span>${row.notes || "None"}</span></div>
                `;
              } else {
                const row = selectedRisk();
                if (!row) {
                  dom.inspectorBody.innerHTML = '<div class="empty">No risk matches the current filter state.</div>';
                  return;
                }
                dom.selectionStrip.innerHTML = `
                  <span>${row.risk_id}</span>
                  <span>${row.status}</span>
                  <span>${row.gate_impact}</span>
                  <span>${row.critical_path_relevance}</span>
                `;
                dom.inspectorBody.innerHTML = `
                  <div class="detail-row"><strong>Risk</strong><span>${row.risk_title}</span></div>
                  <div class="detail-row"><strong>Problem statement</strong><span>${row.problem_statement}</span></div>
                  <div class="detail-row"><strong>Failure mode</strong><span>${row.failure_mode}</span></div>
                  <div class="detail-row"><strong>Leading indicators</strong><code>${row.leading_indicators.join("\\n")}</code></div>
                  <div class="detail-row"><strong>Trigger conditions</strong><code>${row.trigger_conditions.join("\\n")}</code></div>
                  <div class="detail-row"><strong>Linked tasks</strong><code>${row.affected_task_refs.join(", ") || "-"}</code></div>
                  <div class="detail-row"><strong>Linked gates</strong><code>${row.affected_gate_refs.join(", ") || "-"}</code></div>
                  <div class="detail-row"><strong>Dependencies</strong><code>${row.affected_dependency_refs.join(", ") || "-"}</code></div>
                  <div class="detail-row"><strong>Controls</strong><code>${row.current_control_refs.join("\\n") || "-"}</code></div>
                  <div class="detail-row"><strong>Mitigation</strong><code>${row.mitigation_actions.join("\\n")}</code></div>
                  <div class="detail-row"><strong>Contingency</strong><code>${row.contingency_actions.join("\\n")}</code></div>
                  <div class="detail-row"><strong>Score and owner</strong><span>${row.risk_score} · ${row.owner_role}</span></div>
                  <div class="detail-row"><strong>Due ref</strong><code>${row.target_due_ref}</code></div>
                `;
              }
              syncSelectedState();
            }

            function render() {
              if (state.selectedType === "risk" && !filteredRisks().find((row) => row.risk_id === state.selectedId)) {
                state.selectedId = filteredRisks()[0]?.risk_id || dependencies[0]?.dependency_id || "";
                if (!filteredRisks().length && filteredDependencies().length) {
                  state.selectedType = "dependency";
                }
              }
              if (state.selectedType === "dependency" && !filteredDependencies().find((row) => row.dependency_id === state.selectedId)) {
                state.selectedId = filteredDependencies()[0]?.dependency_id || filteredRisks()[0]?.risk_id || "";
                if (!filteredDependencies().length && filteredRisks().length) {
                  state.selectedType = "risk";
                }
              }
              renderSummary();
              renderHeatmap();
              renderDependencies();
              renderRiskTable();
              renderInspector();
            }

            initFilters();
            render();
          </script>
        </body>
        </html>
        """
    ).replace("__SAFE_JSON__", json.dumps(payload))


def main() -> None:
    prereqs = ensure_prerequisites()
    context = build_context(prereqs)
    risk_rows = build_risk_rows(prereqs, context)
    dependency_rows = build_dependency_watchlist(context)
    inject_dependency_states(risk_rows, dependency_rows)
    risk_rows.sort(key=lambda row: (-row["risk_score"], row["risk_id"]))

    risk_task_links = build_risk_task_links(risk_rows, context["tasks_by_ref"])
    risk_gate_links = build_risk_gate_links(risk_rows, context["gates_by_id"])
    finding_coverage = build_forensic_finding_coverage(risk_rows)
    risk_payload = build_master_risk_payload(risk_rows, dependency_rows, finding_coverage)
    dependency_payload = build_dependency_watchlist_payload(dependency_rows)
    heatmap_payload = build_heatmap_payload(risk_rows, dependency_rows)

    write_csv(MASTER_RISK_REGISTER_CSV, risk_rows)
    write_json(MASTER_RISK_REGISTER_JSON, risk_payload)
    write_csv(DEPENDENCY_WATCHLIST_CSV, dependency_rows)
    write_json(DEPENDENCY_WATCHLIST_JSON, dependency_payload)
    write_json(RISK_HEATMAP_JSON, heatmap_payload)
    write_csv(RISK_TASK_LINKS_CSV, risk_task_links)
    write_csv(RISK_GATE_LINKS_CSV, risk_gate_links)

    write_text(MASTER_RISK_REGISTER_MD, render_master_register_doc(risk_payload))
    write_text(DEPENDENCY_WATCHLIST_MD, render_dependency_watchlist_doc(dependency_payload))
    write_text(RISK_TREATMENT_MD, render_treatment_doc(risk_rows))
    write_text(RISK_REVIEW_MODEL_MD, render_review_model_doc(risk_payload, dependency_payload))
    write_text(WATCHLIST_LOG_MD, render_decision_log_doc(risk_rows, dependency_rows))
    write_text(
        WATCHTOWER_HTML,
        build_html(
            {
                "summary": risk_payload["summary"],
                "dependency_summary": dependency_payload["summary"],
                "risks": risk_rows,
                "dependencies": dependency_rows,
            }
        ),
    )


if __name__ == "__main__":
    main()
