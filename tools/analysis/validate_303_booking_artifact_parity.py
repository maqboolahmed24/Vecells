#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
ARTIFACT_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-artifact.model.ts"
ARTIFACT = ROOT / "apps" / "patient-web" / "src" / "patient-booking-artifact.tsx"
ARTIFACT_STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-artifact.css"
CONFIRM = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.tsx"
MANAGE = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.tsx"

SPEC_DOC = ROOT / "docs" / "frontend" / "303_booking_artifact_parity_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "303_booking_artifact_parity_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "303_booking_artifact_parity_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "303_booking_artifact_parity_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "303_booking_artifact_parity_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "303_booking_artifact_parity_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "303_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "303_booking_artifact_parity_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "303_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_BOOKING_ARTIFACT_PARITY_VIEW.json"

HELPERS = ROOT / "tests" / "playwright" / "303_booking_artifact_parity.helpers.ts"
SPEC = ROOT / "tests" / "playwright" / "303_booking_artifact_parity.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "303_booking_artifact_parity.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "303_booking_artifact_parity.accessibility.spec.ts"
PRINT_SPEC = ROOT / "tests" / "playwright" / "303_booking_artifact_parity.print_and_handoff.spec.ts"

TASK = (
    "par_303_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "accessibility_and_artifact_parity_for_booking_documents"
)
PRIMITIVES = {
    "PatientBookingArtifactFrame",
    "AppointmentReceiptSummary",
    "AttendanceInstructionPanel",
    "BookingArtifactActionTray",
    "PrintableAppointmentView",
    "CalendarExportSummarySheet",
    "DirectionsHandoffPanel",
    "BookingArtifactParityView",
}
SOURCE_URLS = {
    "https://service-manual.nhs.uk/design-system/components/summary-list",
    "https://service-manual.nhs.uk/content/how-we-write",
    "https://service-manual.nhs.uk/content/pdfs-and-other-non-html-documents",
    "https://service-manual.nhs.uk/design-system/components/buttons",
    "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/trace-viewer-intro",
    "https://playwright.dev/docs/api/class-page",
    "https://carbondesignsystem.com/patterns/read-only-states-pattern/",
    "https://carbondesignsystem.com/patterns/status-indicator-pattern/",
}


def fail(message: str) -> None:
    raise SystemExit(f"[303-booking-artifact-parity] {message}")


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
    if "- [X] par_302_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_mobile_responsive_booking_and_manage_flows" not in checklist:
        fail("prerequisite task 302 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 303 is not claimed or complete in checklist")


def validate_source() -> None:
    combined = "\n".join(
        [
            read(WORKSPACE_MODEL),
            read(WORKSPACE),
            read(ARTIFACT_MODEL),
            read(ARTIFACT),
            read(ARTIFACT_STYLE),
            read(CONFIRM),
            read(MANAGE),
        ]
    )
    require_markers(
        "source",
        combined,
        PRIMITIVES
        | {
            "/bookings/:bookingCaseId/artifacts",
            "artifact_host",
            "data-artifact-mode",
            "data-parity-posture",
            "data-grant-state",
            "data-print-posture",
            "data-handoff-readiness",
            "data-artifact-source",
            "data-artifact-exposure",
            "artifactSource",
            "artifactMode",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(SPEC_DOC), read(ATLAS), read(TOPOLOGY), read(TOKENS), read(A11Y), read(ALIGNMENT)])
    require_markers(
        "docs",
        combined,
        PRIMITIVES
        | {
            "Booking_Artifact_Frame",
            "summary-first",
            "ArtifactPresentationContract",
            "OutboundNavigationGrant",
            "print",
            "calendar",
            "directions",
        },
    )
    if "window.__bookingArtifactAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Booking_Artifact_Frame":
        fail("contract visual mode drifted")
    if set(contract.get("uiPrimitives", [])) != PRIMITIVES:
        fail("contract uiPrimitives drifted")
    expected_markers = {
        "data-artifact-mode",
        "data-parity-posture",
        "data-grant-state",
        "data-print-posture",
        "data-handoff-readiness",
        "data-artifact-source",
        "data-artifact-exposure",
    }
    if set(contract.get("domMarkers", [])) != expected_markers:
        fail("contract dom markers drifted")


def validate_matrix() -> None:
    rows = list(csv.DictReader(read(MATRIX).splitlines()))
    if len(rows) < 12:
        fail("artifact parity matrix is too small")
    if {"verified", "summary_only", "recovery_only"} - {row["parity_posture"] for row in rows}:
        fail("artifact parity matrix must include verified, summary_only, and recovery_only")
    if "blocked" not in {row["grant_state"] for row in rows}:
        fail("artifact parity matrix must include blocked grant posture")


def validate_visual_notes() -> None:
    notes = json.loads(read(VISUAL_NOTES))
    urls = {source["url"] for source in notes.get("sources", [])}
    missing = SOURCE_URLS - urls
    if missing:
        fail(f"visual reference notes missing URLs: {sorted(missing)}")


def validate_gap() -> None:
    gap = json.loads(read(INTERFACE_GAP))
    if gap.get("status") != "local_contract_created":
        fail("interface gap status drifted")
    if "BookingArtifactParityView" not in json.dumps(gap):
        fail("interface gap should reference BookingArtifactParityView")


def validate_playwright() -> None:
    combined = "\n".join(
        [read(HELPERS), read(SPEC), read(VISUAL_SPEC), read(A11Y_SPEC), read(PRINT_SPEC)]
    )
    require_markers(
        "playwright",
        combined,
        {
            "booking_case_296_confirmed",
            "booking_case_297_ready",
            "booking_case_296_pending",
            "booking_case_297_stale",
            "booking_case_296_identity_repair",
            "artifactSource=confirm",
            "artifactSource=manage",
            "artifactMode=print",
            "artifactMode=browser_handoff",
            "host=nhs_app",
            "ariaSnapshot",
            "axe",
            "emulateMedia",
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
    print("303 booking artifact parity validation passed")


if __name__ == "__main__":
    main()
