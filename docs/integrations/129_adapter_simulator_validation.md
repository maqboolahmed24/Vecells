# 129 Adapter Simulator Validation

Generated: 2026-04-14T05:30:24.144Z

## Mock_now_execution

Vecells now has one explicit validation board for the current simulator-first adapter estate. This task validates the real adapter-simulators HTTP backplane where it exists, validates standalone seeded services where they are the current bounded implementation, and records explicit partial or blocked rows where the repo only has contract packs or no runtime at all.

## Summary

- Adapter rows: 18
- Pass: 11
- Partial: 6
- Blocked: 1
- Dishonest: 0
- Runtime-validated rows: 11

## Pass Rows

- adp_nhs_login_auth_bridge via runtime_http: Begin -> callback -> token flows through the real simulator backplane. The same idempotency key returns the prior token payload without a second side effect. A different idempotency key is rejected instead of silently widening authority.
- adp_optional_pds_enrichment via standalone_http: Ambiguous search returns multiple bounded matches without implying durable identity authority. Minimum-necessary projections stay explicit on partial-field reads. FHIR write capability remains explicitly unsupported instead of silently succeeding.
- adp_telephony_ivr_recording via runtime_http: Signature failure freezes the callback under recovery-required posture. Duplicate callback delivery reuses the same fenced receipt rather than widening side effects. Replay-safe retry clears the callback fence without flattening urgent or evidence posture.
- adp_transcription_processing via standalone_http: The same idempotency key replays the original transcript job instead of creating a duplicate. Signature-retry recovery stays explicit before readiness can advance. Supersession replaces the older transcript job rather than letting it keep driving readiness.
- adp_sms_notification_delivery via runtime_http: Duplicate dispatch reuses the same notification envelope instead of emitting a second side effect. Wrong-recipient dispute emits a reachability observation and only settles after repair.
- adp_email_notification_delivery via runtime_http: Duplicate dispatch reuses the same notification envelope instead of emitting a second side effect. Signature failure remains blocked rather than silently reporting a delivered state.
- adp_im1_pairing_programme_gate via runtime_http: Search, hold, and commit stay inside the provider-specific simulator contract. Duplicate commit submissions replay onto the prior appointment instead of creating a second side effect.
- adp_gp_supplier_path_resolution via runtime_http: Search, hold, and commit stay inside the provider-specific simulator contract. Duplicate commit submissions replay onto the prior appointment instead of creating a second side effect.
- adp_local_booking_supplier via runtime_http: Weak confirmation stays explicit through the simulated ExternalConfirmationGate. Duplicate commit submissions replay onto the prior appointment instead of creating a second side effect.
- adp_mesh_secure_message via runtime_http: Duplicate delivery remains explicit transport ambiguity instead of fake completion. The same acknowledgement fence replays without producing a second receipt side effect.
- adp_origin_practice_ack via runtime_http: Weak confirmation stays explicit through the simulated ExternalConfirmationGate. Duplicate commit submissions replay onto the prior appointment instead of creating a second side effect.

## Partial And Blocked Rows

- adp_malware_artifact_scanning -> blocked: adp_malware_artifact_scanning has a canonical adapter profile and seeded evidence pack, but no executable simulator runtime is currently present in the repo. (GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1)
- adp_network_capacity_feed -> partial: adp_network_capacity_feed remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_NETWORK_CAPACITY_FEED_V1)
- adp_pharmacy_directory_lookup -> partial: adp_pharmacy_directory_lookup remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_PHARMACY_DIRECTORY_LOOKUP_V1)
- adp_pharmacy_referral_transport -> partial: adp_pharmacy_referral_transport remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_PHARMACY_REFERRAL_TRANSPORT_V1)
- adp_pharmacy_outcome_observation -> partial: adp_pharmacy_outcome_observation remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_PHARMACY_OUTCOME_OBSERVATION_V1)
- adp_pharmacy_urgent_return_contact -> partial: adp_pharmacy_urgent_return_contact remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_PHARMACY_URGENT_RETURN_CONTACT_V1)
- adp_nhs_app_embedded_bridge -> partial: adp_nhs_app_embedded_bridge remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family. (GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_ADP_NHS_APP_EMBEDDED_BRIDGE_V1)

## Actual_provider_strategy_later

Live-provider motion keeps the same adapter ids, degradation profile refs, and unsupported-capability boundaries wherever possible. The handover matrix in data/integration/live_provider_handover_matrix.csv names the remaining onboarding evidence, provider-specific assumptions, and monitoring proof each adapter will need before any runtime swap is credible.
