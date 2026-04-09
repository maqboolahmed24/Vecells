#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
PRODUCT_SCOPE_PATH = DATA_DIR / "product_scope_matrix.csv"
ENDPOINT_MATRIX_PATH = DATA_DIR / "endpoint_matrix.csv"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINES_PATH = DATA_DIR / "state_machines.json"
EXTERNAL_DEPENDENCIES_PATH = DATA_DIR / "external_dependencies.json"
DATA_CLASSIFICATION_PATH = DATA_DIR / "data_classification_matrix.csv"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_workload_families.json"
WORKSPACE_GRAPH_PATH = DATA_DIR / "workspace_package_graph.json"

SERVICE_RUNTIME_MATRIX_PATH = DATA_DIR / "service_runtime_matrix.csv"
EVENT_NAMESPACE_MATRIX_PATH = DATA_DIR / "canonical_event_namespace_matrix.csv"
STORE_RETENTION_MATRIX_PATH = DATA_DIR / "store_and_retention_matrix.csv"
ASYNC_EFFECT_PROOF_MATRIX_PATH = DATA_DIR / "async_effect_proof_matrix.csv"
TIMER_MATRIX_PATH = DATA_DIR / "timer_orchestration_matrix.csv"
IDEMPOTENCY_RULES_PATH = DATA_DIR / "idempotency_and_replay_rules.json"

SERVICE_DOC_PATH = DOCS_DIR / "13_backend_runtime_service_baseline.md"
EVENT_DOC_PATH = DOCS_DIR / "13_event_spine_and_namespace_baseline.md"
STORAGE_DOC_PATH = DOCS_DIR / "13_storage_and_persistence_baseline.md"
ASYNC_DOC_PATH = DOCS_DIR / "13_async_workflow_timer_and_effect_processing.md"
REPLAY_DOC_PATH = DOCS_DIR / "13_outbox_inbox_callback_replay_and_idempotency.md"
FHIR_DOC_PATH = DOCS_DIR / "13_fhir_representation_and_projection_boundary.md"
ATLAS_HTML_PATH = DOCS_DIR / "13_backend_runtime_topology_atlas.html"
MERMAID_PATH = DOCS_DIR / "13_backend_dataflow.mmd"

MISSION = (
    "Choose one enforceable Vecells backend baseline covering service decomposition, event "
    "namespace law, authoritative storage boundaries, deterministic projection rebuilds, "
    "timer orchestration, and proof-based external settlement without vendor lock-in."
)

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "phase-3-the-human-checkpoint.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "callback-and-clinician-messaging-loop.md",
    "platform-runtime-and-release-blueprint.md",
    "forensic-audit-findings.md",
    "blueprint-init.md",
]

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="left-rail"',
    'data-testid="hero-strip"',
    'data-testid="filter-service-family"',
    'data-testid="filter-context"',
    'data-testid="filter-namespace"',
    'data-testid="filter-store-class"',
    'data-testid="filter-proof-class"',
    'data-testid="filter-timer-family"',
    'data-testid="search-input"',
    'data-testid="flow-canvas"',
    'data-testid="service-inspector"',
    'data-testid="store-inspector"',
    'data-testid="timer-panel"',
    'data-testid="selection-state"',
]

CANONICAL_NAMESPACE_CODES = [
    "request",
    "intake",
    "identity",
    "access",
    "telephony",
    "safety",
    "triage",
    "booking",
    "hub",
    "pharmacy",
    "patient",
    "communication",
    "reachability",
    "exception",
    "confirmation",
    "capacity",
    "support",
    "assistive",
    "policy",
    "release",
    "analytics",
    "audit",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        raise SystemExit(f"Cannot write empty CSV: {path}")
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def join_items(values: list[str] | tuple[str, ...]) -> str:
    return "; ".join(values)


def csv_ready(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    converted: list[dict[str, Any]] = []
    for row in rows:
        converted.append(
            {
                key: join_items(value) if isinstance(value, list) else value
                for key, value in row.items()
            }
        )
    return converted


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    def clean(value: Any) -> str:
        text = "" if value is None else str(value)
        return text.replace("|", "\\|").replace("\n", "<br>")

    head = "| " + " | ".join(headers) + " |"
    sep = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(clean(value) for value in row) + " |" for row in rows]
    return "\n".join([head, sep, *body])


def ensure_prerequisites() -> dict[str, Any]:
    required = {
        REQUIREMENT_REGISTRY_PATH: "task 001 requirement registry",
        PRODUCT_SCOPE_PATH: "task 003 scope boundary",
        ENDPOINT_MATRIX_PATH: "task 005 endpoint matrix",
        OBJECT_CATALOG_PATH: "task 006 object catalog",
        STATE_MACHINES_PATH: "task 007 state machine atlas",
        EXTERNAL_DEPENDENCIES_PATH: "task 008 external dependency inventory",
        DATA_CLASSIFICATION_PATH: "task 010 data classification matrix",
        RUNTIME_TOPOLOGY_PATH: "task 011 runtime topology baseline",
        WORKSPACE_GRAPH_PATH: "task 012 workspace baseline",
    }
    missing = [
        f"PREREQUISITE_GAP_SEQ_013 missing {label}: {path}"
        for path, label in required.items()
        if not path.exists()
    ]
    if missing:
        raise SystemExit("\n".join(missing))

    endpoint_rows = load_csv(ENDPOINT_MATRIX_PATH)
    classification_rows = load_csv(DATA_CLASSIFICATION_PATH)
    object_payload = load_json(OBJECT_CATALOG_PATH)
    state_payload = load_json(STATE_MACHINES_PATH)
    dependency_payload = load_json(EXTERNAL_DEPENDENCIES_PATH)
    topology_payload = load_json(RUNTIME_TOPOLOGY_PATH)
    workspace_payload = load_json(WORKSPACE_GRAPH_PATH)

    checks = [
        (len(endpoint_rows) == 15, "PREREQUISITE_GAP_SEQ_013 endpoint matrix row count drifted."),
        (
            object_payload.get("summary", {}).get("object_count", 0) >= 900,
            "PREREQUISITE_GAP_SEQ_013 object catalog looks incomplete.",
        ),
        (
            state_payload.get("summary", {}).get("machine_count", 0) >= 40,
            "PREREQUISITE_GAP_SEQ_013 state machine atlas looks incomplete.",
        ),
        (
            dependency_payload.get("summary", {}).get("dependency_count", 0) >= 18,
            "PREREQUISITE_GAP_SEQ_013 dependency inventory looks incomplete.",
        ),
        (
            len(classification_rows) >= 70,
            "PREREQUISITE_GAP_SEQ_013 data classification model looks incomplete.",
        ),
        (
            topology_payload.get("summary", {}).get("workload_family_count", 0) >= 40,
            "PREREQUISITE_GAP_SEQ_013 runtime topology summary drifted.",
        ),
        (
            workspace_payload.get("summary", {}).get("service_count", 0) >= 8,
            "PREREQUISITE_GAP_SEQ_013 workspace service baseline drifted.",
        ),
    ]
    for condition, message in checks:
        if not condition:
            raise SystemExit(message)

    return {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "product_scope_rows": len(load_csv(PRODUCT_SCOPE_PATH)),
        "endpoint_row_count": len(endpoint_rows),
        "object_count": object_payload["summary"]["object_count"],
        "state_machine_count": state_payload["summary"]["machine_count"],
        "dependency_count": dependency_payload["summary"]["dependency_count"],
        "classification_row_count": len(classification_rows),
        "runtime_workload_family_count": topology_payload["summary"]["workload_family_count"],
        "workspace_service_count": workspace_payload["summary"]["service_count"],
    }


def build_service_decomposition_scorecard() -> list[dict[str, Any]]:
    return [
        {
            "option_id": "OPT_MICROSERVICES_BY_BOUNDED_CONTEXT",
            "label": "Deploy-many microservices by bounded context",
            "workload_boundary_fidelity": 5,
            "replay_and_effect_discipline": 4,
            "independent_scaling": 5,
            "local_determinism": 2,
            "operational_complexity": 1,
            "total_score": 17,
            "decision": "rejected",
            "rejection_reason": (
                "Rejected because Vecells needs hard workload-family seams and replay discipline, "
                "but the corpus does not justify dozens of independently deployed services before "
                "the event, proof, and timer contracts are implemented."
            ),
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#Runtime rules",
                "forensic-audit-findings.md#Finding 101 - Same-shell confirmation still understated settlement, return, and continuation posture",
            ],
        },
        {
            "option_id": "OPT_SMALL_EXECUTABLES_STRONG_MODULES",
            "label": "Small number of executables with strong bounded-context modules",
            "workload_boundary_fidelity": 5,
            "replay_and_effect_discipline": 5,
            "independent_scaling": 4,
            "local_determinism": 5,
            "operational_complexity": 4,
            "total_score": 23,
            "decision": "chosen",
            "rejection_reason": "",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#2. Required platform services",
                "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
                "12_monorepo_build_system_decision.md",
            ],
        },
        {
            "option_id": "OPT_MONOLITH_PLUS_WORKERS",
            "label": "Modular monolith for domains plus workers for projection and integration",
            "workload_boundary_fidelity": 3,
            "replay_and_effect_discipline": 4,
            "independent_scaling": 2,
            "local_determinism": 5,
            "operational_complexity": 5,
            "total_score": 19,
            "decision": "rejected",
            "rejection_reason": (
                "Rejected because it would blur the command, projection, integration, and assurance "
                "planes that the runtime topology and event contracts already treat as distinct "
                "workload families."
            ),
            "source_refs": [
                "11_gateway_surface_and_runtime_topology_baseline.md",
                "platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
            ],
        },
    ]


def build_store_topology_scorecard() -> list[dict[str, Any]]:
    return [
        {
            "option_id": "OPT_FHIR_FIRST_PRIMARY_STORE",
            "label": "FHIR-first relational store with direct UI reads",
            "domain_truth_separation": 1,
            "projection_rebuild_safety": 1,
            "interoperability_fit": 4,
            "operator_clarity": 2,
            "total_score": 8,
            "decision": "rejected",
            "rejection_reason": "Rejected because blueprint-init and Phase 0 both require Vecells-first lifecycle truth with FHIR as a derived representation layer.",
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success",
            ],
        },
        {
            "option_id": "OPT_SEPARATE_DOMAIN_EVENT_PROJECTION_AUDIT",
            "label": "Separate domain, FHIR, event, projection, object, timer, and audit classes",
            "domain_truth_separation": 5,
            "projection_rebuild_safety": 5,
            "interoperability_fit": 5,
            "operator_clarity": 5,
            "total_score": 20,
            "decision": "chosen",
            "rejection_reason": "",
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
            ],
        },
        {
            "option_id": "OPT_DOMAIN_AND_PROJECTION_SHARED_RELATIONAL",
            "label": "Domain and projection tables in one mixed relational schema",
            "domain_truth_separation": 2,
            "projection_rebuild_safety": 2,
            "interoperability_fit": 3,
            "operator_clarity": 3,
            "total_score": 10,
            "decision": "rejected",
            "rejection_reason": "Rejected because mixed domain and projection ownership would recreate the projection-implies-truth failure mode called out by the corpus.",
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
                "forensic-audit-findings.md#Finding 44 - Projection freshness and stale-state awareness were absent",
            ],
        },
    ]


def build_event_backbone_scorecard() -> list[dict[str, Any]]:
    return [
        {
            "option_id": "OPT_PRODUCER_LOCAL_EVENT_NAMES",
            "label": "Producer-local event names consumed directly downstream",
            "contract_stability": 1,
            "privacy_posture": 2,
            "replay_safety": 2,
            "observability_clarity": 1,
            "total_score": 6,
            "decision": "rejected",
            "rejection_reason": "Rejected because Phase 0 explicitly forbids vendor callbacks, ingest aliases, and shell-local event names from reaching projections, analytics, assurance, or audit directly.",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#CanonicalEventNamespace",
            ],
        },
        {
            "option_id": "OPT_CANONICAL_EVENT_SPINE",
            "label": "Canonical namespace spine with normalization and quarantine",
            "contract_stability": 5,
            "privacy_posture": 5,
            "replay_safety": 5,
            "observability_clarity": 5,
            "total_score": 20,
            "decision": "chosen",
            "rejection_reason": "",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#CanonicalEventContract",
                "forensic-audit-findings.md#Finding 62 - The event catalogue lacked degraded receipt events",
            ],
        },
        {
            "option_id": "OPT_FHIR_DELTA_FEED_PRIMARY",
            "label": "FHIR change feed as the primary internal event source",
            "contract_stability": 2,
            "privacy_posture": 2,
            "replay_safety": 2,
            "observability_clarity": 2,
            "total_score": 8,
            "decision": "rejected",
            "rejection_reason": "Rejected because FHIR rows are derivative, not the governing source of request, blocker, settlement, and continuity truth.",
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
                "forensic-audit-findings.md#Finding 40 - External outcomes were modeled as UI actions instead of adapter events",
            ],
        },
    ]


def build_namespace_rows() -> list[dict[str, Any]]:
    rows = [
        ("request", "foundation_control_plane", "domain_lifecycle", "authoritative", ["foundation_control_plane"], "operational_internal_non_phi"),
        ("intake", "foundation_control_plane", "domain_lifecycle", "authoritative", ["foundation_control_plane"], "operational_internal_non_phi"),
        ("identity", "foundation_identity_access", "control_plane", "authoritative", ["foundation_identity_access"], "security_or_secret_sensitive"),
        ("access", "foundation_identity_access", "control_plane", "authoritative", ["foundation_identity_access"], "security_or_secret_sensitive"),
        ("telephony", "callback_messaging", "continuity", "authoritative", ["callback_messaging", "foundation_identity_access"], "descriptor_and_hash_only"),
        ("safety", "foundation_control_plane", "domain_lifecycle", "authoritative", ["foundation_control_plane"], "operational_internal_non_phi"),
        ("triage", "triage_human_checkpoint", "domain_lifecycle", "authoritative", ["triage_human_checkpoint"], "operational_internal_non_phi"),
        ("booking", "booking", "domain_lifecycle", "authoritative", ["booking"], "operational_internal_non_phi"),
        ("hub", "hub_coordination", "domain_lifecycle", "authoritative", ["hub_coordination"], "operational_internal_non_phi"),
        ("pharmacy", "pharmacy", "domain_lifecycle", "authoritative", ["pharmacy"], "operational_internal_non_phi"),
        ("patient", "patient_experience", "continuity", "derived_surface", ["patient_experience", "projection"], "descriptor_and_hash_only"),
        ("communication", "callback_messaging", "domain_lifecycle", "authoritative", ["callback_messaging"], "descriptor_and_hash_only"),
        ("reachability", "foundation_identity_access", "recovery", "authoritative", ["foundation_identity_access", "callback_messaging"], "descriptor_and_hash_only"),
        ("exception", "foundation_control_plane", "recovery", "authoritative", ["foundation_control_plane", "assurance_and_governance"], "descriptor_and_hash_only"),
        ("confirmation", "foundation_control_plane", "continuity", "authoritative", ["booking", "hub_coordination", "pharmacy", "callback_messaging"], "descriptor_and_hash_only"),
        ("capacity", "booking", "observability", "authoritative", ["booking", "hub_coordination"], "descriptor_and_hash_only"),
        ("support", "staff_support_operations", "recovery", "authoritative", ["staff_support_operations"], "audit_reference_only"),
        ("assistive", "assistive", "observability", "observational", ["assistive"], "descriptor_and_hash_only"),
        ("policy", "platform_configuration", "control_plane", "authoritative", ["platform_configuration", "runtime_release"], "descriptor_and_hash_only"),
        ("release", "runtime_release", "control_plane", "authoritative", ["runtime_release", "assurance_and_governance"], "descriptor_and_hash_only"),
        ("analytics", "assurance_and_governance", "observability", "observational", ["projection", "assurance_and_governance"], "descriptor_and_hash_only"),
        ("audit", "assurance_and_governance", "observability", "observational", ["assurance_and_governance", "foundation_control_plane"], "audit_reference_only"),
    ]
    output: list[dict[str, Any]] = []
    for namespace_code, owner, purpose_class, family_role, producers, disclosure in rows:
        output.append(
            {
                "namespace_code": namespace_code,
                "canonical_event_namespace_ref": f"CanonicalEventNamespace({namespace_code})",
                "owning_bounded_context_ref": owner,
                "event_purpose_class": purpose_class,
                "authoritative_family_role": family_role,
                "allowed_producer_context_refs": producers,
                "default_disclosure_class": disclosure,
                "compatibility_mode_default": "additive_only",
                "replay_semantics_default": "append_only" if family_role == "authoritative" else "observational",
                "normalization_rule_required": "yes",
                "quarantine_component_ref": "queue_event_normalization_quarantine",
                "payload_privacy_rule": "artifact_ref_or_masked_descriptor_only",
                "unknown_producer_posture": "quarantine_and_raise_assurance_gap",
                "source_refs": [
                    "phase-0-the-foundation-protocol.md#CanonicalEventNamespace",
                    "phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
                ],
                "notes": (
                    "Namespace is published and contract-owned; producers may not bypass normalization "
                    "or carry raw sensitive payload bodies across the spine."
                ),
            }
        )
    return output


def build_runtime_components() -> list[dict[str, Any]]:
    return [
        {
            "runtime_component_id": "svc_api_gateway",
            "runtime_component_name": "API gateway and route-scoped BFF ingress",
            "component_kind": "service",
            "flow_lane": "ingress",
            "owning_bounded_context_refs": ["foundation_runtime_experience"],
            "runtime_workload_family_ref": "wf_public_edge",
            "governing_object_refs": [
                "GatewayBffSurface",
                "RouteIntentBinding",
                "FrontendContractManifest",
                "AudienceSurfaceRuntimeBinding",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(route-scoped passthrough)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(access.capability.evaluated)",
                "CanonicalEventContract(patient.route.intent.bound)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(release.runtime.publication.updated)",
                "CanonicalEventContract(policy.scope.binding.updated)",
            ],
            "projection_contract_refs": [
                "ProjectionContractVersionSet(route-family active bundle)",
            ],
            "namespace_refs": ["access", "patient", "release", "policy"],
            "store_class": "cache",
            "authoritative_truth_role": "Published route and scope boundary only; never domain truth.",
            "tenant_scope_mode": [
                "public_pre_identity",
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_org_scoped_staff",
                "cross_org_hub_scope",
                "servicing_site_scope",
                "support_investigation_scope",
                "platform_governance_scope",
            ],
            "data_classification_refs": [
                "public_safe",
                "operational_internal_non_phi",
                "security_or_secret_sensitive",
            ],
            "idempotency_strategy_ref": "IDEMP_BROWSER_COMMAND_PASSTHROUGH",
            "replay_strategy_ref": "REPLAY_ROUTE_INTENT_REBIND",
            "external_proof_class": "none",
            "timer_dependency_refs": ["TIM_SESSION_EXPIRY", "TIM_ACCESS_GRANT_EXPIRY", "TIM_SECURE_LINK_RECOVERY_EXPIRY"],
            "endpoint_refs": [
                "triage_more_info_cycle",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
                "11_gateway_surface_and_runtime_topology_baseline.md",
            ],
            "notes": "Logical BFF ingress stays route-contract-first and may not join raw stores or call adapters directly.",
        },
        {
            "runtime_component_id": "svc_command_api",
            "runtime_component_name": "Command API and authoritative mutation orchestrator",
            "component_kind": "service",
            "flow_lane": "command",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_command",
            "governing_object_refs": [
                "ScopedMutationGate",
                "CommandActionRecord",
                "CommandSettlementRecord",
                "LifecycleCoordinator",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(intake.*)",
                "MutationCommandContract(triage.*)",
                "MutationCommandContract(communication.*)",
                "MutationCommandContract(booking.*)",
                "MutationCommandContract(hub.*)",
                "MutationCommandContract(pharmacy.*)",
                "MutationCommandContract(support.*)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(request.*)",
                "CanonicalEventContract(safety.*)",
                "CanonicalEventContract(triage.*)",
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(hub.*)",
                "CanonicalEventContract(pharmacy.*)",
                "CanonicalEventContract(reachability.*)",
                "CanonicalEventContract(confirmation.*)",
                "CanonicalEventContract(exception.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(identity.*)",
                "CanonicalEventContract(access.*)",
                "CanonicalEventContract(policy.*)",
                "CanonicalEventContract(release.*)",
            ],
            "projection_contract_refs": [],
            "namespace_refs": ["request", "intake", "safety", "triage", "booking", "hub", "pharmacy", "reachability", "exception", "confirmation"],
            "store_class": "transactional_domain",
            "authoritative_truth_role": "Only writer of canonical aggregates, settlements, blockers, and closure gates.",
            "tenant_scope_mode": [
                "public_pre_identity",
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_subject_embedded",
                "tenant_org_scoped_staff",
                "cross_org_hub_scope",
                "servicing_site_scope",
                "support_tenant_delegate",
                "support_investigation_scope",
                "multi_tenant_operational_watch",
                "platform_governance_scope",
                "inherited_from_owner_shell",
            ],
            "data_classification_refs": [
                "operational_internal_non_phi",
                "patient_identifying",
                "contact_sensitive",
                "clinical_sensitive",
                "identity_proof_sensitive",
            ],
            "idempotency_strategy_ref": "IDEMP_MUTATION_COMMAND",
            "replay_strategy_ref": "REPLAY_COMMAND_SETTLEMENT_CHAIN",
            "external_proof_class": "review_disposition",
            "timer_dependency_refs": [
                "TIM_MORE_INFO_REPLY_WINDOW",
                "TIM_CALLBACK_EXPECTATION_WINDOW",
                "TIM_BOOKING_CONFIRMATION_GATE",
                "TIM_HUB_COORDINATION_SLA",
                "TIM_PHARMACY_DISPATCH_PROOF_DEADLINE",
            ],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#2.8 ScopedMutationGate",
                "phase-0-the-foundation-protocol.md#2.3 LifecycleCoordinator",
                "platform-runtime-and-release-blueprint.md#MutationCommandContract",
            ],
            "notes": "No downstream domain, adapter, or projection service may write canonical request state directly.",
        },
        {
            "runtime_component_id": "svc_projection_worker",
            "runtime_component_name": "Projection worker and rebuild engine",
            "component_kind": "worker",
            "flow_lane": "read",
            "owning_bounded_context_refs": ["foundation_runtime_experience"],
            "runtime_workload_family_ref": "wf_projection",
            "governing_object_refs": [
                "ProjectionContractFamily",
                "ProjectionContractVersion",
                "ProjectionContractVersionSet",
                "ProjectionQueryContract",
                "LiveUpdateChannelContract",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(patient.projection.updated)",
                "CanonicalEventContract(analytics.readiness.updated)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(request.*)",
                "CanonicalEventContract(triage.*)",
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(hub.*)",
                "CanonicalEventContract(pharmacy.*)",
                "CanonicalEventContract(communication.*)",
                "CanonicalEventContract(reachability.*)",
                "CanonicalEventContract(confirmation.*)",
            ],
            "projection_contract_refs": [
                "ProjectionContractFamily(all published route families)",
                "ProjectionContractVersionSet(active route tuples)",
            ],
            "namespace_refs": ["request", "triage", "booking", "hub", "pharmacy", "patient", "communication", "reachability", "confirmation", "analytics"],
            "store_class": "projection_read",
            "authoritative_truth_role": "Derived audience-safe read truth only; never canonical write authority.",
            "tenant_scope_mode": [
                "public_pre_identity",
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_subject_embedded",
                "tenant_org_scoped_staff",
                "cross_org_hub_scope",
                "servicing_site_scope",
                "support_tenant_delegate",
                "support_investigation_scope",
                "multi_tenant_operational_watch",
                "platform_governance_scope",
                "inherited_from_owner_shell",
            ],
            "data_classification_refs": [
                "public_safe",
                "operational_internal_non_phi",
                "patient_identifying",
                "clinical_sensitive",
                "audit_investigation_restricted",
            ],
            "idempotency_strategy_ref": "IDEMP_PROJECTION_CURSOR",
            "replay_strategy_ref": "REPLAY_PROJECTION_FROM_EVENT_HISTORY",
            "external_proof_class": "projection_visible",
            "timer_dependency_refs": [
                "TIM_BOOKING_CONFIRMATION_GATE",
                "TIM_WAITLIST_DEADLINE",
                "TIM_HUB_PATIENT_CHOICE_EXPIRY",
                "TIM_PHARMACY_OUTCOME_RECONCILIATION_WINDOW",
            ],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
                "platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
            ],
            "notes": "Rebuilds from immutable canonical events and contract digests; browser reads never join raw stores client-side.",
        },
        {
            "runtime_component_id": "svc_notification_worker",
            "runtime_component_name": "Notification, callback, and controlled resend worker",
            "component_kind": "worker",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["callback_messaging"],
            "runtime_workload_family_ref": "wf_integration",
            "governing_object_refs": [
                "MessageDispatchEnvelope",
                "MessageDeliveryEvidenceBundle",
                "CallbackAttemptRecord",
                "CallbackResolutionGate",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(communication.dispatch.*)",
                "MutationCommandContract(callback.schedule.*)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(communication.delivery.*)",
                "CanonicalEventContract(telephony.callback.*)",
                "CanonicalEventContract(reachability.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(communication.*)",
                "CanonicalEventContract(reachability.*)",
                "CanonicalEventContract(policy.*)",
            ],
            "projection_contract_refs": [
                "ProjectionContractFamily(messages and callback status)",
            ],
            "namespace_refs": ["communication", "telephony", "reachability", "patient"],
            "store_class": "event_log",
            "authoritative_truth_role": "External-effect orchestrator only; outcome truth upgrades through evidence bundles and resolution gates.",
            "tenant_scope_mode": [
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_org_scoped_staff",
                "support_tenant_delegate",
                "support_investigation_scope",
            ],
            "data_classification_refs": [
                "contact_sensitive",
                "clinical_sensitive",
                "operational_internal_non_phi",
            ],
            "idempotency_strategy_ref": "IDEMP_ADAPTER_EFFECT",
            "replay_strategy_ref": "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            "external_proof_class": "external_confirmation",
            "timer_dependency_refs": [
                "TIM_MORE_INFO_REMINDERS",
                "TIM_CALLBACK_EXPECTATION_WINDOW",
                "TIM_CALLBACK_MISSED_WINDOW_REPAIR",
                "TIM_HUB_PRACTICE_ACK_DUE",
            ],
            "endpoint_refs": [
                "urgent_diversion",
                "triage_more_info_cycle",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "patient_contact_route_repair",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [
                "dep_telephony_ivr_recording_provider",
                "dep_sms_notification_provider",
                "dep_email_notification_provider",
                "dep_origin_practice_ack_rail",
            ],
            "source_refs": [
                "callback-and-clinician-messaging-loop.md",
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
            "notes": "Transport acceptance never becomes terminal user-visible success without the linked evidence bundle or callback outcome proof.",
        },
        {
            "runtime_component_id": "svc_integration_worker",
            "runtime_component_name": "External adapter and receipt ingestion worker",
            "component_kind": "worker",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["foundation_control_plane", "booking", "hub_coordination", "pharmacy"],
            "runtime_workload_family_ref": "wf_integration",
            "governing_object_refs": [
                "AdapterContractProfile",
                "DependencyDegradationProfile",
                "AdapterDispatchAttempt",
                "AdapterReceiptCheckpoint",
                "ExternalConfirmationGate",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(booking.commit.*)",
                "MutationCommandContract(hub.commit.*)",
                "MutationCommandContract(pharmacy.dispatch.*)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(booking.confirmation.*)",
                "CanonicalEventContract(hub.practice_visibility.*)",
                "CanonicalEventContract(pharmacy.dispatch.*)",
                "CanonicalEventContract(pharmacy.outcome.*)",
                "CanonicalEventContract(capacity.snapshot.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(hub.*)",
                "CanonicalEventContract(pharmacy.*)",
                "CanonicalEventContract(policy.*)",
                "CanonicalEventContract(release.*)",
            ],
            "projection_contract_refs": [],
            "namespace_refs": ["booking", "hub", "pharmacy", "confirmation", "capacity", "policy", "release"],
            "store_class": "event_log",
            "authoritative_truth_role": "Adapter plane only; authoritative case truth still upgrades through command settlements and confirmation gates.",
            "tenant_scope_mode": [
                "tenant_org_scoped_staff",
                "cross_org_hub_scope",
                "servicing_site_scope",
                "platform_governance_scope",
            ],
            "data_classification_refs": [
                "operational_internal_non_phi",
                "patient_identifying",
                "clinical_sensitive",
                "security_or_secret_sensitive",
            ],
            "idempotency_strategy_ref": "IDEMP_ADAPTER_EFFECT",
            "replay_strategy_ref": "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            "external_proof_class": "external_confirmation",
            "timer_dependency_refs": [
                "TIM_BOOKING_CONFIRMATION_GATE",
                "TIM_WAITLIST_DEADLINE",
                "TIM_HUB_CANDIDATE_REFRESH",
                "TIM_HUB_PATIENT_CHOICE_EXPIRY",
                "TIM_HUB_PRACTICE_ACK_DUE",
                "TIM_PHARMACY_DISPATCH_PROOF_DEADLINE",
                "TIM_PHARMACY_OUTCOME_RECONCILIATION_WINDOW",
            ],
            "endpoint_refs": [
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [
                "dep_nhs_login_rail",
                "dep_local_booking_supplier_adapters",
                "dep_network_capacity_partner_feeds",
                "dep_cross_org_secure_messaging_mesh",
                "dep_pharmacy_referral_transport",
                "dep_pharmacy_outcome_observation",
                "dep_pharmacy_urgent_return_professional_routes",
                "dep_pharmacy_directory_dohs",
            ],
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
                "phase-4-the-booking-engine.md",
                "phase-5-the-network-horizon.md",
                "phase-6-the-pharmacy-loop.md",
            ],
            "notes": "Every supplier, transport, webhook, and inbox callback remains behind this plane and resolves through canonical receipts before it can affect case truth.",
        },
        {
            "runtime_component_id": "svc_assurance_worker",
            "runtime_component_name": "Assurance, audit, and replay guard worker",
            "component_kind": "worker",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["assurance_and_governance"],
            "runtime_workload_family_ref": "wf_assurance_security",
            "governing_object_refs": [
                "AssuranceSliceTrustRecord",
                "AccessEventIndex",
                "ReplayCollisionReview",
                "InvestigationScopeEnvelope",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(support.restore.*)",
                "MutationCommandContract(assurance.review.*)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(audit.*)",
                "CanonicalEventContract(exception.replay_collision.*)",
                "CanonicalEventContract(support.restore.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(request.*)",
                "CanonicalEventContract(communication.*)",
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(hub.*)",
                "CanonicalEventContract(pharmacy.*)",
                "CanonicalEventContract(release.*)",
            ],
            "projection_contract_refs": [
                "ProjectionContractFamily(ops/governance/support replay)",
            ],
            "namespace_refs": ["audit", "exception", "support", "release"],
            "store_class": "worm_audit",
            "authoritative_truth_role": "Tamper-evident evidence and restore gate publisher; not a clinical write owner.",
            "tenant_scope_mode": [
                "support_investigation_scope",
                "multi_tenant_operational_watch",
                "platform_governance_scope",
            ],
            "data_classification_refs": [
                "audit_investigation_restricted",
                "retention_governance_restricted",
                "security_or_secret_sensitive",
            ],
            "idempotency_strategy_ref": "IDEMP_ASSURANCE_RESTORE_GATE",
            "replay_strategy_ref": "REPLAY_SUPPORT_RESTORE_SCOPE",
            "external_proof_class": "recovery_disposition",
            "timer_dependency_refs": ["TIM_HUB_PRACTICE_ACK_DUE", "TIM_PHARMACY_OUTCOME_RECONCILIATION_WINDOW"],
            "endpoint_refs": [
                "degraded_acceptance_fallback_review",
                "duplicate_review",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-9-the-assurance-ledger.md",
                "forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
            ],
            "notes": "Unknown or semantically divergent events are quarantined here before any downstream projection or alerting path can see them.",
        },
        {
            "runtime_component_id": "svc_timer_orchestrator",
            "runtime_component_name": "Timer and workflow orchestrator",
            "component_kind": "timer_engine",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_command",
            "governing_object_refs": [
                "MoreInfoReplyWindowCheckpoint",
                "CallbackExpectationEnvelope",
                "WaitlistDeadlineEvaluation",
                "PracticeAcknowledgementRecord",
                "PharmacyDispatchAttempt",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(timer.checkpoint.recompute)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(triage.more_info.timer.*)",
                "CanonicalEventContract(booking.waitlist.deadline.*)",
                "CanonicalEventContract(hub.offer.expiry.*)",
                "CanonicalEventContract(pharmacy.dispatch.proof_deadline.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(triage.*)",
                "CanonicalEventContract(callback.*)",
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(hub.*)",
                "CanonicalEventContract(pharmacy.*)",
                "CanonicalEventContract(access.*)",
            ],
            "projection_contract_refs": [],
            "namespace_refs": ["triage", "communication", "booking", "hub", "pharmacy", "access", "reachability"],
            "store_class": "timer_state",
            "authoritative_truth_role": "Owns deadline checkpoints and wakeups; timers may not hide inside request handlers, browsers, or ad hoc workers.",
            "tenant_scope_mode": [
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_org_scoped_staff",
                "cross_org_hub_scope",
                "servicing_site_scope",
            ],
            "data_classification_refs": [
                "operational_internal_non_phi",
                "patient_identifying",
                "clinical_sensitive",
            ],
            "idempotency_strategy_ref": "IDEMP_TIMER_WAKEUP_CURSOR",
            "replay_strategy_ref": "REPLAY_TIMER_CHECKPOINT_RECOMPUTE",
            "external_proof_class": "recovery_disposition",
            "timer_dependency_refs": [
                "TIM_MORE_INFO_REPLY_WINDOW",
                "TIM_MORE_INFO_REMINDERS",
                "TIM_CALLBACK_EXPECTATION_WINDOW",
                "TIM_CALLBACK_MISSED_WINDOW_REPAIR",
                "TIM_BOOKING_CONFIRMATION_GATE",
                "TIM_WAITLIST_DEADLINE",
                "TIM_WAITLIST_OFFER_EXPIRY",
                "TIM_HUB_CANDIDATE_REFRESH",
                "TIM_HUB_PATIENT_CHOICE_EXPIRY",
                "TIM_HUB_PRACTICE_ACK_DUE",
                "TIM_HUB_COORDINATION_SLA",
                "TIM_PHARMACY_DISPATCH_PROOF_DEADLINE",
                "TIM_PHARMACY_OUTCOME_RECONCILIATION_WINDOW",
                "TIM_PHARMACY_BOUNCE_BACK_REPAIR",
                "TIM_SESSION_EXPIRY",
                "TIM_ACCESS_GRANT_EXPIRY",
                "TIM_SECURE_LINK_RECOVERY_EXPIRY",
            ],
            "endpoint_refs": [
                "triage_more_info_cycle",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-3-the-human-checkpoint.md",
                "phase-4-the-booking-engine.md",
                "phase-5-the-network-horizon.md",
                "phase-6-the-pharmacy-loop.md",
            ],
            "notes": "Timer callbacks only trigger governed command and settlement chains; they never silently mutate user-visible truth on their own.",
        },
        {
            "runtime_component_id": "svc_adapter_simulators",
            "runtime_component_name": "Local simulator and adapter backplane",
            "component_kind": "worker",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["foundation_runtime_experience"],
            "runtime_workload_family_ref": "wf_integration",
            "governing_object_refs": [
                "AdapterContractProfile",
                "DependencyDegradationProfile",
            ],
            "accepted_command_contract_refs": [
                "MutationCommandContract(simulator.seed.*)",
            ],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(release.simulator.result.*)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(release.*)",
                "CanonicalEventContract(policy.*)",
            ],
            "projection_contract_refs": [],
            "namespace_refs": ["release", "policy", "analytics"],
            "store_class": "object_artifact",
            "authoritative_truth_role": "Non-authoritative local and CI simulation only.",
            "tenant_scope_mode": ["platform_governance_scope"],
            "data_classification_refs": ["operational_internal_non_phi"],
            "idempotency_strategy_ref": "IDEMP_SIMULATOR_FIXTURE_RUN",
            "replay_strategy_ref": "REPLAY_SIMULATOR_FIXTURE",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "triage_more_info_cycle",
                "clinician_messaging",
                "callback",
                "local_booking",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
            ],
            "external_dependency_refs": [
                "dep_pds_fhir_enrichment",
                "dep_assistive_model_vendor_family",
            ],
            "source_refs": [
                "08_simulator_and_local_stub_strategy.md",
                "12_developer_experience_and_local_bootstrap.md",
            ],
            "notes": "Provides deterministic fixtures and local stubs without becoming supplier truth or a second event namespace source.",
        },
        {
            "runtime_component_id": "queue_command_outbox",
            "runtime_component_name": "Durable command outbox",
            "component_kind": "queue",
            "flow_lane": "command",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_command",
            "governing_object_refs": ["CommandActionRecord", "AdapterDispatchAttempt"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(request.outbox.ready)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["request", "communication", "booking", "hub", "pharmacy"],
            "store_class": "event_log",
            "authoritative_truth_role": "Durable effect queue only; no business success without later proof upgrade.",
            "tenant_scope_mode": ["tenant_tuple_required_on_every_mutation"],
            "data_classification_refs": ["operational_internal_non_phi", "security_or_secret_sensitive"],
            "idempotency_strategy_ref": "IDEMP_ADAPTER_EFFECT",
            "replay_strategy_ref": "REPLAY_OUTBOX_RESUME",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "urgent_diversion",
                "triage_more_info_cycle",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
            "notes": "Every externally consequential mutation originates here or from an equivalent durable queue position tied back to the owning action record.",
        },
        {
            "runtime_component_id": "queue_adapter_receipt_inbox",
            "runtime_component_name": "Receipt and callback inbox",
            "component_kind": "queue",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_integration",
            "governing_object_refs": ["AdapterReceiptCheckpoint", "ReplayCollisionReview"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(confirmation.receipt.accepted)",
                "CanonicalEventContract(exception.replay_collision.detected)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["confirmation", "exception", "communication", "booking", "hub", "pharmacy"],
            "store_class": "event_log",
            "authoritative_truth_role": "Durable inbound evidence queue; stale or divergent receipts never mutate truth directly.",
            "tenant_scope_mode": ["tenant_tuple_plus_effect_scope_required"],
            "data_classification_refs": ["operational_internal_non_phi", "clinical_sensitive", "security_or_secret_sensitive"],
            "idempotency_strategy_ref": "IDEMP_ADAPTER_RECEIPT",
            "replay_strategy_ref": "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            "external_proof_class": "external_confirmation",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
            "notes": "Receipts and callbacks reconcile onto the same effect fence instead of spawning parallel success chains.",
        },
        {
            "runtime_component_id": "queue_event_normalization_quarantine",
            "runtime_component_name": "Canonical event normalization quarantine",
            "component_kind": "queue",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["assurance_and_governance"],
            "runtime_workload_family_ref": "wf_assurance_security",
            "governing_object_refs": ["CanonicalEventNormalizationRule", "ReplayCollisionReview"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(exception.namespace.quarantined)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["exception", "audit"],
            "store_class": "event_log",
            "authoritative_truth_role": "Holds bad producers, schema breaks, and unknown namespaces away from downstream consumers.",
            "tenant_scope_mode": ["platform_governance_scope"],
            "data_classification_refs": ["operational_internal_non_phi", "security_or_secret_sensitive"],
            "idempotency_strategy_ref": "IDEMP_EVENT_NORMALIZATION",
            "replay_strategy_ref": "REPLAY_EVENT_NORMALIZATION_REDRIVE",
            "external_proof_class": "recovery_disposition",
            "timer_dependency_refs": [],
            "endpoint_refs": [],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#CanonicalEventNormalizationRule",
            ],
            "notes": "Closes the unknown namespace and bad producer blind-spot by forcing quarantine rather than silent drop or silent pass-through.",
        },
        {
            "runtime_component_id": "stream_canonical_event_spine",
            "runtime_component_name": "Immutable canonical event spine",
            "component_kind": "stream",
            "flow_lane": "command",
            "owning_bounded_context_refs": ["foundation_control_plane", "assurance_and_governance"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "CanonicalEventNamespace",
                "CanonicalEventContract",
                "CanonicalEventEnvelope",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(* published namespaces *)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": CANONICAL_NAMESPACE_CODES,
            "store_class": "event_log",
            "authoritative_truth_role": "Immutable transition spine for replay, rebuild, analytics, and assurance.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["operational_internal_non_phi", "security_or_secret_sensitive", "audit_investigation_restricted"],
            "idempotency_strategy_ref": "IDEMP_EVENT_ENVELOPE",
            "replay_strategy_ref": "REPLAY_CANONICAL_EVENT_APPEND_ONLY",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
                "platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            ],
            "notes": "Every state transition, blocker mutation, degraded transition, and control-plane decision that matters downstream emits here.",
        },
        {
            "runtime_component_id": "store_domain_transaction",
            "runtime_component_name": "Transactional domain and settlement store",
            "component_kind": "store",
            "flow_lane": "command",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "Request",
                "RequestClosureRecord",
                "CommandSettlementRecord",
                "LifecycleCoordinator",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["request", "safety", "triage", "booking", "hub", "pharmacy", "reachability", "support"],
            "store_class": "transactional_domain",
            "authoritative_truth_role": "Canonical Vecells lifecycle and settlement truth.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["patient_identifying", "contact_sensitive", "clinical_sensitive", "identity_proof_sensitive"],
            "idempotency_strategy_ref": "IDEMP_MUTATION_COMMAND",
            "replay_strategy_ref": "REPLAY_COMMAND_SETTLEMENT_CHAIN",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
                "phase-0-the-foundation-protocol.md#1. Required platform objects",
            ],
            "notes": "The only durable home of canonical lifecycle state; FHIR rows and projections are downstream derivatives.",
        },
        {
            "runtime_component_id": "store_fhir_representation",
            "runtime_component_name": "FHIR representation store",
            "component_kind": "store",
            "flow_lane": "read",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": ["FhirRepresentationContract", "FhirProjectionSettlement"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(confirmation.fhir_projection.updated)",
            ],
            "consumed_event_contract_refs": [
                "CanonicalEventContract(request.*)",
                "CanonicalEventContract(booking.*)",
                "CanonicalEventContract(pharmacy.*)",
            ],
            "projection_contract_refs": [],
            "namespace_refs": ["confirmation", "booking", "pharmacy", "audit"],
            "store_class": "fhir_representation",
            "authoritative_truth_role": "Derived interoperability projection only; never the governing lifecycle source.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["patient_identifying", "clinical_sensitive", "identity_proof_sensitive"],
            "idempotency_strategy_ref": "IDEMP_FHIR_MAPPING_SETTLEMENT",
            "replay_strategy_ref": "REPLAY_FHIR_MAPPING_FROM_DOMAIN_EVENTS",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "local_booking",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_identity_hold_recovery",
            ],
            "external_dependency_refs": ["dep_pds_fhir_enrichment"],
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
                "platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
            ],
            "notes": "Writes are one-way from domain settlements and published FHIR mapping contracts; no browser path or downstream domain owns canonical truth here.",
        },
        {
            "runtime_component_id": "store_projection_read_models",
            "runtime_component_name": "Audience projection read store",
            "component_kind": "store",
            "flow_lane": "read",
            "owning_bounded_context_refs": ["foundation_runtime_experience"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "ProjectionContractFamily",
                "ProjectionQueryContract",
                "ReadPathCompatibilityWindow",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [
                "ProjectionContractVersionSet(active route tuples)",
            ],
            "namespace_refs": ["patient", "communication", "booking", "hub", "pharmacy", "support", "analytics"],
            "store_class": "projection_read",
            "authoritative_truth_role": "Derived route-safe query materialization only.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["public_safe", "patient_identifying", "clinical_sensitive", "audit_investigation_restricted"],
            "idempotency_strategy_ref": "IDEMP_PROJECTION_CURSOR",
            "replay_strategy_ref": "REPLAY_PROJECTION_FROM_EVENT_HISTORY",
            "external_proof_class": "projection_visible",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
                "platform-runtime-and-release-blueprint.md#ClientCachePolicy",
            ],
            "notes": "Every browser route reads from contract-versioned projections; rebuild or cutover may degrade routes to summary-only, recovery-only, or blocked, but never to raw-store joins.",
        },
        {
            "runtime_component_id": "store_artifact_objects",
            "runtime_component_name": "Artifact object store",
            "component_kind": "store",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "EvidenceSnapshot",
                "ArtifactManifest",
                "ObjectStoreReference",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(intake.artifact.ingested)",
                "CanonicalEventContract(communication.artifact.available)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["intake", "communication", "support", "audit"],
            "store_class": "object_artifact",
            "authoritative_truth_role": "Binary artifact storage only; lifecycle meaning still resolves through domain rows and parity contracts.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["clinical_sensitive", "identity_proof_sensitive", "audit_investigation_restricted"],
            "idempotency_strategy_ref": "IDEMP_ARTIFACT_MANIFEST",
            "replay_strategy_ref": "REPLAY_ARTIFACT_POINTER_ONLY",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "clinician_messaging",
                "callback",
                "local_booking",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [
                "dep_malware_scanning_provider",
                "dep_transcription_processing_provider",
            ],
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            ],
            "notes": "Events carry governed references or masked descriptors, never raw artifact contents.",
        },
        {
            "runtime_component_id": "prefix_artifact_quarantine",
            "runtime_component_name": "Artifact quarantine object prefix",
            "component_kind": "object_prefix",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["assurance_and_governance"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": ["ArtifactQuarantineRecord", "FallbackReviewCase"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [
                "CanonicalEventContract(exception.artifact.quarantined)",
            ],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["exception", "audit"],
            "store_class": "object_artifact",
            "authoritative_truth_role": "Holds unsafe or unreadable artifacts until governed review settles.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["clinical_sensitive", "audit_investigation_restricted"],
            "idempotency_strategy_ref": "IDEMP_ARTIFACT_QUARANTINE_DECISION",
            "replay_strategy_ref": "REPLAY_ARTIFACT_POINTER_ONLY",
            "external_proof_class": "recovery_disposition",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "degraded_acceptance_fallback_review",
                "pharmacy_first_referral_loop",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": ["dep_malware_scanning_provider"],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
                "forensic-audit-findings.md#Finding 61 - The event catalogue lacked attachment-quarantine events",
            ],
            "notes": "Unsafe artifact bytes never bypass the quarantine prefix into browser delivery or calm downstream truth.",
        },
        {
            "runtime_component_id": "sink_worm_audit_ledger",
            "runtime_component_name": "WORM audit and evidence ledger",
            "component_kind": "audit_sink",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["assurance_and_governance"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "AssuranceLedgerEntry",
                "BreakGlassReviewRecord",
                "RestoreDecisionRecord",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["audit", "analytics", "release", "support"],
            "store_class": "worm_audit",
            "authoritative_truth_role": "Tamper-evident audit witness only.",
            "tenant_scope_mode": ["platform_governance_scope", "support_investigation_scope"],
            "data_classification_refs": ["audit_investigation_restricted", "retention_governance_restricted"],
            "idempotency_strategy_ref": "IDEMP_AUDIT_ENTRY_HASH",
            "replay_strategy_ref": "REPLAY_AUDIT_EXPORT_WINDOW",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [
                "urgent_diversion",
                "degraded_acceptance_fallback_review",
                "triage_more_info_cycle",
                "duplicate_review",
                "self_care",
                "admin_resolution",
                "clinician_messaging",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
                "support_replay_resend_restore",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",
            ],
            "notes": "Append-only witness over the same causal chain, never a writable substitute for domain truth.",
        },
        {
            "runtime_component_id": "cache_route_contract_and_session",
            "runtime_component_name": "Route-manifest, session, and read-through cache",
            "component_kind": "cache",
            "flow_lane": "ingress",
            "owning_bounded_context_refs": ["foundation_runtime_experience", "foundation_identity_access"],
            "runtime_workload_family_ref": "wf_public_edge",
            "governing_object_refs": [
                "ClientCachePolicy",
                "Session",
                "CapabilityDecision",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": ["ClientCachePolicy(active route families)"],
            "namespace_refs": ["access", "patient", "release"],
            "store_class": "cache",
            "authoritative_truth_role": "Ephemeral accelerator only.",
            "tenant_scope_mode": [
                "public_pre_identity",
                "grant_scoped_subject",
                "tenant_subject_self_service",
                "tenant_org_scoped_staff",
            ],
            "data_classification_refs": ["public_safe", "security_or_secret_sensitive", "operational_internal_non_phi"],
            "idempotency_strategy_ref": "IDEMP_CACHE_KEY_BY_CONTRACT_DIGEST",
            "replay_strategy_ref": "REPLAY_CACHE_WARM_FROM_PUBLISHED_PROJECTIONS",
            "external_proof_class": "none",
            "timer_dependency_refs": ["TIM_SESSION_EXPIRY", "TIM_ACCESS_GRANT_EXPIRY"],
            "endpoint_refs": [
                "triage_more_info_cycle",
                "clinician_messaging",
                "callback",
                "local_booking",
                "patient_contact_route_repair",
                "patient_identity_hold_recovery",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ClientCachePolicy",
            ],
            "notes": "Caches may narrow or accelerate reads, but they never widen or mint authority.",
        },
        {
            "runtime_component_id": "store_timer_state",
            "runtime_component_name": "Timer and workflow state store",
            "component_kind": "store",
            "flow_lane": "effect",
            "owning_bounded_context_refs": ["foundation_control_plane"],
            "runtime_workload_family_ref": "wf_data",
            "governing_object_refs": [
                "MoreInfoReplyWindowCheckpoint",
                "WaitlistDeadlineEvaluation",
                "PracticeAcknowledgementRecord",
                "PharmacyDispatchAttempt",
            ],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["triage", "communication", "booking", "hub", "pharmacy", "access"],
            "store_class": "timer_state",
            "authoritative_truth_role": "Checkpoint and lease wakeup persistence only.",
            "tenant_scope_mode": ["tenant_partitioned_storage"],
            "data_classification_refs": ["operational_internal_non_phi", "patient_identifying", "clinical_sensitive"],
            "idempotency_strategy_ref": "IDEMP_TIMER_WAKEUP_CURSOR",
            "replay_strategy_ref": "REPLAY_TIMER_CHECKPOINT_RECOMPUTE",
            "external_proof_class": "none",
            "timer_dependency_refs": [
                "TIM_MORE_INFO_REPLY_WINDOW",
                "TIM_CALLBACK_EXPECTATION_WINDOW",
                "TIM_WAITLIST_DEADLINE",
                "TIM_HUB_PATIENT_CHOICE_EXPIRY",
                "TIM_PHARMACY_DISPATCH_PROOF_DEADLINE",
                "TIM_SESSION_EXPIRY",
                "TIM_ACCESS_GRANT_EXPIRY",
            ],
            "endpoint_refs": [
                "triage_more_info_cycle",
                "callback",
                "local_booking",
                "local_waitlist_continuation",
                "network_hub_coordination",
                "pharmacy_first_referral_loop",
                "patient_identity_hold_recovery",
            ],
            "external_dependency_refs": [],
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "phase-3-the-human-checkpoint.md#MoreInfoReplyWindowCheckpoint",
            ],
            "notes": "Timer rows are durable and replayable; no user-visible deadline may live only in memory, client time, or queue-local backoff.",
        },
        {
            "runtime_component_id": "store_feature_vectors_deferred",
            "runtime_component_name": "Feature store for assistive work",
            "component_kind": "store",
            "flow_lane": "assurance",
            "owning_bounded_context_refs": ["assistive"],
            "runtime_workload_family_ref": "wf_assurance_security",
            "governing_object_refs": ["AssistiveCapabilityTrustEnvelope"],
            "accepted_command_contract_refs": [],
            "emitted_event_contract_refs": [],
            "consumed_event_contract_refs": [],
            "projection_contract_refs": [],
            "namespace_refs": ["assistive", "analytics"],
            "store_class": "feature_store",
            "authoritative_truth_role": "Deferred and explicitly non-authoritative feature derivation only.",
            "tenant_scope_mode": ["inherited_from_owner_shell"],
            "data_classification_refs": ["audit_investigation_restricted", "operational_internal_non_phi"],
            "idempotency_strategy_ref": "IDEMP_FEATURE_VECTOR_BATCH",
            "replay_strategy_ref": "REPLAY_FEATURE_VECTOR_REBUILD",
            "external_proof_class": "none",
            "timer_dependency_refs": [],
            "endpoint_refs": [],
            "external_dependency_refs": ["dep_assistive_model_vendor_family"],
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "08_external_dependency_inventory.md",
                "03_deferred_and_conditional_scope.md",
            ],
            "notes": "Exists only as a deferred seam and may never become the live source of request, settlement, or projection truth.",
        },
    ]


def build_store_rows() -> list[dict[str, Any]]:
    return [
        {
            "store_id": "store_domain_transaction",
            "store_name": "Transactional domain and settlement store",
            "store_class": "transactional_domain",
            "runtime_component_ref": "store_domain_transaction",
            "authoritative_truth_role": "Vecells-first lifecycle, blocker, lease, and settlement truth",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "case_record_schedule_and_settlement_history",
            "data_classification_refs": ["patient_identifying", "clinical_sensitive", "identity_proof_sensitive"],
            "rebuild_source": "authoritative source",
            "baseline_scope": "baseline",
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
                "phase-0-the-foundation-protocol.md#1. Required platform objects",
            ],
            "notes": "Only this class owns canonical domain truth.",
        },
        {
            "store_id": "store_fhir_representation",
            "store_name": "FHIR representation store",
            "store_class": "fhir_representation",
            "runtime_component_ref": "store_fhir_representation",
            "authoritative_truth_role": "Derived interoperability representation only",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "representation_retained_under_domain_governed_schedule",
            "data_classification_refs": ["patient_identifying", "clinical_sensitive", "identity_proof_sensitive"],
            "rebuild_source": "published mapping contracts plus canonical events",
            "baseline_scope": "baseline",
            "source_refs": [
                "blueprint-init.md#7. Core system and data architecture",
            ],
            "notes": "No route or downstream domain may treat raw FHIR rows as canonical lifecycle truth.",
        },
        {
            "store_id": "store_event_spine",
            "store_name": "Immutable canonical event spine",
            "store_class": "event_log",
            "runtime_component_ref": "stream_canonical_event_spine",
            "authoritative_truth_role": "Replay and rebuild witness",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "append_only_event_retention_with_contract_version_windows",
            "data_classification_refs": ["operational_internal_non_phi", "audit_investigation_restricted"],
            "rebuild_source": "authoritative source",
            "baseline_scope": "baseline",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#CanonicalEventEnvelope",
            ],
            "notes": "Preserves event history for projections, analytics, assurance, and route-aware replay.",
        },
        {
            "store_id": "store_projection_read_models",
            "store_name": "Audience projection read store",
            "store_class": "projection_read",
            "runtime_component_ref": "store_projection_read_models",
            "authoritative_truth_role": "Derived audience-safe query materialization only",
            "backup_restore_scope_ref": "brs_projection_rebuild_and_readiness_restore",
            "retention_strategy": "rebuildable_projection_window_with_route_compatibility_digest",
            "data_classification_refs": ["public_safe", "patient_identifying", "clinical_sensitive"],
            "rebuild_source": "canonical event history plus projection contract versions",
            "baseline_scope": "baseline",
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
            ],
            "notes": "Routes may degrade during rebuild; they may not bypass to raw stores.",
        },
        {
            "store_id": "store_artifact_objects",
            "store_name": "Artifact object store",
            "store_class": "object_artifact",
            "runtime_component_ref": "store_artifact_objects",
            "authoritative_truth_role": "Binary artifact payload home only",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "artifact_family_specific_policy_and_manifest_control",
            "data_classification_refs": ["clinical_sensitive", "identity_proof_sensitive", "audit_investigation_restricted"],
            "rebuild_source": "authoritative source for bytes only",
            "baseline_scope": "baseline",
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "10_retention_and_artifact_sensitivity_matrix.md",
            ],
            "notes": "Byte payloads move by reference or governed handoff, never by casual event body.",
        },
        {
            "store_id": "prefix_artifact_quarantine",
            "store_name": "Artifact quarantine prefix",
            "store_class": "object_artifact",
            "runtime_component_ref": "prefix_artifact_quarantine",
            "authoritative_truth_role": "Unsafe artifact holding area pending governed review",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "transient_until_review_or_archive_witness",
            "data_classification_refs": ["clinical_sensitive", "audit_investigation_restricted"],
            "rebuild_source": "authoritative source for quarantined bytes only",
            "baseline_scope": "baseline",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#Artifact quarantine and fallback review",
            ],
            "notes": "Unsafe content cannot surface through ordinary routes while here.",
        },
        {
            "store_id": "sink_worm_audit_ledger",
            "store_name": "WORM audit ledger",
            "store_class": "worm_audit",
            "runtime_component_ref": "sink_worm_audit_ledger",
            "authoritative_truth_role": "Tamper-evident evidence witness",
            "backup_restore_scope_ref": "brs_assurance_and_resilience_restore",
            "retention_strategy": "retention_governance_restricted_and_append_only",
            "data_classification_refs": ["audit_investigation_restricted", "retention_governance_restricted"],
            "rebuild_source": "authoritative source",
            "baseline_scope": "baseline",
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "phase-9-the-assurance-ledger.md",
            ],
            "notes": "Restores and exports must stay scope-envelope-governed.",
        },
        {
            "store_id": "cache_route_contract_and_session",
            "store_name": "Route/session/cache plane",
            "store_class": "cache",
            "runtime_component_ref": "cache_route_contract_and_session",
            "authoritative_truth_role": "Ephemeral acceleration only",
            "backup_restore_scope_ref": "brs_stateless_redeploy",
            "retention_strategy": "short_ttl_and_full_rebuildable",
            "data_classification_refs": ["public_safe", "security_or_secret_sensitive"],
            "rebuild_source": "published contracts and current sessions",
            "baseline_scope": "baseline",
            "source_refs": [
                "platform-runtime-and-release-blueprint.md#ClientCachePolicy",
            ],
            "notes": "Cache loss must degrade performance, never mutate truth.",
        },
        {
            "store_id": "store_timer_state",
            "store_name": "Timer checkpoint store",
            "store_class": "timer_state",
            "runtime_component_ref": "store_timer_state",
            "authoritative_truth_role": "Deadline and wakeup checkpoint persistence",
            "backup_restore_scope_ref": "brs_stateful_restore",
            "retention_strategy": "checkpoint_history_plus_current_deadline_index",
            "data_classification_refs": ["operational_internal_non_phi", "patient_identifying", "clinical_sensitive"],
            "rebuild_source": "recompute from canonical settlements where feasible",
            "baseline_scope": "baseline",
            "source_refs": [
                "phase-3-the-human-checkpoint.md#MoreInfoReplyWindowCheckpoint",
                "phase-4-the-booking-engine.md#WaitlistDeadlineEvaluation",
            ],
            "notes": "Keeps long-running waits out of transient workers.",
        },
        {
            "store_id": "store_feature_vectors_deferred",
            "store_name": "Feature store for assistive work",
            "store_class": "feature_store",
            "runtime_component_ref": "store_feature_vectors_deferred",
            "authoritative_truth_role": "Deferred assistive derivation only",
            "backup_restore_scope_ref": "brs_assurance_and_resilience_restore",
            "retention_strategy": "bounded_cohort_and_rollout_specific",
            "data_classification_refs": ["audit_investigation_restricted", "operational_internal_non_phi"],
            "rebuild_source": "derived from non-authoritative feature pipelines",
            "baseline_scope": "deferred",
            "source_refs": [
                "blueprint-init.md#12. Practical engineering shape",
                "03_deferred_and_conditional_scope.md",
            ],
            "notes": "Explicitly bounded away from current runtime truth.",
        },
    ]


def build_async_effect_rows(dependencies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {row["dependency_id"]: row for row in dependencies}

    def row(
        dependency_id: str,
        applicability: str,
        runtime_component_id: str,
        command_contract_ref: str,
        outbox_component_ref: str,
        inbox_component_ref: str,
        receipt_checkpoint_object_ref: str,
        authoritative_proof_upgrade: str,
        final_settlement_classes: list[str],
        proof_class: str,
        idempotency_strategy_ref: str,
        replay_strategy_ref: str,
        endpoint_refs: list[str],
        non_applicable_reason: str = "",
    ) -> dict[str, Any]:
        dep = by_id[dependency_id]
        return {
            "effect_row_id": f"EFFECT_{dependency_id.upper()}",
            "dependency_id": dependency_id,
            "dependency_name": dep["dependency_name"],
            "effect_applicability": applicability,
            "runtime_component_id": runtime_component_id,
            "command_contract_ref": command_contract_ref,
            "outbox_component_ref": outbox_component_ref,
            "inbox_component_ref": inbox_component_ref,
            "receipt_checkpoint_object_ref": receipt_checkpoint_object_ref,
            "authoritative_proof_upgrade": authoritative_proof_upgrade,
            "final_settlement_classes": final_settlement_classes,
            "external_proof_class": proof_class,
            "idempotency_strategy_ref": idempotency_strategy_ref,
            "replay_strategy_ref": replay_strategy_ref,
            "endpoint_refs": endpoint_refs,
            "non_applicable_reason": non_applicable_reason,
            "source_refs": dep["source_file_refs"],
            "notes": dep["integration_mode"],
        }

    return [
        row(
            "dep_nhs_login_rail",
            "callback_only_non_outbox",
            "svc_integration_worker",
            "MutationCommandContract(identity.session.establish)",
            "",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(nhs_login_callback)",
            "OIDC callback correlation -> SessionEstablishmentDecision -> CapabilityDecision -> RouteIntentBinding",
            ["SessionEstablishmentDecision.allow", "CapabilityDecision.allow"],
            "recovery_disposition",
            "IDEMP_OIDC_CALLBACK",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["patient_identity_hold_recovery"],
            "Interactive redirect starts in browser, so the durable boundary is the callback correlation and settlement chain rather than an adapter outbox send.",
        ),
        row(
            "dep_pds_fhir_enrichment",
            "non_applicable_deferred",
            "svc_adapter_simulators",
            "",
            "",
            "",
            "",
            "Deferred optional enrichment only; current baseline keeps PDS outside required truth paths.",
            [],
            "none",
            "IDEMP_SIMULATOR_FIXTURE_RUN",
            "REPLAY_SIMULATOR_FIXTURE",
            [],
            "PDS enrichment is feature-flagged and legally gated, so no live baseline outbox/inbox lane is required yet.",
        ),
        row(
            "dep_telephony_ivr_recording_provider",
            "full_duplex",
            "svc_notification_worker",
            "MutationCommandContract(callback.attempt.dispatch)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(telephony)",
            "transport accepted -> provider callback -> CallbackOutcomeEvidenceBundle -> CallbackResolutionGate",
            ["CallbackResolutionGate.complete", "CallbackResolutionGate.retry", "CallbackResolutionGate.expire"],
            "external_confirmation",
            "IDEMP_ADAPTER_EFFECT",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["urgent_diversion", "callback", "patient_contact_route_repair", "support_replay_resend_restore"],
        ),
        row(
            "dep_transcription_processing_provider",
            "outbound_then_inbound_derivation",
            "svc_integration_worker",
            "MutationCommandContract(evidence.transcription.request)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(transcription)",
            "job accepted -> transcript artifact stored -> EvidenceAssimilationRecord or quarantine review",
            ["EvidenceAssimilationRecord.settled", "FallbackReviewCase.open"],
            "review_disposition",
            "IDEMP_ARTIFACT_MANIFEST",
            "REPLAY_ARTIFACT_POINTER_ONLY",
            ["degraded_acceptance_fallback_review", "support_replay_resend_restore"],
        ),
        row(
            "dep_sms_notification_provider",
            "full_duplex",
            "svc_notification_worker",
            "MutationCommandContract(communication.dispatch.sms)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(notification_sms)",
            "provider accept -> MessageDeliveryEvidenceBundle -> ThreadResolutionGate or delivery repair",
            ["ThreadResolutionGate.close", "ThreadResolutionGate.repair_route", "ThreadResolutionGate.reopen"],
            "external_confirmation",
            "IDEMP_ADAPTER_EFFECT",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["triage_more_info_cycle", "clinician_messaging", "patient_contact_route_repair", "support_replay_resend_restore"],
        ),
        row(
            "dep_email_notification_provider",
            "full_duplex",
            "svc_notification_worker",
            "MutationCommandContract(communication.dispatch.email)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(notification_email)",
            "provider accept -> MessageDeliveryEvidenceBundle -> ThreadResolutionGate or delivery repair",
            ["ThreadResolutionGate.close", "ThreadResolutionGate.repair_route", "ThreadResolutionGate.reopen"],
            "external_confirmation",
            "IDEMP_ADAPTER_EFFECT",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["triage_more_info_cycle", "self_care", "admin_resolution", "clinician_messaging", "network_hub_coordination", "support_replay_resend_restore"],
        ),
        row(
            "dep_malware_scanning_provider",
            "outbound_then_inbound_derivation",
            "svc_integration_worker",
            "MutationCommandContract(artifact.scan.request)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(malware_scan)",
            "scan accepted -> quarantine verdict or clean artifact settlement -> fallback review if unsafe",
            ["ArtifactQuarantineRecord.created", "ArtifactScanSettlement.clean"],
            "recovery_disposition",
            "IDEMP_ARTIFACT_QUARANTINE_DECISION",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["degraded_acceptance_fallback_review", "support_replay_resend_restore"],
        ),
        row(
            "dep_im1_pairing_programme",
            "non_applicable_onboarding",
            "svc_assurance_worker",
            "",
            "",
            "",
            "",
            "Human-governed programme output gates adapter publication rather than acting as a runtime effect lane.",
            [],
            "none",
            "IDEMP_ASSURANCE_RESTORE_GATE",
            "REPLAY_SUPPORT_RESTORE_SCOPE",
            [],
            "This dependency is an onboarding programme, not a live transaction rail.",
        ),
        row(
            "dep_gp_system_supplier_paths",
            "non_applicable_programme_binding",
            "svc_assurance_worker",
            "",
            "",
            "",
            "",
            "Supplier path approval is encoded in AdapterContractProfile publication, not a separate live queue lane.",
            [],
            "none",
            "IDEMP_ASSURANCE_RESTORE_GATE",
            "REPLAY_SUPPORT_RESTORE_SCOPE",
            [],
            "Live booking and hub effects go through the concrete booking supplier adapter rows.",
        ),
        row(
            "dep_local_booking_supplier_adapters",
            "full_duplex",
            "svc_integration_worker",
            "MutationCommandContract(booking.commit.confirm)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(booking_supplier)",
            "dispatch accepted -> durable provider reference or read-after-write -> BookingConfirmationTruthProjection",
            ["ExternalConfirmationGate.confirmed", "BookingConfirmationTruthProjection.confirmed", "BookingConfirmationTruthProjection.reconciliation_required"],
            "external_confirmation",
            "IDEMP_BOOKING_COMMIT",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["local_booking", "local_waitlist_continuation"],
        ),
        row(
            "dep_network_capacity_partner_feeds",
            "inbound_only",
            "svc_integration_worker",
            "MutationCommandContract(hub.capacity.snapshot.ingest)",
            "",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(capacity_feed)",
            "snapshot accepted -> NetworkCoordinationPolicyEvaluation -> candidate refresh or quarantine",
            ["CandidateSnapshot.accepted", "CandidateSnapshot.quarantined"],
            "review_disposition",
            "IDEMP_CAPACITY_SNAPSHOT",
            "REPLAY_CAPACITY_SNAPSHOT",
            ["network_hub_coordination"],
        ),
        row(
            "dep_cross_org_secure_messaging_mesh",
            "full_duplex",
            "svc_integration_worker",
            "MutationCommandContract(mesh.dispatch)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(mesh)",
            "transport accepted -> delivery evidence or dispute -> current confirmation or visibility settlement",
            ["PracticeAcknowledgementRecord.acknowledged", "PharmacyDispatchAttempt.proof_satisfied", "MessageDeliveryEvidenceBundle.delivered"],
            "external_confirmation",
            "IDEMP_ADAPTER_EFFECT",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["network_hub_coordination", "pharmacy_first_referral_loop"],
        ),
        row(
            "dep_origin_practice_ack_rail",
            "full_duplex",
            "svc_notification_worker",
            "MutationCommandContract(hub.practice_visibility.dispatch)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(practice_ack)",
            "message accept -> PracticeAcknowledgementRecord generation -> ack evidence -> HubOfferToConfirmationTruthProjection closureState update",
            ["PracticeAcknowledgementRecord.acknowledged", "PracticeAcknowledgementRecord.overdue", "PracticeAcknowledgementRecord.recovery_required"],
            "external_confirmation",
            "IDEMP_PRACTICE_ACK_GENERATION",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["network_hub_coordination"],
        ),
        row(
            "dep_pharmacy_directory_dohs",
            "inbound_only",
            "svc_integration_worker",
            "MutationCommandContract(pharmacy.directory.snapshot.ingest)",
            "",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(pharmacy_directory)",
            "snapshot accepted -> PharmacyChoiceProof refresh or quarantine",
            ["PharmacyProviderSnapshot.accepted", "PharmacyProviderSnapshot.quarantined"],
            "review_disposition",
            "IDEMP_PROVIDER_DIRECTORY_SNAPSHOT",
            "REPLAY_PROVIDER_DIRECTORY_SNAPSHOT",
            ["pharmacy_first_referral_loop"],
        ),
        row(
            "dep_pharmacy_referral_transport",
            "full_duplex",
            "svc_integration_worker",
            "MutationCommandContract(pharmacy.dispatch.referral)",
            "queue_command_outbox",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(pharmacy_dispatch)",
            "dispatch accepted -> provider ack or proof deadline -> PharmacyDispatchAttempt proof state -> ExternalConfirmationGate",
            ["PharmacyDispatchAttempt.proof_satisfied", "PharmacyDispatchAttempt.reconciliation_required", "PharmacyDispatchAttempt.failed"],
            "external_confirmation",
            "IDEMP_PHARMACY_DISPATCH",
            "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            ["pharmacy_first_referral_loop"],
        ),
        row(
            "dep_pharmacy_outcome_observation",
            "inbound_only",
            "svc_integration_worker",
            "MutationCommandContract(pharmacy.outcome.ingest)",
            "",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(pharmacy_outcome)",
            "inbound evidence -> replay classification -> PharmacyOutcomeReconciliationGate or accepted outcome settlement",
            ["PharmacyOutcomeSettlement.duplicate_ignored", "PharmacyOutcomeSettlement.review_required", "PharmacyOutcomeSettlement.resolved_pending_projection", "PharmacyOutcomeSettlement.reopened_for_safety"],
            "review_disposition",
            "IDEMP_PHARMACY_OUTCOME_ENVELOPE",
            "REPLAY_PHARMACY_OUTCOME_RECONCILIATION",
            ["pharmacy_first_referral_loop"],
        ),
        row(
            "dep_pharmacy_urgent_return_professional_routes",
            "inbound_only",
            "svc_integration_worker",
            "MutationCommandContract(pharmacy.urgent_return.ingest)",
            "",
            "queue_adapter_receipt_inbox",
            "AdapterReceiptCheckpoint(pharmacy_urgent_return)",
            "urgent return evidence -> BounceBackRecord -> safety preemption and reopened triage settlement",
            ["PharmacyBounceBackSettlement.reopened_for_safety", "PharmacyBounceBackSettlement.supervisor_review"],
            "recovery_disposition",
            "IDEMP_PHARMACY_OUTCOME_ENVELOPE",
            "REPLAY_PHARMACY_OUTCOME_RECONCILIATION",
            ["pharmacy_first_referral_loop"],
        ),
        row(
            "dep_nhs_app_embedded_channel_ecosystem",
            "non_applicable_deferred",
            "svc_api_gateway",
            "",
            "",
            "",
            "",
            "Deferred embedded channel posture binds to runtime publication and scope tuples, not a separate adapter effect lane in the current baseline.",
            [],
            "none",
            "IDEMP_BROWSER_COMMAND_PASSTHROUGH",
            "REPLAY_ROUTE_INTENT_REBIND",
            [],
            "Phase 7 is deferred out of the current baseline.",
        ),
        row(
            "dep_assistive_model_vendor_family",
            "non_applicable_deferred",
            "svc_adapter_simulators",
            "",
            "",
            "",
            "",
            "Assistive vendors remain conditional and non-authoritative; no baseline proof chain depends on them.",
            [],
            "none",
            "IDEMP_SIMULATOR_FIXTURE_RUN",
            "REPLAY_SIMULATOR_FIXTURE",
            [],
            "Assistive rollout is explicitly deferred and bounded.",
        ),
        row(
            "dep_nhs_assurance_and_standards_sources",
            "non_applicable_human_governed",
            "svc_assurance_worker",
            "",
            "",
            "",
            "",
            "Evidence watchlist and standards monitoring are human-governed assurance inputs, not runtime adapter effects.",
            [],
            "none",
            "IDEMP_ASSURANCE_RESTORE_GATE",
            "REPLAY_SUPPORT_RESTORE_SCOPE",
            [],
            "This dependency informs governance and evidence schedules, not live transaction settlement.",
        ),
    ]


def build_timer_rows() -> list[dict[str, Any]]:
    return [
        {
            "timer_family_id": "TIM_MORE_INFO_REPLY_WINDOW",
            "timer_name": "More-info reply window",
            "governing_object_ref": "MoreInfoCycle",
            "checkpoint_object_ref": "MoreInfoReplyWindowCheckpoint",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(triage.more_info.sent)", "CanonicalEventContract(triage.more_info.superseded)"],
            "mutation_contract_ref": "MutationCommandContract(triage.more_info.checkpoint.recompute)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "MoreInfoResponseDisposition",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "same-shell expiry or late-review posture; no client clock truth",
            "endpoint_refs": ["triage_more_info_cycle"],
            "source_refs": [
                "phase-3-the-human-checkpoint.md#MoreInfoReplyWindowCheckpoint",
                "forensic-audit-findings.md#Finding 18 - More-info loop had no TTL, expiry, or escalation rule",
            ],
            "notes": "Single authority for due-state wording, reminder eligibility, late review, and expiry copy.",
        },
        {
            "timer_family_id": "TIM_MORE_INFO_REMINDERS",
            "timer_name": "More-info reminder schedule",
            "governing_object_ref": "MoreInfoReminderSchedule",
            "checkpoint_object_ref": "MoreInfoReminderSchedule",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(triage.more_info.reminder.due)"],
            "mutation_contract_ref": "MutationCommandContract(communication.more_info.reminder.dispatch)",
            "proof_class": "external_confirmation",
            "settlement_ref": "MessageDeliveryEvidenceBundle",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "suppression or callback fallback when contact repair is active",
            "endpoint_refs": ["triage_more_info_cycle", "patient_contact_route_repair"],
            "source_refs": [
                "phase-3-the-human-checkpoint.md#MoreInfoReminderSchedule",
            ],
            "notes": "Reminder orchestration derives only from current checkpoint and reachability posture.",
        },
        {
            "timer_family_id": "TIM_CALLBACK_EXPECTATION_WINDOW",
            "timer_name": "Callback expectation window",
            "governing_object_ref": "CallbackExpectationEnvelope",
            "checkpoint_object_ref": "CallbackExpectationEnvelope",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(telephony.callback.promise.updated)"],
            "mutation_contract_ref": "MutationCommandContract(callback.expectation.recompute)",
            "proof_class": "external_confirmation",
            "settlement_ref": "CallbackResolutionGate",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "same-shell promise repair, never silent widening",
            "endpoint_refs": ["callback"],
            "source_refs": [
                "callback-and-clinician-messaging-loop.md#CallbackExpectationEnvelope",
            ],
            "notes": "Visible callback windows may narrow quietly but may never widen without a new envelope revision.",
        },
        {
            "timer_family_id": "TIM_CALLBACK_MISSED_WINDOW_REPAIR",
            "timer_name": "Callback missed-window repair",
            "governing_object_ref": "CallbackResolutionGate",
            "checkpoint_object_ref": "CallbackResolutionGate",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(telephony.callback.window.missed)"],
            "mutation_contract_ref": "MutationCommandContract(callback.repair.route)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "CallbackResolutionGate",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "route to retry, escalation, or repair guidance in the same shell",
            "endpoint_refs": ["callback", "patient_contact_route_repair"],
            "source_refs": [
                "callback-and-clinician-messaging-loop.md#CallbackResolutionGate",
                "forensic-audit-findings.md#Finding 24 - Callback handling had contradictory loop-and-close semantics",
            ],
            "notes": "Missed windows create governed repair, not silent expiry.",
        },
        {
            "timer_family_id": "TIM_BOOKING_CONFIRMATION_GATE",
            "timer_name": "Booking confirmation and reconciliation gate",
            "governing_object_ref": "BookingTransaction",
            "checkpoint_object_ref": "ExternalConfirmationGate",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(booking.commit.confirmation_pending)", "CanonicalEventContract(confirmation.gate.updated)"],
            "mutation_contract_ref": "MutationCommandContract(booking.confirmation.reconcile)",
            "proof_class": "external_confirmation",
            "settlement_ref": "BookingConfirmationTruthProjection",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "hold in confirmation_pending or reconciliation_required; never booked optimism",
            "endpoint_refs": ["local_booking"],
            "source_refs": [
                "phase-4-the-booking-engine.md#BookingConfirmationTruthProjection",
                "forensic-audit-findings.md#Finding 31 - No ambiguous confirmation or reconciliation state for bookings",
            ],
            "notes": "Appointment creation alone does not close ambiguity.",
        },
        {
            "timer_family_id": "TIM_WAITLIST_DEADLINE",
            "timer_name": "Local waitlist deadline evaluation",
            "governing_object_ref": "WaitlistEntry",
            "checkpoint_object_ref": "WaitlistDeadlineEvaluation",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(booking.waitlist.deadline_evaluated)", "CanonicalEventContract(booking.waitlist.offer.expired)"],
            "mutation_contract_ref": "MutationCommandContract(booking.waitlist.deadline.recompute)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "WaitlistContinuationTruthProjection",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "route through current WaitlistFallbackObligation rather than indefinite waiting",
            "endpoint_refs": ["local_waitlist_continuation"],
            "source_refs": [
                "phase-4-the-booking-engine.md#WaitlistDeadlineEvaluation",
                "forensic-audit-findings.md#Finding 33 - Waitlist logic lacked per-capacity exclusivity and deadline fallback",
            ],
            "notes": "Safe local continuation must be recomputed from policy-governed deadline truth.",
        },
        {
            "timer_family_id": "TIM_WAITLIST_OFFER_EXPIRY",
            "timer_name": "Waitlist offer expiry",
            "governing_object_ref": "WaitlistOffer",
            "checkpoint_object_ref": "WaitlistOffer",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(booking.waitlist.offer.sent)", "CanonicalEventContract(booking.waitlist.offer.expired)"],
            "mutation_contract_ref": "MutationCommandContract(booking.waitlist.offer.expire)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "WaitlistContinuationTruthProjection",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "preserve offer provenance and continue or fallback through the same case",
            "endpoint_refs": ["local_waitlist_continuation"],
            "source_refs": [
                "phase-4-the-booking-engine.md#WaitlistContinuationTruthProjection",
            ],
            "notes": "Offer expiry never clears fallback debt or rewrites current continuation truth silently.",
        },
        {
            "timer_family_id": "TIM_HUB_CANDIDATE_REFRESH",
            "timer_name": "Hub candidate refresh",
            "governing_object_ref": "HubCoordinationCase",
            "checkpoint_object_ref": "AlternativeOfferRegenerationSettlement",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(capacity.snapshot.updated)", "CanonicalEventContract(hub.offer.regeneration.required)"],
            "mutation_contract_ref": "MutationCommandContract(hub.offer.regenerate)",
            "proof_class": "review_disposition",
            "settlement_ref": "AlternativeOfferRegenerationSettlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "regenerate in-shell, preserve provenance, or shift to callback-only recovery",
            "endpoint_refs": ["network_hub_coordination"],
            "source_refs": [
                "phase-5-the-network-horizon.md#AlternativeOfferRegenerationSettlement",
            ],
            "notes": "Supply refresh may not silently mutate a live choice surface.",
        },
        {
            "timer_family_id": "TIM_HUB_PATIENT_CHOICE_EXPIRY",
            "timer_name": "Hub patient-choice expiry",
            "governing_object_ref": "AlternativeOfferSession",
            "checkpoint_object_ref": "AlternativeOfferSession",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(hub.offer.delivered)", "CanonicalEventContract(hub.offer.expired)"],
            "mutation_contract_ref": "MutationCommandContract(hub.offer.expire)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "HubOfferToConfirmationTruthProjection",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "fallback card or read-only provenance; no silent stale choice",
            "endpoint_refs": ["network_hub_coordination"],
            "source_refs": [
                "phase-5-the-network-horizon.md#AlternativeOfferSession",
            ],
            "notes": "Expiry creates a new regeneration or fallback receipt rather than a mutated live offer.",
        },
        {
            "timer_family_id": "TIM_HUB_PRACTICE_ACK_DUE",
            "timer_name": "Practice acknowledgement due timer",
            "governing_object_ref": "PracticeAcknowledgementRecord",
            "checkpoint_object_ref": "PracticeAcknowledgementRecord",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(hub.practice_visibility.generated)", "CanonicalEventContract(hub.practice_ack.overdue)"],
            "mutation_contract_ref": "MutationCommandContract(hub.practice_ack.escalate)",
            "proof_class": "external_confirmation",
            "settlement_ref": "HubOfferToConfirmationTruthProjection",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "remain booked_pending_practice_ack or recovery_required until current generation settles",
            "endpoint_refs": ["network_hub_coordination"],
            "source_refs": [
                "phase-5-the-network-horizon.md#PracticeAcknowledgementRecord",
            ],
            "notes": "Current-generation acknowledgement debt is closure-blocking when policy requires it.",
        },
        {
            "timer_family_id": "TIM_HUB_COORDINATION_SLA",
            "timer_name": "Hub coordination SLA target",
            "governing_object_ref": "HubCoordinationCase",
            "checkpoint_object_ref": "HubCoordinationCase",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(hub.case.entered)", "CanonicalEventContract(hub.sla.at_risk)"],
            "mutation_contract_ref": "MutationCommandContract(hub.case.escalate)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "HubCoordinationCase escalation settlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "elevate queue posture and callback fallback; never silent stale wait",
            "endpoint_refs": ["network_hub_coordination"],
            "source_refs": [
                "phase-5-the-network-horizon.md#HubCoordinationCase",
            ],
            "notes": "Keeps urgent or at-risk network work from vanishing in hub ownership.",
        },
        {
            "timer_family_id": "TIM_PHARMACY_DISPATCH_PROOF_DEADLINE",
            "timer_name": "Pharmacy dispatch proof deadline",
            "governing_object_ref": "PharmacyDispatchAttempt",
            "checkpoint_object_ref": "PharmacyDispatchAttempt",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(pharmacy.dispatch.sent)", "CanonicalEventContract(pharmacy.dispatch.proof_deadline.reached)"],
            "mutation_contract_ref": "MutationCommandContract(pharmacy.dispatch.reconcile)",
            "proof_class": "external_confirmation",
            "settlement_ref": "PharmacyDispatchAttempt authoritative proof state",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "hold in proof_pending or reconciliation_required, never optimistic referred calmness",
            "endpoint_refs": ["pharmacy_first_referral_loop"],
            "source_refs": [
                "phase-6-the-pharmacy-loop.md#PharmacyDispatchAttempt",
                "forensic-audit-findings.md#Finding 37 - Pharmacy dispatch lacked ack, retry, and expiry behavior",
            ],
            "notes": "Transport acceptance alone never settles referral truth.",
        },
        {
            "timer_family_id": "TIM_PHARMACY_OUTCOME_RECONCILIATION_WINDOW",
            "timer_name": "Pharmacy outcome reconciliation window",
            "governing_object_ref": "PharmacyOutcomeIngestAttempt",
            "checkpoint_object_ref": "PharmacyOutcomeReconciliationGate",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(pharmacy.outcome.received)", "CanonicalEventContract(pharmacy.outcome.review_required)"],
            "mutation_contract_ref": "MutationCommandContract(pharmacy.outcome.review.route)",
            "proof_class": "review_disposition",
            "settlement_ref": "PharmacyOutcomeSettlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "bounded review placeholder; no calm resolution while gate is open",
            "endpoint_refs": ["pharmacy_first_referral_loop"],
            "source_refs": [
                "phase-6-the-pharmacy-loop.md#PharmacyOutcomeReconciliationGate",
                "forensic-audit-findings.md#Finding 79 - Phase 6 weak-source matching did not clearly stop at a case-local review state",
            ],
            "notes": "Weak or conflicting evidence stays case-local and closure-blocking until resolved.",
        },
        {
            "timer_family_id": "TIM_PHARMACY_BOUNCE_BACK_REPAIR",
            "timer_name": "Pharmacy bounce-back and urgent return repair",
            "governing_object_ref": "PharmacyBounceBackRecord",
            "checkpoint_object_ref": "PharmacyBounceBackRecord",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(pharmacy.bounce_back.received)", "CanonicalEventContract(pharmacy.bounce_back.loop_risk)"],
            "mutation_contract_ref": "MutationCommandContract(pharmacy.bounce_back.route)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "PharmacyBounceBackSettlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "reopen for safety or supervisor review; never generic silent bounce handling",
            "endpoint_refs": ["pharmacy_first_referral_loop"],
            "source_refs": [
                "phase-6-the-pharmacy-loop.md#PharmacyBounceBackRecord",
                "forensic-audit-findings.md#Finding 39 - Urgent pharmacy returns were lumped into generic bounce-back",
            ],
            "notes": "Urgent return latency stays explicit and repair-bound.",
        },
        {
            "timer_family_id": "TIM_SESSION_EXPIRY",
            "timer_name": "Session expiry",
            "governing_object_ref": "Session",
            "checkpoint_object_ref": "Session",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(access.session.expiring)", "CanonicalEventContract(access.session.expired)"],
            "mutation_contract_ref": "MutationCommandContract(access.session.expire)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "Session expiry settlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "same-shell rebind, rotate, or deny; no stale writable carry-over",
            "endpoint_refs": ["patient_identity_hold_recovery", "triage_more_info_cycle", "callback"],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#SessionEstablishmentDecision",
            ],
            "notes": "Backend-owned expiry narrows capability; it never extends authority beyond the current tuple.",
        },
        {
            "timer_family_id": "TIM_ACCESS_GRANT_EXPIRY",
            "timer_name": "Access grant expiry",
            "governing_object_ref": "AccessGrant",
            "checkpoint_object_ref": "AccessGrant",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(access.grant.expiring)", "CanonicalEventContract(access.grant.expired)"],
            "mutation_contract_ref": "MutationCommandContract(access.grant.expire)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "AccessGrant expiry settlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "rotate to recovery-only or claim-step-up, never stale grant reuse",
            "endpoint_refs": ["triage_more_info_cycle", "clinician_messaging", "callback", "patient_identity_hold_recovery"],
            "source_refs": [
                "phase-0-the-foundation-protocol.md#AccessGrant",
            ],
            "notes": "Grant expiry can narrow entry but never extend the active governed workflow window.",
        },
        {
            "timer_family_id": "TIM_SECURE_LINK_RECOVERY_EXPIRY",
            "timer_name": "Secure-link and recovery entry expiry",
            "governing_object_ref": "PostAuthReturnIntent",
            "checkpoint_object_ref": "RouteIntentBinding",
            "owning_runtime_component_id": "svc_timer_orchestrator",
            "timer_state_component_ref": "store_timer_state",
            "trigger_event_refs": ["CanonicalEventContract(access.recovery_link.expiring)", "CanonicalEventContract(access.recovery_link.expired)"],
            "mutation_contract_ref": "MutationCommandContract(access.recovery.expire)",
            "proof_class": "recovery_disposition",
            "settlement_ref": "RouteIntentBinding recovery settlement",
            "user_visible_posture_change": "yes",
            "degraded_fallback_behavior": "same-shell recover_only posture; link expiry may not define workflow truth",
            "endpoint_refs": ["triage_more_info_cycle", "patient_identity_hold_recovery"],
            "source_refs": [
                "phase-3-the-human-checkpoint.md#grant-expiry-versus-cycle-expiry tests",
                "phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
            ],
            "notes": "Secure-link expiry is an access boundary, not the business deadline owner.",
        },
    ]


def build_idempotency_rules(async_rows: list[dict[str, Any]], timer_rows: list[dict[str, Any]]) -> dict[str, Any]:
    strategies = [
        {
            "strategy_id": "IDEMP_MUTATION_COMMAND",
            "label": "Command action dedupe",
            "dedupe_key_formula": "commandActionId or canonical mutation tuple hash",
            "applies_to": ["svc_command_api", "store_domain_transaction"],
            "result_if_duplicate": "return existing CommandSettlementRecord",
            "source_refs": [
                "forensic-audit-findings.md#Finding 04 - No idempotency envelope on submit or replayed commands",
            ],
        },
        {
            "strategy_id": "IDEMP_ADAPTER_EFFECT",
            "label": "Canonical adapter effect key",
            "dedupe_key_formula": "H(actionRecordId || actionScope || governingObjectRef || expectedEffectSetHash || intentGeneration)",
            "applies_to": ["queue_command_outbox", "svc_notification_worker", "svc_integration_worker"],
            "result_if_duplicate": "reuse the live AdapterDispatchAttempt",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
        },
        {
            "strategy_id": "IDEMP_ADAPTER_RECEIPT",
            "label": "Receipt checkpoint replay key",
            "dedupe_key_formula": "adapter correlation key plus ordering policy tuple",
            "applies_to": ["queue_adapter_receipt_inbox"],
            "result_if_duplicate": "update the existing attempt or open ReplayCollisionReview",
            "source_refs": [
                "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            ],
        },
        {
            "strategy_id": "IDEMP_BOOKING_COMMIT",
            "label": "Booking commit idempotency",
            "dedupe_key_formula": "BookingTransaction.idempotencyKey plus selected candidate hash",
            "applies_to": ["svc_integration_worker"],
            "result_if_duplicate": "reuse the current BookingTransaction or authoritative confirmation gate",
            "source_refs": [
                "phase-4-the-booking-engine.md#BookingTransaction",
            ],
        },
        {
            "strategy_id": "IDEMP_PHARMACY_DISPATCH",
            "label": "Pharmacy dispatch idempotency",
            "dedupe_key_formula": "dispatchPlanHash plus packageHash plus provider scope",
            "applies_to": ["svc_integration_worker"],
            "result_if_duplicate": "reuse the current PharmacyDispatchAttempt",
            "source_refs": [
                "phase-6-the-pharmacy-loop.md#PharmacyDispatchAttempt",
            ],
        },
        {
            "strategy_id": "IDEMP_PHARMACY_OUTCOME_ENVELOPE",
            "label": "Pharmacy outcome evidence replay key",
            "dedupe_key_formula": "rawPayloadHash || semanticPayloadHash || replayKey",
            "applies_to": ["svc_integration_worker"],
            "result_if_duplicate": "duplicate_ignored or collision review",
            "source_refs": [
                "phase-6-the-pharmacy-loop.md#Outcome reconciliation algorithm",
            ],
        },
        {
            "strategy_id": "IDEMP_TIMER_WAKEUP_CURSOR",
            "label": "Timer wakeup cursor",
            "dedupe_key_formula": "checkpointRef plus dueAt plus monotone revision",
            "applies_to": ["svc_timer_orchestrator", "store_timer_state"],
            "result_if_duplicate": "recompute current checkpoint and no-op if unchanged",
            "source_refs": [
                "phase-3-the-human-checkpoint.md#MoreInfoReplyWindowCheckpoint",
            ],
        },
        {
            "strategy_id": "IDEMP_ASSURANCE_RESTORE_GATE",
            "label": "Restore and assurance action gate",
            "dedupe_key_formula": "selected anchor tuple plus restore intent hash",
            "applies_to": ["svc_assurance_worker"],
            "result_if_duplicate": "return the current restore or review settlement",
            "source_refs": [
                "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            ],
        },
    ]

    replay_rules = [
        {
            "rule_id": "REPLAY_CANONICAL_EVENT_APPEND_ONLY",
            "label": "Canonical event append-only replay",
            "legal_replay_outcomes": ["append_only", "observational"],
            "collision_posture": "quarantine or publish new contract version",
        },
        {
            "rule_id": "REPLAY_COMMAND_SETTLEMENT_CHAIN",
            "label": "Command settlement replay",
            "legal_replay_outcomes": ["return existing settlement", "supersede with governed settlement"],
            "collision_posture": "open assurance review and do not mint second result",
        },
        {
            "rule_id": "REPLAY_ADAPTER_RECEIPT_CHECKPOINT",
            "label": "Adapter receipt checkpoint replay",
            "legal_replay_outcomes": ["exact_replay", "semantic_replay", "stale_ignore"],
            "collision_posture": "ReplayCollisionReview",
        },
        {
            "rule_id": "REPLAY_PROJECTION_FROM_EVENT_HISTORY",
            "label": "Projection rebuild from immutable event history",
            "legal_replay_outcomes": ["route-safe rebuild", "summary_only cutover", "recovery_only cutover"],
            "collision_posture": "block publication until compatibility digest matches",
        },
        {
            "rule_id": "REPLAY_FHIR_MAPPING_FROM_DOMAIN_EVENTS",
            "label": "FHIR rematerialization from published mapping contracts",
            "legal_replay_outcomes": ["derived version refresh", "superseding derivative"],
            "collision_posture": "publish new mapping contract and replay proof",
        },
        {
            "rule_id": "REPLAY_PHARMACY_OUTCOME_RECONCILIATION",
            "label": "Pharmacy outcome replay classification",
            "legal_replay_outcomes": ["duplicate_ignored", "review_required", "reopened_for_safety"],
            "collision_posture": "case-local reconciliation gate blocks closure",
        },
        {
            "rule_id": "REPLAY_SUPPORT_RESTORE_SCOPE",
            "label": "Support replay and restore scope replay",
            "legal_replay_outcomes": ["masked_read_only", "restore_allowed"],
            "collision_posture": "restore gate remains closed until current scope tuple matches",
        },
        {
            "rule_id": "REPLAY_TIMER_CHECKPOINT_RECOMPUTE",
            "label": "Timer checkpoint recompute",
            "legal_replay_outcomes": ["no_change", "new_deadline_revision", "fallback_required"],
            "collision_posture": "preserve latest monotone checkpoint only",
        },
    ]

    return {
        "baseline_id": "vecells_backend_runtime_baseline_v1",
        "mission": "Encode the authoritative idempotency, replay, and collision-handling law for the chosen backend runtime baseline.",
        "summary": {
            "idempotency_strategy_count": len(strategies),
            "replay_rule_count": len(replay_rules),
            "effect_lane_count": len(async_rows),
            "timer_family_count": len(timer_rows),
            "unresolved_gap_count": 0,
        },
        "laws": [
            "Every externally consequential mutation must originate from the durable outbox or an equivalent durable queue position tied back to CommandActionRecord.",
            "Transport acknowledgement, webhook arrival, or provider acceptance is evidence only; user-visible success requires the governing proof upgrade and settlement chain.",
            "Duplicate or reordered receipts may widen or supersede pending posture, but they may not mint a second business result.",
            "Projection rebuild replays immutable canonical events under published contract versions; projections never become canonical truth during or after replay.",
            "Raw PHI, transcripts, message bodies, phone numbers, and artifact contents move only by governed references or masked descriptors.",
        ],
        "idempotency_strategies": strategies,
        "replay_rules": replay_rules,
        "async_effect_matrix_refs": [row["effect_row_id"] for row in async_rows],
        "timer_family_refs": [row["timer_family_id"] for row in timer_rows],
        "source_refs": [
            "phase-0-the-foundation-protocol.md#6.6A Adapter outbox, inbox, and callback replay rule",
            "callback-and-clinician-messaging-loop.md",
            "phase-6-the-pharmacy-loop.md#Outcome reconciliation algorithm",
        ],
    }


def build_endpoint_coverage() -> list[dict[str, Any]]:
    return [
        {
            "endpoint_id": "urgent_diversion",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker"],
            "authoritative_store_classes": ["transactional_domain", "event_log"],
            "proof_classes": ["review_disposition", "external_confirmation"],
        },
        {
            "endpoint_id": "degraded_acceptance_fallback_review",
            "owning_service_refs": ["svc_command_api", "svc_assurance_worker"],
            "authoritative_store_classes": ["transactional_domain", "object_artifact", "worm_audit"],
            "proof_classes": ["review_disposition"],
        },
        {
            "endpoint_id": "triage_more_info_cycle",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "timer_state"],
            "proof_classes": ["external_confirmation", "recovery_disposition"],
        },
        {
            "endpoint_id": "duplicate_review",
            "owning_service_refs": ["svc_command_api", "svc_assurance_worker"],
            "authoritative_store_classes": ["transactional_domain", "worm_audit"],
            "proof_classes": ["review_disposition"],
        },
        {
            "endpoint_id": "self_care",
            "owning_service_refs": ["svc_command_api", "svc_projection_worker"],
            "authoritative_store_classes": ["transactional_domain", "projection_read"],
            "proof_classes": ["projection_visible"],
        },
        {
            "endpoint_id": "admin_resolution",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker"],
            "authoritative_store_classes": ["transactional_domain", "event_log"],
            "proof_classes": ["review_disposition", "external_confirmation"],
        },
        {
            "endpoint_id": "clinician_messaging",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker"],
            "authoritative_store_classes": ["transactional_domain", "event_log"],
            "proof_classes": ["external_confirmation"],
        },
        {
            "endpoint_id": "callback",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "timer_state"],
            "proof_classes": ["external_confirmation", "recovery_disposition"],
        },
        {
            "endpoint_id": "local_booking",
            "owning_service_refs": ["svc_command_api", "svc_integration_worker", "svc_projection_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "fhir_representation", "projection_read", "timer_state"],
            "proof_classes": ["external_confirmation", "projection_visible"],
        },
        {
            "endpoint_id": "local_waitlist_continuation",
            "owning_service_refs": ["svc_command_api", "svc_integration_worker", "svc_projection_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "projection_read", "timer_state"],
            "proof_classes": ["recovery_disposition", "projection_visible"],
        },
        {
            "endpoint_id": "network_hub_coordination",
            "owning_service_refs": ["svc_command_api", "svc_integration_worker", "svc_projection_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "projection_read", "timer_state"],
            "proof_classes": ["external_confirmation", "recovery_disposition", "projection_visible"],
        },
        {
            "endpoint_id": "pharmacy_first_referral_loop",
            "owning_service_refs": ["svc_command_api", "svc_integration_worker", "svc_projection_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "projection_read", "timer_state"],
            "proof_classes": ["external_confirmation", "review_disposition", "recovery_disposition"],
        },
        {
            "endpoint_id": "patient_contact_route_repair",
            "owning_service_refs": ["svc_command_api", "svc_notification_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "event_log", "timer_state"],
            "proof_classes": ["recovery_disposition"],
        },
        {
            "endpoint_id": "patient_identity_hold_recovery",
            "owning_service_refs": ["svc_command_api", "svc_assurance_worker", "svc_timer_orchestrator"],
            "authoritative_store_classes": ["transactional_domain", "worm_audit", "timer_state"],
            "proof_classes": ["recovery_disposition"],
        },
        {
            "endpoint_id": "support_replay_resend_restore",
            "owning_service_refs": ["svc_assurance_worker", "svc_notification_worker", "svc_integration_worker"],
            "authoritative_store_classes": ["worm_audit", "event_log", "transactional_domain"],
            "proof_classes": ["recovery_disposition", "review_disposition", "external_confirmation"],
        },
    ]


def build_bundle() -> dict[str, Any]:
    prerequisites = ensure_prerequisites()
    dependency_payload = load_json(EXTERNAL_DEPENDENCIES_PATH)

    service_scorecard = build_service_decomposition_scorecard()
    store_scorecard = build_store_topology_scorecard()
    event_scorecard = build_event_backbone_scorecard()
    runtime_components = build_runtime_components()
    namespace_rows = build_namespace_rows()
    store_rows = build_store_rows()
    async_rows = build_async_effect_rows(dependency_payload["dependencies"])
    timer_rows = build_timer_rows()
    idempotency_rules = build_idempotency_rules(async_rows, timer_rows)
    endpoint_coverage = build_endpoint_coverage()

    return {
        "backend_runtime_baseline_id": "vecells_backend_runtime_baseline_v1",
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": prerequisites,
        "chosen_service_decomposition": "OPT_SMALL_EXECUTABLES_STRONG_MODULES",
        "chosen_store_topology": "OPT_SEPARATE_DOMAIN_EVENT_PROJECTION_AUDIT",
        "chosen_event_backbone": "OPT_CANONICAL_EVENT_SPINE",
        "summary": {
            "runtime_component_count": len(runtime_components),
            "service_and_worker_count": len(
                [row for row in runtime_components if row["component_kind"] in {"service", "worker", "timer_engine"}]
            ),
            "store_and_cache_count": len(
                [row for row in runtime_components if row["component_kind"] in {"store", "cache", "object_prefix", "audit_sink"}]
            ),
            "queue_and_stream_count": len(
                [row for row in runtime_components if row["component_kind"] in {"queue", "stream"}]
            ),
            "namespace_count": len(namespace_rows),
            "store_row_count": len(store_rows),
            "async_effect_count": len(async_rows),
            "timer_family_count": len(timer_rows),
            "endpoint_coverage_count": len(endpoint_coverage),
            "unresolved_gap_count": 0,
        },
        "service_decomposition_scorecard": service_scorecard,
        "store_topology_scorecard": store_scorecard,
        "event_backbone_scorecard": event_scorecard,
        "runtime_components": runtime_components,
        "event_namespaces": namespace_rows,
        "store_matrix": store_rows,
        "async_effects": async_rows,
        "timer_families": timer_rows,
        "idempotency_and_replay_rules": idempotency_rules,
        "endpoint_coverage": endpoint_coverage,
        "assumptions": [
            "ASSUMPTION_SEQ_013_SMALL_EXECUTABLES: keep the eight executables chosen in task 012 and enforce bounded-context law inside them before considering service fan-out.",
            "ASSUMPTION_SEQ_013_PROVIDER_NEUTRAL_RUNTIME: stay provider-neutral at the runtime and storage layer; name only workload families, store classes, and contract boundaries.",
            "ASSUMPTION_SEQ_013_FEATURE_STORE_DEFERRED: keep the feature store as an explicit deferred seam outside baseline truth, settlement, and projection paths.",
        ],
        "risks": [
            "RISK_SEQ_013_NAMESPACE_BYPASS: any new adapter or shell emitting local event names directly downstream would reopen the namespace drift gap immediately.",
            "RISK_SEQ_013_FHIR_CREEP: pressure to use raw FHIR rows for operational queries would collapse the Vecells-first domain boundary and break rebuild semantics.",
        ],
        "gaps": [],
    }


def build_service_doc(payload: dict[str, Any]) -> str:
    scorecard_rows = [
        [
            row["label"],
            row["workload_boundary_fidelity"],
            row["replay_and_effect_discipline"],
            row["independent_scaling"],
            row["local_determinism"],
            row["operational_complexity"],
            row["decision"],
        ]
        for row in payload["service_decomposition_scorecard"]
    ]
    service_rows = [
        row for row in payload["runtime_components"] if row["component_kind"] in {"service", "worker", "timer_engine"}
    ]
    runtime_table = render_table(
        ["Runtime Component", "Kind", "Workload Family", "Primary Truth Role", "Key Endpoint Coverage"],
        [
            [
                row["runtime_component_name"],
                row["component_kind"],
                row["runtime_workload_family_ref"],
                row["authoritative_truth_role"],
                join_items(row["endpoint_refs"][:4]) + ("..." if len(row["endpoint_refs"]) > 4 else ""),
            ]
            for row in service_rows
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 Backend Runtime Service Baseline

        Vecells should run as a small number of deployable executables with strong bounded-context modules, not as dozens of microservices and not as one mixed monolith. That is the simplest posture that still preserves workload-family boundaries, replay-safe external effects, and later scaling.

        ## Decision

        Chosen baseline: `OPT_SMALL_EXECUTABLES_STRONG_MODULES`.

        The runtime stays split into:
        - route-scoped gateway ingress
        - authoritative command orchestration
        - projection rebuild/materialization
        - notification/callback dispatch
        - integration/adapter dispatch plus receipt ingest
        - assurance/replay guard
        - timer orchestration
        - simulator backplane

        ## Scorecard

        {render_table(
            ["Option", "Boundary", "Replay", "Scaling", "Determinism", "Complexity", "Decision"],
            scorecard_rows,
        )}

        ## Runtime Executables

        {runtime_table}

        ## Baseline Law

        - `svc_command_api` is the only writer of canonical aggregates, blockers, and settlements.
        - `svc_projection_worker` is projection-first and rebuild-first; it never upgrades canonical truth.
        - `svc_notification_worker` and `svc_integration_worker` dispatch effects only from durable queues and only upgrade truth through receipts, evidence bundles, confirmation gates, and settlements.
        - `svc_timer_orchestrator` owns all long-running waits that can change user-visible posture.
        - `svc_assurance_worker` owns quarantine, replay-collision review, restore gating, and immutable audit witness publication.
        - `svc_adapter_simulators` exists for local and CI determinism only and is explicitly non-authoritative.

        ## Rejection Notes

        - Deploy-many microservices were rejected because the corpus needs stronger contract and replay discipline before it needs bounded-context-per-deployment autonomy.
        - A modular monolith plus workers was rejected because it would blur the command, projection, integration, and assurance planes already fixed by the runtime topology baseline.
        """
    ).strip()


def build_event_doc(payload: dict[str, Any]) -> str:
    scorecard_rows = [
        [
            row["label"],
            row["contract_stability"],
            row["privacy_posture"],
            row["replay_safety"],
            row["observability_clarity"],
            row["decision"],
        ]
        for row in payload["event_backbone_scorecard"]
    ]
    namespace_table = render_table(
        ["Namespace", "Owner", "Purpose", "Family Role", "Disclosure", "Quarantine"],
        [
            [
                row["namespace_code"],
                row["owning_bounded_context_ref"],
                row["event_purpose_class"],
                row["authoritative_family_role"],
                row["default_disclosure_class"],
                row["quarantine_component_ref"],
            ]
            for row in payload["event_namespaces"]
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 Event Spine And Namespace Baseline

        Vecells needs one canonical event spine with published namespaces, published contract ownership, mandatory normalization, and explicit quarantine for unknown producers or schema drift. Event naming may not drift by producer, vendor, or shell.

        ## Decision

        Chosen baseline: `OPT_CANONICAL_EVENT_SPINE`.

        ## Scorecard

        {render_table(
            ["Option", "Contract Stability", "Privacy", "Replay", "Observability", "Decision"],
            scorecard_rows,
        )}

        ## Canonical Namespace Ownership

        {namespace_table}

        ## Backbone Law

        - Every state transition, blocker mutation, degraded transition, recovery transition, continuity-evidence change, and control-plane decision that matters downstream emits one canonical event envelope.
        - Producers may not deliver `ingest.*`, `tasks.*`, vendor callback names, or shell-local event names directly to projections, analytics, assurance, or audit.
        - Unknown producers, unknown namespaces, and semantically divergent replay must land in `queue_event_normalization_quarantine`.
        - Default compatibility is backward-compatible additive evolution. True breaks require a new published contract or, for family retirement, `compatibilityMode = namespace_break`.
        - Raw PHI, message bodies, transcripts, phone numbers, and binary payloads never travel on the spine; only governed refs, hashes, or masked descriptors do.

        ## Rejection Notes

        - Producer-local event names were rejected because Phase 0 explicitly outlaws them as downstream contracts.
        - FHIR change data capture was rejected as the primary internal feed because FHIR is derivative and cannot own lifecycle, blocker, or settlement meaning.
        """
    ).strip()


def build_storage_doc(payload: dict[str, Any]) -> str:
    scorecard_rows = [
        [
            row["label"],
            row["domain_truth_separation"],
            row["projection_rebuild_safety"],
            row["interoperability_fit"],
            row["operator_clarity"],
            row["decision"],
        ]
        for row in payload["store_topology_scorecard"]
    ]
    store_table = render_table(
        ["Store", "Class", "Truth Role", "Rebuild Source", "Baseline Scope"],
        [
            [
                row["store_name"],
                row["store_class"],
                row["authoritative_truth_role"],
                row["rebuild_source"],
                row["baseline_scope"],
            ]
            for row in payload["store_matrix"]
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 Storage And Persistence Baseline

        Vecells should keep domain transactions, FHIR representations, canonical events, projection reads, object artifacts, timer state, and WORM audit as separate store classes with different ownership and replay rules.

        ## Decision

        Chosen baseline: `OPT_SEPARATE_DOMAIN_EVENT_PROJECTION_AUDIT`.

        ## Scorecard

        {render_table(
            ["Option", "Domain Separation", "Projection Safety", "Interop Fit", "Operator Clarity", "Decision"],
            scorecard_rows,
        )}

        ## Store Matrix

        {store_table}

        ## Storage Law

        - `transactional_domain` is the only store class that owns canonical request, blocker, settlement, and closure truth.
        - `fhir_representation` is one-way derived from domain settlements and published mapping contracts.
        - `event_log` is immutable and replay-authoritative for rebuilds and analytics.
        - `projection_read` is always derived and contract-versioned.
        - `object_artifact` holds bytes, not business meaning.
        - `worm_audit` is append-only witness, not mutable case truth.
        - `feature_store` stays deferred and non-authoritative.

        ## Rejection Notes

        - A FHIR-first primary store was rejected because it would invert the Vecells-first domain boundary.
        - A shared domain-plus-projection schema was rejected because it would let projections masquerade as truth during rebuilds or drift.
        """
    ).strip()


def build_async_doc(payload: dict[str, Any]) -> str:
    timer_table = render_table(
        ["Timer Family", "Checkpoint", "Proof Class", "Settlement", "Fallback"],
        [
            [
                row["timer_name"],
                row["checkpoint_object_ref"],
                row["proof_class"],
                row["settlement_ref"],
                row["degraded_fallback_behavior"],
            ]
            for row in payload["timer_families"]
        ],
    )
    effect_table = render_table(
        ["Dependency", "Applicability", "Outbox", "Inbox", "Receipt", "Proof Upgrade"],
        [
            [
                row["dependency_name"],
                row["effect_applicability"],
                row["outbox_component_ref"] or "n/a",
                row["inbox_component_ref"] or "n/a",
                row["receipt_checkpoint_object_ref"] or "n/a",
                row["authoritative_proof_upgrade"],
            ]
            for row in payload["async_effects"]
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 Async Workflow Timer And Effect Processing

        Timers, long-running waits, and external-effect proof upgrades are first-class backend law. No user-visible deadline or external settlement may hide inside a request handler, browser tab, or queue-local retry loop.

        ## Timer Families

        {timer_table}

        ## External Effect Matrix

        {effect_table}

        ## Processing Law

        - More-info TTL, callback promises, booking confirmation, waitlist continuation, hub patient choice, practice acknowledgement, pharmacy proof windows, and recovery expiry all persist in `store_timer_state`.
        - A timer wakeup only recomputes checkpoints and submits governed commands. It does not silently mutate business truth.
        - Inbound-only dependencies such as capacity feeds, pharmacy directory snapshots, and pharmacy outcomes still reconcile through durable inbox plus receipt rules.
        - Defer or onboarding-only dependencies are explicitly marked non-applicable instead of left implied.
        """
    ).strip()


def build_replay_doc(payload: dict[str, Any]) -> str:
    strategy_table = render_table(
        ["Strategy", "Formula", "Duplicate Result"],
        [
            [
                row["label"],
                row["dedupe_key_formula"],
                row["result_if_duplicate"],
            ]
            for row in payload["idempotency_and_replay_rules"]["idempotency_strategies"]
        ],
    )
    replay_table = render_table(
        ["Replay Rule", "Legal Outcomes", "Collision Posture"],
        [
            [
                row["label"],
                join_items(row["legal_replay_outcomes"]),
                row["collision_posture"],
            ]
            for row in payload["idempotency_and_replay_rules"]["replay_rules"]
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 Outbox Inbox Callback Replay And Idempotency

        The outbox/inbox/effect-key ledger is baseline law, not an implementation detail. Every external effect must tie back to canonical action records, durable queue position, receipt checkpoints, and a single settlement chain.

        ## Idempotency Strategies

        {strategy_table}

        ## Replay Rules

        {replay_table}

        ## Non-Negotiable Rules

        - Dispatch only from `queue_command_outbox` or an equivalent durable queue position linked to `CommandActionRecord`.
        - Replayed jobs, duplicate workers, duplicate taps, and duplicate receipts return or widen the existing chain; they may not create a second external effect or second business result.
        - Callback and clinician messaging use the same canonical effect ledger as every other adapter boundary.
        - Pharmacy outcome ingest classifies replay before any case mutation and keeps weak or conflicting evidence inside a case-local reconciliation gate.
        - Support replay and restore never bypass the current scope envelope, restore gate, or owning settlement chain.
        """
    ).strip()


def build_fhir_doc(payload: dict[str, Any]) -> str:
    boundary_table = render_table(
        ["Boundary", "Owner", "Write Rule", "Read Rule"],
        [
            ["Domain aggregates", "store_domain_transaction", "Command settlements only", "Projection workers and governed interoperability mappings only"],
            ["FHIR representations", "store_fhir_representation", "Published mapping contracts only", "Interoperability/export and governed back-office use"],
            ["Browser projections", "store_projection_read_models", "Projection worker only", "Gateway query and live delta only"],
        ],
    )
    return textwrap.dedent(
        f"""
        # 13 FHIR Representation And Projection Boundary

        Vecells-first domain truth and FHIR interoperability are separate layers.

        ## One-Way Boundary

        {boundary_table}

        ## Rules

        - Domain aggregates, blockers, settlements, and closure truth live in `store_domain_transaction`.
        - FHIR rows are materialized through published mapping contracts and may be rematerialized from domain events; they do not drive canonical workflow or blocker truth.
        - Projection reads rebuild from canonical event history and published projection contracts, not from raw FHIR rows.
        - Browser routes may never read, join, or infer truth from raw FHIR tables client-side.
        - Any breaking FHIR mapping change requires a new published mapping contract plus replay proof.

        ## Why This Closes The Gap

        This baseline explicitly closes the corpus gap where raw FHIR storage could drift into being treated as primary operational truth. FHIR remains subordinate, one-way, and replayable from the Vecells domain model.
        """
    ).strip()


def build_mermaid(_: dict[str, Any]) -> str:
    return textwrap.dedent(
        """
        flowchart LR
            subgraph Ingress["Ingress And Contract Boundary"]
                A["API Gateway / BFF"]
            end

            subgraph Command["Authoritative Command Plane"]
                B["Command API"]
                C["Transactional Domain Store"]
                D["Durable Command Outbox"]
            end

            subgraph Effects["External Effect And Timer Plane"]
                E["Integration Worker"]
                F["Notification Worker"]
                G["Timer Orchestrator"]
                H["Receipt Inbox"]
                I["Normalization Quarantine"]
            end

            subgraph Read["Read And Derived Stores"]
                J["Canonical Event Spine"]
                K["Projection Worker"]
                L["Projection Read Store"]
                M["FHIR Representation Store"]
                N["Artifact Object Store"]
            end

            subgraph Assurance["Assurance And Witness"]
                O["Assurance Worker"]
                P["WORM Audit Ledger"]
            end

            A -->|"RouteIntentBinding + MutationCommandContract"| B
            B -->|"Aggregate + settlement writes"| C
            B -->|"effect key + action refs"| D
            B -->|"canonical envelopes"| J
            D -->|"dispatch only from durable queue"| E
            D -->|"communication dispatch"| F
            G -->|"governed wakeups -> commands"| B
            E -->|"supplier / transport egress"| H
            F -->|"message / callback egress"| H
            H -->|"accepted receipts only"| B
            H -->|"bad producer or divergent replay"| I
            J -->|"rebuild and projection apply"| K
            K -->|"audience-safe reads"| L
            B -->|"published mapping contracts"| M
            B -->|"artifact refs only"| N
            J -->|"analytics / audit witness"| O
            O -->|"tamper-evident witness"| P
            I -->|"review and quarantine audit"| O
        """
    ).strip()


def build_html(payload: dict[str, Any]) -> str:
    safe_json = json.dumps(payload).replace("</", "<\\/")
    template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vecells Backend Runtime Atlas</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23145d7a'/%3E%3Cpath d='M18 18h10l4 9 4-9h10L35 46h-6z' fill='white'/%3E%3C/svg%3E" />
  <style>
    :root {
      color-scheme: light;
      --bg: #edf1ef;
      --panel: rgba(255,255,255,0.94);
      --panel-strong: #ffffff;
      --text: #102227;
      --muted: #5f7278;
      --border: rgba(16,34,39,0.14);
      --border-strong: rgba(16,34,39,0.24);
      --accent: #145d7a;
      --accent-soft: rgba(20,93,122,0.12);
      --ok: #2f6a4f;
      --warn: #8b6621;
      --danger: #8d4339;
      --shadow: 0 22px 44px rgba(16,34,39,0.08);
      --radius: 20px;
      --gutter: 24px;
      --max: 1440px;
      --focus: #145d7a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(20,93,122,0.09), transparent 28%),
        linear-gradient(180deg, #f5f8f7 0%, var(--bg) 100%);
    }
    a { color: inherit; }
    button, select, input {
      font: inherit;
      color: inherit;
    }
    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }
    .app {
      max-width: var(--max);
      margin: 0 auto;
      padding: 24px 24px 40px;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 24px;
    }
    .rail,
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }
    .rail {
      padding: 20px;
      position: sticky;
      top: 20px;
      align-self: start;
    }
    .rail h1 {
      margin: 0;
      font-size: 1.2rem;
      letter-spacing: 0.01em;
    }
    .rail p {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 0.94rem;
    }
    .filter-group {
      margin-top: 18px;
      display: grid;
      gap: 10px;
    }
    .filter-group label {
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .filter-group select,
    .filter-group input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: var(--panel-strong);
      padding: 10px 12px;
    }
    .content {
      display: grid;
      gap: 24px;
    }
    .hero {
      padding: 22px 24px;
      display: grid;
      gap: 18px;
    }
    .hero-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
    }
    .hero-head h2 {
      margin: 0;
      font-size: 1.35rem;
    }
    .hero-head p {
      margin: 8px 0 0;
      color: var(--muted);
      max-width: 60ch;
      line-height: 1.5;
    }
    .counts {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
    }
    .count-card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: rgba(255,255,255,0.88);
    }
    .count-card strong {
      display: block;
      font-size: 1.5rem;
      margin-bottom: 4px;
    }
    .count-card span {
      color: var(--muted);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .atlas-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    }
    .flow {
      padding: 22px 24px;
      display: grid;
      gap: 18px;
    }
    .flow-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .flow-head h3,
    .inspector h3,
    .timer-panel h3,
    .store-panel h3 {
      margin: 0;
      font-size: 1.05rem;
    }
    .flow-head p,
    .inspector p,
    .timer-panel p,
    .store-panel p {
      margin: 6px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 0.93rem;
    }
    .pipeline {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
    }
    .stage {
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 14px;
      background: rgba(255,255,255,0.9);
      min-height: 180px;
    }
    .stage h4 {
      margin: 0 0 8px;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .stage-list {
      display: grid;
      gap: 10px;
    }
    .component-card,
    .timer-button,
    .store-button,
    .proof-chip {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      background: var(--panel-strong);
      text-align: left;
      cursor: pointer;
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }
    .component-card:hover,
    .timer-button:hover,
    .store-button:hover,
    .proof-chip:hover {
      transform: translateY(-1px);
      border-color: var(--border-strong);
      box-shadow: 0 12px 28px rgba(16,34,39,0.08);
    }
    .component-card.is-selected,
    .timer-button.is-selected,
    .store-button.is-selected,
    .proof-chip.is-selected {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    .component-card strong,
    .store-button strong,
    .timer-button strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.94rem;
    }
    .tiny {
      display: block;
      color: var(--muted);
      font-size: 0.78rem;
      line-height: 1.4;
    }
    .proof-strip {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .side-panels {
      display: grid;
      gap: 24px;
    }
    .inspector,
    .store-panel,
    .timer-panel {
      padding: 22px 24px;
      display: grid;
      gap: 14px;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .detail-table th,
    .detail-table td {
      padding: 10px 0;
      vertical-align: top;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    .detail-table th {
      width: 34%;
      color: var(--muted);
      font-weight: 600;
    }
    .list-grid {
      display: grid;
      gap: 10px;
      max-height: 320px;
      overflow: auto;
      padding-right: 4px;
    }
    .selection-state {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 0.82rem;
    }
    .selection-state code {
      background: rgba(16,34,39,0.06);
      border-radius: 999px;
      padding: 4px 8px;
    }
    @media (max-width: 1180px) {
      .app {
        grid-template-columns: 1fr;
      }
      .rail {
        position: static;
      }
      .atlas-grid {
        grid-template-columns: 1fr;
      }
      .counts {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 820px) {
      :root { --gutter: 16px; }
      .app {
        padding: 16px 16px 28px;
      }
      .counts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pipeline {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body>
  <div class="app" data-testid="atlas-shell">
    <aside class="rail" data-testid="left-rail" aria-label="Runtime atlas filters">
      <h1>Runtime Evidence Map</h1>
      <p>Filter the chosen backend baseline by service family, bounded context, event namespace, store class, proof posture, and timer family.</p>

      <div class="filter-group">
        <label for="search-input">Search</label>
        <input id="search-input" data-testid="search-input" type="search" placeholder="Search components, stores, or effects" />
      </div>
      <div class="filter-group">
        <label for="filter-service-family">Service Family</label>
        <select id="filter-service-family" data-testid="filter-service-family"></select>
      </div>
      <div class="filter-group">
        <label for="filter-context">Bounded Context</label>
        <select id="filter-context" data-testid="filter-context"></select>
      </div>
      <div class="filter-group">
        <label for="filter-namespace">Event Namespace</label>
        <select id="filter-namespace" data-testid="filter-namespace"></select>
      </div>
      <div class="filter-group">
        <label for="filter-store-class">Store Class</label>
        <select id="filter-store-class" data-testid="filter-store-class"></select>
      </div>
      <div class="filter-group">
        <label for="filter-proof-class">Proof Class</label>
        <select id="filter-proof-class" data-testid="filter-proof-class"></select>
      </div>
      <div class="filter-group">
        <label for="filter-timer-family">Timer Family</label>
        <select id="filter-timer-family" data-testid="filter-timer-family"></select>
      </div>
    </aside>

    <main class="content">
      <section class="hero panel" data-testid="hero-strip" aria-labelledby="hero-title">
        <div class="hero-head">
          <div>
            <h2 id="hero-title">Chosen Baseline: small executables, one canonical event spine, explicit proof upgrades</h2>
            <p id="hero-summary-text"></p>
          </div>
          <div class="selection-state" id="selection-state" data-testid="selection-state" data-selected-service="" data-selected-store="" data-selected-proof="" data-selected-timer="">
            <code id="selection-service">service:none</code>
            <code id="selection-store">store:none</code>
            <code id="selection-proof">proof:all</code>
            <code id="selection-timer">timer:none</code>
          </div>
        </div>
        <div class="counts" id="hero-counts"></div>
      </section>

      <div class="atlas-grid">
        <section class="flow panel" data-testid="flow-canvas" aria-labelledby="flow-title">
          <div class="flow-head">
            <div>
              <h3 id="flow-title">Command -> event -> projection -> external proof -> settlement</h3>
              <p>Each lane below stays contract-aware and causal. External effect acceptance never skips ahead to business truth.</p>
            </div>
          </div>
          <div class="proof-strip" id="proof-strip" aria-label="Proof classes"></div>
          <div class="pipeline" id="pipeline"></div>
        </section>

        <div class="side-panels">
          <section class="inspector panel" data-testid="service-inspector" aria-labelledby="service-title">
            <div>
              <h3 id="service-title">Service Inspector</h3>
              <p id="service-summary"></p>
            </div>
            <table class="detail-table">
              <tbody id="service-detail-body"></tbody>
            </table>
          </section>

          <section class="store-panel panel" data-testid="store-inspector" aria-labelledby="store-title">
            <div>
              <h3 id="store-title">Store Inspector</h3>
              <p id="store-summary"></p>
            </div>
            <div class="list-grid" id="store-list"></div>
            <table class="detail-table">
              <tbody id="store-detail-body"></tbody>
            </table>
          </section>

          <section class="timer-panel panel" data-testid="timer-panel" aria-labelledby="timer-title">
            <div>
              <h3 id="timer-title">Timer Panel</h3>
              <p id="timer-summary"></p>
            </div>
            <div class="list-grid" id="timer-list"></div>
            <table class="detail-table">
              <tbody id="timer-detail-body"></tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  </div>

  <script id="embedded-json" type="application/json">__EMBEDDED_JSON__</script>
  <script>
    const payload = JSON.parse(document.getElementById('embedded-json').textContent);
    const components = payload.runtime_components;
    const stores = payload.store_matrix;
    const timers = payload.timer_families;
    const effects = payload.async_effects;

    const state = {
      search: '',
      family: 'all',
      context: 'all',
      namespace: 'all',
      storeClass: 'all',
      proofClass: 'all',
      timerFamily: 'all',
      selectedService: components.find((row) => ['service', 'worker', 'timer_engine'].includes(row.component_kind)).runtime_component_id,
      selectedStore: stores[0].store_id,
      selectedTimer: timers[0].timer_family_id,
    };

    const ids = {
      search: document.getElementById('search-input'),
      family: document.getElementById('filter-service-family'),
      context: document.getElementById('filter-context'),
      namespace: document.getElementById('filter-namespace'),
      storeClass: document.getElementById('filter-store-class'),
      proofClass: document.getElementById('filter-proof-class'),
      timerFamily: document.getElementById('filter-timer-family'),
      heroCounts: document.getElementById('hero-counts'),
      heroSummary: document.getElementById('hero-summary-text'),
      proofStrip: document.getElementById('proof-strip'),
      pipeline: document.getElementById('pipeline'),
      serviceSummary: document.getElementById('service-summary'),
      serviceDetailBody: document.getElementById('service-detail-body'),
      storeSummary: document.getElementById('store-summary'),
      storeList: document.getElementById('store-list'),
      storeDetailBody: document.getElementById('store-detail-body'),
      timerSummary: document.getElementById('timer-summary'),
      timerList: document.getElementById('timer-list'),
      timerDetailBody: document.getElementById('timer-detail-body'),
      selectionState: document.getElementById('selection-state'),
      selectionService: document.getElementById('selection-service'),
      selectionStore: document.getElementById('selection-store'),
      selectionProof: document.getElementById('selection-proof'),
      selectionTimer: document.getElementById('selection-timer'),
    };

    function uniq(values) {
      return Array.from(new Set(values.filter(Boolean))).sort();
    }

    function list(value) {
      return Array.isArray(value) ? value : [];
    }

    function fillSelect(select, values, label) {
      const current = select.value || 'all';
      select.innerHTML = '';
      const option = document.createElement('option');
      option.value = 'all';
      option.textContent = `All ${label}`;
      select.appendChild(option);
      values.forEach((value) => {
        const item = document.createElement('option');
        item.value = value;
        item.textContent = value;
        select.appendChild(item);
      });
      select.value = values.includes(current) || current === 'all' ? current : 'all';
    }

    function matchesComponent(row) {
      const haystack = [
        row.runtime_component_name,
        row.runtime_component_id,
        row.authoritative_truth_role,
        ...list(row.owning_bounded_context_refs),
        ...list(row.endpoint_refs),
        ...list(row.namespace_refs),
      ].join(' ').toLowerCase();
      return (
        (!state.search || haystack.includes(state.search.toLowerCase())) &&
        (state.family === 'all' || row.component_kind === state.family) &&
        (state.context === 'all' || list(row.owning_bounded_context_refs).includes(state.context)) &&
        (state.namespace === 'all' || list(row.namespace_refs).includes(state.namespace)) &&
        (state.storeClass === 'all' || row.store_class === state.storeClass) &&
        (state.proofClass === 'all' || row.external_proof_class === state.proofClass) &&
        (state.timerFamily === 'all' || list(row.timer_dependency_refs).includes(state.timerFamily))
      );
    }

    function matchesStore(row) {
      const haystack = [row.store_name, row.store_class, row.authoritative_truth_role].join(' ').toLowerCase();
      return (
        (!state.search || haystack.includes(state.search.toLowerCase())) &&
        (state.storeClass === 'all' || row.store_class === state.storeClass)
      );
    }

    function matchesTimer(row) {
      const haystack = [row.timer_name, row.timer_family_id, row.governing_object_ref, row.degraded_fallback_behavior].join(' ').toLowerCase();
      return (
        (!state.search || haystack.includes(state.search.toLowerCase())) &&
        (state.timerFamily === 'all' || row.timer_family_id === state.timerFamily) &&
        (state.proofClass === 'all' || row.proof_class === state.proofClass)
      );
    }

    function detailRows(target, rows) {
      target.innerHTML = rows.map(([key, value]) => `<tr><th scope="row">${key}</th><td>${value}</td></tr>`).join('');
    }

    function renderHero() {
      const summary = payload.summary;
      ids.heroSummary.textContent = `${summary.runtime_component_count} runtime components, ${summary.namespace_count} canonical namespaces, ${summary.async_effect_count} dependency effect lanes, and ${summary.timer_family_count} governed timer families.`;
      const cards = [
        ['Services', summary.service_and_worker_count],
        ['Stores', summary.store_row_count],
        ['Queues / Streams', summary.queue_and_stream_count],
        ['Namespaces', summary.namespace_count],
        ['Timer Families', summary.timer_family_count],
        ['Unresolved Gaps', summary.unresolved_gap_count],
      ];
      ids.heroCounts.innerHTML = cards.map(([label, value]) => `<div class="count-card"><strong>${value}</strong><span>${label}</span></div>`).join('');
    }

    function renderProofStrip() {
      const proofValues = uniq(effects.map((row) => row.external_proof_class));
      ids.proofStrip.innerHTML = proofValues.map((value) => {
        const selected = state.proofClass === value ? ' is-selected' : '';
        return `<button type="button" class="proof-chip${selected}" data-proof="${value}"><strong>${value}</strong><span class="tiny">${effects.filter((row) => row.external_proof_class === value).length} effect lanes</span></button>`;
      }).join('');
      ids.proofStrip.querySelectorAll('[data-proof]').forEach((button) => {
        button.addEventListener('click', () => {
          state.proofClass = button.dataset.proof;
          ids.proofClass.value = state.proofClass;
          render();
        });
      });
    }

    function renderPipeline() {
      const lanes = [
        { key: 'ingress', title: 'Ingress' },
        { key: 'command', title: 'Command & Truth' },
        { key: 'effect', title: 'Effects & Timers' },
        { key: 'read', title: 'Derived Read' },
        { key: 'assurance', title: 'Assurance' },
      ];
      const filtered = components.filter(matchesComponent);
      ids.pipeline.innerHTML = lanes.map((lane) => {
        const laneRows = filtered.filter((row) => row.flow_lane === lane.key);
        const items = laneRows.length
          ? laneRows.map((row) => `
              <button type="button" class="component-card${state.selectedService === row.runtime_component_id ? ' is-selected' : ''}" data-component-id="${row.runtime_component_id}">
                <strong>${row.runtime_component_name}</strong>
                <span class="tiny">${row.component_kind} · ${row.store_class} · ${row.runtime_workload_family_ref}</span>
                <span class="tiny">${row.authoritative_truth_role}</span>
              </button>
            `).join('')
          : '<div class="tiny">No components match the current filters.</div>';
        return `<section class="stage"><h4>${lane.title}</h4><div class="stage-list">${items}</div></section>`;
      }).join('');
      ids.pipeline.querySelectorAll('[data-component-id]').forEach((button) => {
        button.addEventListener('click', () => {
          state.selectedService = button.dataset.componentId;
          render();
        });
      });
    }

    function renderServiceInspector() {
      const row = components.find((item) => item.runtime_component_id === state.selectedService) || components[0];
      state.selectedService = row.runtime_component_id;
      ids.serviceSummary.textContent = row.notes;
      detailRows(ids.serviceDetailBody, [
        ['Kind', row.component_kind],
        ['Workload Family', row.runtime_workload_family_ref],
        ['Bounded Contexts', list(row.owning_bounded_context_refs).join(', ')],
        ['Store Class', row.store_class],
        ['Proof Class', row.external_proof_class],
        ['Namespaces', list(row.namespace_refs).join(', ')],
        ['Endpoints', list(row.endpoint_refs).join(', ') || 'n/a'],
        ['Idempotency', row.idempotency_strategy_ref],
        ['Replay', row.replay_strategy_ref],
      ]);
    }

    function renderStores() {
      const filtered = stores.filter(matchesStore);
      if (!filtered.find((row) => row.store_id === state.selectedStore)) {
        state.selectedStore = filtered[0] ? filtered[0].store_id : stores[0].store_id;
      }
      ids.storeList.innerHTML = filtered.map((row) => `
        <button type="button" class="store-button${state.selectedStore === row.store_id ? ' is-selected' : ''}" data-store-id="${row.store_id}">
          <strong>${row.store_name}</strong>
          <span class="tiny">${row.store_class} · ${row.baseline_scope}</span>
        </button>
      `).join('');
      ids.storeList.querySelectorAll('[data-store-id]').forEach((button) => {
        button.addEventListener('click', () => {
          state.selectedStore = button.dataset.storeId;
          render();
        });
      });
      const row = stores.find((item) => item.store_id === state.selectedStore) || stores[0];
      ids.storeSummary.textContent = row.notes;
      detailRows(ids.storeDetailBody, [
        ['Class', row.store_class],
        ['Truth Role', row.authoritative_truth_role],
        ['Retention', row.retention_strategy],
        ['Backup / Restore', row.backup_restore_scope_ref],
        ['Data Classes', list(row.data_classification_refs).join(', ')],
        ['Rebuild Source', row.rebuild_source],
        ['Scope', row.baseline_scope],
      ]);
    }

    function renderTimers() {
      const filtered = timers.filter(matchesTimer);
      if (!filtered.find((row) => row.timer_family_id === state.selectedTimer)) {
        state.selectedTimer = filtered[0] ? filtered[0].timer_family_id : timers[0].timer_family_id;
      }
      ids.timerList.innerHTML = filtered.map((row) => `
        <button type="button" class="timer-button${state.selectedTimer === row.timer_family_id ? ' is-selected' : ''}" data-timer-id="${row.timer_family_id}">
          <strong>${row.timer_name}</strong>
          <span class="tiny">${row.proof_class} · ${row.checkpoint_object_ref}</span>
        </button>
      `).join('');
      ids.timerList.querySelectorAll('[data-timer-id]').forEach((button) => {
        button.addEventListener('click', () => {
          state.selectedTimer = button.dataset.timerId;
          render();
        });
      });
      const row = timers.find((item) => item.timer_family_id === state.selectedTimer) || timers[0];
      ids.timerSummary.textContent = row.notes;
      detailRows(ids.timerDetailBody, [
        ['Checkpoint', row.checkpoint_object_ref],
        ['Owner', row.owning_runtime_component_id],
        ['Proof Class', row.proof_class],
        ['Settlement', row.settlement_ref],
        ['Fallback', row.degraded_fallback_behavior],
        ['Endpoints', list(row.endpoint_refs).join(', ')],
      ]);
    }

    function syncSelectionState() {
      const selectedStore = stores.find((row) => row.store_id === state.selectedStore) || stores[0];
      ids.selectionState.dataset.selectedService = state.selectedService;
      ids.selectionState.dataset.selectedStore = selectedStore.store_class;
      ids.selectionState.dataset.selectedProof = state.proofClass;
      ids.selectionState.dataset.selectedTimer = state.selectedTimer;
      ids.selectionService.textContent = `service:${state.selectedService}`;
      ids.selectionStore.textContent = `store:${selectedStore.store_class}`;
      ids.selectionProof.textContent = `proof:${state.proofClass}`;
      ids.selectionTimer.textContent = `timer:${state.selectedTimer}`;
    }

    function render() {
      renderHero();
      renderProofStrip();
      renderPipeline();
      renderServiceInspector();
      renderStores();
      renderTimers();
      syncSelectionState();
    }

    function init() {
      fillSelect(ids.family, uniq(components.map((row) => row.component_kind)), 'service families');
      fillSelect(ids.context, uniq(components.flatMap((row) => list(row.owning_bounded_context_refs))), 'contexts');
      fillSelect(ids.namespace, uniq(payload.event_namespaces.map((row) => row.namespace_code)), 'namespaces');
      fillSelect(ids.storeClass, uniq([...components.map((row) => row.store_class), ...stores.map((row) => row.store_class)]), 'store classes');
      fillSelect(ids.proofClass, uniq([...components.map((row) => row.external_proof_class), ...effects.map((row) => row.external_proof_class)]), 'proof classes');
      fillSelect(ids.timerFamily, uniq(timers.map((row) => row.timer_family_id)), 'timer families');

      ids.search.addEventListener('input', (event) => {
        state.search = event.target.value;
        render();
      });
      ids.family.addEventListener('change', (event) => {
        state.family = event.target.value;
        render();
      });
      ids.context.addEventListener('change', (event) => {
        state.context = event.target.value;
        render();
      });
      ids.namespace.addEventListener('change', (event) => {
        state.namespace = event.target.value;
        render();
      });
      ids.storeClass.addEventListener('change', (event) => {
        state.storeClass = event.target.value;
        render();
      });
      ids.proofClass.addEventListener('change', (event) => {
        state.proofClass = event.target.value;
        render();
      });
      ids.timerFamily.addEventListener('change', (event) => {
        state.timerFamily = event.target.value;
        if (state.timerFamily !== 'all') {
          state.selectedTimer = state.timerFamily;
        }
        render();
      });

      render();
    }

    init();
  </script>
</body>
</html>
"""
    return template.replace("__EMBEDDED_JSON__", safe_json)


def main() -> None:
    payload = build_bundle()

    write_csv(SERVICE_RUNTIME_MATRIX_PATH, csv_ready(payload["runtime_components"]))
    write_csv(EVENT_NAMESPACE_MATRIX_PATH, csv_ready(payload["event_namespaces"]))
    write_csv(STORE_RETENTION_MATRIX_PATH, csv_ready(payload["store_matrix"]))
    write_csv(ASYNC_EFFECT_PROOF_MATRIX_PATH, csv_ready(payload["async_effects"]))
    write_csv(TIMER_MATRIX_PATH, csv_ready(payload["timer_families"]))
    write_json(IDEMPOTENCY_RULES_PATH, payload["idempotency_and_replay_rules"])

    write_text(SERVICE_DOC_PATH, build_service_doc(payload))
    write_text(EVENT_DOC_PATH, build_event_doc(payload))
    write_text(STORAGE_DOC_PATH, build_storage_doc(payload))
    write_text(ASYNC_DOC_PATH, build_async_doc(payload))
    write_text(REPLAY_DOC_PATH, build_replay_doc(payload))
    write_text(FHIR_DOC_PATH, build_fhir_doc(payload))
    write_text(MERMAID_PATH, build_mermaid(payload))
    write_text(ATLAS_HTML_PATH, build_html(payload))


if __name__ == "__main__":
    main()
