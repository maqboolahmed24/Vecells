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

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "runtime-publication"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

SEED_PARITY_RULES_PATH = DATA_DIR / "release_publication_parity_rules.json"
VERIFICATION_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
DESIGN_PUBLICATION_PATH = DATA_DIR / "design_contract_publication_bundles.json"
BUILD_PROVENANCE_PATH = DATA_DIR / "build_provenance_manifest.json"

BUNDLE_CATALOG_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_CATALOG_PATH = DATA_DIR / "release_publication_parity_records.json"
BUNDLE_SCHEMA_PATH = DATA_DIR / "runtime_publication_bundle_schema.json"
PARITY_SCHEMA_PATH = DATA_DIR / "release_publication_parity_schema.json"
DEPENDENCY_MATRIX_PATH = DATA_DIR / "publication_tuple_dependency_matrix.csv"

BUNDLE_DOC_PATH = DOCS_DIR / "94_runtime_publication_bundle_design.md"
PARITY_DOC_PATH = DOCS_DIR / "94_release_publication_parity_rules.md"
CONSOLE_PATH = DOCS_DIR / "94_runtime_publication_bundle_console.html"

WORKFLOW_CI_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"

TASK_ID = "par_094"
VISUAL_MODE = "Runtime_Publication_Bundle_Console"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_094_WAVE_OBSERVATION_POLICY",
        "title": "Wave observation remains a later authority lane",
        "bounded_seam": (
            "par_094 publishes machine-readable bundle and parity refusal states now, "
            "but later wave dwell and widening policy still owns tenant-by-tenant release observation."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_094_CANARY_WIDENING_GUARDS",
        "title": "Canary widening policy is intentionally deferred",
        "bounded_seam": (
            "The bundle console exposes publishable versus frozen posture, but it does not widen traffic "
            "or waive release-trust evidence on its own."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_094_PRODUCTION_ARTIFACT_REGISTRY",
        "title": "Production registry hardening can layer later",
        "bounded_seam": (
            "Local, preview, and non-production use the same tuple law now. A later production registry may "
            "strengthen storage and promotion controls without changing the authoritative bundle shape."
        ),
    },
]

SOURCE_PRECEDENCE = [
    "prompt/094.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/phase-0-the-foundation-protocol.md#Route intent, command settlement, release freeze, channel freeze, and assurance trust",
    "blueprint/platform-frontend-blueprint.md#Surface publication authority",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 105",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 113",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/build_provenance_manifest.json",
]


def require(condition: bool, code: str) -> None:
    if not condition:
        raise RuntimeError(code)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_094_MISSING::{path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


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


def stable_stringify(value: Any) -> str:
    if value is None or not isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(stable_stringify(entry) for entry in value) + "]"
    entries = sorted(value.items(), key=lambda item: item[0])
    return "{" + ",".join(
        f"{json.dumps(key, separators=(',', ':'))}:{stable_stringify(entry)}"
        for key, entry in entries
    ) + "}"


def fnv64(value: str, seed: int) -> str:
    hash_value = seed
    for char in value:
        hash_value ^= ord(char)
        hash_value = (hash_value * 1099511628211) & 0xFFFFFFFFFFFFFFFF
    return format(hash_value, "016x")


def stable_hash(value: Any) -> str:
    encoded = stable_stringify(value)
    return "".join(
        [
            fnv64(encoded, 1469598103934665603),
            fnv64(f"{encoded}::vecells", 1099511628211),
            fnv64(encoded[::-1], 7809847782465536322),
            fnv64(f"sig::{len(encoded)}", 11400714785074694791),
        ]
    )


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(values))


def severity_rank(row: dict[str, Any]) -> tuple[int, str]:
    provenance_state = row["provenanceState"]
    consumption_state = row["runtimeConsumptionState"]
    artifact_state = row["artifactState"]
    if provenance_state == "revoked" or consumption_state == "revoked" or artifact_state == "revoked":
        return (0, row["buildProvenanceRecordId"])
    if provenance_state == "quarantined" or consumption_state == "quarantined":
        return (1, row["buildProvenanceRecordId"])
    if consumption_state == "blocked":
        return (2, row["buildProvenanceRecordId"])
    if provenance_state in {"drifted", "superseded"} or consumption_state == "superseded":
        return (3, row["buildProvenanceRecordId"])
    return (4, row["buildProvenanceRecordId"])


def derive_bundle_state(provenance_row: dict[str, Any] | None) -> str:
    if provenance_row is None:
        return "conflict"
    provenance_state = provenance_row["provenanceState"]
    consumption_state = provenance_row["runtimeConsumptionState"]
    artifact_state = provenance_row["artifactState"]
    if provenance_state == "revoked" or consumption_state == "revoked" or artifact_state == "revoked":
        return "withdrawn"
    if provenance_state == "quarantined" or consumption_state == "quarantined":
        return "conflict"
    if consumption_state == "blocked" or provenance_state in {"drifted", "superseded"} or consumption_state == "superseded":
        return "stale"
    return "published"


def derive_parity_state(bundle_state: str) -> str:
    return {
        "published": "exact",
        "stale": "stale",
        "conflict": "conflict",
        "withdrawn": "withdrawn",
    }[bundle_state]


def derive_route_exposure_state(parity_state: str, binding_ceiling_reasons: list[str]) -> str:
    if parity_state == "withdrawn":
        return "withdrawn"
    if parity_state != "exact":
        return "frozen"
    return "constrained" if binding_ceiling_reasons else "publishable"


def build_catalogs() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    seed = load_json(SEED_PARITY_RULES_PATH)
    verification = load_json(VERIFICATION_MATRIX_PATH)
    topology = load_json(RUNTIME_TOPOLOGY_PATH)
    gateway = load_json(GATEWAY_SURFACES_PATH)
    frontend = load_json(FRONTEND_MANIFESTS_PATH)
    design = load_json(DESIGN_PUBLICATION_PATH)
    provenance = load_json(BUILD_PROVENANCE_PATH)

    release_candidates = {row["releaseId"]: row for row in seed["releaseCandidates"]}
    approval_freezes = {row["releaseCandidateRef"]: row for row in seed["releaseApprovalFreezes"]}
    seed_bundles = {row["releaseRef"]: row for row in seed["runtimePublicationBundles"]}
    seed_parities = {row["releaseRef"]: row for row in seed["releasePublicationParityRecords"]}
    verification_matrices = {row["releaseRef"]: row for row in verification["releaseContractVerificationMatrices"]}
    frontend_manifests = {
        row["frontendContractManifestId"]: row for row in frontend["frontendContractManifests"]
    }
    design_bundles = {
        row["designContractPublicationBundleId"]: row for row in design["designContractPublicationBundles"]
    }
    projection_families = {
        row["projectionContractFamilyId"]: row for row in frontend["projectionContractFamilies"]
    }
    projection_version_sets = {
        row["projectionContractVersionSetId"]: row for row in frontend["projectionContractVersionSets"]
    }
    gateway_surfaces = gateway["gateway_surfaces"]
    trust_boundaries = topology["trust_zone_boundaries"]
    runtime_workload_families = topology["runtime_workload_families"]

    provenance_by_release: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in provenance["buildProvenanceRecords"]:
        provenance_by_release[row["releaseRef"]].append(row)

    bundle_records: list[dict[str, Any]] = []
    parity_records: list[dict[str, Any]] = []
    dependency_rows: list[dict[str, Any]] = []
    surface_rows: list[dict[str, Any]] = []
    refusal_rows: list[dict[str, Any]] = []
    reason_catalog: dict[str, dict[str, str]] = {}

    all_gateway_refs = unique_sorted([row["surfaceId"] for row in gateway_surfaces])
    all_trust_boundary_refs = unique_sorted(
        [
            boundary["boundary_id"]
            for boundary in trust_boundaries
            if boundary.get("boundary_state") == "allowed"
        ]
    )

    for release_ref, candidate in release_candidates.items():
        require(release_ref in verification_matrices, f"PREREQUISITE_GAP_094_MATRIX::{release_ref}")
        require(release_ref in approval_freezes, f"PREREQUISITE_GAP_094_APPROVAL_FREEZE::{release_ref}")
        require(release_ref in seed_bundles, f"PREREQUISITE_GAP_094_SEED_BUNDLE::{release_ref}")
        require(release_ref in seed_parities, f"PREREQUISITE_GAP_094_SEED_PARITY::{release_ref}")

        seed_bundle = seed_bundles[release_ref]
        seed_parity = seed_parities[release_ref]
        freeze = approval_freezes[release_ref]
        matrix = verification_matrices[release_ref]
        selected_provenance = None
        if provenance_by_release[release_ref]:
            selected_provenance = sorted(provenance_by_release[release_ref], key=severity_rank)[0]

        environment_ring = candidate["environmentRing"]
        workload_rows = [
            row for row in runtime_workload_families if row["environment_ring"] == environment_ring
        ]
        workload_family_refs = unique_sorted(
            [row["runtime_workload_family_ref"] for row in workload_rows]
        )

        frontend_rows = [frontend_manifests[ref] for ref in matrix["frontendContractManifestRefs"]]
        route_family_refs = unique_sorted(
            [
                route_family
                for row in frontend_rows
                for route_family in row["routeFamilyRefs"]
            ]
        )
        audience_surface_refs = unique_sorted([row["audienceSurface"] for row in frontend_rows])
        surface_publication_refs = unique_sorted([row["surfacePublicationRef"] for row in frontend_rows])
        surface_runtime_binding_refs = unique_sorted(
            [row["audienceSurfaceRuntimeBindingRef"] for row in frontend_rows]
        )
        route_freeze_refs = unique_sorted(
            [
                route_freeze_ref
                for row in frontend_rows
                for route_freeze_ref in row["routeFreezeDispositionRefs"]
            ]
        )
        design_bundle_refs = unique_sorted(
            [row["designContractPublicationBundleRef"] for row in frontend_rows]
        )
        design_rows = [design_bundles[ref] for ref in design_bundle_refs]
        design_digest_refs = unique_sorted([row["designContractDigestRef"] for row in design_rows])
        design_lint_refs = unique_sorted([row["lintVerdictRef"] for row in design_rows])
        projection_set_rows = [
            projection_version_sets[ref] for ref in matrix["projectionContractVersionSetRefs"]
        ]
        projection_family_refs = unique_sorted(
            [
                family_ref
                for row in projection_set_rows
                for family_ref in row["projectionContractFamilyRefs"]
            ]
        )
        projection_version_refs = unique_sorted(
            [
                projection_families[family_ref]["currentProjectionContractVersionRef"]
                for family_ref in projection_family_refs
            ]
        )
        topology_tuple_hash = stable_hash(
            {
                "runtimeTopologyManifestRef": str(RUNTIME_TOPOLOGY_PATH.relative_to(ROOT)),
                "workloadFamilyRefs": workload_family_refs,
                "trustZoneBoundaryRefs": all_trust_boundary_refs,
                "gatewaySurfaceRefs": all_gateway_refs,
            }
        )

        bundle_tuple_payload = {
            "topologyTupleHash": topology_tuple_hash,
            "routeContractDigestRefs": unique_sorted(matrix["routeContractDigestRefs"]),
            "frontendContractManifestRefs": unique_sorted(matrix["frontendContractManifestRefs"]),
            "frontendContractDigestRefs": unique_sorted(matrix["frontendContractDigestRefs"]),
            "designContractPublicationBundleRefs": unique_sorted(design_bundle_refs),
            "designContractDigestRefs": unique_sorted(design_digest_refs),
            "designContractLintVerdictRefs": unique_sorted(design_lint_refs),
            "projectionContractFamilyRefs": unique_sorted(projection_family_refs),
            "projectionContractVersionRefs": unique_sorted(projection_version_refs),
            "projectionContractVersionSetRefs": unique_sorted(matrix["projectionContractVersionSetRefs"]),
            "projectionCompatibilityDigestRefs": unique_sorted(
                [row["projectionCompatibilityDigestRef"] for row in projection_set_rows]
            ),
            "projectionQueryContractDigestRefs": unique_sorted(matrix["projectionQueryContractDigestRefs"]),
            "mutationCommandContractDigestRefs": unique_sorted(matrix["mutationCommandContractDigestRefs"]),
            "liveUpdateChannelDigestRefs": unique_sorted(matrix["liveUpdateChannelDigestRefs"]),
            "clientCachePolicyDigestRefs": unique_sorted(matrix["clientCachePolicyDigestRefs"]),
            "releaseContractVerificationMatrixRef": matrix["releaseContractVerificationMatrixId"],
            "releaseContractMatrixHash": matrix["matrixHash"],
            "commandSettlementSchemaSetRef": matrix["commandSettlementSchemaSetRef"],
            "transitionEnvelopeSchemaSetRef": matrix["transitionEnvelopeSchemaSetRef"],
            "recoveryDispositionSetRef": seed_bundle["recoveryDispositionSetRef"],
            "routeFreezeDispositionRefs": unique_sorted(route_freeze_refs),
            "continuityEvidenceContractRefs": unique_sorted(matrix["continuityEvidenceContractRefs"]),
            "surfacePublicationRefs": unique_sorted(surface_publication_refs),
            "surfaceRuntimeBindingRefs": unique_sorted(surface_runtime_binding_refs),
            "buildProvenanceRef": selected_provenance["buildProvenanceRecordId"]
            if selected_provenance
            else f"PREREQUISITE_GAP_NO_BUILD_PROVENANCE::{release_ref}",
            "provenanceVerificationState": selected_provenance["provenanceState"]
            if selected_provenance
            else "quarantined",
            "provenanceConsumptionState": selected_provenance["runtimeConsumptionState"]
            if selected_provenance
            else "blocked",
            "allowedLiveChannelAbsenceReasonRefs": [],
        }
        bundle_state = derive_bundle_state(selected_provenance)
        bundle_refusal_reasons: list[str] = []
        if selected_provenance is None:
            bundle_refusal_reasons.append("PREREQUISITE_GAP_NO_BUILD_PROVENANCE")
        elif bundle_state != "published":
            bundle_refusal_reasons.append(f"BUILD_PROVENANCE_{bundle_state.upper()}")
        bundle_tuple_hash = stable_hash(bundle_tuple_payload)

        bundle_record = {
            "runtimePublicationBundleId": f"rpb::{environment_ring}::authoritative",
            "releaseRef": release_ref,
            "environmentRing": environment_ring,
            "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
            "watchTupleHash": seed_bundle["watchTupleHash"],
            "runtimeTopologyManifestRef": str(RUNTIME_TOPOLOGY_PATH.relative_to(ROOT)),
            "workloadFamilyRefs": workload_family_refs,
            "trustZoneBoundaryRefs": all_trust_boundary_refs,
            "gatewaySurfaceRefs": all_gateway_refs,
            "routeFamilyRefs": route_family_refs,
            "audienceSurfaceRefs": audience_surface_refs,
            "routeContractDigestRefs": matrix["routeContractDigestRefs"],
            "frontendContractManifestRefs": matrix["frontendContractManifestRefs"],
            "frontendContractDigestRefs": matrix["frontendContractDigestRefs"],
            "designContractPublicationBundleRefs": design_bundle_refs,
            "designContractDigestRefs": design_digest_refs,
            "designContractLintVerdictRefs": design_lint_refs,
            "projectionContractFamilyRefs": projection_family_refs,
            "projectionContractVersionRefs": projection_version_refs,
            "projectionContractVersionSetRefs": matrix["projectionContractVersionSetRefs"],
            "projectionCompatibilityDigestRefs": [
                row["projectionCompatibilityDigestRef"] for row in projection_set_rows
            ],
            "projectionQueryContractDigestRefs": matrix["projectionQueryContractDigestRefs"],
            "mutationCommandContractDigestRefs": matrix["mutationCommandContractDigestRefs"],
            "liveUpdateChannelDigestRefs": matrix["liveUpdateChannelDigestRefs"],
            "clientCachePolicyDigestRefs": matrix["clientCachePolicyDigestRefs"],
            "releaseContractVerificationMatrixRef": matrix["releaseContractVerificationMatrixId"],
            "releaseContractMatrixHash": matrix["matrixHash"],
            "commandSettlementSchemaSetRef": matrix["commandSettlementSchemaSetRef"],
            "transitionEnvelopeSchemaSetRef": matrix["transitionEnvelopeSchemaSetRef"],
            "recoveryDispositionSetRef": seed_bundle["recoveryDispositionSetRef"],
            "routeFreezeDispositionRefs": route_freeze_refs,
            "continuityEvidenceContractRefs": matrix["continuityEvidenceContractRefs"],
            "surfacePublicationRefs": surface_publication_refs,
            "surfaceRuntimeBindingRefs": surface_runtime_binding_refs,
            "publicationParityRef": f"rpp::{environment_ring}::authoritative",
            "topologyTupleHash": topology_tuple_hash,
            "bundleTupleHash": bundle_tuple_hash,
            "buildProvenanceRef": bundle_tuple_payload["buildProvenanceRef"],
            "selectedBuildFamilyRef": selected_provenance["buildFamilyRef"] if selected_provenance else None,
            "provenanceVerificationState": bundle_tuple_payload["provenanceVerificationState"],
            "provenanceConsumptionState": bundle_tuple_payload["provenanceConsumptionState"],
            "publicationState": bundle_state,
            "driftState": "none" if bundle_state == "published" else bundle_state,
            "validationState": "valid" if bundle_state == "published" else "blocked",
            "publishedAt": selected_provenance["signedAt"] if selected_provenance else GENERATED_AT,
            "refusalReasonRefs": bundle_refusal_reasons,
            "source_refs": SOURCE_PRECEDENCE[-7:],
        }
        bundle_records.append(bundle_record)

        binding_ceiling_reasons = []
        if any(row["browserPostureState"] != "publishable_live" for row in frontend_rows):
            binding_ceiling_reasons.append(
                "One or more frontend manifests remain constrained or recovery-only instead of publishable_live."
            )
        if any(row["accessibilityCoverageState"] != "complete" for row in frontend_rows):
            binding_ceiling_reasons.append(
                "Accessibility coverage is still degraded for at least one audience surface."
            )
        if any("pending" in ref or "blocked" in ref or "failed" in ref for ref in design_lint_refs):
            binding_ceiling_reasons.append(
                "Design contract lint verdicts are not fully passed across the bundle."
            )

        parity_state = derive_parity_state(bundle_state)
        drift_reason_ids = bundle_refusal_reasons.copy()
        matrix_group_states = {
            "artifacts": "exact" if bundle_state == "published" else "stale" if bundle_state == "stale" else bundle_state,
            "topology": "exact",
            "manifests": "exact",
            "design_bundles": "exact",
            "schemas": "exact",
            "provenance": "exact" if bundle_state == "published" else "stale" if bundle_state == "stale" else bundle_state,
            "recovery_watch": "exact",
            "live_cache": "exact",
        }
        route_exposure_state = derive_route_exposure_state(
            parity_state,
            binding_ceiling_reasons,
        )
        continuity_digests = [
            f"continuity-digest::{stable_hash({'continuityEvidenceRef': ref, 'releaseRef': release_ref})}"
            for ref in matrix["continuityEvidenceContractRefs"]
        ]
        parity_record = {
            "publicationParityRecordId": f"rpp::{environment_ring}::authoritative",
            "releaseRef": release_ref,
            "environmentRing": environment_ring,
            "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
            "promotionIntentRef": (candidate.get("promotionIntentRefs") or [None])[0],
            "watchTupleHash": seed_parity["watchTupleHash"],
            "waveEligibilitySnapshotRef": seed_parity["waveEligibilitySnapshotRef"],
            "runtimePublicationBundleRef": bundle_record["runtimePublicationBundleId"],
            "releaseContractVerificationMatrixRef": matrix["releaseContractVerificationMatrixId"],
            "releaseContractMatrixHash": matrix["matrixHash"],
            "routeContractDigestRefs": matrix["routeContractDigestRefs"],
            "frontendContractDigestRefs": matrix["frontendContractDigestRefs"],
            "projectionCompatibilityDigestRefs": bundle_record["projectionCompatibilityDigestRefs"],
            "surfacePublicationRefs": surface_publication_refs,
            "surfaceRuntimeBindingRefs": surface_runtime_binding_refs,
            "activeChannelFreezeRefs": seed_parity["activeChannelFreezeRefs"],
            "recoveryDispositionRefs": matrix["recoveryDispositionRefs"],
            "continuityEvidenceDigestRefs": continuity_digests,
            "provenanceVerificationState": bundle_record["provenanceVerificationState"],
            "provenanceConsumptionState": bundle_record["provenanceConsumptionState"],
            "bundleTupleHash": bundle_record["bundleTupleHash"],
            "parityState": parity_state,
            "routeExposureState": route_exposure_state,
            "evaluatedAt": GENERATED_AT,
            "driftState": "none" if parity_state == "exact" else parity_state,
            "driftReasonIds": drift_reason_ids,
            "bindingCeilingReasons": binding_ceiling_reasons,
            "matrixGroupStates": matrix_group_states,
            "refusalReasonRefs": drift_reason_ids,
            "source_refs": SOURCE_PRECEDENCE[-7:],
        }
        parity_records.append(parity_record)

        for stage_id, refs, member_kind, state in [
            ("topology", workload_family_refs, "workload_family", "exact"),
            ("trust", all_trust_boundary_refs, "trust_zone_boundary", "exact"),
            ("gateway", all_gateway_refs, "gateway_surface", "exact"),
            ("frontend", matrix["frontendContractManifestRefs"], "frontend_manifest", "exact"),
            ("design", design_bundle_refs, "design_publication_bundle", "exact"),
            ("projection", bundle_record["projectionContractVersionSetRefs"], "projection_contract_version_set", "exact"),
            ("mutation", matrix["mutationCommandContractDigestRefs"], "mutation_command_digest", "exact"),
            ("live", matrix["liveUpdateChannelDigestRefs"], "live_update_digest", "exact"),
            ("cache", matrix["clientCachePolicyDigestRefs"], "client_cache_policy_digest", "exact"),
            ("provenance", [bundle_record["buildProvenanceRef"]], "build_provenance", bundle_state),
            ("recovery", matrix["recoveryDispositionRefs"], "recovery_disposition", "exact"),
            ("continuity", matrix["continuityEvidenceContractRefs"], "continuity_evidence", "exact"),
        ]:
            dependency_rows.append(
                {
                    "release_ref": release_ref,
                    "environment_ring": environment_ring,
                    "runtime_publication_bundle_id": bundle_record["runtimePublicationBundleId"],
                    "publication_parity_record_id": parity_record["publicationParityRecordId"],
                    "tuple_stage": stage_id,
                    "member_kind": member_kind,
                    "member_count": len(refs),
                    "member_refs": "|".join(refs[:6]),
                    "stage_state": state,
                    "blocking_effect": "fail_closed" if state != "exact" else "publishable",
                }
            )

        for frontend_row in frontend_rows:
            design_row = design_bundles[frontend_row["designContractPublicationBundleRef"]]
            row_binding_ceiling_reasons = []
            if frontend_row["browserPostureState"] != "publishable_live":
                row_binding_ceiling_reasons.append(
                    f"Browser posture is {frontend_row['browserPostureState']} for {frontend_row['audienceSurfaceLabel']}."
                )
            if frontend_row["accessibilityCoverageState"] != "complete":
                row_binding_ceiling_reasons.append(
                    f"Accessibility coverage is {frontend_row['accessibilityCoverageState']}."
                )
            if "pending" in design_row["lintVerdictRef"] or "failed" in design_row["lintVerdictRef"]:
                row_binding_ceiling_reasons.append(
                    f"Design lint verdict is {design_row['lintVerdictRef']}."
                )
            row_refusal_reasons = bundle_refusal_reasons.copy()
            if frontend_row["driftState"] != "clear":
                row_refusal_reasons.append(f"SURFACE_{frontend_row['driftState'].upper()}")
            row_id = f"{release_ref}--{frontend_row['audienceSurface']}"
            surface_row = {
                "rowId": row_id,
                "releaseRef": release_ref,
                "environmentRing": environment_ring,
                "runtimePublicationBundleRef": bundle_record["runtimePublicationBundleId"],
                "publicationParityRecordRef": parity_record["publicationParityRecordId"],
                "audienceSurface": frontend_row["audienceSurface"],
                "audienceSurfaceLabel": frontend_row["audienceSurfaceLabel"],
                "routeFamilyRefs": frontend_row["routeFamilyRefs"],
                "gatewaySurfaceRefs": frontend_row["gatewaySurfaceRefs"],
                "publicationState": bundle_record["publicationState"],
                "parityState": parity_record["parityState"],
                "routeExposureState": parity_record["routeExposureState"],
                "provenanceVerificationState": bundle_record["provenanceVerificationState"],
                "provenanceConsumptionState": bundle_record["provenanceConsumptionState"],
                "driftState": "none" if parity_record["parityState"] == "exact" else parity_record["parityState"],
                "browserPostureState": frontend_row["browserPostureState"],
                "accessibilityCoverageState": frontend_row["accessibilityCoverageState"],
                "designPublicationState": design_row["publicationState"],
                "designLintVerdictRef": design_row["lintVerdictRef"],
                "surfacePublicationRef": frontend_row["surfacePublicationRef"],
                "surfaceRuntimeBindingRef": frontend_row["audienceSurfaceRuntimeBindingRef"],
                "frontendContractManifestRef": frontend_row["frontendContractManifestId"],
                "frontendContractDigestRef": frontend_row["frontendContractDigestRef"],
                "projectionCompatibilityDigestRef": frontend_row["projectionCompatibilityDigestRef"],
                "clientCachePolicyRefs": frontend_row["clientCachePolicyRefs"],
                "refusalReasonRefs": unique_sorted(row_refusal_reasons),
                "bindingCeilingReasons": row_binding_ceiling_reasons,
            }
            surface_rows.append(surface_row)

            for reason in unique_sorted(row_refusal_reasons):
                reason_catalog.setdefault(
                    reason,
                    {
                        "title": reason.replace("_", " ").title(),
                        "summary": "Fail-closed publication reason generated by the runtime publication authority.",
                    },
                )
                refusal_rows.append(
                    {
                        "rowId": row_id,
                        "releaseRef": release_ref,
                        "environmentRing": environment_ring,
                        "audienceSurface": frontend_row["audienceSurface"],
                        "reasonId": reason,
                        "kind": "refusal",
                        "detail": reason_catalog[reason]["summary"],
                    }
                )
            for index, reason in enumerate(row_binding_ceiling_reasons, start=1):
                reason_id = f"BINDING_CEILING_{index}"
                reason_catalog.setdefault(
                    reason_id,
                    {
                        "title": f"Binding ceiling {index}",
                        "summary": reason,
                    },
                )
                refusal_rows.append(
                    {
                        "rowId": row_id,
                        "releaseRef": release_ref,
                        "environmentRing": environment_ring,
                        "audienceSurface": frontend_row["audienceSurface"],
                        "reasonId": reason_id,
                        "kind": "ceiling",
                        "detail": reason,
                    }
                )

        bundle_record["memberRows"] = [
            {
                "stageId": "topology",
                "label": "Topology and workloads",
                "memberCount": len(workload_family_refs),
                "memberRefs": workload_family_refs,
                "state": "exact",
            },
            {
                "stageId": "gateway",
                "label": "Gateway and audience surfaces",
                "memberCount": len(all_gateway_refs),
                "memberRefs": all_gateway_refs,
                "state": "exact",
            },
            {
                "stageId": "frontend",
                "label": "Frontend manifests",
                "memberCount": len(matrix["frontendContractManifestRefs"]),
                "memberRefs": matrix["frontendContractManifestRefs"],
                "state": "exact",
            },
            {
                "stageId": "design",
                "label": "Design publications",
                "memberCount": len(design_bundle_refs),
                "memberRefs": design_bundle_refs,
                "state": "exact",
            },
            {
                "stageId": "projection",
                "label": "Projection and query digests",
                "memberCount": len(bundle_record["projectionContractVersionSetRefs"]),
                "memberRefs": bundle_record["projectionContractVersionSetRefs"],
                "state": "exact",
            },
            {
                "stageId": "live_cache",
                "label": "Live channels and cache policy",
                "memberCount": len(matrix["liveUpdateChannelDigestRefs"]) + len(matrix["clientCachePolicyDigestRefs"]),
                "memberRefs": matrix["liveUpdateChannelDigestRefs"] + matrix["clientCachePolicyDigestRefs"],
                "state": "exact",
            },
            {
                "stageId": "provenance",
                "label": "Build provenance",
                "memberCount": 1,
                "memberRefs": [bundle_record["buildProvenanceRef"]],
                "state": bundle_state,
            },
        ]

    summary = {
        "release_candidate_count": len(bundle_records),
        "runtime_publication_bundle_count": len(bundle_records),
        "release_publication_parity_record_count": len(parity_records),
        "surface_authority_row_count": len(surface_rows),
        "dependency_row_count": len(dependency_rows),
        "published_bundle_count": Counter(row["publicationState"] for row in bundle_records)["published"],
        "stale_bundle_count": Counter(row["publicationState"] for row in bundle_records)["stale"],
        "conflict_bundle_count": Counter(row["publicationState"] for row in bundle_records)["conflict"],
        "withdrawn_bundle_count": Counter(row["publicationState"] for row in bundle_records)["withdrawn"],
        "exact_parity_count": Counter(row["parityState"] for row in parity_records)["exact"],
        "constrained_route_exposure_count": Counter(row["routeExposureState"] for row in parity_records)["constrained"],
        "frozen_route_exposure_count": Counter(row["routeExposureState"] for row in parity_records)["frozen"],
        "withdrawn_route_exposure_count": Counter(row["routeExposureState"] for row in parity_records)["withdrawn"],
        "follow_on_dependency_count": len(FOLLOW_ON_DEPENDENCIES),
    }

    upstream_inputs = [
        str(path.relative_to(ROOT))
        for path in [
            SEED_PARITY_RULES_PATH,
            VERIFICATION_MATRIX_PATH,
            RUNTIME_TOPOLOGY_PATH,
            GATEWAY_SURFACES_PATH,
            FRONTEND_MANIFESTS_PATH,
            DESIGN_PUBLICATION_PATH,
            BUILD_PROVENANCE_PATH,
        ]
    ]
    bundle_catalog = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Generate authoritative runtime publication bundles that join topology, gateway, "
            "frontend, design, projection, cache, live-channel, provenance, recovery, and continuity tuples."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream_inputs,
        "summary": summary,
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "releaseCandidates": list(release_candidates.values()),
        "runtimePublicationBundles": bundle_records,
    }
    parity_catalog = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Generate machine-readable release publication parity records and fail-closed route exposure posture."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream_inputs,
        "summary": summary,
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "releasePublicationParityRecords": parity_records,
        "surfaceAuthorityRows": surface_rows,
        "refusalRows": refusal_rows,
        "reasonCatalog": [
            {"reasonId": reason_id, **payload}
            for reason_id, payload in sorted(reason_catalog.items())
        ],
    }
    ui_data = {
        "summary": summary,
        "bundles": bundle_records,
        "parities": parity_records,
        "surfaceRows": surface_rows,
        "refusalRows": refusal_rows,
        "reasonCatalog": parity_catalog["reasonCatalog"],
    }
    return bundle_catalog, parity_catalog, dependency_rows, ui_data


def build_bundle_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "vecells/runtime-publication-bundle.schema.json",
        "title": "RuntimePublicationBundle",
        "type": "object",
        "required": [
            "runtimePublicationBundleId",
            "releaseRef",
            "environmentRing",
            "releaseApprovalFreezeRef",
            "runtimeTopologyManifestRef",
            "gatewaySurfaceRefs",
            "frontendContractManifestRefs",
            "designContractPublicationBundleRefs",
            "releaseContractVerificationMatrixRef",
            "releaseContractMatrixHash",
            "bundleTupleHash",
            "buildProvenanceRef",
            "publicationState",
        ],
        "properties": {
            "runtimePublicationBundleId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "environmentRing": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "runtimeTopologyManifestRef": {"type": "string"},
            "gatewaySurfaceRefs": {"type": "array", "items": {"type": "string"}},
            "frontendContractManifestRefs": {"type": "array", "items": {"type": "string"}},
            "designContractPublicationBundleRefs": {"type": "array", "items": {"type": "string"}},
            "releaseContractVerificationMatrixRef": {"type": "string"},
            "releaseContractMatrixHash": {"type": "string"},
            "bundleTupleHash": {"type": "string"},
            "buildProvenanceRef": {"type": "string"},
            "publicationState": {
                "enum": ["published", "stale", "conflict", "withdrawn"]
            },
            "refusalReasonRefs": {"type": "array", "items": {"type": "string"}},
        },
        "additionalProperties": True,
    }


def build_parity_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "vecells/release-publication-parity.schema.json",
        "title": "ReleasePublicationParityRecord",
        "type": "object",
        "required": [
            "publicationParityRecordId",
            "releaseRef",
            "environmentRing",
            "runtimePublicationBundleRef",
            "releaseContractVerificationMatrixRef",
            "releaseContractMatrixHash",
            "bundleTupleHash",
            "parityState",
            "routeExposureState",
        ],
        "properties": {
            "publicationParityRecordId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "environmentRing": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releaseContractVerificationMatrixRef": {"type": "string"},
            "releaseContractMatrixHash": {"type": "string"},
            "bundleTupleHash": {"type": "string"},
            "parityState": {"enum": ["exact", "stale", "conflict", "withdrawn"]},
            "routeExposureState": {
                "enum": ["publishable", "constrained", "frozen", "withdrawn"]
            },
            "driftReasonIds": {"type": "array", "items": {"type": "string"}},
            "bindingCeilingReasons": {"type": "array", "items": {"type": "string"}},
        },
        "additionalProperties": True,
    }


def build_bundle_doc(bundle_catalog: dict[str, Any], parity_catalog: dict[str, Any]) -> str:
    summary = bundle_catalog["summary"]
    return dedent(
        f"""
        # 94 Runtime Publication Bundle Design

        `par_094` turns runtime publication into an authoritative machine-readable tuple instead of a deploy checklist.

        ## Runtime law

        - `RuntimePublicationBundle` is the canonical release-scoped runtime tuple for topology, gateway surfaces, frontend manifests, design bundles, projection digests, live channels, cache policy, recovery posture, continuity evidence, and build provenance.
        - `ReleasePublicationParityRecord` is the machine-readable parity witness for route, surface, and artifact exactness.
        - Preview and non-production still fail closed. The same bundle and parity system blocks stale, conflicting, quarantined, blocked, or withdrawn tuples there as well.

        ## Current catalog

        - Release candidates: `{summary["release_candidate_count"]}`
        - Runtime publication bundles: `{summary["runtime_publication_bundle_count"]}`
        - Release parity records: `{summary["release_publication_parity_record_count"]}`
        - Surface authority rows: `{summary["surface_authority_row_count"]}`
        - Published bundles: `{summary["published_bundle_count"]}`
        - Stale bundles: `{summary["stale_bundle_count"]}`
        - Conflict bundles: `{summary["conflict_bundle_count"]}`
        - Withdrawn bundles: `{summary["withdrawn_bundle_count"]}`

        ## Refusal posture

        - Publication blocks on missing provenance, quarantined provenance, blocked consumption, revoked tuples, or tuple drift.
        - Route exposure is `constrained` even when parity is exact if browser posture, accessibility coverage, or design lint ceilings remain.
        - The console and CLI publish refusal reasons per release and per audience surface so drift is not trapped in dashboard-only views.

        ## Follow-on dependencies

        {chr(10).join(f"- `{row['dependencyId']}`: {row['bounded_seam']}" for row in FOLLOW_ON_DEPENDENCIES)}
        """
    ).strip()


def build_parity_doc(bundle_catalog: dict[str, Any], parity_catalog: dict[str, Any]) -> str:
    parity_records = parity_catalog["releasePublicationParityRecords"]
    return dedent(
        f"""
        # 94 Release Publication Parity Rules

        ## Exactness rules

        - Bundle, matrix, route, frontend, projection, live-channel, cache, recovery, and continuity members are grouped into one parity tuple.
        - `parityState = exact` only when the runtime bundle is publishable and no group has drift or refusal reasons.
        - `routeExposureState = constrained` when parity is exact but browser posture, accessibility coverage, or design lint ceilings still suppress calm live publication.
        - `routeExposureState = frozen` when parity is stale or conflict.
        - `routeExposureState = withdrawn` when provenance or publication is revoked.

        ## Current parity records

        {chr(10).join(
            f"- `{row['publicationParityRecordId']}` for `{row['environmentRing']}`: parity `{row['parityState']}`, route exposure `{row['routeExposureState']}`."
            for row in parity_records
        )}

        ## Refusal reasons

        {chr(10).join(
            f"- `{row['reasonId']}`: {row['summary']}"
            for row in parity_catalog["reasonCatalog"][:12]
        )}
        """
    ).strip()


def build_console_html() -> str:
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Runtime Publication Bundle Console</title>
            <style>
              :root {{
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F7;
                --inset: #F4F7FB;
                --text-strong: #0F172A;
                --text: #1E293B;
                --muted: #64748B;
                --border: #E2E8F0;
                --bundle: #2563EB;
                --parity: #0EA5A4;
                --drift: #D97706;
                --blocked: #C24141;
                --verified: #059669;
                --quarantine: #7C3AED;
                --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                background: linear-gradient(180deg, var(--canvas), #eef4fb);
                color: var(--text);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }}
              body[data-reduced-motion="true"] * {{
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
              }}
              .page {{ max-width: 1580px; margin: 0 auto; padding: 24px; }}
              header {{
                position: sticky;
                top: 0;
                z-index: 5;
                display: grid;
                grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr));
                gap: 16px;
                min-height: 76px;
                padding: 16px 20px;
                background: rgba(255,255,255,0.94);
                border-bottom: 1px solid var(--border);
                backdrop-filter: blur(14px);
              }}
              .wordmark {{
                display: flex; align-items: center; gap: 12px; color: var(--text-strong); font-weight: 700;
              }}
              .monogram {{
                width: 40px; height: 40px; border-radius: 12px;
                display: inline-flex; align-items: center; justify-content: center;
                color: white; background: linear-gradient(135deg, var(--bundle), var(--parity));
                font-size: 14px; letter-spacing: 0.08em;
              }}
              .stat, nav, .panel, aside {{
                background: var(--panel); border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow);
              }}
              .stat {{ padding: 12px 14px; }}
              .stat-label {{ color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }}
              .stat-value {{ display: block; margin-top: 6px; font-size: 24px; font-weight: 700; color: var(--text-strong); }}
              .layout {{
                display: grid; grid-template-columns: 324px minmax(0, 1fr) 420px; gap: 20px; margin-top: 20px; align-items: start;
              }}
              nav {{ position: sticky; top: 92px; padding: 18px; }}
              .filter-group {{ display: grid; gap: 10px; margin-bottom: 14px; }}
              .filter-group label {{ color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }}
              select {{
                height: 44px; border: 1px solid var(--border); border-radius: 12px; background: var(--inset);
                color: var(--text); padding: 0 12px;
              }}
              main {{ display: grid; gap: 20px; }}
              .panel {{ padding: 18px; min-height: 320px; transition: transform 180ms ease, opacity 180ms ease; }}
              .panel-title {{ display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 14px; }}
              .panel-title h2 {{ margin: 0; font-size: 18px; color: var(--text-strong); }}
              .panel-title span {{ color: var(--muted); font-size: 12px; }}
              .tuple-diagram {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }}
              .tuple-card, .timeline-button, .surface-button {{
                border: 1px solid var(--border); background: linear-gradient(180deg, #fff, var(--inset));
                border-radius: 16px; width: 100%; text-align: left; cursor: pointer; color: inherit;
                transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
              }}
              .tuple-card:hover, .timeline-button:hover, .surface-button:hover,
              .tuple-card:focus-visible, .timeline-button:focus-visible, .surface-button:focus-visible {{
                outline: none; transform: translateY(-1px); border-color: var(--bundle); box-shadow: 0 12px 24px rgba(37,99,235,0.14);
              }}
              .tuple-card[data-selected="true"], .timeline-button[data-selected="true"], tr[data-selected="true"] .surface-button {{
                border-color: var(--bundle); box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
              }}
              .tuple-card {{ padding: 14px; display: grid; gap: 8px; min-height: 138px; }}
              .timeline {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }}
              .timeline-button {{ padding: 14px; }}
              .badge {{
                display: inline-flex; align-items: center; justify-content: center; min-width: 84px;
                padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; color: white;
              }}
              .badge-published, .badge-exact, .badge-verified, .badge-publishable {{ background: var(--verified); }}
              .badge-constrained {{ background: var(--parity); }}
              .badge-stale, .badge-frozen {{ background: var(--drift); }}
              .badge-conflict {{ background: var(--blocked); }}
              .badge-withdrawn {{ background: var(--quarantine); }}
              .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: var(--muted); word-break: break-all; }}
              .matrix-table, .data-table {{ width: 100%; border-collapse: collapse; }}
              .matrix-table th, .matrix-table td, .data-table th, .data-table td {{
                padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top;
              }}
              .matrix-table th, .data-table th {{ text-align: left; color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }}
              .surface-button {{ padding: 12px; }}
              aside {{ position: sticky; top: 92px; padding: 18px; min-height: 320px; transition: opacity 220ms ease, transform 220ms ease; }}
              .inspector-grid {{ display: grid; gap: 12px; }}
              .inspector-block {{ background: var(--inset); border: 1px solid var(--border); border-radius: 16px; padding: 14px; }}
              .lower-grid {{ display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr); gap: 20px; }}
              .summary-copy {{ color: var(--muted); line-height: 1.5; }}
              @media (max-width: 1180px) {{
                .layout {{ grid-template-columns: 1fr; }}
                nav, aside {{ position: static; }}
                .lower-grid {{ grid-template-columns: 1fr; }}
              }}
            </style>
          </head>
          <body>
            <div class="page">
              <header>
                <div class="stat">
                  <div class="wordmark">
                    <span class="monogram" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="20" height="20" rx="7" stroke="white" stroke-width="1.5"/>
                        <path d="M6 16V6H11.6C13.5 6 14.8 7.1 14.8 8.8C14.8 10 14.1 11 13 11.4C14.5 11.7 15.4 12.8 15.4 14.1C15.4 16 13.9 17 11.8 17H6Z" fill="white"/>
                        <path d="M11.5 11.3L15.9 16H13.4L9.5 11.7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <div>
                      <div>Vecells</div>
                      <div class="stat-label">Runtime Publication Bundle Console</div>
                    </div>
                  </div>
                </div>
                <div class="stat"><span class="stat-label">Active Bundle</span><span class="stat-value" id="active-bundle">0</span></div>
                <div class="stat"><span class="stat-label">Blocked Surfaces</span><span class="stat-value" id="blocked-surfaces">0</span></div>
                <div class="stat"><span class="stat-label">Drift Alerts</span><span class="stat-value" id="drift-alerts">0</span></div>
                <div class="stat"><span class="stat-label">Provenance Warnings</span><span class="stat-value" id="provenance-warnings">0</span></div>
              </header>
              <div class="layout">
                <nav aria-label="Publication filters">
                  <div class="filter-group">
                    <label for="filter-audience">Audience</label>
                    <select id="filter-audience" data-testid="filter-audience"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-route-family">Route family</label>
                    <select id="filter-route-family" data-testid="filter-route-family"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-publication-state">Publication state</label>
                    <select id="filter-publication-state" data-testid="filter-publication-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-drift-state">Drift state</label>
                    <select id="filter-drift-state" data-testid="filter-drift-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-provenance-state">Provenance state</label>
                    <select id="filter-provenance-state" data-testid="filter-provenance-state"></select>
                  </div>
                  <p class="summary-copy" id="filter-summary"></p>
                </nav>
                <main>
                  <section class="panel" data-testid="tuple-diagram">
                    <div class="panel-title">
                      <h2>Publication Tuple Diagram</h2>
                      <span>Topology, gateway, manifests, design, runtime, provenance</span>
                    </div>
                    <div class="tuple-diagram" id="tuple-diagram-grid"></div>
                    <p class="summary-copy" id="tuple-diagram-text"></p>
                  </section>
                  <section class="panel" data-testid="parity-matrix">
                    <div class="panel-title">
                      <h2>Parity Status Matrix</h2>
                      <span>Exactness per release and matrix group</span>
                    </div>
                    <div style="overflow:auto">
                      <table class="matrix-table" aria-label="Parity status matrix">
                        <thead id="parity-matrix-head"></thead>
                        <tbody id="parity-matrix-body"></tbody>
                      </table>
                    </div>
                    <p class="summary-copy" id="parity-matrix-text"></p>
                  </section>
                  <section class="panel" data-testid="refusal-timeline">
                    <div class="panel-title">
                      <h2>Drift and Refusal Timeline</h2>
                      <span>Release-scoped refusal posture</span>
                    </div>
                    <div class="timeline" id="refusal-timeline-grid"></div>
                    <p class="summary-copy" id="refusal-timeline-text"></p>
                  </section>
                  <div class="lower-grid">
                    <section class="panel" data-testid="member-table">
                      <div class="panel-title">
                        <h2>Bundle Member Table</h2>
                        <span>Audience-surface authority rows</span>
                      </div>
                      <div style="overflow:auto">
                        <table class="data-table" aria-label="Bundle member table">
                          <thead>
                            <tr>
                              <th>Release</th>
                              <th>Audience</th>
                              <th>Route families</th>
                              <th>Publication</th>
                              <th>Parity</th>
                              <th>Route exposure</th>
                            </tr>
                          </thead>
                          <tbody id="member-table-body"></tbody>
                        </table>
                      </div>
                    </section>
                    <section class="panel" data-testid="refusal-table">
                      <div class="panel-title">
                        <h2>Parity and Refusal Table</h2>
                        <span>Refusal and ceiling reasons for the selected surface</span>
                      </div>
                      <div style="overflow:auto">
                        <table class="data-table" aria-label="Parity refusal table">
                          <thead>
                            <tr>
                              <th>Kind</th>
                              <th>Reason</th>
                              <th>Detail</th>
                            </tr>
                          </thead>
                          <tbody id="refusal-table-body"></tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                </main>
                <aside data-testid="inspector" aria-label="Publication inspector">
                  <div class="panel-title">
                    <h2>Inspector</h2>
                    <span id="inspector-subtitle">Selected release and surface</span>
                  </div>
                  <div class="inspector-grid" id="inspector-grid"></div>
                </aside>
              </div>
            </div>
            <script>
              const bundleUrl = "../../data/analysis/runtime_publication_bundles.json";
              const parityUrl = "../../data/analysis/release_publication_parity_records.json";
              const state = {{
                bundles: [],
                parities: [],
                surfaceRows: [],
                refusalRows: [],
                selectedRowId: null,
                filters: {{
                  audience: "all",
                  routeFamily: "all",
                  publicationState: "all",
                  driftState: "all",
                  provenanceState: "all",
                }},
              }};

              const labelize = (value) => value.replaceAll("_", " ");
              const badgeClass = (value) => `badge badge-${{value}}`;

              function uniqueValues(values) {{
                return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
              }}

              function setOptions(select, values) {{
                select.innerHTML = "";
                const allOption = document.createElement("option");
                allOption.value = "all";
                allOption.textContent = "All";
                select.appendChild(allOption);
                values.forEach((value) => {{
                  const option = document.createElement("option");
                  option.value = value;
                  option.textContent = labelize(value);
                  select.appendChild(option);
                }});
              }}

              function matchesFilters(row) {{
                return (
                  (state.filters.audience === "all" || row.audienceSurface === state.filters.audience) &&
                  (state.filters.routeFamily === "all" || row.routeFamilyRefs.includes(state.filters.routeFamily)) &&
                  (state.filters.publicationState === "all" || row.publicationState === state.filters.publicationState) &&
                  (state.filters.driftState === "all" || row.driftState === state.filters.driftState) &&
                  (state.filters.provenanceState === "all" || row.provenanceVerificationState === state.filters.provenanceState)
                );
              }}

              function filteredRows() {{
                return state.surfaceRows.filter(matchesFilters);
              }}

              function selectedRow() {{
                const rows = filteredRows();
                if (!rows.length) return null;
                return rows.find((row) => row.rowId === state.selectedRowId) ?? rows[0];
              }}

              function selectedBundle() {{
                const row = selectedRow();
                return row ? state.bundles.find((bundle) => bundle.runtimePublicationBundleId === row.runtimePublicationBundleRef) : null;
              }}

              function selectedParity() {{
                const row = selectedRow();
                return row ? state.parities.find((parity) => parity.publicationParityRecordId === row.publicationParityRecordRef) : null;
              }}

              function renderStats(rows) {{
                const activeBundle = selectedBundle();
                const blockedSurfaces = rows.filter((row) => row.publicationState !== "published").length;
                const driftAlerts = rows.filter((row) => row.driftState !== "none").length;
                const provenanceWarnings = rows.filter((row) => row.provenanceVerificationState !== "verified").length;
                document.getElementById("active-bundle").textContent = activeBundle ? activeBundle.runtimePublicationBundleId.split("::")[1] : "none";
                document.getElementById("blocked-surfaces").textContent = String(blockedSurfaces);
                document.getElementById("drift-alerts").textContent = String(driftAlerts);
                document.getElementById("provenance-warnings").textContent = String(provenanceWarnings);
                document.getElementById("filter-summary").textContent =
                  `${{rows.length}} audience-surface rows after filtering.`;
              }}

              function renderTupleDiagram() {{
                const container = document.getElementById("tuple-diagram-grid");
                const bundle = selectedBundle();
                container.innerHTML = "";
                if (!bundle) {{
                  container.textContent = "No bundle matches the active filters.";
                  return;
                }}
                bundle.memberRows.forEach((row) => {{
                  const card = document.createElement("div");
                  card.className = "tuple-card";
                  card.dataset.selected = "true";
                  card.innerHTML = `
                    <div class="panel-title" style="margin:0">
                      <strong>${{row.label}}</strong>
                      <span class="${{badgeClass(row.state)}}">${{row.state}}</span>
                    </div>
                    <div class="summary-copy">${{row.memberCount}} members</div>
                    <div class="mono">${{row.memberRefs.slice(0, 4).join("<br />")}}</div>
                  `;
                  container.appendChild(card);
                }});
                document.getElementById("tuple-diagram-text").textContent =
                  `${{bundle.runtimePublicationBundleId}} binds ${{bundle.routeFamilyRefs.length}} route families and ${{bundle.audienceSurfaceRefs.length}} audience surfaces into one publishability tuple.`;
              }}

              function renderParityMatrix() {{
                const head = document.getElementById("parity-matrix-head");
                const body = document.getElementById("parity-matrix-body");
                const parities = state.parities;
                const groupIds = uniqueValues(parities.flatMap((row) => Object.keys(row.matrixGroupStates)));
                head.innerHTML = `<tr><th>Release</th>${{groupIds.map((groupId) => `<th>${{labelize(groupId)}}</th>`).join("")}}</tr>`;
                body.innerHTML = "";
                parities.forEach((row) => {{
                  const selected = selectedRow()?.releaseRef === row.releaseRef;
                  const tr = document.createElement("tr");
                  tr.dataset.selected = selected ? "true" : "false";
                  tr.innerHTML = `
                    <td><strong>${{row.environmentRing}}</strong><div class="mono">${{row.publicationParityRecordId}}</div></td>
                    ${{groupIds.map((groupId) => `<td><span class="${{badgeClass(row.matrixGroupStates[groupId])}}">${{row.matrixGroupStates[groupId]}}</span></td>`).join("")}}
                  `;
                  body.appendChild(tr);
                }});
                document.getElementById("parity-matrix-text").textContent =
                  `${{parities.length}} release-scoped parity rows show which tuple groups are exact versus frozen or withdrawn.`;
              }}

              function renderTimeline() {{
                const container = document.getElementById("refusal-timeline-grid");
                container.innerHTML = "";
                state.parities.forEach((row) => {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "timeline-button";
                  button.dataset.testid = `timeline-${{row.releaseRef}}`;
                  button.dataset.selected = selectedRow()?.releaseRef === row.releaseRef ? "true" : "false";
                  button.innerHTML = `
                    <div class="panel-title" style="margin:0 0 8px 0">
                      <strong>${{row.environmentRing}}</strong>
                      <span class="${{badgeClass(row.parityState)}}">${{row.parityState}}</span>
                    </div>
                    <div class="summary-copy">${{row.driftReasonIds.length || row.bindingCeilingReasons.length}} timeline items</div>
                    <div class="mono">${{row.releaseRef}}</div>
                  `;
                  button.addEventListener("click", () => {{
                    const matching = filteredRows().find((entry) => entry.releaseRef === row.releaseRef) ?? state.surfaceRows.find((entry) => entry.releaseRef === row.releaseRef);
                    if (matching) {{
                      state.selectedRowId = matching.rowId;
                      render();
                    }}
                  }});
                  container.appendChild(button);
                }});
                const selectedParity = selectedParityRecord();
                document.getElementById("refusal-timeline-text").textContent =
                  selectedParity
                    ? `${{selectedParity.publicationParityRecordId}} carries ${{selectedParity.driftReasonIds.length}} refusal reasons and ${{selectedParity.bindingCeilingReasons.length}} binding ceilings.`
                    : "No parity row matches the current filter.";
              }}

              function selectedParityRecord() {{
                return selectedParity();
              }}

              function renderMemberTable(rows) {{
                const body = document.getElementById("member-table-body");
                body.innerHTML = "";
                rows.forEach((row, index) => {{
                  const tr = document.createElement("tr");
                  tr.dataset.selected = row.rowId === selectedRow()?.rowId ? "true" : "false";
                  tr.innerHTML = `
                    <td>
                      <button class="surface-button" type="button" data-testid="surface-row-${{row.rowId}}" data-row-id="${{row.rowId}}" data-index="${{index}}">
                        <strong>${{row.environmentRing}}</strong>
                        <div class="mono">${{row.runtimePublicationBundleRef}}</div>
                      </button>
                    </td>
                    <td>${{row.audienceSurfaceLabel}}</td>
                    <td>${{row.routeFamilyRefs.join(", ")}}</td>
                    <td><span class="${{badgeClass(row.publicationState)}}">${{row.publicationState}}</span></td>
                    <td><span class="${{badgeClass(row.parityState)}}">${{row.parityState}}</span></td>
                    <td><span class="${{badgeClass(row.routeExposureState)}}">${{row.routeExposureState}}</span></td>
                  `;
                  body.appendChild(tr);
                }});
                body.querySelectorAll(".surface-button").forEach((button) => {{
                  button.addEventListener("click", () => {{
                    state.selectedRowId = button.dataset.rowId;
                    render();
                  }});
                }});
              }}

              function renderRefusalTable() {{
                const row = selectedRow();
                const body = document.getElementById("refusal-table-body");
                body.innerHTML = "";
                if (!row) return;
                const reasons = state.refusalRows.filter((entry) => entry.rowId === row.rowId);
                reasons.forEach((entry) => {{
                  const tr = document.createElement("tr");
                  tr.innerHTML = `
                    <td>${{entry.kind}}</td>
                    <td><strong>${{entry.reasonId}}</strong></td>
                    <td>${{entry.detail}}</td>
                  `;
                  body.appendChild(tr);
                }});
              }}

              function renderInspector() {{
                const row = selectedRow();
                const bundle = selectedBundle();
                const parity = selectedParity();
                const grid = document.getElementById("inspector-grid");
                grid.innerHTML = "";
                if (!row || !bundle || !parity) {{
                  grid.innerHTML = `<div class="inspector-block">No publication tuple matches the active filter set.</div>`;
                  return;
                }}
                document.getElementById("inspector-subtitle").textContent = `${{row.environmentRing}} / ${{row.audienceSurfaceLabel}}`;
                const cards = [
                  ["Bundle", bundle.runtimePublicationBundleId, bundle.publicationState],
                  ["Parity", parity.publicationParityRecordId, parity.parityState],
                  ["Audience", row.audienceSurfaceLabel, row.routeExposureState],
                  ["Provenance", bundle.buildProvenanceRef, bundle.provenanceVerificationState],
                ];
                cards.forEach(([label, value, stateValue]) => {{
                  const block = document.createElement("div");
                  block.className = "inspector-block";
                  block.innerHTML = `
                    <div class="panel-title" style="margin:0 0 8px 0">
                      <strong>${{label}}</strong>
                      <span class="${{badgeClass(stateValue)}}">${{stateValue}}</span>
                    </div>
                    <div class="mono">${{value}}</div>
                  `;
                  grid.appendChild(block);
                }});
              }}

              function render() {{
                const rows = filteredRows();
                if (rows.length && !rows.some((row) => row.rowId === state.selectedRowId)) {{
                  state.selectedRowId = rows[0].rowId;
                }}
                renderStats(rows);
                renderTupleDiagram();
                renderParityMatrix();
                renderTimeline();
                renderMemberTable(rows);
                renderRefusalTable();
                renderInspector();
              }}

              async function start() {{
                const [bundleCatalog, parityCatalog] = await Promise.all([
                  fetch(bundleUrl).then((response) => response.json()),
                  fetch(parityUrl).then((response) => response.json()),
                ]);
                state.bundles = bundleCatalog.runtimePublicationBundles;
                state.parities = parityCatalog.releasePublicationParityRecords;
                state.surfaceRows = parityCatalog.surfaceAuthorityRows;
                state.refusalRows = parityCatalog.refusalRows;
                const audienceValues = uniqueValues(state.surfaceRows.map((row) => row.audienceSurface));
                const routeValues = uniqueValues(state.surfaceRows.flatMap((row) => row.routeFamilyRefs));
                const publicationValues = uniqueValues(state.surfaceRows.map((row) => row.publicationState));
                const driftValues = uniqueValues(state.surfaceRows.map((row) => row.driftState));
                const provenanceValues = uniqueValues(state.surfaceRows.map((row) => row.provenanceVerificationState));
                setOptions(document.getElementById("filter-audience"), audienceValues);
                setOptions(document.getElementById("filter-route-family"), routeValues);
                setOptions(document.getElementById("filter-publication-state"), publicationValues);
                setOptions(document.getElementById("filter-drift-state"), driftValues);
                setOptions(document.getElementById("filter-provenance-state"), provenanceValues);
                ["audience","routeFamily","publicationState","driftState","provenanceState"].forEach((key) => {{
                  const element = document.getElementById(`filter-${{key.replace(/([A-Z])/g, "-$1").toLowerCase()}}`);
                  element.addEventListener("change", (event) => {{
                    state.filters[key] = event.target.value;
                    render();
                  }});
                }});
                document.addEventListener("keydown", (event) => {{
                  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                  const active = document.activeElement;
                  if (!(active instanceof HTMLButtonElement) || !active.classList.contains("surface-button")) {{
                    return;
                  }}
                  event.preventDefault();
                  const visible = Array.from(document.querySelectorAll(".surface-button"));
                  const currentIndex = visible.findIndex((entry) => entry === active);
                  const nextIndex = event.key === "ArrowDown"
                    ? Math.min(currentIndex + 1, visible.length - 1)
                    : Math.max(currentIndex - 1, 0);
                  const next = visible[nextIndex];
                  if (next) {{
                    state.selectedRowId = next.dataset.rowId;
                    render();
                    requestAnimationFrame(() => {{
                      const refreshed = document.querySelector(`[data-testid="surface-row-${{state.selectedRowId}}"]`);
                      if (refreshed instanceof HTMLButtonElement) {{
                        refreshed.focus();
                      }}
                    }});
                  }}
                }});
                const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
                document.body.dataset.reducedMotion = motion.matches ? "true" : "false";
                state.selectedRowId = state.surfaceRows[0]?.rowId ?? null;
                render();
              }}

              start();
            </script>
          </body>
        </html>
        """
    ).strip()


def patch_release_controls_index() -> None:
    source = INDEX_PATH.read_text(encoding="utf-8")
    block = dedent(
        """
        // par_094_runtime_publication_exports:start
        export * from "./runtime-publication";
        // par_094_runtime_publication_exports:end
        """
    ).strip()
    if "par_094_runtime_publication_exports:start" in source:
        before, _, remainder = source.partition("// par_094_runtime_publication_exports:start")
        _, _, after = remainder.partition("// par_094_runtime_publication_exports:end")
        source = before.rstrip() + "\n\n" + block + "\n\n" + after.lstrip()
    elif 'export * from "./build-provenance";' in source:
        source = source.replace(
            '// par_091_build_provenance_exports:end\n',
            '// par_091_build_provenance_exports:end\n\n' + block + "\n",
            1,
        )
    write_text(INDEX_PATH, source)


def patch_public_api_test() -> None:
    source = PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    if "createRuntimePublicationSimulationHarness," not in source:
        source = source.replace(
            "  createBuildProvenanceSimulationHarness,\n",
            "  createBuildProvenanceSimulationHarness,\n  createRuntimePublicationSimulationHarness,\n",
            1,
        )
    if 'it("runs the runtime publication simulation harness"' not in source:
        anchor = '  it("runs the projection rebuild simulation harness", () => {\n'
        addition = dedent(
            """
              it("runs the runtime publication simulation harness", () => {
                const harness = createRuntimePublicationSimulationHarness();
                expect(harness.bundle.publicationState).toBe("published");
                expect(harness.parityRecord.parityState).toBe("exact");
                expect(harness.verdict.publishable).toBe(true);
              });

            """
        )
        source = source.replace(anchor, addition + anchor, 1)
    write_text(PUBLIC_API_TEST_PATH, source)


def patch_root_package_json() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package["scripts"].update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package_json() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    spec_name = "runtime-publication-bundle-console.spec.js"
    tokens = {
        "build": f"node --check {spec_name}",
        "lint": f"eslint {spec_name}",
        "test": f"node {spec_name}",
        "typecheck": f"node --check {spec_name}",
        "e2e": f"node {spec_name} --run",
    }
    for script_name, token in tokens.items():
        command = package["scripts"][script_name]
        if token not in command:
            package["scripts"][script_name] = f"{command} && {token}"
    if "runtime publication bundle console browser checks" not in package.get("description", ""):
        package["description"] = (
            package.get("description", "").rstrip(".")
            + ", runtime publication bundle console browser checks."
        ).strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_workflows() -> None:
    ci_workflow = WORKFLOW_CI_PATH.read_text(encoding="utf-8")
    if "pnpm ci:rehearse-runtime-publication" not in ci_workflow:
        ci_workflow = ci_workflow.replace(
            "      - run: pnpm ci:verify-provenance\n",
            "      - run: pnpm ci:verify-provenance\n      - run: pnpm ci:rehearse-runtime-publication\n      - run: pnpm ci:verify-runtime-publication\n",
            1,
        )
    write_text(WORKFLOW_CI_PATH, ci_workflow)

    promotion_workflow = WORKFLOW_PROMOTION_PATH.read_text(encoding="utf-8")
    if "pnpm ci:verify-runtime-publication" not in promotion_workflow:
        promotion_workflow = promotion_workflow.replace(
            "      - run: pnpm ci:promote-nonprod -- --target-ring ${{ inputs.target_ring }}\n",
            "      - run: pnpm ci:rehearse-runtime-publication -- --environment ci-preview\n      - run: pnpm ci:verify-runtime-publication -- --environment ci-preview\n      - run: pnpm ci:promote-nonprod -- --target-ring ${{ inputs.target_ring }}\n",
            1,
        )
    write_text(WORKFLOW_PROMOTION_PATH, promotion_workflow)


def main() -> None:
    bundle_catalog, parity_catalog, dependency_rows, _ui_data = build_catalogs()
    write_json(BUNDLE_CATALOG_PATH, bundle_catalog)
    write_json(PARITY_CATALOG_PATH, parity_catalog)
    write_json(BUNDLE_SCHEMA_PATH, build_bundle_schema())
    write_json(PARITY_SCHEMA_PATH, build_parity_schema())
    write_csv(
        DEPENDENCY_MATRIX_PATH,
        dependency_rows,
        [
            "release_ref",
            "environment_ring",
            "runtime_publication_bundle_id",
            "publication_parity_record_id",
            "tuple_stage",
            "member_kind",
            "member_count",
            "member_refs",
            "stage_state",
            "blocking_effect",
        ],
    )
    write_text(BUNDLE_DOC_PATH, build_bundle_doc(bundle_catalog, parity_catalog))
    write_text(PARITY_DOC_PATH, build_parity_doc(bundle_catalog, parity_catalog))
    write_text(CONSOLE_PATH, build_console_html())
    patch_release_controls_index()
    patch_public_api_test()
    patch_root_package_json()
    patch_playwright_package_json()
    patch_workflows()


if __name__ == "__main__":
    main()
