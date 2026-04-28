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

ARCH_DOC = ROOT / "docs" / "architecture" / "238_endpoint_decision_engine_and_epoch_fencing.md"
SECURITY_DOC = ROOT / "docs" / "security" / "238_decision_epoch_route_fence_and_preview_controls.md"
OPS_DOC = ROOT / "docs" / "operations" / "238_endpoint_decision_preview_and_supersession_runbook.md"

TAXONOMY_MATRIX = ROOT / "data" / "analysis" / "238_endpoint_taxonomy_and_payload_matrix.csv"
SUPERSESSION_CASES = ROOT / "data" / "analysis" / "238_decision_epoch_supersession_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "238_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_ENDPOINT_DECISION_ENGINE.json"

DOMAIN_SOURCE = (
    ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-endpoint-decision-kernel.ts"
)
DOMAIN_TEST = (
    ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-endpoint-decision-kernel.test.ts"
)
PACKAGE_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
COMMAND_API_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-endpoint-decision-engine.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "114_phase3_endpoint_decision_engine.sql"
INTEGRATION_TEST = (
    ROOT / "services" / "command-api" / "tests" / "phase3-endpoint-decision-engine.integration.test.js"
)


def fail(message: str) -> None:
    raise SystemExit(f"[238-endpoint-decision-engine] {message}")


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
    for task_id in range(230, 238):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not marked complete")
    if not re.search(
        r"^- \[[Xx]\] par_238_phase3_track_backend_build_endpoint_decision_engine_decision_epoch_and_route_fence",
        checklist,
        re.MULTILINE,
    ):
        fail("task 238 checklist entry is not complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "DecisionEpoch",
            "EndpointDecisionBinding",
            "selected-anchor drift",
            "preview_only",
            "recovery_only",
            "ApprovalRequirementAssessment",
            "EndpointBoundaryTuple",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "blocked_approval_gate",
            "stale selected anchor",
            "preview_only",
            "recovery_only",
            "BoundaryTuple",
        ],
    )
    require_text(
        OPS_DOC,
        [
            ":select-endpoint",
            ":preview",
            ":regenerate-preview",
            ":submit",
            ":invalidate",
            "DecisionSupersessionRecord",
        ],
    )


def validate_analysis() -> None:
    taxonomy_rows = load_csv(TAXONOMY_MATRIX)
    if [row["endpointCode"] for row in taxonomy_rows] != [
        "admin_resolution",
        "self_care_and_safety_net",
        "clinician_message",
        "clinician_callback",
        "appointment_required",
        "pharmacy_first_candidate",
        "duty_clinician_escalation",
    ]:
        fail("238_endpoint_taxonomy_and_payload_matrix.csv drifted from the frozen endpoint taxonomy")

    supersession_rows = load_csv(SUPERSESSION_CASES)
    if {row["caseId"] for row in supersession_rows} != {
        "EVIDENCE_SNAPSHOT_DRIFT",
        "SAFETY_EPOCH_DRIFT",
        "DUPLICATE_LINEAGE_DRIFT",
        "OWNERSHIP_EPOCH_DRIFT",
        "REVIEW_VERSION_DRIFT",
        "SELECTED_ANCHOR_DRIFT",
        "TRUST_POSTURE_DRIFT",
        "PUBLICATION_TUPLE_DRIFT",
        "APPROVAL_BURDEN_DRIFT",
        "MANUAL_REPLACEMENT",
    }:
        fail("238_decision_epoch_supersession_cases.csv drifted from the required supersession trigger set")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 1:
        fail("238_gap_log.json must contain exactly one accepted gap")
    for field in [
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not gaps[0].get(field):
            fail(f"238 gap entry missing {field}")

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
            'export const phase3EndpointTaxonomy = [',
            '"admin_resolution"',
            '"self_care_and_safety_net"',
            '"clinician_message"',
            '"clinician_callback"',
            '"appointment_required"',
            '"pharmacy_first_candidate"',
            '"duty_clinician_escalation"',
            'export type EndpointDecisionBindingState = "live" | "preview_only" | "stale" | "blocked";',
            "evaluateSupersession",
            "buildDeterministicDecisionPreview",
            "ApprovalRequirementAssessmentSnapshot",
            "EndpointBoundaryTupleSnapshot",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "mints one live DecisionEpoch on first endpoint mutation and reuses it while the tuple stays current",
            "keeps preview generation deterministic and degrades stale previews to recovery_only on selected-anchor drift",
            "persists approval burden as epoch-bound truth and blocks submit until approval is satisfied",
        ],
    )
    require_text(
        PACKAGE_INDEX,
        [
            "EndpointDecision",
            "DecisionEpoch",
            "EndpointDecisionBinding",
            "Phase3EndpointDecisionKernelService",
            'export * from "./phase3-endpoint-decision-kernel";',
        ],
    )
    require_text(
        COMMAND_API_SOURCE,
        [
            "PHASE3_ENDPOINT_DECISION_SERVICE_NAME",
            "workspace_task_select_endpoint",
            "workspace_task_submit_endpoint_decision",
            "advanceTaskToEndpointSelected",
            "buildPreviewInput",
            "issueSettledCommand",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_endpoint_decision_current",
            "/v1/workspace/tasks/{taskId}/endpoint-decision",
            "workspace_task_select_endpoint",
            "workspace_task_submit_endpoint_decision",
            "workspace_task_invalidate_endpoint_decision",
        ],
    )
    require_text(
        MIGRATION,
        [
            "CREATE TABLE IF NOT EXISTS phase3_decision_epochs",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_decisions",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_bindings",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_action_records",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_decision_settlements",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_outcome_preview_artifacts",
            "CREATE TABLE IF NOT EXISTS phase3_decision_supersession_records",
            "CREATE TABLE IF NOT EXISTS phase3_approval_requirement_assessments",
            "CREATE TABLE IF NOT EXISTS phase3_endpoint_boundary_tuples",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 endpoint decision engine seam",
            "commits a live self-care decision through preview and submit without reminting the DecisionEpoch",
            "holds appointment_required behind blocked_approval_gate and leaves the triage task in review",
            "supersedes stale preview posture on anchor drift and keeps the old preview as recovery-only provenance",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:238-endpoint-decision-engine": "python3 ./tools/analysis/validate_238_endpoint_decision_engine.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:238-endpoint-decision-engine": "python3 ./tools/analysis/validate_238_endpoint_decision_engine.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
