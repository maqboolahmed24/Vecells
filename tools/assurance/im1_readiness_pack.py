#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "assurance"
DATA_DIR = ROOT / "data" / "assurance"
ANALYSIS_DIR = ROOT / "data" / "analysis"

TASK_ID = "par_123"
GENERATED_AT = "2026-04-14T00:00:00Z"
REVIEWED_AT = "2026-04-14"
DEFAULT_REVIEW_DUE_AT = "2026-05-14"
DEFAULT_SUBMISSION_REVIEW_DUE_AT = "2026-05-28"

DOC_READINESS_PATH = DOCS_DIR / "123_im1_prerequisite_readiness_pack.md"
DOC_MOCK_PATH = DOCS_DIR / "123_im1_mock_now_execution.md"
DOC_ACTUAL_PATH = DOCS_DIR / "123_im1_actual_pairing_strategy_later.md"
DOC_SCAL_PATH = DOCS_DIR / "123_scal_response_strategy.md"
DOC_SUPPLIER_PATH = DOCS_DIR / "123_supplier_capability_and_pairing_assumptions.md"

PREREQUISITE_MATRIX_PATH = DATA_DIR / "im1_prerequisite_question_matrix.csv"
SCAL_QUESTION_BANK_PATH = DATA_DIR / "im1_scal_question_bank.json"
ARTIFACT_INDEX_PATH = DATA_DIR / "im1_artifact_index.json"
SUPPLIER_MATRIX_PATH = DATA_DIR / "im1_supplier_capability_matrix.csv"
GAP_REGISTER_PATH = DATA_DIR / "im1_gap_register.json"

PAIRING_PACK_PATH = ANALYSIS_DIR / "im1_pairing_pack.json"
PREREQUISITES_FIELD_MAP_PATH = ANALYSIS_DIR / "im1_prerequisites_field_map.json"
SCAL_ARTIFACT_MATRIX_PATH = ANALYSIS_DIR / "im1_scal_artifact_matrix.csv"
PROVIDER_REGISTER_PATH = ANALYSIS_DIR / "im1_provider_supplier_register.json"
LIVE_GATES_PATH = ANALYSIS_DIR / "im1_live_gate_checklist.json"
BOOKING_CAPABILITY_PATH = ANALYSIS_DIR / "gp_booking_capability_evidence.json"
DCB0129_PATH = DATA_DIR / "dcb0129_hazard_register.json"
DSPT_GAP_PATH = DATA_DIR / "dspt_gap_register.json"

REQUIRED_INPUTS = {
    "im1_pairing_pack": PAIRING_PACK_PATH,
    "im1_prerequisites_field_map": PREREQUISITES_FIELD_MAP_PATH,
    "im1_scal_artifact_matrix": SCAL_ARTIFACT_MATRIX_PATH,
    "im1_provider_supplier_register": PROVIDER_REGISTER_PATH,
    "im1_live_gate_checklist": LIVE_GATES_PATH,
    "gp_booking_capability_evidence": BOOKING_CAPABILITY_PATH,
    "dcb0129_hazard_register": DCB0129_PATH,
    "dspt_gap_register": DSPT_GAP_PATH,
}

MOCK_TRACK = "mock_now_execution"
ACTUAL_TRACK = "actual_production_strategy_later"
TRACKS = [MOCK_TRACK, ACTUAL_TRACK]

REQUIRED_MACHINE_FIELDS = [
    "artifact_id",
    "artifact_type",
    "mock_or_actual",
    "submittable_state",
    "source_blueprint_refs",
    "official_process_stage",
    "supplier_scope",
    "capability_family",
    "required_prerequisite",
    "current_evidence_ref",
    "gap_state",
    "owner_role",
    "review_due_at",
    "notes",
]

SOURCE_PRECEDENCE = [
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "prompt/123.md",
    "prompt/shared_operating_contract_116_to_125.md",
    "blueprint/phase-cards.md#Phase_0_and_external_dependency_tracks",
    "blueprint/blueprint-init.md#IM1-first_direction_and_provider_capability_matrix_law",
    "blueprint/phase-0-the-foundation-protocol.md#ProviderCapabilityMatrix_and_external_dependency_degradation",
    "blueprint/phase-4-the-booking-engine.md#IM1-first_booking_boundaries_and_provider_specific_pairing",
    "blueprint/phase-5-the-network-horizon.md#Network_coordination_boundaries",
    "blueprint/phase-8-the-assistive-layer.md#RFC_and_AI_scope_delta_law",
    "blueprint/forensic-audit-findings.md#Optimistic_supplier_capability_and_stale_writable_posture",
    "data/analysis/im1_pairing_pack.json",
    "data/analysis/im1_prerequisites_field_map.json",
    "data/analysis/im1_scal_artifact_matrix.csv",
    "data/analysis/im1_provider_supplier_register.json",
    "data/analysis/im1_live_gate_checklist.json",
    "data/analysis/gp_booking_capability_evidence.json",
    "data/assurance/dcb0129_hazard_register.json",
    "data/assurance/dspt_gap_register.json",
]

STANDARDS_VERSION = {
    "baseline_id": "IM1_SCAL_BASELINE_REVIEWED_2026_04_14",
    "reviewed_at": REVIEWED_AT,
    "source_note": (
        "This IM1 readiness pack is versioned against the official NHS England Digital IM1 and SCAL "
        "pages reviewed on 2026-04-14. The live onboarding route can change, so the pack stores the "
        "review date and source list explicitly instead of baking a timeless assumption into the repo."
    ),
    "official_sources": [
        {
            "source_id": "official_im1_pairing_process",
            "title": "IM1 Pairing integration",
            "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
            "reviewed_at": REVIEWED_AT,
            "last_edited": "2026-02-06",
            "summary": (
                "Confirms IM1 remains a live route, states there are no current plans to decommission it, "
                "names Optum and TPP as the current foundation system providers, and separates provider mock "
                "API, supported test, assurance, live, and RFC change handling."
            ),
        },
        {
            "source_id": "official_im1_prerequisites_form",
            "title": "IM1 prerequisites form",
            "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/im1-prerequisites-form",
            "reviewed_at": REVIEWED_AT,
            "summary": (
                "Defines the current public IM1 Clinical and Information Governance prerequisites form fields "
                "and makes clear that all fields are mandatory."
            ),
        },
        {
            "source_id": "official_scal_process",
            "title": "Supplier Conformance Assessment List (SCAL)",
            "url": "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
            "reviewed_at": REVIEWED_AT,
            "last_edited": "2026-02-16",
            "summary": (
                "Defines SCAL as the document-based assurance route, one SCAL per product, with supplier and "
                "product information plus one or more service-specific tabs."
            ),
        },
        {
            "source_id": "official_scal_user_guide",
            "title": "SCAL user guide",
            "url": "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services/user-guide",
            "reviewed_at": REVIEWED_AT,
            "summary": (
                "Explains the current typical SCAL start sequence, including DSPT, clinical safety, medical "
                "device review, technical and security tests, and submission plus connection agreement."
            ),
        },
        {
            "source_id": "official_im1_interface_guidance",
            "title": "Interface mechanisms guidance",
            "url": "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance",
            "reviewed_at": REVIEWED_AT,
            "last_edited": "2025-07-03",
            "summary": (
                "Confirms supplier-specific API suites, Optum and TPP scope, the role of the Pairing "
                "Integration Pack (PIP), and that functionality varies by provider supplier."
            ),
        },
    ],
}

OFFICIAL_STAGE_FLOW = [
    {
        "stage_id": "im1_clinical_and_ig_prerequisites",
        "stage_label": "IM1 Clinical and Information Governance prerequisites",
        "stage_order": 1,
        "summary": "Complete the current public prerequisites form first.",
        "source_refs": ["official_im1_pairing_process", "official_im1_prerequisites_form"],
    },
    {
        "stage_id": "stage_one_scal_and_compatibility_review",
        "stage_label": "Stage-one SCAL and compatibility review",
        "stage_order": 2,
        "summary": "Proceed only after prerequisites are confirmed and compatibility is assessed.",
        "source_refs": ["official_im1_pairing_process", "official_scal_process"],
    },
    {
        "stage_id": "model_interface_licence",
        "stage_label": "Model Interface Licence",
        "stage_order": 3,
        "summary": "Execute the Model Interface Licence before expecting provider test access.",
        "source_refs": ["official_im1_pairing_process"],
    },
    {
        "stage_id": "provider_mock_api_access",
        "stage_label": "Provider mock API access",
        "stage_order": 4,
        "summary": "Supplier-specific mock or PIP access remains a separate gate.",
        "source_refs": ["official_im1_pairing_process", "official_im1_interface_guidance"],
    },
    {
        "stage_id": "unsupported_test_execution",
        "stage_label": "Unsupported test",
        "stage_order": 5,
        "summary": "Unsupported test evidence stays distinct from supported test and assurance.",
        "source_refs": ["official_im1_pairing_process"],
    },
    {
        "stage_id": "supported_test_environment",
        "stage_label": "Supported test and Supported Test Environment",
        "stage_order": 6,
        "summary": "Submit the fully completed SCAL before asking for supported test access.",
        "source_refs": ["official_im1_pairing_process", "official_scal_user_guide"],
    },
    {
        "stage_id": "assurance_and_recommended_to_connect",
        "stage_label": "Assurance and Recommended to Connect",
        "stage_order": 7,
        "summary": "SCAL review, agreed test evidence, and assurance acceptance remain separate from live.",
        "source_refs": ["official_im1_pairing_process", "official_scal_process"],
    },
    {
        "stage_id": "live_rollout_and_plan_to_connect",
        "stage_label": "Live rollout and Plan to Connect",
        "stage_order": 8,
        "summary": "Live rollout remains provider-supplier and organisation specific.",
        "source_refs": ["official_im1_pairing_process"],
    },
    {
        "stage_id": "rfc_for_material_change",
        "stage_label": "RFC for AI or other material functional change",
        "stage_order": 9,
        "summary": "AI or significant functional change requires RFC plus updated SCAL and associated documentation.",
        "source_refs": ["official_im1_pairing_process"],
    },
]

SUPPLIER_FAMILIES = [
    {
        "supplier_scope": "optum_emisweb",
        "provider_supplier_id": "ps_optum_emisweb",
        "provider_supplier_name": "Optum (EMISWeb)",
        "provider_pairing_path": "im1_pairing_optum_emisweb",
    },
    {
        "supplier_scope": "tpp_systmone",
        "provider_supplier_id": "ps_tpp_systmone",
        "provider_supplier_name": "TPP (SystmOne)",
        "provider_pairing_path": "im1_pairing_tpp_systmone",
    },
]

SUPPLIER_CAPABILITY_FAMILIES = [
    {
        "capability_family": "patient_api_booking_visibility",
        "vecells_target_posture": (
            "Bounded patient-facing appointment visibility and booking actions are in scope only where the "
            "paired supplier capability row and GP-practice linkage rules allow them."
        ),
        "mock_adapter_state": "Simulated through deterministic IM1 twins without claiming supplier acceptance.",
        "actual_pairing_requirement": "Need provider-specific PIP review and accepted compatibility scope.",
        "source_blueprint_refs": [
            "blueprint/phase-4-the-booking-engine.md#IM1-first_booking_boundaries_and_provider_specific_pairing",
            "official_im1_interface_guidance",
        ],
    },
    {
        "capability_family": "staff_transaction_support",
        "vecells_target_posture": (
            "Staff-assisted transaction flows can surface bounded search and record actions without implying "
            "that patient self-service and staff rights are identical."
        ),
        "mock_adapter_state": "Simulated through supplier twins and network coordination fallback.",
        "actual_pairing_requirement": "Need provider-specific transaction capabilities and any local component requirements confirmed.",
        "source_blueprint_refs": [
            "blueprint/phase-4-the-booking-engine.md#ProviderCapabilityMatrix",
            "official_im1_interface_guidance",
        ],
    },
    {
        "capability_family": "confirmation_and_slot_truth",
        "vecells_target_posture": (
            "Only authoritative confirmation proof may reassure a booking; acceptance or queueing alone is "
            "never presented as booked truth."
        ),
        "mock_adapter_state": "Simulated with same-commit read-after-write and ambiguity paths in the local IM1 twins.",
        "actual_pairing_requirement": "Need provider confirmation semantics and revalidation behaviour evidenced in the supplier PIP and test evidence.",
        "source_blueprint_refs": [
            "blueprint/phase-4-the-booking-engine.md#Commit_path_revalidation_booking_record_and_compensation",
            "data/analysis/gp_booking_capability_evidence.json",
        ],
    },
    {
        "capability_family": "gp_practice_linkage_and_account_binding",
        "vecells_target_posture": (
            "Patient linkage remains explicit and cannot be collapsed into NHS login success or one-off IM1 data retrieval."
        ),
        "mock_adapter_state": "Synthetic linkage tuples are seeded locally for rehearsal only.",
        "actual_pairing_requirement": "Need supplier-specific linkage flows and approved high-assurance identity posture.",
        "source_blueprint_refs": [
            "blueprint/phase-2-identity-and-echoes.md#NHS_login_bridge_and_local_session_engine",
            "official_im1_interface_guidance",
        ],
    },
    {
        "capability_family": "pairing_pack_and_environment_access",
        "vecells_target_posture": (
            "Provider mock API, unsupported test, supported test, and assurance are all distinct gates and stay visible as such."
        ),
        "mock_adapter_state": "Mock provider pack placeholders and simulator-backed unsupported-test rehearsal only.",
        "actual_pairing_requirement": "Need accepted PIP, licence completion, and provider-issued environment access.",
        "source_blueprint_refs": [
            "official_im1_pairing_process",
            "official_im1_interface_guidance",
        ],
    },
]

SCAL_DOMAIN_SPECS = [
    {
        "question_id": "SCAL_SCOPE_01",
        "assurance_domain": "architecture_and_product_scope",
        "capability_family": "bounded_use_case",
        "question_text": "What exact product scope is inside the IM1 submission, and what is kept out of scope?",
        "source_blueprint_refs": [
            "blueprint/blueprint-init.md#IM1-first_direction_and_provider_capability_matrix_law",
            "blueprint/phase-4-the-booking-engine.md#IM1-first_booking_boundaries_and_provider_specific_pairing",
            "official_im1_prerequisites_form",
            "official_scal_process",
        ],
        "mock_ref": "docs/assurance/123_im1_mock_now_execution.md#bounded-im1-scope",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#step-01-freeze-product-scope-and-named-owners",
        "actual_gap_state": "ready_for_conversion_after_scope_freeze",
        "owner_role": "ROLE_PROGRAMME_ARCHITECT",
    },
    {
        "question_id": "SCAL_SCOPE_02",
        "assurance_domain": "architecture_and_product_scope",
        "capability_family": "supplier_scope_and_targeting",
        "question_text": "Which supplier-specific route families and GP-system behaviours are being claimed?",
        "source_blueprint_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ProviderCapabilityMatrix",
            "official_im1_interface_guidance",
            "official_im1_pairing_process",
        ],
        "mock_ref": "data/assurance/im1_supplier_capability_matrix.csv",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_supplier_capability_and_pairing_assumptions.md#actual_production_strategy_later",
        "actual_gap_state": "provider_pack_pending",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
    },
    {
        "question_id": "SCAL_TECH_01",
        "assurance_domain": "technical_conformance",
        "capability_family": "adapter_boundaries_and_runtime_contracts",
        "question_text": "How does Vecells keep supplier-specific behaviour behind adapter boundaries instead of hard-coding one GP supplier path?",
        "source_blueprint_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#AdapterContractProfile",
            "blueprint/blueprint-init.md#IM1-first_direction_and_provider_capability_matrix_law",
            "official_scal_process",
        ],
        "mock_ref": "data/analysis/im1_pairing_pack.json#artifacts",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_scal_response_strategy.md#technical-conformance",
        "actual_gap_state": "ready_for_refresh_before_submission",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
    },
    {
        "question_id": "SCAL_TECH_02",
        "assurance_domain": "technical_conformance",
        "capability_family": "confirmation_and_slot_truth",
        "question_text": "What proof chain keeps slot freshness, commit ambiguity, and authoritative booking confirmation honest?",
        "source_blueprint_refs": [
            "blueprint/phase-4-the-booking-engine.md#Commit_path_revalidation_booking_record_and_compensation",
            "blueprint/forensic-audit-findings.md#Booking_commit_path_truth",
            "official_scal_process",
        ],
        "mock_ref": "data/analysis/gp_booking_capability_evidence.json#path_requirements",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_scal_response_strategy.md#technical-conformance",
        "actual_gap_state": "provider_pack_pending",
        "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
    },
    {
        "question_id": "SCAL_SAFETY_01",
        "assurance_domain": "clinical_safety",
        "capability_family": "clinical_safety",
        "question_text": "What DCB0129 hazard, safety-case, and review evidence supports the current IM1-facing product scope?",
        "source_blueprint_refs": [
            "blueprint/phase-1-the-red-flag-gate.md#Clinical_safety_documentation",
            "official_im1_prerequisites_form",
            "official_scal_user_guide",
        ],
        "mock_ref": "data/assurance/dcb0129_hazard_register.json#summary",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#step-02-refresh-clinical-safety-and-ig-evidence",
        "actual_gap_state": "ready_for_refresh_before_submission",
        "owner_role": "ROLE_MANUFACTURER_CSO",
    },
    {
        "question_id": "SCAL_SAFETY_02",
        "assurance_domain": "clinical_safety",
        "capability_family": "rfc_change_control",
        "question_text": "How will AI or other material product changes trigger RFC, updated SCAL, and refreshed safety evidence?",
        "source_blueprint_refs": [
            "blueprint/phase-8-the-assistive-layer.md#RFC_and_AI_scope_delta_law",
            "official_im1_pairing_process",
        ],
        "mock_ref": "data/analysis/im1_pairing_pack.json#rfc_watch",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#step-08-live-rollout-rfc-and-assurance-refresh",
        "actual_gap_state": "watch_rfc_trigger",
        "owner_role": "ROLE_MANUFACTURER_CSO",
    },
    {
        "question_id": "SCAL_IG_01",
        "assurance_domain": "information_governance_and_security",
        "capability_family": "ig_and_privacy",
        "question_text": "What current DPIA, privacy, DSPT, and UK-processing evidence supports the IM1 submission story?",
        "source_blueprint_refs": [
            "blueprint/phase-9-the-assurance-ledger.md#Evidence_graph",
            "official_im1_prerequisites_form",
            "official_scal_user_guide",
        ],
        "mock_ref": "data/assurance/dspt_gap_register.json#summary",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "data/assurance/im1_gap_register.json#GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121",
        "actual_gap_state": "dependency_refresh_required",
        "owner_role": "ROLE_SECURITY_LEAD",
    },
    {
        "question_id": "SCAL_IG_02",
        "assurance_domain": "information_governance_and_security",
        "capability_family": "pen_test_and_isms",
        "question_text": "What technical and security test evidence will convert from rehearsal into submittable SCAL evidence?",
        "source_blueprint_refs": [
            "official_scal_user_guide",
            "official_im1_prerequisites_form",
            "blueprint/phase-0-the-foundation-protocol.md#Release_publication_and_assurance_law",
        ],
        "mock_ref": "docs/assurance/123_scal_response_strategy.md#mock_now_execution",
        "mock_gap_state": "gap_open",
        "actual_ref": "docs/assurance/123_scal_response_strategy.md#actual_production_strategy_later",
        "actual_gap_state": "gap_open",
        "owner_role": "ROLE_SECURITY_LEAD",
    },
    {
        "question_id": "SCAL_TEST_01",
        "assurance_domain": "test_evidence_and_simulator_evidence",
        "capability_family": "unsupported_test_and_simulator_proof",
        "question_text": "What simulator-backed evidence proves the architecture now without pretending provider acceptance already exists?",
        "source_blueprint_refs": [
            "blueprint/phase-cards.md#Create_local_simulators",
            "blueprint/phase-4-the-booking-engine.md#Develop_against_deterministic_mocks_first",
            "official_im1_pairing_process",
        ],
        "mock_ref": "docs/assurance/123_im1_mock_now_execution.md#simulator-backed-evidence-placeholders",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#step-06-provider-mock-api-and-unsupported-test",
        "actual_gap_state": "awaiting_provider_mock_api_access",
        "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
    },
    {
        "question_id": "SCAL_TEST_02",
        "assurance_domain": "test_evidence_and_simulator_evidence",
        "capability_family": "supported_test_and_assurance_entry",
        "question_text": "What is the entry bar for supported test, assurance review, and live rollout?",
        "source_blueprint_refs": [
            "official_im1_pairing_process",
            "official_scal_user_guide",
        ],
        "mock_ref": "data/analysis/im1_live_gate_checklist.json#live_gates",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#step-07-supported-test-assurance-and-live-gates",
        "actual_gap_state": "blocked_until_completed_scal_and_environment_access",
        "owner_role": "ROLE_RELEASE_MANAGER",
    },
    {
        "question_id": "SCAL_CHANGE_01",
        "assurance_domain": "release_and_change_control_evidence",
        "capability_family": "release_and_publication_truth",
        "question_text": "How does the pack prove that mock-now engineering work stays visibly non-submittable and does not leak into live approval claims?",
        "source_blueprint_refs": [
            "blueprint/forensic-audit-findings.md#Stale_writable_posture",
            "blueprint/phase-0-the-foundation-protocol.md#Release_publication_law",
            "official_scal_process",
        ],
        "mock_ref": "docs/assurance/123_im1_prerequisite_readiness_pack.md#mock-now-versus-actual-pairing-law",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_im1_actual_pairing_strategy_later.md#live-route-and-non-submittable-law",
        "actual_gap_state": "ready_for_conversion_after_named-owners",
        "owner_role": "ROLE_RELEASE_MANAGER",
    },
    {
        "question_id": "SCAL_PROVIDER_01",
        "assurance_domain": "provider_compatibility_and_licence_gating",
        "capability_family": "provider_pack_and_environment_access",
        "question_text": "What supplier-specific PIP, compatibility review, and Model Interface Licence evidence is still missing?",
        "source_blueprint_refs": [
            "official_im1_pairing_process",
            "official_im1_interface_guidance",
        ],
        "mock_ref": "docs/assurance/123_supplier_capability_and_pairing_assumptions.md#mock_now_execution",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "data/assurance/im1_gap_register.json#GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING",
        "actual_gap_state": "provider_pack_pending",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
    },
    {
        "question_id": "SCAL_PROVIDER_02",
        "assurance_domain": "provider_compatibility_and_licence_gating",
        "capability_family": "supplier_specific_functionality",
        "question_text": "Which capability claims must stay supplier-specific instead of being presented as generic IM1 truth?",
        "source_blueprint_refs": [
            "blueprint/blueprint-init.md#IM1-first_direction_and_provider_capability_matrix_law",
            "official_im1_interface_guidance",
        ],
        "mock_ref": "data/assurance/im1_supplier_capability_matrix.csv",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "docs/assurance/123_supplier_capability_and_pairing_assumptions.md#actual_production_strategy_later",
        "actual_gap_state": "provider_pack_pending",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
    },
    {
        "question_id": "SCAL_ASSURANCE_01",
        "assurance_domain": "supported_test_and_assurance_entry_criteria",
        "capability_family": "submission_and_live_gate_readiness",
        "question_text": "What blockers must be cleared before the mock dossier can become a real IM1 prerequisites submission and SCAL pack?",
        "source_blueprint_refs": [
            "official_im1_pairing_process",
            "official_scal_user_guide",
            "blueprint/forensic-audit-findings.md#Optimistic_supplier_capability_claims",
        ],
        "mock_ref": "data/assurance/im1_gap_register.json#summary",
        "mock_gap_state": "covered_with_mock_evidence",
        "actual_ref": "data/assurance/im1_artifact_index.json#conversion_workflow",
        "actual_gap_state": "conversion_blockers_named",
        "owner_role": "ROLE_INTEROPERABILITY_LEAD",
    },
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({name: stringify_csv_value(row.get(name, "")) for name in fieldnames})


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def stringify_csv_value(value: Any) -> str:
    if isinstance(value, list):
        return "|".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value)


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def summarise_path_ref(path: Path, fragment: str | None = None) -> str:
    relative = rel(path)
    return f"{relative}#{fragment}" if fragment else relative


def load_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    require(not missing, "Missing par_123 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {
        "pairing_pack": read_json(PAIRING_PACK_PATH),
        "field_map": read_json(PREREQUISITES_FIELD_MAP_PATH),
        "scal_artifacts": read_csv(SCAL_ARTIFACT_MATRIX_PATH),
        "provider_register": read_json(PROVIDER_REGISTER_PATH),
        "live_gates": read_json(LIVE_GATES_PATH),
        "booking_capability": read_json(BOOKING_CAPABILITY_PATH),
        "dcb0129": read_json(DCB0129_PATH),
        "dspt_gaps": read_json(DSPT_GAP_PATH),
    }
    require(inputs["pairing_pack"]["summary"]["provider_supplier_count"] >= 2, "Expected at least 2 IM1 suppliers")
    require(
        inputs["pairing_pack"]["summary"]["phase0_entry_verdict"] == "withheld",
        "par_123 expects IM1 real submission to remain fail-closed",
    )
    return inputs


def capability_family_for_field(field_id: str, section: str) -> str:
    if field_id.startswith("fld_contact_") or field_id in {"fld_organisation_name", "fld_product_name"}:
        return "submission_identity_and_scope"
    if "Clinical safety" in section:
        return "clinical_safety"
    if "Information governance" in section:
        return "information_governance_and_security"
    if "Provider suppliers" in section:
        return "supplier_scope_and_targeting"
    if field_id.startswith("fld_bounded_") or field_id.startswith("fld_capability_") or field_id.startswith("fld_route_"):
        return "stage_one_scal_preparation"
    if field_id.startswith("fld_booking_truth_") or field_id.startswith("fld_architecture_"):
        return "technical_conformance_and_booking_truth"
    if field_id.startswith("fld_named_") or field_id.startswith("fld_environment_target"):
        return "actual_pairing_governance"
    if field_id.startswith("fld_rfc_"):
        return "rfc_change_control"
    return "im1_prerequisites"


def owner_role_for_field(field_id: str, section: str) -> str:
    if field_id in {"fld_contact_name", "fld_contact_email", "fld_organisation_name"}:
        return "ROLE_INTEROPERABILITY_LEAD"
    if field_id == "fld_product_name":
        return "ROLE_PROGRAMME_ARCHITECT"
    if "Clinical safety" in section or "fld_samd_scrutiny" in field_id:
        return "ROLE_MANUFACTURER_CSO"
    if "Information governance" in section:
        if "dpia" in field_id:
            return "ROLE_DPO"
        return "ROLE_SECURITY_LEAD"
    if "Provider suppliers" in section or field_id.startswith("fld_route_family"):
        return "ROLE_INTEROPERABILITY_LEAD"
    if field_id.startswith("fld_bounded_") or field_id.startswith("fld_architecture_"):
        return "ROLE_PROGRAMME_ARCHITECT"
    if field_id.startswith("fld_booking_truth_"):
        return "ROLE_BOOKING_DOMAIN_LEAD"
    if field_id.startswith("fld_named_"):
        return "ROLE_COMMERCIAL_OWNER"
    if field_id.startswith("fld_environment_target"):
        return "ROLE_RELEASE_MANAGER"
    if field_id.startswith("fld_rfc_"):
        return "ROLE_MANUFACTURER_CSO"
    return "ROLE_INTEROPERABILITY_LEAD"


def supplier_scope_for_field(field_id: str) -> str:
    if field_id == "fld_supplier_emis_selected":
        return "optum_emisweb"
    if field_id == "fld_supplier_tpp_selected":
        return "tpp_systmone"
    return "cross_supplier"


def required_prerequisite_for_field(field_id: str, section: str, dspt_stale: bool) -> str:
    if field_id in {"fld_contact_name", "fld_contact_email", "fld_organisation_name"}:
        return "Named IM1 submitter and approved legal entity"
    if field_id == "fld_product_name":
        return "Bounded product naming and scope freeze"
    if "Clinical safety" in section:
        return "Current DCB0129 hazard register and safety-case structure"
    if "Information governance" in section:
        if dspt_stale:
            return "Refresh DSPT evidence after par_121 and close the stale prerequisite dependency"
        return "Current DSPT, DPIA, ISMS, and pen-test evidence pack"
    if "Provider suppliers" in section:
        return "Current provider-supplier roster and supplier-specific targeting decision"
    if field_id.startswith("fld_bounded_") or field_id.startswith("fld_capability_"):
        return "Current bounded use case, ProviderCapabilityMatrix digest, and route-family compatibility digest"
    if field_id.startswith("fld_booking_truth_"):
        return "Booking truth guardrail statement and authoritative confirmation proof chain"
    if field_id.startswith("fld_architecture_"):
        return "Current runtime topology, architecture summary, and data-flow references"
    if field_id.startswith("fld_named_"):
        return "Named sponsor, commercial owner, and approver for real IM1 submission"
    if field_id.startswith("fld_environment_target"):
        return "Explicit target environment and supported-test plan"
    if field_id.startswith("fld_rfc_"):
        return "Current RFC change class registry for AI and other significant scope changes"
    return "Current IM1 readiness pack"


def track_values_for_field(field: dict[str, Any], dspt_stale: bool) -> dict[str, dict[str, str]]:
    field_id = field["field_id"]
    section = field["section"]
    capability_family = capability_family_for_field(field_id, section)
    supplier_scope = supplier_scope_for_field(field_id)
    owner_role = owner_role_for_field(field_id, section)

    mock_ref = summarise_path_ref(PREREQUISITES_FIELD_MAP_PATH, field_id)
    mock_gap_state = "covered_with_mock_evidence"
    mock_notes = "Pre-pairing response only; keep it visible as rehearsal-grade and non-submittable."

    if "Clinical safety" in section:
        mock_ref = summarise_path_ref(DCB0129_PATH, "summary")
    elif "Information governance" in section:
        mock_ref = summarise_path_ref(DSPT_GAP_PATH, "summary")
    elif "Provider suppliers" in section:
        mock_ref = summarise_path_ref(PROVIDER_REGISTER_PATH, "providers")
    elif field_id.startswith("fld_bounded_") or field_id.startswith("fld_capability_") or field_id.startswith("fld_route_"):
        mock_ref = summarise_path_ref(PREREQUISITES_FIELD_MAP_PATH, field_id)
    elif field_id.startswith("fld_booking_truth_"):
        mock_ref = summarise_path_ref(BOOKING_CAPABILITY_PATH, "path_requirements")
    elif field_id.startswith("fld_architecture_"):
        mock_ref = summarise_path_ref(PAIRING_PACK_PATH, "artifacts")
    elif field_id.startswith("fld_named_") or field_id.startswith("fld_environment_target"):
        mock_ref = summarise_path_ref(LIVE_GATES_PATH, "live_gates")
        mock_gap_state = "gap_open"
        mock_notes = "Mock dossier records the blocker explicitly instead of faking live approval."
    elif field_id.startswith("fld_rfc_"):
        mock_ref = summarise_path_ref(PAIRING_PACK_PATH, "rfc_watch")

    actual_ref = summarise_path_ref(DOC_ACTUAL_PATH)
    actual_gap_state = "ready_for_conversion_after_submission"
    actual_submittable = "conversion_plan_only"
    actual_notes = "Convert only after the prerequisites form, SCAL, and provider-specific gates are current."

    if field_id in {"fld_contact_name", "fld_contact_email", "fld_organisation_name"}:
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED")
        actual_gap_state = "gap_open"
        actual_submittable = "not_submittable_until_named_owner_and_legal_entity_confirmed"
    elif "Clinical safety" in section:
        actual_ref = summarise_path_ref(DOC_ACTUAL_PATH, "step-02-refresh-clinical-safety-and-ig-evidence")
        actual_gap_state = "ready_for_refresh_before_submission"
    elif "Information governance" in section:
        if dspt_stale:
            actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121")
            actual_gap_state = "dependency_refresh_required"
            actual_submittable = "not_submittable_until_dspt_refresh_and_security_evidence_current"
        else:
            actual_ref = summarise_path_ref(DOC_ACTUAL_PATH, "step-02-refresh-clinical-safety-and-ig-evidence")
            actual_gap_state = "ready_for_refresh_before_submission"
    elif field_id == "fld_supplier_emis_selected":
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_PROVIDER_PACK_EMIS_PENDING")
        actual_gap_state = "provider_pack_pending"
        actual_submittable = "not_submittable_until_provider_pack_and_compatibility_review_complete"
    elif field_id == "fld_supplier_tpp_selected":
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_PROVIDER_PACK_TPP_PENDING")
        actual_gap_state = "provider_pack_pending"
        actual_submittable = "not_submittable_until_provider_pack_and_compatibility_review_complete"
    elif field_id.startswith("fld_bounded_") or field_id.startswith("fld_capability_") or field_id.startswith("fld_route_"):
        actual_ref = summarise_path_ref(DOC_SCAL_PATH, "actual_production_strategy_later")
        actual_gap_state = "wait_for_stage_one_scal_after_prerequisites"
        actual_submittable = "conversion_plan_only"
    elif field_id.startswith("fld_booking_truth_"):
        actual_ref = summarise_path_ref(DOC_SUPPLIER_PATH, "actual_production_strategy_later")
        actual_gap_state = "provider_pack_pending"
        actual_submittable = "not_submittable_until_supplier_confirmation_semantics_evidenced"
    elif field_id.startswith("fld_architecture_"):
        actual_ref = summarise_path_ref(DOC_SCAL_PATH, "actual_production_strategy_later")
        actual_gap_state = "ready_for_refresh_before_submission"
    elif field_id.startswith("fld_named_"):
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED")
        actual_gap_state = "gap_open"
        actual_submittable = "not_submittable_until_named_owner_and_legal_entity_confirmed"
    elif field_id.startswith("fld_environment_target"):
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING")
        actual_gap_state = "blocked_until_completed_scal_and_environment_access"
        actual_submittable = "not_submittable_until_supported_test_path_confirmed"
    elif field_id.startswith("fld_rfc_"):
        actual_ref = summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED")
        actual_gap_state = "watch_rfc_trigger"
        actual_submittable = "submittable_only_for_current_assured_scope"
        actual_notes = "Any future AI or material scope change requires RFC plus refreshed SCAL and associated documentation."

    return {
        MOCK_TRACK: {
            "response_value": field["mock_value"],
            "submittable_state": "pre_pairing_non_submittable",
            "current_evidence_ref": mock_ref,
            "gap_state": mock_gap_state,
            "notes": mock_notes,
            "capability_family": capability_family,
            "supplier_scope": supplier_scope,
            "owner_role": owner_role,
        },
        ACTUAL_TRACK: {
            "response_value": field["actual_placeholder"],
            "submittable_state": actual_submittable,
            "current_evidence_ref": actual_ref,
            "gap_state": actual_gap_state,
            "notes": actual_notes,
            "capability_family": capability_family,
            "supplier_scope": supplier_scope,
            "owner_role": owner_role,
        },
    }


def build_prerequisite_matrix(fields: list[dict[str, Any]], dspt_stale: bool) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for field in fields:
        track_values = track_values_for_field(field, dspt_stale)
        for track in TRACKS:
            values = track_values[track]
            rows.append(
                {
                    "question_id": field["field_id"],
                    "question_group": field["section"],
                    "question_label": field["label"],
                    "response_value": values["response_value"],
                    "artifact_id": f"ART_123_PREREQ_{field['field_id'].upper()}_{'MOCK' if track == MOCK_TRACK else 'ACTUAL'}",
                    "artifact_type": "im1_prerequisite_question",
                    "mock_or_actual": track,
                    "submittable_state": values["submittable_state"],
                    "source_blueprint_refs": field["source_refs"],
                    "official_process_stage": field["required_for"],
                    "supplier_scope": values["supplier_scope"],
                    "capability_family": values["capability_family"],
                    "required_prerequisite": required_prerequisite_for_field(field["field_id"], field["section"], dspt_stale),
                    "current_evidence_ref": values["current_evidence_ref"],
                    "gap_state": values["gap_state"],
                    "owner_role": values["owner_role"],
                    "review_due_at": DEFAULT_REVIEW_DUE_AT,
                    "notes": values["notes"],
                }
            )
    return rows


def build_gap_register(inputs: dict[str, Any]) -> dict[str, Any]:
    dspt_stale = any(
        gap["gap_id"] == "PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING"
        for gap in inputs["dspt_gaps"]["gaps"]
    )
    gaps = [
        {
            "gap_id": "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED",
            "title": "Named IM1 submitter, sponsor, approver, and legal signatory chain is not fixed",
            "gap_class": "actual_pairing_blocker",
            "status": "gap_open",
            "priority": "high",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "submission_governance",
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "required_prerequisite": "Named human owners for real portal submission and agreement execution",
            "current_evidence_ref": summarise_path_ref(LIVE_GATES_PATH, "live_gates"),
            "owner_role": "ROLE_COMMERCIAL_OWNER",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "data/analysis/im1_live_gate_checklist.json",
            ],
            "notes": "Mock-now work uses placeholders only; no real submission may proceed until the named owner chain exists.",
        },
        {
            "gap_id": "GAP_IM1_PROVIDER_PACK_EMIS_PENDING",
            "title": "Optum (EMISWeb) provider-specific PIP and compatibility evidence is still pending",
            "gap_class": "supplier_specific_capability_gap",
            "status": "provider_pack_pending",
            "priority": "high",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "optum_emisweb",
            "capability_family": "supplier_specific_functionality",
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "required_prerequisite": "Accepted feasibility review plus supplier-specific PIP",
            "current_evidence_ref": summarise_path_ref(PROVIDER_REGISTER_PATH, "providers"),
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_interface_guidance", "official_im1_pairing_process"],
            "notes": "Do not claim Optum-specific functionality beyond the simulator-backed baseline until the real provider pack exists.",
        },
        {
            "gap_id": "GAP_IM1_PROVIDER_PACK_TPP_PENDING",
            "title": "TPP (SystmOne) provider-specific PIP and compatibility evidence is still pending",
            "gap_class": "supplier_specific_capability_gap",
            "status": "provider_pack_pending",
            "priority": "high",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "tpp_systmone",
            "capability_family": "supplier_specific_functionality",
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "required_prerequisite": "Accepted feasibility review plus supplier-specific PIP",
            "current_evidence_ref": summarise_path_ref(PROVIDER_REGISTER_PATH, "providers"),
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_interface_guidance", "official_im1_pairing_process"],
            "notes": "Do not claim TPP-specific functionality beyond the simulator-backed baseline until the real provider pack exists.",
        },
        {
            "gap_id": "GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121",
            "title": "DSPT pack still carries a stale par_121 prerequisite blocker",
            "gap_class": "parallel_dependency_refresh",
            "status": "gap_open" if dspt_stale else "closed",
            "priority": "high" if dspt_stale else "low",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "ig_and_security",
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "required_prerequisite": "Refresh DSPT evidence so IM1 clinical and IG statements do not depend on a stale blocker",
            "current_evidence_ref": summarise_path_ref(DSPT_GAP_PATH, "summary"),
            "owner_role": "ROLE_SECURITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "source_blueprint_refs": ["prompt/122.md", "prompt/123.md", "data/assurance/dspt_gap_register.json"],
            "notes": (
                "This task does not rewrite par_122 outputs in place. It records the stale dependency explicitly so "
                "actual IM1 submission cannot pretend the DSPT chain is already current."
            ),
        },
        {
            "gap_id": "GAP_IM1_STAGE_ONE_SCAL_TEMPLATE_AND_COMPATIBILITY_ISSUANCE_PENDING",
            "title": "Stage-one SCAL and supplier compatibility review remain externally gated",
            "gap_class": "external_stage_gate",
            "status": "awaiting_external_stage_transition",
            "priority": "medium",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "stage_one_scal_preparation",
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "required_prerequisite": "Prerequisites confirmed and stage-one SCAL issued by NHS England",
            "current_evidence_ref": summarise_path_ref(DOC_ACTUAL_PATH, "step-04-complete-stage-one-scal-and-provider-compatibility-review"),
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_pairing_process", "official_scal_process"],
            "notes": "The repo can prepare now, but stage-one SCAL issuance and compatibility review are still external triggers.",
        },
        {
            "gap_id": "GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING",
            "title": "Model Interface Licence execution cannot proceed because named legal signatories are still pending",
            "gap_class": "legal_and_licence_blocker",
            "status": "gap_open",
            "priority": "high",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "model_interface_licence",
            "official_process_stage": "model_interface_licence",
            "required_prerequisite": "Named legal signatories and approved licence review path",
            "current_evidence_ref": summarise_path_ref(PAIRING_PACK_PATH, "artifacts"),
            "owner_role": "ROLE_COMMERCIAL_OWNER",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_pairing_process", "data/analysis/im1_pairing_pack.json"],
            "notes": "Licence readiness is modeled now with placeholders only; do not imply execution readiness.",
        },
        {
            "gap_id": "GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING",
            "title": "Supported-test and assurance entry criteria are not yet fully met",
            "gap_class": "environment_access_blocker",
            "status": "gap_open",
            "priority": "high",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "supported_test_and_assurance_entry",
            "official_process_stage": "supported_test_environment",
            "required_prerequisite": "Completed SCAL, provider mock or unsupported test evidence, and explicit target environment",
            "current_evidence_ref": summarise_path_ref(LIVE_GATES_PATH, "live_gates"),
            "owner_role": "ROLE_RELEASE_MANAGER",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_pairing_process", "official_scal_user_guide"],
            "notes": "Supported test, assurance, and live remain separate gates. None may be implied from simulator success.",
        },
        {
            "gap_id": "GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED",
            "title": "AI or other material functional change must reopen the IM1 pack via RFC and refreshed SCAL",
            "gap_class": "change_control_watch",
            "status": "watch_open",
            "priority": "medium",
            "responsibility_boundary": "supplier_manufacturer",
            "supplier_scope": "cross_supplier",
            "capability_family": "rfc_change_control",
            "official_process_stage": "rfc_for_material_change",
            "required_prerequisite": "Updated SCAL, refreshed hazard log, refreshed DPIA, and other associated documentation",
            "current_evidence_ref": summarise_path_ref(PAIRING_PACK_PATH, "rfc_watch"),
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "source_blueprint_refs": ["official_im1_pairing_process", "blueprint/phase-8-the-assistive-layer.md#RFC_and_AI_scope_delta_law"],
            "notes": "This is not a current blocker for bounded mock-now engineering, but it must stay explicit in the real pairing path.",
        },
    ]
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "reviewed_at": REVIEWED_AT,
        "standards_version": STANDARDS_VERSION,
        "summary": {
            "gap_count": len(gaps),
            "high_priority_count": len([gap for gap in gaps if gap["priority"] == "high"]),
            "provider_pack_pending_count": len([gap for gap in gaps if gap["status"] == "provider_pack_pending"]),
            "blocked_or_open_actual_count": len([gap for gap in gaps if gap["status"] in {"gap_open", "provider_pack_pending", "awaiting_external_stage_transition"}]),
            "watch_count": len([gap for gap in gaps if gap["status"] == "watch_open"]),
        },
        "gaps": gaps,
    }


def build_artifact_index(inputs: dict[str, Any], gap_register: dict[str, Any]) -> dict[str, Any]:
    artifacts = [
        {
            "artifact_id": "ART_123_MOCK_PRODUCT_SCOPE_DOSSIER",
            "artifact_type": "product_scope_dossier",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "blueprint/blueprint-init.md#IM1-first_direction_and_provider_capability_matrix_law",
                "official_im1_prerequisites_form",
            ],
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "supplier_scope": "cross_supplier",
            "capability_family": "bounded_use_case",
            "required_prerequisite": "Current product description and bounded IM1 use case",
            "current_evidence_ref": summarise_path_ref(PREREQUISITES_FIELD_MAP_PATH, "fld_bounded_im1_use_case"),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Defines the bounded IM1-facing scope for rehearsal while explicitly excluding Phase 2 identity shortcuts.",
        },
        {
            "artifact_id": "ART_123_MOCK_PREREQUISITE_RESPONSE_MODEL",
            "artifact_type": "im1_prerequisite_response_model",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "prompt/123.md",
                "official_im1_prerequisites_form",
            ],
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "supplier_scope": "cross_supplier",
            "capability_family": "submission_identity_and_scope",
            "required_prerequisite": "Current public prerequisite form structure",
            "current_evidence_ref": summarise_path_ref(PREREQUISITE_MATRIX_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Provides truthful pre-pairing draft answers without presenting them as submittable evidence.",
        },
        {
            "artifact_id": "ART_123_MOCK_SCAL_RESPONSE_MAP",
            "artifact_type": "scal_response_map",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "official_scal_process",
                "official_scal_user_guide",
            ],
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "supplier_scope": "cross_supplier",
            "capability_family": "stage_one_scal_preparation",
            "required_prerequisite": "Current stage-one SCAL evidence split and product-scoped question bank",
            "current_evidence_ref": summarise_path_ref(SCAL_QUESTION_BANK_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Breaks likely SCAL burden into source-traceable questions while keeping the pack visibly rehearsal-only.",
        },
        {
            "artifact_id": "ART_123_MOCK_SUPPLIER_CAPABILITY_DOSSIER",
            "artifact_type": "supplier_capability_dossier",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#ProviderCapabilityMatrix",
                "official_im1_interface_guidance",
            ],
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "supplier_scope": "cross_supplier",
            "capability_family": "supplier_specific_functionality",
            "required_prerequisite": "Current supplier roster and ProviderCapabilityMatrix digest",
            "current_evidence_ref": summarise_path_ref(SUPPLIER_MATRIX_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Separates what Vecells wants, what the twins simulate, and what cannot be claimed until supplier-specific evidence exists.",
        },
        {
            "artifact_id": "ART_123_MOCK_PROVIDER_PACK_PLACEHOLDER_EMIS",
            "artifact_type": "provider_pack_placeholder",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "official_im1_interface_guidance",
                "official_im1_pairing_process",
            ],
            "official_process_stage": "provider_mock_api_access",
            "supplier_scope": "optum_emisweb",
            "capability_family": "pairing_pack_and_environment_access",
            "required_prerequisite": "Current public supplier roster and compatibility assumptions",
            "current_evidence_ref": summarise_path_ref(DOC_SUPPLIER_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Mock placeholder only. No real Optum PIP or provider-issued test access is implied.",
        },
        {
            "artifact_id": "ART_123_MOCK_PROVIDER_PACK_PLACEHOLDER_TPP",
            "artifact_type": "provider_pack_placeholder",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "official_im1_interface_guidance",
                "official_im1_pairing_process",
            ],
            "official_process_stage": "provider_mock_api_access",
            "supplier_scope": "tpp_systmone",
            "capability_family": "pairing_pack_and_environment_access",
            "required_prerequisite": "Current public supplier roster and compatibility assumptions",
            "current_evidence_ref": summarise_path_ref(DOC_SUPPLIER_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Mock placeholder only. No real TPP PIP or provider-issued test access is implied.",
        },
        {
            "artifact_id": "ART_123_MOCK_SIMULATOR_EVIDENCE_PACK",
            "artifact_type": "simulator_evidence_pack",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "blueprint/phase-cards.md#Create_local_simulators",
                "blueprint/phase-4-the-booking-engine.md#Develop_against_deterministic_mocks_first",
            ],
            "official_process_stage": "unsupported_test_execution",
            "supplier_scope": "cross_supplier",
            "capability_family": "unsupported_test_and_simulator_proof",
            "required_prerequisite": "Current IM1 twins and canonical booking truth projection",
            "current_evidence_ref": summarise_path_ref(DOC_MOCK_PATH, "simulator-backed-evidence-placeholders"),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_BOOKING_DOMAIN_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Lets engineering test realistic IM1-facing behaviour now while making clear this is not provider-issued unsupported-test evidence.",
        },
        {
            "artifact_id": "ART_123_MOCK_ASSURANCE_INDEX",
            "artifact_type": "assurance_evidence_index",
            "mock_or_actual": MOCK_TRACK,
            "submittable_state": "pre_pairing_non_submittable",
            "source_blueprint_refs": [
                "prompt/123.md",
                "official_scal_process",
                "official_scal_user_guide",
            ],
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "supplier_scope": "cross_supplier",
            "capability_family": "assurance_readiness",
            "required_prerequisite": "Current safety, DSPT, privacy, and technical evidence references",
            "current_evidence_ref": summarise_path_ref(ARTIFACT_INDEX_PATH),
            "gap_state": "covered_with_mock_evidence",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_REVIEW_DUE_AT,
            "notes": "Central index that engineering and assurance can use now without pretending the evidence is already submittable.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_PREREQUISITES_SUBMISSION_CONVERSION",
            "artifact_type": "actual_submission_conversion_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "conversion_plan_only",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "official_im1_prerequisites_form",
            ],
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "supplier_scope": "cross_supplier",
            "capability_family": "submission_governance",
            "required_prerequisite": "Named submitter, sponsor, approved legal entity, and refreshed prerequisite evidence",
            "current_evidence_ref": summarise_path_ref(DOC_ACTUAL_PATH, "step-03-submit-the-current-public-prerequisites-form"),
            "gap_state": "gap_open",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "Real submission remains blocked until named owners and prerequisite evidence are current.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_STAGE_ONE_SCAL_EXECUTION_PLAN",
            "artifact_type": "stage_one_scal_execution_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "conversion_plan_only",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "official_scal_process",
                "official_scal_user_guide",
            ],
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "supplier_scope": "cross_supplier",
            "capability_family": "stage_one_scal_preparation",
            "required_prerequisite": "Prerequisites accepted and stage-one SCAL issued",
            "current_evidence_ref": summarise_path_ref(DOC_SCAL_PATH, "actual_production_strategy_later"),
            "gap_state": "awaiting_external_stage_transition",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "Real stage-one SCAL work cannot bypass prerequisite confirmation or supplier-specific compatibility review.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_MODEL_INTERFACE_LICENCE_PLAN",
            "artifact_type": "model_interface_licence_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "conversion_plan_only",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
            ],
            "official_process_stage": "model_interface_licence",
            "supplier_scope": "cross_supplier",
            "capability_family": "model_interface_licence",
            "required_prerequisite": "Named signatories and completed legal review path",
            "current_evidence_ref": summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING"),
            "gap_state": "gap_open",
            "owner_role": "ROLE_COMMERCIAL_OWNER",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "A plan only. Licence execution stays blocked until signatories are approved.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_PROVIDER_TEST_ACCESS_PLAN",
            "artifact_type": "provider_test_access_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "conversion_plan_only",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "official_im1_interface_guidance",
            ],
            "official_process_stage": "provider_mock_api_access",
            "supplier_scope": "cross_supplier",
            "capability_family": "pairing_pack_and_environment_access",
            "required_prerequisite": "Supplier-specific PIP, provider mock API access, and unsupported-test plan",
            "current_evidence_ref": summarise_path_ref(DOC_ACTUAL_PATH, "step-06-provider-mock-api-and-unsupported-test"),
            "gap_state": "provider_pack_pending",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "Keeps provider mock API, unsupported test, and supported test separate instead of compressing them into one implied step.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_ASSURANCE_AND_LIVE_GATE_PLAN",
            "artifact_type": "assurance_and_live_gate_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "conversion_plan_only",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "official_scal_user_guide",
            ],
            "official_process_stage": "supported_test_environment",
            "supplier_scope": "cross_supplier",
            "capability_family": "supported_test_and_assurance_entry",
            "required_prerequisite": "Completed SCAL, supported test access, accepted assurance evidence, and named environment target",
            "current_evidence_ref": summarise_path_ref(GAP_REGISTER_PATH, "GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING"),
            "gap_state": "gap_open",
            "owner_role": "ROLE_RELEASE_MANAGER",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "Real assurance and live rollout remain blocked until the supported-test gate is genuinely open.",
        },
        {
            "artifact_id": "ART_123_ACTUAL_RFC_DELTA_PLAN",
            "artifact_type": "rfc_delta_plan",
            "mock_or_actual": ACTUAL_TRACK,
            "submittable_state": "submittable_only_for_current_assured_scope",
            "source_blueprint_refs": [
                "official_im1_pairing_process",
                "blueprint/phase-8-the-assistive-layer.md#RFC_and_AI_scope_delta_law",
            ],
            "official_process_stage": "rfc_for_material_change",
            "supplier_scope": "cross_supplier",
            "capability_family": "rfc_change_control",
            "required_prerequisite": "Updated SCAL, refreshed safety and privacy evidence, and change-class review",
            "current_evidence_ref": summarise_path_ref(DOC_ACTUAL_PATH, "step-08-live-rollout-rfc-and-assurance-refresh"),
            "gap_state": "watch_rfc_trigger",
            "owner_role": "ROLE_MANUFACTURER_CSO",
            "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
            "notes": "Ensures later AI or material scope changes reopen the pack instead of inheriting stale approval.",
        },
    ]

    conversion_workflow = [
        {
            "step_id": "STEP_01_FREEZE_SCOPE_AND_NAMED_OWNERS",
            "step_label": "Freeze product scope and named owners",
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "mock_inputs": [
                "ART_123_MOCK_PRODUCT_SCOPE_DOSSIER",
                "ART_123_MOCK_PREREQUISITE_RESPONSE_MODEL",
            ],
            "actual_outputs": ["ART_123_ACTUAL_PREREQUISITES_SUBMISSION_CONVERSION"],
            "blockers": [
                "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED",
            ],
            "notes": "This is where the mock scope stops being a rehearsal note and becomes a named real submission pack.",
        },
        {
            "step_id": "STEP_02_REFRESH_CLINICAL_SAFETY_AND_IG_EVIDENCE",
            "step_label": "Refresh DCB0129, DSPT, DPIA, and security evidence",
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "mock_inputs": [
                "ART_123_MOCK_ASSURANCE_INDEX",
            ],
            "actual_outputs": ["ART_123_ACTUAL_PREREQUISITES_SUBMISSION_CONVERSION"],
            "blockers": [
                "GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121",
            ],
            "notes": "The pack must not claim actual readiness while the DSPT chain still references a stale blocker.",
        },
        {
            "step_id": "STEP_03_SUBMIT_THE_CURRENT_PUBLIC_PREREQUISITES_FORM",
            "step_label": "Submit the current public prerequisites form",
            "official_process_stage": "im1_clinical_and_ig_prerequisites",
            "mock_inputs": ["ART_123_MOCK_PREREQUISITE_RESPONSE_MODEL"],
            "actual_outputs": ["ART_123_ACTUAL_PREREQUISITES_SUBMISSION_CONVERSION"],
            "blockers": [
                "GAP_IM1_NAMED_SUBMITTER_AND_SPONSOR_NOT_FIXED",
            ],
            "notes": "All prerequisite fields are mandatory; the mock dossier is only a draft until the named owner chain is real.",
        },
        {
            "step_id": "STEP_04_COMPLETE_STAGE_ONE_SCAL_AND_PROVIDER_COMPATIBILITY_REVIEW",
            "step_label": "Complete stage-one SCAL and supplier compatibility review",
            "official_process_stage": "stage_one_scal_and_compatibility_review",
            "mock_inputs": ["ART_123_MOCK_SCAL_RESPONSE_MAP", "ART_123_MOCK_SUPPLIER_CAPABILITY_DOSSIER"],
            "actual_outputs": ["ART_123_ACTUAL_STAGE_ONE_SCAL_EXECUTION_PLAN"],
            "blockers": [
                "GAP_IM1_STAGE_ONE_SCAL_TEMPLATE_AND_COMPATIBILITY_ISSUANCE_PENDING",
                "GAP_IM1_PROVIDER_PACK_EMIS_PENDING",
                "GAP_IM1_PROVIDER_PACK_TPP_PENDING",
            ],
            "notes": "Supplier-specific compatibility review stays explicit and cannot be replaced with simulator success.",
        },
        {
            "step_id": "STEP_05_EXECUTE_MODEL_INTERFACE_LICENCE",
            "step_label": "Execute the Model Interface Licence",
            "official_process_stage": "model_interface_licence",
            "mock_inputs": ["ART_123_MOCK_PROVIDER_PACK_PLACEHOLDER_EMIS", "ART_123_MOCK_PROVIDER_PACK_PLACEHOLDER_TPP"],
            "actual_outputs": ["ART_123_ACTUAL_MODEL_INTERFACE_LICENCE_PLAN"],
            "blockers": [
                "GAP_IM1_MODEL_INTERFACE_LICENCE_SIGNATORIES_PENDING",
            ],
            "notes": "Licence execution is a real human-governed gate, not an inferred formality.",
        },
        {
            "step_id": "STEP_06_PROVIDER_MOCK_API_AND_UNSUPPORTED_TEST",
            "step_label": "Use provider mock API and unsupported test evidence",
            "official_process_stage": "provider_mock_api_access",
            "mock_inputs": ["ART_123_MOCK_SIMULATOR_EVIDENCE_PACK"],
            "actual_outputs": ["ART_123_ACTUAL_PROVIDER_TEST_ACCESS_PLAN"],
            "blockers": [
                "GAP_IM1_PROVIDER_PACK_EMIS_PENDING",
                "GAP_IM1_PROVIDER_PACK_TPP_PENDING",
            ],
            "notes": "Provider mock API access and unsupported test remain distinct from supported test and live.",
        },
        {
            "step_id": "STEP_07_SUPPORTED_TEST_ASSURANCE_AND_LIVE_GATES",
            "step_label": "Request supported test, complete assurance, and gate live rollout",
            "official_process_stage": "supported_test_environment",
            "mock_inputs": ["ART_123_MOCK_ASSURANCE_INDEX"],
            "actual_outputs": ["ART_123_ACTUAL_ASSURANCE_AND_LIVE_GATE_PLAN"],
            "blockers": [
                "GAP_IM1_SUPPORTED_TEST_ENTRY_CRITERIA_PENDING",
            ],
            "notes": "Supported test, assurance, Recommended to Connect, Plan to Connect, and live stay serial and explicit.",
        },
        {
            "step_id": "STEP_08_LIVE_ROLLOUT_RFC_AND_ASSURANCE_REFRESH",
            "step_label": "Manage live rollout by supplier and reopen via RFC when scope changes",
            "official_process_stage": "rfc_for_material_change",
            "mock_inputs": ["ART_123_MOCK_ASSURANCE_INDEX"],
            "actual_outputs": ["ART_123_ACTUAL_RFC_DELTA_PLAN"],
            "blockers": [
                "GAP_IM1_AI_OR_MATERIAL_CHANGE_RFC_WATCH_REQUIRED",
            ],
            "notes": "Any AI or material functional change reopens the pack and requires refreshed SCAL plus associated documentation.",
        },
    ]

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "reviewed_at": REVIEWED_AT,
        "standards_version": STANDARDS_VERSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "artifact_count": len(artifacts),
            "mock_artifact_count": len([item for item in artifacts if item["mock_or_actual"] == MOCK_TRACK]),
            "actual_artifact_count": len([item for item in artifacts if item["mock_or_actual"] == ACTUAL_TRACK]),
            "gap_count": gap_register["summary"]["gap_count"],
            "conversion_step_count": len(conversion_workflow),
        },
        "official_stage_flow": OFFICIAL_STAGE_FLOW,
        "artifacts": artifacts,
        "conversion_workflow": conversion_workflow,
        "upstream_prerequisite_snapshot": [
            {
                "prerequisite_id": name,
                "path": rel(path),
                "status": "available",
            }
            for name, path in REQUIRED_INPUTS.items()
        ],
    }


def build_scal_question_bank(gap_register: dict[str, Any]) -> dict[str, Any]:
    questions = []
    for spec in SCAL_DOMAIN_SPECS:
        questions.append(
            {
                "question_id": spec["question_id"],
                "assurance_domain": spec["assurance_domain"],
                "capability_family": spec["capability_family"],
                "question_text": spec["question_text"],
                "source_blueprint_refs": spec["source_blueprint_refs"],
                MOCK_TRACK: {
                    "artifact_id": f"ART_123_{spec['question_id']}_MOCK",
                    "artifact_type": "scal_question_response",
                    "mock_or_actual": MOCK_TRACK,
                    "submittable_state": "pre_pairing_non_submittable",
                    "source_blueprint_refs": spec["source_blueprint_refs"],
                    "official_process_stage": "stage_one_scal_and_compatibility_review",
                    "supplier_scope": "cross_supplier",
                    "capability_family": spec["capability_family"],
                    "required_prerequisite": "Mock-now evidence index and supplier assumptions",
                    "current_evidence_ref": spec["mock_ref"],
                    "gap_state": spec["mock_gap_state"],
                    "owner_role": spec["owner_role"],
                    "review_due_at": DEFAULT_REVIEW_DUE_AT,
                    "notes": "Use for rehearsal, simulator proof, and architecture validation only.",
                },
                ACTUAL_TRACK: {
                    "artifact_id": f"ART_123_{spec['question_id']}_ACTUAL",
                    "artifact_type": "scal_question_response",
                    "mock_or_actual": ACTUAL_TRACK,
                    "submittable_state": "conversion_plan_only",
                    "source_blueprint_refs": spec["source_blueprint_refs"],
                    "official_process_stage": "stage_one_scal_and_compatibility_review",
                    "supplier_scope": "cross_supplier",
                    "capability_family": spec["capability_family"],
                    "required_prerequisite": "Real prerequisites confirmation plus current supplier-specific evidence",
                    "current_evidence_ref": spec["actual_ref"],
                    "gap_state": spec["actual_gap_state"],
                    "owner_role": spec["owner_role"],
                    "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
                    "notes": "Keep separate from the rehearsal response so real pairing cannot inherit mock-only evidence unnoticed.",
                },
            }
        )
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "reviewed_at": REVIEWED_AT,
        "standards_version": STANDARDS_VERSION,
        "summary": {
            "question_count": len(questions),
            "domain_count": len({item["assurance_domain"] for item in questions}),
            "mock_covered_count": len([item for item in questions if item[MOCK_TRACK]["gap_state"] == "covered_with_mock_evidence"]),
            "actual_gap_open_count": len([item for item in questions if "gap" in item[ACTUAL_TRACK]["gap_state"] or "pending" in item[ACTUAL_TRACK]["gap_state"]]),
            "gap_register_ref": summarise_path_ref(GAP_REGISTER_PATH),
        },
        "questions": questions,
    }


def build_supplier_matrix() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for supplier in SUPPLIER_FAMILIES:
        for capability in SUPPLIER_CAPABILITY_FAMILIES:
            mock_row = {
                "artifact_id": f"ART_123_SUPPLIER_{supplier['supplier_scope'].upper()}_{capability['capability_family'].upper()}_MOCK",
                "artifact_type": "supplier_capability_claim",
                "mock_or_actual": MOCK_TRACK,
                "submittable_state": "pre_pairing_non_submittable",
                "supplier_scope": supplier["supplier_scope"],
                "provider_supplier_name": supplier["provider_supplier_name"],
                "capability_family": capability["capability_family"],
                "vecells_target_posture": capability["vecells_target_posture"],
                "current_track_claim": "simulated_or_bounded_only",
                "current_mock_adapter_state": capability["mock_adapter_state"],
                "actual_pairing_claim_state": capability["actual_pairing_requirement"],
                "provider_specific_pairing_requirement": "Pairing Integration Pack, compatibility review, and supplier-specific test evidence",
                "assumption_note": "Mock twins and bounded capability claims do not imply real supplier acceptance.",
                "source_blueprint_refs": capability["source_blueprint_refs"],
                "official_process_stage": "stage_one_scal_and_compatibility_review",
                "required_prerequisite": "Current supplier roster plus local IM1 simulator evidence",
                "current_evidence_ref": summarise_path_ref(BOOKING_CAPABILITY_PATH, supplier["provider_pairing_path"]),
                "gap_state": "covered_with_mock_evidence",
                "owner_role": "ROLE_INTEROPERABILITY_LEAD",
                "review_due_at": DEFAULT_REVIEW_DUE_AT,
                "notes": (
                    f"{supplier['provider_supplier_name']} remains a rehearsal-only claim until provider-specific "
                    "pairing evidence exists."
                ),
            }
            actual_gap_id = (
                "GAP_IM1_PROVIDER_PACK_EMIS_PENDING"
                if supplier["supplier_scope"] == "optum_emisweb"
                else "GAP_IM1_PROVIDER_PACK_TPP_PENDING"
            )
            actual_row = {
                "artifact_id": f"ART_123_SUPPLIER_{supplier['supplier_scope'].upper()}_{capability['capability_family'].upper()}_ACTUAL",
                "artifact_type": "supplier_capability_claim",
                "mock_or_actual": ACTUAL_TRACK,
                "submittable_state": "conversion_plan_only",
                "supplier_scope": supplier["supplier_scope"],
                "provider_supplier_name": supplier["provider_supplier_name"],
                "capability_family": capability["capability_family"],
                "vecells_target_posture": capability["vecells_target_posture"],
                "current_track_claim": "not_claimable_until_provider_specific_evidence_exists",
                "current_mock_adapter_state": capability["mock_adapter_state"],
                "actual_pairing_claim_state": capability["actual_pairing_requirement"],
                "provider_specific_pairing_requirement": "Accepted supplier-specific PIP, compatibility review, and legal plus test gates",
                "assumption_note": "Actual claims stay blocked until provider-specific evidence replaces the rehearsal placeholders.",
                "source_blueprint_refs": capability["source_blueprint_refs"],
                "official_process_stage": "stage_one_scal_and_compatibility_review",
                "required_prerequisite": "Accepted provider PIP and compatibility review",
                "current_evidence_ref": summarise_path_ref(GAP_REGISTER_PATH, actual_gap_id),
                "gap_state": "provider_pack_pending",
                "owner_role": "ROLE_INTEROPERABILITY_LEAD",
                "review_due_at": DEFAULT_SUBMISSION_REVIEW_DUE_AT,
                "notes": (
                    f"Do not convert the {supplier['provider_supplier_name']} rehearsal row into a live claim until the "
                    "supplier pack and pairing gates are complete."
                ),
            }
            rows.extend([mock_row, actual_row])
    return rows


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def bullet_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def build_docs(
    inputs: dict[str, Any],
    prerequisite_rows: list[dict[str, Any]],
    scal_question_bank: dict[str, Any],
    artifact_index: dict[str, Any],
    supplier_rows: list[dict[str, Any]],
    gap_register: dict[str, Any],
) -> dict[Path, str]:
    provider_names = [provider["provider_supplier_name"] for provider in inputs["provider_register"]["providers"]]
    dspt_stale = any(gap["gap_id"] == "PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING" for gap in inputs["dspt_gaps"]["gaps"])

    question_headers = ["Question", "Mock response posture", "Actual conversion posture", "Owner"]
    question_rows = []
    for field in inputs["field_map"]["fields"][:10]:
        mock_row = next(
            row for row in prerequisite_rows if row["question_id"] == field["field_id"] and row["mock_or_actual"] == MOCK_TRACK
        )
        actual_row = next(
            row for row in prerequisite_rows if row["question_id"] == field["field_id"] and row["mock_or_actual"] == ACTUAL_TRACK
        )
        question_rows.append(
            [
                field["label"],
                mock_row["gap_state"],
                actual_row["gap_state"],
                mock_row["owner_role"],
            ]
        )

    stage_rows = [
        [stage["stage_id"], stage["stage_label"], stage["summary"]]
        for stage in OFFICIAL_STAGE_FLOW
    ]

    supplier_headers = ["Supplier", "Capability family", "Mock posture", "Actual posture"]
    supplier_table_rows = []
    for row in supplier_rows[:10]:
        if row["mock_or_actual"] != MOCK_TRACK:
            continue
        actual_match = next(
            item
            for item in supplier_rows
            if item["supplier_scope"] == row["supplier_scope"]
            and item["capability_family"] == row["capability_family"]
            and item["mock_or_actual"] == ACTUAL_TRACK
        )
        supplier_table_rows.append(
            [
                row["provider_supplier_name"],
                row["capability_family"],
                row["current_track_claim"],
                actual_match["gap_state"],
            ]
        )

    mock_doc = f"""# 123 IM1 Mock Now Execution

Reviewed against the current official IM1 and SCAL pages on `{REVIEWED_AT}`. This document is the `Mock_now_execution` lane for `par_123`.

Related `Actual_production_strategy_later`: see [123_im1_actual_pairing_strategy_later.md](./123_im1_actual_pairing_strategy_later.md).

## Mock_now_execution

### Bounded IM1 scope

Vecells uses this pack to unblock engineering now without pretending that live IM1 pairing already exists.

- IM1 remains a booking-facing and supplier-capability-driven seam, not a Phase 2 identity shortcut.
- The current rehearsal target is the bounded local-booking use case plus truthful staff-assisted fallback.
- `{", ".join(provider_names)}` are treated as the current provider suppliers because that is what the official IM1 material still names as of `{REVIEWED_AT}`.

### What engineering can build now

- one bounded product scope dossier
- one non-submittable prerequisite response model using the current public field shape
- one SCAL question bank tied to current repo evidence and explicit gaps
- one supplier capability matrix that distinguishes goals, simulator truth, and real pairing blockers
- one simulator-backed evidence lane for IM1 twins and authoritative booking truth rehearsal

### Simulator-backed evidence placeholders

- Current IM1 twin posture is anchored to [gp_booking_capability_evidence.json](../../data/analysis/gp_booking_capability_evidence.json).
- Current provider roster posture is anchored to [im1_provider_supplier_register.json](../../data/analysis/im1_provider_supplier_register.json).
- Current prerequisite and stage posture is anchored to [im1_pairing_pack.json](../../data/analysis/im1_pairing_pack.json).
- Current safety and IG posture is anchored to [dcb0129_hazard_register.json](../../data/assurance/dcb0129_hazard_register.json) and [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json).

### Sample prerequisite response posture

{markdown_table(question_headers, question_rows)}

## Actual_production_strategy_later

This mock dossier converts later; it does not become a real submission by drift. The conversion route remains blocked on named owners, refreshed safety and IG evidence, supplier-specific provider packs, licence execution, and supported-test entry criteria.
"""

    actual_doc = f"""# 123 IM1 Actual Pairing Strategy Later

Reviewed against the current official IM1 and SCAL pages on `{REVIEWED_AT}`. This document is the `Actual_production_strategy_later` lane for `par_123`.

Related `Mock_now_execution`: see [123_im1_mock_now_execution.md](./123_im1_mock_now_execution.md).

## Mock_now_execution

The mock lane exists to keep engineering unblocked. None of its outputs are treated as submittable evidence until the steps below are satisfied.

## Actual_production_strategy_later

### Live route and non-submittable law

- IM1 is still treated as a live route and must not be written off as deprecated.
- The mock-now dossier is explicitly non-submittable.
- Provider mock API, unsupported test, supported test, assurance, and live remain separate gates.
- AI or other material scope change reopens this path through RFC and refreshed SCAL or safety or privacy evidence.

### Official stage flow reviewed on `{REVIEWED_AT}`

{markdown_table(["Stage ID", "Stage", "Current interpretation"], stage_rows)}

### Conversion steps

{bullet_list([f"{step['step_id']}: {step['step_label']} — blockers: {', '.join(step['blockers'])}" for step in artifact_index['conversion_workflow']])}

### Step details

#### Step 01 freeze product scope and named owners

Real submission starts only when the named submitter, sponsor, approver, and legal entity chain exists.

#### Step 02 refresh clinical safety and IG evidence

Real IM1 submission cannot claim current clinical and IG readiness while the DSPT pack still carries the stale `PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING` dependency. That issue is recorded here as `GAP_IM1_DSPT_REFRESH_REQUIRED_AFTER_PAR_121`.

#### Step 03 submit the current public prerequisites form

Use the current public prerequisite form only after the named owner chain and refreshed evidence posture are current.

#### Step 04 complete stage-one SCAL and provider compatibility review

Stage-one SCAL remains a later external trigger. Supplier-specific compatibility review and PIP access must stay separate for Optum and TPP.

#### Step 05 execute the Model Interface Licence

Model Interface Licence execution stays blocked until named signatories are fixed and the legal review path is approved.

#### Step 06 provider mock API and unsupported test

Provider mock API access and unsupported test remain supplier-specific and distinct from supported test.

#### Step 07 supported test, assurance, and live gates

Supported test and assurance begin only after the completed SCAL and provider-issued environment access are current.

#### Step 08 live rollout, RFC, and assurance refresh

Live rollout is provider-supplier and organisation specific. Any later AI or other material functional change requires RFC plus refreshed SCAL and associated documentation.
"""

    readiness_doc = f"""# 123 IM1 Prerequisite Readiness Pack

`par_123` establishes the IM1 prerequisite and SCAL readiness scaffold for Vecells. It keeps `Mock_now_execution` and `Actual_production_strategy_later` visibly separate so engineering can build now without collapsing rehearsal evidence into live onboarding claims later.

## Standards Version

- baseline id: `{STANDARDS_VERSION['baseline_id']}`
- reviewed at: `{STANDARDS_VERSION['reviewed_at']}`
- official source count: `{len(STANDARDS_VERSION['official_sources'])}`

{bullet_list([f"{item['title']}: <{item['url']}>" for item in STANDARDS_VERSION['official_sources']])}

## Mock-now versus actual-pairing law

- `Mock_now_execution`: deterministic local IM1 rehearsal pack, supplier capability dossier, question bank, gap register, and simulator-backed evidence placeholders
- `Actual_production_strategy_later`: versioned conversion workflow for the real prerequisites form, stage-one SCAL, licence, provider access, supported test, assurance, live, and RFC refresh
- Current official stage flow was reviewed on `{REVIEWED_AT}` and remains encoded in [im1_artifact_index.json](../../data/assurance/im1_artifact_index.json)

## Upstream prerequisite posture

- Existing IM1 pairing rehearsal pack: [im1_pairing_pack.json](../../data/analysis/im1_pairing_pack.json)
- Existing IM1 prerequisite field map: [im1_prerequisites_field_map.json](../../data/analysis/im1_prerequisites_field_map.json)
- Existing provider roster and live gate pack: [im1_provider_supplier_register.json](../../data/analysis/im1_provider_supplier_register.json), [im1_live_gate_checklist.json](../../data/analysis/im1_live_gate_checklist.json)
- Clinical safety seed pack: [dcb0129_hazard_register.json](../../data/assurance/dcb0129_hazard_register.json)
- DSPT pack: [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json)

## Mock_now_execution

- prerequisite question rows: `{len([row for row in prerequisite_rows if row['mock_or_actual'] == MOCK_TRACK])}`
- supplier capability rows: `{len([row for row in supplier_rows if row['mock_or_actual'] == MOCK_TRACK])}`
- SCAL questions: `{scal_question_bank['summary']['question_count']}`
- known provider suppliers: `{", ".join(provider_names)}`

## Actual_production_strategy_later

- actual conversion artifacts: `{artifact_index['summary']['actual_artifact_count']}`
- named blockers recorded: `{gap_register['summary']['gap_count']}`
- conversion workflow steps: `{artifact_index['summary']['conversion_step_count']}`

## Current blockers

{bullet_list([f"{gap['gap_id']}: {gap['title']} ({gap['status']})" for gap in gap_register['gaps']])}

## Deliverables

- [123_im1_mock_now_execution.md](./123_im1_mock_now_execution.md)
- [123_im1_actual_pairing_strategy_later.md](./123_im1_actual_pairing_strategy_later.md)
- [123_scal_response_strategy.md](./123_scal_response_strategy.md)
- [123_supplier_capability_and_pairing_assumptions.md](./123_supplier_capability_and_pairing_assumptions.md)
- [im1_prerequisite_question_matrix.csv](../../data/assurance/im1_prerequisite_question_matrix.csv)
- [im1_scal_question_bank.json](../../data/assurance/im1_scal_question_bank.json)
- [im1_artifact_index.json](../../data/assurance/im1_artifact_index.json)
- [im1_supplier_capability_matrix.csv](../../data/assurance/im1_supplier_capability_matrix.csv)
- [im1_gap_register.json](../../data/assurance/im1_gap_register.json)

## Notes

- This pack intentionally records the stale DSPT dependency instead of silently rewriting `par_122`.
- IM1 remains live, supplier-specific, and gate-heavy as of `{REVIEWED_AT}`.
- Mock provider evidence is for architecture validation only and stays visibly non-submittable.
"""

    scal_doc = f"""# 123 SCAL Response Strategy

Reviewed against the current official IM1 and SCAL pages on `{REVIEWED_AT}`.

This document turns the current Vecells evidence posture into a SCAL-oriented question bank while preserving the separation between `Mock_now_execution` and `Actual_production_strategy_later`.

## Mock_now_execution

- The mock lane uses deterministic source-traceable evidence to answer likely SCAL questions now.
- Where the answer cannot be honest yet, the question stays `gap_open`, `provider_pack_pending`, or `dependency_refresh_required`.
- Simulator evidence is allowed only as rehearsal proof, never as supplier acceptance evidence.

## Actual_production_strategy_later

- The actual lane requires current prerequisite confirmation, supplier-specific compatibility review, and a refreshed evidence pack before the SCAL becomes submittable.
- Supplier-specific functionality is never presented as generic IM1 truth.
- AI or material product change must reopen the SCAL via RFC and refreshed supporting documentation.

## Domain coverage

{markdown_table(
    ["Question ID", "Domain", "Mock gap state", "Actual gap state"],
    [
        [
            question["question_id"],
            question["assurance_domain"],
            question[MOCK_TRACK]["gap_state"],
            question[ACTUAL_TRACK]["gap_state"],
        ]
        for question in scal_question_bank["questions"]
    ],
)}

## Technical conformance

- Supplier-specific adapter behaviour stays behind canonical booking and confirmation truth contracts.
- Pairing Integration Pack details remain provider-specific and are not guessed from the mock lane.

## Clinical safety

- The DCB0129 seed pack is current enough to scaffold the response now.
- Any real submission still requires a current product-scope review and assurance refresh before submission.

## Information governance and security

- The current DSPT pack is usable for planning now.
- {"A stale dependency from par_122 is still recorded and blocks real submission refresh." if dspt_stale else "The DSPT dependency chain is current at the time this pack was generated."}

## Supported test and assurance entry

- Completed SCAL, provider access, and explicit environment targets are all mandatory before supported test.
- Supported test, assurance, and live remain serial rather than collapsed.
"""

    supplier_doc = f"""# 123 Supplier Capability And Pairing Assumptions

This document captures the supplier-capability law for `par_123`: what Vecells wants to do, what the current IM1 twins simulate, and what cannot be claimed until supplier-specific pairing evidence exists.

## Mock_now_execution

- Supplier assumptions are explicit and versioned.
- The simulator twin is allowed to prove architecture and truth handling.
- No supplier-specific claim is treated as accepted until the real provider pack exists.

## Actual_production_strategy_later

- Optum and TPP are tracked separately.
- Provider-specific capability claims stay explicit and never collapse into generic IM1 success language.
- Supplier-specific PIPs and compatibility review remain mandatory.
- The Model Interface Licence is a distinct legal gate.
- Unsupported test, supported test, assurance, and live remain separate by supplier and environment.

## Matrix excerpt

{markdown_table(supplier_headers, supplier_table_rows)}

## Supplier assumptions reviewed on `{REVIEWED_AT}`

{bullet_list([
    "The current official IM1 material still names Optum (EMISWeb) and TPP (SystmOne) as the foundation system providers.",
    "The Pairing Integration Pack (PIP) remains supplier-specific and arrives after feasibility assessment and acceptance.",
    "Transaction and appointment behaviour can vary by supplier, and some appointment functionality may only be available via GP Connect depending on the provider PIP.",
    "IM1 remains live and is not treated here as deprecated.",
])}
"""

    return {
        DOC_MOCK_PATH: mock_doc,
        DOC_ACTUAL_PATH: actual_doc,
        DOC_READINESS_PATH: readiness_doc,
        DOC_SCAL_PATH: scal_doc,
        DOC_SUPPLIER_PATH: supplier_doc,
    }


def main() -> None:
    inputs = load_inputs()
    dspt_stale = any(
        gap["gap_id"] == "PREREQUISITE_GAP_121_DCB0129_SEED_PACK_PENDING"
        for gap in inputs["dspt_gaps"]["gaps"]
    )
    prerequisite_rows = build_prerequisite_matrix(inputs["field_map"]["fields"], dspt_stale)
    gap_register = build_gap_register(inputs)
    artifact_index = build_artifact_index(inputs, gap_register)
    scal_question_bank = build_scal_question_bank(gap_register)
    supplier_rows = build_supplier_matrix()

    prerequisite_columns = [
        "question_id",
        "question_group",
        "question_label",
        "response_value",
        *REQUIRED_MACHINE_FIELDS,
    ]
    supplier_columns = [
        "artifact_id",
        "artifact_type",
        "mock_or_actual",
        "submittable_state",
        "supplier_scope",
        "provider_supplier_name",
        "capability_family",
        "vecells_target_posture",
        "current_track_claim",
        "current_mock_adapter_state",
        "actual_pairing_claim_state",
        "provider_specific_pairing_requirement",
        "assumption_note",
        "source_blueprint_refs",
        "official_process_stage",
        "required_prerequisite",
        "current_evidence_ref",
        "gap_state",
        "owner_role",
        "review_due_at",
        "notes",
    ]

    write_csv(PREREQUISITE_MATRIX_PATH, prerequisite_rows, prerequisite_columns)
    write_json(SCAL_QUESTION_BANK_PATH, scal_question_bank)
    write_json(ARTIFACT_INDEX_PATH, artifact_index)
    write_csv(SUPPLIER_MATRIX_PATH, supplier_rows, supplier_columns)
    write_json(GAP_REGISTER_PATH, gap_register)

    docs = build_docs(inputs, prerequisite_rows, scal_question_bank, artifact_index, supplier_rows, gap_register)
    for path, content in docs.items():
        write_text(path, content)


if __name__ == "__main__":
    main()
