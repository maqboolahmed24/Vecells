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
APP_DIR = ROOT / "apps" / "mock-nhs-app-onboarding-studio"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

TASK_ID = "seq_029"
CAPTURED_ON = "2026-04-09"
VISUAL_MODE = "Embedded_Channel_Atelier"
MISSION = (
    "Create the NHS App onboarding and embedded-channel execution pack with two explicit lanes: "
    "a rehearsal-grade embedded readiness studio now and a gated sandpit-to-AOS-to-release "
    "strategy later, without rebasing the deferred channel into the current baseline."
)

ELIGIBILITY_CSV_PATH = DATA_DIR / "nhs_app_eligibility_matrix.csv"
STAGE_JSON_PATH = DATA_DIR / "nhs_app_stage_progression.json"
ASSURANCE_CSV_PATH = DATA_DIR / "nhs_app_assurance_artifact_matrix.csv"
LIVE_GATES_JSON_PATH = DATA_DIR / "nhs_app_live_gate_checklist.json"

STRATEGY_DOC_PATH = DOCS_DIR / "29_nhs_app_onboarding_strategy.md"
EOI_DOC_PATH = DOCS_DIR / "29_nhs_app_expression_of_interest_and_eligibility_matrix.md"
PROGRESSION_DOC_PATH = DOCS_DIR / "29_nhs_app_sandpit_to_aos_progression_pack.md"
ASSURANCE_DOC_PATH = DOCS_DIR / "29_nhs_app_scal_and_assurance_artifact_matrix.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "29_nhs_app_live_gate_and_release_strategy.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "nhsAppPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "nhs-app-stage-progression.json"
README_PATH = APP_DIR / "README.md"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "route_family_inventory": DATA_DIR / "route_family_inventory.csv",
    "master_risk_register_csv": DATA_DIR / "master_risk_register.csv",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "nhs_login_application_field_map": DATA_DIR / "nhs_login_application_field_map.json",
    "nhs_login_live_gate_conditions": DATA_DIR / "nhs_login_live_gate_conditions.json",
    "nhs_login_capture_pack": DATA_DIR / "nhs_login_capture_pack.json",
}

SOURCE_PRECEDENCE = [
    "prompt/029.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-cards.md#Card 8: Phase 7 - Inside the NHS App (Deferred channel expansion)",
    "blueprint/phase-0-the-foundation-protocol.md#5.4 Claim, secure-link, and embedded access algorithm",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-7-inside-the-nhs-app.md#Phase 7 objective",
    "blueprint/phase-7-inside-the-nhs-app.md#NHS App channel priorities",
    "blueprint/phase-7-inside-the-nhs-app.md#Additional NHS App channel priorities",
    "blueprint/phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
    "blueprint/phase-7-inside-the-nhs-app.md#7C. NHS App SSO bridge and local session continuity",
    "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
    "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
    "blueprint/phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX",
    "blueprint/phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
    "blueprint/platform-frontend-blueprint.md",
    "blueprint/patient-portal-experience-architecture-blueprint.md",
    "blueprint/accessibility-and-content-system-contract.md",
    "blueprint/ux-quiet-clarity-redesign.md",
    "blueprint/forensic-audit-findings.md#Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane",
    "blueprint/forensic-audit-findings.md#Finding 120 - Patient-facing degraded mode could still fragment across entry, section, recovery, embedded, and artifact shells",
    "docs/architecture/03_deferred_and_conditional_scope.md",
    "docs/architecture/04_audience_surface_inventory.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "docs/external/25_nhs_login_environment_profile_pack.md",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/tell-us-you-want-to-integrate-with-the-nhs-app",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/contact-us",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_nhs_app_web_integration",
        "title": "NHS App web integration",
        "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The main NHS App process page defines eligibility, quarterly prioritisation, product "
            "review, solution design, sandpit before AOS delivery, SCAL plus clinical safety "
            "submission, connection agreement, limited release, full release, and post-live "
            "monthly data plus annual assurance."
        ),
        "grounding": [
            "An NHS App web integration surfaces a responsive website in the NHS App and may require interface updates for NHS accessibility and style guidance.",
            "Eligibility includes patient-facing, personalised, free-at-point-of-delivery, commissioned-in-England, procurement-framework alignment, NHS login enabled or approved, and standards compliance.",
            "Step 4 is explicit that sandpit delivery and sign-off happen before the same work is repeated in AOS.",
            "Step 4 also requires SCAL upload, clinical safety documentation, connection agreement, and incident rehearsal before go-live readiness.",
            "Post go-live requires monthly data, annual assurance, incident management, and notifying the integration manager of journey changes.",
        ],
    },
    {
        "source_id": "official_nhs_app_eoi_questions",
        "title": "Tell us you want to integrate with the NHS App",
        "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/tell-us-you-want-to-integrate-with-the-nhs-app",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The expression-of-interest page publishes the current question set, including product "
            "overview, commissioning posture, procurement frameworks, NHS login posture, demo "
            "environment, research, accessibility, messaging use-cases, throughput, and standards commitments."
        ),
        "grounding": [
            "The EOI has six sections and 35 questions.",
            "Questions cover product/service categories, commissioning evidence, procurement framework status, NHS login posture, demo environment, user research, accessibility audit, message use-cases, and message volumes.",
            "The read-and-commit section requires confirmation of standards compliance plus dedicated design and development resources.",
        ],
    },
    {
        "source_id": "official_nhs_app_standards",
        "title": "Standards for NHS App integration",
        "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The standards page makes WCAG 2.2 AA, the NHS service standard, clinical safety "
            "standards, and data privacy standards explicit, and ties evidence submission to SCAL."
        ),
        "grounding": [
            "Accessibility evidence informs decisions throughout the integration and an accessibility audit is part of step 4 evidence.",
            "All 17 points of the NHS service standard must be met.",
            "Clinical safety must cover DCB0129 and DCB0160 and be certified in SCAL.",
            "Data privacy standards are also certified in SCAL.",
        ],
    },
    {
        "source_id": "official_nhs_app_contact",
        "title": "Contact us",
        "url": "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/contact-us",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The contact page names the current NHS App integration support address and points "
            "eligible suppliers to the EOI form."
        ),
        "grounding": [
            "The NHS App team supports integration questions via app.integration@nhs.net.",
            "The contact page explicitly tells eligible suppliers to submit the EOI form.",
        ],
    },
    {
        "source_id": "official_web_integration_overview",
        "title": "Web Integration Overview",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The overview page explains that the NHS App hosts supplier journeys inside a tailored "
            "webview and uses app-managed jump-off points and custom user-agent handling."
        ),
        "grounding": [
            "The NHS App native applications host a tailored webview rather than a supplier-owned second app.",
            "The custom user agent allows suppliers to hide headers, expose NHS App specific components, and invoke JS API actions.",
            "Jump-off points are managed with the NHS App team and can be filtered by ODS visibility rules.",
        ],
    },
    {
        "source_id": "official_web_integration_guidance",
        "title": "Web Integration Guidance",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The guidance page explains user-agent and query handling, NHS login SSO with "
            "assertedLoginIdentity, site links, and webview limitations like file download and browser print."
        ),
        "grounding": [
            "Suppliers are required to hide their own header because the NHS App native header supersedes it.",
            "The guidance recommends `from=nhsApp` only as a traffic-recognition hint where there is no custom user agent.",
            "NHS login SSO hands off a JWT in the `assertedLoginIdentity` query parameter and requires `prompt=none` to the NHS login authorize endpoint.",
            "Consent denial returns `error=access_denied` with `error_description=ConsentNotGiven` and suppliers should send the user back to the NHS App home page.",
            "Site links require hosted `assetlinks.json` and `apple-app-site-association`, with environment-specific values provided by the NHS App team.",
            "Conventional file download does not work in the webview and browser print is not planned.",
        ],
    },
    {
        "source_id": "official_js_api_v2",
        "title": "Javascript API v2 Specification",
        "url": "https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The JS API page defines the bridge surface for back actions, app-page navigation, "
            "browser overlay, external browser, calendar insertion, and byte-safe file download."
        ),
        "grounding": [
            "The JS API should be loaded inline from the NHS App environment URL rather than bundled.",
            "The API exposes navigation functions including `goToPage`, `openBrowserOverlay`, and `openExternalBrowser`.",
            "The API exposes `downloadFromBytes` for file delivery and `GO_BACK` as an AppPage option.",
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
    assert_true(bool(rows), f"Cannot write empty CSV: {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_029 prerequisites: " + ", ".join(sorted(missing)))

    phase0_gate = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    integration_priority = load_json(REQUIRED_INPUTS["integration_priority_matrix"])
    external_dependencies = load_json(REQUIRED_INPUTS["external_dependencies"])
    route_rows = load_csv(REQUIRED_INPUTS["route_family_inventory"])
    risk_rows = load_csv(REQUIRED_INPUTS["master_risk_register_csv"])
    secret_map = load_json(REQUIRED_INPUTS["secret_ownership_map"])
    nhs_login_field_map = load_json(REQUIRED_INPUTS["nhs_login_application_field_map"])
    nhs_login_live_gates = load_json(REQUIRED_INPUTS["nhs_login_live_gate_conditions"])
    nhs_login_capture = load_json(REQUIRED_INPUTS["nhs_login_capture_pack"])

    route_ids = {row["route_family_id"] for row in route_rows}
    assert_true(
        "rf_patient_embedded_channel" in route_ids,
        "PREREQUISITE_GAP_SEQ029_ROUTE_FAMILY: missing rf_patient_embedded_channel",
    )

    embedded_dependency = next(
        (
            row
            for row in external_dependencies["dependencies"]
            if row["dependency_id"] == "dep_nhs_app_embedded_channel_ecosystem"
        ),
        None,
    )
    assert_true(
        embedded_dependency is not None,
        "PREREQUISITE_GAP_SEQ029_DEPENDENCY: missing dep_nhs_app_embedded_channel_ecosystem",
    )

    embedded_family = next(
        (
            row
            for row in integration_priority["integration_families"]
            if row["integration_id"] == "int_nhs_app_embedded_channel"
        ),
        None,
    )
    assert_true(
        embedded_family is not None,
        "PREREQUISITE_GAP_SEQ029_INTEGRATION_FAMILY: missing int_nhs_app_embedded_channel",
    )
    assert_true(
        embedded_family["recommended_lane"] == "deferred",
        "CONFLICT_SEQ029_SCOPE: NHS App embedded channel is not deferred in integration priority model",
    )

    phase0_entry = next(
        row for row in phase0_gate["gate_verdicts"] if row["gate_id"] == "GATE_P0_FOUNDATION_ENTRY"
    )
    assert_true(
        phase0_entry["verdict"] == "withheld",
        "CONFLICT_SEQ029_GATE: Phase 0 external-readiness gate no longer withheld",
    )

    assert_true(
        "ROLE_EMBEDDED_CHANNEL_LEAD" in secret_map["role_catalog"],
        "PREREQUISITE_GAP_SEQ029_ROLE: missing ROLE_EMBEDDED_CHANNEL_LEAD",
    )

    return {
        "phase0_gate": phase0_gate,
        "integration_priority": integration_priority,
        "external_dependencies": external_dependencies,
        "route_rows": route_rows,
        "risk_rows": risk_rows,
        "secret_map": secret_map,
        "nhs_login_field_map": nhs_login_field_map,
        "nhs_login_live_gates": nhs_login_live_gates,
        "nhs_login_capture": nhs_login_capture,
        "embedded_dependency": embedded_dependency,
        "embedded_family": embedded_family,
    }


def find_route(route_rows: list[dict[str, str]], route_id: str) -> dict[str, str]:
    return next(row for row in route_rows if row["route_family_id"] == route_id)


def bool_to_default(value: bool) -> str:
    return "true" if value else "false"


def make_fields() -> list[dict[str, Any]]:
    return [
        {
            "field_id": "q01_company_name",
            "section": "contact_information",
            "question_number": 1,
            "label": "Company name",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "Vecells",
            "placeholder": "Organisation or supplier name",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 1 question 1",
        },
        {
            "field_id": "q02_product_service_name",
            "section": "contact_information",
            "question_number": 2,
            "label": "Product or service name",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "Vecells patient portal (embedded rehearsal)",
            "placeholder": "Product or service name",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 1 question 2",
        },
        {
            "field_id": "q03_product_overview",
            "section": "contact_information",
            "question_number": 3,
            "label": "Product overview",
            "kind": "textarea",
            "required": True,
            "options": [],
            "default_value": (
                "Responsive patient portal for requests, status, booking, and pharmacy follow-up. "
                "This rehearsal pack preserves one portal with a deferred embedded shell rather than "
                "a separate NHS App product."
            ),
            "placeholder": "Short overview and optional website link",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 1 question 3",
        },
        {
            "field_id": "q04_named_contact",
            "section": "contact_information",
            "question_number": 4,
            "label": "Named contact",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "ROLE_EMBEDDED_CHANNEL_LEAD",
            "placeholder": "Named contact",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 1 question 4",
        },
        {
            "field_id": "q05_contact_email",
            "section": "contact_information",
            "question_number": 5,
            "label": "Contact email",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "embedded.channel@vecells.example",
            "placeholder": "Named contact email",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 1 question 5",
        },
        {
            "field_id": "q06_gp_patients_in_england",
            "section": "product_functionality",
            "question_number": 6,
            "label": "Serves patients registered at GP surgeries in England",
            "kind": "select",
            "required": True,
            "options": ["yes", "no"],
            "default_value": "yes",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 6",
        },
        {
            "field_id": "q07_secondary_care_patients",
            "section": "product_functionality",
            "question_number": 7,
            "label": "Serves patients receiving secondary care services in England",
            "kind": "select",
            "required": True,
            "options": ["yes", "no"],
            "default_value": "yes",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 7",
        },
        {
            "field_id": "q08_user_population",
            "section": "product_functionality",
            "question_number": 8,
            "label": "User population",
            "kind": "textarea",
            "required": True,
            "options": [],
            "default_value": (
                "Patients in England using one portal for intake, status, appointments, record views, "
                "messages, and deferred embedded-channel reuse."
            ),
            "placeholder": "General population, condition cohort, post-operative patients, etc.",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 8",
        },
        {
            "field_id": "q09_registered_patients",
            "section": "product_functionality",
            "question_number": 9,
            "label": "Registered patient count",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "pilot_placeholder",
            "placeholder": "Registered patient count",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 9",
        },
        {
            "field_id": "q10_active_users",
            "section": "product_functionality",
            "question_number": 10,
            "label": "Active patient count",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "pilot_placeholder",
            "placeholder": "Active user count",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 10",
        },
        {
            "field_id": "q11_free_at_point_of_delivery",
            "section": "product_functionality",
            "question_number": 11,
            "label": "Free to patient at point of delivery",
            "kind": "select",
            "required": True,
            "options": ["yes", "no"],
            "default_value": "yes",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 11",
        },
        {
            "field_id": "q12_public_service_desk",
            "section": "product_functionality",
            "question_number": 12,
            "label": "Public-facing service desk",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "planned"],
            "default_value": "planned",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 12",
        },
        {
            "field_id": "q13_service_categories",
            "section": "product_functionality",
            "question_number": 13,
            "label": "NHS App service categories",
            "kind": "textarea",
            "required": True,
            "options": [],
            "default_value": (
                "Medical query; Admin query; Appointments; Personal Health Records; "
                "Notifications and Messaging"
            ),
            "placeholder": "Selected NHS App service categories",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 13",
        },
        {
            "field_id": "q14_commissioned_by_nhs_body",
            "section": "product_functionality",
            "question_number": 14,
            "label": "Commissioned by NHS body or local authority in England",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "to_be_confirmed"],
            "default_value": "to_be_confirmed",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 14",
        },
        {
            "field_id": "q15_commissioning_detail",
            "section": "product_functionality",
            "question_number": 15,
            "label": "Commissioning detail",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "Commissioning bodies and connected organisations remain placeholders until scope window opens.",
            "placeholder": "List commissioners and connected organisations",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 15",
        },
        {
            "field_id": "q16_procurement_frameworks",
            "section": "product_functionality",
            "question_number": 16,
            "label": "Procurement framework posture",
            "kind": "textarea",
            "required": True,
            "options": [],
            "default_value": "Framework and procurement posture to be evidenced during real-later dossier completion.",
            "placeholder": "Applicable procurement frameworks",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 16",
        },
        {
            "field_id": "q17_framework_application_detail",
            "section": "product_functionality",
            "question_number": 17,
            "label": "Framework application detail",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "",
            "placeholder": "If in progress, explain the framework application status",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 2 question 17",
        },
        {
            "field_id": "q18_nhs_login_posture",
            "section": "product_functionality",
            "question_number": 18,
            "label": "NHS login posture",
            "kind": "select",
            "required": True,
            "options": [
                "no_plan",
                "planned_not_applied",
                "applied_waiting",
                "integrating",
                "live",
                "disabled",
                "offboarded",
            ],
            "default_value": "integrating",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "Derived from seq_024/025 mock-now posture and actual-later gating.",
        },
        {
            "field_id": "q19_nhs_login_client_id",
            "section": "product_functionality",
            "question_number": 19,
            "label": "NHS login ClientID",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "placeholder_client_id_later",
            "placeholder": "Client ID if available",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "Remains placeholder-only until live capture is explicitly allowed.",
        },
        {
            "field_id": "q20_application_type",
            "section": "technical",
            "question_number": 20,
            "label": "Application type",
            "kind": "select",
            "required": True,
            "options": ["web_application", "native_application", "hybrid_application", "other"],
            "default_value": "web_application",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "Vecells remains one responsive web portal reused in embedded mode.",
        },
        {
            "field_id": "q21_demo_environment_available",
            "section": "technical",
            "question_number": 21,
            "label": "Demo environment available",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "other"],
            "default_value": "yes",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "The mock studio is the rehearsal environment; real demo URL remains later.",
        },
        {
            "field_id": "q22_user_research_recent",
            "section": "design_delivery",
            "question_number": 22,
            "label": "User research in last 12 months",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "planned"],
            "default_value": "planned",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 4 question 22",
        },
        {
            "field_id": "q23_accessibility_audit_recent",
            "section": "design_delivery",
            "question_number": 23,
            "label": "WCAG 2.1 or 2.2 accessibility audit in last 12 months",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "planned"],
            "default_value": "planned",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 4 question 23",
        },
        {
            "field_id": "q24_accessibility_outcome",
            "section": "design_delivery",
            "question_number": 24,
            "label": "Accessibility audit outcome",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "Audit result placeholder retained until a fresh WCAG 2.2 audit is commissioned.",
            "placeholder": "Latest audit outcome and date",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 4 question 24",
        },
        {
            "field_id": "q25_message_types",
            "section": "messaging",
            "question_number": 25,
            "label": "Message types",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": (
                "Individual messages; Message with reply option; Message with link to onward journey; "
                "Time-sensitive messages"
            ),
            "placeholder": "Selected message types",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 25",
        },
        {
            "field_id": "q26_message_use_cases",
            "section": "messaging",
            "question_number": 26,
            "label": "Message use cases",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "Responses to patient requests; appointment confirmations; questionnaires",
            "placeholder": "Message use cases",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 26",
        },
        {
            "field_id": "q27_primary_channel",
            "section": "messaging",
            "question_number": 27,
            "label": "NHS App primary communication channel",
            "kind": "select",
            "required": False,
            "options": ["yes", "no"],
            "default_value": "no",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 27. The deferred NHS App channel must not be claimed as the current primary channel.",
        },
        {
            "field_id": "q28_primary_channel_if_no",
            "section": "messaging",
            "question_number": 28,
            "label": "Primary channel if not NHS App",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "browser_web_patient_portal",
            "placeholder": "Current primary channel",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 28",
        },
        {
            "field_id": "q29_multichannel_policy",
            "section": "messaging",
            "question_number": 29,
            "label": "Multi-channel communication policy",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": (
                "NHS App remains a deferred embedded channel. Email, SMS, letter, and browser surfaces "
                "stay governed by route family, communication envelope, and degraded-mode policy."
            ),
            "placeholder": "How different channels are used",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 29",
        },
        {
            "field_id": "q30_average_daily_messages",
            "section": "messaging",
            "question_number": 30,
            "label": "Average daily message volume",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "volume_placeholder",
            "placeholder": "Average daily messages",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 30",
        },
        {
            "field_id": "q31_peak_daily_messages",
            "section": "messaging",
            "question_number": 31,
            "label": "Peak single-day message volume",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "volume_placeholder",
            "placeholder": "Peak single-day messages",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 31",
        },
        {
            "field_id": "q32_peak_tps",
            "section": "messaging",
            "question_number": 32,
            "label": "Average and peak throughput per second",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "tps_placeholder",
            "placeholder": "Average and peak TPS",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 32",
        },
        {
            "field_id": "q33_message_pattern",
            "section": "messaging",
            "question_number": 33,
            "label": "Message sending pattern",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "Pattern placeholder retained for later operational modelling.",
            "placeholder": "Pattern of sending",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 33",
        },
        {
            "field_id": "q34_message_volume_change",
            "section": "messaging",
            "question_number": 34,
            "label": "Expected message volume change over next year",
            "kind": "textarea",
            "required": False,
            "options": [],
            "default_value": "Volume-change placeholder retained until limited-release planning is explicit.",
            "placeholder": "Expected change over next year",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "EOI section 5 question 34",
        },
        {
            "field_id": "q35_standards_commitment",
            "section": "read_and_commit",
            "question_number": 35,
            "label": "Standards and delivery commitment confirmed",
            "kind": "select",
            "required": True,
            "options": ["yes", "no", "planned"],
            "default_value": "planned",
            "placeholder": "",
            "source_ref": "official_nhs_app_eoi_questions",
            "notes": "The live-later path requires explicit commitment to standards and dedicated resourcing.",
        },
        {
            "field_id": "int01_solution_design_doc",
            "section": "internal_design",
            "question_number": None,
            "label": "Solution design dossier ref",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "docs/external/29_nhs_app_onboarding_strategy.md",
            "placeholder": "Solution design doc ref",
            "source_ref": "blueprint/phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
            "notes": "Internal pack pointer for solution-design preparation.",
        },
        {
            "field_id": "int02_embedded_route_manifest_hash",
            "section": "internal_design",
            "question_number": None,
            "label": "Embedded route manifest hash",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "manifest_placeholder_v1",
            "placeholder": "Manifest digest or hash",
            "source_ref": "blueprint/phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
            "notes": "Tracks the immutable route manifest shape used for sandpit and AOS rehearsal.",
        },
        {
            "field_id": "int03_bridge_capability_matrix",
            "section": "internal_design",
            "question_number": None,
            "label": "Bridge capability matrix ref",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "bridge_matrix_preview_v1",
            "placeholder": "Bridge capability matrix ref",
            "source_ref": "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
            "notes": "Tracks embedded JS API and safe-browser fallback posture.",
        },
        {
            "field_id": "int04_hidden_header_review",
            "section": "internal_design",
            "question_number": None,
            "label": "Hidden supplier header review",
            "kind": "select",
            "required": True,
            "options": ["complete", "in_progress", "not_started"],
            "default_value": "complete",
            "placeholder": "",
            "source_ref": "official_web_integration_guidance",
            "notes": "Header suppression is required for embedded mode.",
        },
        {
            "field_id": "int05_secure_return_contract",
            "section": "internal_design",
            "question_number": None,
            "label": "Secure return contract",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "safe_return_contract_v1",
            "placeholder": "Return-safe contract ref",
            "source_ref": "blueprint/phase-7-inside-the-nhs-app.md#7D. Deep links, site links, and return-to-journey continuity",
            "notes": "Outward and return navigation must stay route-scoped and scrubbed.",
        },
        {
            "field_id": "int06_demo_environment_url",
            "section": "internal_delivery",
            "question_number": None,
            "label": "Demo environment URL",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "http://127.0.0.1:4180/",
            "placeholder": "Demo environment URL",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "Mock studio acts as rehearsal demo environment now; real environment later stays gated.",
        },
        {
            "field_id": "int07_sandpit_target",
            "section": "internal_delivery",
            "question_number": None,
            "label": "Sandpit target environment",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "sandpit_placeholder.vecells.example",
            "placeholder": "Sandpit target URL",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "Step 4 starts in sandpit and repeats in AOS after sign-off.",
        },
        {
            "field_id": "int08_aos_target",
            "section": "internal_delivery",
            "question_number": None,
            "label": "AOS target environment",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "aos_placeholder.vecells.example",
            "placeholder": "AOS target URL",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "AOS values remain placeholders until the NHS App team opens the environment.",
        },
        {
            "field_id": "int09_limited_release_target",
            "section": "internal_delivery",
            "question_number": None,
            "label": "Limited release cohort",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "limited_release_placeholder",
            "placeholder": "Limited release target cohort",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "Implementation approach must distinguish limited versus full release populations.",
        },
        {
            "field_id": "int10_monthly_data_owner",
            "section": "internal_delivery",
            "question_number": None,
            "label": "Monthly data owner",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "ROLE_EMBEDDED_CHANNEL_LEAD",
            "placeholder": "Monthly data owner",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "Post-live monthly data is required.",
        },
        {
            "field_id": "int11_annual_assurance_owner",
            "section": "internal_delivery",
            "question_number": None,
            "label": "Annual assurance owner",
            "kind": "text",
            "required": True,
            "options": [],
            "default_value": "ROLE_PROGRAMME_ARCHITECT",
            "placeholder": "Annual assurance owner",
            "source_ref": "official_nhs_app_web_integration",
            "notes": "Annual assurance with NHS App and NHS login runs together.",
        },
        {
            "field_id": "int12_named_approver",
            "section": "live_controls",
            "question_number": None,
            "label": "Named approver",
            "kind": "text",
            "required": False,
            "options": [],
            "default_value": "",
            "placeholder": "Named approver required for live mutation",
            "source_ref": "prompt/029.md",
            "notes": "Live gate input only.",
        },
        {
            "field_id": "int13_environment_target",
            "section": "live_controls",
            "question_number": None,
            "label": "Target environment",
            "kind": "select",
            "required": False,
            "options": ["sandpit", "aos", "limited_release", "full_release"],
            "default_value": "",
            "placeholder": "",
            "source_ref": "prompt/029.md",
            "notes": "Live gate input only.",
        },
        {
            "field_id": "int14_allow_real_provider_mutation",
            "section": "live_controls",
            "question_number": None,
            "label": "ALLOW_REAL_PROVIDER_MUTATION",
            "kind": "select",
            "required": False,
            "options": ["false", "true"],
            "default_value": "false",
            "placeholder": "",
            "source_ref": "prompt/029.md",
            "notes": "Live gate input only.",
        },
    ]


def build_pack(inputs: dict[str, Any]) -> dict[str, Any]:
    route_rows = inputs["route_rows"]
    phase0_gate = inputs["phase0_gate"]
    fields = make_fields()

    route_ids = [
        "rf_intake_self_service",
        "rf_patient_secure_link_recovery",
        "rf_patient_requests",
        "rf_patient_appointments",
        "rf_patient_health_record",
        "rf_patient_messages",
    ]

    preview_routes = [
        {
            "preview_id": "preview_start_request",
            "title": "Start request",
            "route_family_ref": "rf_intake_self_service",
            "entry_path": "/start-request",
            "selected_anchor": "start_request_cta",
            "standalone_state": "full header, footer, and browser-safe supporting copy",
            "embedded_state": "header suppressed, embedded strip active, same route intent and summary preserved",
            "continuity_rule": "Must reuse the same intake contract and freeze on stale embedded manifest or release tuple drift.",
            "safe_navigation": "Native back or GO_BACK only through bridge eligibility; browser handoff remains explicit and scrubbed.",
            "artifact_rule": "Summary-only receipt and safe-browser fallback if byte delivery is unsupported.",
            "degraded_mode": "placeholder_only or safe_browser_handoff when embedded proof falls below trust posture",
            "testid": "preview-route-start-request",
        },
        {
            "preview_id": "preview_resume_request",
            "title": "Resume secure-link request",
            "route_family_ref": "rf_patient_secure_link_recovery",
            "entry_path": "/continue/request/:grantToken",
            "selected_anchor": "secure_link_resume",
            "standalone_state": "summary-first secure-link recovery with re-auth path",
            "embedded_state": "same secure-link recovery shell with embedded continuity checks and no second resume model",
            "continuity_rule": "Grant redemption, session epoch, and embedded continuity must agree before writable continuation renders.",
            "safe_navigation": "Return stays route-bound; denied consent reopens safe explanatory copy instead of a generic login loop.",
            "artifact_rule": "Attachments stay in-shell summary-first until byte-safe transfer is explicitly permitted.",
            "degraded_mode": "identity_hold, read_only, or safe_browser_handoff",
            "testid": "preview-route-resume-request",
        },
        {
            "preview_id": "preview_request_status",
            "title": "Request status",
            "route_family_ref": "rf_patient_requests",
            "entry_path": "/requests/:requestId",
            "selected_anchor": "request_status_summary",
            "standalone_state": "request timeline and next safe action",
            "embedded_state": "same request shell with hidden supplier header and embedded capability guards",
            "continuity_rule": "Selected request anchor must survive refresh, re-entry, and route freeze in the same shell.",
            "safe_navigation": "GO_BACK and home routes stay capability-negotiated; no raw outbound URLs.",
            "artifact_rule": "Route-scoped artifact presentation decides preview, byte delivery, or placeholder.",
            "degraded_mode": "read_only or placeholder_only if manifest or bridge capability drifts",
            "testid": "preview-route-request-status",
        },
        {
            "preview_id": "preview_manage_appointment",
            "title": "Manage appointment",
            "route_family_ref": "rf_patient_appointments",
            "entry_path": "/appointments/:appointmentId/manage",
            "selected_anchor": "appointment_manage_panel",
            "standalone_state": "manage controls and route intent under normal browser posture",
            "embedded_state": "same route family with embedded strip chrome and frozen controls when eligibility drops",
            "continuity_rule": "Selected slot, manage provenance, and return contract remain visible if mutation freezes.",
            "safe_navigation": "Calendar and external actions stay bridge-mediated and route-scoped.",
            "artifact_rule": "Calendar and confirmation delivery use byte-safe or controlled external fallback only.",
            "degraded_mode": "safe_browser_handoff or read_only with preserved appointment summary",
            "testid": "preview-route-manage-appointment",
        },
        {
            "preview_id": "preview_record_artifact",
            "title": "Health record artifact",
            "route_family_ref": "rf_patient_health_record",
            "entry_path": "/records/:artifactId",
            "selected_anchor": "artifact_summary_panel",
            "standalone_state": "summary-first record or document view",
            "embedded_state": "same record shell with byte-safe preview and no print assumptions",
            "continuity_rule": "ArtifactModeTruthProjection decides preview, bytes, or fallback under one current truth tuple.",
            "safe_navigation": "External viewer only via OutboundNavigationGrant and scrubbed destination.",
            "artifact_rule": "Print is never assumed; byte delivery requires explicit bridge capability.",
            "degraded_mode": "summary_only or secure_send_later placeholder",
            "testid": "preview-route-record-artifact",
        },
        {
            "preview_id": "preview_messages",
            "title": "Messages and callback thread",
            "route_family_ref": "rf_patient_messages",
            "entry_path": "/messages/:threadId",
            "selected_anchor": "message_thread_summary",
            "standalone_state": "message thread with reply or acknowledge posture",
            "embedded_state": "same thread shell with header suppressed and route-bound return safety",
            "continuity_rule": "Embedded reply remains live only while route, session, and embedded continuity all match.",
            "safe_navigation": "External escalation and browser overlay remain explicitly allowlisted.",
            "artifact_rule": "Message attachments remain summary-first; unsafe browser-only flows are replaced by governed fallback.",
            "degraded_mode": "placeholder_only, read_only, or recovery_required",
            "testid": "preview-route-messages",
        },
    ]

    eligibility_rows = [
        {
            "criterion_id": "crit_patient_population_england",
            "criterion_label": "Serves patients registered with GP or secondary care services in England",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "review_required",
            "linked_field_ids": "q06_gp_patients_in_england;q07_secondary_care_patients;q08_user_population",
            "linked_artifact_ids": "art_journey_inventory;art_solution_design",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "Product scope supports England patient populations, but real commissioning detail stays later-gated.",
        },
        {
            "criterion_id": "crit_patient_facing_personalised",
            "criterion_label": "Provides a patient-facing personalised service, not generic health information",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "evidenced",
            "linked_field_ids": "q03_product_overview;q13_service_categories",
            "linked_artifact_ids": "art_journey_inventory",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "The route inventory is patient-personalised and same-portal.",
        },
        {
            "criterion_id": "crit_free_at_point_of_delivery",
            "criterion_label": "Free to patient at point of delivery",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "review_required",
            "linked_field_ids": "q11_free_at_point_of_delivery",
            "linked_artifact_ids": "art_eoi_dossier",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "Modelled as yes, but real commercial or local charging evidence remains outside the repo.",
        },
        {
            "criterion_id": "crit_commissioned_in_england",
            "criterion_label": "Commissioned by NHS body or local authority in England",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "blocked",
            "linked_field_ids": "q14_commissioned_by_nhs_body;q15_commissioning_detail",
            "linked_artifact_ids": "art_eligibility_evidence_pack",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "Current pack keeps commissioner posture explicit instead of inventing it.",
        },
        {
            "criterion_id": "crit_procurement_framework_alignment",
            "criterion_label": "Aligned to at least one recognised procurement framework",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q16_procurement_frameworks;q17_framework_application_detail",
            "linked_artifact_ids": "art_eligibility_evidence_pack",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "Framework status is modelled as dossier evidence, not assumed.",
        },
        {
            "criterion_id": "crit_nhs_login_enabled_or_approved",
            "criterion_label": "Integrated with NHS login or approved for NHS login integration",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "review_required",
            "linked_field_ids": "q18_nhs_login_posture;q19_nhs_login_client_id",
            "linked_artifact_ids": "art_nhs_login_dependency_summary",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions;docs/external/24_nhs_login_actual_onboarding_strategy.md",
            "notes": "Seq_024/025 created the prerequisite strategy, but real live approval remains gated.",
        },
        {
            "criterion_id": "crit_standards_commitment",
            "criterion_label": "Can meet NHS App standards and requirements",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "review_required",
            "linked_field_ids": "q35_standards_commitment",
            "linked_artifact_ids": "art_accessibility_audit;art_clinical_safety_bundle;art_privacy_and_service_standard",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_standards;official_nhs_app_eoi_questions",
            "notes": "The commitment is modelled now; fresh signed evidence remains later.",
        },
        {
            "criterion_id": "crit_public_service_desk",
            "criterion_label": "Public-facing service desk exists",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q12_public_service_desk",
            "linked_artifact_ids": "art_service_support_pack",
            "source_refs": "official_nhs_app_eoi_questions;official_nhs_app_web_integration",
            "notes": "The operating model is modelled, but public-facing evidence remains a live-gate concern.",
        },
        {
            "criterion_id": "crit_demo_environment",
            "criterion_label": "Demo environment available to NHS App team",
            "criterion_class": "official_eligibility",
            "mock_now_status": "evidenced",
            "actual_later_status": "review_required",
            "linked_field_ids": "q21_demo_environment_available;int06_demo_environment_url",
            "linked_artifact_ids": "art_demo_environment_brief",
            "source_refs": "official_nhs_app_eoi_questions;official_nhs_app_web_integration",
            "notes": "Mock environment exists now; real-accessible environment remains later-gated.",
        },
        {
            "criterion_id": "crit_recent_user_research",
            "criterion_label": "Recent user research",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q22_user_research_recent",
            "linked_artifact_ids": "art_research_pack",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Placeholder kept visible rather than silently omitted.",
        },
        {
            "criterion_id": "crit_recent_accessibility_audit",
            "criterion_label": "Recent WCAG accessibility audit",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q23_accessibility_audit_recent;q24_accessibility_outcome",
            "linked_artifact_ids": "art_accessibility_audit",
            "source_refs": "official_nhs_app_eoi_questions;official_nhs_app_standards",
            "notes": "The pack plans the audit and evidence lane, but does not fabricate an audit outcome.",
        },
        {
            "criterion_id": "crit_dedicated_design_resource",
            "criterion_label": "Dedicated design resource during integration",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q35_standards_commitment",
            "linked_artifact_ids": "art_design_capacity_plan",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Explicitly recorded as a requirement in the live gate.",
        },
        {
            "criterion_id": "crit_dedicated_development_resource",
            "criterion_label": "Dedicated development team during integration",
            "criterion_class": "official_eligibility",
            "mock_now_status": "gap_captured",
            "actual_later_status": "review_required",
            "linked_field_ids": "q35_standards_commitment",
            "linked_artifact_ids": "art_delivery_capacity_plan",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Explicitly recorded as a requirement in the live gate.",
        },
        {
            "criterion_id": "crit_one_portal_two_shells",
            "criterion_label": "One portal, two shells, zero forks",
            "criterion_class": "blueprint_law",
            "mock_now_status": "evidenced",
            "actual_later_status": "pass",
            "linked_field_ids": "int01_solution_design_doc;int02_embedded_route_manifest_hash",
            "linked_artifact_ids": "art_solution_design;art_route_manifest",
            "source_refs": "blueprint/phase-7-inside-the-nhs-app.md#Rule 1: one portal, two shells, zero forks.;docs/architecture/03_deferred_and_conditional_scope.md",
            "notes": "This closes the separate-product gap.",
        },
        {
            "criterion_id": "crit_deferred_scope_boundary",
            "criterion_label": "Deferred NHS App channel does not become current-baseline scope",
            "criterion_class": "blueprint_law",
            "mock_now_status": "evidenced",
            "actual_later_status": "blocked_until_scope_window",
            "linked_field_ids": "q27_primary_channel;int09_limited_release_target",
            "linked_artifact_ids": "art_scope_boundary_guard",
            "source_refs": "docs/architecture/03_deferred_and_conditional_scope.md;docs/external/21_integration_priority_and_execution_matrix.md",
            "notes": "The rehearsal studio is explicitly future-channel preparation only.",
        },
        {
            "criterion_id": "crit_embedded_route_parity",
            "criterion_label": "Embedded preview stays on the same route families as standalone web",
            "criterion_class": "blueprint_law",
            "mock_now_status": "evidenced",
            "actual_later_status": "pass",
            "linked_field_ids": "int02_embedded_route_manifest_hash;int05_secure_return_contract",
            "linked_artifact_ids": "art_route_manifest;art_embedded_preview_board",
            "source_refs": "blueprint/phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack;docs/architecture/04_audience_surface_inventory.md",
            "notes": "The preview routes are tied to canonical route families and return contracts.",
        },
        {
            "criterion_id": "crit_webview_safe_artifact_behaviour",
            "criterion_label": "Embedded artifact and error behaviour stays webview-safe",
            "criterion_class": "blueprint_law",
            "mock_now_status": "evidenced",
            "actual_later_status": "pass",
            "linked_field_ids": "int03_bridge_capability_matrix;int05_secure_return_contract",
            "linked_artifact_ids": "art_embedded_preview_board;art_incident_rehearsal_pack",
            "source_refs": "official_web_integration_guidance;official_js_api_v2;blueprint/phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX",
            "notes": "Print is never assumed and file download is gated to byte-safe delivery.",
        },
    ]

    assurance_artifacts = [
        {
            "artifact_id": "art_eoi_dossier",
            "artifact_name": "Expression of interest dossier",
            "artifact_family": "eligibility",
            "required_stage_ids": "nhs_app_stage_eoi_eligibility;nhs_app_stage_product_review",
            "owner_role": "ROLE_EMBEDDED_CHANNEL_LEAD",
            "mock_now_status": "generated",
            "actual_later_status": "placeholder",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_eoi_questions;official_nhs_app_web_integration",
            "notes": "Mock dossier exists now; real portal submission remains blocked.",
        },
        {
            "artifact_id": "art_eligibility_evidence_pack",
            "artifact_name": "Eligibility evidence pack",
            "artifact_family": "eligibility",
            "required_stage_ids": "nhs_app_stage_eoi_eligibility;nhs_app_stage_product_review",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "mock_now_status": "generated",
            "actual_later_status": "partial",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "Captures commissioning, framework, and patient-facing eligibility evidence.",
        },
        {
            "artifact_id": "art_nhs_login_dependency_summary",
            "artifact_name": "NHS login dependency summary",
            "artifact_family": "identity_dependency",
            "required_stage_ids": "nhs_app_stage_eoi_eligibility;nhs_app_stage_solution_design",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "docs/external/24_nhs_login_actual_onboarding_strategy.md;docs/external/25_nhs_login_environment_profile_pack.md",
            "notes": "Links NHS App onboarding to seq_024 and seq_025 rather than duplicating identity logic.",
        },
        {
            "artifact_id": "art_route_manifest",
            "artifact_name": "NHS App route manifest and jump-off inventory",
            "artifact_family": "solution_design",
            "required_stage_ids": "nhs_app_stage_solution_design;nhs_app_stage_sandpit_delivery;nhs_app_stage_aos_delivery",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "yes",
            "source_refs": "blueprint/phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
            "notes": "Manifest must stay pinned to release tuple and environment values.",
        },
        {
            "artifact_id": "art_solution_design",
            "artifact_name": "Solution design document",
            "artifact_family": "solution_design",
            "required_stage_ids": "nhs_app_stage_solution_design",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "The NHS App technical team expects a solution design document in step 3.",
        },
        {
            "artifact_id": "art_embedded_preview_board",
            "artifact_name": "Embedded preview board",
            "artifact_family": "design_readiness",
            "required_stage_ids": "nhs_app_stage_solution_design;nhs_app_stage_sandpit_delivery",
            "owner_role": "ROLE_EMBEDDED_CHANNEL_LEAD",
            "mock_now_status": "generated",
            "actual_later_status": "generated",
            "browser_automation_possible": "yes",
            "source_refs": "blueprint/phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",
            "notes": "Proves hidden header, embedded-safe navigation, and route parity before real environments exist.",
        },
        {
            "artifact_id": "art_demo_environment_brief",
            "artifact_name": "Demo environment brief",
            "artifact_family": "demo_readiness",
            "required_stage_ids": "nhs_app_stage_product_review;nhs_app_stage_sandpit_delivery",
            "owner_role": "ROLE_EMBEDDED_CHANNEL_LEAD",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "yes",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_eoi_questions",
            "notes": "The NHS App team reviews the product assessment on the demo environment.",
        },
        {
            "artifact_id": "art_research_pack",
            "artifact_name": "Recent user research pack",
            "artifact_family": "design_readiness",
            "required_stage_ids": "nhs_app_stage_product_review",
            "owner_role": "ROLE_PRODUCT_LEAD",
            "mock_now_status": "placeholder",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Explicit placeholder keeps the gap visible.",
        },
        {
            "artifact_id": "art_accessibility_audit",
            "artifact_name": "WCAG 2.2 accessibility audit",
            "artifact_family": "assurance",
            "required_stage_ids": "nhs_app_stage_product_review;nhs_app_stage_scal_assurance;nhs_app_stage_full_release",
            "owner_role": "ROLE_ACCESSIBILITY_LEAD",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_standards;official_nhs_app_eoi_questions",
            "notes": "Required by standards page and reviewed during step 4 evidence submission.",
        },
        {
            "artifact_id": "art_service_support_pack",
            "artifact_name": "NHS Service Support Guidance pack",
            "artifact_family": "operational_readiness",
            "required_stage_ids": "nhs_app_stage_solution_design;nhs_app_stage_scal_assurance;nhs_app_stage_limited_release",
            "owner_role": "ROLE_SUPPORT_LEAD",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "Service Management schedules the support guidance walkthrough in step 3.",
        },
        {
            "artifact_id": "art_implementation_approach",
            "artifact_name": "Implementation approach document",
            "artifact_family": "release_readiness",
            "required_stage_ids": "nhs_app_stage_solution_design;nhs_app_stage_limited_release",
            "owner_role": "ROLE_RELEASE_MANAGER",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "Must include limited versus full release rationale.",
        },
        {
            "artifact_id": "art_clinical_safety_bundle",
            "artifact_name": "Clinical safety bundle (DCB0129/DCB0160)",
            "artifact_family": "assurance",
            "required_stage_ids": "nhs_app_stage_scal_assurance;nhs_app_stage_connection_agreement",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_standards;official_nhs_app_web_integration",
            "notes": "Uploaded through SCAL and reviewed before go-live.",
        },
        {
            "artifact_id": "art_privacy_and_service_standard",
            "artifact_name": "Privacy and NHS service standard bundle",
            "artifact_family": "assurance",
            "required_stage_ids": "nhs_app_stage_scal_assurance;nhs_app_stage_connection_agreement",
            "owner_role": "ROLE_DPO",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_standards",
            "notes": "Includes GDPR, PECR, and service-standard evidence.",
        },
        {
            "artifact_id": "art_scal_workspace",
            "artifact_name": "SCAL workspace and upload map",
            "artifact_family": "assurance",
            "required_stage_ids": "nhs_app_stage_scal_assurance",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "mock_now_status": "generated",
            "actual_later_status": "review_required",
            "browser_automation_possible": "partial",
            "source_refs": "official_nhs_app_web_integration;official_nhs_app_standards",
            "notes": "Maps each evidence family to its SCAL position.",
        },
        {
            "artifact_id": "art_incident_rehearsal_pack",
            "artifact_name": "Incident rehearsal pack",
            "artifact_family": "operational_readiness",
            "required_stage_ids": "nhs_app_stage_sandpit_delivery;nhs_app_stage_aos_delivery;nhs_app_stage_limited_release",
            "owner_role": "ROLE_SUPPORT_LEAD",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "Step 4 requires an incident rehearsal with the service management team.",
        },
        {
            "artifact_id": "art_connection_agreement",
            "artifact_name": "Connection agreement readiness pack",
            "artifact_family": "release_readiness",
            "required_stage_ids": "nhs_app_stage_connection_agreement",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "mock_now_status": "placeholder",
            "actual_later_status": "blocked",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_web_integration",
            "notes": "Contract signature remains a human-only later gate.",
        },
        {
            "artifact_id": "art_design_capacity_plan",
            "artifact_name": "Dedicated design resource plan",
            "artifact_family": "delivery_capacity",
            "required_stage_ids": "nhs_app_stage_product_review;nhs_app_stage_solution_design",
            "owner_role": "ROLE_PRODUCT_LEAD",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Explicit requirement in the EOI read-and-commit step.",
        },
        {
            "artifact_id": "art_delivery_capacity_plan",
            "artifact_name": "Dedicated development resource plan",
            "artifact_family": "delivery_capacity",
            "required_stage_ids": "nhs_app_stage_product_review;nhs_app_stage_solution_design",
            "owner_role": "ROLE_RELEASE_MANAGER",
            "mock_now_status": "planned",
            "actual_later_status": "review_required",
            "browser_automation_possible": "no",
            "source_refs": "official_nhs_app_eoi_questions",
            "notes": "Explicit requirement in the EOI read-and-commit step.",
        },
        {
            "artifact_id": "art_scope_boundary_guard",
            "artifact_name": "Deferred scope boundary guard",
            "artifact_family": "scope_control",
            "required_stage_ids": "nhs_app_stage_eoi_eligibility;nhs_app_stage_full_release",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "mock_now_status": "generated",
            "actual_later_status": "pass",
            "browser_automation_possible": "no",
            "source_refs": "docs/architecture/03_deferred_and_conditional_scope.md;docs/external/21_integration_priority_and_execution_matrix.md",
            "notes": "Prevents NHS App work from becoming a hidden current-baseline gate.",
        },
    ]

    stage_categories = [
        {
            "category_id": "eligibility",
            "label": "Eligibility",
            "stage_ids": ["nhs_app_stage_eoi_eligibility"],
            "stage_count": 1,
            "blocked_message": "Eligibility remains a rehearsed dossier until commissioner, framework, and NHS login evidence are current.",
        },
        {
            "category_id": "review",
            "label": "Review",
            "stage_ids": ["nhs_app_stage_product_review"],
            "stage_count": 1,
            "blocked_message": "Product review is a real NHS App team checkpoint; mock rehearsals can prepare but not complete it.",
        },
        {
            "category_id": "design",
            "label": "Design",
            "stage_ids": ["nhs_app_stage_solution_design", "nhs_app_stage_embedded_readiness"],
            "stage_count": 2,
            "blocked_message": "Design readiness must keep one portal and one route family map across standalone and embedded shells.",
        },
        {
            "category_id": "sandpit",
            "label": "Sandpit",
            "stage_ids": ["nhs_app_stage_sandpit_delivery", "nhs_app_stage_sandpit_signoff"],
            "stage_count": 2,
            "blocked_message": "Official sandpit access is later-gated; the studio rehearses the evidence and demo pack now.",
        },
        {
            "category_id": "aos",
            "label": "AOS",
            "stage_ids": ["nhs_app_stage_aos_delivery", "nhs_app_stage_aos_signoff"],
            "stage_count": 2,
            "blocked_message": "AOS repeats the sandpit delivery and sign-off path and cannot start before sandpit sign-off.",
        },
        {
            "category_id": "assurance",
            "label": "Assurance",
            "stage_ids": ["nhs_app_stage_scal_assurance", "nhs_app_stage_connection_agreement"],
            "stage_count": 2,
            "blocked_message": "SCAL, clinical safety, privacy, and connection agreement remain human-reviewed gates.",
        },
        {
            "category_id": "release",
            "label": "Release",
            "stage_ids": [
                "nhs_app_stage_limited_release",
                "nhs_app_stage_full_release",
                "nhs_app_stage_post_live_assurance",
            ],
            "stage_count": 3,
            "blocked_message": "Release widening requires the NHS App team, limited-release telemetry, and post-live operational evidence.",
        },
    ]

    stages = [
        {
            "nhs_app_stage_id": "nhs_app_stage_eoi_eligibility",
            "nhs_app_stage_name": "EOI eligibility and dossier prep",
            "category_id": "eligibility",
            "entry_requirements": [
                "Phase 7 remains deferred but inventoried.",
                "One portal / two shell discipline accepted.",
                "EOI field map completed enough for internal review.",
            ],
            "required_documents": [
                "Expression of interest dossier",
                "Eligibility evidence pack",
                "Deferred scope boundary guard",
                "NHS login dependency summary",
            ],
            "demo_expectations": [
                "Internal walkthrough of the onboarding studio.",
                "Demonstrate that deferred channel posture is explicit and not a current-baseline gate.",
            ],
            "technical_expectations": [
                "Web application posture remains primary.",
                "Route families and embedded preview map exist.",
                "NHS login dependency posture is referenced rather than duplicated.",
            ],
            "design_expectations": [
                "Premium internal rehearsal surface exists.",
                "Embedded preview does not imitate the NHS App too closely.",
            ],
            "browser_automation_possible": "yes",
            "mock_now_action": "Complete the internal EOI dossier, score eligibility gaps, and rehearse the same question set without touching the live form.",
            "actual_later_action": "Submit the real EOI only after eligibility, commissioning, NHS login, named approver, and scope-window gates pass.",
            "blocking_dependencies": [
                "dep_nhs_app_embedded_channel_ecosystem",
                "LIVE_GATE_PHASE7_SCOPE_WINDOW",
                "LIVE_GATE_COMMISSIONING_EXPLICIT",
            ],
            "notes": "EOI prep is useful now, but real submission remains blocked because the embedded channel is deferred and commissioner posture is still placeholder-only.",
            "required_field_ids": [
                "q01_company_name",
                "q02_product_service_name",
                "q03_product_overview",
                "q04_named_contact",
                "q05_contact_email",
                "q06_gp_patients_in_england",
                "q08_user_population",
                "q11_free_at_point_of_delivery",
                "q13_service_categories",
                "q14_commissioned_by_nhs_body",
                "q18_nhs_login_posture",
                "q20_application_type",
                "q21_demo_environment_available",
                "q35_standards_commitment",
            ],
            "required_artifact_ids": [
                "art_eoi_dossier",
                "art_eligibility_evidence_pack",
                "art_scope_boundary_guard",
                "art_nhs_login_dependency_summary",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_product_review",
            "nhs_app_stage_name": "Product review and prioritisation",
            "category_id": "review",
            "entry_requirements": [
                "EOI reviewed and refined.",
                "Demo environment brief exists.",
                "Public-facing and personalised service posture is defensible.",
            ],
            "required_documents": [
                "Demo environment brief",
                "Recent user research pack",
                "Dedicated design resource plan",
                "Dedicated development resource plan",
            ],
            "demo_expectations": [
                "Show current patient routes and why they fit the NHS App.",
                "Explain the future embedded path without claiming separate-product scope.",
            ],
            "technical_expectations": [
                "Same backend and route-family logic as web.",
                "NHS login dependency posture is clear.",
            ],
            "design_expectations": [
                "Mobile-aware flows are calm, exact, and embedded-safe.",
                "Header suppression and same-shell continuity are demonstrable.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Run internal product review with the studio, preview routes, and readiness chips.",
            "actual_later_action": "Attend product review call and prioritisation with the NHS App team after the EOI is accepted.",
            "blocking_dependencies": [
                "LIVE_GATE_COMMISSIONING_EXPLICIT",
                "LIVE_GATE_PATIENT_ELIGIBILITY_EXPLICIT",
            ],
            "notes": "This stage includes a real demo and prioritisation call with quarterly capacity decisions by the NHS App team.",
            "required_field_ids": [
                "q12_public_service_desk",
                "q21_demo_environment_available",
                "q22_user_research_recent",
                "q23_accessibility_audit_recent",
                "q35_standards_commitment",
            ],
            "required_artifact_ids": [
                "art_demo_environment_brief",
                "art_research_pack",
                "art_design_capacity_plan",
                "art_delivery_capacity_plan",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_solution_design",
            "nhs_app_stage_name": "Solution design and delivery commitment",
            "category_id": "design",
            "entry_requirements": [
                "Product review has named the service as suitable and prioritised.",
                "One portal / two shell rule remains current.",
            ],
            "required_documents": [
                "Solution design document",
                "Route manifest and jump-off inventory",
                "Implementation approach document",
                "NHS Service Support Guidance pack",
            ],
            "demo_expectations": [
                "Review the route manifest, jump-off selection, and embedded preview lab.",
            ],
            "technical_expectations": [
                "Route manifest hash and bridge capability matrix are versioned.",
                "Return-to-journey continuity is explicit.",
            ],
            "design_expectations": [
                "Hidden supplier header posture is reviewed.",
                "Embedded mode is not a second product.",
            ],
            "browser_automation_possible": "yes",
            "mock_now_action": "Use the preview lab to review embedded route parity, safe navigation, and manifest-driven exposure.",
            "actual_later_action": "Work with the NHS App technical team on the solution design document and agree the delivery plan.",
            "blocking_dependencies": [
                "dep_nhs_app_embedded_channel_ecosystem",
                "FINDING_095",
            ],
            "notes": "Delivery commitment is joint planning with the NHS App team, not an internal unilateral checklist.",
            "required_field_ids": [
                "int01_solution_design_doc",
                "int02_embedded_route_manifest_hash",
                "int03_bridge_capability_matrix",
                "int04_hidden_header_review",
                "int05_secure_return_contract",
                "int06_demo_environment_url",
            ],
            "required_artifact_ids": [
                "art_solution_design",
                "art_route_manifest",
                "art_implementation_approach",
                "art_service_support_pack",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_embedded_readiness",
            "nhs_app_stage_name": "Embedded readiness preview",
            "category_id": "design",
            "entry_requirements": [
                "Preview routes are tied to canonical route families.",
                "Embedded continuity, degraded mode, and artifact fallback rules are explicit.",
            ],
            "required_documents": [
                "Embedded preview board",
                "Route manifest and jump-off inventory",
            ],
            "demo_expectations": [
                "Show standalone versus embedded shell for the same route families.",
                "Show safe-browser handoff, placeholder, and read-only degradations.",
            ],
            "technical_expectations": [
                "Hidden header posture, GO_BACK, overlay, external browser, and byte-safe file actions are modelled.",
            ],
            "design_expectations": [
                "No NHS App lookalike UI.",
                "Exact mobile spacing and calm embedded strips.",
            ],
            "browser_automation_possible": "yes",
            "mock_now_action": "Exercise the preview route tabs and confirm the same portal logic survives embedded posture changes.",
            "actual_later_action": "Use the same preview evidence to support real sandpit and AOS demo preparation.",
            "blocking_dependencies": [
                "RISK_UI_002",
                "dep_nhs_app_embedded_channel_ecosystem",
            ],
            "notes": "This stage closes the soft-design gap by making embedded readiness machine-readable and testable.",
            "required_field_ids": [
                "int02_embedded_route_manifest_hash",
                "int03_bridge_capability_matrix",
                "int04_hidden_header_review",
                "int05_secure_return_contract",
            ],
            "required_artifact_ids": [
                "art_embedded_preview_board",
                "art_route_manifest",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_sandpit_delivery",
            "nhs_app_stage_name": "Sandpit delivery rehearsal",
            "category_id": "sandpit",
            "entry_requirements": [
                "Product review and solution design complete.",
                "Named sandpit target and demo path prepared.",
            ],
            "required_documents": [
                "Demo environment brief",
                "Embedded preview board",
                "Incident rehearsal pack",
                "Route manifest and jump-off inventory",
            ],
            "demo_expectations": [
                "Show the environment-specific build, test results, and demo checklist coverage.",
            ],
            "technical_expectations": [
                "Environment-specific manifest values are prepared.",
                "Sandpit is the first real NHS App environment, before AOS.",
            ],
            "design_expectations": [
                "Accessibility and mobile polish are sufficient for demo sign-off review.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Rehearse the sandpit checklist inside the studio and validate evidence completeness.",
            "actual_later_action": "Deploy to the official sandpit environment, test, present the product in the demo call, and address required actions.",
            "blocking_dependencies": [
                "LIVE_GATE_DEMO_ENVIRONMENT_READY",
                "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            ],
            "notes": "Official step 4 is explicit that sandpit must be completed and signed off before repeating the same work in AOS.",
            "required_field_ids": [
                "int06_demo_environment_url",
                "int07_sandpit_target",
                "int02_embedded_route_manifest_hash",
            ],
            "required_artifact_ids": [
                "art_demo_environment_brief",
                "art_embedded_preview_board",
                "art_incident_rehearsal_pack",
                "art_route_manifest",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_sandpit_signoff",
            "nhs_app_stage_name": "Sandpit demo sign-off",
            "category_id": "sandpit",
            "entry_requirements": [
                "Sandpit delivery completed.",
                "NHS App team and SMEs have reviewed the demo.",
            ],
            "required_documents": [
                "Demo environment brief",
                "Issue action log",
            ],
            "demo_expectations": [
                "Demonstrate fixes for mandatory action items.",
            ],
            "technical_expectations": [
                "Manifest, bridge, and release posture remain current.",
            ],
            "design_expectations": [
                "All mandatory design adjustments are completed.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Use internal sign-off notes and blocker chips to rehearse the go/no-go review.",
            "actual_later_action": "Wait for formal sandpit sign-off before moving to AOS.",
            "blocking_dependencies": [
                "nhs_app_stage_sandpit_delivery",
                "LIVE_GATE_DEMO_ENVIRONMENT_READY",
            ],
            "notes": "Sandpit sign-off is an explicit gate, not just an environment label change.",
            "required_field_ids": [
                "int07_sandpit_target",
            ],
            "required_artifact_ids": [
                "art_demo_environment_brief",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_aos_delivery",
            "nhs_app_stage_name": "AOS delivery rehearsal",
            "category_id": "aos",
            "entry_requirements": [
                "Sandpit sign-off is complete.",
                "Environment-specific values for AOS are known.",
            ],
            "required_documents": [
                "Route manifest and jump-off inventory",
                "Embedded preview board",
                "Incident rehearsal pack",
                "SCAL workspace and upload map",
            ],
            "demo_expectations": [
                "Repeat the sandpit delivery and demo discipline in AOS.",
            ],
            "technical_expectations": [
                "AOS manifest and environment values are exact.",
                "AOS stays pinned to the same route and release tuple law.",
            ],
            "design_expectations": [
                "The same embedded readiness rules apply in AOS.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Rehearse AOS-specific environment checks and blocker handling inside the studio.",
            "actual_later_action": "Deploy and demo in AOS only after sandpit sign-off and environment values are supplied.",
            "blocking_dependencies": [
                "nhs_app_stage_sandpit_signoff",
                "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            ],
            "notes": "AOS is a later stage with the same evidence and demo discipline, not a trivial environment rename.",
            "required_field_ids": [
                "int08_aos_target",
                "int02_embedded_route_manifest_hash",
            ],
            "required_artifact_ids": [
                "art_route_manifest",
                "art_embedded_preview_board",
                "art_incident_rehearsal_pack",
                "art_scal_workspace",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_aos_signoff",
            "nhs_app_stage_name": "AOS demo sign-off",
            "category_id": "aos",
            "entry_requirements": [
                "AOS delivery completed.",
                "All mandatory issues from AOS have been addressed.",
            ],
            "required_documents": [
                "SCAL workspace and upload map",
                "Issue action log",
            ],
            "demo_expectations": [
                "Show resolved blockers and current demo evidence.",
            ],
            "technical_expectations": [
                "AOS environment stays current to the approved manifest and bridge capability floor.",
            ],
            "design_expectations": [
                "Mandatory mobile and accessibility changes are complete.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Use the studio to rehearse the sign-off story and remaining blockers.",
            "actual_later_action": "Wait for the formal AOS sign-off before live-release planning.",
            "blocking_dependencies": [
                "nhs_app_stage_aos_delivery",
                "LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY",
            ],
            "notes": "AOS sign-off is a real approval checkpoint.",
            "required_field_ids": [
                "int08_aos_target",
            ],
            "required_artifact_ids": [
                "art_scal_workspace",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_scal_assurance",
            "nhs_app_stage_name": "SCAL and assurance submission",
            "category_id": "assurance",
            "entry_requirements": [
                "AOS sign-off path is open.",
                "Evidence pack families are current and auditable.",
            ],
            "required_documents": [
                "SCAL workspace and upload map",
                "Clinical safety bundle (DCB0129/DCB0160)",
                "Privacy and NHS service standard bundle",
                "WCAG 2.2 accessibility audit",
            ],
            "demo_expectations": [
                "Provide evidence that the product meets NHS App integration requirements.",
            ],
            "technical_expectations": [
                "Evidence bundle maps to each SCAL section and upload.",
            ],
            "design_expectations": [
                "Accessibility evidence is current and available.",
            ],
            "browser_automation_possible": "partial",
            "mock_now_action": "Use the assurance page and evidence drawer to verify that every required evidence family is mapped.",
            "actual_later_action": "Upload SCAL evidence, clinical safety docs, and supporting standards evidence for review.",
            "blocking_dependencies": [
                "LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY",
                "LIVE_GATE_DESIGN_READINESS_READY",
            ],
            "notes": "SCAL and assurance remain later human-reviewed work, but the mapping can be stabilised now.",
            "required_field_ids": [
                "q23_accessibility_audit_recent",
                "q24_accessibility_outcome",
                "int10_monthly_data_owner",
                "int11_annual_assurance_owner",
            ],
            "required_artifact_ids": [
                "art_scal_workspace",
                "art_clinical_safety_bundle",
                "art_privacy_and_service_standard",
                "art_accessibility_audit",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_connection_agreement",
            "nhs_app_stage_name": "Connection agreement and final go-live readiness",
            "category_id": "assurance",
            "entry_requirements": [
                "SCAL is satisfactory.",
                "Incident rehearsal is complete.",
            ],
            "required_documents": [
                "Connection agreement readiness pack",
                "Incident rehearsal pack",
                "Implementation approach document",
            ],
            "demo_expectations": [
                "Show the agreed implementation plan, incident handling posture, and readiness ownership.",
            ],
            "technical_expectations": [
                "Go-live plan is consistent with the same release tuple and route manifest.",
            ],
            "design_expectations": [
                "No hidden design debt remains from product assessment or demo calls.",
            ],
            "browser_automation_possible": "no",
            "mock_now_action": "Keep the readiness pack visible and immutable in the studio.",
            "actual_later_action": "Read and sign the real connection agreement with the NHS App team.",
            "blocking_dependencies": [
                "LIVE_GATE_NAMED_APPROVER_PRESENT",
                "LIVE_GATE_MUTATION_FLAG_ENABLED",
            ],
            "notes": "The connection agreement is a human contract and should never be automated from this repository.",
            "required_field_ids": [
                "int09_limited_release_target",
                "int12_named_approver",
                "int13_environment_target",
                "int14_allow_real_provider_mutation",
            ],
            "required_artifact_ids": [
                "art_connection_agreement",
                "art_incident_rehearsal_pack",
                "art_implementation_approach",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_limited_release",
            "nhs_app_stage_name": "Limited release",
            "category_id": "release",
            "entry_requirements": [
                "NHS App team decides the product is ready to go live.",
                "Connection agreement and assurance bundle complete.",
            ],
            "required_documents": [
                "Implementation approach document",
                "NHS Service Support Guidance pack",
                "Incident rehearsal pack",
            ],
            "demo_expectations": [
                "Show the limited-release cohort, operational thresholds, and issue management posture.",
            ],
            "technical_expectations": [
                "Environment target and release cohort are explicit.",
            ],
            "design_expectations": [
                "No unresolved mandatory UX or accessibility issues remain.",
            ],
            "browser_automation_possible": "no",
            "mock_now_action": "Use the release page to pressure-test limited-release blockers and cohort assumptions.",
            "actual_later_action": "Run the limited release to the agreed sample users following the joint implementation plan.",
            "blocking_dependencies": [
                "LIVE_GATE_SERVICE_DESK_READY",
                "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            ],
            "notes": "Limited release is operational rollout, not just a checkbox.",
            "required_field_ids": [
                "int09_limited_release_target",
                "int10_monthly_data_owner",
            ],
            "required_artifact_ids": [
                "art_implementation_approach",
                "art_service_support_pack",
                "art_incident_rehearsal_pack",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_full_release",
            "nhs_app_stage_name": "Full release",
            "category_id": "release",
            "entry_requirements": [
                "Limited release is progressing safely.",
                "The NHS App team agrees full rollout can proceed.",
            ],
            "required_documents": [
                "Implementation approach document",
                "Accessibility audit",
                "Monthly data pack setup",
            ],
            "demo_expectations": [
                "Show release widening evidence and operational thresholds.",
            ],
            "technical_expectations": [
                "The same route manifest, release tuple, and embedded posture remain current.",
            ],
            "design_expectations": [
                "No divergence between standalone and embedded patient shells.",
            ],
            "browser_automation_possible": "no",
            "mock_now_action": "Keep full-release criteria visible but blocked in actual mode.",
            "actual_later_action": "Continue from limited release to full release with the NHS App team.",
            "blocking_dependencies": [
                "nhs_app_stage_limited_release",
                "LIVE_GATE_PHASE7_SCOPE_WINDOW",
            ],
            "notes": "Even a future full release must not bypass the deferred channel scope window.",
            "required_field_ids": [
                "int10_monthly_data_owner",
                "int11_annual_assurance_owner",
            ],
            "required_artifact_ids": [
                "art_implementation_approach",
                "art_accessibility_audit",
            ],
        },
        {
            "nhs_app_stage_id": "nhs_app_stage_post_live_assurance",
            "nhs_app_stage_name": "Post-live monthly data and annual assurance",
            "category_id": "release",
            "entry_requirements": [
                "Full release complete.",
                "Operational owners and data submission lanes are named.",
            ],
            "required_documents": [
                "Monthly data owner assignment",
                "Annual assurance owner assignment",
                "NHS Service Support Guidance pack",
            ],
            "demo_expectations": [
                "Show the post-live reporting and incident protocol posture.",
            ],
            "technical_expectations": [
                "Post-live reporting uses privacy-safe telemetry and explicit ownership.",
            ],
            "design_expectations": [
                "Journey changes are managed through the integration manager rather than ad hoc edits.",
            ],
            "browser_automation_possible": "no",
            "mock_now_action": "Use placeholder ownership to keep post-live obligations visible from the start.",
            "actual_later_action": "Provide monthly data, attend annual assurance, and coordinate journey changes with the integration manager.",
            "blocking_dependencies": [
                "nhs_app_stage_full_release",
            ],
            "notes": "The NHS App team expects monthly data and annual assurance, and changes to user journeys must be coordinated.",
            "required_field_ids": [
                "int10_monthly_data_owner",
                "int11_annual_assurance_owner",
            ],
            "required_artifact_ids": [
                "art_service_support_pack",
            ],
        },
    ]

    live_gates = [
        {
            "gate_id": "LIVE_GATE_PHASE7_SCOPE_WINDOW",
            "label": "Phase 7 approved scope window",
            "status": "blocked",
            "summary": "Phase 7 remains a deferred channel expansion and is explicitly not a current-baseline go-live gate.",
            "source_refs": [
                "docs/architecture/03_deferred_and_conditional_scope.md",
                "docs/external/21_integration_priority_and_execution_matrix.md",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "label": "External readiness chain clear",
            "status": "blocked",
            "summary": phase0_gate["gate_verdicts"][0]["reason"],
            "source_refs": ["data/analysis/phase0_gate_verdict.json"],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_NHS_LOGIN_READY_ENOUGH",
            "label": "NHS login readiness sufficient for NHS App progression",
            "status": "review_required",
            "summary": "Seq_024 and seq_025 provide the onboarding and credential capture strategy, but the real NHS login path is still gated and must not be silently treated as live.",
            "source_refs": [
                "docs/external/24_nhs_login_actual_onboarding_strategy.md",
                "docs/external/25_nhs_login_environment_profile_pack.md",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_PATIENT_ELIGIBILITY_EXPLICIT",
            "label": "Patient-facing eligibility explicit",
            "status": "review_required",
            "summary": "The patient-facing route inventory and product categories are mapped, but the real patient-service narrative still needs final sponsor-approved wording.",
            "source_refs": [
                "docs/architecture/04_audience_surface_inventory.md",
                "official_nhs_app_web_integration",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_COMMISSIONING_EXPLICIT",
            "label": "Commissioning posture explicit",
            "status": "blocked",
            "summary": "Commissioning and procurement framework evidence remain placeholders in the current pack and cannot be fabricated.",
            "source_refs": [
                "official_nhs_app_web_integration",
                "official_nhs_app_eoi_questions",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_DEMO_ENVIRONMENT_READY",
            "label": "Demo environment and demo-readiness current",
            "status": "review_required",
            "summary": "The rehearsal environment exists now, but the real NHS App team-accessible demo environment, seeded data, and demo checklist sign-off remain later.",
            "source_refs": [
                "official_nhs_app_web_integration",
                "official_nhs_app_eoi_questions",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY",
            "label": "Accessibility evidence current",
            "status": "review_required",
            "summary": "Accessibility audit planning exists, but a fresh NHS App-aligned WCAG 2.2 audit still needs to be commissioned and signed.",
            "source_refs": [
                "official_nhs_app_standards",
                "official_nhs_app_eoi_questions",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_DESIGN_READINESS_READY",
            "label": "Design readiness current",
            "status": "review_required",
            "summary": "The preview lab proves the design direction and embedded behaviour, but the formal NHS App product guidance review remains later.",
            "source_refs": [
                "official_nhs_app_web_integration",
                "official_web_integration_guidance",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_SERVICE_DESK_READY",
            "label": "Service desk and incident posture current",
            "status": "review_required",
            "summary": "Service support guidance and incident rehearsal are modelled, but live public-facing service desk evidence is not yet current.",
            "source_refs": [
                "official_nhs_app_web_integration",
                "official_nhs_app_eoi_questions",
            ],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "label": "Named approver present",
            "status": "blocked",
            "summary": "No named approver is stored in repo fixtures or this rehearsal pack.",
            "source_refs": ["prompt/029.md", "docs/external/23_actual_partner_account_governance.md"],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "label": "Environment target present",
            "status": "blocked",
            "summary": "Real submission must name sandpit, AOS, limited release, or full release as the live target.",
            "source_refs": ["prompt/029.md", "official_nhs_app_web_integration"],
            "required_for_real_submission": True,
        },
        {
            "gate_id": "LIVE_GATE_MUTATION_FLAG_ENABLED",
            "label": "ALLOW_REAL_PROVIDER_MUTATION=true",
            "status": "blocked",
            "summary": "Dry-run is the only allowed default. Real mutation remains fail-closed until the explicit environment flag is set.",
            "source_refs": ["prompt/029.md", "prompt/shared_operating_contract_026_to_035.md"],
            "required_for_real_submission": True,
        },
    ]

    selected_risks = [
        {
            "risk_id": "RISK_UI_002",
            "risk_title": "Channel profiles constrain shell posture without redefining the shell family",
            "status": "watching",
            "problem_statement": "Embedded, constrained-browser, and browser handoff change channel posture and affordances, but not the owning shell family.",
        },
        {
            "risk_id": "RISK_EXT_NHS_LOGIN_DELAY",
            "risk_title": "NHS login partner onboarding or redirect proof delay stalls the current baseline",
            "status": "open",
            "problem_statement": "Authenticated and recovery-grade patient authority depends on real NHS login approval and redirect proof, which remains later-gated.",
        },
        {
            "risk_id": "FINDING_095",
            "risk_title": "Governance watch tuples and recovery posture drift away from runtime release truth",
            "status": "watching",
            "problem_statement": "Embedded route readiness and future release posture must stay bound to the same release tuple rather than drifting into separate channel logic.",
        },
        {
            "risk_id": "FINDING_120",
            "risk_title": "Patient-facing degraded mode could still fragment across entry, section, recovery, embedded, and artifact shells",
            "status": "watching",
            "problem_statement": "Embedded routes must degrade through the same patient-facing degraded-mode authority rather than generic browser-only failures.",
        },
    ]

    ladder_nodes = [
        {"node_id": "EOI", "label": "EOI", "description": "Eligibility and expression-of-interest prep"},
        {"node_id": "product_review", "label": "product_review", "description": "Product fit and prioritisation call"},
        {"node_id": "sandpit", "label": "sandpit", "description": "Sandpit delivery and demo"},
        {"node_id": "AOS", "label": "AOS", "description": "AOS delivery and demo"},
        {"node_id": "SCAL", "label": "SCAL", "description": "SCAL and assurance evidence"},
        {"node_id": "connection_agreement", "label": "connection_agreement", "description": "Connection agreement"},
        {"node_id": "limited_release", "label": "limited_release", "description": "Limited release"},
        {"node_id": "full_release", "label": "full_release", "description": "Full release and post-live"},
    ]

    draft_values = {field["field_id"]: field["default_value"] for field in fields}
    artifact_defaults = {row["artifact_id"]: row["mock_now_status"] == "generated" for row in assurance_artifacts}

    pack = {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "official_guidance": OFFICIAL_GUIDANCE,
        "upstream_inputs": {
            "phase0_entry_verdict": phase0_gate["summary"]["phase0_entry_verdict"],
            "embedded_channel_lane": inputs["embedded_family"]["recommended_lane"],
            "embedded_dependency_scope": inputs["embedded_dependency"]["baseline_scope"],
            "nhs_login_pack_task_refs": ["seq_024", "seq_025"],
        },
        "summary": {
            "stage_count": len(stages),
            "stage_category_count": len(stage_categories),
            "eligibility_row_count": len(eligibility_rows),
            "assurance_artifact_count": len(assurance_artifacts),
            "preview_route_count": len(preview_routes),
            "live_gate_count": len(live_gates),
            "blocked_gate_count": sum(1 for gate in live_gates if gate["status"] == "blocked"),
            "review_required_gate_count": sum(1 for gate in live_gates if gate["status"] == "review_required"),
            "question_field_count": sum(1 for field in fields if field["question_number"] is not None),
            "internal_field_count": sum(1 for field in fields if field["question_number"] is None),
        },
        "stage_categories": stage_categories,
        "stages": stages,
        "fields": fields,
        "draft_values": draft_values,
        "artifact_defaults": artifact_defaults,
        "eligibility_matrix": eligibility_rows,
        "assurance_artifacts": assurance_artifacts,
        "preview_routes": preview_routes,
        "selected_route_refs": [find_route(route_rows, route_id) for route_id in route_ids],
        "live_gate_pack": {
            "verdict": "blocked",
            "blocking_gate_ids": [gate["gate_id"] for gate in live_gates if gate["status"] == "blocked"],
            "live_gates": live_gates,
            "selector_map": {
                "studio_profile": {
                    "stage_rail": "[data-testid='stage-rail']",
                    "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                    "field_prefix": "field-",
                    "actual_field_prefix": "actual-field-",
                    "release_page_tab": "[data-testid='page-tab-SCAL_and_Release_Gates']",
                    "gate_board": "[data-testid='live-gate-board']",
                }
            },
            "dry_run_defaults": {
                "default_target_url": "http://127.0.0.1:4180/?mode=actual&page=SCAL_and_Release_Gates",
            },
        },
        "ladder_nodes": ladder_nodes,
        "selected_risks": selected_risks,
        "assumptions": [
            {
                "assumption_id": "ASSUMPTION_SEQ029_DEFERRED_CHANNEL_NOW_REHEARSED_NOT_RELEASED",
                "summary": "The current baseline keeps NHS App deferred while still requiring manifest, onboarding, and embedded preview work now.",
            },
            {
                "assumption_id": "ASSUMPTION_SEQ029_REAL_PORTAL_MUTATION_FAILS_CLOSED",
                "summary": "Any real EOI, sandpit, or AOS mutation remains blocked until explicit live gates and environment flags are satisfied.",
            },
        ],
    }
    return pack


def render_strategy_doc(pack: dict[str, Any]) -> str:
    guidance_rows = "\n".join(
        f"| {row['title']} | {row['captured_on']} | {row['summary']} | {row['url']} |"
        for row in pack["official_guidance"]
    )
    stage_rows = "\n".join(
        f"| {row['nhs_app_stage_name']} | {row['category_id']} | {row['browser_automation_possible']} | {row['mock_now_action']} | {row['actual_later_action']} |"
        for row in pack["stages"]
    )
    return textwrap.dedent(
        f"""
        # 29 NHS App Onboarding Strategy

        This pack keeps the NHS App channel deferred in the current baseline while making later NHS App conversion concrete enough to rehearse now. The core product law is unchanged: one portal, one backend truth, one route family set, and an embedded shell adaptation instead of a separate NHS App product.

        ## Section A — `Mock_now_execution`

        The mock studio is a rehearsal-grade planning and embedded-readiness surface. It does four things now:
        - captures the full expression-of-interest question set and eligibility gaps without touching the live form
        - turns sandpit, AOS, SCAL, incident rehearsal, limited release, and post-live obligations into deterministic stage rows
        - renders embedded-preview route parity for the same patient route families used on the web portal
        - keeps deferred-scope warnings, live gates, and artifact safety visible so the team cannot accidentally treat NHS App as a current-baseline release lane

        ## Section B — `Actual_provider_strategy_later`

        Later real execution follows the current official NHS App process:
        1. confirm eligibility and submit the EOI
        2. complete product review and prioritisation
        3. complete the product assessment and solution-design work
        4. deliver and demo in sandpit
        5. repeat delivery and demo in AOS
        6. upload SCAL, clinical safety, privacy, accessibility, and service-standard evidence
        7. complete connection-agreement readiness
        8. run limited release, then full release
        9. provide monthly data and attend annual assurance

        ## Official guidance captured on {CAPTURED_ON}

        | Source | Captured on | Why it matters | URL |
        | --- | --- | --- | --- |
        {guidance_rows}

        ## Stage summary

        | Stage | Category | Browser automation | Mock now | Actual later |
        | --- | --- | --- | --- | --- |
        {stage_rows}

        ## Gap closures

        - Deferred-now versus onboarding-now is resolved by splitting rehearsal execution from live submission.
        - Embedded channel drift is resolved by route-manifest, return-safe, and degraded-mode contracts in the same portal.
        - Sandpit and AOS are modelled as distinct gated stages rather than vague environment labels.
        - Accessibility, design, service-desk, and incident-rehearsal evidence are first-class artifact families rather than narrative TODOs.

        ## Non-negotiable guardrails

        - The pack does not reclassify Phase 7 as current-baseline scope.
        - The studio does not create a second NHS App product or separate route tree.
        - The preview does not imitate the NHS App closely enough to be confused for it.
        - Real EOI, sandpit, AOS, or release actions remain blocked until the live gates pass.
        """
    )


def render_eoi_doc(pack: dict[str, Any]) -> str:
    eligibility_rows = "\n".join(
        f"| {row['criterion_id']} | {row['criterion_label']} | {row['mock_now_status']} | {row['actual_later_status']} | {row['linked_field_ids']} | {row['notes']} |"
        for row in pack["eligibility_matrix"]
    )
    question_rows = "\n".join(
        f"| {field['question_number'] or 'internal'} | {field['field_id']} | {field['label']} | {field['section']} | {field['kind']} | {field['required']} | {field['default_value'] or 'placeholder'} |"
        for field in pack["fields"]
        if field["question_number"] is not None or field["section"] in {"internal_design", "internal_delivery"}
    )
    return textwrap.dedent(
        f"""
        # 29 NHS App Expression Of Interest And Eligibility Matrix

        This matrix turns the current NHS App EOI and eligibility rules into machine-readable rows while keeping the deferred channel posture explicit.

        ## Eligibility matrix

        | Criterion ID | Criterion | Mock now | Actual later | Fields | Notes |
        | --- | --- | --- | --- | --- | --- |
        {eligibility_rows}

        ## Field map

        | Question | Field ID | Label | Section | Kind | Required | Default |
        | --- | --- | --- | --- | --- | --- | --- |
        {question_rows}

        ## Interpretation rules

        - `mock_now_status = evidenced` means the rehearsal pack can capture or simulate the data now.
        - `actual_later_status = blocked` means the real provider path must fail closed until the evidence exists outside the repo.
        - Internal fields extend the official EOI so solution design, manifest, bridge, release, and post-live obligations stay connected to the same dossier.
        """
    )


def render_progression_doc(pack: dict[str, Any]) -> str:
    stage_rows = "\n".join(
        f"| {row['nhs_app_stage_id']} | {row['nhs_app_stage_name']} | {row['category_id']} | {', '.join(row['required_documents'])} | {', '.join(row['blocking_dependencies'])} |"
        for row in pack["stages"]
    )
    ladder = " -> ".join(node["label"] for node in pack["ladder_nodes"])
    return textwrap.dedent(
        f"""
        # 29 NHS App Sandpit To AOS Progression Pack

        Sandpit and AOS are not interchangeable labels. The official NHS App process expects sandpit delivery and sign-off before the same discipline is repeated in AOS. This pack makes that ordering explicit.

        ## Progression rows

        | Stage ID | Stage | Category | Required documents | Blocking dependencies |
        | --- | --- | --- | --- | --- |
        {stage_rows}

        ## Ladder

        `{ladder}`

        ## Stage rules

        - Sandpit is the first real environment stage and must be completed before AOS.
        - AOS repeats the same delivery, demo, and sign-off discipline under later environment values.
        - SCAL, clinical safety, privacy, accessibility, connection agreement, limited release, and full release remain distinct downstream steps.
        """
    )


def render_assurance_doc(pack: dict[str, Any]) -> str:
    artifact_rows = "\n".join(
        f"| {row['artifact_id']} | {row['artifact_name']} | {row['artifact_family']} | {row['required_stage_ids']} | {row['mock_now_status']} | {row['actual_later_status']} | {row['notes']} |"
        for row in pack["assurance_artifacts"]
    )
    return textwrap.dedent(
        f"""
        # 29 NHS App SCAL And Assurance Artifact Matrix

        This matrix keeps the assurance bundle explicit before any live provider work begins.

        | Artifact ID | Artifact | Family | Required stages | Mock now | Actual later | Notes |
        | --- | --- | --- | --- | --- | --- | --- |
        {artifact_rows}

        ## Assurance discipline

        - Accessibility, clinical safety, privacy, and service-standard evidence are first-class deliverables.
        - SCAL is the upload and review envelope, not the source of truth for the underlying evidence.
        - Connection agreement, incident rehearsal, and release rollout remain later human-controlled steps.
        """
    )


def render_live_gate_doc(pack: dict[str, Any]) -> str:
    gate_rows = "\n".join(
        f"| {row['gate_id']} | {row['label']} | {row['status']} | {row['summary']} |"
        for row in pack["live_gate_pack"]["live_gates"]
    )
    return textwrap.dedent(
        f"""
        # 29 NHS App Live Gate And Release Strategy

        The live-later path is intentionally fail-closed. Real EOI, sandpit, AOS, SCAL upload, or release activity must not occur from this repository unless the gates below pass and `ALLOW_REAL_PROVIDER_MUTATION=true` is explicitly set.

        ## Live gates

        | Gate ID | Gate | Status | Summary |
        | --- | --- | --- | --- |
        {gate_rows}

        ## Release strategy

        - Limited release and full release stay downstream of SCAL, incident rehearsal, and connection agreement readiness.
        - Monthly data and annual assurance are post-live obligations and remain visible from the start.
        - Any route or journey change later must go back through the integration manager rather than bypassing the staged process.

        ## Automation law

        - Browser automation may rehearse dossier completion and gate review now.
        - Real submission remains blocked unless the explicit mutation flag, named approver, and target environment are all present.
        - The dry-run harness must stop before any final-submit action.
        """
    )


def render_readme(pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""
        # mock-nhs-app-onboarding-studio

        Internal rehearsal studio for seq_029. This is not a real NHS App portal and must not be confused with the real NHS App or real NHS App onboarding systems.

        ## Purpose

        - rehearse the NHS App EOI and staged onboarding path
        - preview embedded-shell readiness for the same patient route families as standalone web
        - keep deferred-scope warnings and live-provider gates explicit

        ## Run

        ```bash
        pnpm install
        pnpm dev
        ```

        ## Build

        ```bash
        pnpm build
        pnpm preview
        ```

        ## Notes

        - Visual mode: `{pack["visual_mode"]}`
        - Default preview URL: `http://127.0.0.1:4180/`
        - The app reads generated data from `src/generated/nhsAppPack.ts`.
        - Real provider mutation is never allowed from the UI; actual mode is a gated dossier review only.
        """
    )


def write_generated_app_files(pack: dict[str, Any]) -> None:
    write_json(APP_PACK_JSON_PATH, pack)
    write_text(APP_PACK_TS_PATH, f"export const nhsAppPack = {json.dumps(pack, indent=2)} as const;")
    write_text(README_PATH, render_readme(pack))


def main() -> None:
    inputs = ensure_inputs()
    pack = build_pack(inputs)

    write_csv(ELIGIBILITY_CSV_PATH, pack["eligibility_matrix"])
    write_json(STAGE_JSON_PATH, pack)
    write_csv(ASSURANCE_CSV_PATH, pack["assurance_artifacts"])
    write_json(LIVE_GATES_JSON_PATH, pack["live_gate_pack"])

    write_text(STRATEGY_DOC_PATH, render_strategy_doc(pack))
    write_text(EOI_DOC_PATH, render_eoi_doc(pack))
    write_text(PROGRESSION_DOC_PATH, render_progression_doc(pack))
    write_text(ASSURANCE_DOC_PATH, render_assurance_doc(pack))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(pack))

    write_generated_app_files(pack)

    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "stage_count": pack["summary"]["stage_count"],
                "eligibility_row_count": pack["summary"]["eligibility_row_count"],
                "assurance_artifact_count": pack["summary"]["assurance_artifact_count"],
                "preview_route_count": pack["summary"]["preview_route_count"],
                "live_gate_count": pack["summary"]["live_gate_count"],
            }
        )
    )


if __name__ == "__main__":
    main()
