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
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "215_patient_home_requests_and_request_detail_routes.md"
ATLAS = ROOT / "docs" / "frontend" / "215_patient_home_requests_and_request_detail_atlas.html"
GRAMMAR = ROOT / "docs" / "frontend" / "215_patient_shell_visual_grammar.html"
CONTINUITY = ROOT / "docs" / "frontend" / "215_patient_shell_route_continuity.mmd"
CONTRACT = ROOT / "data" / "contracts" / "215_patient_home_requests_and_request_detail_surface_contract.json"
LAYOUT_MATRIX = ROOT / "data" / "analysis" / "215_home_and_request_responsive_layout_matrix.csv"
PLACEHOLDER_CASES = (
    ROOT / "data" / "analysis" / "215_request_placeholder_and_return_bundle_cases.json"
)
PLAYWRIGHT = ROOT / "tests" / "playwright" / "215_patient_home_requests_and_request_detail_routes.spec.js"
OUTPUT = ROOT / "output" / "playwright"

TASK = "par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes"

PREREQUISITES = [
    "par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic",
    "par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections",
    "par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections",
    "par_213_crosscutting_track_backend_build_health_record_projection_and_record_artifact_parity_witness",
    "par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules",
]

REQUIRED_PROJECTIONS = {
    "PatientSpotlightDecisionProjection",
    "PatientQuietHomeDecision",
    "PatientNavUrgencyDigest",
    "PatientNavReturnContract",
    "PatientRequestsIndexProjection",
    "PatientRequestSummaryProjection",
    "PatientRequestLineageProjection",
    "PatientRequestDetailProjection",
    "PatientRequestDownstreamProjection",
    "PatientNextActionProjection",
    "PatientActionRoutingProjection",
    "PatientActionSettlementProjection",
    "PatientSafetyInterruptionProjection",
    "PatientRequestReturnBundle",
}

REQUIRED_PRIMITIVES = {
    "PatientShellFrame",
    "HomeSpotlightCard",
    "QuietHomePanel",
    "RequestIndexRail",
    "RequestSummaryRow",
    "RequestDetailHero",
    "RequestLineageStrip",
    "CasePulsePanel",
    "DecisionDock",
    "GovernedPlaceholderCard",
}

REQUIRED_TESTIDS = {
    "Patient_Home_Requests_Detail_Route",
    "home-spotlight-card",
    "quiet-home-panel",
    "home-compact-grid",
    "request-index-rail",
    "request-summary-row-",
    "request-detail-hero",
    "request-lineage-strip",
    "case-pulse-panel",
    "decision-dock",
    "governed-placeholder-card-",
}

REQUIRED_SCREENSHOTS = {
    "215-home-desktop.png",
    "215-quiet-home.png",
    "215-requests-desktop.png",
    "215-detail-desktop.png",
    "215-requests-tablet.png",
    "215-home-mobile.png",
    "215-requests-mobile.png",
    "215-detail-zoom.png",
    "215-reduced-motion.png",
    "215-atlas.png",
    "215-visual-grammar.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[patient-home-requests-detail-ui] {message}")


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
        fail("task 215 is not claimed or complete in checklist")


def validate_source() -> None:
    app = read(APP)
    route = read(ROUTE)
    model = read(MODEL)
    style = read(STYLE)
    require_markers("App route dispatch", app, {"isPatientHomeRequestsDetailPath", "PatientHomeRequestsDetailRoutesApp"})
    require_markers(
        "route source",
        route,
        REQUIRED_PRIMITIVES
        | REQUIRED_TESTIDS
        | {
            "/home",
            "/requests",
            "/requests/${request.requestRef}",
            "ArrowDown",
            "ArrowUp",
            "aria-live",
            "sessionStorage",
            "focusTestId",
            "PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE",
        },
    )
    require_markers(
        "model source",
        model,
        REQUIRED_PROJECTIONS
        | {
            "Quiet_Casework_Premium",
            "PatientHomeRequestsDetailEntryProjection",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS",
            "request_211_a",
            "more-info",
            "callback",
            "records",
            "messages",
            "no_dashboard_filler",
        },
    )
    for forbidden in ("controllerLocalTrim", "broadFetchThenTrim", "document.cookie", "localStorage"):
        if forbidden in route + model:
            fail(f"source contains forbidden marker: {forbidden}")
    require_markers(
        "style",
        style,
        {
            "--casework-canvas: #f6f8fb",
            "--casework-panel: #ffffff",
            "--casework-tint: #eef3f9",
            "--casework-strong: #102033",
            "--casework-text: #425466",
            "--casework-border: #d9e1ea",
            "--casework-accent: #495fea",
            "--casework-teal: #0e8c87",
            "--casework-amber: #b7791f",
            "--casework-red: #b42318",
            "--casework-green: #127a5a",
            "--casework-rhythm: 8px",
            "min-height: 64px",
            "width: min(100%, 1240px)",
            "grid-template-columns: minmax(0, 1fr) 304px",
            "gap: 32px",
            "padding: 16px",
            "min-height: 56px",
            "patient-casework-route-morph 150ms ease",
            "prefers-reduced-motion",
        },
    )


def validate_docs() -> None:
    combined = "\n".join(
        [
            read(ARCH_DOC),
            read(ATLAS),
            read(GRAMMAR),
            read(CONTINUITY),
        ]
    )
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_PRIMITIVES
        | {
            "Quiet_Casework_Premium",
            "/home",
            "/requests",
            "/requests/:requestId",
            "NHS service manual",
            "GOV.UK Check answers",
            "GOV.UK Confirmation pages",
            "WCAG 2.2",
            "Playwright ariaSnapshot",
            "Playwright screenshots",
            "one dominant",
            "governed placeholders",
            "minmax(0, 1fr) 304px",
            "1240px",
            "56px",
            "16px",
            "window.__patientCaseworkAtlasData",
            "window.__patientShellVisualGrammar",
        },
    )


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Quiet_Casework_Premium":
        fail("contract visual mode drifted")
    routes = {route["path"] for route in contract.get("routes", [])}
    if routes != {"/home", "/requests", "/requests/:requestId"}:
        fail(f"contract route set drifted: {sorted(routes)}")
    if set(contract.get("projectionFamiliesConsumed", [])) < REQUIRED_PROJECTIONS:
        fail("contract projection family list incomplete")
    if set(contract.get("uiPrimitives", [])) < REQUIRED_PRIMITIVES:
        fail("contract primitive list incomplete")
    future_surfaces = {surface["surface"] for surface in contract.get("futureChildSurfaces", [])}
    if future_surfaces != {"more_info", "callback", "records", "communications"}:
        fail("future child surface placeholders incomplete")
    layout = contract.get("layoutTokens", {})
    if layout.get("topBandPx") != 64 or layout.get("mobilePaddingPx") != 16:
        fail("layout token drifted")


def validate_matrix() -> None:
    with LAYOUT_MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 9:
        fail("responsive layout matrix needs at least nine rows")
    routes = {row["route"] for row in rows}
    for route in {"/home", "/requests", "/requests/request_211_a", "/home?mode=quiet"}:
        if route not in routes:
            fail(f"layout matrix missing route {route}")
    if not any(row["expected_layout"] == "400_percent_reflow_single_column" for row in rows):
        fail("layout matrix missing 400 percent zoom case")
    if not any(row["reduced_motion_contract"] == "no_animation" for row in rows):
        fail("layout matrix missing reduced motion case")


def validate_cases() -> None:
    cases = json.loads(read(PLACEHOLDER_CASES))
    if cases.get("taskId") != TASK:
        fail("placeholder cases taskId drifted")
    if cases.get("visualMode") != "Quiet_Casework_Premium":
        fail("placeholder cases visual mode drifted")
    case_ids = {case.get("caseId") for case in cases.get("cases", [])}
    for required in {
        "home_to_selected_detail",
        "detail_return_to_requests",
        "browser_back_restore",
        "refresh_replay_restore",
        "more_info_placeholder",
        "callback_placeholder",
        "records_placeholder",
        "communications_placeholder",
    }:
        if required not in case_ids:
            fail(f"placeholder cases missing {required}")
    require_markers(
        "placeholder cases",
        json.dumps(cases),
        {
            "PatientRequestReturnBundle",
            "selectedAnchorTupleHash",
            "continuityEvidenceRef",
            "GovernedPlaceholderCard",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS",
            "PatientCommunicationsTimelineProjection",
        },
    )


def validate_playwright() -> None:
    spec = read(PLAYWRIGHT)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_PRIMITIVES
        | REQUIRED_SCREENSHOTS
        | {
            "ariaSnapshot",
            "ArrowDown",
            "ArrowUp",
            "reducedMotion",
            "document.body.style.zoom",
            "viewport: { width: 390",
            "--run",
            "assertHomeVariants",
            "assertRequestsAndFocus",
            "assertDetail",
            "assertResponsiveAndReducedMotion",
        },
    )
    for screenshot in REQUIRED_SCREENSHOTS:
        if not (OUTPUT / screenshot).exists():
            fail(f"missing Playwright screenshot: output/playwright/{screenshot}")


def validate_package_script() -> None:
    package = json.loads(read(PACKAGE))
    expected = "python3 ./tools/analysis/validate_patient_home_requests_detail_ui.py"
    if package.get("scripts", {}).get("validate:patient-home-requests-detail-ui") != expected:
        fail("root package missing validate:patient-home-requests-detail-ui script")
    updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:patient-home-requests-detail-ui":' not in updates:
        fail("root_script_updates missing validate:patient-home-requests-detail-ui")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_matrix()
    validate_cases()
    validate_playwright()
    validate_package_script()
    print("[patient-home-requests-detail-ui] ok")


if __name__ == "__main__":
    main()
