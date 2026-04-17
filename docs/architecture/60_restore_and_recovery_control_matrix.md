# 60 Restore And Recovery Control Matrix

        This matrix joins backup scope, recovery posture, and evidence artifacts so restore, failover, and chaos authority cannot drift apart.

        ## Recovery Control Posture Matrix

        | Scope | Posture | Restore Freshness | Dependency | Journey | Backup | Allowed |
| --- | --- | --- | --- | --- | --- | --- |
| scope_patient_entry_recovery | live_control | fresh | complete | exact | current | restore_prepare, restore_start, restore_validate |
| scope_patient_self_service_continuity | governed_recovery | fresh | complete | partial | current | restore_prepare, restore_validate |
| scope_workspace_settlement | diagnostic_only | stale | complete | exact | stale | restore_prepare |
| scope_booking_capacity_commit | live_control | fresh | complete | exact | current | restore_prepare, restore_start, restore_validate |
| scope_hub_coordination | diagnostic_only | fresh | partial | exact | current | restore_prepare, restore_validate |
| scope_pharmacy_referral_recovery | governed_recovery | fresh | complete | partial | current | restore_prepare, restore_validate |
| scope_communication_reachability | live_control | fresh | complete | exact | current | restore_prepare, restore_start, restore_validate |
| scope_release_governance | blocked | fresh | complete | exact | current | pause, rollback |
| scope_platform_recovery_control | blocked | expired | blocked | missing | stale | diagnose |

        ## Backup Scope Matrix

        | Manifest | Dataset Scope | Functions | State | Immutability | Compatibility |
| --- | --- | --- | --- | --- | --- |
| BSM_060_IDENTITY_ENTRY_STATE_V1 | dataset://identity-entry-state | ef_patient_entry_recovery | current | immutable | restore-compatibility::0f5e1123fd23d1bf |
| BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1 | dataset://patient-continuity-read-models | ef_patient_self_service_continuity | current | immutable | restore-compatibility::1e56ca3de5df9d0d |
| BSM_060_WORKSPACE_SETTLEMENT_STATE_V1 | dataset://workspace-settlement-and-queue | ef_workspace_settlement | stale | immutable | restore-compatibility::97229f1d7442560e |
| BSM_060_BOOKING_CAPACITY_STATE_V1 | dataset://booking-capacity-and-confirmation | ef_booking_capacity_commit | current | immutable | restore-compatibility::e20a9e176974354a |
| BSM_060_HUB_COORDINATION_STATE_V1 | dataset://hub-queue-and-supplier-mirror | ef_hub_coordination | current | immutable | restore-compatibility::c232e9b0d1f83700 |
| BSM_060_PHARMACY_REFERRAL_STATE_V1 | dataset://pharmacy-dispatch-and-outcome | ef_pharmacy_referral_reconciliation | current | immutable | restore-compatibility::5ef3e78955e918b3 |
| BSM_060_COMMUNICATION_DELIVERY_STATE_V1 | dataset://communications-and-reachability | ef_communication_reachability | current | immutable | restore-compatibility::846423647fc261fe |
| BSM_060_RELEASE_GOVERNANCE_TUPLE_V1 | dataset://release-governance-and-watch-tuple | ef_release_governance | current | immutable | restore-compatibility::7d302070a38e6838 |
| BSM_060_PLATFORM_RECOVERY_EVIDENCE_V1 | dataset://platform-recovery-evidence-and-runbooks | ef_platform_recovery_control | stale | immutable | restore-compatibility::3b9ab76d7824bb89 |
| BSM_060_WORM_AUDIT_EVIDENCE_V1 | dataset://worm-audit-and-recovery-evidence | ef_patient_entry_recovery; ef_patient_self_service_continuity; ef_workspace_settlement; ef_booking_capacity_commit; ef_hub_coordination; ef_pharmacy_referral_reconciliation; ef_communication_reachability; ef_release_governance; ef_platform_recovery_control | current | immutable | restore-compatibility::a388118cbf831b69 |

        ## Recovery Evidence Catalog

        | Artifact | Type | Scope | State | Freshness |
| --- | --- | --- | --- | --- |
| REA_060_EF_PATIENT_ENTRY_RECOVERY_PRIMARY_V1 | restore_report | scope_patient_entry_recovery | governed_preview | fresh |
| REA_060_EF_PATIENT_ENTRY_RECOVERY_SUPPORT_V1 | journey_recovery_proof | scope_patient_entry_recovery | governed_preview | fresh |
| REA_060_EF_PATIENT_SELF_SERVICE_CONTINUITY_PRIMARY_V1 | restore_report | scope_patient_self_service_continuity | recovery_only | fresh |
| REA_060_EF_PATIENT_SELF_SERVICE_CONTINUITY_SUPPORT_V1 | recovery_pack_export | scope_patient_self_service_continuity | recovery_only | fresh |
| REA_060_EF_WORKSPACE_SETTLEMENT_PRIMARY_V1 | restore_report | scope_workspace_settlement | summary_only | stale |
| REA_060_EF_WORKSPACE_SETTLEMENT_SUPPORT_V1 | dependency_restore_explainer | scope_workspace_settlement | summary_only | stale |
| REA_060_EF_BOOKING_CAPACITY_COMMIT_PRIMARY_V1 | restore_report | scope_booking_capacity_commit | governed_preview | fresh |
| REA_060_EF_BOOKING_CAPACITY_COMMIT_SUPPORT_V1 | journey_recovery_proof | scope_booking_capacity_commit | governed_preview | fresh |
| REA_060_EF_HUB_COORDINATION_PRIMARY_V1 | restore_report | scope_hub_coordination | summary_only | stale |
| REA_060_EF_HUB_COORDINATION_SUPPORT_V1 | dependency_restore_explainer | scope_hub_coordination | summary_only | stale |
| REA_060_EF_PHARMACY_REFERRAL_RECONCILIATION_PRIMARY_V1 | restore_report | scope_pharmacy_referral_recovery | recovery_only | fresh |
| REA_060_EF_PHARMACY_REFERRAL_RECONCILIATION_SUPPORT_V1 | recovery_pack_export | scope_pharmacy_referral_recovery | recovery_only | fresh |
| REA_060_EF_COMMUNICATION_REACHABILITY_PRIMARY_V1 | restore_report | scope_communication_reachability | governed_preview | fresh |
| REA_060_EF_COMMUNICATION_REACHABILITY_SUPPORT_V1 | journey_recovery_proof | scope_communication_reachability | governed_preview | fresh |
| REA_060_EF_RELEASE_GOVERNANCE_PRIMARY_V1 | restore_report | scope_release_governance | summary_only | missing |
| REA_060_EF_RELEASE_GOVERNANCE_SUPPORT_V1 | runbook_bundle | scope_release_governance | recovery_only | missing |
| REA_060_EF_PLATFORM_RECOVERY_CONTROL_PRIMARY_V1 | restore_report | scope_platform_recovery_control | summary_only | expired |
| REA_060_EF_PLATFORM_RECOVERY_CONTROL_SUPPORT_V1 | runbook_bundle | scope_platform_recovery_control | recovery_only | expired |

        ## Governing Rules

        - `live_control` requires fresh tuple alignment across readiness, runbooks, backup manifests, journey proof, and trust verdict.
        - `diagnostic_only` preserves evidence visibility but never leaves live recovery controls armed.
        - `governed_recovery` keeps bounded recovery actions legal while ordinary live controls stay withdrawn.
        - `blocked` is fail-closed and still requires governed evidence capture rather than silent dashboard optimism.
