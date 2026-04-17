# 59 Mock Now Vs Actual Provider Cutover

        Every simulator-backed dependency now carries one bounded cutover strategy so live onboarding can happen later without rewriting domain truth.

        | Simulator | Primary dependency | Twin type | Supported cases | Blocked live gates | Rollback-to-simulator law |
        | --- | --- | --- | ---: | ---: | --- |
        | sim_booking_capacity_feed_twin | dep_network_capacity_partner_feeds | workflow_twin | 1 | 3 | Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode. |
| sim_booking_provider_confirmation_twin | dep_local_booking_supplier_adapters | near-live_contract_twin | 1 | 6 | Return immediately to simulator-backed secure messaging and manual escalation. |
| sim_email_notification_twin | dep_email_notification_provider | workflow_twin | 6 | 1 | Disable live webhook entry and continue from simulator-backed resend and repair drills. |
| sim_im1_principal_system_emis_twin | dep_im1_pairing_programme | near-live_contract_twin | 1 | 6 | Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode. |
| sim_im1_principal_system_tpp_twin | dep_gp_system_supplier_paths | near-live_contract_twin | 1 | 6 | Withdraw live provider binding and revert all booking routes to simulator or assisted fallback mode. |
| sim_mesh_message_path_twin | dep_cross_org_secure_messaging_mesh | near-live_contract_twin | 2 | 5 | Return immediately to simulator-backed secure messaging and manual escalation. |
| sim_nhs_login_auth_session_twin | dep_nhs_login_rail | proof_twin | 1 | 4 | Withdraw live callback tuple and return immediately to simulator-backed recovery mode. |
| sim_optional_pds_enrichment_twin | dep_pds_fhir_enrichment | workflow_twin | 1 | 5 | Withdraw live callback tuple and return immediately to simulator-backed recovery mode. |
| sim_pharmacy_dispatch_transport_twin | dep_pharmacy_referral_transport | near-live_contract_twin | 1 | 6 | Disable live route immediately and continue from simulator or manual pharmacy handoff. |
| sim_pharmacy_visibility_update_record_twin | dep_pharmacy_outcome_observation | proof_twin | 1 | 5 | Disable live route immediately and continue from simulator or manual pharmacy handoff. |
| sim_sms_delivery_twin | dep_sms_notification_provider | workflow_twin | 3 | 1 | Disable live webhook entry and continue from simulator-backed resend and repair drills. |
| sim_telephony_ivr_twin | dep_telephony_ivr_recording_provider | fault_injection_twin | 4 | 4 | Disable live webhook entry and continue from simulator-backed resend and repair drills. |
| sim_transcription_processing_twin | dep_transcription_processing_provider | fault_injection_twin | 1 | 3 | Stop live processing adapters and preserve simulator-based quarantine and transcript drills. |

        ## Cutover Rules

        - Provider onboarding prerequisites and secret classes are explicit before cutover is legal.
        - Mock-now and actual-provider-later must preserve the same aggregate, blocker, settlement, and recovery semantics.
        - Rollback back to the simulator is first-class and immediate when the live tuple drifts or evidence expires.
