# 60 Backup Restore And Recovery Tuple Baseline

        Seq `060` freezes the Phase 0 recovery tuple so backup, restore, failover, chaos, and recovery-pack controls all consume one published authority model.

        ## Baseline Summary

        - Essential functions: `9`
        - Recovery tiers: `9`
        - Backup manifests: `10`
        - Recovery posture scopes: `9`
        - Live-control scopes: `3`
        - Blocked scopes: `2`
        - Recovery evidence artifacts: `18`

        ## Recovery Tuple Members

        - `OperationalReadinessSnapshot` binds the current release, watch tuple, runbooks, and resilience evidence.
- `RunbookBindingRecord` proves rehearsed guidance for the same release tuple rather than leaving authority on wiki links.
- `BackupSetManifest` proves immutable, checksum-complete, compatibility-scoped backup coverage.
- `RestoreRun` stays tuple-bound and requires dependency plus journey validation, not data rehydration alone.
- `RecoveryControlPosture` is the only runtime verdict for restore, failover, and chaos authority.
- `ResilienceActionRecord` and `ResilienceActionSettlement` keep recovery controls inside governed mutation law.
- `RecoveryEvidenceArtifact` writes recovery proof back into governed presentation and assurance law.

        ## Essential Function Coverage

        | Function | Group | Tier | State | Posture | Current ORS |
| --- | --- | --- | --- | --- | --- |
| Patient entry, intake, and secure-link recovery | patient | tier_1 | mapped | live_control | ORS_058_PRODUCTION_V1 |
| Patient home, requests, messages, appointments, and record continuity | patient | tier_1 | mapped | governed_recovery | ORS_058_PRODUCTION_V1 |
| Workspace triage, clinician decision, and settlement | staff | tier_1 | rehearsal_due | diagnostic_only | ORS_058_PRODUCTION_V1 |
| Booking confirmation, waitlist, and capacity commit | booking | tier_2 | mapped | live_control | ORS_058_PRODUCTION_V1 |
| Network hub queue, acknowledgement, and cross-organisation coordination | hub | tier_2 | rehearsal_due | diagnostic_only | ORS_058_PRODUCTION_V1 |
| Pharmacy referral dispatch, consent, and outcome reconciliation | pharmacy | tier_2 | rehearsal_due | governed_recovery | ORS_058_PRODUCTION_V1 |
| Patient communication, callback, and reachability repair | communication | tier_1 | mapped | live_control | ORS_058_PRODUCTION_V1 |
| Release governance, tuple parity, and live wave control | governance | tier_0 | recovery_only | blocked | ORS_058_PRODUCTION_V1 |
| Operational readiness, restore authority, and recovery activation | resilience | tier_0 | recovery_only | blocked | ORS_058_PRODUCTION_V1 |

        ## Mandatory Closures

        - Backup existence alone no longer implies recovery readiness; immutable manifests, checksum coverage, and compatibility digests are mandatory.
        - Dashboards and runbooks no longer reconstruct authority; `RecoveryControlPosture` is the single runtime verdict.
        - Recovery evidence is now tuple-bound and presentation-governed instead of detached operational folklore.
        - Essential functions are business recovery units rather than infra-only assets.
        - Restore, failover, and chaos controls now settle through the same governed mutation chain as any other high-impact operation.

        ## Assumptions

        - `ASSUMPTION_060_READINESS_REFRESH_EXPANDS_FUNCTION_SET`: Seq_058 operational readiness snapshots currently publish four umbrella essential function refs. Seq_060 freezes the nine-function recovery map now and marks scopes outside that earlier umbrella coverage as rehearsal_due or recovery_only until the next readiness refresh republishes the broader map.
- `ASSUMPTION_060_PREPROD_SYNTHETIC_PROOF_DRIVES_PRODUCTION_JOURNEY_AUTHORITY`: Preprod synthetic recovery coverage remains the freshest governed journey proof available before later runtime rehearsal tasks materialize dedicated seq_101 restore jobs.
