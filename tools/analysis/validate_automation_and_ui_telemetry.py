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
PACKAGE_DIR = ROOT / "packages" / "persistent-shell"

PROFILES_PATH = DATA_DIR / "automation_anchor_profile_examples.json"
MATRIX_PATH = DATA_DIR / "automation_anchor_matrix.csv"
VOCABULARY_PATH = DATA_DIR / "ui_telemetry_vocabulary.json"
ENVELOPES_PATH = DATA_DIR / "ui_event_envelope_examples.json"

DOC_VOCAB_PATH = DOCS_DIR / "114_automation_anchor_and_ui_telemetry_vocab.md"
DOC_RULES_PATH = DOCS_DIR / "114_dom_marker_and_event_envelope_rules.md"
CONSOLE_PATH = DOCS_DIR / "114_ui_telemetry_diagnostics_console.html"

BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_automation_anchor_ui_telemetry.ts"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_automation_and_ui_telemetry.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

SOURCE_PATH = PACKAGE_DIR / "src" / "automation-telemetry.ts"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
UNIT_TEST_PATH = PACKAGE_DIR / "tests" / "automation-telemetry.test.ts"
HELPER_PATH = PLAYWRIGHT_DIR / "automation-anchor-ui-telemetry.helpers.js"
SPEC_PATH = PLAYWRIGHT_DIR / "automation-anchor-ui-telemetry.spec.js"

EXPECTED_PROFILE_SUMMARY = {
    "route_profile_count": 19,
    "exact_profile_count": 15,
    "provisional_profile_count": 4,
    "marker_class_count": 9,
    "scenario_count": 6,
    "source_surface_count": 5,
    "matrix_row_count": 171,
}
EXPECTED_VOCABULARY_SUMMARY = {
    "route_profile_count": 19,
    "event_binding_count": 133,
    "unique_event_class_count": 7,
    "contract_binding_count": 76,
    "supplemental_binding_count": 57,
    "disclosure_safe_count": 133,
    "redaction_rule_count": 6,
}
EXPECTED_ENVELOPE_SUMMARY = {
    "example_count": 24,
    "scenario_count": 6,
    "redacted_example_count": 24,
    "total_redacted_field_count": 24,
    "recovery_event_count": 2,
    "visibility_downgrade_event_count": 2,
}
EXPECTED_SCENARIO_IDS = [
    "SCN_SHELL_GALLERY_PATIENT_HOME",
    "SCN_STATUS_LAB_WORKSPACE_REVIEW",
    "SCN_POSTURE_GALLERY_OPERATIONS_RECOVERY",
    "SCN_ROUTE_GUARD_PATIENT_REQUESTS",
    "SCN_ROUTE_GUARD_SUPPORT_BLOCKED",
    "SCN_PATIENT_SEED_SURROGATE_HOME",
]
EXPECTED_EVENT_CLASSES = {
    "artifact_mode_changed",
    "dominant_action_changed",
    "recovery_posture_changed",
    "selected_anchor_changed",
    "state_summary_changed",
    "surface_enter",
    "visibility_freshness_downgrade",
}
EXPECTED_MARKER_CLASSES = {
    "artifact_posture",
    "dominant_action",
    "focus_restore",
    "landmark",
    "recovery_posture",
    "route_shell_posture",
    "selected_anchor",
    "state_summary",
    "visualization_authority",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_114 artifact: {path}")


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def load_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        PROFILES_PATH,
        MATRIX_PATH,
        VOCABULARY_PATH,
        ENVELOPES_PATH,
        DOC_VOCAB_PATH,
        DOC_RULES_PATH,
        CONSOLE_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        PUBLIC_API_TEST_PATH,
        UNIT_TEST_PATH,
        HELPER_PATH,
        SPEC_PATH,
    ]:
        assert_exists(path)

    profiles = load_json(PROFILES_PATH)
    vocabulary = load_json(VOCABULARY_PATH)
    envelopes = load_json(ENVELOPES_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    matrix_rows = load_csv_rows(MATRIX_PATH)

    if profiles["task_id"] != "par_114":
        fail("Automation anchor profiles drifted off par_114.")
    if vocabulary["task_id"] != "par_114":
        fail("UI telemetry vocabulary drifted off par_114.")
    if envelopes["task_id"] != "par_114":
        fail("UI event envelopes drifted off par_114.")

    for artifact_name, artifact in [
        ("automation anchor profiles", profiles),
        ("ui telemetry vocabulary", vocabulary),
        ("ui event envelopes", envelopes),
    ]:
        if artifact["visual_mode"] != "UI_Telemetry_Console":
            fail(f"{artifact_name} drifted away from UI_Telemetry_Console.")

    if profiles["summary"] != EXPECTED_PROFILE_SUMMARY:
        fail(f"Automation profile summary drifted: {profiles['summary']}")
    if vocabulary["summary"] != EXPECTED_VOCABULARY_SUMMARY:
        fail(f"UI telemetry vocabulary summary drifted: {vocabulary['summary']}")
    if envelopes["summary"] != EXPECTED_ENVELOPE_SUMMARY:
        fail(f"UI event envelope summary drifted: {envelopes['summary']}")

    if len(profiles["routeProfiles"]) != EXPECTED_PROFILE_SUMMARY["route_profile_count"]:
        fail("Route profile count drifted.")
    if len(profiles["diagnosticScenarios"]) != EXPECTED_PROFILE_SUMMARY["scenario_count"]:
        fail("Diagnostics scenario count drifted.")
    if len(profiles["gap_resolutions"]) != 7:
        fail("Gap-resolution count drifted.")
    if len(profiles["assumptions"]) != 1:
        fail("Disclosure assumption count drifted.")
    if len(profiles["follow_on_dependencies"]) != 2:
        fail("Follow-on dependency count drifted.")

    scenario_ids = [scenario["scenarioId"] for scenario in profiles["diagnosticScenarios"]]
    if scenario_ids != EXPECTED_SCENARIO_IDS:
        fail(f"Scenario ID coverage drifted: {scenario_ids}")

    if len(vocabulary["vocabularyEntries"]) != EXPECTED_VOCABULARY_SUMMARY["event_binding_count"]:
        fail("UI telemetry vocabulary entry count drifted.")
    if len(vocabulary["redactionRules"]) != EXPECTED_VOCABULARY_SUMMARY["redaction_rule_count"]:
        fail("Redaction rule count drifted.")
    if len(vocabulary["assumptions"]) != 1:
        fail("Vocabulary disclosure assumption count drifted.")
    if {entry["eventClass"] for entry in vocabulary["vocabularyEntries"]} != EXPECTED_EVENT_CLASSES:
        fail("Event-class vocabulary drifted.")

    if len(envelopes["eventEnvelopes"]) != EXPECTED_ENVELOPE_SUMMARY["example_count"]:
        fail("Event envelope example count drifted.")
    if sorted({entry["scenarioId"] for entry in envelopes["eventEnvelopes"]}) != sorted(
        EXPECTED_SCENARIO_IDS
    ):
        fail("Envelope scenario coverage drifted.")

    if len(matrix_rows) != EXPECTED_PROFILE_SUMMARY["matrix_row_count"]:
        fail("Automation anchor matrix row count drifted.")
    if {row["marker_class"] for row in matrix_rows} != EXPECTED_MARKER_CLASSES:
        fail("Automation marker-class coverage drifted.")
    contract_state_counts = {
        state: sum(1 for row in matrix_rows if row["contract_state"] == state)
        for state in sorted({row["contract_state"] for row in matrix_rows})
    }
    if contract_state_counts != {"exact": 135, "provisional": 36}:
        fail(f"Automation anchor matrix contract-state distribution drifted: {contract_state_counts}")

    if (
        ROOT_SCRIPT_UPDATES["validate:automation-ui-telemetry"]
        != "python3 ./tools/analysis/validate_automation_and_ui_telemetry.py"
    ):
        fail("Root script updates lost validate:automation-ui-telemetry.")
    if "build_automation_anchor_ui_telemetry.ts" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Root script updates codegen lost build_automation_anchor_ui_telemetry.ts.")
    if "pnpm validate:automation-ui-telemetry" not in ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root script updates bootstrap is missing validate:automation-ui-telemetry.")
    if "pnpm validate:automation-ui-telemetry" not in ROOT_SCRIPT_UPDATES["check"]:
        fail("Root script updates check is missing validate:automation-ui-telemetry.")

    root_scripts = root_package["scripts"]
    if (
        root_scripts.get("validate:automation-ui-telemetry")
        != ROOT_SCRIPT_UPDATES["validate:automation-ui-telemetry"]
    ):
        fail("Root package lost validate:automation-ui-telemetry.")
    if root_scripts["bootstrap"] != ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root package bootstrap drifted from root_script_updates.py.")
    if root_scripts["check"] != ROOT_SCRIPT_UPDATES["check"]:
        fail("Root package check drifted from root_script_updates.py.")
    if root_scripts["codegen"] != ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Root package codegen drifted from root_script_updates.py.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "automation-anchor-ui-telemetry.spec.js" not in playwright_package["scripts"][script_name]:
            fail(
                f"Playwright package lost automation-anchor-ui-telemetry.spec.js from {script_name}."
            )

    assert_contains(SOURCE_PATH, 'export const AUTOMATION_TELEMETRY_TASK_ID = "par_114"')
    assert_contains(SOURCE_PATH, 'export const AUTOMATION_TELEMETRY_VISUAL_MODE = "UI_Telemetry_Console"')
    assert_contains(SOURCE_PATH, "export function resolveAutomationAnchorProfile(")
    assert_contains(SOURCE_PATH, "export function resolveSharedMarkerSelector(")
    assert_contains(SOURCE_PATH, "export function buildAutomationSurfaceAttributes(")
    assert_contains(SOURCE_PATH, "export function buildAutomationAnchorElementAttributes(")
    assert_contains(SOURCE_PATH, "export function filterPhiSafeDisclosure(")
    assert_contains(SOURCE_PATH, "export function createUiTelemetryEnvelope(")
    assert_contains(SOURCE_PATH, "export function buildAutomationAndUiTelemetryArtifacts()")
    assert_contains(SOURCE_PATH, "export const automationTelemetryCatalog = {")

    assert_contains(INDEX_PATH, 'from "./automation-telemetry";')
    assert_contains(PUBLIC_API_TEST_PATH, "automationTelemetryCatalog")
    assert_contains(UNIT_TEST_PATH, "createUiTelemetryEnvelope")
    assert_contains(UNIT_TEST_PATH, "buildAutomationAndUiTelemetryArtifacts")
    assert_contains(DOC_VOCAB_PATH, "Automation Anchor And UI Telemetry Vocabulary")
    assert_contains(DOC_RULES_PATH, "DOM Marker And Event Envelope Rules")
    assert_contains(CONSOLE_PATH, 'data-testid="ui-telemetry-console"')
    assert_contains(CONSOLE_PATH, 'data-testid="scenario-rail"')
    assert_contains(CONSOLE_PATH, 'data-testid="shell-filter"')
    assert_contains(CONSOLE_PATH, 'data-testid="route-filter"')
    assert_contains(CONSOLE_PATH, 'data-testid="scenario-list"')
    assert_contains(CONSOLE_PATH, 'data-testid="specimen-pane"')
    assert_contains(CONSOLE_PATH, 'data-testid="specimen-surface"')
    assert_contains(CONSOLE_PATH, 'data-testid="selected-anchor-tuple"')
    assert_contains(CONSOLE_PATH, 'data-testid="focus-restore-state"')
    assert_contains(CONSOLE_PATH, 'data-testid="marker-tree"')
    assert_contains(CONSOLE_PATH, 'data-testid="recent-events"')
    assert_contains(CONSOLE_PATH, 'data-testid="event-timeline"')
    assert_contains(CONSOLE_PATH, 'data-testid="timeline-stream"')
    assert_contains(CONSOLE_PATH, 'data-testid="marker-overlay-toggle"')
    assert_contains(CONSOLE_PATH, 'data-testid="reduced-motion-toggle"')
    assert_contains(CONSOLE_PATH, 'data-testid="selected-anchor-node"')
    assert_contains(CONSOLE_PATH, 'data-testid="dominant-action-node"')
    assert_contains(CONSOLE_PATH, 'data-testid="artifact-posture-node"')
    assert_contains(CONSOLE_PATH, 'data-testid="recovery-posture-node"')
    assert_contains(CONSOLE_PATH, 'data-testid="visualization-authority-node"')
    assert_contains(CONSOLE_PATH, 'data-testid="focus-restore-node"')

    assert_contains(HELPER_PATH, "export function resolveSharedMarkerSelector(")
    assert_contains(HELPER_PATH, "export async function assertSharedMarker(")
    assert_contains(HELPER_PATH, "export function eventCodesForScenario(")
    assert_contains(HELPER_PATH, "export function findEnvelope(")

    assert_contains(SPEC_PATH, "automationAnchorUiTelemetryCoverage")
    assert_contains(SPEC_PATH, "assertSharedMarker")
    assert_contains(SPEC_PATH, "marker overlay labels expose shared refs")
    assert_contains(SPEC_PATH, "Expected no external requests")

    print("par_114 automation anchor and ui telemetry validation passed")


if __name__ == "__main__":
    main()
