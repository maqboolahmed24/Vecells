#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "255_workspace_route_family_contract.json"
STATE_MATRIX_PATH = ROOT / "data" / "analysis" / "255_route_family_state_matrix.csv"
HISTORY_CASES_PATH = ROOT / "data" / "analysis" / "255_history_restore_and_child_route_cases.json"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "255_visual_reference_notes.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_WORKSPACE_ROUTE_FAMILY.json"
ATLAS_PATH = ROOT / "docs" / "frontend" / "255_workspace_shell_atlas.html"
SPEC_PATH = ROOT / "docs" / "frontend" / "255_workspace_shell_and_route_family_spec.md"
A11Y_PATH = ROOT / "docs" / "accessibility" / "255_workspace_shell_a11y_notes.md"
TOPOLOGY_PATH = ROOT / "docs" / "frontend" / "255_workspace_route_family_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "255_workspace_shell_design_tokens.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "App.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
]

EXPECTED_ROUTES = {
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
EXPECTED_DOM_MARKERS = {
    "data-shell-type",
    "data-route-family",
    "data-workspace-shell-continuity-key",
    "data-entity-continuity-key",
    "data-design-contract-state",
    "data-dominant-action",
    "data-anchor-posture",
    "data-design-mode",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_255"), "255 contract taskId drifted")
    require(contract["designMode"] == "Quiet_Clinical_Mission_Control", "design mode drifted")
    require(set(contract["domMarkers"]) == EXPECTED_DOM_MARKERS, "DOM marker set drifted")
    require({row["pathTemplate"] for row in contract["routes"]} == EXPECTED_ROUTES, "contract routes drifted")

    state_rows = list(csv.DictReader(read_text(STATE_MATRIX_PATH).splitlines()))
    require(len(state_rows) == 9, "state matrix must contain 9 route rows")
    require({row["path_template"] for row in state_rows} == EXPECTED_ROUTES, "state matrix routes drifted")

    history_cases = json.loads(read_text(HISTORY_CASES_PATH))
    require(len(history_cases["cases"]) >= 5, "history cases unexpectedly thin")

    reference_notes = json.loads(read_text(REFERENCE_NOTES_PATH))
    require(len(reference_notes["references"]) >= 5, "visual reference notes missing sources")
    require(
        {item["source"] for item in reference_notes["references"]}
        >= {"Linear", "Vercel", "Vercel Guidelines", "IBM Carbon", "NHS Service Manual"},
        "visual reference sources drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require("par_256" in " ".join(gap["expectedOwnerTask"]), "256 dependency missing from gap note")
    require("par_259" in " ".join(gap["expectedOwnerTask"]), "259 dependency missing from gap note")

    atlas = read_text(ATLAS_PATH)
    require("workspace-shell-atlas-root" in atlas, "atlas root missing")
    require("workspace-route-table" in atlas, "atlas route table missing")
    require("workspace-token-swatches" in atlas, "atlas token swatches missing")

    topology = read_text(TOPOLOGY_PATH)
    for route in EXPECTED_ROUTES:
        require(route in topology, f"topology missing route: {route}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["radius"]["panel"] == "8px", "panel radius drifted")

    spec = read_text(SPEC_PATH).lower()
    require("same-shell" in spec, "spec lost same-shell language")
    require("workspacehomeprojection" in spec, "spec lost home projection reference")

    a11y = read_text(A11Y_PATH).lower()
    require("focus" in a11y, "a11y notes lost focus guidance")
    require("queue workboard" in a11y, "a11y notes lost queue guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in [
        "WorkspaceShell",
        "WorkspaceNavRail",
        "WorkspaceHeaderBand",
        "WorkspaceStatusStrip",
        "WorkspaceHome",
        "WorkspaceRouteFamilyController",
    ]:
        require(component_name in app_text, f"component export missing: {component_name}")
    for marker in EXPECTED_DOM_MARKERS:
        require(marker in app_text, f"DOM marker missing from app sources: {marker}")
    require("isWorkspaceShellPath" in app_text, "workspace route helper missing")
    require("WorkspaceShellRouteFamily" in app_text, "workspace shell route family test id missing")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "routeCount": len(contract["routes"]),
                "referenceCount": len(reference_notes["references"]),
                "historyCaseCount": len(history_cases["cases"]),
                "designMode": contract["designMode"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
