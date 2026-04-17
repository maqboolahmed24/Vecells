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
TOOLS_DIR = ROOT / "tools" / "runtime-migration-backfill"

SCHEMA_PATH = DATA_DIR / "schema_migration_plan_schema.json"
BACKFILL_SCHEMA_PATH = DATA_DIR / "projection_backfill_plan_schema.json"
MATRIX_PATH = DATA_DIR / "migration_readiness_matrix.csv"
CATALOG_PATH = DATA_DIR / "migration_backfill_control_catalog.json"
DESIGN_DOC_PATH = DOCS_DIR / "95_schema_migration_and_projection_backfill_design.md"
RULES_DOC_PATH = DOCS_DIR / "95_expand_migrate_contract_and_readiness_rules.md"
HTML_PATH = DOCS_DIR / "95_migration_and_backfill_control_room.html"
SPEC_PATH = TESTS_DIR / "migration-and-backfill-control-room.spec.js"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-migration-backfill-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-migration-backfill.ts"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "migration-backfill.ts"
TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "migration-backfill.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_095 artifact: {path}")


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
        SCHEMA_PATH,
        BACKFILL_SCHEMA_PATH,
        MATRIX_PATH,
        CATALOG_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
    ]:
        assert_exists(path)

    catalog = load_json(CATALOG_PATH)
    matrix_rows = load_csv(MATRIX_PATH)
    if catalog["task_id"] != "par_095":
        fail("Migration/backfill catalog drifted off par_095.")
    if catalog["visual_mode"] != "Migration_And_Backfill_Control_Room":
        fail("Migration/backfill control-room mode drifted.")
    if catalog["summary"]["scenario_count"] != len(catalog["records"]):
        fail("scenario_count drifted from catalog records.")
    if catalog["summary"]["ready_count"] != sum(
        1 for row in catalog["records"] if row["verdictState"] == "ready"
    ):
        fail("ready_count drifted.")
    if catalog["summary"]["constrained_count"] != sum(
        1 for row in catalog["records"] if row["verdictState"] == "constrained"
    ):
        fail("constrained_count drifted.")
    if catalog["summary"]["blocked_count"] != sum(
        1 for row in catalog["records"] if row["verdictState"] == "blocked"
    ):
        fail("blocked_count drifted.")
    if len(matrix_rows) != catalog["summary"]["scenario_count"]:
        fail("Migration readiness matrix row count drifted.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:migration-backfill",
        "ci:rehearse-migration-backfill",
        "ci:verify-migration-backfill",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_migration_and_backfill_runner.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_095 builder.")
    if "validate:migration-backfill" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:migration-backfill.")
    if "validate:migration-backfill" not in scripts["check"]:
        fail("Root check script is missing validate:migration-backfill.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name, token in {
        "build": "migration-and-backfill-control-room.spec.js",
        "lint": "migration-and-backfill-control-room.spec.js",
        "test": "migration-and-backfill-control-room.spec.js",
        "typecheck": "migration-and-backfill-control-room.spec.js",
        "e2e": "migration-and-backfill-control-room.spec.js",
    }.items():
        if token not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_095 spec.")

    for token in [
        "validate:migration-backfill",
        "ci:rehearse-migration-backfill",
        "ci:verify-migration-backfill",
        "build_migration_and_backfill_runner.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(INDEX_PATH, 'export * from "./migration-backfill";')
    for token in [
        "SchemaMigrationPlan",
        "GovernedProjectionBackfillPlan",
        "MigrationExecutionBinding",
        "MigrationImpactPreview",
        "MigrationActionRecord",
        "MigrationActionSettlement",
        "MigrationBackfillRunner",
        "createMigrationBackfillSimulationHarness",
        "runMigrationBackfillSimulation",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "builds deterministic impact previews for the governed plan",
        "settles a dry run as pending observation instead of implying production safety",
        "fails closed when runtime publication parity drifts",
        "resumes a checkpointed backfill instead of replaying from the beginning",
        "forces rollback-required posture when rollback mode proof diverges",
    ]:
        assert_contains(TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the migration and backfill simulation harness")

    for marker in [
        "Migration_And_Backfill_Control_Room",
        'data-testid="phase-diagram"',
        'data-testid="readiness-matrix"',
        'data-testid="execution-timeline"',
        'data-testid="execution-table"',
        'data-testid="evidence-table"',
        'data-testid="inspector"',
        'data-testid="filter-environment"',
        'data-testid="filter-plan-state"',
        'data-testid="filter-route-family"',
        'data-testid="filter-verdict-state"',
        'data-testid="filter-rollback-mode"',
    ]:
        assert_contains(HTML_PATH, marker)

    for probe in [
        "filter behavior and synchronized selection",
        "keyboard navigation and focus management",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks and landmark verification",
        "blocked, constrained, and ready verdicts remain visually and semantically distinct",
    ]:
        assert_contains(SPEC_PATH, probe)

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-migration-backfill")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-migration-backfill")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-migration-backfill")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-migration-backfill")

    print("migration and backfill runner validated")


if __name__ == "__main__":
    main()
