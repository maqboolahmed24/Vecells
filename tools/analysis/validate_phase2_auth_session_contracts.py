#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

AUTH_TRANSACTION = ROOT / "data/contracts/171_auth_transaction.schema.json"
AUTH_SCOPE_BUNDLE = ROOT / "data/contracts/171_auth_scope_bundle.schema.json"
POST_AUTH_RETURN_INTENT = ROOT / "data/contracts/171_post_auth_return_intent.schema.json"
SESSION_DECISION = ROOT / "data/contracts/171_session_establishment_decision.schema.json"
SESSION_TERMINATION = ROOT / "data/contracts/171_session_termination_settlement.schema.json"
SESSION_PROJECTION = ROOT / "data/contracts/171_session_projection_contract.json"
CALLBACK_MATRIX = ROOT / "data/analysis/171_callback_outcome_matrix.csv"
TTL_MATRIX = ROOT / "data/analysis/171_session_ttl_and_rotation_matrix.csv"
GAP_LOG = ROOT / "data/analysis/171_auth_session_gap_log.json"
ARCHITECTURE_DOC = ROOT / "docs/architecture/171_nhs_login_auth_bridge_and_local_session_contract.md"
API_DOC = ROOT / "docs/api/171_auth_transaction_and_callback_contracts.md"
SECURITY_DOC = ROOT / "docs/security/171_session_rotation_timeout_and_logout_rules.md"
FRONTEND_SPEC = ROOT / "docs/frontend/171_sign_in_and_recovery_experience_spec.md"
BOARD = ROOT / "docs/frontend/171_auth_return_journey_board.html"
PLAYWRIGHT_SPEC = ROOT / "tests/playwright/171_auth_return_journey_board.spec.js"
CHECKLIST = ROOT / "prompt/checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
PLAYWRIGHT_PACKAGE = ROOT / "tests/playwright/package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools/analysis/root_script_updates.py"

SESSION_DECISIONS = {"create_fresh", "rotate_existing", "reuse_existing", "deny", "bounded_recovery"}

CALLBACK_OUTCOMES = {
    "success",
    "consent_declined",
    "insufficient_assurance",
    "expired_transaction",
    "replayed_callback",
    "token_validation_failure",
    "linkage_unavailable",
    "internal_fallback",
}

PROJECTION_POSTURES = {
    "signed_in",
    "claim_pending",
    "read_only",
    "re_auth_required",
    "session_expired",
    "consent_declined",
    "subject_conflict",
    "stale_return",
    "bounded_recovery",
}

TTL_POSTURES = {
    "anonymous_pre_auth",
    "auth_transaction_pending",
    "signed_in",
    "rotate_existing",
    "reuse_existing",
    "claim_pending",
    "re_auth_required",
    "session_expired",
    "subject_conflict",
    "bounded_recovery",
    "logout",
}

RAW_AUTH_FIELD_NAMES = {
    "rawToken",
    "rawClaims",
    "idToken",
    "accessToken",
    "refreshToken",
    "authorizationCode",
    "callbackQuery",
    "nhsNumber",
    "patientIdentifier",
    "tokenPayload",
    "claimPayload",
}

REQUIRED_BOARD_MARKERS = {
    "Auth_Return_Journey_Board",
    "auth_return_mark",
    "pre-auth-landing-card",
    "nhs-login-button-standard",
    "state-rail",
    "outcome-filter",
    "projection-filter",
    "auth-transaction-ladder",
    "auth-transaction-table",
    "return-intent-braid",
    "return-intent-table",
    "session-state-ring",
    "session-state-table",
    "sign-in-recovery-page-atlas",
    "page-atlas-table",
    "parity-table",
    "inspector",
    "--masthead-height: 72px",
    "--left-rail-width: 280px",
    "--right-inspector-width: 408px",
    "760px",
    "1600px",
    "prefers-reduced-motion",
}

REQUIRED_SPEC_MARKERS = {
    "transaction outcome rendering for all callback outcomes",
    "sign-in and recovery page atlas parity",
    "keyboard traversal and landmarks",
    "reducedMotion equivalence",
    "diagram/table parity",
    "Auth_Return_Journey_Board",
}


def fail(message: str) -> None:
    raise SystemExit(f"[phase2-auth-session-contracts] {message}")


def require_file(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    text = require_file(path)
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def load_csv(path: Path) -> list[dict[str, str]]:
    text = require_file(path)
    try:
        return list(csv.DictReader(text.splitlines()))
    except csv.Error as error:
        fail(f"{path.relative_to(ROOT)} is invalid CSV: {error}")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def iter_property_names(schema: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(schema, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            names.update(properties.keys())
        for value in schema.values():
            names.update(iter_property_names(value))
    elif isinstance(schema, list):
        for item in schema:
            names.update(iter_property_names(item))
    return names


def enum_at(schema: dict[str, Any], *keys: str) -> set[str]:
    node: Any = schema
    for key in keys:
        node = node[key]
    return set(node["enum"])


def validate_schemas() -> None:
    auth_transaction = load_json(AUTH_TRANSACTION)
    scope_bundle = load_json(AUTH_SCOPE_BUNDLE)
    return_intent = load_json(POST_AUTH_RETURN_INTENT)
    session_decision = load_json(SESSION_DECISION)
    termination = load_json(SESSION_TERMINATION)

    expected_titles = {
        AUTH_TRANSACTION: "AuthTransaction",
        AUTH_SCOPE_BUNDLE: "AuthScopeBundle",
        POST_AUTH_RETURN_INTENT: "PostAuthReturnIntent",
        SESSION_DECISION: "SessionEstablishmentDecision",
        SESSION_TERMINATION: "SessionTerminationSettlement",
    }
    for path, title in expected_titles.items():
        if load_json(path).get("title") != title:
            fail(f"{path.relative_to(ROOT)} title must be {title}")

    lifecycle = enum_at(auth_transaction, "properties", "lifecycle")
    for required in ["callback_consumed", "expired", "replayed", "failed_validation"]:
        if required not in lifecycle:
            fail(f"AuthTransaction lifecycle missing {required}")

    callback_outcomes = enum_at(
        auth_transaction, "properties", "callbackFence", "properties", "callbackOutcome"
    )
    if not CALLBACK_OUTCOMES.issubset(callback_outcomes):
        fail("AuthTransaction callback outcome enum does not cover required outcomes")

    raw_fields = sorted(iter_property_names(auth_transaction) & RAW_AUTH_FIELD_NAMES)
    if raw_fields:
        fail(f"AuthTransaction exposes raw token/claim fields: {', '.join(raw_fields)}")

    if return_intent["properties"]["redirectMode"].get("const") != "route_intent_binding_only":
        fail("PostAuthReturnIntent redirectMode must be route_intent_binding_only")
    return_properties = iter_property_names(return_intent)
    forbidden_return_fields = sorted(
        field
        for field in return_properties
        if field.lower() in {"url", "returnurl", "redirecturl", "callbackurl"}
    )
    if forbidden_return_fields:
        fail(f"PostAuthReturnIntent exposes arbitrary URL fields: {', '.join(forbidden_return_fields)}")

    if enum_at(session_decision, "properties", "decision") != SESSION_DECISIONS:
        fail("SessionEstablishmentDecision vocabulary drifted")
    if "writableAuthorityState" not in session_decision.get("required", []):
        fail("SessionEstablishmentDecision must require writableAuthorityState")

    termination_types = enum_at(termination, "properties", "terminationType")
    for required in ["logout", "idle_timeout", "absolute_timeout", "revocation", "downgrade"]:
        if required not in termination_types:
            fail(f"SessionTerminationSettlement missing termination type {required}")

    if scope_bundle["properties"].get("rawClaimStorageRule", {}).get("const") != "vault_reference_only":
        fail("AuthScopeBundle must freeze rawClaimStorageRule to vault_reference_only")


def validate_callback_matrix(rows: list[dict[str, str]]) -> None:
    outcomes = {row.get("callback_outcome") for row in rows}
    missing = sorted(CALLBACK_OUTCOMES - outcomes)
    if missing:
        fail(f"callback outcome matrix missing outcomes: {', '.join(missing)}")
    if len(rows) != len(outcomes):
        fail("callback outcome matrix has duplicate callback outcome rows")

    for row in rows:
        outcome = row.get("callback_outcome", "")
        if not row.get("fallback_disposition"):
            fail(f"{outcome} lacks fallback disposition")
        if row.get("session_decision") not in SESSION_DECISIONS:
            fail(f"{outcome} uses invalid session decision {row.get('session_decision')}")
        if row.get("projection_posture") not in PROJECTION_POSTURES:
            fail(f"{outcome} uses invalid projection posture {row.get('projection_posture')}")
        if row.get("return_intent_disposition") != "route_intent_binding_only":
            fail(f"{outcome} return intent disposition can widen beyond RouteIntentBinding")
        if row.get("can_create_session") == "true" and row.get("callback_outcome") != "success":
            fail(f"{outcome} can create a session without successful callback")
        if not row.get("reason_codes", "").startswith("AUTH_171_"):
            fail(f"{outcome} reason code is not AUTH_171 namespaced")


def validate_ttl_matrix(rows: list[dict[str, str]]) -> None:
    postures = {row.get("session_posture") for row in rows}
    missing = sorted(TTL_POSTURES - postures)
    if missing:
        fail(f"TTL matrix missing postures: {', '.join(missing)}")
    for row in rows:
        posture = row.get("session_posture", "")
        for field in ["idle_timeout_seconds", "absolute_timeout_seconds", "reauth_before_seconds"]:
            try:
                value = int(row.get(field, ""))
            except ValueError:
                fail(f"{posture} has non-integer {field}")
            if value < 0:
                fail(f"{posture} has negative {field}")
        for field in [
            "session_epoch_action",
            "cookie_action",
            "csrf_action",
            "access_grant_action",
            "writable_authority_state",
            "reason_codes",
        ]:
            if not row.get(field):
                fail(f"{posture} missing {field}")


def validate_session_projection(contract: dict[str, Any]) -> None:
    postures = {item.get("posture") for item in contract.get("projectionPostures", [])}
    missing = sorted(PROJECTION_POSTURES - postures)
    if missing:
        fail(f"session projection missing postures: {', '.join(missing)}")

    for item in contract.get("projectionPostures", []):
        posture = item.get("posture")
        if item.get("writableAuthorityState") == "writable" and posture != "signed_in":
            fail(f"{posture} is writable without signed_in posture")
        reveal = item.get("revealPolicy", "").lower()
        if "raw" in reveal or "phi-rich" in reveal or "full_patient" in reveal:
            fail(f"{posture} reveal policy allows unsafe detail: {reveal}")
        for field in ["dominantAction", "copyKey", "routeIntentDisposition"]:
            if not item.get(field):
                fail(f"{posture} missing {field}")

    if "standard NHS login button" not in contract.get("nhsLoginButtonRule", {}).get("styleRule", ""):
        fail("session projection must freeze standard NHS login button rule")
    if contract.get("holdingScreenRule", {}).get("motionBudgetMs") != 140:
        fail("callback holding screen motion budget must be 140ms")


def validate_gap_log(gap_log: dict[str, Any]) -> None:
    if gap_log.get("unresolvedGaps") != []:
        fail("auth session gap log must have no unresolved gaps")
    gap_ids = {item.get("gapId") for item in gap_log.get("resolvedGaps", [])}
    required = {
        "GAP_RESOLVED_PHASE2_AUTH_DEDICATED_BRIDGE_CONTRACT_V1",
        "GAP_RESOLVED_PHASE2_AUTH_GOVERNED_RETURN_INTENT_V1",
        "GAP_RESOLVED_PHASE2_AUTH_SESSION_DECISION_PATH_V1",
        "GAP_RESOLVED_PHASE2_AUTH_TERMINATION_PROJECTION_V1",
        "GAP_RESOLVED_PHASE2_AUTH_UI_GRAMMAR_V1",
    }
    missing = sorted(required - gap_ids)
    if missing:
        fail(f"auth session gap log missing closures: {', '.join(missing)}")


def validate_docs_and_board() -> None:
    doc_markers = {
        ARCHITECTURE_DOC: [
            "AuthTransaction",
            "AuthScopeBundle",
            "PostAuthReturnIntent",
            "SessionEstablishmentDecision",
            "SessionTerminationSettlement",
        ],
        API_DOC: ["PKCE", "state", "nonce", "route_intent_binding_only", "replayed_callback"],
        SECURITY_DOC: ["secure HTTP-only", "CSRF", "TTL", "SessionTerminationSettlement"],
        FRONTEND_SPEC: ["standard NHS login button", "Callback Holding", "subject_conflict"],
    }
    for path, markers in doc_markers.items():
        require_markers(str(path.relative_to(ROOT)), require_file(path), markers)

    board = require_file(BOARD)
    require_markers(str(BOARD.relative_to(ROOT)), board, REQUIRED_BOARD_MARKERS)
    for visual, table in [
        ("auth-transaction-ladder", "auth-transaction-table"),
        ("return-intent-braid", "return-intent-table"),
        ("session-state-ring", "session-state-table"),
        ("sign-in-recovery-page-atlas", "page-atlas-table"),
    ]:
        if visual not in board or table not in board:
            fail(f"board missing parity mapping for {visual} -> {table}")

    spec = require_file(PLAYWRIGHT_SPEC)
    require_markers(str(PLAYWRIGHT_SPEC.relative_to(ROOT)), spec, REQUIRED_SPEC_MARKERS)


def validate_package_wiring() -> None:
    package = load_json(ROOT_PACKAGE)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phase2_auth_session_contracts.py"
    if scripts.get("validate:phase2-auth-session-contracts") != expected:
        fail("root package missing validate:phase2-auth-session-contracts script")
    for script_name in ["bootstrap", "check"]:
        if "pnpm validate:phase2-auth-session-contracts" not in scripts.get(script_name, ""):
            fail(f"root package {script_name} missing phase2 auth session validation")

    playwright_package = load_json(PLAYWRIGHT_PACKAGE)
    for script_name in ["build", "lint", "test", "typecheck", "e2e"]:
        script = playwright_package.get("scripts", {}).get(script_name, "")
        if "171_auth_return_journey_board.spec.js" not in script:
            fail(f"tests/playwright {script_name} missing seq_171 spec")

    if "validate:phase2-auth-session-contracts" not in require_file(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing phase2 auth session script")


def validate_checklist() -> None:
    checklist = require_file(CHECKLIST)
    if not re.search(r"- \[[Xx]\] seq_170_", checklist):
        fail("seq_170 must be complete before seq_171")
    if not re.search(r"- \[(?:-|X)\] seq_171_", checklist):
        fail("seq_171 is not claimed or complete in prompt/checklist.md")


def main() -> int:
    validate_schemas()
    validate_callback_matrix(load_csv(CALLBACK_MATRIX))
    validate_ttl_matrix(load_csv(TTL_MATRIX))
    validate_session_projection(load_json(SESSION_PROJECTION))
    validate_gap_log(load_json(GAP_LOG))
    validate_docs_and_board()
    validate_package_wiring()
    validate_checklist()
    print("phase2 auth session contracts validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
