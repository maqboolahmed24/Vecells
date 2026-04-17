#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

PATHS = {
    "route_matrix": ROOT / "data/test/167_channel_route_matrix.csv",
    "accessibility_matrix": ROOT / "data/test/167_accessibility_assertion_matrix.csv",
    "aria_manifest": ROOT / "data/test/167_aria_snapshot_manifest.yaml",
    "results": ROOT / "data/test/167_regression_results.json",
    "suite_doc": ROOT / "docs/tests/167_phase1_channel_and_accessibility_regression_suite.md",
    "route_doc": ROOT / "docs/tests/167_route_channel_breakpoint_matrix.md",
    "a11y_doc": ROOT / "docs/tests/167_wcag22_and_live_announcement_matrix.md",
    "atlas": ROOT / "docs/tests/167_phase1_regression_atlas.html",
    "playwright_spec": ROOT / "tests/playwright/167_phase1_channel_and_accessibility.spec.js",
    "integrated_contract": ROOT / "data/contracts/164_phase1_integrated_route_and_settlement_bundle.json",
    "root_package": ROOT / "package.json",
    "playwright_package": ROOT / "tests/playwright/package.json",
    "root_script_updates": ROOT / "tools/analysis/root_script_updates.py",
}

REQUIRED_REQUEST_TYPES = {"Symptoms", "Meds", "Admin", "Results"}
REQUIRED_VIEWPORTS = {"mobile", "tablet", "desktop"}
REQUIRED_POSTURES = {
    "signed_out_start",
    "minimal_tracking",
    "bounded_refresh_resume",
    "stale_promoted_draft_token",
    "post_uplift_read_only_return",
}
REQUIRED_ASSERTION_FAMILIES = {
    "landmarks",
    "keyboard_flow",
    "forms",
    "live_region",
    "focus_safety",
    "motion",
    "diagram_parity",
    "quiet_status",
    "target_safety",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in PATHS.values():
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    route_rows = load_csv(PATHS["route_matrix"])
    assertion_rows = load_csv(PATHS["accessibility_matrix"])
    aria_manifest = read_text(PATHS["aria_manifest"])
    results = load_json(PATHS["results"])
    suite_doc = read_text(PATHS["suite_doc"])
    route_doc = read_text(PATHS["route_doc"])
    a11y_doc = read_text(PATHS["a11y_doc"])
    atlas = read_text(PATHS["atlas"])
    playwright_spec = read_text(PATHS["playwright_spec"])
    integrated_contract = load_json(PATHS["integrated_contract"])
    root_package = load_json(PATHS["root_package"])
    playwright_package = load_json(PATHS["playwright_package"])
    root_script_updates = read_text(PATHS["root_script_updates"])

    require(route_rows, "ROUTE_MATRIX_EMPTY")
    require(assertion_rows, "ACCESSIBILITY_ASSERTION_MATRIX_EMPTY")
    require(
        integrated_contract["contractId"] == "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1",
        "INTEGRATED_CONTRACT_DRIFT",
    )
    require(results["surfaceMode"] == "Phase1_Regression_Atlas", "RESULT_SURFACE_MODE_DRIFT")
    require(results["tooling"]["playwrightPrimaryHarness"] is True, "PLAYWRIGHT_TOOLING_NOT_REQUIRED")
    require(results["tooling"]["axeCoreRequired"] is True, "AXE_TOOLING_NOT_REQUIRED")
    require(results["tooling"]["ariaSnapshotRequired"] is True, "ARIA_TOOLING_NOT_REQUIRED")
    require(results["globalInvariants"]["allRoutesSameShellContinuity"] is True, "SHELL_CONTINUITY_INVARIANT_MISSING")
    require(results["globalInvariants"]["duplicateLiveAnnouncementsAllowed"] is False, "LIVE_DUPLICATE_INVARIANT_MISSING")
    require(results["globalInvariants"]["visualOnlyEvidenceAllowed"] is False, "VISUAL_ONLY_EVIDENCE_ALLOWED")
    require(results["globalInvariants"]["stickyFooterMayObscureFocus"] is False, "STICKY_FOCUS_OVERLAP_ALLOWED")
    require(results["globalInvariants"]["reducedMotionMayChangeSemanticOrder"] is False, "REDUCED_MOTION_ORDER_DRIFT_ALLOWED")

    require({row["request_type"] for row in route_rows if row["coverage_ref"] == "COV167_REQUEST_TYPE_JOURNEY"} == REQUIRED_REQUEST_TYPES, "REQUEST_TYPE_JOURNEY_COVERAGE_INCOMPLETE")
    require(REQUIRED_POSTURES.issubset({row["entry_posture"] for row in route_rows}), "ENTRY_POSTURE_COVERAGE_INCOMPLETE")
    for row in route_rows:
        require(row["route_family"] == "rf_intake_self_service", f"ROUTE_FAMILY_DRIFT:{row['case_id']}")
        require(set(row["viewport_matrix"].split("|")) == REQUIRED_VIEWPORTS, f"VIEWPORT_MATRIX_DRIFT:{row['case_id']}")
        require(row["expected_selected_anchor"] in {"request-proof", "request-return"}, f"UNKNOWN_SELECTED_ANCHOR:{row['case_id']}")
        require(row["sticky_footer_expectation"] == "focus_targets_unobscured", f"STICKY_EXPECTATION_DRIFT:{row['case_id']}")
        require(row["browser_assertion_ref"].startswith("playwright."), f"BROWSER_ASSERTION_REF_MISSING:{row['case_id']}")

    require(REQUIRED_ASSERTION_FAMILIES.issubset({row["case_family"] for row in assertion_rows}), "ACCESSIBILITY_FAMILY_COVERAGE_INCOMPLETE")
    for row in assertion_rows:
        require(row["automated_assertion_ref"].startswith("playwright."), f"A11Y_AUTOMATION_REF_MISSING:{row['assertion_id']}")
        require(row["duplicate_announcement_allowed"] == "false", f"LIVE_DUPLICATE_ALLOWED:{row['assertion_id']}")
        require(row["reduced_motion_semantic_equivalent"] == "true", f"REDUCED_MOTION_NOT_EQUIVALENT:{row['assertion_id']}")
        require(int(row["target_size_min_px"]) >= 24, f"TARGET_SIZE_TOO_SMALL:{row['assertion_id']}")
        require(row["sticky_overlap_allowed"] == "false", f"STICKY_OVERLAP_ALLOWED:{row['assertion_id']}")
        require(row["aria_snapshot_ref"] in aria_manifest, f"ARIA_SNAPSHOT_REF_MISSING:{row['assertion_id']}")

    require(results["fixtureCounts"]["routeRows"] == len(route_rows), "RESULT_ROUTE_COUNT_DRIFT")
    require(results["fixtureCounts"]["accessibilityAssertions"] == len(assertion_rows), "RESULT_ASSERTION_COUNT_DRIFT")
    require(results["fixtureCounts"]["requestTypeJourneys"] == 4, "RESULT_REQUEST_TYPE_COUNT_DRIFT")

    for marker in [
        "Phase1_Regression_Atlas",
        'id="parity_grid_mark"',
        'data-testid="route-family-atlas"',
        'data-testid="breakpoint-ribbon"',
        'data-testid="focus-path-ladder"',
        'data-testid="live-announcement-timeline"',
        'data-testid="route-channel-table"',
        'data-testid="accessibility-assertion-table"',
        'data-testid="aria-snapshot-table"',
        'data-testid="diagram-parity-table"',
        "prefers-reduced-motion",
        "167_channel_route_matrix.csv",
        "167_accessibility_assertion_matrix.csv",
    ]:
        require(marker in atlas, f"ATLAS_MARKER_MISSING:{marker}")

    for marker in [
        "keyboard or assistive-tech users",
        "Reduced-motion checks",
        "Every atlas diagram has an adjacent parity table",
        "sticky action tray rectangles",
        "Axe-core runs as a broad scan",
    ]:
        require(marker in suite_doc, f"SUITE_DOC_MARKER_MISSING:{marker}")
    for row in route_rows:
        require(row["case_id"] in route_doc, f"ROUTE_DOC_MISSING_CASE:{row['case_id']}")
    for marker in ["live_region", "focus_safety", "diagram_parity", "target_safety"]:
        require(marker in a11y_doc, f"A11Y_DOC_MARKER_MISSING:{marker}")

    for marker in [
        "axe.run",
        "ariaSnapshot",
        "all four request-type journeys",
        "urgent and routine outcome paths",
        "keyboard-only traversal",
        "sticky-footer non-obscuration checks",
        "live-region dedupe",
        "reduced-motion equivalence",
        "mobile/tablet/desktop layouts",
        "diagram/table parity",
        "CH167_SYMPTOMS_URGENT",
        "CH167_RESULTS_ROUTINE_RECEIPT",
    ]:
        require(marker in playwright_spec, f"PLAYWRIGHT_SPEC_MARKER_MISSING:{marker}")

    root_scripts = root_package["scripts"]
    expected_script = "python3 ./tools/test/validate_phase1_channel_and_accessibility_suite.py"
    require(root_scripts.get("validate:phase1-channel-accessibility-suite") == expected_script, "ROOT_VALIDATE_SCRIPT_MISSING")
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:phase1-channel-accessibility-suite" in root_scripts.get(script_name, ""),
            f"ROOT_{script_name.upper()}_MISSING_167_VALIDATOR",
        )
    require(
        '"validate:phase1-channel-accessibility-suite": "python3 ./tools/test/validate_phase1_channel_and_accessibility_suite.py"'
        in root_script_updates,
        "ROOT_SCRIPT_UPDATES_MISSING_167_VALIDATOR",
    )

    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "167_phase1_channel_and_accessibility.spec.js" in playwright_package["scripts"].get(script_name, ""),
            f"PLAYWRIGHT_PACKAGE_MISSING_167:{script_name}",
        )

    require("axe-core" in root_package.get("devDependencies", {}), "AXE_CORE_DEPENDENCY_MISSING")
    print("validate_phase1_channel_and_accessibility_suite: ok")


if __name__ == "__main__":
    main()
