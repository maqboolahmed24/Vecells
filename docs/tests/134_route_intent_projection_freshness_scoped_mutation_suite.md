# 134 Route Intent, Projection Freshness, and Scoped Mutation Suite

        `seq_134` publishes one exact verification harness for stale route context, stale projection truth, and widened mutation scope. The suite proves that route-intent tuples, runtime surface authority, freshness envelopes, and selected-anchor recovery remain joined instead of drifting into independent local guesses.

        ## Summary

        - Route-intent tuple cases: `10`
        - Projection-freshness cases: `10`
        - Scoped-mutation cases: `10`
        - Browser-verifiable continuity scenarios: `8`
        - Explicit browser specimen gaps: `2`
        - transport-live but non-live-actionability cases: `7`

        ## Covered Families

        | Case Family | Covered |
| --- | --- |
| stale_governing_object_version | yes |
| stale_identity_binding_or_subject_version | yes |
| stale_release_publication_runtime_binding | yes |
| channel_or_embedded_capability_drift | yes |
| transport_live_but_freshness_not_authoritative | yes |
| reachability_or_contact_repair_suppresses_mutation | yes |
| acting_scope_or_break_glass_drift | yes |
| same_shell_recovery_preserves_selected_anchor | yes |

        ## Route-Intent Tuple Highlights

        | Case | Route | Action Scope | Decision | Browser |
| --- | --- | --- | --- | --- |
| CG_134_PATIENT_MESSAGE_CURRENT | rf_patient_messages | reply_message | allow | available |
| CG_134_PATIENT_MESSAGE_SUPERSEDED | rf_patient_messages | reply_message | reissue-required | available |
| CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY | rf_patient_secure_link_recovery | claim | reissue-required | available |
| CG_134_PATIENT_REQUESTS_PENDING_BINDING | rf_patient_requests | pharmacy_choice | allow | available |
| CG_134_EMBEDDED_CAPABILITY_DRIFT | rf_patient_embedded_channel | route_entry | recovery-only | available |
| CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH | rf_staff_workspace_child | staff_claim_task | allow | available |
| CG_134_SUPPORT_CONTACT_REPAIR | rf_support_ticket_workspace | support_repair_action | recovery-only | gap |
| CG_134_HUB_SCOPE_DRIFT | rf_hub_case_management | hub_manage_booking | recovery-only | available |
| CG_134_STAFF_SELECTED_ANCHOR_RECOVERY | rf_staff_workspace_child | staff_claim_task | recovery-only | available |
| CG_134_PUBLIC_ENTRY_TELEPHONY_GAP | rf_intake_telephony_capture | route_entry | recovery-only | gap |

        ## Projection Freshness Highlights

        | Case | Transport | Freshness | Actionability | Shell Posture |
| --- | --- | --- | --- | --- |
| CG_134_PATIENT_MESSAGE_CURRENT | live | fresh | live | read_only |
| CG_134_PATIENT_MESSAGE_SUPERSEDED | live | stale_review | frozen | recovery_only |
| CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY | paused | blocked_recovery | recovery_only | blocked |
| CG_134_PATIENT_REQUESTS_PENDING_BINDING | live | updating | guarded | recovery_only |
| CG_134_EMBEDDED_CAPABILITY_DRIFT | live | blocked_recovery | recovery_only | recovery_only |
| CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH | live | stale_review | frozen | recovery_only |
| CG_134_SUPPORT_CONTACT_REPAIR | live | blocked_recovery | recovery_only | recovery_only |
| CG_134_HUB_SCOPE_DRIFT | reconnecting | updating | guarded | recovery_only |
| CG_134_STAFF_SELECTED_ANCHOR_RECOVERY | live | updating | recovery_only | recovery_only |
| CG_134_PUBLIC_ENTRY_TELEPHONY_GAP | paused | blocked_recovery | recovery_only | recovery_only |

        ## Scoped Mutation Highlights

        | Case | Drift Dimension | Ordinary Mutation | Route Decision | Recovery Envelope |
| --- | --- | --- | --- | --- |
| CG_134_PATIENT_MESSAGE_CURRENT | none_current_tuple | blocked | allow | RecoveryEnvelope::conversation-rebind |
| CG_134_PATIENT_MESSAGE_SUPERSEDED | governing_object_version | blocked | reissue-required | RecoveryEnvelope::conversation-superseded |
| CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY | subject_binding_version | blocked | reissue-required | RecoveryEnvelope::claim-reissue |
| CG_134_PATIENT_REQUESTS_PENDING_BINDING | runtime_binding | recovery-only | allow | RecoveryEnvelope::pharmacy-choice |
| CG_134_EMBEDDED_CAPABILITY_DRIFT | channel_capability | blocked | recovery-only | same_shell_route_entry_recovery |
| CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH | projection_freshness | blocked | allow | RecoveryEnvelope::workspace-task-rebind |
| CG_134_SUPPORT_CONTACT_REPAIR | reachability_contact_route | recovery-only | recovery-only | RecoveryEnvelope::support-ticket-repair |
| CG_134_HUB_SCOPE_DRIFT | acting_scope_tuple | blocked | recovery-only | RecoveryEnvelope::hub-case-rebind |
| CG_134_STAFF_SELECTED_ANCHOR_RECOVERY | selected_anchor_recovery | recovery-only | recovery-only | RecoveryEnvelope::workspace-task-rebind |
| CG_134_PUBLIC_ENTRY_TELEPHONY_GAP | browser_specimen_gap | blocked | recovery-only | same_shell_route_entry_recovery |
