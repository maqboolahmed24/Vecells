#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
RESPONSIVE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-responsive.model.ts"
RESPONSIVE_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-responsive.tsx"
RESPONSIVE_STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-responsive.css"
SELECTION = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.tsx"
CONFIRM = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.tsx"
MANAGE = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.tsx"
WAITLIST = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.tsx"

SPEC_DOC = ROOT / "docs" / "frontend" / "302_booking_mobile_responsive_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "302_booking_mobile_responsive_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "302_booking_mobile_responsive_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "302_booking_mobile_responsive_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "302_booking_mobile_responsive_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "302_booking_mobile_responsive_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "302_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "302_booking_mobile_breakpoint_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "302_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_BOOKING_RESPONSIVE_COVERAGE.json"

SPEC = ROOT / "tests" / "playwright" / "302_booking_mobile_responsive.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "302_booking_mobile_responsive.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "302_booking_mobile_responsive.accessibility.spec.ts"
EMBEDDED_SPEC = ROOT / "tests" / "playwright" / "302_booking_mobile_responsive.embedded.spec.ts"

TASK = (
    "par_302_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "mobile_responsive_booking_and_manage_flows"
)
PRIMITIVES = {
    "BookingMissionStackFrame",
    "BookingResponsiveStage",
    "BookingStickyActionTray",
    "ResponsivePreferenceDrawer",
    "ManageCompactSummarySheet",
    "ResponsiveWaitlistCard",
    "EmbeddedBookingChromeAdapter",
    "BookingResponsiveCoverageProfile",
}
SOURCE_URLS = {
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "nextjs.org/docs/app/guides/preserving-ui-state",
    "service-manual.nhs.uk/design-system/styles/layout",
    "digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
    "nhs.uk/nhs-app/setting-up/using-computer-to-access-services",
    "w3.org/WAI/WCAG22/Understanding/reflow",
    "w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
    "w3.org/WAI/WCAG22/Understanding/focus-visible",
    "w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    "w3.org/WAI/WCAG22/Understanding/status-messages",
    "w3.org/WAI/WCAG22/Techniques/aria/ARIA22",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "playwright.dev/docs/emulation",
    "playwright.dev/docs/api/class-page",
}


def fail(message: str) -> None:
    raise SystemExit(f"[302-booking-mobile-responsive] {message}")


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
    if "- [X] par_301_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_action_recovery_envelopes_for_booking_failures" not in checklist:
        fail("prerequisite task 301 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 302 is not claimed or complete in checklist")


def validate_source() -> None:
    combined = "\n".join(
        [
            read(WORKSPACE),
            read(RESPONSIVE_MODEL),
            read(RESPONSIVE_ROUTE),
            read(RESPONSIVE_STYLE),
            read(SELECTION),
            read(CONFIRM),
            read(MANAGE),
            read(WAITLIST),
        ]
    )
    require_markers("source", combined, PRIMITIVES | {
        "Mobile_Transactional_Booking",
        "data-breakpoint-class",
        "data-mission-stack-state",
        "data-safe-area-class",
        "data-sticky-action-posture",
        "data-embedded-mode",
        "data-responsive-task-id",
        "host=nhs_app",
    })


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
    require_markers("docs", combined, PRIMITIVES | {
        "Mobile_Transactional_Booking",
        "mission_stack",
        "Playwright",
        "compact",
        "wide",
        "embedded",
    })
    if "window.__bookingMobileResponsiveAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Mobile_Transactional_Booking":
        fail("contract visual mode drifted")
    if set(contract.get("uiPrimitives", [])) != PRIMITIVES:
        fail("contract uiPrimitives drifted")
    expected_markers = {
        "data-breakpoint-class",
        "data-mission-stack-state",
        "data-safe-area-class",
        "data-sticky-action-posture",
        "data-embedded-mode",
        "data-responsive-task-id",
        "data-responsive-visual-mode",
    }
    if set(contract.get("domMarkers", [])) != expected_markers:
        fail("contract dom markers drifted")


def validate_matrix() -> None:
    rows = list(csv.DictReader(read(MATRIX).splitlines()))
    if len(rows) < 8:
        fail("breakpoint matrix is too small")
    seen_breakpoints = {row["breakpoint_class"] for row in rows}
    if seen_breakpoints != {"compact", "wide"} and "compact" not in seen_breakpoints:
        fail("breakpoint matrix must include compact coverage")
    if "nhs_app" not in {row["embedded_mode"] for row in rows}:
        fail("breakpoint matrix must include embedded host coverage")


def validate_visual_notes() -> None:
    notes = json.loads(read(VISUAL_NOTES))
    urls = {source["url"] for source in notes.get("sources", [])}
    if not SOURCE_URLS.issubset(urls):
        missing = sorted(SOURCE_URLS - urls)
        fail(f"visual reference notes missing URLs: {missing}")


def validate_gap() -> None:
    gap = json.loads(read(INTERFACE_GAP))
    if gap.get("status") != "local_contract_created":
        fail("interface gap status drifted")
    if "BookingResponsiveCoverageProfile" not in json.dumps(gap):
        fail("interface gap should reference BookingResponsiveCoverageProfile")


def validate_playwright() -> None:
    combined = "\n".join(
        [read(SPEC), read(VISUAL_SPEC), read(A11Y_SPEC), read(EMBEDDED_SPEC)]
    )
    require_markers(
        "playwright",
        combined,
        {
            "booking_case_293_live",
            "booking_case_295_nonexclusive",
            "booking_case_296_review",
            "booking_case_297_ready",
            "booking_case_298_offer_nonexclusive",
            "host=nhs_app",
            "safeArea=bottom",
            "reducedMotion",
            "axe",
            "booking-mission-stack-frame",
        },
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_matrix()
    validate_visual_notes()
    validate_gap()
    validate_playwright()
    print("302 booking mobile responsive validation passed")


if __name__ == "__main__":
    main()
