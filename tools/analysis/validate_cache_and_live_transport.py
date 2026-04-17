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
INFRA_DIR = ROOT / "infra" / "cache-live-transport"

CACHE_MANIFEST_PATH = DATA_DIR / "cache_namespace_manifest.json"
LIVE_TRANSPORT_MANIFEST_PATH = DATA_DIR / "live_transport_topology_manifest.json"
BOUNDARY_MATRIX_PATH = DATA_DIR / "cache_transport_boundary_matrix.csv"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"

DESIGN_DOC_PATH = DOCS_DIR / "88_cache_and_live_transport_design.md"
RULES_DOC_PATH = DOCS_DIR / "88_cache_transport_boundary_and_honesty_rules.md"
ATLAS_PATH = DOCS_DIR / "88_live_update_and_cache_atlas.html"
SPEC_PATH = TESTS_DIR / "live-update-and-cache-atlas.spec.js"
BUILD_SCRIPT_PATH = TOOLS_DIR / "build_cache_and_live_transport.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
CACHE_MODULE_MAIN_PATH = INFRA_DIR / "terraform" / "modules" / "cache_plane" / "main.tf"
CACHE_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "cache_plane" / "variables.tf"
)
CACHE_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "cache_plane" / "outputs.tf"
)
TRANSPORT_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "main.tf"
)
TRANSPORT_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "variables.tf"
)
TRANSPORT_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "live_transport_gateway" / "outputs.tf"
)
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "cache-live-transport-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "gateway-safe-transport-policy.json"
LOCAL_BOOTSTRAP_PATH = INFRA_DIR / "local" / "bootstrap-cache-live-transport.mjs"
LOCAL_RESET_PATH = INFRA_DIR / "local" / "reset-cache-live-transport.mjs"
LOCAL_RESTART_PATH = INFRA_DIR / "local" / "restart-live-transport.mjs"
LOCAL_HEARTBEAT_DRILL_PATH = INFRA_DIR / "local" / "drill-heartbeat-loss.mjs"
LOCAL_REPLAY_DRILL_PATH = INFRA_DIR / "local" / "drill-replay-window.mjs"
LOCAL_CACHE_RESET_DRILL_PATH = INFRA_DIR / "local" / "drill-cache-reset.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "cache-live-transport-smoke.test.mjs"

DOMAIN_KERNEL_SOURCE_PATH = ROOT / "packages" / "domain-kernel" / "src" / "cache-live-transport.ts"
DOMAIN_KERNEL_INDEX_PATH = ROOT / "packages" / "domain-kernel" / "src" / "index.ts"
DOMAIN_KERNEL_TEST_PATH = ROOT / "packages" / "domain-kernel" / "tests" / "cache-live-transport.test.ts"
API_GATEWAY_PACKAGE_PATH = ROOT / "services" / "api-gateway" / "package.json"
API_GATEWAY_SOURCE_PATH = ROOT / "services" / "api-gateway" / "src" / "cache-live-transport.ts"
API_GATEWAY_RUNTIME_PATH = ROOT / "services" / "api-gateway" / "src" / "runtime.ts"
API_GATEWAY_SERVICE_DEFINITION_PATH = (
    ROOT / "services" / "api-gateway" / "src" / "service-definition.ts"
)
API_GATEWAY_TEST_PATH = ROOT / "services" / "api-gateway" / "tests" / "cache-live-transport.integration.test.js"

EXPECTED_CLASSES = {
    "runtime_manifest",
    "projection_read",
    "route_family",
    "entity_scoped",
    "transient_replay_support",
}

HTML_MARKERS = [
    'data-testid="topology-diagram"',
    'data-testid="cache-grid"',
    'data-testid="replay-timeline"',
    'data-testid="topology-table"',
    'data-testid="policy-table"',
    'data-testid="inspector"',
]

SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation",
    "reduced-motion",
    "tablet width",
    "Accessibility smoke",
    "visually distinct",
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


def assert_contains(path: Path, needle: str) -> None:
    source = path.read_text(encoding="utf-8")
    require(needle in source, f"{path} is missing required token: {needle}")


def main() -> None:
    required_paths = [
        CACHE_MANIFEST_PATH,
        LIVE_TRANSPORT_MANIFEST_PATH,
        BOUNDARY_MATRIX_PATH,
        FRONTEND_MANIFEST_PATH,
        API_REGISTRY_PATH,
        RUNTIME_TOPOLOGY_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        README_PATH,
        TERRAFORM_MAIN_PATH,
        TERRAFORM_VARIABLES_PATH,
        TERRAFORM_OUTPUTS_PATH,
        CACHE_MODULE_MAIN_PATH,
        CACHE_MODULE_VARIABLES_PATH,
        CACHE_MODULE_OUTPUTS_PATH,
        TRANSPORT_MODULE_MAIN_PATH,
        TRANSPORT_MODULE_VARIABLES_PATH,
        TRANSPORT_MODULE_OUTPUTS_PATH,
        LOCAL_COMPOSE_PATH,
        LOCAL_POLICY_PATH,
        LOCAL_BOOTSTRAP_PATH,
        LOCAL_RESET_PATH,
        LOCAL_RESTART_PATH,
        LOCAL_HEARTBEAT_DRILL_PATH,
        LOCAL_REPLAY_DRILL_PATH,
        LOCAL_CACHE_RESET_DRILL_PATH,
        SMOKE_TEST_PATH,
        DOMAIN_KERNEL_SOURCE_PATH,
        DOMAIN_KERNEL_INDEX_PATH,
        DOMAIN_KERNEL_TEST_PATH,
        API_GATEWAY_PACKAGE_PATH,
        API_GATEWAY_SOURCE_PATH,
        API_GATEWAY_RUNTIME_PATH,
        API_GATEWAY_SERVICE_DEFINITION_PATH,
        API_GATEWAY_TEST_PATH,
    ]
    for path in required_paths:
        require(path.exists(), f"Missing par_088 artifact: {path}")

    cache_manifest = read_json(CACHE_MANIFEST_PATH)
    live_manifest = read_json(LIVE_TRANSPORT_MANIFEST_PATH)
    matrix_rows = read_csv(BOUNDARY_MATRIX_PATH)
    frontend = read_json(FRONTEND_MANIFEST_PATH)
    api_registry = read_json(API_REGISTRY_PATH)
    runtime_topology = read_json(RUNTIME_TOPOLOGY_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    api_gateway_package = read_json(API_GATEWAY_PACKAGE_PATH)

    require(cache_manifest["task_id"] == "par_088", "Cache manifest task id drifted.")
    require(live_manifest["task_id"] == "par_088", "Live transport manifest task id drifted.")
    require(cache_manifest["visual_mode"] == "Live_Update_And_Cache_Atlas", "Cache manifest visual mode drifted.")
    require(live_manifest["visual_mode"] == "Live_Update_And_Cache_Atlas", "Live manifest visual mode drifted.")

    require(
        cache_manifest["summary"]["cache_namespace_count"] == len(cache_manifest["cacheNamespaces"]),
        "Cache namespace summary drifted.",
    )
    require(
        cache_manifest["summary"]["policy_binding_count"] == len(cache_manifest["policyBindings"]),
        "Cache policy binding summary drifted.",
    )
    require(
        set(row["namespaceClass"] for row in cache_manifest["namespaceClasses"]) == EXPECTED_CLASSES,
        "Cache namespace class coverage drifted.",
    )
    require(
        cache_manifest["summary"]["cache_namespace_count"] == frontend["summary"]["client_cache_policy_count"],
        "Cache namespace count no longer matches upstream cache policy count.",
    )

    require(
        live_manifest["summary"]["live_channel_count"] == len(live_manifest["liveChannels"]),
        "Live channel summary drifted.",
    )
    require(
        live_manifest["summary"]["live_channel_count"]
        == frontend["summary"]["live_update_channel_contract_count"],
        "Live channel count no longer matches upstream live contract count.",
    )
    require(
        live_manifest["summary"]["allowed_live_absence_route_family_count"]
        == api_registry["summary"]["allowed_live_absence_count"],
        "Allowed live absence summary drifted.",
    )
    require(
        live_manifest["summary"]["drill_scenario_count"] == len(live_manifest["drillScenarios"]),
        "Drill scenario summary drifted.",
    )

    require(
        len(matrix_rows)
        == api_registry["summary"]["route_family_bundle_count"]
        * len(runtime_topology["environment_manifests"]),
        "Boundary matrix row count drifted.",
    )
    require(
        any(row["channel_state"] == "blocked" for row in matrix_rows),
        "Boundary matrix lost blocked posture rows.",
    )
    require(
        any(row["channel_state"] == "stale" for row in matrix_rows),
        "Boundary matrix lost stale posture rows.",
    )
    require(
        any(row["channel_state"] == "restored" for row in matrix_rows),
        "Boundary matrix lost restored posture rows.",
    )
    require(
        sum(1 for row in matrix_rows if row["channel_state"] == "not_declared")
        == api_registry["summary"]["allowed_live_absence_count"]
        * len(runtime_topology["environment_manifests"]),
        "Boundary matrix no-live rows drifted.",
    )

    require(
        runtime_topology["cache_namespace_manifest_ref"]
        == "data/analysis/cache_namespace_manifest.json",
        "Runtime topology lost cache manifest ref.",
    )
    require(
        runtime_topology["live_transport_topology_manifest_ref"]
        == "data/analysis/live_transport_topology_manifest.json",
        "Runtime topology lost live transport manifest ref.",
    )
    require(
        runtime_topology["cache_transport_boundary_matrix_ref"]
        == "data/analysis/cache_transport_boundary_matrix.csv",
        "Runtime topology lost boundary matrix ref.",
    )
    data_store_refs = {row["data_store_ref"] for row in runtime_topology["data_store_catalog"]}
    require("ds_runtime_cache_plane" in data_store_refs, "Runtime topology lost ds_runtime_cache_plane.")
    require("ds_live_connection_registry" in data_store_refs, "Runtime topology lost ds_live_connection_registry.")
    require("ds_live_replay_buffer" in data_store_refs, "Runtime topology lost ds_live_replay_buffer.")

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    rules_doc = RULES_DOC_PATH.read_text(encoding="utf-8")
    html = ATLAS_PATH.read_text(encoding="utf-8")
    spec = SPEC_PATH.read_text(encoding="utf-8")
    require("21" in design_doc and "15" in design_doc, "Design doc lost expected counts.")
    require("Follow-on Dependency" in rules_doc, "Rules doc lost follow-on dependency section.")
    require("<title>88 Live Update And Cache Atlas</title>" in html, "Atlas title drifted.")
    for marker in HTML_MARKERS:
        require(marker in html, f"Atlas missing marker: {marker}")
    for marker in SPEC_MARKERS:
        require(marker in spec, f"Spec lost required coverage token: {marker}")

    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "build_cache_and_live_transport.py")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "validate:cache-live-transport")
    assert_contains(PLAYWRIGHT_BUILDER_PATH, "live-update-and-cache-atlas.spec.js")
    require(
        root_package["scripts"]["validate:cache-live-transport"]
        == "python3 ./tools/analysis/validate_cache_and_live_transport.py",
        "Root package lost validate:cache-live-transport.",
    )
    require(
        "build_cache_and_live_transport.py" in root_package["scripts"]["codegen"],
        "Root package codegen lost build_cache_and_live_transport.py.",
    )
    require(
        "live-update-and-cache-atlas.spec.js" in playwright_package["scripts"]["e2e"],
        "Playwright package lost live-update-and-cache-atlas spec wiring.",
    )

    assert_contains(DOMAIN_KERNEL_INDEX_PATH, 'export * from "./cache-live-transport";')
    assert_contains(API_GATEWAY_SOURCE_PATH, "honestyLaw")
    require(
        "@vecells/domain-kernel" not in API_GATEWAY_SOURCE_PATH.read_text(encoding="utf-8"),
        "api-gateway cache/live helper crossed the domain boundary.",
    )
    assert_contains(API_GATEWAY_RUNTIME_PATH, 'route.routeId === "get_cache_live_transport_baseline"')
    assert_contains(API_GATEWAY_SERVICE_DEFINITION_PATH, '"get_cache_live_transport_baseline"')
    assert_contains(API_GATEWAY_SERVICE_DEFINITION_PATH, '"cache_live_transport_substrate"')
    assert_contains(API_GATEWAY_TEST_PATH, "/runtime/cache-live-transport")


if __name__ == "__main__":
    main()
