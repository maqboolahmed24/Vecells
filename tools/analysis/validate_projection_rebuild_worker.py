#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

CASEBOOK_PATH = DATA_DIR / "projection_rebuild_casebook.json"
MATRIX_PATH = DATA_DIR / "event_applier_dispatch_matrix.csv"
MANIFEST_PATH = DATA_DIR / "projection_checkpoint_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "82_projection_rebuild_and_event_applier_design.md"
RULES_DOC_PATH = DOCS_DIR / "82_projection_rebuild_readiness_and_compatibility_rules.md"
HTML_PATH = DOCS_DIR / "82_projection_rebuild_observatory.html"
SPEC_PATH = TESTS_DIR / "projection-rebuild-observatory.spec.js"
RUNNER_PATH = ROOT / "tools" / "analysis" / "run_projection_rebuild_lab.ts"

ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "projection-rebuild.ts"
TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "projection-rebuild.test.ts"
PUBLIC_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"


def fail(message: str) -> None:
    raise SystemExit(message)


def read_json(path: Path) -> object:
    if not path.exists():
        fail(f"Missing required JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing required CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, needle: str) -> None:
    if not path.exists():
        fail(f"Missing required source file: {path}")
    source = path.read_text(encoding="utf-8")
    if needle not in source:
        fail(f"{path} is missing required token: {needle}")


def main() -> None:
    casebook = read_json(CASEBOOK_PATH)
    matrix_rows = read_csv(MATRIX_PATH)
    manifest = read_json(MANIFEST_PATH)

    for required_path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        RUNNER_PATH,
    ]:
        if not required_path.exists():
            fail(f"Missing required artifact: {required_path}")

    if casebook["task_id"] != "par_082":
        fail("Projection rebuild casebook task id drifted.")
    if casebook["mode"] != "Projection_Rebuild_Observatory":
        fail("Projection rebuild mode drifted.")

    scenarios = casebook["scenarios"]
    if casebook["summary"]["scenario_count"] != len(scenarios):
        fail("scenario_count drifted from scenarios.")
    if casebook["summary"]["live_projection_count"] != sum(
        1 for row in scenarios if row["readinessState"] == "live"
    ):
        fail("live_projection_count drifted.")
    if casebook["summary"]["recovering_projection_count"] != sum(
        1 for row in scenarios if row["readinessState"] == "recovering"
    ):
        fail("recovering_projection_count drifted.")
    if casebook["summary"]["stale_projection_count"] != sum(
        1 for row in scenarios if row["readinessState"] == "stale"
    ):
        fail("stale_projection_count drifted.")
    if casebook["summary"]["crashed_projection_count"] != sum(
        1 for row in scenarios if row["rebuildState"] == "crashed"
    ):
        fail("crashed_projection_count drifted.")
    if casebook["summary"]["blocked_apply_count"] != sum(
        1 for row in scenarios if row["compatibilityState"] == "blocked"
    ):
        fail("blocked_apply_count drifted.")
    if casebook["summary"]["restart_safe_resume_count"] != sum(
        1 for row in scenarios if row["duplicateEventCount"] > 0
    ):
        fail("restart_safe_resume_count drifted.")
    if casebook["summary"]["partial_checkpoint_resume_count"] != sum(
        1 for row in scenarios if row["resumeCount"] > 0
    ):
        fail("partial_checkpoint_resume_count drifted.")

    expected_ids = {
        "PRB_082_COLD_REBUILD",
        "PRB_082_PARTIAL_RESUME",
        "PRB_082_RESTART_CRASH",
        "PRB_082_RESTART_RESUME",
        "PRB_082_DUAL_READ_COMPARE",
        "PRB_082_CONTRACT_MISMATCH",
        "PRB_082_STALE_POSTURE",
    }
    scenario_ids = {row["scenarioId"] for row in scenarios}
    if scenario_ids != expected_ids:
        fail("Projection rebuild scenario ids drifted.")

    if len(matrix_rows) != 15:
        fail("Dispatch matrix row count drifted.")
    required_events = {
        "request.created",
        "request.submitted",
        "request.closed",
        "identity.repair_case.freeze_committed",
        "identity.repair_release.settled",
        "triage.task.created",
        "triage.task.settled",
        "reachability.assessment.settled",
        "reachability.repair.started",
        "exception.review_case.opened",
    }
    matrix_events = {row["eventName"] for row in matrix_rows}
    if matrix_events != required_events:
        fail("Dispatch matrix event set drifted.")

    if manifest["summary"]["projection_family_count"] != len(manifest["projectionFamilies"]):
        fail("projection_family_count drifted.")
    if manifest["summary"]["version_set_count"] != len(manifest["versionSets"]):
        fail("version_set_count drifted.")
    if manifest["summary"]["checkpoint_record_count"] != len(manifest["checkpointRecords"]):
        fail("checkpoint_record_count drifted.")
    if manifest["summary"]["parallel_gap_count"] != len(manifest["parallelInterfaceGaps"]):
        fail("parallel_gap_count drifted.")

    html = HTML_PATH.read_text(encoding="utf-8")
    for marker in [
        "Projection_Rebuild_Observatory",
        'data-testid="filter-family"',
        'data-testid="filter-readiness"',
        'data-testid="filter-compatibility"',
        'data-testid="filter-environment"',
        'data-testid="flow-diagram"',
        'data-testid="lag-surface"',
        'data-testid="readiness-strip"',
        'data-testid="rebuild-table"',
        'data-testid="applier-table"',
        'data-testid="inspector"',
    ]:
        if marker not in html:
            fail(f"Observatory HTML is missing required marker: {marker}")

    spec = SPEC_PATH.read_text(encoding="utf-8")
    for probe in [
        "filter behavior and synchronized selection",
        "keyboard navigation and focus management",
        "reduced motion",
        "responsive layout",
        "accessibility smoke checks",
    ]:
        if probe not in spec:
            fail(f"Spec is missing expected coverage text: {probe}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text(encoding="utf-8")
    for token in [
        "validate:projection-rebuild",
        "validate_projection_rebuild_worker.py",
    ]:
        if token not in root_script_updates:
            fail(f"root_script_updates.py is missing required token: {token}")

    root_package = read_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    if "pnpm validate:projection-rebuild" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:projection-rebuild.")
    if "pnpm validate:projection-rebuild" not in scripts["check"]:
        fail("Root check script is missing validate:projection-rebuild.")
    if (
        scripts["validate:projection-rebuild"]
        != "python3 ./tools/analysis/validate_projection_rebuild_worker.py"
    ):
        fail("Root validate:projection-rebuild script drifted.")

    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    playwright_scripts = playwright_package["scripts"]
    for key, token in {
        "build": "node --check projection-rebuild-observatory.spec.js",
        "lint": "eslint projection-rebuild-observatory.spec.js",
        "test": "node projection-rebuild-observatory.spec.js",
        "typecheck": "node --check projection-rebuild-observatory.spec.js",
        "e2e": "node projection-rebuild-observatory.spec.js --run",
    }.items():
        if token not in playwright_scripts[key]:
            fail(f"Playwright package script {key} is missing {token}.")

    for token in [
        "EventApplier",
        "ProjectionRebuildWorker",
        "projectionApplierDispatchTable",
        "projectionRebuildCanonicalEvents",
        "validateProjectionLedgerState",
        "runProjectionRebuildSimulation",
        "PARALLEL_INTERFACE_GAP_082",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "rebuilds the patient requests projection from immutable events",
        "replays after a crash without duplicating projection effects",
        "resumes a staff-workspace catch-up from a saved checkpoint",
        "supports dual-read rebuild comparison before cutover",
    ]:
        assert_contains(TEST_PATH, token)

    assert_contains(PUBLIC_TEST_PATH, "runs the projection rebuild simulation harness")

    print("projection rebuild worker validated")


if __name__ == "__main__":
    main()
