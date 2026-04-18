#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "261_changed_review_resume_contract.json"
NOTES_PATH = ROOT / "data" / "analysis" / "261_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "261_changed_review_resume_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "261_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "261_delta_class_and_recommit_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_CHANGED_REVIEW_RESUME.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "261_changed_review_resume_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "261_changed_review_resume_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "261_changed_review_resume_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "261_changed_review_resume_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "261_changed_review_resume_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-changed-review.tsx",
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
    require(contract["taskId"].startswith("par_261"), "261 contract taskId drifted")
    require(contract["visualMode"] == "Delta_Reentry_Compass", "261 visual mode drifted")
    require(
        {
            "/workspace/changed",
            "/workspace/task/:taskId",
            "/workspace/task/:taskId/more-info",
            "/workspace/task/:taskId/decision",
        }
        <= set(contract["routes"]),
        "261 route contract drifted",
    )
    require(
        set(contract["components"])
        == {
            "ChangedWorkRoute",
            "DeltaFirstResumeShell",
            "EvidenceDeltaSummary",
            "InlineChangedRegionMarkers",
            "SupersededContextCompare",
            "ResumeReviewGate",
        },
        "261 component contract drifted",
    )
    require(
        {
            "EvidenceDeltaPacket",
            "DecisionEpoch",
            "TaskCanvasFrame",
            "TaskWorkspaceProjection",
            "PrimaryRegionBinding",
            "WorkspaceFocusProtectionLease",
        }
        <= set(contract["authoritativeContracts"]),
        "261 authoritative contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-delta-class",
            "data-resume-state",
            "data-recommit-required",
            "data-superseded-context",
        },
        "261 DOM marker drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "evidencedeltapacket",
        "resumed_review",
        "same-shell",
        "recommit",
        "patient-return",
    ]:
        require(token in notes, f"261 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) == 8, "261 state matrix row count drifted")

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear Personalized Sidebar",
            "Vercel New Dashboard Navigation",
            "Vercel Dashboard Overview",
            "IBM Carbon Data Table",
            "IBM Carbon Edit Pattern",
            "NHS Accessibility Design Guidance",
        }
        <= {item["source"] for item in references["references"]},
        "261 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "261 case coverage unexpectedly thin")
    require(
        {
            "decisive-delta-freezes-commit-posture",
            "consequential-delta-can-redirect-to-urgent-recovery",
            "contextual-delta-annotates-without-freezing",
            "superseded-context-stays-reachable",
            "anchor-jump-persists-within-same-shell",
        }
        <= {item["id"] for item in cases["cases"]},
        "261 case coverage drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == ["par_262"], "261 sibling gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "changedworkroute",
        "deltafirstresumeshell",
        "evidencedeltasummary",
        "inlinechangedregionmarkers",
        "supersededcontextcompare",
        "resumereviewgate",
        "delta_reentry_compass",
        "same-shell",
    ]:
        require(token in spec, f"261 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "changed-review-resume-atlas-root",
        "ChangedWorkRoute",
        "DeltaFirstResumeShell",
        "EvidenceDeltaSummary",
        "InlineChangedRegionMarkers",
        "SupersededContextCompare",
        "ResumeReviewGate",
    ]:
        require(token in atlas, f"261 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "ChangedWorkRoute",
        "DeltaFirstResumeShell",
        "EvidenceDeltaSummary",
        "InlineChangedRegionMarkers",
        "SupersededContextCompare",
        "ResumeReviewGate",
        "EvidenceDeltaPacket",
        "DecisionEpoch",
    ]:
        require(token in diagram, f"261 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(
        tokens["tokens"]["desktop"]["changedLaneWidth"] == "clamp(340px, 28vw, 400px)",
        "261 changed lane token drifted",
    )
    require(
        tokens["tokens"]["desktop"]["compareLaneWidth"] == "clamp(320px, 26vw, 380px)",
        "261 compare lane token drifted",
    )
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "261 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "261 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "261 a11y notes lost reduced-motion guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 261 component: {component_name}")
    for token in [
        "buildChangedWorkRouteProjection",
        "data-testid=\"ChangedWorkRoute\"",
        "data-testid=\"DeltaFirstResumeShell\"",
        "data-testid=\"EvidenceDeltaSummary\"",
        "data-testid=\"InlineChangedRegionMarkers\"",
        "data-testid=\"SupersededContextCompare\"",
        "data-testid=\"ResumeReviewGate\"",
        "Delta_Reentry_Compass",
    ]:
        require(token in app_text, f"app source missing 261 token: {token}")

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
