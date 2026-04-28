#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:290-smart-waitlist"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_290_smart_waitlist.py"

APP_PATH = ROOT / "services" / "command-api" / "src" / "phase4-smart-waitlist.ts"
DOMAIN_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-smart-waitlist-engine.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-smart-waitlist.integration.test.js"
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "139_phase4_smart_waitlist_and_deadline_logic.sql"
)
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "290_smart_waitlist_and_deadline_logic.md"
OPERATIONS_DOC_PATH = ROOT / "docs" / "operations" / "290_waitlist_assignment_and_fallback.md"
PRIORITY_CSV_PATH = ROOT / "data" / "analysis" / "290_waitlist_priority_examples.csv"
BATCH_CSV_PATH = ROOT / "data" / "analysis" / "290_assignment_batches.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "290_external_reference_notes.md"
GAP_NOTE_PATH = (
    ROOT / "data" / "analysis" / "PHASE4_BATCH_284_291_INTERFACE_GAP_WAITLIST_COMMIT_LINEAGE.json"
)
PACKAGE_JSON_PATH = ROOT / "package.json"

REQUIRED_REFERENCE_URLS = [
    "https://www.england.nhs.uk/long-read/online-appointment-booking/",
    "https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/",
    "https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/",
    "https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir",
    "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/appointment-management-troubleshooting-guide/things-to-consider",
    "https://hl7.org/fhir/r4/appointment.html",
    "https://hl7.org/fhir/r4/slot.html",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    return path.read_text(encoding="utf-8")


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def check_code() -> None:
    app_text = read_text(APP_PATH)
    for token in [
        "PHASE4_SMART_WAITLIST_SERVICE_NAME",
        "PHASE4_SMART_WAITLIST_QUERY_SURFACES",
        "phase4SmartWaitlistRoutes",
        "phase4SmartWaitlistPersistenceTables",
        "phase4SmartWaitlistMigrationPlanRefs",
        "buildSyntheticWaitlistOfferSessionRef(",
        "normalizeWaitlistCommitOutcome(",
        "queryCurrentWaitlist(",
        "joinWaitlist(",
        "processReleasedCapacity(",
        "acceptWaitlistOffer(",
        "expireWaitlistOffer(",
        "supersedeWaitlistOffer(",
        "refreshFallbackObligation(",
    ]:
        require(token in app_text, f"WAITLIST_APP_TOKEN_MISSING:{token}")

    domain_text = read_text(DOMAIN_PATH)
    for token in [
        "PHASE4_SMART_WAITLIST_SCHEMA_VERSION",
        "defaultWaitlistRankPlan",
        "createPhase4SmartWaitlistStore(",
        "createPhase4SmartWaitlistService(",
        "createOrRefreshWaitlistEntry(",
        "processReleasedCapacity(",
        "issuePlannedWaitlistOffer(",
        "settleWaitlistCommitOutcome(",
    ]:
        require(token in domain_text, f"WAITLIST_DOMAIN_TOKEN_MISSING:{token}")

    service_definition_text = read_text(SERVICE_DEFINITION_PATH)
    for route_id in [
        "booking_case_waitlist_current",
        "booking_case_join_waitlist",
        "waitlist_entry_pause",
        "waitlist_entry_close",
        "booking_waitlist_process_released_capacity",
        "waitlist_offer_accept",
        "waitlist_offer_expire",
        "waitlist_offer_supersede",
        "waitlist_entry_refresh_fallback",
    ]:
        require(route_id in app_text, f"WAITLIST_ROUTE_ID_MISSING:{route_id}")
        require(route_id in service_definition_text, f"ROUTE_CATALOG_ID_MISSING:{route_id}")


def check_migration() -> None:
    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_entries",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_entry_eligibility_keys",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_deadline_evaluations",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_fallback_obligations",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_continuation_truth_projections",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_allocation_batches",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_offers",
        "CREATE TABLE IF NOT EXISTS phase4_waitlist_transition_journal",
        "truth_mode TEXT NOT NULL",
        "assignment_tuple_hash TEXT NOT NULL",
        "key_dimension TEXT NOT NULL",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    test_text = read_text(TEST_PATH)
    for token in [
        "joins waitlist, issues a reservation-backed offer, and books through the canonical commit pipeline",
        "expires overdue offers and escalates the booking case into callback fallback when local waitlist is no longer safe",
        "publishes the expected metadata surfaces and route catalog entries",
    ]:
        require(token in test_text, f"TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`WaitlistEntry` is the canonical local Smart Waitlist object.",
        "`WaitlistContinuationTruthProjection` is the only patient/staff surface read model for local waitlist posture.",
        "`phase4_waitlist_entry_eligibility_keys` materializes modality, site, local day, and continuity lookup keys.",
        "`WaitlistAllocationBatch` stores batching horizon, stable pair order, and assignment tuple hash for replay.",
        "`WaitlistOffer` always carries `ReservationAuthority` refs and the score vector that justified issuance",
        "`WaitlistFallbackObligation` stays armed until authoritative booking truth or durable callback/hub transfer settles it.",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    operations_text = read_text(OPERATIONS_DOC_PATH)
    for token in [
        "Only authoritative released capacity may enter the matcher.",
        "Do not treat embargoed, stale, or merely visible slots as released waitlist supply.",
        "Expire or supersede the reservation scope with the live fence token before refreshing waitlist posture.",
        "If `offerabilityState` becomes `fallback_required` or `overdue`, stop issuing local offers and transfer through the stored fallback obligation.",
        "Keep one active decision-required offer per waitlist entry as the operational ceiling.",
        "The safe operator action is to rerun `processReleasedCapacity` on new authoritative supply or `refreshFallbackObligation` when policy or inventory truth changes.",
    ]:
        require(token in operations_text, f"OPERATIONS_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-19." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: NHS England online-booking guidance reinforces that practices decide which appointments are directly bookable",
        "Borrowed: GP Connect Appointment Management defines authoritative search, book, amend, and cancel operations",
        "Borrowed: HL7 Slot R4 permits multiple allocations only when the scheduling system explicitly allows it",
        "Rejected: treating a merely visible or nominally bookable slot as safe released supply without authoritative release truth.",
        "No external optimization library was chosen.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    priority_rows = load_csv(PRIORITY_CSV_PATH)
    require(len(priority_rows) >= 6, "PRIORITY_MATRIX_ROW_COUNT_TOO_SMALL")
    priority_ids = {row["scenario_id"] for row in priority_rows}
    for scenario_id in [
        "290_critical_same_day_perfect_fit",
        "290_warn_high_fairness_debt",
        "290_on_track_low_fit",
        "290_remote_medium_fit",
        "290_cooldown_penalized_repeat_offer",
        "290_overdue_callback_required",
    ]:
        require(scenario_id in priority_ids, f"PRIORITY_SCENARIO_MISSING:{scenario_id}")

    batch_rows = load_csv(BATCH_CSV_PATH)
    require(len(batch_rows) >= 6, "BATCH_MATRIX_ROW_COUNT_TOO_SMALL")
    batch_ids = {row["scenario_id"] for row in batch_rows}
    for scenario_id in [
        "290_single_release_single_match",
        "290_two_units_two_entries",
        "290_tie_break_same_scores",
        "290_truthful_nonexclusive_window",
        "290_no_safe_laxity_transfer",
        "290_offer_chain_exhausted",
    ]:
        require(scenario_id in batch_ids, f"BATCH_SCENARIO_MISSING:{scenario_id}")

    require(GAP_NOTE_PATH.exists(), "WAITLIST_COMMIT_GAP_NOTE_MISSING")


def check_scripts() -> None:
    package_text = read_text(PACKAGE_JSON_PATH)
    require(f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_text, "PACKAGE_SCRIPT_MISSING")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISSING")


def main() -> None:
    check_code()
    check_migration()
    check_tests()
    check_docs()
    check_analysis()
    check_scripts()
    print("290 smart waitlist validation passed")


if __name__ == "__main__":
    main()
