#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:291-staff-assisted-booking"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_291_staff_assisted_booking_api.py"

APP_PATH = ROOT / "services" / "command-api" / "src" / "phase4-assisted-booking.ts"
DOMAIN_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-assisted-booking-engine.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
UNIT_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-assisted-booking-engine.test.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-assisted-booking.integration.test.js"
MIGRATION_PATH = (
    ROOT / "services" / "command-api" / "migrations" / "140_phase4_staff_assisted_booking_and_exception_queue.sql"
)
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "291_staff_assisted_booking_api.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "291_staff_booking_leases_focus_and_recovery.md"
QUEUE_CSV_PATH = ROOT / "data" / "analysis" / "291_exception_queue_examples.csv"
RECOVERY_CSV_PATH = ROOT / "data" / "analysis" / "291_staff_recovery_cases.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "291_external_reference_notes.md"
PACKAGE_JSON_PATH = ROOT / "package.json"
COMPAT_WRAPPER_PATH = (
    ROOT / "tools" / "analysis" / "validate_291_staff_assisted_booking_exception_queue_and_handoff_panel_api.py"
)

REQUIRED_REFERENCE_URLS = [
    "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works",
    "https://digital.nhs.uk/services/nhs-login/nhs-login-for-health-and-care/gp-practice-nhs-login-guidance",
    "https://nhsconnect.github.io/nhslogin/session-management/",
    "https://nhsconnect.github.io/nhslogin/gp-credentials/",
    "https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir",
    "https://developer.nhs.uk/apis/gpconnect/appointments.html",
    "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/appointment-management-troubleshooting-guide/appointment-checker",
    "https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/",
    "https://digital.nhs.uk/services/nhs-app/nhs-app-features/appointments",
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
        "PHASE4_ASSISTED_BOOKING_SERVICE_NAME",
        "PHASE4_ASSISTED_BOOKING_QUERY_SURFACES",
        "phase4AssistedBookingRoutes",
        "phase4AssistedBookingPersistenceTables",
        "phase4AssistedBookingMigrationPlanRefs",
        "resolveLawfulStaffCapability(",
        "loadWorkspaceGuardOrFailClosed(",
        "failClosedWithRecovery(",
        "synchronizeExceptionQueue(",
        'commandActionRecordRef: `${input.commandActionRecordRef}_capability`',
        'commandActionRecordRef: `${input.commandActionRecordRef}_search`',
    ]:
        require(token in app_text, f"ASSISTED_APP_TOKEN_MISSING:{token}")

    service_definition_text = read_text(SERVICE_DEFINITION_PATH)
    for route_id in [
        "workspace_booking_assisted_session_current",
        "workspace_booking_assisted_session_start",
        "workspace_booking_assisted_capability_refresh",
        "workspace_booking_assisted_slot_search_start",
        "workspace_booking_assisted_slot_compare",
        "workspace_booking_assisted_slot_select",
        "workspace_booking_assisted_slot_confirm",
        "workspace_booking_assisted_waitlist_or_fallback",
        "workspace_booking_exception_queue_current",
        "workspace_booking_exception_queue_refresh",
        "workspace_booking_exception_queue_claim",
        "workspace_booking_exception_queue_reopen",
        "workspace_booking_stale_owner_reacquire",
    ]:
        require(route_id in app_text, f"ASSISTED_ROUTE_ID_MISSING:{route_id}")
        require(route_id in service_definition_text, f"ROUTE_CATALOG_ID_MISSING:{route_id}")

    domain_text = read_text(DOMAIN_PATH)
    for token in [
        "PHASE4_ASSISTED_BOOKING_SCHEMA_VERSION",
        "createPhase4AssistedBookingStore(",
        "createPhase4AssistedBookingService(",
        "createOrRefreshAssistedBookingSession(",
        "recordAssistedBookingSessionState(",
        "upsertBookingExceptionQueueEntry(",
        "claimBookingExceptionQueueEntry(",
        "reopenBookingExceptionQueueEntry(",
        "resolveBookingExceptionQueueEntry(",
    ]:
        require(token in domain_text, f"ASSISTED_DOMAIN_TOKEN_MISSING:{token}")


def check_migration() -> None:
    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "CREATE TABLE IF NOT EXISTS phase4_assisted_booking_sessions",
        "CREATE TABLE IF NOT EXISTS phase4_booking_exception_queue_entries",
        "focus_protection_lease_ref TEXT",
        "work_protection_lease_ref TEXT",
        "task_completion_settlement_envelope_ref TEXT NOT NULL",
        "request_ownership_epoch_ref INTEGER NOT NULL",
        "reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb",
        "same_shell_recovery_route_ref TEXT",
        "phase4_booking_exception_queue_case_family_open_idx",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    unit_test_text = read_text(UNIT_TEST_PATH)
    for token in [
        "keeps one durable assisted session per booking case and preserves focus-protection compatibility on refresh",
        "maintains one queue entry per family, preserves claim state across refresh, and resolves entries explicitly",
    ]:
        require(token in unit_test_text, f"UNIT_TEST_TOKEN_MISSING:{token}")

    integration_test_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "publishes the 291 metadata surface and route catalog entries",
        "starts an assisted session, searches and confirms through the booking core, and keeps task completion blocked until authoritative settlement exists",
        "preserves slot-comparison focus while queue deltas refresh around the active session",
        "fails closed on stale review leases, opens same-shell recovery, and clears stale-owner posture after reacquire",
        "rejects publication drift and same-supplier binding drift instead of widening staff capability illegally",
        "surfaces linkage-required blockers and reminder delivery failures in one explicit exception queue",
    ]:
        require(token in integration_test_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`AssistedBookingSession` is the canonical staff-side booking shell for one `BookingCase`.",
        "`BookingExceptionQueue` is one explicit projection for manual attention booking failures.",
        "`resolveLawfulStaffCapability` keeps staff actionability on the same supplier, provider binding, and capability tuple lineage.",
        "`TaskCompletionSettlementEnvelope` remains authoritative for task closure and next-task launch.",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "Every assisted select, confirm, waitlist, fallback, or recovery mutation requires the current:",
        "`WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` protect the active comparison or recovery shell.",
        "`failClosedWithRecovery` performs best-effort stale-owner opening and then writes one explicit queue entry in `BookingExceptionQueue`.",
        "Queue evidence and reason refs are machine-readable and replayable.",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-19." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: NHS login still treats GP System Integration (IM1) linkage credentials as part of an authenticated GP-integrated journey",
        "Borrowed: NHS login also states that partner services own session management and logout",
        "Borrowed: GP Connect Appointment Management is still a staff-facing or clinician-facing appointment-management API for booking on behalf of a patient",
        "Borrowed: Slots may appear locally available while still being invisible or unusable to consumers because of configuration or embargo issues.",
        "Rejected: treating internal staff status as permission to bypass supplier, provider binding, or capability tuple checks.",
        "No public official documentation exists for this repository’s internal lease-fence, workspace-focus, or task-settlement objects.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    queue_rows = load_csv(QUEUE_CSV_PATH)
    require(len(queue_rows) >= 8, "QUEUE_EXAMPLES_ROW_COUNT_TOO_SMALL")
    queue_ids = {row["scenario_id"] for row in queue_rows}
    for scenario_id in [
        "291_supplier_endpoint_unavailable",
        "291_slot_revalidation_failure",
        "291_ambiguous_commit",
        "291_patient_self_service_blocked",
        "291_capability_mismatch",
        "291_linkage_required_blocker",
        "291_reminder_delivery_failure",
        "291_stale_owner_publication_drift",
    ]:
        require(scenario_id in queue_ids, f"QUEUE_SCENARIO_MISSING:{scenario_id}")

    recovery_rows = load_csv(RECOVERY_CSV_PATH)
    require(len(recovery_rows) >= 8, "RECOVERY_CASE_ROW_COUNT_TOO_SMALL")
    recovery_ids = {row["scenario_id"] for row in recovery_rows}
    for scenario_id in [
        "291_stale_review_lease",
        "291_workspace_consistency_drift",
        "291_runtime_publication_drift",
        "291_surface_publication_drift",
        "291_binding_rotation_same_supplier",
        "291_focus_protected_compare",
        "291_stale_owner_reacquire",
        "291_task_completion_pending",
    ]:
        require(scenario_id in recovery_ids, f"RECOVERY_SCENARIO_MISSING:{scenario_id}")


def check_scripts() -> None:
    package_text = read_text(PACKAGE_JSON_PATH)
    require(f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_text, "PACKAGE_SCRIPT_MISSING")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISSING")
    require(COMPAT_WRAPPER_PATH.exists(), "COMPAT_WRAPPER_MISSING")


def main() -> None:
    check_code()
    check_migration()
    check_tests()
    check_docs()
    check_analysis()
    check_scripts()
    print("291 staff assisted booking validation passed")


if __name__ == "__main__":
    main()
