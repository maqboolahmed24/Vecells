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
MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.tsx"
STYLE = ROOT / "apps" / "patient-web" / "src" / "patient-records-communications.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "217_health_record_and_communications_timeline_views.md"
ATLAS = ROOT / "docs" / "frontend" / "217_health_record_and_communications_atlas.html"
GRAMMAR = ROOT / "docs" / "frontend" / "217_record_and_conversation_visual_grammar.html"
CONTINUITY = ROOT / "docs" / "frontend" / "217_record_and_communication_continuity_map.mmd"
CONTRACT = ROOT / "data" / "contracts" / "217_health_record_and_communications_ui_contract.json"
RECORD_MATRIX = ROOT / "data" / "analysis" / "217_record_chart_table_fallback_matrix.csv"
MESSAGE_CASES = ROOT / "data" / "analysis" / "217_message_visibility_placeholder_cases.json"
PLAYWRIGHT = ROOT / "tests" / "playwright" / "217_health_record_and_communications_timeline_views.spec.js"
OUTPUT = ROOT / "output" / "playwright"

TASK = "par_217_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_health_record_and_communications_timeline_views"

PREREQUISITES = [
    "par_213_crosscutting_track_backend_build_health_record_projection_and_record_artifact_parity_witness",
    "par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules",
    "par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes",
    "par_216_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_more_info_response_callback_status_and_contact_repair_views",
]

RECORD_PROJECTIONS = {
    "PatientRecordSurfaceContext",
    "PatientResultInterpretationProjection",
    "PatientResultInsightProjection",
    "PatientRecordArtifactProjection",
    "RecordArtifactParityWitness",
    "PatientRecordFollowUpEligibilityProjection",
    "PatientRecordContinuityState",
    "VisualizationFallbackContract",
    "VisualizationTableContract",
    "VisualizationParityProjection",
}

COMMUNICATION_PROJECTIONS = {
    "PatientCommunicationsTimelineProjection",
    "PatientConversationCluster",
    "ConversationThreadProjection",
    "ConversationSubthreadProjection",
    "PatientConversationPreviewDigest",
    "PatientCommunicationVisibilityProjection",
    "ConversationCallbackCardProjection",
    "PatientCallbackStatusProjection",
    "PatientReceiptEnvelope",
    "ConversationCommandSettlement",
    "PatientComposerLease",
    "ConversationTimelineAnchor",
}

COMPONENTS = {
    "RecordOverviewSection",
    "ResultInterpretationHero",
    "TrendParitySwitcher",
    "RecordArtifactPanel",
    "RecordVisibilityPlaceholder",
    "ConversationClusterList",
    "ConversationBraid",
    "MessagePreviewCard",
    "ReceiptStateChip",
    "DeliveryDisputeNotice",
}

ROUTES = {
    "/records",
    "/records/results/:resultId",
    "/records/documents/:documentId",
    "/messages",
    "/messages/:clusterId",
    "/messages/:clusterId/thread/:threadId",
    "/messages/:clusterId/callback/:callbackCaseId",
    "/messages/:clusterId/repair",
}

SCREENSHOTS = {
    "217-records-overview.png",
    "217-result-detail.png",
    "217-chart-table-fallback.png",
    "217-table-only-fallback.png",
    "217-delayed-placeholder.png",
    "217-step-up-placeholder.png",
    "217-document-summary.png",
    "217-source-only-document.png",
    "217-restricted-placeholder.png",
    "217-messages-list.png",
    "217-message-cluster.png",
    "217-message-thread.png",
    "217-message-callback-risk.png",
    "217-message-repair.png",
    "217-message-step-up-placeholder.png",
    "217-message-dispute.png",
    "217-mobile-records.png",
    "217-mobile-table-fallback.png",
    "217-mobile-messages.png",
    "217-reduced-motion.png",
    "217-atlas.png",
    "217-atlas-overview.png",
    "217-atlas-result.png",
    "217-atlas-fallback.png",
    "217-atlas-document.png",
    "217-atlas-messages.png",
    "217-atlas-placeholder.png",
    "217-atlas-grammar-board.png",
    "217-visual-grammar.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[records-and-communications-ui] {message}")


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
        fail("task 217 is not claimed or complete in checklist")


def validate_source() -> None:
    app = read(APP)
    model = read(MODEL)
    route = read(ROUTE)
    style = read(STYLE)
    require_markers(
        "App route dispatch",
        app,
        {"PatientRecordsCommunicationsApp", "isRecordsCommunicationsPath", "./patient-records-communications.css"},
    )
    require_markers(
        "model source",
        model,
        RECORD_PROJECTIONS
        | COMMUNICATION_PROJECTIONS
        | {
            "Quiet_Clinical_Correspondence",
            "/records/results",
            "/records/documents",
            "/messages",
            "what_this_test_is",
            "latest_result",
            "what_changed",
            "patient_next_step",
            "urgent_help",
            "technical_details",
            "chart_pixel_output_as_meaning_authority",
            "local_ack_as_authoritative_settlement",
            "makePatientRequestReturnBundle215",
        },
    )
    require_markers(
        "route source",
        route,
        COMPONENTS
        | {
            "Health_Record_Communications_Route",
            "record-overview-section",
            "result-interpretation-hero",
            "trend-parity-switcher",
            "record-artifact-panel",
            "record-visibility-placeholder",
            "conversation-cluster-list",
            "conversation-braid",
            "message-preview-card",
            "receipt-state-chip",
            "delivery-dispute-notice",
            "aria-live",
            "history.pushState",
            "VisualizationParityProjection",
            "Chart view is not available",
        },
    )
    for forbidden in (
        "Date.now()",
        "document.cookie",
        "window.localStorage",
        "local_ack_as_authoritative_settlement = true",
        "chart_pixel_output_as_meaning_authority = true",
    ):
        if forbidden in model + route:
            fail(f"source contains forbidden marker: {forbidden}")
    require_markers(
        "style",
        style,
        {
            "--correspondence-canvas: #f6f8fb",
            "--correspondence-panel: #ffffff",
            "--correspondence-tint: #eef3f9",
            "--correspondence-strong: #102033",
            "--correspondence-text: #425466",
            "--correspondence-border: #d9e1ea",
            "--correspondence-accent: #495fea",
            "--correspondence-teal: #0e8c87",
            "--correspondence-rule: #a8b4c2",
            "--correspondence-chart-tint: #e9eeff",
            "--correspondence-source-tint: #edf6f4",
            "--correspondence-braid-tint: #f1f5f9",
            "min-height: 64px",
            "width: min(100%, 1240px)",
            "grid-template-columns: minmax(0, 780px) 304px",
            "padding: 16px",
            "correspondence-route 160ms ease",
            "prefers-reduced-motion",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(ATLAS), read(GRAMMAR), read(CONTINUITY)])
    require_markers(
        "docs",
        combined,
        RECORD_PROJECTIONS
        | COMMUNICATION_PROJECTIONS
        | COMPONENTS
        | ROUTES
        | {
            "Quiet_Clinical_Correspondence",
            "window.__recordCommunicationAtlasData",
            "window.__recordConversationVisualGrammar",
            "same-shell",
            "NHS service manual",
            "GOV.UK summary list",
            "GOV.UK table",
            "WCAG 2.2",
            "Playwright ARIA snapshots",
            "Playwright screenshots",
            "Chart secondary",
            "Table fallback",
            "Repair child",
        },
    )


def validate_contract() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Quiet_Clinical_Correspondence":
        fail("contract visual mode drifted")
    if set(contract.get("routes", [])) != ROUTES:
        fail("contract route set drifted")
    if set(contract.get("recordProjectionFamiliesConsumed", [])) < RECORD_PROJECTIONS:
        fail("contract record projections incomplete")
    if set(contract.get("communicationProjectionFamiliesConsumed", [])) < COMMUNICATION_PROJECTIONS:
        fail("contract communication projections incomplete")
    if set(contract.get("uiPrimitives", [])) < COMPONENTS:
        fail("contract UI primitives incomplete")
    if contract.get("recordSafetyRules", {}).get("chartSecondaryToTable") is not True:
        fail("record chart safety rule missing")
    if contract.get("communicationSafetyRules", {}).get("governedPlaceholdersNotOmission") is not True:
        fail("communication placeholder safety rule missing")
    for forbidden in (
        "chart_pixel_output_as_meaning_authority",
        "browser_download_event_as_artifact_truth",
        "PatientResultInsightProjection_as_second_interpretation_source",
        "frontend_local_message_body_filter",
        "ConversationCallbackCardProjection_as_second_callback_truth",
        "local_ack_as_authoritative_settlement",
        "transport_acceptance_as_settled_delivery",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden source {forbidden}")


def validate_analysis() -> None:
    with RECORD_MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 12:
        fail("record fallback matrix needs at least twelve rows")
    states = {row["visualization_parity_state"] for row in rows}
    for state in {"visual_and_table", "table_only", "summary_only", "placeholder_only"}:
        if state not in states:
            fail(f"record matrix missing parity state {state}")
    if not any(row["chart_allowed"] == "false" and row["table_required"] == "true" for row in rows):
        fail("record matrix missing chart-demotion table case")
    screenshots = {row["evidence_screenshot"] for row in rows}
    for screenshot in {
        "217-records-overview.png",
        "217-result-detail.png",
        "217-table-only-fallback.png",
        "217-delayed-placeholder.png",
        "217-restricted-placeholder.png",
    }:
        if screenshot not in screenshots:
            fail(f"record matrix missing screenshot {screenshot}")

    cases = json.loads(read(MESSAGE_CASES))
    if cases.get("taskId") != TASK:
        fail("message cases taskId drifted")
    if cases.get("visualMode") != "Quiet_Clinical_Correspondence":
        fail("message cases visual mode drifted")
    case_ids = {case.get("caseId") for case in cases.get("cases", [])}
    for case_id in {
        "message_list_authenticated",
        "cluster_reply_needed",
        "thread_child_same_shell",
        "callback_repair_dominates",
        "contact_repair_child",
        "step_up_placeholder_keeps_row",
        "provider_dispute_visible",
        "mobile_messages",
        "aria_cluster",
    }:
        if case_id not in case_ids:
            fail(f"message cases missing {case_id}")
    require_markers(
        "message cases",
        json.dumps(cases),
        {
            "AccessibleSurfaceContract",
            "KeyboardInteractionContract",
            "FocusTransitionContract",
            "AssistiveAnnouncementContract",
            "FreshnessAccessibilityContract",
            "AccessibilitySemanticCoverageProfile",
        },
    )


def validate_playwright() -> None:
    spec = read(PLAYWRIGHT)
    require_markers(
        "playwright spec",
        spec,
        COMPONENTS
        | SCREENSHOTS
        | {
            "ariaSnapshot",
            "ArrowRight",
            "reducedMotion",
            "viewport: { width: 390",
            "assertRecords",
            "assertResultDetail",
            "assertDocuments",
            "assertMessages",
            "assertResponsive",
            "assertAtlas",
        },
    )
    for screenshot in SCREENSHOTS:
        if not (OUTPUT / screenshot).exists():
            fail(f"missing Playwright screenshot: output/playwright/{screenshot}")


def validate_package_script() -> None:
    package = json.loads(read(PACKAGE))
    expected = "python3 ./tools/analysis/validate_records_and_communications_ui.py"
    if package.get("scripts", {}).get("validate:records-and-communications-ui") != expected:
        fail("root package missing validate:records-and-communications-ui script")
    updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:records-and-communications-ui":' not in updates:
        fail("root_script_updates missing validate:records-and-communications-ui")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract()
    validate_analysis()
    validate_playwright()
    validate_package_script()
    print("[records-and-communications-ui] ok")


if __name__ == "__main__":
    main()
