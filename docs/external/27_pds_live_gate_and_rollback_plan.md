# 27 PDS Live Gate And Rollback Plan

    Real PDS onboarding remains fail-closed. The current submission posture is `blocked` and Phase 0 entry remains `withheld`.

    ## Summary

    - live gates: 13
    - blocked: 5
    - review required: 6
    - pass: 2

    ## Section A — `Mock_now_execution`

    The studio and sandbox expose the exact blocker truth now:

    | Gate | Status | Reason |
| --- | --- | --- |
| GATE_EXTERNAL_TO_FOUNDATION | blocked | Planning and architecture foundation are frozen enough to open external-readiness work, but actual Phase 0 entry remains withheld because the current-baseline external-readiness gate is still blocked by onboarding, assurance, and simulator-freeze dependencies. |
| LIVE_GATE_PDS_LEGAL_BASIS_APPROVED | blocked | Inherited from seq_023: legal basis, tenant feature flag, and enrichment posture remain pending. |
| PDS_LIVE_GATE_USE_CASE_TRACEABLE | pass | This pack structures each use case with route-family, access-mode, and fallback law. |
| PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF | pass | All route rows are encoded as off or internal_only in the registry. |
| PDS_LIVE_GATE_ACCESS_MODE_SELECTED | review_required | Mode choices are drafted, but official onboarding is blocked until a real use-case subset is approved. |
| PDS_LIVE_GATE_HAZARD_LOG_CURRENT | review_required | The artifact plan exists, but no live hazard-log pack is approved yet. |
| PDS_LIVE_GATE_RISK_LOGS_CURRENT | review_required | The official per-mode templates are mapped, but no signed live set exists yet. |
| PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT | review_required | The mitigation controls are encoded but still need named approver sign-off for any real onboarding. |
| PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED | review_required | Official guidance requires the network posture to be explicit for smartcard-backed worker use. |
| PDS_LIVE_GATE_NAMED_APPROVER_PRESENT | blocked | Real provider work remains blocked without a named approver input. |
| PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT | blocked | No real sandbox or integration target should be attempted without an exact environment target. |
| PDS_LIVE_GATE_ROLLBACK_REHEARSED | review_required | The rollback model is encoded in the studio, but a named release rehearsal is still required. |
| PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION | blocked | Fail-closed by default until ALLOW_REAL_PROVIDER_MUTATION=true is set. |

    ## Section B — `Actual_provider_strategy_later`

    Rollback triggers:

    | Signal | Threshold |
| --- | --- |
| wrong_patient_signal_rate_exceeds_threshold | more than 1 unresolved signal in the latest cohort or any confirmed wrong-patient event |
| p95_latency_breach | more than 900ms across three consecutive monitoring windows |
| stale_or_contradictory_rate_exceeds_threshold | more than 5% contradictory-or-stale traces within the current cohort |
| feature_flag_scope_drift_detected | Any route receives PDS rendering without an approved feature-flag tuple |

    Required environment inputs for any real dry-run or submission:

    - PDS_NAMED_APPROVER, PDS_ENVIRONMENT_TARGET, PDS_ORGANISATION_ODS, PDS_USE_CASE_OWNER, ALLOW_REAL_PROVIDER_MUTATION

    Mutation remains blocked unless:

    - the named approver is present
    - the environment target is present
    - the exact use case is traceable
    - the route flag remains default-off outside the approved cohort
    - the hazard and risk logs are current
    - `ALLOW_REAL_PROVIDER_MUTATION=true`
