#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICE_DIR = ROOT / "services" / "mock-pds-fhir"
APP_DIR = ROOT / "apps" / "mock-pds-access-studio"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

PACK_JSON_PATH = DATA_DIR / "pds_access_pack.json"
ACCESS_MATRIX_PATH = DATA_DIR / "pds_access_mode_matrix.csv"
FEATURE_FLAG_PATH = DATA_DIR / "pds_feature_flag_registry.json"
FIELD_MAP_PATH = DATA_DIR / "pds_onboarding_field_map.json"
HAZARD_MATRIX_PATH = DATA_DIR / "pds_hazard_risk_artifact_matrix.csv"

FEATURE_FLAG_DOC_PATH = DOCS_DIR / "27_pds_feature_flag_strategy.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "27_pds_digital_onboarding_field_map.md"
ACCESS_MATRIX_DOC_PATH = DOCS_DIR / "27_pds_access_mode_and_route_family_matrix.md"
HAZARD_DOC_PATH = DOCS_DIR / "27_pds_hazard_and_risk_log_strategy.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "27_pds_live_gate_and_rollback_plan.md"

SERVICE_README_PATH = SERVICE_DIR / "README.md"
APP_README_PATH = APP_DIR / "README.md"
APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "pdsAccessPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "pds-access-pack.json"

TASK_ID = "seq_027"
VISUAL_MODE = "Identity_Trace_Studio"
MISSION = (
    "Create the PDS FHIR onboarding-and-feature-flag execution pack with two explicit parts: "
    "a rehearsal-grade local PDS sandbox plus access-control studio now, and a gated real "
    "digital-onboarding and optional-live-access strategy later."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "gateway_surface_split_matrix": DATA_DIR / "gateway_surface_split_matrix.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
}

SOURCE_PRECEDENCE = [
    "prompt/027.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_secret_ownership_and_rotation_model.md",
    "docs/risk/18_master_risk_register.md",
    "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir/onboarding-support-information",
    "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir",
    "https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service",
    "https://digital.nhs.uk/services/personal-demographics-service/integration-guidance",
    "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir/integrated-products",
    "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
    "https://digital.nhs.uk/services/partner-onboarding/operations",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_pds_onboarding_support_info",
        "title": "PDS FHIR API onboarding support information",
        "url": "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir/onboarding-support-information",
        "captured_on": "2026-04-09",
        "summary": (
            "The onboarding support page states that PDS FHIR uses digital onboarding, requires a "
            "hazard log upload, and requires one connecting-systems risk log per access mode used."
        ),
        "grounding": [
            "Digital onboarding is the stated onboarding route.",
            "A completed hazard log must be uploaded in the portal.",
            "Risk-based assurance requires evidence testing against the mitigations recorded in each chosen access-mode risk log.",
            "Published templates exist for application-restricted, healthcare worker, healthcare worker with update, and patient access modes.",
        ],
    },
    {
        "source_id": "official_pds_fhir_api_catalogue",
        "title": "Personal Demographics Service - FHIR API",
        "url": "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir",
        "captured_on": "2026-04-09",
        "summary": (
            "The API catalogue defines PDS FHIR as the FHIR route for accessing demographics such "
            "as name, address, date of birth, related people, registered GP, nominated pharmacy, "
            "and NHS number."
        ),
        "grounding": [
            "PDS FHIR is the modern API surface for search, retrieval, and some update flows.",
            "Registered GP and nominated pharmacy are in scope for the FHIR representation.",
        ],
    },
    {
        "source_id": "official_access_data_on_pds",
        "title": "Access data on the Personal Demographics Service",
        "url": "https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service",
        "captured_on": "2026-04-09",
        "summary": (
            "NHS England describes the PDS FHIR API as the newest and simplest integration route, "
            "states that requests are assessed case by case, and notes the secure-network "
            "expectation for smartcard-backed use."
        ),
        "grounding": [
            "PDS FHIR is described as the newest and simplest integration route.",
            "A secure network connection is required when using smartcards.",
            "Novel or analytics-like requests can be referred for legal or governance review.",
        ],
    },
    {
        "source_id": "official_pds_integration_guidance",
        "title": "Personal Demographics Service integration guidance",
        "url": "https://digital.nhs.uk/services/personal-demographics-service/integration-guidance",
        "captured_on": "2026-04-09",
        "summary": (
            "The integration guidance separates search, synchronisation, patient self-service, and "
            "patient updates. It explicitly says patient updates use NHS login and patient access mode."
        ),
        "grounding": [
            "User-facing apps access PDS indirectly through system-to-system interfaces such as PDS FHIR.",
            "Local systems that keep a local patient record must synchronise with PDS regularly.",
            "Patients updating their own information must be strongly authenticated with NHS login and the app must use patient access mode.",
        ],
    },
    {
        "source_id": "official_pds_integrated_products",
        "title": "PDS FHIR API - integrated products",
        "url": "https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir/integrated-products",
        "captured_on": "2026-04-09",
        "summary": (
            "The integrated-products page shows currently approved products and labels across "
            "application-restricted, healthcare worker, healthcare worker with update, patient "
            "access, and healthcare worker mode without update."
        ),
        "grounding": [
            "Application-restricted approval is common for patient-facing or system-mediated products.",
            "Healthcare worker and healthcare worker with update remain current approved labels.",
            "Patient access is present in the live approved-product roster.",
            "Healthcare worker mode without update appears in the roster and is normalised below to the read-only healthcare worker class.",
        ],
    },
    {
        "source_id": "official_scal_process",
        "title": "Supplier Conformance Assessment List (SCAL)",
        "url": "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
        "captured_on": "2026-04-09",
        "summary": (
            "SCAL is the document-based assurance route and the page states DOS is the primary "
            "online route. It captures technical, clinical safety, information-governance, "
            "security, and organisational risk evidence."
        ),
        "grounding": [
            "Digital Onboarding Service is the primary online assurance route.",
            "Assurance evidence spans technical conformance, clinical safety, IG and security, and organisational risk.",
        ],
    },
    {
        "source_id": "official_partner_onboarding_operations",
        "title": "Partner onboarding operations",
        "url": "https://digital.nhs.uk/services/partner-onboarding/operations",
        "captured_on": "2026-04-09",
        "summary": (
            "The operations page lists PDS FHIR as a digital-onboarding service and names the four "
            "published access-mode families for that service."
        ),
        "grounding": [
            "Digital onboarding is a standardised NHS England onboarding path.",
            "PDS FHIR is listed with application-restricted, health worker, health worker with update, and patient access modes.",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_PDS_ONBOARDING_FIELD_MAP_IS_STRUCTURED_NOT_VERBATIM",
        "summary": (
            "The public PDS pages disclose the onboarding mechanics and required evidence but not "
            "a full public form schema for every DOS field. The field map below therefore turns the "
            "public mechanics into a deterministic Vecells dossier structure instead of claiming it "
            "is a verbatim portal export."
        ),
        "consequence": "The dossier can be rehearsed locally now while still mapping cleanly to later portal work.",
    },
    {
        "assumption_id": "ASSUMPTION_PDS_MODE_LABEL_NORMALISATION",
        "summary": (
            "Current official pages use both 'healthcare worker' and 'healthcare worker mode without update'. "
            "This pack normalises those labels to read-only `healthcare_worker` while preserving the source-dated alias."
        ),
        "consequence": "Vecells avoids inventing a fifth baseline mode while still recording the official wording drift.",
    },
    {
        "assumption_id": "ASSUMPTION_PDS_UPDATE_FLOWS_STAY_FUTURE_AND_FAIL_CLOSED",
        "summary": (
            "The blueprint makes PDS optional and subordinate to local matching plus governed binding. "
            "Any update-capable PDS posture therefore stays future-only, default-off, and blocked by stronger gates."
        ),
        "consequence": "The mock service can simulate update-capable access modes without implying that Vecells will use them in the current baseline.",
    },
]

ACCESS_MODE_ALIAS_MAP = {
    "application_restricted": ["Application Restricted", "Application-restricted"],
    "healthcare_worker": ["Healthcare worker", "Healthcare Worker", "Healthcare worker mode without update"],
    "healthcare_worker_with_update": ["Healthcare worker with update", "Health Worker Access with Update"],
    "patient_access": ["Patient access", "Patient Access Mode"],
    "other_if_officially_supported": [],
}

MOCK_PATIENTS = [
    {
        "patient_id": "pds_pt_meridian_001",
        "match_key": "meridian-alex-1985",
        "scenario_tags": ["matched", "partial_field_policy"],
        "display_name": "Alex Meridian",
        "birth_date": "1985-03-14",
        "gender": "other",
        "identifier_value": "VX-MOCK-001",
        "address_line": "17 Atlas Quay",
        "city": "Leeds",
        "postcode": "VX1 4AA",
        "telecom": "+44 7000 100001",
        "registered_gp": "Riverside Practice",
        "registered_gp_ods": "A12345",
        "nominated_pharmacy": "Harbour Chemist",
        "nominated_pharmacy_ods": "F12345",
        "staleness_state": "current",
        "contradiction_note": "",
    },
    {
        "patient_id": "pds_pt_meridian_002",
        "match_key": "meridian-alex-1985",
        "scenario_tags": ["ambiguous"],
        "display_name": "Alex Meridian",
        "birth_date": "1985-03-14",
        "gender": "other",
        "identifier_value": "VX-MOCK-002",
        "address_line": "4 Beacon Street",
        "city": "Leeds",
        "postcode": "VX1 9ZZ",
        "telecom": "+44 7000 100002",
        "registered_gp": "North Signal Medical Centre",
        "registered_gp_ods": "B54321",
        "nominated_pharmacy": "North Signal Pharmacy",
        "nominated_pharmacy_ods": "F54321",
        "staleness_state": "current",
        "contradiction_note": "",
    },
    {
        "patient_id": "pds_pt_sable_003",
        "match_key": "sable-jordan-1992",
        "scenario_tags": ["low_confidence"],
        "display_name": "Jordan Sable",
        "birth_date": "1992-11-08",
        "gender": "female",
        "identifier_value": "VX-MOCK-003",
        "address_line": "91 Lattice Grove",
        "city": "Hull",
        "postcode": "VX2 3BC",
        "telecom": "+44 7000 100003",
        "registered_gp": "Harbour Lane Surgery",
        "registered_gp_ods": "C13579",
        "nominated_pharmacy": "Lattice Pharmacy",
        "nominated_pharmacy_ods": "F24680",
        "staleness_state": "current",
        "contradiction_note": "",
    },
    {
        "patient_id": "pds_pt_quarry_004",
        "match_key": "quarry-casey-1978",
        "scenario_tags": ["stale_demographics"],
        "display_name": "Casey Quarry",
        "birth_date": "1978-06-29",
        "gender": "male",
        "identifier_value": "VX-MOCK-004",
        "address_line": "2 Old Ferry Row",
        "city": "York",
        "postcode": "VX4 7PQ",
        "telecom": "+44 7000 100004",
        "registered_gp": "Stonebridge Practice",
        "registered_gp_ods": "D97531",
        "nominated_pharmacy": "Bridge Pharmacy",
        "nominated_pharmacy_ods": "F86420",
        "staleness_state": "expired_business_effective_date",
        "contradiction_note": "",
    },
    {
        "patient_id": "pds_pt_ember_005",
        "match_key": "ember-riley-2001",
        "scenario_tags": ["contradictory_detail"],
        "display_name": "Riley Ember",
        "birth_date": "2001-01-17",
        "gender": "female",
        "identifier_value": "VX-MOCK-005",
        "address_line": "48 Lantern Close",
        "city": "Sheffield",
        "postcode": "VX5 6LM",
        "telecom": "+44 7000 100005",
        "registered_gp": "Lantern Family Practice",
        "registered_gp_ods": "E11223",
        "nominated_pharmacy": "Lantern Pharmacy",
        "nominated_pharmacy_ods": "F22110",
        "staleness_state": "current",
        "contradiction_note": "Local preference file says no nominated pharmacy, but PDS still carries one.",
    },
    {
        "patient_id": "pds_pt_harbour_006",
        "match_key": "harbour-taylor-1989",
        "scenario_tags": ["matched", "nominated_pharmacy_focus"],
        "display_name": "Taylor Harbour",
        "birth_date": "1989-04-03",
        "gender": "male",
        "identifier_value": "VX-MOCK-006",
        "address_line": "8 Tidal Court",
        "city": "Liverpool",
        "postcode": "VX8 2PL",
        "telecom": "+44 7000 100006",
        "registered_gp": "Mersey Walk Practice",
        "registered_gp_ods": "G10101",
        "nominated_pharmacy": "Tidal Pharmacy",
        "nominated_pharmacy_ods": "F99887",
        "staleness_state": "current",
        "contradiction_note": "",
    },
]

SCENARIOS = [
    {
        "scenario_id": "matched",
        "label": "Matched",
        "search_status": "200",
        "read_status": "200",
        "result_class": "matched",
        "description": "Single high-confidence supporting demographic match.",
    },
    {
        "scenario_id": "ambiguous",
        "label": "Ambiguous",
        "search_status": "200",
        "read_status": "409",
        "result_class": "ambiguous",
        "description": "Two plausible candidates; no durable binding change is allowed.",
    },
    {
        "scenario_id": "low_confidence",
        "label": "Low confidence",
        "search_status": "200",
        "read_status": "200",
        "result_class": "low_confidence",
        "description": "One candidate is present but the corroboration margin stays below bind-safe thresholds.",
    },
    {
        "scenario_id": "no_match",
        "label": "No match",
        "search_status": "200",
        "read_status": "404",
        "result_class": "no_match",
        "description": "No patient candidate satisfies the requested trace.",
    },
    {
        "scenario_id": "stale_demographics",
        "label": "Stale demographics",
        "search_status": "200",
        "read_status": "200",
        "result_class": "stale_demographics",
        "description": "Returned record carries expired business-effective contact details.",
    },
    {
        "scenario_id": "contradictory_detail",
        "label": "Contradictory detail",
        "search_status": "200",
        "read_status": "200",
        "result_class": "contradictory_detail",
        "description": "PDS data contradicts a local or route-specific fact and must be reviewed, not silently trusted.",
    },
    {
        "scenario_id": "partial_field_policy",
        "label": "Partial field policy",
        "search_status": "200",
        "read_status": "200",
        "result_class": "partial_field_policy",
        "description": "The response deliberately omits some fields to simulate minimum-necessary or partial-data posture.",
    },
    {
        "scenario_id": "throttled",
        "label": "Throttled",
        "search_status": "429",
        "read_status": "429",
        "result_class": "throttled",
        "description": "The adapter has crossed its safe retry budget and must fall back locally.",
    },
    {
        "scenario_id": "degraded",
        "label": "Degraded",
        "search_status": "503",
        "read_status": "503",
        "result_class": "degraded",
        "description": "Upstream PDS is unavailable or degraded; Vecells must continue safely without enrichment.",
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
    return json.dumps(payload, indent=2, ensure_ascii=True)


def load_required_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_027 prerequisites: " + ", ".join(sorted(missing)))
    payloads: dict[str, Any] = {}
    for name, path in REQUIRED_INPUTS.items():
        payloads[name] = load_csv(path) if path.suffix == ".csv" else load_json(path)
    assert_true(
        payloads["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream.",
    )
    assert_true(
        payloads["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_027 expects Phase 0 entry to remain withheld.",
    )
    return payloads


def route_index(route_rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {row["route_family_id"]: row for row in route_rows}


def find_pds_integration(payload: dict[str, Any]) -> dict[str, Any]:
    for row in payload["integration_priority_matrix"]["integration_families"]:
        if row["integration_id"] == "int_identity_pds_optional_enrichment":
            return row
    raise SystemExit("Missing PDS integration family in integration_priority_matrix.json")


def find_pds_dependency(payload: dict[str, Any]) -> dict[str, Any]:
    for row in payload["external_dependencies"]["dependencies"]:
        if row["dependency_id"] == "dep_pds_fhir_enrichment":
            return row
    raise SystemExit("Missing dep_pds_fhir_enrichment in external_dependencies.json")


def find_pds_secret_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = [
        row
        for row in payload["secret_ownership_map"]["account_inventory"]
        if row["dependency_title"] == "Optional PDS enrichment seam"
    ]
    assert_true(bool(rows), "Missing PDS secret posture rows in secret_ownership_map.json")
    return rows


def find_risk(payload: dict[str, Any], risk_id: str) -> dict[str, Any]:
    for row in payload["master_risk_register"]["risks"]:
        if row["risk_id"] == risk_id:
            return row
    raise SystemExit(f"Missing risk row {risk_id}")


def build_access_rows(routes: dict[str, dict[str, str]]) -> list[dict[str, Any]]:
    rows = [
        {
            "pds_use_case_id": "PDS_UC_SECURE_LINK_TRACE",
            "route_family_ref": "rf_patient_secure_link_recovery",
            "action_scope": "read_only_trace_after_local_match_ambiguity",
            "access_mode": "application_restricted",
            "why_pds_is_needed": "Secure-link recovery can encounter multiple plausible local candidates and needs optional supporting demographics to narrow the review set.",
            "why_local_matching_alone_is_not_sufficient": "A single local ambiguous cluster can still require a national corroboration source before support or patient recovery copy becomes specific.",
            "legal_basis_summary": "Direct-care recovery support for an already active patient journey; no analytics or cohort lookup.",
            "feature_flag_name": "pds.enrichment.route.secure_link_recovery",
            "default_state": "internal_only",
            "identity_binding_impact": "Supporting evidence only; IdentityBindingAuthority remains the only writer of durable binding and derived patientRef.",
            "wrong_patient_risk_controls": [
                "require_local_candidate_set_first",
                "never_bind_from_pds_success_alone",
                "freeze_to_identity_repair_on_conflict",
                "mask_identifier_in_logs",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_APPLICATION_RESTRICTED"],
            "mock_now_support_level": "full_search_and_read",
            "actual_later_gate_refs": [
                "GATE_EXTERNAL_TO_FOUNDATION",
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_HAZARD_LOG_CURRENT",
                "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            ],
            "fallback_if_unavailable": "Retain local partial_match or review posture and continue with governed support recovery.",
            "notes": "This is the highest-value current rehearsal route because it proves PDS can help without becoming baseline truth.",
        },
        {
            "pds_use_case_id": "PDS_UC_PATIENT_HOME_CONTACT_REFRESH",
            "route_family_ref": "rf_patient_home",
            "action_scope": "patient_initiated_contact_refresh_preview",
            "access_mode": "patient_access",
            "why_pds_is_needed": "Patient home may later show a controlled refresh or correction path for contact details already held in PDS.",
            "why_local_matching_alone_is_not_sufficient": "The local profile and patient preferences are intentionally separate from PDS-held contact data, so a later compare view needs the upstream source.",
            "legal_basis_summary": "Patient self-service update or review after strong NHS login authentication; future-only and default-off.",
            "feature_flag_name": "pds.patient_access.route.patient_home_contact_refresh",
            "default_state": "off",
            "identity_binding_impact": "None; this route may update demographic detail but must not mutate Request.patientRef or claim durable ownership.",
            "wrong_patient_risk_controls": [
                "require_high_assurance_nhs_login",
                "show_before_after_compare",
                "separate_contact_preferences_from_pds_data",
                "rollback_on_conflict_or_stale_record",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_PATIENT_ACCESS"],
            "mock_now_support_level": "read_only_preview",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF",
                "PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT",
            ],
            "fallback_if_unavailable": "Keep patient preferences local and route any update desire to a non-PDS placeholder or manual support advice.",
            "notes": "The blueprint does not require PDS for authenticated home; this row is future-only by design.",
        },
        {
            "pds_use_case_id": "PDS_UC_PATIENT_HOME_NOMINATED_PHARMACY",
            "route_family_ref": "rf_patient_home",
            "action_scope": "patient_initiated_nominated_pharmacy_preview",
            "access_mode": "patient_access",
            "why_pds_is_needed": "Patient home may later preview or update nominated pharmacy facts that live in PDS.",
            "why_local_matching_alone_is_not_sufficient": "A local route-specific pharmacy choice record is not the same thing as the nominated-pharmacy fact held in PDS.",
            "legal_basis_summary": "Patient self-service with strong authentication in patient access mode; future-only.",
            "feature_flag_name": "pds.patient_access.route.patient_home_nominated_pharmacy",
            "default_state": "off",
            "identity_binding_impact": "None; pharmacy preference evidence stays separate from durable patient binding.",
            "wrong_patient_risk_controls": [
                "require_high_assurance_nhs_login",
                "show_route_vs_pds_difference_explicitly",
                "no_automatic_request_mutation",
                "rollback_on_mismatch_or_pds_outage",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_PATIENT_ACCESS"],
            "mock_now_support_level": "read_only_preview",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF",
                "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            ],
            "fallback_if_unavailable": "Continue using local route choice only and clearly label PDS-backed nominated-pharmacy data as unavailable.",
            "notes": "Included because the public PDS guidance explicitly references nominated pharmacy in patient-facing national apps.",
        },
        {
            "pds_use_case_id": "PDS_UC_STAFF_DIRECT_CARE_TRACE",
            "route_family_ref": "rf_staff_workspace",
            "action_scope": "care_setting_trace_and_read",
            "access_mode": "healthcare_worker",
            "why_pds_is_needed": "Operations or clinical staff can need a bounded direct-care trace when local evidence is insufficient to identify the correct patient safely.",
            "why_local_matching_alone_is_not_sufficient": "Direct-care staff may need a nationally current demographic source when local data is stale or conflicting.",
            "legal_basis_summary": "Direct care by a healthcare worker with strong user authentication and role-appropriate access.",
            "feature_flag_name": "pds.healthcare_worker.route.staff_workspace_trace",
            "default_state": "internal_only",
            "identity_binding_impact": "Supporting evidence only; any resulting binding decision still routes through IdentityBindingAuthority.",
            "wrong_patient_risk_controls": [
                "strong_worker_authentication",
                "role_and_legitimate_relationship_check",
                "read_only_evidence_path",
                "mandatory_identity_repair_on_conflict",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_HEALTHCARE_WORKER"],
            "mock_now_support_level": "full_search_and_read",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_ACCESS_MODE_SELECTED",
                "PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED",
                "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            ],
            "fallback_if_unavailable": "Use local trace plus manual confirmation workflow and keep the request on hold or review where needed.",
            "notes": "This row is bounded to direct-care-style identity review, not generic staff browsing.",
        },
        {
            "pds_use_case_id": "PDS_UC_SUPPORT_IDENTITY_REVIEW",
            "route_family_ref": "rf_support_ticket_workspace",
            "action_scope": "support_mediated_identity_review",
            "access_mode": "healthcare_worker",
            "why_pds_is_needed": "Support and safety reviewers can need national demographic corroboration while triaging identity disputes or misbinding signals.",
            "why_local_matching_alone_is_not_sufficient": "Some support cases involve stale or contradictory local evidence and require a separate corroboration source before recovery guidance is given.",
            "legal_basis_summary": "Direct-care-adjacent operational review with named worker, bounded route scope, and full audit.",
            "feature_flag_name": "pds.healthcare_worker.route.support_identity_review",
            "default_state": "internal_only",
            "identity_binding_impact": "Support can gather evidence only; support cannot settle durable binding locally.",
            "wrong_patient_risk_controls": [
                "named_worker_and_case_reason_required",
                "read_only_review_surface",
                "support_cannot_override_identity_authority",
                "freeze_case_on_conflict",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_HEALTHCARE_WORKER"],
            "mock_now_support_level": "full_search_and_read",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT",
                "PDS_LIVE_GATE_NAMED_APPROVER_PRESENT",
            ],
            "fallback_if_unavailable": "Continue support recovery using local evidence bundles and explicit 'PDS unavailable' operator copy.",
            "notes": "This use case exists to prove safe support behavior, not to widen routine support visibility.",
        },
        {
            "pds_use_case_id": "PDS_UC_SUPPORT_CONTACT_CORRECTION",
            "route_family_ref": "rf_support_ticket_workspace",
            "action_scope": "staff_mediated_contact_update",
            "access_mode": "healthcare_worker_with_update",
            "why_pds_is_needed": "Later support workflows may need a tightly controlled path for correcting or forwarding an upstream contact update where policy permits.",
            "why_local_matching_alone_is_not_sufficient": "A local preference update does not alter the national demographic record and can leave future patient-facing services inconsistent.",
            "legal_basis_summary": "Future-only worker-mediated update path with stricter approval, evidence, and network posture than read-only review.",
            "feature_flag_name": "pds.healthcare_worker_update.route.support_contact_correction",
            "default_state": "off",
            "identity_binding_impact": "No direct binding change; update-capable access cannot be used as a backdoor to claim or repair patient ownership.",
            "wrong_patient_risk_controls": [
                "dual_review_before_update",
                "show_pre_and_post_values",
                "rollback_if_wrong_subject_suspected",
                "no_request_or_episode_patient_ref_write",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_HEALTHCARE_WORKER_UPDATE"],
            "mock_now_support_level": "mode_simulated_read_only",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_ACCESS_MODE_SELECTED",
                "PDS_LIVE_GATE_HAZARD_LOG_CURRENT",
                "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            ],
            "fallback_if_unavailable": "Keep the correction local, capture a support note, and hand off to the external correction process instead of mutating upstream data.",
            "notes": "This row stays future-only and is simulated without real write capability in the mock service.",
        },
        {
            "pds_use_case_id": "PDS_UC_GOVERNANCE_TRACE",
            "route_family_ref": "rf_governance_shell",
            "action_scope": "audit_and_wrong_patient_investigation",
            "access_mode": "healthcare_worker",
            "why_pds_is_needed": "Governance investigations may need a read-only trace to compare what the external demographic source held at review time.",
            "why_local_matching_alone_is_not_sufficient": "An investigation can require external corroboration of the demographic facts that informed a support or identity decision.",
            "legal_basis_summary": "Governed investigation and safety review; no broad browsing or analytics.",
            "feature_flag_name": "pds.healthcare_worker.route.governance_trace",
            "default_state": "internal_only",
            "identity_binding_impact": "None directly; any corrective bind still requires the same repair and authority chain.",
            "wrong_patient_risk_controls": [
                "investigation_case_reference_required",
                "read_only_audit_view",
                "minimise_field_exposure",
                "full_audit_log_and_masking",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_HEALTHCARE_WORKER"],
            "mock_now_support_level": "full_search_and_read",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
                "PDS_LIVE_GATE_NAMED_APPROVER_PRESENT",
            ],
            "fallback_if_unavailable": "Continue with local audit evidence and record the external corroboration gap explicitly.",
            "notes": "This route is investigation-specific and does not authorise routine operational use.",
        },
        {
            "pds_use_case_id": "PDS_UC_GOVERNANCE_UPDATE",
            "route_family_ref": "rf_governance_shell",
            "action_scope": "approved_demographic_correction_rehearsal",
            "access_mode": "healthcare_worker_with_update",
            "why_pds_is_needed": "A later governance-approved correction workflow may need update-capable access for upstream remediation evidence.",
            "why_local_matching_alone_is_not_sufficient": "Governance cannot assume a local correction resolves an upstream demographic defect or stale PDS fact.",
            "legal_basis_summary": "Exceptional, named-approver correction path only; never baseline and never self-service.",
            "feature_flag_name": "pds.healthcare_worker_update.route.governance_correction",
            "default_state": "off",
            "identity_binding_impact": "Upstream demographic correction does not itself repair durable binding; the repair chain remains separate and explicit.",
            "wrong_patient_risk_controls": [
                "exception_case_reference_required",
                "dual_approval_and_change_record",
                "explicit_rollback_rehearsal",
                "repair_chain_kept_separate_from_update",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_HEALTHCARE_WORKER_UPDATE"],
            "mock_now_support_level": "mode_simulated_read_only",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_HAZARD_LOG_CURRENT",
                "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
                "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            ],
            "fallback_if_unavailable": "Record the correction need locally and route it through the partner correction backlog rather than mutating live data.",
            "notes": "Explicitly future-only and gated by manual approval plus rollback rehearsal.",
        },
        {
            "pds_use_case_id": "PDS_UC_REQUESTS_PHARMACY_COMPARE",
            "route_family_ref": "rf_patient_requests",
            "action_scope": "read_only_nominated_pharmacy_compare",
            "access_mode": "application_restricted",
            "why_pds_is_needed": "The request route may later compare a local pharmacy selection with the PDS nominated-pharmacy fact to explain divergence safely.",
            "why_local_matching_alone_is_not_sufficient": "A local request-time pharmacy choice is route-specific and may diverge from the enduring nominated-pharmacy record held in PDS.",
            "legal_basis_summary": "Direct-care request support and explanation only; no automated pharmacy mutation.",
            "feature_flag_name": "pds.application_restricted.route.requests_pharmacy_compare",
            "default_state": "off",
            "identity_binding_impact": "None; pharmacy comparison is not an identity-authority action.",
            "wrong_patient_risk_controls": [
                "require_existing_local_binding_or_review_case",
                "show_difference_as_compare_not_truth_override",
                "do_not_auto_rewrite_pharmacy_case",
                "fall_back_cleanly_when_unavailable",
            ],
            "required_hazard_log_refs": ["ART_PDS_HAZARD_LOG"],
            "required_risk_log_refs": ["ART_PDS_RISKLOG_APPLICATION_RESTRICTED"],
            "mock_now_support_level": "full_search_and_read",
            "actual_later_gate_refs": [
                "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
                "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
                "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF",
            ],
            "fallback_if_unavailable": "Keep route-local pharmacy truth only and label PDS corroboration as unavailable.",
            "notes": "Included to preserve the blueprint separation between route-local pharmacy truth and wider demographic facts.",
        },
    ]

    for row in rows:
        route_meta = routes.get(row["route_family_ref"], {})
        row["route_family_name"] = route_meta.get("route_family_name", row["route_family_ref"])
        row["shell_id"] = route_meta.get("shell_id", "")
        row["source_refs"] = [
            "prompt/027.md",
            "blueprint/phase-2-identity-and-echoes.md#2C. Patient linkage, demographic confidence, and optional PDS enrichment",
            "blueprint/phase-0-the-foundation-protocol.md#5.4 patientRef write control",
            "blueprint/phase-0-the-foundation-protocol.md#2.2A IdentityBindingAuthority",
            "blueprint/blueprint-init.md#10. Identity, consent, security, and policy",
        ]
        row["requires_real_provider_mutation"] = (
            "yes" if row["access_mode"] in {"healthcare_worker_with_update", "patient_access"} and row["default_state"] == "off" else "no"
        )
    return rows


def build_feature_flags(access_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flag_rows: list[dict[str, Any]] = []
    for row in access_rows:
        flag_rows.append(
            {
                "flag_name": row["feature_flag_name"],
                "route_family_ref": row["route_family_ref"],
                "pds_use_case_id": row["pds_use_case_id"],
                "default_state": row["default_state"],
                "rollout_states": ["off", "internal_only", "cohort_limited", "ready_for_live"],
                "kill_switch_name": "pds.global.kill_switch",
                "kill_switch_scope": "all_pds_calls_and_rendering",
                "why_optional_not_required": "Local matching and governed IdentityBinding remain the baseline path even when the flag is on.",
                "activation_requirements": [
                    "source_traceable_use_case",
                    "explicit_legal_basis",
                    "current_hazard_and_risk_logs",
                    "wrong_patient_mitigation_pack",
                ],
                "rollback_triggers": [
                    "wrong_patient_signal_rate_exceeds_threshold",
                    "p95_latency_breach",
                    "stale_or_contradictory_rate_exceeds_threshold",
                    "feature_flag_scope_drift_detected",
                ],
                "route_binding_notes": row["notes"],
            }
        )
    flag_rows.append(
        {
            "flag_name": "pds.global.kill_switch",
            "route_family_ref": "all_flagged_routes",
            "pds_use_case_id": "PDS_GLOBAL",
            "default_state": "internal_only",
            "rollout_states": ["internal_only"],
            "kill_switch_name": "pds.global.kill_switch",
            "kill_switch_scope": "all_pds_calls_and_rendering",
            "why_optional_not_required": "The kill switch exists so PDS can be removed instantly without taking baseline identity or request flows down.",
            "activation_requirements": ["operator_access_to_flag_console"],
            "rollback_triggers": [
                "manual_operator_trigger",
                "provider_outage",
                "policy_or_legal_basis_withdrawn",
                "route_specific_harm_signal",
            ],
            "route_binding_notes": "This flag never establishes a live route by itself; it only removes optional capability.",
        }
    )
    return flag_rows


def build_onboarding_fields(secret_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    owner_role = secret_rows[0]["owner_role"]
    return [
        {
            "field_id": "fld_org_name",
            "section": "organisation",
            "label": "Organisation name",
            "origin_class": "derived_dossier",
            "official_basis": "digital onboarding identifies the connecting organisation",
            "expected_value": "Vecells placeholder legal entity",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_org_ods_code",
            "section": "organisation",
            "label": "Organisation ODS code",
            "origin_class": "derived_dossier",
            "official_basis": "onboarding and network approvals are organisation specific",
            "expected_value": "ORG-PLACEHOLDER",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_product_name",
            "section": "product",
            "label": "Product name",
            "origin_class": "derived_dossier",
            "official_basis": "digital onboarding and SCAL both capture product identity",
            "expected_value": "Vecells PDS Optional Enrichment Adapter",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_product_summary",
            "section": "product",
            "label": "Product summary",
            "origin_class": "derived_dossier",
            "official_basis": "use case and legal basis must be explicit, not vague narrative",
            "expected_value": "Optional supporting demographic enrichment behind default-off route flags.",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_purpose_and_use_case",
            "section": "use_case",
            "label": "Purpose and use case",
            "origin_class": "official_guidance_requirement",
            "official_basis": "official onboarding expects purpose and use case to justify access",
            "expected_value": "One or more bounded route-family use cases from pds_access_mode_matrix.csv",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_legal_basis_summary",
            "section": "use_case",
            "label": "Legal basis summary",
            "origin_class": "official_guidance_requirement",
            "official_basis": "the access-data guidance says requests are assessed case by case and legal review can be required",
            "expected_value": "Direct care or patient self-service legal basis per access row",
            "gate_refs": ["LIVE_GATE_PDS_LEGAL_BASIS_APPROVED"],
        },
        {
            "field_id": "fld_route_family_refs",
            "section": "use_case",
            "label": "Route family refs",
            "origin_class": "derived_dossier",
            "official_basis": "Vecells must bind each PDS use case to exact route families",
            "expected_value": "rf_patient_secure_link_recovery; rf_patient_home; rf_staff_workspace; rf_support_ticket_workspace; rf_governance_shell; rf_patient_requests",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_access_modes_used",
            "section": "access_model",
            "label": "Access modes used",
            "origin_class": "official_guidance_requirement",
            "official_basis": "the onboarding support page requires one risk log per access mode used",
            "expected_value": "application_restricted; healthcare_worker; healthcare_worker_with_update; patient_access",
            "gate_refs": ["PDS_LIVE_GATE_ACCESS_MODE_SELECTED"],
        },
        {
            "field_id": "fld_secure_network_expectation",
            "section": "access_model",
            "label": "Secure network connection expectation",
            "origin_class": "official_guidance_requirement",
            "official_basis": "the access-data page notes secure-network expectations for smartcard-backed use",
            "expected_value": "HSCN or equivalent planned where smartcard or worker access is used",
            "gate_refs": ["PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED"],
        },
        {
            "field_id": "fld_access_method_choice",
            "section": "access_model",
            "label": "Access method choice",
            "origin_class": "official_guidance_requirement",
            "official_basis": "official access guidance expects the access method to be justified",
            "expected_value": "PDS FHIR only; no SMSP fallback hidden inside this task",
            "gate_refs": ["PDS_LIVE_GATE_ACCESS_MODE_SELECTED"],
        },
        {
            "field_id": "fld_why_local_matching_not_enough",
            "section": "identity",
            "label": "Why local matching alone is not enough",
            "origin_class": "derived_dossier",
            "official_basis": "prompt 027 requires this to be structured per row",
            "expected_value": "Exact per-row rationale from pds_access_mode_matrix.csv",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
        {
            "field_id": "fld_identity_binding_separation",
            "section": "identity",
            "label": "Identity binding separation statement",
            "origin_class": "derived_dossier",
            "official_basis": "Vecells identity law",
            "expected_value": "PDS lookup never writes Request.patientRef directly; IdentityBindingAuthority only.",
            "gate_refs": ["PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT"],
        },
        {
            "field_id": "fld_wrong_patient_controls",
            "section": "identity",
            "label": "Wrong-patient mitigation controls",
            "origin_class": "official_guidance_requirement",
            "official_basis": "risk-based assurance and hazard mitigation must be evidenced",
            "expected_value": "freeze, review, audit, masking, rollback, no direct bind",
            "gate_refs": ["PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT"],
        },
        {
            "field_id": "fld_hazard_log_ref",
            "section": "safety",
            "label": "Hazard log reference",
            "origin_class": "official_guidance_requirement",
            "official_basis": "hazard log upload is mandatory in digital onboarding",
            "expected_value": "ART_PDS_HAZARD_LOG",
            "gate_refs": ["PDS_LIVE_GATE_HAZARD_LOG_CURRENT"],
        },
        {
            "field_id": "fld_risk_log_refs",
            "section": "safety",
            "label": "Connecting systems risk log refs",
            "origin_class": "official_guidance_requirement",
            "official_basis": "one risk log is required for each access mode used",
            "expected_value": "Access-mode-specific artifact refs from pds_hazard_risk_artifact_matrix.csv",
            "gate_refs": ["PDS_LIVE_GATE_RISK_LOGS_CURRENT"],
        },
        {
            "field_id": "fld_mitigation_test_plan",
            "section": "safety",
            "label": "Mitigation evidence test plan",
            "origin_class": "official_guidance_requirement",
            "official_basis": "the test team arranges evidence testing of the listed mitigations",
            "expected_value": "Browser and API rehearsal suite against each mitigation class",
            "gate_refs": ["PDS_LIVE_GATE_RISK_LOGS_CURRENT"],
        },
        {
            "field_id": "fld_feature_flag_default_off",
            "section": "rollout",
            "label": "Feature-flag default-off statement",
            "origin_class": "derived_dossier",
            "official_basis": "prompt 027 mandatory gap closure",
            "expected_value": "All PDS route flags stay off or internal_only until live gates clear",
            "gate_refs": ["PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF"],
        },
        {
            "field_id": "fld_rollout_cohort",
            "section": "rollout",
            "label": "Rollout cohort and blast radius",
            "origin_class": "derived_dossier",
            "official_basis": "route family and cohort scoping are required to keep PDS optional and reversible",
            "expected_value": "tenant + route + environment cohort definition",
            "gate_refs": ["PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF"],
        },
        {
            "field_id": "fld_kill_switch_plan",
            "section": "rollout",
            "label": "Kill switch and rollback plan",
            "origin_class": "derived_dossier",
            "official_basis": "prompt 027 requires rollback conditions and kill switches",
            "expected_value": "pds.global.kill_switch plus per-route default-off rollback",
            "gate_refs": ["PDS_LIVE_GATE_ROLLBACK_REHEARSED"],
        },
        {
            "field_id": "fld_named_approver",
            "section": "approvals",
            "label": "Named approver",
            "origin_class": "derived_dossier",
            "official_basis": "real onboarding remains blocked without a named approver",
            "expected_value": owner_role,
            "gate_refs": ["PDS_LIVE_GATE_NAMED_APPROVER_PRESENT"],
        },
        {
            "field_id": "fld_environment_target",
            "section": "approvals",
            "label": "Environment target",
            "origin_class": "derived_dossier",
            "official_basis": "live gates require an exact environment target",
            "expected_value": "sandbox or integration equivalent",
            "gate_refs": ["PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT"],
        },
        {
            "field_id": "fld_secret_capture_plan",
            "section": "approvals",
            "label": "Secret capture plan",
            "origin_class": "derived_dossier",
            "official_basis": "seq_023 already freezes principal and certificate ownership rules",
            "expected_value": "ACC_PDS_SANDPIT_PRINCIPAL; KEY_PDS_SANDPIT_CERT via dual control",
            "gate_refs": ["LIVE_GATE_PDS_LEGAL_BASIS_APPROVED"],
        },
        {
            "field_id": "fld_dspt_and_security_posture",
            "section": "assurance",
            "label": "DSPT and security posture",
            "origin_class": "official_guidance_requirement",
            "official_basis": "SCAL and digital onboarding both require IG and security evidence",
            "expected_value": "current DSPT posture plus vault-backed secret plan",
            "gate_refs": ["PDS_LIVE_GATE_RISK_LOGS_CURRENT"],
        },
        {
            "field_id": "fld_cloud_storage_posture",
            "section": "assurance",
            "label": "Cloud and storage posture",
            "origin_class": "derived_dossier",
            "official_basis": "official access pages warn that design details can be impacted by onboarding requirements",
            "expected_value": "No real demographic fixtures in repo; masked logs only; audited storage classes only.",
            "gate_refs": ["PDS_LIVE_GATE_RISK_LOGS_CURRENT"],
        },
        {
            "field_id": "fld_partner_onboarding_contact",
            "section": "assurance",
            "label": "Partner onboarding contact",
            "origin_class": "official_guidance_requirement",
            "official_basis": "SCAL and partner onboarding support routes are explicit on the official pages",
            "expected_value": "ROLE_INTEROPERABILITY_LEAD",
            "gate_refs": ["PDS_LIVE_GATE_USE_CASE_TRACEABLE"],
        },
    ]


def build_hazard_artifacts() -> list[dict[str, Any]]:
    return [
        {
            "artifact_id": "ART_PDS_HAZARD_LOG",
            "artifact_type": "hazard_log",
            "access_modes": "application_restricted;healthcare_worker;healthcare_worker_with_update;patient_access",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "freshness_rule": "review_on_every_use_case_or_access_mode_change",
            "source_refs": "official_pds_onboarding_support_info; HZ_WRONG_PATIENT_BINDING",
            "gate_refs": "PDS_LIVE_GATE_HAZARD_LOG_CURRENT",
            "notes": "Use the official PDS hazard log template or an equivalent that covers the same hazards.",
        },
        {
            "artifact_id": "ART_PDS_RISKLOG_APPLICATION_RESTRICTED",
            "artifact_type": "connecting_systems_risk_log",
            "access_modes": "application_restricted",
            "route_family_refs": "rf_patient_secure_link_recovery;rf_patient_requests",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "current_for_each_access_mode_in_use",
            "source_refs": "official_pds_onboarding_support_info",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            "notes": "Required because the official onboarding support page publishes a dedicated template for application-restricted mode.",
        },
        {
            "artifact_id": "ART_PDS_RISKLOG_HEALTHCARE_WORKER",
            "artifact_type": "connecting_systems_risk_log",
            "access_modes": "healthcare_worker",
            "route_family_refs": "rf_staff_workspace;rf_support_ticket_workspace;rf_governance_shell",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "current_for_each_access_mode_in_use",
            "source_refs": "official_pds_onboarding_support_info; official_pds_integrated_products",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            "notes": "Normalised to the read-only worker class even where the roster says 'healthcare worker mode without update'.",
        },
        {
            "artifact_id": "ART_PDS_RISKLOG_HEALTHCARE_WORKER_UPDATE",
            "artifact_type": "connecting_systems_risk_log",
            "access_modes": "healthcare_worker_with_update",
            "route_family_refs": "rf_support_ticket_workspace;rf_governance_shell",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "current_for_each_access_mode_in_use",
            "source_refs": "official_pds_onboarding_support_info; official_pds_integrated_products",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT; PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            "notes": "Update-capable risk log is required before any write-like rehearsal can move beyond simulated mode.",
        },
        {
            "artifact_id": "ART_PDS_RISKLOG_PATIENT_ACCESS",
            "artifact_type": "connecting_systems_risk_log",
            "access_modes": "patient_access",
            "route_family_refs": "rf_patient_home",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "current_for_each_access_mode_in_use",
            "source_refs": "official_pds_onboarding_support_info; official_pds_integration_guidance",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT; PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            "notes": "Patient access is explicitly current in the official roster and integration guidance, but remains future-only in Vecells.",
        },
        {
            "artifact_id": "ART_PDS_LEGAL_BASIS_DOSSIER",
            "artifact_type": "legal_basis_dossier",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_DPO",
            "freshness_rule": "refresh_on_scope_or_route_change",
            "source_refs": "official_access_data_on_pds; LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "gate_refs": "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "notes": "Structured route-family legal basis fields prevent vague narrative approval.",
        },
        {
            "artifact_id": "ART_PDS_WRONG_PATIENT_MITIGATION_PLAN",
            "artifact_type": "wrong_patient_mitigation",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "freshness_rule": "refresh_on_identity_or_repair_policy_change",
            "source_refs": "HZ_WRONG_PATIENT_BINDING; RISK_STATE_004",
            "gate_refs": "PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT",
            "notes": "Must prove no lookup can shortcut IdentityBindingAuthority or identity repair.",
        },
        {
            "artifact_id": "ART_PDS_ROUTE_FLAG_APPROVAL",
            "artifact_type": "feature_flag_approval",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_GOVERNANCE_LEAD",
            "freshness_rule": "refresh_on_tenant_or_route_blast_radius_change",
            "source_refs": "prompt/027.md",
            "gate_refs": "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF",
            "notes": "Each route-family flag stays default-off or internal-only until this approval exists.",
        },
        {
            "artifact_id": "ART_PDS_SECURE_NETWORK_PLAN",
            "artifact_type": "network_connectivity_plan",
            "access_modes": "healthcare_worker;healthcare_worker_with_update",
            "route_family_refs": "rf_staff_workspace;rf_support_ticket_workspace;rf_governance_shell",
            "owner_role": "ROLE_PLATFORM_GOVERNANCE_LEAD",
            "freshness_rule": "refresh_on_auth_pattern_or_network_path_change",
            "source_refs": "official_access_data_on_pds",
            "gate_refs": "PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED",
            "notes": "Worker modes require an explicit secure-network and strong-auth posture plan.",
        },
        {
            "artifact_id": "ART_PDS_EVIDENCE_TEST_PLAN",
            "artifact_type": "mitigation_evidence_test_plan",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "refresh_on_new_risk_log_version",
            "source_refs": "official_pds_onboarding_support_info",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            "notes": "The official onboarding support page says the test team arranges evidence testing of the mitigations.",
        },
        {
            "artifact_id": "ART_PDS_ROLLBACK_REHEARSAL",
            "artifact_type": "rollback_rehearsal",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_RELEASE_MANAGER",
            "freshness_rule": "refresh_each_release_candidate",
            "source_refs": "prompt/027.md; docs/external/21_mock_first_vs_actual_later_strategy.md",
            "gate_refs": "PDS_LIVE_GATE_ROLLBACK_REHEARSED",
            "notes": "Kill switch plus degraded fallback must be rehearsed before any real onboarding is attempted.",
        },
        {
            "artifact_id": "ART_PDS_SECRET_CAPTURE_PLAN",
            "artifact_type": "secret_capture_plan",
            "access_modes": "application_restricted;healthcare_worker;healthcare_worker_with_update;patient_access",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "freshness_rule": "refresh_on_provider_material_change",
            "source_refs": "seq_023 secret ownership outputs",
            "gate_refs": "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "notes": "Principal and certificate capture remain blocked placeholders until legal basis and feature-flag approval clear.",
        },
        {
            "artifact_id": "ART_PDS_DATA_HANDLING_NOTE",
            "artifact_type": "data_handling_rule",
            "access_modes": "all_selected_modes",
            "route_family_refs": "all_pds_routes",
            "owner_role": "ROLE_DPO",
            "freshness_rule": "refresh_on retention or masking policy update",
            "source_refs": "seq_010 data classification outputs; prompt/027.md",
            "gate_refs": "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            "notes": "No real NHS numbers or demographic fixtures in repo; logs and screenshots must remain masked.",
        },
    ]


def build_live_gates(phase0_verdict: dict[str, Any]) -> dict[str, Any]:
    gates = [
        {
            "gate_id": "GATE_EXTERNAL_TO_FOUNDATION",
            "label": "External readiness gate",
            "status": "blocked",
            "reason": phase0_verdict["gate_verdicts"][0]["reason"],
        },
        {
            "gate_id": "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED",
            "label": "PDS legal basis and feature-flag approval",
            "status": "blocked",
            "reason": "Inherited from seq_023: legal basis, tenant feature flag, and enrichment posture remain pending.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_USE_CASE_TRACEABLE",
            "label": "Use case is source-traceable and route-bound",
            "status": "pass",
            "reason": "This pack structures each use case with route-family, access-mode, and fallback law.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF",
            "label": "Route flags remain default-off or internal-only",
            "status": "pass",
            "reason": "All route rows are encoded as off or internal_only in the registry.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_ACCESS_MODE_SELECTED",
            "label": "Exact access mode selected and justified",
            "status": "review_required",
            "reason": "Mode choices are drafted, but official onboarding is blocked until a real use-case subset is approved.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_HAZARD_LOG_CURRENT",
            "label": "Hazard log is current",
            "status": "review_required",
            "reason": "The artifact plan exists, but no live hazard-log pack is approved yet.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_RISK_LOGS_CURRENT",
            "label": "Risk logs are current for each access mode used",
            "status": "review_required",
            "reason": "The official per-mode templates are mapped, but no signed live set exists yet.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT",
            "label": "Wrong-patient mitigation plan is current",
            "status": "review_required",
            "reason": "The mitigation controls are encoded but still need named approver sign-off for any real onboarding.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED",
            "label": "Secure-network path is planned where worker access is used",
            "status": "review_required",
            "reason": "Official guidance requires the network posture to be explicit for smartcard-backed worker use.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_NAMED_APPROVER_PRESENT",
            "label": "Named approver is present",
            "status": "blocked",
            "reason": "Real provider work remains blocked without a named approver input.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "label": "Environment target is present",
            "status": "blocked",
            "reason": "No real sandbox or integration target should be attempted without an exact environment target.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_ROLLBACK_REHEARSED",
            "label": "Rollback and kill switch have been rehearsed",
            "status": "review_required",
            "reason": "The rollback model is encoded in the studio, but a named release rehearsal is still required.",
        },
        {
            "gate_id": "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION",
            "label": "Real provider mutation is explicitly enabled",
            "status": "blocked",
            "reason": "Fail-closed by default until ALLOW_REAL_PROVIDER_MUTATION=true is set.",
        },
    ]
    return {
        "current_submission_posture": "blocked",
        "required_env": [
            "PDS_NAMED_APPROVER",
            "PDS_ENVIRONMENT_TARGET",
            "PDS_ORGANISATION_ODS",
            "PDS_USE_CASE_OWNER",
            "ALLOW_REAL_PROVIDER_MUTATION",
        ],
        "selector_map": {
            "base_profile": {
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "page_tab_use_case": "[data-testid='page-tab-Use_Case_and_Legal_Basis']",
                "page_tab_rollback": "[data-testid='page-tab-Rollback_and_Kill_Switches']",
                "route_button": "[data-testid='route-button-rf_patient_secure_link_recovery']",
                "field_approver": "[data-testid='actual-field-named-approver']",
                "field_environment": "[data-testid='actual-field-environment-target']",
                "field_ods": "[data-testid='actual-field-org-ods']",
                "field_owner": "[data-testid='actual-field-use-case-owner']",
                "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
                "final_submit": "[data-testid='actual-submit-button']",
                "hazard_row": "[data-testid='artifact-row-ART_PDS_HAZARD_LOG']",
                "risk_row": "[data-testid='artifact-row-ART_PDS_RISKLOG_APPLICATION_RESTRICTED']",
            }
        },
        "live_gates": gates,
    }


def build_mock_service_model() -> dict[str, Any]:
    access_profiles = [
        {
            "access_mode": mode,
            "aliases": aliases,
            "supports_read": "yes",
            "supports_update": "yes" if mode in {"healthcare_worker_with_update", "patient_access"} else "no",
        }
        for mode, aliases in ACCESS_MODE_ALIAS_MAP.items()
    ]
    return {
        "base_url_default": "http://127.0.0.1:4176",
        "access_profiles": access_profiles,
        "patients": MOCK_PATIENTS,
        "scenarios": SCENARIOS,
        "logging_policy": {
            "masking": "All identifiers are masked to first 2 and last 2 characters only.",
            "retention": "In-memory only for rehearsal; no file persistence.",
            "forbidden": [
                "real_nhs_numbers",
                "real_patient_demographics",
                "unmasked_console_echo",
            ],
        },
    }


def build_pack(payload: dict[str, Any]) -> dict[str, Any]:
    routes = route_index(payload["route_family_inventory"])
    pds_integration = find_pds_integration(payload)
    pds_dependency = find_pds_dependency(payload)
    pds_secret_rows = find_pds_secret_rows(payload)
    risk_state = find_risk(payload, "RISK_STATE_004")
    risk_wrong_patient = find_risk(payload, "HZ_WRONG_PATIENT_BINDING")
    access_rows = build_access_rows(routes)
    feature_flags = build_feature_flags(access_rows)
    onboarding_fields = build_onboarding_fields(pds_secret_rows)
    hazard_artifacts = build_hazard_artifacts()
    live_gate_pack = build_live_gates(payload["phase0_gate_verdict"])
    mock_service = build_mock_service_model()
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    return {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "official_guidance": OFFICIAL_GUIDANCE,
        "assumptions": ASSUMPTIONS,
        "upstream_inputs": {name: str(path.relative_to(ROOT)) for name, path in REQUIRED_INPUTS.items()},
        "phase0_verdict": payload["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "pds_integration": pds_integration,
        "pds_dependency": pds_dependency,
        "risk_bindings": [risk_state, risk_wrong_patient],
        "access_mode_alias_map": ACCESS_MODE_ALIAS_MAP,
        "access_rows": access_rows,
        "feature_flags": feature_flags,
        "onboarding_fields": onboarding_fields,
        "hazard_artifacts": hazard_artifacts,
        "live_gate_pack": live_gate_pack,
        "mock_service": mock_service,
        "rollback_signals": [
            {
                "signal_id": "ROLLBACK_SIG_WRONG_PATIENT_SPIKE",
                "signal": "wrong_patient_signal_rate_exceeds_threshold",
                "threshold": "more than 1 unresolved signal in the latest cohort or any confirmed wrong-patient event",
            },
            {
                "signal_id": "ROLLBACK_SIG_P95_LATENCY",
                "signal": "p95_latency_breach",
                "threshold": "more than 900ms across three consecutive monitoring windows",
            },
            {
                "signal_id": "ROLLBACK_SIG_CONTRADICTION_RATE",
                "signal": "stale_or_contradictory_rate_exceeds_threshold",
                "threshold": "more than 5% contradictory-or-stale traces within the current cohort",
            },
            {
                "signal_id": "ROLLBACK_SIG_SCOPE_DRIFT",
                "signal": "feature_flag_scope_drift_detected",
                "threshold": "Any route receives PDS rendering without an approved feature-flag tuple",
            },
        ],
        "summary": {
            "access_row_count": len(access_rows),
            "feature_flag_count": len(feature_flags),
            "field_count": len(onboarding_fields),
            "official_guidance_field_count": len([row for row in onboarding_fields if row["origin_class"] == "official_guidance_requirement"]),
            "derived_field_count": len([row for row in onboarding_fields if row["origin_class"] == "derived_dossier"]),
            "hazard_artifact_count": len(hazard_artifacts),
            "live_gate_count": len(live_gate_pack["live_gates"]),
            "blocked_live_gate_count": len([row for row in live_gate_pack["live_gates"] if row["status"] == "blocked"]),
            "review_live_gate_count": len([row for row in live_gate_pack["live_gates"] if row["status"] == "review_required"]),
            "pass_live_gate_count": len([row for row in live_gate_pack["live_gates"] if row["status"] == "pass"]),
            "mock_patient_count": len(MOCK_PATIENTS),
            "scenario_count": len(SCENARIOS),
        },
    }


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    head = "| " + " | ".join(headers) + " |"
    rule = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([head, rule, *body])


def render_feature_flag_doc(pack: dict[str, Any]) -> str:
    flag_rows = markdown_table(
        ["Flag", "Route", "Default", "Why Optional", "Rollback Triggers"],
        [
            [
                row["flag_name"],
                row["route_family_ref"],
                row["default_state"],
                row["why_optional_not_required"],
                ", ".join(row["rollback_triggers"][:2]),
            ]
            for row in pack["feature_flags"]
        ],
    )
    return f"""
    # 27 PDS Feature Flag Strategy

    Phase 0 entry remains `{pack["phase0_verdict"]}`. This pack therefore encodes PDS as optional, bounded, and reversible rather than as a hidden baseline dependency.

    ## Summary

    - access rows: {pack["summary"]["access_row_count"]}
    - route or global flags: {pack["summary"]["feature_flag_count"]}
    - current submission posture: `{pack["live_gate_pack"]["current_submission_posture"]}`
    - visual mode: `{pack["visual_mode"]}`

    ## Section A — `Mock_now_execution`

    The local studio and mock sandbox exercise the flag lifecycle now without claiming that PDS is required for sign-in, ownership, or request progression.

    {flag_rows}

    Mandatory controls:

    - every PDS route remains `off` or `internal_only` by default
    - `pds.global.kill_switch` disables all PDS calls and rendering without breaking local matching
    - PDS success never writes `Request.patientRef`; it only creates supporting evidence for `IdentityBindingAuthority`
    - contradictory, stale, throttled, and degraded responses always preserve safe fallback copy

    ## Section B — `Actual_provider_strategy_later`

    The later live strategy uses the current official PDS FHIR onboarding mechanics:

    - digital onboarding is the primary route
    - the use case and legal basis stay structured per route family
    - one connecting-systems risk log is required for each access mode used
    - hazard-log and mitigation-evidence work are first-class readiness artifacts, not later paperwork
    - worker and update-capable access remains blocked until named approval, environment target, and explicit mutation consent exist

    Official guidance captured on 2026-04-09:

    {markdown_table(
        ["Source", "Why it matters"],
        [[row["title"], row["summary"]] for row in pack["official_guidance"]]
    )}
    """


def render_field_map_doc(pack: dict[str, Any]) -> str:
    table = markdown_table(
        ["Field", "Section", "Origin", "Expected Value", "Gate"],
        [
            [
                row["field_id"],
                row["section"],
                row["origin_class"],
                row["expected_value"],
                ", ".join(row["gate_refs"]),
            ]
            for row in pack["onboarding_fields"]
        ],
    )
    return f"""
    # 27 PDS Digital Onboarding Field Map

    The public PDS pages describe the mechanics and required evidence for digital onboarding, but not a full public DOS schema. This field map therefore turns the official mechanics into a deterministic Vecells dossier rather than pretending to be a literal portal scrape.

    ## Summary

    - fields: {pack["summary"]["field_count"]}
    - official-guidance-derived fields: {pack["summary"]["official_guidance_field_count"]}
    - Vecells dossier fields: {pack["summary"]["derived_field_count"]}

    ## Section A — `Mock_now_execution`

    The studio exposes these fields locally so the team can rehearse the dossier and see which live gates are still unmet.

    {table}

    ## Section B — `Actual_provider_strategy_later`

    Use the same field map for the later onboarding dossier, but fail closed unless:

    - the exact route-bound use case is approved
    - the legal basis is explicit
    - the environment target is named
    - the hazard and risk log references are current
    - `ALLOW_REAL_PROVIDER_MUTATION=true` is set
    """


def render_access_matrix_doc(pack: dict[str, Any]) -> str:
    matrix = markdown_table(
        ["Use Case", "Route", "Mode", "Default", "Fallback"],
        [
            [
                row["pds_use_case_id"],
                row["route_family_ref"],
                row["access_mode"],
                row["default_state"],
                row["fallback_if_unavailable"],
            ]
            for row in pack["access_rows"]
        ],
    )
    alias_table = markdown_table(
        ["Canonical mode", "Official labels observed"],
        [[mode, ", ".join(labels) or "none"] for mode, labels in pack["access_mode_alias_map"].items()],
    )
    return f"""
    # 27 PDS Access Mode And Route Family Matrix

    This matrix closes the ad-hoc access-mode selection gap by binding every PDS use case to an exact route family, access mode, fallback, and gate set.

    ## Summary

    - access rows: {pack["summary"]["access_row_count"]}
    - live-gate rows: {pack["summary"]["live_gate_count"]}

    ## Section A — `Mock_now_execution`

    {matrix}

    Access-mode normalisation:

    {alias_table}

    ## Section B — `Actual_provider_strategy_later`

    The official sources are slightly awkward in wording: the onboarding-support page and operations page still publish four risk-log classes, while the integrated-products roster also uses the label `healthcare worker mode without update`. This pack normalises the read-only worker wording to `healthcare_worker`, keeps `healthcare_worker_with_update` as a distinct mutation-capable class, and preserves the source-dated alias map above so no one invents a hidden fifth baseline mode.
    """


def render_hazard_doc(pack: dict[str, Any]) -> str:
    artifact_table = markdown_table(
        ["Artifact", "Type", "Access Modes", "Gate", "Notes"],
        [
            [
                row["artifact_id"],
                row["artifact_type"],
                row["access_modes"],
                row["gate_refs"],
                row["notes"],
            ]
            for row in pack["hazard_artifacts"]
        ],
    )
    return f"""
    # 27 PDS Hazard And Risk Log Strategy

    The official onboarding support page requires a completed hazard log plus one risk log for each access mode used. This pack turns those obligations into executable readiness artifacts now.

    ## Summary

    - hazard and risk artifacts: {pack["summary"]["hazard_artifact_count"]}
    - key upstream risks: `{pack["risk_bindings"][0]["risk_id"]}`, `{pack["risk_bindings"][1]["risk_id"]}`

    ## Section A — `Mock_now_execution`

    Mock execution treats hazard and risk work as active engineering inputs:

    - every simulated access mode maps to a hazard and risk artifact row
    - contradictory, stale, throttled, and degraded sandbox responses exercise the same mitigation classes later evidence testing must prove
    - the studio shows artifact freshness and route binding so safety work cannot drift into generic prose

    {artifact_table}

    ## Section B — `Actual_provider_strategy_later`

    Before any real onboarding step:

    - refresh the hazard log with the chosen route-family scope
    - upload the risk log for each access mode actually used
    - prepare evidence testing for the listed mitigations
    - keep wrong-patient mitigation and rollback rehearsal current, because PDS enrichment never removes repair obligations
    """


def render_live_gate_doc(pack: dict[str, Any]) -> str:
    gate_table = markdown_table(
        ["Gate", "Status", "Reason"],
        [[row["gate_id"], row["status"], row["reason"]] for row in pack["live_gate_pack"]["live_gates"]],
    )
    rollback_table = markdown_table(
        ["Signal", "Threshold"],
        [[row["signal"], row["threshold"]] for row in pack["rollback_signals"]],
    )
    return f"""
    # 27 PDS Live Gate And Rollback Plan

    Real PDS onboarding remains fail-closed. The current submission posture is `{pack["live_gate_pack"]["current_submission_posture"]}` and Phase 0 entry remains `{pack["phase0_verdict"]}`.

    ## Summary

    - live gates: {pack["summary"]["live_gate_count"]}
    - blocked: {pack["summary"]["blocked_live_gate_count"]}
    - review required: {pack["summary"]["review_live_gate_count"]}
    - pass: {pack["summary"]["pass_live_gate_count"]}

    ## Section A — `Mock_now_execution`

    The studio and sandbox expose the exact blocker truth now:

    {gate_table}

    ## Section B — `Actual_provider_strategy_later`

    Rollback triggers:

    {rollback_table}

    Required environment inputs for any real dry-run or submission:

    - {", ".join(pack["live_gate_pack"]["required_env"])}

    Mutation remains blocked unless:

    - the named approver is present
    - the environment target is present
    - the exact use case is traceable
    - the route flag remains default-off outside the approved cohort
    - the hazard and risk logs are current
    - `ALLOW_REAL_PROVIDER_MUTATION=true`
    """


def render_service_readme(pack: dict[str, Any]) -> str:
    return f"""
    # mock-pds-fhir

    Local rehearsal-grade PDS FHIR sandbox for `{TASK_ID}`.

    ## What it provides

    - FHIR-style search and read endpoints for synthetic patient demographics
    - access-mode profiles for `application_restricted`, `healthcare_worker`, `healthcare_worker_with_update`, and `patient_access`
    - scenario coverage for matched, ambiguous, low confidence, no match, stale, contradictory, partial-field, throttled, and degraded behavior
    - masked audit logs only
    - an internal playground page at `/`

    ## Run

    ```bash
    node src/server.js
    ```

    Defaults:

    - listen address: `127.0.0.1`
    - port: `4176`

    Key endpoints:

    - `GET /metadata`
    - `GET /Patient?scenario=matched&accessMode=application_restricted&query=meridian`
    - `GET /Patient/pds_pt_meridian_001?scenario=matched&accessMode=application_restricted`
    - `GET /audit`
    - `GET /health`

    ## Safety rules

    - synthetic fixtures only
    - no real NHS numbers or live demographic data
    - PDS responses never imply durable identity binding
    - degraded and throttled scenarios must preserve the no-PDS fallback posture
    """


def render_app_readme(pack: dict[str, Any]) -> str:
    return f"""
    # mock-pds-access-studio

    `{VISUAL_MODE}` access-control studio for `{TASK_ID}`.

    ## Run

    ```bash
    pnpm install
    pnpm dev
    ```

    Defaults:

    - dev server: `http://127.0.0.1:4177`
    - expected sandbox: `{pack["mock_service"]["base_url_default"]}`

    ## Pages

    - `PDS_Flag_Overview`
    - `Access_Mode_Lattice`
    - `Use_Case_and_Legal_Basis`
    - `Risk_Log_and_Hazard_Map`
    - `Rollback_and_Kill_Switches`

    ## Guardrails

    - every route remains default-off or internal-only until live gates clear
    - PDS success is rendered as supporting evidence, not binding truth
    - the lower lineage strip keeps `local_match -> optional_pds_enrichment -> identity_binding_review -> durable_binding` visible at all times
    """


def write_pack_artifacts(pack: dict[str, Any]) -> None:
    write_json(PACK_JSON_PATH, pack)
    write_csv(
        ACCESS_MATRIX_PATH,
        [
            {
                "pds_use_case_id": row["pds_use_case_id"],
                "route_family_ref": row["route_family_ref"],
                "route_family_name": row["route_family_name"],
                "shell_id": row["shell_id"],
                "action_scope": row["action_scope"],
                "access_mode": row["access_mode"],
                "why_pds_is_needed": row["why_pds_is_needed"],
                "why_local_matching_alone_is_not_sufficient": row["why_local_matching_alone_is_not_sufficient"],
                "legal_basis_summary": row["legal_basis_summary"],
                "feature_flag_name": row["feature_flag_name"],
                "default_state": row["default_state"],
                "identity_binding_impact": row["identity_binding_impact"],
                "wrong_patient_risk_controls": ";".join(row["wrong_patient_risk_controls"]),
                "required_hazard_log_refs": ";".join(row["required_hazard_log_refs"]),
                "required_risk_log_refs": ";".join(row["required_risk_log_refs"]),
                "mock_now_support_level": row["mock_now_support_level"],
                "actual_later_gate_refs": ";".join(row["actual_later_gate_refs"]),
                "fallback_if_unavailable": row["fallback_if_unavailable"],
                "requires_real_provider_mutation": row["requires_real_provider_mutation"],
                "notes": row["notes"],
                "source_refs": ";".join(row["source_refs"]),
            }
            for row in pack["access_rows"]
        ],
    )
    write_json(
        FEATURE_FLAG_PATH,
        {
            "task_id": pack["task_id"],
            "generated_at": pack["generated_at"],
            "visual_mode": pack["visual_mode"],
            "feature_flags": pack["feature_flags"],
            "summary": {
                "feature_flag_count": pack["summary"]["feature_flag_count"],
                "route_bound_flag_count": len([row for row in pack["feature_flags"] if row["pds_use_case_id"] != "PDS_GLOBAL"]),
            },
        },
    )
    write_json(
        FIELD_MAP_PATH,
        {
            "task_id": pack["task_id"],
            "generated_at": pack["generated_at"],
            "fields": pack["onboarding_fields"],
            "summary": {
                "field_count": pack["summary"]["field_count"],
                "official_guidance_field_count": pack["summary"]["official_guidance_field_count"],
                "derived_field_count": pack["summary"]["derived_field_count"],
            },
        },
    )
    write_csv(HAZARD_MATRIX_PATH, pack["hazard_artifacts"])
    write_text(FEATURE_FLAG_DOC_PATH, render_feature_flag_doc(pack))
    write_text(FIELD_MAP_DOC_PATH, render_field_map_doc(pack))
    write_text(ACCESS_MATRIX_DOC_PATH, render_access_matrix_doc(pack))
    write_text(HAZARD_DOC_PATH, render_hazard_doc(pack))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(pack))
    write_text(SERVICE_README_PATH, render_service_readme(pack))
    write_text(APP_README_PATH, render_app_readme(pack))
    write_text(
        APP_PACK_TS_PATH,
        "export const pdsAccessPack = "
        + json_for_js(pack)
        + " as const;\n",
    )
    write_json(APP_PACK_JSON_PATH, pack)


def main() -> None:
    payload = load_required_inputs()
    pack = build_pack(payload)
    write_pack_artifacts(pack)
    print(
        f"Built {TASK_ID}: {pack['summary']['access_row_count']} access rows, "
        f"{pack['summary']['feature_flag_count']} flags, "
        f"{pack['summary']['field_count']} onboarding fields, "
        f"{pack['summary']['hazard_artifact_count']} hazard/risk artifacts."
    )


if __name__ == "__main__":
    main()
