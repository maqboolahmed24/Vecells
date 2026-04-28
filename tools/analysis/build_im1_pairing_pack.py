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
APP_DIR = ROOT / "apps" / "mock-im1-pairing-studio"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

PACK_JSON_PATH = DATA_DIR / "im1_pairing_pack.json"
STAGE_MATRIX_PATH = DATA_DIR / "im1_pairing_stage_matrix.csv"
FIELD_MAP_PATH = DATA_DIR / "im1_prerequisites_field_map.json"
SCAL_MATRIX_PATH = DATA_DIR / "im1_scal_artifact_matrix.csv"
PROVIDER_REGISTER_PATH = DATA_DIR / "im1_provider_supplier_register.json"
LIVE_GATE_PATH = DATA_DIR / "im1_live_gate_checklist.json"

REHEARSAL_DOC_PATH = DOCS_DIR / "26_im1_pairing_rehearsal_strategy.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "26_im1_pairing_prerequisites_field_map.md"
SCAL_DOC_PATH = DOCS_DIR / "26_im1_scal_artifact_matrix.md"
PROVIDER_DOC_PATH = DOCS_DIR / "26_im1_provider_supplier_and_licence_register.md"
RFC_DOC_PATH = DOCS_DIR / "26_im1_change_control_and_rfc_strategy.md"

README_PATH = APP_DIR / "README.md"
APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "im1PairingPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "im1-pairing-pack.json"

TASK_ID = "seq_026"
VISUAL_MODE = "Interface_Proof_Atelier"
MISSION = (
    "Create the IM1 Pairing execution pack with two explicit parts: a rehearsal-grade IM1 "
    "pairing control tower now, and a gated prerequisites, SCAL, supplier, licence, and RFC "
    "strategy for later real provider execution."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "gateway_surface_split_matrix": DATA_DIR / "gateway_surface_split_matrix.csv",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
}

SOURCE_PRECEDENCE = [
    "prompt/026.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-8-the-assistive-layer.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/23_secret_ownership_and_rotation_model.md",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "docs/external/25_nhs_login_environment_profile_pack.md",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
    "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form",
    "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
    "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_im1_pairing_process",
        "title": "IM1 Pairing integration",
        "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
        "captured_on": "2026-04-09",
        "summary": (
            "Defines the IM1 initiation, unsupported test, supported test, assurance, live, "
            "and RFC process. It also names the current provider suppliers as Optum (EMISWeb) "
            "and TPP (SystmOne)."
        ),
        "grounding": [
            "Suppliers complete the IM1 Clinical and Information Governance prerequisites form first.",
            "Stage one SCAL is issued when prerequisites are confirmed and compatibility is assessed.",
            "Model Interface Licence execution precedes access to provider supplier mock APIs.",
            "Supported Test Environment access requires a fully completed SCAL.",
            "Recommended to Connect, Plan to Connect, and live rollout follow assurance acceptance.",
            "RFC is required where the product evolves from its originally assured IM1 use case, especially with AI or other significant enhancements.",
        ],
    },
    {
        "source_id": "official_im1_prerequisites_form",
        "title": "IM1 prerequisites form",
        "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form",
        "captured_on": "2026-04-09",
        "summary": (
            "Publishes the exact public prerequisite form structure covering supplier identity, "
            "clinical safety declarations, information-governance commitments, and provider "
            "supplier selection."
        ),
        "grounding": [
            "All fields are mandatory.",
            "Clinical safety prerequisites must already be in place at the time of initial SCAL submission and reflected in the SCAL.",
            "Information governance prerequisites are commitments that must be in place by go live.",
            "The public provider supplier options are EMIS (EMIS Web) and TPP (SystmOne).",
        ],
    },
    {
        "source_id": "official_scal_process",
        "title": "Supplier Conformance Assessment List (SCAL)",
        "url": "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
        "captured_on": "2026-04-09",
        "summary": (
            "SCAL is a document-based assurance process for NHS services. Each SCAL has supplier "
            "and product information plus one or more service-specific tabs."
        ),
        "grounding": [
            "SCAL captures declarations and evidence across technical conformance, clinical safety, information governance and security, and organisational and business process risks.",
            "You complete one SCAL for each individual product.",
            "The supplier and product information tab exists even when multiple services are involved.",
        ],
    },
    {
        "source_id": "official_im1_api_standards",
        "title": "Interface Mechanism 1 API standards",
        "url": "https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards",
        "captured_on": "2026-04-09",
        "summary": (
            "Explains that IM1 pairing is supplier specific, technical specifications become "
            "available after feasibility assessment, and some appointments data may only be "
            "available via GP Connect per supplier PIP."
        ),
        "grounding": [
            "Consumers pair with the specific API for each GP practice system supplier.",
            "Technical specifications and PIPs are available after supplier feasibility assessment.",
            "Appointments access may vary by supplier and can require supplier PIPs rather than generic assumptions.",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS",
        "summary": (
            "The public IM1 pages do not enumerate every stage-one SCAL column, so the derived "
            "SCAL input fields below model the minimum product, capability, evidence, and safety "
            "inputs Vecells must already have ready before submission."
        ),
        "consequence": "The pack distinguishes exact public prerequisites-form fields from derived stage-one SCAL dossier fields.",
    },
    {
        "assumption_id": "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY",
        "summary": (
            "Provider-supplier legal names, consumer legal names, and named signatories are not "
            "yet approved for repo storage. The licence register therefore carries role-owned "
            "placeholder slots only."
        ),
        "consequence": "The rehearsal studio tracks licence readiness without storing secrets or real legal details.",
    },
    {
        "assumption_id": "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED",
        "summary": (
            "Phase 0 remains withheld and the current-baseline external-readiness chain is not yet "
            "cleared. Real IM1 submission therefore stays fail-closed in this pack."
        ),
        "consequence": "Actual-provider mode shows blocker truth and dry-run preparation only.",
    },
]

ROUTE_FAMILY_SELECTION = {
    "rf_intake_self_service": "Public intake remains independent of IM1 so the product never makes pairing a hidden baseline gate.",
    "rf_patient_secure_link_recovery": "Grant-scoped recovery must survive without IM1-backed writable authority.",
    "rf_patient_home": "Authenticated home remains NHS-login-governed, not IM1-governed.",
    "rf_patient_requests": "Request tracking and more-info reply stay decoupled from IM1 pairing.",
    "rf_patient_appointments": "Patient-facing local booking is the primary IM1-sensitive route family.",
    "rf_staff_workspace": "Operational booking work can review IM1 state but may not flatten supplier truth into canonical success.",
}

GATEWAY_SURFACE_SELECTION = {
    "gws_patient_intake_web",
    "gws_patient_secure_link_recovery",
    "gws_patient_home",
    "gws_patient_requests",
    "gws_patient_appointments",
    "gws_clinician_workspace",
    "gws_practice_ops_workspace",
}

TARGET_RISK_IDS = {
    "RISK_EXT_IM1_SCAL_DELAY",
    "RISK_EXT_BOOKING_PROVIDER_GAP",
    "RISK_MUTATION_003",
    "RISK_RUNTIME_001",
    "HZ_WRONG_PATIENT_BINDING",
}


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
    return json.dumps(payload, indent=2).replace("</", "<\\/")


def as_cell(items: list[str]) -> str:
    return "<br>".join(items)


def md_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    header = "| " + " | ".join(label for _, label in columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = []
    for row in rows:
        body.append(
            "| "
            + " | ".join(str(row[key]).replace("\n", "<br>") for key, _ in columns)
            + " |"
        )
    return "\n".join([header, divider, *body])


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_026 prerequisites: " + ", ".join(sorted(missing)))

    inputs: dict[str, Any] = {}
    for name, path in REQUIRED_INPUTS.items():
        if path.suffix == ".csv":
            inputs[name] = load_csv(path)
        else:
            inputs[name] = load_json(path)

    phase0_verdict = inputs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"]
    assert_true(phase0_verdict == "withheld", "seq_026 expects Phase 0 verdict to remain withheld")
    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream",
    )
    return inputs


def select_routes(route_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    selected = [row for row in route_rows if row["route_family_id"] in ROUTE_FAMILY_SELECTION]
    assert_true(len(selected) == len(ROUTE_FAMILY_SELECTION), "Route-family prerequisites drifted")
    return selected


def select_gateway_rows(gateway_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    selected = [row for row in gateway_rows if row["gateway_surface_id"] in GATEWAY_SURFACE_SELECTION]
    assert_true(len(selected) == len(GATEWAY_SURFACE_SELECTION), "Gateway surface prerequisites drifted")
    return selected


def risk_catalog(master_risk_register: dict[str, Any]) -> dict[str, dict[str, Any]]:
    risks = {
        row["risk_id"]: row
        for row in master_risk_register["risks"]
        if row["risk_id"] in TARGET_RISK_IDS
    }
    assert_true(risks.keys() == TARGET_RISK_IDS, "IM1 risk catalog drifted")
    return risks


def build_fields() -> list[dict[str, Any]]:
    fields: list[dict[str, Any]] = [
        {
            "field_id": "fld_contact_name",
            "section": "Exact public prerequisites form",
            "label": "Name",
            "field_type": "text",
            "origin_class": "exact_public_form",
            "mock_value": "Vecells interoperability lead",
            "actual_placeholder": "Named form submitter full name.",
            "required_for": ["product_profile_defined", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_contact_email",
            "section": "Exact public prerequisites form",
            "label": "Email",
            "field_type": "email",
            "origin_class": "exact_public_form",
            "mock_value": "interoperability@vecells.example",
            "actual_placeholder": "Named form submitter email address.",
            "required_for": ["product_profile_defined", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_organisation_name",
            "section": "Exact public prerequisites form",
            "label": "Organisation name",
            "field_type": "text",
            "origin_class": "exact_public_form",
            "mock_value": "Vecells Ltd",
            "actual_placeholder": "Consumer supplier legal entity name approved for submission.",
            "required_for": ["product_profile_defined", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_product_name",
            "section": "Exact public prerequisites form",
            "label": "Product name",
            "field_type": "text",
            "origin_class": "exact_public_form",
            "mock_value": "Vecells",
            "actual_placeholder": "Named IM1 product or system name exactly as submitted.",
            "required_for": ["product_profile_defined", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_cso_confirmed",
            "section": "Clinical safety prerequisites",
            "label": "Qualified Clinical Safety Officer in place",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the named CSO appointment exists and is current.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_use_case_description_confirmed",
            "section": "Clinical safety prerequisites",
            "label": "Detailed use case description covering the whole product",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the bounded IM1 use case dossier exists and matches the full product scope.",
            "required_for": ["product_profile_defined", "prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_clinical_safety_process_confirmed",
            "section": "Clinical safety prerequisites",
            "label": "Written clinical safety process and uplift commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the current clinical safety process and uplift cadence exist.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_hazard_log_commitment_confirmed",
            "section": "Clinical safety prerequisites",
            "label": "Hazard log capability and uplift commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the hazard log template is active and reviewable.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_samd_scrutiny_confirmed",
            "section": "Clinical safety prerequisites",
            "label": "SaMD additional scrutiny understood where applicable",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when medical-device posture has been reviewed against the IM1 use case.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted", "official_rfc_submitted_for_significant_change"],
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
        },
        {
            "field_id": "fld_dspt_commitment_confirmed",
            "section": "Information governance prerequisites",
            "label": "DSPT annual assessment commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the DSPT ownership and timeline are named.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_dpia_commitment_confirmed",
            "section": "Information governance prerequisites",
            "label": "DPIA and transparency notice commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when DPIA scope, privacy notice, and application/service coverage are current.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted", "assurance_pack_in_progress"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_isms_commitment_confirmed",
            "section": "Information governance prerequisites",
            "label": "ISMS / ISO 27001 commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the ISMS owner and control posture are named.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_pen_test_commitment_confirmed",
            "section": "Information governance prerequisites",
            "label": "CHECK / CREST penetration-test commitment",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when penetration-test planning, cadence, and evidence sink are named.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted", "assurance_pack_in_progress"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_uk_processing_confirmed",
            "section": "Information governance prerequisites",
            "label": "UK location for patient-data processing",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when the UK processing statement and residency posture are current.",
            "required_for": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form"],
        },
        {
            "field_id": "fld_supplier_emis_selected",
            "section": "Provider suppliers",
            "label": "Integrate with EMIS (EMIS Web)",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when EMIS remains in the current official provider-supplier roster and the route-family matrix supports it.",
            "required_for": ["provider_supplier_targeting_ready", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
        },
        {
            "field_id": "fld_supplier_tpp_selected",
            "section": "Provider suppliers",
            "label": "Integrate with TPP (SystmOne)",
            "field_type": "yes_no",
            "origin_class": "exact_public_form",
            "mock_value": "yes",
            "actual_placeholder": "Yes only when TPP remains in the current official provider-supplier roster and the route-family matrix supports it.",
            "required_for": ["provider_supplier_targeting_ready", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
        },
        {
            "field_id": "fld_bounded_im1_use_case",
            "section": "Derived stage-one SCAL dossier",
            "label": "Bounded IM1 use case narrative",
            "field_type": "textarea",
            "origin_class": "derived_scal_input",
            "mock_value": "Local booking capability rehearsal for supplier-specific appointment access while keeping identity and request continuity independent of IM1.",
            "actual_placeholder": "Bounded IM1 scope statement that excludes Phase 2 identity shortcuts and names the exact patient and staff booking surfaces.",
            "required_for": ["stage_one_scal_stub_ready", "official_stage_one_scal_issued"],
            "source_refs": ["official_im1_pairing_process", "official_scal_process", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
        },
        {
            "field_id": "fld_capability_matrix_digest",
            "section": "Derived stage-one SCAL dossier",
            "label": "ProviderCapabilityMatrix digest",
            "field_type": "text",
            "origin_class": "derived_scal_input",
            "mock_value": "PCM-SEQ026-DIGEST-001",
            "actual_placeholder": "Published provider capability matrix hash or immutable reference for the submitted scope.",
            "required_for": ["stage_one_scal_stub_ready", "provider_supplier_targeting_ready", "compatibility_claim_ready"],
            "source_refs": ["official_scal_process", "phase-0-the-foundation-protocol.md#1.13A ProviderCapabilityMatrix", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
        },
        {
            "field_id": "fld_route_family_matrix_digest",
            "section": "Derived stage-one SCAL dossier",
            "label": "Route-family compatibility digest",
            "field_type": "text",
            "origin_class": "derived_scal_input",
            "mock_value": "RFCOMP-SEQ026-001",
            "actual_placeholder": "Immutable reference for the submitted route-family-to-supplier compatibility matrix.",
            "required_for": ["provider_supplier_targeting_ready", "compatibility_claim_ready"],
            "source_refs": ["official_im1_api_standards", "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
        },
        {
            "field_id": "fld_booking_truth_guardrails",
            "section": "Derived stage-one SCAL dossier",
            "label": "Booking truth and ambiguity guardrails",
            "field_type": "textarea",
            "origin_class": "derived_scal_input",
            "mock_value": "Queue acceptance, supplier processing, or mock-API access never imply booked truth; only authoritative confirmation proof may do that.",
            "actual_placeholder": "Submission-ready statement showing how supplier truth, ambiguity, and fallback remain separate from canonical booking state.",
            "required_for": ["compatibility_claim_ready", "provider_mock_api_rehearsal_ready"],
            "source_refs": ["official_im1_pairing_process", "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation", "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"],
        },
        {
            "field_id": "fld_architecture_artifact_set",
            "section": "Derived stage-one SCAL dossier",
            "label": "Current architecture and data-flow artifact set",
            "field_type": "textarea",
            "origin_class": "derived_scal_input",
            "mock_value": "Architecture ADR pack, runtime topology, data classification pack, and backend/frontend baseline references current on 2026-04-09.",
            "actual_placeholder": "Exact architecture, data-flow, and runtime artifact references attached to the IM1 submission pack.",
            "required_for": ["stage_one_scal_stub_ready", "assurance_pack_in_progress", "ready_for_real_im1_submission"],
            "source_refs": ["official_scal_process", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
        },
        {
            "field_id": "fld_named_sponsor_placeholder",
            "section": "Derived live-gate dossier",
            "label": "Named sponsor / commercial owner posture",
            "field_type": "textarea",
            "origin_class": "derived_live_gate",
            "mock_value": "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED: sponsor and commercial owner placeholders only.",
            "actual_placeholder": "Named sponsor, commercial owner, and contact chain approved for real submission.",
            "required_for": ["ready_for_real_im1_submission", "official_prerequisites_form_submitted"],
            "source_refs": ["official_im1_pairing_process", "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"],
        },
        {
            "field_id": "fld_named_approver_placeholder",
            "section": "Derived live-gate dossier",
            "label": "Named approver",
            "field_type": "text",
            "origin_class": "derived_live_gate",
            "mock_value": "BLOCKED_UNTIL_REAL_APPROVER",
            "actual_placeholder": "Named approver required for any real submission or portal mutation.",
            "required_for": ["ready_for_real_im1_submission", "official_prerequisites_form_submitted"],
            "source_refs": ["prompt/026.md", "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"],
        },
        {
            "field_id": "fld_environment_target_placeholder",
            "section": "Derived live-gate dossier",
            "label": "Environment target",
            "field_type": "text",
            "origin_class": "derived_live_gate",
            "mock_value": "supported_test",
            "actual_placeholder": "Named target such as initiation, unsupported test, supported test, or assurance evidence refresh.",
            "required_for": ["ready_for_real_im1_submission", "official_supported_test_environment_requested"],
            "source_refs": ["official_im1_pairing_process", "prompt/026.md"],
        },
        {
            "field_id": "fld_rfc_change_class_digest",
            "section": "Derived RFC watch dossier",
            "label": "RFC change-class digest",
            "field_type": "textarea",
            "origin_class": "derived_live_gate",
            "mock_value": "AI expansion, new route families, wider booking mutations, new suppliers, or significant medical-device changes require updated SCAL and documentation.",
            "actual_placeholder": "Current change-class summary tied to the latest assured IM1 scope and RFC pack.",
            "required_for": ["rfc_watch_registered", "official_rfc_submitted_for_significant_change"],
            "source_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md"],
        },
    ]
    return fields


def build_artifacts() -> list[dict[str, Any]]:
    return [
        {
            "artifact_id": "ART_PRODUCT_PROFILE_DOSSIER",
            "artifact_name": "Product profile dossier",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["product_profile_defined", "official_prerequisites_form_submitted"],
            "mock_status": "ready",
            "actual_status": "placeholder_only",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "source_refs": ["prompt/026.md", "official_im1_prerequisites_form"],
            "notes": "Names the bounded Vecells IM1 use case and explicitly excludes Phase 2 identity shortcuts.",
        },
        {
            "artifact_id": "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
            "artifact_name": "ProviderCapabilityMatrix digest",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["stage_one_scal_stub_ready", "provider_supplier_targeting_ready", "compatibility_claim_ready"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
            "source_refs": ["phase-0-the-foundation-protocol.md#1.13A ProviderCapabilityMatrix", "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam"],
            "notes": "Every IM1 submission claim must bind back to the capability matrix rather than prose promises.",
        },
        {
            "artifact_id": "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
            "artifact_name": "Route-family compatibility matrix",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["provider_supplier_targeting_ready", "compatibility_claim_ready"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam", "official_im1_api_standards"],
            "notes": "Shows which route families remain IM1-independent and which booking surfaces need supplier-specific pairing evidence.",
        },
        {
            "artifact_id": "ART_STAGE_ONE_SCAL_STUB",
            "artifact_name": "Stage-one SCAL stub",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["stage_one_scal_stub_ready", "official_stage_one_scal_issued"],
            "mock_status": "ready",
            "actual_status": "blocked_until_live_gate",
            "freshness_posture": "attention",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["official_im1_pairing_process", "official_scal_process", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
            "notes": "Built from the bounded product dossier plus supplier/product/service-specific tabs.",
        },
        {
            "artifact_id": "ART_CLINICAL_SAFETY_DECLARATION",
            "artifact_name": "Clinical safety prerequisites declaration",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["prerequisites_drafted", "official_prerequisites_form_submitted"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "source_refs": ["official_im1_prerequisites_form", "official_scal_process"],
            "notes": "Captures the public prerequisite confirmations that must already be true at initial SCAL submission time.",
        },
        {
            "artifact_id": "ART_HAZARD_LOG",
            "artifact_name": "Hazard log and safety-case digest",
            "artifact_group": "assurance",
            "required_for_stage_ids": ["prerequisites_drafted", "assurance_pack_in_progress", "official_assurance_completed", "official_rfc_submitted_for_significant_change"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "attention",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
            "notes": "AI or major functional expansion reopens this pack and must not piggyback on stale approval.",
        },
        {
            "artifact_id": "ART_DPIA_AND_PRIVACY_NOTICE",
            "artifact_name": "DPIA and privacy-notice digest",
            "artifact_group": "assurance",
            "required_for_stage_ids": ["prerequisites_drafted", "assurance_pack_in_progress", "official_assurance_completed"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "attention",
            "owner_role": "ROLE_DPO",
            "source_refs": ["official_im1_prerequisites_form", "official_scal_process"],
            "notes": "Must stay current with the exact IM1 use case and supplier data-flow posture.",
        },
        {
            "artifact_id": "ART_DSPT_ISMS_PEN_TEST_PLAN",
            "artifact_name": "DSPT / ISMS / pen-test plan",
            "artifact_group": "assurance",
            "required_for_stage_ids": ["prerequisites_drafted", "assurance_pack_in_progress", "official_assurance_completed"],
            "mock_status": "ready",
            "actual_status": "ready_for_refresh",
            "freshness_posture": "attention",
            "owner_role": "ROLE_SECURITY_LEAD",
            "source_refs": ["official_im1_prerequisites_form", "official_scal_process"],
            "notes": "A governance artifact, not a hidden side-note to the pairing form.",
        },
        {
            "artifact_id": "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS",
            "artifact_name": "Model Interface Licence placeholder register",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["model_interface_licence_placeholder_ready", "official_model_interface_licence_executed"],
            "mock_status": "ready",
            "actual_status": "placeholder_only",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["official_im1_pairing_process", "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY"],
            "notes": "Tracks licence readiness without storing real legal names or signatory details in the repo.",
        },
        {
            "artifact_id": "ART_PROVIDER_MOCK_API_REHEARSAL_LOG",
            "artifact_name": "Provider mock-API rehearsal log",
            "artifact_group": "unsupported_test",
            "required_for_stage_ids": ["provider_mock_api_rehearsal_ready", "official_provider_mock_api_accessed"],
            "mock_status": "ready",
            "actual_status": "blocked_until_live_gate",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
            "source_refs": ["official_im1_pairing_process", "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"],
            "notes": "Must preserve unsupported-test truth without claiming live admissibility or canonical booking success.",
        },
        {
            "artifact_id": "ART_PAIRING_INTEGRATION_PACK_REGISTER",
            "artifact_name": "Pairing and Integration Pack register",
            "artifact_group": "unsupported_test",
            "required_for_stage_ids": ["provider_mock_api_rehearsal_ready", "official_supported_test_environment_requested"],
            "mock_status": "ready",
            "actual_status": "blocked_until_supplier_access",
            "freshness_posture": "attention",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["official_im1_pairing_process", "official_im1_api_standards"],
            "notes": "Captures the supplier-specific documentation bundle required for unsupported test work.",
        },
        {
            "artifact_id": "ART_SUPPORTED_TEST_REQUEST_CHECKLIST",
            "artifact_name": "Supported Test Environment request checklist",
            "artifact_group": "supported_test",
            "required_for_stage_ids": ["supported_test_readiness_blocked", "official_supported_test_environment_requested", "official_supported_test_environment_granted"],
            "mock_status": "blocked",
            "actual_status": "blocked_until_live_gate",
            "freshness_posture": "blocked",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["official_im1_pairing_process"],
            "notes": "Cannot progress until the full SCAL, named sponsor, and provider-specific evidence are current.",
        },
        {
            "artifact_id": "ART_ASSURANCE_EVIDENCE_INDEX",
            "artifact_name": "Assurance evidence index",
            "artifact_group": "assurance",
            "required_for_stage_ids": ["assurance_pack_in_progress", "official_assurance_completed"],
            "mock_status": "in_progress",
            "actual_status": "blocked_until_live_gate",
            "freshness_posture": "attention",
            "owner_role": "ROLE_GOVERNANCE_LEAD",
            "source_refs": ["official_im1_pairing_process", "official_scal_process"],
            "notes": "Carries the evidence sequence for test proof, witness tests, and assurance acceptance.",
        },
        {
            "artifact_id": "ART_RFC_TRIGGER_REGISTER",
            "artifact_name": "RFC trigger register",
            "artifact_group": "rfc_watch",
            "required_for_stage_ids": ["rfc_watch_registered", "official_rfc_submitted_for_significant_change"],
            "mock_status": "ready",
            "actual_status": "ready",
            "freshness_posture": "fresh",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "source_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md"],
            "notes": "Explicitly fences AI and other major feature changes so stale IM1 posture cannot be silently reused.",
        },
        {
            "artifact_id": "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
            "artifact_name": "Provider roster refresh evidence",
            "artifact_group": "initiation",
            "required_for_stage_ids": ["provider_supplier_targeting_ready", "ready_for_real_im1_submission"],
            "mock_status": "ready",
            "actual_status": "runtime_fetch_required",
            "freshness_posture": "attention",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "source_refs": ["official_im1_pairing_process"],
            "notes": "The actual-later workflow must fetch the current public roster at runtime instead of hard-coding stale supplier assumptions.",
        },
    ]


def build_stage_rows() -> list[dict[str, Any]]:
    return [
        {
            "stage_id": "product_profile_defined",
            "stage_name": "Product profile defined",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "Bound the IM1 use case to booking-capability work only.",
                "Record that NHS login and patient continuity remain admissible without IM1.",
            ],
            "required_artifacts": ["ART_PRODUCT_PROFILE_DOSSIER"],
            "manual_checkpoints": ["Architect and interoperability lead agree the IM1 scope stays bounded."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Capture the internal product profile and IM1 disclaimers inside the rehearsal studio.",
            "actual_later_action": "Use the same bounded profile as the basis of later prerequisites-form preparation.",
            "outputs": ["Bounded IM1 use-case summary", "Stage unlock for prerequisites drafting"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "HZ_WRONG_PATIENT_BINDING"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "HZ_WRONG_PATIENT_BINDING"],
            "notes": "This is where the pack closes the critical-path contradiction: IM1 is prepared early but remains non-authoritative for Phase 2 identity.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase", "prompt/026.md"],
            "prerequisite_stage_ids": [],
            "live_gate_refs": [],
        },
        {
            "stage_id": "prerequisites_drafted",
            "stage_name": "Prerequisites drafted",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "The exact public prerequisites-form fields are mapped.",
                "Clinical safety and IG prerequisites are linked to current Vecells artifacts.",
            ],
            "required_artifacts": [
                "ART_CLINICAL_SAFETY_DECLARATION",
                "ART_HAZARD_LOG",
                "ART_DPIA_AND_PRIVACY_NOTICE",
                "ART_DSPT_ISMS_PEN_TEST_PLAN",
            ],
            "manual_checkpoints": ["Clinical safety, privacy, and security owners confirm placeholder posture is current."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Fill the rehearsal dossier from the exact public field map and show blockers where the product still carries placeholders.",
            "actual_later_action": "Use the same field map as the browser-automation dry-run profile before any real form interaction.",
            "outputs": ["Complete prerequisites field map", "Draft readiness notes per field"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_RUNTIME_001"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_RUNTIME_001"],
            "notes": "The rehearsal twin must show exact public prerequisites truth, not a simplified narrative checklist.",
            "source_refs": ["official_im1_prerequisites_form", "official_scal_process"],
            "prerequisite_stage_ids": ["product_profile_defined"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "stage_one_scal_stub_ready",
            "stage_name": "Stage-one SCAL stub ready",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "A supplier/product/service dossier exists for stage-one SCAL preparation.",
                "Capability, route-family, and architecture digests are current.",
            ],
            "required_artifacts": [
                "ART_STAGE_ONE_SCAL_STUB",
                "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
                "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
                "ART_PRODUCT_PROFILE_DOSSIER",
            ],
            "manual_checkpoints": ["Interoperability lead confirms the stage-one stub stays aligned to the bounded use case."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Generate the internal stage-one SCAL skeleton and link every claim back to a Vecells artifact.",
            "actual_later_action": "Freeze the dossier so a future form run can populate product information without reinterpreting the architecture.",
            "outputs": ["Stage-one SCAL stub", "Artifact traceability map"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_RUNTIME_001"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_RUNTIME_001"],
            "notes": "The public IM1 page names stage-one SCAL but not every field, so the stub stays explicit about what is derived.",
            "source_refs": ["official_im1_pairing_process", "official_scal_process", "ASSUMPTION_IM1_STAGE_ONE_SCAL_FIELDS"],
            "prerequisite_stage_ids": ["prerequisites_drafted"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "provider_supplier_targeting_ready",
            "stage_name": "Provider supplier targeting ready",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "The current public provider roster has a fetch-at-runtime source.",
                "Each targeted route family has supplier-specific compatibility notes.",
            ],
            "required_artifacts": [
                "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
                "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
                "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
            ],
            "manual_checkpoints": ["Interoperability lead confirms the target suppliers still match the current public roster."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Select providers in the rehearsal matrix and capture route-family compatibility notes.",
            "actual_later_action": "Fetch the current roster at runtime before any real portal preparation and block if the official roster no longer matches the pack.",
            "outputs": ["Provider-targeting matrix", "Runtime roster refresh rule"],
            "safety_and_privacy_dependencies": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "This stage exists specifically to stop provider paperwork drifting away from actual supplier capability evidence.",
            "source_refs": ["official_im1_pairing_process", "official_im1_prerequisites_form", "official_im1_api_standards"],
            "prerequisite_stage_ids": ["stage_one_scal_stub_ready"],
            "live_gate_refs": ["LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED"],
        },
        {
            "stage_id": "compatibility_claim_ready",
            "stage_name": "Compatibility claim ready",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "Compatibility claims are tied to ProviderCapabilityMatrix and BookingProviderAdapterBinding evidence.",
                "The booking truth guardrail statement is current.",
            ],
            "required_artifacts": [
                "ART_PROVIDER_CAPABILITY_MATRIX_DIGEST",
                "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX",
                "ART_STAGE_ONE_SCAL_STUB",
            ],
            "manual_checkpoints": ["Booking domain lead signs off that compatibility does not overclaim booked truth or live reach."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Render route-family compatibility claims and explicit unsupported states in the control tower.",
            "actual_later_action": "Carry the same claims into later supplier conversations and reject any step that asks for broader capability than the matrix allows.",
            "outputs": ["Compatibility claim digest", "Supplier-specific caveat notes"],
            "safety_and_privacy_dependencies": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_MUTATION_003"],
            "risk_refs": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_MUTATION_003"],
            "notes": "Compatibility readiness is not the same as live approval or technical acceptance.",
            "source_refs": ["official_im1_pairing_process", "phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding"],
            "prerequisite_stage_ids": ["provider_supplier_targeting_ready"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "model_interface_licence_placeholder_ready",
            "stage_name": "Model Interface Licence placeholder ready",
            "stage_group": "initiation",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "Provider-specific licence slots exist for each targeted supplier.",
                "Named signatory placeholders are tracked by role instead of repo fixture.",
            ],
            "required_artifacts": ["ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"],
            "manual_checkpoints": ["Commercial and governance leads confirm placeholder-only posture."],
            "browser_automation_possible": "no",
            "mock_now_action": "Track licence readiness and signatory placeholders without storing real legal or signing details.",
            "actual_later_action": "Populate the real licence pack only after named sponsor, commercial owner, and approver details exist outside the repo.",
            "outputs": ["Licence placeholder register", "Role-owned signatory slots"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "Licence readiness exists early, but licence execution remains a later human-governed checkpoint.",
            "source_refs": ["official_im1_pairing_process", "ASSUMPTION_IM1_LICENCE_SIGNATORIES_PLACEHOLDER_ONLY"],
            "prerequisite_stage_ids": ["compatibility_claim_ready"],
            "live_gate_refs": ["LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER", "LIVE_GATE_NAMED_APPROVER_PRESENT"],
        },
        {
            "stage_id": "provider_mock_api_rehearsal_ready",
            "stage_name": "Provider mock API rehearsal ready",
            "stage_group": "unsupported_test",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "The unsupported-test simulator preserves supplier truth, ambiguity, and fallback semantics.",
                "PIP placeholder registry and provider mock-API rehearsal log are current.",
            ],
            "required_artifacts": [
                "ART_PROVIDER_MOCK_API_REHEARSAL_LOG",
                "ART_PAIRING_INTEGRATION_PACK_REGISTER",
            ],
            "manual_checkpoints": ["Booking domain lead confirms the simulator is stricter than a typical happy-path vendor stub."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Exercise unsupported-test behavior entirely inside the rehearsal studio and local simulators.",
            "actual_later_action": "Use the same capability and artifact model when real provider mock-API access is later granted.",
            "outputs": ["Unsupported-test rehearsal evidence", "PIP placeholder list"],
            "safety_and_privacy_dependencies": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_RUNTIME_001"],
            "risk_refs": ["RISK_EXT_BOOKING_PROVIDER_GAP", "RISK_RUNTIME_001"],
            "notes": "Access to a provider mock API is never treated as live or authoritative booking truth.",
            "source_refs": ["official_im1_pairing_process", "official_im1_api_standards"],
            "prerequisite_stage_ids": ["model_interface_licence_placeholder_ready"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "supported_test_readiness_blocked",
            "stage_name": "Supported-test readiness blocked",
            "stage_group": "supported_test",
            "stage_class": "blocked_until_mvp",
            "entry_conditions": [
                "The full SCAL is complete.",
                "Named sponsor, commercial owner, approver, and environment target are present.",
                "Provider-specific evidence and assurance freshness are current.",
            ],
            "required_artifacts": [
                "ART_SUPPORTED_TEST_REQUEST_CHECKLIST",
                "ART_ASSURANCE_EVIDENCE_INDEX",
            ],
            "manual_checkpoints": ["Human review confirms the supported-test request is admissible."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Show the blocked state explicitly with machine-readable blocker chips.",
            "actual_later_action": "Request Supported Test Environment access only after the live-gate pack turns green.",
            "outputs": ["Supported-test blocker digest", "Live-gate dependency list"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_BOOKING_PROVIDER_GAP", "HZ_WRONG_PATIENT_BINDING"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_BOOKING_PROVIDER_GAP", "HZ_WRONG_PATIENT_BINDING"],
            "notes": "The pack intentionally keeps this blocked today so the studio cannot be mistaken for approval.",
            "source_refs": ["official_im1_pairing_process", "prompt/026.md"],
            "prerequisite_stage_ids": ["provider_mock_api_rehearsal_ready"],
            "live_gate_refs": [
                "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
                "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
                "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
                "LIVE_GATE_NAMED_APPROVER_PRESENT",
                "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            ],
        },
        {
            "stage_id": "assurance_pack_in_progress",
            "stage_name": "Assurance pack in progress",
            "stage_group": "assurance",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "The assurance evidence index exists.",
                "Safety, privacy, architecture, and runtime artifacts are linked into the IM1 pack.",
            ],
            "required_artifacts": [
                "ART_ASSURANCE_EVIDENCE_INDEX",
                "ART_HAZARD_LOG",
                "ART_DPIA_AND_PRIVACY_NOTICE",
                "ART_DSPT_ISMS_PEN_TEST_PLAN",
            ],
            "manual_checkpoints": ["Governance lead confirms freshness posture and missing evidence list."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Track evidence freshness and blocker counts in the control tower header and inspector.",
            "actual_later_action": "Use the same evidence ordering when the later SCAL and assurance review run begins.",
            "outputs": ["Assurance evidence freshness index", "Evidence-gap list"],
            "safety_and_privacy_dependencies": ["RISK_RUNTIME_001", "RISK_MUTATION_003"],
            "risk_refs": ["RISK_RUNTIME_001", "RISK_MUTATION_003"],
            "notes": "Assurance is represented as an explicit workstream, not a hidden endnote after technical pairing.",
            "source_refs": ["official_im1_pairing_process", "official_scal_process"],
            "prerequisite_stage_ids": ["stage_one_scal_stub_ready"],
            "live_gate_refs": ["LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT"],
        },
        {
            "stage_id": "rfc_watch_registered",
            "stage_name": "RFC watch registered",
            "stage_group": "rfc_watch",
            "stage_class": "internal_rehearsal",
            "entry_conditions": [
                "AI, major function, supplier, route-family, and medical-device change classes are named.",
                "Each class maps to an updated SCAL and documentation expectation.",
            ],
            "required_artifacts": ["ART_RFC_TRIGGER_REGISTER"],
            "manual_checkpoints": ["Programme architect confirms the watch register stays aligned with Phase 8 and later scope changes."],
            "browser_automation_possible": "yes",
            "mock_now_action": "Track RFC trigger classes in the rehearsal studio and make them visible in the licence watch view.",
            "actual_later_action": "Use the same trigger register when product scope evolves after assurance or live rollout.",
            "outputs": ["RFC trigger register", "AI and major-change watchpoints"],
            "safety_and_privacy_dependencies": ["RISK_MUTATION_003"],
            "risk_refs": ["RISK_MUTATION_003"],
            "notes": "This closes the gap where assistive or AI expansion might otherwise ride through stale IM1 paperwork.",
            "source_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md"],
            "prerequisite_stage_ids": ["product_profile_defined"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "ready_for_real_im1_submission",
            "stage_name": "Ready for real IM1 submission",
            "stage_group": "live",
            "stage_class": "blocked_until_mvp",
            "entry_conditions": [
                "All rehearsal dossier stages are complete.",
                "Every live gate is pass.",
                "ALLOW_REAL_PROVIDER_MUTATION=true is explicitly set.",
            ],
            "required_artifacts": [
                "ART_STAGE_ONE_SCAL_STUB",
                "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
                "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS",
                "ART_ASSURANCE_EVIDENCE_INDEX",
            ],
            "manual_checkpoints": ["Named approver explicitly authorises real submission against a current environment target."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Stay fail-closed and show why the product is not yet admissible for real submission.",
            "actual_later_action": "Open the later dry-run harness only after the gates pass and an approver confirms mutation.",
            "outputs": ["Final live-gate verdict", "Dry-run manifest"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003", "HZ_WRONG_PATIENT_BINDING"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003", "HZ_WRONG_PATIENT_BINDING"],
            "notes": "Current state is intentionally blocked because Phase 0 and external-readiness gates are still withheld.",
            "source_refs": ["prompt/026.md", "official_im1_pairing_process", "data/analysis/phase0_gate_verdict.json#GATE_P0_FOUNDATION_ENTRY"],
            "prerequisite_stage_ids": [
                "product_profile_defined",
                "prerequisites_drafted",
                "stage_one_scal_stub_ready",
                "provider_supplier_targeting_ready",
                "compatibility_claim_ready",
                "model_interface_licence_placeholder_ready",
                "provider_mock_api_rehearsal_ready",
                "assurance_pack_in_progress",
                "rfc_watch_registered",
            ],
            "live_gate_refs": [
                "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
                "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
                "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
                "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
                "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
                "LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT",
                "LIVE_GATE_NAMED_APPROVER_PRESENT",
                "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
                "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
                "LIVE_GATE_MUTATION_FLAG_ENABLED",
            ],
        },
        {
            "stage_id": "official_prerequisites_form_submitted",
            "stage_name": "Official prerequisites form submitted",
            "stage_group": "initiation",
            "stage_class": "official_process",
            "entry_conditions": [
                "The exact public form fields are populated with current approved values.",
                "The named approver and environment target are present.",
            ],
            "required_artifacts": [
                "ART_PRODUCT_PROFILE_DOSSIER",
                "ART_CLINICAL_SAFETY_DECLARATION",
                "ART_PROVIDER_ROSTER_REFRESH_EVIDENCE",
            ],
            "manual_checkpoints": ["Human confirms the form contents before submission."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Dry-run only against the internal rehearsal studio.",
            "actual_later_action": "Use the gated dry-run harness and stop before final submission unless mutation is explicitly authorised.",
            "outputs": ["Submission draft evidence", "Screenshots or redacted capture evidence"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003"],
            "notes": "This stage stays unreachable in current defaults.",
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
            "prerequisite_stage_ids": ["ready_for_real_im1_submission"],
            "live_gate_refs": ["LIVE_GATE_MUTATION_FLAG_ENABLED"],
        },
        {
            "stage_id": "official_stage_one_scal_issued",
            "stage_name": "Official stage-one SCAL issued",
            "stage_group": "initiation",
            "stage_class": "official_process",
            "entry_conditions": [
                "Prerequisites have been accepted by the IM1 team.",
                "The product is being assessed for compatibility against provider APIs.",
            ],
            "required_artifacts": ["ART_STAGE_ONE_SCAL_STUB"],
            "manual_checkpoints": ["Await IM1 team confirmation."],
            "browser_automation_possible": "no",
            "mock_now_action": "Represent the stage as a blocked official checkpoint only.",
            "actual_later_action": "Track issuance date and evidence hash once the IM1 team issues stage-one SCAL.",
            "outputs": ["Stage-one SCAL issued by NHS England"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "Issued by the external process, not by Vecells.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_prerequisites_form_submitted"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_product_viability_confirmed",
            "stage_name": "Official product viability confirmed",
            "stage_group": "initiation",
            "stage_class": "official_process",
            "entry_conditions": [
                "NHS England confirms the product is viable via API.",
            ],
            "required_artifacts": ["ART_STAGE_ONE_SCAL_STUB", "ART_ROUTE_FAMILY_COMPATIBILITY_MATRIX"],
            "manual_checkpoints": ["Await external viability decision."],
            "browser_automation_possible": "no",
            "mock_now_action": "Track as a future checkpoint only.",
            "actual_later_action": "Record the official decision and any required scope changes.",
            "outputs": ["Viability confirmation or rejection"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "This confirms feasibility, not assurance or live approval.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_stage_one_scal_issued"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_model_interface_licence_executed",
            "stage_name": "Official Model Interface Licence executed",
            "stage_group": "initiation",
            "stage_class": "provider_supplier_specific",
            "entry_conditions": [
                "Product viability is confirmed.",
                "Provider-supplier licence documents are executed by both consumer and provider suppliers.",
            ],
            "required_artifacts": ["ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"],
            "manual_checkpoints": ["Provider supplier and consumer signatories execute the licence."],
            "browser_automation_possible": "no",
            "mock_now_action": "Keep this as a placeholder-only register entry.",
            "actual_later_action": "Track execution state per supplier after legal completion outside the repo.",
            "outputs": ["Provider-specific licence execution state"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "Supplier specific and human governed.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_product_viability_confirmed"],
            "live_gate_refs": ["LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER"],
        },
        {
            "stage_id": "official_provider_mock_api_accessed",
            "stage_name": "Official provider mock API accessed",
            "stage_group": "unsupported_test",
            "stage_class": "provider_supplier_specific",
            "entry_conditions": [
                "Model Interface Licence has been executed.",
                "Provider supplier grants access to the test environment and documentation.",
            ],
            "required_artifacts": ["ART_PROVIDER_MOCK_API_REHEARSAL_LOG", "ART_PAIRING_INTEGRATION_PACK_REGISTER"],
            "manual_checkpoints": ["Provider supplier confirms credentials and environment access."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Only the internal rehearsal twin is available today.",
            "actual_later_action": "Track provider-specific access details in a vault-backed, non-repo register.",
            "outputs": ["Provider-specific unsupported-test access details"],
            "safety_and_privacy_dependencies": ["RISK_EXT_BOOKING_PROVIDER_GAP"],
            "risk_refs": ["RISK_EXT_BOOKING_PROVIDER_GAP"],
            "notes": "Mock API access is still not live approval or canonical truth.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_model_interface_licence_executed"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_supported_test_environment_requested",
            "stage_name": "Official Supported Test Environment requested",
            "stage_group": "supported_test",
            "stage_class": "official_process",
            "entry_conditions": [
                "Development is complete.",
                "The full SCAL is complete and can be submitted.",
            ],
            "required_artifacts": ["ART_SUPPORTED_TEST_REQUEST_CHECKLIST", "ART_ASSURANCE_EVIDENCE_INDEX"],
            "manual_checkpoints": ["Human confirms STE request contents and provider alignment."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Display the step as blocked with current blocker chips.",
            "actual_later_action": "Submit the STE request only once the pack turns green.",
            "outputs": ["STE request prepared or submitted"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "HZ_WRONG_PATIENT_BINDING"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "HZ_WRONG_PATIENT_BINDING"],
            "notes": "Submitting a full SCAL is the official prerequisite to STE access.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_provider_mock_api_accessed"],
            "live_gate_refs": ["LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN", "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT"],
        },
        {
            "stage_id": "official_supported_test_environment_granted",
            "stage_name": "Official Supported Test Environment granted",
            "stage_group": "supported_test",
            "stage_class": "provider_supplier_specific",
            "entry_conditions": [
                "Provider supplier grants STE access.",
                "Assurance approach is agreed with the provider supplier.",
            ],
            "required_artifacts": ["ART_SUPPORTED_TEST_REQUEST_CHECKLIST"],
            "manual_checkpoints": ["Provider supplier confirms STE access and assurance path."],
            "browser_automation_possible": "no",
            "mock_now_action": "Keep the state blocked and documentary only.",
            "actual_later_action": "Capture the granted environment details outside the repo and update the evidence index.",
            "outputs": ["STE access grant", "Provider assurance approach"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY"],
            "notes": "Provider supplier specific and not directly automatable from the repo.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_supported_test_environment_requested"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_assurance_completed",
            "stage_name": "Official assurance completed",
            "stage_group": "assurance",
            "stage_class": "official_process",
            "entry_conditions": [
                "SCAL is reviewed and agreed.",
                "Test evidence is agreed or witness test is undertaken.",
            ],
            "required_artifacts": ["ART_ASSURANCE_EVIDENCE_INDEX", "ART_HAZARD_LOG", "ART_DPIA_AND_PRIVACY_NOTICE"],
            "manual_checkpoints": ["NHS England assurance acceptance is recorded."],
            "browser_automation_possible": "no",
            "mock_now_action": "Track as a blocked external checkpoint.",
            "actual_later_action": "Update the assurance evidence pack and acceptance state after external review.",
            "outputs": ["Recommended to Connect", "Plan to Connect", "Model Interface Licence uplift state"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_MUTATION_003"],
            "notes": "Assurance completion is where RTC and PTC appear in the official flow.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_supported_test_environment_granted"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_live_rollout_authorised",
            "stage_name": "Official live rollout authorised",
            "stage_group": "live",
            "stage_class": "official_process",
            "entry_conditions": [
                "Assurance is accepted by NHS England.",
                "Provider supplier issues Plan to Connect.",
            ],
            "required_artifacts": ["ART_ASSURANCE_EVIDENCE_INDEX", "ART_MODEL_INTERFACE_LICENCE_PLACEHOLDERS"],
            "manual_checkpoints": ["Consumer and provider agree the rollout window."],
            "browser_automation_possible": "no",
            "mock_now_action": "Not reachable in the rehearsal studio.",
            "actual_later_action": "Track rollout by supplier and organisation after official approvals land.",
            "outputs": ["Live rollout authorisation", "Assured licence uplift"],
            "safety_and_privacy_dependencies": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_BOOKING_PROVIDER_GAP"],
            "risk_refs": ["RISK_EXT_IM1_SCAL_DELAY", "RISK_EXT_BOOKING_PROVIDER_GAP"],
            "notes": "Live rollout remains later and explicitly outside current baseline execution.",
            "source_refs": ["official_im1_pairing_process"],
            "prerequisite_stage_ids": ["official_assurance_completed"],
            "live_gate_refs": [],
        },
        {
            "stage_id": "official_rfc_submitted_for_significant_change",
            "stage_name": "Official RFC submitted for significant change",
            "stage_group": "rfc_watch",
            "stage_class": "official_process",
            "entry_conditions": [
                "The product has evolved from the originally assured IM1 use case.",
                "Updated SCAL and documentation are available.",
            ],
            "required_artifacts": ["ART_RFC_TRIGGER_REGISTER", "ART_STAGE_ONE_SCAL_STUB", "ART_HAZARD_LOG"],
            "manual_checkpoints": ["Human determines that the change class is material enough to require RFC."],
            "browser_automation_possible": "partial",
            "mock_now_action": "Surface the trigger classes and associated documentation deltas.",
            "actual_later_action": "Submit the RFC via the customer service portal only after the updated pack is current and mutation is authorised.",
            "outputs": ["RFC packet", "Updated SCAL and documentation"],
            "safety_and_privacy_dependencies": ["RISK_MUTATION_003", "RISK_RUNTIME_001"],
            "risk_refs": ["RISK_MUTATION_003", "RISK_RUNTIME_001"],
            "notes": "AI or other major feature expansion is explicitly fenced here.",
            "source_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md"],
            "prerequisite_stage_ids": ["official_live_rollout_authorised"],
            "live_gate_refs": ["LIVE_GATE_MUTATION_FLAG_ENABLED"],
        },
    ]


def build_provider_register(
    selected_routes: list[dict[str, str]],
    selected_gateway_rows: list[dict[str, str]],
) -> dict[str, Any]:
    providers = [
        {
            "provider_supplier_id": "ps_optum_emisweb",
            "provider_supplier_name": "Optum (EMISWeb)",
            "supplier_code": "OPTUM_EMISWEB",
            "current_public_status": "listed_on_im1_pairing_page_2026_04_09",
            "targeted_for_vecells": True,
            "roster_source_url": OFFICIAL_GUIDANCE[0]["url"],
            "notes": [
                "Current official pairing page names Optum (EMISWeb) as one of the 2 existing provider suppliers.",
                "Appointments details may depend on provider-specific PIPs and cannot be assumed generically.",
            ],
            "source_refs": ["official_im1_pairing_process", "official_im1_api_standards"],
        },
        {
            "provider_supplier_id": "ps_tpp_systmone",
            "provider_supplier_name": "TPP (SystmOne)",
            "supplier_code": "TPP_SYSTMONE",
            "current_public_status": "listed_on_im1_pairing_page_2026_04_09",
            "targeted_for_vecells": True,
            "roster_source_url": OFFICIAL_GUIDANCE[0]["url"],
            "notes": [
                "Current official pairing page names TPP (SystmOne) as one of the 2 existing provider suppliers.",
                "Supplier-specific appointment and booking behavior still has to be evidenced through capability and PIP review.",
            ],
            "source_refs": ["official_im1_pairing_process", "official_im1_api_standards"],
        },
    ]

    route_labels = {
        row["route_family_id"]: row["route_family"] for row in selected_routes
    }
    gateway_by_route = {
        row["route_family_id"]: row["gateway_surface_name"] for row in selected_gateway_rows
    }

    compatibility_rows = [
        {
            "compatibility_row_id": "cmp_intake_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_intake_self_service",
            "route_family_name": route_labels["rf_intake_self_service"],
            "gateway_surface_name": gateway_by_route["rf_intake_self_service"],
            "im1_role": "not_required",
            "current_mock_position": "rehearse IM1 disclaimer only",
            "actual_later_position": "do not widen IM1 into public intake",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_intake_self_service"],
            "truth_guardrail": "Intake capture and submit remain canonical without IM1.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"],
        },
        {
            "compatibility_row_id": "cmp_intake_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_intake_self_service",
            "route_family_name": route_labels["rf_intake_self_service"],
            "gateway_surface_name": gateway_by_route["rf_intake_self_service"],
            "im1_role": "not_required",
            "current_mock_position": "rehearse IM1 disclaimer only",
            "actual_later_position": "do not widen IM1 into public intake",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_intake_self_service"],
            "truth_guardrail": "Intake capture and submit remain canonical without IM1.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"],
        },
        {
            "compatibility_row_id": "cmp_recovery_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_patient_secure_link_recovery",
            "route_family_name": route_labels["rf_patient_secure_link_recovery"],
            "gateway_surface_name": gateway_by_route["rf_patient_secure_link_recovery"],
            "im1_role": "not_required",
            "current_mock_position": "show explicit recovery independence",
            "actual_later_position": "keep grant recovery and claim resume outside IM1 authority",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_secure_link_recovery"],
            "truth_guardrail": "IM1 is never a shortcut to patient ownership or grant redemption.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"],
        },
        {
            "compatibility_row_id": "cmp_recovery_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_patient_secure_link_recovery",
            "route_family_name": route_labels["rf_patient_secure_link_recovery"],
            "gateway_surface_name": gateway_by_route["rf_patient_secure_link_recovery"],
            "im1_role": "not_required",
            "current_mock_position": "show explicit recovery independence",
            "actual_later_position": "keep grant recovery and claim resume outside IM1 authority",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_secure_link_recovery"],
            "truth_guardrail": "IM1 is never a shortcut to patient ownership or grant redemption.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase"],
        },
        {
            "compatibility_row_id": "cmp_home_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_patient_home",
            "route_family_name": route_labels["rf_patient_home"],
            "gateway_surface_name": gateway_by_route["rf_patient_home"],
            "im1_role": "not_required",
            "current_mock_position": "show read-only independence",
            "actual_later_position": "do not claim IM1 as a patient-home authority rail",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_home"],
            "truth_guardrail": "Authenticated home remains NHS-login-governed and publication-governed.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine"],
        },
        {
            "compatibility_row_id": "cmp_home_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_patient_home",
            "route_family_name": route_labels["rf_patient_home"],
            "gateway_surface_name": gateway_by_route["rf_patient_home"],
            "im1_role": "not_required",
            "current_mock_position": "show read-only independence",
            "actual_later_position": "do not claim IM1 as a patient-home authority rail",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_home"],
            "truth_guardrail": "Authenticated home remains NHS-login-governed and publication-governed.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine"],
        },
        {
            "compatibility_row_id": "cmp_requests_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_patient_requests",
            "route_family_name": route_labels["rf_patient_requests"],
            "gateway_surface_name": gateway_by_route["rf_patient_requests"],
            "im1_role": "not_required",
            "current_mock_position": "show request-tracker independence",
            "actual_later_position": "keep request tracking and more-info flows independent of IM1",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_requests"],
            "truth_guardrail": "Request lineage truth remains canonical without IM1.",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm"],
        },
        {
            "compatibility_row_id": "cmp_requests_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_patient_requests",
            "route_family_name": route_labels["rf_patient_requests"],
            "gateway_surface_name": gateway_by_route["rf_patient_requests"],
            "im1_role": "not_required",
            "current_mock_position": "show request-tracker independence",
            "actual_later_position": "keep request tracking and more-info flows independent of IM1",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_requests"],
            "truth_guardrail": "Request lineage truth remains canonical without IM1.",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#5.5 Unified care conversation algorithm"],
        },
        {
            "compatibility_row_id": "cmp_appointments_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_patient_appointments",
            "route_family_name": route_labels["rf_patient_appointments"],
            "gateway_surface_name": gateway_by_route["rf_patient_appointments"],
            "im1_role": "blocked_without_pairing",
            "current_mock_position": "simulate unsupported, pending, and ambiguous booking states locally",
            "actual_later_position": "requires paired supplier capability evidence, PIP review, licence execution, and assurance",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_appointments"],
            "truth_guardrail": "No search result, queue acceptance, or provider 202 response implies booked truth.",
            "source_refs": ["official_im1_api_standards", "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"],
        },
        {
            "compatibility_row_id": "cmp_appointments_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_patient_appointments",
            "route_family_name": route_labels["rf_patient_appointments"],
            "gateway_surface_name": gateway_by_route["rf_patient_appointments"],
            "im1_role": "blocked_without_pairing",
            "current_mock_position": "simulate unsupported, pending, and ambiguous booking states locally",
            "actual_later_position": "requires paired supplier capability evidence, PIP review, licence execution, and assurance",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_patient_appointments"],
            "truth_guardrail": "No search result, queue acceptance, or provider 202 response implies booked truth.",
            "source_refs": ["official_im1_api_standards", "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"],
        },
        {
            "compatibility_row_id": "cmp_workspace_optum",
            "provider_supplier_id": "ps_optum_emisweb",
            "route_family_id": "rf_staff_workspace",
            "route_family_name": route_labels["rf_staff_workspace"],
            "gateway_surface_name": gateway_by_route["rf_staff_workspace"],
            "im1_role": "supplier_specific_review",
            "current_mock_position": "show blocked supplier reach with manual fallback and review states",
            "actual_later_position": "requires explicit provider reach proof before staff actions widen",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_staff_workspace"],
            "truth_guardrail": "Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance.",
            "source_refs": ["phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding", "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"],
        },
        {
            "compatibility_row_id": "cmp_workspace_tpp",
            "provider_supplier_id": "ps_tpp_systmone",
            "route_family_id": "rf_staff_workspace",
            "route_family_name": route_labels["rf_staff_workspace"],
            "gateway_surface_name": gateway_by_route["rf_staff_workspace"],
            "im1_role": "supplier_specific_review",
            "current_mock_position": "show blocked supplier reach with manual fallback and review states",
            "actual_later_position": "requires explicit provider reach proof before staff actions widen",
            "capability_note": ROUTE_FAMILY_SELECTION["rf_staff_workspace"],
            "truth_guardrail": "Staff tools may review supplier posture but may not write canonical request state directly from supplier acceptance.",
            "source_refs": ["phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding", "blueprint/forensic-audit-findings.md#Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough"],
        },
    ]

    licence_register = [
        {
            "licence_row_id": "lic_optum_placeholder",
            "provider_supplier_id": "ps_optum_emisweb",
            "licence_state": "placeholder_only",
            "consumer_entity_placeholder": "VECELLS_CONSUMER_ENTITY_PLACEHOLDER",
            "provider_entity_placeholder": "OPTUM_PROVIDER_ENTITY_PLACEHOLDER",
            "consumer_signatory_role": "ROLE_COMMERCIAL_OWNER",
            "provider_signatory_role": "provider_supplier_signatory",
            "approver_role": "ROLE_GOVERNANCE_LEAD",
            "notes": "No real legal names or signatories stored in repo fixtures.",
        },
        {
            "licence_row_id": "lic_tpp_placeholder",
            "provider_supplier_id": "ps_tpp_systmone",
            "licence_state": "placeholder_only",
            "consumer_entity_placeholder": "VECELLS_CONSUMER_ENTITY_PLACEHOLDER",
            "provider_entity_placeholder": "TPP_PROVIDER_ENTITY_PLACEHOLDER",
            "consumer_signatory_role": "ROLE_COMMERCIAL_OWNER",
            "provider_signatory_role": "provider_supplier_signatory",
            "approver_role": "ROLE_GOVERNANCE_LEAD",
            "notes": "No real legal names or signatories stored in repo fixtures.",
        },
    ]

    roster_refresh = {
        "roster_source_url": OFFICIAL_GUIDANCE[0]["url"],
        "known_provider_suppliers_on_capture": ["Optum (EMISWeb)", "TPP (SystmOne)"],
        "fetch_rule": (
            "The actual-provider dry-run harness must fetch the current IM1 Pairing page at runtime "
            "and confirm the provider supplier roster before preparing any real submission payload."
        ),
        "selector_hints": {
            "provider_roster_heading": "##  IM1 live suppliers",
            "pairing_process_heading": "##  Process",
        },
        "captured_on": "2026-04-09",
    }

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "providers": providers,
        "route_family_matrix": compatibility_rows,
        "licence_register": licence_register,
        "roster_refresh": roster_refresh,
        "summary": {
            "provider_supplier_count": len(providers),
            "route_family_matrix_count": len(compatibility_rows),
            "licence_placeholder_count": len(licence_register),
        },
    }


def build_rfc_watch() -> list[dict[str, Any]]:
    return [
        {
            "watch_id": "RFC_AI_EXPANSION",
            "change_class": "AI or assistive decision support added to an assured IM1 flow",
            "rfc_required": True,
            "required_delta": "Updated SCAL, hazard log, DPIA, and model/supplier assurance documentation.",
            "reason": "Official IM1 guidance names AI and significant functional enhancements as explicit RFC triggers.",
            "source_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md"],
        },
        {
            "watch_id": "RFC_ROUTE_FAMILY_WIDEN",
            "change_class": "New patient or staff route family begins using the assured IM1 capability set",
            "rfc_required": True,
            "required_delta": "Updated route-family matrix, capability digest, and booking-truth guardrail statement.",
            "reason": "Route widening changes the assured use case and can invalidate earlier pairing posture.",
            "source_refs": ["official_im1_pairing_process", "phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam"],
        },
        {
            "watch_id": "RFC_NEW_PROVIDER_SUPPLIER",
            "change_class": "A new provider supplier or foundation supplier is targeted",
            "rfc_required": True,
            "required_delta": "Refreshed roster evidence, supplier-specific compatibility review, and updated licence register.",
            "reason": "Supplier-specific pairing posture cannot be inferred from an earlier supplier.",
            "source_refs": ["official_im1_pairing_process", "official_im1_api_standards"],
        },
        {
            "watch_id": "RFC_MUTATION_SCOPE_WIDEN",
            "change_class": "Writable booking or manage actions widen beyond the earlier assured surface",
            "rfc_required": True,
            "required_delta": "Updated BookingProviderAdapterBinding evidence, control-plane proof, and degraded-mode review.",
            "reason": "Widening mutable scope changes truth, safety, and rollback semantics.",
            "source_refs": ["official_im1_pairing_process", "phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation"],
        },
        {
            "watch_id": "RFC_SAMD_BOUNDARY_CHANGE",
            "change_class": "Medical-device or SaMD boundary changes",
            "rfc_required": True,
            "required_delta": "Updated clinical safety case, hazard log, and regulatory evidence.",
            "reason": "The public prerequisites form explicitly calls out added scrutiny for software as a medical device.",
            "source_refs": ["official_im1_prerequisites_form", "official_im1_pairing_process"],
        },
        {
            "watch_id": "RFC_DATA_FLOW_OR_SUBPROCESSOR_CHANGE",
            "change_class": "New patient-data processing path, UK processing statement change, or material subprocessor change",
            "rfc_required": True,
            "required_delta": "Updated DPIA, privacy notice, DSPT/ISMS posture, and residency statement.",
            "reason": "Changes to the information-governance pack can invalidate the earlier assured posture.",
            "source_refs": ["official_im1_prerequisites_form", "official_scal_process"],
        },
        {
            "watch_id": "RFC_NO_CHANGE",
            "change_class": "Documentation refresh only with no use-case or functional change",
            "rfc_required": False,
            "required_delta": "Refresh the evidence index only.",
            "reason": "Not every evidence refresh is an RFC, but freshness must still be tracked.",
            "source_refs": ["official_im1_pairing_process"],
        },
    ]


def build_live_gates() -> dict[str, Any]:
    live_gates = [
        {
            "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "gate_title": "External-readiness chain remains withheld",
            "status": "blocked",
            "reason": "Seq_020 still reports the downstream external-readiness gate as withheld.",
            "source_refs": ["data/analysis/phase0_gate_verdict.json#GATE_P0_FOUNDATION_ENTRY"],
        },
        {
            "gate_id": "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE",
            "gate_title": "Credible MVP/demo and bounded IM1 use case",
            "status": "blocked",
            "reason": "The rehearsal dossier is ready, but the pack still treats the real provider path as later and gated.",
            "source_refs": ["prompt/026.md", "docs/external/21_integration_priority_and_execution_matrix.md"],
        },
        {
            "gate_id": "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN",
            "gate_title": "Provider capability model frozen enough for submission",
            "status": "review_required",
            "reason": "The capability model is defined, but supplier-path evidence and seq_036 freeze work are not complete yet.",
            "source_refs": ["docs/external/21_integration_priority_and_execution_matrix.md", "docs/external/22_provider_selection_scorecards.md"],
        },
        {
            "gate_id": "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT",
            "gate_title": "Safety, privacy, DPIA, architecture, and data-flow artifacts current",
            "status": "review_required",
            "reason": "Current artifacts exist, but the IM1-specific evidence bundle still needs later approval freshness.",
            "source_refs": ["official_scal_process", "official_im1_pairing_process"],
        },
        {
            "gate_id": "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER",
            "gate_title": "Named sponsor and commercial owner posture known",
            "status": "blocked",
            "reason": "The pack carries placeholders only for sponsor and commercial owner.",
            "source_refs": ["prompt/026.md", "ASSUMPTION_IM1_REAL_SUBMISSION_REMAINS_BLOCKED"],
        },
        {
            "gate_id": "LIVE_GATE_IM1_NOT_PHASE2_IDENTITY_SHORTCUT",
            "gate_title": "IM1 not being used to bypass Phase 2 identity law",
            "status": "pass",
            "reason": "The pack explicitly fences IM1 away from patient ownership, grant redemption, and baseline continuity.",
            "source_refs": ["blueprint/phase-2-the-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase", "prompt/026.md"],
        },
        {
            "gate_id": "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "gate_title": "Named approver present",
            "status": "blocked",
            "reason": "The dry-run profile still uses an approver placeholder.",
            "source_refs": ["prompt/026.md"],
        },
        {
            "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "gate_title": "Environment target present",
            "status": "blocked",
            "reason": "The pack defaults to placeholder environment labels and requires explicit later confirmation.",
            "source_refs": ["prompt/026.md", "official_im1_pairing_process"],
        },
        {
            "gate_id": "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED",
            "gate_title": "Current provider-supplier roster fetched at runtime",
            "status": "blocked",
            "reason": "The actual-provider dry-run must fetch the current official roster before any real preparation occurs.",
            "source_refs": ["official_im1_pairing_process"],
        },
        {
            "gate_id": "LIVE_GATE_MUTATION_FLAG_ENABLED",
            "gate_title": "ALLOW_REAL_PROVIDER_MUTATION=true explicitly set",
            "status": "blocked",
            "reason": "Real provider mutation remains disabled by default.",
            "source_refs": ["prompt/026.md", "prompt/shared_operating_contract_026_to_035.md"],
        },
    ]

    selector_map = {
        "base_profile": {
            "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
            "page_tab_prerequisites": "[data-testid='page-tab-Prerequisites_Dossier']",
            "page_tab_licence": "[data-testid='page-tab-Licence_and_RFC_Watch']",
            "evidence_drawer": "[data-testid='evidence-drawer']",
            "redaction_notice": "[data-testid='redaction-notice']",
            "provider_matrix_first_row": "[data-testid='provider-matrix-row-cmp_appointments_optum']",
            "field_mvp_evidence_url": "[data-testid='actual-field-mvp-evidence-url']",
            "field_sponsor_name": "[data-testid='actual-field-sponsor-name']",
            "field_commercial_owner": "[data-testid='actual-field-commercial-owner']",
            "field_named_approver": "[data-testid='actual-field-named-approver']",
            "field_environment_target": "[data-testid='actual-field-environment-target']",
            "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
            "refresh_provider_roster": "[data-testid='refresh-provider-roster']",
            "final_submit": "[data-testid='dry-run-submit']",
        }
    }

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "live_gate_count": len(live_gates),
            "blocked_count": len([gate for gate in live_gates if gate["status"] == "blocked"]),
            "review_required_count": len([gate for gate in live_gates if gate["status"] == "review_required"]),
            "pass_count": len([gate for gate in live_gates if gate["status"] == "pass"]),
            "current_submission_posture": "blocked",
        },
        "live_gates": live_gates,
        "selector_map": selector_map,
        "dry_run_defaults": {
            "default_target_url": "http://127.0.0.1:4175/?mode=actual&page=Prerequisites_Dossier",
            "allow_real_provider_mutation": False,
            "default_selector_profile": "base_profile",
        },
        "runtime_roster_refresh": {
            "url": OFFICIAL_GUIDANCE[0]["url"],
            "expected_provider_suppliers": ["Optum (EMISWeb)", "TPP (SystmOne)"],
            "required_before_real_submission": True,
        },
        "required_env": [
            "IM1_NAMED_APPROVER",
            "IM1_ENVIRONMENT_TARGET",
            "IM1_SPONSOR_NAME",
            "IM1_COMMERCIAL_OWNER",
            "ALLOW_REAL_PROVIDER_MUTATION",
        ],
    }


def build_pack(inputs: dict[str, Any]) -> dict[str, Any]:
    selected_routes = select_routes(inputs["route_family_inventory"])
    selected_gateway_rows = select_gateway_rows(inputs["gateway_surface_split_matrix"])
    risks = risk_catalog(inputs["master_risk_register"])
    fields = build_fields()
    artifacts = build_artifacts()
    stage_rows = build_stage_rows()
    provider_register = build_provider_register(selected_routes, selected_gateway_rows)
    live_gate_pack = build_live_gates()
    rfc_watch = build_rfc_watch()

    rehearsal_stage_ids = [
        row["stage_id"]
        for row in stage_rows
        if row["stage_class"] == "internal_rehearsal"
    ]
    exact_public_field_count = len([field for field in fields if field["origin_class"] == "exact_public_form"])

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "phase0_verdict": inputs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        "source_precedence": SOURCE_PRECEDENCE,
        "official_guidance": OFFICIAL_GUIDANCE,
        "assumptions": ASSUMPTIONS,
        "summary": {
            "stage_count": len(stage_rows),
            "rehearsal_stage_count": len(rehearsal_stage_ids),
            "exact_public_field_count": exact_public_field_count,
            "field_count": len(fields),
            "artifact_count": len(artifacts),
            "provider_supplier_count": provider_register["summary"]["provider_supplier_count"],
            "route_family_matrix_count": provider_register["summary"]["route_family_matrix_count"],
            "live_gate_count": live_gate_pack["summary"]["live_gate_count"],
            "blocked_live_gate_count": live_gate_pack["summary"]["blocked_count"],
            "rfc_watch_count": len(rfc_watch),
            "phase0_entry_verdict": inputs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        },
        "routes": selected_routes,
        "gateway_surfaces": selected_gateway_rows,
        "fields": fields,
        "artifacts": artifacts,
        "stage_rows": stage_rows,
        "provider_register": provider_register,
        "live_gate_pack": live_gate_pack,
        "rfc_watch": rfc_watch,
        "risk_digest": [
            {
                "risk_id": risk_id,
                "risk_title": row["risk_title"],
                "status": row["status"],
                "owner_role": row["owner_role"],
            }
            for risk_id, row in sorted(risks.items())
        ],
    }


def build_stage_csv_rows(stage_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in stage_rows:
        rows.append(
            {
                "stage_id": row["stage_id"],
                "stage_name": row["stage_name"],
                "stage_group": row["stage_group"],
                "stage_class": row["stage_class"],
                "entry_conditions": as_cell(row["entry_conditions"]),
                "required_artifacts": as_cell(row["required_artifacts"]),
                "manual_checkpoints": as_cell(row["manual_checkpoints"]),
                "browser_automation_possible": row["browser_automation_possible"],
                "mock_now_action": row["mock_now_action"],
                "actual_later_action": row["actual_later_action"],
                "outputs": as_cell(row["outputs"]),
                "safety_and_privacy_dependencies": as_cell(row["safety_and_privacy_dependencies"]),
                "risk_refs": as_cell(row["risk_refs"]),
                "notes": row["notes"],
                "source_refs": as_cell(row["source_refs"]),
                "prerequisite_stage_ids": as_cell(row["prerequisite_stage_ids"]),
                "live_gate_refs": as_cell(row["live_gate_refs"]),
            }
        )
    return rows


def build_scal_csv_rows(artifacts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in artifacts:
        rows.append(
            {
                "artifact_id": row["artifact_id"],
                "artifact_name": row["artifact_name"],
                "artifact_group": row["artifact_group"],
                "required_for_stage_ids": as_cell(row["required_for_stage_ids"]),
                "mock_status": row["mock_status"],
                "actual_status": row["actual_status"],
                "freshness_posture": row["freshness_posture"],
                "owner_role": row["owner_role"],
                "source_refs": as_cell(row["source_refs"]),
                "notes": row["notes"],
            }
        )
    return rows


def write_docs(pack: dict[str, Any]) -> None:
    stage_rows = pack["stage_rows"]
    internal_rows = [
        row for row in stage_rows if row["stage_class"] == "internal_rehearsal"
    ]
    official_rows = [
        row for row in stage_rows if row["stage_class"] != "internal_rehearsal"
    ]
    fields = pack["fields"]
    exact_fields = [row for row in fields if row["origin_class"] == "exact_public_form"]
    derived_fields = [row for row in fields if row["origin_class"] != "exact_public_form"]
    provider_matrix = pack["provider_register"]["route_family_matrix"]
    licence_rows = pack["provider_register"]["licence_register"]
    live_gates = pack["live_gate_pack"]["live_gates"]
    artifacts = pack["artifacts"]
    rfc_watch = pack["rfc_watch"]

    rehearsal_doc = textwrap.dedent(
        f"""
        # 26 IM1 Pairing Rehearsal Strategy

        `{VISUAL_MODE}` is the seq_026 internal control-tower pack for rehearsing IM1 pairing without pretending Vecells is already approved.

        Summary:
        - total stage rows: {pack["summary"]["stage_count"]}
        - rehearsal stages: {pack["summary"]["rehearsal_stage_count"]}
        - blocked live gates: {pack["summary"]["blocked_live_gate_count"]}
        - provider suppliers currently targeted: {pack["summary"]["provider_supplier_count"]}

        ## Section A — `Mock_now_execution`

        The rehearsal lane exists now because Vecells needs a governed provider-capability seam before live IM1 approval exists. The studio therefore:
        - proves IM1 stays out of the Phase 2 identity critical path
        - binds every compatibility claim to provider-capability and route-family evidence
        - keeps unsupported-test semantics honest without implying live approval
        - tracks future RFC triggers for AI or other significant scope expansion

        ### Rehearsal stages

        {md_table([
            {
                "stage_id": row["stage_id"],
                "stage_name": row["stage_name"],
                "stage_group": row["stage_group"],
                "entry_conditions": as_cell(row["entry_conditions"]),
                "required_artifacts": as_cell(row["required_artifacts"]),
                "notes": row["notes"],
            }
            for row in internal_rows
        ], [
            ("stage_id", "Stage"),
            ("stage_name", "Name"),
            ("stage_group", "Group"),
            ("entry_conditions", "Entry conditions"),
            ("required_artifacts", "Required artifacts"),
            ("notes", "Why it exists"),
        ])}

        ## Section B — `Actual_provider_strategy_later`

        The real-provider path remains fail-closed. IM1 prerequisites, SCAL, supplier mock access, STE requests, assurance, and RFC actions may only progress once the gate pack is green and explicit mutation approval exists.

        ### Official and blocked stages

        {md_table([
            {
                "stage_id": row["stage_id"],
                "stage_name": row["stage_name"],
                "stage_class": row["stage_class"],
                "browser_automation_possible": row["browser_automation_possible"],
                "live_gate_refs": as_cell(row["live_gate_refs"]),
                "actual_later_action": row["actual_later_action"],
            }
            for row in official_rows
        ], [
            ("stage_id", "Stage"),
            ("stage_name", "Name"),
            ("stage_class", "Class"),
            ("browser_automation_possible", "Browser automation"),
            ("live_gate_refs", "Gate refs"),
            ("actual_later_action", "Later action"),
        ])}

        ### Live gate posture

        {md_table([
            {
                "gate_id": row["gate_id"],
                "gate_title": row["gate_title"],
                "status": row["status"],
                "reason": row["reason"],
            }
            for row in live_gates
        ], [
            ("gate_id", "Gate"),
            ("gate_title", "Title"),
            ("status", "Status"),
            ("reason", "Current posture"),
        ])}
        """
    )

    field_map_doc = textwrap.dedent(
        f"""
        # 26 IM1 Pairing Prerequisites Field Map

        This pack separates the exact public prerequisites-form fields from the derived stage-one SCAL and live-gate dossier fields that Vecells still needs internally.

        Summary:
        - exact public fields: {len(exact_fields)}
        - total mapped fields: {len(fields)}

        ## Section A — `Mock_now_execution`

        The studio carries every exact public field now so the team can draft and validate the IM1 prerequisites pack without touching a real portal.

        ### Exact public prerequisites-form fields

        {md_table([
            {
                "field_id": row["field_id"],
                "label": row["label"],
                "section": row["section"],
                "mock_value": row["mock_value"],
                "required_for": as_cell(row["required_for"]),
            }
            for row in exact_fields
        ], [
            ("field_id", "Field"),
            ("label", "Label"),
            ("section", "Section"),
            ("mock_value", "Mock value"),
            ("required_for", "Required for"),
        ])}

        ## Section B — `Actual_provider_strategy_later`

        The public IM1 pages do not list every stage-one SCAL column, so the later strategy adds a derived dossier layer that remains explicit about its provenance.

        ### Derived stage-one SCAL and live-gate fields

        {md_table([
            {
                "field_id": row["field_id"],
                "label": row["label"],
                "origin_class": row["origin_class"],
                "actual_placeholder": row["actual_placeholder"],
                "required_for": as_cell(row["required_for"]),
            }
            for row in derived_fields
        ], [
            ("field_id", "Field"),
            ("label", "Label"),
            ("origin_class", "Origin"),
            ("actual_placeholder", "Actual-provider placeholder"),
            ("required_for", "Required for"),
        ])}

        ### Assumptions

        {md_table([
            {
                "assumption_id": row["assumption_id"],
                "summary": row["summary"],
                "consequence": row["consequence"],
            }
            for row in ASSUMPTIONS
        ], [
            ("assumption_id", "Assumption"),
            ("summary", "Summary"),
            ("consequence", "Consequence"),
        ])}
        """
    )

    scal_doc = textwrap.dedent(
        f"""
        # 26 IM1 SCAL Artifact Matrix

        Every stage-one, unsupported-test, supported-test, assurance, and RFC action now maps back to a named artifact instead of narrative hand-waving.

        ## Section A — `Mock_now_execution`

        The rehearsal studio tracks artifact readiness, freshness, ownership, and blocker posture locally.

        ### Artifact matrix

        {md_table([
            {
                "artifact_id": row["artifact_id"],
                "artifact_name": row["artifact_name"],
                "artifact_group": row["artifact_group"],
                "mock_status": row["mock_status"],
                "freshness_posture": row["freshness_posture"],
                "required_for_stage_ids": as_cell(row["required_for_stage_ids"]),
            }
            for row in artifacts
        ], [
            ("artifact_id", "Artifact"),
            ("artifact_name", "Name"),
            ("artifact_group", "Group"),
            ("mock_status", "Mock status"),
            ("freshness_posture", "Freshness"),
            ("required_for_stage_ids", "Required for stages"),
        ])}

        ## Section B — `Actual_provider_strategy_later`

        Later real IM1 work uses the same artifact set, but the status posture changes from rehearsal to explicit gate control.

        ### Actual-later posture

        {md_table([
            {
                "artifact_id": row["artifact_id"],
                "artifact_name": row["artifact_name"],
                "actual_status": row["actual_status"],
                "owner_role": row["owner_role"],
                "notes": row["notes"],
            }
            for row in artifacts
        ], [
            ("artifact_id", "Artifact"),
            ("artifact_name", "Name"),
            ("actual_status", "Actual status"),
            ("owner_role", "Owner"),
            ("notes", "Why it matters"),
        ])}
        """
    )

    provider_doc = textwrap.dedent(
        f"""
        # 26 IM1 Provider Supplier And Licence Register

        The provider-supplier lane is now explicit and machine-readable. The pack also forces a runtime refresh of the current public roster so later execution does not silently trust stale supplier assumptions.

        ## Section A — `Mock_now_execution`

        ### Provider and route-family compatibility matrix

        {md_table([
            {
                "compatibility_row_id": row["compatibility_row_id"],
                "provider_supplier_id": row["provider_supplier_id"],
                "route_family_id": row["route_family_id"],
                "im1_role": row["im1_role"],
                "current_mock_position": row["current_mock_position"],
                "truth_guardrail": row["truth_guardrail"],
            }
            for row in provider_matrix
        ], [
            ("compatibility_row_id", "Row"),
            ("provider_supplier_id", "Provider supplier"),
            ("route_family_id", "Route family"),
            ("im1_role", "IM1 role"),
            ("current_mock_position", "Mock position"),
            ("truth_guardrail", "Truth guardrail"),
        ])}

        ## Section B — `Actual_provider_strategy_later`

        ### Licence placeholder register

        {md_table(licence_rows, [
            ("licence_row_id", "Row"),
            ("provider_supplier_id", "Provider supplier"),
            ("licence_state", "State"),
            ("consumer_signatory_role", "Consumer signatory role"),
            ("provider_signatory_role", "Provider signatory role"),
            ("approver_role", "Approver"),
            ("notes", "Notes"),
        ])}

        ### Roster refresh rule

        - source: `{pack["provider_register"]["roster_refresh"]["roster_source_url"]}`
        - known capture on: `{pack["provider_register"]["roster_refresh"]["captured_on"]}`
        - rule: {pack["provider_register"]["roster_refresh"]["fetch_rule"]}
        """
    )

    rfc_doc = textwrap.dedent(
        f"""
        # 26 IM1 Change Control And RFC Strategy

        The RFC watch closes the gap where later AI or other major scope changes could otherwise reuse stale IM1 paperwork.

        ## Section A — `Mock_now_execution`

        The rehearsal studio surfaces RFC trigger classes beside licence readiness and live gates so future scope changes are visible before any supplier action happens.

        ### Trigger register

        {md_table([
            {
                "watch_id": row["watch_id"],
                "change_class": row["change_class"],
                "rfc_required": "yes" if row["rfc_required"] else "no",
                "required_delta": row["required_delta"],
                "reason": row["reason"],
            }
            for row in rfc_watch
        ], [
            ("watch_id", "Trigger"),
            ("change_class", "Change class"),
            ("rfc_required", "RFC required"),
            ("required_delta", "Required delta"),
            ("reason", "Why"),
        ])}

        ## Section B — `Actual_provider_strategy_later`

        Later real change control must use the official RFC path and carry updated SCAL plus associated documentation whenever the assured IM1 use case has materially changed.

        ### Gate linkage

        {md_table([
            {
                "gate_id": row["gate_id"],
                "status": row["status"],
                "reason": row["reason"],
            }
            for row in live_gates
        ], [
            ("gate_id", "Gate"),
            ("status", "Status"),
            ("reason", "Reason"),
        ])}
        """
    )

    write_text(REHEARSAL_DOC_PATH, rehearsal_doc)
    write_text(FIELD_MAP_DOC_PATH, field_map_doc)
    write_text(SCAL_DOC_PATH, scal_doc)
    write_text(PROVIDER_DOC_PATH, provider_doc)
    write_text(RFC_DOC_PATH, rfc_doc)


def write_readme(pack: dict[str, Any]) -> None:
    readme = textwrap.dedent(
        f"""
        # Mock IM1 Pairing Studio

        `{VISUAL_MODE}` is the seq_026 rehearsal-grade IM1 pairing control tower.

        ## What it does

        - rehearses the exact public IM1 prerequisites fields without implying live approval
        - maps provider suppliers and route families back to Vecells capability truth
        - tracks stage-one SCAL, licence, unsupported-test, supported-test, assurance, and RFC posture from one pack
        - keeps real-provider actions blocked until the live-gate checklist passes

        ## Run

        ```bash
        pnpm install
        pnpm dev
        ```

        The default local URL is `http://127.0.0.1:4175`.

        ## Pages

        - `/?page=IM1_Readiness_Overview` for the stage rail and readiness view
        - `/?page=Prerequisites_Dossier` for the exact field map and dossier cards
        - `/?page=SCAL_Artifact_Map` for the artifact matrix
        - `/?page=Provider_Compatibility_Matrix` for route-family and provider-supplier rows
        - `/?page=Licence_and_RFC_Watch` for licence placeholders, live gates, and RFC triggers

        ## Non-negotiable rules

        - the `MOCK_IM1_PAIRING` ribbon stays visible so the studio cannot be confused with the real IM1 portal
        - IM1 does not become a baseline requirement for patient sign-in, patient ownership, or grant-scoped recovery
        - no real legal names, signatories, secrets, or provider credentials belong in repo fixtures, screenshots, or logs
        - provider mock-API access, unsupported-test evidence, or supplier queue acceptance never imply live booking truth
        - real-provider mutation stays blocked until `ALLOW_REAL_PROVIDER_MUTATION=true` and the live-gate checklist is green
        """
    )
    write_text(README_PATH, readme)


def main() -> None:
    inputs = ensure_inputs()
    pack = build_pack(inputs)

    write_json(PACK_JSON_PATH, pack)
    write_csv(STAGE_MATRIX_PATH, build_stage_csv_rows(pack["stage_rows"]))
    write_json(
        FIELD_MAP_PATH,
        {
            "task_id": TASK_ID,
            "visual_mode": VISUAL_MODE,
            "mission": MISSION,
            "generated_at": pack["generated_at"],
            "source_precedence": SOURCE_PRECEDENCE,
            "official_guidance": OFFICIAL_GUIDANCE,
            "fields": pack["fields"],
            "assumptions": ASSUMPTIONS,
            "summary": {
                "field_count": len(pack["fields"]),
                "exact_public_field_count": len([row for row in pack["fields"] if row["origin_class"] == "exact_public_form"]),
                "derived_field_count": len([row for row in pack["fields"] if row["origin_class"] != "exact_public_form"]),
                "phase0_entry_verdict": pack["phase0_verdict"],
            },
        },
    )
    write_csv(SCAL_MATRIX_PATH, build_scal_csv_rows(pack["artifacts"]))
    write_json(PROVIDER_REGISTER_PATH, pack["provider_register"])
    write_json(LIVE_GATE_PATH, pack["live_gate_pack"])
    write_docs(pack)
    write_readme(pack)
    write_json(APP_PACK_JSON_PATH, pack)
    write_text(
        APP_PACK_TS_PATH,
        "export const im1PairingPack = "
        + json_for_js(pack)
        + " as const;\n",
    )

    print(f"{TASK_ID} build complete")


if __name__ == "__main__":
    main()
