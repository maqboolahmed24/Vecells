#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

TRIAGE_TASK = ROOT / "data" / "contracts" / "226_triage_task.schema.json"
REVIEW_SESSION = ROOT / "data" / "contracts" / "226_review_session.schema.json"
REVIEW_BUNDLE = ROOT / "data" / "contracts" / "226_review_bundle_contract.json"
TASK_LAUNCH_CONTEXT = ROOT / "data" / "contracts" / "226_task_launch_context.schema.json"
TASK_COMMAND_SETTLEMENT = ROOT / "data" / "contracts" / "226_task_command_settlement.schema.json"
TRUST_RULES = ROOT / "data" / "contracts" / "226_workspace_trust_and_focus_rules.json"
ROUTE_REGISTRY = ROOT / "data" / "contracts" / "226_workspace_route_family_registry.yaml"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "226_triage_state_transition_matrix.csv"
EVENT_CATALOG = ROOT / "data" / "analysis" / "226_workspace_event_catalog.csv"
GAP_LOG = ROOT / "data" / "analysis" / "226_triage_workspace_gap_log.json"

ARCH_DOC = ROOT / "docs" / "architecture" / "226_phase3_triage_contract_and_workspace_state_model.md"
API_DOC = ROOT / "docs" / "api" / "226_phase3_workspace_route_and_command_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "226_phase3_review_session_lease_and_trust_rules.md"
ATLAS = ROOT / "docs" / "frontend" / "226_phase3_triage_workspace_state_atlas.html"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "226_phase3_triage_workspace_state_atlas.spec.js"


def fail(message: str) -> None:
    raise SystemExit(f"[226-phase3-triage-workspace] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_yaml_like_json(path: Path) -> Any:
    return load_json(path)


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(220, 226):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 226")
    if not re.search(
        r"^- \[[Xx-]\] seq_226_phase3_freeze_triage_contract_workspace_state_model_and_review_session_rules",
        checklist,
        re.MULTILINE,
    ):
        fail("task 226 must be claimed or complete")


def validate_triage_task(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "status",
        "ownershipState",
        "reviewFreshnessState",
        "launchContextRef",
        "workspaceTrustEnvelopeRef",
        "taskCompletionSettlementEnvelopeRef",
    ]:
        if field not in required:
            fail(f"TriageTask schema missing required field {field}")

    status_enum = schema["properties"]["status"]["enum"]
    expected_statuses = {
        "triage_ready",
        "queued",
        "claimed",
        "in_review",
        "awaiting_patient_info",
        "review_resumed",
        "endpoint_selected",
        "escalated",
        "resolved_without_appointment",
        "handoff_pending",
        "closed",
        "reopened",
    }
    if set(status_enum) != expected_statuses:
        fail("TriageTask workflow states drifted")

    ownership_enum = schema["properties"]["ownershipState"]["enum"]
    freshness_enum = schema["properties"]["reviewFreshnessState"]["enum"]
    if set(ownership_enum) != {"active", "releasing", "expired", "broken"}:
        fail("ownershipState enum drifted")
    if set(freshness_enum) != {"fresh", "queued_updates", "review_required"}:
        fail("reviewFreshnessState enum drifted")

    boundary = schema.get("x-canonicalRequestMutationBoundary", {})
    if boundary.get("canonicalRequestLifecycleAuthority") != "LifecycleCoordinator":
        fail("triage task boundary must name LifecycleCoordinator as canonical lifecycle authority")
    if boundary.get("triageMutationMode") != "signal_only":
        fail("triage task boundary must freeze signal_only mutation mode")


def validate_review_session(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "selectedAnchorRef",
        "selectedAnchorTupleHashRef",
        "bufferState",
        "reviewActionLeaseRef",
        "workspaceTrustEnvelopeRef",
    ]:
        if field not in required:
            fail(f"ReviewSession schema missing required field {field}")

    session_states = set(schema["properties"]["sessionState"]["enum"])
    forbidden_overlap = {"review_required", "stale_recoverable", "recovery_required", "interactive"}
    if session_states & forbidden_overlap:
        fail("ReviewSession.sessionState must not collapse freshness or trust posture")

    if set(schema["properties"]["bufferState"]["enum"]) != {"none", "queued_updates", "review_required"}:
        fail("ReviewSession.bufferState enum drifted")


def validate_launch_context(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    for field in [
        "returnAnchorRef",
        "returnAnchorTupleHash",
        "selectedAnchorRef",
        "selectedAnchorTupleHash",
        "nextTaskLaunchState",
        "departingTaskReturnStubState",
    ]:
        if field not in required:
            fail(f"TaskLaunchContext schema missing required field {field}")

    if set(schema["properties"]["nextTaskLaunchState"]["enum"]) != {"blocked", "gated", "ready", "launched"}:
        fail("TaskLaunchContext.nextTaskLaunchState enum drifted")


def validate_task_command_settlement(schema: dict[str, Any]) -> None:
    required = set(schema.get("required", []))
    outcome_fields = [
        "localAckState",
        "processingAcceptanceState",
        "externalObservationState",
        "authoritativeOutcomeState",
    ]
    for field in outcome_fields:
        if field not in required:
            fail(f"TaskCommandSettlement schema missing required field {field}")

    if len(set(outcome_fields)) != 4:
        fail("TaskCommandSettlement outcome fields are unexpectedly duplicated")

    if "next_task_launch" not in schema["properties"]["actionScope"]["enum"]:
        fail("TaskCommandSettlement must include next_task_launch actionScope")
    if "stale_recoverable" not in schema["properties"]["authoritativeOutcomeState"]["enum"]:
        fail("TaskCommandSettlement must distinguish stale_recoverable authoritative outcome")
    if "settled" not in schema["properties"]["authoritativeOutcomeState"]["enum"]:
        fail("TaskCommandSettlement must distinguish settled authoritative outcome")

    chain = schema.get("x-settlementChain", [])
    if chain != [
        "RouteIntentBinding",
        "CommandActionRecord",
        "CommandSettlementRecord",
        "TransitionEnvelope",
        "ReleaseRecoveryDisposition",
    ]:
        fail("TaskCommandSettlement settlement chain drifted")


def validate_review_bundle(contract: dict[str, Any]) -> None:
    if contract.get("readModelOnly") is not True:
        fail("ReviewBundle must remain read-model only")
    basis = contract.get("authoritativeEvidenceBasis", {})
    if basis.get("mutationAuthority") != "none":
        fail("ReviewBundle must not gain mutation authority")
    if basis.get("summaryParityRecord") != "EvidenceSummaryParityRecord":
        fail("ReviewBundle must remain pinned to EvidenceSummaryParityRecord")

    section_keys = {section["sectionKey"] for section in contract.get("requiredSections", [])}
    expected_sections = {
        "request_summary",
        "structured_answers",
        "phone_transcript_summary",
        "attachments_digest",
        "safety_events",
        "contact_preferences",
        "identity_confidence",
        "prior_patient_responses",
    }
    if section_keys != expected_sections:
        fail("ReviewBundle section set drifted")


def validate_trust_rules(contract: dict[str, Any]) -> None:
    boundary = contract.get("canonicalRequestMutationBoundary", {})
    if boundary.get("authority") != "LifecycleCoordinator":
        fail("trust rules must keep LifecycleCoordinator as canonical lifecycle authority")
    if boundary.get("triageWorkspaceMode") != "signal_only":
        fail("trust rules must keep triage workspace in signal_only mode")

    trust = contract.get("workspaceTrustEnvelope", {})
    if set(trust.get("envelopeStates", [])) != {
        "interactive",
        "observe_only",
        "stale_recoverable",
        "recovery_required",
        "reassigned",
    }:
        fail("WorkspaceTrustEnvelope.envelopeStates drifted")

    focus = contract.get("focusProtection", {})
    if "settlement_drift" not in focus.get("invalidatingDriftStates", []):
        fail("focus protection must include settlement_drift invalidation")

    settlement = contract.get("taskCompletionSettlementEnvelope", {})
    if set(settlement.get("nextTaskLaunchStates", [])) != {"blocked", "gated", "ready", "launched"}:
        fail("task completion nextTaskLaunchStates drifted")

    if len(contract.get("failClosedRules", [])) < 4:
        fail("trust rules must publish the full fail-closed rule set")


def validate_route_registry(registry: dict[str, Any]) -> None:
    if registry.get("visualMode") != "Triage_Workspace_State_Atlas":
        fail("route registry visualMode drifted")

    routes = registry.get("routes", [])
    patterns = {route["pathPattern"] for route in routes}
    required_patterns = {
        "/workspace",
        "/workspace/queue/:queueKey",
        "/workspace/task/:taskId",
        "/workspace/task/:taskId/more-info",
        "/workspace/task/:taskId/decision",
        "/workspace/approvals",
        "/workspace/escalations",
        "/workspace/changed",
        "/workspace/search",
    }
    if patterns != required_patterns:
        fail("workspace route registry coverage drifted")

    route_by_key = {route["routeKey"]: route for route in routes}
    for key in ["workspace-task-more-info", "workspace-task-decision"]:
        route = route_by_key.get(key)
        if not route:
            fail(f"missing route registry row {key}")
        if route.get("routeClass") != "same_task_child":
            fail(f"{key} must remain same_task_child")
        if route.get("parentRouteKey") != "workspace-task":
            fail(f"{key} must remain parented to workspace-task")
        if route.get("adjacencyType") != "same_task_child":
            fail(f"{key} must remain same_task_child adjacency")

    search_route = route_by_key.get("workspace-search")
    if search_route.get("placeholderState") != "phase3_placeholder_not_implemented":
        fail("workspace-search must stay a conservative placeholder row")

    for route in routes:
        for field in ["routeClass", "adjacencyType", "historyPolicy", "selectedAnchorPolicy"]:
            if not route.get(field):
                fail(f"route {route['routeKey']} missing {field}")
        if not route.get("focusEventRefs") or not route.get("focusWorkflowStates"):
            fail(f"route {route['routeKey']} must publish focusEventRefs and focusWorkflowStates")


def validate_transitions_and_events(transitions: list[dict[str, str]], events: list[dict[str, str]]) -> None:
    if not transitions:
        fail("transition matrix is empty")
    if not events:
        fail("event catalog is empty")

    event_ids = {row["event_id"] for row in events}
    required_event_ids = {
        "triage.task.created",
        "triage.task.claimed",
        "triage.task.released",
        "triage.review.started",
        "triage.review.snapshot.refreshed",
        "triage.more_info.requested",
        "triage.more_info.response.linked",
        "triage.task.resumed",
        "triage.endpoint.selected",
        "triage.task.resolved_without_appointment",
        "triage.task.handoff_pending",
        "triage.approval.required",
        "triage.approval.recorded",
        "triage.escalated",
        "triage.review.invalidated",
        "triage.decision.epoch_superseded",
        "triage.queue_change.buffered",
        "triage.queue_change.applied",
        "triage.queue.overload_critical",
        "triage.task.stale_owner.detected",
        "triage.duplicate.clustered",
        "triage.duplicate.review_started",
        "triage.duplicate.resolved",
        "triage.duplicate.decision_superseded",
        "triage.handoff.created",
        "triage.task.reopened",
        "triage.task.closed",
    }
    if event_ids != required_event_ids:
        fail("event catalog drifted from the frozen Phase 3 vocabulary")

    for row in transitions:
        if row["event_id"] not in event_ids:
            fail(f"transition matrix references unknown event {row['event_id']}")
        if row["requires_authoritative_settlement"] not in {"true", "false"}:
            fail("transition matrix requires_authoritative_settlement must be true or false")

    expected_edges = {
        ("triage_ready", "triage.task.created", "queued"),
        ("queued", "triage.task.claimed", "claimed"),
        ("claimed", "triage.task.released", "queued"),
        ("claimed", "triage.review.started", "in_review"),
        ("in_review", "triage.more_info.requested", "awaiting_patient_info"),
        ("awaiting_patient_info", "triage.more_info.response.linked", "review_resumed"),
        ("review_resumed", "triage.task.claimed", "claimed"),
        ("in_review", "triage.endpoint.selected", "endpoint_selected"),
        ("in_review", "triage.escalated", "escalated"),
        ("endpoint_selected", "triage.task.resolved_without_appointment", "resolved_without_appointment"),
        ("endpoint_selected", "triage.task.handoff_pending", "handoff_pending"),
        ("escalated", "triage.task.reopened", "reopened"),
        ("resolved_without_appointment", "triage.task.closed", "closed"),
        ("handoff_pending", "triage.task.closed", "closed"),
        ("closed", "triage.task.reopened", "reopened"),
    }
    seen_edges = {(row["from_workflow_state"], row["event_id"], row["to_workflow_state"]) for row in transitions}
    if not expected_edges.issubset(seen_edges):
        fail("transition matrix is missing required workflow edges")

    if any(row["canonical_request_lifecycle_effect"] == "direct" for row in events):
        fail("event catalog must not allow direct canonical request lifecycle mutation")


def validate_gap_log(gap_log: dict[str, Any]) -> None:
    if gap_log.get("status") != "closed":
        fail("gap log must be closed")
    if gap_log.get("openGaps") != []:
        fail("gap log must not contain open gaps")
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 6:
        fail("gap log must contain exactly the six mandatory closures")
    for gap in gaps:
        if gap.get("status") != "closed":
            fail(f"gap {gap.get('gapId')} is not closed")
        if not gap.get("focusEventRefs") or not gap.get("focusWorkflowStates"):
            fail(f"gap {gap.get('gapId')} must publish focusEventRefs and focusWorkflowStates")


def validate_docs_and_atlas() -> None:
    require_text(
        ARCH_DOC,
        [
            "Orthogonal control facts",
            "Canonical request lifecycle boundary",
            "TaskCommandSettlement",
            "TaskLaunchContext",
        ],
    )
    require_text(
        API_DOC,
        [
            "/workspace/task/:taskId/more-info",
            "/workspace/task/:taskId/decision",
            "TaskLaunchContext",
            "TaskCommandSettlement",
            "ScopedMutationGate",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "deny-by-default",
            "WorkspaceTrustEnvelope",
            "WorkspaceFocusProtectionLease",
            "stale-owner recovery",
            "Next-task security boundary",
        ],
    )
    require_text(
        ATLAS,
        [
            "Triage_Workspace_State_Atlas",
            "Vecells",
            "WorkspaceShellBraid",
            "RouteFamilyLadder",
            "CommandSettlementChain",
            "TaskStateLattice",
            "SchemaParityTable",
            "TransitionMatrixTable",
            "EventCatalogTable",
            "../../data/contracts/226_triage_task.schema.json",
            "../../data/contracts/226_workspace_route_family_registry.yaml",
            "../../data/analysis/226_triage_state_transition_matrix.csv",
            "../../data/analysis/226_workspace_event_catalog.csv",
        ],
    )


def validate_script_registry() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phase3_triage_workspace_contracts.py"
    if scripts.get("validate:phase3-triage-workspace-contracts") != expected:
        fail("package.json missing validate:phase3-triage-workspace-contracts")

    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase3-triage-workspace-contracts": "python3 ./tools/analysis/validate_phase3_triage_workspace_contracts.py"' not in root_updates:
        fail("root_script_updates.py missing validate:phase3-triage-workspace-contracts")


def main() -> None:
    validate_checklist()
    triage_task = load_json(TRIAGE_TASK)
    review_session = load_json(REVIEW_SESSION)
    review_bundle = load_json(REVIEW_BUNDLE)
    task_launch_context = load_json(TASK_LAUNCH_CONTEXT)
    task_command_settlement = load_json(TASK_COMMAND_SETTLEMENT)
    trust_rules = load_json(TRUST_RULES)
    route_registry = load_yaml_like_json(ROUTE_REGISTRY)
    transition_matrix = load_csv(TRANSITION_MATRIX)
    event_catalog = load_csv(EVENT_CATALOG)
    gap_log = load_json(GAP_LOG)

    validate_triage_task(triage_task)
    validate_review_session(review_session)
    validate_review_bundle(review_bundle)
    validate_launch_context(task_launch_context)
    validate_task_command_settlement(task_command_settlement)
    validate_trust_rules(trust_rules)
    validate_route_registry(route_registry)
    validate_transitions_and_events(transition_matrix, event_catalog)
    validate_gap_log(gap_log)
    validate_docs_and_atlas()
    validate_script_registry()

    for artifact in [PLAYWRIGHT_SPEC]:
        if not artifact.exists():
            fail(f"missing required artifact {artifact.relative_to(ROOT)}")

    print("226 phase3 triage workspace contracts validated")


if __name__ == "__main__":
    main()
