#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"

TASK_ID = "seq_037"
VISUAL_MODE = "Pharmacy_Route_Observatory"
CAPTURED_ON = "2026-04-10"
MISSION = (
    "Freeze the authoritative pharmacy directory, dispatch, Update Record, and manual "
    "fallback path model as a deterministic split between executable mock-now truth and "
    "fail-closed actual-provider-later access."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "mesh_execution_pack": DATA_DIR / "mesh_execution_pack.json",
    "gp_provider_decision_register": DATA_DIR / "gp_provider_decision_register.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DIRECTORY_MATRIX_CSV_PATH = DATA_DIR / "pharmacy_directory_access_matrix.csv"
UPDATE_RECORD_MATRIX_CSV_PATH = DATA_DIR / "pharmacy_update_record_path_matrix.csv"
DECISION_REGISTER_JSON_PATH = DATA_DIR / "pharmacy_referral_transport_decision_register.json"
GAP_REGISTER_JSON_PATH = DATA_DIR / "pharmacy_provider_assurance_gaps.json"

MOCK_STRATEGY_DOC_PATH = DOCS_DIR / "37_pharmacy_access_paths_mock_strategy.md"
ACTUAL_STRATEGY_DOC_PATH = DOCS_DIR / "37_pharmacy_access_paths_actual_strategy.md"
DECISION_PACK_DOC_PATH = DOCS_DIR / "37_directory_and_update_record_decision_pack.md"
GAP_REGISTER_DOC_PATH = DOCS_DIR / "37_pharmacy_provider_gap_and_watch_register.md"
OBSERVATORY_HTML_PATH = DOCS_DIR / "37_pharmacy_route_observatory.html"

SOURCE_PRECEDENCE = [
    "prompt/037.md",
    "prompt/shared_operating_contract_036_to_045.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/blueprint-init.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/28_mesh_message_route_and_proof_matrix.md",
    "docs/external/36_gp_system_pathways_actual_strategy.md",
    "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services",
    "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/guide-to-search-identifiers-and-service-codes",
    "https://digital.nhs.uk/developer/api-catalogue/Alphabet/E/Taxonomies/in-production/Taxonomies/urgent-and-emergency-care",
    "https://digital.nhs.uk/services/directory-of-services-dos/",
    "https://digital.nhs.uk/services/electronic-prescription-service/guidance-for-suppliers",
    "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record",
    "https://digital.nhs.uk/services/gp-connect/news",
]

OFFICIAL_GUIDANCE = [
    {
        "source_id": "official_service_search_v3",
        "title": "Directory of Healthcare Services (Service Search) API",
        "url": "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The current catalogue positions Service Search API version 3 as the live version, "
            "with versions 1 and 2 deprecated on 2 February 2026. It supports searching by "
            "location together with clinical services, service type, and capability filters."
        ),
        "grounding": [
            "Service Search API version 3 is the current catalogue version.",
            "Versions 1 and 2 were deprecated on 2 February 2026.",
            "The route is directory search, not dispatch transport or closure proof.",
        ],
    },
    {
        "source_id": "official_service_search_codes",
        "title": "Guide to search identifiers and service codes",
        "url": (
            "https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/"
            "guide-to-search-identifiers-and-service-codes"
        ),
        "captured_on": CAPTURED_ON,
        "summary": (
            "The guide publishes pharmacy-relevant identifiers and service codes including "
            "community pharmacy consultation and Pharmacy First codes, which makes route-level "
            "choice evidence and capability snapshots more concrete."
        ),
        "grounding": [
            "Pharmacy-related search identifiers are explicit, not inferred from free text.",
            "Choice support must preserve the exact directory tuple and capability snapshot used.",
        ],
    },
    {
        "source_id": "official_uec_rest_api",
        "title": "Directory of Services - Urgent and Emergency Care - REST API",
        "url": (
            "https://digital.nhs.uk/developer/api-catalogue/Alphabet/E/Taxonomies/"
            "in-production/Taxonomies/urgent-and-emergency-care"
        ),
        "captured_on": CAPTURED_ON,
        "summary": (
            "The urgent-and-emergency-care REST API still sits in the official catalogue under the "
            "urgent-care taxonomy, while the Directory of Services overview keeps its primary use in "
            "NHS 111 and Pathways referral contexts. Vecells therefore treats it as watch or supporting "
            "directory context only, not as the baseline patient-choice route."
        ),
        "grounding": [
            "The route lives in urgent-and-emergency-care context.",
            "The DoS service overview ties it to NHS 111 and urgent-care referral flows.",
            "Urgent directory context does not make it the standard patient-choice route.",
        ],
    },
    {
        "source_id": "official_eps_dos_posture",
        "title": "Electronic Prescription Service guidance for suppliers",
        "url": "https://digital.nhs.uk/services/electronic-prescription-service/guidance-for-suppliers",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Current EPS supplier guidance says suppliers dispensing via EPS Release 2 require the "
            "Directory of Healthcare Services API and that it provides information on dispensing "
            "services available to prescribing systems. Vecells keeps EPS DoS visible only as a "
            "legacy supporting route and not as the main live discovery default."
        ),
        "grounding": [
            "DoHS remains explicitly required in current EPS supplier guidance.",
            "The EPS-facing directory posture is supporting or legacy context, not a new strategic default.",
            "Earlier blueprint migration law therefore remains directionally aligned with current official posture.",
        ],
    },
    {
        "source_id": "official_gp_connect_update_record",
        "title": "GP Connect: Update Record",
        "url": (
            "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/"
            "gp-connect-update-record"
        ),
        "captured_on": CAPTURED_ON,
        "summary": (
            "GP Connect Update Record remains the community-pharmacy route for pharmacist consultation "
            "summaries, with messages sent over MESH. The page also says Update Record is a silver service, "
            "so exact supplier and system combinations remain bounded and staged."
        ),
        "grounding": [
            "The route is for pharmacist consultation summaries, not generic pharmacy dispatch.",
            "Messages are sent through MESH.",
            "Silver-service posture means rollout is staged and assured-combination dependent.",
        ],
    },
    {
        "source_id": "official_gp_connect_programme_news",
        "title": "GP Connect news",
        "url": "https://digital.nhs.uk/services/gp-connect/news",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Current GP Connect programme news still frames Update Record through Pharmacy First rollout "
            "and independent-pharmacy expansion, which confirms the route is live in principle but not a "
            "blanket assumption for every tenant or supplier combination."
        ),
        "grounding": [
            "Programme messaging is about staged rollout, not universal immediate reach.",
            "Current rollout context reinforces the need for assured-combination checks and local fallback.",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_SERVICE_SEARCH_IS_PRIMARY_DISCOVERY_CANDIDATE",
        "summary": (
            "Seq_037 treats Service Search API version 3 as the primary live discovery candidate because "
            "it is the current version and EPS supplier guidance still points suppliers back to DoHS."
        ),
        "consequence": (
            "Vecells can keep one strategic discovery direction while still inventorying legacy or urgent "
            "supporting routes separately."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_UPDATE_RECORD_IS_VISIBILITY_NOT_TRANSPORT",
        "summary": (
            "Update Record remains a GP-visibility and consultation-summary route only. It does not replace "
            "dispatch transport, urgent return, safeguarding communication, or case closure."
        ),
        "consequence": (
            "The matrix keeps discovery, dispatch, visibility, and urgent fallback as different truth domains."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_MANUAL_FALLBACK_REMAINS_REAL",
        "summary": (
            "Even after live digital routes exist, monitored NHSmail or professional phone fallback remains "
            "a real safety-net requirement for urgent return and disabled Update Record combinations."
        ),
        "consequence": (
            "Manual fallback stays visible in the model instead of being treated as an embarrassing edge case."
        ),
    },
]

DIRECTORY_FIELDNAMES = [
    "route_id",
    "route_label",
    "purpose_group",
    "purpose_class",
    "maturity",
    "current_execution",
    "actual_later_position",
    "official_status",
    "official_version_posture",
    "patient_choice_support",
    "consent_filter_class",
    "consent_dependency",
    "provider_capability_snapshot_requirement",
    "dispatch_proof_requirement",
    "acknowledgement_or_expiry_semantics",
    "update_record_eligibility_scope",
    "urgent_referral_suitability",
    "ambiguity_mode",
    "degraded_fallback_mode",
    "closure_blocker_implications",
    "freshness_label",
    "freshness_rank",
    "version_label",
    "version_rank",
    "chip_labels",
    "source_refs",
    "official_guidance_refs",
]

UPDATE_RECORD_FIELDNAMES = [
    "path_id",
    "path_label",
    "path_role",
    "supported_scope",
    "vecells_direct_write",
    "transport_dependency",
    "assured_combination_requirement",
    "urgent_use",
    "correlation_requirement",
    "duplicate_or_replay_policy",
    "closure_policy",
    "fallback_when_unavailable",
    "source_refs",
]

MANDATORY_ROUTE_IDS = {
    "service_search_v3_primary_candidate",
    "dos_urgent_rest_watch_or_supporting_route",
    "eps_dos_supporting_route",
    "gp_update_record_assured_path",
    "mesh_or_transport_observation_dependency",
    "manual_nhsmail_or_phone_fallback",
    "practice_disabled_update_record_fallback",
}


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def join_list(values: list[str]) -> str:
    return "; ".join(values)


def markdown_table(headers: list[str], rows: list[list[Any]]) -> str:
    def esc(cell: Any) -> str:
        return str(cell).replace("|", "\\|").replace("\n", "<br>")

    header_row = "| " + " | ".join(esc(cell) for cell in headers) + " |"
    divider_row = "| " + " | ".join("---" for _ in headers) + " |"
    body_rows = ["| " + " | ".join(esc(cell) for cell in row) + " |" for row in rows]
    return "\n".join([header_row, divider_row, *body_rows])


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("Missing seq_037 prerequisites: " + ", ".join(sorted(missing)))

    payload = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    if payload["coverage_summary"]["summary"]["requirements_with_gaps_count"] != 0:
        raise SystemExit("Seq_019 coverage summary reopened baseline requirement gaps.")
    return payload


def find_integration_row(payload: dict[str, Any], integration_id: str) -> dict[str, Any]:
    for row in payload["integration_families"]:
        if row["integration_id"] == integration_id:
            return row
    raise SystemExit(f"Missing integration row {integration_id}")


def find_provider_family(payload: dict[str, Any], family_id: str) -> dict[str, Any]:
    for row in payload["families"]:
        if row["provider_family"] == family_id:
            return row
    raise SystemExit(f"Missing provider family {family_id}")


def find_dependency(payload: dict[str, Any], dependency_id: str) -> dict[str, Any]:
    for row in payload["dependencies"]:
        if row["dependency_id"] == dependency_id:
            return row
    raise SystemExit(f"Missing dependency row {dependency_id}")


def find_risk(payload: dict[str, Any], risk_id: str) -> dict[str, Any]:
    for row in payload["risks"]:
        if row["risk_id"] == risk_id:
            return row
    raise SystemExit(f"Missing risk row {risk_id}")


def build_route_rows(inputs: dict[str, Any]) -> list[dict[str, Any]]:
    directory_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_directory_and_choice")
    dispatch_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_dispatch_and_urgent_return")
    outcome_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_outcome_reconciliation")
    mesh_summary = inputs["mesh_execution_pack"]["summary"]
    phase0_verdict = inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"]

    return [
        {
            "route_id": "service_search_v3_primary_candidate",
            "route_label": "Service Search v3 / primary candidate",
            "purpose_group": "discovery",
            "purpose_class": "strategic_directory_and_choice",
            "maturity": "actual_later_gated",
            "current_execution": "simulated_now",
            "actual_later_position": (
                "Open later once the directory access path, patient-choice compliance review, "
                "and live tuple evidence are signed off."
            ),
            "official_status": "Current official primary directory candidate for live pharmacy search.",
            "official_version_posture": (
                "Service Search API v3 current; versions 1 and 2 deprecated on 2 February 2026."
            ),
            "patient_choice_support": "yes_primary_when_choice_proof_current",
            "consent_filter_class": "pre_choice",
            "consent_dependency": (
                "Choice list may be shown without consent, but provider binding, reassurance, and "
                "dispatch require an active PharmacyConsentCheckpoint on the same visible-choice tuple."
            ),
            "provider_capability_snapshot_requirement": (
                "One current PharmacyDirectorySnapshot plus the matching PharmacyProviderCapabilitySnapshot "
                "set feeding the current PharmacyChoiceProof."
            ),
            "dispatch_proof_requirement": (
                "None directly. Directory evidence cannot stand in for PharmacyDispatchPlan, "
                "PharmacyDispatchAttempt, or DispatchProofEnvelope."
            ),
            "acknowledgement_or_expiry_semantics": (
                "Snapshot freshness, visible-choice-set hash drift, and choice-session expiry supersede earlier "
                "selection and consent bindings."
            ),
            "update_record_eligibility_scope": "No Update Record semantics.",
            "urgent_referral_suitability": "not_for_urgent_dispatch_or_safeguarding",
            "ambiguity_mode": (
                "Stale or changed directory tuples force same-shell regeneration and may invalidate a prior choice."
            ),
            "degraded_fallback_mode": (
                "Same-shell directory regeneration, warned choice, or clinician/manual fallback when no safe provider remains."
            ),
            "closure_blocker_implications": (
                "Directory results cannot resolve or close the request lineage and cannot imply that a referral was sent."
            ),
            "freshness_label": "fresh national directory tuple required",
            "freshness_rank": 96,
            "version_label": "v3 current",
            "version_rank": 320,
            "chip_labels": ["choice eligible", "not for urgent use"],
            "stages": ["Discovery", "Choice"],
            "proof_ladder_id": "proof_directory_choice",
            "inspector_notes": [
                directory_integration["minimum_mock_fidelity"],
                directory_integration["truth_proof_digest"],
                "Patient-visible provider order depends on PharmacyChoiceProof and selectionBindingHash.",
            ],
            "source_refs": [
                "blueprint/blueprint-init.md#7. Pharmacy First pathway",
                "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
                "data/analysis/external_dependencies.json#dep_pharmacy_directory_dohs",
            ],
            "official_guidance_refs": [
                "official_service_search_v3",
                "official_service_search_codes",
            ],
        },
        {
            "route_id": "dos_urgent_rest_watch_or_supporting_route",
            "route_label": "DoS UEC REST / watch or supporting route",
            "purpose_group": "discovery",
            "purpose_class": "urgent_and_emergency_directory_watch",
            "maturity": "watch_only_supporting",
            "current_execution": "watched_and_stubbed",
            "actual_later_position": (
                "Use only after a bounded urgent-care architecture decision if the route remains necessary."
            ),
            "official_status": "Urgent-care directory context only; not the baseline patient-choice route.",
            "official_version_posture": "Official urgent-and-emergency-care REST API remains catalogued in production context.",
            "patient_choice_support": "no_not_primary_choice_route",
            "consent_filter_class": "pre_choice",
            "consent_dependency": (
                "Watch lookups do not satisfy pharmacy-choice consent and may not authorise dispatch or reassurance."
            ),
            "provider_capability_snapshot_requirement": (
                "If used at all, results must still normalize into the current PharmacyProviderCapabilitySnapshot set "
                "and may not bypass PharmacyChoiceProof."
            ),
            "dispatch_proof_requirement": "None. Directory context is separate from transport truth.",
            "acknowledgement_or_expiry_semantics": (
                "Route freshness matters only for supporting urgent-care awareness; it does not create a dispatch deadline."
            ),
            "update_record_eligibility_scope": "No Update Record semantics.",
            "urgent_referral_suitability": "urgent_directory_context_only_not_referral_send",
            "ambiguity_mode": (
                "A route may indicate urgent-care context while still telling Vecells nothing about provider choice or dispatch proof."
            ),
            "degraded_fallback_mode": (
                "Escalate to the monitored manual urgent-return route if urgent professional contact is required."
            ),
            "closure_blocker_implications": (
                "Urgent directory awareness cannot settle the pharmacy case or justify calm copy."
            ),
            "freshness_label": "supporting urgent-care context",
            "freshness_rank": 74,
            "version_label": "REST watch",
            "version_rank": 250,
            "chip_labels": ["watch only", "not for urgent use"],
            "stages": ["Discovery"],
            "proof_ladder_id": "proof_directory_choice",
            "inspector_notes": [
                "Keep urgent directory context separate from patient-visible pharmacy choice.",
                "Do not let urgent directory access masquerade as a send route.",
            ],
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
                "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
            ],
            "official_guidance_refs": [
                "official_uec_rest_api",
            ],
        },
        {
            "route_id": "eps_dos_supporting_route",
            "route_label": "EPS DoS / supporting legacy route",
            "purpose_group": "discovery",
            "purpose_class": "legacy_supporting_directory",
            "maturity": "watch_only_supporting",
            "current_execution": "watched_and_stubbed",
            "actual_later_position": (
                "Stay legacy-supporting only, and never outrank the Service Search v3 route without a fresh policy decision."
            ),
            "official_status": "Legacy or supporting route only; not the strategic live default.",
            "official_version_posture": (
                "Current EPS-facing supplier guidance still points suppliers at DoHS; keep EPS DoS only as a supporting posture."
            ),
            "patient_choice_support": "supporting_only_never_hidden_primary",
            "consent_filter_class": "pre_choice",
            "consent_dependency": (
                "No standalone consent authority. Supporting data may inform choice only after policy acceptance and tuple normalization."
            ),
            "provider_capability_snapshot_requirement": (
                "Normalize any EPS-facing service detail into the same PharmacyProviderCapabilitySnapshot and PharmacyChoiceProof set."
            ),
            "dispatch_proof_requirement": "None. Directory evidence is not transport proof.",
            "acknowledgement_or_expiry_semantics": (
                "Legacy directory freshness may invalidate a supporting hint, but it never refreshes a frozen choice silently."
            ),
            "update_record_eligibility_scope": "No Update Record semantics.",
            "urgent_referral_suitability": "not_for_urgent_dispatch",
            "ambiguity_mode": (
                "Legacy route data can become stale or policy-incompatible and must not silently reorder a patient choice."
            ),
            "degraded_fallback_mode": (
                "Drop back to Service Search v3 or explicit same-shell re-selection if the supporting tuple drifts."
            ),
            "closure_blocker_implications": (
                "Legacy directory hints never close the case and may not justify quiet success."
            ),
            "freshness_label": "legacy support only",
            "freshness_rank": 48,
            "version_label": "legacy support",
            "version_rank": 180,
            "chip_labels": ["legacy watch", "not for urgent use"],
            "stages": ["Discovery"],
            "proof_ladder_id": "proof_directory_choice",
            "inspector_notes": [
                "Keep EPS DoS visible so deprecation and migration debt stay explicit.",
                "Do not let legacy data outrank the current visible choice tuple.",
            ],
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
                "data/analysis/external_dependencies.json#dep_pharmacy_directory_dohs",
            ],
            "official_guidance_refs": [
                "official_eps_dos_posture",
            ],
        },
        {
            "route_id": "dispatch_transport_primary_candidate",
            "route_label": "Referral dispatch / primary candidate",
            "purpose_group": "transport",
            "purpose_class": "referral_dispatch_transport",
            "maturity": "actual_later_gated",
            "current_execution": "simulated_now",
            "actual_later_position": (
                "Open later only after the dispatch route, proof thresholds, and manual-assisted redispatch policy are frozen."
            ),
            "official_status": "Live route not yet selected; current truth is simulator-first only.",
            "official_version_posture": (
                f"Transport posture remains bounded to simulator law now; seq_028 currently inventories {mesh_summary['route_row_count']} MESH route rows separately."
            ),
            "patient_choice_support": "no_after_choice_locked",
            "consent_filter_class": "tuple_bound_post_choice",
            "consent_dependency": (
                "Requires the current PharmacyConsentCheckpoint, selected provider, pathway, package fingerprint, and selectionBindingHash."
            ),
            "provider_capability_snapshot_requirement": (
                "One selected PharmacyProviderCapabilitySnapshot plus the live dispatch adapter binding and TransportAssuranceProfile."
            ),
            "dispatch_proof_requirement": (
                "Current PharmacyDispatchPlan, PharmacyDispatchAttempt, DispatchProofEnvelope, and ExternalConfirmationGate on the same tuple."
            ),
            "acknowledgement_or_expiry_semantics": (
                "Transport accepted, provider accepted, proof pending, proof deadline, expiry, and redispatch are all separate facts."
            ),
            "update_record_eligibility_scope": "No Update Record semantics.",
            "urgent_referral_suitability": "not_for_urgent_return_use_professional_route",
            "ambiguity_mode": (
                "Proof pending, contradiction, or consent drift holds the same shell in pending or recovery posture."
            ),
            "degraded_fallback_mode": (
                "Controlled redispatch under a fresh tuple, or manual-assisted dispatch only where policy permits."
            ),
            "closure_blocker_implications": (
                "Transport acceptance or mailbox pickup cannot calm the patient or close the pharmacy lineage."
            ),
            "freshness_label": "tuple must stay frozen through proof window",
            "freshness_rank": 88,
            "version_label": "adapter profile pending",
            "version_rank": 210,
            "chip_labels": ["proof required", "not for urgent use"],
            "stages": ["Dispatch"],
            "proof_ladder_id": "proof_dispatch",
            "inspector_notes": [
                dispatch_integration["minimum_mock_fidelity"],
                "Update Record may not stand in for urgent return or dispatch confirmation.",
                "Weak transport proof blocks calmness and closure.",
            ],
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.11 PharmacyDispatchEnvelope",
                "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
            ],
            "official_guidance_refs": [],
        },
        {
            "route_id": "gp_update_record_assured_path",
            "route_label": "GP Connect Update Record / assured path",
            "purpose_group": "visibility",
            "purpose_class": "assured_gp_visibility_and_outcome_observation",
            "maturity": "actual_later_gated",
            "current_execution": "simulated_now_no_live_write",
            "actual_later_position": (
                "Open later only when the community-pharmacy supplier or GP-system combination is named, assured, and replay-safe."
            ),
            "official_status": "Assured visibility and consultation-summary path only.",
            "official_version_posture": (
                "Current GP Connect Update Record route for consultation summaries over MESH; silver-service rollout remains combination dependent."
            ),
            "patient_choice_support": "no_visibility_only",
            "consent_filter_class": "tuple_bound_post_choice",
            "consent_dependency": (
                "Cannot replace dispatch consent. Outcome observation must still bind the selected provider, pathway, scope hash, and active case tuple."
            ),
            "provider_capability_snapshot_requirement": (
                "The current selected-provider snapshot, outcome source binding, and PharmacyOutcomeReconciliationGate policy must all match."
            ),
            "dispatch_proof_requirement": (
                "None directly. Update Record never proves that the referral was sent or that urgent escalation is satisfied."
            ),
            "acknowledgement_or_expiry_semantics": (
                "MESH or inbox delivery is supporting transport evidence only; duplicates, replays, disabled routes, and weak matches remain case-local."
            ),
            "update_record_eligibility_scope": (
                "Consultation summary and GP visibility only; never urgent return, safeguarding, or generic referral transport."
            ),
            "urgent_referral_suitability": "never_for_urgent_return",
            "ambiguity_mode": (
                "Weak match, duplicate, replay, partial summary, or disabled practice route keeps the case in reconciliation or recovery."
            ),
            "degraded_fallback_mode": (
                "Use practice-disabled manual visibility fallback and keep the reconciliation gate open."
            ),
            "closure_blocker_implications": (
                "Observed summaries or transport receipts do not auto-close the request; only explicit reconciliation resolution may unblock closure."
            ),
            "freshness_label": "assured combination and current case tuple required",
            "freshness_rank": 84,
            "version_label": "current silver service",
            "version_rank": 280,
            "chip_labels": ["not for urgent use"],
            "stages": ["Visibility", "Reconciliation"],
            "proof_ladder_id": "proof_visibility_and_reconciliation",
            "inspector_notes": [
                outcome_integration["minimum_mock_fidelity"],
                "Vecells does not write directly into the GP record.",
                "Outcome arrival and closure truth are separate decisions.",
            ],
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
                "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
            ],
            "official_guidance_refs": [
                "official_gp_connect_update_record",
                "official_gp_connect_programme_news",
            ],
        },
        {
            "route_id": "mesh_or_transport_observation_dependency",
            "route_label": "MESH or transport / observation dependency",
            "purpose_group": "transport",
            "purpose_class": "supporting_transport_and_observation_dependency",
            "maturity": "supporting_dependency",
            "current_execution": "simulated_now",
            "actual_later_position": (
                "Remain a supporting dependency only after live mailbox, workflow, or equivalent transport specifics are frozen."
            ),
            "official_status": "Supporting dependency only; not business truth.",
            "official_version_posture": "Current MESH and secure-transport posture remains separately inventoried from the pharmacy route decision.",
            "patient_choice_support": "no",
            "consent_filter_class": "tuple_bound_post_choice",
            "consent_dependency": (
                "Follows the existing dispatch or observation tuple; it cannot establish consent, provider choice, or calmness."
            ),
            "provider_capability_snapshot_requirement": (
                "Bound to the active dispatch plan or outcome-source adapter, not to directory ranking."
            ),
            "dispatch_proof_requirement": (
                "Supporting receipts only. Mailbox acceptance or pickup cannot satisfy DispatchProofEnvelope on its own."
            ),
            "acknowledgement_or_expiry_semantics": (
                "Pickup, delayed acknowledgement, non-delivery, or replay are supporting transport facts and remain time-bound."
            ),
            "update_record_eligibility_scope": "Supporting transport dependency only.",
            "urgent_referral_suitability": "not_for_urgent_without_human_ack",
            "ambiguity_mode": (
                "Message accepted, picked up, or replayed without the right case correlation leaves the route non-authoritative."
            ),
            "degraded_fallback_mode": (
                "Escalate to manual urgent or manual visibility fallbacks if mailbox or secure transport becomes unreliable."
            ),
            "closure_blocker_implications": (
                "Transport dependency signals cannot close the case or downgrade a weak match into resolved truth."
            ),
            "freshness_label": "supporting receipt freshness only",
            "freshness_rank": 66,
            "version_label": "supporting dependency",
            "version_rank": 170,
            "chip_labels": ["dependency only", "not for urgent use"],
            "stages": ["Dispatch", "Visibility"],
            "proof_ladder_id": "proof_visibility_and_reconciliation",
            "inspector_notes": [
                "Transport accepted, picked up, and reconciled are different facts.",
                "Keep workflow and mailbox governance tied to seq_028.",
            ],
            "source_refs": [
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
                "data/analysis/external_dependencies.json#dep_pharmacy_referral_transport",
                "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
            ],
            "official_guidance_refs": [
                "official_gp_connect_update_record",
            ],
        },
        {
            "route_id": "manual_nhsmail_or_phone_fallback",
            "route_label": "Manual NHSmail or phone / urgent fallback",
            "purpose_group": "manual",
            "purpose_class": "urgent_return_manual_safety_net",
            "maturity": "manual_only",
            "current_execution": "runbook_now",
            "actual_later_position": "Remain mandatory as the urgent safety-net even after live digital routes exist.",
            "official_status": "Local monitored safety-net route; not a digital API.",
            "official_version_posture": "Runbook current, practice or tenant owned.",
            "patient_choice_support": "no",
            "consent_filter_class": "manual_runbook",
            "consent_dependency": (
                "Urgent safety handling does not rely on patient-choice consent, but it must still bind the active PharmacyCase and duty route."
            ),
            "provider_capability_snapshot_requirement": (
                "Current UrgentReturnChannelConfig, case identifiers, and local owner or duty-contact binding."
            ),
            "dispatch_proof_requirement": (
                "Human acknowledgement or explicit duty handoff evidence only; sending an email or starting a call is not enough."
            ),
            "acknowledgement_or_expiry_semantics": (
                "Manual acknowledgement windows, overdue escalation, and missed-safety-net recovery are explicit."
            ),
            "update_record_eligibility_scope": "Not applicable and explicitly separate from Update Record.",
            "urgent_referral_suitability": "yes_manual_only",
            "ambiguity_mode": (
                "Email sent, voicemail left, or phone transfer attempted without acknowledgement remains unresolved."
            ),
            "degraded_fallback_mode": "Escalate immediately to duty task, supervisor, or practice-contact recovery.",
            "closure_blocker_implications": (
                "Urgent return evidence reopens or blocks closure until acknowledged and clinically reconciled."
            ),
            "freshness_label": "owner rehearsal and monitored route required",
            "freshness_rank": 58,
            "version_label": "manual runbook",
            "version_rank": 110,
            "chip_labels": ["manual fallback required"],
            "stages": ["Visibility", "Reconciliation"],
            "proof_ladder_id": "proof_manual_recovery",
            "inspector_notes": [
                "Urgent return is a professional-contact route, not an Update Record side effect.",
                "This route remains current even if live APIs onboard later.",
            ],
            "source_refs": [
                "blueprint/blueprint-init.md#7. Pharmacy First pathway",
                "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
                "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
            ],
            "official_guidance_refs": [],
        },
        {
            "route_id": "practice_disabled_update_record_fallback",
            "route_label": "Practice-disabled Update Record / manual fallback",
            "purpose_group": "manual",
            "purpose_class": "visibility_recovery_when_update_record_disabled",
            "maturity": "fallback_only",
            "current_execution": "runbook_now",
            "actual_later_position": "Remain explicit for practices or combinations where Update Record is disabled, unsupported, or delayed.",
            "official_status": "Manual visibility fallback when Update Record cannot be relied on.",
            "official_version_posture": "Local fallback contract, not an NHS API version.",
            "patient_choice_support": "no",
            "consent_filter_class": "manual_runbook",
            "consent_dependency": (
                "The active consent, provider, and outcome tuple still govern; the fallback route does not rewrite choice or dispatch truth."
            ),
            "provider_capability_snapshot_requirement": (
                "Current PracticeVisibilityFallbackPlan together with the selected provider and active case tuple."
            ),
            "dispatch_proof_requirement": (
                "None for dispatch. This route provides manual visibility acknowledgement only."
            ),
            "acknowledgement_or_expiry_semantics": (
                "Manual visibility acknowledgement is required and can itself become overdue or wrong-recipient recovery work."
            ),
            "update_record_eligibility_scope": "Explicit alternative when Update Record is disabled or unsupported.",
            "urgent_referral_suitability": "not_for_urgent_use_use_manual_urgent_route",
            "ambiguity_mode": (
                "Manual note sent without acknowledgement or sent to the wrong practice route remains unresolved."
            ),
            "degraded_fallback_mode": (
                "Keep the same shell in recovery and escalate through staff operations if practice visibility is still missing."
            ),
            "closure_blocker_implications": (
                "Manual visibility proof cannot auto-close the case and cannot turn a weak outcome into calm success."
            ),
            "freshness_label": "practice-specific fallback posture",
            "freshness_rank": 44,
            "version_label": "fallback only",
            "version_rank": 90,
            "chip_labels": ["manual fallback required", "not for urgent use"],
            "stages": ["Visibility", "Reconciliation"],
            "proof_ladder_id": "proof_manual_recovery",
            "inspector_notes": [
                "Practice-disabled Update Record must be explicit so the team does not quietly assume visibility exists.",
                "Manual visibility still cannot auto-close the request.",
            ],
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                "blueprint/phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling",
                "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
            ],
            "official_guidance_refs": [
                "official_gp_connect_update_record",
                "official_gp_connect_programme_news",
            ],
        },
    ]


def build_update_record_rows() -> list[dict[str, str]]:
    return [
        {
            "path_id": "gp_update_record_assured_path",
            "path_label": "GP Connect Update Record / assured path",
            "path_role": "visibility_observation_primary",
            "supported_scope": "consultation summary and GP visibility only",
            "vecells_direct_write": "no",
            "transport_dependency": "MESH required",
            "assured_combination_requirement": "named community-pharmacy professional plus assured supplier or GP-system combination",
            "urgent_use": "no",
            "correlation_requirement": "must correlate to the active PharmacyCase and outcome gate",
            "duplicate_or_replay_policy": "duplicate or replay remains case-local reconciliation work",
            "closure_policy": "never auto-close from transport or weak match",
            "fallback_when_unavailable": "practice_disabled_update_record_fallback",
            "source_refs": join_list(
                [
                    "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                    "official_gp_connect_update_record",
                ]
            ),
        },
        {
            "path_id": "mesh_or_transport_observation_dependency",
            "path_label": "MESH or transport / observation dependency",
            "path_role": "supporting_transport_dependency",
            "supported_scope": "delivery or receipt evidence only",
            "vecells_direct_write": "no",
            "transport_dependency": "MESH, mailbox, or equivalent secure transport",
            "assured_combination_requirement": "depends on the paired update-record or transport route",
            "urgent_use": "no",
            "correlation_requirement": "supporting receipts must still bind to the active case tuple",
            "duplicate_or_replay_policy": "message acceptance or replay is non-authoritative without reconciliation",
            "closure_policy": "cannot close or reassure by itself",
            "fallback_when_unavailable": "manual_nhsmail_or_phone_fallback",
            "source_refs": join_list(
                [
                    "docs/external/28_mesh_message_route_and_proof_matrix.md",
                    "official_gp_connect_update_record",
                ]
            ),
        },
        {
            "path_id": "practice_disabled_update_record_fallback",
            "path_label": "Practice-disabled Update Record / manual fallback",
            "path_role": "manual_visibility_recovery",
            "supported_scope": "manual GP visibility when Update Record is disabled or unavailable",
            "vecells_direct_write": "no",
            "transport_dependency": "manual monitored route",
            "assured_combination_requirement": "not applicable",
            "urgent_use": "no",
            "correlation_requirement": "must bind to the active case and selected provider tuple",
            "duplicate_or_replay_policy": "manual duplicate or wrong-recipient handling stays explicit",
            "closure_policy": "no auto-close and no calmness from manual visibility alone",
            "fallback_when_unavailable": "manual_nhsmail_or_phone_fallback",
            "source_refs": join_list(
                [
                    "blueprint/phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling",
                    "official_gp_connect_programme_news",
                ]
            ),
        },
        {
            "path_id": "manual_nhsmail_or_phone_fallback",
            "path_label": "Manual NHSmail or phone / urgent fallback",
            "path_role": "urgent_manual_professional_contact",
            "supported_scope": "urgent return or professional safety-net contact",
            "vecells_direct_write": "no",
            "transport_dependency": "manual monitored route",
            "assured_combination_requirement": "local ownership and rehearsal required",
            "urgent_use": "yes_manual_only",
            "correlation_requirement": "must bind to the active PharmacyCase or reopened request lineage",
            "duplicate_or_replay_policy": "attempted contact without acknowledgement remains unresolved",
            "closure_policy": "urgent return evidence blocks closure until acknowledged and reconciled",
            "fallback_when_unavailable": "duty escalation and supervisor recovery",
            "source_refs": join_list(
                [
                    "blueprint/blueprint-init.md#7. Pharmacy First pathway",
                    "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
                ]
            ),
        },
    ]


def build_proof_ladders() -> list[dict[str, Any]]:
    return [
        {
            "proof_ladder_id": "proof_directory_choice",
            "title": "Discovery and choice proof",
            "applies_to_route_ids": [
                "service_search_v3_primary_candidate",
                "dos_urgent_rest_watch_or_supporting_route",
                "eps_dos_supporting_route",
            ],
            "steps": [
                "Resolve one current directory source tuple and normalize it into PharmacyDirectorySnapshot.",
                "Materialize the matching PharmacyProviderCapabilitySnapshot set and explicit visible-choice frontier.",
                "Mint PharmacyChoiceProof over the visible-choice-set hash and any warnings or suppressed providers.",
                "Require a fresh choice or consent renewal if the tuple drifts before dispatch.",
            ],
            "ui_rule": (
                "Choice explanation may appear only while the current PharmacyChoiceProof and visible-choice-set hash remain valid."
            ),
        },
        {
            "proof_ladder_id": "proof_dispatch",
            "title": "Dispatch proof and expiry",
            "applies_to_route_ids": [
                "dispatch_transport_primary_candidate",
            ],
            "steps": [
                "Freeze PharmacyReferralPackage on the same selected-provider and consent tuple.",
                "Compile PharmacyDispatchPlan with one live TransportAssuranceProfile and adapter binding.",
                "Record PharmacyDispatchAttempt and keep transport acceptance, provider acceptance, and authoritative proof distinct.",
                "Hold patient or staff calmness until DispatchProofEnvelope and ExternalConfirmationGate both satisfy the route policy.",
            ],
            "ui_rule": "Transport accepted is pending evidence, not final referred truth.",
        },
        {
            "proof_ladder_id": "proof_visibility_and_reconciliation",
            "title": "Visibility and reconciliation proof",
            "applies_to_route_ids": [
                "gp_update_record_assured_path",
                "mesh_or_transport_observation_dependency",
            ],
            "steps": [
                "Observe the inbound summary or supporting transport event on the active case tuple.",
                "Separate transport receipt from clinical or operational outcome evidence.",
                "Run duplicate, replay, weak-match, and wrong-route checks through PharmacyOutcomeReconciliationGate.",
                "Allow calm closure only after a resolved apply or resolved reopen outcome under the current gate.",
            ],
            "ui_rule": "Observed summaries and mailbox events may inform status, but they never auto-close the case.",
        },
        {
            "proof_ladder_id": "proof_manual_recovery",
            "title": "Manual fallback and urgent recovery proof",
            "applies_to_route_ids": [
                "manual_nhsmail_or_phone_fallback",
                "practice_disabled_update_record_fallback",
            ],
            "steps": [
                "Bind one monitored human-owned route to the active case and route intent.",
                "Capture explicit acknowledgement or duty handoff evidence.",
                "Escalate immediately if acknowledgement is overdue, misrouted, or clinically unsafe.",
                "Keep closure blocked until the manual acknowledgement is reconciled with the active pharmacy lineage.",
            ],
            "ui_rule": "Manual fallback is continuity protection, not success.",
        },
    ]


def build_gap_rows() -> list[dict[str, Any]]:
    return [
        {
            "gap_id": "GAP_PHARM_001",
            "route_id": "service_search_v3_primary_candidate",
            "gap_class": "directory_access_unonboarded",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "The live Service Search access path, certificate or credential posture, and tenancy overlays are not yet onboarded.",
            "next_step": "Carry directory onboarding through later provider access tasks before any live claim is made.",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "official_service_search_v3",
                "docs/external/23_actual_partner_account_governance.md",
            ],
        },
        {
            "gap_id": "GAP_PHARM_002",
            "route_id": "eps_dos_supporting_route",
            "gap_class": "legacy_watch_debt",
            "severity": "medium",
            "blocks_actual_strategy": "no",
            "summary": "EPS-facing supporting posture remains legacy debt and must not silently become the main directory story.",
            "next_step": "Keep the route watch-only until a separate policy review says otherwise.",
            "owner_role": "ROLE_PROGRAMME_ARCHITECT",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "official_eps_dos_posture",
                "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
            ],
        },
        {
            "gap_id": "GAP_PHARM_003",
            "route_id": "dispatch_transport_primary_candidate",
            "gap_class": "transport_assurance_profile_unfrozen",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "The live referral dispatch route, proof thresholds, and manual-assisted redispatch posture are not yet frozen.",
            "next_step": "Complete the live transport selection and assurance-profile review before any provider claim.",
            "owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
            "linked_risk_id": "RISK_PHARMACY_001",
            "source_refs": [
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
                "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            ],
        },
        {
            "gap_id": "GAP_PHARM_004",
            "route_id": "gp_update_record_assured_path",
            "gap_class": "assured_combination_unset",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "Seq_037 does not yet name the exact assured community-pharmacy and GP-system combination for Update Record.",
            "next_step": "Record the named combination and environment before any live visibility claim.",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "official_gp_connect_update_record",
                "official_gp_connect_programme_news",
            ],
        },
        {
            "gap_id": "GAP_PHARM_005",
            "route_id": "manual_nhsmail_or_phone_fallback",
            "gap_class": "urgent_route_owner_missing",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "The monitored mailbox or professional phone owner chain is not yet recorded per live tenant.",
            "next_step": "Freeze ownership and rehearse acknowledgement escalation before claiming a live urgent route.",
            "owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes",
                "docs/external/23_actual_partner_account_governance.md",
            ],
        },
        {
            "gap_id": "GAP_PHARM_006",
            "route_id": "practice_disabled_update_record_fallback",
            "gap_class": "manual_visibility_rehearsal_missing",
            "severity": "medium",
            "blocks_actual_strategy": "no",
            "summary": "The manual visibility runbook exists conceptually, but the per-practice rehearsal evidence is not yet current.",
            "next_step": "Exercise the disabled-Update-Record branch before allowing quiet operational assumptions.",
            "owner_role": "ROLE_OPERATIONS_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6H. Practice visibility, operations queue, and pharmacy exception handling",
            ],
        },
        {
            "gap_id": "GAP_PHARM_007",
            "route_id": "mesh_or_transport_observation_dependency",
            "gap_class": "transport_dependency_watch_open",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "Supporting mailbox or workflow posture remains a watch dependency and cannot be treated as settled transport proof.",
            "next_step": "Keep seq_028 mailbox or workflow governance tied to the pharmacy route decision before any live opening.",
            "owner_role": "ROLE_INTEROPERABILITY_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
                "data/analysis/mesh_execution_pack.json",
            ],
        },
        {
            "gap_id": "GAP_PHARM_008",
            "route_id": "gp_update_record_assured_path",
            "gap_class": "reconciliation_quality_not_signed_off",
            "severity": "high",
            "blocks_actual_strategy": "yes",
            "summary": "Weak-match, duplicate, and replay handling remain blocked until outcome parser quality and manual-review thresholds are signed off.",
            "next_step": "Freeze parser quality and manual-review policy before any live summary ingestion claim.",
            "owner_role": "ROLE_PHARMACY_DOMAIN_LEAD",
            "linked_risk_id": "RISK_EXT_PHARMACY_PROVIDER_GAP",
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                "data/analysis/external_dependencies.json#dep_pharmacy_outcome_observation",
            ],
        },
    ]


def build_live_gates(inputs: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "gate_id": "LIVE_GATE_PHARMACY_PROVIDER_SCORECARDS_APPROVED",
            "title": "Pharmacy provider scorecards are approved",
            "status": "pass",
            "summary": "Seq_022 already froze the pharmacy directory, transport, and outcome scorecard families.",
            "required_env": [],
            "source_refs": [
                "docs/external/22_provider_selection_scorecards.md",
                "data/analysis/provider_family_scorecards.json",
            ],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_TRANSPORT_SCORECARDS_APPROVED",
            "title": "Transport scorecards and message-route evidence are approved",
            "status": "pass",
            "summary": "Seq_028 already froze message-route and proof separation for pharmacy-related MESH posture.",
            "required_env": [],
            "source_refs": [
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
                "data/analysis/mesh_execution_pack.json",
            ],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_MVP_APPROVED",
            "title": "Credible pharmacy MVP is approved",
            "status": "blocked",
            "summary": "Actual-provider work stays blocked until a bounded pharmacy MVP is explicitly named and approved.",
            "required_env": ["PHARMACY_MVP_REF"],
            "source_refs": ["prompt/037.md"],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED",
            "title": "Consent and dispatch proof models are implemented",
            "status": "review_required",
            "summary": "The canonical contracts are specified, but seq_037 does not claim runtime implementation is already complete.",
            "required_env": ["PHARMACY_RUNTIME_IMPLEMENTATION_REF"],
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.11 PharmacyDispatchEnvelope",
                "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            ],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
            "title": "Named approver and target environment are present",
            "status": "blocked",
            "summary": "Real-provider route discovery remains fail-closed until a named approver and environment target exist.",
            "required_env": ["PHARMACY_NAMED_APPROVER", "PHARMACY_TARGET_ENVIRONMENT"],
            "source_refs": ["prompt/037.md", "docs/external/23_actual_partner_account_governance.md"],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED",
            "title": "ALLOW_REAL_PROVIDER_MUTATION is true",
            "status": "blocked",
            "summary": "Real provider mutation must remain blocked unless ALLOW_REAL_PROVIDER_MUTATION=true is supplied deliberately.",
            "required_env": ["ALLOW_REAL_PROVIDER_MUTATION"],
            "source_refs": ["prompt/shared_operating_contract_036_to_045.md"],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
            "title": "Gap and watch register is clear for the attempted route",
            "status": "blocked",
            "summary": "The current assurance gaps still include unresolved blockers across discovery, transport, urgent fallback, and outcome observation.",
            "required_env": ["PHARMACY_WATCH_REGISTER_ACK"],
            "source_refs": [str(GAP_REGISTER_JSON_PATH.relative_to(ROOT))],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED",
            "title": "Update Record assured combination is named",
            "status": "blocked",
            "summary": "GP Connect Update Record remains blocked until the exact assured combination and rollout context are recorded.",
            "required_env": ["PHARMACY_UPDATE_RECORD_COMBINATION_REF"],
            "source_refs": ["official_gp_connect_update_record", "official_gp_connect_programme_news"],
        },
        {
            "gate_id": "LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED",
            "title": "Urgent return ownership and rehearsal are current",
            "status": "blocked",
            "summary": "The manual safety-net route is mandatory, but live opening stays blocked until ownership and rehearsal evidence are recorded.",
            "required_env": ["PHARMACY_URGENT_RETURN_REHEARSAL_REF"],
            "source_refs": ["data/analysis/external_dependencies.json#dep_pharmacy_urgent_return_professional_routes"],
        },
        {
            "gate_id": "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
            "title": "Phase 0 external foundation gate is open",
            "status": "blocked",
            "summary": (
                f"Seq_020 still reports Phase 0 entry as {inputs['phase0_gate_verdict']['summary']['phase0_entry_verdict']}, "
                "so actual provider motion cannot be treated as current-baseline execution."
            ),
            "required_env": [],
            "source_refs": ["data/analysis/phase0_gate_verdict.json"],
        },
    ]


def build_decisions() -> list[dict[str, Any]]:
    return [
        {
            "decision_id": "DEC_37_001",
            "status": "accepted",
            "title": "Service Search v3 is the primary live discovery candidate.",
            "route_ids": ["service_search_v3_primary_candidate", "eps_dos_supporting_route"],
            "rationale": (
                "Use the current Service Search v3 posture as the main live discovery direction while keeping EPS-facing legacy support visible but subordinate."
            ),
            "source_refs": ["official_service_search_v3", "official_eps_dos_posture"],
        },
        {
            "decision_id": "DEC_37_002",
            "status": "accepted",
            "title": "Urgent-care DoS stays watch-only or supporting.",
            "route_ids": ["dos_urgent_rest_watch_or_supporting_route"],
            "rationale": (
                "Urgent and emergency care directory context matters, but it is not the baseline patient-visible pharmacy-choice route."
            ),
            "source_refs": ["official_uec_rest_api"],
        },
        {
            "decision_id": "DEC_37_003",
            "status": "accepted",
            "title": "Dispatch transport is its own truth domain.",
            "route_ids": ["dispatch_transport_primary_candidate", "mesh_or_transport_observation_dependency"],
            "rationale": (
                "Discovery, transport acceptance, business acknowledgement, and authoritative dispatch proof remain separate facts."
            ),
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.11 PharmacyDispatchEnvelope",
                "docs/external/28_mesh_message_route_and_proof_matrix.md",
            ],
        },
        {
            "decision_id": "DEC_37_004",
            "status": "accepted",
            "title": "Update Record is visibility and outcome observation only.",
            "route_ids": ["gp_update_record_assured_path", "practice_disabled_update_record_fallback"],
            "rationale": (
                "GP Connect Update Record supports consultation summaries and GP visibility, not urgent return, safeguarding, or referral transport."
            ),
            "source_refs": ["official_gp_connect_update_record"],
        },
        {
            "decision_id": "DEC_37_005",
            "status": "accepted",
            "title": "Manual urgent fallback stays explicit.",
            "route_ids": ["manual_nhsmail_or_phone_fallback"],
            "rationale": (
                "A monitored NHSmail or professional phone route remains necessary for urgent return and cannot be hidden behind digital optimism."
            ),
            "source_refs": [
                "blueprint/blueprint-init.md#7. Pharmacy First pathway",
                "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            ],
        },
        {
            "decision_id": "DEC_37_006",
            "status": "accepted",
            "title": "Outcome observation never auto-closes the request.",
            "route_ids": ["gp_update_record_assured_path", "mesh_or_transport_observation_dependency"],
            "rationale": (
                "Weak matches, duplicates, delayed summaries, and disabled routes keep the PharmacyOutcomeReconciliationGate explicit and closure-blocking."
            ),
            "source_refs": [
                "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                "blueprint/forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",
            ],
        },
        {
            "decision_id": "DEC_37_007",
            "status": "accepted",
            "title": "Actual-provider progression remains fail-closed.",
            "route_ids": [
                "service_search_v3_primary_candidate",
                "dispatch_transport_primary_candidate",
                "gp_update_record_assured_path",
            ],
            "rationale": (
                "Live routes remain blocked until MVP, approver, environment, mutation flag, watch-register clearance, and route-specific assurance evidence all exist."
            ),
            "source_refs": [
                "LIVE_GATE_PHARMACY_MVP_APPROVED",
                "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
                "LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED",
                "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
                "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION",
            ],
        },
    ]


def build_directory_matrix_rows(route_rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            field: (
                join_list(value)
                if isinstance((value := row[field]), list)
                else str(value)
            )
            for field in DIRECTORY_FIELDNAMES
        }
        for row in route_rows
    ]


def build_gap_register(gap_rows: list[dict[str, Any]], inputs: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": iso_now(),
        "visual_mode": VISUAL_MODE,
        "summary": {
            "gap_count": len(gap_rows),
            "blocking_gap_count": len([row for row in gap_rows if row["blocks_actual_strategy"] == "yes"]),
            "phase0_entry_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        },
        "gaps": gap_rows,
    }


def build_decision_register(
    inputs: dict[str, Any],
    route_rows: list[dict[str, Any]],
    update_record_rows: list[dict[str, str]],
    proof_ladders: list[dict[str, Any]],
    gap_rows: list[dict[str, Any]],
    live_gates: list[dict[str, Any]],
    decisions: list[dict[str, Any]],
) -> dict[str, Any]:
    directory_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_directory_and_choice")
    dispatch_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_dispatch_and_urgent_return")
    outcome_integration = find_integration_row(inputs["integration_priority_matrix"], "int_pharmacy_outcome_reconciliation")
    directory_family = find_provider_family(inputs["provider_family_scorecards"], "pharmacy_directory")
    dispatch_family = find_provider_family(inputs["provider_family_scorecards"], "pharmacy_dispatch_transport")
    outcome_family = find_provider_family(inputs["provider_family_scorecards"], "pharmacy_outcome_observation")
    blocked_gates = [gate for gate in live_gates if gate["status"] == "blocked"]

    return {
        "task_id": TASK_ID,
        "generated_at": iso_now(),
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "phase0_entry_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "official_guidance": OFFICIAL_GUIDANCE,
        "summary": {
            "route_count": len(route_rows),
            "update_record_path_count": len(update_record_rows),
            "discovery_route_count": len([row for row in route_rows if row["purpose_group"] == "discovery"]),
            "transport_route_count": len([row for row in route_rows if row["purpose_group"] == "transport"]),
            "visibility_route_count": len(
                [row for row in route_rows if row["route_id"] in {"gp_update_record_assured_path", "practice_disabled_update_record_fallback"}]
            ),
            "manual_route_count": len([row for row in route_rows if row["purpose_group"] == "manual"]),
            "blocking_gap_count": len([row for row in gap_rows if row["blocks_actual_strategy"] == "yes"]),
            "gap_count": len(gap_rows),
            "live_gate_count": len(live_gates),
            "blocked_live_gate_count": len(blocked_gates),
            "review_required_gate_count": len([row for row in live_gates if row["status"] == "review_required"]),
            "actual_provider_strategy_state": "blocked",
        },
        "route_rows": route_rows,
        "update_record_rows": update_record_rows,
        "proof_ladders": proof_ladders,
        "gap_rows": gap_rows,
        "decisions": decisions,
        "live_gates": live_gates,
        "integration_priority_digest": {
            "directory": {
                "integration_id": directory_integration["integration_id"],
                "mock_now_execution_rank": directory_integration["mock_now_execution_rank"],
                "actual_provider_strategy_later_rank": directory_integration["actual_provider_strategy_later_rank"],
                "truth_proof_digest": directory_integration["truth_proof_digest"],
            },
            "dispatch": {
                "integration_id": dispatch_integration["integration_id"],
                "mock_now_execution_rank": dispatch_integration["mock_now_execution_rank"],
                "actual_provider_strategy_later_rank": dispatch_integration["actual_provider_strategy_later_rank"],
                "truth_proof_digest": dispatch_integration["truth_proof_digest"],
            },
            "outcome": {
                "integration_id": outcome_integration["integration_id"],
                "mock_now_execution_rank": outcome_integration["mock_now_execution_rank"],
                "actual_provider_strategy_later_rank": outcome_integration["actual_provider_strategy_later_rank"],
                "truth_proof_digest": outcome_integration["truth_proof_digest"],
            },
        },
        "scorecard_digest": {
            "directory": {
                "provider_family": directory_family["provider_family"],
                "recommended_lane": directory_family["recommended_lane"],
                "focus": directory_family["focus"],
            },
            "dispatch": {
                "provider_family": dispatch_family["provider_family"],
                "recommended_lane": dispatch_family["recommended_lane"],
                "focus": dispatch_family["focus"],
            },
            "outcome": {
                "provider_family": outcome_family["provider_family"],
                "recommended_lane": outcome_family["recommended_lane"],
                "focus": outcome_family["focus"],
            },
        },
        "dry_run_harness": {
            "required_env": sorted(
                {
                    env_var
                    for gate in live_gates
                    for env_var in gate["required_env"]
                }
                | {
                    "PHARMACY_ROUTE_ATTEMPT",
                    "ALLOW_REAL_PROVIDER_MUTATION",
                }
            ),
            "official_label_checks": {
                "service_search_v3": [
                    "Version 3",
                    "2 February 2026",
                ],
                "eps_supplier_guidance": [
                    "Directory of Healthcare Services (Service Search) API",
                    "dispensing services",
                ],
                "gp_connect_update_record": [
                    "Pharmacy First",
                    "pharmacy consultation summaries",
                    "general practice workflow",
                ],
                "gp_connect_news": [
                    "Update Record",
                    "community pharmacy",
                ],
            },
            "selector_map": {
                "base_profile": {
                    "shell": "[data-testid='observatory-shell']",
                    "purpose_filter": "[data-testid='filter-purpose']",
                    "maturity_filter": "[data-testid='filter-maturity']",
                    "consent_filter": "[data-testid='filter-consent']",
                    "sort_select": "[data-testid='sort-select']",
                    "row_service_search": "[data-testid='route-row-service_search_v3_primary_candidate']",
                    "row_update_record": "[data-testid='route-row-gp_update_record_assured_path']",
                    "row_manual_fallback": "[data-testid='route-row-manual_nhsmail_or_phone_fallback']",
                    "inspector": "[data-testid='route-inspector']",
                    "gap_strip": "[data-testid='gap-strip']",
                    "parity_table": "[data-testid='parity-table']",
                }
            },
        },
    }


def build_markdown_docs(
    route_rows: list[dict[str, Any]],
    update_record_rows: list[dict[str, str]],
    proof_ladders: list[dict[str, Any]],
    gap_register: dict[str, Any],
    decision_register: dict[str, Any],
) -> None:
    mock_rows = [row for row in route_rows if row["current_execution"] in {"simulated_now", "simulated_now_no_live_write", "runbook_now", "watched_and_stubbed"}]
    live_rows = [row for row in route_rows if row["maturity"] in {"actual_later_gated", "watch_only_supporting", "supporting_dependency"}]

    mock_table = markdown_table(
        ["Route", "Current execution", "Purpose", "Consent dependency", "Fallback"],
        [
            [
                row["route_label"],
                row["current_execution"],
                row["purpose_class"],
                row["consent_dependency"],
                row["degraded_fallback_mode"],
            ]
            for row in mock_rows
        ],
    )

    live_table = markdown_table(
        ["Route", "Maturity", "Version posture", "Official status", "Why blocked or bounded"],
        [
            [
                row["route_label"],
                row["maturity"],
                row["official_version_posture"],
                row["official_status"],
                row["actual_later_position"],
            ]
            for row in live_rows
        ],
    )

    decision_table = markdown_table(
        ["Decision", "Choice", "Rationale"],
        [[row["decision_id"], row["title"], row["rationale"]] for row in decision_register["decisions"]],
    )

    guidance_table = markdown_table(
        ["Official source", "Captured", "Why it matters"],
        [[row["title"], row["captured_on"], row["summary"]] for row in OFFICIAL_GUIDANCE],
    )

    proof_table = markdown_table(
        ["Ladder", "Applies to", "Steps", "UI rule"],
        [
            [
                row["title"],
                join_list(row["applies_to_route_ids"]),
                "<br>".join(f"{index + 1}. {step}" for index, step in enumerate(row["steps"])),
                row["ui_rule"],
            ]
            for row in proof_ladders
        ],
    )

    update_record_table = markdown_table(
        ["Path", "Scope", "Direct write?", "Urgent use", "Closure policy"],
        [
            [
                row["path_label"],
                row["supported_scope"],
                row["vecells_direct_write"],
                row["urgent_use"],
                row["closure_policy"],
            ]
            for row in update_record_rows
        ],
    )

    gap_table = markdown_table(
        ["Gap", "Route", "Severity", "Blocks actual strategy", "Summary", "Next step"],
        [
            [
                row["gap_id"],
                row["route_id"],
                row["severity"],
                row["blocks_actual_strategy"],
                row["summary"],
                row["next_step"],
            ]
            for row in gap_register["gaps"]
        ],
    )

    gate_table = markdown_table(
        ["Gate", "Status", "Summary", "Required env"],
        [
            [
                row["gate_id"],
                row["status"],
                row["summary"],
                join_list(row["required_env"]) if row["required_env"] else "n/a",
            ]
            for row in decision_register["live_gates"]
        ],
    )

    write_text(
        MOCK_STRATEGY_DOC_PATH,
        "\n".join(
            [
                "# 37 Pharmacy Access Paths Mock Strategy",
                "",
                "Seq_037 creates the current pharmacy access-path twin without pretending that live directory onboarding, dispatch transport, or Update Record reach are already green.",
                "",
                "## Mock_now_execution",
                "",
                f"- current route rows: `{len(route_rows)}`",
                f"- current update-record rows: `{len(update_record_rows)}`",
                f"- actual-provider-later routes still blocked: `{decision_register['summary']['blocked_live_gate_count']}` gates blocked",
                "- the twin keeps discovery, patient choice, dispatch proof, visibility observation, urgent return, and manual fallback separate",
                "- Update Record remains visibility-only and may not stand in for urgent return or dispatch",
                "",
                "## Executable mock matrix",
                "",
                mock_table,
                "",
                "## Guardrails",
                "",
                "- Patient choice depends on PharmacyDirectorySnapshot, PharmacyProviderCapabilitySnapshot, and PharmacyChoiceProof together.",
                "- Dispatch calmness depends on PharmacyDispatchPlan, PharmacyDispatchAttempt, DispatchProofEnvelope, and ExternalConfirmationGate together.",
                "- Outcome visibility depends on reconciliation and may not auto-close the case from weak, delayed, or duplicate evidence.",
                "- Manual NHSmail or phone fallback stays first-class and visible instead of hidden behind digital optimism.",
            ]
        ),
    )

    write_text(
        ACTUAL_STRATEGY_DOC_PATH,
        "\n".join(
            [
                "# 37 Pharmacy Access Paths Actual Strategy",
                "",
                "As of 10 April 2026, the official route posture is current enough to classify, but not current enough to treat as automatically live for Vecells.",
                "",
                "## Actual_provider_strategy_later",
                "",
                f"- phase 0 external-foundation verdict: `{decision_register['phase0_entry_verdict']}`",
                f"- actual-provider strategy state: `{decision_register['summary']['actual_provider_strategy_state']}`",
                f"- blocking assurance gaps: `{gap_register['summary']['blocking_gap_count']}`",
                "",
                "## Official route classification",
                "",
                live_table,
                "",
                "## Live gates",
                "",
                gate_table,
                "",
                "## Current official grounding",
                "",
                guidance_table,
            ]
        ),
    )

    write_text(
        DECISION_PACK_DOC_PATH,
        "\n".join(
            [
                "# 37 Directory And Update Record Decision Pack",
                "",
                "This pack exists to close the three recurrent confusions: discovery is not dispatch, Update Record is not urgent return, and observed outcome evidence is not automatic closure truth.",
                "",
                "## Decisions",
                "",
                decision_table,
                "",
                "## Proof ladders",
                "",
                proof_table,
                "",
                "## Update Record path matrix",
                "",
                update_record_table,
                "",
                "## Route summary",
                "",
                markdown_table(
                    ["Route", "Purpose", "Patient choice", "Update Record scope", "Closure blocker"],
                    [
                        [
                            row["route_label"],
                            row["purpose_class"],
                            row["patient_choice_support"],
                            row["update_record_eligibility_scope"],
                            row["closure_blocker_implications"],
                        ]
                        for row in route_rows
                    ],
                ),
            ]
        ),
    )

    write_text(
        GAP_REGISTER_DOC_PATH,
        "\n".join(
            [
                "# 37 Pharmacy Provider Gap And Watch Register",
                "",
                "The watch register keeps the uncomfortable truth visible: live pharmacy routing is still blocked until route-specific access, transport assurance, visibility posture, and urgent fallback ownership all become concrete.",
                "",
                "## Gap and watch matrix",
                "",
                gap_table,
                "",
                "## Gate-state digest",
                "",
                gate_table,
                "",
                "## Route family split",
                "",
                markdown_table(
                    ["Purpose group", "Route count", "Representative routes"],
                    [
                        [
                            purpose_group,
                            len(rows),
                            join_list([row["route_id"] for row in rows]),
                        ]
                        for purpose_group, rows in grouped_route_rows(route_rows).items()
                    ],
                ),
            ]
        ),
    )


def grouped_route_rows(route_rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in route_rows:
        grouped.setdefault(row["purpose_group"], []).append(row)
    order = ["discovery", "transport", "visibility", "manual"]
    return {key: grouped[key] for key in order if key in grouped}


def build_html_payload(
    route_rows: list[dict[str, Any]],
    update_record_rows: list[dict[str, str]],
    proof_ladders: list[dict[str, Any]],
    gap_register: dict[str, Any],
    decision_register: dict[str, Any],
) -> dict[str, Any]:
    guidance_by_id = {row["source_id"]: row for row in OFFICIAL_GUIDANCE}
    gap_by_route: dict[str, list[dict[str, Any]]] = {}
    for gap in gap_register["gaps"]:
        gap_by_route.setdefault(gap["route_id"], []).append(gap)

    rows = []
    for row in route_rows:
        rows.append(
            {
                **row,
                "chip_labels_text": join_list(row["chip_labels"]),
                "source_refs_label": join_list(row["source_refs"]),
                "official_guidance_notes": [guidance_by_id[source_id]["summary"] for source_id in row["official_guidance_refs"]],
                "route_gap_ids": [gap["gap_id"] for gap in gap_by_route.get(row["route_id"], [])],
            }
        )

    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "summary": decision_register["summary"],
        "phase0_entry_verdict": decision_register["phase0_entry_verdict"],
        "route_rows": rows,
        "update_record_rows": update_record_rows,
        "proof_ladders": proof_ladders,
        "gap_rows": gap_register["gaps"],
        "official_guidance": OFFICIAL_GUIDANCE,
        "filter_options": {
            "purpose_group": ["discovery", "transport", "visibility", "manual"],
            "maturity": sorted({row["maturity"] for row in route_rows}),
            "consent_filter_class": sorted({row["consent_filter_class"] for row in route_rows}),
        },
    }


HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>37 Pharmacy Route Observatory</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23147D64'/%3E%3Cpath d='M18 18h28v10H34v18H24V28H18z' fill='white'/%3E%3C/svg%3E">
  <style>
    :root {
      --canvas: #F7FAF8;
      --rail: #EEF5F1;
      --panel: #FFFFFF;
      --inset: #F3F7F5;
      --text-strong: #102A23;
      --text: #1F3A34;
      --text-muted: #60736D;
      --border-subtle: #DCE7E2;
      --border-default: #C7D5CF;
      --primary: #147D64;
      --choice: #2563EB;
      --watch: #C98900;
      --blocked: #C24141;
      --reconcile: #7C3AED;
      --shadow: 0 22px 52px rgba(16, 42, 35, 0.08);
      --radius-xl: 28px;
      --radius-lg: 22px;
      --radius-md: 16px;
      --rail-width: 296px;
      --inspector-width: 360px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body {
      margin: 0;
      font-family: var(--sans);
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(20,125,100,0.11), transparent 28%),
        radial-gradient(circle at top right, rgba(37,99,235,0.06), transparent 24%),
        linear-gradient(180deg, #fbfdfc, var(--canvas));
    }
    body[data-reduced-motion="true"] * {
      animation-duration: 0ms !important;
      transition-duration: 0ms !important;
      scroll-behavior: auto !important;
    }
    .page {
      max-width: 1440px;
      margin: 0 auto;
      padding: 14px;
    }
    .masthead-shell {
      position: sticky;
      top: 0;
      z-index: 40;
      padding-top: 6px;
      background: linear-gradient(180deg, rgba(247,250,248,0.98), rgba(247,250,248,0.92) 74%, rgba(247,250,248,0));
      backdrop-filter: blur(10px);
    }
    .masthead {
      min-height: 72px;
      display: grid;
      gap: 18px;
      padding: 18px 20px;
      border: 1px solid rgba(255,255,255,0.7);
      background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(243,247,245,0.96));
      border-radius: 30px;
      box-shadow: var(--shadow);
    }
    .masthead-top {
      display: flex;
      gap: 18px;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .brand-block {
      display: grid;
      gap: 10px;
      max-width: 78ch;
    }
    .brand-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .brand-mark {
      width: 60px;
      height: 60px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(150deg, #147D64, #2563EB);
      color: white;
      box-shadow: 0 16px 24px rgba(20,125,100,0.24);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 12px;
      color: var(--text-muted);
    }
    h1 {
      margin: 0;
      font-size: clamp(32px, 4.2vw, 48px);
      line-height: 0.96;
      letter-spacing: -0.045em;
      color: var(--text-strong);
    }
    .subtitle {
      margin: 0;
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-muted);
    }
    .pill-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-content: start;
      justify-content: flex-end;
    }
    .pill {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-default);
      background: rgba(255,255,255,0.94);
      color: var(--text);
      font-size: 13px;
    }
    .pill strong {
      color: var(--text-strong);
      font-size: 18px;
    }
    .layout {
      margin-top: 16px;
      display: grid;
      grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
      gap: 16px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid rgba(255,255,255,0.72);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }
    .rail, .workspace, .inspector {
      padding: 18px;
    }
    .section-title {
      margin: 0 0 10px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--text-muted);
    }
    .filter-grid {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
    }
    .field {
      display: grid;
      gap: 6px;
    }
    label {
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    select {
      min-height: 44px;
      border-radius: 14px;
      border: 1px solid var(--border-default);
      background: white;
      color: var(--text);
      padding: 0 12px;
      font: inherit;
    }
    .rail-scroll {
      max-height: calc(100vh - 268px);
      overflow: auto;
      padding-right: 4px;
      display: grid;
      gap: 14px;
    }
    .rail-group {
      display: grid;
      gap: 10px;
    }
    .rail-group-title {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .route-button {
      width: 100%;
      min-height: 112px;
      border-radius: 18px;
      border: 1px solid var(--border-default);
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,247,245,0.94));
      padding: 14px;
      text-align: left;
      color: var(--text);
      display: grid;
      gap: 8px;
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .route-button:hover,
    .route-button[aria-pressed="true"] {
      transform: translateY(-1px);
      border-color: rgba(20,125,100,0.42);
      box-shadow: 0 12px 24px rgba(20,125,100,0.11);
    }
    .route-title {
      font-size: 15px;
      font-weight: 680;
      line-height: 1.35;
      color: var(--text-strong);
    }
    .route-meta {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.45;
    }
    .chip-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--inset);
      color: var(--text-muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .chip.primary { background: rgba(20,125,100,0.12); color: var(--primary); }
    .chip.watch { background: rgba(201,137,0,0.16); color: var(--watch); }
    .chip.blocked { background: rgba(194,65,65,0.12); color: var(--blocked); }
    .chip.choice { background: rgba(37,99,235,0.12); color: var(--choice); }
    .chip.reconcile { background: rgba(124,58,237,0.12); color: var(--reconcile); }
    .workspace {
      display: grid;
      gap: 16px;
    }
    .workspace-top {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
      gap: 16px;
      align-items: start;
    }
    .card {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 16px;
      background: rgba(255,255,255,0.98);
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .lane-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      align-items: stretch;
    }
    .lane-box {
      min-height: 108px;
      border: 1px solid var(--border-default);
      border-radius: 18px;
      padding: 14px;
      display: grid;
      gap: 8px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,247,245,0.94));
    }
    .lane-box.active {
      border-color: rgba(20,125,100,0.5);
      box-shadow: inset 0 0 0 1px rgba(20,125,100,0.12);
    }
    .lane-box span {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
    }
    .lane-box strong {
      font-size: 16px;
      color: var(--text-strong);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: top;
      line-height: 1.45;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
    }
    tbody tr {
      min-height: 52px;
      cursor: pointer;
    }
    tbody tr:hover,
    tbody tr[data-selected="true"] {
      background: rgba(20,125,100,0.08);
    }
    .table-route {
      display: grid;
      gap: 8px;
    }
    .mono {
      font-family: var(--mono);
      font-size: 12px;
    }
    .muted {
      color: var(--text-muted);
    }
    .proof-steps {
      display: grid;
      gap: 10px;
    }
    .proof-step {
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(243,247,245,0.94));
      display: grid;
      gap: 6px;
    }
    .proof-step strong {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.11em;
      color: var(--text-muted);
    }
    .stacked-bar {
      height: 18px;
      display: flex;
      overflow: hidden;
      border-radius: 999px;
      background: var(--inset);
      border: 1px solid var(--border-subtle);
    }
    .stacked-segment {
      min-width: 14px;
    }
    .segment-discovery { background: var(--primary); }
    .segment-transport { background: var(--choice); }
    .segment-visibility { background: var(--reconcile); }
    .segment-manual { background: var(--watch); }
    .stacked-legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      display: inline-block;
      margin-right: 6px;
      vertical-align: middle;
    }
    .inspector {
      padding: 18px;
    }
    .inspector-scroll {
      position: sticky;
      top: 102px;
      max-height: calc(100vh - 124px);
      overflow: auto;
      padding-right: 4px;
      display: grid;
      gap: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .metric {
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      background: rgba(255,255,255,0.98);
      padding: 12px;
    }
    .metric span {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 6px;
    }
    .metric strong {
      font-size: 15px;
      color: var(--text-strong);
    }
    .list {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
    }
    .lower-grid {
      display: grid;
      gap: 16px;
    }
    .gap-strip {
      display: grid;
      gap: 12px;
    }
    .gap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 12px;
    }
    .gap-card {
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,247,245,0.96));
      display: grid;
      gap: 8px;
    }
    .gap-card[data-blocks="yes"] {
      border-color: rgba(194,65,65,0.35);
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,242,242,0.96));
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    button:focus-visible,
    select:focus-visible,
    tr:focus-visible {
      outline: 3px solid rgba(20,125,100,0.24);
      outline-offset: 2px;
    }
    @media (max-width: 1260px) {
      .layout {
        grid-template-columns: var(--rail-width) minmax(0, 1fr);
      }
      .inspector {
        grid-column: 1 / -1;
      }
      .inspector-scroll {
        position: static;
        max-height: none;
        overflow: visible;
      }
    }
    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .workspace-top,
      .card-grid {
        grid-template-columns: 1fr;
      }
      .lane-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .page { padding: 10px; }
      .rail, .workspace, .inspector { padding: 14px; }
      .pill-row { justify-content: flex-start; }
      .metric-grid { grid-template-columns: 1fr; }
      th, td { padding: 10px 6px; font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="page" data-testid="observatory-shell">
    <div class="masthead-shell">
      <section class="masthead panel" aria-label="Pharmacy route observatory summary">
        <div class="masthead-top">
          <div class="brand-block">
            <div class="brand-row">
              <div class="brand-mark" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.5" y="1.5" width="31" height="31" rx="10" stroke="rgba(255,255,255,0.42)"/>
                  <path d="M8 10H26V14H18V24H14V14H8V10Z" fill="white"/>
                </svg>
              </div>
              <div>
                <div class="eyebrow">Vecells · <span class="mono">PHARM_PATHS</span></div>
                <h1>Pharmacy Route Observatory</h1>
              </div>
            </div>
            <p class="subtitle">
              One bounded view of pharmacy discovery, choice, dispatch, visibility, urgent fallback, and reconciliation.
              The observatory keeps calmness pinned to proof, not to transport convenience, and keeps Update Record
              explicitly out of urgent-return semantics.
            </p>
          </div>
          <div class="pill-row" id="summary-pills"></div>
        </div>
      </section>
    </div>

    <div class="layout">
      <aside class="panel rail">
        <div class="section-title">Filters</div>
        <div class="filter-grid">
          <div class="field">
            <label for="purpose-filter">Route purpose</label>
            <select id="purpose-filter" data-testid="filter-purpose"></select>
          </div>
          <div class="field">
            <label for="maturity-filter">Maturity</label>
            <select id="maturity-filter" data-testid="filter-maturity"></select>
          </div>
          <div class="field">
            <label for="consent-filter">Consent dependency</label>
            <select id="consent-filter" data-testid="filter-consent"></select>
          </div>
          <div class="field">
            <label for="sort-select">Sort</label>
            <select id="sort-select" data-testid="sort-select">
              <option value="version_desc">Version high to low</option>
              <option value="freshness_desc">Freshness high to low</option>
              <option value="label_asc">Route label A-Z</option>
            </select>
          </div>
        </div>
        <div class="section-title">Route rail</div>
        <div class="rail-scroll" id="route-rail" data-testid="route-rail"></div>
      </aside>

      <main class="panel workspace">
        <div class="workspace-top">
          <section class="card" aria-labelledby="matrix-heading">
            <div class="section-title" id="matrix-heading">Decision matrix</div>
            <table data-testid="route-matrix">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Purpose</th>
                  <th>Version</th>
                  <th>Freshness</th>
                  <th>Urgent suitability</th>
                </tr>
              </thead>
              <tbody id="matrix-body"></tbody>
            </table>
          </section>

          <div class="card-grid">
            <section class="card" aria-labelledby="consent-heading">
              <div class="section-title" id="consent-heading">Consent dependency</div>
              <div id="consent-card"></div>
            </section>
            <section class="card" data-testid="proof-ladder" aria-labelledby="proof-heading">
              <div class="section-title" id="proof-heading">Consent and proof ladder</div>
              <div id="proof-ladder-body" class="proof-steps"></div>
            </section>
          </div>
        </div>

        <section class="card" aria-labelledby="lane-heading">
          <div class="section-title" id="lane-heading">Lane diagram</div>
          <div class="lane-grid" id="lane-diagram" data-testid="lane-diagram"></div>
        </section>

        <div class="lower-grid">
          <section class="card">
            <div class="section-title">Compact route split</div>
            <div class="stacked-bar" id="stacked-bar" data-testid="stacked-comparison"></div>
            <div class="stacked-legend" id="stacked-legend"></div>
            <table data-testid="parity-table" style="margin-top:14px">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Purpose</th>
                  <th>Consent</th>
                  <th>Update Record scope</th>
                  <th>Closure blocker</th>
                </tr>
              </thead>
              <tbody id="parity-body"></tbody>
            </table>
          </section>

          <section class="panel gap-strip" data-testid="gap-strip">
            <div class="section-title">Gap and watch strip</div>
            <div class="gap-grid" id="gap-grid"></div>
          </section>
        </div>
      </main>

      <aside class="panel inspector">
        <div class="inspector-scroll" id="route-inspector" data-testid="route-inspector"></div>
      </aside>
    </div>
  </div>

  <script>
    const DATA = %%DATA_JSON%%;

    const state = {
      purposeGroup: "all",
      maturity: "all",
      consentFilter: "all",
      sort: "version_desc",
      selectedRouteId: DATA.route_rows[0]?.route_id ?? null,
    };

    const summaryPills = document.getElementById("summary-pills");
    const purposeFilter = document.getElementById("purpose-filter");
    const maturityFilter = document.getElementById("maturity-filter");
    const consentFilter = document.getElementById("consent-filter");
    const sortSelect = document.getElementById("sort-select");
    const routeRail = document.getElementById("route-rail");
    const matrixBody = document.getElementById("matrix-body");
    const consentCard = document.getElementById("consent-card");
    const proofLadderBody = document.getElementById("proof-ladder-body");
    const laneDiagram = document.getElementById("lane-diagram");
    const parityBody = document.getElementById("parity-body");
    const stackedBar = document.getElementById("stacked-bar");
    const stackedLegend = document.getElementById("stacked-legend");
    const gapGrid = document.getElementById("gap-grid");
    const routeInspector = document.getElementById("route-inspector");

    const purposeLabels = {
      discovery: "Discovery",
      transport: "Transport",
      visibility: "Visibility",
      manual: "Manual fallback",
    };
    const maturityLabels = {
      actual_later_gated: "Actual later",
      watch_only_supporting: "Watch only",
      supporting_dependency: "Dependency only",
      manual_only: "Manual only",
      fallback_only: "Fallback only",
    };
    const consentLabels = {
      pre_choice: "Pre-choice",
      tuple_bound_post_choice: "Tuple-bound after choice",
      manual_runbook: "Manual or runbook",
    };
    const stageLabels = ["Discovery", "Choice", "Dispatch", "Visibility", "Reconciliation"];
    const stageCopy = {
      Discovery: "Directory tuple and search context.",
      Choice: "Visible frontier and warned-choice proof.",
      Dispatch: "Frozen package, send route, and proof deadlines.",
      Visibility: "Observed summary or manual acknowledgement path.",
      Reconciliation: "Weak match, bounce-back, reopen, or manual review.",
    };
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      document.body.dataset.reducedMotion = "true";
    }

    function fillSelect(select, options, labels) {
      const current = select.value || "all";
      const html = ['<option value="all">All</option>']
        .concat(options.map((option) => `<option value="${option}">${labels[option] ?? option}</option>`))
        .join("");
      select.innerHTML = html;
      select.value = options.includes(current) ? current : "all";
    }

    function chip(label, kind) {
      return `<span class="chip ${kind || ""}">${label}</span>`;
    }

    function list(items) {
      return `<ul class="list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    }

    function filteredRows() {
      const rows = DATA.route_rows.filter((row) => {
        const purposeOk = state.purposeGroup === "all" || row.purpose_group === state.purposeGroup;
        const maturityOk = state.maturity === "all" || row.maturity === state.maturity;
        const consentOk = state.consentFilter === "all" || row.consent_filter_class === state.consentFilter;
        return purposeOk && maturityOk && consentOk;
      });
      return rows.slice().sort((left, right) => {
        if (state.sort === "version_desc") {
          return right.version_rank - left.version_rank || left.route_label.localeCompare(right.route_label);
        }
        if (state.sort === "freshness_desc") {
          return right.freshness_rank - left.freshness_rank || left.route_label.localeCompare(right.route_label);
        }
        return left.route_label.localeCompare(right.route_label);
      });
    }

    function ensureSelectedRoute(rows) {
      if (!rows.some((row) => row.route_id === state.selectedRouteId)) {
        state.selectedRouteId = rows[0]?.route_id ?? DATA.route_rows[0]?.route_id ?? null;
      }
    }

    function selectedRoute() {
      return DATA.route_rows.find((row) => row.route_id === state.selectedRouteId) ?? DATA.route_rows[0];
    }

    function routeColor(route) {
      if (route.purpose_group === "discovery") return "#147D64";
      if (route.purpose_group === "transport") return "#2563EB";
      if (route.purpose_group === "visibility") return "#7C3AED";
      return "#C98900";
    }

    function renderSummary() {
      summaryPills.innerHTML = [
        `<span class="pill"><strong>${DATA.summary.discovery_route_count}</strong> discovery routes</span>`,
        `<span class="pill"><strong>${DATA.summary.transport_route_count}</strong> transport routes</span>`,
        `<span class="pill"><strong>${DATA.summary.visibility_route_count}</strong> visibility routes</span>`,
        `<span class="pill"><strong>${DATA.summary.blocking_gap_count}</strong> unresolved blockers</span>`,
      ].join("");
    }

    function groupedRows(rows) {
      const grouped = new Map();
      for (const row of rows) {
        if (!grouped.has(row.purpose_group)) grouped.set(row.purpose_group, []);
        grouped.get(row.purpose_group).push(row);
      }
      return grouped;
    }

    function renderRail(rows) {
      const groups = groupedRows(rows);
      routeRail.innerHTML = Array.from(groups.entries()).map(([group, groupRows]) => `
        <section class="rail-group">
          <div class="rail-group-title">${purposeLabels[group] ?? group}</div>
          ${groupRows.map((row) => `
            <button
              type="button"
              class="route-button"
              data-testid="route-button-${row.route_id}"
              data-route-id="${row.route_id}"
              aria-pressed="${row.route_id === state.selectedRouteId ? "true" : "false"}"
            >
              <div class="route-title">${row.route_label}</div>
              <div class="chip-row">
                ${chip(maturityLabels[row.maturity] ?? row.maturity, row.maturity === "actual_later_gated" ? "primary" : row.maturity.includes("watch") ? "watch" : row.maturity.includes("fallback") || row.maturity.includes("manual") ? "blocked" : "choice")}
                ${row.chip_labels.map((label) => chip(label, label.includes("urgent") ? "blocked" : label.includes("manual") ? "watch" : label.includes("choice") ? "choice" : "reconcile")).join("")}
              </div>
              <div class="route-meta">${row.official_status}</div>
            </button>
          `).join("")}
        </section>
      `).join("");

      for (const button of routeRail.querySelectorAll(".route-button")) {
        button.addEventListener("click", () => {
          state.selectedRouteId = button.dataset.routeId;
          render();
        });
        button.addEventListener("keydown", (event) => {
          const buttons = Array.from(routeRail.querySelectorAll(".route-button"));
          const index = buttons.indexOf(button);
          if (event.key === "ArrowDown" && buttons[index + 1]) {
            event.preventDefault();
            buttons[index + 1].focus();
          }
          if (event.key === "ArrowUp" && buttons[index - 1]) {
            event.preventDefault();
            buttons[index - 1].focus();
          }
        });
      }
    }

    function renderMatrix(rows) {
      matrixBody.innerHTML = rows.map((row) => `
        <tr
          tabindex="0"
          data-testid="route-row-${row.route_id}"
          data-selected="${row.route_id === state.selectedRouteId ? "true" : "false"}"
          data-route-id="${row.route_id}"
        >
          <td>
            <div class="table-route">
              <strong>${row.route_label}</strong>
              <div class="chip-row">
                ${chip(purposeLabels[row.purpose_group], row.purpose_group === "discovery" ? "primary" : row.purpose_group === "transport" ? "choice" : row.purpose_group === "visibility" ? "reconcile" : "watch")}
                ${row.chip_labels.map((label) => chip(label, label.includes("urgent") ? "blocked" : label.includes("manual") ? "watch" : label.includes("choice") ? "choice" : "reconcile")).join("")}
              </div>
            </div>
          </td>
          <td>${row.purpose_class}</td>
          <td><span class="mono">${row.version_label}</span><br><span class="muted">${row.official_version_posture}</span></td>
          <td><span class="mono">${row.freshness_label}</span><br><span class="muted">${row.current_execution}</span></td>
          <td>${row.urgent_referral_suitability}</td>
        </tr>
      `).join("");

      for (const row of matrixBody.querySelectorAll("tr")) {
        const activate = () => {
          state.selectedRouteId = row.dataset.routeId;
          render();
        };
        row.addEventListener("click", activate);
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        });
      }
    }

    function renderConsentCard(route) {
      consentCard.innerHTML = `
        <div class="chip-row" style="margin-bottom:10px">
          ${chip(consentLabels[route.consent_filter_class] ?? route.consent_filter_class, "choice")}
          ${chip(route.patient_choice_support, route.patient_choice_support.includes("yes") ? "primary" : "watch")}
        </div>
        <p style="margin:0 0 12px">${route.consent_dependency}</p>
        <div class="muted"><strong>Capability snapshot:</strong> ${route.provider_capability_snapshot_requirement}</div>
      `;
    }

    function renderProofLadder(route) {
      const ladder = DATA.proof_ladders.find((row) => row.proof_ladder_id === route.proof_ladder_id);
      if (!ladder) {
        proofLadderBody.innerHTML = "<div class='proof-step'><strong>Missing</strong><div>No proof ladder registered.</div></div>";
        return;
      }
      proofLadderBody.innerHTML = ladder.steps.map((step, index) => `
        <article class="proof-step">
          <strong>Step ${index + 1}</strong>
          <div>${step}</div>
        </article>
      `).join("") + `
        <article class="proof-step">
          <strong>UI rule</strong>
          <div>${ladder.ui_rule}</div>
        </article>
      `;
    }

    function renderLaneDiagram(route) {
      laneDiagram.innerHTML = stageLabels.map((stage) => `
        <article class="lane-box ${route.stages.includes(stage) ? "active" : ""}" style="${route.stages.includes(stage) ? `border-color:${routeColor(route)}66` : ""}">
          <span>${stage}</span>
          <strong>${route.stages.includes(stage) ? route.route_label : stage}</strong>
          <div class="muted">${route.stages.includes(stage) ? stageCopy[stage] : "Inactive for the selected route."}</div>
        </article>
      `).join("");
    }

    function renderStacked(rows) {
      const counts = {
        discovery: rows.filter((row) => row.purpose_group === "discovery").length,
        transport: rows.filter((row) => row.purpose_group === "transport").length,
        visibility: rows.filter((row) => row.purpose_group === "visibility").length,
        manual: rows.filter((row) => row.purpose_group === "manual").length,
      };
      const total = Math.max(1, rows.length);
      const order = ["discovery", "transport", "visibility", "manual"];
      stackedBar.innerHTML = order.map((key) => `
        <div class="stacked-segment segment-${key}" style="width:${(counts[key] / total) * 100}%"></div>
      `).join("");
      stackedLegend.innerHTML = order.map((key) => `
        <span><span class="legend-dot segment-${key}"></span>${purposeLabels[key]}: ${counts[key]}</span>
      `).join("");
    }

    function renderParity(rows) {
      parityBody.innerHTML = rows.map((row) => `
        <tr>
          <td>${row.route_label}</td>
          <td>${row.purpose_class}</td>
          <td>${row.consent_dependency}</td>
          <td>${row.update_record_eligibility_scope}</td>
          <td>${row.closure_blocker_implications}</td>
        </tr>
      `).join("");
    }

    function renderInspector(route) {
      const gaps = DATA.gap_rows.filter((row) => row.route_id === route.route_id);
      const guidanceRows = DATA.official_guidance.filter((row) => route.official_guidance_refs.includes(row.source_id));
      routeInspector.innerHTML = `
        <section class="card">
          <div class="section-title">Selected route</div>
          <h2 style="margin:0 0 10px;font-size:26px;line-height:1.05;color:var(--text-strong)">${route.route_label}</h2>
          <div class="chip-row">
            ${chip(maturityLabels[route.maturity] ?? route.maturity, route.maturity === "actual_later_gated" ? "primary" : route.maturity.includes("watch") ? "watch" : route.maturity.includes("manual") || route.maturity.includes("fallback") ? "blocked" : "reconcile")}
            ${route.chip_labels.map((label) => chip(label, label.includes("urgent") ? "blocked" : label.includes("manual") ? "watch" : label.includes("choice") ? "choice" : "reconcile")).join("")}
          </div>
          <p style="margin:12px 0 0">${route.official_status}</p>
        </section>

        <section class="card">
          <div class="section-title">Route metrics</div>
          <div class="metric-grid">
            <div class="metric"><span>Purpose</span><strong>${purposeLabels[route.purpose_group] ?? route.purpose_group}</strong></div>
            <div class="metric"><span>Version</span><strong>${route.version_label}</strong></div>
            <div class="metric"><span>Freshness</span><strong>${route.freshness_label}</strong></div>
            <div class="metric"><span>Urgent suitability</span><strong>${route.urgent_referral_suitability}</strong></div>
          </div>
        </section>

        <section class="card">
          <div class="section-title">Proof, fallback, closure</div>
          ${list([
            `<strong>Dispatch proof:</strong> ${route.dispatch_proof_requirement}`,
            `<strong>Acknowledgement or expiry:</strong> ${route.acknowledgement_or_expiry_semantics}`,
            `<strong>Ambiguity:</strong> ${route.ambiguity_mode}`,
            `<strong>Fallback:</strong> ${route.degraded_fallback_mode}`,
            `<strong>Closure blocker:</strong> ${route.closure_blocker_implications}`,
          ])}
        </section>

        <section class="card">
          <div class="section-title">Official process notes</div>
          ${guidanceRows.length ? list(guidanceRows.map((row) => `<strong>${row.title}:</strong> ${row.summary}`)) : "<div class='muted'>No official note attached to this route row.</div>"}
        </section>

        <section class="card">
          <div class="section-title">Route-specific notes</div>
          ${list(route.inspector_notes)}
          <div class="mono muted" style="margin-top:12px">${route.source_refs_label}</div>
        </section>

        <section class="card">
          <div class="section-title">Gap watch</div>
          ${gaps.length ? list(gaps.map((gap) => `<strong>${gap.gap_id}:</strong> ${gap.summary}`)) : "<div class='muted'>No route-specific gap rows.</div>"}
        </section>
      `;
    }

    function renderGapStrip(route) {
      const relevant = DATA.gap_rows.filter((gap) => gap.route_id === route.route_id || gap.blocks_actual_strategy === "yes");
      gapGrid.innerHTML = relevant.map((gap) => `
        <article class="gap-card" data-testid="gap-card-${gap.gap_id}" data-blocks="${gap.blocks_actual_strategy}">
          <div class="chip-row">
            ${chip(gap.severity, gap.severity === "high" ? "blocked" : "watch")}
            ${chip(gap.gap_class.replaceAll("_", " "), "watch")}
          </div>
          <strong>${gap.gap_id}</strong>
          <div>${gap.summary}</div>
          <div class="muted"><strong>Next:</strong> ${gap.next_step}</div>
        </article>
      `).join("");
    }

    function render() {
      const rows = filteredRows();
      ensureSelectedRoute(rows);
      const route = selectedRoute();
      renderRail(rows);
      renderMatrix(rows);
      renderConsentCard(route);
      renderProofLadder(route);
      renderLaneDiagram(route);
      renderStacked(rows);
      renderParity(rows);
      renderInspector(route);
      renderGapStrip(route);
    }

    fillSelect(purposeFilter, DATA.filter_options.purpose_group, purposeLabels);
    fillSelect(maturityFilter, DATA.filter_options.maturity, maturityLabels);
    fillSelect(consentFilter, DATA.filter_options.consent_filter_class, consentLabels);

    purposeFilter.addEventListener("change", (event) => {
      state.purposeGroup = event.target.value;
      render();
    });
    maturityFilter.addEventListener("change", (event) => {
      state.maturity = event.target.value;
      render();
    });
    consentFilter.addEventListener("change", (event) => {
      state.consentFilter = event.target.value;
      render();
    });
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      render();
    });

    renderSummary();
    render();
  </script>
</body>
</html>
"""


def build_observatory_html(payload: dict[str, Any]) -> str:
    data_json = json.dumps(payload).replace("</", "<\\/")
    return HTML_TEMPLATE.replace("%%DATA_JSON%%", data_json)


def main() -> None:
    inputs = ensure_inputs()
    route_rows = build_route_rows(inputs)
    update_record_rows = build_update_record_rows()
    proof_ladders = build_proof_ladders()
    gap_rows = build_gap_rows()
    live_gates = build_live_gates(inputs)
    decisions = build_decisions()
    gap_register = build_gap_register(gap_rows, inputs)
    decision_register = build_decision_register(
        inputs,
        route_rows,
        update_record_rows,
        proof_ladders,
        gap_rows,
        live_gates,
        decisions,
    )

    write_csv(DIRECTORY_MATRIX_CSV_PATH, DIRECTORY_FIELDNAMES, build_directory_matrix_rows(route_rows))
    write_csv(UPDATE_RECORD_MATRIX_CSV_PATH, UPDATE_RECORD_FIELDNAMES, update_record_rows)
    write_json(DECISION_REGISTER_JSON_PATH, decision_register)
    write_json(GAP_REGISTER_JSON_PATH, gap_register)
    build_markdown_docs(route_rows, update_record_rows, proof_ladders, gap_register, decision_register)
    html_payload = build_html_payload(route_rows, update_record_rows, proof_ladders, gap_register, decision_register)
    write_text(OBSERVATORY_HTML_PATH, build_observatory_html(html_payload))


if __name__ == "__main__":
    main()
