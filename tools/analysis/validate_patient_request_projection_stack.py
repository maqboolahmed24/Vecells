#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "authenticated-portal-projections.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "patient-request-projection-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "211_request_lineage_and_action_routing_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "211_patient_action_routing_and_settlement_controls.md"
HTML_ATLAS = ROOT / "docs" / "frontend" / "211_request_lineage_action_atlas.html"
MATRIX = ROOT / "data" / "analysis" / "211_request_lineage_ordering_and_action_matrix.csv"
CASES = ROOT / "data" / "analysis" / "211_request_route_settlement_and_recovery_cases.json"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "211_request_lineage_action_atlas.spec.js"

TASK = "par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections"

REQUIRED_PROJECTIONS = {
    "PatientRequestsIndexProjection",
    "PatientRequestLineageProjection",
    "PatientRequestSummaryProjection",
    "PatientRequestDetailProjection",
    "PatientRequestDownstreamProjection",
    "PatientRequestReturnBundle",
    "PatientNextActionProjection",
    "PatientActionRoutingProjection",
    "PatientActionSettlementProjection",
    "PatientSafetyInterruptionProjection",
}

REQUIRED_REGIONS = {
    "Request_Lineage_Action_Atlas",
    "LineageOrderBraid",
    "ActionRoutingEnvelopeMap",
    "SettlementLadder",
    "MockListDetailFrame",
    "SafetyInterruptionStrip",
    "MatrixShelf",
}

REQUIRED_COLORS = {
    "#F8FAFC",
    "#FFFFFF",
    "#EEF2F7",
    "#0F172A",
    "#334155",
    "#64748B",
    "#D7DFEA",
    "#3158E0",
    "#5B61F6",
    "#0F766E",
    "#B7791F",
    "#B42318",
}

REQUIRED_SCREENSHOTS = {
    "211-request-list-default.png",
    "211-request-detail-actionable.png",
    "211-request-detail-read-only.png",
    "211-settlement-pending.png",
    "211-safety-interruption.png",
    "211-identity-hold-recovery.png",
    "211-request-lineage-zoom.png",
    "211-request-lineage-reduced-motion.png",
    "211-request-lineage-mobile.png",
}

REQUIRED_SETTLEMENT_STATES = {
    "local_acknowledged",
    "pending_authoritative_confirmation",
    "external_observation_received",
    "authoritative_outcome_settled",
    "disputed_recovery_required",
}


def fail(message: str) -> None:
    raise SystemExit(f"[patient-request-projection-stack] {message}")


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
    if "- [X] par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic" not in checklist:
        fail("task 210 prerequisite is not complete")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 211 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | REQUIRED_SETTLEMENT_STATES
        | {
            "buildRequestReturnBundle",
            "buildDownstreamProjections",
            "buildNextActionProjection",
            "buildActionRoutingProjection",
            "buildActionSettlementProjection",
            "buildSafetyInterruptionProjection",
            "selectedRequestReturnBundleRef",
            "lineageTupleHash",
            "dominantActionRef",
            "blockedReasonRef",
            "writableEligibilityFenceRef",
            "capabilityLeaseRef",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT",
        },
    )
    for forbidden in ("controllerLocalTrim", "broadFetchThenTrim", "document.cookie", "localStorage"):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "patient_portal_requests_index",
            "patient_portal_request_detail",
            "patient_portal_request_action_route",
            "/v1/me/requests",
            "/v1/me/requests/{requestRef}",
            "/v1/me/requests/{requestRef}/actions/{actionType}/route",
            "PatientRequestsIndexProjectionContract",
            "PatientRequestDetailProjectionContract",
            "PatientActionRoutingProjectionContract",
            "PatientActionSettlementProjection",
        },
    )


def validate_docs() -> None:
    combined = read(ARCH_DOC) + "\n" + read(SECURITY_DOC)
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | {
            "GET /v1/me/requests",
            "GET /v1/me/requests/{requestRef}",
            "POST /v1/me/requests/{requestRef}/actions/{actionType}/route",
            "one dominant",
            "same-shell",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json",
            "GOV.UK Task List",
            "NHS card guidance",
            "Atlassian Jira issue view",
            "GitHub Primer ActionList",
            "1580px",
            "4 / 12",
            "5 / 12",
            "3 / 12",
        },
    )


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 9:
        fail("lineage/action matrix needs at least nine rows")
    postures = {row["detail_header_posture"] for row in rows}
    for posture in {"ready", "read_only", "pending_confirmation", "blocked", "identity_hold", "recovery_required"}:
        if posture not in postures:
            fail(f"matrix missing posture: {posture}")
    settlements = {row["settlement_state"] for row in rows}
    if not REQUIRED_SETTLEMENT_STATES <= settlements:
        fail(f"matrix missing settlement states: {sorted(REQUIRED_SETTLEMENT_STATES - settlements)}")
    regions = {row["atlas_region"] for row in rows}
    missing_regions = (REQUIRED_REGIONS - {"Request_Lineage_Action_Atlas"}) - regions
    if missing_regions:
        fail(f"matrix missing atlas regions: {sorted(missing_regions)}")


def validate_cases_and_gap() -> None:
    cases = json.loads(read(CASES))
    if cases.get("taskId") != TASK:
        fail("cases taskId drifted")
    if cases.get("visualMode") != "Request_Lineage_Action_Atlas":
        fail("cases visual mode drifted")
    if set(cases.get("settlementStates", [])) != REQUIRED_SETTLEMENT_STATES:
        fail("cases settlement state set drifted")
    require_markers(
        "cases",
        json.dumps(cases),
        REQUIRED_PROJECTIONS
        | {
            "PatientActionRoutingProjectionContract",
            "selected_anchor_preserved",
            "typed_route_live",
            "pending_settlement",
            "safety_interruption_blocks",
            "identity_hold_degrades",
            "missing_sibling_placeholder",
        },
    )
    gap = json.loads(read(GAP))
    for field in (
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ):
        if not gap.get(field):
            fail(f"gap artifact missing field: {field}")
    if "par_212" not in gap["expectedOwnerTask"]:
        fail("request-context gap must point to task 212")


def validate_atlas() -> None:
    html = read(HTML_ATLAS)
    require_markers(
        "atlas",
        html,
        REQUIRED_REGIONS
        | REQUIRED_COLORS
        | {
            "max-width: 1580px",
            "padding: 28px",
            "grid-template-columns: 4fr 5fr 3fr",
            "--shell-band: 64px",
            "--left-nav: 240px",
            "--page-max: 1440px",
            "--row-min: 88px",
            "--row-max: 116px",
            "list-default",
            "detail-actionable",
            "detail-read-only",
            "settlement-pending",
            "safety-interruption",
            "identity-hold",
            "window.__requestLineageActionAtlasData",
            "prefers-reduced-motion",
        },
    )


def validate_tests() -> None:
    backend = read(BACKEND_TEST)
    require_markers(
        "backend test",
        backend,
        REQUIRED_PROJECTIONS
        | {
            "lineageTupleHash",
            "selectedRequestReturnBundleRef",
            "sibling_projection_missing",
            "PatientActionRoutingProjection",
            "pending_authoritative_confirmation",
            "urgent_required",
            "identity_hold",
        },
    )
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_REGIONS
        | REQUIRED_SCREENSHOTS
        | {
            "ariaSnapshot",
            "ArrowRight",
            "reducedMotion",
            "setViewportSize({ width: 390",
            "document.body.style.zoom",
            "assertTableParity",
        },
    )


def validate_package_script() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    script = package.get("scripts", {}).get("validate:patient-request-projection-stack")
    if script != "python3 ./tools/analysis/validate_patient_request_projection_stack.py":
        fail("root package missing validate:patient-request-projection-stack script")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_docs()
    validate_matrix()
    validate_cases_and_gap()
    validate_atlas()
    validate_tests()
    validate_package_script()
    print("[patient-request-projection-stack] ok")


if __name__ == "__main__":
    main()
