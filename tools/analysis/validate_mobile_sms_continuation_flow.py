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

MODEL = ROOT / "apps" / "patient-web" / "src" / "mobile-sms-continuation.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "mobile-sms-continuation.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "mobile-sms-continuation.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "198_mobile_sms_continuation_flow_for_callers.md"
ATLAS = ROOT / "docs" / "frontend" / "198_mobile_sms_continuation_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "198_seeded_vs_challenge_mobile_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "198_mobile_sms_continuation_surface_contract.json"
ENTRY_MATRIX = ROOT / "data" / "analysis" / "198_continuation_entry_and_recovery_matrix.csv"
STEP_CASES = ROOT / "data" / "analysis" / "198_mobile_step_restore_and_replay_cases.json"
VISIBILITY_TABLE = ROOT / "data" / "analysis" / "198_seeded_challenge_manual_only_visibility_table.csv"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE2_SMS_CONTINUATION.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "198_mobile_sms_continuation_flow_for_callers.spec.ts"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_MOBILE_FIRST_SHELL.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_CHALLENGE_PRIVACY_GATE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_REPLAY_SETTLED_MAPPING.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_SIGN_IN_UPLIFT_RETURN.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_CANONICAL_INTAKE_SEMANTICS.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_MANUAL_ONLY_OUTCOME.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTINUATION_UI_COPY_PACK.json",
]

REQUIRED_PROJECTION_TOKENS = {
    "MobileContinuationResolver",
    "TelephonyContinuationEligibility",
    "AccessGrant",
    "AccessGrantScopeEnvelope",
    "AccessGrantRedemptionRecord",
    "AccessGrantSupersessionRecord",
    "RouteIntentBinding",
    "RecoveryContinuationToken",
    "PatientSecureLinkSessionProjection",
    "PatientActionRecoveryProjection",
    "PatientRequestReturnBundle",
    "TelephonyContinuationContext",
}

REQUIRED_SCREEN_FAMILIES = {
    "SeededContinuationLanding",
    "ChallengeContinuationLanding",
    "ChallengeQuestionStep",
    "CapturedSoFarReview",
    "AddMoreDetailStep",
    "UploadEvidenceStep",
    "ReviewBeforeSubmitStep",
    "ReplayMappedOutcome",
    "StaleLinkRecoveryBridge",
    "ManualOnlyOutcome",
}

REQUIRED_ELIGIBILITY = {
    "eligible_seeded",
    "eligible_challenge",
    "stale_superseded",
    "replayed_mapping",
    "recovery_required",
    "manual_only",
    "no_access",
}

REQUIRED_COMPONENTS = {
    "ContinuationHeaderBand",
    "CapturedSoFarPanel",
    "ChallengeStepFrame",
    "UploadTrayMobile",
    "MobileProgressStrip",
    "ContinuationSaveStateChip",
    "ContinuationRecoveryBridge",
}

ROUTE_TESTIDS = {
    "Mobile_SMS_Continuation_Route",
    "continuation-header-band",
    "mobile-continuation-progress",
    "continuation-save-state-chip",
    "captured-so-far-panel",
    "challenge-step-frame",
    "challenge-code-input",
    "upload-tray-mobile",
    "upload-file-input",
    "continuation-recovery-bridge",
    "mobile-action-dock",
    "dominant-next-safe-action",
    "continuation-live-region",
}

ATLAS_TESTIDS = {
    "Mobile_SMS_Continuation_Atlas",
    "seeded-vs-challenge-mobile-state-gallery",
    "mobile-flow-storyboard",
    "mobile-flow-storyboard-table",
    "replay-stale-link-mapping-table",
    "same-shell-uplift-return-diagram",
    "diagram-parity-table",
}

PARALLEL_GAP_KEYS = {
    "taskId",
    "missingSurface",
    "expectedOwnerTask",
    "temporaryFallback",
    "riskIfUnresolved",
    "followUpAction",
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
    raise SystemExit(f"[198-mobile-sms-continuation] {message}")


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
    if checklist_state("par_197") != "X":
        fail("par_197 must be complete before validating par_198")
    if checklist_state("par_198") not in {"-", "X"}:
        fail("par_198 must be claimed or complete")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    css = read(CSS)
    app = read(APP)
    contract = read(CONTRACT)

    for token in REQUIRED_PROJECTION_TOKENS:
        if token not in model:
            fail(f"model missing projection token {token}")
        if token not in contract:
            fail(f"contract missing projection token {token}")
    for screen in REQUIRED_SCREEN_FAMILIES:
        if screen not in model:
            fail(f"model missing screen family {screen}")
        if screen not in contract:
            fail(f"contract missing screen family {screen}")
    for eligibility in REQUIRED_ELIGIBILITY:
        if eligibility not in model:
            fail(f"model missing eligibility {eligibility}")
        if eligibility not in contract:
            fail(f"contract missing eligibility {eligibility}")
    for component in REQUIRED_COMPONENTS:
        if component not in route:
            fail(f"route missing reusable primitive {component}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing testid {testid}")
    for token in ["isMobileSmsContinuationPath", "MobileSmsContinuationApp"]:
        if token not in app:
            fail(f"App.tsx missing mobile continuation gate {token}")
    mobile_branch = app.find("if (isMobileSmsContinuationPath")
    portal_branch = app.find("if (isAuthenticatedHomeStatusTrackerPath")
    if mobile_branch < 0 or portal_branch < 0 or mobile_branch > portal_branch:
        fail("mobile SMS continuation gate must run before broad portal route")
    for forbidden in ["URLSearchParams", "location.search"]:
        if forbidden in model or forbidden in route:
            fail(f"continuation resolver must not derive state from {forbidden}")
    for token in [
        "revealsSeededContext: false",
        "secondPathForbidden: true",
        "duplicateMapsToSettledPath",
        "canonicalPhase1Semantics",
        "sessionStorage",
        "aria-live=\"polite\"",
        "same mobile shell",
    ]:
        if token not in model and token not in route:
            fail(f"source missing behavior token {token}")
    lower_css = css.lower()
    for token in [
        "#f8fafc",
        "#ffffff",
        "#eef4ff",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7e1f0",
        "#2f6fed",
        "#5b61f6",
        "#0f766e",
        "#b7791f",
        "#b42318",
        "max-width: 430px",
        "padding: 16px",
        "min-block-size: 56px",
        "min-block-size: 68px",
        "prefers-reduced-motion: reduce",
      ]:
        if token not in lower_css:
            fail(f"CSS missing mobile layout or palette token {token}")


def validate_docs_data_and_gaps() -> None:
    for path in [ARCH_DOC, ATLAS, FLOW, CONTRACT, ENTRY_MATRIX, STEP_CASES, VISIBILITY_TABLE]:
        if "198" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not reference task 198")

    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in ["Mobile_Continuation_Pulse", "table", "storyboard", "data-ready"]:
        if token not in atlas:
            fail(f"atlas missing token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "Mobile_Continuation_Pulse":
        fail("contract has wrong visual mode")
    if set(contract.get("screenFamilies", [])) != REQUIRED_SCREEN_FAMILIES:
        fail("contract screen family coverage drifted")
    if set(contract.get("eligibilityStates", [])) != REQUIRED_ELIGIBILITY:
        fail("contract eligibility coverage drifted")
    privacy = contract.get("privacyLaw", {})
    if privacy.get("challengeShowsPreExistingDetailBeforeSuccess") is not False:
        fail("contract must forbid challenge detail before success")
    if privacy.get("seededContextRequiresSettledEligibilityAndHandsetVerified") is not True:
        fail("contract must gate seeded context behind handset verification")
    same_shell = contract.get("sameShellLaw", {})
    if same_shell.get("replayCreatesSecondContinuationPath") is not False:
        fail("contract must forbid replay second path")
    layout = contract.get("layoutContract", {})
    if layout.get("maxWidthPx") != 430 or layout.get("sidePaddingPx") != 16:
        fail("contract mobile layout dimensions drifted")

    with ENTRY_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    seen_screens = {row["screen_family"] for row in rows}
    if not REQUIRED_SCREEN_FAMILIES.issubset(seen_screens):
        fail("entry matrix missing required screen families")
    replay = next(row for row in rows if row["entry_case"] == "replay_duplicate")
    if replay["redemption_state"] != "duplicate" or replay["second_path_forbidden"] != "true":
        fail("replay duplicate must map duplicate state and forbid second path")

    with VISIBILITY_TABLE.open(newline="", encoding="utf-8") as handle:
        visibility_rows = list(csv.DictReader(handle))
    for family in ["ChallengeContinuationLanding", "ChallengeQuestionStep"]:
        row = next(item for item in visibility_rows if item["screen_family"] == family)
        if (
            row["may_show_safe_captured_context"] != "false"
            or row["shows_patient_detail_before_challenge"] != "false"
        ):
            fail(f"{family} must be zero-detail before challenge success")
    manual = next(item for item in visibility_rows if item["screen_family"] == "ManualOnlyOutcome")
    if manual["manual_only_redeemable"] != "false":
        fail("manual-only outcome must not be redeemable")

    cases = load_json(STEP_CASES)
    case_ids = {case["caseId"] for case in cases.get("cases", [])}
    for case_id in [
        "SEEDED_REFRESH_PRESERVES_STEP",
        "UPLOAD_REFRESH_PRESERVES_TRAY",
        "SIGN_IN_UPLIFT_RETURNS_SAME_SHELL",
        "STALE_LINK_BRIDGES_NOT_HOME",
        "REPLAY_DUPLICATE_MAPS_SETTLED",
    ]:
        if case_id not in case_ids:
            fail(f"step/replay cases missing {case_id}")
    for forbidden in [
        "challenge shows pre-existing detail before challenge success",
        "replay duplicate creates a second continuation path",
        "sign-in uplift or stale recovery drops to generic home",
        "upload becomes hidden or tertiary on mobile",
        "save or progress affordance disappears",
    ]:
        if forbidden not in cases.get("forbidden", []):
            fail(f"step/replay cases missing forbidden rule {forbidden}")

    parallel_gap = load_json(PARALLEL_GAP)
    if PARALLEL_GAP_KEYS.difference(parallel_gap):
        fail("parallel interface gap missing shared-contract keys")
    if parallel_gap.get("taskId") != "par_198":
        fail("parallel interface gap has wrong taskId")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_198":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "Mobile_SMS_Continuation_Atlas",
        "Mobile_SMS_Continuation_Route",
        "SeededContinuationLanding",
        "ChallengeContinuationLanding",
        "ChallengeQuestionStep",
        "ReplayMappedOutcome",
        "StaleLinkRecoveryBridge",
        "ManualOnlyOutcome",
        "captured-so-far-panel",
        "challenge-code-input",
        "upload-file-input",
        "continuation-save-state-chip",
        "mobile-continuation-progress",
        "dominant-next-safe-action",
        "aria-valuenow",
        "prefers-reduced-motion",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_mobile_sms_continuation_flow.py"
    if scripts.get("validate:mobile-sms-continuation-flow") != expected:
        fail("package.json missing validate:mobile-sms-continuation-flow script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:mobile-sms-continuation-flow": "python3 ./tools/analysis/validate_mobile_sms_continuation_flow.py"' not in root_updates:
        fail("root_script_updates missing validate:mobile-sms-continuation-flow")
    required_chain = (
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
    for script_name in ("bootstrap", "check"):
        if required_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing mobile SMS continuation validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing mobile SMS continuation validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_data_and_gaps()
    validate_playwright_spec()
    validate_scripts()
    print("[198-mobile-sms-continuation] validation passed")


if __name__ == "__main__":
    main()
