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
APP_DIR = ROOT / "apps" / "ops-console" / "src"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

ROUTES_MD = DOCS_DIR / "117_operations_shell_seed_routes.md"
PROJECTIONS_MD = DOCS_DIR / "117_operations_mock_projection_strategy.md"
CONTINUITY_MD = DOCS_DIR / "117_operations_board_continuity_and_delta_gate_contracts.md"
ROUTE_MAP_MMD = DOCS_DIR / "117_operations_shell_route_map.mmd"
GALLERY_HTML = DOCS_DIR / "117_operations_shell_gallery.html"

ROUTES_CSV = DATA_DIR / "operations_route_contract_seed.csv"
PROJECTIONS_JSON = DATA_DIR / "operations_mock_projection_examples.json"
ANOMALY_CSV = DATA_DIR / "operations_anomaly_and_intervention_matrix.csv"

MODEL_PATH = APP_DIR / "operations-shell-seed.model.ts"
SURFACE_PATH = APP_DIR / "operations-shell-seed.tsx"
STYLE_PATH = APP_DIR / "operations-shell-seed.css"
MODEL_TEST_PATH = APP_DIR / "operations-shell-seed.model.test.ts"
INTEGRATION_TEST_PATH = APP_DIR / "operations-shell-seed.integration.test.ts"
ACCESSIBILITY_TEST_PATH = APP_DIR / "operations-shell-seed.accessibility.test.tsx"
SPEC_PATH = PLAYWRIGHT_DIR / "operations-shell-seed-routes.spec.js"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_operations_shell_seed_routes.py"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_operations_shell_seed_routes.ts"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

EXPECTED_ROOT_PATHS = {
    "/ops/overview",
    "/ops/queues",
    "/ops/capacity",
    "/ops/dependencies",
    "/ops/audit",
    "/ops/assurance",
    "/ops/incidents",
    "/ops/resilience",
}
EXPECTED_CHILD_KINDS = {"investigations", "interventions", "compare", "health"}
EXPECTED_ANOMALIES = {
    "ops-route-04",
    "ops-route-07",
    "ops-route-09",
    "ops-route-12",
    "ops-route-15",
    "ops-route-18",
    "ops-route-21",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_117 artifact: {path}")


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
        CONTINUITY_MD,
        ROUTE_MAP_MMD,
        GALLERY_HTML,
        ROUTES_CSV,
        PROJECTIONS_JSON,
        ANOMALY_CSV,
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
    anomaly_rows = load_csv(ANOMALY_CSV)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    if projections["task_id"] != "par_117":
        fail("Operations projection artifact drifted off par_117.")
    if projections["visual_mode"] != "Operations_Shell_Seed_Routes":
        fail("Operations visual mode drifted.")

    example_paths = {row["path"] for row in projections["examples"]}
    if not EXPECTED_ROOT_PATHS.intersection(example_paths):
        fail("Operations projection examples no longer cover the canonical root routes.")

    route_paths = {row["path"] for row in route_rows}
    if EXPECTED_ROOT_PATHS - route_paths:
        fail(f"Missing root route rows: {EXPECTED_ROOT_PATHS - route_paths}")

    child_rows = [row for row in route_rows if row["childRouteKind"]]
    if len(route_rows) != 40:
        fail(f"Operations route contract seed should publish 40 rows, found {len(route_rows)}.")
    if {row["childRouteKind"] for row in child_rows} != EXPECTED_CHILD_KINDS:
        fail("Operations child route kinds drifted.")
    if any(row["routeFamilyRef"] not in {"rf_operations_board", "rf_operations_drilldown"} for row in route_rows):
        fail("Operations route families drifted.")
    if any(row["continuityKey"] != "ops.board" for row in route_rows):
        fail("Operations continuity key drifted away from ops.board.")

    anomaly_ids = {row["anomalyId"] for row in anomaly_rows}
    if anomaly_ids != EXPECTED_ANOMALIES:
        fail(f"Anomaly matrix coverage drifted: {anomaly_ids ^ EXPECTED_ANOMALIES}")
    if any(not row["governanceStub"] for row in anomaly_rows):
        fail("One or more anomaly rows lost governance stub coverage.")

    gallery = projections["gallery"]
    if len(gallery) != len(projections["examples"]):
        fail("Gallery seed count drifted from example count.")
    if not any(row["location"]["childRouteKind"] == "compare" for row in gallery):
        fail("Gallery seed lost compare posture coverage.")
    if not any(row["deltaGate"]["gateState"] == "table_only" for row in gallery):
        fail("Gallery seed lost visualization parity downgrade coverage.")

    assert_contains(ROUTES_MD, "rf_operations_board")
    assert_contains(ROUTES_MD, "rf_operations_drilldown")
    assert_contains(PROJECTIONS_MD, "Backlog surge")
    assert_contains(CONTINUITY_MD, "OpsReturnToken")
    assert_contains(ROUTE_MAP_MMD, "/ops/:lens/investigations/:opsRouteIntentId")
    assert_contains(GALLERY_HTML, 'data-testid="ops-shell-gallery"')
    assert_contains(GALLERY_HTML, "Visualization parity specimen")

    if root_package["scripts"].get("validate:operations-shell-seed-routes") != "python3 ./tools/analysis/validate_operations_shell_seed_routes.py":
        fail("Root package is missing validate:operations-shell-seed-routes.")
    if "build_operations_shell_seed_routes.ts" not in root_package["scripts"].get("codegen", ""):
        fail("Root codegen script is missing the operations shell builder.")
    if "validate:operations-shell-seed-routes" not in ROOT_SCRIPT_UPDATES:
        fail("root_script_updates.py is missing validate:operations-shell-seed-routes.")
    if "build_operations_shell_seed_routes.ts" not in ROOT_SCRIPT_UPDATES.get("codegen", ""):
        fail("root_script_updates.py codegen is missing the operations shell builder.")

    for key in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package["scripts"].get(key, "")
        if "operations-shell-seed-routes.spec.js" not in script:
            fail(f"Playwright package script {key} is missing operations-shell-seed-routes.spec.js.")

    assert_contains(SURFACE_PATH, "OperationsShellSeedApp")
    assert_contains(SURFACE_PATH, "InterventionWorkbench")
    assert_contains(SURFACE_PATH, "OpsReturnToken")
    assert_contains(MODEL_PATH, "createOpsDeltaGate")
    assert_contains(MODEL_PATH, "createOpsSelectionLease")


if __name__ == "__main__":
    main()
