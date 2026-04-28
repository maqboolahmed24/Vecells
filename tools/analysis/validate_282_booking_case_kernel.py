#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:282-booking-case-kernel"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_282_booking_case_kernel.py"

KERNEL_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-booking-case-kernel.ts"
INDEX_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "index.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-booking-case-kernel.test.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-case.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-booking-case.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "131_phase4_booking_case_kernel.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "282_booking_case_state_machine_and_intent_records.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "282_booking_lineage_lease_and_identity_repair.md"
TRANSITION_CASES_PATH = ROOT / "data" / "analysis" / "282_transition_cases.csv"
MIGRATION_CASES_PATH = ROOT / "data" / "analysis" / "282_intent_to_case_migration_cases.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "282_external_reference_notes.md"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "PHASE4_PARALLEL_INTERFACE_GAP_BOOKING_CASE_KERNEL.json"
EVENT_SCHEMA_PATH = ROOT / "packages" / "event-contracts" / "schemas" / "booking" / "booking.case.created.v1.schema.json"
EVENT_REGISTRY_PATH = ROOT / "packages" / "event-contracts" / "src" / "index.ts"
PACKAGE_JSON_PATH = ROOT / "package.json"

REQUIRED_STATUSES = [
    "handoff_received",
    "capability_checked",
    "searching_local",
    "offers_ready",
    "selecting",
    "revalidating",
    "commit_pending",
    "booked",
    "confirmation_pending",
    "supplier_reconciliation_pending",
    "waitlisted",
    "fallback_to_hub",
    "callback_fallback",
    "booking_failed",
    "managed",
    "closed",
]

REQUIRED_EXTERNAL_URLS = [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
    "https://standards.nhs.uk/published-standards/clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems",
    "https://standards.nhs.uk/published-standards/clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems",
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


def check_kernel_files() -> None:
    kernel_text = read_text(KERNEL_PATH)
    for token in [
        "export type BookingCaseStatus =",
        "export interface BookingIntentRecordSnapshot",
        "export interface BookingCaseSnapshot",
        "export interface SearchPolicySnapshot",
        "export interface BookingCaseTransitionJournalEntrySnapshot",
        "createPhase4BookingCaseKernelStore",
        "createPhase4BookingCaseKernelService",
        "buildBookingCaseCreatedEvent",
        "IDENTITY_REPAIR_FREEZE_ACTIVE",
        "STALE_SOURCE_DECISION_EPOCH",
        "ILLEGAL_BOOKING_CASE_TRANSITION",
    ]:
        require(token in kernel_text, f"KERNEL_TOKEN_MISSING:{token}")

    index_text = read_text(INDEX_PATH)
    require(
        'export * from "./phase4-booking-case-kernel";' in index_text,
        "BOOKING_INDEX_EXPORT_MISSING",
    )

    command_api_text = read_text(COMMAND_API_PATH)
    for token in [
        "PHASE4_BOOKING_CASE_SERVICE_NAME",
        "phase4BookingCaseRoutes",
        "phase4BookingCasePersistenceTables",
        "createBookingCaseFromTaskHandoff",
    ]:
        require(token in command_api_text, f"COMMAND_API_TOKEN_MISSING:{token}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "phase4_booking_intents",
        "phase4_search_policies",
        "phase4_booking_cases",
        "phase4_booking_case_transition_journal",
        "LifecycleCoordinator",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")

    require(DOMAIN_TEST_PATH.exists(), "DOMAIN_TEST_MISSING")
    require(INTEGRATION_TEST_PATH.exists(), "INTEGRATION_TEST_MISSING")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "LifecycleCoordinator remains the only request-closure authority",
        "Case state does not stand in for capability state",
        "booking.case.created is the only public booking event emitted by 282 after the 281 owner remap",
        "Those seams are also published machine-readably",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "Wrong-patient correction preserves summary provenance only",
        "If `identityRepairBranchDispositionRef` is not released",
        "no booking-local closure authority",
        "requestLifecycleLeaseRef",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis_artifacts() -> None:
    transition_rows = load_csv(TRANSITION_CASES_PATH)
    found_statuses = {row["from_status"] for row in transition_rows} | {
        row["to_status"] for row in transition_rows
    }
    missing = sorted(set(REQUIRED_STATUSES) - found_statuses)
    require(not missing, f"TRANSITION_STATUS_COVERAGE_MISSING:{missing}")
    outcomes = {row["expected_outcome"] for row in transition_rows}
    require({"applied", "rejected"} <= outcomes, "TRANSITION_OUTCOME_COVERAGE_INCOMPLETE")

    migration_rows = load_csv(MIGRATION_CASES_PATH)
    source_states = {row["source_intent_state"] for row in migration_rows}
    require(
        {"seeded", "recovery_only", "superseded"} <= source_states,
        "MIGRATION_SOURCE_STATE_COVERAGE_INCOMPLETE",
    )

    notes_text = read_text(REFERENCE_NOTES_PATH)
    for url in REQUIRED_EXTERNAL_URLS:
      require(url in notes_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Rejected: mapping FHIR Appointment status directly onto `BookingCase.status`",
        "Rejected: treating accepted-for-processing or queued commit as booked truth",
        "Accessed on 2026-04-18.",
    ]:
        require(token in notes_text, f"REFERENCE_TOKEN_MISSING:{token}")

    gap_log = load_json(GAP_LOG_PATH)
    gap_ids = {entry["gapId"] for entry in gap_log["gaps"]}
    require(
        {"PHASE4_282_GAP_001", "PHASE4_282_GAP_002", "PHASE4_282_GAP_003"} <= gap_ids,
        "PARALLEL_GAP_IDS_MISSING",
    )


def check_event_schema() -> None:
    event_schema = load_json(EVENT_SCHEMA_PATH)
    require(
        event_schema["properties"]["eventName"]["const"] == "booking.case.created",
        "EVENT_SCHEMA_EVENT_NAME_DRIFT",
    )
    require(
        event_schema["properties"]["canonicalEventContractRef"]["const"]
        == "CEC_BOOKING_CASE_CREATED",
        "EVENT_SCHEMA_CONTRACT_REF_DRIFT",
    )

    registry_text = read_text(EVENT_REGISTRY_PATH)
    for token in [
        "CEC_BOOKING_CASE_CREATED",
        'eventName: "booking.case.created"',
        '"packages/event-contracts/schemas/booking/booking.case.created.v1.schema.json"',
    ]:
        require(token in registry_text, f"EVENT_REGISTRY_TOKEN_MISSING:{token}")


def check_root_scripts() -> None:
    require(
        ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE,
        "ROOT_SCRIPT_UPDATES_ENTRY_MISMATCH",
    )
    package_json = load_json(PACKAGE_JSON_PATH)
    require(
        package_json["scripts"].get(SCRIPT_NAME) == SCRIPT_VALUE,
        "PACKAGE_JSON_SCRIPT_MISMATCH",
    )


def main() -> None:
    check_kernel_files()
    check_docs()
    check_analysis_artifacts()
    check_event_schema()
    check_root_scripts()
    print("validate_282_booking_case_kernel: ok")


if __name__ == "__main__":
    main()
