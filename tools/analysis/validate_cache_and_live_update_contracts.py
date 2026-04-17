#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"

CACHE_CATALOG_PATH = DATA_DIR / "client_cache_policy_catalog.json"
LIVE_CATALOG_PATH = DATA_DIR / "live_update_channel_contract_catalog.json"
RECOVERY_MATRIX_PATH = DATA_DIR / "browser_recovery_posture_matrix.csv"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
FRONTEND_MANIFESTS_PATH = DATA_DIR / "frontend_contract_manifests.json"
RUNTIME_BUNDLES_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_RECORDS_PATH = DATA_DIR / "release_publication_parity_records.json"

CACHE_SCHEMA_PATH = ROOT / "packages" / "api-contracts" / "schemas" / "client-cache-policy.schema.json"
LIVE_SCHEMA_PATH = (
    ROOT / "packages" / "api-contracts" / "schemas" / "live-update-channel-contract.schema.json"
)
BROWSER_SCHEMA_PATH = (
    ROOT / "packages" / "api-contracts" / "schemas" / "browser-recovery-posture.schema.json"
)
API_CONTRACTS_PACKAGE_PATH = ROOT / "packages" / "api-contracts" / "package.json"
API_CONTRACTS_PUBLIC_API_TEST_PATH = (
    ROOT / "packages" / "api-contracts" / "tests" / "public-api.test.ts"
)

RELEASE_CONTROLS_INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
RELEASE_CONTROLS_GOVERNOR_PATH = (
    ROOT / "packages" / "release-controls" / "src" / "browser-runtime-governor.ts"
)
RELEASE_CONTROLS_CATALOG_PATH = (
    ROOT / "packages" / "release-controls" / "src" / "browser-runtime-governor.catalog.ts"
)
RELEASE_CONTROLS_PUBLIC_API_TEST_PATH = (
    ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
)

API_GATEWAY_ROUTE_PATH = ROOT / "services" / "api-gateway" / "src" / "service-definition.ts"
API_GATEWAY_RUNTIME_PATH = ROOT / "services" / "api-gateway" / "src" / "runtime.ts"
API_GATEWAY_CONTROLLER_PATH = ROOT / "services" / "api-gateway" / "src" / "cache-channel-contracts.ts"
API_GATEWAY_TEST_PATH = (
    ROOT / "services" / "api-gateway" / "tests" / "cache-channel-contracts.integration.test.js"
)

DESIGN_DOC_PATH = DOCS_DIR / "96_client_cache_and_live_update_design.md"
RECOVERY_DOC_PATH = DOCS_DIR / "96_recovery_posture_and_staleness_disclosure.md"
MATRIX_DOC_PATH = DOCS_DIR / "96_browser_freshness_and_recovery_matrix.md"
STUDIO_PATH = DOCS_DIR / "96_cache_channel_contract_studio.html"
SPEC_PATH = TESTS_DIR / "cache-channel-contract-studio.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_cache_and_live_update_contracts.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

EXPECTED_POSTURES = {"live", "read_only", "recovery_only", "blocked"}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def assert_exists(path: Path) -> None:
    require(path.exists(), f"Missing required par_096 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    required_paths = [
        CACHE_CATALOG_PATH,
        LIVE_CATALOG_PATH,
        RECOVERY_MATRIX_PATH,
        API_REGISTRY_PATH,
        FRONTEND_MANIFESTS_PATH,
        RUNTIME_BUNDLES_PATH,
        PARITY_RECORDS_PATH,
        CACHE_SCHEMA_PATH,
        LIVE_SCHEMA_PATH,
        BROWSER_SCHEMA_PATH,
        API_CONTRACTS_PACKAGE_PATH,
        API_CONTRACTS_PUBLIC_API_TEST_PATH,
        RELEASE_CONTROLS_INDEX_PATH,
        RELEASE_CONTROLS_GOVERNOR_PATH,
        RELEASE_CONTROLS_CATALOG_PATH,
        RELEASE_CONTROLS_PUBLIC_API_TEST_PATH,
        API_GATEWAY_ROUTE_PATH,
        API_GATEWAY_RUNTIME_PATH,
        API_GATEWAY_CONTROLLER_PATH,
        API_GATEWAY_TEST_PATH,
        DESIGN_DOC_PATH,
        RECOVERY_DOC_PATH,
        MATRIX_DOC_PATH,
        STUDIO_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]
    for path in required_paths:
        assert_exists(path)

    cache_catalog = read_json(CACHE_CATALOG_PATH)
    live_catalog = read_json(LIVE_CATALOG_PATH)
    matrix_rows = read_csv(RECOVERY_MATRIX_PATH)
    api_registry = read_json(API_REGISTRY_PATH)
    frontend_manifests = read_json(FRONTEND_MANIFESTS_PATH)
    runtime_bundles = read_json(RUNTIME_BUNDLES_PATH)
    parity_records = read_json(PARITY_RECORDS_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    api_contracts_package = read_json(API_CONTRACTS_PACKAGE_PATH)

    require(cache_catalog["task_id"] == "par_096", "Cache catalog task id drifted off par_096.")
    require(live_catalog["task_id"] == "par_096", "Live channel catalog task id drifted off par_096.")

    cache_rows = cache_catalog["clientCachePolicies"]
    live_rows = live_catalog["liveUpdateChannelContracts"]
    route_family_count = api_registry["summary"]["route_family_bundle_count"]
    manifest_count = frontend_manifests["summary"]["manifest_count"]
    ring_count = runtime_bundles["summary"]["runtime_publication_bundle_count"]
    allowed_live_absence_count = api_registry["summary"]["allowed_live_absence_count"]

    require(
        len(cache_rows) == cache_catalog["summary"]["client_cache_policy_count"],
        "Cache catalog summary drifted.",
    )
    require(
        len(cache_rows) == api_registry["summary"]["client_cache_policy_count"],
        "Cache catalog no longer matches API contract registry cache count.",
    )
    require(
        len(cache_rows) == frontend_manifests["summary"]["client_cache_policy_count"],
        "Cache catalog no longer matches frontend manifest cache count.",
    )
    require(
        cache_catalog["summary"]["route_family_coverage_count"] == route_family_count,
        "Cache route family coverage drifted.",
    )
    require(
        cache_catalog["summary"]["audience_surface_count"] == manifest_count,
        "Cache audience surface coverage drifted.",
    )

    require(
        len(live_rows) == live_catalog["summary"]["live_update_channel_contract_count"],
        "Live channel catalog summary drifted.",
    )
    require(
        len(live_rows) == api_registry["summary"]["live_update_channel_contract_count"],
        "Live channel catalog no longer matches API contract registry.",
    )
    require(
        len(live_rows) == frontend_manifests["summary"]["live_update_channel_contract_count"],
        "Live channel catalog no longer matches frontend manifests.",
    )
    require(
        live_catalog["summary"]["route_family_coverage_count"] + allowed_live_absence_count
        == route_family_count,
        "Live channel coverage plus allowed absences no longer equals route family coverage.",
    )

    require(
        len(matrix_rows) == route_family_count * ring_count,
        "Browser recovery posture matrix row count drifted.",
    )
    require(
        sum(1 for row in matrix_rows if not row["liveUpdateChannelContractRef"])
        == allowed_live_absence_count * ring_count,
        "Matrix no-live row count drifted.",
    )
    require(
        {row["baselineBrowserPosture"] for row in matrix_rows}.issubset(EXPECTED_POSTURES),
        "Matrix contains unknown baseline browser posture.",
    )
    require(
        {row["publicationDriftPosture"] for row in matrix_rows}.issubset(EXPECTED_POSTURES),
        "Matrix contains unknown publication drift posture.",
    )
    require(
        {row["replayGapPosture"] for row in matrix_rows}.issubset(EXPECTED_POSTURES),
        "Matrix contains unknown replay-gap posture.",
    )
    require(
        any(row["routeFamilyRef"] == "rf_operations_board" for row in matrix_rows),
        "Matrix lost rf_operations_board coverage.",
    )
    require(
        any(row["routeFamilyRef"] == "rf_governance_shell" for row in matrix_rows),
        "Matrix lost rf_governance_shell coverage.",
    )
    require(
        any(
            row["routeFamilyRef"] == "rf_intake_self_service"
            and not row["liveUpdateChannelContractRef"]
            for row in matrix_rows
        ),
        "Allowed live-absence route rf_intake_self_service no longer fails closed in the matrix.",
    )

    require(
        ring_count == parity_records["summary"]["release_publication_parity_record_count"],
        "Runtime publication bundle count no longer matches parity record count.",
    )

    scripts = root_package["scripts"]
    require(
        scripts.get("validate:cache-channel-contracts")
        == ROOT_SCRIPT_UPDATES["validate:cache-channel-contracts"],
        "Root validate:cache-channel-contracts script drifted.",
    )
    require(
        "build_cache_and_live_update_contracts.py" in scripts["codegen"],
        "Root codegen script is missing the par_096 builder.",
    )
    require(
        "validate:cache-channel-contracts" in scripts["bootstrap"],
        "Root bootstrap script is missing validate:cache-channel-contracts.",
    )
    require(
        "validate:cache-channel-contracts" in scripts["check"],
        "Root check script is missing validate:cache-channel-contracts.",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "cache-channel-contract-studio.spec.js" in playwright_package["scripts"][script_name],
            f"Playwright {script_name} script is missing the par_096 studio spec.",
        )

    exports = api_contracts_package["exports"]
    require(
        exports.get("./schemas/browser-recovery-posture.schema.json")
        == "./schemas/browser-recovery-posture.schema.json",
        "API contracts package lost browser recovery posture schema export.",
    )
    assert_contains(
        API_CONTRACTS_PUBLIC_API_TEST_PATH,
        "publishes the par_096 browser recovery schema surface",
    )
    assert_contains(RELEASE_CONTROLS_INDEX_PATH, 'export * from "./browser-runtime-governor";')
    assert_contains(RELEASE_CONTROLS_GOVERNOR_PATH, "resolveBrowserRuntimeDecision")
    assert_contains(RELEASE_CONTROLS_GOVERNOR_PATH, "createBrowserRuntimeSimulationHarness")
    assert_contains(RELEASE_CONTROLS_CATALOG_PATH, 'taskId: "par_096"')
    assert_contains(RELEASE_CONTROLS_CATALOG_PATH, "browserRecoveryPostureRowCount: 95")
    assert_contains(
        RELEASE_CONTROLS_PUBLIC_API_TEST_PATH,
        "runs the browser runtime governor simulation harness",
    )
    assert_contains(RELEASE_CONTROLS_PUBLIC_API_TEST_PATH, 'toBe("par_096")')

    assert_contains(API_GATEWAY_ROUTE_PATH, "/runtime/cache-channel-contracts")
    assert_contains(API_GATEWAY_ROUTE_PATH, "get_cache_channel_contracts")
    assert_contains(API_GATEWAY_RUNTIME_PATH, 'from "./cache-channel-contracts";')
    assert_contains(API_GATEWAY_RUNTIME_PATH, "buildCacheChannelContractsResponse")
    assert_contains(API_GATEWAY_CONTROLLER_PATH, "resolveBrowserRuntimeDecision")
    assert_contains(API_GATEWAY_CONTROLLER_PATH, "lookupMode: \"cache_channel_contract_governor\"")
    assert_contains(API_GATEWAY_TEST_PATH, "/runtime/cache-channel-contracts")
    assert_contains(API_GATEWAY_TEST_PATH, "transport_replay_gap")

    assert_contains(STUDIO_PATH, 'data-testid="filter-audience"')
    assert_contains(STUDIO_PATH, 'data-testid="matrix-table"')
    assert_contains(STUDIO_PATH, 'data-testid="inspector"')
    assert_contains(STUDIO_PATH, 'aria-label="Runtime contract filters"')
    assert_contains(STUDIO_PATH, 'body[data-reduced-motion="true"]')
    assert_contains(SPEC_PATH, "filter behavior and synchronized selection")
    assert_contains(SPEC_PATH, "keyboard navigation")
    assert_contains(SPEC_PATH, "accessibility smoke checks and landmark verification")
    assert_contains(SPEC_PATH, "cacheChannelContractStudioCoverage")


if __name__ == "__main__":
    main()
