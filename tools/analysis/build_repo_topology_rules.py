#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_ARCH_DIR = ROOT / "tools" / "architecture"

TASK_ID = "seq_041"
VISUAL_MODE = "Topology_Atlas"
CAPTURED_ON = "2026-04-11"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Freeze the authoritative Vecells repository topology, package boundary rules, bounded-context "
    "ownership map, and import-governance model before scaffold tasks 042-045 create executable "
    "apps, services, and packages."
)

MANIFEST_PATH = DATA_DIR / "repo_topology_manifest.json"
BOUNDARY_CSV_PATH = DATA_DIR / "package_boundary_rules.csv"
CONTRACTS_JSON_PATH = DATA_DIR / "context_boundary_contracts.json"
TOPOLOGY_RULES_MD_PATH = DOCS_DIR / "41_repository_topology_rules.md"
BOUNDARY_RULES_MD_PATH = DOCS_DIR / "41_package_boundary_rules.md"
ATLAS_HTML_PATH = DOCS_DIR / "41_repo_topology_atlas.html"
ATLAS_MMD_PATH = DOCS_DIR / "41_repo_topology_atlas.mmd"
DEPENDENCY_RULES_JSON_PATH = TOOLS_ARCH_DIR / "dependency_boundary_rules.json"

REQUIRED_INPUTS = {
    "shell_ownership_map": DATA_DIR / "shell_ownership_map.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "gateway_surface_matrix": DATA_DIR / "gateway_surface_matrix.csv",
    "audience_surface_inventory": DATA_DIR / "audience_surface_inventory.csv",
    "import_boundary_rules": DATA_DIR / "import_boundary_rules.json",
}

SOURCE_PRECEDENCE = [
    "prompt/041.md",
    "prompt/042.md",
    "prompt/043.md",
    "prompt/044.md",
    "prompt/shared_operating_contract_036_to_045.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/blueprint-init.md",
    "blueprint/platform-frontend-blueprint.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/operations-console-frontend-blueprint.md",
    "blueprint/pharmacy-console-frontend-architecture.md",
    "blueprint/governance-admin-console-frontend-blueprint.md",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "data/analysis/shell_ownership_map.json",
    "data/analysis/route_family_inventory.csv",
    "data/analysis/gateway_surface_matrix.csv",
    "data/analysis/audience_surface_inventory.csv",
    "data/analysis/import_boundary_rules.json",
    "docs/architecture/04_surface_conflict_and_gap_report.md",
    "docs/architecture/12_workspace_graph_atlas.html",
    "docs/architecture/14_frontend_stack_decision.md",
]

PRIMARY_CONTROLS = {
    "app": ["packages/api-contracts", "packages/design-system", "packages/observability", "packages/release-controls"],
    "app_forbidden": ["packages/domains/*", "services/*", "packages/fhir-mapping", "tools/** private entrypoints"],
    "api_gateway": ["packages/api-contracts", "packages/authz-policy", "packages/observability", "packages/release-controls"],
    "api_gateway_forbidden": ["packages/domains/* private internals", "apps/*", "packages/fhir-mapping", "direct adapter SDK imports"],
    "command_api": [
        "packages/domains/* (public entrypoints only)",
        "packages/domain-kernel",
        "packages/event-contracts",
        "packages/api-contracts",
        "packages/authz-policy",
        "packages/fhir-mapping",
        "packages/observability",
        "packages/release-controls",
    ],
    "command_api_forbidden": ["apps/*", "packages/design-system", "tools/** runtime bypasses"],
    "projection_worker": [
        "packages/domains/* (public projections only)",
        "packages/domain-kernel",
        "packages/event-contracts",
        "packages/api-contracts",
        "packages/fhir-mapping",
        "packages/observability",
        "packages/release-controls",
    ],
    "projection_worker_forbidden": ["apps/*", "packages/design-system", "direct browser clients"],
    "notification_worker": [
        "packages/domains/communications",
        "packages/domains/identity_access",
        "packages/domains/support",
        "packages/event-contracts",
        "packages/api-contracts",
        "packages/authz-policy",
        "packages/observability",
        "packages/release-controls",
    ],
    "notification_worker_forbidden": ["apps/*", "packages/design-system", "real provider credentials in source"],
    "adapter_simulators": [
        "packages/api-contracts",
        "packages/event-contracts",
        "packages/fhir-mapping",
        "packages/test-fixtures",
        "packages/observability",
    ],
    "adapter_simulators_forbidden": ["apps/*", "packages/domains/* private internals", "live-provider credentials"],
    "domain": ["packages/domain-kernel", "packages/event-contracts", "packages/authz-policy", "packages/observability"],
    "domain_forbidden": ["packages/domains/* sibling internals", "apps/*", "services/*", "packages/design-system"],
    "domain_kernel": [],
    "domain_kernel_forbidden": ["apps/*", "services/*", "packages/domains/*"],
    "shared_contracts": ["packages/domain-kernel", "packages/event-contracts", "packages/release-controls"],
    "shared_contracts_forbidden": ["apps/* truth owners", "services/* deep imports", "packages/domains/* private internals"],
    "event_contracts": ["packages/domain-kernel"],
    "event_contracts_forbidden": ["apps/*", "services/* deep imports"],
    "fhir_mapping": ["packages/domain-kernel", "packages/event-contracts", "packages/domains/* (representation-only entrypoints)"],
    "fhir_mapping_forbidden": ["apps/*", "services/* raw-store writes"],
    "design_system": [],
    "design_system_forbidden": ["packages/domains/*", "services/*"],
    "authz_policy": ["packages/domain-kernel", "packages/event-contracts", "packages/release-controls"],
    "authz_policy_forbidden": ["apps/* policy mutations", "services/* private domain models"],
    "observability": ["packages/domain-kernel", "packages/release-controls"],
    "observability_forbidden": ["apps/* truth writes", "packages/domains/* private internals"],
    "test_fixtures": ["packages/domain-kernel", "packages/event-contracts", "packages/api-contracts", "packages/domains/* (public test seams only)"],
    "test_fixtures_forbidden": ["apps/* runtime truth", "services/* private internals"],
    "release_controls": ["packages/domain-kernel", "packages/event-contracts", "packages/api-contracts", "packages/observability"],
    "release_controls_forbidden": ["apps/* release authority", "packages/domains/* private internals"],
    "docs_tools": ["data/analysis/*.json", "docs/architecture/*.md", "tests/playwright", "tools/analysis"],
    "docs_tools_forbidden": ["apps/* runtime truth", "services/* live credentials", "packages/domains/* private internals"],
    "assistive_lab": ["packages/api-contracts", "packages/release-controls", "packages/observability", "tests/playwright"],
    "assistive_lab_forbidden": ["packages/domains/* writable models", "services/* live mutation controls"],
}

CONTEXTS = [
    {
        "owner_context_code": "patient_experience",
        "owner_context_label": "Patient Experience",
        "owner_kind": "bounded_context",
        "category": "delivery",
        "accent": "#3559E6",
        "description": "Owns patient-shell residency, route continuity, and calm patient posture without owning any write model.",
    },
    {
        "owner_context_code": "triage_workspace",
        "owner_context_label": "Triage Workspace",
        "owner_kind": "bounded_context",
        "category": "delivery",
        "accent": "#0EA5A4",
        "description": "Owns the staff workspace shell, human checkpoint framing, and bounded assistive sidecar residency.",
    },
    {
        "owner_context_code": "hub_coordination",
        "owner_context_label": "Hub Coordination",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#3559E6",
        "description": "Owns hub queue, alternatives, acknowledgement, and exception-handling coordination flows.",
    },
    {
        "owner_context_code": "pharmacy",
        "owner_context_label": "Pharmacy",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#C98900",
        "description": "Owns pharmacy dispatch, provider-choice, and outcome proof handling without leaking into other shells.",
    },
    {
        "owner_context_code": "support",
        "owner_context_label": "Support",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#64748B",
        "description": "Owns support ticket, replay, observe, and assisted-capture control surfaces and package boundaries.",
    },
    {
        "owner_context_code": "operations",
        "owner_context_label": "Operations",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#0F9D58",
        "description": "Owns operations-board telemetry, drill-down, and intervention guardrails inside one exact shell family.",
    },
    {
        "owner_context_code": "governance_admin",
        "owner_context_label": "Governance Admin",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#6E59D9",
        "description": "Owns governance, release, access, config, and communications review work under one control-plane shell.",
    },
    {
        "owner_context_code": "intake_safety",
        "owner_context_label": "Intake Safety",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#3559E6",
        "description": "Owns submission ingress, promotion, artifact quarantine, and intake safety gates.",
    },
    {
        "owner_context_code": "identity_access",
        "owner_context_label": "Identity Access",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#0EA5A4",
        "description": "Owns claims, secure-link redemption, access grants, acting-scope rules, and authorization policy truth.",
    },
    {
        "owner_context_code": "booking",
        "owner_context_label": "Booking",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#3559E6",
        "description": "Owns booking, waitlist, reservation authority, and external confirmation gates.",
    },
    {
        "owner_context_code": "communications",
        "owner_context_label": "Communications",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#0EA5A4",
        "description": "Owns message, callback, and controlled-resend contracts while delivery evidence stays explicit.",
    },
    {
        "owner_context_code": "analytics_assurance",
        "owner_context_label": "Analytics Assurance",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#7C3AED",
        "description": "Owns published observability, trust slices, projection analytics, and assurance-facing telemetry contracts.",
    },
    {
        "owner_context_code": "audit_compliance",
        "owner_context_label": "Audit Compliance",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#C24141",
        "description": "Owns tamper-evident evidence, replay witness law, and compliance-oriented disclosure proofs.",
    },
    {
        "owner_context_code": "release_control",
        "owner_context_label": "Release Control",
        "owner_kind": "bounded_context",
        "category": "domain",
        "accent": "#7C3AED",
        "description": "Owns runtime publication, release approval freeze, watch tuples, and promotion parity controls.",
    },
    {
        "owner_context_code": "platform_runtime",
        "owner_context_label": "Platform Runtime",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#3559E6",
        "description": "Shared runtime application plane that stitches shells, contracts, services, and publication tuples without owning domain truth.",
    },
    {
        "owner_context_code": "platform_integration",
        "owner_context_label": "Platform Integration",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#0EA5A4",
        "description": "Shared integration and simulator class for bounded provider seams, receipts, retries, and non-authoritative local labs.",
    },
    {
        "owner_context_code": "shared_domain_kernel",
        "owner_context_label": "Shared Domain Kernel",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#7C3AED",
        "description": "Only legal shared home for reusable canonical primitives, identifiers, and cross-context invariants.",
    },
    {
        "owner_context_code": "shared_contracts",
        "owner_context_label": "Shared Contracts",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#7C3AED",
        "description": "Versioned publication packages for API, event, and derived representation contracts; never a convenience dump.",
    },
    {
        "owner_context_code": "design_system",
        "owner_context_label": "Design System",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#7C3AED",
        "description": "Owns design tokens, markers, accessibility vocabulary, and shell-inheritance law.",
    },
    {
        "owner_context_code": "test_fixtures",
        "owner_context_label": "Test Fixtures",
        "owner_kind": "shared_kernel_class",
        "category": "shared",
        "accent": "#667085",
        "description": "Owns non-authoritative fixture builders and publication-safe test helpers only.",
    },
    {
        "owner_context_code": "analysis_validation",
        "owner_context_label": "Analysis Validation",
        "owner_kind": "shared_kernel_class",
        "category": "tooling",
        "accent": "#667085",
        "description": "Owns docs, validation, architectural rule files, and Playwright instrumentation without runtime write authority.",
    },
    {
        "owner_context_code": "assistive_lab",
        "owner_context_label": "Assistive Lab",
        "owner_kind": "shared_kernel_class",
        "category": "tooling",
        "accent": "#C98900",
        "description": "Reserved tools-only namespace for standalone assistive evaluation, replay, or release-control work while live assist remains bounded.",
    },
]

APP_DEFINITIONS = [
    {
        "artifact_id": "app_patient_web",
        "repo_path": "apps/patient-web",
        "display_name": "Patient Web",
        "artifact_class": "app_shell",
        "owner_context_code": "patient_experience",
        "shell_types_owned": ["patient"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Owns patient-shell residency, including embedded reuse, while all lifecycle truth remains in packages and services.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
            "data/analysis/shell_ownership_map.json",
        ],
    },
    {
        "artifact_id": "app_clinical_workspace",
        "repo_path": "apps/clinical-workspace",
        "display_name": "Clinical Workspace",
        "artifact_class": "app_shell",
        "owner_context_code": "triage_workspace",
        "shell_types_owned": ["staff"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Owns the staff shell and bounded assistive sidecar while triage, booking, and communications truth stay package-owned.",
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#Clinical workspace shell",
            "blueprint/staff-operations-and-support-blueprint.md#Workspace contract",
            "data/analysis/audience_surface_inventory.csv",
        ],
    },
    {
        "artifact_id": "app_hub_desk",
        "repo_path": "apps/hub-desk",
        "display_name": "Hub Desk",
        "artifact_class": "app_shell",
        "owner_context_code": "hub_coordination",
        "shell_types_owned": ["hub"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Owns hub queue and case-management shell residency; booking, callback, and practice acknowledgements cross the seam only through contracts.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Hub work",
            "blueprint/phase-0-the-foundation-protocol.md#5.6 Booking, waitlist, hub, and pharmacy continuity algorithm",
            "data/analysis/route_family_inventory.csv",
        ],
    },
    {
        "artifact_id": "app_pharmacy_console",
        "repo_path": "apps/pharmacy-console",
        "display_name": "Pharmacy Console",
        "artifact_class": "app_shell",
        "owner_context_code": "pharmacy",
        "shell_types_owned": ["pharmacy"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Closes the starter-shape omission for the servicing-site shell and keeps dispatch proof inside package and service seams.",
        "source_refs": [
            "blueprint/pharmacy-console-frontend-architecture.md#Mission frame",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "data/analysis/gateway_surface_matrix.csv",
        ],
    },
    {
        "artifact_id": "app_support_workspace",
        "repo_path": "apps/support-workspace",
        "display_name": "Support Workspace",
        "artifact_class": "app_shell",
        "owner_context_code": "support",
        "shell_types_owned": ["support"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Closes the support-shell omission and records that replay, observe, and assisted capture remain support work rather than operations or governance drift.",
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "data/analysis/gateway_surface_matrix.csv",
        ],
    },
    {
        "artifact_id": "app_ops_console",
        "repo_path": "apps/ops-console",
        "display_name": "Ops Console",
        "artifact_class": "app_shell",
        "owner_context_code": "operations",
        "shell_types_owned": ["operations"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Owns operations board and drill-down shell frames while governance handoff stays explicit and reversible.",
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Canonical route family",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "data/analysis/route_family_inventory.csv",
        ],
    },
    {
        "artifact_id": "app_governance_console",
        "repo_path": "apps/governance-console",
        "display_name": "Governance Console",
        "artifact_class": "app_shell",
        "owner_context_code": "governance_admin",
        "shell_types_owned": ["governance"],
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["app"],
        "forbidden_dependencies": PRIMARY_CONTROLS["app_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_SHELLS_TO_DESIGN_SYSTEM", "CBC_041_SHELLS_TO_RELEASE_CONTROLS"],
        "notes": "Closes the governance/admin omission and makes release, access, config, and communications review a first-class shell rather than an operations subpanel.",
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "data/analysis/shell_ownership_map.json",
        ],
    },
]

SERVICE_DEFINITIONS = [
    {
        "artifact_id": "service_api_gateway",
        "repo_path": "services/api-gateway",
        "display_name": "API Gateway",
        "artifact_class": "service_gateway",
        "owner_context_code": "platform_runtime",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["api_gateway"],
        "forbidden_dependencies": PRIMARY_CONTROLS["api_gateway_forbidden"],
        "dependency_contract_refs": ["CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS", "CBC_041_API_GATEWAY_TO_IDENTITY_POLICY"],
        "notes": "Only browser-addressable compute boundary; owns route-scoped BFF ingress, auth/session edge adapters, and publication-aware freeze posture.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
            "blueprint/platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            "prompt/043.md",
        ],
    },
    {
        "artifact_id": "service_command_api",
        "repo_path": "services/command-api",
        "display_name": "Command API",
        "artifact_class": "service_runtime",
        "owner_context_code": "platform_runtime",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["command_api"],
        "forbidden_dependencies": PRIMARY_CONTROLS["command_api_forbidden"],
        "dependency_contract_refs": ["CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS", "CBC_041_COMMAND_API_TO_EVENT_CONTRACTS"],
        "notes": "Canonical mutation ingress and settlement seam; only service allowed to coordinate cross-context writes through published domain entrypoints.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
            "blueprint/platform-runtime-and-release-blueprint.md#MutationCommandContract",
            "prompt/043.md",
        ],
    },
    {
        "artifact_id": "service_projection_worker",
        "repo_path": "services/projection-worker",
        "display_name": "Projection Worker",
        "artifact_class": "service_runtime",
        "owner_context_code": "platform_runtime",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["projection_worker"],
        "forbidden_dependencies": PRIMARY_CONTROLS["projection_worker_forbidden"],
        "dependency_contract_refs": ["CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS", "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING"],
        "notes": "Derived-read and rebuild worker only; no canonical write authority and no browser-owned joins.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
            "prompt/043.md",
        ],
    },
    {
        "artifact_id": "service_notification_worker",
        "repo_path": "services/notification-worker",
        "display_name": "Notification Worker",
        "artifact_class": "service_runtime",
        "owner_context_code": "platform_integration",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["notification_worker"],
        "forbidden_dependencies": PRIMARY_CONTROLS["notification_worker_forbidden"],
        "dependency_contract_refs": ["CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY"],
        "notes": "Effect worker for dispatch, callback, resend, and provider settlement seams with explicit evidence and idempotency posture.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
            "prompt/043.md",
        ],
    },
    {
        "artifact_id": "service_adapter_simulators",
        "repo_path": "services/adapter-simulators",
        "display_name": "Adapter Simulators",
        "artifact_class": "service_runtime",
        "owner_context_code": "platform_integration",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["adapter_simulators"],
        "forbidden_dependencies": PRIMARY_CONTROLS["adapter_simulators_forbidden"],
        "dependency_contract_refs": ["CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES"],
        "notes": "Non-authoritative local integration lab for unavailable or manual providers; never a substitute for live-provider proof.",
        "source_refs": [
            "docs/external/38_local_adapter_simulator_backlog.md",
            "docs/external/39_manual_approval_checkpoint_register.md",
            "prompt/041.md",
        ],
    },
]

SHARED_PACKAGE_DEFINITIONS = [
    {
        "artifact_id": "package_domain_kernel",
        "repo_path": "packages/domain-kernel",
        "display_name": "Domain Kernel",
        "artifact_class": "shared_kernel_package",
        "owner_context_code": "shared_domain_kernel",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["domain_kernel"],
        "forbidden_dependencies": PRIMARY_CONTROLS["domain_kernel_forbidden"],
        "dependency_contract_refs": ["CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL"],
        "notes": "Only legal shared-kernel home for canonical identifiers, invariants, and cross-context primitives.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_event_contracts",
        "repo_path": "packages/event-contracts",
        "display_name": "Event Contracts",
        "artifact_class": "shared_contract_package",
        "owner_context_code": "shared_contracts",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["event_contracts"],
        "forbidden_dependencies": PRIMARY_CONTROLS["event_contracts_forbidden"],
        "dependency_contract_refs": ["CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS", "CBC_041_COMMAND_API_TO_EVENT_CONTRACTS"],
        "notes": "Canonical source for published event truth; downstream consumers may not replace it with route-local DTOs.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_api_contracts",
        "repo_path": "packages/api-contracts",
        "display_name": "API Contracts",
        "artifact_class": "shared_contract_package",
        "owner_context_code": "shared_contracts",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["shared_contracts"],
        "forbidden_dependencies": PRIMARY_CONTROLS["shared_contracts_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_API_CONTRACTS", "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS"],
        "notes": "Published browser and runtime contract surface; shells and services must consume this layer instead of sibling package internals.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_fhir_mapping",
        "repo_path": "packages/fhir-mapping",
        "display_name": "FHIR Mapping",
        "artifact_class": "shared_contract_package",
        "owner_context_code": "shared_contracts",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["fhir_mapping"],
        "forbidden_dependencies": PRIMARY_CONTROLS["fhir_mapping_forbidden"],
        "dependency_contract_refs": ["CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING"],
        "notes": "Derived representation boundary only; never a canonical truth owner or shortcut around command settlement.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_design_system",
        "repo_path": "packages/design-system",
        "display_name": "Design System",
        "artifact_class": "shared_design_package",
        "owner_context_code": "design_system",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["design_system"],
        "forbidden_dependencies": PRIMARY_CONTROLS["design_system_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_DESIGN_SYSTEM"],
        "notes": "Single legal shared home for tokens, automation markers, accessibility vocabulary, and shell-inheritance law.",
        "source_refs": [
            "docs/architecture/14_frontend_stack_decision.md",
            "blueprint/platform-frontend-blueprint.md#DesignContractPublicationBundle",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_authz_policy",
        "repo_path": "packages/authz-policy",
        "display_name": "Authz Policy",
        "artifact_class": "shared_policy_package",
        "owner_context_code": "identity_access",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["authz_policy"],
        "forbidden_dependencies": PRIMARY_CONTROLS["authz_policy_forbidden"],
        "dependency_contract_refs": ["CBC_041_API_GATEWAY_TO_IDENTITY_POLICY", "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY"],
        "notes": "Published scope, acting-context, and authorization fences; no app may mint local policy truth.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_test_fixtures",
        "repo_path": "packages/test-fixtures",
        "display_name": "Test Fixtures",
        "artifact_class": "shared_support_package",
        "owner_context_code": "test_fixtures",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["test_fixtures"],
        "forbidden_dependencies": PRIMARY_CONTROLS["test_fixtures_forbidden"],
        "dependency_contract_refs": ["CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES"],
        "notes": "Shared non-authoritative fixture builders; cannot become a dumping ground for runtime behavior.",
        "source_refs": [
            "prompt/044.md",
            "data/analysis/import_boundary_rules.json",
        ],
    },
    {
        "artifact_id": "package_observability",
        "repo_path": "packages/observability",
        "display_name": "Observability",
        "artifact_class": "shared_support_package",
        "owner_context_code": "analytics_assurance",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["observability"],
        "forbidden_dependencies": PRIMARY_CONTROLS["observability_forbidden"],
        "dependency_contract_refs": ["CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY", "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY"],
        "notes": "Published telemetry and trust-slice vocabulary for shells, services, and release controls; never a shadow write model.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#AssuranceSliceTrustRecord",
            "prompt/044.md",
        ],
    },
    {
        "artifact_id": "package_release_controls",
        "repo_path": "packages/release-controls",
        "display_name": "Release Controls",
        "artifact_class": "shared_policy_package",
        "owner_context_code": "release_control",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["release_controls"],
        "forbidden_dependencies": PRIMARY_CONTROLS["release_controls_forbidden"],
        "dependency_contract_refs": ["CBC_041_SHELLS_TO_RELEASE_CONTROLS", "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY"],
        "notes": "Single package family for publication tuples, approval freezes, watch posture, and runtime parity law.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "prompt/044.md",
        ],
    },
]

DOMAIN_PACKAGE_ORDER = [
    "intake_safety",
    "identity_access",
    "triage_workspace",
    "booking",
    "hub_coordination",
    "pharmacy",
    "communications",
    "support",
    "operations",
    "governance_admin",
    "analytics_assurance",
    "audit_compliance",
    "release_control",
]

SPECIAL_WORKSPACES = [
    {
        "artifact_id": "docs_architecture",
        "repo_path": "docs/architecture",
        "display_name": "Architecture Docs",
        "artifact_type": "docs-only",
        "artifact_class": "docs_workspace",
        "owner_context_code": "analysis_validation",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["docs_tools"],
        "forbidden_dependencies": PRIMARY_CONTROLS["docs_tools_forbidden"],
        "dependency_contract_refs": ["CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS"],
        "notes": "Reserved docs-only workspace for topology, ADR, and architecture artifacts; documentation is descriptive and machine-checked, not authoritative runtime truth.",
        "source_refs": ["prompt/041.md", "prompt/042.md"],
        "shell_types_owned": [],
        "route_families_owned": [],
        "gateway_surfaces_owned": [],
    },
    {
        "artifact_id": "tool_analysis",
        "repo_path": "tools/analysis",
        "display_name": "Analysis Tools",
        "artifact_type": "tools-only",
        "artifact_class": "tools_workspace",
        "owner_context_code": "analysis_validation",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["docs_tools"],
        "forbidden_dependencies": PRIMARY_CONTROLS["docs_tools_forbidden"],
        "dependency_contract_refs": ["CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS"],
        "notes": "Holds deterministic generators and validators only; no runtime mutation authority.",
        "source_refs": ["prompt/041.md", "data/analysis/import_boundary_rules.json"],
        "shell_types_owned": [],
        "route_families_owned": [],
        "gateway_surfaces_owned": [],
    },
    {
        "artifact_id": "tool_architecture",
        "repo_path": "tools/architecture",
        "display_name": "Architecture Rules",
        "artifact_type": "tools-only",
        "artifact_class": "tools_workspace",
        "owner_context_code": "analysis_validation",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["docs_tools"],
        "forbidden_dependencies": PRIMARY_CONTROLS["docs_tools_forbidden"],
        "dependency_contract_refs": ["CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS"],
        "notes": "Reserved home for machine-readable dependency and ownership rules that lint and CI can consume directly.",
        "source_refs": ["prompt/041.md", "prompt/042.md"],
        "shell_types_owned": [],
        "route_families_owned": [],
        "gateway_surfaces_owned": [],
    },
    {
        "artifact_id": "tool_playwright",
        "repo_path": "tests/playwright",
        "display_name": "Playwright Tests",
        "artifact_type": "tools-only",
        "artifact_class": "tools_workspace",
        "owner_context_code": "analysis_validation",
        "topology_status": "baseline_required",
        "allowed_dependencies": PRIMARY_CONTROLS["docs_tools"],
        "forbidden_dependencies": PRIMARY_CONTROLS["docs_tools_forbidden"],
        "dependency_contract_refs": ["CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS"],
        "notes": "Owns browser instrumentation and parity checks from day one; never a runtime truth owner.",
        "source_refs": ["prompt/shared_operating_contract_036_to_045.md", "prompt/041.md"],
        "shell_types_owned": [],
        "route_families_owned": [],
        "gateway_surfaces_owned": [],
    },
    {
        "artifact_id": "tool_assistive_control_lab",
        "repo_path": "tools/assistive-control-lab",
        "display_name": "Assistive Control Lab",
        "artifact_type": "tools-only",
        "artifact_class": "tools_workspace",
        "owner_context_code": "assistive_lab",
        "topology_status": "conditional_reserved",
        "allowed_dependencies": PRIMARY_CONTROLS["assistive_lab"],
        "forbidden_dependencies": PRIMARY_CONTROLS["assistive_lab_forbidden"],
        "dependency_contract_refs": ["CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS"],
        "notes": "Conditional reserved namespace for standalone assistive evaluation, replay, monitoring, or release-control work; live assist remains inside `apps/clinical-workspace`.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1 PersistentShell",
            "data/analysis/shell_ownership_map.json",
            "prompt/041.md",
        ],
        "shell_types_owned": ["assistive"],
        "route_families_owned": ["rf_assistive_control_shell"],
        "gateway_surfaces_owned": [],
    },
]

BOUNDARY_RULES = [
    {
        "rule_id": "RULE_041_ONE_OWNER_PER_PATH",
        "rule_scope": "ownership",
        "from_selector": "*",
        "to_selector": "artifact.repo_path",
        "verdict": "required",
        "allowed_access": "Every repo path must resolve to exactly one owner context or one shared-kernel class.",
        "description": "Closes the starter-shape ambiguity by making path ownership machine-checkable before scaffold work begins.",
        "enforcement_layers": ["manifest", "validator", "CODEOWNERS"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            "data/analysis/import_boundary_rules.json#RULE_ONE_OWNER_DOMAIN",
        ],
    },
    {
        "rule_id": "RULE_041_ONE_OWNER_PER_ROUTE_FAMILY",
        "rule_scope": "shell_ownership",
        "from_selector": "route_family_id",
        "to_selector": "artifact.repo_path",
        "verdict": "required",
        "allowed_access": "Every route family must resolve to one topology owner, even when the route label is still derived.",
        "description": "Closes route-family ownership drift before apps are scaffolded.",
        "enforcement_layers": ["manifest", "validator"],
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
            "data/analysis/shell_ownership_map.json",
        ],
    },
    {
        "rule_id": "RULE_041_ONE_OWNER_PER_SHELL_FAMILY",
        "rule_scope": "shell_ownership",
        "from_selector": "shell_type",
        "to_selector": "artifact.repo_path",
        "verdict": "required",
        "allowed_access": "Every shell family must resolve to exactly one baseline app or one explicitly conditional reserved workspace.",
        "description": "Closes the omission of support, pharmacy, governance, and assistive shell representation in the starter shape.",
        "enforcement_layers": ["manifest", "validator"],
        "source_refs": [
            "docs/architecture/04_surface_conflict_and_gap_report.md",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_APPS_CONSUME_PUBLISHED_PACKAGES_ONLY",
        "rule_scope": "imports",
        "from_selector": "apps/*",
        "to_selector": "packages/api-contracts|packages/design-system|packages/observability|packages/release-controls",
        "verdict": "allow",
        "allowed_access": "Shell apps may only import published shared packages and contract bundles.",
        "description": "No app may import domain package internals, private services, or raw representation mappers.",
        "enforcement_layers": ["Nx tags", "ESLint boundary rules", "validator"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_NO_APP_OWNS_TRUTH",
        "rule_scope": "ownership",
        "from_selector": "apps/*",
        "to_selector": "packages/domains/*",
        "verdict": "deny",
        "allowed_access": "Shell code may render projections, issue commands through contracts, and preserve continuity only.",
        "description": "Closes the app-owns-truth gap by explicitly reserving write-model ownership to packages and services.",
        "enforcement_layers": ["README metadata", "validator", "CI policy"],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_SHARED_CODE_LIVES_ONLY_IN_EXPLICIT_SHARED_PACKAGES",
        "rule_scope": "imports",
        "from_selector": "*",
        "to_selector": "packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/design-system|packages/authz-policy|packages/test-fixtures|packages/observability|packages/release-controls|packages/fhir-mapping",
        "verdict": "required",
        "allowed_access": "Shared code is legal only in explicit versioned packages, never in a generic utils folder.",
        "description": "Closes the shared-util loophole by freezing the only legal shared namespaces.",
        "enforcement_layers": ["Nx tags", "export maps", "validator"],
        "source_refs": [
            "prompt/041.md",
            "data/analysis/import_boundary_rules.json#RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS",
        ],
    },
    {
        "rule_id": "RULE_041_GATEWAY_CONSUMES_API_AND_POLICY_CONTRACTS_ONLY",
        "rule_scope": "imports",
        "from_selector": "services/api-gateway",
        "to_selector": "packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls",
        "verdict": "allow",
        "allowed_access": "Gateway code may publish route-scoped compute boundaries only from contracts and policy packages.",
        "description": "Prevents the gateway from reaching into domain internals or becoming a hidden truth owner.",
        "enforcement_layers": ["Nx tags", "ESLint boundary rules", "validator"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_GATEWAY_USES_CONTRACTS_NOT_DOMAIN_INTERNALS",
            "prompt/043.md",
        ],
    },
    {
        "rule_id": "RULE_041_COMMAND_API_WRITES_VIA_PUBLISHED_DOMAIN_ENTRYPOINTS",
        "rule_scope": "imports",
        "from_selector": "services/command-api",
        "to_selector": "packages/domains/*|packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls",
        "verdict": "allow",
        "allowed_access": "Command API is the only runtime service that may compose multiple domain packages, and only through public entrypoints.",
        "description": "Freezes the authoritative mutation seam before feature logic lands.",
        "enforcement_layers": ["Nx tags", "validator"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY",
            "prompt/043.md",
        ],
    },
    {
        "rule_id": "RULE_041_PROJECTION_WORKER_IS_DERIVED_ONLY",
        "rule_scope": "imports",
        "from_selector": "services/projection-worker",
        "to_selector": "packages/domains/*|packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/fhir-mapping|packages/observability|packages/release-controls",
        "verdict": "allow",
        "allowed_access": "Projection worker may rebuild derived reads and representations only.",
        "description": "Prevents projection freshness, FHIR mapping, or stale-read posture from becoming hidden write authority.",
        "enforcement_layers": ["Nx tags", "validator"],
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
            "prompt/043.md",
        ],
    },
    {
        "rule_id": "RULE_041_NOTIFICATION_WORKER_SETTLES_EFFECTS_NOT_DOMAIN_TRUTH",
        "rule_scope": "imports",
        "from_selector": "services/notification-worker",
        "to_selector": "packages/domains/communications|packages/domains/identity_access|packages/domains/support|packages/event-contracts|packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls",
        "verdict": "allow",
        "allowed_access": "Notification worker may orchestrate effects, receipts, and resend seams only.",
        "description": "Prevents the worker from becoming a convenience vendor wrapper that silently settles business truth.",
        "enforcement_layers": ["Nx tags", "validator"],
        "source_refs": [
            "prompt/043.md",
            "docs/external/39_manual_approval_checkpoint_register.md",
        ],
    },
    {
        "rule_id": "RULE_041_ADAPTER_SIMULATORS_ARE_NON_AUTHORITATIVE",
        "rule_scope": "imports",
        "from_selector": "services/adapter-simulators",
        "to_selector": "packages/api-contracts|packages/event-contracts|packages/fhir-mapping|packages/test-fixtures|packages/observability",
        "verdict": "allow",
        "allowed_access": "Simulators may model provider seams and proof envelopes only.",
        "description": "Ensures local labs cannot replace live-provider proof or mutate domain truth directly.",
        "enforcement_layers": ["validator", "CI policy"],
        "source_refs": [
            "docs/external/38_local_adapter_simulator_backlog.md",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_DOMAIN_PACKAGES_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS",
        "rule_scope": "imports",
        "from_selector": "packages/domains/*",
        "to_selector": "packages/domain-kernel|packages/event-contracts|packages/authz-policy|packages/observability",
        "verdict": "allow",
        "allowed_access": "Domain packages may use the kernel, published event contracts, policy, and telemetry contracts only.",
        "description": "Sibling domain internals remain forbidden; cross-context seams publish through contracts instead.",
        "enforcement_layers": ["Nx tags", "ESLint boundary rules", "validator"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS",
            "prompt/044.md",
        ],
    },
    {
        "rule_id": "RULE_041_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
        "rule_scope": "publication",
        "from_selector": "packages/event-contracts|packages/api-contracts",
        "to_selector": "apps/*|services/*|packages/domains/*",
        "verdict": "required",
        "allowed_access": "Published route, event, and API truth comes only from explicit contract packages.",
        "description": "No ad hoc DTO folder or route-local type may supersede published contracts.",
        "enforcement_layers": ["codegen", "validator", "CI parity"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_RELEASE_CONTROLS_BIND_RUNTIME_PUBLICATION",
        "rule_scope": "publication",
        "from_selector": "packages/release-controls",
        "to_selector": "apps/*|services/*|packages/observability",
        "verdict": "required",
        "allowed_access": "Publication, approval-freeze, and watch tuples bind release truth across shells and services.",
        "description": "No consumer may restitch route, event, design, and release truth independently.",
        "enforcement_layers": ["validator", "CI parity"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_RUNTIME_PUBLICATION_BINDS_ROUTE_EVENT_DESIGN_AND_RELEASE_TRUTH",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
        ],
    },
    {
        "rule_id": "RULE_041_FHIR_MAPPING_IS_DERIVED_ONLY",
        "rule_scope": "representation",
        "from_selector": "packages/fhir-mapping",
        "to_selector": "packages/domains/*",
        "verdict": "allow",
        "allowed_access": "FHIR mapping may consume public domain representation entrypoints only.",
        "description": "Derived mapping may never write or own canonical lifecycle truth.",
        "enforcement_layers": ["validator", "CI parity"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_FHIR_MAPPING_IS_DERIVED_ONLY",
            "prompt/044.md",
        ],
    },
    {
        "rule_id": "RULE_041_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS",
        "rule_scope": "design_contract",
        "from_selector": "apps/*",
        "to_selector": "packages/design-system",
        "verdict": "required",
        "allowed_access": "Every shell must inherit the shared design system and automation marker graph from day one.",
        "description": "Closes the placeholder-shell drift where shells look identical or ship without stable markers.",
        "enforcement_layers": ["README metadata", "Playwright", "validator"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS",
            "prompt/042.md",
        ],
    },
    {
        "rule_id": "RULE_041_TOOLING_IS_BOUNDED_AND_NON_AUTHORITATIVE",
        "rule_scope": "tooling",
        "from_selector": "tools/*|tests/playwright|docs/architecture",
        "to_selector": "data/analysis/*.json|docs/architecture/*.md|tools/analysis|tools/architecture",
        "verdict": "allow",
        "allowed_access": "Tooling may read and validate manifests, docs, and contracts only.",
        "description": "Scripts, browser tests, and architecture docs may not become hidden runtime truth owners.",
        "enforcement_layers": ["validator", "CI policy"],
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_TOOLING_LANGUAGES_ARE_BOUNDED_AND_NON_AUTHORITATIVE",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_PLAYWRIGHT_EXISTS_FROM_DAY_ONE",
        "rule_scope": "verification",
        "from_selector": "tests/playwright",
        "to_selector": "docs/architecture/41_repo_topology_atlas.html",
        "verdict": "required",
        "allowed_access": "Browser verification is mandatory for topology surfaces and later shell scaffolds.",
        "description": "Freezes Playwright as a baseline deliverable instead of a late smoke-test afterthought.",
        "enforcement_layers": ["Playwright", "validator"],
        "source_refs": [
            "prompt/shared_operating_contract_036_to_045.md",
            "prompt/041.md",
        ],
    },
    {
        "rule_id": "RULE_041_CONDITIONAL_ASSISTIVE_STANDALONE_STAYS_TOOLS_ONLY",
        "rule_scope": "conditional_surface",
        "from_selector": "tools/assistive-control-lab",
        "to_selector": "packages/api-contracts|packages/release-controls|packages/observability|tests/playwright",
        "verdict": "allow",
        "allowed_access": "Standalone assistive work is reserved for evaluation, replay, monitoring, or release control only.",
        "description": "Prevents a future assistive shell from silently widening into live-care ownership before later prompts publish concrete route contracts.",
        "enforcement_layers": ["manifest", "validator"],
        "source_refs": [
            "data/analysis/shell_ownership_map.json",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
        ],
    },
]

CONTEXT_BOUNDARY_CONTRACTS = [
    {
        "contract_id": "CBC_041_SHELLS_TO_API_CONTRACTS",
        "title": "Shell apps consume published browser/runtime contracts only",
        "from_owner_codes": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
        ],
        "to_owner_codes": ["shared_contracts"],
        "transport_family": "published_contract_package",
        "allowed_from_selectors": ["apps/*"],
        "allowed_to_selectors": ["packages/api-contracts"],
        "write_model_rule": "No shell may reach through API contracts into domain or service private internals.",
        "notes": "This seam carries typed browser/runtime contracts, never canonical domain objects.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "prompt/041.md",
        ],
    },
    {
        "contract_id": "CBC_041_SHELLS_TO_DESIGN_SYSTEM",
        "title": "Shell apps inherit one shared design and marker bundle",
        "from_owner_codes": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
        ],
        "to_owner_codes": ["design_system"],
        "transport_family": "design_contract_package",
        "allowed_from_selectors": ["apps/*"],
        "allowed_to_selectors": ["packages/design-system"],
        "write_model_rule": "Design inheritance may change posture and automation markers but never mint business truth.",
        "notes": "Keeps placeholder shells visually distinct while preserving one product family and one marker graph.",
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#DesignContractPublicationBundle",
            "prompt/042.md",
        ],
    },
    {
        "contract_id": "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
        "title": "Shell apps consume runtime publication and release posture through one package family",
        "from_owner_codes": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
        ],
        "to_owner_codes": ["release_control"],
        "transport_family": "runtime_publication_bundle",
        "allowed_from_selectors": ["apps/*"],
        "allowed_to_selectors": ["packages/release-controls"],
        "write_model_rule": "Shells may render read-only, recovery-only, or writable posture only when release controls say so.",
        "notes": "Binds route, release, parity, and recovery truth into one publication seam.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "prompt/041.md",
        ],
    },
    {
        "contract_id": "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
        "title": "API Gateway publishes route-scoped compute from shared contracts",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": ["shared_contracts", "release_control"],
        "transport_family": "gateway_contract_publication",
        "allowed_from_selectors": ["services/api-gateway"],
        "allowed_to_selectors": ["packages/api-contracts", "packages/release-controls", "packages/observability"],
        "write_model_rule": "Gateway never owns or mutates domain truth; it enforces policy and publication only.",
        "notes": "The gateway stays contract-first and release-aware instead of calling domain internals directly.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_API_GATEWAY_TO_IDENTITY_POLICY",
        "title": "API Gateway enforces acting-scope and authz policy through the published policy package",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": ["identity_access"],
        "transport_family": "policy_contract",
        "allowed_from_selectors": ["services/api-gateway"],
        "allowed_to_selectors": ["packages/authz-policy"],
        "write_model_rule": "Gateway evaluates policy; it never writes access grants, claims, or tenant truth.",
        "notes": "This keeps the browser edge fenced by declared policy tuples instead of route-local shortcuts.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS",
        "title": "Command API is the only cross-context mutation coordinator",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": DOMAIN_PACKAGE_ORDER,
        "transport_family": "published_domain_entrypoint",
        "allowed_from_selectors": ["services/command-api"],
        "allowed_to_selectors": ["packages/domains/*", "packages/domain-kernel", "packages/authz-policy"],
        "write_model_rule": "Command API may coordinate mutations, but only through public package entrypoints and settlement law.",
        "notes": "Cross-context writes remain explicit and reviewable instead of spreading across apps or sibling services.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#LifecycleCoordinator",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_COMMAND_API_TO_EVENT_CONTRACTS",
        "title": "Command API publishes authoritative downstream events through one event contract package",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": ["shared_contracts"],
        "transport_family": "event_publication",
        "allowed_from_selectors": ["services/command-api"],
        "allowed_to_selectors": ["packages/event-contracts"],
        "write_model_rule": "The command path may emit only versioned canonical events, never ad hoc local DTOs.",
        "notes": "Keeps mutation, settlement, and projection replay aligned to one published event catalogue.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
        "title": "Projection Worker consumes published domain events and public projection seams only",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": DOMAIN_PACKAGE_ORDER,
        "transport_family": "projection_rebuild",
        "allowed_from_selectors": ["services/projection-worker"],
        "allowed_to_selectors": ["packages/domains/*", "packages/domain-kernel", "packages/event-contracts", "packages/api-contracts"],
        "write_model_rule": "Projection worker may derive read truth but never settle canonical state.",
        "notes": "All read models stay downstream of immutable events and published contracts.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING",
        "title": "Projection Worker reaches FHIR mapping only through the derived representation boundary",
        "from_owner_codes": ["platform_runtime"],
        "to_owner_codes": ["shared_contracts"],
        "transport_family": "derived_representation",
        "allowed_from_selectors": ["services/projection-worker"],
        "allowed_to_selectors": ["packages/fhir-mapping"],
        "write_model_rule": "FHIR representations remain derived and one-way from domain settlements.",
        "notes": "This seam is explicit so partner exchange scaffolds cannot bypass the canonical event spine later.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
            "prompt/044.md",
        ],
    },
    {
        "contract_id": "CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY",
        "title": "Notification Worker consumes communications, support, and identity seams as bounded effect contracts",
        "from_owner_codes": ["platform_integration"],
        "to_owner_codes": ["communications", "support", "identity_access", "release_control"],
        "transport_family": "effect_settlement",
        "allowed_from_selectors": ["services/notification-worker"],
        "allowed_to_selectors": ["packages/domains/communications", "packages/domains/support", "packages/domains/identity_access", "packages/release-controls"],
        "write_model_rule": "Delivery evidence, callback, and resend logic stay explicit; no worker may claim business finality from a partial provider receipt.",
        "notes": "Ties notification scaffolding back to the manual checkpoint and retry law from seq_039 and seq_040.",
        "source_refs": [
            "docs/external/39_manual_approval_checkpoint_register.md",
            "docs/external/40_degraded_mode_defaults.md",
            "prompt/043.md",
        ],
    },
    {
        "contract_id": "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
        "title": "Adapter simulators consume published contracts and fixture builders only",
        "from_owner_codes": ["platform_integration"],
        "to_owner_codes": ["shared_contracts", "test_fixtures", "analytics_assurance"],
        "transport_family": "local_simulator_contract",
        "allowed_from_selectors": ["services/adapter-simulators"],
        "allowed_to_selectors": ["packages/api-contracts", "packages/event-contracts", "packages/fhir-mapping", "packages/test-fixtures", "packages/observability"],
        "write_model_rule": "Simulator responses are bounded evidence and parity aids, never live-provider truth.",
        "notes": "Closes the mock-now vs live-later drift by giving simulators an explicit contract-only seam.",
        "source_refs": [
            "docs/external/38_local_adapter_simulator_backlog.md",
            "docs/external/40_mock_vs_actual_contract_delta.md",
            "prompt/041.md",
        ],
    },
    {
        "contract_id": "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
        "title": "Every domain package consumes one shared kernel",
        "from_owner_codes": DOMAIN_PACKAGE_ORDER,
        "to_owner_codes": ["shared_domain_kernel"],
        "transport_family": "shared_kernel",
        "allowed_from_selectors": ["packages/domains/*"],
        "allowed_to_selectors": ["packages/domain-kernel"],
        "write_model_rule": "Cross-context primitives may live only in the kernel, not in sibling domain internals.",
        "notes": "This seam is the only legal shared primitive path across domain packages.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor",
            "prompt/044.md",
        ],
    },
    {
        "contract_id": "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
        "title": "Every domain package publishes through one event contract family",
        "from_owner_codes": DOMAIN_PACKAGE_ORDER,
        "to_owner_codes": ["shared_contracts"],
        "transport_family": "event_contract",
        "allowed_from_selectors": ["packages/domains/*"],
        "allowed_to_selectors": ["packages/event-contracts"],
        "write_model_rule": "Domains publish and consume versioned events; they do not deep-import sibling models.",
        "notes": "Creates one machine-readable seam for every cross-context event handoff.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ContextBoundaryContract",
            "prompt/044.md",
        ],
    },
    {
        "contract_id": "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
        "title": "Domain packages consume policy and telemetry through published packages only",
        "from_owner_codes": DOMAIN_PACKAGE_ORDER,
        "to_owner_codes": ["identity_access", "analytics_assurance"],
        "transport_family": "policy_and_telemetry",
        "allowed_from_selectors": ["packages/domains/*"],
        "allowed_to_selectors": ["packages/authz-policy", "packages/observability"],
        "write_model_rule": "Policy and telemetry can constrain or observe domain behavior, but never replace domain-owned aggregates.",
        "notes": "Explicitly blocks the informal shared-utils path for policy helpers or telemetry wrappers.",
        "source_refs": [
            "data/analysis/import_boundary_rules.json#RULE_TOOLING_LANGUAGES_ARE_BOUNDED_AND_NON_AUTHORITATIVE",
            "prompt/044.md",
        ],
    },
    {
        "contract_id": "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
        "title": "Release control consumes trust and readiness through observability contracts",
        "from_owner_codes": ["release_control"],
        "to_owner_codes": ["analytics_assurance"],
        "transport_family": "watch_tuple_parity",
        "allowed_from_selectors": ["packages/release-controls"],
        "allowed_to_selectors": ["packages/observability"],
        "write_model_rule": "Release controls may freeze posture based on watch and readiness proof, not on local optimism.",
        "notes": "Binds publication parity to watch tuples and assurance evidence before later release scaffolding lands.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "prompt/041.md",
        ],
    },
    {
        "contract_id": "CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS",
        "title": "Docs, analysis, architecture rules, and Playwright consume manifests rather than runtime internals",
        "from_owner_codes": ["analysis_validation"],
        "to_owner_codes": ["analysis_validation", "shared_contracts", "release_control"],
        "transport_family": "machine_readable_manifest",
        "allowed_from_selectors": ["docs/architecture", "tools/analysis", "tools/architecture", "tests/playwright"],
        "allowed_to_selectors": ["data/analysis/*.json", "tools/architecture/dependency_boundary_rules.json", "docs/architecture/*.md"],
        "write_model_rule": "Tooling reads manifests and docs only; it cannot become a backdoor runtime owner.",
        "notes": "Keeps validation and browser coverage first-class without widening tooling into business logic.",
        "source_refs": [
            "prompt/shared_operating_contract_036_to_045.md",
            "prompt/041.md",
        ],
    },
    {
        "contract_id": "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
        "title": "Standalone assistive work is reserved behind contract and release-control fences",
        "from_owner_codes": ["assistive_lab"],
        "to_owner_codes": ["shared_contracts", "release_control", "analytics_assurance"],
        "transport_family": "conditional_assistive_surface",
        "allowed_from_selectors": ["tools/assistive-control-lab"],
        "allowed_to_selectors": ["packages/api-contracts", "packages/release-controls", "packages/observability", "tests/playwright"],
        "write_model_rule": "Conditional assistive work may evaluate, replay, or observe only; live care assist must remain inside the owning shell.",
        "notes": "Makes the assistive shell decision explicit without prematurely scaffolding a baseline app.",
        "source_refs": [
            "data/analysis/shell_ownership_map.json",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
        ],
    },
]

TOPOLOGY_DEFECTS = [
    {
        "defect_id": "DEFECT_041_LATER_SHELLS_OMITTED_FROM_STARTER_SHAPE",
        "state": "resolved",
        "severity": "high",
        "title": "Support, pharmacy, and governance shell families were omitted from the starter shape",
        "summary": "The Phase 0 starter shape listed four baseline apps but later blueprints required support, pharmacy, and governance shells too. This manifest closes the gap by freezing all seven baseline apps now.",
        "affected_artifact_ids": [
            "app_pharmacy_console",
            "app_support_workspace",
            "app_governance_console",
            "package_domains_pharmacy",
            "package_domains_support",
            "package_domains_governance_admin",
        ],
        "source_refs": [
            "prompt/041.md",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
        ],
    },
    {
        "defect_id": "DEFECT_041_SHARED_UTIL_LOOPHOLE",
        "state": "resolved",
        "severity": "high",
        "title": "A generic shared-utils escape hatch would have allowed cross-context truth drift",
        "summary": "Shared code is now legal only in explicit shared-kernel, shared-contract, policy, design, release, observability, or fixture packages. No generic utils namespace remains in the topology.",
        "affected_artifact_ids": [
            "package_domain_kernel",
            "package_event_contracts",
            "package_api_contracts",
            "package_design_system",
            "package_authz_policy",
            "package_test_fixtures",
            "package_observability",
            "package_release_controls",
            "package_fhir_mapping",
        ],
        "source_refs": [
            "prompt/041.md",
            "data/analysis/import_boundary_rules.json",
        ],
    },
    {
        "defect_id": "DEFECT_041_APP_OWNS_TRUTH_AMBIGUITY",
        "state": "resolved",
        "severity": "high",
        "title": "App shell ownership could have been confused with write-model ownership",
        "summary": "Every app row now records shell ownership separately from package and service write ownership. The boundary rules explicitly forbid apps from importing domain package internals or claiming canonical truth.",
        "affected_artifact_ids": [
            "app_patient_web",
            "app_clinical_workspace",
            "app_hub_desk",
            "app_pharmacy_console",
            "app_support_workspace",
            "app_ops_console",
            "app_governance_console",
        ],
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
            "prompt/041.md",
        ],
    },
    {
        "defect_id": "DEFECT_041_DERIVED_PATIENT_ENTRY_ROUTES",
        "state": "watch",
        "severity": "medium",
        "title": "Patient intake and secure-link entry route families are still inventory labels rather than final URL contracts",
        "summary": "Ownership is frozen now so later prompts can scaffold safely, but intake web, telephony, and secure-link recovery still need final endpoint publication to replace derived route labels.",
        "affected_artifact_ids": ["app_patient_web"],
        "source_refs": [
            "data/analysis/route_family_inventory.csv",
            "data/analysis/shell_ownership_map.json",
            "docs/architecture/04_surface_conflict_and_gap_report.md",
        ],
    },
    {
        "defect_id": "DEFECT_041_STANDALONE_ASSISTIVE_REMAINS_CONDITIONAL",
        "state": "watch",
        "severity": "medium",
        "title": "Standalone assistive work remains conditional until later prompts publish concrete routes and live-control fences",
        "summary": "The baseline topology reserves `tools/assistive-control-lab` only as a conditional tools-only namespace. Live assistive usage remains inside `apps/clinical-workspace` until a later prompt explicitly widens scope.",
        "affected_artifact_ids": ["tool_assistive_control_lab"],
        "source_refs": [
            "data/analysis/shell_ownership_map.json",
            "prompt/041.md",
        ],
    },
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def slug_to_title(value: str) -> str:
    return value.replace("_", " ").title()


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    TOOLS_ARCH_DIR.mkdir(parents=True, exist_ok=True)


def build_context_index() -> dict[str, dict[str, Any]]:
    return {context["owner_context_code"]: context for context in CONTEXTS}


def build_route_index(rows: list[dict[str, str]]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for row in rows:
        index[row["route_family_id"]] = {
            "route_family_id": row["route_family_id"],
            "route_family": row["route_family"],
            "shell_type": row["shell_type"],
            "explicit_route_contract": row["explicit_route_contract"].strip().lower() == "yes",
            "scope_posture": row["scope_posture"],
            "source_refs": [part.strip() for part in row["source_refs"].split(";") if part.strip()],
        }
    return index


def build_gateway_index(rows: list[dict[str, str]]) -> tuple[dict[str, list[dict[str, str]]], dict[str, dict[str, str]]]:
    by_shell: dict[str, list[dict[str, str]]] = defaultdict(list)
    flat: dict[str, dict[str, str]] = {}
    for row in rows:
        payload = {
            "gateway_surface_id": row["gateway_surface_id"],
            "surface_name": row["surface_name"],
            "route_family_id": row["route_family_id"],
            "shell_type": row["shell_type"],
            "source_refs": [part.strip() for part in row["source_refs"].split(";") if part.strip()],
        }
        by_shell[row["shell_type"]].append(payload)
        flat[row["gateway_surface_id"]] = payload
    for items in by_shell.values():
        items.sort(key=lambda item: item["gateway_surface_id"])
    return by_shell, flat


def make_domain_package_definitions() -> list[dict[str, Any]]:
    definitions: list[dict[str, Any]] = []
    for context_code in DOMAIN_PACKAGE_ORDER:
        definitions.append(
            {
                "artifact_id": f"package_domains_{context_code}",
                "repo_path": f"packages/domains/{context_code}",
                "display_name": f"{slug_to_title(context_code)} Domain",
                "artifact_class": "domain_context_package",
                "owner_context_code": context_code,
                "topology_status": "baseline_required",
                "allowed_dependencies": PRIMARY_CONTROLS["domain"],
                "forbidden_dependencies": PRIMARY_CONTROLS["domain_forbidden"],
                "dependency_contract_refs": [
                    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
                    "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
                    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
                ],
                "notes": f"Canonical package home for the {slug_to_title(context_code)} bounded context.",
                "source_refs": [
                    "prompt/044.md",
                    "blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor",
                ],
            }
        )
    return definitions


def build_artifact(
    definition: dict[str, Any],
    artifact_type: str,
    context_index: dict[str, dict[str, Any]],
    route_index: dict[str, dict[str, Any]],
    gateway_by_shell: dict[str, list[dict[str, str]]],
) -> dict[str, Any]:
    owner_context = context_index[definition["owner_context_code"]]
    shell_types = definition.get("shell_types_owned", [])
    route_ids: list[str] = []
    gateway_refs: list[dict[str, Any]] = []
    if artifact_type == "app":
        for shell_type in shell_types:
            route_ids.extend(route["route_family_id"] for route in route_index.values() if route["shell_type"] == shell_type)
            gateway_refs.extend(gateway_by_shell.get(shell_type, []))
    else:
        route_ids.extend(definition.get("route_families_owned", []))
        for gateway_surface_id in definition.get("gateway_surfaces_owned", []):
            gateway_refs.append(
                {
                    "gateway_surface_id": gateway_surface_id,
                    "surface_name": gateway_surface_id,
                    "route_family_id": "",
                    "shell_type": shell_types[0] if shell_types else "",
                    "source_refs": [],
                }
            )
    route_refs = [route_index[route_id] for route_id in route_ids]
    return {
        "artifact_id": definition["artifact_id"],
        "repo_path": definition["repo_path"],
        "display_name": definition["display_name"],
        "artifact_type": artifact_type,
        "artifact_class": definition["artifact_class"],
        "owner_context_code": owner_context["owner_context_code"],
        "owner_context_label": owner_context["owner_context_label"],
        "owner_kind": owner_context["owner_kind"],
        "topology_status": definition["topology_status"],
        "shell_types_owned": shell_types,
        "route_families_owned": route_refs,
        "gateway_surfaces_owned": gateway_refs,
        "allowed_dependencies": definition["allowed_dependencies"],
        "forbidden_dependencies": definition["forbidden_dependencies"],
        "dependency_contract_refs": definition["dependency_contract_refs"],
        "source_refs": definition["source_refs"],
        "notes": definition["notes"],
        "defect_state": "clean",
        "defect_refs": [],
    }


def build_special_artifact(definition: dict[str, Any], context_index: dict[str, dict[str, Any]], route_index: dict[str, dict[str, Any]]) -> dict[str, Any]:
    owner_context = context_index[definition["owner_context_code"]]
    route_refs = [route_index[route_id] for route_id in definition["route_families_owned"]]
    return {
        "artifact_id": definition["artifact_id"],
        "repo_path": definition["repo_path"],
        "display_name": definition["display_name"],
        "artifact_type": definition["artifact_type"],
        "artifact_class": definition["artifact_class"],
        "owner_context_code": owner_context["owner_context_code"],
        "owner_context_label": owner_context["owner_context_label"],
        "owner_kind": owner_context["owner_kind"],
        "topology_status": definition["topology_status"],
        "shell_types_owned": definition["shell_types_owned"],
        "route_families_owned": route_refs,
        "gateway_surfaces_owned": definition["gateway_surfaces_owned"],
        "allowed_dependencies": definition["allowed_dependencies"],
        "forbidden_dependencies": definition["forbidden_dependencies"],
        "dependency_contract_refs": definition["dependency_contract_refs"],
        "source_refs": definition["source_refs"],
        "notes": definition["notes"],
        "defect_state": "clean",
        "defect_refs": [],
    }


def attach_defects(artifacts: list[dict[str, Any]]) -> None:
    state_rank = {"clean": 0, "resolved": 1, "watch": 2}
    artifact_lookup = {artifact["artifact_id"]: artifact for artifact in artifacts}
    for defect in TOPOLOGY_DEFECTS:
        for artifact_id in defect["affected_artifact_ids"]:
            artifact = artifact_lookup.get(artifact_id)
            if artifact is None:
                continue
            artifact["defect_refs"].append(defect["defect_id"])
            if state_rank[defect["state"]] > state_rank[artifact["defect_state"]]:
                artifact["defect_state"] = defect["state"]


def build_artifacts(route_index: dict[str, dict[str, Any]], gateway_by_shell: dict[str, list[dict[str, str]]]) -> list[dict[str, Any]]:
    context_index = build_context_index()
    artifacts: list[dict[str, Any]] = []
    for definition in APP_DEFINITIONS:
        artifacts.append(build_artifact(definition, "app", context_index, route_index, gateway_by_shell))
    for definition in SERVICE_DEFINITIONS:
        artifacts.append(build_artifact(definition, "service", context_index, route_index, gateway_by_shell))
    for definition in SHARED_PACKAGE_DEFINITIONS:
        artifacts.append(build_artifact(definition, "package", context_index, route_index, gateway_by_shell))
    for definition in make_domain_package_definitions():
        artifacts.append(build_artifact(definition, "package", context_index, route_index, gateway_by_shell))
    for definition in SPECIAL_WORKSPACES:
        artifacts.append(build_special_artifact(definition, context_index, route_index))
    attach_defects(artifacts)
    return artifacts


def collect_shell_counts(artifacts: list[dict[str, Any]]) -> Counter[str]:
    counter: Counter[str] = Counter()
    for artifact in artifacts:
        for shell_type in artifact["shell_types_owned"]:
            counter[shell_type] += 1
    return counter


def collect_route_ids(artifacts: list[dict[str, Any]]) -> list[str]:
    route_ids: list[str] = []
    for artifact in artifacts:
        route_ids.extend(route["route_family_id"] for route in artifact["route_families_owned"])
    return route_ids


def collect_gateway_ids(artifacts: list[dict[str, Any]]) -> list[str]:
    gateway_ids: list[str] = []
    for artifact in artifacts:
        gateway_ids.extend(surface["gateway_surface_id"] for surface in artifact["gateway_surfaces_owned"])
    return gateway_ids


def validate_model(
    shell_map: dict[str, Any],
    route_index: dict[str, dict[str, Any]],
    gateway_flat: dict[str, dict[str, Any]],
    artifacts: list[dict[str, Any]],
) -> None:
    artifact_ids = [artifact["artifact_id"] for artifact in artifacts]
    repo_paths = [artifact["repo_path"] for artifact in artifacts]
    if len(artifact_ids) != len(set(artifact_ids)):
        raise SystemExit("Artifact ids lost uniqueness")
    if len(repo_paths) != len(set(repo_paths)):
        raise SystemExit("Repo paths lost uniqueness")

    shell_counts = collect_shell_counts(artifacts)
    required_shells = {shell["shell_type"] for shell in shell_map["shells"]}
    if set(shell_counts) != required_shells:
        raise SystemExit(f"Shell coverage drifted: {sorted(set(shell_counts))} vs {sorted(required_shells)}")
    duplicates = {shell: count for shell, count in shell_counts.items() if count != 1}
    if duplicates:
        raise SystemExit(f"Shell ownership lost uniqueness: {duplicates}")

    route_ids = collect_route_ids(artifacts)
    required_route_ids = set(route_index)
    if set(route_ids) != required_route_ids:
        missing = sorted(required_route_ids - set(route_ids))
        extra = sorted(set(route_ids) - required_route_ids)
        raise SystemExit(f"Route ownership drifted. Missing={missing} extra={extra}")
    route_counts = Counter(route_ids)
    duplicate_routes = {route_id: count for route_id, count in route_counts.items() if count != 1}
    if duplicate_routes:
        raise SystemExit(f"Route ownership lost uniqueness: {duplicate_routes}")

    gateway_ids = collect_gateway_ids(artifacts)
    required_gateway_ids = set(gateway_flat)
    if set(gateway_ids) != required_gateway_ids:
        missing = sorted(required_gateway_ids - set(gateway_ids))
        extra = sorted(set(gateway_ids) - required_gateway_ids)
        raise SystemExit(f"Gateway coverage drifted. Missing={missing} extra={extra}")
    gateway_counts = Counter(gateway_ids)
    duplicate_gateways = {gateway_id: count for gateway_id, count in gateway_counts.items() if count != 1}
    if duplicate_gateways:
        raise SystemExit(f"Gateway ownership lost uniqueness: {duplicate_gateways}")


def build_summary(
    shell_map: dict[str, Any],
    route_rows: list[dict[str, str]],
    gateway_rows: list[dict[str, str]],
    import_rules: dict[str, Any],
    artifacts: list[dict[str, Any]],
) -> dict[str, Any]:
    artifact_type_counts = Counter(artifact["artifact_type"] for artifact in artifacts)
    defect_counts = Counter(defect["state"] for defect in TOPOLOGY_DEFECTS)
    return {
        "artifact_count": len(artifacts),
        "app_count": artifact_type_counts["app"],
        "service_count": artifact_type_counts["service"],
        "package_count": artifact_type_counts["package"],
        "special_workspace_count": artifact_type_counts["docs-only"] + artifact_type_counts["tools-only"],
        "context_count": len(CONTEXTS),
        "shell_family_count": len(shell_map["shells"]),
        "route_family_count": len(route_rows),
        "gateway_surface_count": len(gateway_rows),
        "boundary_rule_count": len(BOUNDARY_RULES),
        "context_boundary_contract_count": len(CONTEXT_BOUNDARY_CONTRACTS),
        "topology_defect_count": defect_counts["watch"],
        "resolved_defect_count": defect_counts["resolved"],
        "conditional_surface_count": sum(1 for artifact in artifacts if artifact["topology_status"] == "conditional_reserved"),
        "upstream_import_rule_count": len(import_rules["rules"]),
    }


def build_manifest(
    shell_map: dict[str, Any],
    route_rows: list[dict[str, str]],
    gateway_rows: list[dict[str, str]],
    import_rules: dict[str, Any],
    artifacts: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = build_summary(shell_map, route_rows, gateway_rows, import_rules, artifacts)
    owner_counts = Counter(artifact["owner_context_code"] for artifact in artifacts)
    owner_contexts = []
    for context in CONTEXTS:
        context_copy = dict(context)
        context_copy["artifact_count"] = owner_counts[context["owner_context_code"]]
        owner_contexts.append(context_copy)
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "required_inputs": {name: str(path.relative_to(ROOT)) for name, path in REQUIRED_INPUTS.items()},
        "summary": summary,
        "upstream_snapshot": {
            "shell_count": len(shell_map["shells"]),
            "route_family_count": len(route_rows),
            "gateway_surface_count": len(gateway_rows),
            "import_rule_count": len(import_rules["rules"]),
        },
        "owner_contexts": owner_contexts,
        "artifacts": artifacts,
        "topology_defects": TOPOLOGY_DEFECTS,
    }


def build_dependency_rule_payload(manifest: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "baseline_id": "vecells_repo_topology_rules_v1",
        "visual_mode": VISUAL_MODE,
        "summary": {
            "artifact_count": manifest["summary"]["artifact_count"],
            "boundary_rule_count": len(BOUNDARY_RULES),
            "context_boundary_contract_count": len(CONTEXT_BOUNDARY_CONTRACTS),
            "app_count": manifest["summary"]["app_count"],
            "service_count": manifest["summary"]["service_count"],
            "package_count": manifest["summary"]["package_count"],
        },
        "enforcement_stack": [
            {"layer": "workspace_graph", "tooling": "Nx project graph + project tags", "purpose": "Declares legal edges between apps, services, packages, and tools."},
            {"layer": "lint", "tooling": "ESLint boundary rules + export-map restrictions", "purpose": "Blocks deep imports into sibling internals and private subpaths."},
            {"layer": "manifest_validation", "tooling": "validate_repo_topology.py", "purpose": "Fails route, shell, gateway, and owner drift before scaffold prompts run."},
            {"layer": "ownership", "tooling": "Generated CODEOWNERS and README metadata", "purpose": "Makes ownership changes reviewable instead of tacit."},
            {"layer": "browser_verification", "tooling": "Playwright topology atlas coverage", "purpose": "Keeps HTML atlas, parity tables, and selection behavior deterministic."},
        ],
        "shared_kernel_classes": [
            "shared_domain_kernel",
            "shared_contracts",
            "design_system",
            "platform_runtime",
            "platform_integration",
            "analysis_validation",
            "assistive_lab",
            "test_fixtures",
        ],
        "artifact_class_map": {
            "app_shell": "app",
            "service_gateway": "service",
            "service_runtime": "service",
            "shared_kernel_package": "package",
            "shared_contract_package": "package",
            "shared_design_package": "package",
            "shared_policy_package": "package",
            "shared_support_package": "package",
            "domain_context_package": "package",
            "docs_workspace": "docs-only",
            "tools_workspace": "tools-only",
        },
        "rules": BOUNDARY_RULES,
        "contracts": CONTEXT_BOUNDARY_CONTRACTS,
    }


def build_boundary_csv_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for rule in BOUNDARY_RULES:
        rows.append(
            {
                "rule_id": rule["rule_id"],
                "rule_scope": rule["rule_scope"],
                "from_selector": rule["from_selector"],
                "to_selector": rule["to_selector"],
                "verdict": rule["verdict"],
                "allowed_access": rule["allowed_access"],
                "description": rule["description"],
                "enforcement_layers": "; ".join(rule["enforcement_layers"]),
                "source_refs": "; ".join(rule["source_refs"]),
            }
        )
    return rows


def render_repository_topology_md(manifest: dict[str, Any]) -> str:
    summary = manifest["summary"]
    artifact_rows = []
    for artifact in manifest["artifacts"]:
        route_summary = ", ".join(route["route_family_id"] for route in artifact["route_families_owned"]) or "none"
        shell_summary = ", ".join(artifact["shell_types_owned"]) or "none"
        artifact_rows.append(
            f"| `{artifact['repo_path']}` | `{artifact['artifact_type']}` | `{artifact['owner_context_code']}` | `{artifact['topology_status']}` | `{shell_summary}` | `{route_summary}` | `{artifact['defect_state']}` |"
        )
    defect_rows = []
    for defect in TOPOLOGY_DEFECTS:
        defect_rows.append(
            f"| `{defect['defect_id']}` | `{defect['state']}` | `{defect['severity']}` | {defect['title']} |"
        )
    return (
        dedent(
        f"""\
        # 41 Repository Topology Rules

        ## Mission

        Freeze the Vecells repo topology before scaffolding begins so `042-045` can implement one authoritative layout instead of re-deciding shell ownership, package homes, or import law.

        ## Summary

        - Visual mode: `{VISUAL_MODE}`
        - App count: `{summary['app_count']}`
        - Service count: `{summary['service_count']}`
        - Package count: `{summary['package_count']}`
        - Special workspace count: `{summary['special_workspace_count']}`
        - Active topology defect count: `{summary['topology_defect_count']}`
        - Route family coverage: `{summary['route_family_count']}`
        - Shell family coverage: `{summary['shell_family_count']}`
        - Gateway surface coverage: `{summary['gateway_surface_count']}`

        ## Freeze Decisions

        - Baseline apps are frozen at `patient-web`, `clinical-workspace`, `hub-desk`, `pharmacy-console`, `support-workspace`, `ops-console`, and `governance-console`.
        - `support`, `pharmacy`, and `governance` are first-class shell families in the baseline topology, not later add-ons and not subpanels of `ops-console`.
        - `rf_patient_embedded_channel` remains part of `apps/patient-web`; embedded delivery is a patient-shell channel profile, not a separate app family.
        - Standalone assistive work is represented as conditional reserved tools-only namespace `tools/assistive-control-lab`; live assistive work remains inside `apps/clinical-workspace`.
        - Shared code is legal only in explicit shared packages; there is no generic shared util escape hatch.
        - No app owns truth. Apps render projections, preserve continuity, and call published contracts only.

        ## Artifact Register

        | Repo path | Type | Owner | Status | Shells | Route families | Defect state |
        | --- | --- | --- | --- | --- | --- | --- |
        {"\n".join(artifact_rows)}

        ## Defect Register

        | Defect id | State | Severity | Title |
        | --- | --- | --- | --- |
        {"\n".join(defect_rows)}

        ## Source Precedence

        - `prompt/041.md`
        - `prompt/042.md`
        - `prompt/043.md`
        - `prompt/044.md`
        - `blueprint/phase-0-the-foundation-protocol.md`
        - `blueprint/platform-frontend-blueprint.md`
        - `blueprint/platform-runtime-and-release-blueprint.md`
        - `data/analysis/shell_ownership_map.json`
        - `data/analysis/route_family_inventory.csv`
        - `data/analysis/gateway_surface_matrix.csv`
        """
        )
        .replace("\n        ", "\n")
        .strip()
        + "\n"
    )


def render_boundary_rules_md(manifest: dict[str, Any]) -> str:
    rule_rows = []
    for rule in BOUNDARY_RULES:
        rule_rows.append(
            f"| `{rule['rule_id']}` | `{rule['rule_scope']}` | `{rule['from_selector']}` | `{rule['to_selector']}` | `{rule['verdict']}` | {rule['description']} |"
        )
    contract_rows = []
    for contract in CONTEXT_BOUNDARY_CONTRACTS:
        from_owner = ", ".join(contract["from_owner_codes"])
        to_owner = ", ".join(contract["to_owner_codes"])
        contract_rows.append(
            f"| `{contract['contract_id']}` | `{from_owner}` | `{to_owner}` | `{contract['transport_family']}` | {contract['notes']} |"
        )
    return (
        dedent(
        f"""\
        # 41 Package Boundary Rules

        ## Boundary Law

        Package and import boundaries are now frozen ahead of scaffolding:

        - Apps consume published contracts, design tokens, telemetry vocabulary, and release posture only.
        - Runtime services may compose domains only through public package entrypoints and shared contracts.
        - Domain packages may not import sibling domain internals.
        - Shared code exists only in explicit package families.
        - Tooling may read manifests and docs but may not become runtime truth.

        ## Rule Set

        | Rule id | Scope | From | To | Verdict | Description |
        | --- | --- | --- | --- | --- | --- |
        {"\n".join(rule_rows)}

        ## Context Boundary Contracts

        | Contract id | From owners | To owners | Transport | Notes |
        | --- | --- | --- | --- | --- |
        {"\n".join(contract_rows)}

        ## Package Freeze

        - Shared packages: `domain-kernel`, `event-contracts`, `api-contracts`, `fhir-mapping`, `design-system`, `authz-policy`, `test-fixtures`, `observability`, `release-controls`
        - Domain package namespace: `packages/domains/<context-code>`
        - Frozen context codes: `{", ".join(DOMAIN_PACKAGE_ORDER)}`
        - Tools-only reserved namespace for conditional assistive work: `tools/assistive-control-lab`

        ## Why This Exists

        The repo now has one machine-readable answer for:

        - where a shell lives
        - where a domain lives
        - where shared truth is legal
        - which seams are allowed
        - which imports are forbidden
        - how later tasks must scaffold without reopening topology debates
        """
        )
        .replace("\n        ", "\n")
        .strip()
        + "\n"
    )


def render_mermaid(manifest: dict[str, Any]) -> str:
    apps = [artifact for artifact in manifest["artifacts"] if artifact["artifact_type"] == "app"]
    services = [artifact for artifact in manifest["artifacts"] if artifact["artifact_type"] == "service"]
    shared_packages = [
        artifact
        for artifact in manifest["artifacts"]
        if artifact["artifact_type"] == "package" and not artifact["repo_path"].startswith("packages/domains/")
    ]
    domain_packages = [
        artifact
        for artifact in manifest["artifacts"]
        if artifact["artifact_type"] == "package" and artifact["repo_path"].startswith("packages/domains/")
    ]
    tools = [artifact for artifact in manifest["artifacts"] if artifact["artifact_type"] in {"docs-only", "tools-only"}]

    def node_lines(items: list[dict[str, Any]], prefix: str) -> list[str]:
        lines = []
        for item in items:
            node_id = f"{prefix}_{item['artifact_id']}".replace("-", "_")
            label = item["display_name"]
            lines.append(f'  {node_id}["{label}\\n{item["repo_path"]}"]')
        return lines

    lines = ["flowchart LR", '  classDef app fill:#EEF2FF,stroke:#3559E6,color:#0F172A', '  classDef service fill:#ECFDF3,stroke:#0EA5A4,color:#0F172A', '  classDef package fill:#F5F3FF,stroke:#7C3AED,color:#0F172A', '  classDef tool fill:#FFF7ED,stroke:#C98900,color:#0F172A']
    lines.append("  subgraph Apps")
    lines.extend(node_lines(apps, "app"))
    lines.append("  end")
    lines.append("  subgraph Services")
    lines.extend(node_lines(services, "svc"))
    lines.append("  end")
    lines.append("  subgraph SharedPackages")
    lines.extend(node_lines(shared_packages, "pkg"))
    lines.append("  end")
    lines.append("  subgraph DomainPackages")
    lines.extend(node_lines(domain_packages, "dom"))
    lines.append("  end")
    lines.append("  subgraph SpecialWorkspaces")
    lines.extend(node_lines(tools, "tool"))
    lines.append("  end")

    lines.extend(
        [
            "  app_app_patient_web --> svc_service_api_gateway",
            "  app_app_clinical_workspace --> svc_service_api_gateway",
            "  app_app_hub_desk --> svc_service_api_gateway",
            "  app_app_pharmacy_console --> svc_service_api_gateway",
            "  app_app_support_workspace --> svc_service_api_gateway",
            "  app_app_ops_console --> svc_service_api_gateway",
            "  app_app_governance_console --> svc_service_api_gateway",
            "  svc_service_api_gateway --> pkg_package_api_contracts",
            "  svc_service_api_gateway --> pkg_package_release_controls",
            "  svc_service_api_gateway --> pkg_package_authz_policy",
            "  svc_service_command_api --> dom_package_domains_intake_safety",
            "  svc_service_command_api --> dom_package_domains_identity_access",
            "  svc_service_command_api --> dom_package_domains_triage_workspace",
            "  svc_service_command_api --> dom_package_domains_booking",
            "  svc_service_command_api --> dom_package_domains_hub_coordination",
            "  svc_service_command_api --> dom_package_domains_pharmacy",
            "  svc_service_command_api --> dom_package_domains_communications",
            "  svc_service_command_api --> dom_package_domains_support",
            "  svc_service_command_api --> dom_package_domains_operations",
            "  svc_service_command_api --> dom_package_domains_governance_admin",
            "  svc_service_projection_worker --> pkg_package_fhir_mapping",
            "  svc_service_projection_worker --> pkg_package_event_contracts",
            "  svc_service_notification_worker --> dom_package_domains_communications",
            "  svc_service_notification_worker --> dom_package_domains_support",
            "  svc_service_notification_worker --> dom_package_domains_identity_access",
            "  svc_service_adapter_simulators --> pkg_package_api_contracts",
            "  svc_service_adapter_simulators --> pkg_package_test_fixtures",
            "  dom_package_domains_intake_safety --> pkg_package_domain_kernel",
            "  dom_package_domains_identity_access --> pkg_package_domain_kernel",
            "  dom_package_domains_triage_workspace --> pkg_package_domain_kernel",
            "  dom_package_domains_booking --> pkg_package_domain_kernel",
            "  dom_package_domains_hub_coordination --> pkg_package_domain_kernel",
            "  dom_package_domains_pharmacy --> pkg_package_domain_kernel",
            "  dom_package_domains_communications --> pkg_package_domain_kernel",
            "  dom_package_domains_support --> pkg_package_domain_kernel",
            "  dom_package_domains_operations --> pkg_package_domain_kernel",
            "  dom_package_domains_governance_admin --> pkg_package_domain_kernel",
            "  dom_package_domains_analytics_assurance --> pkg_package_domain_kernel",
            "  dom_package_domains_audit_compliance --> pkg_package_domain_kernel",
            "  dom_package_domains_release_control --> pkg_package_domain_kernel",
            "  tool_tool_playwright --> tool_docs_architecture",
            "  tool_tool_assistive_control_lab --> pkg_package_release_controls",
        ]
    )
    for app in apps:
        lines.append(f"  class app_{app['artifact_id']} app")
    for service in services:
        lines.append(f"  class svc_{service['artifact_id']} service")
    for package in shared_packages + domain_packages:
        prefix = "pkg" if package in shared_packages else "dom"
        lines.append(f"  class {prefix}_{package['artifact_id']} package")
    for tool in tools:
        lines.append(f"  class tool_{tool['artifact_id']} tool")
    return "\n".join(lines) + "\n"


def build_atlas_payload(manifest: dict[str, Any]) -> dict[str, Any]:
    lane_order = [
        {"artifact_type": "app", "label": "Apps"},
        {"artifact_type": "service", "label": "Services"},
        {"artifact_type": "package", "label": "Packages"},
        {"artifact_type": "docs-only", "label": "Docs"},
        {"artifact_type": "tools-only", "label": "Tools"},
    ]
    parity_rows = []
    counts = Counter(artifact["artifact_type"] for artifact in manifest["artifacts"])
    for lane in lane_order:
        parity_rows.append(
            {
                "artifact_type": lane["artifact_type"],
                "label": lane["label"],
                "count": counts[lane["artifact_type"]],
            }
        )
    defect_state_rows = []
    defect_counts = Counter(artifact["defect_state"] for artifact in manifest["artifacts"])
    for state in ["clean", "resolved", "watch"]:
        defect_state_rows.append({"state": state, "count": defect_counts[state]})
    return {
        "task_id": manifest["task_id"],
        "visual_mode": VISUAL_MODE,
        "summary": manifest["summary"],
        "owner_contexts": manifest["owner_contexts"],
        "artifacts": manifest["artifacts"],
        "topology_defects": manifest["topology_defects"],
        "lane_order": lane_order,
        "parity_rows": parity_rows,
        "defect_state_rows": defect_state_rows,
    }


def render_html(manifest: dict[str, Any]) -> str:
    atlas_payload = build_atlas_payload(manifest)
    template = dedent(
        """\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>41 Repo Topology Atlas</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%233559E6'/%3E%3Cpath d='M25 27h46v10H53v32H43V37H25V27z' fill='white'/%3E%3Cpath d='M26 48h10v21H26z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {
              --canvas: #F6F8FB;
              --rail: #EEF2F7;
              --panel: #FFFFFF;
              --inset: #F3F5FA;
              --text-strong: #0F172A;
              --text: #1E293B;
              --text-muted: #667085;
              --border-subtle: #E2E8F0;
              --border-default: #CBD5E1;
              --primary: #3559E6;
              --context: #0EA5A4;
              --warning: #C98900;
              --blocked: #C24141;
              --shared: #7C3AED;
              --shadow: 0 28px 60px rgba(15, 23, 42, 0.08);
              --radius-xl: 24px;
              --radius-lg: 18px;
              --radius-md: 14px;
              --max-width: 1440px;
              --rail-width: 296px;
              --inspector-width: 360px;
              --header-height: 72px;
              --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              --sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            * { box-sizing: border-box; }
            html { color-scheme: light; }
            body {
              margin: 0;
              min-height: 100vh;
              background:
                radial-gradient(circle at top left, rgba(53, 89, 230, 0.08), transparent 24%),
                radial-gradient(circle at top right, rgba(14, 165, 164, 0.08), transparent 28%),
                linear-gradient(180deg, #FBFCFE 0%, var(--canvas) 100%);
              color: var(--text);
              font-family: var(--sans);
            }
            body[data-reduced-motion="true"] * {
              animation-duration: 0ms !important;
              transition-duration: 0ms !important;
              scroll-behavior: auto !important;
            }
            a { color: inherit; }
            button, select {
              font: inherit;
              color: inherit;
            }
            :focus-visible {
              outline: 2px solid var(--primary);
              outline-offset: 2px;
            }
            .page {
              max-width: var(--max-width);
              margin: 0 auto;
              padding: 16px;
            }
            .shell {
              display: grid;
              gap: 16px;
            }
            .panel {
              background: rgba(255,255,255,0.98);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-xl);
              box-shadow: var(--shadow);
              backdrop-filter: blur(12px);
            }
            .masthead-shell {
              position: sticky;
              top: 0;
              z-index: 30;
              padding-top: 4px;
              background: linear-gradient(180deg, rgba(246,248,251,0.96), rgba(246,248,251,0.90) 82%, rgba(246,248,251,0));
            }
            .masthead {
              min-height: var(--header-height);
              padding: 16px 20px;
              display: grid;
              gap: 16px;
            }
            .masthead-top {
              display: flex;
              justify-content: space-between;
              align-items: start;
              gap: 16px;
              flex-wrap: wrap;
            }
            .brand {
              display: flex;
              gap: 14px;
              align-items: center;
              max-width: 76ch;
            }
            .brand svg {
              width: 84px;
              height: 84px;
              flex: none;
            }
            .brand-copy {
              display: grid;
              gap: 8px;
            }
            .eyebrow {
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            h1 {
              margin: 0;
              font-size: clamp(32px, 4vw, 46px);
              line-height: 0.96;
              letter-spacing: -0.04em;
              color: var(--text-strong);
            }
            .subtitle {
              margin: 0;
              font-size: 15px;
              line-height: 1.55;
              color: var(--text-muted);
            }
            .metric-row {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }
            .metric {
              min-height: 44px;
              padding: 12px 14px;
              border-radius: 999px;
              background: rgba(243,245,250,0.92);
              border: 1px solid var(--border-default);
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              font-size: 13px;
            }
            .metric strong {
              font-size: 20px;
              color: var(--text-strong);
            }
            .layout {
              display: grid;
              grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
              gap: 16px;
              align-items: start;
            }
            .context-rail,
            .workspace,
            .inspector {
              padding: 18px;
            }
            .context-rail {
              background: linear-gradient(180deg, rgba(238,242,247,0.96), rgba(255,255,255,0.98));
              display: grid;
              gap: 16px;
              position: sticky;
              top: 92px;
              max-height: calc(100vh - 108px);
              overflow: auto;
            }
            .workspace {
              display: grid;
              gap: 16px;
            }
            .section-label {
              margin: 0 0 10px;
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            .field-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 16px;
            }
            .field {
              display: grid;
              gap: 6px;
            }
            label {
              font-size: 11px;
              letter-spacing: 0.10em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            select {
              min-height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: white;
              padding: 0 12px;
            }
            .context-group {
              display: grid;
              gap: 10px;
            }
            .context-card {
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,245,250,0.96));
              display: grid;
              gap: 8px;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, background-color 120ms ease;
            }
            .context-card:hover {
              transform: translateY(-1px);
            }
            .context-card[data-selected="true"] {
              border-color: rgba(53,89,230,0.4);
              box-shadow: inset 0 0 0 1px rgba(53,89,230,0.22);
              background: linear-gradient(180deg, rgba(245,248,255,0.98), rgba(238,242,247,0.96));
            }
            .context-card strong {
              font-size: 15px;
              color: var(--text-strong);
            }
            .context-card span {
              font-size: 12px;
              line-height: 1.45;
              color: var(--text-muted);
            }
            .context-meta {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
              font-size: 12px;
            }
            .graph-panel,
            .lower-panel,
            .defect-panel {
              padding: 18px;
            }
            .graph-header,
            .lower-header,
            .defect-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              gap: 14px;
              flex-wrap: wrap;
              margin-bottom: 14px;
            }
            .graph-shell {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 320px;
              gap: 16px;
              align-items: start;
            }
            .graph-canvas {
              min-height: 560px;
              border-radius: 20px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(246,248,251,0.88), rgba(255,255,255,0.98));
              padding: 16px;
              display: grid;
              gap: 14px;
            }
            .lane {
              display: grid;
              gap: 10px;
            }
            .lane-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
            }
            .lane-header h3 {
              margin: 0;
              font-size: 14px;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-strong);
            }
            .lane-badge {
              min-width: 28px;
              padding: 4px 10px;
              border-radius: 999px;
              background: rgba(53,89,230,0.08);
              color: var(--primary);
              font-size: 12px;
              font-weight: 600;
            }
            .lane-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 12px;
            }
            .node-card {
              min-height: 100px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: rgba(255,255,255,0.98);
              display: grid;
              gap: 10px;
              cursor: pointer;
              transition: transform 120ms ease, border-color 180ms ease, box-shadow 180ms ease;
            }
            .node-card:hover {
              transform: translateY(-1px);
            }
            .node-card[data-selected="true"] {
              border-color: rgba(53,89,230,0.42);
              box-shadow: inset 0 0 0 1px rgba(53,89,230,0.20), 0 16px 28px rgba(15,23,42,0.08);
            }
            .node-top {
              display: flex;
              justify-content: space-between;
              align-items: start;
              gap: 10px;
            }
            .glyph {
              width: 28px;
              height: 28px;
              border-radius: 10px;
              border: 1px solid var(--border-default);
              display: grid;
              place-items: center;
              background: rgba(243,245,250,0.95);
              color: var(--text-strong);
            }
            .node-title {
              margin: 0;
              font-size: 15px;
              color: var(--text-strong);
            }
            .node-path,
            .mono {
              font-family: var(--mono);
            }
            .node-path {
              font-size: 12px;
              color: var(--text-muted);
              word-break: break-word;
            }
            .chip-row {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .chip {
              min-height: 28px;
              padding: 4px 10px;
              border-radius: 999px;
              border: 1px solid var(--border-default);
              background: rgba(243,245,250,0.95);
              font-size: 12px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .chip.watch {
              color: var(--warning);
              border-color: rgba(201,137,0,0.34);
              background: rgba(201,137,0,0.10);
            }
            .chip.resolved {
              color: var(--context);
              border-color: rgba(14,165,164,0.34);
              background: rgba(14,165,164,0.10);
            }
            .chip.clean {
              color: var(--text-muted);
            }
            .boundary-card {
              padding: 16px;
              border-radius: 20px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.96));
              display: grid;
              gap: 14px;
            }
            .boundary-card svg {
              width: 100%;
              height: auto;
            }
            .boundary-legend {
              display: grid;
              gap: 8px;
              font-size: 12px;
              color: var(--text-muted);
            }
            .legend-row {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .legend-swatch {
              width: 12px;
              height: 12px;
              border-radius: 999px;
            }
            .table-shell {
              overflow-x: auto;
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: rgba(255,255,255,0.98);
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 12px 14px;
              text-align: left;
              border-bottom: 1px solid var(--border-subtle);
              font-size: 13px;
              vertical-align: top;
            }
            th {
              font-size: 11px;
              letter-spacing: 0.10em;
              text-transform: uppercase;
              color: var(--text-muted);
              background: rgba(243,245,250,0.96);
            }
            tr[data-selected="true"] {
              background: rgba(53,89,230,0.06);
            }
            tr {
              transition: background-color 180ms ease;
              cursor: pointer;
            }
            .parity-shell {
              margin-top: 14px;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
            }
            .parity-card {
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.96));
              padding: 14px;
            }
            .parity-card h4 {
              margin: 0 0 12px;
              font-size: 13px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            .inspector {
              display: grid;
              gap: 14px;
              position: sticky;
              top: 92px;
              min-height: 360px;
              max-height: calc(100vh - 108px);
              overflow: auto;
            }
            .inspector h2 {
              margin: 0;
              font-size: 22px;
              color: var(--text-strong);
            }
            .inspector .meta-grid {
              display: grid;
              gap: 12px;
            }
            .inspector-block {
              border-radius: 16px;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.94));
              padding: 14px;
              display: grid;
              gap: 10px;
            }
            .inspector-list {
              display: grid;
              gap: 8px;
            }
            .inspector-item {
              font-size: 13px;
              line-height: 1.45;
              color: var(--text);
            }
            .inspector-item small {
              display: block;
              color: var(--text-muted);
            }
            .defect-strip {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 12px;
            }
            .defect-card {
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.96));
              display: grid;
              gap: 10px;
            }
            .defect-card[data-state="watch"] {
              border-color: rgba(201,137,0,0.34);
            }
            .defect-card[data-state="resolved"] {
              border-color: rgba(14,165,164,0.30);
            }
            .empty-state {
              border-radius: 18px;
              border: 1px dashed var(--border-default);
              padding: 18px;
              color: var(--text-muted);
              background: rgba(243,245,250,0.72);
              font-size: 14px;
            }
            .visually-hidden {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
            @media (max-width: 1260px) {
              .layout {
                grid-template-columns: 280px minmax(0, 1fr);
              }
              .inspector {
                grid-column: 1 / -1;
                position: static;
                max-height: none;
              }
              .graph-shell {
                grid-template-columns: 1fr;
              }
            }
            @media (max-width: 980px) {
              .layout {
                grid-template-columns: 1fr;
              }
              .context-rail {
                position: static;
                max-height: none;
              }
              .field-grid,
              .metric-row,
              .parity-shell {
                grid-template-columns: 1fr;
              }
            }
            @media (max-width: 640px) {
              .page {
                padding: 10px;
              }
              .masthead,
              .context-rail,
              .workspace,
              .inspector,
              .graph-panel,
              .lower-panel,
              .defect-panel {
                padding: 14px;
              }
              .lane-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="shell" data-testid="topology-shell">
              <div class="masthead-shell">
                <header class="panel masthead">
                  <div class="masthead-top">
                    <div class="brand">
                      <svg viewBox="0 0 120 120" aria-hidden="true">
                        <defs>
                          <linearGradient id="atlasGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#3559E6"/>
                            <stop offset="100%" stop-color="#0EA5A4"/>
                          </linearGradient>
                        </defs>
                        <rect x="10" y="10" width="100" height="100" rx="28" fill="white" stroke="url(#atlasGlow)" stroke-width="4"/>
                        <path d="M30 34h60v12H66v40H54V46H30V34z" fill="#3559E6"/>
                        <path d="M31 60h14v26H31z" fill="#0EA5A4"/>
                        <text x="60" y="102" text-anchor="middle" font-size="14" font-family="system-ui, sans-serif" fill="#667085" letter-spacing="3">TOPOLOGY</text>
                      </svg>
                      <div class="brand-copy">
                        <div class="eyebrow">Vecells topology atlas</div>
                        <h1>Topology_Atlas</h1>
                        <p class="subtitle">Repository topology, package boundaries, and bounded-context ownership are frozen here before scaffold prompts build the monorepo.</p>
                      </div>
                    </div>
                  </div>
                  <div class="metric-row">
                    <div class="metric"><span>Apps</span><strong id="metric-apps">0</strong></div>
                    <div class="metric"><span>Services</span><strong id="metric-services">0</strong></div>
                    <div class="metric"><span>Packages</span><strong id="metric-packages">0</strong></div>
                    <div class="metric"><span>Topology defects</span><strong id="metric-defects">0</strong></div>
                  </div>
                </header>
              </div>

              <div class="layout">
                <aside class="panel context-rail" data-testid="context-rail" aria-label="Context rail">
                  <div>
                    <p class="section-label">Bounded contexts</p>
                    <div id="context-groups"></div>
                  </div>
                </aside>

                <main class="panel workspace">
                  <section class="graph-panel">
                    <div class="graph-header">
                      <div>
                        <p class="section-label">Repository graph</p>
                        <p class="subtitle">Filter by artifact type, owner, or defect state. Graph cards and table rows share one selected node and one filtered result set.</p>
                      </div>
                    </div>

                    <div class="field-grid" role="group" aria-label="Topology filters">
                      <div class="field">
                        <label for="filter-artifact">Artifact type</label>
                        <select id="filter-artifact" data-testid="filter-artifact"></select>
                      </div>
                      <div class="field">
                        <label for="filter-context">Bounded context</label>
                        <select id="filter-context" data-testid="filter-context"></select>
                      </div>
                      <div class="field">
                        <label for="filter-defect">Defect state</label>
                        <select id="filter-defect" data-testid="filter-defect"></select>
                      </div>
                    </div>

                    <div class="graph-shell">
                      <section class="graph-canvas" data-testid="graph-canvas" aria-label="Repository topology graph">
                        <div id="graph-lanes"></div>
                      </section>
                      <aside class="boundary-card" aria-label="Context boundary diagram">
                        <div>
                          <p class="section-label">Boundary diagram</p>
                          <p class="subtitle">One exact seam: shells render published contracts, the gateway enforces policy, services coordinate runtime work, and packages own the write model.</p>
                        </div>
                        <svg viewBox="0 0 280 210" role="img" aria-label="Shell to package boundary diagram">
                          <rect x="12" y="20" width="86" height="42" rx="14" fill="#EEF2FF" stroke="#3559E6"/>
                          <rect x="112" y="20" width="66" height="42" rx="14" fill="#ECFDF3" stroke="#0EA5A4"/>
                          <rect x="190" y="20" width="78" height="42" rx="14" fill="#F5F3FF" stroke="#7C3AED"/>
                          <rect x="12" y="128" width="86" height="42" rx="14" fill="#FFF7ED" stroke="#C98900"/>
                          <rect x="112" y="128" width="66" height="42" rx="14" fill="#FEECEC" stroke="#C24141"/>
                          <rect x="190" y="128" width="78" height="42" rx="14" fill="#F8FAFC" stroke="#CBD5E1"/>
                          <text x="55" y="45" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Shell apps</text>
                          <text x="145" y="45" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Gateway</text>
                          <text x="229" y="45" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Services</text>
                          <text x="55" y="153" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Contracts</text>
                          <text x="145" y="153" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Domains</text>
                          <text x="229" y="153" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="#0F172A">Tooling</text>
                          <path d="M98 41H112" stroke="#3559E6" stroke-width="2.5" stroke-linecap="round"/>
                          <path d="M178 41H190" stroke="#0EA5A4" stroke-width="2.5" stroke-linecap="round"/>
                          <path d="M55 62V128" stroke="#3559E6" stroke-width="2.5" stroke-linecap="round"/>
                          <path d="M145 62V128" stroke="#0EA5A4" stroke-width="2.5" stroke-linecap="round"/>
                          <path d="M229 62V128" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round"/>
                          <text x="100" y="103" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif" fill="#667085">published contracts only</text>
                          <text x="188" y="103" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif" fill="#667085">no app-owned truth</text>
                        </svg>
                        <div class="boundary-legend">
                          <div class="legend-row"><span class="legend-swatch" style="background:#3559E6"></span><span>Delivery shells own route residency, not write models.</span></div>
                          <div class="legend-row"><span class="legend-swatch" style="background:#0EA5A4"></span><span>Gateway and services enforce policy, settlement, projection, and integration seams.</span></div>
                          <div class="legend-row"><span class="legend-swatch" style="background:#7C3AED"></span><span>Packages own shared kernel, contracts, and domain truth boundaries.</span></div>
                          <div class="legend-row"><span class="legend-swatch" style="background:#C98900"></span><span>Conditional assistive work stays tools-only until later route publication exists.</span></div>
                        </div>
                      </aside>
                    </div>
                  </section>

                  <section class="lower-panel">
                    <div class="lower-header">
                      <div>
                        <p class="section-label">Table parity</p>
                        <p class="subtitle">The node table mirrors the filtered graph exactly and keeps keyboard navigation deterministic.</p>
                      </div>
                    </div>
                    <div class="table-shell" data-testid="node-table">
                      <table aria-describedby="table-help">
                        <thead>
                          <tr>
                            <th>Artifact</th>
                            <th>Owner</th>
                            <th>Shells / routes</th>
                            <th>Allowed deps</th>
                            <th>Defect</th>
                          </tr>
                        </thead>
                        <tbody id="node-body"></tbody>
                      </table>
                    </div>
                    <p id="table-help" class="visually-hidden">Arrow keys move between filtered rows and update the inspector.</p>

                    <div class="parity-shell" data-testid="parity-table">
                      <div class="parity-card">
                        <h4>By artifact type</h4>
                        <table>
                          <tbody id="parity-artifact-body"></tbody>
                        </table>
                      </div>
                      <div class="parity-card">
                        <h4>By defect state</h4>
                        <table>
                          <tbody id="parity-defect-body"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section class="defect-panel">
                    <div class="defect-header">
                      <div>
                        <p class="section-label">Defect strip</p>
                        <p class="subtitle">Resolved closures and remaining watch items stay visible instead of hiding in prose.</p>
                      </div>
                    </div>
                    <div class="defect-strip" data-testid="defect-strip" id="defect-strip"></div>
                  </section>
                </main>

                <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
              </div>
            </div>
          </div>

          <script id="atlas-data" type="application/json">__ATLAS_DATA__</script>
          <script>
            const payload = JSON.parse(document.getElementById("atlas-data").textContent);
            const artifactTypeOrder = ["app", "service", "package", "docs-only", "tools-only"];
            const defectOrder = ["clean", "resolved", "watch"];
            const state = {
              artifactType: "all",
              context: "all",
              defect: "all",
              selectedArtifactId: payload.artifacts[0]?.artifact_id ?? null,
            };

            const contextGroups = document.getElementById("context-groups");
            const filterArtifact = document.getElementById("filter-artifact");
            const filterContext = document.getElementById("filter-context");
            const filterDefect = document.getElementById("filter-defect");
            const graphLanes = document.getElementById("graph-lanes");
            const nodeBody = document.getElementById("node-body");
            const inspector = document.querySelector("[data-testid='inspector']");
            const defectStrip = document.getElementById("defect-strip");
            const parityArtifactBody = document.getElementById("parity-artifact-body");
            const parityDefectBody = document.getElementById("parity-defect-body");
            const metricApps = document.getElementById("metric-apps");
            const metricServices = document.getElementById("metric-services");
            const metricPackages = document.getElementById("metric-packages");
            const metricDefects = document.getElementById("metric-defects");

            const media = window.matchMedia("(prefers-reduced-motion: reduce)");
            const applyMotionFlag = () => {
              document.body.setAttribute("data-reduced-motion", media.matches ? "true" : "false");
            };
            applyMotionFlag();
            if (typeof media.addEventListener === "function") {
              media.addEventListener("change", applyMotionFlag);
            } else if (typeof media.addListener === "function") {
              media.addListener(applyMotionFlag);
            }

            function sortArtifacts(items) {
              return [...items].sort((left, right) => {
                const leftType = artifactTypeOrder.indexOf(left.artifact_type);
                const rightType = artifactTypeOrder.indexOf(right.artifact_type);
                if (leftType !== rightType) {
                  return leftType - rightType;
                }
                return left.display_name.localeCompare(right.display_name);
              });
            }

            function selectedContextCount(contextCode) {
              return payload.artifacts.filter((artifact) => artifact.owner_context_code === contextCode).length;
            }

            function populateSelects() {
              filterArtifact.innerHTML = [
                '<option value="all">All artifacts</option>',
                ...payload.lane_order.map((lane) => `<option value="${lane.artifact_type}">${lane.label}</option>`),
              ].join("");

              filterContext.innerHTML = [
                '<option value="all">All owners</option>',
                ...payload.owner_contexts
                  .filter((context) => context.artifact_count > 0)
                  .map((context) => `<option value="${context.owner_context_code}">${context.owner_context_label}</option>`),
              ].join("");

              filterDefect.innerHTML = [
                '<option value="all">All defect states</option>',
                '<option value="clean">Clean only</option>',
                '<option value="resolved">Resolved only</option>',
                '<option value="watch">Watch only</option>',
              ].join("");
            }

            function getFilteredArtifacts() {
              return sortArtifacts(
                payload.artifacts.filter((artifact) => {
                  if (state.artifactType !== "all" && artifact.artifact_type !== state.artifactType) {
                    return false;
                  }
                  if (state.context !== "all" && artifact.owner_context_code !== state.context) {
                    return false;
                  }
                  if (state.defect !== "all" && artifact.defect_state !== state.defect) {
                    return false;
                  }
                  return true;
                }),
              );
            }

            function ensureSelection(filteredArtifacts) {
              if (!filteredArtifacts.length) {
                state.selectedArtifactId = null;
                return null;
              }
              if (!filteredArtifacts.some((artifact) => artifact.artifact_id === state.selectedArtifactId)) {
                state.selectedArtifactId = filteredArtifacts[0].artifact_id;
              }
              return filteredArtifacts.find((artifact) => artifact.artifact_id === state.selectedArtifactId) ?? filteredArtifacts[0];
            }

            function renderContextRail() {
              const groups = {
                delivery: "Delivery contexts",
                domain: "Domain contexts",
                shared: "Shared kernel",
                tooling: "Tooling and reserved",
              };
              contextGroups.innerHTML = Object.entries(groups).map(([category, label]) => {
                const items = payload.owner_contexts.filter((context) => context.category === category && context.artifact_count > 0);
                if (!items.length) {
                  return "";
                }
                return `
                  <section class="context-group">
                    <p class="section-label">${label}</p>
                    ${items.map((context) => `
                      <button
                        type="button"
                        class="context-card"
                        data-context-code="${context.owner_context_code}"
                        data-selected="${state.context === context.owner_context_code ? "true" : "false"}"
                        data-testid="context-card-${context.owner_context_code}"
                      >
                        <strong>${context.owner_context_label}</strong>
                        <span>${context.description}</span>
                        <div class="context-meta">
                          <span>${context.owner_kind === "bounded_context" ? "Bounded context" : "Shared class"}</span>
                          <span class="mono">${selectedContextCount(context.owner_context_code)}</span>
                        </div>
                      </button>
                    `).join("")}
                  </section>
                `;
              }).join("");

              contextGroups.querySelectorAll(".context-card").forEach((card) => {
                card.addEventListener("click", () => {
                  const code = card.getAttribute("data-context-code");
                  state.context = state.context === code ? "all" : code;
                  filterContext.value = state.context;
                  render();
                });
              });
            }

            function badgeForState(stateValue) {
              return `<span class="chip ${stateValue}">${stateValue}</span>`;
            }

            function routeSummary(artifact) {
              if (artifact.route_families_owned.length) {
                return artifact.route_families_owned.map((route) => route.route_family_id).join(", ");
              }
              if (artifact.shell_types_owned.length) {
                return artifact.shell_types_owned.join(", ");
              }
              return "none";
            }

            function glyphMarkup(artifactType) {
              if (artifactType === "app") {
                return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 19v-3m8 3v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
              }
              if (artifactType === "service") {
                return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="4" width="14" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="14" width="14" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 10v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
              }
              if (artifactType === "package") {
                return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 8l8-4 8 4-8 4-8-4zm0 3l8 4 8-4m-16 3l8 4 8-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
              }
              return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h7l5 5v9H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 5v5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
            }

            function renderGraph(filteredArtifacts) {
              graphLanes.innerHTML = payload.lane_order.map((lane) => {
                const items = filteredArtifacts.filter((artifact) => artifact.artifact_type === lane.artifact_type);
                if (!items.length) {
                  return "";
                }
                return `
                  <section class="lane">
                    <div class="lane-header">
                      <h3>${lane.label}</h3>
                      <span class="lane-badge">${items.length}</span>
                    </div>
                    <div class="lane-grid">
                      ${items.map((artifact) => `
                        <article
                          class="node-card"
                          tabindex="0"
                          role="button"
                          aria-pressed="${artifact.artifact_id === state.selectedArtifactId ? "true" : "false"}"
                          data-artifact-id="${artifact.artifact_id}"
                          data-selected="${artifact.artifact_id === state.selectedArtifactId ? "true" : "false"}"
                          data-testid="graph-node-${artifact.artifact_id}"
                        >
                          <div class="node-top">
                            <div class="glyph">${glyphMarkup(artifact.artifact_type)}</div>
                            ${badgeForState(artifact.defect_state)}
                          </div>
                          <div>
                            <h3 class="node-title">${artifact.display_name}</h3>
                            <div class="node-path mono">${artifact.repo_path}</div>
                          </div>
                          <div class="chip-row">
                            <span class="chip">${artifact.owner_context_label}</span>
                            <span class="chip">${artifact.route_families_owned.length || artifact.gateway_surfaces_owned.length || artifact.shell_types_owned.length} ownerships</span>
                          </div>
                        </article>
                      `).join("")}
                    </div>
                  </section>
                `;
              }).join("");

              graphLanes.querySelectorAll(".node-card").forEach((card) => {
                card.addEventListener("click", () => {
                  state.selectedArtifactId = card.getAttribute("data-artifact-id");
                  render();
                });
                card.addEventListener("keydown", (event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                    event.preventDefault();
                    moveSelection(1, "graph");
                  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveSelection(-1, "graph");
                  }
                });
              });
            }

            function renderTable(filteredArtifacts) {
              nodeBody.innerHTML = filteredArtifacts.map((artifact) => `
                <tr
                  tabindex="0"
                  data-artifact-id="${artifact.artifact_id}"
                  data-selected="${artifact.artifact_id === state.selectedArtifactId ? "true" : "false"}"
                  data-testid="table-row-${artifact.artifact_id}"
                >
                  <td>
                    <strong>${artifact.display_name}</strong>
                    <div class="mono">${artifact.repo_path}</div>
                  </td>
                  <td>${artifact.owner_context_label}</td>
                  <td>${routeSummary(artifact)}</td>
                  <td>${artifact.allowed_dependencies.slice(0, 2).join(", ")}${artifact.allowed_dependencies.length > 2 ? ", ..." : ""}</td>
                  <td>${artifact.defect_state}</td>
                </tr>
              `).join("");

              nodeBody.querySelectorAll("tr").forEach((row) => {
                row.addEventListener("click", () => {
                  state.selectedArtifactId = row.getAttribute("data-artifact-id");
                  render();
                });
                row.addEventListener("keydown", (event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveSelection(1, "table");
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveSelection(-1, "table");
                  }
                });
              });
            }

            function renderInspector(selectedArtifact) {
              if (!selectedArtifact) {
                inspector.innerHTML = '<div class="empty-state">No artifact matches the current filters.</div>';
                return;
              }
              const routeItems = selectedArtifact.route_families_owned.length
                ? selectedArtifact.route_families_owned.map((route) => `
                    <div class="inspector-item">
                      <span class="mono">${route.route_family_id}</span> · ${route.route_family}
                      <small>${route.explicit_route_contract ? "Explicit route contract" : "Derived inventory label"}</small>
                    </div>
                  `).join("")
                : '<div class="inspector-item">No route-family ownership for this workspace.</div>';
              const gatewayItems = selectedArtifact.gateway_surfaces_owned.length
                ? selectedArtifact.gateway_surfaces_owned.map((surface) => `
                    <div class="inspector-item">
                      <span class="mono">${surface.gateway_surface_id}</span> · ${surface.surface_name}
                    </div>
                  `).join("")
                : '<div class="inspector-item">No gateway-surface ownership for this workspace.</div>';
              const sourceItems = selectedArtifact.source_refs.map((sourceRef) => `<div class="inspector-item mono">${sourceRef}</div>`).join("");
              inspector.innerHTML = `
                <div>
                  <p class="section-label">Selected node</p>
                  <h2>${selectedArtifact.display_name}</h2>
                  <div class="mono">${selectedArtifact.repo_path}</div>
                </div>
                <div class="chip-row">
                  <span class="chip">${selectedArtifact.artifact_type}</span>
                  <span class="chip">${selectedArtifact.owner_context_label}</span>
                  ${badgeForState(selectedArtifact.defect_state)}
                </div>
                <div class="meta-grid">
                  <section class="inspector-block">
                    <strong>Ownership notes</strong>
                    <div class="inspector-item">${selectedArtifact.notes}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Allowed imports</strong>
                    <div class="inspector-list">
                      ${selectedArtifact.allowed_dependencies.map((entry) => `<div class="inspector-item mono">${entry}</div>`).join("")}
                    </div>
                  </section>
                  <section class="inspector-block">
                    <strong>Forbidden imports</strong>
                    <div class="inspector-list">
                      ${selectedArtifact.forbidden_dependencies.map((entry) => `<div class="inspector-item mono">${entry}</div>`).join("")}
                    </div>
                  </section>
                  <section class="inspector-block">
                    <strong>Route ownership</strong>
                    <div class="inspector-list">${routeItems}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Gateway surfaces</strong>
                    <div class="inspector-list">${gatewayItems}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Context boundary contracts</strong>
                    <div class="inspector-list">
                      ${selectedArtifact.dependency_contract_refs.map((contractRef) => `<div class="inspector-item mono">${contractRef}</div>`).join("")}
                    </div>
                  </section>
                  <section class="inspector-block">
                    <strong>Source refs</strong>
                    <div class="inspector-list">${sourceItems}</div>
                  </section>
                </div>
              `;
            }

            function renderParity(filteredArtifacts) {
              const artifactCounts = new Map(payload.lane_order.map((lane) => [lane.artifact_type, 0]));
              const defectCounts = new Map(defectOrder.map((stateValue) => [stateValue, 0]));
              filteredArtifacts.forEach((artifact) => {
                artifactCounts.set(artifact.artifact_type, (artifactCounts.get(artifact.artifact_type) ?? 0) + 1);
                defectCounts.set(artifact.defect_state, (defectCounts.get(artifact.defect_state) ?? 0) + 1);
              });

              parityArtifactBody.innerHTML = payload.lane_order.map((lane) => `
                <tr><td>${lane.label}</td><td class="mono">${artifactCounts.get(lane.artifact_type) ?? 0}</td></tr>
              `).join("");
              parityDefectBody.innerHTML = defectOrder.map((stateValue) => `
                <tr><td>${stateValue}</td><td class="mono">${defectCounts.get(stateValue) ?? 0}</td></tr>
              `).join("");
            }

            function renderDefects(filteredArtifacts) {
              const visibleIds = new Set(filteredArtifacts.map((artifact) => artifact.artifact_id));
              const visibleDefects = payload.topology_defects.filter((defect) => {
                if (state.defect !== "all" && defect.state !== state.defect) {
                  return false;
                }
                if (state.context === "all") {
                  return true;
                }
                return defect.affected_artifact_ids.some((artifactId) => visibleIds.has(artifactId));
              });
              defectStrip.innerHTML = visibleDefects.length
                ? visibleDefects.map((defect) => `
                    <article class="defect-card" data-state="${defect.state}">
                      <div class="chip-row">
                        <span class="chip ${defect.state}">${defect.state}</span>
                        <span class="chip">${defect.severity}</span>
                      </div>
                      <strong>${defect.title}</strong>
                      <div class="inspector-item">${defect.summary}</div>
                      <div class="inspector-item mono">${defect.defect_id}</div>
                    </article>
                  `).join("")
                : '<div class="empty-state">No defects match the current filters.</div>';
            }

            function updateMetrics() {
              metricApps.textContent = payload.summary.app_count;
              metricServices.textContent = payload.summary.service_count;
              metricPackages.textContent = payload.summary.package_count;
              metricDefects.textContent = payload.summary.topology_defect_count;
            }

            function moveSelection(delta, target) {
              const filteredArtifacts = getFilteredArtifacts();
              if (!filteredArtifacts.length) {
                return;
              }
              const currentIndex = filteredArtifacts.findIndex((artifact) => artifact.artifact_id === state.selectedArtifactId);
              const safeIndex = currentIndex === -1 ? 0 : currentIndex;
              const nextIndex = Math.min(filteredArtifacts.length - 1, Math.max(0, safeIndex + delta));
              state.selectedArtifactId = filteredArtifacts[nextIndex].artifact_id;
              render();
              const selector = target === "graph" ? `[data-testid="graph-node-${state.selectedArtifactId}"]` : `[data-testid="table-row-${state.selectedArtifactId}"]`;
              const element = document.querySelector(selector);
              if (element) {
                element.focus();
              }
            }

            function render() {
              const filteredArtifacts = getFilteredArtifacts();
              const selectedArtifact = ensureSelection(filteredArtifacts);
              renderContextRail();
              renderGraph(filteredArtifacts);
              renderTable(filteredArtifacts);
              renderInspector(selectedArtifact);
              renderParity(filteredArtifacts);
              renderDefects(filteredArtifacts);
              updateMetrics();
            }

            filterArtifact.addEventListener("change", () => {
              state.artifactType = filterArtifact.value;
              render();
            });
            filterContext.addEventListener("change", () => {
              state.context = filterContext.value;
              render();
            });
            filterDefect.addEventListener("change", () => {
              state.defect = filterDefect.value;
              render();
            });

            populateSelects();
            render();
          </script>
        </body>
        </html>
        """
    )
    return template.replace("__ATLAS_DATA__", json.dumps(atlas_payload, separators=(",", ":")))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if not rows:
        raise SystemExit(f"Cannot write empty CSV: {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    for name, path in REQUIRED_INPUTS.items():
        if not path.exists():
            raise SystemExit(f"Missing required input {name}: {path}")

    ensure_dirs()

    shell_map = load_json(REQUIRED_INPUTS["shell_ownership_map"])
    route_rows = load_csv(REQUIRED_INPUTS["route_family_inventory"])
    gateway_rows = load_csv(REQUIRED_INPUTS["gateway_surface_matrix"])
    import_rules = load_json(REQUIRED_INPUTS["import_boundary_rules"])

    route_index = build_route_index(route_rows)
    gateway_by_shell, gateway_flat = build_gateway_index(gateway_rows)
    artifacts = build_artifacts(route_index, gateway_by_shell)
    validate_model(shell_map, route_index, gateway_flat, artifacts)

    manifest = build_manifest(shell_map, route_rows, gateway_rows, import_rules, artifacts)
    dependency_rules = build_dependency_rule_payload(manifest)
    boundary_rows = build_boundary_csv_rows()

    write_json(MANIFEST_PATH, manifest)
    write_csv(BOUNDARY_CSV_PATH, boundary_rows)
    write_json(CONTRACTS_JSON_PATH, {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "contract_count": len(CONTEXT_BOUNDARY_CONTRACTS),
            "from_owner_count": len({owner for contract in CONTEXT_BOUNDARY_CONTRACTS for owner in contract["from_owner_codes"]}),
            "to_owner_count": len({owner for contract in CONTEXT_BOUNDARY_CONTRACTS for owner in contract["to_owner_codes"]}),
        },
        "contracts": CONTEXT_BOUNDARY_CONTRACTS,
    })
    write_json(DEPENDENCY_RULES_JSON_PATH, dependency_rules)

    TOPOLOGY_RULES_MD_PATH.write_text(render_repository_topology_md(manifest))
    BOUNDARY_RULES_MD_PATH.write_text(render_boundary_rules_md(manifest))
    ATLAS_MMD_PATH.write_text(render_mermaid(manifest))
    ATLAS_HTML_PATH.write_text(render_html(manifest))

    print(f"{TASK_ID} repo topology pack generated")


if __name__ == "__main__":
    main()
