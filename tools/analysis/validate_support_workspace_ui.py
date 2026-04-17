#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
APP = ROOT / "apps" / "clinical-workspace" / "src" / "App.tsx"
SOURCE = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx"
STYLES = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "221_support_workspace_shell_and_omnichannel_ticket_views.md"
ATLAS = ROOT / "docs" / "frontend" / "221_support_workspace_shell_atlas.html"
VISUAL_GRAMMAR = ROOT / "docs" / "frontend" / "221_support_workspace_visual_grammar.html"
ROUTE_MAP = ROOT / "docs" / "frontend" / "221_support_workspace_route_anatomy_map.mmd"
CONTRACT = ROOT / "data" / "contracts" / "221_support_workspace_ui_contract.json"
STATE_JSON = ROOT / "data" / "analysis" / "221_support_timeline_and_action_states.json"
RESPONSIVE_MATRIX = ROOT / "data" / "analysis" / "221_support_workspace_responsive_layout_matrix.csv"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "221_support_workspace_shell_and_omnichannel_ticket_views.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views"
PREREQUISITES = [
    "par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries",
    "par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations",
    "par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces",
]

REQUIRED_SOURCE_MARKERS = {
    "Support_Ticket_Omnichannel_Shell",
    "SupportTicketWorkspaceProjection",
    "SupportOmnichannelTimelineProjection",
    "SupportActionWorkbenchProjection",
    "SupportReachabilityPostureProjection",
    "SupportActionLease",
    "SupportActionSettlement",
    "SupportContinuityEvidenceProjection",
    "SupportSurfaceRuntimeBinding",
    "SupportWorkspaceShell",
    "SupportTicketHeader",
    "TicketLineageStrip",
    "OmnichannelTimeline",
    "TimelineEventCard",
    "Subject360SummaryPanel",
    "ActionWorkbenchDock",
    "TimelineAnchorNavigator",
    "ContinuityStubBar",
    "GovernedChildRoutePlaceholder",
    "/ops/support/tickets/:supportTicketId",
    "/ops/support/tickets/:supportTicketId/conversation",
    "/ops/support/tickets/:supportTicketId/actions/:actionKey",
    "SupportTicketRoute",
    "SupportConversationRoute",
    "SupportActionRoute",
    "SupportTicketHeader",
    "TicketLineageStrip",
    "OmnichannelTimeline",
    "ActionWorkbenchDock",
    "ContinuityStubBar",
    "support.workspace.tickets",
    "vecells-route-change",
}

DOC_MARKERS = {
    "Support_Ticket_Omnichannel_Shell",
    "SupportWorkspaceShellAnatomyBoard",
    "TimelineGrammarBoard",
    "ActionDockBoard",
    "BaseTicketChildRouteBoard",
    "ProvisionalAuthoritativeBoard",
    "DegradedPlaceholderBoard",
    "/ops/support/tickets/:supportTicketId",
    "/ops/support/tickets/:supportTicketId/conversation",
    "/ops/support/tickets/:supportTicketId/actions/:actionKey",
    "support.workspace.tickets",
}

REQUIRED_SCREENSHOTS = {
    "221-support-ticket-calm-desktop.png",
    "221-support-ticket-active-action-desktop.png",
    "221-support-ticket-provisional-conversation.png",
    "221-support-ticket-degraded-tablet.png",
    "221-support-ticket-blocked-mobile.png",
    "221-support-workspace-atlas.png",
    "221-support-workspace-visual-grammar.png",
    "221-support-reduced-motion.png",
}

REQUIRED_ARIA_FILES = {
    "221-support-shell-aria.json",
    "221-support-conversation-aria.json",
    "221-support-action-dock-aria.json",
}


def fail(message: str) -> None:
    raise SystemExit(f"[support-workspace-ui] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for prerequisite in PREREQUISITES:
        if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 221 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, REQUIRED_SOURCE_MARKERS)
    require_markers("app", read(APP), {"SupportWorkspaceApp", "isSupportWorkspacePath"})
    require_markers(
        "styles",
        read(STYLES),
        {
            ".support-workspace",
            ".support-workspace__left-rail",
            ".support-workspace__timeline",
            ".support-workspace__action-dock",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    for forbidden in ("window.localStorage", "document.cookie", "sessionStorage"):
        if forbidden in source:
            fail(f"source contains forbidden browser persistence marker: {forbidden}")


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(ATLAS), read(VISUAL_GRAMMAR), read(ROUTE_MAP)])
    require_markers("docs", combined, DOC_MARKERS)
    require_markers(
        "architecture doc",
        read(ARCH_DOC),
        {"Zendesk", "Intercom", "Atlassian", "same clinical SPA host", "Playwright"},
    )
    require_markers("atlas", read(ATLAS), {"window.__supportTicketOmnichannelShellAtlasData"})
    require_markers("visual grammar", read(VISUAL_GRAMMAR), {"Support_Ticket_Omnichannel_Shell", "Visual grammar"})


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Support_Ticket_Omnichannel_Shell":
        fail("contract visualMode drifted")
    if contract.get("continuityKey") != "support.workspace.tickets":
        fail("contract continuity key drifted")
    if len(contract.get("routeSurfaces", [])) != 3:
        fail("contract route surface count drifted")

    state_json = json.loads(read(STATE_JSON))
    state_names = {entry["state"] for entry in state_json.get("states", [])}
    if state_names != {"calm", "active", "provisional", "degraded", "blocked"}:
        fail("support state coverage drifted")

    with RESPONSIVE_MATRIX.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 5:
        fail("responsive layout matrix is unexpectedly small")

    gap = json.loads(read(GAP))
    if gap.get("par221WorkspaceShellStatus") != "resolved_for_core_ticket_shell":
        fail("support frontend gap artifact missing 221 shell status")


def validate_scripts() -> None:
    package_text = read(ROOT_PACKAGE)
    script_line = '"validate:support-workspace-ui": "python3 ./tools/analysis/validate_support_workspace_ui.py"'
    if script_line not in package_text:
        fail("package.json missing validate:support-workspace-ui script")
    if "validate:support-workspace-ui" not in read(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing validate:support-workspace-ui")


def validate_playwright_outputs() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        {
            "221_support_workspace_shell_and_omnichannel_ticket_views",
            "SupportTicketRoute",
            "SupportConversationRoute",
            "SupportActionRoute",
            "221-support-ticket-calm-desktop.png",
            "221-support-workspace-atlas.png",
            "221-support-workspace-visual-grammar.png",
            "support.workspace.tickets",
        },
    )
    for file_name in REQUIRED_SCREENSHOTS | REQUIRED_ARIA_FILES:
        if not (OUTPUT_DIR / file_name).exists():
            fail(f"missing Playwright output: output/playwright/{file_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract_and_analysis()
    validate_scripts()
    validate_playwright_outputs()
    print("support workspace UI validation passed")


if __name__ == "__main__":
    main()
