#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "authenticated-portal-projections.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "patient-home-projection-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "210_patient_spotlight_and_quiet_home_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "210_patient_home_actionability_and_visibility_controls.md"
HTML_ATLAS = ROOT / "docs" / "frontend" / "210_quiet_home_state_atlas.html"
MATRIX = ROOT / "data" / "analysis" / "210_spotlight_candidate_and_quiet_home_matrix.csv"
USE_WINDOW = ROOT / "data" / "analysis" / "210_spotlight_use_window_cases.json"
ALIAS = ROOT / "data" / "analysis" / "210_home_projection_alias_resolution.json"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "210_quiet_home_state_atlas.spec.js"

TASK = "par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic"

REQUIRED_PROJECTIONS = {
    "PatientSpotlightDecisionProjection",
    "PatientSpotlightDecisionUseWindow",
    "PatientQuietHomeDecision",
    "PatientHomeProjection",
    "PatientPortalHomeProjection",
    "PatientNavUrgencyDigest",
    "PatientNavReturnContract",
    "PatientPortalNavigationProjection",
}

REQUIRED_TIERS = {
    "urgent_safety",
    "patient_action",
    "dependency_repair",
    "watchful_attention",
    "quiet_home",
}

REQUIRED_CANDIDATE_TYPES = {
    "active_request",
    "pending_patient_action",
    "dependency_repair",
    "callback_message_blocker",
    "record_results_cue",
    "contact_reachability_repair",
    "recovery_identity_hold",
}

REQUIRED_REGIONS = {
    "Quiet_Home_State_Atlas",
    "SpotlightCandidateLadder",
    "SpotlightUseWindowStrip",
    "QuietHomeEligibilityMap",
    "MockHomeFrame",
    "TupleInspector",
    "MatrixShelf",
}

REQUIRED_COLORS = {
    "#F8FAFC",
    "#FFFFFF",
    "#EEF2F7",
    "#0F172A",
    "#334155",
    "#64748B",
    "#D7DFEA",
    "#3158E0",
    "#0F766E",
    "#B7791F",
    "#B42318",
}

REQUIRED_SCREENSHOTS = {
    "210-urgent-safety-spotlight.png",
    "210-patient-action-spotlight.png",
    "210-dependency-repair-spotlight.png",
    "210-quiet-home-eligible.png",
    "210-quiet-home-blocked.png",
    "210-read-only-recovery-downgrade.png",
    "210-quiet-home-zoom.png",
    "210-quiet-home-reduced-motion.png",
    "210-quiet-home-mobile.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[patient-home-projection-stack] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if "- [X] seq_209_crosscutting_open_patient_account_and_support_surface_tracks_gate" not in checklist:
        fail("seq_209 prerequisite is not complete")
    claimed = f"- [-] {TASK}" in checklist
    complete = f"- [X] {TASK}" in checklist
    if not (claimed or complete):
        fail("task 210 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | REQUIRED_TIERS
        | REQUIRED_CANDIDATE_TYPES
        | {
            "assemblePatientHomeProjection",
            "getPatientHome",
            "GET /v1/me/home",
            "selectionTupleHash",
            "candidateLadder",
            "quietHomeDecision",
            "capabilityLeaseState",
            "writableEligibilityState",
            "blocked_by_degraded_truth",
            "blocked_by_visibility_or_actionability",
            "singleDominantAction",
        },
    )
    for forbidden in ("controllerLocalTrim", "broadFetchThenTrim", "document.cookie", "localStorage"):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "patient_portal_home_current",
            "GET",
            "/v1/me/home",
            "PatientHomeProjectionContract",
            "PatientPortalHomeProjection",
            "PatientNavUrgencyDigest",
            "PatientNavReturnContract",
        },
    )


def validate_docs() -> None:
    combined = read(ARCH_DOC) + "\n" + read(SECURITY_DOC)
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_TIERS
        | REQUIRED_CANDIDATE_TYPES
        | {
            "GET /v1/me/home",
            "projection-first",
            "one dominant action",
            "quiet home is a positive decision",
            "blocked_by_degraded_truth",
            "blocked_by_visibility_or_actionability",
            "NHS service manual",
            "GOV.UK",
            "Apple privacy",
            "Monzo writing",
            "minmax(720px, 1fr)",
            "1560px",
            "392px",
        },
    )


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 9:
        fail("candidate matrix needs at least nine evidence rows")
    tiers = {row["decision_tier"] for row in rows}
    candidate_types = {row["candidate_type"] for row in rows}
    missing_tiers = REQUIRED_TIERS - tiers
    missing_types = REQUIRED_CANDIDATE_TYPES - candidate_types
    if missing_tiers:
        fail(f"candidate matrix missing tiers: {sorted(missing_tiers)}")
    if missing_types:
        fail(f"candidate matrix missing candidate types: {sorted(missing_types)}")
    quiet_reasons = {row["quiet_home_reason"] for row in rows}
    for reason in {"all_clear", "candidate_present", "blocked_by_degraded_truth", "blocked_by_visibility_or_actionability", "blocked_by_identity_hold"}:
        if reason not in quiet_reasons:
            fail(f"candidate matrix missing quiet reason: {reason}")
    if not any(row["capability_lease_state"] == "stale" for row in rows):
        fail("candidate matrix missing stale capability case")
    if not any(row["writable_eligibility_state"] == "read_only" for row in rows):
        fail("candidate matrix missing read-only writable eligibility case")


def validate_use_window() -> None:
    data = json.loads(read(USE_WINDOW))
    if data.get("taskId") != TASK:
        fail("use-window JSON taskId drifted")
    if data.get("visualMode") != "Quiet_Home_State_Atlas":
        fail("use-window JSON visual mode drifted")
    cases = data.get("cases", [])
    states = {case.get("windowState") for case in cases}
    for state in {"preserved", "preempted_by_higher_tier", "expired_revalidated", "quiet_revalidated"}:
        if state not in states:
            fail(f"use-window cases missing state: {state}")
    order = data.get("selectionTupleOrder", [])
    for marker in [
        "decisionTier",
        "patientSafetyBlocker",
        "patientOwedAction",
        "activeDependencyFailure",
        "authoritativeDueAt",
        "latestMeaningfulUpdateAt",
        "stableEntityRef",
    ]:
        if marker not in order:
            fail(f"use-window tuple order missing: {marker}")


def validate_alias() -> None:
    data = json.loads(read(ALIAS))
    if data.get("authoritativeProjection") != "PatientHomeProjection":
        fail("alias authoritative projection drifted")
    if data.get("aliasProjection") != "PatientPortalHomeProjection":
        fail("alias projection drifted")
    if data.get("querySurface", {}).get("path") != "/v1/me/home":
        fail("alias query surface path drifted")
    if not data.get("aliasResolution", {}).get("noThirdHomeContract"):
        fail("alias resolution must forbid a third home contract")
    require_markers("alias json", json.dumps(data), REQUIRED_PROJECTIONS)
    if not GAP.exists():
        fail("expected crosscutting home gap artifact from seq_209 to exist")


def validate_atlas() -> None:
    html = read(HTML_ATLAS)
    require_markers(
        "atlas",
        html,
        REQUIRED_REGIONS
        | REQUIRED_TIERS
        | REQUIRED_COLORS
        | {
            "max-width: 1560px",
            "padding: 28px",
            "grid-template-columns: 280px minmax(760px, 1fr) 392px",
            "--top-shell-band: 64px",
            "--left-nav: 240px",
            "--primary-min: 720px",
            "--assist: 320px",
            "--production-max: 1440px",
            "--page-padding: 32px",
            "--rhythm: 8px",
            "urgent-safety",
            "patient-action",
            "dependency-repair",
            "quiet-home-eligible",
            "quiet-home-blocked",
            "read-only-recovery-downgrade",
            "window.__quietHomeAtlasData",
            "aria-label=\"Matrix shelf\"",
            "prefers-reduced-motion",
        },
    )


def validate_tests() -> None:
    backend = read(BACKEND_TEST)
    require_markers(
        "backend test",
        backend,
        {
            "getPatientHome",
            "PatientPortalHomeProjection",
            "preempted_by_higher_tier",
            "preserved",
            "blocked_by_degraded_truth",
            "blocked_by_visibility_or_actionability",
            "capability_lease_stale",
            "singleDominantAction",
        },
    )
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_REGIONS
        | REQUIRED_SCREENSHOTS
        | {
            "ariaSnapshot",
            "ArrowDown",
            "reducedMotion",
            "setViewportSize({ width: 390",
            "document.body.style.zoom",
            "assertTableParity",
        },
    )


def validate_package_script() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    script = package.get("scripts", {}).get("validate:patient-home-projection-stack")
    if script != "python3 ./tools/analysis/validate_patient_home_projection_stack.py":
        fail("root package missing validate:patient-home-projection-stack script")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_docs()
    validate_matrix()
    validate_use_window()
    validate_alias()
    validate_atlas()
    validate_tests()
    validate_package_script()
    print("[patient-home-projection-stack] ok")


if __name__ == "__main__":
    main()
