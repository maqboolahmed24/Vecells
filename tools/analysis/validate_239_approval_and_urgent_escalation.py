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

ARCH_DOC = ROOT / "docs" / "architecture" / "239_human_approval_checkpoint_and_urgent_escalation.md"
SECURITY_DOC = ROOT / "docs" / "security" / "239_approval_bypass_prevention_and_urgent_contact_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "239_urgent_escalation_and_contact_attempt_runbook.md"

APPROVAL_CASES = ROOT / "data" / "analysis" / "239_approval_matrix_cases.csv"
OUTCOME_CASES = ROOT / "data" / "analysis" / "239_urgent_escalation_outcome_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "239_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_APPROVER_GRAPH.json"

DOMAIN_SOURCE = (
    ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-approval-escalation-kernel.ts"
)
DOMAIN_TEST = (
    ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-approval-escalation-kernel.test.ts"
)
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"

COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-approval-escalation.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = (
    ROOT / "services" / "command-api" / "migrations" / "115_phase3_approval_checkpoint_and_urgent_escalation.sql"
)
INTEGRATION_TEST = (
    ROOT / "services" / "command-api" / "tests" / "phase3-approval-escalation.integration.test.js"
)


def fail(message: str) -> None:
    raise SystemExit(f"[239-approval-and-urgent-escalation] {message}")


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
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(230, 240):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not marked complete")
    if not re.search(
        r"^- \[[Xx]\] par_239_phase3_track_backend_build_human_approval_checkpoint_and_urgent_escalation_path",
        checklist,
        re.MULTILINE,
    ):
        fail("task 239 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "ApprovalCheckpoint",
            "not_required -> required -> pending -> approved | rejected -> superseded",
            "DutyEscalationRecord",
            "UrgentContactAttempt",
            "UrgentEscalationOutcome",
            "DecisionEpoch",
            "return_to_triage",
            "separation-of-duties",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "self-approval",
            "epoch-bound",
            "presented approver roles",
            "UrgentContactAttempt",
            "simulator-backed",
            "evidence inputs",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":evaluate-approval-requirement",
            ":request",
            ":approve",
            ":reject",
            ":invalidate",
            ":start-urgent-escalation",
            "/contact-attempts",
            ":record-outcome",
        ],
    )


def validate_analysis() -> None:
    approval_rows = load_csv(APPROVAL_CASES)
    expected_approval_cases = {
        "ADMIN_SENSITIVE",
        "ADMIN_DEFAULT",
        "SELF_CARE_CLOSURE",
        "MESSAGE_CLOSURE",
        "CALLBACK_ROUTINE",
        "APPOINTMENT_HANDOFF",
        "PHARMACY_OVERRIDE",
        "DUTY_ESCALATION",
        "ASSISTIVE_SEEDED_SUBMIT",
    }
    if {row["caseId"] for row in approval_rows} != expected_approval_cases:
        fail("239_approval_matrix_cases.csv drifted from the governed approval matrix cases")

    outcome_rows = load_csv(OUTCOME_CASES)
    expected_outcome_cases = {
        "URGENT_DIRECT_NON_APPOINTMENT",
        "URGENT_DOWNSTREAM_HANDOFF",
        "URGENT_RETURN_TO_TRIAGE",
        "URGENT_CANCELLED",
        "URGENT_EXPIRED",
        "URGENT_STALE_EPOCH_CANCEL",
    }
    if {row["caseId"] for row in outcome_rows} != expected_outcome_cases:
        fail("239_urgent_escalation_outcome_cases.csv drifted from the urgent outcome cases")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 2:
        fail("239_gap_log.json must contain exactly two accepted gaps")
    for gap in gaps:
        for field in [
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not gap.get(field):
                fail(f"239 gap entry missing {field}")

    parallel_gap = load_json(PARALLEL_GAP)
    for field in [
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not parallel_gap.get(field):
            fail(f"parallel gap artifact missing {field}")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "export type ApprovalCheckpointState =",
            "export type DutyEscalationState =",
            "evaluateGovernedApprovalRequirement",
            "AP_228_SELF_CARE_CLOSURE",
            "AP_228_MESSAGE_CLOSURE",
            "recordUrgentContactAttempt",
            "recordUrgentOutcome",
            "cancelUrgentEscalation",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "evaluates self-care closure into a required checkpoint and blocks self-approval",
            "supersedes the prior checkpoint when the decision epoch changes",
            "collapses replayed urgent contact attempts and preserves the return-to-triage reopen lineage",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "ApprovalCheckpoint",
            "DutyEscalationRecord",
            "UrgentContactAttempt",
            "UrgentEscalationOutcome",
            "Phase3ApprovalEscalationKernelService",
            'export * from "./phase3-approval-escalation-kernel";',
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_APPROVAL_ESCALATION_SERVICE_NAME",
            "workspace_task_evaluate_approval_requirement",
            "workspace_task_start_urgent_escalation",
            "ensureEscalationEpochCurrent",
            "recordUrgentOutcome(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_approval_escalation_current",
            "/v1/workspace/tasks/{taskId}/approval-escalation",
            "workspace_task_request_approval",
            "workspace_task_start_urgent_escalation",
            "workspace_task_record_urgent_outcome",
        ],
    )
    require_text(
        MIGRATION,
        [
            "CREATE TABLE IF NOT EXISTS phase3_governed_approval_assessments",
            "CREATE TABLE IF NOT EXISTS phase3_approval_checkpoints",
            "CREATE TABLE IF NOT EXISTS phase3_duty_escalation_records",
            "CREATE TABLE IF NOT EXISTS phase3_urgent_contact_attempts",
            "CREATE TABLE IF NOT EXISTS phase3_urgent_escalation_outcomes",
            "CREATE TABLE IF NOT EXISTS phase3_triage_reopen_records",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 approval and urgent escalation seam",
            "evaluates self-care closure into an explicit ApprovalCheckpoint and settles approval with a different approver",
            "routes a duty-clinician urgent direct outcome into resolved_without_appointment",
            "cancels stale urgent escalation posture when the DecisionEpoch is superseded before another contact attempt lands",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:239-approval-and-urgent-escalation": "python3 ./tools/analysis/validate_239_approval_and_urgent_escalation.py"',
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:239-approval-and-urgent-escalation": "python3 ./tools/analysis/validate_239_approval_and_urgent_escalation.py"',
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()
    print("239 approval and urgent escalation validation passed.")


if __name__ == "__main__":
    main()
