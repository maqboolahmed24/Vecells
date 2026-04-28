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

MODEL = ROOT / "apps" / "patient-web" / "src" / "auth-callback-recovery.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "auth-callback-recovery.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "auth-callback-recovery.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"
FOUNDATION = ROOT / "packages" / "design-system" / "src" / "foundation.css"

SPEC_DOC = ROOT / "docs" / "frontend" / "195_auth_callback_and_signed_out_recovery_spec.md"
SHOWCASE = ROOT / "docs" / "frontend" / "195_auth_callback_and_signed_out_recovery_showcase.html"
TOKENS = ROOT / "docs" / "frontend" / "195_auth_callback_design_tokens.json"
A11Y = ROOT / "docs" / "accessibility" / "195_auth_callback_and_recovery_a11y_notes.md"
MATRIX = ROOT / "data" / "analysis" / "195_auth_recovery_state_matrix.csv"
CASES = ROOT / "data" / "analysis" / "195_callback_refresh_back_button_cases.json"
VISUAL_MANIFEST = ROOT / "data" / "analysis" / "195_playwright_visual_baseline_manifest.json"

PLAYWRIGHT_SPECS = [
    ROOT / "tests" / "playwright" / "195_auth_callback_and_signed_out_recovery.spec.ts",
    ROOT / "tests" / "playwright" / "195_auth_callback_and_signed_out_recovery.visual.spec.ts",
    ROOT / "tests" / "playwright" / "195_auth_callback_and_signed_out_recovery.accessibility.spec.ts",
    ROOT / "tests" / "playwright" / "195_auth_callback_and_signed_out_recovery.aria.spec.ts",
]
PLAYWRIGHT_SHARED = (
    ROOT / "tests" / "playwright" / "195_auth_callback_and_signed_out_recovery.shared.ts"
)

GAP_RESOLUTIONS = [
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_AUTH_FRONTEND_CALLBACK_TO_SCREEN_MAPPING.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_AUTH_FRONTEND_SIGNED_OUT_CONTEXT_PRESERVATION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_AUTH_FRONTEND_REFRESH_BACK_BUTTON_POSTURE.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_AUTH_FRONTEND_COUNTDOWN_TIMEOUT_PRESENTATION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_AUTH_FRONTEND_TOKEN_EXTENSION_GAPS.json",
]

EXPECTED_SCREENS = {
    "sign_in_entry",
    "callback_holding",
    "confirming_details",
    "consent_declined",
    "higher_assurance_required",
    "safe_re_entry",
    "session_expired",
    "signed_out_clean",
}

AUTHORITATIVE_TOKENS = [
    "AuthTransaction",
    "transactionState",
    "callbackOutcomeClass",
    "SessionEstablishmentDecision",
    "writableAuthorityState",
    "PostAuthReturnIntent",
    "returnAuthority",
    "intentState",
    "CapabilityDecision",
    "decisionState",
    "reasonCodes",
    "SessionTerminationSettlement",
    "trigger",
    "RouteIntentBinding",
    "validity",
    "routeFenceState",
    "releaseDriftDetected",
    "resolveAuthRecoveryScreenKey",
]

SHOWCASE_TESTIDS = [
    "Auth_Callback_Recovery_Atlas",
    "atlas-masthead",
    "atlas-state-rail",
    "atlas-canvas",
    "atlas-inspector",
    "callback-ladder-diagram",
    "same-shell-recovery-atlas",
    "session-state-ring",
    "page-state-gallery",
    "auth-state-matrix-table",
    "refresh-back-cases-table",
    "atlas-parity-table",
    "nhs-login-button-standard",
]

ROUTE_TESTIDS = [
    "Auth_Callback_Recovery_Route",
    "auth-shell-masthead",
    "header-identity-chip",
    "auth-context-card",
    "auth-live-region",
    "auth-primary-action",
    "nhs-login-button-standard",
]


def fail(message: str) -> None:
    raise SystemExit(f"[195-auth-frontend] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ X-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1)


def validate_checklist() -> None:
    if checklist_state("par_194") != "X":
        fail("par_194 must be complete before validating par_195")
    if checklist_state("par_195") not in {"-", "X"}:
        fail("par_195 must be claimed or complete")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    app = read(APP)
    css = read(CSS)
    foundation = read(FOUNDATION)

    for token in AUTHORITATIVE_TOKENS:
        if token not in model:
            fail(f"model missing authoritative token {token}")
    for screen in EXPECTED_SCREENS:
        if screen not in model:
            fail(f"model missing screen {screen}")
    if "auth-screen-${state.screenKey}" not in route:
        fail("route missing deterministic screen data-testid template")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing data-testid {testid}")
    if "isAuthCallbackRecoveryPath" not in app or "AuthCallbackRecoveryApp" not in app:
        fail("App.tsx does not route /auth/* to AuthCallbackRecoveryApp")
    if "URLSearchParams" in route or "URLSearchParams" in model:
        fail("auth route must not map screen state from URL query params")
    for role_token in ['role="status"', 'role="alert"']:
        if role_token not in route:
            fail(f"route missing semantic {role_token}")
    for token in [
        "--sys-auth-callback-canvas",
        "--sys-auth-callback-accent-auth",
        "--sys-auth-callback-state-morph-duration",
        "--sys-auth-callback-holding-update-duration",
    ]:
        if token not in foundation:
            fail(f"central design foundation missing {token}")
        if token not in css and token.endswith("duration"):
            fail(f"route CSS does not consume {token}")
    if "#005eb8" not in css or "auth-callback-recovery__nhs-login" not in css:
        fail("NHS login button standard styling is missing")
    if "prefers-reduced-motion: reduce" not in css:
        fail("route CSS missing reduced-motion media query")


def validate_docs_and_data() -> None:
    for path in [SPEC_DOC, SHOWCASE, TOKENS, A11Y, MATRIX, CASES, VISUAL_MANIFEST]:
        text = read(path)
        if "195" not in text and path != TOKENS:
            fail(f"{path.relative_to(ROOT)} does not reference task 195")

    token_doc = load_json(TOKENS)
    if token_doc.get("mode") != "Auth_Callback_Recovery_Atlas":
        fail("design token doc has wrong mode")
    if token_doc["tokens"].get("--sys-auth-callback-canvas") != "#F6F8FB":
        fail("design token doc lost required canvas color")

    showcase = read(SHOWCASE)
    for testid in SHOWCASE_TESTIDS:
        if testid not in showcase:
            fail(f"showcase missing data-testid {testid}")
    if "atlas-view-${state.key}" not in showcase:
        fail("showcase missing deterministic atlas view template")
    if "prefers-reduced-motion: reduce" not in showcase:
        fail("showcase missing reduced-motion CSS")

    with MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    screens = {row["screen_key"] for row in rows}
    if screens != EXPECTED_SCREENS:
        fail(f"matrix screen coverage drifted: {sorted(screens)}")
    if any(row["route_intent_binding_validity"] == "" for row in rows):
        fail("matrix must publish route intent binding validity for every state")

    cases = load_json(CASES)
    if len(cases.get("cases", [])) < 8:
        fail("refresh/back-button cases must cover at least eight cases")
    required_cases = {
        "REFRESH_CALLBACK_HOLDING",
        "REPLAY_CONSUMED_CALLBACK",
        "BACK_FROM_PROVIDER_AFTER_SUCCESS",
        "STALE_ROUTE_RELEASE_DRIFT",
        "EXPIRED_CALLBACK_TRANSACTION",
        "SIGNED_OUT_BACK_BUTTON",
    }
    actual_cases = {case["caseId"] for case in cases["cases"]}
    if not required_cases.issubset(actual_cases):
        fail("refresh/back-button cases missing required posture cases")
    if "generic home redirect while continuity key is recoverable" not in cases.get("forbidden", []):
        fail("cases must forbid generic home redirect")

    manifest = load_json(VISUAL_MANIFEST)
    if set(manifest.get("screens", [])) != EXPECTED_SCREENS:
        fail("visual manifest screen coverage drifted")
    if not manifest.get("expectedArtifacts"):
        fail("visual manifest must declare screenshot-equivalent artifacts")

    for path in GAP_RESOLUTIONS:
        gap = load_json(path)
        for key in [
            "taskId",
            "sourceAmbiguity",
            "decisionTaken",
            "whyThisFitsTheBlueprint",
            "operationalRisk",
            "followUpIfPolicyChanges",
        ]:
            if key not in gap:
                fail(f"{path.relative_to(ROOT)} missing {key}")


def validate_playwright_specs() -> None:
    combined = "\n".join(read(path) for path in [*PLAYWRIGHT_SPECS, PLAYWRIGHT_SHARED])
    for token in [
        "getByRole",
        "page.screenshot",
        "aria-current",
        "reducedMotion",
        "page.reload",
        "goBack",
        "nhs-login-button-standard",
        "Auth_Callback_Recovery_Atlas",
        "Auth_Callback_Recovery_Route",
    ]:
        if token not in combined:
            fail(f"Playwright specs missing coverage token {token}")
    for path in PLAYWRIGHT_SPECS:
        if "--run" not in read(path):
            fail(f"{path.relative_to(ROOT)} must support --run")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_195_auth_frontend_contracts.py"
    if scripts.get("validate:195-auth-frontend") != expected:
        fail("package.json missing validate:195-auth-frontend script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:195-auth-frontend": "python3 ./tools/analysis/validate_195_auth_frontend_contracts.py"' not in root_updates:
        fail("root_script_updates missing validate:195-auth-frontend")
    required_chain = (
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
    if required_chain not in scripts.get("bootstrap", ""):
        fail("bootstrap script missing auth frontend validator in phase2 chain")
    if required_chain not in scripts.get("check", ""):
        fail("check script missing auth frontend validator in phase2 chain")
    if required_chain not in root_updates:
        fail("root_script_updates missing auth frontend validator in phase2 chain")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_and_data()
    validate_playwright_specs()
    validate_scripts()
    print("[195-auth-frontend] validation passed")


if __name__ == "__main__":
    main()
