# Self-care content and admin-resolution blueprint

## Purpose

Close two endpoint gaps by defining:

- governed self-care and safety-net content lifecycle
- explicit admin-resolution case lifecycle

## Cross-layer control priorities

This remediation closes five high-priority cross-layer gaps in this layer:

1. patient-facing self-care and admin-resolution routes now bind live CTAs to `PatientShellConsistencyProjection`, `PatientEmbeddedSessionProjection`, and governed route-freeze recovery, so embedded or stale shells fail closed instead of drifting into contradictory writable posture
2. staff-side advice issue and admin-resolution actions are now fenced by `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `TaskCompletionSettlementEnvelope`, so stale queue or task context cannot leak optimistic completion
3. release and channel freezes now prove parity with the published runtime contract through `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle`, so writable posture fails closed on stale or withdrawn route contracts
4. advice dispatch, invalidation, waiting, completion, and reopen states now require visible same-shell progress and recovery through `TransitionEnvelope` plus governed recovery disposition, so users are not dropped into detached acknowledgement or generic failure paths
5. patient-visible admin completion artifacts and advice-linked document or browser handoff flows are now bound to `ArtifactPresentationContract`, byte-grant limits, and embedded `OutboundNavigationGrant`, so summary-first delivery and safe external exit remain guaranteed

## Self-care content governance

This remediation closes five high-priority self-care governance gaps in this layer:

1. self-care advice is now bound to the triggering evidence snapshot, safety state, audience tier, and route context at render time
2. channel-specific preview now resolves through a first-class variant contract for channel, locale, readability tier, and fallback transform parity
3. the boundary between self-care and admin-resolution now resolves through one governed `SelfCareBoundaryDecision`, so informational advice cannot drift into operational follow-up by wording alone
4. post-advice outcome monitoring now feeds operational reopen and rollback posture rather than analytics-only drift detection
5. stale or superseded advice now settles through explicit invalidation, supersession, quarantine, or reopen state when new evidence, policy, or approval status changes underneath it

### Suggested objects

These objects are canonical platform contracts specialized here for content, patient-shell, and workspace behavior; later shells may adapt presentation, but they may not replace the governing boundary tuple or settlement chain.

- `AdviceBundleVersion`
- `SafetyNetInstructionSet`
- `AdviceRuleLink`
- `ClinicalContentApprovalRecord`
- `ContentReviewSchedule`
- `AdviceUsageAnalyticsRecord`
- `AdviceEligibilityGrant`
- `AdviceVariantSet`
- `SelfCareBoundaryDecision`
- `AdviceRenderSettlement`
- `AdviceFollowUpWatchWindow`
- `SelfCareExperienceProjection`
- `AdviceAdminDependencySet`
- `AdviceAdminReleaseWatch`
- `AdminResolutionSubtypeProfile`
- `AdminResolutionActionRecord`
- `AdminResolutionSettlement`
- `AdminResolutionExperienceProjection`

**AdviceBundleVersion**
`adviceBundleVersionId`, `pathwayRef`, `compiledPolicyBundleRef`, `clinicalIntentRef`, `audienceTierRefs`, `variantSetRef`, `safetyNetInstructionSetRef`, `supersedesAdviceBundleVersionRef`, `invalidationTriggerRefs`, `effectiveFrom`, `effectiveTo`, `approvalRecordRef`

**AdviceEligibilityGrant**
`adviceEligibilityGrantId`, `requestRef`, `evidenceSnapshotRef`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `safetyState`, `routeFamily`, `audienceTier`, `channelRef`, `localeRef`, `compiledPolicyBundleRef`, `adviceBundleVersionRef`, `lineageFenceEpoch`, `routeIntentRef`, `subjectBindingVersionRef`, `sessionEpochRef`, `assuranceSliceTrustRefs[]`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `issuedAt`, `expiresAt`, `grantState = live | superseded | expired | invalidated | blocked`

**AdviceVariantSet**
`adviceVariantSetId`, `adviceBundleVersionRef`, `channelRef`, `localeRef`, `readingLevelRef`, `contentBlocksRef`, `fallbackTransformRef`, `previewChecksum`, `translationVersionRef`, `accessibilityVariantRefs`, `linkedArtifactContractRefs[]`

**SelfCareBoundaryDecision**
`selfCareBoundaryDecisionId`, `requestRef`, `evidenceSnapshotRef`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `decisionState = self_care | admin_resolution | clinician_review_required | blocked_pending_review`, `clinicalMeaningState = informational_only | bounded_admin_only | clinician_reentry_required`, `operationalFollowUpScope = none | self_serve_guidance | bounded_admin_resolution`, `adminMutationAuthorityState = none | bounded_admin_only | frozen`, `reasonCodeRefs`, `adminResolutionSubtypeRef`, `routeIntentBindingRef`, `selectedAnchorRef`, `lineageFenceEpoch`, `dependencySetRef`, `adviceRenderSettlementRef`, `adminResolutionCaseRef`, `selfCareExperienceProjectionRef`, `adminResolutionExperienceProjectionRef`, `reopenTriggerRefs[]`, `reopenState = stable | reopen_required | reopened | blocked_pending_review`, `boundaryState = live | superseded | reopened | blocked`, `boundaryTupleHash`, `compiledPolicyBundleRef`, `decidedAt`

`SelfCareBoundaryDecision` is the sole classifier for whether the request remains informational self-care, enters bounded admin-resolution, or must reopen clinician-governed review. Route labels, patient-safe wording, and subtype names may soften presentation, but they may not redefine this boundary once the tuple is published.

**AdviceRenderSettlement**
`adviceRenderSettlementId`, `adviceEligibilityGrantRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `adviceBundleVersionRef`, `adviceVariantSetRef`, `routeIntentBindingRef`, `commandActionRef`, `commandSettlementRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `dependencySetRef`, `clinicalMeaningState`, `operationalFollowUpScope`, `reopenState`, `renderState = renderable | withheld | invalidated | superseded | quarantined`, `trustState = trusted | degraded | quarantined`, `reasonCodeRefs`, `patientTimelineRef`, `communicationTemplateRef`, `controlStatusSnapshotRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `transitionEnvelopeRef`, `recoveryDispositionRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `recoveryRouteRef`, `settledAt`

**AdviceFollowUpWatchWindow**
`adviceFollowUpWatchWindowId`, `requestRef`, `adviceBundleVersionRef`, `watchStartAt`, `watchUntil`, `recontactThresholdRef`, `escalationThresholdRef`, `rollbackReviewState = none | pending | recommended | completed`, `watchRevision`, `assuranceSliceTrustRefs[]`, `watchState = monitoring | review_required | rollback_recommended | closed`, `latestReviewOutcomeRef`, `linkedAnalyticsRefs`

**SelfCareExperienceProjection**
`selfCareExperienceProjectionId`, `requestRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `decisionEpochRef`, `adviceEligibilityGrantRef`, `adviceRenderSettlementRef`, `dependencySetRef`, `adminResolutionCaseRef`, `patientShellConsistencyProjectionRef`, `patientEmbeddedSessionProjectionRef`, `consistencyProjectionRef`, `visibilityPolicyRef`, `bundleVersion`, `audienceTier`, `routeFamilyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `selectedAnchorRef`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState = none | bounded_admin_only | blocked`, `boundaryReopenState = stable | reopen_required | reopened | blocked_pending_review`, `releaseState`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `routeFreezeDispositionRef`, `dominantNextActionRef`, `projectionState = fresh | stale | recovery_required`, `computedAt`

`SelfCareExperienceProjection` is the patient and staff self-care surface adapter over the boundary decision. Informational advice copy, safety-net summary, visible next actions, and any admin handoff placeholder must all read from the same `boundaryTupleHash`, `clinicalMeaningState`, and `operationalFollowUpScope`; otherwise the experience must degrade to bounded recovery instead of letting wording imply a different class of work.

**AdviceAdminDependencySet**
`adviceAdminDependencySetId`, `requestRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `reachabilityDependencyRef`, `contactRepairJourneyRef`, `deliveryDisputeRef`, `consentCheckpointRef`, `identityRepairCaseRef`, `externalDependencyRef`, `dominantRecoveryRouteRef`, `reopenTriggerRefs[]`, `clinicalReentryTriggerRefs[]`, `dependencyState = clear | repair_required | disputed | blocked_pending_identity | blocked_pending_consent | blocked_pending_external_confirmation`, `reopenState = stable | reopen_required | reopened | blocked_pending_review`, `evaluatedAt`

`AdviceAdminDependencySet` is the canonical reopen fence for advice and admin follow-up. Dependency repair may explain why work is blocked, but only this set may say whether bounded admin action is still legal or whether the request has crossed back into clinician-governed review.

**AdviceAdminReleaseWatch**
`adviceAdminReleaseWatchId`, `domainType = self_care | admin_resolution`, `domainRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `assuranceSliceTrustRefs[]`, `watchTupleHash`, `watchState = trusted | degraded | frozen | quarantined | rollback_review_required`, `degradedDisposition = render_blocked | read_only | placeholder_only | rollback_review_required`, `lastEvaluatedAt`

### Required controls

- versioned content and safety-net text
- channel-specific preview
- evidence-bound eligibility gate before any advice is rendered
- explicit channel, locale, readability, and accessibility variants for every live advice bundle
- readability and clarity standards
- approval workflow for clinical content
- explicit self-care versus admin-resolution boundary decision before any operational follow-up is implied
- route labels, content tone, and localized wording may not substitute for `SelfCareBoundaryDecision.boundaryTupleHash`; informational advice, bounded admin follow-up, and clinician re-entry must remain distinguishable from the governing boundary object alone
- stale-advice invalidation when new material evidence, safety state, approval state, or policy bundle changes
- stale-advice and stale-admin invalidation when the originating `DecisionEpoch` is superseded or reopened
- expiry and review cadence
- post-advice watch window with rollback-review triggers
- rollback and supersession controls
- patient and staff self-care or admin-resolution surfaces for the same request must materialize the same `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, and `reopenState`; if any shell sees a different tuple, mutable posture fails closed to same-shell recovery
- `decisionState = self_care` is legal only while `clinicalMeaningState = informational_only`, `operationalFollowUpScope = self_serve_guidance`, and `adminMutationAuthorityState = none`; informational self-care may not imply bounded operational waiting, patient promises, or admin completion
- `decisionState = admin_resolution` is legal only while `clinicalMeaningState = bounded_admin_only`, `operationalFollowUpScope = bounded_admin_resolution`, and `AdviceAdminDependencySet.reopenState = stable`; admin follow-up may not continue once new symptoms, material evidence, re-safety work, or invalidated advice change the boundary
- patient and staff self-care surfaces must materialize through `SelfCareExperienceProjection` under the canonical `VisibilityProjectionPolicy`; if the owning shell consistency projection, `DecisionDock`, and advice settlement do not share the same `bundleVersion`, `audienceTier`, and governing-object version, mutable affordances freeze and the shell falls to bounded refresh or recovery
- partial-visibility self-care states must render through `releaseState`, `visibilityTier`, `summarySafetyTier`, and `placeholderContractRef`; wrong-patient recovery, step-up, or delayed-release posture must not silently hide advice that still contributes urgency
- patient-facing advice dispatch must traverse `ScopedMutationGate`, validate active `RouteIntentBinding`, `ReleaseApprovalFreeze`, and any `ChannelReleaseFreezeRecord`, and emit authoritative `CommandActionRecord` plus `CommandSettlementRecord` before the shell may show resolved success
- `AdviceRenderSettlement`, `AdminResolutionActionRecord`, and `AdminResolutionSettlement` must all echo the current `boundaryTupleHash`; accepted mutation on an older or mismatched boundary tuple must settle `stale_recoverable` rather than retargeting patient consequence
- self-care issue, advice render, and admin-resolution completion may proceed only while the originating `DecisionEpoch` remains current and unsuperseded; if a `DecisionSupersessionRecord` lands, the same shell must freeze issue or complete controls, keep the prior advice or admin summary visible as superseded provenance, and require recommit from the replacement decision
- active `AdviceAdminDependencySet` blocker facts such as reachability repair, delivery dispute, consent renewal, identity hold, or external dependency failure must become the dominant next action instead of remaining hidden inside secondary settings or analytics
- when `reachabilityDependencyRef` is the blocker, the admin-resolution shell must preserve the blocked action summary and reopen the same `ContactRouteRepairJourney`; generic account maintenance or detached success pages are invalid continuations
- live advice visibility must remain coupled to `AdviceAdminReleaseWatch`; if assurance trust degrades, rollout freezes, or channel posture conflicts, the experience must degrade to read-only, placeholder, or rollback review according to `degradedDisposition`
- patient-facing advice render must fail closed when required `AssuranceSliceTrustRecord` rows are degraded or quarantined, when session or route fences drift, or when the linked content approval no longer covers the current evidence snapshot
- advice and admin-resolution outcomes must settle as first-class operational records rather than analytics-only side effects
- every self-care surface and mutation path must bind one published `AudienceSurfaceRouteContract`; if `surfacePublicationRef`, the linked `RuntimePublicationBundle`, or provenance-backed runtime publication state becomes `stale`, `conflict`, `withdrawn`, or otherwise non-publishable, writable posture must fail closed to governed read-only, placeholder, or recovery behaviour
- patient-facing self-care routes must assemble beneath `PatientShellConsistencyProjection`; when `channelType = embedded`, live advice CTAs may render only while `PatientEmbeddedSessionProjection` agrees on subject, session lineage, manifest tuple, and release posture, otherwise the same shell must degrade through `routeFreezeDispositionRef`
- when advice is issued, invalidated, superseded, or escalated, the shell must create and advance one `TransitionEnvelope` derived from authoritative `CommandSettlementRecord`; detached success pages, hard reload acknowledgements, or generic pending spinners are invalid continuity mechanisms
- staff-issued self-care advice inside the workspace must hold a live `ReviewActionLease` whose `ownershipEpochRef` and `fencingToken` still match the current task owner; while the user is composing, comparing, or confirming advice, `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` must preserve the current boundary decision, draft, and selected anchor while disruptive queue or assistive deltas buffer, and stale-owner recovery must freeze advice issue in place rather than silently completing from an old tab
- any advice-linked leaflet, instruction document, or browser handoff must resolve through `ArtifactPresentationContract`; if only summary visibility is allowed, render the governed summary or placeholder, and in embedded mode any external or overlay launch must require a short-lived `OutboundNavigationGrant`

### Outcome analytics

Track:

- advice issue volume by pathway, channel, and locale
- recontact rates after advice within the active watch window
- escalation-after-advice rates by boundary decision type
- stale-advice invalidation and supersession rates
- advice render quarantine and rollback-review rates
- admin-resolution handoff rates from self-care candidates
- content version performance

## Admin-resolution domain

### Core object

- `AdminResolutionCase`
- `AdminResolutionCompletionArtifact`

**AdminResolutionCase**
`adminResolutionCaseId`, `episodeRef`, `requestRef`, `requestLineageRef`, `lineageCaseLinkRef`, `sourceTriageTaskRef`, `adminResolutionSubtypeRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState = bounded_admin_only | frozen`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `policyBundleRef`, `lineageFenceEpoch`, `caseVersionRef`, `currentOwnerRef`, `waitingState = none | awaiting_internal_action | awaiting_external_dependency | awaiting_practice_action | patient_document_return | identity_verification`, `currentActionRecordRef`, `completionArtifactRef`, `dependencySetRef`, `reopenState`, `experienceProjectionRef`, `releaseWatchRef`, `watchWindowRef`, `openedAt`, `closedAt`

**AdminResolutionCompletionArtifact**
`adminResolutionCompletionArtifactId`, `adminResolutionCaseRef`, `completionType`, `completionEvidenceRefs[]`, `patientExpectationTemplateRef`, `patientVisibleSummaryRef`, `artifactPresentationContractRef`, `artifactByteGrantRefs[]`, `outboundNavigationGrantRefs[]`, `releaseState`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `communicationDispatchRefs[]`, `deliveryOutcomeRefs[]`, `reopenPolicyRef`, `artifactState = draft | recorded | delivered | disputed | superseded`, `recordedAt`

**AdminResolutionSubtypeProfile**
`adminResolutionSubtypeRef`, `queuePolicyRef`, `waitingReasonPolicyRef`, `completionArtifactPolicyRef`, `patientExpectationTemplateRef`, `externalDependencyPolicyRef`, `reopenPolicyRef`

**AdminResolutionActionRecord**
`adminResolutionActionRecordId`, `adminResolutionCaseRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `actionType = claim | issue_advice | notify_patient | wait_dependency | record_completion | reopen_for_review | cancel_wait | reclassify_subtype`, `routeIntentBindingRef`, `reviewActionLeaseRef`, `reviewActionOwnershipEpochRef`, `reviewActionFencingToken`, `workspaceConsistencyProjectionRef`, `workspaceTrustProjectionRef`, `commandActionRef`, `policyBundleRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `lineageFenceEpoch`, `reasonCode`, `idempotencyKey`, `createdByRef`, `createdAt`, `settledAt`

**AdminResolutionSettlement**
`adminResolutionSettlementId`, `adminResolutionCaseRef`, `adminResolutionActionRecordRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `decisionEpochRef`, `decisionSupersessionRecordRef`, `commandSettlementRef`, `transitionEnvelopeRef`, `taskCompletionSettlementEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `dependencySetRef`, `releaseWatchRef`, `reopenState`, `result = queued | patient_notified | waiting_dependency | completed | reopened_for_review | blocked_pending_safety | stale_recoverable`, `trustState = trusted | degraded | quarantined`, `completionArtifactRef`, `recoveryDispositionRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `recoveryRouteRef`, `recordedAt`

**AdminResolutionExperienceProjection**
`adminResolutionExperienceProjectionId`, `adminResolutionCaseRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `decisionEpochRef`, `currentSettlementRef`, `completionArtifactRef`, `dependencySetRef`, `releaseWatchRef`, `patientShellConsistencyProjectionRef`, `patientEmbeddedSessionProjectionRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `consistencyProjectionRef`, `visibilityPolicyRef`, `bundleVersion`, `audienceTier`, `routeFamilyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `selectedAnchorRef`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState = bounded_admin_only | frozen`, `boundaryReopenState = stable | reopen_required | reopened | blocked_pending_review`, `releaseState`, `trustState = trusted | degraded | quarantined`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `routeFreezeDispositionRef`, `dominantNextActionRef`, `projectionState = fresh | stale | recovery_required`, `computedAt`

`AdminResolutionExperienceProjection` is the only patient- and staff-visible admin follow-up shell allowed for this lineage. Completion wording, waiting posture, and bounded operational next steps must derive from the same `boundaryTupleHash` and `adminMutationAuthorityState`; if the boundary reopens or clinician re-entry is required, the projection must preserve provenance but freeze further admin consequence in place.

### Suggested states

`queued -> in_progress -> awaiting_internal_action | awaiting_external_dependency | awaiting_practice_action -> patient_notified -> completed -> closed`

Reopen path:

`closed -> reopened -> in_progress`

### Suggested subtype categories

High-priority taxonomy gaps in this layer:

1. subtype labels must become first-class `adminResolutionSubtypeRef` values backed by `AdminResolutionSubtypeProfile`; each profile must declare `queuePolicyRef`, `waitingReasonPolicyRef`, `completionArtifactPolicyRef`, `patientExpectationTemplateRef`, `externalDependencyPolicyRef`, and `reopenPolicyRef` so routing and closure do not depend on prose labels
2. `result_follow_up_workflow` and `medication_admin_query` may remain in admin-resolution only while `clinicalDecisionState = already_resolved` and `reSafetyState != pending`; any new symptom report, dosing uncertainty, medication-change request, abnormal-result ambiguity, or fresh clinical evidence must hard-stop the admin path and emit governed escalation to clinician, triage, or pharmacy review
3. every subtype must declare one dominant dependency shape before entering a waiting state: `internal_team`, `external_party`, `practice_action`, `patient_document_return`, or `identity_verification`; generic waiting is invalid without owner ref, SLA clock source, and expiry or repair rules
4. every subtype must settle into a typed `AdminResolutionCompletionArtifact` such as `document_issued`, `form_submitted`, `result_notice_delivered`, `medication_admin_answered`, `demographics_updated`, or `routed_task_disposition_recorded`; `completed` may not be written without the artifact and matching patient-visible expectation text
5. `routed_admin_task` is a bounded ingress bucket, not a steady-state catch-all; it must retain `sourceDomainRef`, `sourceDecisionRef`, and `sourceLineageRef`, and it must be reclassified to a concrete subtype or rejected within a governed triage window

Canonical initial subtype set:

- `document_or_letter_workflow` for issuing, correcting, or re-sending governed outbound documents and letters
- `form_workflow` for inbound or outbound administrative forms with explicit signer, attachment, and submission dependencies
- `result_follow_up_workflow` for already-interpreted results requiring delivery, acknowledgement, or administrative chase only
- `medication_admin_query` for non-clinical prescription administration questions such as status, routing, exemption, or paperwork
- `registration_or_demographic_update` for identity-safe registration, address, contact, or demographic corrections
- `routed_admin_task` for source-domain work entering admin-resolution pending bounded reclassification

### Required controls

- explicit waiting-state reasons
- ownership and reassignment rules
- patient-visible waiting wording
- completion type taxonomy
- reopen triggers and lineage links
- every patient- or staff-facing admin-resolution view must materialize through `AdminResolutionExperienceProjection` under the canonical `VisibilityProjectionPolicy`; detached completion pages or admin-only side tools are not valid continuity mechanisms
- all admin-resolution actions must validate the active `RouteIntentBinding`, pinned `ReleaseApprovalFreeze`, and any `ChannelReleaseFreezeRecord`, then settle through authoritative `CommandSettlementRecord`; local UI acknowledgement may not imply completed work
- `AdviceAdminDependencySet` must govern waiting and completion posture; reachability repair, delivery dispute, consent renewal, identity repair, or unresolved external dependency must surface as the dominant blocker and freeze stale complete or notify controls
- admin-resolution actions and experience projections must remain bound to the current `SelfCareBoundaryDecision.boundaryTupleHash`, `clinicalMeaningState = bounded_admin_only`, and `operationalFollowUpScope = bounded_admin_resolution`; subtype labels or local copy may not widen bounded admin work into clinical meaning
- `AdminResolutionCompletionArtifact` is the typed proof of completion and patient-visible consequence; completion without artifact state, patient expectation copy, and delivery posture is invalid even if the admin step itself succeeded internally
- each live subtype and advice path must bind one `AdviceAdminReleaseWatch`; degraded or quarantined assurance slices may inform diagnostics, but they may not authorize fresh patient-facing advice or terminal admin completion until trust or attestation is restored
- all admin-resolution mutations must traverse `ScopedMutationGate` with the current `SelfCareBoundaryDecision`, `AdminResolutionSubtypeProfile`, and lineage fence; local UI state may not mark a case complete on its own
- all advice and admin-resolution mutations must also validate the current unsuperseded Phase 3 `DecisionEpoch`; stale boundary decisions, stale advice grants, or stale admin cases may remain visible for audit, but they may not continue issuing patient-facing consequence after supersession
- `completed` may only be entered after authoritative `AdminResolutionSettlement.result = completed` and a matching `AdminResolutionCompletionArtifact` are both present
- any new symptom, safety preemption, material patient evidence, invalidated advice settlement, or `AdviceAdminDependencySet.reopenState != stable` must reopen boundary review, flip the governing `SelfCareBoundaryDecision` to `reopen_required | clinician_review_required`, and freeze further admin-resolution completion until the case is reclassified
- every admin-resolution route family and mutation path must bind one published `AudienceSurfaceRouteContract`; if the linked `surfacePublicationRef`, `RuntimePublicationBundle`, or provenance-backed publication state is stale, conflicting, withdrawn, or blocked, patient and staff surfaces must suppress writable posture and fall to governed recovery instead of acting on an unpublished contract
- staff-side admin actions must materialize beneath `StaffWorkspaceConsistencyProjection` and `WorkspaceSliceTrustProjection`; every claim, issue-advice, complete-admin, reopen, or notify mutation must hold a live `ReviewActionLease` whose `ownershipEpochRef` and `fencingToken` still match the current task owner, and composition, compare, confirm, or delivery-dispute review must open `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` until settlement completes
- admin waiting, notification, reopen, and completion states must derive visible same-shell progress from `TransitionEnvelope`; staff closure and launch to the next task may occur only after `TaskCompletionSettlementEnvelope` reflects authoritative downstream settlement or governed recovery
- patient-facing admin-resolution routes must assemble beneath `PatientShellConsistencyProjection`; when embedded, `PatientEmbeddedSessionProjection` must match subject, session lineage, manifest tuple, and release posture before live CTAs remain active, otherwise the route must degrade in place through `routeFreezeDispositionRef`
- any patient-visible completion artifact, letter, form receipt, or browser handoff must resolve through `ArtifactPresentationContract`; byte delivery must use bounded grants, and embedded overlay or browser launches must consume a short-lived `OutboundNavigationGrant` tied to the active route lineage rather than a raw URL

## Cross-domain behaviour

Self-care and admin-resolution states should flow into:

- patient account timeline
- staff start-of-day views
- audit and assurance evidence
- communications governance and template use

Additional cross-domain rules:

- patient account, patient portal, and secure-link routes must render self-care and admin-resolution outcomes inside the same `PersistentShell` as the originating request, with one `DecisionDock`, one dominant next action derived from the active experience projection, and a live `PatientShellConsistencyProjection`; embedded variants must also validate `PatientEmbeddedSessionProjection` and degrade through `routeFreezeDispositionRef` rather than exposing stale CTAs
- patient request detail, timeline, lineage chips, and child-route return for self-care advice or admin-resolution work must serialize the same `SelfCareBoundaryDecision.boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, and `reopenState`; patient-safe copy may soften detail, but it may not relabel informational advice as operational work or conceal clinician re-entry
- staff workspace side stages for self-care or admin-resolution must preserve `selectedAnchorRef`, remain bound to the active boundary decision, and materialize under `StaffWorkspaceConsistencyProjection` plus `WorkspaceSliceTrustProjection`; any mutating action in those stages must hold `ReviewActionLease` and respect `WorkspaceFocusProtectionLease`
- cross-surface digests must keep `boundaryDecisionRef`, `adviceRenderSettlementRef`, `adminResolutionCaseRef`, `completionArtifactRef`, `dependencySetRef`, `transitionEnvelopeRef`, `surfacePublicationRef`, and `runtimePublicationBundleRef` lineage-visible so the outcome does not disappear after handoff or look live on a withdrawn runtime contract
- those same digests must also preserve `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, and `reopenState` so staff, patient, support, and assurance consumers can prove whether the current surface is informational advice, bounded admin-only follow-up, or clinician re-entry
- those digests must also keep `decisionEpochRef` and any linked `DecisionSupersessionRecord` lineage-visible so patient, staff, and support views can explain why a prior advice or admin path was superseded, reopened, or frozen
- when partial visibility, wrong-patient recovery, or delivery dispute prevents full detail, the shell must render governed placeholders tied to `releaseState`, `visibilityTier`, `summarySafetyTier`, and `placeholderContractRef` instead of leaking or silently omitting the item
- assurance and release consumers must serialize `AdviceAdminReleaseWatch.watchTupleHash`, current trust posture, and degraded disposition into dashboards, timeline digests, and support views so frozen or rollback-review advice cannot appear operationally healthy
- patient-visible completion artifacts and advice-linked documents must stay summary-first and continuity-safe: `ArtifactPresentationContract` governs whether the shell shows structured summary, bounded byte delivery, or external delivery, and embedded external exit must consume `OutboundNavigationGrant` instead of raw browser navigation
