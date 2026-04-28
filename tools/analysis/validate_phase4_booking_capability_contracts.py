#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


TASK_ID = "seq_279"
VISUAL_MODE = "Booking_Capability_Atlas"
CONTRACT_VERSION = "279.phase4.booking-capability-freeze.v1"
SCRIPT_NAME = "validate:279-phase4-booking-capability-contracts"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_phase4_booking_capability_contracts.py"

ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "279_phase4_provider_capability_matrix_and_adapter_seam.md"
API_DOC_PATH = ROOT / "docs" / "api" / "279_phase4_booking_capability_resolution_contract.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "279_phase4_capability_tuple_trust_and_confirmation_gate_rules.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "279_phase4_booking_capability_atlas.html"

MATRIX_SCHEMA_PATH = ROOT / "data" / "contracts" / "279_provider_capability_matrix.schema.json"
ADAPTER_REGISTRY_PATH = ROOT / "data" / "contracts" / "279_adapter_contract_profile_registry.json"
DEGRADATION_REGISTRY_PATH = ROOT / "data" / "contracts" / "279_dependency_degradation_profile_registry.json"
POLICY_REGISTRY_PATH = ROOT / "data" / "contracts" / "279_authoritative_read_and_confirmation_gate_policy_registry.json"
BINDING_SCHEMA_PATH = ROOT / "data" / "contracts" / "279_booking_provider_adapter_binding.schema.json"
RESOLUTION_SCHEMA_PATH = ROOT / "data" / "contracts" / "279_booking_capability_resolution.schema.json"
PROJECTION_SCHEMA_PATH = ROOT / "data" / "contracts" / "279_booking_capability_projection.schema.json"

EXTERNAL_NOTES_PATH = ROOT / "data" / "analysis" / "279_external_reference_notes.md"
VISUAL_NOTES_PATH = ROOT / "data" / "analysis" / "279_visual_reference_notes.json"
TUPLE_MATRIX_PATH = ROOT / "data" / "analysis" / "279_capability_tuple_matrix.csv"
OWNER_MAP_PATH = ROOT / "data" / "analysis" / "279_matrix_binding_and_projection_owner_map.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "279_capability_gap_log.json"

BUILDER_PATH = ROOT / "tools" / "analysis" / "build_279_phase4_booking_capability_pack.py"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_phase4_booking_capability_contracts.py"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

PLAYWRIGHT_PATH = ROOT / "tests" / "playwright" / "279_booking_capability_atlas.spec.ts"


INTEGRATION_MODES = [
    "im1_patient_api",
    "im1_transaction_api",
    "gp_connect_existing",
    "local_gateway_component",
    "manual_assist_only",
]

CAPABILITY_FIELDS = [
    "can_search_slots",
    "can_book",
    "can_cancel",
    "can_reschedule",
    "can_view_appointment",
    "can_hold_slot",
    "requires_gp_linkage_details",
    "supports_patient_self_service",
    "supports_staff_assisted_booking",
    "supports_async_commit_confirmation",
    "requires_local_consumer_component",
]

CAPABILITY_STATES = [
    "live_self_service",
    "live_staff_assist",
    "assisted_only",
    "linkage_required",
    "local_component_required",
    "degraded_manual",
    "recovery_only",
    "blocked",
]

EXPECTED_PROJECTION_STATES = [
    "self_service_live",
    "staff_assist_live",
    "assisted_only",
    "linkage_required",
    "local_component_required",
    "degraded_manual",
    "recovery_required",
    "blocked",
]

REQUIRED_EXTERNAL_URLS = [
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance",
    "https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7",
    "https://standards.nhs.uk/published-standards/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems",
    "https://standards.nhs.uk/published-standards/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems",
    "https://hl7.org/fhir/R4/appointment.html",
    "https://hl7.org/fhir/R4/slot.html",
]

REQUIRED_VISUAL_SOURCES = {
    "Playwright Test Assertions",
    "Linear changelog",
    "Vercel Academy nested layouts",
    "Vercel dashboard navigation",
    "IBM Carbon data-table usage",
    "NHS Service Manual typography",
    "NHS Service Manual content guidance",
}

REQUIRED_ATLAS_TEST_IDS = [
    "BookingCapabilityAtlas",
    "CapabilityAtlasMasthead",
    "SupplierRail",
    "ModeRail",
    "AudienceRail",
    "ActionScopeRail",
    "CapabilityMatrixCanvas",
    "CapabilityMatrixTable",
    "BindingLadderRegion",
    "BindingLadderTable",
    "TupleBraidRegion",
    "TupleBraidTable",
    "AudienceProjectionMapRegion",
    "AudienceProjectionTable",
    "ConfirmationGateStripRegion",
    "ConfirmationGateTable",
    "CapabilityInspector",
    "OwnerLedgerTable",
    "ReasonLedgerTable",
]

REQUIRED_ATLAS_TOKENS = [
    "max-width: 1680px;",
    "grid-template-columns: 300px minmax(0, 1fr) 420px;",
    "--canvas: #f7f8fa;",
    "--shell: #eef2f6;",
    "--accent-capability: #3158e0;",
    "--accent-assist: #0f766e;",
    "--accent-degraded: #b7791f;",
    "--accent-blocked: #b42318;",
    "Booking_Capability_Atlas",
]

REQUIRED_DOC_TOKENS = {
    ARCHITECTURE_PATH: [
        "Those four authorities are intentionally separate.",
        "Accepted-for-processing is not booked truth.",
        "one current matrix row",
    ],
    API_DOC_PATH: [
        "Patient and staff shells must render actionability only from `BookingCapabilityProjection`.",
        "patient controls may be live only when the underlying resolution is `live_self_service`",
        "If any of those refs drift, the capability tuple is stale.",
    ],
    SECURITY_DOC_PATH: [
        "accepted-for-processing is never equivalent to booked",
        "matrix rows are static published inventory",
        "This keeps adapter code from reintroducing ranking ownership",
    ],
}


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


def parse_atlas_data(html_text: str):
    match = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', html_text, re.S)
    require(match is not None, "ATLAS_DATA_SCRIPT_MISSING")
    payload = html.unescape(match.group(1))
    return json.loads(payload)


def check_docs() -> None:
    for path, tokens in REQUIRED_DOC_TOKENS.items():
        text = read_text(path)
        for token in tokens:
            require(token in text, f"DOC_TOKEN_MISSING:{path.name}:{token}")


def check_external_notes() -> None:
    notes = read_text(EXTERNAL_NOTES_PATH)
    for url in REQUIRED_EXTERNAL_URLS:
        require(url in notes, f"EXTERNAL_REFERENCE_URL_MISSING:{url}")
    require("Rejected: accepted-for-processing equals booked." in notes, "EXTERNAL_NOTES_REJECTION_MISSING")

    visual = load_json(VISUAL_NOTES_PATH)
    names = {entry["name"] for entry in visual["sources"]}
    missing = REQUIRED_VISUAL_SOURCES - names
    require(not missing, f"VISUAL_REFERENCE_SOURCES_MISSING:{sorted(missing)}")


def check_matrix_schema() -> dict:
    schema = load_json(MATRIX_SCHEMA_PATH)
    require(schema["properties"]["rows"]["items"]["properties"]["integrationMode"]["enum"] == INTEGRATION_MODES, "MATRIX_MODE_ENUM_DRIFT")
    capability_props = schema["properties"]["rows"]["items"]["properties"]["capabilities"]["properties"]
    require(sorted(capability_props.keys()) == sorted(CAPABILITY_FIELDS), "MATRIX_CAPABILITY_FIELDS_DRIFT")
    return schema


def check_resolution_and_projection_schemas() -> tuple[dict, dict]:
    resolution = load_json(RESOLUTION_SCHEMA_PATH)
    projection = load_json(PROJECTION_SCHEMA_PATH)

    require(resolution["properties"]["capabilityState"]["enum"] == CAPABILITY_STATES, "RESOLUTION_STATE_ENUM_DRIFT")
    require(
        projection["properties"]["surfaceState"]["enum"] == EXPECTED_PROJECTION_STATES,
        "PROJECTION_SURFACE_ENUM_DRIFT",
    )
    require(
        "x-capabilityTupleHashInputOrder" in resolution["properties"],
        "RESOLUTION_HASH_INPUT_ORDER_MISSING",
    )
    return resolution, projection


def check_registries() -> tuple[dict, dict, dict]:
    adapter_registry = load_json(ADAPTER_REGISTRY_PATH)
    degradation_registry = load_json(DEGRADATION_REGISTRY_PATH)
    policy_registry = load_json(POLICY_REGISTRY_PATH)

    require(len(adapter_registry["profiles"]) >= 5, "ADAPTER_PROFILE_COUNT_TOO_LOW")
    require(len(degradation_registry["profiles"]) >= 5, "DEGRADATION_PROFILE_COUNT_TOO_LOW")
    require(len(policy_registry["policies"]) >= 4, "POLICY_COUNT_TOO_LOW")

    integration_modes_seen = {
        mode
        for profile in adapter_registry["profiles"]
        for mode in profile["integrationModes"]
    }
    require(integration_modes_seen == set(INTEGRATION_MODES), "ADAPTER_REGISTRY_MODE_COVERAGE_DRIFT")
    return adapter_registry, degradation_registry, policy_registry


def check_csvs() -> list[dict[str, str]]:
    tuple_rows = load_csv(TUPLE_MATRIX_PATH)
    owner_rows = load_csv(OWNER_MAP_PATH)

    require(len(owner_rows) == 4, "OWNER_MAP_LAYER_COUNT_DRIFT")
    seen_states = {row["capabilityState"] for row in tuple_rows}
    require(seen_states == set(CAPABILITY_STATES), "TUPLE_MATRIX_STATE_COVERAGE_DRIFT")
    for row in tuple_rows:
        require(re.fullmatch(r"[a-f0-9]{64}", row["bindingHash"] or "") is not None, f"BINDING_HASH_INVALID:{row['scenarioId']}")
        require(re.fullmatch(r"[a-f0-9]{64}", row["capabilityTupleHash"] or "") is not None, f"TUPLE_HASH_INVALID:{row['scenarioId']}")
    return tuple_rows


def check_gap_log() -> None:
    gap_log = load_json(GAP_LOG_PATH)
    require(gap_log["taskId"] == TASK_ID, "GAP_LOG_TASK_ID_DRIFT")
    require(len(gap_log["gaps"]) == 3, "GAP_LOG_COUNT_DRIFT")
    owners = {gap["expectedOwnerTrack"] for gap in gap_log["gaps"]}
    require("seq_280" in owners, "GAP_LOG_SEQ_280_LINK_MISSING")


def check_package_scripts() -> None:
    package_json = load_json(PACKAGE_PATH)
    require(package_json["scripts"].get(SCRIPT_NAME) == SCRIPT_VALUE, "PACKAGE_SCRIPT_MISSING_OR_DRIFTED")
    require(ROOT_SCRIPT_UPDATES.get(SCRIPT_NAME) == SCRIPT_VALUE, "ROOT_SCRIPT_UPDATES_MISSING_OR_DRIFTED")
    root_script_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    require(SCRIPT_NAME in root_script_text, "ROOT_SCRIPT_UPDATES_FILE_TOKEN_MISSING")


def check_atlas(tuple_rows: list[dict[str, str]], policy_registry: dict) -> None:
    html_text = read_text(ATLAS_PATH)
    for token in REQUIRED_ATLAS_TOKENS:
        require(token in html_text, f"ATLAS_TOKEN_MISSING:{token}")
    for test_id in REQUIRED_ATLAS_TEST_IDS:
        require(f"data-testid=\"{test_id}\"" in html_text, f"ATLAS_TEST_ID_MISSING:{test_id}")

    atlas_data = parse_atlas_data(html_text)
    require(atlas_data["visualMode"] == VISUAL_MODE, "ATLAS_VISUAL_MODE_DRIFT")
    require(atlas_data["contractVersion"] == CONTRACT_VERSION, "ATLAS_CONTRACT_VERSION_DRIFT")

    matrix_refs = {row["providerCapabilityMatrixRef"] for row in atlas_data["matrixRows"]}
    binding_refs = {row["bookingProviderAdapterBindingId"] for row in atlas_data["bindings"]}
    policy_refs = {row["authoritativeReadAndConfirmationPolicyId"] for row in atlas_data["policies"]}
    scenario_ids = {row["scenarioId"] for row in atlas_data["scenarios"]}

    require(len(matrix_refs) == 6, "ATLAS_MATRIX_COUNT_DRIFT")
    require(len(binding_refs) == 6, "ATLAS_BINDING_COUNT_DRIFT")
    require(policy_refs == {policy["authoritativeReadAndConfirmationPolicyId"] for policy in policy_registry["policies"]}, "ATLAS_POLICY_SET_DRIFT")
    require({row["scenarioId"] for row in tuple_rows} == scenario_ids, "ATLAS_SCENARIO_SET_DRIFT")


def check_binding_uniqueness(atlas_data: dict) -> None:
    tuple_map: dict[tuple[str, str, str, tuple[str, ...], tuple[str, ...]], str] = {}
    for binding in atlas_data["bindings"]:
        key = (
            binding["providerCapabilityMatrixRef"],
            binding["supplierRef"],
            binding["integrationMode"],
            tuple(sorted(binding["selectionAudienceSet"])),
            tuple(sorted(binding["actionScopeSet"])),
        )
        previous = tuple_map.get(key)
        require(previous is None, f"DUPLICATE_LIVE_BINDING_TUPLE:{previous}:{binding['bookingProviderAdapterBindingId']}")
        tuple_map[key] = binding["bookingProviderAdapterBindingId"]


def check_projection_parity(atlas_data: dict) -> None:
    scenarios = atlas_data["scenarios"]
    rows_by_id = {row["providerCapabilityMatrixRef"]: row for row in atlas_data["matrixRows"]}
    projections_by_scenario = {
        scenario["scenarioId"]: next(
            projection
            for projection in atlas_data["projections"]
            if projection["bookingCapabilityProjectionId"] == f"PROJ_279_{scenario['scenarioId'].replace('SCN_279_', '')}"
        )
        for scenario in scenarios
    }
    groups: dict[str, list[dict]] = {}
    for scenario in scenarios:
        groups.setdefault(scenario["parityGroupId"], []).append(scenario)

    for group_id, group_rows in groups.items():
        audiences = {row["selectionAudience"] for row in group_rows}
        if audiences == {"patient", "staff"}:
            matrix_refs = {row["providerCapabilityMatrixRef"] for row in group_rows}
            require(len(matrix_refs) == 1, f"PARITY_GROUP_MATRIX_DRIFT:{group_id}")
            policy_refs = {
                next(
                    binding["authoritativeReadAndConfirmationPolicyRef"]
                    for binding in atlas_data["bindings"]
                    if binding["providerCapabilityMatrixRef"] == row["providerCapabilityMatrixRef"]
                )
                for row in group_rows
            }
            require(len(policy_refs) == 1, f"PARITY_GROUP_POLICY_DRIFT:{group_id}")
            live_rows = [row for row in group_rows if projections_by_scenario[row["scenarioId"]]["surfaceState"] in {"self_service_live", "staff_assist_live"}]
            require(live_rows, f"PARITY_GROUP_NO_LIVE_ROW:{group_id}")
            _ = rows_by_id[next(iter(matrix_refs))]


def check_action_exposure(tuple_rows: list[dict[str, str]], atlas_data: dict) -> None:
    policy_lookup = {policy["authoritativeReadAndConfirmationPolicyId"]: policy for policy in atlas_data["policies"]}
    matrix_lookup = {row["providerCapabilityMatrixRef"]: row for row in atlas_data["matrixRows"]}

    for row in tuple_rows:
        capability_state = row["capabilityState"]
        live_exposure = row["liveControlExposure"]
        if capability_state not in {"live_self_service", "live_staff_assist"}:
            require(live_exposure != "live", f"NON_LIVE_STATE_EXPOSED_AS_LIVE:{row['scenarioId']}")
        if row["selectionAudience"] == "patient" and capability_state != "live_self_service":
            exposed = {value.strip() for value in row["exposedActionScopes"].split(";") if value.strip()}
            forbidden = {"book_slot", "cancel_appointment", "reschedule_appointment", "manage_appointment"}
            require(not (exposed & forbidden), f"PATIENT_EXPOSED_UNSAFE_ACTION:{row['scenarioId']}")

        matrix_row = matrix_lookup[row["providerCapabilityMatrixRef"]]
        policy = policy_lookup[row["authoritativeReadAndConfirmationPolicyRef"]]
        if matrix_row["capabilities"]["supports_async_commit_confirmation"]:
            require(policy["gateRequiredStates"], f"ASYNC_POLICY_GATE_MISSING:{row['scenarioId']}")
        if matrix_row["authoritativeReadMode"] == "gate_required":
            require(policy["confirmationGateMode"] != "", f"GATE_REQUIRED_POLICY_MISSING:{row['scenarioId']}")


def main() -> None:
    for path in [
        ARCHITECTURE_PATH,
        API_DOC_PATH,
        SECURITY_DOC_PATH,
        ATLAS_PATH,
        MATRIX_SCHEMA_PATH,
        ADAPTER_REGISTRY_PATH,
        DEGRADATION_REGISTRY_PATH,
        POLICY_REGISTRY_PATH,
        BINDING_SCHEMA_PATH,
        RESOLUTION_SCHEMA_PATH,
        PROJECTION_SCHEMA_PATH,
        EXTERNAL_NOTES_PATH,
        VISUAL_NOTES_PATH,
        TUPLE_MATRIX_PATH,
        OWNER_MAP_PATH,
        GAP_LOG_PATH,
        BUILDER_PATH,
        VALIDATOR_PATH,
        PLAYWRIGHT_PATH,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    check_docs()
    check_external_notes()
    check_matrix_schema()
    check_resolution_and_projection_schemas()
    _, _, policy_registry = check_registries()
    tuple_rows = check_csvs()
    check_gap_log()
    check_package_scripts()
    atlas_data = parse_atlas_data(read_text(ATLAS_PATH))
    check_atlas(tuple_rows, policy_registry)
    check_binding_uniqueness(atlas_data)
    check_projection_parity(atlas_data)
    check_action_exposure(tuple_rows, atlas_data)


if __name__ == "__main__":
    main()
