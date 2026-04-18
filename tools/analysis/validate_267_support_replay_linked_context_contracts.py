#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "267_support_replay_linked_context_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "267_support_replay_linked_context_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "267_support_replay_linked_context_atlas.html"
TOPOLOGY_PATH = ROOT / "docs" / "frontend" / "267_support_replay_linked_context_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "267_support_replay_linked_context_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "267_support_replay_linked_context_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "267_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "267_support_replay_linked_context_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "267_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "267_replay_mask_restore_and_deeplink_cases.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.css",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_267"), "267 contract taskId drifted")
    require(contract["visualMode"] == "Forensic_Support_Deck", "267 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "SupportTicketChildRouteShell",
            "SupportReplaySurface",
            "SupportReplayDeltaReviewPanel",
            "SupportLinkedContextView",
            "SupportHistoryView",
            "SupportKnowledgeView",
            "SupportReplayRestoreBridge",
        },
        "267 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-support-shell-mode",
            "data-replay-state",
            "data-mask-scope",
            "data-replay-checkpoint",
            "data-delta-review-state",
            "data-restore-state",
        },
        "267 DOM marker contract drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "supportreplaysession",
        "supportreplayevidenceboundary",
        "supportreplaydeltareview",
        "supportreplaydrafthold",
        "supportreplayrestoresettlement",
        "invisible-replay-boundary gap",
        "deep-link-bypasses-restore gap",
        "detached-history-gap",
        "ticket-copy-drift gap",
        "live-controls-reopen-too-early gap",
    ]:
        require(token in notes, f"267 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "267 matrix unexpectedly thin")
    require(
        {"ticket-overview", "ticket-history", "ticket-knowledge", "ticket-replay"}
        <= {row["route_key"] for row in matrix},
        "267 route coverage drifted",
    )
    require(
        {"frozen", "delta_review", "restore_ready", "read_only_recovery"}
        <= {row["replay_state"] for row in matrix},
        "267 replay-state coverage drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Welcome to the new Linear",
            "How we redesigned the Linear UI (part II)",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Typography Guidance",
            "NHS Supporting Content Guidance",
            "Microsoft Atlas Timeline",
        }
        <= {item["source"] for item in references["references"]},
        "267 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 8, "267 case coverage unexpectedly thin")
    require(
        {
            "enter-replay-keeps-anchor-and-shell-upgrade",
            "queued-deltas-stay-buffered-during-replay",
            "blocking-deltas-keep-restore-inert",
            "deep-link-stale-replay-falls-to-read-only-recovery",
            "history-route-stays-same-shell-and-mask-safe",
            "knowledge-route-stays-same-shell-and-mask-safe",
            "replay-gate-persists-through-overview-reopen",
        }
        <= {item["id"] for item in cases["cases"]},
        "267 cases drifted",
    )

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "forensic_support_deck",
        "supportticketchildrouteshell",
        "supportreplaysurface",
        "supportreplaydeltareviewpanel",
        "supportlinkedcontextview",
        "supporthistoryview",
        "supportknowledgeview",
        "supportreplayrestorebridge",
        "same-shell read-only fallback",
    ]:
        require(token in spec, f"267 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "267-support-replay-linked-context-atlas-root",
        "SupportReplaySurface",
        "SupportReplayDeltaReviewPanel",
        "SupportReplayRestoreBridge",
        "SupportHistoryView",
        "SupportKnowledgeView",
        "SupportLinkedContextView",
    ]:
        require(token in atlas, f"267 atlas lost token: {token}")

    topology = read_text(TOPOLOGY_PATH)
    for token in [
        "SupportReplaySurface",
        "SupportReplayEvidenceBoundary",
        "SupportReplayDeltaReviewPanel",
        "SupportReplayDraftHold",
        "SupportReplayRestoreBridge",
        "Read-only recovery in same ticket shell",
    ]:
        require(token in topology, f"267 topology lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(tokens["tokens"]["desktop"]["leftLinkedContextWidth"] == "336px", "267 left lane token drifted")
    require(tokens["tokens"]["desktop"]["replayPlaneWidth"] == "404px", "267 replay plane token drifted")
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "267 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    for token in ["reduced motion", "keyboard", "screen readers", "mask", "replay restore bridge"]:
        require(token in a11y, f"267 a11y notes lost token: {token}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(component_name in app_text, f"app source missing 267 component: {component_name}")
    for token in [
        'data-support-shell-mode',
        'data-replay-state',
        'data-mask-scope',
        'data-replay-checkpoint',
        'data-delta-review-state',
        'data-restore-state',
        'data-testid="SupportReplayRoute"',
        'data-testid="SupportHistoryRoute"',
        'data-testid="SupportKnowledgeRoute"',
        'data-testid="SupportReplaySurface"',
        'data-testid="SupportReplayRestoreBridge"',
        'data-testid="SupportLinkedContextView"',
        'data-testid="SupportTicketChildRouteShell"',
        "Forensic_Support_Deck",
    ]:
        require(token in app_text, f"app source missing 267 token: {token}")

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
