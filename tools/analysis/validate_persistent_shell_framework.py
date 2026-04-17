#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "architecture"
DATA_DIR = ROOT / "data" / "analysis"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "persistent-shell"

FRAMEWORK_DOC_PATH = DOCS_DIR / "106_persistent_shell_framework.md"
OWNERSHIP_DOC_PATH = DOCS_DIR / "106_shell_family_ownership_and_route_residency.md"
TOPOLOGY_DOC_PATH = DOCS_DIR / "106_shell_responsive_topology_and_motion.md"
BOUNDARY_DOC_PATH = DOCS_DIR / "106_shell_boundary_and_restore_rules.md"
GALLERY_PATH = DOCS_DIR / "106_shell_specimen_gallery.html"

CONTRACTS_PATH = DATA_DIR / "persistent_shell_contracts.json"
ROUTE_MAP_PATH = DATA_DIR / "shell_route_residency_map.json"
OWNERSHIP_MATRIX_PATH = DATA_DIR / "shell_family_ownership_matrix.csv"
TOPOLOGY_MATRIX_PATH = DATA_DIR / "shell_topology_breakpoint_matrix.csv"

ROOT_PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
TS_CONFIG_PATH = ROOT / "tsconfig.base.json"

PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
PROJECT_JSON_PATH = PACKAGE_DIR / "project.json"
PACKAGE_INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
CONTRACT_SOURCE_PATH = PACKAGE_DIR / "src" / "contracts.ts"
REACT_SOURCE_PATH = PACKAGE_DIR / "src" / "persistent-shell.tsx"
CSS_PATH = PACKAGE_DIR / "src" / "persistent-shell.css"
UNIT_TEST_PATH = PACKAGE_DIR / "tests" / "persistent-shell.test.ts"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_persistent_shell_framework.py"
SPEC_PATH = PLAYWRIGHT_DIR / "persistent-shell-framework.spec.js"

APP_SHELL_MAP = {
    "patient-web": "patient-web",
    "clinical-workspace": "clinical-workspace",
    "support-workspace": "support-workspace",
    "ops-console": "ops-console",
    "hub-desk": "hub-desk",
    "governance-console": "governance-console",
    "pharmacy-console": "pharmacy-console",
}

EXPECTED_SUMMARY = {
    "shell_count": 7,
    "primary_audience_shell_count": 6,
    "support_extension_count": 1,
    "route_residency_count": 19,
    "runtime_scenario_count": 5,
}
EXPECTED_RUNTIME_SCENARIOS = {
    "live",
    "stale_review",
    "read_only",
    "recovery_only",
    "blocked",
}
EXPECTED_SHELL_SLUGS = set(APP_SHELL_MAP)
EXPECTED_SHELL_FAMILIES = {
    "patient",
    "staff",
    "support",
    "operations",
    "hub",
    "governance",
    "pharmacy",
}
EXPECTED_ROUTE_RESIDENCIES = {
    "resident_root",
    "same_shell_child",
    "same_shell_object_switch",
    "bounded_stage",
}
EXPECTED_BREAKPOINTS = ("xs", "sm", "md", "lg", "xl")
EXPECTED_BREAKPOINT_CLASSES = {
    "xs": "compact",
    "sm": "narrow",
    "md": "medium",
    "lg": "expanded",
    "xl": "wide",
}
EXPECTED_DEFAULT_TOPOLOGIES = {
    "patient-web": "focus_frame",
    "clinical-workspace": "two_plane",
    "support-workspace": "two_plane",
    "ops-console": "two_plane",
    "hub-desk": "two_plane",
    "governance-console": "three_plane",
    "pharmacy-console": "two_plane",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_106 artifact: {path}")


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        FRAMEWORK_DOC_PATH,
        OWNERSHIP_DOC_PATH,
        TOPOLOGY_DOC_PATH,
        BOUNDARY_DOC_PATH,
        GALLERY_PATH,
        CONTRACTS_PATH,
        ROUTE_MAP_PATH,
        OWNERSHIP_MATRIX_PATH,
        TOPOLOGY_MATRIX_PATH,
        ROOT_PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        TS_CONFIG_PATH,
        PACKAGE_JSON_PATH,
        PROJECT_JSON_PATH,
        PACKAGE_INDEX_PATH,
        CONTRACT_SOURCE_PATH,
        REACT_SOURCE_PATH,
        CSS_PATH,
        UNIT_TEST_PATH,
        PUBLIC_API_TEST_PATH,
        VALIDATOR_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    contracts = load_json(CONTRACTS_PATH)
    route_map = load_json(ROUTE_MAP_PATH)
    ownership_rows = load_csv(OWNERSHIP_MATRIX_PATH)
    topology_rows = load_csv(TOPOLOGY_MATRIX_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    persistent_shell_package = load_json(PACKAGE_JSON_PATH)
    tsconfig = load_json(TS_CONFIG_PATH)

    if contracts["task_id"] != "par_106":
        fail("Persistent shell contracts drifted off par_106.")
    if contracts["visual_mode"] != "Persistent_Shell_Framework":
        fail("Persistent shell visual mode drifted.")
    if contracts["summary"] != EXPECTED_SUMMARY:
        fail(f"Persistent shell summary drifted: {contracts['summary']}")
    if set(contracts["runtime_scenarios"]) != EXPECTED_RUNTIME_SCENARIOS:
        fail("Runtime scenario coverage drifted.")
    if len(contracts["shells"]) != EXPECTED_SUMMARY["shell_count"]:
        fail("Contract shell count drifted from the summary.")
    if len(contracts["breakpoint_rows"]) != 35:
        fail("Contract breakpoint rows drifted from 35.")

    shells_by_slug = {shell["shellSlug"]: shell for shell in contracts["shells"]}
    if set(shells_by_slug) != EXPECTED_SHELL_SLUGS:
        fail(f"Shell slug coverage drifted: {set(shells_by_slug) ^ EXPECTED_SHELL_SLUGS}")
    if {shell["shellFamily"] for shell in contracts["shells"]} != EXPECTED_SHELL_FAMILIES:
        fail("Shell family coverage drifted.")

    for shell_slug, shell in shells_by_slug.items():
        if shell["defaultTopology"] != EXPECTED_DEFAULT_TOPOLOGIES[shell_slug]:
            fail(f"{shell_slug} default topology drifted.")
        if shell["defaultTopology"] not in shell["allowedTopologies"]:
            fail(f"{shell_slug} lost its default topology from allowedTopologies.")
        if "mission_stack" not in shell["allowedTopologies"]:
            fail(f"{shell_slug} lost mission_stack support.")
        if shell["ownership"]["shellSlug"] != shell_slug:
            fail(f"{shell_slug} ownership shell mismatch.")
        if len(shell["routeClaims"]) < 1:
            fail(f"{shell_slug} lost route claims.")

    if route_map["task_id"] != "par_106":
        fail("Route residency payload drifted off par_106.")
    if len(route_map["routes"]) != EXPECTED_SUMMARY["route_residency_count"]:
        fail("Route residency map drifted from 19 routes.")

    route_residency_set = {
        route["residency"]
        for route in route_map["routes"].values()
    }
    if route_residency_set != EXPECTED_ROUTE_RESIDENCIES:
        fail(f"Route residency coverage drifted: {route_residency_set ^ EXPECTED_ROUTE_RESIDENCIES}")

    route_count_by_shell = {shell_slug: 0 for shell_slug in EXPECTED_SHELL_SLUGS}
    for route_family_ref, route in route_map["routes"].items():
        shell_slug = route["shell_slug"]
        if shell_slug not in EXPECTED_SHELL_SLUGS:
            fail(f"Route {route_family_ref} points at an unknown shell: {shell_slug}")
        route_count_by_shell[shell_slug] += 1
        if not route["continuity_key"]:
            fail(f"Route {route_family_ref} lost continuity_key.")
        if not route["default_anchor"]:
            fail(f"Route {route_family_ref} lost default_anchor.")
        if route["default_anchor"] not in route["anchors"]:
            fail(f"Route {route_family_ref} default anchor is no longer in anchors.")
        if not route["source_refs"]:
            fail(f"Route {route_family_ref} lost source refs.")

    if len(ownership_rows) != EXPECTED_SUMMARY["shell_count"]:
        fail("Ownership matrix drifted from 7 rows.")
    if len(topology_rows) != 35:
        fail("Topology matrix drifted from 35 rows.")

    ownership_rows_by_shell = {row["shell_slug"]: row for row in ownership_rows}
    if set(ownership_rows_by_shell) != EXPECTED_SHELL_SLUGS:
        fail("Ownership matrix shell set drifted.")

    topology_pairs = {(row["shell_slug"], row["breakpoint"]) for row in topology_rows}
    expected_pairs = {(shell_slug, breakpoint) for shell_slug in EXPECTED_SHELL_SLUGS for breakpoint in EXPECTED_BREAKPOINTS}
    if topology_pairs != expected_pairs:
        fail("Topology matrix lost a shell/breakpoint pair.")

    topology_rows_by_pair = {(row["shell_slug"], row["breakpoint"]): row for row in topology_rows}
    contract_breakpoint_rows = {
        (row["shell_slug"], row["breakpoint"]): row
        for row in contracts["breakpoint_rows"]
    }

    for shell_slug, shell in shells_by_slug.items():
        ownership_row = ownership_rows_by_shell[shell_slug]
        if ownership_row["default_topology"] != shell["defaultTopology"]:
            fail(f"Ownership CSV default topology drifted for {shell_slug}.")
        if int(ownership_row["route_family_count"]) != route_count_by_shell[shell_slug]:
            fail(f"Ownership CSV route_family_count drifted for {shell_slug}.")
        if int(ownership_row["support_region_budget"]) != shell["supportRegionBudget"]:
            fail(f"Ownership CSV support_region_budget drifted for {shell_slug}.")
        if shell["ownership"]["statusStripAuthorityRef"] != ownership_row["status_strip_authority_ref"]:
            fail(f"Ownership CSV status_strip_authority_ref drifted for {shell_slug}.")
        if shell["ownership"]["decisionDockFocusLeaseRef"] != ownership_row["decision_dock_focus_lease_ref"]:
            fail(f"Ownership CSV decision_dock_focus_lease_ref drifted for {shell_slug}.")
        if shell["ownership"]["missionStackFoldPlanRef"] != ownership_row["mission_stack_fold_plan_ref"]:
            fail(f"Ownership CSV mission_stack_fold_plan_ref drifted for {shell_slug}.")

        for breakpoint in EXPECTED_BREAKPOINTS:
            topology_row = topology_rows_by_pair[(shell_slug, breakpoint)]
            contract_row = contract_breakpoint_rows[(shell_slug, breakpoint)]
            if topology_row["breakpoint_class"] != EXPECTED_BREAKPOINT_CLASSES[breakpoint]:
                fail(f"Breakpoint class drifted for {shell_slug}/{breakpoint}.")
            if contract_row["profile"]["breakpointClass"] != EXPECTED_BREAKPOINT_CLASSES[breakpoint]:
                fail(f"Contract breakpoint class drifted for {shell_slug}/{breakpoint}.")

            expected_topology = (
                "mission_stack"
                if breakpoint in {"xs", "sm"}
                else EXPECTED_DEFAULT_TOPOLOGIES[shell_slug]
            )
            if topology_row["resolved_topology"] != expected_topology:
                fail(f"Topology CSV drifted for {shell_slug}/{breakpoint}.")
            if contract_row["profile"]["topology"] != expected_topology:
                fail(f"Contract topology drifted for {shell_slug}/{breakpoint}.")
            if topology_row["profile_selection_resolution_id"] != contract_row["profile"]["profileSelectionResolutionId"]:
                fail(f"Profile resolution mismatch for {shell_slug}/{breakpoint}.")

    if persistent_shell_package["name"] != "@vecells/persistent-shell":
        fail("Persistent shell package name drifted.")

    for app_name, shell_slug in APP_SHELL_MAP.items():
        app_package_path = ROOT / "apps" / app_name / "package.json"
        app_source_path = ROOT / "apps" / app_name / "src" / "App.tsx"
        app_package = load_json(app_package_path)
        if app_package["dependencies"].get("@vecells/persistent-shell") != "workspace:*":
            fail(f"{app_name} lost its @vecells/persistent-shell dependency.")
        assert_contains(app_source_path, 'import { PersistentShellApp } from "@vecells/persistent-shell";')
        assert_contains(app_source_path, 'import "@vecells/design-system/foundation.css";')
        assert_contains(app_source_path, 'import "@vecells/persistent-shell/persistent-shell.css";')
        assert_contains(app_source_path, f'shellSlug="{shell_slug}"')

    ts_paths = tsconfig["compilerOptions"]["paths"]
    if ts_paths.get("@vecells/persistent-shell") != ["packages/persistent-shell/src/index.tsx"]:
        fail("tsconfig.base.json lost the @vecells/persistent-shell alias.")
    if ts_paths.get("@vecells/persistent-shell/persistent-shell.css") != [
        "packages/persistent-shell/src/persistent-shell.css"
    ]:
        fail("tsconfig.base.json lost the persistent-shell stylesheet alias.")

    assert_contains(CONTRACT_SOURCE_PATH, 'export const PERSISTENT_SHELL_TASK_ID = "par_106"')
    assert_contains(CONTRACT_SOURCE_PATH, 'export const PERSISTENT_SHELL_VISUAL_MODE = "Persistent_Shell_Framework"')
    assert_contains(CONTRACT_SOURCE_PATH, "export interface ShellFamilyOwnershipContract")
    assert_contains(CONTRACT_SOURCE_PATH, "export interface ContinuityTransitionCheckpoint")
    assert_contains(CONTRACT_SOURCE_PATH, "export interface ContinuityCarryForwardPlan")
    assert_contains(CONTRACT_SOURCE_PATH, "export interface ContinuityRestorePlan")
    assert_contains(CONTRACT_SOURCE_PATH, "export function resolveShellBoundaryDecision")
    assert_contains(CONTRACT_SOURCE_PATH, "export function createPersistentShellSimulationHarness")
    assert_contains(REACT_SOURCE_PATH, 'data-shell-continuity-key={shell.ownership.continuityKey}')
    assert_contains(REACT_SOURCE_PATH, 'data-boundary-state={lastBoundaryDecision.boundaryState}')
    assert_contains(REACT_SOURCE_PATH, 'data-fold-state={missionStackFolded ? "folded" : "expanded"}')
    assert_contains(REACT_SOURCE_PATH, "persistent-shell__status-strip")
    assert_contains(REACT_SOURCE_PATH, 'renderSlot(activeRoute.decisionDock, `${shellSlug}-decision-dock`)')
    assert_contains(REACT_SOURCE_PATH, "persistent-shell__timeline")
    assert_contains(CSS_PATH, ".persistent-shell")
    assert_contains(CSS_PATH, ".persistent-shell__layout")
    assert_contains(CSS_PATH, ".persistent-shell__slot")
    assert_contains(CSS_PATH, "@media (max-width: 1023px)")
    assert_contains(PACKAGE_INDEX_PATH, 'from "./contracts";')
    assert_contains(PACKAGE_INDEX_PATH, 'from "./persistent-shell";')

    assert_contains(UNIT_TEST_PATH, "publishes every primary shell family plus the existing support extension")
    assert_contains(UNIT_TEST_PATH, "fails closed to read-only preserve when runtime posture drifts")
    assert_contains(UNIT_TEST_PATH, "keeps mission stack as a fold of the same shell")
    assert_contains(PUBLIC_API_TEST_PATH, 'expect(persistentShellCatalog.taskId).toBe("par_106")')

    assert_contains(FRAMEWORK_DOC_PATH, "Persistent Shell Framework")
    assert_contains(FRAMEWORK_DOC_PATH, "ShellFamilyOwnershipContract")
    assert_contains(FRAMEWORK_DOC_PATH, "ContinuityTransitionCheckpoint")
    assert_contains(FRAMEWORK_DOC_PATH, "MissionStackFoldPlan")
    assert_contains(OWNERSHIP_DOC_PATH, "`same_shell_object_switch`")
    assert_contains(OWNERSHIP_DOC_PATH, "support-workspace")
    assert_contains(FRAMEWORK_DOC_PATH, "GAP_RESOLUTION_HUB_SHELL")
    assert_contains(TOPOLOGY_DOC_PATH, "`mission_stack`")
    assert_contains(TOPOLOGY_DOC_PATH, "hover and focus cues: `120ms`")
    assert_contains(TOPOLOGY_DOC_PATH, "pane reveal and same-shell child morph: `180ms`")
    assert_contains(TOPOLOGY_DOC_PATH, "shell settle and fold or unfold: `240ms`")
    assert_contains(BOUNDARY_DOC_PATH, "`recover_in_place`")
    assert_contains(BOUNDARY_DOC_PATH, "Browser history is not authoritative continuity.")
    assert_contains(BOUNDARY_DOC_PATH, "persisted restore payload")

    assert_contains(GALLERY_PATH, 'data-testid="shell-gallery"')
    assert_contains(GALLERY_PATH, 'data-testid="gallery-shell-list"')
    assert_contains(GALLERY_PATH, 'data-testid="gallery-live-shell"')
    assert_contains(GALLERY_PATH, 'data-testid="gallery-runtime-scenario"')
    assert_contains(GALLERY_PATH, 'data-testid="gallery-boundary-state"')
    assert_contains(GALLERY_PATH, 'data-testid="gallery-fold-toggle"')
    assert_contains(GALLERY_PATH, 'fetch("../../data/analysis/persistent_shell_contracts.json")')
    assert_contains(GALLERY_PATH, 'fetch("../../data/analysis/shell_route_residency_map.json")')
    assert_contains(GALLERY_PATH, "Signal Atlas Live")

    if root_package["scripts"].get("validate:persistent-shell") != "python3 ./tools/analysis/validate_persistent_shell_framework.py":
        fail("Root package validate:persistent-shell script drifted.")
    for script_name in ("bootstrap", "check"):
        script_value = root_package["scripts"].get(script_name, "")
        if "pnpm validate:persistent-shell" not in script_value:
            fail(f"Root package {script_name} lost validate:persistent-shell.")
        updates_value = ROOT_SCRIPT_UPDATES.get(script_name, "")
        if "pnpm validate:persistent-shell" not in updates_value:
            fail(f"root_script_updates.py {script_name} lost validate:persistent-shell.")

    if ROOT_SCRIPT_UPDATES.get("validate:persistent-shell") != "python3 ./tools/analysis/validate_persistent_shell_framework.py":
        fail("root_script_updates.py validate:persistent-shell entry drifted.")

    for script_name in ("build", "lint", "test", "typecheck", "e2e"):
        script_value = playwright_package["scripts"].get(script_name, "")
        if "persistent-shell-framework.spec.js" not in script_value:
            fail(f"Playwright package {script_name} lost persistent-shell-framework.spec.js.")

    assert_contains(SPEC_PATH, 'export const persistentShellFrameworkCoverage = [')
    assert_contains(SPEC_PATH, "same-shell morph under adjacent route families")
    assert_contains(SPEC_PATH, "selected-anchor preservation across route changes")
    assert_contains(SPEC_PATH, "fold and route memory preservation under mission_stack")
    assert_contains(SPEC_PATH, "read-only preserve and recovery fallback under drift")
    assert_contains(SPEC_PATH, "reduced-motion equivalence")
    assert_contains(SPEC_PATH, "gallery-live-shell")
    assert_contains(SPEC_PATH, ".artifacts")

    print("par_106 persistent shell framework validation passed.")


if __name__ == "__main__":
    main()
