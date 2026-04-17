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
PACKAGE_DIR = ROOT / "packages" / "api-contracts"
PACKAGE_SRC_DIR = PACKAGE_DIR / "src"
SCHEMA_DIR = PACKAGE_DIR / "schemas"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_SOURCE_PATH = PACKAGE_SRC_DIR / "index.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
GATEWAY_DIR = ROOT / "services" / "api-gateway" / "src"
GATEWAY_SERVICE_DEFINITION_PATH = GATEWAY_DIR / "service-definition.ts"
GATEWAY_RUNTIME_PATH = GATEWAY_DIR / "runtime.ts"

FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
GATEWAY_ROUTE_MATRIX_PATH = DATA_DIR / "gateway_route_family_matrix.csv"
SCOPED_MUTATION_TABLE_PATH = DATA_DIR / "scoped_mutation_gate_decision_table.csv"
SETTLEMENT_MATRIX_PATH = DATA_DIR / "command_settlement_result_matrix.csv"
RECOVERY_MATRIX_PATH = DATA_DIR / "mutation_recovery_and_freeze_matrix.csv"
RELEASE_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"

MANIFEST_PATH = DATA_DIR / "api_contract_registry_manifest.json"
MATRIX_PATH = DATA_DIR / "route_family_to_query_mutation_channel_cache_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "65_api_contract_registry_design.md"
RULES_DOC_PATH = DOCS_DIR / "65_contract_registry_generation_and_lookup_rules.md"
EXPLORER_PATH = DOCS_DIR / "65_contract_registry_explorer.html"

CATALOG_MODULE_PATH = PACKAGE_SRC_DIR / "api-contract-registry.catalog.ts"
QUERY_SCHEMA_PATH = SCHEMA_DIR / "projection-query-contract.schema.json"
MUTATION_SCHEMA_PATH = SCHEMA_DIR / "mutation-command-contract.schema.json"
LIVE_SCHEMA_PATH = SCHEMA_DIR / "live-update-channel-contract.schema.json"
CACHE_SCHEMA_PATH = SCHEMA_DIR / "client-cache-policy.schema.json"
PACKAGE_EXPORTS_START = "// par_065_api_contract_registry_exports:start"
PACKAGE_EXPORTS_END = "// par_065_api_contract_registry_exports:end"

TASK_ID = "par_065"
VISUAL_MODE = "Contract_Registry_Explorer"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Publish one authoritative backend registry for browser-facing projection queries, mutation "
    "commands, live-update channels, and client cache policies so shells, gateways, validators, "
    "and release tooling stop inferring browser authority from route code or local hooks."
)

SOURCE_PRECEDENCE = [
    "prompt/065.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
    "blueprint/platform-runtime-and-release-blueprint.md#MutationCommandContract",
    "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
    "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
    "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
    "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 97",
    "data/analysis/gateway_route_family_matrix.csv",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/scoped_mutation_gate_decision_table.csv",
    "data/analysis/command_settlement_result_matrix.csv",
    "data/analysis/mutation_recovery_and_freeze_matrix.csv",
    "data/analysis/release_contract_verification_matrix.json",
]

CONTRACT_FAMILY_PREFIXES = {
    "ProjectionQueryContract": "projection-query-digest::",
    "MutationCommandContract": "mutation-command-digest::",
    "LiveUpdateChannelContract": "live-channel-digest::",
    "ClientCachePolicy": "cache-policy-digest::",
}

VALIDATION_RULES = [
    {
        "validationRuleId": "VR_065_BROWSER_ROUTE_REGISTRY_REQUIRED",
        "label": "Browser route families must resolve through registry bundles",
        "contractFamilies": [
            "ProjectionQueryContract",
            "MutationCommandContract",
            "LiveUpdateChannelContract",
            "ClientCachePolicy",
        ],
        "severity": "blocked",
        "ruleSummary": (
            "Every browser-visible route family must publish one manifest-ready registry bundle "
            "with query, mutation, cache, and any allowed live-channel truth."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            "blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law",
        ],
    },
    {
        "validationRuleId": "VR_065_QUERY_PROJECTION_VERSION_REQUIRED",
        "label": "Projection queries must bind a published projection family and version",
        "contractFamilies": ["ProjectionQueryContract"],
        "severity": "blocked",
        "ruleSummary": (
            "Query contracts may only point at published projection contract family, version, "
            "and version-set rows already emitted by the frontend manifest baseline."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionQueryContract",
            "data/analysis/frontend_contract_manifests.json",
        ],
    },
    {
        "validationRuleId": "VR_065_MUTATION_ROUTE_INTENT_AND_SETTLEMENT_REQUIRED",
        "label": "Mutations must bind route-intent, settlement, and recovery law",
        "contractFamilies": ["MutationCommandContract"],
        "severity": "blocked",
        "ruleSummary": (
            "Mutation contracts must publish the route-intent binding ref, command settlement "
            "schema ref, transition envelope schema ref, and governed recovery disposition."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.21 RouteIntentBinding",
            "blueprint/phase-0-the-foundation-protocol.md#1.23 CommandSettlementRecord",
        ],
    },
    {
        "validationRuleId": "VR_065_LIVE_CHANNEL_TRUST_AND_READINESS_REQUIRED",
        "label": "Live channels must bind trust boundaries and readiness evidence",
        "contractFamilies": ["LiveUpdateChannelContract"],
        "severity": "blocked",
        "ruleSummary": (
            "Live updates may not imply writable or complete posture beyond their published trust "
            "boundary refs, runtime binding refs, continuity refs, and release verification coverage."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/platform-runtime-and-release-blueprint.md#LiveUpdateChannelContract",
            "data/analysis/release_contract_verification_matrix.json",
        ],
    },
    {
        "validationRuleId": "VR_065_CACHE_POLICY_BACKEND_PUBLISHED",
        "label": "Client cache policies must be backend-published contract rows",
        "contractFamilies": ["ClientCachePolicy"],
        "severity": "blocked",
        "ruleSummary": (
            "Cache posture is a backend contract family, not a route-local frontend convenience, "
            "and must remain grouped to the exact query and live-channel tuple."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/platform-runtime-and-release-blueprint.md#ClientCachePolicy",
            "blueprint/forensic-audit-findings.md#Finding 97",
        ],
    },
    {
        "validationRuleId": "VR_065_DIGEST_LOOKUP_DETERMINISTIC",
        "label": "Digest lookup must remain deterministic",
        "contractFamilies": [
            "ProjectionQueryContract",
            "MutationCommandContract",
            "LiveUpdateChannelContract",
            "ClientCachePolicy",
        ],
        "severity": "blocked",
        "ruleSummary": (
            "Every published contract row must resolve to one deterministic digest record and one "
            "stable route-family bundle set."
        ),
        "source_refs": [
            "prompt/065.md",
            "blueprint/platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
        ],
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.write_text(content.rstrip() + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    replacement = f"{start_marker}\n{block.rstrip()}\n{end_marker}"
    if start_marker in text and end_marker in text:
        before, remainder = text.split(start_marker, 1)
        _, after = remainder.split(end_marker, 1)
        return before.rstrip() + "\n\n" + replacement + after
    text = text.rstrip()
    if text:
        return text + "\n\n" + replacement + "\n"
    return replacement + "\n"


def replace_once(text: str, old: str, new: str, error_code: str) -> str:
    if old not in text:
        raise RuntimeError(error_code)
    return text.replace(old, new, 1)


def stable_hash(payload: Any) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def split_semicolon(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(";") if part.strip()]


def to_suffix(ref: str) -> str:
    return ref.replace("rf_", "").replace("audsurf_", "").replace("-", "_").upper()


def unique_strings(values: list[str]) -> list[str]:
    return sorted({value for value in values if value})


def merge_source_refs(*groups: list[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for item in group:
            if item and item not in seen:
                ordered.append(item)
                seen.add(item)
    return ordered


def family_contract_id(family: str, route_family_ref: str) -> str:
    prefix = {
        "ProjectionQueryContract": "PQC_065_",
        "MutationCommandContract": "MCC_065_",
        "LiveUpdateChannelContract": "LCC_065_",
        "ClientCachePolicy": "CCP_065_",
    }[family]
    return f"{prefix}{to_suffix(route_family_ref)}_V1"


def build_query_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "ProjectionQueryContract",
        "description": "Published backend query contract row for one browser-visible route family.",
        "type": "object",
        "required": [
            "projectionQueryContractId",
            "routeFamilyRef",
            "routeFamilyLabel",
            "queryCode",
            "projectionContractFamilyRef",
            "projectionContractVersionRef",
            "projectionContractVersionSetRef",
            "responseSchemaRef",
            "clientCachePolicyRef",
            "contractDigestRef",
            "registryDigestRef",
            "audienceSurfaceRefs",
            "gatewaySurfaceRefs",
            "releaseContractVerificationMatrixRefs",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "projectionQueryContractId": {"type": "string"},
            "routeFamilyRef": {"type": "string"},
            "routeFamilyLabel": {"type": "string"},
            "queryCode": {"type": "string"},
            "projectionContractFamilyRef": {"type": "string"},
            "projectionContractVersionRef": {"type": "string"},
            "projectionContractVersionSetRef": {"type": "string"},
            "projectionSourceRef": {"type": "string"},
            "responseSchemaRef": {"type": "string"},
            "clientCachePolicyRef": {"type": "string"},
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "audienceSurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "gatewaySurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "manifestReadyRouteFamilySetRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "releaseContractVerificationMatrixRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "validationState": {"type": "string", "enum": ["valid", "warning", "exception", "blocked"]},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_mutation_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "MutationCommandContract",
        "description": "Published backend mutation contract row for one browser-visible route family.",
        "type": "object",
        "required": [
            "mutationCommandContractId",
            "routeFamilyRef",
            "routeFamilyLabel",
            "commandCode",
            "commandSettlementSchemaRef",
            "transitionEnvelopeSchemaRef",
            "requiredRouteIntentBindingRef",
            "requiredAudienceSurfaceRuntimeBindingRef",
            "requiredReleaseRecoveryDispositionRef",
            "contractDigestRef",
            "registryDigestRef",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "mutationCommandContractId": {"type": "string"},
            "routeFamilyRef": {"type": "string"},
            "routeFamilyLabel": {"type": "string"},
            "commandCode": {"type": "string"},
            "commandSettlementSchemaRef": {"type": "string"},
            "transitionEnvelopeSchemaRef": {"type": "string"},
            "requiredRouteIntentBindingRef": {"type": "string"},
            "routeIntentDecisionRefs": {"type": "array", "items": {"type": "string"}},
            "routeIntentCoverageState": {
                "type": "string",
                "enum": ["mapped", "parallel_gap_stubbed"],
            },
            "actionScopeRefs": {"type": "array", "items": {"type": "string"}},
            "validatedSettlementResultRefs": {"type": "array", "items": {"type": "string"}},
            "validatedRecoveryCaseRefs": {"type": "array", "items": {"type": "string"}},
            "validatedReleaseRecoveryDispositionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredAudienceSurfaceRuntimeBindingRef": {"type": "string"},
            "requiredReleaseRecoveryDispositionRef": {"type": "string"},
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "validationState": {"type": "string", "enum": ["valid", "warning", "exception", "blocked"]},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_live_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "LiveUpdateChannelContract",
        "description": "Published backend live-update contract row for one browser-visible route family.",
        "type": "object",
        "required": [
            "liveUpdateChannelContractId",
            "routeFamilyRef",
            "routeFamilyLabel",
            "channelCode",
            "transport",
            "channelPosture",
            "continuityBindingRef",
            "contractDigestRef",
            "registryDigestRef",
            "requiredTrustBoundaryRefs",
            "requiredRuntimeReadinessRefs",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "liveUpdateChannelContractId": {"type": "string"},
            "routeFamilyRef": {"type": "string"},
            "routeFamilyLabel": {"type": "string"},
            "channelCode": {"type": "string"},
            "transport": {"type": "string"},
            "channelPosture": {"type": "string"},
            "continuityBindingRef": {"type": "string"},
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "requiredTrustBoundaryRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredContextBoundaryRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredRuntimeReadinessRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "releaseContractVerificationMatrixRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "validationState": {"type": "string", "enum": ["valid", "warning", "exception", "blocked"]},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_cache_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "ClientCachePolicy",
        "description": "Published backend client-cache policy row grouped to query and live-channel tuples.",
        "type": "object",
        "required": [
            "clientCachePolicyId",
            "storageMode",
            "scopeMode",
            "freshnessModel",
            "degradeOnDrift",
            "routeFamilyRefs",
            "sourceGatewayRefs",
            "contractDigestRef",
            "registryDigestRef",
            "validationState",
            "source_refs",
        ],
        "properties": {
            "clientCachePolicyId": {"type": "string"},
            "storageMode": {"type": "string"},
            "scopeMode": {"type": "string"},
            "freshnessModel": {"type": "string"},
            "degradeOnDrift": {"type": "boolean"},
            "routeFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "sourceGatewayRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "frontendContractManifestRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "projectionQueryContractRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "liveUpdateChannelContractRefs": {"type": "array", "items": {"type": "string"}},
            "contractDigestRef": {"type": "string"},
            "registryDigestRef": {"type": "string"},
            "validationState": {"type": "string", "enum": ["valid", "warning", "exception", "blocked"]},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }


def build_payload() -> dict[str, Any]:
    frontend = read_json(FRONTEND_MANIFESTS_PATH)
    gateway_rows = read_csv(GATEWAY_ROUTE_MATRIX_PATH)
    mutation_rows = read_csv(SCOPED_MUTATION_TABLE_PATH)
    settlement_rows = read_csv(SETTLEMENT_MATRIX_PATH)
    recovery_rows = read_csv(RECOVERY_MATRIX_PATH)
    release_payload = read_json(RELEASE_MATRIX_PATH)

    gateway_by_route: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in gateway_rows:
        gateway_by_route[row["route_family_id"]].append(row)
    for rows in gateway_by_route.values():
        rows.sort(key=lambda row: (row["ownership_role"], row["gateway_surface_id"]))

    manifest_by_route: dict[str, dict[str, Any]] = {}
    for manifest in frontend["frontendContractManifests"]:
        for route_family_ref in manifest["routeFamilyRefs"]:
            manifest_by_route[route_family_ref] = manifest

    query_by_route = {row["routeFamilyRef"]: row for row in frontend["projectionQueryContracts"]}
    mutation_by_route = {row["routeFamilyRef"]: row for row in frontend["mutationCommandContracts"]}
    live_by_route = {row["routeFamilyRef"]: row for row in frontend["liveUpdateChannelContracts"]}

    projection_family_ids = {
        row["projectionContractFamilyId"] for row in frontend["projectionContractFamilies"]
    }
    projection_version_ids = {
        row["projectionContractVersionId"] for row in frontend["projectionContractVersions"]
    }
    projection_version_sets = {
        row["projectionContractVersionSetId"]: row
        for row in frontend["projectionContractVersionSets"]
    }
    surface_publications = {
        row["audienceSurfacePublicationRef"]: row for row in frontend["surfacePublications"]
    }
    runtime_bindings = {
        row["audienceSurfaceRuntimeBindingId"]: row for row in frontend["audienceSurfaceRuntimeBindings"]
    }

    decision_by_published_binding: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in mutation_rows:
        decision_by_published_binding[row["publishedRouteIntentBindingRequirementRef"]].append(row)
    for rows in decision_by_published_binding.values():
        rows.sort(key=lambda row: row["routeIntentId"])

    settlement_by_recovery: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in settlement_rows:
        settlement_by_recovery[row["releaseRecoveryDispositionRef"]].append(row)
    recovery_by_recovery: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in recovery_rows:
        recovery_by_recovery[row["releaseRecoveryDispositionRef"]].append(row)

    route_to_matrix_ids: dict[str, list[str]] = defaultdict(list)
    route_to_continuity_refs: dict[str, list[str]] = defaultdict(list)
    route_to_coverage_refs: dict[str, list[str]] = defaultdict(list)
    all_release_matrices = release_payload["releaseContractVerificationMatrices"]
    for matrix in all_release_matrices:
        for route_family_ref in matrix["routeFamilyRefs"]:
            route_to_matrix_ids[route_family_ref].append(matrix["releaseContractVerificationMatrixId"])
            route_to_continuity_refs[route_family_ref].extend(
                matrix["requiredContinuityControlRefs"]
            )
            route_suffix = to_suffix(route_family_ref)
            route_to_coverage_refs[route_family_ref].extend(
                [
                    ref
                    for ref in matrix["writableRouteContractCoverageRefs"]
                    if route_suffix in ref
                ]
            )

    parallel_gaps: list[dict[str, Any]] = []
    live_absence_notes: list[dict[str, Any]] = []

    projection_contract_rows: list[dict[str, Any]] = []
    mutation_contract_rows: list[dict[str, Any]] = []
    live_contract_rows: list[dict[str, Any]] = []
    cache_policy_rows: list[dict[str, Any]] = []
    route_bundle_rows: list[dict[str, Any]] = []
    manifest_ready_sets: list[dict[str, Any]] = []
    digest_index_rows: list[dict[str, Any]] = []

    sorted_route_refs = sorted(manifest_by_route)

    route_cache_ids: dict[str, list[str]] = defaultdict(list)
    route_bundle_ids_by_ref: dict[str, str] = {}
    manifest_ready_set_ids_by_manifest: dict[str, str] = {}

    for route_family_ref in sorted_route_refs:
        manifest = manifest_by_route[route_family_ref]
        gateway_group = gateway_by_route[route_family_ref]
        query = query_by_route[route_family_ref]
        mutation = mutation_by_route[route_family_ref]
        live = live_by_route.get(route_family_ref)

        route_label = gateway_group[0]["route_family"]
        gateway_surface_refs = [row["gateway_surface_id"] for row in gateway_group]
        gateway_audience_refs = unique_strings([row["audience_surface_ref"] for row in gateway_group])
        trust_boundary_refs = unique_strings(
            [ref for row in gateway_group for ref in split_semicolon(row["trust_zone_boundary_refs"])]
        )
        context_boundary_refs = unique_strings(
            [
                ref
                for row in gateway_group
                for ref in split_semicolon(row["required_context_boundary_refs"])
            ]
        )
        matrix_refs = sorted(route_to_matrix_ids[route_family_ref])

        query_validation_state = "valid"
        if query["projectionContractFamilyRef"] not in projection_family_ids:
            query_validation_state = "blocked"
        if query["projectionContractVersionRef"] not in projection_version_ids:
            query_validation_state = "blocked"

        manifest_ready_set_ref = f"MRFS_065_{to_suffix(manifest['frontendContractManifestId'])}_V1"
        manifest_ready_set_ids_by_manifest[manifest["frontendContractManifestId"]] = manifest_ready_set_ref

        projection_contract = {
            **query,
            "routeFamilyLabel": route_label,
            "projectionContractVersionSetRef": manifest["projectionContractVersionSetRef"],
            "audienceSurfaceRefs": [manifest["audienceSurface"]],
            "gatewaySurfaceRefs": gateway_surface_refs,
            "gatewayAudienceSurfaceRefs": gateway_audience_refs,
            "frontendContractManifestRefs": [manifest["frontendContractManifestId"]],
            "surfacePublicationRefs": [manifest["surfacePublicationRef"]],
            "runtimeBindingRefs": [manifest["audienceSurfaceRuntimeBindingRef"]],
            "manifestReadyRouteFamilySetRefs": [manifest_ready_set_ref],
            "releaseContractVerificationMatrixRefs": matrix_refs,
            "registryDigestRef": (
                f"{CONTRACT_FAMILY_PREFIXES['ProjectionQueryContract']}{query['contractDigestRef']}"
            ),
            "validationState": query_validation_state,
            "source_refs": merge_source_refs(
                query["source_refs"],
                manifest["source_refs"],
                ["data/analysis/release_contract_verification_matrix.json"],
            ),
        }
        projection_contract_rows.append(projection_contract)

        decisions = decision_by_published_binding[mutation["requiredRouteIntentBindingRef"]]
        route_intent_coverage_state = "mapped" if decisions else "parallel_gap_stubbed"
        mutation_validation_state = "valid"
        if route_intent_coverage_state != "mapped":
            mutation_validation_state = "warning"
            parallel_gaps.append(
                {
                    "gapId": f"PARALLEL_INTERFACE_GAP_065_ROUTE_INTENT_ALIAS_{to_suffix(route_family_ref)}",
                    "gapKind": "route_intent_alias_resolution",
                    "routeFamilyRef": route_family_ref,
                    "contractFamily": "MutationCommandContract",
                    "contractRef": mutation["mutationCommandContractId"],
                    "missingRequirementRef": mutation["requiredRouteIntentBindingRef"],
                    "resolution": (
                        "Keep the published route-intent binding ref authoritative, but defer full "
                        "decision-table alias expansion to later parallel mutation tracks."
                    ),
                    "source_refs": merge_source_refs(
                        mutation["source_refs"],
                        ["data/analysis/scoped_mutation_gate_decision_table.csv"],
                    ),
                }
            )

        validated_release_recovery_disposition_refs = manifest["releaseRecoveryDispositionRefs"]
        validated_settlement_result_refs = unique_strings(
            [
                row["settlementResultId"]
                for recovery_ref in validated_release_recovery_disposition_refs
                for row in settlement_by_recovery[recovery_ref]
            ]
        )
        validated_recovery_case_refs = unique_strings(
            [
                row["recoveryCaseId"]
                for recovery_ref in validated_release_recovery_disposition_refs
                for row in recovery_by_recovery[recovery_ref]
            ]
        )
        if not validated_settlement_result_refs or not validated_recovery_case_refs:
            mutation_validation_state = "warning"
            parallel_gaps.append(
                {
                    "gapId": f"PARALLEL_INTERFACE_GAP_065_SETTLEMENT_RECOVERY_{to_suffix(route_family_ref)}",
                    "gapKind": "settlement_recovery_resolution",
                    "routeFamilyRef": route_family_ref,
                    "contractFamily": "MutationCommandContract",
                    "contractRef": mutation["mutationCommandContractId"],
                    "missingRequirementRef": mutation["requiredReleaseRecoveryDispositionRef"],
                    "resolution": (
                        "Resolve the route-family-specific recovery alias through the manifest's "
                        "canonical recovery disposition set, but keep the registry in warning "
                        "state until settlement and recovery matrices publish full route coverage."
                    ),
                    "source_refs": merge_source_refs(
                        mutation["source_refs"],
                        manifest["source_refs"],
                        ["data/analysis/command_settlement_result_matrix.csv"],
                        ["data/analysis/mutation_recovery_and_freeze_matrix.csv"],
                    ),
                }
            )

        mutation_contract = {
            **mutation,
            "routeFamilyLabel": route_label,
            "routeIntentDecisionRefs": unique_strings([row["routeIntentId"] for row in decisions]),
            "routeIntentCoverageState": route_intent_coverage_state,
            "actionScopeRefs": unique_strings([row["actionScope"] for row in decisions]),
            "validatedSettlementResultRefs": validated_settlement_result_refs,
            "validatedRecoveryCaseRefs": validated_recovery_case_refs,
            "validatedReleaseRecoveryDispositionRefs": validated_release_recovery_disposition_refs,
            "audienceSurfaceRefs": [manifest["audienceSurface"]],
            "gatewaySurfaceRefs": gateway_surface_refs,
            "frontendContractManifestRefs": [manifest["frontendContractManifestId"]],
            "manifestReadyRouteFamilySetRefs": [manifest_ready_set_ref],
            "releaseContractVerificationMatrixRefs": matrix_refs,
            "registryDigestRef": (
                f"{CONTRACT_FAMILY_PREFIXES['MutationCommandContract']}{mutation['contractDigestRef']}"
            ),
            "validationState": mutation_validation_state,
            "source_refs": merge_source_refs(
                mutation["source_refs"],
                [row["source_refs"] for row in decisions],
                [row["source_refs"] for row in settlement_by_recovery[mutation["requiredReleaseRecoveryDispositionRef"]]],
                [row["source_refs"] for row in recovery_by_recovery[mutation["requiredReleaseRecoveryDispositionRef"]]],
            ),
        }
        mutation_contract_rows.append(mutation_contract)

        if live is None:
            live_absence_notes.append(
                {
                    "defectId": f"DEFECT_065_ALLOWED_LIVE_ABSENCE_{to_suffix(route_family_ref)}",
                    "state": "exception",
                    "routeFamilyRef": route_family_ref,
                    "routeFamilyLabel": route_label,
                    "contractFamily": "LiveUpdateChannelContract",
                    "summary": (
                        "This route family publishes no live-update channel contract because the "
                        "current browser posture stays recovery-only or summary-only by law."
                    ),
                    "source_refs": merge_source_refs(
                        manifest["source_refs"],
                        ["data/analysis/frontend_contract_manifests.json"],
                    ),
                }
            )
        else:
            live_contract_rows.append(
                {
                    **live,
                    "routeFamilyLabel": route_label,
                    "audienceSurfaceRefs": [manifest["audienceSurface"]],
                    "gatewaySurfaceRefs": gateway_surface_refs,
                    "frontendContractManifestRefs": [manifest["frontendContractManifestId"]],
                    "manifestReadyRouteFamilySetRefs": [manifest_ready_set_ref],
                    "requiredTrustBoundaryRefs": trust_boundary_refs,
                    "requiredContextBoundaryRefs": context_boundary_refs,
                    "requiredRuntimeReadinessRefs": unique_strings(
                        [manifest["audienceSurfaceRuntimeBindingRef"], manifest["surfacePublicationRef"]]
                        + route_to_continuity_refs[route_family_ref]
                        + route_to_coverage_refs[route_family_ref]
                    ),
                    "releaseContractVerificationMatrixRefs": matrix_refs,
                    "registryDigestRef": (
                        f"{CONTRACT_FAMILY_PREFIXES['LiveUpdateChannelContract']}{live['contractDigestRef']}"
                    ),
                    "validationState": "valid",
                    "source_refs": merge_source_refs(
                        live["source_refs"],
                        manifest["source_refs"],
                        ["data/analysis/release_contract_verification_matrix.json"],
                    ),
                }
            )

    projection_by_route_registry = {
        row["routeFamilyRef"]: row for row in projection_contract_rows
    }
    mutation_by_route_registry = {
        row["routeFamilyRef"]: row for row in mutation_contract_rows
    }
    live_by_route_registry = {row["routeFamilyRef"]: row for row in live_contract_rows}

    for policy in sorted(frontend["clientCachePolicies"], key=lambda row: row["clientCachePolicyId"]):
        matched_route_refs = sorted(
            route_family_ref
            for route_family_ref in sorted_route_refs
            if set(policy["sourceGatewayRefs"]) & set(
                [row["gateway_surface_id"] for row in gateway_by_route[route_family_ref]]
            )
        )
        matched_manifest_refs = unique_strings(
            [manifest_by_route[route_family_ref]["frontendContractManifestId"] for route_family_ref in matched_route_refs]
        )
        matched_query_refs = unique_strings(
            [query_by_route[route_family_ref]["projectionQueryContractId"] for route_family_ref in matched_route_refs]
        )
        matched_live_refs = unique_strings(
            [
                live_by_route_registry[route_family_ref]["liveUpdateChannelContractId"]
                for route_family_ref in matched_route_refs
                if route_family_ref in live_by_route_registry
            ]
        )
        cache_digest = stable_hash(
            {
                "clientCachePolicyId": policy["clientCachePolicyId"],
                "storageMode": policy["storageMode"],
                "scopeMode": policy["scopeMode"],
                "freshnessModel": policy["freshnessModel"],
                "degradeOnDrift": policy["degradeOnDrift"],
                "sourceGatewayRefs": policy["sourceGatewayRefs"],
            }
        )
        enriched_policy = {
            **policy,
            "routeFamilyRefs": matched_route_refs,
            "frontendContractManifestRefs": matched_manifest_refs,
            "projectionQueryContractRefs": matched_query_refs,
            "liveUpdateChannelContractRefs": matched_live_refs,
            "contractDigestRef": cache_digest,
            "registryDigestRef": f"{CONTRACT_FAMILY_PREFIXES['ClientCachePolicy']}{cache_digest}",
            "validationState": "valid",
        }
        cache_policy_rows.append(enriched_policy)
        for route_family_ref in matched_route_refs:
            route_cache_ids[route_family_ref].append(policy["clientCachePolicyId"])

    cache_by_id = {row["clientCachePolicyId"]: row for row in cache_policy_rows}

    for route_family_ref in sorted_route_refs:
        manifest = manifest_by_route[route_family_ref]
        gateway_group = gateway_by_route[route_family_ref]
        query = query_by_route[route_family_ref]
        mutation = mutation_by_route[route_family_ref]
        live = live_by_route_registry.get(route_family_ref)
        route_label = gateway_group[0]["route_family"]
        gateway_surface_refs = [row["gateway_surface_id"] for row in gateway_group]
        cache_policy_ids = sorted(route_cache_ids[route_family_ref])
        cache_digest_refs = [cache_by_id[cache_id]["registryDigestRef"] for cache_id in cache_policy_ids]
        raw_digest_refs = [
            f"{CONTRACT_FAMILY_PREFIXES['ProjectionQueryContract']}{query['contractDigestRef']}",
            f"{CONTRACT_FAMILY_PREFIXES['MutationCommandContract']}{mutation['contractDigestRef']}",
            *([live["registryDigestRef"]] if live else []),
            *cache_digest_refs,
        ]
        validation_state = "valid"
        linked_gap_ids = [
            gap["gapId"]
            for gap in parallel_gaps
            if gap["routeFamilyRef"] == route_family_ref
        ]
        linked_defect_ids = [
            defect["defectId"]
            for defect in live_absence_notes
            if defect["routeFamilyRef"] == route_family_ref
        ]
        if projection_by_route_registry[route_family_ref]["validationState"] == "blocked":
            validation_state = "blocked"
        elif mutation_by_route_registry[route_family_ref]["validationState"] == "blocked":
            validation_state = "blocked"
        elif linked_gap_ids:
            validation_state = "warning"
        elif linked_defect_ids:
            validation_state = "exception"

        bundle_id = f"ACRB_065_{to_suffix(route_family_ref)}_V1"
        route_bundle_ids_by_ref[route_family_ref] = bundle_id
        route_bundle_rows.append(
            {
                "apiContractRouteBundleId": bundle_id,
                "routeFamilyRef": route_family_ref,
                "routeFamilyLabel": route_label,
                "manifestAudienceSurface": manifest["audienceSurface"],
                "manifestAudienceSurfaceLabel": manifest["audienceSurfaceLabel"],
                "gatewayAudienceSurfaceRefs": unique_strings(
                    [row["audience_surface_ref"] for row in gateway_group]
                ),
                "frontendContractManifestRef": manifest["frontendContractManifestId"],
                "manifestReadyRouteFamilySetRef": manifest_ready_set_ids_by_manifest[
                    manifest["frontendContractManifestId"]
                ],
                "gatewaySurfaceRefs": gateway_surface_refs,
                "primaryGatewaySurfaceRef": gateway_group[0]["primary_gateway_surface_id"],
                "projectionQueryContractRef": query["projectionQueryContractId"],
                "mutationCommandContractRef": mutation["mutationCommandContractId"],
                "liveUpdateChannelContractRef": None if live is None else live["liveUpdateChannelContractId"],
                "clientCachePolicyRefs": cache_policy_ids,
                "contractDigestRefs": raw_digest_refs,
                "validationState": validation_state,
                "parallelInterfaceGapRefs": linked_gap_ids,
                "defectRefs": linked_defect_ids,
                "browserPostureState": manifest["browserPostureState"],
                "source_refs": merge_source_refs(
                    manifest["source_refs"],
                    [row["source_refs"] for row in gateway_group],
                ),
            }
        )

    bundle_by_route = {row["routeFamilyRef"]: row for row in route_bundle_rows}

    for manifest in sorted(frontend["frontendContractManifests"], key=lambda row: row["frontendContractManifestId"]):
        route_family_refs = sorted(manifest["routeFamilyRefs"])
        manifest_set_id = manifest_ready_set_ids_by_manifest[manifest["frontendContractManifestId"]]
        bundle_refs = [route_bundle_ids_by_ref[route_family_ref] for route_family_ref in route_family_refs]
        digest_refs = [
            digest
            for route_family_ref in route_family_refs
            for digest in bundle_by_route[route_family_ref]["contractDigestRefs"]
        ]
        manifest_ready_sets.append(
            {
                "manifestReadyRouteFamilySetId": manifest_set_id,
                "frontendContractManifestRef": manifest["frontendContractManifestId"],
                "audienceSurface": manifest["audienceSurface"],
                "audienceSurfaceLabel": manifest["audienceSurfaceLabel"],
                "routeFamilyBundleRefs": bundle_refs,
                "routeFamilyRefs": route_family_refs,
                "projectionQueryContractRefs": [
                    bundle_by_route[route_family_ref]["projectionQueryContractRef"]
                    for route_family_ref in route_family_refs
                ],
                "mutationCommandContractRefs": [
                    bundle_by_route[route_family_ref]["mutationCommandContractRef"]
                    for route_family_ref in route_family_refs
                ],
                "liveUpdateChannelContractRefs": unique_strings(
                    [
                        bundle_by_route[route_family_ref]["liveUpdateChannelContractRef"]
                        for route_family_ref in route_family_refs
                        if bundle_by_route[route_family_ref]["liveUpdateChannelContractRef"]
                    ]
                ),
                "clientCachePolicyRefs": unique_strings(
                    [
                        cache_id
                        for route_family_ref in route_family_refs
                        for cache_id in bundle_by_route[route_family_ref]["clientCachePolicyRefs"]
                    ]
                ),
                "contractDigestRefs": unique_strings(digest_refs),
                "setDigestRef": stable_hash({"routeFamilyRefs": route_family_refs, "digestRefs": digest_refs}),
                "validationState": (
                    "warning"
                    if any(bundle_by_route[route_family_ref]["validationState"] == "warning" for route_family_ref in route_family_refs)
                    else "exception"
                    if any(bundle_by_route[route_family_ref]["validationState"] == "exception" for route_family_ref in route_family_refs)
                    else "valid"
                ),
                "source_refs": manifest["source_refs"],
            }
        )

    all_contract_rows: list[tuple[str, str, str, str, list[str], list[str], list[str], dict[str, Any]]] = []
    for row in projection_contract_rows:
        all_contract_rows.append(
            (
                "ProjectionQueryContract",
                row["projectionQueryContractId"],
                row["contractDigestRef"],
                row["registryDigestRef"],
                [row["routeFamilyRef"]],
                row["audienceSurfaceRefs"],
                row["gatewaySurfaceRefs"],
                row,
            )
        )
    for row in mutation_contract_rows:
        all_contract_rows.append(
            (
                "MutationCommandContract",
                row["mutationCommandContractId"],
                row["contractDigestRef"],
                row["registryDigestRef"],
                [row["routeFamilyRef"]],
                row["audienceSurfaceRefs"],
                row["gatewaySurfaceRefs"],
                row,
            )
        )
    for row in live_contract_rows:
        all_contract_rows.append(
            (
                "LiveUpdateChannelContract",
                row["liveUpdateChannelContractId"],
                row["contractDigestRef"],
                row["registryDigestRef"],
                [row["routeFamilyRef"]],
                row["audienceSurfaceRefs"],
                row["gatewaySurfaceRefs"],
                row,
            )
        )
    for row in cache_policy_rows:
        all_contract_rows.append(
            (
                "ClientCachePolicy",
                row["clientCachePolicyId"],
                row["contractDigestRef"],
                row["registryDigestRef"],
                row["routeFamilyRefs"],
                [manifest_by_route[route_family_ref]["audienceSurface"] for route_family_ref in row["routeFamilyRefs"]],
                row["sourceGatewayRefs"],
                row,
            )
        )

    for family, contract_ref, raw_digest_ref, registry_digest_ref, route_refs, audience_refs, gateway_refs, row in all_contract_rows:
        linked_bundle_refs = [route_bundle_ids_by_ref[route_ref] for route_ref in route_refs]
        digest_index_rows.append(
            {
                "contractDigestIndexId": f"ACDI_065_{family.upper().replace('CONTRACT', '').replace('POLICY', 'POLICY')}_{stable_hash(registry_digest_ref)}",
                "contractFamily": family,
                "contractRef": contract_ref,
                "contractDigestRef": raw_digest_ref,
                "registryDigestRef": registry_digest_ref,
                "routeFamilyRefs": unique_strings(route_refs),
                "audienceSurfaceRefs": unique_strings(audience_refs),
                "gatewaySurfaceRefs": unique_strings(gateway_refs),
                "routeFamilyBundleRefs": linked_bundle_refs,
                "manifestReadyRouteFamilySetRefs": unique_strings(
                    [
                        bundle_by_route[route_ref]["manifestReadyRouteFamilySetRef"]
                        for route_ref in route_refs
                    ]
                ),
                "validationState": row["validationState"],
                "source_refs": row["source_refs"],
            }
        )

    summary = {
        "route_family_bundle_count": len(route_bundle_rows),
        "manifest_ready_route_family_set_count": len(manifest_ready_sets),
        "projection_query_contract_count": len(projection_contract_rows),
        "mutation_command_contract_count": len(mutation_contract_rows),
        "live_update_channel_contract_count": len(live_contract_rows),
        "client_cache_policy_count": len(cache_policy_rows),
        "digest_record_count": len(digest_index_rows),
        "warning_route_family_count": Counter(row["validationState"] for row in route_bundle_rows)["warning"],
        "exception_route_family_count": Counter(row["validationState"] for row in route_bundle_rows)["exception"],
        "blocked_route_family_count": Counter(row["validationState"] for row in route_bundle_rows)["blocked"],
        "parallel_interface_gap_count": len(parallel_gaps),
        "allowed_live_absence_count": len(live_absence_notes),
    }

    return {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            str(path.relative_to(ROOT))
            for path in [
                FRONTEND_MANIFESTS_PATH,
                GATEWAY_ROUTE_MATRIX_PATH,
                SCOPED_MUTATION_TABLE_PATH,
                SETTLEMENT_MATRIX_PATH,
                RECOVERY_MATRIX_PATH,
                RELEASE_MATRIX_PATH,
            ]
        ],
        "summary": summary,
        "validationRules": VALIDATION_RULES,
        "parallelInterfaceGaps": parallel_gaps,
        "defects": live_absence_notes,
        "projectionQueryContracts": projection_contract_rows,
        "mutationCommandContracts": mutation_contract_rows,
        "liveUpdateChannelContracts": live_contract_rows,
        "clientCachePolicies": cache_policy_rows,
        "routeFamilyBundles": route_bundle_rows,
        "manifestReadyRouteFamilySets": manifest_ready_sets,
        "contractDigestIndex": digest_index_rows,
    }


def build_matrix_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    query_by_route = {row["routeFamilyRef"]: row for row in payload["projectionQueryContracts"]}
    mutation_by_route = {row["routeFamilyRef"]: row for row in payload["mutationCommandContracts"]}
    live_by_route = {row["routeFamilyRef"]: row for row in payload["liveUpdateChannelContracts"]}
    cache_by_id = {row["clientCachePolicyId"]: row for row in payload["clientCachePolicies"]}

    for bundle in payload["routeFamilyBundles"]:
        route_ref = bundle["routeFamilyRef"]
        rows.append(
            {
                "route_family_ref": route_ref,
                "route_family_label": bundle["routeFamilyLabel"],
                "audience_surface": bundle["manifestAudienceSurface"],
                "frontend_contract_manifest_ref": bundle["frontendContractManifestRef"],
                "manifest_ready_route_family_set_ref": bundle["manifestReadyRouteFamilySetRef"],
                "gateway_surface_refs": "; ".join(bundle["gatewaySurfaceRefs"]),
                "projection_query_contract_ref": bundle["projectionQueryContractRef"],
                "projection_query_digest_ref": query_by_route[route_ref]["registryDigestRef"],
                "mutation_command_contract_ref": bundle["mutationCommandContractRef"],
                "mutation_command_digest_ref": mutation_by_route[route_ref]["registryDigestRef"],
                "live_update_channel_contract_ref": bundle["liveUpdateChannelContractRef"] or "",
                "live_update_channel_digest_ref": (
                    live_by_route[route_ref]["registryDigestRef"] if route_ref in live_by_route else ""
                ),
                "client_cache_policy_refs": "; ".join(bundle["clientCachePolicyRefs"]),
                "client_cache_policy_digest_refs": "; ".join(
                    [cache_by_id[cache_id]["registryDigestRef"] for cache_id in bundle["clientCachePolicyRefs"]]
                ),
                "validation_state": bundle["validationState"],
                "parallel_interface_gap_refs": "; ".join(bundle["parallelInterfaceGapRefs"]),
                "defect_refs": "; ".join(bundle["defectRefs"]),
                "source_refs": "; ".join(bundle["source_refs"]),
            }
        )
    return rows


def build_catalog_module(payload: dict[str, Any]) -> str:
    catalog = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "routeFamilyBundleCount": payload["summary"]["route_family_bundle_count"],
        "manifestReadyRouteFamilySetCount": payload["summary"][
            "manifest_ready_route_family_set_count"
        ],
        "projectionQueryContractCount": payload["summary"]["projection_query_contract_count"],
        "mutationCommandContractCount": payload["summary"]["mutation_command_contract_count"],
        "liveUpdateChannelContractCount": payload["summary"][
            "live_update_channel_contract_count"
        ],
        "clientCachePolicyCount": payload["summary"]["client_cache_policy_count"],
        "digestRecordCount": payload["summary"]["digest_record_count"],
        "parallelInterfaceGapCount": payload["summary"]["parallel_interface_gap_count"],
        "schemaArtifactPaths": [
            "packages/api-contracts/schemas/projection-query-contract.schema.json",
            "packages/api-contracts/schemas/mutation-command-contract.schema.json",
            "packages/api-contracts/schemas/live-update-channel-contract.schema.json",
            "packages/api-contracts/schemas/client-cache-policy.schema.json",
        ],
    }
    schemas = [
        {
            "schemaId": "ProjectionQueryContract",
            "artifactPath": "packages/api-contracts/schemas/projection-query-contract.schema.json",
            "generatedByTask": TASK_ID,
        },
        {
            "schemaId": "MutationCommandContract",
            "artifactPath": "packages/api-contracts/schemas/mutation-command-contract.schema.json",
            "generatedByTask": TASK_ID,
        },
        {
            "schemaId": "LiveUpdateChannelContract",
            "artifactPath": "packages/api-contracts/schemas/live-update-channel-contract.schema.json",
            "generatedByTask": TASK_ID,
        },
        {
            "schemaId": "ClientCachePolicy",
            "artifactPath": "packages/api-contracts/schemas/client-cache-policy.schema.json",
            "generatedByTask": TASK_ID,
        },
    ]
    return dedent(
        f"""\
        export const apiContractRegistryCatalog = {json.dumps(catalog, indent=2)} as const;

        export const apiContractRegistrySchemas = {json.dumps(schemas, indent=2)} as const;

        export const apiContractRegistryPayload = {json.dumps(payload, indent=2)} as const;
        """
    )


def build_package_source_block() -> str:
    return 'export * from "./api-contract-registry";'


def build_package_public_api_test() -> str:
    return (
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";
            import { fileURLToPath } from "node:url";
            import { describe, expect, it } from "vitest";
            import {
              apiContractRegistryCatalog,
              apiContractRegistrySchemas,
              bootstrapSharedPackage,
              commandSettlementEnvelopeCatalog,
              commandSettlementEnvelopeSchemas,
              frontendContractManifestCatalog,
              frontendContractManifestSchemas,
              ownedContractFamilies,
              ownedObjectFamilies,
              packageContract,
              queueRankingContractCatalog,
              queueRankingSchemas,
            } from "../src/index.ts";
            import { foundationKernelFamilies } from "@vecells/domain-kernel";
            import { publishedEventFamilies } from "@vecells/event-contracts";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");

            describe("public package surface", () => {
              it("boots through documented public contracts", () => {
                expect(packageContract.packageName).toBe("@vecells/api-contracts");
                expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
                expect(Array.isArray(ownedObjectFamilies)).toBe(true);
                expect(Array.isArray(ownedContractFamilies)).toBe(true);
                expect(Array.isArray(foundationKernelFamilies)).toBe(true);
                expect(Array.isArray(publishedEventFamilies)).toBe(true);
              });

              it("publishes the seq_050 frontend manifest schema surface", () => {
                expect(frontendContractManifestCatalog.taskId).toBe("seq_050");
                expect(frontendContractManifestCatalog.manifestCount).toBe(9);
                expect(frontendContractManifestSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });

              it("publishes the par_072 settlement and envelope schema surface", () => {
                expect(commandSettlementEnvelopeCatalog.taskId).toBe("par_072");
                expect(commandSettlementEnvelopeCatalog.scenarioCount).toBe(7);
                expect(commandSettlementEnvelopeCatalog.settlementRevisionCount).toBe(10);
                expect(commandSettlementEnvelopeSchemas).toHaveLength(2);

                for (const schema of commandSettlementEnvelopeSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the par_073 queue-ranking schema surface", () => {
                expect(queueRankingContractCatalog.taskId).toBe("par_073");
                expect(queueRankingContractCatalog.scenarioCount).toBe(6);
                expect(queueRankingSchemas).toHaveLength(4);

                for (const schema of queueRankingSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the par_065 api contract registry schema surface", () => {
                expect(apiContractRegistryCatalog.taskId).toBe("par_065");
                expect(apiContractRegistryCatalog.routeFamilyBundleCount).toBe(19);
                expect(apiContractRegistryCatalog.clientCachePolicyCount).toBe(21);
                expect(apiContractRegistrySchemas).toHaveLength(4);

                for (const schema of apiContractRegistrySchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });
            });
            """
        ).strip()
        + "\n"
    )


def update_api_contract_package() -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_EXPORTS_START,
        PACKAGE_EXPORTS_END,
        build_package_source_block(),
    )
    write_text(PACKAGE_SOURCE_PATH, source)

    package = json.loads(PACKAGE_PACKAGE_JSON_PATH.read_text())
    exports = package.setdefault("exports", {})
    exports["./schemas/projection-query-contract.schema.json"] = (
        "./schemas/projection-query-contract.schema.json"
    )
    exports["./schemas/mutation-command-contract.schema.json"] = (
        "./schemas/mutation-command-contract.schema.json"
    )
    exports["./schemas/live-update-channel-contract.schema.json"] = (
        "./schemas/live-update-channel-contract.schema.json"
    )
    exports["./schemas/client-cache-policy.schema.json"] = (
        "./schemas/client-cache-policy.schema.json"
    )
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())


def update_gateway_service_definition() -> None:
    source = GATEWAY_SERVICE_DEFINITION_PATH.read_text()
    if "/contracts/registry" not in source:
        source = replace_once(
            source,
            '      idempotencyRequired: false,\n    },\n  ] as const satisfies readonly ServiceRouteDefinition[],',
            '      idempotencyRequired: false,\n    },\n    {\n      routeId: "get_api_contract_registry",\n      method: "GET",\n      path: "/contracts/registry",\n      contractFamily: "ApiContractRegistry",\n      purpose: "Expose backend-published registry lookup for query, mutation, live-channel, and cache contracts.",\n      bodyRequired: false,\n      idempotencyRequired: false,\n    },\n  ] as const satisfies readonly ServiceRouteDefinition[],',
            "API_CONTRACT_REGISTRY_GATEWAY_ROUTE_INSERT_FAILED",
        )

    if 'name: "api_contract_registry"' not in source:
        source = replace_once(
            source,
            '      failureMode: "Downgrade to observe-only freeze posture and require operator review.",\n    },\n  ] as const,',
            '      failureMode: "Downgrade to observe-only freeze posture and require operator review.",\n    },\n    {\n      name: "api_contract_registry",\n      detail: "Published browser query, mutation, live-channel, and cache contracts load from the shared registry package.",\n      failureMode: "Fail closed to explicit contract lookup errors instead of inferring browser authority from gateway routes.",\n    },\n  ] as const,',
            "API_CONTRACT_REGISTRY_GATEWAY_READINESS_INSERT_FAILED",
        )

    if '"tests/api-contract-registry.integration.test.js"' not in source:
        source = replace_once(
            source,
            '  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,',
            '  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js", "tests/api-contract-registry.integration.test.js"] as const,',
            "API_CONTRACT_REGISTRY_GATEWAY_TESTHARNESS_INSERT_FAILED",
        )

    write_text(GATEWAY_SERVICE_DEFINITION_PATH, source)


def update_gateway_runtime() -> None:
    source = GATEWAY_RUNTIME_PATH.read_text()
    if 'import { buildApiContractRegistryResponse } from "./api-contract-registry";' not in source:
        source = replace_once(
            source,
            'import { redactConfig, type ServiceConfig } from "./config";',
            'import { redactConfig, type ServiceConfig } from "./config";\nimport { buildApiContractRegistryResponse } from "./api-contract-registry";',
            "API_CONTRACT_REGISTRY_GATEWAY_RUNTIME_IMPORT_FAILED",
        )

    if "const requestUrl = new URL(request.url ?? \"/\", \"http://127.0.0.1\");" not in source:
        source = replace_once(
            source,
            '        const method = request.method?.toUpperCase() ?? "GET";\n        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;',
            '        const method = request.method?.toUpperCase() ?? "GET";\n        const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");\n        const pathname = requestUrl.pathname;',
            "API_CONTRACT_REGISTRY_GATEWAY_RUNTIME_URL_PARSE_FAILED",
        )

    if 'route.routeId === "get_api_contract_registry"' not in source:
        source = replace_once(
            source,
            "          const context: WorkloadRequestContext = {",
            '          if (route.routeId === "get_api_contract_registry") {\n'
            "            const payload = buildApiContractRegistryResponse(requestUrl.searchParams);\n"
            '            logger.info("service_request_completed", {\n'
            "              routeId: route.routeId,\n"
            "              correlationId,\n"
            "              traceId,\n"
            "              edgeCorrelationId: edgeCorrelation.edgeCorrelationId,\n"
            "              causalToken: edgeCorrelation.causalToken,\n"
            "              statusCode: payload.statusCode,\n"
            "            });\n"
            "            respondJson(\n"
            "              response,\n"
            "              payload.statusCode,\n"
            "              correlationId,\n"
            "              traceId,\n"
            "              edgeCorrelation,\n"
            "              payload.body,\n"
            "            );\n"
            "            return;\n"
            "          }\n\n"
            "          const context: WorkloadRequestContext = {",
            "API_CONTRACT_REGISTRY_GATEWAY_RUNTIME_HANDLER_FAILED",
        )

    write_text(GATEWAY_RUNTIME_PATH, source)


def update_gateway_service() -> None:
    update_gateway_service_definition()
    update_gateway_runtime()


def build_design_doc(payload: dict[str, Any]) -> str:
    summary = payload["summary"]
    return dedent(
        f"""\
        # 65 API Contract Registry Design

        `par_065` hardens the seq_050 frontend contract outputs into one backend-published lookup registry.
        The registry is the authoritative source for browser-facing:
        - `ProjectionQueryContract`
        - `MutationCommandContract`
        - `LiveUpdateChannelContract`
        - `ClientCachePolicy`

        ## Outcome

        The generated registry currently publishes:
        - {summary["route_family_bundle_count"]} route-family bundles
        - {summary["manifest_ready_route_family_set_count"]} manifest-ready route-family sets
        - {summary["projection_query_contract_count"]} projection query contracts
        - {summary["mutation_command_contract_count"]} mutation command contracts
        - {summary["live_update_channel_contract_count"]} live-update channel contracts
        - {summary["client_cache_policy_count"]} client-cache policies
        - {summary["digest_record_count"]} digest lookup rows

        ## Registry Law

        1. Browser authority may not be reconstructed from route code, route-local hooks, or shell-local cache behavior.
        2. Every browser-visible route family resolves through exactly one manifest-ready route bundle.
        3. Query contracts stay bound to published projection family, version, and version-set refs.
        4. Mutation contracts stay bound to route-intent, settlement, and recovery law. Where the shared decision table has not yet expanded to the published alias ref, the registry records a bounded `PARALLEL_INTERFACE_GAP_*` warning instead of inventing route-local semantics.
        5. Live-channel contracts may not imply writable or complete truth beyond their trust-boundary and readiness refs.
        6. Cache policies remain backend-published tuples grouped to exact query and live-channel membership.

        ## Parallel Gaps

        The current registry records {summary["parallel_interface_gap_count"]} bounded parallel interface gaps for route-intent alias expansion and {summary["allowed_live_absence_count"]} allowed live-channel absences where the published browser posture is recovery-only or summary-only by law.
        """
    )


def build_rules_doc(payload: dict[str, Any]) -> str:
    return dedent(
        f"""\
        # 65 Contract Registry Generation And Lookup Rules

        ## Generation Pipeline

        1. Read `frontend_contract_manifests.json` for the published route-family, manifest, query, mutation, live-channel, and cache baselines.
        2. Read `gateway_route_family_matrix.csv` to bind every browser route family to one or more gateway surfaces plus trust and context boundaries.
        3. Read `scoped_mutation_gate_decision_table.csv`, `command_settlement_result_matrix.csv`, and `mutation_recovery_and_freeze_matrix.csv` to validate mutation references against route-intent, settlement, and recovery law.
        4. Read `release_contract_verification_matrix.json` to bind digest rows and live-channel route families to release verification coverage.
        5. Materialize one route-family bundle per browser-visible route family and one manifest-ready set per published frontend manifest.

        ## Lookup Rules

        The runtime registry must support deterministic lookup by:
        - `audienceSurface`
        - `routeFamilyRef`
        - `gatewaySurfaceRef`
        - `contractDigestRef`

        Lookup semantics are fail-closed:
        - unknown digests do not resolve to fallback route logic
        - missing route-family bundles are a registry error, not a shell-local inference opportunity
        - cache policy lookup returns the grouped query and live-channel tuple that the backend published

        ## Validation Rules

        {"".join(f"- `{rule['validationRuleId']}`: {rule['ruleSummary']}\n" for rule in VALIDATION_RULES)}
        """
    )


def build_explorer_html(payload: dict[str, Any], matrix_rows: list[dict[str, Any]]) -> str:
    payload_literal = json.dumps(payload)
    matrix_literal = json.dumps(matrix_rows)
    return dedent(
        f"""\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>65 Contract Registry Explorer</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F7F8FC;
              --rail: #EEF2F8;
              --panel: #FFFFFF;
              --inset: #F4F6FB;
              --text-strong: #0F172A;
              --text: #1E293B;
              --text-muted: #667085;
              --border-subtle: #E2E8F0;
              --border: #CBD5E1;
              --primary: #3559E6;
              --query: #0EA5A4;
              --mutation: #7C3AED;
              --channel: #0F9D58;
              --cache: #C98900;
              --blocked: #C24141;
              --warning: #B45309;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              background: linear-gradient(180deg, #f7f8fc 0%, #eef2f8 100%);
              color: var(--text);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
            code, .mono {{ font-family: "SFMono-Regular", ui-monospace, monospace; }}
            .app {{
              max-width: 1500px;
              margin: 0 auto;
              padding: 24px;
            }}
            .masthead {{
              position: sticky;
              top: 0;
              z-index: 10;
              height: 72px;
              background: rgba(247, 248, 252, 0.92);
              backdrop-filter: blur(10px);
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 12px 0;
            }}
            .brand {{
              display: flex;
              align-items: center;
              gap: 12px;
            }}
            .monogram {{
              width: 38px;
              height: 38px;
              border-radius: 12px;
              background: linear-gradient(135deg, #3559e6, #0ea5a4);
              color: white;
              display: grid;
              place-items: center;
              font-size: 0.85rem;
              font-weight: 700;
              letter-spacing: 0.08em;
            }}
            .summary-grid {{
              display: grid;
              grid-template-columns: repeat(4, minmax(120px, 1fr));
              gap: 12px;
              width: min(640px, 100%);
            }}
            .summary-card, .panel {{
              background: var(--panel);
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
              box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
            }}
            .summary-card {{
              padding: 12px 14px;
            }}
            .summary-card strong {{
              display: block;
              font-size: 1.15rem;
            }}
            .layout {{
              display: grid;
              grid-template-columns: 300px minmax(0, 1fr) 396px;
              gap: 16px;
              align-items: start;
            }}
            .rail, .inspector, .center {{
              min-height: 620px;
            }}
            .rail, .inspector {{
              background: var(--rail);
              border: 1px solid var(--border-subtle);
              border-radius: 24px;
              padding: 16px;
            }}
            .center {{
              display: grid;
              gap: 16px;
            }}
            .panel {{
              padding: 16px;
            }}
            .filter-grid {{
              display: grid;
              gap: 12px;
            }}
            label {{
              display: grid;
              gap: 6px;
              font-size: 0.9rem;
              color: var(--text-muted);
            }}
            select {{
              height: 44px;
              border-radius: 12px;
              border: 1px solid var(--border);
              background: white;
              padding: 0 12px;
              color: var(--text);
            }}
            .constellation {{
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 12px;
            }}
            .contract-card {{
              min-height: 170px;
              border-radius: 18px;
              border: 1px solid var(--border);
              background: white;
              padding: 16px;
              display: grid;
              gap: 10px;
              align-content: start;
              cursor: pointer;
              transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
            }}
            .contract-card:hover,
            .contract-card:focus-visible,
            .contract-card[data-selected="true"] {{
              transform: translateY(-2px);
              border-color: var(--primary);
              box-shadow: 0 16px 26px rgba(53, 89, 230, 0.14);
              outline: none;
            }}
            .family-pill, .state-pill, .bundle-pill {{
              display: inline-flex;
              align-items: center;
              gap: 6px;
              border-radius: 999px;
              padding: 4px 9px;
              font-size: 0.78rem;
              border: 1px solid currentColor;
              width: fit-content;
            }}
            .family-ProjectionQueryContract {{ color: var(--query); }}
            .family-MutationCommandContract {{ color: var(--mutation); }}
            .family-LiveUpdateChannelContract {{ color: var(--channel); }}
            .family-ClientCachePolicy {{ color: var(--cache); }}
            .state-valid {{ color: var(--channel); }}
            .state-warning {{ color: var(--warning); }}
            .state-exception {{ color: var(--cache); }}
            .state-blocked {{ color: var(--blocked); }}
            .bundle-strip {{
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }}
            .bundle-pill {{
              background: var(--inset);
              border-color: var(--border);
              color: var(--text);
            }}
            .bundle-pill[data-linked="true"] {{
              border-color: var(--primary);
              color: var(--primary);
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th, td {{
              padding: 10px 8px;
              border-bottom: 1px solid var(--border-subtle);
              text-align: left;
              vertical-align: top;
              font-size: 0.9rem;
            }}
            tr[data-selected="true"] {{
              background: rgba(53, 89, 230, 0.06);
            }}
            .defect-strip {{
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
              gap: 12px;
            }}
            .defect-card {{
              border-radius: 16px;
              border: 1px solid var(--border);
              background: white;
              padding: 14px;
            }}
            .inspector dl {{
              display: grid;
              gap: 10px;
            }}
            .inspector dt {{
              font-size: 0.8rem;
              color: var(--text-muted);
            }}
            .inspector dd {{
              margin: 0;
            }}
            @media (max-width: 1180px) {{
              .layout {{
                grid-template-columns: 1fr;
              }}
              .summary-grid {{
                grid-template-columns: repeat(2, minmax(120px, 1fr));
              }}
            }}
            @media (prefers-reduced-motion: reduce) {{
              *, *::before, *::after {{
                animation: none !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="app">
            <header class="masthead panel" data-testid="registry-masthead">
              <div class="brand">
                <div class="monogram" aria-hidden="true">CR</div>
                <div>
                  <div class="mono" style="font-size: 0.76rem; color: var(--text-muted);">Vecells</div>
                  <strong>Contract Registry Explorer</strong>
                </div>
              </div>
              <div class="summary-grid">
                <div class="summary-card"><span>Total Contracts</span><strong id="count-total"></strong></div>
                <div class="summary-card"><span>Query</span><strong id="count-query"></strong></div>
                <div class="summary-card"><span>Mutation</span><strong id="count-mutation"></strong></div>
                <div class="summary-card"><span>Live</span><strong id="count-live"></strong></div>
              </div>
            </header>
            <main class="layout">
              <aside class="rail" data-testid="registry-rail">
                <div class="filter-grid">
                  <label>Audience Surface
                    <select id="filter-audience" data-testid="filter-audience"></select>
                  </label>
                  <label>Route Family
                    <select id="filter-route-family" data-testid="filter-route-family"></select>
                  </label>
                  <label>Contract Family
                    <select id="filter-contract-family" data-testid="filter-contract-family"></select>
                  </label>
                  <label>Validation State
                    <select id="filter-validation-state" data-testid="filter-validation-state"></select>
                  </label>
                </div>
              </aside>
              <section class="center">
                <section class="panel" data-testid="contract-constellation">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
                    <div>
                      <strong>Contract-family constellation</strong>
                      <div style="color:var(--text-muted); font-size:0.9rem;">One published row per browser-facing contract.</div>
                    </div>
                    <div class="mono" id="selection-hint">No selection</div>
                  </div>
                  <div class="constellation" id="contract-card-list"></div>
                </section>
                <section class="panel" data-testid="bundle-strip">
                  <strong>Route-family bundle strip</strong>
                  <div style="color:var(--text-muted); font-size:0.9rem; margin: 6px 0 12px;">Manifest-ready group membership for the selected contract.</div>
                  <div class="bundle-strip" id="bundle-strip-list"></div>
                </section>
                <section class="panel" data-testid="route-family-matrix">
                  <strong>Route-family matrix</strong>
                  <table>
                    <thead>
                      <tr>
                        <th>Route Family</th>
                        <th>Query</th>
                        <th>Mutation</th>
                        <th>Live</th>
                        <th>Cache</th>
                        <th>State</th>
                      </tr>
                    </thead>
                    <tbody id="matrix-body"></tbody>
                  </table>
                </section>
                <section class="panel">
                  <strong>Validation rules</strong>
                  <table data-testid="validation-rule-table">
                    <thead>
                      <tr><th>Rule</th><th>Severity</th><th>Summary</th></tr>
                    </thead>
                    <tbody id="validation-rule-body"></tbody>
                  </table>
                </section>
                <section class="panel" data-testid="defect-strip">
                  <strong>Defect and gap strip</strong>
                  <div style="color:var(--text-muted); font-size:0.9rem; margin: 6px 0 12px;">Bounded warnings stay explicit instead of becoming route-local exceptions.</div>
                  <div class="defect-strip" id="defect-strip-list"></div>
                </section>
              </section>
              <aside class="inspector" data-testid="digest-inspector">
                <strong>Digest inspector</strong>
                <div style="color:var(--text-muted); font-size:0.9rem; margin: 6px 0 16px;">Selected contract details stay synchronized with the bundle strip and route matrix.</div>
                <div id="inspector-empty">Select a contract card to inspect its registry tuple.</div>
                <div id="inspector-content" hidden>
                  <dl id="inspector-definition-list"></dl>
                </div>
              </aside>
            </main>
          </div>
          <script>
            const payload = {payload_literal};
            const matrixRows = {matrix_literal};
            const contractRows = [
              ...payload.projectionQueryContracts.map((row) => ({{ ...row, contractFamily: "ProjectionQueryContract", contractRef: row.projectionQueryContractId }})),
              ...payload.mutationCommandContracts.map((row) => ({{ ...row, contractFamily: "MutationCommandContract", contractRef: row.mutationCommandContractId }})),
              ...payload.liveUpdateChannelContracts.map((row) => ({{ ...row, contractFamily: "LiveUpdateChannelContract", contractRef: row.liveUpdateChannelContractId }})),
              ...payload.clientCachePolicies.map((row) => ({{ ...row, contractFamily: "ClientCachePolicy", contractRef: row.clientCachePolicyId }})),
            ];

            const state = {{
              audience: "all",
              routeFamily: "all",
              contractFamily: "all",
              validationState: "all",
              selectedContractRef: contractRows[0]?.contractRef ?? null,
            }};

            const cardList = document.getElementById("contract-card-list");
            const bundleStripList = document.getElementById("bundle-strip-list");
            const matrixBody = document.getElementById("matrix-body");
            const validationRuleBody = document.getElementById("validation-rule-body");
            const defectStripList = document.getElementById("defect-strip-list");
            const inspectorEmpty = document.getElementById("inspector-empty");
            const inspectorContent = document.getElementById("inspector-content");
            const inspectorDefinitionList = document.getElementById("inspector-definition-list");
            const selectionHint = document.getElementById("selection-hint");

            document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";

            function populateSelect(selectId, values) {{
              const select = document.getElementById(selectId);
              select.innerHTML = "";
              const all = document.createElement("option");
              all.value = "all";
              all.textContent = "All";
              select.appendChild(all);
              for (const value of values) {{
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
              }}
            }}

            populateSelect("filter-audience", [...new Set(payload.routeFamilyBundles.map((row) => row.manifestAudienceSurface))].sort());
            populateSelect("filter-route-family", [...new Set(payload.routeFamilyBundles.map((row) => row.routeFamilyRef))].sort());
            populateSelect("filter-contract-family", ["ProjectionQueryContract", "MutationCommandContract", "LiveUpdateChannelContract", "ClientCachePolicy"]);
            populateSelect("filter-validation-state", ["valid", "warning", "exception", "blocked"]);

            document.getElementById("count-total").textContent = String(contractRows.length);
            document.getElementById("count-query").textContent = String(payload.summary.projection_query_contract_count);
            document.getElementById("count-mutation").textContent = String(payload.summary.mutation_command_contract_count);
            document.getElementById("count-live").textContent = String(payload.summary.live_update_channel_contract_count);

            for (const [stateKey, selectId] of [
              ["audience", "filter-audience"],
              ["routeFamily", "filter-route-family"],
              ["contractFamily", "filter-contract-family"],
              ["validationState", "filter-validation-state"],
            ]) {{
              document.getElementById(selectId).addEventListener("change", (event) => {{
                state[stateKey] = event.target.value;
                render();
              }});
            }}

            function selectedContract() {{
              return contractRows.find((row) => row.contractRef === state.selectedContractRef) ?? null;
            }}

            function contractRouteFamilies(row) {{
              if ("routeFamilyRef" in row) {{
                return [row.routeFamilyRef];
              }}
              return row.routeFamilyRefs;
            }}

            function contractAudienceRefs(row) {{
              if ("audienceSurfaceRefs" in row) {{
                return row.audienceSurfaceRefs;
              }}
              return [...new Set(row.routeFamilyRefs.map((routeFamilyRef) => payload.routeFamilyBundles.find((bundle) => bundle.routeFamilyRef === routeFamilyRef)?.manifestAudienceSurface).filter(Boolean))];
            }}

            function filteredContracts() {{
              return contractRows.filter((row) => {{
                if (state.contractFamily !== "all" && row.contractFamily !== state.contractFamily) {{
                  return false;
                }}
                if (state.validationState !== "all" && row.validationState !== state.validationState) {{
                  return false;
                }}
                if (state.routeFamily !== "all" && !contractRouteFamilies(row).includes(state.routeFamily)) {{
                  return false;
                }}
                if (state.audience !== "all" && !contractAudienceRefs(row).includes(state.audience)) {{
                  return false;
                }}
                return true;
              }});
            }}

            function ensureSelection(rows) {{
              if (!rows.some((row) => row.contractRef === state.selectedContractRef)) {{
                state.selectedContractRef = rows[0]?.contractRef ?? null;
              }}
            }}

            function renderCards(rows) {{
              cardList.innerHTML = "";
              rows.forEach((row, index) => {{
                const card = document.createElement("button");
                card.type = "button";
                card.className = "contract-card";
                card.dataset.testid = `contract-card-${{row.contractRef}}`;
                card.dataset.selected = String(row.contractRef === state.selectedContractRef);
                card.tabIndex = row.contractRef === state.selectedContractRef ? 0 : -1;
                card.innerHTML = `
                  <span class="family-pill family-${{row.contractFamily}}">${{row.contractFamily}}</span>
                  <strong>${{row.contractRef}}</strong>
                  <div class="mono">${{row.registryDigestRef ?? row.contractDigestRef}}</div>
                  <div>${{contractRouteFamilies(row).join(", ")}}</div>
                  <span class="state-pill state-${{row.validationState}}">${{row.validationState}}</span>
                `;
                card.addEventListener("click", () => {{
                  state.selectedContractRef = row.contractRef;
                  render();
                }});
                card.addEventListener("keydown", (event) => {{
                  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                  event.preventDefault();
                  const nextIndex = event.key === "ArrowDown" ? Math.min(rows.length - 1, index + 1) : Math.max(0, index - 1);
                  state.selectedContractRef = rows[nextIndex].contractRef;
                  render();
                  requestAnimationFrame(() => {{
                    cardList.querySelector(`[data-testid="contract-card-${{rows[nextIndex].contractRef}}"]`)?.focus();
                  }});
                }});
                cardList.appendChild(card);
              }});
            }}

            function renderInspector(contract) {{
              if (!contract) {{
                inspectorEmpty.hidden = false;
                inspectorContent.hidden = true;
                selectionHint.textContent = "No selection";
                return;
              }}
              inspectorEmpty.hidden = true;
              inspectorContent.hidden = false;
              selectionHint.textContent = contract.contractRef;
              const linkedBundles = payload.routeFamilyBundles.filter((bundle) => contractRouteFamilies(contract).includes(bundle.routeFamilyRef));
              const fields = [
                ["Contract family", contract.contractFamily],
                ["Contract ref", contract.contractRef],
                ["Route families", contractRouteFamilies(contract).join(", ")],
                ["Audience surface", contractAudienceRefs(contract).join(", ")],
                ["Gateway surfaces", ("gatewaySurfaceRefs" in contract ? contract.gatewaySurfaceRefs : contract.sourceGatewayRefs).join(", ")],
                ["Raw digest", contract.contractDigestRef],
                ["Registry digest", contract.registryDigestRef ?? contract.contractDigestRef],
                ["Validation state", contract.validationState],
                ["Linked bundles", linkedBundles.map((bundle) => bundle.apiContractRouteBundleId).join(", ")],
              ];
              if ("requiredRouteIntentBindingRef" in contract) {{
                fields.push(["Route intent binding", contract.requiredRouteIntentBindingRef]);
                fields.push(["Decision refs", (contract.routeIntentDecisionRefs ?? []).join(", ") || "parallel-gap-stubbed"]);
              }}
              if ("requiredTrustBoundaryRefs" in contract) {{
                fields.push(["Trust boundaries", contract.requiredTrustBoundaryRefs.join(", ")]);
              }}
              if ("clientCachePolicyId" in contract) {{
                fields.push(["Storage mode", contract.storageMode]);
              }}
              inspectorDefinitionList.innerHTML = "";
              for (const [label, value] of fields) {{
                const dt = document.createElement("dt");
                dt.textContent = label;
                const dd = document.createElement("dd");
                dd.textContent = value;
                inspectorDefinitionList.append(dt, dd);
              }}
            }}

            function renderBundleStrip(contract) {{
              const linkedRouteRefs = contract ? contractRouteFamilies(contract) : [];
              bundleStripList.innerHTML = "";
              payload.manifestReadyRouteFamilySets.forEach((bundleSet) => {{
                const pill = document.createElement("div");
                pill.className = "bundle-pill mono";
                pill.dataset.testid = `bundle-pill-${{bundleSet.manifestReadyRouteFamilySetId}}`;
                pill.dataset.linked = String(linkedRouteRefs.some((routeRef) => bundleSet.routeFamilyRefs.includes(routeRef)));
                pill.textContent = `${{bundleSet.audienceSurface}} · ${{bundleSet.routeFamilyRefs.length}} routes`;
                bundleStripList.appendChild(pill);
              }});
            }}

            function renderMatrix(contract) {{
              const linkedRouteRefs = contract ? new Set(contractRouteFamilies(contract)) : new Set();
              const filtered = matrixRows.filter((row) => {{
                if (state.routeFamily !== "all" && row.route_family_ref !== state.routeFamily) return false;
                if (state.audience !== "all" && row.audience_surface !== state.audience) return false;
                return true;
              }});
              matrixBody.innerHTML = "";
              filtered.forEach((row) => {{
                const tr = document.createElement("tr");
                tr.dataset.testid = `matrix-row-${{row.route_family_ref}}`;
                tr.dataset.selected = String(linkedRouteRefs.has(row.route_family_ref));
                tr.innerHTML = `
                  <td class="mono">${{row.route_family_ref}}</td>
                  <td class="mono">${{row.projection_query_contract_ref}}</td>
                  <td class="mono">${{row.mutation_command_contract_ref}}</td>
                  <td class="mono">${{row.live_update_channel_contract_ref || "none"}}</td>
                  <td class="mono">${{row.client_cache_policy_refs}}</td>
                  <td><span class="state-pill state-${{row.validation_state}}">${{row.validation_state}}</span></td>
                `;
                matrixBody.appendChild(tr);
              }});
            }}

            function renderValidationRules() {{
              validationRuleBody.innerHTML = "";
              payload.validationRules.forEach((rule) => {{
                const tr = document.createElement("tr");
                tr.innerHTML = `
                  <td class="mono">${{rule.validationRuleId}}</td>
                  <td>${{rule.severity}}</td>
                  <td>${{rule.ruleSummary}}</td>
                `;
                validationRuleBody.appendChild(tr);
              }});
            }}

            function renderDefects() {{
              defectStripList.innerHTML = "";
              [...payload.parallelInterfaceGaps, ...payload.defects].forEach((item) => {{
                const card = document.createElement("div");
                card.className = "defect-card";
                card.dataset.testid = `defect-card-${{item.gapId ?? item.defectId}}`;
                const label = item.gapId ?? item.defectId;
                const stateLabel = item.gapKind ? "warning" : item.state;
                card.innerHTML = `
                  <div class="mono" style="margin-bottom: 8px;">${{label}}</div>
                  <span class="state-pill state-${{stateLabel}}">${{stateLabel}}</span>
                  <p>${{item.resolution ?? item.summary}}</p>
                `;
                defectStripList.appendChild(card);
              }});
            }}

            function render() {{
              const rows = filteredContracts();
              ensureSelection(rows);
              const contract = selectedContract();
              renderCards(rows);
              renderInspector(contract);
              renderBundleStrip(contract);
              renderMatrix(contract);
              renderValidationRules();
              renderDefects();
            }}

            render();
          </script>
        </body>
        </html>
        """
    )


def main() -> None:
    payload = build_payload()
    matrix_rows = build_matrix_rows(payload)

    write_json(MANIFEST_PATH, payload)
    write_csv(
        MATRIX_PATH,
        matrix_rows,
        [
            "route_family_ref",
            "route_family_label",
            "audience_surface",
            "frontend_contract_manifest_ref",
            "manifest_ready_route_family_set_ref",
            "gateway_surface_refs",
            "projection_query_contract_ref",
            "projection_query_digest_ref",
            "mutation_command_contract_ref",
            "mutation_command_digest_ref",
            "live_update_channel_contract_ref",
            "live_update_channel_digest_ref",
            "client_cache_policy_refs",
            "client_cache_policy_digest_refs",
            "validation_state",
            "parallel_interface_gap_refs",
            "defect_refs",
            "source_refs",
        ],
    )

    DESIGN_DOC_PATH.write_text(build_design_doc(payload))
    RULES_DOC_PATH.write_text(build_rules_doc(payload))
    EXPLORER_PATH.write_text(build_explorer_html(payload, matrix_rows))

    write_json(QUERY_SCHEMA_PATH, build_query_schema())
    write_json(MUTATION_SCHEMA_PATH, build_mutation_schema())
    write_json(LIVE_SCHEMA_PATH, build_live_schema())
    write_json(CACHE_SCHEMA_PATH, build_cache_schema())
    write_text(CATALOG_MODULE_PATH, build_catalog_module(payload))
    update_api_contract_package()
    update_gateway_service()


if __name__ == "__main__":
    main()
