# 165 Red-Flag Rule Coverage Matrix

Source rule pack: `RFRP_142_PHASE1_SYNCHRONOUS_SAFETY_V1@1.0.0`.

| Rule ID                                           | Severity                 | Decision Case                                     | Expected Outcome         | Requested State             | Browser Row                                       |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------- | ------------------------ | --------------------------- | ------------------------------------------------- |
| `RF142_HS_ACUTE_CHEST_BREATHING`                  | hard_stop                | `RF142_HS_ACUTE_CHEST_BREATHING`                  | `urgent_required`        | `urgent_diversion_required` | `RF142_HS_ACUTE_CHEST_BREATHING`                  |
| `RF142_HS_STROKE_COLLAPSE_OR_SEIZURE`             | hard_stop                | `RF142_HS_STROKE_COLLAPSE_OR_SEIZURE`             | `urgent_required`        | `urgent_diversion_required` | `RF142_HS_STROKE_COLLAPSE_OR_SEIZURE`             |
| `RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION`     | hard_stop                | `RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION`     | `urgent_required`        | `urgent_diversion_required` | `RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION`     |
| `RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG`   | hard_stop                | `RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG`   | `urgent_required`        | `urgent_diversion_required` | `RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG`   |
| `RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL`       | hard_stop                | `RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL`       | `urgent_required`        | `urgent_diversion_required` | `RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL`       |
| `RF142_UC_SEVERE_PAIN_ESCALATION`                 | urgent_contributor       | `RF142_UC_SEVERE_PAIN_ESCALATION`                 | `urgent_required`        | `urgent_diversion_required` | `RF142_UC_SEVERE_PAIN_ESCALATION`                 |
| `RF142_UC_RAPID_WORSENING_RECENT_ONSET`           | urgent_contributor       | `RF142_UC_RAPID_WORSENING_RECENT_ONSET`           | `urgent_required`        | `urgent_diversion_required` | `RF142_UC_RAPID_WORSENING_RECENT_ONSET`           |
| `RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS` | urgent_contributor       | `RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS` | `urgent_required`        | `urgent_diversion_required` | `RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS` |
| `RF142_UC_HIGH_RISK_MED_INTERRUPTION`             | urgent_contributor       | `RF142_UC_HIGH_RISK_MED_INTERRUPTION`             | `urgent_required`        | `urgent_diversion_required` | `RF142_UC_HIGH_RISK_MED_INTERRUPTION`             |
| `RF142_RC_MODERATE_PERSISTENT_SYMPTOMS`           | residual_contributor     | `RF142_RC_MODERATE_PERSISTENT_SYMPTOMS`           | `residual_review`        | `residual_risk_flagged`     | `RF142_RC_MODERATE_PERSISTENT_SYMPTOMS`           |
| `RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP`              | residual_contributor     | `RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP`              | `residual_review`        | `residual_risk_flagged`     | `RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP`              |
| `RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM`     | residual_contributor     | `RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM`     | `residual_review`        | `residual_risk_flagged`     | `RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM`     |
| `RF142_RCH_NO_SAFE_CALLBACK_WINDOW`               | reachability_contributor | `RF142_RCH_NO_SAFE_CALLBACK_WINDOW`               | `fallback_manual_review` | `residual_risk_flagged`     | `RF142_RCH_NO_SAFE_CALLBACK_WINDOW`               |

## Boundary And Dependency Rows

| Case ID                                     | Family                       | Assertion                                                                                                    |
| ------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `165_BOUNDARY_HARD_STOP_DOMINATES_RESIDUAL` | boundary_value               | A hard-stop red flag dominates residual review signals in the same frozen cut.                               |
| `165_DEPENDENCY_DUPLICATE_EVIDENCE_CAP`     | dependency_group_capping     | Repeated correlated evidence produces unique fired rule IDs and cannot double-count repeated narrative text. |
| `165_DEGRADED_ATTACHMENT_FAIL_CLOSED`       | degraded_evidence            | Degraded attachment/parser meaning remains `potentially_clinical` and fails closed to review.                |
| `165_URGENT_REQUIRED_PENDING`               | urgent_settlement_separation | `urgent_diversion_required` remains distinct from an issued urgent-diversion settlement.                     |
