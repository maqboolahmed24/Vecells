# 137 Release Watch And Recovery Truth Matrix

        Restore is not complete when data loads. Journey proof, runbook freshness, readiness compilation, and tuple parity still gate shell posture.

        ## Action Truth Matrix

        | Case | Readiness Evidence | Observation Duty | Rollback Trigger |
| --- | --- | --- | --- |
| PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT | publicationBindingState=verified_for_preview; seq_136::patient_shell_smoke_withheld; seq_136::publishable_live_count_zero | none | preview publication drift or runtime binding mismatch withdraws shell proof immediately. |
| LOCAL_RELEASE_FREEZE_PARTIAL_GATEWAY_SURFACES | ORS_101_LOCAL_EXACT_AND_READY; RAF_LOCAL_V1; RPB_LOCAL_V1; RPP_LOCAL_V1; WGS_LOCAL_V1 | satisfied | The local ring keeps one exact tuple but current gateway-backed surfaces remain bounded by design lint, accessibility, and browser posture ceilings. |
| PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION | ORS_101_PREPROD_ASSURANCE_OR_FREEZE_BLOCKED; ASSURANCE_OR_FREEZE_BLOCKED | resume and promotion stay blocked until freeze and assurance blockers clear. | freeze::wave_pause or assurance::restore_block keeps all mutating controls suppressed. |
| LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION | ORS_101_LOCAL_EXACT_AND_READY; bpr::run_release_controls_local_verified; REP_101_EF_BOOKING_CAPACITY_COMMIT_LOCAL; REP_101_EF_PATIENT_ENTRY_RECOVERY_LOCAL | Observation window must stay open until probe minimums, parity, continuity, and provenance remain exact. | rollback.local.continuity-regression; rollback.local.synthetic-journey; rollback.local.manual-operator |
| LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION | ORS_101_LOCAL_EXACT_AND_READY; bpr::run_release_controls_local_verified; WOP_LOCAL_V1::local_satisfied | satisfied observation is mandatory, but applied success still stays impossible while the local ring remains partial. | Any gateway-surface drift, continuity regression, or provenance change forces rollback or read-only recovery instead of applied success. |
| CI_PREVIEW_PAUSE_ON_CONSTRAINED_GUARDRAIL | ORS_101_LOCAL_STALE_REHEARSAL_EVIDENCE; stale_rehearsal_evidence | open | Stale rehearsal evidence or constrained continuity downgrades preview posture to read-only revalidation. |
| INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH | ORS_101_INTEGRATION_BLOCKED_RESTORE_PROOF; bpr::run_gateway_integration_quarantined_dependency; RBR_101_EF_BOOKING_CAPACITY_COMMIT; RBR_101_EF_PATIENT_ENTRY_RECOVERY | Expired observation, parity conflict, and quarantined provenance force rollback-required settlement. | Publication conflict, parity conflict, blocked restore proof, and quarantined provenance generate rollback-required lineage. |
| PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE | ORS_101_PREPROD_ASSURANCE_OR_FREEZE_BLOCKED; bpr::run_command_preprod_revoked; assurance::restore_block; freeze::wave_pause | None. The ring is frozen and quarantined until a fresh tuple is promoted and verified. | Revoked provenance, withdrawn parity, and kill-switch recovery disposition freeze the entire ring. |
| LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK | ORS_101_LOCAL_EXACT_AND_READY; RBR_101_EF_PATIENT_ENTRY_RECOVERY; RST_101_EF_PATIENT_ENTRY_RECOVERY_LOCAL | Journey validation and readiness compilation must remain fresh before any shell claims calm recovery. | Any runbook freshness, gateway compatibility, or parity drift keeps restore in bounded non-production rehearsal only. |
| INTEGRATION_RESTORE_BLOCKED_PROOF_PREVENTS_CONTROL | ORS_101_INTEGRATION_BLOCKED_RESTORE_PROOF; BLOCKED_RESTORE_PROOF; RST_101_EF_PATIENT_ENTRY_RECOVERY_INTEGRATION | Restore verification stays blocked until journey proof and evidence packs are both current. | Blocked restore proof keeps recovery posture bounded and prevents any calm or writable reopening. |
| PREPROD_TUPLE_DRIFT_KEEPS_RECOVERY_WITHHELD | ORS_101_PREPROD_TUPLE_DRIFT; RESILIENCE_TUPLE_DRIFT; RST_101_EF_PATIENT_ENTRY_RECOVERY_PREPROD | Fresh tuple issuance, parity revalidation, and restore evidence regeneration are required before any recovery claim can relax. | Tuple drift downgrades RecoveryControlPosture and keeps shell authority withheld until a governed rebind succeeds. |

        ## Restore Readiness Matrix

        | Restore Case | Readiness | Recovery Control Posture | Live Authority Restored | Blockers |
| --- | --- | --- | --- | --- |
| LOCAL_EXACT_READY | exact_and_ready | rehearsed_nonprod_only | no | none |
| LOCAL_STALE_REHEARSAL | stale_rehearsal_evidence | revalidation_required | no | STALE_REHEARSAL_EVIDENCE |
| CI_PREVIEW_MISSING_BACKUP_MANIFEST | missing_backup_manifest | restore_blocked_missing_manifest | no | MISSING_BACKUP_MANIFEST; STALE_REHEARSAL_EVIDENCE |
| INTEGRATION_BLOCKED_RESTORE_PROOF | blocked_restore_proof | restore_blocked | no | BLOCKED_RESTORE_PROOF |
| PREPROD_TUPLE_DRIFT | tuple_drift | tuple_drift_recovery_only | no | BLOCKED_RESTORE_PROOF; RESILIENCE_TUPLE_DRIFT |
| PREPROD_ASSURANCE_OR_FREEZE_BLOCKED | assurance_or_freeze_blocked | freeze_or_assurance_read_only | no | ASSURANCE_OR_FREEZE_BLOCKED |
