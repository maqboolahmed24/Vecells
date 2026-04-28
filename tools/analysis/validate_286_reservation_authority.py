#!/usr/bin/env python3
from __future__ import annotations

import csv
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:286-reservation-authority"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_286_reservation_authority.py"

QUEUE_CONTROL_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "reservation-queue-control-backbone.ts"
QUEUE_CONTROL_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "reservation-queue-control-backbone.test.ts"
CONFIRMATION_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "reservation-confirmation-backbone.test.ts"
SERVICE_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-reservations.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-booking-reservations.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "135_phase4_booking_reservation_authority.sql"
SERVICE_DEFINITION_PATH = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "286_reservation_authority_and_truth_projection.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "286_reservation_locking_and_fencing.md"
STATE_MATRIX_PATH = ROOT / "data" / "analysis" / "286_reservation_state_matrix.csv"
TRUTH_MATRIX_PATH = ROOT / "data" / "analysis" / "286_truth_projection_examples.csv"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "286_external_reference_notes.md"
PACKAGE_JSON_PATH = ROOT / "package.json"
EVENT_REGISTRY_PATH = ROOT / "packages" / "event-contracts" / "src" / "index.ts"

REQUIRED_REFERENCE_URLS = [
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
    "https://www.postgresql.org/docs/17/explicit-locking.html",
    "https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/",
    "https://www.england.nhs.uk/long-read/online-appointment-booking/",
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


def check_queue_control() -> None:
    queue_control_text = read_text(QUEUE_CONTROL_PATH)
    for token in [
        '"disputed"',
        "disputedAt: string | null",
        "derivePostConfirmationTiming(",
        "transitionReservation(",
        "disputeReservation(",
        "assertExpectedReservationVersion(",
        "requireActiveFenceBundle(",
        "STALE_RESERVATION_VERSION_REF",
        "STALE_RESERVATION_FENCE_TOKEN",
    ]:
        require(token in queue_control_text, f"QUEUE_CONTROL_TOKEN_MISSING:{token}")

    queue_control_test_text = read_text(QUEUE_CONTROL_TEST_PATH)
    for token in [
        "transitions one fenced reservation through hold, pending confirmation, confirmed, and disputed states",
        "rejects stale reservationVersionRef on terminal reservation transitions",
        'code: "STALE_RESERVATION_VERSION_REF"',
    ]:
        require(token in queue_control_test_text, f"QUEUE_CONTROL_TEST_TOKEN_MISSING:{token}")

    confirmation_test_text = read_text(CONFIRMATION_TEST_PATH)
    require(
        "maps the lawful reservation state family to truthful projection semantics" in confirmation_test_text,
        "CONFIRMATION_TEST_TOKEN_MISSING",
    )


def check_service() -> None:
    service_text = read_text(SERVICE_PATH)
    for token in [
        "PHASE4_BOOKING_RESERVATION_SERVICE_NAME",
        "PHASE4_BOOKING_RESERVATION_SCHEMA_VERSION",
        "phase4BookingReservationRoutes",
        "phase4BookingReservationPersistenceTables",
        "phase4BookingReservationMigrationPlanRefs",
        "createOrRefreshSoftSelection(",
        "acquireOrRefreshHold(",
        "markPendingConfirmation(",
        "markConfirmed(",
        "releaseReservation(",
        "expireReservation(",
        "markDisputed(",
        "queryReservationTruth(",
        "sweepExpiredReservations(",
        'scopeFamily: "offer_session"',
        'scopeFamily: "waitlist_offer"',
        'buildCapacityReservationEvent("capacity.reservation.created"',
        'buildCapacityReservationTruthUpdatedEvent(',
    ]:
        require(token in service_text, f"SERVICE_TOKEN_MISSING:{token}")

    for route_id in [
        "booking_reservation_truth_current",
        "booking_reservation_soft_select",
        "booking_reservation_acquire_hold",
        "booking_reservation_mark_pending_confirmation",
        "booking_reservation_mark_confirmed",
        "booking_reservation_release",
        "booking_reservation_expire",
        "booking_reservation_mark_disputed",
        "booking_reservation_expiry_sweep",
    ]:
        require(route_id in service_text, f"SERVICE_ROUTE_ID_MISSING:{route_id}")
        require(route_id in read_text(SERVICE_DEFINITION_PATH), f"ROUTE_CATALOG_ID_MISSING:{route_id}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "ALTER TABLE reservation_fence_records",
        "ADD COLUMN disputed_at TEXT NULL;",
        "phase4_booking_reservation_scopes",
        "phase4_booking_reservation_transition_journal",
        "phase4_booking_reservation_replays",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")


def check_integration_tests() -> None:
    integration_text = read_text(INTEGRATION_TEST_PATH)
    for token in [
        "creates truthful nonexclusive soft selection for the selected offer session",
        "supports exclusive hold, pending confirmation, confirmation, and release when the binding allows real hold semantics",
        "rejects stale tokens and expires bounded soft selections in the sweep worker",
        "serializes real holds across offer-session and waitlist scopes sharing one canonicalReservationKey",
        'code: "STALE_RESERVATION_FENCE_TOKEN"',
        "phase4BookingReservationPersistenceTables",
    ]:
        require(token in integration_text, f"INTEGRATION_TEST_TOKEN_MISSING:{token}")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "This slice owns one booking-facing orchestration layer over the existing `CapacityReservation`, `ReservationFenceRecord`, and `ReservationTruthProjection` substrate.",
        "All mutations serialize on `canonicalReservationKey`.",
        "Real exclusivity is impossible unless the active provider binding says `reservationSemantics = exclusive_hold`.",
        "Offer-session scope resolution now derives from the frozen `OfferSession.slotSetSnapshotRef`",
        "expiry sweep may mark a reservation expired after the real `expiresAt`",
        "`capacity.reservation.truth.updated`",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "Every mutating command that targets an existing reservation must present the latest active fence token.",
        "No exclusivity without a real hold",
        "`soft_selected` is focus or selection posture only.",
        "`countdownMode = hold_expiry` is lawful only when:",
        "Waitlist does not get a separate reservation pathway.",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis() -> None:
    reference_text = read_text(REFERENCE_NOTES_PATH)
    require("Accessed on 2026-04-18." in reference_text, "REFERENCE_ACCESS_DATE_MISSING")
    for url in REQUIRED_REFERENCE_URLS:
        require(url in reference_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Borrowed: FHIR Slot and Appointment semantics reinforce that visible availability, reservation, and booked truth are different objects.",
        "Borrowed: PostgreSQL explicit-locking guidance reinforces short critical sections and not holding the serializer across non-database work.",
        "Rejected: carrying a booking-local pseudo-hold model beside `CapacityReservation`.",
        "No additional supplier-specific documentation was consumed for `286`.",
    ]:
        require(token in reference_text, f"REFERENCE_TOKEN_MISSING:{token}")

    state_rows = load_csv(STATE_MATRIX_PATH)
    require(len(state_rows) >= 8, "STATE_MATRIX_ROW_COUNT_TOO_SMALL")
    state_ids = {row["scenario_id"] for row in state_rows}
    for scenario_id in [
        "286_soft_selected_truthful",
        "286_held_exclusive",
        "286_pending_confirmation",
        "286_confirmed",
        "286_released",
        "286_expired",
        "286_disputed",
    ]:
        require(scenario_id in state_ids, f"STATE_MATRIX_SCENARIO_MISSING:{scenario_id}")

    truth_rows = load_csv(TRUTH_MATRIX_PATH)
    require(len(truth_rows) >= 6, "TRUTH_PROJECTION_ROW_COUNT_TOO_SMALL")
    truth_states = {row["truth_state"] for row in truth_rows}
    for truth_state in [
        "truthful_nonexclusive",
        "exclusive_held",
        "pending_confirmation",
        "confirmed",
        "degraded_manual_pending",
        "disputed",
    ]:
        require(truth_state in truth_states, f"TRUTH_STATE_MISSING:{truth_state}")


def check_event_registry() -> None:
    registry_text = read_text(EVENT_REGISTRY_PATH)
    for token in [
        'eventName: "capacity.reservation.created"',
        'eventName: "capacity.reservation.held"',
        'eventName: "capacity.reservation.pending_confirmation"',
        'eventName: "capacity.reservation.confirmed"',
        'eventName: "capacity.reservation.released"',
        'eventName: "capacity.reservation.expired"',
        'eventName: "capacity.reservation.disputed"',
        'eventName: "capacity.reservation.truth.updated"',
    ]:
        require(token in registry_text, f"EVENT_REGISTRY_TOKEN_MISSING:{token}")


def check_root_scripts() -> None:
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATES_ENTRY_MISMATCH")
    package_json_text = read_text(PACKAGE_JSON_PATH)
    require(
        f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"' in package_json_text,
        "PACKAGE_JSON_SCRIPT_ENTRY_MISSING",
    )


def main() -> None:
    check_queue_control()
    check_service()
    check_integration_tests()
    check_docs()
    check_analysis()
    check_event_registry()
    check_root_scripts()
    print("validate_286_reservation_authority: ok")


if __name__ == "__main__":
    main()
