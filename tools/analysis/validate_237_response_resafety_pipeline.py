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

ARCH_DOC = ROOT / "docs" / "architecture" / "237_more_info_response_assimilation_and_resafety.md"
SECURITY_DOC = ROOT / "docs" / "security" / "237_response_classification_and_safety_preemption.md"
OPS_DOC = ROOT / "docs" / "operations" / "237_response_ingestion_and_supervisor_churn_guard.md"

DISPOSITION_MATRIX = ROOT / "data" / "analysis" / "237_response_disposition_matrix.csv"
OUTCOME_CASES = ROOT / "data" / "analysis" / "237_resafety_outcome_cases.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "237_response_replay_and_oscillation_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "237_gap_log.json"

DOMAIN_SOURCE = (
    ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-more-info-response-resafety.ts"
)
DOMAIN_TEST = (
    ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-more-info-response-resafety.test.ts"
)
TRIAGE_SOURCE = (
    ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-triage-kernel.ts"
)
COMMAND_API_SOURCE = (
    ROOT / "services" / "command-api" / "src" / "phase3-more-info-response-resafety.ts"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = (
    ROOT / "services" / "command-api" / "migrations" / "113_phase3_more_info_response_resafety.sql"
)
INTEGRATION_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "phase3-more-info-response-resafety.integration.test.js"
)


def fail(message: str) -> None:
    raise SystemExit(f"[237-response-resafety-pipeline] {message}")


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
    for task_id in range(230, 237):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not marked complete")
    if not re.search(
        r"^- \[[Xx]\] par_237_phase3_track_backend_build_response_assimilation_material_delta_assessment_and_canonical_resafety",
        checklist,
        re.MULTILINE,
    ):
        fail("task 237 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "MoreInfoResponseDisposition",
            "ResponseAssimilationRecord",
            "MoreInfoSupervisorReviewRequirement",
            "accepted_in_window",
            "accepted_late_review",
            "blocked_repair",
            "superseded_duplicate",
            "expired_rejected",
            "synthetic triage command witness",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "potentially_clinical",
            "contact_safety_relevant",
            "fail closed",
            "SafetyPreemptionRecord",
            "urgent_diversion_required",
            "do not show stale calm reassurance",
        ],
    )
    require_text(
        OPS_DOC,
        [
            "receiveMoreInfoReply",
            "semantic replay",
            "current-cycle drift",
            "MoreInfoSupervisorReviewRequirement",
            "simulator-backed",
        ],
    )


def validate_analysis() -> None:
    disposition_rows = load_csv(DISPOSITION_MATRIX)
    if {row["caseId"] for row in disposition_rows} != {
        "ACCEPTED_IN_WINDOW_OPEN",
        "ACCEPTED_LATE_REVIEW_CURRENT",
        "BLOCKED_REPAIR_CONTACT_ROUTE",
        "SUPERSEDED_DUPLICATE_REPLAY",
        "EXPIRED_REJECTED_CLOSED_REQUEST",
    }:
        fail("237_response_disposition_matrix.csv drifted from the expected case set")

    outcome_rows = load_csv(OUTCOME_CASES)
    if {row["caseId"] for row in outcome_rows} != {
        "URGENT_RETURN_ESCALATES_TASK",
        "RESIDUAL_RETURN_REVIEW_RESUMED_AND_QUEUED",
        "BLOCKED_REPAIR_STOPS_ASSIMILATION",
        "CONTACT_SAFETY_CLASSIFICATION_FAILS_CLOSED",
        "TECHNICAL_ONLY_REPLY_STILL_USES_CANONICAL_RECEIPT",
    }:
        fail("237_resafety_outcome_cases.csv drifted from the expected case set")

    replay_rows = load_csv(REPLAY_CASES)
    if {row["caseId"] for row in replay_rows} != {
        "IDEMPOTENT_REPLAY_REUSES_DISPOSITION",
        "SEMANTIC_REPLAY_REUSES_ASSIMILATION",
        "DRIFT_BEFORE_COMMIT_FAILS_CLOSED",
        "FOURTH_REOPEN_SUPERVISOR_REVIEW",
        "CLINICIAN_RESOLUTION_RESETS_OSCILLATION_WINDOW",
    }:
        fail("237_response_replay_and_oscillation_cases.csv drifted from the expected case set")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 1:
        fail("237_gap_log.json must contain exactly one accepted gap")
    for field in [
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not gaps[0].get(field):
            fail(f"237 gap entry missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            'export type MoreInfoResponseDispositionClass =',
            '"accepted_in_window"',
            '"accepted_late_review"',
            '"blocked_repair"',
            '"superseded_duplicate"',
            '"expired_rejected"',
            "evaluateMoreInfoResponseChurnGuard",
            "findAssimilationByDispositionRef",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "resolves the exact required disposition vocabulary from checkpoint and cycle posture",
            "builds stable payload and replay hashes for exact reply replay detection",
            "suppresses automatic requeue after more than three reopen cycles inside twenty-four hours without a stable clear",
        ],
    )
    require_text(
        TRIAGE_SOURCE,
        [
            'awaiting_patient_info: ["review_resumed", "escalated"]',
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_MORE_INFO_RESPONSE_RESAFETY_SERVICE_NAME",
            "workspace_task_receive_more_info_reply",
            "workspace_task_run_more_info_resafety",
            "transitionAwaitingPatientInfoTask",
            "synchronizeTaskLineageFence",
            "supervisor_review_required",
            "findAssimilationByDispositionRef",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_receive_more_info_reply",
            "/v1/workspace/tasks/{taskId}/more-info/{cycleId}:receive-reply",
            "workspace_task_run_more_info_resafety",
            "workspace_task_mark_more_info_supervisor_review_required",
        ],
    )
    require_text(
        MIGRATION,
        [
            "CREATE TABLE IF NOT EXISTS phase3_more_info_response_dispositions",
            "CREATE TABLE IF NOT EXISTS phase3_response_assimilation_records",
            "CREATE TABLE IF NOT EXISTS phase3_more_info_supervisor_review_requirements",
            "idx_phase3_more_info_response_dispositions_idempotency",
            "idx_phase3_response_assimilation_disposition_ref",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 more-info response resafety seam",
            "routes accepted urgent patient replies through canonical assimilation and returns the task to escalated handling",
            "keeps blocked repair replies explicit and durable without minting new evidence",
            "reuses the same settled response path for semantic replay instead of minting a second assimilation",
            "suppresses automatic requeue and records supervisor review after repeated reopen oscillation",
            "fails closed when the current cycle drifts before assimilation commit and leaves no reply assimilation record behind",
        ],
    )


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:237-response-resafety-pipeline": "python3 ./tools/analysis/validate_237_response_resafety_pipeline.py"',
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:237-response-resafety-pipeline": "python3 ./tools/analysis/validate_237_response_resafety_pipeline.py"',
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_script_registry()


if __name__ == "__main__":
    main()
