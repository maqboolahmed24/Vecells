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
    contract_path = ROOT / "data/contracts/163_patient_action_recovery_surface_contract.json"
    matrix_path = ROOT / "data/analysis/163_access_posture_matrix.csv"
    case_path = ROOT / "data/analysis/163_refresh_resume_and_stale_token_cases.csv"
    architecture_doc_path = ROOT / "docs/architecture/163_sign_in_uplift_refresh_and_resume_postures.md"
    gallery_path = ROOT / "docs/frontend/163_access_change_and_recovery_gallery.html"
    mermaid_path = ROOT / "docs/frontend/163_same_shell_rebind_and_return_flow.mmd"
    access_model_path = ROOT / "apps/patient-web/src/patient-intake-access-postures.ts"
    access_component_path = ROOT / "apps/patient-web/src/patient-intake-access-posture-components.tsx"
    mission_frame_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    mission_frame_model_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.model.ts"
    spec_path = ROOT / "tests/playwright/163_sign_in_uplift_refresh_and_resume_postures.spec.js"

    for path in [
        contract_path,
        matrix_path,
        case_path,
        architecture_doc_path,
        gallery_path,
        mermaid_path,
        access_model_path,
        access_component_path,
        mission_frame_path,
        mission_frame_model_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_163", "ACCESS_POSTURE_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_PATIENT_ACTION_RECOVERY_SURFACE_V1",
        "ACCESS_POSTURE_CONTRACT_ID_DRIFT",
    )
    require(
        contract["laws"]["genericRedirectsDisallowed"] is True,
        "ACCESS_POSTURE_GENERIC_REDIRECT_GAP",
    )
    require(
        contract["laws"]["stalePromotedDraftMustMapToAuthoritativeRequest"] is True,
        "ACCESS_POSTURE_STALE_PROMOTION_GAP",
    )

    matrix_rows = load_csv(matrix_path)
    required_postures = {
        "uplift_pending",
        "read_only_return",
        "claim_pending",
        "identity_hold",
        "rebind_required",
        "embedded_drift",
        "stale_draft_mapped_to_request",
    }
    require(
        required_postures <= {row["posture_kind"] for row in matrix_rows},
        "ACCESS_POSTURE_MATRIX_ROW_MISSING",
    )
    require(
        any(
            row["posture_kind"] == "stale_draft_mapped_to_request"
            and row["auto_map_target"] == "/start-request/:draftPublicId/receipt"
            for row in matrix_rows
        ),
        "ACCESS_POSTURE_STALE_AUTOMAP_ROW_MISSING",
    )

    case_rows = load_csv(case_path)
    require(
        {"uplift_return_preserves_anchor", "stale_token_maps_to_receipt", "refresh_preserves_read_only"}
        <= {row["case_id"] for row in case_rows},
        "ACCESS_POSTURE_CASE_ROW_MISSING",
    )

    architecture_doc = architecture_doc_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    mermaid_text = mermaid_path.read_text(encoding="utf-8")
    access_model = access_model_path.read_text(encoding="utf-8")
    access_component = access_component_path.read_text(encoding="utf-8")
    mission_frame = mission_frame_path.read_text(encoding="utf-8")
    mission_frame_model = mission_frame_model_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "same-shell continuity is preserved",
        "AccessGrantScopeEnvelope",
        "PatientNavReturnContract",
        "stale draft token",
        "GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1",
    ]:
        require(marker in architecture_doc, f"ACCESS_POSTURE_DOC_MARKER_MISSING:{marker}")

    for marker in [
        'data-testid="access-transition-diagram"',
        'data-testid="access-posture-matrix-table"',
        'data-testid="stale-draft-mapping-table"',
        'data-testid="access-transition-parity-list"',
    ]:
        require(marker in gallery_html, f"ACCESS_POSTURE_GALLERY_MARKER_MISSING:{marker}")

    require(
        "mutable draft editing is not restored" in gallery_html,
        "ACCESS_POSTURE_GALLERY_STALE_MAPPING_RULE_MISSING",
    )

    for marker in [
        "AccessGrantScopeEnvelope",
        "PatientActionRecoveryEnvelope",
        "rebind_required",
        "embedded_drift_recovery",
        "stale_draft_promoted",
    ]:
        require(marker in access_model, f"ACCESS_POSTURE_MODEL_MARKER_MISSING:{marker}")

    for marker in [
        "AccessPostureStrip",
        "ReadOnlyReturnFrame",
        "ClaimPendingFrame",
        "IdentityHoldBridge",
        "RebindRequiredBridge",
        "StaleDraftMappedToRequestNotice",
        "EmbeddedDriftRecoveryFrame",
    ]:
        require(marker in access_component, f"ACCESS_POSTURE_COMPONENT_MARKER_MISSING:{marker}")

    for marker in [
        'data-access-posture',
        'data-testid="access-posture-strip"',
        "focusAccessPostureSurface",
        "applyAccessAction",
    ]:
        require(marker in mission_frame, f"ACCESS_POSTURE_RUNTIME_MARKER_MISSING:{marker}")

    for marker in [
        "accessSimulation",
        "buildPatientAccessSurface",
        "auth_return_read_only",
        "stale_draft_promoted",
    ]:
        require(marker in mission_frame_model, f"ACCESS_POSTURE_VIEW_MARKER_MISSING:{marker}")

    require("generic login" not in gallery_html.lower(), "ACCESS_POSTURE_GENERIC_LOGIN_COPY_DRIFT")

    for marker in [
        "sign_in_uplift_pending",
        "claim_pending_narrowing",
        "identity_hold",
        "stale_draft_promoted",
        "embedded_drift_recovery",
        "reducedMotion",
        "data-access-posture",
    ]:
        require(marker in spec_source, f"ACCESS_POSTURE_SPEC_MARKER_MISSING:{marker}")

    require("stale draft mapped to receipt" in mermaid_text.lower(), "ACCESS_POSTURE_MERMAID_DRIFT")

    print("validate_sign_in_uplift_refresh_and_resume_postures: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
