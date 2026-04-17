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

MODE_EXAMPLES_PATH = DATA_DIR / "artifact_mode_truth_examples.json"
PARITY_DIGEST_PATH = DATA_DIR / "artifact_parity_digest_examples.json"
BINDING_MATRIX_PATH = DATA_DIR / "artifact_surface_binding_matrix.csv"
GRANT_MATRIX_PATH = DATA_DIR / "outbound_navigation_grant_matrix.csv"

PRESENTATION_DOC_PATH = DOCS_DIR / "109_artifact_presentation_shell.md"
MODE_RULES_DOC_PATH = DOCS_DIR / "109_artifact_mode_truth_and_handoff_rules.md"
PARITY_DOC_PATH = DOCS_DIR / "109_artifact_parity_and_return_safety.md"
STUDIO_HTML_PATH = DOCS_DIR / "109_artifact_studio.html"

SOURCE_PATH = PACKAGE_DIR / "src" / "artifact-shell.tsx"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
FOUNDATION_CSS_PATH = PACKAGE_DIR / "src" / "foundation.css"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
ARTIFACT_TEST_PATH = PACKAGE_DIR / "tests" / "artifact-shell.test.tsx"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_artifact_presentation_shell.py"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "artifact-presentation-shell.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_109 artifact: {path}")


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
        MODE_EXAMPLES_PATH,
        PARITY_DIGEST_PATH,
        BINDING_MATRIX_PATH,
        GRANT_MATRIX_PATH,
        PRESENTATION_DOC_PATH,
        MODE_RULES_DOC_PATH,
        PARITY_DOC_PATH,
        STUDIO_HTML_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        FOUNDATION_CSS_PATH,
        PUBLIC_API_TEST_PATH,
        ARTIFACT_TEST_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
    ]:
        assert_exists(path)

    mode_examples = load_json(MODE_EXAMPLES_PATH)
    parity_digests = load_json(PARITY_DIGEST_PATH)
    binding_rows = load_csv(BINDING_MATRIX_PATH)
    grant_rows = load_csv(GRANT_MATRIX_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)

    if mode_examples["task_id"] != "par_109":
        fail("Artifact mode examples drifted off par_109.")
    if mode_examples["visual_mode"] != "Artifact_Studio":
        fail("Artifact studio visual mode drifted.")
    if mode_examples["summary"] != {
        "example_count": 6,
        "preview_mode_count": 2,
        "summary_mode_count": 2,
        "placeholder_mode_count": 1,
        "recovery_mode_count": 1,
    }:
        fail("Artifact mode example summary drifted.")
    if len(mode_examples["gap_resolutions"]) < 3:
        fail("par_109 must publish at least 3 artifact gap resolutions.")
    if len(mode_examples["follow_on_dependencies"]) < 2:
        fail("par_109 must publish at least 2 follow-on dependencies.")
    if len(mode_examples["examples"]) != 6:
        fail("par_109 must publish 6 artifact mode examples.")

    if parity_digests["summary"] != {
        "digest_count": 4,
        "verified_count": 3,
        "provisional_count": 1,
        "source_only_count": 0,
        "recovery_only_count": 0,
    }:
        fail("Artifact parity digest summary drifted.")

    if len(binding_rows) != 6:
        fail("Artifact surface binding matrix must publish 6 rows.")
    if len(grant_rows) != 6:
        fail("Outbound navigation grant matrix must publish 6 rows.")

    current_modes = {row["current_mode"] for row in binding_rows}
    if current_modes != {
        "governed_preview",
        "structured_summary",
        "recovery_only",
        "placeholder_only",
    }:
        fail("Artifact binding matrix lost one or more required current modes.")

    grant_states = {row["grant_state"] for row in grant_rows}
    if grant_states != {"active", "expired"}:
        fail("Grant matrix should currently exercise active and expired grants.")

    if (
        ROOT_SCRIPT_UPDATES["validate:artifact-shell"]
        != "python3 ./tools/analysis/validate_artifact_presentation_shell.py"
    ):
        fail("Root script updates lost validate:artifact-shell.")
    if "pnpm validate:artifact-shell" not in ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root script updates bootstrap is missing validate:artifact-shell.")
    if "pnpm validate:artifact-shell" not in ROOT_SCRIPT_UPDATES["check"]:
        fail("Root script updates check is missing validate:artifact-shell.")

    if (
        root_package["scripts"].get("validate:artifact-shell")
        != "python3 ./tools/analysis/validate_artifact_presentation_shell.py"
    ):
        fail("Root package lost validate:artifact-shell.")
    if "pnpm validate:artifact-shell" not in root_package["scripts"]["bootstrap"]:
        fail("Root package bootstrap is missing validate:artifact-shell.")
    if "pnpm validate:artifact-shell" not in root_package["scripts"]["check"]:
        fail("Root package check is missing validate:artifact-shell.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "artifact-presentation-shell.spec.js" not in playwright_package["scripts"][script_name]:
            fail(
                f"Playwright package lost artifact-presentation-shell.spec.js from {script_name}."
            )

    assert_contains(SOURCE_PATH, 'export const ARTIFACT_SHELL_TASK_ID = "par_109"')
    assert_contains(SOURCE_PATH, "export function resolveArtifactModeTruth(")
    assert_contains(SOURCE_PATH, "export function ArtifactSurfaceFrame(")
    assert_contains(SOURCE_PATH, "export function ArtifactStage(")
    assert_contains(SOURCE_PATH, "export const artifactShellSpecimens = [")
    assert_contains(INDEX_PATH, 'from "./artifact-shell";')
    assert_contains(FOUNDATION_CSS_PATH, ".artifact-shell-frame")
    assert_contains(FOUNDATION_CSS_PATH, ".artifact-shell-timeline")
    assert_contains(PUBLIC_API_TEST_PATH, "ARTIFACT_SHELL_TASK_ID")
    assert_contains(PUBLIC_API_TEST_PATH, "artifactShellSpecimens")
    assert_contains(
        ARTIFACT_TEST_PATH,
        "fails closed to same-shell summary when the channel is embedded",
    )
    assert_contains(STUDIO_HTML_PATH, 'data-testid="artifact-studio-masthead"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="artifact-mode-selector"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="artifact-stage-shell"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="artifact-transfer-strip"')
    assert_contains(STUDIO_HTML_PATH, 'data-testid="artifact-mode-diagram"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "artifactPresentationShellCoverage")
    assert_contains(PRESENTATION_DOC_PATH, "ArtifactSurfaceFrame")
    assert_contains(MODE_RULES_DOC_PATH, "ArtifactModeTruthProjection")
    assert_contains(PARITY_DOC_PATH, "Outbound navigation and return safety")

    print("par_109 artifact presentation shell validation passed")


if __name__ == "__main__":
    main()
