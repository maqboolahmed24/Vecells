#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
DESIGN_BUNDLES_PATH = DATA_DIR / "design_contract_publication_bundles.json"
RUNTIME_BUNDLES_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_RECORDS_PATH = DATA_DIR / "release_publication_parity_records.json"
SHELL_CONTRACTS_PATH = DATA_DIR / "persistent_shell_contracts.json"
TENANT_SCOPE_PATH = DATA_DIR / "tenant_isolation_modes.json"

INTEGRATION_MATRIX_PATH = DATA_DIR / "foundation_manifest_integration_matrix.csv"
SURFACE_AUTHORITY_TUPLES_PATH = DATA_DIR / "surface_authority_tuple_catalog.json"
ROUTE_TO_SHELL_EDGES_PATH = DATA_DIR / "route_to_shell_runtime_manifest_edges.csv"
VERDICTS_PATH = DATA_DIR / "manifest_fusion_verdicts.json"
BLOCKED_OR_PARTIAL_ROWS_PATH = DATA_DIR / "blocked_or_partial_surface_rows.csv"

FOUNDATION_DOC_PATH = DOCS_DIR / "127_foundation_manifest_integration.md"
TUPLE_CONTRACT_DOC_PATH = DOCS_DIR / "127_surface_authority_tuple_contract.md"
DRIFT_RULES_DOC_PATH = DOCS_DIR / "127_manifest_drift_and_recovery_rules.md"
BINDING_MAP_DOC_PATH = DOCS_DIR / "127_domain_to_route_to_shell_binding_map.md"
STUDIO_PATH = DOCS_DIR / "127_manifest_fusion_studio.html"

TASK_ID = "seq_127"
VISUAL_MODE = "Foundation_Manifest_Fusion_Studio"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]
LOCAL_RELEASE_REF = "RC_LOCAL_V1"
LOCAL_RUNTIME_BUNDLE_REF = "rpb::local::authoritative"
LOCAL_PARITY_REF = "rpp::local::authoritative"

SOURCE_PRECEDENCE = [
    "prompt/127.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-frontend-blueprint.md#Surface publication authority",
    "blueprint/platform-frontend-blueprint.md#Shared IA rules",
    "data/analysis/route_family_inventory.csv",
    "data/analysis/audience_surface_inventory.csv",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
    "data/analysis/persistent_shell_contracts.json",
    "data/analysis/tenant_isolation_modes.json",
]

COMMON_SOURCE_TASK_REFS = [
    "seq_044",
    "seq_047",
    "seq_050",
    "seq_052",
    "par_094",
    "par_106",
    "seq_127",
]

REASON_CATALOG = [
    {
        "reasonRef": "MFV_127_DESIGN_LINT_PENDING",
        "severity": "warning",
        "description": "The published design bundle still carries a pending lint verdict, so calm presentation cannot be claimed.",
        "verdictEffects": ["partial"],
    },
    {
        "reasonRef": "MFV_127_ACCESSIBILITY_DEGRADED",
        "severity": "warning",
        "description": "Accessibility coverage is degraded, so the tuple remains bounded and guarded instead of exact.",
        "verdictEffects": ["partial"],
    },
    {
        "reasonRef": "MFV_127_ACCESSIBILITY_BLOCKED",
        "severity": "blocked",
        "description": "Accessibility coverage is blocked, so the surface cannot claim a live fused authority tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_BROWSER_POSTURE_READ_ONLY",
        "severity": "warning",
        "description": "The release parity row only permits read-only posture.",
        "verdictEffects": ["partial"],
    },
    {
        "reasonRef": "MFV_127_BROWSER_POSTURE_RECOVERY_ONLY",
        "severity": "warning",
        "description": "The release parity row only permits recovery-only posture.",
        "verdictEffects": ["partial"],
    },
    {
        "reasonRef": "MFV_127_CONSTRAINED_NON_BROWSER_CHANNEL",
        "severity": "warning",
        "description": "The inventoried surface is channel-constrained and not browser-visible, so it remains bounded even when the shell family is browser-addressable.",
        "verdictEffects": ["partial"],
    },
    {
        "reasonRef": "MFV_127_FRONTEND_MANIFEST_MISSING",
        "severity": "blocked",
        "description": "No frontend contract manifest currently publishes this route family.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_SURFACE_ROUTE_CONTRACT_MISSING",
        "severity": "blocked",
        "description": "No audience surface route contract is published for this tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_RUNTIME_BINDING_MISSING",
        "severity": "blocked",
        "description": "No audience surface runtime binding is published for this tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_DESIGN_BUNDLE_MISSING",
        "severity": "blocked",
        "description": "No design contract publication bundle is currently linked to this tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_PROJECTION_VERSION_SET_MISSING",
        "severity": "blocked",
        "description": "No projection contract version set is currently linked to this tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_SHELL_CONTRACT_MISSING",
        "severity": "blocked",
        "description": "No persistent shell contract is published for the shell family required by this tuple.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_GOVERNING_BOUNDED_CONTEXT_MISSING",
        "severity": "blocked",
        "description": "The tuple cannot name a governing bounded context.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_CANONICAL_DESCRIPTOR_MISSING",
        "severity": "blocked",
        "description": "The tuple cannot name a canonical object descriptor for the route family.",
        "verdictEffects": ["blocked"],
    },
    {
        "reasonRef": "MFV_127_DIGEST_ALIGNMENT_DRIFT",
        "severity": "drifted",
        "description": "Frontend, design, runtime, or parity digests no longer align for the fused tuple.",
        "verdictEffects": ["drifted"],
    },
    {
        "reasonRef": "MFV_127_ASSISTIVE_STANDALONE_UNPUBLISHED",
        "severity": "blocked",
        "description": "The derived standalone assistive shell route family exists in the inventory but is not published through a shell, manifest, or runtime binding of its own.",
        "verdictEffects": ["blocked"],
    },
]

VISIBILITY_COVERAGE_BY_SURFACE = {
    "surf_assistive_sidecar": "AVC_054_ASSISTIVE_ADJUNCT_V1",
    "surf_governance_shell": "AVC_054_GOVERNANCE_PLATFORM_V1",
    "surf_hub_queue": "AVC_054_HUB_CROSS_ORG_V1",
    "surf_hub_case_management": "AVC_054_HUB_CROSS_ORG_V1",
    "surf_operations_board": "AVC_054_OPERATIONS_WATCH_V1",
    "surf_operations_drilldown": "AVC_054_OPERATIONS_WATCH_V1",
    "surf_patient_home": "AVC_054_PATIENT_AUTHENTICATED_V1",
    "surf_patient_requests": "AVC_054_PATIENT_AUTHENTICATED_V1",
    "surf_patient_appointments": "AVC_054_PATIENT_AUTHENTICATED_V1",
    "surf_patient_health_record": "AVC_054_PATIENT_AUTHENTICATED_V1",
    "surf_patient_messages": "AVC_054_PATIENT_AUTHENTICATED_V1",
    "surf_patient_intake_web": "AVC_054_PATIENT_PUBLIC_ENTRY_V1",
    "surf_patient_intake_phone": "AVC_054_PATIENT_PUBLIC_ENTRY_V1",
    "surf_patient_secure_link_recovery": "AVC_054_PATIENT_GRANT_RECOVERY_V1",
    "surf_patient_embedded_shell": "AVC_054_PATIENT_EMBEDDED_V1",
    "surf_pharmacy_console": "AVC_054_PHARMACY_SERVICING_V1",
    "surf_support_ticket_workspace": "AVC_054_SUPPORT_WORKSPACE_V1",
    "surf_support_assisted_capture": "AVC_054_SUPPORT_ASSISTED_CAPTURE_V1",
    "surf_support_replay_observe": "AVC_054_SUPPORT_REPLAY_V1",
    "surf_clinician_workspace": "AVC_054_STAFF_SINGLE_ORG_V1",
    "surf_clinician_workspace_child": "AVC_054_STAFF_SINGLE_ORG_V1",
    "surf_practice_ops_workspace": "AVC_054_STAFF_SINGLE_ORG_V1",
}


def require(condition: bool, code: str) -> None:
    if not condition:
        raise RuntimeError(code)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_127_MISSING::{path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"PREREQUISITE_GAP_127_MISSING::{path.name}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(value for value in values if value))


def stable_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()[:16]


def split_semicolon(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(";") if part.strip()]


def choose_primary_descriptor(canonical_refs: list[str], fallback_governing_objects: list[str]) -> tuple[str | None, list[str]]:
    if canonical_refs:
        return canonical_refs[0], canonical_refs
    if not fallback_governing_objects:
        return None, []
    preferred = next(
        (entry for entry in fallback_governing_objects if "SurfaceBinding" in entry or "Projection" in entry),
        fallback_governing_objects[0],
    )
    return preferred, fallback_governing_objects


def build_indices() -> dict[str, Any]:
    route_rows = load_csv(ROUTE_FAMILY_PATH)
    audience_rows = load_csv(AUDIENCE_SURFACE_PATH)
    gateway = load_json(GATEWAY_SURFACES_PATH)
    frontend = load_json(FRONTEND_MANIFESTS_PATH)
    design = load_json(DESIGN_BUNDLES_PATH)
    runtime = load_json(RUNTIME_BUNDLES_PATH)
    parity = load_json(PARITY_RECORDS_PATH)
    shells = load_json(SHELL_CONTRACTS_PATH)
    tenant_scope = load_json(TENANT_SCOPE_PATH)

    manifest_by_route: dict[str, dict[str, Any]] = {}
    for row in frontend["frontendContractManifests"]:
        for route_family in row["routeFamilyRefs"]:
            manifest_by_route[route_family] = row

    projection_family_by_route = {
        row["routeFamilyRefs"][0]: row for row in frontend["projectionContractFamilies"]
    }
    projection_version_set_by_manifest = {
        row["frontendContractManifestRef"]: row for row in frontend["projectionContractVersionSets"]
    }
    query_contract_by_route = {
        row["routeFamilyRef"]: row for row in frontend["projectionQueryContracts"]
    }
    mutation_contract_by_route = {
        row["routeFamilyRef"]: row for row in frontend["mutationCommandContracts"]
    }
    live_channel_contracts_by_route: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in frontend["liveUpdateChannelContracts"]:
        live_channel_contracts_by_route[row["routeFamilyRef"]].append(row)

    route_contract_by_id = {
        row["audienceSurfaceRouteContractId"]: row for row in frontend["surfaceRouteContracts"]
    }
    surface_publication_by_id = {
        row["audienceSurfacePublicationRef"]: row for row in frontend["surfacePublications"]
    }
    runtime_binding_by_id = {
        row["audienceSurfaceRuntimeBindingId"]: row for row in frontend["audienceSurfaceRuntimeBindings"]
    }
    design_bundle_by_audience = {
        row["audienceSurface"]: row for row in design["designContractPublicationBundles"]
    }
    gateway_by_surface: dict[str, list[dict[str, Any]]] = defaultdict(list)
    gateway_by_route: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in gateway["gateway_surfaces"]:
        gateway_by_surface[row["audienceSurfaceRef"]].append(row)
        for route_family in row["routeFamilies"]:
            gateway_by_route[route_family].append(row)

    runtime_bundle = next(
        row
        for row in runtime["runtimePublicationBundles"]
        if row["runtimePublicationBundleId"] == LOCAL_RUNTIME_BUNDLE_REF
    )
    parity_record = next(
        row
        for row in parity["releasePublicationParityRecords"]
        if row["publicationParityRecordId"] == LOCAL_PARITY_REF
    )
    parity_row_by_audience = {
        row["audienceSurface"]: row
        for row in parity["surfaceAuthorityRows"]
        if row["releaseRef"] == LOCAL_RELEASE_REF
    }

    shell_by_family = {row["shellFamily"]: row for row in shells["shells"]}
    scope_profile_by_visibility = {
        row["visibilityCoverageRef"]: row for row in tenant_scope["scopeProfileCatalog"]
    }

    return {
        "route_rows": route_rows,
        "route_row_by_id": {row["route_family_id"]: row for row in route_rows},
        "audience_rows": audience_rows,
        "manifest_by_route": manifest_by_route,
        "projection_family_by_route": projection_family_by_route,
        "projection_version_set_by_manifest": projection_version_set_by_manifest,
        "query_contract_by_route": query_contract_by_route,
        "mutation_contract_by_route": mutation_contract_by_route,
        "live_channel_contracts_by_route": live_channel_contracts_by_route,
        "route_contract_by_id": route_contract_by_id,
        "surface_publication_by_id": surface_publication_by_id,
        "runtime_binding_by_id": runtime_binding_by_id,
        "design_bundle_by_audience": design_bundle_by_audience,
        "gateway_by_surface": gateway_by_surface,
        "gateway_by_route": gateway_by_route,
        "runtime_bundle": runtime_bundle,
        "parity_record": parity_record,
        "parity_row_by_audience": parity_row_by_audience,
        "shell_by_family": shell_by_family,
        "scope_profile_by_visibility": scope_profile_by_visibility,
    }


def derive_governing_context(gateway_rows: list[dict[str, Any]], route_row: dict[str, str]) -> tuple[str | None, list[str]]:
    if route_row["shell_type"] == "assistive":
        return "assistive", ["assistive"]
    if gateway_rows:
        served = gateway_rows[0].get("servedBoundedContextRefs", [])
        if served:
            return served[0], served
    return None, []


def derive_visibility_coverage(surface_id: str | None, route_row: dict[str, str]) -> list[str]:
    if surface_id and surface_id in VISIBILITY_COVERAGE_BY_SURFACE:
        return [VISIBILITY_COVERAGE_BY_SURFACE[surface_id]]
    if route_row["shell_type"] == "assistive":
        return ["AVC_054_ASSISTIVE_ADJUNCT_V1"]
    return []


def build_source_task_refs(surface_id: str | None, route_row: dict[str, str]) -> list[str]:
    refs = list(COMMON_SOURCE_TASK_REFS)
    if surface_id and surface_id.startswith("surf_operations_"):
        refs.append("par_117")
    if surface_id and surface_id.startswith("surf_hub_"):
        refs.append("par_118")
    return unique_sorted(refs)


def build_notes(
    surface_id: str | None,
    manifest: dict[str, Any] | None,
    shell_row: dict[str, Any] | None,
    route_row: dict[str, str],
    gateway_rows: list[dict[str, Any]],
    verdict: str,
    duplicate_surface_count: int,
) -> str:
    notes: list[str] = []
    if manifest and shell_row and manifest["audienceSurface"] != shell_row["audienceSurfaceRef"]:
        notes.append(
            f"Shell residency remains on `{shell_row['shellSlug']}` while publication authority resolves through `{manifest['audienceSurface']}`."
        )
    if duplicate_surface_count > 1 and surface_id:
        notes.append(
            f"Route family `{route_row['route_family_id']}` fans out across {duplicate_surface_count} inventoried surfaces and reuses one published audience tuple."
        )
    if gateway_rows and not gateway_rows[0].get("browserVisible", True):
        notes.append("The ingress remains constrained and is not directly browser-visible.")
    if verdict == "blocked" and route_row["route_family_id"] == "rf_assistive_control_shell":
        notes.append("The derived standalone assistive shell has route inventory truth but no seeded shell, manifest, or runtime binding of its own.")
    return " ".join(notes) or "The fused tuple is generated directly from the current inventory, gateway, frontend, design, runtime, and shell authority inputs."


def build_tuple_row(
    *,
    route_row: dict[str, str],
    surface_id: str | None,
    surface_name: str,
    indices: dict[str, Any],
    duplicate_surface_count: int,
) -> dict[str, Any]:
    route_family_ref = route_row["route_family_id"]
    manifest = indices["manifest_by_route"].get(route_family_ref)
    gateway_rows = (
        indices["gateway_by_surface"].get(surface_id, [])
        if surface_id
        else indices["gateway_by_route"].get(route_family_ref, [])
    )
    shell_row = indices["shell_by_family"].get(route_row["shell_type"])
    projection_family = indices["projection_family_by_route"].get(route_family_ref)
    query_contract = indices["query_contract_by_route"].get(route_family_ref)
    mutation_contract = indices["mutation_contract_by_route"].get(route_family_ref)
    live_contracts = indices["live_channel_contracts_by_route"].get(route_family_ref, [])

    published_audience_surface = manifest["audienceSurface"] if manifest else None
    route_contract = (
        indices["route_contract_by_id"].get(manifest["surfaceRouteContractRef"]) if manifest else None
    )
    surface_publication = (
        indices["surface_publication_by_id"].get(manifest["surfacePublicationRef"]) if manifest else None
    )
    runtime_binding = (
        indices["runtime_binding_by_id"].get(manifest["audienceSurfaceRuntimeBindingRef"])
        if manifest
        else None
    )
    design_bundle = (
        indices["design_bundle_by_audience"].get(published_audience_surface)
        if published_audience_surface
        else None
    )
    projection_version_set = (
        indices["projection_version_set_by_manifest"].get(manifest["frontendContractManifestId"])
        if manifest
        else None
    )
    parity_row = (
        indices["parity_row_by_audience"].get(published_audience_surface)
        if published_audience_surface
        else None
    )

    governing_context, contributing_contexts = derive_governing_context(gateway_rows, route_row)
    fallback_governing_objects = split_semicolon(route_row.get("governing_objects"))
    canonical_refs = (
        projection_family.get("canonicalObjectDescriptorRefs", []) if projection_family else []
    )
    primary_descriptor, canonical_ref_set = choose_primary_descriptor(
        canonical_refs,
        fallback_governing_objects,
    )

    visibility_coverage_refs = derive_visibility_coverage(surface_id, route_row)
    reason_refs: list[str] = []
    digest_mismatch_refs: list[str] = []

    if not manifest:
        reason_refs.append("MFV_127_FRONTEND_MANIFEST_MISSING")
    if not route_contract:
        reason_refs.append("MFV_127_SURFACE_ROUTE_CONTRACT_MISSING")
    if not runtime_binding:
        reason_refs.append("MFV_127_RUNTIME_BINDING_MISSING")
    if not design_bundle:
        reason_refs.append("MFV_127_DESIGN_BUNDLE_MISSING")
    if not projection_version_set:
        reason_refs.append("MFV_127_PROJECTION_VERSION_SET_MISSING")
    if not shell_row:
        reason_refs.append("MFV_127_SHELL_CONTRACT_MISSING")
    if not governing_context:
        reason_refs.append("MFV_127_GOVERNING_BOUNDED_CONTEXT_MISSING")
    if not primary_descriptor:
        reason_refs.append("MFV_127_CANONICAL_DESCRIPTOR_MISSING")

    if manifest and design_bundle and manifest["designContractDigestRef"] != design_bundle["designContractDigestRef"]:
        digest_mismatch_refs.append("design")
    if manifest and projection_version_set and manifest["projectionCompatibilityDigestRef"] != projection_version_set["projectionCompatibilityDigestRef"]:
        digest_mismatch_refs.append("projection")
    if manifest and parity_row and manifest["frontendContractDigestRef"] != parity_row["frontendContractDigestRef"]:
        digest_mismatch_refs.append("frontend")
    if manifest and parity_row and manifest["projectionCompatibilityDigestRef"] != parity_row["projectionCompatibilityDigestRef"]:
        digest_mismatch_refs.append("parity")
    if manifest and runtime_binding and manifest["surfaceAuthorityTupleHash"] != runtime_binding["surfaceTupleHash"]:
        digest_mismatch_refs.append("surface_tuple")
    if manifest and manifest["frontendContractDigestRef"] not in indices["runtime_bundle"]["frontendContractDigestRefs"]:
        digest_mismatch_refs.append("runtime_frontend_set")
    if manifest and manifest["designContractDigestRef"] not in indices["runtime_bundle"]["designContractDigestRefs"]:
        digest_mismatch_refs.append("runtime_design_set")

    if digest_mismatch_refs:
        reason_refs.append("MFV_127_DIGEST_ALIGNMENT_DRIFT")

    if parity_row:
        if parity_row["browserPostureState"] == "read_only":
            reason_refs.append("MFV_127_BROWSER_POSTURE_READ_ONLY")
        if parity_row["browserPostureState"] == "recovery_only":
            reason_refs.append("MFV_127_BROWSER_POSTURE_RECOVERY_ONLY")
        if parity_row["accessibilityCoverageState"] == "degraded":
            reason_refs.append("MFV_127_ACCESSIBILITY_DEGRADED")
        if parity_row["accessibilityCoverageState"] == "blocked":
            reason_refs.append("MFV_127_ACCESSIBILITY_BLOCKED")
    if gateway_rows and not gateway_rows[0].get("browserVisible", True):
        reason_refs.append("MFV_127_CONSTRAINED_NON_BROWSER_CHANNEL")
    if design_bundle and design_bundle.get("lintVerdictRef", "").endswith("pending"):
        reason_refs.append("MFV_127_DESIGN_LINT_PENDING")
    if route_family_ref == "rf_assistive_control_shell":
        reason_refs.append("MFV_127_ASSISTIVE_STANDALONE_UNPUBLISHED")

    critical_blockers = {
        "MFV_127_FRONTEND_MANIFEST_MISSING",
        "MFV_127_SURFACE_ROUTE_CONTRACT_MISSING",
        "MFV_127_RUNTIME_BINDING_MISSING",
        "MFV_127_DESIGN_BUNDLE_MISSING",
        "MFV_127_PROJECTION_VERSION_SET_MISSING",
        "MFV_127_SHELL_CONTRACT_MISSING",
        "MFV_127_GOVERNING_BOUNDED_CONTEXT_MISSING",
        "MFV_127_CANONICAL_DESCRIPTOR_MISSING",
        "MFV_127_ACCESSIBILITY_BLOCKED",
        "MFV_127_ASSISTIVE_STANDALONE_UNPUBLISHED",
    }

    if any(reason in critical_blockers for reason in reason_refs):
        verdict = "blocked"
    elif "MFV_127_DIGEST_ALIGNMENT_DRIFT" in reason_refs:
        verdict = "drifted"
    elif reason_refs:
        verdict = "partial"
    else:
        verdict = "exact"

    gateway_surface_refs = unique_sorted([row["surfaceId"] for row in gateway_rows])
    gateway_primary_ref = gateway_surface_refs[0] if gateway_surface_refs else None
    publication_state = parity_row["publicationState"] if parity_row else "missing"
    browser_posture_state = parity_row["browserPostureState"] if parity_row else "blocked"
    writability_state = (
        "blocked"
        if verdict == "blocked"
        else "frozen"
        if verdict == "drifted"
        else browser_posture_state
    )
    calm_state = {
        "exact": "calm",
        "partial": "guarded",
        "drifted": "guarded",
        "blocked": "blocked",
    }[verdict]

    continuity_refs = unique_sorted(
        [
            route_contract["continuityContractRef"] if route_contract else "",
            *(route_contract.get("hydrationContractRefs", []) if route_contract else []),
            *(route_contract.get("selectedAnchorPolicyRefs", []) if route_contract else []),
            shell_row["ownership"]["continuityRestorePlanRef"] if shell_row else "",
        ]
    )
    visibility_policy_ref = "VisibilityProjectionPolicy"
    source_task_refs = build_source_task_refs(surface_id, route_row)
    tuple_id = (
        f"FMTUP_127_{surface_id.upper()}_V1"
        if surface_id
        else f"FMTUP_127_{route_family_ref.upper()}_V1"
    )
    notes = build_notes(
        surface_id,
        manifest,
        shell_row,
        route_row,
        gateway_rows,
        verdict,
        duplicate_surface_count,
    )

    row_payload = {
        "tupleId": tuple_id,
        "inventorySurfaceRef": surface_id,
        "inventorySurfaceLabel": surface_name,
        "audienceSurface": surface_id or f"gap::{route_family_ref}",
        "publishedAudienceSurfaceRef": published_audience_surface,
        "shellType": route_row["shell_type"],
        "shellSlug": shell_row["shellSlug"] if shell_row else None,
        "shellAudienceSurfaceRef": shell_row["audienceSurfaceRef"] if shell_row else None,
        "routeFamilyRef": route_family_ref,
        "routeFamilyLabel": route_row["route_family"],
        "governingBoundedContextRef": governing_context,
        "contributingBoundedContextRefs": contributing_contexts,
        "canonicalObjectDescriptorRef": primary_descriptor,
        "canonicalObjectDescriptorRefs": canonical_ref_set,
        "surfaceRouteContractRef": manifest["surfaceRouteContractRef"] if manifest else None,
        "surfacePublicationRef": manifest["surfacePublicationRef"] if manifest else None,
        "frontendContractManifestRef": manifest["frontendContractManifestId"] if manifest else None,
        "designContractPublicationBundleRef": manifest["designContractPublicationBundleRef"] if manifest else None,
        "runtimePublicationBundleRef": indices["runtime_bundle"]["runtimePublicationBundleId"]
        if gateway_rows
        else None,
        "releasePublicationParityRef": indices["parity_record"]["publicationParityRecordId"]
        if gateway_rows
        else None,
        "surfaceAuthorityRowRef": parity_row["rowId"] if parity_row else None,
        "audienceSurfaceRuntimeBindingRef": manifest["audienceSurfaceRuntimeBindingRef"] if manifest else None,
        "releaseRecoveryDispositionRefs": manifest.get("releaseRecoveryDispositionRefs", []) if manifest else [],
        "routeFreezeDispositionRefs": manifest.get("routeFreezeDispositionRefs", []) if manifest else [],
        "continuityEvidenceContractRefs": continuity_refs,
        "projectionContractVersionSetRef": projection_version_set["projectionContractVersionSetId"]
        if projection_version_set
        else None,
        "mutationCommandContractDigestRefs": unique_sorted(
            [f"mutation-command-digest::{mutation_contract['contractDigestRef']}"]
            if mutation_contract
            else []
        ),
        "projectionQueryContractDigestRefs": unique_sorted(
            [f"projection-query-digest::{query_contract['contractDigestRef']}"] if query_contract else []
        ),
        "liveUpdateChannelDigestRefs": unique_sorted(
            [f"live-update-digest::{row['contractDigestRef']}" for row in live_contracts]
        ),
        "visibilityCoverageRefs": visibility_coverage_refs,
        "visibilityPolicyRef": visibility_policy_ref,
        "bindingVerdict": verdict,
        "writabilityState": writability_state,
        "calmState": calm_state,
        "browserPostureState": browser_posture_state,
        "publicationState": publication_state,
        "parityState": parity_row["parityState"] if parity_row else "missing",
        "accessibilityCoverageState": parity_row["accessibilityCoverageState"] if parity_row else "missing",
        "designPublicationState": parity_row["designPublicationState"] if parity_row else "missing",
        "designLintVerdictRef": design_bundle["lintVerdictRef"] if design_bundle else None,
        "gatewaySurfaceRefs": gateway_surface_refs,
        "gatewaySurfacePrimaryRef": gateway_primary_ref,
        "browserVisible": gateway_rows[0].get("browserVisible", False) if gateway_rows else False,
        "channelProfile": route_row.get("channel_profiles") if not surface_id else None,
        "routeExposureState": parity_row["routeExposureState"] if parity_row else "missing",
        "reasonRefs": unique_sorted(reason_refs),
        "sourceTaskRefs": source_task_refs,
        "sourceRefs": unique_sorted(
            split_semicolon(route_row.get("source_refs"))
            + [ref for row in gateway_rows for ref in row.get("source_refs", [])]
            + (manifest.get("source_refs", []) if manifest else [])
            + (design_bundle.get("source_refs", []) if design_bundle else [])
            + (parity_row.get("bindingCeilingReasons", []) if parity_row else [])
        ),
        "notes": notes,
    }
    row_payload["bindingDigestRef"] = stable_hash(
        {
            "routeFamilyRef": row_payload["routeFamilyRef"],
            "inventorySurfaceRef": row_payload["inventorySurfaceRef"],
            "publishedAudienceSurfaceRef": row_payload["publishedAudienceSurfaceRef"],
            "shellSlug": row_payload["shellSlug"],
            "runtimePublicationBundleRef": row_payload["runtimePublicationBundleRef"],
            "projectionContractVersionSetRef": row_payload["projectionContractVersionSetRef"],
            "reasonRefs": row_payload["reasonRefs"],
        }
    )
    return row_payload


def build_catalog() -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    indices = build_indices()
    audience_rows = indices["audience_rows"]
    route_rows = indices["route_rows"]
    route_ids_present_in_surfaces = {row["route_family_id"] for row in audience_rows}
    duplicate_surface_counts = Counter(row["route_family_id"] for row in audience_rows)

    tuples: list[dict[str, Any]] = []
    for row in audience_rows:
        tuples.append(
            build_tuple_row(
                route_row=indices["route_row_by_id"][row["route_family_id"]],
                surface_id=row["surface_id"],
                surface_name=row["surface_name"],
                indices=indices,
                duplicate_surface_count=duplicate_surface_counts[row["route_family_id"]],
            )
        )

    for route_row in route_rows:
        if route_row["route_family_id"] in route_ids_present_in_surfaces:
            continue
        tuples.append(
            build_tuple_row(
                route_row=route_row,
                surface_id=None,
                surface_name=route_row["primary_surface_name"],
                indices=indices,
                duplicate_surface_count=0,
            )
        )

    tuples.sort(key=lambda row: (row["shellType"], row["routeFamilyRef"], row["inventorySurfaceRef"] or ""))

    matrix_rows: list[dict[str, Any]] = []
    edge_rows: list[dict[str, Any]] = []
    blocked_or_partial_rows: list[dict[str, Any]] = []
    reason_counter: Counter[str] = Counter()
    verdict_counter: Counter[str] = Counter(row["bindingVerdict"] for row in tuples)

    for row in tuples:
        reason_counter.update(row["reasonRefs"])
        matrix_rows.append(
            {
                "tupleId": row["tupleId"],
                "inventorySurfaceRef": row["inventorySurfaceRef"] or "",
                "publishedAudienceSurfaceRef": row["publishedAudienceSurfaceRef"] or "",
                "shellType": row["shellType"],
                "shellSlug": row["shellSlug"] or "",
                "routeFamilyRef": row["routeFamilyRef"],
                "governingBoundedContextRef": row["governingBoundedContextRef"] or "",
                "canonicalObjectDescriptorRef": row["canonicalObjectDescriptorRef"] or "",
                "frontendContractManifestRef": row["frontendContractManifestRef"] or "",
                "surfaceRouteContractRef": row["surfaceRouteContractRef"] or "",
                "designContractPublicationBundleRef": row["designContractPublicationBundleRef"] or "",
                "runtimePublicationBundleRef": row["runtimePublicationBundleRef"] or "",
                "audienceSurfaceRuntimeBindingRef": row["audienceSurfaceRuntimeBindingRef"] or "",
                "releasePublicationParityRef": row["releasePublicationParityRef"] or "",
                "projectionContractVersionSetRef": row["projectionContractVersionSetRef"] or "",
                "bindingVerdict": row["bindingVerdict"],
                "writabilityState": row["writabilityState"],
                "calmState": row["calmState"],
                "visibilityCoverageRefs": "|".join(row["visibilityCoverageRefs"]),
                "reasonRefs": "|".join(row["reasonRefs"]),
                "notes": row["notes"],
            }
        )
        if row["bindingVerdict"] in {"blocked", "partial"}:
            blocked_or_partial_rows.append(
                {
                    "tupleId": row["tupleId"],
                    "inventorySurfaceRef": row["inventorySurfaceRef"] or "",
                    "publishedAudienceSurfaceRef": row["publishedAudienceSurfaceRef"] or "",
                    "routeFamilyRef": row["routeFamilyRef"],
                    "shellType": row["shellType"],
                    "bindingVerdict": row["bindingVerdict"],
                    "browserPostureState": row["browserPostureState"],
                    "accessibilityCoverageState": row["accessibilityCoverageState"],
                    "reasonRefs": "|".join(row["reasonRefs"]),
                    "notes": row["notes"],
                }
            )
        edge_targets = [
            (
                "inventory_to_publication",
                row["inventorySurfaceRef"] or row["routeFamilyRef"],
                row["publishedAudienceSurfaceRef"] or "missing::publication",
            ),
            (
                "publication_to_shell",
                row["publishedAudienceSurfaceRef"] or row["routeFamilyRef"],
                row["shellSlug"] or "missing::shell",
            ),
            (
                "shell_to_runtime_bundle",
                row["shellSlug"] or row["routeFamilyRef"],
                row["runtimePublicationBundleRef"] or "missing::runtime_publication",
            ),
        ]
        for edge_type, from_ref, to_ref in edge_targets:
            edge_rows.append(
                {
                    "edgeId": f"{row['tupleId']}::{edge_type}",
                    "edgeType": edge_type,
                    "tupleId": row["tupleId"],
                    "fromRef": from_ref,
                    "toRef": to_ref,
                    "routeFamilyRef": row["routeFamilyRef"],
                    "shellType": row["shellType"],
                    "bindingVerdict": row["bindingVerdict"],
                    "reasonRefs": "|".join(row["reasonRefs"]),
                }
            )

    inventory_surfaces = {row["surface_id"] for row in audience_rows}
    covered_inventory_surfaces = {row["inventorySurfaceRef"] for row in tuples if row["inventorySurfaceRef"]}
    inventory_route_families = {row["route_family_id"] for row in route_rows}
    covered_route_families = {row["routeFamilyRef"] for row in tuples}

    catalog = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Fuse surface inventory, route authority, shell residency, frontend manifests, design bundles, runtime publications, and parity rows into one fail-closed authority catalog.",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "tuple_count": len(tuples),
            "inventoried_surface_count": len(inventory_surfaces),
            "covered_inventoried_surface_count": len(covered_inventory_surfaces),
            "inventoried_route_family_count": len(inventory_route_families),
            "covered_route_family_count": len(covered_route_families),
            "exact_count": verdict_counter["exact"],
            "partial_count": verdict_counter["partial"],
            "blocked_count": verdict_counter["blocked"],
            "drifted_count": verdict_counter["drifted"],
            "shell_split_count": sum(
                1
                for row in tuples
                if row["publishedAudienceSurfaceRef"] and row["shellAudienceSurfaceRef"]
                and row["publishedAudienceSurfaceRef"] != row["shellAudienceSurfaceRef"]
            ),
            "gap_route_family_count": len(inventory_route_families - route_ids_present_in_surfaces),
        },
        "assumptions": [
            {
                "assumptionId": "ASSUMPTION_127_ROUTE_GAP_ROW_ALLOWED",
                "statement": "The derived standalone assistive route family is inventoried without a concrete surface row, so the fusion catalog emits one explicit blocked route-family gap row instead of silently dropping it.",
            },
            {
                "assumptionId": "ASSUMPTION_127_LOCAL_PARITY_IS_AUTHORITY",
                "statement": "Seq_127 fuses against the local authoritative runtime bundle and parity record because the task requires one current integrated tuple, not a per-ring comparison matrix.",
            },
        ],
        "reasonCatalog": REASON_CATALOG,
        "surfaceAuthorityTuples": tuples,
    }

    verdicts = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "verdictRules": [
            {
                "ruleId": "VR_127_EXACT_REQUIRES_FULL_JOIN",
                "summary": "Exact rows require every mandatory tuple member plus aligned digests and non-blocked accessibility.",
            },
            {
                "ruleId": "VR_127_BLOCKED_ON_HARD_GAPS",
                "summary": "Rows block when a shell, manifest, route contract, runtime binding, projection version set, canonical descriptor, or governing bounded context is missing, or when accessibility is blocked.",
            },
            {
                "ruleId": "VR_127_DRIFT_REQUIRES_DIGEST_MISMATCH",
                "summary": "Rows drift when frontend, design, runtime, or parity digests disagree even though the required members still exist.",
            },
            {
                "ruleId": "VR_127_PARTIAL_IS_GUARDED_NOT_LIVE",
                "summary": "Rows remain partial when the fused tuple exists but design lint, accessibility degradation, or bounded browser posture still prevents calm exactness.",
            },
        ],
        "verdictCounts": dict(sorted(verdict_counter.items())),
        "reasonCounts": dict(sorted(reason_counter.items())),
        "blockedTupleRefs": [row["tupleId"] for row in tuples if row["bindingVerdict"] == "blocked"],
        "partialTupleRefs": [row["tupleId"] for row in tuples if row["bindingVerdict"] == "partial"],
        "driftedTupleRefs": [row["tupleId"] for row in tuples if row["bindingVerdict"] == "drifted"],
    }

    return catalog, matrix_rows, edge_rows, blocked_or_partial_rows, verdicts


def render_summary_table(rows: list[tuple[str, str, str, str, str]]) -> str:
    header = "| Route family | Inventory surface | Shell | Governing bounded context | Verdict |\n| --- | --- | --- | --- | --- |"
    body = "\n".join(
        f"| `{route_family}` | `{surface}` | `{shell}` | `{bounded_context}` | `{verdict}` |"
        for route_family, surface, shell, bounded_context, verdict in rows
    )
    return f"{header}\n{body}"


def build_docs(catalog: dict[str, Any]) -> dict[str, str]:
    tuples = catalog["surfaceAuthorityTuples"]
    blocked_rows = [row for row in tuples if row["bindingVerdict"] == "blocked"]
    sample_rows = [
        (
            row["routeFamilyRef"],
            row["inventorySurfaceRef"] or "gap",
            row["shellSlug"] or "missing",
            row["governingBoundedContextRef"] or "missing",
            row["bindingVerdict"],
        )
        for row in tuples[:10]
    ]
    blocked_table = render_summary_table(
        [
            (
                row["routeFamilyRef"],
                row["inventorySurfaceRef"] or "gap",
                row["shellSlug"] or "missing",
                row["governingBoundedContextRef"] or "missing",
                row["bindingVerdict"],
            )
            for row in blocked_rows
        ]
    )
    sample_table = render_summary_table(sample_rows)

    foundation_doc = dedent(
        f"""
        # 127 Foundation Manifest Integration

        `seq_127` fuses the current route-family inventory, audience-surface inventory, gateway boundary map, frontend contract manifests, design publication bundles, runtime publication bundle, release parity rows, and persistent shell contracts into one fail-closed authority catalog.

        ## Current state

        - Total fused tuples: `{catalog['summary']['tuple_count']}`
        - Inventoried surfaces covered: `{catalog['summary']['covered_inventoried_surface_count']}` / `{catalog['summary']['inventoried_surface_count']}`
        - Inventoried route families covered: `{catalog['summary']['covered_route_family_count']}` / `{catalog['summary']['inventoried_route_family_count']}`
        - Exact tuples: `{catalog['summary']['exact_count']}`
        - Partial tuples: `{catalog['summary']['partial_count']}`
        - Blocked tuples: `{catalog['summary']['blocked_count']}`
        - Drifted tuples: `{catalog['summary']['drifted_count']}`

        ## Why the catalog is surface-granular

        Audience-surface publications in `seq_050`, `seq_052`, and `par_094` are grouped at `audsurf_*` level, but the inventory is stricter. `surf_practice_ops_workspace`, `surf_support_assisted_capture`, and `surf_assistive_sidecar` each require their own row so the fusion layer does not hide fan-out behind a route-family aggregate.

        ## Blocked rows

        {blocked_table}

        ## Sample fused rows

        {sample_table}
        """
    ).strip()

    tuple_contract_doc = dedent(
        """
        # 127 Surface Authority Tuple Contract

        Each fused tuple row is published with these required members:

        - `tupleId`
        - `audienceSurface`
        - `shellType`
        - `routeFamilyRef`
        - `governingBoundedContextRef`
        - `canonicalObjectDescriptorRef`
        - `surfaceRouteContractRef`
        - `frontendContractManifestRef`
        - `designContractPublicationBundleRef`
        - `runtimePublicationBundleRef`
        - `releasePublicationParityRef`
        - `audienceSurfaceRuntimeBindingRef`
        - `releaseRecoveryDispositionRefs[]`
        - `routeFreezeDispositionRefs[]`
        - `continuityEvidenceContractRefs[]`
        - `projectionContractVersionSetRef`
        - `mutationCommandContractDigestRefs[]`
        - `visibilityCoverageRefs[]`
        - `bindingVerdict`
        - `reasonRefs[]`
        - `sourceTaskRefs[]`
        - `notes`

        The catalog also carries surface-granular extras so the fusion layer can preserve inventory truth:

        - `inventorySurfaceRef`
        - `publishedAudienceSurfaceRef`
        - `shellSlug`
        - `shellAudienceSurfaceRef`
        - `gatewaySurfaceRefs[]`
        - `canonicalObjectDescriptorRefs[]`
        - `projectionQueryContractDigestRefs[]`
        - `liveUpdateChannelDigestRefs[]`
        - `writabilityState`
        - `calmState`
        - `browserPostureState`
        """
    ).strip()

    drift_doc = dedent(
        """
        # 127 Manifest Drift And Recovery Rules

        Verdict precedence is strict:

        1. `blocked`
        2. `drifted`
        3. `partial`
        4. `exact`

        A row is `blocked` when any required tuple member is missing, the governing bounded context is unknown, the canonical descriptor is unknown, no shell contract exists, or accessibility coverage is blocked.

        A row is `drifted` only when the required members exist but digest alignment fails across frontend, design, runtime, or release parity evidence.

        A row is `partial` when the fused join exists but the experience is still bounded by read-only or recovery-only posture, degraded accessibility, design lint pending, or constrained channel posture.

        A row is `exact` only when all required members exist, digests align, accessibility is not degraded or blocked, and the fused row can legally claim calm exactness.
        """
    ).strip()

    binding_map_doc = dedent(
        f"""
        # 127 Domain To Route To Shell Binding Map

        The fusion map preserves three distinct truths:

        1. Inventory surfaces and route families
        2. Published audience-surface tuples
        3. Shell residency and continuity ownership

        The shell and publication handles intentionally do not collapse into one namespace. Patient intake and secure-link rows prove the pattern: they still reside in `patient-web`, while their published audience surfaces remain `audsurf_patient_public_entry` and `audsurf_patient_transaction_recovery`.

        ## Route-to-shell sample

        {sample_table}
        """
    ).strip()

    return {
        "foundation": foundation_doc,
        "tuple_contract": tuple_contract_doc,
        "drift_rules": drift_doc,
        "binding_map": binding_map_doc,
    }


def build_html(catalog: dict[str, Any]) -> str:
    payload = json.dumps(catalog, separators=(",", ":"))
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Foundation Manifest Fusion Studio</title>
            <style>
              :root {{
                --canvas: #f4f1ea;
                --canvas-deep: #e8eef2;
                --panel: rgba(255, 251, 245, 0.88);
                --panel-strong: rgba(255, 255, 255, 0.92);
                --border: rgba(33, 58, 76, 0.12);
                --text: #1f3140;
                --text-strong: #12202b;
                --muted: #5c6e79;
                --exact: #2d7c63;
                --partial: #b9822f;
                --blocked: #b5473c;
                --drifted: #7562d8;
                --focus: #1f5d73;
                --shadow: 0 22px 50px rgba(18, 32, 43, 0.08);
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                background:
                  radial-gradient(circle at top left, rgba(111, 171, 194, 0.18), transparent 28%),
                  radial-gradient(circle at top right, rgba(217, 176, 129, 0.2), transparent 24%),
                  linear-gradient(180deg, var(--canvas), var(--canvas-deep));
                color: var(--text);
                font-family: "Avenir Next", "Segoe UI", sans-serif;
              }}
              h1, h2, h3, .wordmark {{
                font-family: "Iowan Old Style", "Palatino Linotype", serif;
                letter-spacing: 0.01em;
              }}
              body[data-reduced-motion="true"] * {{
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }}
              .page {{
                max-width: 1580px;
                margin: 0 auto;
                padding: 28px 24px 40px;
              }}
              header {{
                position: sticky;
                top: 0;
                z-index: 5;
                display: grid;
                grid-template-columns: 1.8fr repeat(4, minmax(0, 1fr));
                gap: 16px;
                padding: 16px 18px;
                border-bottom: 1px solid var(--border);
                backdrop-filter: blur(14px);
                background: rgba(244, 241, 234, 0.92);
              }}
              .stat, nav, .panel, aside {{
                border: 1px solid var(--border);
                border-radius: 22px;
                background: var(--panel);
                box-shadow: var(--shadow);
              }}
              .stat {{
                padding: 14px 16px;
              }}
              .wordmark {{
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--text-strong);
              }}
              .mark {{
                width: 44px;
                height: 44px;
                border-radius: 15px;
                background: linear-gradient(135deg, #274859, #d2954f);
                color: white;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
              }}
              .eyebrow {{
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.12em;
              }}
              .stat-value {{
                display: block;
                margin-top: 6px;
                font-size: 24px;
                font-weight: 700;
                color: var(--text-strong);
              }}
              .layout {{
                display: grid;
                grid-template-columns: 320px minmax(0, 1fr) 390px;
                gap: 20px;
                margin-top: 20px;
                align-items: start;
              }}
              nav, aside {{
                position: sticky;
                top: 94px;
                padding: 18px;
              }}
              .panel {{
                padding: 18px;
                background: var(--panel-strong);
              }}
              main {{
                display: grid;
                gap: 20px;
              }}
              .panel-title {{
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: baseline;
                margin-bottom: 14px;
              }}
              .panel-title h2 {{
                margin: 0;
                color: var(--text-strong);
                font-size: 20px;
              }}
              .panel-title span {{
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }}
              .filter-group {{
                display: grid;
                gap: 8px;
                margin-bottom: 14px;
              }}
              .filter-group label {{
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }}
              select {{
                height: 44px;
                border: 1px solid var(--border);
                border-radius: 14px;
                background: rgba(255, 255, 255, 0.86);
                padding: 0 12px;
                color: var(--text);
              }}
              .summary-copy {{
                color: var(--muted);
                line-height: 1.55;
                margin: 0;
              }}
              .tuple-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                gap: 12px;
              }}
              .tuple-card, .braid-button, .heatmap-button, .table-button {{
                width: 100%;
                border: 1px solid var(--border);
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,244,238,0.94));
                padding: 14px;
                text-align: left;
                color: inherit;
                cursor: pointer;
                transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
              }}
              .tuple-card:hover, .tuple-card:focus-visible,
              .braid-button:hover, .braid-button:focus-visible,
              .heatmap-button:hover, .heatmap-button:focus-visible,
              .table-button:hover, .table-button:focus-visible {{
                outline: none;
                transform: translateY(-1px);
                border-color: var(--focus);
                box-shadow: 0 16px 26px rgba(31, 93, 115, 0.14);
              }}
              [data-selected="true"] {{
                border-color: var(--focus) !important;
                box-shadow: 0 0 0 2px rgba(31, 93, 115, 0.14);
              }}
              .badge {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 88px;
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                color: white;
              }}
              .badge-exact {{ background: var(--exact); }}
              .badge-partial {{ background: var(--partial); }}
              .badge-blocked {{ background: var(--blocked); }}
              .badge-drifted {{ background: var(--drifted); }}
              .meta {{
                color: var(--muted);
                font-size: 12px;
                line-height: 1.5;
              }}
              .mono {{
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 12px;
                color: var(--muted);
                word-break: break-word;
              }}
              .braid {{
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 14px;
              }}
              .strand {{
                background: rgba(245, 240, 233, 0.88);
                border: 1px solid var(--border);
                border-radius: 18px;
                padding: 14px;
              }}
              .strand h3 {{
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 16px;
                color: var(--text-strong);
              }}
              .strand-stack {{
                display: grid;
                gap: 10px;
              }}
              .heatmap-table, .parity-table {{
                width: 100%;
                border-collapse: collapse;
              }}
              .heatmap-table th, .heatmap-table td,
              .parity-table th, .parity-table td {{
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
              }}
              .heatmap-table th, .parity-table th {{
                text-align: left;
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }}
              .tone {{
                height: 12px;
                border-radius: 999px;
                background: linear-gradient(90deg, rgba(182, 130, 47, 0.18), rgba(182, 130, 47, 0.88));
              }}
              .tone-blocked {{
                background: linear-gradient(90deg, rgba(181, 71, 60, 0.18), rgba(181, 71, 60, 0.88));
              }}
              .tone-drifted {{
                background: linear-gradient(90deg, rgba(117, 98, 216, 0.18), rgba(117, 98, 216, 0.88));
              }}
              .inspector-grid {{
                display: grid;
                gap: 12px;
              }}
              .inspector-block {{
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 14px;
                background: rgba(255, 255, 255, 0.74);
              }}
              @media (max-width: 1200px) {{
                .layout {{
                  grid-template-columns: 1fr;
                }}
                nav, aside {{
                  position: static;
                }}
              }}
              @media (max-width: 860px) {{
                header {{
                  grid-template-columns: 1fr 1fr;
                }}
                .braid {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="page">
              <header>
                <div class="stat">
                  <div class="wordmark">
                    <span class="mark">MF</span>
                    <div>
                      <div>Vecells</div>
                      <div class="eyebrow">Foundation Manifest Fusion Studio</div>
                    </div>
                  </div>
                </div>
                <div class="stat"><span class="eyebrow">Tuples</span><span class="stat-value" id="stat-tuples">0</span></div>
                <div class="stat"><span class="eyebrow">Partial</span><span class="stat-value" id="stat-partial">0</span></div>
                <div class="stat"><span class="eyebrow">Blocked</span><span class="stat-value" id="stat-blocked">0</span></div>
                <div class="stat"><span class="eyebrow">Drifted</span><span class="stat-value" id="stat-drifted">0</span></div>
              </header>
              <div class="layout">
                <nav aria-label="Fusion filters">
                  <div class="filter-group">
                    <label for="filter-audience">Audience surface</label>
                    <select id="filter-audience" data-testid="filter-audience"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-shell">Shell type</label>
                    <select id="filter-shell" data-testid="filter-shell"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-verdict">Verdict state</label>
                    <select id="filter-verdict" data-testid="filter-verdict"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-bounded-context">Bounded context</label>
                    <select id="filter-bounded-context" data-testid="filter-bounded-context"></select>
                  </div>
                  <p class="summary-copy" id="filter-summary"></p>
                </nav>
                <main>
                  <section class="panel" data-testid="tuple-cards">
                    <div class="panel-title">
                      <h2>Tuple Cards</h2>
                      <span>Surface-granular authority rows</span>
                    </div>
                    <div class="tuple-grid" id="tuple-grid"></div>
                  </section>
                  <section class="panel" data-testid="triple-braid">
                    <div class="panel-title">
                      <h2>Triple Braid</h2>
                      <span>Inventory surface, published tuple, shell runtime</span>
                    </div>
                    <div class="braid">
                      <div class="strand">
                        <h3>Surface inventory</h3>
                        <div class="strand-stack" id="strand-surface"></div>
                      </div>
                      <div class="strand">
                        <h3>Published tuple</h3>
                        <div class="strand-stack" id="strand-publication"></div>
                      </div>
                      <div class="strand">
                        <h3>Shell runtime</h3>
                        <div class="strand-stack" id="strand-shell"></div>
                      </div>
                    </div>
                  </section>
                  <section class="panel" data-testid="heatmap">
                    <div class="panel-title">
                      <h2>Heatmap</h2>
                      <span>Verdict, posture, and bounded context alignment</span>
                    </div>
                    <div style="overflow:auto">
                      <table class="heatmap-table" aria-label="Manifest fusion heatmap">
                        <thead>
                          <tr>
                            <th>Tuple</th>
                            <th>Verdict</th>
                            <th>Heat</th>
                            <th>Context</th>
                            <th>Route family</th>
                          </tr>
                        </thead>
                        <tbody id="heatmap-body"></tbody>
                      </table>
                    </div>
                  </section>
                  <section class="panel" data-testid="table-parity">
                    <div class="panel-title">
                      <h2>Table Parity</h2>
                      <span>Plain table fallback</span>
                    </div>
                    <div style="overflow:auto">
                      <table class="parity-table" aria-label="Manifest fusion table parity">
                        <thead>
                          <tr>
                            <th>Audience surface</th>
                            <th>Published surface</th>
                            <th>Shell</th>
                            <th>Writability</th>
                            <th>Reasons</th>
                          </tr>
                        </thead>
                        <tbody id="table-parity-body"></tbody>
                      </table>
                    </div>
                  </section>
                </main>
                <aside data-testid="inspector" aria-label="Fusion inspector">
                  <div class="panel-title">
                    <h2>Inspector</h2>
                    <span id="inspector-subtitle">Selected tuple</span>
                  </div>
                  <div class="inspector-grid" id="inspector-grid"></div>
                </aside>
              </div>
            </div>
            <script>
              const payload = {payload};
              const state = {{
                rows: payload.surfaceAuthorityTuples,
                visibleRows: payload.surfaceAuthorityTuples,
                selectedTupleId: payload.surfaceAuthorityTuples[0]?.tupleId ?? null,
              }};

              const audienceFilter = document.querySelector("[data-testid='filter-audience']");
              const shellFilter = document.querySelector("[data-testid='filter-shell']");
              const verdictFilter = document.querySelector("[data-testid='filter-verdict']");
              const boundedContextFilter = document.querySelector("[data-testid='filter-bounded-context']");

              const verdictOrder = ["exact", "partial", "blocked", "drifted"];

              function uniqueOptions(values) {{
                return Array.from(new Set(values.filter(Boolean))).sort();
              }}

              function optionMarkup(label, value) {{
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                return option;
              }}

              function setFilterOptions() {{
                audienceFilter.replaceChildren(optionMarkup("All surfaces", "all"));
                shellFilter.replaceChildren(optionMarkup("All shells", "all"));
                verdictFilter.replaceChildren(optionMarkup("All verdicts", "all"));
                boundedContextFilter.replaceChildren(optionMarkup("All contexts", "all"));

                uniqueOptions(state.rows.map((row) => row.inventorySurfaceRef || row.audienceSurface)).forEach((value) => {{
                  audienceFilter.append(optionMarkup(value, value));
                }});
                uniqueOptions(state.rows.map((row) => row.shellType)).forEach((value) => {{
                  shellFilter.append(optionMarkup(value, value));
                }});
                verdictOrder.forEach((value) => {{
                  verdictFilter.append(optionMarkup(value, value));
                }});
                uniqueOptions(state.rows.map((row) => row.governingBoundedContextRef)).forEach((value) => {{
                  boundedContextFilter.append(optionMarkup(value, value));
                }});
              }}

              function verdictBadge(verdict) {{
                return `<span class="badge badge-${{verdict}}">${{verdict}}</span>`;
              }}

              function applyFilters() {{
                const audienceValue = audienceFilter.value;
                const shellValue = shellFilter.value;
                const verdictValue = verdictFilter.value;
                const boundedContextValue = boundedContextFilter.value;
                state.visibleRows = state.rows.filter((row) => {{
                  if (audienceValue !== "all" && (row.inventorySurfaceRef || row.audienceSurface) !== audienceValue) {{
                    return false;
                  }}
                  if (shellValue !== "all" && row.shellType !== shellValue) {{
                    return false;
                  }}
                  if (verdictValue !== "all" && row.bindingVerdict !== verdictValue) {{
                    return false;
                  }}
                  if (boundedContextValue !== "all" && row.governingBoundedContextRef !== boundedContextValue) {{
                    return false;
                  }}
                  return true;
                }});
                if (!state.visibleRows.some((row) => row.tupleId === state.selectedTupleId)) {{
                  state.selectedTupleId = state.visibleRows[0]?.tupleId ?? null;
                }}
                document.getElementById("filter-summary").textContent =
                  `${{state.visibleRows.length}} tuple(s) visible across the current filter lens.`;
                render();
              }}

              function moveSelection(delta) {{
                const ids = state.visibleRows.map((row) => row.tupleId);
                if (!ids.length) {{
                  return;
                }}
                const currentIndex = Math.max(ids.indexOf(state.selectedTupleId), 0);
                const nextIndex = Math.min(Math.max(currentIndex + delta, 0), ids.length - 1);
                state.selectedTupleId = ids[nextIndex];
                render();
                const nextNode = document.querySelector(`[data-focus-key="${{state.selectedTupleId}}"]`);
                nextNode?.focus();
              }}

              function buttonHandlers(tupleId) {{
                return {{
                  click() {{
                    state.selectedTupleId = tupleId;
                    render();
                  }},
                  keydown(event) {{
                    if (event.key === "ArrowDown") {{
                      event.preventDefault();
                      moveSelection(1);
                    }}
                    if (event.key === "ArrowUp") {{
                      event.preventDefault();
                      moveSelection(-1);
                    }}
                    if (event.key === "Home") {{
                      event.preventDefault();
                      state.selectedTupleId = state.visibleRows[0]?.tupleId ?? state.selectedTupleId;
                      render();
                    }}
                    if (event.key === "End") {{
                      event.preventDefault();
                      state.selectedTupleId = state.visibleRows[state.visibleRows.length - 1]?.tupleId ?? state.selectedTupleId;
                      render();
                    }}
                  }},
                }};
              }}

              function bindInteractiveNode(node, tupleId) {{
                const handlers = buttonHandlers(tupleId);
                node.addEventListener("click", handlers.click);
                node.addEventListener("keydown", handlers.keydown);
              }}

              function renderTupleCards(selected) {{
                const container = document.getElementById("tuple-grid");
                container.replaceChildren();
                state.visibleRows.forEach((row) => {{
                  const card = document.createElement("button");
                  card.type = "button";
                  card.className = "tuple-card";
                  card.setAttribute("data-testid", `tuple-card-${{row.tupleId}}`);
                  card.setAttribute("data-focus-key", row.tupleId);
                  card.setAttribute("data-selected", String(selected?.tupleId === row.tupleId));
                  card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:start;">
                      <strong>${{row.inventorySurfaceRef || row.routeFamilyRef}}</strong>
                      ${{verdictBadge(row.bindingVerdict)}}
                    </div>
                    <div class="meta">${{row.routeFamilyLabel}}</div>
                    <div class="mono">${{row.publishedAudienceSurfaceRef || "missing::publication"}}</div>
                    <div class="meta">${{row.shellSlug || "missing shell"}} · ${{row.governingBoundedContextRef || "missing context"}}</div>
                  `;
                  bindInteractiveNode(card, row.tupleId);
                  container.appendChild(card);
                }});
              }}

              function renderStrand(containerId, testIdPrefix, formatter, selected) {{
                const container = document.getElementById(containerId);
                container.replaceChildren();
                state.visibleRows.forEach((row) => {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "braid-button";
                  button.setAttribute("data-testid", `${{testIdPrefix}}-${{row.tupleId}}`);
                  button.setAttribute("data-selected", String(selected?.tupleId === row.tupleId));
                  button.innerHTML = formatter(row);
                  bindInteractiveNode(button, row.tupleId);
                  container.appendChild(button);
                }});
              }}

              function renderHeatmap(selected) {{
                const body = document.getElementById("heatmap-body");
                body.replaceChildren();
                state.visibleRows.forEach((row) => {{
                  const tr = document.createElement("tr");
                  tr.setAttribute("data-selected", String(selected?.tupleId === row.tupleId));
                  const toneClass = row.bindingVerdict === "blocked" ? "tone tone-blocked" : row.bindingVerdict === "drifted" ? "tone tone-drifted" : "tone";
                  tr.innerHTML = `
                    <td><button type="button" class="heatmap-button" data-testid="heatmap-row-${{row.tupleId}}">${{row.inventorySurfaceRef || row.routeFamilyRef}}</button></td>
                    <td>${{verdictBadge(row.bindingVerdict)}}</td>
                    <td><div class="${{toneClass}}" aria-hidden="true"></div></td>
                    <td class="mono">${{row.governingBoundedContextRef || "missing"}}</td>
                    <td class="meta">${{row.routeFamilyLabel}}</td>
                  `;
                  bindInteractiveNode(tr.querySelector("button"), row.tupleId);
                  body.appendChild(tr);
                }});
              }}

              function renderTableParity(selected) {{
                const body = document.getElementById("table-parity-body");
                body.replaceChildren();
                state.visibleRows.forEach((row) => {{
                  const tr = document.createElement("tr");
                  tr.setAttribute("data-selected", String(selected?.tupleId === row.tupleId));
                  tr.innerHTML = `
                    <td><button type="button" class="table-button" data-testid="table-row-${{row.tupleId}}">${{row.inventorySurfaceRef || row.routeFamilyRef}}</button></td>
                    <td class="mono">${{row.publishedAudienceSurfaceRef || "missing::publication"}}</td>
                    <td class="meta">${{row.shellSlug || "missing shell"}}</td>
                    <td>${{row.writabilityState}}</td>
                    <td class="meta">${{row.reasonRefs.join(", ")}}</td>
                  `;
                  bindInteractiveNode(tr.querySelector("button"), row.tupleId);
                  body.appendChild(tr);
                }});
              }}

              function renderInspector(selected) {{
                const container = document.getElementById("inspector-grid");
                const subtitle = document.getElementById("inspector-subtitle");
                container.replaceChildren();
                if (!selected) {{
                  subtitle.textContent = "No tuple selected";
                  return;
                }}
                subtitle.textContent = selected.tupleId;
                const blocks = [
                  {{
                    title: "Tuple scope",
                    body: `<strong>${{selected.inventorySurfaceRef || selected.routeFamilyRef}}</strong><div class="meta">${{selected.routeFamilyLabel}}</div><div class="mono">${{selected.publishedAudienceSurfaceRef || "missing::publication"}}</div>`,
                  }},
                  {{
                    title: "Shell and runtime",
                    body: `<div class="meta">${{selected.shellType}} · ${{selected.shellSlug || "missing shell"}}</div><div class="mono">${{selected.runtimePublicationBundleRef || "missing runtime publication"}}</div><div class="mono">${{selected.releasePublicationParityRef || "missing release parity"}}</div>`,
                  }},
                  {{
                    title: "Authority members",
                    body: `<div class="mono">${{selected.frontendContractManifestRef || "missing frontend manifest"}}</div><div class="mono">${{selected.surfaceRouteContractRef || "missing route contract"}}</div><div class="mono">${{selected.audienceSurfaceRuntimeBindingRef || "missing runtime binding"}}</div><div class="mono">${{selected.projectionContractVersionSetRef || "missing projection set"}}</div>`,
                  }},
                  {{
                    title: "Reasons",
                    body: `<div class="meta">${{selected.reasonRefs.join(", ") || "none"}}</div><p class="summary-copy">${{selected.notes}}</p>`,
                  }},
                ];
                blocks.forEach((block) => {{
                  const node = document.createElement("section");
                  node.className = "inspector-block";
                  node.innerHTML = `<h3 style="margin-top:0; margin-bottom:8px; color:var(--text-strong);">${{block.title}}</h3>${{block.body}}`;
                  container.appendChild(node);
                }});
              }}

              function updateStats() {{
                document.getElementById("stat-tuples").textContent = String(payload.summary.tuple_count);
                document.getElementById("stat-partial").textContent = String(payload.summary.partial_count);
                document.getElementById("stat-blocked").textContent = String(payload.summary.blocked_count);
                document.getElementById("stat-drifted").textContent = String(payload.summary.drifted_count);
              }}

              function render() {{
                const selected = state.rows.find((row) => row.tupleId === state.selectedTupleId) || state.visibleRows[0] || null;
                if (selected) {{
                  state.selectedTupleId = selected.tupleId;
                }}
                renderTupleCards(selected);
                renderStrand(
                  "strand-surface",
                  "braid-surface",
                  (row) => `<strong>${{row.inventorySurfaceRef || row.routeFamilyRef}}</strong><div class="meta">${{row.inventorySurfaceLabel}}</div><div class="mono">${{row.gatewaySurfacePrimaryRef || "missing gateway"}}</div>`,
                  selected,
                );
                renderStrand(
                  "strand-publication",
                  "braid-publication",
                  (row) => `<strong>${{row.publishedAudienceSurfaceRef || "missing::publication"}}</strong><div class="meta">${{row.frontendContractManifestRef || "missing frontend manifest"}}</div><div class="mono">${{row.designContractPublicationBundleRef || "missing design bundle"}}</div>`,
                  selected,
                );
                renderStrand(
                  "strand-shell",
                  "braid-shell",
                  (row) => `<strong>${{row.shellSlug || "missing shell"}}</strong><div class="meta">${{row.shellAudienceSurfaceRef || "no shell audience surface"}}</div><div class="mono">${{row.runtimePublicationBundleRef || "missing runtime publication"}}</div>`,
                  selected,
                );
                renderHeatmap(selected);
                renderTableParity(selected);
                renderInspector(selected);
              }}

              function wireFilters() {{
                [audienceFilter, shellFilter, verdictFilter, boundedContextFilter].forEach((node) => {{
                  node.addEventListener("change", applyFilters);
                }});
              }}

              document.body.dataset.reducedMotion = String(
                window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              );
              setFilterOptions();
              wireFilters();
              updateStats();
              applyFilters();
            </script>
          </body>
        </html>
        """
    ).strip()


def main() -> None:
    catalog, matrix_rows, edge_rows, blocked_or_partial_rows, verdicts = build_catalog()
    docs = build_docs(catalog)

    write_json(SURFACE_AUTHORITY_TUPLES_PATH, catalog)
    write_json(VERDICTS_PATH, verdicts)
    write_csv(
        INTEGRATION_MATRIX_PATH,
        matrix_rows,
        [
            "tupleId",
            "inventorySurfaceRef",
            "publishedAudienceSurfaceRef",
            "shellType",
            "shellSlug",
            "routeFamilyRef",
            "governingBoundedContextRef",
            "canonicalObjectDescriptorRef",
            "frontendContractManifestRef",
            "surfaceRouteContractRef",
            "designContractPublicationBundleRef",
            "runtimePublicationBundleRef",
            "audienceSurfaceRuntimeBindingRef",
            "releasePublicationParityRef",
            "projectionContractVersionSetRef",
            "bindingVerdict",
            "writabilityState",
            "calmState",
            "visibilityCoverageRefs",
            "reasonRefs",
            "notes",
        ],
    )
    write_csv(
        ROUTE_TO_SHELL_EDGES_PATH,
        edge_rows,
        [
            "edgeId",
            "edgeType",
            "tupleId",
            "fromRef",
            "toRef",
            "routeFamilyRef",
            "shellType",
            "bindingVerdict",
            "reasonRefs",
        ],
    )
    write_csv(
        BLOCKED_OR_PARTIAL_ROWS_PATH,
        blocked_or_partial_rows,
        [
            "tupleId",
            "inventorySurfaceRef",
            "publishedAudienceSurfaceRef",
            "routeFamilyRef",
            "shellType",
            "bindingVerdict",
            "browserPostureState",
            "accessibilityCoverageState",
            "reasonRefs",
            "notes",
        ],
    )
    write_text(FOUNDATION_DOC_PATH, docs["foundation"])
    write_text(TUPLE_CONTRACT_DOC_PATH, docs["tuple_contract"])
    write_text(DRIFT_RULES_DOC_PATH, docs["drift_rules"])
    write_text(BINDING_MAP_DOC_PATH, docs["binding_map"])
    write_text(STUDIO_PATH, build_html(catalog))


if __name__ == "__main__":
    main()
