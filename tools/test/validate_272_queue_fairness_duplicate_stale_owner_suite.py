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
FRONTEND_DIR = ROOT / "docs" / "frontend"
DATA_DIR = ROOT / "data" / "test"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
SERVICE_TEST_DIR = ROOT / "services" / "command-api" / "tests"
API_CONTRACT_TEST_DIR = ROOT / "packages" / "api-contracts" / "tests"

SUITE_DOC_PATH = DOCS_DIR / "272_phase3_queue_fairness_duplicate_stale_owner_suite.md"
CASE_MATRIX_DOC_PATH = DOCS_DIR / "272_phase3_queue_case_matrix.md"
LAB_PATH = FRONTEND_DIR / "272_queue_fairness_recovery_lab.html"

QUEUE_CASES_PATH = DATA_DIR / "272_queue_replay_cases.csv"
DUPLICATE_CASES_PATH = DATA_DIR / "272_duplicate_and_resolution_cases.csv"
STALE_CASES_PATH = DATA_DIR / "272_stale_owner_and_takeover_cases.csv"
EXPECTATIONS_PATH = DATA_DIR / "272_expected_rank_snapshots_and_hashes.json"
RESULTS_PATH = DATA_DIR / "272_suite_results.json"
DEFECT_LOG_PATH = DATA_DIR / "272_defect_log_and_remediation.json"

VALIDATOR_PATH = ROOT / "tools" / "test" / "validate_272_queue_fairness_duplicate_stale_owner_suite.py"
SERVICE_TEST_PATH = SERVICE_TEST_DIR / "272_phase3_queue_governance_assurance.integration.test.js"
QUEUE_RANKING_TEST_PATH = API_CONTRACT_TEST_DIR / "queue-ranking.test.ts"
PLAYWRIGHT_PATHS = [
    PLAYWRIGHT_DIR / "272_queue_fairness_recovery.spec.ts",
    PLAYWRIGHT_DIR / "272_queue_concurrency_multi_user.spec.ts",
    PLAYWRIGHT_DIR / "272_queue_visual_and_accessibility.spec.ts",
]
ROOT_PACKAGE_PATH = ROOT / "package.json"


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
        CASE_MATRIX_DOC_PATH,
        LAB_PATH,
        QUEUE_CASES_PATH,
        DUPLICATE_CASES_PATH,
        STALE_CASES_PATH,
        EXPECTATIONS_PATH,
        RESULTS_PATH,
        DEFECT_LOG_PATH,
        VALIDATOR_PATH,
        SERVICE_TEST_PATH,
        QUEUE_RANKING_TEST_PATH,
        ROOT_PACKAGE_PATH,
    ] + PLAYWRIGHT_PATHS:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    queue_rows = load_csv(QUEUE_CASES_PATH)
    duplicate_rows = load_csv(DUPLICATE_CASES_PATH)
    stale_rows = load_csv(STALE_CASES_PATH)
    expectations = load_json(EXPECTATIONS_PATH)
    results = load_json(RESULTS_PATH)
    defect_log = load_json(DEFECT_LOG_PATH)
    suite_doc = read_text(SUITE_DOC_PATH)
    case_matrix_doc = read_text(CASE_MATRIX_DOC_PATH)
    lab = read_text(LAB_PATH)
    service_test = read_text(SERVICE_TEST_PATH)
    queue_ranking_test = read_text(QUEUE_RANKING_TEST_PATH)
    root_package_text = read_text(ROOT_PACKAGE_PATH)

    require(results["taskId"] == "seq_272", "272_RESULTS_TASK_ID_DRIFT")
    require(results["visualMode"] == "Queue_Fairness_Recovery_Lab", "272_RESULTS_VISUAL_MODE_DRIFT")
    require(
        results["suiteVerdict"] == "passed_with_machine_readable_evidence",
        "272_RESULTS_VERDICT_DRIFT",
    )
    require(defect_log["taskId"] == "seq_272", "272_DEFECT_LOG_TASK_ID_DRIFT")
    require(defect_log["defects"] == [], "272_DEFECT_LOG_MUST_BE_EMPTY_AFTER_REMEDIATION")

    require(len(queue_rows) == 6, "272_QUEUE_CASE_COUNT_DRIFT")
    require(len(duplicate_rows) == 4, "272_DUPLICATE_CASE_COUNT_DRIFT")
    require(len(stale_rows) == 5, "272_STALE_CASE_COUNT_DRIFT")
    require(
        results["summary"]["totalCaseCount"] == len(queue_rows) + len(duplicate_rows) + len(stale_rows),
        "272_TOTAL_CASE_COUNT_DRIFT",
    )

    require(
        [row["caseId"] for row in queue_rows]
        == [
            "QFR272_001",
            "QFR272_002",
            "QFR272_003",
            "QFR272_004",
            "QFR272_005",
            "QFR272_006",
        ],
        "272_QUEUE_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in duplicate_rows]
        == ["QFR272_007", "QFR272_008", "QFR272_009", "QFR272_010"],
        "272_DUPLICATE_CASE_ORDER_DRIFT",
    )
    require(
        [row["caseId"] for row in stale_rows]
        == [
            "QFR272_011",
            "QFR272_012",
            "QFR272_013",
            "QFR272_014",
            "QFR272_015",
        ],
        "272_STALE_CASE_ORDER_DRIFT",
    )
    require(
        {row["actualResult"] for row in queue_rows + duplicate_rows + stale_rows} == {"passed"},
        "272_CASE_RESULT_DRIFT",
    )

    queue_expectations = expectations["queueReplayExpectations"]
    duplicate_expectations = expectations["duplicateResolutionExpectations"]
    stale_expectations = expectations["staleOwnerAndContinuityExpectations"]
    require(len(queue_expectations) == 6, "272_QUEUE_EXPECTATION_COUNT_DRIFT")
    require(len(duplicate_expectations) == 4, "272_DUPLICATE_EXPECTATION_COUNT_DRIFT")
    require(len(stale_expectations) == 5, "272_STALE_EXPECTATION_COUNT_DRIFT")

    stable = queue_expectations[1]
    require(
        stable["firstRowOrderHash"] == stable["secondRowOrderHash"],
        "272_STABLE_REPLAY_HASH_MISMATCH",
    )
    require(
        stable["heldEligibilityState"] == "held_preemption",
        "272_PREEMPTION_HOLD_DRIFT",
    )
    overload = next(
        entry for entry in queue_expectations if entry["scenarioId"] == "overload_critical_posture"
    )
    require(
        overload["fairnessPromiseState"] == "suppressed_overload",
        "272_OVERLOAD_PROMISE_DRIFT",
    )
    suggestions = next(
        entry
        for entry in queue_expectations
        if entry["scenarioId"] == "reviewer_suggestion_downstream_only"
    )
    require(
        suggestions["suggestionSnapshotId"] == "command_api_phase3_queue_engine_queueAssignmentSuggestionSnapshot_0001",
        "272_SUGGESTION_SNAPSHOT_DRIFT",
    )

    review_required = next(
        entry for entry in duplicate_expectations if entry["scenarioId"] == "review_required_snapshot"
    )
    require(
        review_required["authorityBoundary"]["duplicateClusterAuthority"] == "DuplicateCluster",
        "272_DUPLICATE_AUTHORITY_DRIFT",
    )
    reversal = next(
        entry
        for entry in duplicate_expectations
        if entry["scenarioId"] == "reversal_invalidates_downstream"
    )
    require(
        "approval_checkpoint" in reversal["invalidationTargetTypes"]
        and "handoff_seed" in reversal["invalidationTargetTypes"],
        "272_DUPLICATE_INVALIDATION_DRIFT",
    )

    takeover = next(
        entry
        for entry in stale_expectations
        if entry["scenarioId"] == "supervisor_takeover_committed"
    )
    require(takeover["ownershipEpoch"] == 2, "272_TAKEOVER_OWNERSHIP_EPOCH_DRIFT")
    blocked_next = next(
        entry
        for entry in stale_expectations
        if entry["scenarioId"] == "next_task_advice_blocked_on_stale_owner"
    )
    require(
        blocked_next["advisoryState"] == "blocked_stale_owner",
        "272_NEXT_TASK_BLOCK_REASON_DRIFT",
    )
    require(
        blocked_next["blockedReasonRefs"] == ["stale_owner_recovery_required"],
        "272_NEXT_TASK_BLOCKED_REASONS_DRIFT",
    )

    for token in [
        "Queue_Fairness_Recovery_Lab",
        "queue ordering is deterministic, explainable, and replayable",
        "duplicate review stays bound to `DuplicateReviewSnapshot`",
        "stale-owner recovery and supervisor takeover preserve launch context",
        "python3 /Users/test/Code/V/tools/test/validate_272_queue_fairness_duplicate_stale_owner_suite.py",
    ]:
        require(token in suite_doc, f"272_SUITE_DOC_MARKER_MISSING:{token}")

    for token in [
        "15` explicit case rows",
        "Queue replay and determinism",
        "Duplicate authority and supersession",
        "Claim, stale-owner, and continuity",
    ]:
        require(token in case_matrix_doc, f"272_CASE_MATRIX_MARKER_MISSING:{token}")

    for token in [
        "Queue_Fairness_Recovery_Lab",
        "ScenarioFamilyRail",
        "RankReplayWorkbench",
        "FairnessCreditBoard",
        "DuplicateEvidenceCompare",
        "OwnershipEpochLadder",
        "DefectAndRemediationPanel",
        "QFR272_015",
    ]:
        require(token in lab, f"272_LAB_MARKER_MISSING:{token}")

    for token in [
        "validateQueueConsumerSnapshotRefs",
        "fact_cut_custom",
        "queue-row-order::350468f55e725562872644da2eddbbd2",
        "DuplicateCluster",
        "blocked_stale_owner",
        "lease_release_requested",
    ]:
        require(token in service_test, f"272_SERVICE_TEST_MARKER_MISSING:{token}")

    for token in [
        "keeps reviewer suggestions downstream of canonical order",
        "suppresses fairness promises under overload-critical posture",
        "rejects mixed snapshot refs across rows, preview, and next-task candidates",
    ]:
        require(token in queue_ranking_test, f"272_QUEUE_RANKING_GROUNDING_MISSING:{token}")

    script_token = (
        '"validate:272-queue-fairness-duplicate-stale-owner-suite": '
        '"python3 ./tools/test/validate_272_queue_fairness_duplicate_stale_owner_suite.py"'
    )
    require(script_token in root_package_text, "272_PACKAGE_SCRIPT_MISSING")
    require(
        ROOT_SCRIPT_UPDATES.get("validate:272-queue-fairness-duplicate-stale-owner-suite")
        == "python3 ./tools/test/validate_272_queue_fairness_duplicate_stale_owner_suite.py",
        "272_ROOT_SCRIPT_UPDATES_MISSING",
    )

    print(
        json.dumps(
            {
                "queueCaseCount": len(queue_rows),
                "duplicateCaseCount": len(duplicate_rows),
                "staleCaseCount": len(stale_rows),
                "playwrightSpecCount": len(PLAYWRIGHT_PATHS),
                "browserProofArtifacts": results["browserProofArtifacts"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
