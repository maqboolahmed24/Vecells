#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_DIR = ROOT / "docs" / "tests"
DATA_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

SUITE_DOC_PATH = DOCS_DIR / "136_shell_accessibility_preview_smoke_suite.md"
PREVIEW_MATRIX_DOC_PATH = DOCS_DIR / "136_preview_environment_shell_matrix.md"
ACCESSIBILITY_MATRIX_DOC_PATH = DOCS_DIR / "136_accessibility_semantic_coverage_matrix.md"
ATLAS_PATH = DOCS_DIR / "136_shell_conformance_atlas.html"

PREVIEW_CASES_PATH = DATA_DIR / "136_preview_shell_cases.csv"
ACCESSIBILITY_CASES_PATH = DATA_DIR / "136_accessibility_cases.csv"
SMOKE_EXPECTATIONS_PATH = DATA_DIR / "136_shell_smoke_expectations.json"
SUITE_RESULTS_PATH = DATA_DIR / "136_preview_environment_suite_results.json"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
SPEC_PATH = PLAYWRIGHT_DIR / "136_shell_accessibility_preview_smoke.spec.js"
NODE_SMOKE_TEST_PATH = ROOT / "infra" / "preview-environments" / "tests" / "shell-accessibility-preview-suite.test.mjs"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_shell_accessibility_preview_suite.py"

REQUIRED_SHELL_FAMILIES = {
    "patient",
    "staff",
    "operations",
    "hub",
    "governance",
    "pharmacy",
}
REQUIRED_FAILURE_CLASSES = {
    "landmark_failure",
    "focus_order_failure",
    "continuity_failure",
    "publication_tuple_failure",
    "responsive_fold_failure",
    "reduced_motion_failure",
    "diagram_parity_failure",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_136 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    content = path.read_text(encoding="utf-8")
    if fragment not in content:
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        SUITE_DOC_PATH,
        PREVIEW_MATRIX_DOC_PATH,
        ACCESSIBILITY_MATRIX_DOC_PATH,
        ATLAS_PATH,
        PREVIEW_CASES_PATH,
        ACCESSIBILITY_CASES_PATH,
        SMOKE_EXPECTATIONS_PATH,
        SUITE_RESULTS_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        SPEC_PATH,
        NODE_SMOKE_TEST_PATH,
        BUILDER_PATH,
        Path(__file__),
    ]:
        assert_exists(path)

    preview_cases = read_csv(PREVIEW_CASES_PATH)
    accessibility_cases = read_csv(ACCESSIBILITY_CASES_PATH)
    smoke_expectations = read_json(SMOKE_EXPECTATIONS_PATH)
    suite_results = read_json(SUITE_RESULTS_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if suite_results["task_id"] != "seq_136":
        fail("seq_136 suite drifted off its task id.")
    if suite_results["visual_mode"] != "Shell_Conformance_Atlas":
        fail("seq_136 visual mode drifted.")
    if smoke_expectations["task_id"] != "seq_136":
        fail("seq_136 smoke expectations drifted off task id.")

    summary = suite_results["summary"]
    if summary["preview_shell_case_count"] != len(preview_cases):
        fail("Preview shell case count drifted from the suite summary.")
    if summary["accessibility_case_count"] != len(accessibility_cases):
        fail("Accessibility case count drifted from the suite summary.")
    if summary["shell_family_count"] != len(suite_results["shellFamilyResults"]):
        fail("Shell family count drifted from the suite summary.")
    if summary["shell_family_count"] != 6:
        fail("seq_136 must cover exactly six seeded shell families.")

    shell_families = {row["shellFamily"] for row in suite_results["shellFamilyResults"]}
    if shell_families != REQUIRED_SHELL_FAMILIES:
        fail("seq_136 shell family coverage drifted.")

    smoke_case_shells = {row["shellFamily"] for row in preview_cases}
    if smoke_case_shells != REQUIRED_SHELL_FAMILIES:
        fail("seq_136 preview cases lost one or more shell families.")
    accessibility_case_shells = {row["shellFamily"] for row in accessibility_cases}
    if accessibility_case_shells != REQUIRED_SHELL_FAMILIES:
        fail("seq_136 accessibility cases lost one or more shell families.")

    if summary["mission_stack_case_count"] < 6:
        fail("seq_136 lost mission_stack fold coverage.")
    if summary["embedded_case_count"] < 1:
        fail("seq_136 lost embedded-compatible shell coverage.")
    if summary["smoke_withheld_count"] < 1:
        fail("seq_136 must keep publication-sensitive smoke withholding explicit.")
    if summary["failure_class_counts"].get("publication_tuple_failure", 0) < 6:
        fail("seq_136 lost publication tuple failure coverage.")

    failure_classes = {row["failureClass"] for row in suite_results["failureClassCatalog"]}
    if failure_classes != REQUIRED_FAILURE_CLASSES:
        fail("seq_136 failure class catalog drifted.")

    preview_states = {row["previewEnvironmentState"] for row in preview_cases}
    for state in {"ready", "expiring", "drifted", "expired"}:
        if state not in preview_states:
            fail(f"seq_136 lost preview environment state coverage for {state}.")

    preview_modes = {row["previewEligibility"] for row in preview_cases}
    if "direct_preview_bundle" not in preview_modes:
        fail("seq_136 lost direct preview bundle coverage.")
    if "shared_shell_preview_only" not in preview_modes:
        fail("seq_136 lost shared-shell preview coverage.")

    embedded_rows = [row for row in preview_cases if row["expectedTopology"] == "embedded_strip"]
    if len(embedded_rows) != 1:
        fail("seq_136 should publish exactly one embedded-strip seed case.")
    if embedded_rows[0]["routeFamilyRef"] != "rf_patient_embedded_channel":
        fail("seq_136 embedded-strip case drifted away from the patient embedded channel.")

    if not all(row["smokeVerdict"] == "withheld" for row in preview_cases):
        fail("seq_136 smoke verdicts should remain withheld under the current tuple ceiling.")
    if not any(row["bindingState"] == "recovery_only" for row in preview_cases):
        fail("seq_136 lost recovery-only smoke coverage.")
    if not any(row["bindingState"] == "blocked" for row in preview_cases):
        fail("seq_136 lost blocked smoke coverage.")

    if not any(row["accessibilityVerdict"] == "blocked" for row in accessibility_cases):
        fail("seq_136 lost blocked accessibility coverage for embedded posture.")
    if not any(row["coverageState"] == "degraded" for row in accessibility_cases):
        fail("seq_136 lost degraded accessibility coverage.")

    live_sweep_cases = smoke_expectations["liveSweepCases"]
    if len(live_sweep_cases) != 6:
        fail("seq_136 live sweep must name one launch case per shell family.")
    if {row["shellFamily"] for row in live_sweep_cases} != REQUIRED_SHELL_FAMILIES:
        fail("seq_136 live sweep drifted away from full shell-family coverage.")

    assert_contains(SUITE_DOC_PATH, "Current suite verdict: `release_withheld`")
    assert_contains(PREVIEW_MATRIX_DOC_PATH, "shared_shell_preview_only")
    assert_contains(ACCESSIBILITY_MATRIX_DOC_PATH, "reduced-motion")
    assert_contains(ATLAS_PATH, 'data-testid="shell-conformance-atlas"')
    assert_contains(ATLAS_PATH, 'data-testid="topology-constellation"')
    assert_contains(ATLAS_PATH, 'data-testid="breakpoint-ladder"')
    assert_contains(ATLAS_PATH, 'data-testid="accessibility-coverage-matrix"')
    assert_contains(ATLAS_PATH, 'data-testid="smoke-results-table"')
    assert_contains(ATLAS_PATH, 'data-testid="accessibility-results-table"')
    assert_contains(ATLAS_PATH, "prefers-reduced-motion: reduce")
    assert_contains(ATLAS_PATH, "selectFamily")
    assert_contains(ATLAS_PATH, "selectSmokeCase")

    assert_contains(SPEC_PATH, "landmark and heading sweep")
    assert_contains(SPEC_PATH, "runChildSpec")
    assert_contains(SPEC_PATH, "patient-shell-seed-routes.spec.js")
    assert_contains(SPEC_PATH, "preview-environment-control-room.spec.js")
    assert_contains(NODE_SMOKE_TEST_PATH, "seq_136")

    expected_validate_script = "python3 ./tools/test/validate_shell_accessibility_preview_suite.py"
    if root_package["scripts"].get("validate:shell-accessibility-preview-suite") != expected_validate_script:
        fail("Root package lost validate:shell-accessibility-preview-suite.")
    if ROOT_SCRIPT_UPDATES.get("validate:shell-accessibility-preview-suite") != expected_validate_script:
        fail("root_script_updates.py lost validate:shell-accessibility-preview-suite.")

    build_script = root_package["scripts"]["codegen"]
    builder_fragment = "python3 ./tools/analysis/build_shell_accessibility_preview_suite.py"
    if builder_fragment not in build_script:
        fail("Root package codegen lost the seq_136 builder.")
    if builder_fragment not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("root_script_updates.py codegen lost the seq_136 builder.")

    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:shell-accessibility-preview-suite" not in root_package["scripts"][script_name]:
            fail(f"Root package {script_name} lost seq_136 validation.")
        if "pnpm validate:shell-accessibility-preview-suite" not in ROOT_SCRIPT_UPDATES[script_name]:
            fail(f"root_script_updates.py {script_name} lost seq_136 validation.")

    needle = "136_shell_accessibility_preview_smoke.spec.js"
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if needle not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package {script_name} lost {needle}.")

    print(
        json.dumps(
            {
                "task_id": "seq_136",
                "preview_shell_cases": summary["preview_shell_case_count"],
                "mission_stack_case_count": summary["mission_stack_case_count"],
                "embedded_case_count": summary["embedded_case_count"],
                "failing_shells": summary["suppressed_shell_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
