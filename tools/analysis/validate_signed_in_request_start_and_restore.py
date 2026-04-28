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

MODEL = ROOT / "apps" / "patient-web" / "src" / "signed-in-request-start-restore.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "signed-in-request-start-restore.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "signed-in-request-start-restore.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "199_signed_in_request_creation_and_saved_context_restore.md"
ATLAS = ROOT / "docs" / "frontend" / "199_signed_in_request_start_and_restore_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "199_signed_in_request_start_restore_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "199_signed_in_request_start_surface_contract.json"
RESTORE_MATRIX = ROOT / "data" / "analysis" / "199_saved_context_restore_and_promotion_mapping_matrix.csv"
CONTINUITY_CASES = ROOT / "data" / "analysis" / "199_authenticated_entry_and_draft_continuity_cases.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "199_signed_in_request_creation_and_saved_context_restore.spec.ts"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_CANONICAL_INTAKE_STACK.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_AUTHORITATIVE_RESTORE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_PINNED_QUESTION_CONTRACTS.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_PROMOTED_MAPS_TO_TRUTH.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_SELECTED_ANCHOR_RETURN.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_QUIET_ACCOUNT_DISCLOSURE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNED_IN_START_COPY_PACK.json",
]

REQUIRED_PROJECTION_TOKENS = {
    "SignedInRequestEntryResolver",
    "SavedContextResolver",
    "SubmissionEnvelope",
    "DraftSessionLease",
    "DraftContinuityEvidenceProjection",
    "RouteIntentBinding",
    "RecoveryContinuationToken",
    "PatientPortalEntryProjection",
    "PatientHomeProjection",
    "PatientNavReturnContract",
    "PatientRequestReturnBundle",
    "PatientActionRecoveryProjection",
    "PatientAudienceCoverageProjection",
    "PatientIdentityHoldProjection",
}

REQUIRED_SCREENS = {
    "SignedInStartRequestEntry",
    "ContinueDraftEntry",
    "SavedContextRestoreEntry",
    "PromotedDraftMappedOutcome",
    "AuthenticatedAccountDisclosure",
}

REQUIRED_COMPONENTS = {
    "SavedContextCard",
    "SignedInMissionFrame",
    "RestoreDecisionNotice",
    "DraftContinuitySummary",
    "AuthenticatedAccountDisclosure",
}

ROUTE_TESTIDS = {
    "Signed_In_Request_Start_Restore_Route",
    "signed-in-mission-top-band",
    "screen-${screen.screenKey}",
    "signed-in-start-request-action",
    "continue-draft-entry-action",
    "saved-context-card",
    "restore-decision-notice",
    "draft-continuity-summary",
    "promoted-draft-mapped-outcome",
    "authenticated-account-disclosure",
    "signed-in-start-live-region",
}

ATLAS_TESTIDS = {
    "Signed_In_Request_Start_Restore_Atlas",
    "start-versus-continue-gallery",
    "start-versus-continue-table",
    "saved-context-restore-board",
    "saved-context-restore-list",
    "promoted-draft-mapping-table",
    "authenticated-home-to-intake-diagram",
    "continuity-diagram-parity-table",
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
    raise SystemExit(f"[199-signed-in-start-restore] {message}")


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
    if checklist_state("par_198") != "X":
        fail("par_198 must be complete before validating par_199")
    if checklist_state("par_199") not in {"-", "X"}:
        fail("par_199 must be claimed or complete")


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
    for screen in REQUIRED_SCREENS:
        if screen not in model and screen not in route:
            fail(f"source missing screen {screen}")
        if screen not in contract:
            fail(f"contract missing screen {screen}")
    for component in REQUIRED_COMPONENTS:
        if component not in route:
            fail(f"route missing component {component}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing testid {testid}")
    for token in ["isSignedInRequestStartPath", "SignedInRequestStartRestoreApp"]:
        if token not in app:
            fail(f"App.tsx missing signed-in route gate {token}")
    signed_branch = app.find("if (isSignedInRequestStartPath")
    portal_branch = app.find("if (isAuthenticatedHomeStatusTrackerPath")
    if signed_branch < 0 or portal_branch < 0 or signed_branch > portal_branch:
        fail("signed-in start route gate must run before broad portal route")
    for token in [
        "secondAuthenticatedIntakeModelForbidden: true",
        "localCacheOnlyRestoreForbidden: true",
        "opensDraftForEditing: false",
        "accountDisclosureDominatesIntake: false",
        "par_197 ClaimResumePostureResolver",
        "/start-request/",
        "sessionStorage",
        "aria-live=\"polite\"",
    ]:
        if token not in model and token not in route:
            fail(f"source missing behavior token {token}")
    lower_css = css.lower()
    for token in [
        "#f8fafc",
        "#ffffff",
        "#eef2f7",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7dfea",
        "#3158e0",
        "#5b61f6",
        "#0f766e",
        "#b7791f",
        "#b42318",
        "min-block-size: 64px",
        "minmax(0, 760px)",
        "minmax(280px, 320px)",
        "1440px",
        "prefers-reduced-motion: reduce",
      ]:
        if token not in lower_css:
            fail(f"CSS missing layout or palette token {token}")


def validate_docs_data_and_gaps() -> None:
    for path in [ARCH_DOC, ATLAS, FLOW, CONTRACT, RESTORE_MATRIX, CONTINUITY_CASES]:
        if "199" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not reference task 199")
    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in ["SignedIn_Mission_Frame", "table", "gallery", "data-ready"]:
        if token not in atlas:
            fail(f"atlas missing token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "SignedIn_Mission_Frame":
        fail("contract has wrong visual mode")
    if set(contract.get("reusablePrimitives", [])) != REQUIRED_COMPONENTS:
        fail("contract reusable primitive coverage drifted")
    intake_law = contract.get("canonicalIntakeLaw", {})
    if intake_law.get("secondAuthenticatedIntakeModelForbidden") is not True:
        fail("contract must forbid a second authenticated intake model")
    if intake_law.get("localCacheOnlyRestoreForbidden") is not True:
        fail("contract must forbid cache-only restore")
    if not str(intake_law.get("canonicalPhase1TargetPrefix", "")).startswith("/start-request/"):
        fail("contract must target canonical start-request path")
    promotion_law = contract.get("promotionLaw", {})
    if promotion_law.get("promotedDraftReopensForEditing") is not False:
        fail("promoted drafts must not reopen editing")
    layout = contract.get("layoutContract", {})
    if layout.get("topShellBandPx") != 64 or layout.get("mainQuestionCanvasMaxWidthPx") != 760:
        fail("layout contract dimensions drifted")

    with RESTORE_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    modes = {row["entry_mode"] for row in rows}
    for mode in [
        "start_new",
        "continue_draft",
        "saved_context_restore",
        "post_auth_return",
        "promoted_draft_mapped",
        "narrowed_write_posture",
    ]:
        if mode not in modes:
            fail(f"restore matrix missing mode {mode}")
    promoted = next(row for row in rows if row["entry_mode"] == "promoted_draft_mapped")
    if promoted["opens_draft_for_editing"] != "false" or not promoted["canonical_target"].startswith("/portal/requests/"):
        fail("promoted draft row must map to request truth without editing")
    for row in rows:
        if row["account_disclosure_dominates"] != "false":
            fail(f"account disclosure dominates for {row['entry_mode']}")

    cases = load_json(CONTINUITY_CASES)
    case_ids = {case["caseId"] for case in cases.get("cases", [])}
    for case_id in [
        "SIGNED_IN_START_USES_CANONICAL_INTAKE",
        "CONTINUE_DRAFT_RESTORES_STEP_ANCHOR",
        "POST_AUTH_RETURN_RESTORES_FILES_STEP",
        "PROMOTED_DRAFT_MAPS_TO_REQUEST_TRUTH",
        "NARROWED_WRITE_DEFERS_TO_PAR_197",
    ]:
        if case_id not in case_ids:
            fail(f"continuity cases missing {case_id}")
    for forbidden in [
        "authenticated start enters a second logged-in form system",
        "saved-context restore relies on local cache alone",
        "refresh or post-auth return loses selected anchor",
        "promoted draft reopens for editing",
        "account disclosure dominates the request task",
    ]:
        if forbidden not in cases.get("forbidden", []):
            fail(f"continuity cases missing forbidden rule {forbidden}")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_199":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "Signed_In_Request_Start_Restore_Atlas",
        "Signed_In_Request_Start_Restore_Route",
        "SignedInStartRequestEntry",
        "ContinueDraftEntry",
        "SavedContextRestoreEntry",
        "PromotedDraftMappedOutcome",
        "signed-in-start-request-action",
        "continue-draft-entry-action",
        "saved-context-card",
        "restore-decision-notice",
        "promoted-draft-mapped-outcome",
        "authenticated-account-disclosure",
        "patient-intake-mission-frame-root",
        "patient-intake-files-step",
        "aria-live",
        "prefers-reduced-motion",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_signed_in_request_start_and_restore.py"
    if scripts.get("validate:signed-in-request-start-restore") != expected:
        fail("package.json missing validate:signed-in-request-start-restore script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:signed-in-request-start-restore": "python3 ./tools/analysis/validate_signed_in_request_start_and_restore.py"' not in root_updates:
        fail("root_script_updates missing validate:signed-in-request-start-restore")
    required_chain = (
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
            fail(f"package.json {script_name} missing signed-in start validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing signed-in start validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_data_and_gaps()
    validate_playwright_spec()
    validate_scripts()
    print("[199-signed-in-start-restore] validation passed")


if __name__ == "__main__":
    main()
