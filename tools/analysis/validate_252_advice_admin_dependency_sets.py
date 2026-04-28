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

ARCH_DOC = ROOT / "docs" / "architecture" / "252_advice_admin_dependency_and_reopen_engine.md"
SECURITY_DOC = ROOT / "docs" / "security" / "252_dependency_evaluation_and_reopen_controls.md"
OPERATIONS_DOC = ROOT / "docs" / "operations" / "252_dependency_repair_and_reopen_runbook.md"
CONTRACT = ROOT / "data" / "contracts" / "252_advice_admin_dependency_set_contract.json"
MATRIX = ROOT / "data" / "analysis" / "252_dependency_state_matrix.csv"
TRIGGER_REGISTRY = ROOT / "data" / "analysis" / "252_reopen_trigger_registry.json"
DRIFT_CASES = ROOT / "data" / "analysis" / "252_dependency_and_boundary_drift_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "252_gap_log.json"
PARALLEL_GAP = (
    ROOT
    / "data"
    / "analysis"
    / "PARALLEL_INTERFACE_GAP_PHASE3_SELFCARE_WORKSPACE_DEPENDENCY_ENGINE.json"
)

DOMAIN_SOURCE = (
    ROOT
    / "packages"
    / "domains"
    / "triage_workspace"
    / "src"
    / "phase3-advice-admin-dependency-kernel.ts"
)
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = (
    ROOT
    / "packages"
    / "domains"
    / "triage_workspace"
    / "tests"
    / "phase3-advice-admin-dependency-kernel.test.ts"
)
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-advice-admin-dependency.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "128_phase3_advice_admin_dependency_set_engine.sql"
)
INTEGRATION_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "phase3-advice-admin-dependency.integration.test.js"
)


def fail(message: str) -> None:
    raise SystemExit(f"[252-advice-admin-dependency-sets] {message}")


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
        r"^- \[[Xx]\] par_252_phase3_track_backend_build_advice_admin_dependency_sets_and_reopen_trigger_evaluation",
        checklist,
        re.MULTILINE,
    ):
        fail("task 252 checklist entry must be marked complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`AdviceAdminDependencySet`",
            "deterministic `dependencyState`",
            "Every accepted dependency set binds the live:",
            "Dominant blocker and dominant recovery route use one fixed order",
            "`253` and `254` consume this dependency truth",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Generic blocked booleans are forbidden.",
            "Transport acceptance or a quiet queue row does not prove contact or consent health.",
            "Stale tuple writes must return `stale_recoverable`.",
            "Repair blockers, reopen triggers, and clinical reentry triggers must not collapse into one generic bucket.",
        ],
    )
    require_text(
        OPERATIONS_DOC,
        [
            "GET /v1/workspace/tasks/{taskId}/advice-admin-dependency",
            "POST /v1/workspace/tasks/{taskId}:evaluate-advice-admin-dependency-set",
            "stale_recoverable",
            "dominant blocker and dominant recovery route",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "252.phase3.advice-admin-dependency-set.v1":
        fail("252 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3AdviceAdminDependencyApplication":
        fail("252 contract serviceName drifted")
    if len(contract.get("routeIds", [])) != 4:
        fail("252 contract routeIds drifted")
    if contract.get("dependencyStates") != [
        "clear",
        "repair_required",
        "disputed",
        "blocked_pending_identity",
        "blocked_pending_consent",
        "blocked_pending_external_confirmation",
    ]:
        fail("252 dependencyStates drifted")
    if contract.get("reopenStates") != [
        "stable",
        "reopen_required",
        "reopened",
        "blocked_pending_review",
    ]:
        fail("252 reopenStates drifted")

    rows = load_csv(MATRIX)
    if {row["caseId"] for row in rows} != {
        "CLEAR_CURRENT_TUPLE",
        "ROUTE_REPAIR_ACTIVE",
        "DELIVERY_DISPUTE_ACTIVE",
        "IDENTITY_BLOCK_ACTIVE",
        "CONSENT_BLOCK_ACTIVE",
        "EXTERNAL_WAIT_ACTIVE",
        "SAFETY_REENTRY_ACTIVE",
    }:
        fail("252 dependency state matrix drifted")

    trigger_registry = load_json(TRIGGER_REGISTRY)
    if len(trigger_registry.get("triggerRegistry", [])) != 12:
        fail("252 reopen trigger registry drifted")

    drift_cases = load_json(DRIFT_CASES)
    if {case["caseId"] for case in drift_cases.get("cases", [])} != {
        "STALE_BOUNDARY_TUPLE_RETURNS_STALE_RECOVERABLE",
        "STALE_DECISION_EPOCH_RETURNS_STALE_RECOVERABLE",
        "INVALIDATED_ADVICE_REQUIRES_REOPEN",
        "MATERIAL_EVIDENCE_DRIFT_REQUIRES_CLINICIAN_REENTRY",
        "BOUNDARY_BLOCKED_FORCES_BLOCKED_PENDING_REVIEW",
    }:
        fail("252 drift cases drifted")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("252 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("252 gap log must contain exactly two accepted gaps")

    parallel_gap = load_json(PARALLEL_GAP)
    if parallel_gap.get("taskId") != "252":
        fail("252 parallel gap taskId drifted")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "export class AdviceAdminReopenTriggerRegistry",
            "export class AdviceAdminRecoveryRouteResolver",
            "export class AdviceAdminDependencyEvaluator",
            "export class AdviceAdminDependencyProjectionAdapter",
            "refreshAdviceAdminDependencySet(",
            "recalculateAdviceAdminReopenState(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "AdviceAdminDependencySet"',
            'canonicalName: "Phase3AdviceAdminDependencyKernelService"',
            'export * from "./phase3-advice-admin-dependency-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "keeps dependency repair blockers distinct from reopen and clinical reentry triggers",
            "reuses an idempotent evaluation on the same tuple and digest",
            "applies stable blocker precedence across blocker combinations",
            "serializes concurrent evaluations onto one current set per tuple",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_ADVICE_ADMIN_DEPENDENCY_SERVICE_NAME",
            "queryTaskAdviceAdminDependency(",
            "fetchCurrentAdviceAdminDependencySet(",
            "refreshAdviceAdminDependencySet(",
            "recalculateAdviceAdminReopenState(",
            "stale_recoverable",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_advice_admin_dependency_current",
            "workspace_task_evaluate_advice_admin_dependency_set",
            "workspace_task_refresh_advice_admin_dependency_set",
            "workspace_task_recalculate_advice_admin_reopen_state",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_advice_admin_dependency_sets",
            "boundary_tuple_hash",
            "decision_epoch_ref",
            "dependency_state",
            "reopen_state",
            "idx_phase3_advice_admin_dependency_sets_blocker_route",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 252 dependency routes in the command-api route catalog",
            "derives repair_required from the live communication repair chain and exposes the current set through the query surface",
            "returns stale_recoverable when the caller presents a stale tuple hash",
            "maps identity blocking, consent checkpoint, and invalidated advice into the same dependency evaluator",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:252-advice-admin-dependency-sets": "python3 ./tools/analysis/validate_252_advice_admin_dependency_sets.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:252-advice-admin-dependency-sets": "python3 ./tools/analysis/validate_252_advice_admin_dependency_sets.py"'
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
