#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path("/Users/test/Code/V")


def require(condition: bool, code: str, message: str) -> None:
    if not condition:
        print(f"{code}: {message}", file=sys.stderr)
        raise SystemExit(1)


def read(path: Path) -> str:
    require(path.exists(), "MISSING_ARTIFACT", f"{path} does not exist")
    return path.read_text()


def main() -> None:
    domain_file = ROOT / "packages/domains/booking/src/phase4-slot-search-snapshot-pipeline.ts"
    service_file = ROOT / "services/command-api/src/phase4-slot-search.ts"
    migration_file = ROOT / "services/command-api/migrations/133_phase4_slot_search_snapshot_pipeline.sql"
    service_definition_file = ROOT / "services/command-api/src/service-definition.ts"
    domain_test_file = ROOT / "packages/domains/booking/tests/phase4-slot-search-snapshot-pipeline.test.ts"
    integration_test_file = ROOT / "services/command-api/tests/phase4-slot-search.integration.test.js"
    architecture_doc = ROOT / "docs/architecture/284_slot_search_snapshot_pipeline.md"
    contract_doc = ROOT / "docs/data-contracts/284_slot_snapshot_contracts.md"
    state_cases = ROOT / "data/analysis/284_snapshot_state_cases.csv"
    temporal_cases = ROOT / "data/analysis/284_temporal_normalization_edge_cases.csv"
    external_notes = ROOT / "data/analysis/284_external_reference_notes.md"
    gap_log = ROOT / "data/analysis/PHASE4_BATCH_284_291_INTERFACE_GAP_BOOKING_CASE_VERSION_REF.json"

    domain_text = read(domain_file)
    service_text = read(service_file)
    migration_text = read(migration_file)
    service_definition_text = read(service_definition_file)
    domain_test_text = read(domain_test_file)
    integration_test_text = read(integration_test_file)
    architecture_text = read(architecture_doc)
    contract_text = read(contract_doc)
    external_text = read(external_notes)
    gap_text = read(gap_log)

    require(
        "createPhase4SlotSearchSnapshotService" in domain_text,
        "DOMAIN_SERVICE_MISSING",
        "Domain slot search snapshot service export is missing.",
    )
    require(
        "SlotSearchSessionSnapshot" in domain_text
        and "ProviderSearchSliceSnapshot" in domain_text
        and "SlotSetSnapshotSnapshot" in domain_text,
        "DOMAIN_OBJECTS_MISSING",
        "Domain slot snapshot object family is incomplete.",
    )
    require(
        "createPhase4SlotSearchApplication" in service_text,
        "COMMAND_API_APPLICATION_MISSING",
        "Command-api slot search application was not implemented.",
    )
    require(
        "booking_case_slot_search_start" in service_text
        and "booking_slot_snapshot_page" in service_text
        and "booking_slot_search_invalidate" in service_text,
        "ROUTE_METADATA_MISSING",
        "284 route metadata is incomplete in the command-api wrapper.",
    )
    require(
        "booking_case_slot_search_current" in service_definition_text
        and "booking_slot_snapshot_day_bucket" in service_definition_text,
        "SERVICE_DEFINITION_DRIFT",
        "service-definition.ts is missing one or more 284 route ids.",
    )
    require(
        "phase4_slot_search_sessions" in migration_text
        and "phase4_provider_search_slices" in migration_text
        and "phase4_slot_set_snapshots" in migration_text,
        "MIGRATION_TABLES_MISSING",
        "284 migration does not create the required durable search tables.",
    )
    require(
        "per-slice provenance" in domain_test_text.lower()
        or "sourceSliceRef" in domain_test_text,
        "DOMAIN_TEST_COVERAGE_MISSING",
        "Domain tests do not cover slot provenance or replay behavior.",
    )
    require(
        "startSlotSearch" in integration_test_text
        and "refreshSlotSearch" in integration_test_text
        and "invalidateSlotSnapshot" in integration_test_text,
        "INTEGRATION_TEST_COVERAGE_MISSING",
        "Integration test does not cover the required 284 command surfaces.",
    )
    require(
        "SlotSearchSession" in architecture_text and "SnapshotCandidateIndex" in architecture_text,
        "ARCHITECTURE_DOC_DRIFT",
        "Architecture doc is missing required 284 object-family coverage.",
    )
    require(
        "SnapshotSelectable" in contract_text and "booking.slots.fetched" in contract_text,
        "CONTRACT_DOC_DRIFT",
        "Contract doc is missing the selectability predicate or event reference.",
    )
    require(
        "HL7 FHIR R4 Slot" in external_text
        and "NHS England directly bookable appointments guidance" in external_text
        and "MDN `Intl.DateTimeFormat`" in external_text,
        "EXTERNAL_NOTES_INCOMPLETE",
        "External reference notes are missing one of the required official source families.",
    )
    require(
        '"expectedOwnerTask": "par_282"' in gap_text,
        "GAP_LOG_MISSING",
        "The case-version bridge gap log is missing or points at the wrong owner task.",
    )
    require(state_cases.exists(), "STATE_CASES_MISSING", f"{state_cases} is missing")
    require(temporal_cases.exists(), "TEMPORAL_CASES_MISSING", f"{temporal_cases} is missing")

    print("validate_284_slot_snapshot_pipeline: ok")


if __name__ == "__main__":
    main()
