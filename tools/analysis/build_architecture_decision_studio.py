#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import textwrap
from html import escape
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIRED_INPUTS = {
    "requirement_registry": DATA_DIR / "requirement_registry.jsonl",
    "summary_reconciliation": DATA_DIR / "summary_reconciliation_matrix.csv",
    "product_scope": DATA_DIR / "product_scope_matrix.json",
    "audience_surface_inventory": DATA_DIR / "audience_surface_inventory.csv",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "endpoint_matrix": DATA_DIR / "endpoint_matrix.csv",
    "object_catalog": DATA_DIR / "object_catalog.json",
    "state_machines": DATA_DIR / "state_machines.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "regulatory_workstreams": DATA_DIR / "regulatory_workstreams.json",
    "data_classification": DATA_DIR / "data_classification_matrix.csv",
    "runtime_topology": DATA_DIR / "runtime_workload_families.json",
    "workspace_graph": DATA_DIR / "workspace_package_graph.json",
    "frontend_stack": DATA_DIR / "frontend_stack_scorecard.csv",
    "ui_contract_publication": DATA_DIR / "ui_contract_publication_matrix.csv",
    "service_runtime": DATA_DIR / "service_runtime_matrix.csv",
    "tooling_scorecard": DATA_DIR / "tooling_scorecard.csv",
    "supply_chain": DATA_DIR / "supply_chain_and_provenance_matrix.json",
    "data_classification_break_glass": DATA_DIR / "break_glass_scope_rules.json",
}

ADR_INDEX_PATH = DATA_DIR / "adr_index.json"
ADR_MATRIX_PATH = DATA_DIR / "adr_decision_matrix.csv"
CONTRACT_BINDING_PATH = DATA_DIR / "architecture_contract_binding_matrix.csv"
GAP_REGISTER_PATH = DATA_DIR / "architecture_gap_register.json"

ADR_INDEX_DOC_PATH = DOCS_DIR / "16_adr_index.md"
ADR_SET_DOC_PATH = DOCS_DIR / "16_target_architecture_adr_set.md"
SYSTEM_CONTEXT_DOC_PATH = DOCS_DIR / "16_system_context_and_container_model.md"
DOMAIN_RUNTIME_DOC_PATH = DOCS_DIR / "16_domain_runtime_and_control_plane_architecture.md"
FRONTEND_GATEWAY_DOC_PATH = DOCS_DIR / "16_frontend_gateway_and_design_contract_architecture.md"
DATA_EVENT_DOC_PATH = DOCS_DIR / "16_data_event_storage_and_integration_architecture.md"
RELEASE_ASSURANCE_DOC_PATH = DOCS_DIR / "16_release_assurance_and_resilience_architecture.md"
DECISION_MATRIX_DOC_PATH = DOCS_DIR / "16_architecture_decision_matrix.md"
STUDIO_HTML_PATH = DOCS_DIR / "16_architecture_decision_studio.html"
MERMAID_PATH = DOCS_DIR / "16_architecture_views.mmd"

MISSION = (
    "Freeze the Vecells target architecture as one authoritative ADR set plus one "
    "coherent architecture-view pack for the current baseline of phases 0-6, 8, and 9."
)

CURRENT_BASELINE = "phases 0-6, 8, and 9"
DEFERRED_BASELINE = "phase 7 embedded NHS App channel"

SOURCE_PRECEDENCE = [
    "blueprint-init.md#1. Product definition",
    "blueprint-init.md#2. Core product surfaces",
    "blueprint-init.md#12. Practical engineering shape",
    "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
    "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
    "phase-cards.md#Cross-Phase Conformance Scorecard",
    "platform-runtime-and-release-blueprint.md#Runtime topology contract",
    "platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm",
    "platform-admin-and-config-blueprint.md#Change control rules",
    "platform-admin-and-config-blueprint.md#Production promotion gate",
    "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",
    "phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme",
    "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene",
    "forensic-audit-findings.md#Findings 91, 95, 104-120",
    "11_gateway_surface_and_runtime_topology_baseline.md",
    "12_monorepo_build_system_decision.md",
    "13_backend_runtime_service_baseline.md",
    "14_frontend_stack_decision.md",
    "15_release_and_supply_chain_tooling_baseline.md",
]

STUDIO_MARKERS = [
    'data-testid="adr-rail"',
    'data-testid="adr-summary-strip"',
    'data-testid="adr-filter-bar"',
    'data-testid="architecture-canvas"',
    'data-testid="contract-binding-table"',
    'data-testid="adr-inspector"',
]

NON_NEGOTIABLE_RULES = [
    "No app owns truth.",
    "No browser or shell talks directly to adapters.",
    "No child domain directly derives canonical closure.",
    "No calm or writable posture may outrun the current release, trust, and continuity tuples.",
    "No external-success transport event becomes business truth without authoritative settlement and proof objects.",
    "No generic fallback may replace the audience-specific ReleaseRecoveryDisposition.",
    "No standards, config, publication, runtime, or watch posture may live only in dashboards or prose.",
    "No route family may claim shell ownership without an explicit ownership contract.",
    "No supplier-specific booking, hub, pharmacy, telephony, or notification logic may live in the core model.",
]

MANDATORY_CLOSURES = [
    "Freeze scattered baseline decisions into explicit ADRs.",
    "Treat the Phase 0 control plane as shared programme architecture, not a phase-local convention.",
    "Keep design-contract publication inside the runtime publication tuple.",
    "Unify operations and governance continuity and resilience authority.",
    "Keep the Phase 7 embedded NHS App channel deferred.",
    "Bound assistive capability as optional and non-central.",
    "Prevent tenant and acting-scope drift.",
    "Treat artifact preview and handoff mode truth as contractual runtime truth.",
    "Prevent patient degraded mode, continuity proof, and shell continuity from becoming route-local behavior.",
]

REQUIRED_CONTRACT_REFS = [
    "RuntimeTopologyManifest",
    "GatewayBffSurface",
    "FrontendContractManifest",
    "AudienceSurfaceRuntimeBinding",
    "DesignContractPublicationBundle",
    "RouteIntentBinding",
    "CommandSettlementRecord",
    "ReleaseApprovalFreeze",
    "ChannelReleaseFreezeRecord",
    "AssuranceSliceTrustRecord",
    "ReleaseWatchTuple",
    "WaveObservationPolicy",
    "OperationalReadinessSnapshot",
    "RecoveryControlPosture",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


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
    if not rows:
        return ""
    separator = ["---"] * len(headers)
    body = [headers, separator]
    for row in rows:
        body.append([str(cell) for cell in row])
    return "\n".join("| " + " | ".join(row) + " |" for row in body)


def slugify(value: str) -> str:
    lowered = value.lower()
    cleaned = []
    for char in lowered:
        cleaned.append(char if char.isalnum() else "_")
    return "".join(cleaned).strip("_")


def split_semicolon(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        joined = ", ".join(missing)
        raise SystemExit(f"PREREQUISITE_GAP_MISSING_INPUTS: {joined}")

    product_scope = load_json(REQUIRED_INPUTS["product_scope"])
    baseline_phases = set(product_scope.get("baseline_phases", []))
    deferred_phases = set(product_scope.get("deferred_phases", []))
    if "phase_7" in baseline_phases:
        raise SystemExit("PREREQUISITE_GAP_SCOPE_BASELINE: phase_7 must not be in the current baseline")
    if "phase_7" not in deferred_phases:
        raise SystemExit("PREREQUISITE_GAP_SCOPE_DEFERRED: phase_7 must remain deferred")

    requirement_rows = load_jsonl(REQUIRED_INPUTS["requirement_registry"])
    summary_rows = load_csv(REQUIRED_INPUTS["summary_reconciliation"])
    audience_rows = load_csv(REQUIRED_INPUTS["audience_surface_inventory"])
    route_rows = load_csv(REQUIRED_INPUTS["route_family_inventory"])
    endpoint_rows = load_csv(REQUIRED_INPUTS["endpoint_matrix"])
    classification_rows = load_csv(REQUIRED_INPUTS["data_classification"])
    runtime_payload = load_json(REQUIRED_INPUTS["runtime_topology"])
    workspace_payload = load_json(REQUIRED_INPUTS["workspace_graph"])
    state_payload = load_json(REQUIRED_INPUTS["state_machines"])
    dependency_payload = load_json(REQUIRED_INPUTS["external_dependencies"])
    service_rows = load_csv(REQUIRED_INPUTS["service_runtime"])
    ui_contract_rows = load_csv(REQUIRED_INPUTS["ui_contract_publication"])
    tooling_rows = load_csv(REQUIRED_INPUTS["tooling_scorecard"])
    supply_chain_payload = load_json(REQUIRED_INPUTS["supply_chain"])

    requirement_ids = {row["requirement_id"] for row in requirement_rows}
    key_requirements = [
        "REQ-OBJ-routeintentbinding",
        "REQ-OBJ-commandsettlementrecord",
        "REQ-OBJ-releaseapprovalfreeze",
        "REQ-OBJ-channelreleasefreezerecord",
        "REQ-OBJ-assuranceslicetrustrecord",
        "REQ-OBJ-designcontractpublicationbundle",
        "REQ-OBJ-audiencesurfaceruntimebinding",
        "REQ-OBJ-operationalreadinesssnapshot",
        "REQ-OBJ-recoverycontrolposture",
        "REQ-OBJ-lifecyclecoordinator",
    ]
    missing_requirement_ids = [req for req in key_requirements if req not in requirement_ids]
    if missing_requirement_ids:
        joined = ", ".join(missing_requirement_ids)
        raise SystemExit(f"PREREQUISITE_GAP_REQUIREMENT_REGISTRY: missing {joined}")

    return {
        "product_scope": product_scope,
        "requirement_rows": requirement_rows,
        "summary_rows": summary_rows,
        "audience_rows": audience_rows,
        "route_rows": route_rows,
        "endpoint_rows": endpoint_rows,
        "classification_rows": classification_rows,
        "runtime_payload": runtime_payload,
        "workspace_payload": workspace_payload,
        "state_payload": state_payload,
        "dependency_payload": dependency_payload,
        "service_rows": service_rows,
        "ui_contract_rows": ui_contract_rows,
        "tooling_rows": tooling_rows,
        "supply_chain_payload": supply_chain_payload,
        "summary": {
            "requirement_count": len(requirement_rows),
            "reconciliation_count": len(summary_rows),
            "audience_surface_count": len(audience_rows),
            "route_family_count": len(route_rows),
            "endpoint_count": len(endpoint_rows),
            "classification_count": len(classification_rows),
            "trust_zone_count": len(runtime_payload.get("trust_zones", [])),
            "workload_family_count": len(runtime_payload.get("runtime_workload_families", [])),
            "gateway_surface_count": len(runtime_payload.get("gateway_surface_matrix", [])),
            "acting_scope_count": len(runtime_payload.get("acting_scope_tuple_matrix", [])),
            "workspace_package_count": len(workspace_payload.get("workspace_packages", [])),
            "import_boundary_rule_count": len(workspace_payload.get("import_boundary_rules", {}).get("rules", [])),
            "state_machine_count": len(state_payload.get("machines", [])),
            "dependency_count": len(dependency_payload.get("dependencies", [])),
            "service_component_count": len(service_rows),
            "design_contract_row_count": len(ui_contract_rows),
            "tooling_option_count": len(tooling_rows),
            "required_release_object_count": len(supply_chain_payload.get("required_object_bindings", [])),
        },
    }


def select_requirement_ids(
    requirement_rows: list[dict[str, Any]],
    keywords: list[str],
    limit: int = 8,
) -> list[str]:
    hits: list[str] = []
    lowered_keywords = [keyword.lower() for keyword in keywords]
    for row in requirement_rows:
        haystack_parts = [
            row.get("requirement_id", ""),
            row.get("requirement_title", ""),
            row.get("source_file", ""),
            row.get("source_heading_or_logical_block", ""),
            row.get("direct_quote_or_precise_paraphrase", ""),
            row.get("expected_behavior", ""),
            row.get("notes", ""),
            " ".join(row.get("primary_objects", [])),
        ]
        haystack = " ".join(haystack_parts).lower()
        if any(keyword in haystack for keyword in lowered_keywords):
            hits.append(row["requirement_id"])
    return unique(hits)[:limit]


def build_source_digest(source_refs: list[str], upstream_task_refs: list[str]) -> str:
    digest_input = "\n".join(sorted(source_refs) + sorted(upstream_task_refs)).encode()
    return hashlib.sha1(digest_input).hexdigest()[:12]


def build_adrs(prereqs: dict[str, Any]) -> list[dict[str, Any]]:
    requirement_rows = prereqs["requirement_rows"]
    adrs: list[dict[str, Any]] = []

    def add_adr(definition: dict[str, Any]) -> None:
        linked_requirement_ids = select_requirement_ids(
            requirement_rows,
            definition.pop("requirement_keywords"),
        )
        if not linked_requirement_ids:
            linked_requirement_ids = ["REQ-SRC-phase-0-the-foundation-protocol-md"]
        definition["linked_requirement_ids"] = linked_requirement_ids
        definition["source_refs"] = unique(definition["source_refs"])
        definition["upstream_task_refs"] = unique(definition["upstream_task_refs"])
        definition["affected_phase_refs"] = unique(definition["affected_phase_refs"])
        definition["affected_bounded_context_refs"] = unique(definition["affected_bounded_context_refs"])
        definition["affected_persona_refs"] = unique(definition["affected_persona_refs"])
        definition["affected_channel_refs"] = unique(definition["affected_channel_refs"])
        definition["accepted_alternative_refs"] = unique(definition["accepted_alternative_refs"])
        definition["rejected_alternative_refs"] = unique(definition["rejected_alternative_refs"])
        definition["consequences_positive"] = unique(definition["consequences_positive"])
        definition["consequences_negative"] = unique(definition["consequences_negative"])
        definition["required_follow_on_task_refs"] = unique(definition["required_follow_on_task_refs"])
        definition["linked_risk_ids"] = unique(definition["linked_risk_ids"])
        definition["validation_obligations"] = unique(definition["validation_obligations"])
        definition["linked_view_ids"] = unique(definition["linked_view_ids"])
        definition["linked_contract_refs"] = unique(definition["linked_contract_refs"])
        adrs.append(definition)

    shared_current_phases = [
        "phase_0",
        "phase_1",
        "phase_2",
        "phase_3",
        "phase_4",
        "phase_5",
        "phase_6",
        "phase_8",
        "phase_9",
        "cross_phase",
    ]

    add_adr(
        {
            "adr_id": "ADR-016-001",
            "decision_family": "product_shape",
            "title": "Vecells-first domain truth with FHIR only at the representation boundary",
            "status": "accepted",
            "scope": "platform",
            "problem_statement": (
                "The platform needs one canonical request, lineage, evidence, task, and closure model. "
                "If FHIR resources, route payloads, or partner-specific shapes become the hidden write model, "
                "state truth fragments across phases and integrations."
            ),
            "decision": (
                "Freeze the Vecells-first domain model as canonical truth. FHIR remains a governed "
                "representation and interchange boundary through FhirRepresentationContract, "
                "FhirRepresentationSet, and FhirExchangeBundle, never the internal lifecycle owner."
            ),
            "why_now": (
                "Tasks 005, 006, and 013 already established lineage, object, and backend runtime law. "
                "Seq_016 must stop later work from relitigating canonical truth ownership."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine",
                "forensic-audit-findings.md#Finding 57",
                "13_fhir_representation_and_projection_boundary.md",
                "05_request_lineage_model.md",
                "06_object_catalog.md",
            ],
            "upstream_task_refs": ["seq_005", "seq_006", "seq_013", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "shared_kernel",
                "intake_safety",
                "identity_access",
                "triage_workspace",
                "booking",
                "hub_coordination",
                "pharmacy",
                "communications",
                "audit_compliance",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "hub_staff",
                "pharmacy_staff",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "telephony",
                "secure_link",
                "support_console",
                "partner_callback",
            ],
            "accepted_alternative_refs": [
                "ALT-016-001A_OPTIONAL_PDS_ENRICHMENT_BEHIND_ADAPTER_SEAM",
                "ALT-016-001B_DERIVED_FHIR_REPRESENTATIONS_FOR_INTEROPERABILITY",
            ],
            "rejected_alternative_refs": [
                "ALT-016-001R_FHIR_AS_CANONICAL_WRITE_MODEL",
                "ALT-016-001S_CHANNEL_SPECIFIC_REQUEST_MODELS",
            ],
            "consequences_positive": [
                "Canonical closure, lifecycle, and replay behavior remain domain-owned and testable.",
                "Supplier, channel, and FHIR variance stays outside the core write model.",
                "Later tasks can trace partner exchange back to one governing aggregate and evidence chain.",
            ],
            "consequences_negative": [
                "FHIR mapping and projection code remains an explicit maintenance surface.",
                "Teams must resist convenience shortcuts that treat partner payloads as domain truth.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_019", "seq_020", "seq_040"],
            "linked_risk_ids": [
                "GAP_016_SCATTERED_DECISION_FREEZE",
                "RISK_016_DIRECT_FHIR_TRUTH_DRIFT",
            ],
            "validation_obligations": [
                "Prove FHIR resources are emitted only from the governed representation boundary.",
                "Reject any design, gateway, or adapter work that writes request truth directly through FHIR payloads.",
            ],
            "notes": (
                "This ADR freezes the product shape described in the blueprint corpus and prevents "
                "later integration work from turning a representation contract into the lifecycle owner."
            ),
            "linked_view_ids": [
                "view_system_context",
                "view_domain_runtime_control_plane",
                "view_data_event_storage_integration",
            ],
            "linked_contract_refs": [
                "FhirRepresentationContract",
                "FhirRepresentationSet",
                "FhirExchangeBundle",
                "RuntimePublicationBundle",
            ],
            "requirement_keywords": [
                "FhirRepresentationContract",
                "FhirRepresentationSet",
                "FhirExchangeBundle",
                "Vecells domain model",
                "no app can own truth",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-002",
            "decision_family": "repository_shape",
            "title": "Modular pnpm plus Nx monorepo with bounded-context package law",
            "status": "accepted",
            "scope": "platform",
            "problem_statement": (
                "The platform spans multiple shells, services, contracts, and control-plane packages. "
                "If repository shape follows framework convenience or app ownership, sibling contexts "
                "will reach through one another and hidden truth owners will emerge."
            ),
            "decision": (
                "Freeze the repository as a modular pnpm plus Nx monorepo. Bounded-context packages, "
                "published contracts, design-contract packages, and generated artifacts remain the only "
                "legal cross-context integration surfaces."
            ),
            "why_now": (
                "Tasks 011-015 already depend on the workspace graph and boundary rules. Seq_016 turns "
                "that baseline into architecture law for all later implementation work."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture",
                "12_monorepo_build_system_decision.md",
                "12_workspace_layout_and_boundary_rules.md",
                "12_import_boundary_and_codeowners_policy.md",
            ],
            "upstream_task_refs": ["seq_011", "seq_012", "seq_014", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "shared_kernel",
                "release_control",
                "governance_admin",
                "operations",
                "triage_workspace",
                "booking",
                "pharmacy",
            ],
            "affected_persona_refs": [
                "staff_engineer",
                "platform_engineer",
                "governance_admin",
                "operations_analyst",
            ],
            "affected_channel_refs": ["repo", "ci", "preview", "browser"],
            "accepted_alternative_refs": [
                "ALT-016-002A_GENERATED_ARTIFACTS_UNDER_PACKAGES_GENERATED",
                "ALT-016-002B_TOOLING_ONLY_PYTHON_UNDER_TOOLS_ANALYSIS",
            ],
            "rejected_alternative_refs": [
                "ALT-016-002R_POLYREPO_PER_SURFACE",
                "ALT-016-002S_FRAMEWORK_SLICED_DIRECTORY_OWNERSHIP",
            ],
            "consequences_positive": [
                "Cross-context truth remains machine-checkable through import rules and code owners.",
                "Typed contracts, design contracts, and release publication artifacts can be generated and verified consistently.",
            ],
            "consequences_negative": [
                "Teams must work within stricter package boundaries and explicit publication points.",
                "Nx graph and export-map discipline become mandatory developer workflow requirements.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_019", "seq_020", "seq_041"],
            "linked_risk_ids": [
                "GAP_016_SCATTERED_DECISION_FREEZE",
                "RISK_016_SIBLING_CONTEXT_REACH_THROUGH",
            ],
            "validation_obligations": [
                "Fail CI when apps or services import sibling domain internals.",
                "Keep generated artifacts derivative-only and traceable to source contract digests.",
            ],
            "notes": (
                "This ADR codifies the baseline already chosen in seq_012 and keeps repo topology "
                "aligned with no-app-owns-truth and design-contract publication law."
            ),
            "linked_view_ids": ["view_container_topology", "view_frontend_gateway_design_contract"],
            "linked_contract_refs": [
                "RuntimePublicationBundle",
                "DesignContractPublicationBundle",
                "AudienceSurfaceRuntimeBinding",
            ],
            "requirement_keywords": [
                "modular monorepo",
                "no app can own truth",
                "published contracts",
                "DesignContractPublicationBundle",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-003",
            "decision_family": "tenant_acting_scope",
            "title": "Shared platform with tenant-scoped runtime slices and governed ActingScopeTuple",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "Vecells needs tenant isolation without losing shared platform economics and cross-organisation "
                "operations. Ambient session scope, route prefixes, or role names cannot safely represent blast radius."
            ),
            "decision": (
                "Freeze the runtime as a shared platform with tenant-scoped runtime and data slices. "
                "All cross-organisation, support, governance, and elevated actions must bind an explicit "
                "ActingScopeTuple backed by StaffIdentityContext and ActingContext."
            ),
            "why_now": (
                "Seq_011 established the runtime model and seq_009 plus forensic Finding 114 established the "
                "governance drift risk. Seq_016 must make tuple-bound scope non-optional."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#StaffIdentityContext",
                "phase-0-the-foundation-protocol.md#ActingScopeTuple",
                "forensic-audit-findings.md#Finding 114 - Tenant and acting context could still drift between governance scope and live cross-organisation work",
                "11_tenant_model_and_acting_scope_strategy.md",
                "11_gateway_surface_and_runtime_topology_baseline.md",
            ],
            "upstream_task_refs": ["seq_009", "seq_011", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "identity_access",
                "support",
                "operations",
                "governance_admin",
                "release_control",
                "audit_compliance",
            ],
            "affected_persona_refs": [
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
                "platform_operator",
            ],
            "affected_channel_refs": [
                "staff_workspace",
                "support_console",
                "operations_console",
                "governance_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-003A_PUBLIC_PATIENT_FLOWS_WITHOUT_ACTING_SCOPE_TUPLES",
                "ALT-016-003B_SINGLE_TENANT_ACTIONS_WITH_EXACT_SCOPE_HASHES",
            ],
            "rejected_alternative_refs": [
                "ALT-016-003R_SESSION_ROLE_NAME_AS_SCOPE",
                "ALT-016-003S_PLATFORM_WIDE_AMBIENT_MUTATION_SCOPE",
            ],
            "consequences_positive": [
                "Blast radius, purpose-of-use, and elevation become machine-checkable rather than ambient UI posture.",
                "Governance, support, and cross-organisation work can remain same-shell while still freezing drifted tuples.",
            ],
            "consequences_negative": [
                "Operators must refresh or reissue scope tuples when organisation, purpose, or elevation changes.",
                "Some convenience cross-tenant workflows remain blocked until exact tuple coverage is published.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_TENANT_SCOPE_DRIFT",
                "FINDING_114",
            ],
            "validation_obligations": [
                "Require exact tuple hashes on governance, support, hub, and cross-organisation actions.",
                "Freeze writable posture when scope tuples or visibility coverage drift.",
            ],
            "notes": (
                "Patient public intake remains a valid non-tuple posture, but any privileged or cross-tenant "
                "surface must bind the full tuple."
            ),
            "linked_view_ids": [
                "view_system_context",
                "view_container_topology",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "ActingScopeTuple",
                "AssuranceSliceTrustRecord",
                "AudienceSurfaceRuntimeBinding",
            ],
            "requirement_keywords": [
                "ActingScopeTuple",
                "StaffIdentityContext",
                "ActingContext",
                "tenant",
                "governance scope",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-004",
            "decision_family": "runtime_topology",
            "title": "Dual-UK-region runtime topology with trust zones and browser-to-gateway boundaries",
            "status": "accepted",
            "scope": "platform",
            "problem_statement": (
                "The runtime needs UK residency, predictable failover, and strict trust-zone behavior. "
                "Allowing browsers, shells, or public edges to infer or bypass internal topology would "
                "break the residency, release, and resilience model."
            ),
            "decision": (
                "Freeze the runtime topology as a dual-UK-region shared platform with trust zones, "
                "published gateway surfaces, and no browser reachability beyond the public edge and "
                "declared gateway workloads."
            ),
            "why_now": (
                "Seq_011 already selected the topology. Seq_016 must make its trust-zone and egress law "
                "authoritative before implementation begins."
            ),
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#Runtime topology contract",
                "platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
                "11_cloud_region_and_residency_decision.md",
                "11_trust_zone_and_workload_family_strategy.md",
                "11_region_resilience_and_failover_posture.md",
            ],
            "upstream_task_refs": ["seq_011", "seq_013", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "shared_kernel",
                "release_control",
                "operations",
                "governance_admin",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "gateway",
                "runtime_worker",
                "partner_adapter",
                "operations_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-004A_REGION_LOCAL_NON_AUTHORITATIVE_CACHE",
                "ALT-016-004B_SECONDARY_REGION_WARM_STANDBY_WITH_EXACT_PROMOTION_GATES",
            ],
            "rejected_alternative_refs": [
                "ALT-016-004R_SINGLE_REGION_NO_FAILOVER",
                "ALT-016-004S_BROWSER_DIRECT_TO_DOMAIN_OR_ADAPTER",
            ],
            "consequences_positive": [
                "UK residency, trust zones, and failover posture are explicit and consistent across teams.",
                "Gateway and browser law remains aligned with release, continuity, and resilience tuples.",
            ],
            "consequences_negative": [
                "All egress and callback paths must use the declared workload families and outbox discipline.",
                "Secondary-region promotion requires stricter parity and readiness evidence than ad hoc infrastructure failover.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020"],
            "linked_risk_ids": ["RISK_016_TOPOLOGY_BYPASS"],
            "validation_obligations": [
                "Verify every browser-callable route resolves through a published gateway surface.",
                "Fail release when topology, publication parity, or resilience tuples drift.",
            ],
            "notes": (
                "This ADR formalizes the runtime posture already selected in seq_011 and keeps the "
                "public edge, trust zones, and egress law visible in every later phase."
            ),
            "linked_view_ids": ["view_system_context", "view_container_topology", "view_release_assurance_resilience"],
            "linked_contract_refs": [
                "RuntimeTopologyManifest",
                "GatewayBffSurface",
                "ReleaseWatchTuple",
                "OperationalReadinessSnapshot",
            ],
            "requirement_keywords": [
                "RuntimeTopologyManifest",
                "TrustZoneBoundary",
                "GatewayBffSurface",
                "UK-hosted",
                "browser",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-005",
            "decision_family": "gateway_bff",
            "title": "Audience-specific gateway surfaces with route-family publication instead of one generic BFF",
            "status": "accepted",
            "scope": "audience_surface",
            "problem_statement": (
                "Vecells exposes multiple shells, trust postures, and recovery behaviors. A single generic BFF "
                "or framework-hidden server boundary would blur route authority and mix audience contracts."
            ),
            "decision": (
                "Freeze route-family and audience-specific published gateway surfaces. Browsers consume "
                "FrontendContractManifest and GatewayBffSurface publications, not framework-local server actions "
                "or direct service calls."
            ),
            "why_now": (
                "Seq_014 selected the browser runtime and route-family split. Seq_016 needs to turn that "
                "published surface split into architecture law."
            ),
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#GatewayBffSurface",
                "platform-runtime-and-release-blueprint.md#FrontendContractManifest",
                "14_gateway_bff_pattern_and_surface_split.md",
                "14_shell_and_route_runtime_architecture.md",
            ],
            "upstream_task_refs": ["seq_011", "seq_014", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "identity_access",
                "triage_workspace",
                "booking",
                "hub_coordination",
                "pharmacy",
                "support",
                "operations",
                "governance_admin",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "secure_link",
                "embedded_browser",
                "support_console",
                "operations_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-005A_ROUTE_FAMILY_SPLIT_WITH_TYPED_CLIENTS",
                "ALT-016-005B_SUMMARY_ONLY_RECOVERY_VIA_RELEASE_RECOVERY_DISPOSITION",
            ],
            "rejected_alternative_refs": [
                "ALT-016-005R_ONE_GENERIC_BFF",
                "ALT-016-005S_FRAMEWORK_OWNED_SERVER_ACTION_BOUNDARIES",
            ],
            "consequences_positive": [
                "Browser authority, gateway responsibility, and release recovery posture remain explicit.",
                "Different audiences can diverge safely in trust posture without restitching hidden server logic.",
            ],
            "consequences_negative": [
                "The platform maintains more published gateway surfaces than a single-BFF design.",
                "Route-family changes require synchronized contract publication and parity checks.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "FINDING_091",
                "RISK_016_HIDDEN_BFF_BOUNDARY",
            ],
            "validation_obligations": [
                "Block direct browser-to-adapter or browser-to-domain calls.",
                "Keep every route family inside the current FrontendContractManifest and AudienceSurfaceRuntimeBinding tuple.",
            ],
            "notes": (
                "This ADR closes the temptation to hide mutating or trust-bearing behavior in framework routing."
            ),
            "linked_view_ids": [
                "view_system_context",
                "view_container_topology",
                "view_frontend_gateway_design_contract",
            ],
            "linked_contract_refs": [
                "GatewayBffSurface",
                "FrontendContractManifest",
                "AudienceSurfaceRuntimeBinding",
                "ReleaseRecoveryDisposition",
            ],
            "requirement_keywords": [
                "GatewayBffSurface",
                "FrontendContractManifest",
                "AudienceSurfaceRuntimeBinding",
                "gateway",
                "browser authority",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-006",
            "decision_family": "state_and_event",
            "title": "Append-only state transition and event spine with projection-first browser reads",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "The platform must survive replay, retries, partner callbacks, and shell refreshes without "
                "letting direct table reads or optimistic UI state become canonical truth."
            ),
            "decision": (
                "Freeze append-only domain events, durable outbox and inbox handling, idempotent commands, "
                "and projection-first browser reads. CommandSettlementRecord, not local optimistic state, "
                "is the authoritative post-submit outcome bridge."
            ),
            "why_now": (
                "Seq_007 and seq_013 already defined the machine and backend baseline. Seq_016 must bind the "
                "state spine to shell, gateway, and release authority."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#RequestLifecycleLease",
                "phase-0-the-foundation-protocol.md#CommandSettlementRecord",
                "13_event_spine_and_namespace_baseline.md",
                "13_outbox_inbox_callback_replay_and_idempotency.md",
                "07_state_machine_atlas.md",
            ],
            "upstream_task_refs": ["seq_007", "seq_013", "seq_014", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "shared_kernel",
                "triage_workspace",
                "booking",
                "hub_coordination",
                "pharmacy",
                "communications",
                "audit_compliance",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "hub_staff",
                "pharmacy_staff",
                "support_operator",
            ],
            "affected_channel_refs": [
                "browser",
                "callback",
                "message",
                "telephony",
                "partner_adapter",
            ],
            "accepted_alternative_refs": [
                "ALT-016-006A_READ_MODELS_REBUILT_FROM_EVENT_SPINE",
                "ALT-016-006B_PENDING_OR_REVIEW_SETTLEMENT_WITH_SAME_SHELL_RECOVERY",
            ],
            "rejected_alternative_refs": [
                "ALT-016-006R_DIRECT_TABLE_READS_AS_BROWSER_TRUTH",
                "ALT-016-006S_TRANSPORT_ACK_AS_BUSINESS_SUCCESS",
            ],
            "consequences_positive": [
                "Replay, callback repair, and projection rebuild stay deterministic across phases.",
                "Browser state remains explainable through projections and command settlement instead of stale local caches.",
            ],
            "consequences_negative": [
                "Teams must maintain read models, settlement envelopes, and replay-safe dedupe strategies.",
                "User-visible updates may remain locally acknowledged but not authoritative until settlement or projection catches up.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "RISK_016_PROJECTION_OR_SETTLEMENT_DRIFT",
                "FINDING_091",
            ],
            "validation_obligations": [
                "Require durable outbox or queue positions for consequential mutations.",
                "Require CommandSettlementRecord or command-following projection truth before user-visible finality.",
            ],
            "notes": (
                "This ADR covers the event spine, state machine atlas, and browser truth law in one frozen decision."
            ),
            "linked_view_ids": [
                "view_domain_runtime_control_plane",
                "view_data_event_storage_integration",
                "view_frontend_gateway_design_contract",
            ],
            "linked_contract_refs": [
                "CommandSettlementRecord",
                "RouteIntentBinding",
                "RuntimePublicationBundle",
            ],
            "requirement_keywords": [
                "CommandSettlementRecord",
                "outbox",
                "inbox",
                "projection",
                "idempotency",
                "replay",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-007",
            "decision_family": "evidence_and_artifact",
            "title": "Immutable evidence and artifact pipeline with parity proof, redaction, and mode truth",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "The platform handles cross-channel evidence, transcripts, artifacts, and patient-safe summaries. "
                "If raw uploads, previews, or handoff copies become mutable or route-local, safety and disclosure drift."
            ),
            "decision": (
                "Freeze immutable EvidenceCaptureBundle, EvidenceDerivationPackage, EvidenceRedactionTransform, "
                "EvidenceSummaryParityRecord, and artifact-mode truth as runtime contracts. Artifact preview, "
                "handoff, and constrained-channel posture must resolve through published contracts, not implementation detail."
            ),
            "why_now": (
                "Seq_010 fixed classification and seq_013 fixed storage boundaries. Seq_016 now binds evidence, "
                "redaction, and artifact posture into architecture law."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#EvidenceCaptureBundle",
                "phase-0-the-foundation-protocol.md#EvidenceSummaryParityRecord",
                "phase-0-the-foundation-protocol.md#VisibilityProjectionPolicy",
                "forensic-audit-findings.md#Finding 115 - Artifact preview and handoff still lacked one live mode-truth contract for constrained channels",
                "10_data_classification_model.md",
                "13_storage_and_persistence_baseline.md",
            ],
            "upstream_task_refs": ["seq_005", "seq_010", "seq_013", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "intake_safety",
                "communications",
                "support",
                "triage_workspace",
                "audit_compliance",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "telephony",
                "secure_link",
                "artifact_handoff",
                "support_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-007A_SUMMARY_ONLY_ARTIFACT_POSTURE_WHEN_PARITY_OR_DISCLOSURE_DRIFTS",
                "ALT-016-007B_CHANNEL_SPECIFIC_ARTIFACT_EXPOSURE_ONLY_THROUGH_PUBLISHED_POLICY",
            ],
            "rejected_alternative_refs": [
                "ALT-016-007R_MUTABLE_UPLOADS_OR_SUMMARIES_AS_TRUTH",
                "ALT-016-007S_ROUTE_LOCAL_ARTIFACT_MODE_LABELS",
            ],
            "consequences_positive": [
                "Safety review, dispute resolution, and patient-safe copies all trace back to immutable evidence.",
                "Artifact posture remains consistent across shells, exports, and constrained channels.",
            ],
            "consequences_negative": [
                "The evidence pipeline carries more explicit objects and parity checks.",
                "Surfaces may degrade to summary-only or handoff-ready posture when parity or disclosure proof drifts.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_ARTIFACT_MODE_TRUTH",
                "FINDING_115",
            ],
            "validation_obligations": [
                "Prove every user-visible summary or artifact copy can cite the current parity and redaction contract.",
                "Fail closed when artifact posture is not reachable from the current runtime publication tuple.",
            ],
            "notes": (
                "The architecture now treats artifact mode truth as a cross-phase contract, not a frontend rendering choice."
            ),
            "linked_view_ids": ["view_data_event_storage_integration", "view_frontend_gateway_design_contract"],
            "linked_contract_refs": [
                "DesignContractPublicationBundle",
                "AudienceSurfaceRuntimeBinding",
                "ReleasePublicationParityRecord",
            ],
            "requirement_keywords": [
                "EvidenceCaptureBundle",
                "EvidenceDerivationPackage",
                "EvidenceRedactionTransform",
                "EvidenceSummaryParityRecord",
                "ArtifactSurfaceFrame",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-008",
            "decision_family": "lifecycle_control",
            "title": "LifecycleCoordinator, route intent, and command settlement are the only legal cross-domain mutation spine",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "Without one lifecycle authority, child domains or routes can directly write Request.workflowState, "
                "derive closure, or widen mutation scope from stale local context."
            ),
            "decision": (
                "Freeze LifecycleCoordinator as the sole cross-domain lifecycle owner. Every post-submit mutation "
                "must bind a live RouteIntentBinding, settle through CommandActionRecord and CommandSettlementRecord, "
                "and leave request-level closure or reopen decisions to the coordinator."
            ),
            "why_now": (
                "Forensic Findings 91 and the earlier booking, hub, pharmacy, and triage findings already forced "
                "this separation. Seq_016 makes it architecture law rather than a pattern hidden in phase prose."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#LifecycleCoordinator",
                "phase-0-the-foundation-protocol.md#RequestClosureRecord",
                "phase-0-the-foundation-protocol.md#RouteIntentBinding",
                "phase-0-the-foundation-protocol.md#CommandSettlementRecord",
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
                "forensic-audit-findings.md#Findings 48-50",
            ],
            "upstream_task_refs": ["seq_005", "seq_007", "seq_013", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "triage_workspace",
                "booking",
                "hub_coordination",
                "pharmacy",
                "support",
                "shared_kernel",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "hub_staff",
                "pharmacy_staff",
                "support_operator",
            ],
            "affected_channel_refs": [
                "browser",
                "telephony",
                "support_console",
                "partner_callback",
            ],
            "accepted_alternative_refs": [
                "ALT-016-008A_CHILD_DOMAINS_EMIT_MILESTONES_ONLY",
                "ALT-016-008B_SAME_SHELL_RECOVERY_ON_STALE_ROUTE_INTENT",
            ],
            "rejected_alternative_refs": [
                "ALT-016-008R_CHILD_DOMAIN_DIRECT_REQUEST_STATE_WRITES",
                "ALT-016-008S_URL_OR_LOCAL_CACHE_AS_MUTATION_AUTHORITY",
            ],
            "consequences_positive": [
                "Canonical closure and governed reopen behavior become consistent across booking, hub, pharmacy, messaging, and support paths.",
                "Stale or ambiguous mutations can recover in place instead of mutating the wrong object.",
            ],
            "consequences_negative": [
                "Mutation pathways must carry more explicit target-tuple, settlement, and fence metadata.",
                "Legacy convenience CTAs that cannot emit exact route intent remain recovery-only until replaced.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY",
                "RISK_016_CANONICAL_CLOSURE_DRIFT",
                "FINDING_091",
            ],
            "validation_obligations": [
                "Reject writable routes without a live RouteIntentBinding.",
                "Reject any path where a child domain writes canonical request closure directly.",
            ],
            "notes": (
                "LifecycleCoordinator and settlement law are what prevent route-local shortcuts from becoming platform truth."
            ),
            "linked_view_ids": [
                "view_domain_runtime_control_plane",
                "view_frontend_gateway_design_contract",
                "view_data_event_storage_integration",
            ],
            "linked_contract_refs": [
                "LifecycleCoordinator",
                "RouteIntentBinding",
                "CommandSettlementRecord",
            ],
            "requirement_keywords": [
                "LifecycleCoordinator",
                "RouteIntentBinding",
                "CommandSettlementRecord",
                "RequestClosureRecord",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-009",
            "decision_family": "integration",
            "title": "Integrations remain adapter-seamed, capability-matrix bound, and proof-settled",
            "status": "accepted",
            "scope": "integration",
            "problem_statement": (
                "Identity, telephony, messaging, booking, hub, and pharmacy integrations vary by tenant and supplier. "
                "If supplier logic leaks into the core model or transport success is treated as business success, "
                "the platform loses deterministic truth and safe degraded behavior."
            ),
            "decision": (
                "Freeze integrations behind adapter contracts, supplier capability matrices, and proof-based settlement. "
                "Transport acknowledgements, weak provider receipts, or mailbox delivery alone never become business truth."
            ),
            "why_now": (
                "Seq_008 and seq_013 already chose adapter seams and proof discipline. Seq_016 must make them the "
                "only legal integration baseline before external provisioning work begins."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#FhirExchangeBundle",
                "phase-0-the-foundation-protocol.md#PharmacyCorrelationRecord",
                "08_external_dependency_inventory.md",
                "08_dependency_truth_and_fallback_matrix.md",
                "13_async_workflow_timer_and_effect_processing.md",
                "13_outbox_inbox_callback_replay_and_idempotency.md",
            ],
            "upstream_task_refs": ["seq_008", "seq_013", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "identity_access",
                "booking",
                "hub_coordination",
                "pharmacy",
                "communications",
                "support",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "hub_staff",
                "pharmacy_staff",
                "support_operator",
                "platform_operator",
            ],
            "affected_channel_refs": [
                "nhs_login",
                "telephony",
                "sms",
                "email",
                "gp_partner",
                "pharmacy_partner",
            ],
            "accepted_alternative_refs": [
                "ALT-016-009A_SUPPLIER_VARIANCE_BEHIND_DECLARED_ADAPTER_PROFILES",
                "ALT-016-009B_OPTIONAL_PDS_ENRICHMENT_THROUGH_NON_AUTHORITATIVE_ADAPTER",
            ],
            "rejected_alternative_refs": [
                "ALT-016-009R_SUPPLIER_SPECIFIC_CORE_MODEL_BRANCHES",
                "ALT-016-009S_TRANSPORT_SUCCESS_EQUALS_BUSINESS_SETTLEMENT",
            ],
            "consequences_positive": [
                "The core model stays stable while tenant capability variance remains explicit at the edge.",
                "Degraded and recovery behavior can be expressed consistently across partner types.",
            ],
            "consequences_negative": [
                "Adapter and proof objects add latency and more explicit asynchronous state.",
                "Some partner flows remain pending or reconciliation-required for longer before patient-final reassurance is legal.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_040"],
            "linked_risk_ids": [
                "RISK_016_TRANSPORT_AS_TRUTH",
                "RISK_016_SUPPLIER_LOGIC_IN_CORE",
            ],
            "validation_obligations": [
                "Require authoritative proof state or settlement object before route-final or patient-final truth is published.",
                "Keep supplier-specific capability branches out of shared kernel and lifecycle ownership code.",
            ],
            "notes": (
                "This ADR covers every current baseline integration while leaving future provisioning work for later roadmap tasks."
            ),
            "linked_view_ids": ["view_system_context", "view_data_event_storage_integration"],
            "linked_contract_refs": [
                "AdapterContractProfile",
                "CommandSettlementRecord",
                "AssuranceSliceTrustRecord",
            ],
            "requirement_keywords": [
                "FhirExchangeBundle",
                "PharmacyCorrelationRecord",
                "authoritative proof",
                "adapter",
                "capability matrix",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-010",
            "decision_family": "frontend_shell",
            "title": "Persistent shell law, design-contract publication, and same-shell continuity are core architecture",
            "status": "accepted",
            "scope": "audience_surface",
            "problem_statement": (
                "Shell continuity, selected anchors, artifact posture, and DOM contract markers can still drift into "
                "route-local behavior if they are treated as frontend styling rather than architecture."
            ),
            "decision": (
                "Freeze the frontend architecture as persistent shells governed by ShellContinuityFrame, "
                "ContinuityFrame, ContinuityTransitionCheckpoint, ShellBoundaryDecision, and published "
                "DesignContractPublicationBundle plus AudienceSurfaceRuntimeBinding tuples."
            ),
            "why_now": (
                "Seq_014 chose the shell runtime, while forensic Findings 107-120 proved that continuity proof "
                "and degraded posture must stay cross-phase. Seq_016 makes that law explicit."
            ),
            "source_refs": [
                "platform-frontend-blueprint.md#0.2 Continuity key and shell law",
                "platform-frontend-blueprint.md#1. Required experience topology and primitives",
                "platform-frontend-blueprint.md#12A. The active DesignContractPublicationBundle and DesignContractLintVerdict must remain current",
                "forensic-audit-findings.md#Findings 107-120",
                "14_shell_and_route_runtime_architecture.md",
                "14_design_system_and_contract_publication_strategy.md",
            ],
            "upstream_task_refs": ["seq_004", "seq_010", "seq_014", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "identity_access",
                "triage_workspace",
                "support",
                "operations",
                "governance_admin",
                "shared_kernel",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "secure_link",
                "embedded_browser",
                "operations_console",
                "governance_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-010A_SAME_SHELL_OBJECT_SWITCH_WITH_EXACT_CHECKPOINTS",
                "ALT-016-010B_SUMMARY_ONLY_OR_RECOVERY_ONLY_POSTURE_WHEN_PUBLICATION_DRIFTS",
            ],
            "rejected_alternative_refs": [
                "ALT-016-010R_ROUTE_LOCAL_SHELL_OWNERSHIP",
                "ALT-016-010S_UNPUBLISHED_TOKEN_OR_MARKER_VOCABULARY",
            ],
            "consequences_positive": [
                "Shell continuity, degraded posture, and automation markers remain stable across all current baseline surfaces.",
                "Frontend runtime and release posture stay synchronized through published design-contract bundles.",
            ],
            "consequences_negative": [
                "Route families must carry explicit shell ownership claims and DOM contract markers.",
                "Mixed token exports, stale design digests, or missing lint verdicts now force visible downgrade instead of permissive rendering.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY",
                "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT",
                "FINDING_118",
            ],
            "validation_obligations": [
                "Keep every writable or calmly trustworthy surface bound to current design and runtime publication tuples.",
                "Preserve same-shell recovery rather than hard navigation when continuity proof is still valid.",
            ],
            "notes": (
                "Frontend architecture is treated as cross-phase law, not an app-local implementation preference."
            ),
            "linked_view_ids": [
                "view_system_context",
                "view_frontend_gateway_design_contract",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "AudienceSurfaceRuntimeBinding",
                "DesignContractPublicationBundle",
                "FrontendContractManifest",
                "RouteIntentBinding",
            ],
            "requirement_keywords": [
                "ShellContinuityFrame",
                "ContinuityFrame",
                "ContinuityTransitionCheckpoint",
                "ShellBoundaryDecision",
                "DesignContractPublicationBundle",
                "AudienceSurfaceRuntimeBinding",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-011",
            "decision_family": "release_and_trust",
            "title": "ReleaseApprovalFreeze and publication tuples freeze writable posture",
            "status": "accepted",
            "scope": "release",
            "problem_statement": (
                "Compiled artifacts, route contracts, design contracts, and recovery posture can drift if "
                "release authority is reduced to CI status or dashboard interpretation."
            ),
            "decision": (
                "Freeze release authority around ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, "
                "RuntimePublicationBundle, ReleasePublicationParityRecord, ReleaseWatchTuple, "
                "WaveObservationPolicy, and audience-specific ReleaseRecoveryDisposition."
            ),
            "why_now": (
                "Seq_015 selected the release tooling baseline and forensic Findings 91 and 95 proved the gap. "
                "Seq_016 makes publication and trust tuples architectural rather than operational folklore."
            ),
            "source_refs": [
                "phase-0-the-foundation-protocol.md#ReleaseApprovalFreeze",
                "phase-0-the-foundation-protocol.md#ChannelReleaseFreezeRecord",
                "phase-0-the-foundation-protocol.md#RuntimePublicationBundle",
                "phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding",
                "platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
                "platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                "15_release_and_supply_chain_tooling_baseline.md",
                "forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
            ],
            "upstream_task_refs": ["seq_011", "seq_014", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "release_control",
                "operations",
                "governance_admin",
                "support",
                "shared_kernel",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
                "platform_operator",
            ],
            "affected_channel_refs": [
                "browser",
                "embedded_browser",
                "operations_console",
                "governance_console",
                "release_pipeline",
            ],
            "accepted_alternative_refs": [
                "ALT-016-011A_AUDIENCE_SPECIFIC_RELEASE_RECOVERY_DISPOSITIONS",
                "ALT-016-011B_WATCH_AND_PUBLICATION_PARITY_IN_ONE_RELEASE_TUPLE",
            ],
            "rejected_alternative_refs": [
                "ALT-016-011R_CI_GREEN_EQUALS_RUNTIME_AUTHORITY",
                "ALT-016-011S_GENERIC_FALLBACK_POSTURE_FOR_ALL_AUDIENCES",
            ],
            "consequences_positive": [
                "Writable and calm posture freeze automatically when release, parity, or trust tuples drift.",
                "Operations and governance read the same release tuple that shells and gateways enforce.",
            ],
            "consequences_negative": [
                "Release promotion now depends on stricter parity, provenance, and publication evidence.",
                "Stale or missing audience-specific recovery dispositions block permissive fallbacks.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY",
                "FINDING_091",
                "FINDING_095",
                "GAP_015_HSM_SIGNING_KEY_PROVISIONING",
                "GAP_015_ALERT_DESTINATION_BINDING",
            ],
            "validation_obligations": [
                "Require exact publication parity and passing provenance before live writable posture.",
                "Reject any generic fallback that does not cite the current audience-specific ReleaseRecoveryDisposition.",
            ],
            "notes": (
                "This ADR is what binds release tooling outputs back into runtime truth and browser authority."
            ),
            "linked_view_ids": [
                "view_container_topology",
                "view_frontend_gateway_design_contract",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "ReleaseApprovalFreeze",
                "ChannelReleaseFreezeRecord",
                "RuntimePublicationBundle",
                "ReleasePublicationParityRecord",
                "ReleaseWatchTuple",
                "WaveObservationPolicy",
            ],
            "requirement_keywords": [
                "ReleaseApprovalFreeze",
                "ChannelReleaseFreezeRecord",
                "RuntimePublicationBundle",
                "ReleaseWatchTuple",
                "WaveObservationPolicy",
                "ReleaseRecoveryDisposition",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-012",
            "decision_family": "assurance_and_resilience",
            "title": "Assurance evidence, readiness, and recovery posture share one operational authority model",
            "status": "accepted",
            "scope": "assurance",
            "problem_statement": (
                "Operations, governance, and resilience surfaces can drift into separate mental models if runbooks, "
                "dashboards, and evidence packs are treated as loosely related references."
            ),
            "decision": (
                "Freeze assurance and resilience authority around AssuranceSliceTrustRecord, "
                "OperationalReadinessSnapshot, RecoveryControlPosture, ResilienceActionSettlement, "
                "and shared release-watch tuple consumption across operations and governance."
            ),
            "why_now": (
                "Seq_009 and seq_015 already defined the workstreams and tooling. Seq_016 must close the residual "
                "split identified in Findings 95 and 104-120."
            ),
            "source_refs": [
                "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",
                "phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme",
                "phase-0-the-foundation-protocol.md#OperationalReadinessSnapshot",
                "phase-0-the-foundation-protocol.md#RecoveryControlPosture",
                "forensic-audit-findings.md#Findings 104-120",
                "09_regulatory_workstreams.md",
                "15_operational_readiness_and_resilience_tooling.md",
            ],
            "upstream_task_refs": ["seq_009", "seq_011", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "operations",
                "governance_admin",
                "release_control",
                "audit_compliance",
                "support",
            ],
            "affected_persona_refs": [
                "operations_analyst",
                "governance_admin",
                "support_operator",
                "platform_operator",
            ],
            "affected_channel_refs": [
                "operations_console",
                "governance_console",
                "recovery_workbench",
                "assurance_board",
            ],
            "accepted_alternative_refs": [
                "ALT-016-012A_DIAGNOSTIC_VISIBILITY_WITH_FROZEN_CONTROLS_WHEN_POSTURE_DRIFTS",
                "ALT-016-012B_EVIDENCE_GRAPH_AS_THE_ONLY_ADMISSIBILITY_BACKBONE",
            ],
            "rejected_alternative_refs": [
                "ALT-016-012R_RUNBOOKS_AND_DASHBOARDS_AS_LIVE_AUTHORITY",
                "ALT-016-012S_OPS_AND_GOVERNANCE_WITH_SEPARATE_CONTINUITY_MODELS",
            ],
            "consequences_positive": [
                "Restore, failover, chaos, and cross-programme assurance use one tuple-bound authority model.",
                "Operations and governance boards can stay informative under drift without pretending to remain action-authoritative.",
            ],
            "consequences_negative": [
                "Recovery actions now require fresher readiness, runbook, and settlement evidence.",
                "Some diagnostic surfaces remain visible but control-frozen more often under degraded trust posture.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT",
                "FINDING_095",
                "FINDING_112",
                "FINDING_119",
            ],
            "validation_obligations": [
                "Block restore or failover actions when RecoveryControlPosture is stale, blocked, or diagnostic-only.",
                "Require operations and governance views to consume the same trust and readiness tuples.",
            ],
            "notes": (
                "This ADR explicitly closes the split between operational diagnosis and authoritative resilience control."
            ),
            "linked_view_ids": [
                "view_domain_runtime_control_plane",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "AssuranceSliceTrustRecord",
                "OperationalReadinessSnapshot",
                "RecoveryControlPosture",
                "ReleaseWatchTuple",
            ],
            "requirement_keywords": [
                "AssuranceSliceTrustRecord",
                "OperationalReadinessSnapshot",
                "RecoveryControlPosture",
                "resilience",
                "restore",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-013",
            "decision_family": "data_privacy_disclosure",
            "title": "Data classification, masking, and audit disclosure are runtime disclosure controls, not reporting policy only",
            "status": "accepted",
            "scope": "assurance",
            "problem_statement": (
                "PHI boundaries, break-glass behavior, support replay, and audit disclosure can drift if classification "
                "and masking remain document-only policies instead of runtime enforcement."
            ),
            "decision": (
                "Freeze data classification, redaction, masking, disclosure fences, break-glass scope rules, and "
                "artifact sensitivity classes as runtime contracts consumed by shells, exports, support replay, and audit."
            ),
            "why_now": (
                "Seq_010 already produced the classification and disclosure model. Seq_016 must now anchor it in "
                "the architecture so no later task treats it as adjacent compliance prose."
            ),
            "source_refs": [
                "10_data_classification_model.md",
                "10_phi_masking_and_redaction_policy.md",
                "10_audit_posture_and_event_disclosure.md",
                "10_break_glass_and_investigation_scope_rules.md",
                "phase-0-the-foundation-protocol.md#VisibilityProjectionPolicy",
                "forensic-audit-findings.md#Finding 116 - Accessibility announcements could still spam, replay stale cues, or blur provisional and authoritative meaning",
            ],
            "upstream_task_refs": ["seq_008", "seq_010", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "identity_access",
                "support",
                "operations",
                "governance_admin",
                "audit_compliance",
            ],
            "affected_persona_refs": [
                "patient",
                "clinician",
                "support_operator",
                "operations_analyst",
                "governance_admin",
            ],
            "affected_channel_refs": [
                "browser",
                "secure_link",
                "support_console",
                "audit_export",
                "artifact_handoff",
            ],
            "accepted_alternative_refs": [
                "ALT-016-013A_MINIMUM_NECESSARY_SUPPORT_REPLAY_WITH_DISCLOSURE_FENCES",
                "ALT-016-013B_SUMMARY_ONLY_DISCLOSURE_WHEN_PARITY_OR_CLASSIFICATION_DRIFTS",
            ],
            "rejected_alternative_refs": [
                "ALT-016-013R_SURFACE_LOCAL_MASKING_OVERRIDES",
                "ALT-016-013S_AUDIT_EXPORT_WITHOUT_RUNTIME_DISCLOSURE_BINDINGS",
            ],
            "consequences_positive": [
                "Disclosure, masking, and break-glass become testable runtime behaviors rather than policy claims.",
                "Support and audit surfaces can stay useful without exceeding minimum necessary posture.",
            ],
            "consequences_negative": [
                "More surfaces can degrade to summary-only, recovery-only, or masked replay under classification drift.",
                "New fields and artifact families require explicit classification and disclosure mappings before publication.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "RISK_016_DISCLOSURE_FENCE_DRIFT",
                "FINDING_116",
            ],
            "validation_obligations": [
                "Keep support replay, exports, and patient-safe copies inside classified disclosure envelopes.",
                "Fail any audit or replay pathway that cannot cite the current masking, redaction, and disclosure contract.",
            ],
            "notes": (
                "This ADR makes seq_010 a first-class architecture baseline instead of a documentation sidecar."
            ),
            "linked_view_ids": [
                "view_frontend_gateway_design_contract",
                "view_data_event_storage_integration",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "VisibilityProjectionPolicy",
                "AudienceSurfaceRuntimeBinding",
                "DesignContractPublicationBundle",
            ],
            "requirement_keywords": [
                "VisibilityProjectionPolicy",
                "masking",
                "redaction",
                "break glass",
                "audit disclosure",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-014",
            "decision_family": "bounded_assistive",
            "title": "Assistive capability stays optional, sidecar-bound, human-controlled, and kill-switchable",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "Assistive capability can reappear as a mandatory stage or central control-plane owner if its insertion limits "
                "are not frozen explicitly."
            ),
            "decision": (
                "Freeze assistive capability as an optional sidecar with human-controlled outputs, bounded insertion points, "
                "artifact-only semantics unless a later explicit intended-use ADR says otherwise, and an immediate kill-switch posture."
            ),
            "why_now": (
                "The earlier forensic work already removed mandatory AI. Seq_009 bounded the regulatory posture and seq_004 "
                "kept standalone assistive control surfaces conditional. Seq_016 must keep that boundary stable."
            ),
            "source_refs": [
                "forensic-audit-findings.md#Finding 17 - AI assistance was modeled as a mandatory linear stage",
                "04_surface_conflict_and_gap_report.md",
                "09_regulatory_workstreams.md",
                "03_deferred_and_conditional_scope.md",
            ],
            "upstream_task_refs": ["seq_003", "seq_004", "seq_009", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "triage_workspace",
                "support",
                "governance_admin",
                "operations",
            ],
            "affected_persona_refs": [
                "clinician",
                "support_operator",
                "governance_admin",
                "operations_analyst",
            ],
            "affected_channel_refs": [
                "clinical_workspace",
                "support_console",
                "governance_console",
            ],
            "accepted_alternative_refs": [
                "ALT-016-014A_ASSISTIVE_DISABLED_BY_DEFAULT",
                "ALT-016-014B_ASSISTIVE_ARTIFACTS_VISIBLE_WITH_HUMAN_REVIEW_ONLY",
            ],
            "rejected_alternative_refs": [
                "ALT-016-014R_ASSISTIVE_AS_MANDATORY_REVIEW_STAGE",
                "ALT-016-014S_ASSISTIVE_WRITES_CANONICAL_REQUEST_TRUTH",
            ],
            "consequences_positive": [
                "Core request progression remains human-governed and operationally resilient when assistive services are absent.",
                "The platform can still experiment with bounded assistive rollout cohorts safely.",
            ],
            "consequences_negative": [
                "Any assistive feature beyond sidecar artifacts requires later architecture and regulatory review.",
                "Some automation opportunities remain deliberately unavailable in the current baseline.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_ASSISTIVE_CENTRALITY",
                "RISK_016_ASSISTIVE_OVERREACH",
            ],
            "validation_obligations": [
                "Prevent assistive outputs from bypassing human control or command settlement.",
                "Ensure kill-switch posture leaves the rest of the baseline operationally intact.",
            ],
            "notes": (
                "The architecture explicitly treats assistive capability as bounded optionality rather than a foundation dependency."
            ),
            "linked_view_ids": ["view_domain_runtime_control_plane", "view_release_assurance_resilience"],
            "linked_contract_refs": [
                "AssuranceSliceTrustRecord",
                "ReleaseRecoveryDisposition",
            ],
            "requirement_keywords": [
                "assistive",
                "optional sidecar",
                "human control",
                "kill-switch",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-015",
            "decision_family": "architecture_control_plane",
            "title": "Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane",
            "status": "accepted",
            "scope": "cross_phase",
            "problem_statement": (
                "The corpus still had scattered control-plane concepts: route intent, design-contract publication, "
                "release tuples, watch tuples, continuity proof, readiness, and resilience authority could look like adjacent systems."
            ),
            "decision": (
                "Freeze one cross-phase architecture control plane that binds RouteIntentBinding, design-contract publication, "
                "runtime publication, release freeze, watch tuples, continuity evidence, readiness, and resilience posture into one "
                "programme-wide authority model. None of these concepts may remain phase-local conventions."
            ),
            "why_now": (
                "This is the exact seq_016 closure: the prior tasks produced the pieces, but not yet one explicit architecture decision "
                "that ties them together."
            ),
            "source_refs": [
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
                "forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
                "forensic-audit-findings.md#Findings 104-120",
                "phase-0-the-foundation-protocol.md#RuntimePublicationBundle",
                "phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding",
                "phase-0-the-foundation-protocol.md#OperationalReadinessSnapshot",
                "phase-0-the-foundation-protocol.md#RecoveryControlPosture",
            ],
            "upstream_task_refs": ["seq_011", "seq_014", "seq_015", "seq_016"],
            "affected_phase_refs": shared_current_phases,
            "affected_bounded_context_refs": [
                "release_control",
                "operations",
                "governance_admin",
                "support",
                "shared_kernel",
            ],
            "affected_persona_refs": [
                "patient",
                "support_operator",
                "operations_analyst",
                "governance_admin",
                "platform_operator",
            ],
            "affected_channel_refs": [
                "browser",
                "operations_console",
                "governance_console",
                "recovery_workbench",
            ],
            "accepted_alternative_refs": [
                "ALT-016-015A_SUMMARY_FIRST_CONTROL_PLANE_VIEWS_WITH_DIAGNOSTIC_DRILLDOWN",
                "ALT-016-015B_SHARED_TUPLE_HASHES_ACROSS_PUBLICATION_CONTINUITY_AND_RESILIENCE",
            ],
            "rejected_alternative_refs": [
                "ALT-016-015R_PHASE_LOCAL_CONTROL_CONVENTIONS",
                "ALT-016-015S_DESIGN_CONTRACT_OR_CONTINUITY_PROOF_AS_ADJACENT_DOCUMENTATION",
            ],
            "consequences_positive": [
                "Later autonomous agents can cite one control-plane law instead of restitching five prior task outputs.",
                "Ops, governance, browser shells, and release tooling now share one mental model for live authority.",
            ],
            "consequences_negative": [
                "The control-plane object set is larger and more explicit than a minimal runtime-only architecture.",
                "Teams must keep more tuple-bound evidence current before promoting writable posture.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_019", "seq_020"],
            "linked_risk_ids": [
                "GAP_016_SCATTERED_DECISION_FREEZE",
                "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY",
                "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT",
                "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT",
            ],
            "validation_obligations": [
                "Keep every control-plane tuple discoverable through published contracts and runtime markers.",
                "Reject any architecture view or task output that treats continuity proof, publication, or resilience authority as separate optional commentary.",
            ],
            "notes": (
                "This ADR is the canonical seq_016 freeze that binds the architecture pack together."
            ),
            "linked_view_ids": [
                "view_container_topology",
                "view_domain_runtime_control_plane",
                "view_frontend_gateway_design_contract",
                "view_release_assurance_resilience",
            ],
            "linked_contract_refs": [
                "RouteIntentBinding",
                "DesignContractPublicationBundle",
                "RuntimePublicationBundle",
                "ReleaseWatchTuple",
                "OperationalReadinessSnapshot",
                "RecoveryControlPosture",
            ],
            "requirement_keywords": [
                "DesignContractPublicationBundle",
                "AudienceSurfaceRuntimeBinding",
                "ReleaseWatchTuple",
                "OperationalReadinessSnapshot",
                "RecoveryControlPosture",
                "continuity proof",
            ],
        }
    )

    add_adr(
        {
            "adr_id": "ADR-016-016",
            "decision_family": "deferred_phase7_channel",
            "title": "Embedded NHS App channel remains deferred and non-authoritative in the current baseline",
            "status": "deferred",
            "scope": "audience_surface",
            "problem_statement": (
                "The current corpus includes embedded-channel compatibility contracts, but the product scope baseline "
                "explicitly defers Phase 7. Without an explicit deferred ADR, later tasks could silently pull it back in."
            ),
            "decision": (
                "Keep the embedded NHS App channel and any standalone assistive-control shell outside the accepted baseline. "
                "Current work may preserve compatibility contracts and deferred onboarding seams only."
            ),
            "why_now": (
                "Seq_003, seq_004, seq_008, and seq_009 all preserved this deferral. Seq_016 must freeze it so "
                "later tasks cannot reinterpret compatibility work as live baseline scope."
            ),
            "source_refs": [
                "03_product_scope_boundary.md",
                "03_deferred_and_conditional_scope.md",
                "04_surface_conflict_and_gap_report.md",
                "08_external_dependency_inventory.md",
                "09_regulatory_workstreams.md",
                "prompt/016.md",
            ],
            "upstream_task_refs": ["seq_003", "seq_004", "seq_008", "seq_009", "seq_016"],
            "affected_phase_refs": ["phase_7", "cross_phase"],
            "affected_bounded_context_refs": [
                "identity_access",
                "support",
                "release_control",
            ],
            "affected_persona_refs": [
                "patient",
                "support_operator",
                "governance_admin",
            ],
            "affected_channel_refs": ["embedded_nhs_app", "embedded_browser"],
            "accepted_alternative_refs": [
                "ALT-016-016A_COMPATIBILITY_CONTRACTS_ONLY_UNTIL_PHASE_7_REOPENED",
                "ALT-016-016B_NON_AUTHORITATIVE_SIMULATION_OR_PLACEHOLDER_ONLY",
            ],
            "rejected_alternative_refs": [
                "ALT-016-016R_EMBEDDED_WRITABLE_BASELINE_NOW",
                "ALT-016-016S_PHASE7_SCOPE_REINTRODUCED_THROUGH_ROUTE_OR_DESIGN_WORK",
            ],
            "consequences_positive": [
                "Current baseline delivery remains focused on phases 0-6, 8, and 9 without hidden embedded-channel drift.",
                "Compatibility seams can mature without implying live release authority or current regulatory blockers.",
            ],
            "consequences_negative": [
                "Embedded-channel user journeys remain unavailable in the current baseline.",
                "Later Phase 7 work will need its own promotion, assurance, and release tuple review.",
            ],
            "required_follow_on_task_refs": ["seq_017", "seq_018", "seq_020", "seq_029", "seq_030", "seq_040"],
            "linked_risk_ids": ["GAP_016_PHASE7_DEFERRED_CHANNEL"],
            "validation_obligations": [
                "Reject any accepted ADR or release view that treats embedded NHS App as a live baseline audience surface.",
                "Keep embedded compatibility work non-authoritative until a later explicit architecture decision changes status.",
            ],
            "notes": (
                "This ADR exists specifically to stop silent scope re-entry from bridge or compatibility work."
            ),
            "linked_view_ids": ["view_system_context", "view_frontend_gateway_design_contract"],
            "linked_contract_refs": [
                "ChannelReleaseFreezeRecord",
                "AudienceSurfaceRuntimeBinding",
                "ReleaseApprovalFreeze",
            ],
            "requirement_keywords": [
                "embedded",
                "channel",
                "bridge capability",
                "ChannelReleaseFreezeRecord",
            ],
        }
    )

    return adrs


def build_contract_bindings(_: dict[str, Any]) -> list[dict[str, Any]]:
    rows = [
        {
            "contract_ref": "RuntimeTopologyManifest",
            "contract_kind": "runtime_manifest",
            "architecture_plane": "runtime_topology",
            "primary_adr_id": "ADR-016-004",
            "supporting_adr_ids": "ADR-016-003; ADR-016-011",
            "bound_view_id": "view_container_topology",
            "source_refs": "platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest; 11_gateway_surface_and_runtime_topology_baseline.md",
            "upstream_task_refs": "seq_011; seq_016",
            "runtime_consumers": "public edge; gateway families; governance topology review; operations boards",
            "binding_law": "All gateway, workload, and trust-zone publications point back to one current runtime topology manifest.",
            "drift_effect": "Browser, gateway, and control surfaces freeze to recovery or diagnostic posture when topology parity drifts.",
            "validation_obligations": "Verify trust-zone and gateway surface parity against the current manifest.",
            "status": "accepted",
        },
        {
            "contract_ref": "GatewayBffSurface",
            "contract_kind": "gateway_contract",
            "architecture_plane": "gateway_boundary",
            "primary_adr_id": "ADR-016-005",
            "supporting_adr_ids": "ADR-016-004; ADR-016-010",
            "bound_view_id": "view_frontend_gateway_design_contract",
            "source_refs": "platform-runtime-and-release-blueprint.md#GatewayBffSurface; 14_gateway_bff_pattern_and_surface_split.md",
            "upstream_task_refs": "seq_011; seq_014; seq_016",
            "runtime_consumers": "browsers; route-family clients; gateway executables; operations drilldown",
            "binding_law": "Every browser-callable route family resolves through a published gateway surface.",
            "drift_effect": "Unpublished or stale routes drop to summary-only, recovery-only, or blocked posture.",
            "validation_obligations": "Block direct browser calls beyond published gateway surfaces.",
            "status": "accepted",
        },
        {
            "contract_ref": "FrontendContractManifest",
            "contract_kind": "frontend_manifest",
            "architecture_plane": "browser_authority",
            "primary_adr_id": "ADR-016-005",
            "supporting_adr_ids": "ADR-016-010",
            "bound_view_id": "view_frontend_gateway_design_contract",
            "source_refs": "platform-runtime-and-release-blueprint.md#FrontendContractManifest; 14_shell_and_route_runtime_architecture.md",
            "upstream_task_refs": "seq_014; seq_016",
            "runtime_consumers": "typed clients; shell registries; automation suites",
            "binding_law": "Route families, live-channel contracts, and shell entrypoints publish through one current frontend manifest.",
            "drift_effect": "Route-level authority becomes recovery-only until the manifest and runtime tuple realign.",
            "validation_obligations": "Fail route publication when manifest digests drift from runtime publication.",
            "status": "accepted",
        },
        {
            "contract_ref": "AudienceSurfaceRuntimeBinding",
            "contract_kind": "runtime_tuple",
            "architecture_plane": "browser_authority",
            "primary_adr_id": "ADR-016-010",
            "supporting_adr_ids": "ADR-016-005; ADR-016-011; ADR-016-015",
            "bound_view_id": "view_frontend_gateway_design_contract",
            "source_refs": "phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding; platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
            "upstream_task_refs": "seq_011; seq_014; seq_015; seq_016",
            "runtime_consumers": "patient shell; staff shells; support; operations; governance",
            "binding_law": "Writable or calmly trustworthy surfaces require one current audience-surface runtime binding.",
            "drift_effect": "Surfaces remain same-shell but freeze to read-only, summary-only, or recovery-only posture.",
            "validation_obligations": "Require exact route, design-contract, release, parity, and recovery tuple agreement.",
            "status": "accepted",
        },
        {
            "contract_ref": "DesignContractPublicationBundle",
            "contract_kind": "design_contract",
            "architecture_plane": "browser_authority",
            "primary_adr_id": "ADR-016-010",
            "supporting_adr_ids": "ADR-016-011; ADR-016-015",
            "bound_view_id": "view_frontend_gateway_design_contract",
            "source_refs": "phase-0-the-foundation-protocol.md#DesignContractPublicationBundle; platform-frontend-blueprint.md#12A. The active DesignContractPublicationBundle and DesignContractLintVerdict must remain current",
            "upstream_task_refs": "seq_012; seq_014; seq_016",
            "runtime_consumers": "DOM markers; automation anchors; telemetry vocabularies; artifact posture renderers",
            "binding_law": "Token export, state semantics, automation markers, telemetry vocabulary, and artifact posture publish as one bundle.",
            "drift_effect": "Surfaces downgrade in place instead of rendering mixed-vocabulary truth.",
            "validation_obligations": "Block writable or calm posture when design-contract lint or digest drift occurs.",
            "status": "accepted",
        },
        {
            "contract_ref": "RouteIntentBinding",
            "contract_kind": "mutation_authority",
            "architecture_plane": "lifecycle_control",
            "primary_adr_id": "ADR-016-008",
            "supporting_adr_ids": "ADR-016-006; ADR-016-010; ADR-016-015",
            "bound_view_id": "view_domain_runtime_control_plane",
            "source_refs": "phase-0-the-foundation-protocol.md#RouteIntentBinding; forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
            "upstream_task_refs": "seq_005; seq_013; seq_016",
            "runtime_consumers": "browser shells; command API; capability and action-routing projections",
            "binding_law": "Every post-submit mutation binds one exact target tuple through RouteIntentBinding.",
            "drift_effect": "Stale, ambiguous, or orphaned actions recover in the same shell rather than mutating directly.",
            "validation_obligations": "Reject writable actions when route intent is missing, partial, or tuple-drifted.",
            "status": "accepted",
        },
        {
            "contract_ref": "CommandSettlementRecord",
            "contract_kind": "authoritative_settlement",
            "architecture_plane": "lifecycle_control",
            "primary_adr_id": "ADR-016-008",
            "supporting_adr_ids": "ADR-016-006; ADR-016-009",
            "bound_view_id": "view_data_event_storage_integration",
            "source_refs": "phase-0-the-foundation-protocol.md#CommandSettlementRecord; platform-frontend-blueprint.md#CommandSettlementRecord.authoritativeOutcomeState",
            "upstream_task_refs": "seq_005; seq_013; seq_014; seq_016",
            "runtime_consumers": "browser shells; projections; audit; partner outcome repair",
            "binding_law": "Consequential commands yield an authoritative settlement record before user-visible finality is legal.",
            "drift_effect": "UI can stay locally acknowledged but not final until settlement or command-following projection truth exists.",
            "validation_obligations": "Fail any final-state render that cannot cite current settlement or derived projection proof.",
            "status": "accepted",
        },
        {
            "contract_ref": "ReleaseApprovalFreeze",
            "contract_kind": "release_tuple",
            "architecture_plane": "release_authority",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-015; ADR-016-016",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "phase-0-the-foundation-protocol.md#ReleaseApprovalFreeze; platform-admin-and-config-blueprint.md#Production promotion gate",
            "upstream_task_refs": "seq_011; seq_015; seq_016",
            "runtime_consumers": "release pipeline; governance review; embedded and channel-specific writable gates",
            "binding_law": "Promotion and writable posture remain bound to one immutable approval freeze tuple.",
            "drift_effect": "Any tuple drift is a hard freeze for promotion, widening, or writable exposure.",
            "validation_obligations": "Require baselineTupleHash, approvalTupleHash, and releaseContractMatrixHash parity.",
            "status": "accepted",
        },
        {
            "contract_ref": "ChannelReleaseFreezeRecord",
            "contract_kind": "channel_release_tuple",
            "architecture_plane": "release_authority",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-012; ADR-016-016",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "phase-0-the-foundation-protocol.md#ChannelReleaseFreezeRecord; forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
            "upstream_task_refs": "seq_011; seq_015; seq_016",
            "runtime_consumers": "embedded surfaces; channel bridges; operations boards; governance handoff",
            "binding_law": "Channel-specific writable posture requires a compatible channel release freeze record.",
            "drift_effect": "Embedded or channel-specific surfaces can preserve context but not expose writable affordances.",
            "validation_obligations": "Require channel compatibility and bridge floor before writable embedded posture.",
            "status": "accepted",
        },
        {
            "contract_ref": "AssuranceSliceTrustRecord",
            "contract_kind": "trust_tuple",
            "architecture_plane": "assurance",
            "primary_adr_id": "ADR-016-012",
            "supporting_adr_ids": "ADR-016-011; ADR-016-015",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "phase-0-the-foundation-protocol.md#AssuranceSliceTrustRecord; forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
            "upstream_task_refs": "seq_009; seq_015; seq_016",
            "runtime_consumers": "operations boards; governance boards; support diagnostics; release gates",
            "binding_law": "Trust posture is authoritative for affected assurance slices and cannot be inferred from local dashboards.",
            "drift_effect": "Consumers fall to diagnostic or governance-handoff posture instead of optimistic actionability.",
            "validation_obligations": "Gate automation on trust lower bounds, not hopeful point estimates.",
            "status": "accepted",
        },
        {
            "contract_ref": "ReleaseWatchTuple",
            "contract_kind": "watch_tuple",
            "architecture_plane": "release_authority",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-012; ADR-016-015",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "platform-runtime-and-release-blueprint.md#ReleaseWatchTuple; 15_release_and_supply_chain_tooling_baseline.md",
            "upstream_task_refs": "seq_011; seq_015; seq_016",
            "runtime_consumers": "release cockpit; operations continuity boards; governance handoff routes",
            "binding_law": "Post-promotion watch consumes the same promoted package and parity tuple as runtime publication.",
            "drift_effect": "Watch posture cannot silently rebase to a different package or observation epoch.",
            "validation_obligations": "Require watch tuple parity in release oversight and governance handoff artifacts.",
            "status": "accepted",
        },
        {
            "contract_ref": "WaveObservationPolicy",
            "contract_kind": "wave_policy",
            "architecture_plane": "release_authority",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-012",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "platform-runtime-and-release-blueprint.md#WaveObservationPolicy; 15_verification_ladder_and_quality_gate_strategy.md",
            "upstream_task_refs": "seq_011; seq_015; seq_016",
            "runtime_consumers": "release orchestrator; watch policies; resilience evidence routing",
            "binding_law": "Wave observation policy defines how live waves prove continued authority after promotion.",
            "drift_effect": "Promotion or wave widening halts when observation or guardrail posture becomes stale.",
            "validation_obligations": "Ensure wave widening and rollback are bound to the same publication and trust tuple.",
            "status": "accepted",
        },
        {
            "contract_ref": "OperationalReadinessSnapshot",
            "contract_kind": "readiness_snapshot",
            "architecture_plane": "resilience",
            "primary_adr_id": "ADR-016-012",
            "supporting_adr_ids": "ADR-016-015",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "phase-0-the-foundation-protocol.md#OperationalReadinessSnapshot; forensic-audit-findings.md#Finding 112 - Resilience restore authority still depended on loose runbooks and dashboards",
            "upstream_task_refs": "seq_009; seq_011; seq_015; seq_016",
            "runtime_consumers": "restore controller; failover runbook binding; operations and governance boards",
            "binding_law": "Readiness snapshot is the release-scoped authority for restore readiness and rehearsal freshness.",
            "drift_effect": "Runbooks, bookmarks, or memory cannot substitute for a fresh readiness snapshot.",
            "validation_obligations": "Require readiness freshness before restore or failover actions become live-control eligible.",
            "status": "accepted",
        },
        {
            "contract_ref": "RecoveryControlPosture",
            "contract_kind": "recovery_posture",
            "architecture_plane": "resilience",
            "primary_adr_id": "ADR-016-012",
            "supporting_adr_ids": "ADR-016-015",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "phase-0-the-foundation-protocol.md#RecoveryControlPosture; forensic-audit-findings.md#Finding 112 - Resilience restore authority still depended on loose runbooks and dashboards",
            "upstream_task_refs": "seq_011; seq_015; seq_016",
            "runtime_consumers": "restore surfaces; failover controls; chaos controls; operator drill paths",
            "binding_law": "Recovery control posture is the only live runtime verdict for restore, failover, and chaos authority.",
            "drift_effect": "Surfaces may diagnose but cannot imply live control when posture is blocked or diagnostic-only.",
            "validation_obligations": "Require live-control posture plus fresh readiness and settlement evidence before resilient actions.",
            "status": "accepted",
        },
        {
            "contract_ref": "RuntimePublicationBundle",
            "contract_kind": "runtime_publication",
            "architecture_plane": "publication_control",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-004; ADR-016-010; ADR-016-015",
            "bound_view_id": "view_container_topology",
            "source_refs": "phase-0-the-foundation-protocol.md#RuntimePublicationBundle; platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "upstream_task_refs": "seq_011; seq_014; seq_015; seq_016",
            "runtime_consumers": "shells; gateways; operations; governance; release tooling",
            "binding_law": "Runtime publication binds route, design, settlement, recovery, and provenance truth into one machine-readable bundle.",
            "drift_effect": "Compiled sources alone do not create live authority; publication drift freezes runtime posture.",
            "validation_obligations": "Require runtime publication bundle parity across release, shell, and operations consumers.",
            "status": "accepted",
        },
        {
            "contract_ref": "ReleasePublicationParityRecord",
            "contract_kind": "publication_parity",
            "architecture_plane": "publication_control",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-007; ADR-016-015",
            "bound_view_id": "view_frontend_gateway_design_contract",
            "source_refs": "platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord; 15_release_and_supply_chain_tooling_baseline.md",
            "upstream_task_refs": "seq_014; seq_015; seq_016",
            "runtime_consumers": "runtime publication validators; shell authority gates; release cockpit",
            "binding_law": "Live surfaces consume parity-checked publication tuples rather than ad hoc digest combinations.",
            "drift_effect": "Writable posture freezes on parity drift even if artifacts and routes still exist.",
            "validation_obligations": "Keep parity proof aligned with release, design-contract, and runtime publication bundles.",
            "status": "accepted",
        },
        {
            "contract_ref": "LifecycleCoordinator",
            "contract_kind": "lifecycle_owner",
            "architecture_plane": "lifecycle_control",
            "primary_adr_id": "ADR-016-008",
            "supporting_adr_ids": "ADR-016-006",
            "bound_view_id": "view_domain_runtime_control_plane",
            "source_refs": "phase-0-the-foundation-protocol.md#LifecycleCoordinator; forensic-audit-findings.md#Findings 48-50",
            "upstream_task_refs": "seq_005; seq_013; seq_016",
            "runtime_consumers": "triage; booking; hub; pharmacy; request closure evaluation",
            "binding_law": "Only LifecycleCoordinator can derive cross-domain closure or governed reopen decisions.",
            "drift_effect": "Child domains emit milestones and signals but cannot claim canonical request closure directly.",
            "validation_obligations": "Verify request closure and reopen logic cite coordinator-owned blockers and settlements.",
            "status": "accepted",
        },
        {
            "contract_ref": "FhirRepresentationContract",
            "contract_kind": "representation_boundary",
            "architecture_plane": "data_and_integration",
            "primary_adr_id": "ADR-016-001",
            "supporting_adr_ids": "ADR-016-009",
            "bound_view_id": "view_data_event_storage_integration",
            "source_refs": "phase-0-the-foundation-protocol.md#FhirRepresentationContract; 13_fhir_representation_and_projection_boundary.md",
            "upstream_task_refs": "seq_013; seq_016",
            "runtime_consumers": "FHIR mapping; partner exchange; audit and provenance",
            "binding_law": "FHIR shape is governed at the representation contract, not inferred from aggregate internals or route payloads.",
            "drift_effect": "Representation drift triggers replay, invalidation, or contract versioning rather than hidden model mutation.",
            "validation_obligations": "Require contract versioning and evidence binding for every clinical or partner-facing representation set.",
            "status": "accepted",
        },
        {
            "contract_ref": "ActingScopeTuple",
            "contract_kind": "scope_tuple",
            "architecture_plane": "governed_scope",
            "primary_adr_id": "ADR-016-003",
            "supporting_adr_ids": "ADR-016-012",
            "bound_view_id": "view_container_topology",
            "source_refs": "phase-0-the-foundation-protocol.md#ActingScopeTuple; 11_tenant_model_and_acting_scope_strategy.md",
            "upstream_task_refs": "seq_011; seq_016",
            "runtime_consumers": "support tools; governance actions; cross-organisation work; elevated diagnostics",
            "binding_law": "Tuple hash binds tenant, organisation, environment, policy plane, purpose-of-use, and visibility coverage into one machine-checkable authority.",
            "drift_effect": "Context-preserving shells remain visible but mutating actions freeze until tuple refresh.",
            "validation_obligations": "Require exact tuple agreement on privileged and cross-organisation actions.",
            "status": "accepted",
        },
        {
            "contract_ref": "VisibilityProjectionPolicy",
            "contract_kind": "disclosure_policy",
            "architecture_plane": "data_and_disclosure",
            "primary_adr_id": "ADR-016-013",
            "supporting_adr_ids": "ADR-016-007; ADR-016-010",
            "bound_view_id": "view_data_event_storage_integration",
            "source_refs": "phase-0-the-foundation-protocol.md#VisibilityProjectionPolicy; 10_phi_masking_and_redaction_policy.md",
            "upstream_task_refs": "seq_010; seq_016",
            "runtime_consumers": "patient-safe summaries; support replay; exports; audit surfaces",
            "binding_law": "Disclosure posture, allowed fields, break-glass requirements, and consistency class resolve through one visibility policy.",
            "drift_effect": "Affected surfaces downgrade or mask data instead of improvising local disclosure behavior.",
            "validation_obligations": "Require current visibility policy and redaction transforms for PHI-bearing surfaces and exports.",
            "status": "accepted",
        },
        {
            "contract_ref": "BuildProvenanceRecord",
            "contract_kind": "supply_chain_proof",
            "architecture_plane": "publication_control",
            "primary_adr_id": "ADR-016-011",
            "supporting_adr_ids": "ADR-016-015",
            "bound_view_id": "view_release_assurance_resilience",
            "source_refs": "15_release_and_supply_chain_tooling_baseline.md; supply_chain_and_provenance_matrix.json",
            "upstream_task_refs": "seq_015; seq_016",
            "runtime_consumers": "release gates; provenance validators; governance review",
            "binding_law": "Runtime authority depends on verified provenance rather than CI success alone.",
            "drift_effect": "Publication and writable posture fail closed when provenance is missing or stale.",
            "validation_obligations": "Require signed provenance, SBOM coverage, and release tuple parity before live authority.",
            "status": "accepted",
        },
    ]
    return rows


def build_gap_register() -> dict[str, Any]:
    issues = [
        {
            "issue_id": "GAP_016_SCATTERED_DECISION_FREEZE",
            "status": "resolved",
            "severity": "high",
            "title": "Baseline architecture decisions existed only as scattered prior-task prose",
            "summary": "Seq_016 freezes those decisions into one ADR set, decision matrix, and contract-binding pack.",
            "linked_adr_ids": ["ADR-016-001", "ADR-016-015"],
            "source_refs": ["prompt/016.md", "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions"],
        },
        {
            "issue_id": "GAP_016_PHASE0_CONTROL_PLANE_LOCALITY",
            "status": "resolved",
            "severity": "high",
            "title": "The Phase 0 control plane could still look phase-local",
            "summary": "Seq_016 binds route intent, settlement, release freeze, trust, and readiness tuples into one cross-phase control-plane architecture decision.",
            "linked_adr_ids": ["ADR-016-008", "ADR-016-011", "ADR-016-015"],
            "source_refs": [
                "forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions",
                "forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
            ],
        },
        {
            "issue_id": "GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT",
            "status": "resolved",
            "severity": "high",
            "title": "Design-contract publication could drift outside runtime publication",
            "summary": "Seq_016 freezes design-contract publication inside the runtime publication and release parity tuple.",
            "linked_adr_ids": ["ADR-016-010", "ADR-016-011", "ADR-016-015"],
            "source_refs": [
                "forensic-audit-findings.md#Finding 118 - Token export and design-contract conformance could still drift outside the published runtime tuple",
            ],
        },
        {
            "issue_id": "GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT",
            "status": "resolved",
            "severity": "high",
            "title": "Operations and governance continuity and resilience authority were separate mental models",
            "summary": "Seq_016 unifies watch tuples, readiness, trust, continuity proof, and recovery posture under one architecture control plane.",
            "linked_adr_ids": ["ADR-016-011", "ADR-016-012", "ADR-016-015"],
            "source_refs": ["forensic-audit-findings.md#Findings 95, 104-120"],
        },
        {
            "issue_id": "GAP_016_ASSISTIVE_CENTRALITY",
            "status": "resolved",
            "severity": "medium",
            "title": "Assistive capability could appear mandatory or architecturally central",
            "summary": "Seq_016 freezes assistive functionality as optional sidecar capability with kill-switch posture.",
            "linked_adr_ids": ["ADR-016-014"],
            "source_refs": ["forensic-audit-findings.md#Finding 17 - AI assistance was modeled as a mandatory linear stage"],
        },
        {
            "issue_id": "GAP_016_TENANT_SCOPE_DRIFT",
            "status": "resolved",
            "severity": "high",
            "title": "Tenant and acting-scope drift risk remained open",
            "summary": "Seq_016 freezes exact ActingScopeTuple law for privileged and cross-organisation actions.",
            "linked_adr_ids": ["ADR-016-003"],
            "source_refs": ["forensic-audit-findings.md#Finding 114 - Tenant and acting context could still drift between governance scope and live cross-organisation work"],
        },
        {
            "issue_id": "GAP_016_ARTIFACT_MODE_TRUTH",
            "status": "resolved",
            "severity": "high",
            "title": "Artifact preview and handoff mode truth could remain implementation detail",
            "summary": "Seq_016 treats artifact mode truth as a runtime publication and disclosure contract.",
            "linked_adr_ids": ["ADR-016-007", "ADR-016-013"],
            "source_refs": ["forensic-audit-findings.md#Finding 115 - Artifact preview and handoff still lacked one live mode-truth contract for constrained channels"],
        },
        {
            "issue_id": "GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY",
            "status": "resolved",
            "severity": "high",
            "title": "Patient degraded mode, continuity proof, and shell continuity could become route-local",
            "summary": "Seq_016 freezes continuity proof, same-shell law, and degraded posture as cross-phase architecture.",
            "linked_adr_ids": ["ADR-016-010", "ADR-016-012", "ADR-016-015"],
            "source_refs": ["forensic-audit-findings.md#Findings 107-120"],
        },
        {
            "issue_id": "GAP_016_PHASE7_DEFERRED_CHANNEL",
            "status": "deferred",
            "severity": "medium",
            "title": "Phase 7 embedded NHS App channel remains outside the current accepted baseline",
            "summary": "The deferred ADR keeps compatibility seams only and blocks accidental re-entry into the current baseline.",
            "linked_adr_ids": ["ADR-016-016"],
            "source_refs": ["03_deferred_and_conditional_scope.md", "prompt/016.md"],
        },
        {
            "issue_id": "GAP_015_HSM_SIGNING_KEY_PROVISIONING",
            "status": "open",
            "severity": "medium",
            "title": "HSM-backed signing keys are still a provisioning seam",
            "summary": "Seq_015 intentionally stopped at the release-control seam. The architecture freeze inherits that gap without changing the baseline.",
            "linked_adr_ids": ["ADR-016-011"],
            "source_refs": ["15_release_and_supply_chain_tooling_baseline.md"],
        },
        {
            "issue_id": "GAP_015_ALERT_DESTINATION_BINDING",
            "status": "open",
            "severity": "medium",
            "title": "Concrete on-call destinations still need tenant and service-owner binding",
            "summary": "Seq_016 keeps alert routing architecture fixed while leaving final rotation identifiers to provisioning work.",
            "linked_adr_ids": ["ADR-016-011", "ADR-016-012"],
            "source_refs": ["15_incident_audit_and_assurance_tooling.md"],
        },
    ]
    return {
        "register_id": "vecells_architecture_gap_register_v1",
        "mission": MISSION,
        "issues": issues,
        "summary": {
            "resolved": sum(1 for issue in issues if issue["status"] == "resolved"),
            "open": sum(1 for issue in issues if issue["status"] == "open"),
            "deferred": sum(1 for issue in issues if issue["status"] == "deferred"),
        },
    }


def build_views(prereqs: dict[str, Any]) -> list[dict[str, Any]]:
    gateway_count = prereqs["summary"]["gateway_surface_count"]
    workload_count = prereqs["summary"]["workload_family_count"]
    dependency_count = prereqs["summary"]["dependency_count"]
    route_count = prereqs["summary"]["route_family_count"]

    return [
        {
            "view_id": "view_system_context",
            "title": "System Context",
            "subtitle": "Audiences, published gateways, runtime core, and bounded external seams",
            "summary": (
                f"Current baseline serves {route_count} route families and {gateway_count} gateway surfaces through "
                "one published gateway layer between browsers and runtime services."
            ),
            "linked_adr_ids": [
                "ADR-016-001",
                "ADR-016-003",
                "ADR-016-004",
                "ADR-016-005",
                "ADR-016-009",
                "ADR-016-010",
                "ADR-016-016",
            ],
            "nodes": [
                {"node_id": "sys_patient", "label": "Patient surfaces", "x": 4, "y": 12, "kind": "audience", "adr_id": "ADR-016-010"},
                {"node_id": "sys_staff", "label": "Clinician and support surfaces", "x": 4, "y": 38, "kind": "audience", "adr_id": "ADR-016-010"},
                {"node_id": "sys_ops", "label": "Operations and governance surfaces", "x": 4, "y": 64, "kind": "audience", "adr_id": "ADR-016-012"},
                {"node_id": "sys_gateways", "label": "Published gateway surfaces", "x": 32, "y": 38, "kind": "gateway", "adr_id": "ADR-016-005"},
                {"node_id": "sys_runtime", "label": "Vecells runtime core", "x": 60, "y": 38, "kind": "runtime", "adr_id": "ADR-016-001"},
                {"node_id": "sys_dependencies", "label": f"External dependencies ({dependency_count})", "x": 84, "y": 38, "kind": "integration", "adr_id": "ADR-016-009"},
                {"node_id": "sys_deferred", "label": "Deferred embedded NHS App channel", "x": 32, "y": 74, "kind": "deferred", "adr_id": "ADR-016-016"},
            ],
            "edges": [
                {"from": "sys_patient", "to": "sys_gateways", "label": "typed browser authority"},
                {"from": "sys_staff", "to": "sys_gateways", "label": "bounded shells"},
                {"from": "sys_ops", "to": "sys_gateways", "label": "diagnostic and governance flows"},
                {"from": "sys_gateways", "to": "sys_runtime", "label": "published contracts only"},
                {"from": "sys_runtime", "to": "sys_dependencies", "label": "adapter seams and proof settlement"},
                {"from": "sys_deferred", "to": "sys_gateways", "label": "compatibility seam only"},
            ],
        },
        {
            "view_id": "view_container_topology",
            "title": "Container and Workload Model",
            "subtitle": "Trust zones, gateway families, runtime components, and control-plane publication",
            "summary": (
                f"The chosen topology publishes {workload_count} workload families across seven trust zones and "
                "routes browser traffic only through public edge and gateway workloads."
            ),
            "linked_adr_ids": [
                "ADR-016-002",
                "ADR-016-003",
                "ADR-016-004",
                "ADR-016-005",
                "ADR-016-011",
                "ADR-016-015",
            ],
            "nodes": [
                {"node_id": "ct_repo", "label": "Modular workspace and package graph", "x": 6, "y": 58, "kind": "repository", "adr_id": "ADR-016-002"},
                {"node_id": "ct_edge", "label": "Public edge", "x": 6, "y": 18, "kind": "topology", "adr_id": "ADR-016-004"},
                {"node_id": "ct_gateway", "label": "Gateway families", "x": 26, "y": 18, "kind": "gateway", "adr_id": "ADR-016-005"},
                {"node_id": "ct_services", "label": "Runtime services", "x": 48, "y": 18, "kind": "runtime", "adr_id": "ADR-016-004"},
                {"node_id": "ct_stores", "label": "Domain, projection, and ledger stores", "x": 72, "y": 18, "kind": "storage", "adr_id": "ADR-016-006"},
                {"node_id": "ct_release", "label": "Release and publication control", "x": 26, "y": 58, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "ct_scope", "label": "Tenant and acting scope", "x": 48, "y": 58, "kind": "control", "adr_id": "ADR-016-003"},
                {"node_id": "ct_resilience", "label": "Watch, readiness, and recovery", "x": 72, "y": 58, "kind": "control", "adr_id": "ADR-016-012"},
            ],
            "edges": [
                {"from": "ct_edge", "to": "ct_gateway", "label": "browser traffic"},
                {"from": "ct_gateway", "to": "ct_services", "label": "typed contracts"},
                {"from": "ct_services", "to": "ct_stores", "label": "authoritative writes"},
                {"from": "ct_repo", "to": "ct_gateway", "label": "published contract packages"},
                {"from": "ct_release", "to": "ct_gateway", "label": "runtime publication"},
                {"from": "ct_scope", "to": "ct_services", "label": "acting tuple fences"},
                {"from": "ct_resilience", "to": "ct_release", "label": "watch and readiness parity"},
            ],
        },
        {
            "view_id": "view_domain_runtime_control_plane",
            "title": "Domain Runtime and Control Plane",
            "subtitle": "Lifecycle ownership, state machines, continuity proof, and assurance tuples",
            "summary": (
                f"The control plane stitches {prereqs['summary']['state_machine_count']} state machines into one "
                "cross-domain lifecycle and continuity model."
            ),
            "linked_adr_ids": [
                "ADR-016-001",
                "ADR-016-006",
                "ADR-016-008",
                "ADR-016-012",
                "ADR-016-014",
                "ADR-016-015",
            ],
            "nodes": [
                {"node_id": "dr_lineage", "label": "Request and lineage kernel", "x": 6, "y": 24, "kind": "domain", "adr_id": "ADR-016-001"},
                {"node_id": "dr_domains", "label": "Booking, hub, pharmacy, comms, support", "x": 30, "y": 24, "kind": "domain", "adr_id": "ADR-016-006"},
                {"node_id": "dr_lifecycle", "label": "LifecycleCoordinator", "x": 54, "y": 24, "kind": "control", "adr_id": "ADR-016-008"},
                {"node_id": "dr_continuity", "label": "Continuity and shell proof", "x": 78, "y": 24, "kind": "control", "adr_id": "ADR-016-010"},
                {"node_id": "dr_release", "label": "Release and publication tuples", "x": 30, "y": 62, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "dr_assurance", "label": "Assurance and resilience tuples", "x": 54, "y": 62, "kind": "control", "adr_id": "ADR-016-012"},
                {"node_id": "dr_assistive", "label": "Optional assistive sidecar", "x": 78, "y": 62, "kind": "optional", "adr_id": "ADR-016-014"},
                {"node_id": "dr_arch_cp", "label": "Cross-phase architecture control plane", "x": 54, "y": 82, "kind": "control", "adr_id": "ADR-016-015"},
            ],
            "edges": [
                {"from": "dr_lineage", "to": "dr_domains", "label": "governing aggregate truth"},
                {"from": "dr_domains", "to": "dr_lifecycle", "label": "milestones and signals"},
                {"from": "dr_lifecycle", "to": "dr_continuity", "label": "same-shell authority"},
                {"from": "dr_release", "to": "dr_continuity", "label": "publication and trust fence"},
                {"from": "dr_assurance", "to": "dr_release", "label": "watch and readiness parity"},
                {"from": "dr_assistive", "to": "dr_domains", "label": "artifact-only assist"},
                {"from": "dr_arch_cp", "to": "dr_release", "label": "shared tuple law"},
                {"from": "dr_arch_cp", "to": "dr_assurance", "label": "continuity and resilience parity"},
            ],
        },
        {
            "view_id": "view_frontend_gateway_design_contract",
            "title": "Frontend, Gateway, and Design Contract Architecture",
            "subtitle": "Persistent shells, route publication, design bundles, and runtime surface bindings",
            "summary": (
                f"Design and runtime publication remain locked together across {gateway_count} gateway surfaces and "
                f"{prereqs['summary']['design_contract_row_count']} design-publication rows."
            ),
            "linked_adr_ids": [
                "ADR-016-005",
                "ADR-016-007",
                "ADR-016-010",
                "ADR-016-011",
                "ADR-016-013",
                "ADR-016-015",
                "ADR-016-016",
            ],
            "nodes": [
                {"node_id": "fg_shells", "label": "Persistent shells", "x": 6, "y": 26, "kind": "audience", "adr_id": "ADR-016-010"},
                {"node_id": "fg_route", "label": "Route-family contracts", "x": 26, "y": 26, "kind": "gateway", "adr_id": "ADR-016-005"},
                {"node_id": "fg_design", "label": "DesignContractPublicationBundle", "x": 50, "y": 26, "kind": "design", "adr_id": "ADR-016-010"},
                {"node_id": "fg_runtime", "label": "AudienceSurfaceRuntimeBinding", "x": 74, "y": 26, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "fg_artifact", "label": "Artifact and disclosure posture", "x": 26, "y": 66, "kind": "design", "adr_id": "ADR-016-007"},
                {"node_id": "fg_recovery", "label": "ReleaseRecoveryDisposition", "x": 50, "y": 66, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "fg_deferred", "label": "Deferred embedded bridge", "x": 74, "y": 66, "kind": "deferred", "adr_id": "ADR-016-016"},
            ],
            "edges": [
                {"from": "fg_shells", "to": "fg_route", "label": "shell ownership claims"},
                {"from": "fg_route", "to": "fg_design", "label": "state and marker vocab"},
                {"from": "fg_design", "to": "fg_runtime", "label": "design digest in runtime tuple"},
                {"from": "fg_runtime", "to": "fg_shells", "label": "writable or recovery posture"},
                {"from": "fg_artifact", "to": "fg_shells", "label": "artifact mode truth"},
                {"from": "fg_deferred", "to": "fg_runtime", "label": "compatibility only"},
            ],
        },
        {
            "view_id": "view_data_event_storage_integration",
            "title": "Data, Event, Storage, and Integration Architecture",
            "subtitle": "Evidence, events, stores, projections, and external proof settlement",
            "summary": (
                f"The current baseline depends on {dependency_count} external dependencies but keeps domain truth, "
                "settlement, and replay authority inside the append-only platform spine."
            ),
            "linked_adr_ids": [
                "ADR-016-001",
                "ADR-016-006",
                "ADR-016-007",
                "ADR-016-009",
                "ADR-016-013",
            ],
            "nodes": [
                {"node_id": "de_ingress", "label": "Ingress and evidence capture", "x": 6, "y": 20, "kind": "data", "adr_id": "ADR-016-007"},
                {"node_id": "de_domain", "label": "Canonical domain aggregates", "x": 28, "y": 20, "kind": "domain", "adr_id": "ADR-016-001"},
                {"node_id": "de_events", "label": "Append-only event spine", "x": 50, "y": 20, "kind": "data", "adr_id": "ADR-016-006"},
                {"node_id": "de_projections", "label": "Projection read models", "x": 72, "y": 20, "kind": "storage", "adr_id": "ADR-016-006"},
                {"node_id": "de_fhir", "label": "FHIR and partner representations", "x": 28, "y": 62, "kind": "integration", "adr_id": "ADR-016-001"},
                {"node_id": "de_artifact", "label": "Artifact and audit stores", "x": 50, "y": 62, "kind": "storage", "adr_id": "ADR-016-007"},
                {"node_id": "de_adapters", "label": "External adapter seams", "x": 72, "y": 62, "kind": "integration", "adr_id": "ADR-016-009"},
            ],
            "edges": [
                {"from": "de_ingress", "to": "de_domain", "label": "normalized submissions and snapshots"},
                {"from": "de_domain", "to": "de_events", "label": "authoritative milestones"},
                {"from": "de_events", "to": "de_projections", "label": "browser read truth"},
                {"from": "de_domain", "to": "de_fhir", "label": "derived representations only"},
                {"from": "de_ingress", "to": "de_artifact", "label": "immutable artifacts and redactions"},
                {"from": "de_fhir", "to": "de_adapters", "label": "partner exchange bundles"},
            ],
        },
        {
            "view_id": "view_release_assurance_resilience",
            "title": "Release, Assurance, and Resilience Architecture",
            "subtitle": "Promotion, watch tuples, readiness, evidence graph, and recovery control",
            "summary": (
                "Release authority, watch posture, and resilience control share one proof-carrying tuple "
                "rather than separate operational narratives."
            ),
            "linked_adr_ids": [
                "ADR-016-003",
                "ADR-016-011",
                "ADR-016-012",
                "ADR-016-013",
                "ADR-016-014",
                "ADR-016-015",
            ],
            "nodes": [
                {"node_id": "ra_governance", "label": "Governance review and approval", "x": 6, "y": 22, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "ra_release", "label": "ReleaseApprovalFreeze and publication parity", "x": 30, "y": 22, "kind": "control", "adr_id": "ADR-016-011"},
                {"node_id": "ra_watch", "label": "ReleaseWatchTuple and trust slices", "x": 56, "y": 22, "kind": "control", "adr_id": "ADR-016-012"},
                {"node_id": "ra_readiness", "label": "OperationalReadinessSnapshot", "x": 80, "y": 22, "kind": "control", "adr_id": "ADR-016-012"},
                {"node_id": "ra_recovery", "label": "RecoveryControlPosture", "x": 56, "y": 62, "kind": "control", "adr_id": "ADR-016-012"},
                {"node_id": "ra_ops", "label": "Operations and governance boards", "x": 30, "y": 62, "kind": "audience", "adr_id": "ADR-016-012"},
                {"node_id": "ra_artifact", "label": "Evidence graph and disclosure fences", "x": 80, "y": 62, "kind": "data", "adr_id": "ADR-016-013"},
            ],
            "edges": [
                {"from": "ra_governance", "to": "ra_release", "label": "approved tuple"},
                {"from": "ra_release", "to": "ra_watch", "label": "watch parity"},
                {"from": "ra_watch", "to": "ra_readiness", "label": "exact proof set"},
                {"from": "ra_readiness", "to": "ra_recovery", "label": "live-control eligibility"},
                {"from": "ra_recovery", "to": "ra_ops", "label": "bounded controls"},
                {"from": "ra_artifact", "to": "ra_ops", "label": "admissible evidence"},
            ],
        },
    ]


def flatten_adr_for_csv(adr: dict[str, Any]) -> dict[str, Any]:
    row = dict(adr)
    for key, value in list(row.items()):
        if isinstance(value, list):
            row[key] = "; ".join(value)
    return row


def build_bundle() -> dict[str, Any]:
    prereqs = ensure_prerequisites()
    adrs = build_adrs(prereqs)
    contract_bindings = build_contract_bindings(prereqs)
    gap_register = build_gap_register()
    views = build_views(prereqs)

    source_digest = build_source_digest(
        [ref for adr in adrs for ref in adr["source_refs"]],
        [task for adr in adrs for task in adr["upstream_task_refs"]],
    )
    accepted_count = sum(1 for adr in adrs if adr["status"] == "accepted")
    deferred_count = sum(1 for adr in adrs if adr["status"] == "deferred")
    superseded_count = sum(1 for adr in adrs if adr["status"] == "superseded")
    decision_family_count = len({adr["decision_family"] for adr in adrs})

    summary = {
        "adr_count": len(adrs),
        "accepted_count": accepted_count,
        "deferred_count": deferred_count,
        "superseded_count": superseded_count,
        "decision_family_count": decision_family_count,
        "view_count": len(views),
        "contract_binding_count": len(contract_bindings),
        "gap_issue_count": len(gap_register["issues"]),
        "source_digest": source_digest,
        "current_baseline": CURRENT_BASELINE,
        "deferred_baseline": DEFERRED_BASELINE,
    }

    return {
        "architecture_freeze_id": "vecells_architecture_freeze_v1",
        "mission": MISSION,
        "current_baseline": CURRENT_BASELINE,
        "deferred_baseline": DEFERRED_BASELINE,
        "source_precedence": SOURCE_PRECEDENCE,
        "non_negotiable_rules": NON_NEGOTIABLE_RULES,
        "mandatory_closures": MANDATORY_CLOSURES,
        "required_contract_refs": REQUIRED_CONTRACT_REFS,
        "upstream_input_summary": prereqs["summary"],
        "summary": summary,
        "adrs": adrs,
        "contract_bindings": contract_bindings,
        "gap_register": gap_register,
        "views": views,
    }


def render_adr_index_doc(payload: dict[str, Any]) -> str:
    rows = []
    for adr in payload["adrs"]:
        rows.append(
            [
                adr["adr_id"],
                adr["decision_family"],
                adr["status"],
                adr["title"],
                ", ".join(adr["linked_view_ids"]),
                ", ".join(adr["linked_contract_refs"][:3]),
            ]
        )
    summary = payload["summary"]
    return textwrap.dedent(
        f"""
        # 16 ADR Index

        ## Mission

        {payload["mission"]}

        ## Freeze Summary

        - Architecture freeze id: `{payload["architecture_freeze_id"]}`
        - Current baseline: {payload["current_baseline"]}
        - Deferred baseline: {payload["deferred_baseline"]}
        - ADRs: {summary["adr_count"]}
        - Accepted: {summary["accepted_count"]}
        - Deferred: {summary["deferred_count"]}
        - Superseded: {summary["superseded_count"]}
        - Decision families: {summary["decision_family_count"]}
        - Contract bindings: {summary["contract_binding_count"]}
        - Views: {summary["view_count"]}
        - Source digest: `{summary["source_digest"]}`

        ## ADR Matrix

        {render_table(
            ["ADR", "Family", "Status", "Title", "Views", "Key contracts"],
            rows,
        )}
        """
    ).strip()


def render_target_adr_set_doc(payload: dict[str, Any]) -> str:
    sections = []
    for adr in payload["adrs"]:
        sections.append(
            textwrap.dedent(
                f"""
                ## {adr["adr_id"]} {adr["title"]}

                - Family: `{adr["decision_family"]}`
                - Status: `{adr["status"]}`
                - Scope: `{adr["scope"]}`
                - Upstream tasks: {", ".join(adr["upstream_task_refs"])}
                - Views: {", ".join(adr["linked_view_ids"])}
                - Contracts: {", ".join(adr["linked_contract_refs"])}
                - Requirements: {", ".join(adr["linked_requirement_ids"])}

                **Problem**

                {adr["problem_statement"]}

                **Decision**

                {adr["decision"]}

                **Why Now**

                {adr["why_now"]}

                **Consequences**

                Positive:
                {chr(10).join(f"- {item}" for item in adr["consequences_positive"])}

                Negative:
                {chr(10).join(f"- {item}" for item in adr["consequences_negative"])}

                **Alternatives**

                Accepted bounded alternatives:
                {chr(10).join(f"- `{item}`" for item in adr["accepted_alternative_refs"])}

                Rejected alternatives:
                {chr(10).join(f"- `{item}`" for item in adr["rejected_alternative_refs"])}

                **Validation**

                {chr(10).join(f"- {item}" for item in adr["validation_obligations"])}

                **Source Refs**

                {chr(10).join(f"- {item}" for item in adr["source_refs"])}

                **Notes**

                {adr["notes"]}
                """
            ).strip()
        )

    return textwrap.dedent(
        f"""
        # 16 Target Architecture ADR Set

        ## Baseline

        - Current baseline: {payload["current_baseline"]}
        - Deferred baseline: {payload["deferred_baseline"]}
        - Non-negotiable rules: {len(payload["non_negotiable_rules"])}
        - Mandatory closures: {len(payload["mandatory_closures"])}

        ## Non-Negotiable Rules

        {chr(10).join(f"- {rule}" for rule in payload["non_negotiable_rules"])}

        ## Accepted and Deferred Decisions

        {chr(10).join(sections)}
        """
    ).strip()


def render_view_doc(payload: dict[str, Any], view_ids: list[str], title: str, intro: str) -> str:
    view_lookup = {view["view_id"]: view for view in payload["views"]}
    adr_lookup = {adr["adr_id"]: adr for adr in payload["adrs"]}
    blocks = []
    for view_id in view_ids:
        view = view_lookup[view_id]
        linked_rows = [
            [adr_id, adr_lookup[adr_id]["title"], adr_lookup[adr_id]["status"]]
            for adr_id in view["linked_adr_ids"]
        ]
        node_rows = [[node["label"], node["kind"], node["adr_id"]] for node in view["nodes"]]
        edge_rows = [[edge["from"], edge["to"], edge["label"]] for edge in view["edges"]]
        blocks.append(
            textwrap.dedent(
                f"""
                ## {view["title"]}

                {view["summary"]}

                ### Linked ADRs

                {render_table(["ADR", "Title", "Status"], linked_rows)}

                ### Nodes

                {render_table(["Node", "Kind", "Primary ADR"], node_rows)}

                ### Edges

                {render_table(["From", "To", "Meaning"], edge_rows)}
                """
            ).strip()
        )
    return textwrap.dedent(
        f"""
        # {title}

        {intro}

        {chr(10).join(blocks)}
        """
    ).strip()


def render_decision_matrix_doc(payload: dict[str, Any]) -> str:
    adr_rows = []
    for adr in payload["adrs"]:
        adr_rows.append(
            [
                adr["adr_id"],
                adr["decision_family"],
                adr["status"],
                adr["scope"],
                adr["upstream_task_refs"][0],
                ", ".join(adr["required_follow_on_task_refs"]),
            ]
        )
    contract_rows = []
    for row in payload["contract_bindings"]:
        contract_rows.append(
            [
                row["contract_ref"],
                row["architecture_plane"],
                row["primary_adr_id"],
                row["bound_view_id"],
                row["status"],
            ]
        )
    gap_rows = []
    for issue in payload["gap_register"]["issues"]:
        gap_rows.append(
            [
                issue["issue_id"],
                issue["status"],
                issue["severity"],
                issue["title"],
                ", ".join(issue["linked_adr_ids"]),
            ]
        )

    return textwrap.dedent(
        f"""
        # 16 Architecture Decision Matrix

        ## Decision Matrix

        {render_table(
            ["ADR", "Family", "Status", "Scope", "Primary upstream task", "Follow-on tasks"],
            adr_rows,
        )}

        ## Contract Binding Matrix

        {render_table(
            ["Contract", "Plane", "Primary ADR", "View", "Status"],
            contract_rows,
        )}

        ## Mandatory Closures

        {chr(10).join(f"- {item}" for item in payload["mandatory_closures"])}

        ## Gap Register Summary

        {render_table(
            ["Issue", "Status", "Severity", "Title", "ADRs"],
            gap_rows,
        )}
        """
    ).strip()


def render_mermaid(payload: dict[str, Any]) -> str:
    lines = ["flowchart LR"]
    for view in payload["views"]:
        lines.append(f"  subgraph {view['view_id']}[{view['title']}]")
        for node in view["nodes"]:
            safe_label = node["label"].replace('"', '\\"')
            lines.append(f'    {node["node_id"]}["{safe_label}"]')
        for edge in view["edges"]:
            safe_label = edge["label"].replace('"', '\\"')
            lines.append(f'    {edge["from"]} -->|"{safe_label}"| {edge["to"]}')
        lines.append("  end")
    return "\n".join(lines)


def render_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload).replace("</", "<\\/")
    summary = payload["summary"]
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Vecells Architecture Atelier</title>
          <link rel="icon" href="data:," />
          <style>
            :root {{
              --canvas: #F4F7FA;
              --shell: #FFFFFF;
              --inset: #EEF2F6;
              --text-strong: #101828;
              --text-default: #1D2939;
              --text-muted: #475467;
              --border-subtle: #E4E7EC;
              --border-default: #D0D5DD;
              --architecture-accent: #335CFF;
              --topology-accent: #0F8B8D;
              --caution: #C98900;
              --critical: #C24141;
              --shadow: 0 12px 32px rgba(16, 24, 40, 0.08);
              --radius-lg: 22px;
              --radius-md: 16px;
              --radius-sm: 12px;
              --chip-h: 28px;
              --row-h: 40px;
              --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
            }}

            * {{ box-sizing: border-box; }}

            body {{
              margin: 0;
              background: radial-gradient(circle at top left, rgba(51, 92, 255, 0.08), transparent 22%), var(--canvas);
              color: var(--text-default);
              font-family: var(--font-sans);
            }}

            .page {{
              max-width: 1440px;
              margin: 0 auto;
              padding: 20px;
            }}

            .studio {{
              display: grid;
              grid-template-columns: var(--rail-width, 296px) minmax(0, 1fr) minmax(360px, 420px);
              gap: 18px;
              min-height: calc(100vh - 40px);
            }}

            .panel {{
              background: var(--shell);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow);
            }}

            .rail {{
              padding: 18px;
              display: grid;
              gap: 16px;
              align-content: start;
              position: sticky;
              top: 20px;
              height: calc(100vh - 40px);
              overflow: hidden;
            }}

            .rail.collapsed {{
              padding-inline: 12px;
            }}

            .rail.collapsed .rail-copy,
            .rail.collapsed .rail-item-copy,
            .rail.collapsed .rail-section-title,
            .rail.collapsed .rail-toggle-text {{
              display: none;
            }}

            .rail-head {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }}

            .brand {{
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
            }}

            .brand svg {{
              flex: 0 0 28px;
            }}

            .brand h1 {{
              margin: 0;
              font-size: 15px;
              color: var(--text-strong);
            }}

            .brand p {{
              margin: 2px 0 0;
              font-size: 12px;
              color: var(--text-muted);
            }}

            .toggle {{
              border: 1px solid var(--border-default);
              background: var(--inset);
              color: var(--text-default);
              border-radius: 999px;
              padding: 8px 12px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font: inherit;
            }}

            .rail-section-title {{
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}

            .rail-list {{
              display: grid;
              gap: 10px;
              overflow: auto;
              padding-right: 2px;
            }}

            .rail-item {{
              width: 100%;
              text-align: left;
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, #fff, #fbfdff);
              border-radius: var(--radius-md);
              padding: 12px;
              cursor: pointer;
              display: grid;
              gap: 8px;
            }}

            .rail-item.active {{
              border-color: rgba(51, 92, 255, 0.45);
              box-shadow: 0 0 0 2px rgba(51, 92, 255, 0.12);
            }}

            .chip-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }}

            .chip {{
              display: inline-flex;
              align-items: center;
              height: var(--chip-h);
              padding: 0 10px;
              border-radius: 999px;
              background: var(--inset);
              border: 1px solid var(--border-subtle);
              color: var(--text-muted);
              font-size: 12px;
              white-space: nowrap;
            }}

            .chip.accepted {{ color: var(--architecture-accent); }}
            .chip.deferred {{ color: var(--caution); }}
            .chip.superseded {{ color: var(--critical); }}

            .main {{
              display: grid;
              gap: 18px;
              align-content: start;
            }}

            .summary-strip {{
              padding: 18px 20px;
              display: grid;
              gap: 14px;
            }}

            .summary-top {{
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
              flex-wrap: wrap;
            }}

            .summary-top h2 {{
              margin: 0;
              font-size: 20px;
              color: var(--text-strong);
            }}

            .summary-top p {{
              margin: 6px 0 0;
              color: var(--text-muted);
              max-width: 760px;
            }}

            .summary-stats {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }}

            .summary-stat {{
              min-width: 118px;
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-md);
              background: linear-gradient(180deg, #fff, #f8fafc);
              padding: 12px 14px;
            }}

            .summary-stat strong {{
              display: block;
              font-size: 20px;
              color: var(--text-strong);
            }}

            .summary-stat span {{
              font-size: 12px;
              color: var(--text-muted);
            }}

            .filter-bar {{
              padding: 14px 18px;
              display: grid;
              gap: 14px;
            }}

            .filter-grid {{
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }}

            label {{
              display: grid;
              gap: 6px;
              font-size: 12px;
              color: var(--text-muted);
            }}

            select {{
              width: 100%;
              border: 1px solid var(--border-default);
              background: var(--shell);
              border-radius: 12px;
              padding: 10px 12px;
              color: var(--text-default);
              font: inherit;
            }}

            .view-tabs {{
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }}

            .view-tab {{
              border: 1px solid var(--border-subtle);
              background: var(--inset);
              color: var(--text-default);
              border-radius: 999px;
              padding: 8px 12px;
              cursor: pointer;
              font: inherit;
            }}

            .view-tab.active {{
              border-color: rgba(15, 139, 141, 0.35);
              background: rgba(15, 139, 141, 0.12);
              color: var(--topology-accent);
            }}

            .workspace {{
              padding: 18px;
              display: grid;
              gap: 18px;
            }}

            .canvas-card {{
              border: 1px solid var(--border-subtle);
              background: linear-gradient(180deg, #fff, #f8fbfe);
              border-radius: var(--radius-md);
              padding: 14px;
              min-height: 560px;
              display: grid;
              gap: 14px;
            }}

            .canvas-meta h3 {{
              margin: 0;
              font-size: 18px;
              color: var(--text-strong);
            }}

            .canvas-meta p {{
              margin: 6px 0 0;
              color: var(--text-muted);
            }}

            svg {{
              width: 100%;
              min-height: 560px;
              border-radius: var(--radius-md);
              background:
                linear-gradient(180deg, rgba(51, 92, 255, 0.02), rgba(15, 139, 141, 0.02)),
                linear-gradient(90deg, rgba(208, 213, 221, 0.18) 1px, transparent 1px),
                linear-gradient(rgba(208, 213, 221, 0.18) 1px, transparent 1px),
                #fff;
              background-size: auto, 40px 40px, 40px 40px, auto;
              background-position: 0 0, 0 0, 0 0, 0 0;
              border: 1px solid var(--border-subtle);
            }}

            .node {{
              cursor: pointer;
            }}

            .node rect {{
              fill: #fff;
              stroke: var(--border-default);
              stroke-width: 1.2;
              rx: 16;
              ry: 16;
            }}

            .node text {{
              font-size: 13px;
              fill: var(--text-default);
              font-family: var(--font-sans);
            }}

            .node.active rect {{
              stroke: var(--architecture-accent);
              stroke-width: 2;
              filter: drop-shadow(0 6px 18px rgba(51, 92, 255, 0.18));
            }}

            .edge {{
              stroke: rgba(29, 41, 57, 0.36);
              stroke-width: 2;
              fill: none;
            }}

            .edge-label {{
              font-size: 12px;
              fill: var(--text-muted);
              font-family: var(--font-sans);
            }}

            .workspace-table {{
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-md);
              overflow: hidden;
            }}

            table {{
              width: 100%;
              border-collapse: collapse;
            }}

            th, td {{
              border-bottom: 1px solid var(--border-subtle);
              padding: 10px 12px;
              text-align: left;
              vertical-align: top;
              font-size: 13px;
            }}

            th {{
              background: #fbfcfe;
              color: var(--text-muted);
              font-weight: 600;
            }}

            tbody tr {{
              min-height: var(--row-h);
            }}

            tbody tr.active {{
              background: rgba(51, 92, 255, 0.06);
            }}

            .gap-grid {{
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 12px;
            }}

            .gap-card {{
              border: 1px solid var(--border-subtle);
              background: #fff;
              border-radius: var(--radius-md);
              padding: 14px;
              display: grid;
              gap: 8px;
            }}

            .inspector {{
              padding: 18px;
              display: grid;
              gap: 14px;
              align-content: start;
              position: sticky;
              top: 20px;
              height: calc(100vh - 40px);
              overflow: auto;
            }}

            .inspector section {{
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-md);
              padding: 14px;
              background: linear-gradient(180deg, #fff, #fbfdff);
              display: grid;
              gap: 8px;
            }}

            .inspector h3,
            .inspector h4 {{
              margin: 0;
              color: var(--text-strong);
            }}

            .mono {{
              font-family: var(--font-mono);
              font-size: 12px;
            }}

            .list {{
              display: grid;
              gap: 6px;
            }}

            .list div {{
              color: var(--text-default);
              font-size: 13px;
            }}

            .muted {{
              color: var(--text-muted);
            }}

            @media (max-width: 1220px) {{
              .studio {{
                grid-template-columns: 296px minmax(0, 1fr);
              }}
              .inspector {{
                position: static;
                height: auto;
                grid-column: 1 / -1;
              }}
            }}

            @media (max-width: 1024px) {{
              .filter-grid {{
                grid-template-columns: 1fr;
              }}
            }}

            @media (max-width: 860px) {{
              .page {{
                padding: 12px;
              }}
              .studio {{
                grid-template-columns: 1fr;
              }}
              .rail, .inspector {{
                position: static;
                height: auto;
              }}
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
          <div class="page">
            <div class="studio" id="studio">
              <aside class="panel rail" data-testid="adr-rail" id="rail">
                <div class="rail-head">
                  <div class="brand">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" data-testid="vecells-monogram">
                      <rect x="1" y="1" width="26" height="26" rx="9" fill="#F4F7FA" stroke="#D0D5DD"/>
                      <path d="M8 9.5L14 19L20 9.5" stroke="#335CFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="rail-copy">
                      <h1>Architecture_Atelier</h1>
                      <p>Vecells target-architecture freeze</p>
                    </div>
                  </div>
                  <button class="toggle" id="railToggle" type="button" aria-label="Toggle navigation rail">
                    <span>◧</span>
                    <span class="rail-toggle-text">Rail</span>
                  </button>
                </div>
                <div>
                  <div class="rail-section-title">Digest</div>
                  <div class="chip-row rail-copy">
                    <span class="chip accepted">{summary["accepted_count"]} accepted</span>
                    <span class="chip deferred">{summary["deferred_count"]} deferred</span>
                    <span class="chip mono">{summary["source_digest"]}</span>
                  </div>
                </div>
                <div class="rail-section-title">ADR Set</div>
                <div class="rail-list" id="adrList"></div>
              </aside>

              <main class="main">
                <section class="panel summary-strip" data-testid="adr-summary-strip">
                  <div class="summary-top">
                    <div>
                      <h2>Target architecture freeze for {payload["current_baseline"]}</h2>
                      <p>{payload["mission"]}</p>
                    </div>
                    <div class="summary-stats">
                      <div class="summary-stat">
                        <strong>{summary["accepted_count"]}</strong>
                        <span>Accepted ADRs</span>
                      </div>
                      <div class="summary-stat">
                        <strong>{summary["deferred_count"]}</strong>
                        <span>Deferred ADRs</span>
                      </div>
                      <div class="summary-stat">
                        <strong>{summary["contract_binding_count"]}</strong>
                        <span>Contract bindings</span>
                      </div>
                      <div class="summary-stat">
                        <strong>{payload["upstream_input_summary"]["workload_family_count"]}</strong>
                        <span>Workload families</span>
                      </div>
                    </div>
                  </div>
                  <div class="chip-row">
                    <span class="chip mono">source digest {summary["source_digest"]}</span>
                    <span class="chip">baseline {payload["current_baseline"]}</span>
                    <span class="chip deferred">deferred {payload["deferred_baseline"]}</span>
                  </div>
                </section>

                <section class="panel filter-bar" data-testid="adr-filter-bar">
                  <div class="filter-grid">
                    <label>
                      Decision family
                      <select id="familyFilter"></select>
                    </label>
                    <label>
                      ADR status
                      <select id="statusFilter"></select>
                    </label>
                    <label>
                      Architecture view
                      <select id="viewFilter"></select>
                    </label>
                  </div>
                  <div class="view-tabs" id="viewTabs"></div>
                </section>

                <section class="panel workspace">
                  <div class="canvas-card" data-testid="architecture-canvas">
                    <div class="canvas-meta">
                      <h3 id="viewTitle"></h3>
                      <p id="viewSummary"></p>
                    </div>
                    <svg id="viewCanvas" aria-label="Architecture diagram workspace"></svg>
                  </div>

                  <div class="workspace-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Node</th>
                          <th>Kind</th>
                          <th>Primary ADR</th>
                          <th>Meaning</th>
                        </tr>
                      </thead>
                      <tbody id="viewTableBody"></tbody>
                    </table>
                  </div>

                  <div class="workspace-table" data-testid="contract-binding-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Contract</th>
                          <th>Plane</th>
                          <th>Primary ADR</th>
                          <th>View</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody id="bindingTableBody"></tbody>
                    </table>
                  </div>

                  <div class="gap-grid" id="gapGrid"></div>
                </section>
              </main>

              <aside class="panel inspector" data-testid="adr-inspector" id="inspector"></aside>
            </div>
          </div>

          <script id="studio-data" type="application/json">{data_json}</script>
          <script>
            const payload = JSON.parse(document.getElementById("studio-data").textContent);
            const state = {{
              family: "all",
              status: "all",
              selectedAdrId: payload.adrs[0].adr_id,
              selectedViewId: payload.views[0].view_id,
              selectedContractRef: payload.contract_bindings[0].contract_ref,
              railExpanded: true,
            }};

            const rail = document.getElementById("rail");
            const studio = document.getElementById("studio");
            const adrList = document.getElementById("adrList");
            const familyFilter = document.getElementById("familyFilter");
            const statusFilter = document.getElementById("statusFilter");
            const viewFilter = document.getElementById("viewFilter");
            const viewTabs = document.getElementById("viewTabs");
            const viewTitle = document.getElementById("viewTitle");
            const viewSummary = document.getElementById("viewSummary");
            const viewCanvas = document.getElementById("viewCanvas");
            const viewTableBody = document.getElementById("viewTableBody");
            const bindingTableBody = document.getElementById("bindingTableBody");
            const gapGrid = document.getElementById("gapGrid");
            const inspector = document.getElementById("inspector");

            function unique(values) {{
              return [...new Set(values)];
            }}

            function filteredAdrs() {{
              return payload.adrs.filter((adr) => {{
                const familyMatch = state.family === "all" || adr.decision_family === state.family;
                const statusMatch = state.status === "all" || adr.status === state.status;
                const viewMatch = state.selectedViewId === "all" || adr.linked_view_ids.includes(state.selectedViewId);
                return familyMatch && statusMatch && viewMatch;
              }});
            }}

            function selectedAdr() {{
              return payload.adrs.find((adr) => adr.adr_id === state.selectedAdrId) || filteredAdrs()[0] || payload.adrs[0];
            }}

            function selectedView() {{
              return payload.views.find((view) => view.view_id === state.selectedViewId) || payload.views[0];
            }}

            function populateFilters() {{
              const families = ["all", ...unique(payload.adrs.map((adr) => adr.decision_family))];
              familyFilter.innerHTML = families.map((family) => `<option value="${{family}}">${{family}}</option>`).join("");
              statusFilter.innerHTML = ["all", "accepted", "deferred", "superseded"].map((status) => `<option value="${{status}}">${{status}}</option>`).join("");
              viewFilter.innerHTML = ["all", ...payload.views.map((view) => view.view_id)].map((viewId) => {{
                return `<option value="${{viewId}}">${{viewId === "all" ? "all" : payload.views.find((view) => view.view_id === viewId).title}}</option>`;
              }}).join("");
            }}

            function renderRail() {{
              const items = filteredAdrs();
              if (!items.some((item) => item.adr_id === state.selectedAdrId)) {{
                state.selectedAdrId = items[0] ? items[0].adr_id : payload.adrs[0].adr_id;
              }}
              adrList.innerHTML = items.map((adr) => {{
                const active = adr.adr_id === state.selectedAdrId ? "active" : "";
                return `
                  <button
                    class="rail-item ${{active}}"
                    type="button"
                    data-adr-id="${{adr.adr_id}}"
                  >
                    <div class="chip-row">
                      <span class="chip mono">${{adr.adr_id}}</span>
                      <span class="chip ${{adr.status}}">${{adr.status}}</span>
                    </div>
                    <div class="rail-item-copy">
                      <strong>${{adr.title}}</strong>
                      <div class="muted">${{adr.decision_family}}</div>
                    </div>
                  </button>
                `;
              }}).join("");

              adrList.querySelectorAll("[data-adr-id]").forEach((button) => {{
                button.addEventListener("click", () => {{
                  state.selectedAdrId = button.dataset.adrId;
                  const adr = selectedAdr();
                  if (adr.linked_view_ids.includes(state.selectedViewId) === false) {{
                    state.selectedViewId = adr.linked_view_ids[0];
                  }}
                  render();
                }});
              }});
            }}

            function renderViewTabs() {{
              viewTabs.innerHTML = payload.views.map((view) => {{
                const active = view.view_id === state.selectedViewId ? "active" : "";
                return `<button class="view-tab ${{active}}" type="button" data-view-id="${{view.view_id}}">${{view.title}}</button>`;
              }}).join("");
              viewTabs.querySelectorAll("[data-view-id]").forEach((button) => {{
                button.addEventListener("click", () => {{
                  state.selectedViewId = button.dataset.viewId;
                  render();
                }});
              }});
            }}

            function renderCanvas() {{
              const view = selectedView();
              viewTitle.textContent = view.title;
              viewSummary.textContent = view.summary;
              const width = 1000;
              const height = 600;
              viewCanvas.setAttribute("viewBox", `0 0 ${{width}} ${{height}}`);
              const adr = selectedAdr();
              const nodeWidth = 190;
              const nodeHeight = 72;
              const edgeElements = view.edges.map((edge) => {{
                const from = view.nodes.find((node) => node.node_id === edge.from);
                const to = view.nodes.find((node) => node.node_id === edge.to);
                const x1 = from.x / 100 * width + nodeWidth / 2;
                const y1 = from.y / 100 * height + nodeHeight / 2;
                const x2 = to.x / 100 * width + nodeWidth / 2;
                const y2 = to.y / 100 * height + nodeHeight / 2;
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2 - 10;
                return `
                  <g data-view-id="${{view.view_id}}">
                    <path class="edge" d="M${{x1}},${{y1}} C${{x1 + 80}},${{y1}} ${{x2 - 80}},${{y2}} ${{x2}},${{y2}}" />
                    <text class="edge-label" x="${{mx}}" y="${{my}}" text-anchor="middle">${{edge.label}}</text>
                  </g>
                `;
              }}).join("");

              const nodeElements = view.nodes.map((node) => {{
                const x = node.x / 100 * width;
                const y = node.y / 100 * height;
                const active = node.adr_id === adr.adr_id ? "active" : "";
                return `
                  <g
                    class="node ${{active}}"
                    transform="translate(${{x}}, ${{y}})"
                    tabindex="0"
                    data-view-id="${{view.view_id}}"
                    data-adr-id="${{node.adr_id}}"
                    data-node-id="${{node.node_id}}"
                  >
                    <rect width="${{nodeWidth}}" height="${{nodeHeight}}" />
                    <text x="14" y="26">${{node.label}}</text>
                    <text x="14" y="50" class="mono">${{node.kind}}</text>
                  </g>
                `;
              }}).join("");

              viewCanvas.innerHTML = `
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="rgba(29, 41, 57, 0.36)"></path>
                  </marker>
                </defs>
                ${{edgeElements}}
                ${{nodeElements}}
              `;
              viewCanvas.querySelectorAll("[data-node-id]").forEach((nodeElement) => {{
                nodeElement.addEventListener("click", () => {{
                  state.selectedAdrId = nodeElement.dataset.adrId;
                  render();
                }});
                nodeElement.addEventListener("keydown", (event) => {{
                  if (event.key === "Enter" || event.key === " ") {{
                    event.preventDefault();
                    state.selectedAdrId = nodeElement.dataset.adrId;
                    render();
                  }}
                }});
              }});
            }}

            function renderViewTable() {{
              const view = selectedView();
              const adr = selectedAdr();
              viewTableBody.innerHTML = view.nodes.map((node) => {{
                const linkedEdge = view.edges.find((edge) => edge.from === node.node_id || edge.to === node.node_id);
                const active = node.adr_id === adr.adr_id ? "active" : "";
                return `
                  <tr class="${{active}}" data-view-id="${{view.view_id}}" data-adr-id="${{node.adr_id}}">
                    <td>${{node.label}}</td>
                    <td>${{node.kind}}</td>
                    <td class="mono">${{node.adr_id}}</td>
                    <td>${{linkedEdge ? linkedEdge.label : "view anchor"}}</td>
                  </tr>
                `;
              }}).join("");
            }}

            function renderBindingTable() {{
              const view = selectedView();
              const adr = selectedAdr();
              const visible = payload.contract_bindings.filter((binding) => {{
                return binding.bound_view_id === view.view_id || binding.primary_adr_id === adr.adr_id || binding.supporting_adr_ids.includes(adr.adr_id);
              }});
              bindingTableBody.innerHTML = visible.map((binding) => {{
                const active = binding.contract_ref === state.selectedContractRef ? "active" : "";
                return `
                  <tr
                    class="${{active}}"
                    data-contract-ref="${{binding.contract_ref}}"
                    data-view-id="${{binding.bound_view_id}}"
                    data-adr-id="${{binding.primary_adr_id}}"
                  >
                    <td class="mono">${{binding.contract_ref}}</td>
                    <td>${{binding.architecture_plane}}</td>
                    <td class="mono">${{binding.primary_adr_id}}</td>
                    <td class="mono">${{binding.bound_view_id}}</td>
                    <td>${{binding.status}}</td>
                  </tr>
                `;
              }}).join("");
              bindingTableBody.querySelectorAll("[data-contract-ref]").forEach((row) => {{
                row.addEventListener("click", () => {{
                  state.selectedContractRef = row.dataset.contractRef;
                  renderInspector();
                }});
              }});
            }}

            function renderGaps() {{
              gapGrid.innerHTML = payload.gap_register.issues.map((issue) => {{
                return `
                  <article class="gap-card">
                    <div class="chip-row">
                      <span class="chip mono">${{issue.issue_id}}</span>
                      <span class="chip ${{issue.status === "resolved" ? "accepted" : issue.status === "deferred" ? "deferred" : "superseded"}}">${{issue.status}}</span>
                    </div>
                    <strong>${{issue.title}}</strong>
                    <div class="muted">${{issue.summary}}</div>
                  </article>
                `;
              }}).join("");
            }}

            function renderInspector() {{
              const adr = selectedAdr();
              const view = selectedView();
              const binding = payload.contract_bindings.find((row) => row.contract_ref === state.selectedContractRef) || payload.contract_bindings[0];
              const gapIssues = payload.gap_register.issues.filter((issue) => issue.linked_adr_ids.includes(adr.adr_id));
              inspector.innerHTML = `
                <section>
                  <div class="chip-row">
                    <span class="chip mono">${{adr.adr_id}}</span>
                    <span class="chip ${{adr.status}}">${{adr.status}}</span>
                    <span class="chip">${{adr.scope}}</span>
                  </div>
                  <h3>${{adr.title}}</h3>
                  <div class="muted">${{adr.problem_statement}}</div>
                </section>
                <section>
                  <h4>Decision</h4>
                  <div>${{adr.decision}}</div>
                  <div class="muted">${{adr.why_now}}</div>
                </section>
                <section>
                  <h4>Source refs</h4>
                  <div class="list">${{adr.source_refs.map((ref) => `<div>${{ref}}</div>`).join("")}}</div>
                </section>
                <section>
                  <h4>Consequences</h4>
                  <div class="list">${{adr.consequences_positive.map((item) => `<div>+ ${{item}}</div>`).join("")}}</div>
                  <div class="list">${{adr.consequences_negative.map((item) => `<div>- ${{item}}</div>`).join("")}}</div>
                </section>
                <section>
                  <h4>Linked tasks and contracts</h4>
                  <div class="list">${{adr.upstream_task_refs.map((item) => `<div class="mono">${{item}}</div>`).join("")}}</div>
                  <div class="list">${{adr.linked_contract_refs.map((item) => `<div class="mono">${{item}}</div>`).join("")}}</div>
                </section>
                <section>
                  <h4>Active view and contract</h4>
                  <div class="muted">${{view.title}}</div>
                  <div class="mono">${{binding.contract_ref}}</div>
                  <div>${{binding.binding_law}}</div>
                </section>
                <section>
                  <h4>Gap and risk links</h4>
                  <div class="list">${{gapIssues.map((issue) => `<div><span class="mono">${{issue.issue_id}}</span> ${{issue.title}}</div>`).join("") || "<div class='muted'>No linked gaps.</div>"}}</div>
                </section>
              `;
            }}

            function render() {{
              familyFilter.value = state.family;
              statusFilter.value = state.status;
              viewFilter.value = state.selectedViewId;
              renderRail();
              renderViewTabs();
              renderCanvas();
              renderViewTable();
              renderBindingTable();
              renderGaps();
              renderInspector();
            }}

            populateFilters();
            familyFilter.addEventListener("change", (event) => {{
              state.family = event.target.value;
              render();
            }});
            statusFilter.addEventListener("change", (event) => {{
              state.status = event.target.value;
              render();
            }});
            viewFilter.addEventListener("change", (event) => {{
              state.selectedViewId = event.target.value === "all" ? payload.views[0].view_id : event.target.value;
              render();
            }});
            document.getElementById("railToggle").addEventListener("click", () => {{
              state.railExpanded = !state.railExpanded;
              studio.style.setProperty("--rail-width", state.railExpanded ? "296px" : "72px");
              rail.classList.toggle("collapsed", !state.railExpanded);
            }});
            studio.style.setProperty("--rail-width", "296px");
            render();
          </script>
        </body>
        </html>
        """
    ).strip()


def write_outputs(payload: dict[str, Any]) -> None:
    write_json(ADR_INDEX_PATH, payload)
    write_csv(ADR_MATRIX_PATH, [flatten_adr_for_csv(adr) for adr in payload["adrs"]])
    write_csv(CONTRACT_BINDING_PATH, payload["contract_bindings"])
    write_json(GAP_REGISTER_PATH, payload["gap_register"])

    write_text(ADR_INDEX_DOC_PATH, render_adr_index_doc(payload))
    write_text(ADR_SET_DOC_PATH, render_target_adr_set_doc(payload))
    write_text(
        SYSTEM_CONTEXT_DOC_PATH,
        render_view_doc(
            payload,
            ["view_system_context", "view_container_topology"],
            "16 System Context and Container Model",
            "These views freeze the outer system context and the inner workload-family baseline chosen in seq_011.",
        ),
    )
    write_text(
        DOMAIN_RUNTIME_DOC_PATH,
        render_view_doc(
            payload,
            ["view_domain_runtime_control_plane"],
            "16 Domain Runtime and Control Plane Architecture",
            "This view captures lifecycle ownership, continuity proof, and cross-domain control-plane law.",
        ),
    )
    write_text(
        FRONTEND_GATEWAY_DOC_PATH,
        render_view_doc(
            payload,
            ["view_frontend_gateway_design_contract"],
            "16 Frontend Gateway and Design Contract Architecture",
            "This view freezes shell law, gateway publication, and design-contract publication in one browser-authority model.",
        ),
    )
    write_text(
        DATA_EVENT_DOC_PATH,
        render_view_doc(
            payload,
            ["view_data_event_storage_integration"],
            "16 Data Event Storage and Integration Architecture",
            "This view keeps data truth, eventing, evidence, storage, and adapter settlement aligned.",
        ),
    )
    write_text(
        RELEASE_ASSURANCE_DOC_PATH,
        render_view_doc(
            payload,
            ["view_release_assurance_resilience"],
            "16 Release Assurance and Resilience Architecture",
            "This view freezes release, watch, readiness, and recovery posture as one authority model.",
        ),
    )
    write_text(DECISION_MATRIX_DOC_PATH, render_decision_matrix_doc(payload))
    write_text(MERMAID_PATH, render_mermaid(payload))
    write_text(STUDIO_HTML_PATH, render_html(payload))


def main() -> None:
    payload = build_bundle()
    write_outputs(payload)
    print(
        json.dumps(
            {
                "architecture_freeze_id": payload["architecture_freeze_id"],
                "adr_count": payload["summary"]["adr_count"],
                "accepted_count": payload["summary"]["accepted_count"],
                "deferred_count": payload["summary"]["deferred_count"],
                "contract_binding_count": payload["summary"]["contract_binding_count"],
                "view_count": payload["summary"]["view_count"],
                "source_digest": payload["summary"]["source_digest"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
