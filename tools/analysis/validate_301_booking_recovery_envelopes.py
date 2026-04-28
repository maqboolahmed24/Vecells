#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"

RECOVERY_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-recovery.model.ts"
RECOVERY_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-recovery.tsx"
RECOVERY_STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-recovery.css"
WORKSPACE_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
SELECTION_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-offer-selection.tsx"
CONFIRM_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.tsx"
MANAGE_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-appointment-manage.tsx"
WAITLIST_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.tsx"
WAITLIST_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-waitlist-views.model.ts"

SPEC_DOC = ROOT / "docs" / "frontend" / "301_booking_recovery_envelopes_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "301_booking_recovery_envelopes_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "301_booking_recovery_envelopes_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "301_booking_recovery_envelopes_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "301_booking_recovery_envelopes_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "301_booking_recovery_envelopes_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "301_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "301_booking_recovery_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "301_visual_reference_notes.json"
INTERFACE_GAP = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_BOOKING_RECOVERY_REASON_CATALOG.json"

HELPERS = ROOT / "tests" / "playwright" / "301_booking_recovery_envelopes.helpers.ts"
SPEC = ROOT / "tests" / "playwright" / "301_booking_recovery_envelopes.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "301_booking_recovery_envelopes.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "301_booking_recovery_envelopes.accessibility.spec.ts"
PARITY_SPEC = ROOT / "tests" / "playwright" / "301_booking_recovery_envelopes.channel_parity.spec.ts"

TASK = (
    "par_301_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "patient_action_recovery_envelopes_for_booking_failures"
)

REQUIRED_PRIMITIVES = {
    "BookingRecoveryShell",
    "BookingRecoveryReasonPanel",
    "BookingRecoverySummaryCard",
    "BookingRecoveryNextActionCard",
    "BookingIdentityHoldPanel",
    "BookingSecureLinkRecoveryFrame",
    "BookingContactRepairMorph",
    "BookingRecoveryReturnStub",
    "BookingRecoveryReasonCatalog",
}

REQUIRED_SCENARIOS = {
    "booking_case_293_recovery",
    "booking_case_295_stale",
    "booking_case_295_unavailable",
    "booking_case_296_reconciliation",
    "booking_case_296_route_drift",
    "booking_case_296_identity_repair",
    "booking_case_297_stale",
    "booking_case_297_confirmation_pending",
    "booking_case_297_reminder_blocked",
    "booking_case_298_offer_expired",
    "booking_case_298_offer_superseded",
    "booking_case_298_contact_repair",
    "booking_case_298_contact_repair_secure",
}

REQUIRED_SOURCE_URLS = {
    "service-manual.nhs.uk/design-system/components/error-message",
    "service-manual.nhs.uk/design-system/components/error-summary",
    "service-manual.nhs.uk/content/how-we-write",
    "w3.org/WAI/ARIA/apg/patterns/alert/",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "w3.org/WAI/WCAG22/Understanding/focus-order.html",
    "w3.org/WAI/WCAG22/Understanding/timing-adjustable.html",
    "w3.org/WAI/WCAG22/Understanding/status-messages.html",
    "carbondesignsystem.com/patterns/status-indicator-pattern/",
    "carbondesignsystem.com/patterns/dialog-pattern",
    "carbondesignsystem.com/patterns/read-only-states-pattern/",
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/trace-viewer-intro",
}


def fail(message: str) -> None:
    raise SystemExit(f"[301-booking-recovery-envelopes] {message}")


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
    if "- [X] par_300_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_record_origin_continuation_and_booking_entry_surfaces" not in checklist:
        fail("prerequisite task 300 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 301 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(RECOVERY_MODEL)
    route = read(RECOVERY_ROUTE)
    style = read(RECOVERY_STYLE)
    integration = "\n".join(
        [
            read(WORKSPACE_ROUTE),
            read(WORKSPACE_MODEL),
            read(SELECTION_ROUTE),
            read(CONFIRM_ROUTE),
            read(MANAGE_ROUTE),
            read(WAITLIST_ROUTE),
            read(WAITLIST_MODEL),
        ]
    )

    require_markers(
        "recovery model",
        model,
        REQUIRED_PRIMITIVES
        | REQUIRED_SCENARIOS
        | {
            "Booking_Recovery_Envelope",
            "PatientActionRecoveryEnvelope",
            "PatientActionRecoveryProjection",
            "RecoveryContinuationToken",
            "rf_patient_secure_link_recovery",
            "recoveryTupleHash",
            "contact_route_repair_required",
            "wrong_patient",
            "confirmation_pending",
            "bookingRecoveryStateMatrix",
            "bookingRecoveryContractSummary",
        },
    )
    require_markers(
        "recovery route",
        route,
        {
            "BookingRecoveryShell",
            "BookingRecoveryReasonPanel",
            "BookingRecoverySummaryCard",
            "BookingRecoveryNextActionCard",
            "BookingIdentityHoldPanel",
            "BookingSecureLinkRecoveryFrame",
            "BookingContactRepairMorph",
            "BookingRecoveryReturnStub",
            "data-recovery-reason",
            "data-summary-tier",
            "data-identity-hold-state",
            "data-next-safe-action",
            "data-reentry-route-family",
            "data-channel-mode",
            "data-recovery-tuple-hash",
        },
    )
    require_markers(
        "recovery style",
        style,
        {
            ".patient-booking__recovery-shell",
            ".patient-booking__recovery-layout",
            ".patient-booking__recovery-card--identity",
            ".patient-booking__recovery-card--secure-link",
            ".patient-booking__recovery-card--repair",
            "@media (prefers-reduced-motion: reduce)",
        },
    )
    require_markers(
        "route integration",
        integration,
        {
            "BookingRecoveryShell",
            "resolveWorkspaceBookingRecoveryEnvelope",
            "resolveSelectionBookingRecoveryEnvelope",
            "resolveConfirmationBookingRecoveryEnvelope",
            "resolveManageBookingRecoveryEnvelope",
            "resolveWaitlistBookingRecoveryEnvelope",
            "booking_case_298_contact_repair_secure",
            "onReturnToOrigin",
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
            "Booking_Recovery_Envelope",
            "PatientActionRecoveryEnvelope",
            "PatientActionRecoveryProjection",
            "PatientIdentityHoldProjection",
            "PatientSecureLinkSessionProjection",
            "RecoveryContinuationToken",
            "same-shell",
            "secure-link",
            "contact-route repair",
            "Playwright",
        },
    )
    if "window.__bookingRecoveryEnvelopeAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Booking_Recovery_Envelope":
        fail("contract visualMode drifted")
    if set(contract.get("uiPrimitives", [])) != REQUIRED_PRIMITIVES:
        fail("contract uiPrimitives drifted")
    if set(contract.get("scenarios", [])) != REQUIRED_SCENARIOS:
        fail("contract scenarios drifted")


def validate_matrix() -> None:
    rows = list(csv.DictReader(read(MATRIX).splitlines()))
    seen = {row["scenario_id"] for row in rows}
    if seen != REQUIRED_SCENARIOS:
        fail(f"state matrix scenarios drifted: {sorted(seen)}")
    secure_row = next((row for row in rows if row["scenario_id"] == "booking_case_298_contact_repair_secure"), None)
    if secure_row is None:
        fail("missing secure-link contact repair row")
    if secure_row["channel_mode"] != "secure_link":
        fail("secure-link contact repair row lost secure_link channel mode")
    if secure_row["recovery_reason"] != "contact_route_repair_required":
        fail("secure-link contact repair row lost contact repair reason")


def validate_visual_notes() -> None:
    notes = read(VISUAL_NOTES)
    for source in REQUIRED_SOURCE_URLS:
        if source not in notes:
            fail(f"visual notes missing source: {source}")


def validate_interface_gap() -> None:
    gap = json.loads(read(INTERFACE_GAP))
    if gap.get("taskId") != TASK:
        fail("interface gap taskId drifted")
    if gap.get("missingSurface") != "BookingRecoveryReasonCatalog":
        fail("interface gap missingSurface drifted")


def validate_tests() -> None:
    combined = "\n".join(
        [
            read(HELPERS),
            read(SPEC),
            read(VISUAL_SPEC),
            read(A11Y_SPEC),
            read(PARITY_SPEC),
        ]
    )
    require_markers(
        "playwright tests",
        combined,
        {
            "BookingRecoveryShell",
            "BookingSecureLinkRecoveryFrame",
            "BookingIdentityHoldPanel",
            "booking_case_298_contact_repair_secure",
            "booking_case_296_identity_repair",
            "booking-recovery-action-open_contact_repair",
            "ariaSnapshot",
            "axe.run",
            "trace",
            "atlas",
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
    print("[301-booking-recovery-envelopes] ok")


if __name__ == "__main__":
    main()
