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

STATUS_STRIP_MATRIX_PATH = DATA_DIR / "status_strip_state_matrix.csv"
CASE_PULSE_MATRIX_PATH = DATA_DIR / "case_pulse_axis_matrix.csv"
FRESHNESS_EXAMPLES_PATH = DATA_DIR / "freshness_envelope_examples.json"
GRAMMAR_MATRIX_PATH = DATA_DIR / "status_sentence_grammar_matrix.csv"

STATUS_COMPONENT_DOC_PATH = DOCS_DIR / "107_status_strip_case_pulse_and_freshness_chip.md"
STATUS_ARBITRATION_DOC_PATH = DOCS_DIR / "107_status_arbitration_and_freshness_law.md"
CASE_PULSE_DOC_PATH = DOCS_DIR / "107_case_pulse_axis_and_macrostate_mapping.md"
LAB_HTML_PATH = DOCS_DIR / "107_status_component_lab.html"

SOURCE_PATH = PACKAGE_DIR / "src" / "status-truth.tsx"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
FOUNDATION_CSS_PATH = PACKAGE_DIR / "src" / "foundation.css"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
STATUS_TEST_PATH = PACKAGE_DIR / "tests" / "status-truth.test.tsx"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_status_truth_components.py"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "status-truth-components.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_107 artifact: {path}")


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
        STATUS_STRIP_MATRIX_PATH,
        CASE_PULSE_MATRIX_PATH,
        FRESHNESS_EXAMPLES_PATH,
        GRAMMAR_MATRIX_PATH,
        STATUS_COMPONENT_DOC_PATH,
        STATUS_ARBITRATION_DOC_PATH,
        CASE_PULSE_DOC_PATH,
        LAB_HTML_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        FOUNDATION_CSS_PATH,
        PUBLIC_API_TEST_PATH,
        STATUS_TEST_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    freshness_examples = load_json(FRESHNESS_EXAMPLES_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    status_rows = load_csv(STATUS_STRIP_MATRIX_PATH)
    axis_rows = load_csv(CASE_PULSE_MATRIX_PATH)
    grammar_rows = load_csv(GRAMMAR_MATRIX_PATH)

    if freshness_examples["task_id"] != "par_107":
        fail("Freshness examples drifted off par_107.")
    if freshness_examples["visual_mode"] != "Status_Truth_Lab":
        fail("Status Truth visual mode drifted.")
    if freshness_examples["summary"] != {
        "example_count": 6,
        "integrated_strip_count": 4,
        "promoted_banner_count": 2,
    }:
        fail("Freshness example summary drifted.")
    if len(freshness_examples["gap_resolutions"]) < 3:
        fail("par_107 must publish at least 3 gap resolutions.")
    if len(freshness_examples["examples"]) != 6:
        fail("par_107 must publish 6 freshness examples.")

    if len(status_rows) != 8:
        fail("par_107 status strip state matrix must publish 8 scenario rows.")
    promoted_count = sum(1 for row in status_rows if row["strip_mode"] == "promoted_banner")
    if promoted_count != 2:
        fail("par_107 status strip matrix must publish exactly 2 promoted-banner rows.")

    if len(axis_rows) != 30:
        fail("par_107 case pulse axis matrix must publish 30 axis rows.")
    audiences = {row["audience_profile"] for row in axis_rows}
    if audiences != {"patient", "workspace", "hub", "operations", "governance", "pharmacy"}:
        fail("par_107 case pulse axis matrix lost one or more audience profiles.")
    axis_keys = {row["axis_key"] for row in axis_rows}
    if axis_keys != {"lifecycle", "ownership", "trust", "urgency", "interaction"}:
        fail("par_107 case pulse axis matrix lost required axis keys.")

    if len(grammar_rows) != 12:
        fail("par_107 status sentence grammar matrix must publish 12 grammar rows.")
    scenario_classes = {row["scenario_class"] for row in grammar_rows}
    if scenario_classes != {
        "local_ack",
        "processing_acceptance",
        "pending_external",
        "stale_review",
        "recovery_required",
        "authoritative_settlement",
    }:
        fail("par_107 grammar matrix lost required scenario classes.")

    if (
        ROOT_SCRIPT_UPDATES["validate:status-truth"]
        != "python3 ./tools/analysis/validate_status_truth_components.py"
    ):
        fail("Root script updates lost validate:status-truth.")
    if "pnpm validate:status-truth" not in ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root script updates bootstrap is missing validate:status-truth.")
    if "pnpm validate:status-truth" not in ROOT_SCRIPT_UPDATES["check"]:
        fail("Root script updates check is missing validate:status-truth.")

    if (
        root_package["scripts"].get("validate:status-truth")
        != "python3 ./tools/analysis/validate_status_truth_components.py"
    ):
        fail("Root package lost validate:status-truth.")
    if "pnpm validate:status-truth" not in root_package["scripts"]["bootstrap"]:
        fail("Root package bootstrap is missing validate:status-truth.")
    if "pnpm validate:status-truth" not in root_package["scripts"]["check"]:
        fail("Root package check is missing validate:status-truth.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "status-truth-components.spec.js" not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package lost status-truth-components.spec.js from {script_name}.")

    assert_contains(SOURCE_PATH, 'export const STATUS_TRUTH_TASK_ID = "par_107"')
    assert_contains(SOURCE_PATH, "export const StatusSentenceComposer = composeStatusSentence;")
    assert_contains(SOURCE_PATH, "export function SharedStatusStrip(")
    assert_contains(SOURCE_PATH, "export function CasePulse(")
    assert_contains(SOURCE_PATH, "export function StatusStripAuthorityInspector(")
    assert_contains(SOURCE_PATH, "export const statusTruthSpecimens = [")
    assert_contains(INDEX_PATH, 'from "./status-truth";')
    assert_contains(FOUNDATION_CSS_PATH, ".status-truth-strip")
    assert_contains(FOUNDATION_CSS_PATH, ".status-truth-case-pulse")
    assert_contains(PUBLIC_API_TEST_PATH, "STATUS_TRUTH_TASK_ID")
    assert_contains(PUBLIC_API_TEST_PATH, "statusTruthSpecimens")
    assert_contains(STATUS_TEST_PATH, "renders a patient-safe live region")
    assert_contains(LAB_HTML_PATH, 'data-testid="status-lab-masthead"')
    assert_contains(LAB_HTML_PATH, 'data-testid="morph-case-pulse"')
    assert_contains(LAB_HTML_PATH, 'data-testid="freshness-actionability-table"')
    assert_contains(LAB_HTML_PATH, 'data-testid="reduced-motion-equivalence"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "statusTruthComponentCoverage")

    print("par_107 status truth validation passed")


if __name__ == "__main__":
    main()
