# Transition And Guard Rules

## Global Guard Rules

- Every mutating path validates the current RouteIntentBinding, release tuple, continuity evidence, and governing object fence before changing durable truth.
- Child domains may emit milestones, blockers, and evidence, but only LifecycleCoordinator may derive canonical closure.
- No success state exists without the named authoritative proof object for that domain.
- External ambiguity, repair, and duplicate-review states remain explicit and never collapse into generic success or generic error.

## State Machines

### request_workflow_state

- Governing object: `Request.workflowState`
- States: submitted, intake_normalized, triage_ready, triage_active, handoff_active, outcome_recorded, closed
- Source refs: blueprint-init.md#3. The canonical request model, phase-3-the-human-checkpoint.md#Request milestone derivation, phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| submitted | intake_normalized | Governed promotion succeeded and canonical normalization settled. | SubmissionPromotionRecord |
| intake_normalized | triage_ready | Routine request creation finished and the lineage is ready for queue entry. | Request<br>RequestLineage |
| triage_ready | triage_active | Triage-side RequestLifecycleLease is acquired and the task first leaves triage_ready. | RequestLifecycleLease<br>TriageTask |
| triage_active | handoff_active | A downstream child case acknowledges the current LineageCaseLink and the handoff milestone is emitted. | LineageCaseLink |
| triage_active | outcome_recorded | A direct authoritative outcome is recorded from the current unsuperseded DecisionEpoch. | EndpointDecisionSettlement |
| handoff_active | outcome_recorded | A child aggregate emits an authoritative outcome milestone with the required proof object. | BookingConfirmationTruthProjection<br>HubOfferToConfirmationTruthProjection<br>PharmacyOutcomeRecord<br>CallbackResolutionGate<br>ThreadResolutionGate<br>AdminResolutionSettlement |
| outcome_recorded | closed | LifecycleCoordinator persists RequestClosureRecord(decision = close) after all blockers clear. | RequestClosureRecord |

### request_safety_state

- Governing object: `Request.safetyState`
- States: not_screened, screen_clear, residual_risk_flagged, urgent_diversion_required, urgent_diverted
- Source refs: blueprint-init.md#3. The canonical request model, phase-1-the-red-flag-gate.md#Canonical submit and safety algorithm, phase-0-the-foundation-protocol.md#Safety algorithm

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| not_screened | screen_clear | Canonical safety engine settles clear_routine. | SafetyDecisionRecord |
| not_screened | residual_risk_flagged | Canonical safety engine settles residual_review. | SafetyDecisionRecord |
| not_screened | urgent_diversion_required | Canonical safety engine settles urgent_required or urgent_live. | SafetyDecisionRecord |
| urgent_diversion_required | urgent_diverted | UrgentDiversionSettlement is issued for the current SafetyDecisionRecord. | UrgentDiversionSettlement |

### more_info_cycle_state

- Governing object: `MoreInfoCycle.state`
- States: draft, awaiting_delivery, awaiting_patient_reply, awaiting_late_review, response_received, review_resumed, expired, superseded, cancelled
- Source refs: phase-3-the-human-checkpoint.md#MoreInfoCycle, phase-3-the-human-checkpoint.md#Build MoreInfoCycle as a first-class workflow object

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| draft | awaiting_delivery | Exactly one current cycle, checkpoint, and reminder schedule are created from authoritative server time. | MoreInfoReplyWindowCheckpoint<br>MoreInfoReminderSchedule |
| awaiting_delivery | awaiting_patient_reply | Prompt is durably issued through the current delivery chain. | CommandSettlementRecord |
| awaiting_patient_reply | response_received | Current response is accepted_in_window or accepted_late_review. | MoreInfoResponseDisposition |
| awaiting_patient_reply | awaiting_late_review | Reply window passes into late_review without full expiry. | MoreInfoReplyWindowCheckpoint |
| awaiting_patient_reply | expired | Checkpoint state becomes expired or settled and policy forbids late acceptance. | MoreInfoReplyWindowCheckpoint |
| awaiting_patient_reply | superseded | A replacement cycle is explicitly issued and old reply grants are revoked. | MoreInfoReplyWindowCheckpoint<br>MoreInfoReminderSchedule |
| response_received | review_resumed | Evidence assimilation and any required re-safety are settled. | EvidenceAssimilationRecord<br>MaterialDeltaAssessment |

### callback_case_state

- Governing object: `CallbackCase`
- States: created, queued, scheduled, ready_for_attempt, attempt_in_progress, awaiting_outcome_evidence, answered, no_answer, voicemail_left, contact_route_repair_pending, awaiting_retry, escalation_review, completed, cancelled, expired, closed
- Source refs: callback-and-clinician-messaging-loop.md#Callback domain

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| queued | scheduled | Active CallbackIntentLease still matches request ownership and route tuple. | CallbackIntentLease |
| scheduled | ready_for_attempt | Service window is live and ownership fence still matches. | CallbackIntentLease |
| ready_for_attempt | attempt_in_progress | Current attempt fence creates or reuses one CallbackAttemptRecord. | CallbackAttemptRecord |
| attempt_in_progress | awaiting_outcome_evidence | Provider acknowledges or the call side effect is in flight but not yet evidence-settled. | AdapterReceiptCheckpoint |
| awaiting_outcome_evidence | answered | Answered outcome is evidence-bound. | CallbackOutcomeEvidenceBundle |
| awaiting_outcome_evidence | no_answer | No-answer outcome is evidence-bound. | CallbackOutcomeEvidenceBundle |
| awaiting_outcome_evidence | contact_route_repair_pending | Route evidence or delivery posture proves current contact repair is required. | CallbackOutcomeEvidenceBundle<br>ReachabilityAssessmentRecord |
| answered | completed | CallbackResolutionGate decides complete. | CallbackResolutionGate |
| no_answer | awaiting_retry | CallbackResolutionGate decides retry. | CallbackResolutionGate |

### clinician_message_thread_state

- Governing object: `ClinicianMessageThread`
- States: drafted, approved, sent, delivered, patient_replied, awaiting_clinician_review, delivery_failed, contact_route_repair_pending, closed, reopened
- Source refs: callback-and-clinician-messaging-loop.md#Clinician message domain

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| drafted | approved | Approval-required content has a current ApprovalCheckpoint or equivalent approval proof. | ApprovalCheckpoint |
| approved | sent | Current MessageDispatchEnvelope is created under the live request and review fences. | MessageDispatchEnvelope |
| sent | delivered | Delivery truth is evidence-bound. | MessageDeliveryEvidenceBundle |
| sent | delivery_failed | Delivery failure or dispute is evidence-bound. | MessageDeliveryEvidenceBundle |
| delivery_failed | contact_route_repair_pending | Active reachability dependency requires repair before live send can continue. | ReachabilityAssessmentRecord<br>ContactRouteRepairJourney |
| delivered | patient_replied | A current patient reply is accepted and correlated to the thread. | EvidenceAssimilationRecord |
| patient_replied | awaiting_clinician_review | Reply intake settled and the thread remains open for review. | ThreadResolutionGate |
| awaiting_clinician_review | closed | ThreadResolutionGate decides close and no callback escalation or repair remains. | ThreadResolutionGate |

### booking_case_state

- Governing object: `BookingCase.status`
- States: handoff_received, capability_checked, searching_local, offers_ready, selecting, revalidating, commit_pending, booked, confirmation_pending, supplier_reconciliation_pending, waitlisted, fallback_to_hub, callback_fallback, booking_failed, managed, closed
- Source refs: phase-4-the-booking-engine.md#Booking case model and state machine, phase-4-the-booking-engine.md#Waitlist continuation

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| handoff_received | capability_checked | Source DecisionEpoch and current proposed LineageCaseLink still match. | BookingCase<br>LineageCaseLink |
| searching_local | offers_ready | Current SlotSetSnapshot and capability tuple are live. | SlotSetSnapshot |
| offers_ready | commit_pending | The selected candidate and reservation truth survive revalidation under the active fences. | BookingTransaction<br>ReservationTruthProjection |
| commit_pending | booked | Authoritative provider proof or same-commit read-after-write exists. | BookingConfirmationTruthProjection<br>AppointmentRecord |
| commit_pending | confirmation_pending | Provider acceptance is async or incomplete. | ExternalConfirmationGate<br>BookingConfirmationTruthProjection |
| commit_pending | supplier_reconciliation_pending | Supplier truth is ambiguous or contradictory. | ExternalConfirmationGate<br>BookingConfirmationTruthProjection |
| offers_ready | waitlisted | Policy allows local waitlist continuation. | WaitlistEntry<br>WaitlistContinuationTruthProjection |
| waitlisted | fallback_to_hub | WaitlistFallbackObligation requires hub transfer. | WaitlistFallbackObligation<br>HubCoordinationCase |
| waitlisted | callback_fallback | WaitlistFallbackObligation requires callback transfer. | WaitlistFallbackObligation<br>CallbackCase |

### waitlist_continuation_state

- Governing object: `WaitlistContinuationTruthProjection.patientVisibleState`
- States: waiting_for_offer, offer_available, accepted_pending_booking, callback_expected, hub_review_pending, expired, closed
- Source refs: phase-4-the-booking-engine.md#Waitlist continuation

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| waiting_for_offer | offer_available | A current WaitlistOffer is issued under the same continuation fence. | WaitlistOffer<br>WaitlistContinuationTruthProjection |
| offer_available | accepted_pending_booking | Patient accepted the live offer and booking confirmation is still pending. | WaitlistOffer<br>ReservationTruthProjection |
| waiting_for_offer | callback_expected | WaitlistFallbackObligation requires callback transfer. | WaitlistFallbackObligation<br>CallbackExpectationEnvelope |
| waiting_for_offer | hub_review_pending | WaitlistFallbackObligation requires hub transfer. | WaitlistFallbackObligation<br>HubCoordinationCase |
| offer_available | expired | Offer or waitlist deadline expires or is superseded. | WaitlistDeadlineEvaluation<br>WaitlistOffer |

### hub_coordination_case_state

- Governing object: `HubCoordinationCase.status`
- States: created, alternatives_offered, patient_choice_pending, candidate_revalidating, native_booking_pending, confirmation_pending, booked_pending_practice_ack, booked, callback_transfer_pending, escalated_back, closed
- Source refs: phase-5-the-network-horizon.md#Network coordination contract, case model, and state machine, phase-5-the-network-horizon.md#Alternative offers and patient choice, phase-5-the-network-horizon.md#Hub commit algorithm

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| created | alternatives_offered | A real AlternativeOfferSession and HubOfferToConfirmationTruthProjection are created. | AlternativeOfferSession<br>HubOfferToConfirmationTruthProjection |
| alternatives_offered | patient_choice_pending | Offer is actually delivered or the phone read-back session begins. | AlternativeOfferSession<br>CommandSettlementRecord |
| patient_choice_pending | candidate_revalidating | Patient selects a current candidate under the live truthTupleHash and offer fence. | HubOfferToConfirmationTruthProjection |
| candidate_revalidating | native_booking_pending | Current candidate survives revalidation against supply, snapshot expiry, and policy. | HubCommitAttempt |
| native_booking_pending | confirmation_pending | Authoritative confirmation is still async or below threshold. | ExternalConfirmationGate<br>HubOfferToConfirmationTruthProjection |
| native_booking_pending | booked_pending_practice_ack | Hub confirmation exists but current-generation practice acknowledgement is still pending. | HubOfferToConfirmationTruthProjection<br>PracticeAcknowledgementRecord |
| booked_pending_practice_ack | booked | Current ackGeneration is satisfied for the live truth tuple. | PracticeAcknowledgementRecord<br>HubOfferToConfirmationTruthProjection |
| patient_choice_pending | callback_transfer_pending | Fallback card or callback request is selected and callback linkage is still pending. | HubFallbackRecord<br>CallbackExpectationEnvelope |
| patient_choice_pending | escalated_back | Offers expire, become unsafe, or callback / return-to-practice is the only safe path. | AlternativeOfferRegenerationSettlement<br>HubFallbackRecord |

### pharmacy_case_state

- Governing object: `PharmacyCase.status`
- States: candidate_received, rules_evaluating, ineligible_returned, eligible_choice_pending, provider_selected, consent_pending, package_ready, dispatch_pending, consultation_outcome_pending, resolved_by_pharmacy, unresolved_returned, urgent_bounce_back, no_contact_return_pending, outcome_reconciliation_pending, closed
- Source refs: phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine

| From | To | Guard Rule | Proof Objects |
| --- | --- | --- | --- |
| candidate_received | rules_evaluating | PharmacyCase exists on the current lineage link and rule pack evaluation starts. | PharmacyCase |
| rules_evaluating | eligible_choice_pending | Current rule pack and evidence allow pharmacy choice. | PathwayEligibilityEvaluation<br>PharmacyChoiceSession |
| rules_evaluating | ineligible_returned | Eligibility or exclusion rules reject the pathway and route the case back to practice. | PathwayEligibilityEvaluation |
| eligible_choice_pending | provider_selected | A provider is durably selected from the current choice session. | PharmacyChoiceSession<br>PharmacyChoiceProof |
| provider_selected | consent_pending | Consent does not yet satisfy the current provider, pathway, scope, and package tuple. | PharmacyConsentCheckpoint |
| consent_pending | package_ready | Current consent checkpoint is satisfied and the package is frozen for dispatch. | PharmacyConsentCheckpoint<br>PharmacyReferralPackage |
| package_ready | dispatch_pending | A fenced PharmacyDispatchAttempt starts under the current transport plan. | PharmacyDispatchAttempt |
| dispatch_pending | consultation_outcome_pending | Dispatch proof reaches the threshold required by the active transport assurance profile. | PharmacyDispatchAttempt<br>ExternalConfirmationGate |
| consultation_outcome_pending | resolved_by_pharmacy | Authoritative pharmacy outcome is accepted. | PharmacyOutcomeRecord |
| consultation_outcome_pending | unresolved_returned | Routine return requires governed reopen. | PharmacyBounceBackRecord |
| consultation_outcome_pending | urgent_bounce_back | Urgent return requires elevated reopen. | PharmacyBounceBackRecord |
| consultation_outcome_pending | no_contact_return_pending | No-contact outcome is explicit and cannot auto-close. | PharmacyBounceBackRecord |
| consultation_outcome_pending | outcome_reconciliation_pending | Outcome evidence is weak, ambiguous, or contradictory. | PharmacyOutcomeRecord |
