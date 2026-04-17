# 101 Essential Function Map And Recovery Tiers

        ## Essential Function Coverage

        | Function | Label | Recovery tier | Backup scopes | Journey proof | Runbook binding |
        | --- | --- | --- | --- | --- | --- |
        | `ef_patient_entry_recovery` | `Patient entry, intake, and secure-link recovery` | `RT_060_PATIENT_ENTRY_V1` | `backup-scope://transactional-domain, backup-scope://event-spine, backup-scope://worm-audit` | `journey://patient-entry/intake-resume, journey://patient-entry/secure-link-recovery` | `RBR_101_EF_PATIENT_ENTRY_RECOVERY` |
| `ef_patient_self_service_continuity` | `Patient home, requests, messages, appointments, and record continuity` | `RT_060_PATIENT_SELF_SERVICE_V1` | `backup-scope://transactional-domain, backup-scope://projection-read-models, backup-scope://worm-audit` | `journey://patient-self-service/home, journey://patient-self-service/request-continuity` | `RBR_101_EF_PATIENT_SELF_SERVICE_CONTINUITY` |
| `ef_workspace_settlement` | `Workspace triage, clinician decision, and settlement` | `RT_060_WORKSPACE_SETTLEMENT_V1` | `backup-scope://transactional-domain, backup-scope://projection-read-models, backup-scope://event-spine, backup-scope://worm-audit` | `journey://workspace/lease-fence-replay, journey://workspace/task-completion` | `RBR_101_EF_WORKSPACE_SETTLEMENT` |
| `ef_booking_capacity_commit` | `Booking confirmation, waitlist, and capacity commit` | `RT_060_BOOKING_CAPACITY_V1` | `backup-scope://transactional-domain, backup-scope://event-spine, backup-scope://worm-audit` | `journey://booking/confirmation, journey://booking/waitlist-restore` | `RBR_101_EF_BOOKING_CAPACITY_COMMIT` |
| `ef_hub_coordination` | `Network hub queue, acknowledgement, and cross-organisation coordination` | `RT_060_HUB_COORDINATION_V1` | `backup-scope://transactional-domain, backup-scope://event-spine, backup-scope://worm-audit` | `journey://hub/cross-organisation-coordination, journey://hub/queue-reopen` | `RBR_101_EF_HUB_COORDINATION` |
| `ef_pharmacy_referral_reconciliation` | `Pharmacy referral dispatch, consent, and outcome reconciliation` | `RT_060_PHARMACY_RECONCILIATION_V1` | `backup-scope://transactional-domain, backup-scope://fhir-representation, backup-scope://object-artifacts, backup-scope://worm-audit` | `journey://pharmacy/outcome-reconciliation, journey://pharmacy/referral-dispatch` | `RBR_101_EF_PHARMACY_REFERRAL_RECONCILIATION` |
| `ef_communication_reachability` | `Patient communication, callback, and reachability repair` | `RT_060_COMMUNICATION_REACHABILITY_V1` | `backup-scope://transactional-domain, backup-scope://object-artifacts, backup-scope://event-spine, backup-scope://worm-audit` | `journey://communications/callback-resume, journey://communications/reachability-repair` | `RBR_101_EF_COMMUNICATION_REACHABILITY` |
| `ef_release_governance` | `Release governance, tuple parity, and live wave control` | `RT_060_RELEASE_GOVERNANCE_V1` | `backup-scope://projection-read-models, backup-scope://event-spine, backup-scope://worm-audit` | `journey://release/rollback-readiness, journey://release/watch-tuple` | `RBR_101_EF_RELEASE_GOVERNANCE` |
| `ef_platform_recovery_control` | `Operational readiness, restore authority, and recovery activation` | `RT_060_PLATFORM_RECOVERY_CONTROL_V1` | `backup-scope://transactional-domain, backup-scope://fhir-representation, backup-scope://projection-read-models, backup-scope://object-artifacts, backup-scope://event-spine, backup-scope://worm-audit` | `journey://resilience/readiness-compile, journey://resilience/restore-baseline` | `RBR_101_EF_PLATFORM_RECOVERY_CONTROL` |

        ## Recovery Tier Commitments

        | Function | Tier | RTO | RPO | Restore priority |
        | --- | --- | --- | --- | --- |
        | `ef_patient_entry_recovery` | `tier_1` | `PT30M` | `PT5M` | `1` |
| `ef_patient_self_service_continuity` | `tier_1` | `PT30M` | `PT5M` | `1` |
| `ef_workspace_settlement` | `tier_1` | `PT45M` | `PT10M` | `2` |
| `ef_booking_capacity_commit` | `tier_2` | `PT60M` | `PT15M` | `3` |
| `ef_hub_coordination` | `tier_2` | `PT60M` | `PT15M` | `4` |
| `ef_pharmacy_referral_reconciliation` | `tier_2` | `PT60M` | `PT20M` | `5` |
| `ef_communication_reachability` | `tier_1` | `PT30M` | `PT10M` | `2` |
| `ef_release_governance` | `tier_0` | `PT15M` | `PT0M` | `0` |
| `ef_platform_recovery_control` | `tier_0` | `PT15M` | `PT0M` | `0` |

        ## Readiness Rules

        - `exact_and_ready` is legal only while the current tuple matches every backup manifest, runbook binding, restore run, and recovery evidence pack.
        - `stale_rehearsal_evidence` applies when a runbook is stale, a restore pack expired, or journey validation stopped at pending.
        - `missing_backup_manifest` applies when any required backup scope is absent or explicitly marked missing.
        - `blocked_restore_proof` applies when restore execution or evidence packing published an explicit blocker.
        - `tuple_drift` applies when any readiness input no longer matches the current runtime publication tuple.
        - `assurance_or_freeze_blocked` applies when the release tuple carries an active freeze or assurance block even if recovery artifacts are otherwise current.
