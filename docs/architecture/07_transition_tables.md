# 07 Transition Tables

| Transition ID | Machine | From | To | Trigger | Coordinator Owned |
| --- | --- | --- | --- | --- | --- |
| SM_SUBMISSION_ENVELOPE_STATE__DRAFT__EVIDENCE_PENDING | SubmissionEnvelope.state | draft | evidence_pending | Capture bundle or attachments persist on the pre-submit lineage. | no |
| SM_SUBMISSION_ENVELOPE_STATE__EVIDENCE_PENDING__READY_TO_PROMOTE | SubmissionEnvelope.state | evidence_pending | ready_to_promote | Readiness checks complete for promotion-safe submission. | no |
| SM_SUBMISSION_ENVELOPE_STATE__READY_TO_PROMOTE__PROMOTED | SubmissionEnvelope.state | ready_to_promote | promoted | Governed submit promotes the envelope into one Request. | no |
| SM_SUBMISSION_ENVELOPE_STATE__DRAFT__ABANDONED | SubmissionEnvelope.state | draft | abandoned | User or support abandons pre-submit capture. | no |
| SM_SUBMISSION_ENVELOPE_STATE__EVIDENCE_PENDING__EXPIRED | SubmissionEnvelope.state | evidence_pending | expired | Continuation or draft TTL expires before promotion. | no |
| SM_REQUEST_WORKFLOW_STATE__SUBMITTED__INTAKE_NORMALIZED | Request.workflowState | submitted | intake_normalized | Promotion survives normalization and canonical ingest settlement. | yes |
| SM_REQUEST_WORKFLOW_STATE__INTAKE_NORMALIZED__TRIAGE_READY | Request.workflowState | intake_normalized | triage_ready | Safety and identity axes settle enough for review queue admission. | yes |
| SM_REQUEST_WORKFLOW_STATE__TRIAGE_READY__TRIAGE_ACTIVE | Request.workflowState | triage_ready | triage_active | Active review or more-info/approval work is acknowledged on the lineage. | yes |
| SM_REQUEST_WORKFLOW_STATE__TRIAGE_ACTIVE__HANDOFF_ACTIVE | Request.workflowState | triage_active | handoff_active | A downstream child case is durably acknowledged on the same RequestLineage. | yes |
| SM_REQUEST_WORKFLOW_STATE__TRIAGE_ACTIVE__OUTCOME_RECORDED | Request.workflowState | triage_active | outcome_recorded | Direct advice, direct completion, or direct endpoint outcome settles. | yes |
| SM_REQUEST_WORKFLOW_STATE__HANDOFF_ACTIVE__OUTCOME_RECORDED | Request.workflowState | handoff_active | outcome_recorded | Child-domain outcome milestone settles after local truth is reconciled. | yes |
| SM_REQUEST_WORKFLOW_STATE__OUTCOME_RECORDED__CLOSED | Request.workflowState | outcome_recorded | closed | LifecycleCoordinator evaluates a zero-blocker closure on the current lineage epoch. | yes |
| SM_REQUEST_SAFETY_STATE__NOT_SCREENED__SCREEN_CLEAR | Request.safetyState | not_screened | screen_clear | Initial or resumed safety run clears urgent and residual risk. | no |
| SM_REQUEST_SAFETY_STATE__NOT_SCREENED__RESIDUAL_RISK_FLAGGED | Request.safetyState | not_screened | residual_risk_flagged | Safety run detects residual but not urgent risk. | no |
| SM_REQUEST_SAFETY_STATE__NOT_SCREENED__URGENT_DIVERSION_REQUIRED | Request.safetyState | not_screened | urgent_diversion_required | Initial safety run requires urgent diversion. | no |
| SM_REQUEST_SAFETY_STATE__RESIDUAL_RISK_FLAGGED__URGENT_DIVERSION_REQUIRED | Request.safetyState | residual_risk_flagged | urgent_diversion_required | Materially new evidence escalates the case into urgent handling. | no |
| SM_REQUEST_SAFETY_STATE__SCREEN_CLEAR__RESIDUAL_RISK_FLAGGED | Request.safetyState | screen_clear | residual_risk_flagged | Material evidence arrives and re-safety no longer clears completely. | no |
| SM_REQUEST_SAFETY_STATE__SCREEN_CLEAR__URGENT_DIVERSION_REQUIRED | Request.safetyState | screen_clear | urgent_diversion_required | Later evidence or callback outcome proves urgent routing is now required. | no |
| SM_REQUEST_SAFETY_STATE__URGENT_DIVERSION_REQUIRED__URGENT_DIVERTED | Request.safetyState | urgent_diversion_required | urgent_diverted | Urgent advice, escalation, or contact issuance is durably settled. | no |
| SM_REQUEST_IDENTITY_STATE__ANONYMOUS__PARTIAL_MATCH | Request.identityState | anonymous | partial_match | IdentityBinding finds candidate matches but not yet durable patient binding. | no |
| SM_REQUEST_IDENTITY_STATE__PARTIAL_MATCH__MATCHED | Request.identityState | partial_match | matched | IdentityBinding verifies a patient but claim or writable authority is not yet complete. | no |
| SM_REQUEST_IDENTITY_STATE__MATCHED__CLAIMED | Request.identityState | matched | claimed | Claim or continuation redemption settles writable patient identity on the current lineage. | no |
| SM_EPISODE_STATE__OPEN__RESOLVED | Episode.state | open | resolved | All related requests and branches satisfy closure policy. | yes |
| SM_EPISODE_STATE__RESOLVED__ARCHIVED | Episode.state | resolved | archived | Retention and lifecycle policy archives the already resolved episode. | yes |
| SM_TELEPHONY_EVIDENCE_READINESS__AWAITING_RECORDING__AWAITING_TRANSCRIPT | TelephonyEvidenceReadinessAssessment.usabilityState | awaiting_recording | awaiting_transcript | Recording lands but transcript is still required. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__AWAITING_TRANSCRIPT__AWAITING_STRUCTURED_CAPTURE | TelephonyEvidenceReadinessAssessment.usabilityState | awaiting_transcript | awaiting_structured_capture | Transcript lands but required keypad or structured capture is incomplete. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__AWAITING_RECORDING__URGENT_LIVE_ONLY | TelephonyEvidenceReadinessAssessment.usabilityState | awaiting_recording | urgent_live_only | Urgent live branch is the only safe path before routine evidence is promotable. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__AWAITING_STRUCTURED_CAPTURE__SAFETY_USABLE | TelephonyEvidenceReadinessAssessment.usabilityState | awaiting_structured_capture | safety_usable | Recording, transcript, and structured capture together clear routine safety use. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__URGENT_LIVE_ONLY__MANUAL_REVIEW_ONLY | TelephonyEvidenceReadinessAssessment.usabilityState | urgent_live_only | manual_review_only | Urgent live path ends without enough routine evidence for ordinary promotion. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__MANUAL_REVIEW_ONLY__SAFETY_USABLE | TelephonyEvidenceReadinessAssessment.usabilityState | manual_review_only | safety_usable | Manual review or transcription settles promotable evidence. | no |
| SM_TELEPHONY_EVIDENCE_READINESS__MANUAL_REVIEW_ONLY__UNUSABLE_TERMINAL | TelephonyEvidenceReadinessAssessment.usabilityState | manual_review_only | unusable_terminal | Manual review concludes the capture cannot safely become routine intake. | no |
| SM_TELEPHONY_CONTINUATION_ELIGIBILITY__NOT_ELIGIBLE__ELIGIBLE_SEEDED | TelephonyContinuationEligibility.eligibilityState | not_eligible | eligible_seeded | Readiness and identity confidence allow seeded continuation. | no |
| SM_TELEPHONY_CONTINUATION_ELIGIBILITY__NOT_ELIGIBLE__ELIGIBLE_CHALLENGE | TelephonyContinuationEligibility.eligibilityState | not_eligible | eligible_challenge | Continuation is allowed only after a challenge rather than seeded verification. | no |
| SM_TELEPHONY_CONTINUATION_ELIGIBILITY__NOT_ELIGIBLE__MANUAL_ONLY | TelephonyContinuationEligibility.eligibilityState | not_eligible | manual_only | Continuation cannot be safely granted on the current evidence. | no |
| SM_IDENTITY_BINDING_STATE__CANDIDATE__PROVISIONAL_VERIFIED | IdentityBinding.bindingState | candidate | provisional_verified | Evidence is strong enough for controlled progress but not yet durable external consequence. | no |
| SM_IDENTITY_BINDING_STATE__CANDIDATE__AMBIGUOUS | IdentityBinding.bindingState | candidate | ambiguous | Competing identity candidates remain unresolved. | no |
| SM_IDENTITY_BINDING_STATE__PROVISIONAL_VERIFIED__VERIFIED_PATIENT | IdentityBinding.bindingState | provisional_verified | verified_patient | Binding is durably verified to one patient. | no |
| SM_IDENTITY_BINDING_STATE__VERIFIED_PATIENT__CORRECTION_PENDING | IdentityBinding.bindingState | verified_patient | correction_pending | Wrong-patient correction or identity challenge freezes the active binding. | no |
| SM_IDENTITY_BINDING_STATE__CORRECTION_PENDING__CORRECTED | IdentityBinding.bindingState | correction_pending | corrected | IdentityBindingAuthority settles corrected binding under release settlement. | no |
| SM_IDENTITY_BINDING_STATE__CORRECTED__REVOKED | IdentityBinding.bindingState | corrected | revoked | The corrected binding is later superseded or revoked. | no |
| SM_SESSION_STATE__ESTABLISHING__ACTIVE | Session.sessionState | establishing | active | Session establishment settles on the current grant, binding, and tuple. | no |
| SM_SESSION_STATE__ACTIVE__STEP_UP_REQUIRED | Session.sessionState | active | step_up_required | Policy, risk, or scope change requires additional assurance before continuing. | no |
| SM_SESSION_STATE__STEP_UP_REQUIRED__ACTIVE | Session.sessionState | step_up_required | active | Step-up succeeds under the current session epoch and binding version. | no |
| SM_SESSION_STATE__ACTIVE__RESTRICTED | Session.sessionState | active | restricted | Policy or release posture narrows the session to restricted interaction. | no |
| SM_SESSION_STATE__RESTRICTED__RECOVERY_ONLY | Session.sessionState | restricted | recovery_only | Session continuity drifts beyond read-only restrictions and requires recovery. | no |
| SM_SESSION_STATE__ACTIVE__REVOKED | Session.sessionState | active | revoked | Logout, repair, or supersession revokes the session. | no |
| SM_SESSION_STATE__ACTIVE__EXPIRED_IDLE | Session.sessionState | active | expired_idle | Idle timeout elapses. | no |
| SM_SESSION_STATE__ACTIVE__EXPIRED_ABSOLUTE | Session.sessionState | active | expired_absolute | Absolute session lifetime elapses. | no |
| SM_SESSION_STATE__ACTIVE__TERMINATED | Session.sessionState | active | terminated | The session ends for an explicit terminal reason. | no |
| SM_SESSION_ROUTE_AUTHORITY__NONE__AUTH_READ_ONLY | Session.routeAuthorityState | none | auth_read_only | Auth succeeds but writable claim has not been settled. | no |
| SM_SESSION_ROUTE_AUTHORITY__AUTH_READ_ONLY__CLAIM_PENDING | Session.routeAuthorityState | auth_read_only | claim_pending | Claim path or secure continuation is underway. | no |
| SM_SESSION_ROUTE_AUTHORITY__CLAIM_PENDING__WRITABLE | Session.routeAuthorityState | claim_pending | writable | Current capability, route intent, and publication tuple all permit mutation. | no |
| SM_ACCESS_GRANT_LIFECYCLE__LIVE__REDEEMING | AccessGrant.grantState | live | redeeming | A one-time or rotating grant is presented and redemption begins. | no |
| SM_ACCESS_GRANT_LIFECYCLE__REDEEMING__REDEEMED | AccessGrant.grantState | redeeming | redeemed | Redemption settles exactly once and downstream session or continuation creation succeeds. | no |
| SM_ACCESS_GRANT_LIFECYCLE__LIVE__ROTATED | AccessGrant.grantState | live | rotated | Grant rotation or reissue begins under the same governed family. | no |
| SM_ACCESS_GRANT_LIFECYCLE__ROTATED__SUPERSEDED | AccessGrant.grantState | rotated | superseded | Replacement grant is current and the prior grant is now historical only. | no |
| SM_ACCESS_GRANT_LIFECYCLE__LIVE__REVOKED | AccessGrant.grantState | live | revoked | Grant is explicitly revoked for repair, logout, policy, or abuse reasons. | no |
| SM_ACCESS_GRANT_LIFECYCLE__LIVE__EXPIRED | AccessGrant.grantState | live | expired | Grant expires before legal redemption. | no |
| SM_DUPLICATE_CLUSTER_STATUS__OPEN__IN_REVIEW | DuplicateCluster.reviewStatus | open | in_review | Review-required duplicate ambiguity is assigned explicit triage review work. | no |
| SM_DUPLICATE_CLUSTER_STATUS__IN_REVIEW__RESOLVED_CONFIRMED | DuplicateCluster.reviewStatus | in_review | resolved_confirmed | Review confirms same-episode or attach behavior under explicit continuity witness. | no |
| SM_DUPLICATE_CLUSTER_STATUS__IN_REVIEW__RESOLVED_SEPARATE | DuplicateCluster.reviewStatus | in_review | resolved_separate | Review confirms the incoming item must remain a separate request. | no |
| SM_DUPLICATE_CLUSTER_STATUS__IN_REVIEW__RESOLVED_RELATED | DuplicateCluster.reviewStatus | in_review | resolved_related | Review confirms related-episode linkage without same-request attachment. | no |
| SM_DUPLICATE_CLUSTER_STATUS__IN_REVIEW__RESOLVED_RETRY | DuplicateCluster.reviewStatus | in_review | resolved_retry | Review confirms exact retry collapse. | no |
| SM_DUPLICATE_CLUSTER_STATUS__OPEN__SUPERSEDED | DuplicateCluster.reviewStatus | open | superseded | A newer cluster or resolution supersedes the current review container. | no |
| SM_FALLBACK_REVIEW_CASE__DRAFT_RECOVERABLE__SUBMITTED_DEGRADED | FallbackReviewCase.patientVisibleState | draft_recoverable | submitted_degraded | Accepted user progress cannot complete automatically and degrades into governed review. | no |
| SM_FALLBACK_REVIEW_CASE__SUBMITTED_DEGRADED__UNDER_MANUAL_REVIEW | FallbackReviewCase.patientVisibleState | submitted_degraded | under_manual_review | Manual owner picks up degraded accepted progress. | no |
| SM_FALLBACK_REVIEW_CASE__UNDER_MANUAL_REVIEW__RECOVERED | FallbackReviewCase.patientVisibleState | under_manual_review | recovered | Manual review repairs the degraded path without losing lineage. | no |
| SM_FALLBACK_REVIEW_CASE__RECOVERED__CLOSED | FallbackReviewCase.patientVisibleState | recovered | closed | Recovered case is acknowledged and no longer blocks closure. | no |
| SM_REQUEST_LIFECYCLE_LEASE__ACTIVE__RELEASING | RequestLifecycleLease.state | active | releasing | Current owner intentionally releases the lease. | no |
| SM_REQUEST_LIFECYCLE_LEASE__RELEASING__RELEASED | RequestLifecycleLease.state | releasing | released | Release is durably committed or replaced by a newer lease. | no |
| SM_REQUEST_LIFECYCLE_LEASE__ACTIVE__EXPIRED | RequestLifecycleLease.state | active | expired | Heartbeat misses the TTL. | no |
| SM_REQUEST_LIFECYCLE_LEASE__ACTIVE__BROKEN | RequestLifecycleLease.state | active | broken | A stale write or supervised takeover breaks the lease. | no |
| SM_REQUEST_CLOSURE_DECISION__DEFER__CLOSE | RequestClosureRecord.decision | defer | close | A later coordinator evaluation finds the blocker set empty on the required lineage epoch. | yes |
| SM_CAPACITY_RESERVATION_STATE__NONE__SOFT_SELECTED | CapacityReservation.state | none | soft_selected | A candidate is selected but no real exclusivity exists yet. | no |
| SM_CAPACITY_RESERVATION_STATE__SOFT_SELECTED__HELD | CapacityReservation.state | soft_selected | held | A true exclusive hold is acquired. | no |
| SM_CAPACITY_RESERVATION_STATE__SOFT_SELECTED__PENDING_CONFIRMATION | CapacityReservation.state | soft_selected | pending_confirmation | The system is confirming a nonexclusive or weakly-held selection. | no |
| SM_CAPACITY_RESERVATION_STATE__HELD__PENDING_CONFIRMATION | CapacityReservation.state | held | pending_confirmation | Commit begins and waits for authoritative booking confirmation. | no |
| SM_CAPACITY_RESERVATION_STATE__PENDING_CONFIRMATION__CONFIRMED | CapacityReservation.state | pending_confirmation | confirmed | Authoritative confirmation lands for the same reservation lineage. | no |
| SM_CAPACITY_RESERVATION_STATE__HELD__RELEASED | CapacityReservation.state | held | released | The hold is intentionally released. | no |
| SM_CAPACITY_RESERVATION_STATE__HELD__EXPIRED | CapacityReservation.state | held | expired | A real hold TTL expires. | no |
| SM_CAPACITY_RESERVATION_STATE__PENDING_CONFIRMATION__DISPUTED | CapacityReservation.state | pending_confirmation | disputed | Confirmation evidence becomes contradictory or stale on the same reservation version. | no |
| SM_EXTERNAL_CONFIRMATION_GATE__PENDING__CONFIRMED | ExternalConfirmationGate.state | pending | confirmed | Required hard matches pass and corroboration reaches the confirmation threshold. | no |
| SM_EXTERNAL_CONFIRMATION_GATE__PENDING__EXPIRED | ExternalConfirmationGate.state | pending | expired | The confirmation deadline passes without sufficient corroboration. | no |
| SM_EXTERNAL_CONFIRMATION_GATE__PENDING__DISPUTED | ExternalConfirmationGate.state | pending | disputed | Contradictory evidence or competing gates prevent safe confirmation. | no |
| SM_EXTERNAL_CONFIRMATION_GATE__PENDING__CANCELLED | ExternalConfirmationGate.state | pending | cancelled | The owning branch is cancelled or superseded before confirmation completes. | no |
| SM_ROUTE_INTENT_BINDING__LIVE__STALE | RouteIntentBinding.bindingState | live | stale | Session, subject binding, manifest, or release tuple drifts from the bound target tuple. | no |
| SM_ROUTE_INTENT_BINDING__STALE__RECOVERY_ONLY | RouteIntentBinding.bindingState | stale | recovery_only | A stale route can no longer safely remain writable or read-only under the old tuple. | no |
| SM_ROUTE_INTENT_BINDING__LIVE__SUPERSEDED | RouteIntentBinding.bindingState | live | superseded | A new route intent replaces the prior tuple. | no |
| SM_COMMAND_SETTLEMENT__PENDING__PROJECTION_PENDING | CommandSettlementRecord.authoritativeOutcomeState | pending | projection_pending | Command applied but downstream projection visibility has not yet caught up. | no |
| SM_COMMAND_SETTLEMENT__PENDING__AWAITING_EXTERNAL | CommandSettlementRecord.authoritativeOutcomeState | pending | awaiting_external | External evidence or acceptance is required before settlement can calm down. | no |
| SM_COMMAND_SETTLEMENT__PENDING__REVIEW_REQUIRED | CommandSettlementRecord.authoritativeOutcomeState | pending | review_required | Authoritative review is required before safe completion. | no |
| SM_COMMAND_SETTLEMENT__PENDING__STALE_RECOVERABLE | CommandSettlementRecord.authoritativeOutcomeState | pending | stale_recoverable | The bound tuple or context has drifted but same-shell recovery is still legal. | no |
| SM_COMMAND_SETTLEMENT__AWAITING_EXTERNAL__RECONCILIATION_REQUIRED | CommandSettlementRecord.authoritativeOutcomeState | awaiting_external | reconciliation_required | External evidence is contradictory or insufficient for calm final truth. | no |
| SM_COMMAND_SETTLEMENT__PROJECTION_PENDING__SETTLED | CommandSettlementRecord.authoritativeOutcomeState | projection_pending | settled | Projection visibility and authoritative proof converge on the same action chain. | no |
| SM_COMMAND_SETTLEMENT__AWAITING_EXTERNAL__SETTLED | CommandSettlementRecord.authoritativeOutcomeState | awaiting_external | settled | External proof settles the same action chain authoritatively. | no |
| SM_COMMAND_SETTLEMENT__REVIEW_REQUIRED__RECOVERY_REQUIRED | CommandSettlementRecord.authoritativeOutcomeState | review_required | recovery_required | Review outcome proves the route can only continue through bounded recovery. | no |
| SM_COMMAND_SETTLEMENT__RECONCILIATION_REQUIRED__SETTLED | CommandSettlementRecord.authoritativeOutcomeState | reconciliation_required | settled | Reconciliation resolves the same action chain under the current tuple. | no |
| SM_COMMAND_SETTLEMENT__PENDING__FAILED | CommandSettlementRecord.authoritativeOutcomeState | pending | failed | Authoritative failure settles on the same action chain. | no |
| SM_COMMAND_SETTLEMENT__PENDING__EXPIRED | CommandSettlementRecord.authoritativeOutcomeState | pending | expired | The command-following freshness deadline expires without safe settlement. | no |
| SM_COMMAND_SETTLEMENT__SETTLED__SUPERSEDED | CommandSettlementRecord.authoritativeOutcomeState | settled | superseded | A later settlement revision or superseding action replaces the prior calm state. | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING__PUBLISHABLE_LIVE__READ_ONLY | AudienceSurfaceRuntimeBinding.bindingState | publishable_live | read_only | The current route remains visible but no longer safely writable. | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING__PUBLISHABLE_LIVE__RECOVERY_ONLY | AudienceSurfaceRuntimeBinding.bindingState | publishable_live | recovery_only | Publication, parity, or continuity drift requires same-shell recovery. | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING__PUBLISHABLE_LIVE__BLOCKED | AudienceSurfaceRuntimeBinding.bindingState | publishable_live | blocked | Trust, publication, or freeze posture blocks even read-only safe operation. | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING__READ_ONLY__PUBLISHABLE_LIVE | AudienceSurfaceRuntimeBinding.bindingState | read_only | publishable_live | Exact publication parity and trust posture are restored. | no |
| SM_AUDIENCE_SURFACE_RUNTIME_BINDING__RECOVERY_ONLY__PUBLISHABLE_LIVE | AudienceSurfaceRuntimeBinding.bindingState | recovery_only | publishable_live | Recovery path revalidates the route tuple and publication parity. | no |
| SM_TRIAGE_TASK_STATUS__QUEUED__CLAIMED | TriageTask.status | queued | claimed | Reviewer acquires the current triage lease. | no |
| SM_TRIAGE_TASK_STATUS__CLAIMED__IN_REVIEW | TriageTask.status | claimed | in_review | The reviewer starts active review on the current review version. | no |
| SM_TRIAGE_TASK_STATUS__IN_REVIEW__AWAITING_PATIENT_INFO | TriageTask.status | in_review | awaiting_patient_info | Structured more-info request is issued. | no |
| SM_TRIAGE_TASK_STATUS__AWAITING_PATIENT_INFO__REVIEW_RESUMED | TriageTask.status | awaiting_patient_info | review_resumed | An accepted reply is assimilated and re-safety clears the case back to triage review. | no |
| SM_TRIAGE_TASK_STATUS__REVIEW_RESUMED__QUEUED | TriageTask.status | review_resumed | queued | Queue engine re-admits the resumed task under deterministic ranking. | no |
| SM_TRIAGE_TASK_STATUS__IN_REVIEW__ENDPOINT_SELECTED | TriageTask.status | in_review | endpoint_selected | Endpoint decision is chosen on the current live DecisionEpoch. | no |
| SM_TRIAGE_TASK_STATUS__ENDPOINT_SELECTED__RESOLVED_WITHOUT_APPOINTMENT | TriageTask.status | endpoint_selected | resolved_without_appointment | Direct outcome path settles on the same DecisionEpoch. | no |
| SM_TRIAGE_TASK_STATUS__ENDPOINT_SELECTED__HANDOFF_PENDING | TriageTask.status | endpoint_selected | handoff_pending | Booking or pharmacy handoff seed is durably created from the current DecisionEpoch. | no |
| SM_TRIAGE_TASK_STATUS__ENDPOINT_SELECTED__ESCALATED | TriageTask.status | endpoint_selected | escalated | Urgent escalation path opens for high-risk review. | no |
| SM_TRIAGE_TASK_STATUS__ESCALATED__RESOLVED_WITHOUT_APPOINTMENT | TriageTask.status | escalated | resolved_without_appointment | Urgent path settles a direct outcome. | no |
| SM_TRIAGE_TASK_STATUS__ESCALATED__HANDOFF_PENDING | TriageTask.status | escalated | handoff_pending | Urgent path requires downstream ownership. | no |
| SM_TRIAGE_TASK_STATUS__ESCALATED__REOPENED | TriageTask.status | escalated | reopened | Urgent path returns the case for further practice review. | no |
| SM_TRIAGE_TASK_STATUS__RESOLVED_WITHOUT_APPOINTMENT__CLOSED | TriageTask.status | resolved_without_appointment | closed | All direct-resolution artifacts are durably queued or created. | no |
| SM_TRIAGE_TASK_STATUS__HANDOFF_PENDING__CLOSED | TriageTask.status | handoff_pending | closed | Downstream ownership acknowledges the handoff and the triage branch has no further open work. | no |
| SM_TRIAGE_TASK_STATUS__REOPENED__QUEUED | TriageTask.status | reopened | queued | Reopened work re-enters the deterministic queue with raised urgency carry. | no |
| SM_DECISION_EPOCH__LIVE__BLOCKED | DecisionEpoch.epochState | live | blocked | The epoch remains current but actionability is temporarily blocked by approval or trust posture. | no |
| SM_DECISION_EPOCH__LIVE__SUPERSEDED | DecisionEpoch.epochState | live | superseded | Evidence, safety, duplicate, policy, trust, publication, or ownership drift requires a replacement epoch. | no |
| SM_APPROVAL_CHECKPOINT__NOT_REQUIRED__REQUIRED | ApprovalCheckpoint.state | not_required | required | The current consequence requires explicit human approval. | no |
| SM_APPROVAL_CHECKPOINT__REQUIRED__PENDING | ApprovalCheckpoint.state | required | pending | Approval request is formally issued for the current DecisionEpoch. | no |
| SM_APPROVAL_CHECKPOINT__PENDING__APPROVED | ApprovalCheckpoint.state | pending | approved | Approver settles the current checkpoint positively. | no |
| SM_APPROVAL_CHECKPOINT__PENDING__REJECTED | ApprovalCheckpoint.state | pending | rejected | Approver rejects the current consequence path. | no |
| SM_APPROVAL_CHECKPOINT__PENDING__SUPERSEDED | ApprovalCheckpoint.state | pending | superseded | Any material change invalidates the prior approval basis. | no |
| SM_MORE_INFO_REPLY_WINDOW__OPEN__REMINDER_DUE | MoreInfoReplyWindowCheckpoint.replyWindowState | open | reminder_due | The due-state crosses into reminder cadence under the same checkpoint revision. | no |
| SM_MORE_INFO_REPLY_WINDOW__REMINDER_DUE__LATE_REVIEW | MoreInfoReplyWindowCheckpoint.replyWindowState | reminder_due | late_review | The formal reply window closes but late-review grace remains open. | no |
| SM_MORE_INFO_REPLY_WINDOW__OPEN__SETTLED | MoreInfoReplyWindowCheckpoint.replyWindowState | open | settled | Accepted in-window reply is assimilated and the cycle settles. | no |
| SM_MORE_INFO_REPLY_WINDOW__LATE_REVIEW__SETTLED | MoreInfoReplyWindowCheckpoint.replyWindowState | late_review | settled | Accepted late review is explicitly assimilated and settled. | no |
| SM_MORE_INFO_REPLY_WINDOW__LATE_REVIEW__EXPIRED | MoreInfoReplyWindowCheckpoint.replyWindowState | late_review | expired | Late-review grace elapses without accepted reply assimilation. | no |
| SM_MORE_INFO_REPLY_WINDOW__OPEN__SUPERSEDED | MoreInfoReplyWindowCheckpoint.replyWindowState | open | superseded | A replacement cycle explicitly supersedes the prior one. | no |
| SM_MORE_INFO_REPLY_WINDOW__REMINDER_DUE__SUPERSEDED | MoreInfoReplyWindowCheckpoint.replyWindowState | reminder_due | superseded | The outstanding loop is replaced by a newer cycle before the patient responds. | no |
| SM_CALLBACK_CASE_STATE__CREATED__QUEUED | CallbackCase.state | created | queued | Callback case enters the governed callback queue. | no |
| SM_CALLBACK_CASE_STATE__QUEUED__SCHEDULED | CallbackCase.state | queued | scheduled | CallbackIntentLease schedules the callback promise window. | no |
| SM_CALLBACK_CASE_STATE__SCHEDULED__READY_FOR_ATTEMPT | CallbackCase.state | scheduled | ready_for_attempt | The current callback window opens and the case is armed for attempt. | no |
| SM_CALLBACK_CASE_STATE__READY_FOR_ATTEMPT__ATTEMPT_IN_PROGRESS | CallbackCase.state | ready_for_attempt | attempt_in_progress | A callback attempt is initiated. | no |
| SM_CALLBACK_CASE_STATE__ATTEMPT_IN_PROGRESS__AWAITING_OUTCOME_EVIDENCE | CallbackCase.state | attempt_in_progress | awaiting_outcome_evidence | The provider or staff attempt has started but outcome evidence is not yet settled. | no |
| SM_CALLBACK_CASE_STATE__AWAITING_OUTCOME_EVIDENCE__ANSWERED | CallbackCase.state | awaiting_outcome_evidence | answered | Answered outcome evidence lands on the current attempt fence. | no |
| SM_CALLBACK_CASE_STATE__AWAITING_OUTCOME_EVIDENCE__NO_ANSWER | CallbackCase.state | awaiting_outcome_evidence | no_answer | No-answer evidence settles on the current attempt fence. | no |
| SM_CALLBACK_CASE_STATE__AWAITING_OUTCOME_EVIDENCE__VOICEMAIL_LEFT | CallbackCase.state | awaiting_outcome_evidence | voicemail_left | Voicemail evidence settles on the current attempt fence. | no |
| SM_CALLBACK_CASE_STATE__AWAITING_OUTCOME_EVIDENCE__CONTACT_ROUTE_REPAIR_PENDING | CallbackCase.state | awaiting_outcome_evidence | contact_route_repair_pending | Delivery failure or invalid route prevents callback progress. | no |
| SM_CALLBACK_CASE_STATE__NO_ANSWER__AWAITING_RETRY | CallbackCase.state | no_answer | awaiting_retry | Resolution gate chooses retry rather than closure. | no |
| SM_CALLBACK_CASE_STATE__VOICEMAIL_LEFT__ESCALATION_REVIEW | CallbackCase.state | voicemail_left | escalation_review | The current voicemail outcome requires clinician or ops escalation rather than quiet completion. | no |
| SM_CALLBACK_CASE_STATE__ANSWERED__COMPLETED | CallbackCase.state | answered | completed | Resolution gate marks the callback complete on the evidence-bound attempt. | no |
| SM_CALLBACK_CASE_STATE__COMPLETED__CLOSED | CallbackCase.state | completed | closed | Callback case closes after completion is durably settled. | no |
| SM_CALLBACK_CASE_STATE__CLOSED__REOPENED | CallbackCase.state | closed | reopened | A new callback obligation or supervised reopen explicitly reopens the case. | no |
| SM_CALLBACK_CASE_STATE__REOPENED__QUEUED | CallbackCase.state | reopened | queued | Reopened callback work returns to the queue. | no |
| SM_CLINICIAN_MESSAGE_THREAD__DRAFTED__APPROVED | ClinicianMessageThread.state | drafted | approved | Approval-required content is approved for dispatch on the current thread version. | no |
| SM_CLINICIAN_MESSAGE_THREAD__APPROVED__SENT | ClinicianMessageThread.state | approved | sent | Dispatch envelope leaves the draft phase and dispatch begins. | no |
| SM_CLINICIAN_MESSAGE_THREAD__SENT__DELIVERED | ClinicianMessageThread.state | sent | delivered | Current delivery evidence bundle proves delivered posture for the thread. | no |
| SM_CLINICIAN_MESSAGE_THREAD__DELIVERED__PATIENT_REPLIED | ClinicianMessageThread.state | delivered | patient_replied | Patient reply lands on the current thread and remains under the same lineage. | no |
| SM_CLINICIAN_MESSAGE_THREAD__PATIENT_REPLIED__AWAITING_CLINICIAN_REVIEW | ClinicianMessageThread.state | patient_replied | awaiting_clinician_review | Reply is classified and routed back for clinician review. | no |
| SM_CLINICIAN_MESSAGE_THREAD__AWAITING_CLINICIAN_REVIEW__CLOSED | ClinicianMessageThread.state | awaiting_clinician_review | closed | Resolution gate closes the current message thread. | no |
| SM_CLINICIAN_MESSAGE_THREAD__SENT__DELIVERY_FAILED | ClinicianMessageThread.state | sent | delivery_failed | Delivery evidence bundle shows failure or expiry. | no |
| SM_CLINICIAN_MESSAGE_THREAD__DELIVERY_FAILED__CONTACT_ROUTE_REPAIR_PENDING | ClinicianMessageThread.state | delivery_failed | contact_route_repair_pending | Repair journey opens for the failed delivery dependency. | no |
| SM_CLINICIAN_MESSAGE_THREAD__CONTACT_ROUTE_REPAIR_PENDING__APPROVED | ClinicianMessageThread.state | contact_route_repair_pending | approved | Controlled resend or channel change is authorized on the current thread. | no |
| SM_CLINICIAN_MESSAGE_THREAD__CLOSED__REOPENED | ClinicianMessageThread.state | closed | reopened | Resolution gate reopens the thread for further review or callback escalation. | no |
| SM_CLINICIAN_MESSAGE_THREAD__REOPENED__AWAITING_CLINICIAN_REVIEW | ClinicianMessageThread.state | reopened | awaiting_clinician_review | Reopened thread returns to active clinician review posture. | no |
| SM_BOOKING_CASE_STATUS__HANDOFF_RECEIVED__CAPABILITY_CHECKED | BookingCase.status | handoff_received | capability_checked | Booking capability resolution runs on the current DecisionEpoch and route tuple. | no |
| SM_BOOKING_CASE_STATUS__CAPABILITY_CHECKED__SEARCHING_LOCAL | BookingCase.status | capability_checked | searching_local | Current capability state allows local search for the active audience. | no |
| SM_BOOKING_CASE_STATUS__SEARCHING_LOCAL__OFFERS_READY | BookingCase.status | searching_local | offers_ready | Slot snapshot and offer session are current and patient-visible. | no |
| SM_BOOKING_CASE_STATUS__OFFERS_READY__SELECTING | BookingCase.status | offers_ready | selecting | A slot is actively selected on the current snapshot and offer session. | no |
| SM_BOOKING_CASE_STATUS__SELECTING__REVALIDATING | BookingCase.status | selecting | revalidating | Chosen slot is rechecked against current supplier state and original policy. | no |
| SM_BOOKING_CASE_STATUS__REVALIDATING__COMMIT_PENDING | BookingCase.status | revalidating | commit_pending | Commit begins on the fenced BookingTransaction. | no |
| SM_BOOKING_CASE_STATUS__COMMIT_PENDING__BOOKED | BookingCase.status | commit_pending | booked | Authoritative booking truth is settled strongly enough for local case booked posture. | no |
| SM_BOOKING_CASE_STATUS__COMMIT_PENDING__CONFIRMATION_PENDING | BookingCase.status | commit_pending | confirmation_pending | Case-local commit needs explicit confirmation before calm booking truth. | no |
| SM_BOOKING_CASE_STATUS__COMMIT_PENDING__SUPPLIER_RECONCILIATION_PENDING | BookingCase.status | commit_pending | supplier_reconciliation_pending | Supplier truth is ambiguous or disputed and needs explicit booking review. | no |
| SM_BOOKING_CASE_STATUS__COMMIT_PENDING__WAITLISTED | BookingCase.status | commit_pending | waitlisted | No immediate safe booking exists but local waitlist continuation is still safe. | no |
| SM_BOOKING_CASE_STATUS__WAITLISTED__CALLBACK_FALLBACK | BookingCase.status | waitlisted | callback_fallback | Waitlist fallback requires callback rather than continued local waiting. | no |
| SM_BOOKING_CASE_STATUS__WAITLISTED__FALLBACK_TO_HUB | BookingCase.status | waitlisted | fallback_to_hub | Waitlist fallback requires hub transfer. | no |
| SM_BOOKING_CASE_STATUS__COMMIT_PENDING__BOOKING_FAILED | BookingCase.status | commit_pending | booking_failed | Local booking attempt ends without a legal continuation path. | no |
| SM_BOOKING_CASE_STATUS__BOOKED__MANAGED | BookingCase.status | booked | managed | Managed cancel, reschedule, reminder, and detail-update lifecycle is now the active booking posture. | no |
| SM_BOOKING_CASE_STATUS__MANAGED__CLOSED | BookingCase.status | managed | closed | Managed booking branch has no remaining operational debt on the lineage. | no |
| SM_WAITLIST_FALLBACK_TRANSFER__MONITORING__ARMED | WaitlistFallbackObligation.transferState | monitoring | armed | Deadline evaluation says local waitlist is no longer comfortably safe. | no |
| SM_WAITLIST_FALLBACK_TRANSFER__ARMED__TRANSFER_PENDING | WaitlistFallbackObligation.transferState | armed | transfer_pending | Callback or hub transfer has been chosen but linkage is not yet durable. | no |
| SM_WAITLIST_FALLBACK_TRANSFER__TRANSFER_PENDING__TRANSFERRED | WaitlistFallbackObligation.transferState | transfer_pending | transferred | Callback or hub branch is durably linked to the same booking lineage. | no |
| SM_WAITLIST_FALLBACK_TRANSFER__TRANSFERRED__SATISFIED | WaitlistFallbackObligation.transferState | transferred | satisfied | Transferred branch becomes the authoritative continuation path. | no |
| SM_WAITLIST_FALLBACK_TRANSFER__MONITORING__CANCELLED | WaitlistFallbackObligation.transferState | monitoring | cancelled | Local booking succeeds before fallback obligation activates. | no |
| SM_HUB_COORDINATION_CASE_STATUS__HUB_REQUESTED__INTAKE_VALIDATED | HubCoordinationCase.status | hub_requested | intake_validated | Network request validates onto one explicit hub lineage branch. | no |
| SM_HUB_COORDINATION_CASE_STATUS__INTAKE_VALIDATED__QUEUED | HubCoordinationCase.status | intake_validated | queued | Hub case enters the coordination queue. | no |
| SM_HUB_COORDINATION_CASE_STATUS__QUEUED__CLAIMED | HubCoordinationCase.status | queued | claimed | Ownership lease is acquired for live hub coordination. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CLAIMED__CANDIDATE_SEARCHING | HubCoordinationCase.status | claimed | candidate_searching | Network capacity snapshot generation begins. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CANDIDATE_SEARCHING__CANDIDATES_READY | HubCoordinationCase.status | candidate_searching | candidates_ready | Candidate snapshot and decision plan are computed. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CANDIDATES_READY__COORDINATOR_SELECTING | HubCoordinationCase.status | candidates_ready | coordinator_selecting | Coordinator begins selection on the current ranked frontier. | no |
| SM_HUB_COORDINATION_CASE_STATUS__COORDINATOR_SELECTING__ALTERNATIVES_OFFERED | HubCoordinationCase.status | coordinator_selecting | alternatives_offered | A real AlternativeOfferSession is generated for patient-visible choice. | no |
| SM_HUB_COORDINATION_CASE_STATUS__ALTERNATIVES_OFFERED__PATIENT_CHOICE_PENDING | HubCoordinationCase.status | alternatives_offered | patient_choice_pending | Live offer set is delivered and the case waits for patient response. | no |
| SM_HUB_COORDINATION_CASE_STATUS__COORDINATOR_SELECTING__CANDIDATE_REVALIDATING | HubCoordinationCase.status | coordinator_selecting | candidate_revalidating | A selected candidate is rechecked against live capacity and policy before native booking. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CANDIDATE_REVALIDATING__NATIVE_BOOKING_PENDING | HubCoordinationCase.status | candidate_revalidating | native_booking_pending | Native booking commit is underway. | no |
| SM_HUB_COORDINATION_CASE_STATUS__NATIVE_BOOKING_PENDING__CONFIRMATION_PENDING | HubCoordinationCase.status | native_booking_pending | confirmation_pending | Native booking commit still awaits authoritative confirmation. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CONFIRMATION_PENDING__BOOKED_PENDING_PRACTICE_ACK | HubCoordinationCase.status | confirmation_pending | booked_pending_practice_ack | Hub-native confirmation settles but the origin practice still owes acknowledgement. | no |
| SM_HUB_COORDINATION_CASE_STATUS__BOOKED_PENDING_PRACTICE_ACK__BOOKED | HubCoordinationCase.status | booked_pending_practice_ack | booked | Current practice acknowledgement debt is resolved or policy-exempt for the current generation. | no |
| SM_HUB_COORDINATION_CASE_STATUS__COORDINATOR_SELECTING__CALLBACK_TRANSFER_PENDING | HubCoordinationCase.status | coordinator_selecting | callback_transfer_pending | Callback fallback is selected but not yet durably linked. | no |
| SM_HUB_COORDINATION_CASE_STATUS__CALLBACK_TRANSFER_PENDING__CALLBACK_OFFERED | HubCoordinationCase.status | callback_transfer_pending | callback_offered | Current CallbackCase and CallbackExpectationEnvelope are durably linked and patient-visible. | no |
| SM_HUB_COORDINATION_CASE_STATUS__COORDINATOR_SELECTING__ESCALATED_BACK | HubCoordinationCase.status | coordinator_selecting | escalated_back | Case is durably returned to practice rather than staying in hub coordination. | no |
| SM_HUB_COORDINATION_CASE_STATUS__BOOKED__CLOSED | HubCoordinationCase.status | booked | closed | OpenCaseBlockers on the hub case are empty and closure is legal. | no |
| SM_HUB_CONFIRMATION_TRUTH__NO_COMMIT__CANDIDATE_REVALIDATING | HubOfferToConfirmationTruthProjection.confirmationTruthState | no_commit | candidate_revalidating | A selected hub candidate enters revalidation. | no |
| SM_HUB_CONFIRMATION_TRUTH__CANDIDATE_REVALIDATING__NATIVE_BOOKING_PENDING | HubOfferToConfirmationTruthProjection.confirmationTruthState | candidate_revalidating | native_booking_pending | Native booking is dispatched on the current candidate tuple. | no |
| SM_HUB_CONFIRMATION_TRUTH__NATIVE_BOOKING_PENDING__CONFIRMATION_PENDING | HubOfferToConfirmationTruthProjection.confirmationTruthState | native_booking_pending | confirmation_pending | Commit started but authoritative confirmation is not yet complete. | no |
| SM_HUB_CONFIRMATION_TRUTH__CONFIRMATION_PENDING__CONFIRMED_PENDING_PRACTICE_ACK | HubOfferToConfirmationTruthProjection.confirmationTruthState | confirmation_pending | confirmed_pending_practice_ack | Booking confirmation is authoritative enough, but origin-practice visibility debt remains. | no |
| SM_HUB_CONFIRMATION_TRUTH__CONFIRMED_PENDING_PRACTICE_ACK__CONFIRMED | HubOfferToConfirmationTruthProjection.confirmationTruthState | confirmed_pending_practice_ack | confirmed | Practice acknowledgement debt clears on the current generation. | no |
| SM_HUB_CONFIRMATION_TRUTH__CONFIRMATION_PENDING__DISPUTED | HubOfferToConfirmationTruthProjection.confirmationTruthState | confirmation_pending | disputed | Competing evidence or supplier drift makes confirmation ambiguous. | no |
| SM_HUB_CONFIRMATION_TRUTH__DISPUTED__SUPERSEDED | HubOfferToConfirmationTruthProjection.confirmationTruthState | disputed | superseded | A later authoritative tuple replaces the disputed projection. | no |
| SM_PHARMACY_CASE_STATUS__CANDIDATE_RECEIVED__RULES_EVALUATING | PharmacyCase.status | candidate_received | rules_evaluating | Service type and pathway eligibility are computed for the new pharmacy branch. | no |
| SM_PHARMACY_CASE_STATUS__RULES_EVALUATING__INELIGIBLE_RETURNED | PharmacyCase.status | rules_evaluating | ineligible_returned | Pathway rules reject safe pharmacy progression and return the work. | no |
| SM_PHARMACY_CASE_STATUS__RULES_EVALUATING__ELIGIBLE_CHOICE_PENDING | PharmacyCase.status | rules_evaluating | eligible_choice_pending | Pathway rules allow provider choice and referral progression. | no |
| SM_PHARMACY_CASE_STATUS__ELIGIBLE_CHOICE_PENDING__PROVIDER_SELECTED | PharmacyCase.status | eligible_choice_pending | provider_selected | A provider is durably selected from the current choice session. | no |
| SM_PHARMACY_CASE_STATUS__PROVIDER_SELECTED__CONSENT_PENDING | PharmacyCase.status | provider_selected | consent_pending | Selection exists but valid referral consent is missing, expired, or withdrawn. | no |
| SM_PHARMACY_CASE_STATUS__PROVIDER_SELECTED__PACKAGE_READY | PharmacyCase.status | provider_selected | package_ready | Valid consent exists and the canonical referral package is frozen. | no |
| SM_PHARMACY_CASE_STATUS__PACKAGE_READY__CONSENT_PENDING | PharmacyCase.status | package_ready | consent_pending | Provider, scope, or consent drift invalidates the prior package. | no |
| SM_PHARMACY_CASE_STATUS__PACKAGE_READY__DISPATCH_PENDING | PharmacyCase.status | package_ready | dispatch_pending | Dispatch attempt begins on the frozen package and provider tuple. | no |
| SM_PHARMACY_CASE_STATUS__DISPATCH_PENDING__REFERRED | PharmacyCase.status | dispatch_pending | referred | Dispatch proof is sufficient for referral handoff under the transport assurance profile. | no |
| SM_PHARMACY_CASE_STATUS__REFERRED__CONSULTATION_OUTCOME_PENDING | PharmacyCase.status | referred | consultation_outcome_pending | Referral is durably dispatched and the case awaits pharmacy outcome. | no |
| SM_PHARMACY_CASE_STATUS__CONSULTATION_OUTCOME_PENDING__RESOLVED_BY_PHARMACY | PharmacyCase.status | consultation_outcome_pending | resolved_by_pharmacy | Pharmacy outcome is strong enough to settle the branch locally. | no |
| SM_PHARMACY_CASE_STATUS__CONSULTATION_OUTCOME_PENDING__UNRESOLVED_RETURNED | PharmacyCase.status | consultation_outcome_pending | unresolved_returned | Outcome proves unresolved return to practice rather than pharmacy resolution. | no |
| SM_PHARMACY_CASE_STATUS__CONSULTATION_OUTCOME_PENDING__URGENT_BOUNCE_BACK | PharmacyCase.status | consultation_outcome_pending | urgent_bounce_back | Urgent return or bounce-back is required. | no |
| SM_PHARMACY_CASE_STATUS__CONSULTATION_OUTCOME_PENDING__NO_CONTACT_RETURN_PENDING | PharmacyCase.status | consultation_outcome_pending | no_contact_return_pending | No-contact return is required rather than quiet closure. | no |
| SM_PHARMACY_CASE_STATUS__CONSULTATION_OUTCOME_PENDING__OUTCOME_RECONCILIATION_PENDING | PharmacyCase.status | consultation_outcome_pending | outcome_reconciliation_pending | Weak or ambiguous outcome truth requires case-local reconciliation review. | no |
| SM_PHARMACY_CASE_STATUS__OUTCOME_RECONCILIATION_PENDING__RESOLVED_BY_PHARMACY | PharmacyCase.status | outcome_reconciliation_pending | resolved_by_pharmacy | Reconciliation resolves in favor of pharmacy completion. | no |
| SM_PHARMACY_CASE_STATUS__OUTCOME_RECONCILIATION_PENDING__UNRESOLVED_RETURNED | PharmacyCase.status | outcome_reconciliation_pending | unresolved_returned | Reconciliation resolves to unresolved return-to-practice. | no |
| SM_PHARMACY_CASE_STATUS__OUTCOME_RECONCILIATION_PENDING__URGENT_BOUNCE_BACK | PharmacyCase.status | outcome_reconciliation_pending | urgent_bounce_back | Reconciliation concludes urgent bounce-back is required. | no |
| SM_PHARMACY_CASE_STATUS__OUTCOME_RECONCILIATION_PENDING__NO_CONTACT_RETURN_PENDING | PharmacyCase.status | outcome_reconciliation_pending | no_contact_return_pending | Reconciliation concludes no-contact return remains the live branch. | no |
| SM_PHARMACY_CASE_STATUS__RESOLVED_BY_PHARMACY__CLOSED | PharmacyCase.status | resolved_by_pharmacy | closed | Resolved pharmacy branch has no remaining blocker, consent, dispatch, or outcome debt. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__SATISFIED__EXPIRING | PharmacyConsentCheckpoint.checkpointState | satisfied | expiring | Consent approaches expiry under the same provider and package scope. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__EXPIRING__RENEWAL_REQUIRED | PharmacyConsentCheckpoint.checkpointState | expiring | renewal_required | Consent can no longer authorize dispatch or continuation. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__SATISFIED__WITHDRAWN | PharmacyConsentCheckpoint.checkpointState | satisfied | withdrawn | Consent is withdrawn before dispatch. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__SATISFIED__REVOKED_POST_DISPATCH | PharmacyConsentCheckpoint.checkpointState | satisfied | revoked_post_dispatch | Consent is revoked after dispatch already occurred. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__REVOKED_POST_DISPATCH__WITHDRAWAL_RECONCILIATION | PharmacyConsentCheckpoint.checkpointState | revoked_post_dispatch | withdrawal_reconciliation | Withdrawal must be reconciled downstream after dispatch already left the platform. | no |
| SM_PHARMACY_CONSENT_CHECKPOINT__WITHDRAWAL_RECONCILIATION__RECOVERY_REQUIRED | PharmacyConsentCheckpoint.checkpointState | withdrawal_reconciliation | recovery_required | Withdrawal cannot be fully reconciled and needs governed recovery. | no |
| SM_PHARMACY_DISPATCH_STATUS__CREATED__ADAPTER_DISPATCHED | PharmacyDispatchAttempt.status | created | adapter_dispatched | Adapter dispatch begins on the frozen plan and package tuple. | no |
| SM_PHARMACY_DISPATCH_STATUS__ADAPTER_DISPATCHED__TRANSPORT_ACCEPTED | PharmacyDispatchAttempt.status | adapter_dispatched | transport_accepted | Transport layer accepts the dispatch. | no |
| SM_PHARMACY_DISPATCH_STATUS__TRANSPORT_ACCEPTED__PROVIDER_ACCEPTED | PharmacyDispatchAttempt.status | transport_accepted | provider_accepted | Provider-side acceptance is observed. | no |
| SM_PHARMACY_DISPATCH_STATUS__PROVIDER_ACCEPTED__PROOF_PENDING | PharmacyDispatchAttempt.status | provider_accepted | proof_pending | Provider accepted the request but authoritative dispatch proof is still pending. | no |
| SM_PHARMACY_DISPATCH_STATUS__PROOF_PENDING__PROOF_SATISFIED | PharmacyDispatchAttempt.status | proof_pending | proof_satisfied | Authoritative dispatch proof lands for the same tuple. | no |
| SM_PHARMACY_DISPATCH_STATUS__PROOF_PENDING__RECONCILIATION_REQUIRED | PharmacyDispatchAttempt.status | proof_pending | reconciliation_required | Proof remains weak, conflicting, or tuple-drifted and needs review. | no |
| SM_PHARMACY_DISPATCH_STATUS__PROOF_PENDING__FAILED | PharmacyDispatchAttempt.status | proof_pending | failed | Authoritative failure lands on the current attempt chain. | no |
| SM_PHARMACY_DISPATCH_STATUS__PROOF_PENDING__EXPIRED | PharmacyDispatchAttempt.status | proof_pending | expired | Proof deadline elapses without authoritative settlement. | no |
| SM_PHARMACY_DISPATCH_STATUS__RECONCILIATION_REQUIRED__SUPERSEDED | PharmacyDispatchAttempt.status | reconciliation_required | superseded | A fresh dispatch attempt supersedes the ambiguous one. | no |
| SM_ADMIN_RESOLUTION_CASE__QUEUED__IN_PROGRESS | AdminResolutionCase.state | queued | in_progress | Admin-resolution work is claimed on the current boundary tuple. | no |
| SM_ADMIN_RESOLUTION_CASE__IN_PROGRESS__AWAITING_INTERNAL_ACTION | AdminResolutionCase.state | in_progress | awaiting_internal_action | Subtype profile declares internal follow-up as the dominant blocker. | no |
| SM_ADMIN_RESOLUTION_CASE__IN_PROGRESS__AWAITING_EXTERNAL_DEPENDENCY | AdminResolutionCase.state | in_progress | awaiting_external_dependency | Subtype profile declares external dependency as the dominant blocker. | no |
| SM_ADMIN_RESOLUTION_CASE__IN_PROGRESS__AWAITING_PRACTICE_ACTION | AdminResolutionCase.state | in_progress | awaiting_practice_action | Subtype profile declares practice action as the dominant blocker. | no |
| SM_ADMIN_RESOLUTION_CASE__IN_PROGRESS__PATIENT_NOTIFIED | AdminResolutionCase.state | in_progress | patient_notified | Patient-facing notification is authoritatively settled under the current boundary tuple. | no |
| SM_ADMIN_RESOLUTION_CASE__PATIENT_NOTIFIED__COMPLETED | AdminResolutionCase.state | patient_notified | completed | Typed completion artifact is recorded for the current subtype and expectation text. | no |
| SM_ADMIN_RESOLUTION_CASE__COMPLETED__CLOSED | AdminResolutionCase.state | completed | closed | Admin-resolution branch has no remaining dependency or reopen debt. | no |
| SM_ADMIN_RESOLUTION_CASE__CLOSED__REOPENED | AdminResolutionCase.state | closed | reopened | New symptom, safety preemption, invalidated advice, or dependency reopen requires bounded admin work to stop. | no |
| SM_ADMIN_RESOLUTION_CASE__REOPENED__IN_PROGRESS | AdminResolutionCase.state | reopened | in_progress | Reopened boundary review returns the case to active admin work or reclassification. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__SHADOW_ONLY__TRUSTED | AssistiveCapabilityTrustEnvelope.trustState | shadow_only | trusted | The current watch tuple, rollout verdict, trust projection, and publication posture authorize visible same-shell assistive posture. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__TRUSTED__DEGRADED | AssistiveCapabilityTrustEnvelope.trustState | trusted | degraded | Trust score or continuity posture drops but provenance can still remain visible in the same shell. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__TRUSTED__QUARANTINED | AssistiveCapabilityTrustEnvelope.trustState | trusted | quarantined | Trust or policy requires provenance-only or placeholder posture. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__TRUSTED__FROZEN | AssistiveCapabilityTrustEnvelope.trustState | trusted | frozen | Evidence, publication, trust, selected-anchor, session, kill-switch, or release-freeze posture drifts. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__DEGRADED__TRUSTED | AssistiveCapabilityTrustEnvelope.trustState | degraded | trusted | Watch-tuple trust, continuity, and publication posture recover for the same artifact and route tuple. | no |
| SM_ASSISTIVE_TRUST_ENVELOPE__FROZEN__TRUSTED | AssistiveCapabilityTrustEnvelope.trustState | frozen | trusted | A fresh rerun or policy recovery restores trusted same-shell posture. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__SHADOW_ONLY__VISIBLE_SUMMARY | AssistiveCapabilityRolloutVerdict.rolloutRung | shadow_only | visible_summary | Visible-summary evidence and slice policy are complete for the current cohort. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__VISIBLE_SUMMARY__VISIBLE_INSERT | AssistiveCapabilityRolloutVerdict.rolloutRung | visible_summary | visible_insert | Insert evidence and policy are complete for the current cohort slice. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__VISIBLE_INSERT__VISIBLE_COMMIT | AssistiveCapabilityRolloutVerdict.rolloutRung | visible_insert | visible_commit | Governed-commit ceiling is approved for the current slice. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__VISIBLE_SUMMARY__FROZEN | AssistiveCapabilityRolloutVerdict.rolloutRung | visible_summary | frozen | Threshold breach, trust degradation, policy drift, publication staleness, or incident spike freezes the slice. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__VISIBLE_INSERT__FROZEN | AssistiveCapabilityRolloutVerdict.rolloutRung | visible_insert | frozen | The current slice freezes after visible insert posture was live. | no |
| SM_ASSISTIVE_ROLLOUT_VERDICT__FROZEN__WITHDRAWN | AssistiveCapabilityRolloutVerdict.rolloutRung | frozen | withdrawn | The slice is no longer legal or supported for visible rollout. | no |
| SM_DISPOSITION_ELIGIBILITY__BLOCKED__ARCHIVE_ONLY | DispositionEligibilityAssessment.eligibilityState | blocked | archive_only | Preservation constraints still prohibit deletion but archive posture becomes legal. | no |
| SM_DISPOSITION_ELIGIBILITY__ARCHIVE_ONLY__DELETE_ALLOWED | DispositionEligibilityAssessment.eligibilityState | archive_only | delete_allowed | Current assessment proves delete is safe under the same freeze, hold, dependency, and graph posture. | no |
| SM_LEGAL_HOLD_STATE__PENDING_REVIEW__ACTIVE | LegalHoldRecord.holdState | pending_review | active | Hold scope is confirmed and preservation becomes mandatory. | no |
| SM_LEGAL_HOLD_STATE__ACTIVE__RELEASED | LegalHoldRecord.holdState | active | released | The hold is explicitly released and superseding disposition assessment is recomputed. | no |
| SM_LEGAL_HOLD_STATE__ACTIVE__SUPERSEDED | LegalHoldRecord.holdState | active | superseded | A wider or newer hold scope supersedes the prior record. | no |
| SM_RESILIENCE_SURFACE_BINDING__LIVE__DIAGNOSTIC_ONLY | ResilienceSurfaceRuntimeBinding.bindingState | live | diagnostic_only | Trust or publication posture narrows the resilience board to diagnostic evidence only. | no |
| SM_RESILIENCE_SURFACE_BINDING__DIAGNOSTIC_ONLY__RECOVERY_ONLY | ResilienceSurfaceRuntimeBinding.bindingState | diagnostic_only | recovery_only | Active freeze or tuple drift allows only bounded recovery posture. | no |
| SM_RESILIENCE_SURFACE_BINDING__DIAGNOSTIC_ONLY__LIVE | ResilienceSurfaceRuntimeBinding.bindingState | diagnostic_only | live | Evidence pack admissibility, publication, and trust posture are restored on the same tuple. | no |
| SM_RESILIENCE_SURFACE_BINDING__RECOVERY_ONLY__BLOCKED | ResilienceSurfaceRuntimeBinding.bindingState | recovery_only | blocked | Current resilience scope can no longer legally expose even bounded recovery controls. | no |
| SM_RECOVERY_CONTROL_POSTURE__LIVE_CONTROL__DIAGNOSTIC_ONLY | RecoveryControlPosture.postureState | live_control | diagnostic_only | Publication, trust, or exercise freshness no longer supports live control. | no |
| SM_RECOVERY_CONTROL_POSTURE__DIAGNOSTIC_ONLY__GOVERNED_RECOVERY | RecoveryControlPosture.postureState | diagnostic_only | governed_recovery | Current posture narrows to bounded recovery operations only. | no |
| SM_RECOVERY_CONTROL_POSTURE__DIAGNOSTIC_ONLY__LIVE_CONTROL | RecoveryControlPosture.postureState | diagnostic_only | live_control | Current evidence pack, publication, and readiness tuple again support live resilience controls. | no |
| SM_RECOVERY_CONTROL_POSTURE__GOVERNED_RECOVERY__BLOCKED | RecoveryControlPosture.postureState | governed_recovery | blocked | No legal operator control remains under the current tuple. | no |
| SM_CROSS_PHASE_SCORECARD__BLOCKED__STALE | CrossPhaseConformanceScorecard.scorecardState | blocked | stale | Required rows exist but some planning, verification, runtime, or continuity proof is still stale or partial. | no |
| SM_CROSS_PHASE_SCORECARD__STALE__EXACT | CrossPhaseConformanceScorecard.scorecardState | stale | exact | Every required row is exact and the scorecard hash still matches the current planning, verification, runtime, continuity, and end-state proof tuples. | no |
| SM_CROSS_PHASE_SCORECARD__EXACT__STALE | CrossPhaseConformanceScorecard.scorecardState | exact | stale | Any planning summary, runtime publication tuple, continuity proof set, or end-state proof drifts out of exact alignment. | no |
| SM_CROSS_PHASE_SCORECARD__STALE__BLOCKED | CrossPhaseConformanceScorecard.scorecardState | stale | blocked | A required proof, verification scenario, runtime publication tuple, or continuity bundle is missing or contradictory. | no |
