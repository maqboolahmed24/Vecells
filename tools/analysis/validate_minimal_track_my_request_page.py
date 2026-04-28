#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path("/Users/test/Code/V")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    contract_path = ROOT / "data/contracts/162_track_request_surface_contract.json"
    matrix_path = ROOT / "data/analysis/162_status_macrostate_matrix.csv"
    recovery_path = ROOT / "data/analysis/162_tracking_access_and_recovery_cases.csv"
    architecture_doc_path = ROOT / "docs/architecture/162_minimal_track_my_request_page.md"
    gallery_path = ROOT / "docs/frontend/162_track_request_gallery.html"
    mermaid_path = ROOT / "docs/frontend/162_status_timeline_and_return_contract.mmd"
    model_source_path = ROOT / "apps/patient-web/src/patient-intake-request-status-surface.ts"
    component_source_path = ROOT / "apps/patient-web/src/patient-intake-request-status-components.tsx"
    mission_frame_source_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    spec_path = ROOT / "tests/playwright/162_minimal_track_my_request_page.spec.js"

    for path in [
        contract_path,
        matrix_path,
        recovery_path,
        architecture_doc_path,
        gallery_path,
        mermaid_path,
        model_source_path,
        component_source_path,
        mission_frame_source_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_162", "TRACK_REQUEST_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1",
        "TRACK_REQUEST_CONTRACT_ID_DRIFT",
    )
    require(
        contract["allowedMacroStates"]
        == ["received", "in_review", "we_need_you", "completed", "urgent_action"],
        "TRACK_REQUEST_ALLOWED_MACRO_STATES_DRIFT",
    )
    require(
        contract["surfacePostures"] == ["summary_read_only", "recovery_only"],
        "TRACK_REQUEST_SURFACE_POSTURE_DRIFT",
    )
    require(
        contract["visibleTruthLaw"]["exactTimestampVisible"] is False,
        "TRACK_REQUEST_EXACT_TIMESTAMP_DRIFT",
    )
    require(
        contract["visibleTruthLaw"]["rawQueueTelemetryVisible"] is False,
        "TRACK_REQUEST_QUEUE_TELEMETRY_DRIFT",
    )
    require(
        contract["visibleTruthLaw"]["dominantStatusCueMax"] == 1,
        "TRACK_REQUEST_DOMINANT_CUE_DRIFT",
    )
    require(
        contract["layoutLaw"]["dashboardCardsForbidden"] is True
        and contract["layoutLaw"]["chartsForbidden"] is True,
        "TRACK_REQUEST_DASHBOARD_GUARDRAIL_DRIFT",
    )

    matrix_rows = load_csv(matrix_path)
    require(
        {"received", "in_review", "we_need_you", "completed", "urgent_action"}
        <= {row["macro_state"] for row in matrix_rows},
        "TRACK_REQUEST_MATRIX_MACRO_STATE_MISSING",
    )
    require(
        all(row["raw_queue_telemetry_visible"] == "false" for row in matrix_rows),
        "TRACK_REQUEST_MATRIX_QUEUE_TELEMETRY_VISIBLE",
    )
    require(
        all(int(row["dominant_status_cue_count"]) <= 1 for row in matrix_rows),
        "TRACK_REQUEST_MATRIX_DOMINANT_CUE_OVERFLOW",
    )
    require(
        any(
            row["macro_state"] == "urgent_action"
            and row["surface_posture"] == "recovery_only"
            and row["eta_visible"] == "false"
            for row in matrix_rows
        ),
        "TRACK_REQUEST_MATRIX_RECOVERY_ROW_MISSING",
    )

    recovery_rows = load_csv(recovery_path)
    require(
        any(row["surface_posture"] == "summary_read_only" for row in recovery_rows),
        "TRACK_REQUEST_RECOVERY_SUMMARY_POSTURE_MISSING",
    )
    require(
        any(row["surface_posture"] == "recovery_only" for row in recovery_rows),
        "TRACK_REQUEST_RECOVERY_ONLY_POSTURE_MISSING",
    )
    require(
        any(
            row["dominant_navigation_ref"] == "PNRC_162_RETURN_TO_RECEIPT_V1"
            for row in recovery_rows
        ),
        "TRACK_REQUEST_RETURN_CONTRACT_ROW_MISSING",
    )
    require(
        any(
            row["dominant_navigation_ref"] == "PNRC_162_STATUS_TO_URGENT_GUIDANCE_V1"
            for row in recovery_rows
        ),
        "TRACK_REQUEST_URGENT_GUIDANCE_ROW_MISSING",
    )

    architecture_doc = architecture_doc_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    model_source = model_source_path.read_text(encoding="utf-8")
    component_source = component_source_path.read_text(encoding="utf-8")
    mission_frame_source = mission_frame_source_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "RequestPulseHeader",
        "CurrentStatePanel",
        "NextStepsTimeline",
        "ActionNeededCard",
        "same shell",
        "not a dashboard",
        "GAP_RESOLVED_TRACK_REQUEST_SUMMARY_MINIMALISM_V1",
    ]:
        require(marker in architecture_doc, f"TRACK_REQUEST_DOC_MARKER_MISSING:{marker}")

    for marker in [
        "PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1",
        "summary_read_only",
        "recovery_only",
        "/intake/requests/${requestPublicId}/receipt",
        "Open urgent guidance",
        "This is a patient-safe bucket, not an exact time.",
    ]:
        require(marker in model_source, f"TRACK_REQUEST_MODEL_MARKER_MISSING:{marker}")

    for marker in [
        "track-request-pulse-header",
        "track-current-state-panel",
        "track-next-steps-timeline",
        "track-eta-promise-note",
        "track-action-needed-card",
        "track-return-link",
    ]:
        require(
            marker in component_source or marker in mission_frame_source,
            f"TRACK_REQUEST_UI_MARKER_MISSING:{marker}",
        )

    for forbidden in [
        "Status placeholder",
        "queue position",
        "staffing telemetry",
    ]:
        require(
            forbidden not in mission_frame_source,
            f"TRACK_REQUEST_RUNTIME_FORBIDDEN_COPY:{forbidden}",
        )

    for marker in [
        'data-testid="track-request-gallery"',
        'data-testid="status-macrostate-table"',
        'data-testid="status-timeline-diagram"',
        'data-testid="status-timeline-parity-table"',
        'data-testid="status-access-recovery-matrix"',
    ]:
        require(marker in gallery_html, f"TRACK_REQUEST_GALLERY_MARKER_MISSING:{marker}")

    require(
        "no queue position" in gallery_html.lower(),
        "TRACK_REQUEST_GALLERY_QUEUE_GUARDRAIL_MISSING",
    )
    require(
        "not an exact time" in gallery_html.lower(),
        "TRACK_REQUEST_GALLERY_TIMESTAMP_GUARDRAIL_MISSING",
    )

    for marker in [
        "track-request-pulse-header",
        "track-current-state-panel",
        "track-next-steps-timeline",
        "track-eta-promise-note",
        "track-action-needed-card",
        "track-return-link",
        "reducedMotion",
        "receipt-track-request-action",
    ]:
        require(marker in spec_source, f"TRACK_REQUEST_SPEC_MARKER_MISSING:{marker}")

    print("validate_minimal_track_my_request_page: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
