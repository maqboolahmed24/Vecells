# 08 Simulator And Local Stub Strategy

        No browser may call partner systems directly; simulators sit behind the same internal adapter boundaries. Simulator success must never be projected as live external confirmation. Any dependency blocked on contracting, account creation, SCAL, Sandpit, AOS, or other partner approval stays partial or non-simulatable until that gate is real.

        ## Simulator Posture: `yes`

| Dependency | Name | Local Stub Strategy |
| --- | --- | --- |
| dep_pds_fhir_enrichment | Optional PDS enrichment seam | Use synthetic PDS response fixtures and fail-closed enrichment toggles; keep real credentials and legal-basis proof out of this task. |

## Simulator Posture: `partial`

| Dependency | Name | Local Stub Strategy |
| --- | --- | --- |
| dep_nhs_login_rail | NHS login authentication rail | Use the official mock-authorisation style harness and local callback fixtures; keep final redirect URI, consent, and live subject-binding proof for later onboarding. |
| dep_telephony_ivr_recording_provider | Telephony, IVR, and call-recording provider | Run local webhook simulators, seeded call sessions, and fake recording objects; reserve real number provisioning and live carrier proof for later tasks. |
| dep_transcription_processing_provider | Transcript and derived-facts processing provider | Use repository-local fixtures for transcript states and derivation packages; keep vendor-specific latency and quality proof for later onboarding. |
| dep_sms_notification_provider | SMS delivery provider | Use a local notification sink with deterministic receipt states and opaque grant fixtures; reserve real sender registration and delivery truth for later provisioning. |
| dep_email_notification_provider | Email and notification delivery provider | Use a local sink and deterministic receipt fixtures; reserve real sender-domain verification and inbox routing for later provisioning. |
| dep_malware_scanning_provider | Malware and artifact scanning provider | Use deterministic pass, quarantine, and timeout fixtures in place of real scanner projects; reserve live signatures, latency, and vendor attestation for later tasks. |
| dep_im1_pairing_programme | IM1 Pairing programme and prerequisite path | Use deterministic supplier simulators and mock API fixtures while treating pairing approval, SCAL, and live rollout as non-simulatable gates. |
| dep_gp_system_supplier_paths | Principal GP-system supplier integration paths | Use supplier-specific mocks and capability fixtures while treating live bindings, local consumers, and assured outcome paths as later tasks. |
| dep_local_booking_supplier_adapters | Local booking supplier adapter family | Use local supplier simulators and deterministic confirmation ladders; reserve real search and commit credentials for later selection and provisioning work. |
| dep_network_capacity_partner_feeds | Network and hub partner capacity feeds | Use deterministic partner-feed snapshots and trust states locally; treat live partner availability and native hub system proof as later work. |
| dep_cross_org_secure_messaging_mesh | Cross-organisation secure messaging rail including MESH | Use local secure-message simulators with deterministic receipt and replay states; keep real mailbox requests and certificates for later onboarding tasks. |
| dep_origin_practice_ack_rail | Origin-practice acknowledgement rail | Simulate generation-bound acknowledgement cycles locally while reserving real mailbox or API acknowledgements for later provisioning work. |
| dep_pharmacy_directory_dohs | Pharmacy directory and discovery dependency | Use frozen provider snapshots and deterministic stale, suppressed, and safe-choice fixtures; keep live API access and deprecation handling for later tasks. |
| dep_pharmacy_referral_transport | Pharmacy referral transport dependency | Use transport simulators and deterministic proof envelopes for happy and degraded cases; reserve live BaRS, mailbox, or supplier transport configuration for later tasks. |
| dep_pharmacy_outcome_observation | Pharmacy outcome observation and reconciliation path | Use synthetic Update Record, email-ingest, and manual-capture fixtures with strong, weak, unmatched, and replay cases; reserve live assured combinations for later tasks. |
| dep_nhs_app_embedded_channel_ecosystem | NHS App embedded-channel ecosystem | Use embedded-preview mode, manifest fixtures, and simulated bridge capabilities locally; reserve Sandpit, AOS, site links, and SCAL for later tasks. |
| dep_assistive_model_vendor_family | Assistive model vendor and subprocessor family | Use local deterministic draft and suggestion fixtures with trust-state toggles; reserve real vendor credentials and subprocessor evidence for future optional rollout work. |

## Simulator Posture: `no`

| Dependency | Name | Local Stub Strategy |
| --- | --- | --- |
| dep_pharmacy_urgent_return_professional_routes | Pharmacy urgent-return and professional-contact routes | Configuration can be stubbed, but the actual human acknowledgement and urgent return path cannot be truthfully simulated as live-authoritative. |
| dep_nhs_assurance_and_standards_sources | NHS standards and assurance source set | No truthful simulator. The local system can model watchlist rows, but the authoritative external standards posture still requires human review and current source authority. |
