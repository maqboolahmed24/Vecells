# 134 Surface Authority and Continuity Cases

        The continuity cases below bind route-intent parity, projection freshness, scoped mutation law, current `AudienceSurfaceRuntimeBinding`, declared recovery or freeze dispositions, and selected-anchor preservation into one reviewed table.

        ## Continuity Cases

        | Case | Route | Shell | Route Decision | Mutation | Shell Posture | Selected Anchor | Browser |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CG_134_PATIENT_MESSAGE_CURRENT | rf_patient_messages | patient-web | allow | blocked | read_only | freeze | available |
| CG_134_PATIENT_MESSAGE_SUPERSEDED | rf_patient_messages | patient-web | reissue-required | blocked | recovery_only | freeze | available |
| CG_134_PATIENT_CLAIM_PARTIAL_IDENTITY | rf_patient_secure_link_recovery | patient-web | reissue-required | blocked | blocked | freeze | available |
| CG_134_PATIENT_REQUESTS_PENDING_BINDING | rf_patient_requests | patient-web | allow | recovery-only | recovery_only | freeze | available |
| CG_134_EMBEDDED_CAPABILITY_DRIFT | rf_patient_embedded_channel | patient-web | recovery-only | blocked | recovery_only | freeze | available |
| CG_134_STAFF_LIVE_TRANSPORT_STALE_TRUTH | rf_staff_workspace_child | clinical-workspace | allow | blocked | recovery_only | freeze | available |
| CG_134_SUPPORT_CONTACT_REPAIR | rf_support_ticket_workspace | support-workspace | recovery-only | recovery-only | recovery_only | freeze | gap |
| CG_134_HUB_SCOPE_DRIFT | rf_hub_case_management | hub-desk | recovery-only | blocked | recovery_only | freeze | available |
| CG_134_STAFF_SELECTED_ANCHOR_RECOVERY | rf_staff_workspace_child | clinical-workspace | recovery-only | recovery-only | recovery_only | freeze | available |
| CG_134_PUBLIC_ENTRY_TELEPHONY_GAP | rf_intake_telephony_capture | patient-web | recovery-only | blocked | recovery_only | freeze | gap |

        ## Explicit Browser Gaps

        | Case | Route | Gap Ref | Next Safe Action |
| --- | --- | --- | --- |
| CG_134_SUPPORT_CONTACT_REPAIR | rf_support_ticket_workspace | GAP_BROWSER_SPECIMEN_RF_SUPPORT_TICKET_WORKSPACE | Repair the contact route and then resume from the preserved ticket timeline. |
| CG_134_PUBLIC_ENTRY_TELEPHONY_GAP | rf_intake_telephony_capture | GAP_BROWSER_SPECIMEN_RF_INTAKE_TELEPHONY_CAPTURE | Resume the governed capture route instead of inferring live authority from transport health. |
