#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.css"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
OFFER_SELECTION = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.tsx"
SPEC_DOC = ROOT / "docs" / "frontend" / "298_waitlist_views_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "298_waitlist_views_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "298_waitlist_views_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "298_waitlist_views_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "298_waitlist_views_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "298_waitlist_views_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "298_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "298_waitlist_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "298_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_WAITLIST_VIEWS.json"
SPEC = ROOT / "tests" / "playwright" / "298_waitlist_views.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "298_waitlist_views.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "298_waitlist_views.accessibility.spec.ts"
SECURE_LINK_SPEC = ROOT / "tests" / "playwright" / "298_waitlist_secure_link_acceptance.spec.ts"

TASK = (
    "par_298_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "waitlist_enrolment_management_and_offer_acceptance_views"
)

REQUIRED_PRIMITIVES = {
    "JoinWaitlistSheet",
    "WaitlistPreferenceSummary",
    "WaitlistManageView",
    "ActiveWaitlistOfferCard",
    "WaitlistOfferAcceptView",
    "WaitlistContinuationStatePanel",
    "WaitlistFallbackPanel",
    "WaitlistContactRepairMorph",
    "WaitlistExpiryOutcome",
    "ExpiryOrSupersessionProvenanceCard",
}

REQUIRED_SOURCES = {
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "service-manual.nhs.uk/design-system/patterns/interruption-page",
    "service-manual.nhs.uk/content/how-we-write",
    "carbondesignsystem.com/patterns/empty-states-pattern/",
    "carbondesignsystem.com/patterns/dialog-pattern",
    "carbondesignsystem.com/patterns/disabled-states/",
    "carbondesignsystem.com/patterns/read-only-states-pattern/",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "w3.org/WAI/ARIA/apg/patterns/alertdialog/",
    "w3.org/WAI/WCAG22/Understanding/status-messages.html",
    "w3.org/WAI/WCAG22/Techniques/aria/ARIA22",
    "w3.org/WAI/WCAG22/Understanding/reflow.html",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/test-snapshots",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[298-waitlist-views] {message}")


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
    if "- [X] par_297_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_appointment_detail_cancel_reschedule_and_reminder_views" not in checklist:
        fail("prerequisite task 297 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 298 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    workspace = read(WORKSPACE)
    workspace_model = read(WORKSPACE_MODEL)
    offer_selection = read(OFFER_SELECTION)

    require_markers(
        "waitlist model",
        model,
        REQUIRED_PRIMITIVES
        | {
            "Waitlist_Continuation_Studio",
            "booking_case_298_join_sheet",
            "booking_case_298_waiting",
            "booking_case_298_offer_nonexclusive",
            "booking_case_298_offer_expired",
            "booking_case_298_fallback_due",
            "booking_case_298_contact_repair",
            "booking_case_298_secure_link_offer",
            "waitlistViewStateMatrix",
            "waitlistViewContractSummary",
        },
    )
    require_markers(
        "waitlist route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "sessionStorage",
            "data-waitlist-state",
            "data-continuation-truth",
            "data-reservation-truth",
            "data-offer-expiry-mode",
            "data-fallback-route",
            "data-entry-mode",
            "data-reachability-state",
            "role=\"status\"",
        },
    )
    require_markers(
        "waitlist style",
        style,
        {
            ".patient-booking__waitlist-stage",
            ".patient-booking__waitlist-layout",
            ".patient-booking__waitlist-card--repair",
            ".patient-booking__waitlist-card--sticky",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    require_markers(
        "workspace integration",
        workspace,
        {
            "PatientWaitlistViews",
            "routeKey === \"waitlist\"",
            "openWaitlistHost",
            "Waitlist continuation",
        },
    )
    require_markers(
        "workspace model integration",
        workspace_model,
        {
            "\"waitlist\"",
            "/bookings/:bookingCaseId/waitlist",
            "booking_case_298_join_sheet",
            "booking_case_298_waiting",
            "booking_case_298_offer_nonexclusive",
            "booking_case_298_fallback_due",
            "booking_case_298_contact_repair",
            "/recovery/secure-link",
        },
    )
    require_markers(
        "offer selection integration",
        offer_selection,
        {"onOpenWaitlistHost", "booking-open-waitlist", "Join the waitlist"},
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
            "Waitlist_Continuation_Studio",
            "/bookings/:bookingCaseId/waitlist",
            "WaitlistContinuationTruthProjection",
            "WaitlistFallbackObligation",
            "ReservationTruthProjection",
            "secure-link",
            "contact-route repair",
            "Playwright",
            "WCAG 2.2",
            "Carbon",
            "NHS",
        },
    )
    if "window.__patientWaitlistViewsAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Waitlist_Continuation_Studio":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/bookings/:bookingCaseId/waitlist"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-waitlist-state",
        "data-continuation-truth",
        "data-window-risk-state",
        "data-reservation-truth",
        "data-offer-expiry-mode",
        "data-fallback-route",
        "data-entry-mode",
        "data-reachability-state",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 10:
        fail("state matrix is too small")
    scenario_ids = {row["scenario_id"] for row in rows}
    for required in {
        "booking_case_298_join_sheet",
        "booking_case_298_waiting",
        "booking_case_298_offer_nonexclusive",
        "booking_case_298_offer_held",
        "booking_case_298_offer_pending",
        "booking_case_298_offer_expired",
        "booking_case_298_offer_superseded",
        "booking_case_298_fallback_due",
        "booking_case_298_overdue_callback",
        "booking_case_298_contact_repair",
        "booking_case_298_secure_link_offer",
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
            read(SECURE_LINK_SPEC),
        ]
    )
    require_markers(
        "playwright specs",
        combined,
        {
            "booking_case_298_join_sheet",
            "booking_case_298_offer_nonexclusive",
            "booking_case_298_offer_expired",
            "booking_case_298_fallback_due",
            "booking_case_298_contact_repair",
            "booking_case_298_secure_link_offer",
            "patient-waitlist-stage",
            "waitlist-secure-link-banner",
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
