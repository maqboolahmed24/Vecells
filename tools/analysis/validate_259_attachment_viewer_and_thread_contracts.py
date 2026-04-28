#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "259_attachment_viewer_and_thread_contract.json"
MATRIX_PATH = ROOT / "data" / "analysis" / "259_attachment_mode_and_thread_state_matrix.csv"
CASES_PATH = ROOT / "data" / "analysis" / "259_patient_response_thread_and_visibility_cases.json"
REFERENCES_PATH = ROOT / "data" / "analysis" / "259_visual_reference_notes.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_ATTACHMENT_VIEWER_AND_THREAD.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "259_attachment_viewer_and_patient_response_thread_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "259_artifact_thread_studio.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "259_thread_and_attachment_continuity_diagram.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "259_attachment_thread_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "259_attachment_thread_a11y_notes.md"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-active-task-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-attachment-thread.tsx",
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
    require(contract["taskId"].startswith("par_259"), "259 contract taskId drifted")
    require(contract["visualMode"] == "Artifact_Thread_Studio", "259 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "AttachmentDigestCard",
            "AttachmentDigestGrid",
            "ArtifactViewerStage",
            "AudioDigestCard",
            "PatientResponseThreadPanel",
            "ThreadEventRow",
            "ThreadDispositionChip",
            "ThreadAnchorStub",
        },
        "259 component contract drifted",
    )
    require(
        {
            "MoreInfoResponseDisposition",
            "ConversationThreadProjection",
            "ArtifactPresentationContract",
        }
        <= set(contract["authoritativeContracts"]),
        "259 authoritative contracts drifted",
    )

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) == 8, "259 matrix row count drifted")

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 6, "259 cases unexpectedly thin")
    require(
        {"viewer-open-in-place", "audio-chunking-summary-first", "child-route-continuity"}
        <= {item["id"] for item in cases["cases"]},
        "259 case coverage drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear Changelog",
            "Vercel Changelog",
            "Vercel Dashboard Docs",
            "IBM Carbon Data Table",
            "IBM Carbon Loading",
            "NHS Service Manual",
            "NHS Question Pages",
        }
        <= {item["source"] for item in references["references"]},
        "259 visual references drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == ["par_260"], "259 sibling gap note drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "attachmentdigestcard",
        "artifactviewerstage",
        "patientresponsethreadpanel",
        "same-shell",
        "moreinforesponsedisposition",
    ]:
        require(token in spec, f"259 spec lost token: {token}")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "259 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "259 a11y notes lost reduced-motion guidance")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "artifact-thread-studio-root",
        "AttachmentDigestGrid",
        "ArtifactViewerStage",
        "PatientResponseThreadPanel",
    ]:
        require(token in atlas, f"259 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "AttachmentAndThreadResolver",
        "AttachmentDigestGrid",
        "ArtifactViewerStage",
        "PatientResponseThreadPanel",
        "ConversationThreadProjection",
    ]:
        require(token in diagram, f"259 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["attachmentCard"]["minHeight"] == "96px", "259 attachment token drifted")
    require(tokens["tokens"]["threadPanel"]["desktopWidth"] == "380px", "259 thread token drifted")
    require(
        tokens["tokens"]["artifactViewer"]["sideStageWidth"] == "clamp(360px, 33vw, 480px)",
        "259 viewer token drifted",
    )

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 259 component: {component_name}")
    for token in [
        "buildAttachmentAndThreadResolver",
        "data-testid=\"AttachmentDigestGrid\"",
        "data-testid=\"ArtifactViewerStage\"",
        "data-testid=\"PatientResponseThreadPanel\"",
        "data-testid=\"ThreadAnchorStub\"",
        "createInitialAttachmentAndThreadSelection",
    ]:
        require(token in app_text, f"app source missing 259 token: {token}")

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
