# Staff workspace interface architecture

## Purpose

Define the end-to-end front-end architecture for the Clinical Workspace shell used by clinicians and designated operational reviewers. This blueprint specializes `platform-frontend-blueprint.md`, `phase-3-the-human-checkpoint.md`, and `staff-operations-and-support-blueprint.md` for the highest-frequency staff journey: scanning demand, opening the right task, reaching a safe decision quickly, and moving directly to the next item without shell resets.

The governing laws are:

- same request lineage, same shell
- queue scan in one glance, task understanding in one canvas
- one dominant action, one promoted support region, one urgent interruption path
- alert digests over banner stacks
- keyboard-first for repetitive work, pointer-safe for high-risk review

## Design language: Quiet Clinical Mission Control

The workspace inherits `design-token-foundation.md` through `profile.staff_workspace` and should feel like a quiet operational instrument rather than a generic admin dashboard.

- `densityMode = compact` for queue, preview, and interruption surfaces; blocker review, compose, and decision regions step back to `balanced`
- queue, list, and table surfaces must use separator-first `list` and `table` surface-role tokens rather than floating cards
- active task, diff, and consequence surfaces use `task` surface-role tokens with restrained radius, low elevation, and the canonical editorial-operational type scale
- type, spacing, state color, icon, radius, stroke, and motion values must come from the canonical token foundation; the workspace may not define a local palette or shadow ramp
- noise policy: status belongs in the shared strip first, queue rows second, banners last

### Assistive companion presentation profile

The Phase 8 companion must read as a support instrument, not a second cockpit. Use one bounded presentation profile across all staff shells:

**AssistiveCompanionPresentationProfile**
`profileId`, `desktopInlineSize = clamp(20rem, 28vw, 26rem)`, `maxTaskPlaneShare = 0.33`, `summaryStubMinBlockSize = 5.5rem`, `summaryStubMaxPreviewLines = 3`, `sectionGap = 0.75rem`, `metadataGap = 0.5rem`, `provenanceFooterMinBlockSize = 2.75rem`, `evidencePopoverMaxInlineSize = 42ch`, `minInteractiveTargetPx = 44`, `mobileDrawerMaxBlockShare = 0.6`, `motionDurationShortMs = 120`, `motionDurationMediumMs = 180`

Rules:

- assistive chrome may never take more than one-third of the task plane on desktop; otherwise it must demote to a summary stub or bounded drawer
- summary-stub reading order is fixed: capability label, bounded rationale, confidence or abstention band, provenance or freshness row, dominant safe action
- assistive headings inherit the support-region title tier and may not outrank task-canvas section headers; provenance and freshness metadata use compact secondary type with tabular numerics for time and version cues
- color semantics are constrained: slate or ink for available companion posture, amber for guarded or stale posture, rose for blocked or quarantined posture, and no success-green for probabilistic assistive confidence
- motion must be directional and brief; stub-to-rail promotion may slide from the edge or fold open, but reduced-motion mode must keep the same state sequence with minimal translation

## Primary objectives

- reduce queue-to-first-action latency
- minimize pointer travel between queue, evidence, and action composition
- make patient-returned evidence immediately legible through delta-first rendering
- preserve object permanence through claim, review, escalation, approval, handoff, and reopen
- separate urgent actionable alerts from routine status so staff do not habituate to warning chrome

## Additional control priorities

The staff workspace layer requires five corrections:

1. Queue, task, interruption, and action surfaces could still assemble from locally fresh but mutually inconsistent reads, which risks a calm shell carrying contradictory truth.
2. Claim, start-review, draft-send, decision, and handoff actions must require one live eligibility lease bound to queue batch, review version, and lineage fence, so stale actions could survive queue churn or task drift.
3. Compose, compare, confirm, and delta-review moments relied on general frontend rules but lacked a workspace-specific protection lease, which risks assistive or live-update churn breaking focus integrity.
4. The clinical workspace must define how the Phase 8 assistive layer is allowed to coexist with the main review canvas, so suggestions and drafts could compete with the core decision posture.
5. Completion-to-next-task continuity was specified visually, but not yet through a settlement-gated launch contract, which risks jumping away before authoritative downstream state or recovery posture is known.

## Route family

The staff shell should own this route family:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/workspace/task/:taskId`
- `/workspace/task/:taskId/more-info`
- `/workspace/task/:taskId/decision`
- `/workspace/approvals`
- `/workspace/escalations`
- `/workspace/changed`
- `/workspace/search`

Route rules:

- `/workspace` resolves to the best role-specific start surface from `WorkspaceHomeProjection`
- opening a task from any worklist must preserve queue context and active filters in `TaskLaunchContext`
- `/workspace/task/:taskId/more-info` and `/workspace/task/:taskId/decision` are soft child states of the same `PersistentShell`, not separate page types
- `/workspace/approvals` and `/workspace/escalations` may open as list routes, but if the user already has a task open they should resolve into the current shell as `InlineSideStage` or `ContextConstellation`
- `workspaceShellContinuityKey = workspace + roleProfile + channelProfile + workspaceManifestVersion` governs shell reuse across queue changes, task switches, approvals, escalations, and search
- `entityContinuityKey` for the active task surface is `staff_task + requestId + practice_lineage`

Add these workspace navigation contracts:

**WorkspaceNavigationLedger**
`workspaceNavigationLedgerId`, `workspaceShellContinuityKey`, `selectedNavGroupRef`, `activeQueueKey`, `appliedFiltersRef`, `sortMode`, `selectedRowAnchorRef`, `previewAnchorRef`, `activeTaskId`, `activeTaskChildRouteRef`, `sideStageRef`, `scrollStateRef`, `restoreEpoch`, `ledgerState = live | stale | recovery_required`

`WorkspaceNavigationLedger` is the authoritative memory for queue selection, filters, preview state, active task, child route, and restore posture. Back or forward, hard refresh, reconnect, and next-task launch must rehydrate from it rather than from ambient browser history or queue-local component state.

**WorkspaceRouteAdjacency**
`workspaceRouteAdjacencyId`, `fromRouteFamilyRef`, `toRouteFamilyRef`, `adjacencyType = same_task_child | same_shell_task_switch | same_shell_queue_switch | hard_boundary`, `historyPolicy = push | replace | none`, `selectedRowDispositionRef`, `taskAnchorDispositionRef`, `focusTargetRef`, `dominantActionDispositionRef`, `recoveryFallbackRef`, `contractVersionRef`

`WorkspaceRouteAdjacency` defines how a workspace route morphs. It decides whether the operator is staying on the same task, switching tasks inside the same workspace shell, changing queue context, or crossing a true shell boundary.

**WorkspaceSelectedAnchorPolicy**
`workspaceSelectedAnchorPolicyId`, `routeFamilyRef`, `primaryAnchorSlotRef`, `secondaryAnchorSlotRefs[]`, `invalidationPresentationRef`, `replacementRequirementRef`, `releaseRuleRefs[]`, `refreshRestoreOrderRef`, `fallbackAnchorRef`, `policyVersionRef`

`WorkspaceSelectedAnchorPolicy` names the primary queue row, evidence cluster, or action card that must remain visually stable through pending, invalidation, next-task launch, and recovery.

**WorkspaceDominantActionHierarchy**
`workspaceDominantActionHierarchyId`, `routeFamilyRef`, `shellDominantActionRef`, `primaryRegionDominantActionRef`, `competingActionRefs[]`, `demotionRuleRefs[]`, `blockedFallbackActionRef`, `quietReturnActionRef`, `hierarchyVersionRef`

`WorkspaceDominantActionHierarchy` ensures one dominant action at a time: queue scan when no task is open, `DecisionDock` when a task is open, and a child-route composer or confirm surface only while it is the current protected task.

**WorkspaceStatusPresentationContract**
`workspaceStatusPresentationContractId`, `routeFamilyRef`, `statusStripSentenceRef`, `queueRowLocalStateRefs[]`, `taskCanvasLocalStateRefs[]`, `bannerEscalationRef`, `settlementPresentationRef`, `recoveryPresentationRef`, `duplicationFenceRef`, `contractVersionRef`

`WorkspaceStatusPresentationContract` is the status grammar for each workspace route family. It keeps shell strip cues, queue-row badges, task-canvas states, and blocker banners causally aligned.

Workspace shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = staff)` over `/workspace`, queue, task, approvals, escalations, changed, and search route families
- every workspace route family must publish one `RouteFamilyOwnershipClaim`; task detail is the shell root for active work, `more-info` and `decision` are `same_shell_child`, queue switches and search are `same_shell_peer`, and approvals or escalations are `same_shell_peer` or bounded side stages rather than detached admin flows
- evidence review, more-info compose, decision confirm, and next-task launch may contribute child surfaces, but they do not get to replace the workspace shell or invent a second route family for the same task lifecycle
- deep links, refresh, browser back or forward, and recovery into any workspace child route must resolve through the current workspace ownership claim plus `WorkspaceRouteAdjacency`; they may not open standalone confirmation, escalation, or audit pages while the same workspace continuity key remains valid

Additional route rules:

- queue changes, saved-view changes, approvals or escalations, and task switches that remain inside the workspace family must reuse the same `workspaceShellContinuityKey`
- opening a new task from the same workbench is `WorkspaceRouteAdjacency(adjacencyType = same_shell_task_switch)`; queue filters, selected-row stub, and workboard scroll persist while task-scoped anchors, leases, and child-route focus reset only as the adjacency contract permits
- `/workspace/task/:taskId/more-info` and `/workspace/task/:taskId/decision` are `same_task_child` transitions with `historyPolicy = push`; autosave, stale-review demotion, and settlement confirmation must use `replace` or `none`, never extra history entries
- browser back or forward, hard refresh, and post-recovery return must restore queue, filters, selected row, active task, child route, and selected anchor from `WorkspaceNavigationLedger` before live hydration starts
- every workspace route family must publish one `WorkspaceSelectedAnchorPolicy`, one `WorkspaceDominantActionHierarchy`, and one `WorkspaceStatusPresentationContract`
- every workspace route family must also materialize one live `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`; queue, task, more-info, decision, approval, escalation, and search surfaces may read only through declared `ProjectionQueryContract` refs, write only through declared `MutationCommandContract` refs, consume live updates only through declared `LiveUpdateChannelContract` refs, and reuse cached task data only through the declared `ClientCachePolicy`
- queue-row fields, stale task payloads, and route-local flags may not imply writable posture, settlement wording, or recovery disposition when the active workspace manifest or `AudienceSurfaceRuntimeBinding` has degraded

## Workspace-specific specializations

These primitives specialize the shared platform shell rather than replace it:

- `Workboard`: the staff queue-and-navigation composition layered inside `PersistentShell`
- `PreviewPocket`: a low-latency queue preview for hover or keyboard scan
- `InterruptionDigest`: the single summarized broker for blocking, urgent, and watch signals
- `QuickCaptureTray`: the rapid-entry extension of `DecisionDock`
- `LineageStrip`: compact linked-work context for callback, message, booking-intent, pharmacy-intent, and reopen state
- `AssistiveWorkspaceStage`: the bounded side-stage and summary-stub contract for Phase 8 draft and suggestion artifacts inside the same shell

## Workspace projections and client state

Create these staff-specific read models:

**WorkspaceHomeProjection**
`staffRef`, `roleProfile`, `recommendedQueueRef`, `nextRecommendedTaskRef`, `urgentInterruptionCount`, `approvalCount`, `patientReplyReturnCount`, `teamRiskDigest`, `dependencyDigest`, `changedSinceSeenDigest`, `savedViewRefs`, `recentTaskRefs`, `generatedAt`

**QueueWorkbenchProjection**
`queueKey`, `savedViewRef`, `appliedFilters`, `sortMode`, `rankPlanVersion`, `rankSnapshotRef`, `assignmentSuggestionSnapshotRef`, `workspaceTrustEnvelopeRef`, `rowOrderHash`, `rowCount`, `virtualWindowRef`, `rows[]`, `queueHealthDigest`, `queueChangeBatchRef`, `generatedAt`

**TaskWorkspaceProjection**
`taskId`, `requestId`, `reviewVersion`, `workspaceSnapshotVersion`, `launchContextRef`, `workspaceTrustEnvelopeRef`, `assistiveCapabilityTrustEnvelopeRef`, `casePulse`, `interruptionDigest`, `summaryBlock`, `structuredFacts`, `patientNarrative`, `attachmentDigest`, `communicationDigest`, `stateBraidDigest`, `evidenceDiffDigest`, `linkedWorkDigest`, `boundaryDecisionDigest`, `adviceSettlementDigest`, `adminResolutionDigest`, `decisionOptions`, `actionAvailability`, `generatedAt`

**SelfCareBoundaryDigest**
`boundaryDecisionDigestId`, `taskId`, `boundaryDecisionRef`, `decisionEpochRef`, `boundaryTupleHash`, `decisionState`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState`, `dependencySetRef`, `selfCareExperienceProjectionRef`, `adminResolutionExperienceProjectionRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `reopenState`, `dominantReasonRefs[]`, `selectedAnchorRef`, `projectionState = fresh | stale | recovery_required`, `renderedAt`

`SelfCareBoundaryDigest` is the only workspace summary of self-care versus admin-resolution classification. Drawer copy, endpoint chips, staged previews, and next-step messaging may not reinterpret the current boundary from route label, subtype name, or draft wording once this digest exists, and the digest must also prove which patient-visible experience projection and published route tuple still match the workspace copy before writable posture remains live.

**AdviceSettlementDigest**
`adviceSettlementDigestId`, `taskId`, `boundaryDecisionRef`, `boundaryTupleHash`, `adviceRenderSettlementRef`, `adviceBundleVersionRef`, `adviceVariantSetRef`, `dependencySetRef`, `clinicalMeaningState`, `operationalFollowUpScope`, `reopenState`, `settlementState = renderable | withheld | invalidated | superseded | quarantined`, `selfCareExperienceProjectionRef`, `transitionEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `projectionState = fresh | stale | recovery_required`, `renderedAt`

`AdviceSettlementDigest` is the staff-side proof that the visible self-care path is still informational advice for the current boundary tuple. Queue badges, side-stage receipts, and handoff summaries may not keep a stale advice path live once the digest says the tuple has reopened, the patient-facing projection drifted, or the published route tuple no longer matches.

**AdminResolutionDigest**
`adminResolutionDigestId`, `taskId`, `boundaryDecisionRef`, `boundaryTupleHash`, `adminResolutionCaseRef`, `currentSettlementRef`, `completionArtifactRef`, `dependencySetRef`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState`, `reopenState`, `dominantDependencyRefs[]`, `adminResolutionExperienceProjectionRef`, `transitionEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `projectionState = fresh | stale | recovery_required`, `renderedAt`

`AdminResolutionDigest` is the only workspace digest that may imply bounded admin follow-up. It must preserve whether the case is still strictly admin-only, which dependency or reopen fact governs it, and whether the patient shell is reading the same boundary tuple and route publication before complete or notify posture stays live.

**InterruptionDigestProjection**
`taskId`, `workspaceTrustEnvelopeRef`, `blockingItems[]`, `urgentActionables[]`, `watchItems[]`, `silentSignals[]`, `recommendedPromotedRegion`, `lastEvaluatedAt`

**StaffWorkspaceConsistencyProjection**
`consistencyProjectionId`, `taskId`, `requestId`, `entityContinuityKey`, `bundleVersion`, `audienceTier`, `governingObjectRefs`, `entityVersionRefs`, `queueChangeBatchRef`, `reviewVersionRef`, `workspaceSnapshotVersion`, `computedAt`, `staleAt`, `causalConsistencyState`, `projectionTrustState`

**WorkspaceSliceTrustProjection**
`sliceTrustProjectionId`, `taskId`, `queueSliceTrustState`, `taskSliceTrustState`, `attachmentSliceTrustState`, `assistiveSliceTrustState`, `dependencySliceTrustState`, `assuranceSliceTrustRefs[]`, `renderMode = interactive | observe_only | recovery_required`, `blockingDependencyRefs[]`, `evaluatedAt`

**WorkspaceTrustEnvelope**
`workspaceTrustEnvelopeId`, `taskId`, `queueKey`, `workspaceFamily = staff_review`, `workspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `reviewActionLeaseRef`, `requestLifecycleLeaseRef`, `focusProtectionLeaseRef`, `protectedCompositionStateRef`, `taskCompletionSettlementEnvelopeRef`, `decisionDockFocusLeaseRef`, `surfaceRuntimeBindingRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `sourceQueueRankSnapshotRef`, `experienceContinuityEvidenceRef`, `consistencyTupleHash`, `trustTupleHash`, `envelopeState = interactive | observe_only | stale_recoverable | recovery_required | reassigned`, `mutationAuthorityState = live | frozen | blocked`, `interruptionPacingState = live | buffered | blocking_only | recovery_only`, `completionCalmState = not_eligible | pending_settlement | eligible | blocked`, `blockingReasonRefs[]`, `computedAt`

`WorkspaceTrustEnvelope` is the sole staff-workspace authority for whether queue, task, interruption, and next-task surfaces may appear writable, interruption-buffered, or calmly complete. `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, active leases, focus protection, and completion settlement all feed it, but none of those producers may independently restore healthy posture once the envelope has degraded.

**RapidEntryDraft**
`draftId`, `taskId`, `draftType = notes | question_set | endpoint_reasoning | admin_resolution | self_care_advice`, `fieldState`, `lastLocalChangeAt`, `autosaveState`, `recoverableUntil`

**MoreInfoStatusDigest**
`moreInfoStatusDigestId`, `taskId`, `cycleRef`, `replyWindowCheckpointRef`, `reminderScheduleRef`, `latestResponseDispositionRef`, `reachabilityAssessmentRef`, `selectedAnchorRef`, `dueAt`, `lateReplyReviewUntilAt`, `statusState = draft | awaiting_patient_reply | reminder_due | late_review | response_received | review_required | expired | superseded | repair_required`, `dominantWorkspaceActionRef`, `renderedAt`

`MoreInfoStatusDigest` is the sole workspace digest for the more-info loop. Queue-row badges, task-header chips, side-stage receipts, reminder controls, and interruption items must read from it rather than computing due-state from local timers, outbound message timestamps, or stale queue copies.

**QueueScanSession**
`queueScanSessionId`, `queueKey`, `rankSnapshotRef`, `focusedRowRef`, `previewDigestRef`, `prefetchWindowRef`, `selectedAnchorRef`, `scanFenceToken`, `previewHydrationMode = summary_only | pinned_summary`, `sessionState = scanning | preview_peek | preview_pinned | task_open`, `previewAcknowledgesSeen = false`, `openedAt`, `updatedAt`

**QueuePreviewDigest**
`queuePreviewDigestId`, `taskId`, `rankSnapshotRef`, `rankEntryRef`, `reviewVersion`, `reasonSummaryRef`, `materialDeltaSummaryRef`, `blockingDigestRef`, `ownershipDigestRef`, `nextActionDigestRef`, `attachmentAvailabilityDigestRef`, `previewMode = hover_summary | pinned_summary | prefetch_summary`, `leaseMintState = forbidden`, `changedSinceSeenState = unchanged`, `heavyHydrationState = on_open_only`, `freshnessState`, `generatedAt`

**QueueRowPresentationContract**
`queueRowPresentationContractId`, `rowDensity = compact | elevated`, `lineClampPrimary = 1`, `lineClampSecondary = 1`, `lineClampTertiary = 0 | 1`, `leftSignalRailMode`, `rightClusterMode`, `changedSinceSeenMode`, `freshnessCueMode`, `generatedAt`

**TaskCanvasFrame**
`taskCanvasFrameId`, `taskId`, `openingMode = first_review | resumed_review | approval_review | handoff_review`, `summaryStackRef`, `deltaStackRef`, `evidenceStackRef`, `consequenceStackRef`, `referenceStackRef`, `deltaPacketRef`, `supersededContextRefs[]`, `quietReturnTargetRef`, `deltaReviewState = inactive | diff_first | acknowledged | recommit_required`, `expandedRegionRefs[]`, `primaryReadingTargetRef`, `generatedAt`

**EvidenceDeltaPacket**
`evidenceDeltaPacketId`, `taskId`, `baselineSnapshotRef`, `currentSnapshotRef`, `deltaClass = decisive | consequential | contextual | clerical`, `changedFieldRefs[]`, `contradictionRefs[]`, `actionInvalidationRefs[]`, `summaryDeltaRef`, `primaryChangedAnchorRef`, `supersededJudgmentContextRefs[]`, `supersessionMarkerRefs[]`, `acknowledgementState = pending_review | acknowledged | recommit_required`, `returnToQuietEligibility = blocked | on_ack | on_resolve`, `requiresExplicitReview`, `generatedAt`

Reuse the canonical `TaskLaunchContext` from `phase-3-the-human-checkpoint.md`. Workspace architecture depends on the full durable context, including `launchContextId`, `selectedAnchorRef`, and `changedSinceSeenAt`; do not fork a reduced router-only shape here.

**ReviewActionLease**
`reviewActionLeaseId`, `actionType = claim | start_review | request_more_info | send_more_info | draft_insert | commit_decision | issue_advice | complete_admin_resolution | next_task_launch`, `taskId`, `sourceQueueKey`, `reviewVersionRef`, `workspaceSnapshotVersion`, `selectedAnchorRef`, `lineageFenceEpoch`, `ownershipEpochRef`, `fencingToken`, `leaseAuthorityRef`, `queueChangeBatchRef`, `workspaceConsistencyProjectionRef`, `workspaceTrustEnvelopeRef`, `issuedToActorRef`, `staleOwnerRecoveryRef`, `issuedAt`, `expiresAt`, `leaseState`

**WorkspaceFocusProtectionLease**
`focusProtectionLeaseId`, `taskId`, `reviewActionLeaseRef`, `requestLifecycleLeaseRef`, `focusReason = composing | comparing | confirming | assistive_review | reading_delta | delivery_dispute_review`, `reviewVersionRef`, `ownershipEpochRef`, `fencingToken`, `lineageFenceEpoch`, `workspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `workspaceTrustEnvelopeRef`, `surfaceRuntimeBindingRef`, `selectedAnchorRef`, `compareAnchorRefs[]`, `promotedRegionRef`, `priorQuietRegionRef`, `assistiveStageRef`, `bufferedDeltaRefs[]`, `bufferedQueueBatchRefs[]`, `releaseGateRef`, `leaseState = active | release_pending | invalidated | released | superseded`, `invalidatingDriftState = none | ownership | lineage | review_version | publication | trust | anchor_invalidated | compare_target_invalidated | settlement_drift`, `startedAt`, `releaseRequestedAt`, `releasedAt`

**ProtectedCompositionState**
`protectedCompositionStateId`, `taskId`, `focusProtectionLeaseRef`, `compositionMode = drafting | compare_review | delta_review | approval_review | handoff_review | consequence_confirm | delivery_dispute_review`, `draftArtifactRefs[]`, `primarySelectedAnchorRef`, `compareAnchorRefs[]`, `assistiveInsertionPointRef`, `primaryReadingTargetRef`, `quietReturnTargetRef`, `allowedLivePatchMode = blocking_only | non_disruptive_plus_blocking | local_ack_only`, `stateValidity = live | stale_recoverable | recovery_only`, `releaseGateRef`, `startedAt`, `releasedAt`

**WorkspaceProminenceDecision**
`workspaceProminenceDecisionId`, `taskId`, `candidateRegionRefs[]`, `promotedRegionRef`, `priorQuietRegionRef`, `authoritativeDeltaPacketRef`, `quietReturnTargetRef`, `decisionBasisRef`, `cooldownWindowRef`, `protectedCompositionStateRef`, `decidedAt`

**ApprovalReviewFrame**
`approvalReviewFrameId`, `taskId`, `approvalRequestRef`, `decisionSummaryRef`, `irreversibleEffectRefs[]`, `requiredReviewerRoleRef`, `settlementState`, `generatedAt`

**DecisionCommitEnvelope**
`decisionCommitEnvelopeId`, `taskId`, `decisionEpochRef`, `endpointDecisionBindingRef`, `latestDecisionSupersessionRef`, `decisionDraftRef`, `consequencePreviewRef`, `approvalReviewFrameRef`, `reviewActionLeaseRef`, `taskCompletionSettlementEnvelopeRef`, `commitState = drafting | previewing | awaiting_approval | commit_pending | settled | superseded | recovery_required`, `generatedAt`

**AssistiveCapabilityTrustEnvelope**
`assistiveCapabilityTrustEnvelopeId`, `taskId`, `assistiveSessionRef`, `capabilityCode`, `assistiveSurfaceBindingRef`, `assistiveInvocationGrantRef`, `assistiveRunSettlementRef`, `assistiveCapabilityTrustProjectionRef`, `assistiveCapabilityRolloutVerdictRef`, `assistiveFreezeFrameRef`, `workspaceTrustEnvelopeRef`, `reviewActionLeaseRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `assistiveContinuityEvidenceProjectionRef`, `selectedAnchorRef`, `draftInsertionPointRef`, `draftPatchLeaseRef`, `trustState = trusted | degraded | quarantined | shadow_only | frozen`, `surfacePostureState = interactive | observe_only | provenance_only | placeholder_only | hidden`, `actionabilityState = enabled | regenerate_only | observe_only | blocked_by_policy | blocked`, `confidencePostureState = conservative_band | suppressed | hidden`, `completionAdjacencyState = blocked | observe_only | allowed`, `blockingReasonRefs[]`, `computedAt`

`AssistiveCapabilityTrustEnvelope` is the sole staff-workspace authority for whether the assistive stage may render as interactive summary, observe-only summary, provenance-only, placeholder-only, or hidden, and for whether confidence bands, insert, regenerate, export, or completion-adjacent cues may remain live. `AssistiveSurfaceBinding`, rollout verdict, capability trust projection, freeze frame, `WorkspaceTrustEnvelope`, and assistive continuity evidence all feed it, but none of those producers may independently restore healthy posture once the envelope has degraded.

**AssistiveWorkspaceStageBinding**
`assistiveStageBindingId`, `taskId`, `assistiveSessionRef`, `assistiveFeedbackChainRef`, `assistiveSurfaceBindingRef`, `workspaceTrustEnvelopeRef`, `assistiveCapabilityTrustEnvelopeRef`, `presentationContractRef`, `reviewVersionRef`, `policyBundleRef`, `lineageFenceEpoch`, `selectedAnchorRef`, `stageMode = summary_stub | inline_side_stage | draft_insert_only | observe_only | provenance_only | placeholder_only | hidden`, `summaryStubRef`, `provenanceEnvelopeRefs[]`, `confidenceDigestRefs[]`, `freezeFrameRef`, `latestActionRecordRef`, `currentOverrideRecordRef`, `currentApprovalGateAssessmentRef`, `currentFinalHumanArtifactRef`, `feedbackEligibilityFlagRef`, `feedbackCaptureState = capture_pending | reason_required | approval_pending | settled | excluded | revoked`, `pinnedState = auto | user_pinned | user_collapsed`, `trustState = trusted | degraded | quarantined | shadow_only | frozen`, `staleAt`, `invalidatedAt`

**AssistiveSummaryStub**
`assistiveSummaryStubId`, `assistiveStageBindingRef`, `assistiveCapabilityTrustEnvelopeRef`, `headlineRef`, `supportingTextRef`, `artifactCount`, `confidenceBand`, `freshnessState`, `trustState`, `surfacePostureState`, `freezeState`, `feedbackCaptureState`, `dominantSafeActionRef`, `renderedAt`

**TaskCompletionSettlementEnvelope**
`taskCompletionSettlementEnvelopeId`, `taskId`, `actionType`, `selectedAnchorRef`, `sourceQueueRankSnapshotRef`, `workspaceTrustEnvelopeRef`, `localAckState`, `authoritativeSettlementState = pending | settled | recovery_required | manual_handoff_required | stale_recoverable`, `nextOwnerRef`, `closureSummaryRef`, `blockingReasonRefs[]`, `nextTaskLaunchState = blocked | gated | ready | launched`, `nextTaskLaunchLeaseRef`, `experienceContinuityEvidenceRef`, `releaseConditionRef`, `settledAt`

**OperatorHandoffFrame**
`operatorHandoffFrameId`, `taskId`, `handoffType`, `nextOwnerRef`, `readinessSummaryRef`, `pendingDependencyRefs[]`, `confirmedArtifactRef`, `settlementState`, `generatedAt`

**WorkspaceContinuityEvidenceProjection**
`workspaceContinuityEvidenceProjectionId`, `taskId`, `controlCode = workspace_task_completion`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `sourceQueueRankSnapshotRef`, `latestTaskCompletionSettlementRef`, `latestPrefetchWindowRef`, `latestNextTaskLaunchLeaseRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `nextTaskLaunchState = trusted_ready | trusted_blocked | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`WorkspaceContinuityEvidenceProjection` binds task completion, in-shell recovery, and next-task launch posture to the assurance spine. The workspace may preserve queue context and anchors locally, but it may not present a task as calmly complete or launch the next task unless the current `ExperienceContinuityControlEvidence` still validates the same task shell, selected-anchor tuple, settlement chain, and live publication tuple.

Assistive coexistence is governed, not decorative. Every `AssistiveWorkspaceStageBinding` must carry one `AssistiveCompanionPresentationProfile`, one current `WorkspaceTrustEnvelope`, one current `AssistiveCapabilityTrustEnvelope`, one current `AssistiveFeedbackChain`, one summary stub, the current provenance envelope, current confidence digest, and any active freeze frame. If those elements cannot be resolved, the assistive region must fall back to summary-only, observe-only, provenance-only, placeholder-only, or hidden posture instead of improvising a richer rail.
The assistive stage must also surface the chain's current feedback-capture posture in one place. Reason-required, approval-pending, settled, excluded, and revoked states may not be inferred from local edit badges, missing diffs, or queue calmness; they must come from the bound `AssistiveFeedbackChain`, `OverrideRecord`, `HumanApprovalGateAssessment`, `FinalHumanArtifact`, and `FeedbackEligibilityFlag`.

Trust-gated visibility is fixed for the workspace and must resolve through `AssistiveCapabilityTrustEnvelope`, not local chrome state: `trusted` may show summary stub or interactive side-stage, `degraded` may show observe-only summary plus provenance and recovery, `quarantined` may show provenance-only or placeholder, `shadow_only` may show badge-level awareness or internal diagnostics only, and `frozen` may preserve read-only provenance only under the current freeze disposition. The UI may never silently hide a degraded or quarantined assistive artifact if that artifact is still relevant to the active task history, and `TaskWorkspaceProjection`, `AssistiveWorkspaceStageBinding`, and `AssistiveSummaryStub` must agree on the same `assistiveCapabilityTrustEnvelopeRef` whenever assistive chrome is visible.

**NextTaskPrefetchWindow**
`nextTaskPrefetchWindowId`, `sourceTaskRef`, `launchContextRef`, `candidateTaskRefs[]`, `sourceQueueKey`, `sourceRankSnapshotRef`, `continuityEvidenceRef`, `prefetchBudget = summary_only | summary_plus_delta_stub`, `prefetchState = idle | active | cancelled | stale | blocked | warmed`, `blockingReasonRefs[]`, `issuedAt`, `expiresAt`

`NextTaskPrefetchWindow` is the only allowed background warm path for the next recommended task set. It may prefetch summary and decisive-delta stubs, but it may not hydrate heavy attachments, full chronology, compose surfaces, or any writable lease. Queue drift, focus protection, settlement drift, or continuity drift must cancel it immediately in place.

**NextTaskLaunchLease**
`nextTaskLaunchLeaseId`, `sourceTaskRef`, `launchContextRef`, `prefetchWindowRef`, `nextTaskCandidateRef`, `sourceSettlementEnvelopeRef`, `continuityEvidenceRef`, `sourceQueueKey`, `sourceRankSnapshotRef`, `returnAnchorRef`, `launchEligibilityState = blocked | ready | stale | continuity_blocked`, `blockingReasonRefs[]`, `issuedAt`, `expiresAt`, `leaseState`

**WorkspaceSurfaceState**
`workspaceSurfaceStateId`, `surfaceRef = home | queue | task | side_stage`, `surfacePostureFrameRef`, `workspaceTrustEnvelopeRef`, `selectedAnchorRef`, `queueContextRef`, `surfaceState = loading | no_actionable_work | filtered_empty | reassigned | observe_only | recovery_required`, `headlineRef`, `explanationRef`, `dominantActionRef`, `placeholderContractRef`, `staleOwnerRecoveryRef`, `lastKnownGoodTaskRef`, `renderedAt`

`WorkspaceSurfaceState` is the explicit no-work, filtered-empty, reassignment, and stale-task recovery contract for the same shell. It derives from `WorkspaceSurfacePosture` and `SurfacePostureFrame`, keeping the queue and active task calm without auto-jumping the operator to a new row or forcing a generic empty board.

Rules:

- all workspace projections must materialize under the canonical `VisibilityProjectionPolicy`; no queue, preview, interruption, or task surface may widen audience scope after projection
- every start-of-day, queue, task, and side-stage surface must publish one `WorkspaceSurfaceState`
- `QueueWorkbenchProjection`, `TaskWorkspaceProjection`, and `InterruptionDigestProjection` must assemble beneath one current `WorkspaceTrustEnvelope` bound to one `StaffWorkspaceConsistencyProjection` plus one `WorkspaceSliceTrustProjection`; if `CasePulse`, the shared status strip, `DecisionDock`, or next-task CTA no longer share that same envelope tuple, mutating controls freeze and the shell falls to bounded refresh or recovery
- `WorkspaceSliceTrustProjection` must expose degraded or quarantined queue, attachment, assistive, and dependency slices explicitly; degraded trust may compress chrome, but it may not flatten operational risk into an ordinary healthy state
- `WorkspaceTrustEnvelope` is the sole authority for `mutationAuthorityState`, `interruptionPacingState`, and `completionCalmState`; route-local flags, queue row badges, cached preview state, detached settlement chips, or warmed next-task candidates may not independently restore interactive, buffered, or calmly complete posture
- loading posture uses region skeletons only; once the current workspace surface is known, generic full-board spinners are forbidden
- `no_actionable_work` and `filtered_empty` must explain why the queue is quiet and what the fastest safe next action is
- if the active task is reassigned, merged, or leaves scope, the same task shell must preserve the row stub and last safe task summary as `reassigned`, freeze mutation, and offer reacquire or return; it may not auto-jump to a sibling row
- observe-only and recovery posture must preserve queue context, selected anchor, and the last safe closure or task summary until the operator explicitly releases them
- queue list data and task canvas data must be split so opening a task does not re-fetch the entire queue payload
- `QueueScanSession` and `QueuePreviewDigest` are the only allowed scan-to-open contracts; preview may not mint `ReviewActionLease`, clear changed-since-seen state, or hydrate heavy media
- `NextTaskPrefetchWindow` is the only allowed background warm path for recommended next work; it must stay summary-first, cancellable, and read-only, and it may not move focus, reserve a task, clear changed-since-seen state, or bypass `NextTaskLaunchLease`
- `QueueWorkbenchProjection`, `QueueScanSession`, and `QueuePreviewDigest` must bind one committed `rankSnapshotRef`, and `NextTaskLaunchLease` must bind `sourceRankSnapshotRef`; preview, row order, and next-task progression may not silently combine ordinals from different queue snapshots
- `TaskLaunchContext.nextTaskCandidateRefs`, `NextTaskPrefetchWindow.candidateTaskRefs[]`, `TaskCompletionSettlementEnvelope.sourceQueueRankSnapshotRef`, `WorkspaceContinuityEvidenceProjection.sourceQueueRankSnapshotRef`, and `NextTaskLaunchLease.sourceRankSnapshotRef` must match unless the shell explicitly degrades to stale or recovery posture
- `QueueRowPresentationContract` must keep primary and secondary lines stable under live updates; tertiary detail belongs in preview, not in the resting row body
- `TaskWorkspaceProjection` must be segmented into summary-first, evidence, timeline, and attachment chunks so the first usable paint happens before heavier media loads
- every open task must resolve one `TaskCanvasFrame`; `openingMode = resumed_review` must expand `deltaStackRef` before `referenceStackRef`, bind the current authoritative `EvidenceDeltaPacket`, and land the reviewer on the primary changed decision surface
- `EvidenceDeltaPacket.deltaClass = decisive | consequential` may invalidate commit posture and force explicit re-check; `contextual | clerical` may annotate in place without stealing focus
- `TaskCanvasFrame.supersededContextRefs[]` must preserve prior endpoint assumptions, approval posture, ownership context, or duplicate-lineage interpretation with explicit supersession markers until the reviewer acknowledges the delta or recommits intentionally
- `InterruptionDigestProjection` owns alert budgeting inside the task shell; no local panel may invent competing urgent chrome
- `RapidEntryDraft` must survive stale projection refresh, reconnect, and reversible route changes within the same task shell
- if the active `ReviewActionLease`, bound `RequestLifecycleLease`, or any linked support-action ownership advances `ownershipEpoch`, expires, or is superseded, `WorkspaceSurfaceState(surfaceState = recovery_required | reassigned)` must materialize from the current `StaleOwnershipRecoveryRecord`; drafts, selected anchor, and the last safe task summary stay visible, but live commit controls stay frozen until reacquire or takeover settlement completes
- `WorkspaceFocusProtectionLease` must always pair with one `ProtectedCompositionState`; buffered live updates may bypass that state only for blocking truth or the local acknowledgement explicitly allowed by `allowedLivePatchMode`
- ownership, review-version, lineage, publication, trust, selected-anchor, compare-target, or insertion-point drift during protected work must set `WorkspaceFocusProtectionLease.leaseState = invalidated`; the current composer, compare surface, or approval frame stays visible as `stale_recoverable | recovery_only` posture instead of retargeting to a fresh row, editor, or candidate
- active focus protection and protected composition must also drive `WorkspaceTrustEnvelope.interruptionPacingState = buffered | blocking_only`; queue reorder, interruption promotion, assistive promotion, and next-task warm paths may not seize the primary region while the current envelope still protects the active work
- releasing protected work must restore `priorQuietRegionRef`, `selectedAnchorRef`, `primaryReadingTargetRef`, and any still-valid compare anchors once `releaseGateRef` clears; if a blocker remains, the shell stays in review-required or recovery posture rather than resetting to a generic task default
- `WorkspaceProminenceDecision` is the only contract allowed to auto-promote `EvidencePrism`, `StateBraid`, approval review, handoff review, duplicate compare, or `AssistiveWorkspaceStage`
- every mutating queue or task action must hold a live `ReviewActionLease`; stale queue rank, review version, lineage fence drift, or stale `ownershipEpochRef` plus `fencingToken` must fail closed and require bounded refresh or reacquire instead of allowing optimistic submission
- `DecisionCommitEnvelope` must keep preview, approval, commit-pending, superseded, and recovery posture in the same shell; local success copy may not outrun the envelope state
- `DecisionCommitEnvelope.decisionEpochRef` is the only commit-ready decision fence for the active task shell; if the epoch is superseded, every preview, approval CTA, handoff CTA, and close CTA must freeze immediately and point to `latestDecisionSupersessionRef` rather than silently reusing the stale preview
- task completion and next-task posture must also validate `WorkspaceContinuityEvidenceProjection`; if continuity evidence is stale or blocked, the shell may preserve queue context, closure summary, and the current anchor, but it must not show quiet completion or activate `Next best task`
- `TaskCompletionSettlementEnvelope`, `NextTaskLaunchLease`, and `WorkspaceContinuityEvidenceProjection` must keep `WorkspaceTrustEnvelope.completionCalmState = pending_settlement | blocked` until authoritative settlement and next-task readiness are proven; queue-local completion inference, local acknowledgement, or warmed candidate state may not restore quiet completion or ready launch posture
- if live queue data lands from a newer rank snapshot while a task or preview is pinned, expose it only through `QueueChangeBatch(sourceRankSnapshotRef, targetRankSnapshotRef)` and keep the current row anchored until explicit apply, idle-safe apply, or recovery
- `OperatorHandoffFrame` must keep next-owner baton, readiness summary, and outstanding dependencies visible until downstream acknowledgement or governed recovery settles
- `QueueWorkbenchProjection` and `TaskWorkspaceProjection` must also publish the current `PrimaryRegionBinding`, `StatusStripAuthority`, `DecisionDockFocusLease`, `MissionStackFoldPlan`, and any active `QuietSettlementEnvelope` or `CalmDegradedStateContract`; the review canvas may not appear calmer, greener, or more writable than those shell-level contracts allow
- `QueueWorkbenchProjection`, `TaskWorkspaceProjection`, `InterruptionDigestProjection`, and `WorkspaceSurfaceState` must publish the same `workspaceTrustEnvelopeRef`; disagreement between those refs is itself a fail-closed recovery condition

## Workspace posture and artifact continuity

Every queue, task, completion, and next-task transition must derive one stable workspace posture from `SurfacePostureFrame` so staff never lose their row, task summary, or decision context when truth refreshes or settlement lags.

Add these workspace adapters:

**WorkspaceSurfacePosture**
`workspaceSurfacePostureId`, `routeFamilyRef`, `queueKey`, `taskId`, `surfacePostureFrameRef`, `workspaceConsistencyProjectionRef`, `selectedAnchorRef`, `dominantQuestionRef`, `dominantActionRef`, `recoveryActionRef`, `renderedAt`

**WorkspaceArtifactFrame**
`workspaceArtifactFrameId`, `taskId`, `artifactRef`, `artifactSurfaceFrameRef`, `maskScopeRef`, `returnAnchorRef`, `structuredSummaryRef`, `generatedAt`

Rules:

- queue-empty and filter-empty must not share copy or posture. When no task exists, `SurfacePostureFrame` must distinguish calm no-work from filtered-no-results and keep queue choice, filters, and return context visible
- opening a known task with incomplete projections must use `SurfacePostureFrame(postureState = loading_summary)` so preview, queue context, `CasePulse`, and the current anchor stay present; the task plane may not blank
- claim, request-more-info, send-more-info, decision, self-care issue, admin completion, and next-task launch must use `SurfacePostureFrame(postureState = settled_pending_confirmation)` until `TaskCompletionSettlementEnvelope` or the governing settlement becomes authoritative; `accepted_for_processing`, `projection_visible`, or other non-terminal settlement phases may widen pending guidance, but quiet completion may not outrun `authoritativeOutcomeState = settled`
- attachment previews, outbound drafts, resolution summaries, and completion artifacts must render through `WorkspaceArtifactFrame` plus `ArtifactSurfaceFrame`; inline summary and provenance come before download, print, or external handoff
- in `mission_stack`, the workboard, task canvas, and `DecisionDock` are folded views of the same `WorkspaceSurfacePosture`; narrow screens may not lose queue context, selected anchor, or pending settlement posture

## Layout topology

### Desktop default: adaptive two-plane workbench

Default staff layout is `two_plane`:

1. **Workboard plane** on the left
   - queue switcher
   - saved views
   - queue health mini-digest
   - virtualized task list
   - compact next-up and changed-since-seen stubs
2. **Task plane** on the right
   - `CasePulse`
   - shared status strip
   - task canvas
   - sticky `DecisionDock`
   - peek or pinned `ContextConstellation`
   - summary-stub or side-stage `AssistiveWorkspaceStage` only when permitted by `AttentionBudget`, the current `AssistiveCapabilityTrustEnvelope`, and `AssistiveCompanionPresentationProfile`

The workboard stays visible while a task is open, but it compresses to a narrower navigator once review begins. The task plane becomes dominant without hiding where the task came from.

### Three-plane escalation or compare mode

Promote to `three_plane` only when one of these is true:

- blocker-heavy review needs persistent `EvidencePrism`
- urgent escalation stage is active
- duplicate or compare workflow is open
- supervisor or approval review requires side-by-side consequence context
- user explicitly pins context

In `three_plane`, the third plane is a dedicated `ContextConstellation` posture. It may host `EvidencePrism`, `StateBraid`, approval preview, duplicate comparison, or escalation contact stage, but only one of those at full prominence at a time.

If assistive review is active, it must occupy the bounded `AssistiveWorkspaceStage` inside the same topology rather than adding a second competing rail or replacing the primary task canvas. If `EvidencePrism`, compare mode, or urgent escalation already owns the single promoted support slot, assistive content must collapse back to `AssistiveSummaryStub` unless the user explicitly pins it.

### Narrow layouts

On narrow desktop or tablet, collapse the workboard to a resizable drawer and move `DecisionDock` to a bottom sticky action bar. Mobile staff use `mission_stack` with:

- top summary strip
- list or task body
- bottom action tray
- swipeable context tabs instead of side rails

The narrow shell must follow one `MissionStackFoldPlan`; fold and unfold must preserve the active queue row, blocker stub, composer draft, and `DecisionDock` state. Tablet and mobile views are folded expressions of the same shell, not a second workflow. On tablet and mobile, `AssistiveWorkspaceStage` must demote to a tab or bottom drawer tied to the same binding; it may not obscure the active insertion point, `DecisionDock`, or current recovery action.

## Workspace density posture, visual hierarchy, and token bindings

This section operationalizes `design-token-foundation.md` for dense clinical review without creating a second local token system.

Rules:

- queue scan defaults to `profile.staff_workspace` with compact `list` and `table` surface roles; blocked, returned, or approval-gated rows may elevate posture, but they must still resolve through the canonical workspace profile rather than local density math
- row height, preview-pocket width, workboard width, promoted support width, sticky action-lane sizing, and fold-breakpoint behavior must bind to the active `ShellVisualProfile` plus the canonical pane, spacing, and density tokens; route-local px tables are forbidden here
- resting rows hold exactly two scan lines under `QueueRowPresentationContract`; tertiary explanation, evidence snippets, and heavyweight attachment affordances belong in `QueuePreviewDigest` or `TaskCanvasFrame`
- queue and task body may remain compact, but `CasePulse`, the shared status strip, consequence review, and `DecisionDock` must step back to balanced posture for clarity at commit time
- task copy uses the canonical editorial-operational type roles with tabular numerics; headings escalate only at stack boundaries so the canvas reads as one instrument rather than a card wall
- state emphasis binds to the smallest meaningful element through the shared semantic roles: signal rail, delta marker, inline chip, freshness cue, trust marker, or boundary stroke. Full-panel fills are reserved for urgent or blocked posture
- authoritative success color or calm completion cues are illegal for preview, local draft, pending approval, pending handoff, or locally acknowledged states; those states stay provisional until `DecisionCommitEnvelope`, `TaskCompletionSettlementEnvelope`, or downstream authoritative settlement turns them final
- preview reveal, same-shell morph, diff reveal, and handoff emphasis must snap to the shared motion tokens from `design-token-foundation.md`; reduced motion preserves changed-state meaning through outline, copy, and static highlight rather than spatial travel
- at `xl` and above, keep the workboard visible and allow one promoted support region within canonical pane tokens; at `lg`, the workboard may compact; at `md`, it becomes a drawer; below `lg`, fold to `mission_stack`
- dense utility controls may live inside rows, but irreversible or owner-changing actions must keep the shell minimum hit target and remain in the stable `DecisionDock` action lane
- screen readers, zoomed layouts, and high-contrast modes must preserve row order, chip meaning, delta visibility, and changed-since-seen posture without relying on color or hover alone

## Screen anatomy

### 1. Start-of-day `WorkspaceHome`

Default modules, in order:

1. `TodayWorkbenchHero`
   - recommended queue
   - next task
   - personal carry-over work
2. `InterruptionDigest`
   - urgent approvals
   - patient returns
   - escalations
3. `TeamRiskDigest`
   - queue SLA pressure
   - dependency degradation
   - backlog warnings
4. `RecentResumptionStrip`
   - last worked items
   - resume in one action

Rules:

- only the recommended queue is expanded by default
- interruption counts are summary-level until selected
- team risk stays compact unless thresholds cross into blocking territory
- no charts on first load; use ranked lists and compact numeric digests
- if the recommended queue, carry-over strip, or saved-view set is empty, render a calm orientation state that explains why the surface is quiet, what usually appears here, and the fastest safe next action; do not backfill the home shell with charts or repeated summary cards
- if no queue, interruption, or carry-over module exceeds the attention threshold, collapse `WorkspaceHome` to one calm `SurfaceStateFrame(stateClass = sparse)` headed by the safest useful next step; do not render empty charts, zero-state alert boards, or duplicate reassurance copy across modules
- if one module is stale or blocked, keep the rest of `WorkspaceHome` usable and localize the recovery posture to that module or the recommended next-action tile
- when the recommended queue is genuinely quiet, replace the empty task list with one calm `No work right now` state that explains whether the queue is clear, filtered, paused, or observe-only and offers the next safest path such as another queue, approvals, or interruption review

### 2. Queue workboard

Queue row anatomy must fit expert scanning and preserve a stable two-line read at dense posture:

- left signal rail: a narrow semantic rail for priority, returned evidence, or blocked-truth state; every rail must be paired with a label or chip so color is never the only cue
- primary line: patient or request label plus one concise reason summary, clamped to one line under `QueueRowPresentationContract`
- secondary line: due time, elapsed age, queue explanation, and freshness timestamp, clamped to one line with tabular numerics
- tertiary detail is forbidden in the resting row and belongs in `QueuePreviewDigest`, not the list body
- right cluster: assignee or lock state, changed-since-seen cue, approval or review-required cue, and one next-action chip; reserve the width so hover and live updates do not shift scan alignment

Interaction rules:

- hover or keyboard focus starts `QueueScanSession(sessionState = preview_peek)` after `80-120 ms` dwell and opens `QueuePreviewDigest` in a lightweight preview pocket
- single click or Enter pins that preview as `preview_pinned`; double click, Shift+Enter, or Enter again from the pinned preview opens the full task
- preview is summary-first and read-only: it may show reason, decisive delta summary, blockers, ownership, next action, and attachment availability, but it may not hydrate heavy media, mint `ReviewActionLease`, or clear changed-since-seen state
- fast scan cancel, rank-snapshot drift, or focus leaving the row must cancel `preview_peek` immediately without preserving warmed writable context; only explicit pin or open may keep the digest alive
- Claim, Start review, and Next recommended task must be available from keyboard without leaving the list
- preview pocket must follow the canonical pane tokens and keep the queue list fully visible; preview is a scan aid, not a second work surface
- reordering caused by live changes is buffered through `QueueChangeBatch`
- the active row stays pinned even if the queue rank changes
- filter-empty and true-quiet queues must render through `SurfaceStateFrame(stateClass = empty | sparse)` anchored to the list region, with filter explanation, one dominant recovery action, and optional saved-view shortcuts instead of a dead table
- if the active row settles, moves, or is removed by live change, keep its `SelectedAnchor` visible long enough to explain the change and offer the nearest safe next item before collapsing back to the quiet queue frame
- if the active row is reassigned, merged, or leaves scope, keep an anchored stub with the last safe summary and a reacquire path instead of silently moving focus to the next row

### 3. Active task shell

The task plane is organized as:

1. **CasePulse band**
   - patient identity confidence
   - request type
   - queue or priority
   - ownership
   - SLA posture
   - last trustworthy update
2. **Shared status strip**
   - save, sync, and freshness
   - queued live updates
   - waiting on external
   - review-required state
3. **Task canvas via `TaskCanvasFrame`**
   - `SummaryStack`: clinician-ready summary, dominant question, and current ownership or consequence headline
   - `DeltaStack`: decisive and consequential changes since last seen, expanded first for `openingMode = resumed_review | approval_review | handoff_review`
   - `EvidenceStack`: structured facts, returned answers, contradictions, requested-evidence anchors, and compact lineage strip
   - `ConsequenceStack`: consequence preview, approval summary, next-owner baton, and completion or handoff artifact when active
   - `ReferenceStack`: narrative, full `StateBraid`, attachments, audio, and audit detail, collapsed by default
4. **Sticky DecisionDock**
   - next best action
   - endpoint shortlist
   - more-info
   - escalate
   - release, close, and handoff actions as allowed

Rules:

- first-review entry expands `SummaryStack` plus the minimum evidence needed for safe action; resumed review expands `SummaryStack` plus `DeltaStack` before any full-history content
- `EvidenceDeltaPacket` is the only allowed changed-evidence artifact; decisive and consequential deltas land in place and may invalidate commit posture, while contextual and clerical deltas annotate without stealing focus
- resumed review with material change must bind `TaskCanvasFrame.deltaPacketRef`, open `DeltaStack` first, and preserve the previous judgment context as superseded cards or chips instead of silently replacing it
- attachments and audio must render as inline digest cards first and open their heavier viewers only on demand
- `ApprovalReviewFrame` and `OperatorHandoffFrame` may occupy `ConsequenceStack` or the promoted support region, but they may not replace `SummaryStack` or hide the source evidence that produced the decision

`StateBraid`, `EvidencePrism`, approval review, duplicate compare, and `ContextConstellation` begin as collapsed summary stubs. `WorkspaceProminenceDecision` chooses which one may promote.

When blocker, compare, or reopened-review posture resolves, `WorkspaceProminenceDecision.quietReturnTargetRef` must restore the prior quiet support region unless the reviewer pinned a richer region manually. Promoted delta detail may not linger just because it was once auto-promoted.

`AssistiveWorkspaceStage` begins as a summary stub or quiet badge. `AssistiveSummaryStub` must show the capability label, one bounded rationale line, the current confidence or abstention band, provenance or freshness, and the dominant safe action in that order. It may promote to `InlineSideStage` only when Phase 8 policy, trust state, and the current `AttentionBudget` allow it; assistive summaries, drafts, and insert actions may not displace the main clinical review canvas without explicit user intent.

The task canvas owns one `PrimaryRegionBinding`; live invalidation may mark that binding `review_required` or `blocked`, but it may not swap the user to a sibling task, a different evidence slice, or an assistive pane. `DecisionDock` is the only dominant commit-ready action region while `DecisionDockFocusLease` is active. Completion, more-info send, handoff, and next-task launch may not collapse back to calm until the current `QuietSettlementEnvelope`, `DecisionCommitEnvelope`, or `TaskCompletionSettlementEnvelope` authorizes it.

### 4. Rapid-entry layer

Rapid entry is mandatory because staff frequently know the next action before they have finished reading every detail.

Add a `QuickCaptureTray` to `DecisionDock` with:

- structured endpoint shortcuts
- templated question sets
- one-key reason chips
- inline note field
- reusable admin resolution macros
- due-date quick picks for callbacks or more-info

Rules:

- use one tab cycle from summary to action composer
- favor chip-plus-text combo inputs over deep modal forms
- autosave locally within 250 ms and acknowledge through the shared status strip
- irreversible actions require `ConsequencePreview`, but reversible draft composition must remain inline
- new question set or reason text must not clear when evidence refreshes unless a true conflict is detected
- `QuickCaptureTray`, side-stage send, and irreversible decision actions must all revalidate a live `ReviewActionLease` before submit; local draft acknowledgement is not permission to mutate task state
- when the user is composing, comparing, confirming, or reviewing a highlighted delta, create `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` and buffer disruptive task or queue deltas through `DeferredUIDelta` or `QueueChangeBatch` until the protected action settles or the user releases focus

### 5. Protected composition, approval posture, and decision commitment

When the reviewer is drafting, comparing, reviewing deltas, confirming consequences, preparing handoff, or working a delivery dispute, the shell must hold one explicit `ProtectedCompositionState` in addition to `WorkspaceFocusProtectionLease`.

Rules:

- `compositionMode = drafting` allows local autosave and non-disruptive updates outside the focused composer; contextual and disruptive deltas buffer
- `compositionMode = compare_review` pins the current compare subjects, selected slot or candidate anchors, and quiet-return target; live ranking or candidate refresh may surface only as buffered delta or stale-recoverable invalidation until the reviewer explicitly applies or releases the comparison
- `compositionMode = delta_review` expands `EvidenceDeltaPacket` and freezes endpoint commit until the reviewer acknowledges decisive or consequential changes
- `compositionMode = approval_review` opens `ApprovalReviewFrame` as a bounded side stage or `ConsequenceStack` card showing decision summary, irreversible effects, approver role, and current settlement; approval may not replace the task canvas or hide the source evidence
- `compositionMode = consequence_confirm` uses `DecisionCommitEnvelope` to hold `drafting -> previewing -> awaiting_approval -> commit_pending -> settled | recovery_required` in the same shell; no full-page success, detached modal workflow, or optimistic completion page is allowed
- `compositionMode = handoff_review` shows `OperatorHandoffFrame` with next owner, readiness summary, unresolved dependencies, and confirmed artifact before the shell can present calm completion or activate `Next best task`
- `compositionMode = delivery_dispute_review` pins the disputed route, current delivery evidence, and repair form in place; contradictory receipts may freeze or invalidate the state, but they may not replace it with a fresh ticket or thread summary
- while any protected composition state is active, only blocking truth and locally initiated acknowledgement may bypass buffering, and even those may not clear the current anchor, compare target, insertion point, or quiet-return target
- if `stateValidity = stale_recoverable | recovery_only`, keep the draft, compare subject, approval frame, or assistive insertion point visible as frozen provenance with exact recovery guidance; generic stale panels and silent resets are forbidden

### 5A. Focus-protection acquisition and release

- entering more-info compose, duplicate compare, approval confirm, handoff review, booking compare, delivery-dispute review, or assistive insert must create or renew both `WorkspaceFocusProtectionLease` and `ProtectedCompositionState` bound to the current `ReviewActionLease`, selected anchor, any compare anchors, the current reading target, and the prior quiet region
- incoming ownership, review-version, lineage, publication, trust, selected-anchor, compare-target, or insertion-point drift must mark the lease `invalidated`, freeze live commit or insert controls in place, and keep the protected work visible as stale-recoverable context rather than retargeting to a different row, task, or editor instance
- `DeferredUIDelta` and `QueueChangeBatch` may accumulate against the active protection window, but they may not clear the protected draft, compare state, or quiet-return target until the reviewer explicitly applies updates, acknowledges the decisive delta, or settles the focused action
- release is legal only on authoritative settlement, explicit discard, compare close, or governed recovery; after clean release the shell restores the prior quiet region and reading target, and after invalidated release it remains in review-required or recovery posture with the last safe protected context still visible

### 6. Delta review and support-region promotion

`EvidenceDeltaPacket` is the only allowed changed-evidence presentation contract. It must classify each incoming change as `decisive`, `consequential`, `contextual`, or `clerical`.

Rules:

- `decisive` covers safety changes, identity drift, endpoint invalidation, approval invalidation, ownership changes, or direct contradictions; it must mark the task `review_required`, expand the changed evidence in place, and freeze commit until acknowledged
- `consequential` covers material patient return, changed handoff readiness, or altered consequence context; it may expand `DeltaStack` or the currently relevant support region without replacing the task summary
- `contextual` enriches chronology or non-blocking evidence and should surface as changed-since-seen annotation while remaining collapsed by default
- `clerical` never triggers support-region promotion, quiet-posture reset, or commit invalidation
- exactly one authoritative `EvidenceDeltaPacket` may govern a resumed-review render for a given baseline and current snapshot pair; changed-since-seen chips, contradiction markers, and promoted support regions must all derive from that packet rather than from independent local heuristics
- `supersededJudgmentContextRefs[]` and `supersessionMarkerRefs[]` must make prior endpoint, ownership, duplicate-lineage, and approval assumptions legible until acknowledgement or recommit; stale context may not vanish under the new delta
- let `prominenceScore_r = 0.35 * decisionRisk_r + 0.25 * actionDependency_r + 0.20 * novelty_r + 0.20 * trustImpact_r + pinBoost_r - protectionPenalty_r`, where `decisionRisk_r`, `actionDependency_r`, `novelty_r`, and `trustImpact_r` are normalized to `[0,1]`
- default staff tuning is `theta_enter = 0.58`, `theta_exit = 0.46`, `delta_promote = 0.12`, `m_hold = 2`, `pinBoost_r <= 0.15`, and `protectionPenalty_r <= 0.20`
- `WorkspaceProminenceDecision` may auto-promote region `r` only when `prominenceScore_r >= theta_enter`, `prominenceScore_r - prominenceScore_current >= delta_promote`, and no active `ProtectedCompositionState` forbids the swap
- demotion requires `prominenceScore_r < theta_exit` for `m_hold` consecutive evaluations; when the promotion reason clears, restore the last quiet posture unless the user pinned richer context
- only one support region may auto-promote at once in routine review

## Alert-fatigue mitigation contract

Create a strict four-tier interruption model:

1. **blocking**
   - stale truth blocking safe action
   - urgent escalation active
   - approval required before commit
   - permission or policy denial
2. **urgent actionable**
   - patient returned with material new evidence
   - SLA breach requiring review soon
   - downstream handoff failed and needs recovery
3. **watch**
   - queue health deterioration
   - non-blocking dependency degradation
   - unread messages or callbacks due later
4. **silent**
   - routine saved-state, passive freshness, non-material feed updates

Rendering rules:

- only blocking items may become a shell-level banner or promoted urgent stage
- urgent actionable items render first in `InterruptionDigest` and may promote one support region
- watch items stay in compact digest cards or row badges
- silent items remain in the shared status strip or local inline cues
- no more than one full-width banner and one promoted support region may be visible simultaneously
- duplicate statuses across strip, digest, banner, and row cue must be collapsed before render
- auto-promotion must obey cooldown and composition locks from `AttentionBudget`
- degraded or quarantined trust slices from `WorkspaceSliceTrustProjection` must remain visible with exact blocking reason and fallback mode; they may not flatten to healthy queue badges, generic `data unavailable`, or silent disappearance

## Streamlined user flow contracts

### Queue to review

1. user lands on recommended queue
2. queue focus starts on the first actionable row
3. preview loads through `QueueScanSession` on focus
4. Claim or Start review mints a `ReviewActionLease` from the current row, queue batch, and selected anchor; stale row rank or lock drift must fail closed before the task opens
5. task opens inside the same shell with queue context preserved and one current `WorkspaceTrustEnvelope` assembled from the same queue snapshot, `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, selected-anchor tuple, publication tuple, and live action lease
6. focus moves to the first unread or highest-consequence section in the task canvas

### Review to more-info

1. user triggers `DecisionDock -> Request more info`; the shell creates or resumes one `MoreInfoComposeSession` bound to `taskId`, `reviewVersion`, `workspaceSnapshotVersion`, `questionSetVersion`, `selectedAnchorRef`, and `lineageFenceEpoch` so draft meaning cannot silently drift during projection refresh
2. `InlineSideStage` opens with suggested question sets and draft region, but if an active `MoreInfoCycle` or unsent patient-facing draft already exists for the lineage the shell must resume that exact cycle in place, load the current `MoreInfoStatusDigest`, and require explicit supersession before a second routine request can be created
3. `InlineSideStage` must render `ContactRoutePreview` before send with destination mask, channel eligibility, quiet-hours posture, translation or accessibility flags, due date, reminder schedule, and patient-visible copy. Due date and reminder schedule must come from the current `MoreInfoReplyWindowCheckpoint` and `MoreInfoReminderSchedule`; local quick picks may propose alternatives, but they may not become live without minting a new checkpoint revision. Unverified or policy-denied routes block send inside the same shell
4. selected evidence anchors remain visible in the task canvas and stay bound to the composer as stale-aware references; if authoritative evidence, ownership, or safety truth changes while composing, the draft stays recoverable but send freezes, stale chips are annotated, and the task is marked `review_required`
5. while the composer is active, hold `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState(compositionMode = drafting)` so assistive suggestions, queue churn, and non-blocking deltas cannot replace the promoted support region, current anchor, draft text, or quiet-return target; ownership, publication, trust, or selected-anchor drift must freeze send in place until explicit release or reacquire
6. send dispatches through the governed workspace command path with idempotency and same-shell settlement; `awaiting_patient_info` posture appears only after authoritative `TaskCommandSettlement` acceptance, and the shell keeps the exact `MoreInfoCycle` receipt, `MoreInfoStatusDigest`, due-state summary, reminder controls, and release or resume controls without navigation reset
7. if the cycle later enters `late_review | expired | superseded | repair_required`, or a reply lands as `accepted_late_review | superseded_duplicate | expired_rejected`, the same task shell must update in place from `MoreInfoStatusDigest` plus `MoreInfoResponseDisposition`; a detached follow-up page, a silent queue-row-only change, or a local countdown takeover is forbidden

### Patient return to resumed review

1. `InterruptionDigest` shows returned evidence count plus the current `MoreInfoResponseDisposition` when the reply was late, superseded, or rejected
2. reopening the task lands on a delta-first resume summary keyed to the same `MoreInfoStatusDigest`
3. changed sections are highlighted in place
4. old context remains reachable through collapsed comparison, not a second full page
5. first dominant action becomes `Resume review`

Rollout and backfill for delta-first review:

- rebuild `EvidenceDeltaPacket` from `baselineSnapshotRef = last acknowledged evidence snapshot` and `currentSnapshotRef = current review snapshot` before enabling diff-first reopen posture
- backfill `TaskCanvasFrame.deltaPacketRef`, `supersededContextRefs[]`, `quietReturnTargetRef`, and `deltaReviewState` for in-flight resumed reviews; missing refs must degrade to summary-first bounded recovery rather than full-history default
- derive `supersededJudgmentContextRefs[]` from the last committed endpoint, approval, ownership, and duplicate-lineage context visible before the new delta; if that context cannot be reconstructed, keep the task in review-required posture until rebuilt
- any legacy changed-since-seen marker not backed by an authoritative `EvidenceDeltaPacket` must stay annotation-only and may not drive commit invalidation or support-region promotion

### Review with assistive stage

1. if the current route and role allow assistive help, render one `AssistiveWorkspaceStageBinding` as a summary stub or bounded `InlineSideStage` inside the same shell
2. assistive drafts or suggestions must bind to the current `reviewVersion`, `policyBundleRef`, `lineageFenceEpoch`, `selectedAnchorRef`, one current `WorkspaceTrustEnvelope`, one current `AssistiveCapabilityTrustEnvelope`, and any live `AssistiveDraftInsertionPoint`; stale or invalidated assistive sessions downgrade to `observe_only`, `provenance_only`, or `placeholder_only` with regenerate-in-place guidance
3. insert-from-assistive is legal only through the Phase 8 drafting or insertion leases, only while `AssistiveCapabilityTrustEnvelope.actionabilityState = enabled`, and must land inside the current `DecisionDock` or compose surface as provisional content, not as a committed decision
4. if assistive trust becomes degraded, quarantined, shadow-only, or frozen, retain provenance and context but refresh the current `AssistiveCapabilityTrustEnvelope` and suppress fresh accept or insert actions immediately in place
5. if the active insertion point, selected anchor, or compose surface drifts, preserve the current artifact and summary stub but freeze insert and accept affordances rather than retargeting to a different editor instance
6. the visible assistive stage must also resolve one current `AssistiveFeedbackChain`; if reason capture, approval burden, final-human-artifact settlement, or feedback-eligibility posture drifts, the same rail stays open but degrades to the chain's `feedbackCaptureState` instead of implying that a settled human-reviewed label already exists

### Review to self-care or admin-resolution

1. if the chosen endpoint is `self_care` or `admin_resolution`, `DecisionDock` must open one bounded side stage tied to the current `SelfCareBoundaryDecision`, `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `reviewVersion`, `workspaceSnapshotVersion`, `selectedAnchorRef`, and `lineageFenceEpoch`
2. that side stage must also bind the active `decisionEpochRef` and `AdviceAdminDependencySet.reopenState`; if the decision epoch is replaced, the boundary tuple changes, or reopen posture stops being `stable` while the stage is open, keep the current advice or admin draft visible as superseded context, freeze issue or complete controls, and require recommit inside the same task shell
3. self-care preview must show the current `AdviceBundleVersion`, safety-net summary, channel or locale variant, expected `AdviceFollowUpWatchWindow`, and explicit `clinicalMeaningState = informational_only | clinician_reentry_required` before send; admin-resolution preview must show subtype, owner, waiting-shape, required `AdminResolutionCompletionArtifact`, and `adminMutationAuthorityState = bounded_admin_only | frozen`
4. if evidence, safety state, ownership, policy truth, decision-epoch truth, or the governing self-care boundary changes while the stage is open, preserve the draft but freeze send or complete controls; the task must remain in the same shell and become `review_required` instead of silently issuing stale advice or admin work
5. patient-facing advice dispatch and admin-resolution state changes must traverse the canonical `ScopedMutationGate`, and both paths must echo the same `boundaryTupleHash`; local draft acknowledgement is insufficient to mark the task settled or to smuggle bounded admin work through an informational advice path
6. the shell may show self-care resolution or admin-resolution handoff only after authoritative `TaskCommandSettlement` plus `AdviceRenderSettlement` or `AdminResolutionCompletionArtifact` evidence confirms the outcome in place on the same `boundaryTupleHash`

### Review to decision or escalation

1. endpoint shortlist appears in `DecisionDock` under a live `ReviewActionLease`
2. selecting an endpoint opens `ConsequencePreview` inline
3. if approval is required, approval context opens as `InlineSideStage`
4. if urgent escalation is triggered, the shell collapses to one urgent-contact stage and demotes secondary widgets
5. if the decision emits self-care or admin-resolution work, the shell must retain the current boundary decision, advice settlement, or completion-artifact summary beside the committed endpoint
6. assistive shortlist insertion may only draft into this stage; it may not bypass `ConsequencePreview`, approval, or policy guards
7. once a `DecisionCommitEnvelope` is opened, every preview, approval, and submit interaction must stay bound to the same `decisionEpochRef`; stale tabs may preserve rationale text and preview context, but they may not commit against a replacement epoch
8. if the active `decisionEpochRef` is superseded by evidence delta, duplicate resolution, approval invalidation, trust drift, publication drift, or reopen, the shell must preserve the prior preview as superseded context, freeze commit controls, and surface the exact supersession reason in place
9. once the decision is committed, the task shell shows the exact downstream next owner and patient-facing consequence

### Completion to next task

1. direct resolution or handoff confirmation appears in place through `TaskCompletionSettlementEnvelope`
2. closure summary and any active `OperatorHandoffFrame` remain visible until authoritative settlement reaches `settled`, `manual_handoff_required`, or a governed recovery posture
3. `Next best task` CTA uses `TaskLaunchContext.nextTaskCandidateRefs` but becomes actionable only through `NextTaskLaunchLease` bound to the source settlement envelope and current continuity evidence
4. when settlement or continuity is still pending, keep the CTA in its final stable location but disabled with the exact blocking reason; do not replace it with a toast, spinner-only state, or auto-advance
5. if settlement remains pending or stale-recoverable, or if `WorkspaceContinuityEvidenceProjection` is stale or blocked, keep the user in the same task shell with bounded recovery or observe-only guidance instead of jumping to the next task
6. choosing the next task swaps the canvas while preserving the same shell and workboard state through `WorkspaceRouteAdjacency(adjacencyType = same_shell_task_switch)`; the departing task anchor remains as a short-lived return stub until the new task becomes stable, and only the explicit operator launch may create a new history entry
7. while the current task is open and no active `WorkspaceFocusProtectionLease`, unreleased `ProtectedCompositionState`, settlement blocker, or continuity blocker is active, the shell may create one `NextTaskPrefetchWindow` for the top recommended candidates from the same committed rank snapshot
8. `NextTaskPrefetchWindow` may warm only summary and decisive-delta stub data; fast queue change, snapshot drift, settlement drift, continuity drift, or user-entered protected composition must cancel it and downgrade `NextTaskLaunchLease.launchEligibilityState` in place
9. `WorkspaceTrustEnvelope` must remain the same authoritative gate from departing task through next-task readiness; local settlement progress, warmed candidate data, or queue reorder may not move `completionCalmState` to `eligible` until the envelope sees authoritative settlement plus live launch eligibility on the same snapshot tuple

## Rollout and backfill requirements

- rebuild `TaskLaunchContext.previewDigestRef`, `prefetchWindowRef`, `prefetchRankSnapshotRef`, `nextTaskBlockingReasonRefs[]`, and `nextTaskLaunchState` from the current committed `QueueRankSnapshot` before enabling background next-task prefetch or ready-state CTA posture
- backfill `workspaceTrustEnvelopeRef`, `consistencyTupleHash`, `trustTupleHash`, `mutationAuthorityState`, `interruptionPacingState`, and `completionCalmState` for in-flight queue, task, interruption, lease, and settlement projections; missing envelope refs must force observe-only or recovery posture instead of inferred writability
- backfill `TaskCompletionSettlementEnvelope.sourceQueueRankSnapshotRef`, `blockingReasonRefs[]`, `nextTaskLaunchState`, `nextTaskLaunchLeaseRef`, and `experienceContinuityEvidenceRef` for in-flight tasks; missing refs must disable `Next best task` in place instead of inferring readiness from local completion
- backfill `WorkspaceContinuityEvidenceProjection.sourceQueueRankSnapshotRef`, `latestPrefetchWindowRef`, and `nextTaskLaunchState` from the same authoritative settlement chain used for the active task shell
- during rollout, preserve the departing task summary, queue context, and selected anchor as a bounded return stub whenever a next-task launch is blocked, retried, or cancelled; migration may not drop the operator into a raw queue reset
- any prefetched candidate built from a stale or mixed snapshot must be discarded rather than partially upgraded in place

## Context-aware information hierarchy

Promote context in this order:

1. data needed to avoid a wrong decision now
2. data explaining why the current task resurfaced
3. data needed to coordinate the next owner
4. audit or long-form history only on request

This means:

- returned patient evidence outranks historical timeline
- approval consequences outrank generic guidance
- handoff failure reasons outrank raw outbound logs
- duplicate comparison outranks broad patient context when merge safety is in question

## Cross-domain task integration

The workspace must present callback, messaging, booking-intent, pharmacy-intent, and reopen work as part of the same request lineage:

- linked work appears in a compact `LineageStrip` derived from canonical `RequestLineage` plus `LineageCaseLink`, not from ad hoc child-case joins
- downstream failures generate interruption digest items, not surprise navigations
- cross-domain tasks are openable as side stages when they share the same continuity key
- booking-intent side stages and assisted-booking compare views must consume the current `BookingCapabilityResolution` plus `BookingCapabilityProjection`; queue metadata, supplier badges, or remembered slot state are descriptive only, and capability-tuple or trust drift must freeze select or confirm posture in place to governed recovery
- booking-intent side stages, assisted-booking compare views, and related queue or interruption badges must derive `accepted`, `confirmation_pending`, `reconciliation_required`, and `confirmed` posture from the current `BookingConfirmationTruthProjection`; accepted-for-processing chips, provider-reference echoes, detached reminder state, or local success affordances may not imply a durable booking or close the task early
- self-care advice and admin-resolution outcomes must remain lineage-visible through `boundaryDecisionDigest`, `adviceSettlementDigest`, and `adminResolutionDigest`; those digests must keep `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `reopenState`, `dependencySetRef`, and the current patient-facing experience projection visible so the workspace cannot silently relabel advice as admin work or vice versa
- staff never lose the parent request context when examining callback or handoff state

## Performance and responsiveness

The staff workspace is a high-frequency professional surface. It must ship with:

- windowed virtualization for all queue lists above 50 rows
- prefetch of preview data on focus or hover with cancellation on fast scan
- background prefetch of the next two recommended tasks while a current task is open, but only through `NextTaskPrefetchWindow(prefetchBudget = summary_only | summary_plus_delta_stub)` with immediate cancellation on focus protection, snapshot drift, or settlement drift
- chunked attachment loading with explicit placeholder states
- optimistic local acknowledgement for claim, note draft, filter save, and release, but only as control-local feedback; it may not change closure wording, handoff reassurance, queue calmness, or next-task readiness before the governing settlement becomes authoritative
- stale-while-revalidate cache for queue projections
- region-level skeletons only; never blank the whole shell when one panel refreshes
- hotkey command palette with zero-layout-shift open or close behavior

## Accessibility and ergonomics

The workspace must implement `accessibility-and-content-system-contract.md` with an operational `AssistiveTextPolicy` and a declared keyboard model for each dense region.

- every workboard, task canvas, decision dock, interruption digest, and promoted context region must declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, and `FreshnessAccessibilityContract`
- the queue, active-task, interruption, compose, compare, and recovery route families must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; the workspace may not keep live or calm posture if semantic coverage drifts under `mission_stack`, zoom, reduced motion, or buffered live updates
- every row, chip, and action must be keyboard reachable and screen-reader named
- queue-row focus, queue selection, and active-task selection must stay distinct unless a declared `KeyboardInteractionContract(selectionModel = selection_follows_focus)` explicitly allows coupling
- dense data regions need stable column headers, tabular numerics, explicit sort state, current-position cues, and list or table parity when the visual layout is card-first
- focus order must follow workboard -> task canvas -> decision dock -> context
- live queue, interruption, and trust-state updates must batch through `AssistiveAnnouncementContract`; routine patches may not spam screen readers or move focus
- queue flush, restore, delta replay, and claim or draft acknowledgement must resolve through one `AssistiveAnnouncementTruthProjection`; the workspace may emit one buffered-digest summary for the preserved anchor, but it may not replay historical local acknowledgements or stale next-task cues as fresh activity
- local invalidation, save failure, and blocked completion must render one in-shell `FormErrorSummaryContract` or recovery summary adjacent to the current task rather than relying on toast-only failure
- all promoted regions require a clear dismiss or pin control
- assistive summary stubs and side stages must expose named landmarks, predictable focus return to their launcher or insertion point, and non-color encodings for confidence, trust, and freeze state
- motion must respect reduced-motion settings without losing causality
- pointer targets for high-risk actions must be larger than surrounding dense controls

## Metrics and validation

Track these operational outcomes:

- median time from queue focus to claim
- median time from claim to first meaningful action
- median time from patient return to resumed review
- actions per completed direct-resolution task
- approval completion time
- banner impressions per resolved task
- promoted-support-region count per task
- queue abandonment after live reorder
- keyboard-only completion rate for common triage tasks
- stale `ReviewActionLease` rejection rate
- focus-protection churn while composing, comparing, or reviewing deltas
- degraded or quarantined trust-slice dwell time before bounded recovery
- assistive-stage observe-only or frozen transitions per task
- premature next-task launch rate before authoritative settlement, target zero
- continuity-evidence block rate before next-task launch, target explicit and non-zero during drift drills rather than silent success

A staff workspace redesign is successful only if it reduces task completion time and alert exposure without lowering decision quality or audit completeness.
