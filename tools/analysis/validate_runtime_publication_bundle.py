#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "runtime-publication"

BUNDLE_CATALOG_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_CATALOG_PATH = DATA_DIR / "release_publication_parity_records.json"
BUNDLE_SCHEMA_PATH = DATA_DIR / "runtime_publication_bundle_schema.json"
PARITY_SCHEMA_PATH = DATA_DIR / "release_publication_parity_schema.json"
DEPENDENCY_MATRIX_PATH = DATA_DIR / "publication_tuple_dependency_matrix.csv"
BUNDLE_DOC_PATH = DOCS_DIR / "94_runtime_publication_bundle_design.md"
PARITY_DOC_PATH = DOCS_DIR / "94_release_publication_parity_rules.md"
CONSOLE_PATH = DOCS_DIR / "94_runtime_publication_bundle_console.html"
SPEC_PATH = TESTS_DIR / "runtime-publication-bundle-console.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-runtime-publication-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-runtime-publication.ts"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_094 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        BUNDLE_CATALOG_PATH,
        PARITY_CATALOG_PATH,
        BUNDLE_SCHEMA_PATH,
        PARITY_SCHEMA_PATH,
        DEPENDENCY_MATRIX_PATH,
        BUNDLE_DOC_PATH,
        PARITY_DOC_PATH,
        CONSOLE_PATH,
        SPEC_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
    ]:
        assert_exists(path)

    bundle_catalog = load_json(BUNDLE_CATALOG_PATH)
    parity_catalog = load_json(PARITY_CATALOG_PATH)
    if bundle_catalog["task_id"] != "par_094":
        fail("Runtime publication bundle catalog drifted off par_094.")
    if parity_catalog["task_id"] != "par_094":
        fail("Release publication parity catalog drifted off par_094.")
    if len(bundle_catalog["runtimePublicationBundles"]) != 5:
        fail("Expected exactly 5 runtime publication bundles.")
    if len(parity_catalog["releasePublicationParityRecords"]) != 5:
        fail("Expected exactly 5 release publication parity records.")
    if len(parity_catalog["surfaceAuthorityRows"]) != 45:
        fail("Expected exactly 45 surface authority rows.")
    if bundle_catalog["summary"]["published_bundle_count"] < 1:
        fail("Expected at least one published runtime publication bundle.")
    if parity_catalog["summary"]["exact_parity_count"] < 1:
        fail("Expected at least one exact release publication parity record.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:runtime-publication",
        "ci:rehearse-runtime-publication",
        "ci:verify-runtime-publication",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_runtime_publication_bundle.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_094 builder.")
    if "validate:runtime-publication" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:runtime-publication.")
    if "validate:runtime-publication" not in scripts["check"]:
        fail("Root check script is missing validate:runtime-publication.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name, token in {
        "build": "runtime-publication-bundle-console.spec.js",
        "lint": "runtime-publication-bundle-console.spec.js",
        "test": "runtime-publication-bundle-console.spec.js",
        "typecheck": "runtime-publication-bundle-console.spec.js",
        "e2e": "runtime-publication-bundle-console.spec.js",
    }.items():
        if token not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_094 console spec.")

    assert_contains(INDEX_PATH, 'export * from "./runtime-publication";')
    assert_contains(PUBLIC_API_TEST_PATH, "createRuntimePublicationSimulationHarness")
    assert_contains(PUBLIC_API_TEST_PATH, "runs the runtime publication simulation harness")
    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-runtime-publication")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-runtime-publication")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-runtime-publication")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-runtime-publication")


if __name__ == "__main__":
    main()
