#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-slot-results.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-slot-results.tsx"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-slot-results.css"
SPEC_DOC = ROOT / "docs" / "frontend" / "294_slot_results_and_freshness_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "294_slot_results_and_freshness_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "294_slot_results_and_freshness_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "294_slot_results_and_freshness_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "294_slot_results_and_freshness_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "294_slot_results_and_freshness_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "294_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "294_slot_results_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "294_visual_reference_notes.json"
SPEC = ROOT / "tests" / "playwright" / "294_slot_results_and_freshness.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "294_slot_results_and_freshness.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "294_slot_results_and_freshness.accessibility.spec.ts"
NAV_SPEC = ROOT / "tests" / "playwright" / "294_slot_results_and_freshness.navigation.spec.ts"

TASK = (
    "par_294_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "slot_search_results_and_availability_freshness_states"
)

REQUIRED_PRIMITIVES = {
    "BookingSlotResultsStage",
    "SnapshotCoverageRibbon",
    "DayGroupedSlotList",
    "SlotDayHeader",
    "SlotSummaryRow",
    "RefineOptionsDrawer",
    "SlotSnapshotRecoveryPanel",
    "BookingSupportFallbackStub",
}

REQUIRED_SOURCES = {
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "carbondesignsystem.com/patterns/empty-states-pattern",
    "carbondesignsystem.com/patterns/loading-pattern",
    "carbondesignsystem.com/components/data-table/usage",
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/content/how-we-write",
    "service-manual.nhs.uk/content/punctuation",
    "w3.org/WAI/ARIA/apg/patterns/disclosure",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "w3.org/WAI/WCAG21/Understanding/reflow.html",
    "w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "w3.org/WAI/WCAG22/Understanding/consistent-help.html",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/next/test-snapshots",
    "playwright.dev/docs/api/class-page",
}


def fail(message: str) -> None:
    raise SystemExit(f"[294-slot-results-and-freshness] {message}")


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
    if "- [X] par_293_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_booking_workspace_ui_shell_and_return_contract" in checklist:
        pass
    if "- [X] par_293_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_appointment_scheduling_workspace" not in checklist:
        fail("prerequisite task 293 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 294 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    workspace = read(WORKSPACE)
    style = read(STYLE)

    require_markers(
        "results model",
        model,
        {
            "Snapshot_Result_Studio",
            "BookingSlotResultsProjection",
            "booking_case_294_renderable",
            "booking_case_294_partial",
            "booking_case_294_stale",
            "booking_case_294_no_supply",
            "booking_case_294_fallback",
            "patientReasonCueLabel",
            "groupBookingSlotsByDay",
        },
    )
    require_markers(
        "results route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "sessionStorage",
            "data-testid=\"booking-slot-results-stage\"",
            "data-testid=\"snapshot-coverage-ribbon\"",
            "data-testid=\"slot-snapshot-recovery-panel\"",
            "data-testid=\"booking-support-fallback-stub\"",
            "data-day-anchor",
            "data-visible-result-count",
            "data-snapshot-result-count",
        },
    )
    require_markers("workspace integration", workspace, {"BookingSlotResultsStage", "routeKey === \"select\""})
    require_markers(
        "results style",
        style,
        {
            ".patient-booking__coverage-ribbon",
            ".patient-booking__results-bar",
            ".patient-booking__refine-drawer",
            ".patient-booking__slot-row",
            "scroll-margin-top: 140px",
            "position: sticky",
            "prefers-reduced-motion",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(SPEC_DOC), read(ATLAS), read(TOPOLOGY), read(TOKENS), read(A11Y), read(ALIGNMENT)])
    require_markers(
        "docs",
        combined,
        REQUIRED_PRIMITIVES
        | {
            "Snapshot_Result_Studio",
            "/bookings/:bookingCaseId/select",
            "partial_coverage",
            "stale_refresh_required",
            "no_supply_confirmed",
            "support_fallback",
            "Playwright",
            "WCAG 2.2",
            "Linear",
            "Carbon",
            "NHS",
            "frozen snapshot",
        },
    )
    if "window.__patientBookingSlotResultsAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Snapshot_Result_Studio":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/bookings/:bookingCaseId/select"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    if "data-testid=booking-slot-results-stage" not in contract.get("domMarkers", []):
        fail("contract dom markers incomplete")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 6:
        fail("state matrix needs at least six rows")
    required_states = {
        "renderable",
        "partial_coverage",
        "stale_refresh_required",
        "no_supply_confirmed",
        "support_fallback",
    }
    if {row["view_state"] for row in rows} < required_states:
        fail("state matrix missing required recovery states")
    route_set = {row["route"] for row in rows}
    for route in {
        "/bookings/booking_case_294_renderable/select",
        "/bookings/booking_case_294_partial/select",
        "/bookings/booking_case_294_stale/select",
        "/bookings/booking_case_294_no_supply/select",
        "/bookings/booking_case_294_fallback/select",
    }:
        if route not in route_set:
            fail(f"state matrix missing route {route}")


def validate_visual_notes() -> None:
    notes = json.loads(read(VISUAL_NOTES))
    if notes.get("taskId") != TASK:
        fail("visual reference notes taskId drifted")
    urls = "\n".join(source.get("url", "") for source in notes.get("sources", []))
    require_markers("visual reference notes", urls, REQUIRED_SOURCES)


def validate_playwright() -> None:
    spec = read(SPEC)
    visual = read(VISUAL_SPEC)
    a11y = read(A11Y_SPEC)
    nav = read(NAV_SPEC)

    require_markers(
        "core spec",
        spec,
        {
            "context.tracing.start",
            "booking_case_294_renderable",
            "booking_case_294_partial",
            "booking_case_294_stale",
            "booking_case_294_no_supply",
            "booking_case_294_fallback",
            "booking-refresh-snapshot",
            "booking-slot-results-stage",
        },
    )
    require_markers(
        "visual spec",
        visual,
        {
            "294-slot-results-renderable-desktop.png",
            "294-slot-results-partial-tablet.png",
            "294-slot-results-stale-mobile.png",
            "294-slot-results-no-supply-desktop.png",
            "294-slot-results-atlas.png",
        },
    )
    require_markers(
        "accessibility spec",
        a11y,
        {
            "ariaSnapshot",
            "294-slot-results-renderable-aria.yml",
            "294-slot-results-stale-aria.yml",
            "294-slot-results-no-supply-aria.yml",
            "reducedMotion",
        },
    )
    require_markers(
        "navigation spec",
        nav,
        {
            "page.reload",
            "page.goBack",
            "data-day-anchor",
            "booking-slot-day-jump",
            "booking-refresh-snapshot",
        },
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_matrix()
    validate_visual_notes()
    validate_playwright()
    print("validate_294_slot_results_and_freshness: ok")


if __name__ == "__main__":
    main()
