#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"
SERVICE_DIR = ROOT / "services" / "api-gateway"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
MANIFEST_PATH = DATA_DIR / "gateway_surface_manifest.json"
ROUTE_MATRIX_PATH = DATA_DIR / "audience_route_family_to_gateway_matrix.csv"
BOUNDARY_MATRIX_PATH = DATA_DIR / "gateway_downstream_boundary_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "90_gateway_bff_surface_design.md"
RULES_DOC_PATH = DOCS_DIR / "90_audience_gateway_split_and_boundary_rules.md"
HTML_PATH = DOCS_DIR / "90_gateway_surface_authority_atlas.html"
SPEC_PATH = TESTS_DIR / "gateway-surface-authority-atlas.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_gateway_surface_authority.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

SERVICE_DEFINITION_PATH = SERVICE_DIR / "src" / "service-definition.ts"
SERVICE_RUNTIME_PATH = SERVICE_DIR / "src" / "runtime.ts"
AUTHORITY_STORE_PATH = SERVICE_DIR / "src" / "gateway-surface-authority.ts"
README_PATH = SERVICE_DIR / "README.md"
INTEGRATION_TEST_PATH = SERVICE_DIR / "tests" / "gateway-surface-authority.integration.test.js"

EXPECTED_SUMMARY = {
    "gateway_service_count": 7,
    "gateway_surface_count": 22,
    "route_publication_count": 20,
    "deployment_descriptor_count": 7,
    "local_bootstrap_count": 7,
    "published_service_count": 1,
    "degraded_service_count": 6,
    "blocked_service_count": 0,
    "published_route_count": 6,
    "degraded_route_count": 12,
    "blocked_route_count": 2,
    "route_matrix_row_count": 23,
    "boundary_matrix_row_count": 110,
    "parallel_interface_gap_count": 17,
    "refusal_policy_count": 8,
}

EXPECTED_HTML_MARKERS = [
    "Gateway_Surface_Authority_Atlas",
    'data-testid="filter-audience"',
    'data-testid="filter-channel"',
    'data-testid="filter-boundary-state"',
    'data-testid="filter-route-family"',
    'data-testid="filter-publication-state"',
    'data-testid="topology-diagram"',
    'data-testid="authority-map"',
    'data-testid="downstream-matrix"',
    'data-testid="manifest-table"',
    'data-testid="policy-table"',
    'data-testid="inspector"',
]

EXPECTED_SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
    "verification that undeclared route or boundary states visibly downgrade or block the surface instead of remaining calm",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path):
    require(path.exists(), f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, token: str) -> None:
    source = path.read_text(encoding="utf-8")
    require(token in source, f"{path} is missing required token: {token}")


def main() -> None:
    for path in [
        MANIFEST_PATH,
        ROUTE_MATRIX_PATH,
        BOUNDARY_MATRIX_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        RUNTIME_TOPOLOGY_PATH,
        SERVICE_DEFINITION_PATH,
        SERVICE_RUNTIME_PATH,
        AUTHORITY_STORE_PATH,
        README_PATH,
        INTEGRATION_TEST_PATH,
    ]:
        require(path.exists(), f"Missing expected par_090 artifact: {path}")

    manifest = read_json(MANIFEST_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    route_rows = read_csv(ROUTE_MATRIX_PATH)
    boundary_rows = read_csv(BOUNDARY_MATRIX_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    require(manifest["task_id"] == "par_090", "Gateway surface manifest task_id drifted.")
    require(
        manifest["visual_mode"] == "Gateway_Surface_Authority_Atlas",
        "Gateway surface manifest visual_mode drifted.",
    )
    for key, expected in EXPECTED_SUMMARY.items():
        require(manifest["summary"][key] == expected, f"Gateway surface summary drifted for {key}.")

    service_refs = {row["gatewayServiceRef"] for row in manifest["gateway_services"]}
    require(
        service_refs
        == {
            "agws_patient_web",
            "agws_clinical_workspace",
            "agws_support_workspace",
            "agws_hub_desk",
            "agws_pharmacy_console",
            "agws_ops_console",
            "agws_governance_console",
        },
        "Gateway service refs drifted.",
    )
    require(
        any(row["authorityState"] == "published" for row in manifest["gateway_services"]),
        "At least one audience gateway service should remain published.",
    )
    require(
        any(row["routeState"] == "blocked" for row in manifest["route_publications"]),
        "Blocked route publications are required to prove fail-closed posture.",
    )
    require(
        any(
            row["gapId"] == "PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING"
            for row in manifest["parallel_interface_gaps"]
        ),
        "Assistive route parallel gap is missing.",
    )
    require(len(route_rows) == 23, "Audience route-to-gateway matrix row count drifted.")
    require(len(boundary_rows) == 110, "Gateway downstream boundary matrix row count drifted.")
    require(
        sum(1 for row in boundary_rows if row["boundary_state"] == "blocked") == 44,
        "Blocked boundary row count drifted.",
    )
    require(
        {"GR_090_NO_DIRECT_ADAPTER_EGRESS", "GR_090_NO_RAW_DATA_PLANE_ACCESS"}.issubset(
            {row["boundary_rule_ref"] for row in boundary_rows}
        ),
        "Blocked gateway boundary rules drifted.",
    )

    require(
        runtime_topology["gateway_surface_manifest_ref"] == "data/analysis/gateway_surface_manifest.json",
        "Runtime topology gateway surface manifest ref drifted.",
    )
    require(
        runtime_topology["audience_route_family_to_gateway_matrix_ref"]
        == "data/analysis/audience_route_family_to_gateway_matrix.csv",
        "Runtime topology audience route family matrix ref drifted.",
    )
    require(
        runtime_topology["gateway_downstream_boundary_matrix_ref"]
        == "data/analysis/gateway_downstream_boundary_matrix.csv",
        "Runtime topology gateway downstream boundary matrix ref drifted.",
    )

    for token in EXPECTED_HTML_MARKERS:
        assert_contains(HTML_PATH, token)
    for token in EXPECTED_SPEC_MARKERS:
        assert_contains(SPEC_PATH, token)

    for token in [
        "build_gateway_surface_authority.py",
        "validate:gateway-surfaces",
        "pnpm validate:gateway-surfaces",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)
        assert_contains(ROOT_PACKAGE_PATH, token)

    assert_contains(PLAYWRIGHT_PACKAGE_PATH, "gateway-surface-authority-atlas.spec.js")
    assert_contains(PLAYWRIGHT_PACKAGE_BUILDER_PATH, "gateway-surface-authority-atlas.spec.js")

    assert_contains(SERVICE_DEFINITION_PATH, "/authority/surfaces")
    assert_contains(SERVICE_DEFINITION_PATH, "/authority/openapi")
    assert_contains(SERVICE_DEFINITION_PATH, "/authority/evaluate")
    assert_contains(SERVICE_RUNTIME_PATH, "buildGatewaySurfaceAuthorityResponse")
    assert_contains(SERVICE_RUNTIME_PATH, "buildGatewaySurfaceOpenApiResponse")
    assert_contains(SERVICE_RUNTIME_PATH, "buildGatewaySurfaceEvaluationResponse")
    assert_contains(AUTHORITY_STORE_PATH, "DIRECT_ADAPTER_EGRESS_FORBIDDEN")
    assert_contains(AUTHORITY_STORE_PATH, "RAW_DATA_PLANE_ACCESS_FORBIDDEN")
    assert_contains(AUTHORITY_STORE_PATH, "LIVE_CHANNEL_UNDECLARED")
    assert_contains(AUTHORITY_STORE_PATH, "CACHE_POLICY_UNDECLARED")
    assert_contains(README_PATH, "/authority/surfaces")
    assert_contains(INTEGRATION_TEST_PATH, "agws_pharmacy_console")
    assert_contains(INTEGRATION_TEST_PATH, "rf_assistive_control_shell")

    scripts = root_package["scripts"]
    require(
        "build_gateway_surface_authority.py" in scripts["codegen"],
        "Root codegen script does not include par_090 builder.",
    )
    require(
        scripts["validate:gateway-surfaces"] == "python3 ./tools/analysis/validate_gateway_surfaces.py",
        "Root validate:gateway-surfaces script drifted.",
    )
    require(
        "pnpm validate:gateway-surfaces" in scripts["bootstrap"]
        and "pnpm validate:gateway-surfaces" in scripts["check"],
        "Root bootstrap/check are missing validate:gateway-surfaces.",
    )

    playwright_scripts = playwright_package["scripts"]
    for key, token in {
        "build": "node --check gateway-surface-authority-atlas.spec.js",
        "lint": "gateway-surface-authority-atlas.spec.js",
        "test": "node gateway-surface-authority-atlas.spec.js",
        "typecheck": "node --check gateway-surface-authority-atlas.spec.js",
        "e2e": "node gateway-surface-authority-atlas.spec.js --run",
    }.items():
        require(token in playwright_scripts[key], f"Playwright package script {key} is missing {token}.")

    print("gateway surface validation passed")


if __name__ == "__main__":
    main()
