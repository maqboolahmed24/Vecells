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
SOURCE = ROOT / "services" / "command-api" / "src" / "identity-repair-chain.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "identity-repair-chain.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "097_phase2_identity_repair_chain.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "182_identity_repair_orchestrator_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "182_wrong_patient_freeze_release_and_compensation_controls.md"
STATE_MATRIX = ROOT / "data" / "analysis" / "182_identity_repair_state_matrix.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "182_freeze_release_replay_and_branch_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_SIGNAL_CONVERGENCE_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_FREEZE_FIRST_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_BRANCH_DISPOSITION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_AUTHORITY_CORRECTION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_HOLD_PROJECTION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR_RELEASE_SETTLEMENT_V1",
}

SOURCE_MARKERS = {
    "IdentityRepairOrchestrator",
    "createIdentityRepairOrchestrator",
    "createIdentityRepairOrchestratorService",
    "createIdentityRepairChainApplication",
    "createInMemoryIdentityRepairRepository",
    "IdentityRepairSignalRecord",
    "IdentityRepairCaseRecord",
    "IdentityRepairFreezeRecord",
    "IdentityRepairBranchDispositionRecord",
    "IdentityRepairReleaseSettlement",
    "PatientIdentityHoldProjection",
    "PatientActionRecoveryProjection",
    "SessionGovernorRepairPort",
    "AccessGrantServiceRepairPort",
    "RouteIntentRepairPort",
    "CommunicationFreezePort",
    "ProjectionDegradationPort",
    "IdentityBindingAuthorityRepairPort",
    "issuedFor: \"identity_repair\"",
    "correction_applied",
    "revoked",
    "read_only_resume",
    "claim_pending_resume",
    "writable_resume",
    "manual_follow_up_only",
    "IR_182_WRONG_PATIENT_NOT_REQUEST_STATE",
}

MIGRATION_MARKERS = {
    "phase2_identity_repair_signals",
    "phase2_identity_repair_cases",
    "phase2_identity_repair_freeze_records",
    "phase2_identity_repair_branch_dispositions",
    "phase2_identity_repair_review_approvals",
    "phase2_identity_repair_authority_corrections",
    "phase2_identity_repair_release_settlements",
    "phase2_identity_repair_hold_projections",
    "phase2_identity_repair_events",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "signal_digest TEXT NOT NULL UNIQUE",
    "frozen_identity_binding_ref TEXT NOT NULL",
    "lineage_fence_ref TEXT NOT NULL",
    "issued_for TEXT NOT NULL CHECK (issued_for = 'identity_repair')",
    "session_termination_settlement_refs_json TEXT NOT NULL",
    "access_grant_supersession_refs_json TEXT NOT NULL",
    "superseded_route_intent_binding_refs_json TEXT NOT NULL",
    "communications_hold_state TEXT NOT NULL",
    "projection_hold_state TEXT NOT NULL",
    "supervisor_approval_ref TEXT NOT NULL",
    "independent_review_ref TEXT NOT NULL",
    "binding_authority_settlement_ref TEXT",
    "created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityRepairOrchestrator')",
}

SERVICE_MARKERS = {
    "identity_repair_signal",
    "/identity/repair/signals",
    "IdentityRepairSignalContract",
    "identity_repair_freeze",
    "/identity/repair/freeze",
    "IdentityRepairFreezeRecordContract",
    "identity_repair_branch_disposition",
    "/identity/repair/branches/settle",
    "IdentityRepairBranchDispositionContract",
    "identity_repair_correction",
    "/identity/repair/correction",
    "IdentityRepairAuthorityCorrectionContract",
    "identity_repair_release",
    "/identity/repair/release",
    "IdentityRepairReleaseSettlementContract",
    "identity_repair_hold_projection",
    "/identity/repair/hold",
    "PatientIdentityHoldProjectionContract",
}

DOC_MARKERS = {
    "IdentityRepairOrchestrator",
    "IdentityRepairSignal",
    "IdentityRepairCase",
    "IdentityRepairFreezeRecord",
    "IdentityRepairBranchDisposition",
    "IdentityRepairReleaseSettlement",
    "IdentityBindingAuthority",
    "SessionGovernor",
    "AccessGrantService",
    "RouteIntentBinding",
    "PatientIdentityHoldProjection",
    "PatientActionRecoveryProjection",
    "OWASP",
    "Wrong-patient correction is not a request state",
}

REQUIRED_BRANCH_TYPES = {
    "request_shell",
    "episode_state",
    "conversation_callback",
    "external_message_delivery",
    "file_artifact_visibility",
    "support_workspace_continuity",
    "telephony_continuation",
    "analytics_event_branch",
}

REQUIRED_BRANCH_STATES = {
    "quarantined",
    "compensation_pending",
    "manual_review_only",
    "suppressed",
    "already_safe",
    "rebuild_required",
    "rebuilt",
    "released",
    "compensated",
    "terminal_suppressed",
    "manual_review_closed",
}

REQUIRED_RELEASE_MODES = {
    "read_only_resume",
    "claim_pending_resume",
    "writable_resume",
    "manual_follow_up_only",
}


def fail(message: str) -> None:
    raise SystemExit(f"[identity-repair-chain] {message}")


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
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_182")
    if checklist_state("par_182") not in {"-", "X"}:
        fail("par_182 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("identity repair source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "Request.workflowState",
        "Episode.state =",
        ".patientRef =",
        ".ownershipState =",
        "directPatientMutation",
        "PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_REPAIR.json",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden repair shortcuts: {', '.join(present)}")
    if source.count("IdentityRepairSignalRecord") < 5:
        fail("source must implement durable IdentityRepairSignal records")
    if source.count("IdentityRepairFreezeRecord") < 6:
        fail("source must implement exact-once IdentityRepairFreezeRecord behavior")
    if source.count("IdentityRepairBranchDispositionRecord") < 6:
        fail("source must implement downstream IdentityRepairBranchDisposition behavior")
    if source.count("IdentityBindingAuthority") < 4:
        fail("source must route correction through IdentityBindingAuthority")
    if source.count("AccessGrantService") < 3:
        fail("source must supersede grants through AccessGrantService seam")
    if source.count("SessionGovernor") < 3:
        fail("source must freeze sessions through SessionGovernor seam")
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS | REQUIRED_GAPS)


def validate_state_matrix() -> None:
    rows = load_csv(STATE_MATRIX)
    if not rows:
        fail("identity repair state matrix is empty")
    branch_types = {row.get("branch_type") for row in rows}
    missing_branch_types = sorted(REQUIRED_BRANCH_TYPES - branch_types)
    if missing_branch_types:
        fail(f"state matrix missing branch types: {', '.join(missing_branch_types)}")
    branch_states = {row.get("branch_state") for row in rows}
    missing_branch_states = sorted(REQUIRED_BRANCH_STATES - branch_states)
    if missing_branch_states:
        fail(f"state matrix missing branch states: {', '.join(missing_branch_states)}")
    release_modes = {row.get("release_mode") for row in rows}
    missing_release_modes = sorted(REQUIRED_RELEASE_MODES - release_modes)
    if missing_release_modes:
        fail(f"state matrix missing release modes: {', '.join(missing_release_modes)}")
    gaps = {row.get("gap_closure") for row in rows}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"state matrix missing gap closures: {', '.join(missing_gaps)}")


def validate_replay_cases() -> None:
    data = load_json(REPLAY_CASES)
    cases = data.get("cases")
    if not isinstance(cases, list):
        fail("freeze/release replay cases must contain a cases array")
    by_case = {case.get("caseId"): case for case in cases if isinstance(case, dict)}
    required_case_ids = {
        "IR182_SIGNAL_REPLAY_NO_SECOND_CASE",
        "IR182_ACTIVE_CASE_REUSE_CONFIRMED_DRIFT",
        "IR182_EXACT_ONCE_FREEZE",
        "IR182_HOLD_PROJECTION_NO_STALE_PHI",
        "IR182_BRANCH_COMPENSATION_AND_QUARANTINE",
        "IR182_UNREVIEWED_RELEASE_DENIED",
        "IR182_AUTHORITY_CORRECTION_ONLY",
        "IR182_RELEASE_SETTLEMENT_MODES",
    }
    missing_case_ids = sorted(required_case_ids - set(by_case))
    if missing_case_ids:
        fail(f"freeze/release replay cases missing: {', '.join(missing_case_ids)}")
    gaps = {case.get("gapClosure") for case in cases if isinstance(case, dict)}
    missing_gaps = sorted(REQUIRED_GAPS - gaps)
    if missing_gaps:
        fail(f"freeze/release cases missing gap closures: {', '.join(missing_gaps)}")
    joined = json.dumps(data)
    for branch_type in REQUIRED_BRANCH_TYPES:
        if branch_type not in joined:
            fail(f"freeze/release cases missing branch type: {branch_type}")
    for release_mode in REQUIRED_RELEASE_MODES:
        if release_mode not in joined:
            fail(f"freeze/release cases missing release mode: {release_mode}")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "IdentityRepairOrchestrator",
            "wrong-patient chain",
            "replay without a second case",
            "reuses the active case",
            "commits the freeze exactly once",
            "fences stale sessions, grants, route intents",
            "routes exact replay during active repair",
            "requires review, authority correction, and branch disposition settlement",
            "IdentityBindingAuthority",
            "PatientIdentityHoldProjection",
            "AccessGrantService",
            "SessionGovernor",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    if (
        scripts.get("validate:identity-repair-chain")
        != "python3 ./tools/analysis/validate_identity_repair_chain.py"
    ):
        fail("package.json missing validate:identity-repair-chain script")
    expected = (
        "pnpm validate:access-grant-supersession && "
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:audit-worm"
    )
    expected_with_pds = (
        "pnpm validate:access-grant-supersession && "
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:audit-worm"
    )
    expected_with_pds_and_request_ownership = (
        "pnpm validate:access-grant-supersession && "
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:audit-worm"
    )
    expected_with_pds_request_ownership_and_portal = (
        "pnpm validate:access-grant-supersession && "
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:audit-worm"
    )
    expected_with_pds_request_ownership_portal_and_identity_audit = (
        "pnpm validate:access-grant-supersession && "
        "pnpm validate:identity-repair-chain && "
        "pnpm validate:pds-enrichment-flow && "
        "pnpm validate:signed-in-request-ownership && "
        "pnpm validate:authenticated-portal-projections && "
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:audit-worm"
    )
    expected_with_pds_request_ownership_portal_identity_audit_and_telephony_edge = (
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
    for name in ("bootstrap", "check"):
        if (
            expected not in scripts.get(name, "")
            and expected_with_pds not in scripts.get(name, "")
            and expected_with_pds_and_request_ownership not in scripts.get(name, "")
            and expected_with_pds_request_ownership_and_portal not in scripts.get(name, "")
            and expected_with_pds_request_ownership_portal_and_identity_audit
            not in scripts.get(name, "")
            and expected_with_pds_request_ownership_portal_identity_audit_and_telephony_edge
            not in scripts.get(name, "")
        ):
            fail(f"package.json {name} chain missing identity repair validator")
        if (
            expected not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_pds not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_pds_and_request_ownership not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_pds_request_ownership_and_portal
            not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_pds_request_ownership_portal_and_identity_audit
            not in ROOT_SCRIPT_UPDATES.get(name, "")
            and expected_with_pds_request_ownership_portal_identity_audit_and_telephony_edge
            not in ROOT_SCRIPT_UPDATES.get(name, "")
        ):
            fail(f"root_script_updates {name} chain missing identity repair validator")
    if (
        ROOT_SCRIPT_UPDATES.get("validate:identity-repair-chain")
        != "python3 ./tools/analysis/validate_identity_repair_chain.py"
    ):
        fail("root_script_updates missing validate:identity-repair-chain")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_state_matrix()
    validate_replay_cases()
    validate_tests()
    validate_scripts()
    print("[identity-repair-chain] validation passed")


if __name__ == "__main__":
    main()
