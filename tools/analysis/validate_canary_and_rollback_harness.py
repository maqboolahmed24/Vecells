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
TOOLS_DIR = ROOT / "tools" / "runtime-canary-rollback"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

CATALOG_PATH = DATA_DIR / "canary_scenario_catalog.json"
PREVIEW_SCHEMA_PATH = DATA_DIR / "wave_action_preview_schema.json"
SETTLEMENT_SCHEMA_PATH = DATA_DIR / "wave_action_settlement_schema.json"
GUARDRAIL_MATRIX_PATH = DATA_DIR / "canary_guardrail_matrix.csv"

DESIGN_DOC_PATH = DOCS_DIR / "102_non_production_canary_and_rollback_harness.md"
RULES_DOC_PATH = DOCS_DIR / "102_wave_action_rehearsal_and_rollback_rules.md"
HTML_PATH = DOCS_DIR / "102_canary_and_rollback_cockpit.html"
SPEC_PATH = TESTS_DIR / "canary-and-rollback-cockpit.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PARALLEL_GATE_PATH = ROOT / "tools" / "analysis" / "build_parallel_foundation_tracks_gate.py"
INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
SOURCE_PATH = RELEASE_CONTROLS_DIR / "src" / "canary-rollback-harness.ts"
TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "canary-rollback-harness.test.ts"
PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
SHARED_SCRIPT_PATH = TOOLS_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_DIR / "run-canary-rollback-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_DIR / "verify-canary-rollback.ts"
WORKFLOW_CI_PATH = ROOT / ".github" / "workflows" / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = ROOT / ".github" / "workflows" / "nonprod-provenance-promotion.yml"

REQUIRED_SCENARIOS = {
    "LOCAL_CANARY_START_HAPPY_PATH",
    "LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION",
    "CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL",
    "INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH",
    "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    "LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_102 artifact: {path}")


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
        PREVIEW_SCHEMA_PATH,
        SETTLEMENT_SCHEMA_PATH,
        GUARDRAIL_MATRIX_PATH,
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
    preview_schema = load_json(PREVIEW_SCHEMA_PATH)
    settlement_schema = load_json(SETTLEMENT_SCHEMA_PATH)
    guardrail_rows = load_csv(GUARDRAIL_MATRIX_PATH)

    if catalog["task_id"] != "par_102":
        fail("Canary catalog drifted off par_102.")
    if catalog["visual_mode"] != "Canary_And_Rollback_Cockpit":
        fail("Canary cockpit mode drifted.")
    if preview_schema["title"] != "WaveActionImpactPreview":
        fail("Wave action preview schema title drifted.")
    if settlement_schema["title"] != "WaveActionSettlement":
        fail("Wave action settlement schema title drifted.")

    records = catalog["records"]
    summary = catalog["summary"]
    if summary["scenario_count"] != len(records):
        fail("scenario_count drifted from canary records.")
    if summary["history_row_count"] != len(catalog["history_rows"]):
        fail("history_row_count drifted from canary history rows.")
    if len(guardrail_rows) != len(records):
        fail("Guardrail matrix row count drifted from canary records.")

    scenario_ids = {row["scenarioId"] for row in records}
    if scenario_ids != REQUIRED_SCENARIOS:
        fail(f"Unexpected canary scenario set: {sorted(scenario_ids)}")

    action_types = {row["actionType"] for row in records}
    if action_types != {
        "canary_start",
        "widen",
        "pause",
        "rollback",
        "rollforward",
        "kill_switch",
    }:
        fail(f"Unexpected canary action types: {sorted(action_types)}")

    environment_rings = {row["environmentRing"] for row in records}
    required_rings = {"local", "ci-preview", "integration", "preprod"}
    if not required_rings.issubset(environment_rings):
        fail(f"Missing required canary ring examples: {sorted(required_rings - environment_rings)}")

    accepted = next(
        row for row in records if row["scenarioId"] == "LOCAL_CANARY_START_HAPPY_PATH"
    )
    if accepted["settlement"]["settlementState"] != "accepted_pending_observation":
        fail("Happy-path canary start lost accepted-pending-observation settlement.")
    if accepted["settlement"]["cockpitState"] != "accepted":
        fail("Happy-path canary start lost accepted cockpit state.")

    widen = next(
        row for row in records if row["scenarioId"] == "LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION"
    )
    if widen["settlement"]["settlementState"] != "satisfied":
        fail("Widen scenario lost satisfied settlement.")

    pause = next(
        row for row in records if row["scenarioId"] == "CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL"
    )
    if pause["guardrailSnapshot"]["guardrailState"] != "constrained":
        fail("Pause scenario lost constrained guardrail.")
    if pause["settlement"]["settlementState"] != "constrained":
        fail("Pause scenario lost constrained settlement.")

    rollback = next(
        row for row in records if row["scenarioId"] == "INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH"
    )
    if rollback["impactPreview"]["previewState"] != "preview":
        fail("Rollback scenario lost executable preview posture.")
    if rollback["executionReceipt"]["executionState"] != "accepted":
        fail("Rollback scenario is not accepted for rehearsal execution.")
    if rollback["settlement"]["settlementState"] != "rollback_required":
        fail("Rollback scenario lost rollback-required settlement.")
    if rollback["context"]["rollbackTargetPublicationBundleRef"] is None:
        fail("Rollback scenario lost explicit rollback target publication bundle.")

    kill_switch = next(
        row
        for row in records
        if row["scenarioId"] == "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE"
    )
    if kill_switch["guardrailSnapshot"]["guardrailState"] != "frozen":
        fail("Kill-switch scenario lost frozen guardrail posture.")
    if kill_switch["settlement"]["settlementState"] != "constrained":
        fail("Kill-switch scenario lost constrained settlement.")

    rollforward = next(
        row
        for row in records
        if row["scenarioId"] == "LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE"
    )
    superseded = rollforward["supersededImpactPreview"]
    if not superseded or superseded["previewState"] != "superseded":
        fail("Rollforward scenario lost superseded predecessor preview.")

    scripts = load_json(ROOT_PACKAGE_PATH)["scripts"]
    for name in [
        "validate:canary-rollback",
        "ci:rehearse-canary-rollback",
        "ci:verify-canary-rollback",
    ]:
        if scripts.get(name) != ROOT_SCRIPT_UPDATES[name]:
            fail(f"Root script drifted for {name}.")
    if "build_canary_and_rollback_harness.py" not in scripts["codegen"]:
        fail("Root codegen script is missing par_102 builder.")
    if "validate:canary-rollback" not in scripts["bootstrap"]:
        fail("Root bootstrap script is missing validate:canary-rollback.")
    if "validate:canary-rollback" not in scripts["check"]:
        fail("Root check script is missing validate:canary-rollback.")

    playwright_scripts = load_json(PLAYWRIGHT_PACKAGE_PATH)["scripts"]
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "canary-and-rollback-cockpit.spec.js" not in playwright_scripts[script_name]:
            fail(f"Playwright {script_name} script is missing par_102 spec.")

    for token in [
        "validate:canary-rollback",
        "ci:rehearse-canary-rollback",
        "ci:verify-canary-rollback",
        "build_canary_and_rollback_harness.py",
    ]:
        assert_contains(ROOT_SCRIPT_UPDATES_PATH, token)

    assert_contains(PARALLEL_GATE_PATH, "canary-and-rollback-cockpit.spec.js")
    assert_contains(INDEX_PATH, 'export * from "./canary-rollback-harness";')
    for token in [
        "WaveActionImpactPreview",
        "WaveActionExecutionReceipt",
        "WaveActionSettlement",
        "ReleaseWatchEvidenceCockpit",
        "CanaryRollbackHarnessCoordinator",
        "createCanaryRollbackSimulationHarness",
        "runCanaryRollbackSimulation",
        "ACTION_ROLLBACK_NOT_ARMED",
        "ACTION_REQUIRES_SUPERSEDING_TUPLE",
    ]:
        assert_contains(SOURCE_PATH, token)

    for token in [
        "creates a wave-action impact preview bound to watch tuple, readiness snapshot, and rollback evidence",
        "accepts rollback when guardrail failures arm the action and rollback evidence is bound",
        "accepts kill-switch when severe trust or parity failure freezes the guardrail",
        "forces rollforward to supersede the old tuple before settling satisfied",
    ]:
        assert_contains(TEST_PATH, token)
    assert_contains(PUBLIC_API_TEST_PATH, "runs the canary and rollback simulation harness")

    combined_docs = (
        DESIGN_DOC_PATH.read_text(encoding="utf-8")
        + RULES_DOC_PATH.read_text(encoding="utf-8")
    )
    for marker in [
        "# 102 Non-Production Canary And Rollback Harness",
        "# 102 Wave Action Rehearsal And Rollback Rules",
        "GAP_RESOLUTION_CANARY_RING_NONPROD",
        "GAP_RECOVERY_DISPOSITION_READ_ONLY_OR_RECOVERY_ONLY",
        "FOLLOW_ON_DEPENDENCY_WAVE_GOVERNANCE_APPROVALS",
    ]:
        if marker not in combined_docs:
            fail(f"Docs lost required marker: {marker}")

    for marker in [
        'data-testid="canary-masthead"',
        'data-testid="scenario-rail"',
        'data-testid="state-grid"',
        'data-testid="history-panel"',
        'data-testid="guardrail-table"',
        'data-testid="audit-panel"',
        'data-testid="inspector"',
        'data-testid="filter-environment"',
        'data-testid="filter-action"',
        'data-testid="filter-cockpit-state"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_contains(HTML_PATH, marker)

    for probe in [
        "environment, action, and cockpit-state filtering",
        "scenario selection and inspector synchronization",
        "keyboard navigation",
        "reduced motion",
        "responsive layout",
        "accessibility landmarks",
        "preview, accepted, observed, satisfied, constrained, rollback-required, and superseded states remain distinct",
    ]:
        assert_contains(SPEC_PATH, probe)

    assert_contains(WORKFLOW_CI_PATH, "ci:rehearse-canary-rollback")
    assert_contains(WORKFLOW_CI_PATH, "ci:verify-canary-rollback")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:rehearse-canary-rollback")
    assert_contains(WORKFLOW_PROMOTION_PATH, "ci:verify-canary-rollback")

    print("canary and rollback harness validated")


if __name__ == "__main__":
    main()
