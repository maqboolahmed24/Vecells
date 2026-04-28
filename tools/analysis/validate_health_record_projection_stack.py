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
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "health-record-projection-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "213_health_record_projection_and_parity_design.md"
SECURITY_DOC = (
    ROOT
    / "docs"
    / "security"
    / "213_health_record_visibility_release_and_parity_controls.md"
)
HTML_ATLAS = ROOT / "docs" / "frontend" / "213_health_record_parity_state_atlas.html"
MERMAID = ROOT / "docs" / "frontend" / "213_record_artifact_and_visualization_parity.mmd"
CONTRACT = ROOT / "data" / "contracts" / "213_health_record_projection_contract.json"
ALIAS = ROOT / "data" / "analysis" / "213_result_interpretation_alias_resolution.json"
MATRIX = ROOT / "data" / "analysis" / "213_record_parity_and_release_matrix.csv"
CASES = ROOT / "data" / "analysis" / "213_visualization_fallback_cases.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "213_health_record_parity_atlas.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_213_crosscutting_track_backend_build_health_record_projection_and_record_artifact_parity_witness"

REQUIRED_PROJECTIONS = {
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

REQUIRED_ROUTES = {
    "patient_portal_records_index",
    "patient_portal_record_result_detail",
    "patient_portal_record_document_detail",
    "/v1/me/records",
    "/v1/me/records/results/{resultId}",
    "/v1/me/records/documents/{documentId}",
}

REQUIRED_REGIONS = {
    "Record_Parity_Atlas",
    "OverviewBoard",
    "ResultDetailAnatomy",
    "DocumentArtifactBoard",
    "ArtifactParityStateBoard",
    "ChartTableParityBoard",
    "GatedPlaceholderBoard",
    "SourceAuthorityBoard",
    "FollowUpContinuityBoard",
}

REQUIRED_SCREENSHOTS = {
    "213-overview.png",
    "213-result-detail.png",
    "213-document-detail.png",
    "213-parity-verified.png",
    "213-degraded-table.png",
    "213-delayed-placeholder.png",
    "213-step-up-placeholder.png",
    "213-restricted-placeholder.png",
    "213-reduced-motion.png",
    "213-mobile-degraded-table.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[health-record-projection-stack] {message}")


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
    if "- [X] par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections" not in checklist:
        fail("task 212 prerequisite is not complete")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 213 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | {
            "HealthRecordProjectionAssembler",
            "RecordArtifactParityEngine",
            "assembleHealthRecordProjection",
            "buildRecordArtifactParityWitness",
            "adaptPatientResultInsightProjection",
            "sourceAuthorityState",
            "summary_verified",
            "delayed_release",
            "step_up_required",
            "recordOriginContinuationRef",
            "recoveryContinuationTokenRef",
        },
    )
    for forbidden in (
        "chart_pixel_output_as_meaning_authority = true",
        "PatientResultInsightProjection_as_second_interpretation_source = true",
        "window.localStorage",
        "document.cookie",
    ):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers("service definition", service_definition, REQUIRED_ROUTES | REQUIRED_PROJECTIONS)


def validate_docs() -> None:
    combined = read(ARCH_DOC) + "\n" + read(SECURITY_DOC) + "\n" + read(MERMAID)
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_ROUTES
        | {
            "HealthRecordProjectionAssembler",
            "RecordArtifactParityEngine",
            "GOV.UK",
            "NHS service manual",
            "Playwright",
            "WCAG",
            "summary_verified",
            "same-shell",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Record_Parity_Atlas":
        fail("contract visual mode drifted")
    require_markers("contract", json.dumps(contract), REQUIRED_PROJECTIONS | REQUIRED_ROUTES)
    for forbidden in (
        "chart_pixel_output_as_meaning_authority",
        "browser_download_event_as_artifact_truth",
        "PatientResultInsightProjection_as_second_interpretation_source",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden source {forbidden}")

    alias = json.loads(read(ALIAS))
    if alias.get("taskId") != TASK:
        fail("alias taskId drifted")
    require_markers(
        "alias",
        json.dumps(alias),
        {
            "PatientResultInterpretationProjection",
            "PatientResultInsightProjection",
            "adaptPatientResultInsightProjection",
            "alias_only",
            "PatientResultInsightProjection_as_second_interpretation_source",
        },
    )

    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 10:
        fail("matrix needs at least ten rows")
    for column in {
        "release_state",
        "record_gate_state",
        "source_authority_state",
        "visualization_parity_state",
        "follow_up_eligibility",
        "placeholder_visible",
        "atlas_region",
    }:
        if column not in rows[0]:
            fail(f"matrix missing column {column}")
    release_states = {row["release_state"] for row in rows}
    for state in {"visible", "delayed_release", "step_up_required", "restricted"}:
        if state not in release_states:
            fail(f"matrix missing release state {state}")
    authorities = {row["source_authority_state"] for row in rows}
    for authority in {"summary_verified", "summary_provisional", "source_only", "placeholder_only"}:
        if authority not in authorities:
            fail(f"matrix missing authority {authority}")
    regions = {row["atlas_region"] for row in rows}
    if not (REQUIRED_REGIONS - {"Record_Parity_Atlas", "OverviewBoard"}) <= regions:
        fail("matrix missing atlas regions")

    cases = json.loads(read(CASES))
    if cases.get("visualMode") != "Record_Parity_Atlas":
        fail("cases visual mode drifted")
    require_markers(
        "cases",
        json.dumps(cases),
        REQUIRED_PROJECTIONS
        | {
            "chart_and_table_aligned",
            "stale_summary_demotes_chart",
            "delayed_release_placeholder",
            "step_up_placeholder",
            "restricted_record_no_body_preview",
            "source_only_document",
        },
    )


def validate_atlas_and_tests() -> None:
    html = read(HTML_ATLAS)
    require_markers(
        "atlas",
        html,
        REQUIRED_REGIONS
        | REQUIRED_PROJECTIONS
        | {
            "window.__recordParityAtlasData",
            "prefers-reduced-motion",
            "data-scenario-button",
            "what_this_test_is",
            "latest_result",
            "what_changed",
            "patient_next_step",
            "urgent_help",
            "technical_details",
        },
    )

    backend = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        backend,
        REQUIRED_PROJECTIONS
        | {
            "HealthRecordProjectionAssembler",
            "RecordArtifactParityEngine",
            "adaptPatientResultInsightProjection",
            "delayed_release",
            "step_up_required",
            "table_only",
            "messaging",
            "callback",
            "booking",
            "request_detail_repair",
            "artifact_recovery",
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
            "assertAccessibilityHeadingsLabelsTablesDescriptionLists",
            "assertDataParity",
            "assertKeyboardTabsDisclosuresToggles",
        },
    )

    for screenshot in REQUIRED_SCREENSHOTS:
        if not (OUTPUT_DIR / screenshot).exists():
            fail(f"missing Playwright screenshot {screenshot}")


def validate_package_script() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    script = package.get("scripts", {}).get("validate:health-record-projection-stack")
    if script != "python3 ./tools/analysis/validate_health_record_projection_stack.py":
        fail("root package missing validate:health-record-projection-stack script")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_docs()
    validate_contract_and_analysis()
    validate_atlas_and_tests()
    validate_package_script()
    print("[health-record-projection-stack] ok")


if __name__ == "__main__":
    main()
