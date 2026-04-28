#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
TRUST_BOUNDARIES_PATH = DATA_DIR / "trust_zone_boundaries.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"

OUTPUT_MANIFEST_PATH = DATA_DIR / "gateway_surface_manifest.json"
OUTPUT_ROUTE_MATRIX_PATH = DATA_DIR / "audience_route_family_to_gateway_matrix.csv"
OUTPUT_BOUNDARY_MATRIX_PATH = DATA_DIR / "gateway_downstream_boundary_matrix.csv"
SERVICE_DEFINITION_PATH = ROOT / "services" / "api-gateway" / "src" / "service-definition.ts"
SERVICE_RUNTIME_PATH = ROOT / "services" / "api-gateway" / "src" / "runtime.ts"
SERVICE_README_PATH = ROOT / "services" / "api-gateway" / "README.md"

TASK_ID = "par_090"
VISUAL_MODE = "Gateway_Surface_Authority_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

SOURCE_PRECEDENCE = [
    "prompt/090.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime rules",
    "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
    "blueprint/platform-frontend-blueprint.md#Shell ownership",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/staff-operations-and-support-blueprint.md",
    "blueprint/operations-console-frontend-blueprint.md",
    "blueprint/pharmacy-console-frontend-architecture.md",
    "blueprint/governance-admin-console-frontend-blueprint.md",
    "blueprint/forensic-audit-findings.md#Finding 86",
    "blueprint/forensic-audit-findings.md#Finding 87",
    "blueprint/forensic-audit-findings.md#Finding 90",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 92",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "blueprint/forensic-audit-findings.md#Finding 100",
    "blueprint/forensic-audit-findings.md#Finding 101",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/api_contract_registry_manifest.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/trust_zone_boundaries.json",
]

ASSUMPTIONS = [
    {
        "assumption_ref": "ASSUMPTION_090_SHARED_RUNTIME_BINARY_DISTINCT_AUDIENCE_MANIFESTS",
        "value": "one_gateway_runtime_binary_with_audience_scoped_authority_manifests",
        "reason": (
            "Phase 0 needs real audience splits now without proliferating seven unrelated gateway "
            "codebases. One runtime binary is acceptable only while every audience gateway service "
            "keeps its own published authority tuple, base path, route-family set, and refusal rules."
        ),
    },
    {
        "assumption_ref": "ASSUMPTION_090_OPENAPI_IS_PUBLICATION_LAYER_NOT_BUSINESS_HANDLER",
        "value": "openapi_documents_publish_declared_gateway_contracts",
        "reason": (
            "This task publishes browser-callable authority, route bindings, and refusal seams. "
            "Later route-specific handler work may replace mock-now projections and simulator-backed "
            "commands behind the same published contract refs."
        ),
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_090_ROUTE_SPECIFIC_CACHE_EXECUTION",
        "owning_task_ref": "par_096",
        "scope": (
            "Route-family-specific client cache invalidation, live-channel downgrade semantics, and "
            "recovery posture execution remain owned by the later continuity/runtime task."
        ),
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_090_RUNTIME_PUBLICATION_BUNDLE_LIVE_PARITY",
        "owning_task_ref": "par_094",
        "scope": (
            "RuntimePublicationBundle and ReleasePublicationParityRecord generation will later turn "
            "these gateway authority tuples into release-governed publication evidence."
        ),
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_090_AUDIENCE_SHELL_BINDING",
        "owning_task_ref": "par_103_to_120",
        "scope": (
            "Frontend shell routes, selected-anchor continuity, and browser automation bind to these "
            "gateway services later without redefining audience authority."
        ),
    },
]

SERVICE_DEFINITIONS = [
    {
        "gateway_service_ref": "agws_patient_web",
        "service_label": "Patient web gateway service",
        "audience_family": "patient",
        "shell_slug": "patient-web",
        "gateway_surface_refs": [
            "gws_patient_appointments",
            "gws_patient_embedded_shell",
            "gws_patient_health_record",
            "gws_patient_home",
            "gws_patient_intake_phone",
            "gws_patient_intake_web",
            "gws_patient_messages",
            "gws_patient_requests",
            "gws_patient_secure_link_recovery",
        ],
        "entrypoint_base_path": "/audiences/patient-web",
        "combined_surface_justification": (
            "Public entry, secure-link recovery, authenticated portal, and embedded patient routes "
            "share one delivery shell, but each published GatewayBffSurface still keeps its own "
            "session policy, tenant isolation mode, and downstream family allowlist."
        ),
        "seed_projection_refs": [
            "seed_projection_patient_portal",
            "seed_projection_patient_requests",
        ],
        "simulator_backplane_refs": [
            "sim_nhs_login_backplane",
            "sim_telephony_notifications",
        ],
        "source_refs": [
            "blueprint/patient-portal-experience-architecture-blueprint.md",
            "blueprint/patient-account-and-communications-blueprint.md",
            "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
        ],
    },
    {
        "gateway_service_ref": "agws_clinical_workspace",
        "service_label": "Clinical workspace gateway service",
        "audience_family": "staff",
        "shell_slug": "clinical-workspace",
        "gateway_surface_refs": [
            "gws_assistive_sidecar",
            "gws_clinician_workspace",
            "gws_clinician_workspace_child",
            "gws_practice_ops_workspace",
        ],
        "entrypoint_base_path": "/audiences/clinical-workspace",
        "combined_surface_justification": (
            "Clinical workspace, child task work, practice operations, and assistive sidecar remain "
            "one staff-facing shell family, but authority still splits by route family and published "
            "surface rather than by route prefix guesswork."
        ),
        "seed_projection_refs": ["seed_projection_staff_workspace"],
        "simulator_backplane_refs": ["sim_staff_workspace_commands"],
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/staff-workspace-interface-architecture.md",
        ],
    },
    {
        "gateway_service_ref": "agws_support_workspace",
        "service_label": "Support workspace gateway service",
        "audience_family": "support",
        "shell_slug": "support-workspace",
        "gateway_surface_refs": [
            "gws_support_assisted_capture",
            "gws_support_replay_observe",
            "gws_support_ticket_workspace",
        ],
        "entrypoint_base_path": "/audiences/support-workspace",
        "combined_surface_justification": (
            "Support investigation, replay/observe, and assisted capture stay under one support shell "
            "only while delegate scope, observe return, and mutation boundaries remain explicit."
        ),
        "seed_projection_refs": ["seed_projection_support_workspace"],
        "simulator_backplane_refs": ["sim_support_replay_backplane"],
        "source_refs": [
            "blueprint/staff-operations-and-support-blueprint.md#Support route contract",
            "blueprint/forensic-audit-findings.md#Finding 100",
        ],
    },
    {
        "gateway_service_ref": "agws_hub_desk",
        "service_label": "Hub desk gateway service",
        "audience_family": "hub",
        "shell_slug": "hub-desk",
        "gateway_surface_refs": ["gws_hub_case_management", "gws_hub_queue"],
        "entrypoint_base_path": "/audiences/hub-desk",
        "combined_surface_justification": (
            "Queue and case-management flows share one hub shell, but their recovery aliases and "
            "settlement posture remain published instead of branching behind one generic case BFF."
        ),
        "seed_projection_refs": ["seed_projection_hub_queue"],
        "simulator_backplane_refs": ["sim_hub_coordination_commands"],
        "source_refs": ["blueprint/phase-5-the-network-horizon.md#Frontend work"],
    },
    {
        "gateway_service_ref": "agws_pharmacy_console",
        "service_label": "Pharmacy console gateway service",
        "audience_family": "pharmacy",
        "shell_slug": "pharmacy-console",
        "gateway_surface_refs": ["gws_pharmacy_console"],
        "entrypoint_base_path": "/audiences/pharmacy-console",
        "combined_surface_justification": (
            "The Phase 0 pharmacy shell currently maps to one explicit gateway surface and must stay "
            "isolated from staff or patient authority despite shared infrastructure."
        ),
        "seed_projection_refs": ["seed_projection_pharmacy_console"],
        "simulator_backplane_refs": ["sim_pharmacy_dispatch_commands"],
        "source_refs": ["blueprint/pharmacy-console-frontend-architecture.md#Mission frame"],
    },
    {
        "gateway_service_ref": "agws_ops_console",
        "service_label": "Operations console gateway service",
        "audience_family": "operations",
        "shell_slug": "ops-console",
        "gateway_surface_refs": ["gws_operations_board", "gws_operations_drilldown"],
        "entrypoint_base_path": "/audiences/ops-console",
        "combined_surface_justification": (
            "Operations board and drilldown keep one console shell, but board calm posture and "
            "drilldown evidence access still publish as separate route-family authority tuples."
        ),
        "seed_projection_refs": ["seed_projection_operations_board"],
        "simulator_backplane_refs": ["sim_ops_console_commands"],
        "source_refs": [
            "blueprint/operations-console-frontend-blueprint.md#Canonical route family",
        ],
    },
    {
        "gateway_service_ref": "agws_governance_console",
        "service_label": "Governance console gateway service",
        "audience_family": "governance",
        "shell_slug": "governance-console",
        "gateway_surface_refs": ["gws_governance_shell"],
        "entrypoint_base_path": "/audiences/governance-console",
        "combined_surface_justification": (
            "Governance remains a dedicated shell because access, release, and compliance routes must "
            "not blur into operations or support authority."
        ),
        "seed_projection_refs": ["seed_projection_governance_console"],
        "simulator_backplane_refs": ["sim_governance_release_controls"],
        "source_refs": [
            "blueprint/governance-admin-console-frontend-blueprint.md#Shell and route topology",
        ],
    },
]

SERVICE_ORDER = {row["gateway_service_ref"]: index for index, row in enumerate(SERVICE_DEFINITIONS)}
ROUTE_STATE_ORDER = {"published": 0, "degraded": 1, "blocked": 2}
SERVICE_STATE_ORDER = {"published": 0, "degraded": 1, "blocked": 2}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, payload: str) -> None:
    path.write_text(payload, encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def replace_once(source: str, target: str, replacement: str, requirement: str) -> str:
    require(target in source, requirement)
    return source.replace(target, replacement, 1)


def insert_before_token(source: str, token: str, block: str, requirement: str) -> str:
    index = source.find(token)
    require(index >= 0, requirement)
    return source[:index] + block + source[index:]


def insert_before_enclosing_brace(source: str, token: str, block: str, requirement: str) -> str:
    index = source.find(token)
    require(index >= 0, requirement)
    brace_index = source.rfind("{", 0, index)
    require(brace_index >= 0, requirement)
    return source[:brace_index] + block + source[brace_index:]


def insert_after_token(source: str, token: str, block: str, requirement: str) -> str:
    index = source.find(token)
    require(index >= 0, requirement)
    insert_at = index + len(token)
    return source[:insert_at] + block + source[insert_at:]


def stable_hash(parts: list[Any]) -> str:
    payload = json.dumps(parts, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def split_semicolon(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def route_state_from_bundle(bundle: dict[str, Any] | None) -> str:
    if bundle is None:
        return "blocked"
    validation_state = bundle["validationState"]
    if validation_state == "valid":
        return "published"
    if validation_state == "warning":
        return "degraded"
    return "blocked"


def publication_state_for_route(bundle: dict[str, Any] | None) -> str:
    if bundle is None:
        return "parallel_gap_blocked"
    validation_state = bundle["validationState"]
    if validation_state == "valid":
        return "mock_published"
    if validation_state == "warning":
        return "mock_published_with_downgrade"
    if validation_state == "exception":
        return "blocked_exception"
    return "blocked_unknown"


def max_state(states: list[str], order: dict[str, int]) -> str:
    return max(states, key=lambda item: order[item]) if states else min(order, key=order.get)


def aggregate_service_state(states: list[str]) -> str:
    if not states:
        return "published"
    if all(state == "blocked" for state in states):
        return "blocked"
    if any(state in {"blocked", "degraded"} for state in states):
        return "degraded"
    return "published"


def build_manifest() -> dict[str, Any]:
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    gateway_surfaces_payload = read_json(GATEWAY_SURFACES_PATH)
    trust_payload = read_json(TRUST_BOUNDARIES_PATH)
    frontend_payload = read_json(FRONTEND_MANIFESTS_PATH)
    api_registry_payload = read_json(API_REGISTRY_PATH)

    surface_by_id = {
        row["surfaceId"]: row for row in gateway_surfaces_payload["gateway_surfaces"]
    }
    trust_boundary_by_id = {
        row["trustZoneBoundaryId"]: row for row in trust_payload["trust_zone_boundaries"]
    }
    route_bundle_by_ref = {
        row["routeFamilyRef"]: row for row in api_registry_payload["routeFamilyBundles"]
    }

    frontend_manifest_by_surface: dict[str, dict[str, Any]] = {}
    runtime_binding_by_surface: dict[str, dict[str, Any]] = {}
    surface_publication_by_surface: dict[str, dict[str, Any]] = {}

    for row in frontend_payload["frontendContractManifests"]:
        for surface_ref in row["gatewaySurfaceRefs"]:
            frontend_manifest_by_surface[surface_ref] = row
    for row in frontend_payload["audienceSurfaceRuntimeBindings"]:
        for surface_ref in row["gatewaySurfaceRefs"]:
            runtime_binding_by_surface[surface_ref] = row
    for row in frontend_payload["surfacePublications"]:
        for surface_ref in row["gatewaySurfaceRefs"]:
            surface_publication_by_surface[surface_ref] = row

    route_ownership_rows = gateway_surfaces_payload["route_family_ownership"]
    route_ownership_by_ref: dict[str, list[dict[str, Any]]] = {}
    for row in route_ownership_rows:
        route_ownership_by_ref.setdefault(row["route_family_id"], []).append(row)

    route_publications: list[dict[str, Any]] = []
    gateway_surface_rows: list[dict[str, Any]] = []
    gateway_service_rows: list[dict[str, Any]] = []
    deployment_descriptors: list[dict[str, Any]] = []
    local_bootstrap_rows: list[dict[str, Any]] = []
    boundary_matrix_rows: list[dict[str, Any]] = []
    route_matrix_rows: list[dict[str, Any]] = []

    registry_gap_by_id = {
        row["gapId"]: row for row in api_registry_payload["parallelInterfaceGaps"]
    }
    relevant_gap_ids: set[str] = set()

    route_state_counts = {"published": 0, "degraded": 0, "blocked": 0}
    service_state_counts = {"published": 0, "degraded": 0, "blocked": 0}

    for service_def in SERVICE_DEFINITIONS:
        service_surfaces = [surface_by_id[ref] for ref in service_def["gateway_surface_refs"]]
        route_family_refs = dedupe(
            [
                route_family_ref
                for surface in service_surfaces
                for route_family_ref in surface["routeFamilies"]
            ]
        )
        channel_profiles = dedupe([surface["channelProfile"] for surface in service_surfaces])
        session_policy_refs = dedupe([surface["sessionPolicyRef"] for surface in service_surfaces])
        tenant_isolation_modes = dedupe(
            [surface["tenantIsolationMode"] for surface in service_surfaces]
        )
        allowed_downstream = dedupe(
            [
                workload_ref
                for surface in service_surfaces
                for workload_ref in surface["downstreamWorkloadFamilyRefs"]
            ]
        )
        trust_boundary_refs = dedupe(
            [
                boundary_ref
                for surface in service_surfaces
                for boundary_ref in surface["trustZoneBoundaryRefs"]
            ]
        )
        frontend_manifest_refs = dedupe(
            [
                frontend_manifest_by_surface[surface["surfaceId"]]["frontendContractManifestId"]
                for surface in service_surfaces
                if surface["surfaceId"] in frontend_manifest_by_surface
            ]
        )
        runtime_binding_refs = dedupe(
            [
                runtime_binding_by_surface[surface["surfaceId"]]["audienceSurfaceRuntimeBindingId"]
                for surface in service_surfaces
                if surface["surfaceId"] in runtime_binding_by_surface
            ]
        )
        runtime_publication_bundle_refs = dedupe(
            [
                runtime_binding_by_surface[surface["surfaceId"]]["runtimePublicationBundleRef"]
                for surface in service_surfaces
                if surface["surfaceId"] in runtime_binding_by_surface
            ]
        )
        assurance_slice_refs = dedupe(
            [
                assurance_ref
                for surface in service_surfaces
                for assurance_ref in surface["requiredAssuranceSliceRefs"]
            ]
        )

        per_service_route_states: list[str] = []
        for route_family_ref in route_family_refs:
            bundle = route_bundle_by_ref.get(route_family_ref)
            route_state = route_state_from_bundle(bundle)
            per_service_route_states.append(route_state)
            route_state_counts[route_state] += 1
            if bundle:
                relevant_gap_ids.update(bundle["parallelInterfaceGapRefs"])
            else:
                relevant_gap_ids.add(
                    "PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING"
                )

            route_rows = route_ownership_by_ref.get(route_family_ref, [])
            primary_route_row = next(
                (row for row in route_rows if row["ownership_role"] == "primary"), None
            )
            if primary_route_row is None:
                continue

            publication_row = {
                "routePublicationRef": f"grp::{route_family_ref}",
                "gatewayServiceRef": service_def["gateway_service_ref"],
                "routeFamilyRef": route_family_ref,
                "routeFamilyLabel": primary_route_row["route_family"],
                "audienceSurfaceRef": primary_route_row["audience_surface_ref"],
                "primaryGatewaySurfaceRef": primary_route_row["primary_gateway_surface_id"],
                "gatewaySurfaceRefs": dedupe([row["gateway_surface_id"] for row in route_rows]),
                "projectionQueryContractRef": bundle["projectionQueryContractRef"] if bundle else None,
                "mutationCommandContractRef": bundle["mutationCommandContractRef"] if bundle else None,
                "liveUpdateChannelContractRef": bundle["liveUpdateChannelContractRef"] if bundle else None,
                "clientCachePolicyRefs": bundle["clientCachePolicyRefs"] if bundle else [],
                "validationState": bundle["validationState"] if bundle else "missing",
                "browserPostureState": bundle["browserPostureState"] if bundle else "blocked",
                "routeState": route_state,
                "publicationState": publication_state_for_route(bundle),
                "allowedDownstreamWorkloadFamilyRefs": split_semicolon(
                    primary_route_row["downstream_workload_family_refs"]
                ),
                "sessionPolicyRef": primary_route_row["session_policy_ref"],
                "tenantIsolationMode": primary_route_row["tenant_isolation_mode"],
                "frontendContractManifestRef": (
                    frontend_manifest_by_surface[primary_route_row["primary_gateway_surface_id"]][
                        "frontendContractManifestId"
                    ]
                    if primary_route_row["primary_gateway_surface_id"]
                    in frontend_manifest_by_surface
                    else None
                ),
                "parallelInterfaceGapRefs": bundle["parallelInterfaceGapRefs"] if bundle else [
                    "PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING"
                ],
                "source_refs": (
                    bundle["source_refs"] if bundle else [f"data/analysis/gateway_bff_surfaces.json#{route_family_ref}"]
                ),
            }
            route_publications.append(publication_row)

        service_state = aggregate_service_state(per_service_route_states)
        service_state_counts[service_state] += 1
        publication_state = (
            "published"
            if service_state == "published"
            else "degraded"
            if service_state == "degraded"
            else "blocked_partial"
        )

        service_row = {
            "gatewayServiceRef": service_def["gateway_service_ref"],
            "serviceLabel": service_def["service_label"],
            "audienceFamily": service_def["audience_family"],
            "shellSlug": service_def["shell_slug"],
            "gatewaySurfaceRefs": service_def["gateway_surface_refs"],
            "routeFamilyRefs": route_family_refs,
            "surfaceCount": len(service_def["gateway_surface_refs"]),
            "routeCount": len(route_family_refs),
            "channelProfiles": channel_profiles,
            "sessionPolicyRefs": session_policy_refs,
            "tenantIsolationModes": tenant_isolation_modes,
            "allowedDownstreamWorkloadFamilyRefs": allowed_downstream,
            "prohibitedDownstreamClasses": ["adapter_egress", "raw_data_plane"],
            "trustZoneBoundaryRefs": trust_boundary_refs,
            "frontendContractManifestRefs": frontend_manifest_refs,
            "audienceSurfaceRuntimeBindingRefs": runtime_binding_refs,
            "runtimePublicationBundleRefs": runtime_publication_bundle_refs,
            "requiredAssuranceSliceRefs": assurance_slice_refs,
            "entrypointBasePath": service_def["entrypoint_base_path"],
            "authorityEndpointPath": "/authority/surfaces",
            "openApiEndpointPath": "/authority/openapi",
            "evaluationEndpointPath": "/authority/evaluate",
            "combinedSurfaceJustification": service_def["combined_surface_justification"],
            "authorityState": service_state,
            "publicationState": publication_state,
            "openApiPublicationRef": f"openapi::{service_def['gateway_service_ref']}::v1",
            "deploymentDescriptorRef": f"deploy::{service_def['gateway_service_ref']}",
            "localBootstrapRef": f"bootstrap::{service_def['gateway_service_ref']}",
            "source_refs": service_def["source_refs"],
        }
        gateway_service_rows.append(service_row)

        deployment_descriptors.append(
            {
                "deploymentDescriptorRef": service_row["deploymentDescriptorRef"],
                "gatewayServiceRef": service_def["gateway_service_ref"],
                "serviceModulePath": "services/api-gateway",
                "runtimeEntrypoint": "services/api-gateway/src/index.ts",
                "servicePortEnvKey": "API_GATEWAY_SERVICE_PORT",
                "adminPortEnvKey": "API_GATEWAY_ADMIN_PORT",
                "entrypointBasePath": service_def["entrypoint_base_path"],
                "healthPath": "/health",
                "manifestPath": f"/authority/surfaces?gatewayServiceRef={service_def['gateway_service_ref']}",
                "openApiPath": f"/authority/openapi?gatewayServiceRef={service_def['gateway_service_ref']}",
                "evaluationPath": "/authority/evaluate",
                "localBaseUrl": f"http://127.0.0.1:7100{service_def['entrypoint_base_path']}",
                "ciBasePath": f"/preview{service_def['entrypoint_base_path']}",
                "requiredSecretRefs": [
                    "AUTH_EDGE_SESSION_SECRET_REF",
                    "AUTH_EDGE_SIGNING_KEY_REF",
                ],
                "source_refs": service_def["source_refs"],
            }
        )

        local_bootstrap_rows.append(
            {
                "localBootstrapRef": service_row["localBootstrapRef"],
                "gatewayServiceRef": service_def["gateway_service_ref"],
                "startupCommand": "pnpm --filter @vecells/api-gateway dev",
                "projectionSeedRefs": service_def["seed_projection_refs"],
                "simulatorBackplaneRefs": service_def["simulator_backplane_refs"],
                "serviceBasePath": service_def["entrypoint_base_path"],
                "healthPath": "/health",
                "source_refs": service_def["source_refs"],
            }
        )

        for surface in service_surfaces:
            surface_frontend_manifest = frontend_manifest_by_surface.get(surface["surfaceId"])
            surface_runtime_binding = runtime_binding_by_surface.get(surface["surfaceId"])
            surface_publication = surface_publication_by_surface.get(surface["surfaceId"])
            surface_route_states = [
                route_state_from_bundle(route_bundle_by_ref.get(route_family_ref))
                for route_family_ref in surface["routeFamilies"]
            ]
            surface_state = max_state(surface_route_states, SERVICE_STATE_ORDER)
            gateway_surface_rows.append(
                {
                    "surfaceId": surface["surfaceId"],
                    "gatewayServiceRef": service_def["gateway_service_ref"],
                    "surfaceName": surface["surfaceName"],
                    "audience": surface["audience"],
                    "audienceSurfaceRef": surface["audienceSurfaceRef"],
                    "candidateGroupId": surface["candidateGroupId"],
                    "shellType": surface["shellType"],
                    "channelProfile": surface["channelProfile"],
                    "routeFamilyRefs": surface["routeFamilies"],
                    "servedBoundedContextRefs": surface["servedBoundedContextRefs"],
                    "mutatingBoundedContextRefs": surface["mutatingBoundedContextRefs"],
                    "allowedDownstreamWorkloadFamilyRefs": surface["downstreamWorkloadFamilyRefs"],
                    "trustZoneBoundaryRefs": surface["trustZoneBoundaryRefs"],
                    "trustZoneRefs": surface["trustZoneRefs"],
                    "tenantIsolationMode": surface["tenantIsolationMode"],
                    "tenantScopeMode": surface["tenantScopeMode"],
                    "sessionPolicyRef": surface["sessionPolicyRef"],
                    "cachePolicyRef": surface["cachePolicyRef"],
                    "openApiRef": surface["openApiRef"],
                    "requiredAssuranceSliceRefs": surface["requiredAssuranceSliceRefs"],
                    "frontendContractManifestRef": (
                        surface_frontend_manifest["frontendContractManifestId"]
                        if surface_frontend_manifest
                        else None
                    ),
                    "audienceSurfaceRuntimeBindingRef": (
                        surface_runtime_binding["audienceSurfaceRuntimeBindingId"]
                        if surface_runtime_binding
                        else None
                    ),
                    "surfacePublicationRef": (
                        surface_publication["audienceSurfacePublicationRef"]
                        if surface_publication
                        else None
                    ),
                    "runtimePublicationBundleRef": (
                        surface_runtime_binding["runtimePublicationBundleRef"]
                        if surface_runtime_binding
                        else surface["runtimePublicationBundleRef"]
                    ),
                    "authorityState": surface_state,
                    "publicationState": (
                        "published"
                        if surface_state == "published"
                        else "degraded"
                        if surface_state == "degraded"
                        else "blocked"
                    ),
                    "surfaceAuthorityTupleHash": surface["surfaceAuthorityTupleHash"],
                    "source_refs": surface["source_refs"],
                    "rationale": surface["rationale"],
                }
            )

            for route_row in route_ownership_by_ref:
                pass

            ingress_boundary = next(
                (
                    ref
                    for ref in surface["trustZoneBoundaryRefs"]
                    if ref == "tzb_public_edge_to_published_gateway"
                ),
                None,
            )
            if ingress_boundary:
                trust_boundary = trust_boundary_by_id[ingress_boundary]
                boundary_matrix_rows.append(
                    {
                        "gateway_service_ref": service_def["gateway_service_ref"],
                        "gateway_surface_ref": surface["surfaceId"],
                        "route_family_refs": "; ".join(surface["routeFamilies"]),
                        "boundary_scope": "browser_ingress",
                        "downstream_workload_family_ref": "",
                        "trust_zone_boundary_ref": ingress_boundary,
                        "boundary_rule_ref": "",
                        "boundary_state": trust_boundary["boundaryState"],
                        "allowed_protocol_refs": "; ".join(trust_boundary["allowedProtocolRefs"]),
                        "tenant_transfer_mode": trust_boundary["tenantTransferMode"],
                        "assurance_trust_transfer_mode": trust_boundary[
                            "assuranceTrustTransferMode"
                        ],
                        "adapter_egress_allowed": "no",
                        "raw_data_plane_access_allowed": "no",
                    }
                )

            application_boundary = next(
                (
                    ref
                    for ref in surface["trustZoneBoundaryRefs"]
                    if ref == "tzb_published_gateway_to_application_core"
                ),
                None,
            )
            assurance_boundary = next(
                (
                    ref
                    for ref in surface["trustZoneBoundaryRefs"]
                    if ref == "tzb_published_gateway_to_assurance_security"
                ),
                None,
            )
            for workload_ref in surface["downstreamWorkloadFamilyRefs"]:
                boundary_ref = (
                    assurance_boundary
                    if workload_ref == "wf_assurance_security_control"
                    else application_boundary
                )
                trust_boundary = trust_boundary_by_id[boundary_ref] if boundary_ref else None
                boundary_matrix_rows.append(
                    {
                        "gateway_service_ref": service_def["gateway_service_ref"],
                        "gateway_surface_ref": surface["surfaceId"],
                        "route_family_refs": "; ".join(surface["routeFamilies"]),
                        "boundary_scope": "declared_downstream",
                        "downstream_workload_family_ref": workload_ref,
                        "trust_zone_boundary_ref": boundary_ref or "",
                        "boundary_rule_ref": "",
                        "boundary_state": trust_boundary["boundaryState"] if trust_boundary else "allowed",
                        "allowed_protocol_refs": (
                            "; ".join(trust_boundary["allowedProtocolRefs"])
                            if trust_boundary
                            else ""
                        ),
                        "tenant_transfer_mode": (
                            trust_boundary["tenantTransferMode"]
                            if trust_boundary
                            else "tenant_tuple_and_route_intent_preserved"
                        ),
                        "assurance_trust_transfer_mode": (
                            trust_boundary["assuranceTrustTransferMode"]
                            if trust_boundary
                            else "bounded"
                        ),
                        "adapter_egress_allowed": "no",
                        "raw_data_plane_access_allowed": "no",
                    }
                )

            for blocked_class, blocked_rule_ref in [
                ("adapter_egress", "GR_090_NO_DIRECT_ADAPTER_EGRESS"),
                ("raw_data_plane", "GR_090_NO_RAW_DATA_PLANE_ACCESS"),
            ]:
                boundary_matrix_rows.append(
                    {
                        "gateway_service_ref": service_def["gateway_service_ref"],
                        "gateway_surface_ref": surface["surfaceId"],
                        "route_family_refs": "; ".join(surface["routeFamilies"]),
                        "boundary_scope": "forbidden_boundary",
                        "downstream_workload_family_ref": blocked_class,
                        "trust_zone_boundary_ref": "",
                        "boundary_rule_ref": blocked_rule_ref,
                        "boundary_state": "blocked",
                        "allowed_protocol_refs": "",
                        "tenant_transfer_mode": "forbidden",
                        "assurance_trust_transfer_mode": "forbidden",
                        "adapter_egress_allowed": "no",
                        "raw_data_plane_access_allowed": "no",
                    }
                )

    for row in route_ownership_rows:
        route_bundle = route_bundle_by_ref.get(row["route_family_id"])
        route_matrix_rows.append(
            {
                "gateway_service_ref": next(
                    service_row["gatewayServiceRef"]
                    for service_row in gateway_service_rows
                    if row["gateway_surface_id"] in service_row["gatewaySurfaceRefs"]
                ),
                "route_family_ref": row["route_family_id"],
                "route_family_label": row["route_family"],
                "gateway_surface_ref": row["gateway_surface_id"],
                "primary_gateway_surface_ref": row["primary_gateway_surface_id"],
                "ownership_role": row["ownership_role"],
                "audience_surface_ref": row["audience_surface_ref"],
                "audience": row["audience"],
                "shell_type": row["shell_type"],
                "channel_profile": surface_by_id[row["gateway_surface_id"]]["channelProfile"],
                "browser_visible": row["browser_visible"],
                "session_policy_ref": row["session_policy_ref"],
                "tenant_isolation_mode": row["tenant_isolation_mode"],
                "publication_state": publication_state_for_route(route_bundle),
                "route_state": route_state_from_bundle(route_bundle),
                "downstream_workload_family_refs": row["downstream_workload_family_refs"],
                "trust_zone_boundary_refs": row["trust_zone_boundary_refs"],
                "explicit_exception_ref": row["explicit_exception_ref"],
                "explicit_exception_reason": row["explicit_exception_reason"],
            }
        )

    relevant_gaps = [
        {
            **registry_gap_by_id[gap_id],
            "source_refs": registry_gap_by_id[gap_id]["source_refs"],
        }
        for gap_id in sorted(gap_id for gap_id in relevant_gap_ids if gap_id in registry_gap_by_id)
    ]
    relevant_gaps.append(
        {
            "gapId": "PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING",
            "gapKind": "route_bundle_missing",
            "routeFamilyRef": "rf_assistive_control_shell",
            "contractFamily": "GatewayBffSurface",
            "contractRef": "gws_assistive_sidecar",
            "missingRequirementRef": "routeFamilyBundle::rf_assistive_control_shell",
            "resolution": (
                "Keep the assistive sidecar bound to the clinical workspace gateway service now, "
                "but block browser publication until the later frontend and publication tracks emit "
                "the missing route bundle, cache policy, and live-channel contract rows."
            ),
            "source_refs": [
                "prompt/090.md",
                "data/analysis/gateway_bff_surfaces.json#gws_assistive_sidecar",
                "data/analysis/api_contract_registry_manifest.json",
            ],
        }
    )

    refusal_policies = [
        {
            "refusalPolicyRef": "RP_090_UNDECLARED_ROUTE",
            "errorCode": "GATEWAY_ROUTE_UNDECLARED",
            "httpStatus": 403,
            "ruleSummary": "Gateway services reject any route family not published on the selected audience boundary.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_UNDECLARED_DOWNSTREAM",
            "errorCode": "DOWNSTREAM_WORKLOAD_FAMILY_FORBIDDEN",
            "httpStatus": 403,
            "ruleSummary": "Gateway services may access only declared command, projection, or assurance workload families.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-runtime-and-release-blueprint.md#Runtime rules",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_DIRECT_ADAPTER_EGRESS",
            "errorCode": "DIRECT_ADAPTER_EGRESS_FORBIDDEN",
            "httpStatus": 403,
            "ruleSummary": "Browser-facing gateway surfaces never call partner adapters directly.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/forensic-audit-findings.md#Finding 86",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_RAW_DATA_PLANE_ACCESS",
            "errorCode": "RAW_DATA_PLANE_ACCESS_FORBIDDEN",
            "httpStatus": 403,
            "ruleSummary": "Gateway services never expose raw transactional, FHIR, object, or audit data planes.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/forensic-audit-findings.md#Finding 87",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_UNDECLARED_STREAM",
            "errorCode": "LIVE_CHANNEL_UNDECLARED",
            "httpStatus": 409,
            "ruleSummary": "Undeclared live channels fail closed rather than implying freshness or writable posture.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_UNDECLARED_CACHE",
            "errorCode": "CACHE_POLICY_UNDECLARED",
            "httpStatus": 409,
            "ruleSummary": "Gateway cache semantics must resolve to a published ClientCachePolicy row.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_SESSION_POLICY_MISMATCH",
            "errorCode": "SESSION_POLICY_MISMATCH",
            "httpStatus": 403,
            "ruleSummary": "A route may execute only under the session policy published on its gateway surface.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
            ],
        },
        {
            "refusalPolicyRef": "RP_090_PUBLICATION_BLOCKED",
            "errorCode": "SURFACE_PUBLICATION_BLOCKED",
            "httpStatus": 409,
            "ruleSummary": "Blocked or missing route publications degrade or block the gateway surface instead of remaining calm.",
            "source_refs": [
                "prompt/090.md",
                "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
            ],
        },
    ]

    manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Provision audience-specific gateway and BFF runtime authority so browser traffic reaches "
            "only declared route families, session policies, cache semantics, and downstream "
            "workload boundaries."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            "data/analysis/gateway_bff_surfaces.json",
            "data/analysis/frontend_contract_manifests.json",
            "data/analysis/api_contract_registry_manifest.json",
            "data/analysis/runtime_topology_manifest.json",
            "data/analysis/trust_zone_boundaries.json",
        ],
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "gateway_service_count": len(gateway_service_rows),
            "gateway_surface_count": len(gateway_surface_rows),
            "route_publication_count": len(route_publications),
            "deployment_descriptor_count": len(deployment_descriptors),
            "local_bootstrap_count": len(local_bootstrap_rows),
            "published_service_count": service_state_counts["published"],
            "degraded_service_count": service_state_counts["degraded"],
            "blocked_service_count": service_state_counts["blocked"],
            "published_route_count": route_state_counts["published"],
            "degraded_route_count": route_state_counts["degraded"],
            "blocked_route_count": route_state_counts["blocked"],
            "route_matrix_row_count": len(route_matrix_rows),
            "boundary_matrix_row_count": len(boundary_matrix_rows),
            "parallel_interface_gap_count": len(relevant_gaps),
            "refusal_policy_count": len(refusal_policies),
        },
        "gateway_services": gateway_service_rows,
        "gateway_surfaces": gateway_surface_rows,
        "route_publications": sorted(
            route_publications,
            key=lambda row: (
                SERVICE_ORDER[row["gatewayServiceRef"]],
                row["routeFamilyRef"],
            ),
        ),
        "deployment_descriptors": deployment_descriptors,
        "local_bootstrap": local_bootstrap_rows,
        "boundary_rows": boundary_matrix_rows,
        "route_matrix_rows": route_matrix_rows,
        "refusal_policies": refusal_policies,
        "parallel_interface_gaps": relevant_gaps,
    }
    manifest["manifest_digest_ref"] = f"gateway-surface-manifest::{stable_hash([manifest['summary'], gateway_service_rows])}"

    runtime_topology["gateway_surface_manifest_ref"] = "data/analysis/gateway_surface_manifest.json"
    runtime_topology["audience_route_family_to_gateway_matrix_ref"] = (
        "data/analysis/audience_route_family_to_gateway_matrix.csv"
    )
    runtime_topology["gateway_downstream_boundary_matrix_ref"] = (
        "data/analysis/gateway_downstream_boundary_matrix.csv"
    )

    write_json(OUTPUT_MANIFEST_PATH, manifest)
    write_csv(
        OUTPUT_ROUTE_MATRIX_PATH,
        route_matrix_rows,
        [
            "gateway_service_ref",
            "route_family_ref",
            "route_family_label",
            "gateway_surface_ref",
            "primary_gateway_surface_ref",
            "ownership_role",
            "audience_surface_ref",
            "audience",
            "shell_type",
            "channel_profile",
            "browser_visible",
            "session_policy_ref",
            "tenant_isolation_mode",
            "publication_state",
            "route_state",
            "downstream_workload_family_refs",
            "trust_zone_boundary_refs",
            "explicit_exception_ref",
            "explicit_exception_reason",
        ],
    )
    write_csv(
        OUTPUT_BOUNDARY_MATRIX_PATH,
        boundary_matrix_rows,
        [
            "gateway_service_ref",
            "gateway_surface_ref",
            "route_family_refs",
            "boundary_scope",
            "downstream_workload_family_ref",
            "trust_zone_boundary_ref",
            "boundary_rule_ref",
            "boundary_state",
            "allowed_protocol_refs",
            "tenant_transfer_mode",
            "assurance_trust_transfer_mode",
            "adapter_egress_allowed",
            "raw_data_plane_access_allowed",
        ],
    )
    write_json(RUNTIME_TOPOLOGY_PATH, runtime_topology)
    return manifest


def ensure_gateway_service_definition() -> None:
    source = SERVICE_DEFINITION_PATH.read_text(encoding="utf-8")

    route_block = (
        dedent(
            """
                {
                  routeId: "get_gateway_surface_authority",
                  method: "GET",
                  path: "/authority/surfaces",
                  contractFamily: "GatewaySurfaceAuthorityManifest",
                  purpose:
                    "Expose audience-scoped gateway services, route publications, refusal policy, and downstream boundary posture.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
                {
                  routeId: "get_gateway_surface_openapi",
                  method: "GET",
                  path: "/authority/openapi",
                  contractFamily: "GatewaySurfaceOpenApiPublication",
                  purpose:
                    "Publish audience-scoped OpenAPI documents for declared browser-callable route families without implying undeclared handlers.",
                  bodyRequired: false,
                  idempotencyRequired: false,
                },
                {
                  routeId: "evaluate_gateway_surface_authority",
                  method: "POST",
                  path: "/authority/evaluate",
                  contractFamily: "GatewaySurfaceAuthorityEvaluation",
                  purpose:
                    "Evaluate whether a route family, contract, cache posture, or downstream boundary request is explicitly permitted.",
                  bodyRequired: true,
                  idempotencyRequired: false,
                },
            """
        ).rstrip()
        + "\n\n"
    )
    if 'path: "/authority/surfaces"' not in source:
        source = insert_before_enclosing_brace(
            source,
            'routeId: "get_api_contract_registry"',
            route_block,
            "PREREQUISITE_GAP_090_GATEWAY_ROUTE_INSERT_ANCHOR",
        )

    readiness_block = (
        dedent(
            """
                {
                  name: "gateway_surface_authority",
                  detail:
                    "Audience-specific gateway authority manifests, refusal policies, and OpenAPI publications remain explicit before browser traffic is served.",
                  failureMode:
                    "Fail closed to declared authority lookup errors instead of inferring surface or downstream access from base paths.",
                },
            """
        ).rstrip()
        + "\n\n"
    )
    if 'name: "gateway_surface_authority"' not in source:
        source = insert_before_enclosing_brace(
            source,
            'name: "api_contract_registry"',
            readiness_block,
            "PREREQUISITE_GAP_090_GATEWAY_READINESS_INSERT_ANCHOR",
        )

    if '"tests/gateway-surface-authority.integration.test.js"' not in source:
        source = insert_after_token(
            source,
            '"tests/runtime.integration.test.js"',
            ',\n  "tests/gateway-surface-authority.integration.test.js"',
            "PREREQUISITE_GAP_090_GATEWAY_TEST_HARNESS_ANCHOR",
        )

    write_text(SERVICE_DEFINITION_PATH, source)


def ensure_gateway_runtime() -> None:
    source = SERVICE_RUNTIME_PATH.read_text(encoding="utf-8")

    import_block = dedent(
        """
        import {
          buildGatewaySurfaceAuthorityResponse,
          buildGatewaySurfaceEvaluationResponse,
          buildGatewaySurfaceOpenApiResponse,
        } from "./gateway-surface-authority";
        """
    )
    if 'from "./gateway-surface-authority";' not in source:
        source = replace_once(
            source,
            'import { buildApiContractRegistryResponse } from "./api-contract-registry";\n',
            'import { buildApiContractRegistryResponse } from "./api-contract-registry";\n'
            + import_block,
            "PREREQUISITE_GAP_090_GATEWAY_RUNTIME_IMPORT_ANCHOR",
        )

    if 'const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");' not in source:
        source = replace_once(
            source,
            '        const method = request.method?.toUpperCase() ?? "GET";\n        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;\n',
            '        const method = request.method?.toUpperCase() ?? "GET";\n'
            '        const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");\n'
            '        const pathname = requestUrl.pathname;\n',
            "PREREQUISITE_GAP_090_GATEWAY_RUNTIME_REQUEST_URL_ANCHOR",
        )

    handler_block = (
        dedent(
            """
                      if (route.routeId === "get_gateway_surface_authority") {
                        const payload = buildGatewaySurfaceAuthorityResponse(requestUrl.searchParams);
                        logger.info("service_request_completed", {
                          routeId: route.routeId,
                          correlationId,
                          traceId,
                          edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
                          causalToken: edgeCorrelation.causalToken,
                          statusCode: payload.statusCode,
                        });
                        respondJson(
                          response,
                          payload.statusCode,
                          correlationId,
                          traceId,
                          edgeCorrelation,
                          payload.body,
                        );
                        return;
                      }

                      if (route.routeId === "get_gateway_surface_openapi") {
                        const payload = buildGatewaySurfaceOpenApiResponse(requestUrl.searchParams);
                        logger.info("service_request_completed", {
                          routeId: route.routeId,
                          correlationId,
                          traceId,
                          edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
                          causalToken: edgeCorrelation.causalToken,
                          statusCode: payload.statusCode,
                        });
                        respondJson(
                          response,
                          payload.statusCode,
                          correlationId,
                          traceId,
                          edgeCorrelation,
                          payload.body,
                        );
                        return;
                      }

                      if (route.routeId === "evaluate_gateway_surface_authority") {
                        const payload = buildGatewaySurfaceEvaluationResponse(requestBody);
                        logger.info("service_request_completed", {
                          routeId: route.routeId,
                          correlationId,
                          traceId,
                          edgeCorrelationId: edgeCorrelation.edgeCorrelationId,
                          causalToken: edgeCorrelation.causalToken,
                          statusCode: payload.statusCode,
                        });
                        respondJson(
                          response,
                          payload.statusCode,
                          correlationId,
                          traceId,
                          edgeCorrelation,
                          payload.body,
                        );
                        return;
                      }
            """
        ).rstrip()
        + "\n\n"
    )
    if 'route.routeId === "get_gateway_surface_authority"' not in source:
        source = insert_before_token(
            source,
            'if (route.routeId === "get_cache_live_transport_baseline")',
            handler_block,
            "PREREQUISITE_GAP_090_GATEWAY_RUNTIME_HANDLER_ANCHOR",
        )

    write_text(SERVICE_RUNTIME_PATH, source)


def ensure_gateway_readme() -> None:
    source = SERVICE_README_PATH.read_text(encoding="utf-8")

    route_rows = (
        '| `GET` | `/authority/surfaces` | `GatewaySurfaceAuthorityManifest` | Expose audience-scoped gateway services, route publications, refusal policy, and downstream boundary posture. |\n'
        '| `GET` | `/authority/openapi` | `GatewaySurfaceOpenApiPublication` | Publish audience-scoped OpenAPI documents for declared browser-callable route families without implying undeclared handlers. |\n'
        '| `POST` | `/authority/evaluate` | `GatewaySurfaceAuthorityEvaluation` | Evaluate whether a route family, contract, cache posture, or downstream boundary request is explicitly permitted. |\n'
    )
    if "/authority/surfaces" not in source:
        source = insert_after_token(
            source,
            '| `GET` | `/ingress/release-awareness` | `ReleaseGateEvidence` | Expose release ring, publication watch, and route-freeze awareness hooks. |',
            "\n" + route_rows.rstrip("\n"),
            "PREREQUISITE_GAP_090_GATEWAY_README_ROUTE_ANCHOR",
        )

    if "gateway-surface-authority.integration.test.js" not in source:
        source = insert_after_token(
            source,
            "- `integration`: `services/api-gateway/tests/runtime.integration.test.js`",
            "\n- `integration`: `services/api-gateway/tests/gateway-surface-authority.integration.test.js`",
            "PREREQUISITE_GAP_090_GATEWAY_README_TEST_ANCHOR",
        )

    write_text(SERVICE_README_PATH, source)


def main() -> None:
    build_manifest()
    ensure_gateway_service_definition()
    ensure_gateway_runtime()
    ensure_gateway_readme()


if __name__ == "__main__":
    main()
