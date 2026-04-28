#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:285-capacity-rank-offer-sessions"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_285_capacity_rank_and_offer_sessions.py"

ENGINE_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-capacity-rank-offer-engine.ts"
INDEX_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "index.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-capacity-rank-offer-engine.test.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "phase4-capacity-rank-offers.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-capacity-rank-offers.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "134_phase4_capacity_rank_and_offer_session.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "285_capacity_rank_and_offer_session.md"
POLICY_DOC_PATH = ROOT / "docs" / "policy" / "285_rank_plan_semantics.md"
RANK_REPLAY_PATH = ROOT / "data" / "analysis" / "285_rank_replay_examples.csv"
REASON_CUE_PATH = ROOT / "data" / "analysis" / "285_reason_cue_examples.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "285_external_reference_notes.md"
PACKAGE_JSON_PATH = ROOT / "package.json"
EVENT_REGISTRY_PATH = ROOT / "packages" / "event-contracts" / "src" / "index.ts"
OFFERS_EVENT_SCHEMA_PATH = ROOT / "packages" / "event-contracts" / "schemas" / "booking" / "booking.offers.created.v1.schema.json"
SELECTED_EVENT_SCHEMA_PATH = ROOT / "packages" / "event-contracts" / "schemas" / "booking" / "booking.slot.selected.v1.schema.json"

REQUIRED_REFERENCE_URLS = [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
    "https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/",
    "https://www.england.nhs.uk/long-read/online-appointment-booking/",
    "https://www.nhs.uk/nhs-services/gps/gp-appointments-and-bookings/",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort",
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


def check_engine() -> None:
    engine_text = read_text(ENGINE_PATH)
    for token in [
        "compileRankPlan(",
        "buildDisclosurePolicy(",
        "inferHardFilterReasons(",
        "windowClassForSlot(",
        "reasonCuesForCandidate(",
        "buildSelectionProofHash(",
        "continuationBranches(",
        "createPhase4CapacityRankStore",
        "createPhase4CapacityRankService",
        'truthful_nonexclusive',
        '"branch_only"',
        '"join_local_waitlist"',
        '"assisted_callback"',
        '"fallback_to_hub"',
        'makeFoundationEvent("booking.offers.created"',
        'makeFoundationEvent("booking.slot.selected"',
    ]:
        require(token in engine_text, f"ENGINE_TOKEN_MISSING:{token}")

    index_text = read_text(INDEX_PATH)
    require(
        'export * from "./phase4-capacity-rank-offer-engine";' in index_text,
        "BOOKING_INDEX_EXPORT_MISSING",
    )


def check_command_api() -> None:
    command_api_text = read_text(COMMAND_API_PATH)
    for token in [
        "PHASE4_CAPACITY_RANK_SERVICE_NAME",
        "phase4CapacityRankRoutes",
        "phase4CapacityRankPersistenceTables",
        "createOfferSessionFromCurrentSnapshot(",
        "refreshOfferSessionFromCurrentSnapshot(",
        "fetchOfferSessionPage(",
        "fetchOfferSessionCompare(",
        "selectOfferCandidate(",
        'bookingCase.bookingCase.status === "searching_local"',
    ]:
        require(token in command_api_text, f"COMMAND_API_TOKEN_MISSING:{token}")

    for route_id in [
        "booking_case_offer_session_current",
        "booking_offer_session_page",
        "booking_offer_session_compare",
        "booking_case_offer_session_create",
        "booking_case_offer_session_refresh",
        "booking_offer_session_select_candidate",
    ]:
        require(route_id in command_api_text, f"COMMAND_API_ROUTE_ID_MISSING:{route_id}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "phase4_rank_plans",
        "phase4_capacity_rank_disclosure_policies",
        "phase4_capacity_rank_proofs",
        "phase4_capacity_rank_explanations",
        "phase4_offer_sessions",
        "phase4_offer_candidates",
        "truth_mode IN ('truthful_nonexclusive', 'exclusive_hold', 'degraded_manual_pending')",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    domain_test_text = read_text(DOMAIN_TEST_PATH)
    for token in [
        "enforces hard filters even if stale candidates leak into the ranking input",
        "keeps patient self-service offerability narrower than staff-assisted offerability",
        "returns typed continuation branches when no acceptable local slot exists",
        "verifies selection-proof hashes and updates the session without claiming exclusivity",
        "is deterministic under candidate reordering",
    ]:
        require(token in domain_test_text, f"DOMAIN_TEST_TOKEN_MISSING:{token}")

    integration_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "createOfferSessionFromCurrentSnapshot",
        "refreshOfferSessionFromCurrentSnapshot",
        "queryCurrentOfferSession",
        "fetchOfferSessionPage",
        "fetchOfferSessionCompare",
        "selectOfferCandidate",
        "refreshedCurrent",
    ]:
        require(token in integration_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "Ranking is no longer inferred from raw supplier order or from browser sorting.",
        "Only candidates inside `Frontier_b` may be preference-reordered by soft score.",
        "`OfferSession.expiresAt` is an interaction TTL only.",
        "The wrapper only calls the `282` `publishOffersReady` transition on the first compile from `searching_local`.",
        "`booking.offers.created`",
        "`booking.slot.selected`",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    policy_text = read_text(POLICY_DOC_PATH)
    for token in [
        "Rank only from the current lawful `SlotSetSnapshot` and `SnapshotCandidateIndex`.",
        "Only candidates inside `Frontier_b` may be preference-reordered by soft score.",
        "`OfferSession.expiresAt` is an interaction TTL, not proof of exclusivity.",
        "`cue_soonest`",
        "`join_local_waitlist`",
    ]:
        require(token in policy_text, f"POLICY_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-18." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: NHS England directly bookable guidance",
        "Borrowed: FHIR Appointment and Slot semantics helped keep ranking separate from reservation and booked truth.",
        "Rejected: treating `OfferSession.expiresAt` as hold truth or countdown authority.",
        "Rejected: using supplier payload order, calendar order, or browser sorting as booking order authority.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    rank_rows = load_csv(RANK_REPLAY_PATH)
    require(len(rank_rows) >= 4, "RANK_REPLAY_CASE_COUNT_TOO_SMALL")
    scenario_ids = {row["scenario_id"] for row in rank_rows}
    for scenario_id in [
        "285_staff_frontier_reorder",
        "285_patient_self_service_filter",
        "285_branch_only_local_exhausted",
        "285_refresh_supersedes_prior_session",
    ]:
        require(scenario_id in scenario_ids, f"RANK_REPLAY_SCENARIO_MISSING:{scenario_id}")

    reason_rows = load_csv(REASON_CUE_PATH)
    require(len(reason_rows) >= 4, "REASON_CUE_CASE_COUNT_TOO_SMALL")
    cue_text = "|".join(row["patient_reason_cue_refs"] for row in reason_rows)
    for cue in [
        "cue_soonest",
        "cue_best_match",
        "cue_preferred_site",
        "cue_accessibility_fit",
        "cue_time_of_day_fit",
        "cue_closest_suitable_site",
    ]:
        require(cue in cue_text, f"REASON_CUE_MISSING:{cue}")


def check_event_contracts() -> None:
    offers_schema_text = read_text(OFFERS_EVENT_SCHEMA_PATH)
    selected_schema_text = read_text(SELECTED_EVENT_SCHEMA_PATH)
    registry_text = read_text(EVENT_REGISTRY_PATH)
    for token in [
        "booking.offers.created",
        '"const": "CEC_BOOKING_OFFERS_CREATED"',
    ]:
        require(token in offers_schema_text, f"OFFERS_EVENT_SCHEMA_TOKEN_MISSING:{token}")
    for token in [
        "booking.slot.selected",
        '"const": "CEC_BOOKING_SLOT_SELECTED"',
    ]:
        require(token in selected_schema_text, f"SELECTED_EVENT_SCHEMA_TOKEN_MISSING:{token}")
    for token in [
        "CEC_BOOKING_OFFERS_CREATED",
        "CEC_BOOKING_SLOT_SELECTED",
        'eventName: "booking.offers.created"',
        'eventName: "booking.slot.selected"',
    ]:
        require(token in registry_text, f"EVENT_REGISTRY_TOKEN_MISSING:{token}")


def check_root_scripts() -> None:
    require(
        ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE,
        "ROOT_SCRIPT_UPDATES_ENTRY_MISMATCH",
    )
    package_json_text = read_text(PACKAGE_JSON_PATH)
    require(
        f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_json_text,
        "PACKAGE_JSON_SCRIPT_ENTRY_MISSING",
    )


def main() -> None:
    check_engine()
    check_command_api()
    check_tests()
    check_docs()
    check_analysis()
    check_event_contracts()
    check_root_scripts()
    print("validate_285_capacity_rank_and_offer_sessions: ok")


if __name__ == "__main__":
    main()
