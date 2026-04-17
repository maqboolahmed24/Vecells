#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

DOCS = [
    ROOT / "docs" / "external" / "202_nhs_login_redirects_scopes_and_test_users.md",
    ROOT / "docs" / "external" / "202_mock_now_nhs_login_configuration_twin.md",
    ROOT / "docs" / "external" / "202_actual_provider_strategy_and_release_gates.md",
    ROOT / "docs" / "external" / "202_nhs_login_console_automation_runbook.md",
]
ATLAS = ROOT / "docs" / "frontend" / "202_nhs_login_config_control_board.html"
MANIFEST = ROOT / "data" / "contracts" / "202_nhs_login_client_config_manifest.json"
SELECTORS = ROOT / "data" / "contracts" / "202_nhs_login_console_selector_manifest.json"
REDIRECTS = ROOT / "data" / "analysis" / "202_redirect_uri_matrix.csv"
SCOPES = ROOT / "data" / "analysis" / "202_scope_bundle_matrix.csv"
TEST_USERS = ROOT / "data" / "analysis" / "202_test_user_matrix.csv"
GATES = ROOT / "data" / "analysis" / "202_environment_gate_and_evidence_checklist.json"
STATE_PLAN = ROOT / "data" / "analysis" / "202_redirect_state_routing_plan.csv"
HARNESS = ROOT / "tools" / "playwright" / "202_nhs_login_console_harness.ts"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "202_nhs_login_config_control_board.spec.ts"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_REDIRECT_ROUTE_BINDING.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_TEST_USER_PERSONAS.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_LOCAL_SESSION_LOGOUT_OWNERSHIP.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_MINIMUM_SCOPE_BUNDLES.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_MOCK_NOW_TWIN.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_STATE_ROUTING.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_NHS_LOGIN_CONFIG_LIVE_MUTATION_GATES.json",
]

REQUIRED_ENVIRONMENTS = {"local", "sandbox_twin", "sandpit_candidate", "integration_candidate"}
REQUIRED_TABS = {"Environments", "Redirects", "Scopes", "Test Users", "Evidence", "Live Gates"}
REQUIRED_TESTIDS = {
    "NHS_Login_Config_Control_Board",
    "environment-rail",
    "manifest-board",
    "evidence-drawer",
    "redirect-ownership-graph",
    "redirect-ownership-table",
    "scope-bundle-matrix",
    "scope-bundle-table",
    "test-user-coverage-table",
    "live-gate-checklist",
    "redacted-screenshot-list",
    "lower-parity-band",
}
GAP_KEYS = {
    "taskId",
    "sourceAmbiguity",
    "decisionTaken",
    "whyThisFitsTheBlueprint",
    "operationalRisk",
    "followUpIfPolicyChanges",
}


def fail(message: str) -> None:
    raise SystemExit(f"[202-nhs-login-client-config] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ X-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1)


def validate_checklist() -> None:
    if checklist_state("par_201") != "X":
        fail("par_201 must be complete before seq_202")
    if checklist_state("seq_202") not in {"-", "X"}:
        fail("seq_202 must be claimed or complete")


def validate_docs_and_board() -> None:
    for path in DOCS:
        text = read(path)
        for token in ["202", "NHS login", "dry", "redact"]:
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing token {token}")

    board = read(ATLAS)
    for testid in REQUIRED_TESTIDS:
        if testid not in board:
            fail(f"control board missing data-testid {testid}")
    for tab in REQUIRED_TABS:
        if f'data-config-tab="{tab}"' not in board:
            fail(f"control board missing tab {tab}")
    for token in [
        "Identity_Config_Control_Board",
        "max-width: 1480px",
        "min-height: 72px",
        "grid-template-columns: 240px minmax(0, 1fr) 360px",
        "#f6f8fb",
        "#ffffff",
        "#eef3f8",
        "#101828",
        "#1d2939",
        "#667085",
        "#e4e7ec",
        "#d0d5dd",
        "#1d4ed8",
        "#5b61f6",
        "#b7791f",
        "#b42318",
        "#117a65",
        "120ms",
        "180ms",
        "220ms",
        "prefers-reduced-motion: reduce",
        "redirect-ownership-graph",
        "redirect-ownership-table",
        "scope-bundle-matrix",
        "scope-bundle-table",
    ]:
        if token not in board.lower() and token not in board:
            fail(f"control board missing required visual token {token}")


def validate_manifest() -> None:
    manifest = load_json(MANIFEST)
    if manifest.get("taskId") != "seq_202":
        fail("manifest has wrong taskId")
    if manifest.get("visualMode") != "Identity_Config_Control_Board":
        fail("manifest has wrong visual mode")

    env_ids = {env["environmentId"] for env in manifest.get("environmentSet", [])}
    if REQUIRED_ENVIRONMENTS.difference(env_ids):
        fail(f"manifest missing environments {sorted(REQUIRED_ENVIRONMENTS.difference(env_ids))}")
    for env in manifest["environmentSet"]:
        if env["environmentId"] in {"sandpit_candidate", "integration_candidate"}:
            if env.get("providerMutationAllowed") is not False:
                fail(f"{env['environmentId']} must default to no provider mutation")

    raw_text = read(MANIFEST)
    for forbidden in [
        "Bluewoven-",
        "190696",
        "client_secret",
        "plainPassword",
        "rawOtp",
        "consolePassword",
    ]:
        if forbidden in raw_text:
            fail(f"manifest contains forbidden raw credential token {forbidden}")

    redirects = manifest.get("redirectUris", [])
    if len(redirects) < 2:
        fail("manifest must include patient portal and recovery redirects")
    for redirect in redirects:
        if redirect.get("arbitraryReturnUrlAllowed") is not False:
            fail(f"{redirect['redirectUriId']} allows arbitrary return URLs")
        if redirect.get("stateRoutingRequired") is not True:
            fail(f"{redirect['redirectUriId']} does not require state routing")
        if redirect.get("providerRegisteredPathCountPerEnvironment", 99) > 10:
            fail(f"{redirect['redirectUriId']} exceeds provider redirect URI ceiling")
        owners = redirect.get("routeFamilyOwnership", [])
        if not owners:
            fail(f"{redirect['redirectUriId']} has no route-family owners")
        for owner in owners:
            for key in ["routeFamilyId", "postAuthReturnIntentPattern", "statePrefix", "allowedNextSurface"]:
                if key not in owner:
                    fail(f"{redirect['redirectUriId']} owner missing {key}")

    scopes = manifest.get("scopeBundles", [])
    if not scopes:
        fail("manifest missing scope bundles")
    for scope in scopes:
        requested = set(scope.get("requestedScopes", []))
        forbidden = set(scope.get("forbiddenScopes", []))
        if "openid" not in requested:
            fail(f"{scope['scopeBundleId']} missing openid")
        if requested.intersection({"offline_access", "gp_integration_credentials"}):
            fail(f"{scope['scopeBundleId']} requests forbidden broad scope")
        if "offline_access" not in forbidden:
            fail(f"{scope['scopeBundleId']} does not forbid offline_access")
        if scope.get("localSessionOwnedByVecells") is not True:
            fail(f"{scope['scopeBundleId']} lost local session ownership")

    personas = manifest.get("testUserPersonas", [])
    coverage = {item for persona in personas for item in persona.get("coverage", [])}
    for required in ["read_only", "claim", "recover_only", "higher_assurance", "consent_denied"]:
        if required not in coverage:
            fail(f"test-user personas missing coverage {required}")
    for persona in personas:
        if persona.get("rawPasswordStoredInRepo") is not False:
            fail(f"{persona['personaId']} can store raw passwords")
        if not str(persona.get("fixtureRef", "")).startswith("secret://"):
            fail(f"{persona['personaId']} fixture ref must be secret://")

    session = manifest.get("sessionAndLogoutOwnership", {})
    if session.get("nhsLoginOwnsLocalSession") is not False:
        fail("manifest implies NHS login owns the local session")
    if session.get("vecellsOwnsLocalSession") is not True:
        fail("manifest does not state Vecells owns local sessions")
    if session.get("callbackCreatesSessionDirectly") is not False:
        fail("manifest lets callback create a session directly")

    gate = manifest.get("liveMutationGate", {})
    if gate.get("liveMutationAllowedByDefault") is not False:
        fail("live mutation must default to false")
    for required in [
        "explicit_live_mutation_flag_true",
        "target_environment_declared",
        "credential_refs_resolve_from_approved_secret_manager",
        "named_approver_recorded",
        "rollback_snapshot_captured",
    ]:
        if required not in gate.get("requiredPreconditions", []):
            fail(f"live gate missing precondition {required}")


def validate_matrices_and_gaps() -> None:
    redirect_rows = csv_rows(REDIRECTS)
    if len(redirect_rows) < 8:
        fail("redirect matrix does not cover all environment/route-family rows")
    for row in redirect_rows:
        if row["task_id"] != "202":
            fail("redirect matrix row missing task id 202")
        if row["arbitrary_return_url_allowed"] != "false":
            fail(f"redirect row {row['redirect_uri_id']} allows arbitrary return URL")
        if int(row["provider_registered_path_count"]) > 10:
            fail(f"redirect row {row['redirect_uri_id']} exceeds provider redirect URI ceiling")
        if not row["post_auth_return_intent_pattern"].startswith("pai_"):
            fail(f"redirect row {row['redirect_uri_id']} missing PostAuthReturnIntent pattern")

    state_rows = csv_rows(STATE_PLAN)
    state_prefixes = {row["state_prefix"] for row in state_rows}
    if len(state_prefixes) < 5:
        fail("state routing plan is too small to prove fan-out")
    for row in state_rows:
        if row["stored_payload_rule"] != "opaque_state_digest_only":
            fail("state routing plan stores non-opaque payload")
        if row["provider_redirect_sprawl_prevented"] != "true":
            fail("state routing plan does not prevent sprawl")

    scope_rows = csv_rows(SCOPES)
    for row in scope_rows:
        requested = set(row["requested_scopes"].split())
        if "openid" not in requested:
            fail(f"scope row {row['scope_bundle_id']} missing openid")
        if {"offline_access", "gp_integration_credentials"}.intersection(requested):
            fail(f"scope row {row['scope_bundle_id']} requests forbidden scope")
        if row["local_session_owned_by_vecells"] != "true":
            fail(f"scope row {row['scope_bundle_id']} lost Vecells session ownership")

    user_rows = csv_rows(TEST_USERS)
    combined = {
        "read_only": any(row["read_only"] == "true" for row in user_rows),
        "claim": any(row["claim"] == "true" for row in user_rows),
        "recover_only": any(row["recover_only"] == "true" for row in user_rows),
        "higher_assurance": any(row["higher_assurance"] == "true" for row in user_rows),
        "consent_denied": any(row["consent_denied"] == "true" for row in user_rows),
    }
    missing = [key for key, present in combined.items() if not present]
    if missing:
        fail(f"test-user matrix missing coverage {missing}")
    for row in user_rows:
        if row["raw_password_stored_in_repo"] != "false":
            fail(f"test-user row {row['persona_id']} stores raw password")

    gates = load_json(GATES)
    if gates.get("defaultMode") != "dry_run":
        fail("gate checklist must default to dry_run")
    if not any(gate["environmentId"] == "integration_candidate" for gate in gates["environmentGates"]):
        fail("gate checklist missing integration candidate")
    if not gates.get("rollbackChecklist"):
        fail("gate checklist missing rollback posture")
    if not gates.get("redactionChecklist"):
        fail("gate checklist missing redaction posture")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "seq_202":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_selectors_harness_and_spec() -> None:
    selectors = load_json(SELECTORS)
    local = selectors.get("localTwinSelectors", {})
    for key in [
        "root",
        "environmentRail",
        "manifestBoard",
        "evidenceDrawer",
        "redirectGraph",
        "redirectGraphTable",
        "scopeMatrix",
        "scopeMatrixTable",
        "testUserCoverageTable",
        "liveGateChecklist",
    ]:
        if key not in local:
            fail(f"selector manifest missing local selector {key}")
    if selectors.get("liveMutationGate", {}).get("allowFlag") != "ALLOW_REAL_PROVIDER_MUTATION":
        fail("selector manifest missing live mutation flag")
    if not selectors.get("redactionSelectors"):
        fail("selector manifest missing redaction selectors")

    harness = read(HARNESS)
    for token in [
        "playwright",
        "ALLOW_REAL_PROVIDER_MUTATION",
        "dry_run",
        "redact",
        "202-nhs-login-console-harness-evidence.json",
        "202-nhs-login-selector-snapshot.json",
        "providerMutationAllowed",
        "rollback",
        "page.screenshot",
        "getByRole",
    ]:
        if token not in harness:
            fail(f"harness missing token {token}")

    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "NHS_Login_Config_Control_Board",
        "Identity_Config_Control_Board",
        "environment-rail",
        "manifest-board",
        "evidence-drawer",
        "redirect-ownership-graph",
        "scope-bundle-matrix",
        "test-user-coverage-table",
        "live-gate-checklist",
        "1280",
        "390",
        "prefers-reduced-motion",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_nhs_login_client_config.py"
    if scripts.get("validate:nhs-login-client-config") != expected:
        fail("package.json missing validate:nhs-login-client-config script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if (
        '"validate:nhs-login-client-config": '
        '"python3 ./tools/analysis/validate_nhs_login_client_config.py"'
        not in root_updates
    ):
        fail("root_script_updates missing validate:nhs-login-client-config")
    required_chain = (
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
    for script_name in ("bootstrap", "check"):
        if required_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing NHS login validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing NHS login validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_docs_and_board()
    validate_manifest()
    validate_matrices_and_gaps()
    validate_selectors_harness_and_spec()
    validate_scripts()
    print("[202-nhs-login-client-config] validation passed")


if __name__ == "__main__":
    main()
