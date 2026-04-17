#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

BUILD_PROVENANCE_MANIFEST_PATH = DATA_DIR / "build_provenance_manifest.json"
RUNTIME_PUBLICATION_BUNDLES_PATH = DATA_DIR / "runtime_publication_bundles.json"
RELEASE_PUBLICATION_PARITY_PATH = DATA_DIR / "release_publication_parity_records.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACE_PATH = DATA_DIR / "gateway_surface_manifest.json"

SCHEMA_PATH = DATA_DIR / "build_provenance_record_schema.json"
POLICY_MATRIX_PATH = DATA_DIR / "provenance_policy_matrix.csv"
SBOM_SCOPE_CATALOG_PATH = DATA_DIR / "sbom_scope_catalog.json"
INTEGRITY_CATALOG_PATH = DATA_DIR / "build_provenance_integrity_catalog.json"

TASK_ID = "par_100"
VISUAL_MODE = "Build_Provenance_Cockpit"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

SOURCE_PRECEDENCE = [
    "prompt/100.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/phase-0-the-foundation-protocol.md#Release trust and runtime publication law",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 113",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "data/analysis/build_provenance_manifest.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_surface_manifest.json",
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_PROVENANCE_FORMAT_CYCLONEDX_JSON_V1",
        "summary": (
            "Vecells uses deterministic CycloneDX 1.6 JSON for the authoritative SBOM artifact "
            "and a mock-safe DSSE-style attestation envelope for rehearsal signing so later "
            "production hardening can swap the signer without changing canonical record fields."
        ),
    },
    {
        "gapId": "GAP_RESOLUTION_BUILDER_IDENTITY_WORKLOAD_IDENTITY_V1",
        "summary": (
            "The mock-now trust model uses the release-attestation workload identity and secret "
            "class policy already published by par_091, while keeping builder identity, invocation, "
            "and ephemeral worker refs explicit so production can move to stronger KMS or HSM "
            "backing without changing record semantics."
        ),
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_SUPPLY_CHAIN_SURFACE_ASSURANCE_EXPORT_V1",
        "summary": (
            "Later assurance and governance surfaces may present richer attestation or export "
            "views, but par_100 publishes the machine-readable provenance, SBOM, and verification "
            "catalog now so those later surfaces must consume this seam rather than redefining it."
        ),
    }
]

POLICY_RULES = [
    {
        "trigger_ref": "CANONICAL_DIGEST_DRIFT",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "PROVENANCE_SIGNATURE_MISMATCH",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "ATTESTATION_MISSING",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "ATTESTATION_SIGNATURE_MISMATCH",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "ATTESTATION_SUBJECT_MISMATCH",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "DIRTY_SOURCE_TREE",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "reject_publish_and_rebuild_from_clean_commit",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "DEPENDENCY_POLICY_BLOCKED",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "quarantine_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "PIPELINE_GATE_BLOCKED",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "hold_pipeline_and_reissue_record",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "SBOM_DIGEST_MISMATCH",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "regenerate_sbom_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "MATERIAL_INPUT_MISSING",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "capture_hidden_material_inputs_and_rebuild",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "RUNTIME_BINDING_DRIFT",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "block_runtime_consumption_and_reverify_against_current_tuple",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "REPRODUCIBILITY_BLOCKED",
        "decision_state": "quarantined",
        "verification_state": "quarantined",
        "runtime_consumption_state": "blocked",
        "publication_eligibility_state": "blocked",
        "operator_action": "reject_non_reproducible_build",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "PROVENANCE_REVOKED",
        "decision_state": "revoked",
        "verification_state": "revoked",
        "runtime_consumption_state": "withdrawn",
        "publication_eligibility_state": "withdrawn",
        "operator_action": "withdraw_runtime_consumption",
        "supersession_allowed": "false",
    },
    {
        "trigger_ref": "PROVENANCE_SUPERSEDED",
        "decision_state": "superseded",
        "verification_state": "superseded",
        "runtime_consumption_state": "withdrawn",
        "publication_eligibility_state": "withdrawn",
        "operator_action": "consume_newer_record_only",
        "supersession_allowed": "true",
    },
]

REQUIRED_RECORD_FIELDS = [
    "provenanceId",
    "buildSystemRef",
    "builderIdentityRef",
    "buildInvocationRef",
    "sourceTreeState",
    "sourceCommitRef",
    "buildRecipeRef",
    "buildEnvironmentRef",
    "ephemeralWorkerRef",
    "artifactDigests",
    "baseImageDigests",
    "toolchainDigests",
    "dependencyLockRefs",
    "resolvedDependencySetRef",
    "buildParameterEnvelopeRef",
    "materialInputDigests",
    "sbomRef",
    "sbomDigest",
    "targetRuntimeManifestRefs",
    "targetSurfaceSchemaSetRef",
    "targetWorkloadFamilyRefs",
    "targetTrustZoneBoundaryRefs",
    "targetGatewaySurfaceRefs",
    "targetTopologyTupleHash",
    "runtimeBindingProof",
    "reproducibilityClass",
    "rebuildChallengeEvidenceRef",
    "attestationEnvelopeRefs",
    "releaseRef",
    "verificationScenarioRef",
    "environmentRing",
    "runtimePublicationBundleRef",
    "releasePublicationParityRef",
    "verificationState",
    "runtimeConsumptionState",
    "signedAt",
    "verifiedBy",
    "verifiedAt",
    "verificationIssues",
    "quarantineReasonRefs",
    "revokedAt",
    "revocationReasonRef",
    "supersededByProvenanceRef",
    "supersededAt",
    "canonicalDigest",
    "signatureAlgorithm",
    "signature",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def stable_digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode("utf-8")).hexdigest()


def derive_surface_schema_set_ref(bundle: dict[str, Any]) -> str:
    digest = stable_digest(
        {
            "frontendContractManifestRefs": bundle["frontendContractManifestRefs"],
            "routeContractDigestRefs": bundle["routeContractDigestRefs"],
            "designContractPublicationBundleRefs": bundle["designContractPublicationBundleRefs"],
        }
    )[:16]
    return f"surface-schema-set::{bundle['runtimePublicationBundleId']}::{digest}"


def resolve_build_workload_families(build_family_ref: str, bundle: dict[str, Any]) -> list[str]:
    explicit_mappings = {
        "bf_foundation_monorepo_full": bundle["workloadFamilyRefs"],
        "bf_published_gateway_bundle": [
            "wf_public_edge_ingress",
            "wf_shell_delivery_published_gateway",
        ],
        "bf_command_runtime_bundle": ["wf_command_orchestration"],
        "bf_projection_runtime_bundle": ["wf_projection_read_models"],
        "bf_notification_runtime_bundle": ["wf_integration_dispatch"],
        "bf_adapter_simulator_bundle": ["wf_integration_simulation_lab"],
        "bf_browser_contract_bundle": [
            "wf_shell_delivery_static_publication",
            "wf_shell_delivery_published_gateway",
        ],
        "bf_release_control_bundle": bundle["workloadFamilyRefs"],
    }
    return explicit_mappings.get(build_family_ref, bundle["workloadFamilyRefs"])


def resolve_gateway_surfaces(
    build_family: dict[str, Any],
    bundle: dict[str, Any],
    gateway_manifest: dict[str, Any],
    workload_family_refs: list[str],
) -> list[str]:
    if build_family.get("surfaceRefs"):
        return sorted(
            surface_id
            for surface_id in build_family["surfaceRefs"]
            if surface_id in bundle["gatewaySurfaceRefs"]
        )
    if build_family["buildFamilyRef"] in {
        "bf_foundation_monorepo_full",
        "bf_browser_contract_bundle",
        "bf_release_control_bundle",
    }:
        return sorted(bundle["gatewaySurfaceRefs"])
    return sorted(
        surface["surfaceId"]
        for surface in gateway_manifest["gateway_surfaces"]
        if surface["surfaceId"] in bundle["gatewaySurfaceRefs"]
        and any(
            family_ref in workload_family_refs
            for family_ref in surface["allowedDownstreamWorkloadFamilyRefs"]
        )
    )


def resolve_trust_boundaries(
    bundle: dict[str, Any],
    runtime_topology: dict[str, Any],
    workload_family_refs: list[str],
) -> list[str]:
    filtered = sorted(
        boundary["boundary_id"]
        for boundary in runtime_topology["trust_zone_boundaries"]
        if boundary["boundary_id"] in bundle["trustZoneBoundaryRefs"]
        and (
            any(
                family_ref in workload_family_refs
                for family_ref in boundary["source_workload_family_refs"]
            )
            or any(
                family_ref in workload_family_refs
                for family_ref in boundary["target_workload_family_refs"]
            )
        )
    )
    return filtered or sorted(bundle["trustZoneBoundaryRefs"])


def build_sbom_scope_catalog(
    build_manifest: dict[str, Any],
    bundles: dict[str, Any],
    gateway_manifest: dict[str, Any],
    runtime_topology: dict[str, Any],
) -> dict[str, Any]:
    bundle_by_ring = {
        bundle["environmentRing"]: bundle for bundle in bundles["runtimePublicationBundles"]
    }
    build_families = []
    for build_family in build_manifest["buildFamilies"]:
        bundle = bundle_by_ring.get("ci-preview") or next(
            iter(bundle_by_ring.values())
        )
        workload_family_refs = resolve_build_workload_families(
            build_family["buildFamilyRef"], bundle
        )
        gateway_surface_refs = resolve_gateway_surfaces(
            build_family, bundle, gateway_manifest, workload_family_refs
        )
        trust_boundary_refs = resolve_trust_boundaries(
            bundle, runtime_topology, workload_family_refs
        )
        build_families.append(
            {
                "buildFamilyRef": build_family["buildFamilyRef"],
                "artifactRoots": build_family["artifactRoots"],
                "dependencyLockRefs": ["pnpm-lock.yaml"],
                "format": "CycloneDX 1.6 JSON",
                "attestationFormat": "mock-safe-dsse-envelope-v1",
                "targetRuntimeBundleRef": bundle["runtimePublicationBundleId"],
                "targetSurfaceSchemaSetRef": derive_surface_schema_set_ref(bundle),
                "targetWorkloadFamilyRefs": workload_family_refs,
                "targetGatewaySurfaceRefs": gateway_surface_refs,
                "targetTrustZoneBoundaryRefs": trust_boundary_refs,
                "scopeDigest": stable_digest(
                    {
                        "artifactRoots": build_family["artifactRoots"],
                        "workloadFamilyRefs": workload_family_refs,
                        "gatewaySurfaceRefs": gateway_surface_refs,
                        "trustZoneBoundaryRefs": trust_boundary_refs,
                        "bundleTupleHash": bundle["bundleTupleHash"],
                    }
                ),
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "sbom_format_choice": {
            "format": "CycloneDX 1.6 JSON",
            "attestation_format": "mock-safe-dsse-envelope-v1",
            "gap_resolution_refs": [
                resolution["gapId"] for resolution in GAP_RESOLUTIONS
            ],
        },
        "buildFamilies": build_families,
    }


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "vecells/build-provenance-record.schema.json",
        "title": "Vecells Build Provenance Record",
        "type": "object",
        "required": REQUIRED_RECORD_FIELDS,
        "properties": {
            "provenanceId": {"type": "string"},
            "buildSystemRef": {"type": "string"},
            "builderIdentityRef": {"type": "string"},
            "buildInvocationRef": {"type": "string"},
            "sourceTreeState": {
                "type": "string",
                "enum": ["clean_tagged", "clean_commit", "dirty_rejected"],
            },
            "sourceCommitRef": {"type": "string"},
            "buildRecipeRef": {"type": "string"},
            "buildEnvironmentRef": {"type": "string"},
            "ephemeralWorkerRef": {"type": "string"},
            "artifactDigests": {
                "type": "array",
                "items": {"$ref": "#/$defs/artifactDescriptor"},
                "minItems": 1,
            },
            "baseImageDigests": {
                "type": "array",
                "items": {"$ref": "#/$defs/baseImageDigest"},
                "minItems": 1,
            },
            "toolchainDigests": {
                "type": "array",
                "items": {"$ref": "#/$defs/toolchainDigest"},
                "minItems": 1,
            },
            "dependencyLockRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "resolvedDependencySetRef": {"type": "string"},
            "buildParameterEnvelopeRef": {"type": "string"},
            "materialInputDigests": {
                "type": "array",
                "items": {"$ref": "#/$defs/materialInputDescriptor"},
                "minItems": 7,
            },
            "sbomRef": {"type": "string"},
            "sbomDigest": {"type": "string"},
            "targetRuntimeManifestRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "targetSurfaceSchemaSetRef": {"type": "string"},
            "targetWorkloadFamilyRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "targetTrustZoneBoundaryRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "targetGatewaySurfaceRefs": {
                "type": "array",
                "items": {"type": "string"},
            },
            "targetTopologyTupleHash": {"type": "string"},
            "runtimeBindingProof": {"$ref": "#/$defs/runtimeBindingProof"},
            "reproducibilityClass": {
                "type": "string",
                "enum": [
                    "reproducible",
                    "replayable_with_attestation",
                    "non_reproducible_blocked",
                ],
            },
            "rebuildChallengeEvidenceRef": {"type": "string"},
            "attestationEnvelopeRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
            },
            "releaseRef": {"type": "string"},
            "verificationScenarioRef": {"type": "string"},
            "environmentRing": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "verificationState": {
                "type": "string",
                "enum": [
                    "pending",
                    "verified",
                    "quarantined",
                    "revoked",
                    "superseded",
                ],
            },
            "runtimeConsumptionState": {
                "type": "string",
                "enum": ["publishable", "blocked", "withdrawn"],
            },
            "signedAt": {"type": "string"},
            "verifiedBy": {"type": "string"},
            "verifiedAt": {"type": ["string", "null"]},
            "verificationIssues": {
                "type": "array",
                "items": {"type": "string"},
            },
            "quarantineReasonRefs": {
                "type": "array",
                "items": {"type": "string"},
            },
            "revokedAt": {"type": ["string", "null"]},
            "revocationReasonRef": {"type": ["string", "null"]},
            "supersededByProvenanceRef": {"type": ["string", "null"]},
            "supersededAt": {"type": ["string", "null"]},
            "canonicalDigest": {"type": "string"},
            "signatureAlgorithm": {
                "type": "string",
                "enum": ["hmac-sha256-mock-safe-v2"],
            },
            "signature": {"type": "string"},
        },
        "$defs": {
            "artifactDescriptor": {
                "type": "object",
                "required": [
                    "artifactId",
                    "artifactKind",
                    "artifactDigest",
                    "artifactRoots",
                ],
                "properties": {
                    "artifactId": {"type": "string"},
                    "artifactKind": {"type": "string"},
                    "artifactDigest": {"type": "string"},
                    "artifactRoots": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
            },
            "baseImageDigest": {
                "type": "object",
                "required": ["imageRef", "digest", "role"],
                "properties": {
                    "imageRef": {"type": "string"},
                    "digest": {"type": "string"},
                    "role": {"type": "string"},
                },
            },
            "toolchainDigest": {
                "type": "object",
                "required": ["toolchainRef", "digest", "role", "version"],
                "properties": {
                    "toolchainRef": {"type": "string"},
                    "digest": {"type": "string"},
                    "role": {"type": "string"},
                    "version": {"type": "string"},
                },
            },
            "materialInputDescriptor": {
                "type": "object",
                "required": [
                    "materialInputId",
                    "materialType",
                    "ref",
                    "digest",
                    "required",
                ],
                "properties": {
                    "materialInputId": {"type": "string"},
                    "materialType": {"type": "string"},
                    "ref": {"type": "string"},
                    "digest": {"type": "string"},
                    "required": {"type": "boolean"},
                },
            },
            "runtimeBindingProof": {
                "type": "object",
                "required": [
                    "runtimeTopologyManifestRef",
                    "runtimePublicationBundleRef",
                    "releasePublicationParityRef",
                    "targetRuntimeManifestRefs",
                    "targetSurfaceSchemaSetRef",
                    "targetWorkloadFamilyRefs",
                    "targetTrustZoneBoundaryRefs",
                    "targetGatewaySurfaceRefs",
                    "targetTopologyTupleHash",
                    "bundleTupleHash",
                    "publicationBundleDigest",
                    "parityDigest",
                    "bindingDigest",
                ],
                "properties": {
                    "runtimeTopologyManifestRef": {"type": "string"},
                    "runtimePublicationBundleRef": {"type": "string"},
                    "releasePublicationParityRef": {"type": "string"},
                    "targetRuntimeManifestRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "targetSurfaceSchemaSetRef": {"type": "string"},
                    "targetWorkloadFamilyRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "targetTrustZoneBoundaryRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "targetGatewaySurfaceRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "targetTopologyTupleHash": {"type": "string"},
                    "bundleTupleHash": {"type": "string"},
                    "publicationBundleDigest": {"type": "string"},
                    "parityDigest": {"type": "string"},
                    "bindingDigest": {"type": "string"},
                },
            },
        },
    }


def write_policy_matrix() -> None:
    with POLICY_MATRIX_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "trigger_ref",
                "decision_state",
                "verification_state",
                "runtime_consumption_state",
                "publication_eligibility_state",
                "operator_action",
                "supersession_allowed",
            ],
        )
        writer.writeheader()
        writer.writerows(POLICY_RULES)


def build_integrity_catalog(
    build_manifest: dict[str, Any],
    bundles: dict[str, Any],
    parity_records: dict[str, Any],
    runtime_topology: dict[str, Any],
    gateway_manifest: dict[str, Any],
    sbom_scope_catalog: dict[str, Any],
) -> dict[str, Any]:
    bundle_by_ring = {
        bundle["environmentRing"]: bundle for bundle in bundles["runtimePublicationBundles"]
    }
    parity_by_ring = {
        row["environmentRing"]: row for row in parity_records["releasePublicationParityRecords"]
    }
    scope_by_family = {
        row["buildFamilyRef"]: row for row in sbom_scope_catalog["buildFamilies"]
    }
    scenarios = [
        {
            "scenarioId": "LOCAL_VERIFIED_BASELINE",
            "environmentRing": "local",
            "buildFamilyRef": "bf_release_control_bundle",
            "decisionState": "approved",
            "verificationState": "verified",
            "runtimeConsumptionState": "publishable",
            "publicationEligibilityState": "publishable",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": [],
            "lineage": {"revokedBy": None, "supersededBy": None},
        },
        {
            "scenarioId": "CI_PREVIEW_VERIFIED_BROWSER_SCOPE",
            "environmentRing": "ci-preview",
            "buildFamilyRef": "bf_browser_contract_bundle",
            "decisionState": "approved",
            "verificationState": "verified",
            "runtimeConsumptionState": "publishable",
            "publicationEligibilityState": "publishable",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": [],
            "lineage": {"revokedBy": None, "supersededBy": None},
        },
        {
            "scenarioId": "INTEGRATION_SIGNATURE_DRIFT_QUARANTINED",
            "environmentRing": "integration",
            "buildFamilyRef": "bf_published_gateway_bundle",
            "decisionState": "quarantined",
            "verificationState": "quarantined",
            "runtimeConsumptionState": "blocked",
            "publicationEligibilityState": "blocked",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": ["ATTESTATION_SIGNATURE_MISMATCH"],
            "lineage": {"revokedBy": None, "supersededBy": None},
        },
        {
            "scenarioId": "PREPROD_BINDING_DRIFT_QUARANTINED",
            "environmentRing": "preprod",
            "buildFamilyRef": "bf_command_runtime_bundle",
            "decisionState": "quarantined",
            "verificationState": "quarantined",
            "runtimeConsumptionState": "blocked",
            "publicationEligibilityState": "blocked",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": ["RUNTIME_BINDING_DRIFT"],
            "lineage": {"revokedBy": None, "supersededBy": None},
        },
        {
            "scenarioId": "PRODUCTION_REVOKED_WITHDRAWN",
            "environmentRing": "production",
            "buildFamilyRef": "bf_release_control_bundle",
            "decisionState": "revoked",
            "verificationState": "revoked",
            "runtimeConsumptionState": "withdrawn",
            "publicationEligibilityState": "withdrawn",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": ["PROVENANCE_REVOKED"],
            "lineage": {"revokedBy": "ATTESTATION_REVOKED", "supersededBy": None},
        },
        {
            "scenarioId": "PRODUCTION_SUPERSEDED_WITHDRAWN",
            "environmentRing": "production",
            "buildFamilyRef": "bf_release_control_bundle",
            "decisionState": "superseded",
            "verificationState": "superseded",
            "runtimeConsumptionState": "withdrawn",
            "publicationEligibilityState": "withdrawn",
            "sourceTreeState": "clean_commit",
            "reproducibilityClass": "replayable_with_attestation",
            "blockerRefs": ["PROVENANCE_SUPERSEDED"],
            "lineage": {
                "revokedBy": None,
                "supersededBy": "prov::bf_release_control_bundle::production::fresh",
            },
        },
    ]
    enriched_scenarios = []
    for scenario in scenarios:
        bundle = bundle_by_ring[scenario["environmentRing"]]
        parity = parity_by_ring[scenario["environmentRing"]]
        scope = scope_by_family[scenario["buildFamilyRef"]]
        enriched_scenarios.append(
            {
                **scenario,
                "runtimePublicationBundleRef": bundle["runtimePublicationBundleId"],
                "releasePublicationParityRef": parity["publicationParityRecordId"],
                "targetSurfaceSchemaSetRef": scope["targetSurfaceSchemaSetRef"],
                "targetWorkloadFamilyRefs": scope["targetWorkloadFamilyRefs"],
                "targetGatewaySurfaceRefs": scope["targetGatewaySurfaceRefs"],
                "targetTrustZoneBoundaryRefs": scope["targetTrustZoneBoundaryRefs"],
                "targetTopologyTupleHash": runtime_topology["manifest_tuple_hash"],
                "artifactDigestCount": len(scope["artifactRoots"]),
                "sbomFormat": scope["format"],
                "attestationCount": 3,
                "bindingDigest": stable_digest(
                    {
                        "runtimePublicationBundleRef": bundle["runtimePublicationBundleId"],
                        "releasePublicationParityRef": parity["publicationParityRecordId"],
                        "targetSurfaceSchemaSetRef": scope["targetSurfaceSchemaSetRef"],
                        "targetWorkloadFamilyRefs": scope["targetWorkloadFamilyRefs"],
                        "targetGatewaySurfaceRefs": scope["targetGatewaySurfaceRefs"],
                        "targetTrustZoneBoundaryRefs": scope["targetTrustZoneBoundaryRefs"],
                        "targetTopologyTupleHash": runtime_topology["manifest_tuple_hash"],
                    }
                ),
            }
        )
    audit_lineage = [
        {
            "auditRecordId": f"sca::{stable_digest((row['scenarioId'], row['decisionState']))[:16]}",
            "scenarioId": row["scenarioId"],
            "action": "verified"
            if row["decisionState"] == "approved"
            else "runtime_consumption_blocked"
            if row["decisionState"] == "quarantined"
            else "revoked"
            if row["decisionState"] == "revoked"
            else "superseded",
            "verificationStateAfter": row["verificationState"],
            "runtimeConsumptionStateAfter": row["runtimeConsumptionState"],
            "reasonRefs": row["blockerRefs"],
            "recordedAt": GENERATED_AT,
        }
        for row in enriched_scenarios
    ]
    publishable = [row for row in enriched_scenarios if row["publicationEligibilityState"] == "publishable"]
    blocked = [row for row in enriched_scenarios if row["publicationEligibilityState"] == "blocked"]
    withdrawn = [row for row in enriched_scenarios if row["publicationEligibilityState"] == "withdrawn"]
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": (
            "Bind signed build provenance, deterministic SBOM scope, attestation lineage, "
            "target runtime scope, and runtime-consumption blocking into one machine-readable supply-chain surface."
        ),
        "source_precedence": SOURCE_PRECEDENCE,
        "gap_resolutions": GAP_RESOLUTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "builder_trust_model": {
            "build_system_ref": "ci://vecells-foundation-release-pipeline",
            "builder_identity_ref": "actor://ci_release_attestation",
            "trusted_secret_class_ref": "RELEASE_PROVENANCE_SIGNING_KEY_REF",
            "separation_of_duties": [
                "build",
                "sign",
                "verify",
                "publish",
            ],
        },
        "upstream_inputs": {
            "build_provenance_manifest_ref": "data/analysis/build_provenance_manifest.json",
            "runtime_publication_bundle_ref": "data/analysis/runtime_publication_bundles.json",
            "release_publication_parity_ref": "data/analysis/release_publication_parity_records.json",
            "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
            "gateway_surface_manifest_ref": "data/analysis/gateway_surface_manifest.json",
        },
        "summary": {
            "scenario_count": len(enriched_scenarios),
            "publishable_count": len(publishable),
            "blocked_count": len(blocked),
            "withdrawn_count": len(withdrawn),
            "policy_rule_count": len(POLICY_RULES),
            "build_family_scope_count": len(sbom_scope_catalog["buildFamilies"]),
        },
        "selectedScenarioId": "PRODUCTION_REVOKED_WITHDRAWN",
        "currentSnapshot": {
            "buildFamilyCount": len(build_manifest["buildFamilies"]),
            "runtimePublicationBundleCount": len(bundles["runtimePublicationBundles"]),
            "gatewaySurfaceCount": len(gateway_manifest["gateway_surfaces"]),
            "activeBlockedScenarioCount": len(blocked) + len(withdrawn),
            "currentTopologyTupleHash": runtime_topology["manifest_tuple_hash"],
        },
        "policyMatrixRef": "data/analysis/provenance_policy_matrix.csv",
        "schemaRef": "data/analysis/build_provenance_record_schema.json",
        "sbomScopeCatalogRef": "data/analysis/sbom_scope_catalog.json",
        "runtimeBindingRoots": [
            {
                "environmentRing": bundle["environmentRing"],
                "runtimePublicationBundleRef": bundle["runtimePublicationBundleId"],
                "releasePublicationParityRef": parity_by_ring[bundle["environmentRing"]][
                    "publicationParityRecordId"
                ],
                "targetTopologyTupleHash": runtime_topology["manifest_tuple_hash"],
                "surfaceSchemaSetRef": derive_surface_schema_set_ref(bundle),
            }
            for bundle in bundles["runtimePublicationBundles"]
        ],
        "provenanceScenarios": enriched_scenarios,
        "auditLineage": audit_lineage,
    }


def main() -> None:
    build_manifest = read_json(BUILD_PROVENANCE_MANIFEST_PATH)
    bundles = read_json(RUNTIME_PUBLICATION_BUNDLES_PATH)
    parity_records = read_json(RELEASE_PUBLICATION_PARITY_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    gateway_manifest = read_json(GATEWAY_SURFACE_PATH)

    schema = build_schema()
    sbom_scope_catalog = build_sbom_scope_catalog(
        build_manifest, bundles, gateway_manifest, runtime_topology
    )
    integrity_catalog = build_integrity_catalog(
        build_manifest,
        bundles,
        parity_records,
        runtime_topology,
        gateway_manifest,
        sbom_scope_catalog,
    )

    write_json(SCHEMA_PATH, schema)
    write_policy_matrix()
    write_json(SBOM_SCOPE_CATALOG_PATH, sbom_scope_catalog)
    write_json(INTEGRITY_CATALOG_PATH, integrity_catalog)


if __name__ == "__main__":
    main()
