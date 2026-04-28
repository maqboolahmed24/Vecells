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
PACKAGE_DIR = ROOT / "packages" / "design-system"

PUBLICATION_PATH = DATA_DIR / "component_primitive_publication.json"
BINDING_CSV_PATH = DATA_DIR / "component_binding_matrix.csv"
AUTOMATION_PATH = DATA_DIR / "component_automation_anchor_matrix.json"
ACCESSIBILITY_CSV_PATH = DATA_DIR / "component_accessibility_coverage_matrix.csv"

DOC_BINDINGS_PATH = DOCS_DIR / "105_shared_component_primitives_and_token_bindings.md"
DOC_API_PATH = DOCS_DIR / "105_component_api_and_surface_role_contracts.md"
ATLAS_PATH = DOCS_DIR / "105_component_atlas.html"

BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_component_primitives.ts"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_component_bindings.py"
SOURCE_PATH = PACKAGE_DIR / "src" / "component-primitives.tsx"
GENERATED_SOURCE_PATH = PACKAGE_DIR / "src" / "component-primitives.generated.ts"
CSS_PATH = PACKAGE_DIR / "src" / "component-primitives.css"
SCHEMA_PATH = PACKAGE_DIR / "contracts" / "component-primitives.schema.json"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
COMPONENT_TEST_PATH = PACKAGE_DIR / "tests" / "component-primitives.test.ts"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "component-atlas.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_105 artifact: {path}")


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
        PUBLICATION_PATH,
        BINDING_CSV_PATH,
        AUTOMATION_PATH,
        ACCESSIBILITY_CSV_PATH,
        DOC_BINDINGS_PATH,
        DOC_API_PATH,
        ATLAS_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        SOURCE_PATH,
        GENERATED_SOURCE_PATH,
        CSS_PATH,
        SCHEMA_PATH,
        INDEX_PATH,
        PACKAGE_JSON_PATH,
        PUBLIC_API_TEST_PATH,
        COMPONENT_TEST_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    publication = load_json(PUBLICATION_PATH)
    automation = load_json(AUTOMATION_PATH)
    schema = load_json(SCHEMA_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    design_system_package = load_json(PACKAGE_JSON_PATH)
    binding_rows = load_csv_rows(BINDING_CSV_PATH)
    accessibility_rows = load_csv_rows(ACCESSIBILITY_CSV_PATH)

    if publication["task_id"] != "par_105":
        fail("Component primitive publication drifted off par_105.")
    if publication["visual_mode"] != "Component_Atlas":
        fail("Component atlas visual mode drifted.")
    if publication["summary"] != {
        "component_count": 38,
        "specimen_count": 4,
        "surface_role_count": 14,
        "shell_profile_count": 8,
        "route_binding_count": 4,
        "exact_route_binding_count": 2,
        "blocked_route_binding_count": 2,
        "degraded_accessibility_route_count": 2,
        "gap_resolution_count": 3,
        "follow_on_dependency_count": 3,
    }:
        fail(f"Publication summary drifted: {publication['summary']}")
    if len(publication["componentContracts"]) != 38:
        fail("par_105 must publish 38 component contracts.")
    if len(publication["specimenCompositions"]) != 4:
        fail("par_105 must publish 4 specimen compositions.")
    if len(publication["shellProfileLenses"]) != 8:
        fail("par_105 must publish 8 shell profile lenses.")
    if len(publication["gap_resolutions"]) != 3:
        fail("par_105 must publish 3 component API gap resolutions.")
    if len(publication["follow_on_dependencies"]) != 3:
        fail("par_105 must publish 3 follow-on dependency records.")

    if len(binding_rows) != 38:
        fail("par_105 binding matrix row count drifted.")
    if len(accessibility_rows) != 38:
        fail("par_105 accessibility matrix row count drifted.")

    if automation["summary"] != {
        "component_count": 38,
        "route_family_count": 9,
        "dominant_action_marker_count": 9,
        "selected_anchor_marker_count": 9,
    }:
        fail("Automation matrix summary drifted.")
    if len(automation["componentAutomationAnchors"]) != 38:
        fail("Automation matrix row count drifted.")

    if schema["title"] != "Component Primitive Publication Artifact":
        fail("Component primitive schema title drifted.")
    required_props = set(schema["required"])
    if {
        "componentContracts",
        "specimenCompositions",
        "shellProfileLenses",
        "gap_resolutions",
        "follow_on_dependencies",
    } - required_props:
        fail("Component primitive schema lost required top-level properties.")

    if ROOT_SCRIPT_UPDATES["validate:component-bindings"] != "python3 ./tools/analysis/validate_component_bindings.py":
        fail("Root script updates lost validate:component-bindings.")
    if "build_component_primitives.ts" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Codegen script updates lost build_component_primitives.ts.")

    if root_package["scripts"].get("validate:component-bindings") != "python3 ./tools/analysis/validate_component_bindings.py":
        fail("Root package lost validate:component-bindings.")
    if "build_component_primitives.ts" not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost build_component_primitives.ts.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "component-atlas.spec.js" not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package lost component-atlas.spec.js from {script_name}.")

    exports = design_system_package["exports"]
    if "./component-primitives.css" not in exports:
        fail("Design-system package exports lost component-primitives.css.")
    if "./contracts/component-primitives.schema.json" not in exports:
        fail("Design-system package exports lost the component-primitives schema.")

    assert_contains(SOURCE_PATH, 'export const COMPONENT_PRIMITIVES_TASK_ID = "par_105"')
    assert_contains(SOURCE_PATH, "export function resolvePrimitiveRouteBinding(")
    assert_contains(SOURCE_PATH, "export function buildComponentPrimitiveArtifacts()")
    assert_contains(GENERATED_SOURCE_PATH, "export const componentPrimitiveCatalog =")
    assert_contains(GENERATED_SOURCE_PATH, '"componentCount": 38')
    assert_contains(INDEX_PATH, 'from "./component-primitives";')
    assert_contains(INDEX_PATH, 'from "./component-primitives.generated";')
    assert_contains(PUBLIC_API_TEST_PATH, "componentPrimitiveCatalog")
    assert_contains(COMPONENT_TEST_PATH, 'renderSpecimenComposition("Operations_Control_Room_Preview")')
    assert_contains(DOC_BINDINGS_PATH, "Shared Component Primitives And Token Bindings")
    assert_contains(DOC_BINDINGS_PATH, "GAP_RESOLUTION_COMPONENT_API_SURFACE_ROLE_FRAMING_V1")
    assert_contains(DOC_API_PATH, "Component API And Surface Role Contracts")
    assert_contains(ATLAS_PATH, 'data-testid="atlas-shell"')
    assert_contains(ATLAS_PATH, 'data-testid="shell-lens-rail"')
    assert_contains(ATLAS_PATH, 'data-testid="surface-role-nav"')
    assert_contains(ATLAS_PATH, 'data-testid="specimen-stage"')
    assert_contains(ATLAS_PATH, 'data-testid="inspector-panel"')
    assert_contains(ATLAS_PATH, 'data-testid="motion-strip"')
    assert_contains(ATLAS_PATH, 'data-testid="taxonomy-diagram"')
    assert_contains(ATLAS_PATH, 'data-testid="density-diagram"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "componentAtlasCoverage")

    print("par_105 component primitive validation passed")


if __name__ == "__main__":
    main()
