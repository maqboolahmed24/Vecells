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

BINDING_CATALOG_PATH = DATA_DIR / "audience_surface_runtime_bindings.json"
PUBLICATION_PARITY_MATRIX_PATH = DATA_DIR / "publication_parity_matrix.csv"
SURFACE_AUTHORITY_VERDICTS_PATH = DATA_DIR / "surface_authority_verdicts.json"
ROUTE_RECOVERY_DISPOSITION_MATRIX_PATH = DATA_DIR / "route_recovery_disposition_matrix.csv"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
SHELL_CONTRACTS_PATH = DATA_DIR / "persistent_shell_contracts.json"

BINDINGS_DOC_PATH = DOCS_DIR / "130_audience_surface_runtime_bindings_final.md"
PARITY_DOC_PATH = DOCS_DIR / "130_publication_parity_finalization.md"
VERDICT_DOC_PATH = DOCS_DIR / "130_surface_authority_verdict_matrix.md"
RECOVERY_DOC_PATH = DOCS_DIR / "130_runtime_binding_gap_and_recovery_rules.md"
BOARD_PATH = DOCS_DIR / "130_audience_surface_parity_board.html"
SPEC_PATH = TESTS_DIR / "audience-surface-parity-board.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required seq_130 artifact: {path}")


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


def gather_shell_route_refs(shell_contracts: dict) -> set[str]:
    refs: set[str] = set()
    for shell in shell_contracts.get("shells", []):
        refs.update(shell.get("routeFamilyRefs", []))
        refs.update(
            claim.get("routeFamilyRef")
            for claim in shell.get("routeClaims", [])
            if claim.get("routeFamilyRef")
        )
    return refs


def main() -> None:
    for path in [
        BINDING_CATALOG_PATH,
        PUBLICATION_PARITY_MATRIX_PATH,
        SURFACE_AUTHORITY_VERDICTS_PATH,
        ROUTE_RECOVERY_DISPOSITION_MATRIX_PATH,
        BINDINGS_DOC_PATH,
        PARITY_DOC_PATH,
        VERDICT_DOC_PATH,
        RECOVERY_DOC_PATH,
        BOARD_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    catalog = load_json(BINDING_CATALOG_PATH)
    verdicts = load_json(SURFACE_AUTHORITY_VERDICTS_PATH)
    publication_matrix = load_csv(PUBLICATION_PARITY_MATRIX_PATH)
    recovery_matrix = load_csv(ROUTE_RECOVERY_DISPOSITION_MATRIX_PATH)
    route_inventory = load_csv(ROUTE_FAMILY_PATH)
    audience_inventory = load_csv(AUDIENCE_SURFACE_PATH)
    shell_contracts = load_json(SHELL_CONTRACTS_PATH)

    if catalog["task_id"] != "seq_130":
        fail("Audience-surface binding catalog drifted off seq_130.")
    if catalog["visual_mode"] != "Audience_Surface_Parity_Board":
        fail("Audience-surface binding catalog lost the required visual mode.")
    if verdicts["task_id"] != "seq_130":
        fail("Surface authority verdict catalog drifted off seq_130.")

    rows = catalog["surfaceAuthorityRows"]
    if len(rows) != 23:
        fail("Expected exactly 23 audience-surface runtime binding rows.")
    if len(publication_matrix) != len(rows):
        fail("Publication parity matrix row count drifted.")

    route_inventory_refs = {row["route_family_id"] for row in route_inventory}
    route_refs_in_catalog = {row["routeFamilyRef"] for row in rows}
    if route_refs_in_catalog != route_inventory_refs:
        fail("Route-family coverage drifted in the final binding catalog.")

    audience_inventory_refs = {row["surface_id"] for row in audience_inventory}
    surface_refs_in_catalog = {
        row["inventorySurfaceRef"] for row in rows if row["inventorySurfaceRef"]
    }
    if surface_refs_in_catalog != audience_inventory_refs:
        fail("Audience-surface coverage drifted in the final binding catalog.")

    shell_route_refs = gather_shell_route_refs(shell_contracts)
    if not shell_route_refs.issubset(route_refs_in_catalog):
        fail("A shell-claimed route family is absent from the final binding catalog.")

    binding_counts: dict[str, int] = {}
    for row in rows:
        for field in [
            "surfaceAuthorityVerdictId",
            "audienceSurfaceRuntimeBindingId",
            "audienceSurface",
            "routeFamilyRef",
            "shellType",
            "bindingState",
            "calmTruthState",
            "writableTruthState",
            "recoveryDispositionRefs",
            "reasonRefs",
            "notes",
        ]:
            if field not in row:
                fail(f"Row {row.get('surfaceAuthorityVerdictId')} is missing required field {field}.")

        binding_counts[row["bindingState"]] = binding_counts.get(row["bindingState"], 0) + 1

        if row["bindingState"] == "publishable_live":
            if row["parityState"] != "exact":
                fail(f"Live row {row['surfaceAuthorityVerdictId']} lacks exact parity.")
            if row["calmTruthState"] != "allowed":
                fail(f"Live row {row['surfaceAuthorityVerdictId']} is not calmly trustworthy.")
            if row["browserPostureState"] != "publishable_live":
                fail(f"Live row {row['surfaceAuthorityVerdictId']} lacks publishable browser posture.")
            if row["designContractLintVerdictRef"] in {None, "", "pending"} or "pending" in str(
                row["designContractLintVerdictRef"]
            ):
                fail(f"Live row {row['surfaceAuthorityVerdictId']} still carries pending design lint.")
            if row["accessibilityCoverageState"] != "complete":
                fail(f"Live row {row['surfaceAuthorityVerdictId']} lacks complete accessibility coverage.")
            if row["writableTruthState"] == "allowed" and row["publicationState"] != "published":
                fail(f"Writable row {row['surfaceAuthorityVerdictId']} lacks published runtime truth.")

        if row["writableTruthState"] == "allowed" and row["parityState"] != "exact":
            fail(f"Writable row {row['surfaceAuthorityVerdictId']} lacks exact parity.")

        if row["bindingState"] in {"recovery_only", "blocked", "drifted"} and not row["recoveryDispositionRefs"]:
            fail(
                f"Non-live row {row['surfaceAuthorityVerdictId']} lacks a declared recovery or freeze disposition."
            )

        if row["bindingState"] == "partial" and row["writableTruthState"] == "allowed":
            fail(f"Partial row {row['surfaceAuthorityVerdictId']} appears more authoritative than the tuple allows.")

        if row["bindingState"] == "blocked" and row["calmTruthState"] == "allowed":
            fail(f"Blocked row {row['surfaceAuthorityVerdictId']} is still marked calmly live.")

        if row["bindingState"] == "drifted":
            if row["calmTruthState"] == "allowed" or row["writableTruthState"] == "allowed":
                fail(f"Drifted row {row['surfaceAuthorityVerdictId']} still exposes live calm or writable posture.")

    if verdicts["bindingStateCounts"] != dict(sorted(binding_counts.items())):
        fail("Surface authority verdict counts drifted from the catalog.")

    gap_row = next((row for row in rows if row["routeFamilyRef"] == "rf_assistive_control_shell"), None)
    if not gap_row:
        fail("Expected one explicit blocked standalone assistive route-family row.")
    if gap_row["bindingState"] != "blocked":
        fail("Standalone assistive route-family row must remain blocked.")
    if "RFD_130_ASSISTIVE_STANDALONE_PUBLICATION_BLOCK" not in gap_row["recoveryDispositionRefs"]:
        fail("Standalone assistive gap row is missing its explicit publication-block disposition.")

    recovery_refs_in_matrix = {row["surface_authority_verdict_id"] for row in recovery_matrix}
    for row in rows:
        if row["recoveryDispositionRefs"] and row["surfaceAuthorityVerdictId"] not in recovery_refs_in_matrix:
            fail(f"Recovery matrix is missing row {row['surfaceAuthorityVerdictId']}.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    if scripts.get("validate:audience-surface-runtime-bindings") != ROOT_SCRIPT_UPDATES[
        "validate:audience-surface-runtime-bindings"
    ]:
        fail("Root script drifted for validate:audience-surface-runtime-bindings.")
    if "build_audience_surface_runtime_bindings.py" not in scripts["codegen"]:
        fail("Root codegen script is missing the seq_130 builder.")
    if "validate:audience-surface-runtime-bindings" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:audience-surface-runtime-bindings.")
    if "validate:audience-surface-runtime-bindings" not in scripts["check"]:
        fail("Root check script is missing validate:audience-surface-runtime-bindings.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "audience-surface-parity-board.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing seq_130 coverage.")

    assert_contains(BOARD_PATH, "Audience_Surface_Parity_Board")
    assert_contains(BOARD_PATH, "data-testid=\"surface-lattice\"")
    assert_contains(BOARD_PATH, "data-testid=\"parity-heatmap\"")
    assert_contains(BOARD_PATH, "data-testid=\"recovery-ladder\"")
    assert_contains(BOARD_PATH, "data-testid=\"inspector\"")
    assert_contains(SPEC_PATH, "audienceSurfaceParityBoardCoverage")
    assert_contains(SPEC_PATH, "selection sync between lattice nodes, heatmap rows, recovery ladder, and inspector")


if __name__ == "__main__":
    main()
