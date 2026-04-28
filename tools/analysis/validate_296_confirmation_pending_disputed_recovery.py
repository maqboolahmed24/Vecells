#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.tsx"
WORKSPACE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-booking-confirmation.css"
WORKSPACE_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-workspace.model.ts"
SPEC_DOC = ROOT / "docs" / "frontend" / "296_confirmation_pending_disputed_recovery_spec.md"
ATLAS = ROOT / "docs" / "frontend" / "296_confirmation_pending_disputed_recovery_atlas.html"
TOPOLOGY = ROOT / "docs" / "frontend" / "296_confirmation_pending_disputed_recovery_topology.mmd"
TOKENS = ROOT / "docs" / "frontend" / "296_confirmation_pending_disputed_recovery_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "296_confirmation_pending_disputed_recovery_a11y_notes.md"
CONTRACT = ROOT / "data" / "contracts" / "296_confirmation_pending_disputed_recovery_contract.json"
ALIGNMENT = ROOT / "data" / "analysis" / "296_algorithm_alignment_notes.md"
MATRIX = ROOT / "data" / "analysis" / "296_confirmation_truth_state_matrix.csv"
VISUAL_NOTES = ROOT / "data" / "analysis" / "296_visual_reference_notes.json"
SPEC = ROOT / "tests" / "playwright" / "296_confirmation_pending_disputed_recovery.spec.ts"
VISUAL_SPEC = ROOT / "tests" / "playwright" / "296_confirmation_pending_disputed_recovery.visual.spec.ts"
A11Y_SPEC = ROOT / "tests" / "playwright" / "296_confirmation_pending_disputed_recovery.accessibility.spec.ts"
REFRESH_SPEC = ROOT / "tests" / "playwright" / "296_confirmation_pending_disputed_recovery.refresh.spec.ts"

TASK = (
    "par_296_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_"
    "confirmation_pending_disputed_and_recovery_states"
)

REQUIRED_PRIMITIVES = {
    "BookingConfirmReviewStage",
    "BookingInProgressState",
    "ConfirmationPendingState",
    "ReconciliationRecoveryState",
    "BookedSummaryChildState",
    "SelectedSlotProvenanceCard",
    "ConfirmationProgressStrip",
    "BookedSummaryMiniList",
    "RecoveryActionPanel",
    "ArtifactSummaryStub",
}

REQUIRED_SOURCES = {
    "service-manual.nhs.uk/design-system/components/summary-list",
    "service-manual.nhs.uk/design-system/components/buttons",
    "service-manual.nhs.uk/content/how-we-write",
    "linear.app/now/how-we-redesigned-the-linear-ui",
    "linear.app/now/behind-the-latest-design-refresh",
    "carbondesignsystem.com/patterns/loading-pattern/",
    "carbondesignsystem.com/patterns/status-indicator-pattern/",
    "w3.org/WAI/WCAG22/Techniques/aria/ARIA22",
    "w3.org/WAI/WCAG22/Understanding/status-messages.html",
    "w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "playwright.dev/docs/aria-snapshots",
    "playwright.dev/docs/accessibility-testing",
    "playwright.dev/docs/trace-viewer-intro",
    "playwright.dev/docs/next/test-snapshots",
    "playwright.dev/docs/next/api/class-pageassertions",
}


def fail(message: str) -> None:
    raise SystemExit(f"[296-confirmation-pending-disputed-recovery] {message}")


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
    if "- [X] par_295_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_offer_selection_flow_with_truthful_hold_posture" not in checklist:
        fail("prerequisite task 295 is not complete in checklist")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 296 is not claimed or complete in checklist")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    workspace = read(WORKSPACE)
    style = read(STYLE)
    workspace_model = read(WORKSPACE_MODEL)

    require_markers(
        "confirmation model",
        model,
        REQUIRED_PRIMITIVES
        | {
            "Confirmation_Truth_Studio",
            "booking_case_296_review",
            "booking_case_296_pending",
            "booking_case_296_reconciliation",
            "booking_case_296_route_drift",
            "booking_case_296_identity_repair",
            "booking_case_296_confirmed",
            "pre_commit_review",
            "booking_in_progress",
            "confirmation_pending",
            "reconciliation_required",
            "bookingConfirmationContractSummary",
        },
    )
    require_markers(
        "confirmation route",
        route,
        REQUIRED_PRIMITIVES
        | {
            "sessionStorage",
            "data-confirmation-truth",
            "data-patient-visibility",
            "data-manage-exposure",
            "data-artifact-exposure",
            "data-route-freeze-state",
            "data-reminder-exposure",
            "data-selected-slot",
            "role=\"status\"",
            "booking-confirmation-stage",
        },
    )
    require_markers(
        "workspace integration",
        workspace,
        {"BookingConfirmationStage", "routeKey === \"confirm\"", "onReturnToSelection"},
    )
    require_markers(
        "workspace model aliases",
        workspace_model,
        {
            "booking_case_296_review",
            "booking_case_296_pending",
            "booking_case_296_confirmed",
            "booking_case_296_identity_repair",
        },
    )
    require_markers(
        "confirmation style",
        style,
        {
            ".patient-booking__confirmation-layout",
            ".patient-booking__confirmation-progress",
            ".patient-booking__confirmation-panel",
            ".patient-booking__confirmation-inline-loader",
            ".patient-booking__confirmation-artifacts",
            "@media (prefers-reduced-motion: reduce)",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(SPEC_DOC), read(ATLAS), read(TOPOLOGY), read(TOKENS), read(A11Y), read(ALIGNMENT)])
    require_markers(
        "docs",
        combined,
        REQUIRED_PRIMITIVES
        | {
            "Confirmation_Truth_Studio",
            "/bookings/:bookingCaseId/confirm",
            "Playwright",
            "WCAG 2.2",
            "Linear",
            "Carbon",
            "NHS",
            "RouteFreezeDisposition",
            "ArtifactPresentationContract",
            "OutboundNavigationGrant",
        },
    )
    if "window.__patientBookingConfirmationAtlasData" not in read(ATLAS):
        fail("atlas missing exported atlas data handle")


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Confirmation_Truth_Studio":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/bookings/:bookingCaseId/confirm"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract ui primitive list incomplete")
    dom_markers = set(contract.get("domMarkers", []))
    for marker in {
        "data-confirmation-truth",
        "data-patient-visibility",
        "data-manage-exposure",
        "data-artifact-exposure",
        "data-route-freeze-state",
    }:
        if marker not in dom_markers:
            fail(f"contract missing dom marker {marker}")


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 9:
        fail("state matrix needs at least nine rows")
    required_truths = {
        "pre_commit_review",
        "booking_in_progress",
        "confirmation_pending",
        "reconciliation_required",
        "confirmed",
    }
    if {row["confirmation_truth"] for row in rows} < required_truths:
        fail("state matrix missing required confirmation truth states")
    required_freezes = {"live", "publication_stale", "identity_repair_active"}
    if {row["route_freeze_state"] for row in rows} < required_freezes:
        fail("state matrix missing required route freeze states")


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
    refresh = read(REFRESH_SPEC)

    require_markers(
        "core spec",
        spec,
        {
            "booking_case_295_nonexclusive/select",
            "booking-confirmation-stage",
            "booking_in_progress",
            "confirmation_pending",
            "confirmed",
            "booking_case_296_reconciliation/confirm",
            "296-confirmation-pending-disputed-recovery-trace.zip",
        },
    )
    require_markers(
        "visual spec",
        visual,
        {
            "PatientBookingConfirmationAtlas",
            "296-confirmation-review-desktop.png",
            "296-confirmation-confirmed-desktop.png",
            "296-confirmation-identity-repair-mobile.png",
        },
    )
    require_markers(
        "accessibility spec",
        a11y,
        {
            "ariaSnapshot",
            "296-confirmation-review-aria.yml",
            "296-confirmation-confirmed-aria.yml",
            "data-motion-profile",
        },
    )
    require_markers(
        "refresh spec",
        refresh,
        {
            "goBack",
            "goForward",
            "booking_case_296_route_drift/confirm",
            "booking_case_296_identity_repair/confirm",
            "publication_stale",
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
