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

MODEL = ROOT / "apps" / "patient-web" / "src" / "contact-truth-preference-ui.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "contact-truth-preference-ui.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "contact-truth-preference-ui.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "200_contact_claim_visibility_and_preference_separation_ui.md"
ATLAS = ROOT / "docs" / "frontend" / "200_contact_truth_and_preference_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "200_contact_truth_source_and_repair_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "200_contact_truth_surface_contract.json"
EDIT_MATRIX = ROOT / "data" / "analysis" / "200_contact_source_editability_and_repair_matrix.csv"
BLOCKER_CASES = ROOT / "data" / "analysis" / "200_reachability_blocker_visibility_cases.json"
PLAYWRIGHT_SPEC = (
    ROOT
    / "tests"
    / "playwright"
    / "200_contact_claim_visibility_and_preference_separation_ui.spec.ts"
)

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_SEPARATE_SOURCE_FAMILIES.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_NHS_LOGIN_VIEW_ONLY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_REACHABILITY_AUTHORITY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_BLOCKER_PROMOTION.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_PREFERENCE_SIDE_EFFECTS.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_CONTACT_TRUTH_EXTERNAL_SOURCE_ABSENCE.json",
]

PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE2_CONTACT_VISIBILITY.json"

REQUIRED_PROJECTION_TOKENS = {
    "ContactTruthWorkspaceRouteProjection",
    "ContactTruthWorkspaceResolver",
    "SourceTruthDescriptor",
    "PatientPreferenceStateProjection",
    "DemographicSourceProjection",
    "ContactSourceProvenanceDescriptor",
    "PatientReachabilitySummaryProjection",
    "PatientContactRepairProjection",
    "PatientNavReturnContract",
    "PatientActionRecoveryProjection",
}

REQUIRED_COMPONENTS = {
    "AccountDetailsHeader",
    "ProvenanceBadgeRow",
    "SourceTruthCard",
    "PreferenceLedgerCard",
    "DemographicSourceCard",
    "ReachabilityRiskPanel",
    "ContactRepairEntryCard",
}

ROUTE_TESTIDS = {
    "Contact_Truth_Preference_Route",
    "account-details-header",
    "source-truth-card-nhs-login",
    "preference-ledger-card",
    "demographic-source-card-pds",
    "demographic-source-card-gp",
    "provenance-badge-row-nhs-login",
    "provenance-badge-row-vecells-preferences",
    "provenance-badge-row-pds",
    "provenance-badge-row-gp-system",
    "reachability-risk-panel",
    "contact-repair-entry-card",
    "preference-review-action",
    "contact-repair-action",
    "contact-return-action",
    "contact-truth-live-region",
}

ATLAS_TESTIDS = {
    "Contact_Truth_Preference_Atlas",
    "source-of-truth-comparison-board",
    "source-of-truth-comparison-table",
    "editability-matrix",
    "editability-matrix-table",
    "reachability-blocker-gallery",
    "reachability-blocker-table",
    "repair-return-flow-diagram",
    "repair-return-flow-table",
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
    raise SystemExit(f"[200-contact-truth-preference-ui] {message}")


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
    if checklist_state("par_199") != "X":
        fail("par_199 must be complete before validating par_200")
    if checklist_state("par_200") not in {"-", "X"}:
        fail("par_200 must be claimed or complete")


def validate_source() -> None:
    model = read(MODEL)
    route = read(ROUTE)
    css = read(CSS)
    app = read(APP)
    contract_text = read(CONTRACT)

    for token in REQUIRED_PROJECTION_TOKENS:
        if token not in model:
            fail(f"model missing projection token {token}")
        if token not in contract_text:
            fail(f"contract missing projection token {token}")
    for component in REQUIRED_COMPONENTS:
        if f"function {component}" not in route and f"export function {component}" not in route:
            fail(f"route missing component {component}")
        if component not in contract_text:
            fail(f"contract missing component or UI region {component}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing testid {testid}")

    for source_family in ["nhs_login_claim", "vecells_preference", "external_demographic"]:
        if source_family not in model or source_family not in contract_text or source_family not in route:
            fail(f"source family {source_family} is not carried through model, route, and contract")

    for token in [
        "editableHere: false",
        "editableHere: true",
        "external_nhs_login",
        "vecells_patient_preference",
        "external_pds",
        "external_gp_system",
        "noExternalWriteSideEffects: true",
        "noPreferenceSideEffects: true",
        "does not update NHS login",
        "PDS demographic rows",
        "GP demographic rows",
        "Vecells communication behavior only",
        "View-only source",
        "Editable preference",
        "External demographic row",
    ]:
        if token not in model and token not in route and token not in contract_text:
            fail(f"source separation or side-effect token missing: {token}")

    for token in [
        "Source",
        "Freshness",
        "Edit authority",
        "editAuthorityLabel",
        "provenanceTestId",
        "aria-label={`${provenance.sourceLabel} provenance`}",
    ]:
        if token not in model and token not in route:
            fail(f"provenance text token missing: {token}")

    for token in [
        "blocksActivePath",
        "promotedToVisiblePanel",
        "hiddenInDisclosureForbidden: true",
        "data-promoted-to-visible-panel",
        'role={risk.blocksActivePath ? "alert" : "status"}',
        "affectedChannels",
        "callback",
        "reply",
        "reminder",
        "sameShellRequired: true",
        "blockedActionContextPreserved: true",
        "data-return-target",
        "reply-window",
    ]:
        if token not in model and token not in route and token not in contract_text:
            fail(f"reachability repair token missing: {token}")

    for token in [
        "featureGate",
        "gated_off",
        "absenceExplanation",
        "No value is inferred",
        "feature-gated off",
        "unavailable",
    ]:
        if token not in model and token not in route and token not in contract_text:
            fail(f"external absence token missing: {token}")

    for token in [
        "isContactTruthPreferencePath",
        "ContactTruthPreferenceApp",
        "contact-truth-preference-ui.css",
    ]:
        if token not in app:
            fail(f"App.tsx missing contact route gate token {token}")
    contact_branch = app.find("if (isContactTruthPreferencePath")
    portal_branch = app.find("if (isAuthenticatedHomeStatusTrackerPath")
    if contact_branch < 0 or portal_branch < 0 or contact_branch > portal_branch:
        fail("contact truth route gate must run before broad authenticated portal route")

    lower_css = css.lower()
    for token in [
        "#f8fafc",
        "#ffffff",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7dfea",
        "#2463eb",
        "#6d4cff",
        "#0f766e",
        "#b7791f",
        "#b42318",
        "grid-template-columns: minmax(0, 1fr) minmax(280px, 320px)",
        "inline-size: min(100%, 1280px)",
        "padding: 24px",
        "min-block-size: 220px",
        "grid-template-columns: repeat(2, minmax(280px, 1fr))",
        "order: -1",
        "prefers-reduced-motion: reduce",
    ]:
        if token not in lower_css:
            fail(f"CSS missing layout or palette token {token}")


def validate_docs_data_and_gaps() -> None:
    for path in [ARCH_DOC, ATLAS, FLOW, CONTRACT, EDIT_MATRIX, BLOCKER_CASES]:
        if "200" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not reference task 200")

    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in [
        "Contact_Truth_Ledger",
        "Source-of-truth comparison board",
        "Editability matrix",
        "Reachability blocker gallery",
        "Repair-return flow diagram",
        "data-ready",
        "<table",
    ]:
        if token not in atlas:
            fail(f"atlas missing parity or visual token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "Contact_Truth_Ledger":
        fail("contract has wrong visual mode")
    if set(contract.get("reusablePrimitives", [])) != (
        REQUIRED_COMPONENTS - {"AccountDetailsHeader"}
    ):
        fail("contract reusable primitive coverage drifted")
    if set(contract.get("requiredUiRegions", [])) != REQUIRED_COMPONENTS:
        fail("contract UI region coverage drifted")
    if contract.get("layoutContract", {}).get("pageMaxWidthPx") != 1280:
        fail("layout contract page max width drifted")
    if contract.get("reachabilityLaw", {}).get("blockingActivePathPromotesPanel") is not True:
        fail("contract must promote active reachability blockers")
    if contract.get("provenanceLaw", {}).get("colorOnlyProvenanceForbidden") is not True:
        fail("contract must forbid color-only provenance")

    families = contract.get("sourceFamilies", {})
    if families.get("nhs_login_claim", {}).get("editableHere") is not False:
        fail("NHS login source must be view-only")
    if families.get("vecells_preference", {}).get("editableHere") is not True:
        fail("Vecells preference source must be editable/reviewable")
    if families.get("external_demographic", {}).get("editableHere") is not False:
        fail("external demographic source must not be edited here")

    with EDIT_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    by_family = {row["source_family"]: row for row in rows}
    for family in ["nhs_login_claim", "vecells_preference", "external_demographic"]:
        if family not in by_family:
            fail(f"editability matrix missing {family}")
    if by_family["nhs_login_claim"]["editable_here"] != "false":
        fail("editability matrix lets NHS login be edited here")
    if by_family["vecells_preference"]["editable_here"] != "true":
        fail("editability matrix does not let preferences be reviewed here")
    if not any(row["repair_visibility"] == "promoted_visible_panel" for row in rows):
        fail("editability matrix missing promoted repair visibility")

    cases = load_json(BLOCKER_CASES)
    case_ids = {case["caseId"] for case in cases.get("cases", [])}
    for case_id in [
        "LEDGER_NO_BLOCKER",
        "REPLY_WINDOW_CONTACT_REPAIR_REQUIRED",
        "EXTERNAL_SOURCES_GATED_OFF",
    ]:
        if case_id not in case_ids:
            fail(f"blocker cases missing {case_id}")
    repair_case = next(
        case for case in cases["cases"] if case["caseId"] == "REPLY_WINDOW_CONTACT_REPAIR_REQUIRED"
    )
    if repair_case.get("promotedToVisiblePanel") is not True:
        fail("repair case must promote blocker panel")
    if repair_case.get("sameShellReturnRequired") is not True:
        fail("repair case must require same-shell return")
    for forbidden in [
        "NHS login contact claims merged with Vecells preferences",
        "Vecells preference edits imply NHS login/PDS/GP updates",
        "blocking callback, reply, or reminder repair hidden in disclosure",
        "PDS or GP absence silently omitted",
        "provenance communicated by color only",
    ]:
        if forbidden not in cases.get("forbidden", []):
            fail(f"blocker cases missing forbidden rule {forbidden}")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_200":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")

    parallel_gap = load_json(PARALLEL_GAP)
    missing_parallel = PARALLEL_GAP_KEYS.difference(parallel_gap)
    if missing_parallel:
        fail(f"{PARALLEL_GAP.relative_to(ROOT)} missing keys {sorted(missing_parallel)}")
    if parallel_gap.get("expectedOwnerTask") != "par_201":
        fail("parallel gap must point to par_201")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "Contact_Truth_Preference_Atlas",
        "Contact_Truth_Preference_Route",
        "source-truth-card-nhs-login",
        "preference-ledger-card",
        "demographic-source-card-pds",
        "demographic-source-card-gp",
        "preference-review-action",
        "reachability-risk-panel",
        "contact-repair-entry-card",
        "contact-repair-action",
        "contact-return-action",
        "contact-truth-live-region",
        "prefers-reduced-motion",
        "provenance-badge-row",
        "1280",
        "390",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_contact_truth_and_preference_ui.py"
    if scripts.get("validate:contact-truth-preference-ui") != expected:
        fail("package.json missing validate:contact-truth-preference-ui script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if (
        '"validate:contact-truth-preference-ui": '
        '"python3 ./tools/analysis/validate_contact_truth_and_preference_ui.py"'
        not in root_updates
    ):
        fail("root_script_updates missing validate:contact-truth-preference-ui")
    required_chain = (
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
            fail(f"package.json {script_name} missing contact truth validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing contact truth validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_data_and_gaps()
    validate_playwright_spec()
    validate_scripts()
    print("[200-contact-truth-preference-ui] validation passed")


if __name__ == "__main__":
    main()
