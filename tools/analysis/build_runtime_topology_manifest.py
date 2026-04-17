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

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "seq_046"
CAPTURED_ON = "2026-04-11"
VISUAL_MODE = "Runtime_Topology_Atlas"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Publish the canonical Phase 0 runtime-topology contract as machine-readable law so "
    "workload families, trust-zone boundaries, failure domains, egress posture, and runtime "
    "publication placeholders become explicit inputs for later gateway, release, and frontend tasks."
)

REPO_TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
SERVICE_MANIFEST_PATH = DATA_DIR / "service_interface_manifest.json"
SCAFFOLD_MANIFEST_PATH = DATA_DIR / "monorepo_scaffold_manifest.json"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_matrix.csv"
TENANT_MATRIX_PATH = DATA_DIR / "tenant_isolation_matrix.csv"

WORKLOAD_PATH = DATA_DIR / "runtime_workload_families.json"
MANIFEST_PATH = DATA_DIR / "runtime_topology_manifest.json"
EDGES_PATH = DATA_DIR / "runtime_topology_edges.csv"
FAILURE_DOMAIN_PATH = DATA_DIR / "runtime_failure_domains.csv"

STRATEGY_PATH = DOCS_DIR / "46_runtime_topology_manifest_strategy.md"
CATALOG_PATH = DOCS_DIR / "46_workload_family_catalog.md"
FAILURE_POLICY_PATH = DOCS_DIR / "46_failure_domain_and_egress_policy.md"
ATLAS_PATH = DOCS_DIR / "46_runtime_topology_atlas.html"
MMD_PATH = DOCS_DIR / "46_runtime_topology_edges.mmd"

ROOT_PACKAGE_PATH = ROOT / "package.json"

SOURCE_PRECEDENCE = [
    "prompt/046.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/11_trust_zone_and_workload_family_strategy.md",
    "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md",
    "docs/architecture/13_backend_runtime_service_baseline.md",
    "docs/architecture/15_release_and_supply_chain_tooling_baseline.md",
    "docs/architecture/41_repository_topology_rules.md",
    "docs/architecture/42_monorepo_scaffold_plan.md",
    "docs/architecture/43_service_scaffold_map.md",
    "docs/architecture/44_domain_package_contracts.md",
    "docs/engineering/45_coding_standards.md",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
    "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
    "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
    "blueprint/phase-0-the-foundation-protocol.md#1-10 bounded-context rules",
    "blueprint/blueprint-init.md#12. Practical engineering shape",
    "blueprint/phase-cards.md#Phase 0 hardening note",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 102",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 105",
    "blueprint/forensic-audit-findings.md#Finding 106",
    "data/analysis/repo_topology_manifest.json",
    "data/analysis/service_interface_manifest.json",
    "data/analysis/gateway_surface_matrix.csv",
    "data/analysis/tenant_isolation_matrix.csv",
    "data/analysis/degraded_mode_defaults.json",
]

TRUST_ZONES = [
    {
        "trust_zone_ref": "tz_public_edge",
        "display_name": "Public edge",
        "band_order": 1,
        "purpose": "TLS termination, origin allowlisting, request shaping, and zero-trust browser pre-filtering.",
        "allows_browser_traffic": "yes",
        "primary_controls": [
            "Origin allowlist",
            "Bot and rate-limit fencing",
            "No PHI assembly",
            "No adapter egress",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
        "notes": "This is the first browser-contacting band, but it is not the published route-compute boundary.",
    },
    {
        "trust_zone_ref": "tz_shell_delivery",
        "display_name": "Shell delivery",
        "band_order": 2,
        "purpose": "Static shell, publication bundle, and design/runtime parity delivery only.",
        "allows_browser_traffic": "yes",
        "primary_controls": [
            "RuntimePublicationBundle exact only",
            "No mutation or adapter egress",
            "Static publication parity only",
            "ReleaseApprovalFreeze placeholder visible",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
        "notes": "Shell assets stay exact to the promoted runtime bundle and may not become a hidden BFF.",
    },
    {
        "trust_zone_ref": "tz_published_gateway",
        "display_name": "Published gateway",
        "band_order": 3,
        "purpose": "The only browser-addressable compute boundary for published gateway surfaces.",
        "allows_browser_traffic": "yes",
        "primary_controls": [
            "Published gateway surface tuple only",
            "Route-intent and session policy enforcement",
            "No direct data-plane or adapter access",
            "SurfaceAuthorityTupleHash parity",
        ],
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
        "notes": "Later seq_047 refines exact gateway splits, but seq_046 already freezes the zone and bridge law.",
    },
    {
        "trust_zone_ref": "tz_application_core",
        "display_name": "Application core",
        "band_order": 4,
        "purpose": "Canonical command and projection runtime planes with no direct browser reachability.",
        "allows_browser_traffic": "no",
        "primary_controls": [
            "ScopedMutationGate",
            "Projection-first read model discipline",
            "Outbox and durable-queue initiation only",
            "Minimum-necessary query surfaces",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
        ],
        "notes": "Command and projection stay separate workload families even when they deploy from the same repository.",
    },
    {
        "trust_zone_ref": "tz_integration_perimeter",
        "display_name": "Integration perimeter",
        "band_order": 5,
        "purpose": "External effect dispatch, provider callback ingress, and simulator seams.",
        "allows_browser_traffic": "no",
        "primary_controls": [
            "AdapterContractProfile only",
            "Dependency degradation profiles",
            "Durable checkpoints",
            "Callback idempotency and correlation",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
        ],
        "notes": "Live-provider dispatch and simulator backplanes stay in the same trust zone but split at the workload-family level.",
    },
    {
        "trust_zone_ref": "tz_stateful_data",
        "display_name": "Stateful data",
        "band_order": 6,
        "purpose": "Relational, projection, queue, cache, object, and immutable store classes with explicit restore law.",
        "allows_browser_traffic": "no",
        "primary_controls": [
            "Tenant tuple on every key or stronger scope tuple",
            "Store-class-specific replication policy",
            "No browser reachability",
            "Restore proof before live authority",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
        "notes": "Queues and caches are stateful runtime concerns, not hidden details inside app or worker config.",
    },
    {
        "trust_zone_ref": "tz_assurance_security",
        "display_name": "Assurance and security",
        "band_order": 7,
        "purpose": "Assurance slices, release/watch tuple publication, audit, resilience, and KMS-bound control paths.",
        "allows_browser_traffic": "no",
        "primary_controls": [
            "AssuranceSupervisor and RuntimeContractPublisher",
            "Release watch tuple parity",
            "Immutable evidence and trust verdicts",
            "Fail-closed blast-radius controls",
        ],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
        "notes": "Support, operations, governance, and release controls consume one assurance plane instead of inventing local truth.",
    },
]

BOUNDARIES = [
    {
        "boundary_id": "tzb_public_edge_to_shell_delivery",
        "source_trust_zone_ref": "tz_public_edge",
        "target_trust_zone_ref": "tz_shell_delivery",
        "source_workload_family_refs": ["wf_public_edge_ingress"],
        "target_workload_family_refs": ["wf_shell_delivery_static_publication"],
        "allowed_protocol_refs": ["https"],
        "allowed_identity_refs": ["sid_public_edge_proxy", "sid_shell_publication_bundle"],
        "allowed_data_classification_refs": ["public_safe"],
        "tenant_transfer_mode": "tenant_hint_only",
        "assurance_trust_transfer_mode": "publication_parity_only",
        "egress_allowlist_ref": "eal_public_edge_internal_only",
        "boundary_failure_mode": "static_placeholder_or_cached_shell_only",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
        "notes": "Static delivery remains bundle-bound and may not become a mutable runtime hop.",
    },
    {
        "boundary_id": "tzb_public_edge_to_published_gateway",
        "source_trust_zone_ref": "tz_public_edge",
        "target_trust_zone_ref": "tz_published_gateway",
        "source_workload_family_refs": ["wf_public_edge_ingress"],
        "target_workload_family_refs": ["wf_shell_delivery_published_gateway"],
        "allowed_protocol_refs": ["https", "sse", "websocket"],
        "allowed_identity_refs": ["sid_public_edge_proxy", "sid_published_gateway"],
        "allowed_data_classification_refs": ["public_safe", "tenant_scoped_summary"],
        "tenant_transfer_mode": "runtime_binding_and_session_policy_only",
        "assurance_trust_transfer_mode": "published_surface_tuple_only",
        "egress_allowlist_ref": "eal_public_edge_internal_only",
        "boundary_failure_mode": "same_shell_recovery_or_blocked",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
        ],
        "notes": "This is the only browser-to-compute bridge beyond the edge.",
    },
    {
        "boundary_id": "tzb_published_gateway_to_application_core",
        "source_trust_zone_ref": "tz_published_gateway",
        "target_trust_zone_ref": "tz_application_core",
        "source_workload_family_refs": ["wf_shell_delivery_published_gateway"],
        "target_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
        "allowed_protocol_refs": ["https", "grpc"],
        "allowed_identity_refs": ["sid_published_gateway", "sid_command_api", "sid_projection_worker"],
        "allowed_data_classification_refs": ["tenant_scoped_summary", "tenant_scoped_phi_minimum_necessary"],
        "tenant_transfer_mode": "tenant_tuple_and_route_intent_preserved",
        "assurance_trust_transfer_mode": "surface_authority_tuple_preserved",
        "egress_allowlist_ref": "eal_gateway_internal_only",
        "boundary_failure_mode": "command_halt_or_projection_recovery_only",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
        ],
        "notes": "Gateway surfaces may read projections and submit commands only through declared bridge placeholders.",
    },
    {
        "boundary_id": "tzb_published_gateway_to_assurance_security",
        "source_trust_zone_ref": "tz_published_gateway",
        "target_trust_zone_ref": "tz_assurance_security",
        "source_workload_family_refs": ["wf_shell_delivery_published_gateway"],
        "target_workload_family_refs": ["wf_assurance_security_control"],
        "allowed_protocol_refs": ["https", "grpc"],
        "allowed_identity_refs": ["sid_published_gateway", "sid_assurance_control"],
        "allowed_data_classification_refs": ["masked_support_excerpt", "append_only_control_evidence"],
        "tenant_transfer_mode": "explicit_scope_tuple_or_platform_scope_only",
        "assurance_trust_transfer_mode": "assurance_slice_tuple_only",
        "egress_allowlist_ref": "eal_gateway_internal_only",
        "boundary_failure_mode": "controls_frozen_same_shell_context_preserved",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
        ],
        "notes": "Support replay, operations drilldown, and governance shells may query assurance slices without bypassing the control plane.",
    },
    {
        "boundary_id": "tzb_application_core_to_stateful_data",
        "source_trust_zone_ref": "tz_application_core",
        "target_trust_zone_ref": "tz_stateful_data",
        "source_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
        "target_workload_family_refs": ["wf_data_stateful_plane"],
        "allowed_protocol_refs": ["sql_tls", "object_api_tls", "queue_tls", "cache_tls"],
        "allowed_identity_refs": ["sid_command_api", "sid_projection_worker", "sid_data_plane"],
        "allowed_data_classification_refs": [
            "tenant_scoped_phi_minimum_necessary",
            "tenant_scoped_summary",
            "append_only_control_evidence",
        ],
        "tenant_transfer_mode": "tenant_tuple_on_every_key_or_record",
        "assurance_trust_transfer_mode": "restore_tuple_required",
        "egress_allowlist_ref": "eal_data_internal_only",
        "boundary_failure_mode": "read_only_or_blocked_until_restore_proof",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
        "notes": "Data-plane access is internal-only and tuple-bound.",
    },
    {
        "boundary_id": "tzb_application_core_to_integration_perimeter",
        "source_trust_zone_ref": "tz_application_core",
        "target_trust_zone_ref": "tz_integration_perimeter",
        "source_workload_family_refs": ["wf_command_orchestration"],
        "target_workload_family_refs": ["wf_integration_dispatch", "wf_integration_simulation_lab"],
        "allowed_protocol_refs": ["queue_dispatch", "outbox_checkpoint"],
        "allowed_identity_refs": ["sid_command_api", "sid_integration_dispatch", "sid_adapter_simulators"],
        "allowed_data_classification_refs": ["external_effect_descriptor", "masked_external_contact"],
        "tenant_transfer_mode": "effect_scope_and_tenant_tuple_preserved",
        "assurance_trust_transfer_mode": "checkpoint_receipt_required",
        "egress_allowlist_ref": "eal_command_to_internal_planes_only",
        "boundary_failure_mode": "integration_queue_only",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
        ],
        "notes": "Command handoff into integration always passes through durable queues or simulator contracts.",
    },
    {
        "boundary_id": "tzb_application_core_to_assurance_security",
        "source_trust_zone_ref": "tz_application_core",
        "target_trust_zone_ref": "tz_assurance_security",
        "source_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
        "target_workload_family_refs": ["wf_assurance_security_control"],
        "allowed_protocol_refs": ["grpc", "https", "audit_append"],
        "allowed_identity_refs": ["sid_command_api", "sid_projection_worker", "sid_assurance_control"],
        "allowed_data_classification_refs": ["append_only_control_evidence", "tenant_scoped_summary"],
        "tenant_transfer_mode": "tenant_tuple_plus_scope_hash_required",
        "assurance_trust_transfer_mode": "assurance_slice_verdict_required",
        "egress_allowlist_ref": "eal_assurance_to_internal_planes_only",
        "boundary_failure_mode": "writable_freeze_same_shell_context_preserved",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
        "notes": "Mutation and projection planes both depend on exact assurance slices before live widening.",
    },
    {
        "boundary_id": "tzb_integration_perimeter_to_stateful_data",
        "source_trust_zone_ref": "tz_integration_perimeter",
        "target_trust_zone_ref": "tz_stateful_data",
        "source_workload_family_refs": ["wf_integration_dispatch", "wf_integration_simulation_lab"],
        "target_workload_family_refs": ["wf_data_stateful_plane"],
        "allowed_protocol_refs": ["queue_tls", "sql_tls", "object_api_tls"],
        "allowed_identity_refs": ["sid_integration_dispatch", "sid_adapter_simulators", "sid_data_plane"],
        "allowed_data_classification_refs": ["external_effect_descriptor", "append_only_control_evidence"],
        "tenant_transfer_mode": "effect_scope_and_supplier_correlation_only",
        "assurance_trust_transfer_mode": "receipt_or_checkpoint_required",
        "egress_allowlist_ref": "eal_data_internal_only",
        "boundary_failure_mode": "checkpoint_and_retry_or_dispute",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
        ],
        "notes": "Provider outcomes settle through durable state before they can affect user-visible posture.",
    },
    {
        "boundary_id": "tzb_integration_perimeter_to_assurance_security",
        "source_trust_zone_ref": "tz_integration_perimeter",
        "target_trust_zone_ref": "tz_assurance_security",
        "source_workload_family_refs": ["wf_integration_dispatch", "wf_integration_simulation_lab"],
        "target_workload_family_refs": ["wf_assurance_security_control"],
        "allowed_protocol_refs": ["audit_append", "https"],
        "allowed_identity_refs": ["sid_integration_dispatch", "sid_adapter_simulators", "sid_assurance_control"],
        "allowed_data_classification_refs": ["append_only_control_evidence"],
        "tenant_transfer_mode": "tenant_tuple_plus_dependency_code_only",
        "assurance_trust_transfer_mode": "dependency_slice_verdict_required",
        "egress_allowlist_ref": "eal_assurance_to_internal_planes_only",
        "boundary_failure_mode": "slice_degraded_or_queue_only",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Pipeline Stage Chain",
        ],
        "notes": "Integration failures widen only through explicit assurance tuples and watch publication.",
    },
    {
        "boundary_id": "tzb_assurance_security_to_stateful_data",
        "source_trust_zone_ref": "tz_assurance_security",
        "target_trust_zone_ref": "tz_stateful_data",
        "source_workload_family_refs": ["wf_assurance_security_control"],
        "target_workload_family_refs": ["wf_data_stateful_plane"],
        "allowed_protocol_refs": ["sql_tls", "object_api_tls", "append_only_api"],
        "allowed_identity_refs": ["sid_assurance_control", "sid_data_plane"],
        "allowed_data_classification_refs": ["append_only_control_evidence", "tenant_scoped_summary"],
        "tenant_transfer_mode": "platform_control_with_explicit_tenant_projection_only",
        "assurance_trust_transfer_mode": "restore_tuple_required",
        "egress_allowlist_ref": "eal_assurance_to_internal_planes_only",
        "boundary_failure_mode": "controls_frozen_or_restore_only",
        "boundary_state": "allowed",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
        "notes": "Assurance is the only plane allowed to publish restore and release tuple verdicts into stateful stores.",
    },
]

RINGS = [
    {
        "environment_ring": "local",
        "display_name": "Local development",
        "allowed_region_roles": ["nonprod_local"],
        "default_write_region_ref": "local_nonprod",
        "publication_state": "declared_internal_contract",
        "approval_state": "approved_internal",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Workload Families",
            "blueprint/blueprint-init.md#12. Practical engineering shape",
        ],
    },
    {
        "environment_ring": "ci-preview",
        "display_name": "Preview / ephemeral",
        "allowed_region_roles": ["primary"],
        "default_write_region_ref": "uk_primary_region",
        "publication_state": "declared_internal_contract",
        "approval_state": "approved_internal",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Workload Families",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Pipeline Stage Chain",
        ],
    },
    {
        "environment_ring": "integration",
        "display_name": "Integration / staging",
        "allowed_region_roles": ["primary"],
        "default_write_region_ref": "uk_primary_region",
        "publication_state": "declared_internal_contract",
        "approval_state": "approved_internal",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Workload Families",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Pipeline Stage Chain",
        ],
    },
    {
        "environment_ring": "preprod",
        "display_name": "Pre-production",
        "allowed_region_roles": ["primary", "secondary"],
        "default_write_region_ref": "uk_primary_region",
        "publication_state": "pending_release_binding",
        "approval_state": "pending_runtime_publication_bundle",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Workload Families",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
    },
    {
        "environment_ring": "production",
        "display_name": "Production",
        "allowed_region_roles": ["primary", "secondary"],
        "default_write_region_ref": "uk_primary_region",
        "publication_state": "pending_release_binding",
        "approval_state": "pending_runtime_publication_bundle",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Workload Families",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
    },
]

REGION_ROLE_META = {
    "nonprod_local": {
        "region_ref": "local_nonprod",
        "display_name": "Local nonprod",
        "warm_standby": False,
        "notes": "Developer-managed local topology emulation only.",
    },
    "primary": {
        "region_ref": "uk_primary_region",
        "display_name": "UK primary",
        "warm_standby": False,
        "notes": "Primary write role for managed environments.",
    },
    "secondary": {
        "region_ref": "uk_secondary_region",
        "display_name": "UK secondary",
        "warm_standby": True,
        "notes": "Warm standby or restore rehearsal role; promotion requires exact tuple refresh.",
    },
}

WORKLOAD_FAMILY_CATALOG = [
    {
        "runtime_workload_family_ref": "wf_public_edge_ingress",
        "family_code": "public_edge",
        "display_name": "Public edge ingress",
        "short_label": "Edge ingress",
        "trust_zone_ref": "tz_public_edge",
        "owned_bounded_context_refs": ["platform_runtime", "identity_access"],
        "served_bounded_context_refs": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
        ],
        "owned_service_refs": ["svc_public_edge_proxy", "svc_origin_policy", "svc_rate_limit"],
        "ingress_mode": "browser_tls_termination_only",
        "allowed_downstream_family_refs": [
            "wf_shell_delivery_static_publication",
            "wf_shell_delivery_published_gateway",
        ],
        "allowed_data_classification_refs": ["public_safe", "operational_internal_non_phi"],
        "tenant_context_mode": "tenant_hint_then_runtime_binding",
        "tenant_isolation_mode": "shared_stateless_edge",
        "assurance_trust_mode": "consume_release_and_runtime_publication_verdicts",
        "egress_allowlist_ref": "eal_public_edge_internal_only",
        "service_identity_ref": "sid_public_edge_proxy",
        "browser_reachable": "yes",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "declared",
        "split_rationale": "",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
        "notes": "Edge routing is shared but intentionally narrow: no PHI assembly and no direct adapter or data egress.",
    },
    {
        "runtime_workload_family_ref": "wf_shell_delivery_static_publication",
        "family_code": "shell_delivery",
        "display_name": "Shell publication and asset delivery",
        "short_label": "Shell publication",
        "trust_zone_ref": "tz_shell_delivery",
        "owned_bounded_context_refs": ["platform_runtime", "release_control", "design_system"],
        "served_bounded_context_refs": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
            "design_system",
        ],
        "owned_service_refs": ["svc_shell_publication_bundle", "svc_static_asset_delivery"],
        "ingress_mode": "runtime_publication_bundle_only",
        "allowed_downstream_family_refs": [],
        "allowed_data_classification_refs": ["public_safe", "tenant_scoped_summary"],
        "tenant_context_mode": "publication_bundle_only",
        "tenant_isolation_mode": "bundle_exact_no_runtime_mutation",
        "assurance_trust_mode": "publication_parity_only",
        "egress_allowlist_ref": "eal_shell_publication_none",
        "service_identity_ref": "sid_shell_publication_bundle",
        "browser_reachable": "yes",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "watch",
        "split_rationale": (
            "Split from the published gateway because static publication, release freeze linkage, "
            "and no-runtime-egress posture differ materially from browser-addressable compute."
        ),
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
        ],
        "notes": "Shell delivery stays exact to the RuntimePublicationBundle and cannot hide mutation or session logic.",
    },
    {
        "runtime_workload_family_ref": "wf_shell_delivery_published_gateway",
        "family_code": "shell_delivery",
        "display_name": "Published gateway surfaces",
        "short_label": "Published gateway",
        "trust_zone_ref": "tz_published_gateway",
        "owned_bounded_context_refs": ["platform_runtime", "identity_access"],
        "served_bounded_context_refs": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
            "identity_access",
        ],
        "owned_service_refs": ["service_api_gateway"],
        "ingress_mode": "published_gateway_surface_only",
        "allowed_downstream_family_refs": [
            "wf_command_orchestration",
            "wf_projection_read_models",
            "wf_assurance_security_control",
        ],
        "allowed_data_classification_refs": [
            "tenant_scoped_summary",
            "masked_support_excerpt",
            "tenant_scoped_phi_minimum_necessary",
        ],
        "tenant_context_mode": "route_scoped_session_and_audience_binding",
        "tenant_isolation_mode": "audience_surface_tuple_scoped",
        "assurance_trust_mode": "surface_authority_tuple_enforced",
        "egress_allowlist_ref": "eal_gateway_internal_only",
        "service_identity_ref": "sid_published_gateway",
        "browser_reachable": "yes",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "watch",
        "split_rationale": (
            "Separated from static shell delivery because differing session policy, tenant isolation, "
            "bridge authority, and release-freeze posture would make one combined family unsafe."
        ),
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
        "notes": "This is the only family allowed to bridge browser traffic into command, projection, or assurance planes.",
    },
    {
        "runtime_workload_family_ref": "wf_command_orchestration",
        "family_code": "command",
        "display_name": "Canonical command orchestration",
        "short_label": "Command",
        "trust_zone_ref": "tz_application_core",
        "owned_bounded_context_refs": [
            "platform_runtime",
            "intake_safety",
            "identity_access",
            "booking",
            "hub_coordination",
            "pharmacy",
            "communications",
            "support",
            "governance_admin",
        ],
        "served_bounded_context_refs": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
            "shared_domain_kernel",
        ],
        "owned_service_refs": ["service_command_api", "svc_timer_orchestrator"],
        "ingress_mode": "declared_service_and_queue_only",
        "allowed_downstream_family_refs": [
            "wf_data_stateful_plane",
            "wf_integration_dispatch",
            "wf_integration_simulation_lab",
            "wf_assurance_security_control",
        ],
        "allowed_data_classification_refs": [
            "tenant_scoped_phi_minimum_necessary",
            "tenant_scoped_summary",
            "append_only_control_evidence",
        ],
        "tenant_context_mode": "acting_scope_tuple_and_route_intent",
        "tenant_isolation_mode": "tenant_tuple_and_effect_scope",
        "assurance_trust_mode": "scoped_mutation_gate_and_assurance_slice_verdicts",
        "egress_allowlist_ref": "eal_command_to_internal_planes_only",
        "service_identity_ref": "sid_command_api",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "declared",
        "split_rationale": "",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
            "docs/architecture/43_service_scaffold_map.md",
        ],
        "notes": "Canonical writes, blockers, settlements, and route-intent enforcement stay here and nowhere in the shell layer.",
    },
    {
        "runtime_workload_family_ref": "wf_projection_read_models",
        "family_code": "projection",
        "display_name": "Projection rebuild and read derivation",
        "short_label": "Projection",
        "trust_zone_ref": "tz_application_core",
        "owned_bounded_context_refs": [
            "platform_runtime",
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
            "analytics_assurance",
        ],
        "served_bounded_context_refs": [
            "patient_experience",
            "triage_workspace",
            "hub_coordination",
            "pharmacy",
            "support",
            "operations",
            "governance_admin",
            "analytics_assurance",
        ],
        "owned_service_refs": ["service_projection_worker"],
        "ingress_mode": "event_consumer_and_internal_query_only",
        "allowed_downstream_family_refs": ["wf_data_stateful_plane", "wf_assurance_security_control"],
        "allowed_data_classification_refs": ["tenant_scoped_summary", "tenant_scoped_phi_minimum_necessary"],
        "tenant_context_mode": "tenant_scoped_projection_read",
        "tenant_isolation_mode": "tenant_partitioned_read_models",
        "assurance_trust_mode": "projection_freshness_and_release_watch_bound",
        "egress_allowlist_ref": "eal_projection_to_internal_planes_only",
        "service_identity_ref": "sid_projection_worker",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "declared",
        "split_rationale": "",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
            "docs/architecture/43_service_scaffold_map.md",
        ],
        "notes": "Projection is audience-safe derived truth only; it never upgrades canonical write authority.",
    },
    {
        "runtime_workload_family_ref": "wf_integration_dispatch",
        "family_code": "integration",
        "display_name": "Live integration dispatch and callbacks",
        "short_label": "Integration dispatch",
        "trust_zone_ref": "tz_integration_perimeter",
        "owned_bounded_context_refs": ["platform_integration", "communications", "booking", "pharmacy"],
        "served_bounded_context_refs": ["communications", "booking", "hub_coordination", "pharmacy"],
        "owned_service_refs": ["service_notification_worker", "svc_provider_callback_ingress"],
        "ingress_mode": "durable_queue_and_provider_callback_only",
        "allowed_downstream_family_refs": ["wf_data_stateful_plane", "wf_assurance_security_control"],
        "allowed_data_classification_refs": ["external_effect_descriptor", "masked_external_contact"],
        "tenant_context_mode": "effect_scope_and_supplier_correlation",
        "tenant_isolation_mode": "provider_attempt_and_tenant_tuple_partitioned",
        "assurance_trust_mode": "checkpoint_and_receipt_bound",
        "egress_allowlist_ref": "eal_declared_external_dependencies_only",
        "service_identity_ref": "sid_integration_dispatch",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "watch",
        "split_rationale": (
            "Split from simulator work because live-provider dispatch has materially different egress, "
            "approval, and receipt-settlement posture than the local proof twin backplane."
        ),
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
        "notes": "All live-provider motion stays in durable queues and declared effect contracts; direct browser or data-plane reach is forbidden.",
    },
    {
        "runtime_workload_family_ref": "wf_integration_simulation_lab",
        "family_code": "integration",
        "display_name": "Simulator and proof-twin backplane",
        "short_label": "Integration simulator",
        "trust_zone_ref": "tz_integration_perimeter",
        "owned_bounded_context_refs": ["platform_integration", "test_fixtures"],
        "served_bounded_context_refs": ["platform_runtime", "platform_integration", "test_fixtures"],
        "owned_service_refs": ["service_adapter_simulators"],
        "ingress_mode": "local_and_preview_internal_only",
        "allowed_downstream_family_refs": ["wf_command_orchestration", "wf_assurance_security_control"],
        "allowed_data_classification_refs": ["external_effect_descriptor", "operational_internal_non_phi"],
        "tenant_context_mode": "simulator_seed_and_named_test_tuple_only",
        "tenant_isolation_mode": "named_seed_partition_only",
        "assurance_trust_mode": "proof_twin_non_authoritative",
        "egress_allowlist_ref": "eal_integration_simulator_internal_only",
        "service_identity_ref": "sid_adapter_simulators",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration"],
        "defect_state": "watch",
        "split_rationale": (
            "Non-authoritative simulator seams stay out of preprod and production because proof-twin behavior must never be misread as live provider confirmation."
        ),
        "source_refs": [
            "docs/external/38_local_adapter_simulator_backlog.md",
            "services/adapter-simulators/manifests/README.md",
        ],
        "notes": "The simulator backplane is allowed only in nonprod rings and only as a declared proof twin or fallback seam.",
    },
    {
        "runtime_workload_family_ref": "wf_data_stateful_plane",
        "family_code": "data",
        "display_name": "Stateful stores, queues, and caches",
        "short_label": "Data plane",
        "trust_zone_ref": "tz_stateful_data",
        "owned_bounded_context_refs": ["platform_runtime", "analytics_assurance", "audit_compliance"],
        "served_bounded_context_refs": ["platform_runtime", "platform_integration", "analytics_assurance", "audit_compliance"],
        "owned_service_refs": [
            "store_relational_fhir",
            "store_projection_read",
            "store_object_artifact",
            "store_append_only_audit",
            "store_cache",
            "queue_runtime_bus",
        ],
        "ingress_mode": "internal_service_identity_only",
        "allowed_downstream_family_refs": [],
        "allowed_data_classification_refs": [
            "tenant_scoped_phi_minimum_necessary",
            "tenant_scoped_summary",
            "append_only_control_evidence",
        ],
        "tenant_context_mode": "tenant_tuple_on_every_key_or_record",
        "tenant_isolation_mode": "tenant_tuple_enforced_storage_partition",
        "assurance_trust_mode": "restore_proof_before_live_authority",
        "egress_allowlist_ref": "eal_data_internal_only",
        "service_identity_ref": "sid_data_plane",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "declared",
        "split_rationale": "",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
        "notes": "Relational, queue, object, cache, and audit stores are explicit runtime concerns with restore law, not hidden infrastructure folklore.",
    },
    {
        "runtime_workload_family_ref": "wf_assurance_security_control",
        "family_code": "assurance_security",
        "display_name": "Assurance, security, and release controls",
        "short_label": "Assurance",
        "trust_zone_ref": "tz_assurance_security",
        "owned_bounded_context_refs": [
            "analytics_assurance",
            "audit_compliance",
            "release_control",
            "operations",
            "governance_admin",
            "analysis_validation",
        ],
        "served_bounded_context_refs": [
            "support",
            "operations",
            "governance_admin",
            "analytics_assurance",
            "audit_compliance",
            "release_control",
            "analysis_validation",
        ],
        "owned_service_refs": [
            "svc_assurance_supervisor",
            "svc_runtime_contract_publisher",
            "svc_release_watch_publisher",
            "svc_kms_envelope_policy",
        ],
        "ingress_mode": "internal_control_surface_only",
        "allowed_downstream_family_refs": ["wf_data_stateful_plane"],
        "allowed_data_classification_refs": ["append_only_control_evidence", "tenant_scoped_summary"],
        "tenant_context_mode": "explicit_scope_tuple_or_platform_blast_radius",
        "tenant_isolation_mode": "scope_tuple_and_blast_radius_declared",
        "assurance_trust_mode": "authoritative_assurance_slice_publication",
        "egress_allowlist_ref": "eal_assurance_to_internal_planes_only",
        "service_identity_ref": "sid_assurance_control",
        "browser_reachable": "no",
        "ring_availability": ["local", "ci-preview", "integration", "preprod", "production"],
        "defect_state": "watch",
        "split_rationale": "",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
            "blueprint/phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme",
        ],
        "notes": "Assurance, security, governance, operations, and release consume one exact tuple-publishing control plane.",
    },
]

INGRESS_CATALOG = [
    {
        "ingress_ref": "ing_browser_tls",
        "display_name": "Browser TLS ingress",
        "family_ref": "wf_public_edge_ingress",
        "notes": "The public edge terminates browser TLS and performs origin, rate-limit, and bot policy checks.",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "ingress_ref": "ing_runtime_publication_bundle",
        "display_name": "Runtime publication bundle",
        "family_ref": "wf_shell_delivery_static_publication",
        "notes": "Static shell delivery reads only from the promoted RuntimePublicationBundle and exact design/runtime parity artifacts.",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
        ],
    },
    {
        "ingress_ref": "ing_published_gateway_surface",
        "display_name": "Published gateway surface ingress",
        "family_ref": "wf_shell_delivery_published_gateway",
        "notes": "Published gateway surfaces are the only browser-addressable compute bridge beyond the edge.",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "ingress_ref": "ing_provider_callback",
        "display_name": "Provider callback ingress",
        "family_ref": "wf_integration_dispatch",
        "notes": "Provider callbacks enter only through durable callback and correlation seams in the integration perimeter.",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
    },
]

DATA_STORE_CATALOG = [
    {
        "data_store_ref": "ds_relational_fhir",
        "display_name": "FHIR-capable relational store",
        "store_class": "relational",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "data_store_ref": "ds_projection_read_store",
        "display_name": "Projection read store",
        "store_class": "read_model",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "docs/architecture/13_backend_runtime_service_baseline.md#Runtime Executables",
        ],
    },
    {
        "data_store_ref": "ds_object_artifact_store",
        "display_name": "Object and artifact storage",
        "store_class": "object",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
        ],
    },
    {
        "data_store_ref": "ds_append_only_audit_store",
        "display_name": "Append-only audit ledger",
        "store_class": "append_only",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/phase-9-the-assurance-ledger.md#9A. Append-only assurance spine",
        ],
    },
    {
        "data_store_ref": "ds_tenant_tuple_cache",
        "display_name": "Tenant tuple cache",
        "store_class": "cache",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Trust Zones",
        ],
    },
]

QUEUE_CATALOG = [
    {
        "queue_ref": "q_command_outbox",
        "display_name": "Command outbox and pending effects",
        "family_ref": "wf_data_stateful_plane",
        "consumed_by_family_refs": ["wf_projection_read_models", "wf_integration_dispatch", "wf_integration_simulation_lab"],
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "docs/architecture/43_service_scaffold_map.md",
        ],
    },
    {
        "queue_ref": "q_projection_rebuild",
        "display_name": "Projection rebuild and backfill",
        "family_ref": "wf_data_stateful_plane",
        "consumed_by_family_refs": ["wf_projection_read_models"],
        "source_refs": [
            "docs/architecture/43_service_scaffold_map.md",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "queue_ref": "q_notification_dispatch",
        "display_name": "Notification dispatch and resend",
        "family_ref": "wf_data_stateful_plane",
        "consumed_by_family_refs": ["wf_integration_dispatch"],
        "source_refs": [
            "docs/architecture/43_service_scaffold_map.md",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
    },
    {
        "queue_ref": "q_provider_callback",
        "display_name": "Provider callback checkpoint",
        "family_ref": "wf_data_stateful_plane",
        "consumed_by_family_refs": ["wf_integration_dispatch", "wf_command_orchestration"],
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
    },
]

EGRESS_ALLOWLISTS = [
    {
        "egress_allowlist_ref": "eal_public_edge_internal_only",
        "display_name": "Public edge internal-only egress",
        "family_refs": ["wf_public_edge_ingress"],
        "allowed_targets": ["wf_shell_delivery_static_publication", "wf_shell_delivery_published_gateway"],
        "blocked_targets": ["wf_command_orchestration", "wf_projection_read_models", "wf_integration_dispatch", "wf_data_stateful_plane"],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Non-negotiable Rules",
            "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
        ],
    },
    {
        "egress_allowlist_ref": "eal_shell_publication_none",
        "display_name": "Shell publication no-runtime-egress",
        "family_refs": ["wf_shell_delivery_static_publication"],
        "allowed_targets": [],
        "blocked_targets": ["wf_command_orchestration", "wf_projection_read_models", "wf_integration_dispatch", "wf_data_stateful_plane"],
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
        ],
    },
    {
        "egress_allowlist_ref": "eal_gateway_internal_only",
        "display_name": "Gateway internal-only egress",
        "family_refs": ["wf_shell_delivery_published_gateway"],
        "allowed_targets": ["wf_command_orchestration", "wf_projection_read_models", "wf_assurance_security_control"],
        "blocked_targets": ["wf_integration_dispatch", "wf_integration_simulation_lab", "wf_data_stateful_plane"],
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "egress_allowlist_ref": "eal_command_to_internal_planes_only",
        "display_name": "Command to internal planes only",
        "family_refs": ["wf_command_orchestration"],
        "allowed_targets": ["wf_data_stateful_plane", "wf_integration_dispatch", "wf_integration_simulation_lab", "wf_assurance_security_control"],
        "blocked_targets": ["public_internet", "browser", "wf_public_edge_ingress"],
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
    },
    {
        "egress_allowlist_ref": "eal_projection_to_internal_planes_only",
        "display_name": "Projection to internal planes only",
        "family_refs": ["wf_projection_read_models"],
        "allowed_targets": ["wf_data_stateful_plane", "wf_assurance_security_control"],
        "blocked_targets": ["public_internet", "wf_integration_dispatch", "browser"],
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
    },
    {
        "egress_allowlist_ref": "eal_declared_external_dependencies_only",
        "display_name": "Declared external dependencies only",
        "family_refs": ["wf_integration_dispatch"],
        "allowed_targets": ["provider_dependencies_named_in_manifest", "wf_data_stateful_plane", "wf_assurance_security_control"],
        "blocked_targets": ["undeclared_provider_endpoints", "browser", "wf_public_edge_ingress"],
        "source_refs": [
            "docs/external/39_browser_automation_retry_policy.md",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
    },
    {
        "egress_allowlist_ref": "eal_integration_simulator_internal_only",
        "display_name": "Simulator internal-only egress",
        "family_refs": ["wf_integration_simulation_lab"],
        "allowed_targets": ["wf_command_orchestration", "wf_assurance_security_control"],
        "blocked_targets": ["live_provider_endpoints", "wf_data_stateful_plane", "browser"],
        "source_refs": [
            "services/adapter-simulators/manifests/README.md",
            "docs/external/38_local_adapter_simulator_backlog.md",
        ],
    },
    {
        "egress_allowlist_ref": "eal_data_internal_only",
        "display_name": "Data plane internal-only egress",
        "family_refs": ["wf_data_stateful_plane"],
        "allowed_targets": [],
        "blocked_targets": ["browser", "public_internet", "provider_endpoints"],
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Non-negotiable Rules",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "egress_allowlist_ref": "eal_assurance_to_internal_planes_only",
        "display_name": "Assurance to internal planes only",
        "family_refs": ["wf_assurance_security_control"],
        "allowed_targets": ["wf_data_stateful_plane"],
        "blocked_targets": ["browser", "provider_endpoints", "wf_public_edge_ingress"],
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
            "blueprint/phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme",
        ],
    },
]

ASSURANCE_SLICES = [
    {
        "assurance_slice_ref": "asr_runtime_topology_tuple",
        "display_name": "Runtime topology tuple",
        "notes": "The exact topology tuple governs whether a ring may widen or fail over.",
    },
    {
        "assurance_slice_ref": "asr_release_watch_tuple",
        "display_name": "Release watch tuple",
        "notes": "Release, operational readiness, and runtime publication must stay on one watch tuple.",
    },
    {
        "assurance_slice_ref": "asr_restore_readiness",
        "display_name": "Restore readiness",
        "notes": "Restore and failover activation require current rehearsal and store parity proof.",
    },
]

BLOCKED_CROSSINGS = [
    {
        "crossing_id": "block_public_edge_to_command",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_command_orchestration",
        "reason": "Browser or edge traffic may not bypass published gateway surfaces into command.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
        ],
    },
    {
        "crossing_id": "block_public_edge_to_projection",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_projection_read_models",
        "reason": "Projection reads remain behind declared gateway surfaces; the edge does not query projections directly.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
        ],
    },
    {
        "crossing_id": "block_public_edge_to_integration",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_integration_dispatch",
        "reason": "Edge traffic may not reach provider or callback runtimes directly.",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Non-negotiable Rules",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "crossing_id": "block_public_edge_to_data",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_data_stateful_plane",
        "reason": "No browser- or edge-reachable service may access raw stores directly.",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Non-negotiable Rules",
            "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
        ],
    },
    {
        "crossing_id": "block_shell_publication_to_command",
        "source_family_ref": "wf_shell_delivery_static_publication",
        "target_family_ref": "wf_command_orchestration",
        "reason": "Static publication delivery cannot become a shadow mutation plane.",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
        ],
    },
    {
        "crossing_id": "block_shell_publication_to_projection",
        "source_family_ref": "wf_shell_delivery_static_publication",
        "target_family_ref": "wf_projection_read_models",
        "reason": "Shell assets are bundle-bound and may not query projections directly.",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
        ],
    },
    {
        "crossing_id": "block_gateway_to_data",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_data_stateful_plane",
        "reason": "Gateway surfaces may not bypass command or projection and may never reach raw stores.",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "crossing_id": "block_gateway_to_live_integration",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_integration_dispatch",
        "reason": "Gateway surfaces may not dispatch directly to providers or callback runtimes.",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "crossing_id": "block_gateway_to_simulator",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_integration_simulation_lab",
        "reason": "Simulators are internal proof twins only and are never browser-addressable.",
        "source_refs": [
            "services/adapter-simulators/manifests/README.md",
            "docs/external/38_local_adapter_simulator_backlog.md",
        ],
    },
    {
        "crossing_id": "block_browser_to_assurance_without_gateway",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_assurance_security_control",
        "reason": "Operational, support, and governance browser access reaches assurance slices only through published gateway surfaces.",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary",
        ],
    },
]

TOPOLOGY_DEFECTS = [
    {
        "defect_id": "WATCH_046_GATEWAY_SPLIT_FINALISATION_PENDING",
        "state": "watch",
        "severity": "medium",
        "title": "Published gateway surfaces still use placeholder bridge rows until seq_047 lands exact splits.",
        "summary": "Seq_046 freezes the gateway family and browser bridge law now, but route-family ownership and final gateway split logic remain a seq_047 deliverable.",
        "affected_family_refs": ["wf_shell_delivery_published_gateway"],
        "source_refs": ["prompt/046.md", "prompt/047.md"],
    },
    {
        "defect_id": "WATCH_046_RELEASE_FREEZE_LINKS_PENDING",
        "state": "watch",
        "severity": "medium",
        "title": "ReleaseApprovalFreeze and channel-manifest bindings remain typed placeholders.",
        "summary": "Every environment manifest now carries explicit release and channel placeholder refs, but seq_050 will bind them to the frontend and publication tuples.",
        "affected_family_refs": ["wf_shell_delivery_static_publication", "wf_assurance_security_control"],
        "source_refs": ["prompt/046.md", "prompt/050.md"],
    },
    {
        "defect_id": "WATCH_046_LIVE_PROVIDER_EGRESS_PLACEHOLDER_SET",
        "state": "watch",
        "severity": "medium",
        "title": "Integration egress allowlists are explicit but still provider-neutral at the hostname or CIDR level.",
        "summary": "Seq_046 freezes which families may egress and under what approval law, while later onboarding work supplies provider-specific endpoint inventories.",
        "affected_family_refs": ["wf_integration_dispatch"],
        "source_refs": ["prompt/046.md", "docs/external/39_browser_automation_retry_policy.md"],
    },
]

EDGE_SEEDS = [
    {
        "edge_key": "public_edge_to_shell_publication",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_shell_delivery_static_publication",
        "trust_zone_boundary_ref": "tzb_public_edge_to_shell_delivery",
        "bridge_mode": "static_publication_bundle",
        "gateway_surface_scope": "none",
        "protocol_refs": ["https"],
        "tenant_transfer_mode": "tenant_hint_only",
        "assurance_trust_transfer_mode": "publication_parity_only",
        "data_class_ceiling_refs": ["public_safe"],
        "failure_mode": "static_placeholder_or_cached_shell_only",
        "condition": "all",
        "source_refs": [
            "docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
    },
    {
        "edge_key": "public_edge_to_published_gateway",
        "source_family_ref": "wf_public_edge_ingress",
        "target_family_ref": "wf_shell_delivery_published_gateway",
        "trust_zone_boundary_ref": "tzb_public_edge_to_published_gateway",
        "bridge_mode": "published_gateway_surface_placeholder",
        "gateway_surface_scope": "all_published_gateway_surfaces",
        "protocol_refs": ["https", "sse", "websocket"],
        "tenant_transfer_mode": "runtime_binding_and_session_policy_only",
        "assurance_trust_transfer_mode": "published_surface_tuple_only",
        "data_class_ceiling_refs": ["tenant_scoped_summary"],
        "failure_mode": "same_shell_recovery_or_blocked",
        "condition": "all",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law",
        ],
    },
    {
        "edge_key": "gateway_to_projection",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_projection_read_models",
        "trust_zone_boundary_ref": "tzb_published_gateway_to_application_core",
        "bridge_mode": "published_gateway_surface_placeholder",
        "gateway_surface_scope": "read_and_summary_surfaces",
        "protocol_refs": ["https", "grpc"],
        "tenant_transfer_mode": "tenant_tuple_and_route_intent_preserved",
        "assurance_trust_transfer_mode": "surface_authority_tuple_preserved",
        "data_class_ceiling_refs": ["tenant_scoped_summary", "tenant_scoped_phi_minimum_necessary"],
        "failure_mode": "projection_recovery_only",
        "condition": "all",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "edge_key": "gateway_to_command",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_command_orchestration",
        "trust_zone_boundary_ref": "tzb_published_gateway_to_application_core",
        "bridge_mode": "published_gateway_surface_placeholder",
        "gateway_surface_scope": "mutating_surfaces_only",
        "protocol_refs": ["https", "grpc"],
        "tenant_transfer_mode": "tenant_tuple_and_route_intent_preserved",
        "assurance_trust_transfer_mode": "surface_authority_tuple_preserved",
        "data_class_ceiling_refs": ["tenant_scoped_phi_minimum_necessary"],
        "failure_mode": "command_halt_or_named_review",
        "condition": "all",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "edge_key": "gateway_to_assurance",
        "source_family_ref": "wf_shell_delivery_published_gateway",
        "target_family_ref": "wf_assurance_security_control",
        "trust_zone_boundary_ref": "tzb_published_gateway_to_assurance_security",
        "bridge_mode": "published_gateway_surface_placeholder",
        "gateway_surface_scope": "support_ops_governance_surfaces",
        "protocol_refs": ["https", "grpc"],
        "tenant_transfer_mode": "explicit_scope_tuple_or_platform_scope_only",
        "assurance_trust_transfer_mode": "assurance_slice_tuple_only",
        "data_class_ceiling_refs": ["masked_support_excerpt", "append_only_control_evidence"],
        "failure_mode": "controls_frozen_same_shell_context_preserved",
        "condition": "all",
        "source_refs": [
            "docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Gateway Surface Matrix",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "edge_key": "command_to_data",
        "source_family_ref": "wf_command_orchestration",
        "target_family_ref": "wf_data_stateful_plane",
        "trust_zone_boundary_ref": "tzb_application_core_to_stateful_data",
        "bridge_mode": "service_identity_direct",
        "gateway_surface_scope": "none",
        "protocol_refs": ["sql_tls", "object_api_tls", "queue_tls", "cache_tls"],
        "tenant_transfer_mode": "tenant_tuple_on_every_key_or_record",
        "assurance_trust_transfer_mode": "restore_tuple_required",
        "data_class_ceiling_refs": ["tenant_scoped_phi_minimum_necessary", "tenant_scoped_summary"],
        "failure_mode": "read_only_or_blocked_until_restore_proof",
        "condition": "all",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
    },
    {
        "edge_key": "command_to_integration_dispatch",
        "source_family_ref": "wf_command_orchestration",
        "target_family_ref": "wf_integration_dispatch",
        "trust_zone_boundary_ref": "tzb_application_core_to_integration_perimeter",
        "bridge_mode": "outbox_and_durable_queue",
        "gateway_surface_scope": "none",
        "protocol_refs": ["queue_dispatch", "outbox_checkpoint"],
        "tenant_transfer_mode": "effect_scope_and_tenant_tuple_preserved",
        "assurance_trust_transfer_mode": "checkpoint_receipt_required",
        "data_class_ceiling_refs": ["external_effect_descriptor"],
        "failure_mode": "integration_queue_only",
        "condition": "all",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
    },
    {
        "edge_key": "command_to_integration_simulator",
        "source_family_ref": "wf_command_orchestration",
        "target_family_ref": "wf_integration_simulation_lab",
        "trust_zone_boundary_ref": "tzb_application_core_to_integration_perimeter",
        "bridge_mode": "proof_twin_dispatch",
        "gateway_surface_scope": "none",
        "protocol_refs": ["queue_dispatch", "outbox_checkpoint"],
        "tenant_transfer_mode": "named_test_tuple_only",
        "assurance_trust_transfer_mode": "checkpoint_receipt_required",
        "data_class_ceiling_refs": ["external_effect_descriptor"],
        "failure_mode": "simulator_only_no_live_confirmation",
        "condition": "nonprod_only",
        "source_refs": [
            "services/adapter-simulators/manifests/README.md",
            "docs/external/38_local_adapter_simulator_backlog.md",
        ],
    },
    {
        "edge_key": "command_to_assurance",
        "source_family_ref": "wf_command_orchestration",
        "target_family_ref": "wf_assurance_security_control",
        "trust_zone_boundary_ref": "tzb_application_core_to_assurance_security",
        "bridge_mode": "audit_and_gate_publish",
        "gateway_surface_scope": "none",
        "protocol_refs": ["grpc", "https", "audit_append"],
        "tenant_transfer_mode": "tenant_tuple_plus_scope_hash_required",
        "assurance_trust_transfer_mode": "assurance_slice_verdict_required",
        "data_class_ceiling_refs": ["append_only_control_evidence"],
        "failure_mode": "writable_freeze_same_shell_context_preserved",
        "condition": "all",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "edge_key": "projection_to_data",
        "source_family_ref": "wf_projection_read_models",
        "target_family_ref": "wf_data_stateful_plane",
        "trust_zone_boundary_ref": "tzb_application_core_to_stateful_data",
        "bridge_mode": "read_model_storage",
        "gateway_surface_scope": "none",
        "protocol_refs": ["sql_tls", "object_api_tls", "cache_tls"],
        "tenant_transfer_mode": "tenant_tuple_on_every_key_or_record",
        "assurance_trust_transfer_mode": "restore_tuple_required",
        "data_class_ceiling_refs": ["tenant_scoped_summary"],
        "failure_mode": "projection_stale_or_summary_only",
        "condition": "all",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimeWorkloadFamily",
        ],
    },
    {
        "edge_key": "projection_to_assurance",
        "source_family_ref": "wf_projection_read_models",
        "target_family_ref": "wf_assurance_security_control",
        "trust_zone_boundary_ref": "tzb_application_core_to_assurance_security",
        "bridge_mode": "freshness_and_watch_publish",
        "gateway_surface_scope": "none",
        "protocol_refs": ["grpc", "https"],
        "tenant_transfer_mode": "tenant_tuple_plus_scope_hash_required",
        "assurance_trust_transfer_mode": "assurance_slice_verdict_required",
        "data_class_ceiling_refs": ["tenant_scoped_summary"],
        "failure_mode": "projection_visible_controls_frozen",
        "condition": "all",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
            "blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract",
        ],
    },
    {
        "edge_key": "integration_dispatch_to_data",
        "source_family_ref": "wf_integration_dispatch",
        "target_family_ref": "wf_data_stateful_plane",
        "trust_zone_boundary_ref": "tzb_integration_perimeter_to_stateful_data",
        "bridge_mode": "receipt_checkpoint_append",
        "gateway_surface_scope": "none",
        "protocol_refs": ["queue_tls", "sql_tls", "object_api_tls"],
        "tenant_transfer_mode": "effect_scope_and_supplier_correlation_only",
        "assurance_trust_transfer_mode": "receipt_or_checkpoint_required",
        "data_class_ceiling_refs": ["external_effect_descriptor", "append_only_control_evidence"],
        "failure_mode": "checkpoint_and_retry_or_dispute",
        "condition": "all",
        "source_refs": [
            "docs/architecture/13_backend_runtime_service_baseline.md#Baseline Law",
            "docs/external/39_browser_automation_retry_policy.md",
        ],
    },
    {
        "edge_key": "integration_dispatch_to_assurance",
        "source_family_ref": "wf_integration_dispatch",
        "target_family_ref": "wf_assurance_security_control",
        "trust_zone_boundary_ref": "tzb_integration_perimeter_to_assurance_security",
        "bridge_mode": "dependency_and_receipt_evidence_publish",
        "gateway_surface_scope": "none",
        "protocol_refs": ["audit_append", "https"],
        "tenant_transfer_mode": "tenant_tuple_plus_dependency_code_only",
        "assurance_trust_transfer_mode": "dependency_slice_verdict_required",
        "data_class_ceiling_refs": ["append_only_control_evidence"],
        "failure_mode": "slice_degraded_or_queue_only",
        "condition": "all",
        "source_refs": [
            "docs/external/39_browser_automation_retry_policy.md",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Pipeline Stage Chain",
        ],
    },
    {
        "edge_key": "integration_simulator_to_command",
        "source_family_ref": "wf_integration_simulation_lab",
        "target_family_ref": "wf_command_orchestration",
        "trust_zone_boundary_ref": "tzb_application_core_to_integration_perimeter",
        "bridge_mode": "proof_twin_callback",
        "gateway_surface_scope": "none",
        "protocol_refs": ["queue_dispatch", "https"],
        "tenant_transfer_mode": "named_test_tuple_only",
        "assurance_trust_transfer_mode": "checkpoint_receipt_required",
        "data_class_ceiling_refs": ["external_effect_descriptor"],
        "failure_mode": "non_authoritative_callback_only",
        "condition": "nonprod_only",
        "source_refs": [
            "services/adapter-simulators/manifests/README.md",
            "docs/external/38_local_adapter_simulator_backlog.md",
        ],
    },
    {
        "edge_key": "integration_simulator_to_assurance",
        "source_family_ref": "wf_integration_simulation_lab",
        "target_family_ref": "wf_assurance_security_control",
        "trust_zone_boundary_ref": "tzb_integration_perimeter_to_assurance_security",
        "bridge_mode": "proof_twin_evidence_publish",
        "gateway_surface_scope": "none",
        "protocol_refs": ["audit_append", "https"],
        "tenant_transfer_mode": "named_test_tuple_only",
        "assurance_trust_transfer_mode": "dependency_slice_verdict_required",
        "data_class_ceiling_refs": ["append_only_control_evidence"],
        "failure_mode": "simulator_evidence_only",
        "condition": "nonprod_only",
        "source_refs": [
            "services/adapter-simulators/manifests/README.md",
            "docs/external/38_local_adapter_simulator_backlog.md",
        ],
    },
    {
        "edge_key": "assurance_to_data",
        "source_family_ref": "wf_assurance_security_control",
        "target_family_ref": "wf_data_stateful_plane",
        "trust_zone_boundary_ref": "tzb_assurance_security_to_stateful_data",
        "bridge_mode": "tuple_and_restore_publish",
        "gateway_surface_scope": "none",
        "protocol_refs": ["sql_tls", "object_api_tls", "append_only_api"],
        "tenant_transfer_mode": "platform_control_with_explicit_tenant_projection_only",
        "assurance_trust_transfer_mode": "restore_tuple_required",
        "data_class_ceiling_refs": ["append_only_control_evidence", "tenant_scoped_summary"],
        "failure_mode": "controls_frozen_or_restore_only",
        "condition": "all",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
            "blueprint/phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme",
        ],
    },
]

CONTEXT_RUNTIME_HOME_BLUEPRINTS = [
    {
        "context_code": "patient_experience",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_projection_read_models",
        "effect_workload_family_refs": ["wf_command_orchestration"],
    },
    {
        "context_code": "triage_workspace",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_assurance_security_control"],
    },
    {
        "context_code": "hub_coordination",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_integration_dispatch"],
    },
    {
        "context_code": "pharmacy",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_integration_dispatch"],
    },
    {
        "context_code": "support",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
    },
    {
        "context_code": "operations",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_command_orchestration"],
    },
    {
        "context_code": "governance_admin",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
    },
    {
        "context_code": "intake_safety",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models"],
    },
    {
        "context_code": "identity_access",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_assurance_security_control"],
    },
    {
        "context_code": "booking",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_integration_dispatch"],
    },
    {
        "context_code": "communications",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_integration_dispatch",
        "effect_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models"],
    },
    {
        "context_code": "analytics_assurance",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_data_stateful_plane"],
    },
    {
        "context_code": "audit_compliance",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_data_stateful_plane"],
    },
    {
        "context_code": "release_control",
        "shell_workload_family_ref": "wf_shell_delivery_static_publication",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_public_edge_ingress"],
    },
    {
        "context_code": "platform_runtime",
        "shell_workload_family_ref": "wf_public_edge_ingress",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models", "wf_data_stateful_plane"],
    },
    {
        "context_code": "platform_integration",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_integration_dispatch",
        "effect_workload_family_refs": ["wf_integration_simulation_lab"],
    },
    {
        "context_code": "shared_domain_kernel",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_command_orchestration",
        "effect_workload_family_refs": ["wf_projection_read_models"],
    },
    {
        "context_code": "shared_contracts",
        "shell_workload_family_ref": "wf_shell_delivery_static_publication",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_command_orchestration", "wf_projection_read_models", "wf_integration_dispatch"],
    },
    {
        "context_code": "design_system",
        "shell_workload_family_ref": "wf_shell_delivery_static_publication",
        "static_publication_family_ref": "wf_shell_delivery_static_publication",
        "primary_authority_workload_family_ref": "wf_shell_delivery_static_publication",
        "effect_workload_family_refs": [],
    },
    {
        "context_code": "test_fixtures",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_integration_simulation_lab",
        "effect_workload_family_refs": ["wf_projection_read_models"],
    },
    {
        "context_code": "analysis_validation",
        "shell_workload_family_ref": None,
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_shell_delivery_static_publication"],
    },
    {
        "context_code": "assistive_lab",
        "shell_workload_family_ref": "wf_shell_delivery_published_gateway",
        "static_publication_family_ref": None,
        "primary_authority_workload_family_ref": "wf_assurance_security_control",
        "effect_workload_family_refs": ["wf_command_orchestration"],
    },
]


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
        for row in rows:
            normalized: dict[str, Any] = {}
            for field in fieldnames:
                value = row.get(field, "")
                if isinstance(value, list):
                    normalized[field] = "; ".join(str(item) for item in value)
                else:
                    normalized[field] = value
            writer.writerow(normalized)


def sha256_snippet(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def environment_slug(value: str) -> str:
    return value.replace("-", "_")


def build_service_bindings(
    repo_topology: dict[str, Any],
    service_manifest: dict[str, Any],
) -> list[dict[str, Any]]:
    repo_services = {
        artifact["artifact_id"]: artifact
        for artifact in repo_topology["artifacts"]
        if artifact["artifact_type"] == "service"
    }
    interface_services = {service["artifact_id"]: service for service in service_manifest["services"]}
    manual_bindings = [
        (
            "service_api_gateway",
            "wf_shell_delivery_published_gateway",
            ["docs/architecture/43_service_scaffold_map.md", "prompt/046.md"],
        ),
        (
            "service_command_api",
            "wf_command_orchestration",
            ["docs/architecture/43_service_scaffold_map.md", "prompt/046.md"],
        ),
        (
            "service_projection_worker",
            "wf_projection_read_models",
            ["docs/architecture/43_service_scaffold_map.md", "prompt/046.md"],
        ),
        (
            "service_notification_worker",
            "wf_integration_dispatch",
            ["docs/architecture/43_service_scaffold_map.md", "prompt/046.md"],
        ),
        (
            "service_adapter_simulators",
            "wf_integration_simulation_lab",
            ["services/adapter-simulators/manifests/README.md", "prompt/046.md"],
        ),
    ]
    bindings: list[dict[str, Any]] = []
    for artifact_id, family_ref, source_refs in manual_bindings:
        artifact = repo_services[artifact_id]
        interface_row = interface_services.get(artifact_id)
        bindings.append(
            {
                "artifact_id": artifact_id,
                "display_name": artifact["display_name"],
                "repo_path": artifact["repo_path"],
                "owner_context_code": artifact["owner_context_code"],
                "runtime_workload_family_ref": family_ref,
                "family_code": next(
                    family["family_code"]
                    for family in WORKLOAD_FAMILY_CATALOG
                    if family["runtime_workload_family_ref"] == family_ref
                ),
                "service_identity_ref": next(
                    family["service_identity_ref"]
                    for family in WORKLOAD_FAMILY_CATALOG
                    if family["runtime_workload_family_ref"] == family_ref
                ),
                "route_ids": [route["route_id"] for route in interface_row["routes"]] if interface_row else [],
                "topic_publish_refs": interface_row["topics"]["publishes"] if interface_row else [],
                "topic_consume_refs": interface_row["topics"]["consumes"] if interface_row else [],
                "dependency_ids": [row["dependency_id"] for row in interface_row["dependency_profiles"]]
                if interface_row
                else [],
                "source_refs": source_refs,
            }
        )
    return bindings


def build_context_runtime_homes(owner_contexts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    label_map = {row["owner_context_code"]: row["owner_context_label"] for row in owner_contexts}
    homes: list[dict[str, Any]] = []
    for blueprint in CONTEXT_RUNTIME_HOME_BLUEPRINTS:
        homes.append(
            {
                "context_code": blueprint["context_code"],
                "context_label": label_map[blueprint["context_code"]],
                "shell_workload_family_ref": blueprint["shell_workload_family_ref"],
                "static_publication_family_ref": blueprint["static_publication_family_ref"],
                "primary_authority_workload_family_ref": blueprint["primary_authority_workload_family_ref"],
                "effect_workload_family_refs": blueprint["effect_workload_family_refs"],
                "source_refs": [
                    "docs/architecture/41_repository_topology_rules.md",
                    "prompt/046.md",
                    "blueprint/phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                ],
            }
        )
    return homes


def build_runtime_instances(
    gateway_surface_ids: list[str],
) -> list[dict[str, Any]]:
    instances: list[dict[str, Any]] = []
    for ring in RINGS:
        for region_role in ring["allowed_region_roles"]:
            region_meta = REGION_ROLE_META[region_role]
            for family in WORKLOAD_FAMILY_CATALOG:
                if ring["environment_ring"] not in family["ring_availability"]:
                    continue
                suffix = family["runtime_workload_family_ref"].removeprefix("wf_")
                instance_id = f"rwf_{environment_slug(ring['environment_ring'])}_{region_role}_{suffix}"
                downstream_refs = [
                    target
                    for target in family["allowed_downstream_family_refs"]
                    if ring["environment_ring"]
                    in next(
                        workload["ring_availability"]
                        for workload in WORKLOAD_FAMILY_CATALOG
                        if workload["runtime_workload_family_ref"] == target
                    )
                ]
                notes = family["notes"]
                if region_role == "secondary":
                    notes += " Secondary role remains warm and may not advertise live authority without restore proof."
                if ring["environment_ring"] in {"local", "ci-preview", "integration"} and family[
                    "runtime_workload_family_ref"
                ] == "wf_integration_simulation_lab":
                    notes += " This ring keeps the simulator family explicit so proof-twin behavior never becomes hidden."
                instances.append(
                    {
                        "runtime_workload_family_id": instance_id,
                        "runtime_workload_family_ref": family["runtime_workload_family_ref"],
                        "display_name": family["display_name"],
                        "family_code": family["family_code"],
                        "environment_ring": ring["environment_ring"],
                        "environment_label": ring["display_name"],
                        "uk_region_role": region_role,
                        "region_ref": region_meta["region_ref"],
                        "trust_zone_ref": family["trust_zone_ref"],
                        "owned_bounded_context_refs": family["owned_bounded_context_refs"],
                        "served_bounded_context_refs": family["served_bounded_context_refs"],
                        "owned_service_refs": family["owned_service_refs"],
                        "ingress_mode": family["ingress_mode"],
                        "allowed_downstream_family_refs": downstream_refs,
                        "allowed_data_classification_refs": family["allowed_data_classification_refs"],
                        "tenant_context_mode": family["tenant_context_mode"],
                        "tenant_isolation_mode": family["tenant_isolation_mode"],
                        "assurance_trust_mode": family["assurance_trust_mode"],
                        "egress_allowlist_ref": family["egress_allowlist_ref"],
                        "service_identity_ref": family["service_identity_ref"],
                        "browser_reachable": family["browser_reachable"],
                        "gateway_surface_refs": gateway_surface_ids
                        if family["runtime_workload_family_ref"] == "wf_shell_delivery_published_gateway"
                        else [],
                        "failure_domain_ref": f"fd_{environment_slug(ring['environment_ring'])}_{region_role}_{suffix}",
                        "declared_at": GENERATED_AT,
                        "defect_state": family["defect_state"],
                        "split_rationale": family["split_rationale"],
                        "source_refs": family["source_refs"] + ring["source_refs"],
                        "notes": notes,
                    }
                )
    return instances


def build_dependency_effect_budgets(
    service_bindings: list[dict[str, Any]],
    degraded_defaults: dict[str, Any],
) -> list[dict[str, Any]]:
    dependency_lookup = {
        row["dependency_id"]: row for row in degraded_defaults["dependencies"]
    }
    family_by_service = {
        row["artifact_id"]: row["runtime_workload_family_ref"] for row in service_bindings
    }
    budgets: list[dict[str, Any]] = []
    service_bindings_by_dependency: dict[str, list[dict[str, Any]]] = {}
    for row in service_bindings:
        for dependency_id in row["dependency_ids"]:
            service_bindings_by_dependency.setdefault(dependency_id, []).append(row)
    for dependency_id in sorted(service_bindings_by_dependency):
        dependency = dependency_lookup[dependency_id]
        services = service_bindings_by_dependency[dependency_id]
        affected_families = sorted({family_by_service[row["artifact_id"]] for row in services})
        blocked_spillover = sorted(
            family["runtime_workload_family_ref"]
            for family in WORKLOAD_FAMILY_CATALOG
            if family["runtime_workload_family_ref"] not in affected_families
        )
        budgets.append(
            {
                "dependency_id": dependency_id,
                "dependency_name": dependency["dependency_name"],
                "blocker_label": dependency["blocker_label"],
                "default_contract_axis": dependency["default_contract_axis"],
                "affected_workload_family_refs": affected_families,
                "blocked_spillover_family_refs": blocked_spillover,
                "service_bindings": [row["artifact_id"] for row in services],
                "degraded_mode_default": dependency["degraded_mode_default"],
                "manual_fallback_default": dependency["manual_fallback_default"],
                "source_refs": dependency["source_references"],
            }
        )
    return budgets


def build_failure_domains(
    runtime_instances: list[dict[str, Any]],
    dependency_effect_budgets: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    dependency_map: dict[str, list[str]] = {}
    for budget in dependency_effect_budgets:
        for family_ref in budget["affected_workload_family_refs"]:
            dependency_map.setdefault(family_ref, []).append(budget["dependency_id"])

    rows: list[dict[str, Any]] = []
    for instance in runtime_instances:
        user_posture = {
            "public_edge": "placeholder_only or blocked",
            "shell_delivery": "same-shell recovery or read-only",
            "command": "command_halt_or_named_review",
            "projection": "summary_only or projection_stale",
            "integration": "queue_only or receipt_review",
            "data": "restore_only",
            "assurance_security": "diagnostic_visible_controls_frozen",
        }[instance["family_code"]]
        rows.append(
            {
                "failure_domain_ref": instance["failure_domain_ref"],
                "runtime_workload_family_id": instance["runtime_workload_family_id"],
                "runtime_workload_family_ref": instance["runtime_workload_family_ref"],
                "environment_ring": instance["environment_ring"],
                "uk_region_role": instance["uk_region_role"],
                "trust_zone_ref": instance["trust_zone_ref"],
                "blast_radius_scope": f"{instance['family_code']}_single_{instance['uk_region_role']}_slice",
                "spillover_forbidden_to": [
                    family["runtime_workload_family_ref"]
                    for family in WORKLOAD_FAMILY_CATALOG
                    if family["runtime_workload_family_ref"] != instance["runtime_workload_family_ref"]
                ],
                "user_visible_posture": user_posture,
                "egress_allowlist_ref": instance["egress_allowlist_ref"],
                "dependency_scope_refs": dependency_map.get(instance["runtime_workload_family_ref"], []),
                "restore_prerequisite": (
                    "Runtime publication parity, restore proof, and exact assurance slices before live authority resumes."
                ),
                "source_refs": instance["source_refs"],
            }
        )
    return rows


def edge_applies_to_ring(seed: dict[str, Any], environment_ring: str) -> bool:
    if seed["condition"] == "all":
        return True
    return environment_ring in {"local", "ci-preview", "integration"}


def build_edges(runtime_instances: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_triplet = {
        (
            row["environment_ring"],
            row["uk_region_role"],
            row["runtime_workload_family_ref"],
        ): row
        for row in runtime_instances
    }
    edges: list[dict[str, Any]] = []
    for ring in RINGS:
        for region_role in ring["allowed_region_roles"]:
            for seed in EDGE_SEEDS:
                if not edge_applies_to_ring(seed, ring["environment_ring"]):
                    continue
                source = by_triplet.get((ring["environment_ring"], region_role, seed["source_family_ref"]))
                target = by_triplet.get((ring["environment_ring"], region_role, seed["target_family_ref"]))
                if source is None or target is None:
                    continue
                edge_id = f"rte_{environment_slug(ring['environment_ring'])}_{region_role}_{seed['edge_key']}"
                edges.append(
                    {
                        "edge_id": edge_id,
                        "environment_ring": ring["environment_ring"],
                        "uk_region_role": region_role,
                        "source_runtime_workload_family_id": source["runtime_workload_family_id"],
                        "target_runtime_workload_family_id": target["runtime_workload_family_id"],
                        "source_runtime_workload_family_ref": seed["source_family_ref"],
                        "target_runtime_workload_family_ref": seed["target_family_ref"],
                        "source_family_code": source["family_code"],
                        "target_family_code": target["family_code"],
                        "source_trust_zone_ref": source["trust_zone_ref"],
                        "target_trust_zone_ref": target["trust_zone_ref"],
                        "trust_zone_boundary_ref": seed["trust_zone_boundary_ref"],
                        "bridge_mode": seed["bridge_mode"],
                        "gateway_surface_scope": seed["gateway_surface_scope"],
                        "protocol_refs": seed["protocol_refs"],
                        "tenant_transfer_mode": seed["tenant_transfer_mode"],
                        "assurance_trust_transfer_mode": seed["assurance_trust_transfer_mode"],
                        "data_class_ceiling_refs": seed["data_class_ceiling_refs"],
                        "egress_allowlist_ref": source["egress_allowlist_ref"],
                        "failure_mode": seed["failure_mode"],
                        "edge_state": "allowed",
                        "source_refs": seed["source_refs"],
                    }
                )
    return edges


def build_environment_manifests(
    runtime_instances: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    gateway_surface_ids: list[str],
) -> list[dict[str, Any]]:
    manifests: list[dict[str, Any]] = []
    for ring in RINGS:
        instances = [row for row in runtime_instances if row["environment_ring"] == ring["environment_ring"]]
        ring_edges = [row for row in edges if row["environment_ring"] == ring["environment_ring"]]
        tenant_modes = sorted({row["tenant_isolation_mode"] for row in instances})
        egress_refs = sorted({row["egress_allowlist_ref"] for row in instances})
        service_identity_refs = sorted({row["service_identity_ref"] for row in instances})
        trust_zone_boundary_refs = sorted({row["trust_zone_boundary_ref"] for row in ring_edges})
        environment_payload = {
            "environment_ring": ring["environment_ring"],
            "display_name": ring["display_name"],
            "runtime_workload_family_ids": [row["runtime_workload_family_id"] for row in instances],
            "trust_zone_boundary_refs": trust_zone_boundary_refs,
            "gateway_surface_refs": gateway_surface_ids,
            "service_identity_refs": service_identity_refs,
            "tenant_isolation_modes": tenant_modes,
            "egress_allowlist_refs": egress_refs,
        }
        tuple_hash = sha256_snippet(environment_payload)
        manifests.append(
            {
                "environment_ring": ring["environment_ring"],
                "display_name": ring["display_name"],
                "allowed_region_roles": ring["allowed_region_roles"],
                "default_write_region_ref": ring["default_write_region_ref"],
                "runtime_workload_family_ids": [row["runtime_workload_family_id"] for row in instances],
                "runtime_workload_family_refs": [row["runtime_workload_family_ref"] for row in instances],
                "trust_zone_boundary_refs": trust_zone_boundary_refs,
                "gateway_surface_refs": gateway_surface_ids,
                "ingress_refs": [row["ingress_ref"] for row in INGRESS_CATALOG],
                "service_identity_refs": service_identity_refs,
                "data_store_refs": [row["data_store_ref"] for row in DATA_STORE_CATALOG],
                "queue_refs": [row["queue_ref"] for row in QUEUE_CATALOG],
                "egress_allowlist_refs": egress_refs,
                "tenant_isolation_modes": tenant_modes,
                "release_approval_freeze_ref": f"raf_{environment_slug(ring['environment_ring'])}_placeholder",
                "channel_manifest_set_ref": f"cms_{environment_slug(ring['environment_ring'])}_placeholder",
                "minimum_bridge_capability_set_ref": f"mbcs_{environment_slug(ring['environment_ring'])}_published_gateway",
                "required_assurance_slice_refs": [row["assurance_slice_ref"] for row in ASSURANCE_SLICES],
                "topology_tuple_hash": tuple_hash,
                "publication_state": ring["publication_state"],
                "approved_at": GENERATED_AT if ring["approval_state"] == "approved_internal" else None,
                "pending_publication_at": GENERATED_AT
                if ring["approval_state"] == "pending_runtime_publication_bundle"
                else None,
                "source_refs": ring["source_refs"],
                "notes": (
                    "This ring manifest freezes the runtime family set, legal trust-zone crossings, "
                    "and release/publication placeholders required for later tasks."
                ),
            }
        )
    return manifests


def build_runtime_manifest_payload(
    repo_topology: dict[str, Any],
    owner_context_homes: list[dict[str, Any]],
    service_bindings: list[dict[str, Any]],
    dependency_effect_budgets: list[dict[str, Any]],
    runtime_instances: list[dict[str, Any]],
    failure_domains: list[dict[str, Any]],
    edges: list[dict[str, Any]],
    environment_manifests: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = {
        "trust_zone_count": len(TRUST_ZONES),
        "trust_zone_boundary_count": len(BOUNDARIES),
        "family_code_count": len({row["family_code"] for row in WORKLOAD_FAMILY_CATALOG}),
        "workload_family_catalog_count": len(WORKLOAD_FAMILY_CATALOG),
        "runtime_workload_instance_count": len(runtime_instances),
        "environment_manifest_count": len(environment_manifests),
        "service_binding_count": len(service_bindings),
        "context_runtime_home_count": len(owner_context_homes),
        "gateway_surface_count": sum(1 for _ in load_csv(GATEWAY_MATRIX_PATH)),
        "edge_count": len(edges),
        "failure_domain_count": len(failure_domains),
        "blocked_crossing_count": len(BLOCKED_CROSSINGS),
        "dependency_effect_budget_count": len(dependency_effect_budgets),
        "repo_artifact_count": repo_topology["summary"]["artifact_count"],
    }
    payload = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "trust_zones": TRUST_ZONES,
        "trust_zone_boundaries": BOUNDARIES,
        "workload_family_catalog": WORKLOAD_FAMILY_CATALOG,
        "runtime_workload_families": runtime_instances,
        "environment_manifests": environment_manifests,
        "service_runtime_bindings": service_bindings,
        "context_runtime_homes": owner_context_homes,
        "ingress_catalog": INGRESS_CATALOG,
        "data_store_catalog": DATA_STORE_CATALOG,
        "queue_catalog": QUEUE_CATALOG,
        "egress_allowlists": EGRESS_ALLOWLISTS,
        "assurance_slices": ASSURANCE_SLICES,
        "blocked_crossings": BLOCKED_CROSSINGS,
        "topology_defects": TOPOLOGY_DEFECTS,
        "dependency_effect_budgets": dependency_effect_budgets,
    }
    payload["manifest_tuple_hash"] = sha256_snippet(payload["summary"])
    return payload


def build_workload_payload(
    runtime_manifest: dict[str, Any],
) -> dict[str, Any]:
    summary = deepcopy(runtime_manifest["summary"])
    summary["ring_counts"] = {
        ring["environment_ring"]: sum(
            1
            for row in runtime_manifest["runtime_workload_families"]
            if row["environment_ring"] == ring["environment_ring"]
        )
        for ring in RINGS
    }
    summary["family_code_counts"] = {
        family_code: sum(
            1
            for row in runtime_manifest["runtime_workload_families"]
            if row["family_code"] == family_code
        )
        for family_code in sorted({row["family_code"] for row in runtime_manifest["runtime_workload_families"]})
    }
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "trust_zones": TRUST_ZONES,
        "trust_zone_boundaries": BOUNDARIES,
        "workload_family_catalog": runtime_manifest["workload_family_catalog"],
        "runtime_workload_families": runtime_manifest["runtime_workload_families"],
        "service_runtime_bindings": runtime_manifest["service_runtime_bindings"],
        "context_runtime_homes": runtime_manifest["context_runtime_homes"],
        "manifest_tuple_hash": runtime_manifest["manifest_tuple_hash"],
    }


def build_strategy_doc(runtime_manifest: dict[str, Any]) -> str:
    service_rows = "\n".join(
        f"| `{row['artifact_id']}` | `{row['runtime_workload_family_ref']}` | `{row['family_code']}` | `{row['owner_context_code']}` |"
        for row in runtime_manifest["service_runtime_bindings"]
    )
    environment_rows = "\n".join(
        f"| `{row['environment_ring']}` | {row['display_name']} | {len(row['runtime_workload_family_refs'])} | `{row['publication_state']}` | `{row['topology_tuple_hash']}` |"
        for row in runtime_manifest["environment_manifests"]
    )
    dependency_rows = "\n".join(
        f"| `{row['dependency_id']}` | {', '.join(f'`{value}`' for value in row['affected_workload_family_refs'])} | {', '.join(f'`{value}`' for value in row['blocked_spillover_family_refs'][:4])}{' ...' if len(row['blocked_spillover_family_refs']) > 4 else ''} |"
        for row in runtime_manifest["dependency_effect_budgets"]
    )
    return dedent(
        f"""
        # 46 Runtime Topology Manifest Strategy

        `seq_046` converts runtime topology into machine-readable law by freezing workload families, trust-zone boundaries, failure domains, and release/publication placeholders in one deterministic contract set.

        ## Outcome

        - Runtime workload family catalog: `{runtime_manifest['summary']['workload_family_catalog_count']}`
        - Runtime workload instances: `{runtime_manifest['summary']['runtime_workload_instance_count']}`
        - Environment manifests: `{runtime_manifest['summary']['environment_manifest_count']}`
        - Explicit failure domains: `{runtime_manifest['summary']['failure_domain_count']}`
        - Declared blocked browser/runtime crossings: `{runtime_manifest['summary']['blocked_crossing_count']}`

        ## Environment Manifests

        | Ring | Display | Families | Publication state | Tuple hash |
        | --- | --- | --- | --- | --- |
        {environment_rows}

        ## Canonical Service Placement

        | Service | Runtime family | Family code | Owner context |
        | --- | --- | --- | --- |
        {service_rows}

        ## Dependency Fallout Budgets

        | Dependency | Allowed affected families | Explicit spillover block list |
        | --- | --- | --- |
        {dependency_rows}

        ## Runtime Contract Law

        - Browser traffic terminates at `wf_public_edge_ingress`, shell publication, or the published gateway family only.
        - `wf_shell_delivery_published_gateway` is the only browser-addressable compute bridge beyond the edge.
        - `wf_command_orchestration`, `wf_projection_read_models`, `wf_integration_dispatch`, `wf_integration_simulation_lab`, `wf_data_stateful_plane`, and `wf_assurance_security_control` are never directly browser-reachable.
        - `service_adapter_simulators` stays explicit but non-authoritative and is absent from preprod and production manifests.
        - Release approval, channel manifest, and minimum bridge capability refs are placeholders now so later tasks must bind them instead of inventing them.
        """
    )


def build_catalog_doc(runtime_manifest: dict[str, Any]) -> str:
    family_rows = "\n".join(
        f"| `{row['runtime_workload_family_ref']}` | `{row['family_code']}` | `{row['trust_zone_ref']}` | {', '.join(f'`{value}`' for value in row['owned_service_refs']) or 'none'} | `{row['tenant_context_mode']}` | `{row['assurance_trust_mode']}` | `{row['egress_allowlist_ref']}` |"
        for row in runtime_manifest["workload_family_catalog"]
    )
    context_rows = "\n".join(
        f"| `{row['context_code']}` | `{row['shell_workload_family_ref'] or 'none'}` | `{row['primary_authority_workload_family_ref']}` | {', '.join(f'`{value}`' for value in row['effect_workload_family_refs']) or 'none'} |"
        for row in runtime_manifest["context_runtime_homes"]
    )
    split_rows = "\n".join(
        f"- `{row['runtime_workload_family_ref']}`: {row['split_rationale']}"
        for row in runtime_manifest["workload_family_catalog"]
        if row["split_rationale"]
    )
    return dedent(
        f"""
        # 46 Workload Family Catalog

        The catalog keeps the minimum blueprint family codes (`public_edge`, `shell_delivery`, `command`, `projection`, `integration`, `data`, `assurance_security`) while making the materially different runtime planes explicit.

        ## Family Catalog

        | Runtime family | Family code | Trust zone | Owned services | Tenant mode | Assurance mode | Egress posture |
        | --- | --- | --- | --- | --- | --- | --- |
        {family_rows}

        ## Explicit Split Decisions

        {split_rows}

        ## Context Runtime Homes

        | Context | Shell home | Primary authority home | Other runtime homes |
        | --- | --- | --- | --- |
        {context_rows}

        ## Notes

        - The gateway family stays under `family_code = shell_delivery` so the family-code inventory remains compatible with the earlier baseline, while the separate trust zone and workload-family ID make the compute bridge explicit.
        - The simulator family also stays under `family_code = integration`, but only the nonprod rings receive runtime instances for it.
        - Support, operations, governance, analytics, audit, and release now have declared runtime homes instead of implicit sidecar assumptions.
        """
    )


def build_failure_policy_doc(
    runtime_manifest: dict[str, Any],
    failure_domains: list[dict[str, Any]],
) -> str:
    egress_rows = "\n".join(
        f"| `{row['egress_allowlist_ref']}` | {', '.join(f'`{value}`' for value in row['family_refs'])} | {', '.join(f'`{value}`' for value in row['allowed_targets']) or 'none'} | {', '.join(f'`{value}`' for value in row['blocked_targets'])[:120]} |"
        for row in EGRESS_ALLOWLISTS
    )
    failure_rows = "\n".join(
        f"| `{row['failure_domain_ref']}` | `{row['runtime_workload_family_ref']}` | `{row['environment_ring']}` | `{row['uk_region_role']}` | `{row['user_visible_posture']}` |"
        for row in failure_domains[:12]
    )
    return dedent(
        f"""
        # 46 Failure Domain And Egress Policy

        Seq_046 closes the gap where failure-domain and egress posture lived only in deployment folklore. The CSV and JSON artifacts now make every workload family declare its blast-radius shape and egress law.

        ## Egress Allowlist Posture

        | Allowlist | Families | Allowed targets | Explicitly blocked targets |
        | --- | --- | --- | --- |
        {egress_rows}

        ## Failure Domain Sample

        The full machine-readable inventory is in `data/analysis/runtime_failure_domains.csv`. A representative slice:

        | Failure domain | Family | Ring | Region role | User posture |
        | --- | --- | --- | --- | --- |
        {failure_rows}

        ## Policy Law

        - Browser-facing families may not egress to providers or raw stores.
        - Live integration dispatch has an explicit provider-neutral allowlist placeholder and cannot widen without later onboarding evidence.
        - Simulator egress is internal-only and never reaches live-provider endpoints.
        - Restore proof, release watch tuple, and assurance slices govern when any warm-standby family may claim live authority.
        """
    )


def build_mmd() -> str:
    return dedent(
        """
        flowchart LR
          subgraph tz_public_edge["Public edge"]
            fam_public_edge["wf_public_edge_ingress\\npublic_edge"]
          end

          subgraph tz_shell_delivery["Shell delivery"]
            fam_shell_pub["wf_shell_delivery_static_publication\\nshell_delivery"]
          end

          subgraph tz_published_gateway["Published gateway"]
            fam_gateway["wf_shell_delivery_published_gateway\\nshell_delivery"]
          end

          subgraph tz_application_core["Application core"]
            fam_command["wf_command_orchestration\\ncommand"]
            fam_projection["wf_projection_read_models\\nprojection"]
          end

          subgraph tz_integration_perimeter["Integration perimeter"]
            fam_integration["wf_integration_dispatch\\nintegration"]
            fam_sim["wf_integration_simulation_lab\\nintegration (nonprod only)"]
          end

          subgraph tz_stateful_data["Stateful data"]
            fam_data["wf_data_stateful_plane\\ndata"]
          end

          subgraph tz_assurance_security["Assurance and security"]
            fam_assurance["wf_assurance_security_control\\nassurance_security"]
          end

          fam_public_edge -->|"static publication"| fam_shell_pub
          fam_public_edge -->|"published gateway surfaces"| fam_gateway
          fam_gateway -->|"projection reads"| fam_projection
          fam_gateway -->|"command submission"| fam_command
          fam_gateway -->|"support / ops / governance"| fam_assurance
          fam_command -->|"writes / queues"| fam_data
          fam_command -->|"outbox dispatch"| fam_integration
          fam_command -->|"proof twin only"| fam_sim
          fam_command -->|"audit and gates"| fam_assurance
          fam_projection -->|"read-model storage"| fam_data
          fam_projection -->|"freshness / watch"| fam_assurance
          fam_integration -->|"receipts"| fam_data
          fam_integration -->|"dependency evidence"| fam_assurance
          fam_sim -->|"non-authoritative callback"| fam_command
          fam_sim -->|"proof twin evidence"| fam_assurance
          fam_assurance -->|"restore / release tuples"| fam_data
        """
    )


def build_atlas_html(runtime_manifest: dict[str, Any], edges: list[dict[str, Any]]) -> str:
    payload = {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "summary": runtime_manifest["summary"],
        "trust_zones": TRUST_ZONES,
        "workload_family_catalog": runtime_manifest["workload_family_catalog"],
        "runtime_workload_families": runtime_manifest["runtime_workload_families"],
        "environment_manifests": runtime_manifest["environment_manifests"],
        "edges": edges,
        "blocked_crossings": BLOCKED_CROSSINGS,
        "topology_defects": TOPOLOGY_DEFECTS,
        "egress_allowlists": EGRESS_ALLOWLISTS,
    }
    payload_json = json.dumps(payload, separators=(",", ":"))
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>46 Runtime Topology Atlas</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F6F8FB;
              --rail: #EEF2F7;
              --panel: #FFFFFF;
              --inset: #F3F5FA;
              --text-strong: #0F172A;
              --text-default: #1E293B;
              --text-muted: #667085;
              --border-subtle: #E2E8F0;
              --border-default: #CBD5E1;
              --primary: #3559E6;
              --trust: #0EA5A4;
              --warning: #C98900;
              --blocked: #C24141;
              --shared: #7C3AED;
              --masthead-height: 72px;
              --rail-width: 300px;
              --inspector-width: 360px;
              --radius: 18px;
              --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
              --transition-fast: 120ms ease;
              --transition-select: 180ms ease;
              --transition-panel: 220ms ease;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              background: linear-gradient(180deg, rgba(53, 89, 230, 0.06), rgba(246, 248, 251, 0.92) 160px), var(--canvas);
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
              padding: 20px 20px 28px;
            }}
            .masthead {{
              position: sticky;
              top: 0;
              z-index: 5;
              min-height: var(--masthead-height);
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 20px;
              align-items: center;
              padding: 14px 18px;
              margin-bottom: 18px;
              border: 1px solid rgba(203, 213, 225, 0.88);
              border-radius: calc(var(--radius) + 4px);
              background: rgba(255, 255, 255, 0.94);
              backdrop-filter: blur(14px);
              box-shadow: var(--shadow);
            }}
            .wordmark {{
              display: flex;
              align-items: center;
              gap: 12px;
            }}
            .monogram {{
              width: 42px;
              height: 42px;
              border-radius: 14px;
              background: linear-gradient(135deg, rgba(53, 89, 230, 0.16), rgba(14, 165, 164, 0.12));
              display: grid;
              place-items: center;
              border: 1px solid rgba(53, 89, 230, 0.14);
            }}
            .monogram svg {{ width: 26px; height: 26px; }}
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
              align-items: center;
            }}
            .metric {{
              min-width: 118px;
              padding: 10px 12px;
              border: 1px solid var(--border-subtle);
              border-radius: 14px;
              background: var(--inset);
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
              background: linear-gradient(180deg, rgba(238, 242, 247, 0.96), rgba(255, 255, 255, 0.98));
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
            .family-list {{
              display: grid;
              gap: 10px;
            }}
            .family-card {{
              min-height: 112px;
              padding: 14px;
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.94);
              cursor: pointer;
              transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
            }}
            .family-card[data-selected="true"] {{
              border-color: rgba(53, 89, 230, 0.54);
              box-shadow: 0 18px 38px rgba(53, 89, 230, 0.12);
              transform: translateY(-1px);
            }}
            .family-card:hover,
            .family-card:focus-visible {{
              border-color: rgba(53, 89, 230, 0.38);
              transform: translateY(-1px);
              outline: none;
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
              color: var(--text-default);
            }}
            .chip.watch {{ border-color: rgba(201, 137, 0, 0.28); color: #8A6100; }}
            .chip.declared {{ border-color: rgba(14, 165, 164, 0.24); color: #0B7C7A; }}
            .chip.blocked {{ border-color: rgba(194, 65, 65, 0.24); color: var(--blocked); }}
            .mono {{
              font-family: "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace;
            }}
            .center {{
              padding: 16px;
            }}
            .canvas {{
              min-height: 580px;
              padding: 18px;
              margin-bottom: 16px;
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
              background: linear-gradient(180deg, rgba(243, 245, 250, 0.85), rgba(255, 255, 255, 0.96));
            }}
            .zone-grid {{
              display: grid;
              gap: 12px;
            }}
            .zone-band {{
              padding: 14px;
              border: 1px solid var(--border-default);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.78);
            }}
            .zone-header {{
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: baseline;
              margin-bottom: 12px;
            }}
            .zone-header h3 {{
              margin: 0;
              font-size: 16px;
              color: var(--text-strong);
            }}
            .zone-nodes {{
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 10px;
            }}
            .graph-node {{
              padding: 14px;
              border-radius: 16px;
              border: 1px solid var(--border-subtle);
              background: var(--panel);
              cursor: pointer;
              transition: transform var(--transition-select), border-color var(--transition-select), box-shadow var(--transition-select);
            }}
            .graph-node[data-selected="true"] {{
              border-color: rgba(53, 89, 230, 0.54);
              box-shadow: 0 20px 44px rgba(53, 89, 230, 0.12);
            }}
            .graph-node:hover,
            .graph-node:focus-visible {{
              transform: translateY(-1px);
              border-color: rgba(53, 89, 230, 0.38);
              outline: none;
            }}
            .overlay {{
              margin-top: 14px;
              padding: 12px;
              border: 1px dashed var(--border-default);
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.75);
            }}
            .tables {{
              display: grid;
              gap: 16px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }}
            .table-shell {{
              padding: 14px;
              border: 1px solid var(--border-subtle);
              border-radius: 16px;
              background: var(--panel);
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th,
            td {{
              padding: 10px 0;
              border-bottom: 1px solid var(--border-subtle);
              text-align: left;
              vertical-align: top;
              font-size: 13px;
            }}
            th {{
              font-size: 12px;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }}
            tr[tabindex="0"] {{
              cursor: pointer;
            }}
            tr[data-selected="true"] td {{
              color: var(--text-strong);
              font-weight: 600;
            }}
            .defect-strip {{
              display: grid;
              gap: 10px;
            }}
            .defect-card {{
              padding: 14px;
              border-radius: 16px;
              border: 1px solid var(--border-subtle);
              background: var(--panel);
            }}
            .inspector {{
              padding: 16px;
              position: sticky;
              top: calc(var(--masthead-height) + 26px);
              align-self: start;
              transition: transform var(--transition-panel), opacity var(--transition-panel);
            }}
            .inspector h2 {{
              margin: 0 0 6px;
              color: var(--text-strong);
            }}
            .meta-grid {{
              display: grid;
              gap: 12px;
              margin-top: 14px;
            }}
            .inspector-block {{
              padding: 12px;
              border-radius: 16px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
            }}
            .inspector-list {{
              display: grid;
              gap: 8px;
              margin-top: 8px;
            }}
            .legend {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 8px;
            }}
            .legend span {{
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              color: var(--text-muted);
            }}
            .legend i {{
              display: inline-block;
              width: 18px;
              height: 2px;
              border-radius: 999px;
            }}
            .empty {{
              padding: 18px;
              border-radius: 16px;
              background: var(--inset);
              border: 1px dashed var(--border-default);
              color: var(--text-muted);
            }}
            @media (max-width: 1180px) {{
              .layout {{
                grid-template-columns: minmax(0, 1fr);
              }}
              .inspector {{
                position: static;
              }}
            }}
            @media (max-width: 760px) {{
              .tables {{
                grid-template-columns: minmax(0, 1fr);
              }}
              .metric-strip {{
                justify-content: flex-start;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="page">
            <header class="masthead" data-testid="topology-masthead">
              <div class="wordmark">
                <div class="monogram" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none">
                    <path d="M7 24V8h7.5c3.6 0 5.5 1.9 5.5 4.7 0 2-1.1 3.6-3.1 4.2L24.5 24h-5.2l-6.8-6.5H11.7V24H7Zm4.7-10.4h2.4c1.6 0 2.6-.7 2.6-2 0-1.3-1-2-2.6-2h-2.4v4Z" fill="#3559E6"/>
                    <path d="M19.5 8H25v3.2h-5.5V8Zm0 5.3H25v3.2h-5.5v-3.2Zm0 5.3H25V22h-5.5v-3.4Z" fill="#0EA5A4"/>
                  </svg>
                </div>
                <div>
                  <p class="eyebrow">Vecells</p>
                  <h1 class="headline">Runtime Topology Atlas</h1>
                  <p class="subhead">One exact runtime contract for shells, gateways, operators, and release tooling.</p>
                </div>
              </div>
              <div class="metric-strip">
                <div class="metric">
                  <strong id="metric-environment">local</strong>
                  <span>environment</span>
                </div>
                <div class="metric">
                  <strong id="metric-family-count">0</strong>
                  <span>workload families</span>
                </div>
                <div class="metric">
                  <strong id="metric-zone-count">{runtime_manifest['summary']['trust_zone_count']}</strong>
                  <span>trust zones</span>
                </div>
                <div class="metric">
                  <strong id="metric-blocked-count">{runtime_manifest['summary']['blocked_crossing_count']}</strong>
                  <span>blocked crossings</span>
                </div>
                <div class="metric">
                  <strong class="mono" id="metric-hash">pending</strong>
                  <span>tuple hash</span>
                </div>
              </div>
            </header>

            <div class="layout">
              <aside class="panel rail" data-testid="family-rail">
                <p class="section-label">Filters</p>
                <div class="filter-grid">
                  <div>
                    <label for="filter-environment">Environment</label>
                    <select id="filter-environment" data-testid="filter-environment"></select>
                  </div>
                  <div>
                    <label for="filter-zone">Trust zone</label>
                    <select id="filter-zone" data-testid="filter-zone"></select>
                  </div>
                  <div>
                    <label for="filter-family">Workload family</label>
                    <select id="filter-family" data-testid="filter-family"></select>
                  </div>
                  <div>
                    <label for="filter-tenant">Tenant mode</label>
                    <select id="filter-tenant" data-testid="filter-tenant"></select>
                  </div>
                  <div>
                    <label for="filter-defect">Defect state</label>
                    <select id="filter-defect" data-testid="filter-defect"></select>
                  </div>
                </div>
                <p class="section-label">Workload families</p>
                <div class="family-list" id="family-list"></div>
              </aside>

              <main class="panel center">
                <section class="canvas" data-testid="graph-canvas" aria-label="Runtime topology graph">
                  <div>
                    <p class="section-label">Trust-zone diagram</p>
                    <div class="legend" aria-label="Zone legend">
                      <span><i style="background:#3559E6"></i> family node</span>
                      <span><i style="background:#0EA5A4"></i> trust-band accent</span>
                      <span><i style="background:#C98900"></i> watch posture</span>
                      <span><i style="background:#C24141"></i> blocked crossing</span>
                    </div>
                  </div>
                  <div class="zone-grid" id="zone-grid"></div>
                  <div class="overlay" data-testid="failure-overlay">
                    <p class="section-label">Failure-domain overlay</p>
                    <div id="failure-overlay-body"></div>
                  </div>
                </section>

                <section class="tables">
                  <div class="table-shell" data-testid="family-table">
                    <p class="section-label">Family parity table</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Family</th>
                          <th>Zone</th>
                          <th>Region</th>
                        </tr>
                      </thead>
                      <tbody id="family-body"></tbody>
                    </table>
                  </div>

                  <div class="table-shell" data-testid="edge-table">
                    <p class="section-label">Topology edge table</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Edge</th>
                          <th>Mode</th>
                          <th>Failure mode</th>
                        </tr>
                      </thead>
                      <tbody id="edge-body"></tbody>
                    </table>
                  </div>

                  <div class="table-shell" data-testid="manifest-table">
                    <p class="section-label">Manifest tuple details</p>
                    <table>
                      <tbody id="manifest-body"></tbody>
                    </table>
                  </div>

                  <div class="table-shell" data-testid="defect-strip">
                    <p class="section-label">Defect strip</p>
                    <div class="defect-strip" id="defect-body"></div>
                  </div>
                </section>
              </main>

              <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
            </div>
          </div>

          <script id="atlas-data" type="application/json">{payload_json}</script>
          <script>
            const payload = JSON.parse(document.getElementById("atlas-data").textContent);
            const state = {{
              environment: payload.environment_manifests[0]?.environment_ring ?? "local",
              trustZone: "all",
              familyCode: "all",
              tenantMode: "all",
              defect: "all",
              selectedRuntimeId: payload.environment_manifests[0]?.runtime_workload_family_ids?.[0] ?? null,
            }};

            const filterEnvironment = document.getElementById("filter-environment");
            const filterZone = document.getElementById("filter-zone");
            const filterFamily = document.getElementById("filter-family");
            const filterTenant = document.getElementById("filter-tenant");
            const filterDefect = document.getElementById("filter-defect");
            const familyList = document.getElementById("family-list");
            const zoneGrid = document.getElementById("zone-grid");
            const familyBody = document.getElementById("family-body");
            const edgeBody = document.getElementById("edge-body");
            const manifestBody = document.getElementById("manifest-body");
            const defectBody = document.getElementById("defect-body");
            const failureOverlayBody = document.getElementById("failure-overlay-body");
            const inspector = document.querySelector("[data-testid='inspector']");

            const metricEnvironment = document.getElementById("metric-environment");
            const metricFamilyCount = document.getElementById("metric-family-count");
            const metricHash = document.getElementById("metric-hash");

            const media = window.matchMedia("(prefers-reduced-motion: reduce)");
            const applyMotionFlag = () => {{
              document.body.setAttribute("data-reduced-motion", media.matches ? "true" : "false");
            }};
            applyMotionFlag();
            if (typeof media.addEventListener === "function") {{
              media.addEventListener("change", applyMotionFlag);
            }} else if (typeof media.addListener === "function") {{
              media.addListener(applyMotionFlag);
            }}

            function currentManifest() {{
              return payload.environment_manifests.find((row) => row.environment_ring === state.environment);
            }}

            function currentInstances() {{
              const manifest = currentManifest();
              const familyCatalog = new Map(payload.workload_family_catalog.map((row) => [row.runtime_workload_family_ref, row]));
              return payload.runtime_workload_families
                .filter((row) => row.environment_ring === state.environment)
                .filter((row) => state.trustZone === "all" || row.trust_zone_ref === state.trustZone)
                .filter((row) => state.familyCode === "all" || row.family_code === state.familyCode)
                .filter((row) => state.tenantMode === "all" || row.tenant_isolation_mode === state.tenantMode)
                .filter((row) => state.defect === "all" || row.defect_state === state.defect)
                .map((row) => ({{ ...row, catalog: familyCatalog.get(row.runtime_workload_family_ref) }}))
                .sort((left, right) => {{
                  if (left.trust_zone_ref !== right.trust_zone_ref) {{
                    return left.trust_zone_ref.localeCompare(right.trust_zone_ref);
                  }}
                  return left.display_name.localeCompare(right.display_name);
                }});
            }}

            function currentEdges() {{
              const visible = new Set(currentInstances().map((row) => row.runtime_workload_family_id));
              return payload.edges.filter((row) => row.environment_ring === state.environment)
                .filter((row) => visible.has(row.source_runtime_workload_family_id) && visible.has(row.target_runtime_workload_family_id));
            }}

            function ensureSelection(instances) {{
              if (!instances.length) {{
                state.selectedRuntimeId = null;
                return null;
              }}
              if (!instances.some((row) => row.runtime_workload_family_id === state.selectedRuntimeId)) {{
                state.selectedRuntimeId = instances[0].runtime_workload_family_id;
              }}
              return instances.find((row) => row.runtime_workload_family_id === state.selectedRuntimeId) ?? instances[0];
            }}

            function populateFilters() {{
              filterEnvironment.innerHTML = payload.environment_manifests
                .map((row) => `<option value="${{row.environment_ring}}">${{row.display_name}}</option>`)
                .join("");

              filterZone.innerHTML = [
                '<option value="all">All trust zones</option>',
                ...payload.trust_zones.map((row) => `<option value="${{row.trust_zone_ref}}">${{row.display_name}}</option>`),
              ].join("");

              filterFamily.innerHTML = [
                '<option value="all">All workload families</option>',
                ...Array.from(new Set(payload.workload_family_catalog.map((row) => row.family_code)))
                  .sort()
                  .map((value) => `<option value="${{value}}">${{value}}</option>`),
              ].join("");

              filterTenant.innerHTML = [
                '<option value="all">All tenant modes</option>',
                ...Array.from(new Set(payload.runtime_workload_families.map((row) => row.tenant_isolation_mode)))
                  .sort()
                  .map((value) => `<option value="${{value}}">${{value}}</option>`),
              ].join("");

              filterDefect.innerHTML = [
                '<option value="all">All defect states</option>',
                '<option value="declared">Declared only</option>',
                '<option value="watch">Watch only</option>',
              ].join("");

              filterEnvironment.value = state.environment;
              filterZone.value = state.trustZone;
              filterFamily.value = state.familyCode;
              filterTenant.value = state.tenantMode;
              filterDefect.value = state.defect;
            }}

            function chip(text, tone = "") {{
              return `<span class="chip ${{tone}}">${{text}}</span>`;
            }}

            function renderFamilyCards(instances) {{
              familyList.innerHTML = instances.length
                ? instances.map((row) => `
                    <button
                      type="button"
                      class="family-card"
                      tabindex="0"
                      data-runtime-id="${{row.runtime_workload_family_id}}"
                      data-selected="${{row.runtime_workload_family_id === state.selectedRuntimeId ? "true" : "false"}}"
                      data-testid="family-card-${{row.runtime_workload_family_id}}"
                    >
                      <div class="section-label">${{row.environment_ring}} · ${{row.uk_region_role}}</div>
                      <strong>${{row.display_name}}</strong>
                      <div class="mono">${{row.runtime_workload_family_ref}}</div>
                      <div class="chip-row">
                        ${{chip(row.family_code, row.defect_state)}}
                        ${{chip(row.trust_zone_ref)}}
                        ${{chip(row.service_identity_ref)}}
                      </div>
                    </button>
                  `).join("")
                : '<div class="empty">No families match the current filters.</div>';

              familyList.querySelectorAll(".family-card").forEach((card) => {{
                card.addEventListener("click", () => {{
                  state.selectedRuntimeId = card.getAttribute("data-runtime-id");
                  render();
                }});
                card.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowDown") {{
                    event.preventDefault();
                    moveSelection(1, "card");
                  }} else if (event.key === "ArrowUp") {{
                    event.preventDefault();
                    moveSelection(-1, "card");
                  }}
                }});
              }});
            }}

            function renderGraph(instances) {{
              const zones = new Map(payload.trust_zones.map((row) => [row.trust_zone_ref, row]));
              zoneGrid.innerHTML = payload.trust_zones.map((zone) => {{
                const zoneItems = instances.filter((row) => row.trust_zone_ref === zone.trust_zone_ref);
                if (!zoneItems.length) {{
                  return "";
                }}
                return `
                  <section class="zone-band">
                    <div class="zone-header">
                      <h3>${{zone.display_name}}</h3>
                      <span class="mono">${{zone.trust_zone_ref}}</span>
                    </div>
                    <div class="zone-nodes">
                      ${{zoneItems.map((row) => `
                        <article
                          class="graph-node"
                          tabindex="0"
                          data-runtime-id="${{row.runtime_workload_family_id}}"
                          data-selected="${{row.runtime_workload_family_id === state.selectedRuntimeId ? "true" : "false"}}"
                          data-testid="graph-node-${{row.runtime_workload_family_id}}"
                        >
                          <div class="section-label">${{row.uk_region_role}}</div>
                          <strong>${{row.display_name}}</strong>
                          <div class="mono">${{row.runtime_workload_family_ref}}</div>
                          <div class="chip-row">
                            ${{chip(row.family_code, row.defect_state)}}
                            ${{chip(row.tenant_isolation_mode)}}
                          </div>
                        </article>
                      `).join("")}}
                    </div>
                  </section>
                `;
              }}).join("");

              zoneGrid.querySelectorAll(".graph-node").forEach((node) => {{
                node.addEventListener("click", () => {{
                  state.selectedRuntimeId = node.getAttribute("data-runtime-id");
                  render();
                }});
                node.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {{
                    event.preventDefault();
                    moveSelection(1, "graph");
                  }} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {{
                    event.preventDefault();
                    moveSelection(-1, "graph");
                  }}
                }});
              }});

              const ringEdges = currentEdges();
              const grouped = new Map();
              ringEdges.forEach((edge) => {{
                const key = edge.source_family_code;
                grouped.set(key, (grouped.get(key) ?? 0) + 1);
              }});
              failureOverlayBody.innerHTML = instances.map((row) => `
                <div class="chip-row">
                  ${{chip(row.runtime_workload_family_ref)}}
                  ${{chip(row.failure_domain_ref)}}
                  ${{chip(`${{grouped.get(row.family_code) ?? 0}} edges`)}}
                </div>
              `).join("");
            }}

            function renderFamilyTable(instances) {{
              familyBody.innerHTML = instances.map((row) => `
                <tr
                  tabindex="0"
                  data-runtime-id="${{row.runtime_workload_family_id}}"
                  data-selected="${{row.runtime_workload_family_id === state.selectedRuntimeId ? "true" : "false"}}"
                  data-testid="family-row-${{row.runtime_workload_family_id}}"
                >
                  <td>
                    <strong>${{row.display_name}}</strong>
                    <div class="mono">${{row.runtime_workload_family_ref}}</div>
                  </td>
                  <td>${{row.trust_zone_ref}}</td>
                  <td>${{row.uk_region_role}}</td>
                </tr>
              `).join("");
              familyBody.querySelectorAll("tr").forEach((row) => {{
                row.addEventListener("click", () => {{
                  state.selectedRuntimeId = row.getAttribute("data-runtime-id");
                  render();
                }});
                row.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowDown") {{
                    event.preventDefault();
                    moveSelection(1, "table");
                  }} else if (event.key === "ArrowUp") {{
                    event.preventDefault();
                    moveSelection(-1, "table");
                  }}
                }});
              }});
            }}

            function renderEdgeTable(edges) {{
              edgeBody.innerHTML = edges.map((row) => `
                <tr
                  tabindex="0"
                  data-edge-id="${{row.edge_id}}"
                  data-testid="edge-row-${{row.edge_id}}"
                >
                  <td>
                    <strong>${{row.source_family_code}} -> ${{row.target_family_code}}</strong>
                    <div class="mono">${{row.trust_zone_boundary_ref}}</div>
                  </td>
                  <td>${{row.bridge_mode}}</td>
                  <td>${{row.failure_mode}}</td>
                </tr>
              `).join("");
              edgeBody.querySelectorAll("tr").forEach((row, index, rows) => {{
                row.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowDown" && index < rows.length - 1) {{
                    event.preventDefault();
                    rows[index + 1].focus();
                  }} else if (event.key === "ArrowUp" && index > 0) {{
                    event.preventDefault();
                    rows[index - 1].focus();
                  }}
                }});
              }});
            }}

            function renderManifestTable(manifest) {{
              manifestBody.innerHTML = `
                <tr><th>Publication state</th><td>${{manifest.publication_state}}</td></tr>
                <tr><th>Tuple hash</th><td class="mono">${{manifest.topology_tuple_hash}}</td></tr>
                <tr><th>Release freeze</th><td class="mono">${{manifest.release_approval_freeze_ref}}</td></tr>
                <tr><th>Channel set</th><td class="mono">${{manifest.channel_manifest_set_ref}}</td></tr>
                <tr><th>Bridge capability set</th><td class="mono">${{manifest.minimum_bridge_capability_set_ref}}</td></tr>
                <tr><th>Assurance slices</th><td>${{manifest.required_assurance_slice_refs.map((row) => `<span class="chip mono">${{row}}</span>`).join(" ")}}</td></tr>
              `;
            }}

            function renderDefects(instances) {{
              const visibleFamilies = new Set(instances.map((row) => row.runtime_workload_family_ref));
              const visible = payload.topology_defects.filter((row) => row.affected_family_refs.some((ref) => visibleFamilies.has(ref)));
              defectBody.innerHTML = visible.length
                ? visible.map((row) => `
                    <article class="defect-card">
                      <div class="chip-row">
                        ${{chip(row.state, row.state === "watch" ? "watch" : "")}}
                        ${{chip(row.severity)}}
                      </div>
                      <strong>${{row.title}}</strong>
                      <p>${{row.summary}}</p>
                      <div class="mono">${{row.defect_id}}</div>
                    </article>
                  `).join("")
                : '<div class="empty">No defects are visible under the current filters.</div>';
            }}

            function renderInspector(selected) {{
              if (!selected) {{
                inspector.innerHTML = '<div class="empty">No family matches the current filters.</div>';
                return;
              }}
              const catalog = selected.catalog;
              const services = catalog.owned_service_refs.map((row) => `<div class="chip mono">${{row}}</div>`).join(" ");
              const downstream = selected.allowed_downstream_family_refs.map((row) => `<div class="chip mono">${{row}}</div>`).join(" ") || '<div class="chip">none</div>';
              const dataClasses = selected.allowed_data_classification_refs.map((row) => `<div class="chip mono">${{row}}</div>`).join(" ");
              inspector.innerHTML = `
                <div>
                  <p class="section-label">Selected family</p>
                  <h2>${{selected.display_name}}</h2>
                  <div class="mono">${{selected.runtime_workload_family_ref}} · ${{selected.runtime_workload_family_id}}</div>
                </div>
                <div class="chip-row">
                  ${{chip(selected.family_code, selected.defect_state)}}
                  ${{chip(selected.trust_zone_ref)}}
                  ${{chip(selected.uk_region_role)}}
                </div>
                <div class="meta-grid">
                  <section class="inspector-block">
                    <strong>Service membership</strong>
                    <div class="inspector-list">${{services || '<div class="chip">none</div>'}}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Allowed downstream families</strong>
                    <div class="inspector-list">${{downstream}}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Allowed data classes</strong>
                    <div class="inspector-list">${{dataClasses}}</div>
                  </section>
                  <section class="inspector-block">
                    <strong>Egress posture</strong>
                    <div class="inspector-list">
                      <div class="chip mono">${{selected.egress_allowlist_ref}}</div>
                      <div>${{payload.egress_allowlists.find((row) => row.egress_allowlist_ref === selected.egress_allowlist_ref)?.display_name ?? ''}}</div>
                    </div>
                  </section>
                  <section class="inspector-block">
                    <strong>Failure domain</strong>
                    <div class="inspector-list">
                      <div class="chip mono">${{selected.failure_domain_ref}}</div>
                      <div>${{selected.notes}}</div>
                    </div>
                  </section>
                </div>
              `;
            }}

            function moveSelection(delta, target) {{
              const instances = currentInstances();
              if (!instances.length) {{
                return;
              }}
              const currentIndex = instances.findIndex((row) => row.runtime_workload_family_id === state.selectedRuntimeId);
              const safeIndex = currentIndex === -1 ? 0 : currentIndex;
              const nextIndex = Math.min(instances.length - 1, Math.max(0, safeIndex + delta));
              state.selectedRuntimeId = instances[nextIndex].runtime_workload_family_id;
              render();
              const selector = target === "graph"
                ? `[data-testid="graph-node-${{state.selectedRuntimeId}}"]`
                : target === "table"
                  ? `[data-testid="family-row-${{state.selectedRuntimeId}}"]`
                  : `[data-testid="family-card-${{state.selectedRuntimeId}}"]`;
              const element = document.querySelector(selector);
              if (element) {{
                element.focus();
              }}
            }}

            function render() {{
              const manifest = currentManifest();
              const instances = currentInstances();
              const selected = ensureSelection(instances);
              const visibleEdges = currentEdges();

              renderFamilyCards(instances);
              renderGraph(instances);
              renderFamilyTable(instances);
              renderEdgeTable(visibleEdges);
              renderManifestTable(manifest);
              renderDefects(instances);
              renderInspector(selected);

              metricEnvironment.textContent = manifest.environment_ring;
              metricFamilyCount.textContent = String(instances.length);
              metricHash.textContent = manifest.topology_tuple_hash;
            }}

            populateFilters();
            render();

            filterEnvironment.addEventListener("change", (event) => {{
              state.environment = event.target.value;
              render();
            }});
            filterZone.addEventListener("change", (event) => {{
              state.trustZone = event.target.value;
              render();
            }});
            filterFamily.addEventListener("change", (event) => {{
              state.familyCode = event.target.value;
              render();
            }});
            filterTenant.addEventListener("change", (event) => {{
              state.tenantMode = event.target.value;
              render();
            }});
            filterDefect.addEventListener("change", (event) => {{
              state.defect = event.target.value;
              render();
            }});
          </script>
        </body>
        </html>
        """
    )


def build_root_script_updates(package_json: dict[str, Any]) -> dict[str, Any]:
    updated = deepcopy(package_json)
    scripts = updated.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    return updated


def main() -> None:
    repo_topology = read_json(REPO_TOPOLOGY_PATH)
    service_manifest = read_json(SERVICE_MANIFEST_PATH)
    degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
    gateway_rows = load_csv(GATEWAY_MATRIX_PATH)
    gateway_surface_ids = [row["gateway_surface_id"] for row in gateway_rows]

    service_bindings = build_service_bindings(repo_topology, service_manifest)
    context_runtime_homes = build_context_runtime_homes(repo_topology["owner_contexts"])
    runtime_instances = build_runtime_instances(gateway_surface_ids)
    dependency_effect_budgets = build_dependency_effect_budgets(service_bindings, degraded_defaults)
    failure_domains = build_failure_domains(runtime_instances, dependency_effect_budgets)
    edges = build_edges(runtime_instances)
    environment_manifests = build_environment_manifests(runtime_instances, edges, gateway_surface_ids)
    runtime_manifest = build_runtime_manifest_payload(
        repo_topology,
        context_runtime_homes,
        service_bindings,
        dependency_effect_budgets,
        runtime_instances,
        failure_domains,
        edges,
        environment_manifests,
    )
    workload_payload = build_workload_payload(runtime_manifest)

    write_json(WORKLOAD_PATH, workload_payload)
    write_json(MANIFEST_PATH, runtime_manifest)
    write_csv(
        EDGES_PATH,
        edges,
        [
            "edge_id",
            "environment_ring",
            "uk_region_role",
            "source_runtime_workload_family_id",
            "target_runtime_workload_family_id",
            "source_runtime_workload_family_ref",
            "target_runtime_workload_family_ref",
            "source_family_code",
            "target_family_code",
            "source_trust_zone_ref",
            "target_trust_zone_ref",
            "trust_zone_boundary_ref",
            "bridge_mode",
            "gateway_surface_scope",
            "protocol_refs",
            "tenant_transfer_mode",
            "assurance_trust_transfer_mode",
            "data_class_ceiling_refs",
            "egress_allowlist_ref",
            "failure_mode",
            "edge_state",
            "source_refs",
        ],
    )
    write_csv(
        FAILURE_DOMAIN_PATH,
        failure_domains,
        [
            "failure_domain_ref",
            "runtime_workload_family_id",
            "runtime_workload_family_ref",
            "environment_ring",
            "uk_region_role",
            "trust_zone_ref",
            "blast_radius_scope",
            "spillover_forbidden_to",
            "user_visible_posture",
            "egress_allowlist_ref",
            "dependency_scope_refs",
            "restore_prerequisite",
            "source_refs",
        ],
    )

    write_text(STRATEGY_PATH, build_strategy_doc(runtime_manifest))
    write_text(CATALOG_PATH, build_catalog_doc(runtime_manifest))
    write_text(FAILURE_POLICY_PATH, build_failure_policy_doc(runtime_manifest, failure_domains))
    write_text(MMD_PATH, build_mmd())
    write_text(ATLAS_PATH, build_atlas_html(runtime_manifest, edges))

    package_json = read_json(ROOT_PACKAGE_PATH)
    write_json(ROOT_PACKAGE_PATH, build_root_script_updates(package_json))

    print("seq_046 runtime topology artifacts generated")


if __name__ == "__main__":
    main()
