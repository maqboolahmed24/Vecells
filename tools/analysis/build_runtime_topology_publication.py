#!/usr/bin/env python3
from __future__ import annotations

import copy
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_DIR = ROOT / "packages" / "release-controls" / "src"

TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_PATH = DATA_DIR / "gateway_surface_manifest.json"
FRONTEND_PATH = DATA_DIR / "frontend_contract_manifests.json"
PUBLICATION_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_PATH = DATA_DIR / "release_publication_parity_records.json"
DESIGN_PATH = DATA_DIR / "design_contract_publication_bundles.json"

MATRIX_PATH = DATA_DIR / "runtime_topology_publication_matrix.csv"
DRIFT_CATALOG_PATH = DATA_DIR / "runtime_topology_drift_catalog.json"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_publication_matrix.json"
CATALOG_TS_PATH = PACKAGE_DIR / "runtime-topology-publication.catalog.ts"

TASK_ID = "par_099"
CAPTURED_ON = "2026-04-13"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
VISUAL_MODE = "Runtime_Topology_Publication_Atlas"
MISSION = (
    "Publish one fail-closed runtime topology publication graph so bundles, parity, gateway "
    "surfaces, frontend manifests, and design/runtime bindings can drift only as explicit blocked findings."
)
SOURCE_PRECEDENCE = [
    "prompt/099.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder and pipeline rules",
    "blueprint/phase-0-the-foundation-protocol.md#Trust zones and tenant isolation",
    "blueprint/phase-0-the-foundation-protocol.md#Route-intent and freeze law",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 114",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_surface_manifest.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
]
GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_TOPOLOGY_ARTIFACT_RUNTIME_PUBLICATION_MATRIX_V1",
        "summary": (
            "par_099 generates one publication matrix that resolves topology, gateway, frontend, "
            "surface-binding, and design-bundle tuples from the current repo state instead of leaving "
            "those relations implied across separate earlier tasks."
        ),
    },
    {
        "gapId": "GAP_RESOLUTION_TOPOLOGY_ARTIFACT_DESIGN_TOPOLOGY_BINDING_V1",
        "summary": (
            "Design publication bundles did not previously carry a topology-publication seam, so par_099 "
            "adds a machine-checkable derived binding row without changing seq_052 bundle identity."
        ),
    },
]
FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_PARITY_SURFACE_GOVERNANCE_COCKPIT_V1",
        "title": "Later governance surfaces may present richer parity and publication detail",
        "bounded_seam": (
            "par_099 publishes the machine-readable topology-publication graph and drift findings now. "
            "Later UI tasks may enrich governance presentation without redefining drift law."
        ),
    }
]
DRIFT_CATEGORY_DEFINITIONS = [
    {
        "categoryCode": "MISSING_MANIFEST_BINDING",
        "label": "Missing manifest binding",
        "severity": "error",
        "description": "A bundle, gateway, frontend manifest, binding, publication, or design row points to an object that is absent.",
    },
    {
        "categoryCode": "GATEWAY_TO_UNDECLARED_WORKLOAD",
        "label": "Gateway to undeclared workload",
        "severity": "error",
        "description": "A route or gateway points to a workload family that is not declared by the approved runtime topology tuple.",
    },
    {
        "categoryCode": "UNDECLARED_TRUST_BOUNDARY_CROSSING",
        "label": "Undeclared trust-boundary crossing",
        "severity": "error",
        "description": "A gateway or browser publication points across a trust boundary that is not present in the approved topology tuple.",
    },
    {
        "categoryCode": "TENANT_ISOLATION_MISMATCH",
        "label": "Tenant isolation mismatch",
        "severity": "error",
        "description": "Gateway, route-publication, and bundle rows disagree on tenant-isolation posture for the same surface tuple.",
    },
    {
        "categoryCode": "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "label": "Stale audience-surface runtime binding",
        "severity": "error",
        "description": "Frontend manifests, audience bindings, or surface publications still point at stale or planned runtime-publication bundle refs.",
    },
    {
        "categoryCode": "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE",
        "label": "Design bundle wrong topology tuple",
        "severity": "error",
        "description": "A design publication bundle is bound to the wrong runtime-publication bundle or topology tuple.",
    },
    {
        "categoryCode": "ROUTE_PUBLICATION_WITHDRAWN",
        "label": "Route publication withdrawn",
        "severity": "error",
        "description": "A route publication is blocked or withdrawn while the publication graph still tries to present it as part of the active tuple.",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def stable_digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode("utf-8")).hexdigest()


def unique_sorted(values: list[str] | tuple[str, ...] | set[str]) -> list[str]:
    return sorted(set(values))


def build_graph_inputs() -> dict[str, Any]:
    topology = read_json(TOPOLOGY_PATH)
    gateway = read_json(GATEWAY_PATH)
    frontend = read_json(FRONTEND_PATH)
    publication = read_json(PUBLICATION_PATH)
    parity = read_json(PARITY_PATH)
    design = read_json(DESIGN_PATH)

    local_bundle = next(
        row for row in publication["runtimePublicationBundles"] if row["environmentRing"] == "local"
    )
    local_parity = next(
        row for row in parity["releasePublicationParityRecords"] if row["environmentRing"] == "local"
    )

    design_bundle_by_id = {
        row["designContractPublicationBundleId"]: row for row in design["designContractPublicationBundles"]
    }
    manifest_by_design_ref: dict[str, str] = {}
    for row in frontend["frontendContractManifests"]:
        manifest_by_design_ref.setdefault(
            row["designContractPublicationBundleRef"], row["runtimePublicationBundleRef"]
        )

    actual_graph = {
        "runtimeTopologyManifestRef": local_bundle["runtimeTopologyManifestRef"],
        "runtimePublicationBundleRef": local_bundle["runtimePublicationBundleId"],
        "releasePublicationParityRef": local_parity["publicationParityRecordId"],
        "topologyTupleHash": local_bundle["topologyTupleHash"],
        "bundlePublicationState": local_bundle["publicationState"],
        "parityState": local_parity["parityState"],
        "routeExposureState": local_parity["routeExposureState"],
        "workloadFamilyRefs": local_bundle["workloadFamilyRefs"],
        "trustZoneBoundaryRefs": local_bundle["trustZoneBoundaryRefs"],
        "assuranceSliceRefs": [
            row["assurance_slice_ref"] for row in topology["assurance_slices"]
        ],
        "workloadFamilies": [
            {
                "runtimeWorkloadFamilyRef": row["runtime_workload_family_ref"],
                "trustZoneRef": row["trust_zone_ref"],
                "tenantIsolationMode": row["tenant_isolation_mode"],
                "serviceIdentityRef": row["service_identity_ref"],
                "gatewaySurfaceRefs": row["gateway_surface_refs"],
                "allowedDownstreamWorkloadFamilyRefs": row["allowed_downstream_family_refs"],
            }
            for row in topology["runtime_workload_families"]
        ],
        "trustZoneBoundaries": [
            {
                "boundaryId": row["boundary_id"],
                "sourceTrustZoneRef": row["source_trust_zone_ref"],
                "targetTrustZoneRef": row["target_trust_zone_ref"],
                "sourceWorkloadFamilyRefs": row["source_workload_family_refs"],
                "targetWorkloadFamilyRefs": row["target_workload_family_refs"],
                "allowedIdentityRefs": row["allowed_identity_refs"],
                "allowedDataClassificationRefs": row["allowed_data_classification_refs"],
                "boundaryState": row["boundary_state"],
            }
            for row in topology["trust_zone_boundaries"]
        ],
        "bundleGatewaySurfaceRefs": local_bundle["gatewaySurfaceRefs"],
        "bundleFrontendManifestRefs": local_bundle["frontendContractManifestRefs"],
        "bundleSurfaceRuntimeBindingRefs": local_bundle["surfaceRuntimeBindingRefs"],
        "bundleSurfacePublicationRefs": local_bundle["surfacePublicationRefs"],
        "bundleDesignPublicationRefs": unique_sorted(design_bundle_by_id.keys()),
        "gatewaySurfaces": [
            {
                "gatewaySurfaceId": row["surfaceId"],
                "gatewayServiceRef": row["gatewayServiceRef"],
                "routeFamilyRefs": row["routeFamilyRefs"],
                "allowedDownstreamWorkloadFamilyRefs": row["allowedDownstreamWorkloadFamilyRefs"],
                "trustZoneBoundaryRefs": row["trustZoneBoundaryRefs"],
                "tenantIsolationMode": row["tenantIsolationMode"],
                "requiredAssuranceSliceRefs": row["requiredAssuranceSliceRefs"],
                "frontendContractManifestRef": row["frontendContractManifestRef"],
                "audienceSurfaceRuntimeBindingRef": row["audienceSurfaceRuntimeBindingRef"],
                "surfacePublicationRef": row["surfacePublicationRef"],
                "runtimePublicationBundleRef": row["runtimePublicationBundleRef"],
                "runtimeTopologyManifestRef": local_bundle["runtimeTopologyManifestRef"],
                "publicationState": row["publicationState"],
            }
            for row in gateway["gateway_surfaces"]
        ],
        "routePublications": [
            {
                "routePublicationRef": row["routePublicationRef"],
                "routeFamilyRef": row["routeFamilyRef"],
                "primaryGatewaySurfaceRef": row["primaryGatewaySurfaceRef"],
                "frontendContractManifestRef": row["frontendContractManifestRef"],
                "allowedDownstreamWorkloadFamilyRefs": row["allowedDownstreamWorkloadFamilyRefs"],
                "tenantIsolationMode": row["tenantIsolationMode"],
                "publicationState": row["publicationState"],
            }
            for row in gateway["route_publications"]
        ],
        "frontendManifests": [
            {
                "frontendContractManifestId": row["frontendContractManifestId"],
                "gatewaySurfaceRef": row["gatewaySurfaceRef"],
                "gatewaySurfaceRefs": row["gatewaySurfaceRefs"],
                "routeFamilyRefs": row["routeFamilyRefs"],
                "audienceSurfaceRuntimeBindingRef": row["audienceSurfaceRuntimeBindingRef"],
                "surfacePublicationRef": row["surfacePublicationRef"],
                "runtimePublicationBundleRef": row["runtimePublicationBundleRef"],
                "designContractPublicationBundleRef": row["designContractPublicationBundleRef"],
                "driftState": row["driftState"],
            }
            for row in frontend["frontendContractManifests"]
        ],
        "audienceSurfaceRuntimeBindings": [
            {
                "audienceSurfaceRuntimeBindingId": row["audienceSurfaceRuntimeBindingId"],
                "gatewaySurfaceRefs": row["gatewaySurfaceRefs"],
                "routeFamilyRefs": row["routeFamilyRefs"],
                "surfacePublicationRef": row["surfacePublicationRef"],
                "runtimePublicationBundleRef": row["runtimePublicationBundleRef"],
                "designContractPublicationBundleRef": row["designContractPublicationBundleRef"],
                "bindingState": row["bindingState"],
            }
            for row in frontend["audienceSurfaceRuntimeBindings"]
        ],
        "surfacePublications": [
            {
                "audienceSurfacePublicationRef": row["audienceSurfacePublicationRef"],
                "gatewaySurfaceRefs": row["gatewaySurfaceRefs"],
                "routeFamilyRefs": row["routeFamilyRefs"],
                "designContractPublicationBundleRef": row["designContractPublicationBundleRef"],
                "runtimePublicationBundleRef": row["runtimePublicationBundleRef"],
                "publicationState": row["publicationState"],
            }
            for row in frontend["surfacePublications"]
        ],
        "designContractPublicationBundles": [
            {
                "designContractPublicationBundleId": row["designContractPublicationBundleId"],
                "routeFamilyRefs": row["routeFamilyRefs"],
                "runtimePublicationBundleRef": manifest_by_design_ref.get(
                    row["designContractPublicationBundleId"], "UNBOUND_RUNTIME_PUBLICATION"
                ),
                "topologyTupleHash": local_bundle["topologyTupleHash"],
                "publicationState": row["publicationState"],
            }
            for row in design["designContractPublicationBundles"]
        ],
    }
    return {
        "topology": topology,
        "gateway": gateway,
        "frontend": frontend,
        "design": design,
        "publication": publication,
        "parity": parity,
        "local_bundle": local_bundle,
        "local_parity": local_parity,
        "actual_graph": actual_graph,
    }


def make_clean_graph_for_environment(
    actual_graph: dict[str, Any],
    runtime_bundle_ref: str,
    release_parity_ref: str,
    topology_tuple_hash: str,
    runtime_topology_manifest_ref: str,
) -> dict[str, Any]:
    graph = copy.deepcopy(actual_graph)
    topology_hash = topology_tuple_hash
    assurance_slice_refs = set(graph["assuranceSliceRefs"])
    for row in graph["gatewaySurfaces"]:
        assurance_slice_refs.update(row["requiredAssuranceSliceRefs"])

    graph["runtimeTopologyManifestRef"] = runtime_topology_manifest_ref
    graph["bundlePublicationState"] = "published"
    graph["parityState"] = "exact"
    graph["routeExposureState"] = "publishable"
    graph["runtimePublicationBundleRef"] = runtime_bundle_ref
    graph["releasePublicationParityRef"] = release_parity_ref
    graph["topologyTupleHash"] = topology_hash
    graph["assuranceSliceRefs"] = unique_sorted(assurance_slice_refs)

    for row in graph["gatewaySurfaces"]:
        row["runtimePublicationBundleRef"] = runtime_bundle_ref
        row["publicationState"] = "published"
        row["runtimeTopologyManifestRef"] = runtime_topology_manifest_ref
    for row in graph["routePublications"]:
        row["publicationState"] = "published_exact"
    for row in graph["frontendManifests"]:
        row["runtimePublicationBundleRef"] = runtime_bundle_ref
        row["driftState"] = "none"
    for row in graph["audienceSurfaceRuntimeBindings"]:
        row["runtimePublicationBundleRef"] = runtime_bundle_ref
        row["bindingState"] = "publishable_live"
    for row in graph["surfacePublications"]:
        row["runtimePublicationBundleRef"] = runtime_bundle_ref
        row["publicationState"] = "published_exact"
    for row in graph["designContractPublicationBundles"]:
        row["runtimePublicationBundleRef"] = runtime_bundle_ref
        row["topologyTupleHash"] = topology_hash
        row["publicationState"] = "published_exact"

    return graph


def add_finding(findings: list[dict[str, Any]], category_code: str, message: str, member_ref: str) -> None:
    findings.append(
        {
            "findingId": f"rtpf::{stable_digest([category_code, member_ref, message])[:16]}",
            "categoryCode": category_code,
            "severity": next(
                row["severity"]
                for row in DRIFT_CATEGORY_DEFINITIONS
                if row["categoryCode"] == category_code
            ),
            "message": message,
            "memberRef": member_ref,
        }
    )


def evaluate_graph(graph: dict[str, Any]) -> dict[str, Any]:
    findings: list[dict[str, Any]] = []
    gateway_by_id = {row["gatewaySurfaceId"]: row for row in graph["gatewaySurfaces"]}
    route_by_ref = {row["routePublicationRef"]: row for row in graph["routePublications"]}
    manifest_by_id = {row["frontendContractManifestId"]: row for row in graph["frontendManifests"]}
    binding_by_id = {
        row["audienceSurfaceRuntimeBindingId"]: row
        for row in graph["audienceSurfaceRuntimeBindings"]
    }
    publication_by_id = {
        row["audienceSurfacePublicationRef"]: row for row in graph["surfacePublications"]
    }
    design_by_id = {
        row["designContractPublicationBundleId"]: row
        for row in graph["designContractPublicationBundles"]
    }
    workload_by_ref = {
        row["runtimeWorkloadFamilyRef"]: row for row in graph["workloadFamilies"]
    }
    boundary_by_id = {row["boundaryId"]: row for row in graph["trustZoneBoundaries"]}
    assurance_slice_refs = set(graph["assuranceSliceRefs"])

    workload_refs = set(graph["workloadFamilyRefs"])
    trust_boundary_refs = set(graph["trustZoneBoundaryRefs"])
    runtime_bundle_ref = graph["runtimePublicationBundleRef"]

    for ref in graph["bundleGatewaySurfaceRefs"]:
        if ref not in gateway_by_id:
            add_finding(findings, "MISSING_MANIFEST_BINDING", "Bundle gateway surface ref is missing.", ref)
    for ref in graph["bundleFrontendManifestRefs"]:
        if ref not in manifest_by_id:
            add_finding(findings, "MISSING_MANIFEST_BINDING", "Bundle frontend manifest ref is missing.", ref)
    for ref in graph["bundleSurfaceRuntimeBindingRefs"]:
        if ref not in binding_by_id:
            add_finding(findings, "MISSING_MANIFEST_BINDING", "Bundle surface runtime binding ref is missing.", ref)
    for ref in graph["bundleSurfacePublicationRefs"]:
        if ref not in publication_by_id:
            add_finding(findings, "MISSING_MANIFEST_BINDING", "Bundle surface publication ref is missing.", ref)
    for ref in graph["bundleDesignPublicationRefs"]:
        if ref not in design_by_id:
            add_finding(findings, "MISSING_MANIFEST_BINDING", "Bundle design publication bundle ref is missing.", ref)

    for row in graph["gatewaySurfaces"]:
        if row["runtimePublicationBundleRef"] != runtime_bundle_ref:
            add_finding(
                findings,
                "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
                "Gateway surface points at a stale runtime-publication bundle ref.",
                row["gatewaySurfaceId"],
            )
        if row["runtimeTopologyManifestRef"] != graph["runtimeTopologyManifestRef"]:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Gateway surface points at a stale runtime topology manifest ref.",
                row["gatewaySurfaceId"],
            )
        for workload_ref in row["allowedDownstreamWorkloadFamilyRefs"]:
            if workload_ref not in workload_refs:
                add_finding(
                    findings,
                    "GATEWAY_TO_UNDECLARED_WORKLOAD",
                    "Gateway surface reaches an undeclared workload family.",
                    row["gatewaySurfaceId"],
                )
        for boundary_ref in row["trustZoneBoundaryRefs"]:
            if boundary_ref not in trust_boundary_refs:
                add_finding(
                    findings,
                    "UNDECLARED_TRUST_BOUNDARY_CROSSING",
                    "Gateway surface crosses an undeclared trust boundary.",
                    row["gatewaySurfaceId"],
                )
            if boundary_ref not in boundary_by_id:
                add_finding(
                    findings,
                    "MISSING_MANIFEST_BINDING",
                    "Gateway surface references a trust-boundary row that is absent from the topology manifest.",
                    row["gatewaySurfaceId"],
                )
        for assurance_slice_ref in row["requiredAssuranceSliceRefs"]:
            if assurance_slice_ref not in assurance_slice_refs:
                add_finding(
                    findings,
                    "MISSING_MANIFEST_BINDING",
                    "Gateway surface requires an assurance slice that is absent from the topology manifest.",
                    row["gatewaySurfaceId"],
                )
        if row["frontendContractManifestRef"] not in manifest_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Gateway surface points at a missing frontend manifest.",
                row["gatewaySurfaceId"],
            )
        if row["audienceSurfaceRuntimeBindingRef"] not in binding_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Gateway surface points at a missing audience runtime binding.",
                row["gatewaySurfaceId"],
            )
        if row["surfacePublicationRef"] not in publication_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Gateway surface points at a missing surface publication row.",
                row["gatewaySurfaceId"],
            )
        for workload_ref in row["allowedDownstreamWorkloadFamilyRefs"]:
            workload = workload_by_ref.get(workload_ref)
            if workload is None:
                continue
            matched_boundary = False
            for boundary_ref in row["trustZoneBoundaryRefs"]:
                boundary = boundary_by_id.get(boundary_ref)
                if boundary is None or boundary["boundaryState"] != "allowed":
                    continue
                if workload_ref not in boundary["targetWorkloadFamilyRefs"]:
                    continue
                if workload["serviceIdentityRef"] in boundary["allowedIdentityRefs"]:
                    matched_boundary = True
                    break
            if not matched_boundary:
                add_finding(
                    findings,
                    "UNDECLARED_TRUST_BOUNDARY_CROSSING",
                    "Gateway surface reaches a workload whose service identity is not permitted by the declared trust boundaries.",
                    row["gatewaySurfaceId"],
                )

    for row in graph["routePublications"]:
        gateway_surface = gateway_by_id.get(row["primaryGatewaySurfaceRef"])
        if gateway_surface is None:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Route publication points at a missing gateway surface.",
                row["routePublicationRef"],
            )
        else:
            if row["tenantIsolationMode"] != gateway_surface["tenantIsolationMode"]:
                add_finding(
                    findings,
                    "TENANT_ISOLATION_MISMATCH",
                    "Route publication tenant-isolation mode drifted from the gateway surface.",
                    row["routePublicationRef"],
                )
        for workload_ref in row["allowedDownstreamWorkloadFamilyRefs"]:
            if workload_ref not in workload_refs:
                add_finding(
                    findings,
                    "GATEWAY_TO_UNDECLARED_WORKLOAD",
                    "Route publication reaches an undeclared workload family.",
                    row["routePublicationRef"],
                )
        if row["publicationState"] in {"withdrawn", "blocked", "withdrawn_by_topology_drift"}:
            add_finding(
                findings,
                "ROUTE_PUBLICATION_WITHDRAWN",
                "Route publication is withdrawn or blocked for the active topology tuple.",
                row["routePublicationRef"],
            )
        elif row["publicationState"] not in {"published", "published_exact"}:
            add_finding(
                findings,
                "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
                "Route publication is not in an exact publishable state.",
                row["routePublicationRef"],
            )

    for row in graph["frontendManifests"]:
        if row["runtimePublicationBundleRef"] != runtime_bundle_ref:
            add_finding(
                findings,
                "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
                "Frontend manifest points at a stale runtime-publication bundle ref.",
                row["frontendContractManifestId"],
            )
        if row["gatewaySurfaceRef"] not in gateway_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Frontend manifest points at a missing gateway surface.",
                row["frontendContractManifestId"],
            )
        if row["audienceSurfaceRuntimeBindingRef"] not in binding_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Frontend manifest points at a missing runtime binding.",
                row["frontendContractManifestId"],
            )
        if row["surfacePublicationRef"] not in publication_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Frontend manifest points at a missing surface publication row.",
                row["frontendContractManifestId"],
            )
        if row["designContractPublicationBundleRef"] not in design_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Frontend manifest points at a missing design publication bundle.",
                row["frontendContractManifestId"],
            )
        for ref in row["gatewaySurfaceRefs"]:
            if ref not in gateway_by_id:
                add_finding(
                    findings,
                    "MISSING_MANIFEST_BINDING",
                    "Frontend manifest gateway-surface set contains a missing surface.",
                    row["frontendContractManifestId"],
                )

    for row in graph["audienceSurfaceRuntimeBindings"]:
        if row["runtimePublicationBundleRef"] != runtime_bundle_ref or row["bindingState"] != "publishable_live":
            add_finding(
                findings,
                "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
                "Audience surface runtime binding is not exact for the active runtime tuple.",
                row["audienceSurfaceRuntimeBindingId"],
            )
        if row["surfacePublicationRef"] not in publication_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Audience surface runtime binding points at a missing surface publication row.",
                row["audienceSurfaceRuntimeBindingId"],
            )
        if row["designContractPublicationBundleRef"] not in design_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Audience surface runtime binding points at a missing design publication bundle.",
                row["audienceSurfaceRuntimeBindingId"],
            )
        for ref in row["gatewaySurfaceRefs"]:
            if ref not in gateway_by_id:
                add_finding(
                    findings,
                    "MISSING_MANIFEST_BINDING",
                    "Audience runtime binding gateway-surface set contains a missing surface.",
                    row["audienceSurfaceRuntimeBindingId"],
                )

    for row in graph["surfacePublications"]:
        if row["runtimePublicationBundleRef"] != runtime_bundle_ref or row["publicationState"] != "published_exact":
            add_finding(
                findings,
                "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
                "Audience surface publication is stale or tied to the wrong runtime-publication bundle.",
                row["audienceSurfacePublicationRef"],
            )
        if row["designContractPublicationBundleRef"] not in design_by_id:
            add_finding(
                findings,
                "MISSING_MANIFEST_BINDING",
                "Audience surface publication points at a missing design publication bundle.",
                row["audienceSurfacePublicationRef"],
            )

    for row in graph["designContractPublicationBundles"]:
        if row["runtimePublicationBundleRef"] != runtime_bundle_ref or row["topologyTupleHash"] != graph["topologyTupleHash"]:
            add_finding(
                findings,
                "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE",
                "Design publication bundle is bound to the wrong runtime-publication or topology tuple.",
                row["designContractPublicationBundleId"],
            )

    unique_findings: list[dict[str, Any]] = []
    seen = set()
    for finding in findings:
        key = (finding["categoryCode"], finding["memberRef"])
        if key in seen:
            continue
        seen.add(key)
        unique_findings.append(finding)

    matched_refs = 0
    required_refs = (
        len(graph["bundleGatewaySurfaceRefs"])
        + len(graph["bundleFrontendManifestRefs"])
        + len(graph["bundleSurfaceRuntimeBindingRefs"])
        + len(graph["bundleSurfacePublicationRefs"])
        + len(graph["bundleDesignPublicationRefs"])
    )
    matched_refs += sum(1 for ref in graph["bundleGatewaySurfaceRefs"] if ref in gateway_by_id)
    matched_refs += sum(1 for ref in graph["bundleFrontendManifestRefs"] if ref in manifest_by_id)
    matched_refs += sum(1 for ref in graph["bundleSurfaceRuntimeBindingRefs"] if ref in binding_by_id)
    matched_refs += sum(1 for ref in graph["bundleSurfacePublicationRefs"] if ref in publication_by_id)
    matched_refs += sum(1 for ref in graph["bundleDesignPublicationRefs"] if ref in design_by_id)
    binding_completeness = round(matched_refs / required_refs, 4) if required_refs else 1.0

    blocked_reason_refs = unique_sorted([finding["categoryCode"] for finding in unique_findings])
    publishable = len(unique_findings) == 0

    return {
        "publishable": publishable,
        "publicationEligibilityState": "publishable" if publishable else "blocked",
        "bindingCompleteness": binding_completeness,
        "driftFindingCount": len(unique_findings),
        "blockedReasonRefs": blocked_reason_refs,
        "warningReasonRefs": [],
        "driftFindings": unique_findings,
    }


def build_gateway_surface_matrix(graph: dict[str, Any], verdict: dict[str, Any]) -> dict[str, Any]:
    findings_by_member: dict[str, list[str]] = {}
    for finding in verdict["driftFindings"]:
        findings_by_member.setdefault(finding["memberRef"], []).append(finding["categoryCode"])

    route_by_surface: dict[str, list[dict[str, Any]]] = {}
    for row in graph["routePublications"]:
        route_by_surface.setdefault(row["primaryGatewaySurfaceRef"], []).append(row)

    rows = []
    for surface in graph["gatewaySurfaces"]:
        manifest = next(
            row
            for row in graph["frontendManifests"]
            if row["frontendContractManifestId"] == surface["frontendContractManifestRef"]
        )
        rows.append(
            {
                "gatewaySurfaceId": surface["gatewaySurfaceId"],
                "gatewayServiceRef": surface["gatewayServiceRef"],
                "routeFamilyRefs": surface["routeFamilyRefs"],
                "frontendContractManifestRef": surface["frontendContractManifestRef"],
                "audienceSurfaceRuntimeBindingRef": surface["audienceSurfaceRuntimeBindingRef"],
                "surfacePublicationRef": surface["surfacePublicationRef"],
                "designContractPublicationBundleRef": manifest["designContractPublicationBundleRef"],
                "runtimePublicationBundleRef": surface["runtimePublicationBundleRef"],
                "expectedRuntimePublicationBundleRef": graph["runtimePublicationBundleRef"],
                "tenantIsolationMode": surface["tenantIsolationMode"],
                "trustZoneBoundaryRefs": surface["trustZoneBoundaryRefs"],
                "requiredAssuranceSliceRefs": surface["requiredAssuranceSliceRefs"],
                "routePublicationStates": unique_sorted(
                    [row["publicationState"] for row in route_by_surface.get(surface["gatewaySurfaceId"], [])]
                ),
                "driftCategoryCodes": unique_sorted(
                    findings_by_member.get(surface["gatewaySurfaceId"], [])
                    + findings_by_member.get(surface["frontendContractManifestRef"], [])
                    + findings_by_member.get(surface["audienceSurfaceRuntimeBindingRef"], [])
                    + findings_by_member.get(surface["surfacePublicationRef"], [])
                ),
            }
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "summary": {
            "gateway_surface_count": len(rows),
            "drifted_gateway_surface_count": sum(1 for row in rows if row["driftCategoryCodes"]),
        },
        "gatewaySurfacePublicationRows": rows,
    }


def build_scenario(
    scenario_id: str,
    environment_ring: str,
    title: str,
    description: str,
    graph: dict[str, Any],
) -> dict[str, Any]:
    verdict = evaluate_graph(graph)
    return {
        "scenarioId": scenario_id,
        "environmentRing": environment_ring,
        "title": title,
        "description": description,
        "graph": graph,
        "expected": {
            "publishable": verdict["publishable"],
            "publicationEligibilityState": verdict["publicationEligibilityState"],
            "blockedReasonRefs": verdict["blockedReasonRefs"],
            "driftCategoryCodes": unique_sorted(
                [finding["categoryCode"] for finding in verdict["driftFindings"]]
            ),
            "bindingCompleteness": verdict["bindingCompleteness"],
            "driftFindingCount": verdict["driftFindingCount"],
        },
        "driftFindings": verdict["driftFindings"],
    }


def build_catalog() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    inputs = build_graph_inputs()
    actual_graph = inputs["actual_graph"]
    bundle_by_env = {
        row["environmentRing"]: row for row in inputs["publication"]["runtimePublicationBundles"]
    }
    parity_by_env = {
        row["environmentRing"]: row for row in inputs["parity"]["releasePublicationParityRecords"]
    }

    scenarios: list[dict[str, Any]] = []
    clean_graph_by_env: dict[str, dict[str, Any]] = {}
    for environment_ring, title in [
        ("local", "Local authoritative alignment"),
        ("ci-preview", "CI preview authoritative alignment"),
        ("integration", "Integration authoritative alignment"),
        ("preprod", "Preprod authoritative alignment"),
        ("production", "Production authoritative alignment"),
    ]:
        bundle = bundle_by_env[environment_ring]
        parity = parity_by_env[environment_ring]
        clean_graph = make_clean_graph_for_environment(
            actual_graph,
            bundle["runtimePublicationBundleId"],
            parity["publicationParityRecordId"],
            bundle["topologyTupleHash"],
            bundle["runtimeTopologyManifestRef"],
        )
        clean_graph_by_env[environment_ring] = clean_graph
        scenarios.append(
            build_scenario(
                f"{environment_ring.upper().replace('-', '_')}_AUTHORITATIVE_ALIGNMENT",
                environment_ring,
                title,
                "All bundle, gateway, frontend, design, and route-publication refs are rebound to one exact runtime tuple.",
                clean_graph,
            )
        )

    missing_manifest_graph = copy.deepcopy(clean_graph_by_env["local"])
    missing_manifest_graph["frontendManifests"][0]["audienceSurfaceRuntimeBindingRef"] = "ASRB_MISSING_PUBLIC_ENTRY"
    scenarios.append(
        build_scenario(
            "LOCAL_MISSING_MANIFEST_BINDING",
            "local",
            "Missing manifest binding",
            "A frontend manifest points to a runtime binding row that does not exist in the publication graph.",
            missing_manifest_graph,
        )
    )

    undeclared_workload_graph = copy.deepcopy(clean_graph_by_env["ci-preview"])
    undeclared_workload_graph["routePublications"][0]["allowedDownstreamWorkloadFamilyRefs"] = [
        "wf_projection_read_models",
        "wf_shadow_runtime_family",
    ]
    scenarios.append(
        build_scenario(
            "CI_PREVIEW_GATEWAY_UNDECLARED_WORKLOAD",
            "ci-preview",
            "Gateway to undeclared workload",
            "A route publication widens into a workload family that is not declared by the approved topology tuple.",
            undeclared_workload_graph,
        )
    )

    trust_boundary_graph = copy.deepcopy(clean_graph_by_env["integration"])
    trust_boundary_graph["gatewaySurfaces"][0]["trustZoneBoundaryRefs"] = (
        trust_boundary_graph["gatewaySurfaces"][0]["trustZoneBoundaryRefs"]
        + ["tzb_shadow_browser_to_data"]
    )
    scenarios.append(
        build_scenario(
            "INTEGRATION_UNDECLARED_TRUST_BOUNDARY",
            "integration",
            "Undeclared trust-boundary crossing",
            "A gateway surface reaches across a trust boundary that does not exist in the approved topology tuple.",
            trust_boundary_graph,
        )
    )

    tenant_mismatch_graph = copy.deepcopy(clean_graph_by_env["preprod"])
    tenant_mismatch_graph["routePublications"][0]["tenantIsolationMode"] = "shared_cross_tenant_shadow"
    scenarios.append(
        build_scenario(
            "PREPROD_TENANT_ISOLATION_MISMATCH",
            "preprod",
            "Tenant isolation mismatch",
            "A route publication no longer matches the tenant-isolation mode declared by its primary gateway surface.",
            tenant_mismatch_graph,
        )
    )

    stale_binding_graph = copy.deepcopy(clean_graph_by_env["preprod"])
    stale_binding_graph["frontendManifests"][0]["runtimePublicationBundleRef"] = (
        "rpb::patient_public_entry::planned"
    )
    stale_binding_graph["audienceSurfaceRuntimeBindings"][0]["runtimePublicationBundleRef"] = (
        "rpb::patient_public_entry::planned"
    )
    stale_binding_graph["audienceSurfaceRuntimeBindings"][0]["bindingState"] = "recovery_only"
    stale_binding_graph["surfacePublications"][0]["runtimePublicationBundleRef"] = (
        "rpb::patient_public_entry::planned"
    )
    stale_binding_graph["surfacePublications"][0]["publicationState"] = "stale"
    scenarios.append(
        build_scenario(
            "PREPROD_STALE_AUDIENCE_RUNTIME_BINDING",
            "preprod",
            "Stale audience-surface runtime binding",
            "Browser manifests and surface publications still point at planned publication refs instead of the active runtime tuple.",
            stale_binding_graph,
        )
    )

    design_mismatch_graph = copy.deepcopy(clean_graph_by_env["production"])
    design_mismatch_graph["designContractPublicationBundles"][0]["runtimePublicationBundleRef"] = (
        "rpb::shadow::wrong"
    )
    design_mismatch_graph["designContractPublicationBundles"][0]["topologyTupleHash"] = stable_digest(
        {"wrong": "topology"}
    )
    scenarios.append(
        build_scenario(
            "PRODUCTION_DESIGN_BUNDLE_WRONG_TOPOLOGY",
            "production",
            "Design bundle wrong topology tuple",
            "A design publication bundle is rebound to the wrong runtime-publication bundle and topology hash.",
            design_mismatch_graph,
        )
    )

    withdrawn_route_graph = copy.deepcopy(clean_graph_by_env["production"])
    withdrawn_route_graph["routePublications"][0]["publicationState"] = "withdrawn"
    scenarios.append(
        build_scenario(
            "PRODUCTION_WITHDRAWN_ROUTE_PUBLICATION",
            "production",
            "Withdrawn route publication",
            "One route publication is withdrawn while the bundle still tries to keep the surface in the active publication graph.",
            withdrawn_route_graph,
        )
    )

    current_verdict = evaluate_graph(actual_graph)
    gateway_matrix = build_gateway_surface_matrix(actual_graph, current_verdict)

    current_snapshot = {
        "runtimeTopologyManifestRef": actual_graph["runtimeTopologyManifestRef"],
        "runtimePublicationBundleRef": actual_graph["runtimePublicationBundleRef"],
        "releasePublicationParityRef": actual_graph["releasePublicationParityRef"],
        "topologyTupleHash": actual_graph["topologyTupleHash"],
        "gatewaySurfaceCount": len(actual_graph["gatewaySurfaces"]),
        "routePublicationCount": len(actual_graph["routePublications"]),
        "frontendManifestCount": len(actual_graph["frontendManifests"]),
        "audienceSurfaceRuntimeBindingCount": len(actual_graph["audienceSurfaceRuntimeBindings"]),
        "surfacePublicationCount": len(actual_graph["surfacePublications"]),
        "designBundleCount": len(actual_graph["designContractPublicationBundles"]),
        "assuranceSliceCount": len(actual_graph["assuranceSliceRefs"]),
        "trustBoundaryCount": len(actual_graph["trustZoneBoundaries"]),
        "workloadFamilyCatalogCount": len(actual_graph["workloadFamilies"]),
        "verdict": current_verdict,
    }

    category_counts: dict[str, int] = {}
    for scenario in scenarios:
        for finding in scenario["driftFindings"]:
            category_counts[finding["categoryCode"]] = category_counts.get(finding["categoryCode"], 0) + 1

    catalog = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "gap_resolutions": GAP_RESOLUTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "current_gateway_surface_count": current_snapshot["gatewaySurfaceCount"],
            "current_route_publication_count": current_snapshot["routePublicationCount"],
            "current_frontend_manifest_count": current_snapshot["frontendManifestCount"],
            "current_audience_runtime_binding_count": current_snapshot["audienceSurfaceRuntimeBindingCount"],
            "current_surface_publication_count": current_snapshot["surfacePublicationCount"],
            "current_design_bundle_count": current_snapshot["designBundleCount"],
            "scenario_count": len(scenarios),
            "publishable_scenario_count": sum(1 for row in scenarios if row["expected"]["publishable"]),
            "blocked_scenario_count": sum(1 for row in scenarios if not row["expected"]["publishable"]),
            "drift_category_count": len(DRIFT_CATEGORY_DEFINITIONS),
            "current_drift_finding_count": current_verdict["driftFindingCount"],
        },
        "driftCategoryDefinitions": DRIFT_CATEGORY_DEFINITIONS,
        "driftCategoryFrequency": category_counts,
        "currentGraphSnapshot": current_snapshot,
        "publicationScenarios": scenarios,
    }

    return catalog, gateway_matrix, scenarios


def write_matrix(scenarios: list[dict[str, Any]]) -> None:
    fieldnames = [
        "scenarioId",
        "environmentRing",
        "publishable",
        "publicationEligibilityState",
        "bindingCompleteness",
        "driftFindingCount",
        "blockedReasonRefs",
        "driftCategoryCodes",
    ]
    with MATRIX_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in scenarios:
            writer.writerow(
                {
                    "scenarioId": row["scenarioId"],
                    "environmentRing": row["environmentRing"],
                    "publishable": "yes" if row["expected"]["publishable"] else "no",
                    "publicationEligibilityState": row["expected"]["publicationEligibilityState"],
                    "bindingCompleteness": row["expected"]["bindingCompleteness"],
                    "driftFindingCount": row["expected"]["driftFindingCount"],
                    "blockedReasonRefs": ";".join(row["expected"]["blockedReasonRefs"]),
                    "driftCategoryCodes": ";".join(row["expected"]["driftCategoryCodes"]),
                }
            )


def write_catalog_ts(catalog: dict[str, Any]) -> None:
    payload = {
        "taskId": TASK_ID,
        "generatedAt": GENERATED_AT,
        "visualMode": VISUAL_MODE,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "driftCategoryDefinitions": DRIFT_CATEGORY_DEFINITIONS,
        "currentGraphSnapshot": catalog["currentGraphSnapshot"],
        "publicationScenarios": [
            {
                "scenarioId": row["scenarioId"],
                "environmentRing": row["environmentRing"],
                "title": row["title"],
                "description": row["description"],
                "graph": row["graph"],
                "expected": row["expected"],
            }
            for row in catalog["publicationScenarios"]
        ],
    }
    body = json.dumps(payload, indent=2)
    CATALOG_TS_PATH.write_text(
        'import type { RuntimeTopologyPublicationCatalog } from "./runtime-topology-publication.catalog.types";\n\n'
        + "export const runtimeTopologyPublicationCatalog: RuntimeTopologyPublicationCatalog = "
        + body
        + ";\n\n"
        + 'export type RuntimeTopologyPublicationScenario = RuntimeTopologyPublicationCatalog["publicationScenarios"][number];\n'
        + 'export type RuntimeTopologyPublicationDriftCategory = RuntimeTopologyPublicationCatalog["driftCategoryDefinitions"][number];\n',
        encoding="utf-8",
    )


def main() -> None:
    catalog, gateway_matrix, scenarios = build_catalog()
    write_json(DRIFT_CATALOG_PATH, catalog)
    write_json(GATEWAY_MATRIX_PATH, gateway_matrix)
    write_matrix(scenarios)
    write_catalog_ts(catalog)
    print(
        f"built {TASK_ID} runtime topology publication artifacts with "
        f"{catalog['summary']['scenario_count']} scenarios"
    )


if __name__ == "__main__":
    main()
