#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:287-booking-commit-pipeline"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_287_booking_commit_pipeline.py"

ENGINE_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-booking-commit-engine.ts"
INDEX_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "index.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-booking-commit-engine.test.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-commit.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-booking-commit.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "136_phase4_booking_commit_pipeline.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "287_booking_commit_and_confirmation_truth.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "287_commit_fencing_idempotency_and_recovery.md"
STATE_MATRIX_PATH = ROOT / "data" / "analysis" / "287_commit_state_matrix.csv"
PROOF_MATRIX_PATH = ROOT / "data" / "analysis" / "287_authoritative_proof_examples.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "287_external_reference_notes.md"
PACKAGE_JSON_PATH = ROOT / "package.json"
EVENT_REGISTRY_PATH = ROOT / "packages" / "event-contracts" / "src" / "index.ts"

REQUIRED_REFERENCE_URLS = [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards",
    "https://digital.nhs.uk/services/gp-connect/develop-gp-connect-services/development/general-api-guidance",
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


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def check_engine() -> None:
    engine_text = read_text(ENGINE_PATH)
    for token in [
        "BookingTransactionSnapshot",
        "BookingConfirmationTruthProjectionSnapshot",
        "AppointmentRecordSnapshot",
        "BookingExceptionSnapshot",
        "BeginCommitDispatchOutcomeInput",
        "createPhase4BookingCommitStore",
        "createPhase4BookingCommitService",
        "beginCommit(",
        "ingestAuthoritativeObservation(",
        "reconcileAmbiguousTransaction(",
        "releaseOrSupersedeFailedTransaction(",
        'makeFoundationEvent("booking.commit.started"',
        'makeFoundationEvent("booking.confirmation.truth.updated"',
        'makeFoundationEvent("booking.appointment.created"',
        "allowedProof(",
        "buildBookingException(",
    ]:
        require(token in engine_text, f"ENGINE_TOKEN_MISSING:{token}")

    index_text = read_text(INDEX_PATH)
    require(
        'export * from "./phase4-booking-commit-engine";' in index_text,
        "BOOKING_INDEX_EXPORT_MISSING",
    )


def check_command_api() -> None:
    command_api_text = read_text(COMMAND_API_PATH)
    for token in [
        "PHASE4_BOOKING_COMMIT_SERVICE_NAME",
        "PHASE4_BOOKING_COMMIT_SCHEMA_VERSION",
        "PHASE4_BOOKING_COMMIT_QUERY_SURFACES",
        "phase4BookingCommitRoutes",
        "phase4BookingCommitPersistenceTables",
        "phase4BookingCommitMigrationPlanRefs",
        "beginCommitFromSelectedOffer(",
        "recordAuthoritativeObservation(",
        "reconcileAmbiguousTransaction(",
        "releaseOrSupersedeFailedTransaction(",
        "queryCurrentBookingCommit(",
        "resolveCommitContext(",
        "refreshExternalConfirmationGate(",
        "advanceCaseForCommitOutcome(",
    ]:
        require(token in command_api_text, f"COMMAND_API_TOKEN_MISSING:{token}")

    for route_id in [
        "booking_case_commit_current",
        "booking_case_begin_commit",
        "booking_transaction_record_authoritative_observation",
        "booking_transaction_reconcile_ambiguous",
        "booking_transaction_release_or_supersede_failed",
    ]:
        require(route_id in command_api_text, f"COMMAND_API_ROUTE_ID_MISSING:{route_id}")
        require(route_id in read_text(SERVICE_DEFINITION_PATH), f"ROUTE_CATALOG_ID_MISSING:{route_id}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "phase4_booking_transactions",
        "phase4_booking_confirmation_truth_projections",
        "phase4_appointment_records",
        "phase4_booking_exceptions",
        "phase4_booking_transaction_journal",
        "idempotency_key TEXT NOT NULL",
        "authoritative_proof_class TEXT NOT NULL",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    domain_test_text = read_text(DOMAIN_TEST_PATH)
    for token in [
        "authoritative success by durable provider reference and replays by idempotency key",
        "keeps async acceptance in confirmation_pending until a later authoritative observation arrives",
        "routes divergent callbacks into reconciliation instead of minting a second appointment narrative",
        "supersedes failed transactions without rewriting the original chain",
        "preserves monotone confirmation truth progression across pending, reconciliation, and confirmation",
    ]:
        require(token in domain_test_text, f"DOMAIN_TEST_TOKEN_MISSING:{token}")

    integration_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "confirms a selected offer on authoritative success and advances the booking case",
        "moves async acceptance to confirmation_pending and collapses duplicate callbacks onto one transaction chain",
        "fails closed when preflight revalidation is stale and can later supersede the failed transaction",
        "PHASE4_BOOKING_COMMIT_SERVICE_NAME",
        "phase4BookingCommitRoutes",
        "phase4BookingCommitPersistenceTables",
    ]:
        require(token in integration_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`BookingTransaction` separates local acknowledgement, processing acceptance, external observation, and authoritative outcome.",
        "`AppointmentRecord` is created only on lawful proof classes.",
        "`ExternalConfirmationGate` remains the governing bridge",
        "Duplicate and out-of-order callbacks collapse through the receipt-checkpoint chain.",
        "The wrapper only advances `BookingCase` through the frozen 282 state machine:",
        "`booking.commit.confirmed`",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "The same idempotency key and `dispatchEffectKeyRef` gate duplicate supplier effects.",
        "No booked reassurance on provider 202 or pending ack.",
        "Stale writer and safety preemption both abort commit before calm booking truth is written.",
        "Receipt handling is also idempotent.",
        "Patient-safe projection remains derived from `BookingConfirmationTruthProjection`.",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-18." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: FHIR Appointment semantics reinforce that appointment-resource presence is not the same as authoritative booking truth",
        "Borrowed: IM1 and GP Connect guidance reinforce a supplier-specific adapter boundary",
        "Borrowed: DCB0160 reinforces aborting calm routine booking",
        "Rejected: treating transport acceptance, provider async acknowledgement, or callback arrival as booked truth.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    state_rows = load_csv(STATE_MATRIX_PATH)
    require(len(state_rows) >= 6, "STATE_MATRIX_ROW_COUNT_TOO_SMALL")
    state_ids = {row["scenario_id"] for row in state_rows}
    for scenario_id in [
        "287_preflight_failed",
        "287_authoritative_success_durable_ref",
        "287_confirmation_pending_then_confirmed",
        "287_reconciliation_required",
        "287_authoritative_failure",
        "287_superseded_after_failure",
    ]:
        require(scenario_id in state_ids, f"STATE_MATRIX_SCENARIO_MISSING:{scenario_id}")

    proof_rows = load_csv(PROOF_MATRIX_PATH)
    require(len(proof_rows) >= 4, "PROOF_MATRIX_ROW_COUNT_TOO_SMALL")
    proof_ids = {row["scenario_id"] for row in proof_rows}
    for scenario_id in [
        "287_durable_provider_reference",
        "287_same_commit_read_after_write",
        "287_reconciled_confirmation",
        "287_missing_provider_reference_rejected",
    ]:
        require(scenario_id in proof_ids, f"PROOF_MATRIX_SCENARIO_MISSING:{scenario_id}")


def check_event_registry() -> None:
    registry_text = read_text(EVENT_REGISTRY_PATH)
    for token in [
        'eventName: "booking.commit.started"',
        'eventName: "booking.commit.confirmation_pending"',
        'eventName: "booking.commit.reconciliation_pending"',
        'eventName: "booking.commit.confirmed"',
        'eventName: "booking.commit.ambiguous"',
        'eventName: "booking.confirmation.truth.updated"',
        'eventName: "booking.appointment.created"',
    ]:
        require(token in registry_text, f"EVENT_REGISTRY_TOKEN_MISSING:{token}")


def check_scripts() -> None:
    package_text = read_text(PACKAGE_JSON_PATH)
    require(f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_text, "PACKAGE_SCRIPT_MISSING")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISSING")


def main() -> None:
    check_engine()
    check_command_api()
    check_tests()
    check_docs()
    check_analysis()
    check_event_registry()
    check_scripts()
    print("287 booking commit pipeline validation passed")


if __name__ == "__main__":
    main()
