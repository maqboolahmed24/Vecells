#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:288-appointment-manage-commands"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_288_appointment_manage_commands.py"

DOMAIN_ENGINE_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-appointment-manage-engine.ts"
COMMIT_ENGINE_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-booking-commit-engine.ts"
BOOKING_INDEX_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "index.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-appointment-manage-engine.test.ts"
PUBLIC_API_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "public-api.test.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "phase4-appointment-manage.ts"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-appointment-manage.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "137_phase4_appointment_manage_command_layer.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "288_appointment_manage_command_layer.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "288_manage_gate_continuity_and_safety_preemption.md"
RESULT_MATRIX_PATH = ROOT / "data" / "analysis" / "288_manage_result_matrix.csv"
SUPERSESSION_MATRIX_PATH = ROOT / "data" / "analysis" / "288_reschedule_supersession_cases.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "288_external_reference_notes.md"
PACKAGE_JSON_PATH = ROOT / "package.json"

REQUIRED_REFERENCE_URLS = [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance",
    "https://digital.nhs.uk/services/gp-connect/develop-gp-connect-services/integrate-with-spine/interaction-ids",
    "https://digital.nhs.uk/services/patient-care-aggregator/building-a-patient-portal",
    "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/",
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


def load_package_scripts() -> dict[str, str]:
    package_json = json.loads(read_text(PACKAGE_JSON_PATH))
    scripts = package_json.get("scripts", {})
    require(isinstance(scripts, dict), "PACKAGE_JSON_SCRIPTS_MISSING")
    return scripts


def check_domain_engine() -> None:
    engine_text = read_text(DOMAIN_ENGINE_PATH)
    for token in [
        "AppointmentManageCommandSnapshot",
        "BookingManageSettlementSnapshot",
        "BookingContinuityEvidenceProjectionSnapshot",
        "createPhase4AppointmentManageStore",
        "createPhase4AppointmentManageService",
        "submitCancellation(",
        "submitReschedule(",
        "abandonReschedule(",
        "submitDetailUpdate(",
        "refreshContinuityEvidence(",
        'makeFoundationEvent("booking.manage.continuity.updated"',
        'makeFoundationEvent("booking.cancelled"',
        'makeFoundationEvent("booking.reschedule.started"',
    ]:
        require(token in engine_text, f"DOMAIN_ENGINE_TOKEN_MISSING:{token}")

    commit_text = read_text(COMMIT_ENGINE_PATH)
    for token in [
        "confirmationTruthProjectionRef",
        "manageSupportContractRef",
        "manageCapabilities",
        "manageCapabilityProjectionRef",
        "presentationArtifactRef",
        "supersedesAppointmentRef",
        "supersededByAppointmentRef",
        "latestManageSettlementRef",
        "administrativeDetails",
    ]:
        require(token in commit_text, f"COMMIT_ENGINE_TOKEN_MISSING:{token}")

    require(
        'export * from "./phase4-appointment-manage-engine";' in read_text(BOOKING_INDEX_PATH),
        "BOOKING_INDEX_EXPORT_MISSING",
    )


def check_command_api() -> None:
    command_text = read_text(COMMAND_API_PATH)
    for token in [
        "PHASE4_APPOINTMENT_MANAGE_SERVICE_NAME",
        "PHASE4_APPOINTMENT_MANAGE_SCHEMA_VERSION",
        "PHASE4_APPOINTMENT_MANAGE_QUERY_SURFACES",
        "phase4AppointmentManageRoutes",
        "phase4AppointmentManagePersistenceTables",
        "phase4AppointmentManageMigrationPlanRefs",
        "submitCancelAppointment(",
        "submitRescheduleAppointment(",
        "abandonAppointmentReschedule(",
        "submitAppointmentDetailUpdate(",
        "queryCurrentAppointmentManage(",
        "resolveManageCapability(",
        "refreshContinuityFor(",
        "bootstrapReplacementSearch(",
        "finalizeSupersededRescheduleSource(",
        "isClinicallyMeaningfulFreeText(",
        "contact_route_repair_journey_",
    ]:
        require(token in command_text, f"COMMAND_API_TOKEN_MISSING:{token}")

    for route_id in [
        "appointment_manage_current",
        "appointment_submit_cancel",
        "appointment_submit_reschedule",
        "appointment_abandon_reschedule",
        "appointment_submit_detail_update",
    ]:
        require(route_id in command_text, f"COMMAND_ROUTE_ID_MISSING:{route_id}")
        require(route_id in read_text(SERVICE_DEFINITION_PATH), f"ROUTE_CATALOG_ID_MISSING:{route_id}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "phase4_appointment_manage_commands",
        "phase4_booking_manage_settlements",
        "phase4_booking_continuity_evidence_projections",
        "ALTER TABLE phase4_appointment_records",
        "appointment_status IN ('booked', 'cancellation_pending', 'cancelled', 'reschedule_in_progress', 'superseded')",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_tests() -> None:
    domain_test_text = read_text(DOMAIN_TEST_PATH)
    for token in [
        "persists a cancellation bundle, emits canonical events, and replays by idempotency key",
        "persists reschedule start and refreshes current continuity evidence deterministically",
        "stores detail-update and reminder-change outcomes through the same command law",
        "evaluates cancelable and reschedulable predicates from cutoff and fence state",
    ]:
        require(token in domain_test_text, f"DOMAIN_TEST_TOKEN_MISSING:{token}")

    integration_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "publishes the 288 service metadata and authoritative cancel path in the route catalog",
        "authoritatively cancels an appointment and closes the booking case only after cancellation truth exists",
        "keeps cancellation pending and the case managed while supplier truth is unresolved",
        "fails closed on stale route, capability, and continuity tuples instead of mutating the appointment",
        "starts a governed reschedule chain and can safely abandon it back to the source appointment",
        "reuses the same booking engine for replacement success and supersedes the source appointment linearly",
        "routes clinically meaningful detail text to safety preemption and contact-dependent updates to repair",
        "PHASE4_APPOINTMENT_MANAGE_SERVICE_NAME",
        "phase4AppointmentManagePersistenceTables",
    ]:
        require(token in integration_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")

    public_api_test_text = read_text(PUBLIC_API_TEST_PATH)
    require(
        "createPhase4AppointmentManageStore" in public_api_test_text
        and "createPhase4AppointmentManageService" in public_api_test_text,
        "PUBLIC_API_TEST_TOKEN_MISSING",
    )


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "`AppointmentManageCommand`",
        "`BookingManageSettlement`",
        "`BookingContinuityEvidenceProjection`",
        "Cancellation is routed through the same command layer and never releases supply on local intent alone.",
        "Reschedule is one governed mutation chain over the same engine:",
        "Detail update remains administrative only.",
        "`BookingContinuityEvidenceProjection` is refreshed after every manage command.",
        "`AppointmentPresentationArtifact` governance",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "Every cancel, reschedule, abandon, and detail-update mutation must bind:",
        "Routine manage posture is writable only when confirmation truth is still confirmed",
        "Cancellation does not release capacity",
        "Reschedule is not allowed to branch into a separate scheduler.",
        "Administrative detail update does not accept symptom change",
        "`ContactRouteRepairJourney` is created or refreshed",
        "`AppointmentPresentationArtifact`",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-18." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: FHIR Appointment semantics keep appointment status and cancellation semantics disciplined",
        "Borrowed: NHS Digital patient portal guidance explicitly distinguishes live appointment state from pending cancellation and pending reschedule request posture.",
        "Borrowed: IM1 and GP Connect documentation reinforce that amend and cancel capability is adapter-specific",
        "Borrowed: NHS 111 guidance reinforces routing symptom worsening or deterioration away from purely administrative appointment flows",
        "Rejected: treating a local cancel click or supplier acknowledgement as enough to release supply or close the case.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    result_rows = load_csv(RESULT_MATRIX_PATH)
    require(len(result_rows) >= 8, "RESULT_MATRIX_ROW_COUNT_TOO_SMALL")
    result_ids = {row["scenario_id"] for row in result_rows}
    for scenario_id in [
        "288_cancel_authoritative",
        "288_cancel_pending",
        "288_cancel_stale_tuple",
        "288_reschedule_started",
        "288_reschedule_abandon_restore",
        "288_detail_update_applied",
        "288_detail_update_safety_preempted",
        "288_detail_update_contact_repair",
    ]:
        require(scenario_id in result_ids, f"RESULT_MATRIX_SCENARIO_MISSING:{scenario_id}")

    supersession_rows = load_csv(SUPERSESSION_MATRIX_PATH)
    require(len(supersession_rows) >= 4, "SUPERSESSION_MATRIX_ROW_COUNT_TOO_SMALL")
    supersession_ids = {row["scenario_id"] for row in supersession_rows}
    for scenario_id in [
        "288_reschedule_replacement_confirmed",
        "288_reschedule_abandoned_restore",
        "288_reschedule_failed_before_commit",
        "288_reschedule_pending_confirmation",
    ]:
        require(scenario_id in supersession_ids, f"SUPERSESSION_CASE_MISSING:{scenario_id}")


def check_scripts() -> None:
    scripts = load_package_scripts()
    require(scripts.get(SCRIPT_NAME) == SCRIPT_VALUE, "PACKAGE_SCRIPT_MISMATCH")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATE_MISMATCH")


def main() -> None:
    check_domain_engine()
    check_command_api()
    check_tests()
    check_docs()
    check_analysis()
    check_scripts()
    print("validate_288_appointment_manage_commands: ok")


if __name__ == "__main__":
    main()
