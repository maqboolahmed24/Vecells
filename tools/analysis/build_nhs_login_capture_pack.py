#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-login"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

PACK_JSON_PATH = DATA_DIR / "nhs_login_capture_pack.json"
REDIRECT_CSV_PATH = DATA_DIR / "nhs_login_redirect_uri_matrix.csv"
SCOPE_CSV_PATH = DATA_DIR / "nhs_login_scope_claim_matrix.csv"
CLIENT_REGISTRY_PATH = DATA_DIR / "nhs_login_mock_client_registry.json"
PLACEHOLDER_PATH = DATA_DIR / "nhs_login_actual_credential_placeholders.json"

MOCK_SPEC_PATH = DOCS_DIR / "25_nhs_login_mock_service_spec.md"
REDIRECT_SCOPE_DOC_PATH = DOCS_DIR / "25_redirect_uri_and_scope_matrix.md"
RUNBOOK_PATH = DOCS_DIR / "25_credential_capture_and_vault_ingest_runbook.md"
ENVIRONMENT_PACK_PATH = DOCS_DIR / "25_nhs_login_environment_profile_pack.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "nhsLoginCapturePack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "nhs-login-capture-pack.json"
README_PATH = APP_DIR / "README.md"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "gateway_surface_split_matrix": DATA_DIR / "gateway_surface_split_matrix.csv",
    "acting_scope_tuple_matrix": DATA_DIR / "acting_scope_tuple_matrix.csv",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "nhs_login_application_field_map": DATA_DIR / "nhs_login_application_field_map.json",
    "nhs_login_live_gate_conditions": DATA_DIR / "nhs_login_live_gate_conditions.json",
}

VISUAL_MODE = "Bluewoven_Identity_Simulator"
MISSION = (
    "Create the NHS login credentials, redirect-URI, scopes, environment-profile, and "
    "client-registration execution pack in two explicit parts: a high-fidelity local mock NHS "
    "login service plus admin console now, and a gated real-provider credential-capture strategy later."
)

SOURCE_PRECEDENCE = [
    "prompt/025.md",
    "prompt/shared_operating_contract_021_to_025.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/platform-frontend-blueprint.md",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/accessibility-and-content-system-contract.md",
    "blueprint/ux-quiet-clarity-redesign.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_mock_first_vs_actual_later_strategy.md",
    "docs/external/23_secret_ownership_and_rotation_model.md",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "data/analysis/nhs_login_application_field_map.json",
    "data/analysis/nhs_login_live_gate_conditions.json",
    "https://nhsconnect.github.io/nhslogin/",
    "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works",
    "https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/",
    "https://nhsconnect.github.io/nhslogin/compare-environments/",
    "https://nhsconnect.github.io/nhslogin/test-data/",
    "https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/",
    "https://nhsconnect.github.io/nhslogin/technical-conformance/",
    "https://nhsconnect.github.io/nhslogin/gp-credentials/",
    "https://nhsconnect.github.io/nhslogin/scopes-and-claims/",
    "https://nhsconnect.github.io/nhslogin/vectors-of-trust/",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_what_is_nhs_login",
        "title": "What is NHS login?",
        "url": "https://nhsconnect.github.io/nhslogin/",
        "captured_on": "2026-04-09",
        "summary": "NHS login is an OpenID Connect-based identity rail for health and care services. It is not a one-off GP-credential retrieval tool.",
        "grounding": [
            "NHS login is how people prove who they are online for health and care websites or apps.",
            "Partners choose the required verification and authentication combination for access.",
            "The service must not be used as a one-off linkage-key retrieval path.",
        ],
    },
    {
        "source_id": "official_how_nhs_login_works",
        "title": "How NHS login works",
        "url": "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works",
        "captured_on": "2026-04-09",
        "summary": "NHS login authenticates and verifies the user, but partner services own session management, logout, age controls, and post-auth product authorization.",
        "grounding": [
            "Consent denial must return to the partner with an explicit code and bounded handling.",
            "Session management and logout remain partner responsibilities.",
            "PDS checks and GP credentials refresh happen over repeated use; NHS login does not replace PDS.",
        ],
    },
    {
        "source_id": "official_integrating_to_sandpit",
        "title": "How do I integrate to the sandpit?",
        "url": "https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/",
        "captured_on": "2026-04-09",
        "summary": "Sandpit registration requires a friendly name, redirect URI, public key, and scope list. Sandpit is for proof of concept and login-flow rehearsal.",
        "grounding": [
            "Partners submit a sandpit environment request form.",
            "Required setup data is the friendly name, redirect URI, public key, and scopes.",
            "Partners should complete login flow testing across token and userinfo before attempting registration journeys.",
        ],
    },
    {
        "source_id": "official_compare_environments",
        "title": "Compare NHS login environments",
        "url": "https://nhsconnect.github.io/nhslogin/compare-environments/",
        "captured_on": "2026-04-09",
        "summary": "Sandpit has no formal requirements, integration requires sandpit completion plus ODS and DSPT posture, and live needs readiness activity plus a signed agreement.",
        "grounding": [
            "Sandpit allows proof-of-concept login rehearsal but not real ID or load testing.",
            "Integration is where technical conformance and production-like testing occur.",
            "Live provides only bounded smoke-test coverage, not general experimentation.",
        ],
    },
    {
        "source_id": "official_test_data",
        "title": "Test data",
        "url": "https://nhsconnect.github.io/nhslogin/test-data/",
        "captured_on": "2026-04-09",
        "summary": "Sandpit provides dummy accounts and a static OTP; integration supports PDS-backed end-to-end test data and optional IM1 linkage details; live can provide a smoke-test user only.",
        "grounding": [
            "Sandpit accounts use dummy details and a static OTP for rehearsals.",
            "Integration provides test accounts for full end-to-end journeys and can support IM1 linkage details.",
            "Supplier test-data requests have required fields and explicit GP IM1 optional sections.",
        ],
    },
    {
        "source_id": "official_multiple_redirect_uris",
        "title": "Multiple redirect URIs",
        "url": "https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/",
        "captured_on": "2026-04-09",
        "summary": "NHS login supports up to 10 redirect URIs and recommends using opaque state-based fan-out when more destinations are needed.",
        "grounding": [
            "The state parameter should carry the partner-side routing identifier.",
            "The callback returns state as-is to the partner.",
            "Callback sprawl beyond 10 URIs must be handled by partner-side fan-out.",
        ],
    },
    {
        "source_id": "official_technical_conformance",
        "title": "Technical Conformance",
        "url": "https://nhsconnect.github.io/nhslogin/technical-conformance/",
        "captured_on": "2026-04-09",
        "summary": "Integration environment testing covers production-like setup and technical conformance; IM1 and non-IM1 suppliers have distinct test-data expectations.",
        "grounding": [
            "IM1 suppliers create local GP-system records and share linkage details with NHS login for integration testing.",
            "Non-IM1 suppliers can still test online identity verification and GP Online journeys in integration.",
            "Integration is the correct place for production-like conformance evidence, not sandpit.",
        ],
    },
    {
        "source_id": "official_gp_credentials",
        "title": "Using NHS login to create or retrieve GP credentials",
        "url": "https://nhsconnect.github.io/nhslogin/gp-credentials/",
        "captured_on": "2026-04-09",
        "summary": "The `gp_integration_credentials` scope returns linkage key, ODS code, and account ID for IM1-enabled relying parties only, and only as part of NHS login authentication.",
        "grounding": [
            "The feature must be used as part of NHS login authentication, not as a standalone retrieval flow.",
            "IM1-enabled production posture is required before the scope is allowed in live environments.",
            "Relying parties must avoid endless retry loops when GP credentials cannot be refreshed.",
        ],
    },
    {
        "source_id": "official_scopes_claims",
        "title": "Scopes and claims",
        "url": "https://nhsconnect.github.io/nhslogin/scopes-and-claims/",
        "captured_on": "2026-04-09",
        "summary": "Scopes are not automatically available: they must be requested and approved. `openid` is mandatory, `profile` and `basic_demographics` are mutually exclusive, and `gp_integration_credentials` is high-assurance and IM1-gated.",
        "grounding": [
            "Claims are retrieved through the userinfo endpoint after approval.",
            "The `openid` scope is mandatory for all partners.",
            "`gp_integration_credentials` is available only to IM1-enabled partners or approved third-party pairings.",
        ],
    },
    {
        "source_id": "official_vectors_of_trust",
        "title": "Introduction to Vectors of Trust",
        "url": "https://nhsconnect.github.io/nhslogin/vectors-of-trust/",
        "captured_on": "2026-04-09",
        "summary": "The `vtr` claim requests acceptable verification and authentication combinations. Returned `vot` and `vtm` claims bind the achieved trust level to the token.",
        "grounding": [
            "VoT selection must be included during OIDC initialisation.",
            "The default NHS login vector set assumes high verification unless a partner specifies otherwise.",
            "Services with mixed-sensitivity features should step up from medium to high only when needed.",
        ],
    },
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert_true(bool(rows), f"Cannot write empty CSV to {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def json_for_js(payload: Any) -> str:
    return json.dumps(payload, indent=2)


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    divider = ["---"] * len(headers)
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(divider) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_025 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
        "route_family_inventory": load_csv(REQUIRED_INPUTS["route_family_inventory"]),
        "gateway_surface_split_matrix": load_csv(REQUIRED_INPUTS["gateway_surface_split_matrix"]),
        "acting_scope_tuple_matrix": load_csv(REQUIRED_INPUTS["acting_scope_tuple_matrix"]),
        "secret_ownership_map": load_json(REQUIRED_INPUTS["secret_ownership_map"]),
        "nhs_login_application_field_map": load_json(REQUIRED_INPUTS["nhs_login_application_field_map"]),
        "nhs_login_live_gate_conditions": load_json(REQUIRED_INPUTS["nhs_login_live_gate_conditions"]),
    }


def build_pack(prereqs: dict[str, Any]) -> dict[str, Any]:
    phase0_verdict = prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"]
    assert_true(phase0_verdict == "withheld", "seq_025 expects Phase 0 entry to remain withheld")
    assert_true(
        prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened; seq_025 must not proceed with baseline gaps",
    )

    route_lookup = {
        row["route_family_id"]: row
        for row in prereqs["route_family_inventory"]
    }
    gateway_lookup = {
        row["route_family_id"]: row
        for row in prereqs["gateway_surface_split_matrix"]
    }
    acting_lookup = {
        row["acting_scope_profile_id"]: row
        for row in prereqs["acting_scope_tuple_matrix"]
    }
    role_catalog = prereqs["secret_ownership_map"]["role_catalog"]
    live_gate_catalog = prereqs["secret_ownership_map"]["live_gate_catalog"]
    live_gates_024 = {
        row["gate_id"]: row
        for row in prereqs["nhs_login_live_gate_conditions"]["live_gate_conditions"]
    }
    field_map = prereqs["nhs_login_application_field_map"]

    captured_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    environment_profiles = [
        {
            "environment_profile_id": "env_local_mock",
            "label": "Local mock",
            "lane": "Mock_now_execution",
            "kind": "simulator_local",
            "base_url": "http://127.0.0.1:4174",
            "issuer": "https://mock.vecells.local/nhs-login",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Synthetic aliases, static OTP, deterministic callback-race and stale-code fault injection.",
            "technical_conformance_posture": "Simulator only; validates contract seams, never claims NHS conformance.",
            "gp_integration_posture": "Disabled by default; can simulate `gp_integration_credentials` only when IM1 flag is enabled on the client.",
            "official_alignment": "Local-only rehearsal substrate that mirrors the control seams later exercised in sandpit and integration.",
            "source_refs": [
                "prompt/025.md",
                "official_compare_environments",
                "official_test_data",
            ],
        },
        {
            "environment_profile_id": "env_sandpit_like",
            "label": "Sandpit-like",
            "lane": "Mock_now_execution",
            "kind": "simulator_partner_rehearsal",
            "base_url": "https://sandpit-like.vecells.local",
            "issuer": "https://auth.sandpit.signin.nhs.uk/",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Prepared dummy accounts plus static OTP rehearsal; no real ID or full PDS-backed registration.",
            "technical_conformance_posture": "No technical conformance claims; mirrors sandpit restrictions and form requirements only.",
            "gp_integration_posture": "IM1 registration flow stays disabled, matching sandpit restrictions on GP Online testing.",
            "official_alignment": "Matches sandpit request fields and login-flow rehearsal posture from current guidance.",
            "source_refs": [
                "official_integrating_to_sandpit",
                "official_compare_environments",
                "official_test_data",
            ],
        },
        {
            "environment_profile_id": "env_integration_like",
            "label": "Integration-like",
            "lane": "Mock_now_execution",
            "kind": "simulator_conformance_rehearsal",
            "base_url": "https://integration-like.vecells.local",
            "issuer": "https://auth.integration.signin.nhs.uk/",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Synthetic PDS-matched and IM1-ready aliases mirror integration test-pack structure.",
            "technical_conformance_posture": "Exercises conformance-era callback, userinfo, and IM1 refresh rules without touching a real portal.",
            "gp_integration_posture": "Available only when client and test user both carry IM1 enablement.",
            "official_alignment": "Mirrors the integration environment’s conformance and test-data expectations.",
            "source_refs": [
                "official_compare_environments",
                "official_test_data",
                "official_technical_conformance",
            ],
        },
        {
            "environment_profile_id": "env_actual_sandpit",
            "label": "Actual sandpit later",
            "lane": "Actual_provider_strategy_later",
            "kind": "provider_target",
            "base_url": "https://sandpit.patient.vecells.example",
            "issuer": "https://auth.sandpit.signin.nhs.uk/",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Provider-issued sandpit client plus supplied test pack after request approval.",
            "technical_conformance_posture": "No conformance sign-off here; sandpit remains a proof-of-concept environment.",
            "gp_integration_posture": "Do not assume GP Online or IM1 testing is available; keep it disabled until integration.",
            "official_alignment": "Requires friendly name, redirect URI, public key, and scope list on the sandpit request form.",
            "source_refs": [
                "official_integrating_to_sandpit",
                "official_compare_environments",
            ],
        },
        {
            "environment_profile_id": "env_actual_integration",
            "label": "Actual integration later",
            "lane": "Actual_provider_strategy_later",
            "kind": "provider_target",
            "base_url": "https://integration.patient.vecells.example",
            "issuer": "https://auth.integration.signin.nhs.uk/",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Provider integration pack plus optional IM1 linkage details after approval.",
            "technical_conformance_posture": "Formal technical conformance, SCAL evidence, and environment review belong here.",
            "gp_integration_posture": "IM1 pathways are allowed only with approved pairings and explicit high-assurance scope approval.",
            "official_alignment": "Requires completed sandpit work, ODS code, DSPT posture, and conformance testing.",
            "source_refs": [
                "official_compare_environments",
                "official_test_data",
                "official_technical_conformance",
            ],
        },
        {
            "environment_profile_id": "env_actual_production",
            "label": "Actual production later",
            "lane": "Actual_provider_strategy_later",
            "kind": "provider_target",
            "base_url": "https://patient.vecells.example",
            "issuer": "https://auth.login.nhs.uk/",
            "jwks_path": "/.well-known/jwks.json",
            "test_data_posture": "Smoke-test user only, no exploratory testing, and no load testing.",
            "technical_conformance_posture": "Permitted only after readiness activity, agreement, and provider approval.",
            "gp_integration_posture": "Production `gp_integration_credentials` remains blocked until live IM1 enablement is approved.",
            "official_alignment": "Live environment requires completed readiness activity and signed agreement.",
            "source_refs": [
                "official_compare_environments",
                "official_test_data",
                "official_gp_credentials",
            ],
        },
    ]

    vot_profiles = [
        {
            "vot_profile_id": "vot_p0_basic",
            "label": "Low : Basic",
            "vtr": '["P0.Cp"]',
            "returned_vot_examples": ["P0.Cp"],
            "suitable_for": "Low-trust sign-in upgrades, public-to-authenticated transitions, and controlled claim-precheck flows.",
            "local_session_ceiling": "auth_read_only",
            "source_refs": ["official_vectors_of_trust", "blueprint/phase-2-the-identity-and-echoes.md"],
        },
        {
            "vot_profile_id": "vot_p5_strong",
            "label": "Medium : Strong",
            "vtr": '["P5.Cp.Cd","P5.Cp.Ck","P5.Cm"]',
            "returned_vot_examples": ["P5.Cp.Cd", "P5.Cm"],
            "suitable_for": "Messages, callback continuity, and basic self-service features that do not grant sensitive-record mutation.",
            "local_session_ceiling": "auth_read_only",
            "source_refs": ["official_vectors_of_trust", "official_how_nhs_login_works"],
        },
        {
            "vot_profile_id": "vot_p9_strong",
            "label": "High : Strong",
            "vtr": '["P9.Cp.Cd","P9.Cp.Ck","P9.Cm"]',
            "returned_vot_examples": ["P9.Cp.Cd", "P9.Cm"],
            "suitable_for": "Sensitive records, appointments management, and any path that needs high verification before local capability can widen.",
            "local_session_ceiling": "writable_if_local_capability_allows",
            "source_refs": ["official_vectors_of_trust", "blueprint/phase-0-the-foundation-protocol.md"],
        },
        {
            "vot_profile_id": "vot_step_up_mix",
            "label": "Medium plus step-up to high",
            "vtr": '["P5.Cp.Cd","P5.Cm","P9.Cp.Cd","P9.Cm"]',
            "returned_vot_examples": ["P5.Cp.Cd", "P9.Cp.Cd"],
            "suitable_for": "Mixed-sensitivity portals where health records or IM1 pairing need a later step-up journey instead of universal high friction.",
            "local_session_ceiling": "claim_pending_or_step_up",
            "source_refs": ["official_vectors_of_trust", "blueprint/phase-2-the-identity-and-echoes.md"],
        },
    ]

    scope_bundles = [
        {
            "bundle_id": "sb_auth_contact_minimum",
            "bundle_name": "Auth contact minimum",
            "scopes": ["openid", "email", "phone"],
            "claims": ["sub", "iss", "aud", "email", "email_verified", "phone_number", "phone_number_verified"],
            "mutual_exclusion_note": "Does not request `profile`; keeps the first sign-in uplift narrow.",
            "im1_enabled_required": False,
            "notes": "For sign-in uplift from intake or settings-link recovery where local capability still decides whether the shell becomes read-only or claim-pending.",
            "source_refs": ["official_scopes_claims", "official_how_nhs_login_works"],
        },
        {
            "bundle_id": "sb_patient_profile",
            "bundle_name": "Patient profile",
            "scopes": ["openid", "profile", "email", "phone"],
            "claims": [
                "sub",
                "nhs_number",
                "family_name",
                "birthdate",
                "identity_proofing_level",
                "email",
                "phone_number",
                "phone_number_verified",
            ],
            "mutual_exclusion_note": "`profile` is used instead of `basic_demographics`.",
            "im1_enabled_required": False,
            "notes": "Default bundle for signed-in home, requests, appointments, messages, and record access.",
            "source_refs": ["official_scopes_claims", "official_what_is_nhs_login"],
        },
        {
            "bundle_id": "sb_patient_profile_extended",
            "bundle_name": "Patient profile extended",
            "scopes": ["openid", "profile", "profile_extended", "email", "phone"],
            "claims": [
                "sub",
                "nhs_number",
                "family_name",
                "given_name",
                "birthdate",
                "identity_proofing_level",
                "email",
                "phone_number",
            ],
            "mutual_exclusion_note": "Use only where the later environment and business case permit `profile_extended`.",
            "im1_enabled_required": False,
            "notes": "Kept available for integration-like rehearsal but not widened by default in sandpit-like or public intake flows.",
            "source_refs": ["official_scopes_claims", "official_integrating_to_sandpit"],
        },
        {
            "bundle_id": "sb_gp_im1_pairing",
            "bundle_name": "IM1 GP pairing",
            "scopes": ["openid", "profile", "email", "phone", "gp_integration_credentials"],
            "claims": [
                "sub",
                "nhs_number",
                "family_name",
                "birthdate",
                "identity_proofing_level",
                "email",
                "phone_number",
                "gp_linkage_key",
                "gp_ods_code",
                "gp_user_id",
            ],
            "mutual_exclusion_note": "`gp_integration_credentials` is high-assurance and IM1-gated.",
            "im1_enabled_required": True,
            "notes": "Disabled unless the client is IM1-enabled and the route policy explicitly allows GP credential pairing as part of sign-in.",
            "source_refs": ["official_gp_credentials", "official_scopes_claims", "official_technical_conformance"],
        },
    ]

    route_bindings = [
        {
            "route_binding_id": "rb_patient_intake_upgrade",
            "route_family_id": "rf_intake_self_service",
            "display_name": "Public intake sign-in upgrade",
            "callback_slug": "intake",
            "return_intent_key": "patient.intake.upgrade",
            "gateway_surface_id": "gws_patient_intake_web",
            "acting_scope_profile_id": "ACT_PATIENT_PUBLIC_INTAKE",
            "scope_bundle_id": "sb_auth_contact_minimum",
            "vot_profile_id": "vot_p0_basic",
            "local_session_ceiling": "auth_read_only",
            "notes": "Auth success may only upgrade the public intake shell into an authenticated or claim-pending posture; it never grants clinical writability by itself.",
        },
        {
            "route_binding_id": "rb_secure_link_recovery",
            "route_family_id": "rf_patient_secure_link_recovery",
            "display_name": "Secure-link recovery and claim resume",
            "callback_slug": "recovery",
            "return_intent_key": "patient.recovery.resume",
            "gateway_surface_id": "gws_patient_secure_link_recovery",
            "acting_scope_profile_id": "ACT_PATIENT_GRANT_RECOVERY",
            "scope_bundle_id": "sb_patient_profile",
            "vot_profile_id": "vot_step_up_mix",
            "local_session_ceiling": "claim_pending_or_step_up",
            "notes": "Keeps grant-scoped recovery narrow and bound to the current route intent and subject lineage.",
        },
        {
            "route_binding_id": "rb_patient_home",
            "route_family_id": "rf_patient_home",
            "display_name": "Patient home and spotlight",
            "callback_slug": "home",
            "return_intent_key": "patient.home.entry",
            "gateway_surface_id": "gws_patient_home",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_patient_profile",
            "vot_profile_id": "vot_p5_strong",
            "local_session_ceiling": "auth_read_only",
            "notes": "Home remains projection-only after auth until local capability law admits wider actions.",
        },
        {
            "route_binding_id": "rb_patient_requests",
            "route_family_id": "rf_patient_requests",
            "display_name": "Requests and status detail",
            "callback_slug": "requests",
            "return_intent_key": "patient.requests.detail",
            "gateway_surface_id": "gws_patient_requests",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_patient_profile",
            "vot_profile_id": "vot_step_up_mix",
            "local_session_ceiling": "auth_read_only_or_writable_after_local_capability",
            "notes": "Reply, claim, and recovery actions remain route-bound after local session establishment.",
        },
        {
            "route_binding_id": "rb_patient_appointments",
            "route_family_id": "rf_patient_appointments",
            "display_name": "Appointments and manage",
            "callback_slug": "appointments",
            "return_intent_key": "patient.appointments.manage",
            "gateway_surface_id": "gws_patient_appointments",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_patient_profile_extended",
            "vot_profile_id": "vot_p9_strong",
            "local_session_ceiling": "writable_if_local_capability_allows",
            "notes": "Booking truth, waitlist, and manage posture require high verification before local capability can widen.",
        },
        {
            "route_binding_id": "rb_patient_health_record",
            "route_family_id": "rf_patient_health_record",
            "display_name": "Health record and documents",
            "callback_slug": "health-record",
            "return_intent_key": "patient.record.entry",
            "gateway_surface_id": "gws_patient_health_record",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_patient_profile_extended",
            "vot_profile_id": "vot_p9_strong",
            "local_session_ceiling": "auth_read_only_or_writable_after_local_capability",
            "notes": "Sensitive-record access needs high verification, but the local shell still controls artifact visibility and actionability.",
        },
        {
            "route_binding_id": "rb_patient_messages",
            "route_family_id": "rf_patient_messages",
            "display_name": "Messages and callback thread",
            "callback_slug": "messages",
            "return_intent_key": "patient.messages.thread",
            "gateway_surface_id": "gws_patient_messages",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_patient_profile",
            "vot_profile_id": "vot_p5_strong",
            "local_session_ceiling": "auth_read_only_or_writable_after_local_capability",
            "notes": "Messaging reply and callback repair stay bound to reachability and current thread tuples after auth.",
        },
        {
            "route_binding_id": "rb_patient_settings_link",
            "route_family_id": "rf_patient_home",
            "display_name": "Settings-link simulator",
            "callback_slug": "settings-link",
            "return_intent_key": "patient.settings.return",
            "gateway_surface_id": "gws_patient_home",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_auth_contact_minimum",
            "vot_profile_id": "vot_p0_basic",
            "local_session_ceiling": "auth_read_only",
            "notes": "Settings-link simulations never imply broader record access; they only prove safe return handling.",
        },
        {
            "route_binding_id": "rb_gp_im1_pairing",
            "route_family_id": "rf_patient_home",
            "display_name": "IM1 GP pairing",
            "callback_slug": "gp-pairing",
            "return_intent_key": "patient.gp.im1.pairing",
            "gateway_surface_id": "gws_patient_home",
            "acting_scope_profile_id": "ACT_PATIENT_AUTHENTICATED",
            "scope_bundle_id": "sb_gp_im1_pairing",
            "vot_profile_id": "vot_p9_strong",
            "local_session_ceiling": "claim_pending_or_step_up",
            "notes": "Explicitly gated behind IM1 enablement and never available as a one-off retrieval shortcut.",
        },
        {
            "route_binding_id": "rb_embedded_channel_future",
            "route_family_id": "rf_patient_embedded_channel",
            "display_name": "Embedded channel future parity",
            "callback_slug": "embedded",
            "return_intent_key": "patient.embedded.return",
            "gateway_surface_id": "gws_patient_embedded_shell",
            "acting_scope_profile_id": "ACT_PATIENT_EMBEDDED",
            "scope_bundle_id": "sb_patient_profile",
            "vot_profile_id": "vot_step_up_mix",
            "local_session_ceiling": "deferred_channel_only",
            "notes": "Future-only route binding kept in the pack so Phase 7 cannot silently widen current callback posture.",
        },
    ]

    redirect_base_by_env = {
        profile["environment_profile_id"]: profile["base_url"] for profile in environment_profiles
    }

    mock_clients = [
        {
            "client_id": "mc_patient_portal",
            "label": "Vecells patient portal",
            "friendly_name": "Vecells Patient Portal",
            "environment_profile_ids": [
                "env_local_mock",
                "env_sandpit_like",
                "env_integration_like",
                "env_actual_sandpit",
                "env_actual_integration",
                "env_actual_production",
            ],
            "route_binding_ids": [
                "rb_patient_home",
                "rb_patient_requests",
                "rb_patient_appointments",
                "rb_patient_health_record",
                "rb_patient_messages",
            ],
            "allowed_scope_bundle_ids": [
                "sb_patient_profile",
                "sb_patient_profile_extended",
            ],
            "jwks": {
                "kid": "kid_portal_2026_04",
                "alg": "RS256",
                "kty": "RSA",
                "n": "synthetic_portal_modulus_redacted",
                "e": "AQAB",
            },
            "im1_enabled": False,
            "redirect_limit_strategy": "route_family_split_under_10",
            "test_user_ids": ["usr_basic_p0", "usr_repeat_p5", "usr_verified_p9"],
            "notes": "Primary client for standard signed-in patient work.",
        },
        {
            "client_id": "mc_recovery_bridge",
            "label": "Vecells recovery bridge",
            "friendly_name": "Vecells Recovery Bridge",
            "environment_profile_ids": [
                "env_local_mock",
                "env_sandpit_like",
                "env_integration_like",
                "env_actual_sandpit",
                "env_actual_integration",
                "env_actual_production",
            ],
            "route_binding_ids": [
                "rb_patient_intake_upgrade",
                "rb_secure_link_recovery",
                "rb_patient_settings_link",
            ],
            "allowed_scope_bundle_ids": [
                "sb_auth_contact_minimum",
                "sb_patient_profile",
            ],
            "jwks": {
                "kid": "kid_recovery_2026_04",
                "alg": "RS256",
                "kty": "RSA",
                "n": "synthetic_recovery_modulus_redacted",
                "e": "AQAB",
            },
            "im1_enabled": False,
            "redirect_limit_strategy": "route_family_split_under_10",
            "test_user_ids": ["usr_basic_p0", "usr_repeat_p5", "usr_denied_consent"],
            "notes": "Narrow client for recovery, upgrade, and safe return handling.",
        },
        {
            "client_id": "mc_im1_pairing",
            "label": "Vecells IM1 pairing",
            "friendly_name": "Vecells IM1 Pairing",
            "environment_profile_ids": [
                "env_local_mock",
                "env_integration_like",
                "env_actual_integration",
                "env_actual_production",
            ],
            "route_binding_ids": ["rb_gp_im1_pairing"],
            "allowed_scope_bundle_ids": ["sb_gp_im1_pairing"],
            "jwks": {
                "kid": "kid_im1_2026_04",
                "alg": "RS256",
                "kty": "RSA",
                "n": "synthetic_im1_modulus_redacted",
                "e": "AQAB",
            },
            "im1_enabled": True,
            "redirect_limit_strategy": "single_route_under_limit",
            "test_user_ids": ["usr_im1_ready_p9"],
            "notes": "Explicit IM1-only client. Disabled in sandpit-like environments and blocked in live until IM1 approval exists.",
        },
        {
            "client_id": "mc_embedded_future",
            "label": "Vecells embedded future",
            "friendly_name": "Vecells Embedded Future",
            "environment_profile_ids": [
                "env_local_mock",
                "env_integration_like",
            ],
            "route_binding_ids": ["rb_embedded_channel_future"],
            "allowed_scope_bundle_ids": ["sb_patient_profile"],
            "jwks": {
                "kid": "kid_embedded_2026_04",
                "alg": "RS256",
                "kty": "RSA",
                "n": "synthetic_embedded_modulus_redacted",
                "e": "AQAB",
            },
            "im1_enabled": False,
            "redirect_limit_strategy": "deferred_channel_placeholder",
            "test_user_ids": ["usr_repeat_p5", "usr_verified_p9"],
            "notes": "Deferred channel placeholder only; not part of the current baseline.",
        },
    ]

    test_users = [
        {
            "user_id": "usr_basic_p0",
            "alias": "basic-p0",
            "email": "basic-p0@mock.vecells.local",
            "password": "Bluewoven-01",
            "otp": "190696",
            "verification_level": "P0",
            "vot": "P0.Cp",
            "im1_ready": False,
            "environments": ["env_local_mock", "env_sandpit_like"],
            "scenario_support": ["happy_path", "consent_denied", "wrong_redirect_uri"],
        },
        {
            "user_id": "usr_repeat_p5",
            "alias": "repeat-p5",
            "email": "repeat-p5@mock.vecells.local",
            "password": "Bluewoven-02",
            "otp": "190696",
            "verification_level": "P5",
            "vot": "P5.Cp.Cd",
            "im1_ready": False,
            "environments": ["env_local_mock", "env_sandpit_like", "env_integration_like"],
            "scenario_support": ["happy_path", "stale_code", "reused_code", "expired_session"],
        },
        {
            "user_id": "usr_verified_p9",
            "alias": "verified-p9",
            "email": "verified-p9@mock.vecells.local",
            "password": "Bluewoven-03",
            "otp": "190696",
            "verification_level": "P9",
            "vot": "P9.Cp.Cd",
            "im1_ready": False,
            "environments": ["env_local_mock", "env_integration_like"],
            "scenario_support": ["happy_path", "stale_code", "reused_code", "settings_return"],
        },
        {
            "user_id": "usr_im1_ready_p9",
            "alias": "im1-ready-p9",
            "email": "im1-ready-p9@mock.vecells.local",
            "password": "Bluewoven-04",
            "otp": "190696",
            "verification_level": "P9",
            "vot": "P9.Cp.Cd",
            "im1_ready": True,
            "environments": ["env_local_mock", "env_integration_like"],
            "scenario_support": ["happy_path", "im1_pairing", "stale_code"],
        },
        {
            "user_id": "usr_denied_consent",
            "alias": "deny-consent",
            "email": "deny-consent@mock.vecells.local",
            "password": "Bluewoven-05",
            "otp": "190696",
            "verification_level": "P5",
            "vot": "P5.Cp.Cd",
            "im1_ready": False,
            "environments": ["env_local_mock", "env_sandpit_like"],
            "scenario_support": ["consent_denied"],
        },
    ]

    auth_scenarios = [
        {
            "scenario_id": "happy_path",
            "label": "Authorize to token to userinfo happy path",
            "outcome": "success",
            "return_state": "callback_received",
            "reason_code": "AUTH_SUCCESS_LOCAL_SESSION_CHECK_REQUIRED",
        },
        {
            "scenario_id": "consent_denied",
            "label": "Consent denied",
            "outcome": "error",
            "return_state": "denied",
            "reason_code": "OIDC_ACCESS_DENIED",
        },
        {
            "scenario_id": "wrong_redirect_uri",
            "label": "Wrong redirect URI",
            "outcome": "error",
            "return_state": "invalid_callback",
            "reason_code": "REDIRECT_URI_NOT_REGISTERED",
        },
        {
            "scenario_id": "stale_code",
            "label": "Expired auth code",
            "outcome": "error",
            "return_state": "recovery_required",
            "reason_code": "AUTH_CODE_EXPIRED",
        },
        {
            "scenario_id": "reused_code",
            "label": "Reused auth code",
            "outcome": "error",
            "return_state": "recovery_required",
            "reason_code": "AUTH_CODE_ALREADY_REDEEMED",
        },
        {
            "scenario_id": "expired_session",
            "label": "Expired session and re-auth required",
            "outcome": "error",
            "return_state": "re_auth_required",
            "reason_code": "SESSION_EXPIRED",
        },
        {
            "scenario_id": "im1_pairing",
            "label": "IM1 pairing via gp_integration_credentials",
            "outcome": "conditional_success",
            "return_state": "callback_received",
            "reason_code": "IM1_SCOPE_ALLOWED_ONLY_WHEN_CLIENT_AND_USER_ARE_ENABLED",
        },
        {
            "scenario_id": "settings_return",
            "label": "Settings deep-link return",
            "outcome": "success",
            "return_state": "callback_received",
            "reason_code": "SETTINGS_RETURN_SAFE",
        },
    ]

    redirect_rows: list[dict[str, Any]] = []
    redirect_counter = 0
    binding_lookup = {row["route_binding_id"]: row for row in route_bindings}

    for client in mock_clients:
        for environment_profile_id in client["environment_profile_ids"]:
            for binding_id in client["route_binding_ids"]:
                binding = binding_lookup[binding_id]
                if (
                    binding_id == "rb_gp_im1_pairing"
                    and environment_profile_id in {"env_sandpit_like", "env_actual_sandpit"}
                ):
                    continue
                if (
                    binding_id == "rb_embedded_channel_future"
                    and environment_profile_id.startswith("env_actual_")
                ):
                    continue
                redirect_counter += 1
                callback_uri = (
                    f"{redirect_base_by_env[environment_profile_id]}/auth/callback/{binding['callback_slug']}"
                )
                redirect_rows.append(
                    {
                        "redirect_id": f"redir_{redirect_counter:03d}",
                        "environment_profile_id": environment_profile_id,
                        "client_id": client["client_id"],
                        "route_binding_id": binding_id,
                        "route_family_id": binding["route_family_id"],
                        "route_family": route_lookup[binding["route_family_id"]]["route_family"],
                        "callback_uri": callback_uri,
                        "route_intent_key": binding["return_intent_key"],
                        "session_ceiling": binding["local_session_ceiling"],
                        "overflow_strategy": "opaque_state_fanout_when_more_than_10",
                        "official_limit_state": "within_current_limit",
                        "notes": binding["notes"],
                        "source_refs": "; ".join(
                            [
                                "official_multiple_redirect_uris",
                                "blueprint/phase-0-the-foundation-protocol.md",
                                "blueprint/platform-runtime-and-release-blueprint.md",
                            ]
                        ),
                    }
                )

    scope_rows: list[dict[str, Any]] = []
    scope_counter = 0
    bundle_lookup = {row["bundle_id"]: row for row in scope_bundles}
    vot_lookup = {row["vot_profile_id"]: row for row in vot_profiles}

    for binding in route_bindings:
        bundle = bundle_lookup[binding["scope_bundle_id"]]
        vot = vot_lookup[binding["vot_profile_id"]]
        route = route_lookup[binding["route_family_id"]]
        scope_counter += 1
        scope_rows.append(
            {
                "scope_row_id": f"scope_{scope_counter:03d}",
                "bundle_id": bundle["bundle_id"],
                "bundle_name": bundle["bundle_name"],
                "route_binding_id": binding["route_binding_id"],
                "route_family_id": binding["route_family_id"],
                "route_family": route["route_family"],
                "vot_profile_id": vot["vot_profile_id"],
                "vtr": vot["vtr"],
                "scopes": " ".join(bundle["scopes"]),
                "claims": ", ".join(bundle["claims"]),
                "im1_enabled_required": str(bundle["im1_enabled_required"]).lower(),
                "local_session_ceiling": binding["local_session_ceiling"],
                "notes": bundle["notes"],
                "source_refs": "; ".join(bundle["source_refs"]),
            }
        )

    live_gates = [
        {
            "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "label": live_gates_024["LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD"]["label"],
            "status": "blocked",
            "summary": live_gates_024["LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD"]["summary"],
            "required_for_submission": True,
            "source_refs": live_gates_024["LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD"]["source_refs"],
        },
        {
            "gate_id": "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED",
            "label": live_gate_catalog["LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED"]["label"],
            "status": "blocked",
            "summary": "Real client IDs, redirect registration, and production credentials stay placeholder-only until the NHS login partner onboarding path and named approver identity are complete.",
            "required_for_submission": True,
            "source_refs": ["official_integrating_to_sandpit", "docs/external/24_nhs_login_actual_onboarding_strategy.md"],
        },
        {
            "gate_id": "LIVE_GATE_REDIRECT_URI_REVIEW",
            "label": live_gate_catalog["LIVE_GATE_REDIRECT_URI_REVIEW"]["label"],
            "status": "review_required",
            "summary": "The redirect matrix is generated and route-family bound, but a later human review must approve any real sandpit or live redirect registration.",
            "required_for_submission": True,
            "source_refs": ["official_multiple_redirect_uris", "docs/external/25_redirect_uri_and_scope_matrix.md"],
        },
        {
            "gate_id": "LIVE_GATE_IDENTITY_SESSION_PARITY",
            "label": live_gate_catalog["LIVE_GATE_IDENTITY_SESSION_PARITY"]["label"],
            "status": "pass",
            "summary": "This pack binds redirect URIs, VoT profiles, scopes, and callback outcomes to the blueprint’s route-intent and local-session law.",
            "required_for_submission": True,
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md", "blueprint/phase-2-the-identity-and-echoes.md"],
        },
        {
            "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_MISSING",
            "label": live_gates_024["LIVE_GATE_ENVIRONMENT_TARGET_MISSING"]["label"],
            "status": "blocked",
            "summary": live_gates_024["LIVE_GATE_ENVIRONMENT_TARGET_MISSING"]["summary"],
            "required_for_submission": True,
            "source_refs": live_gates_024["LIVE_GATE_ENVIRONMENT_TARGET_MISSING"]["source_refs"],
        },
        {
            "gate_id": "LIVE_GATE_MUTATION_FLAG_DISABLED",
            "label": live_gates_024["LIVE_GATE_MUTATION_FLAG_DISABLED"]["label"],
            "status": "blocked",
            "summary": live_gates_024["LIVE_GATE_MUTATION_FLAG_DISABLED"]["summary"],
            "required_for_submission": True,
            "source_refs": live_gates_024["LIVE_GATE_MUTATION_FLAG_DISABLED"]["source_refs"],
        },
        {
            "gate_id": "LIVE_GATE_IM1_SCAL_APPROVED",
            "label": live_gate_catalog["LIVE_GATE_IM1_SCAL_APPROVED"]["label"],
            "status": "blocked",
            "summary": "Any real `gp_integration_credentials` use remains blocked until IM1, SCAL, and approved third-party pairing evidence are current.",
            "required_for_submission": False,
            "source_refs": ["official_gp_credentials", "official_technical_conformance"],
        },
        {
            "gate_id": "LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING",
            "label": "Technical conformance and regression pack",
            "status": "review_required",
            "summary": "The simulator covers callback, userinfo, stale-code, and redirect rules now, but official technical conformance still belongs to the actual integration environment.",
            "required_for_submission": True,
            "source_refs": ["official_compare_environments", "official_technical_conformance"],
        },
    ]

    actual_placeholder_fields = [
        {
            "placeholder_id": "cred_named_approver",
            "label": "Named approver",
            "secret_class": "approval_identity",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "backup_owner_role": "ROLE_SECURITY_LEAD",
            "storage_backend": "partner_metadata_registry",
            "default_value": "",
            "required_for_live": True,
            "notes": "Must identify the operator who may later pause-and-confirm a real submission run.",
        },
        {
            "placeholder_id": "cred_environment_target",
            "label": "Environment target",
            "secret_class": "environment_metadata",
            "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "backup_owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "storage_backend": "partner_metadata_registry",
            "default_value": "",
            "required_for_live": True,
            "notes": "Must be one of sandpit, integration, or production.",
        },
        {
            "placeholder_id": "cred_sandpit_client_id",
            "label": "Sandpit client ID",
            "secret_class": "client_identifier",
            "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "backup_owner_role": "ROLE_SECURITY_LEAD",
            "storage_backend": "partner_capture_quarantine",
            "default_value": "PLACEHOLDER_SANDPIT_CLIENT_ID",
            "required_for_live": False,
            "notes": "Capture to quarantine first, then move to metadata registry after review.",
        },
        {
            "placeholder_id": "cred_integration_client_id",
            "label": "Integration client ID",
            "secret_class": "client_identifier",
            "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "backup_owner_role": "ROLE_SECURITY_LEAD",
            "storage_backend": "partner_capture_quarantine",
            "default_value": "PLACEHOLDER_INTEGRATION_CLIENT_ID",
            "required_for_live": False,
            "notes": "Becomes active only after product demo and environment approval.",
        },
        {
            "placeholder_id": "cred_production_client_id",
            "label": "Production client ID",
            "secret_class": "client_identifier",
            "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "backup_owner_role": "ROLE_SECURITY_LEAD",
            "storage_backend": "partner_capture_quarantine",
            "default_value": "PLACEHOLDER_PRODUCTION_CLIENT_ID",
            "required_for_live": False,
            "notes": "Must never be committed to the repository or screenshots.",
        },
        {
            "placeholder_id": "cred_public_key_ref",
            "label": "Public-key submission ref",
            "secret_class": "signing_key_reference",
            "owner_role": "ROLE_SECURITY_LEAD",
            "backup_owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "storage_backend": "nonprod_hsm_keyring",
            "default_value": "kid_portal_2026_04",
            "required_for_live": True,
            "notes": "The private key remains outside the repo; this field records the approved public-key reference only.",
        },
        {
            "placeholder_id": "cred_redirect_review_ref",
            "label": "Redirect review ref",
            "secret_class": "redirect_inventory_reference",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "backup_owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "storage_backend": "partner_metadata_registry",
            "default_value": "REDIRECT_REVIEW_PENDING",
            "required_for_live": True,
            "notes": "Must refer to the generated route-family redirect matrix rather than ad hoc form text.",
        },
        {
            "placeholder_id": "cred_scope_approval_ref",
            "label": "Scope approval ref",
            "secret_class": "scope_approval_reference",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "backup_owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "storage_backend": "partner_metadata_registry",
            "default_value": "SCOPE_APPROVAL_PENDING",
            "required_for_live": True,
            "notes": "Records the approved scope bundle and VTR for later real onboarding.",
        },
        {
            "placeholder_id": "cred_test_pack_ref",
            "label": "Provider test pack reference",
            "secret_class": "test_pack_reference",
            "owner_role": "ROLE_PARTNER_ONBOARDING_LEAD",
            "backup_owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
            "storage_backend": "partner_metadata_registry",
            "default_value": "TEST_PACK_PENDING",
            "required_for_live": False,
            "notes": "Captures the provider-issued test pack reference; not the raw spreadsheet itself.",
        },
        {
            "placeholder_id": "cred_gp_im1_pairing_ref",
            "label": "IM1 pairing reference",
            "secret_class": "im1_pairing_reference",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "backup_owner_role": "ROLE_SECURITY_LEAD",
            "storage_backend": "partner_metadata_registry",
            "default_value": "IM1_PAIRING_PENDING",
            "required_for_live": False,
            "notes": "Only complete when the IM1-enabled flag, SCAL, and approved third-party posture all exist.",
        },
        {
            "placeholder_id": "cred_live_mutation_flag",
            "label": "Allow real provider mutation",
            "secret_class": "execution_gate",
            "owner_role": "ROLE_SECURITY_LEAD",
            "backup_owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "storage_backend": "partner_metadata_registry",
            "default_value": "false",
            "required_for_live": True,
            "notes": "Must remain false by default and requires a pause-before-submit acknowledgement.",
        },
    ]

    placeholder_registry = {
        "task_id": "seq_025",
        "captured_at": captured_at,
        "phase0_verdict": phase0_verdict,
        "selector_map": {
            "base_profile": {
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "environment_switcher": "[data-testid='environment-switcher']",
                "client_registry": "[data-testid='client-registry-list']",
                "credential_intake_drawer": "[data-testid='credential-intake-drawer']",
                "placeholder_field_prefix": "placeholder-field-",
                "redaction_notice": "[data-testid='redaction-notice']",
                "final_submit": "[data-testid='final-submit-button']",
            }
        },
        "dry_run_defaults": {
            "allow_real_provider_mutation": False,
            "default_mode": "dry_run",
            "default_target_url": "http://127.0.0.1:4174/?mode=actual&view=admin",
            "pause_before_submit": True,
            "redaction_required": True,
            "trace_capture_disabled": True,
        },
        "live_gates": live_gates,
        "placeholder_fields": actual_placeholder_fields,
        "vault_ingest_flow": [
            {
                "step_id": "ingest_01",
                "action": "Capture provider-issued values into partner_capture_quarantine",
                "owner_role": "ROLE_PARTNER_ONBOARDING_LEAD",
                "storage_backend": "partner_capture_quarantine",
            },
            {
                "step_id": "ingest_02",
                "action": "Record non-secret metadata into partner_metadata_registry",
                "owner_role": "ROLE_IDENTITY_PARTNER_MANAGER",
                "storage_backend": "partner_metadata_registry",
            },
            {
                "step_id": "ingest_03",
                "action": "Promote live secret material into preprod_vault or production_vault only after dual review",
                "owner_role": "ROLE_SECURITY_LEAD",
                "storage_backend": "preprod_vault",
            },
            {
                "step_id": "ingest_04",
                "action": "Reference signing material by HSM key ID only; never expose private-key bytes to browser automation",
                "owner_role": "ROLE_SECURITY_LEAD",
                "storage_backend": "production_hsm_keyring",
            },
        ],
    }

    pack = {
        "task_id": "seq_025",
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "captured_at": captured_at,
        "phase0_verdict": phase0_verdict,
        "source_precedence": SOURCE_PRECEDENCE,
        "official_guidance": OFFICIAL_GUIDANCE,
        "environment_profiles": environment_profiles,
        "vot_profiles": vot_profiles,
        "scope_bundles": scope_bundles,
        "route_bindings": route_bindings,
        "redirect_uri_rows": redirect_rows,
        "mock_clients": mock_clients,
        "test_users": test_users,
        "auth_scenarios": auth_scenarios,
        "live_gates": live_gates,
        "summary": {
            "route_binding_count": len(route_bindings),
            "redirect_row_count": len(redirect_rows),
            "scope_bundle_count": len(scope_bundles),
            "scope_row_count": len(scope_rows),
            "environment_profile_count": len(environment_profiles),
            "mock_client_count": len(mock_clients),
            "test_user_count": len(test_users),
            "live_gate_count": len(live_gates),
            "phase0_verdict": phase0_verdict,
        },
        "placeholder_registry": placeholder_registry,
        "field_dependencies": {
            "field_map_task_id": field_map["task_id"],
            "named_approver_field_id": "fld_named_approver",
            "environment_target_field_id": "fld_environment_target",
            "live_mutation_flag_field_id": "fld_live_mutation_flag",
            "application_dossier_fields": [
                "fld_redirect_uri_primary",
                "fld_public_key_ref",
                "fld_scopes_claims_summary",
                "fld_vector_of_trust_profile",
                "fld_named_approver",
                "fld_environment_target",
                "fld_live_mutation_flag",
            ],
        },
    }

    return {
        "pack": pack,
        "redirect_rows": redirect_rows,
        "scope_rows": scope_rows,
        "placeholder_registry": placeholder_registry,
    }


def write_outputs(model: dict[str, Any]) -> None:
    pack = model["pack"]
    redirect_rows = model["redirect_rows"]
    scope_rows = model["scope_rows"]
    placeholder_registry = model["placeholder_registry"]

    write_json(PACK_JSON_PATH, pack)
    write_csv(REDIRECT_CSV_PATH, redirect_rows)
    write_csv(SCOPE_CSV_PATH, scope_rows)
    write_json(CLIENT_REGISTRY_PATH, {
        "task_id": pack["task_id"],
        "captured_at": pack["captured_at"],
        "mock_clients": pack["mock_clients"],
        "test_users": pack["test_users"],
        "auth_scenarios": pack["auth_scenarios"],
    })
    write_json(PLACEHOLDER_PATH, placeholder_registry)
    write_json(APP_PACK_JSON_PATH, pack)
    write_text(
        APP_PACK_TS_PATH,
        "export const nhsLoginCapturePack = "
        + json_for_js(pack)
        + " as const;\n",
    )

    environment_table = markdown_table(
        ["Environment", "Lane", "Base URL", "Test data", "IM1 posture"],
        [
            [
                row["label"],
                row["lane"],
                f"`{row['base_url']}`",
                row["test_data_posture"],
                row["gp_integration_posture"],
            ]
            for row in pack["environment_profiles"]
        ],
    )
    redirect_table = markdown_table(
        ["Client", "Environment", "Route binding", "Callback URI", "Return intent", "Ceiling"],
        [
            [
                row["client_id"],
                row["environment_profile_id"],
                row["route_binding_id"],
                f"`{row['callback_uri']}`",
                f"`{row['route_intent_key']}`",
                f"`{row['session_ceiling']}`",
            ]
            for row in redirect_rows
        ],
    )
    scope_table = markdown_table(
        ["Bundle", "Route binding", "VTR", "Scopes", "Claims", "IM1 gated"],
        [
            [
                row["bundle_name"],
                row["route_binding_id"],
                f"`{row['vtr']}`",
                f"`{row['scopes']}`",
                row["claims"],
                f"`{row['im1_enabled_required']}`",
            ]
            for row in scope_rows
        ],
    )
    live_gate_table = markdown_table(
        ["Gate", "Status", "Summary"],
        [
            [row["gate_id"], f"`{row['status']}`", row["summary"]]
            for row in pack["live_gates"]
        ],
    )
    client_table = markdown_table(
        ["Client", "Route bindings", "IM1 enabled", "Redirect strategy"],
        [
            [
                row["label"],
                ", ".join(row["route_binding_ids"]),
                f"`{str(row['im1_enabled']).lower()}`",
                row["redirect_limit_strategy"],
            ]
            for row in pack["mock_clients"]
        ],
    )
    user_table = markdown_table(
        ["Alias", "VoT", "IM1 ready", "Supported scenarios"],
        [
            [
                row["alias"],
                f"`{row['vot']}`",
                f"`{str(row['im1_ready']).lower()}`",
                ", ".join(row["scenario_support"]),
            ]
            for row in pack["test_users"]
        ],
    )
    placeholder_table = markdown_table(
        ["Field", "Owner", "Backend", "Live required", "Default"],
        [
            [
                row["label"],
                row["owner_role"],
                row["storage_backend"],
                f"`{str(row['required_for_live']).lower()}`",
                f"`{row['default_value']}`",
            ]
            for row in placeholder_registry["placeholder_fields"]
        ],
    )

    write_text(
        MOCK_SPEC_PATH,
        textwrap.dedent(
            f"""
            # 25 NHS Login Mock Service Spec

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` is the contract-first local mock NHS login service and admin console for seq_025. It does not impersonate the real NHS login brand and it does not claim real approval, real identity proof, or real provider enablement.

            ## Simulator mission

            - Preserve the blueprint rule that NHS login authenticates and verifies while Vecells still owns local session establishment, route intent, writable capability, logout, and same-shell recovery.
            - Exercise the exact seams Vecells later depends on: client registration, redirect governance, state and nonce and PKCE, scope bundles, vectors of trust, callback error handling, settings-link return, and route-bound local-session decisions.
            - Keep IM1 and GP credential pairing behind an explicit client flag and high-assurance route policy instead of allowing one-off linkage-key retrieval.

            ## Core surfaces

            - `Admin_Client_Registry`: client cards, redirect URI cards, scope chips, VoT presets, environment switcher, test-user registry, JWKS preview, and dry-run credential drawer.
            - `User_Sign_In`: two-step email/password then OTP or step-up posture with a visible journey indicator.
            - `Consent_and_Share`: precise requested claims, allow or deny handling, and a visible mock disclaimer.
            - `Return_or_Error`: separate calm states for success, consent denied, stale code, reused code, expired session, wrong redirect URI, and IM1-gated refusal.
            - `Settings_Link_Simulator`: mock NHS-login-settings handoff with safe return to the correct patient route family.

            ## Supported protocol seams

            - `authorize`
            - `token`
            - `userinfo`
            - `logout`
            - `client registration`
            - `public-key and JWKS preview`
            - `redirect URI validation`
            - `state and nonce round-tripping`
            - `PKCE verification posture`
            - `consent denied`
            - `stale or reused auth code`
            - `session expiry and re-auth`
            - `environment isolation`
            - `route-family callback fan-out`

            ## Clients

            {client_table}

            ## Test users

            {user_table}

            ## Route-family callback posture

            {redirect_table}

            ## Section B — `Actual_provider_strategy_later`

            The mock service stays useful even while real onboarding is blocked. The actual-provider path is generated from the same redirect, scope, VoT, and environment contract so later live registration cannot drift away from the simulator.

            ## Live gates

            {live_gate_table}

            ## Key consequences

            - Auth success never implies writable patient action by itself.
            - Redirect URIs remain route-family artifacts, not loose configuration strings.
            - Overflow beyond the provider’s ten-URI cap is handled through opaque state fan-out, not by uncontrolled callback growth.
            - IM1 pairing remains conditional and cannot be used as a one-off retrieval shortcut.
            """
        ),
    )

    write_text(
        REDIRECT_SCOPE_DOC_PATH,
        textwrap.dedent(
            f"""
            # 25 Redirect URI And Scope Matrix

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` derives the redirect and scope pack from Vecells route families, acting-scope posture, and local session law. It is not a page-list export.

            ## Redirect matrix

            {redirect_table}

            Redirect law:

            - The current matrix stays under the official `10` redirect URI cap per client.
            - Every row carries a route-intent key so callback completion can re-enter the correct shell and anchor.
            - If a later environment needs more than `10` destinations, the partner must use opaque state fan-out rather than widening registered URIs indefinitely.

            ## Scope and claim matrix

            {scope_table}

            Scope law:

            - `openid` is mandatory everywhere.
            - `profile` and `basic_demographics` are mutually exclusive, so this pack standardises on `profile` for patient-facing identity payloads.
            - `gp_integration_credentials` appears only on the IM1 pairing client and only under a high-assurance VoT plus explicit IM1 enablement.

            ## Section B — `Actual_provider_strategy_later`

            The same matrix becomes the submission pack for sandpit, integration, and later live review.

            ## Environment profile reference

            {environment_table}

            ## Official source alignment

            - [What is NHS login?](https://nhsconnect.github.io/nhslogin/)
            - [How NHS login works](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works)
            - [How do I integrate to the sandpit?](https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/)
            - [Compare NHS login environments](https://nhsconnect.github.io/nhslogin/compare-environments/)
            - [Test data](https://nhsconnect.github.io/nhslogin/test-data/)
            - [Multiple redirect URIs](https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/)
            - [Technical Conformance](https://nhsconnect.github.io/nhslogin/technical-conformance/)
            - [Using NHS login to create or retrieve GP credentials](https://nhsconnect.github.io/nhslogin/gp-credentials/)
            - [Scopes and claims](https://nhsconnect.github.io/nhslogin/scopes-and-claims/)
            - [Introduction to Vectors of Trust](https://nhsconnect.github.io/nhslogin/vectors-of-trust/)
            """
        ),
    )

    owner_rows = []
    for row in placeholder_registry["placeholder_fields"]:
        owner_rows.append(
            [
                row["label"],
                f"`{row['owner_role']}`",
                f"`{row['backup_owner_role']}`",
                f"`{row['storage_backend']}`",
                row["notes"],
            ]
        )

    write_text(
        RUNBOOK_PATH,
        textwrap.dedent(
            f"""
            # 25 Credential Capture And Vault Ingest Runbook

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` exposes the same credential and redirect fields that later real onboarding will need, but every live value remains placeholder-only and every browser flow remains dry-run by default.

            ## Placeholder registry

            {placeholder_table}

            ## Owner model

            {markdown_table(["Field", "Owner", "Backup owner", "Backend", "Notes"], owner_rows)}

            ## Vault ingest sequence

            {markdown_table(
                ["Step", "Action", "Owner", "Backend"],
                [
                    [row["step_id"], row["action"], row["owner_role"], row["storage_backend"]]
                    for row in placeholder_registry["vault_ingest_flow"]
                ],
            )}

            ## Dry-run automation law

            - `ALLOW_REAL_PROVIDER_MUTATION` defaults to `false`.
            - Browser automation may fill only placeholder or redacted values unless all live gates pass.
            - Traces, screenshots, and logs must remain redacted and secrets-safe.
            - Final submit must pause for an explicit operator confirmation even in a later live-enabled run.

            ## Section B — `Actual_provider_strategy_later`

            The real-provider path begins only after the external-readiness chain clears and the identity owner, security owner, approver, target environment, and current evidence bundle are all named.

            ## Current gate posture

            {live_gate_table}

            ## Dependencies from seq_024

            - Reuses the application-dossier fields `{", ".join(pack["field_dependencies"]["application_dossier_fields"])}`.
            - Keeps the phase verdict at `{pack["phase0_verdict"]}`.
            - Preserves the existing fail-closed dry-run default from the seq_024 live gate pack.
            """
        ),
    )

    guidance_rows = [
        [
            row["title"],
            row["captured_on"],
            row["summary"],
            ", ".join(row["grounding"][:2]),
        ]
        for row in pack["official_guidance"]
    ]

    write_text(
        ENVIRONMENT_PACK_PATH,
        textwrap.dedent(
            f"""
            # 25 NHS Login Environment Profile Pack

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` exposes three executable rehearsal profiles now: local mock, sandpit-like, and integration-like. They are deliberately distinct so environment drift is visible before real onboarding begins.

            ## Environment profiles

            {environment_table}

            ## Official guidance snapshots

            {markdown_table(["Source", "Captured on", "Why it matters", "Grounding"], guidance_rows)}

            ## Section B — `Actual_provider_strategy_later`

            The live-provider environment pack is already structured, but it remains blocked on approval, sponsor, target environment, and real mutation gates.

            ## Key derived rules

            - Sandpit later needs a friendly service name, redirect URI, public key, and scope list.
            - Integration later is the correct target for technical conformance and IM1 rehearsal, not sandpit.
            - Production later allows smoke-test posture only after readiness activity and agreement.
            - Test-data handling differs by environment, so the simulator keeps separate fixtures for local, sandpit-like, and integration-like execution.
            """
        ),
    )

    write_text(
        README_PATH,
        textwrap.dedent(
            """
            # Mock NHS Login

            `Bluewoven_Identity_Simulator` is the seq_025 local NHS login mock service and admin console.

            ## What it does

            - simulates client registration, redirect-URI governance, scope bundles, VoT selection, and JWKS posture
            - drives sign-in, consent, callback, settings-link return, and error handling flows
            - keeps actual-provider credential capture fail-closed with placeholder fields and live-gate checks

            ## Run

            ```bash
            pnpm install
            pnpm dev
            ```

            The default local URL is `http://127.0.0.1:4174`.

            ## Routes and views

            - `/?view=admin` for the client registry and credential drawer
            - `/?view=signin` for the user sign-in journey
            - `/?view=consent` for consent and claims review
            - `/?view=return` for callback and error states
            - `/?view=settings` for the settings-link simulator

            ## Non-negotiable rules

            - no real secrets or provider credentials belong in this app, its local storage, screenshots, or logs
            - IM1 pairing remains disabled unless both the client and test user carry the explicit IM1 flag
            - auth success never implies writable route access; the app shows the local session ceiling rather than faking final authority
            """
        ),
    )


def main() -> None:
    prereqs = ensure_inputs()
    model = build_pack(prereqs)
    write_outputs(model)
    print("seq_025 build complete")


if __name__ == "__main__":
    main()
