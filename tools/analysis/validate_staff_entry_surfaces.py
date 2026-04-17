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
SOURCE = ROOT / "apps" / "clinical-workspace" / "src" / "staff-entry-surfaces.tsx"
STYLES = ROOT / "apps" / "clinical-workspace" / "src" / "staff-entry-surfaces.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "220_staff_start_of_day_operations_and_support_entry_surfaces.md"
ATLAS = ROOT / "docs" / "frontend" / "220_staff_entry_atlas.html"
VISUAL_GRAMMAR = ROOT / "docs" / "frontend" / "220_staff_entry_visual_grammar.html"
ROUTE_MAP = ROOT / "docs" / "frontend" / "220_staff_entry_route_continuity_map.mmd"
CONTRACT = ROOT / "data" / "contracts" / "220_staff_entry_surface_contract.json"
LAYOUT_MATRIX = ROOT / "data" / "analysis" / "220_staff_entry_layout_matrix.csv"
STATE_CASES = ROOT / "data" / "analysis" / "220_staff_entry_state_and_interrupt_cases.json"
SUPPORT_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json"
PLAYWRIGHT_SPEC = (
    ROOT / "tests" / "playwright" / "220_staff_start_of_day_operations_and_support_entry_surfaces.spec.js"
)
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces"
PREREQUISITES = [
    "seq_209_crosscutting_open_patient_account_and_support_surface_tracks_gate",
    "par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries",
    "par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations",
]

REQUIRED_STRINGS = {
    "Staff_Entry_Quiet_Control",
    "Quiet_Internal_Control",
    "WorkspaceHomeProjection",
    "StaffInboxProjection",
    "PersonalWorklistProjection",
    "TeamQueueSummaryProjection",
    "InterruptionDigestProjection",
    "ApprovalInboxProjection",
    "CallbackWorklistProjection",
    "EscalationInboxProjection",
    "ChangedSinceSeenProjection",
    "CrossDomainTaskSummaryProjection",
    "DependencyDigestProjection",
    "PharmacyConsoleSummaryProjection",
    "SupportDeskHomeProjection",
    "SupportInboxProjection",
    "SupportEntryRouteContract",
    "StaffEntryShell",
    "RecommendedQueueCard",
    "InterruptDigestStack",
    "PinnedWorkResumeCard",
    "OpsNorthStarRibbon",
    "BottleneckRadarLite",
    "SupportDeskEntryPanel",
    "SupportInboxViewSwitcher",
    "BlockingDependencyBanner",
    "CrossDomainTaskStrip",
    "/workspace",
    "/workspace/queue/:queueKey",
    "/ops/overview",
    "/ops/support",
    "/ops/support/inbox/:viewKey",
    "WorkspaceHomeRoute",
    "WorkspaceQueueRoute",
    "OpsOverviewRoute",
    "OpsSupportRoute",
    "OpsSupportInboxRoute",
    "SameShellContinuityLedger",
    "staff_entry_same_shell",
    "staff.workspace.queue",
    "ops.overview.control",
    "support.workspace.tickets",
}

REQUIRED_BOARDS = {
    "StaffEntryShellAnatomyBoard",
    "StartOfDayStateBoard",
    "OpsCalmBusyEntryBoard",
    "SupportEntryInboxBoard",
    "RouteContinuityBoard",
    "DegradationBlockingBoard",
}

DOC_MARKERS = REQUIRED_BOARDS | {
    "Staff_Entry_Quiet_Control",
    "Quiet_Internal_Control",
    "/workspace",
    "/workspace/queue/:queueKey",
    "/ops/overview",
    "/ops/support",
    "/ops/support/inbox/:viewKey",
    "staff.workspace.queue",
    "ops.overview.control",
    "support.workspace.tickets",
}

REQUIRED_SCREENSHOTS = {
    "220-workspace-desktop-quiet.png",
    "220-workspace-tablet-busy.png",
    "220-workspace-mobile-blocking.png",
    "220-ops-overview-desktop-calm.png",
    "220-ops-overview-desktop-busy.png",
    "220-support-entry-desktop.png",
    "220-support-inbox-repair.png",
    "220-degraded-state.png",
    "220-reduced-motion.png",
    "220-staff-entry-atlas.png",
    "220-staff-entry-visual-grammar.png",
}

REQUIRED_ARIA_FILES = {
    "220-workspace-aria.json",
    "220-ops-overview-aria.json",
    "220-support-entry-aria.json",
}


def fail(message: str) -> None:
    raise SystemExit(f"[staff-entry-surfaces] {message}")


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
        fail("task 220 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, REQUIRED_STRINGS)
    require_markers("app", read(APP), {"StaffEntrySurfaceApp", "staff-entry-surfaces.css"})
    require_markers(
        "styles",
        read(STYLES),
        {
            ".staff-entry",
            ".staff-entry__north-star",
            ".staff-entry__dependency-banner",
            ".staff-entry__support-table",
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
        {
            "NHS",
            "GOV.UK",
            "Atlassian",
            "Zendesk",
            "Playwright proves",
            "same-shell",
        },
    )
    require_markers("atlas", read(ATLAS), {"window.__staffEntryQuietControlAtlasData", "Staff_Entry_Quiet_Control"})
    require_markers("visual grammar", read(VISUAL_GRAMMAR), {"Quiet_Internal_Control", "Visual grammar"})
    require_markers("route map", read(ROUTE_MAP), {"flowchart LR", "support.workspace.tickets"})


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Staff_Entry_Quiet_Control":
        fail("contract visualMode drifted")
    if contract.get("styleSystem") != "Quiet_Internal_Control":
        fail("contract styleSystem drifted")
    if len(contract.get("routeSurfaces", [])) != 5:
        fail("contract route surface count drifted")

    with LAYOUT_MATRIX.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 12:
        fail("layout matrix is unexpectedly small")
    route_values = {row["route"] for row in rows}
    for expected in ("/workspace", "/ops/overview", "/ops/support", "/ops/support/inbox/:viewKey"):
        if expected not in route_values:
            fail(f"layout matrix missing route row: {expected}")

    state_cases = json.loads(read(STATE_CASES))
    states = {entry["state"] for entry in state_cases.get("states", [])}
    if states != {"quiet", "busy", "blocking", "degraded"}:
        fail("state case coverage drifted")

    gap = json.loads(read(SUPPORT_GAP))
    if gap.get("par220EntrySurfaceStatus") != "resolved_for_entry_surfaces_only":
        fail("support frontend gap artifact missing 220 entry status")


def validate_scripts() -> None:
    package_text = read(ROOT_PACKAGE)
    script_line = '"validate:staff-entry-surfaces": "python3 ./tools/analysis/validate_staff_entry_surfaces.py"'
    if script_line not in package_text:
        fail("package.json missing validate:staff-entry-surfaces script")

    root_updates_text = read(ROOT_SCRIPT_UPDATES)
    if "validate:staff-entry-surfaces" not in root_updates_text:
        fail("root_script_updates.py missing validate:staff-entry-surfaces")


def validate_playwright_artifacts() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        {
            "220_staff_start_of_day_operations_and_support_entry_surfaces",
            "WorkspaceHomeRoute",
            "OpsOverviewRoute",
            "OpsSupportRoute",
            "OpsSupportInboxRoute",
            "220-workspace-desktop-quiet.png",
            "220-staff-entry-atlas.png",
            "220-staff-entry-visual-grammar.png",
            "reducedMotion",
            "support.workspace.tickets",
            "staff.workspace.queue",
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
    validate_playwright_artifacts()
    print("staff entry surfaces validation passed")


if __name__ == "__main__":
    main()
