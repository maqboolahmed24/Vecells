# Phase 3 - The Human Checkpoint

**Working scope**  
Clinical workspace V1 and human triage engine.

## Control priorities

The Phase 3 workspace mutation and settlement control layer requires five corrections:

1. live queue and task routes must bind to one published `AudienceSurfaceRuntimeBinding`, so stale or withdrawn route publication, parity drift, or provenance drift cannot still imply writable triage posture
2. active review must bind to `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, `WorkspaceTrustEnvelope`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, and `ProtectedCompositionState`, which left stale queue or task context under-governed
3. local `TaskCommandSettlement` receipts were not explicitly chained to `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `TransitionEnvelope`, and `ReleaseRecoveryDisposition`
4. direct-resolution, approval, escalation, and handoff confirmations were missing governed `ArtifactPresentationContract` and `OutboundNavigationGrant` rules
5. UI transitions in the clinical workspace must include canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` requirements

## 3A. Triage contract and workspace state model

This sub-phase creates the hard runtime model for staff review.

The triage contract requires five corrections:

1. task ownership now carries explicit lease, heartbeat, and stale-owner fencing control
2. `MoreInfoCycle` and `ApprovalCheckpoint` now hold their own lifecycle leases instead of borrowing triage-task ownership
3. live evidence or projection deltas now invalidate review through orthogonal freshness state instead of mutating task status
4. queue-to-task continuity now has first-class launch-context and selected-anchor contracts
5. all mutating workspace commands now require a governed command envelope with idempotency, fence, and command-following semantics

### Backend work

Add a dedicated triage-workflow kernel to the domain model. The existing `Request` remains the centre of truth, but Phase 3 needs new operational objects around it.

Create these objects:

**TriageTask**  
`taskId`, `requestId`, `queueKey`, `assignedTo`, `status`, `priorityBand`, `dueAt`, `slaTargetAt`, `queueEnteredAt`, `lastMaterialReturnAt`, `expectedHandleMinutes`, `urgencyCarry`, `lockState`, `lockExpiresAt`, `reviewVersion`, `latestEvidenceSnapshotRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `workspaceSafetyInterruptProjectionRef`, `duplicateClusterRef`, `duplicateResolutionDecisionRef`, `duplicateReviewSnapshotRef`, `currentEndpointDecisionRef`, `currentDecisionEpochRef`, `latestDecisionSupersessionRef`, `approvalState`, `endpointState`, `lifecycleLeaseRef`, `leaseAuthorityRef`, `leaseTtlSeconds`, `lastHeartbeatAt`, `fencingToken`, `ownershipEpoch`, `staleOwnerRecoveryRef`, `ownershipState`, `reviewFreshnessState`, `activeReviewSessionRef`, `activeQueueChangeBatchRef`, `launchContextRef`, `workspaceTrustEnvelopeRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `routeFreezeDispositionRef`, `releaseRecoveryDispositionRef`, `taskCompletionSettlementEnvelopeRef`, `changedSinceSeenAt`, `createdAt`, `updatedAt`

**ReviewSession**  
`reviewSessionId`, `taskId`, `openedBy`, `openedAt`, `lastActivityAt`, `sessionState`, `workspaceSnapshotVersion`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `bufferState`, `bufferedDeltaBatchRef`, `lineageFenceEpoch`, `decisionEpochRef`, `commandFollowingTokenRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `workspaceTrustEnvelopeRef`, `requestLifecycleLeaseRef`, `reviewActionLeaseRef`, `ownershipEpochRef`, `workspaceFocusProtectionLeaseRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`

**ReviewBundle**  
A read model, not a write model. It aggregates request summary, structured answers, phone transcript summary, attachments, safety events, contact preferences, identity confidence, and prior patient responses into one staff-ready projection pinned to one `EvidenceSnapshot`, its authoritative derivation packages, and one `EvidenceSummaryParityRecord`.

**MoreInfoCycle**  
`cycleId`, `taskId`, `questionSetVersion`, `channel`, `sentAt`, `dueAt`, `lateReplyReviewUntilAt`, `state = draft | awaiting_delivery | awaiting_patient_reply | awaiting_late_review | response_received | review_resumed | expired | superseded | cancelled`, `replyWindowPolicyRef`, `replyWindowCheckpointRef`, `reminderScheduleRef`, `latestReminderAttemptRef`, `latestResponseDispositionRef`, `responseSnapshotRef`, `supersedesCycleRef`, `supersededByCycleRef`, `responseRouteIntentBindingRef`, `requestReturnBundleRef`, `reachabilityDependencyRef`, `reminderCount`, `lifecycleLeaseRef`, `leaseAuthorityRef`, `leaseTtlSeconds`, `lastHeartbeatAt`, `fencingToken`, `ownershipEpoch`, `staleOwnerRecoveryRef`

**MoreInfoReplyWindowCheckpoint**
`checkpointId`, `cycleRef`, `policyVersionRef`, `lineageFenceEpoch`, `windowOpenedAt`, `dueAt`, `lateReplyReviewUntilAt`, `nextReminderDueAt`, `reachabilityDependencyRef`, `reachabilityEpochRef`, `supersededByCycleRef`, `currentAuthoritativeAt`, `replyWindowState = open | reminder_due | late_review | expired | superseded | settled | blocked_repair`, `dominantReasonRef`, `computedAt`

`MoreInfoReplyWindowCheckpoint` is the single authority for more-info TTL, due-state wording, reminder eligibility, late-reply grace, and same-shell expiry recovery. Patient copy, staff badges, reminder workers, and secure-link entry may cache or soften that truth, but they may not compute a separate actionable window from client time, link TTL, or queue-local timers.

**MoreInfoReminderSchedule**
`reminderScheduleId`, `cycleRef`, `replyWindowCheckpointRef`, `channelPlanRef`, `quietHoursPolicyRef`, `plannedReminderAts[]`, `nextReminderDueAt`, `lastReminderSentAt`, `suppressionReasonRef`, `scheduleState = scheduled | suppressed | exhausted | completed | cancelled`, `updatedAt`

`MoreInfoReminderSchedule` is the only reminder ledger allowed for a cycle. It must derive every reminder send, suppression, quiet-hours delay, callback fallback, and exhaustion decision from the current checkpoint and reachability posture rather than from transport-local retry state.

**MoreInfoResponseDisposition**
`responseDispositionId`, `cycleRef`, `responseCaptureBundleRef`, `replyWindowCheckpointRef`, `idempotencyRecordRef`, `receivedAt`, `disposition = accepted_in_window | accepted_late_review | superseded_duplicate | expired_rejected | blocked_repair`, `resultingSnapshotRef`, `resultingEvidenceAssimilationRef`, `resultingSafetyDecisionRef`, `resultingTaskState = awaiting_re_safety | review_resumed | escalated | recovery_only`, `supersedingCycleRef`, `recoveryRouteRef`, `decidedAt`

`MoreInfoResponseDisposition` is the canonical answer to why a reply was accepted, routed to late review, marked superseded, rejected as expired, or held for repair. Neither the patient shell nor the staff workspace may infer those outcomes from send time, route timing, or whether a draft happened to submit before a local countdown expired.

**EndpointDecision**  
`decisionId`, `taskId`, `decisionEpochRef`, `chosenEndpoint`, `decisionVersion`, `payloadHash`, `reasoningText`, `requiredApprovalMode`, `downstreamPayloadRef`, `previewArtifactRef`, `decisionState = drafting | preview_ready | awaiting_approval | submitted | superseded | abandoned`, `supersedesDecisionRef`, `supersededByDecisionRef`, `createdAt`, `supersededAt`

**DecisionEpoch**
`decisionEpochId`, `taskId`, `reviewSessionRef`, `reviewVersionRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `governingSnapshotRef`, `compiledPolicyBundleRef`, `lineageFenceEpoch`, `ownershipEpochRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `workspaceSliceTrustProjectionRef`, `continuityEvidenceRef`, `epochState = live | superseded | committed | blocked`, `currentEndpointDecisionRef`, `openedAt`, `supersededAt`, `committedAt`

`DecisionEpoch` is the only writable fence for endpoint choice, payload preview, approval, escalation, and downstream launch. A live epoch binds one review version, one selected anchor, one evidence basis, one policy tuple, one lineage fence, one ownership epoch, and one publication tuple. If any of those inputs drift materially, the epoch must stop authorizing new consequence-bearing actions.

**DecisionSupersessionRecord**
`decisionSupersessionRecordId`, `taskId`, `supersededDecisionEpochRef`, `replacementDecisionEpochRef`, `supersededDecisionRef`, `replacementDecisionRef`, `reasonClass = evidence_delta | safety_delta | duplicate_resolution | approval_invalidation | policy_drift | publication_drift | trust_downgrade | identity_drift | ownership_drift | reopen | manual_replace`, `reasonRefs[]`, `triggeringArtifactRefs[]`, `recordedAt`

`DecisionSupersessionRecord` is the replayable audit answer for why a once-live endpoint path stopped being actionable. Queue badges, stale chips, approval invalidation, direct-resolution recovery, and downstream handoff repair must all point back to this record instead of improvising local stale reasons.

**ApprovalCheckpoint**  
`checkpointId`, `taskId`, `decisionEpochRef`, `actionType`, `state`, `requestedBy`, `requestedAt`, `approvedBy`, `approvedAt`, `rejectionReason`, `supersedesCheckpointRef`, `supersededByCheckpointRef`, `lifecycleLeaseRef`, `leaseAuthorityRef`, `leaseTtlSeconds`, `lastHeartbeatAt`, `fencingToken`, `ownershipEpoch`, `staleOwnerRecoveryRef`

Reuse the canonical `DuplicateCluster` from Phase 0. Phase 3 triage queues may reference it through `TriageTask.duplicateClusterRef`, but they must not redefine a narrower triage-local duplicate schema that drops episode, evidence, relation, review, or threshold fields from the platform contract.

**DuplicateReviewSnapshot**
`duplicateReviewSnapshotId`, `taskId`, `duplicateClusterRef`, `candidateRequestRefs[]`, `pairEvidenceRefs[]`, `winningPairEvidenceRef`, `competingPairEvidenceRefs[]`, `currentResolutionDecisionRef`, `continuityWitnessSummaryRef`, `instabilityState = stable | oscillating | blocked_conflict`, `lastRenderedAt`

`DuplicateReviewSnapshot` is the review-safe read model for duplicate work. It must summarize why the platform suspects retry, same-request continuation, same-episode linkage, or separation, and it must point to the current `DuplicateResolutionDecision` rather than asking reviewers to infer the winning relation from raw scores or timeline coincidence.

**WorkspaceSafetyInterruptProjection**
`workspaceSafetyInterruptProjectionId`, `taskId`, `requestId`, `currentEvidenceAssimilationRef`, `currentMaterialDeltaAssessmentRef`, `currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `currentUrgentDiversionSettlementRef`, `safetyDecisionEpoch`, `surfaceState = assimilation_pending | review_pending | urgent_required | urgent_issued | residual_review | manual_review_required`, `suppressedActionScopeRefs[]`, `dominantSafetyActionRef`, `conflictVectorRef`, `lastRenderedAt`

`WorkspaceSafetyInterruptProjection` is the review-safe shell contract for late evidence and urgent interruption. It must tell the reviewer whether the lineage is waiting on evidence assimilation, re-safety, urgent issuance, residual-review re-entry, or manual fallback, and it must freeze the unsafe action scopes without hiding the current task anchor.

Introduce one canonical `TriageReopenRecord` in this phase and reuse it across urgent-escalation and direct-resolution sections. Do not fork a second reopen contract later in the blueprint.

**TaskCommandSettlement**
`settlementId`, `taskId`, `actionScope`, `governingObjectRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeIntentTupleHash`, `idempotencyRecordRef`, `routeIntentBindingRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `audienceSurfaceRuntimeBindingRef`, `transitionEnvelopeRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `presentationArtifactRef`, `result = applied | projection_pending | stale_recoverable | denied_scope | review_required`, `localAckState = none | shown | superseded`, `processingAcceptanceState = not_started | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`, `externalObservationState = unobserved | projection_visible | external_effect_observed | review_disposition_observed | recovery_observed | disputed | failed | expired`, `authoritativeOutcomeState = pending | projection_pending | review_required | stale_recoverable | recovery_required | settled | failed | expired | superseded`, `settlementRevision`, `receiptTextRef`, `causalToken`, `recoveryRouteRef`, `recordedAt`

`TaskCommandSettlement` is a workspace-local projection over the canonical mutation chain. It may adapt presentation, receipt text, or same-shell recovery, but its `result` must remain semantically aligned to authoritative `CommandSettlementRecord` truth and may not invent optimistic acceptance states outside the canonical settlement vocabulary. `localAckState`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState` are intentionally separate so staff receipts can acknowledge click feedback, accepted-for-processing state, projection visibility, and final outcome without collapsing them into one misleading success badge.

**TaskLaunchContext**
`launchContextId`, `taskId`, `sourceQueueKey`, `sourceSavedViewRef`, `sourceRowIndex`, `sourceQueueRankSnapshotRef`, `returnAnchorRef`, `returnAnchorTupleHash`, `nextTaskCandidateRefs`, `nextTaskRankSnapshotRef`, `previewSnapshotRef`, `previewDigestRef`, `prefetchWindowRef`, `prefetchCandidateRefs`, `prefetchRankSnapshotRef`, `selectedAnchorRef`, `selectedAnchorTupleHash`, `changedSinceSeenAt`, `nextTaskBlockingReasonRefs[]`, `nextTaskLaunchState = blocked | gated | ready | launched`, `departingTaskReturnStubState = none | pinned | released`, `createdAt`, `updatedAt`

**TriageOutcomePresentationArtifact**
`presentationArtifactId`, `taskId`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = summary_only | interactive_same_shell | external_handoff_ready | recovery_only`, `createdAt`

Orthogonal control facts must be explicit and must not be smuggled into `TriageTask.status`:

- `ownershipState = active | releasing | expired | broken`
- `reviewFreshnessState = fresh | queued_updates | review_required`
- `ReviewSession.bufferState = none | queued_updates | review_required`

Rules:

- `review_required` is a freshness and decision-validity fact, not a queue or workflow status
- duplicate review must render from `DuplicateReviewSnapshot`, immutable `DuplicatePairEvidence`, and current `DuplicateResolutionDecision`; queue rows or timeline proximity alone may not imply attach or merge truth
- safety interruption must render from `WorkspaceSafetyInterruptProjection`, current `EvidenceClassificationDecision`, and current `SafetyDecisionRecord`; stale queue badges or old task status may not imply calm routine posture
- more-info TTL, reminder cadence, late-reply grace, and expiry posture must render from `MoreInfoReplyWindowCheckpoint`; `MoreInfoCycle.dueAt` is a denormalized display field over that checkpoint, not an independently editable timer
- a request lineage may have at most one `MoreInfoCycle` whose checkpoint is `open | reminder_due | late_review`; issuing a replacement cycle must supersede the old checkpoint, revoke old reply grants, cancel old reminders, and preserve the earlier request as visibly superseded history rather than leaving two actionable patient loops live
- a task may have many historical endpoint drafts, but only one `DecisionEpoch(epochState = live)` may authorize preview, approval, submit, or downstream seed creation at a time
- every direct-resolution artifact, approval checkpoint, escalation commit, booking intent, pharmacy intent, self-care issue, admin-resolution completion, and next-task calm-completion posture must reference the current unsuperseded `DecisionEpoch`; stale drafts, stale previews, and stale approvals are not enough
- lease expiry may not silently bounce a task back to `queued`; it must create governed stale-owner recovery work with audit trail
- `ownershipState = expired | broken` is legal only while a canonical `StaleOwnershipRecoveryRecord` remains open; silent reset to ordinary queue posture is forbidden
- `TaskLaunchContext` is the durable handoff contract between queue, preview, active task, and next-task progression; it is not transient router-only state
- queue preview, background next-task prefetch, open-task launch, and next-task launch must preserve one committed `QueueRankSnapshot` unless an explicit refresh or recovery path is declared
- queue preview, background next-task prefetch, open-task launch, browser-back restore, and next-task launch must preserve the same selected or return anchor tuple hash unless the shell explicitly renders stale or replacement posture
- preview and background prefetch are summary-first read models only; they may not mint `ReviewActionLease`, clear changed-since-seen state, hydrate heavy media, or impersonate explicit task-open
- `nextTaskCandidateRefs`, `prefetchCandidateRefs`, `nextTaskRankSnapshotRef`, `prefetchRankSnapshotRef`, and `nextTaskBlockingReasonRefs[]` must come from the same committed queue snapshot and current completion settlement or explicitly degrade to stale or recovery posture
- every live `/workspace/*` queue, task, approval, escalation, or changed view that can surface writable or queue-moving controls must bind one published `AudienceSurfaceRuntimeBinding`; unpublished, parity-drifted, or provenance-blocked tuples must freeze writable posture
- every active review surface must materialize under one `StaffWorkspaceConsistencyProjection`, one `WorkspaceSliceTrustProjection`, one current `WorkspaceTrustEnvelope`, and one live `ReviewActionLease`; stale queue ownership, drifted review version, trust downgrade, or settlement drift must fail closed inside the same shell
- `WorkspaceTrustEnvelope` is the sole authority for active review writability, interruption pacing, and calm completion; queue rows, task canvas, interruption digest, endpoint shortlist, and next-task CTA may not infer those postures independently from local state
- every mutating task, more-info, approval, escalation, close, and next-task path must present the current `RequestLifecycleLease.ownershipEpoch` plus `fencingToken`; old tabs may preserve drafts and anchors, but they must reopen in bounded reacquire or takeover posture before mutation
- compose, compare, approve, escalate, close, and next-task transitions must hold one `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState`; disruptive deltas must buffer through `QueueChangeBatch`, `reviewFreshnessState`, or governed same-shell recovery, and invalidating drift must freeze the active draft, compare target, and quiet-return posture instead of replacing the active task
- next-task launch is legal only through one explicit `NextTaskLaunchLease` bound to the current `TaskCompletionSettlementEnvelope` and `WorkspaceContinuityEvidenceProjection`; auto-advance after local success is forbidden
- when next-task launch succeeds, preserve the departing task as a short-lived return stub until the new task reaches stable shell posture; stale or blocked launch may not discard the prior anchor

Lock the main task state machine now. Use an executable model rather than placeholder states:

`triage_ready -> queued`  
`queued -> claimed`  
`claimed -> queued | in_review`  
`in_review -> queued | awaiting_patient_info | endpoint_selected | escalated`  
`awaiting_patient_info -> review_resumed`  
`review_resumed -> queued | claimed`  
`endpoint_selected -> resolved_without_appointment | handoff_pending | escalated`  
`escalated -> resolved_without_appointment | handoff_pending | reopened`  
`resolved_without_appointment -> closed`  
`handoff_pending -> closed`  
`closed -> reopened`  
`reopened -> queued`

State semantics:

- `review_resumed` is a durable return-from-patient state written when a valid more-info response has been linked and re-safety has settled back to routine handling, whether clear or residual-only
- `resolved_without_appointment` is written after a direct non-booking outcome has been durably composed but before the final close event
- `handoff_pending` is written after a booking or pharmacy handoff object has been created but before downstream ownership is acknowledged
- `reopened` is written when a previously closed or handed-off case returns from hub, pharmacy, supervisor action, or materially new evidence
- a task may remain in `claimed` or `in_review` while `reviewFreshnessState = queued_updates | review_required`; freshness drift does not invent a parallel workflow state
- any live delta that materially changes safety, identity, duplicate resolution, approval truth, or outbound consequence must set `reviewFreshnessState = review_required` and preserve the current review surface for explicit re-check
- queue reorder or insertion while a task is open must flow through `QueueChangeBatch`; the active task remains pinned to the same selected-anchor tuple and uses `changedSinceSeenAt` rather than silent list churn

Also lock the `Request` synchronisation rules now:

- when a task first leaves `triage_ready` and enters `queued`, acquire the triage-side `RequestLifecycleLease`; `LifecycleCoordinator` derives `Request.workflowState = triage_active` from that milestone
- while a task is in `queued`, `claimed`, `in_review`, `awaiting_patient_info`, `review_resumed`, `escalated`, or `reopened`, keep the triage-side lease active so the request remains `triage_active` under coordinator control
- active `MoreInfoCycle` and `ApprovalCheckpoint` objects must acquire and heartbeat their own `RequestLifecycleLease`; closure remains blocked while any triage-side, more-info, or approval lease is `active`, `releasing`, `expired`, or `broken`, or while any linked `StaleOwnershipRecoveryRecord` remains open
- every lease mutation and every close, reopen, ownership transfer, escalation commit, or approval commit must present the current `ownershipEpoch`, `fencingToken`, and `LineageFence.currentEpoch`; stale owners must fail closed and re-read authoritative state
- `endpoint_selected` is a task-level state; it does not create a separate canonical `Request` substate
- when downstream booking, hub, or pharmacy ownership is acknowledged, emit the handoff milestone and let `LifecycleCoordinator` derive `Request.workflowState = handoff_active`
- when an authoritative direct, booked, or pharmacy-resolved outcome is recorded, emit the outcome milestone and let `LifecycleCoordinator` derive `Request.workflowState = outcome_recorded`
- when no open triage, booking, hub, pharmacy, approval, or exception work remains on the request lineage, ask `LifecycleCoordinator` to evaluate closure and persist `RequestClosureRecord`; only then may `Request.workflowState = closed`

Add the first Phase 3 event catalogue:

- `triage.task.created`
- `triage.task.claimed`
- `triage.task.released`
- `triage.review.started`
- `triage.review.snapshot.refreshed`
- `triage.more_info.requested`
- `triage.more_info.response.linked`
- `triage.task.resumed`
- `triage.endpoint.selected`
- `triage.task.resolved_without_appointment`
- `triage.task.handoff_pending`
- `triage.approval.required`
- `triage.approval.recorded`
- `triage.escalated`
- `triage.review.invalidated`
- `triage.decision.epoch_superseded`
- `triage.queue_change.buffered`
- `triage.queue_change.applied`
- `triage.queue.overload_critical`
- `triage.task.stale_owner.detected`
- `triage.duplicate.clustered`
- `triage.duplicate.review_started`
- `triage.duplicate.resolved`
- `triage.duplicate.decision_superseded`
- `triage.handoff.created`
- `triage.task.reopened`
- `triage.task.closed`

Do not let frontend pages invent their own state meanings. Every badge, tab, and action must come from this state model.

A practical first set of command endpoints is:

- `GET /v1/workspace/queues/{queueKey}`
- `GET /v1/workspace/tasks/{taskId}`
- `POST /v1/workspace/tasks/{taskId}:claim`
- `POST /v1/workspace/tasks/{taskId}:release`
- `POST /v1/workspace/tasks/{taskId}:start-review`
- `POST /v1/workspace/tasks/{taskId}:resume-review`
- `POST /v1/workspace/tasks/{taskId}:request-more-info`
- `POST /v1/workspace/tasks/{taskId}:resolve-duplicate`
- `POST /v1/workspace/tasks/{taskId}:select-endpoint`
- `POST /v1/workspace/tasks/{taskId}:approve`
- `POST /v1/workspace/tasks/{taskId}:escalate`
- `POST /v1/workspace/tasks/{taskId}:reopen`
- `POST /v1/workspace/tasks/{taskId}:close`

All mutating workspace commands must traverse the canonical `ScopedMutationGate` rather than writing directly from the task canvas.

Use this triage-specific command algorithm:

1. resolve the route and user intent to one `RouteIntentBinding` and one `actionScope`: `task_claim`, `task_release`, `start_review`, `resume_review`, `request_more_info`, `resolve_duplicate_cluster`, `select_endpoint`, `approve`, `escalate`, `reopen`, or `close`
2. resolve exactly one governing object descriptor and exactly one governing object: `TriageTask`, `ReviewSession`, `MoreInfoCycle`, or `ApprovalCheckpoint`, together with the current governing-object version or fence for that target
3. validate the active `CompiledPolicyBundle`, published `AudienceSurfaceRuntimeBinding`, route family `/workspace/*`, role scope, `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, lease ownership, current `ownershipEpoch`, current `fencingToken`, `reviewVersion`, exact `routeIntentTupleHash`, any active `WorkspaceFocusProtectionLease`, any active `ProtectedCompositionState`, the current selected anchor tuple hash plus protected compare refs where applicable, any required current live `DecisionEpoch`, `ReviewActionLease`, current `LineageFence.currentEpoch`, and current `Request.safetyDecisionEpoch` before writable state is loaded
4. if the `ReviewBundle` is stale, the task has moved queue, the lease owner changed, the publication state is no longer writable, the trust slice degraded, the fence epoch advanced, a linked `StaleOwnershipRecoveryRecord` is open, the active protection lease is `invalidated | superseded`, the caller is behind the current `safetyDecisionEpoch`, the authoritative task target no longer matches the bound route intent tuple, or the bound `DecisionEpoch` is missing, superseded, blocked, or no longer matches the current selected anchor tuple hash plus review version, return `TaskCommandSettlement.result = stale_recoverable`, bind one `TransitionEnvelope`, preserve the focus-protected draft, compare target, and selected anchor as stale-recoverable context, and route through the declared `ReleaseRecoveryDisposition` inside the same shell instead of mutating from the old view
4A. if the current `RequestLifecycleLease` or `ReviewActionLease` is expired, broken, superseded, or no longer matches the caller's `ownershipEpoch` plus `fencingToken`, create or reuse the canonical stale-owner recovery artifact, freeze mutating posture, and require explicit reacquire or supervised takeover before any claim, more-info, approval, escalation, close, or next-task launch continues
5. if the lineage already has `EvidenceAssimilationRecord.assimilationState = pending_materiality | pending_classification | pending_preemption | blocked_manual_review`, or `SafetyPreemptionRecord.status = pending | blocked_manual_review`, or the latest `SafetyDecisionRecord` or `UrgentDiversionSettlement` is still pending, return `TaskCommandSettlement.result = review_required` and render `WorkspaceSafetyInterruptProjection` instead of allowing stale routine mutation
6. if the payload introduces materially new clinical evidence, contact-safety risk, or reopen rationale that changes safety meaning, first settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment`, then freeze a new immutable `EvidenceSnapshot`, append `EvidenceClassificationDecision`, create `SafetyPreemptionRecord`, append `SafetyDecisionRecord`, and return `TaskCommandSettlement.result = review_required` while the shell morphs to review-pending
7. attach idempotency key, actor reason, correlation ID, fence epoch, semantic payload hash, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeIntentTupleHash`, and the active route or workspace posture refs to the dispatched command, persist one canonical `CommandActionRecord`, require duplicate taps or retried API calls to return the prior `TaskCommandSettlement`, and route reused identifiers with divergent payload, governing object, or route-intent tuple into `ReplayCollisionReview` instead of silently deduping
7A. duplicate resolution commands must consume the current `DuplicateReviewSnapshot`, reference the chosen `DuplicatePairEvidence`, and persist one canonical `DuplicateResolutionDecision`; reviewers may not attach, separate, or retry-collapse from queue-local heuristics or stale task memory
8. only after authoritative `CommandSettlementRecord` creation may the workspace derive `TaskCommandSettlement`, render claim success, more-info sent, approval recorded, endpoint chosen, or closure wording, and advance `TaskCompletionSettlementEnvelope`

Every mutating workspace command must use a governed command envelope. At minimum require:

- `commandId`
- `idempotencyKey`
- `taskId`
- `canonicalObjectDescriptorRef`
- `governingObjectVersionRef`
- `routeIntentTupleHash`
- `reviewVersion`
- `fencingToken`
- `lineageFenceEpoch`
- `commandFollowingToken` when the caller expects settled projection truth before presenting completion
- actor reason code for release, supervisor takeover, escalation, reopen, and close

Rules:

- duplicate claim, release, start-review, approve, escalate, reopen, or close clicks must resolve idempotently
- reused idempotency keys or source-command identifiers with divergent payload, task, or governing object must fail closed into `ReplayCollisionReview`
- commands from expired, superseded, or stale owners must fail without mutating task state
- authoritative conflicts must convert the active review surface to `review_required`; they must not silently settle optimistic UI state
- closure wording, handoff reassurance, and `Next best task` readiness may advance only from `TaskCommandSettlement.authoritativeOutcomeState = settled` plus the governing `TaskCompletionSettlementEnvelope`; `accepted_for_processing`, `projection_visible`, or transport progress alone are never enough
- `TaskCommandSettlement` is a workspace-facing receipt derived from canonical `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, and the declared `TransitionEnvelope`; route-local success state is never authoritative by itself
- every stale, frozen, withdrawn, or trust-downgraded mutation path must declare one `ReleaseRecoveryDisposition` so same-shell read-only, placeholder, or refresh-required behavior is testable before rollout

### Frontend work

Turn the staff shell into a real Clinical Workspace using the full interaction contract in `staff-workspace-interface-architecture.md`.

The initial route family should be:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`

Do not build the full operations console here. Keep this phase focused on the clinician review workflow, but give staff one coherent shell that supports queue scan, rapid claim, active review, interruption handling, and next-task progression without hard resets.

All adjacent task views in this workspace must use the canonical real-time interaction rules from Phase 0 plus the workspace-specific rules in `staff-workspace-interface-architecture.md`: one `PersistentShell`, a preserved `TaskLaunchContext`, a pinned active item, one shared status strip, one `DecisionDock`, one promoted support region at most in routine review, and `QueueChangeBatch` for disruptive queue changes. Opening a task, switching tabs, composing more-info, approving, escalating, or moving to the next task must be soft navigation inside the same shell.

The workspace shell must also make the new control planes visible without turning them into banner noise:

- claim, release, and supervisor takeover must acknowledge through the shared status strip and the active row lock state, not detached toasts
- buffered live queue changes must surface through `QueueChangeBatch` and changed-since-seen markers while preserving the active `SelectedAnchor` and its tuple hash
- if new evidence or authoritative projection truth invalidates the current review, keep the current canvas in place, mark it `review_required`, preserve any focus-protected draft, compare target, or selected anchor as stale-recoverable context, and promote only one consequence-focused support region
- reopening the same task from approvals, escalations, or changed-since-seen views must restore `TaskLaunchContext.returnAnchorRef`, `TaskLaunchContext.returnAnchorTupleHash`, queue filters, and the last safe review anchor where policy allows
- next-task progression must come from `TaskLaunchContext.nextTaskCandidateRefs` rather than a fresh unrelated queue reset

The route skeleton should already support:

- queue browsing and preview-pocket scanning
- task deep-linking with preserved queue context
- read-only open by multiple users
- active review by one owner
- rapid-entry composition for notes, more-info, and endpoint reasoning
- approval inbox
- escalated view
- changed-since-seen resume flow

Every queue, task, approval, escalation, and changed-since-seen route must render under the active `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, current `WorkspaceTrustEnvelope`, and published `AudienceSurfaceRuntimeBinding`. If the runtime tuple, trust tuple, ownership tuple, or settlement tuple is stale, withdrawn, parity-drifted, frozen, or otherwise no longer represented by the active envelope, the shell must stay in place and degrade through the bound `ReleaseRecoveryDisposition`; it may not drop the operator into an unrelated page or leave live triage CTAs armed.

Any task action that can end the current task posture, including release, approve, escalate, close, and next-task launch, must settle one `TaskCompletionSettlementEnvelope` before the shell advances to `TaskLaunchContext.nextTaskCandidateRefs`. The current `SelectedAnchor` and its tuple hash remain pinned until that envelope reaches authoritative completion or governed recovery.

Queue preview and next-task prefetch must stay cancellable and shell-stable. Fast scan, rank-snapshot drift, focus protection, stale continuity evidence, or settlement drift must cancel warmed candidates and keep the current row or task pinned with exact blocking reasons instead of silently opening a different task.

### Tests that must pass before moving on

- state-transition tests for all allowed and forbidden task paths
- optimistic-lock tests on `reviewVersion`
- `ScopedMutationGate` tests for workspace route-family, role-scope, and lease-ownership enforcement
- stale-review and fence-epoch rejection tests for claim, approve, more-info, and close commands
- same-shell settlement tests for pending, stale-recovery, and safety-preempted command paths
- shell-continuity tests across queue -> task -> more-info -> decision -> next-task transitions
- event-schema compatibility tests
- migration tests proving Phase 1 and 2 requests can spawn triage tasks without data loss
- read-model rebuild tests for `ReviewBundle`
- lease-heartbeat, stale-owner fencing, and audited-break tests for triage, more-info, and approval branches
- review-invalidation tests proving authoritative deltas set `reviewFreshnessState = review_required` without overwriting in-progress context
- `TaskLaunchContext` restore tests proving queue filters, return anchor, and next-task candidate continuity survive deep links and reopen flows
- workspace-trust-envelope tests proving queue truth, task truth, trust posture, focus protection, and completion calmness stay locked to one current envelope and fail closed on drift
- command-envelope idempotency tests for claim, release, start-review, approve, escalate, reopen, and close
- replay-collision tests proving reused identifiers with divergent workspace payload cannot silently reuse a prior settlement
- queue-change buffering tests proving active review stays pinned while reordered work lands through `QueueChangeBatch`
- safety-classification tests proving degraded patient replies fail closed into `WorkspaceSafetyInterruptProjection` instead of resuming routine review
- safety-epoch fence tests proving stale task tabs cannot close, hand off, or reassure after late safety evidence advances the lineage epoch
- preview and next-task-prefetch cancellation tests proving fast scan, queued reorder, and focus protection cannot hydrate stale launch state
- no-auto-advance tests proving local completion, provisional settlement, or prefetched readiness cannot open the next task without explicit operator launch
- next-task blocking-reason tests proving the CTA stays in one stable location with exact settlement, snapshot, and continuity blockers
- departing-task return-stub tests proving the previous task remains recoverable until the launched task reaches stable shell posture
- urgent-required-versus-urgent-issued tests proving escalated work cannot appear durably diverted before one `UrgentDiversionSettlement`
- duplicate-review snapshot tests proving reviewers see winning and competing candidates, continuity witness, and instability state from canonical evidence rather than raw row proximity
- duplicate-resolution supersession tests proving corrected attach or separate outcomes append a new `DuplicateResolutionDecision` and invalidate stale downstream assumptions without rewriting prior audit

### Exit state

The platform now has a real triage-workflow contract with lease safety, review invalidation, continuity-preserving navigation, and command-discipline controls instead of an informal idea of queue plus details.

---

## 3B. Deterministic queue engine, assignment, and fairness controls

This sub-phase makes the queue behave like a system, not a list.

### Backend work

Build a queue-ranking engine that is deterministic, explainable, and versioned. It should take the same inputs every time and return the same order every time for a given queue snapshot.

Materialize canonical queue ordering in four layers: `QueueRankPlan`, `QueueRankSnapshot`, `QueueRankEntry`, and downstream `QueueAssignmentSuggestionSnapshot`. Queue rows, preview pockets, next-task candidates, supervisor explanations, and operations queue-pressure boards may not recompute order ad hoc from partially fresh task facts.

Do not implement the queue as one unconstrained weighted sum. That is mathematically fragile: a large age term can swamp a clinically urgent case, and a raw deadline gap ignores heterogeneous handling times. Use lexicographic precedence for safety-critical separations, then a normalized within-tier score, then a deterministic fair merge.

For task `i` at ranking instant `t_rank = QueueRankSnapshot.asOfAt`, define:

- `age_i = workingMinutesBetween(queueEnteredAt_i, t_rank)`
- `returnAge_i = 0` when `lastMaterialReturnAt_i` is null, otherwise `workingMinutesBetween(lastMaterialReturnAt_i, t_rank)`
- `expectedService_i = max(s_min, expectedHandleMinutes_i)`
- `d_sla_i = workingMinutesBetween(t_rank, slaTargetAt_i)`, positive before target, `0` at target, and negative when overdue
- `laxity_i = d_sla_i - expectedService_i`
- `slaClass_i = 3` when `laxity_i <= 0`, `2` when `0 < laxity_i <= theta_sla_critical`, `1` when `theta_sla_critical < laxity_i <= theta_sla_warn`, and `0` otherwise
- `slaWarn_i = 1 / (1 + exp((laxity_i - theta_sla_warn) / tau_sla))`
- `slaLate_i = min(1, log(1 + max(0, -laxity_i) / tau_late) / log(1 + H_late / tau_late))`
- `slaPressure_i = beta_warn * slaWarn_i + beta_late * slaLate_i`, with `beta_warn + beta_late = 1`
- `priority_i` as the ordinal clinical priority band from intake and triage rules
- `residual_i in [0,1]` as the latest canonical `p_R` from Phase 0 after monotone calibration and thresholding
- `residualBand_i` as the policy-banded form of `residual_i`
- `contactRisk_i in [0,1]` as the latest canonical `kappa_R` from active reachability dependencies, computed from the current `ReachabilityAssessmentRecord` rows rather than from local callback or delivery heuristics
- `contactRiskBand_i` as the policy-banded form of `contactRisk_i`
- `assimilationPending_i in {0,1}` when an `EvidenceAssimilationRecord` for the lineage is still `pending_materiality | pending_classification | pending_preemption | blocked_manual_review`
- `preemptionPending_i in {0,1}` when a `SafetyPreemptionRecord` is still open; such tasks are not eligible for the routine queue until settlement lands
- `escalated_i in {0,1}`
- `returned_i in {0,1}` when the task has come back from patient more-info and is unread by staff
- `evidenceDeltaSeverity_i in [0,1]` from the governed diff classifier for newly returned evidence
- `returnLift_i = 0` when `returned_i = 0`, otherwise `min(1, r_base + r_delta * evidenceDeltaSeverity_i + r_wait * min(1, log(1 + returnAge_i / tau_return) / log(1 + H_return / tau_return)))`
- `urgencyCarry_i in [0,1]`, a persisted urgency floor raised by safety preemption, urgent bounce-back, hub return, or materially changed patient evidence and cleared only by authoritative settlement
- `vulnerability_i in [0,1]` when configured
- `coverageFit_i in [0,1]` for queue-level capability fit derived from the lane or competency envelope rather than reviewer-specific availability
- `routingGap_i = 1 - coverageFit_i`
- `duplicateReview_i in {0,1}` when open duplicate-cluster ambiguity blocks safe closure or duplicate resolution
- `ageLift_i = min(1, log(1 + age_i / tau_age) / log(1 + A_cap / tau_age))`
- `canonicalTieBreakKey_i = H(queueKey || queueEnteredAt_i || taskId_i)`

Before scoring, build one governed fact cut:

- read queue membership, safety holds, duplicate-review flags, current reachability-assessment posture, trust slices, service-time priors, and current policy from one `sourceFactCutRef`
- if any required queue, task, or dependency slice is stale or quarantined for a task, mark `eligibilityState = held_trust` and surface recovery or supervisor diagnostics instead of quietly ranking it into the writable routine queue
- persist `QueueRankSnapshot(queueRef, queueRankPlanRef, asOfAt = t_rank, sourceFactCutRef, overloadState, rowOrderHash)` before any queue rows or next-task candidates are published

Estimate `expectedHandleMinutes_i` from the trailing governed service-time prior for the task archetype and queue lane, reviewer-independent, with fallback constant `s_min`; never use zero or reviewer-local stopwatch history.

Compute the canonical within-tier urgency score only on patient-risk and time-pressure dimensions:

`u_i = 1 - exp(-(w_sla * slaPressure_i + w_age * ageLift_i + w_residual * residual_i + w_contact * contactRisk_i + w_return * returnLift_i + w_carry * urgencyCarry_i + w_vulnerability * vulnerability_i))`

with all `w_* >= 0` and persisted in `QueueRankPlan` or equivalent configuration. All thresholds and time constants such as `theta_*`, `tau_*`, `H_*`, `r_*`, and `s_min` must version with that same plan. This keeps `u_i in [0,1)`, makes the score monotone in every risk-bearing component, and introduces diminishing returns so one large noncritical factor cannot explode the within-tier score.

`coverageFit_i` must not increase urgency. Capability fit is a routing and assignment concern, not a patient-risk signal; otherwise easy-to-handle cases are incorrectly promoted above harder but riskier work. Keep `routingGap_i` for supervisor warnings, lane-balancing, and reviewer suggestion logic only.

Routine queue eligibility requires `assimilationPending_i = 0` and `preemptionPending_i = 0`. Pending assimilation or pending preemption cases belong in a dedicated safety-hold or escalation surface, not in the normal queue.

Sort by the stable key:

1. `escalated_i` descending
2. `slaClass_i` descending
3. `priority_i` descending
4. `max(residualBand_i, contactRiskBand_i)` descending
5. `duplicateReview_i` descending
6. `urgencyCarry_i` descending
7. `u_i` descending
8. `queueEnteredAt` ascending
9. `canonicalTieBreakKey_i` ascending

Do not bury the rank explanation. Persist one `QueueRankEntry` per ranked task with the exact normalized factors, weights, `d_sla_i`, `laxity_i`, `expectedService_i`, `duplicateReview_i`, `routingGap_i`, `urgencyCarry_i`, fairness-credit transition, and sort tier used for that ordinal so supervisors can understand why one item is ahead of another and replay the same order after rebuild.

Do not let reviewer-specific skill change the canonical queue order. If the workspace needs reviewer suggestions or controlled auto-claim, compute them only after queue ranking over the top `M` queue-eligible tasks. For reviewer `r`, define `loadHeadroom_r = clamp((cap_r - wip_r) / max(1, cap_r), 0, 1)` and:

`assignScore(i,r) = lambda_skill * skill_{i,r} + lambda_cont * continuity_{i,r} + lambda_load * loadHeadroom_r + lambda_sticky * sameContext_{i,r} - lambda_ctx * contextSwitchCost_{i,r} - lambda_focus * focusPenalty_{i,r}`

where `sameContext_{i,r} in {0,1}` preserves reviewer continuity when it is safe and `focusPenalty_{i,r} in [0,1]` suppresses suggestions to reviewers already holding a protected composing or confirm flow.

For batched suggestion or auto-claim, solve the constrained maximum-weight assignment over ranked tasks and eligible reviewers:

`maximize sum_{i,r} x_{i,r} * assignScore(i,r)` subject to `Σ_r x_{i,r} <= 1`, `Σ_i x_{i,r} <= freeCapacity_r`, and `x_{i,r} = 0` whenever policy, competency, or writable-lease posture makes `(i,r)` illegal.

Use `assignScore(i,r)` only for suggestion chips, supervisor recommendations, or governed auto-claim proposals; it must not rewrite the shared queue ordering. Auto-claim may execute only when the best feasible reviewer beats the next feasible reviewer by at least `epsilon_assign` and remains below the soft WIP cap.

Persist reviewer fit separately as `QueueAssignmentSuggestionSnapshot(rankSnapshotRef = current QueueRankSnapshot)`. Suggestion rows may name the best reviewer or governed auto-claim candidates, but they may not mutate task ordinals, row order, or explanation payloads from the source snapshot.

Implement a fairness floor early, but be mathematically honest about overload. Routine work can be protected only while critical utilization remains below an explicit guardrail. Estimate `rho_crit = lambdaHat_crit * mean(expectedService_i | escalated_i = 1 or slaClass_i = 3) / (m * muHat)`, where `m` is active staffed reviewers and `muHat` is empirical service rate. If `rho_crit >= rho_guard`, emit `triage.queue.overload_critical`, suppress starvation promises, and trigger staffing, diversion, or SLA-rebasing policy.

For non-critical bands use deterministic service-cost-aware deficit round robin:

- `serviceCost(head_b) = max(1, expectedService_head_b / s_quantum_b)`
- `ageDebt_b = min(1, max(0, workingMinutesBetween(queueEnteredAt_head_b, t_rank) - A_b) / H_b)`
- `credit_b <- min(C_max, credit_b + q_b + gamma_age * ageDebt_b)` on each merge cycle
- emit the head item of the eligible band with largest `credit_b / serviceCost(head_b)`, breaking ties by fixed band order
- after emitting from band `b`, set `credit_b <- credit_b - serviceCost(head_b)`

Critical or `slaClass_i = 3` classes bypass the fairness merge only while `rho_crit < rho_guard`.

Build these projections:

- `queue_rank_snapshot_projection`
- `triage_queue_projection`
- `my_tasks_projection`
- `awaiting_patient_projection`
- `escalation_queue_projection`
- `approval_inbox_projection`
- `queue_assignment_suggestion_projection`

Assignment should use a fenced soft-claim lease:

1. user claims task with compare-and-swap on the current writable owner, current `ownershipEpoch`, `QueueRankEntry.rankSnapshotRef`, and queue batch version
2. task becomes editable only after a new monotonic `ownershipEpoch` plus `fencingToken` is minted for that claimant
3. others can still view read-only
4. claim heartbeats renew on `min(leaseTtlSeconds / 3, heartbeatMaxSeconds)` with bounded jitter so workers do not herd on the same boundary, and only the owning session or worker may refresh the current epoch-token pair
5. mutation from a stale owner, stale `ownershipEpoch`, or expired token must fail closed and create stale-owner recovery work; abandoned claims may not silently fall back to ordinary queueing without that audit trail
6. supervisor override may break and reassign only through an audited stale-lease or takeover procedure that appends `LeaseTakeoverRecord` and mints a fresh `ownershipEpoch` plus `fencingToken`

Add duplicate detection here too, but keep retry collapse and attach conservative. Exact resubmits from the same user and same payload can auto-link. Similar-but-not-identical requests should produce a `DuplicateCluster` suggestion with human confirmation required.

### Frontend work

The queue screen is one of the highest-value screens in the product, so make it excellent.

The default queue surface should implement the `QueueWorkbenchProjection` from `staff-workspace-interface-architecture.md`:

- slim left rail for queue tabs, saved views, and queue-health digest
- main workboard for the virtualized queue list
- lightweight preview pocket for focus or hover scan, not a second full detail page

It should feel fast and precise. No oversized cards. No noisy charts. No wasted whitespace that forces more scrolling. The visual language should be dense, crisp, and quiet enough for prolonged triage work.

Build:

- unassigned queue
- my tasks
- escalations
- awaiting patient
- changed-since-seen
- quick filters by request type, priority, age, channel, and assignee
- stable sort controls and rank-explanation snippets
- saved views per role
- keyboard shortcuts for claim, open, preview, and next task

Queue rows should expose only the scan-critical fields: patient or request label, short reason summary, SLA or age, returned or unread state, assignee or lock state, and next action. Full context belongs in the preview pocket or task shell, not the list row.

### Tests that must pass before moving on

- queue-order determinism across repeated recomputation
- queue-snapshot replay tests proving the same `QueueRankPlan` plus the same fact cut yields the same `QueueRankSnapshot.rowOrderHash`
- preemption-exclusion tests proving `preemptionPending_i = 1` work cannot appear in the routine queue
- coverage-fit isolation tests proving capability fit cannot raise clinical urgency ordering
- reviewer-suggestion isolation tests proving `QueueAssignmentSuggestionSnapshot` cannot rewrite canonical task order
- starvation simulations proving fairness floors work while `rho_crit < rho_guard`
- critical-overload detection tests proving `triage.queue.overload_critical` triggers instead of falsely promising starvation freedom
- mixed-snapshot recovery tests proving queue rows, preview, and next-task candidates cannot silently combine different rank snapshots
- concurrent-claim race tests
- lock-expiry and stale-owner fencing tests
- supervisor-takeover tests
- duplicate-cluster suggestion tests
- next-task continuity tests proving `TaskLaunchContext.nextTaskRankSnapshotRef` matches the committed queue snapshot until explicit refresh or recovery
- preview-prefetch budget tests proving background warm paths stay summary-first and do not hydrate heavy media or clear changed-since-seen state
- UI performance tests on large queue lists
- keyboard-only queue navigation tests

### Exit state

The system can now put work in front of the right human, in the right order, without chaos or hidden queue behaviour.

---

## 3C. Review bundle assembler, deterministic summaries, and suggestion seam

This sub-phase makes the request reviewable at speed.

### Backend work

Build a `ReviewBundleAssembler` that creates a staff-ready projection from all the upstream evidence already gathered in Phases 1 and 2.

The bundle should include:

- canonical request summary
- structured answers by request type
- original patient narrative
- safety-screen result and matched rule IDs
- telephony metadata where relevant
- transcript stub if present
- attachment list and previews
- identity and match-confidence summary
- contact preference summary
- timeline of prior messages and responses
- duplicate-cluster status
- latest SLA state

Then add a deterministic summary generator on top of that bundle. This is where you prepare for the AI suggestions concept from the blueprint without letting Phase 8 leak into Phase 3. The clean way to do that is a `SuggestionEnvelope` contract that supports both rule-based and future model-based suggestions, but only the rule-based path is authoritative in this phase. The review screen is framed as triage summary plus suggestions followed by a human choice of endpoint, so that separation should exist from day one.

`ReviewBundleAssembler` must also pin `reviewVersion`, `evidenceSnapshotRef`, `captureBundleRef`, and `evidenceSummaryParityRef` on every assembled bundle. If parity is stale, blocked, or superseded, the workspace may still show lineage, source-artifact access, and bounded provisional copy, but it may not present regenerated summary text as if it were the evidence the reviewer is currently acting on.

A good `SuggestionEnvelope` shape is:

- `sourceType = rules | shadow_model`
- `suggestionVersion`
- `priorityBand`
- `complexityBand`
- `candidateEndpoints`
- `recommendedQuestionSetIds`
- `rationaleBullets`
- `confidenceDescriptor`
- `visibilityState`

In Phase 3, surface only `sourceType = rules` to staff. If you want a shadow-model seam, log it silently for future comparison, but do not let it affect workflow yet.

### Frontend work

This is the heart of the Clinical Workspace and it should feel world-class.

Do not default the active task to a permanent three-column dashboard. Use the adaptive workspace contract from `staff-workspace-interface-architecture.md`:

- `two_plane` by default: workboard on the left, task plane on the right
- promote to `three_plane` only for blocker-heavy evidence review, duplicate compare, urgent escalation, or explicit user pin

The task plane should open with:

- `CasePulse`
- one shared status strip
- clinician-ready summary
- structured facts
- delta-first patient-return view when present
- patient narrative and prior replies
- attachments and audio
- compact lineage strip
- sticky `DecisionDock` with rapid-entry controls

The right-side promoted region should hold consequences and context, not routine reading content. Put `EvidencePrism`, `StateBraid`, approval preview, duplicate compare, and urgent contact stage behind one promoted support region budget so the workspace does not become a wall of parallel panels.

Build a what-changed diff view. If the patient replies after a more-info cycle, the reviewer should immediately see delta information rather than re-reading the whole case from scratch.

The diff view must bind one authoritative `EvidenceDeltaPacket` over the last acknowledged evidence snapshot and the current review snapshot. Contradictions, changed endpoint assumptions, altered approval posture, changed ownership, and duplicate-lineage supersession must remain visible as superseded context until the reviewer rechecks and recommits intentionally.

### Tests that must pass before moving on

- projection correctness tests for `ReviewBundle`
- summary determinism tests
- review-bundle parity tests proving summary copy and diff surfaces stay pinned to the reviewed snapshot after transcript, extraction, or rules upgrades
- stale-bundle invalidation tests after patient update
- authoritative-delta-packet tests proving resumed review, changed-since-seen cues, and promoted support regions all derive from the same delta packet
- superseded-judgment-context tests proving prior endpoint, approval, ownership, or duplicate-lineage assumptions remain visible with markers until recommit
- quiet-return tests proving blocker or compare promotion collapses back to the last quiet posture after delta review resolves
- large-attachment rendering tests
- transcript-present and transcript-absent rendering tests
- visual regression tests for the workspace layout
- accessibility tests for dense staff screens and panel focus order

### Exit state

A staff member can now understand a case quickly enough to make the queue workable in real life.

---

## 3D. More-info loop, patient response threading, and re-safety

This sub-phase creates the loop between staff and patient.

### Backend work

Build `MoreInfoCycle` as a first-class workflow object, not as a loose outbound message. When staff need more detail, they should create a structured request for information that carries its own due date, response channel, reminders, and linkage back to the triage task.

This section is a workflow-specific application of the canonical Phase 0 algorithm. `SafetyOrchestrator` owns classification and preemption for materially new evidence, and `LifecycleCoordinator` remains the only authority for request closure or governed reopen across downstream domains.

Use this algorithm:

1. clinician selects question set or composes freeform request
2. system resolves one current reply-window policy, then creates exactly one `MoreInfoCycle`, one `MoreInfoReplyWindowCheckpoint`, and one `MoreInfoReminderSchedule`; `dueAt`, late-review grace, reminder cadence, and expiry posture are written from authoritative server time once and may later change only through governed checkpoint recompute or explicit supersession
3. if the lineage already has a non-terminal `MoreInfoCycle`, require explicit supersession before a new one is sent; supersession must append `supersedesCycleRef`, mark the older checkpoint `superseded`, cancel the older reminder schedule, revoke older reply grants or secure links, and keep the older cycle visible as superseded history rather than leaving parallel actionable loops
4. secure patient link, authenticated entry, or callback fallback is issued through the governed access model, and the request keeps its active triage lease; any `respond_more_info` grant or secure-link session may expire earlier than the cycle, but it may not extend or redefine the cycle's actionable window
5. triage task moves to `awaiting_patient_info`, and the triage-side lease keeps the canonical `Request` in `workflowState = triage_active` under coordinator control; the `MoreInfoCycle` keeps its own `RequestLifecycleLease` until it settles `review_resumed | expired | superseded | cancelled`
6. reminder orchestration reads only `MoreInfoReminderSchedule`, `MoreInfoReplyWindowCheckpoint`, and the current reachability posture; no reminder may send after checkpoint state becomes `late_review | expired | superseded | settled`, and blocked contact posture must suppress reminder send in favor of contact repair or governed callback fallback in the same lineage
7. patient response enters through the existing portal path and first resolves exactly one current cycle plus its current checkpoint under the current lineage fence and authoritative clock
8. classify the reply by appending one `MoreInfoResponseDisposition` before evidence assimilation:
   * `accepted_in_window` only while `replyWindowState = open | reminder_due`
   * `accepted_late_review` only while `replyWindowState = late_review`, the cycle is still current, and request closure has not settled
   * `blocked_repair` when identity, release, publication, or contact-route repair posture must be recovered before the reply can safely join the live lineage
   * `superseded_duplicate` when the reply targets an older or already superseded cycle, or exactly replays a reply already assimilated
   * `expired_rejected` when the checkpoint is `expired | settled`, the request has already closed, or policy forbids late acceptance
9. only `accepted_in_window` and `accepted_late_review` may continue into one canonical `EvidenceAssimilationRecord` plus one `MaterialDeltaAssessment` against the current composite evidence; `superseded_duplicate`, `expired_rejected`, and `blocked_repair` may preserve receipt and recovery context, but they may not mint a second snapshot, reopen routine queue flow, or silently disappear
10. when the accepted response requires a new snapshot, it becomes one new immutable `EvidenceSnapshot` backed by one frozen `EvidenceCaptureBundle`
11. append one immutable `EvidenceClassificationDecision` for the new evidence; unless it is on the explicit technical allow-list or is a pure control-plane delta, default it to `potentially_clinical`, classify route failures on active reply dependencies as `contact_safety_relevant`, and fail closed when degraded artifact or parser state leaves safety meaning unresolved
12. create `SafetyPreemptionRecord`, derive the changed feature set `Delta_F`, recompute only the impacted rules `adj(Delta_F)` plus all hard-stop and active-dependency rules, rerun the canonical safety engine on the recomputed composite evidence, and append one `SafetyDecisionRecord` before routine flow continues
13. while `EvidenceAssimilationRecord.assimilationState = pending_materiality | pending_classification | pending_preemption | blocked_manual_review`, or while `SafetyPreemptionRecord.status = pending | blocked_manual_review`, or while the current `SafetyDecisionRecord` or `UrgentDiversionSettlement` is still pending, do not close the request, auto-resume the queue, complete downstream handoff as final, or present stale reassurance
14. if re-safety now indicates urgent diversion, duty escalation, urgent contact-risk review, or critical contradiction burden `c_crit >= theta_conf`, settle `SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)`, create the urgent path immediately, set the task to `escalated`, and do **not** return the task to the routine queue until urgent issuance is settled
15. if re-safety is clear or residual-only, settle `SafetyDecisionRecord(requestedSafetyState = screen_clear | residual_risk_flagged)`, mark the preemption cleared, set the task to `review_resumed`, persist `lastMaterialReturnAt = now`, `deltaFeatureRefs`, `impactedRuleRefs`, `conflictVectorRef`, `reSafetyModelVersionRef`, and the resulting `safetyDecisionEpoch`, and emit `triage.task.resumed`
16. the queue engine then performs the legal transition `review_resumed -> queued`, recomputes `returnLift_i`, raises `urgencyCarry_i <- max(urgencyCarry_i, returnLift_i, residual_i)`, refreshes `slaClass_i` and `u_i`, and persists the updated ranking explanation before the task becomes claimable again
17. when a reviewer claims it again, the task follows `queued -> claimed -> in_review`
18. reviewer sees a delta-first resume view with contradiction markers, explicit late-response or supersession disposition where relevant, and recalculated residual risk

This re-safety step matters. Once a patient replies with new symptoms or timing details, you cannot assume the original intake safety result is still enough. Treat the updated evidence snapshot as potentially safety-relevant and re-run the same safety logic before returning it to routine review. If more than `N_reopen_max = 3` re-safety cycles occur within `W_reopen = 24h` without a stable clear or explicit clinician-resolution event, suppress automatic routine requeue and escalate supervisor review instead of letting the case oscillate.

Mandatory invariants:

- exactly one `MoreInfoReplyWindowCheckpoint` may govern patient actionability for a lineage at a time
- `MoreInfoCycle.dueAt`, patient due-date copy, staff due-state chips, reminder jobs, and secure-link recovery must all derive from the same checkpoint revision
- a reminder, reply acceptance, or queue resume decision must compare-and-set the current checkpoint state, cycle supersession state, and lineage fence before committing
- `accepted_late_review` is a deliberate review posture, not an on-time success path; it may not schedule fresh reminders or render ordinary on-time receipt language
- `superseded_duplicate` and `expired_rejected` replies must stay explainable through `MoreInfoResponseDisposition`, but they may not reopen a closed or superseded cycle implicitly
- `LifecycleCoordinator` must treat any cycle whose checkpoint is `open | reminder_due | late_review` or whose latest accepted response is still pending assimilation or safety settlement as a closure blocker

Create `PatientEvidenceSnapshot` with:

- `snapshotId`
- `requestId`
- `evidenceSource`
- `questionSetVersion`
- `responseCaptureBundleRef`
- `normalizedPayloadRef`
- `attachmentRefs`
- `capturedAt`
- `linkedMoreInfoCycleId`
- `derivedFactsPackageRef`
- `authoritativeSummaryParityRef`
- `deltaFeatureRefs`
- `impactedRuleRefs`
- `conflictVectorRef`
- `reSafetyModelVersionRef`
- `reSafetyOutcomeRef`

### Frontend work

The clinician-facing more-info composer should be fast and thoughtful.

Build:

- template-based question sets
- editable freeform follow-up
- channel choice where allowed
- due-date selector
- reminder preview
- thread view of all patient responses
- diff viewer between prior and new evidence
- re-safety signal inside `InterruptionDigest`
- urgent escalation stage when re-safety changes the path immediately

Open the composer as an `InlineSideStage` or bounded `DecisionDock` extension inside the same task shell. Staff must be able to inspect the current evidence while composing without opening a second detached page or losing the active task context.

The patient response flow can reuse the existing patient portal patterns from Phases 1 and 2, but it should open in a lightweight respond-to-request mode with minimal chrome and a strong single-task focus. That route must render from `PatientMoreInfoStatusProjection`, not from local countdown state, email-link expiry alone, or stale request-summary copy. If secure-link or embedded posture drifts while the checkpoint is still `open | late_review`, the patient stays in the same request shell and recovers to the active cycle summary or step-up path; if the checkpoint is `expired | superseded`, the same shell must explain why reply is no longer live and surface the next safe action.

### Rollout and backfill requirements

- backfill every live `MoreInfoCycle` with one canonical `MoreInfoReplyWindowCheckpoint`, one `MoreInfoReminderSchedule`, and one terminal or in-flight `MoreInfoResponseDisposition` derived from authoritative send time, existing due date, reminder ledger, and supersession truth; if derivation is ambiguous, mark the cycle `review_required` and suppress live patient reply until a governed repair settles
- rotate legacy `respond_more_info` links and tokens to `recover_only` on first touch unless they can be bound to the current checkpoint revision; legacy link expiry may no longer stand in for cycle expiry
- cancel or deduplicate any reminder job that is not tied to the current `MoreInfoReminderSchedule`; rollout may not leave orphaned reminders able to fire after supersession or expiry
- any in-flight task that previously cached `awaiting_patient_info` from local timer state must rebuild its due-state summary, queue badges, and patient CTA eligibility from the checkpoint before writable rollout completes
- replay historical replies through the new disposition classifier before enabling quiet-success or late-review automation so expired, superseded, duplicate, and accepted-late paths are all represented explicitly

### Tests that must pass before moving on

- secure response-link expiry and replay tests
- wrong-request response prevention
- question-set versioning tests
- authoritative checkpoint tests proving `dueAt`, late-review grace, reminder cadence, and expiry copy remain identical across backend, patient shell, and staff workspace
- grant-expiry-versus-cycle-expiry tests proving secure-link or session TTL can narrow entry but cannot extend the active reply window
- supersession tests proving a replacement cycle revokes older links, cancels older reminders, and prevents older replies from reopening the queue as live current truth
- response-to-snapshot linkage tests
- late-reply classification tests for `accepted_late_review`, `superseded_duplicate`, `expired_rejected`, and `blocked_repair`
- impacted-rule recomputation tests proving re-safety touches only `adj(Delta_F)` plus hard-stop and dependency rules
- re-safety execution tests on updated evidence
- re-safety-to-urgent-escalation tests
- contradiction-monotonicity tests proving conflicting low-assurance replies cannot silently clear prior urgent evidence
- churn-guard tests proving repeated reopen-clear oscillation triggers supervisor review after the configured limit
- late-response-after-task-closure tests
- reminder deduplication tests
- no-parallel-active-cycle tests
- same-shell recovery tests for expired link, expired cycle, superseded cycle, and step-up-required reopen
- end-to-end task to more-info to patient reply to requeue or escalation flow tests

### Exit state

Staff can now safely pause a task, ask the patient a focused question, and resume with new evidence inside the same case without letting newly urgent information drift back into the normal queue.

## 3E. Endpoint decision engine and resolution model

This sub-phase is where review becomes action.

The endpoint-decision seam requires five corrections:

1. endpoint choice and rationale were typed, but not yet bound to the active route contract, publication tuple, or workspace consistency posture, so stale decision rails could remain writable
2. endpoint submit, preview, and regenerate were still described as local form flow rather than canonical route-intent, action, settlement, and recovery contracts
3. stale evidence, trust downgrade, and publication drift must force one explicit same-shell recovery mode for the endpoint rail
4. patient-facing outcome preview and endpoint explainers must be governed as supportable presentation artifacts with bounded external navigation
5. endpoint interactions still did not explicitly require canonical UI observability and disclosure fencing

### Backend work

Create a strongly typed `EndpointDecision` model and lock the endpoint taxonomy now. A good Phase 3 set is:

- `admin_resolution`
- `self_care_and_safety_net`
- `clinician_message`
- `clinician_callback`
- `appointment_required`
- `pharmacy_first_candidate`
- `duty_clinician_escalation`

This maps directly to the patient-outcome and staff-flow diagrams: admin completion, self-care or info, clinician message or callback, Pharmacy First, booking handoff, or urgent escalation.

To keep endpoint behaviour complete rather than label-only, define callback and clinician-message lifecycle contracts in `callback-and-clinician-messaging-loop.md` and define governed self-care and admin-resolution contracts in `self-care-content-and-admin-resolution-blueprint.md`.

For each endpoint, require a structured payload. For example:

**Admin resolution**  
resolution subtype, outcome note, notification template

**Self-care and safety net**  
advice template, safety-net wording, re-contact threshold

**Clinician message**  
message body, response expectation, closure rule

**Clinician callback**  
callback urgency, time window, contact route, fallback

**Appointment required**  
modality, timeframe, clinician type, continuity preference, access needs

**Pharmacy First candidate**  
suspected pathway, exclusion-check status, patient-choice-pending flag

**Duty clinician escalation**  
escalation reason, urgency, immediate action note, contact-attempt requirement

Add the endpoint control objects:

**EndpointDecisionBinding**
`endpointDecisionBindingId`, `taskId`, `reviewSessionRef`, `decisionEpochRef`, `currentEndpointDecisionRef`, `selfCareBoundaryDecisionRef`, `boundaryTupleHash`, `boundaryDecisionState`, `clinicalMeaningState`, `operationalFollowUpScope`, `latestDecisionSupersessionRef`, `reviewVersionRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `bindingState = live | preview_only | stale | blocked`

**EndpointDecisionActionRecord**
`endpointDecisionActionRecordId`, `taskId`, `endpointDecisionRef`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `selfCareBoundaryDecisionRef`, `boundaryTupleHash`, `routeIntentBindingRef`, `actionType = select_endpoint | update_payload | preview_outcome | submit_endpoint | regenerate_preview`, `reviewVersionRef`, `policyBundleRef`, `lineageFenceEpoch`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `assistiveSessionRef`, `assistiveCapabilityTrustEnvelopeRef`, `assistiveSourceRefs[]`, `humanApprovalGateAssessmentRef`, `approvalGatePolicyBundleRef`, `commandActionRecordRef`, `submittedBy`, `submittedAt`

**EndpointDecisionSettlement**
`endpointDecisionSettlementId`, `endpointDecisionActionRecordRef`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `selfCareBoundaryDecisionRef`, `boundaryTupleHash`, `boundaryDecisionState`, `clinicalMeaningState`, `operationalFollowUpScope`, `commandSettlementRecordRef`, `transitionEnvelopeRef`, `audienceSurfaceRuntimeBindingRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `humanApprovalGateAssessmentRef`, `presentationArtifactRef`, `result = draft_saved | preview_ready | submitted | stale_recoverable | blocked_policy | blocked_approval_gate | failed`, `recordedAt`

**EndpointOutcomePreviewArtifact**
`endpointOutcomePreviewArtifactId`, `taskId`, `endpointDecisionRef`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `artifactType = patient_outcome_preview | endpoint_rationale_summary | handoff_seed_preview | escalation_summary`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = summary_only | interactive_same_shell | external_handoff_ready | recovery_only`, `createdAt`

Create an endpoint-rule service that proposes candidate endpoints and validates required fields, but never auto-closes the case without human confirmation. The Phase 3 rules path remains human-primary; when a later assistive artifact seeds the endpoint draft, `submit_endpoint` must also carry the current `assistiveSessionRef`, `assistiveCapabilityTrustEnvelopeRef`, `assistiveFeedbackChainRef`, `assistiveSourceRefs[]`, any material `OverrideRecord` on that chain, one live `HumanApprovalGateAssessment`, one current `FinalHumanArtifact`, and the pinned `approvalGatePolicyBundleRef`. Submission remains blocked until that chain, the current assessment, and the current `AssistiveCapabilityTrustEnvelope` all confirm the required approval burden, trust posture, rollout posture, continuity fence, and settled human artifact for the active decision on the same review version and selected anchor.

Every live endpoint rail must bind one `EndpointDecisionBinding` before it becomes writable. If review version, `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, the linked `AudienceSurfaceRuntimeBinding`, exact publication parity, or provenance posture drifts, the same review shell must remain in place and downgrade through the bound `ReleaseRecoveryDisposition` to preview-only, placeholder, or refresh-required posture rather than leaving stale endpoint controls armed.

Endpoint select, payload update, preview, regenerate, and submit are canonical workspace actions. Each one must resolve one `RouteIntentBinding`, persist one `CommandActionRecord` through `EndpointDecisionActionRecord`, and settle one authoritative `EndpointDecisionSettlement`; local drawer acknowledgement is not authoritative endpoint state.

The first endpoint mutation on a review snapshot must mint one live `DecisionEpoch` and bind it to the current `EndpointDecisionBinding`, preview artifact, approval path, and any downstream seed. When evidence, safety posture, duplicate lineage, ownership epoch, trust slice, publication tuple, selected anchor, or review version drifts materially, the system must supersede that epoch, append one `DecisionSupersessionRecord`, mark any linked `EndpointDecision`, preview artifact, and approval checkpoint as superseded or recovery-only, and expose the exact supersession reason in the same shell rather than leaving a stale draft looking current.

If `chosenEndpoint = self_care_and_safety_net | admin_resolution`, the first preview-ready mutation on that rail must also mint or refresh one current `SelfCareBoundaryDecision` bound to the same `DecisionEpoch`, evidence snapshot, selected anchor, route intent, and lineage fence. Preview, submit, advice issue, and admin completion may not stay live unless `EndpointDecisionBinding`, `EndpointDecisionSettlement`, `SelfCareBoundaryDecision`, and the downstream experience projection all preserve the same `boundaryTupleHash`.

Downstream booking seeds, pharmacy seeds, callback artifacts, clinician-message artifacts, self-care issue, admin-resolution completion, and urgent escalation commits must all echo the same `decisionEpochRef`. If a worker, downstream service, or lagging tab presents an older epoch after supersession, the platform must fail closed to `EndpointDecisionSettlement.result = stale_recoverable`, preserve the prior preview as provenance, and require the operator to recommit from the replacement epoch instead of allowing an old decision to launch new mutation.

`chosenEndpoint = self_care_and_safety_net` is legal only while the current boundary says `decisionState = self_care`, `clinicalMeaningState = informational_only`, and `operationalFollowUpScope = self_serve_guidance`. `chosenEndpoint = admin_resolution` is legal only while the same boundary says `decisionState = admin_resolution`, `clinicalMeaningState = bounded_admin_only`, and `operationalFollowUpScope = bounded_admin_resolution`. If new symptoms, material evidence, re-safety, or dependency reopen changes that answer, the rail must freeze in place, preserve the superseded preview, and reopen clinician-governed review rather than letting wording or subtype labels carry the old class forward.

If an assistive-seeded endpoint submit fails the current `HumanApprovalGateAssessment` or the current `AssistiveCapabilityTrustEnvelope`, the rail must settle `EndpointDecisionSettlement.result = blocked_approval_gate`, preserve the current payload and preview in place, and require same-shell repair or second review rather than collapsing the decision into generic policy failure.

Patient-facing outcome previews, endpoint rationale summaries, handoff-seed previews, and escalation summaries are governed workspace artifacts. They must render through `EndpointOutcomePreviewArtifact` plus one `ArtifactPresentationContract`; print, export, browser, or cross-app handoff must consume `OutboundNavigationGrant` tied to the current task, review fence, and safe return contract.

### Frontend work

Build the endpoint action rail in the right-side drawer.

The interaction model should be:

1. choose endpoint
2. see required fields for that endpoint only
3. enter rationale
4. preview patient-facing outcome
5. submit for closure, escalation, or handoff

Do not build a giant one-form-for-every-endpoint screen. It will become a mess. Use contextual drawers or modals that only reveal the fields relevant to the chosen endpoint.

The UI should make the decision tree feel crisp, not bureaucratic. Clean grouping, short labels, clear default actions, strong confirmation states.

The endpoint rail must resolve one live `EndpointDecisionBinding` before endpoint chips, rationale fields, preview actions, or submit controls become interactive. If publication, trust, lease, or review posture drifts, the same shell must stay visible while the rail degrades through the bound `ReleaseRecoveryDisposition`.

Preview and submit may show local acknowledgement, but the rail may not imply that a direct resolution, escalation, callback seed, message seed, booking seed, or pharmacy seed is durable until the active `EndpointDecisionSettlement` confirms the current route intent, review version, and publication posture.

If the active `DecisionEpoch` is superseded while the rail is open, keep the chosen endpoint, rationale, and preview summary visible as superseded context, freeze submit and downstream-launch controls immediately, and route the operator to the replacement epoch or bounded recovery in place. The UI may never silently retarget an old preview to a new epoch.

Outcome preview, rationale summary, and handoff or escalation summary must remain summary-first under `ArtifactPresentationContract`. If the contract allows only bounded summary or placeholder, the UI may not synthesize richer patient-facing detail. Any print, export, overlay, or browser handoff must consume `OutboundNavigationGrant` and preserve a safe in-shell return.

All visible endpoint interactions across selection, payload edit, preview, regenerate, submit, stale recovery, and downgrade must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative settlement or recovery posture
- one `UITelemetryDisclosureFence` proving that route params, task identifiers, rationale text, and PHI-bearing preview fragments were redacted to the permitted disclosure class

### Tests that must pass before moving on

- endpoint validation tests for all endpoint types
- required-field matrix tests
- stale-review invalidation tests if evidence changed mid-decision
- resolution-notification template tests
- decision-payload serialization tests
- end-to-end flows for admin, self-care, clinician message, and callback
- route-publication and `EndpointDecisionBinding` tests for endpoint rails inside the active workspace shell
- authoritative `EndpointDecisionSettlement` tests proving preview and submit remain pending or blocked until settlement lands
- decision-epoch supersession tests proving preview, approval, and submit freeze immediately when the active epoch drifts
- assistive-seeded endpoint submission tests proving `HumanApprovalGateAssessment` and `assistiveSourceRefs[]` are required when present
- assistive-session and approval-policy pinning tests for assistive-seeded endpoint submit
- assistive trust-envelope pinning tests for assistive-seeded endpoint submit
- assistive approval-gate blockage tests proving `blocked_approval_gate` preserves the same payload, preview artifact, and review shell
- stale-downstream-launch tests proving booking, pharmacy, callback, message, and escalation artifacts reject superseded `decisionEpochRef` values even when the workspace UI is behind
- `ReleaseRecoveryDisposition` downgrade tests for stale review, trust loss, withdrawn publication, and fence drift
- `ArtifactPresentationContract` and `OutboundNavigationGrant` tests for outcome previews, rationale summaries, and handoff-seed previews
- UI telemetry disclosure and redaction tests for endpoint interactions

### Exit state

A reviewer can now convert understanding into a structured clinical or operational decision.

---

## 3F. Human approval checkpoint and urgent escalation path

This is the defining safety mechanism of the phase.

### Backend work

Build a configurable approval matrix that decides which actions require explicit human approval before final commit.

Typical approval-required actions in this phase include:

- clinically definitive advice that closes the case
- coded or signed outcomes
- tenant-configured high-risk closure paths
- escalations or overrides marked as sensitive by policy

Create `ApprovalCheckpoint` with its own state machine:

`not_required -> required -> pending -> approved | rejected -> superseded`

Every `ApprovalCheckpoint` is bound to one `decisionEpochRef`, not just to generic task context. Any material change to the decision should invalidate prior approval. That means if the note changes, the endpoint changes, the patient replies again, the case is attached to or separated from another duplicate candidate, or publication or trust posture forces a replacement epoch, the checkpoint must move to `superseded`, append or reference the governing `DecisionSupersessionRecord`, and require fresh approval on the replacement epoch.

Add urgent escalation mechanics for high-risk cases. The staff flow explicitly shows high-risk escalation to duty clinician urgent contact with safety outcome recording, so this path has to be first-class, not a note scribbled into the timeline.

A clean escalation algorithm is:

1. reviewer triggers escalation or system flags residual high risk
2. system creates `DutyEscalationRecord` and urgent task
3. original triage task enters `escalated`, and the triage-side lease keeps the canonical `Request` in `workflowState = triage_active` under coordinator control
4. contact-attempt log opens
5. urgent contact outcome is recorded
6. if the urgent outcome is direct advice or direct completion, persist the required endpoint data against the current unsuperseded `DecisionEpoch`, transition `escalated -> resolved_without_appointment`, and emit the direct-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
7. if the urgent outcome requires booking, hub, or pharmacy ownership, create the downstream intent from the current unsuperseded `DecisionEpoch`, transition `escalated -> handoff_pending`, and emit the handoff milestone so `LifecycleCoordinator` may derive `Request.workflowState = handoff_active` once downstream ownership is acknowledged
8. if the urgent path returns the case for further practice review, create `TriageReopenRecord` and transition `escalated -> reopened -> queued` with raised priority and any applicable `urgencyCarry` floor
9. only `resolved_without_appointment` and `handoff_pending` may later close the triage task

### Frontend work

This needs two specific UI surfaces, both aligned to the quiet-shell rules.

First, an approval `ConsequencePreview` sheet or bounded modal that is serious and friction-appropriate: clear summary of what is being approved, why it requires approval, who is approving, and what changed since the last review. Do not force a modal when an inline side stage can preserve more context safely.

Second, an urgent escalation stage that is impossible to miss without becoming a permanent banner stack. The shared status strip should switch to urgent, `DecisionDock` should collapse to the urgent next actions, one promoted urgent-contact stage should open inside the same review shell, and all non-urgent alerts should collapse into the interruption digest from `staff-workspace-interface-architecture.md`. The urgent stage should show:

- urgency reason
- who escalated
- time since escalation
- contact attempts
- current urgent status

While this urgent stage is open, queue widgets, assistive rails, and secondary evidence regions should demote to stubs unless the reviewer explicitly pins them. If break-glass access is needed, the Phase 0 controls should appear here as a visible, audited path rather than a hidden admin action.

### Tests that must pass before moving on

- approval-bypass prevention tests
- stale-approval invalidation tests
- multi-role approval-config tests
- escalation-SLA tests
- contact-attempt audit tests
- override and reason-code tests
- end-to-end urgent-escalation tests

### Exit state

Vecells now has a true human checkpoint: staff can act quickly, but the system still enforces explicit approval where required.

---

## 3G. Direct resolution, downstream handoff seeds, and reopen mechanics

This sub-phase closes the operational loop for Phase 3 without stealing later phases.

### Backend work

Phase 3 should fully support direct non-appointment resolution now:

- admin complete plus notify
- self-care plus safety-net advice
- clinician message plus notify
- callback task creation

For appointment-required and pharmacy-appropriate outcomes, stop at clean handoff objects.

Do not leave callback and clinician-message endpoints as implicit subpaths of generic triage closure. Create first-class lifecycle objects and state transitions as defined in `callback-and-clinician-messaging-loop.md`, then link those lifecycle states into patient and staff projections.

All active callback, clinician-message, approval, booking-intent, pharmacy-intent, and triage workflows must hold their own `RequestLifecycleLease`. No domain-local action may close the request by itself; `LifecycleCoordinator` remains the sole authority for `Request.workflowState = closed`.

Any materially new evidence entering these flows, including callback outcomes and clinician-message replies, must route through `SafetyOrchestrator` under the canonical Phase 0 section before routine work may resume.

Create:

**BookingIntent**  
`intentId`, `episodeRef`, `requestId`, `requestLineageRef`, `sourceTriageTaskRef`, `lineageCaseLinkRef`, `priorityBand`, `timeframe`, `modality`, `clinicianType`, `continuityPreference`, `accessNeeds`, `patientPreferenceSummary`, `createdFromDecisionId`, `sourceDecisionEpochRef`, `decisionSupersessionRecordRef`

**PharmacyIntent**  
`intentId`, `episodeRef`, `requestId`, `requestLineageRef`, `sourceTriageTaskRef`, `lineageCaseLinkRef`, `suspectedPathway`, `eligibilityFacts`, `exclusionFlags`, `patientChoicePending`, `createdFromDecisionId`, `sourceDecisionEpochRef`, `decisionSupersessionRecordRef`

**TriageReopenRecord**  
`reopenRecordId`, `taskId`, `sourceDomain`, `reasonCode`, `evidenceRefs`, `supersededDecisionEpochRef`, `decisionSupersessionRecordRef`, `priorityOverride`, `reopenedByMode`, `reopenedAt`

Use this direct-resolution algorithm:

1. clinician selects a direct endpoint
2. system validates or mints the current live `DecisionEpoch`, persists `EndpointDecision`, and sets `TriageTask.status = endpoint_selected`
3. system composes the required outbound message, safety-net text, or callback artifact only against that live `decisionEpochRef`
4. system sets `TriageTask.status = resolved_without_appointment` only after the authoritative endpoint settlement confirms the same live epoch
5. system emits the direct-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
6. system updates patient-facing status projections
7. once all direct-resolution artifacts are durably queued or created, system sets `TriageTask.status = closed`
8. if no open triage, approval, callback, message, or downstream work remains on the request lineage, ask `LifecycleCoordinator` to evaluate closure and persist `RequestClosureRecord` before the request may close

Direct-resolution artifacts are replay-safe only when they keep the originating `decisionEpochRef` lineage-visible. If reopening evidence, approval invalidation, publication drift, duplicate resolution, or ownership drift supersedes that epoch before downstream settlement completes, the artifact must degrade to provenance or recovery-only posture and may not continue quietly as if it still represented the current decision.

Direct-resolution confirmation, message preview, callback confirmation, urgent escalation summary, and any downstream handoff confirmation must render through one `TriageOutcomePresentationArtifact` plus one `ArtifactPresentationContract`. The primary design is summary-first inside the same workspace shell. Raw file URLs, detached print pages, or ad hoc browser confirmation pages are not valid primary closure or handoff UX.

Use this handoff algorithm:

1. clinician selects booking or pharmacy endpoint
2. system creates `BookingIntent` or `PharmacyIntent` from the current unsuperseded `DecisionEpoch`, and in the same transaction mints one `LineageCaseLink(caseFamily = booking | pharmacy, ownershipState = proposed, linkReason = direct_handoff)` on the governing `RequestLineage`
3. system sets `TriageTask.status = handoff_pending` and emits `triage.task.handoff_pending`
4. downstream booking or pharmacy service acknowledges ownership only after validating that `sourceDecisionEpochRef` still matches the current live triage epoch for the lineage and that the bound `LineageCaseLink` is still the current proposed child link for that request lineage; stale or superseded intents must fail closed to governed recovery and may not silently launch
5. system emits the handoff milestone so `LifecycleCoordinator` may derive `Request.workflowState = handoff_active`
6. only then does the triage task move to `closed`

If any closure, handoff, print, export, evidence-open, or cross-app route needs to leave the current shell, it must consume one short-lived `OutboundNavigationGrant` bound to the active route family, current review or lineage fence, and safe return contract. Unsupported or withdrawn handoff routes must degrade to summary-only or governed recovery instead of launching detached navigation.

Also build generic reopen mechanics now:

1. a bounce-back, supervisor action, or materially new evidence arrives with reason code and evidence refs
2. system creates `TriageReopenRecord` and one `DecisionSupersessionRecord` when the prior live epoch is no longer actionable
3. system reacquires the triage-side `RequestLifecycleLease`, sets `TriageTask.status = reopened`, refreshes `latestEvidenceSnapshotRef`, raises priority and any applicable `urgencyCarry` floor, and lets `LifecycleCoordinator` keep `Request.workflowState = triage_active`
4. once queue routing is recalculated, system transitions `reopened -> queued`
5. reopened tasks must preserve lineage to the original task and closure record

Update patient-facing status projections on every direct resolution, handoff creation, and reopen.

### Frontend work

Add polished closure and handoff confirmation states inside the workspace:

- direct-resolution confirmation
- message preview
- callback created
- booking handoff created
- pharmacy handoff created
- reopened case banner
- next best task CTA

Give staff a concise closure summary rather than silently throwing them back into the queue. Good operators need clear completion feedback. Closure should remain inside the same shell long enough to confirm the consequence, then offer the next recommended task from the preserved `TaskLaunchContext`.

### Tests that must pass before moving on

- direct-resolution end-to-end tests
- handoff-object integrity tests
- source-decision-epoch validation tests for booking and pharmacy handoff intake
- no-orphan-intent tests
- patient-status projection update tests
- reopen-from-resolved tests
- reopen-from-handoff tests
- reopen-supersession audit tests proving `DecisionSupersessionRecord` and `TriageReopenRecord` explain why the earlier decision path stopped being actionable
- notification idempotency tests

### Exit state

The workspace can now fully resolve some cases and cleanly package the rest for the next subsystems.

---

## 3H. Hardening, clinical beta, and formal exit gate

This is where the phase becomes real.

### Backend work

Add deep observability for the triage workflow:

- queue depth by band
- median claim time
- median review time
- awaiting-patient dwell time
- escalation count and age
- endpoint mix
- approval-required rate
- approval dwell time
- duplicate-cluster rate
- duplicate-attach confirm rate
- reopen rate
- task-close failure rate

Create internal support tools for:

- task event timeline
- ranking explanation
- evidence snapshot comparison
- approval history
- escalation history
- duplicate decision history

All claim, release, start-review, request-more-info, approve, escalate, reopen, close, stale-recovery, and handoff transitions must also emit canonical UI observability contracts:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative workspace settlement
- one `UITelemetryDisclosureFence` proving route params, patient identifiers, free text, and artifact fragments were redacted to the permitted disclosure class

Operational analytics, replay, and browser automation may observe queue movement, settlement state, publication posture, and recovery posture, but they may not leak PHI-bearing payload fragments into traces, selectors, or analytics events.

Update the safety evidence as part of the sprint. This phase should add hazards such as wrong endpoint selection, missed urgent escalation, stale approval, wrong duplicate attach or separation decision, failure to re-run safety after new patient evidence, and silent task collision. NHS England’s clinical safety pages explicitly support maintaining these artefacts with standard templates rather than inventing your own format from scratch. ([NHS England Digital][1])

### Frontend work

Run an internal clinical beta with real staff using a feature-flagged workspace.

Start with:

1. read-only queue preview
2. claim plus review
3. more-info loop
4. endpoint decisioning
5. approvals and escalation

That order matters. It lets the existing system keep working while the new workspace gets operationally stronger in controlled slices.

Before sign-off, the staff experience should already feel intentional and premium:

- dense but not cramped
- stable layout
- fast queue scan
- clear hierarchy
- excellent empty, loading, and error states
- full keyboard path for common actions
- no temporary admin-looking screens

### Tests that must all pass before Phase 4

- no Sev-1 or Sev-2 defects in core queue review paths
- deterministic queue order under repeated recomputation
- concurrent-review protection proven
- more-info loop proven end to end
- re-safety on new evidence proven
- approval-required actions cannot bypass checkpoint
- direct-resolution flows proven
- booking and pharmacy handoff seeds created correctly
- reopen mechanics proven
- audit trail complete for assignment, duplicate decisions, approvals, escalations, and closures
- workspace route-contract publication and `ReleaseRecoveryDisposition` behavior proven for queue, task, approval, escalation, and changed views
- `StaffWorkspaceConsistencyProjection`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `TaskCompletionSettlementEnvelope` behavior proven across claim, decision, approval, escalation, close, and next-task transitions, including invalidation, quiet-return restore, and stale-recoverable draft retention
- `ArtifactPresentationContract` and `OutboundNavigationGrant` behavior proven for direct-resolution, evidence-open, print, and downstream handoff confirmations
- `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` emission and redaction proven for critical workspace transitions
- updated safety case and hazard log committed for this release

### Exit state

The platform is now a real staff workflow system, not just a patient intake front door.

[1]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards?utm_source=chatgpt.com "Clinical risk management standards"
