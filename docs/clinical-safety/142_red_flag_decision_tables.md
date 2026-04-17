# 142 Red-Flag Decision Tables

This is the prose view of the machine-readable decision tables in [`../../data/contracts/142_red_flag_decision_tables.yaml`](../../data/contracts/142_red_flag_decision_tables.yaml).

## Hard-stop Rules

| Rule ID | Name | Predicate | Dependency group | Challenge cases |
| --- | --- | --- | --- | --- |
| RF142_HS_ACUTE_CHEST_BREATHING | Acute chest or breathing danger | category = chest_breathing and (acute_distress_signal = true or worsening_now = true and onset_window <= 72h) | DG_142_CARDIO_RESP_URGENT | C142_URGENT_CHEST_PAIN\|C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP |
| RF142_HS_STROKE_COLLAPSE_OR_SEIZURE | Stroke, collapse, or seizure signal | stroke_like_signal = true or collapse_or_seizure_signal = true | DG_142_NEURO_COLLAPSE_URGENT | C142_URGENT_STROKE_SIGNAL |
| RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION | Anaphylaxis or severe medication reaction | anaphylaxis_pattern = true or reaction_airway_compromise = true | DG_142_ALLERGY_MEDS_URGENT | C142_URGENT_MED_REACTION |
| RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG | Heavy bleeding or pregnancy-related red flag | heavy_bleeding_signal = true or pregnancy_red_flag_signal = true | DG_142_CARDIO_RESP_URGENT | C142_URGENT_HEAVY_BLEEDING |
| RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL | Self-harm or safeguarding danger | self_harm_signal = true or immediate_safeguarding_signal = true | DG_142_NEURO_COLLAPSE_URGENT | C142_URGENT_SELF_HARM_SIGNAL |

## Urgent Contributor Rules

| Rule ID | Name | Predicate | Dependency group | Challenge cases |
| --- | --- | --- | --- | --- |
| RF142_UC_SEVERE_PAIN_ESCALATION | Severe pain escalation | severe_pain_escalation = true | DG_142_CARDIO_RESP_URGENT | C142_THRESHOLD_URGENT_OVER |
| RF142_UC_RAPID_WORSENING_RECENT_ONSET | Rapid worsening with recent onset | rapid_worsening_recent_onset = true | DG_142_CARDIO_RESP_URGENT | C142_THRESHOLD_URGENT_OVER\|C142_THRESHOLD_URGENT_UNDER |
| RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS | High-risk result paired with current symptoms | high_risk_result_query = true and current_clinical_symptoms_present = true | DG_142_RESULTS_MEDS_TIMING | C142_RESULTS_RESIDUAL_REVIEW |
| RF142_UC_HIGH_RISK_MED_INTERRUPTION | High-risk medication interruption | high_risk_supply_interruption = true | DG_142_RESULTS_MEDS_TIMING | C142_THRESHOLD_URGENT_OVER |

## Residual Contributor Rules

| Rule ID | Name | Predicate | Dependency group | Challenge cases |
| --- | --- | --- | --- | --- |
| RF142_RC_MODERATE_PERSISTENT_SYMPTOMS | Moderate persistent symptoms | moderate_persistent_pattern = true | DG_142_CARDIO_RESP_URGENT | C142_THRESHOLD_URGENT_UNDER\|C142_CRITICAL_MISSINGNESS_REVIEW_HOLD |
| RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP | Result follow-up is unclear but not immediately urgent | unclear_follow_up_instruction = true | DG_142_RESULTS_MEDS_TIMING | C142_RESULTS_RESIDUAL_REVIEW |
| RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM | Time-dependent admin work with clinical dependency | clinically_timed_form = true | DG_142_RESULTS_MEDS_TIMING | C142_SAFE_RECEIPT_CLEAR |

## Reachability Contributor Rules

| Rule ID | Name | Predicate | Dependency group | Challenge cases |
| --- | --- | --- | --- | --- |
| RF142_RCH_NO_SAFE_CALLBACK_WINDOW | No safe callback window for urgent follow-up | no_safe_callback_window = true | DG_142_REACHABILITY | C142_CRITICAL_MISSINGNESS_REVIEW_HOLD |

## Challenge Corpus Overview

| Case | Request type | Tags | Requested safety state | Submit result | Copy variant |
| --- | --- | --- | --- | --- | --- |
| C142_URGENT_CHEST_PAIN | Symptoms | hard_stop,same_shell_urgent,pathway_change | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_URGENT_STROKE_SIGNAL | Symptoms | hard_stop | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_URGENT_MED_REACTION | Meds | hard_stop | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_URGENT_HEAVY_BLEEDING | Symptoms | hard_stop | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_URGENT_SELF_HARM_SIGNAL | Admin | hard_stop | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_THRESHOLD_URGENT_OVER | Meds | threshold_boundary,soft_score | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_THRESHOLD_URGENT_UNDER | Symptoms | threshold_boundary,residual_review | residual_risk_flagged | triage_ready | COPYVAR_142_SAFE_REVIEW_V1 |
| C142_RESULTS_RESIDUAL_REVIEW | Results | residual_review | residual_risk_flagged | triage_ready | COPYVAR_142_SAFE_REVIEW_V1 |
| C142_SAFE_RECEIPT_CLEAR | Admin | screen_clear | screen_clear | triage_ready | COPYVAR_142_SAFE_CLEAR_V1 |
| C142_DEGRADED_ATTACHMENT_FAIL_CLOSED | Symptoms | degraded_attachment,failed_safe | none | failed_safe | COPYVAR_142_FAILED_SAFE_V1 |
| C142_CONTRADICTION_DOES_NOT_CLEAR_HARD_STOP | Symptoms | contradiction,hard_stop | urgent_diversion_required | urgent_diversion | COPYVAR_142_URGENT_REQUIRED_V1 |
| C142_CRITICAL_MISSINGNESS_REVIEW_HOLD | Symptoms | critical_missingness,residual_review | residual_risk_flagged | triage_ready | COPYVAR_142_SAFE_REVIEW_V1 |
| C142_URGENT_ISSUED_AFTER_SETTLEMENT | Symptoms | urgent_issued | urgent_diverted | urgent_diversion | COPYVAR_142_URGENT_ISSUED_V1 |
| C142_ENGINE_TIMEOUT_FAILED_SAFE | Results | engine_failure,failed_safe | none | failed_safe | COPYVAR_142_FAILED_SAFE_V1 |

## Decision Boundary Notes

- `screen_clear` is legal only after one settled immutable safety decision.
- degraded attachments, parser disagreement, or stale runtime truth may not collapse to `screen_clear`; they must fail closed through review or `failed_safe`.
- contradiction handling stays monotone: low-assurance contradictory evidence may not clear a fired hard stop.
