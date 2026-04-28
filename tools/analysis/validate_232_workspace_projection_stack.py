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

ARCH_DOC = ROOT / "docs" / "architecture" / "232_workspace_consistency_projection_and_trust_envelope.md"
SECURITY_DOC = ROOT / "docs" / "security" / "232_workspace_writability_focus_protection_and_recovery.md"
CONTEXT_SCHEMA = ROOT / "data" / "contracts" / "232_workspace_context_projection.schema.json"
ENVELOPE_SCHEMA = ROOT / "data" / "contracts" / "232_workspace_trust_envelope.schema.json"
TRUST_MATRIX = ROOT / "data" / "analysis" / "232_workspace_trust_case_matrix.csv"
RECOVERY_MATRIX = ROOT / "data" / "analysis" / "232_workspace_recovery_and_anchor_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_WORKSPACE_TRUST_ENVELOPE.json"

DOMAIN_KERNEL = ROOT / "packages" / "domain-kernel" / "src" / "workspace-projection-tuples.ts"
DOMAIN_KERNEL_INDEX = ROOT / "packages" / "domain-kernel" / "src" / "index.ts"
IDENTITY_BACKBONE = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "workspace-consistency-projection-backbone.ts"
)
IDENTITY_INDEX = ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts"
DOMAIN_TEST = (
    ROOT / "packages" / "domains" / "identity_access" / "tests" / "workspace-consistency-projection-backbone.test.ts"
)
COMMAND_API = ROOT / "services" / "command-api" / "src" / "workspace-consistency-projection.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "workspace-consistency-projection.integration.test.js"
RELEASE_TRUST_TEST = ROOT / "services" / "command-api" / "tests" / "release-trust-freeze.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[232-workspace-projection-stack] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


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


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(220, 232):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 232")
    if not re.search(
        r"^- \[[Xx-]\] par_232_phase3_track_backend_build_workspace_consistency_projection_and_workspace_trust_envelope",
        checklist,
        re.MULTILINE,
    ):
        fail("task 232 must be claimed or complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "WorkspaceTrustEnvelope",
            "GET /v1/workspace/tasks/{taskId}/context",
            "ProtectedCompositionState",
            "same-shell",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "deny-by-default",
            "reacquire_lease",
            "supervised_takeover",
            "WORKSPACE_232_SELECTED_ANCHOR_LOST",
        ],
    )


def validate_contracts() -> None:
    context_schema = load_json(CONTEXT_SCHEMA)
    envelope_schema = load_json(ENVELOPE_SCHEMA)
    if context_schema.get("title") != "232 WorkspaceContextProjectionBundle":
        fail("232_workspace_context_projection.schema.json title drifted")
    if envelope_schema.get("title") != "232 WorkspaceTrustEnvelope":
        fail("232_workspace_trust_envelope.schema.json title drifted")
    required_context = set(context_schema.get("required", []))
    for field in [
        "staffWorkspaceConsistencyProjection",
        "workspaceSliceTrustProjection",
        "workspaceContinuityEvidenceProjection",
        "workspaceTrustEnvelope",
    ]:
        if field not in required_context:
            fail(f"context schema lost required field {field}")
    required_envelope = set(envelope_schema.get("required", []))
    for field in [
        "envelopeState",
        "mutationAuthorityState",
        "interruptionPacingState",
        "completionCalmState",
        "requiredRecoveryAction",
    ]:
        if field not in required_envelope:
            fail(f"envelope schema lost required field {field}")


def validate_analysis() -> None:
    trust_rows = load_csv(TRUST_MATRIX)
    if len(trust_rows) != 6:
        fail("232_workspace_trust_case_matrix.csv must cover the six canonical workspace scenarios")
    trust_case_ids = {row["caseId"] for row in trust_rows}
    expected_case_ids = {
        "fresh_writable_live_lease",
        "preview_only_without_live_lease",
        "same_shell_route_change_continuity",
        "trust_downgrade_protected_composition",
        "anchor_repair_required",
        "ownership_drift_reacquire_required",
    }
    if trust_case_ids != expected_case_ids:
        fail("232_workspace_trust_case_matrix.csv drifted from the expected scenario set")

    recovery_rows = load_csv(RECOVERY_MATRIX)
    if len(recovery_rows) < 5:
        fail("232_workspace_recovery_and_anchor_cases.csv must cover at least five recovery paths")
    recovery_case_ids = {row["caseId"] for row in recovery_rows}
    for expected in [
        "anchor_repair_required",
        "anchor_lost_recovery_required",
        "trust_downgrade_during_composition",
        "ownership_drift_reacquire_required",
    ]:
        if expected not in recovery_case_ids:
            fail(f"recovery matrix is missing {expected}")

    gap_log = load_json(GAP_LOG)
    gap_ids = {entry["gapId"] for entry in gap_log.get("gaps", [])}
    expected_gap_ids = {
        "GAP_232_FOCUS_PROTECTION_LEASE_WRITER",
        "GAP_232_DECISION_AND_DUPLICATE_INVALIDATION_PORT",
    }
    if gap_ids != expected_gap_ids:
        fail("workspace trust envelope gap log drifted from the expected seam set")
    for entry in gap_log.get("gaps", []):
        for key in [
            "taskId",
            "missingSurface",
            "expectedOwnerTask",
            "temporaryFallback",
            "riskIfUnresolved",
            "followUpAction",
        ]:
            if not entry.get(key):
                fail(f"gap entry {entry.get('gapId', 'unknown')} is missing {key}")


def validate_source_files() -> None:
    require_text(
        DOMAIN_KERNEL,
        [
            "computeWorkspaceTupleHash",
            "buildWorkspaceEntityContinuityKey",
            "WorkspaceRecoveryAction",
        ],
    )
    require_text(DOMAIN_KERNEL_INDEX, ['export * from "./workspace-projection-tuples";'])
    require_text(
        IDENTITY_BACKBONE,
        [
            "workspaceProjectionReasonCodes",
            "evaluateWorkspaceTrustEnvelope",
            "assembleWorkspaceProjectionBundle",
            "workspaceProjectionParallelInterfaceGaps",
            "WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE",
        ],
    )
    require_text(
        IDENTITY_INDEX,
        ['export * from "./workspace-consistency-projection-backbone";'],
    )
    require_text(
        DOMAIN_TEST,
        [
            "derives interactive posture only from trust plus live leases",
            "freezes protected composition on trust invalidation",
            "emits explicit anchor repair reason codes",
        ],
    )
    require_text(
        COMMAND_API,
        [
            "WORKSPACE_CONTEXT_QUERY_SURFACES",
            "createWorkspaceConsistencyProjectionApplication",
            "queryWorkspaceTaskContext",
            "trust_downgrade_protected_composition",
            "workspace_task_context_current",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_context_current",
            "/v1/workspace/tasks/{taskId}/context",
            "workspace_task_trust_envelope_current",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "workspace consistency projection command-api seam",
            "same_shell_route_change_continuity",
            "requiredRecoveryAction",
            "repair_anchor",
        ],
    )
    require_text(RELEASE_TRUST_TEST, ["releaseTrustFreezeWorkspaceScenarioIds"])


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:232-workspace-projection-stack": "python3 ./tools/analysis/validate_232_workspace_projection_stack.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:232-workspace-projection-stack": "python3 ./tools/analysis/validate_232_workspace_projection_stack.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contracts()
    validate_analysis()
    validate_source_files()
    validate_script_registry()
    print("232 workspace projection stack validation passed.")


if __name__ == "__main__":
    main()
