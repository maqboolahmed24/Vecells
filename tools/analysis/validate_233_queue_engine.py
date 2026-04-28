#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

ARCH_DOC = ROOT / "docs" / "architecture" / "233_deterministic_queue_engine_and_assignment_suggestions.md"
SECURITY_DOC = ROOT / "docs" / "security" / "233_queue_overload_honesty_and_claim_fencing.md"
GOLDEN_FIXTURES = ROOT / "data" / "analysis" / "233_queue_golden_fixtures.csv"
ASSIGNMENT_CASES = ROOT / "data" / "analysis" / "233_assignment_and_overload_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_QUEUE_ENGINE.json"

API_CONTRACTS = ROOT / "packages" / "api-contracts" / "src" / "queue-ranking.ts"
API_TEST = ROOT / "packages" / "api-contracts" / "tests" / "queue-ranking.test.ts"
DOMAIN_BACKBONE = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "reservation-queue-control-backbone.ts"
)
DOMAIN_TEST = (
    ROOT / "packages" / "domains" / "identity_access" / "tests" / "reservation-queue-control-backbone.test.ts"
)
COMMAND_API = ROOT / "services" / "command-api" / "src" / "queue-ranking.ts"
COMMAND_API_QUEUE_CONTROL = ROOT / "services" / "command-api" / "src" / "reservation-queue-control.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "queue-ranking.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[233-queue-engine] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(220, 233):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if task_id == 233:
            pattern = r"^- \[[Xx-]\] par_233_phase3_track_backend_build_deterministic_queue_engine_queue_rank_snapshots_and_assignment_suggestions"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not in the required state for 233")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "QueueRankPlan",
            "QueueAssignmentSuggestionSnapshot",
            "softClaimTask",
            "GET /v1/workspace/queues/{queueKey}",
            "rho_crit < rho_guard",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "overload_critical",
            "ownershipEpoch",
            "fencingToken",
            "lineageFenceEpoch",
            "reviewer fit is advisory only",
        ],
    )


def validate_analysis() -> None:
    golden_rows = load_csv(GOLDEN_FIXTURES)
    if len(golden_rows) < 10:
        fail("233_queue_golden_fixtures.csv must publish the deterministic queue golden set")
    scenario_ids = {row["scenarioId"] for row in golden_rows}
    expected_scenarios = {
        "exact_formula_sort_precedence",
        "fairness_band_rotation",
        "overload_critical_posture",
        "soft_claim_race_serialized",
    }
    if not expected_scenarios.issubset(scenario_ids):
        fail("golden fixtures drifted from the expected scenario coverage")

    assignment_rows = load_csv(ASSIGNMENT_CASES)
    expected_case_ids = {
        "ASSIGNMENT_HINTS_DOWNSTREAM_ONLY",
        "ASSIGNMENT_AUTOCLAIM_MARGIN",
        "OVERLOAD_PROMISE_SUPPRESSION",
        "SOFT_CLAIM_RACE",
        "SOFT_CLAIM_FROZEN_WORKSPACE",
        "FAIL_CLOSED_UNKNOWN_BAND",
    }
    if {row["caseId"] for row in assignment_rows} != expected_case_ids:
        fail("233_assignment_and_overload_cases.csv drifted from the expected case set")

    gap_log = load_json(GAP_LOG)
    gap_ids = {entry["gapId"] for entry in gap_log.get("gaps", [])}
    expected_gap_ids = {
        "GAP_233_DUPLICATE_REVIEW_AUTHORITY_FEED",
        "GAP_233_MORE_INFO_RETURN_AND_CONTINUITY_FEED",
    }
    if gap_ids != expected_gap_ids:
        fail("PARALLEL_INTERFACE_GAP_PHASE3_QUEUE_ENGINE.json drifted from the expected seam set")
    for entry in gap_log.get("gaps", []):
        for key in [
            "taskId",
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not entry.get(key):
                fail(f"gap entry {entry.get('gapId', 'unknown')} is missing {key}")


def validate_source_files() -> None:
    require_text(
        API_CONTRACTS,
        [
            "queue_rank_plan::phase3_v1",
            "band_returned_review",
            "band_risk_attention",
            "band_routine",
            "band_low_intensity",
            "lambda_skill",
            "epsilon_assign",
            "QUEUE_FACT_CUT_UNKNOWN_FAIRNESS_BAND",
        ],
    )
    require_text(
        API_TEST,
        [
            "computes within-tier urgency from the frozen 227 formula and constants",
            "fails closed when a task references an unsupported fairness band",
            "rotates non-critical work through deterministic fairness bands",
        ],
    )
    require_text(
        DOMAIN_BACKBONE,
        [
            "getLatestQueueRankSnapshotByQueue",
            "getLatestQueueAssignmentSuggestionByRankSnapshotRef",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "commits snapshots, escalates overload, and preserves base queue in suggestions",
            "publishes the deterministic scenario harness required by later tracks",
        ],
    )
    require_text(
        COMMAND_API,
        [
            "PHASE3_QUEUE_ENGINE_SERVICE_NAME",
            "workspace_queue_current",
            "workspace_queue_soft_claim",
            "softClaimTask(",
            "createPhase3TriageKernelApplication",
            "soft_claim_race_serialized",
        ],
    )
    require_text(
        COMMAND_API_QUEUE_CONTROL,
        [
            "reservationQueueControlQueuePlanRef",
            "reservationQueueControlQueueFamilyRef",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_queue_current",
            "/v1/workspace/queues/{queueKey}",
            "workspace_queue_soft_claim",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase3 queue engine command-api seam",
            "soft_claim_race_serialized",
            "not currently writable",
        ],
    )


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:233-queue-engine": "python3 ./tools/analysis/validate_233_queue_engine.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:233-queue-engine": "python3 ./tools/analysis/validate_233_queue_engine.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_source_files()
    validate_script_registry()
    print("233 queue engine validation passed.")


if __name__ == "__main__":
    main()
