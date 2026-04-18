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


TASK_ID = "seq_278"
CONTRACT_VERSION = "278.phase4.booking-case-freeze.v1"
VISUAL_MODE = "Booking_Case_State_Atlas"
SCRIPT_NAME = "validate:278-phase4-booking-case-contracts"
SCRIPT_VALUE = "python3 ./tools/analysis/validate_phase4_booking_case_contracts.py"

ARCHITECTURE_PATH = ROOT / "docs" / "architecture" / "278_phase4_booking_case_contract_and_state_machine.md"
API_DOC_PATH = ROOT / "docs" / "api" / "278_phase4_booking_case_route_and_projection_contract.md"
SECURITY_DOC_PATH = ROOT / "docs" / "security" / "278_phase4_booking_lineage_epoch_and_identity_repair_rules.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "278_phase4_booking_case_state_atlas.html"

HANDOFF_SCHEMA_PATH = ROOT / "data" / "contracts" / "278_booking_intent_handoff.schema.json"
BOOKING_CASE_SCHEMA_PATH = ROOT / "data" / "contracts" / "278_booking_case.schema.json"
SEARCH_POLICY_SCHEMA_PATH = ROOT / "data" / "contracts" / "278_search_policy.schema.json"
STATE_MACHINE_PATH = ROOT / "data" / "contracts" / "278_booking_case_state_machine.json"
ROUTE_REGISTRY_PATH = ROOT / "data" / "contracts" / "278_patient_booking_route_family_registry.yaml"
PROJECTION_BUNDLE_PATH = ROOT / "data" / "contracts" / "278_patient_appointment_projection_bundle.json"
EVENT_CATALOG_PATH = ROOT / "data" / "contracts" / "278_booking_case_event_catalog.json"

REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "278_visual_reference_notes.json"
TRANSITION_MATRIX_PATH = ROOT / "data" / "analysis" / "278_booking_case_transition_matrix.csv"
ROUTE_MATRIX_PATH = ROOT / "data" / "analysis" / "278_route_and_projection_matrix.csv"
GAP_LOG_PATH = ROOT / "data" / "analysis" / "278_booking_case_gap_log.json"
INTERFACE_GAP_PATH = ROOT / "data" / "analysis" / "PHASE4_INTERFACE_GAP_BOOKING_CASE_KERNEL.json"

PLAYWRIGHT_PATH = ROOT / "tests" / "playwright" / "278_booking_case_state_atlas.spec.ts"
BUILDER_PATH = ROOT / "tools" / "analysis" / "build_278_phase4_booking_case_pack.py"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_phase4_booking_case_contracts.py"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

REQUIRED_STATES = [
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

EXPECTED_STATE_FAMILIES = [
    ("intake", ["handoff_received", "capability_checked"]),
    ("search", ["searching_local", "offers_ready", "selecting", "revalidating"]),
    ("commit", ["commit_pending", "booked", "confirmation_pending", "supplier_reconciliation_pending"]),
    ("continuation", ["waitlisted", "fallback_to_hub", "callback_fallback", "booking_failed"]),
    ("managed", ["managed", "closed"]),
]

EXPECTED_TRANSITIONS = {
    "handoff_received": ["capability_checked"],
    "capability_checked": ["searching_local"],
    "searching_local": ["offers_ready", "waitlisted", "callback_fallback", "fallback_to_hub", "booking_failed"],
    "offers_ready": ["selecting", "waitlisted", "callback_fallback", "fallback_to_hub", "booking_failed"],
    "selecting": ["revalidating", "offers_ready", "waitlisted", "callback_fallback", "fallback_to_hub", "booking_failed"],
    "revalidating": ["commit_pending", "offers_ready", "waitlisted", "callback_fallback", "fallback_to_hub", "booking_failed"],
    "commit_pending": ["booked", "confirmation_pending", "supplier_reconciliation_pending", "waitlisted", "callback_fallback", "fallback_to_hub", "booking_failed"],
    "booked": ["managed"],
    "confirmation_pending": ["managed", "supplier_reconciliation_pending", "booking_failed", "callback_fallback", "fallback_to_hub"],
    "supplier_reconciliation_pending": ["managed", "booking_failed", "callback_fallback", "fallback_to_hub"],
    "waitlisted": ["selecting", "revalidating", "callback_fallback", "fallback_to_hub", "booking_failed", "managed"],
    "managed": ["searching_local", "supplier_reconciliation_pending", "closed"],
    "callback_fallback": ["closed"],
    "fallback_to_hub": ["closed"],
    "booking_failed": ["closed"],
}

EXPECTED_ROUTE_IDS = [
    "patient_appointments_list",
    "patient_booking_workspace",
    "patient_booking_select",
    "patient_booking_confirm",
    "patient_appointment_summary",
    "patient_appointment_manage",
    "patient_appointment_cancel",
    "patient_appointment_reschedule",
]

EXPECTED_ROUTE_PATHS = [
    "/appointments",
    "/bookings/:bookingCaseId",
    "/bookings/:bookingCaseId/select",
    "/bookings/:bookingCaseId/confirm",
    "/appointments/:appointmentId",
    "/appointments/:appointmentId/manage",
    "/appointments/:appointmentId/cancel",
    "/appointments/:appointmentId/reschedule",
]

EXPECTED_PROJECTION_IDS = [
    "PatientAppointmentListProjection",
    "PatientAppointmentWorkspaceProjection",
    "PatientAppointmentManageProjection",
    "PatientAppointmentArtifactProjection",
]

EXPECTED_NULL_SCHEMA_EVENTS = [
    "booking.case.created",
    "booking.waitlist.joined",
    "booking.waitlist.deadline_evaluated",
    "booking.waitlist.offer.sent",
    "booking.waitlist.offer.accepted",
    "booking.waitlist.offer.expired",
    "booking.waitlist.offer.superseded",
    "booking.waitlist.fallback.required",
    "booking.fallback.callback_requested",
    "booking.fallback.hub_requested",
    "booking.exception.raised",
]

EXPECTED_API_SURFACE = [
    ("POST", "/v1/bookings/cases"),
    ("GET", "/v1/bookings/cases/{bookingCaseId}"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:search"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:select-slot"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:confirm"),
    ("GET", "/v1/appointments/{appointmentId}"),
    ("POST", "/v1/appointments/{appointmentId}:cancel"),
    ("POST", "/v1/appointments/{appointmentId}:reschedule"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:join-waitlist"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:fallback-callback"),
    ("POST", "/v1/bookings/cases/{bookingCaseId}:fallback-hub"),
]

EXPECTED_INTERFACE_GAPS = {
    "PHASE4_GAP_278_001": "seq_279",
    "PHASE4_GAP_278_002": "seq_280",
    "PHASE4_GAP_278_003": "par_282",
}

EXPECTED_ROUTE_PUBLICATION_CONTROLS = {
    "PatientShellConsistencyProjection",
    "AudienceSurfaceRouteContract",
    "SurfacePublication",
    "RuntimePublicationBundle",
    "RouteFreezeDisposition",
    "ReleaseRecoveryDisposition",
}

EXPECTED_DOC_TOKENS = {
    ARCHITECTURE_PATH: [
        "`LifecycleCoordinator` remains the only request-closure authority.",
        "case state does not stand in for capability state",
        "Those gaps are also published machine-readably",
    ],
    API_DOC_PATH: [
        "Route publication drift freezes the shell in place through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`",
        "SelectedAnchor",
        "LifecycleCoordinator",
    ],
    SECURITY_DOC_PATH: [
        "Wrong-patient correction preserves summary provenance only",
        "Request lifecycle lease drift or ownership epoch drift creates stale-owner recovery",
        "no booking-local closure authority",
    ],
}

EXPECTED_ATLAS_TEST_IDS = [
    "BookingCaseStateAtlas",
    "BookingCaseAtlasMasthead",
    "StateFamilyRail",
    "CaseStateLatticeRegion",
    "CaseStateLattice",
    "CaseStateLatticeEdges",
    "LineageFenceBraid",
    "RouteFamilyLadder",
    "PatientProjectionMap",
    "InspectorPanel",
    "TransitionTable",
    "ApiSurfaceTable",
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


def parse_yaml_scalar(raw: str):
    value = raw.strip()
    if value in {"true", "false"}:
        return value == "true"
    if value == "null":
        return None
    if value.startswith('"') and value.endswith('"'):
        return json.loads(value)
    return value


def parse_route_registry(text: str) -> list[dict[str, object]]:
    lines = text.splitlines()
    entries: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    current_list_key: str | None = None
    in_route_families = False

    for raw in lines:
        if raw.startswith("routeFamilies:"):
            in_route_families = True
            continue
        if not in_route_families:
            continue
        if raw.startswith("  - routeId: "):
            if current is not None:
                entries.append(current)
            current = {"routeId": parse_yaml_scalar(raw.split(":", 1)[1])}
            current_list_key = None
            continue
        if current is None:
            continue
        if current_list_key and raw.startswith("    - "):
            current[current_list_key].append(parse_yaml_scalar(raw.split("-", 1)[1]))
            continue
        if raw.startswith("    "):
            key, _, value = raw.strip().partition(":")
            value = value.lstrip()
            if value == "":
                current[key] = []
                current_list_key = key
            else:
                current[key] = parse_yaml_scalar(value)
                current_list_key = None

    if current is not None:
        entries.append(current)
    return entries


def parse_atlas_data(atlas_html: str):
    match = re.search(
        r'<script id="atlas-data" type="application/json">(.*?)</script>',
        atlas_html,
        flags=re.DOTALL,
    )
    require(match is not None, "278_ATLAS_DATA_SCRIPT_MISSING")
    return json.loads(html.unescape(match.group(1)))


def main() -> None:
    for path in [
        ARCHITECTURE_PATH,
        API_DOC_PATH,
        SECURITY_DOC_PATH,
        ATLAS_PATH,
        HANDOFF_SCHEMA_PATH,
        BOOKING_CASE_SCHEMA_PATH,
        SEARCH_POLICY_SCHEMA_PATH,
        STATE_MACHINE_PATH,
        ROUTE_REGISTRY_PATH,
        PROJECTION_BUNDLE_PATH,
        EVENT_CATALOG_PATH,
        REFERENCE_NOTES_PATH,
        TRANSITION_MATRIX_PATH,
        ROUTE_MATRIX_PATH,
        GAP_LOG_PATH,
        INTERFACE_GAP_PATH,
        PLAYWRIGHT_PATH,
        BUILDER_PATH,
        VALIDATOR_PATH,
        PACKAGE_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
    ]:
        require(path.exists(), f"MISSING_REQUIRED_FILE:{path}")

    architecture_text = read_text(ARCHITECTURE_PATH)
    api_doc_text = read_text(API_DOC_PATH)
    security_doc_text = read_text(SECURITY_DOC_PATH)
    atlas_html = read_text(ATLAS_PATH)
    playwright_text = read_text(PLAYWRIGHT_PATH)
    package_text = read_text(PACKAGE_PATH)
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    route_registry_text = read_text(ROUTE_REGISTRY_PATH)

    handoff_schema = load_json(HANDOFF_SCHEMA_PATH)
    booking_case_schema = load_json(BOOKING_CASE_SCHEMA_PATH)
    search_policy_schema = load_json(SEARCH_POLICY_SCHEMA_PATH)
    state_machine = load_json(STATE_MACHINE_PATH)
    projection_bundle = load_json(PROJECTION_BUNDLE_PATH)
    event_catalog = load_json(EVENT_CATALOG_PATH)
    reference_notes = load_json(REFERENCE_NOTES_PATH)
    gap_log = load_json(GAP_LOG_PATH)
    interface_gap = load_json(INTERFACE_GAP_PATH)
    transition_matrix = load_csv(TRANSITION_MATRIX_PATH)
    route_matrix = load_csv(ROUTE_MATRIX_PATH)
    route_registry = parse_route_registry(route_registry_text)
    atlas_data = parse_atlas_data(atlas_html)

    require(ROOT_SCRIPT_UPDATES[SCRIPT_NAME] == SCRIPT_VALUE, "278_ROOT_SCRIPT_UPDATE_DRIFT")
    script_token = f'"{SCRIPT_NAME}": "{SCRIPT_VALUE}"'
    require(script_token in package_text, "278_PACKAGE_SCRIPT_MISSING")
    require(script_token in root_script_updates_text, "278_ROOT_SCRIPT_FILE_MISSING")

    require(reference_notes["taskId"] == TASK_ID, "278_REFERENCE_TASK_ID_DRIFT")
    require(reference_notes["reviewedOn"] == "2026-04-18", "278_REFERENCE_DATE_DRIFT")
    require(len(reference_notes["references"]) == 10, "278_REFERENCE_COUNT_DRIFT")
    require(
        all(entry["borrowed"] and entry["rejected"] and entry["url"] for entry in reference_notes["references"]),
        "278_REFERENCE_NOTES_INCOMPLETE",
    )
    publishers = {entry["publisher"] for entry in reference_notes["references"]}
    for publisher in [
        "NHS digital service manual",
        "W3C WAI-ARIA Authoring Practices Guide",
        "Linear",
        "Vercel Academy",
        "Vercel",
        "IBM Carbon Design System",
        "Playwright",
    ]:
        require(publisher in publishers, f"278_REFERENCE_PUBLISHER_MISSING:{publisher}")

    require(handoff_schema["title"] == "278 BookingIntent handoff", "278_HANDOFF_TITLE_DRIFT")
    require(
        handoff_schema["properties"]["lifecycleClosureAuthority"]["const"] == "LifecycleCoordinator",
        "278_HANDOFF_CLOSURE_AUTHORITY_DRIFT",
    )
    require(
        handoff_schema["properties"]["decisionEpochRef"]["x-phase4TargetField"] == "sourceDecisionEpochRef",
        "278_HANDOFF_DECISION_EPOCH_MAPPING_DRIFT",
    )
    require(
        handoff_schema["properties"]["decisionSupersessionRecordRef"]["x-phase4TargetField"] == "sourceDecisionSupersessionRef",
        "278_HANDOFF_SUPERSESSION_MAPPING_DRIFT",
    )
    require(
        handoff_schema["properties"]["lifecycleLeaseRef"]["x-phase4TargetField"] == "requestLifecycleLeaseRef",
        "278_HANDOFF_LIFECYCLE_LEASE_MAPPING_DRIFT",
    )
    require(
        handoff_schema["properties"]["ownershipEpoch"]["x-phase4TargetField"] == "ownershipEpoch",
        "278_HANDOFF_OWNERSHIP_EPOCH_MAPPING_DRIFT",
    )

    require(booking_case_schema["title"] == "278 BookingCase", "278_CASE_TITLE_DRIFT")
    require(
        booking_case_schema["properties"]["closureAuthority"]["const"] == "LifecycleCoordinator",
        "278_CASE_CLOSURE_AUTHORITY_DRIFT",
    )
    require(
        booking_case_schema["properties"]["status"]["enum"] == REQUIRED_STATES,
        "278_CASE_STATUS_ENUM_DRIFT",
    )
    require(len(booking_case_schema["x-authorityAxes"]) == 6, "278_CASE_AUTHORITY_AXIS_COUNT_DRIFT")
    require(
        any("No booking branch may close the request directly" in rule for rule in booking_case_schema["x-governedInvariants"]),
        "278_CASE_REQUEST_CLOSURE_INVARIANT_MISSING",
    )
    for property_name in [
        "sourceDecisionEpochRef",
        "sourceDecisionSupersessionRef",
        "lineageCaseLinkRef",
        "requestLifecycleLeaseRef",
        "ownershipEpoch",
        "identityRepairBranchDispositionRef",
        "patientShellConsistencyProjectionRef",
        "patientEmbeddedSessionProjectionRef",
        "surfaceRouteContractRef",
        "surfacePublicationRef",
        "runtimePublicationBundleRef",
        "routeFreezeDispositionRef",
        "releaseRecoveryDispositionRef",
    ]:
        require(property_name in booking_case_schema["properties"], f"278_CASE_BINDING_FIELD_MISSING:{property_name}")

    require(search_policy_schema["title"] == "278 SearchPolicy", "278_SEARCH_POLICY_TITLE_DRIFT")
    require(
        search_policy_schema["required"]
        == [
            "policyId",
            "timeframeEarliest",
            "timeframeLatest",
            "modality",
            "clinicianType",
            "continuityPreference",
            "sitePreference",
            "accessibilityNeeds",
            "maxTravelTime",
            "bookabilityPolicy",
            "selectionAudience",
            "patientChannelMode",
            "policyBundleHash",
            "sameBandReorderSlackMinutesByWindow",
        ],
        "278_SEARCH_POLICY_REQUIRED_FIELDS_DRIFT",
    )
    require(
        search_policy_schema["properties"]["selectionAudience"]["enum"] == ["patient_self_service", "staff_assist"],
        "278_SEARCH_POLICY_SELECTION_AUDIENCE_DRIFT",
    )
    require(
        search_policy_schema["properties"]["patientChannelMode"]["enum"]
        == ["signed_in_shell", "embedded_nhs_app", "staff_proxy"],
        "278_SEARCH_POLICY_CHANNEL_MODE_DRIFT",
    )

    require(state_machine["taskId"] == TASK_ID, "278_STATE_MACHINE_TASK_ID_DRIFT")
    require(state_machine["contractVersion"] == CONTRACT_VERSION, "278_STATE_MACHINE_VERSION_DRIFT")
    require(state_machine["visualMode"] == VISUAL_MODE, "278_STATE_MACHINE_VISUAL_MODE_DRIFT")
    require(state_machine["aggregate"] == "BookingCase", "278_STATE_MACHINE_AGGREGATE_DRIFT")
    require(state_machine["closureAuthority"] == "LifecycleCoordinator", "278_STATE_MACHINE_CLOSURE_AUTHORITY_DRIFT")
    require([entry["stateId"] for entry in state_machine["states"]] == REQUIRED_STATES, "278_STATE_ORDER_DRIFT")
    require(len(state_machine["states"]) == 16, "278_STATE_COUNT_DRIFT")
    require(len(state_machine["transitions"]) == 53, "278_TRANSITION_COUNT_DRIFT")
    require(len(transition_matrix) == 53, "278_TRANSITION_MATRIX_COUNT_DRIFT")
    require(
        [(entry["familyId"], entry["states"]) for entry in state_machine["stateFamilies"]]
        == EXPECTED_STATE_FAMILIES,
        "278_STATE_FAMILY_DRIFT",
    )

    transition_map: dict[str, list[str]] = {}
    for transition in state_machine["transitions"]:
        transition_map.setdefault(transition["from"], []).append(transition["to"])
        require(bool(transition["predicate"]), f"278_TRANSITION_PREDICATE_MISSING:{transition['transitionId']}")
        require(bool(transition["controllingObject"]), f"278_TRANSITION_CONTROL_OBJECT_MISSING:{transition['transitionId']}")
        require(
            transition["ownerTask"] in {"seq_278", "seq_279", "seq_280"},
            f"278_TRANSITION_OWNER_DRIFT:{transition['transitionId']}",
        )
        require(
            transition["sourceRef"]
            in {
                "blueprint/phase-4-the-booking-engine.md#4A. Booking contract, case model, and state machine",
                "blueprint/phase-4-the-booking-engine.md#4D. Offer sessions, slot choice, commit path, and authoritative booking truth",
                "blueprint/phase-4-the-booking-engine.md#4E. Waitlist, fallback, and no-slot truth",
                "blueprint/phase-4-the-booking-engine.md#4F. Appointment management: cancel, reschedule, reminders, and detail updates",
            },
            f"278_TRANSITION_SOURCE_DRIFT:{transition['transitionId']}",
        )
    require(transition_map == EXPECTED_TRANSITIONS, "278_TRANSITION_GRAPH_DRIFT")

    touched_states = {state: 0 for state in REQUIRED_STATES}
    for transition in state_machine["transitions"]:
        touched_states[transition["from"]] += 1
        touched_states[transition["to"]] += 1
    require(all(count > 0 for count in touched_states.values()), "278_STATE_WITHOUT_TRANSITION_DEFINITION")

    require(len(route_registry) == 8, "278_ROUTE_REGISTRY_COUNT_DRIFT")
    require([entry["routeId"] for entry in route_registry] == EXPECTED_ROUTE_IDS, "278_ROUTE_ID_ORDER_DRIFT")
    require([entry["path"] for entry in route_registry] == EXPECTED_ROUTE_PATHS, "278_ROUTE_PATH_ORDER_DRIFT")
    for entry in route_registry:
        require(entry["sameShell"] is True, f"278_ROUTE_NOT_SAME_SHELL:{entry['routeId']}")
        require(entry["returnContractRequired"] is True, f"278_ROUTE_RETURN_CONTRACT_MISSING:{entry['routeId']}")
        require(entry["selectedAnchorPolicy"] == "preserve_last_safe_anchor", f"278_ROUTE_ANCHOR_POLICY_DRIFT:{entry['routeId']}")
        require(entry["closureAuthority"] == "LifecycleCoordinator", f"278_ROUTE_CLOSURE_AUTHORITY_DRIFT:{entry['routeId']}")
        require(
            EXPECTED_ROUTE_PUBLICATION_CONTROLS <= set(entry["publicationControls"]),
            f"278_ROUTE_PUBLICATION_CONTROL_DRIFT:{entry['routeId']}",
        )

    require(projection_bundle["taskId"] == TASK_ID, "278_PROJECTION_BUNDLE_TASK_ID_DRIFT")
    require(projection_bundle["bundleVersion"] == CONTRACT_VERSION, "278_PROJECTION_BUNDLE_VERSION_DRIFT")
    require(projection_bundle["closureAuthority"] == "LifecycleCoordinator", "278_PROJECTION_BUNDLE_CLOSURE_AUTHORITY_DRIFT")
    require(
        [projection["projectionId"] for projection in projection_bundle["projections"]] == EXPECTED_PROJECTION_IDS,
        "278_PROJECTION_ID_ORDER_DRIFT",
    )
    require(len(projection_bundle["projections"]) == 4, "278_PROJECTION_COUNT_DRIFT")
    require(
        any("Browser history is not the authority" in invariant for invariant in projection_bundle["bundleInvariants"]),
        "278_BROWSER_HISTORY_INVARIANT_MISSING",
    )
    require(
        any("PersistentShell" in invariant for invariant in projection_bundle["bundleInvariants"]),
        "278_PERSISTENT_SHELL_INVARIANT_MISSING",
    )
    for projection in projection_bundle["projections"]:
        require(projection["sameShell"] is True, f"278_PROJECTION_NOT_SAME_SHELL:{projection['projectionId']}")
        require(
            projection["selectedAnchorPolicy"] == "preserve_last_safe_anchor",
            f"278_PROJECTION_ANCHOR_POLICY_DRIFT:{projection['projectionId']}",
        )
        require(
            "PatientNavReturnContract" in projection["continuityRequirements"],
            f"278_PROJECTION_RETURN_CONTRACT_MISSING:{projection['projectionId']}",
        )

    require(event_catalog["taskId"] == TASK_ID, "278_EVENT_CATALOG_TASK_ID_DRIFT")
    require(event_catalog["catalogVersion"] == CONTRACT_VERSION, "278_EVENT_CATALOG_VERSION_DRIFT")
    require(event_catalog["closureAuthority"] == "LifecycleCoordinator", "278_EVENT_CATALOG_CLOSURE_AUTHORITY_DRIFT")
    require(len(event_catalog["events"]) == 27, "278_EVENT_CATALOG_COUNT_DRIFT")
    null_schema_events = [entry["eventName"] for entry in event_catalog["events"] if entry["schemaPath"] is None]
    require(null_schema_events == EXPECTED_NULL_SCHEMA_EVENTS, "278_NULL_SCHEMA_EVENT_SET_DRIFT")
    for event in event_catalog["events"]:
        require(event["freezeOwnerTask"] == TASK_ID, f"278_EVENT_FREEZE_OWNER_DRIFT:{event['eventName']}")
        if event["schemaPath"] is not None:
            require(Path(event["schemaPath"]).exists(), f"278_EVENT_SCHEMA_PATH_MISSING:{event['eventName']}")
        else:
            require(event["implementationOwnerTask"] == "par_282", f"278_EVENT_OWNER_DRIFT:{event['eventName']}")

    require(gap_log["taskId"] == TASK_ID, "278_GAP_LOG_TASK_ID_DRIFT")
    require(gap_log["visualMode"] == VISUAL_MODE, "278_GAP_LOG_VISUAL_MODE_DRIFT")
    require(gap_log["gapState"] == "typed_seams_published", "278_GAP_LOG_STATE_DRIFT")
    require(len(gap_log["gaps"]) == 3, "278_GAP_LOG_COUNT_DRIFT")

    require(interface_gap["taskId"] == TASK_ID, "278_INTERFACE_GAP_TASK_ID_DRIFT")
    require(interface_gap["visualMode"] == VISUAL_MODE, "278_INTERFACE_GAP_VISUAL_MODE_DRIFT")
    require(interface_gap["contractVersion"] == CONTRACT_VERSION, "278_INTERFACE_GAP_VERSION_DRIFT")
    require(len(interface_gap["gaps"]) == 3, "278_INTERFACE_GAP_COUNT_DRIFT")
    for entry in interface_gap["gaps"]:
        require(
            EXPECTED_INTERFACE_GAPS.get(entry["gapId"]) == entry["expectedOwnerTask"],
            f"278_INTERFACE_GAP_OWNER_DRIFT:{entry['gapId']}",
        )
        require(bool(entry["typedSeams"]), f"278_INTERFACE_GAP_TYPED_SEAMS_MISSING:{entry['gapId']}")

    require(len(route_matrix) == 8, "278_ROUTE_MATRIX_COUNT_DRIFT")
    require(
        [row["routeId"] for row in route_matrix] == EXPECTED_ROUTE_IDS,
        "278_ROUTE_MATRIX_ID_DRIFT",
    )
    require(
        [row["path"] for row in route_matrix] == EXPECTED_ROUTE_PATHS,
        "278_ROUTE_MATRIX_PATH_DRIFT",
    )
    require(all(row["sameShell"] == "true" for row in route_matrix), "278_ROUTE_MATRIX_SAME_SHELL_DRIFT")

    for path, tokens in EXPECTED_DOC_TOKENS.items():
        text = read_text(path)
        for token in tokens:
            require(token in text, f"278_DOC_TOKEN_MISSING:{path.name}:{token}")

    require('data-testid="BookingCaseStateAtlas"' in atlas_html, "278_ATLAS_ROOT_TEST_ID_MISSING")
    require(f'data-visual-mode="{VISUAL_MODE}"' in atlas_html, "278_ATLAS_VISUAL_MODE_MISSING")
    for test_id in EXPECTED_ATLAS_TEST_IDS:
        require(f'data-testid="{test_id}"' in atlas_html, f"278_ATLAS_TEST_ID_MISSING:{test_id}")

    require(atlas_data["taskId"] == TASK_ID, "278_ATLAS_DATA_TASK_ID_DRIFT")
    require(atlas_data["contractVersion"] == CONTRACT_VERSION, "278_ATLAS_DATA_VERSION_DRIFT")
    require(atlas_data["visualMode"] == VISUAL_MODE, "278_ATLAS_DATA_VISUAL_MODE_DRIFT")
    require(list(atlas_data["stateDetails"].keys()) == REQUIRED_STATES, "278_ATLAS_STATE_DRIFT")
    require([route["routeId"] for route in atlas_data["routes"]] == EXPECTED_ROUTE_IDS, "278_ATLAS_ROUTE_ID_DRIFT")
    require([route["path"] for route in atlas_data["routes"]] == EXPECTED_ROUTE_PATHS, "278_ATLAS_ROUTE_PATH_DRIFT")
    require(
        [projection["projectionId"] for projection in atlas_data["projections"]] == EXPECTED_PROJECTION_IDS,
        "278_ATLAS_PROJECTION_ID_DRIFT",
    )
    require(
        atlas_data["events"] == event_catalog["events"],
        "278_ATLAS_EVENT_CATALOG_DRIFT",
    )
    require(
        [(entry["method"], entry["path"]) for entry in atlas_data["apiSurface"]] == EXPECTED_API_SURFACE,
        "278_ATLAS_API_SURFACE_DRIFT",
    )
    require(
        len(atlas_data["transitions"]) == len(state_machine["transitions"]),
        "278_ATLAS_TRANSITION_COUNT_DRIFT",
    )

    for token in [
        "RouteFamilyLadder",
        "LineageFenceBraid",
        "PatientProjectionMap",
        "CaseStateLattice",
        "TransitionTable",
        "ApiSurfaceTable",
        "RouteButton-patient_booking_workspace",
        "StateButton-handoff_received",
        "StateNode-managed",
    ]:
        require(token in playwright_text, f"278_PLAYWRIGHT_TOKEN_MISSING:{token}")

    summary = {
        "taskId": TASK_ID,
        "stateCount": len(REQUIRED_STATES),
        "transitionCount": len(state_machine["transitions"]),
        "routeCount": len(route_registry),
        "projectionCount": len(projection_bundle["projections"]),
        "eventCount": len(event_catalog["events"]),
        "nullSchemaEventCount": len(null_schema_events),
        "referenceCount": len(reference_notes["references"]),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
