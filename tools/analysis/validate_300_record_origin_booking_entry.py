#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"

MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-entry.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-entry.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-entry.css"
PATHS = ROOT / "apps" / "patient-web" / "src" / "patient-booking-entry.paths.ts"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
HOME_REQUESTS_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.model.ts"
HOME_REQUESTS_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx"
RECORDS_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.tsx"
SHELL_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.tsx"

SPEC_DOC = ROOT / "docs" / "frontend" / "300_record_origin_booking_entry_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "300_record_origin_booking_entry_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "300_record_origin_booking_entry_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "300_record_origin_booking_entry_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "300_record_origin_booking_entry_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "300_record_origin_booking_entry_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "300_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "300_record_origin_entry_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "300_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_BOOKING_ENTRY_ADAPTER.json"

HELPERS = ROOT / "tests" / "playwright" / "300_record_origin_booking_entry.helpers.ts"
SPEC = ROOT / "tests" / "playwright" / "300_record_origin_booking_entry.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "300_record_origin_booking_entry.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "300_record_origin_booking_entry.accessibility.spec.ts"
NAV_SPEC = ROOT / "tests" / "playwright" / "300_record_origin_booking_entry.navigation.spec.ts"

TASK = (
    "par_300_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "record_origin_continuation_and_booking_entry_surfaces"
)

REQUIRED_PRIMITIVES = {
    "RecordOriginBookingEntrySurface",
    "BookingEntryContextRibbon",
    "RecordFollowUpBookingCard",
    "BookingEntryReturnBinder",
    "BookingSourceBadge",
    "BookingLaunchSummaryCard",
    "BookingEntryNextActionPanel",
    "BookingQuietReturnStub",
    "PatientBookingEntryProjectionAdapter",
}

REQUIRED_SCENARIOS = {
    "booking_entry_300_home_ready",
    "booking_entry_300_requests_ready",
    "booking_entry_300_appointments_ready",
    "booking_entry_300_appointments_read_only",
    "booking_entry_300_record_origin_ready",
    "booking_entry_300_record_origin_recovery",
}

REQUIRED_SOURCES = {
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "vercel.com/docs/dashboard-features/overview",
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/components/action-link",
    "service-manual.nhs.uk/content/how-we-write",
    "w3.org/WAI/ARIA/apg/patterns/landmarks/",
    "w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "playwright.dev/docs/pages",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[300-record-origin-booking-entry] {message}")


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
    if "- [X] par_299_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_booking_handoff_panel_and_assisted_booking_views" not in checklist:
        fail("prerequisite task 299 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 300 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    paths = read(PATHS)
    app = read(APP)
    workspace_model = read(WORKSPACE_MODEL)
    home_requests_model = read(HOME_REQUESTS_MODEL)
    home_requests_route = read(HOME_REQUESTS_ROUTE)
    records_route = read(RECORDS_ROUTE)
    shell_route = read(SHELL_ROUTE)

    require_markers(
        "booking entry model",
        model,
        {
            "Record_Origin_Booking_Entry",
            "PatientBookingEntryProjectionAdapter",
            "PatientBookingEntryRestoreBundle300",
            "bookingEntryPath",
            "record_origin",
            "read_only_return",
            "recovery_bound_return",
            "awaiting_step_up",
            "PatientNavReturnContract",
            "requestReturnBundleRef",
            "recordOriginContinuationRef",
            "recoveryContinuationTokenRef",
            "patientBookingEntryStateMatrix",
        },
    )
    require_markers(
        "booking entry route",
        route,
        {
            "RecordOriginBookingEntrySurface",
            "BookingEntryContextRibbon",
            "RecordFollowUpBookingCard",
            "BookingEntryReturnBinder",
            "BookingSourceBadge",
            "BookingLaunchSummaryCard",
            "BookingEntryNextActionPanel",
            "BookingQuietReturnStub",
            "data-shell=\"patient-booking-entry\"",
            "data-origin-type",
            "data-origin-object",
            "data-record-continuation-state",
            "data-return-posture",
            "data-entry-writable",
            "booking-entry-return-binder",
            "booking-entry-primary-action",
            "booking-entry-return-action",
            "booking-entry-sticky-tray",
            "aria-live=\"polite\"",
        },
    )
    require_markers(
        "booking entry style",
        style,
        {
            ".patient-booking-entry__surface",
            ".patient-booking-entry__context-ribbon",
            ".patient-booking-entry__layout",
            ".patient-booking-entry__sticky-tray",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    require_markers(
        "booking entry paths",
        paths,
        REQUIRED_SCENARIOS | {"bookingEntryPath"},
    )
    require_markers(
        "app and source-route integration",
        "\n".join(
            [
                app,
                workspace_model,
                home_requests_model,
                home_requests_route,
                records_route,
                shell_route,
            ]
        ),
        {
            "PatientBookingEntryApp",
            "isPatientBookingEntryPath",
            "\"record_origin\"",
            "\"booking\"",
            "governed-placeholder-open-",
            "record-follow-up-booking-launch",
            "appointments-booking-entry-launch",
            "PATIENT_BOOKING_ENTRY_IDS.requestsReady",
            "PATIENT_BOOKING_ENTRY_IDS.recordOriginReady",
            "PATIENT_BOOKING_ENTRY_IDS.recordOriginRecovery",
            "/records/results/",
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
            "Record_Origin_Booking_Entry",
            "PatientNavReturnContract",
            "PatientRequestReturnBundle",
            "RecordOriginContinuationEnvelope",
            "RecoveryContinuationToken",
            "same-shell",
            "Playwright",
            "keyboard",
            "/bookings/entry/:entryFixtureId",
        },
    )
    if "window.__recordOriginBookingEntryAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Record_Origin_Booking_Entry":
        fail("contract visual mode drifted")
    route_paths = {route["path"] for route in contract.get("routes", [])}
    if route_paths != {"/bookings/entry/:entryFixtureId"}:
        fail(f"contract route set drifted: {sorted(route_paths)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract primitive list incomplete")
    if set(contract.get("scenarioIds", [])) != REQUIRED_SCENARIOS:
        fail("contract scenario list drifted")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-shell",
        "data-origin-type",
        "data-origin-object",
        "data-record-continuation-state",
        "data-return-posture",
        "data-entry-writable",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != len(REQUIRED_SCENARIOS):
        fail("state matrix row count drifted")
    scenario_ids = {row["entry_fixture_id"] for row in rows}
    if scenario_ids != REQUIRED_SCENARIOS:
        fail("state matrix scenarios drifted")
    for row in rows:
        if not row["target_workspace_path"].startswith("/bookings/"):
            fail(f"state matrix target path drifted for {row['entry_fixture_id']}")


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
            read(HELPERS),
            read(SPEC),
            read(VISUAL_SPEC),
            read(A11Y_SPEC),
            read(NAV_SPEC),
        ]
    )
    require_markers(
        "playwright specs",
        combined,
        REQUIRED_SCENARIOS
        | {
            "RecordOriginBookingEntrySurface",
            "BookingEntryContextRibbon",
            "record-follow-up-booking-launch",
            "appointments-booking-entry-launch",
            "governed-placeholder-open-booking",
            "trace",
            "ariaSnapshot",
            "axe",
            "startPatientWeb",
            "startStaticServer",
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
