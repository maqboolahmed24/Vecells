#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "270_phase3_queue_callback_admin_merge.md"
STORYBOARD_PATH = ROOT / "docs" / "frontend" / "270_phase3_queue_callback_admin_storyboard.html"
TOPOLOGY_PATH = ROOT / "docs" / "frontend" / "270_phase3_queue_callback_admin_topology.mmd"
RUNBOOK_PATH = ROOT / "docs" / "operations" / "270_phase3_queue_callback_admin_runbook.md"
CONTRACT_PATH = ROOT / "data" / "contracts" / "270_phase3_queue_callback_admin_route_and_settlement_bundle.json"
LINEAGE_PATH = ROOT / "data" / "analysis" / "270_phase3_queue_callback_admin_lineage_matrix.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "270_phase3_queue_callback_admin_gap_log.json"
ALIGNMENT_NOTES_PATH = ROOT / "data" / "analysis" / "270_phase3_algorithm_alignment_notes.md"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
SERVICE_PATHS = [
    ROOT / "services" / "command-api" / "src" / "phase3-queue-callback-admin-merge.ts",
    ROOT / "services" / "command-api" / "src" / "service-definition.ts",
    ROOT / "services" / "command-api" / "tests" / "phase3-queue-callback-admin-merge.integration.test.js",
]
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-queue-callback-admin-merge.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-queue-workboard.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-focus-continuity.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
]
PLAYWRIGHT_PATHS = [
    ROOT / "tests" / "playwright" / "270_phase3_queue_callback_admin_merge.spec.ts",
    ROOT / "tests" / "playwright" / "270_phase3_queue_callback_admin_history.spec.ts",
    ROOT / "tests" / "playwright" / "270_phase3_queue_callback_admin.visual.spec.ts",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(
        contract["contractId"] == "270.phase3.queue-callback-admin.route-and-settlement-bundle",
        "270 contractId drifted",
    )
    require(
        contract["schemaVersion"] == "270.phase3.queue-callback-admin-merge.v1",
        "270 schemaVersion drifted",
    )
    require(
        contract["serviceName"] == "Phase3QueueCallbackAdminMergeApplication",
        "270 serviceName drifted",
    )
    require(
        contract["routeIds"]
        == [
            "workspace_queue_phase3_execution_merge_current",
            "workspace_task_phase3_execution_merge_current",
        ],
        "270 route ids drifted",
    )
    require(
        set(contract["executionFamilies"])
        == {"callback", "self_care", "admin_resolution", "triage_only"},
        "270 execution family coverage drifted",
    )
    require(
        set(contract["dominantPostures"])
        == {
            "ready",
            "repair_required",
            "waiting_dependency",
            "completed",
            "reopened",
            "stale_recoverable",
            "blocked",
        },
        "270 dominant posture coverage drifted",
    )
    require(
        set(contract["launchRouteKinds"]) == {"callbacks", "consequences", "task"},
        "270 launch route coverage drifted",
    )
    require(
        set(contract["queueLanesCovered"])
        == {"recommended", "callback-follow-up", "pharmacy-watch", "changed-since-seen"},
        "270 queue lane coverage drifted",
    )

    with LINEAGE_PATH.open(encoding="utf-8", newline="") as handle:
        lineage_rows = list(csv.DictReader(handle))
    require(len(lineage_rows) >= 4, "270 lineage matrix unexpectedly thin")
    task_ids = {row["taskId"] for row in lineage_rows}
    require(
        {"task-412", "task-507", "task-311", "task-118"} <= task_ids,
        "270 lineage matrix lost required task rows",
    )
    require(
        {"callback", "self_care", "admin_resolution"} <= {row["executionFamily"] for row in lineage_rows},
        "270 lineage matrix lost execution family coverage",
    )

    gap_log = json.loads(read_text(GAP_LOG_PATH))
    require(
        gap_log["taskId"] == "seq_270_phase3_merge_integrate_triage_queue_callback_and_self_care_admin_resolution_services",
        "270 gap log taskId drifted",
    )
    require(
        {
            "270-live-query-consumption-pending",
            "270-message-family-outside-merge-core",
        }
        <= {gap["gapId"] for gap in gap_log["gaps"]},
        "270 accepted gap coverage drifted",
    )

    architecture = read_text(ARCHITECTURE_PATH).lower()
    for token in [
        "phase3queuecallbackadminmergeapplication",
        "queuemergeexecutionfamily",
        "queuemergeposture",
        "completioncontinuitystage",
        "nexttaskposturecard",
        "open callback repair",
        "open bounded admin stage",
    ]:
        require(token in architecture, f"270 architecture doc lost token: {token}")

    storyboard = read_text(STORYBOARD_PATH)
    for token in [
        "270-phase3-queue-callback-admin-storyboard-root",
        "Queue -> callback repair",
        "Queue -> bounded admin waiting",
        "Task shell uses the same merge law",
        "Open callback repair",
        "CompletionContinuityStage",
        "NextTaskPostureCard",
    ]:
        require(token in storyboard, f"270 storyboard lost token: {token}")

    topology = read_text(TOPOLOGY_PATH)
    for token in [
        "Queue workboard",
        "270 merge digest",
        "Callback workbench",
        "Self-care/admin studio",
        "Completion continuity",
        "Next-task posture",
        "/workspace/callbacks",
        "/workspace/consequences",
    ]:
        require(token in topology, f"270 topology lost token: {token}")

    runbook = read_text(RUNBOOK_PATH).lower()
    for token in [
        "callback repair",
        "bounded-admin consequence",
        "completioncontinuitystage",
        "nexttaskposturecard",
        "route launch anchor",
        "stage seed in `staff-shell-seed.tsx`",
    ]:
        require(token in runbook, f"270 runbook lost token: {token}")

    alignment = read_text(ALIGNMENT_NOTES_PATH).lower()
    for token in [
        "queue preview no longer invents callback or admin posture",
        "callback repair can launch the callback desk in the repair stage",
        "bounded admin waiting now gates",
        "live query consumption gap",
        "message-family scope gap",
    ]:
        require(token in alignment, f"270 alignment notes lost token: {token}")

    package_text = read_text(PACKAGE_PATH)
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    script_token = (
        '"validate:270-phase3-queue-callback-admin-merge": '
        '"python3 ./tools/analysis/validate_270_phase3_queue_callback_admin_merge.py"'
    )
    require(script_token in package_text, "package.json missing 270 validator script")
    require(script_token in root_script_updates_text, "root_script_updates missing 270 validator script")

    service_text = "\n".join(read_text(path) for path in SERVICE_PATHS)
    for token in [
        "PHASE3_QUEUE_CALLBACK_ADMIN_MERGE_SERVICE_NAME",
        "queryIntegratedQueueSurface",
        "queryIntegratedTaskExecution",
        "workspace_queue_phase3_execution_merge_current",
        "workspace_task_phase3_execution_merge_current",
        "Open callback repair",
        "Open bounded admin stage",
        "task_412",
        "task_507",
        "task_118",
    ]:
        require(token in service_text, f"service source missing 270 token: {token}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for token in [
        "buildQueueCallbackAdminMergeDigest",
        "buildQueueCallbackAdminMergeMap",
        "patientExpectationDigest",
        "dominantSummary",
        "Open callback repair",
        "Open self-care stage",
        "Open bounded admin stage",
        "onOpenPeerRouteTask",
        "CompletionContinuityStage",
        "NextTaskPostureCard",
        "callback-repair-",
        "consequence-detail-",
    ]:
        require(token in app_text, f"app source missing 270 token: {token}")

    for path in PLAYWRIGHT_PATHS:
        require(path.exists(), f"Missing 270 Playwright proof: {path}")

    print(
        json.dumps(
            {
                "lineageRowCount": len(lineage_rows),
                "taskIds": sorted(task_ids),
                "acceptedGapCount": len(gap_log["gaps"]),
                "playwrightSpecCount": len(PLAYWRIGHT_PATHS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
