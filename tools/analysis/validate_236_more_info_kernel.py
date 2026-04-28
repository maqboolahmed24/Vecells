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

ARCH_DOC = ROOT / "docs" / "architecture" / "236_more_info_cycle_checkpoint_and_reminder_scheduler.md"
SECURITY_DOC = ROOT / "docs" / "security" / "236_more_info_timer_grant_and_reminder_controls.md"
RUNBOOK = ROOT / "docs" / "operations" / "236_more_info_worker_runbook.md"

CYCLE_SCHEMA = ROOT / "data" / "contracts" / "236_more_info_cycle.schema.json"
CHECKPOINT_SCHEMA = ROOT / "data" / "contracts" / "236_more_info_reply_window_checkpoint.schema.json"
SCHEDULE_SCHEMA = ROOT / "data" / "contracts" / "236_more_info_reminder_schedule.schema.json"
OUTBOX_SCHEMA = ROOT / "data" / "contracts" / "236_more_info_outbox_entry.schema.json"

POLICY_MATRIX = ROOT / "data" / "analysis" / "236_reply_window_policy_matrix.csv"
CASE_MATRIX = ROOT / "data" / "analysis" / "236_supersession_reminder_and_repair_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "236_gap_log.json"

DOMAIN_KERNEL = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-more-info-kernel.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-more-info-kernel.test.ts"
COMMAND_API = ROOT / "services" / "command-api" / "src" / "phase3-more-info-kernel.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "112_phase3_more_info_cycle_kernel.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-more-info-kernel.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[236-more-info-kernel] {message}")


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
    for task_id in range(230, 236):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not marked complete")
    if not re.search(
        r"^- \[[Xx]\] par_236_phase3_track_backend_build_more_info_cycle_reply_window_checkpoint_and_reminder_scheduler",
        checklist,
        re.MULTILINE,
    ):
        fail("task 236 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "MoreInfoCycle",
            "MoreInfoReplyWindowCheckpoint",
            "MoreInfoReminderSchedule",
            "GET /v1/workspace/tasks/{taskId}/more-info",
            "POST /v1/workspace/tasks/{taskId}:request-more-info",
            "computeMoreInfoWorkerEffectKey",
            "callback_fallback_seed",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "grant expiry may narrow entry posture, but it may not redefine cycle truth",
            "respond_more_info",
            "quiet-hours suppression is explicit",
            "transactional outbox",
        ],
    )
    require_text(
        RUNBOOK,
        [
            "drainReminderWorker",
            "authoritative server time",
            "callback-fallback seed",
            "simulator-backed",
        ],
    )


def validate_contracts() -> None:
    cycle = load_json(CYCLE_SCHEMA)
    checkpoint = load_json(CHECKPOINT_SCHEMA)
    schedule = load_json(SCHEDULE_SCHEMA)
    outbox = load_json(OUTBOX_SCHEMA)

    for field in [
        "cycleId",
        "state",
        "activeCheckpointRef",
        "reminderScheduleRef",
        "currentLineageFenceEpoch",
    ]:
        if field not in set(cycle.get("required", [])):
            fail(f"cycle schema missing required field {field}")

    for field in ["checkpointId", "replyWindowState", "dueAt", "expiresAt", "checkpointRevision"]:
        if field not in set(checkpoint.get("required", [])):
            fail(f"checkpoint schema missing required field {field}")

    for field in ["scheduleId", "scheduleState", "reminderOffsetsMinutes", "callbackFallbackState"]:
        if field not in set(schedule.get("required", [])):
            fail(f"schedule schema missing required field {field}")

    for field in ["outboxEntryId", "effectType", "effectKey", "dispatchState"]:
        if field not in set(outbox.get("required", [])):
            fail(f"outbox schema missing required field {field}")


def validate_analysis() -> None:
    policy_rows = load_csv(POLICY_MATRIX)
    expected_policy_cases = {
        "STANDARD_SMS_REPLY",
        "QUIET_HOURS_DEFER",
        "REPAIR_BLOCKED",
        "LATE_REVIEW_ACCEPT",
        "NO_REMINDERS_POLICY",
    }
    if {row["caseId"] for row in policy_rows} != expected_policy_cases:
        fail("236_reply_window_policy_matrix.csv drifted from the expected case set")

    case_rows = load_csv(CASE_MATRIX)
    expected_case_rows = {
        "EXPLICIT_SUPERSESSION_BEFORE_REPLACEMENT",
        "CANCELLATION_SETTLES_ACTIONABILITY",
        "QUIET_HOURS_DELAY_REPLAY_SAFE",
        "CALLBACK_FALLBACK_SEAM",
        "EXPLICIT_EXPIRY_RELEASE",
        "DELIVERED_REMINDER_SEND",
    }
    if {row["caseId"] for row in case_rows} != expected_case_rows:
        fail("236_supersession_reminder_and_repair_cases.csv drifted from the expected case set")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 1:
        fail("236_gap_log.json must contain exactly one accepted gap")
    for field in [
        "gapId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not gaps[0].get(field):
            fail(f"236 gap entry missing {field}")


def validate_source_files() -> None:
    require_text(
        DOMAIN_KERNEL,
        [
            "export type MoreInfoCycleState",
            "export type MoreInfoReplyWindowState",
            "export type MoreInfoReminderScheduleState",
            "findActiveCheckpointForLineage",
            "computeMoreInfoWorkerEffectKey",
            'replyWindowState: "settled"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "creates one authoritative checkpoint and requires explicit supersession before a replacement cycle",
            "settles the checkpoint on cancellation so a lineage can open a fresh cycle",
            "keeps quiet-hours release and worker effect keys replay-safe",
        ],
    )
    require_text(
        COMMAND_API,
        [
            "PHASE3_MORE_INFO_SERVICE_NAME",
            "PHASE3_MORE_INFO_SCHEMA_VERSION",
            "phase3MoreInfoRoutes",
            "workspace_task_request_more_info",
            "markReminderDue",
            "dispatchReminder",
            "suppressReminder",
            "expireCycle",
            "workspace_more_info_worker_drain",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_more_info_current",
            "/v1/workspace/tasks/{taskId}/more-info",
            "workspace_task_request_more_info",
            "/v1/workspace/tasks/{taskId}:request-more-info",
            "workspace_task_dispatch_more_info_reminder",
            "workspace_more_info_worker_drain",
        ],
    )
    require_text(
        MIGRATION,
        [
            "CREATE TABLE IF NOT EXISTS phase3_more_info_cycles",
            "CREATE TABLE IF NOT EXISTS phase3_more_info_reply_window_checkpoints",
            "CREATE TABLE IF NOT EXISTS phase3_more_info_reminder_schedules",
            "CREATE TABLE IF NOT EXISTS phase3_more_info_outbox_entries",
            "idx_phase3_more_info_one_live_checkpoint_per_lineage",
            "idx_phase3_more_info_outbox_effect_key",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 more-info kernel application seam",
            "publishes the 236 request-more-info, recompute, reminder, and worker surfaces against triage tasks",
            "requires explicit supersession before replacement and keeps the task in awaiting_patient_info on replacement",
            "suppresses quiet-hours reminders and stays replay-safe across worker restarts",
            "seeds callback fallback once under blocked reachability and releases lease plus grant on explicit expiry",
        ],
    )


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:236-more-info-kernel": "python3 ./tools/analysis/validate_236_more_info_kernel.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:236-more-info-kernel": "python3 ./tools/analysis/validate_236_more_info_kernel.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contracts()
    validate_analysis()
    validate_source_files()
    validate_script_registry()


if __name__ == "__main__":
    main()
