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
SOURCE = ROOT / "services" / "command-api" / "src" / "identity-binding-authority.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "identity-binding-authority.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "094_phase2_identity_binding_authority.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "179_identity_binding_authority_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "179_binding_supersession_and_freeze_awareness_rules.md"
TRANSITION_MATRIX = ROOT / "data" / "analysis" / "179_binding_version_transition_matrix.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "179_binding_replay_and_conflict_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_SOLE_AUTHORITY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_APPEND_ONLY_VERSION_CHAIN_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_CURRENT_POINTER_CAS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_DERIVED_PATIENT_REF_TRANSACTION_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_IDEMPOTENT_COMMAND_REPLAY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_FREEZE_AWARE_REFUSAL_V1",
}

SOURCE_MARKERS = {
    "createIdentityBindingAuthorityApplication",
    "createIdentityBindingAuthorityService",
    "createInMemoryIdentityBindingAuthorityRepository",
    "IdentityBindingVersion",
    "IdentityBindingCurrentPointer",
    "BindingCommandSettlement",
    "DerivedPatientRefSettlement",
    "IdentityBindingFreezeHold",
    "IdentityBindingAuthorityAuditRecord",
    "settleIdentityBindingCommand",
    "createFreezeHold",
    "expectedCurrentBindingVersionRef",
    "commitAuthorityTransaction",
    "BINDING_179_AUTHORITY_SOLE_WRITER",
    "BINDING_179_ACCEPTED_APPEND_ONLY",
    "BINDING_179_CURRENT_POINTER_CAS",
    "BINDING_179_DERIVED_PATIENT_REF_ADVANCED",
    "BINDING_179_REPLAY_RETURNED",
    "BINDING_179_STALE_EXPECTED_VERSION",
    "BINDING_179_FREEZE_ACTIVE_REFUSED",
    "BINDING_179_REPAIR_AUTHORITY_RELEASED",
}

MIGRATION_TABLES = {
    "identity_binding_authority_versions",
    "identity_binding_current_pointers",
    "identity_binding_command_settlements",
    "identity_binding_lineage_patient_refs",
    "identity_binding_freeze_holds",
    "identity_binding_authority_audit",
}

MIGRATION_MARKERS = {
    "binding_version_ref TEXT PRIMARY KEY",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "current_binding_version_ref TEXT",
    "pointer_epoch INTEGER NOT NULL",
    "updated_by_authority TEXT NOT NULL",
    "created_by_authority TEXT NOT NULL CHECK (created_by_authority = 'IdentityBindingAuthority')",
}

REQUIRED_INTENTS = {
    "candidate_refresh",
    "provisional_verify",
    "verified_bind",
    "claim_confirmed",
    "correction_applied",
    "revoked",
}

REQUIRED_CASES = {
    "BINDING179_VERIFIED_BIND_ADVANCES_LINEAGE",
    "BINDING179_IDEMPOTENT_REPLAY",
    "BINDING179_STALE_CAS_REJECTED",
    "BINDING179_FREEZE_BLOCKS_ORDINARY",
    "BINDING179_CORRECTION_SUPERSEDES",
    "BINDING179_REVOKE_CLEARS_LINEAGE",
}


def fail(message: str) -> None:
    raise SystemExit(f"[identity-binding-authority] {message}")


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


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


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
    ]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_179")
    if checklist_state("par_179") not in {"-", "X"}:
        fail("par_179 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("identity binding authority source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    for intent in REQUIRED_INTENTS:
        if intent not in source:
            fail(f"source missing intent {intent}")
    forbidden = {
        "console.log(",
        "localStorage",
        "sessionStorage",
        "document.cookie",
        ".patientRef =",
        "directIdentityBindingWrite",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"source contains forbidden binding shortcuts: {', '.join(present)}")
    if source.count("idempotencyKey") < 4:
        fail("source must implement idempotent command settlement")
    if source.count("expectedCurrentBindingVersionRef") < 4:
        fail("source must implement compare-and-set expected version checks")
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "identity_binding_authority_settle",
            "/identity/binding/settle",
            "IdentityBindingAuthorityCommandContract",
            "identity_binding_authority_current",
            "/identity/binding/current",
            "IdentityBindingCurrentPointerContract",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers("migration", migration, MIGRATION_TABLES | MIGRATION_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, SECURITY_DOC])
    require_markers(
        "docs",
        combined,
        {
            "IdentityBindingAuthority",
            "IdentityBindingVersion",
            "IdentityBindingCurrentPointer",
            "BindingCommandSettlement",
            "DerivedPatientRefSettlement",
            "IdentityBindingFreezeHold",
            "append-only",
            "compare-and-set",
            "idempotencyKey",
            "Request.patientRef",
            "Episode.patientRef",
            "IAR_170_ONLY_IDENTITY_BINDING_AUTHORITY_WRITES_BINDING",
            "PLB_170_NO_BINDING_MUTATION",
            "OWASP",
        }
        | REQUIRED_GAPS,
    )


def validate_transition_matrix() -> None:
    rows = load_csv(TRANSITION_MATRIX)
    intents = {row.get("intent_type") for row in rows}
    if not REQUIRED_INTENTS.issubset(intents):
        missing = sorted(REQUIRED_INTENTS - intents)
        fail(f"transition matrix missing intents: {', '.join(missing)}")
    gap_ids = {row.get("gap_id") for row in rows}
    if not REQUIRED_GAPS.issubset(gap_ids):
        missing = sorted(REQUIRED_GAPS - gap_ids)
        fail(f"transition matrix missing gaps: {', '.join(missing)}")
    for row in rows:
        if row.get("authority_decision") in {"accepted", "cas_conflict", "freeze_blocked"} and not row.get("reason_codes"):
            fail(f"transition row {row.get('intent_type')} missing reason_codes")


def validate_replay_cases() -> None:
    payload = load_json(REPLAY_CASES)
    if payload.get("taskId") != "par_179":
        fail("replay casebook taskId must be par_179")
    if payload.get("schemaVersion") != "170.phase2.trust.v1":
        fail("replay casebook must bind task 170 schema")
    gaps = {entry.get("gapId") for entry in payload.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gaps):
        missing = sorted(REQUIRED_GAPS - gaps)
        fail(f"replay casebook missing gaps: {', '.join(missing)}")
    case_ids = {entry.get("caseId") for entry in payload.get("cases", [])}
    if not REQUIRED_CASES.issubset(case_ids):
        missing = sorted(REQUIRED_CASES - case_ids)
        fail(f"replay casebook missing cases: {', '.join(missing)}")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "tests",
        test,
        {
            "settles verified bind as append-only authority",
            "returns idempotent replay",
            "rejects stale compare-and-set commands",
            "applies correction under repair authorization",
            "blocks ordinary commands while a repair freeze is active",
            "revokes the current binding",
            "BINDING_179_DERIVED_PATIENT_REF_ADVANCED",
            "BINDING_179_REPLAY_RETURNED",
            "BINDING_179_FREEZE_ACTIVE_REFUSED",
        },
    )


def validate_root_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_identity_binding_authority.py"
    if scripts.get("validate:identity-binding-authority") != expected:
        fail("package.json missing validate:identity-binding-authority script")
    expected_chain = (
        "pnpm validate:identity-evidence-vault && pnpm validate:patient-linker-pipeline "
        "&& pnpm validate:identity-binding-authority"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} is not wired after patient linker")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(script_name, ""):
            fail(f"root_script_updates {script_name} is not wired after patient linker")
    if ROOT_SCRIPT_UPDATES.get("validate:identity-binding-authority") != expected:
        fail("root_script_updates missing validate:identity-binding-authority")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_transition_matrix()
    validate_replay_cases()
    validate_tests()
    validate_root_script_wiring()
    print("[identity-binding-authority] ok")


if __name__ == "__main__":
    main()
