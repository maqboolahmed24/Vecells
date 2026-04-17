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
    contract_path = ROOT / "data/contracts/157_frontend_save_truth_contract.json"
    arbitration_matrix_path = ROOT / "data/analysis/157_status_arbitration_matrix.csv"
    recovery_cases_path = ROOT / "data/analysis/157_resume_merge_and_recovery_cases.csv"
    strip_doc_path = ROOT / "docs/architecture/157_quiet_autosave_status_strip.md"
    recovery_doc_path = ROOT / "docs/architecture/157_resume_merge_and_recovery_postures.md"
    gallery_path = ROOT / "docs/frontend/157_autosave_status_strip_gallery.html"
    mermaid_path = ROOT / "docs/frontend/157_autosave_state_machine.mmd"
    app_source_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    hook_source_path = ROOT / "apps/patient-web/src/use-draft-save-truth.ts"
    truth_source_path = ROOT / "apps/patient-web/src/patient-intake-save-truth.ts"
    component_source_path = ROOT / "apps/patient-web/src/patient-intake-status-components.tsx"
    spec_path = ROOT / "tests/playwright/157_quiet_autosave_status_strip_and_resume_states.spec.js"

    for path in [
        contract_path,
        arbitration_matrix_path,
        recovery_cases_path,
        strip_doc_path,
        recovery_doc_path,
        gallery_path,
        mermaid_path,
        app_source_path,
        hook_source_path,
        truth_source_path,
        component_source_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_157", "AUTOSAVE_CONTRACT_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_FRONTEND_SAVE_TRUTH_CONTRACT_V1",
        "AUTOSAVE_CONTRACT_ID_DRIFT",
    )

    contract_states = [entry["state"] for entry in contract["primaryStates"]]
    require(
        contract_states == ["saving", "saved", "review changes", "resume safely"],
        "AUTOSAVE_PRIMARY_STATES_DRIFT",
    )
    require(
        "AmbientStateRibbon" == contract["statusStripOwner"],
        "AUTOSAVE_STATUS_OWNER_DRIFT",
    )

    arbitration_rows = load_csv(arbitration_matrix_path)
    rendered_states = {row["rendered_state"] for row in arbitration_rows}
    require(
        {"neutral", "saving", "saved", "review changes", "resume safely"} <= rendered_states,
        "AUTOSAVE_STATE_MATRIX_MISSING_STATES",
    )
    stable_saved_rows = [
        row for row in arbitration_rows if row["rendered_state"] == "saved"
    ]
    require(len(stable_saved_rows) == 1, "AUTOSAVE_SAVED_STATE_MUST_BE_SINGLE_STABLE_ROW")
    require(
        stable_saved_rows[0]["continuity_state"] == "stable_writable"
        and stable_saved_rows[0]["same_shell_recovery_state"] == "stable",
        "AUTOSAVE_SAVED_STATE_CONTINUITY_DRIFT",
    )

    recovery_rows = load_csv(recovery_cases_path)
    recovery_families = {row["case_family"] for row in recovery_rows}
    require(
        {"resume", "merge", "recovery"} <= recovery_families,
        "AUTOSAVE_RECOVERY_CASE_FAMILIES_MISSING",
    )
    require(
        any(row["case_id"] == "MERGE_REVIEW_CROSS_SESSION" for row in recovery_rows),
        "AUTOSAVE_MERGE_CASE_MISSING",
    )
    require(
        any(row["case_id"] == "PROMOTED_REQUEST_REDIRECT" for row in recovery_rows),
        "AUTOSAVE_PROMOTION_RECOVERY_CASE_MISSING",
    )

    app_source = app_source_path.read_text(encoding="utf-8")
    hook_source = hook_source_path.read_text(encoding="utf-8")
    truth_source = truth_source_path.read_text(encoding="utf-8")
    component_source = component_source_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    mermaid_text = mermaid_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "patient-intake-status-strip",
        "patient-intake-save-label",
        "patient-intake-save-action",
        "patient-intake-continue-card",
        "patient-intake-merge-sheet",
        "patient-intake-recovery-bridge",
    ]:
        require(marker in component_source or marker in app_source, f"MISSING_AUTOSAVE_MARKER:{marker}")

    require("useDraftSaveTruth" in app_source, "AUTOSAVE_HOOK_NOT_WIRED")
    require("AmbientStateRibbon" in app_source, "AUTOSAVE_RIBBON_NOT_WIRED")
    require("ContinueYourRequestCard" in app_source, "AUTOSAVE_CONTINUE_CARD_NOT_WIRED")
    require("MergeReviewSheet" in app_source, "AUTOSAVE_MERGE_SHEET_NOT_WIRED")
    require("RecoveryBridgePanel" in app_source, "AUTOSAVE_RECOVERY_BRIDGE_NOT_WIRED")
    require("shouldWarnOnHardExit" in truth_source, "AUTOSAVE_HARD_EXIT_RULES_NOT_EXPOSED")
    require(
        "projection.latestSettlementRef === settlement.settlementId" in truth_source,
        "AUTOSAVE_SAVED_GUARD_MISSING_SETTLEMENT_PARITY",
    )
    require(
        "projection.sameShellRecoveryState === \"stable\"" in truth_source,
        "AUTOSAVE_SAVED_GUARD_MISSING_CONTINUITY_PARITY",
    )
    require("toast" not in app_source.lower(), "AUTOSAVE_TOAST_REGRESSION_FOUND")

    for marker in [
        'data-testid="autosave-status-strip-gallery"',
        'data-testid="autosave-state-tabs"',
        'data-testid="autosave-state-preview"',
        'data-testid="autosave-arbitration-table"',
        'data-testid="autosave-recovery-cases-table"',
        'data-testid="autosave-diagram-parity-table"',
        "Saved just now",
        "Review changes",
        "Resume safely",
    ]:
        require(marker in gallery_html, f"AUTOSAVE_GALLERY_MARKER_MISSING:{marker}")

    require("saving --> saved" in mermaid_text, "AUTOSAVE_STATE_MACHINE_SAVED_TRANSITION_MISSING")
    require(
        "saved --> review_changes" in mermaid_text and "saved --> resume_safely" in mermaid_text,
        "AUTOSAVE_STATE_MACHINE_RECOVERY_TRANSITIONS_MISSING",
    )

    for marker in [
        "patient-intake-status-strip",
        "patient-intake-save-label",
        "patient-intake-save-action",
        "patient-intake-merge-sheet",
        "patient-intake-continue-card",
        "patient-intake-recovery-bridge",
        "saved_authoritative",
        "merge_required",
        "recovery_required",
        "reducedMotion",
    ]:
        require(marker in spec_source, f"AUTOSAVE_SPEC_MARKER_MISSING:{marker}")

    print("validate_quiet_autosave_frontend: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
