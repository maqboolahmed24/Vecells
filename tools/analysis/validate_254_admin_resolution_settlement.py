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

ARCH_DOC = ROOT / "docs" / "architecture" / "254_admin_resolution_settlement_and_cross_domain_reentry.md"
SECURITY_DOC = ROOT / "docs" / "security" / "254_admin_settlement_and_reentry_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "254_admin_reopen_and_reentry_runbook.md"
CONTRACT = ROOT / "data" / "contracts" / "254_admin_resolution_settlement_contract.json"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "254_admin_settlement_transition_matrix.csv"
STALE_REENTRY_CASES = ROOT / "data" / "analysis" / "254_stale_boundary_and_reentry_cases.json"
PROJECTION_CASES = ROOT / "data" / "analysis" / "254_patient_staff_projection_alignment_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "254_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_SELFCARE_WORKSPACE_ADMIN_SETTLEMENT.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-admin-resolution-settlement-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-admin-resolution-settlement-kernel.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-admin-resolution-settlement.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "130_phase3_admin_resolution_settlement_and_reentry.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-admin-resolution-settlement.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[254-admin-resolution-settlement] {message}")


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
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(
        r"^- \[[Xx]\] par_254_phase3_track_backend_build_admin_resolution_settlement_and_cross_domain_reentry_rules",
        checklist,
        re.MULTILINE,
    ):
        fail("task 254 checklist entry must be marked complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`AdminResolutionSettlement`",
            "`stale_recoverable`",
            "`AdminResolutionCrossDomainReentry`",
            "completed is legal only when",
            "per case and digest in-flight serialization",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Local acknowledgement is not authority.",
            "When drift is detected, the mutation settles `stale_recoverable`.",
            "`patient_notified` and `waiting_dependency` remain semantically distinct from `completed`.",
            "The system does not solve re-entry with a route redirect alone.",
        ],
    )
    require_text(
        OPS_DOC,
        [
            "The authoritative settlement results are:",
            "Use `reopenAdminResolutionForReview`",
            "Use `resolveAdminCrossDomainReentry`",
            "If a caller presents an old tuple, the system will settle `stale_recoverable`.",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "254.phase3.admin-resolution-settlement-and-reentry.v1":
        fail("254 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3AdminResolutionSettlementApplication":
        fail("254 contract serviceName drifted")
    if len(contract.get("routeIds", [])) != 7:
        fail("254 contract routeIds drifted")
    if contract.get("settlementResults") != [
        "queued",
        "patient_notified",
        "waiting_dependency",
        "completed",
        "reopened_for_review",
        "blocked_pending_safety",
        "stale_recoverable",
    ]:
        fail("254 settlement result vocabulary drifted")
    if contract.get("reentryModes") != [
        "reopen_launch",
        "repair_route_only",
        "same_shell_recovery",
    ]:
        fail("254 reentry mode vocabulary drifted")

    rows = load_csv(TRANSITION_MATRIX)
    if {row["caseId"] for row in rows} != {
        "QUEUED_TO_PATIENT_NOTIFIED",
        "QUEUED_TO_WAITING_DEPENDENCY",
        "WAITING_TO_COMPLETED",
        "ANY_TO_STALE_RECOVERABLE",
        "COMPLETED_TO_REOPENED_FOR_REVIEW",
        "QUEUED_TO_BLOCKED_PENDING_SAFETY",
    }:
        fail("254 transition matrix drifted")

    stale_cases = load_json(STALE_REENTRY_CASES)
    if {case["caseId"] for case in stale_cases.get("cases", [])} != {
        "PRESENTED_BOUNDARY_HASH_DRIFT_SETTLES_STALE_RECOVERABLE",
        "PRESENTED_DECISION_EPOCH_DRIFT_SETTLES_STALE_RECOVERABLE",
        "BOUNDARY_REOPEN_REQUIRES_GOVERNED_REENTRY",
        "CONTACT_ROUTE_BLOCKER_RESOLVES_REPAIR_ROUTE_ONLY",
        "STALE_COMPLETION_ARTIFACT_NEVER_COMPLETES",
    }:
        fail("254 stale and reentry cases drifted")

    projection_cases = load_json(PROJECTION_CASES)
    if {case["caseId"] for case in projection_cases.get("cases", [])} != {
        "COMPLETED_PROJECTION_UNLOCKS_NEXT_TASK",
        "WAITING_PROJECTION_STAYS_LIVE",
        "REOPENED_PROJECTION_FREEZES_ADMIN_MUTATION",
        "BLOCKED_PROJECTION_POINTS_AT_REPAIR_ROUTE",
        "STALE_PROJECTION_REQUIRES_RECOVERY",
    }:
        fail("254 projection alignment cases drifted")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("254 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("254 gap log must contain exactly two accepted gaps")

    parallel_gap = load_json(PARALLEL_GAP)
    if parallel_gap.get("taskId") != "254":
        fail("254 parallel gap taskId drifted")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "export class AdminResolutionStaleTupleGuard",
            "export class AdminResolutionReentryResolver",
            "export class AdminResolutionProjectionReconciler",
            "readonly inflightMutationByKey = new Map<",
            "recordAdminResolutionSettlementUnderLock(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "AdminResolutionActionRecord"',
            'canonicalName: "AdminResolutionSettlement"',
            'canonicalName: "AdminResolutionCrossDomainReentry"',
            'canonicalName: "Phase3AdminResolutionSettlementKernelService"',
            'export * from "./phase3-admin-resolution-settlement-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "records completed only with current artifact parity and projects the authoritative completion state",
            "settles stale_recoverable on tuple drift and preserves chronology instead of retargeting to the latest tuple",
            "reuses one exact-once settlement chain for concurrent same-tuple mutations",
            "resolves governed review and repair re-entry destinations from the live blocker shape",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_ADMIN_RESOLUTION_SETTLEMENT_SERVICE_NAME",
            "settleAdminCompletion(",
            "reopenAdminResolutionForReview(",
            "resolveAdminCrossDomainReentry(",
            "deriveForcedReentry(",
            "refreshProjectionWithReentry(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_admin_resolution_settlement_current",
            "workspace_task_record_admin_resolution_settlement",
            "workspace_task_settle_admin_notification",
            "workspace_task_settle_admin_waiting_state",
            "workspace_task_settle_admin_completion",
            "workspace_task_reopen_admin_resolution_for_review",
            "workspace_task_resolve_admin_cross_domain_reentry",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_admin_resolution_action_records",
            "phase3_admin_resolution_settlements",
            "phase3_admin_resolution_experience_projections",
            "phase3_admin_resolution_cross_domain_reentries",
            "idx_phase3_admin_resolution_settlements_boundary_epoch_dependency",
            "idx_phase3_admin_resolution_settlements_completion_result_trust",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 254 settlement routes and metadata in the command-api route catalog",
            "settles completed admin work only through the authoritative artifact and expectation tuple",
            "settles stale_recoverable when the caller presents an old boundary tuple",
            "reopens bounded admin work through governed re-entry and refreshes projection trust from the invalidated continuity bundle",
            "resolves repair-route re-entry without inventing a support-only admin truth path",
        ],
    )
    require_text(
        PACKAGE_JSON,
        ['"validate:254-admin-resolution-settlement": "python3 ./tools/analysis/validate_254_admin_resolution_settlement.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:254-admin-resolution-settlement": "python3 ./tools/analysis/validate_254_admin_resolution_settlement.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()


if __name__ == "__main__":
    main()
