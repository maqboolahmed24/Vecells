#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:289-reminder-scheduler"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_289_reminder_scheduler.py"

REMINDER_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-reminders.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST_PATH = (
    ROOT / "services" / "command-api" / "tests" / "phase4-booking-reminders.integration.test.js"
)
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "138_phase4_reminder_plan_and_notification_settlement.sql"
)
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "289_local_reminder_plan_and_settlement.md"
OPERATIONS_DOC_PATH = ROOT / "docs" / "operations" / "289_reminder_delivery_retry_and_repair.md"
STATE_MATRIX_PATH = ROOT / "data" / "analysis" / "289_reminder_state_matrix.csv"
FAILURE_MATRIX_PATH = ROOT / "data" / "analysis" / "289_delivery_failure_cases.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "289_external_reference_notes.md"
GAP_TIMING_PATH = (
    ROOT / "data" / "analysis" / "PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_RECORD_TIMING.json"
)
GAP_STATUS_PATH = (
    ROOT
    / "data"
    / "analysis"
    / "PHASE4_BATCH_284_291_INTERFACE_GAP_APPOINTMENT_MANAGE_STATUS_PERSISTENCE.json"
)
PACKAGE_JSON_PATH = ROOT / "package.json"

REQUIRED_REFERENCE_URLS = [
    "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
    "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
    "https://www.twilio.com/docs/verify/developer-best-practices",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks",
    "https://nodejs.org/api/timers.html",
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


def check_reminder_code() -> None:
    reminder_text = read_text(REMINDER_PATH)
    for token in [
        "PHASE4_BOOKING_REMINDER_SERVICE_NAME",
        "PHASE4_BOOKING_REMINDER_SCHEMA_VERSION",
        "PHASE4_BOOKING_REMINDER_QUERY_SURFACES",
        "phase4BookingReminderRoutes",
        "phase4BookingReminderPersistenceTables",
        "phase4BookingReminderMigrationPlanRefs",
        "createOrRefreshReminderPlan(",
        "sweepDueReminderSchedules(",
        "suppressReminderPlan(",
        "recordReminderTransportOutcome(",
        "recordReminderDeliveryEvidence(",
        "markReminderRepairRequired(",
        "bindReminderPlanToAppointmentRecord(",
        "booking.reminders.scheduled",
        'domain: "booking"',
    ]:
        require(token in reminder_text, f"REMINDER_CODE_TOKEN_MISSING:{token}")

    for route_id in [
        "booking_case_reminder_plan_current",
        "booking_case_refresh_reminder_plan",
        "booking_reminder_plan_sweep_due",
        "booking_reminder_plan_suppress",
        "booking_reminder_plan_record_transport_outcome",
        "booking_reminder_plan_record_delivery_evidence",
        "booking_reminder_plan_mark_repair_required",
    ]:
        require(route_id in reminder_text, f"REMINDER_ROUTE_ID_MISSING:{route_id}")
        require(route_id in read_text(SERVICE_DEFINITION_PATH), f"ROUTE_CATALOG_ID_MISSING:{route_id}")


def check_migration() -> None:
    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "ALTER TABLE phase4_appointment_records",
        "ADD COLUMN reminder_plan_ref",
        "CREATE TABLE IF NOT EXISTS phase4_reminder_plans",
        "CREATE TABLE IF NOT EXISTS phase4_reminder_schedule_entries",
        "CREATE TABLE IF NOT EXISTS phase4_reminder_transition_journal",
        "schedule_state TEXT NOT NULL",
        "authoritative_outcome_state TEXT NOT NULL",
        "queue_idempotency_key TEXT NOT NULL",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    test_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "creates one durable reminder plan after confirmed booking truth and binds it to the appointment record",
        "keeps reminder timing deterministic across DST boundaries",
        "queues due schedules, distinguishes accepted transport from delivered evidence, and replays duplicate delivery evidence safely",
        "retries timed out transport and later marks route-repair on delivery failure",
        "opens blocked repair posture when route authority is stale and supports reminder-change refreshes on the same plan",
        "suppresses stale reminders when appointment lifecycle drifts out of booked truth",
        "moves contradictory delivery evidence into explicit disputed repair posture",
    ]:
        require(token in test_text, f"TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`ReminderPlan` is the canonical local reminder state object",
        "`AppointmentRecord.reminderPlanRef` points back to the live plan",
        "`BookingConfirmationTruthProjection.reminderExposureState` moves from `pending_schedule` to `scheduled`",
        "`ReminderScheduleEntry` owns each planned reminder send",
        "`ContactRouteRepairJourney` is opened whenever reminder delivery cannot remain patient-safe",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    operations_text = read_text(OPERATIONS_DOC_PATH)
    for token in [
        "Transport acceptance is not delivery truth.",
        "Only transient transport timeouts stay in queued posture",
        "Validate provider webhook authenticity",
        "Keep PHI out of scheduler logs",
        "Confirm that reminder plans tied to cancelled or superseded appointments have moved to suppressed posture",
    ]:
        require(token in operations_text, f"OPERATIONS_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-18." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: Twilio outbound message-status guidance reinforces that provider callbacks are asynchronous delivery evidence",
        "Borrowed: Mailgun webhook and secure-webhook guidance reinforces token or signature validation plus replay defense",
        "Borrowed: Node.js timers guidance reinforces that runtime timers are wake-up hints only",
        "Rejected: treating provider acceptance or provider callback arrival as proof that a patient-safe reminder was delivered.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    state_rows = load_csv(STATE_MATRIX_PATH)
    require(len(state_rows) >= 8, "STATE_MATRIX_ROW_COUNT_TOO_SMALL")
    state_ids = {row["scenario_id"] for row in state_rows}
    for scenario_id in [
        "289_confirmed_plan_created",
        "289_route_blocked_repair_opened",
        "289_due_schedule_queued",
        "289_transport_accepted_delivery_pending",
        "289_delivery_failed_repair_required",
        "289_truth_drift_suppressed",
        "289_reminder_change_rescheduled",
        "289_disputed_receipt",
    ]:
        require(state_ids.__contains__(scenario_id), f"STATE_MATRIX_SCENARIO_MISSING:{scenario_id}")

    failure_rows = load_csv(FAILURE_MATRIX_PATH)
    require(len(failure_rows) >= 6, "FAILURE_MATRIX_ROW_COUNT_TOO_SMALL")
    failure_ids = {row["scenario_id"] for row in failure_rows}
    for scenario_id in [
        "289_transport_timeout_retry",
        "289_transport_rejected_blocked",
        "289_provider_failure_repair",
        "289_provider_expired_repair",
        "289_provider_dispute_manual_review",
        "289_stale_route_verification_blocked",
    ]:
        require(failure_ids.__contains__(scenario_id), f"FAILURE_MATRIX_SCENARIO_MISSING:{scenario_id}")

    require(GAP_TIMING_PATH.exists(), "TIMING_GAP_NOTE_MISSING")
    require(GAP_STATUS_PATH.exists(), "STATUS_GAP_NOTE_MISSING")


def check_scripts() -> None:
    package_text = read_text(PACKAGE_JSON_PATH)
    require(f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_text, "PACKAGE_SCRIPT_MISSING")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISSING")


def main() -> None:
    check_reminder_code()
    check_migration()
    check_tests()
    check_docs()
    check_analysis()
    check_scripts()
    print("289 reminder scheduler validation passed")


if __name__ == "__main__":
    main()
