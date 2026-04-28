#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "258_rapid_entry_and_reasoning_contract.json"
MATRIX_PATH = ROOT / "data" / "analysis" / "258_more_info_and_reasoning_matrix.csv"
CASES_PATH = ROOT / "data" / "analysis" / "258_focus_protection_and_stale_epoch_cases.json"
REFERENCES_PATH = ROOT / "data" / "analysis" / "258_visual_reference_notes.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_RAPID_ENTRY_AND_REASONING.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "258_rapid_entry_more_info_and_endpoint_reasoning_spec.md"
LAB_PATH = ROOT / "docs" / "frontend" / "258_reasoning_dock_lab.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "258_composition_state_and_decision_epoch_diagram.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "258_reasoning_layer_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "258_reasoning_layer_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-active-task-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-reasoning-layer.tsx",
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
    require(contract["taskId"].startswith("par_258"), "258 contract taskId drifted")
    require(contract["visualMode"] == "Reasoning_Dock_Composer", "258 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "QuickCaptureTray",
            "ReasonChipGroup",
            "QuestionSetPicker",
            "RapidEntryNoteField",
            "MoreInfoInlineSideStage",
            "EndpointReasoningStage",
            "ConsequencePreviewSurface",
            "ProtectedCompositionFreezeFrame",
        },
        "258 component contract drifted",
    )
    require("ReasoningLayerProjection" in contract["authoritativeContracts"], "reasoning layer contract missing")
    require("DecisionEpoch" in contract["authoritativeContracts"], "decision epoch missing")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) == 8, "258 matrix row count drifted")
    require({row["surface_id"] for row in matrix} >= {"QuickCaptureTray", "ProtectedCompositionFreezeFrame"}, "258 matrix drifted")

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "258 cases unexpectedly thin")

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {item["source"] for item in references["references"]}
        >= {"Linear Changelog", "Vercel Changelog", "IBM Carbon", "NHS Service Manual", "NHS Question Pages"},
        "258 visual references drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == ["par_259"], "258 sibling gap note drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in ["quickcapturetray", "moreinfoinlinesidestage", "endpointreasoningstage", "same-shell", "protectedcompositionfreezeframe"]:
        require(token in spec, f"258 spec lost token: {token}")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "258 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "258 a11y notes lost reduced-motion guidance")

    lab = read_text(LAB_PATH)
    require("reasoning-dock-lab-root" in lab, "258 lab root missing")
    require("ProtectedCompositionFreezeFrame" in lab, "258 lab lost freeze frame")

    diagram = read_text(DIAGRAM_PATH)
    for token in ["ReasoningLayerResolver", "RapidEntryDraft", "MoreInfoInlineSideStage", "EndpointReasoningStage", "DecisionEpoch"]:
        require(token in diagram, f"258 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["quickCaptureTray"]["tabColumns"] == 3, "258 tray token drifted")
    require(tokens["tokens"]["freezeFrame"]["preservedFactsRows"] == 3, "258 freeze token drifted")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 258 component: {component_name}")
    for token in [
        "createInitialRapidEntryDraft",
        "buildReasoningLayerProjection",
        "data-testid=\"QuickCaptureTray\"",
        "data-testid=\"MoreInfoInlineSideStage\"",
        "data-testid=\"EndpointReasoningStage\"",
        "data-testid=\"ProtectedCompositionFreezeFrame\"",
    ]:
        require(token in app_text, f"app source missing 258 token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "stageModes": contract["stageModes"],
                "caseCount": len(cases["cases"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
