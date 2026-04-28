#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "257_active_task_shell_contract.json"
MATRIX_PATH = ROOT / "data" / "analysis" / "257_task_canvas_stack_matrix.csv"
CASES_PATH = ROOT / "data" / "analysis" / "257_decision_dock_focus_and_delta_cases.json"
REFERENCES_PATH = ROOT / "data" / "analysis" / "257_visual_reference_notes.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_ACTIVE_TASK_SHELL.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "257_active_task_shell_case_pulse_and_decision_dock_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "257_case_pulse_workbench_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "257_task_canvas_and_support_promotion_diagram.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "257_active_task_shell_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "257_active_task_shell_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-active-task-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.data.ts",
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
    require(contract["taskId"].startswith("par_257"), "257 contract taskId drifted")
    require(contract["visualMode"] == "CasePulse_Instrument_Panel", "257 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "ActiveTaskShell",
            "CasePulseBand",
            "TaskStatusStrip",
            "TaskCanvas",
            "SummaryStack",
            "DeltaStack",
            "EvidenceStack",
            "ConsequenceStack",
            "ReferenceStack",
            "DecisionDock",
            "PromotedSupportRegion",
        },
        "257 component contract drifted",
    )
    require("TaskWorkspaceProjection" in contract["authoritativeContracts"], "task projection missing")
    require("DecisionEpoch" in contract["authoritativeContracts"], "decision epoch missing")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) == 7, "257 stack matrix row count drifted")
    require({row["surface_id"] for row in matrix} >= {"SummaryStack", "DeltaStack", "DecisionDock"}, "257 stack matrix drifted")

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "257 cases unexpectedly thin")

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {item["source"] for item in references["references"]}
        >= {"Linear Changelog", "Vercel Changelog", "Vercel Dashboard Docs", "IBM Carbon", "NHS Service Manual"},
        "257 visual references drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require({*gap["expectedOwnerTask"]} >= {"par_258", "par_259"}, "257 sibling gap note drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in ["activetaskshell", "casepulseband", "decisiondock", "same-shell", "deltastack"]:
        require(token in spec, f"257 spec lost token: {token}")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "257 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "257 a11y notes lost reduced-motion guidance")

    atlas = read_text(ATLAS_PATH)
    require("active-task-shell-atlas-root" in atlas, "257 atlas root missing")
    require("PromotedSupportRegion" in atlas, "257 atlas lost promoted support region")

    diagram = read_text(DIAGRAM_PATH)
    for token in ["TaskWorkspaceProjection", "TaskCanvasFrame", "DecisionDock", "WorkspaceProminenceDecision"]:
        require(token in diagram, f"257 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["casePulse"]["desktopHeight"] == "96px", "257 case pulse token drifted")
    require(tokens["tokens"]["decisionDock"]["desktopWidth"] == "352px", "257 dock token drifted")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 257 component: {component_name}")
    for token in [
        "buildTaskWorkspaceProjection",
        "case-pulse-band",
        "task-status-strip",
        "promoted-support-region",
        "data-opening-mode",
    ]:
        require(token in app_text, f"app source missing 257 token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "openingModes": contract["openingModes"],
                "caseCount": len(cases["cases"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
