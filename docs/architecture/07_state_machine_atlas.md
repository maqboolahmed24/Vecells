# 07 State Machine Atlas

This atlas freezes Vecells state ownership before implementation.

Summary:

- Machines: 41
- States: 287
- Transitions: 277
- Guards: 327
- Proof classes: 308
- Invariants: 21
- Conflicts: 82

## Machine Inventory

| Machine ID | Canonical Name | Family | Axis | States | Initial | Terminal | Coordinator Owned |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SM_SUBMISSION_ENVELOPE_STATE | SubmissionEnvelope.state | canonical_shared_control | lifecycle | 6 | draft | promoted<br>abandoned<br>expired | no |
| SM_REQUEST_WORKFLOW_STATE | Request.workflowState | canonical_shared_control | workflow | 7 | submitted | closed | yes |
| SM_REQUEST_SAFETY_STATE | Request.safetyState | canonical_shared_control | safety | 5 | not_screened | urgent_diverted | no |
| SM_REQUEST_IDENTITY_STATE | Request.identityState | canonical_shared_control | identity | 4 | anonymous | claimed | no |
| SM_EPISODE_STATE | Episode.state | canonical_shared_control | lifecycle | 3 | open | archived | yes |
| SM_TELEPHONY_EVIDENCE_READINESS | TelephonyEvidenceReadinessAssessment.usabilityState | canonical_shared_control | gate | 7 | awaiting_recording | safety_usable<br>unusable_terminal | no |
| SM_TELEPHONY_CONTINUATION_ELIGIBILITY | TelephonyContinuationEligibility.eligibilityState | canonical_shared_control | gate | 4 | not_eligible | eligible_seeded<br>eligible_challenge<br>manual_only | no |
| SM_IDENTITY_BINDING_STATE | IdentityBinding.bindingState | canonical_shared_control | identity | 7 | candidate | revoked | no |
| SM_SESSION_STATE | Session.sessionState | canonical_shared_control | identity | 9 | establishing | revoked<br>expired_idle<br>expired_absolute<br>terminated | no |
| SM_SESSION_ROUTE_AUTHORITY | Session.routeAuthorityState | canonical_shared_control | gate | 4 | none | writable | no |
| SM_ACCESS_GRANT_LIFECYCLE | AccessGrant.grantState | canonical_shared_control | lifecycle | 7 | live | redeemed<br>superseded<br>revoked<br>expired | no |
| SM_DUPLICATE_CLUSTER_STATUS | DuplicateCluster.reviewStatus | canonical_shared_control | case_local | 7 | open | resolved_confirmed<br>resolved_separate<br>resolved_related<br>resolved_retry<br>superseded | no |
| SM_FALLBACK_REVIEW_CASE | FallbackReviewCase.patientVisibleState | canonical_shared_control | case_local | 5 | draft_recoverable | closed | no |
| SM_REQUEST_LIFECYCLE_LEASE | RequestLifecycleLease.state | canonical_shared_control | lease | 5 | active | released | no |
| SM_REQUEST_CLOSURE_DECISION | RequestClosureRecord.decision | canonical_shared_control | gate | 2 | defer | close | yes |
| SM_CAPACITY_RESERVATION_STATE | CapacityReservation.state | canonical_shared_control | settlement | 8 | none | confirmed<br>released<br>expired | no |
| SM_EXTERNAL_CONFIRMATION_GATE | ExternalConfirmationGate.state | canonical_shared_control | gate | 5 | pending | confirmed<br>expired<br>cancelled | no |
| SM_ROUTE_INTENT_BINDING | RouteIntentBinding.bindingState | canonical_shared_control | gate | 4 | live | superseded | no |
| SM_COMMAND_SETTLEMENT | CommandSettlementRecord.authoritativeOutcomeState | canonical_shared_control | settlement | 11 | pending | settled<br>failed<br>expired<br>superseded | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING | AudienceSurfaceRuntimeBinding.bindingState | canonical_shared_control | publication | 4 | publishable_live | blocked | no |
| SM_TRIAGE_TASK_STATUS | TriageTask.status | triage_human_checkpoint | case_local | 11 | queued | closed | no |
| SM_DECISION_EPOCH | DecisionEpoch.epochState | triage_human_checkpoint | gate | 3 | live | superseded | no |
| SM_APPROVAL_CHECKPOINT | ApprovalCheckpoint.state | triage_human_checkpoint | gate | 6 | not_required | approved<br>rejected<br>superseded | no |
| SM_MORE_INFO_REPLY_WINDOW | MoreInfoReplyWindowCheckpoint.replyWindowState | triage_human_checkpoint | case_local | 6 | open | expired<br>superseded<br>settled | no |
| SM_CALLBACK_CASE_STATE | CallbackCase.state | callback_and_messaging | case_local | 17 | created | cancelled<br>expired<br>closed | no |
| SM_CLINICIAN_MESSAGE_THREAD | ClinicianMessageThread.state | callback_and_messaging | case_local | 10 | drafted | closed | no |
| SM_BOOKING_CASE_STATUS | BookingCase.status | booking | case_local | 16 | handoff_received | booking_failed<br>closed | no |
| SM_WAITLIST_FALLBACK_TRANSFER | WaitlistFallbackObligation.transferState | booking | gate | 6 | monitoring | satisfied<br>cancelled | no |
| SM_HUB_COORDINATION_CASE_STATUS | HubCoordinationCase.status | hub_coordination | case_local | 18 | hub_requested | closed | no |
| SM_HUB_CONFIRMATION_TRUTH | HubOfferToConfirmationTruthProjection.confirmationTruthState | hub_coordination | continuity | 9 | no_commit | confirmed<br>expired<br>superseded | no |
| SM_PHARMACY_CASE_STATUS | PharmacyCase.status | pharmacy | case_local | 16 | candidate_received | ineligible_returned<br>closed | no |
| SM_PHARMACY_CONSENT_CHECKPOINT | PharmacyConsentCheckpoint.checkpointState | pharmacy | gate | 7 | satisfied | withdrawn | no |
| SM_PHARMACY_DISPATCH_STATUS | PharmacyDispatchAttempt.status | pharmacy | settlement | 10 | created | superseded<br>failed<br>expired | no |
| SM_ADMIN_RESOLUTION_CASE | AdminResolutionCase.state | admin_resolution | case_local | 9 | queued | closed | no |
| SM_ASSISTIVE_TRUST_ENVELOPE | AssistiveCapabilityTrustEnvelope.trustState | assistive | trust | 5 | shadow_only |  | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT | AssistiveCapabilityRolloutVerdict.rolloutRung | assistive | publication | 6 | shadow_only | withdrawn | no |
| SM_DISPOSITION_ELIGIBILITY | DispositionEligibilityAssessment.eligibilityState | assurance_governance | gate | 3 | blocked | delete_allowed | no |
| SM_LEGAL_HOLD_STATE | LegalHoldRecord.holdState | assurance_governance | gate | 4 | pending_review | released<br>superseded | no |
| SM_RESILIENCE_SURFACE_BINDING | ResilienceSurfaceRuntimeBinding.bindingState | assurance_governance | publication | 4 | live | blocked | no |
| SM_RECOVERY_CONTROL_POSTURE | RecoveryControlPosture.postureState | assurance_governance | trust | 4 | live_control | blocked | no |
| SM_CROSS_PHASE_SCORECARD | CrossPhaseConformanceScorecard.scorecardState | assurance_governance | other | 3 | blocked | exact | no |
