# 56 Action Scope And Governing Object Matrix

            | Action scope | Route family | Governing object | Required acting scope | Same-shell recovery |
| --- | --- | --- | --- | --- |
| claim | rf_patient_secure_link_recovery | Request | not_required_patient_subject_session | RecoveryEnvelope::claim-rebind |
| respond_more_info | rf_patient_secure_link_recovery | MoreInfoCycle | not_required_patient_subject_session | RecoveryEnvelope::more-info-rebind |
| reply_message | rf_patient_messages | ClinicianMessageThread | not_required_patient_subject_session | RecoveryEnvelope::conversation-rebind |
| respond_callback | rf_patient_messages | CallbackCase | not_required_patient_subject_session | RecoveryEnvelope::callback-rebind |
| manage_booking | rf_patient_appointments | BookingCase | not_required_patient_subject_session | RecoveryEnvelope::booking-manage |
| accept_waitlist_offer | rf_patient_appointments | WaitlistOffer | not_required_patient_subject_session | RecoveryEnvelope::waitlist-accept |
| accept_network_alternative | rf_patient_appointments | AlternativeOfferSession | not_required_patient_subject_session | RecoveryEnvelope::alternative-offer-disambiguation |
| pharmacy_choice | rf_patient_requests | PharmacyCase | not_required_patient_subject_session | RecoveryEnvelope::pharmacy-choice |
| pharmacy_consent | rf_patient_requests | PharmacyCase | not_required_patient_subject_session | RecoveryEnvelope::pharmacy-consent |
| support_repair_action | rf_support_ticket_workspace | SupportMutationAttempt | AST_054_SUPPORT_WORKSPACE_V1 | RecoveryEnvelope::support-ticket-repair |
| ops_resilience_action | rf_operations_drilldown | ReleaseWatchTuple | AST_054_OPERATIONS_WATCH_V1 | RecoveryEnvelope::ops-runtime-refresh |
| hub_manage_booking | rf_hub_case_management | HubCoordinationCase | AST_054_HUB_COORDINATION_V1 | RecoveryEnvelope::hub-case-rebind |
| staff_claim_task | rf_staff_workspace_child | TriageTask | AST_054_CLINICAL_WORKSPACE_V1 | RecoveryEnvelope::workspace-task-rebind |
| pharmacy_console_settlement | rf_pharmacy_console | PharmacyCase | AST_054_PHARMACY_SERVICING_V1 | RecoveryEnvelope::pharmacy-console-settlement |

            ## Interpretation

            - `claim`, `respond_more_info`, `reply_message`, `respond_callback`, `manage_booking`, `accept_waitlist_offer`, `accept_network_alternative`, `pharmacy_choice`, `pharmacy_consent`, `support_repair_action`, and `ops_resilience_action` all resolve one exact governing object.
            - Additional rows for `hub_manage_booking`, `staff_claim_task`, and `pharmacy_console_settlement` preserve the same route-intent law in staff, hub, and servicing-site shells.
            - Every row names the governing bounded context instead of letting the launching shell or contributor context invent authority locally.
