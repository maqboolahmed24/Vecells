#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES

DOCS_TEST_DIR = ROOT / "docs" / "tests"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_TEST_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
PACKAGE_PATH = ROOT / "package.json"

SUITE_DOC_PATH = DOCS_TEST_DIR / "276_phase3_workspace_accessibility_performance_multi_user_suite.md"
BROWSER_MATRIX_PATH = DOCS_TEST_DIR / "276_phase3_workspace_browser_matrix.md"
LAB_PATH = DOCS_FRONTEND_DIR / "276_workspace_hardening_assurance_lab.html"
REFERENCE_NOTES_PATH = DATA_ANALYSIS_DIR / "276_visual_reference_notes.json"
SEMANTIC_CASES_PATH = DATA_TEST_DIR / "276_semantic_and_keyboard_cases.csv"
ZOOM_CASES_PATH = DATA_TEST_DIR / "276_zoom_motion_reflow_cases.csv"
MULTI_USER_CASES_PATH = DATA_TEST_DIR / "276_multi_user_read_only_cases.csv"
BUDGET_MANIFEST_PATH = DATA_TEST_DIR / "276_performance_budget_manifest.json"
METRICS_PATH = DATA_TEST_DIR / "276_web_vitals_and_interaction_metrics.json"
RESULTS_PATH = DATA_TEST_DIR / "276_suite_results.json"
DEFECT_LOG_PATH = DATA_TEST_DIR / "276_defect_log_and_remediation.json"

HELPER_PATH = PLAYWRIGHT_DIR / "276_workspace_hardening.helpers.ts"
SPEC_PATHS = [
    PLAYWRIGHT_DIR / "276_workspace_semantics_and_focus.spec.ts",
    PLAYWRIGHT_DIR / "276_workspace_zoom_motion_and_reflow.spec.ts",
    PLAYWRIGHT_DIR / "276_workspace_multi_user_read_only.spec.ts",
    PLAYWRIGHT_DIR / "276_workspace_performance.spec.ts",
    PLAYWRIGHT_DIR / "276_workspace_visual_regression.spec.ts",
]


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
    for path in [
        SUITE_DOC_PATH,
        BROWSER_MATRIX_PATH,
        LAB_PATH,
        REFERENCE_NOTES_PATH,
        SEMANTIC_CASES_PATH,
        ZOOM_CASES_PATH,
        MULTI_USER_CASES_PATH,
        BUDGET_MANIFEST_PATH,
        METRICS_PATH,
        RESULTS_PATH,
        DEFECT_LOG_PATH,
        HELPER_PATH,
        PACKAGE_PATH,
    ] + SPEC_PATHS:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    suite_doc = read_text(SUITE_DOC_PATH)
    browser_matrix = read_text(BROWSER_MATRIX_PATH)
    lab = read_text(LAB_PATH)
    helper = read_text(HELPER_PATH)
    package_text = read_text(PACKAGE_PATH)

    semantic_rows = load_csv(SEMANTIC_CASES_PATH)
    zoom_rows = load_csv(ZOOM_CASES_PATH)
    multi_user_rows = load_csv(MULTI_USER_CASES_PATH)
    notes = load_json(REFERENCE_NOTES_PATH)
    budgets = load_json(BUDGET_MANIFEST_PATH)
    metrics = load_json(METRICS_PATH)
    results = load_json(RESULTS_PATH)
    defect_log = load_json(DEFECT_LOG_PATH)

    require(notes["taskId"] == "seq_276", "276_NOTES_TASK_ID_DRIFT")
    require(len(notes["references"]) >= 10, "276_REFERENCE_COUNT_TOO_LOW")

    require(len(semantic_rows) == 8, "276_SEMANTIC_CASE_COUNT_DRIFT")
    require(len(zoom_rows) == 6, "276_ZOOM_CASE_COUNT_DRIFT")
    require(len(multi_user_rows) == 7, "276_MULTI_USER_CASE_COUNT_DRIFT")
    require(
        {row["actualResult"] for row in semantic_rows + zoom_rows + multi_user_rows} == {"passed"},
        "276_CASE_RESULT_DRIFT",
    )

    require(budgets["taskId"] == "seq_276", "276_BUDGET_TASK_ID_DRIFT")
    require(len(budgets["budgets"]) == 6, "276_BUDGET_COUNT_DRIFT")
    require(
        {item["metricId"] for item in budgets["budgets"]}
        == {
            "queueLargeInitialReadyMs",
            "queueRenderedWindowCap",
            "commandPaletteOpenMs",
            "commandPaletteLayoutShiftPx",
            "taskTransitionMs",
            "attachmentStageOpenMs",
        },
        "276_BUDGET_METRIC_SET_DRIFT",
    )

    require(metrics["taskId"] == "seq_276", "276_METRICS_TASK_ID_DRIFT")
    require(metrics.get("status") != "pending_playwright_run", "276_METRICS_NOT_GENERATED")
    require(
        set(metrics["verdicts"].values()) == {"passed"},
        "276_METRIC_VERDICT_DRIFT",
    )

    require(results["taskId"] == "seq_276", "276_RESULTS_TASK_ID_DRIFT")
    require(
        results["visualMode"] == "Workspace_Hardening_Assurance_Lab",
        "276_RESULTS_VISUAL_MODE_DRIFT",
    )
    require(
        results["suiteVerdict"] == "passed_with_repository_fix",
        "276_RESULTS_VERDICT_DRIFT",
    )
    require(results["summary"]["totalCaseCount"] == 21, "276_TOTAL_CASE_COUNT_DRIFT")
    require(results["summary"]["fixedDefectCount"] == 7, "276_FIXED_DEFECT_COUNT_DRIFT")
    require(
        results["repositoryFixRefs"]
        == [
            "WHS276_DEF_001",
            "WHS276_DEF_002",
            "WHS276_DEF_003",
            "WHS276_DEF_004",
            "WHS276_DEF_005",
            "WHS276_DEF_006",
            "WHS276_DEF_007",
        ],
        "276_REPOSITORY_FIX_REF_DRIFT",
    )

    require(defect_log["taskId"] == "seq_276", "276_DEFECT_LOG_TASK_ID_DRIFT")
    require(defect_log["status"] == "repository_defects_fixed", "276_DEFECT_LOG_STATUS_DRIFT")
    require(len(defect_log["defects"]) == 7, "276_DEFECT_LOG_COUNT_DRIFT")

    for token in [
        "workspace hardening",
        "one writer versus many readers",
        "WHS276_DEF_001",
        "WHS276_DEF_002",
        "WHS276_DEF_007",
        "PHI-safe",
    ]:
        require(token in suite_doc, f"276_SUITE_DOC_MARKER_MISSING:{token}")

    for token in [
        "Chromium",
        "Non-Chromium",
        "Multi-user read-only",
        "Large queue and task shell",
    ]:
        require(token in browser_matrix, f"276_BROWSER_MATRIX_MARKER_MISSING:{token}")

    for token in [
        "Workspace_Hardening_Assurance_Lab",
        "ScenarioFamilyRail",
        "SemanticCoverageGrid",
        "FocusAndKeyboardPathway",
        "PerformanceBudgetBoard",
        "MultiUserReadOnlyMatrix",
        "ReflowAndReducedMotionBoard",
        "DefectAndRemediationLedger",
        "semantic_live",
        "large_queue_windowed",
        "read_only_fallback",
    ]:
        require(token in lab, f"276_LAB_MARKER_MISSING:{token}")

    for token in [
        "openHardeningWorkspaceRoute",
        "captureAriaTree",
        "startTracedContext",
        "ensurePhiSafeWorkspace",
    ]:
        require(token in helper, f"276_HELPER_MARKER_MISSING:{token}")

    spec_texts = [read_text(path) for path in SPEC_PATHS]
    expected_spec_tokens = [
        ["launchSecondaryBrowser", "ProtectedCompositionRecovery", "writeWorkspaceAriaSnapshots"],
        ["reducedMotion", "mission_stack", "font-size: 200%"],
        ["ApprovalReviewStage", "EscalationCommandSurface", "ClinicianMessageThreadSurface"],
        ["queueLargeInitialReadyMs", "commandPaletteLayoutShiftPx", "attachmentStageOpenMs"],
        ["Workspace_Hardening_Assurance_Lab", "276-workspace-read-only-fallback.png", "276-workspace-hardening-lab.png"],
    ]
    for text, markers in zip(spec_texts, expected_spec_tokens, strict=True):
        for token in markers:
          require(token in text, f"276_SPEC_MARKER_MISSING:{token}")

    require(
        '"validate:276-workspace-hardening-suite": "python3 ./tools/test/validate_276_workspace_hardening_suite.py"'
        in package_text,
        "276_PACKAGE_SCRIPT_MISSING",
    )
    require(
        ROOT_SCRIPT_UPDATES.get("validate:276-workspace-hardening-suite")
        == "python3 ./tools/test/validate_276_workspace_hardening_suite.py",
        "276_ROOT_SCRIPT_UPDATE_MISSING",
    )


if __name__ == "__main__":
    main()
