#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.tsx"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.css"
SPEC_DOC = ROOT / "docs" / "frontend" / "295_offer_selection_truthful_hold_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "295_offer_selection_truthful_hold_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "295_offer_selection_truthful_hold_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "295_offer_selection_truthful_hold_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "295_offer_selection_truthful_hold_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "295_offer_selection_truthful_hold_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "295_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "295_offer_selection_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "295_visual_reference_notes.json"
SPEC = ROOT / "tests" / "playwright" / "295_offer_selection_truthful_hold.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "295_offer_selection_truthful_hold.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "295_offer_selection_truthful_hold.accessibility.spec.ts"
COMPARE_SPEC = ROOT / "tests" / "playwright" / "295_offer_selection_truthful_hold.compare.spec.ts"

TASK = (
    "par_295_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "offer_selection_flow_with_truthful_hold_posture"
)

REQUIRED_PRIMITIVES = {
    "OfferSelectionStage",
    "SelectedSlotPin",
    "ReservationTruthBanner",
    "SlotCompareDrawer",
    "SlotReasonCueChip",
    "StickyConfirmTray",
    "SelectionRecoveryPanel",
}

REQUIRED_SOURCES = {
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "carbondesignsystem.com/patterns/read-only-states-pattern/",
    "carbondesignsystem.com/patterns/disabled-states/",
    "carbondesignsystem.com/components/contained-list/usage/",
    "carbondesignsystem.com/components/modal/usage/",
    "carbondesignsystem.com/components/tag/usage/",
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/content/how-we-write",
    "w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "w3.org/WAI/ARIA/apg/patterns/button/",
    "w3.org/WAI/WCAG22/Understanding/focus-appearance.html",
    "w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[295-offer-selection-truthful-hold] {message}")


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
    if "- [X] par_294_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_slot_search_results_and_availability_freshness_states" not in checklist:
        fail("prerequisite task 294 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 295 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    workspace = read(WORKSPACE)
    style = read(STYLE)

    require_markers(
        "offer selection model",
        model,
        {
            "Offer_Selection_Studio",
            "OfferSelectionProjection",
            "booking_case_295_nonexclusive",
            "booking_case_295_exclusive_hold",
            "booking_case_295_checking",
            "booking_case_295_unavailable",
            "booking_case_295_stale",
            "booking_case_295_no_supply",
            "booking_case_295_support_fallback",
            "truthful_nonexclusive",
            "exclusive_held",
            "pending_confirmation",
            "offerSelectionContractSummary",
        },
    )
    require_markers(
        "offer selection route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "sessionStorage",
            "data-selected-slot",
            "data-reservation-truth",
            "data-countdown-mode",
            "data-compare-open",
            "data-rank-cue",
            "data-testid=\"selected-slot-pin\"",
            "data-testid=\"slot-compare-drawer\"",
            "data-testid=\"sticky-confirm-tray\"",
        },
    )
    require_markers(
        "workspace integration",
        workspace,
        {"OfferSelectionStage", "routeKey === \"select\"", "truthful selection"},
    )
    require_markers(
        "offer selection style",
        style,
        {
            ".patient-booking__offer-layout",
            ".patient-booking__selected-pin",
            ".patient-booking__truth-banner",
            ".patient-booking__sticky-confirm",
            ".patient-booking__compare-drawer",
            ".patient-booking__slot-row--offer[data-selected-slot=\"true\"]",
            "position: fixed",
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
            "Offer_Selection_Studio",
            "/bookings/:bookingCaseId/select",
            "truthful_nonexclusive",
            "exclusive_held",
            "pending_confirmation",
            "revalidation_required",
            "Playwright",
            "WCAG 2.2",
            "Linear",
            "Carbon",
            "NHS",
        },
    )
    if "window.__patientBookingOfferSelectionAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Offer_Selection_Studio":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/bookings/:bookingCaseId/select"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-selected-slot",
        "data-reservation-truth",
        "data-countdown-mode",
        "data-compare-open",
        "data-rank-cue",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 7:
        fail("state matrix needs at least seven rows")
    required_states = {
        "truthful_nonexclusive",
        "exclusive_held",
        "pending_confirmation",
        "expired",
        "revalidation_required",
    }
    if {row["selected_truth"] for row in rows} < required_states:
        fail("state matrix missing required truth states")
    route_set = {row["route"] for row in rows}
    for route in {
        "/bookings/booking_case_295_nonexclusive/select",
        "/bookings/booking_case_295_exclusive_hold/select",
        "/bookings/booking_case_295_checking/select",
        "/bookings/booking_case_295_unavailable/select",
        "/bookings/booking_case_295_stale/select",
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
    compare = read(COMPARE_SPEC)

    require_markers(
        "core spec",
        spec,
        {
            "context.tracing.start",
            "booking_case_295_nonexclusive",
            "booking_case_295_exclusive_hold",
            "booking_case_295_stale",
            "booking_case_295_unavailable",
            "slot-compare-drawer",
            "selection-recovery-panel",
            "295-offer-selection-truthful-hold-trace.zip",
        },
    )
    require_markers(
        "visual spec",
        visual,
        {
            "295-offer-selection-nonexclusive-desktop.png",
            "295-offer-selection-compare-desktop.png",
            "295-offer-selection-exclusive-tablet.png",
            "295-offer-selection-stale-mobile.png",
            "295-offer-selection-atlas.png",
        },
    )
    require_markers(
        "accessibility spec",
        a11y,
        {
            "ariaSnapshot",
            "295-offer-selection-nonexclusive-aria.yml",
            "295-offer-selection-compare-aria.yml",
            "295-offer-selection-stale-aria.yml",
            "295-offer-selection-unavailable-aria.yml",
            "reducedMotion",
        },
    )
    require_markers(
        "compare spec",
        compare,
        {
            "data-compare-trigger='open-compare'",
            "data-compare-open",
            "slot_summary_294_222_1120",
            "slot_summary_294_211_0910",
            "Make this the selected slot",
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


if __name__ == "__main__":
    main()
