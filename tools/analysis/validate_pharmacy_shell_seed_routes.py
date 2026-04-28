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
APP_DIR = ROOT / "apps" / "pharmacy-console" / "src"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

ROUTES_MD = DOCS_DIR / "120_pharmacy_shell_seed_routes.md"
PROJECTIONS_MD = DOCS_DIR / "120_pharmacy_mock_projection_strategy.md"
CONTRACTS_MD = DOCS_DIR / "120_pharmacy_checkpoint_dispatch_and_outcome_contracts.md"
ROUTE_MAP_MMD = DOCS_DIR / "120_pharmacy_shell_route_map.mmd"
GALLERY_HTML = DOCS_DIR / "120_pharmacy_shell_gallery.html"

ROUTES_CSV = DATA_DIR / "pharmacy_route_contract_seed.csv"
PROJECTIONS_JSON = DATA_DIR / "pharmacy_mock_projection_examples.json"
MATRIX_CSV = DATA_DIR / "pharmacy_checkpoint_and_proof_matrix.csv"

APP_PATH = APP_DIR / "App.tsx"
MODEL_PATH = APP_DIR / "pharmacy-shell-seed.model.ts"
SURFACE_PATH = APP_DIR / "pharmacy-shell-seed.tsx"
STYLE_PATH = APP_DIR / "pharmacy-shell-seed.css"
MODEL_TEST_PATH = APP_DIR / "pharmacy-shell-seed.model.test.ts"
INTEGRATION_TEST_PATH = APP_DIR / "pharmacy-shell-seed.integration.test.ts"
ACCESSIBILITY_TEST_PATH = APP_DIR / "pharmacy-shell-seed.accessibility.test.tsx"
SPEC_PATH = PLAYWRIGHT_DIR / "pharmacy-shell-seed-routes.spec.js"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_pharmacy_shell_seed_routes.py"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_pharmacy_shell_seed_routes.ts"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

EXPECTED_ROUTE_PATHS = {
    "/workspace/pharmacy",
    "/workspace/pharmacy/PHC-2057",
    "/workspace/pharmacy/PHC-2090/validate",
    "/workspace/pharmacy/PHC-2081/inventory",
    "/workspace/pharmacy/PHC-2124/resolve",
    "/workspace/pharmacy/PHC-2072/handoff",
    "/workspace/pharmacy/PHC-2103/assurance",
}
EXPECTED_SCENARIOS = {
    "ready_to_dispatch",
    "proof_pending",
    "contradictory_proof",
    "partial_supply",
    "clarification_required",
    "urgent_return",
    "weak_match_outcome",
    "manual_review_debt",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_120 artifact: {path}")


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
        ROUTES_MD,
        PROJECTIONS_MD,
        CONTRACTS_MD,
        ROUTE_MAP_MMD,
        GALLERY_HTML,
        ROUTES_CSV,
        PROJECTIONS_JSON,
        MATRIX_CSV,
        APP_PATH,
        MODEL_PATH,
        SURFACE_PATH,
        STYLE_PATH,
        MODEL_TEST_PATH,
        INTEGRATION_TEST_PATH,
        ACCESSIBILITY_TEST_PATH,
        SPEC_PATH,
        VALIDATOR_PATH,
        BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    projections = load_json(PROJECTIONS_JSON)
    route_rows = load_csv(ROUTES_CSV)
    matrix_rows = load_csv(MATRIX_CSV)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    if projections["task_id"] != "par_120":
        fail("Pharmacy projection artifact drifted off par_120.")
    if projections["visual_mode"] != "Pharmacy_Shell_Seed_Routes":
        fail("Pharmacy visual mode drifted.")

    scenario_set = {row["scenario"] for row in projections["examples"]}
    if scenario_set != EXPECTED_SCENARIOS:
        fail(f"Projection scenario coverage drifted: {scenario_set ^ EXPECTED_SCENARIOS}")

    if len(projections["gallery"]) != len(projections["examples"]):
        fail("Gallery seed count drifted from example count.")
    if not any(row["recoveryPosture"] == "recovery_only" for row in projections["gallery"]):
        fail("Gallery seed lost reopen-for-safety posture coverage.")
    if not any(row["visualizationMode"] == "table_only" for row in projections["gallery"]):
        fail("Gallery seed lost table-only parity downgrade coverage.")

    route_paths = {row["path"] for row in route_rows}
    if route_paths != EXPECTED_ROUTE_PATHS:
        fail(f"Pharmacy route coverage drifted: {route_paths ^ EXPECTED_ROUTE_PATHS}")
    if len(route_rows) != 7:
        fail(f"Expected 7 pharmacy route rows, found {len(route_rows)}.")
    if any(row["routeFamilyRef"] != "rf_pharmacy_console" for row in route_rows):
        fail("Pharmacy route family drifted away from rf_pharmacy_console.")
    if any(row["continuityKey"] != "pharmacy.console" for row in route_rows):
        fail("Pharmacy continuity key drifted away from pharmacy.console.")

    matrix_scenarios = {row["scenario"] for row in matrix_rows}
    if matrix_scenarios != EXPECTED_SCENARIOS:
        fail("Checkpoint and proof matrix drifted off the seeded scenario set.")
    if len(matrix_rows) != 8:
        fail(f"Expected 8 matrix rows, found {len(matrix_rows)}.")

    assert_contains(APP_PATH, "PharmacyShellSeedApp")
    assert_contains(APP_PATH, "pharmacy-shell-seed.css")
    assert_contains(SURFACE_PATH, "SharedStatusStrip")
    assert_contains(SURFACE_PATH, "CasePulse")
    assert_contains(SURFACE_PATH, "resolveAutomationAnchorProfile")
    assert_contains(SURFACE_PATH, 'data-testid="pharmacy-shell-root"')
    assert_contains(MODEL_PATH, "GAP_TRUTHFUL_PHARMACY_POSTURE_PROOF_DISPUTE_V1")
    assert_contains(MODEL_PATH, "createPharmacyRouteMapMermaid")
    assert_contains(ROUTES_MD, "/workspace/pharmacy/:pharmacyCaseId/handoff")
    assert_contains(PROJECTIONS_MD, "weak_match_outcome")
    assert_contains(CONTRACTS_MD, "authoritative proof")
    assert_contains(CONTRACTS_MD, "reopen-for-safety")
    assert_contains(ROUTE_MAP_MMD, "/workspace/pharmacy/:pharmacyCaseId/assurance")
    assert_contains(GALLERY_HTML, 'data-testid="pharmacy-shell-gallery"')
    assert_contains(GALLERY_HTML, "Checkpoint, proof, and outcome matrix")

    if (
        root_package["scripts"].get("validate:pharmacy-shell-seed-routes")
        != "python3 ./tools/analysis/validate_pharmacy_shell_seed_routes.py"
    ):
        fail("Root package is missing validate:pharmacy-shell-seed-routes.")
    if "build_pharmacy_shell_seed_routes.ts" not in root_package["scripts"].get("codegen", ""):
        fail("Root codegen script is missing the pharmacy shell builder.")
    if "validate:pharmacy-shell-seed-routes" not in ROOT_SCRIPT_UPDATES:
        fail("root_script_updates.py is missing validate:pharmacy-shell-seed-routes.")
    if "build_pharmacy_shell_seed_routes.ts" not in ROOT_SCRIPT_UPDATES.get("codegen", ""):
        fail("root_script_updates.py codegen is missing the pharmacy shell builder.")

    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package["scripts"].get(key, "")
        if "pharmacy-shell-seed-routes.spec.js" not in script:
            fail(f"Playwright package script {key} is missing pharmacy-shell-seed-routes.spec.js.")


if __name__ == "__main__":
    main()
