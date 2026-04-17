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
TOOLS_DIR = ROOT / "tools" / "runtime-release-watch"

WATCH_TUPLE_SCHEMA_PATH = DATA_DIR / "release_watch_tuple_schema.json"
POLICY_SCHEMA_PATH = DATA_DIR / "wave_observation_policy_schema.json"
PROBE_CATALOG_PATH = DATA_DIR / "wave_observation_probe_catalog.json"
TRIGGER_MATRIX_PATH = DATA_DIR / "rollback_trigger_matrix.csv"
PIPELINE_CATALOG_PATH = DATA_DIR / "release_watch_pipeline_catalog.json"
DESIGN_DOC_PATH = DOCS_DIR / "97_wave_observation_and_watch_tuple_pipeline.md"
DRIFT_DOC_PATH = DOCS_DIR / "97_tuple_supersession_and_drift_rules.md"
PROBE_DOC_PATH = DOCS_DIR / "97_wave_observation_probe_and_trigger_model.md"
HTML_PATH = DOCS_DIR / "97_release_watch_pipeline_cockpit.html"
SPEC_PATH = TESTS_DIR / "release-watch-pipeline-cockpit.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
INDEX_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "release-watch-pipeline.ts"
TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "release-watch-pipeline.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-release-watch-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-release-watch-pipeline.ts"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_097 artifact: {path}")


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
        WATCH_TUPLE_SCHEMA_PATH,
        POLICY_SCHEMA_PATH,
        PROBE_CATALOG_PATH,
        TRIGGER_MATRIX_PATH,
        PIPELINE_CATALOG_PATH,
        DESIGN_DOC_PATH,
        DRIFT_DOC_PATH,
        PROBE_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
    ]:
        assert_exists(path)

    catalog = load_json(PIPELINE_CATALOG_PATH)
    probe_payload = load_json(PROBE_CATALOG_PATH)
    trigger_rows = load_csv(TRIGGER_MATRIX_PATH)
    if catalog["task_id"] != "par_097":
        fail("Release watch catalog drifted off par_097.")
    if catalog["visual_mode"] != "Release_Watch_Pipeline_Cockpit":
        fail("Release watch cockpit mode drifted.")
    summary = catalog["summary"]
    if summary["scenario_count"] != len(catalog["records"]):
        fail("scenario_count drifted from release watch records.")
    if summary["probe_catalog_count"] != len(probe_payload["probeCatalog"]):
        fail("probe_catalog_count drifted.")
    if summary["rollback_trigger_row_count"] != len(trigger_rows):
        fail("rollback_trigger_row_count drifted.")

    expected_states = {"accepted", "satisfied", "blocked", "stale", "rollback_required"}
    actual_states = {row["expected"]["watchState"] for row in catalog["records"]}
    if actual_states != expected_states:
        fail(f"Expected watch states {expected_states}, found {actual_states}.")

    required_rings = {"ci-preview", "integration", "preprod"}
    actual_rings = {row["environmentRing"] for row in catalog["records"]}
    if not required_rings.issubset(actual_rings):
        fail(f"Missing required non-production ring examples: {required_rings - actual_rings}")

    for row in catalog["records"]:
        tuple_row = row["tuple"]
        policy_row = row["policy"]
        if tuple_row["waveObservationPolicyRef"] != policy_row["waveObservationPolicyId"]:
            fail(f"{row['scenarioId']} lost tuple-to-policy linkage.")
        if policy_row["watchTupleHash"] != tuple_row["watchTupleHash"]:
            fail(f"{row['scenarioId']} lost watchTupleHash linkage.")
        if not policy_row["gapResolutionRefs"]:
            fail(f"{row['scenarioId']} lost gapResolutionRefs.")
        if policy_row["operationalReadinessSnapshotRef"] != "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT":
            fail(f"{row['scenarioId']} lost readiness placeholder binding.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:release-watch",
        "ci:rehearse-release-watch",
        "ci:verify-release-watch",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_release_watch_pipeline.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_097 builder.")
    if "validate:release-watch" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:release-watch.")
    if "validate:release-watch" not in scripts["check"]:
        fail("Root check script is missing validate:release-watch.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "release-watch-pipeline-cockpit.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_097 spec.")

    for token in [
        "validate:release-watch",
        "ci:rehearse-release-watch",
        "ci:verify-release-watch",
        "build_release_watch_pipeline.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(INDEX_PATH, 'export * from "./release-watch-pipeline";')
    for token in [
        "ReleaseWatchTupleContract",
        "WaveObservationPolicyContract",
        "ReleaseWatchPipelineCoordinator",
        "evaluateReleaseWatchPipeline",
        "createReleaseWatchPipelineSimulationHarness",
        "runReleaseWatchSimulation",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "derives deterministic watch tuple and policy hashes",
        "supersedes the active tuple when scope changes",
        "blocks widen and close when tuple drift makes the watch stale",
        "expires the observation window and blocks the policy when dwell proof stays incomplete",
        "arms rollback when a critical synthetic journey fails",
        "records deterministic timeline events for publish, evaluate, and close",
    ]:
        assert_contains(TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the release watch pipeline simulation harness")

    for marker in [
        "# 97 Wave Observation And Watch Tuple Pipeline",
        "# 97 Tuple Supersession And Drift Rules",
        "# 97 Wave Observation Probe And Trigger Model",
        "GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT",
        "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
    ]:
        combined_docs = (
            DESIGN_DOC_PATH.read_text(encoding="utf-8")
            + DRIFT_DOC_PATH.read_text(encoding="utf-8")
            + PROBE_DOC_PATH.read_text(encoding="utf-8")
        )
        if marker not in combined_docs:
            fail(f"Docs lost required marker: {marker}")

    for marker in [
        'data-testid="watch-masthead"',
        'data-testid="scenario-rail"',
        'data-testid="state-grid"',
        'data-testid="timeline-panel"',
        'data-testid="trigger-table"',
        'data-testid="eligibility-table"',
        'data-testid="inspector"',
        'data-testid="filter-environment"',
        'data-testid="filter-watch-state"',
        'data-testid="filter-action"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_contains(HTML_PATH, marker)

    for probe in [
        "environment and watch-state filtering",
        "scenario selection and inspector synchronization",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
        "accessibility landmarks",
        "accepted, satisfied, blocked, stale, and rollback-required states remain distinct",
    ]:
        assert_contains(SPEC_PATH, probe)

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-release-watch")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-release-watch")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-release-watch")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-release-watch")

    print("release watch pipeline validated")


if __name__ == "__main__":
    main()
