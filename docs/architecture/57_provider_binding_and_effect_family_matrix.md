# 57 Provider Binding And Effect Family Matrix

        The effect-family matrix shows how the shared profile template is consumed by the major binding families:

        - `BookingProviderAdapterBinding` for IM1, GP supplier, booking, capacity, and practice acknowledgement lanes
        - `PharmacyChoiceAdapterBinding` and `PharmacyDispatchAdapterBinding` for directory, transport, outcome, and urgent-return lanes
        - `MessageDispatchEnvelope`, `CallbackAttemptRecord`, and `PartnerMessageBinding` for notification, telephony, and secure messaging lanes
        - `IdentityBoundaryAdapterBinding`, `EmbeddedChannelAdapterBinding`, `EvidenceProcessingAdapterBinding`, and `AssuranceWatchAdapterBinding` for the remaining boundaries

        | effectFamilyId | bindingFamily | adapterCode | dependencyCode | supportedActionScopes |
| --- | --- | --- | --- | --- |
| fxf_nhs_login_auth_handoff | IdentityBoundaryAdapterBinding | adp_nhs_login_auth_bridge | dep_nhs_login_rail | claim; support_repair_action |
| fxf_optional_pds_enrichment_lookup | IdentityBoundaryAdapterBinding | adp_optional_pds_enrichment | dep_pds_fhir_enrichment | claim; support_repair_action |
| fxf_telephony_ivr_callback_boundary | CallbackAttemptRecord | adp_telephony_ivr_recording | dep_telephony_ivr_recording_provider | reply_message; respond_callback; support_repair_action |
| fxf_transcription_processing_derivation | EvidenceProcessingAdapterBinding | adp_transcription_processing | dep_transcription_processing_provider | ops_resilience_action; support_repair_action |
| fxf_sms_notification_delivery | MessageDispatchEnvelope | adp_sms_notification_delivery | dep_sms_notification_provider | reply_message; respond_callback; support_repair_action |
| fxf_email_notification_delivery | MessageDispatchEnvelope | adp_email_notification_delivery | dep_email_notification_provider | reply_message; respond_callback; support_repair_action |
| fxf_malware_artifact_scan | EvidenceProcessingAdapterBinding | adp_malware_artifact_scanning | dep_malware_scanning_provider | ops_resilience_action; support_repair_action |
| fxf_im1_pairing_programme_gate | BookingProviderAdapterBinding | adp_im1_pairing_programme_gate | dep_im1_pairing_programme | manage_booking; accept_waitlist_offer; accept_network_alternative |
| fxf_gp_supplier_path_resolution | BookingProviderAdapterBinding | adp_gp_supplier_path_resolution | dep_gp_system_supplier_paths | manage_booking; accept_waitlist_offer; accept_network_alternative |
| fxf_local_booking_commit_and_manage | BookingProviderAdapterBinding | adp_local_booking_supplier | dep_local_booking_supplier_adapters | manage_booking; accept_waitlist_offer; accept_network_alternative |
| fxf_network_capacity_feed_import | BookingProviderAdapterBinding | adp_network_capacity_feed | dep_network_capacity_partner_feeds | manage_booking; accept_waitlist_offer; accept_network_alternative |
| fxf_mesh_secure_message_dispatch | PartnerMessageBinding | adp_mesh_secure_message | dep_cross_org_secure_messaging_mesh | reply_message; respond_more_info; support_repair_action |
| fxf_origin_practice_acknowledgement | PartnerMessageBinding | adp_origin_practice_ack | dep_origin_practice_ack_rail | reply_message; respond_more_info; support_repair_action |
| fxf_pharmacy_directory_lookup | PharmacyChoiceAdapterBinding | adp_pharmacy_directory_lookup | dep_pharmacy_directory_dohs | pharmacy_choice; pharmacy_consent; support_repair_action |
| fxf_pharmacy_dispatch_transport | PharmacyDispatchAdapterBinding | adp_pharmacy_referral_transport | dep_pharmacy_referral_transport | pharmacy_choice; pharmacy_consent; support_repair_action |
| fxf_pharmacy_outcome_observation | PharmacyDispatchAdapterBinding | adp_pharmacy_outcome_observation | dep_pharmacy_outcome_observation | pharmacy_choice; pharmacy_consent; support_repair_action |
| fxf_pharmacy_urgent_return_contact | PharmacyDispatchAdapterBinding | adp_pharmacy_urgent_return_contact | dep_pharmacy_urgent_return_professional_routes | pharmacy_choice; pharmacy_consent; support_repair_action |
| fxf_nhs_app_embedded_channel_bridge | EmbeddedChannelAdapterBinding | adp_nhs_app_embedded_bridge | dep_nhs_app_embedded_channel_ecosystem | claim; support_repair_action |
| fxf_assistive_vendor_watch | AssuranceWatchAdapterBinding | adp_assistive_model_vendor_watch | dep_assistive_model_vendor_family | ops_resilience_action |
| fxf_assurance_standards_watch | AssuranceWatchAdapterBinding | adp_standards_source_watch | dep_nhs_assurance_and_standards_sources | ops_resilience_action |
