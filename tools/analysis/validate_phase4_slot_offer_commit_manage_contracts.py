#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


TASK_ID = "seq_280"
VISUAL_MODE = "Booking_Flow_Contract_Atlas"
CONTRACT_VERSION = "280.phase4.booking-flow-freeze.v1"
SCRIPT_NAME = "validate:280-phase4-slot-offer-commit-manage-contracts"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_phase4_slot_offer_commit_manage_contracts.py"

ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "280_phase4_slot_snapshot_offer_commit_manage_contract_pack.md"
API_DOC_PATH = ROOT / "docs" / "api" / "280_phase4_booking_search_offer_commit_manage_contracts.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "280_phase4_reservation_truth_revalidation_and_manage_guardrails.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "280_phase4_booking_flow_contract_atlas.html"

SLOT_SEARCH_PATH = ROOT / "data" / "contracts" / "280_slot_search_session.schema.json"
PROVIDER_SLICE_PATH = ROOT / "data" / "contracts" / "280_provider_search_slice.schema.json"
TEMPORAL_PATH = ROOT / "data" / "contracts" / "280_temporal_normalization_envelope.schema.json"
SLOT_IDENTITY_PATH = ROOT / "data" / "contracts" / "280_canonical_slot_identity.schema.json"
SNAPSHOT_PATH = ROOT / "data" / "contracts" / "280_slot_set_snapshot.schema.json"
RECOVERY_PATH = ROOT / "data" / "contracts" / "280_slot_snapshot_recovery_state.schema.json"
RANK_PLAN_PATH = ROOT / "data" / "contracts" / "280_rank_plan_and_capacity_rank_proof_contract.json"
OFFER_SESSION_PATH = ROOT / "data" / "contracts" / "280_offer_session.schema.json"
RESERVATION_PATH = ROOT / "data" / "contracts" / "280_reservation_truth_projection_contract.json"
TRANSACTION_PATH = ROOT / "data" / "contracts" / "280_booking_transaction.schema.json"
CONFIRMATION_PATH = ROOT / "data" / "contracts" / "280_booking_confirmation_truth_projection.schema.json"
MANAGE_BUNDLE_PATH = ROOT / "data" / "contracts" / "280_appointment_manage_and_reminder_contract_bundle.json"
WAITLIST_PATH = ROOT / "data" / "contracts" / "280_waitlist_and_fallback_interface_stubs.json"

EXTERNAL_NOTES_PATH = ROOT / "data" / "analysis" / "280_external_reference_notes.md"
VISUAL_NOTES_PATH = ROOT / "data" / "analysis" / "280_visual_reference_notes.json"
CONTRACT_SPLIT_PATH = ROOT / "data" / "analysis" / "280_contract_split_matrix.csv"
STATE_TABLE_PATH = ROOT / "data" / "analysis" / "280_revalidation_commit_and_manage_state_table.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json"

BUILDER_PATH = ROOT / "tools" / "analysis" / "build_280_phase4_booking_flow_pack.py"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_phase4_slot_offer_commit_manage_contracts.py"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PATH = ROOT / "tests" / "playwright" / "280_booking_flow_contract_atlas.spec.ts"

REQUIRED_FORMULAS = {
    "SnapshotSelectable": "SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef matches the active BookingCase version] * 1[q.policyBundleHash matches the active compiled policy bundle] * 1[q.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * 1[q.capabilityTupleHash matches the current BookingCapabilityResolution.capabilityTupleHash] * 1[q.coverageState in {complete, partial_coverage}] * 1[recoveryState(q).viewState != stale_refresh_required]",
    "Frontier_b": "Frontier_b = { s : windowClass(s)=b and startAtEpoch(s) <= earliestStart_b + Delta_reorder_b }",
    "softScore": "softScore(s) = w_delay * f_delay(s) + w_continuity * f_continuity(s) + w_site * f_site(s) + w_tod * f_tod(s) + w_travel * f_travel(s) + w_modality * f_modality(s)",
    "RevalidationPass": "RevalidationPass(tx,t) = SnapshotSelectable(SlotSetSnapshot(tx.snapshotId),t) * 1[tx.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * LiveSupplierBookable(tx.selectedSlotRef,t) * PolicySatisfied(tx.selectedSlotRef, tx.policyBundleHash) * RouteWritable(tx,t) * VersionFresh(tx.preflightVersion, tx.selectedSlotRef, t)",
    "RouteWritable": "RouteWritable(tx,t) = 1[AudienceSurfaceRouteContract live and surface publication current and RuntimePublicationBundle live and PatientShellConsistencyProjection valid and, when embedded, PatientEmbeddedSessionProjection valid]",
    "Cancelable": "Cancelable(a,t) = 1[a.status = booked and startAt(a) - t >= cancelCutoff(a) and no live AppointmentManageCommand fence exists for a]",
    "Reschedulable": "Reschedulable(a,t) = 1[a.status = booked and startAt(a) - t >= amendCutoff(a) and no live AppointmentManageCommand fence exists for a]",
}

REQUIRED_EXTERNAL_URLS = [
    "https://hl7.org/fhir/R4/slot.html",
    "https://hl7.org/fhir/R4/appointment.html",
    "https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7",
    "https://digital.nhs.uk/services/nhs-app/nhs-app-features/appointments",
    "https://www.nhs.uk/nhs-app/help/appointments/hospital-and-other-appointments/",
    "https://service-manual.nhs.uk/content",
    "https://service-manual.nhs.uk/design-system/components/error-message",
    "https://playwright.dev/docs/screenshots",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/aria-snapshots",
]

REQUIRED_VISUAL_SOURCES = {
    "Playwright Screenshots",
    "Playwright Trace Viewer",
    "Playwright Aria Snapshots",
    "Linear changelog",
    "Vercel Academy nested layouts",
    "Vercel dashboard navigation",
    "IBM Carbon data table usage",
    "NHS Service Manual typography",
    "NHS Service Manual content guidance",
    "NHS Service Manual error message",
}

REQUIRED_ATLAS_TEST_IDS = [
    "BookingFlowContractAtlas",
    "BookingFlowAtlasMasthead",
    "BookingFlowStageRail",
    "BookingFlowCanvas",
    "SnapshotPipelineRegion",
    "RankingFrontierRegion",
    "ReservationTruthLadderRegion",
    "ConfirmationTruthLadderRegion",
    "ManageStateMatrixRegion",
    "BookingFlowInspector",
    "FormulaLedgerTable",
    "ContractSplitTable",
    "BookingFlowStateTable",
    "ScenarioParityTable",
]

REQUIRED_ATLAS_TOKENS = [
    "booking_flow_contract_atlas",
    "max-width: 1680px;",
    "grid-template-columns: 300px minmax(0, 1fr) 420px;",
    "--canvas: #f7f8fa;",
    "--shell: #eef2f6;",
    "--accent-search: #3158E0;".lower(),
    "--accent-offer: #5B61F6;".lower(),
    "--accent-confirmed: #0F766E;".lower(),
    "--accent-pending: #B7791F;".lower(),
    "--accent-blocked: #B42318;".lower(),
]


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def parse_atlas_data(html_text: str):
    match = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html_text, re.S)
    require(match is not None, "ATLAS_DATA_SCRIPT_MISSING")
    payload = html.unescape(match.group(1))
    return json.loads(payload)


def check_files() -> None:
    for path in [
        ARCHITECTURE_PATH,
        API_DOC_PATH,
        SECURITY_DOC_PATH,
        ATLAS_PATH,
        SLOT_SEARCH_PATH,
        PROVIDER_SLICE_PATH,
        TEMPORAL_PATH,
        SLOT_IDENTITY_PATH,
        SNAPSHOT_PATH,
        RECOVERY_PATH,
        RANK_PLAN_PATH,
        OFFER_SESSION_PATH,
        RESERVATION_PATH,
        TRANSACTION_PATH,
        CONFIRMATION_PATH,
        MANAGE_BUNDLE_PATH,
        WAITLIST_PATH,
        EXTERNAL_NOTES_PATH,
        VISUAL_NOTES_PATH,
        CONTRACT_SPLIT_PATH,
        STATE_TABLE_PATH,
        GAP_LOG_PATH,
        BUILDER_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_PATH,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")


def check_docs() -> None:
    architecture = read_text(ARCHITECTURE_PATH)
    api_doc = read_text(API_DOC_PATH)
    security_doc = read_text(SECURITY_DOC_PATH)

    for token in [
        "Selection state alone never implies exclusivity",
        "Appointment record presence or accepted-for-processing alone never implies booked truth",
        "typed waitlist and fallback seams are published now",
    ]:
        require(token in architecture, f"ARCHITECTURE_TOKEN_MISSING:{token}")

    for token in [
        "Patient and staff shells may render actionability only from the current truth projections.",
        "If any of those refs drift, selection, commit, or manage must degrade to stale or recovery posture instead of inventing a local interpretation.",
        "`BookingConfirmationTruthProjection` controls booked summary, manage exposure, artifact exposure, and reminder exposure.",
    ]:
        require(token in api_doc, f"API_DOC_TOKEN_MISSING:{token}")

    for token in [
        "Selected does not mean held.",
        "Accepted-for-processing is never equivalent to booked.",
        "Manage exposure is capability- and continuity-bound.",
    ]:
        require(token in security_doc, f"SECURITY_DOC_TOKEN_MISSING:{token}")

    for expression in REQUIRED_FORMULAS.values():
        require(expression in architecture or expression in security_doc, f"FORMULA_DOC_MISSING:{expression}")


def check_contracts() -> None:
    slot_search = load_json(SLOT_SEARCH_PATH)
    snapshot = load_json(SNAPSHOT_PATH)
    recovery = load_json(RECOVERY_PATH)
    rank_plan = load_json(RANK_PLAN_PATH)
    offer_session = load_json(OFFER_SESSION_PATH)
    reservation = load_json(RESERVATION_PATH)
    transaction = load_json(TRANSACTION_PATH)
    confirmation = load_json(CONFIRMATION_PATH)
    manage_bundle = load_json(MANAGE_BUNDLE_PATH)
    waitlist = load_json(WAITLIST_PATH)

    require(slot_search["x-formulas"]["SnapshotSelectable"]["expression"] == REQUIRED_FORMULAS["SnapshotSelectable"], "SLOT_SEARCH_SNAPSHOT_SELECTABLE_DRIFT")
    require(snapshot["x-formulas"]["SnapshotSelectable"]["expression"] == REQUIRED_FORMULAS["SnapshotSelectable"], "SNAPSHOT_SNAPSHOT_SELECTABLE_DRIFT")
    require(recovery["properties"]["viewState"]["enum"] == [
        "renderable",
        "partial_coverage",
        "stale_refresh_required",
        "no_supply_confirmed",
        "support_fallback",
    ], "RECOVERY_VIEW_STATE_ENUM_DRIFT")

    require(rank_plan["formulas"]["Frontier_b"]["expression"] == REQUIRED_FORMULAS["Frontier_b"], "FRONTIER_FORMULA_DRIFT")
    require(rank_plan["formulas"]["softScore"]["expression"] == REQUIRED_FORMULAS["softScore"], "SOFT_SCORE_DRIFT")
    require("sum w_* = 1" in rank_plan["definitions"]["RankPlan"]["constraints"], "RANK_WEIGHT_CONSTRAINT_MISSING")

    require(offer_session["properties"]["truthMode"]["enum"] == ["truthful_nonexclusive", "exclusive_hold", "degraded_manual_pending"], "OFFER_TRUTH_MODE_DRIFT")
    require("ReservationTruthProjection" in reservation["title"], "RESERVATION_TITLE_DRIFT")
    require(reservation["truthStates"] == [
        "exclusive_held",
        "truthful_nonexclusive",
        "pending_confirmation",
        "confirmed",
        "disputed",
        "released",
        "expired",
        "revalidation_required",
        "unavailable",
    ], "RESERVATION_TRUTH_STATES_DRIFT")

    require(transaction["x-formulas"]["RevalidationPass"]["expression"] == REQUIRED_FORMULAS["RevalidationPass"], "REVALIDATION_FORMULA_DRIFT")
    require(transaction["x-formulas"]["RouteWritable"]["expression"] == REQUIRED_FORMULAS["RouteWritable"], "ROUTE_WRITABLE_FORMULA_DRIFT")
    require(transaction["properties"]["authoritativeOutcomeState"]["enum"] == [
        "booking_in_progress",
        "confirmation_pending",
        "reconciliation_required",
        "booked",
        "failed",
        "expired",
        "released",
    ], "AUTHORITATIVE_OUTCOME_ENUM_DRIFT")

    require(confirmation["properties"]["confirmationTruthState"]["enum"] == [
        "booking_in_progress",
        "confirmation_pending",
        "reconciliation_required",
        "confirmed",
        "failed",
        "expired",
        "superseded",
    ], "CONFIRMATION_TRUTH_ENUM_DRIFT")
    require("sole audience-safe authority" in " ".join(confirmation["x-laws"]).lower(), "CONFIRMATION_LAW_MISSING")

    require(manage_bundle["predicates"]["Cancelable"]["expression"] == REQUIRED_FORMULAS["Cancelable"], "CANCELABLE_FORMULA_DRIFT")
    require(manage_bundle["predicates"]["Reschedulable"]["expression"] == REQUIRED_FORMULAS["Reschedulable"], "RESCHEDULABLE_FORMULA_DRIFT")
    require(
        manage_bundle["commandDefinitions"]["BookingManageSettlement"]["resultEnum"] == [
            "applied",
            "supplier_pending",
            "stale_recoverable",
            "unsupported_capability",
            "safety_preempted",
            "reconciliation_required",
        ],
        "MANAGE_RESULT_ENUM_DRIFT",
    )

    require(
        waitlist["stubDefinitions"]["WaitlistFallbackObligation"]["requiredFallbackRoutes"] == [
            "stay_local_waitlist",
            "callback_fallback",
            "fallback_to_hub",
            "support_fallback",
            "booking_failed",
        ],
        "WAITLIST_FALLBACK_ROUTE_ENUM_DRIFT",
    )


def check_analysis_artifacts() -> None:
    notes = read_text(EXTERNAL_NOTES_PATH)
    for url in REQUIRED_EXTERNAL_URLS:
        require(url in notes, f"EXTERNAL_REFERENCE_URL_MISSING:{url}")
    for token in [
        "Rejected: selected means held.",
        "Rejected: appointment record presence or accepted-for-processing equals booked.",
        "Rejected: waitlist or fallback is somebody else’s problem later.",
    ]:
        require(token in notes, f"EXTERNAL_REJECTION_MISSING:{token}")

    visual = load_json(VISUAL_NOTES_PATH)
    names = {entry["name"] for entry in visual["sources"]}
    missing = REQUIRED_VISUAL_SOURCES - names
    require(not missing, f"VISUAL_REFERENCE_SOURCES_MISSING:{sorted(missing)}")

    split_rows = load_csv(CONTRACT_SPLIT_PATH)
    state_rows = load_csv(STATE_TABLE_PATH)
    require(len(split_rows) >= 13, "CONTRACT_SPLIT_ROW_COUNT_TOO_LOW")
    require(any(row["contract"] == "Waitlist and fallback stubs" for row in split_rows), "WAITLIST_SPLIT_ROW_MISSING")
    require(any(row["stateId"] == "confirmed_booked" for row in state_rows), "CONFIRMED_STATE_ROW_MISSING")
    require(any(row["stateId"] == "manage_stale_recoverable" for row in state_rows), "MANAGE_STALE_STATE_ROW_MISSING")

    gap_log = load_json(GAP_LOG_PATH)
    require(gap_log["taskId"] == TASK_ID, "GAP_LOG_TASK_ID_DRIFT")
    require(len(gap_log["gaps"]) >= 3, "GAP_LOG_COUNT_TOO_LOW")


def check_atlas() -> None:
    atlas_html = read_text(ATLAS_PATH)
    atlas_data = parse_atlas_data(atlas_html)

    for test_id in REQUIRED_ATLAS_TEST_IDS:
        require(f'data-testid="{test_id}"' in atlas_html, f"ATLAS_TEST_ID_MISSING:{test_id}")

    lower_html = atlas_html.lower()
    for token in REQUIRED_ATLAS_TOKENS:
        require(token in lower_html, f"ATLAS_TOKEN_MISSING:{token}")

    require(atlas_data["visualMode"] == VISUAL_MODE, "ATLAS_VISUAL_MODE_DRIFT")
    require(len(atlas_data["stages"]) >= 8, "ATLAS_STAGE_COUNT_TOO_LOW")
    require(len(atlas_data["formulas"]) >= 8, "ATLAS_FORMULA_COUNT_TOO_LOW")
    require(len(atlas_data["scenarios"]) >= 9, "ATLAS_SCENARIO_COUNT_TOO_LOW")
    require(
        atlas_data["stages"][0]["primaryFormulaId"] == "SnapshotSelectable",
        "ATLAS_PRIMARY_FORMULA_DRIFT",
    )


def check_script_wiring() -> None:
    package = load_json(PACKAGE_PATH)
    require(package["scripts"].get(SCRIPT_NAME) == SCRIPT_VALUE, "PACKAGE_SCRIPT_MISSING_OR_DRIFTED")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISSING_OR_DRIFTED")
    root_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(SCRIPT_NAME in root_updates_text, "ROOT_SCRIPT_UPDATES_FILE_MISSING_280")


def main() -> None:
    check_files()
    check_docs()
    check_contracts()
    check_analysis_artifacts()
    check_atlas()
    check_script_wiring()
    print("validate_phase4_slot_offer_commit_manage_contracts: ok")


if __name__ == "__main__":
    main()
