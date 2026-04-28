# 142 Red-Flag Rulebook

This document is the human-readable rulebook for the machine-readable pack in [`../../data/contracts/142_red_flag_decision_tables.yaml`](../../data/contracts/142_red_flag_decision_tables.yaml).

## Section A — `Mock_now_execution`

- Freeze one exact, rule-first, explicit safety gate for the Phase 1 submit moment.
- Keep hard-stop dominance, fail-closed degraded-evidence handling, and urgent-required versus urgent-issued separation exact now.
- Use simulator-backed challenge cases only; do not imply live provider or live governance execution where that evidence does not yet exist.

## Section B — `Actual_production_strategy_later`

- Replace placeholder approver roles with named approvers without changing rule IDs, rule versions, state names, or outcome semantics.
- Add richer challenge data or non-identity calibrators only by superseding the same rule-pack contract and keeping the same public copy identifiers.

## Four-Pass Algorithm

1. derive tri-state clinical features, contradiction burden c_crit(S), and critical-missingness burden m_crit(S) from the frozen composite-evidence lattice
2. evaluate authored hard-stop rules before any soft scoring
3. compute z_U(S), z_R(S), p_U(S), and p_R(S) using dependency-group caps plus the active calibrator set
4. apply the decision boundary: urgent diversion if any hard-stop fires or p_U(S) >= theta_U; residual_risk_flagged when urgent is false and residual, contradiction, or missingness thresholds trip; otherwise screen_clear

The frozen decision boundary uses:

- `theta_U = 0.083333` from `C_FP^U = 1.0` and `C_FN^U = 11.0`
- `theta_R = 0.285714` from `C_FP^R = 2.0` and `C_FN^R = 5.0`
- `theta_conf = 0.55`
- `theta_miss = 0.6`

Hard-stop rules always dominate. They may not be softened away by `p_U(S)` or `p_R(S)`.

## Canonical Contracts

- `SafetyPreemptionRecord` is the fail-closed guard that freezes routine continuation while the synchronous safety epoch is still unsettled.
- `SafetyDecisionRecord` is the immutable outcome of the four-pass safety engine and is the only source allowed to publish `screen_clear`, `residual_risk_flagged`, or `urgent_diversion_required`.
- `UrgentDiversionSettlement` is required before the public state may advance from `urgent_diversion_required` to `urgent_diverted`.
- `IntakeOutcomePresentationArtifact` binds every patient-facing outcome card to one exact rendered surface.
- `ArtifactPresentationContract` governs how the safe receipt, urgent diversion, or `processing_failed` recovery artifact is presented.
- `OutboundNavigationGrant` governs any cross-app urgent handoff so pathway change links remain explicit, revocable, and non-spoofable.

## Frozen Rule Metadata

| Rule ID | Severity | Name | Request types | Dependency group | Missingness | Contradiction |
| --- | --- | --- | --- | --- | --- | --- |
| RF142_HS_ACUTE_CHEST_BREATHING | hard_stop | Acute chest or breathing danger | Symptoms | DG_142_CARDIO_RESP_URGENT | urgent_review | require_resolution |
| RF142_HS_STROKE_COLLAPSE_OR_SEIZURE | hard_stop | Stroke, collapse, or seizure signal | Symptoms | DG_142_NEURO_COLLAPSE_URGENT | urgent_review | clinician_override_only |
| RF142_HS_ANAPHYLAXIS_OR_SEVERE_MED_REACTION | hard_stop | Anaphylaxis or severe medication reaction | Symptoms, Meds | DG_142_ALLERGY_MEDS_URGENT | urgent_review | require_resolution |
| RF142_HS_HEAVY_BLEEDING_OR_PREGNANCY_RED_FLAG | hard_stop | Heavy bleeding or pregnancy-related red flag | Symptoms | DG_142_CARDIO_RESP_URGENT | urgent_review | require_resolution |
| RF142_HS_SELF_HARM_OR_SAFEGUARDING_SIGNAL | hard_stop | Self-harm or safeguarding danger | Symptoms, Admin | DG_142_NEURO_COLLAPSE_URGENT | urgent_review | clinician_override_only |
| RF142_UC_SEVERE_PAIN_ESCALATION | urgent_contributor | Severe pain escalation | Symptoms | DG_142_CARDIO_RESP_URGENT | conservative_hold | latest_highest_assurance |
| RF142_UC_RAPID_WORSENING_RECENT_ONSET | urgent_contributor | Rapid worsening with recent onset | Symptoms | DG_142_CARDIO_RESP_URGENT | conservative_hold | latest_highest_assurance |
| RF142_UC_HIGH_RISK_RESULT_WITH_CURRENT_SYMPTOMS | urgent_contributor | High-risk result paired with current symptoms | Results | DG_142_RESULTS_MEDS_TIMING | conservative_hold | require_resolution |
| RF142_UC_HIGH_RISK_MED_INTERRUPTION | urgent_contributor | High-risk medication interruption | Meds | DG_142_RESULTS_MEDS_TIMING | conservative_hold | latest_highest_assurance |
| RF142_RC_MODERATE_PERSISTENT_SYMPTOMS | residual_contributor | Moderate persistent symptoms | Symptoms | DG_142_CARDIO_RESP_URGENT | conservative_hold | latest_highest_assurance |
| RF142_RC_RESULTS_UNCLEAR_FOLLOW_UP | residual_contributor | Result follow-up is unclear but not immediately urgent | Results | DG_142_RESULTS_MEDS_TIMING | conservative_hold | require_resolution |
| RF142_RC_ADMIN_TIME_DEPENDENT_CLINICAL_FORM | residual_contributor | Time-dependent admin work with clinical dependency | Admin | DG_142_RESULTS_MEDS_TIMING | ignore | latest_highest_assurance |
| RF142_RCH_NO_SAFE_CALLBACK_WINDOW | reachability_contributor | No safe callback window for urgent follow-up | Symptoms, Meds, Admin, Results | DG_142_REACHABILITY | conservative_hold | require_resolution |

## Dependency Group Caps

| Dependency group | Meaning | Urgent cap | Residual cap |
| --- | --- | --- | --- |
| DG_142_CARDIO_RESP_URGENT | Acute cardio-respiratory danger | 3.4 | 1.2 |
| DG_142_NEURO_COLLAPSE_URGENT | Neurology, seizure, or collapse danger | 3.2 | 1.0 |
| DG_142_ALLERGY_MEDS_URGENT | Severe allergy or medication reaction | 3.0 | 1.0 |
| DG_142_RESULTS_MEDS_TIMING | Time-critical meds or results follow-up | 2.1 | 1.8 |
| DG_142_REACHABILITY | Contact safety and callback reachability | 1.4 | 1.3 |

## Calibration Policy

- Identity calibrators are mandatory until each stratum meets the authored graduation rule.
- Promoted calibrators must publish urgent sensitivity, review capture, Brier score, calibration intercept, and calibration slope on the held-out challenge set.
- `urgent_diversion_required` is the only legal urgent state immediately after `SafetyDecisionRecord` settles.
- `urgent_diverted` is illegal until `UrgentDiversionSettlement(settlementState = issued)` exists for the same request lineage.

## Gap Resolution Record

```json
[
  {
    "gapId": "GAP_RESOLVED_142_URGENT_REQUIRED_VS_URGENT_ISSUED",
    "summary": "The rulebook, state machine, and copy contract now keep urgent_diversion_required separate from urgent_diverted and require UrgentDiversionSettlement before the issued state may render."
  },
  {
    "gapId": "GAP_RESOLVED_142_RULEBOOK_IS_MACHINE_READABLE",
    "summary": "The synchronous safety gate is now frozen as schema-backed rule metadata plus authored decision tables rather than prose-only spreadsheet logic."
  },
  {
    "gapId": "GAP_RESOLVED_142_DEGRADED_ATTACHMENTS_FAIL_CLOSED",
    "summary": "Unresolved attachment meaning or parser disagreement now routes into fail-closed review or failed-safe recovery instead of silently dropping to screen_clear."
  },
  {
    "gapId": "GAP_RESOLVED_142_HARD_STOP_DOMINANCE",
    "summary": "Hard-stop rules remain dominant and cannot be softened away by calibrators or soft-score smoothing."
  },
  {
    "gapId": "GAP_RESOLVED_142_URGENT_IS_A_PATHWAY_CHANGE",
    "summary": "Urgent outcome copy now reads as an unmistakable pathway change with one dominant next action instead of a form-validation or generic error surface."
  },
  {
    "gapId": "GAP_RESOLVED_142_SAFE_AND_FAILED_SAFE_ARE_DISTINCT",
    "summary": "Safe receipt and failed-safe recovery now have different state names, different primary actions, and non-overlapping copy identifiers."
  }
]
```

## Assumptions, Risks, And Conflicts

### Assumptions

```json
[
  {
    "assumptionId": "ASSUMPTION_142_PLACEHOLDER_APPROVERS_ROLE_ONLY",
    "summary": "Rule metadata uses the placeholder roles already frozen in the DCB0129 and signoff packs; named approvers remain a later governance substitution, not a semantic change."
  },
  {
    "assumptionId": "ASSUMPTION_142_IDENTITY_CALIBRATORS_REQUIRED_NOW",
    "summary": "Identity calibrators remain mandatory for Phase 1 until adjudicated challenge data meets the published graduation criteria per stratum."
  }
]
```

### Risks

```json
[
  {
    "riskId": "RISK_142_OVER_BROAD_URGENT_COPY",
    "summary": "Urgent text that sounds like generic failure or form validation would cause unsafe hesitation.",
    "mitigation": "Urgent variants explicitly ban validation tone, surface a single dominant action, and use pathway-change language only."
  },
  {
    "riskId": "RISK_142_THRESHOLD_DRIFT_WITHOUT_DIAGNOSTICS",
    "summary": "Soft-score changes could drift if challenge-set diagnostics are not carried with the rule-pack version.",
    "mitigation": "The rule pack publishes harm-ratio thresholds, calibrator discipline, and signed-off diagnostics fields together."
  }
]
```

### Conflicts

```json
[
  {
    "conflictId": "CONFLICT_142_LIVE_GOVERNANCE_MAY_STRENGTHEN_NOT_WEAKEN",
    "summary": "Later clinical governance may add challenge cases, named approvers, or stricter handoff routing, but it may not weaken the Phase 1 rule IDs, hard-stop dominance, or outcome semantics frozen here."
  }
]
```
