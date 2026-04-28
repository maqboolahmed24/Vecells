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

ARCH_DOC = ROOT / "docs" / "architecture" / "234_duplicate_review_authority_and_resolution_decisions.md"
SECURITY_DOC = ROOT / "docs" / "security" / "234_duplicate_decision_audit_and_lineage_invalidation.md"
SNAPSHOT_SCHEMA = ROOT / "data" / "contracts" / "234_duplicate_review_snapshot.schema.json"
COMMAND_CONTRACT = ROOT / "data" / "contracts" / "234_duplicate_resolution_command_contract.json"
DECISION_CASES = ROOT / "data" / "analysis" / "234_duplicate_decision_cases.csv"
INVALIDATION_CASES = ROOT / "data" / "analysis" / "234_duplicate_invalidation_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_DUPLICATE_REVIEW.json"

DOMAIN_BACKBONE = ROOT / "packages" / "domains" / "identity_access" / "src" / "duplicate-review-backbone.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "identity_access" / "tests" / "duplicate-review-backbone.test.ts"
TRIAGE_KERNEL = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-triage-kernel.ts"
COMMAND_API = ROOT / "services" / "command-api" / "src" / "duplicate-review.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "duplicate-review.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "111_phase3_duplicate_review_projection_and_invalidation.sql"


def fail(message: str) -> None:
    raise SystemExit(f"[234-duplicate-authority] {message}")


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
    for task_id in range(230, 234):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not complete as required for 234")
    if not re.search(
        r"^- \[[Xx-]\] par_234_phase3_track_backend_build_duplicate_pair_evidence_duplicate_review_snapshot_and_resolution_decisions",
        checklist,
        re.MULTILINE,
    ):
        fail("par_234 is not in the required state")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
          "DuplicatePairEvidence",
          "DuplicateReviewSnapshot",
          "DuplicateResolutionDecision",
          "GET /v1/workspace/tasks/{taskId}/duplicate-review",
          "POST /internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve",
          "booking_intent",
          "pharmacy_intent",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
          "same_request_attach requires an explicit continuity witness",
          "Replay recognition still belongs to `IdempotencyRecord`.",
          "stale approvals",
          "stale endpoint previews",
          "stable `decisionSupersessionRecordRef` seam",
        ],
    )


def validate_contracts() -> None:
    snapshot_schema = load_json(SNAPSHOT_SCHEMA)
    required_fields = set(snapshot_schema.get("required", []))
    for field in [
        "duplicateReviewSnapshotId",
        "taskId",
        "duplicateClusterRef",
        "currentResolutionDecisionRef",
        "currentDecisionClass",
        "authorityBoundary",
        "queueRelevance",
        "workspaceRelevance",
        "currentInvalidationBurden",
    ]:
        if field not in required_fields:
            fail(f"snapshot schema missing required field {field}")

    command_contract = load_json(COMMAND_CONTRACT)
    command_required = set(command_contract.get("required", []))
    for field in [
        "taskId",
        "duplicateReviewSnapshotRef",
        "decisionClass",
        "winningPairEvidenceRef",
        "reviewMode",
        "reasonCodes",
        "decidedByRef",
        "decidedAt",
    ]:
        if field not in command_required:
            fail(f"command contract missing required field {field}")


def validate_analysis() -> None:
    decision_rows = load_csv(DECISION_CASES)
    expected_decision_cases = {
        "EXACT_RETRY_COLLAPSE_REMAINS_REPLAY_BOUNDARY",
        "SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
        "SAME_EPISODE_LINK_STAYS_DISTINCT",
        "RELATED_EPISODE_LINK_STAYS_DISTINCT",
        "SEPARATE_REQUEST_CAN_SUPERSEDE_PRIOR_ATTACH",
        "REVIEW_REQUIRED_REMAINS_EXPLICIT",
    }
    if {row["caseId"] for row in decision_rows} != expected_decision_cases:
        fail("234_duplicate_decision_cases.csv drifted from the expected case set")

    invalidation_rows = load_csv(INVALIDATION_CASES)
    expected_invalidation_cases = {
        "SUPERSEDED_ATTACH_STALE_APPROVALS",
        "SUPERSEDED_ATTACH_STALE_SEEDS",
        "SUPERSEDED_ATTACH_STALE_WORKSPACE_ASSUMPTIONS",
        "SUPERSEDED_RELATED_LINK_STALE_ANALYTICS",
    }
    if {row["caseId"] for row in invalidation_rows} != expected_invalidation_cases:
        fail("234_duplicate_invalidation_cases.csv drifted from the expected case set")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 1:
        fail("PARALLEL_INTERFACE_GAP_PHASE3_DUPLICATE_REVIEW.json must contain one explicit seam")
    for key in [
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not gaps[0].get(key):
            fail(f"gap entry missing {key}")


def validate_source_files() -> None:
    require_text(
        DOMAIN_BACKBONE,
        [
          "DuplicateReviewSnapshotDocument",
          "DuplicateConsequenceInvalidationRecordDocument",
          "createPhase3DuplicateReviewStore",
          "createPhase3DuplicateReviewAuthorityService",
          "sameRequestAttachAuthority: \"DuplicateResolutionDecision\"",
          "endpoint_outcome_preview",
          "booking_intent",
          "pharmacy_intent",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
          "publishes a task-scoped DuplicateReviewSnapshot with explicit authority boundaries",
          "emits append-only invalidation records when duplicate truth is overturned",
        ],
    )
    require_text(
        TRIAGE_KERNEL,
        [
          "duplicateClusterRef: string | null;",
          "duplicateClusterRef: optionalRef(snapshot.duplicateClusterRef)",
        ],
    )
    require_text(
        COMMAND_API,
        [
          "PHASE3_DUPLICATE_REVIEW_SERVICE_NAME",
          "workspace_task_duplicate_review_current",
          "workspace_task_duplicate_review_resolve",
          "queryTaskDuplicateReview",
          "resolveTaskDuplicateReview",
          "phase3DuplicateReviewScenarioIds",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
          "workspace_task_duplicate_review_current",
          "/v1/workspace/tasks/{taskId}/duplicate-review",
          "workspace_task_duplicate_review_resolve",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
          "phase 3 duplicate review application seam",
          "requires the latest snapshot and emits explicit stale-consequence invalidations on reversal",
          "retry_authority_boundary",
        ],
    )
    require_text(
        MIGRATION,
        [
          "CREATE TABLE IF NOT EXISTS phase3_duplicate_review_snapshots",
          "CREATE TABLE IF NOT EXISTS phase3_duplicate_consequence_invalidations",
        ],
    )


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:234-duplicate-authority": "python3 ./tools/analysis/validate_234_duplicate_authority.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:234-duplicate-authority": "python3 ./tools/analysis/validate_234_duplicate_authority.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contracts()
    validate_analysis()
    validate_source_files()
    validate_script_registry()
    print("234 duplicate authority validation passed.")


if __name__ == "__main__":
    main()
