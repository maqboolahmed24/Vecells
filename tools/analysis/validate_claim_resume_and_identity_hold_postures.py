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

MODEL = ROOT / "apps" / "patient-web" / "src" / "claim-resume-identity-hold.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "claim-resume-identity-hold.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "claim-resume-identity-hold.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "197_request_claim_resume_and_identity_hold_postures.md"
SECURITY_DOC = ROOT / "docs" / "security" / "197_access_narrowing_hold_and_resume_privacy_rules.md"
ATLAS = ROOT / "docs" / "frontend" / "197_claim_resume_and_identity_hold_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "197_same_shell_claim_and_rebind_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "197_patient_claim_resume_surface_contract.json"
POSTURE_MATRIX = ROOT / "data" / "analysis" / "197_access_posture_and_reason_code_matrix.csv"
REPLAY_CASES = ROOT / "data" / "analysis" / "197_refresh_replay_and_stale_grant_cases.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE2_CLAIM_RESUME.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "197_request_claim_resume_and_identity_hold_postures.spec.ts"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_SAME_SHELL_CONTINUITY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_DISTINCT_REASON_POSTURES.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_REPLAY_SETTLED_MAPPING.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_PROMOTED_DRAFT_TRUTH.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_HOLD_PRIVACY_GATE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_UNIFIED_RECOVERY_FAMILY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CLAIM_RESUME_COPY_PACK.json",
]

REQUIRED_RESOLVER_TOKENS = {
    "ClaimResumePostureResolver",
    "PostAuthReturnIntent",
    "RouteIntentBinding",
    "AccessGrantScopeEnvelope",
    "AccessGrantRedemptionRecord",
    "AccessGrantSupersessionRecord",
    "PatientActionRecoveryProjection",
    "PatientIdentityHoldProjection",
    "PatientAudienceCoverageProjection",
    "PatientRequestReturnBundle",
}

REQUIRED_POSTURES = {
    "claim_pending",
    "claim_confirmed",
    "read_only",
    "recover_only",
    "identity_hold",
    "rebind_required",
    "stale_link_mapped",
    "stale_grant_mapped",
    "support_recovery_required",
    "wrong_patient_freeze",
    "promoted_draft_mapped",
}

REQUIRED_COMPONENTS = {
    "ClaimPendingFrame",
    "ReadOnlyReturnFrame",
    "IdentityHoldBridge",
    "RebindRequiredBridge",
    "StaleGrantMappedOutcomeCard",
    "ContinuityContextPanel",
}

ROUTE_TESTIDS = {
    "Claim_Resume_Identity_Hold_Route",
    "continuity-context-panel",
    "claim-pending-progress",
    "dominant-next-safe-action",
    "privacy-boundary-strip",
    "claim-resume-live-region",
    "posture-${posture.postureKey}",
}

ATLAS_TESTIDS = {
    "Claim_Resume_Identity_Hold_Atlas",
    "posture-state-board-gallery",
    "reason-code-ui-matrix",
    "same-shell-transition-diagram",
    "stale-grant-mapping-table",
    "diagram-parity-table",
}

GAP_KEYS = {
    "taskId",
    "sourceAmbiguity",
    "decisionTaken",
    "whyThisFitsTheBlueprint",
    "operationalRisk",
    "followUpIfPolicyChanges",
}

PARALLEL_GAP_KEYS = {
    "taskId",
    "missingSurface",
    "expectedOwnerTask",
    "temporaryFallback",
    "riskIfUnresolved",
    "followUpAction",
}


def fail(message: str) -> None:
    raise SystemExit(f"[197-claim-resume-identity-hold] {message}")


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
    if checklist_state("par_196") != "X":
        fail("par_196 must be complete before validating par_197")
    if checklist_state("par_197") not in {"-", "X"}:
        fail("par_197 must be claimed or complete")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    css = read(CSS)
    app = read(APP)
    contract = read(CONTRACT)

    for token in REQUIRED_RESOLVER_TOKENS:
        if token not in model:
            fail(f"model missing resolver token {token}")
        if token not in contract:
            fail(f"contract missing token {token}")
    for posture in REQUIRED_POSTURES:
        if posture not in model:
            fail(f"model missing posture {posture}")
        if posture not in contract:
            fail(f"contract missing posture {posture}")
    for component in REQUIRED_COMPONENTS:
        if component not in route:
            fail(f"route missing component {component}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing testid {testid}")
    for token in ["isClaimResumeIdentityHoldPath", "ClaimResumeIdentityHoldApp"]:
        if token not in app:
            fail(f"App.tsx missing route gate {token}")
    claim_branch = app.find("if (isClaimResumeIdentityHoldPath")
    portal_branch = app.find("if (isAuthenticatedHomeStatusTrackerPath")
    if claim_branch < 0 or portal_branch < 0 or claim_branch > portal_branch:
        fail("claim/resume route gate must run before broad /portal route")
    for forbidden in ["URLSearchParams", "location.search"]:
        if forbidden in model or forbidden in route:
            fail(f"claim resolver must not derive posture from {forbidden}")
    for token in [
        "summary_only",
        "secondPathForbidden: true",
        "patientCopyDisallowsJargon: true",
        "sessionStorage",
        "aria-live=\"polite\"",
    ]:
        if token not in model and token not in route:
            fail(f"source missing behavior token {token}")
    for token in [
        "--claim-read-only: #2f6fed",
        "--claim-hold: #b42318",
        "max-width: 1360px",
        "minmax(0, 760px) 320px",
        "prefers-reduced-motion: reduce",
    ]:
        if token not in css:
            fail(f"CSS missing token {token}")
    if "--claim-read-only" not in css or "--claim-hold" not in css:
        fail("read-only and hold states must have distinct visual tokens")


def validate_docs_data_and_gaps() -> None:
    for path in [ARCH_DOC, SECURITY_DOC, ATLAS, FLOW, CONTRACT, POSTURE_MATRIX, REPLAY_CASES]:
        if "197" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not reference task 197")

    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in ["Continuity_Bridge_Atlas", "diagram", "table", "data-ready"]:
        if token not in atlas:
            fail(f"atlas missing token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "Continuity_Bridge_Atlas":
        fail("contract has wrong visual mode")
    if set(contract.get("postures", [])) != REQUIRED_POSTURES:
        fail("contract posture coverage drifted")
    if contract.get("sameShellLaw", {}).get("genericRedirectForbiddenWhenSameLineageRecoverable") is not True:
        fail("contract must forbid generic redirects for recoverable same-lineage claims")

    with POSTURE_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    if {row["posture_key"] for row in rows} != REQUIRED_POSTURES:
        fail("posture matrix coverage drifted")
    read_only = next(row for row in rows if row["posture_key"] == "read_only")
    identity_hold = next(row for row in rows if row["posture_key"] == "identity_hold")
    if read_only["accent"] == identity_hold["accent"]:
        fail("read-only and identity-hold postures must be visually distinct")
    for row in rows:
        if row["posture_key"] in {"identity_hold", "rebind_required", "wrong_patient_freeze"}:
            if row["max_visible_detail"] != "summary_only" or row["writable_allowed"] != "false":
                fail(f"{row['posture_key']} must be summary-only and non-writable")

    replay_cases = load_json(REPLAY_CASES)
    case_ids = {case["caseId"] for case in replay_cases.get("cases", [])}
    for case_id in [
        "SIGN_IN_RETURN_SAME_SHELL",
        "CLAIM_PENDING_BEFORE_DETAIL_UNLOCK",
        "READ_ONLY_NARROWED_SCOPE",
        "IDENTITY_HOLD_SUPPRESSES_PHI",
        "WRONG_PATIENT_FREEZE_SAFE_CONTEXT",
        "DUPLICATE_REDEMPTION_REPLAY",
        "PROMOTED_DRAFT_STALE_LINK",
        "REFRESH_PRESERVES_HOLD_POSTURE",
        "CROSS_DEVICE_REPLAY_SAME_SETTLED_RESULT",
    ]:
        if case_id not in case_ids:
            fail(f"replay cases missing {case_id}")
    for forbidden in [
        "generic landing page while same-lineage recovery is available",
        "PHI-bearing context during identity_hold or rebind_required",
        "stale grant opening a second claim path",
        "promoted draft token reopening mutable editing",
    ]:
        if forbidden not in replay_cases.get("forbidden", []):
            fail(f"replay cases missing forbidden rule {forbidden}")

    parallel_gap = load_json(PARALLEL_GAP)
    if PARALLEL_GAP_KEYS.difference(parallel_gap):
        fail("parallel gap missing shared-contract keys")
    if parallel_gap.get("taskId") != "par_197":
        fail("parallel gap has wrong taskId")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_197":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "aria-current",
        "Claim_Resume_Identity_Hold_Atlas",
        "Claim_Resume_Identity_Hold_Route",
        "posture-claim_pending",
        "posture-read_only",
        "posture-identity_hold",
        "posture-rebind_required",
        "posture-stale_grant_mapped",
        "wrong_patient_freeze",
        "summary_only",
        "dominant-next-safe-action",
        "claim-resume-live-region",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_claim_resume_and_identity_hold_postures.py"
    if scripts.get("validate:claim-resume-identity-hold") != expected:
        fail("package.json missing validate:claim-resume-identity-hold script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:claim-resume-identity-hold": "python3 ./tools/analysis/validate_claim_resume_and_identity_hold_postures.py"' not in root_updates:
        fail("root_script_updates missing validate:claim-resume-identity-hold")
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
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for script_name in ("bootstrap", "check"):
        if required_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing claim/resume validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing claim/resume validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_data_and_gaps()
    validate_playwright_spec()
    validate_scripts()
    print("[197-claim-resume-identity-hold] validation passed")


if __name__ == "__main__":
    main()
