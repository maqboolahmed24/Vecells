# 129 Seeded External Contract Catalog

Generated: 2026-04-14T05:30:24.144Z

## Scope

This catalog binds each current external adapter row to:

- its canonical adapter contract profile
- its simulator contract ref
- its degradation profile
- explicit unsupported capabilities
- seeded fixtures
- the current validation verdict

## Adapter Rows

### adp_nhs_login_auth_bridge

- Label: NHS login auth bridge
- Family: identity_access
- Validation: pass
- Simulator contract: sim_nhs_login_auth_session_twin
- Adapter contract profile: ACP_057_DEP_NHS_LOGIN_RAIL_V1
- Degradation profile: DDP_057_DEP_NHS_LOGIN_RAIL_PRIMARY_V1
- Unsupported capability refs: cap_live_partner_redirect_mutation_not_supported, cap_auth_callback_equals_patient_ownership_not_supported
- Seed fixtures: SEED_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_ACCESS_GRANT_V1, SEED_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_PATIENT_IDENTITY_SEED_V1, grant_scope_envelopes, identity_subject_catalog, route_intent_fixtures
- Notes: Replay-safe browser callback plus same-fence session establishment. Partner approval and current redirect inventory; Technical conformance evidence NHS login keeps callback evidence separate from durable patient ownership.

### adp_optional_pds_enrichment

- Label: Optional PDS enrichment seam
- Family: identity_access
- Validation: pass
- Simulator contract: sim_optional_pds_enrichment_twin
- Adapter contract profile: ACP_057_DEP_PDS_FHIR_ENRICHMENT_V1
- Degradation profile: DDP_057_DEP_PDS_FHIR_ENRICHMENT_PRIMARY_V1
- Unsupported capability refs: cap_fhir_writeback_not_supported, cap_pds_match_equals_durable_identity_binding_not_supported
- Seed fixtures: SEED_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_ACCESS_GRANT_V1, SEED_059_WRONG_PATIENT_IDENTITY_REPAIR_HOLD_PATIENT_IDENTITY_SEED_V1, grant_scope_envelopes, identity_subject_catalog, route_intent_fixtures
- Notes: Replay-safe browser callback plus same-fence session establishment. Legal basis and selected access mode; Named approver and environment PDS remains optional enrichment only and never widens identity truth on its own.

### adp_telephony_ivr_recording

- Label: Telephony and IVR provider
- Family: communications
- Validation: pass
- Simulator contract: sim_telephony_ivr_twin
- Adapter contract profile: ACP_057_DEP_TELEPHONY_IVR_RECORDING_PROVIDER_V1
- Degradation profile: DDP_057_DEP_TELEPHONY_IVR_RECORDING_PROVIDER_PRIMARY_V1
- Unsupported capability refs: cap_live_emergency_dispatch_not_supported, cap_recording_ready_equals_evidence_usable_not_supported
- Seed fixtures: SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_COMMUNICATION_ENVELOPE_V1, SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_ACCESS_GRANT_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_TELEPHONY_CALL_SESSION_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_TELEPHONY_CONTINUATION_CONTEXT_V1, SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_TELEPHONY_CALL_SESSION_V1, SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_TRANSCRIPT_STUB_V1, SEED_059_URGENT_DIVERSION_REQUIRED_THEN_ISSUED_PATIENT_IDENTITY_SEED_V1, SEED_059_URGENT_DIVERSION_REQUIRED_THEN_ISSUED_TELEPHONY_CALL_SESSION_V1, callback_contact_routes, delivery_event_sequences, message_dispatch_rows
- Notes: Webhook or callback ingestion always replays onto the same provider correlation fence. Vendor approval and spend authority; Webhook security and replay posture Telephony callback truth stays bounded until explicit recovery.

### adp_transcription_processing

- Label: Transcription processing provider
- Family: evidence_processing
- Validation: pass
- Simulator contract: sim_transcription_processing_twin
- Adapter contract profile: ACP_057_DEP_TRANSCRIPTION_PROCESSING_PROVIDER_V1
- Degradation profile: DDP_057_DEP_TRANSCRIPTION_PROCESSING_PROVIDER_PRIMARY_V1
- Unsupported capability refs: cap_direct_transcript_promotion_not_supported, cap_live_vendor_callback_trust_not_supported
- Seed fixtures: SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_TELEPHONY_CALL_SESSION_V1, SEED_059_TELEPHONY_URGENT_LIVE_ONLY_CAPTURE_TRANSCRIPT_STUB_V1, artifact_hash_catalog, evidence_snapshot_rows, processing_fault_profiles
- Notes: Polling or callback ingest joins the same artifact or evidence fence. Region and retention posture; Webhook security evidence Transcript readiness remains weaker than evidence usability.

### adp_sms_notification_delivery

- Label: SMS notification provider
- Family: communications
- Validation: pass
- Simulator contract: sim_sms_delivery_twin
- Adapter contract profile: ACP_057_DEP_SMS_NOTIFICATION_PROVIDER_V1
- Degradation profile: DDP_057_DEP_SMS_NOTIFICATION_PROVIDER_PRIMARY_V1
- Unsupported capability refs: cap_transport_acceptance_equals_patient_safe_settlement_not_supported, cap_live_sender_mutation_not_supported
- Seed fixtures: SEED_059_DUPLICATE_COLLISION_OPEN_REVIEW_PATIENT_IDENTITY_SEED_V1, SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_COMMUNICATION_ENVELOPE_V1, SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_ACCESS_GRANT_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_PATIENT_IDENTITY_SEED_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_TELEPHONY_CALL_SESSION_V1, SEED_059_TELEPHONY_SEEDED_VS_CHALLENGE_CONTINUATION_TELEPHONY_CONTINUATION_CONTEXT_V1, callback_contact_routes, delivery_event_sequences, message_dispatch_rows
- Notes: Webhook or callback ingestion always replays onto the same provider correlation fence. Repair policy approval; Audit log export and replay guard evidence Repair stays explicit before authoritative settlement.

### adp_email_notification_delivery

- Label: Email notification provider
- Family: communications
- Validation: pass
- Simulator contract: sim_email_notification_twin
- Adapter contract profile: ACP_057_DEP_EMAIL_NOTIFICATION_PROVIDER_V1
- Degradation profile: DDP_057_DEP_EMAIL_NOTIFICATION_PROVIDER_PRIMARY_V1
- Unsupported capability refs: cap_transport_acceptance_equals_patient_safe_settlement_not_supported, cap_live_domain_mutation_not_supported
- Seed fixtures: SEED_059_FALLBACK_REVIEW_AFTER_ACCEPTED_PROGRESS_DEGRADES_COMMUNICATION_ENVELOPE_V1, SEED_059_FALLBACK_REVIEW_AFTER_ACCEPTED_PROGRESS_DEGRADES_PATIENT_IDENTITY_SEED_V1, SEED_059_CLEAN_SELF_SERVICE_SUBMIT_COMMUNICATION_ENVELOPE_V1, SEED_059_CLEAN_SELF_SERVICE_SUBMIT_PATIENT_IDENTITY_SEED_V1, SEED_059_DUPLICATE_COLLISION_OPEN_REVIEW_PATIENT_IDENTITY_SEED_V1, SEED_059_DUPLICATE_RETRY_RETURN_PRIOR_ACCEPTED_PATIENT_IDENTITY_SEED_V1, SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_COMMUNICATION_ENVELOPE_V1, SEED_059_SUPPORT_REPLAY_RESTORE_SAME_SHELL_RECOVERY_PATIENT_IDENTITY_SEED_V1, SEED_059_URGENT_DIVERSION_REQUIRED_THEN_ISSUED_PATIENT_IDENTITY_SEED_V1, SEED_059_URGENT_DIVERSION_REQUIRED_THEN_ISSUED_TELEPHONY_CALL_SESSION_V1, callback_contact_routes, delivery_event_sequences, message_dispatch_rows
- Notes: Webhook or callback ingestion always replays onto the same provider correlation fence. Repair policy approval; Audit log export and replay guard evidence Webhook signature recovery remains visible and unresolved until an operator-safe path clears it.

### adp_malware_artifact_scanning

- Label: Malware and artifact scanning twin
- Family: evidence_processing
- Validation: blocked
- Simulator contract: sim_malware_artifact_scan_twin
- Adapter contract profile: ACP_057_DEP_MALWARE_SCANNING_PROVIDER_V1
- Degradation profile: DDP_057_DEP_MALWARE_SCANNING_PROVIDER_PRIMARY_V1
- Unsupported capability refs: cap_runtime_scan_callback_service_not_supported, cap_clean_verdict_equals_release_not_supported
- Seed fixtures: 
- Notes: Polling or callback ingest joins the same artifact or evidence fence. Storage scope and quarantine policy; Webhook security and mutation gate posture adp_malware_artifact_scanning has a canonical adapter profile and seeded evidence pack, but no executable simulator runtime is currently present in the repo.

### adp_im1_pairing_programme_gate

- Label: IM1 pairing programme boundary
- Family: gp_booking
- Validation: pass
- Simulator contract: sim_im1_principal_system_emis_twin
- Adapter contract profile: ACP_057_DEP_IM1_PAIRING_PROGRAMME_V1
- Degradation profile: DDP_057_DEP_IM1_PAIRING_PROGRAMME_PRIMARY_V1
- Unsupported capability refs: cap_live_supplier_pairing_not_supported, cap_accepted_commit_equals_confirmed_booking_not_supported
- Seed fixtures: SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_BOOKING_CASE_V1, SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_PATIENT_IDENTITY_SEED_V1, booking_slot_windows, capacity_feed_snapshots, supplier_roster_rows
- Notes: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash. Current supplier roster and pairing approval; Bounded use-case approval Provider-like confirmation remains explicit and typed.

### adp_gp_supplier_path_resolution

- Label: GP supplier path boundary
- Family: gp_booking
- Validation: pass
- Simulator contract: sim_im1_principal_system_tpp_twin
- Adapter contract profile: ACP_057_DEP_GP_SYSTEM_SUPPLIER_PATHS_V1
- Degradation profile: DDP_057_DEP_GP_SYSTEM_SUPPLIER_PATHS_PRIMARY_V1
- Unsupported capability refs: cap_live_supplier_mutation_not_supported, cap_supplier_path_resolution_without_current_capability_proof_not_supported
- Seed fixtures: SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_BOOKING_CASE_V1, SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_PATIENT_IDENTITY_SEED_V1, booking_slot_windows, capacity_feed_snapshots, supplier_roster_rows
- Notes: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash. Current supplier roster and pairing approval; Bounded use-case approval Provider-like confirmation remains explicit and typed.

### adp_local_booking_supplier

- Label: Local booking supplier adapters
- Family: gp_booking
- Validation: pass
- Simulator contract: sim_booking_provider_confirmation_twin
- Adapter contract profile: ACP_057_DEP_LOCAL_BOOKING_SUPPLIER_ADAPTERS_V1
- Degradation profile: DDP_057_DEP_LOCAL_BOOKING_SUPPLIER_ADAPTERS_PRIMARY_V1
- Unsupported capability refs: cap_accepted_commit_equals_confirmed_booking_not_supported, cap_hidden_weak_confirmation_not_supported
- Seed fixtures: SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_BOOKING_CASE_V1, SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_PATIENT_IDENTITY_SEED_V1, booking_slot_windows, capacity_feed_snapshots, mailbox_paths, message_bundle_hashes, partner_ack_sequences, supplier_roster_rows
- Notes: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash. Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture Accepted booking commit never auto-upgrades into confirmed truth.

### adp_network_capacity_feed

- Label: Network capacity partner feeds
- Family: gp_booking
- Validation: partial
- Simulator contract: sim_booking_capacity_feed_twin
- Adapter contract profile: ACP_057_DEP_NETWORK_CAPACITY_PARTNER_FEEDS_V1
- Degradation profile: DDP_057_DEP_NETWORK_CAPACITY_PARTNER_FEEDS_PRIMARY_V1
- Unsupported capability refs: cap_partner_feed_runtime_ingest_not_supported, cap_stale_capacity_equals_current_availability_not_supported
- Seed fixtures: SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_BOOKING_CASE_V1, SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_PATIENT_IDENTITY_SEED_V1, booking_slot_windows, capacity_feed_snapshots, supplier_roster_rows
- Notes: Search, hold, commit, and manage callbacks replay onto one BookingProviderAdapterBinding hash. Named partner feed provenance; Freshness and expiry policy adp_network_capacity_feed remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

### adp_mesh_secure_message

- Label: MESH secure messaging rail
- Family: messaging_transport
- Validation: pass
- Simulator contract: sim_mesh_message_path_twin
- Adapter contract profile: ACP_057_DEP_CROSS_ORG_SECURE_MESSAGING_MESH_V1
- Degradation profile: DDP_057_DEP_CROSS_ORG_SECURE_MESSAGING_MESH_PRIMARY_V1
- Unsupported capability refs: cap_transport_acceptance_equals_business_completion_not_supported, cap_live_mailbox_mutation_not_supported
- Seed fixtures: SEED_059_FALLBACK_REVIEW_AFTER_ACCEPTED_PROGRESS_DEGRADES_COMMUNICATION_ENVELOPE_V1, SEED_059_FALLBACK_REVIEW_AFTER_ACCEPTED_PROGRESS_DEGRADES_PATIENT_IDENTITY_SEED_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_COMMUNICATION_ENVELOPE_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PATIENT_IDENTITY_SEED_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PHARMACY_CASE_V1, mailbox_paths, message_bundle_hashes, partner_ack_sequences
- Notes: Receipts and polling both replay to one mailbox or acknowledgement fence. Named ODS owner and manager mode; API onboarding completion or approved live path Transport acceptance remains supporting evidence only.

### adp_origin_practice_ack

- Label: Local booking supplier adapters
- Family: gp_booking
- Validation: pass
- Simulator contract: sim_booking_provider_confirmation_twin
- Adapter contract profile: ACP_057_DEP_ORIGIN_PRACTICE_ACK_RAIL_V1
- Degradation profile: DDP_057_DEP_ORIGIN_PRACTICE_ACK_RAIL_PRIMARY_V1
- Unsupported capability refs: cap_origin_ack_equals_confirmed_outcome_not_supported, cap_hidden_practice_delay_not_supported
- Seed fixtures: SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_BOOKING_CASE_V1, SEED_059_BOOKING_CONFIRMATION_PENDING_AMBIGUITY_PATIENT_IDENTITY_SEED_V1, booking_slot_windows, capacity_feed_snapshots, mailbox_paths, message_bundle_hashes, partner_ack_sequences, supplier_roster_rows
- Notes: Receipts and polling both replay to one mailbox or acknowledgement fence. Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture Accepted booking commit never auto-upgrades into confirmed truth.

### adp_pharmacy_directory_lookup

- Label: Pharmacy Directory Lookup
- Family: pharmacy
- Validation: partial
- Simulator contract: sim_pharmacy_directory_choice_twin
- Adapter contract profile: ACP_057_DEP_PHARMACY_DIRECTORY_DOHS_V1
- Degradation profile: DDP_057_DEP_PHARMACY_DIRECTORY_DOHS_PRIMARY_V1
- Unsupported capability refs: cap_live_directory_refresh_runtime_not_supported, cap_stale_directory_equals_safe_choice_not_supported
- Seed fixtures: 
- Notes: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence. Service Search access approval and route policy; Choice tuple freshness and capability evidence adp_pharmacy_directory_lookup remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

### adp_pharmacy_referral_transport

- Label: Pharmacy referral transport
- Family: pharmacy
- Validation: partial
- Simulator contract: sim_pharmacy_dispatch_transport_twin
- Adapter contract profile: ACP_057_DEP_PHARMACY_REFERRAL_TRANSPORT_V1
- Degradation profile: DDP_057_DEP_PHARMACY_REFERRAL_TRANSPORT_PRIMARY_V1
- Unsupported capability refs: cap_runtime_pharmacy_dispatch_transport_not_supported, cap_transport_acceptance_equals_referral_settlement_not_supported
- Seed fixtures: SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_COMMUNICATION_ENVELOPE_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PATIENT_IDENTITY_SEED_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PHARMACY_CASE_V1, dispatch_envelopes, pharmacy_directory_rows, pharmacy_outcome_events
- Notes: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence. Named transport route profile and provider tuple; Dispatch proof and acknowledgement thresholds signed off adp_pharmacy_referral_transport remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

### adp_pharmacy_outcome_observation

- Label: Pharmacy outcome observation
- Family: pharmacy
- Validation: partial
- Simulator contract: sim_pharmacy_visibility_update_record_twin
- Adapter contract profile: ACP_057_DEP_PHARMACY_OUTCOME_OBSERVATION_V1
- Degradation profile: DDP_057_DEP_PHARMACY_OUTCOME_OBSERVATION_PRIMARY_V1
- Unsupported capability refs: cap_runtime_pharmacy_outcome_callback_not_supported, cap_hidden_outcome_reconciliation_drift_not_supported
- Seed fixtures: SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_COMMUNICATION_ENVELOPE_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PATIENT_IDENTITY_SEED_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PHARMACY_CASE_V1, dispatch_envelopes, pharmacy_directory_rows, pharmacy_outcome_events
- Notes: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence. Assured supplier/system combination for Update Record; Reconciliation runtime implementation reference adp_pharmacy_outcome_observation remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

### adp_pharmacy_urgent_return_contact

- Label: Pharmacy referral transport
- Family: pharmacy
- Validation: partial
- Simulator contract: sim_pharmacy_dispatch_transport_twin
- Adapter contract profile: ACP_057_DEP_PHARMACY_URGENT_RETURN_PROFESSIONAL_ROUTES_V1
- Degradation profile: DDP_057_DEP_PHARMACY_URGENT_RETURN_PROFESSIONAL_ROUTES_PRIMARY_V1
- Unsupported capability refs: cap_runtime_urgent_return_professional_route_not_supported, cap_urgent_return_hidden_under_transport_success_not_supported
- Seed fixtures: SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_COMMUNICATION_ENVELOPE_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PATIENT_IDENTITY_SEED_V1, SEED_059_PHARMACY_DISPATCH_PROOF_PENDING_WEAK_MATCH_PHARMACY_CASE_V1, dispatch_envelopes, pharmacy_directory_rows, pharmacy_outcome_events
- Notes: Dispatch receipts, directory refresh, and outcome callbacks collapse onto one pharmacy case fence. Named approver and environment; Secret posture and callback parity review adp_pharmacy_urgent_return_contact remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

### adp_nhs_app_embedded_bridge

- Label: Nhs App Embedded Bridge
- Family: embedded_channels
- Validation: partial
- Simulator contract: sim_nhs_app_embedded_bridge_twin
- Adapter contract profile: ACP_057_DEP_NHS_APP_EMBEDDED_CHANNEL_ECOSYSTEM_V1
- Degradation profile: DDP_057_DEP_NHS_APP_EMBEDDED_CHANNEL_ECOSYSTEM_PRIMARY_V1
- Unsupported capability refs: cap_live_embedded_claim_authority_not_supported, cap_embedded_bridge_without_site_link_publication_not_supported
- Seed fixtures: 
- Notes: Return callbacks, embedded claims, and site-link evidence replay onto the same bridge fence. Scope-window approval and commissioning posture; Current NHS login readiness for embedded use adp_nhs_app_embedded_bridge remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.

