#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "256_queue_workboard_contract.json"
ROW_MATRIX_PATH = ROOT / "data" / "analysis" / "256_queue_row_grammar_matrix.csv"
ANCHOR_CASES_PATH = ROOT / "data" / "analysis" / "256_anchor_restore_and_rank_drift_cases.json"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "256_visual_reference_notes.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_QUEUE_WORKBOARD.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "256_queue_workboard_preview_and_anchor_spec.md"
LAB_PATH = ROOT / "docs" / "frontend" / "256_queue_workboard_lab.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "256_queue_scan_and_anchor_diagrams.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "256_queue_workboard_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "256_queue_workboard_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-queue-workboard.tsx",
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
    require(contract["taskId"].startswith("par_256"), "256 contract taskId drifted")
    require(contract["visualMode"] == "Queue_Prism_Workboard", "visual mode drifted")
    require(
        set(contract["components"])
        == {
            "QueueWorkboardFrame",
            "QueueToolbar",
            "QueueRow",
            "QueuePreviewPocket",
            "QueueScanManager",
            "QueueAnchorStub",
            "QueueChangeBatchBanner",
        },
        "component contract drifted",
    )
    require("QueueWorkbenchProjection" in contract["authoritativeContracts"], "queue projection missing")
    require("TaskLaunchContext" in contract["authoritativeContracts"], "launch context missing")

    row_matrix = list(csv.DictReader(read_text(ROW_MATRIX_PATH).splitlines()))
    require(len(row_matrix) == 5, "row grammar matrix row count drifted")
    require({row["row_state"] for row in row_matrix} >= {"resting", "preview_peek", "preview_pinned", "task_open", "anchor_stub"}, "row states drifted")

    anchor_cases = json.loads(read_text(ANCHOR_CASES_PATH))
    require(len(anchor_cases["cases"]) >= 6, "anchor/rank drift cases unexpectedly thin")

    references = json.loads(read_text(REFERENCE_NOTES_PATH))
    require(
        {item["source"] for item in references["references"]}
        >= {"Linear", "Vercel", "Vercel Docs", "IBM Carbon", "NHS Service Manual"},
        "visual references drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require({*gap["expectedOwnerTask"]} >= {"par_257", "par_258", "par_259"}, "sibling gap note drifted")

    spec = read_text(SPEC_PATH).lower()
    require("queueworkboardframe" in spec, "spec lost queue frame reference")
    require("same-shell" in spec, "spec lost same-shell law")
    require("queuechangebatchbanner" in spec, "spec lost batch banner reference")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "a11y notes lost keyboard guidance")
    require("hover" in a11y, "a11y notes lost hover parity guidance")

    lab = read_text(LAB_PATH)
    require("queue-workboard-lab-root" in lab, "lab root missing")
    require("queue-row-samples" in lab, "lab row samples missing")
    require("queue-anchor-flow" in lab, "lab anchor flow missing")

    diagram = read_text(DIAGRAM_PATH)
    for token in ["QueueScanSession", "QueueChangeBatch", "QueueAnchorStub", "QueuePreviewDigest"]:
        require(token in diagram, f"diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["toolbar"]["height"] == "40px", "toolbar token drifted")
    require(tokens["tokens"]["row"]["restingHeight"] == "44px", "row height token drifted")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing component: {component_name}")
    for token in [
        "buildQueueWorkbenchProjection",
        "QueueChangeBatch",
        "QueueAnchorStub",
        "queue-preview-pocket",
        "queue-change-batch-banner",
    ]:
        require(token in app_text, f"app source missing workboard token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "rowGrammarStates": [row["row_state"] for row in row_matrix],
                "anchorCaseCount": len(anchor_cases["cases"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
