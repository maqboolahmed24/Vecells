#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

REQUIRED_FILES = [
    ROOT / "docs/architecture/155_patient_intake_mission_frame.md",
    ROOT / "docs/architecture/155_patient_intake_same_shell_contracts.md",
    ROOT / "docs/frontend/155_patient_intake_mission_frame_gallery.html",
    ROOT / "docs/frontend/155_patient_intake_route_adjacency.mmd",
    ROOT / "data/analysis/155_mission_frame_layout_contract.json",
    ROOT / "data/analysis/155_mission_frame_state_and_anchor_matrix.csv",
    ROOT / "apps/patient-web/src/patient-intake-mission-frame.model.ts",
    ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx",
    ROOT / "apps/patient-web/src/patient-intake-mission-frame.css",
    ROOT / "apps/patient-web/src/patient-intake-mission-frame.model.test.ts",
    ROOT / "apps/patient-web/src/patient-intake-mission-frame.test.tsx",
    ROOT / "tests/playwright/155_patient_intake_mission_frame.spec.js",
]

REQUIRED_TESTIDS = [
    "patient-intake-mission-frame-root",
    "patient-intake-masthead",
    "patient-intake-status-strip",
    "patient-intake-progress-rail",
    "patient-intake-question-canvas",
    "patient-intake-summary-panel",
    "patient-intake-action-tray",
]

REQUIRED_ROUTES = {
    "landing": "/start-request",
    "request_type": "/start-request/:draftPublicId/request-type",
    "details": "/start-request/:draftPublicId/details",
    "supporting_files": "/start-request/:draftPublicId/files",
    "contact_preferences": "/start-request/:draftPublicId/contact",
    "review_submit": "/start-request/:draftPublicId/review",
    "resume_recovery": "/start-request/:draftPublicId/recovery",
    "urgent_outcome": "/start-request/:draftPublicId/urgent-guidance",
    "receipt_outcome": "/start-request/:draftPublicId/receipt",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def main() -> None:
    for required_file in REQUIRED_FILES:
      require(required_file.exists(), f"MISSING_REQUIRED_FILE:{required_file}")

    layout_contract = json.loads(
        (ROOT / "data/analysis/155_mission_frame_layout_contract.json").read_text(encoding="utf-8")
    )
    require(
        layout_contract.get("shell_id") == "Quiet_Clarity_Mission_Frame",
        "LAYOUT_CONTRACT_SHELL_ID_DRIFT",
    )
    require(
        layout_contract.get("route_family_ref") == "rf_intake_self_service",
        "LAYOUT_CONTRACT_ROUTE_FAMILY_DRIFT",
    )
    require(
        layout_contract.get("continuity_key") == "patient.portal.requests",
        "LAYOUT_CONTRACT_CONTINUITY_KEY_DRIFT",
    )

    app_source = (ROOT / "apps/patient-web/src/patient-intake-mission-frame.tsx").read_text(
        encoding="utf-8"
    )
    gallery_source = (
        ROOT / "docs/frontend/155_patient_intake_mission_frame_gallery.html"
    ).read_text(encoding="utf-8")

    for testid in REQUIRED_TESTIDS:
        require(testid in app_source, f"MISSING_TESTID_IN_APP:{testid}")

    require("wizard" not in app_source.lower(), "GENERIC_WIZARD_STRING_FOUND_IN_APP")
    require(
        "mission-frame-layout-parity" in gallery_source
        and "mission-frame-journey-parity" in gallery_source,
        "GALLERY_PARITY_TABLES_MISSING",
    )

    with (ROOT / "data/analysis/155_mission_frame_state_and_anchor_matrix.csv").open(
        encoding="utf-8", newline=""
    ) as handle:
        rows = list(csv.DictReader(handle))

    route_rows = {row["route_key"]: row for row in rows}
    for route_key, implemented_path in REQUIRED_ROUTES.items():
        require(route_key in route_rows, f"MISSING_STATE_MATRIX_ROW:{route_key}")
        require(
            route_rows[route_key]["implemented_path_pattern"] == implemented_path,
            f"IMPLEMENTED_PATH_DRIFT:{route_key}",
        )

    spec_source = (
        ROOT / "tests/playwright/155_patient_intake_mission_frame.spec.js"
    ).read_text(encoding="utf-8")
    require(
        "patient-intake-mission-frame-root" in spec_source
        and "patient-intake-summary-panel" in spec_source
        and "patient-intake-action-tray" in spec_source,
        "PLAYWRIGHT_SPEC_MARKER_COVERAGE_MISSING",
    )

    print("validate_patient_intake_mission_frame: ok")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as error:  # pragma: no cover
        print(f"VALIDATION_ERROR:{error}", file=sys.stderr)
        raise
