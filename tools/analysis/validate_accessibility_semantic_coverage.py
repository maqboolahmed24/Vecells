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
PACKAGE_DIR = ROOT / "packages" / "design-system"

ACCESSIBILITY_PATH = DATA_DIR / "accessibility_semantic_coverage_profiles.json"
FOCUS_CSV_PATH = DATA_DIR / "focus_transition_contract_matrix.csv"
KEYBOARD_CSV_PATH = DATA_DIR / "keyboard_interaction_contract_matrix.csv"
ANNOUNCEMENT_PATH = DATA_DIR / "assistive_announcement_examples.json"

DOC_HARNESS_PATH = DOCS_DIR / "111_accessibility_semantic_coverage_harness.md"
DOC_FOCUS_PATH = DOCS_DIR / "111_focus_management_and_announcement_law.md"
DOC_PARITY_PATH = DOCS_DIR / "111_visualization_parity_and_table_fallback_rules.md"
HARNESS_HTML_PATH = DOCS_DIR / "111_accessibility_harness.html"

BUILD_SCRIPT_PATH = ROOT / "tools" / "analysis" / "build_accessibility_semantic_coverage.ts"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_accessibility_semantic_coverage.py"
SOURCE_PATH = PACKAGE_DIR / "src" / "accessibility-harness.ts"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
HARNESS_TEST_PATH = PACKAGE_DIR / "tests" / "accessibility-harness.test.ts"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "accessibility-semantic-coverage.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_111 artifact: {path}")


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
        ACCESSIBILITY_PATH,
        FOCUS_CSV_PATH,
        KEYBOARD_CSV_PATH,
        ANNOUNCEMENT_PATH,
        DOC_HARNESS_PATH,
        DOC_FOCUS_PATH,
        DOC_PARITY_PATH,
        HARNESS_HTML_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        PUBLIC_API_TEST_PATH,
        HARNESS_TEST_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    accessibility = load_json(ACCESSIBILITY_PATH)
    announcements = load_json(ANNOUNCEMENT_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    focus_rows = load_csv_rows(FOCUS_CSV_PATH)
    keyboard_rows = load_csv_rows(KEYBOARD_CSV_PATH)

    if accessibility["task_id"] != "par_104":
        fail("Accessibility publication task_id must stay pinned to par_104.")
    if accessibility["summary"] != {
        "accessibility_profile_count": 19,
        "complete_count": 15,
        "degraded_count": 4,
        "blocked_count": 0,
    }:
        fail("Base accessibility summary drifted.")
    if accessibility["harness_task_id"] != "par_111":
        fail("Accessibility harness extension drifted off par_111.")
    if accessibility["harness_visual_mode"] != "Accessibility_Control_Deck":
        fail("Accessibility harness visual mode drifted.")
    if accessibility["harness_summary"] != {
        "route_profile_count": 19,
        "scenario_count": 6,
        "focus_transition_contract_count": 133,
        "keyboard_interaction_contract_count": 19,
        "exact_keyboard_contract_count": 12,
        "provisional_keyboard_contract_count": 6,
        "blocked_keyboard_contract_count": 1,
        "announcement_example_count": 14,
    }:
        fail(f"Harness summary drifted: {accessibility['harness_summary']}")
    if len(accessibility["accessibilitySemanticCoverageProfiles"]) != 19:
        fail("Accessibility profile count drifted.")
    if len(accessibility["focusTransitionContracts"]) != 133:
        fail("Focus transition contract count drifted.")
    if len(accessibility["keyboardInteractionContracts"]) != 19:
        fail("Keyboard interaction contract count drifted.")
    if len(accessibility["harnessScenarios"]) != 6:
        fail("Harness scenario count drifted.")
    if len(accessibility["prerequisite_gaps"]) != 1:
        fail("Expected one bounded prerequisite gap for par_110.")
    if accessibility["prerequisite_gaps"][0]["gapId"] != "PREREQUISITE_GAP_PAR_110_SHARED_POSTURE_SURFACES_V1":
        fail("Prerequisite gap id drifted.")
    if len(accessibility["gap_resolutions"]) != 5:
        fail("Gap resolution count drifted.")
    if len(accessibility["follow_on_dependencies"]) != 2:
        fail("Follow-on dependency count drifted.")

    if announcements["task_id"] != "par_111":
        fail("Announcement examples drifted off par_111.")
    if announcements["visual_mode"] != "Accessibility_Control_Deck":
        fail("Announcement visual mode drifted.")
    if announcements["summary"] != {
        "example_count": 14,
        "current_count": 6,
        "suppressed_count": 1,
        "deduplicated_count": 2,
        "superseded_count": 5,
    }:
        fail("Announcement summary drifted.")
    if len(announcements["assistiveAnnouncementExamples"]) != 14:
        fail("Announcement example count drifted.")

    if len(focus_rows) != 133:
        fail("Focus transition matrix row count drifted.")
    focus_triggers = {row["trigger"] for row in focus_rows}
    if focus_triggers != {
        "same_shell_refresh",
        "buffered_update",
        "mission_stack_fold",
        "mission_stack_unfold",
        "restore",
        "invalidation",
        "recovery_return",
    }:
        fail(f"Unexpected focus trigger coverage: {focus_triggers}")

    if len(keyboard_rows) != 19:
        fail("Keyboard interaction matrix row count drifted.")
    exact = sum(1 for row in keyboard_rows if row["contract_state"] == "exact")
    provisional = sum(1 for row in keyboard_rows if row["contract_state"] == "provisional")
    blocked = sum(1 for row in keyboard_rows if row["contract_state"] == "blocked")
    if (exact, provisional, blocked) != (12, 6, 1):
        fail("Keyboard contract-state distribution drifted.")

    if ROOT_SCRIPT_UPDATES["validate:accessibility-semantic-coverage"] != "python3 ./tools/analysis/validate_accessibility_semantic_coverage.py":
        fail("Root script updates lost validate:accessibility-semantic-coverage.")
    if "build_accessibility_semantic_coverage.ts" not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("Codegen script updates lost build_accessibility_semantic_coverage.ts.")

    if root_package["scripts"].get("validate:accessibility-semantic-coverage") != "python3 ./tools/analysis/validate_accessibility_semantic_coverage.py":
        fail("Root package lost validate:accessibility-semantic-coverage.")
    if "build_accessibility_semantic_coverage.ts" not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost build_accessibility_semantic_coverage.ts.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "accessibility-semantic-coverage.spec.js" not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package lost accessibility-semantic-coverage.spec.js from {script_name}.")

    assert_contains(SOURCE_PATH, 'export const ACCESSIBILITY_HARNESS_TASK_ID = "par_111"')
    assert_contains(SOURCE_PATH, "export function resolveFocusTransition(")
    assert_contains(SOURCE_PATH, "export function arbitrateAssistiveAnnouncements(")
    assert_contains(SOURCE_PATH, "export function evaluateVisualizationParity(")
    assert_contains(SOURCE_PATH, "export function buildAccessibilityHarnessArtifacts()")
    assert_contains(INDEX_PATH, 'from "./accessibility-harness";')
    assert_contains(PUBLIC_API_TEST_PATH, "accessibilityHarnessCatalog")
    assert_contains(HARNESS_TEST_PATH, "resolveFocusTransition")
    assert_contains(DOC_HARNESS_PATH, "Accessibility Semantic Coverage Harness")
    assert_contains(DOC_FOCUS_PATH, "Focus Management And Announcement Law")
    assert_contains(DOC_PARITY_PATH, "Visualization Parity And Table Fallback Rules")
    assert_contains(HARNESS_HTML_PATH, 'data-testid="scenario-rail"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="live-specimen-pane"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="verification-pane"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="focus-trail"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="keyboard-model-panel"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="transcript-panel"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="parity-panel"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="breakpoint-strip"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="motion-strip"')
    assert_contains(HARNESS_HTML_PATH, 'data-testid="zoom-strip"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "accessibilityHarnessCoverage")

    print("par_111 accessibility semantic coverage validation passed")


if __name__ == "__main__":
    main()
