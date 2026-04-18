#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


SCRIPT_NAME = "validate:283-capability-engine"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_283_capability_engine.py"

ENGINE_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "phase4-booking-capability-engine.ts"
INDEX_PATH = ROOT / "packages" / "domains" / "booking" / "src" / "index.ts"
DOMAIN_TEST_PATH = ROOT / "packages" / "domains" / "booking" / "tests" / "phase4-booking-capability-engine.test.ts"
COMMAND_API_PATH = ROOT / "services" / "command-api" / "src" / "phase4-booking-capability.ts"
INTEGRATION_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "phase4-booking-capability.integration.test.js"
MIGRATION_PATH = ROOT / "services" / "command-api" / "migrations" / "132_phase4_booking_capability_engine.sql"
ARCHITECTURE_DOC_PATH = ROOT / "docs" / "architecture" / "283_provider_capability_matrix_and_binding_compiler.md"
API_DOC_PATH = ROOT / "docs" / "api" / "283_booking_capability_resolution_api.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "283_capability_tuple_trust_and_confirmation_gate_rules.md"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "283_external_reference_notes.md"
CASES_PATH = ROOT / "data" / "analysis" / "283_capability_resolution_cases.csv"
FIXTURE_CATALOG_PATH = ROOT / "data" / "analysis" / "283_provider_matrix_fixture_catalog.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "PHASE4_PARALLEL_INTERFACE_GAP_CAPABILITY_ENGINE.json"
EVENT_SCHEMA_PATH = ROOT / "packages" / "event-contracts" / "schemas" / "booking" / "booking.capability.resolved.v1.schema.json"
EVENT_REGISTRY_PATH = ROOT / "packages" / "event-contracts" / "src" / "index.ts"
PACKAGE_JSON_PATH = ROOT / "package.json"

REQUIRED_INTEGRATION_MODES = {
    "im1_patient_api",
    "im1_transaction_api",
    "gp_connect_existing",
    "local_gateway_component",
    "manual_assist_only",
}

REQUIRED_CAPABILITY_STATES = {
    "live_self_service",
    "live_staff_assist",
    "assisted_only",
    "linkage_required",
    "local_component_required",
    "degraded_manual",
    "recovery_only",
    "blocked",
}

REQUIRED_EXTERNAL_URLS = [
    "https://digital.nhs.uk/services/gp-it-futures-systems/im1-pairing-integration",
    "https://digital.nhs.uk/services/gp-it-futures-systems/im1-pairing-integration/interface-mechanisms-guidance",
    "https://digital.nhs.uk/services/gp-connect",
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
    "https://standards.nhs.uk/published-standards/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems",
    "https://standards.nhs.uk/published-standards/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems",
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


def check_engine_files() -> None:
    engine_text = read_text(ENGINE_PATH)
    for token in [
        'export type BookingIntegrationMode =',
        'export type BookingCapabilityState =',
        "phase4ProviderCapabilityMatrixRows",
        "phase4AdapterContractProfiles",
        "phase4DependencyDegradationProfiles",
        "phase4AuthoritativeReadAndConfirmationPolicies",
        "createPhase4BookingCapabilityEngineStore",
        "createPhase4BookingCapabilityEngineService",
        "applyPresentedTupleDrift",
        "resolveBookingCapability(",
        "resolveAppointmentManageCapability(",
        "queryCapabilityDiagnostics(",
        'makeFoundationEvent("booking.capability.resolved"',
    ]:
        require(token in engine_text, f"ENGINE_TOKEN_MISSING:{token}")

    for mode in REQUIRED_INTEGRATION_MODES:
        require(mode in engine_text, f"ENGINE_MODE_MISSING:{mode}")
    for state in REQUIRED_CAPABILITY_STATES:
        require(state in engine_text, f"ENGINE_STATE_MISSING:{state}")

    index_text = read_text(INDEX_PATH)
    require(
        'export * from "./phase4-booking-capability-engine";' in index_text,
        "BOOKING_INDEX_EXPORT_MISSING",
    )

    command_api_text = read_text(COMMAND_API_PATH)
    for token in [
        "PHASE4_BOOKING_CAPABILITY_SERVICE_NAME",
        "phase4BookingCapabilityRoutes",
        "phase4BookingCapabilityPersistenceTables",
        "resolveBookingCaseCapability(",
        "resolveAppointmentManageCapability(",
        "queryCapabilityDiagnostics(",
    ]:
        require(token in command_api_text, f"COMMAND_API_TOKEN_MISSING:{token}")

    migration_text = read_text(MIGRATION_PATH)
    for token in [
        "phase4_provider_capability_matrix_rows",
        "phase4_adapter_contract_profiles",
        "phase4_dependency_degradation_profiles",
        "phase4_authoritative_read_confirmation_policies",
        "phase4_booking_provider_adapter_bindings",
        "phase4_booking_capability_resolutions",
        "phase4_booking_capability_projections",
    ]:
        require(token in migration_text, f"MIGRATION_TOKEN_MISSING:{token}")

    require(DOMAIN_TEST_PATH.exists(), "DOMAIN_TEST_MISSING")
    require(INTEGRATION_TEST_PATH.exists(), "INTEGRATION_TEST_MISSING")


def check_docs() -> None:
    architecture_text = read_text(ARCHITECTURE_DOC_PATH)
    for token in [
        "Only the compiled binding may choose the adapter path.",
        "Supplier name alone may not choose the adapter path.",
        "BookingCapabilityResolution is the current dynamic tuple verdict",
        "booking.capability.resolved remains the public settlement event for capability evaluation.",
    ]:
        require(token in architecture_text, f"ARCHITECTURE_DOC_TOKEN_MISSING:{token}")

    api_text = read_text(API_DOC_PATH)
    for token in [
        "GET /v1/bookings/cases/{bookingCaseId}/capability",
        "GET /v1/appointments/{appointmentId}/manage-capability",
        "GET /internal/v1/bookings/capabilities/diagnostics",
        "one current matrix row",
        "one deterministic `capabilityTupleHash`",
    ]:
        require(token in api_text, f"API_DOC_TOKEN_MISSING:{token}")

    security_text = read_text(SECURITY_DOC_PATH)
    for token in [
        "accepted-for-processing is never equivalent to booked.",
        "stale capability cache must fall to `recovery_only` or `blocked`.",
        "translation is adapter-owned; booking meaning is booking-core-owned.",
        "linkage or local-component drift may not degrade into generic no-appointments copy.",
    ]:
        require(token in security_text, f"SECURITY_DOC_TOKEN_MISSING:{token}")


def check_analysis_artifacts() -> None:
    notes_text = read_text(REFERENCE_NOTES_PATH)
    for url in REQUIRED_EXTERNAL_URLS:
        require(url in notes_text, f"REFERENCE_URL_MISSING:{url}")
    for token in [
        "Accessed on 2026-04-18.",
        "Rejected: using supplier label or route family to infer the adapter path",
        "Rejected: treating FHIR Appointment or Slot presence as live manage capability",
        "Rejected: treating accepted-for-processing as booked or calm truth",
    ]:
        require(token in notes_text, f"REFERENCE_TOKEN_MISSING:{token}")

    case_rows = load_csv(CASES_PATH)
    case_modes = {row["integration_mode"] for row in case_rows}
    require(
        REQUIRED_INTEGRATION_MODES <= case_modes,
        f"CASE_MODE_COVERAGE_MISSING:{sorted(REQUIRED_INTEGRATION_MODES - case_modes)}",
    )
    case_states = {row["expected_capability_state"] for row in case_rows}
    require(
        REQUIRED_CAPABILITY_STATES <= case_states,
        f"CASE_STATE_COVERAGE_MISSING:{sorted(REQUIRED_CAPABILITY_STATES - case_states)}",
    )

    fixture_rows = load_csv(FIXTURE_CATALOG_PATH)
    fixture_modes = {row["integration_mode"] for row in fixture_rows}
    require(
        REQUIRED_INTEGRATION_MODES <= fixture_modes,
        f"FIXTURE_MODE_COVERAGE_MISSING:{sorted(REQUIRED_INTEGRATION_MODES - fixture_modes)}",
    )
    require(len(fixture_rows) == 5, "FIXTURE_ROW_COUNT_DRIFT")

    gap_log = load_json(GAP_LOG_PATH)
    gap_ids = {entry["gapId"] for entry in gap_log["gaps"]}
    require(
        {"PHASE4_283_GAP_001", "PHASE4_283_GAP_002", "PHASE4_283_GAP_003"} <= gap_ids,
        "GAP_ID_COVERAGE_INCOMPLETE",
    )


def check_event_schema() -> None:
    event_schema = load_json(EVENT_SCHEMA_PATH)
    require(
        event_schema["properties"]["eventName"]["const"] == "booking.capability.resolved",
        "EVENT_SCHEMA_EVENT_NAME_DRIFT",
    )
    require(
        event_schema["properties"]["canonicalEventContractRef"]["const"]
        == "CEC_BOOKING_CAPABILITY_RESOLVED",
        "EVENT_SCHEMA_CONTRACT_REF_DRIFT",
    )
    registry_text = read_text(EVENT_REGISTRY_PATH)
    for token in [
        "CEC_BOOKING_CAPABILITY_RESOLVED",
        'eventName: "booking.capability.resolved"',
        '"packages/event-contracts/schemas/booking/booking.capability.resolved.v1.schema.json"',
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
    check_engine_files()
    check_docs()
    check_analysis_artifacts()
    check_event_schema()
    check_root_scripts()
    print("validate_283_capability_engine: ok")


if __name__ == "__main__":
    main()
