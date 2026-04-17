        # 38 Local Adapter Simulator Backlog

        Generated: `2026-04-11T17:25:59+00:00`
        Visual mode: `Simulator_Foundry_Board`
        Phase 0 posture: `withheld`

        ## Summary

        - simulator rows: `17`
        - baseline-critical rows: `14`
        - proof-twin rows: `4`
        - blocked live-gate instances: `75`
        - execution phases: `4`

        ## Mock_now_execution

        This backlog turns "mock it for now" into one explicit simulator queue. Every row below is executable now, keeps proof and degraded-mode law intact, and points at later live-provider replacement or coexistence work.

        ### Top execution order

        | Rank | Simulator | Score | Fidelity | Blocker removed |
        | --- | --- | --- | --- | --- |
        | 1 | Pharmacy dispatch transport twin | 205 | `near-live_contract_twin` | Removes the block on dispatch proof, acknowledgement, expiry, redispatch, and manual-urgent handoff rehearsal before any live transport route is selected. |
| 2 | NHS login auth and session twin | 197 | `proof_twin` | Removes the block on auth transaction, callback replay, claim-pending, auth_read_only, and writable-session handling before partner approval and real redirect inventory arrive. |
| 3 | Booking provider confirmation twin | 197 | `near-live_contract_twin` | Removes the block on ambiguous commit, practice acknowledgement debt, and same-shell confirmation truth before any live booking supplier or practice rail is admissible. |
| 4 | Telephony and IVR twin | 197 | `fault_injection_twin` | Removes the block on IVR choreography, urgent-live preemption, recording evidence readiness, and continuation grant behavior before live numbers and webhooks exist. |
| 5 | Pharmacy visibility and Update Record twin | 187 | `proof_twin` | Removes the block on weak match, delayed outcome, practice-disabled visibility, and non-auto-close reconciliation behavior before any assured live combination exists. |
| 6 | MESH message path twin | 185 | `near-live_contract_twin` | Removes the block on replay-safe secure messaging proof, delivery observation, and escalation behavior before mailbox ownership and live onboarding complete. |
| 7 | Booking capacity feed twin | 176 | `workflow_twin` | Removes the block on stale capacity, no-slot fallback, callback offer, and hub-review states before any real partner feed or acknowledgement cadence is current. |
| 8 | IM1 principal-system EMIS twin | 172 | `near-live_contract_twin` | Removes the block on supplier-specific booking-search, hold, commit, and manage semantics for EMIS-shaped pathways before pairing and supplier evidence are current. |


        ### Full backlog

        | Simulator | Family | Phase | Scope | Replacement mode | Permanent fallback | Proof semantics |
        | --- | --- | --- | --- | --- | --- | --- |
        | `sim_pharmacy_dispatch_transport_twin`<br>Pharmacy dispatch transport twin | `pharmacy` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | PharmacyDispatchEnvelope<br>PharmacyDispatchAcknowledgement<br>PharmacyDispatchExpiry<br>ExternalConfirmationGate |
| `sim_nhs_login_auth_session_twin`<br>NHS login auth and session twin | `identity` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | SessionEstablishmentDecision<br>IdentityBinding<br>RouteIntentBinding<br>SessionContinuityFence |
| `sim_booking_provider_confirmation_twin`<br>Booking provider confirmation twin | `booking` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | ProviderCapabilitySnapshot<br>ExternalConfirmationGate<br>BookingConfirmationTruthProjection<br>RequestLifecycleLease |
| `sim_telephony_ivr_twin`<br>Telephony and IVR twin | `communications` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | CallSessionRecord<br>RecordingAvailabilityObservation<br>EvidenceReadinessAssessment<br>SMSContinuationGrant |
| `sim_pharmacy_visibility_update_record_twin`<br>Pharmacy visibility and Update Record twin | `pharmacy` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | PharmacyOutcomeRecord<br>PharmacyOutcomeMatchAssessment<br>PharmacyOutcomeReconciliationGate<br>UpdateRecordVisibilityObservation |
| `sim_mesh_message_path_twin`<br>MESH message path twin | `communications` | `phase_0_blocker_removal` | `baseline_required` | `hybrid_contract_twin` | no | MESHMessageEnvelope<br>TransportReceipt<br>ReplayFence<br>DeliveryObservation |
| `sim_booking_capacity_feed_twin`<br>Booking capacity feed twin | `booking` | `phase_1_provider_truth` | `baseline_required` | `hybrid_contract_twin` | no | CapacitySnapshot<br>ReservationWindowEvidence<br>NoSlotFallbackDecision<br>CallbackOfferEligibility |
| `sim_im1_principal_system_emis_twin`<br>IM1 principal-system EMIS twin | `booking` | `phase_1_provider_truth` | `baseline_required` | `hybrid_contract_twin` | no | ProviderCapabilitySnapshot<br>SlotSearchTruth<br>BookingCommitAttempt<br>BookingConfirmationTruthProjection |
| `sim_im1_principal_system_tpp_twin`<br>IM1 principal-system TPP twin | `booking` | `phase_1_provider_truth` | `baseline_required` | `hybrid_contract_twin` | no | ProviderCapabilitySnapshot<br>SlotSearchTruth<br>BookingCommitAttempt<br>BookingConfirmationTruthProjection |
| `sim_support_replay_resend_twin`<br>Support replay and resend twin | `communications` | `phase_2_channel_evidence` | `baseline_required` | `permanent_fallback` | yes | ReplayReviewDecision<br>ControlledResendAuthorisation<br>DeliveryRepairWindow<br>AuditReplayEnvelope |
| `sim_pharmacy_directory_choice_twin`<br>Pharmacy directory and choice twin | `pharmacy` | `phase_1_provider_truth` | `baseline_required` | `replace_with_live_guarded` | no | PharmacyDirectorySnapshot<br>PharmacyProviderCapabilitySnapshot<br>PharmacyChoiceProof<br>ChoiceTupleFreshness |
| `sim_email_notification_twin`<br>Email notification twin | `communications` | `phase_2_channel_evidence` | `baseline_required` | `hybrid_contract_twin` | no | DeliveryAttempt<br>DeliveryEvidence<br>TemplateVersionBinding<br>RepairDecision |
| `sim_transcription_processing_twin`<br>Transcription processing twin | `evidence` | `phase_2_channel_evidence` | `baseline_required` | `hybrid_contract_twin` | no | TranscriptReadinessDecision<br>DerivedFactsPackage<br>ManualReviewRequirement<br>SupersessionLedgerEntry |
| `sim_malware_artifact_scan_twin`<br>Malware and artifact scanning twin | `evidence` | `phase_2_channel_evidence` | `baseline_required` | `hybrid_contract_twin` | no | ScanVerdict<br>QuarantineDecision<br>ReleaseFromQuarantineDecision<br>ReacquireEvidenceRequest |
| `sim_sms_delivery_twin`<br>SMS delivery twin | `communications` | `phase_2_channel_evidence` | `optional_flagged` | `hybrid_contract_twin` | no | SMSContinuationGrant<br>DeliveryEvidence<br>LinkRedemptionFence<br>WrongRecipientRepairDecision |
| `sim_nhs_app_embedded_bridge_twin`<br>NHS App embedded bridge twin | `embedded` | `phase_3_deferred_optional` | `deferred_phase7` | `replace_with_live_guarded` | no | SiteLinkPublicationTuple<br>EmbeddedBridgeCapabilitySnapshot<br>AppReturnIntent<br>ReleaseGateEvidence |
| `sim_optional_pds_enrichment_twin`<br>Optional PDS enrichment twin | `patient_data` | `phase_3_deferred_optional` | `optional_flagged` | `permanent_fallback` | yes | PdsEnrichmentDecision<br>MatchConfidenceSnapshot<br>FeatureFlagDecision<br>WrongPatientRepairHold |


        ## Guardrails

        - no simulator row may return optimistic success when the blueprint requires ambiguity, expiry, manual review, or bounded fallback
        - route shape, proof objects, and replay fences stay in the manifest, not hidden in prose
        - rows marked `permanent_fallback` remain part of the target operating model and are not treated as temporary cleanup work
