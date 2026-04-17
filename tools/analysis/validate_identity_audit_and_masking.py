#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "identity-audit-and-masking.ts"
MIGRATION = (
    ROOT / "services" / "command-api" / "migrations" / "101_phase2_identity_audit_and_masking.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "identity-audit-and-masking.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "186_identity_audit_and_masking_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "186_identity_event_redaction_masking_and_audit_rules.md"
EVENT_CATALOGUE = ROOT / "data" / "analysis" / "186_identity_event_catalogue.csv"
MASKING_CASES = ROOT / "data" / "analysis" / "186_masking_and_disclosure_cases.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_REPAIR_CLAIM_EVENTS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_ROUTE_LOCAL_MASKING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_OBSERVABILITY_SCRUBBING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_RECONSTRUCTABLE_DECISIONS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_APPEND_ONLY_HISTORY_V1",
}

REQUIRED_EVENTS = {
    "auth.login.started",
    "auth.callback.received",
    "auth.session.created",
    "auth.session.ended",
    "identity.patient.match_attempted",
    "identity.patient.matched",
    "identity.patient.ambiguous",
    "identity.capability.changed",
    "identity.capability.denied",
    "identity.age.restricted",
    "identity.repair_case.opened",
    "identity.repair_case.freeze_committed",
    "identity.repair_release.settled",
    "identity.request.claim.started",
    "identity.request.claim.confirmed",
    "identity.request.ownership.uplifted",
    "identity.pds.enrichment.requested",
    "identity.pds.enrichment.succeeded",
    "identity.pds.change_signal.recorded",
    "access.grant.issued",
    "access.grant.redeemed",
    "access.grant.superseded",
}

SOURCE_MARKERS = {
    "IdentityAuditAndMaskingService",
    "IdentityCanonicalEventEnvelope",
    "IdentityAuditRecord",
    "createIdentityAuditAndMaskingApplication",
    "createIdentityAuditAndMaskingService",
    "createInMemoryIdentityAuditAndMaskingRepository",
    "publishIdentityEvent",
    "redactIdentityPayload",
    "scrubLogRecord",
    "scrubTraceAttributes",
    "scrubMetricLabels",
    "reconstructDecision",
    "effectKeyRef",
    "previousHash",
    "recordHash",
    "duplicate_replayed",
    "q_event_assurance_audit",
    "nhs_number",
    "phone_number",
    "email_address",
    "oauth_token",
    "oidc_claim",
    "jwt_payload",
    "access_grant",
    "evidence_identifier",
    "voice_or_transcript_ref",
}

MIGRATION_MARKERS = {
    "phase2_identity_canonical_event_contracts",
    "phase2_identity_canonical_event_envelopes",
    "phase2_identity_event_outbox_entries",
    "phase2_identity_audit_records",
    "phase2_identity_audit_duplicate_receipts",
    "phase2_identity_masking_policy_rules",
    "phase2_identity_observability_scrub_records",
    "created_by_authority = 'IdentityAuditAndMaskingService'",
    "effect_key_ref",
    "record_hash",
    "previous_hash",
    "immutable = TRUE",
    "q_event_assurance_audit",
}

SERVICE_MARKERS = {
    "identity_audit_event_publish",
    "POST",
    "/identity/audit/events",
    "IdentityCanonicalEventEnvelopeContract",
    "identity_audit_reconstruct_decision",
    "GET",
    "/identity/audit/reconstruct",
    "IdentityAuditDecisionReconstructionContract",
    "identity_audit_masking_preview",
    "/identity/audit/mask",
    "IdentityMaskingPolicyPreviewContract",
}

DOC_MARKERS = {
    "CanonicalEventEnvelope",
    "AuditRecord",
    "IdentityAuditAndMaskingService",
    "append-only",
    "hash-chain",
    "least-necessary",
    "OWASP",
    "NHS numbers",
    "OAuth",
    "OIDC",
    "JWT",
    "access-grant",
}

REQUIRED_CASE_IDS = {
    "IDAUD186_AUTH_CALLBACK_TOKEN_MASKED",
    "IDAUD186_NHS_NUMBER_MASKED_IN_LOGS",
    "IDAUD186_PHONE_AND_EMAIL_MASKED_IN_TRACE",
    "IDAUD186_ACCESS_GRANT_OPAQUE_VALUE_DIGESTED",
    "IDAUD186_REPAIR_LIFECYCLE_RECONSTRUCTABLE",
    "IDAUD186_DUPLICATE_CALLBACK_COLLAPSES",
    "IDAUD186_METRIC_LABELS_MASKED",
    "IDAUD186_PDS_PROVENANCE_WITHOUT_RAW_DEMOGRAPHICS",
}


def fail(message: str) -> None:
    raise SystemExit(f"[identity-audit-and-masking] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def forbid_markers(label: str, text: str, markers: set[str]) -> None:
    present = sorted(marker for marker in markers if marker in text)
    if present:
        fail(f"{label} contains forbidden markers: {', '.join(present)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    for task_id in [
        "par_180",
        "par_181",
        "par_182",
        "par_183",
        "par_184",
        "par_185",
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_186")
    if checklist_state("par_186") not in {"-", "X"}:
        fail("par_186 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | REQUIRED_EVENTS | REQUIRED_GAPS)
    forbid_markers(
        "source",
        source,
        {
            "console.log",
            "rawToken",
            "rawNhsNumber",
            "rawPhoneNumber",
            "localStorage",
            "document.cookie",
            "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT.json",
        },
    )
    if source.count("IdentityCanonicalEventEnvelope") < 5:
        fail("source must centralize publication through canonical event envelopes")
    if source.count("redact") < 8:
        fail("source must centralize redaction and masking")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = read(ARCH_DOC) + "\n" + read(SECURITY_DOC)
    require_markers("docs", combined, DOC_MARKERS | REQUIRED_EVENTS | REQUIRED_GAPS)
    forbid_markers("docs", combined, {"PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT.json"})


def validate_event_catalogue() -> None:
    try:
        rows = list(csv.DictReader(read(EVENT_CATALOGUE).splitlines()))
    except csv.Error as error:
        fail(f"{EVENT_CATALOGUE.relative_to(ROOT)} is invalid CSV: {error}")
    if not rows:
        fail("identity event catalogue is empty")
    event_names = {row.get("event_name") for row in rows}
    missing_events = sorted(REQUIRED_EVENTS - event_names)
    if missing_events:
        fail(f"event catalogue missing events: {', '.join(missing_events)}")
    gap_closures = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gap_closures)
    if missing_gaps:
        fail(f"event catalogue missing gap closures: {', '.join(missing_gaps)}")


def validate_cases() -> None:
    payload = load_json(MASKING_CASES)
    if payload.get("schemaVersion") != "186.phase2.identity-audit.v1":
        fail("cases JSON has wrong schemaVersion")
    if payload.get("policyVersion") != "phase2-identity-redaction-v1":
        fail("cases JSON has wrong policyVersion")
    cases = payload.get("cases")
    if not isinstance(cases, list):
        fail("cases JSON must contain a cases array")
    by_case = {case.get("caseId"): case for case in cases if isinstance(case, dict)}
    missing_cases = sorted(REQUIRED_CASE_IDS - set(by_case))
    if missing_cases:
        fail(f"cases JSON missing cases: {', '.join(missing_cases)}")
    gap_closures = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gap_closures)
    if missing_gaps:
        fail(f"cases JSON missing gap closures: {', '.join(missing_gaps)}")
    joined = json.dumps(payload)
    for marker in [
        "authorization code",
        "raw NHS number",
        "full phone number",
        "raw grant value",
        "duplicate_replayed",
        "raw PDS demographic payload",
    ]:
        if marker not in joined:
            fail(f"cases JSON missing disclosure marker: {marker}")


def validate_tests() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "tests",
        test,
        {
            "IdentityAuditAndMaskingService",
            "canonical identity lifecycle events",
            "CanonicalEventEnvelope",
            "centralizes masking",
            "logs traces and metric labels",
            "duplicate event publication",
            "duplicate receipts",
            "repair lifecycle decisions",
            "PDS provenance",
            "expectNoLeak",
            "fixture-auth-code",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:identity-audit-and-masking")
        != "python3 ./tools/analysis/validate_identity_audit_and_masking.py"
    ):
        fail("package.json missing validate:identity-audit-and-masking script")
    expected_chain = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:audit-worm"
    )
    expected_with_telephony_edge = (
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
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if expected_chain not in scripts.get(name, "") and expected_with_telephony_edge not in scripts.get(
            name,
            "",
        ):
            fail(f"package.json {name} chain missing identity audit validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(
            name,
            "",
        ) and expected_with_telephony_edge not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing identity audit validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:identity-audit-and-masking")
        != "python3 ./tools/analysis/validate_identity_audit_and_masking.py"
    ):
        fail("root_script_updates missing validate:identity-audit-and-masking")


def validate_adjacent_validators() -> None:
    for path in (
        ROOT / "tools" / "analysis" / "validate_authenticated_portal_projections.py",
        ROOT / "tools" / "analysis" / "validate_signed_in_request_ownership.py",
        ROOT / "tools" / "analysis" / "validate_pds_enrichment_flow.py",
        ROOT / "tools" / "analysis" / "validate_identity_repair_chain.py",
        ROOT / "tools" / "analysis" / "validate_access_grant_supersession_workflows.py",
        ROOT / "tools" / "analysis" / "validate_telephony_edge_ingestion.py",
    ):
        if "validate:identity-audit-and-masking" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not accept identity audit validator chain")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; coherent sibling seams were available")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_service_definition()
    validate_docs()
    validate_event_catalogue()
    validate_cases()
    validate_tests()
    validate_scripts()
    validate_adjacent_validators()
    validate_gap_artifact_absent()
    print("[identity-audit-and-masking] validation passed")


if __name__ == "__main__":
    main()
