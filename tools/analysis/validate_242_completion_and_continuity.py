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

ARCH_DOC = ROOT / "docs" / "architecture" / "242_task_completion_settlement_and_workspace_continuity.md"
SECURITY_DOC = ROOT / "docs" / "security" / "242_completion_calmness_and_continuity_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "242_completion_and_next_task_readiness_runbook.md"

COMPLETION_MATRIX = ROOT / "data" / "analysis" / "242_completion_state_matrix.csv"
CONTINUITY_MATRIX = ROOT / "data" / "analysis" / "242_continuity_validation_and_launch_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "242_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-task-completion-continuity-kernel.ts"
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
PUBLIC_API_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "public-api.test.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-task-completion-continuity-kernel.test.ts"

COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-task-completion-continuity.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "118_phase3_task_completion_and_workspace_continuity.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-task-completion-continuity.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[242-completion-continuity] {message}")


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
        r"^- \[[Xx]\] par_242_phase3_track_backend_build_task_completion_settlement_and_workspace_continuity_evidence_projection",
        checklist,
        re.MULTILINE,
    ):
        fail("task 242 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "TaskCompletionSettlementEnvelope",
            "OperatorHandoffFrame",
            "WorkspaceContinuityEvidenceProjection",
            "TaskCompletionSettlementEnvelope.authoritativeSettlementState",
            "TASK_242_NEXT_TASK_GATED",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "task complete means calm UI",
            "TASK_242_NEXT_TASK_LEASE_REQUIRED",
            "WORKSPACE_232_QUEUE_SNAPSHOT_DRIFT",
            "completionCalmState = pending_settlement | blocked",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":settle-completion",
            ":record-manual-handoff",
            ":compute-continuity-evidence",
            ":evaluate-next-task-readiness",
            ":invalidate-stale-continuity",
        ],
    )


def validate_analysis() -> None:
    completion_rows = load_csv(COMPLETION_MATRIX)
    if {row["caseId"] for row in completion_rows} != {
        "DIRECT_SETTLED_NO_LEASE",
        "DIRECT_SETTLED_READY",
        "HANDOFF_BOOKING_PENDING",
        "DECISION_SUPERSEDED",
        "REOPENED_RECOVERY",
        "PENDING_DIRECT_OUTCOME",
    }:
        fail("242_completion_state_matrix.csv drifted from the required completion coverage")

    continuity_rows = load_csv(CONTINUITY_MATRIX)
    if {row["caseId"] for row in continuity_rows} != {
        "TRUSTED_BLOCKED",
        "TRUSTED_READY",
        "QUEUE_SNAPSHOT_DEGRADED",
        "PUBLICATION_STALE",
        "ANCHOR_BLOCKED",
        "REOPEN_RECOVERY",
    }:
        fail("242_continuity_validation_and_launch_cases.csv drifted from the required continuity coverage")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("242_gap_log.json must declare accepted_gaps_only status")
    if len(gap_log.get("gaps", [])) != 2:
        fail("242_gap_log.json must contain exactly two accepted gaps")
    for gap in gap_log["gaps"]:
        for field in [
            "gapId",
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not gap.get(field):
                fail(f"242 gap entry missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "TaskCompletionSettlementEnvelopeSnapshot",
            "OperatorHandoffFrameSnapshot",
            "settlementRevision",
            "settleTaskCompletion(",
            "recordOperatorHandoffFrame",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "Phase3TaskCompletionContinuityKernelService",
            'export * from "./phase3-task-completion-continuity-kernel";',
        ],
    )
    require_text(
        PUBLIC_API_TEST,
        [
            "createPhase3TaskCompletionContinuityKernelStore",
            "createPhase3TaskCompletionContinuityKernelService",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "creates one authoritative TaskCompletionSettlementEnvelope and reuses it for idempotent replay",
            "advances the same completion envelope identity through gated to ready revisions when continuity-backed next-task state changes",
            "persists one OperatorHandoffFrame for blocked baton cases and revises it in place",
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_TASK_COMPLETION_CONTINUITY_SERVICE_NAME",
            "workspace_task_settle_completion",
            "workspace_task_record_manual_handoff_requirement",
            "workspace_task_compute_continuity_evidence",
            "workspace_task_evaluate_next_task_readiness",
            "workspace_task_invalidate_stale_continuity",
            "stableExperienceContinuityEvidenceRef",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_completion_continuity_current",
            "workspace_task_settle_completion",
            "workspace_task_record_manual_handoff_requirement",
            "workspace_task_compute_continuity_evidence",
            "workspace_task_evaluate_next_task_readiness",
            "workspace_task_invalidate_stale_continuity",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_task_completion_settlement_envelopes",
            "phase3_operator_handoff_frames",
            "phase3_workspace_continuity_evidence_projections",
            "phase3_workspace_trust_envelopes",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "keeps calm completion gated until a live launch lease, stable continuity evidence, and queue snapshot align",
            "creates an explicit OperatorHandoffFrame for booking baton cases instead of hiding the blocker in notes",
            "computes trusted, degraded, stale, and blocked continuity states and invalidates reopened calm completion",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:242-completion-continuity": "python3 ./tools/analysis/validate_242_completion_and_continuity.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:242-completion-continuity": "python3 ./tools/analysis/validate_242_completion_and_continuity.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
