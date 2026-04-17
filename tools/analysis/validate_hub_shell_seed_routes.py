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
APP_DIR = ROOT / "apps" / "hub-desk" / "src"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

ROUTES_MD = DOCS_DIR / "118_hub_shell_seed_routes.md"
PROJECTIONS_MD = DOCS_DIR / "118_hub_mock_projection_strategy.md"
TRUTH_MD = DOCS_DIR / "118_hub_option_truth_and_fallback_contracts.md"
ROUTE_MAP_MMD = DOCS_DIR / "118_hub_shell_route_map.mmd"
GALLERY_HTML = DOCS_DIR / "118_hub_shell_gallery.html"

ROUTES_CSV = DATA_DIR / "hub_route_contract_seed.csv"
PROJECTIONS_JSON = DATA_DIR / "hub_mock_projection_examples.json"
OPTION_MATRIX_CSV = DATA_DIR / "hub_option_and_timer_matrix.csv"

MODEL_PATH = APP_DIR / "hub-shell-seed.model.ts"
SURFACE_PATH = APP_DIR / "hub-shell-seed.tsx"
STYLE_PATH = APP_DIR / "hub-shell-seed.css"
MODEL_TEST_PATH = APP_DIR / "hub-shell-seed.model.test.ts"
INTEGRATION_TEST_PATH = APP_DIR / "hub-shell-seed.integration.test.ts"
ACCESSIBILITY_TEST_PATH = APP_DIR / "hub-shell-seed.accessibility.test.tsx"
SPEC_PATH = PLAYWRIGHT_DIR / "hub-shell-seed-routes.spec.js"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_hub_shell_seed_routes.py"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_hub_shell_seed_routes.ts"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

EXPECTED_ROUTES = {
    "/hub/queue",
    "/hub/exceptions",
    "/hub/case/:hubCoordinationCaseId",
    "/hub/alternatives/:offerSessionId",
    "/hub/audit/:hubCoordinationCaseId",
}
EXPECTED_VIEW_MODES = {"queue", "case", "alternatives", "exceptions", "audit"}
EXPECTED_TRUTH_MODES = {
    "exclusive_hold",
    "truthful_nonexclusive",
    "confirmation_pending",
    "confirmed",
    "callback_only",
    "diagnostic_only",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_118 artifact: {path}")


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
        TRUTH_MD,
        ROUTE_MAP_MMD,
        GALLERY_HTML,
        ROUTES_CSV,
        PROJECTIONS_JSON,
        OPTION_MATRIX_CSV,
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
    option_rows = load_csv(OPTION_MATRIX_CSV)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    if projections["task_id"] != "par_118":
        fail("Hub projection artifact drifted off par_118.")
    if projections["visual_mode"] != "Hub_Shell_Seed_Routes":
        fail("Hub visual mode drifted.")
    if {row["path"] for row in projections["examples"]} != {
        "/hub/queue",
        "/hub/case/hub-case-087",
        "/hub/alternatives/ofs_104",
        "/hub/exceptions",
        "/hub/audit/hub-case-066",
        "/hub/case/hub-case-052",
    }:
        fail("Hub projection examples drifted from the seeded routes.")

    route_paths = {row["path"] for row in route_rows}
    if route_paths != EXPECTED_ROUTES:
        fail(f"Hub route seed drifted: {route_paths ^ EXPECTED_ROUTES}")
    if {row["viewMode"] for row in route_rows} != EXPECTED_VIEW_MODES:
        fail("Hub view-mode coverage drifted.")
    if any(row["routeFamilyRef"] not in {"rf_hub_queue", "rf_hub_case_management"} for row in route_rows):
        fail("Hub route-family coverage drifted.")
    if any(row["continuityKey"] != "hub.queue" for row in route_rows):
        fail("Hub continuity key drifted away from hub.queue.")

    truth_modes = {row["optionTruthMode"] for row in option_rows}
    if truth_modes != EXPECTED_TRUTH_MODES:
        fail(f"Hub option truth coverage drifted: {truth_modes ^ EXPECTED_TRUTH_MODES}")
    if not any(row["countdownAuthority"] == "exclusive_held" and row["timerMode"] == "hold_expiry" for row in option_rows):
        fail("Hub option matrix lost the held countdown authority row.")
    if any(
        row["countdownAuthority"] == "exclusive_held" and row["optionTruthMode"] != "exclusive_hold"
        for row in option_rows
    ):
        fail("Only exclusive_hold may claim countdown authority.")
    if any(
        row["optionTruthMode"] != "exclusive_hold" and row["reservedCopyAllowed"] != "no"
        for row in option_rows
    ):
        fail("Reserved copy leaked beyond exclusive_hold options.")

    gallery = projections["gallery"]
    if len(gallery) != len(projections["examples"]):
        fail("Hub gallery seed count drifted from example count.")
    if not any(row["artifactModeState"] == "table_only" for row in gallery):
        fail("Hub gallery seed lost table-only exception coverage.")
    if not any(row["currentCase"]["status"] == "booked_pending_practice_ack" for row in gallery):
        fail("Hub gallery seed lost practice-acknowledgement debt coverage.")

    assert_contains(ROUTES_MD, "hub.queue")
    assert_contains(PROJECTIONS_MD, "confirmation pending")
    assert_contains(TRUTH_MD, "exclusive_hold")
    assert_contains(ROUTE_MAP_MMD, "/hub/alternatives/:offerSessionId")
    assert_contains(GALLERY_HTML, 'data-testid="hub-shell-gallery"')
    assert_contains(GALLERY_HTML, "Truth and timer specimens")

    if root_package["scripts"].get("validate:hub-shell-seed-routes") != "python3 ./tools/analysis/validate_hub_shell_seed_routes.py":
        fail("Root package is missing validate:hub-shell-seed-routes.")
    if "build_hub_shell_seed_routes.ts" not in root_package["scripts"].get("codegen", ""):
        fail("Root codegen script is missing the hub shell builder.")
    if "validate:hub-shell-seed-routes" not in ROOT_SCRIPT_UPDATES:
        fail("root_script_updates.py is missing validate:hub-shell-seed-routes.")
    if "build_hub_shell_seed_routes.ts" not in ROOT_SCRIPT_UPDATES.get("codegen", ""):
        fail("root_script_updates.py codegen is missing the hub shell builder.")

    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package["scripts"].get(key, "")
        if "hub-shell-seed-routes.spec.js" not in script:
            fail(f"Playwright package script {key} is missing hub-shell-seed-routes.spec.js.")

    assert_contains(SURFACE_PATH, "HubShellSeedApp")
    assert_contains(SURFACE_PATH, "DecisionDock")
    assert_contains(MODEL_PATH, "createHubReturnToken")
    assert_contains(MODEL_PATH, "resolveHubShellSnapshot")


if __name__ == "__main__":
    main()
