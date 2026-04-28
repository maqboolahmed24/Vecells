#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:292-booking-reconciliation-worker"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_292_booking_reconciliation_worker.py"

APP_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-reconciliation.ts"
DOMAIN_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-booking-reconciliation-engine.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-booking-reconciliation-engine.test.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-booking-reconciliation.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "141_phase4_booking_reconciliation_worker.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "292_booking_reconciliation_and_confirmation_worker.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "292_booking_callback_and_read_after_write_security.md"
OPERATIONS_DOC_PATH = ROOT / "docs" / "operations" / "292_booking_reconciliation_runbook.md"
STATE_TABLE_PATH = ROOT / "data" / "analysis" / "292_reconciliation_state_table.csv"
CASE_MATRIX_PATH = ROOT / "data" / "analysis" / "292_supplier_ambiguity_case_matrix.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "292_external_reference_notes.md"
CONTRACT_PATH = ROOT / "data" / "contracts" / "292_booking_reconciliation_contract.json"
PACKAGE_JSON_PATH = ROOT / "package.json"
INTERFACE_GAP_PATH = ROOT / "data" / "analysis" / "PHASE4_BATCH_292_299_INTERFACE_GAP_BOOKING_AUTHORITATIVE_READ_ADAPTER.json"

REQUIRED_REFERENCE_URLS = [
    "https://hl7.org/fhir/r4/appointment.html",
    "https://hl7.org/fhir/r4/slot.html",
    "https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir",
    "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards",
    "https://www.england.nhs.uk/long-read/online-appointment-booking/",
    "https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/",
    "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries",
    "https://nodejs.org/download/release/v24.1.0/docs/api/timers.html",
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
        "PHASE4_BOOKING_RECONCILIATION_SERVICE_NAME",
        "PHASE4_BOOKING_RECONCILIATION_QUERY_SURFACES",
        "phase4BookingReconciliationRoutes",
        "phase4BookingReconciliationPersistenceTables",
        "phase4BookingReconciliationMigrationPlanRefs",
        "class ExternalConfirmationGateEvaluator",
        "class AuthoritativeReadSettlementService",
        "class BookingReceiptAssimilator",
        "class BookingReconciliationWorker",
        "queryCurrentBookingReconciliation(",
        "assimilateBookingReceipt(",
        "forceReconcileAttempt(",
        "resolveManualDispute(",
        "processDueReconciliations(",
    ]:
        require(token in app_text, f"APP_TOKEN_MISSING:{token}")

    service_definition_text = read_text(SERVICE_DEFINITION_PATH)
    for route_id in [
        "booking_case_reconciliation_current",
        "booking_transaction_assimilate_receipt",
        "booking_transaction_force_reconcile",
        "booking_transaction_resolve_manual_dispute",
        "booking_reconciliation_process_due",
    ]:
        require(route_id in app_text, f"APP_ROUTE_TOKEN_MISSING:{route_id}")
        require(route_id in service_definition_text, f"SERVICE_DEFINITION_ROUTE_MISSING:{route_id}")

    domain_text = read_text(DOMAIN_PATH)
    for token in [
        "PHASE4_BOOKING_RECONCILIATION_SCHEMA_VERSION",
        "createPhase4BookingReconciliationStore(",
        "createPhase4BookingReconciliationService(",
        "syncBookingReconciliation(",
        "recordBookingReconciliationAttempt(",
        "listDueBookingReconciliations(",
        "parseBookingReconciliationEvidenceAtoms(",
    ]:
        require(token in domain_text, f"DOMAIN_TOKEN_MISSING:{token}")


def check_migration() -> None:
    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "CREATE TABLE IF NOT EXISTS phase4_booking_reconciliation_records",
        "CREATE TABLE IF NOT EXISTS phase4_booking_reconciliation_attempts",
        "booking_transaction_ref TEXT NOT NULL",
        "attempt_key TEXT NOT NULL",
        "evidence_atoms_json JSONB NOT NULL DEFAULT '[]'::jsonb",
        "phase4_booking_reconciliation_transaction_idx",
        "phase4_booking_reconciliation_attempt_key_idx",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    domain_test_text = read_text(DOMAIN_TEST_PATH)
    for token in [
        "keeps one durable reconciliation record per booking transaction and does not regress final settlement state",
        "records append-only attempts and replays the same attempt key without widening history",
        "lists due reconciliations by nextAttemptAt while excluding final records",
    ]:
        require(token in domain_test_text, f"DOMAIN_TEST_TOKEN_MISSING:{token}")

    integration_test_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "publishes the 292 metadata surface and route catalog entries",
        "keeps provider-reference callbacks pending until authoritative read confirms and replays the same read without creating a second appointment",
        "collapses duplicate and stale callbacks onto one pending transaction chain for gate-required suppliers",
        "opens manual attention on secure-callback failure and resolves governed manual disputes after a conflicting read",
    ]:
        require(token in integration_test_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`BookingReconciliationRecord` is one durable control-plane object for a single `BookingTransaction`.",
        "`BookingReconciliationAttempt` preserves append-only evidence, attempt keys, and receipt checkpoints for every callback, poll, retry, or manual resolution.",
        "`ExternalConfirmationGateEvaluator` rebuilds `ExternalConfirmationGate` from accumulated reconciliation evidence instead of collapsing proof into a boolean.",
        "`BookingReceiptAssimilator` fails closed on signature, network, or schema failure before any booking mutation.",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "Where supplier signing is supported, callbacks must arrive with `signatureVerification = verified`.",
        "Where source-network policy exists, callbacks must arrive with `networkVerification = verified`.",
        "`AdapterReceiptCheckpoint` remains the only dedupe authority for callback and webhook receipts, and the worker reuses the same receipt chain for replay-safe read-after-write observations.",
        "Logs, queue evidence refs, and emitted events carry hashes, refs, and reason codes only; they do not need raw PHI payloads.",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")

    operations_text = read_text(OPERATIONS_DOC_PATH)
    for token in [
        "Use `POST /internal/v1/bookings/reconciliation:process-due` to sweep due records.",
        "Use `POST /internal/v1/bookings/transactions/{bookingTransactionId}:force-reconcile` for one governed retry.",
        "Use `POST /internal/v1/bookings/transactions/{bookingTransactionId}:resolve-manual-dispute` only after an operator has reviewed supplier evidence.",
        "The worker is intentionally bounded. If it cannot settle safely, it must expose manual attention instead of retrying forever.",
    ]:
        require(token in operations_text, f"OPERATIONS_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-19." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: FHIR still treats `Slot` free/busy posture separately from `Appointment` lifecycle",
        "Borrowed: GP Connect Appointment Management is still an appointment-management API for booking and managing appointments on behalf of a patient",
        "Borrowed: IM1 standards still separate patient-facing and transaction-style access and still describe real-time retrieval and update behaviour",
        "Borrowed: GitHub’s webhook guidance still reflects the fail-closed pattern needed here",
        "Rejected: treating accepted-for-processing, callback arrival, or provider-reference echo as final booked truth.",
        "No public official documentation exists for this repository’s internal queue, scheduler, outbox, or retry orchestration contract.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    state_rows = load_csv(STATE_TABLE_PATH)
    require(len(state_rows) >= 8, "STATE_TABLE_ROW_COUNT_TOO_SMALL")
    state_ids = {row["scenario_id"] for row in state_rows}
    for scenario_id in [
        "292_pending_read_after_write",
        "292_awaiting_gateway_callback",
        "292_disputed_retryable",
        "292_manual_attention",
        "292_confirmed",
        "292_failed",
        "292_expired",
        "292_superseded",
    ]:
        require(scenario_id in state_ids, f"STATE_SCENARIO_MISSING:{scenario_id}")

    case_rows = load_csv(CASE_MATRIX_PATH)
    require(len(case_rows) >= 8, "CASE_MATRIX_ROW_COUNT_TOO_SMALL")
    case_ids = {row["scenario_id"] for row in case_rows}
    for scenario_id in [
        "292_callback_processing_only",
        "292_duplicate_callback",
        "292_stale_callback",
        "292_read_missing_after_acceptance",
        "292_provider_reference_slot_conflict",
        "292_callback_signature_failure",
        "292_timeout_without_truth",
        "292_manual_override",
    ]:
        require(scenario_id in case_ids, f"CASE_MATRIX_SCENARIO_MISSING:{scenario_id}")


def check_contracts_and_scripts() -> None:
    contract_text = read_text(CONTRACT_PATH)
    contract = json.loads(contract_text)
    require(contract["serviceName"] == "Phase4BookingReconciliationAndConfirmationWorkerApplication", "CONTRACT_SERVICE_NAME_DRIFT")
    require(contract["schemaVersion"] == "292.phase4.booking-reconciliation-worker.v1", "CONTRACT_SCHEMA_VERSION_DRIFT")
    require("ambiguous_commit" == contract["manualQueueFamily"], "CONTRACT_QUEUE_FAMILY_DRIFT")
    require(contract["authoritativeProofRules"]["appointmentCreationIsExactlyOnce"] is True, "CONTRACT_PROOF_RULE_DRIFT")

    package_text = read_text(PACKAGE_JSON_PATH)
    require(ROOT_SCRIPT_UPDATES[SCRIPT_NAME] == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_DRIFT")
    require(f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_text, "PACKAGE_SCRIPT_MISSING")

    gap_text = read_text(INTERFACE_GAP_PATH)
    gap = json.loads(gap_text)
    require(gap["taskId"] == "par_292", "INTERFACE_GAP_TASK_ID_DRIFT")
    require("BookingAuthoritativeReadAdapter" in read_text(APP_PATH), "ADAPTER_SEAM_TOKEN_MISSING")


def main() -> None:
    check_code()
    check_migration()
    check_tests()
    check_docs()
    check_analysis()
    check_contracts_and_scripts()
    print("validate_292_booking_reconciliation_worker: OK")


if __name__ == "__main__":
    main()
