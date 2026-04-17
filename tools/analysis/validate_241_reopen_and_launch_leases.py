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

ARCH_DOC = ROOT / "docs" / "architecture" / "241_reopen_mechanics_and_next_task_launch_leases.md"
SECURITY_DOC = ROOT / "docs" / "security" / "241_reopen_recovery_and_launch_lease_fencing.md"
OPS_DOC = ROOT / "docs" / "operations" / "241_reopen_and_next_task_launch_runbook.md"

REOPEN_MATRIX = ROOT / "data" / "analysis" / "241_reopen_reason_and_source_matrix.csv"
LEASE_MATRIX = ROOT / "data" / "analysis" / "241_launch_lease_and_queue_snapshot_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "241_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-reopen-launch-kernel.ts"
TRIAGE_DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-triage-kernel.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-reopen-launch-kernel.test.ts"
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
PUBLIC_API_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"

TRIAGE_APPLICATION = ROOT / "services" / "command-api" / "src" / "phase3-triage-kernel.ts"
COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-reopen-launch-leases.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "117_phase3_reopen_and_next_task_launch_leases.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-reopen-launch-leases.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[241-reopen-launch-leases] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(
        r"^- \[[Xx]\] par_241_phase3_track_backend_build_reopen_mechanics_stale_owner_recovery_and_next_task_launch_leases",
        checklist,
        re.MULTILINE,
    ):
        fail("task 241 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
          "TriageReopenRecord",
          "DecisionSupersessionRecord",
          "NextTaskLaunchLease",
          "TASK_241_QUEUE_RECALC_REQUIRED",
          "reopen_reacquire",
          "no auto-advance",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
          "stale-owner recovery",
          "continuity_blocked",
          "TASK_241_CONTINUITY_DRIFT",
          "TASK_241_STALE_OWNER_RECOVERY",
          "No auto-advance",
        ],
    )
    require_text(
        OPS_DOC,
        [
          ":reopen-from-resolved",
          ":reopen-from-handoff",
          ":reopen-from-invalidation",
          ":issue-next-task-launch-lease",
          ":validate-next-task-launch-lease",
          "TASK_241_QUEUE_RECALC_REQUIRED",
        ],
    )


def validate_analysis() -> None:
    reopen_rows = load_csv(REOPEN_MATRIX)
    if {row["caseId"] for row in reopen_rows} != {
        "RESOLVED_CALLBACK_BOUNCE",
        "RESOLVED_MESSAGE_BOUNCE",
        "HANDOFF_BOOKING_BOUNCE",
        "HANDOFF_PHARMACY_BOUNCE",
        "APPROVAL_INVALIDATED",
        "MATERIAL_EVIDENCE_INVALIDATION",
    }:
        fail("241_reopen_reason_and_source_matrix.csv drifted from the required reopen coverage")

    lease_rows = load_csv(LEASE_MATRIX)
    if {row["caseId"] for row in lease_rows} != {
        "LEASE_READY",
        "QUEUE_SNAPSHOT_DRIFT",
        "SETTLEMENT_DRIFT",
        "CONTINUITY_DRIFT",
        "RETURN_ANCHOR_DRIFT",
        "OWNERSHIP_DRIFT",
        "PUBLICATION_DRIFT",
        "TRUST_DRIFT",
        "LEASE_EXPIRED",
    }:
        fail("241_launch_lease_and_queue_snapshot_cases.csv drifted from the required launch-lease coverage")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if gap_log.get("status") != "accepted_gaps_only":
        fail("241_gap_log.json must declare accepted_gaps_only status")
    if len(gaps) != 2:
        fail("241_gap_log.json must contain exactly two accepted gaps")
    for gap in gaps:
        for field in [
            "gapId",
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not gap.get(field):
                fail(f"241 gap entry missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "NextTaskLaunchLeaseSnapshot",
            "recordGovernedReopen",
            "issueNextTaskLaunchLease",
            "validateNextTaskLaunchLease",
            "TASK_241_CONTINUITY_DRIFT",
            "TASK_241_RETURN_ANCHOR_DRIFT",
        ],
    )
    require_text(
        TRIAGE_DOMAIN_SOURCE,
        [
            "presented claim context is stale",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "NextTaskLaunchLease",
            "Phase3ReopenLaunchKernelService",
            'export * from "./phase3-reopen-launch-kernel";',
        ],
    )
    require_text(
        PUBLIC_API_TEST,
        [
            "createPhase3ReopenLaunchKernelStore",
            "createPhase3ReopenLaunchKernelService",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "keeps one authoritative reopen record and deduplicates replay for the same bounce-back tuple",
            "issues one ready NextTaskLaunchLease from stable source context and preserves return-anchor posture",
            "degrades the launch lease to stale or continuity_blocked when queue or continuity truth drifts",
        ],
    )
    require_text(
        TRIAGE_APPLICATION,
        [
            "releaseDetachedReopenLeaseIfNeeded",
            "closeBlockReason: \"reopen_reacquire\"",
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_REOPEN_LAUNCH_SERVICE_NAME",
            "workspace_task_reopen_from_resolved",
            "workspace_task_reopen_from_handoff",
            "workspace_task_issue_next_task_launch_lease",
            "reconcileSupersededConsequences",
            "TASK_241_QUEUE_RECALC_REQUIRED",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_reopen_launch_current",
            "workspace_task_reopen_from_resolved",
            "workspace_task_reopen_from_handoff",
            "workspace_task_reopen_from_invalidation",
            "workspace_task_issue_next_task_launch_lease",
            "workspace_task_validate_next_task_launch_lease",
            "workspace_task_invalidate_next_task_launch_lease",
        ],
    )
    require_text(
        MIGRATION,
        [
            "idx_phase3_triage_reopen_records_task_source_reopened",
            "phase3_next_task_launch_leases",
            "idx_phase3_next_task_launch_leases_live_candidate",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "reopens from resolved direct outcome, recalculates priority and urgency floor, and keeps replay idempotent",
            "reopens from handoff bounce-back and preserves lineage to the invalidated booking path",
            "issues a ready NextTaskLaunchLease, degrades it on drift, and does not infer calm completion from issuance alone",
            "blocks next-task launch when stale-owner recovery is open on reopen-sensitive work",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:241-reopen-launch-leases": "python3 ./tools/analysis/validate_241_reopen_and_launch_leases.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:241-reopen-launch-leases": "python3 ./tools/analysis/validate_241_reopen_and_launch_leases.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
