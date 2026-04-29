#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"
CASEWORK_ROUTE = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.tsx"
CASEWORK_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.model.ts"
CASEWORK_TEST = ROOT / "apps" / "patient-web" / "src" / "patient-home-requests-detail-routes.test.tsx"
APP_TEST = ROOT / "apps" / "patient-web" / "src" / "App.test.tsx"
SHARED_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.model.ts"
BOOKING_MODEL = ROOT / "apps" / "patient-web" / "src" / "patient-booking-entry.model.ts"
EMBEDDED_MODEL = ROOT / "apps" / "patient-web" / "src" / "embedded-shell-split.model.ts"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "patient-shell-seed-routes.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"

RETIRED_UI_FILES = [
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.css",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.test.tsx",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_absent(path: Path) -> None:
    require(not path.exists(), f"Retired patient shell UI file still exists: {path.relative_to(ROOT)}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    for marker in markers:
        require(marker in text, f"{label} missing marker: {marker}")


def require_not_markers(label: str, text: str, markers: set[str]) -> None:
    for marker in markers:
        require(marker not in text, f"{label} still contains retired marker: {marker}")


def main() -> None:
    for retired_file in RETIRED_UI_FILES:
        require_absent(retired_file)

    app = read_text(APP)
    require_markers(
        "patient app routing",
        app,
        {
            'import PatientHomeRequestsDetailRoutesApp',
            "PatientAppointmentFamilyWorkspace",
            "return <PatientHomeRequestsDetailRoutesApp />;",
            'pathname === "/appointments"',
            "isPatientHomeRequestsDetailPath(pathname)",
            "isSignedInRequestStartPath(pathname)",
            "isPatientIntakeMissionFramePath(pathname)",
        },
    )
    require_not_markers(
        "patient app routing",
        app,
        {
            'import "./patient-shell-seed.css"',
            'from "./patient-shell-seed"',
            "PatientShellSeedApp",
            "patient-shell-seed-routes",
        },
    )

    casework = read_text(CASEWORK_ROUTE)
    casework_model = read_text(CASEWORK_MODEL)
    require_markers(
        "canonical patient home route",
        casework + "\n" + casework_model,
        {
            "PATIENT_HOME_REQUESTS_DETAIL_VISUAL_MODE",
            "Quiet_Casework_Premium",
            "normalizePatientHomeRequestsDetailPath",
            "SIGNED_IN_REQUEST_START_ENTRY",
            "home-start-new-request",
            "quiet-home-start-new-request",
            "PatientRequestDownstreamWorkRail",
            "PatientBookingEntryProjectionAdapter",
        },
    )

    tests = read_text(CASEWORK_TEST) + "\n" + read_text(APP_TEST)
    require_markers(
        "canonical patient home tests",
        tests,
        {
            "Start new request",
            "normalizes retired patient shell paths",
            "Patient_Home_Requests_Detail_Route",
            "Quiet_Casework_Premium",
            "Patient_Shell_Gallery",
        },
    )

    shared_model = read_text(SHARED_MODEL)
    require(
        "PATIENT_SHELL_VISUAL_MODE" in shared_model,
        "shared patient shell model helpers were removed before dependent routes were migrated",
    )
    require(
        'from "./patient-shell-seed.model"' in read_text(BOOKING_MODEL)
        and 'from "./patient-shell-seed.model"' in read_text(EMBEDDED_MODEL),
        "shared model dependency check drifted; revisit whether patient-shell-seed.model.ts can now be retired",
    )

    playwright = read_text(PLAYWRIGHT_SPEC)
    require_markers(
        "patient replacement Playwright spec",
        playwright,
        {
            "legacy patient shell files are absent",
            "patient-shell-seed-routes",
            "Patient_Home_Requests_Detail_Route",
            "home-start-new-request",
            "Signed_In_Request_Start_Restore_Route",
            "/start-request/dft_auth_199/request-type",
        },
    )

    root_package = read_text(ROOT_PACKAGE_PATH)
    root_script_updates = read_text(ROOT_SCRIPT_UPDATES_PATH)
    playwright_package = read_text(PLAYWRIGHT_PACKAGE_PATH)
    require(
        "validate:patient-shell-seed-routes" in root_package,
        "root package is missing validate:patient-shell-seed-routes",
    )
    require(
        "ROOT_SCRIPT_UPDATES" in root_script_updates and "name.startswith(\"validate:\")" in root_script_updates,
        "root_script_updates.py no longer derives validate scripts from package.json",
    )
    require(
        "patient-shell-seed-routes.spec.js" in playwright_package,
        "tests/playwright/package.json is missing the patient replacement spec",
    )

    print(
        json.dumps(
            {
                "task_id": "patient_shell_seed_retirement",
                "retired_ui_files": [str(path.relative_to(ROOT)) for path in RETIRED_UI_FILES],
                "canonical_surface": "Patient_Home_Requests_Detail_Route",
                "canonical_visual_mode": "Quiet_Casework_Premium",
                "shared_model_retained": str(SHARED_MODEL.relative_to(ROOT)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
