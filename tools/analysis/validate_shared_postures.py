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
PACKAGE_DIR = ROOT / "packages" / "surface-postures"

JSON_PATH = DATA_DIR / "degraded_mode_examples.json"
STATE_MATRIX_PATH = DATA_DIR / "posture_state_matrix.csv"
COPY_MATRIX_PATH = DATA_DIR / "posture_copy_and_recovery_actions.csv"
VISIBILITY_MATRIX_PATH = DATA_DIR / "placeholder_visibility_matrix.csv"

LIBRARY_DOC_PATH = DOCS_DIR / "110_surface_posture_frame_library.md"
GRAMMAR_DOC_PATH = DOCS_DIR / "110_degraded_mode_and_placeholder_grammar.md"
PRECEDENCE_DOC_PATH = DOCS_DIR / "110_posture_state_precedence.md"
HTML_PATH = DOCS_DIR / "110_posture_gallery.html"

SOURCE_PATH = PACKAGE_DIR / "src" / "surface-postures.tsx"
INDEX_PATH = PACKAGE_DIR / "src" / "index.tsx"
CSS_PATH = PACKAGE_DIR / "src" / "surface-postures.css"
PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"
PUBLIC_API_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "surface-postures.test.tsx"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_shared_postures.py"
PLAYWRIGHT_SPEC_PATH = PLAYWRIGHT_DIR / "shared-postures.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
TSCONFIG_PATH = ROOT / "tsconfig.base.json"


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing required par_110 artifact: {path}")


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
        JSON_PATH,
        STATE_MATRIX_PATH,
        COPY_MATRIX_PATH,
        VISIBILITY_MATRIX_PATH,
        LIBRARY_DOC_PATH,
        GRAMMAR_DOC_PATH,
        PRECEDENCE_DOC_PATH,
        HTML_PATH,
        SOURCE_PATH,
        INDEX_PATH,
        CSS_PATH,
        PACKAGE_JSON_PATH,
        PUBLIC_API_TEST_PATH,
        PACKAGE_TEST_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_SPEC_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        TSCONFIG_PATH,
    ]:
        assert_exists(path)

    json_payload = load_json(JSON_PATH)
    state_rows = load_csv(STATE_MATRIX_PATH)
    copy_rows = load_csv(COPY_MATRIX_PATH)
    visibility_rows = load_csv(VISIBILITY_MATRIX_PATH)
    root_package = load_json(ROOT_PACKAGE_PATH)
    playwright_package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    tsconfig = load_json(TSCONFIG_PATH)

    if json_payload["task_id"] != "par_110":
        fail("Degraded mode examples drifted off par_110.")
    if json_payload["visual_mode"] != "Posture_Gallery":
        fail("Posture gallery visual mode drifted.")
    if json_payload["summary"] != {
        "example_count": 10,
        "posture_count": 10,
        "audience_count": 6,
        "preserved_anchor_count": 10,
        "dominant_action_count": 10,
        "comparison_profile_count": 3,
    }:
        fail("Posture gallery summary drifted.")
    if len(json_payload["examples"]) != 10:
        fail("par_110 must publish 10 posture examples.")
    if len(json_payload["posture_precedence"]) != 10:
        fail("par_110 must publish the full 10-step posture precedence ladder.")
    if len(json_payload["alias_mappings"]) != 5:
        fail("par_110 alias mappings drifted.")
    if len(json_payload["gap_resolutions"]) != 2:
        fail("par_110 gap resolution count drifted.")

    if len(state_rows) != 10:
        fail("par_110 posture state matrix must publish 10 rows.")
    if len(copy_rows) != 10:
        fail("par_110 posture copy matrix must publish 10 rows.")
    if len(visibility_rows) != 10:
        fail("par_110 placeholder visibility matrix must publish 10 rows.")

    expected_postures = {
        "loading_summary",
        "empty",
        "sparse",
        "partial_visibility",
        "stale_review",
        "blocked_recovery",
        "read_only",
        "placeholder_only",
        "calm_degraded",
        "bounded_recovery",
    }

    if {row["posture_class"] for row in state_rows} != expected_postures:
        fail("par_110 posture state matrix lost one or more posture classes.")
    if {row["posture_class"] for row in copy_rows} != expected_postures:
        fail("par_110 posture copy matrix lost one or more posture classes.")
    if {row["posture_class"] for row in visibility_rows} != expected_postures:
        fail("par_110 visibility matrix lost one or more posture classes.")

    if ROOT_SCRIPT_UPDATES.get("validate:shared-postures") != "python3 ./tools/analysis/validate_shared_postures.py":
        fail("Root script updates lost validate:shared-postures.")
    if "pnpm validate:shared-postures" not in ROOT_SCRIPT_UPDATES["bootstrap"]:
        fail("Root script updates bootstrap is missing validate:shared-postures.")
    if "pnpm validate:shared-postures" not in ROOT_SCRIPT_UPDATES["check"]:
        fail("Root script updates check is missing validate:shared-postures.")

    if root_package["scripts"].get("validate:shared-postures") != "python3 ./tools/analysis/validate_shared_postures.py":
        fail("Root package lost validate:shared-postures.")
    if "pnpm validate:shared-postures" not in root_package["scripts"]["bootstrap"]:
        fail("Root package bootstrap is missing validate:shared-postures.")
    if "pnpm validate:shared-postures" not in root_package["scripts"]["check"]:
        fail("Root package check is missing validate:shared-postures.")

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if "shared-postures.spec.js" not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package lost shared-postures.spec.js from {script_name}.")

    paths = tsconfig["compilerOptions"]["paths"]
    if paths.get("@vecells/surface-postures") != ["packages/surface-postures/src/index.tsx"]:
        fail("tsconfig.base.json lost @vecells/surface-postures path alias.")
    if paths.get("@vecells/surface-postures/surface-postures.css") != ["packages/surface-postures/src/surface-postures.css"]:
        fail("tsconfig.base.json lost @vecells/surface-postures/surface-postures.css path alias.")

    assert_contains(SOURCE_PATH, 'export const SURFACE_POSTURES_TASK_ID = "par_110"')
    assert_contains(SOURCE_PATH, "export function SurfacePostureFrame(")
    assert_contains(SOURCE_PATH, "export function SurfaceStateFrame(")
    assert_contains(SOURCE_PATH, "export function LoadingSummaryFrame(")
    assert_contains(SOURCE_PATH, "export function EmptyStateFrame(")
    assert_contains(SOURCE_PATH, "export function SparseStateFrame(")
    assert_contains(SOURCE_PATH, "export function PartialVisibilityFrame(")
    assert_contains(SOURCE_PATH, "export function StaleReviewFrame(")
    assert_contains(SOURCE_PATH, "export function BlockedRecoveryFrame(")
    assert_contains(SOURCE_PATH, "export function ReadOnlyFrame(")
    assert_contains(SOURCE_PATH, "export function PlaceholderOnlyFrame(")
    assert_contains(SOURCE_PATH, 'data-posture-class={resolution.postureClass}')
    assert_contains(INDEX_PATH, 'from "./surface-postures";')
    assert_contains(CSS_PATH, ".surface-posture-frame")
    assert_contains(CSS_PATH, ".surface-posture-placeholder")
    assert_contains(PUBLIC_API_TEST_PATH, "SURFACE_POSTURES_TASK_ID")
    assert_contains(PACKAGE_TEST_PATH, "keeps the preserved anchor visible")
    assert_contains(LIBRARY_DOC_PATH, "```mermaid")
    assert_contains(GRAMMAR_DOC_PATH, "```mermaid")
    assert_contains(PRECEDENCE_DOC_PATH, "```mermaid")
    assert_contains(HTML_PATH, 'data-testid="posture-stage"')
    assert_contains(HTML_PATH, 'data-testid="posture-inspector"')
    assert_contains(HTML_PATH, 'data-testid="comparison-strip"')
    assert_contains(HTML_PATH, 'data-testid="reduced-motion-equivalence"')
    assert_contains(PLAYWRIGHT_SPEC_PATH, "sharedPostureCoverage")

    print("par_110 shared posture validation passed")


if __name__ == "__main__":
    main()
