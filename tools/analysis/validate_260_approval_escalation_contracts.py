#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "260_approval_escalation_contract.json"
NOTES_PATH = ROOT / "data" / "analysis" / "260_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "260_approval_escalation_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "260_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "260_supersession_and_urgent_edge_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_APPROVAL_ESCALATION.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "260_approval_escalation_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "260_approval_escalation_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "260_approval_escalation_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "260_approval_escalation_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "260_approval_escalation_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-approval-escalation.tsx",
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
    require(contract["taskId"].startswith("par_260"), "260 contract taskId drifted")
    require(contract["visualMode"] == "Quiet_Escalation_Control_Room", "260 visual mode drifted")
    require(
        set(contract["routes"]) == {"/workspace/approvals", "/workspace/escalations"},
        "260 routes drifted",
    )
    require(
        set(contract["components"])
        == {
            "ApprovalInboxRoute",
            "ApprovalReviewStage",
            "ApprovalAuthoritySummary",
            "EscalationCommandSurface",
            "UrgentContactTimeline",
            "EscalationOutcomeRecorder",
        },
        "260 components drifted",
    )
    require(
        {"ApprovalCheckpoint", "DecisionCommitEnvelope", "DutyEscalationRecord", "TaskWorkspaceProjection"}
        <= set(contract["authoritativeContracts"]),
        "260 authoritative contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-approval-state",
            "data-decision-epoch",
            "data-approval-role",
            "data-urgent-stage",
            "data-escalation-state",
        },
        "260 DOM marker drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "approvalcheckpoint",
        "decisioncommitenvelope",
        "dutyescalationrecord",
        "data-approval-state",
        "data-urgent-stage",
    ]:
        require(token in notes, f"260 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) == 8, "260 state matrix row count drifted")

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear Changelog",
            "Vercel Dashboard Navigation",
            "Vercel Dashboard Overview",
            "IBM Carbon Data Table",
            "NHS Service Manual Design",
            "NHS Question Pages",
            "DWP Timeline Design Notes",
        }
        <= {item["source"] for item in references["references"]},
        "260 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "260 edge case coverage unexpectedly thin")
    require(
        {
            "stale-approval-submit-freeze",
            "replacement-authority-visible",
            "urgent-stage-collapses-routine-chrome",
            "visible-contact-attempt-ladder",
            "escalation-reopen-lineage-visible",
        }
        <= {item["id"] for item in cases["cases"]},
        "260 edge cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == ["par_263"], "260 sibling gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "approvalinboxroute",
        "approvalreviewstage",
        "approvalauthoritysummary",
        "escalationcommandsurface",
        "urgentcontacttimeline",
        "escalationoutcomerecorder",
        "quiet_escalation_control_room",
        "same-shell",
    ]:
        require(token in spec, f"260 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "approval-escalation-atlas-root",
        "ApprovalInboxRoute",
        "ApprovalReviewStage",
        "ApprovalAuthoritySummary",
        "EscalationCommandSurface",
        "UrgentContactTimeline",
        "EscalationOutcomeRecorder",
    ]:
        require(token in atlas, f"260 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "ApprovalInboxRoute",
        "ApprovalReviewStage",
        "ApprovalAuthoritySummary",
        "EscalationCommandSurface",
        "UrgentContactTimeline",
        "EscalationOutcomeRecorder",
        "DecisionCommitEnvelope",
        "DutyEscalationRecord",
    ]:
        require(token in diagram, f"260 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["desktop"]["laneWidth"] == "clamp(360px, 28vw, 420px)", "260 lane token drifted")
    require(tokens["tokens"]["desktop"]["sideStageWidth"] == "clamp(340px, 28vw, 420px)", "260 side stage token drifted")
    require(tokens["tokens"]["motion"]["boundedStageSwap"] == "200ms", "260 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "260 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "260 a11y notes lost reduced-motion guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 260 component: {component_name}")
    for token in [
        "data-testid=\"ApprovalInboxRoute\"",
        "data-testid=\"ApprovalReviewStage\"",
        "data-testid=\"ApprovalAuthoritySummary\"",
        "data-testid=\"EscalationCommandSurface\"",
        "data-testid=\"UrgentContactTimeline\"",
        "data-testid=\"EscalationOutcomeRecorder\"",
        "buildApprovalInboxRouteProjection",
        "buildEscalationRouteProjection",
        "Quiet_Escalation_Control_Room",
    ]:
        require(token in app_text, f"app source missing 260 token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "stateCount": len(matrix),
                "referenceCount": len(references["references"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
