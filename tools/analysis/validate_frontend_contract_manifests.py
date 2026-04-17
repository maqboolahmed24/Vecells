#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from build_frontend_contract_manifests import (
    CATALOG_DOC_PATH,
    LIVE_CHANNEL_DISABLED_ROUTE_IDS,
    MANIFEST_GROUPS,
    MANIFEST_PATH,
    MATRIX_DOC_PATH,
    MATRIX_PATH,
    PACKAGE_PACKAGE_JSON_PATH,
    PACKAGE_SOURCE_PATH,
    PACKAGE_TEST_PATH,
    PLAYWRIGHT_PACKAGE_PATH,
    PROFILE_PATH,
    PACKAGE_FRONTEND_EXPORTS_END,
    PACKAGE_FRONTEND_EXPORTS_START,
    ROOT_PACKAGE_PATH,
    ROUTE_FAMILY_PATH,
    RULES_PATH,
    SCHEMA_PATH,
    SPEC_PATH,
    STRATEGY_DOC_PATH,
    STUDIO_PATH,
    TASK_ID,
    VISUAL_MODE,
    GATEWAY_SURFACES_PATH,
    build_schema,
    route_behavior,
)


README_MARKERS = [
    "# 50 Frontend Contract Manifest Strategy",
    "# 50 Frontend Contract Manifest Catalog",
    "# 50 Route Contract To Manifest Matrix",
]

HTML_MARKERS = [
    'data-testid="studio-masthead"',
    'data-testid="surface-rail"',
    'data-testid="manifest-braid"',
    'data-testid="manifest-list"',
    'data-testid="matrix-table"',
    'data-testid="profile-matrix"',
    'data-testid="inspector"',
    'data-testid="defect-strip"',
    "prefers-reduced-motion: reduce",
]

SPEC_MARKERS = [
    "audience filtering",
    "manifest selection",
    "card and matrix parity",
    "inspector rendering",
    "keyboard navigation",
    "responsive behavior",
    "reduced motion handling",
    "filter-audience",
    "ArrowDown",
]

RUNTIME_EXAMPLES_PATH = Path("/Users/test/Code/V/data/analysis/frontend_contract_manifest_examples.json")
RUNTIME_VALIDATION_PATH = Path("/Users/test/Code/V/data/analysis/manifest_runtime_validation_examples.json")
RUNTIME_FIELD_MATRIX_PATH = Path("/Users/test/Code/V/data/analysis/manifest_field_coverage_matrix.csv")
RUNTIME_DIGEST_JOIN_PATH = Path("/Users/test/Code/V/data/analysis/manifest_digest_join_matrix.csv")
RUNTIME_CODEGEN_DOC_PATH = Path("/Users/test/Code/V/docs/architecture/113_frontend_contract_manifest_codegen.md")
RUNTIME_VALIDATION_DOC_PATH = Path("/Users/test/Code/V/docs/architecture/113_manifest_runtime_validation.md")
RUNTIME_FAIL_CLOSED_DOC_PATH = Path("/Users/test/Code/V/docs/architecture/113_manifest_drift_and_fail_closed_rules.md")
RUNTIME_HTML_PATH = Path("/Users/test/Code/V/docs/architecture/113_manifest_observatory.html")
RUNTIME_SPEC_PATH = Path("/Users/test/Code/V/tests/playwright/frontend-contract-manifest.spec.js")
RUNTIME_SOURCE_PATH = Path("/Users/test/Code/V/packages/api-contracts/src/frontend-contract-manifest.ts")
RUNTIME_CATALOG_PATH = Path("/Users/test/Code/V/packages/api-contracts/src/frontend-contract-manifest.catalog.ts")
RUNTIME_TEST_PATH = Path("/Users/test/Code/V/packages/api-contracts/tests/frontend-contract-manifest.test.ts")
RUNTIME_SCHEMA_PATH = Path("/Users/test/Code/V/packages/api-contracts/schemas/frontend-contract-manifest-runtime.schema.json")
RUNTIME_VERDICT_SCHEMA_PATH = Path("/Users/test/Code/V/packages/api-contracts/schemas/frontend-contract-manifest-verdict.schema.json")

RUNTIME_HTML_MARKERS = [
    'data-testid="manifest-observatory-root"',
    'data-testid="audience-route-rail"',
    'data-testid="manifest-summary"',
    'data-testid="digest-graph"',
    'data-testid="verdict-rail"',
    'data-testid="drift-timeline"',
    'data-testid="seed-route-specimen"',
    'data-testid="contract-join-graph"',
    'data-testid="authority-tuple-diagram"',
    'data-testid="fail-closed-path-diagram"',
    "prefers-reduced-motion: reduce",
]

RUNTIME_SPEC_MARKERS = [
    "manifest observatory rendering",
    "drift surfacing with last-safe manifest preservation",
    "runtime validation rejecting invalid manifests",
    "seed-route specimen consuming validated manifests only",
    "DOM posture and drift markers",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        MANIFEST_PATH,
        MATRIX_PATH,
        PROFILE_PATH,
        RULES_PATH,
        STRATEGY_DOC_PATH,
        CATALOG_DOC_PATH,
        MATRIX_DOC_PATH,
        STUDIO_PATH,
        SCHEMA_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        PACKAGE_PACKAGE_JSON_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_TEST_PATH,
        Path(__file__),
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_050 deliverables:\n" + "\n".join(missing))


def validate_required_shape(row: dict[str, Any], schema: dict[str, Any], label: str) -> None:
    for key in schema["required"]:
        assert_true(key in row, f"{label} lost required property {key}")
    for key, value in row.items():
        property_schema = schema["properties"].get(key)
        if not property_schema:
            continue
        expected_type = property_schema.get("type")
        if expected_type == "string":
            assert_true(isinstance(value, str) and value != "", f"{label} property {key} must be a non-empty string")
        elif expected_type == "array":
            assert_true(isinstance(value, list), f"{label} property {key} must be an array")
            min_items = property_schema.get("minItems", 0)
            assert_true(len(value) >= min_items, f"{label} property {key} fell below minItems")
            item_type = property_schema.get("items", {}).get("type")
            if item_type == "string":
                assert_true(
                    all(isinstance(item, str) and item != "" for item in value),
                    f"{label} property {key} must contain only non-empty strings",
                )
        if "enum" in property_schema:
            assert_true(value in property_schema["enum"], f"{label} property {key} drifted outside enum")


def validate_manifest_payload() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, str]], list[dict[str, str]], dict[str, Any]]:
    payload = read_json(MANIFEST_PATH)
    profiles = read_json(PROFILE_PATH)
    rules = read_json(RULES_PATH)
    matrix_rows = read_csv(MATRIX_PATH)
    route_rows = read_csv(ROUTE_FAMILY_PATH)
    gateway_payload = read_json(GATEWAY_SURFACES_PATH)
    schema = read_json(SCHEMA_PATH)

    assert_true(payload["task_id"] == TASK_ID, "Manifest payload task id drifted")
    assert_true(payload["visual_mode"] == VISUAL_MODE, "Manifest payload visual mode drifted")
    assert_true(payload["summary"]["manifest_count"] == len(payload["frontendContractManifests"]), "Manifest count summary drifted")
    assert_true(
        payload["summary"]["projection_query_contract_count"] == len(payload["projectionQueryContracts"]),
        "Projection query contract summary drifted",
    )
    assert_true(
        payload["summary"]["mutation_command_contract_count"] == len(payload["mutationCommandContracts"]),
        "Mutation contract summary drifted",
    )
    assert_true(
        payload["summary"]["live_update_channel_contract_count"] == len(payload["liveUpdateChannelContracts"]),
        "Live channel contract summary drifted",
    )
    assert_true(
        payload["summary"]["client_cache_policy_count"] == len(payload["clientCachePolicies"]),
        "Client cache policy summary drifted",
    )
    assert_true(rules["task_id"] == TASK_ID, "Generation-rules payload task id drifted")
    assert_true(rules["summary"] == payload["summary"], "Generation-rules summary drifted from manifest payload")
    assert_true(schema == build_schema(), "Frontend manifest schema drifted from generator output")

    gateway_map = {row["surfaceId"]: row for row in gateway_payload["gateway_surfaces"]}
    route_map = {row["route_family_id"]: row for row in route_rows}
    profile_map = {row["routeFamilyRef"]: row for row in profiles["routeProfiles"]}
    route_contract_map = {row["audienceSurfaceRouteContractId"]: row for row in payload["surfaceRouteContracts"]}
    publication_map = {row["audienceSurfacePublicationRef"]: row for row in payload["surfacePublications"]}
    runtime_binding_map = {
        row["audienceSurfaceRuntimeBindingId"]: row for row in payload["audienceSurfaceRuntimeBindings"]
    }
    version_set_map = {
        row["projectionContractVersionSetId"]: row for row in payload["projectionContractVersionSets"]
    }
    query_ids = {row["projectionQueryContractId"] for row in payload["projectionQueryContracts"]}
    mutation_ids = {row["mutationCommandContractId"] for row in payload["mutationCommandContracts"]}
    live_ids = {row["liveUpdateChannelContractId"] for row in payload["liveUpdateChannelContracts"]}
    cache_ids = {row["clientCachePolicyId"] for row in payload["clientCachePolicies"]}

    active_manifest_ids: list[str] = []
    route_to_manifest: dict[str, str] = {}

    for manifest in payload["frontendContractManifests"]:
        manifest_id = manifest["frontendContractManifestId"]
        active_manifest_ids.append(manifest_id)
        validate_required_shape(manifest, schema, manifest_id)
        assert_true(
            manifest["surfaceRouteContractRef"] in route_contract_map,
            f"{manifest_id} points at unknown surface route contract",
        )
        assert_true(
            manifest["surfacePublicationRef"] in publication_map,
            f"{manifest_id} points at unknown surface publication",
        )
        assert_true(
            manifest["audienceSurfaceRuntimeBindingRef"] in runtime_binding_map,
            f"{manifest_id} points at unknown runtime binding",
        )
        assert_true(
            manifest["projectionContractVersionSetRef"] in version_set_map,
            f"{manifest_id} points at unknown projection version set",
        )
        assert_true(manifest["gatewaySurfaceRef"] in manifest["gatewaySurfaceRefs"], f"{manifest_id} lost primary gateway membership")
        assert_true(bool(manifest["runtimePublicationBundleRef"]), f"{manifest_id} lost runtime publication bundle ref")
        assert_true(bool(manifest["designContractPublicationBundleRef"]), f"{manifest_id} lost design bundle ref")
        assert_true(
            set(manifest["projectionQueryContractRefs"]).issubset(query_ids),
            f"{manifest_id} points at unknown query contracts",
        )
        assert_true(
            set(manifest["mutationCommandContractRefs"]).issubset(mutation_ids),
            f"{manifest_id} points at unknown mutation contracts",
        )
        assert_true(
            set(manifest["liveUpdateChannelContractRefs"]).issubset(live_ids),
            f"{manifest_id} points at unknown live channel contracts",
        )
        assert_true(
            set(manifest["clientCachePolicyRefs"]).issubset(cache_ids),
            f"{manifest_id} points at unknown cache policies",
        )
        assert_true(
            manifest["clientCachePolicyRef"] in manifest["clientCachePolicyRefs"],
            f"{manifest_id} lost primary cache policy membership",
        )
        assert_true(
            len(manifest["routeFamilyRefs"]) == len(set(manifest["routeFamilyRefs"])),
            f"{manifest_id} duplicated route families",
        )
        for route_id in manifest["routeFamilyRefs"]:
            assert_true(route_id in route_map, f"{manifest_id} points at unknown route family {route_id}")
            assert_true(route_id in profile_map, f"{manifest_id} lost route profile for {route_id}")
            assert_true(route_id not in route_to_manifest, f"Route family {route_id} appears in multiple active manifests")
            route_to_manifest[route_id] = manifest_id

            profile = profile_map[route_id]
            assert_true(
                profile["accessibilitySemanticCoverageProfileRef"] in manifest["accessibilitySemanticCoverageProfileRefs"],
                f"{manifest_id} lost accessibility coverage tuple for {route_id}",
            )
            assert_true(
                profile["automationAnchorProfileRef"] in manifest["automationAnchorProfileRefs"],
                f"{manifest_id} lost automation profile for {route_id}",
            )
            assert_true(
                profile["surfaceStateSemanticsProfileRef"] in manifest["surfaceStateSemanticsProfileRefs"],
                f"{manifest_id} lost state semantics profile for {route_id}",
            )
            assert_true(
                profile["surfaceStateKernelBindingRef"] in manifest["surfaceStateKernelBindingRefs"],
                f"{manifest_id} lost kernel binding for {route_id}",
            )

            behavior = route_behavior(route_map[route_id])
            if behavior["hasMutation"]:
                assert_true(
                    any(
                        row["routeFamilyRef"] == route_id
                        for row in payload["mutationCommandContracts"]
                    ),
                    f"{manifest_id} lost mutation contract for writable route {route_id}",
                )
            else:
                assert_true(
                    all(row["routeFamilyRef"] != route_id for row in payload["mutationCommandContracts"]),
                    f"{manifest_id} published mutation contract for read-only route {route_id}",
                )
            if route_id in LIVE_CHANNEL_DISABLED_ROUTE_IDS:
                assert_true(
                    all(row["routeFamilyRef"] != route_id for row in payload["liveUpdateChannelContracts"]),
                    f"{manifest_id} published live channel for disabled route {route_id}",
                )

        publication = publication_map[manifest["surfacePublicationRef"]]
        version_set = version_set_map[manifest["projectionContractVersionSetRef"]]
        binding = runtime_binding_map[manifest["audienceSurfaceRuntimeBindingRef"]]
        assert_true(
            publication["designContractPublicationBundleRef"] == manifest["designContractPublicationBundleRef"],
            f"{manifest_id} design bundle drifted from publication ref",
        )
        assert_true(
            publication["runtimePublicationBundleRef"] == manifest["runtimePublicationBundleRef"],
            f"{manifest_id} runtime bundle drifted from publication ref",
        )
        assert_true(
            binding["runtimePublicationBundleRef"] == manifest["runtimePublicationBundleRef"],
            f"{manifest_id} runtime bundle drifted from runtime binding",
        )
        assert_true(
            binding["surfaceRouteContractRef"] == manifest["surfaceRouteContractRef"],
            f"{manifest_id} route contract drifted from runtime binding",
        )
        assert_true(
            version_set["frontendContractManifestRef"] == manifest_id,
            f"{manifest_id} lost projection version-set backlink",
        )
        assert_true(
            set(version_set["routeFamilyRefs"]) == set(manifest["routeFamilyRefs"]),
            f"{manifest_id} route family set drifted from projection version set",
        )

        if (
            publication["publicationState"] != "current"
            or manifest["accessibilityCoverageState"] != "complete"
            or version_set["compatibilityState"] not in {"exact", "additive_compatible"}
            or binding["surfaceAuthorityState"] != "exact"
        ):
            assert_true(
                manifest["browserPostureState"] != "publishable_live",
                f"{manifest_id} remained publishable_live despite degraded publication/accessibility/projection/runtime state",
            )

    assert_true(len(active_manifest_ids) == len(set(active_manifest_ids)), "Manifest ids lost uniqueness")

    expected_gateway_browser_routes = sorted(
        {
            route_id
            for gateway in gateway_payload["gateway_surfaces"]
            if gateway["browserVisible"]
            for route_id in gateway["routeFamilies"]
        }
    )
    expected_manifest_routes = sorted(
        {
            route_id
            for group in MANIFEST_GROUPS
            for route_id in group["route_family_refs"]
        }
    )
    manifest_routes = sorted(route_to_manifest)
    assert_true(
        manifest_routes == expected_manifest_routes,
        "Frontend manifest route-family coverage drifted from the declared seq_050 grouping law",
    )
    assert_true(
        payload["summary"]["browser_visible_route_family_count"] == len(expected_manifest_routes),
        "Browser-visible route family summary drifted",
    )
    assert_true(
        set(expected_gateway_browser_routes) - set(expected_manifest_routes) == {"rf_assistive_control_shell"},
        "Gateway browser-visible exclusions drifted from the assistive-shell carve-out",
    )
    assert_true(
        set(expected_manifest_routes) - set(expected_gateway_browser_routes) == {"rf_intake_telephony_capture"},
        "Manifest coverage extensions drifted from the telephony-capture public-entry rule",
    )

    group_route_sets = {
        tuple(sorted(group["route_family_refs"])): group["group_id"] for group in MANIFEST_GROUPS
    }
    for manifest in payload["frontendContractManifests"]:
        assert_true(
            tuple(sorted(manifest["routeFamilyRefs"])) in group_route_sets,
            f"{manifest['frontendContractManifestId']} drifted outside the declared manifest grouping law",
        )

    assert_true(
        profiles["summary"]["route_profile_count"] == len(expected_manifest_routes),
        "Route profile count drifted from browser-visible route count",
    )
    assert_true(len(matrix_rows) == len(expected_manifest_routes), "Matrix row count drifted from browser-visible route count")

    matrix_manifest_ids = {row["frontend_contract_manifest_id"] for row in matrix_rows}
    assert_true(
        matrix_manifest_ids == set(active_manifest_ids),
        "Matrix rows no longer cover the same active manifest set",
    )
    for row in matrix_rows:
        manifest_id = row["frontend_contract_manifest_id"]
        manifest = next(
            item for item in payload["frontendContractManifests"] if item["frontendContractManifestId"] == manifest_id
        )
        route_id = row["route_family_id"]
        assert_true(route_id in manifest["routeFamilyRefs"], f"Matrix row {route_id} points at the wrong manifest")
        assert_true(
            row["projection_query_contract_refs"] in manifest["projectionQueryContractRefs"],
            f"Matrix row {route_id} lost declared query contract",
        )
        assert_true(
            row["client_cache_policy_ref"] in manifest["clientCachePolicyRefs"],
            f"Matrix row {route_id} lost declared cache policy",
        )
        if row["mutation_command_contract_refs"]:
            assert_true(
                row["mutation_command_contract_refs"] in manifest["mutationCommandContractRefs"],
                f"Matrix row {route_id} lost declared mutation contract",
            )
        if row["live_update_channel_contract_refs"]:
            assert_true(
                row["live_update_channel_contract_refs"] in manifest["liveUpdateChannelContractRefs"],
                f"Matrix row {route_id} lost declared live channel contract",
            )
        profile = profile_map[route_id]
        assert_true(
            row["accessibility_profile_ref"] == profile["accessibilitySemanticCoverageProfileRef"],
            f"Matrix row {route_id} accessibility profile drifted",
        )
        assert_true(
            row["automation_anchor_profile_ref"] == profile["automationAnchorProfileRef"],
            f"Matrix row {route_id} automation profile drifted",
        )
        assert_true(
            row["surface_state_semantics_profile_ref"] == profile["surfaceStateSemanticsProfileRef"],
            f"Matrix row {route_id} surface state profile drifted",
        )

    return payload, profiles, matrix_rows, route_rows, gateway_payload


def validate_docs_and_browser_surfaces() -> None:
    strategy_doc = STRATEGY_DOC_PATH.read_text()
    catalog_doc = CATALOG_DOC_PATH.read_text()
    matrix_doc = MATRIX_DOC_PATH.read_text()
    for marker, content in zip(README_MARKERS, [strategy_doc, catalog_doc, matrix_doc], strict=True):
        assert_true(marker in content, f"Missing expected documentation marker: {marker}")

    html = STUDIO_PATH.read_text()
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Frontend contract studio lost marker {marker}")

    spec = SPEC_PATH.read_text()
    for marker in SPEC_MARKERS:
        assert_true(marker in spec, f"Frontend contract studio spec lost marker {marker}")


def validate_package_and_script_wiring() -> None:
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    api_package = read_json(PACKAGE_PACKAGE_JSON_PATH)

    root_scripts = root_package["scripts"]
    assert_true(
        "build_frontend_contract_manifests.py" in root_scripts["codegen"],
        "Root codegen script lost seq_050 builder",
    )
    assert_true(
        "validate:frontend" in root_scripts["bootstrap"] and "validate:frontend" in root_scripts["check"],
        "Root bootstrap/check scripts lost validate:frontend",
    )
    assert_true(
        root_scripts["validate:frontend"] == "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
        "Root validate:frontend script drifted",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package["scripts"][script_name]
        assert_true(
            "frontend-contract-studio.spec.js" in script,
            f"Playwright workspace script {script_name} lost seq_050 coverage",
        )

    exports = api_package["exports"]
    assert_true(
        exports.get("./schemas/frontend-contract-manifest.schema.json")
        == "./schemas/frontend-contract-manifest.schema.json",
        "API contracts package lost schema export",
    )

    source = PACKAGE_SOURCE_PATH.read_text()
    assert_true(
        PACKAGE_FRONTEND_EXPORTS_START in source and PACKAGE_FRONTEND_EXPORTS_END in source,
        "API contracts source lost seq_050 export block",
    )
    assert_true("frontendContractManifestCatalog" in source, "API contracts source lost manifest catalog export")

    test_source = PACKAGE_TEST_PATH.read_text()
    assert_true(
        "frontendContractManifestCatalog" in test_source
        and "frontendContractManifestSchemas" in test_source,
        "API contracts public-api test lost seq_050 assertions",
    )


def validate_par_113_runtime_surface() -> None:
    for path in [
        RUNTIME_EXAMPLES_PATH,
        RUNTIME_VALIDATION_PATH,
        RUNTIME_FIELD_MATRIX_PATH,
        RUNTIME_DIGEST_JOIN_PATH,
        RUNTIME_CODEGEN_DOC_PATH,
        RUNTIME_VALIDATION_DOC_PATH,
        RUNTIME_FAIL_CLOSED_DOC_PATH,
        RUNTIME_HTML_PATH,
        RUNTIME_SPEC_PATH,
        RUNTIME_SOURCE_PATH,
        RUNTIME_CATALOG_PATH,
        RUNTIME_TEST_PATH,
        RUNTIME_SCHEMA_PATH,
        RUNTIME_VERDICT_SCHEMA_PATH,
    ]:
        assert_true(path.exists(), f"Missing par_113 artifact: {path}")

    examples = read_json(RUNTIME_EXAMPLES_PATH)
    validation = read_json(RUNTIME_VALIDATION_PATH)
    field_rows = read_csv(RUNTIME_FIELD_MATRIX_PATH)
    digest_rows = read_csv(RUNTIME_DIGEST_JOIN_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    api_package = read_json(PACKAGE_PACKAGE_JSON_PATH)

    assert_true(examples["task_id"] == "par_113", "Runtime manifest examples drifted off par_113.")
    assert_true(examples["visual_mode"] == "Manifest_Observatory", "Manifest observatory mode drifted.")
    assert_true(examples["summary"]["manifest_count"] == len(examples["manifests"]), "Manifest example count drifted.")
    assert_true(examples["summary"]["seed_route_specimen_count"] == len(examples["seed_route_specimens"]), "Seed route specimen count drifted.")
    assert_true(examples["summary"]["publishable_live_count"] == 1, "publishable_live example count drifted.")
    assert_true(examples["summary"]["read_only_count"] == 1, "read_only example count drifted.")
    assert_true(examples["summary"]["recovery_only_count"] == 1, "recovery_only example count drifted.")
    assert_true(examples["summary"]["blocked_count"] == 1, "blocked example count drifted.")
    assert_true(len(examples["assumptions"]) == 2, "Manifest example assumptions drifted.")
    assert_true(len(examples["follow_on_dependencies"]) == 2, "Manifest follow-on dependency count drifted.")

    manifest_ids = {row["frontendContractManifestId"] for row in examples["manifests"]}
    assert_true(
        manifest_ids
        == {
            "FCM_113_PATIENT_PORTAL_LIVE",
            "FCM_113_PATIENT_APPOINTMENTS_READ_ONLY",
            "FCM_113_SUPPORT_RECOVERY_ONLY",
            "FCM_113_GOVERNANCE_BLOCKED",
        },
        "Manifest example ids drifted.",
    )

    validation_states = [row["verdict"]["validationState"] for row in validation["scenarios"]]
    posture_states = [row["verdict"]["effectiveBrowserPosture"] for row in validation["scenarios"]]
    assert_true(validation["task_id"] == "par_113", "Runtime validation examples drifted off par_113.")
    assert_true(validation["summary"]["scenario_count"] == len(validation["scenarios"]), "Runtime validation scenario count drifted.")
    assert_true(validation["summary"]["valid_count"] == validation_states.count("valid"), "Runtime validation valid count drifted.")
    assert_true(validation["summary"]["degraded_count"] == validation_states.count("degraded"), "Runtime validation degraded count drifted.")
    assert_true(validation["summary"]["rejected_count"] == validation_states.count("rejected"), "Runtime validation rejected count drifted.")
    assert_true(validation["summary"]["blocked_count"] == posture_states.count("blocked"), "Runtime validation blocked count drifted.")
    assert_true(len(field_rows) == 16, "Manifest field coverage matrix must publish 16 rows.")
    assert_true(len(digest_rows) == 6, "Manifest digest join matrix must publish 6 rows.")

    for doc_path in [
        RUNTIME_CODEGEN_DOC_PATH,
        RUNTIME_VALIDATION_DOC_PATH,
        RUNTIME_FAIL_CLOSED_DOC_PATH,
    ]:
        assert_true("```mermaid" in doc_path.read_text(), f"{doc_path} lost required mermaid diagrams.")

    html = RUNTIME_HTML_PATH.read_text()
    for marker in RUNTIME_HTML_MARKERS:
        assert_true(marker in html, f"Manifest observatory HTML lost marker: {marker}")

    spec = RUNTIME_SPEC_PATH.read_text()
    for marker in RUNTIME_SPEC_MARKERS:
        assert_true(marker in spec, f"Manifest observatory spec lost coverage text: {marker}")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        assert_true(
            "frontend-contract-manifest.spec.js" in playwright_package["scripts"][script_name],
            f"Playwright script {script_name} lost frontend-contract-manifest.spec.js.",
        )

    exports = api_package["exports"]
    assert_true(
        exports.get("./schemas/frontend-contract-manifest-runtime.schema.json")
        == "./schemas/frontend-contract-manifest-runtime.schema.json",
        "API contracts package lost runtime manifest schema export.",
    )
    assert_true(
        exports.get("./schemas/frontend-contract-manifest-verdict.schema.json")
        == "./schemas/frontend-contract-manifest-verdict.schema.json",
        "API contracts package lost verdict schema export.",
    )

    source = RUNTIME_SOURCE_PATH.read_text()
    for token in [
        'export const FRONTEND_MANIFEST_RUNTIME_TASK_ID = "par_113"',
        "generateFrontendContractManifest(",
        "validateFrontendContractManifest(",
        "consumeValidatedFrontendContractManifest(",
        "class FrontendContractManifestStore",
    ]:
        assert_true(token in source, f"Runtime manifest source lost token: {token}")

    catalog_source = RUNTIME_CATALOG_PATH.read_text()
    for token in [
        "frontendManifestRuntimeCatalog",
        "frontendManifestRuntimeSchemas",
        "frontendContractManifestExamples",
        "frontendManifestValidationExamples",
        "seedRouteManifestSpecimens",
    ]:
        assert_true(token in catalog_source, f"Runtime manifest catalog lost token: {token}")

    package_source = PACKAGE_SOURCE_PATH.read_text()
    assert_true(
        "frontendManifestRuntimeCatalog" in package_source
        and "frontendManifestRuntimeSchemas" in package_source,
        "API contracts index lost par_113 export wiring.",
    )

    runtime_test = RUNTIME_TEST_PATH.read_text()
    for token in [
        "deriveFrontendContractDigest",
        "validateFrontendContractManifest",
        "createFrontendContractManifestStore",
    ]:
        assert_true(token in runtime_test, f"Runtime manifest test lost token: {token}")


def main() -> None:
    ensure_deliverables()
    validate_manifest_payload()
    validate_docs_and_browser_surfaces()
    validate_package_and_script_wiring()
    validate_par_113_runtime_surface()
    print("seq_050 and par_113 frontend contract manifest artifacts validated successfully.")


if __name__ == "__main__":
    main()
