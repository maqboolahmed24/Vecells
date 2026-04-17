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
SOURCE = ROOT / "services" / "command-api" / "src" / "access-grant-supersession.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "access-grant-supersession.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "096_phase2_access_grant_supersession.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "181_claim_redemption_and_access_grant_workflows.md"
SECURITY_DOC = ROOT / "docs" / "security" / "181_access_grant_replay_scope_and_supersession_controls.md"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "181_grant_family_transition_matrix.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "181_claim_replay_and_supersession_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CANONICAL_SERVICE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SCOPE_ENVELOPE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_EXACT_ONCE_REDEMPTION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SUPERSESSION_CHAIN_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_CLAIM_AUTHORITY_HANDOFF_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_ACCESS_GRANT_SESSION_ROTATION_V1",
}

REQUIRED_GRANT_FAMILIES = {
    "draft_resume_minimal",
    "public_status_minimal",
    "claim_step_up",
    "continuation_seeded_verified",
    "continuation_challenge",
    "support_recovery_minimal",
}

REQUIRED_DECISIONS = {
    "issued",
    "redeemed",
    "replayed",
    "recover_only",
    "denied",
    "superseded",
    "revoked",
    "claim_confirmed",
    "step_up_required",
}

SOURCE_MARKERS = {
    "AccessGrantService",
    "createAccessGrantSupersessionApplication",
    "createAccessGrantService",
    "createInMemoryAccessGrantSupersessionRepository",
    "AccessGrantScopeEnvelopeRecord",
    "AccessGrantRedemptionRecord",
    "AccessGrantSupersessionRecord",
    "ClaimRedemptionSettlement",
    "ScopeEnvelopeAuthorizationRecord",
    "IdentityBindingAuthorityClaimPort",
    "SessionGovernorRotationPort",
    "RouteIntentBinding",
    "manual_only",
    "ACCESS_181_MANUAL_ONLY_NOT_REDEEMABLE",
    "ACCESS_181_REDEMPTION_EXACT_ONCE",
    "ACCESS_181_SCOPE_ENVELOPE_IMMUTABLE",
    "ACCESS_181_BINDING_AUTHORITY_CLAIM_CONFIRMED",
    "ACCESS_181_SESSION_ROTATED_AFTER_CLAIM",
    "ACCESS_181_NO_DIRECT_PATIENT_REF_MUTATION",
    "ACCESS_181_CLAIM_REPLAY_RETURNED",
}

MIGRATION_MARKERS = {
    "phase2_access_grant_scope_envelopes",
    "phase2_access_grants",
    "phase2_access_grant_redemptions",
    "phase2_access_grant_supersessions",
    "phase2_claim_redemption_settlements",
    "phase2_secure_link_session_projections",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "token_hash TEXT NOT NULL UNIQUE",
    "grant_scope_envelope_ref TEXT NOT NULL",
    "supersedes_grant_ref TEXT",
    "superseded_by_grant_ref TEXT",
    "binding_authority_settlement_ref TEXT",
    "rotated_session_epoch_ref TEXT",
    "created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'AccessGrantService')",
}

SERVICE_MARKERS = {
    "access_grant_issue",
    "/identity/access-grants/issue",
    "AccessGrantIssueContract",
    "access_grant_redeem",
    "/identity/access-grants/redeem",
    "AccessGrantRedemptionContract",
    "access_grant_supersede",
    "/identity/access-grants/supersede",
    "AccessGrantSupersessionContract",
    "draft_claim_redeem",
    "/v1/drafts/{publicId}/claim",
    "ClaimRedemptionWorkflowContract",
    "secure_link_redeem",
}


def fail(message: str) -> None:
    raise SystemExit(f"[access-grant-supersession] {message}")


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
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_181")
    if checklist_state("par_181") not in {"-", "X"}:
        fail("par_181 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("access grant source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "localStorage",
        "sessionStorage",
        "document.cookie",
        ".patientRef =",
        ".ownershipState =",
        "directOwnershipMutation",
        "rawToken:",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden grant/ownership shortcuts: {', '.join(present)}")
    if source.count("AccessGrantRedemptionRecord") < 5:
        fail("source must implement durable access-grant redemption records")
    if source.count("AccessGrantSupersessionRecord") < 5:
        fail("source must implement durable supersession chains")
    if source.count("IdentityBindingAuthority") < 4:
        fail("source must route claim confirmation through IdentityBindingAuthority")
    if source.count("SessionGovernor") < 3:
        fail("source must route claim session rotation through SessionGovernor")
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "AccessGrantService",
            "AccessGrantScopeEnvelope",
            "AccessGrantRedemptionRecord",
            "AccessGrantSupersessionRecord",
            "IdentityBindingAuthority",
            "SessionGovernor",
            "RouteIntentBinding",
            "CapabilityDecision",
            "manual_only is not a redeemable grant",
            "OWASP",
        }
        | REQUIRED_GAPS,
    )


def validate_transition_matrix() -> None:
    rows = load_csv(TRANSITION_MATRIX)
    if not rows:
        fail("grant family transition matrix is empty")
    families = {row.get("grant_family") for row in rows}
    missing_families = sorted(REQUIRED_GRANT_FAMILIES - families)
    if missing_families:
        fail(f"transition matrix missing grant families: {', '.join(missing_families)}")
    decisions = {row.get("expected_decision") for row in rows}
    missing_decisions = sorted(REQUIRED_DECISIONS - decisions)
    if missing_decisions:
        fail(f"transition matrix missing decisions: {', '.join(missing_decisions)}")
    gaps = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"transition matrix missing gap closures: {', '.join(missing_gaps)}")
    manual_rows = [row for row in rows if row.get("grant_family") == "manual_only"]
    if not manual_rows or manual_rows[0].get("expected_decision") != "denied":
        fail("manual_only must be represented as denied and non-redeemable")


def validate_replay_cases() -> None:
    data = load_json(REPLAY_CASES)
    cases = data.get("cases")
    if not isinstance(cases, list):
        fail("replay cases must contain a cases array")
    by_case = {case.get("caseId"): case for case in cases if isinstance(case, dict)}
    required_case_ids = {
        "ACCESS181_SCOPE_ENVELOPE_IMMUTABLE",
        "ACCESS181_EXACT_ONCE_REDEMPTION",
        "ACCESS181_DUPLICATE_CLICK_REPLAY",
        "ACCESS181_STALE_SCOPE_RECOVERY",
        "ACCESS181_CLAIM_CONFIRMED",
        "ACCESS181_CLAIM_STEP_UP_REQUIRED",
        "ACCESS181_PUBLIC_GRANT_SUPERSEDED_AFTER_CLAIM",
        "ACCESS181_MANUAL_ONLY_DENIED",
    }
    missing = sorted(required_case_ids - set(by_case))
    if missing:
        fail(f"replay cases missing: {', '.join(missing)}")
    decisions = {case.get("decision") for case in cases if isinstance(case, dict)}
    missing_decisions = sorted(REQUIRED_DECISIONS - decisions)
    if missing_decisions:
        fail(f"replay cases missing decisions: {', '.join(missing_decisions)}")
    gaps = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"replay cases missing gap closures: {', '.join(missing_gaps)}")
    if data.get("manualOnlyRule") != "manual_only is not a redeemable grant":
        fail("replay cases must declare manual_only non-redeemable rule")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "createAccessGrantSupersessionApplication",
            "AccessGrantScopeEnvelope",
            "manual_only",
            "duplicate token redemption",
            "same-lineage recovery",
            "IdentityBindingAuthority",
            "SessionGovernor",
            "cross-device replay",
            "step_up_required",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:access-grant-supersession")
        != "python3 ./tools/analysis/validate_access_grant_supersession_workflows.py"
    ):
        fail("package.json missing validate:access-grant-supersession script")
    for name in ("bootstrap", "check"):
        command = scripts.get(name, "")
        expected_without_identity_repair = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair_and_pds = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
            "pnpm validate:pds-enrichment-flow && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair_pds_and_request_ownership = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
            "pnpm validate:pds-enrichment-flow && "
            "pnpm validate:signed-in-request-ownership && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair_pds_request_ownership_and_portal = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
            "pnpm validate:pds-enrichment-flow && "
            "pnpm validate:signed-in-request-ownership && "
            "pnpm validate:authenticated-portal-projections && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair_pds_request_ownership_portal_and_identity_audit = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
            "pnpm validate:pds-enrichment-flow && "
            "pnpm validate:signed-in-request-ownership && "
            "pnpm validate:authenticated-portal-projections && "
            "pnpm validate:identity-audit-and-masking && "
            "pnpm validate:audit-worm"
        )
        expected_with_identity_repair_pds_request_ownership_portal_identity_audit_and_telephony_edge = (
            "pnpm validate:identity-binding-authority && "
            "pnpm validate:capability-decision-engine && "
            "pnpm validate:access-grant-supersession && "
            "pnpm validate:identity-repair-chain && "
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
        if (
            expected_without_identity_repair not in command
            and expected_with_identity_repair not in command
            and expected_with_identity_repair_and_pds not in command
            and expected_with_identity_repair_pds_and_request_ownership not in command
            and expected_with_identity_repair_pds_request_ownership_and_portal not in command
            and expected_with_identity_repair_pds_request_ownership_portal_and_identity_audit
            not in command
            and expected_with_identity_repair_pds_request_ownership_portal_identity_audit_and_telephony_edge
            not in command
        ):
            fail(f"package.json {name} chain missing access-grant supersession validator")
        root_command = ROOT_SCRIPT_UPDATES.get(name, "")
        if (
            expected_without_identity_repair not in root_command
            and expected_with_identity_repair not in root_command
            and expected_with_identity_repair_and_pds not in root_command
            and expected_with_identity_repair_pds_and_request_ownership not in root_command
            and expected_with_identity_repair_pds_request_ownership_and_portal not in root_command
            and expected_with_identity_repair_pds_request_ownership_portal_and_identity_audit
            not in root_command
            and expected_with_identity_repair_pds_request_ownership_portal_identity_audit_and_telephony_edge
            not in root_command
        ):
            fail(f"root_script_updates {name} chain missing access-grant supersession validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:access-grant-supersession")
        != "python3 ./tools/analysis/validate_access_grant_supersession_workflows.py"
    ):
        fail("root_script_updates missing validate:access-grant-supersession")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_transition_matrix()
    validate_replay_cases()
    validate_tests()
    validate_scripts()
    print("[access-grant-supersession] validation passed")


if __name__ == "__main__":
    main()
