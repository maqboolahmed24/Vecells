#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


CHECKLIST = ROOT / "prompt" / "checklist.md"
SOURCE = ROOT / "services" / "command-api" / "src" / "signed-in-request-ownership.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "signed-in-request-ownership.integration.test.js"
MIGRATION = (
    ROOT / "services" / "command-api" / "migrations" / "099_phase2_signed_in_request_ownership.sql"
)
ARCH_DOC = (
    ROOT
    / "docs"
    / "architecture"
    / "184_signed_in_request_ownership_and_patient_ref_derivation_design.md"
)
SECURITY_DOC = ROOT / "docs" / "security" / "184_authenticated_ownership_and_patient_ref_controls.md"
STATE_MATRIX = ROOT / "data" / "analysis" / "184_request_identity_state_matrix.csv"
RACE_CASES = (
    ROOT / "data" / "analysis" / "184_signed_in_creation_and_promotion_race_cases.json"
)
ROOT_PACKAGE = ROOT / "package.json"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_ONE_LINEAGE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_AUTHORITY_DERIVED_PATIENT_REF_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_PRE_SUBMIT_CLAIM_CONTINUITY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_POST_SUBMIT_UPLIFT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_RACE_SAFE_MAPPING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_STALE_FENCING_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_SAME_SHELL_RECOVERY_V1",
}

SOURCE_MARKERS = {
    "SignedInRequestOwnershipService",
    "createSignedInRequestOwnershipApplication",
    "createSignedInRequestOwnershipService",
    "createInMemorySignedInRequestOwnershipRepository",
    "RequestLineageOwnershipRecord",
    "SignedInRequestStartRecord",
    "AuthenticatedOwnershipAttachmentRecord",
    "AuthorityPatientRefDerivationSettlement",
    "AuthenticatedUpliftMappingRecord",
    "OwnershipDriftFenceRecord",
    "IdentityBindingAuthorityOwnershipPort",
    "AccessGrantOwnershipPort",
    "SessionGovernorOwnershipPort",
    "RouteIntentOwnershipPort",
    "derivePatientRefsThroughAuthority",
    "claimPreSubmitDraft",
    "upliftPostSubmitRequest",
    "evaluateWritableContinuity",
    "clonedRequestCreated: false",
    "same_draft_shell",
    "same_request_shell",
    "recovery_shell",
    "claim_pending_shell",
    "SRO_184_PRE_SUBMIT_CLAIM_SAME_DRAFT",
    "SRO_184_POST_SUBMIT_UPLIFT_SAME_REQUEST_SHELL",
    "SRO_184_DUPLICATE_PROMOTION_REPLAY_RETURNED",
    "SRO_184_NO_DIRECT_PATIENT_REF_MUTATION",
}

MIGRATION_MARKERS = {
    "phase2_request_lineage_ownership",
    "phase2_signed_in_request_starts",
    "phase2_authenticated_ownership_attachments",
    "phase2_authority_patient_ref_derivation_settlements",
    "phase2_authenticated_uplift_mappings",
    "phase2_ownership_drift_fences",
    "phase2_request_ownership_events",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "draft_public_id TEXT NOT NULL UNIQUE",
    "submission_envelope_ref TEXT NOT NULL",
    "continuity_shell_ref TEXT NOT NULL",
    "continuity_anchor_ref TEXT NOT NULL",
    "request_shell_ref TEXT NOT NULL",
    "request_patient_ref TEXT",
    "episode_patient_ref TEXT",
    "authority_settlement_ref TEXT",
    "subject_binding_version_ref TEXT NOT NULL",
    "session_epoch_ref TEXT NOT NULL",
    "route_intent_binding_ref TEXT NOT NULL",
    "lineage_fence_ref TEXT NOT NULL",
    "patient_ref_derivation_state TEXT NOT NULL",
    "cloned_request_created INTEGER NOT NULL CHECK (cloned_request_created = 0)",
    "created_by_authority TEXT NOT NULL CHECK",
    "SignedInRequestOwnershipService",
}

SERVICE_MARKERS = {
    "signed_in_request_start",
    "/identity/request-ownership/signed-in/start",
    "SignedInRequestStartContract",
    "pre_submit_claim_attach",
    "/identity/request-ownership/pre-submit-claim",
    "PreSubmitClaimOwnershipContract",
    "post_submit_uplift_map",
    "/identity/request-ownership/post-submit-uplift",
    "PostSubmitAuthenticatedUpliftContract",
    "authority_patient_ref_derive",
    "/identity/request-ownership/patient-ref/derive",
    "AuthorityPatientRefDerivationContract",
    "ownership_drift_evaluate",
    "/identity/request-ownership/drift/evaluate",
    "OwnershipDriftFenceContract",
}

DOC_MARKERS = {
    "SignedInRequestOwnershipService",
    "RequestLineageOwnershipRecord",
    "SubmissionEnvelope",
    "draftPublicId",
    "continuityShellRef",
    "continuityAnchorRef",
    "Request.patientRef",
    "Episode.patientRef",
    "IdentityBindingAuthority",
    "AccessGrantService",
    "SessionGovernor",
    "RouteIntentBinding",
    "same_request_shell",
    "recovery_shell",
    "OWASP",
    "second request system",
}

REQUIRED_CASE_IDS = {
    "SRO184_SIGNED_IN_DRAFT_CREATION",
    "SRO184_PRE_SUBMIT_CLAIM_SAME_DRAFT",
    "SRO184_AUTHORITY_DERIVED_PATIENT_REF_ONLY",
    "SRO184_POST_SUBMIT_UPLIFT_EXISTING_SHELL",
    "SRO184_DUPLICATE_PROMOTION_RACE_REPLAY",
    "SRO184_STALE_SESSION_FENCE",
    "SRO184_STALE_BINDING_FENCE",
    "SRO184_SUBJECT_SWITCH_CLAIM_PENDING",
    "SRO184_ROUTE_INTENT_DRIFT_RECOVERY",
    "SRO184_LINEAGE_FENCE_DRIFT_RECOVERY",
}

REQUIRED_DECISIONS = {
    "attached",
    "claimed",
    "uplifted",
    "replayed",
    "recover_only",
    "claim_pending",
}

REQUIRED_DRIFTS = {
    "stale_session",
    "stale_binding",
    "subject_switch",
    "route_intent_tuple_drift",
    "lineage_fence_drift",
}


def fail(message: str) -> None:
    raise SystemExit(f"[signed-in-request-ownership] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    try:
        return list(csv.DictReader(read(path).splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


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
        "seq_170",
        "seq_171",
        "seq_172",
        "seq_173",
        "seq_174",
        "par_175",
        "par_176",
        "par_177",
        "par_178",
        "par_179",
        "par_180",
        "par_181",
        "par_182",
        "par_183",
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_184")
    if checklist_state("par_184") not in {"-", "X"}:
        fail("par_184 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("signed-in ownership source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "Request.patientRef",
        "Episode.patientRef",
        ".patientRef =",
        ".ownershipState =",
        "authenticated_requests",
        "directPatientRefWrite",
        "PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP.json",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden ownership shortcuts: {', '.join(present)}")
    if source.count("IdentityBindingAuthority") < 4:
        fail("source must route patient-ref derivation through IdentityBindingAuthority")
    if source.count("AccessGrant") < 4:
        fail("source must route public-grant supersession through AccessGrantService")
    if source.count("SessionGovernor") < 4:
        fail("source must route writable-scope changes through SessionGovernor")
    if source.count("OwnershipDriftFenceRecord") < 5:
        fail("source must persist stale tuple drift fences")
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS | REQUIRED_GAPS)


def validate_state_matrix() -> None:
    rows = load_csv(STATE_MATRIX)
    if not rows:
        fail("request identity state matrix is empty")
    decisions = {row.get("expected_decision") for row in rows}
    missing_decisions = sorted(REQUIRED_DECISIONS - decisions)
    if missing_decisions:
        fail(f"state matrix missing decisions: {', '.join(missing_decisions)}")
    targets = {row.get("continuity_target") for row in rows}
    for target in ["same_draft_shell", "same_request_shell", "recovery_shell", "claim_pending_shell"]:
        if target not in targets:
            fail(f"state matrix missing continuity target: {target}")
    gaps = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"state matrix missing gap closures: {', '.join(missing_gaps)}")


def validate_race_cases() -> None:
    data = load_json(RACE_CASES)
    cases = data.get("cases")
    if not isinstance(cases, list):
        fail("race cases must contain a cases array")
    by_case = {case.get("caseId"): case for case in cases if isinstance(case, dict)}
    missing_case_ids = sorted(REQUIRED_CASE_IDS - set(by_case))
    if missing_case_ids:
        fail(f"race cases missing: {', '.join(missing_case_ids)}")
    gaps = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"race cases missing gap closures: {', '.join(missing_gaps)}")
    decisions = {case.get("expectedDecision") for case in cases if isinstance(case, dict)}
    missing_decisions = sorted(REQUIRED_DECISIONS - decisions)
    if missing_decisions:
        fail(f"race cases missing decisions: {', '.join(missing_decisions)}")
    drifts = {case.get("driftType") for case in cases if isinstance(case, dict)}
    missing_drifts = sorted(REQUIRED_DRIFTS - drifts)
    if missing_drifts:
        fail(f"race cases missing drift types: {', '.join(missing_drifts)}")
    joined = json.dumps(data)
    for marker in [
        "draftPublicId",
        "submissionEnvelopeRef",
        "continuityShellRef",
        "continuityAnchorRef",
        "IdentityBindingAuthority_settle_ownership",
        "AccessGrantService_supersede_public",
        "SessionGovernor_rotate_for_writable_scope",
        "clonedRequestCreated",
        "genericHomeRedirect",
    ]:
        if marker not in joined:
            fail(f"race cases missing marker: {marker}")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "SignedInRequestOwnershipService",
            "creates a signed-in draft",
            "claims a pre-submit public draft",
            "uplifts a post-submit request",
            "duplicate promotion races",
            "stale session",
            "stale binding",
            "subject switches",
            "route-intent",
            "lineage-fence",
            "IdentityBindingAuthority",
            "AccessGrantService",
            "SessionGovernor",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:signed-in-request-ownership")
        != "python3 ./tools/analysis/validate_signed_in_request_ownership.py"
    ):
        fail("package.json missing validate:signed-in-request-ownership script")
    expected = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:audit-worm"
    )
    expected_with_authenticated_portal = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:audit-worm"
    )
    expected_with_authenticated_portal_and_identity_audit = (
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:audit-worm"
    )
    expected_with_authenticated_portal_identity_audit_and_telephony_edge = (
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
        if (
            expected not in scripts.get(name, "")
            and expected_with_authenticated_portal not in scripts.get(name, "")
            and expected_with_authenticated_portal_and_identity_audit not in scripts.get(name, "")
            and expected_with_authenticated_portal_identity_audit_and_telephony_edge
            not in scripts.get(name, "")
        ):
            fail(f"package.json {name} chain missing signed-in ownership validator")
        if (
            expected not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_authenticated_portal not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_authenticated_portal_and_identity_audit
            not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_authenticated_portal_identity_audit_and_telephony_edge
            not in ROOT_SCRIPT_UPDATES.get(name, "")
        ):
            fail(f"root_script_updates {name} chain missing signed-in ownership validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:signed-in-request-ownership")
        != "python3 ./tools/analysis/validate_signed_in_request_ownership.py"
    ):
        fail("root_script_updates missing validate:signed-in-request-ownership")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; consume the coherent sibling seams instead")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_state_matrix()
    validate_race_cases()
    validate_tests()
    validate_scripts()
    validate_gap_artifact_absent()
    print("[signed-in-request-ownership] validation passed")


if __name__ == "__main__":
    main()
