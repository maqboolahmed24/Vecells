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
TOOLS_DIR = ROOT / "tools" / "runtime-topology-publication"

CATALOG_PATH = DATA_DIR / "runtime_topology_drift_catalog.json"
MATRIX_PATH = DATA_DIR / "runtime_topology_publication_matrix.csv"
GATEWAY_MATRIX_PATH = DATA_DIR / "gateway_surface_publication_matrix.json"
CATALOG_TS_PATH = ROOT / "packages" / "release-controls" / "src" / "runtime-topology-publication.catalog.ts"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "runtime-topology-publication.ts"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
UNIT_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "runtime-topology-publication.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
DESIGN_DOC_PATH = DOCS_DIR / "99_runtime_topology_publication_validation.md"
RULES_DOC_PATH = DOCS_DIR / "99_gateway_surface_and_trust_boundary_check_matrix.md"
HTML_PATH = DOCS_DIR / "99_runtime_topology_publication_atlas.html"
SPEC_PATH = PLAYWRIGHT_DIR / "runtime-topology-publication-atlas.spec.js"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-runtime-topology-publication-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-runtime-topology-publication.ts"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_099 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        CATALOG_PATH,
        MATRIX_PATH,
        GATEWAY_MATRIX_PATH,
        CATALOG_TS_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        UNIT_TEST_PATH,
        PUBLIC_API_TEST_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
        WORKFLOW_CI_PATH,
        WORKFLOW_PROMOTION_PATH,
    ]:
        assert_exists(path)

    catalog = load_json(CATALOG_PATH)
    matrix_rows = load_csv(MATRIX_PATH)
    gateway_matrix = load_json(GATEWAY_MATRIX_PATH)

    if catalog["task_id"] != "par_099":
        fail("Runtime topology drift catalog drifted off par_099.")
    if catalog["visual_mode"] != "Runtime_Topology_Publication_Atlas":
        fail("Runtime topology atlas visual mode drifted.")
    if catalog["summary"]["scenario_count"] != len(catalog["publicationScenarios"]):
        fail("scenario_count drifted from publicationScenarios.")
    if len(catalog["publicationScenarios"]) != len(matrix_rows):
        fail("Matrix rows drifted from publicationScenarios.")
    if catalog["summary"]["drift_category_count"] != len(catalog["driftCategoryDefinitions"]):
        fail("drift_category_count drifted from driftCategoryDefinitions.")
    if catalog["summary"]["publishable_scenario_count"] < 1:
        fail("par_099 must publish at least one clean scenario.")
    if catalog["currentGraphSnapshot"]["verdict"]["publishable"]:
        fail("Current runtime topology snapshot unexpectedly became publishable.")
    if "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING" not in catalog["currentGraphSnapshot"]["verdict"][
        "blockedReasonRefs"
    ]:
        fail("Current runtime topology snapshot lost stale binding blockage.")
    if "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE" not in catalog["currentGraphSnapshot"]["verdict"][
        "blockedReasonRefs"
    ]:
        fail("Current runtime topology snapshot lost design tuple blockage.")

    scenario_ids = {row["scenarioId"] for row in catalog["publicationScenarios"]}
    required_scenarios = {
        "LOCAL_AUTHORITATIVE_ALIGNMENT",
        "CI_PREVIEW_AUTHORITATIVE_ALIGNMENT",
        "INTEGRATION_AUTHORITATIVE_ALIGNMENT",
        "PREPROD_AUTHORITATIVE_ALIGNMENT",
        "PRODUCTION_AUTHORITATIVE_ALIGNMENT",
        "LOCAL_MISSING_MANIFEST_BINDING",
        "CI_PREVIEW_GATEWAY_UNDECLARED_WORKLOAD",
        "INTEGRATION_UNDECLARED_TRUST_BOUNDARY",
        "PREPROD_TENANT_ISOLATION_MISMATCH",
        "PREPROD_STALE_AUDIENCE_RUNTIME_BINDING",
        "PRODUCTION_DESIGN_BUNDLE_WRONG_TOPOLOGY",
        "PRODUCTION_WITHDRAWN_ROUTE_PUBLICATION",
    }
    if scenario_ids != required_scenarios:
        fail(f"Scenario coverage drifted: {scenario_ids ^ required_scenarios}")

    category_codes = {row["categoryCode"] for row in catalog["driftCategoryDefinitions"]}
    required_categories = {
        "MISSING_MANIFEST_BINDING",
        "GATEWAY_TO_UNDECLARED_WORKLOAD",
        "UNDECLARED_TRUST_BOUNDARY_CROSSING",
        "TENANT_ISOLATION_MISMATCH",
        "STALE_AUDIENCE_SURFACE_RUNTIME_BINDING",
        "DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE",
        "ROUTE_PUBLICATION_WITHDRAWN",
    }
    if category_codes != required_categories:
        fail(f"Drift category coverage drifted: {category_codes ^ required_categories}")

    if gateway_matrix["summary"]["gateway_surface_count"] != catalog["currentGraphSnapshot"][
        "gatewaySurfaceCount"
    ]:
        fail("Gateway surface matrix drifted from current graph snapshot.")
    if not gateway_matrix["gatewaySurfacePublicationRows"]:
        fail("Gateway surface publication matrix is empty.")
    if "requiredAssuranceSliceRefs" not in gateway_matrix["gatewaySurfacePublicationRows"][0]:
        fail("Gateway surface publication matrix lost requiredAssuranceSliceRefs.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:runtime-topology-publication",
        "ci:rehearse-runtime-topology-publication",
        "ci:verify-runtime-topology-publication",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_runtime_topology_publication.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_099 builder.")
    if "validate:runtime-topology-publication" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:runtime-topology-publication.")
    if "validate:runtime-topology-publication" not in scripts["check"]:
        fail("Root check script is missing validate:runtime-topology-publication.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "runtime-topology-publication-atlas.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_099 spec.")

    for token in [
        "validate:runtime-topology-publication",
        "ci:rehearse-runtime-topology-publication",
        "ci:verify-runtime-topology-publication",
        "build_runtime_topology_publication.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(PARALLEL_GATE_PATH, "runtime-topology-publication-atlas.spec.js")
    assert_contains(INDEX_PATH, 'export * from "./runtime-topology-publication";')
    for token in [
        "evaluateRuntimeTopologyPublicationGraph",
        "createRuntimeTopologyPublicationSimulationHarness",
        "runRuntimeTopologyPublicationSimulation",
        "createRuntimeTopologyPublicationVerdictDigest",
    ]:
        assert_contains(SOURCE_PATH, token)
    for token in [
        "fails closed when a trust boundary no longer permits the downstream service identity",
        "fails closed when a gateway requires an assurance slice that is absent from topology",
        "selects a clean ci-preview tuple when requested by environment",
    ]:
        assert_contains(UNIT_TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the runtime topology publication simulation harness")

    combined_docs = (
        DESIGN_DOC_PATH.read_text(encoding="utf-8")
        + RULES_DOC_PATH.read_text(encoding="utf-8")
    )
    for marker in [
        "# 99 Runtime Topology Publication Validation",
        "# 99 Gateway Surface And Trust Boundary Check Matrix",
        "GAP_RESOLUTION_TOPOLOGY_ARTIFACT_RUNTIME_PUBLICATION_MATRIX_V1",
        "FOLLOW_ON_DEPENDENCY_PARITY_SURFACE_GOVERNANCE_COCKPIT_V1",
        "UNDECLARED_TRUST_BOUNDARY_CROSSING",
        "TENANT_ISOLATION_MISMATCH",
    ]:
        if marker not in combined_docs:
            fail(f"Docs lost required marker: {marker}")

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-runtime-topology-publication")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-runtime-topology-publication")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-runtime-topology-publication")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-runtime-topology-publication")


if __name__ == "__main__":
    main()
