#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.css"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
CONFIRM = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.tsx"
SPEC_DOC = ROOT / "docs" / "frontend" / "297_appointment_manage_views_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "297_appointment_manage_views_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "297_appointment_manage_views_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "297_appointment_manage_views_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "297_appointment_manage_views_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "297_appointment_manage_views_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "297_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "297_appointment_manage_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "297_visual_reference_notes.json"
SPEC = ROOT / "tests" / "playwright" / "297_appointment_manage_views.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "297_appointment_manage_views.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "297_appointment_manage_views.accessibility.spec.ts"
RESCHEDULE_SPEC = ROOT / "tests" / "playwright" / "297_appointment_manage_views.reschedule.spec.ts"

TASK = (
    "par_297_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "appointment_detail_cancel_reschedule_and_reminder_views"
)

REQUIRED_PRIMITIVES = {
    "PatientAppointmentDetailView",
    "AppointmentSummaryCard",
    "AttendanceInstructionPanel",
    "ReminderPreferencePanel",
    "CancelAppointmentFlow",
    "RescheduleEntryStage",
    "AppointmentDetailUpdateForm",
    "ManagePendingOrRecoveryPanel",
    "AssistedFallbackStub",
}

REQUIRED_SOURCES = {
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/components/date-input",
    "service-manual.nhs.uk/design-system/patterns/confirmation-page",
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/content/how-we-write",
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "carbondesignsystem.com/patterns/status-indicator-pattern/",
    "carbondesignsystem.com/patterns/loading-pattern",
    "carbondesignsystem.com/patterns/forms-pattern/",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html",
    "w3.org/WAI/WCAG22/Understanding/reflow.html",
    "w3.org/WAI/WCAG22/Understanding/status-messages.html",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/test-snapshots",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[297-appointment-manage-views] {message}")


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
    if "- [X] par_296_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_confirmation_pending_disputed_and_recovery_states" not in checklist:
        fail("prerequisite task 296 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 297 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    workspace = read(WORKSPACE)
    workspace_model = read(WORKSPACE_MODEL)
    confirm = read(CONFIRM)

    require_markers(
        "manage model",
        model,
        REQUIRED_PRIMITIVES
        | {
            "Manage_Appointment_Studio",
            "booking_case_297_ready",
            "booking_case_297_reschedule",
            "booking_case_297_cancel_pending",
            "booking_case_297_reminder_blocked",
            "booking_case_297_stale",
            "booking_case_297_confirmation_pending",
            "appointmentManageContractSummary",
            "appointmentManageStateMatrix",
            "rescheduleSelectionScenarioId",
        },
    )
    require_markers(
        "manage route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "OfferSelectionStage",
            "sessionStorage",
            "data-appointment-id",
            "data-manage-capability",
            "data-manage-pending-state",
            "data-reminder-exposure",
            "data-attendance-mode",
            "data-confirmation-truth",
            "role=\"dialog\"",
            "aria-modal=\"true\"",
            "cancel-appointment-confirm",
            "manage-open-cancel",
            "manage-reminder-primary-action",
        },
    )
    require_markers(
        "manage style",
        style,
        {
            ".patient-booking__manage-layout",
            ".patient-booking__manage-card--summary",
            ".patient-booking__manage-card--state",
            ".patient-booking__manage-dialog",
            ".patient-booking__danger-action",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    require_markers(
        "workspace integration",
        workspace,
        {
            "PatientAppointmentDetailView",
            "routeKey === \"manage\"",
            "openManageHost",
            "Manage appointment",
            "onOpenManageHost",
        },
    )
    require_markers(
        "workspace model integration",
        workspace_model,
        {
            "\"manage\"",
            "/bookings/:bookingCaseId/manage",
            "booking_case_297_ready",
            "booking_case_297_confirmation_pending",
            "booking_case_297_stale",
            "manageFixtureAlias",
        },
    )
    require_markers(
        "confirmation integration",
        confirm,
        {"onOpenManageHost", "open_manage_stub"},
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
            "Manage_Appointment_Studio",
            "/bookings/:bookingCaseId/manage",
            "BookingContinuityEvidenceProjection",
            "BookingConfirmationTruthProjection",
            "ScopedMutationGate",
            "OfferSelectionStage",
            "Playwright",
            "WCAG 2.2",
            "Linear",
            "Carbon",
            "NHS",
        },
    )
    if "window.__patientAppointmentManageAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Manage_Appointment_Studio":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/bookings/:bookingCaseId/manage"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-appointment-id",
        "data-manage-capability",
        "data-manage-pending-state",
        "data-reminder-exposure",
        "data-attendance-mode",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 12:
        fail("state matrix needs at least twelve rows")
    required = {
        "booking_case_297_ready",
        "booking_case_297_reschedule",
        "booking_case_297_cancel_pending",
        "booking_case_297_reminder_blocked",
        "booking_case_297_stale",
        "booking_case_297_confirmation_pending",
    }
    scenario_ids = {row["scenario_id"] for row in rows}
    missing = required - scenario_ids
    if missing:
        fail(f"state matrix missing scenarios: {sorted(missing)}")


def validate_visual_notes() -> None:
    visual_notes = json.loads(read(VISUAL_NOTES))
    if visual_notes.get("taskId") != TASK:
        fail("visual reference notes taskId drifted")
    urls = {entry.get("url", "") for entry in visual_notes.get("sources", [])}
    for required in REQUIRED_SOURCES:
        if not any(required in url for url in urls):
            fail(f"visual reference notes missing source {required}")


def validate_specs() -> None:
    combined = "\n".join([read(SPEC), read(VISUAL_SPEC), read(A11Y_SPEC), read(RESCHEDULE_SPEC)])
    require_markers(
        "playwright specs",
        combined,
        {
            "/manage?origin=appointments&returnRoute=/appointments",
            "patient-appointment-manage-view",
            "cancel-appointment-confirm",
            "reschedule-entry-stage",
            "manage-reminder-primary-action",
            "manage-contact-repair-panel",
            "trace",
            "aria",
            "screenshot",
        },
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_matrix()
    validate_visual_notes()
    validate_specs()
    print("297 appointment manage views validation passed.")


if __name__ == "__main__":
    main()
