#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = ROOT / "data" / "analysis" / "patient_mock_projection_examples.json"
ROUTE_CSV_PATH = ROOT / "data" / "analysis" / "patient_route_contract_seed.csv"
TRUST_CSV_PATH = ROOT / "data" / "analysis" / "patient_attention_and_trust_cue_matrix.csv"
GALLERY_PATH = ROOT / "docs" / "architecture" / "115_patient_shell_gallery.html"
ROUTE_MAP_PATH = ROOT / "docs" / "architecture" / "115_patient_shell_route_map.mmd"
ROOT_PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_PATH = ROOT / "tests" / "playwright" / "package.json"
DOC_PATHS = [
    ROOT / "docs" / "architecture" / "115_patient_shell_seed_routes.md",
    ROOT / "docs" / "architecture" / "115_patient_mock_projection_strategy.md",
    ROOT / "docs" / "architecture" / "115_patient_nav_manifest_and_return_contracts.md",
]
APP_PATHS = [
    ROOT / "apps" / "patient-web" / "src" / "App.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.model.ts",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.css",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.test.tsx",
    ROOT / "apps" / "patient-web" / "src" / "patient-shell-seed.model.test.ts",
]
SPEC_PATHS = [
    ROOT / "tests" / "playwright" / "patient-shell-seed-routes.spec.js",
    ROOT / "tools" / "analysis" / "validate_patient_shell_seed_routes.py",
]

REQUIRED_ROUTES = {
    "/home",
    "/home/embedded",
    "/requests",
    "/requests/REQ-2049",
    "/appointments",
    "/records",
    "/records/REC-HEM-8/follow-up",
    "/messages",
    "/messages/thread/THR-420",
    "/recovery/secure-link",
}
REQUIRED_GAP_REFS = {
    "GAP_RESOLUTION_PATIENT_COPY_QUIET_HOME",
    "GAP_RESOLUTION_PATIENT_COPY_APPOINTMENTS_READ_ONLY",
    "GAP_RESOLUTION_PATIENT_COPY_BLOCKED_CONTACT_THREAD",
    "GAP_RESOLUTION_PATIENT_COPY_RECORD_FOLLOW_UP",
}
REQUIRED_GALLERY_HOOKS = {
    "patient-shell-gallery",
    "patient-gallery-masthead",
    "patient-gallery-shell-preview",
    "patient-gallery-route-grid",
    "patient-gallery-route-matrix",
    "patient-gallery-nav-diagram",
    "patient-gallery-adjacency-diagram",
    "patient-gallery-degraded-diagram",
    "patient-gallery-record-parity",
    "patient-gallery-gap-resolutions",
}
REQUIRED_ROUTE_MAP_SNIPPETS = {
    "/home",
    "/requests/:requestId",
    "/records/:recordId/follow-up",
    "/messages/thread/:threadId",
    "/recovery/secure-link",
    "/home/embedded",
}
REQUIRED_APP_SNIPPETS = {
    "PatientShellSeedApp",
    "writePersistedContinuitySnapshot",
    "mintEdgeCorrelation",
    "ArtifactSurfaceFrame",
    'data-testid="patient-shell-root"',
    'data-testid="patient-decision-dock"',
}
REQUIRED_PLAYWRIGHT_SNIPPETS = {
    "patientShellSeedRouteCoverage",
    "patient-shell-root",
    "patient-telemetry-panel",
    "utility-toggle-diagnostics",
    "mission_stack",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    payload = json.loads(read_text(JSON_PATH))
    require(payload.get("task_id") == "par_115", "patient mock projection JSON task_id drifted")
    require(
        payload.get("summary", {}).get("route_example_count") == 9,
        "patient route example count drifted",
    )
    require(payload.get("summary", {}).get("section_count") == 5, "patient section count drifted")
    require(payload.get("summary", {}).get("request_count") == 4, "patient request count drifted")
    require(
        payload.get("summary", {}).get("appointment_count") == 4,
        "patient appointment count drifted",
    )
    require(payload.get("summary", {}).get("record_count") == 3, "patient record count drifted")
    require(payload.get("summary", {}).get("message_count") == 4, "patient message count drifted")
    require(
        payload.get("summary", {}).get("quiet_home_variant_count") == 1,
        "patient quiet-home variant count drifted",
    )
    require(
        payload.get("summary", {}).get("degraded_variant_count") == 4,
        "patient degraded variant count drifted",
    )
    require(
        {entry.get("gap_id") for entry in payload.get("gap_resolutions", [])} == REQUIRED_GAP_REFS,
        "patient gap resolution set drifted",
    )

    route_rows = list(csv.DictReader(read_text(ROUTE_CSV_PATH).splitlines()))
    require(len(route_rows) == 10, "patient route contract CSV must contain 10 routes")
    require({row["path"] for row in route_rows} == REQUIRED_ROUTES, "patient route CSV paths drifted")
    require(
        {row["section"] for row in route_rows} == {"home", "requests", "appointments", "records", "messages"},
        "patient route CSV section set drifted",
    )

    trust_rows = list(csv.DictReader(read_text(TRUST_CSV_PATH).splitlines()))
    require(len(trust_rows) == 8, "patient trust cue matrix must contain 8 rows")
    require(
        {row["state"] for row in trust_rows}
        == {
            "attention_needed",
            "quiet_home",
            "reply_needed",
            "blocked_repair",
            "confirmation_pending",
            "summary_first",
            "blocked_contact",
            "secure_link_repair",
        },
        "patient trust cue matrix states drifted",
    )

    gallery_html = read_text(GALLERY_PATH)
    for hook in REQUIRED_GALLERY_HOOKS:
        require(hook in gallery_html, f"gallery hook missing: {hook}")
    require("Signal Atlas Live" in gallery_html, "gallery mark drifted")
    require("Ferritin result summary with chart and table fallback" in gallery_html, "gallery parity copy drifted")

    route_map = read_text(ROUTE_MAP_PATH)
    for snippet in REQUIRED_ROUTE_MAP_SNIPPETS:
        require(snippet in route_map, f"route map missing snippet: {snippet}")
    require("Read only" in route_map, "route map degraded-mode ladder drifted")
    require("Recovery only" in route_map, "route map recovery posture drifted")

    for doc_path in DOC_PATHS:
        doc = read_text(doc_path)
        require("patient" in doc.lower(), f"architecture doc lacks patient context: {doc_path.name}")
        require("shell" in doc.lower(), f"architecture doc lacks shell context: {doc_path.name}")
        require("same-shell" in doc.lower(), f"architecture doc lacks same-shell contract: {doc_path.name}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for snippet in REQUIRED_APP_SNIPPETS:
        require(snippet in app_text, f"patient app source missing snippet: {snippet}")
    require("/home/embedded" in app_text, "embedded route missing from patient app sources")
    require("/recovery/secure-link" in app_text, "recovery route missing from patient app sources")

    spec_text = "\n".join(read_text(path) for path in SPEC_PATHS)
    for snippet in REQUIRED_PLAYWRIGHT_SNIPPETS:
        require(snippet in spec_text, f"patient Playwright surface missing snippet: {snippet}")

    root_package = read_text(ROOT_PACKAGE_PATH)
    require(
        "validate:patient-shell-seed-routes" in root_package,
        "root package is missing validate:patient-shell-seed-routes",
    )
    root_script_updates = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(
        "validate:patient-shell-seed-routes" in root_script_updates,
        "root_script_updates.py is missing validate:patient-shell-seed-routes",
    )
    playwright_package = read_text(PLAYWRIGHT_PACKAGE_PATH)
    require(
        "patient-shell-seed-routes.spec.js" in playwright_package,
        "tests/playwright/package.json is missing the patient shell spec",
    )

    print(
        json.dumps(
            {
                "task_id": "par_115",
                "validated_routes": sorted(REQUIRED_ROUTES),
                "route_row_count": len(route_rows),
                "trust_row_count": len(trust_rows),
                "gallery_hook_count": len(REQUIRED_GALLERY_HOOKS),
                "gap_resolution_count": len(REQUIRED_GAP_REFS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
