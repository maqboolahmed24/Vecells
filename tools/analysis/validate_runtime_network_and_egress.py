#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
INFRA_DIR = ROOT / "infra" / "runtime-network"
TOOLS_DIR = ROOT / "tools" / "analysis"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
BOUNDARY_MATRIX_PATH = DATA_DIR / "trust_zone_boundary_matrix.csv"
ALLOWLIST_MANIFEST_PATH = DATA_DIR / "private_egress_allowlist_manifest.json"

DESIGN_DOC_PATH = DOCS_DIR / "84_core_network_and_private_egress_design.md"
REALIZATION_DOC_PATH = DOCS_DIR / "84_runtime_topology_and_trust_boundary_realization.md"
HTML_PATH = DOCS_DIR / "84_runtime_network_trust_atlas.html"
SPEC_PATH = TESTS_DIR / "runtime-network-trust-atlas.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_runtime_network_and_egress.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
PLAYWRIGHT_PACKAGE_BUILDER = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "network-policy.json"
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "runtime-network-emulator.compose.yaml"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "runtime-network-smoke.test.mjs"

ENV_FILES = [
    INFRA_DIR / "environments" / "local.auto.tfvars.json",
    INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    INFRA_DIR / "environments" / "production.auto.tfvars.json",
]

MODULE_FILES = [
    INFRA_DIR / "terraform" / "modules" / "core_network" / "main.tf",
    INFRA_DIR / "terraform" / "modules" / "core_network" / "variables.tf",
    INFRA_DIR / "terraform" / "modules" / "core_network" / "outputs.tf",
    INFRA_DIR / "terraform" / "modules" / "workload_segments" / "main.tf",
    INFRA_DIR / "terraform" / "modules" / "workload_segments" / "variables.tf",
    INFRA_DIR / "terraform" / "modules" / "workload_segments" / "outputs.tf",
    INFRA_DIR / "terraform" / "modules" / "private_egress" / "main.tf",
    INFRA_DIR / "terraform" / "modules" / "private_egress" / "variables.tf",
    INFRA_DIR / "terraform" / "modules" / "private_egress" / "outputs.tf",
]

HTML_MARKERS = [
    "Runtime_Network_Trust_Atlas",
    'data-testid="filter-environment"',
    'data-testid="filter-workload-family"',
    'data-testid="filter-boundary-state"',
    'data-testid="filter-egress-scope"',
    'data-testid="topology-diagram"',
    'data-testid="boundary-matrix"',
    'data-testid="egress-flow-map"',
    'data-testid="manifest-table"',
    'data-testid="boundary-table"',
    'data-testid="inspector"',
]

SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path):
    if not path.exists():
        fail(f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, needle: str) -> None:
    if not path.exists():
        fail(f"Missing source file: {path}")
    source = path.read_text(encoding="utf-8")
    if needle not in source:
        fail(f"{path} is missing required token: {needle}")


def main() -> None:
    for path in [
        RUNTIME_TOPOLOGY_PATH,
        BOUNDARY_MATRIX_PATH,
        ALLOWLIST_MANIFEST_PATH,
        DESIGN_DOC_PATH,
        REALIZATION_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_BUILDER,
        README_PATH,
        TERRAFORM_MAIN_PATH,
        TERRAFORM_VARIABLES_PATH,
        TERRAFORM_OUTPUTS_PATH,
        LOCAL_POLICY_PATH,
        LOCAL_COMPOSE_PATH,
        SMOKE_TEST_PATH,
        *ENV_FILES,
        *MODULE_FILES,
    ]:
        assert_true(path.exists(), f"Missing par_084 artifact: {path}")

    manifest = read_json(RUNTIME_TOPOLOGY_PATH)
    boundary_rows = read_csv(BOUNDARY_MATRIX_PATH)
    allowlist_manifest = read_json(ALLOWLIST_MANIFEST_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    local_policy = read_json(LOCAL_POLICY_PATH)

    assert_true(manifest["task_id"] == "seq_046", "runtime_topology_manifest task id drifted from seq_046.")
    assert_true("network_foundation" in manifest, "runtime_topology_manifest is missing network_foundation.")
    network_foundation = manifest["network_foundation"]
    assert_true(network_foundation["task_id"] == "par_084", "network_foundation task id drifted.")
    assert_true(network_foundation["mode"] == "Runtime_Network_Trust_Atlas", "network_foundation mode drifted.")

    environment_realizations = network_foundation["environment_network_realizations"]
    service_identity_catalog = network_foundation["service_identity_catalog"]
    segment_realization_count = sum(
        len(placement["workload_segments"])
        for environment in environment_realizations
        for placement in environment["region_placements"]
    )

    assert_true(
        network_foundation["summary"]["environment_realization_count"] == len(environment_realizations),
        "environment_realization_count drifted.",
    )
    assert_true(
        network_foundation["summary"]["segment_realization_count"] == segment_realization_count,
        "segment_realization_count drifted.",
    )
    assert_true(
        network_foundation["summary"]["service_identity_count"] == len(service_identity_catalog),
        "service_identity_count drifted.",
    )
    assert_true(
        segment_realization_count == len(manifest["runtime_workload_families"]),
        "Network segment realizations no longer cover every runtime workload instance.",
    )

    expected_rings = {"local", "ci-preview", "integration", "preprod", "production"}
    actual_rings = {row["environment_ring"] for row in environment_realizations}
    assert_true(actual_rings == expected_rings, f"Environment ring set drifted: {actual_rings}")
    expected_region_counts = {
        "local": 1,
        "ci-preview": 1,
        "integration": 1,
        "preprod": 2,
        "production": 2,
    }
    for environment in environment_realizations:
        ring = environment["environment_ring"]
        assert_true(
            len(environment["region_placements"]) == expected_region_counts[ring],
            f"Region placement count drifted for {ring}.",
        )

    assert_true(
        manifest["trust_zone_boundary_matrix_ref"] == "data/analysis/trust_zone_boundary_matrix.csv",
        "Manifest trust_zone_boundary_matrix_ref drifted.",
    )
    assert_true(
        manifest["private_egress_allowlist_manifest_ref"]
        == "data/analysis/private_egress_allowlist_manifest.json",
        "Manifest private_egress_allowlist_manifest_ref drifted.",
    )

    declared_boundaries = len(manifest["trust_zone_boundaries"])
    blocked_crossings = len(manifest["blocked_crossings"])
    expected_boundary_rows = len(expected_rings) * (declared_boundaries + blocked_crossings)
    assert_true(len(boundary_rows) == expected_boundary_rows, "Boundary matrix row count drifted.")
    assert_true(
        sum(1 for row in boundary_rows if row["boundary_state"] == "allowed")
        == len(expected_rings) * declared_boundaries,
        "Allowed boundary row count drifted.",
    )
    assert_true(
        sum(1 for row in boundary_rows if row["boundary_state"] == "blocked")
        == len(expected_rings) * blocked_crossings,
        "Blocked boundary row count drifted.",
    )
    blocked_refs = {row["boundary_ref"] for row in boundary_rows if row["boundary_state"] == "blocked"}
    for required in {
        "block_public_edge_to_command",
        "block_public_edge_to_data",
        "block_gateway_to_live_integration",
        "block_gateway_to_simulator",
    }:
        assert_true(required in blocked_refs, f"Boundary matrix is missing blocked crossing {required}.")

    assert_true(allowlist_manifest["task_id"] == "par_084", "Allowlist manifest task id drifted.")
    assert_true(allowlist_manifest["mode"] == "Runtime_Network_Trust_Atlas", "Allowlist manifest mode drifted.")
    allowlists = allowlist_manifest["allowlists"]
    overlays = allowlist_manifest["environment_overlays"]
    external_destination_count = sum(len(row["external_destinations"]) for row in allowlists)
    assert_true(
        allowlist_manifest["summary"]["allowlist_count"] == len(allowlists),
        "Allowlist count drifted.",
    )
    assert_true(
        allowlist_manifest["summary"]["environment_overlay_count"] == len(overlays),
        "Environment overlay count drifted.",
    )
    assert_true(
        allowlist_manifest["summary"]["external_destination_count"] == external_destination_count,
        "External destination count drifted.",
    )
    assert_true(
        allowlist_manifest["summary"]["follow_on_dependency_count"]
        == len(allowlist_manifest["follow_on_dependencies"]),
        "Allowlist follow_on_dependency_count drifted.",
    )
    family_refs = {
        row["runtime_workload_family_ref"] for row in manifest["workload_family_catalog"]
    }
    allowlist_family_refs = {family for row in allowlists for family in row["family_refs"]}
    assert_true(allowlist_family_refs == family_refs, "Allowlist family coverage drifted.")
    for row in allowlists:
        assert_true(row["default_action"] == "deny", f"{row['egress_allowlist_ref']} lost default deny.")
    external_allowlist = next(
        row for row in allowlists if row["egress_allowlist_ref"] == "eal_declared_external_dependencies_only"
    )
    assert_true(
        len(external_allowlist["external_destinations"]) == 5,
        "Integration external destination count drifted.",
    )

    assert_true(
        "published-gateway" in local_policy["browser_addressable_services"],
        "Local policy lost published gateway browser reachability.",
    )
    assert_true(
        "data-plane" in local_policy["blocked_direct_browser_services"],
        "Local policy lost direct browser block for data-plane.",
    )
    assert_true(
        "integration-dispatch" in local_policy["blocked_direct_browser_services"],
        "Local policy lost direct browser block for integration-dispatch.",
    )

    for path, token in [
        (TERRAFORM_MAIN_PATH, 'module "core_network"'),
        (TERRAFORM_MAIN_PATH, 'module "private_egress"'),
        (TERRAFORM_VARIABLES_PATH, 'variable "environment"'),
        (TERRAFORM_OUTPUTS_PATH, 'output "network_foundation_ref"'),
        (SMOKE_TEST_PATH, "default-deny allowlist"),
        (LOCAL_COMPOSE_PATH, "published-gateway"),
        (README_PATH, "provider-neutral Phase 0 runtime network baseline"),
    ]:
        assert_contains(path, token)

    design_doc = DESIGN_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Cloud and IaC baseline",
        "`ASSUMPTION_IAC_TOOL = terraform_or_opentofu`",
        "## Network modules",
        "## Private egress posture",
        "## Local emulation and cutover seams",
    ]:
        assert_true(marker in design_doc, f"Design doc is missing marker: {marker}")

    realization_doc = REALIZATION_DOC_PATH.read_text(encoding="utf-8")
    for marker in [
        "## Trust boundary realization",
        "## Boundary enforcement matrix",
        "## Browser exclusion",
        "## Follow-on dependencies",
    ]:
        assert_true(marker in realization_doc, f"Realization doc is missing marker: {marker}")

    html = HTML_PATH.read_text(encoding="utf-8")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Atlas HTML is missing marker: {marker}")

    spec = SPEC_PATH.read_text(encoding="utf-8")
    for marker in SPEC_MARKERS:
        assert_true(marker in spec, f"Playwright spec is missing marker: {marker}")

    build_script = BUILD_SCRIPT_PATH.read_text(encoding="utf-8")
    for token in [
        "FOLLOW_ON_DEPENDENCY_086_OBJECT_STORAGE_PRIVATE_ENDPOINTS",
        "FOLLOW_ON_DEPENDENCY_090_PUBLISHED_GATEWAY_EDGE_ATTACHMENTS",
        "eal_declared_external_dependencies_only",
        "runtime-network-emulator.compose.yaml",
    ]:
        assert_true(token in build_script, f"Build script is missing token: {token}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "build_runtime_network_and_egress.py",
        "validate:runtime-network-egress",
        "validate_runtime_network_and_egress.py",
    ]:
        assert_true(token in root_script_updates, f"root_script_updates.py is missing token: {token}")

    root_scripts = root_package["scripts"]
    assert_true(
        root_scripts["validate:runtime-network-egress"]
        == "python3 ./tools/analysis/validate_runtime_network_and_egress.py",
        "Root validate:runtime-network-egress script drifted.",
    )
    assert_true(
        "pnpm validate:runtime-network-egress" in root_scripts["bootstrap"]
        and "pnpm validate:runtime-network-egress" in root_scripts["check"],
        "Root bootstrap/check are missing validate:runtime-network-egress.",
    )
    assert_true(
        "build_runtime_network_and_egress.py" in root_scripts["codegen"],
        "Root codegen script is missing build_runtime_network_and_egress.py.",
    )

    playwright_scripts = playwright_package["scripts"]
    for key, token in {
        "build": "node --check runtime-network-trust-atlas.spec.js",
        "lint": "runtime-network-trust-atlas.spec.js",
        "test": "node runtime-network-trust-atlas.spec.js",
        "typecheck": "node --check runtime-network-trust-atlas.spec.js",
        "e2e": "node runtime-network-trust-atlas.spec.js --run",
    }.items():
        assert_true(token in playwright_scripts[key], f"Playwright package script {key} is missing {token}.")

    builder_source = PLAYWRIGHT_PACKAGE_BUILDER.read_text(encoding="utf-8")
    assert_true(
        "runtime-network-trust-atlas.spec.js" in builder_source,
        "build_parallel_foundation_tracks_gate.py is missing runtime-network-trust-atlas.spec.js.",
    )

    print("runtime network and egress validation passed")


if __name__ == "__main__":
    main()
