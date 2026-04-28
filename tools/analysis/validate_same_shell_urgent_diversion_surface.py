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
    contract_path = ROOT / "data/contracts/160_urgent_surface_contract.json"
    matrix_path = ROOT / "data/analysis/160_urgent_outcome_matrix.csv"
    focus_path = ROOT / "data/analysis/160_focus_and_recovery_cases.csv"
    architecture_doc_path = ROOT / "docs/architecture/160_same_shell_urgent_diversion_surface.md"
    content_doc_path = ROOT / "docs/content/160_urgent_guidance_rendering_contract.md"
    gallery_path = ROOT / "docs/frontend/160_urgent_diversion_gallery.html"
    mermaid_path = ROOT / "docs/frontend/160_urgent_state_and_handoff.mmd"
    runtime_source_path = ROOT / "apps/patient-web/src/patient-intake-urgent-outcome.ts"
    component_source_path = (
        ROOT / "apps/patient-web/src/patient-intake-urgent-outcome-components.tsx"
    )
    mission_frame_source_path = ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx"
    spec_path = ROOT / "tests/playwright/160_same_shell_urgent_diversion_surface.spec.js"

    for path in [
        contract_path,
        matrix_path,
        focus_path,
        architecture_doc_path,
        content_doc_path,
        gallery_path,
        mermaid_path,
        runtime_source_path,
        component_source_path,
        mission_frame_source_path,
        spec_path,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    contract = load_json(contract_path)
    require(contract["taskId"] == "par_160", "URGENT_SURFACE_TASK_ID_DRIFT")
    require(
        contract["contractId"] == "PHASE1_SAME_SHELL_URGENT_SURFACE_V1",
        "URGENT_SURFACE_CONTRACT_ID_DRIFT",
    )
    require(
        contract["allowedVariants"]
        == ["urgent_required_pending", "urgent_issued", "failed_safe_recovery"],
        "URGENT_SURFACE_VARIANT_LIST_DRIFT",
    )
    require(
        contract["navigationGrantLaw"]["urgentRequiredMayShowUrgentDiverted"] is False,
        "URGENT_SURFACE_PENDING_ISSUED_SPLIT_DRIFT",
    )

    matrix_rows = load_csv(matrix_path)
    variants = {row["variant"] for row in matrix_rows}
    require(
        {"urgent_required_pending", "urgent_issued", "failed_safe_recovery"} <= variants,
        "URGENT_SURFACE_MATRIX_ROWS_MISSING",
    )
    require(
        any(
            row["variant"] == "urgent_required_pending"
            and row["urgent_diverted_visible"] == "false"
            and row["settlement_state"] == "pending"
            for row in matrix_rows
        ),
        "URGENT_SURFACE_PENDING_ROW_MUST_NOT_RENDER_URGENT_DIVERTED",
    )
    require(
        any(
            row["variant"] == "urgent_issued"
            and row["urgent_diverted_visible"] == "true"
            and row["settlement_state"] == "issued"
            for row in matrix_rows
        ),
        "URGENT_SURFACE_ISSUED_ROW_MUST_REQUIRE_ISSUED_SETTLEMENT",
    )

    focus_rows = load_csv(focus_path)
    require(
        all(row["entry_focus_target"] == "primary_action" for row in focus_rows),
        "URGENT_SURFACE_FOCUS_TARGET_DRIFT",
    )
    require(
        any(
            row["variant"] == "failed_safe_recovery"
            and row["lawful_return_action"] == "return_to_review"
            for row in focus_rows
        ),
        "URGENT_SURFACE_FAILED_SAFE_RETURN_ACTION_MISSING",
    )

    runtime_source = runtime_source_path.read_text(encoding="utf-8")
    component_source = component_source_path.read_text(encoding="utf-8")
    mission_frame_source = mission_frame_source_path.read_text(encoding="utf-8")
    gallery_html = gallery_path.read_text(encoding="utf-8")
    spec_source = spec_path.read_text(encoding="utf-8")

    for marker in [
        "urgent_required_pending",
        "urgent_issued",
        "failed_safe_recovery",
        "issueUrgentOutcome",
        "OutboundNavigationGrant",
    ]:
        require(marker in runtime_source or marker in component_source, f"URGENT_SURFACE_RUNTIME_MARKER_MISSING:{marker}")

    for marker in [
        "urgent-pathway-frame",
        "urgent-required-pending-settlement-card",
        "urgent-issued-guidance-card",
        "failed-safe-recovery-card",
        "urgent-dominant-action",
        "urgent-support-summary",
        "urgent-rationale-disclosure",
    ]:
        require(
            marker in runtime_source
            or marker in component_source
            or marker in mission_frame_source,
            f"URGENT_SURFACE_UI_MARKER_MISSING:{marker}",
        )

    for forbidden in [
        "Urgent diversion placeholder",
        "validation error",
        "please correct the errors above",
    ]:
        require(forbidden not in mission_frame_source, f"URGENT_SURFACE_PLACEHOLDER_OR_VALIDATION_DRIFT:{forbidden}")

    for marker in [
        'data-testid="urgent-diversion-gallery"',
        'data-testid="urgent-decision-ladder-diagram"',
        'data-testid="urgent-decision-ladder-table"',
        'data-testid="urgent-copy-comparison-table"',
        'data-testid="urgent-state-matrix-table"',
    ]:
        require(marker in gallery_html, f"URGENT_SURFACE_GALLERY_MARKER_MISSING:{marker}")

    require(
        "urgent guidance is not yet issued" in gallery_html.lower(),
        "URGENT_SURFACE_GALLERY_PENDING_COPY_MISSING",
    )
    require(
        "failed-safe recovery" in gallery_html.lower(),
        "URGENT_SURFACE_GALLERY_FAILED_SAFE_COPY_MISSING",
    )

    for marker in [
        "urgent-required-pending-settlement-card",
        "urgent-issued-guidance-card",
        "failed-safe-recovery-card",
        "urgent-dominant-action",
        "failed-safe-dominant-action",
        "reducedMotion",
    ]:
        require(marker in spec_source, f"URGENT_SURFACE_SPEC_MARKER_MISSING:{marker}")

    print("validate_same_shell_urgent_diversion_surface: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
