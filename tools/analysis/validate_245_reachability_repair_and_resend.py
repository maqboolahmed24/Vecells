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

ARCH_DOC = ROOT / "docs" / "architecture" / "245_communication_reachability_repair_and_controlled_resend.md"
SECURITY_DOC = ROOT / "docs" / "security" / "245_reachability_repair_and_resend_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "245_contact_route_repair_and_rebound_runbook.md"

CONTRACT = ROOT / "data" / "contracts" / "245_reachability_and_resend_contract.json"
BOUNCE_MATRIX = ROOT / "data" / "analysis" / "245_bounce_dispute_and_repair_matrix.csv"
AUTH_MATRIX = ROOT / "data" / "analysis" / "245_rebound_and_resend_authorization_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "245_gap_log.json"

SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-communication-reachability-repair.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
CALLBACK_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-callback-domain.ts"
CALLBACK_KERNEL = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-callback-kernel.ts"
MESSAGE_MIGRATION = ROOT / "services" / "command-api" / "migrations" / "120_phase3_clinician_message_domain.sql"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "121_phase3_communication_reachability_repair.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-communication-reachability-repair.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[245-reachability-repair] {message}")


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
        r"^- \[[Xx]\] par_245_phase3_track_backend_build_reachability_repair_bounce_handling_and_controlled_resend_logic",
        checklist,
        re.MULTILINE,
    ):
        fail("task 245 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "ReachabilityAssessmentRecord",
            "ContactRouteRepairJourney",
            "ContactRouteVerificationCheckpoint",
            "controlled resend",
            "channel change",
            "attachment recovery",
            "callback reschedule",
            "Send acceptance or queued dispatch does not mean the route is healthy.",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "send success does not imply reachable route",
            "contact_route_repair",
            "Repair completes only after a fresh snapshot, successful verification where required, a clear assessment, and dependency rebound on the current reachability epoch.",
            "Duplicate resend or reschedule authorization returns the existing live authorization on the same reachability epoch.",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":record-reachability",
            ":attach-candidate-route",
            ":issue-verification",
            ":settle",
            ":authorize-repair-action",
            ":authorize-reschedule",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "245.phase3.communication-repair.v1":
        fail("245 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3CommunicationReachabilityRepairApplication":
        fail("245 contract serviceName drifted")
    if contract.get("repairGrantActionScope") != "contact_route_repair":
        fail("245 contract repairGrantActionScope drifted")
    if contract.get("authorizationKinds") != [
        "controlled_resend",
        "channel_change",
        "attachment_recovery",
        "callback_reschedule",
    ]:
        fail("245 contract authorizationKinds drifted")

    bounce_rows = load_csv(BOUNCE_MATRIX)
    if {row["caseId"] for row in bounce_rows} != {
        "MESSAGE_BOUNCE_OPENS_REPAIR",
        "MESSAGE_INVALID_ROUTE_OPENS_REPAIR",
        "MESSAGE_DISPUTE_FAILS_CLOSED",
        "MESSAGE_TRANSPORT_ACK_STAYS_WEAK",
        "CALLBACK_FIRST_NO_ANSWER_STAYS_RETRY",
        "CALLBACK_REPEATED_NO_ANSWER_REPAIR",
        "PREFERENCE_DRIFT_REQUIRES_REPAIR",
        "VERIFICATION_FAILURE_KEEPS_REPAIR_OPEN",
    }:
        fail("245_bounce_dispute_and_repair_matrix.csv drifted from required coverage")

    auth_rows = load_csv(AUTH_MATRIX)
    if {row["caseId"] for row in auth_rows} != {
        "MESSAGE_RESEND_BLOCKED_BEFORE_REBOUND",
        "MESSAGE_RESEND_ALLOWED_AFTER_REBOUND",
        "MESSAGE_RESEND_DUPLICATE_REUSED",
        "MESSAGE_CHANNEL_CHANGE_ALLOWED_AFTER_REBOUND",
        "MESSAGE_ATTACHMENT_RECOVERY_ALLOWED_AFTER_REBOUND",
        "CALLBACK_RESCHEDULE_BLOCKED_BEFORE_REBOUND",
        "CALLBACK_RESCHEDULE_ALLOWED_AFTER_REBOUND",
        "CALLBACK_RESCHEDULE_DUPLICATE_REUSED",
    }:
        fail("245_rebound_and_resend_authorization_cases.csv drifted from required coverage")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("245_gap_log.json must declare accepted_gaps_only status")
    if len(gap_log.get("gaps", [])) != 2:
        fail("245_gap_log.json must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_COMMUNICATION_REPAIR_SERVICE_NAME",
            "CommunicationRepairBindingSnapshot",
            "CommunicationRepairAuthorizationSnapshot",
            "CommunicationRepairReboundRecordSnapshot",
            "recordCallbackReachability(",
            "recordMessageReachability(",
            "attachCandidateRoute(",
            "issueVerificationCheckpoint(",
            "settleVerificationCheckpoint(",
            "authorizeMessageRepairAction(",
            "authorizeCallbackReschedule(",
            "contact_route_repair",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_communication_repair_current",
            "workspace_task_record_callback_reachability",
            "workspace_task_record_message_reachability",
            "workspace_task_attach_contact_route_candidate",
            "workspace_task_issue_contact_route_verification",
            "workspace_task_settle_contact_route_verification",
            "workspace_task_authorize_message_repair_action",
            "workspace_task_authorize_callback_reschedule",
        ],
    )
    require_text(
        CALLBACK_SOURCE,
        [
            'routeRequiresRepair',
            '"contact_route_repair_pending"',
        ],
    )
    require_text(
        CALLBACK_KERNEL,
        [
            'no_answer: ["awaiting_retry", "contact_route_repair_pending", "escalation_review", "expired"]',
            '"contact_route_repair_pending"',
        ],
    )
    require_text(
        MESSAGE_MIGRATION,
        [
            "contact_route_ref TEXT",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_communication_repair_bindings",
            "phase3_communication_repair_authorizations",
            "phase3_communication_rebound_records",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 245 communication repair routes in the command-api route catalog",
            "opens one canonical repair journey for bounced message delivery and keeps duplicate failure on the same repair chain",
            "requires fresh verification and rebound before controlled resend can be authorized",
            "treats repeated no-answer as governed repair and authorizes callback reschedule only after rebound",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:245-communication-repair": "python3 ./tools/analysis/validate_245_reachability_repair_and_resend.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:245-communication-repair": "python3 ./tools/analysis/validate_245_reachability_repair_and_resend.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
