# 129 Adapter Degraded Mode Matrix

Generated: 2026-04-14T05:30:24.144Z

## Matrix

### adp_nhs_login_auth_bridge

- Validation state: pass
- Failure mode class: callback_ambiguity
- Degraded default: Freeze the route in claim-pending or auth-read-only posture until writable authority is re-proven for the same subject and route intent.
- Proof objects: SessionEstablishmentDecision, IdentityBinding, RouteIntentBinding, SessionContinuityFence
- Simulator counterparts: NHS login auth and session twin (proof_twin, hybrid_contract_twin)

### adp_optional_pds_enrichment

- Validation state: pass
- Failure mode class: trust_revocation
- Degraded default: Keep enrichment fully off and rely on local matching only; do not widen patient identity confidence from incomplete or legally unapproved PDS signals.
- Proof objects: IdentityBindingAuthority, PdsEnrichmentDecision, MatchConfidenceSnapshot, FeatureFlagDecision, WrongPatientRepairHold
- Simulator counterparts: Optional PDS enrichment twin (workflow_twin, permanent_fallback)

### adp_telephony_ivr_recording

- Validation state: pass
- Failure mode class: callback_ambiguity
- Degraded default: Hold the request in callback, audio-review, or urgent-live-only posture when recording availability is weaker than evidence readiness.
- Proof objects: CallSession, CallbackOutcomeEvidenceBundle, AdapterReceiptCheckpoint, CallSessionRecord, RecordingAvailabilityObservation, EvidenceReadinessAssessment, SMSContinuationGrant
- Simulator counterparts: Telephony and IVR twin (fault_injection_twin, hybrid_contract_twin)

### adp_transcription_processing

- Validation state: pass
- Failure mode class: transport_loss
- Degraded default: Keep transcript output in degraded, manual-review, or continuation-challenge posture until readiness is explicitly safety-usable.
- Proof objects: TelephonyTranscriptReadinessRecord, TelephonyEvidenceReadinessAssessment, TranscriptReadinessDecision, DerivedFactsPackage, ManualReviewRequirement, SupersessionLedgerEntry
- Simulator counterparts: Transcription processing twin (fault_injection_twin, hybrid_contract_twin)

### adp_sms_notification_delivery

- Validation state: pass
- Failure mode class: callback_ambiguity
- Degraded default: Withdraw seeded continuation trust and fall back to challenge-based continuation or another governed contact route when recipient or delivery truth is disputed.
- Proof objects: AdapterReceiptCheckpoint, AccessGrant, CommunicationEnvelope, ReplayReviewDecision, ControlledResendAuthorisation, DeliveryRepairWindow, AuditReplayEnvelope, SMSContinuationGrant, DeliveryEvidence, LinkRedemptionFence, WrongRecipientRepairDecision
- Simulator counterparts: Support replay and resend twin (proof_twin, permanent_fallback), SMS delivery twin (workflow_twin, hybrid_contract_twin)

### adp_email_notification_delivery

- Validation state: pass
- Failure mode class: callback_ambiguity
- Degraded default: Preserve a read-only, pending-delivery, or repair-needed posture until current delivery evidence or a governed fallback settles the route.
- Proof objects: MessageDeliveryEvidenceBundle, AdapterReceiptCheckpoint, CommunicationEnvelope, ReplayReviewDecision, ControlledResendAuthorisation, DeliveryRepairWindow, AuditReplayEnvelope, DeliveryAttempt, DeliveryEvidence, TemplateVersionBinding, RepairDecision
- Simulator counterparts: Support replay and resend twin (proof_twin, permanent_fallback), Email notification twin (workflow_twin, hybrid_contract_twin)

### adp_malware_artifact_scanning

- Validation state: blocked
- Failure mode class: transport_loss
- Degraded default: Fail closed into quarantined, unreadable, or reacquire-required posture until the current artifact verdict is explicit.
- Proof objects: ScanVerdict, QuarantineDecision, ReleaseFromQuarantineDecision, ReacquireEvidenceRequest
- Simulator counterparts: Malware and artifact scanning twin (fault_injection_twin, hybrid_contract_twin)

### adp_im1_pairing_programme_gate

- Validation state: pass
- Failure mode class: trust_revocation
- Degraded default: Keep the path simulator-only, supported-test-only, or assisted-only until the exact supplier and environment clear the IM1 stage pack.
- Proof objects: ProviderCapabilitySnapshot, SlotSearchTruth, BookingCommitAttempt, BookingConfirmationTruthProjection
- Simulator counterparts: IM1 principal-system EMIS twin (near-live_contract_twin, hybrid_contract_twin), IM1 principal-system TPP twin (near-live_contract_twin, hybrid_contract_twin)

### adp_gp_supplier_path_resolution

- Validation state: pass
- Failure mode class: semantic_contract_mismatch
- Degraded default: Keep supplier paths in simulator, assisted-only, or reconciliation-required posture until the current supplier binding and supported action tuple are published.
- Proof objects: ProviderCapabilitySnapshot, SlotSearchTruth, BookingCommitAttempt, BookingConfirmationTruthProjection
- Simulator counterparts: IM1 principal-system EMIS twin (near-live_contract_twin, hybrid_contract_twin), IM1 principal-system TPP twin (near-live_contract_twin, hybrid_contract_twin)

### adp_local_booking_supplier

- Validation state: pass
- Failure mode class: accepted_pending_stall
- Degraded default: Hold the booking in confirmation-pending, supplier-reconciliation-pending, waitlist, or callback fallback posture until durable confirmation proof exists.
- Proof objects: BookingConfirmationTruthProjection, BookingTransaction, ProviderCapabilitySnapshot, ExternalConfirmationGate, RequestLifecycleLease
- Simulator counterparts: Booking provider confirmation twin (near-live_contract_twin, hybrid_contract_twin)

### adp_network_capacity_feed

- Validation state: partial
- Failure mode class: transport_loss
- Degraded default: Treat the feed as diagnostic-only, callback-only, or quarantined when freshness or trust admission no longer holds.
- Proof objects: CandidateSnapshot, NetworkCoordinationPolicyEvaluation, CapacitySnapshot, ReservationWindowEvidence, NoSlotFallbackDecision, CallbackOfferEligibility
- Simulator counterparts: Booking capacity feed twin (workflow_twin, hybrid_contract_twin)

### adp_mesh_secure_message

- Validation state: pass
- Failure mode class: callback_ambiguity
- Degraded default: Keep the route in pending-delivery, monitored-mailbox, or escalation posture when transport receipt is weaker than current delivery evidence.
- Proof objects: MESHMessageEnvelope, TransportReceipt, ReplayFence, DeliveryObservation
- Simulator counterparts: MESH message path twin (near-live_contract_twin, hybrid_contract_twin)

### adp_origin_practice_ack

- Validation state: pass
- Failure mode class: accepted_pending_stall
- Degraded default: Keep practice visibility in overdue-ack, recovery-required, or exception-pending posture until the current truth tuple is acknowledged or explicitly excepted.
- Proof objects: PracticeAcknowledgementRecord, ProviderCapabilitySnapshot, ExternalConfirmationGate, BookingConfirmationTruthProjection, RequestLifecycleLease
- Simulator counterparts: Booking provider confirmation twin (near-live_contract_twin, hybrid_contract_twin)

### adp_pharmacy_directory_lookup

- Validation state: partial
- Failure mode class: semantic_contract_mismatch
- Degraded default: Regenerate the directory, warn about drift, or constrain to clinician-guided choice when the current snapshot is stale or materially changed.
- Proof objects: PharmacyDirectorySnapshot, PharmacyChoiceProof, PharmacyProviderCapabilitySnapshot, ChoiceTupleFreshness
- Simulator counterparts: Pharmacy directory and choice twin (proof_twin, replace_with_live_guarded)

### adp_pharmacy_referral_transport

- Validation state: partial
- Failure mode class: transport_loss
- Degraded default: Hold the referral in proof-pending, contradiction-review, or controlled-redispatch posture until current dispatch proof and acknowledgement thresholds are satisfied.
- Proof objects: DispatchProofEnvelope, TransportAssuranceProfile, ExternalConfirmationGate, PharmacyDispatchEnvelope, PharmacyDispatchAcknowledgement, PharmacyDispatchExpiry
- Simulator counterparts: Pharmacy dispatch transport twin (near-live_contract_twin, hybrid_contract_twin)

### adp_pharmacy_outcome_observation

- Validation state: partial
- Failure mode class: accepted_pending_stall
- Degraded default: Keep the case in outcome-reconciliation-pending or safety-review posture until the outcome matches the active case and replay concerns are cleared.
- Proof objects: PharmacyOutcomeRecord, PharmacyBounceBackRecord, PharmacyCase, PharmacyOutcomeReconciliationGate, PharmacyOutcomeMatchAssessment, UpdateRecordVisibilityObservation
- Simulator counterparts: Pharmacy visibility and Update Record twin (proof_twin, hybrid_contract_twin)

### adp_pharmacy_urgent_return_contact

- Validation state: partial
- Failure mode class: trust_revocation
- Degraded default: Treat the route as unavailable or unsafe until urgent-return ownership and current acknowledgement are explicit.
- Proof objects: PharmacyCase
- Simulator counterparts: No current simulator counterpart; explicit watch-only contract pack only

### adp_nhs_app_embedded_bridge

- Validation state: partial
- Failure mode class: semantic_contract_mismatch
- Degraded default: Drop to safe browser handoff, read-only embed, or placeholder-only posture when manifest, bridge, or embedded continuity evidence drifts.
- Proof objects: NHSAppIntegrationManifest, PatientEmbeddedNavEligibility, PatientEmbeddedSessionProjection, SiteLinkPublicationTuple, EmbeddedBridgeCapabilitySnapshot, AppReturnIntent, ReleaseGateEvidence
- Simulator counterparts: NHS App embedded bridge twin (workflow_twin, replace_with_live_guarded)

