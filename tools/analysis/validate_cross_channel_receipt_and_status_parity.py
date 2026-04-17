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

MODEL = ROOT / "apps" / "patient-web" / "src" / "cross-channel-receipt-status-parity.model.ts"
ROUTE = ROOT / "apps" / "patient-web" / "src" / "cross-channel-receipt-status-parity.tsx"
CSS = ROOT / "apps" / "patient-web" / "src" / "cross-channel-receipt-status-parity.css"
APP = ROOT / "apps" / "patient-web" / "src" / "App.tsx"

ARCH_DOC = ROOT / "docs" / "architecture" / "201_cross_channel_receipt_and_status_parity_surfaces.md"
ATLAS = ROOT / "docs" / "frontend" / "201_cross_channel_receipt_and_status_parity_atlas.html"
FLOW = ROOT / "docs" / "frontend" / "201_receipt_and_status_source_to_surface_flow.mmd"
CONTRACT = ROOT / "data" / "contracts" / "201_receipt_and_status_parity_contract.json"
PARITY_MATRIX = ROOT / "data" / "analysis" / "201_channel_parity_matrix.csv"
DRIFT_CASES = (
    ROOT / "data" / "analysis" / "201_provenance_note_allowlist_and_status_drift_cases.json"
)
PLAYWRIGHT_SPEC = (
    ROOT / "tests" / "playwright" / "201_cross_channel_receipt_and_status_parity_surfaces.spec.ts"
)

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_SHARED_STATUS_GRAMMAR.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_PHONE_PROVENANCE_ADDITIVE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_RECEIPT_DETAIL_SAME_TRUTH.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_LIST_ROW_ALIGNMENT.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_MACHINE_TESTABLE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_PUBLIC_SAFE_COVERAGE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_STATUS_PARITY_CONTACT_VISIBILITY_CONSUMED.json",
]

REQUIRED_COMPONENTS = {
    "ReceiptHero",
    "RequestStatusStrip",
    "RequestStatusSummaryCard",
    "ProvenanceContextChipRow",
    "ReceiptOutcomeBridge",
}

REQUIRED_PROJECTION_TOKENS = {
    "ReceiptParityResolver",
    "PatientReceiptConsistencyEnvelope",
    "PatientReceiptEnvelope",
    "PatientRequestSummaryProjection",
    "PatientRequestDetailProjection",
    "PatientAudienceCoverageProjection",
    "ReceiptStatusSurfaceProjection",
    "ReceiptParityRouteProjection",
}

ROUTE_TESTIDS = {
    "Cross_Channel_Receipt_Status_Parity_Route",
    "receipt-hero",
    "request-status-strip",
    "request-status-summary-card",
    "provenance-context-chip-row",
    "receipt-outcome-bridge",
    "channel-parity-board",
    "parity-list-row-surface",
    "parity-detail-header-surface",
    "signed-out-minimal-status-surface",
    "receipt-status-live-region",
}

ATLAS_TESTIDS = {
    "Cross_Channel_Receipt_Status_Parity_Atlas",
    "side-by-side-channel-comparison-board",
    "side-by-side-channel-comparison-table",
    "source-to-surface-parity-table",
    "source-to-surface-table",
    "provenance-note-gallery",
    "provenance-note-table",
    "receipt-consistency-diagram",
    "receipt-consistency-table",
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
    raise SystemExit(f"[201-cross-channel-receipt-status-parity] {message}")


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
    if checklist_state("par_200") != "X":
        fail("par_200 must be complete before validating par_201")
    if checklist_state("par_201") not in {"-", "X"}:
        fail("par_201 must be claimed or complete")


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
            fail(f"contract missing primitive {component}")
    for testid in ROUTE_TESTIDS:
        if testid not in route:
            fail(f"route missing testid {testid}")

    for token in [
        "web_public",
        "authenticated",
        "phone_origin",
        "sms_continuation",
        "provisional",
        "confirmed",
        "pending_review",
        "awaiting_more_information",
        "blocked",
        "settled",
        "semanticStatusKey",
        "sameStatusMeaningAcrossChannels: true",
        "provenanceNotesArePrimaryStatus: false",
        "additiveOnly: true",
        "primaryStatusForbidden: true",
        "publicSafeNarrowingApplied",
        "publicSafeNarrowingChangesCoreMeaning: false",
        "listRowAgreesWithReceipt: true",
        "detailHeaderAgreesWithReceipt: true",
    ]:
        if token not in model and token not in route and token not in contract_text:
            fail(f"semantic parity token missing: {token}")

    for token in [
        "isCrossChannelReceiptStatusParityPath",
        "CrossChannelReceiptStatusParityApp",
        "cross-channel-receipt-status-parity.css",
    ]:
        if token not in app:
            fail(f"App.tsx missing parity route gate token {token}")
    parity_branch = app.find("if (isCrossChannelReceiptStatusParityPath")
    portal_branch = app.find("if (isAuthenticatedHomeStatusTrackerPath")
    if parity_branch < 0 or portal_branch < 0 or parity_branch > portal_branch:
        fail("receipt/status parity route gate must run before broad authenticated portal route")

    lower_css = css.lower()
    for token in [
        "#f8fafc",
        "#ffffff",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7dfea",
        "#3158e0",
        "#b7791f",
        "#0f766e",
        "#b42318",
        "inline-size: min(100%, 960px)",
        "padding: 32px",
        "min-block-size: 44px",
        "min-block-size: 40px",
        "180ms",
        "140ms",
        "prefers-reduced-motion: reduce",
    ]:
        if token not in lower_css:
            fail(f"CSS missing layout, palette, or motion token {token}")


def validate_docs_data_and_gaps() -> None:
    for path in [ARCH_DOC, ATLAS, FLOW, CONTRACT, PARITY_MATRIX, DRIFT_CASES]:
        if "201" not in read(path):
            fail(f"{path.relative_to(ROOT)} does not reference task 201")

    atlas = read(ATLAS)
    for testid in ATLAS_TESTIDS:
        if testid not in atlas:
            fail(f"atlas missing data-testid {testid}")
    for token in [
        "Parity_Status_Atlas",
        "side-by-side channel comparison board",
        "Source-to-surface parity table",
        "Provenance-note gallery",
        "Receipt-consistency diagram",
        "<table",
        "data-ready",
    ]:
        if token not in atlas:
            fail(f"atlas missing required parity token {token}")

    contract = load_json(CONTRACT)
    if contract.get("visualMode") != "Parity_Status_Atlas":
        fail("contract has wrong visual mode")
    if set(contract.get("reusablePrimitives", [])) != REQUIRED_COMPONENTS:
        fail("contract reusable primitive coverage drifted")
    law = contract.get("statusParityLaw", {})
    if law.get("sameRequestTruthProducesSameStatusMeaning") is not True:
        fail("contract must require same status meaning across channels")
    if law.get("provenanceNotesPrimaryStatusForbidden") is not True:
        fail("contract must forbid provenance as primary status")
    if law.get("publicSafeNarrowingChangesCoreMeaning") is not False:
        fail("contract must keep public-safe narrowing from changing core meaning")

    with PARITY_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    pending_rows = [row for row in rows if row["canonical_status_state"] == "pending_review"]
    if len(pending_rows) < 7:
        fail("parity matrix must cover channel, list, detail, and minimal pending-review rows")
    keys = {row["semantic_status_key"] for row in pending_rows}
    if keys != {"pending_review|within_2_working_days|on_track|not_required"}:
        fail(f"pending-review parity keys drifted: {sorted(keys)}")
    for row in pending_rows:
        if row["status_headline"] != "Your request is being reviewed":
            fail(f"channel {row['channel_context']} drifted status headline")
    if not any(row["canonical_status_state"] == "blocked" for row in rows):
        fail("parity matrix missing blocked recovery posture")

    drift = load_json(DRIFT_CASES)
    for note in drift.get("allowlist", []):
        if note.get("additiveOnly") is not True:
            fail(f"provenance note {note.get('noteId')} is not additive-only")
        if note.get("primaryStatusForbidden") is not True:
            fail(f"provenance note {note.get('noteId')} can become primary status")
    drift_ids = {case["caseId"] for case in drift.get("driftCases", [])}
    for case_id in [
        "PHONE_ONLY_STATUS_WORDING_FORBIDDEN",
        "PROVENANCE_AS_PRIMARY_STATUS_FORBIDDEN",
        "LIST_DETAIL_RECEIPT_CONTRADICTION_FORBIDDEN",
        "PUBLIC_SAFE_DETAIL_LEAK_FORBIDDEN",
    ]:
        if case_id not in drift_ids:
            fail(f"drift cases missing {case_id}")

    for gap_path in GAP_RESOLUTIONS:
        gap = load_json(gap_path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{gap_path.relative_to(ROOT)} missing keys {sorted(missing)}")
        if gap.get("taskId") != "par_201":
            fail(f"{gap_path.relative_to(ROOT)} has wrong taskId")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "--run",
        "getByRole",
        "page.screenshot",
        "reducedMotion",
        "keyboard",
        "Cross_Channel_Receipt_Status_Parity_Atlas",
        "Cross_Channel_Receipt_Status_Parity_Route",
        "receipt-hero",
        "request-status-strip",
        "request-status-summary-card",
        "provenance-context-chip-row",
        "receipt-outcome-bridge",
        "channel-parity-board",
        "parity-list-row-surface",
        "parity-detail-header-surface",
        "signed-out-minimal-status-surface",
        "semantic-status-key",
        "public_safe",
        "prefers-reduced-motion",
        "1280",
        "390",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_cross_channel_receipt_and_status_parity.py"
    if scripts.get("validate:cross-channel-receipt-status-parity") != expected:
        fail("package.json missing validate:cross-channel-receipt-status-parity script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if (
        '"validate:cross-channel-receipt-status-parity": '
        '"python3 ./tools/analysis/validate_cross_channel_receipt_and_status_parity.py"'
        not in root_updates
    ):
        fail("root_script_updates missing validate:cross-channel-receipt-status-parity")
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
            fail(f"package.json {script_name} missing cross-channel parity validator chain")
        if required_chain not in root_updates:
            fail(f"root_script_updates missing cross-channel parity validator chain for {script_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs_data_and_gaps()
    validate_playwright_spec()
    validate_scripts()
    print("[201-cross-channel-receipt-status-parity] validation passed")


if __name__ == "__main__":
    main()
