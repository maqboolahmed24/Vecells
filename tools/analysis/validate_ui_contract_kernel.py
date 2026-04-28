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

PUBLICATION_ARTIFACT_PATH = DATA_DIR / "design_contract_publication_bundle.json"
LINT_ARTIFACT_PATH = DATA_DIR / "design_contract_lint_verdicts.json"
BINDING_CSV_PATH = DATA_DIR / "surface_state_kernel_bindings.csv"
AUTOMATION_ARTIFACT_PATH = DATA_DIR / "automation_anchor_maps.json"
ACCESSIBILITY_ARTIFACT_PATH = DATA_DIR / "accessibility_semantic_coverage_profiles.json"

PUBLICATION_DOC_PATH = DOCS_DIR / "104_canonical_ui_contract_kernel_publication.md"
BINDING_DOC_PATH = DOCS_DIR / "104_surface_state_kernel_binding_strategy.md"
BUNDLE_DOC_PATH = DOCS_DIR / "104_design_contract_publication_bundle_strategy.md"
STUDIO_HTML_PATH = DOCS_DIR / "104_ui_kernel_studio.html"

BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_ui_contract_kernel.ts"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_ui_contract_kernel.py"
SCHEMA_PATH = PACKAGE_DIR / "contracts" / "ui-contract-kernel.schema.json"
SOURCE_PATH = PACKAGE_DIR / "src" / "ui-contract-kernel.ts"
GENERATED_SOURCE_PATH = PACKAGE_DIR / "src" / "ui-contract-kernel.generated.ts"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
KERNEL_TEST_PATH = PACKAGE_DIR / "tests" / "ui-contract-kernel.test.ts"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "ui-kernel-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_104 artifact: {path}")


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
        PUBLICATION_ARTIFACT_PATH,
        LINT_ARTIFACT_PATH,
        BINDING_CSV_PATH,
        AUTOMATION_ARTIFACT_PATH,
        ACCESSIBILITY_ARTIFACT_PATH,
        PUBLICATION_DOC_PATH,
        BINDING_DOC_PATH,
        BUNDLE_DOC_PATH,
        STUDIO_HTML_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        SCHEMA_PATH,
        SOURCE_PATH,
        GENERATED_SOURCE_PATH,
        INDEX_PATH,
        PACKAGE_JSON_PATH,
        PUBLIC_API_TEST_PATH,
        KERNEL_TEST_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    publication = load_json(PUBLICATION_ARTIFACT_PATH)
    lint = load_json(LINT_ARTIFACT_PATH)
    automation = load_json(AUTOMATION_ARTIFACT_PATH)
    accessibility = load_json(ACCESSIBILITY_ARTIFACT_PATH)
    schema = load_json(SCHEMA_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    design_system_package = load_json(PACKAGE_JSON_PATH)
    binding_rows = load_csv(BINDING_CSV_PATH)

    if publication["task_id"] != "par_104":
        fail("UI contract kernel publication drifted off par_104.")
    if publication["visual_mode"] != "Kernel_Atlas":
        fail("Kernel Atlas visual mode drifted.")
    summary = publication["summary"]
    expected_summary = {
        "bundle_count": 9,
        "route_family_count": 19,
        "exact_binding_count": 14,
        "stale_binding_count": 1,
        "blocked_binding_count": 4,
        "accessibility_complete_count": 15,
        "accessibility_degraded_count": 4,
        "lint_pass_count": 5,
        "lint_blocked_count": 4,
    }
    if summary != expected_summary:
        fail(f"Publication summary drifted: {summary}")
    if len(publication["designContractPublicationBundles"]) != 9:
        fail("par_104 must publish 9 design-contract bundles.")
    if len(publication["surfaceStateKernelBindings"]) != 19:
        fail("par_104 must publish 19 kernel bindings.")
    if len(publication["automationAnchorMaps"]) != 19:
        fail("par_104 must publish 19 automation anchor maps.")
    if len(publication["accessibilitySemanticCoverageProfiles"]) != 19:
        fail("par_104 must publish 19 accessibility coverage profiles.")
    if len(publication["gap_resolutions"]) < 2:
        fail("par_104 must publish kernel execution gap resolutions.")
    if len(publication["kernel_coverage_gaps"]) != 4:
        fail("par_104 must publish 4 coverage-gap records.")
    if len(publication["follow_on_dependencies"]) != 1:
        fail("par_104 must publish 1 artifact-mode follow-on dependency.")

    if lint["summary"] != {"lint_verdict_count": 9, "pass_count": 5, "blocked_count": 4}:
        fail("Lint verdict summary drifted.")
    if len(lint["designContractLintVerdicts"]) != 9:
        fail("Lint verdict count drifted.")

    exact_count = sum(1 for row in binding_rows if row["binding_state"] == "exact")
    stale_count = sum(1 for row in binding_rows if row["binding_state"] == "stale")
    blocked_count = sum(1 for row in binding_rows if row["binding_state"] == "blocked")
    if (exact_count, stale_count, blocked_count) != (14, 1, 4):
        fail("Binding CSV state distribution drifted.")

    if automation["summary"]["automation_anchor_map_count"] != 19:
        fail("Automation map count drifted.")
    if accessibility["summary"] != {
        "accessibility_profile_count": 19,
        "complete_count": 15,
        "degraded_count": 4,
        "blocked_count": 0,
    }:
        fail("Accessibility coverage summary drifted.")

    if schema["title"] != "UI Contract Kernel Publication Artifact":
        fail("UI contract kernel schema title drifted.")
    required_props = set(schema["required"])
    if {
        "designContractPublicationBundles",
        "surfaceStateSemanticsProfiles",
        "surfaceStateKernelBindings",
        "automationAnchorMaps",
        "accessibilitySemanticCoverageProfiles",
    } - required_props:
        fail("UI contract kernel schema lost required top-level properties.")

    if ROOT_SCRIPT_UPDATES["validate:ui-contract-kernel"] != "python3 ./tools/analysis/validate_ui_contract_kernel.py":
        fail("Root script updates lost validate:ui-contract-kernel.")
    if "build_ui_contract_kernel.ts" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Codegen script updates lost build_ui_contract_kernel.ts.")

    if root_package["scripts"].get("validate:ui-contract-kernel") != "python3 ./tools/analysis/validate_ui_contract_kernel.py":
        fail("Root package lost validate:ui-contract-kernel.")
    if "build_ui_contract_kernel.ts" not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost build_ui_contract_kernel.ts.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "ui-kernel-studio.spec.js" not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package lost ui-kernel-studio.spec.js from {script_name}.")

    if "./contracts/ui-contract-kernel.schema.json" not in design_system_package["exports"]:
        fail("Design-system package exports lost the UI contract kernel schema.")

    assert_contains(SOURCE_PATH, 'export const UI_CONTRACT_KERNEL_TASK_ID = "par_104"')
    assert_contains(SOURCE_PATH, "export function resolveStatePrecedence(")
    assert_contains(SOURCE_PATH, "export function buildUiContractKernelArtifacts(")
    assert_contains(GENERATED_SOURCE_PATH, "export const uiContractKernelCatalog = {")
    assert_contains(GENERATED_SOURCE_PATH, "exactBindingCount:")
    assert_contains(INDEX_PATH, 'from "./ui-contract-kernel";')
    assert_contains(INDEX_PATH, 'from "./ui-contract-kernel.generated";')
    assert_contains(PUBLIC_API_TEST_PATH, 'uiContractKernelCatalog')
    assert_contains(KERNEL_TEST_PATH, 'resolveStatePrecedence')
    assert_contains(PUBLICATION_DOC_PATH, "DesignContractPublicationBundle")
    assert_contains(BINDING_DOC_PATH, "bindingState = exact | stale | blocked")
    assert_contains(BUNDLE_DOC_PATH, "Bundle ids and route refs stay compatible with the existing seq_052 publication plane.")
    assert_contains(STUDIO_HTML_PATH, 'data-testid="kernel-masthead"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="precedence-visualizer"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="automation-panel"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="reduced-motion-equivalence"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "uiKernelStudioCoverage")

    print("par_104 UI contract kernel validation passed")


if __name__ == "__main__":
    main()
