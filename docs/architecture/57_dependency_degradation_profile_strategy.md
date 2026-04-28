# 57 Dependency Degradation Profile Strategy

        The degradation pack makes failure blast radius, fallback posture, and assurance impact explicit per dependency boundary. Each row names the maximum workload-family escalation it may trigger and the exact topology fallback mode the platform must use instead of inferring outage scope locally.

        ## Rules

        - `maximumEscalationFamilyRefs[]` stays bounded and machine-checkable.
        - `topologyFallbackMode` controls how the boundary fails without widening browser, gateway, or command truth ad hoc.
        - `manualReviewMode` and `freezeMode` keep recovery in the same shell and under the same governing tuple.
        - Retry posture reuses the seq_039 retry classes instead of inventing provider-local loops.

        ## Active Profiles

        | dependencyCode | failureMode | severity | topologyFallbackMode | maximumEscalationFamilyRefs |
| --- | --- | --- | --- | --- |
| dep_nhs_login_rail | callback_replay_or_authority_pending | critical | gateway_read_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_pds_fhir_enrichment | legal_basis_off_or_match_ambiguous | critical | gateway_read_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_telephony_ivr_recording_provider | webhook_replay_or_recording_missing | critical | integration_queue_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_transcription_processing_provider | extractor_timeout_or_conflicting_outputs | high | projection_stale | wf_projection_read_models, wf_assurance_security_control |
| dep_sms_notification_provider | delivery_disputed_or_recipient_unknown | critical | integration_queue_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_email_notification_provider | delivery_disputed_or_recipient_unknown | critical | integration_queue_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_malware_scanning_provider | scan_timeout_or_quarantine_required | high | projection_stale | wf_projection_read_models, wf_assurance_security_control |
| dep_im1_pairing_programme | pairing_or_programme_gate_blocked | high | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_gp_system_supplier_paths | supplier_roster_or_capability_drift | high | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_local_booking_supplier_adapters | provider_commit_pending_or_hold_expired | high | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_network_capacity_partner_feeds | feed_stale_or_partial_capacity_snapshot | high | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_cross_org_secure_messaging_mesh | ack_missing_or_duplicate_delivery | critical | integration_queue_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_origin_practice_ack_rail | acknowledgement_missing_or_scope_drift | critical | integration_queue_only | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_pharmacy_directory_dohs | directory_tuple_drift_or_no_safe_provider | critical | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_pharmacy_referral_transport | transport_timeout_or_acceptance_without_settlement | critical | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_pharmacy_outcome_observation | outcome_delayed_or_disputed | critical | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_pharmacy_urgent_return_professional_routes | urgent_return_required_or_contact_route_disputed | critical | command_halt | wf_command_orchestration, wf_projection_read_models, wf_assurance_security_control |
| dep_nhs_app_embedded_channel_ecosystem | site_link_drift_or_embedded_callback_mismatch | high | gateway_read_only | wf_projection_read_models, wf_assurance_security_control |
| dep_assistive_model_vendor_family | vendor_drift_or_assurance_quarantine | medium | local_placeholder | wf_assurance_security_control |
| dep_nhs_assurance_and_standards_sources | standards_digest_stale_or_source_drift | medium | local_placeholder | wf_assurance_security_control |
