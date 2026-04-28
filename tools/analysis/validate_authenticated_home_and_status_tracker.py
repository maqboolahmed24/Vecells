#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

MODEL = ROOT / "apps" / "patient-web" / "src" / "authenticated-home-status-tracker.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "authenticated-home-status-tracker.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "authenticated-home-status-tracker.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "196_authenticated_patient_home_and_status_tracker_uplift.md"
ATLAS = ROOT / "docs" / "frontend" / "196_authenticated_home_and_status_tracker_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "196_home_to_request_detail_continuity_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "196_authenticated_home_surface_contract.json"
SPOTLIGHT_MATRIX = ROOT / "data" / "analysis" / "196_home_spotlight_and_request_tracker_matrix.csv"
ANCHOR_CASES = ROOT / "data" / "analysis" / "196_request_detail_visibility_and_anchor_cases.json"
QUIET_TABLE = ROOT / "data" / "analysis" / "196_quiet_home_vs_attention_home_decision_table.csv"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_HOME.json"
UPSTREAM_185 = ROOT / "data" / "analysis" / "185_portal_projection_matrix.csv"
PLAYWRIGHT_SPEC = (
    ROOT / "tests" / "playwright" / "196_authenticated_patient_home_and_status_tracker_uplift.spec.ts"
)

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_GENERIC_DASHBOARD_MODEL.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_REQUEST_ROW_AUDIENCE_COVERAGE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_SINGLE_DOMINANT_ACTION.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_SELECTED_ANCHOR_RETURN_BUNDLE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_CONTACT_BLOCKER_PROMOTION.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_HOME_STATUS_TRACKER_CANONICAL_TRUTH.json",
]

REQUIRED_PROJECTIONS = {
    "PatientHomeProjection",
    "PatientSpotlightDecisionProjection",
    "PatientPortalNavigationProjection",
    "PatientRequestsIndexProjection",
    "PatientRequestSummaryProjection",
    "PatientRequestDetailProjection",
    "PatientRequestReturnBundle",
    "PatientAudienceCoverageProjection",
    "PatientActionRecoveryProjection",
    "PatientIdentityHoldProjection",
}

REQUIRED_COMPONENTS = {
    "RequestSpotlightPanel",
    "QuietHomePanel",
    "CompactRequestCard",
    "RequestTrackerRow",
    "StatusRibbon",
    "AudienceCoverageBadge",
    "SessionExpiryBanner",
}

ROUTE_TESTIDS = {
    "Authenticated_Patient_Home_Status_Tracker_Route",
    "request-spotlight-panel",
    "quiet-home-panel",
    "authenticated-requests-index",
    "authenticated-request-detail",
    "request-tracker-row-${request.requestId}",
    "status-ribbon",
    "audience-coverage-badge",
    "session-expiry-banner",
    "reachability-blocker-promoted",
    "portal-live-region",
}

ATLAS_TESTIDS = {
    "Authenticated_Home_Status_Tracker_Atlas",
    "spotlight-state-gallery",
    "request-row-parity-matrix",
    "quiet-attention-decision-board",
    "continuity-diagram",
    "atlas-parity-table",
}

REQUIRED_GAP_KEYS = {
    "taskId",
    "sourceAmbiguity",
    "decisionTaken",
    "whyThisFitsTheBlueprint",
    "operationalRisk",
    "followUpIfPolicyChanges",
}


def fail(message: str) -> None:
    raise SystemExit(f"[196-authenticated-home-status-tracker] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ X-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1)


def validate_checklist() -> None:
    if checklist_state("par_195") != "X":
        fail("par_195 must be complete before validating par_196")
    if checklist_state("par_196") not in {"-", "X"}:
        fail("par_196 must be claimed or complete")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    css = read(CSS)
    app = read(APP)

    for token in REQUIRED_PROJECTIONS:
        if token not in model:
            fail(f"model missing projection {token}")
        if token not in CONTRACT.read_text(encoding="utf-8"):
            fail(f"contract missing projection {token}")
    for token in REQUIRED_COMPONENTS:
        if token not in route:
            fail(f"route missing component {token}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing data-testid token {testid}")
    for token in [
        "isAuthenticatedHomeStatusTrackerPath",
        "AuthenticatedHomeStatusTrackerApp",
    ]:
        if token not in app:
            fail(f"App.tsx missing route gate token {token}")
    for forbidden in ["URLSearchParams", "location.search"]:
        if forbidden in route or forbidden in model:
            fail(f"portal resolver must not derive state from {forbidden}")
    for token in [
        "singleDominantAction: true",
        "contactPreferenceSecondaryUnlessBlocking",
        "maxVisibleDetail",
        "PatientRequestReturnBundle",
        "sessionStorage",
        "focusTestId",
    ]:
        if token not in model and token not in route:
            fail(f"source missing required behavior token {token}")
    for token in [
        "grid-template-columns: 240px minmax(720px, 1fr)",
        "max-width: 1440px",
        "padding: 32px",
        "grid-column: span 8",
        "grid-column: span 4",
        "prefers-reduced-motion: reduce",
    ]:
        if token not in css:
            fail(f"CSS missing layout or motion token {token}")


def validate_docs_and_data() -> None:
    for path in [ARCH_DOC, ATLAS, FLOW, CONTRACT, SPOTLIGHT_MATRIX, ANCHOR_CASES, QUIET_TABLE, UPSTREAM_185]:
        text = read(path)
        if "196" not in text and path != UPSTREAM_185:
            fail(f"{path.relative_to(ROOT)} does not reference task 196")

    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in ["interactive spotlight-state gallery", "PatientRequestReturnBundle", "data-ready"]:
        if token not in atlas:
            fail(f"atlas missing required token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "Quiet_Portal_Atlas":
        fail("surface contract has wrong visual mode")
    if not REQUIRED_PROJECTIONS.issubset(set(contract.get("projections", []))):
        fail("surface contract lost required projections")
    if "data/analysis/185_portal_projection_matrix.csv" not in contract.get("consumes", []):
        fail("surface contract must consume task 185 output")

    with SPOTLIGHT_MATRIX.open(newline="", encoding="utf-8") as handle:
        matrix_rows = list(csv.DictReader(handle))
    required_cases = {
        "HOME_ATTENTION",
        "HOME_QUIET",
        "REQUESTS_INDEX",
        "DETAIL_FULL",
        "DETAIL_NARROWED",
        "REACHABILITY_BLOCKER",
        "SESSION_EXPIRING",
        "SESSION_EXPIRED",
    }
    if {row["case_id"] for row in matrix_rows} != required_cases:
        fail("spotlight matrix case coverage drifted")
    if any(row["audience_cap"] == "" for row in matrix_rows):
        fail("spotlight matrix must publish audience cap per row")

    with QUIET_TABLE.open(newline="", encoding="utf-8") as handle:
        quiet_rows = list(csv.DictReader(handle))
    if not {"quiet", "attention"}.issubset({row["home_mode"] for row in quiet_rows}):
        fail("quiet/attention table must cover both home modes")

    anchor_cases = load_json(ANCHOR_CASES)
    actual_case_ids = {case["caseId"] for case in anchor_cases.get("cases", [])}
    for case_id in [
        "ANCHOR_HOME_TO_DETAIL_TO_BACK",
        "ANCHOR_REFRESH_REPLAY",
        "DETAIL_NARROWS_ON_IDENTITY_HOLD",
        "REACHABILITY_BLOCKER_PROMOTED",
        "SESSION_EXPIRED_BOUNDED_RECOVERY",
    ]:
        if case_id not in actual_case_ids:
            fail(f"anchor cases missing {case_id}")
    if "generic home redirect while PatientRequestReturnBundle can recover" not in anchor_cases.get("forbidden", []):
        fail("anchor cases must forbid generic home redirect")

    upstream = read(UPSTREAM_185)
    for token in [
        "PatientAudienceCoverageProjection",
        "PatientHomeProjection",
        "PatientRequestsIndexProjection",
        "PatientRequestDetailProjection",
        "PatientActionRecoveryProjection",
        "PatientIdentityHoldProjection",
    ]:
        if token not in upstream:
            fail(f"task 185 upstream matrix missing expected projection {token}")

    for gap_path in [PARALLEL_GAP, *GAP_RESOLUTIONS]:
        gap = load_json(gap_path)
        missing = REQUIRED_GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_196":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "aria-current",
        "request-spotlight-panel",
        "quiet-home-panel",
        "authenticated-requests-index",
        "authenticated-request-detail",
        "session-expiry-banner",
        "reachability-blocker-promoted",
        "summary_only",
        "request-tracker-row-REQ-4219",
        "Authenticated_Home_Status_Tracker_Atlas",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing coverage token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_authenticated_home_and_status_tracker.py"
    if scripts.get("validate:authenticated-home-status-tracker") != expected:
        fail("package.json missing validate:authenticated-home-status-tracker script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:authenticated-home-status-tracker": "python3 ./tools/analysis/validate_authenticated_home_and_status_tracker.py"' not in root_updates:
        fail("root_script_updates missing validate:authenticated-home-status-tracker")
    required_chain = (
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:authenticated-home-status-tracker && "
        "pnpm validate:claim-resume-identity-hold && "
        "pnpm validate:mobile-sms-continuation-flow && "
        "pnpm validate:signed-in-request-start-restore && "
        "pnpm validate:contact-truth-preference-ui && "
        "pnpm validate:cross-channel-receipt-status-parity && "
        "pnpm validate:nhs-login-client-config && "
        "pnpm validate:signal-provider-manifest && "
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:audit-worm"
    )
    for script_name in ("bootstrap", "check"):
        if required_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing authenticated home validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing authenticated home validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_and_data()
    validate_playwright_spec()
    validate_scripts()
    print("[196-authenticated-home-status-tracker] validation passed")


if __name__ == "__main__":
    main()
