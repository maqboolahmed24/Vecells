#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from build_api_contract_registry import (
    CACHE_SCHEMA_PATH,
    CATALOG_MODULE_PATH,
    DESIGN_DOC_PATH,
    EXPLORER_PATH,
    LIVE_SCHEMA_PATH,
    MANIFEST_PATH,
    MATRIX_PATH,
    MUTATION_SCHEMA_PATH,
    QUERY_SCHEMA_PATH,
    RULES_DOC_PATH,
    build_cache_schema,
    build_live_schema,
    build_mutation_schema,
    build_query_schema,
)


ROOT = Path(__file__).resolve().parents[2]
FRONTEND_MANIFESTS_PATH = ROOT / "data" / "analysis" / "frontend_contract_manifests.json"
PACKAGE_TEST_PATH = ROOT / "packages" / "api-contracts" / "tests" / "api-contract-registry.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "api-contracts" / "tests" / "public-api.test.ts"
PACKAGE_SOURCE_PATH = ROOT / "packages" / "api-contracts" / "src" / "index.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
GATEWAY_SERVICE_PATH = ROOT / "services" / "api-gateway" / "src" / "api-contract-registry.ts"
GATEWAY_DEFINITION_PATH = ROOT / "services" / "api-gateway" / "src" / "service-definition.ts"
GATEWAY_TEST_PATH = ROOT / "services" / "api-gateway" / "tests" / "api-contract-registry.integration.test.js"
SPEC_PATH = ROOT / "tests" / "playwright" / "api-contract-registry-explorer.spec.js"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def ensure_files_exist() -> None:
    required = [
        MANIFEST_PATH,
        MATRIX_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        EXPLORER_PATH,
        QUERY_SCHEMA_PATH,
        MUTATION_SCHEMA_PATH,
        LIVE_SCHEMA_PATH,
        CACHE_SCHEMA_PATH,
        CATALOG_MODULE_PATH,
        PACKAGE_TEST_PATH,
        PUBLIC_API_TEST_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_JSON_PATH,
        GATEWAY_SERVICE_PATH,
        GATEWAY_DEFINITION_PATH,
        GATEWAY_TEST_PATH,
        SPEC_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing par_065 deliverables:\n" + "\n".join(missing))


def validate_payload() -> None:
    payload = read_json(MANIFEST_PATH)
    frontend = read_json(FRONTEND_MANIFESTS_PATH)
    matrix_rows = read_csv(MATRIX_PATH)

    assert_true(payload["task_id"] == "par_065", "Payload task id drifted")
    assert_true(payload["visual_mode"] == "Contract_Registry_Explorer", "Visual mode drifted")
    assert_true(
        payload["summary"]["route_family_bundle_count"] == len(payload["routeFamilyBundles"]),
        "Route bundle count drifted",
    )
    assert_true(
        payload["summary"]["manifest_ready_route_family_set_count"]
        == len(payload["manifestReadyRouteFamilySets"]),
        "Manifest-ready set count drifted",
    )
    assert_true(
        payload["summary"]["projection_query_contract_count"]
        == len(payload["projectionQueryContracts"]),
        "Projection query count drifted",
    )
    assert_true(
        payload["summary"]["mutation_command_contract_count"]
        == len(payload["mutationCommandContracts"]),
        "Mutation contract count drifted",
    )
    assert_true(
        payload["summary"]["live_update_channel_contract_count"]
        == len(payload["liveUpdateChannelContracts"]),
        "Live contract count drifted",
    )
    assert_true(
        payload["summary"]["client_cache_policy_count"] == len(payload["clientCachePolicies"]),
        "Cache policy count drifted",
    )
    assert_true(
        payload["summary"]["digest_record_count"] == len(payload["contractDigestIndex"]),
        "Digest count drifted",
    )
    assert_true(
        len(matrix_rows) == payload["summary"]["route_family_bundle_count"],
        "Matrix row count no longer matches route bundle count",
    )

    manifest_route_families = sorted(
        {
            route_family_ref
            for manifest in frontend["frontendContractManifests"]
            for route_family_ref in manifest["routeFamilyRefs"]
        }
    )
    payload_route_families = sorted(row["routeFamilyRef"] for row in payload["routeFamilyBundles"])
    assert_true(
        payload_route_families == manifest_route_families,
        "Registry route-family coverage drifted from frontend manifest coverage",
    )

    live_absence_routes = sorted(
        row["routeFamilyRef"]
        for row in payload["routeFamilyBundles"]
        if row["liveUpdateChannelContractRef"] is None
    )
    assert_true(
        live_absence_routes
        == [
            "rf_intake_self_service",
            "rf_intake_telephony_capture",
            "rf_patient_health_record",
            "rf_patient_secure_link_recovery",
        ],
        "Allowed live-channel absences drifted",
    )

    digest_keys = {(row["contractFamily"], row["registryDigestRef"]) for row in payload["contractDigestIndex"]}
    assert_true(
        len(digest_keys) == len(payload["contractDigestIndex"]),
        "Registry digest index lost determinism",
    )

    warning_routes = [
        row["routeFamilyRef"] for row in payload["routeFamilyBundles"] if row["validationState"] == "warning"
    ]
    assert_true(
        payload["summary"]["warning_route_family_count"] == len(warning_routes),
        "Warning route-family summary drifted",
    )
    assert_true(
        payload["summary"]["parallel_interface_gap_count"] == len(payload["parallelInterfaceGaps"]),
        "Parallel gap summary drifted",
    )
    assert_true(
        payload["summary"]["allowed_live_absence_count"] == len(payload["defects"]),
        "Allowed live-absence summary drifted",
    )


def validate_schemas() -> None:
    assert_true(read_json(QUERY_SCHEMA_PATH) == build_query_schema(), "Projection query schema drifted")
    assert_true(read_json(MUTATION_SCHEMA_PATH) == build_mutation_schema(), "Mutation schema drifted")
    live_schema = read_json(LIVE_SCHEMA_PATH)
    expected_live_schema = build_live_schema()
    required_live_fields = {
        "liveUpdateChannelContractId",
        "routeFamilyRef",
        "channelCode",
        "transport",
        "requiredTrustBoundaryRefs",
        "requiredRuntimeReadinessRefs",
        "contractDigestRef",
        "registryDigestRef",
        "validationState",
        "source_refs",
    }
    assert_true(live_schema["title"] == expected_live_schema["title"], "Live channel schema title drifted")
    assert_true(live_schema["type"] == expected_live_schema["type"], "Live channel schema type drifted")
    assert_true(
        required_live_fields.issubset(set(live_schema["required"])),
        "Live channel schema drifted",
    )
    assert_true(
        required_live_fields.issubset(set(live_schema["properties"])),
        "Live channel schema properties drifted",
    )
    cache_schema = read_json(CACHE_SCHEMA_PATH)
    expected_cache_schema = build_cache_schema()
    required_cache_fields = {
        "clientCachePolicyId",
        "routeFamilyRefs",
        "contractDigestRef",
        "registryDigestRef",
        "validationState",
        "source_refs",
    }
    assert_true(
        cache_schema["title"] == expected_cache_schema["title"],
        "Cache policy schema title drifted",
    )
    assert_true(
        cache_schema["type"] == expected_cache_schema["type"],
        "Cache policy schema type drifted",
    )
    assert_true(
        required_cache_fields.issubset(set(cache_schema["required"])),
        "Cache policy schema drifted",
    )
    assert_true(
        required_cache_fields.issubset(set(cache_schema["properties"])),
        "Cache policy schema properties drifted",
    )


def validate_markers() -> None:
    doc_markers = [
        "# 65 API Contract Registry Design",
        "# 65 Contract Registry Generation And Lookup Rules",
    ]
    for marker, path in zip(doc_markers, [DESIGN_DOC_PATH, RULES_DOC_PATH], strict=True):
        assert_true(marker in path.read_text(), f"Missing documentation marker {marker}")

    html = EXPLORER_PATH.read_text()
    for marker in [
        'data-testid="registry-masthead"',
        'data-testid="contract-constellation"',
        'data-testid="bundle-strip"',
        'data-testid="digest-inspector"',
        'data-testid="route-family-matrix"',
        'data-testid="defect-strip"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_true(marker in html, f"Explorer lost marker {marker}")

    catalog_module = CATALOG_MODULE_PATH.read_text()
    for marker in [
        "apiContractRegistryCatalog",
        "apiContractRegistrySchemas",
        "apiContractRegistryPayload",
    ]:
        assert_true(marker in catalog_module, f"Catalog module lost marker {marker}")

    spec = SPEC_PATH.read_text()
    for marker in [
        "contract-family filtering",
        "audience and route-family filtering",
        "card selection",
        "keyboard navigation",
        "reduced motion",
        "table parity",
        "filter-contract-family",
        "filter-audience",
        "filter-route-family",
    ]:
        assert_true(marker in spec, f"Explorer spec lost marker {marker}")

    gateway_definition = GATEWAY_DEFINITION_PATH.read_text()
    assert_true("/contracts/registry" in gateway_definition, "API gateway route catalog lost registry route")
    gateway_service = GATEWAY_SERVICE_PATH.read_text()
    assert_true(
        "buildApiContractRegistryResponse" in gateway_service,
        "API gateway registry service lost response builder",
    )

    package_source = PACKAGE_SOURCE_PATH.read_text()
    for marker in [
        '// par_065_api_contract_registry_exports:start',
        'export * from "./api-contract-registry";',
        '// par_065_api_contract_registry_exports:end',
    ]:
        assert_true(marker in package_source, f"API contracts index lost marker {marker}")

    public_api_test = PUBLIC_API_TEST_PATH.read_text()
    for marker in [
        "apiContractRegistryCatalog",
        "apiContractRegistrySchemas",
        "publishes the par_065 api contract registry schema surface",
    ]:
        assert_true(marker in public_api_test, f"Public API proof lost marker {marker}")

    package_json = read_json(PACKAGE_JSON_PATH)
    exports = package_json.get("exports", {})
    for export_key in [
        "./schemas/projection-query-contract.schema.json",
        "./schemas/mutation-command-contract.schema.json",
        "./schemas/live-update-channel-contract.schema.json",
        "./schemas/client-cache-policy.schema.json",
    ]:
        assert_true(
            exports.get(export_key) == export_key,
            f"API contracts package export missing {export_key}",
        )


def main() -> None:
    ensure_files_exist()
    validate_payload()
    validate_schemas()
    validate_markers()
    print("par_065 api contract registry validation passed")


if __name__ == "__main__":
    main()
