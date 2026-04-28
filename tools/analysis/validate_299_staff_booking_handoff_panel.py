#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-booking-handoff.model.ts"
ROUTE = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-booking-handoff.tsx"
STYLE = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-booking-handoff.css"
APP = ROOT / "apps" / "clinical-workspace" / "src" / "App.tsx"
SHELL = ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx"
DATA = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.data.ts"
ACCESSIBILITY = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-accessibility.tsx"
FOCUS = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-focus-continuity.data.ts"
COMMAND_PALETTE = ROOT / "apps" / "clinical-workspace" / "src" / "workspace-command-palette.tsx"

SPEC_DOC = ROOT / "docs" / "frontend" / "299_staff_booking_handoff_panel_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "299_staff_booking_handoff_panel_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "299_staff_booking_handoff_panel_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "299_staff_booking_handoff_panel_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "299_staff_booking_handoff_panel_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "299_staff_booking_handoff_panel_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "299_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "299_staff_booking_panel_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "299_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_STAFF_BOOKING_PANEL.json"

SPEC = ROOT / "tests" / "playwright" / "299_staff_booking_handoff_panel.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "299_staff_booking_handoff_panel.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "299_staff_booking_handoff_panel.accessibility.spec.ts"
MULTIUSER_SPEC = ROOT / "tests" / "playwright" / "299_staff_booking_handoff_panel.multiuser.spec.ts"

TASK = (
    "par_299_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "staff_booking_handoff_panel_and_assisted_booking_views"
)

REQUIRED_PRIMITIVES = {
    "StaffBookingHandoffPanel",
    "BookingExceptionQueuePanel",
    "AssistedBookingCaseSummary",
    "StaffAssistableSlotList",
    "AssistedSlotCompareStage",
    "AssistedBookingRecoveryPanel",
    "TaskSettlementAndReacquireStrip",
}

REQUIRED_SOURCES = {
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "vercel.com/changelog/dashboard-navigation-redesign-rollout",
    "vercel.com/docs/dashboard-features/overview",
    "carbondesignsystem.com/components/data-table/usage/",
    "carbondesignsystem.com/patterns/status-indicator-pattern/",
    "carbondesignsystem.com/patterns/disabled-states/",
    "carbondesignsystem.com/patterns/read-only-states-pattern/",
    "carbondesignsystem.com/patterns/dialog-pattern",
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/components/table",
    "service-manual.nhs.uk/content/how-we-write",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
    "w3.org/WAI/WCAG22/Understanding/focus-appearance.html",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "w3.org/WAI/WCAG22/Techniques/aria/ARIA22",
    "w3.org/WAI/WCAG21/Understanding/reflow.html",
    "playwright.dev/docs/browser-contexts",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[299-staff-booking-handoff-panel] {message}")


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
    if "- [X] par_298_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_waitlist_enrolment_management_and_offer_acceptance_views" not in checklist:
        fail("prerequisite task 298 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 299 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    app = read(APP)
    shell = read(SHELL)
    data = read(DATA)
    accessibility = read(ACCESSIBILITY)
    focus = read(FOCUS)
    command_palette = read(COMMAND_PALETTE)

    require_markers(
        "booking model",
        model,
        REQUIRED_PRIMITIVES
        | {
            "Assisted_Booking_Control_Panel",
            "booking_case_299_linkage_required",
            "booking_case_299_compare_live",
            "booking_case_299_pending_confirmation",
            "booking_case_299_stale_recovery",
            "booking_case_299_confirmed",
            "staffBookingStateMatrix",
            "staffBookingPanelContractSummary",
            "resolveStaffBookingCaseSeed",
        },
    )
    require_markers(
        "booking route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "WorkspaceBookingsRoute",
            "data-shell=\"staff-booking\"",
            "data-booking-case",
            "data-exception-class",
            "data-review-lease-state",
            "data-focus-protected",
            "data-confirmation-truth",
            "data-task-settlement",
            "role=\"status\"",
            "WorkspaceProtectionStrip",
            "BufferedQueueChangeTray",
        },
    )
    require_markers(
        "booking style",
        style,
        {
            ".staff-shell__booking-control",
            ".staff-shell__booking-layout",
            ".staff-shell__booking-queue-row",
            ".staff-shell__booking-compare-grid",
            ".staff-shell__booking-side",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    require_markers(
        "app shell integration",
        "\n".join([app, shell, data, accessibility, focus, command_palette]),
        {
            "workspace-booking-handoff.css",
            "StaffBookingHandoffPanel",
            "\"bookings\"",
            "/workspace/bookings",
            "WorkspaceBookingsRoute",
            "resolveStaffBookingCaseSeed",
            "Assisted booking confirmation",
            "Open bookings",
        },
    )


def validate_docs() -> None:
    combined = "\n".join(
        [
            read(SPEC_DOC),
            read(ATLAS),
            read(TOPOLOGY),
            read(TOKENS),
            read(A11Y),
            read(ALIGNMENT),
        ]
    )
    require_markers(
        "docs",
        combined,
        REQUIRED_PRIMITIVES
        | {
            "Assisted_Booking_Control_Panel",
            "/workspace/bookings",
            "/workspace/bookings/:bookingCaseId",
            "BookingConfirmationTruthProjection",
            "TaskCompletionSettlementEnvelope",
            "WorkspaceFocusProtectionLease",
            "same-shell",
            "Playwright",
            "keyboard",
            "reacquire",
        },
    )
    if "window.__staffBookingHandoffPanelAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Assisted_Booking_Control_Panel":
        fail("contract visual mode drifted")
    route_paths = {route["path"] for route in contract.get("routes", [])}
    if route_paths != {"/workspace/bookings", "/workspace/bookings/:bookingCaseId"}:
        fail(f"contract route set drifted: {sorted(route_paths)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract primitive list incomplete")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-shell",
        "data-booking-case",
        "data-exception-class",
        "data-review-lease-state",
        "data-focus-protected",
        "data-confirmation-truth",
        "data-task-settlement",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 5:
        fail("state matrix is too small")
    scenario_ids = {row["scenario_id"] for row in rows}
    for required in {
        "booking_case_299_linkage_required",
        "booking_case_299_compare_live",
        "booking_case_299_pending_confirmation",
        "booking_case_299_stale_recovery",
        "booking_case_299_confirmed",
    }:
        if required not in scenario_ids:
            fail(f"state matrix missing scenario {required}")


def validate_visual_notes() -> None:
    notes = json.loads(read(VISUAL_NOTES))
    if notes.get("taskId") != TASK:
        fail("visual notes taskId drifted")
    source_urls = {source["url"] for source in notes.get("sources", [])}
    for required in REQUIRED_SOURCES:
        if not any(required in url for url in source_urls):
            fail(f"visual notes missing reference {required}")


def validate_interface_gap() -> None:
    gap = json.loads(read(INTERFACE_GAP))
    if gap.get("taskId") != TASK:
        fail("interface gap taskId drifted")
    for key in {
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    }:
        if not gap.get(key):
            fail(f"interface gap missing {key}")


def validate_tests() -> None:
    combined = "\n".join(
        [
            read(SPEC),
            read(VISUAL_SPEC),
            read(A11Y_SPEC),
            read(MULTIUSER_SPEC),
        ]
    )
    require_markers(
        "playwright specs",
        combined,
        {
            "booking_case_299_linkage_required",
            "booking_case_299_compare_live",
            "booking_case_299_pending_confirmation",
            "booking_case_299_stale_recovery",
            "booking_case_299_confirmed",
            "WorkspaceBookingsRoute",
            "toHaveScreenshot",
            "ariaSnapshot",
            "trace",
        },
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_matrix()
    validate_visual_notes()
    validate_interface_gap()
    validate_tests()


if __name__ == "__main__":
    main()

