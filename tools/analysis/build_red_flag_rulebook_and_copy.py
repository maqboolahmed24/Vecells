#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_TEST_DIR = ROOT / "data" / "test"
DOCS_CLINICAL_SAFETY_DIR = ROOT / "docs" / "clinical-safety"
DOCS_CONTENT_DIR = ROOT / "docs" / "content"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"

INTAKE_OUTCOME_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_outcome_presentation_artifact.schema.json"
INTAKE_SUBMIT_SETTLEMENT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_submit_settlement.schema.json"
INTAKE_EVENT_CATALOG_PATH = DATA_CONTRACTS_DIR / "139_intake_event_catalog.json"
REQUEST_TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
ATTACHMENT_POLICY_PATH = DATA_CONTRACTS_DIR / "141_attachment_acceptance_policy.json"
CLINICAL_SIGNOFF_DOC_PATH = ROOT / "docs" / "assurance" / "125_clinical_signoff_matrix.md"
CLINICAL_REVIEW_DOC_PATH = ROOT / "docs" / "assurance" / "125_clinical_risk_review_cadence.md"
SAFETY_CASE_DOC_PATH = ROOT / "docs" / "assurance" / "121_dcb0129_clinical_safety_case_structure.md"
SAFETY_CASE_OUTLINE_PATH = ROOT / "data" / "assurance" / "dcb0129_safety_case_outline.json"

RULEBOOK_DOC_PATH = DOCS_CLINICAL_SAFETY_DIR / "142_red_flag_rulebook.md"
DECISION_TABLES_DOC_PATH = DOCS_CLINICAL_SAFETY_DIR / "142_red_flag_decision_tables.md"
COPY_DECK_DOC_PATH = DOCS_CONTENT_DIR / "142_urgent_diversion_and_receipt_copy_deck.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "142_urgent_pathway_atlas.html"
RULE_PACK_SCHEMA_PATH = DATA_CONTRACTS_DIR / "142_red_flag_rule_pack.schema.json"
DECISION_TABLES_YAML_PATH = DATA_CONTRACTS_DIR / "142_red_flag_decision_tables.yaml"
OUTCOME_COPY_CONTRACT_PATH = DATA_CONTRACTS_DIR / "142_outcome_copy_contract.json"
CHALLENGE_CASES_PATH = DATA_TEST_DIR / "142_rule_challenge_cases.jsonl"
RULE_COVERAGE_MATRIX_PATH = DATA_ANALYSIS_DIR / "142_rule_coverage_matrix.csv"

TASK_ID = "seq_142"
VISUAL_MODE = "Urgent_Pathway_Frame"
CAPTURED_ON = "2026-04-14"
RULE_PACK_ID = "RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1"
RULE_PACK_VERSION = "1.0.0"
OUTCOME_COPY_CONTRACT_ID = "OCC_142_PHASE1_OUTCOME_COPY_V1"
ARTIFACT_SCHEMA_REF = "data/contracts/139_intake_outcome_presentation_artifact.schema.json"
SUBMIT_SETTLEMENT_SCHEMA_REF = "data/contracts/139_intake_submit_settlement.schema.json"
DECISION_TABLE_FORMAT_NOTE = (
    "The .yaml file is emitted as canonical JSON text, which remains valid YAML 1.2 while staying replay-safe "
    "for the repo's Python-only tooling."
)

SOURCE_PRECEDENCE = [
    "prompt/142.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine",
    "blueprint/phase-cards.md#card-2-phase-1-the-red-flag-gate",
    "blueprint/phase-0-the-foundation-protocol.md#SafetyPreemptionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#SafetyDecisionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#UrgentDiversionSettlement",
    "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
    "blueprint/forensic-audit-findings.md#Finding 10",
    "blueprint/forensic-audit-findings.md#Finding 11",
    "blueprint/forensic-audit-findings.md#Finding 12",
    "blueprint/forensic-audit-findings.md#Finding 62",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
    "blueprint/uiux-skill.md",
    "docs/assurance/121_dcb0129_clinical_safety_case_structure.md",
    "docs/assurance/125_clinical_signoff_matrix.md",
    "docs/assurance/125_clinical_risk_review_cadence.md",
    "data/assurance/dcb0129_safety_case_outline.json",
    "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
    "data/contracts/139_intake_submit_settlement.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "data/contracts/140_request_type_taxonomy.json",
    "data/contracts/141_attachment_acceptance_policy.json",
]

UPSTREAM_INPUTS = [
    "data/contracts/139_intake_outcome_presentation_artifact.schema.json",
    "data/contracts/139_intake_submit_settlement.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "data/contracts/140_request_type_taxonomy.json",
    "data/contracts/141_attachment_acceptance_policy.json",
    "docs/assurance/121_dcb0129_clinical_safety_case_structure.md",
    "docs/assurance/125_clinical_signoff_matrix.md",
    "docs/assurance/125_clinical_risk_review_cadence.md",
    "data/assurance/dcb0129_safety_case_outline.json",
]

FOUR_PASS_ALGORITHM = [
    "derive tri-state clinical features, contradiction burden c_crit(S), and critical-missingness burden m_crit(S) from the frozen composite-evidence lattice",
    "evaluate authored hard-stop rules before any soft scoring",
    "compute z_U(S), z_R(S), p_U(S), and p_R(S) using dependency-group caps plus the active calibrator set",
    "apply the decision boundary: urgent diversion if any hard-stop fires or p_U(S) >= theta_U; residual_risk_flagged when urgent is false and residual, contradiction, or missingness thresholds trip; otherwise screen_clear",
]

DEPENDENCY_GROUPS = [
    {
        "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
        "label": "Acute cardio-respiratory danger",
        "capUrgent": 3.4,
        "capResidual": 1.2,
        "rationale": "Chest pain and breathing danger signals may cluster; cap the group so multiple correlated cues do not inflate the score beyond the authored ceiling.",
    },
    {
        "dependencyGroupRef": "DG_142_NEURO_COLLAPSE_URGENT",
        "label": "Neurology, seizure, or collapse danger",
        "capUrgent": 3.2,
        "capResidual": 1.0,
        "rationale": "One collapse-style cluster is enough to justify escalation; repeated low-assurance copies must not double-count.",
    },
    {
        "dependencyGroupRef": "DG_142_ALLERGY_MEDS_URGENT",
        "label": "Severe allergy or medication reaction",
        "capUrgent": 3.0,
        "capResidual": 1.0,
        "rationale": "Medication reactions and airway-allergy findings are correlated and must stay bounded.",
    },
    {
        "dependencyGroupRef": "DG_142_RESULTS_MEDS_TIMING",
        "label": "Time-critical meds or results follow-up",
        "capUrgent": 2.1,
        "capResidual": 1.8,
        "rationale": "High-risk results and medicine interruption can push urgency or residual review, but correlated administrative detail must remain capped.",
    },
    {
        "dependencyGroupRef": "DG_142_REACHABILITY",
        "label": "Contact safety and callback reachability",
        "capUrgent": 1.4,
        "capResidual": 1.3,
        "rationale": "Reachability matters for same-day safety contact but may not quietly override a clearer clinical picture.",
    },
]

CALIBRATION_STRATA = [
    {
        "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
        "requestTypes": ["Symptoms"],
        "identityCalibratorRef": "CAL_142_IDENTITY_SYMPTOMS_V1",
        "graduationRule": "promote_isotonic_after_50_adjudicated_cases_and_at_least_8_urgent_positives",
    },
    {
        "calibrationStratumRef": "STRATUM_142_MEDS_V1",
        "requestTypes": ["Meds"],
        "identityCalibratorRef": "CAL_142_IDENTITY_MEDS_V1",
        "graduationRule": "promote_isotonic_after_40_adjudicated_cases_and_at_least_6_urgent_positives",
    },
    {
        "calibrationStratumRef": "STRATUM_142_ADMIN_RESULTS_V1",
        "requestTypes": ["Admin", "Results"],
        "identityCalibratorRef": "CAL_142_IDENTITY_ADMIN_RESULTS_V1",
        "graduationRule": "promote_isotonic_after_40_adjudicated_cases_and_at_least_6_review_or_urgent_cases",
    },
    {
        "calibrationStratumRef": "STRATUM_142_GLOBAL_FALLBACK_V1",
        "requestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "identityCalibratorRef": "CAL_142_IDENTITY_GLOBAL_V1",
        "graduationRule": "identity_only_until every request-type stratum meets its own evidence floor",
    },
]

VALIDITY_WINDOWS = [
    {
        "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
        "label": "Immediate / 72-hour acute window",
        "windowHours": 72,
    },
    {
        "validityWindowRef": "WINDOW_142_SHORT_TERM_7D",
        "label": "Short-term 7 day review window",
        "windowHours": 168,
    },
    {
        "validityWindowRef": "WINDOW_142_RESULTS_30D",
        "label": "Results and admin 30 day window",
        "windowHours": 720,
    },
]

THRESHOLDS = {
    "urgent": {
        "falsePositiveCost": 1.0,
        "falseNegativeCost": 11.0,
        "thetaU": round(1.0 / 12.0, 6),
    },
    "residual": {
        "falsePositiveCost": 2.0,
        "falseNegativeCost": 5.0,
        "thetaR": round(2.0 / 7.0, 6),
    },
    "contradictionThreshold": 0.55,
    "criticalMissingnessThreshold": 0.6,
    "calibrationDiagnostics": {
        "urgentSensitivityFloor": 0.92,
        "reviewCaptureFloor": 0.88,
        "brierScoreCeiling": 0.16,
        "calibrationInterceptAbsCeiling": 0.15,
        "calibrationSlopeBand": [0.85, 1.15],
    },
}

FORBIDDEN_VALIDATION_TONE = [
    "fix the highlighted fields",
    "please correct the errors above",
    "validation error",
    "check the form and try again",
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLVED_142_URGENT_REQUIRED_VS_URGENT_ISSUED",
        "summary": "The rulebook, state machine, and copy contract now keep urgent_diversion_required separate from urgent_diverted and require UrgentDiversionSettlement before the issued state may render.",
    },
    {
        "gapId": "GAP_RESOLVED_142_RULEBOOK_IS_MACHINE_READABLE",
        "summary": "The synchronous safety gate is now frozen as schema-backed rule metadata plus authored decision tables rather than prose-only spreadsheet logic.",
    },
    {
        "gapId": "GAP_RESOLVED_142_DEGRADED_ATTACHMENTS_FAIL_CLOSED",
        "summary": "Unresolved attachment meaning or parser disagreement now routes into fail-closed review or failed-safe recovery instead of silently dropping to screen_clear.",
    },
    {
        "gapId": "GAP_RESOLVED_142_HARD_STOP_DOMINANCE",
        "summary": "Hard-stop rules remain dominant and cannot be softened away by calibrators or soft-score smoothing.",
    },
    {
        "gapId": "GAP_RESOLVED_142_URGENT_IS_A_PATHWAY_CHANGE",
        "summary": "Urgent outcome copy now reads as an unmistakable pathway change with one dominant next action instead of a form-validation or generic error surface.",
    },
    {
        "gapId": "GAP_RESOLVED_142_SAFE_AND_FAILED_SAFE_ARE_DISTINCT",
        "summary": "Safe receipt and failed-safe recovery now have different state names, different primary actions, and non-overlapping copy identifiers.",
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_142_PLACEHOLDER_APPROVERS_ROLE_ONLY",
        "summary": "Rule metadata uses the placeholder roles already frozen in the DCB0129 and signoff packs; named approvers remain a later governance substitution, not a semantic change.",
    },
    {
        "assumptionId": "ASSUMPTION_142_IDENTITY_CALIBRATORS_REQUIRED_NOW",
        "summary": "Identity calibrators remain mandatory for Phase 1 until adjudicated challenge data meets the published graduation criteria per stratum.",
    },
]

RISKS = [
    {
        "riskId": "RISK_142_OVER_BROAD_URGENT_COPY",
        "summary": "Urgent text that sounds like generic failure or form validation would cause unsafe hesitation.",
        "mitigation": "Urgent variants explicitly ban validation tone, surface a single dominant action, and use pathway-change language only.",
    },
    {
        "riskId": "RISK_142_THRESHOLD_DRIFT_WITHOUT_DIAGNOSTICS",
        "summary": "Soft-score changes could drift if challenge-set diagnostics are not carried with the rule-pack version.",
        "mitigation": "The rule pack publishes harm-ratio thresholds, calibrator discipline, and signed-off diagnostics fields together.",
    },
]

CONFLICTS = [
    {
        "conflictId": "CONFLICT_142_LIVE_GOVERNANCE_MAY_STRENGTHEN_NOT_WEAKEN",
        "summary": "Later clinical governance may add challenge cases, named approvers, or stricter handoff routing, but it may not weaken the Phase 1 rule IDs, hard-stop dominance, or outcome semantics frozen here.",
    }
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def esc(value: str) -> str:
        return value.replace("|", "\\|")

    lines = [
        "| " + " | ".join(esc(header) for header in headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(esc(cell) for cell in row) + " |")
    return "\n".join(lines)


def json_block(payload: Any) -> str:
    return "```json\n" + json.dumps(payload, indent=2) + "\n```"


def load_prerequisites() -> dict[str, Any]:
    for path in [
        INTAKE_OUTCOME_SCHEMA_PATH,
        INTAKE_SUBMIT_SETTLEMENT_SCHEMA_PATH,
        INTAKE_EVENT_CATALOG_PATH,
        REQUEST_TAXONOMY_PATH,
        ATTACHMENT_POLICY_PATH,
        CLINICAL_SIGNOFF_DOC_PATH,
        CLINICAL_REVIEW_DOC_PATH,
        SAFETY_CASE_DOC_PATH,
        SAFETY_CASE_OUTLINE_PATH,
    ]:
        ensure(path.exists(), f"PREREQUISITE_GAP_142_MISSING_{path.name}")

    outcome_schema = load_json(INTAKE_OUTCOME_SCHEMA_PATH)
    submit_settlement_schema = load_json(INTAKE_SUBMIT_SETTLEMENT_SCHEMA_PATH)
    event_catalog = load_json(INTAKE_EVENT_CATALOG_PATH)
    taxonomy = load_json(REQUEST_TAXONOMY_PATH)
    attachment_policy = load_json(ATTACHMENT_POLICY_PATH)
    safety_case_outline = load_json(SAFETY_CASE_OUTLINE_PATH)

    summary_tiers = set(outcome_schema["properties"]["summarySafetyTier"]["enum"])
    ensure(
        {"routine_clear", "routine_recovery", "urgent_diversion_required", "processing_failed"}.issubset(summary_tiers),
        "PREREQUISITE_GAP_142_OUTCOME_ARTIFACT_TIERS_INCOMPLETE",
    )
    submit_results = set(submit_settlement_schema["properties"]["result"]["enum"])
    ensure(
        {"urgent_diversion", "triage_ready", "failed_safe"}.issubset(submit_results),
        "PREREQUISITE_GAP_142_SUBMIT_SETTLEMENT_RESULTS_INCOMPLETE",
    )

    event_names = {row["eventName"] for row in event_catalog["eventCatalog"]}
    ensure(
        {"request.submitted", "safety.urgent_diversion.required", "safety.urgent_diversion.completed", "patient.receipt.issued"}.issubset(event_names),
        "PREREQUISITE_GAP_142_EVENT_CATALOG_MISSING_URGENT_OR_RECEIPT_EVENTS",
    )

    request_types = [row["requestType"] for row in taxonomy["requestTypes"]]
    ensure(request_types == ["Symptoms", "Meds", "Admin", "Results"], "PREREQUISITE_GAP_142_REQUEST_TYPES_DRIFTED")

    classification_outcomes = {row["outcome"] for row in attachment_policy["classificationOutcomes"]}
    ensure(
        "quarantined_unreadable" in classification_outcomes and "preview_unavailable_but_file_kept" in classification_outcomes,
        "PREREQUISITE_GAP_142_ATTACHMENT_FAIL_CLOSED_SURFACE_MISSING",
    )

    governance_roles = {row["role_id"] for row in safety_case_outline["governance_roles"]}
    ensure(
        {"ROLE_MANUFACTURER_CSO", "ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER", "ROLE_TRIAGE_RULESET_OWNER"}.issubset(governance_roles),
        "PREREQUISITE_GAP_142_SAFETY_GOVERNANCE_ROLES_MISSING",
    )

    return {
        "eventNames": event_names,
        "requestTypes": request_types,
        "governanceRoles": governance_roles,
        "safetyCaseOutline": safety_case_outline,
    }


def build_rules() -> list[dict[str, Any]]:
    return [
        {
            "ruleId": "RF142_HS_ACUTE_CHEST_BREATHING",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Acute chest or breathing danger",
            "clinicalRationale": "Immediate chest or severe breathing danger must leave the routine queue and move to urgent guidance without score smoothing.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_CHEST_BREATHING_URGENT_V1",
            "severityClass": "hard_stop",
            "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
            "logLikelihoodWeight": 4.1,
            "criticalFeatureRefs": [
                "feature.symptoms.chest_breathing_selected",
                "feature.symptoms.acute_distress_signal",
                "feature.symptoms.worsening_now",
            ],
            "missingnessMode": "urgent_review",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "category = chest_breathing and (acute_distress_signal = true or worsening_now = true and onset_window <= 72h)",
            "dominatesSoftScore": True,
            "challengeCaseRefs": ["C142_URGENT_CHEST_PAIN", "C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP"],
        },
        {
            "ruleId": "RF142_HS_STROKE_COLLAPSE_OR_SEIZURE",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Stroke, collapse, or seizure signal",
            "clinicalRationale": "Stroke-like deficit, seizure, or collapse indicators require urgent escalation regardless of lower-assurance conflicting details.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_NEURO_COLLAPSE_V1",
            "severityClass": "hard_stop",
            "dependencyGroupRef": "DG_142_NEURO_COLLAPSE_URGENT",
            "logLikelihoodWeight": 4.3,
            "criticalFeatureRefs": [
                "feature.symptoms.stroke_like_signal",
                "feature.symptoms.collapse_or_seizure_signal",
            ],
            "missingnessMode": "urgent_review",
            "contradictionMode": "clinician_override_only",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "stroke_like_signal = true or collapse_or_seizure_signal = true",
            "dominatesSoftScore": True,
            "challengeCaseRefs": ["C142_URGENT_STROKE_SIGNAL"],
        },
        {
            "ruleId": "RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Anaphylaxis or severe medication reaction",
            "clinicalRationale": "Airway swelling, severe allergic pattern, or medication reaction with airway compromise is a same-day urgent handoff.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_ALLERGY_MED_REACTION_V1",
            "severityClass": "hard_stop",
            "dependencyGroupRef": "DG_142_ALLERGY_MEDS_URGENT",
            "logLikelihoodWeight": 4.0,
            "criticalFeatureRefs": [
                "feature.symptoms.anaphylaxis_pattern",
                "feature.meds.reaction_airway_compromise",
            ],
            "missingnessMode": "urgent_review",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_MEDS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms", "Meds"],
            "decisionPredicate": "anaphylaxis_pattern = true or reaction_airway_compromise = true",
            "dominatesSoftScore": True,
            "challengeCaseRefs": ["C142_URGENT_MED_REACTION"],
        },
        {
            "ruleId": "RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Heavy bleeding or pregnancy-related red flag",
            "clinicalRationale": "Heavy bleeding or acute pregnancy-related red flags must not remain in routine asynchronous review.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_BLEEDING_PREGNANCY_V1",
            "severityClass": "hard_stop",
            "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
            "logLikelihoodWeight": 3.9,
            "criticalFeatureRefs": [
                "feature.symptoms.heavy_bleeding_signal",
                "feature.symptoms.pregnancy_red_flag_signal",
            ],
            "missingnessMode": "urgent_review",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "heavy_bleeding_signal = true or pregnancy_red_flag_signal = true",
            "dominatesSoftScore": True,
            "challengeCaseRefs": ["C142_URGENT_HEAVY_BLEEDING"],
        },
        {
            "ruleId": "RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Self-harm or safeguarding danger",
            "clinicalRationale": "Self-harm intent or safeguarding danger must move into urgent contact or escalation rather than routine queue handling.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_SELF_HARM_V1",
            "severityClass": "hard_stop",
            "dependencyGroupRef": "DG_142_NEURO_COLLAPSE_URGENT",
            "logLikelihoodWeight": 4.4,
            "criticalFeatureRefs": [
                "feature.symptoms.self_harm_signal",
                "feature.symptoms.immediate_safeguarding_signal",
            ],
            "missingnessMode": "urgent_review",
            "contradictionMode": "clinician_override_only",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms", "Admin"],
            "decisionPredicate": "self_harm_signal = true or immediate_safeguarding_signal = true",
            "dominatesSoftScore": True,
            "challengeCaseRefs": ["C142_URGENT_SELF_HARM_SIGNAL"],
        },
        {
            "ruleId": "RF142_UC_SEVERE_PAIN_ESCALATION",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Severe pain escalation",
            "clinicalRationale": "Escalating severe pain is not enough on its own for urgent diversion in every case, but it materially increases urgent risk.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_SEVERE_PAIN_V1",
            "severityClass": "urgent_contributor",
            "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
            "logLikelihoodWeight": 1.45,
            "criticalFeatureRefs": ["feature.symptoms.severe_pain_escalation"],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "latest_highest_assurance",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_SHORT_TERM_7D",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "severe_pain_escalation = true",
            "challengeCaseRefs": ["C142_THRESHOLD_URGENT_OVER"],
        },
        {
            "ruleId": "RF142_UC_RAPID_WORSENING_RECENT_ONSET",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Rapid worsening with recent onset",
            "clinicalRationale": "Rapid worsening and very recent onset together materially increase urgent risk even when no hard-stop antecedent has fired.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_RAPID_WORSENING_V1",
            "severityClass": "urgent_contributor",
            "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
            "logLikelihoodWeight": 1.2,
            "criticalFeatureRefs": [
                "feature.symptoms.rapid_worsening_recent_onset",
                "feature.symptoms.onset_within_72h",
            ],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "latest_highest_assurance",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_IMMEDIATE_0H_72H",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "rapid_worsening_recent_onset = true",
            "challengeCaseRefs": ["C142_THRESHOLD_URGENT_OVER", "C142_THRESHOLD_URGENT_UNDER"],
        },
        {
            "ruleId": "RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS",
            "ruleVersion": "1.0.0",
            "humanReadableName": "High-risk result paired with current symptoms",
            "clinicalRationale": "A high-risk result question paired with current symptoms should raise urgent concern even before full downstream interpretation exists.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_RESULTS_URGENT_V1",
            "severityClass": "urgent_contributor",
            "dependencyGroupRef": "DG_142_RESULTS_MEDS_TIMING",
            "logLikelihoodWeight": 1.35,
            "criticalFeatureRefs": [
                "feature.results.high_risk_result_query",
                "feature.symptoms.current_clinical_symptoms_present",
            ],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_ADMIN_RESULTS_V1",
            "validityWindowRef": "WINDOW_142_RESULTS_30D",
            "requestTypes": ["Results"],
            "decisionPredicate": "high_risk_result_query = true and current_clinical_symptoms_present = true",
            "challengeCaseRefs": ["C142_RESULTS_RESIDUAL_REVIEW"],
        },
        {
            "ruleId": "RF142_UC_HIGH_RISK_MED_INTERRUPTION",
            "ruleVersion": "1.0.0",
            "humanReadableName": "High-risk medication interruption",
            "clinicalRationale": "Interrupting a high-risk medicine or essential supply raises urgent risk even without a hard-stop reaction signal.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_MED_INTERRUPTION_V1",
            "severityClass": "urgent_contributor",
            "dependencyGroupRef": "DG_142_RESULTS_MEDS_TIMING",
            "logLikelihoodWeight": 1.3,
            "criticalFeatureRefs": ["feature.meds.high_risk_supply_interruption"],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "latest_highest_assurance",
            "calibrationStratumRef": "STRATUM_142_MEDS_V1",
            "validityWindowRef": "WINDOW_142_SHORT_TERM_7D",
            "requestTypes": ["Meds"],
            "decisionPredicate": "high_risk_supply_interruption = true",
            "challengeCaseRefs": ["C142_THRESHOLD_URGENT_OVER"],
        },
        {
            "ruleId": "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Moderate persistent symptoms",
            "clinicalRationale": "Persistent symptoms without a hard stop should still stay visible for clinician review rather than quietly clearing.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_MODERATE_PERSISTENT_V1",
            "severityClass": "residual_contributor",
            "dependencyGroupRef": "DG_142_CARDIO_RESP_URGENT",
            "logLikelihoodWeight": 0.92,
            "criticalFeatureRefs": ["feature.symptoms.moderate_persistent_pattern"],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "latest_highest_assurance",
            "calibrationStratumRef": "STRATUM_142_SYMPTOMS_V1",
            "validityWindowRef": "WINDOW_142_SHORT_TERM_7D",
            "requestTypes": ["Symptoms"],
            "decisionPredicate": "moderate_persistent_pattern = true",
            "challengeCaseRefs": ["C142_THRESHOLD_URGENT_UNDER", "C142_CRITICAL_MISSINGNESS_REVIEW_HOLD"],
        },
        {
            "ruleId": "RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Result follow-up is unclear but not immediately urgent",
            "clinicalRationale": "Results work with unclear instructions or unresolved significance should stay in clinician review even when urgent diversion is false.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_RESULTS_REVIEW_V1",
            "severityClass": "residual_contributor",
            "dependencyGroupRef": "DG_142_RESULTS_MEDS_TIMING",
            "logLikelihoodWeight": 0.88,
            "criticalFeatureRefs": ["feature.results.unclear_follow_up_instruction"],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_ADMIN_RESULTS_V1",
            "validityWindowRef": "WINDOW_142_RESULTS_30D",
            "requestTypes": ["Results"],
            "decisionPredicate": "unclear_follow_up_instruction = true",
            "challengeCaseRefs": ["C142_RESULTS_RESIDUAL_REVIEW"],
        },
        {
            "ruleId": "RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM",
            "ruleVersion": "1.0.0",
            "humanReadableName": "Time-dependent admin work with clinical dependency",
            "clinicalRationale": "Admin work with a same-day or date-critical clinical dependency should be reviewed rather than cleared silently.",
            "owningApprover": "ROLE_TRIAGE_RULESET_OWNER",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_ADMIN_CLINICAL_FORM_V1",
            "severityClass": "residual_contributor",
            "dependencyGroupRef": "DG_142_RESULTS_MEDS_TIMING",
            "logLikelihoodWeight": 0.76,
            "criticalFeatureRefs": ["feature.admin.clinically_timed_form"],
            "missingnessMode": "ignore",
            "contradictionMode": "latest_highest_assurance",
            "calibrationStratumRef": "STRATUM_142_ADMIN_RESULTS_V1",
            "validityWindowRef": "WINDOW_142_RESULTS_30D",
            "requestTypes": ["Admin"],
            "decisionPredicate": "clinically_timed_form = true",
            "challengeCaseRefs": ["C142_SAFE_RECEIPT_CLEAR"],
        },
        {
            "ruleId": "RF142_RCH_NO_SAFE_CALLBACK_WINDOW",
            "ruleVersion": "1.0.0",
            "humanReadableName": "No safe callback window for urgent follow-up",
            "clinicalRationale": "A reachability gap does not create urgent advice by itself, but it must raise the same-day review posture and can contribute to urgent action when other signals exist.",
            "owningApprover": "ROLE_MANUFACTURER_CSO",
            "effectiveDate": CAPTURED_ON,
            "testFixtureSet": "TFS_142_REACHABILITY_V1",
            "severityClass": "reachability_contributor",
            "dependencyGroupRef": "DG_142_REACHABILITY",
            "logLikelihoodWeight": 0.7,
            "criticalFeatureRefs": ["feature.contact.no_safe_callback_window"],
            "missingnessMode": "conservative_hold",
            "contradictionMode": "require_resolution",
            "calibrationStratumRef": "STRATUM_142_GLOBAL_FALLBACK_V1",
            "validityWindowRef": "WINDOW_142_SHORT_TERM_7D",
            "requestTypes": ["Symptoms", "Meds", "Admin", "Results"],
            "decisionPredicate": "no_safe_callback_window = true",
            "challengeCaseRefs": ["C142_CRITICAL_MISSINGNESS_REVIEW_HOLD"],
        },
    ]


def build_decision_tables(rules: list[dict[str, Any]]) -> dict[str, Any]:
    by_family: dict[str, list[dict[str, Any]]] = {
        "hard_stop": [],
        "urgent_contributor": [],
        "residual_contributor": [],
        "reachability_contributor": [],
    }
    for rule in rules:
        by_family[rule["severityClass"]].append(rule)

    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "rulePackId": RULE_PACK_ID,
        "rulePackVersion": RULE_PACK_VERSION,
        "visualMode": VISUAL_MODE,
        "decisionTableFormatNote": DECISION_TABLE_FORMAT_NOTE,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "upstreamInputs": UPSTREAM_INPUTS,
        "frozenOutcomeStates": [
            "urgent_diversion_required",
            "urgent_diverted",
            "screen_clear",
            "residual_risk_flagged",
        ],
        "submitOutcomeStates": [
            "urgent_diversion",
            "triage_ready",
            "failed_safe",
        ],
        "fourPassAlgorithm": {
            "passes": FOUR_PASS_ALGORITHM,
            "formulas": {
                "zU": "beta_U + sum_g min(C_g^U, sum_{r in G_g^U} I_r(S) * lambda_r) + beta_kU * kappa_U(S) + beta_mU * m_crit(S)",
                "zR": "beta_R + sum_g min(C_g^R, sum_{r in G_g^R} I_r(S) * lambda_r) + beta_kR * kappa_R(S) + beta_cR * c_crit(S) + beta_mR * m_crit(S)",
                "pU": "g_U(sigma(z_U(S)))",
                "pR": "g_R(sigma(z_R(S)))",
            },
        },
        "decisionBoundary": {
            "hardStopDominance": True,
            "urgentCondition": "any_hard_stop = true or p_U(S) >= theta_U",
            "residualCondition": "urgent = false and (p_R(S) >= theta_R or c_crit(S) >= theta_conf or m_crit(S) >= theta_miss)",
            "screenClearCondition": "urgent = false and residual = false",
            "thresholds": THRESHOLDS,
        },
        "calibrationPolicy": {
            "identityMapRequiredWhenDataInsufficient": True,
            "promotedCalibratorType": "isotonic_regression_only_after_governed_diagnostics",
            "diagnosticsPublishedPerStratum": [
                "urgent sensitivity at theta_U",
                "review capture at theta_R",
                "Brier score",
                "calibration intercept",
                "calibration slope",
            ],
        },
        "dependencyGroups": DEPENDENCY_GROUPS,
        "calibrationStrata": CALIBRATION_STRATA,
        "validityWindows": VALIDITY_WINDOWS,
        "hardStopRules": by_family["hard_stop"],
        "urgentContributorRules": by_family["urgent_contributor"],
        "residualContributorRules": by_family["residual_contributor"],
        "reachabilityContributorRules": by_family["reachability_contributor"],
        "stateMachine": {
            "safetyStateAxis": [
                "not_screened",
                "screen_clear",
                "residual_risk_flagged",
                "urgent_diversion_required",
                "urgent_diverted",
            ],
            "urgentIssuanceLaw": {
                "requestedState": "urgent_diversion_required",
                "issuedState": "urgent_diverted",
                "requiresSettlementObject": "UrgentDiversionSettlement",
                "transitionRequirement": "settlementState = issued",
            },
            "failedSafeLaw": {
                "submitSettlementResult": "failed_safe",
                "summarySafetyTier": "processing_failed",
                "routineFlowMayContinue": False,
            },
        },
        "gapResolutions": GAP_RESOLUTIONS,
        "assumptions": ASSUMPTIONS,
        "risks": RISKS,
        "conflicts": CONFLICTS,
    }


def build_copy_contract() -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "generatedAt": now_iso(),
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "outcomeCopyContractId": OUTCOME_COPY_CONTRACT_ID,
        "rulePackRef": RULE_PACK_ID,
        "artifactSchemaRef": ARTIFACT_SCHEMA_REF,
        "submitSettlementSchemaRef": SUBMIT_SETTLEMENT_SCHEMA_REF,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "forbiddenValidationTonePhrases": FORBIDDEN_VALIDATION_TONE,
        "stateMachine": {
            "safetyStates": ["screen_clear", "residual_risk_flagged", "urgent_diversion_required", "urgent_diverted"],
            "submitResults": ["triage_ready", "urgent_diversion", "failed_safe"],
            "transitionRules": [
                "urgent_diversion_required may render immediately after SafetyDecisionRecord settles urgent, but urgent_diverted is forbidden until UrgentDiversionSettlement(settlementState = issued).",
                "screen_clear and residual_risk_flagged both render through safe receipt grammar, but residual_risk_flagged must keep review-sensitive wording.",
                "failed_safe is a settlement/result posture, not a calm receipt alias and not a field-validation state.",
            ],
        },
        "copyFamilies": [
            {
                "outcomeFamily": "safe_receipt",
                "deckId": "normal_safe_submission",
                "artifactPresentationContractRef": "APC_142_SAFE_RECEIPT_V1",
                "outboundNavigationGrantPolicyRef": "ONG_142_SAFE_RECEIPT_V1",
                "routePattern": "/intake/requests/:requestPublicId/receipt",
                "variants": [
                    {
                        "variantRef": "COPYVAR_142_SAFE_CLEAR_V1",
                        "appliesToState": "screen_clear",
                        "summarySafetyTier": "routine_clear",
                        "submitResult": "triage_ready",
                        "focusTarget": "outcome_title",
                        "primaryAction": {"actionId": "open_request_status", "label": "View request status"},
                        "secondaryAction": {"actionId": "return_to_home", "label": "Back to home"},
                        "title": "Your request has been sent",
                        "summary": "We have placed your request in the routine review path.",
                        "supportingBullets": [
                            "Use the reference code if you need to contact the practice.",
                            "The status page will update in the same shell when new information is ready.",
                        ],
                        "liveRegionMessage": "Your request has been sent. You can now view the status.",
                        "forbiddenPhrases": ["call 999 now", "fix the highlighted fields"],
                    },
                    {
                        "variantRef": "COPYVAR_142_SAFE_REVIEW_V1",
                        "appliesToState": "residual_risk_flagged",
                        "summarySafetyTier": "routine_recovery",
                        "submitResult": "triage_ready",
                        "focusTarget": "outcome_title",
                        "primaryAction": {"actionId": "open_request_status", "label": "View request status"},
                        "secondaryAction": {"actionId": "review_contact_preference", "label": "Check contact details"},
                        "title": "Your request has been sent for review",
                        "summary": "A clinician will review the detail you sent before the routine next step is chosen.",
                        "supportingBullets": [
                            "Keep your phone available if you asked us to contact you today.",
                            "The status page will continue to show the same request lineage.",
                        ],
                        "liveRegionMessage": "Your request has been sent for review.",
                        "forbiddenPhrases": ["call 999 now", "please correct the errors above"],
                    },
                ],
            },
            {
                "outcomeFamily": "urgent_diversion",
                "deckId": "urgent_diversion",
                "artifactPresentationContractRef": "APC_142_URGENT_DIVERSION_V1",
                "outboundNavigationGrantPolicyRef": "ONG_142_URGENT_DIVERSION_V1",
                "routePattern": "/intake/requests/:requestPublicId/urgent-guidance",
                "variants": [
                    {
                        "variantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
                        "appliesToState": "urgent_diversion_required",
                        "summarySafetyTier": "urgent_diversion_required",
                        "submitResult": "urgent_diversion",
                        "requiresUrgentSettlementIssued": False,
                        "focusTarget": "primary_action",
                        "primaryAction": {"actionId": "call_999_now", "label": "Call 999 now"},
                        "secondaryAction": {"actionId": "view_urgent_guidance", "label": "Read the urgent guidance"},
                        "title": "Get urgent help now",
                        "summary": "This request cannot stay in the routine queue.",
                        "supportingBullets": [
                            "Call 999 now if the person is in immediate danger, has severe chest pain, or is struggling to breathe.",
                            "If you cannot call yourself, ask someone nearby to help you now.",
                        ],
                        "liveRegionMessage": "Urgent help is needed now. This request cannot stay in the routine queue.",
                        "forbiddenPhrases": FORBIDDEN_VALIDATION_TONE + ["we will review this later", "try again later"],
                    },
                    {
                        "variantRef": "COPYVAR_142_URGENT_ISSUED_V1",
                        "appliesToState": "urgent_diverted",
                        "summarySafetyTier": "urgent_diversion_required",
                        "submitResult": "urgent_diversion",
                        "requiresUrgentSettlementIssued": True,
                        "focusTarget": "primary_action",
                        "primaryAction": {"actionId": "open_urgent_guidance", "label": "Open urgent guidance"},
                        "secondaryAction": {"actionId": "review_handoff_reason", "label": "See why we changed the path"},
                        "title": "Urgent guidance has been issued",
                        "summary": "We have switched this request to the urgent pathway and recorded that change.",
                        "supportingBullets": [
                            "Use the urgent guidance now. Do not wait for a routine reply.",
                            "The urgent pathway stays attached to the same request lineage for audit and continuity.",
                        ],
                        "liveRegionMessage": "Urgent guidance has been issued for this request.",
                        "forbiddenPhrases": FORBIDDEN_VALIDATION_TONE + ["your request has been sent"],
                    },
                ],
            },
            {
                "outcomeFamily": "failed_safe",
                "deckId": "safety_processing_failure",
                "artifactPresentationContractRef": "APC_142_FAILED_SAFE_V1",
                "outboundNavigationGrantPolicyRef": "ONG_142_FAILED_SAFE_V1",
                "routePattern": "/intake/drafts/:draftPublicId/recovery",
                "variants": [
                    {
                        "variantRef": "COPYVAR_142_FAILED_SAFE_V1",
                        "appliesToState": "processing_failed",
                        "summarySafetyTier": "processing_failed",
                        "submitResult": "failed_safe",
                        "focusTarget": "primary_action",
                        "primaryAction": {"actionId": "call_practice_now", "label": "Call the practice now"},
                        "secondaryAction": {"actionId": "keep_saved_copy", "label": "Keep this draft open"},
                        "title": "We could not safely complete this online",
                        "summary": "Your details are still available, but this request was not placed in the routine queue.",
                        "supportingBullets": [
                            "Call the practice now so a person can decide the next safe step.",
                            "If the problem is getting worse, use urgent help instead of waiting.",
                        ],
                        "liveRegionMessage": "We could not safely complete this online. Call the practice now.",
                        "forbiddenPhrases": ["your request has been sent", "fix the highlighted fields", "we will review this later"],
                    }
                ],
            },
        ],
        "gapResolutions": GAP_RESOLUTIONS,
        "assumptions": ASSUMPTIONS,
        "risks": RISKS,
        "conflicts": CONFLICTS,
    }


def build_challenge_cases() -> list[dict[str, Any]]:
    return [
        {
            "challengeCaseId": "C142_URGENT_CHEST_PAIN",
            "label": "Acute chest pain with worsening breathing symptoms",
            "requestType": "Symptoms",
            "challengeTags": ["hard_stop", "same_shell_urgent", "pathway_change"],
            "submittedFeatureVector": {
                "feature.symptoms.chest_breathing_selected": True,
                "feature.symptoms.acute_distress_signal": True,
                "feature.symptoms.worsening_now": True,
                "feature.symptoms.onset_within_72h": True,
            },
            "cCrit": 0.04,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_ACUTE_CHEST_BREATHING"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.93,
            "expectedPR": 0.21,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_URGENT_STROKE_SIGNAL",
            "label": "Stroke-like symptoms reported in the structured symptom path",
            "requestType": "Symptoms",
            "challengeTags": ["hard_stop"],
            "submittedFeatureVector": {
                "feature.symptoms.stroke_like_signal": True,
                "feature.symptoms.current_clinical_symptoms_present": True,
            },
            "cCrit": 0.03,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_STROKE_COLLAPSE_OR_SEIZURE"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.95,
            "expectedPR": 0.18,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_URGENT_MED_REACTION",
            "label": "Medication reaction with airway compromise",
            "requestType": "Meds",
            "challengeTags": ["hard_stop"],
            "submittedFeatureVector": {
                "feature.meds.reaction_airway_compromise": True,
                "feature.symptoms.anaphylaxis_pattern": True,
            },
            "cCrit": 0.05,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.94,
            "expectedPR": 0.22,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_URGENT_HEAVY_BLEEDING",
            "label": "Heavy bleeding signal",
            "requestType": "Symptoms",
            "challengeTags": ["hard_stop"],
            "submittedFeatureVector": {
                "feature.symptoms.heavy_bleeding_signal": True,
            },
            "cCrit": 0.05,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.91,
            "expectedPR": 0.19,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_URGENT_SELF_HARM_SIGNAL",
            "label": "Self-harm or safeguarding danger",
            "requestType": "Admin",
            "challengeTags": ["hard_stop"],
            "submittedFeatureVector": {
                "feature.symptoms.self_harm_signal": True,
            },
            "cCrit": 0.06,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.92,
            "expectedPR": 0.24,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_THRESHOLD_URGENT_OVER",
            "label": "Soft urgent contributors push above theta_U",
            "requestType": "Meds",
            "challengeTags": ["threshold_boundary", "soft_score"],
            "submittedFeatureVector": {
                "feature.symptoms.severe_pain_escalation": True,
                "feature.symptoms.rapid_worsening_recent_onset": True,
                "feature.meds.high_risk_supply_interruption": True,
            },
            "cCrit": 0.12,
            "mCrit": 0.08,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [
                "RF142_UC_SEVERE_PAIN_ESCALATION",
                "RF142_UC_RAPID_WORSENING_RECENT_ONSET",
                "RF142_UC_HIGH_RISK_MED_INTERRUPTION",
            ],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.101,
            "expectedPR": 0.244,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_THRESHOLD_URGENT_UNDER",
            "label": "Urgent score stays below theta_U but review threshold trips",
            "requestType": "Symptoms",
            "challengeTags": ["threshold_boundary", "residual_review"],
            "submittedFeatureVector": {
                "feature.symptoms.rapid_worsening_recent_onset": True,
                "feature.symptoms.moderate_persistent_pattern": True,
            },
            "cCrit": 0.22,
            "mCrit": 0.12,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": ["RF142_UC_RAPID_WORSENING_RECENT_ONSET"],
            "expectedSoftResidualHits": ["RF142_RC_MODERATE_PERSISTENT_SYMPTOMS"],
            "expectedPU": 0.079,
            "expectedPR": 0.334,
            "expectedRequestedSafetyState": "residual_risk_flagged",
            "expectedSubmitResult": "triage_ready",
            "expectedCopyVariantRef": "COPYVAR_142_SAFE_REVIEW_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
        {
            "challengeCaseId": "C142_RESULTS_RESIDUAL_REVIEW",
            "label": "Result question remains review-sensitive without urgent trigger",
            "requestType": "Results",
            "challengeTags": ["residual_review"],
            "submittedFeatureVector": {
                "feature.results.high_risk_result_query": True,
                "feature.results.unclear_follow_up_instruction": True,
                "feature.symptoms.current_clinical_symptoms_present": False,
            },
            "cCrit": 0.18,
            "mCrit": 0.1,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": ["RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP"],
            "expectedPU": 0.061,
            "expectedPR": 0.311,
            "expectedRequestedSafetyState": "residual_risk_flagged",
            "expectedSubmitResult": "triage_ready",
            "expectedCopyVariantRef": "COPYVAR_142_SAFE_REVIEW_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
        {
            "challengeCaseId": "C142_SAFE_RECEIPT_CLEAR",
            "label": "Routine admin request stays screen_clear",
            "requestType": "Admin",
            "challengeTags": ["screen_clear"],
            "submittedFeatureVector": {
                "feature.admin.clinically_timed_form": False,
            },
            "cCrit": 0.05,
            "mCrit": 0.0,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.012,
            "expectedPR": 0.071,
            "expectedRequestedSafetyState": "screen_clear",
            "expectedSubmitResult": "triage_ready",
            "expectedCopyVariantRef": "COPYVAR_142_SAFE_CLEAR_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
        {
            "challengeCaseId": "C142_DEGRADED_ATTACHMENT_FAIL_CLOSED",
            "label": "Unreadable attachment leaves safety meaning unresolved",
            "requestType": "Symptoms",
            "challengeTags": ["degraded_attachment", "failed_safe"],
            "submittedFeatureVector": {
                "feature.attachment.unreadable_clinical_meaning": True,
                "feature.symptoms.current_clinical_symptoms_present": True,
            },
            "cCrit": 0.41,
            "mCrit": 0.66,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": None,
            "expectedPR": None,
            "expectedRequestedSafetyState": None,
            "expectedSubmitResult": "failed_safe",
            "expectedCopyVariantRef": "COPYVAR_142_FAILED_SAFE_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
        {
            "challengeCaseId": "C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP",
            "label": "Low-assurance contradictory evidence may not clear a hard stop",
            "requestType": "Symptoms",
            "challengeTags": ["contradiction", "hard_stop"],
            "submittedFeatureVector": {
                "feature.symptoms.chest_breathing_selected": True,
                "feature.symptoms.acute_distress_signal": True,
                "feature.low_assurance_conflict.present": True,
            },
            "cCrit": 0.63,
            "mCrit": 0.07,
            "expectedHardStopHits": ["RF142_HS_ACUTE_CHEST_BREATHING"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.9,
            "expectedPR": 0.29,
            "expectedRequestedSafetyState": "urgent_diversion_required",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_REQUIRED_V1",
            "urgentDiversionSettlementState": "pending",
        },
        {
            "challengeCaseId": "C142_CRITICAL_MISSINGNESS_REVIEW_HOLD",
            "label": "Critical missingness holds the case at residual review",
            "requestType": "Symptoms",
            "challengeTags": ["critical_missingness", "residual_review"],
            "submittedFeatureVector": {
                "feature.contact.no_safe_callback_window": True,
                "feature.symptoms.moderate_persistent_pattern": True,
                "feature.symptoms.required_red_flag_feature_missing": True,
            },
            "cCrit": 0.28,
            "mCrit": 0.82,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [
                "RF142_RC_MODERATE_PERSISTENT_SYMPTOMS",
                "RF142_RCH_NO_SAFE_CALLBACK_WINDOW",
            ],
            "expectedPU": 0.044,
            "expectedPR": 0.24,
            "expectedRequestedSafetyState": "residual_risk_flagged",
            "expectedSubmitResult": "triage_ready",
            "expectedCopyVariantRef": "COPYVAR_142_SAFE_REVIEW_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
        {
            "challengeCaseId": "C142_URGENT_ISSUED_AFTER_SETTLEMENT",
            "label": "Urgent issued variant is legal only after settlement",
            "requestType": "Symptoms",
            "challengeTags": ["urgent_issued"],
            "submittedFeatureVector": {
                "feature.symptoms.chest_breathing_selected": True,
                "feature.symptoms.acute_distress_signal": True,
            },
            "cCrit": 0.04,
            "mCrit": 0.0,
            "expectedHardStopHits": ["RF142_HS_ACUTE_CHEST_BREATHING"],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": 0.93,
            "expectedPR": 0.21,
            "expectedRequestedSafetyState": "urgent_diverted",
            "expectedSubmitResult": "urgent_diversion",
            "expectedCopyVariantRef": "COPYVAR_142_URGENT_ISSUED_V1",
            "urgentDiversionSettlementState": "issued",
        },
        {
            "challengeCaseId": "C142_ENGINE_TIMEOUT_FAILED_SAFE",
            "label": "Engine timeout or stale runtime truth fails safely",
            "requestType": "Results",
            "challengeTags": ["engine_failure", "failed_safe"],
            "submittedFeatureVector": {
                "feature.runtime.safety_engine_timeout": True,
            },
            "cCrit": 0.33,
            "mCrit": 0.71,
            "expectedHardStopHits": [],
            "expectedSoftUrgentHits": [],
            "expectedSoftResidualHits": [],
            "expectedPU": None,
            "expectedPR": None,
            "expectedRequestedSafetyState": None,
            "expectedSubmitResult": "failed_safe",
            "expectedCopyVariantRef": "COPYVAR_142_FAILED_SAFE_V1",
            "urgentDiversionSettlementState": "not_applicable",
        },
    ]


def build_rule_pack_schema(example: dict[str, Any]) -> dict[str, Any]:
    rule_required = [
        "ruleId",
        "ruleVersion",
        "humanReadableName",
        "clinicalRationale",
        "owningApprover",
        "effectiveDate",
        "testFixtureSet",
        "severityClass",
        "dependencyGroupRef",
        "logLikelihoodWeight",
        "criticalFeatureRefs",
        "missingnessMode",
        "contradictionMode",
        "calibrationStratumRef",
        "validityWindowRef",
    ]
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/red-flag-rule-pack.schema.json",
        "title": "RedFlagRulePack",
        "description": "Authored, rules-first synchronous safety pack for the Phase 1 submit gate.",
        "type": "object",
        "required": [
            "taskId",
            "generatedAt",
            "capturedOn",
            "rulePackId",
            "rulePackVersion",
            "visualMode",
            "sourcePrecedence",
            "frozenOutcomeStates",
            "submitOutcomeStates",
            "fourPassAlgorithm",
            "decisionBoundary",
            "calibrationPolicy",
            "dependencyGroups",
            "calibrationStrata",
            "validityWindows",
            "hardStopRules",
            "urgentContributorRules",
            "residualContributorRules",
            "reachabilityContributorRules",
            "stateMachine",
        ],
        "properties": {
            "taskId": {"const": TASK_ID},
            "generatedAt": {"type": "string", "format": "date-time"},
            "capturedOn": {"type": "string"},
            "rulePackId": {"type": "string"},
            "rulePackVersion": {"type": "string"},
            "visualMode": {"const": VISUAL_MODE},
            "decisionTableFormatNote": {"type": "string"},
            "sourcePrecedence": {"type": "array", "items": {"type": "string"}, "minItems": 8},
            "upstreamInputs": {"type": "array", "items": {"type": "string"}},
            "frozenOutcomeStates": {"type": "array", "items": {"type": "string"}},
            "submitOutcomeStates": {"type": "array", "items": {"type": "string"}},
            "fourPassAlgorithm": {
                "type": "object",
                "required": ["passes", "formulas"],
                "properties": {
                    "passes": {"type": "array", "items": {"type": "string"}, "minItems": 4},
                    "formulas": {"type": "object"},
                },
            },
            "decisionBoundary": {"type": "object"},
            "calibrationPolicy": {"type": "object"},
            "dependencyGroups": {"type": "array", "items": {"type": "object"}, "minItems": 3},
            "calibrationStrata": {"type": "array", "items": {"type": "object"}, "minItems": 2},
            "validityWindows": {"type": "array", "items": {"type": "object"}, "minItems": 2},
            "hardStopRules": {"type": "array", "items": {"$ref": "#/$defs/rule"}, "minItems": 1},
            "urgentContributorRules": {"type": "array", "items": {"$ref": "#/$defs/rule"}, "minItems": 1},
            "residualContributorRules": {"type": "array", "items": {"$ref": "#/$defs/rule"}, "minItems": 1},
            "reachabilityContributorRules": {"type": "array", "items": {"$ref": "#/$defs/rule"}, "minItems": 1},
            "stateMachine": {"type": "object"},
            "gapResolutions": {"type": "array", "items": {"type": "object"}},
            "assumptions": {"type": "array", "items": {"type": "object"}},
            "risks": {"type": "array", "items": {"type": "object"}},
            "conflicts": {"type": "array", "items": {"type": "object"}},
        },
        "$defs": {
            "rule": {
                "type": "object",
                "required": rule_required,
                "properties": {
                    "ruleId": {"type": "string"},
                    "ruleVersion": {"type": "string"},
                    "humanReadableName": {"type": "string"},
                    "clinicalRationale": {"type": "string"},
                    "owningApprover": {"type": "string"},
                    "effectiveDate": {"type": "string"},
                    "testFixtureSet": {"type": "string"},
                    "severityClass": {
                        "type": "string",
                        "enum": [
                            "hard_stop",
                            "urgent_contributor",
                            "residual_contributor",
                            "reachability_contributor",
                        ],
                    },
                    "dependencyGroupRef": {"type": "string"},
                    "logLikelihoodWeight": {"type": "number"},
                    "criticalFeatureRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                    "missingnessMode": {"type": "string", "enum": ["ignore", "conservative_hold", "urgent_review"]},
                    "contradictionMode": {
                        "type": "string",
                        "enum": ["require_resolution", "clinician_override_only", "latest_highest_assurance"],
                    },
                    "calibrationStratumRef": {"type": "string"},
                    "validityWindowRef": {"type": "string"},
                    "requestTypes": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                    "decisionPredicate": {"type": "string"},
                    "dominatesSoftScore": {"type": "boolean"},
                    "challengeCaseRefs": {"type": "array", "items": {"type": "string"}},
                },
            }
        },
        "examples": [example],
    }


def build_rule_coverage_rows(rules: list[dict[str, Any]], challenge_cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    case_map = {case["challengeCaseId"]: case for case in challenge_cases}
    rows: list[dict[str, Any]] = []
    for rule in rules:
        refs = rule["challengeCaseRefs"]
        tags = {tag for ref in refs for tag in case_map[ref]["challengeTags"]}
        rows.append(
            {
                "ruleId": rule["ruleId"],
                "severityClass": rule["severityClass"],
                "requestTypes": "|".join(rule["requestTypes"]),
                "dependencyGroupRef": rule["dependencyGroupRef"],
                "calibrationStratumRef": rule["calibrationStratumRef"],
                "challengeCaseCount": len(refs),
                "challengeCaseRefs": "|".join(refs),
                "thresholdBoundaryCovered": "yes" if "threshold_boundary" in tags else "n/a",
                "degradedAttachmentCovered": "yes" if "degraded_attachment" in tags else "n/a",
                "contradictionCovered": "yes" if "contradiction" in tags else "n/a",
                "criticalMissingnessCovered": "yes" if "critical_missingness" in tags else "n/a",
                "coverageStatus": "covered",
            }
        )
    return rows


def build_atlas_model(decision_tables: dict[str, Any], copy_contract: dict[str, Any], challenge_cases: list[dict[str, Any]], coverage_rows: list[dict[str, Any]]) -> dict[str, Any]:
    variant_map = {
        variant["variantRef"]: {
            **variant,
            "outcomeFamily": family["outcomeFamily"],
            "deckId": family["deckId"],
            "artifactPresentationContractRef": family["artifactPresentationContractRef"],
            "outboundNavigationGrantPolicyRef": family["outboundNavigationGrantPolicyRef"],
            "routePattern": family["routePattern"],
        }
        for family in copy_contract["copyFamilies"]
        for variant in family["variants"]
    }

    scenario_ids = [
        "C142_SAFE_RECEIPT_CLEAR",
        "C142_RESULTS_RESIDUAL_REVIEW",
        "C142_URGENT_CHEST_PAIN",
        "C142_URGENT_ISSUED_AFTER_SETTLEMENT",
        "C142_DEGRADED_ATTACHMENT_FAIL_CLOSED",
    ]
    scenario_labels = {
        "C142_SAFE_RECEIPT_CLEAR": "Safe receipt",
        "C142_RESULTS_RESIDUAL_REVIEW": "Residual review",
        "C142_URGENT_CHEST_PAIN": "Urgent required",
        "C142_URGENT_ISSUED_AFTER_SETTLEMENT": "Urgent issued",
        "C142_DEGRADED_ATTACHMENT_FAIL_CLOSED": "Failed-safe recovery",
    }
    case_map = {case["challengeCaseId"]: case for case in challenge_cases}

    scenarios = []
    for scenario_id in scenario_ids:
        case = case_map[scenario_id]
        variant = variant_map[case["expectedCopyVariantRef"]]
        scenarios.append(
            {
                "scenarioId": scenario_id,
                "label": scenario_labels[scenario_id],
                "requestType": case["requestType"],
                "title": variant["title"],
                "summary": variant["summary"],
                "supportingBullets": variant["supportingBullets"],
                "primaryAction": variant["primaryAction"],
                "secondaryAction": variant["secondaryAction"],
                "focusTarget": variant["focusTarget"],
                "outcomeFamily": variant["outcomeFamily"],
                "submitResult": variant["submitResult"],
                "summarySafetyTier": variant["summarySafetyTier"],
                "requestedSafetyState": case["expectedRequestedSafetyState"] or "not_settled",
                "urgentDiversionSettlementState": case["urgentDiversionSettlementState"],
                "ruleHits": case["expectedHardStopHits"] + case["expectedSoftUrgentHits"] + case["expectedSoftResidualHits"],
                "pUrgent": case["expectedPU"],
                "pResidual": case["expectedPR"],
                "challengeTags": case["challengeTags"],
                "liveRegionMessage": variant["liveRegionMessage"],
                "artifactPresentationContractRef": variant["artifactPresentationContractRef"],
                "outboundNavigationGrantPolicyRef": variant["outboundNavigationGrantPolicyRef"],
                "routePattern": variant["routePattern"],
                "forbiddenPhrases": variant["forbiddenPhrases"],
            }
        )

    rule_family_visuals = [
        {
            "family": "hard_stop",
            "title": "Hard-stop rules",
            "accent": "#B42318",
            "count": len(decision_tables["hardStopRules"]),
            "meaning": "Dominant urgent triggers. Never softened by scores.",
        },
        {
            "family": "urgent_contributor",
            "title": "Urgent contributors",
            "accent": "#D65F1F",
            "count": len(decision_tables["urgentContributorRules"]),
            "meaning": "Weighted urgent factors that may cross theta_U when hard stops stay silent.",
        },
        {
            "family": "residual_contributor",
            "title": "Residual contributors",
            "accent": "#117A55",
            "count": len(decision_tables["residualContributorRules"]),
            "meaning": "Review-holding signals that keep the case visible without urgent diversion.",
        },
        {
            "family": "reachability_contributor",
            "title": "Reachability contributors",
            "accent": "#5B61F6",
            "count": len(decision_tables["reachabilityContributorRules"]),
            "meaning": "Contact-safety gaps that influence urgent or residual posture without redefining clinical evidence.",
        },
    ]

    ladder = [
        {
            "ladderStepId": "submitted",
            "label": "Submitted",
            "detail": "SubmissionPromotionRecord commits and request.submitted is durable.",
        },
        {
            "ladderStepId": "classified",
            "label": "Evidence classified",
            "detail": "EvidenceClassificationDecision freezes dominant class and fail-closed misclassification posture.",
        },
        {
            "ladderStepId": "preempted",
            "label": "Safety preemption open",
            "detail": "SafetyPreemptionRecord blocks routine continuation while the current epoch is pending.",
        },
        {
            "ladderStepId": "decision_settled",
            "label": "SafetyDecisionRecord settled",
            "detail": "Rules and calibrated scores choose urgent_diversion_required, residual_risk_flagged, or screen_clear.",
        },
        {
            "ladderStepId": "urgent_required",
            "label": "Urgent required",
            "detail": "Pathway changes immediately, but urgent_diverted remains forbidden until settlement issues.",
        },
        {
            "ladderStepId": "urgent_issued_or_receipt",
            "label": "Issued urgent guidance or calm receipt",
            "detail": "UrgentDiversionSettlement(issued) unlocks urgent_diverted; otherwise patient.receipt.issued drives the safe receipt.",
        },
    ]

    copy_rows = []
    for family in copy_contract["copyFamilies"]:
        for variant in family["variants"]:
            copy_rows.append(
                {
                    "variantRef": variant["variantRef"],
                    "family": family["outcomeFamily"],
                    "state": variant["appliesToState"],
                    "title": variant["title"],
                    "primaryActionLabel": variant["primaryAction"]["label"],
                    "summary": variant["summary"],
                }
            )

    return {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "capturedOn": CAPTURED_ON,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "scenarios": scenarios,
        "ruleFamilyVisuals": rule_family_visuals,
        "decisionLadder": ladder,
        "copyRows": copy_rows,
        "coverageRows": coverage_rows,
        "decisionBoundary": decision_tables["decisionBoundary"]["thresholds"],
        "gapResolutions": GAP_RESOLUTIONS,
    }


def render_rulebook_markdown(decision_tables: dict[str, Any]) -> str:
    rules = (
        decision_tables["hardStopRules"]
        + decision_tables["urgentContributorRules"]
        + decision_tables["residualContributorRules"]
        + decision_tables["reachabilityContributorRules"]
    )
    rule_rows = [
        [
            rule["ruleId"],
            rule["severityClass"],
            rule["humanReadableName"],
            ", ".join(rule["requestTypes"]),
            rule["dependencyGroupRef"],
            rule["missingnessMode"],
            rule["contradictionMode"],
        ]
        for rule in rules
    ]
    dependency_rows = [
        [
            group["dependencyGroupRef"],
            group["label"],
            str(group["capUrgent"]),
            str(group["capResidual"]),
        ]
        for group in DEPENDENCY_GROUPS
    ]
    return f"""# 142 Red-Flag Rulebook

This document is the human-readable rulebook for the machine-readable pack in [`../../data/contracts/142_red_flag_decision_tables.yaml`](../../data/contracts/142_red_flag_decision_tables.yaml).

## Section A — `Mock_now_execution`

- Freeze one exact, rule-first, explicit safety gate for the Phase 1 submit moment.
- Keep hard-stop dominance, fail-closed degraded-evidence handling, and urgent-required versus urgent-issued separation exact now.
- Use simulator-backed challenge cases only; do not imply live provider or live governance execution where that evidence does not yet exist.

## Section B — `Actual_production_strategy_later`

- Replace placeholder approver roles with named approvers without changing rule IDs, rule versions, state names, or outcome semantics.
- Add richer challenge data or non-identity calibrators only by superseding the same rule-pack contract and keeping the same public copy identifiers.

## Four-Pass Algorithm

1. {FOUR_PASS_ALGORITHM[0]}
2. {FOUR_PASS_ALGORITHM[1]}
3. {FOUR_PASS_ALGORITHM[2]}
4. {FOUR_PASS_ALGORITHM[3]}

The frozen decision boundary uses:

- `theta_U = {THRESHOLDS["urgent"]["thetaU"]}` from `C_FP^U = {THRESHOLDS["urgent"]["falsePositiveCost"]}` and `C_FN^U = {THRESHOLDS["urgent"]["falseNegativeCost"]}`
- `theta_R = {THRESHOLDS["residual"]["thetaR"]}` from `C_FP^R = {THRESHOLDS["residual"]["falsePositiveCost"]}` and `C_FN^R = {THRESHOLDS["residual"]["falseNegativeCost"]}`
- `theta_conf = {THRESHOLDS["contradictionThreshold"]}`
- `theta_miss = {THRESHOLDS["criticalMissingnessThreshold"]}`

Hard-stop rules always dominate. They may not be softened away by `p_U(S)` or `p_R(S)`.

## Canonical Contracts

- `SafetyPreemptionRecord` is the fail-closed guard that freezes routine continuation while the synchronous safety epoch is still unsettled.
- `SafetyDecisionRecord` is the immutable outcome of the four-pass safety engine and is the only source allowed to publish `screen_clear`, `residual_risk_flagged`, or `urgent_diversion_required`.
- `UrgentDiversionSettlement` is required before the public state may advance from `urgent_diversion_required` to `urgent_diverted`.
- `IntakeOutcomePresentationArtifact` binds every patient-facing outcome card to one exact rendered surface.
- `ArtifactPresentationContract` governs how the safe receipt, urgent diversion, or `processing_failed` recovery artifact is presented.
- `OutboundNavigationGrant` governs any cross-app urgent handoff so pathway change links remain explicit, revocable, and non-spoofable.

## Frozen Rule Metadata

{markdown_table(
    ["Rule ID", "Severity", "Name", "Request types", "Dependency group", "Missingness", "Contradiction"],
    rule_rows,
)}

## Dependency Group Caps

{markdown_table(
    ["Dependency group", "Meaning", "Urgent cap", "Residual cap"],
    dependency_rows,
)}

## Calibration Policy

- Identity calibrators are mandatory until each stratum meets the authored graduation rule.
- Promoted calibrators must publish urgent sensitivity, review capture, Brier score, calibration intercept, and calibration slope on the held-out challenge set.
- `urgent_diversion_required` is the only legal urgent state immediately after `SafetyDecisionRecord` settles.
- `urgent_diverted` is illegal until `UrgentDiversionSettlement(settlementState = issued)` exists for the same request lineage.

## Gap Resolution Record

{json_block(GAP_RESOLUTIONS)}

## Assumptions, Risks, And Conflicts

### Assumptions

{json_block(ASSUMPTIONS)}

### Risks

{json_block(RISKS)}

### Conflicts

{json_block(CONFLICTS)}
"""


def render_decision_tables_markdown(decision_tables: dict[str, Any], challenge_cases: list[dict[str, Any]]) -> str:
    def rows_for(rule_rows: list[dict[str, Any]]) -> list[list[str]]:
        return [
            [
                rule["ruleId"],
                rule["humanReadableName"],
                rule["decisionPredicate"],
                rule["dependencyGroupRef"],
                "|".join(rule["challengeCaseRefs"]),
            ]
            for rule in rule_rows
        ]

    case_rows = [
        [
            case["challengeCaseId"],
            case["requestType"],
            ",".join(case["challengeTags"]),
            str(case["expectedRequestedSafetyState"] or "none"),
            case["expectedSubmitResult"],
            case["expectedCopyVariantRef"],
        ]
        for case in challenge_cases
    ]

    return f"""# 142 Red-Flag Decision Tables

This is the prose view of the machine-readable decision tables in [`../../data/contracts/142_red_flag_decision_tables.yaml`](../../data/contracts/142_red_flag_decision_tables.yaml).

## Hard-stop Rules

{markdown_table(
    ["Rule ID", "Name", "Predicate", "Dependency group", "Challenge cases"],
    rows_for(decision_tables["hardStopRules"]),
)}

## Urgent Contributor Rules

{markdown_table(
    ["Rule ID", "Name", "Predicate", "Dependency group", "Challenge cases"],
    rows_for(decision_tables["urgentContributorRules"]),
)}

## Residual Contributor Rules

{markdown_table(
    ["Rule ID", "Name", "Predicate", "Dependency group", "Challenge cases"],
    rows_for(decision_tables["residualContributorRules"]),
)}

## Reachability Contributor Rules

{markdown_table(
    ["Rule ID", "Name", "Predicate", "Dependency group", "Challenge cases"],
    rows_for(decision_tables["reachabilityContributorRules"]),
)}

## Challenge Corpus Overview

{markdown_table(
    ["Case", "Request type", "Tags", "Requested safety state", "Submit result", "Copy variant"],
    case_rows,
)}

## Decision Boundary Notes

- `screen_clear` is legal only after one settled immutable safety decision.
- degraded attachments, parser disagreement, or stale runtime truth may not collapse to `screen_clear`; they must fail closed through review or `failed_safe`.
- contradiction handling stays monotone: low-assurance contradictory evidence may not clear a fired hard stop.
"""


def render_copy_deck_markdown(copy_contract: dict[str, Any]) -> str:
    rows = []
    for family in copy_contract["copyFamilies"]:
        for variant in family["variants"]:
            rows.append(
                [
                    family["deckId"],
                    family["outcomeFamily"],
                    variant["appliesToState"],
                    variant["title"],
                    variant["primaryAction"]["label"],
                    variant["summary"],
                ]
            )

    urgent_variant = next(
        variant
        for family in copy_contract["copyFamilies"]
        if family["outcomeFamily"] == "urgent_diversion"
        for variant in family["variants"]
        if variant["variantRef"] == "COPYVAR_142_URGENT_REQUIRED_V1"
    )
    failed_variant = next(
        variant
        for family in copy_contract["copyFamilies"]
        if family["outcomeFamily"] == "failed_safe"
        for variant in family["variants"]
    )
    return f"""# 142 Urgent Diversion And Receipt Copy Deck

This deck freezes the patient-facing outcome grammar for the Phase 1 submit moment.

## Deck Comparison

{markdown_table(
    ["Deck", "Family", "State", "Headline", "Primary action", "Summary"],
    rows,
)}

## Urgent Tone Guardrails

- urgent diversion is a pathway change, not a validation or transport failure
- one dominant next action only
- no passive reassurance such as “we will review this later”
- no field-error language such as “fix the highlighted fields”

Urgent required headline:

> {urgent_variant["title"]}

Urgent required summary:

> {urgent_variant["summary"]}

## Failed-safe Tone Guardrails

- failed-safe preserves continuity and saved detail, but it does not imply successful submission
- failed-safe may direct the patient to call the practice or use urgent help; it may not borrow calm receipt wording

Failed-safe headline:

> {failed_variant["title"]}

Failed-safe summary:

> {failed_variant["summary"]}

## Shared Contract Notes

- Every family binds one `IntakeOutcomePresentationArtifact` and one `ArtifactPresentationContract`.
- External or cross-app urgent handoff must bind one `OutboundNavigationGrant`; raw URLs remain forbidden.
- `urgent_diverted` is legal only after `UrgentDiversionSettlement(settlementState = issued)`.
"""


def render_atlas_html(atlas: dict[str, Any]) -> str:
    atlas_json = json.dumps(atlas, indent=2)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>142 Urgent Pathway Atlas</title>
    <style>
      :root {{
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #F4F6F9;
        --text-strong: #0F1720;
        --text-default: #24313D;
        --text-muted: #5E6B78;
        --accent-urgent: #B42318;
        --accent-safe: #117A55;
        --accent-failed-safe: #B7791F;
        --accent-continuity: #5B61F6;
        --accent-focus: #2F6FED;
        --border: rgba(36, 49, 61, 0.14);
        --shadow-soft: 0 24px 60px rgba(15, 23, 32, 0.08);
      }}

      * {{
        box-sizing: border-box;
      }}

      html {{
        background: var(--canvas);
        color: var(--text-default);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}

      body {{
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(91, 97, 246, 0.08), transparent 26%),
          radial-gradient(circle at top right, rgba(180, 35, 24, 0.08), transparent 28%),
          var(--canvas);
      }}

      body.reduced-motion *,
      body.reduced-motion *::before,
      body.reduced-motion *::after {{
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }}

      .sr-only {{
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }}

      a {{
        color: inherit;
      }}

      .page {{
        width: min(100%, 1280px);
        margin: 0 auto;
        padding: 28px 24px 56px;
      }}

      header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 18px 0 22px;
      }}

      .brand {{
        display: flex;
        align-items: center;
        gap: 14px;
      }}

      .brand-mark {{
        width: 56px;
        height: 28px;
        border-radius: 999px;
        background: rgba(91, 97, 246, 0.12);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }}

      .brand-wordmark {{
        font-size: 14px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--text-muted);
      }}

      .header-copy h1 {{
        margin: 0;
        font-size: 30px;
        line-height: 36px;
        color: var(--text-strong);
      }}

      .header-copy p {{
        margin: 8px 0 0;
        max-width: 60ch;
        font-size: 16px;
        line-height: 24px;
      }}

      .summary-band {{
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }}

      .summary-band article {{
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 16px 18px;
      }}

      .summary-band h2 {{
        margin: 0 0 6px;
        font-size: 13px;
        line-height: 20px;
        color: var(--text-muted);
      }}

      .summary-band p {{
        margin: 0;
        font-size: 16px;
        line-height: 24px;
      }}

      .scenario-bar {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }}

      .scenario-button {{
        border: 1px solid rgba(36, 49, 61, 0.16);
        background: rgba(255, 255, 255, 0.9);
        color: var(--text-default);
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        font-size: 14px;
        line-height: 20px;
        cursor: pointer;
        transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
      }}

      .scenario-button[data-selected="true"] {{
        border-color: rgba(47, 111, 237, 0.36);
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
        background: rgba(47, 111, 237, 0.08);
      }}

      .scenario-button:focus-visible,
      .drawer-button:focus-visible,
      .action-button:focus-visible,
      .ghost-button:focus-visible {{
        outline: 2px solid var(--accent-focus);
        outline-offset: 2px;
      }}

      .shell-layout {{
        display: grid;
        grid-template-columns: minmax(0, 760px) minmax(280px, 1fr);
        gap: 22px;
        align-items: start;
      }}

      .shell-frame {{
        min-width: 0;
        background: var(--shell);
        border: 1px solid rgba(91, 97, 246, 0.08);
        border-radius: 32px;
        box-shadow: var(--shadow-soft);
        padding: 18px;
      }}

      .shell-frame-inner {{
        background: var(--panel);
        border-radius: 28px;
        padding: 22px;
        border: 1px solid rgba(36, 49, 61, 0.08);
      }}

      .frame-meta {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }}

      .frame-chip {{
        border-radius: 999px;
        background: rgba(91, 97, 246, 0.08);
        padding: 6px 10px;
        font-size: 13px;
        line-height: 20px;
        color: var(--text-muted);
      }}

      .outcome-card {{
        background: linear-gradient(180deg, rgba(244, 246, 249, 0.94), rgba(255, 255, 255, 0.98));
        border-radius: 24px;
        border: 1px solid rgba(36, 49, 61, 0.1);
        padding: 22px;
        min-height: 420px;
        transition: transform 140ms ease, box-shadow 180ms ease;
      }}

      .outcome-card[data-family="urgent_diversion"] {{
        border-color: rgba(180, 35, 24, 0.24);
        box-shadow: inset 0 1px 0 rgba(180, 35, 24, 0.06);
      }}

      .outcome-card[data-family="safe_receipt"] {{
        border-color: rgba(17, 122, 85, 0.22);
      }}

      .outcome-card[data-family="failed_safe"] {{
        border-color: rgba(183, 121, 31, 0.26);
      }}

      .card-kicker {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        line-height: 20px;
        margin-bottom: 16px;
      }}

      .card-kicker.urgent {{
        color: var(--accent-urgent);
        background: rgba(180, 35, 24, 0.08);
      }}

      .card-kicker.safe {{
        color: var(--accent-safe);
        background: rgba(17, 122, 85, 0.1);
      }}

      .card-kicker.failed {{
        color: var(--accent-failed-safe);
        background: rgba(183, 121, 31, 0.12);
      }}

      .outcome-card h2 {{
        margin: 0;
        font-size: 34px;
        line-height: 42px;
        color: var(--text-strong);
      }}

      .outcome-summary {{
        margin: 14px 0 16px;
        font-size: 16px;
        line-height: 24px;
        max-width: 54ch;
      }}

      .emergency-region {{
        border-radius: 20px;
        background: rgba(15, 23, 32, 0.03);
        border: 1px solid rgba(36, 49, 61, 0.08);
        padding: 14px;
        margin-bottom: 16px;
      }}

      .action-row {{
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 18px;
      }}

      .action-button,
      .ghost-button {{
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        font: inherit;
        font-size: 15px;
        line-height: 20px;
        cursor: pointer;
      }}

      .action-button {{
        background: var(--text-strong);
        color: white;
      }}

      .ghost-button {{
        background: rgba(36, 49, 61, 0.08);
        color: var(--text-default);
      }}

      .support-list {{
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
        font-size: 16px;
        line-height: 24px;
      }}

      .diagram-panel,
      aside,
      .table-panel {{
        min-width: 0;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid var(--border);
        border-radius: 24px;
      }}

      .diagram-panel {{
        margin-top: 18px;
        padding: 18px;
      }}

      .diagram-panel h3,
      aside h2,
      .table-panel h3 {{
        margin: 0 0 10px;
        font-size: 18px;
        line-height: 24px;
        color: var(--text-strong);
      }}

      .ladder {{
        display: grid;
        gap: 12px;
      }}

      .ladder-step {{
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: start;
        padding: 12px;
        border-radius: 18px;
        background: var(--inset);
      }}

      .ladder-step[data-active="true"] {{
        background: rgba(91, 97, 246, 0.09);
      }}

      .ladder-step .dot {{
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: var(--accent-continuity);
        margin-top: 6px;
      }}

      .rule-family-grid {{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }}

      .rule-family-card {{
        border-radius: 18px;
        padding: 14px;
        background: var(--inset);
        border: 1px solid rgba(36, 49, 61, 0.08);
      }}

      aside {{
        position: sticky;
        top: 24px;
        padding: 18px;
      }}

      aside dl {{
        margin: 0;
        display: grid;
        gap: 10px;
      }}

      aside dt {{
        font-size: 13px;
        line-height: 20px;
        color: var(--text-muted);
      }}

      aside dd {{
        margin: 0;
        font-size: 15px;
        line-height: 22px;
        overflow-wrap: anywhere;
      }}

      .drawer-button {{
        display: none;
        border: 1px solid rgba(36, 49, 61, 0.16);
        background: rgba(255, 255, 255, 0.92);
        border-radius: 999px;
        padding: 10px 14px;
        font: inherit;
        margin: 0 0 14px auto;
        cursor: pointer;
      }}

      .lower-grid {{
        display: grid;
        gap: 18px;
        margin-top: 22px;
      }}

      .table-panel {{
        padding: 18px;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }}

      th,
      td {{
        padding: 10px 12px;
        border-bottom: 1px solid rgba(36, 49, 61, 0.08);
        text-align: left;
        vertical-align: top;
        font-size: 14px;
        line-height: 20px;
        overflow-wrap: anywhere;
      }}

      th {{
        font-size: 13px;
        color: var(--text-muted);
      }}

      @media (max-width: 1024px) {{
        body[data-layout="stack"] .shell-layout {{
          grid-template-columns: 1fr;
        }}

        body[data-layout="stack"] .drawer-button {{
          display: inline-flex;
        }}

        body[data-layout="stack"] aside {{
          position: static;
          display: none;
        }}

        body[data-layout="stack"] aside[data-open="true"] {{
          display: block;
        }}

        .summary-band {{
          grid-template-columns: 1fr;
        }}
      }}

      @media (max-width: 720px) {{
        .page {{
          padding: 20px 16px 40px;
        }}

        .outcome-card h2 {{
          font-size: 30px;
          line-height: 36px;
        }}

        .rule-family-grid {{
          grid-template-columns: 1fr;
        }}
      }}
    </style>
  </head>
  <body data-layout="wide">
    <div class="page" data-testid="urgent-pathway-atlas">
      <header>
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 78 18" width="44" height="16" fill="none">
              <path d="M1 9C13 2 20 2 29 9C38 16 46 16 55 9C63 4 70 4 77 9" stroke="#B42318" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <div class="header-copy">
            <div class="brand-wordmark">Vecells</div>
            <h1>Urgent pathway atlas</h1>
            <p>One same-shell submit outcome frame for calm receipt, urgent pathway change, and safe failure recovery.</p>
          </div>
        </div>
      </header>

      <section class="summary-band" aria-label="Outcome overview">
        <article>
          <h2>Rule pack</h2>
          <p>{RULE_PACK_ID} · version {RULE_PACK_VERSION}</p>
        </article>
        <article>
          <h2>Urgent threshold</h2>
          <p>theta_U = {THRESHOLDS["urgent"]["thetaU"]} with hard-stop dominance</p>
        </article>
        <article>
          <h2>Residual threshold</h2>
          <p>theta_R = {THRESHOLDS["residual"]["thetaR"]} with contradiction and missingness holds</p>
        </article>
      </section>

      <nav class="scenario-bar" aria-label="Outcome scenarios" data-testid="scenario-bar"></nav>

      <button class="drawer-button" type="button" data-testid="inspector-drawer-button">Open inspector</button>

      <div class="shell-layout">
        <main>
          <section class="shell-frame" data-testid="urgent-shell-frame">
            <div class="shell-frame-inner">
              <div class="frame-meta">
                <span class="frame-chip" data-testid="shell-key-chip">patient.portal.requests</span>
                <span class="frame-chip" data-testid="route-chip">/intake/requests/:requestPublicId/urgent-guidance</span>
                <span class="frame-chip" data-testid="submit-result-chip">urgent_diversion</span>
              </div>

              <article class="outcome-card" data-testid="outcome-card" data-family="urgent_diversion">
                <div class="card-kicker urgent" data-testid="outcome-kicker">Urgent pathway change</div>
                <h2 tabindex="-1" data-testid="outcome-title">Get urgent help now</h2>
                <p class="outcome-summary" data-testid="outcome-summary"></p>

                <section class="emergency-region" data-testid="emergency-action-region">
                  <div class="action-row">
                    <button class="action-button" type="button" data-testid="primary-action"></button>
                    <button class="ghost-button" type="button" data-testid="secondary-action"></button>
                  </div>
                </section>

                <ul class="support-list" data-testid="support-list"></ul>
              </article>
            </div>
          </section>

          <section class="diagram-panel" data-testid="decision-ladder-panel">
            <h3>Decision ladder</h3>
            <div class="ladder" data-testid="decision-ladder"></div>
          </section>

          <section class="diagram-panel" data-testid="rule-family-panel">
            <h3>Rule-family matrix</h3>
            <div class="rule-family-grid" data-testid="rule-family-visuals"></div>
          </section>
        </main>

        <aside data-testid="copy-inspector" data-open="true">
          <h2>Evidence and copy inspector</h2>
          <dl>
            <div>
              <dt>Scenario</dt>
              <dd data-testid="inspector-scenario"></dd>
            </div>
            <div>
              <dt>Requested safety state</dt>
              <dd data-testid="inspector-state"></dd>
            </div>
            <div>
              <dt>Urgent settlement</dt>
              <dd data-testid="inspector-settlement"></dd>
            </div>
            <div>
              <dt>Rule hits</dt>
              <dd data-testid="inspector-rule-hits"></dd>
            </div>
            <div>
              <dt>Artifact contract</dt>
              <dd data-testid="inspector-artifact"></dd>
            </div>
            <div>
              <dt>Navigation grant</dt>
              <dd data-testid="inspector-navigation"></dd>
            </div>
            <div>
              <dt>Forbidden phrases</dt>
              <dd data-testid="inspector-forbidden"></dd>
            </div>
          </dl>
        </aside>
      </div>

      <section class="lower-grid">
        <section class="table-panel">
          <h3>Decision ladder table</h3>
          <table data-testid="decision-ladder-table">
            <thead><tr><th>Step</th><th>Meaning</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>

        <section class="table-panel">
          <h3>Rule-family parity table</h3>
          <table data-testid="rule-family-table">
            <thead><tr><th>Family</th><th>Count</th><th>Meaning</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>

        <section class="table-panel">
          <h3>Outcome copy comparison</h3>
          <table data-testid="copy-comparison-table">
            <thead><tr><th>Variant</th><th>Family</th><th>State</th><th>Headline</th><th>Primary action</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>

        <section class="table-panel">
          <h3>Rule coverage matrix</h3>
          <table data-testid="rule-coverage-table">
            <thead><tr><th>Rule</th><th>Severity</th><th>Cases</th><th>Coverage</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>
      </section>
    </div>

    <div class="sr-only" aria-live="polite" data-testid="urgent-live-region"></div>

    <script type="application/json" id="urgent-pathway-data">{atlas_json}</script>
    <script>
      const atlas = JSON.parse(document.getElementById("urgent-pathway-data").textContent);
      const scenarioBar = document.querySelector("[data-testid='scenario-bar']");
      const liveRegion = document.querySelector("[data-testid='urgent-live-region']");
      const drawerButton = document.querySelector("[data-testid='inspector-drawer-button']");
      const inspector = document.querySelector("[data-testid='copy-inspector']");
      const titleNode = document.querySelector("[data-testid='outcome-title']");
      const outcomeCard = document.querySelector("[data-testid='outcome-card']");
      const summaryNode = document.querySelector("[data-testid='outcome-summary']");
      const kickerNode = document.querySelector("[data-testid='outcome-kicker']");
      const primaryAction = document.querySelector("[data-testid='primary-action']");
      const secondaryAction = document.querySelector("[data-testid='secondary-action']");
      const supportList = document.querySelector("[data-testid='support-list']");
      const shellKeyChip = document.querySelector("[data-testid='shell-key-chip']");
      const routeChip = document.querySelector("[data-testid='route-chip']");
      const submitResultChip = document.querySelector("[data-testid='submit-result-chip']");
      const ladder = document.querySelector("[data-testid='decision-ladder']");
      const ruleFamilyVisuals = document.querySelector("[data-testid='rule-family-visuals']");

      const inspectorFields = {{
        scenario: document.querySelector("[data-testid='inspector-scenario']"),
        state: document.querySelector("[data-testid='inspector-state']"),
        settlement: document.querySelector("[data-testid='inspector-settlement']"),
        ruleHits: document.querySelector("[data-testid='inspector-rule-hits']"),
        artifact: document.querySelector("[data-testid='inspector-artifact']"),
        navigation: document.querySelector("[data-testid='inspector-navigation']"),
        forbidden: document.querySelector("[data-testid='inspector-forbidden']"),
      }};

      const scenarioIndex = new Map(atlas.scenarios.map((scenario, index) => [scenario.scenarioId, index]));
      let selectedScenarioId = atlas.scenarios[0].scenarioId;

      function layoutMode() {{
        const stack = window.innerWidth <= 1024;
        document.body.dataset.layout = stack ? "stack" : "wide";
        if (!stack) {{
          inspector.dataset.open = "true";
        }}
      }}

      function renderScenarioButtons() {{
        scenarioBar.innerHTML = atlas.scenarios
          .map((scenario) => {{
            const selected = scenario.scenarioId === selectedScenarioId;
            return `<button class="scenario-button" type="button" data-testid="scenario-button-${{scenario.scenarioId}}" data-scenario-id="${{scenario.scenarioId}}" data-selected="${{selected}}" aria-pressed="${{selected}}">${{scenario.label}}</button>`;
          }})
          .join("");
      }}

      function renderTables() {{
        const ladderTable = document.querySelector("[data-testid='decision-ladder-table'] tbody");
        ladderTable.innerHTML = atlas.decisionLadder
          .map((step) => `<tr><td>${{step.label}}</td><td>${{step.detail}}</td></tr>`)
          .join("");

        const ruleFamilyTable = document.querySelector("[data-testid='rule-family-table'] tbody");
        ruleFamilyTable.innerHTML = atlas.ruleFamilyVisuals
          .map((row) => `<tr><td>${{row.title}}</td><td>${{row.count}}</td><td>${{row.meaning}}</td></tr>`)
          .join("");

        const copyTable = document.querySelector("[data-testid='copy-comparison-table'] tbody");
        copyTable.innerHTML = atlas.copyRows
          .map((row) => `<tr><td>${{row.variantRef}}</td><td>${{row.family}}</td><td>${{row.state}}</td><td>${{row.title}}</td><td>${{row.primaryActionLabel}}</td></tr>`)
          .join("");

        const coverageTable = document.querySelector("[data-testid='rule-coverage-table'] tbody");
        coverageTable.innerHTML = atlas.coverageRows
          .map((row) => `<tr><td>${{row.ruleId}}</td><td>${{row.severityClass}}</td><td>${{row.challengeCaseRefs}}</td><td>${{row.coverageStatus}}</td></tr>`)
          .join("");
      }}

      function renderLadder(activeScenario) {{
        const activeUrgent = activeScenario.requestedSafetyState === "urgent_diversion_required" || activeScenario.requestedSafetyState === "urgent_diverted";
        const activeIssued = activeScenario.requestedSafetyState === "urgent_diverted";
        const activeFailed = activeScenario.submitResult === "failed_safe";
        ladder.innerHTML = atlas.decisionLadder
          .map((step) => {{
            const active =
              step.ladderStepId === "submitted" ||
              step.ladderStepId === "classified" ||
              step.ladderStepId === "preempted" ||
              step.ladderStepId === "decision_settled" ||
              (step.ladderStepId === "urgent_required" && activeUrgent) ||
              (step.ladderStepId === "urgent_issued_or_receipt" && (activeIssued || !activeUrgent || activeFailed));
            return `
              <div class="ladder-step" data-testid="ladder-step-${{step.ladderStepId}}" data-active="${{active}}">
                <span class="dot" aria-hidden="true"></span>
                <div>
                  <strong>${{step.label}}</strong>
                  <div>${{step.detail}}</div>
                </div>
              </div>
            `;
          }})
          .join("");
      }}

      function renderRuleFamilies() {{
        ruleFamilyVisuals.innerHTML = atlas.ruleFamilyVisuals
          .map((item) => `
            <article class="rule-family-card" data-testid="rule-family-${{item.family}}">
              <div style="color:${{item.accent}}; font-size:13px; line-height:20px;">${{item.family}}</div>
              <h4 style="margin:4px 0 6px; font-size:18px; line-height:24px; color:var(--text-strong);">${{item.title}}</h4>
              <p style="margin:0 0 8px; font-size:16px; line-height:24px;">${{item.count}} rules</p>
              <p style="margin:0; font-size:14px; line-height:20px; color:var(--text-muted);">${{item.meaning}}</p>
            </article>
          `)
          .join("");
      }}

      function selectedScenario() {{
        return atlas.scenarios.find((scenario) => scenario.scenarioId === selectedScenarioId);
      }}

      function selectScenario(nextScenarioId, restoreFocus = true) {{
        selectedScenarioId = nextScenarioId;
        renderScenarioButtons();
        const scenario = selectedScenario();

        outcomeCard.dataset.family = scenario.outcomeFamily;
        kickerNode.className = "card-kicker " + (scenario.outcomeFamily === "urgent_diversion" ? "urgent" : scenario.outcomeFamily === "safe_receipt" ? "safe" : "failed");
        kickerNode.textContent =
          scenario.outcomeFamily === "urgent_diversion"
            ? "Urgent pathway change"
            : scenario.outcomeFamily === "safe_receipt"
              ? "Safe receipt"
              : "Safe failure recovery";
        titleNode.textContent = scenario.title;
        summaryNode.textContent = scenario.summary;
        primaryAction.textContent = scenario.primaryAction.label;
        primaryAction.dataset.actionId = scenario.primaryAction.actionId;
        secondaryAction.textContent = scenario.secondaryAction.label;
        secondaryAction.dataset.actionId = scenario.secondaryAction.actionId;
        supportList.innerHTML = scenario.supportingBullets.map((item) => `<li>${{item}}</li>`).join("");
        shellKeyChip.textContent = "patient.portal.requests";
        routeChip.textContent = scenario.routePattern;
        submitResultChip.textContent = scenario.submitResult;
        inspectorFields.scenario.textContent = scenario.label + " · " + scenario.requestType;
        inspectorFields.state.textContent = scenario.requestedSafetyState;
        inspectorFields.settlement.textContent = scenario.urgentDiversionSettlementState;
        inspectorFields.ruleHits.textContent = scenario.ruleHits.join(", ") || "none";
        inspectorFields.artifact.textContent = scenario.artifactPresentationContractRef;
        inspectorFields.navigation.textContent = scenario.outboundNavigationGrantPolicyRef;
        inspectorFields.forbidden.textContent = scenario.forbiddenPhrases.join(" · ");
        renderLadder(scenario);
        liveRegion.textContent = scenario.liveRegionMessage;

        if (restoreFocus) {{
          if (scenario.focusTarget === "primary_action") {{
            primaryAction.focus();
          }} else {{
            titleNode.focus();
          }}
        }}
      }}

      scenarioBar.addEventListener("click", (event) => {{
        const button = event.target.closest(".scenario-button");
        if (!button) {{
          return;
        }}
        selectScenario(button.dataset.scenarioId);
      }});

      scenarioBar.addEventListener("keydown", (event) => {{
        const currentButton = event.target.closest(".scenario-button");
        if (!currentButton) {{
          return;
        }}
        const currentIndex = scenarioIndex.get(currentButton.dataset.scenarioId);
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") {{
          nextIndex = Math.min(atlas.scenarios.length - 1, currentIndex + 1);
        }} else if (event.key === "ArrowLeft") {{
          nextIndex = Math.max(0, currentIndex - 1);
        }} else if (event.key === "Home") {{
          nextIndex = 0;
        }} else if (event.key === "End") {{
          nextIndex = atlas.scenarios.length - 1;
        }} else {{
          return;
        }}
        event.preventDefault();
        const nextScenario = atlas.scenarios[nextIndex];
        selectScenario(nextScenario.scenarioId, false);
        document.querySelector(`[data-testid="scenario-button-${{nextScenario.scenarioId}}"]`).focus();
      }});

      drawerButton.addEventListener("click", () => {{
        inspector.dataset.open = inspector.dataset.open === "true" ? "false" : "true";
      }});

      renderTables();
      renderRuleFamilies();
      renderScenarioButtons();
      layoutMode();
      selectScenario(selectedScenarioId, false);
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
        document.body.classList.add("reduced-motion");
      }}
      window.addEventListener("resize", layoutMode);
    </script>
  </body>
</html>
"""


def main() -> None:
    load_prerequisites()

    rules = build_rules()
    decision_tables = build_decision_tables(rules)
    copy_contract = build_copy_contract()
    challenge_cases = build_challenge_cases()
    coverage_rows = build_rule_coverage_rows(rules, challenge_cases)
    rule_pack_schema = build_rule_pack_schema(decision_tables)
    atlas_model = build_atlas_model(decision_tables, copy_contract, challenge_cases, coverage_rows)

    write_json(RULE_PACK_SCHEMA_PATH, rule_pack_schema)
    write_text(DECISION_TABLES_YAML_PATH, json.dumps(decision_tables, indent=2))
    write_json(OUTCOME_COPY_CONTRACT_PATH, copy_contract)
    write_jsonl(CHALLENGE_CASES_PATH, challenge_cases)
    write_csv(
        RULE_COVERAGE_MATRIX_PATH,
        coverage_rows,
        [
            "ruleId",
            "severityClass",
            "requestTypes",
            "dependencyGroupRef",
            "calibrationStratumRef",
            "challengeCaseCount",
            "challengeCaseRefs",
            "thresholdBoundaryCovered",
            "degradedAttachmentCovered",
            "contradictionCovered",
            "criticalMissingnessCovered",
            "coverageStatus",
        ],
    )

    write_text(RULEBOOK_DOC_PATH, render_rulebook_markdown(decision_tables))
    write_text(DECISION_TABLES_DOC_PATH, render_decision_tables_markdown(decision_tables, challenge_cases))
    write_text(COPY_DECK_DOC_PATH, render_copy_deck_markdown(copy_contract))
    write_text(ATLAS_HTML_PATH, render_atlas_html(atlas_model))


if __name__ == "__main__":
    main()
