#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-more-info-callback-contact-repair.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-more-info-callback-contact-repair.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-more-info-callback-contact-repair.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "216_more_info_callback_and_contact_repair_views.md"
ATLAS = ROOT / "docs" / "frontend" / "216_more_info_callback_contact_repair_atlas.html"
INTERACTION_MAP = ROOT / "docs" / "frontend" / "216_more_info_callback_contact_repair_interaction_map.mmd"
CONTRACT = ROOT / "data" / "contracts" / "216_more_info_callback_contact_repair_ui_contract.json"
MATRIX = ROOT / "data" / "analysis" / "216_validation_confirmation_and_recovery_matrix.csv"
CASES = ROOT / "data" / "analysis" / "216_mobile_and_accessibility_state_cases.json"
PLAYWRIGHT = ROOT / "tests" / "playwright" / "216_more_info_callback_and_contact_repair_views.spec.js"
OUTPUT = ROOT / "output" / "playwright"

TASK = "par_216_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_more_info_response_callback_status_and_contact_repair_views"

PREREQUISITES = [
    "par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections",
    "par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes",
]

REQUIRED_PROJECTIONS = {
    "PatientMoreInfoStatusProjection",
    "PatientMoreInfoResponseThreadProjection",
    "PatientCallbackStatusProjection",
    "PatientReachabilitySummaryProjection",
    "PatientContactRepairProjection",
    "PatientConsentCheckpointProjection",
    "PatientRequestReturnBundle",
}

REQUIRED_COMPONENTS = {
    "MoreInfoThreadFrame",
    "PromptStepCard",
    "ReplyWindowBand",
    "CheckAnswersPanel",
    "SubmissionReceiptPanel",
    "CallbackStatusRail",
    "ContactRepairBridge",
    "BlockedActionSummaryCard",
    "ContinuityPreservedPanel",
}

REQUIRED_TESTIDS = {
    "More_Info_Callback_Contact_Repair_Route",
    "more-info-thread-frame",
    "prompt-step-card",
    "reply-window-band",
    "more-info-error-summary",
    "check-answers-panel",
    "submission-receipt-panel",
    "callback-status-rail",
    "blocked-action-summary-card",
    "contact-repair-bridge",
    "continuity-preserved-panel",
}

REQUIRED_ROUTES = {
    "/requests/:requestId/more-info",
    "/requests/:requestId/more-info/step-2",
    "/requests/:requestId/more-info/check",
    "/requests/:requestId/more-info/confirmation",
    "/requests/:requestId/more-info/late-review",
    "/requests/:requestId/more-info/expired",
    "/requests/:requestId/more-info/read-only",
    "/requests/:requestId/callback",
    "/requests/:requestId/callback/at-risk",
    "/requests/:requestId/consent-checkpoint",
    "/contact-repair/:repairCaseId",
    "/contact-repair/:repairCaseId/applied",
}

REQUIRED_SCREENSHOTS = {
    "216-more-info-step-desktop.png",
    "216-more-info-step-2.png",
    "216-validation-error.png",
    "216-check-answers.png",
    "216-confirmation.png",
    "216-late-review.png",
    "216-expired-recovery.png",
    "216-read-only.png",
    "216-callback-status.png",
    "216-callback-at-risk.png",
    "216-contact-repair.png",
    "216-contact-repair-applied.png",
    "216-consent-checkpoint.png",
    "216-mobile-more-info.png",
    "216-mobile-contact-repair.png",
    "216-zoom-validation.png",
    "216-reduced-motion.png",
    "216-atlas.png",
    "216-atlas-step-gallery.png",
    "216-atlas-validation.png",
    "216-atlas-confirmation.png",
    "216-atlas-callback.png",
    "216-atlas-repair.png",
    "216-atlas-continuity.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[more-info-callback-contact-repair-ui] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for prerequisite in PREREQUISITES:
        if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 216 is not claimed or complete in checklist")


def validate_source() -> None:
    app = read(APP)
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    require_markers(
        "App route dispatch",
        app,
        {
            "isMoreInfoCallbackContactRepairPath",
            "MoreInfoCallbackContactRepairApp",
            "./patient-more-info-callback-contact-repair.css",
        },
    )
    require_markers(
        "model source",
        model,
        REQUIRED_PROJECTIONS
        | {
            "PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE",
            "CallbackExpectationEnvelope",
            "CallbackOutcomeEvidenceBundle",
            "CallbackResolutionGate",
            "route_repair_required",
            "renew_consent",
            "PatientMoreInfoCallbackContactRepairEntryProjection",
            "step-2",
            "makePatientRequestReturnBundle215",
            "requestReturnBundleRef",
            "selectedAnchorRef",
            "experienceContinuityEvidenceRef",
            "answerabilityState",
            "repairRequiredState",
        },
    )
    require_markers(
        "route source",
        route,
        REQUIRED_COMPONENTS
        | REQUIRED_TESTIDS
        | {
            "PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE",
            "aria-live",
            "aria-invalid",
            "aria-errormessage",
            "fieldset",
            "legend",
            "history.pushState",
            "history.replaceState",
            "prompt_216_photo_timing",
            "prompt_216_symptom_change",
            "/contact-repair/repair_216_sms/applied",
            "Blocked action",
            "rebound pending",
        },
    )
    for forbidden in (
        "Date.now()",
        "window.localStorage",
        "document.cookie",
        "setInterval(",
        "secureLinkTtlAsCycleExpiry",
        "browserTimerAsCallbackTruth",
    ):
        if forbidden in model + route:
            fail(f"source contains forbidden marker: {forbidden}")
    require_markers(
        "style",
        style,
        {
            "--workflow-canvas: #f6f8fb",
            "--workflow-panel: #ffffff",
            "--workflow-tint: #eef3f9",
            "--workflow-strong: #102033",
            "--workflow-text: #425466",
            "--workflow-border: #d9e1ea",
            "--workflow-response: #495fea",
            "--workflow-callback: #0e8c87",
            "--workflow-muted: #5a6b7b",
            "--workflow-warning: #b7791f",
            "--workflow-blocked: #b42318",
            "--workflow-success: #127a5a",
            "min-height: 64px",
            "width: min(100%, 1240px)",
            "grid-template-columns: minmax(0, 760px) 320px",
            "gap: 32px",
            "padding: 16px",
            "min-height: 56px",
            "workflow-route-morph 160ms ease",
            "prefers-reduced-motion",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(ATLAS), read(INTERACTION_MAP)])
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_COMPONENTS
        | REQUIRED_ROUTES
        | {
            "Precision_Reassurance_Workflow",
            "window.__moreInfoCallbackRepairUiAtlasData",
            "GOV.UK Question pages",
            "GOV.UK Check answers",
            "GOV.UK Confirmation pages",
            "GOV.UK Error summary",
            "WCAG 2.2",
            "Playwright ARIA snapshots",
            "CallbackExpectationEnvelope",
            "CallbackOutcomeEvidenceBundle",
            "CallbackResolutionGate",
            "secure-link expiry",
            "same-object child route",
            "same-shell",
            "reduced-motion",
            "Validation blocked",
            "Repair applied",
            "Consent checkpoint",
        },
    )


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Precision_Reassurance_Workflow":
        fail("contract visual mode drifted")
    if set(contract.get("routes", [])) != REQUIRED_ROUTES:
        fail("contract route set drifted")
    if set(contract.get("projectionFamiliesConsumed", [])) < REQUIRED_PROJECTIONS:
        fail("contract projection family list incomplete")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_COMPONENTS:
        fail("contract component list incomplete")
    if contract.get("layoutTokens", {}).get("topBandPx") != 64:
        fail("contract top band token drifted")
    blocker_dominance = contract.get("blockerDominance", {})
    for key in {
        "staleReplySuppressedWhenReachabilityBlocked",
        "callbackRepairSuppressesPromiseMutation",
        "consentCheckpointSuppressesDependentAction",
        "repairAppliedDoesNotAutomaticallyReopenReply",
    }:
        if blocker_dominance.get(key) is not True:
            fail(f"contract blocker dominance missing {key}")
    for forbidden in (
        "secure_link_ttl_as_cycle_expiry",
        "browser_timer_as_callback_truth",
        "route_local_prompt_stack",
        "last_successful_send_as_reachability_truth",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden source {forbidden}")


def validate_analysis_data() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 13:
        fail("validation/recovery matrix needs at least thirteen rows")
    routes = {row["route"] for row in rows}
    for route in REQUIRED_ROUTES:
        concrete = (
            route.replace(":requestId", "request_211_a").replace(":repairCaseId", "repair_216_sms")
        )
        if concrete not in routes:
            fail(f"matrix missing route {concrete}")
    visible_states = {row["visible_state"] for row in rows}
    for state in {
        "reply_needed",
        "reply_submitted",
        "late_review",
        "expired",
        "read_only",
        "scheduled",
        "route_repair_required",
        "ready",
        "applied",
    }:
        if state not in visible_states:
            fail(f"matrix missing visible state {state}")
    focus_targets = {row["focus_target"] for row in rows}
    for target in {
        "more-info-error-summary",
        "check-answers-title",
        "submission-receipt-title",
        "blocked-action-summary-title",
        "contact-repair-title",
        "consent-title",
    }:
        if target not in focus_targets:
            fail(f"matrix missing focus target {target}")
    screenshots = {row["evidence_screenshot"] for row in rows}
    for screenshot in REQUIRED_SCREENSHOTS & screenshots:
        if not screenshot:
            fail("matrix contains blank screenshot reference")

    cases = json.loads(read(CASES))
    if cases.get("taskId") != TASK:
        fail("mobile/accessibility cases taskId drifted")
    if cases.get("visualMode") != "Precision_Reassurance_Workflow":
        fail("mobile/accessibility cases visual mode drifted")
    case_ids = {case.get("caseId") for case in cases.get("cases", [])}
    for case_id in {
        "mobile_more_info_step",
        "mobile_contact_repair",
        "reduced_motion",
        "zoom_400_validation",
        "aria_more_info",
        "aria_callback_repair",
    }:
        if case_id not in case_ids:
            fail(f"mobile/accessibility cases missing {case_id}")
    require_markers(
        "mobile/accessibility cases",
        json.dumps(cases),
        {
            "FieldAccessibilityContract",
            "FormErrorSummaryContract",
            "FocusTransitionContract",
            "FreshnessAccessibilityContract",
            "AccessibilitySemanticCoverageProfile",
        },
    )


def validate_playwright() -> None:
    spec = read(PLAYWRIGHT)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_COMPONENTS
        | REQUIRED_TESTIDS
        | REQUIRED_SCREENSHOTS
        | {
            "ariaSnapshot",
            "document.body.style.zoom",
            "reducedMotion",
            "viewport: { width: 390",
            "assertMoreInfoFlow",
            "assertValidationScreenshot",
            "assertStateRoutes",
            "assertResponsive",
            "assertAtlas",
            "ArrowRight",
            "--run",
        },
    )
    for screenshot in REQUIRED_SCREENSHOTS:
        if not (OUTPUT / screenshot).exists():
            fail(f"missing Playwright screenshot: output/playwright/{screenshot}")


def validate_package_script() -> None:
    package = json.loads(read(PACKAGE))
    expected = "python3 ./tools/analysis/validate_more_info_callback_contact_repair_ui.py"
    if package.get("scripts", {}).get("validate:more-info-callback-contact-repair-ui") != expected:
        fail("root package missing validate:more-info-callback-contact-repair-ui script")
    updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:more-info-callback-contact-repair-ui":' not in updates:
        fail("root_script_updates missing validate:more-info-callback-contact-repair-ui")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_analysis_data()
    validate_playwright()
    validate_package_script()
    print("[more-info-callback-contact-repair-ui] ok")


if __name__ == "__main__":
    main()
