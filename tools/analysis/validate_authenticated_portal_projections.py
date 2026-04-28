#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "authenticated-portal-projections.ts"
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "100_phase2_authenticated_portal_projections.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "authenticated-portal-projections.integration.test.js"
)
ARCH_DOC = (
    ROOT
    / "docs"
    / "architecture"
    / "185_authenticated_portal_projection_and_status_access_controls.md"
)
SECURITY_DOC = (
    ROOT / "docs" / "security" / "185_audience_coverage_and_portal_visibility_controls.md"
)
HTML_ATLAS = ROOT / "docs" / "frontend" / "185_authenticated_portal_state_atlas.html"
MATRIX = ROOT / "data" / "analysis" / "185_portal_projection_matrix.csv"
CASES = ROOT / "data" / "analysis" / "185_status_visibility_recovery_and_hold_cases.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "185_authenticated_portal_state_atlas.spec.js"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL.json"

REQUIRED_PROJECTIONS = {
    "PatientAudienceCoverageProjection",
    "PatientPortalEntryProjection",
    "PatientHomeProjection",
    "PatientRequestsIndexProjection",
    "PatientRequestLineageProjection",
    "PatientRequestDetailProjection",
    "PatientCommunicationVisibilityProjection",
    "PatientActionRecoveryProjection",
    "PatientIdentityHoldProjection",
    "PatientSecureLinkSessionProjection",
}

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_CONTROLLER_LOCAL_TRIMMING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_AUTHENTICATED_NOT_EVERYTHING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_SAME_SHELL_RECOVERY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_STABLE_PROJECTION_VOCABULARY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_LIST_DETAIL_COVERAGE_PARITY_V1",
}

REQUIRED_CASES = {
    "PORTAL185_COVERAGE_FIRST_ENTRY",
    "PORTAL185_LIST_VISIBILITY_PUBLIC_MINIMAL",
    "PORTAL185_DETAIL_FULL_AUTHENTICATED",
    "PORTAL185_DETAIL_SUMMARY_ONLY_TRUST_REDUCED",
    "PORTAL185_COMMAND_PENDING_PLACEHOLDER",
    "PORTAL185_STALE_SESSION_RECOVERY",
    "PORTAL185_STALE_BINDING_RECOVERY",
    "PORTAL185_ROUTE_INTENT_DRIFT_RECOVERY",
    "PORTAL185_LINEAGE_FENCE_DRIFT_RECOVERY",
    "PORTAL185_IDENTITY_HOLD_REPLACES_DETAIL",
    "PORTAL185_LIST_DETAIL_PARITY",
}


def fail(message: str) -> None:
    raise SystemExit(f"[authenticated-portal-projections] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def forbid_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker in text:
            fail(f"{label} contains forbidden marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task in (
        "par_181_phase2_track_identity_build_request_claim_redemption_and_access_grant_supersession_workflows",
        "par_182_phase2_track_identity_build_wrong_patient_identity_repair_signal_freeze_and_release_chain",
        "par_183_phase2_track_identity_build_optional_pds_adapter_and_feature_flagged_enrichment_flow",
        "par_184_phase2_track_identity_build_signed_in_request_ownership_and_patient_ref_derivation_rules",
    ):
        if f"- [X] {task}" not in checklist:
            fail(f"checklist prerequisite not complete: {task}")
    if (
        "- [-] par_185_phase2_track_identity_build_authenticated_portal_projection_and_status_access_controls"
        not in checklist
        and "- [X] par_185_phase2_track_identity_build_authenticated_portal_projection_and_status_access_controls"
        not in checklist
    ):
        fail("checklist does not show par_185 as claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_PROJECTIONS
        | REQUIRED_GAPS
        | {
            "AuthenticatedPortalProjectionService",
            "AUTHENTICATED_PORTAL_PROJECTION_SERVICE_NAME",
            "createAuthenticatedPortalProjectionApplication",
            "createAuthenticatedPortalProjectionService",
            "createInMemoryAuthenticatedPortalProjectionRepository",
            "RequestOwnershipPortalPort",
            "buildPatientAudienceCoverageProjection",
            "resolvePortalEntry",
            "listPatientRequests",
            "getPatientRequestDetail",
            "coverageProjectionRef",
            "createdByAuthority",
            "PORTAL_185_COVERAGE_FIRST",
            "PORTAL_185_AUTHENTICATED_SUMMARY_ALLOWED",
            "PORTAL_185_DETAIL_FULL_ALLOWED",
            "PORTAL_185_DETAIL_SUMMARY_ONLY",
            "PORTAL_185_COMMAND_PENDING_CONSISTENCY",
            "PORTAL_185_SAME_SHELL_RECOVERY",
            "PORTAL_185_IDENTITY_HOLD",
            "PORTAL_185_STALE_SESSION_RECOVERY",
            "PORTAL_185_STALE_BINDING_RECOVERY",
            "PORTAL_185_ROUTE_INTENT_DRIFT_RECOVERY",
            "PORTAL_185_LINEAGE_FENCE_DRIFT_RECOVERY",
            "PORTAL_185_LIST_DETAIL_COVERAGE_PARITY",
            "PORTAL_185_NO_CONTROLLER_LOCAL_TRIMMING",
        },
    )
    forbid_markers(
        "source",
        source,
        {
            "controllerLocalTrim",
            "broadFetchThenTrim",
            "rawNhsNumber",
            "rawPhoneNumber",
            "rawOidcClaims",
            "rawToken",
            "document.cookie",
            "localStorage",
            "PARALLEL_INTERFACE_GAP_PHASE2_PORTAL.json",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers(
        "migration",
        migration,
        {
            "phase2_patient_audience_coverage_projections",
            "phase2_patient_portal_entry_projections",
            "phase2_patient_home_projections",
            "phase2_patient_requests_index_projections",
            "phase2_patient_request_detail_projections",
            "phase2_patient_communication_visibility_projections",
            "phase2_patient_action_recovery_projections",
            "phase2_patient_identity_hold_projections",
            "phase2_patient_secure_link_session_projections",
            "phase2_patient_portal_projection_events",
            "created_by_authority = 'AuthenticatedPortalProjectionService'",
            "coverage_projection_ref",
            "patient_shell_consistency_ref",
            "route_tuple_hash",
        },
    )


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "patient_portal_entry_current",
            "patient_portal_requests_index",
            "patient_portal_request_detail",
            "patient_portal_recovery_current",
            "patient_portal_identity_hold_current",
            "GET",
            "/v1/me",
            "/v1/me/requests",
            "/v1/me/requests/{requestRef}",
            "/v1/me/recovery/current",
            "/v1/me/identity-hold",
            "PatientPortalEntryProjectionContract",
            "PatientRequestsIndexProjectionContract",
            "PatientRequestDetailProjectionContract",
            "PatientActionRecoveryProjectionContract",
            "PatientIdentityHoldProjectionContract",
        },
    )


def validate_docs() -> None:
    architecture = read(ARCH_DOC)
    security = read(SECURITY_DOC)
    combined = architecture + "\n" + security
    require_markers(
        "docs",
        combined,
        REQUIRED_PROJECTIONS
        | REQUIRED_GAPS
        | {
            "GET /v1/me",
            "GET /v1/me/requests",
            "GET /v1/me/requests/{requestRef}",
            "GET /v1/me/recovery/current",
            "GET /v1/me/identity-hold",
            "projection-first",
            "same-shell recovery",
            "identity hold",
            "minimum necessary",
            "OWASP",
        },
    )


def validate_matrix() -> None:
    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        fail("portal projection matrix is empty")
    projection_families = {row["projection_family"] for row in rows}
    for projection in REQUIRED_PROJECTIONS - {"PatientRequestLineageProjection", "PatientSecureLinkSessionProjection"}:
        if projection not in projection_families:
            fail(f"matrix missing projection family: {projection}")
    surface_states = {row["surface_state"] for row in rows}
    for surface_state in {"ready", "read_only", "summary_only", "pending_confirmation", "recovery_required", "identity_hold"}:
        if surface_state not in surface_states:
            fail(f"matrix missing surface state: {surface_state}")
    gap_closures = {row["gap_closure"] for row in rows}
    missing_gaps = REQUIRED_GAPS - gap_closures
    if missing_gaps:
        fail(f"matrix missing gap closures: {sorted(missing_gaps)}")


def validate_cases() -> None:
    payload = json.loads(read(CASES))
    if payload.get("schemaVersion") != "185.phase2.portal-projections.v1":
        fail("cases JSON has wrong schemaVersion")
    cases = payload.get("cases", [])
    case_ids = {case.get("caseId") for case in cases}
    missing_cases = REQUIRED_CASES - case_ids
    if missing_cases:
        fail(f"cases JSON missing cases: {sorted(missing_cases)}")
    gap_closures = {case.get("gapClosure") for case in cases}
    missing_gaps = REQUIRED_GAPS - gap_closures
    if missing_gaps:
        fail(f"cases JSON missing gap closures: {sorted(missing_gaps)}")
    for case in cases:
        if case.get("querySurface", "").startswith("GET /v1/me") is False:
            fail(f"case {case.get('caseId')} is not tied to an authenticated portal query")


def validate_html_atlas() -> None:
    html = read(HTML_ATLAS)
    require_markers(
        "html atlas",
        html,
        REQUIRED_PROJECTIONS
        | REQUIRED_GAPS
        | {
            'id="portal-state-atlas"',
            'data-testid="Portal_State_Atlas"',
            'data-testid="atlas-masthead"',
            'data-testid="state-title"',
            'data-testid="route-tuple-chip"',
            'data-testid="audience-badge"',
            'data-testid="trust-badge"',
            'data-testid="freshness-badge"',
            'data-testid="state-rail"',
            "state-rail-item-entry-authenticated",
            "state-rail-item-home-pending",
            "state-rail-item-requests-index",
            "state-rail-item-detail-full",
            "state-rail-item-detail-summary",
            "state-rail-item-recovery-stale-session",
            "state-rail-item-recovery-route-drift",
            "state-rail-item-identity-hold",
            'data-testid="main-state-canvas"',
            'data-testid="coverage-ribbon"',
            'data-testid="page-mock-frame"',
            'data-testid="transition-strip"',
            'data-testid="inspector-panel"',
            'data-testid="projection-ref-card"',
            'data-testid="visible-fields-card"',
            'data-testid="blocked-fields-card"',
            'data-testid="recovery-reason-card"',
            'data-testid="route-dependencies-card"',
            'data-testid="projection-inputs-table"',
            'data-testid="expected-ui-table"',
            'data-testid="downgrade-triggers-table"',
            'data-testid="visible-fields-list"',
            'data-testid="blocked-fields-list"',
            "--masthead-height: 72px",
            "--rail-width: 280px",
            "--inspector-width: 404px",
            "width: min(100%, 1600px)",
            "min-height: 720px",
            "@media (prefers-reduced-motion: reduce)",
            "entry-authenticated",
            "home-pending",
            "requests-index",
            "detail-full",
            "detail-summary",
            "recovery-stale-session",
            "recovery-route-drift",
            "identity-hold",
            "PORTAL_185_SAME_SHELL_RECOVERY",
            "PORTAL_185_IDENTITY_HOLD",
            "PORTAL_185_LIST_DETAIL_COVERAGE_PARITY",
        },
    )
    forbid_markers("html atlas", html, {"Math.random", "Date.now()", "localStorage", "document.cookie"})


def validate_tests() -> None:
    backend = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        backend,
        {
            "AuthenticatedPortalProjectionService",
            "computes coverage before portal entry",
            "list visibility",
            "detail and communication visibility",
            "stale session",
            "stale binding",
            "identity hold",
            "pending consistency",
            "command-following freshness",
            "controller-local trimming",
        },
    )
    playwright = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        playwright,
        {
            "authenticatedPortalStateAtlasCoverage",
            "Portal_State_Atlas",
            "projection state switching",
            "recovery replaces detail",
            "identity hold suppresses PHI",
            "keyboard state rail traversal",
            "reducedMotion",
            "page.screenshot",
            "ArrowDown",
            "threadBodies",
            "requestDetailProjection",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:authenticated-portal-projections")
        != "python3 ./tools/analysis/validate_authenticated_portal_projections.py"
    ):
        fail("package.json missing validate:authenticated-portal-projections script")
    expected_chain = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:audit-worm"
    )
    expected_with_identity_audit = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:audit-worm"
    )
    expected_with_identity_audit_and_telephony_edge = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
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
    expected_with_identity_audit_telephony_edge_and_exit_gate = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
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
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if expected_chain not in scripts.get(name, "") and expected_with_identity_audit not in scripts.get(
            name,
            "",
        ) and expected_with_identity_audit_and_telephony_edge not in scripts.get(
            name,
            "",
        ) and expected_with_identity_audit_telephony_edge_and_exit_gate not in scripts.get(name, ""):
            fail(f"package.json {name} chain missing authenticated portal validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(
            name,
            "",
        ) and expected_with_identity_audit not in ROOT_SCRIPT_UPDATES.get(
            name,
            "",
        ) and expected_with_identity_audit_and_telephony_edge not in ROOT_SCRIPT_UPDATES.get(
            name,
            "",
        ) and expected_with_identity_audit_telephony_edge_and_exit_gate not in ROOT_SCRIPT_UPDATES.get(
            name,
            "",
        ):
            fail(f"root_script_updates {name} chain missing authenticated portal validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:authenticated-portal-projections")
        != "python3 ./tools/analysis/validate_authenticated_portal_projections.py"
    ):
        fail("root_script_updates missing validate:authenticated-portal-projections")


def validate_adjacent_validators() -> None:
    for path in (
        ROOT / "tools" / "analysis" / "validate_signed_in_request_ownership.py",
        ROOT / "tools" / "analysis" / "validate_pds_enrichment_flow.py",
        ROOT / "tools" / "analysis" / "validate_identity_repair_chain.py",
        ROOT / "tools" / "analysis" / "validate_access_grant_supersession_workflows.py",
        ROOT / "tools" / "analysis" / "validate_identity_audit_and_masking.py",
    ):
        text = read(path)
        if "validate:authenticated-portal-projections" not in text:
            fail(f"{path.relative_to(ROOT)} does not accept authenticated portal validator chain")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; coherent sibling seams were available")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_service_definition()
    validate_docs()
    validate_matrix()
    validate_cases()
    validate_html_atlas()
    validate_tests()
    validate_scripts()
    validate_adjacent_validators()
    validate_gap_artifact_absent()
    print("[authenticated-portal-projections] validation passed")


if __name__ == "__main__":
    main()
