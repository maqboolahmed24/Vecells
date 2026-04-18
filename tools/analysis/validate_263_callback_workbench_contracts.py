#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "263_callback_workbench_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "263_callback_workbench_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "263_callback_workbench_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "263_callback_workbench_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "263_callback_workbench_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "263_callback_workbench_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "263_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "263_callback_workbench_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "263_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "263_attempt_dedupe_and_outcome_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_CALLBACK_WORKBENCH.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-callback-workbench.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-callback-workbench.data.ts",
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
    require(contract["taskId"].startswith("par_263"), "263 contract taskId drifted")
    require(contract["visualMode"] == "Callback_Operations_Deck", "263 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "CallbackWorklistRoute",
            "CallbackDetailSurface",
            "CallbackExpectationCard",
            "CallbackAttemptTimeline",
            "CallbackOutcomeCapture",
            "CallbackRouteRepairPrompt",
        },
        "263 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-callback-state",
            "data-intent-lease-state",
            "data-attempt-state",
            "data-route-health",
            "data-resolution-gate",
        },
        "263 DOM markers drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "callbackcase",
        "callbackintentlease",
        "callbackattemptrecord",
        "callbackexpectationenvelope",
        "callbackoutcomeevidencebundle",
        "callbackresolutiongate",
        "duplicate dial",
        "voicemail",
        "route repair",
    ]:
        require(token in notes, f"263 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "263 matrix unexpectedly thin")
    require(
        {"scheduled", "awaiting_retry", "voicemail_left", "contact_route_repair_pending"}
        <= {row["callback_state"] for row in matrix},
        "263 callback state coverage drifted",
    )
    require(
        {"ready", "repair_required", "stale_recoverable", "blocked"}
        <= {row["outcome_capture_stage"] for row in matrix},
        "263 outcome capture stages drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear UI refresh",
            "Welcome to the new Linear",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Content Guide",
            "NHS Typography Guidance",
            "DWP Timeline",
        }
        <= {item["source"] for item in references["references"]},
        "263 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 8, "263 case coverage unexpectedly thin")
    require(
        {
            "same-shell-row-selection-keeps-callback-route",
            "initiate-attempt-disables-duplicate-trigger",
            "route-repair-dominates-and-revokes-promise",
            "voicemail-keeps-record-action-locked-until-evidence",
            "reload-preserves-stage-and-selected-attempt",
            "blocked-posture-freezes-outcome-capture",
        }
        <= {item["id"] for item in cases["cases"]},
        "263 cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == "par_264", "263 gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "callbackworklistroute",
        "callbackdetailsurface",
        "callbackexpectationcard",
        "callbackattempttimeline",
        "callbackoutcomecapture",
        "callbackrouterepairprompt",
        "callback_operations_deck",
        "duplicate attempts are blocked",
    ]:
        require(token in spec, f"263 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "callback-workbench-atlas-root",
        "CallbackWorklistRoute",
        "CallbackDetailSurface",
        "CallbackExpectationCard",
        "CallbackAttemptTimeline",
        "CallbackOutcomeCapture",
        "CallbackRouteRepairPrompt",
    ]:
        require(token in atlas, f"263 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "CallbackIntentLease",
        "CallbackAttemptRecord",
        "CallbackExpectationEnvelope",
        "CallbackOutcomeEvidenceBundle",
        "CallbackResolutionGate",
        "WorkspaceFocusProtectionLease",
    ]:
        require(token in diagram, f"263 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(
        tokens["tokens"]["desktop"]["worklistWidth"] == "clamp(360px, 28vw, 420px)",
        "263 worklist width token drifted",
    )
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "263 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "263 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "263 a11y notes lost reduced-motion guidance")
    require("route repair" in a11y, "263 a11y notes lost route-repair guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 263 component: {component_name}")
    for token in [
        'data-testid="CallbackWorklistRoute"',
        'data-testid="CallbackDetailSurface"',
        'data-testid="CallbackExpectationCard"',
        'data-testid="CallbackAttemptTimeline"',
        'data-testid="CallbackOutcomeCapture"',
        'data-testid="CallbackRouteRepairPrompt"',
        "data-dedupe-state",
        "Callback_Operations_Deck",
    ]:
        require(token in app_text, f"app source missing 263 token: {token}")

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
