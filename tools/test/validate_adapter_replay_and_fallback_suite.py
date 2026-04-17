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

SUITE_DOC_PATH = DOCS_DIR / "135_adapter_replay_duplicate_quarantine_fallback_suite.md"
TRUTH_DOC_PATH = DOCS_DIR / "135_duplicate_cluster_and_fallback_truth_matrix.md"
LAB_PATH = DOCS_DIR / "135_exception_path_lab.html"

ADAPTER_REPLAY_CASES_PATH = DATA_DIR / "adapter_replay_cases.csv"
DUPLICATE_CLUSTER_CASES_PATH = DATA_DIR / "duplicate_cluster_cases.csv"
QUARANTINE_FALLBACK_CASES_PATH = DATA_DIR / "quarantine_fallback_cases.csv"
EVENT_EXPECTATIONS_PATH = DATA_DIR / "exception_path_event_expectations.json"
SUITE_RESULTS_PATH = DATA_DIR / "exception_path_suite_results.json"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_adapter_replay_and_fallback_suite.py"
SPEC_PATH = PLAYWRIGHT_DIR / "adapter-replay-and-fallback-lab.spec.js"

REQUIRED_CASE_FAMILIES = {
    "exact_submit_replay",
    "semantic_replay_or_collision_review",
    "review_required_duplicate_cluster",
    "same_request_attach_requires_proof",
    "adapter_callback_replay_safe",
    "quarantine_opens_fallback_review",
    "fallback_review_stays_explicit",
    "closure_blocked_while_review_open",
}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def assert_exists(path: Path) -> None:
    if not path.exists():
        fail(f"Missing seq_135 artifact: {path}")


def read_json(path: Path):
    assert_exists(path)
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    assert_exists(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, fragment: str) -> None:
    assert_exists(path)
    if fragment not in path.read_text(encoding="utf-8"):
        fail(f"{path} is missing required fragment: {fragment}")


def main() -> None:
    for path in [
        SUITE_DOC_PATH,
        TRUTH_DOC_PATH,
        LAB_PATH,
        ADAPTER_REPLAY_CASES_PATH,
        DUPLICATE_CLUSTER_CASES_PATH,
        QUARANTINE_FALLBACK_CASES_PATH,
        EVENT_EXPECTATIONS_PATH,
        SUITE_RESULTS_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        BUILDER_PATH,
        SPEC_PATH,
        Path(__file__),
    ]:
        assert_exists(path)

    adapter_rows = read_csv(ADAPTER_REPLAY_CASES_PATH)
    duplicate_rows = read_csv(DUPLICATE_CLUSTER_CASES_PATH)
    quarantine_rows = read_csv(QUARANTINE_FALLBACK_CASES_PATH)
    event_expectations = read_json(EVENT_EXPECTATIONS_PATH)
    suite_results = read_json(SUITE_RESULTS_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    if suite_results["task_id"] != "seq_135":
        fail("seq_135 suite drifted off its task id.")
    if suite_results["visual_mode"] != "Exception_Path_Lab":
        fail("seq_135 visual mode drifted.")
    if event_expectations["task_id"] != "seq_135":
        fail("seq_135 event expectations drifted off their task id.")

    summary = suite_results["summary"]
    if summary["adapter_replay_case_count"] != len(adapter_rows):
        fail("Adapter replay case count drifted from the suite summary.")
    if summary["duplicate_cluster_case_count"] != len(duplicate_rows):
        fail("Duplicate-cluster case count drifted from the suite summary.")
    if summary["quarantine_fallback_case_count"] != len(quarantine_rows):
        fail("Quarantine/fallback case count drifted from the suite summary.")
    if summary["exception_case_count"] != len(suite_results["exceptionCases"]):
        fail("Exception case count drifted from the suite summary.")
    if summary["published_event_expectation_count"] + summary["bounded_gap_event_expectation_count"] != len(
        event_expectations["eventExpectations"]
    ):
        fail("Event expectation totals drifted from the suite summary.")

    case_families = {row["caseFamily"] for row in suite_results["exceptionCases"]}
    if not REQUIRED_CASE_FAMILIES.issubset(case_families):
        fail("seq_135 lost one or more required case families.")

    if summary["bounded_gap_event_expectation_count"] < 1:
        fail("seq_135 must keep at least one bounded-gap event expectation explicit.")
    if summary["closure_blocked_case_count"] < 4:
        fail("seq_135 lost closure-blocked unhappy-path coverage.")

    exact_replay = next(
        (row for row in adapter_rows if row["case_id"] == "CASE_135_EXACT_SUBMIT_REPLAY"),
        None,
    )
    if exact_replay is None:
        fail("seq_135 lost the exact submit replay case.")
    if exact_replay["decision_class"] != "exact_replay":
        fail("Exact submit replay lost its exact_replay decision class.")
    if any(
        exact_replay[key] != "0"
        for key in [
            "duplicate_request_delta",
            "duplicate_side_effect_delta",
            "duplicate_closure_side_effect_delta",
        ]
    ):
        fail("Exact submit replay must keep all duplicate deltas at zero.")

    semantic_or_collision = [
        row
        for row in adapter_rows
        if row["case_family"] == "semantic_replay_or_collision_review"
    ]
    if len(semantic_or_collision) < 2:
        fail("seq_135 lost semantic replay or collision-review coverage.")
    if not any(row["decision_class"] == "collision_review" for row in semantic_or_collision):
        fail("seq_135 lost explicit collision-review coverage.")

    callback_safe_rows = [
        row for row in adapter_rows if row["case_family"] == "adapter_callback_replay_safe"
    ]
    if len(callback_safe_rows) < 2:
        fail("seq_135 lost adapter callback replay-safe coverage.")
    if not all(row["duplicate_side_effect_delta"] == "0" for row in callback_safe_rows):
        fail("Adapter callback replay-safe cases must keep duplicate side-effect delta at zero.")

    review_required = next(
        (
            row
            for row in duplicate_rows
            if row["case_id"] == "CASE_135_DUPLICATE_CLUSTER_REVIEW_REQUIRED"
        ),
        None,
    )
    if review_required is None:
        fail("seq_135 lost the review-required duplicate cluster case.")
    if review_required["closure_blocked"] != "yes":
        fail("Review-required duplicate clusters must remain closure-blocking.")
    if "command_api_duplicate_review_duplicate_cluster_0006" not in review_required["blocker_refs"]:
        fail("Review-required duplicate clusters lost the canonical closure blocker ref.")

    attach_proven = next(
        (
            row
            for row in duplicate_rows
            if row["case_id"] == "CASE_135_SAME_REQUEST_ATTACH_PROVEN"
        ),
        None,
    )
    if attach_proven is None:
        fail("seq_135 lost the same-request attach proof case.")
    if attach_proven["continuity_witness_class"] != "workflow_return":
        fail("Same-request attach must keep the explicit continuity witness.")
    if attach_proven["safety_reassessment_contract"] != "required_if_material_delta":
        fail("Same-request attach must keep the conditional safety reassessment contract.")

    fallback_continuity = next(
        (
            row
            for row in quarantine_rows
            if row["case_id"] == "CASE_135_QUARANTINE_FALLBACK_CONTINUITY"
        ),
        None,
    )
    if fallback_continuity is None:
        fail("seq_135 lost the quarantine fallback continuity case.")
    if fallback_continuity["patient_visible_state"] != "submitted_degraded":
        fail("Quarantine fallback continuity must keep submitted_degraded visible.")
    if fallback_continuity["closure_blocked"] != "yes":
        fail("Quarantine fallback continuity must keep closure blocked.")
    if "command_api_request_closure_fallbackReviewCase_0001" not in fallback_continuity["blocker_refs"]:
        fail("Quarantine fallback continuity lost the fallback review blocker ref.")

    explicit_fallback = next(
        (
            row
            for row in quarantine_rows
            if row["case_id"] == "CASE_135_FALLBACK_REVIEW_STAYS_EXPLICIT"
        ),
        None,
    )
    if explicit_fallback is None:
        fail("seq_135 lost the explicit fallback-review case.")
    if explicit_fallback["closure_blocked"] != "yes":
        fail("Fallback review must remain closure-blocking until governed recovery.")

    unsupported_gap = next(
        (
            row
            for row in quarantine_rows
            if row["case_id"] == "CASE_135_UNSUPPORTED_SCANNER_RUNTIME_GAP"
        ),
        None,
    )
    if unsupported_gap is None:
        fail("seq_135 lost the unsupported scanner runtime gap case.")
    if "GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1" not in unsupported_gap["gap_refs"]:
        fail("Unsupported scanner runtime gap must stay explicit.")
    if unsupported_gap["browser_proof_state"] != "partial_surface_proof":
        fail("Unsupported scanner runtime gap should stay at partial surface proof.")

    event_by_name = {
        row["eventName"]: row for row in event_expectations["eventExpectations"]
    }
    required_published_events = {
        "exception.review_case.opened",
        "intake.attachment.quarantined",
        "request.closure_blockers.changed",
        "request.duplicate.attach_applied",
        "request.duplicate.review_required",
        "safety.reassessed",
    }
    for event_name in required_published_events:
        row = event_by_name.get(event_name)
        if row is None:
            fail(f"seq_135 lost required event expectation {event_name}.")
        if row["registryState"] != "published":
            fail(f"seq_135 event {event_name} must stay published.")

    replay_returned = event_by_name.get("intake.promotion.replay_returned")
    if replay_returned is None or replay_returned["registryState"] != "bounded_gap":
        fail("Replay-returned event expectation must remain an explicit bounded gap.")

    assert_contains(SUITE_DOC_PATH, "Adapter Replay Matrix")
    assert_contains(TRUTH_DOC_PATH, "Event Expectations")
    assert_contains(LAB_PATH, 'data-testid="exception-path-lab"')
    assert_contains(LAB_PATH, 'data-testid="case-family-rail"')
    assert_contains(LAB_PATH, 'data-testid="replay-ladder"')
    assert_contains(LAB_PATH, 'data-testid="duplicate-cluster-map"')
    assert_contains(LAB_PATH, 'data-testid="fallback-continuity-ribbon"')
    assert_contains(LAB_PATH, 'data-testid="exception-inspector"')
    assert_contains(LAB_PATH, "prefers-reduced-motion: reduce")
    assert_contains(LAB_PATH, "max-width: 1580px;")
    assert_contains(LAB_PATH, "grid-template-columns: 288px minmax(0, 1fr) 408px;")
    assert_contains(LAB_PATH, "min-height: 72px;")
    assert_contains(LAB_PATH, "VECELLS")

    expected_validate_script = "python3 ./tools/test/validate_adapter_replay_and_fallback_suite.py"
    if root_package["scripts"].get("validate:adapter-replay-fallback-suite") != expected_validate_script:
        fail("Root package lost validate:adapter-replay-fallback-suite.")
    if ROOT_SCRIPT_UPDATES.get("validate:adapter-replay-fallback-suite") != expected_validate_script:
        fail("root_script_updates.py lost validate:adapter-replay-fallback-suite.")

    builder_fragment = "python3 ./tools/analysis/build_adapter_replay_and_fallback_suite.py"
    if builder_fragment not in root_package["scripts"]["codegen"]:
        fail("Root package codegen lost the seq_135 builder.")
    if builder_fragment not in ROOT_SCRIPT_UPDATES["codegen"]:
        fail("root_script_updates.py codegen lost the seq_135 builder.")

    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:adapter-replay-fallback-suite" not in root_package["scripts"][script_name]:
            fail(f"Root package {script_name} lost seq_135 validation.")
        if "pnpm validate:adapter-replay-fallback-suite" not in ROOT_SCRIPT_UPDATES[script_name]:
            fail(f"root_script_updates.py {script_name} lost seq_135 validation.")

    needle = "adapter-replay-and-fallback-lab.spec.js"
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        if needle not in playwright_package["scripts"][script_name]:
            fail(f"Playwright package {script_name} lost {needle}.")

    assert_contains(SPEC_PATH, "exact replay settlement reuse")
    assert_contains(SPEC_PATH, "duplicate review blocker visibility")
    assert_contains(SPEC_PATH, "fallback degraded continuity")
    assert_contains(SPEC_PATH, "unsupported scanner runtime gap")

    print(
        json.dumps(
            {
                "task_id": "seq_135",
                "exception_cases": summary["exception_case_count"],
                "closure_blocked_cases": summary["closure_blocked_case_count"],
                "bounded_gap_events": summary["bounded_gap_event_expectation_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
