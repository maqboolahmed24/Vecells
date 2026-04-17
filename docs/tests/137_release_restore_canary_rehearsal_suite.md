# 137 Release Restore Canary Rehearsal Suite

        Current suite verdict: `rehearsal_exact_live_withheld`

        This suite fuses the current Phase 0 release candidate freeze, preview publication parity, release-watch pipeline, non-production canary harness, and resilience baseline into one exact rehearsal matrix. It proves that preview banners, canary start, widen or resume, rollback, kill-switch, and restore claims all stay tuple-bound and fail closed when parity, provenance, observation, freeze, or recovery evidence drift.

        ## Active Context

        - Release ref: `RC_LOCAL_V1`
        - Release approval freeze ref: `RAF_LOCAL_V1`
        - Active tuple hash: `0bab371bd97f`
        - Freeze verdict: `exact`
        - Blocked action count: `4`
        - Applied-allowed wave count: `0`
        - Live-control reopened count: `0`

        ## What The Harness Proves

        1. Preview environments carry tuple proof, but shell truth still stays bounded when live publication and route authority are not exact.
        2. Release freeze and channel-freeze posture directly suppress mutating controls instead of relying on operator memory.
        3. Canary start generates accepted-pending-observation truth, and widen or resume still does not imply applied success under the current Phase 0 compatibility ceiling.
        4. Rollback and kill-switch outcomes are authoritative settlement results with machine-readable lineage.
        5. Restore is not complete when data loads. Journey proof, runbook freshness, readiness compilation, and tuple parity still gate shell posture.

        ## Rehearsal Matrix

        | Case | Ring | Action | Outcome | Shell After | Required Publication Tuple |
| --- | --- | --- | --- | --- | --- |
| PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT | ci-preview | preview_route_truth | withheld | preview_banner_only | rpb::ci-preview::authoritative; rpp::ci-preview::authoritative; pev_branch_patient_care; CI_PREVIEW_AUTHORITATIVE_ALIGNMENT |
| LOCAL_RELEASE_FREEZE_PARTIAL_GATEWAY_SURFACES | local | freeze_control | blocked | diagnostic_only_nonprod | rpb::local::authoritative; rpp::local::authoritative; RC_LOCAL_V1 |
| PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION | preprod | freeze_control | blocked | read_only_revalidation | rpb::preprod::authoritative; rpp::preprod::authoritative; ECE_131_PREPROD |
| LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION | local | canary_start | accepted_pending_observation | diagnostic_only_nonprod | RWT_LOCAL_V1::local_accepted; WOP_LOCAL_V1::local_accepted; rpb::local::authoritative |
| LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION | local | widen_resume | satisfied_but_live_withheld | diagnostic_only_nonprod | RWT_LOCAL_V1::local_satisfied; WOP_LOCAL_V1::local_satisfied; rpb::local::authoritative |
| CI_PREVIEW_PAUSE_ON_CONSTRAINED_GUARDRAIL | ci-preview | pause | constrained | read_only_revalidation | RWT_CI_PREVIEW_V1::ci_preview_stale; WOP_CI_PREVIEW_V1::ci_preview_stale; rpb::ci-preview::authoritative |
| INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH | integration | rollback | rollback_required | recovery_only | RWT_INTEGRATION_V1::integration_stale; WOP_INTEGRATION_V1::integration_stale; rpb::integration::authoritative |
| PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE | preprod | kill_switch | kill_switch_active | kill_switch_only | RWT_PREPROD_V1::preprod_rollback_required; WOP_PREPROD_V1::preprod_rollback_required; rpb::preprod::authoritative |
| LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK | local | restore_validation | restore_verified_live_withheld | diagnostic_only_nonprod | rpb::local::authoritative; rpp::local::authoritative; RWT_LOCAL_V1::local_satisfied |
| INTEGRATION_RESTORE_BLOCKED_PROOF_PREVENTS_CONTROL | integration | restore_blocked | restore_blocked | recovery_only | rpb::integration::authoritative; rpp::integration::authoritative; RWT_INTEGRATION_V1::integration_stale |
| PREPROD_TUPLE_DRIFT_KEEPS_RECOVERY_WITHHELD | preprod | restore_drift | tuple_drift_blocked | recovery_only | rpb::preprod::authoritative; rpp::preprod::authoritative; RWT_PREPROD_V1::preprod_rollback_required |
