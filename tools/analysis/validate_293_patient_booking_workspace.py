#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.css"
SPEC_DOC = ROOT / "docs" / "frontend" / "293_patient_booking_workspace_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "293_patient_booking_workspace_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "293_patient_booking_workspace_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "293_patient_booking_workspace_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "293_patient_booking_workspace_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "293_patient_booking_workspace_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "293_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "293_patient_booking_workspace_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "293_visual_reference_notes.json"
HELPERS = ROOT / "tests" / "playwright" / "293_patient_booking_workspace.helpers.ts"
SPEC = ROOT / "tests" / "playwright" / "293_patient_booking_workspace.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "293_patient_booking_workspace.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "293_patient_booking_workspace.accessibility.spec.ts"
NAV_SPEC = ROOT / "tests" / "playwright" / "293_patient_booking_workspace.navigation.spec.ts"

TASK = (
    "par_293_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "patient_appointment_scheduling_workspace"
)

REQUIRED_PRIMITIVES = {
    "PatientBookingWorkspaceShell",
    "BookingCasePulseHeader",
    "BookingNeedSummary",
    "NeedWindowRibbon",
    "BookingPreferenceSummaryCard",
    "BookingCapabilityPosturePanel",
    "BookingReturnContractBinder",
    "BookingContentStage",
    "BookingQuietReturnStub",
}

REQUIRED_MARKERS = {
    "data-shell=\"patient-booking\"",
    "data-booking-case",
    "data-capability-posture",
    "data-continuity-state",
    "data-dominant-action",
    "booking-help-panel",
    "booking-content-stage",
    "Patient_Booking_Workspace_Route",
}

REQUIRED_SOURCES = {
    "linear.app/blog/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "vercel.com/academy/nextjs-foundations/nested-layouts",
    "service-manual.nhs.uk/design-system/components/action-link",
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/patterns/start-page",
    "w3.org/WAI/ARIA/apg/practices/landmark-regions/",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
}


def fail(message: str) -> None:
    raise SystemExit(f"[293-patient-booking-workspace] {message}")


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
    if "- [X] par_292_phase4_track_backend_build_booking_reconciliation_and_external_confirmation_dispute_worker" not in checklist:
        fail("prerequisite task 292 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 293 is not claimed or complete in checklist")


def validate_source() -> None:
    app = read(APP)
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)

    require_markers(
        "App route dispatch",
        app,
        {"isPatientBookingWorkspacePath", "PatientBookingWorkspaceApp", "patient-booking-workspace.css"},
    )
    require_markers(
        "model source",
        model,
        {
            "Appointment_Scheduling_Workspace",
            "PatientAppointmentWorkspaceProjection",
            "BookingCapabilityProjection",
            "PatientPortalContinuityEvidenceBundle",
            "PatientNavReturnContract",
            "resolvePatientBookingWorkspaceEntry",
            "booking_case_293_recovery",
            "booking_case_293_degraded",
            "booking_case_293_assisted",
        },
    )
    require_markers("route source", route, REQUIRED_PRIMITIVES | REQUIRED_MARKERS | {"sessionStorage", "history.pushState", "beforeunload"})
    require_markers(
        "style",
        style,
        {
            "--booking-canvas: #f4f7fb",
            "--booking-panel: #ffffff",
            "--booking-panel-alt: #f8fafc",
            "--booking-stroke: #d7e0ea",
            "--booking-primary: #2457ff",
            "--booking-help: #6d28d9",
            "--booking-safe: #0f766e",
            "--booking-warn: #b7791f",
            "--booking-blocked: #b42318",
            "grid-template-columns: 288px minmax(760px, 1fr) 280px",
            "min-height: 56px",
            "min-height: 64px",
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
            "Appointment_Scheduling_Workspace",
            "/bookings/:bookingCaseId",
            "/bookings/:bookingCaseId/select",
            "/bookings/:bookingCaseId/confirm",
            "same-shell",
            "Need help booking?",
            "Playwright",
            "WCAG 2.2",
            "Linear",
            "Vercel",
            "NHS",
            "slot_results_host",
            "confirmation_host",
        },
    )
    if "window.__patientBookingWorkspaceAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Appointment_Scheduling_Workspace":
        fail("contract visual mode drifted")
    route_set = {route["path"] for route in contract.get("routes", [])}
    if route_set != {
        "/bookings/:bookingCaseId",
        "/bookings/:bookingCaseId/select",
        "/bookings/:bookingCaseId/confirm",
    }:
        fail(f"contract route set drifted: {sorted(route_set)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    if "data-shell=patient-booking" not in contract.get("domMarkers", []):
        fail("contract dom markers incomplete")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 8:
        fail("state matrix needs at least eight rows")
    route_set = {row["route"] for row in rows}
    for route in {
        "/bookings/booking_case_293_live",
        "/bookings/booking_case_293_live/select",
        "/bookings/booking_case_293_live/confirm",
    }:
        if route not in route_set:
            fail(f"state matrix missing route {route}")
    required_surface_states = {
        "self_service_live",
        "assisted_only",
        "linkage_required",
        "local_component_required",
        "degraded_manual",
        "blocked",
        "recovery_required",
    }
    if {row["surface_state"] for row in rows} < required_surface_states:
        fail("state matrix missing required surface states")


def validate_visual_notes() -> None:
    notes = json.loads(read(VISUAL_NOTES))
    if notes.get("taskId") != TASK:
        fail("visual reference notes taskId drifted")
    urls = "\n".join(source.get("url", "") for source in notes.get("sources", []))
    require_markers("visual reference notes", urls, REQUIRED_SOURCES)


def validate_playwright() -> None:
    helper = read(HELPERS)
    spec = read(SPEC)
    visual = read(VISUAL_SPEC)
    a11y = read(A11Y_SPEC)
    nav = read(NAV_SPEC)

    require_markers("Playwright helper", helper, {"startPatientWeb", "openBookingRoute", "writeAccessibilitySnapshot", "ATLAS_PATH"})
    require_markers("core spec", spec, {"context.tracing.start", "data-shell", "assisted_only", "degraded_manual", "blocked"})
    require_markers("visual spec", visual, {"293-booking-workspace-entry-desktop.png", "293-booking-workspace-atlas.png"})
    require_markers("accessibility spec", a11y, {"ariaSnapshot", "booking-workspace-live-aria", "reducedMotion"})
    require_markers("navigation spec", nav, {"page.goBack", "booking-return-contract-binder", "selected-anchor"})


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
