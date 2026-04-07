# Callback and clinician messaging loop

## Purpose

Define complete lifecycle models for callback and clinician-message endpoints so they are first-class operational domains.

This document specializes the canonical section in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`. `AccessGrantService` owns any patient-access links issued from these flows, `SafetyOrchestrator` owns materially new evidence and preemption, and `LifecycleCoordinator` owns request closure and governed reopen.

These lifecycles also inherit the cross-phase guardrails:

- active callback and message work must hold a `RequestLifecycleLease`
- clinically material replies or callback outcomes must first settle one canonical `EvidenceAssimilationRecord` plus `MaterialDeltaAssessment`, then create a new immutable `EvidenceSnapshot` backed by one frozen capture bundle, append-only derivation packages, and parity-verified summaries; late delivery, transcript, or extraction updates may not rewrite the prior snapshot in place
- unless evidence is on the explicit technical allow-list or is a pure nonclinical control delta, classify it under the canonical four-class model; route failures on active callback promises are `contact_safety_relevant`, not ordinary ops noise
- any `potentially_clinical` or `contact_safety_relevant` reply or callback outcome whose `MaterialDeltaAssessment` requires re-safety must create `SafetyPreemptionRecord` and rerun the canonical safety or contact-risk engine before routine flow continues
- no callback or message service may close the request directly; only `LifecycleCoordinator` may close the request
- every telephony or channel side effect in this document must reuse the canonical `IdempotencyRecord`, `CommandActionRecord`, `AdapterDispatchAttempt`, and `AdapterReceiptCheckpoint` chain from Phase 0; callback- and thread-local attempt objects are domain views over that same effect ledger, not separate replay systems

## Callback domain

High-priority callback defects in this domain:

1. callback scheduling and ownership are described as states only, not as a renewable case-intent lease, so claim, reschedule, or cancel can drift under live queue and reachability change
2. attempt execution lacks an idempotent attempt fence, so duplicate dial actions, overlapping staff attempts, or telephony retries can emit conflicting outcomes
3. the patient-visible callback promise is not bound to one authoritative expectation envelope, so scheduled windows, retry timing, and repair states can contradict each other
4. answered, no-answer, and voicemail outcomes are not explicitly evidence-bound, so completion could be recorded without proving who called, which route was used, and what the patient actually received
5. retry, escalation, expiry, and completion are not controlled by one terminal resolution gate, so the case can oscillate between retry and closure while stale callback assurance remains visible

### Core object

- `CallbackCase`

`CallbackCase` must carry `episodeRef`, `requestRef`, `requestLineageRef`, and exactly one canonical `LineageCaseLink(caseFamily = callback)`. Scheduling, attempts, promise envelopes, outcome evidence, and resolution may widen or narrow callback-local truth, but they may not become an undocumented parallel lineage map.

Add the supporting callback contracts:

**CallbackIntentLease**
`leaseId`, `callbackCaseRef`, `requestLifecycleLeaseRef`, `leaseAuthorityRef`, `ownedByActorRef`, `ownedBySessionRef`, `serviceWindowRef`, `contactRouteRef`, `routeIntentBindingRef`, `lineageFenceEpoch`, `ownershipEpoch`, `fencingToken`, `leaseMode = queued | scheduled | ready_for_attempt | suspended_for_repair`, `caseVersionRef`, `lastHeartbeatAt`, `staleOwnerRecoveryRef`, `expiresAt`

`CallbackIntentLease` is the only authority for claiming, scheduling, rescheduling, or cancelling a live callback. If queue priority, preferred window, contact route, or callback urgency changes materially, the current lease must be invalidated and replaced before a new attempt may start. Heartbeats, schedule changes, and ready-for-attempt arming must compare-and-set the current `ownershipEpoch` and `fencingToken`; stale writers must fail into canonical `StaleOwnershipRecoveryRecord` instead of silently reusing the old callback shell.

**CallbackAttemptRecord**
`attemptId`, `callbackCaseRef`, `callbackIntentLeaseRef`, `requestLifecycleLeaseRef`, `attemptOrdinal`, `attemptFenceEpoch`, `ownershipEpochRef`, `fencingToken`, `dialTargetRef`, `channelProviderRef`, `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, `latestReceiptCheckpointRef`, `initiatedAt`, `settlementState = initiated | provider_acked | outcome_pending | settled | reconcile_required`, `idempotencyKey`

`CallbackAttemptRecord` makes each callback attempt idempotent and exclusive. Duplicate UI taps, worker retries, or provider callbacks that resolve to the same attempt fence must return the existing record and may not create a second live attempt or duplicate patient notification. It is the callback-domain wrapper over the canonical adapter effect ledger, so telephony delivery or outcome evidence may widen or settle the current attempt, but it may not fork a second side-effect chain outside the linked `AdapterDispatchAttempt`.

**CallbackExpectationEnvelope**
`expectationEnvelopeId`, `callbackCaseRef`, `identityRepairBranchDispositionRef`, `patientVisibleState = queued | scheduled | attempting_now | retry_planned | route_repair_required | escalated | closed`, `expectedWindowRef`, `windowLowerAt`, `windowUpperAt`, `windowRiskState = on_track | at_risk | missed_window | repair_required`, `stateConfidenceBand = high | medium | low`, `predictionModelRef`, `fallbackGuidanceRef`, `grantSetRef`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `channelReleaseFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `transitionEnvelopeRef`, `continuityEvidenceRef`, `causalToken`, `freezeDispositionRef`, `monotoneRevision`

`CallbackExpectationEnvelope` is the only patient-facing source of callback promise and repair guidance. Staff scheduling state, retry timers, and secure-entry grants may change underneath it, but patient views must only advance or retract through a new envelope revision so stale callback assurance cannot linger. The visible callback window must be derived from the calibrated answer-or-terminal-outcome model for the current callback fence. It may narrow or improve quietly, but any widening, missed-window, or repair transition must publish a new revision with reason rather than silently stretching the promise.

**CallbackOutcomeEvidenceBundle**
`bundleId`, `attemptRef`, `attemptFenceEpoch`, `outcome = answered | no_answer | voicemail_left | route_invalid | provider_failure`, `recordedByActorRef`, `recordedAt`, `routeEvidenceRef`, `providerDispositionRef`, `patientAcknowledgementRef`, `safetyClassification`, `causalToken`

`CallbackOutcomeEvidenceBundle` binds each settled callback outcome to proof. `answered`, `no_answer`, and `voicemail_left` may not transition the case toward completion until the bundle is durably stored and any required safety classification or preemption decision has been made.

**CallbackResolutionGate**
`resolutionGateId`, `callbackCaseRef`, `latestAttemptRef`, `latestOutcomeEvidenceRef`, `latestExpectationEnvelopeRef`, `decision = retry | escalate | complete | cancel | expire`, `decisionReasonRef`, `nextActionAt`, `stalePromiseRevocationRef`, `requiresLifecycleReview`, `causalToken`, `monotoneRevision`

`CallbackResolutionGate` is the sole authority for moving from an attempt outcome into retry, escalation, completion, cancel, or expiry. It must revoke superseded promises, rotate stale grants, and block terminal callback closure while safety preemption, reachability repair, or unsettled evidence still exists.

### Suggested state model

`created -> queued -> scheduled -> ready_for_attempt -> attempt_in_progress -> awaiting_outcome_evidence -> answered | no_answer | voicemail_left | contact_route_repair_pending -> awaiting_retry | escalation_review -> completed | cancelled | expired -> closed`

Reopen path:

`closed -> reopened -> queued`

### Required fields

- callback urgency
- contact route and fallback
- preferred window
- active intent lease ref
- attempt counters
- latest settled attempt ref
- current expectation envelope ref
- latest attempt outcome
- outcome evidence bundle ref
- active resolution gate ref
- retry policy reference
- reachability dependency ref
- patient-visible expectation state

### Operational rules

- explicit claim and release rules
- explicit retry rules and max attempts
- voicemail policy by pathway
- escalation rules for repeated failure
- patient communication on each major transition
- full attempt audit trail
- only the active `CallbackIntentLease` whose `ownershipEpoch` and `fencingToken` still match the current `RequestLifecycleLease` may schedule, reschedule, cancel, or arm `ready_for_attempt`; expiry, takeover, or superseded reacquire must create or reuse `StaleOwnershipRecoveryRecord` and downgrade the same callback shell to recovery until authority is re-established
- every provider dial or staff-triggered callback attempt must create or reuse one `CallbackAttemptRecord` keyed by attempt fence and dial target
- telephony provider receipts, callback webhooks, and duplicate dial outcomes must ingest only through `AdapterReceiptCheckpoint`; exact or semantic replay may update the live attempt, while divergent same-fence evidence must open `ReplayCollisionReview` instead of settling a second callback outcome
- patient-visible callback timing, repair messaging, and secure callback entry grants must derive only from `CallbackExpectationEnvelope`
- `answered`, `no_answer`, and `voicemail_left` must carry a durable `CallbackOutcomeEvidenceBundle` before `CallbackResolutionGate` can choose retry, escalate, or complete
- `CallbackResolutionGate` must revoke stale promise envelopes and stale grants before any terminal state transition is exposed to the patient
- secure callback entry links may only use `callback_status_entry`, `callback_response`, or `contact_route_repair`
- delivery failure or contact-route invalidation while a callback dependency is active must move the case to `contact_route_repair_pending`, refresh the patient-visible expectation state, and suppress stale callback assurance until repaired, expired, or escalated
- no patient-facing callback assurance may imply final resolution while a `SafetyPreemptionRecord` is pending
- `CallbackExpectationEnvelope` may remain live only while its bound `RouteIntentBinding`, `ReleaseApprovalFreeze`, channel-freeze posture, and required `AssuranceSliceTrustRecord` rows still permit writable callback interaction; otherwise the same patient shell must degrade the callback promise to read-only, placeholder, or repair guidance through the active disposition instead of leaving stale response controls visible
- callback completion may close the `CallbackCase` only after `CallbackResolutionGate.decision = complete`; request closure still requires `LifecycleCoordinator`

## Clinician message domain

High-priority clinician-message defects in this domain:

1. message approval and send are described as transitions only, not as one immutable dispatch envelope, so retries, resend, and approval drift can settle against different thread versions
2. delivery, dispute, and expiry outcomes are not durably evidence-bound, so the thread can look delivered or available without proving what the patient-facing channel actually did
3. patient-visible reply expectation and repair posture are not bound to one authoritative envelope, so reply-needed, awaiting-review, and delivery-repair states can contradict each other
4. review, escalation, reopen, and closure are not controlled by one terminal resolution gate, so thread closure can outrun pending reply review, callback escalation, or repair
5. patient and staff thread actions are not explicitly fenced to the current thread version, release tuple, and trust posture, so stale send or reply affordances can survive drift

Add the supporting clinician-message contracts:

**MessageDispatchEnvelope**
`dispatchEnvelopeId`, `threadRef`, `threadVersionRef`, `draftRef`, `approvedByRef`, `deliveryPlanRef`, `routeIntentBindingRef`, `requestLifecycleLeaseRef`, `dispatchFenceEpoch`, `ownershipEpochRef`, `fencingToken`, `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, `latestReceiptCheckpointRef`, `supportMutationAttemptRef`, `supportActionRecordRef`, `repairIntent = initial_send | controlled_resend | channel_change | attachment_recovery`, `channelTemplateRef`, `transportState = drafted | approved | dispatching | provider_accepted | provider_rejected`, `deliveryEvidenceState = unobserved | delivered | failed | disputed | expired`, `currentDeliveryConfidenceRef`, `deliveryModelVersionRef`, `calibrationVersion`, `causalToken`, `monotoneRevision`, `idempotencyKey`

`MessageDispatchEnvelope` is the immutable dispatch authority for a thread send or resend. Duplicate taps, worker retries, provider retries, or support repair retries that resolve to the same dispatch fence must reuse the same envelope and may not create a second live send. It is also bound to the canonical adapter effect ledger through `commandActionRecordRef`, `idempotencyRecordRef`, and `adapterDispatchAttemptRef`, so `transportState` and `deliveryEvidenceState` remain orthogonal: provider acceptance may advance pending copy, but only evidence-bound delivery may mark the thread delivered. When support initiated the repair, the same envelope must point back to the owning `SupportMutationAttempt` and `SupportActionRecord` so operator tooling, downstream evidence, and patient thread truth all reconcile to one causal send chain.

**MessageDeliveryEvidenceBundle**
`bundleId`, `dispatchEnvelopeRef`, `dispatchFenceEpoch`, `threadVersionRef`, `receiptCheckpointRef`, `deliveryState = delivered | disputed | failed | expired`, `evidenceStrength = direct_provider_receipt | durable_channel_ack | manual_attestation | contradictory_signal`, `providerDispositionRef`, `deliveryArtifactRefs[]`, `reachabilityDependencyRef`, `supportActionSettlementRef`, `causalToken`, `recordedAt`

`MessageDeliveryEvidenceBundle` binds delivery truth to evidence. A thread may not appear durably delivered, disputed, or route-repair-blocked without one stored evidence bundle for the current dispatch envelope, and provider callbacks or channel receipts may contribute only if they were accepted through the linked `AdapterReceiptCheckpoint`. Support receipts, workbench chips, and omnichannel timeline copy may cite this bundle, but they may not replace it with local acknowledgement or transport optimism.

**ThreadExpectationEnvelope**
`threadExpectationId`, `threadRef`, `reachabilityDependencyRef`, `contactRepairJourneyRef`, `identityRepairBranchDispositionRef`, `patientVisibleState = reply_needed | awaiting_review | reviewed | reply_blocked | delivery_repair_required | closed`, `replyWindowRef`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `stateConfidenceBand = high | medium | low`, `fallbackGuidanceRef`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `channelReleaseFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `latestSupportActionSettlementRef`, `transitionEnvelopeRef`, `continuityEvidenceRef`, `freezeDispositionRef`, `causalToken`, `monotoneRevision`

`ThreadExpectationEnvelope` is the sole patient-facing source for reply timing, repair state, and awaiting-review posture. Thread summaries and open-thread guidance must only advance through a new envelope revision. `deliveryRiskState` may widen pending or repair guidance, but it may not mark a thread delivered, reviewed, or closed without current delivery evidence or authoritative review outcome. When support is performing controlled resend or delivery repair, patient-visible repair wording must still flow through a fresh envelope revision linked to the latest authoritative `SupportActionSettlement`.

**ThreadResolutionGate**
`resolutionGateId`, `threadRef`, `latestDispatchRef`, `latestReplyRef`, `latestExpectationEnvelopeRef`, `latestSupportActionSettlementRef`, `decision = await_reply | review_pending | escalate_to_callback | close | reopen | repair_route`, `decisionReasonRef`, `sameShellRecoveryRef`, `requiresLifecycleReview`, `causalToken`, `monotoneRevision`, `decidedAt`

`ThreadResolutionGate` is the only authority for thread reopen, callback escalation, repair routing, and closure. It must hold closure while delivery dispute, reply review, reachability repair, or safety preemption remains unsettled. Support tooling may propose retry or repair, but only this gate may authorize a fresh live resend chain or final closure.

### Core object

- `ClinicianMessageThread`

`ClinicianMessageThread` must carry `episodeRef`, `requestRef`, `requestLineageRef`, and exactly one canonical `LineageCaseLink(caseFamily = clinician_message)`. Reply review, callback escalation, repair, and closure must settle against that same link so patient, staff, and audit views can reconstruct whether the thread stayed active, reopened, escalated to callback, or returned work to triage.

### Suggested state model

Primary path:

`drafted -> approved -> sent -> delivered -> patient_replied -> awaiting_clinician_review -> closed`

Reopen path:

`closed -> reopened -> awaiting_clinician_review`

Reachability-repair path:

`sent | delivered -> delivery_failed -> contact_route_repair_pending -> approved | sent`

### Required fields

- thread purpose and closure rule
- author and approver refs
- delivery state
- reply expectation window
- reachability dependency ref
- re-safety flag on patient reply

### Operational rules

- no unapproved send for approval-required content
- response handling with explicit closure semantics
- re-safety check on clinically material or contact-safety-relevant replies
- escalation path to callback or triage reopen
- patient and staff timeline consistency
- every send or resend must create or reuse one `MessageDispatchEnvelope` keyed by dispatch fence and current thread version
- provider receipts, webhook retries, and delivery callbacks must reconcile through `AdapterReceiptCheckpoint` onto the same `MessageDispatchEnvelope`; stale or out-of-order receipts may widen pending or disputed posture, but they may not manufacture a second send or second delivery settlement
- approval, send, resend, repair, reopen, and close must also validate the current request-level `ownershipEpoch` plus `fencingToken` and, for staff-originated thread mutations, the current `ReviewActionLease`; stale writers must fail closed into same-shell recovery rather than settling a second send, stale close, or stale repair mutation
- delivery, dispute, failure, or expiry states must materialize from `MessageDeliveryEvidenceBundle` before the thread may appear durably delivered, blocked, or ready for closure
- patient-visible reply timing, awaiting-review posture, and delivery-repair guidance must derive only from `ThreadExpectationEnvelope`
- `ThreadResolutionGate` must decide reopen, callback escalation, closure, or repair routing; no controller or worker may close the thread directly on transport success alone
- support-triggered resend, reissue, channel change, and attachment recovery must reuse the current `MessageDispatchEnvelope` while its transport or delivery-evidence chain remains unsettled; a fresh external effect is legal only after `ThreadResolutionGate.decision = repair_route | reopen` or the current `MessageDeliveryEvidenceBundle.deliveryState = failed | expired | disputed`
- every support-side repair receipt must reference the same `MessageDispatchEnvelope`, current `MessageDeliveryEvidenceBundle`, latest `ThreadExpectationEnvelope`, and current `ThreadResolutionGate`; provider acceptance or local support acknowledgement may not bypass that chain
- live send, repair, or patient-reply affordances may remain writable only while the bound `RouteIntentBinding`, `ReleaseApprovalFreeze`, channel-freeze posture, and required `AssuranceSliceTrustRecord` rows still permit that thread action
- secure message entry links may only use `message_thread_entry`, `message_reply`, or `contact_route_repair`
- patient replies route to `ClinicianMessageThread` first; triage reopen happens only after evidence classification or policy requires it
- delivery failure on an active message dependency must create a visible repair state instead of leaving the thread looking silently available
- patient replies may not auto-resume routine flow while preemption is pending
- thread closure may close the `ClinicianMessageThread`, but request closure still requires `LifecycleCoordinator`

## Delivery, callback-window, and settlement confidence model

Delivery, callback timing, and patient-visible repair posture must be computed from a calibrated competing-risks model and a monotone reconciliation rule, not from local toasts, elapsed wall clock alone, or whichever callback arrived last.

For the active message dispatch or callback attempt `z`, elapsed discrete interval `u`, and feature vector `x_z` built from channel, route quality, provider, template or pathway, time of day, prior reachability history, and current dependency posture, define terminal causes `k` as:

- message dispatch: `k in {delivered, failed, disputed, expired}`
- callback attempt: `k in {answered, no_answer, route_invalid, provider_failure, expired}`

Use cause-specific discrete hazards:

- `lambda_k(u | x_z) = P(T_z = u, J_z = k | T_z >= u, x_z)`
- `S_z(u | x_z) = prod_{v = 1}^{u} (1 - sum_k lambda_k(v | x_z))`
- `F_k(u | x_z) = sum_{v = 1}^{u} lambda_k(v | x_z) * S_z(v - 1 | x_z)`

Calibrate each cumulative incidence with a versioned post-hoc calibrator:

- `p_k(u | x_z) = Cal_k(F_k(u | x_z))`

For callback promise windows, let `T_success` be the first `answered` time for the current callback fence and define:

- `L_z = Q_{0.1}(T_success | x_z) - delta_cb`
- `U_z = Q_{0.9}(T_success | x_z) + delta_cb`

where `delta_cb` is recency-weighted conformal padding computed from recent resolved callback cases in the same tenant and pathway.

Use the calibrated probabilities only for truthful pending posture:

- `windowRiskState = on_track` when `p_answered(U_z | x_z) >= theta_window` and no counterevidence exists
- `deliveryRiskState = at_risk` when the soft horizon is missed and neither success nor hard-failure evidence exists
- `deliveryRiskState = likely_failed` or `windowRiskState = missed_window` when `p_failed(u | x_z) + p_expired(u | x_z) >= theta_fail`
- `disputed` whenever contradictory same-fence terminal evidence exists

Direct success states remain evidence-bound:

- patient-visible `delivered` requires current `MessageDeliveryEvidenceBundle`
- patient-visible callback completion or closed-window success requires current `CallbackOutcomeEvidenceBundle`
- calibrated probabilities may widen pending or repair guidance, but they may never manufacture `delivered`, `reviewed`, `settled`, or callback completion without the governing evidence bundle or resolution gate

State reconciliation for out-of-order events must be idempotent and fence-scoped:

- let `E_f` be the set of accepted `AdapterReceiptCheckpoint` rows and governed manual evidence bound to the current dispatch or attempt fence `f`
- discard any event whose fence epoch or thread version is stale
- derive `transportState`, `deliveryEvidenceState`, and `authoritativeOutcomeState` from `E_f` using an associative, commutative, idempotent join
- if `E_f` contains both success and failure terminal evidence for the same fence without a later authoritative supersession, resolve to `disputed` and freeze quiet-success posture until human or policy resolution lands

## Shared patient-facing rules

Patient views should always show:

- current callback expectation or message status
- what happens next
- safe contact preference update path
- clear failure or fallback messaging
- whether the patient needs to reply now, wait for review, or use a different channel

## Patient conversation surface contract

Callback and clinician messaging should feel like one calm correspondence system rather than separate utilities.

Patient conversation surfaces should:

- group thread summaries by care episode or governing request
- show unread, `reply needed`, `awaiting review`, and `closed` states before the full thread is opened
- keep only one active composer expanded at a time in `clarityMode = essential`
- keep callback expectations, clinician messages, acknowledgements, and repair prompts in one card grammar
- preserve send, delivery, and reply receipts inside the thread rather than relying on transient toast confirmation alone
- show urgent diversion guidance whenever the issue described is not appropriate for asynchronous messaging or callback

Patient callback child views inside this conversation shell must resolve through `PatientCallbackStatusProjection`, `PatientReachabilitySummaryProjection`, and `PatientContactRepairProjection` from [patient-account-and-communications-blueprint.md](/Users/test/Code/V/blueprint/patient-account-and-communications-blueprint.md). Callback status, repair, and thread replies may present different dominant actions, but they must not split into detached patient shells while the cluster remains active.

This contract closes five high-priority patient-surface defects that previously kept the patient conversation surface from behaving like one governed architecture:

1. stable grouping now compiles into one `ConversationThreadProjection` over typed `ConversationSubthreadProjection` rows spanning callback cases, reminder nudges, message threads, and governing request lineage
2. preview states such as unread, reply-needed, and awaiting-review now derive from one authoritative visibility, receipt, and delivery digest
3. the single expanded composer rule is now governed by `PatientComposerLease`, including draft continuity, route-repair blockers, and safe resume after refresh
4. receipts now remain split into local acknowledgement, delivery truth, and authoritative reply or callback settlement
5. urgent diversion guidance is now modeled as a preemptive surface state that can freeze unsafe async composition without losing context

Add the patient conversation contracts:

**PatientConversationCluster**
`clusterId`, `threadId`, `governingRequestRef`, `careEpisodeRef`, `callbackCaseRefs[]`, `messageThreadRefs[]`, `reminderPlanRefs[]`, `typedSubthreadRefs[]`, `communicationEnvelopeRefs[]`, `selectedAnchorRef`, `clusterTupleHash`, `clusterState`, `lastMeaningfulUpdateAt`

`PatientConversationCluster` is the sole grouping identity for the patient conversation surface. Cards may reorder within the cluster, but callback, reminder, and message artifacts tied to the same governing request or care episode may not fragment into separate top-level summaries while the cluster remains active.

Every callback case, more-info cycle, reminder chain, clinician-message exchange, or instruction acknowledgement that can change patient actionability must also surface through one current `ConversationSubthreadProjection`; `ConversationThreadProjection` is the sole ordered projection of those typed subthreads for the active cluster.

**PatientConversationPreviewDigest**
`digestId`, `clusterRef`, `threadId`, `typedSubthreadRefs[]`, `latestCommunicationEnvelopeRef`, `latestReminderPlanRef`, `patientShellConsistencyRef`, `visibilityProjectionRef`, `visibilityTier`, `releaseState`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `channelReleaseFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `embeddedSessionRef`, `latestReceiptEnvelopeRef`, `latestSettlementRef`, `latestSupportActionSettlementRef`, `latestCallbackStatusRef`, `reachabilityDependencyRef`, `reachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`, `unreadCount`, `replyNeededState`, `awaitingReviewState`, `deliveryDisputeState`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`, `repairRequiredState`, `stateConfidenceBand = high | medium | low`, `dominantNextActionRef`, `transitionEnvelopeRef`, `placeholderContractRef`, `recoveryRouteRef`, `experienceContinuityEvidenceRef`, `receiptGrammarVersionRef`, `threadTupleHash`, `monotoneRevision`, `computedAt`

`PatientConversationPreviewDigest` is the only source for list-state badges, summary copy, and closed or awaiting-review posture. If content is partially visible, delayed, or step-up-gated, the digest must render a governed placeholder rather than leaking message text or hiding the item entirely.

`PatientConversationPreviewDigest` must also point at the current `ExperienceContinuityControlEvidence` for `conversation_settlement`. A preview digest may not appear calmer or more settled than the latest continuity evidence allows.

**PatientComposerLease**
`leaseId`, `clusterRef`, `composerScope = reply | acknowledgement | availability_update`, `routeIntentBindingRef`, `lineageFenceEpoch`, `draftRef`, `reachabilityDependencyRef`, `reachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairRef`, `contactRepairJourneyRef`, `consentCheckpointRef`, `selectedAnchorRef`, `resumeContinuationRef`, `latestSettlementRef`, `visibilityProjectionRef`, `transitionEnvelopeRef`, `experienceContinuityEvidenceRef`, `receiptGrammarVersionRef`, `leaseState = active | blocked | resume_required | released`, `expiresAt`

`PatientComposerLease` governs the one-expanded-composer rule. While a lease is active, the shell may not silently expand a second composer, discard the draft on refresh, or present a live send action when contact repair, consent renewal, or route eligibility blocks safe submission.

**PatientReceiptEnvelope**
`envelopeId`, `clusterRef`, `threadId`, `activeSubthreadRef`, `latestCommunicationEnvelopeRef`, `channel`, `payloadRef`, `patientShellConsistencyRef`, `visibilityProjectionRef`, `embeddedSessionRef`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `channelReleaseFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `governingCommandRef`, `latestCallbackStatusRef`, `reachabilityDependencyRef`, `reachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`, `localAckState = none | shown | superseded`, `transportAckState = none | accepted | rejected | timed_out`, `deliveryEvidenceState = pending | delivered | disputed | failed | expired | suppressed`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`, `stateConfidenceBand = high | medium | low`, `placeholderContractRef`, `settlementRef`, `latestSupportActionSettlementRef`, `transitionEnvelopeRef`, `recoveryContinuationRef`, `experienceContinuityEvidenceRef`, `receiptGrammarVersionRef`, `threadTupleHash`, `causalToken`, `monotoneRevision`, `receiptArtifactRefs[]`

`PatientReceiptEnvelope` preserves causal receipts inside the thread. Local acknowledgement, transport acceptance, channel delivery evidence, and authoritative callback or clinician response state must remain distinguishable, so the surface never collapses pending or disputed work into a false final success cue. The linked `experienceContinuityEvidenceRef` is the proof that the visible receipt and settlement posture still matches the governing continuity control in the assurance spine.

**PatientUrgentDiversionState**
`diversionStateId`, `clusterRef`, `currentEvidenceAssimilationRef`, `currentMaterialDeltaAssessmentRef`, `currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `currentUrgentDiversionSettlementRef`, `safetyDecisionEpoch`, `triggerReasonCode`, `severityBand`, `asyncMessagingAllowedState = allowed | blocked`, `composerFreezeState = live | frozen`, `surfaceState = assimilation_pending | review_pending | urgent_required | urgent_issued | manual_review_required`, `diversionGuidanceRef`, `reentryRuleRef`

`PatientUrgentDiversionState` preempts unsafe async interaction. When urgency, contact-safety, or policy triggers make messaging or callback inappropriate, the current cluster stays visible, the active composer freezes in place, and the dominant action becomes the governed diversion or recovery route rather than a stale send button.

Patient conversation rules:

- `PatientConversationCluster`, `PatientConversationPreviewDigest`, `PatientCallbackStatusProjection`, open thread state, and any `DecisionDock` action region must assemble under one `PatientShellConsistencyProjection`; if bundle version, audience tier, or governing-object version diverges, the same shell must freeze mutating controls and fall to bounded refresh or recovery rather than showing contradictory thread or callback posture
- `PatientConversationPreviewDigest` must derive `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, `deliveryRiskState`, `authoritativeOutcomeState`, and `dominantNextActionRef` from the latest `CommunicationEnvelope`, `ConversationSubthreadProjection`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, current `ReachabilityAssessmentRecord`, any active `ContactRouteRepairJourney`, and any active `PatientUrgentDiversionState`, not from unsent draft state or transient delivery callbacks alone
- `PatientUrgentDiversionState` must point at the current `EvidenceAssimilationRecord`, `MaterialDeltaAssessment`, `EvidenceClassificationDecision`, `SafetyDecisionRecord`, and when urgent issuance is still pending the current `UrgentDiversionSettlement`; stale thread-local status may not imply calmer reply posture than the current safety epoch allows
- `PatientComposerLease.latestSettlementRef`, `reachabilityAssessmentRef`, and `experienceContinuityEvidenceRef` must stay attached to the current cluster while a send, acknowledgement, or repair command is pending; review-pending, stale, route-denied, repair-required, or evidence-blocked outcomes keep the same composer anchor visible and drive `leaseState = blocked | resume_required` rather than reopening a fresh live composer
- `PatientReceiptEnvelope.authoritativeOutcomeState` may advance only from `ConversationCommandSettlement`, a fresh `CallbackExpectationEnvelope`, or authoritative thread review state; `localAckState`, `transportAckState`, and `deliveryEvidenceState` may acknowledge progress, but they may never mark a cluster reviewed or settled on their own
- reminder scheduling, reminder delivery failure, and callback fallback must update the same `threadId` through `CommunicationEnvelope`, `ConversationSubthreadProjection(subthreadType = reminder)`, `PatientReceiptEnvelope`, and `PatientConversationPreviewDigest`; reminder chips or appointment banners may summarize that subthread, but they may not invent a detached communication truth source
- support-triggered resend, channel change, attachment recovery, or reissue may widen pending or repair guidance only through the current `PatientReceiptEnvelope`, `PatientConversationPreviewDigest`, and linked `latestSupportActionSettlementRef`; support-local acknowledgement or provisional workbench state may not mark the cluster sent, delivered, reviewed, or settled
- patient-visible `delivered`, callback completion, `reviewed`, and `settled` cues require the current `MessageDeliveryEvidenceBundle`, `CallbackOutcomeEvidenceBundle`, authoritative review outcome for the active fence, and a current `ReachabilityAssessmentRecord` that is not stale or disputed; `deliveryRiskState` may widen pending or repair guidance, but it may not manufacture calm success, and stale or blocked continuity evidence must hold the thread in bounded recovery rather than quiet success
- if support repair is still `awaiting_external` or `stale_recoverable`, the same cluster must keep its selected anchor, latest safe receipt copy, and recovery guidance visible; the preview digest may not become calmer than the linked support settlement, delivery evidence, and continuity evidence justify
- refresh, deep-link return, step-up completion, callback-status drill-in, and contact-route repair must preserve `selectedAnchorRef`, the active `ContactRouteRepairJourney`, and issue or consume `RecoveryContinuationToken` through `resumeContinuationRef` or `recoveryContinuationRef` so the cluster reopens in the same shell and does not strand the patient on a generic messages landing page
- route repair may not reopen live reply or callback controls until `ContactRouteVerificationCheckpoint.rebindState = rebound`, the resulting `ReachabilityAssessmentRecord` is `clear` with `routeAuthorityState = current`, and the linked `ReachabilityDependency`, continuity evidence, and return target still match the current cluster
- if the cluster was entered from a record-origin follow-up, the active `RecordOriginContinuationEnvelope` must remain attached through reply, callback, repair, and return so the thread cannot recover into a calmer state than the originating record still allows
- whenever the conversation surface is running in NHS App embedded mode, live callback or message actions must also validate `PatientEmbeddedSessionProjection`; if subject, session epoch, subject binding, manifest, release tuple, bridge floor, or channel rollout state drifts, the same cluster must degrade through the active `RouteFreezeDisposition` to read-only, placeholder, or safe-browser recovery instead of exposing a stale reply or callback route

### Authoritative conversation digest grammar

The current conversation truth tuple is the active `ConversationThreadProjection`, active `ConversationSubthreadProjection` set, latest `CommunicationEnvelope`, active `PatientCommunicationVisibilityProjection`, latest `PatientReceiptEnvelope`, latest `ConversationCommandSettlement`, latest `PatientCallbackStatusProjection`, any active `NetworkReminderPlan`, active `PatientComposerLease`, and current `PatientExperienceContinuityEvidenceProjection(controlCode = conversation_settlement)` bound to one `clusterRef`, one `threadId`, `selectedAnchorRef`, `reachabilityEpoch`, `receiptGrammarVersionRef`, one `threadTupleHash`, and nondecreasing `monotoneRevision`.

Preview rows, thread mastheads, callback cards, inline receipts, and composer affordances must all read from that tuple or freeze into bounded pending, placeholder, or recovery posture. None of those surfaces may compute calmness, unread clearance, callback reassurance, or reply readiness independently from the others.

If `PatientCommunicationVisibilityProjection` permits only `step_up_required` or `suppressed_recovery_only`, the same cluster must remain visible through `placeholderContractRef` with safe continuation guidance. A valid thread may not disappear from the list just because richer preview text is hidden.

If the tuple drifts across `receiptGrammarVersionRef`, `monotoneRevision`, `reachabilityEpoch`, `threadTupleHash`, `subthreadTupleHash`, or `experienceContinuityEvidenceRef`, the shell must hold `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, `authoritativeOutcomeState`, and `dominantNextActionRef` at the last safe bounded posture, freeze mutating controls, and recover in place instead of replaying stale reassurance.

Local acknowledgement may add a provisional receipt row immediately, but it may not clear unread state, remove `replyNeededState`, or emit quiet-success posture until the current authoritative tuple supports that change.

Rollout and backfill requirements:

- rebuild active `PatientConversationPreviewDigest` rows from the current authoritative receipt and settlement chain before enabling `reviewed` or `settled` list posture
- backfill `threadId`, `typedSubthreadRefs[]`, `communicationEnvelopeRefs[]`, `visibilityProjectionRef`, `latestReceiptEnvelopeRef`, `latestSettlementRef`, `latestCallbackStatusRef`, `experienceContinuityEvidenceRef`, `receiptGrammarVersionRef`, and `threadTupleHash` for live clusters; missing refs must downgrade the shell to placeholder, pending, or recovery posture rather than inferred calmness
- preserve existing `clusterRef`, `selectedAnchorRef`, and draft lineage during the backfill window so reindexing the digest cannot reopen a fresh composer or reroute the patient to the generic message center

Verification must cover:

- local acknowledgement and provider acceptance not clearing unread or reply-needed state
- delivery evidence and callback updates not manufacturing `reviewed` or `settled` posture without authoritative settlement and current continuity evidence
- reminder delivery failure or callback fallback not opening a detached appointment or callback flow when the same cluster and thread remain current
- governed placeholder rendering when visibility is limited, without hiding the cluster
- list row, thread masthead, callback card, reminder notice, and composer lease alignment on the same `threadId`, `threadTupleHash`, `receiptGrammarVersionRef`, and `monotoneRevision`
- step-up, stale-link, contact-repair, and recovery re-entry reopening the same cluster anchor and draft

## Shared staff-facing rules

Staff views should include:

- callback worklist
- message worklist
- attempt controls
- reply review controls
- closure and reopen controls
- escalation controls

Callback and message worklists must open inside the same canonical staff shell. Queue rows, task detail, callback attempt controls, reply review, and closure actions must assemble beneath one `StaffWorkspaceConsistencyProjection` and one `WorkspaceSliceTrustProjection`; degraded delivery, dependency, or communications slices may not flatten into healthy queue state.

Shared staff rules:

- every mutating callback or message action, including claim, schedule, dial, send, repair, escalate, reopen, and close, must hold a live `ReviewActionLease`; stale queue rank, thread version, callback case version, or lineage fence drift must fail closed before mutation
- while a user is composing a message, confirming a callback outcome, comparing thread deltas, or reviewing a disputed delivery, create `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` and buffer disruptive deltas through `DeferredUIDelta` or `QueueChangeBatch` until the protected action settles; the current thread draft, compare target, and selected anchor may freeze or invalidate in place, but they may not be silently replaced
- `WorkspaceSliceTrustProjection` must expose degraded or quarantined delivery, reachability, callback, and messaging slices explicitly with bounded fallback mode; it may not collapse them into quiet healthy chrome
- callback or thread settlement may advance local staff reassurance only from authoritative settlement and refreshed domain truth, not from local acknowledgement or transport callbacks alone

## Shared command routing and reachability repair

<!-- Architectural correction: callback and message interactions are first-class domain mutations. They do not fall back to generic triage unless new evidence or reachability risk makes that necessary. -->

**ConversationCommandSettlement**
`conversationSettlementId`, `actionRecordRef`, `clusterRef`, `threadId`, `subthreadRef`, `latestCommunicationEnvelopeRef`, `routeIntentBindingRef`, `commandSettlementRef`, `actionScope`, `governingObjectRef`, `identityRepairBranchDispositionRef`, `latestReceiptEnvelopeRef`, `latestCallbackStatusRef`, `visibilityProjectionRef`, `reachabilityDependencyRef`, `reachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`, `verificationCheckpointRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `result = accepted_in_place | review_pending | awaiting_external | repair_required | stale_recoverable | blocked_policy | denied_scope | expired`, `localAckState = none | shown | superseded`, `transportState = local_only | provider_accepted | provider_rejected | timed_out`, `externalObservationState = unobserved | delivered | answered | failed | disputed | expired`, `authoritativeOutcomeState = awaiting_external | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required`, `stateConfidenceBand = high | medium | low`, `sameShellRecoveryRef`, `projectionVersionRef`, `experienceContinuityEvidenceRef`, `receiptGrammarVersionRef`, `threadTupleHash`, `causalToken`, `recoveryRouteRef`, `monotoneRevision`, `recordedAt`

`ConversationCommandSettlement` is a loop-specific view over the canonical mutation chain. Every mutating callback or message interaction must first resolve one live `RouteIntentBinding`, write one immutable `CommandActionRecord`, and return one authoritative `CommandSettlementRecord`; patient and staff shells may render `ConversationCommandSettlement`, but they may not substitute local acknowledgement, transport success, or missing-evidence optimism for the underlying settlement record. `result`, `transportState`, `externalObservationState`, and `authoritativeOutcomeState` are intentionally separate so partial delivery truth and authoritative clinical review cannot be collapsed into one misleading success badge. `transportState` is the communication-loop presentation of canonical processing acceptance, not final business settlement. Each settlement must also emit the linked `experienceContinuityEvidenceRef` so review, repair, and settled posture can be proven in the assurance spine.

Use this shared algorithm:

1. patient enters through the authenticated shell or the correct transaction-action grant
2. `ScopedMutationGate` resolves one `actionScope`, refreshes the active `RouteIntentBinding`, validates the current `CompiledPolicyBundle`, any required `ReleaseApprovalFreeze`, any active `ChannelReleaseFreezeRecord`, any required `AssuranceSliceTrustRecord` rows, and any active `IdentityRepairBranchDisposition`, and binds exactly one governing object: `CallbackCase` or `ClinicianMessageThread` plus the current fence epoch; if wrong-patient repair is still `pending_freeze | quarantined | compensation_pending`, return `repair_required` and same-shell identity-hold or manual-follow-up recovery instead of live reply or callback mutation
3. write one canonical `CommandActionRecord` before routine mutation; duplicate taps or retried channel posts that resolve to the same idempotency envelope must return the existing `ConversationCommandSettlement`
3A. if the actor is support and the action is resend, reissue, channel change, or attachment recovery, first load the current `MessageDispatchEnvelope`, `MessageDeliveryEvidenceBundle`, `ThreadExpectationEnvelope`, and `ThreadResolutionGate`; if the same repair scope already has live `awaiting_external` truth, return the existing `ConversationCommandSettlement`, `SupportMutationAttempt`, and same-shell provisional posture instead of issuing a second external side effect
4. if the payload is a pure availability update, acknowledgement, or contact-route repair, keep ownership in that domain, refresh the patient-visible expectation state through the active `ContactRouteRepairJourney`, and return `ConversationCommandSettlement.result = accepted_in_place`
5. if the payload is `potentially_clinical` or `contact_safety_relevant`, first settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment`; when re-safety is required, freeze a new immutable `EvidenceSnapshot` from one fresh `EvidenceCaptureBundle`, append `EvidenceClassificationDecision`, create `SafetyPreemptionRecord`, append `SafetyDecisionRecord`, block stale completion messaging, return `ConversationCommandSettlement.result = review_pending`, and reacquire triage or urgent handling according to policy
6. if a live callback or message dependency suffers delivery failure, stale-route drift, verification drift, or preference drift, append the governing `ReachabilityObservation`, settle a new `ReachabilityAssessmentRecord`, create or refresh the current `ContactRouteRepairJourney`, rotate superseded grants, issue only the minimal `contact_route_repair` entry, and show a repair state rather than pretending the original promise is still live
6A. a fresh `MessageDispatchEnvelope(repairIntent = controlled_resend | channel_change | attachment_recovery)` may be minted only after the current `ThreadResolutionGate` authorizes `repair_route | reopen` or the current `MessageDeliveryEvidenceBundle` settled `failed | expired | disputed`; otherwise the system must reuse the existing dispatch envelope and hold the shell in provisional or repair posture
6B. if wrong-patient repair is active on the lineage, freeze callback promises, reply timing, thread delivery reassurance, and response affordances behind the active `IdentityRepairBranchDisposition`; the shell may preserve anchor and summary context, but it may not show live callback or message controls until the branch is `released`
7. persist one authoritative `CommandSettlementRecord` for accepted-in-place, review-pending, awaiting-external, repair-required, stale, blocked, denied, or expired outcomes, and derive `ConversationCommandSettlement` plus the visible `TransitionEnvelope` from that record rather than from local toasts or projection drift; if the current safety epoch advanced or urgent issuance is still pending, the resulting shell must stay under `PatientUrgentDiversionState` or same-shell review posture instead of calm completion
8. every settlement that requires re-auth, step-up, route repair, or stale-cluster recovery must issue a `RecoveryContinuationToken` bound back to the current `PatientConversationCluster`, selected anchor, and current `ContactRouteRepairJourney` before the patient leaves the thread
9. when the cluster originated from a record follow-up, that recovery token must stay linked to the same `RecordOriginContinuationEnvelope`; stale record release, visibility, or anchor drift may not reopen a live reply or callback path on thread truth alone
10. only after the domain object is closed and `LifecycleCoordinator` confirms no remaining lease or pending preemption may the parent request close
