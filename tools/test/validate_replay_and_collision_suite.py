#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


PATHS = {
    "submit_cases": ROOT / "data/test/166_submit_replay_cases.csv",
    "collision_cases": ROOT / "data/test/166_collision_review_cases.csv",
    "stale_cases": ROOT / "data/test/166_stale_resume_and_promotion_cases.csv",
    "expected_counts": ROOT / "data/test/166_expected_idempotency_and_side_effect_counts.json",
    "suite_doc": ROOT / "docs/tests/166_duplicate_submit_refresh_replay_and_collision_review_suite.md",
    "truth_doc": ROOT / "docs/tests/166_replay_and_collision_truth_matrix.md",
    "resume_doc": ROOT / "docs/tests/166_promotion_and_resume_blocking_matrix.md",
    "lab": ROOT / "docs/tests/166_replay_collision_lab.html",
    "integration_test": ROOT / "services/command-api/tests/166_replay_collision_suite.integration.test.js",
    "playwright_spec": ROOT / "tests/playwright/166_replay_collision_lab.spec.js",
    "submit_contract": ROOT / "data/contracts/148_intake_submit_settlement_contract.json",
    "resume_contract": ROOT / "data/contracts/154_resume_blocking_and_recovery_contract.json",
    "integrated_contract": ROOT / "data/contracts/164_phase1_integrated_route_and_settlement_bundle.json",
    "root_package": ROOT / "package.json",
    "playwright_package": ROOT / "tests/playwright/package.json",
    "root_script_updates": ROOT / "tools/analysis/root_script_updates.py",
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

    submit_rows = load_csv(PATHS["submit_cases"])
    collision_rows = load_csv(PATHS["collision_cases"])
    stale_rows = load_csv(PATHS["stale_cases"])
    expected_counts = load_json(PATHS["expected_counts"])
    submit_contract = load_json(PATHS["submit_contract"])
    resume_contract = load_json(PATHS["resume_contract"])
    integrated_contract = load_json(PATHS["integrated_contract"])
    suite_doc = read_text(PATHS["suite_doc"])
    truth_doc = read_text(PATHS["truth_doc"])
    resume_doc = read_text(PATHS["resume_doc"])
    lab = read_text(PATHS["lab"])
    integration_test = read_text(PATHS["integration_test"])
    playwright_spec = read_text(PATHS["playwright_spec"])
    root_package = load_json(PATHS["root_package"])
    playwright_package = load_json(PATHS["playwright_package"])
    root_script_updates = read_text(PATHS["root_script_updates"])

    require(submit_rows, "SUBMIT_REPLAY_CASES_EMPTY")
    require(collision_rows, "COLLISION_REVIEW_CASES_EMPTY")
    require(stale_rows, "STALE_RESUME_CASES_EMPTY")
    require(
        submit_contract["contractId"] == "PHASE1_INTAKE_SUBMIT_SETTLEMENT_V1",
        "SUBMIT_CONTRACT_DRIFT",
    )
    require(
        resume_contract["contractId"] == "PHASE1_PROMOTED_DRAFT_RESUME_BLOCKING_CONTRACT_V1",
        "RESUME_BLOCKING_CONTRACT_DRIFT",
    )
    require(
        integrated_contract["contractId"] == "PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1",
        "INTEGRATED_CONTRACT_DRIFT",
    )

    required_submit_families = {
        "exact_replay",
        "semantic_replay",
        "refresh_before_settlement",
        "notification_replay",
    }
    required_collision_classes = {
        "collision_review",
        "same_request_attach",
        "same_episode_link",
        "review_required",
    }
    required_stale_families = {"stale_tab", "stale_token", "stale_submit"}
    require(
        required_submit_families.issubset({row["case_family"] for row in submit_rows}),
        "SUBMIT_REPLAY_FAMILY_COVERAGE_INCOMPLETE",
    )
    require(
        required_collision_classes.issubset(
            {row["expected_decision_class"] for row in collision_rows}
        ),
        "COLLISION_DECISION_COVERAGE_INCOMPLETE",
    )
    require(
        required_stale_families.issubset({row["case_family"] for row in stale_rows}),
        "STALE_CASE_FAMILY_COVERAGE_INCOMPLETE",
    )

    decision_classes = set(submit_contract["decisionClasses"])
    for row in submit_rows:
        for decision_class in row["expected_decision_class"].split("+"):
            if decision_class in {"notification_replay"}:
                continue
            require(
                decision_class in decision_classes,
                f"UNKNOWN_SUBMIT_DECISION:{row['case_id']}:{decision_class}",
            )
        for field in [
            "expected_request_delta",
            "expected_promotion_delta",
            "expected_safety_execution_delta",
            "expected_triage_task_delta",
            "expected_notification_delta",
            "expected_visible_outcome_count",
        ]:
            require(row[field].isdigit(), f"NON_NUMERIC_SIDE_EFFECT:{row['case_id']}:{field}")
        require(row["expected_shell_lineage"] == "patient.portal.requests", f"SHELL_LINEAGE_DRIFT:{row['case_id']}")
        require(row["automated_assertion_ref"], f"SUBMIT_ROW_MISSING_ASSERTION:{row['case_id']}")
        require(row["browser_case_id"] in lab, f"SUBMIT_ROW_BROWSER_PROOF_MISSING:{row['case_id']}")

    for row in collision_rows:
        require(row["automated_assertion_ref"], f"COLLISION_ROW_MISSING_ASSERTION:{row['case_id']}")
        require(row["browser_case_id"] in lab, f"COLLISION_ROW_BROWSER_PROOF_MISSING:{row['case_id']}")
        require(
            row["expected_patient_posture"] != "authoritative_request_shell"
            or row["expected_decision_class"] == "same_request_attach",
            f"COLLISION_SILENT_SUCCESS:{row['case_id']}",
        )
        if row["expected_decision_class"] == "collision_review":
            require(row["expected_settlement_state"] == "collision_review_open", f"COLLISION_STATE_DRIFT:{row['case_id']}")
            require(row["expected_request_delta"] == "0", f"COLLISION_CREATED_REQUEST:{row['case_id']}")
            require(row["expected_notification_delta"] == "0", f"COLLISION_CREATED_NOTIFICATION:{row['case_id']}")

    for row in stale_rows:
        require(row["automated_assertion_ref"], f"STALE_ROW_MISSING_ASSERTION:{row['case_id']}")
        require(row["browser_case_id"] in lab, f"STALE_ROW_BROWSER_PROOF_MISSING:{row['case_id']}")
        require(row["expected_same_shell"] == "true", f"STALE_ROW_NOT_SAME_SHELL:{row['case_id']}")
        require(row["expected_calm_saved_visible"] == "false", f"STALE_ROW_CALM_SAVED:{row['case_id']}")
        require(row["expected_mutating_resume_state"] == "blocked", f"STALE_ROW_REOPENED_MUTATION:{row['case_id']}")
        require(row["expected_request_delta"] == "0", f"STALE_ROW_CREATED_REQUEST:{row['case_id']}")

    fixture_counts = expected_counts["fixtureCounts"]
    require(fixture_counts["submitReplayCases"] == len(submit_rows), "EXPECTED_SUBMIT_COUNT_DRIFT")
    require(fixture_counts["collisionReviewCases"] == len(collision_rows), "EXPECTED_COLLISION_COUNT_DRIFT")
    require(fixture_counts["staleResumeAndPromotionCases"] == len(stale_rows), "EXPECTED_STALE_COUNT_DRIFT")
    require(
        fixture_counts["browserProofCases"] == len(submit_rows) + len(collision_rows) + len(stale_rows),
        "EXPECTED_BROWSER_PROOF_COUNT_DRIFT",
    )
    require(
        expected_counts["globalInvariants"]["duplicateNotificationAllowed"] is False,
        "DUPLICATE_NOTIFICATION_INVARIANT_MISSING",
    )
    require(
        expected_counts["globalInvariants"]["stalePromotedDraftReopensMutableEditing"] is False,
        "STALE_MUTABLE_REOPEN_INVARIANT_MISSING",
    )

    for marker in [
        "Replay_Collision_Lab",
        'id="lineage_braid_mark"',
        'data-testid="lineage-braid"',
        'data-testid="settlement-ladder"',
        'data-testid="side-effect-counters"',
        'data-testid="replay-truth-table"',
        'data-testid="collision-truth-table"',
        'data-testid="stale-resume-table"',
        'data-testid="side-effect-table"',
        'data-testid="event-chain-table"',
        'data-testid="case-parity-table"',
        "prefers-reduced-motion",
        "patient.portal.requests",
    ]:
        require(marker in lab, f"LAB_MARKER_MISSING:{marker}")

    for marker in [
        "Double submit can still win a race",
        "Collision review is backend-only",
        "Stale tabs after promotion are harmless",
        "Notification replay can duplicate side effects",
    ]:
        require(marker in suite_doc, f"SUITE_DOC_MARKER_MISSING:{marker}")
    for row in submit_rows + collision_rows:
        require(row["case_id"] in truth_doc, f"TRUTH_DOC_MISSING_CASE:{row['case_id']}")
    for row in stale_rows:
        require(row["case_id"] in resume_doc, f"RESUME_DOC_MISSING_CASE:{row['case_id']}")

    for marker in [
        "createIntakeSubmitApplication",
        "createDuplicateReviewApplication",
        "createReplayCollisionApplication",
        "countSideEffects",
        "SUB166_CONCURRENT_DOUBLE_TAP",
        "COL166_SAME_EPISODE_LINK_HUMAN_REVIEW",
        "STALE166_BACKGROUND_AUTOSAVE_AFTER_PROMOTION",
        "SUB166_NOTIFICATION_JOB_REPLAY",
    ]:
        require(marker in integration_test, f"INTEGRATION_TEST_MARKER_MISSING:{marker}")
    for marker in [
        "double submit and refresh-before-settlement cases",
        "stale-tab and stale-token post-promotion cases",
        "collision-review visibility and bounded recovery rendering",
        "side-effect count assertions and same-shell continuity markers",
        "reduced-motion equivalence",
        "diagram and table parity",
    ]:
        require(marker in playwright_spec, f"PLAYWRIGHT_SPEC_MARKER_MISSING:{marker}")

    root_scripts = root_package["scripts"]
    require(
        root_scripts.get("validate:replay-collision-suite")
        == "python3 ./tools/test/validate_replay_and_collision_suite.py",
        "ROOT_VALIDATE_SCRIPT_MISSING",
    )
    for script_name in ["bootstrap", "check"]:
        require(
            "pnpm validate:replay-collision-suite" in root_scripts.get(script_name, ""),
            f"ROOT_{script_name.upper()}_MISSING_166_VALIDATOR",
        )
    require(
        '"validate:replay-collision-suite": "python3 ./tools/test/validate_replay_and_collision_suite.py"'
        in root_script_updates,
        "ROOT_SCRIPT_UPDATES_MISSING_166_VALIDATOR",
    )
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        require(
            "166_replay_collision_lab.spec.js" in playwright_package["scripts"].get(script_name, ""),
            f"PLAYWRIGHT_PACKAGE_MISSING_166:{script_name}",
        )

    print("validate_replay_and_collision_suite: ok")


if __name__ == "__main__":
    main()
