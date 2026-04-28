#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOCS_API_DIR = ROOT / "docs" / "api"
DOCS_CONTENT_DIR = ROOT / "docs" / "content"
DOCS_FRONTEND_DIR = ROOT / "docs" / "frontend"

PHASE1_DRAFT_SCHEMA_PATH = DATA_CONTRACTS_DIR / "139_intake_draft_view.schema.json"

TAXONOMY_PATH = DATA_CONTRACTS_DIR / "140_request_type_taxonomy.json"
BUNDLE_SCHEMA_PATH = DATA_CONTRACTS_DIR / "140_intake_experience_bundle.schema.json"
QUESTION_DEFINITIONS_PATH = DATA_CONTRACTS_DIR / "140_question_definitions.json"
DECISION_TABLES_PATH = DATA_CONTRACTS_DIR / "140_questionnaire_decision_tables.yaml"
VISIBILITY_MATRIX_PATH = DATA_ANALYSIS_DIR / "140_question_visibility_matrix.csv"
BUNDLE_MATRIX_PATH = DATA_ANALYSIS_DIR / "140_bundle_compatibility_matrix.csv"
TAXONOMY_DOC_PATH = DOCS_ARCHITECTURE_DIR / "140_request_type_taxonomy.md"
QUESTION_CONTRACT_DOC_PATH = DOCS_API_DIR / "140_question_definition_contract.md"
DECISION_TABLE_DOC_PATH = DOCS_CONTENT_DIR / "140_questionnaire_decision_tables.md"
ATLAS_HTML_PATH = DOCS_FRONTEND_DIR / "140_request_type_questionnaire_atlas.html"

TASK_ID = "seq_140"
VISUAL_MODE = "Request_Type_Atlas"
CAPTURED_ON = "2026-04-14"
TAXONOMY_ID = "RTT_140_PHASE1_V1"
QUESTION_CONTRACT_ID = "QDC_140_PHASE1_V1"
DECISION_TABLE_SET_ID = "QDT_140_PHASE1_V1"
BUNDLE_SCHEMA_ID = "IEB_140_PHASE1_V1"
DRAFT_SCHEMA_VERSION = "INTAKE_DRAFT_VIEW_V1"
QUESTION_SET_VERSION = "INTAKE_PHASE1_QUESTION_SET_V1"
CONTENT_PACK_VERSION = "INTAKE_PHASE1_CONTENT_PACK_V1"
RELEASE_APPROVAL_FREEZE_REF = "RAF_LOCAL_V1"
EMBEDDED_MANIFEST_VERSION_REF = "PEM_PHASE1_INTAKE_EMBEDDED_V1"
MINIMUM_BRIDGE_CAPABILITIES_REF = "BMC_PHASE1_NHS_EMBEDDED_MINIMUM_V1"

SOURCE_PRECEDENCE = [
    "prompt/140.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-1-the-red-flag-gate.md#1C. World-class intake frame and structured capture",
    "blueprint/phase-cards.md#card-2-phase-1-the-red-flag-gate",
    "blueprint/phase-0-the-foundation-protocol.md#SubmissionEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#SubmissionPromotionRecord",
    "blueprint/platform-frontend-blueprint.md#Shell and route-family ownership rules",
    "blueprint/blueprint-init.md#single-intake-convergence-seam",
    "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
    "blueprint/design-token-foundation.md#Machine-readable export contract",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
    "blueprint/forensic-audit-findings.md#continuity-proof-and-rule-drift",
    "data/contracts/139_intake_draft_view.schema.json",
    "data/contracts/139_intake_event_catalog.json",
    "docs/api/139_phase1_submission_schema_lock.md",
]

QUESTION_FIELDS = [
    "questionKey",
    "requestType",
    "stepKey",
    "answerType",
    "cardinality",
    "requiredWhen",
    "visibilityPredicate",
    "normalizationTarget",
    "safetyRelevance",
    "summaryRenderer",
    "supersessionPolicy",
    "helpContentRef",
]

QUESTION_SETS = {
    "Symptoms": "QSET_140_SYMPTOMS_V1",
    "Meds": "QSET_140_MEDS_V1",
    "Admin": "QSET_140_ADMIN_V1",
    "Results": "QSET_140_RESULTS_V1",
}

SUPPLEMENTAL_TAG_POLICIES = {
    "Symptoms": ["affected_body_area", "duration_hint", "home_measurement_present"],
    "Meds": ["repeat_supply_hint", "side_effect_hint", "dose_window_hint"],
    "Admin": ["document_channel_hint", "deadline_hint", "reference_hint"],
    "Results": ["test_setting_hint", "date_window_hint", "follow_up_hint"],
}

SUMMARY_RENDERERS = [
    {
        "summaryRenderer": "summary.symptoms.category.v1",
        "purpose": "Render the selected symptom category in the patient-facing review card and normalized summary.",
    },
    {
        "summaryRenderer": "summary.symptoms.chest_location.v1",
        "purpose": "Render the bounded safety-location answer when chest or breathing symptoms are declared.",
    },
    {
        "summaryRenderer": "summary.symptoms.onset_date.v1",
        "purpose": "Render an exact onset date in a concise review line.",
    },
    {
        "summaryRenderer": "summary.symptoms.onset_window.v1",
        "purpose": "Render an approximate onset window when the exact date is not known.",
    },
    {
        "summaryRenderer": "summary.symptoms.worsening_now.v1",
        "purpose": "Surface a bounded yes/no symptom worsening statement in review and triage payloads.",
    },
    {
        "summaryRenderer": "summary.symptoms.severity_clues.v1",
        "purpose": "Collapse selected severity clues into a short comma-separated review line.",
    },
    {
        "summaryRenderer": "summary.symptoms.narrative.v1",
        "purpose": "Render a trimmed patient narrative excerpt without inferring structured meaning from prose alone.",
    },
    {
        "summaryRenderer": "summary.meds.query_type.v1",
        "purpose": "Render the medication request class as a concise intake label.",
    },
    {
        "summaryRenderer": "summary.meds.medicine_name.v1",
        "purpose": "Render the named medicine when supplied.",
    },
    {
        "summaryRenderer": "summary.meds.name_unknown_reason.v1",
        "purpose": "Render the bounded medicine-name unknown reason when the patient cannot identify the medicine.",
    },
    {
        "summaryRenderer": "summary.meds.issue_description.v1",
        "purpose": "Render a trimmed medication issue narrative excerpt.",
    },
    {
        "summaryRenderer": "summary.meds.urgency.v1",
        "purpose": "Render the medication urgency band without overstating triage posture.",
    },
    {
        "summaryRenderer": "summary.admin.support_type.v1",
        "purpose": "Render the chosen admin work type as the review heading.",
    },
    {
        "summaryRenderer": "summary.admin.deadline_known.v1",
        "purpose": "Render whether a patient-reported admin deadline exists.",
    },
    {
        "summaryRenderer": "summary.admin.deadline_date.v1",
        "purpose": "Render the known admin deadline date when present.",
    },
    {
        "summaryRenderer": "summary.admin.reference_available.v1",
        "purpose": "Render whether the patient has a previous admin reference to quote.",
    },
    {
        "summaryRenderer": "summary.admin.reference_number.v1",
        "purpose": "Render the patient-provided reference number when present.",
    },
    {
        "summaryRenderer": "summary.admin.details.v1",
        "purpose": "Render a trimmed admin-details excerpt.",
    },
    {
        "summaryRenderer": "summary.results.context.v1",
        "purpose": "Render the bounded test or investigation context as the review heading.",
    },
    {
        "summaryRenderer": "summary.results.test_name.v1",
        "purpose": "Render the named investigation or the bounded unknown posture.",
    },
    {
        "summaryRenderer": "summary.results.date_known.v1",
        "purpose": "Render whether a result date is known, approximate, or unknown.",
    },
    {
        "summaryRenderer": "summary.results.date_value.v1",
        "purpose": "Render the patient-known result date or approximate date window.",
    },
    {
        "summaryRenderer": "summary.results.question.v1",
        "purpose": "Render a trimmed explanation of what the patient wants to know about the result.",
    },
]

SUPERSSESSION_POLICIES = [
    {
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "description": "The question is not branch-hidden within Phase 1; it remains active while its request type stays active.",
        "onHidden": "none",
        "retainForAudit": False,
        "excludeFromActivePayload": False,
        "excludeFromActiveSummary": False,
        "forceReviewConfirmationWhenSafetyRelevant": False,
        "reAnswerRequiredWhenQuestionReappears": False,
    },
    {
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "description": "When the controlling answer hides the field, retain the old answer for audit, remove it from the active summary and payload, and require a fresh answer if the field reappears.",
        "onHidden": "supersede_and_audit_retain",
        "retainForAudit": True,
        "excludeFromActivePayload": True,
        "excludeFromActiveSummary": True,
        "forceReviewConfirmationWhenSafetyRelevant": False,
        "reAnswerRequiredWhenQuestionReappears": True,
    },
    {
        "supersessionPolicy": "SUP_140_SAFETY_BRANCH_SUPERSEDE_V1",
        "description": "When the controlling answer hides the field, supersede it for audit, remove it from the active payload and summary, and force review confirmation because the hidden answer was safety relevant.",
        "onHidden": "supersede_and_audit_retain",
        "retainForAudit": True,
        "excludeFromActivePayload": True,
        "excludeFromActiveSummary": True,
        "forceReviewConfirmationWhenSafetyRelevant": True,
        "reAnswerRequiredWhenQuestionReappears": True,
    },
    {
        "supersessionPolicy": "SUP_140_REQUEST_TYPE_CONFIRM_AND_SUPERSEDE_V1",
        "description": "Changing the primary request type after branch answers exist is forbidden without an explicit confirm-and-supersede acknowledgment. The prior branch remains in audit history only.",
        "onHidden": "confirm_then_supersede_branch",
        "retainForAudit": True,
        "excludeFromActivePayload": True,
        "excludeFromActiveSummary": True,
        "forceReviewConfirmationWhenSafetyRelevant": True,
        "reAnswerRequiredWhenQuestionReappears": True,
    },
]

UNKNOWN_HANDLING_POLICIES = [
    {
        "policyRef": "UNK_140_MEDS_NAME_BOUNDED_V1",
        "appliesTo": ["meds.nameKnown", "meds.medicineName", "meds.nameUnknownReason"],
        "allowedStates": ["known", "unknown_or_unsure"],
        "notes": "Medicine names do not collapse to free text nulls. Unknown or unsure posture is explicit and routes to one bounded reason field.",
    },
    {
        "policyRef": "UNK_140_RESULTS_DATE_BOUNDED_V1",
        "appliesTo": ["results.dateKnown", "results.resultDate"],
        "allowedStates": ["exact_or_approx", "not_sure", "unknown"],
        "notes": "Result dates may be exact or approximate when known; otherwise the patient must stay inside the bounded not-sure or unknown states.",
    },
    {
        "policyRef": "UNK_140_SYMPTOM_ONSET_BOUNDED_V1",
        "appliesTo": ["symptoms.onsetPrecision", "symptoms.onsetDate", "symptoms.onsetWindow"],
        "allowedStates": ["exact_date", "approximate_window", "unknown"],
        "notes": "Onset answers may be exact, approximate, or unknown, but the schema never infers a date from narrative prose.",
    },
]

HELP_CONTENT = [
    {
        "helpContentRef": "help.symptoms.category.v1",
        "headline": "Choose the main symptom family only",
        "body": "Pick the main concern. Supporting detail belongs in the structured answers and short narrative, not in a second request type.",
    },
    {
        "helpContentRef": "help.symptoms.chest_location.v1",
        "headline": "We ask location only for safety screening",
        "body": "This answer stays bounded because it is used for immediate safety relevance, not diagnosis.",
    },
    {
        "helpContentRef": "help.symptoms.onset.v1",
        "headline": "Exact or approximate is enough",
        "body": "If you do not know the exact onset date, use the approximate window or unknown option. We do not require invented dates.",
    },
    {
        "helpContentRef": "help.symptoms.severity.v1",
        "headline": "Select only what is happening now",
        "body": "Choose the severity clues that best describe the current issue so the summary and triage payload stay consistent.",
    },
    {
        "helpContentRef": "help.meds.query_type.v1",
        "headline": "Pick the main medication question",
        "body": "Choose one main medication problem for the draft. A different medication topic requires a new request type or follow-up request.",
    },
    {
        "helpContentRef": "help.meds.name_known.v1",
        "headline": "Unknown medicine names are allowed",
        "body": "If you do not know the medicine name, mark it as unknown or unsure instead of guessing.",
    },
    {
        "helpContentRef": "help.admin.support_type.v1",
        "headline": "Choose the admin outcome you need",
        "body": "Select the form, letter, result clarification, or other admin support you are asking for.",
    },
    {
        "helpContentRef": "help.admin.deadline.v1",
        "headline": "Deadlines are optional but bounded",
        "body": "Only add a deadline if one exists. If you do not know it, keep the explicit no-deadline state.",
    },
    {
        "helpContentRef": "help.results.context.v1",
        "headline": "Pick the result context you recognise",
        "body": "Choose the type of test or investigation if you know it. The name field can remain unknown without breaking the schema.",
    },
    {
        "helpContentRef": "help.results.date.v1",
        "headline": "Approximate result dates are acceptable",
        "body": "If you only know roughly when the result happened, use the approximate date field. Unknown is a valid explicit state.",
    },
    {
        "helpContentRef": "help.free_text.v1",
        "headline": "Narrative supports the structured answers",
        "body": "Narrative gives context, but the structured fields remain the only source for typed summary, validation, and normalization.",
    },
]

QUESTION_DEFINITIONS = [
    {
        "questionKey": "symptoms.category",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "What kind of symptom is the main concern?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms'",
        "visibilityPredicate": "requestType == 'Symptoms'",
        "normalizationTarget": "structuredAnswers.symptoms.symptomCategoryCode",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.category.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.symptoms.category.v1",
        "allowedAnswers": ["respiratory", "pain", "skin", "digestive", "general", "chest_breathing"],
        "whyWeAsk": "This one answer selects the canonical symptom schema without creating a second hidden request type.",
    },
    {
        "questionKey": "symptoms.chestPainLocation",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "Where is the chest or breathing discomfort most noticeable?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms' && answers['symptoms.category'] == 'chest_breathing'",
        "visibilityPredicate": "requestType == 'Symptoms' && answers['symptoms.category'] == 'chest_breathing'",
        "normalizationTarget": "structuredAnswers.symptoms.chestDiscomfortLocationCode",
        "safetyRelevance": "safety_relevant",
        "summaryRenderer": "summary.symptoms.chest_location.v1",
        "supersessionPolicy": "SUP_140_SAFETY_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.symptoms.chest_location.v1",
        "allowedAnswers": ["centre_chest", "left_side", "right_side", "breathing_only", "not_sure"],
        "whyWeAsk": "This bounded answer supports red-flag screening. If the branch disappears later, the old answer stays in audit only and requires review confirmation.",
    },
    {
        "questionKey": "symptoms.onsetPrecision",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "How well do you know when it started?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms'",
        "visibilityPredicate": "requestType == 'Symptoms'",
        "normalizationTarget": "structuredAnswers.symptoms.onsetPrecision",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.onset_date.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.symptoms.onset.v1",
        "allowedAnswers": ["exact_date", "approximate_window", "unknown"],
        "unknownHandlingPolicyRef": "UNK_140_SYMPTOM_ONSET_BOUNDED_V1",
        "whyWeAsk": "Phase 1 allows exact, approximate, or unknown onset without inferring hidden meaning from free text.",
    },
    {
        "questionKey": "symptoms.onsetDate",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "What exact date did it start?",
        "answerType": "date",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'exact_date'",
        "visibilityPredicate": "requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'exact_date'",
        "normalizationTarget": "structuredAnswers.symptoms.onsetDate",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.onset_date.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.symptoms.onset.v1",
        "whyWeAsk": "The exact date is useful when known, but the branch can be safely superseded if the patient later changes to approximate or unknown.",
    },
    {
        "questionKey": "symptoms.onsetWindow",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "Roughly when did it start?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'approximate_window'",
        "visibilityPredicate": "requestType == 'Symptoms' && answers['symptoms.onsetPrecision'] == 'approximate_window'",
        "normalizationTarget": "structuredAnswers.symptoms.onsetWindowCode",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.onset_window.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.symptoms.onset.v1",
        "allowedAnswers": ["today", "last_2_days", "this_week", "more_than_week", "not_sure"],
        "whyWeAsk": "Approximate onset is a first-class schema state, not a degraded fallback.",
    },
    {
        "questionKey": "symptoms.worseningNow",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "Is it getting worse right now?",
        "answerType": "boolean",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms'",
        "visibilityPredicate": "requestType == 'Symptoms'",
        "normalizationTarget": "structuredAnswers.symptoms.worseningNow",
        "safetyRelevance": "safety_relevant",
        "summaryRenderer": "summary.symptoms.worsening_now.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.symptoms.severity.v1",
        "whyWeAsk": "This answer feeds immediate safety posture. It must never disappear silently.",
    },
    {
        "questionKey": "symptoms.severityClues",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "Which of these best describes the impact?",
        "answerType": "multi_select",
        "cardinality": "multiple",
        "requiredWhen": "requestType == 'Symptoms'",
        "visibilityPredicate": "requestType == 'Symptoms'",
        "normalizationTarget": "structuredAnswers.symptoms.severityClueCodes",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.severity_clues.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.symptoms.severity.v1",
        "allowedAnswers": ["sleep_affected", "mobility_affected", "work_or_school_affected", "sudden_change", "none_of_these"],
        "whyWeAsk": "Severity clues are bounded so the review summary and normalized payload stay aligned.",
    },
    {
        "questionKey": "symptoms.narrative",
        "requestType": "Symptoms",
        "stepKey": "details",
        "promptLabel": "Tell us anything else that will help the practice understand the problem.",
        "answerType": "long_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Symptoms'",
        "visibilityPredicate": "requestType == 'Symptoms'",
        "normalizationTarget": "structuredAnswers.symptoms.patientNarrative",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.symptoms.narrative.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.free_text.v1",
        "whyWeAsk": "Narrative provides context, but it does not replace the typed symptom fields.",
    },
    {
        "questionKey": "meds.queryType",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "What is the main medication issue?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds'",
        "visibilityPredicate": "requestType == 'Meds'",
        "normalizationTarget": "structuredAnswers.meds.queryTypeCode",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.meds.query_type.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.meds.query_type.v1",
        "allowedAnswers": ["repeat_supply", "dose_question", "side_effect", "medication_change", "other_meds_issue"],
        "whyWeAsk": "The medication schema starts with one bounded query type instead of inferring medication intent from free text.",
    },
    {
        "questionKey": "meds.nameKnown",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "Do you know the medicine name?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds'",
        "visibilityPredicate": "requestType == 'Meds'",
        "normalizationTarget": "structuredAnswers.meds.medicineNameState",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.meds.name_unknown_reason.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.meds.name_known.v1",
        "allowedAnswers": ["known", "unknown_or_unsure"],
        "unknownHandlingPolicyRef": "UNK_140_MEDS_NAME_BOUNDED_V1",
        "whyWeAsk": "Unknown medicine names are explicit schema states. We never ask the patient to invent a medicine name.",
    },
    {
        "questionKey": "meds.medicineName",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "What is the medicine name?",
        "answerType": "short_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds' && answers['meds.nameKnown'] == 'known'",
        "visibilityPredicate": "requestType == 'Meds' && answers['meds.nameKnown'] == 'known'",
        "normalizationTarget": "structuredAnswers.meds.medicineNameText",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.meds.medicine_name.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.meds.name_known.v1",
        "whyWeAsk": "The named medicine stays active only while the patient says they know it. If hidden later, the old answer moves to audit only.",
    },
    {
        "questionKey": "meds.nameUnknownReason",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "Why is the name unknown or unsure?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds' && answers['meds.nameKnown'] == 'unknown_or_unsure'",
        "visibilityPredicate": "requestType == 'Meds' && answers['meds.nameKnown'] == 'unknown_or_unsure'",
        "normalizationTarget": "structuredAnswers.meds.medicineNameUnknownReason",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.meds.name_unknown_reason.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.meds.name_known.v1",
        "allowedAnswers": ["label_not_available", "multiple_medicines", "patient_not_sure", "medicine_started_elsewhere"],
        "whyWeAsk": "The unknown-name branch captures a bounded reason instead of letting the schema collapse to null.",
    },
    {
        "questionKey": "meds.issueDescription",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "What has happened with the medicine?",
        "answerType": "long_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds'",
        "visibilityPredicate": "requestType == 'Meds'",
        "normalizationTarget": "structuredAnswers.meds.issueNarrative",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.meds.issue_description.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.free_text.v1",
        "whyWeAsk": "The short narrative gives context, but the main medication meaning remains in the bounded fields.",
    },
    {
        "questionKey": "meds.urgency",
        "requestType": "Meds",
        "stepKey": "details",
        "promptLabel": "How urgent does it feel right now?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Meds'",
        "visibilityPredicate": "requestType == 'Meds'",
        "normalizationTarget": "structuredAnswers.meds.urgencyBand",
        "safetyRelevance": "safety_relevant",
        "summaryRenderer": "summary.meds.urgency.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.meds.query_type.v1",
        "allowedAnswers": ["routine", "soon", "urgent_today"],
        "whyWeAsk": "Medication urgency stays explicit because the later red-flag gate cannot infer urgency safely from narrative alone.",
    },
    {
        "questionKey": "admin.supportType",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "What kind of admin help do you need?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin'",
        "visibilityPredicate": "requestType == 'Admin'",
        "normalizationTarget": "structuredAnswers.admin.supportTypeCode",
        "safetyRelevance": "none",
        "summaryRenderer": "summary.admin.support_type.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.admin.support_type.v1",
        "allowedAnswers": ["fit_note", "form_or_letter", "admin_follow_up", "results_admin_query", "other_admin_support"],
        "whyWeAsk": "Phase 1 admin requests stay bounded to one support type so later handling can route cleanly.",
    },
    {
        "questionKey": "admin.deadlineKnown",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "Is there a deadline we should know about?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin'",
        "visibilityPredicate": "requestType == 'Admin'",
        "normalizationTarget": "structuredAnswers.admin.deadlineState",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.admin.deadline_known.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.admin.deadline.v1",
        "allowedAnswers": ["deadline_known", "no_deadline", "not_sure"],
        "whyWeAsk": "Deadlines are bounded and optional. Unknown is explicit, not an empty field that changes meaning later.",
    },
    {
        "questionKey": "admin.deadlineDate",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "What is the deadline date?",
        "answerType": "date",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin' && answers['admin.deadlineKnown'] == 'deadline_known'",
        "visibilityPredicate": "requestType == 'Admin' && answers['admin.deadlineKnown'] == 'deadline_known'",
        "normalizationTarget": "structuredAnswers.admin.deadlineDate",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.admin.deadline_date.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.admin.deadline.v1",
        "whyWeAsk": "The deadline field appears only when the patient says one exists. Hidden answers are superseded, not silently retained as active.",
    },
    {
        "questionKey": "admin.referenceAvailable",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "Do you already have a reference number or letter code?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin'",
        "visibilityPredicate": "requestType == 'Admin'",
        "normalizationTarget": "structuredAnswers.admin.referenceState",
        "safetyRelevance": "none",
        "summaryRenderer": "summary.admin.reference_available.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.admin.support_type.v1",
        "allowedAnswers": ["available", "not_available"],
        "whyWeAsk": "Reference numbers are optional routing hints, not a second admin schema.",
    },
    {
        "questionKey": "admin.referenceNumber",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "What is the reference number?",
        "answerType": "short_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin' && answers['admin.referenceAvailable'] == 'available'",
        "visibilityPredicate": "requestType == 'Admin' && answers['admin.referenceAvailable'] == 'available'",
        "normalizationTarget": "structuredAnswers.admin.referenceNumber",
        "safetyRelevance": "none",
        "summaryRenderer": "summary.admin.reference_number.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.admin.support_type.v1",
        "whyWeAsk": "The reference stays active only while the patient says it exists for this admin request.",
    },
    {
        "questionKey": "admin.details",
        "requestType": "Admin",
        "stepKey": "details",
        "promptLabel": "Tell us the practical detail we need to handle the request.",
        "answerType": "long_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Admin'",
        "visibilityPredicate": "requestType == 'Admin'",
        "normalizationTarget": "structuredAnswers.admin.patientNarrative",
        "safetyRelevance": "none",
        "summaryRenderer": "summary.admin.details.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.free_text.v1",
        "whyWeAsk": "Narrative adds context for the admin team without becoming the hidden source of typed meaning.",
    },
    {
        "questionKey": "results.context",
        "requestType": "Results",
        "stepKey": "details",
        "promptLabel": "What kind of result are you asking about?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Results'",
        "visibilityPredicate": "requestType == 'Results'",
        "normalizationTarget": "structuredAnswers.results.contextCode",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.results.context.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.results.context.v1",
        "allowedAnswers": ["blood_test", "imaging", "screening", "specialist_test", "other_result"],
        "whyWeAsk": "Result context is bounded so the later summary and route handling do not depend on prose-only interpretation.",
    },
    {
        "questionKey": "results.testName",
        "requestType": "Results",
        "stepKey": "details",
        "promptLabel": "If you know the test name, add it here.",
        "answerType": "short_text_or_unknown",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Results'",
        "visibilityPredicate": "requestType == 'Results'",
        "normalizationTarget": "structuredAnswers.results.testNameText",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.results.test_name.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.results.context.v1",
        "allowedUnknownCodes": ["test_name_unknown"],
        "whyWeAsk": "The test name may be known or unknown, but that posture is bounded in the schema instead of disappearing into free text.",
    },
    {
        "questionKey": "results.dateKnown",
        "requestType": "Results",
        "stepKey": "details",
        "promptLabel": "Do you know when the test or result happened?",
        "answerType": "single_select",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Results'",
        "visibilityPredicate": "requestType == 'Results'",
        "normalizationTarget": "structuredAnswers.results.resultDateState",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.results.date_known.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.results.date.v1",
        "allowedAnswers": ["exact_or_approx", "not_sure", "unknown"],
        "unknownHandlingPolicyRef": "UNK_140_RESULTS_DATE_BOUNDED_V1",
        "whyWeAsk": "Result dates use explicit exact, approximate, not-sure, or unknown states so drafts stay migratable and honest.",
    },
    {
        "questionKey": "results.resultDate",
        "requestType": "Results",
        "stepKey": "details",
        "promptLabel": "What date or rough date was it?",
        "answerType": "partial_date",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Results' && answers['results.dateKnown'] == 'exact_or_approx'",
        "visibilityPredicate": "requestType == 'Results' && answers['results.dateKnown'] == 'exact_or_approx'",
        "normalizationTarget": "structuredAnswers.results.resultDatePartial",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.results.date_value.v1",
        "supersessionPolicy": "SUP_140_BRANCH_SUPERSEDE_V1",
        "helpContentRef": "help.results.date.v1",
        "whyWeAsk": "The date field appears only when the patient says the date is known or approximate.",
    },
    {
        "questionKey": "results.question",
        "requestType": "Results",
        "stepKey": "details",
        "promptLabel": "What do you need to know about the result?",
        "answerType": "long_text",
        "cardinality": "single",
        "requiredWhen": "requestType == 'Results'",
        "visibilityPredicate": "requestType == 'Results'",
        "normalizationTarget": "structuredAnswers.results.patientQuestion",
        "safetyRelevance": "triage_relevant",
        "summaryRenderer": "summary.results.question.v1",
        "supersessionPolicy": "SUP_140_ALWAYS_ACTIVE_V1",
        "helpContentRef": "help.free_text.v1",
        "whyWeAsk": "The patient question stays separate from test metadata so summary and routing keep their own meaning.",
    },
]

CONDITIONAL_EXAMPLES = {
    "Symptoms": {
        "controllerQuestionKey": "symptoms.category",
        "controllerLabel": "Symptom category",
        "defaultValue": "chest_breathing",
        "options": [
            {"value": "chest_breathing", "label": "Chest or breathing"},
            {"value": "general", "label": "General symptoms"},
        ],
        "dependents": [
            {
                "questionKey": "symptoms.chestPainLocation",
                "label": "Chest or breathing location",
                "visibleWhen": ["chest_breathing"],
                "value": "centre_chest",
                "payloadLine": "structuredAnswers.symptoms.chestDiscomfortLocationCode = centre_chest",
                "summaryLine": "Location: centre chest",
                "safetyRelevant": True,
            }
        ],
        "reviewExplanation": "If the patient switches away from chest or breathing symptoms, the old location answer is superseded, removed from the active payload, and the review step must show a safety-confirmation checkpoint.",
    },
    "Meds": {
        "controllerQuestionKey": "meds.nameKnown",
        "controllerLabel": "Medicine name known",
        "defaultValue": "known",
        "options": [
            {"value": "known", "label": "Known"},
            {"value": "unknown_or_unsure", "label": "Unknown or unsure"},
        ],
        "dependents": [
            {
                "questionKey": "meds.medicineName",
                "label": "Medicine name",
                "visibleWhen": ["known"],
                "value": "Sertraline 50mg",
                "payloadLine": "structuredAnswers.meds.medicineNameText = Sertraline 50mg",
                "summaryLine": "Medicine: Sertraline 50mg",
                "safetyRelevant": False,
            },
            {
                "questionKey": "meds.nameUnknownReason",
                "label": "Unknown reason",
                "visibleWhen": ["unknown_or_unsure"],
                "value": "patient_not_sure",
                "payloadLine": "structuredAnswers.meds.medicineNameUnknownReason = patient_not_sure",
                "summaryLine": "Medicine name unknown or unsure",
                "safetyRelevant": False,
            },
        ],
        "reviewExplanation": "The bounded unknown branch keeps medication questions safe to evolve without nulls or silent remaps.",
    },
    "Admin": {
        "controllerQuestionKey": "admin.referenceAvailable",
        "controllerLabel": "Reference available",
        "defaultValue": "available",
        "options": [
            {"value": "available", "label": "Available"},
            {"value": "not_available", "label": "Not available"},
        ],
        "dependents": [
            {
                "questionKey": "admin.referenceNumber",
                "label": "Reference number",
                "visibleWhen": ["available"],
                "value": "FIT-2026-0014",
                "payloadLine": "structuredAnswers.admin.referenceNumber = FIT-2026-0014",
                "summaryLine": "Reference: FIT-2026-0014",
                "safetyRelevant": False,
            }
        ],
        "reviewExplanation": "Admin hints remain optional routing evidence; if the branch closes, the old reference becomes audit history only.",
    },
    "Results": {
        "controllerQuestionKey": "results.dateKnown",
        "controllerLabel": "Result date known",
        "defaultValue": "exact_or_approx",
        "options": [
            {"value": "exact_or_approx", "label": "Exact or approximate"},
            {"value": "not_sure", "label": "Not sure"},
            {"value": "unknown", "label": "Unknown"},
        ],
        "dependents": [
            {
                "questionKey": "results.resultDate",
                "label": "Result date",
                "visibleWhen": ["exact_or_approx"],
                "value": "2026-03",
                "payloadLine": "structuredAnswers.results.resultDatePartial = 2026-03",
                "summaryLine": "Result date: March 2026",
                "safetyRelevant": False,
            }
        ],
        "reviewExplanation": "The date field appears only when the patient says the date is known. Unknown remains an explicit state instead of a missing date that changes meaning.",
    },
}

BUNDLE_COMPATIBILITY_ROWS = [
    {
        "scenarioId": "BC_140_SAME_SEMANTICS_PATCH_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_BROWSER_STANDARD_V1_PATCH1",
        "changeClass": "content_pack_patch_only",
        "compatibilityMode": "resume_compatible",
        "migrationAction": "resume_existing_draft",
        "confirmationRequired": False,
        "notes": "Help content and non-semantic copy changed only. Question keys, requiredWhen, visibility, normalization, and summary renderer refs are unchanged.",
    },
    {
        "scenarioId": "BC_140_EMBEDDED_MANIFEST_ALIGNMENT_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_EMBEDDED_MINIMAL_V1",
        "changeClass": "embedded_manifest_and_chrome_policy",
        "compatibilityMode": "review_migration_required",
        "migrationAction": "confirm_browser_to_embedded_alignment",
        "confirmationRequired": True,
        "notes": "Question semantics are unchanged, but the embedded manifest and chrome policy differ and therefore require a governed review checkpoint before the draft resumes in a different host posture.",
    },
    {
        "scenarioId": "BC_140_OPTIONAL_BRANCH_ADDITION_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_BROWSER_STANDARD_V1_PATCH2",
        "changeClass": "new_conditional_question_same_namespace",
        "compatibilityMode": "review_migration_required",
        "migrationAction": "show_bundle_diff_and_reanswer_new_branch",
        "confirmationRequired": True,
        "notes": "A new conditional question is introduced without changing existing field meaning. Existing drafts may resume only after the patient reviews the new question set and re-acknowledges the branch.",
    },
    {
        "scenarioId": "BC_140_REQUIRED_RULE_DRIFT_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_BROWSER_STANDARD_V2",
        "changeClass": "required_when_or_visibility_drift",
        "compatibilityMode": "blocked",
        "migrationAction": "block_resume_and_open_migration_review",
        "confirmationRequired": True,
        "notes": "RequiredWhen or visibilityPredicate changed in a way that could silently change the meaning of an in-flight draft. Resume is blocked until a governed migration publishes.",
    },
    {
        "scenarioId": "BC_140_NORMALIZATION_TARGET_DRIFT_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_BROWSER_STANDARD_V3",
        "changeClass": "normalization_or_summary_drift",
        "compatibilityMode": "blocked",
        "migrationAction": "require_new_draft_or_formal_migration",
        "confirmationRequired": True,
        "notes": "Normalization target or summary renderer meaning changed. Silent reinterpretation of prior answers is forbidden.",
    },
    {
        "scenarioId": "BC_140_REQUEST_TYPE_BRANCH_CHANGE_V1",
        "appliesToRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        "currentBundleRef": "IEB_140_BROWSER_STANDARD_V1",
        "candidateBundleRef": "IEB_140_BROWSER_STANDARD_V4",
        "changeClass": "request_type_taxonomy_change",
        "compatibilityMode": "blocked",
        "migrationAction": "block_resume_and_reissue_taxonomy",
        "confirmationRequired": True,
        "notes": "A request type meaning, question set, or semantic schema changed. Existing draft semantics cannot be remapped silently.",
    },
]

REQUEST_TYPE_CHANGE_POLICY = {
    "policyRef": "RTC_140_CONFIRM_AND_SUPERSEDE_V1",
    "trigger": "requestType changes after any branch answer exists",
    "confirmationRequired": True,
    "confirmationPrompt": "Changing request type will supersede the current branch answers and start a fresh schema. Continue only if the earlier branch no longer describes the request.",
    "activePayloadEffect": "supersede_prior_branch_answers",
    "activeSummaryEffect": "remove_superseded_branch_lines",
    "auditRetention": "retain_prior_branch_answers_for_audit",
    "reviewGateWhenSafetyRelevant": True,
    "reentryRule": "new_branch_requires_fresh_answers",
    "forbiddenBehavior": "silent_semantic_remap",
}

GAP_CLOSURES = [
    {
        "gapId": "GAP_RESOLVED_140_REQUEST_TYPE_IS_NOT_LABEL_ONLY",
        "summary": "Each request type now has one semantic schema, one question set ref, one normalization namespace, and one bounded supplemental-tag policy.",
    },
    {
        "gapId": "GAP_RESOLVED_140_MEANING_NOT_INFERRED_FROM_COPY",
        "summary": "Every rendered question now carries normalizationTarget, summaryRenderer, and safetyRelevance explicitly.",
    },
    {
        "gapId": "GAP_RESOLVED_140_HIDDEN_ANSWERS_SUPERSEDED",
        "summary": "Conditional answers are superseded for audit, excluded from the active summary and payload, and can force review confirmation when safety relevant.",
    },
    {
        "gapId": "GAP_RESOLVED_140_REQUEST_TYPE_CHANGE_GOVERNED",
        "summary": "Changing request type mid-draft now requires confirm-and-supersede instead of silent remapping.",
    },
    {
        "gapId": "GAP_RESOLVED_140_BUNDLE_MIGRATION_EXPLICIT",
        "summary": "Bundle migration now publishes resume_compatible, review_migration_required, and blocked compatibility modes explicitly.",
    },
    {
        "gapId": "GAP_RESOLVED_140_UNKNOWN_VALUES_BOUNDED",
        "summary": "Meds names, result dates, and symptom onset now have bounded unknown or approximate states instead of schema-breaking null ambiguity.",
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_140_ONE_PRIMARY_REQUEST_TYPE_PER_DRAFT",
        "summary": "Phase 1 continues to allow only one primary request type per draft. Supplemental tags and narrative hints do not create a second semantic schema.",
    },
    {
        "assumptionId": "ASSUMPTION_140_SERVER_DRIVEN_QUESTION_SETS_ARE_SIMULATOR_BACKED",
        "summary": "Question sets and bundles are published through simulator-backed content bundles for now. Embedded hosts and authenticated shells must consume the same semantics later.",
    },
]

RISKS = [
    {
        "riskId": "RISK_140_BUNDLE_DRIFT_NEEDS_STRICT_GATING",
        "summary": "Any future copy, safety, or normalization drift in bundle publication must stay behind the compatibility matrix or drafts will become semantically ambiguous.",
    },
    {
        "riskId": "RISK_140_LATER_ATTACHMENT_AND_URGENT_TRACKS_MUST_NOT_FORK_THE_SCHEMA",
        "summary": "seq_141 and seq_142 may extend attachment and urgent policy, but they must consume this taxonomy and question contract instead of inventing parallel form meaning.",
    },
]


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


def slug(value: str) -> str:
    return "".join(char.lower() if char.isalnum() else "-" for char in value).strip("-")


def group_questions_by_type() -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {request_type: [] for request_type in QUESTION_SETS}
    for question in QUESTION_DEFINITIONS:
        grouped[question["requestType"]].append(question)
    return grouped


def build_taxonomy() -> dict[str, Any]:
    grouped = group_questions_by_type()
    request_types = []
    for request_type, question_set_ref in QUESTION_SETS.items():
        questions = grouped[request_type]
        request_types.append(
            {
                "requestType": request_type,
                "requestTypeSlug": slug(request_type),
                "questionSetRef": question_set_ref,
                "semanticSchemaRef": f"SEM_140_{request_type.upper()}_V1",
                "accentToken": f"request.{slug(request_type)}.accent",
                "lineArtGlyphRef": f"glyph.{slug(request_type)}.v1",
                "boundedSupplementalTagPolicy": {
                    "mode": "bounded_hint_tags_only",
                    "allowedTagKeys": SUPPLEMENTAL_TAG_POLICIES[request_type],
                    "forbidden": "second_semantic_schema",
                },
                "minimalOperationalGoal": {
                    "Symptoms": "Capture enough typed symptom detail to route triage and safety screening without diagnosis-by-copy.",
                    "Meds": "Capture one medication issue, medicine-name posture, and urgency without inventing missing identifiers.",
                    "Admin": "Capture one admin outcome with only the operationally necessary deadline or reference hints.",
                    "Results": "Capture the result context, date posture, and the patient's exact question without over-asking for unavailable metadata.",
                }[request_type],
                "normalizedFieldRefs": [question["normalizationTarget"] for question in questions],
                "questionCount": len(questions),
                "summaryRendererRefs": [question["summaryRenderer"] for question in questions],
                "unknownHandlingPolicyRefs": sorted(
                    {
                        question["unknownHandlingPolicyRef"]
                        for question in questions
                        if "unknownHandlingPolicyRef" in question
                    }
                ),
                "bundleChromePolicies": ["standard", "nhs_embedded_minimal"],
                "exampleSummaryLines": {
                    "Symptoms": [
                        "Symptoms about chest or breathing discomfort since March 2026",
                        "Worsening now: yes",
                        "Severity clues: sudden change, mobility affected",
                    ],
                    "Meds": [
                        "Medication issue: repeat supply",
                        "Medicine name known or bounded as unknown",
                        "Urgency: urgent today",
                    ],
                    "Admin": [
                        "Admin support: fit note",
                        "Deadline present only if confirmed",
                        "Reference kept only when actively declared",
                    ],
                    "Results": [
                        "Result context: blood test",
                        "Result date explicit as known, not sure, or unknown",
                        "Question captured as the patient's own wording",
                    ],
                }[request_type],
            }
        )
    return {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "capturedOn": CAPTURED_ON,
        "taxonomyId": TAXONOMY_ID,
        "sourcePrecedence": SOURCE_PRECEDENCE,
        "requestTypes": request_types,
        "questionSets": [
            {
                "questionSetRef": question_set_ref,
                "requestType": request_type,
                "questionKeys": [question["questionKey"] for question in grouped[request_type]],
            }
            for request_type, question_set_ref in QUESTION_SETS.items()
        ],
        "requestTypeChangePolicy": REQUEST_TYPE_CHANGE_POLICY,
        "supersessionPolicies": SUPERSSESSION_POLICIES,
        "unknownHandlingPolicies": UNKNOWN_HANDLING_POLICIES,
        "gapClosures": GAP_CLOSURES,
        "assumptions": ASSUMPTIONS,
        "risks": RISKS,
    }


def build_question_definitions() -> dict[str, Any]:
    return {
        "taskId": TASK_ID,
        "capturedOn": CAPTURED_ON,
        "questionDefinitionContractId": QUESTION_CONTRACT_ID,
        "draftSchemaVersion": DRAFT_SCHEMA_VERSION,
        "questionSetVersion": QUESTION_SET_VERSION,
        "contentPackVersion": CONTENT_PACK_VERSION,
        "fieldContract": QUESTION_FIELDS,
        "questionDefinitions": QUESTION_DEFINITIONS,
        "summaryRenderers": SUMMARY_RENDERERS,
        "supersessionPolicies": SUPERSSESSION_POLICIES,
        "unknownHandlingPolicies": UNKNOWN_HANDLING_POLICIES,
        "helpContent": HELP_CONTENT,
    }


def build_bundle_schema() -> dict[str, Any]:
    example_rows = [
        {
            "bundleRef": "IEB_140_BROWSER_STANDARD_V1",
            "bundleVersion": "v1.0.0",
            "draftSchemaVersion": DRAFT_SCHEMA_VERSION,
            "questionSetVersion": QUESTION_SET_VERSION,
            "contentPackVersion": CONTENT_PACK_VERSION,
            "embeddedManifestVersionRef": EMBEDDED_MANIFEST_VERSION_REF,
            "releaseApprovalFreezeRef": RELEASE_APPROVAL_FREEZE_REF,
            "minimumBridgeCapabilitiesRef": MINIMUM_BRIDGE_CAPABILITIES_REF,
            "effectiveAt": "2026-04-14T00:00:00Z",
            "expiresAt": "2026-09-30T23:59:59Z",
            "compatibilityMode": "resume_compatible",
            "embeddedChromePolicy": "standard",
            "requestTypeTaxonomyRef": TAXONOMY_ID,
            "questionDefinitionContractRef": QUESTION_CONTRACT_ID,
            "decisionTableSetRef": DECISION_TABLE_SET_ID,
            "supportedRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        },
        {
            "bundleRef": "IEB_140_EMBEDDED_MINIMAL_V1",
            "bundleVersion": "v1.0.0",
            "draftSchemaVersion": DRAFT_SCHEMA_VERSION,
            "questionSetVersion": QUESTION_SET_VERSION,
            "contentPackVersion": CONTENT_PACK_VERSION,
            "embeddedManifestVersionRef": "PEM_PHASE1_INTAKE_EMBEDDED_MINIMAL_V1",
            "releaseApprovalFreezeRef": RELEASE_APPROVAL_FREEZE_REF,
            "minimumBridgeCapabilitiesRef": MINIMUM_BRIDGE_CAPABILITIES_REF,
            "effectiveAt": "2026-04-14T00:00:00Z",
            "expiresAt": "2026-09-30T23:59:59Z",
            "compatibilityMode": "review_migration_required",
            "embeddedChromePolicy": "nhs_embedded_minimal",
            "requestTypeTaxonomyRef": TAXONOMY_ID,
            "questionDefinitionContractRef": QUESTION_CONTRACT_ID,
            "decisionTableSetRef": DECISION_TABLE_SET_ID,
            "supportedRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        },
        {
            "bundleRef": "IEB_140_BROWSER_STANDARD_V2",
            "bundleVersion": "v2.0.0",
            "draftSchemaVersion": DRAFT_SCHEMA_VERSION,
            "questionSetVersion": "INTAKE_PHASE1_QUESTION_SET_V2",
            "contentPackVersion": "INTAKE_PHASE1_CONTENT_PACK_V2",
            "embeddedManifestVersionRef": EMBEDDED_MANIFEST_VERSION_REF,
            "releaseApprovalFreezeRef": RELEASE_APPROVAL_FREEZE_REF,
            "minimumBridgeCapabilitiesRef": MINIMUM_BRIDGE_CAPABILITIES_REF,
            "effectiveAt": "2026-10-01T00:00:00Z",
            "expiresAt": "2027-03-31T23:59:59Z",
            "compatibilityMode": "blocked",
            "embeddedChromePolicy": "standard",
            "requestTypeTaxonomyRef": TAXONOMY_ID,
            "questionDefinitionContractRef": QUESTION_CONTRACT_ID,
            "decisionTableSetRef": DECISION_TABLE_SET_ID,
            "supportedRequestTypes": ["Symptoms", "Meds", "Admin", "Results"],
        },
    ]
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/contracts/phase1/intake-experience-bundle.schema.json",
        "title": "IntakeExperienceBundle",
        "description": "Pinned semantic envelope for a Phase 1 intake draft. Browser, embedded, and later authenticated shells must consume the same request-type semantics through this bundle.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "bundleRef",
            "bundleVersion",
            "draftSchemaVersion",
            "questionSetVersion",
            "contentPackVersion",
            "embeddedManifestVersionRef",
            "releaseApprovalFreezeRef",
            "minimumBridgeCapabilitiesRef",
            "effectiveAt",
            "expiresAt",
            "compatibilityMode",
            "embeddedChromePolicy",
            "requestTypeTaxonomyRef",
            "questionDefinitionContractRef",
            "decisionTableSetRef",
            "supportedRequestTypes",
        ],
        "properties": {
            "bundleRef": {"type": "string", "pattern": "^IEB_140_[A-Z0-9_]+$"},
            "bundleVersion": {"type": "string", "pattern": "^v\\d+\\.\\d+\\.\\d+$"},
            "draftSchemaVersion": {"type": "string", "const": DRAFT_SCHEMA_VERSION},
            "questionSetVersion": {"type": "string"},
            "contentPackVersion": {"type": "string"},
            "embeddedManifestVersionRef": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "minimumBridgeCapabilitiesRef": {"type": "string"},
            "effectiveAt": {"type": "string", "format": "date-time"},
            "expiresAt": {"type": "string", "format": "date-time"},
            "compatibilityMode": {
                "type": "string",
                "enum": ["resume_compatible", "review_migration_required", "blocked"],
            },
            "embeddedChromePolicy": {
                "type": "string",
                "enum": ["standard", "nhs_embedded_minimal"],
            },
            "requestTypeTaxonomyRef": {"type": "string", "const": TAXONOMY_ID},
            "questionDefinitionContractRef": {"type": "string", "const": QUESTION_CONTRACT_ID},
            "decisionTableSetRef": {"type": "string", "const": DECISION_TABLE_SET_ID},
            "supportedRequestTypes": {
                "type": "array",
                "items": {"type": "string", "enum": ["Symptoms", "Meds", "Admin", "Results"]},
                "minItems": 4,
                "uniqueItems": True,
            },
        },
        "examples": example_rows,
    }


def build_decision_tables() -> dict[str, Any]:
    visibility_rules = []
    for question in QUESTION_DEFINITIONS:
        if question["visibilityPredicate"] != f"requestType == '{question['requestType']}'":
            visibility_rules.append(
                {
                    "questionKey": question["questionKey"],
                    "requestType": question["requestType"],
                    "visibilityPredicate": question["visibilityPredicate"],
                    "requiredWhen": question["requiredWhen"],
                    "supersessionPolicy": question["supersessionPolicy"],
                }
            )
    return {
        "taskId": TASK_ID,
        "capturedOn": CAPTURED_ON,
        "decisionTableSetId": DECISION_TABLE_SET_ID,
        "requestTypeChangePolicy": REQUEST_TYPE_CHANGE_POLICY,
        "conditionalSupersessionLifecycle": [
            "Reveal dependent questions in place when the controlling answer requires them.",
            "Recompute the visible tree immediately when the controlling answer changes.",
            "Move newly hidden answers to superseded audit history and remove them from the active payload and active summary.",
            "Require review confirmation if any newly hidden answer was safety relevant.",
            "Require a fresh answer if a superseded field reappears under a later branch or later definition.",
        ],
        "requestTypeDecisionTables": [
            {
                "requestType": request_type,
                "questionSetRef": QUESTION_SETS[request_type],
                "requiredQuestionKeys": [
                    question["questionKey"]
                    for question in QUESTION_DEFINITIONS
                    if question["requestType"] == request_type
                    and question["requiredWhen"] == f"requestType == '{request_type}'"
                ],
                "conditionalQuestionKeys": [
                    question["questionKey"]
                    for question in QUESTION_DEFINITIONS
                    if question["requestType"] == request_type
                    and question["requiredWhen"] != f"requestType == '{request_type}'"
                ],
                "summaryRendererRefs": [
                    question["summaryRenderer"]
                    for question in QUESTION_DEFINITIONS
                    if question["requestType"] == request_type
                ],
                "normalizationTargetRefs": [
                    question["normalizationTarget"]
                    for question in QUESTION_DEFINITIONS
                    if question["requestType"] == request_type
                ],
                "excludeFromPhase1": {
                    "free_reasoning_fields": "Excluded because they would create hidden semantics without typed validation.",
                    "secondary_request_type_branch": "Excluded because one draft may hold only one primary request type.",
                    "decorative_questions": "Excluded because they do not support safety, triage, or minimal operational handling.",
                },
            }
            for request_type in QUESTION_SETS
        ],
        "visibilityRules": visibility_rules,
        "bundleCompatibilityRules": BUNDLE_COMPATIBILITY_ROWS,
        "unknownHandlingPolicies": UNKNOWN_HANDLING_POLICIES,
    }


def build_visibility_matrix_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for question in QUESTION_DEFINITIONS:
        rows.append(
            {
                "requestType": question["requestType"],
                "questionKey": question["questionKey"],
                "stepKey": question["stepKey"],
                "visibilityMode": "conditional"
                if question["visibilityPredicate"] != f"requestType == '{question['requestType']}'"
                else "always",
                "visibilityPredicate": question["visibilityPredicate"],
                "requiredWhen": question["requiredWhen"],
                "normalizationTarget": question["normalizationTarget"],
                "summaryRenderer": question["summaryRenderer"],
                "safetyRelevance": question["safetyRelevance"],
                "supersessionPolicy": question["supersessionPolicy"],
                "helpContentRef": question["helpContentRef"],
            }
        )
    return rows


def build_bundle_matrix_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in BUNDLE_COMPATIBILITY_ROWS:
        rows.append(
            {
                "scenarioId": row["scenarioId"],
                "appliesToRequestTypes": ",".join(row["appliesToRequestTypes"]),
                "currentBundleRef": row["currentBundleRef"],
                "candidateBundleRef": row["candidateBundleRef"],
                "changeClass": row["changeClass"],
                "compatibilityMode": row["compatibilityMode"],
                "migrationAction": row["migrationAction"],
                "confirmationRequired": "yes" if row["confirmationRequired"] else "no",
                "notes": row["notes"],
            }
        )
    return rows


def build_taxonomy_doc(taxonomy: dict[str, Any]) -> str:
    type_rows = []
    for request_type in taxonomy["requestTypes"]:
        type_rows.append(
            [
                request_type["requestType"],
                request_type["questionSetRef"],
                request_type["semanticSchemaRef"],
                str(request_type["questionCount"]),
                ", ".join(request_type["boundedSupplementalTagPolicy"]["allowedTagKeys"]),
            ]
        )
    return f"""# 140 Request Type Taxonomy

## Mission
Freeze the authoritative Phase 1 taxonomy for `Symptoms`, `Meds`, `Admin`, and `Results` so the intake journey stays server-driven and semantically stable across browser, embedded, and later authenticated shells.

## Canonical Request Types
{markdown_table(["Request type", "Question set", "Semantic schema", "Question count", "Bounded supplemental tags"], type_rows)}

## Semantic Law
- One draft carries one primary `requestType` only.
- Supplemental tags may add bounded hints, but they must not create a second semantic schema.
- Typed summary, normalization, and safety meaning come from question definitions and bundle refs, never from prose copy alone.
- Mid-draft request-type changes route through `RTC_140_CONFIRM_AND_SUPERSEDE_V1`; silent semantic remapping is forbidden.
- `IntakeExperienceBundle` remains the only semantic envelope a draft may pin while it is resumable.

## Change Governance
- `resume_compatible` applies only when question meaning, normalization targets, and summary renderer refs remain unchanged.
- `review_migration_required` applies when the same semantics need an explicit patient review before resume, such as embedded manifest alignment or additive branch publication.
- `blocked` applies when question meaning, required-field logic, request-type semantics, or normalization targets drift.

## Gap Closures
{markdown_table(["Gap", "Resolution"], [[row["gapId"], row["summary"]] for row in GAP_CLOSURES])}

## Assumptions
{markdown_table(["Assumption", "Summary"], [[row["assumptionId"], row["summary"]] for row in ASSUMPTIONS])}

## Risks
{markdown_table(["Risk", "Summary"], [[row["riskId"], row["summary"]] for row in RISKS])}
"""


def build_question_contract_doc(bundle_schema: dict[str, Any]) -> str:
    field_rows = []
    for field_name in QUESTION_FIELDS:
        description = {
            "questionKey": "Stable key for rendering, persistence, audit, and diffing.",
            "requestType": "Primary request-type branch that owns the question.",
            "stepKey": "Route-step ownership inside the frozen seq_139 journey.",
            "answerType": "Typed answer contract; meaning cannot be inferred from copy alone.",
            "cardinality": "Single or multiple answer law.",
            "requiredWhen": "Machine-readable rule for when the question becomes required.",
            "visibilityPredicate": "Machine-readable rule for whether the question is visible at all.",
            "normalizationTarget": "Exact normalized payload field the answer writes to.",
            "safetyRelevance": "Whether the answer is none, triage relevant, or safety relevant.",
            "summaryRenderer": "Stable renderer ref for patient review and downstream summary publication.",
            "supersessionPolicy": "Exact hidden-answer lifecycle and audit retention rule.",
            "helpContentRef": "Bounded content reference; help copy may change without changing field meaning.",
        }[field_name]
        field_rows.append([field_name, description])

    bundle_rows = []
    for field_name in bundle_schema["required"]:
        bundle_rows.append([field_name, json.dumps(bundle_schema["properties"][field_name], ensure_ascii=True)])

    return f"""# 140 Question Definition Contract

## Contract Fields
{markdown_table(["Field", "Why it is required"], field_rows)}

## Bundle Fields
{markdown_table(["Bundle field", "Schema excerpt"], bundle_rows)}

## Supersession Law
1. Reveal dependent questions in place when the controlling answer requires them.
2. Recompute visibility immediately when the controlling answer changes.
3. Mark newly hidden answers as superseded for audit.
4. Exclude superseded answers from the active summary and normalized payload.
5. Force review confirmation whenever a superseded answer carried `safety_relevant`.
6. Require a fresh answer when a superseded question reappears later.

## Request Type Change Law
- `RTC_140_CONFIRM_AND_SUPERSEDE_V1` is mandatory once any branch answer exists.
- The confirmation screen must explain that the old branch becomes audit-only.
- Active payload and review summary immediately switch to the new branch only after confirmation.
- If the old branch contained any `safety_relevant` answer, the review step must include a safety confirmation checkpoint before submit.

## Unknown Handling
{markdown_table(["Policy ref", "Questions", "Allowed states", "Notes"], [[row["policyRef"], ", ".join(row["appliesTo"]), ", ".join(row["allowedStates"]), row["notes"]] for row in UNKNOWN_HANDLING_POLICIES])}
"""


def build_decision_tables_doc(decision_tables: dict[str, Any]) -> str:
    visibility_rows = [
        [
            row["requestType"],
            row["questionKey"],
            row["visibilityPredicate"],
            row["requiredWhen"],
            row["supersessionPolicy"],
        ]
        for row in decision_tables["visibilityRules"]
    ]
    compatibility_rows = [
        [
            row["scenarioId"],
            ", ".join(row["appliesToRequestTypes"]),
            row["compatibilityMode"],
            row["migrationAction"],
            "yes" if row["confirmationRequired"] else "no",
        ]
        for row in BUNDLE_COMPATIBILITY_ROWS
    ]
    return f"""# 140 Questionnaire Decision Tables

## Conditional Visibility Rules
{markdown_table(["Request type", "Question", "Visibility predicate", "Required when", "Supersession policy"], visibility_rows)}

## Bundle Compatibility Rules
{markdown_table(["Scenario", "Applies to", "Compatibility mode", "Migration action", "Confirmation required"], compatibility_rows)}

## Question Set Freeze
- `Symptoms`: symptom category, onset posture, severity clues, worsening-now signal, and free narrative.
- `Meds`: medication issue class, medicine-name posture, issue description, and urgency.
- `Admin`: support type, bounded deadline posture, optional reference hint, and operational detail.
- `Results`: investigation or test context, bounded result date posture, and the patient's exact question.

## Exclusions
- No Phase 1 question may exist only because it is interesting, decorative, or useful later.
- Multi-type intake within one draft is excluded.
- Unknown values must be explicit states, not empty strings that later code might reinterpret.
"""


def build_atlas_data(taxonomy: dict[str, Any], question_definitions: dict[str, Any], decision_tables: dict[str, Any]) -> dict[str, Any]:
    grouped = group_questions_by_type()
    request_types = []
    for request_type in taxonomy["requestTypes"]:
        request_types.append(
            {
                "requestType": request_type["requestType"],
                "accent": {
                    "Symptoms": "#2F6FED",
                    "Meds": "#117A55",
                    "Admin": "#B7791F",
                    "Results": "#5B61F6",
                }[request_type["requestType"]],
                "glyphTitle": {
                    "Symptoms": "Pulse arc",
                    "Meds": "Capsule trace",
                    "Admin": "Ledger fold",
                    "Results": "Constellation lens",
                }[request_type["requestType"]],
                "cardSummary": request_type["minimalOperationalGoal"],
                "questionSetRef": request_type["questionSetRef"],
                "semanticSchemaRef": request_type["semanticSchemaRef"],
                "exampleSummaryLines": request_type["exampleSummaryLines"],
                "supplementalTags": request_type["boundedSupplementalTagPolicy"]["allowedTagKeys"],
                "questions": grouped[request_type["requestType"]],
                "bundleRows": [
                    row
                    for row in BUNDLE_COMPATIBILITY_ROWS
                    if request_type["requestType"] in row["appliesToRequestTypes"]
                ],
                "conditionalExample": CONDITIONAL_EXAMPLES[request_type["requestType"]],
            }
        )
    return {
        "taskId": TASK_ID,
        "capturedOn": CAPTURED_ON,
        "visualMode": VISUAL_MODE,
        "requestTypes": request_types,
        "requestTypeChangePolicy": REQUEST_TYPE_CHANGE_POLICY,
        "decisionTableSetId": decision_tables["decisionTableSetId"],
        "summaryRenderers": question_definitions["summaryRenderers"],
        "questionDefinitions": question_definitions["questionDefinitions"],
    }


def build_atlas_html(atlas_data: dict[str, Any], visibility_rows: list[dict[str, Any]], bundle_rows: list[dict[str, Any]]) -> str:
    data_json = json.dumps(atlas_data, indent=2)
    visibility_json = json.dumps(visibility_rows, indent=2)
    bundle_json = json.dumps(bundle_rows, indent=2)
    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>140 Request Type Questionnaire Atlas</title>
    <style>
      :root {{
        --sys-canvas: #F7F8FA;
        --sys-shell: #EEF2F6;
        --sys-panel: #FFFFFF;
        --sys-inset: #F3F6F9;
        --sys-text-strong: #0F1720;
        --sys-text-default: #24313D;
        --sys-text-muted: #5E6B78;
        --sys-border: #D8E0E8;
        --sys-blocked: #B42318;
        --shadow-soft: 0 18px 38px rgba(15, 23, 32, 0.08);
        --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}

      * {{
        box-sizing: border-box;
      }}

      html {{
        background: var(--sys-canvas);
        color: var(--sys-text-default);
        font-family: var(--font-sans);
      }}

      body {{
        margin: 0;
        background:
          radial-gradient(circle at 0% 0%, rgba(47, 111, 237, 0.1), transparent 28%),
          radial-gradient(circle at 100% 0%, rgba(91, 97, 246, 0.1), transparent 24%),
          linear-gradient(180deg, rgba(238, 242, 246, 0.92), rgba(247, 248, 250, 1));
      }}

      body.reduced-motion *,
      body.reduced-motion *::before,
      body.reduced-motion *::after {{
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }}

      button,
      input,
      select {{
        font: inherit;
      }}

      .page {{
        max-width: 1440px;
        margin: 0 auto;
        padding: 0 24px 56px;
      }}

      .hero {{
        padding: 20px 0 12px;
      }}

      .hero-band {{
        min-height: 88px;
        display: grid;
        grid-template-columns: minmax(0, 360px) repeat(4, minmax(0, 1fr));
        gap: 14px;
        align-items: stretch;
      }}

      .brand-block,
      .type-card,
      .narrative-panel,
      .canvas-panel,
      .tables-panel {{
        background: var(--sys-panel);
        border: 1px solid var(--sys-border);
        border-radius: 28px;
        box-shadow: var(--shadow-soft);
      }}

      .brand-block {{
        padding: 18px 22px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 246, 249, 0.98));
      }}

      .wordmark {{
        font-size: 14px;
        line-height: 20px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--sys-text-strong);
      }}

      .brand-block h1 {{
        margin: 8px 0 0;
        font-size: 28px;
        line-height: 34px;
        color: var(--sys-text-strong);
      }}

      .brand-block p {{
        margin: 6px 0 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
        max-width: 42ch;
      }}

      .hero-note {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(47, 111, 237, 0.08);
        color: #2F6FED;
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
      }}

      .type-card {{
        position: relative;
        overflow: hidden;
        padding: 16px 18px 18px;
        text-align: left;
        cursor: pointer;
        transition:
          transform 140ms ease,
          box-shadow 140ms ease,
          border-color 140ms ease,
          background 140ms ease;
      }}

      .type-card:nth-of-type(2) {{
        padding-top: 22px;
      }}

      .type-card:nth-of-type(3) {{
        padding-top: 14px;
      }}

      .type-card:nth-of-type(4) {{
        padding-top: 26px;
      }}

      .type-card:nth-of-type(5) {{
        padding-top: 18px;
      }}

      .type-card::after {{
        content: "";
        position: absolute;
        inset: auto auto -28px -18px;
        width: 160px;
        height: 96px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(15, 23, 32, 0.06), transparent 70%);
        pointer-events: none;
      }}

      .type-card:hover,
      .type-card:focus-visible {{
        outline: none;
        transform: translateY(-2px);
      }}

      .type-card:focus-visible {{
        box-shadow: 0 0 0 4px rgba(47, 111, 237, 0.14), var(--shadow-soft);
      }}

      .type-card[data-selected="true"] {{
        transform: translateY(-3px);
        border-width: 1px;
      }}

      .type-card .glyph {{
        display: inline-flex;
        width: 48px;
        height: 48px;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(15, 23, 32, 0.08);
      }}

      .type-card strong {{
        display: block;
        margin-top: 18px;
        font-size: 18px;
        line-height: 24px;
        color: var(--sys-text-strong);
      }}

      .type-card span {{
        display: block;
        margin-top: 6px;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .main-grid {{
        margin-top: 18px;
        display: grid;
        grid-template-columns: minmax(0, 520px) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }}

      .main-grid > * {{
        min-width: 0;
      }}

      .narrative-panel,
      .canvas-panel,
      .tables-panel {{
        padding: 22px;
      }}

      .panel-head {{
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }}

      .panel-head h2 {{
        margin: 0;
        font-size: 22px;
        line-height: 28px;
        color: var(--sys-text-strong);
      }}

      .panel-head p {{
        margin: 6px 0 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .mini-chip {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--sys-inset);
        color: var(--sys-text-default);
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
      }}

      .schema-strip,
      .tag-strip,
      .why-strip,
      .summary-card,
      .review-note {{
        margin-top: 18px;
        border-radius: 20px;
        border: 1px solid var(--sys-border);
      }}

      .schema-strip,
      .tag-strip {{
        padding: 14px 16px;
        background: var(--sys-inset);
      }}

      .schema-strip dl {{
        margin: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px 14px;
      }}

      .schema-strip dt {{
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .schema-strip dd {{
        margin: 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-strong);
        text-align: right;
      }}

      .tag-strip {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }}

      .tag-strip span {{
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(15, 23, 32, 0.06);
        font-size: 12px;
        line-height: 18px;
      }}

      .why-strip {{
        padding: 14px 16px;
        background: linear-gradient(180deg, rgba(247, 248, 250, 1), rgba(243, 246, 249, 0.92));
      }}

      .why-strip strong {{
        display: block;
        font-size: 13px;
        line-height: 20px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sys-text-muted);
      }}

      .why-strip p {{
        margin: 6px 0 0;
        font-size: 16px;
        line-height: 24px;
        color: var(--sys-text-default);
      }}

      .summary-card {{
        padding: 16px 18px;
        background:
          radial-gradient(circle at right top, rgba(47, 111, 237, 0.08), transparent 36%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 249, 0.94));
      }}

      .summary-card h3,
      .conditional-demo h3,
      .canvas-panel h3,
      .tables-panel h3 {{
        margin: 0;
        font-size: 16px;
        line-height: 24px;
        color: var(--sys-text-strong);
      }}

      .summary-card ul,
      .ledger-list,
      .bundle-list {{
        margin: 12px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }}

      .summary-card li,
      .ledger-list li,
      .bundle-list li {{
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(15, 23, 32, 0.08);
        font-size: 14px;
        line-height: 20px;
      }}

      .conditional-demo {{
        margin-top: 20px;
      }}

      .conditional-demo header {{
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }}

      .conditional-demo p {{
        margin: 6px 0 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .option-row {{
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }}

      .option-row button,
      .tablist button {{
        border: 1px solid var(--sys-border);
        background: var(--sys-panel);
        color: var(--sys-text-default);
        border-radius: 999px;
        padding: 9px 14px;
        cursor: pointer;
        transition:
          border-color 140ms ease,
          background 140ms ease,
          color 140ms ease,
          box-shadow 140ms ease,
          transform 140ms ease;
      }}

      .option-row button:hover,
      .option-row button:focus-visible,
      .tablist button:hover,
      .tablist button:focus-visible {{
        outline: none;
        border-color: rgba(47, 111, 237, 0.38);
        box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
      }}

      .option-row button[data-selected="true"],
      .tablist button[aria-selected="true"] {{
        color: white;
        transform: translateY(-1px);
      }}

      .field-grid {{
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }}

      .field-card,
      .ledger-card,
      .bundle-card {{
        padding: 14px;
        border-radius: 18px;
        background: var(--sys-inset);
        border: 1px solid var(--sys-border);
      }}

      .field-card strong,
      .ledger-card strong,
      .bundle-card strong {{
        display: block;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-strong);
      }}

      .field-card span,
      .ledger-card span,
      .bundle-card span {{
        display: block;
        margin-top: 6px;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-text-muted);
      }}

      .ledger-grid {{
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }}

      .review-note {{
        padding: 14px 16px;
        background: rgba(180, 35, 24, 0.05);
        border-color: rgba(180, 35, 24, 0.18);
      }}

      .review-note strong {{
        display: block;
        font-size: 13px;
        line-height: 20px;
        color: var(--sys-blocked);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }}

      .review-note p {{
        margin: 6px 0 0;
        color: var(--sys-text-default);
      }}

      .canvas-head {{
        display: grid;
        grid-template-columns: minmax(0, 1fr) 240px;
        gap: 16px;
      }}

      .constellation-card,
      .bundle-card {{
        min-width: 0;
      }}

      .constellation-card svg {{
        width: 100%;
        height: 180px;
        display: block;
      }}

      .tree-layout {{
        margin-top: 16px;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
        gap: 16px;
        align-items: start;
      }}

      .tree-root {{
        display: grid;
        gap: 12px;
      }}

      .tree-node {{
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--sys-border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 246, 249, 0.98));
        min-width: 0;
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease,
          transform 140ms ease;
      }}

      .tree-node[data-depth="1"] {{
        margin-left: 28px;
      }}

      .tree-node[data-depth="2"] {{
        margin-left: 56px;
      }}

      .tree-node strong {{
        display: block;
        font-size: 14px;
        line-height: 20px;
        color: var(--sys-text-strong);
      }}

      .tree-node span {{
        display: block;
        margin-top: 6px;
        font-size: 12px;
        line-height: 18px;
        color: var(--sys-text-muted);
      }}

      .tree-node[data-conditional="true"] {{
        border-style: dashed;
      }}

      .tree-node[data-highlighted="true"] {{
        transform: translateY(-1px);
      }}

      .table-card {{
        border-radius: 18px;
        border: 1px solid var(--sys-border);
        background: var(--sys-panel);
        overflow: hidden;
        min-width: 0;
      }}

      table {{
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 13px;
        line-height: 20px;
      }}

      th,
      td {{
        padding: 10px 12px;
        border-bottom: 1px solid rgba(216, 224, 232, 0.7);
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
        word-break: break-word;
      }}

      th {{
        background: rgba(243, 246, 249, 0.92);
        color: var(--sys-text-strong);
        font-size: 12px;
        line-height: 18px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }}

      tbody tr:last-child td {{
        border-bottom: none;
      }}

      .compat-chip {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        border-radius: 999px;
        font-size: 12px;
        line-height: 18px;
        font-weight: 700;
      }}

      .compat-chip[data-mode="resume_compatible"] {{
        background: rgba(17, 122, 85, 0.12);
        color: #117A55;
      }}

      .compat-chip[data-mode="review_migration_required"] {{
        background: rgba(183, 121, 31, 0.12);
        color: #B7791F;
      }}

      .compat-chip[data-mode="blocked"] {{
        background: rgba(180, 35, 24, 0.1);
        color: #B42318;
      }}

      .tables-panel {{
        margin-top: 18px;
      }}

      .tablist {{
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }}

      .table-stack {{
        margin-top: 16px;
        display: grid;
        gap: 16px;
      }}

      .table-panel[hidden] {{
        display: none !important;
      }}

      .mission-stack-caption {{
        display: none;
      }}

      @media (max-width: 1180px) {{
        .hero-band {{
          grid-template-columns: minmax(0, 1fr) repeat(2, minmax(0, 1fr));
        }}

        .main-grid,
        .tree-layout,
        .canvas-head,
        .ledger-grid {{
          grid-template-columns: minmax(0, 1fr);
        }}
      }}

      @media (max-width: 980px) {{
        .page {{
          padding: 0 16px 44px;
        }}

        .hero-band {{
          grid-template-columns: minmax(0, 1fr);
        }}

        .field-grid,
        .ledger-grid {{
          grid-template-columns: minmax(0, 1fr);
        }}

        .mission-stack-caption {{
          display: inline-flex;
        }}
      }}
    </style>
  </head>
  <body data-layout="desk_grid">
    <div class="page" data-testid="request-type-atlas">
      <section class="hero">
        <div class="hero-band" data-testid="hero-band">
          <div class="brand-block">
            <div>
              <div class="wordmark">Vecells</div>
              <h1>Request Type Atlas</h1>
              <p>
                One exact taxonomy, one question-definition contract, and one bundle compatibility law for every Phase 1 intake draft.
              </p>
            </div>
            <span class="hero-note mission-stack-caption" data-testid="mission-stack-caption">mission_stack ready</span>
          </div>
          <button class="type-card" type="button" data-testid="request-type-card-Symptoms"></button>
          <button class="type-card" type="button" data-testid="request-type-card-Meds"></button>
          <button class="type-card" type="button" data-testid="request-type-card-Admin"></button>
          <button class="type-card" type="button" data-testid="request-type-card-Results"></button>
        </div>
      </section>

      <main class="main-grid">
        <section class="narrative-panel" data-testid="narrative-column">
          <div class="panel-head">
            <div>
              <h2 id="type-title"></h2>
              <p id="type-summary"></p>
            </div>
            <span class="mini-chip" data-testid="selected-question-set"></span>
          </div>

          <div class="schema-strip">
            <dl>
              <dt>Semantic schema</dt>
              <dd id="schema-ref"></dd>
              <dt>Question count</dt>
              <dd id="question-count"></dd>
              <dt>Supplemental tags</dt>
              <dd id="supplemental-tag-count"></dd>
            </dl>
          </div>

          <div class="tag-strip" data-testid="supplemental-tag-strip"></div>

          <div class="why-strip" data-testid="why-strip">
            <strong>Why we ask this</strong>
            <p id="why-strip-copy"></p>
          </div>

          <div class="summary-card" data-testid="example-summary-card">
            <h3>Example summary card</h3>
            <ul id="summary-lines"></ul>
          </div>

          <section class="conditional-demo" data-testid="conditional-demo">
            <header>
              <div>
                <h3>Conditional reveal example</h3>
                <p id="conditional-description"></p>
              </div>
              <span class="mini-chip" data-testid="conditional-controller-label"></span>
            </header>
            <div class="option-row" data-testid="conditional-options"></div>
            <div class="field-grid" data-testid="conditional-fields"></div>
            <div class="ledger-grid">
              <div class="ledger-card">
                <strong>Active payload</strong>
                <ul class="ledger-list" data-testid="active-payload"></ul>
              </div>
              <div class="ledger-card">
                <strong>Active summary</strong>
                <ul class="ledger-list" data-testid="active-summary"></ul>
              </div>
              <div class="ledger-card">
                <strong>Superseded audit</strong>
                <ul class="ledger-list" data-testid="superseded-audit"></ul>
              </div>
            </div>
            <div class="review-note" data-testid="review-confirmation-note">
              <strong>Review rule</strong>
              <p id="review-note-copy"></p>
            </div>
          </section>
        </section>

        <section class="canvas-panel" data-testid="branching-canvas">
          <div class="canvas-head">
            <div class="constellation-card">
              <div class="panel-head">
                <div>
                  <h2>Constellation and branch tree</h2>
                  <p>Selecting a request type updates the branch tree and table parity in place.</p>
                </div>
              </div>
              <div data-testid="constellation-diagram" id="constellation-diagram"></div>
            </div>
            <div class="bundle-card" data-testid="bundle-notes">
              <strong>Bundle compatibility notes</strong>
              <ul class="bundle-list" id="bundle-list"></ul>
            </div>
          </div>

          <div class="tree-layout">
            <div>
              <h3>Question visibility tree</h3>
              <div class="tree-root" data-testid="tree-canvas" id="tree-canvas"></div>
            </div>
            <div class="table-card">
              <table data-testid="tree-parity-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Visibility</th>
                    <th>Safety</th>
                  </tr>
                </thead>
                <tbody id="tree-parity-body"></tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <section class="tables-panel" data-testid="tables-panel">
        <div class="panel-head">
          <div>
            <h2>Decision tables and matrices</h2>
            <p>Each table is filtered from the same machine-readable question and bundle contracts.</p>
          </div>
          <span class="hero-note" data-testid="layout-mode-chip">Request_Type_Atlas</span>
        </div>

        <div class="tablist" role="tablist" aria-label="Decision table views" data-testid="table-tabs">
          <button type="button" role="tab" id="tab-decision" data-testid="table-tab-decision">Question rules</button>
          <button type="button" role="tab" id="tab-visibility" data-testid="table-tab-visibility">Visibility matrix</button>
          <button type="button" role="tab" id="tab-bundle" data-testid="table-tab-bundle">Bundle compatibility</button>
        </div>

        <div class="table-stack">
          <div class="table-panel" data-testid="table-panel-decision">
            <div class="table-card">
              <table data-testid="decision-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Required when</th>
                    <th>Normalization target</th>
                    <th>Summary renderer</th>
                    <th>Safety</th>
                  </tr>
                </thead>
                <tbody id="decision-body"></tbody>
              </table>
            </div>
          </div>

          <div class="table-panel" data-testid="table-panel-visibility" hidden>
            <div class="table-card">
              <table data-testid="visibility-matrix">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Visibility mode</th>
                    <th>Visibility predicate</th>
                    <th>Supersession</th>
                  </tr>
                </thead>
                <tbody id="visibility-body"></tbody>
              </table>
            </div>
          </div>

          <div class="table-panel" data-testid="table-panel-bundle" hidden>
            <div class="table-card">
              <table data-testid="bundle-matrix">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Change class</th>
                    <th>Compatibility</th>
                    <th>Migration action</th>
                  </tr>
                </thead>
                <tbody id="bundle-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>

    <script type="application/json" id="atlas-data">{data_json}</script>
    <script type="application/json" id="visibility-matrix-data">{visibility_json}</script>
    <script type="application/json" id="bundle-matrix-data">{bundle_json}</script>
    <script>
      const ATLAS_DATA = JSON.parse(document.getElementById("atlas-data").textContent);
      const VISIBILITY_ROWS = JSON.parse(document.getElementById("visibility-matrix-data").textContent);
      const BUNDLE_ROWS = JSON.parse(document.getElementById("bundle-matrix-data").textContent);
      const REQUEST_TYPES = ATLAS_DATA.requestTypes;

      const state = {{
        selectedType: REQUEST_TYPES[0].requestType,
        selectedTab: "decision",
        conditionalSelections: Object.fromEntries(
          REQUEST_TYPES.map((item) => [item.requestType, item.conditionalExample.defaultValue]),
        ),
        supersededAudit: Object.fromEntries(REQUEST_TYPES.map((item) => [item.requestType, []])),
      }};

      const cardNodes = REQUEST_TYPES.map((item) =>
        document.querySelector(`[data-testid="request-type-card-${{item.requestType}}"]`),
      );
      const tabNodes = [
        document.querySelector('[data-testid="table-tab-decision"]'),
        document.querySelector('[data-testid="table-tab-visibility"]'),
        document.querySelector('[data-testid="table-tab-bundle"]'),
      ];
      const tabIds = ["decision", "visibility", "bundle"];

      function applyLayout() {{
        document.body.dataset.layout = window.innerWidth <= 980 ? "mission_stack" : "desk_grid";
      }}

      function applyReducedMotion() {{
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.body.classList.toggle("reduced-motion", reduced);
      }}

      function getSelectedType() {{
        return REQUEST_TYPES.find((item) => item.requestType === state.selectedType);
      }}

      function getVisibleQuestions(typeRecord) {{
        return typeRecord.questions.map((question) => {{
          const isConditional =
            question.visibilityPredicate !== `requestType == '${{question.requestType}}'`;
          let depth = 1;
          if (question.questionKey.includes("onsetDate") || question.questionKey.includes("onsetWindow")) {{
            depth = 2;
          }}
          if (
            question.questionKey === "symptoms.chestPainLocation" ||
            question.questionKey === "meds.medicineName" ||
            question.questionKey === "meds.nameUnknownReason" ||
            question.questionKey === "admin.deadlineDate" ||
            question.questionKey === "admin.referenceNumber" ||
            question.questionKey === "results.resultDate"
          ) {{
            depth = 2;
          }}
          return {{
            ...question,
            conditional: isConditional,
            depth,
          }};
        }});
      }}

      function renderCards() {{
        cardNodes.forEach((node, index) => {{
          const item = REQUEST_TYPES[index];
          const selected = item.requestType === state.selectedType;
          node.dataset.selected = String(selected);
          node.setAttribute("aria-pressed", String(selected));
          node.setAttribute("aria-label", item.requestType);
          node.style.borderColor = selected ? item.accent : "var(--sys-border)";
          node.style.background = selected
            ? `linear-gradient(180deg, rgba(255,255,255,0.98), ${{item.accent}}18)`
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,246,249,0.95))";
          node.style.boxShadow = selected
            ? `0 20px 38px ${{item.accent}}24`
            : "var(--shadow-soft)";
          node.innerHTML = `
            <span class="glyph" aria-hidden="true">${{renderGlyph(item)}}</span>
            <strong>${{item.requestType}}</strong>
            <span>${{item.cardSummary}}</span>
          `;
        }});
      }}

      function renderGlyph(item) {{
        return `
          <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="${{item.accent}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${{
              {{
                Symptoms: '<path d="M6 28c4-8 8-12 12-12s8 6 12 6 8-10 12-16" /><path d="M10 34h28" />',
                Meds: '<rect x="10" y="14" width="28" height="20" rx="10" /><path d="M24 14v20" />',
                Admin: '<path d="M14 10h16l8 8v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z" /><path d="M30 10v10h10" />',
                Results: '<circle cx="20" cy="20" r="8" /><path d="M28 28l10 10" /><path d="M16 20h8" />',
              }}[item.requestType]
            }}
          </svg>
        `;
      }}

      function renderNarrative(typeRecord) {{
        document.getElementById("type-title").textContent = typeRecord.requestType;
        document.getElementById("type-summary").textContent = typeRecord.cardSummary;
        document.getElementById("schema-ref").textContent = typeRecord.semanticSchemaRef;
        document.getElementById("question-count").textContent = String(typeRecord.questions.length);
        document.getElementById("supplemental-tag-count").textContent = String(typeRecord.supplementalTags.length);
        document.querySelector('[data-testid="selected-question-set"]').textContent = typeRecord.questionSetRef;
        document.getElementById("why-strip-copy").textContent = typeRecord.questions[0].whyWeAsk;
        const tagStrip = document.querySelector('[data-testid="supplemental-tag-strip"]');
        tagStrip.innerHTML = "";
        typeRecord.supplementalTags.forEach((tag) => {{
          const chip = document.createElement("span");
          chip.textContent = tag;
          tagStrip.appendChild(chip);
        }});
        const summaryList = document.getElementById("summary-lines");
        summaryList.innerHTML = "";
        typeRecord.exampleSummaryLines.forEach((line) => {{
          const item = document.createElement("li");
          item.textContent = line;
          summaryList.appendChild(item);
        }});
      }}

      function renderConstellation(typeRecord) {{
        const svg = `
          <svg viewBox="0 0 560 180" role="img" aria-label="Request-type constellation">
            <path d="M88 92C150 40 218 34 280 72C334 104 408 112 470 86" stroke="#D8E0E8" stroke-width="2" fill="none" />
            ${{REQUEST_TYPES.map((item, index) => {{
              const x = [84, 210, 338, 470][index];
              const y = [94, 58, 104, 82][index];
              const selected = item.requestType === typeRecord.requestType;
              const radius = selected ? 22 : 15;
              return `
                <g>
                  <circle cx="${{x}}" cy="${{y}}" r="${{radius}}" fill="${{selected ? item.accent + '22' : '#FFFFFF'}}" stroke="${{item.accent}}" stroke-width="${{selected ? 4 : 2}}" />
                  <text x="${{x}}" y="${{y + 42}}" text-anchor="middle" fill="#24313D" font-size="13" font-family="var(--font-sans)">${{item.requestType}}</text>
                </g>
              `;
            }}).join("")}}
          </svg>
        `;
        document.getElementById("constellation-diagram").innerHTML = svg;
      }}

      function renderTree(typeRecord) {{
        const questions = getVisibleQuestions(typeRecord);
        const treeCanvas = document.getElementById("tree-canvas");
        const treeParityBody = document.getElementById("tree-parity-body");
        treeCanvas.innerHTML = "";
        treeParityBody.innerHTML = "";

        questions.forEach((question, index) => {{
          const treeNode = document.createElement("div");
          treeNode.className = "tree-node";
          treeNode.dataset.depth = String(question.depth);
          treeNode.dataset.conditional = String(question.conditional);
          treeNode.dataset.highlighted = String(index === 0);
          treeNode.dataset.testid = `tree-node-${{question.questionKey}}`;
          treeNode.setAttribute("data-testid", `tree-node-${{question.questionKey}}`);
          treeNode.innerHTML = `
            <strong>${{question.questionKey}}</strong>
            <span>${{question.conditional ? question.visibilityPredicate : "always visible on this request type"}}</span>
          `;
          treeCanvas.appendChild(treeNode);

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{question.questionKey}}</td>
            <td>${{question.conditional ? "conditional" : "always"}}</td>
            <td>${{question.safetyRelevance}}</td>
          `;
          treeParityBody.appendChild(row);
        }});
      }}

      function getCurrentDemoState(typeRecord) {{
        const selectedValue = state.conditionalSelections[typeRecord.requestType];
        const superseded = state.supersededAudit[typeRecord.requestType];
        return {{ selectedValue, superseded }};
      }}

      function updateConditionalSelection(typeRecord, nextValue) {{
        const priorValue = state.conditionalSelections[typeRecord.requestType];
        const demo = typeRecord.conditionalExample;
        const priorVisible = demo.dependents.filter((item) => item.visibleWhen.includes(priorValue));
        const nextVisible = demo.dependents.filter((item) => item.visibleWhen.includes(nextValue));
        const hidden = priorVisible.filter(
          (item) => !nextVisible.some((candidate) => candidate.questionKey === item.questionKey),
        );
        hidden.forEach((item) => {{
          state.supersededAudit[typeRecord.requestType].push({{
            questionKey: item.questionKey,
            value: item.value,
            safetyRelevant: item.safetyRelevant,
          }});
        }});
        state.conditionalSelections[typeRecord.requestType] = nextValue;
        render();
      }}

      function renderConditionalDemo(typeRecord) {{
        const demo = typeRecord.conditionalExample;
        const demoState = getCurrentDemoState(typeRecord);
        document.getElementById("conditional-description").textContent = demo.reviewExplanation;
        document.querySelector('[data-testid="conditional-controller-label"]').textContent = demo.controllerLabel;

        const optionRow = document.querySelector('[data-testid="conditional-options"]');
        optionRow.innerHTML = "";
        demo.options.forEach((option) => {{
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = option.label;
          button.dataset.selected = String(option.value === demoState.selectedValue);
          button.setAttribute("data-testid", `conditional-option-${{typeRecord.requestType}}-${{option.value}}`);
          button.style.background = option.value === demoState.selectedValue ? typeRecord.accent : "var(--sys-panel)";
          button.style.color = option.value === demoState.selectedValue ? "#FFFFFF" : "var(--sys-text-default)";
          button.addEventListener("click", () => updateConditionalSelection(typeRecord, option.value));
          optionRow.appendChild(button);
        }});

        const visibleDependents = demo.dependents.filter((item) => item.visibleWhen.includes(demoState.selectedValue));
        const fieldGrid = document.querySelector('[data-testid="conditional-fields"]');
        fieldGrid.innerHTML = "";
        visibleDependents.forEach((item) => {{
          const card = document.createElement("div");
          card.className = "field-card";
          card.setAttribute("data-testid", `conditional-field-${{item.questionKey}}`);
          card.innerHTML = `<strong>${{item.label}}</strong><span>${{item.value}}</span>`;
          fieldGrid.appendChild(card);
        }});

        const activePayload = document.querySelector('[data-testid="active-payload"]');
        const activeSummary = document.querySelector('[data-testid="active-summary"]');
        activePayload.innerHTML = "";
        activeSummary.innerHTML = "";
        visibleDependents.forEach((item) => {{
          const payloadItem = document.createElement("li");
          payloadItem.textContent = item.payloadLine;
          activePayload.appendChild(payloadItem);
          const summaryItem = document.createElement("li");
          summaryItem.textContent = item.summaryLine;
          activeSummary.appendChild(summaryItem);
        }});

        const supersededAudit = document.querySelector('[data-testid="superseded-audit"]');
        supersededAudit.innerHTML = "";
        demoState.superseded.forEach((item) => {{
          const auditItem = document.createElement("li");
          const auditMode = item.safetyRelevant ? "safety review" : "audit only";
          auditItem.textContent = `${{item.questionKey}} superseded (${{auditMode}}): ${{item.value}}`;
          supersededAudit.appendChild(auditItem);
        }});

        const reviewNote = document.getElementById("review-note-copy");
        const reviewRequired = demoState.superseded.some((item) => item.safetyRelevant);
        reviewNote.textContent = reviewRequired
          ? "A safety-relevant answer was hidden by the new branch. The review step must show a confirmation checkpoint before submit."
          : demo.reviewExplanation;
      }}

      function renderBundleNotes(typeRecord) {{
        const bundleList = document.getElementById("bundle-list");
        bundleList.innerHTML = "";
        typeRecord.bundleRows.forEach((row) => {{
          const item = document.createElement("li");
          item.innerHTML = `
            <span class="compat-chip" data-mode="${{row.compatibilityMode}}">${{row.compatibilityMode}}</span>
            <strong style="margin-top:10px; display:block;">${{row.changeClass}}</strong>
            <span>${{row.notes}}</span>
          `;
          bundleList.appendChild(item);
        }});
      }}

      function renderDecisionTables(typeRecord) {{
        const decisionBody = document.getElementById("decision-body");
        const visibilityBody = document.getElementById("visibility-body");
        const bundleBody = document.getElementById("bundle-body");
        decisionBody.innerHTML = "";
        visibilityBody.innerHTML = "";
        bundleBody.innerHTML = "";

        typeRecord.questions.forEach((question) => {{
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${{question.questionKey}}</td>
            <td>${{question.requiredWhen}}</td>
            <td>${{question.normalizationTarget}}</td>
            <td>${{question.summaryRenderer}}</td>
            <td>${{question.safetyRelevance}}</td>
          `;
          decisionBody.appendChild(row);
        }});

        VISIBILITY_ROWS.filter((row) => row.requestType === typeRecord.requestType).forEach((row) => {{
          const item = document.createElement("tr");
          item.innerHTML = `
            <td>${{row.questionKey}}</td>
            <td>${{row.visibilityMode}}</td>
            <td>${{row.visibilityPredicate}}</td>
            <td>${{row.supersessionPolicy}}</td>
          `;
          visibilityBody.appendChild(item);
        }});

        BUNDLE_ROWS.filter((row) =>
          row.appliesToRequestTypes.split(",").includes(typeRecord.requestType),
        ).forEach((row) => {{
          const item = document.createElement("tr");
          item.innerHTML = `
            <td>${{row.scenarioId}}</td>
            <td>${{row.changeClass}}</td>
            <td><span class="compat-chip" data-mode="${{row.compatibilityMode}}">${{row.compatibilityMode}}</span></td>
            <td>${{row.migrationAction}}</td>
          `;
          bundleBody.appendChild(item);
        }});
      }}

      function renderTabs() {{
        tabNodes.forEach((node, index) => {{
          const active = tabIds[index] === state.selectedTab;
          node.setAttribute("aria-selected", String(active));
          node.setAttribute("tabindex", active ? "0" : "-1");
          node.style.background = active ? "#24313D" : "var(--sys-panel)";
          node.style.color = active ? "#FFFFFF" : "var(--sys-text-default)";
          document.querySelector(`[data-testid="table-panel-${{tabIds[index]}}"]`).hidden = !active;
        }});
      }}

      function render() {{
        const typeRecord = getSelectedType();
        renderCards();
        renderNarrative(typeRecord);
        renderConstellation(typeRecord);
        renderTree(typeRecord);
        renderConditionalDemo(typeRecord);
        renderBundleNotes(typeRecord);
        renderDecisionTables(typeRecord);
        renderTabs();
      }}

      function moveCardSelection(delta) {{
        const currentIndex = REQUEST_TYPES.findIndex((item) => item.requestType === state.selectedType);
        const nextIndex = (currentIndex + delta + REQUEST_TYPES.length) % REQUEST_TYPES.length;
        state.selectedType = REQUEST_TYPES[nextIndex].requestType;
        render();
        cardNodes[nextIndex].focus();
      }}

      function moveTabSelection(delta) {{
        const currentIndex = tabIds.indexOf(state.selectedTab);
        const nextIndex = (currentIndex + delta + tabIds.length) % tabIds.length;
        state.selectedTab = tabIds[nextIndex];
        render();
        tabNodes[nextIndex].focus();
      }}

      cardNodes.forEach((node, index) => {{
        node.addEventListener("click", () => {{
          state.selectedType = REQUEST_TYPES[index].requestType;
          render();
        }});
        node.addEventListener("keydown", (event) => {{
          if (event.key === "ArrowRight") {{
            event.preventDefault();
            moveCardSelection(1);
          }} else if (event.key === "ArrowLeft") {{
            event.preventDefault();
            moveCardSelection(-1);
          }} else if (event.key === "Home") {{
            event.preventDefault();
            state.selectedType = REQUEST_TYPES[0].requestType;
            render();
            cardNodes[0].focus();
          }} else if (event.key === "End") {{
            event.preventDefault();
            state.selectedType = REQUEST_TYPES[REQUEST_TYPES.length - 1].requestType;
            render();
            cardNodes[REQUEST_TYPES.length - 1].focus();
          }} else if (event.key === " " || event.key === "Enter") {{
            event.preventDefault();
            state.selectedType = REQUEST_TYPES[index].requestType;
            render();
          }}
        }});
      }});

      tabNodes.forEach((node, index) => {{
        node.addEventListener("click", () => {{
          state.selectedTab = tabIds[index];
          render();
        }});
        node.addEventListener("keydown", (event) => {{
          if (event.key === "ArrowRight") {{
            event.preventDefault();
            moveTabSelection(1);
          }} else if (event.key === "ArrowLeft") {{
            event.preventDefault();
            moveTabSelection(-1);
          }} else if (event.key === "Home") {{
            event.preventDefault();
            state.selectedTab = tabIds[0];
            render();
            tabNodes[0].focus();
          }} else if (event.key === "End") {{
            event.preventDefault();
            state.selectedTab = tabIds[tabIds.length - 1];
            render();
            tabNodes[tabIds.length - 1].focus();
          }}
        }});
      }});

      window.addEventListener("resize", applyLayout);
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyReducedMotion);
      applyLayout();
      applyReducedMotion();
      render();
    </script>
  </body>
</html>
"""


def main() -> None:
    ensure(PHASE1_DRAFT_SCHEMA_PATH.exists(), "PREREQUISITE_GAP_140_PHASE1_DRAFT_SCHEMA_MISSING")
    phase1_draft_schema = load_json(PHASE1_DRAFT_SCHEMA_PATH)
    ensure(
        phase1_draft_schema["properties"]["requestType"]["enum"] == ["Symptoms", "Meds", "Admin", "Results"],
        "PREREQUISITE_GAP_140_REQUEST_TYPE_ENUM_DRIFT",
    )

    taxonomy = build_taxonomy()
    question_definitions = build_question_definitions()
    bundle_schema = build_bundle_schema()
    decision_tables = build_decision_tables()
    visibility_rows = build_visibility_matrix_rows()
    bundle_rows = build_bundle_matrix_rows()
    atlas_data = build_atlas_data(taxonomy, question_definitions, decision_tables)

    write_json(TAXONOMY_PATH, taxonomy)
    write_json(BUNDLE_SCHEMA_PATH, bundle_schema)
    write_json(QUESTION_DEFINITIONS_PATH, question_definitions)
    write_text(DECISION_TABLES_PATH, json.dumps(decision_tables, indent=2))
    write_csv(
        VISIBILITY_MATRIX_PATH,
        visibility_rows,
        [
            "requestType",
            "questionKey",
            "stepKey",
            "visibilityMode",
            "visibilityPredicate",
            "requiredWhen",
            "normalizationTarget",
            "summaryRenderer",
            "safetyRelevance",
            "supersessionPolicy",
            "helpContentRef",
        ],
    )
    write_csv(
        BUNDLE_MATRIX_PATH,
        bundle_rows,
        [
            "scenarioId",
            "appliesToRequestTypes",
            "currentBundleRef",
            "candidateBundleRef",
            "changeClass",
            "compatibilityMode",
            "migrationAction",
            "confirmationRequired",
            "notes",
        ],
    )
    write_text(TAXONOMY_DOC_PATH, build_taxonomy_doc(taxonomy))
    write_text(QUESTION_CONTRACT_DOC_PATH, build_question_contract_doc(bundle_schema))
    write_text(DECISION_TABLE_DOC_PATH, build_decision_tables_doc(decision_tables))
    write_text(ATLAS_HTML_PATH, build_atlas_html(atlas_data, visibility_rows, bundle_rows))


if __name__ == "__main__":
    main()
