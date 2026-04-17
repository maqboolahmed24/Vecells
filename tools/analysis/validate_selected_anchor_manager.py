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
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "persistent-shell"

POLICY_MATRIX_PATH = DATA_DIR / "selected_anchor_policy_matrix.csv"
ADJACENCY_MATRIX_PATH = DATA_DIR / "route_adjacency_matrix.csv"
RESTORE_MATRIX_PATH = DATA_DIR / "navigation_restore_order_matrix.csv"
EXAMPLES_PATH = DATA_DIR / "return_contract_examples.json"

DOC_MANAGER_PATH = DOCS_DIR / "108_selected_anchor_and_return_contract_manager.md"
DOC_LEDGER_PATH = DOCS_DIR / "108_navigation_state_ledger_and_restore_order.md"
DOC_ADJACENCY_PATH = DOCS_DIR / "108_route_adjacency_and_anchor_invalidation_rules.md"
INSPECTOR_PATH = DOCS_DIR / "108_continuity_inspector.html"

BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_selected_anchor_manager.ts"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_selected_anchor_manager.py"
SPEC_PATH = PLAYWRIGHT_DIR / "selected-anchor-return-manager.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
SCHEMA_PATH = PACKAGE_DIR / "contracts" / "selected-anchor-manager.schema.json"
SOURCE_PATH = PACKAGE_DIR / "src" / "selected-anchor-manager.ts"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
SELECTED_ANCHOR_TEST_PATH = PACKAGE_DIR / "tests" / "selected-anchor-manager.test.ts"
VITEST_CONFIG_PATH = PACKAGE_DIR / "vitest.config.ts"

EXPECTED_SUMMARY = {
    "route_count": 19,
    "policy_count": 19,
    "adjacency_count": 99,
    "restore_step_count": 76,
    "scenario_count": 5,
    "gap_resolution_count": 5,
    "follow_on_dependency_count": 4,
}
EXPECTED_SCENARIO_IDS = [
    "SCN_PATIENT_CHILD_RETURN_FULL",
    "SCN_PATIENT_RECORD_RECOVERY_RETURN",
    "SCN_WORKSPACE_QUIET_RETURN",
    "SCN_OPERATIONS_STALE_RETURN",
    "SCN_GOVERNANCE_DIFF_REPLACEMENT",
]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_108 artifact: {path}")


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        POLICY_MATRIX_PATH,
        ADJACENCY_MATRIX_PATH,
        RESTORE_MATRIX_PATH,
        EXAMPLES_PATH,
        DOC_MANAGER_PATH,
        DOC_LEDGER_PATH,
        DOC_ADJACENCY_PATH,
        INSPECTOR_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        PACKAGE_JSON_PATH,
        SCHEMA_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        PUBLIC_API_TEST_PATH,
        SELECTED_ANCHOR_TEST_PATH,
        VITEST_CONFIG_PATH,
    ]:
        assert_exists(path)

    publication = load_json(EXAMPLES_PATH)
    schema = load_json(SCHEMA_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    persistent_shell_package = load_json(PACKAGE_JSON_PATH)
    policy_rows = load_csv_rows(POLICY_MATRIX_PATH)
    adjacency_rows = load_csv_rows(ADJACENCY_MATRIX_PATH)
    restore_rows = load_csv_rows(RESTORE_MATRIX_PATH)

    if publication["task_id"] != "par_108":
        fail("Selected-anchor publication drifted off par_108.")
    if publication["visual_mode"] != "Continuity_Inspector":
        fail("Continuity inspector visual mode drifted.")
    if publication["summary"] != EXPECTED_SUMMARY:
        fail(f"Selected-anchor publication summary drifted: {publication['summary']}")
    if len(publication["selected_anchor_policies"]) != EXPECTED_SUMMARY["policy_count"]:
        fail("Selected-anchor policy count drifted.")
    if len(publication["route_adjacency_contracts"]) != EXPECTED_SUMMARY["adjacency_count"]:
        fail("Route adjacency contract count drifted.")
    if len(publication["restore_orders"]) != EXPECTED_SUMMARY["restore_step_count"]:
        fail("Restore-order count drifted.")
    if len(publication["scenario_examples"]) != EXPECTED_SUMMARY["scenario_count"]:
        fail("Return-contract scenario count drifted.")
    if len(publication["gap_resolutions"]) != EXPECTED_SUMMARY["gap_resolution_count"]:
        fail("Gap-resolution count drifted.")
    if len(publication["follow_on_dependencies"]) != EXPECTED_SUMMARY["follow_on_dependency_count"]:
        fail("Follow-on dependency count drifted.")

    scenario_ids = [scenario["scenarioId"] for scenario in publication["scenario_examples"]]
    if scenario_ids != EXPECTED_SCENARIO_IDS:
        fail(f"Scenario IDs drifted: {scenario_ids}")

    if len(policy_rows) != EXPECTED_SUMMARY["policy_count"]:
        fail("Selected-anchor policy matrix row count drifted.")
    if len(adjacency_rows) != EXPECTED_SUMMARY["adjacency_count"]:
        fail("Route adjacency matrix row count drifted.")
    if len(restore_rows) != EXPECTED_SUMMARY["restore_step_count"]:
        fail("Navigation restore-order matrix row count drifted.")

    if schema["title"] != "Selected Anchor Manager Publication Artifact":
        fail("Selected-anchor schema title drifted.")
    required_props = set(schema["required"])
    if {
        "task_id",
        "visual_mode",
        "summary",
        "selected_anchor_policies",
        "route_adjacency_contracts",
        "restore_orders",
        "scenario_examples",
        "gap_resolutions",
        "follow_on_dependencies",
    } - required_props:
        fail("Selected-anchor schema lost required top-level properties.")

    if (
        ROOT_SCRIPT_UPDATES["validate:selected-anchor-manager"]
        != "python3 ./tools/analysis/validate_selected_anchor_manager.py"
    ):
        fail("Root script updates lost validate:selected-anchor-manager.")
    if "build_selected_anchor_manager.ts" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Root script updates codegen lost build_selected_anchor_manager.ts.")
    if "pnpm validate:selected-anchor-manager" not in ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root script updates bootstrap is missing validate:selected-anchor-manager.")
    if "pnpm validate:selected-anchor-manager" not in ROOT_SCRIPT_UPDATES["check"]:
        fail("Root script updates check is missing validate:selected-anchor-manager.")

    if (
        root_package["scripts"].get("validate:selected-anchor-manager")
        != "python3 ./tools/analysis/validate_selected_anchor_manager.py"
    ):
        fail("Root package lost validate:selected-anchor-manager.")
    if "build_selected_anchor_manager.ts" not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost build_selected_anchor_manager.ts.")
    if "pnpm validate:selected-anchor-manager" not in root_package["scripts"]["bootstrap"]:
        fail("Root package bootstrap is missing validate:selected-anchor-manager.")
    if "pnpm validate:selected-anchor-manager" not in root_package["scripts"]["check"]:
        fail("Root package check is missing validate:selected-anchor-manager.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "selected-anchor-return-manager.spec.js" not in playwright_package["scripts"][script_name]:
            fail(
                f"Playwright package lost selected-anchor-return-manager.spec.js from {script_name}."
            )

    package_exports = persistent_shell_package["exports"]
    if "./contracts/selected-anchor-manager.schema.json" not in package_exports:
        fail("Persistent-shell package exports lost the selected-anchor-manager schema.")
    if persistent_shell_package["scripts"]["test"] != "vitest run --config vitest.config.ts":
        fail("Persistent-shell package test script drifted from the vitest config wrapper.")

    assert_contains(SOURCE_PATH, 'export const SELECTED_ANCHOR_MANAGER_TASK_ID = "par_108"')
    assert_contains(SOURCE_PATH, "export function createInitialContinuitySnapshot(")
    assert_contains(SOURCE_PATH, "export function navigateWithinShell(")
    assert_contains(SOURCE_PATH, "export function invalidateSelectedAnchor(")
    assert_contains(SOURCE_PATH, "export function restoreSnapshotFromRefresh(")
    assert_contains(SOURCE_PATH, "export function buildSelectedAnchorManagerArtifacts()")
    assert_contains(INDEX_PATH, 'from "./selected-anchor-manager";')
    assert_contains(PUBLIC_API_TEST_PATH, "selectedAnchorManagerCatalog")
    assert_contains(SELECTED_ANCHOR_TEST_PATH, "restores the preserved origin anchor")
    assert_contains(VITEST_CONFIG_PATH, 'include: ["tests/**/*.test.ts"]')
    assert_contains(DOC_MANAGER_PATH, "Selected Anchor And Return Contract Manager")
    assert_contains(DOC_LEDGER_PATH, "Navigation State Ledger And Restore Order")
    assert_contains(DOC_ADJACENCY_PATH, "Route Adjacency And Anchor Invalidation Rules")
    assert_contains(INSPECTOR_PATH, 'data-testid="continuity-inspector"')
    assert_contains(INSPECTOR_PATH, 'data-testid="scenario-picker"')
    assert_contains(INSPECTOR_PATH, 'data-testid="route-sequence"')
    assert_contains(INSPECTOR_PATH, 'data-testid="continuity-stage"')
    assert_contains(INSPECTOR_PATH, 'data-testid="continuity-specimen"')
    assert_contains(INSPECTOR_PATH, 'data-testid="continuity-inspector-panel"')
    assert_contains(INSPECTOR_PATH, 'data-testid="selected-anchor-panel"')
    assert_contains(INSPECTOR_PATH, 'data-testid="return-contract-panel"')
    assert_contains(INSPECTOR_PATH, 'data-testid="restore-order-panel"')
    assert_contains(INSPECTOR_PATH, 'data-testid="continuity-timeline"')
    assert_contains(INSPECTOR_PATH, 'data-testid="return-path-diagram"')
    assert_contains(INSPECTOR_PATH, 'data-testid="invalidation-ladder-diagram"')
    assert_contains(INSPECTOR_PATH, 'data-testid="restore-order-diagram"')
    assert_contains(INSPECTOR_PATH, 'data-testid="prev-step"')
    assert_contains(INSPECTOR_PATH, 'data-testid="next-step"')
    assert_contains(INSPECTOR_PATH, 'data-testid="reduced-motion-toggle"')
    assert_contains(INSPECTOR_PATH, 'data-testid="step-indicator"')
    assert_contains(INSPECTOR_PATH, 'data-testid="restore-announcement"')
    assert_contains(INSPECTOR_PATH, 'data-dom-marker="selected-anchor focus-target"')
    assert_contains(INSPECTOR_PATH, 'data-dom-marker="selected-anchor-stub focus-target"')
    assert_contains(INSPECTOR_PATH, 'data-dom-marker="return-contract"')
    assert_contains(SPEC_PATH, "selectedAnchorReturnManagerCoverage")

    print("par_108 selected-anchor manager validation passed")


if __name__ == "__main__":
    main()
