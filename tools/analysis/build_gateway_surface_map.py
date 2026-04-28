#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "seq_047"
CAPTURED_ON = "2026-04-11"
VISUAL_MODE = "Boundary_Studio"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Define the canonical trust-zone boundary model and the exact gateway/BFF surface map so "
    "browser-reachable compute, tenant transfer, route ownership, context mutation scope, and "
    "recovery posture are explicit and validator-backed."
)

RUNTIME_MANIFEST_PATH = DATA_DIR / "runtime_topology_manifest.json"
ROUTE_INVENTORY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_INVENTORY_PATH = DATA_DIR / "audience_surface_inventory.csv"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_matrix.csv"
TENANT_MATRIX_PATH = DATA_DIR / "tenant_isolation_matrix.csv"
SHELL_MAP_PATH = DATA_DIR / "shell_ownership_map.json"
CONTEXT_BOUNDARIES_PATH = DATA_DIR / "context_boundary_contracts.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"

TRUST_BOUNDARY_PATH = DATA_DIR / "trust_zone_boundaries.json"
GATEWAY_SURFACE_PATH = DATA_DIR / "gateway_bff_surfaces.json"
ROUTE_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
CONTRACT_MATRIX_PATH = DATA_DIR / "gateway_surface_contract_matrix.csv"

STRATEGY_PATH = DOCS_DIR / "47_trust_zone_boundary_strategy.md"
SURFACE_MAP_PATH = DOCS_DIR / "47_gateway_surface_map.md"
DECISION_PATH = DOCS_DIR / "47_gateway_surface_split_decisions.md"
STUDIO_PATH = DOCS_DIR / "47_trust_zone_and_gateway_studio.html"
GRAPH_PATH = DOCS_DIR / "47_trust_zone_gateway_graph.mmd"

SOURCE_PRECEDENCE = [
    "prompt/047.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/04_surface_conflict_and_gap_report.md",
    "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md",
    "docs/architecture/41_repository_topology_rules.md",
    "docs/architecture/46_runtime_topology_manifest_strategy.md",
    "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
    "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
    "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
    "blueprint/phase-0-the-foundation-protocol.md#1.25 ChannelReleaseFreezeRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.26 AssuranceSliceTrustRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 92",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 114",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/route_family_inventory.csv",
    "data/analysis/audience_surface_inventory.csv",
    "data/analysis/gateway_surface_matrix.csv",
    "data/analysis/tenant_isolation_matrix.csv",
    "data/analysis/context_boundary_contracts.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards"
    ),
    "codegen": (
        "python3 ./tools/analysis/build_monorepo_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_service_scaffold.py && "
        "python3 ./tools/analysis/build_domain_package_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_topology_manifest.py && "
        "python3 ./tools/analysis/build_gateway_surface_map.py && "
        "python3 ./tools/analysis/build_event_registry.py && "
        "python3 ./tools/analysis/build_fhir_representation_contracts.py && "
        "python3 ./tools/analysis/build_frontend_contract_manifests.py && "
        "python3 ./tools/analysis/build_release_freeze_and_parity.py && "
        "python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:gateway-surface": "python3 ./tools/analysis/validate_gateway_surface_map.py",
    "validate:events": "python3 ./tools/analysis/validate_event_registry.py",
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

DOWNSTREAM_WORKLOAD_FAMILY_MAP = {
    "projection": "wf_projection_read_models",
    "command": "wf_command_orchestration",
    "assurance_security": "wf_assurance_security_control",
}

CONTEXT_BOUNDARY_IDS = {
    "shell_contracts": "CBC_041_SHELLS_TO_API_CONTRACTS",
    "shell_release": "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
    "gateway_shared_contracts": "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
    "gateway_identity_policy": "CBC_041_API_GATEWAY_TO_IDENTITY_POLICY",
    "command_domain": "CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS",
    "command_events": "CBC_041_COMMAND_API_TO_EVENT_CONTRACTS",
    "projection_domain": "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
    "release_observability": "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
}

SURFACE_CANDIDATE_GROUPS: dict[str, dict[str, Any]] = {
    "cand_patient_public_entry": {
        "order": 1,
        "label": "Public patient entry",
        "short_label": "Public Entry",
        "source_refs": [
            "blueprint/blueprint-init.md#2. Core product surfaces",
            "prompt/047.md",
        ],
    },
    "cand_patient_grant_recovery": {
        "order": 2,
        "label": "Grant-scoped patient recovery",
        "short_label": "Grant Recovery",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            "prompt/047.md",
        ],
    },
    "cand_patient_portal": {
        "order": 3,
        "label": "Authenticated patient portal",
        "short_label": "Patient Portal",
        "source_refs": [
            "blueprint/patient-portal-experience-architecture-blueprint.md",
            "blueprint/patient-account-and-communications-blueprint.md",
        ],
    },
    "cand_clinical_workspace": {
        "order": 4,
        "label": "Clinical workspace",
        "short_label": "Clinical Workspace",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/staff-workspace-interface-architecture.md",
        ],
    },
    "cand_support_workspace": {
        "order": 5,
        "label": "Support workspace",
        "short_label": "Support",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "prompt/047.md",
        ],
    },
    "cand_hub_desk": {
        "order": 6,
        "label": "Hub desk",
        "short_label": "Hub Desk",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Frontend work",
            "prompt/047.md",
        ],
    },
    "cand_pharmacy_console": {
        "order": 7,
        "label": "Pharmacy console",
        "short_label": "Pharmacy",
        "source_refs": [
            "blueprint/pharmacy-console-frontend-architecture.md#Mission frame",
            "prompt/047.md",
        ],
    },
    "cand_operations_console": {
        "order": 8,
        "label": "Operations console",
        "short_label": "Operations",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Canonical route family",
            "prompt/047.md",
        ],
    },
    "cand_governance_shell": {
        "order": 9,
        "label": "Governance and admin shell",
        "short_label": "Governance",
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "prompt/047.md",
        ],
    },
}

SURFACE_ENRICHMENTS: dict[str, dict[str, Any]] = {
    "gws_patient_intake_web": {
        "candidate_group_id": "cand_patient_public_entry",
        "served_bounded_context_refs": ["intake_safety", "identity_access"],
        "mutating_bounded_context_refs": ["intake_safety"],
        "cache_policy_ref": "CP_PUBLIC_NO_PERSISTED_PHI",
        "channel_guardrail_profile_ref": "CGP_PUBLIC_BROWSER_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_public_intake_safety"],
        "defect_state": "declared",
        "rationale": "Public web intake keeps a public-safe cache and a single intake mutation scope only.",
        "source_refs": [
            "blueprint/blueprint-init.md#2. Core product surfaces",
            "blueprint/forensic-audit-findings.md#Finding 97",
        ],
    },
    "gws_patient_intake_phone": {
        "candidate_group_id": "cand_patient_public_entry",
        "served_bounded_context_refs": ["intake_safety", "communications"],
        "mutating_bounded_context_refs": ["intake_safety", "communications"],
        "cache_policy_ref": "CP_CONSTRAINED_CAPTURE_NO_BROWSER_CACHE",
        "channel_guardrail_profile_ref": "CGP_CONSTRAINED_CAPTURE_PROXY",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_public_intake_safety"],
        "defect_state": "declared",
        "rationale": "Telephony capture stays explicit because session posture, ingress proof, and follow-up delivery differ from web entry.",
        "source_refs": [
            "blueprint/blueprint-init.md#2. Core product surfaces",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
        ],
    },
    "gws_patient_secure_link_recovery": {
        "candidate_group_id": "cand_patient_grant_recovery",
        "served_bounded_context_refs": ["identity_access", "patient_experience"],
        "mutating_bounded_context_refs": ["identity_access"],
        "cache_policy_ref": "CP_GRANT_SCOPED_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_GRANT_RECOVERY_NARROW",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_grant_redemption_scope"],
        "defect_state": "declared",
        "rationale": "Grant-scoped recovery is narrower than the authenticated portal and must not widen into general patient authority.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
    "gws_patient_home": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience"],
        "mutating_bounded_context_refs": [],
        "cache_policy_ref": "CP_PATIENT_SUMMARY_PRIVATE_SHORT",
        "channel_guardrail_profile_ref": "CGP_PATIENT_AUTH_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_patient_shell_trust"],
        "defect_state": "declared",
        "rationale": "Home remains projection-only and may not inherit request, booking, or messaging mutation authority.",
        "source_refs": [
            "blueprint/patient-portal-experience-architecture-blueprint.md#Portal entry and shell topology",
            "blueprint/forensic-audit-findings.md#Finding 97",
        ],
    },
    "gws_patient_requests": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience", "intake_safety", "communications", "booking", "hub_coordination", "pharmacy"],
        "mutating_bounded_context_refs": ["intake_safety", "communications", "booking", "hub_coordination", "pharmacy"],
        "cache_policy_ref": "CP_PATIENT_ROUTE_INTENT_PRIVATE",
        "channel_guardrail_profile_ref": "CGP_PATIENT_AUTH_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_patient_route_intent"],
        "defect_state": "declared",
        "rationale": "Request detail can launch several request-bound actions, so the mutation scope is explicit instead of hidden in one broad patient BFF.",
        "source_refs": [
            "blueprint/patient-account-and-communications-blueprint.md#Request detail contract",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
    "gws_patient_appointments": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience", "booking", "hub_coordination"],
        "mutating_bounded_context_refs": ["booking", "hub_coordination"],
        "cache_policy_ref": "CP_PATIENT_BOOKING_PRIVATE_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_PATIENT_AUTH_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_booking_confirmation_trust"],
        "defect_state": "declared",
        "rationale": "Appointments stay separate because booking confirmation ambiguity and waitlist recovery are distinct from generic request flows.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
            "blueprint/forensic-audit-findings.md#Finding 97",
        ],
    },
    "gws_patient_health_record": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience"],
        "mutating_bounded_context_refs": [],
        "cache_policy_ref": "CP_PATIENT_ARTIFACT_SUMMARY_NO_STORE",
        "channel_guardrail_profile_ref": "CGP_PATIENT_AUTH_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_artifact_parity"],
        "defect_state": "declared",
        "rationale": "Record and document views remain read-only and artifact-governed rather than inheriting wider portal command scope.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.5A Patient record and results visualization algorithm",
            "blueprint/forensic-audit-findings.md#Finding 97",
        ],
    },
    "gws_patient_messages": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience", "communications"],
        "mutating_bounded_context_refs": ["communications"],
        "cache_policy_ref": "CP_PATIENT_THREAD_PRIVATE_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_PATIENT_AUTH_STANDARD",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_reachability_and_message_trust"],
        "defect_state": "declared",
        "rationale": "Messages keep communication mutation and delivery-repair scope explicit instead of sharing a generic request surface.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm",
            "blueprint/callback-and-clinician-messaging-loop.md",
        ],
    },
    "gws_patient_embedded_shell": {
        "candidate_group_id": "cand_patient_portal",
        "served_bounded_context_refs": ["patient_experience", "identity_access"],
        "mutating_bounded_context_refs": ["identity_access"],
        "cache_policy_ref": "CP_EMBEDDED_HOST_SCOPED_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_EMBEDDED_HOST_BOUND",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_embedded_channel_trust"],
        "defect_state": "watch",
        "rationale": "Embedded patient delivery remains explicit and watch-only because channel freeze and host capability law differ materially from browser mode.",
        "source_refs": [
            "blueprint/patient-portal-experience-architecture-blueprint.md#Control priorities",
            "blueprint/forensic-audit-findings.md#Finding 90",
        ],
    },
    "gws_clinician_workspace": {
        "candidate_group_id": "cand_clinical_workspace",
        "served_bounded_context_refs": ["triage_workspace", "booking", "communications"],
        "mutating_bounded_context_refs": ["triage_workspace", "booking", "communications"],
        "cache_policy_ref": "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
        "channel_guardrail_profile_ref": "CGP_STAFF_SINGLE_ORG",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_workspace_slice_trust"],
        "defect_state": "declared",
        "rationale": "The clinician workspace owns single-organisation review and command scope under one workspace trust envelope.",
        "source_refs": [
            "blueprint/staff-workspace-interface-architecture.md#Route family",
            "blueprint/forensic-audit-findings.md#Finding 92",
        ],
    },
    "gws_clinician_workspace_child": {
        "candidate_group_id": "cand_clinical_workspace",
        "served_bounded_context_refs": ["triage_workspace", "communications"],
        "mutating_bounded_context_refs": ["triage_workspace", "communications"],
        "cache_policy_ref": "CP_WORKSPACE_CHILD_PRIVATE_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_STAFF_SINGLE_ORG",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_workspace_slice_trust"],
        "defect_state": "declared",
        "rationale": "Child review states stay within the same staff shell but keep settlement-sensitive task mutations narrower than the root queue surface.",
        "source_refs": [
            "blueprint/staff-workspace-interface-architecture.md#Additional route rules",
            "blueprint/forensic-audit-findings.md#Finding 92",
        ],
    },
    "gws_practice_ops_workspace": {
        "candidate_group_id": "cand_clinical_workspace",
        "served_bounded_context_refs": ["triage_workspace", "communications", "booking"],
        "mutating_bounded_context_refs": ["triage_workspace", "communications"],
        "cache_policy_ref": "CP_WORKSPACE_SINGLE_ORG_PRIVATE",
        "channel_guardrail_profile_ref": "CGP_STAFF_SINGLE_ORG",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_workspace_slice_trust"],
        "defect_state": "watch",
        "rationale": "Practice operations reuses the workspace route family but must remain a separate audience variant because purpose-of-use and minimum-necessary mutation scope differ from clinician review.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Staff audience coverage contract",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    "gws_hub_queue": {
        "candidate_group_id": "cand_hub_desk",
        "served_bounded_context_refs": ["hub_coordination"],
        "mutating_bounded_context_refs": ["hub_coordination"],
        "cache_policy_ref": "CP_HUB_QUEUE_PRIVATE_SUMMARY",
        "channel_guardrail_profile_ref": "CGP_HUB_CROSS_ORG",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_hub_scope_trust"],
        "defect_state": "declared",
        "rationale": "Hub queue remains summary-biased and cross-organisation scoped without inheriting case-level booking mutation breadth.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Frontend work",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    "gws_hub_case_management": {
        "candidate_group_id": "cand_hub_desk",
        "served_bounded_context_refs": ["hub_coordination", "booking", "communications"],
        "mutating_bounded_context_refs": ["hub_coordination", "booking", "communications"],
        "cache_policy_ref": "CP_HUB_CASE_PRIVATE_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_HUB_CROSS_ORG",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_hub_scope_trust"],
        "defect_state": "declared",
        "rationale": "Hub case work is split from queue browsing because cross-organisation alternatives and callback fallbacks carry active mutation authority.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Hub shell-family ownership is explicit",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    "gws_pharmacy_console": {
        "candidate_group_id": "cand_pharmacy_console",
        "served_bounded_context_refs": ["pharmacy", "communications"],
        "mutating_bounded_context_refs": ["pharmacy"],
        "cache_policy_ref": "CP_PHARMACY_CASE_PRIVATE",
        "channel_guardrail_profile_ref": "CGP_PHARMACY_SERVICING",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_pharmacy_dispatch_trust"],
        "defect_state": "declared",
        "rationale": "The pharmacy surface keeps servicing-site partitioning and outcome reconciliation explicit instead of folding into generic staff workspace traffic.",
        "source_refs": [
            "blueprint/pharmacy-console-frontend-architecture.md#Mission frame",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
    "gws_support_ticket_workspace": {
        "candidate_group_id": "cand_support_workspace",
        "served_bounded_context_refs": ["support", "identity_access", "communications"],
        "mutating_bounded_context_refs": ["support", "identity_access", "communications"],
        "cache_policy_ref": "CP_SUPPORT_MASKED_PRIVATE",
        "channel_guardrail_profile_ref": "CGP_SUPPORT_DELEGATE",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_support_scope_masking"],
        "defect_state": "declared",
        "rationale": "Support ticket work stays tenant-delegated and masked instead of drifting into replay or platform-wide operations access.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    "gws_support_replay_observe": {
        "candidate_group_id": "cand_support_workspace",
        "served_bounded_context_refs": ["support", "audit_compliance", "analytics_assurance"],
        "mutating_bounded_context_refs": ["support"],
        "cache_policy_ref": "CP_SUPPORT_REPLAY_FROZEN_NO_STORE",
        "channel_guardrail_profile_ref": "CGP_SUPPORT_REPLAY_MASKED",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_support_replay_restore"],
        "defect_state": "watch",
        "rationale": "Replay and observe stay explicit because they cross the assurance boundary and must preserve frozen restore posture.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            "blueprint/forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
        ],
    },
    "gws_support_assisted_capture": {
        "candidate_group_id": "cand_support_workspace",
        "served_bounded_context_refs": ["support", "intake_safety", "identity_access", "communications"],
        "mutating_bounded_context_refs": ["support", "intake_safety", "identity_access", "communications"],
        "cache_policy_ref": "CP_SUPPORT_CAPTURE_PRIVATE_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_SUPPORT_CAPTURE_BOUND",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_support_scope_masking"],
        "defect_state": "watch",
        "rationale": "Assisted capture is a support-owned variant because it can write recovery and intake state under a delegate scope without becoming the primary ticket workspace owner.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    "gws_operations_board": {
        "candidate_group_id": "cand_operations_console",
        "served_bounded_context_refs": ["operations", "analytics_assurance", "release_control"],
        "mutating_bounded_context_refs": [],
        "cache_policy_ref": "CP_OPERATIONS_WATCH_NO_SHARED_CACHE",
        "channel_guardrail_profile_ref": "CGP_OPERATIONS_WATCH",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_operations_guardrail_trust"],
        "defect_state": "watch",
        "rationale": "The operations board is multi-tenant watch posture only and must not silently inherit intervention authority.",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Canonical route family",
            "blueprint/forensic-audit-findings.md#Finding 96",
        ],
    },
    "gws_operations_drilldown": {
        "candidate_group_id": "cand_operations_console",
        "served_bounded_context_refs": ["operations", "analytics_assurance", "release_control", "audit_compliance"],
        "mutating_bounded_context_refs": ["operations", "release_control"],
        "cache_policy_ref": "CP_OPERATIONS_CONTROL_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_OPERATIONS_CONTROL",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_operations_guardrail_trust"],
        "defect_state": "watch",
        "rationale": "Intervention drill-down is split from the board because live control, restore, and handoff posture differ from watch-only diagnostics.",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Restore reporting and board-frame discipline",
            "blueprint/forensic-audit-findings.md#Finding 96",
        ],
    },
    "gws_governance_shell": {
        "candidate_group_id": "cand_governance_shell",
        "served_bounded_context_refs": ["governance_admin", "release_control", "audit_compliance", "analytics_assurance", "identity_access", "communications"],
        "mutating_bounded_context_refs": ["governance_admin", "release_control", "identity_access", "communications"],
        "cache_policy_ref": "CP_GOVERNANCE_CONTROL_EPHEMERAL",
        "channel_guardrail_profile_ref": "CGP_GOVERNANCE_SCOPE_TUPLE",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_governance_watch_tuple"],
        "defect_state": "watch",
        "rationale": "Governance stays distinct from operations because scope tuple, blast-radius declaration, and release watch posture are stricter and platform-scoped.",
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "blueprint/forensic-audit-findings.md#Finding 95",
        ],
    },
    "gws_assistive_sidecar": {
        "candidate_group_id": "cand_clinical_workspace",
        "route_families": ["rf_staff_workspace_child", "rf_assistive_control_shell"],
        "served_bounded_context_refs": ["triage_workspace"],
        "mutating_bounded_context_refs": ["triage_workspace"],
        "cache_policy_ref": "CP_ASSISTIVE_ADJUNCT_NO_PERSIST",
        "channel_guardrail_profile_ref": "CGP_ASSISTIVE_ADJUNCT_INHERITED",
        "required_assurance_slice_refs": ["ass_release_publication", "ass_assistive_shadow_trust"],
        "defect_state": "watch",
        "rationale": "Assistive remains a bounded secondary surface so it cannot become a shadow standalone control plane.",
        "source_refs": [
            "blueprint/phase-8-the-assistive-layer.md#Control priorities",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
}

SECONDARY_ROUTE_EXCEPTIONS: dict[tuple[str, str], dict[str, str]] = {
    ("rf_staff_workspace", "gws_practice_ops_workspace"): {
        "exception_ref": "EXC_ROUTE_STAFF_WORKSPACE_PRACTICE_OPS_VARIANT",
        "ownership_role": "secondary_variant",
        "reason": "Practice operations reuses the workspace route family but keeps a separate audience and narrower operational mutation scope.",
    },
    ("rf_staff_workspace_child", "gws_assistive_sidecar"): {
        "exception_ref": "EXC_ROUTE_STAFF_CHILD_ASSISTIVE_SIDE_CAR",
        "ownership_role": "bounded_secondary",
        "reason": "Assistive remains a bounded sidecar inheriting the owning workspace route family without becoming the primary browser compute owner.",
    },
    ("rf_support_ticket_workspace", "gws_support_assisted_capture"): {
        "exception_ref": "EXC_ROUTE_SUPPORT_TICKET_ASSISTED_CAPTURE",
        "ownership_role": "secondary_variant",
        "reason": "Support-assisted capture reuses the ticket shell route family but carries a different ingress and recovery mutation posture.",
    },
}

SPLIT_DECISIONS: list[dict[str, Any]] = [
    {
        "decision_id": "DEC_047_PATIENT_PUBLIC_WEB_VS_PHONE",
        "candidate_group_id": "cand_patient_public_entry",
        "surface_refs": ["gws_patient_intake_web", "gws_patient_intake_phone"],
        "decision_state": "split_required",
        "drivers": ["session_policy", "ingress_channel", "cache_policy"],
        "summary": "Public patient web and telephony intake remain separate because session evidence and capture-channel recovery posture differ.",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_GRANT_RECOVERY_VS_PATIENT_PORTAL",
        "candidate_group_id": "cand_patient_grant_recovery",
        "surface_refs": ["gws_patient_secure_link_recovery", "gws_patient_home"],
        "decision_state": "split_required",
        "drivers": ["tenant_isolation", "session_policy", "recovery_profile"],
        "summary": "Grant-scoped recovery cannot merge into the authenticated patient portal because route intent and tenant scope are materially narrower.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_PATIENT_HOME_VS_REQUESTS",
        "candidate_group_id": "cand_patient_portal",
        "surface_refs": ["gws_patient_home", "gws_patient_requests"],
        "decision_state": "split_required",
        "drivers": ["downstream_workload", "mutating_contexts", "recovery_profile"],
        "summary": "Patient home remains projection-only while request detail can launch request-bound mutations across several domains.",
        "source_refs": [
            "blueprint/patient-account-and-communications-blueprint.md#Patient home contract",
            "blueprint/patient-account-and-communications-blueprint.md#Request detail contract",
        ],
    },
    {
        "decision_id": "DEC_047_APPOINTMENTS_VS_REQUESTS",
        "candidate_group_id": "cand_patient_portal",
        "surface_refs": ["gws_patient_appointments", "gws_patient_requests"],
        "decision_state": "split_required",
        "drivers": ["recovery_profile", "served_contexts", "cache_policy"],
        "summary": "Appointments keep booking and external-confirmation posture distinct from general request detail.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_MESSAGES_VS_REQUESTS",
        "candidate_group_id": "cand_patient_portal",
        "surface_refs": ["gws_patient_messages", "gws_patient_requests"],
        "decision_state": "split_required",
        "drivers": ["mutating_contexts", "recovery_profile"],
        "summary": "Messages keep communication reply and callback-repair authority explicit instead of hiding it inside the general request surface.",
        "source_refs": [
            "blueprint/callback-and-clinician-messaging-loop.md",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_RECORD_VS_PORTAL_HOME",
        "candidate_group_id": "cand_patient_portal",
        "surface_refs": ["gws_patient_health_record", "gws_patient_home"],
        "decision_state": "split_required",
        "drivers": ["cache_policy", "artifact_posture"],
        "summary": "Record and artifact viewing stays read-only and parity-governed, so it cannot merge into the general patient portal home.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#5.5A Patient record and results visualization algorithm",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_EMBEDDED_CHANNEL_SPLIT",
        "candidate_group_id": "cand_patient_portal",
        "surface_refs": ["gws_patient_embedded_shell", "gws_patient_home"],
        "decision_state": "split_required",
        "drivers": ["channel_freeze", "release_posture", "cache_policy"],
        "summary": "Embedded patient delivery stays explicit because channel-freeze and host-capability posture differ from browser mode.",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 90",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_CLINICAL_VS_PRACTICE_OPS",
        "candidate_group_id": "cand_clinical_workspace",
        "surface_refs": ["gws_clinician_workspace", "gws_practice_ops_workspace"],
        "decision_state": "explicit_variant",
        "drivers": ["audience", "mutating_contexts", "purpose_of_use"],
        "summary": "Clinical and practice-operations work reuse one route family but stay as separate audience variants with different minimum-necessary mutation scope.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Staff audience coverage contract",
            "blueprint/forensic-audit-findings.md#Finding 114",
        ],
    },
    {
        "decision_id": "DEC_047_HUB_QUEUE_VS_CASE",
        "candidate_group_id": "cand_hub_desk",
        "surface_refs": ["gws_hub_queue", "gws_hub_case_management"],
        "decision_state": "split_required",
        "drivers": ["mutating_contexts", "recovery_profile"],
        "summary": "Hub queue and hub case management stay separate because active cross-organisation mutation is legal only in the case surface.",
        "source_refs": [
            "blueprint/phase-5-the-network-horizon.md#Hub shell-family ownership is explicit",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_SUPPORT_TICKET_VS_REPLAY",
        "candidate_group_id": "cand_support_workspace",
        "surface_refs": ["gws_support_ticket_workspace", "gws_support_replay_observe"],
        "decision_state": "split_required",
        "drivers": ["trust_zone_boundary", "session_policy", "recovery_profile"],
        "summary": "Support replay crosses the assurance boundary and cannot share the primary support ticket surface.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_SUPPORT_TICKET_VS_ASSISTED_CAPTURE",
        "candidate_group_id": "cand_support_workspace",
        "surface_refs": ["gws_support_ticket_workspace", "gws_support_assisted_capture"],
        "decision_state": "explicit_variant",
        "drivers": ["ingress_channel", "mutating_contexts"],
        "summary": "Support-assisted capture keeps a separate support-owned ingress and recovery contract while reusing the main ticket route family.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "prompt/047.md",
        ],
    },
    {
        "decision_id": "DEC_047_OPS_BOARD_VS_DRILLDOWN",
        "candidate_group_id": "cand_operations_console",
        "surface_refs": ["gws_operations_board", "gws_operations_drilldown"],
        "decision_state": "split_required",
        "drivers": ["mutating_contexts", "recovery_profile", "trust_zone_boundary"],
        "summary": "Operations drill-down is split from the board because intervention and restore controls carry stronger authority than watch-only diagnostics.",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Restore reporting and board-frame discipline",
            "blueprint/forensic-audit-findings.md#Finding 96",
        ],
    },
    {
        "decision_id": "DEC_047_OPS_VS_GOVERNANCE",
        "candidate_group_id": "cand_governance_shell",
        "surface_refs": ["gws_operations_board", "gws_governance_shell"],
        "decision_state": "split_required",
        "drivers": ["tenant_isolation", "assurance_trust", "recovery_profile"],
        "summary": "Governance remains a separate control-plane shell because watch-tuple, blast-radius, and approval-freeze posture differ from operations work.",
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Primary governance personas",
            "blueprint/forensic-audit-findings.md#Finding 95",
        ],
    },
    {
        "decision_id": "DEC_047_ASSISTIVE_NOT_STANDALONE",
        "candidate_group_id": "cand_clinical_workspace",
        "surface_refs": ["gws_clinician_workspace_child", "gws_assistive_sidecar"],
        "decision_state": "explicit_variant",
        "drivers": ["tenant_isolation", "bounded_secondary", "recovery_profile"],
        "summary": "Assistive remains a bounded secondary surface inside the owning staff shell rather than a standalone published BFF.",
        "source_refs": [
            "blueprint/phase-8-the-assistive-layer.md#Control priorities",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
]


def fail(message: str) -> None:
    raise SystemExit(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def stable_hash(*parts: Any) -> str:
    payload = json.dumps(parts, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf8")).hexdigest()[:16]


def split_list(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(";") if item.strip()]


def join_list(values: list[str]) -> str:
    return "; ".join(values)


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def ensure_prerequisites() -> None:
    required = [
        RUNTIME_MANIFEST_PATH,
        ROUTE_INVENTORY_PATH,
        AUDIENCE_INVENTORY_PATH,
        GATEWAY_MATRIX_PATH,
        TENANT_MATRIX_PATH,
        SHELL_MAP_PATH,
        CONTEXT_BOUNDARIES_PATH,
        ROOT_PACKAGE_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        fail("PREREQUISITE_GAP_047_MISSING_INPUTS\n" + "\n".join(missing))


def build_boundary_rows(runtime_manifest: dict[str, Any]) -> list[dict[str, Any]]:
    family_lookup = {
        row["runtime_workload_family_ref"]: row for row in runtime_manifest["workload_family_catalog"]
    }

    allowed_rows = []
    for row in runtime_manifest["trust_zone_boundaries"]:
        allowed_rows.append(
            {
                "trustZoneBoundaryId": row["boundary_id"],
                "sourceTrustZoneRef": row["source_trust_zone_ref"],
                "targetTrustZoneRef": row["target_trust_zone_ref"],
                "sourceWorkloadFamilyRefs": row["source_workload_family_refs"],
                "targetWorkloadFamilyRefs": row["target_workload_family_refs"],
                "allowedProtocolRefs": row["allowed_protocol_refs"],
                "allowedIdentityRefs": row["allowed_identity_refs"],
                "allowedDataClassificationRefs": row["allowed_data_classification_refs"],
                "tenantTransferMode": row["tenant_transfer_mode"],
                "assuranceTrustTransferMode": row["assurance_trust_transfer_mode"],
                "egressAllowlistRef": row["egress_allowlist_ref"],
                "boundaryFailureMode": row["boundary_failure_mode"],
                "boundaryState": row["boundary_state"],
                "validatedAt": CAPTURED_ON,
                "rationale": row["notes"],
                "source_refs": row["source_refs"],
                "boundaryKind": "allowed",
            }
        )

    blocked_rows = []
    for row in runtime_manifest["blocked_crossings"]:
        source_meta = family_lookup[row["source_family_ref"]]
        target_meta = family_lookup[row["target_family_ref"]]
        blocked_rows.append(
            {
                "trustZoneBoundaryId": row["crossing_id"],
                "sourceTrustZoneRef": source_meta["trust_zone_ref"],
                "targetTrustZoneRef": target_meta["trust_zone_ref"],
                "sourceWorkloadFamilyRefs": [row["source_family_ref"]],
                "targetWorkloadFamilyRefs": [row["target_family_ref"]],
                "allowedProtocolRefs": [],
                "allowedIdentityRefs": [],
                "allowedDataClassificationRefs": [],
                "tenantTransferMode": "forbidden",
                "assuranceTrustTransferMode": "forbidden",
                "egressAllowlistRef": "eal_blocked_cross_zone_none",
                "boundaryFailureMode": "fail_closed_same_shell_recovery_or_blocked",
                "boundaryState": "blocked",
                "validatedAt": CAPTURED_ON,
                "rationale": row["reason"],
                "source_refs": row["source_refs"],
                "boundaryKind": "blocked",
            }
        )

    return sorted(
        allowed_rows + blocked_rows,
        key=lambda row: (row["boundaryState"] != "allowed", row["trustZoneBoundaryId"]),
    )


def build_required_context_boundaries(
    surface_id: str, mutating_contexts: list[str], downstream_refs: list[str]
) -> list[str]:
    refs = [
        CONTEXT_BOUNDARY_IDS["shell_contracts"],
        CONTEXT_BOUNDARY_IDS["shell_release"],
        CONTEXT_BOUNDARY_IDS["gateway_shared_contracts"],
        CONTEXT_BOUNDARY_IDS["gateway_identity_policy"],
        CONTEXT_BOUNDARY_IDS["projection_domain"],
    ]
    if mutating_contexts:
        refs.extend(
            [
                CONTEXT_BOUNDARY_IDS["command_domain"],
                CONTEXT_BOUNDARY_IDS["command_events"],
            ]
        )
    if "wf_assurance_security_control" in downstream_refs or surface_id in {
        "gws_support_replay_observe",
        "gws_support_assisted_capture",
        "gws_operations_board",
        "gws_operations_drilldown",
        "gws_governance_shell",
    }:
        refs.append(CONTEXT_BOUNDARY_IDS["release_observability"])
    return dedupe(refs)


def build_trust_boundary_refs(downstream_refs: list[str]) -> list[str]:
    refs = ["tzb_public_edge_to_published_gateway"]
    if any(ref in {"wf_projection_read_models", "wf_command_orchestration"} for ref in downstream_refs):
        refs.append("tzb_published_gateway_to_application_core")
    if "wf_assurance_security_control" in downstream_refs:
        refs.append("tzb_published_gateway_to_assurance_security")
    return refs


def build_browser_visible(channel_profile: str, ingress_channel_id: str) -> bool:
    return not (channel_profile == "constrained_browser" and ingress_channel_id == "telephony_ivr")


def build_live_channel_ref(surface_id: str) -> str:
    channel_specific = {
        "gws_patient_messages": "async://patient-messages-thread/v1",
        "gws_patient_appointments": "async://patient-appointments-status/v1",
        "gws_hub_case_management": "async://hub-case-updates/v1",
        "gws_pharmacy_console": "async://pharmacy-case-updates/v1",
        "gws_support_replay_observe": "async://support-replay-checkpoints/v1",
        "gws_operations_board": "async://operations-watch-stream/v1",
        "gws_operations_drilldown": "async://operations-intervention-fence/v1",
        "gws_governance_shell": "async://governance-watch-cockpit/v1",
    }
    return channel_specific.get(surface_id, "async://none")


def build_gateway_surfaces(
    runtime_manifest: dict[str, Any],
    route_inventory: list[dict[str, str]],
    audience_inventory: list[dict[str, str]],
    gateway_rows: list[dict[str, str]],
    tenant_rows: list[dict[str, str]],
) -> list[dict[str, Any]]:
    route_lookup = {row["route_family_id"]: row for row in route_inventory}
    audience_lookup = {row["surface_id"]: row for row in audience_inventory}
    tenant_lookup = {row["tenant_isolation_mode"]: row for row in tenant_rows}

    surfaces = []
    for row in sorted(gateway_rows, key=lambda item: item["gateway_surface_id"]):
        surface_id = row["gateway_surface_id"]
        enrich = SURFACE_ENRICHMENTS[surface_id]
        audience_row = audience_lookup[row["audience_surface_id"]]
        route_row = route_lookup[row["route_family_id"]]
        tenant_row = tenant_lookup[row["tenant_isolation_mode"]]
        downstream_refs = [
            DOWNSTREAM_WORKLOAD_FAMILY_MAP[value] for value in split_list(row["downstream_family_refs"])
        ]
        trust_boundary_refs = build_trust_boundary_refs(downstream_refs)
        required_context_boundary_refs = build_required_context_boundaries(
            surface_id, enrich["mutating_bounded_context_refs"], downstream_refs
        )
        recovery_refs = split_list(row["recovery_disposition_refs"])
        source_refs = dedupe(
            split_list(row["source_refs"])
            + split_list(audience_row["source_refs"])
            + enrich["source_refs"]
            + [f"data/analysis/tenant_isolation_matrix.csv#{tenant_row['isolation_row_id']}"]
        )

        candidate_group = SURFACE_CANDIDATE_GROUPS[enrich["candidate_group_id"]]
        browser_visible = build_browser_visible(
            audience_row["channel_profile"], audience_row["ingress_channel_id"]
        )
        route_families = enrich.get("route_families", [row["route_family_id"]])
        surface = {
            "surfaceId": surface_id,
            "surfaceName": row["gateway_surface_name"],
            "audience": row["audience_tier"],
            "audienceSurfaceRef": row["audience_surface_id"],
            "candidateGroupId": enrich["candidate_group_id"],
            "candidateGroupLabel": candidate_group["label"],
            "routeFamilies": route_families,
            "routeFamilyName": "; ".join(
                route_lookup[route_family_id]["route_family"] for route_family_id in route_families
            ),
            "servedBoundedContextRefs": enrich["served_bounded_context_refs"],
            "mutatingBoundedContextRefs": enrich["mutating_bounded_context_refs"],
            "requiredContextBoundaryRefs": required_context_boundary_refs,
            "entryWorkloadFamilyRef": "wf_shell_delivery_published_gateway",
            "downstreamWorkloadFamilyRefs": downstream_refs,
            "trustZoneBoundaryRefs": trust_boundary_refs,
            "trustZoneRefs": dedupe(
                ["tz_public_edge", "tz_published_gateway"]
                + [
                    next(
                        boundary["targetTrustZoneRef"]
                        for boundary in build_boundary_rows(runtime_manifest)
                        if boundary["trustZoneBoundaryId"] == boundary_ref
                    )
                    for boundary_ref in trust_boundary_refs
                ]
            ),
            "tenantIsolationMode": row["tenant_isolation_mode"],
            "tenantScopeMode": row["tenant_scope_mode"],
            "openApiRef": f"openapi://gateway-bff/{surface_id}/v1",
            "asyncChannelRef": build_live_channel_ref(surface_id),
            "projectionSchemaRefs": [
                f"ProjectionSchema::{context_ref}::v1"
                for context_ref in enrich["served_bounded_context_refs"]
            ],
            "commandSettlementSchemaRefs": [
                f"CommandSettlementSchema::{context_ref}::v1"
                for context_ref in enrich["mutating_bounded_context_refs"]
            ],
            "sessionPolicyRef": row["session_policy_ref"],
            "cachePolicyRef": enrich["cache_policy_ref"],
            "releaseApprovalFreezeRef": f"raf::{surface_id}::current",
            "channelGuardrailProfileRef": enrich["channel_guardrail_profile_ref"],
            "recoveryDispositionProfileRef": f"rdp::{surface_id}",
            "recoveryDispositionRefs": recovery_refs,
            "requiredAssuranceSliceRefs": enrich["required_assurance_slice_refs"],
            "frontendContractManifestRef": f"fcm::{surface_id}::placeholder",
            "queryContractSetRef": f"query::{surface_id}::placeholder",
            "mutationCommandContractRef": f"command::{surface_id}::placeholder",
            "liveChannelContractRef": f"channel::{surface_id}::placeholder",
            "clientCachePolicyDigestRef": f"cache::{surface_id}::placeholder",
            "runtimePublicationBundleRef": f"rpb::{surface_id}::placeholder",
            "shellType": route_row["shell_type"],
            "channelProfile": audience_row["channel_profile"],
            "scopePosture": audience_row["scope_posture"],
            "browserVisible": browser_visible,
            "defectState": enrich["defect_state"],
            "source_refs": source_refs,
            "rationale": enrich["rationale"],
        }
        surface["surfaceAuthorityTupleHash"] = stable_hash(
            surface["surfaceId"],
            surface["routeFamilies"],
            surface["servedBoundedContextRefs"],
            surface["mutatingBoundedContextRefs"],
            surface["requiredContextBoundaryRefs"],
            surface["downstreamWorkloadFamilyRefs"],
            surface["trustZoneBoundaryRefs"],
            surface["tenantIsolationMode"],
            surface["sessionPolicyRef"],
            surface["cachePolicyRef"],
            surface["recoveryDispositionRefs"],
            surface["requiredAssuranceSliceRefs"],
        )
        surfaces.append(surface)

    return sorted(
        surfaces,
        key=lambda row: (
            SURFACE_CANDIDATE_GROUPS[row["candidateGroupId"]]["order"],
            row["surfaceName"],
        ),
    )


def build_route_matrix(
    route_inventory: list[dict[str, str]], surfaces: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    route_lookup = {row["route_family_id"]: row for row in route_inventory}
    surfaces_by_route: dict[str, list[dict[str, Any]]] = {}
    for surface in surfaces:
        for route_family_id in surface["routeFamilies"]:
            surfaces_by_route.setdefault(route_family_id, []).append(surface)

    rows = []
    for route in route_inventory:
        route_family_id = route["route_family_id"]
        owners = sorted(surfaces_by_route.get(route_family_id, []), key=lambda item: item["surfaceId"])
        if not owners:
            continue

        exception_surface_ids = {
            surface_id
            for (route_id, surface_id), _ in SECONDARY_ROUTE_EXCEPTIONS.items()
            if route_id == route_family_id
        }
        primary_owner = next(
            owner for owner in owners if owner["surfaceId"] not in exception_surface_ids
        )

        for owner in owners:
            exception = SECONDARY_ROUTE_EXCEPTIONS.get((route_family_id, owner["surfaceId"]))
            ownership_role = "primary" if owner["surfaceId"] == primary_owner["surfaceId"] else exception["ownership_role"]
            rows.append(
                {
                    "route_family_id": route_family_id,
                    "route_family": route["route_family"],
                    "gateway_surface_id": owner["surfaceId"],
                    "primary_gateway_surface_id": primary_owner["surfaceId"],
                    "ownership_role": ownership_role,
                    "audience_surface_ref": owner["audienceSurfaceRef"],
                    "audience": owner["audience"],
                    "shell_type": owner["shellType"],
                    "browser_visible": "yes" if owner["browserVisible"] else "no",
                    "session_policy_ref": owner["sessionPolicyRef"],
                    "tenant_isolation_mode": owner["tenantIsolationMode"],
                    "downstream_workload_family_refs": join_list(owner["downstreamWorkloadFamilyRefs"]),
                    "trust_zone_boundary_refs": join_list(owner["trustZoneBoundaryRefs"]),
                    "required_context_boundary_refs": join_list(owner["requiredContextBoundaryRefs"]),
                    "explicit_exception_ref": "" if exception is None else exception["exception_ref"],
                    "explicit_exception_reason": "" if exception is None else exception["reason"],
                    "source_refs": join_list(
                        dedupe(split_list(route["source_refs"]) + owner["source_refs"])
                    ),
                }
            )

    return rows


def build_contract_matrix(surfaces: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for surface in surfaces:
        rows.append(
            {
                "surface_id": surface["surfaceId"],
                "surface_name": surface["surfaceName"],
                "audience": surface["audience"],
                "audience_surface_ref": surface["audienceSurfaceRef"],
                "route_families": join_list(surface["routeFamilies"]),
                "served_bounded_context_refs": join_list(surface["servedBoundedContextRefs"]),
                "mutating_bounded_context_refs": join_list(surface["mutatingBoundedContextRefs"]),
                "required_context_boundary_refs": join_list(surface["requiredContextBoundaryRefs"]),
                "entry_workload_family_ref": surface["entryWorkloadFamilyRef"],
                "downstream_workload_family_refs": join_list(surface["downstreamWorkloadFamilyRefs"]),
                "trust_zone_boundary_refs": join_list(surface["trustZoneBoundaryRefs"]),
                "tenant_isolation_mode": surface["tenantIsolationMode"],
                "session_policy_ref": surface["sessionPolicyRef"],
                "cache_policy_ref": surface["cachePolicyRef"],
                "recovery_disposition_profile_ref": surface["recoveryDispositionProfileRef"],
                "recovery_disposition_refs": join_list(surface["recoveryDispositionRefs"]),
                "required_assurance_slice_refs": join_list(surface["requiredAssuranceSliceRefs"]),
                "surface_authority_tuple_hash": surface["surfaceAuthorityTupleHash"],
                "source_refs": join_list(surface["source_refs"]),
            }
        )
    return rows


def build_trust_boundary_payload(
    runtime_manifest: dict[str, Any], boundary_rows: list[dict[str, Any]]
) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "runtime_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "runtime_manifest_tuple_hash": runtime_manifest["manifest_tuple_hash"],
        "summary": {
            "trust_zone_count": len(runtime_manifest["trust_zones"]),
            "boundary_count": len(boundary_rows),
            "allowed_boundary_count": sum(1 for row in boundary_rows if row["boundaryState"] == "allowed"),
            "blocked_boundary_count": sum(1 for row in boundary_rows if row["boundaryState"] == "blocked"),
        },
        "trust_zones": runtime_manifest["trust_zones"],
        "trust_zone_boundaries": boundary_rows,
    }


def build_gateway_payload(
    runtime_manifest: dict[str, Any],
    route_inventory: list[dict[str, str]],
    surfaces: list[dict[str, Any]],
    route_rows: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    primary_route_rows = [row for row in route_rows if row["ownership_role"] == "primary"]
    browser_visible_routes = {
        row["route_family_id"] for row in route_rows if row["browser_visible"] == "yes"
    }
    browser_primary_routes = {
        row["route_family_id"]
        for row in primary_route_rows
        if row["browser_visible"] == "yes"
    }
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "runtime_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "runtime_manifest_tuple_hash": runtime_manifest["manifest_tuple_hash"],
        "summary": {
            "gateway_surface_count": len(surfaces),
            "candidate_group_count": len(SURFACE_CANDIDATE_GROUPS),
            "route_family_count": len(route_inventory),
            "primary_route_owner_count": len(primary_route_rows),
            "secondary_route_exception_count": sum(
                1 for row in route_rows if row["ownership_role"] != "primary"
            ),
            "browser_visible_route_count": len(browser_visible_routes),
            "browser_visible_route_coverage_percent": int(
                len(browser_primary_routes) * 100 / max(len(browser_visible_routes), 1)
            ),
            "assurance_surface_count": sum(
                1
                for surface in surfaces
                if "wf_assurance_security_control" in surface["downstreamWorkloadFamilyRefs"]
            ),
            "contract_matrix_count": len(contract_rows),
        },
        "candidate_groups": [
            {
                "candidateGroupId": group_id,
                **group,
            }
            for group_id, group in sorted(
                SURFACE_CANDIDATE_GROUPS.items(), key=lambda item: item[1]["order"]
            )
        ],
        "gateway_surfaces": surfaces,
        "route_family_ownership": route_rows,
        "surface_contract_rows": contract_rows,
        "split_decisions": SPLIT_DECISIONS,
    }


def build_strategy_doc(
    trust_payload: dict[str, Any], gateway_payload: dict[str, Any]
) -> str:
    summary = trust_payload["summary"]
    gateway_summary = gateway_payload["summary"]
    boundary_table = "\n".join(
        f"| `{row['trustZoneBoundaryId']}` | `{row['boundaryState']}` | `{row['sourceTrustZoneRef']}` | `{row['targetTrustZoneRef']}` | `{join_list(row['sourceWorkloadFamilyRefs'])}` | `{join_list(row['targetWorkloadFamilyRefs'])}` |"
        for row in trust_payload["trust_zone_boundaries"]
    )
    return dedent(
        f"""
        # 47 Trust-Zone Boundary Strategy

        `seq_047` hardens seq_046's runtime topology into the exact trust-boundary law that gateway surfaces must consume. The resulting machine-readable boundary pack publishes **{summary['boundary_count']}** trust-zone rows: **{summary['allowed_boundary_count']}** allowed boundaries and **{summary['blocked_boundary_count']}** fail-closed blocked crossings.

        The gateway pack declares **{gateway_summary['gateway_surface_count']}** gateway/BFF surfaces across **{gateway_summary['candidate_group_count']}** audience candidates, with **{gateway_summary['primary_route_owner_count']}** primary route owners and **{gateway_summary['secondary_route_exception_count']}** explicit secondary variants. Browser-visible route coverage is **{gateway_summary['browser_visible_route_coverage_percent']}%**.

        ## Boundary Law

        - `tz_public_edge` and `tz_shell_delivery` may terminate browser traffic, but only `tz_published_gateway` may bridge browser-facing traffic into compute.
        - `wf_shell_delivery_published_gateway` may call only `wf_projection_read_models`, `wf_command_orchestration`, and, where explicitly declared, `wf_assurance_security_control`.
        - Direct gateway access to `wf_integration_dispatch`, `wf_integration_simulation_lab`, or `wf_data_stateful_plane` is blocked.
        - Tenant transfer, assurance trust transfer, and boundary failure mode are now explicit per crossing rather than implied by service topology.

        ## Trust-Zone Matrix

        | Boundary | State | Source zone | Target zone | Source families | Target families |
        | --- | --- | --- | --- | --- | --- |
        {boundary_table}

        ## Consequences

        - No hidden browser-reachable service remains. All browser compute resolves through one published gateway surface contract.
        - Gateway surfaces now declare the exact downstream workload families and trust boundaries they may use.
        - Blocked crossings are part of the published contract, not a silent assumption inside network or service code.
        """
    ).strip()


def build_surface_map_doc(surfaces: list[dict[str, Any]]) -> str:
    table = "\n".join(
        f"| `{surface['surfaceId']}` | `{surface['audienceSurfaceRef']}` | `{join_list(surface['routeFamilies'])}` | `{surface['tenantIsolationMode']}` | `{surface['sessionPolicyRef']}` | `{join_list(surface['downstreamWorkloadFamilyRefs'])}` | `{join_list(surface['mutatingBoundedContextRefs']) or 'read_only'}` |"
        for surface in surfaces
    )
    return dedent(
        f"""
        # 47 Gateway Surface Map

        The canonical gateway map keeps audience, route family, tenant isolation, downstream workload set, and mutation scope explicit. This closes the generic-BFF drift that seq_011 still allowed.

        ## Surface Table

        | Surface | Audience surface | Route family | Tenant isolation | Session policy | Downstream workloads | Mutating contexts |
        | --- | --- | --- | --- | --- | --- | --- |
        {table}
        """
    ).strip()


def build_split_decision_doc(decisions: list[dict[str, Any]]) -> str:
    table = "\n".join(
        f"| `{row['decision_id']}` | `{row['decision_state']}` | `{join_list(row['surface_refs'])}` | `{join_list(row['drivers'])}` | {row['summary']} |"
        for row in decisions
    )
    return dedent(
        f"""
        # 47 Gateway Surface Split Decisions

        These decisions explain why gateway surfaces remain split, or where a route family has an explicit secondary variant instead of two primary owners.

        | Decision | State | Surfaces | Drivers | Summary |
        | --- | --- | --- | --- | --- |
        {table}
        """
    ).strip()


def build_graph_mmd(surfaces: list[dict[str, Any]], boundary_rows: list[dict[str, Any]]) -> str:
    zone_lines = [
        '  tz_public_edge["tz_public_edge"]',
        '  tz_shell_delivery["tz_shell_delivery"]',
        '  tz_published_gateway["tz_published_gateway"]',
        '  tz_application_core["tz_application_core"]',
        '  tz_assurance_security["tz_assurance_security"]',
        '  tz_integration_perimeter["tz_integration_perimeter"]',
        '  tz_stateful_data["tz_stateful_data"]',
    ]
    surface_lines = []
    for surface in surfaces:
        node_id = surface["surfaceId"].replace("-", "_")
        label = surface["surfaceId"]
        surface_lines.append(f'  {node_id}["{label}"]')
        surface_lines.append(f"  tz_published_gateway --> {node_id}")
        for downstream in surface["downstreamWorkloadFamilyRefs"]:
            target = (
                "tz_assurance_security"
                if downstream == "wf_assurance_security_control"
                else "tz_application_core"
            )
            surface_lines.append(f"  {node_id} --> {target}")
    blocked_lines = []
    for row in boundary_rows:
        if row["boundaryState"] == "blocked":
            blocked_lines.append(
                f'  "{row["sourceWorkloadFamilyRefs"][0]}" -. blocked .-> "{row["targetWorkloadFamilyRefs"][0]}"'
            )
    lines = ["flowchart LR"] + zone_lines + surface_lines + blocked_lines
    return "\n".join(lines)


def build_studio_html(
    trust_payload: dict[str, Any], gateway_payload: dict[str, Any]
) -> str:
    studio_data = {
        "trust_zones": trust_payload["trust_zones"],
        "boundaries": trust_payload["trust_zone_boundaries"],
        "surfaces": gateway_payload["gateway_surfaces"],
        "route_rows": gateway_payload["route_family_ownership"],
        "split_decisions": gateway_payload["split_decisions"],
        "candidate_groups": gateway_payload["candidate_groups"],
        "summary": gateway_payload["summary"],
    }
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>47 Trust Zone And Gateway Studio</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F7F8FC;
              --rail: #EEF2F8;
              --panel: #FFFFFF;
              --inset: #F3F5FA;
              --text-strong: #0F172A;
              --text-default: #1E293B;
              --text-muted: #667085;
              --border-subtle: #E2E8F0;
              --border-default: #CBD5E1;
              --gateway: #315BEA;
              --trust: #0F9D8A;
              --patient: #2F5BFF;
              --staff: #6E59D9;
              --blocked: #C24141;
              --warning: #C98900;
              --masthead-height: 72px;
              --rail-width: 296px;
              --inspector-width: 372px;
              --radius: 18px;
              --shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
              --transition-fast: 120ms ease;
              --transition-select: 180ms ease;
              --transition-panel: 220ms ease;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              background: linear-gradient(180deg, rgba(49, 91, 234, 0.06), rgba(247, 248, 252, 0.94) 180px), var(--canvas);
              color: var(--text-default);
            }}
            body[data-reduced-motion="true"] * {{
              animation: none !important;
              transition-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}
            .page {{
              max-width: 1480px;
              margin: 0 auto;
              padding: 20px;
            }}
            .masthead {{
              position: sticky;
              top: 0;
              z-index: 8;
              min-height: var(--masthead-height);
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 20px;
              align-items: center;
              padding: 14px 18px;
              margin-bottom: 18px;
              border-radius: 22px;
              border: 1px solid rgba(203, 213, 225, 0.92);
              background: rgba(255, 255, 255, 0.94);
              backdrop-filter: blur(14px);
              box-shadow: var(--shadow);
            }}
            .wordmark {{
              display: flex;
              align-items: center;
              gap: 14px;
            }}
            .monogram {{
              width: 42px;
              height: 42px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              border: 1px solid rgba(49, 91, 234, 0.18);
              background: linear-gradient(135deg, rgba(49, 91, 234, 0.16), rgba(15, 157, 138, 0.14));
            }}
            .eyebrow {{
              margin: 0 0 4px;
              font-size: 12px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .headline {{
              margin: 0;
              font-size: 20px;
              color: var(--text-strong);
            }}
            .subhead {{
              margin: 4px 0 0;
              font-size: 13px;
              color: var(--text-muted);
            }}
            .metric-strip {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }}
            .metric {{
              min-width: 118px;
              padding: 10px 12px;
              border-radius: 14px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
            }}
            .metric strong {{
              display: block;
              font-size: 18px;
              color: var(--text-strong);
            }}
            .metric span {{
              display: block;
              font-size: 12px;
              color: var(--text-muted);
            }}
            .layout {{
              display: grid;
              grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
              gap: 18px;
            }}
            .panel {{
              background: var(--panel);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius);
              box-shadow: var(--shadow);
            }}
            .rail {{
              padding: 16px;
              background: linear-gradient(180deg, rgba(238, 242, 248, 0.96), rgba(255, 255, 255, 0.98));
            }}
            .section-label {{
              margin: 0 0 6px;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .filter-grid {{
              display: grid;
              gap: 10px;
              margin-bottom: 16px;
            }}
            label {{
              display: block;
              margin-bottom: 4px;
              font-size: 12px;
              color: var(--text-muted);
            }}
            select {{
              width: 100%;
              min-height: 44px;
              border-radius: 12px;
              border: 1px solid var(--border-default);
              background: var(--panel);
              color: var(--text-default);
              padding: 0 12px;
            }}
            .list-stack {{
              display: grid;
              gap: 10px;
            }}
            .gateway-card,
            .boundary-card,
            .map-node,
            .boundary-edge {{
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.96);
              transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
            }}
            .gateway-card,
            .boundary-card {{
              min-height: 108px;
              padding: 14px;
              cursor: pointer;
            }}
            .gateway-card:hover,
            .gateway-card:focus-visible,
            .boundary-card:hover,
            .boundary-card:focus-visible,
            .map-node:hover,
            .map-node:focus-visible,
            .boundary-edge:hover,
            .boundary-edge:focus-visible {{
              border-color: rgba(49, 91, 234, 0.38);
              transform: translateY(-1px);
              outline: none;
            }}
            .gateway-card[data-selected="true"],
            .boundary-card[data-selected="true"],
            .map-node[data-selected="true"],
            .boundary-edge[data-selected="true"] {{
              border-color: rgba(49, 91, 234, 0.56);
              box-shadow: 0 18px 40px rgba(49, 91, 234, 0.12);
            }}
            .chip-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 10px;
            }}
            .chip {{
              display: inline-flex;
              align-items: center;
              min-height: 28px;
              padding: 4px 10px;
              border-radius: 999px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
              font-size: 12px;
            }}
            .chip.watch {{ color: #8A6100; border-color: rgba(201, 137, 0, 0.28); }}
            .chip.blocked {{ color: var(--blocked); border-color: rgba(194, 65, 65, 0.28); }}
            .chip.patient {{ color: var(--patient); }}
            .chip.staff {{ color: var(--staff); }}
            .mono {{
              font-family: "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace;
            }}
            .center {{
              padding: 16px;
            }}
            .canvas {{
              min-height: 600px;
              padding: 16px;
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(243, 245, 250, 0.82), rgba(255, 255, 255, 0.98));
            }}
            .zone-grid {{
              display: grid;
              gap: 12px;
            }}
            .zone-band {{
              display: grid;
              grid-template-columns: 180px minmax(0, 1fr);
              gap: 14px;
              align-items: start;
              min-height: 72px;
              padding: 12px;
              border-radius: 16px;
              border: 1px solid rgba(203, 213, 225, 0.7);
              background: rgba(255, 255, 255, 0.78);
            }}
            .zone-title {{
              font-size: 13px;
              font-weight: 700;
              color: var(--text-strong);
            }}
            .zone-copy {{
              margin-top: 4px;
              font-size: 12px;
              color: var(--text-muted);
            }}
            .zone-lane {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              min-height: 44px;
            }}
            .map-node {{
              min-width: 180px;
              min-height: 44px;
              padding: 10px 12px;
              cursor: pointer;
              text-align: left;
            }}
            .edge-strip {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 14px;
            }}
            .boundary-edge {{
              min-height: 44px;
              padding: 10px 12px;
              cursor: pointer;
            }}
            .lane-panel {{
              margin-top: 16px;
              padding: 16px;
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: var(--panel);
            }}
            .lane-flow {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              align-items: center;
            }}
            .lane-box {{
              min-height: 78px;
              padding: 14px;
              border-radius: 16px;
              border: 1px solid var(--border-subtle);
              background: var(--inset);
            }}
            .arrow {{
              text-align: center;
              color: var(--text-muted);
              font-size: 18px;
            }}
            .inspector {{
              padding: 18px;
              transition: transform var(--transition-panel), opacity var(--transition-panel);
            }}
            .inspector section + section {{
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid var(--border-subtle);
            }}
            .inspector-title {{
              margin: 0 0 4px;
              font-size: 18px;
              color: var(--text-strong);
            }}
            .inspector-copy {{
              margin: 0;
              font-size: 13px;
              color: var(--text-muted);
              line-height: 1.5;
            }}
            .inspector-list {{
              margin: 10px 0 0;
              padding: 0;
              list-style: none;
              display: grid;
              gap: 8px;
            }}
            .inspector-list li {{
              padding: 10px 12px;
              border-radius: 14px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
            }}
            .bottom {{
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
              gap: 18px;
              margin-top: 18px;
            }}
            .table-wrap {{
              padding: 16px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }}
            th, td {{
              text-align: left;
              padding: 12px 10px;
              border-bottom: 1px solid var(--border-subtle);
              vertical-align: top;
            }}
            tbody tr {{
              cursor: pointer;
              transition: background var(--transition-fast);
            }}
            tbody tr:hover,
            tbody tr:focus-visible {{
              background: rgba(49, 91, 234, 0.06);
              outline: none;
            }}
            tbody tr[data-selected="true"] {{
              background: rgba(49, 91, 234, 0.08);
            }}
            .split-strip {{
              margin-top: 18px;
              padding: 16px;
            }}
            .split-grid {{
              display: grid;
              gap: 12px;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            }}
            .split-card {{
              min-height: 128px;
              padding: 14px;
              border-radius: 16px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(243, 245, 250, 0.82), rgba(255, 255, 255, 0.98));
            }}
            @media (max-width: 1220px) {{
              .layout {{
                grid-template-columns: 1fr;
              }}
              .bottom {{
                grid-template-columns: 1fr;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="page">
            <header class="masthead panel" data-testid="boundary-masthead">
              <div class="wordmark">
                <div class="monogram" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#315BEA" stroke-width="1.5">
                    <path d="M5 18V6h8" />
                    <path d="M13 6h6v12" />
                    <path d="M7 12h12" />
                  </svg>
                </div>
                <div>
                  <p class="eyebrow">Vecells Boundary Studio</p>
                  <h1 class="headline">Trust-Zone And Gateway Surface Map</h1>
                  <p class="subhead">`Boundary_Studio` keeps browser compute, route ownership, and downstream trust boundaries explicit.</p>
                </div>
              </div>
              <div class="metric-strip">
                <div class="metric"><strong>{gateway_payload["summary"]["gateway_surface_count"]}</strong><span>Gateway surfaces</span></div>
                <div class="metric"><strong>{trust_payload["summary"]["boundary_count"]}</strong><span>Trust boundaries</span></div>
                <div class="metric"><strong>{trust_payload["summary"]["blocked_boundary_count"]}</strong><span>Blocked crossings</span></div>
                <div class="metric"><strong>{gateway_payload["summary"]["browser_visible_route_coverage_percent"]}%</strong><span>Route coverage</span></div>
              </div>
            </header>
            <main>
              <div class="layout">
                <aside class="panel rail">
                  <p class="section-label">Filters</p>
                  <div class="filter-grid">
                    <div>
                      <label for="filter-zone">Trust zone</label>
                      <select id="filter-zone" data-testid="filter-zone"></select>
                    </div>
                    <div>
                      <label for="filter-audience">Audience</label>
                      <select id="filter-audience" data-testid="filter-audience"></select>
                    </div>
                    <div>
                      <label for="filter-shell">Shell type</label>
                      <select id="filter-shell" data-testid="filter-shell"></select>
                    </div>
                    <div>
                      <label for="filter-route">Route family</label>
                      <select id="filter-route" data-testid="filter-route"></select>
                    </div>
                    <div>
                      <label for="filter-defect">Defect state</label>
                      <select id="filter-defect" data-testid="filter-defect"></select>
                    </div>
                  </div>
                  <p class="section-label">Gateway surfaces</p>
                  <div class="list-stack" data-testid="gateway-list" id="gateway-list"></div>
                  <p class="section-label" style="margin-top: 16px;">Boundary edges</p>
                  <div class="list-stack" data-testid="boundary-list" id="boundary-list"></div>
                </aside>
                <section class="panel center">
                  <div class="canvas" data-testid="map-canvas">
                    <div class="zone-grid" id="zone-grid"></div>
                    <div class="edge-strip" id="edge-strip"></div>
                  </div>
                  <div class="lane-panel" data-testid="lane-diagram">
                    <p class="section-label">Browser To Downstream Lane</p>
                    <div class="lane-flow" id="lane-flow"></div>
                  </div>
                </section>
                <aside class="panel inspector" data-testid="inspector" id="inspector"></aside>
              </div>
              <section class="bottom">
                <div class="panel table-wrap">
                  <p class="section-label">Route-family matrix</p>
                  <table data-testid="route-matrix">
                    <thead>
                      <tr>
                        <th>Route family</th>
                        <th>Gateway surface</th>
                        <th>Role</th>
                        <th>Tenant isolation</th>
                      </tr>
                    </thead>
                    <tbody id="route-body"></tbody>
                  </table>
                </div>
                <div class="panel table-wrap">
                  <p class="section-label">Trust-zone boundary matrix</p>
                  <table data-testid="boundary-matrix">
                    <thead>
                      <tr>
                        <th>Boundary</th>
                        <th>State</th>
                        <th>Crossing</th>
                        <th>Tenant transfer</th>
                      </tr>
                    </thead>
                    <tbody id="boundary-body"></tbody>
                  </table>
                </div>
              </section>
              <section class="panel split-strip" data-testid="split-strip">
                <p class="section-label">Split decision log</p>
                <div class="split-grid" id="split-grid"></div>
              </section>
            </main>
          </div>
          <script>
            const STUDIO_DATA = {json.dumps(studio_data, sort_keys=True)};
            const state = {{
              zone: "all",
              audience: "all",
              shell: "all",
              route: "all",
              defect: "all",
              selectedType: "surface",
              selectedId: STUDIO_DATA.surfaces[0]?.surfaceId ?? null,
            }};

            const filterZone = document.getElementById("filter-zone");
            const filterAudience = document.getElementById("filter-audience");
            const filterShell = document.getElementById("filter-shell");
            const filterRoute = document.getElementById("filter-route");
            const filterDefect = document.getElementById("filter-defect");
            const gatewayList = document.getElementById("gateway-list");
            const boundaryList = document.getElementById("boundary-list");
            const zoneGrid = document.getElementById("zone-grid");
            const edgeStrip = document.getElementById("edge-strip");
            const inspector = document.getElementById("inspector");
            const routeBody = document.getElementById("route-body");
            const boundaryBody = document.getElementById("boundary-body");
            const splitGrid = document.getElementById("split-grid");
            const laneFlow = document.getElementById("lane-flow");

            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.body.dataset.reducedMotion = reducedMotion ? "true" : "false";

            function byId(collection, key, value) {{
              return collection.find((row) => row[key] === value);
            }}

            function renderOptions(select, values, label) {{
              select.innerHTML = "";
              const all = document.createElement("option");
              all.value = "all";
              all.textContent = `All ${{label}}`;
              select.appendChild(all);
              values.forEach((value) => {{
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
              }});
            }}

            renderOptions(filterZone, STUDIO_DATA.trust_zones.map((row) => row.trust_zone_ref), "trust zones");
            renderOptions(filterAudience, [...new Set(STUDIO_DATA.surfaces.map((row) => row.audience))], "audiences");
            renderOptions(filterShell, [...new Set(STUDIO_DATA.surfaces.map((row) => row.shellType))], "shell types");
            renderOptions(filterRoute, [...new Set(STUDIO_DATA.route_rows.map((row) => row.route_family_id))], "route families");
            renderOptions(filterDefect, ["declared", "watch", "blocked"], "defect states");

            function visibleSurfaces() {{
              return STUDIO_DATA.surfaces
                .filter((row) => state.audience === "all" || row.audience === state.audience)
                .filter((row) => state.shell === "all" || row.shellType === state.shell)
                .filter((row) => state.route === "all" || row.routeFamilies.includes(state.route))
                .filter((row) => state.zone === "all" || row.trustZoneRefs.includes(state.zone))
                .filter((row) => state.defect === "all" || row.defectState === state.defect);
            }}

            function visibleBoundaries() {{
              return STUDIO_DATA.boundaries
                .filter(
                  (row) =>
                    state.zone === "all" ||
                    row.sourceTrustZoneRef === state.zone ||
                    row.targetTrustZoneRef === state.zone,
                )
                .filter(
                  (row) =>
                    state.defect === "all" ||
                    (state.defect === "blocked" && row.boundaryState === "blocked") ||
                    (state.defect !== "blocked" && row.boundaryState !== "blocked"),
                );
            }}

            function visibleRouteRows() {{
              const surfaceIds = new Set(visibleSurfaces().map((row) => row.surfaceId));
              return STUDIO_DATA.route_rows.filter((row) => surfaceIds.has(row.gateway_surface_id));
            }}

            function selectedSurface() {{
              return byId(STUDIO_DATA.surfaces, "surfaceId", state.selectedId);
            }}

            function selectedBoundary() {{
              return byId(STUDIO_DATA.boundaries, "trustZoneBoundaryId", state.selectedId);
            }}

            function ensureSelection() {{
              const surfaces = visibleSurfaces();
              const boundaries = visibleBoundaries();
              if (state.selectedType === "surface" && surfaces.some((row) => row.surfaceId === state.selectedId)) {{
                return;
              }}
              if (state.selectedType === "boundary" && boundaries.some((row) => row.trustZoneBoundaryId === state.selectedId)) {{
                return;
              }}
              if (surfaces.length) {{
                state.selectedType = "surface";
                state.selectedId = surfaces[0].surfaceId;
                return;
              }}
              if (boundaries.length) {{
                state.selectedType = "boundary";
                state.selectedId = boundaries[0].trustZoneBoundaryId;
                return;
              }}
              state.selectedId = null;
            }}

            function buildChip(text, extraClass = "") {{
              const chip = document.createElement("span");
              chip.className = `chip ${{extraClass}}`.trim();
              chip.textContent = text;
              return chip;
            }}

            function keyboardSelect(items, currentIndex, nextIndexGetter, selectCallback) {{
              return (event) => {{
                if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) {{
                  return;
                }}
                event.preventDefault();
                const nextIndex = nextIndexGetter(currentIndex, event.key, items.length);
                const nextItem = items[nextIndex];
                if (!nextItem) {{
                  return;
                }}
                selectCallback(nextItem);
              }};
            }}

            function nextLinearIndex(currentIndex, key, length) {{
              if (length === 0) {{
                return currentIndex;
              }}
              if (key === "ArrowDown" || key === "ArrowRight") {{
                return Math.min(length - 1, currentIndex + 1);
              }}
              return Math.max(0, currentIndex - 1);
            }}

            function renderGatewayList(surfaces) {{
              gatewayList.innerHTML = "";
              surfaces.forEach((surface, index) => {{
                const button = document.createElement("button");
                button.type = "button";
                button.className = "gateway-card";
                button.dataset.testid = `gateway-card-${{surface.surfaceId}}`;
                button.setAttribute("data-testid", `gateway-card-${{surface.surfaceId}}`);
                button.dataset.selected =
                  state.selectedType === "surface" && state.selectedId === surface.surfaceId ? "true" : "false";
                button.innerHTML = `
                  <div class="section-label mono">${{surface.surfaceId}}</div>
                  <div style="font-weight:700;color:var(--text-strong);">${{surface.surfaceName}}</div>
                  <div style="margin-top:4px;font-size:13px;color:var(--text-muted);">${{surface.routeFamilyName}}</div>
                `;
                const chipRow = document.createElement("div");
                chipRow.className = "chip-row";
                chipRow.appendChild(buildChip(surface.audience.includes("patient") ? "patient" : "staff", surface.audience.includes("patient") ? "patient" : "staff"));
                chipRow.appendChild(buildChip(surface.defectState, surface.defectState === "watch" ? "watch" : ""));
                chipRow.appendChild(buildChip(surface.tenantIsolationMode, "mono"));
                button.appendChild(chipRow);
                button.addEventListener("click", () => {{
                  state.selectedType = "surface";
                  state.selectedId = surface.surfaceId;
                  render();
                }});
                button.addEventListener(
                  "keydown",
                  keyboardSelect(surfaces, index, nextLinearIndex, (nextSurface) => {{
                    state.selectedType = "surface";
                    state.selectedId = nextSurface.surfaceId;
                    render();
                    document.querySelector(`[data-testid="gateway-card-${{nextSurface.surfaceId}}"]`)?.focus();
                  }}),
                );
                gatewayList.appendChild(button);
              }});
            }}

            function renderBoundaryList(boundaries) {{
              boundaryList.innerHTML = "";
              boundaries.forEach((boundary, index) => {{
                const button = document.createElement("button");
                button.type = "button";
                button.className = "boundary-card";
                button.setAttribute("data-testid", `boundary-card-${{boundary.trustZoneBoundaryId}}`);
                button.dataset.selected =
                  state.selectedType === "boundary" && state.selectedId === boundary.trustZoneBoundaryId ? "true" : "false";
                button.innerHTML = `
                  <div class="section-label mono">${{boundary.trustZoneBoundaryId}}</div>
                  <div style="font-weight:700;color:var(--text-strong);">${{boundary.sourceTrustZoneRef}} → ${{boundary.targetTrustZoneRef}}</div>
                  <div style="margin-top:4px;font-size:13px;color:var(--text-muted);">${{boundary.boundaryState}} · ${{boundary.tenantTransferMode}}</div>
                `;
                button.addEventListener("click", () => {{
                  state.selectedType = "boundary";
                  state.selectedId = boundary.trustZoneBoundaryId;
                  render();
                }});
                button.addEventListener(
                  "keydown",
                  keyboardSelect(boundaries, index, nextLinearIndex, (nextBoundary) => {{
                    state.selectedType = "boundary";
                    state.selectedId = nextBoundary.trustZoneBoundaryId;
                    render();
                    document.querySelector(`[data-testid="boundary-card-${{nextBoundary.trustZoneBoundaryId}}"]`)?.focus();
                  }}),
                );
                boundaryList.appendChild(button);
              }});
            }}

            function renderZoneMap(surfaces, boundaries) {{
              zoneGrid.innerHTML = "";
              edgeStrip.innerHTML = "";
              STUDIO_DATA.trust_zones.forEach((zone) => {{
                const band = document.createElement("div");
                band.className = "zone-band";
                band.innerHTML = `
                  <div>
                    <div class="zone-title">${{zone.display_name}}</div>
                    <div class="zone-copy">${{zone.purpose}}</div>
                  </div>
                  <div class="zone-lane"></div>
                `;
                const lane = band.querySelector(".zone-lane");
                if (zone.trust_zone_ref === "tz_published_gateway") {{
                  surfaces.forEach((surface, index) => {{
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "map-node";
                    button.setAttribute("data-testid", `gateway-node-${{surface.surfaceId}}`);
                    button.dataset.selected =
                      state.selectedType === "surface" && state.selectedId === surface.surfaceId ? "true" : "false";
                    button.innerHTML = `<div class="mono">${{surface.surfaceId}}</div><div style="margin-top:4px;font-weight:700;color:var(--text-strong);">${{surface.surfaceName}}</div>`;
                    button.addEventListener("click", () => {{
                      state.selectedType = "surface";
                      state.selectedId = surface.surfaceId;
                      render();
                    }});
                    button.addEventListener(
                      "keydown",
                      keyboardSelect(surfaces, index, nextLinearIndex, (nextSurface) => {{
                        state.selectedType = "surface";
                        state.selectedId = nextSurface.surfaceId;
                        render();
                        document.querySelector(`[data-testid="gateway-node-${{nextSurface.surfaceId}}"]`)?.focus();
                      }}),
                    );
                    lane.appendChild(button);
                  }});
                }} else {{
                  const related = boundaries.filter(
                    (row) =>
                      row.sourceTrustZoneRef === zone.trust_zone_ref ||
                      row.targetTrustZoneRef === zone.trust_zone_ref,
                  );
                  related.slice(0, 3).forEach((boundary) => {{
                    lane.appendChild(buildChip(boundary.trustZoneBoundaryId, boundary.boundaryState === "blocked" ? "blocked" : ""));
                  }});
                }}
                zoneGrid.appendChild(band);
              }});

              boundaries.forEach((boundary, index) => {{
                const button = document.createElement("button");
                button.type = "button";
                button.className = "boundary-edge";
                button.setAttribute("data-testid", `boundary-edge-${{boundary.trustZoneBoundaryId}}`);
                button.dataset.selected =
                  state.selectedType === "boundary" && state.selectedId === boundary.trustZoneBoundaryId ? "true" : "false";
                button.innerHTML = `<span class="mono">${{boundary.trustZoneBoundaryId}}</span> · ${{boundary.sourceTrustZoneRef}} → ${{boundary.targetTrustZoneRef}}`;
                button.addEventListener("click", () => {{
                  state.selectedType = "boundary";
                  state.selectedId = boundary.trustZoneBoundaryId;
                  render();
                }});
                button.addEventListener(
                  "keydown",
                  keyboardSelect(boundaries, index, nextLinearIndex, (nextBoundary) => {{
                    state.selectedType = "boundary";
                    state.selectedId = nextBoundary.trustZoneBoundaryId;
                    render();
                    document.querySelector(`[data-testid="boundary-edge-${{nextBoundary.trustZoneBoundaryId}}"]`)?.focus();
                  }}),
                );
                edgeStrip.appendChild(button);
              }});
            }}

            function renderLane(surface) {{
              laneFlow.innerHTML = "";
              if (!surface) {{
                laneFlow.innerHTML = "<div class='lane-box'>No surface selected.</div>";
                return;
              }}
              const boxes = [
                ["Browser / host", surface.browserVisible ? surface.channelProfile : "non-browser ingress"],
                ["Public edge", "tz_public_edge"],
                ["Gateway", surface.surfaceId],
                [
                  "Downstream",
                  surface.downstreamWorkloadFamilyRefs.length ? surface.downstreamWorkloadFamilyRefs.join(", ") : "projection only",
                ],
              ];
              boxes.forEach(([title, copy], index) => {{
                const box = document.createElement("div");
                box.className = "lane-box";
                box.innerHTML = `<div class="section-label">${{title}}</div><div class="mono" style="margin-top:6px;">${{copy}}</div>`;
                laneFlow.appendChild(box);
                if (index < boxes.length - 1) {{
                  const arrow = document.createElement("div");
                  arrow.className = "arrow";
                  arrow.textContent = "→";
                  laneFlow.appendChild(arrow);
                }}
              }});
            }}

            function renderInspector() {{
              if (state.selectedType === "boundary") {{
                const boundary = selectedBoundary();
                if (!boundary) {{
                  inspector.innerHTML = "<p class='inspector-copy'>No boundary selected.</p>";
                  return;
                }}
                inspector.innerHTML = `
                  <section>
                    <p class="section-label">Boundary</p>
                    <h2 class="inspector-title mono">${{boundary.trustZoneBoundaryId}}</h2>
                    <p class="inspector-copy">${{boundary.rationale}}</p>
                  </section>
                  <section>
                    <p class="section-label">Crossing</p>
                    <ul class="inspector-list">
                      <li><strong>Source zone</strong><br />${{boundary.sourceTrustZoneRef}}</li>
                      <li><strong>Target zone</strong><br />${{boundary.targetTrustZoneRef}}</li>
                      <li><strong>Protocols</strong><br />${{boundary.allowedProtocolRefs.join(", ") || "blocked"}}</li>
                      <li><strong>Tenant transfer</strong><br />${{boundary.tenantTransferMode}}</li>
                      <li><strong>Assurance trust</strong><br />${{boundary.assuranceTrustTransferMode}}</li>
                    </ul>
                  </section>
                `;
                renderLane(null);
                return;
              }}
              const surface = selectedSurface();
              if (!surface) {{
                inspector.innerHTML = "<p class='inspector-copy'>No surface selected.</p>";
                return;
              }}
              inspector.innerHTML = `
                <section>
                  <p class="section-label">Gateway surface</p>
                  <h2 class="inspector-title mono">${{surface.surfaceId}}</h2>
                  <p class="inspector-copy">${{surface.rationale}}</p>
                </section>
                <section>
                  <p class="section-label">Authority</p>
                  <ul class="inspector-list">
                    <li><strong>Audience</strong><br />${{surface.audienceSurfaceRef}} · ${{surface.audience}}</li>
                    <li><strong>Route family</strong><br />${{surface.routeFamilies.join(", ")}}</li>
                    <li><strong>Tuple hash</strong><br /><span class="mono">${{surface.surfaceAuthorityTupleHash}}</span></li>
                    <li><strong>Session / cache</strong><br />${{surface.sessionPolicyRef}} · ${{surface.cachePolicyRef}}</li>
                  </ul>
                </section>
                <section>
                  <p class="section-label">Contexts</p>
                  <ul class="inspector-list">
                    <li><strong>Served contexts</strong><br />${{surface.servedBoundedContextRefs.join(", ")}}</li>
                    <li><strong>Mutating contexts</strong><br />${{surface.mutatingBoundedContextRefs.join(", ") || "read_only"}}</li>
                    <li><strong>Trust boundaries</strong><br />${{surface.trustZoneBoundaryRefs.join(", ")}}</li>
                    <li><strong>Recovery</strong><br />${{surface.recoveryDispositionRefs.join(", ")}}</li>
                  </ul>
                </section>
              `;
              renderLane(surface);
            }}

            function renderRouteRows(rows) {{
              routeBody.innerHTML = "";
              rows.forEach((row, index) => {{
                const tr = document.createElement("tr");
                tr.tabIndex = 0;
                tr.setAttribute("data-testid", `route-row-${{row.route_family_id}}-${{row.gateway_surface_id}}`);
                tr.dataset.selected =
                  state.selectedType === "surface" && state.selectedId === row.gateway_surface_id ? "true" : "false";
                tr.innerHTML = `
                  <td><span class="mono">${{row.route_family_id}}</span><br />${{row.route_family}}</td>
                  <td><span class="mono">${{row.gateway_surface_id}}</span></td>
                  <td>${{row.ownership_role}}</td>
                  <td>${{row.tenant_isolation_mode}}</td>
                `;
                tr.addEventListener("click", () => {{
                  state.selectedType = "surface";
                  state.selectedId = row.gateway_surface_id;
                  render();
                }});
                tr.addEventListener(
                  "keydown",
                  keyboardSelect(rows, index, nextLinearIndex, (nextRow) => {{
                    state.selectedType = "surface";
                    state.selectedId = nextRow.gateway_surface_id;
                    render();
                    document.querySelector(`[data-testid="route-row-${{nextRow.route_family_id}}-${{nextRow.gateway_surface_id}}"]`)?.focus();
                  }}),
                );
                routeBody.appendChild(tr);
              }});
            }}

            function renderBoundaryRows(rows) {{
              boundaryBody.innerHTML = "";
              rows.forEach((row, index) => {{
                const tr = document.createElement("tr");
                tr.tabIndex = 0;
                tr.setAttribute("data-testid", `boundary-row-${{row.trustZoneBoundaryId}}`);
                tr.dataset.selected =
                  state.selectedType === "boundary" && state.selectedId === row.trustZoneBoundaryId ? "true" : "false";
                tr.innerHTML = `
                  <td><span class="mono">${{row.trustZoneBoundaryId}}</span></td>
                  <td>${{row.boundaryState}}</td>
                  <td>${{row.sourceTrustZoneRef}} → ${{row.targetTrustZoneRef}}</td>
                  <td>${{row.tenantTransferMode}}</td>
                `;
                tr.addEventListener("click", () => {{
                  state.selectedType = "boundary";
                  state.selectedId = row.trustZoneBoundaryId;
                  render();
                }});
                tr.addEventListener(
                  "keydown",
                  keyboardSelect(rows, index, nextLinearIndex, (nextRow) => {{
                    state.selectedType = "boundary";
                    state.selectedId = nextRow.trustZoneBoundaryId;
                    render();
                    document.querySelector(`[data-testid="boundary-row-${{nextRow.trustZoneBoundaryId}}"]`)?.focus();
                  }}),
                );
                boundaryBody.appendChild(tr);
              }});
            }}

            function renderSplitDecisions() {{
              splitGrid.innerHTML = "";
              STUDIO_DATA.split_decisions.forEach((decision) => {{
                const card = document.createElement("article");
                card.className = "split-card";
                card.innerHTML = `
                  <div class="section-label mono">${{decision.decision_id}}</div>
                  <div style="font-weight:700;color:var(--text-strong);">${{decision.decision_state}}</div>
                  <div style="margin-top:8px;font-size:13px;color:var(--text-default);">${{decision.summary}}</div>
                  <div class="chip-row"></div>
                `;
                const chipRow = card.querySelector(".chip-row");
                decision.drivers.forEach((driver) => chipRow.appendChild(buildChip(driver)));
                splitGrid.appendChild(card);
              }});
            }}

            function render() {{
              const surfaces = visibleSurfaces();
              const boundaries = visibleBoundaries();
              ensureSelection();
              renderGatewayList(surfaces);
              renderBoundaryList(boundaries);
              renderZoneMap(surfaces, boundaries);
              renderRouteRows(visibleRouteRows());
              renderBoundaryRows(boundaries);
              renderSplitDecisions();
              renderInspector();
            }}

            filterZone.addEventListener("change", (event) => {{
              state.zone = event.target.value;
              render();
            }});
            filterAudience.addEventListener("change", (event) => {{
              state.audience = event.target.value;
              render();
            }});
            filterShell.addEventListener("change", (event) => {{
              state.shell = event.target.value;
              render();
            }});
            filterRoute.addEventListener("change", (event) => {{
              state.route = event.target.value;
              render();
            }});
            filterDefect.addEventListener("change", (event) => {{
              state.defect = event.target.value;
              render();
            }});

            render();
          </script>
        </body>
        </html>
        """
    ).strip()


def build_root_script_updates(package_json: dict[str, Any]) -> dict[str, Any]:
    updated = deepcopy(package_json)
    scripts = updated.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    return updated


def main() -> None:
    ensure_prerequisites()
    runtime_manifest = read_json(RUNTIME_MANIFEST_PATH)
    route_inventory = load_csv(ROUTE_INVENTORY_PATH)
    audience_inventory = load_csv(AUDIENCE_INVENTORY_PATH)
    gateway_rows = load_csv(GATEWAY_MATRIX_PATH)
    tenant_rows = load_csv(TENANT_MATRIX_PATH)

    boundary_rows = build_boundary_rows(runtime_manifest)
    surfaces = build_gateway_surfaces(
        runtime_manifest,
        route_inventory,
        audience_inventory,
        gateway_rows,
        tenant_rows,
    )
    route_rows = build_route_matrix(route_inventory, surfaces)
    contract_rows = build_contract_matrix(surfaces)

    trust_payload = build_trust_boundary_payload(runtime_manifest, boundary_rows)
    gateway_payload = build_gateway_payload(
        runtime_manifest, route_inventory, surfaces, route_rows, contract_rows
    )

    write_json(TRUST_BOUNDARY_PATH, trust_payload)
    write_json(GATEWAY_SURFACE_PATH, gateway_payload)
    write_csv(
        ROUTE_MATRIX_PATH,
        route_rows,
        [
            "route_family_id",
            "route_family",
            "gateway_surface_id",
            "primary_gateway_surface_id",
            "ownership_role",
            "audience_surface_ref",
            "audience",
            "shell_type",
            "browser_visible",
            "session_policy_ref",
            "tenant_isolation_mode",
            "downstream_workload_family_refs",
            "trust_zone_boundary_refs",
            "required_context_boundary_refs",
            "explicit_exception_ref",
            "explicit_exception_reason",
            "source_refs",
        ],
    )
    write_csv(
        CONTRACT_MATRIX_PATH,
        contract_rows,
        [
            "surface_id",
            "surface_name",
            "audience",
            "audience_surface_ref",
            "route_families",
            "served_bounded_context_refs",
            "mutating_bounded_context_refs",
            "required_context_boundary_refs",
            "entry_workload_family_ref",
            "downstream_workload_family_refs",
            "trust_zone_boundary_refs",
            "tenant_isolation_mode",
            "session_policy_ref",
            "cache_policy_ref",
            "recovery_disposition_profile_ref",
            "recovery_disposition_refs",
            "required_assurance_slice_refs",
            "surface_authority_tuple_hash",
            "source_refs",
        ],
    )
    write_text(STRATEGY_PATH, build_strategy_doc(trust_payload, gateway_payload))
    write_text(SURFACE_MAP_PATH, build_surface_map_doc(surfaces))
    write_text(DECISION_PATH, build_split_decision_doc(SPLIT_DECISIONS))
    write_text(GRAPH_PATH, build_graph_mmd(surfaces, boundary_rows))
    write_text(STUDIO_PATH, build_studio_html(trust_payload, gateway_payload))

    package_json = read_json(ROOT_PACKAGE_PATH)
    write_json(ROOT_PACKAGE_PATH, build_root_script_updates(package_json))


if __name__ == "__main__":
    main()
