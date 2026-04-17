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
    contract_path = ROOT / "data/contracts/158_attachment_frontend_state_contract.json"
    matrix_path = ROOT / "data/analysis/158_attachment_ui_state_matrix.csv"
    recovery_path = ROOT / "data/analysis/158_retry_replace_and_recovery_cases.csv"
    architecture_doc_path = ROOT / "docs/architecture/158_file_upload_evidence_states_and_recovery.md"
    gallery_path = ROOT / "docs/frontend/158_attachment_lane_gallery.html"
    mermaid_path = ROOT / "docs/frontend/158_attachment_state_machine.mmd"
    component_path = ROOT / "apps/patient-web/src/patient-intake-attachment-components.tsx"
    helper_path = ROOT / "apps/patient-web/src/patient-intake-attachment-lane.ts"
    hook_path = ROOT / "apps/patient-web/src/use-patient-intake-attachments.ts"
    mission_frame_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    spec_path = ROOT / "tests/playwright/158_file_upload_evidence_states_and_error_recovery.spec.js"

    for path in [
        contract_path,
        matrix_path,
        recovery_path,
        architecture_doc_path,
        gallery_path,
        mermaid_path,
        component_path,
        helper_path,
        hook_path,
        mission_frame_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_158", "ATTACHMENT_FRONTEND_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_ATTACHMENT_FRONTEND_STATE_CONTRACT_V1",
        "ATTACHMENT_FRONTEND_CONTRACT_ID_DRIFT",
    )
    require(
        contract["artifactPresentationContractRef"] == "APC_141_INTAKE_ATTACHMENT_V1",
        "ATTACHMENT_PRESENTATION_CONTRACT_DRIFT",
    )
    states = [entry["state"] for entry in contract["userFacingStates"]]
    require(
        states
        == [
            "selecting",
            "uploading to quarantine",
            "scanning",
            "ready / kept",
            "preview unavailable but kept",
            "retryable transfer failure",
            "quarantined unsupported type",
            "quarantined unreadable / integrity failure",
            "quarantined malware",
            "removed",
            "replaced",
        ],
        "ATTACHMENT_FRONTEND_STATE_LIST_DRIFT",
    )

    matrix_rows = load_csv(matrix_path)
    matrix_states = {row["ui_state"] for row in matrix_rows}
    require(set(states) <= matrix_states, "ATTACHMENT_MATRIX_MISSING_STATES")
    require(
        any(row["ui_state"] == "retryable transfer failure" and row["quarantine_state"] == "not_started" for row in matrix_rows),
        "ATTACHMENT_MATRIX_RETRYABLE_NOT_DISTINCT",
    )
    require(
        any(row["ui_state"] == "quarantined malware" and row["quarantine_state"] == "quarantined" for row in matrix_rows),
        "ATTACHMENT_MATRIX_QUARANTINE_STATE_MISSING",
    )

    recovery_rows = load_csv(recovery_path)
    recovery_ids = {row["case_id"] for row in recovery_rows}
    require(
        {
            "FILE_PICKER_ACCEPTED_IMAGE",
            "DRAG_DROP_RETRYABLE_TRANSFER_FAILURE",
            "MOBILE_CAMERA_CAPTURE_PREVIEW_DEFERRED",
            "DUPLICATE_UPLOAD_REUSES_EXISTING_CARD",
            "UNSUPPORTED_TYPE_STAYS_VISIBLE",
            "UNREADABLE_FILE_REPLACE_FLOW",
            "MALWARE_FILE_REMOVE_FLOW",
            "PREVIEW_ACTION_USES_GOVERNED_GRANT",
        }
        <= recovery_ids,
        "ATTACHMENT_RECOVERY_CASES_MISSING",
    )

    component_source = component_path.read_text(encoding="utf-8")
    helper_source = helper_path.read_text(encoding="utf-8")
    hook_source = hook_path.read_text(encoding="utf-8")
    mission_frame_source = mission_frame_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    mermaid_text = mermaid_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "patient-intake-evidence-dropzone",
        "patient-intake-file-picker-button",
        "patient-intake-camera-capture-button",
        "patient-intake-preview-panel",
        "patient-intake-preview-action-",
        "patient-intake-retry-action-",
        "patient-intake-replace-action-",
        "patient-intake-remove-action-",
    ]:
        require(
            marker in component_source or marker in mission_frame_source,
            f"ATTACHMENT_UI_MARKER_MISSING:{marker}",
        )

    require("usePatientIntakeAttachments" in mission_frame_source, "ATTACHMENT_HOOK_NOT_WIRED")
    require("buildAttachmentProcessingPlan" in helper_source, "ATTACHMENT_PLAN_HELPER_MISSING")
    require("duplicateNotice" in hook_source, "ATTACHMENT_DUPLICATE_NOTICE_MISSING")

    for forbidden in ["amazonaws.com", "storage.googleapis.com", "blob:", "s3://"]:
        require(forbidden not in gallery_html, f"ATTACHMENT_GALLERY_RAW_URL_LEAK:{forbidden}")
        require(forbidden not in component_source, f"ATTACHMENT_COMPONENT_RAW_URL_LEAK:{forbidden}")

    for marker in [
        'data-testid="attachment-lane-gallery"',
        'data-testid="attachment-state-tabs"',
        'data-testid="attachment-gallery-cards"',
        'data-testid="attachment-artifact-mode-table"',
        'data-testid="attachment-scan-ladder"',
        'data-testid="attachment-scan-ladder-parity"',
        'data-testid="attachment-state-parity-table"',
        "Ready / kept",
        "Retryable transfer failure",
        "Quarantined malware",
    ]:
        require(marker in gallery_html, f"ATTACHMENT_GALLERY_MARKER_MISSING:{marker}")

    for transition in [
        "selecting --> uploading_to_quarantine",
        "uploading_to_quarantine --> scanning",
        "uploading_to_quarantine --> retryable_transfer_failure",
        "scanning --> ready_kept",
        "scanning --> quarantined_malware",
    ]:
        require(transition in mermaid_text, f"ATTACHMENT_STATE_MACHINE_TRANSITION_MISSING:{transition}")

    for marker in [
        "patient-intake-evidence-dropzone",
        "patient-intake-file-picker-button",
        "patient-intake-camera-capture-button",
        "patient-intake-preview-panel",
        "patient-intake-preview-action-",
        "patient-intake-retry-action-",
        "patient-intake-replace-action-",
        "patient-intake-remove-action-",
        "drag_drop",
        "reducedMotion",
    ]:
        require(marker in spec_source, f"ATTACHMENT_SPEC_MARKER_MISSING:{marker}")

    print("validate_attachment_ui_states: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
