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
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "more-info-callback-contact-repair-projection-stack.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "212_more_info_callback_and_contact_repair_projection_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "212_more_info_callback_and_contact_repair_controls.md"
HTML_ATLAS = ROOT / "docs" / "frontend" / "212_more_info_callback_repair_state_atlas.html"
MERMAID = ROOT / "docs" / "frontend" / "212_more_info_callback_repair_shell_transitions.mmd"
CONTRACT = ROOT / "data" / "contracts" / "212_more_info_callback_contact_repair_contract.json"
MATRIX = ROOT / "data" / "analysis" / "212_more_info_cycle_callback_repair_matrix.csv"
ALIAS = ROOT / "data" / "analysis" / "212_more_info_thread_alias_resolution.json"
CASES = ROOT / "data" / "analysis" / "212_callback_repair_blocker_cases.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "212_more_info_callback_repair_atlas.spec.js"

TASK = "par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections"

REQUIRED_PROJECTIONS = {
    "PatientMoreInfoStatusProjection",
    "PatientMoreInfoResponseThreadProjection",
    "PatientCallbackStatusProjection",
    "PatientReachabilitySummaryProjection",
    "PatientContactRepairProjection",
    "PatientConsentCheckpointProjection",
}

REQUIRED_ROUTES = {
    "patient_portal_request_more_info",
    "patient_portal_request_more_info_thread",
    "patient_portal_message_callback_status",
    "patient_portal_contact_repair_current",
    "/v1/me/requests/{requestRef}/more-info",
    "/v1/me/requests/{requestRef}/more-info/thread",
    "/v1/me/messages/{clusterId}/callback/{callbackCaseId}",
    "/v1/me/contact-repair/{repairCaseId}",
}

REQUIRED_REGIONS = {
    "Response_Continuity_Atlas",
    "StateGallery",
    "ThreadAnatomyBoard",
    "BlockerDominanceMatrix",
    "RequestShellChildRouteDiagram",
    "MessageShellCallbackRepairDiagram",
    "ContinuityEvidenceShelf",
}

REQUIRED_SCREENSHOTS = {
    "212-active-reply-needed.png",
    "212-reply-submitted-awaiting-review.png",
    "212-late-review.png",
    "212-expired-cycle-recovery.png",
    "212-callback-expected.png",
    "212-callback-window-at-risk.png",
    "212-callback-completed.png",
    "212-repair-required.png",
    "212-consent-checkpoint-required.png",
    "212-public-safe-placeholder.png",
    "212-reduced-motion.png",
    "212-mobile-public-safe-placeholder.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[more-info-callback-contact-repair-stack] {message}")


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
    if "- [X] par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections" not in checklist:
        fail("task 211 prerequisite is not complete")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 212 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | {
            "MoreInfoChildRouteResolver",
            "CallbackAndRepairStatusAssembler",
            "buildMoreInfoCallbackRepairFamily",
            "buildMoreInfoStatusProjection",
            "buildMoreInfoResponseThreadProjection",
            "buildCallbackStatusProjection",
            "buildReachabilitySummaryProjection",
            "buildContactRepairProjection",
            "buildConsentCheckpointProjection",
            "secureLinkGrantRef",
            "answerabilityState",
            "routeRepairRequiredState",
            "renew_consent",
        },
    )
    for forbidden in ("Date.now()", "window.localStorage", "document.cookie", "secureLinkTtlAsCycleExpiry"):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers("service definition", service_definition, REQUIRED_ROUTES | REQUIRED_PROJECTIONS)


def validate_docs() -> None:
    combined = read(ARCH_DOC) + "\n" + read(SECURITY_DOC) + "\n" + read(MERMAID)
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_ROUTES
        | {
            "CallbackExpectationEnvelope",
            "CallbackOutcomeEvidenceBundle",
            "CallbackResolutionGate",
            "secure-link expiry",
            "Public-safe",
            "same-shell",
            "GOV.UK",
            "NHS service manual",
            "Playwright",
            "OWASP",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    require_markers("contract", json.dumps(contract), REQUIRED_PROJECTIONS | REQUIRED_ROUTES)
    for forbidden in (
        "secure_link_ttl_as_cycle_expiry",
        "browser_timer_as_callback_truth",
        "route_local_prompt_stack",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden source {forbidden}")

    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 10:
        fail("matrix needs at least ten rows")
    states = {row["more_info_state"] for row in rows}
    for state in {
        "reply_needed",
        "reply_submitted",
        "accepted_late_review",
        "expired",
        "awaiting_review",
        "read_only",
    }:
        if state not in states:
            fail(f"matrix missing state {state}")
    actions = {row["dominant_action"] for row in rows}
    for action in {"respond_more_info", "contact_route_repair", "renew_consent", "recover_session"}:
        if action not in actions:
            fail(f"matrix missing action {action}")
    regions = {row["atlas_region"] for row in rows}
    if not (REQUIRED_REGIONS - {"Response_Continuity_Atlas"}) <= regions:
        fail("matrix missing atlas regions")

    alias = json.loads(read(ALIAS))
    if alias.get("taskId") != TASK:
        fail("alias taskId drifted")
    require_markers(
        "alias",
        json.dumps(alias),
        {
            "PatientMoreInfoResponseThreadProjection",
            "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT",
            "frontend-local prompt stack",
        },
    )

    cases = json.loads(read(CASES))
    if cases.get("visualMode") != "Response_Continuity_Atlas":
        fail("cases visual mode drifted")
    require_markers(
        "cases",
        json.dumps(cases),
        REQUIRED_PROJECTIONS
        | {
            "stale_secure_link_but_live_cycle",
            "callback_evidence_closed",
            "reachability_blocks_reply",
            "consent_checkpoint_blocks_reply",
            "public_safe_placeholder",
        },
    )


def validate_atlas_and_tests() -> None:
    html = read(HTML_ATLAS)
    require_markers(
        "atlas",
        html,
        REQUIRED_REGIONS
        | REQUIRED_PROJECTIONS
        | {
            "Response_Continuity_Atlas",
            "active-reply-needed",
            "reply-submitted-awaiting-review",
            "late-review",
            "expired-cycle-recovery",
            "callback-expected",
            "callback-window-at-risk",
            "callback-completed",
            "repair-required",
            "consent-checkpoint-required",
            "public-safe-placeholder",
            "window.__responseContinuityAtlasData",
            "prefers-reduced-motion",
        },
    )
    backend = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        backend,
        REQUIRED_PROJECTIONS
        | {
            "secure_link_212_expired",
            "blocked_by_repair",
            "blocked_by_consent",
            "public_safe_placeholder",
            "CallbackExpectationEnvelope",
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
            "ArrowRight",
            "reducedMotion",
            "setViewportSize({ width: 390",
            "assertAccessibilityStructure",
            "assertDataParity",
        },
    )


def validate_package_script() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    script = package.get("scripts", {}).get("validate:more-info-callback-contact-repair-stack")
    if script != "python3 ./tools/analysis/validate_more_info_callback_contact_repair_stack.py":
        fail("root package missing validate:more-info-callback-contact-repair-stack script")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_docs()
    validate_contract_and_analysis()
    validate_atlas_and_tests()
    validate_package_script()
    print("[more-info-callback-contact-repair-stack] ok")


if __name__ == "__main__":
    main()
