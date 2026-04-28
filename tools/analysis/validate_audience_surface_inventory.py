#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from build_audience_surface_inventory import (
    AUDIENCE_TIER_DOC_PATH,
    CHANNELS,
    CHANNEL_DOC_PATH,
    CHANNEL_JSON_PATH,
    CHANNEL_PROFILES,
    CONFLICTS,
    CONFLICT_DOC_PATH,
    MERMAID_DOC_PATH,
    OWNERSHIP_DOC_PATH,
    PERSONAS,
    PERSONA_DOC_PATH,
    PERSONA_JSON_PATH,
    ROUTE_FAMILIES,
    ROUTE_FAMILY_CSV_PATH,
    SCOPE_POSTURES,
    SHELL_MAP_JSON_PATH,
    SHELL_TYPES,
    SURFACES,
    SURFACE_CSV_PATH,
    SURFACE_DOC_PATH,
)


EXPECTED_PERSONA_IDS = {item["persona_id"] for item in PERSONAS}
EXPECTED_CHANNEL_IDS = {item["channel_id"] for item in CHANNELS}
EXPECTED_ROUTE_FAMILY_IDS = {item["route_family_id"] for item in ROUTE_FAMILIES}
EXPECTED_SURFACE_IDS = {item["surface_id"] for item in SURFACES}
EXPECTED_CONFLICT_IDS = {item["conflict_id"] for item in CONFLICTS}

REQUIRED_PERSONA_IDS = {
    "patient_anonymous_intake",
    "patient_authenticated_portal",
    "patient_grant_scoped_recovery",
    "phone_ivr_caller",
    "patient_embedded_nhs_app",
    "clinician_designated_reviewer",
    "practice_operational_staff",
    "hub_coordinator",
    "pharmacy_servicing_assurance_user",
    "support_desk_agent",
    "operations_control_room_operator",
    "governance_admin_lead",
    "assistive_feature_consumer",
}

REQUIRED_CHANNEL_IDS = {
    "browser_web",
    "embedded_webview",
    "constrained_browser",
    "telephony_ivr",
    "sms_secure_link_continuation",
    "support_assisted_capture",
    "outbound_notification_delivery",
    "outbound_callback_delivery",
}

MUTATION_CONTROL_TOKENS = {
    "RouteIntentBinding",
    "CommandActionRecord",
    "CommandSettlementRecord",
    "ReviewActionLease",
    "SupportActionLease",
    "SupportReplayRestoreSettlement",
    "OpsActionEligibilityFence",
    "OpsSelectionLease",
    "OpsDeltaGate",
    "GovernanceFreezeDisposition",
    "SubmissionPromotionRecord",
    "AccessGrantRedemptionRecord",
    "HubOwnershipTransition",
    "HubOfferToConfirmationTruthProjection",
    "AssistiveInvocationGrant",
    "ArtifactPresentationContract",
    "ReleaseApprovalFreeze",
}

VISIBILITY_TOKENS = {
    "visibilityprojectionpolicy",
    "audiencevisibilitycoverage",
    "supportsurfaceruntimebinding",
    "audiencesurfaceruntimebinding",
    "patienttrustcuecontract",
    "visibility policy",
    "bookingcontinuityevidenceprojection",
    "reservationauthority",
    "patientexperiencecontinuityevidenceprojection",
    "artifactfallbackdisposition",
    "visualizationparityprojection",
    "workspacestatuspresentationcontract",
    "routefamilyownershipclaim",
    "supportcontinuityevidenceprojection",
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> dict:
    assert_true(path.exists(), f"Missing JSON artifact: {path}")
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    assert_true(path.exists(), f"Missing CSV artifact: {path}")
    with path.open() as handle:
        return list(csv.DictReader(handle))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing documentation artifact: {path}")
    return path.read_text()


def validate_personas(payload: dict) -> None:
    personas = payload["personas"]
    ids = {item["persona_id"] for item in personas}
    assert_true(ids == EXPECTED_PERSONA_IDS, "Persona catalog IDs drifted from the curated inventory.")
    assert_true(REQUIRED_PERSONA_IDS.issubset(ids), "One or more required personas are missing.")
    assert_true(payload["catalog_id"] == "persona_catalog_v1", "Unexpected persona catalog id.")

    for item in personas:
        assert_true(item["scope_posture"] in SCOPE_POSTURES, f"{item['persona_id']} uses invalid scope posture.")
        assert_true(bool(item["primary_shell_types"]), f"{item['persona_id']} is missing shell coverage.")
        assert_true(bool(item["primary_channel_ids"]), f"{item['persona_id']} is missing channel coverage.")
        assert_true(bool(item["source_refs"]), f"{item['persona_id']} is missing source refs.")

    grant_scoped = next(item for item in personas if item["persona_id"] == "patient_grant_scoped_recovery")
    assert_true(
        grant_scoped["base_audience_tier"] == "patient_public",
        "Grant-scoped recovery must compile down to patient_public base coverage.",
    )
    assistive = next(item for item in personas if item["persona_id"] == "assistive_feature_consumer")
    assert_true(
        assistive["scope_posture"] == "bounded_secondary",
        "Assistive feature consumer must remain bounded-secondary.",
    )


def validate_channels(payload: dict) -> None:
    channels = payload["channels"]
    ids = {item["channel_id"] for item in channels}
    assert_true(ids == EXPECTED_CHANNEL_IDS, "Channel inventory IDs drifted from the curated inventory.")
    assert_true(REQUIRED_CHANNEL_IDS.issubset(ids), "One or more required channels are missing.")
    assert_true(payload["inventory_id"] == "channel_inventory_v1", "Unexpected channel inventory id.")
    assert_true(payload["channel_profiles"] == CHANNEL_PROFILES, "Channel profile list drifted.")

    embedded = next(item for item in channels if item["channel_id"] == "embedded_webview")
    assert_true(embedded["scope_posture"] == "deferred", "Embedded channel must stay deferred.")
    telephony = next(item for item in channels if item["channel_id"] == "telephony_ivr")
    assert_true(
        "constrained_browser" in telephony["mapped_channel_profiles"],
        "Telephony inventory must map to constrained_browser posture by assumption.",
    )


def validate_surface_rows(rows: list[dict[str, str]]) -> None:
    ids = {item["surface_id"] for item in rows}
    assert_true(ids == EXPECTED_SURFACE_IDS, "Audience surface inventory rows drifted from the curated inventory.")
    assert_true(len(rows) == len(SURFACES), "Unexpected audience surface row count.")

    present_shells = {item["shell_type"] for item in rows}
    assert_true(
        {"patient", "staff", "hub", "pharmacy", "support", "operations", "governance"}.issubset(present_shells),
        "One or more primary shell families are missing from the audience surface inventory.",
    )

    for item in rows:
        surface_id = item["surface_id"]
        assert_true(item["scope_posture"] in SCOPE_POSTURES, f"{surface_id} uses invalid scope posture.")
        assert_true(
            item["channel_profile"] in CHANNEL_PROFILES,
            f"{surface_id} must declare a valid channel profile.",
        )
        assert_true(bool(item["ingress_channel_id"]), f"{surface_id} is missing ingress channel.")
        assert_true(bool(item["route_family_id"]), f"{surface_id} is missing route family id.")
        assert_true(bool(item["shell_type"]), f"{surface_id} is missing shell type.")
        assert_true(item["shell_ownership_mode"] == "primary_owner", f"{surface_id} must have exactly one primary shell owner.")
        assert_true(bool(item["governing_objects"]), f"{surface_id} is missing governing objects.")
        assert_true(bool(item["control_plane_rules"]), f"{surface_id} is missing control-plane rules.")
        assert_true(bool(item["visibility_policy_posture"]), f"{surface_id} is missing visibility posture.")
        assert_true(bool(item["source_refs"]), f"{surface_id} is missing source refs.")

        if item["allowed_mutations"] != "No direct mutation; launch the next safe child action from the current shell.":
            assert_true(
                any(token in item["governing_objects"] or token in item["control_plane_rules"] for token in MUTATION_CONTROL_TOKENS),
                f"{surface_id} is mutating but does not cite mutation governance.",
            )

        assert_true(
            any(
                token in (item["visibility_policy_posture"] + " " + item["control_plane_rules"]).lower()
                for token in VISIBILITY_TOKENS
            ),
            f"{surface_id} must cite visibility or disclosure governance.",
        )

    embedded_rows = [item for item in rows if item["persona_id"] == "patient_embedded_nhs_app"]
    assert_true(len(embedded_rows) == 1, "Expected exactly one embedded patient surface row.")
    assert_true(embedded_rows[0]["scope_posture"] == "deferred", "Embedded patient surface must remain deferred.")

    assistive_rows = [item for item in rows if item["persona_id"] == "assistive_feature_consumer"]
    assert_true(len(assistive_rows) == 1, "Expected exactly one assistive sidecar row.")
    assert_true(
        assistive_rows[0]["scope_posture"] == "bounded_secondary",
        "Assistive sidecar must remain bounded-secondary.",
    )

    support_capture_rows = [item for item in rows if item["ingress_channel_id"] == "support_assisted_capture"]
    assert_true(support_capture_rows, "Support-assisted capture must appear as an explicit surface row.")


def validate_route_rows(rows: list[dict[str, str]]) -> None:
    ids = {item["route_family_id"] for item in rows}
    assert_true(ids == EXPECTED_ROUTE_FAMILY_IDS, "Route family inventory IDs drifted from the curated inventory.")
    assert_true(len(rows) == len(ROUTE_FAMILIES), "Unexpected route family row count.")

    present_shells = {item["shell_type"] for item in rows}
    assert_true(set(SHELL_TYPES).issubset(present_shells), "Every shell type must appear in route-family inventory.")

    for item in rows:
        route_id = item["route_family_id"]
        assert_true(item["scope_posture"] in SCOPE_POSTURES, f"{route_id} uses invalid scope posture.")
        assert_true(bool(item["ownership_mode"]), f"{route_id} is missing ownership mode.")
        assert_true(bool(item["source_refs"]), f"{route_id} is missing source refs.")
        assert_true(bool(item["governing_objects"]), f"{route_id} is missing governing objects.")
        assert_true(bool(item["control_plane_rules"]), f"{route_id} is missing control-plane rules.")
        assert_true(bool(item["audience_tiers"]), f"{route_id} is missing audience tiers.")

    pharmacy = next(item for item in rows if item["route_family_id"] == "rf_pharmacy_console")
    assert_true(pharmacy["shell_type"] == "pharmacy", "Pharmacy routes must belong to the pharmacy shell.")
    governance = next(item for item in rows if item["route_family_id"] == "rf_governance_shell")
    assert_true(governance["shell_type"] == "governance", "Governance routes must belong to the governance shell.")
    assistive = next(item for item in rows if item["route_family_id"] == "rf_assistive_control_shell")
    assert_true(assistive["scope_posture"] == "conditional", "Standalone assistive control shell must remain conditional.")
    intake = next(item for item in rows if item["route_family_id"] == "rf_intake_self_service")
    assert_true(intake["explicit_route_contract"] == "derived", "Intake route family should remain explicitly derived.")


def validate_shell_map(payload: dict) -> None:
    assert_true(payload["map_id"] == "shell_ownership_map_v1", "Unexpected shell map id.")
    shells = payload["shells"]
    assert_true(len(shells) == len(SHELL_TYPES), "Shell map must include every shell type.")
    shell_types = {item["shell_type"] for item in shells}
    assert_true(shell_types == set(SHELL_TYPES), "Shell map shell types drifted.")

    route_claims = payload["route_family_claims"]
    claim_ids = {item["route_family_id"] for item in route_claims}
    assert_true(claim_ids == EXPECTED_ROUTE_FAMILY_IDS, "Shell map route claims drifted from route-family inventory.")

    conflict_ids = {item["conflict_id"] for item in payload["route_prefix_conflicts"]}
    assert_true(conflict_ids == EXPECTED_CONFLICT_IDS, "Shell map conflict ids drifted.")

    concept_ids = {item["concept_id"] for item in payload["canonical_resolutions"]}
    assert_true(
        concept_ids == {
            "UI_SHELL_FAMILY_OWNERSHIP",
            "UI_CHANNEL_PROFILE_CONSTRAINTS",
            "OWNERSHIP_VISIBILITY_POLICY",
            "ASSURANCE_CONTINUITY_EVIDENCE",
        },
        "Shell map must carry the required reconciliation concepts.",
    )


def validate_docs() -> None:
    persona_doc = load_text(PERSONA_DOC_PATH)
    channel_doc = load_text(CHANNEL_DOC_PATH)
    audience_doc = load_text(AUDIENCE_TIER_DOC_PATH)
    surface_doc = load_text(SURFACE_DOC_PATH)
    ownership_doc = load_text(OWNERSHIP_DOC_PATH)
    conflict_doc = load_text(CONFLICT_DOC_PATH)
    mermaid_doc = load_text(MERMAID_DOC_PATH)

    for token in [
        "Grant-scoped patient recovery is explicit",
        "Assistive is tracked as a bounded adjunct",
        "Personas inventoried:",
    ]:
        assert_true(token in persona_doc, f"Persona doc missing token: {token}")

    for token in [
        "Telephony parity is explicit",
        "Embedded delivery narrows shell posture",
        "Channel Matrix",
    ]:
        assert_true(token in channel_doc, f"Channel doc missing token: {token}")

    for token in [
        "Axis Definitions",
        "Phase 0 Base Audience Tiers",
        "Derived Surface Tiers Used By This Inventory",
    ]:
        assert_true(token in audience_doc, f"Audience tier doc missing token: {token}")

    for token in [
        "Persona-surface rows:",
        "Control Rules",
        "Support-assisted capture",
    ]:
        assert_true(token in surface_doc, f"Surface doc missing token: {token}")

    for token in [
        "Shell Ownership Matrix",
        "Route Family Claims",
        "UI_SHELL_FAMILY_OWNERSHIP",
    ]:
        assert_true(token in ownership_doc, f"Ownership doc missing token: {token}")

    for token in [
        "CONFLICT_004_001",
        "GAP_004_001",
        "ASSUMPTION_ROUTE_004_003",
    ]:
        assert_true(token in conflict_doc, f"Conflict doc missing token: {token}")

    for token in [
        "graph LR",
        'patient["Patient shell"]',
        'pharmacy_routes["/workspace/pharmacy/*"]',
        'support_routes["/ops/support/*"]',
    ]:
        assert_true(token in mermaid_doc, f"Mermaid map missing token: {token}")


def main() -> None:
    persona_payload = load_json(PERSONA_JSON_PATH)
    channel_payload = load_json(CHANNEL_JSON_PATH)
    shell_map_payload = load_json(SHELL_MAP_JSON_PATH)
    surface_rows = load_csv(SURFACE_CSV_PATH)
    route_rows = load_csv(ROUTE_FAMILY_CSV_PATH)

    validate_personas(persona_payload)
    validate_channels(channel_payload)
    validate_surface_rows(surface_rows)
    validate_route_rows(route_rows)
    validate_shell_map(shell_map_payload)
    validate_docs()


if __name__ == "__main__":
    main()
