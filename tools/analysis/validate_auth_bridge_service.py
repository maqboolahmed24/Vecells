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
SOURCE = ROOT / "services" / "command-api" / "src" / "auth-bridge.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST = ROOT / "services" / "command-api" / "tests" / "auth-bridge.integration.test.js"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "090_phase2_auth_bridge.sql"
ARCH_DOC = ROOT / "docs" / "architecture" / "175_auth_bridge_service_design.md"
API_DOC = ROOT / "docs" / "api" / "175_authorize_and_callback_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "175_auth_bridge_replay_redirect_and_token_validation_rules.md"
MATRIX = ROOT / "data" / "analysis" / "175_callback_state_matrix.csv"
CASES = ROOT / "data" / "analysis" / "175_auth_replay_and_recovery_cases.json"
ROOT_PACKAGE = ROOT / "package.json"

EXPECTED_OUTCOMES = {
    "success",
    "consent_declined",
    "insufficient_assurance",
    "expired_transaction",
    "replayed_callback",
    "token_validation_failure",
    "linkage_unavailable",
    "internal_fallback",
}

REQUIRED_GAPS = {
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_BRIDGE_ISOLATED_OIDC_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_TRANSACTION_FENCE_CAS_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_RETURN_INTENT_ONLY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_SESSION_GOVERNOR_PORT_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_EVIDENCE_VAULT_ONLY_V1",
    "PARALLEL_INTERFACE_GAP_PHASE2_AUTH_REPLAY_EXACT_ONCE_V1",
}

SOURCE_MARKERS = {
    "createAuthBridgeApplication",
    "createAuthBridgeService",
    "createInMemoryAuthBridgeRepository",
    "createSimulatorNhsLoginOidcAdapter",
    "compareAndSetTransaction",
    "IdentityEvidenceVaultPort",
    "SessionGovernorPort",
    "IdentityBindingAuthorityPort",
    "CapabilityDecisionPort",
    "NhsLoginOidcAdapter",
    "AuthTransaction",
    "AuthScopeBundle",
    "PostAuthReturnIntent",
    "AuthCallbackSettlement",
    "server_authorization_code_pkce",
    "vault_reference_only",
    "route_intent_binding_only",
    "offline_access_forbidden",
    "AUTH_CALLBACK_REDIRECT_URI_MISMATCH",
    "AUTH_CALLBACK_REPLAYED",
    "AUTH_BRIDGE_JWKS_SIGNATURE_VALIDATION_FAILED",
    "AUTH_BRIDGE_NONCE_MISMATCH",
}

DOC_MARKERS = {
    "AuthTransaction",
    "AuthScopeBundle",
    "PostAuthReturnIntent",
    "IdentityEvidenceVaultPort",
    "SessionGovernorPort",
    "route_intent_binding_only",
    "vault_reference_only",
    "replayed_callback",
    "RFC 9700",
    "OWASP",
    "NHS login",
}

MIGRATION_TABLES = {
    "auth_scope_bundles",
    "post_auth_return_intents",
    "auth_transactions",
    "auth_callback_settlements",
    "auth_provider_token_exchanges",
}


def fail(message: str) -> None:
    raise SystemExit(f"[auth-bridge-service] {message}")


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
    for task_id in ["seq_170", "seq_171", "seq_172", "seq_173", "seq_174"]:
        if checklist_state(task_id) != "X":
            fail(f"{task_id} must be complete before par_175")
    if checklist_state("par_175") not in {"-", "X"}:
        fail("par_175 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("auth bridge source", source, SOURCE_MARKERS | REQUIRED_GAPS)
    forbidden = {
        "console.log(",
        "returnUrl",
        ".patientRef",
        "Episode.patientRef",
        "Request.patientRef",
        "createSession(",
        "sessionStore.set(",
    }
    present = sorted(term for term in forbidden if term in source)
    if present:
        fail(f"auth bridge source contains forbidden direct side effects: {', '.join(present)}")
    if source.count("writeAuthClaimSnapshot") < 2:
        fail("source must expose and call the evidence vault write port")
    if source.count("settleSessionEstablishment") < 2:
        fail("source must expose and call the session governor port")
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        {
            "auth_bridge_authorize",
            "/identity/auth/nhs/authorize",
            "AuthBridgeAuthorizeContract",
            "auth_bridge_callback",
            "/identity/auth/nhs/callback",
            "AuthBridgeCallbackContract",
        },
    )


def validate_migration() -> None:
    migration = read(MIGRATION)
    require_markers("migration", migration, MIGRATION_TABLES)
    require_markers(
        "migration",
        migration,
        {
            "state_digest TEXT NOT NULL UNIQUE",
            "version INTEGER NOT NULL",
            "consumption_state TEXT NOT NULL",
            "raw_claim_storage_rule TEXT NOT NULL CHECK",
            "redirect_mode TEXT NOT NULL CHECK",
            "idx_auth_transactions_callback_fence",
        },
    )


def validate_docs() -> None:
    for label, path in {
        "architecture doc": ARCH_DOC,
        "api doc": API_DOC,
        "security doc": SECURITY_DOC,
    }.items():
        text = read(path)
        require_markers(label, text, DOC_MARKERS)
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, REQUIRED_GAPS)
    if "returnUrl" in combined:
        fail("docs must not define an arbitrary returnUrl callback target")


def validate_matrix() -> None:
    rows = load_csv(MATRIX)
    if len(rows) < 8:
        fail("callback state matrix must enumerate all canonical callback outcomes")
    outcomes = {row.get("callback_outcome", "") for row in rows}
    if not EXPECTED_OUTCOMES.issubset(outcomes):
        missing = sorted(EXPECTED_OUTCOMES - outcomes)
        fail(f"callback state matrix missing outcomes: {', '.join(missing)}")
    for row in rows:
        if row.get("return_intent_disposition") != "route_intent_binding_only":
            fail(f"{row.get('case_id')} must use route_intent_binding_only")
        for field in [
            "evidence_vault_write",
            "binding_intent_write",
            "capability_intent_write",
            "session_governor_call",
            "replay_safe",
        ]:
            if row.get(field) not in {"true", "false"}:
                fail(f"{row.get('case_id')} has invalid boolean field {field}")
    replay_rows = [row for row in rows if row.get("callback_outcome") == "replayed_callback"]
    if not replay_rows:
        fail("matrix must include replayed_callback rows")
    if any(row.get("evidence_vault_write") != "false" for row in replay_rows):
        fail("replay rows must not write evidence")


def validate_cases() -> None:
    payload = load_json(CASES)
    if payload.get("taskId") != "par_175":
        fail("replay and recovery casebook taskId must be par_175")
    gaps = {entry.get("gapId") for entry in payload.get("parallelInterfaceGaps", [])}
    if not REQUIRED_GAPS.issubset(gaps):
        missing = sorted(REQUIRED_GAPS - gaps)
        fail(f"casebook missing gap closures: {', '.join(missing)}")
    cases = payload.get("cases", [])
    required_cases = {
        "AUTH175_SUCCESS_EXACT_ONCE",
        "AUTH175_DUPLICATE_CALLBACK_REPLAY",
        "AUTH175_STALE_CALLBACK_AFTER_EXPIRY",
        "AUTH175_ARBITRARY_REDIRECT_DENIED",
        "AUTH175_INVALID_TOKEN_REJECTED",
        "AUTH175_EVIDENCE_VAULT_ONLY_RAW_CLAIMS",
    }
    case_ids = {case.get("caseId") for case in cases}
    if not required_cases.issubset(case_ids):
        missing = sorted(required_cases - case_ids)
        fail(f"casebook missing required cases: {', '.join(missing)}")
    for case in cases:
        side_effects = case.get("sideEffects", {})
        if side_effects.get("directSessionWrites") != 0:
            fail(f"{case.get('caseId')} must not direct-write sessions")
        if side_effects.get("patientReferenceWrites") != 0:
            fail(f"{case.get('caseId')} must not direct-write patient references")


def validate_tests() -> None:
    test = read(TEST)
    require_markers(
        "auth bridge tests",
        test,
        {
            "freezes AuthScopeBundle",
            "PostAuthReturnIntent",
            "exactly once",
            "replayed_callback",
            "arbitrary callback redirect",
            "invalid-token",
            "token_validation_failure",
            "sessionGovernorCalls",
            "directSessionWrite",
        },
    )


def validate_root_script_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_auth_bridge_service.py"
    if scripts.get("validate:auth-bridge-service") != expected:
        fail("package.json missing validate:auth-bridge-service script")
    for script_name in ["bootstrap", "check"]:
        script_value = scripts.get(script_name, "")
        expected_chain = "pnpm validate:phase2-parallel-gate && pnpm validate:domain-transition-schema && pnpm validate:auth-bridge-service"
        if expected_chain not in script_value:
            fail(f"package.json {script_name} is not wired after domain transition")
        root_script_value = ROOT_SCRIPT_UPDATES.get(script_name, "")
        if expected_chain not in root_script_value:
            fail(f"root_script_updates {script_name} is not wired after domain transition")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_docs()
    validate_matrix()
    validate_cases()
    validate_tests()
    validate_root_script_wiring()
    print("[auth-bridge-service] ok")


if __name__ == "__main__":
    main()
