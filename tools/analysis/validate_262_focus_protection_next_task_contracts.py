#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "262_focus_protection_next_task_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "262_focus_protection_next_task_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "262_focus_protection_next_task_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "262_focus_protection_next_task_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "262_focus_protection_next_task_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "262_focus_protection_next_task_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "262_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "262_focus_protection_next_task_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "262_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "262_buffered_queue_and_no_auto_advance_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_FOCUS_PROTECTION_NEXT_TASK.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-active-task-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-focus-continuity.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-focus-continuity.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-queue-workboard.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_262"), "262 contract taskId drifted")
    require(contract["visualMode"] == "Protected_Flow_Continuity", "262 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "WorkspaceProtectionStrip",
            "BufferedQueueChangeTray",
            "ProtectedCompositionRecovery",
            "CompletionContinuityStage",
            "NextTaskPostureCard",
            "DepartureReturnStub",
        },
        "262 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-focus-protection",
            "data-protected-composition",
            "data-buffered-queue-batch",
            "data-next-task-state",
            "data-auto-advance",
        },
        "262 DOM markers drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "workspacefocusprotectionlease",
        "protectedcompositionstate",
        "queuechangebatch",
        "taskcompletionsettlementenvelope",
        "nexttaskprefetchwindow",
        "nexttasklaunchlease",
        "no auto-advance",
    ]:
        require(token in notes, f"262 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "262 matrix unexpectedly thin")
    require(
        {"ready", "release_pending", "blocked", "stale_recoverable"}
        <= {row["next_task_state"] for row in matrix},
        "262 next-task states drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear UI refresh",
            "Vercel Nested Layouts",
            "Vercel New Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Content Guide",
            "NHS Typography Guidance",
        }
        <= {item["source"] for item in references["references"]},
        "262 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "262 case coverage unexpectedly thin")
    require(
        {
            "protected-more-info-holds-queue-batch",
            "queue-route-shows-explicit-buffered-tray",
            "next-task-ready-only-on-clean-launch-lease",
            "stale-decision-preserves-protected-recovery",
            "reload-preserves-buffered-tray-state",
            "auto-advance-remains-forbidden",
        }
        <= {item["id"] for item in cases["cases"]},
        "262 cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == "par_263", "262 gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "workspaceprotectionstrip",
        "bufferedqueuechangetray",
        "protectedcompositionrecovery",
        "completioncontinuitystage",
        "nexttaskposturecard",
        "departurereturnstub",
        "protected_flow_continuity",
        "no auto-advance",
    ]:
        require(token in spec, f"262 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "focus-protection-next-task-atlas-root",
        "WorkspaceProtectionStrip",
        "BufferedQueueChangeTray",
        "ProtectedCompositionRecovery",
        "CompletionContinuityStage",
        "NextTaskPostureCard",
        "DepartureReturnStub",
    ]:
        require(token in atlas, f"262 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "WorkspaceFocusProtectionLease",
        "ProtectedCompositionState",
        "QueueChangeBatch",
        "TaskCompletionSettlementEnvelope",
        "WorkspaceContinuityEvidenceProjection",
        "NextTaskPrefetchWindow",
        "NextTaskLaunchLease",
    ]:
        require(token in diagram, f"262 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(
        tokens["tokens"]["desktop"]["bufferedTrayWidth"] == "clamp(320px, 28vw, 380px)",
        "262 buffered tray token drifted",
    )
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "262 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "262 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "262 a11y notes lost reduced-motion guidance")
    require("data-auto-advance" in a11y, "262 a11y notes lost no-auto-advance guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 262 component: {component_name}")
    for token in [
        'data-testid="WorkspaceProtectionStrip"',
        'data-testid="BufferedQueueChangeTray"',
        'data-testid="ProtectedCompositionRecovery"',
        'data-testid="CompletionContinuityStage"',
        'data-testid="NextTaskPostureCard"',
        'data-testid="DepartureReturnStub"',
        "data-auto-advance={focusContinuity.noAutoAdvancePolicy}",
        "buildWorkspaceFocusContinuityProjection",
    ]:
        require(token in app_text, f"app source missing 262 token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "caseCount": len(cases["cases"]),
                "referenceCount": len(references["references"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
