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
    contract_path = ROOT / "data/contracts/161_receipt_surface_contract.json"
    matrix_path = ROOT / "data/analysis/161_receipt_eta_state_matrix.csv"
    copy_table_path = ROOT / "data/analysis/161_receipt_copy_and_promise_state_table.csv"
    architecture_doc_path = ROOT / "docs/architecture/161_same_shell_receipt_and_eta_surface.md"
    gallery_path = ROOT / "docs/frontend/161_receipt_and_eta_gallery.html"
    mermaid_path = ROOT / "docs/frontend/161_receipt_morph_and_timeline.mmd"
    model_source_path = ROOT / "apps/patient-web/src/patient-intake-receipt-surface.ts"
    component_source_path = ROOT / "apps/patient-web/src/patient-intake-receipt-components.tsx"
    mission_frame_source_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    spec_path = ROOT / "tests/playwright/161_same_shell_receipt_and_eta_surface.spec.js"

    for path in [
        contract_path,
        matrix_path,
        copy_table_path,
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
    require(contract["taskId"] == "par_161", "RECEIPT_SURFACE_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1",
        "RECEIPT_SURFACE_CONTRACT_ID_DRIFT",
    )
    require(
        contract["allowedPromiseStates"]
        == ["on_track", "improved", "at_risk", "revised_downward", "recovery_required"],
        "RECEIPT_SURFACE_PROMISE_STATE_DRIFT",
    )
    require(
        contract["truthLaw"]["queuedOrAcceptedIsNotDelivered"] is True,
        "RECEIPT_SURFACE_COMMUNICATION_TRUTH_DRIFT",
    )
    require(
        contract["factsBandLaw"]["exactTimestampVisible"] is False,
        "RECEIPT_SURFACE_EXACT_TIMESTAMP_DRIFT",
    )

    matrix_rows = load_csv(matrix_path)
    require(
        {"received", "in_review", "we_need_you", "completed", "urgent_action"}
        <= {row["macro_state"] for row in matrix_rows},
        "RECEIPT_SURFACE_MATRIX_MACRO_STATE_MISSING",
    )
    require(
        any(
            row["macro_state"] == "received"
            and row["receipt_bucket"] == "within_2_working_days"
            and row["promise_state"] == "on_track"
            for row in matrix_rows
        ),
        "RECEIPT_SURFACE_RECEIVED_BASELINE_ROW_MISSING",
    )
    require(
        any(
            row["macro_state"] == "urgent_action"
            and row["promise_state"] == "recovery_required"
            for row in matrix_rows
        ),
        "RECEIPT_SURFACE_RECOVERY_REQUIRED_ROW_MISSING",
    )

    copy_rows = load_csv(copy_table_path)
    require(
        all(row["exact_timestamp_visible"] == "false" for row in copy_rows),
        "RECEIPT_SURFACE_EXACT_TIMESTAMP_VISIBLE",
    )
    require(
        all(row["queued_claims_delivery"] == "false" for row in copy_rows),
        "RECEIPT_SURFACE_QUEUED_EQUALS_DELIVERED",
    )

    model_source = model_source_path.read_text(encoding="utf-8")
    component_source = component_source_path.read_text(encoding="utf-8")
    mission_frame_source = mission_frame_source_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "PHASE1_SAME_SHELL_RECEIPT_SURFACE_V1",
        "within_2_working_days",
        "recovery_required",
        "queued is not the same as delivered",
        "/intake/requests/${input.requestPublicId}/status",
    ]:
        require(
            marker in model_source,
            f"RECEIPT_SURFACE_MODEL_MARKER_MISSING:{marker}",
        )

    for marker in [
        "receipt-outcome-canvas",
        "receipt-reference-fact",
        "receipt-eta-fact",
        "receipt-timeline",
        "receipt-contact-summary",
        "receipt-promise-note",
        "receipt-track-request-anchor-card",
    ]:
        require(
            marker in component_source or marker in mission_frame_source,
            f"RECEIPT_SURFACE_UI_MARKER_MISSING:{marker}",
        )

    for forbidden in [
        "Receipt placeholder",
        "detached success page",
        "3:42pm",
    ]:
        require(
            forbidden not in mission_frame_source,
            f"RECEIPT_SURFACE_PLACEHOLDER_OR_PRECISION_DRIFT:{forbidden}",
        )

    for marker in [
        'data-testid="receipt-gallery"',
        'data-testid="receipt-morph-diagram"',
        'data-testid="receipt-morph-table"',
        'data-testid="receipt-promise-state-table"',
        'data-testid="receipt-state-matrix-table"',
    ]:
        require(marker in gallery_html, f"RECEIPT_SURFACE_GALLERY_MARKER_MISSING:{marker}")

    require(
        "no exact timestamp promises" in gallery_html.lower(),
        "RECEIPT_SURFACE_GALLERY_TIMESTAMP_RULE_MISSING",
    )
    require(
        "queued is not the same as delivered" in gallery_html.lower(),
        "RECEIPT_SURFACE_GALLERY_COMMUNICATION_BOUNDARY_MISSING",
    )

    for marker in [
        "receipt-outcome-canvas",
        "receipt-reference-fact",
        "receipt-eta-fact",
        "receipt-promise-note",
        "receipt-track-request-anchor-card",
        "receipt-patch-action",
        "receipt-current-state-panel",
        "recovery_required",
        "reducedMotion",
    ]:
        require(marker in spec_source, f"RECEIPT_SURFACE_SPEC_MARKER_MISSING:{marker}")

    print("validate_same_shell_receipt_and_eta_surface: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
