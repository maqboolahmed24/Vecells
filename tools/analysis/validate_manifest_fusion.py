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

ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
CATALOG_PATH = DATA_DIR / "surface_authority_tuple_catalog.json"
MATRIX_PATH = DATA_DIR / "foundation_manifest_integration_matrix.csv"
EDGES_PATH = DATA_DIR / "route_to_shell_runtime_manifest_edges.csv"
VERDICTS_PATH = DATA_DIR / "manifest_fusion_verdicts.json"
BLOCKED_OR_PARTIAL_PATH = DATA_DIR / "blocked_or_partial_surface_rows.csv"

FOUNDATION_DOC_PATH = DOCS_DIR / "127_foundation_manifest_integration.md"
TUPLE_DOC_PATH = DOCS_DIR / "127_surface_authority_tuple_contract.md"
DRIFT_DOC_PATH = DOCS_DIR / "127_manifest_drift_and_recovery_rules.md"
BINDING_MAP_DOC_PATH = DOCS_DIR / "127_domain_to_route_to_shell_binding_map.md"
STUDIO_PATH = DOCS_DIR / "127_manifest_fusion_studio.html"
SPEC_PATH = TESTS_DIR / "manifest-fusion-studio.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required seq_127 artifact: {path}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path):
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
        EDGES_PATH,
        VERDICTS_PATH,
        BLOCKED_OR_PARTIAL_PATH,
        FOUNDATION_DOC_PATH,
        TUPLE_DOC_PATH,
        DRIFT_DOC_PATH,
        BINDING_MAP_DOC_PATH,
        STUDIO_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    catalog = load_json(CATALOG_PATH)
    verdicts = load_json(VERDICTS_PATH)
    matrix_rows = load_csv(MATRIX_PATH)
    blocked_or_partial_rows = load_csv(BLOCKED_OR_PARTIAL_PATH)
    inventory_rows = load_csv(AUDIENCE_SURFACE_PATH)
    route_rows = load_csv(ROUTE_FAMILY_PATH)

    if catalog["task_id"] != "seq_127":
        fail("Manifest fusion catalog drifted off seq_127.")
    if verdicts["task_id"] != "seq_127":
        fail("Manifest fusion verdict catalog drifted off seq_127.")

    tuples = catalog["surfaceAuthorityTuples"]
    if len(tuples) != 23:
        fail("Expected exactly 23 manifest fusion tuples.")
    if len(matrix_rows) != len(tuples):
        fail("Foundation integration matrix row count drifted.")

    inventoried_surfaces = {row["surface_id"] for row in inventory_rows}
    covered_surfaces = {row["inventorySurfaceRef"] for row in tuples if row["inventorySurfaceRef"]}
    if covered_surfaces != inventoried_surfaces:
        fail("Inventoried surfaces are missing from the fusion catalog.")

    inventoried_route_families = {row["route_family_id"] for row in route_rows}
    covered_route_families = {row["routeFamilyRef"] for row in tuples}
    if covered_route_families != inventoried_route_families:
        fail("Inventoried route families are missing from the fusion catalog.")

    route_gap = [row for row in tuples if row["routeFamilyRef"] == "rf_assistive_control_shell"]
    if len(route_gap) != 1 or route_gap[0]["bindingVerdict"] != "blocked":
        fail("Expected one blocked standalone assistive route-family gap row.")

    for row in tuples:
        if row["bindingVerdict"] == "exact":
            required_fields = [
                "audienceSurface",
                "shellType",
                "routeFamilyRef",
                "governingBoundedContextRef",
                "canonicalObjectDescriptorRef",
                "surfaceRouteContractRef",
                "frontendContractManifestRef",
                "designContractPublicationBundleRef",
                "runtimePublicationBundleRef",
                "releasePublicationParityRef",
                "audienceSurfaceRuntimeBindingRef",
                "projectionContractVersionSetRef",
            ]
            for field in required_fields:
                if not row.get(field):
                    fail(f"Exact tuple {row['tupleId']} is missing required field {field}.")
            if not row.get("mutationCommandContractDigestRefs"):
                fail(f"Exact tuple {row['tupleId']} is missing mutation digests.")
            if not row.get("visibilityCoverageRefs"):
                fail(f"Exact tuple {row['tupleId']} is missing visibility coverage refs.")

        if row["routeFamilyRef"] and not row.get("governingBoundedContextRef"):
            fail(f"Tuple {row['tupleId']} is missing a governing bounded context.")
        if row["routeFamilyRef"] and not row.get("canonicalObjectDescriptorRef"):
            fail(f"Tuple {row['tupleId']} is missing a canonical object descriptor.")
        if row["bindingVerdict"] in {"blocked", "drifted"}:
            if row.get("writabilityState") == "writable":
                fail(f"Blocked or drifted tuple {row['tupleId']} is still writable.")
            if row.get("calmState") == "calm":
                fail(f"Blocked or drifted tuple {row['tupleId']} is still marked calm.")

    blocked_rows = [row for row in tuples if row["bindingVerdict"] == "blocked"]
    if not blocked_rows:
        fail("Expected at least one blocked tuple.")
    if verdicts["verdictCounts"].get("drifted", 0) != 0:
        for row in tuples:
            if row["bindingVerdict"] == "drifted" and "MFV_127_DIGEST_ALIGNMENT_DRIFT" not in row["reasonRefs"]:
                fail(f"Drifted tuple {row['tupleId']} is missing a digest drift reason.")

    if len(blocked_or_partial_rows) != verdicts["verdictCounts"].get("blocked", 0) + verdicts["verdictCounts"].get("partial", 0):
        fail("Blocked-or-partial row count drifted.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    if scripts.get("validate:manifest-fusion") != ROOT_SCRIPT_UPDATES["validate:manifest-fusion"]:
        fail("Root script drifted for validate:manifest-fusion.")
    if "build_manifest_fusion.py" not in scripts["codegen"]:
        fail("Root codegen script is missing the manifest fusion builder.")
    if "validate:manifest-fusion" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:manifest-fusion.")
    if "validate:manifest-fusion" not in scripts["check"]:
        fail("Root check script is missing validate:manifest-fusion.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "manifest-fusion-studio.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing seq_127 coverage.")

    assert_contains(STUDIO_PATH, "Foundation Manifest Fusion Studio")
    assert_contains(STUDIO_PATH, "data-testid=\"triple-braid\"")
    assert_contains(SPEC_PATH, "manifestFusionStudioCoverage")
    assert_contains(SPEC_PATH, "selection sync across tuple cards, braid rows, heatmap rows, and inspector")


if __name__ == "__main__":
    main()
