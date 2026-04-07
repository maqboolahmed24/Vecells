# Staff operations and support blueprint

## Purpose

Define one staff start-of-day model, one within-workspace execution model, and one ticket-centric support workspace model across workspace, hub, pharmacy, and operations consoles.

The dedicated Clinical Workspace interaction contract lives in `staff-workspace-interface-architecture.md`. This document remains the cross-domain source of truth for staff entry posture, interruption priorities, and support governance across shells.
The dedicated Pharmacy Console mission-frame contract lives in `pharmacy-console-frontend-architecture.md` and governs stock-aware validation, fulfilment checkpoints, and pharmacy assurance inside the pharmacy shell.
The dedicated Operations Console interaction contract lives in `operations-console-frontend-blueprint.md` and governs control-room board composition, intervention workbench behavior, live-update pacing, and continuity-preserving drill-down across the `/ops/*` route family.

All staff and support projections in this document must be materialized under the canonical `VisibilityProjectionPolicy` from `phase-0-the-foundation-protocol.md`. `origin_practice`, `hub_desk`, `servicing_site`, and `support` are distinct audience tiers, and break-glass access must remain reason-coded, time-bound, audited, and minimal-scope.
All cross-organisation or elevated staff work in this document must also bind one current `ActingScopeTuple`; organisation switching, purpose-of-use drift, elevation expiry, or coverage-row drift must freeze the current shell in place before any wider payload or writable posture can persist.

All active staff and support surfaces must follow the canonical real-time interaction rules from Phase 0: stable `PersistentShell`, pinned active item, one shared status strip implemented through `FreshnessChip` plus `AmbientStateRibbon`, buffered disruptive deltas, `QueueChangeBatch` for live queue changes, and pause-live controls where investigation or replay is in progress.

## Visual token inheritance

Workspace, hub, pharmacy, operations, and support shells in this document must inherit `design-token-foundation.md` through their owning `profile.*` selection.

- start-of-day, hub, and support shells default to `balanced` density; queue-heavy work may step down to `compact`, but only non-editable operations or governance telemetry may use `dense_data`
- queue rows, timeline lists, ticket panels, knowledge rails, handoff drawers, and summary cards use shared surface-role tokens instead of local shell-specific card styling
- type, spacing, radius, stroke, elevation, semantic color, and motion must remain canonical even when a shell changes route family or audience tier

## Control priorities

The cross-domain staff and support control layer requires five corrections:

1. live support routes must bind to one published `AudienceSurfaceRuntimeBinding`, so stale publication, parity drift, or provenance drift cannot still imply live repair posture
2. active support work must bind to canonical `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `TaskCompletionSettlementEnvelope`
3. support mutation receipts must chain to canonical `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `TransitionEnvelope`, and `ReleaseRecoveryDisposition`
4. replay evidence, attachment recovery, resolution snapshots, and support exports were missing governed `ArtifactPresentationContract` and `OutboundNavigationGrant` rules
5. PHI-bearing support and staff transitions must include canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` requirements

## Staff audience coverage contract

`origin_practice`, `hub_desk`, `servicing_site`, and `support` cannot reuse one generic staff payload with route-local trimming. Every live shell in this document must resolve one coverage projection bound to the canonical `AudienceVisibilityCoverage` rows before it renders chronology, previews, artifacts, or mutating controls.

**StaffAudienceCoverageProjection**
`staffAudienceCoverageProjectionId`, `audienceTier`, `purposeOfUse = operational_execution | coordination | servicing_delivery | support_recovery | governance_review | break_glass_investigation`, `actingScopeTupleRef`, `projectionFamilyRefs[]`, `routeFamilyRefs[]`, `timelineVisibilityMode = summary_only | operational_detail | masked_support_detail | bounded_break_glass`, `artifactVisibilityMode = summary_only | governed_inline | governed_handoff | placeholder_only`, `mutationAuthority = none | scoped_coordination | scoped_delivery | governed_support_mutation | governance_only`, `actingContextRequirement = forbidden | optional | required`, `breakGlassState = forbidden | summary_only | bounded_detail`, `maskScopeRef`, `minimumNecessaryContractRef`, `requiredVisibilityPolicyRef`, `requiredCoverageRowRefs[]`, `requiredSectionContractRefs[]`, `requiredPreviewContractRefs[]`, `requiredArtifactContractRefs[]`, `requiredRedactionPolicyRefs[]`, `requiredPlaceholderContractRef`, `requiredRouteIntentRefs[]`, `computedAt`

`StaffAudienceCoverageProjection` is the cross-shell adapter over the audience matrix for practice, hub, servicing-site, support, governance, and break-glass work. It binds each staff-facing purpose of use to one exact projection family, minimum-necessary contract, timeline grammar, preview contract set, artifact contract set, and mutation ceiling before a shell can appear live.

Rules:

- `origin_practice` may render practice-owned request, callback, message, appointment, and results follow-up detail for the current organisation, but it may not inherit hub coordination notes, support-only chronology, or cross-organisation payloads after assembly
- `hub_desk` may render coordination digests, alternative-offer state, travel or access constraints, practice-visibility debt, and safe-summary clinical context, but not full clinical narrative, unrestricted attachment bodies, or support investigation history
- `servicing_site` may render encounter-delivery and local service-execution detail needed to fulfil the booked service, but it may not widen into support recovery artifacts, unrelated network history, or cross-tenant context
- `support` defaults to masked chronology, consequence previews, and bounded recovery workbench projections; subject history, replay detail, secure-link reissue, identity correction, and exports must each switch to dedicated purpose-of-use rows with explicit disclosure ceiling, mask scope, and recovery posture
- whenever staff or support surfaces explain why one booking or hub option ranked above another, they must read the current `CapacityRankProof`, candidate `CapacityRankExplanation`, and surface-specific `CapacityRankDisclosurePolicy`; local spreadsheet-style resort, screenshot annotation, or raw slot timestamp comparison is not authoritative replay
- break-glass and acting-context elevation may not widen an already materialized projection in place; they must switch to a separately governed `StaffAudienceCoverageProjection` tied to the approved purpose of use, reason code, and audit state before deeper detail appears
- organisation switch, tenant-scope drift, or `actingScopeTupleRef` supersession must collapse writable or wide-detail posture in place rather than silently rematerializing under the new scope
- queue rows, timeline events, replay summaries, and export or handoff surfaces must bind the same or stricter preview and artifact contracts than the destination detail route; staff chrome may not rely on collapsed detail to stay within scope

## Staff start-of-day model

Each staff role should land on a start-of-day view backed by these projections:

- `WorkspaceHomeProjection`
- `StaffInboxProjection`
- `PersonalWorklistProjection`
- `TeamQueueSummaryProjection`
- `InterruptionDigestProjection`
- `ApprovalInboxProjection`
- `CallbackWorklistProjection`
- `EscalationInboxProjection`
- `ChangedSinceSeenProjection`
- `CrossDomainTaskSummaryProjection`
- `DependencyDigestProjection`
- `PharmacyConsoleSummaryProjection`

## Staff landing requirements

Start-of-day should show:

- one primary queue or task list chosen by role and recent work
- one next recommended task or resume path
- approvals requiring action
- urgent escalations
- patient reply returns or callbacks when time-sensitive
- pharmacy validation due, stock-risk, and bounce-back work when role-scoped
- active outage or dependency banners only when blocking; otherwise a compact dependency digest
- compact secondary summaries for team queue warnings, changed-since-seen items, downstream handoff backlog, and recent completions

The landing surface should behave like a quiet workbench rather than a dashboard wall. Only the recommended queue should start expanded. Interruptions should collect into one digest rather than multiple banner stacks or widget clusters. While a staff member is working an item, that item must remain visually pinned even if background ranking changes. New work may appear, but disruptive list reordering must be buffered until idle or explicitly applied.

## Operations console model

The operations console is a live control-room surface for macro service health, bottleneck management, and dynamic resource allocation rather than case-by-case review.

Suggested operations projections:

- `OpsOverviewProjection`
- `OpsQueuePressureProjection`
- `OpsResourceAllocationProjection`
- `OpsDependencyHealthProjection`
- `OpsEquityImpactProjection`
- `OpsInterventionProjection`

## Operations route contract

Suggested route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`

The detailed front-end contract for these routes is defined in `operations-console-frontend-blueprint.md`. Governance-heavy policy editing, access administration, communications governance, and release gating live in the Governance and Admin Shell under `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*`; this document and the operations-console blueprint govern the control-room shell, board context, and drill-down behavior for the live operations routes.

## Operations landing requirements

The default operations landing view should show:

- north-star service metrics with explicit freshness
- one ranked bottleneck field
- current capacity mismatch and recommended reallocations
- essential-function and dependency health
- equity and channel variance cues
- one intervention workbench for the selected bottleneck

The console may be data-dense, but only one anomaly region and one intervention region may be visually dominant at once. Drill-in must preserve scope, horizon, filters, and selected bottleneck context.

## Clinical Workspace specialization

Within the staff shell, the Clinical Workspace must implement the route family, adaptive workboard/task-canvas layout, rapid-entry contract, and alert-fatigue rules from `staff-workspace-interface-architecture.md`.

Cross-domain entry rules:

- callback, message, booking-intent, pharmacy-intent, and reopen work must surface in one lineage-aware interruption digest
- a staff member should be able to move from queue scan to active task to next task without hard navigation or losing filters
- routine dependency and queue-health signals should remain compact until they block safe action
- only one urgent interruption path may dominate the active shell at a time

## Support desk model

Support should run as a ticket-centric workspace, not a loose collection of recovery tools or read-only audit pages.

All actionable support work should resolve through one governed `SupportTicket` over one current `SupportLineageBinding` that binds the triggering issue, the subject, the canonical lineage objects in scope, the active channel thread, and the allowed recovery actions.

High-priority operational gaps in this layer:

1. support actions are currently referenced statically, so an agent can act on a ticket after lineage, ownership, or policy has changed
2. replay pauses live updates, but the blueprint does not define the frozen evidence boundary or how queued deltas merge back safely
3. handoff can move work to `waiting-on-other-owner` without an acceptance SLA, fallback owner, or automatic return path
4. resend, reissue, channel-repair, and attachment-recovery work can duplicate external side effects because there is no single idempotent mutation envelope
5. deep-linked support action and replay routes can reopen powerful flows without re-establishing masking, observe-only scope, or policy approval state
6. observe-only mode exists as a route and posture, but not yet as a typed session with disclosure ceiling, restore law, or explicit read-only fallback
7. the ticket shell is described conceptually, but not yet through explicit anatomy, sizing, chronology, and fallback contracts, so stale or masked states could still lose legibility
8. ticket-local lineage arrays and copied summary artifacts can still drift from the current governing lineage object, source thread, and source artifact provenance

Suggested support objects:

- `SupportTicket`
- `SupportLineageBinding`
- `SupportLineageScopeMember`
- `SupportLineageArtifactBinding`
- `SupportDeskHomeProjection`
- `SupportInboxProjection`
- `SupportTicketWorkspaceProjection`
- `SupportSubject360Projection`
- `SupportOmnichannelTimelineProjection`
- `SupportReachabilityPostureProjection`
- `SupportKnowledgeStackProjection`
- `SupportActionWorkbenchProjection`
- `SupportReadOnlyFallbackProjection`
- `SupportActionSettlement`
- `SupportResolutionSnapshot`
- `SupportActionRecord`
- `SecureLinkReissueRecord`
- `CommunicationReplayRecord`
- `AttachmentRecoveryTask`
- `IdentityCorrectionRequest`
- `SupportReplaySession`
- `SupportObserveSession`
- `SupportActionLease`
- `SupportMutationAttempt`
- `SupportOwnershipTransferRecord`
- `SupportTransferAcceptanceSettlement`
- `SupportReplayCheckpoint`
- `SupportReplayEvidenceBoundary`
- `SupportReplayDeltaReview`
- `SupportReplayEscalationIntent`
- `SupportReplayDraftHold`
- `SupportReplayReleaseDecision`
- `SupportReplayRestoreSettlement`
- `SupportRouteIntentToken`
- `SupportContinuityEvidenceProjection`
- `SupportSurfaceRuntimeBinding`
- `SupportPresentationArtifact`

**SupportTicket**  
`supportTicketId`, `originRef`, `originChannel`, `subjectRef`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryRequestLineageRef`, `primaryLineageCaseLinkRef`, `activeScopeMemberRefs[]`, `reasonCategory`, `severity`, `slaState`, `ticketState`, `currentOwnerRef`, `queueKey`, `latestSubjectEventRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `activeConversationRef`, `currentKnowledgePackRef`, `currentHistoryPackRef`, `effectiveMaskScopeRef`, `allowedActionRefs[]`, `currentActionLeaseRef`, `activeMutationAttemptRef`, `activeIdentityCorrectionRequestRef`, `activeIdentityRepairCaseRef`, `identityRepairFreezeRef`, `identityRepairReleaseSettlementRef`, `activeReplayCheckpointRef`, `activeObserveSessionRef`, `activeTransferRef`, `activeTransferAcceptanceSettlementRef`, `activeReadOnlyFallbackRef`, `ticketVersionRef`, `shellMode = live | replay | observe_only | provisional | read_only_recovery`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `supportSurfaceRuntimeBindingRef`, `releaseRecoveryDispositionRef`, `taskCompletionSettlementEnvelopeRef`, `lastResolutionSummaryRef`

`SupportTicket` is the governed investigation frame over one current `SupportLineageBinding`. It may carry ownership, replay posture, knowledge posture, and recovery state, but it may not become a second system of record for request, case, thread, or artifact truth.

**SupportLineageBinding**
`supportLineageBindingId`, `supportTicketId`, `subjectRef`, `primaryRequestLineageRef`, `primaryLineageCaseLinkRef`, `primaryScopeMemberRef`, `governingObjectDescriptorRef`, `governingObjectRef`, `governingObjectVersionRef`, `scopeMemberRefs[]`, `sourceLineageRefs[]`, `sourceThreadRefs[]`, `sourceArtifactRefs[]`, `maskScopeRef`, `disclosureCeilingRef`, `bindingHash`, `supersedesSupportLineageBindingRef`, `bindingState = active | stale | superseded | closed`, `createdAt`, `supersededAt`

`SupportLineageBinding` is the sole canonical join between the ticket shell and the current request lineage, child case links, governing object, thread context, and artifact scope. Every support projection, action, replay checkpoint, restore settlement, and deep-link restore must bind this record before live posture is legal.

**SupportLineageScopeMember**
`supportLineageScopeMemberId`, `supportLineageBindingRef`, `requestLineageRef`, `lineageCaseLinkRef`, `domainCaseRef`, `governingObjectDescriptorRef`, `governingObjectRef`, `governingObjectVersionRef`, `sourceThreadRef`, `sourceArtifactRef`, `memberRole = primary_action_target | communication_context | recovery_dependency | identity_repair_dependency | related_case_context | artifact_provenance`, `continuityWitnessRef`, `visibilityMode = masked_summary | bounded_detail | repair_actionable`, `actionability = observe_only | governed_mutation | artifact_only`, `memberState = active | stale | superseded | released`, `addedAt`, `releasedAt`

`SupportLineageScopeMember` is the typed scope record for each canonical object visible inside one support ticket. Exactly one active scope member may supply live mutation authority for a support action; sibling members may add context, but they may not become implicit alternate targets.

**SupportLineageArtifactBinding**
`supportLineageArtifactBindingId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `supportTicketId`, `sourceLineageRef`, `sourceLineageCaseLinkRef`, `sourceEvidenceSnapshotRef`, `sourceArtifactRef`, `derivedArtifactRef`, `noteOrSummaryRef`, `maskScopeRef`, `disclosureCeilingRef`, `parityDigestRef`, `bindingState = active | superseded | blocked`, `createdAt`, `supersededAt`

`SupportLineageArtifactBinding` is the provenance join for any support-visible derived artifact, transcript excerpt, resend note, recovery note, resolution summary, or export. Ticket-authored summaries may stage locally, but they may not become durable timeline, replay, or handoff truth until this binding cites the exact source lineage and artifact or snapshot.

**SupportTicketWorkspaceProjection**
`supportTicketWorkspaceProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `ticketVersionRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `ticketHeaderRef`, `timelineProjectionRef`, `supportReachabilityPostureProjectionRef`, `actionWorkbenchProjectionRef`, `subject360ProjectionRef`, `knowledgeStackProjectionRef`, `resolutionSnapshotRef`, `supportSurfacePostureRef`, `supportReadOnlyFallbackProjectionRef`, `dominantRegion = timeline | action_workbench | replay_diff | handoff_resolution`, `renderedAt`

`SupportTicketWorkspaceProjection` is the single-ticket anatomy contract. It keeps header, timeline, action workbench, promoted context, and same-shell recovery attached to one continuity key and one current support-lineage binding so replay, observe, and stale fallback never fork into detached pages or tool silos.

**SupportOmnichannelTimelineProjection**
`supportOmnichannelTimelineProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `scopeMemberRefs[]`, `artifactBindingRefs[]`, `ticketVersionRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `timelineWatermarkRef`, `clusterStrategyRef`, `activeExchangeRef`, `authoritativeEventRef`, `provisionalEventRefs[]`, `maskedEventRefs[]`, `deliveryStateRefs[]`, `governingMessageDispatchEnvelopeRefs[]`, `latestDeliveryEvidenceBundleRef`, `latestThreadResolutionGateRef`, `latestSupportActionSettlementRef`, `replayEvidenceBoundaryRef`, `freshnessState = live | paused_replay | queued_delta_review | stale | read_only`, `generatedAt`

`SupportOmnichannelTimelineProjection` is the chronology contract for email, SMS, secure message, callback, telephony summary, workflow events, and internal notes. It preserves causal order, stable masking placeholders, and provisional-versus-authoritative labelling even when the shell is paused, partially stale, or read-only. Controlled resend and delivery-repair events must cluster under the same dispatch, evidence, settlement chain, and support-lineage scope so local retry clicks, provider callbacks, and patient-thread truth cannot tell different stories for the same communication. Ticket-local copied notes, transcript excerpts, or artifact summaries are not authoritative timeline material without the current `SupportLineageArtifactBinding`.

**SupportReachabilityPostureProjection**
`supportReachabilityPostureProjectionId`, `supportTicketId`, `subjectRef`, `activeDependencyRefs[]`, `dominantDependencyRef`, `currentContactRouteSnapshotRefs[]`, `currentReachabilityAssessmentRefs[]`, `contactRepairJourneyRef`, `routeAuthorityState = current | stale_verification | stale_demographics | stale_preferences | disputed | superseded`, `deliveryRiskState = clear | at_risk | likely_failed | disputed`, `postureState = clear | at_risk | blocked | recovery_required | disputed`, `dominantReasonRef`, `nextSafeActionRef`, `renderedAt`

`SupportReachabilityPostureProjection` is the support-safe view of active contact-route truth. It must be built from the same current `ReachabilityAssessmentRecord` rows seen by patient and staff surfaces; last-send success, CRM notes, or mutable demographics are not valid substitutes for live recovery or reassurance.

**SupportActionLease**
`supportActionLeaseId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `actionRef`, `decisionRef`, `ticketVersionRef`, `policyVersionRef`, `routeIntentBindingRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `reviewActionLeaseRef`, `workspaceFocusProtectionLeaseRef`, `supportSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `leaseAuthorityRef`, `issuedToRef`, `ownershipEpochRef`, `fencingToken`, `staleOwnerRecoveryRef`, `issuedAt`, `expiresAt`, `observeOnly`, `maskScopeRef`, `dependencySnapshotRef`, `supportContinuityEvidenceProjectionRef`, `selectedTimelineAnchorRef`, `leaseState = live | observe_only | stale | blocked`

**SupportMutationAttempt**
`supportMutationAttemptId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `actionRef`, `supportActionLeaseRef`, `ownershipEpochRef`, `fencingToken`, `idempotencyKey`, `mutationFingerprintRef`, `attemptScopeRef`, `governingThreadRef`, `governingSubthreadRef`, `governingThreadVersionRef`, `governingThreadTupleHash`, `governingSubthreadTupleHash`, `messageDispatchEnvelopeRef`, `latestDeliveryEvidenceBundleRef`, `latestThreadExpectationEnvelopeRef`, `latestThreadResolutionGateRef`, `repairKind = resend | reissue | channel_change | callback_reschedule | attachment_recovery`, `consequencePreviewRef`, `requestPayloadRef`, `transportOperationRef`, `outboxState`, `externalConfirmationState`, `confirmationGateRef`, `dedupeWindowEndsAt`, `attemptState = consequence_preview | queued_commit | awaiting_transport | awaiting_external | settled | stale_recoverable | failed_terminal`, `createdByRef`, `createdAt`, `settledAt`

`SupportMutationAttempt` is the sole live mutation envelope for support-side resend and delivery repair. For non-communication actions the thread-linked refs may remain empty, but for resend, reissue, channel change, callback reschedule, and attachment recovery they are mandatory. The same ticket, governing thread or typed subthread tuple, and repair kind must reuse the live attempt until authoritative settlement, explicit fallback, or stale recovery exists; duplicate support clicks may not arm a second external side effect or silently hop to a different patient-visible branch.

**IdentityCorrectionRequest**
`identityCorrectionRequestId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `identityRepairCaseRef`, `identityRepairFreezeRef`, `currentIdentityBindingRef`, `supersededBindingRef`, `candidateSetRef`, `proposedPatientRef`, `proposedOwnershipState`, `reasonCode`, `evidenceRefs[]`, `downstreamDispositionRefs[]`, `requestedByRef`, `approvedByRef`, `bindingAuthorityRef`, `resultingIdentityBindingRef`, `identityRepairReleaseSettlementRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `repairPosture = evidence_collect | freeze_active | correction_pending | release_pending`, `requestState = draft | submitted | awaiting_supervisor | authority_pending | settled | denied | stale`, `createdAt`, `settledAt`

`IdentityCorrectionRequest` is the only support-side envelope allowed to request patient-binding correction or ownership repair. Support agents may collect evidence, draft the proposal, and secure supervisor approval, but only `IdentityBindingAuthority` may append the resulting `IdentityBinding` version or advance derived `patientRef` on `Request` or `Episode`. Support may not treat “needs correction” as a local workspace state: the active `IdentityRepairFreezeRecord`, downstream branch set, and later `IdentityRepairReleaseSettlement` must be explicit on the request before any live mutation posture can return. Superseded, stale, or scope-mismatched requests must fail closed into read-only recovery rather than mutating lineage locally.

**SecureLinkReissueRecord**
`secureLinkReissueRecordId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `governingObjectRef`, `priorAccessGrantRefs[]`, `priorRedemptionRef`, `replacementAccessGrantRef`, `replacementGrantScopeEnvelopeRef`, `accessGrantSupersessionRef`, `allowedScopeCeiling`, `reasonCode`, `authorizedByRef`, `createdAt`, `issuedAt`, `reissueState = draft | issued | superseded | cancelled`

`SecureLinkReissueRecord` is the only support-side envelope allowed to reissue a patient secure link or minimal recovery grant. Support may derive the replacement only from the current governing object, current lineage and runtime fences, and the immediately prior allowed minimal scope. Used, superseded, drifted, or scope-mismatched grants may not be cloned, and prior grants must be invalidated through `AccessGrantSupersessionRecord` before the replacement is delivered.

**SupportActionRecord**
`supportActionRecordId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `actionScope`, `governingObjectRef`, `governingThreadRef`, `governingSubthreadRef`, `governingThreadVersionRef`, `governingThreadTupleHash`, `governingSubthreadTupleHash`, `routeProfileRef`, `policyBundleRef`, `routeIntentBindingRef`, `commandActionRecordRef`, `messageDispatchEnvelopeRef`, `latestDeliveryEvidenceBundleRef`, `latestThreadExpectationEnvelopeRef`, `latestThreadResolutionGateRef`, `identityCorrectionRequestRef`, `identityRepairCaseRef`, `identityRepairFreezeRef`, `identityRepairReleaseSettlementRef`, `secureLinkReissueRecordRef`, `supportMutationAttemptRef`, `supportSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `fenceEpoch`, `reasonCode`, `jitScopeRef`, `dualControlState`, `idempotencyKey`, `createdByRef`, `createdAt`, `settledAt`

`SupportActionRecord` binds the support operator intent to the governing communication chain and current support-lineage binding. When `actionScope` is communication repair, the thread-linked refs and current thread or subthread tuple refs are mandatory and it may not record a support-local resend or repair that is detached from the current message dispatch, delivery evidence, expectation envelope, resolution gate, typed subthread, and actionable scope member.

**SupportActionSettlement**
`settlementId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageScopeMemberRef`, `supportActionRecordId`, `identityCorrectionRequestRef`, `identityRepairCaseRef`, `identityRepairFreezeRef`, `identityRepairReleaseSettlementRef`, `secureLinkReissueRecordRef`, `resultingIdentityBindingRef`, `replacementAccessGrantRef`, `accessGrantSupersessionRef`, `commandSettlementRecordRef`, `governingThreadRef`, `governingSubthreadRef`, `governingThreadTupleHash`, `governingSubthreadTupleHash`, `messageDispatchEnvelopeRef`, `latestDeliveryEvidenceBundleRef`, `latestThreadExpectationEnvelopeRef`, `latestThreadResolutionGateRef`, `supportLineageArtifactBindingRefs[]`, `localAckState = none | shown | superseded`, `processingAcceptanceState = not_started | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`, `externalObservationState = unobserved | delivered | resolved | transferred | disputed | failed | expired`, `authoritativeDeliveryState = unobserved | delivered | failed | disputed | expired`, `authoritativeOutcomeState = pending | awaiting_external | stale_recoverable | recovery_required | manual_handoff_required | settled | failed | expired`, `transitionEnvelopeRef`, `supportSurfaceRuntimeBindingRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `presentationArtifactRef`, `result = applied | awaiting_external | stale_recoverable | denied_scope | manual_handoff_required`, `receiptTextRef`, `causalToken`, `recoveryRouteRef`, `recordedAt`

`SupportActionSettlement` is a support-shell receipt derived from canonical mutation truth. It may adapt presentation or same-shell recovery, but `result` must stay semantically aligned to authoritative `CommandSettlementRecord` or confirmation-gate state and may not invent a support-local pending vocabulary that hides whether work is still awaiting external confirmation. `localAckState`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState` are intentionally separate so support can show click feedback, accepted-for-processing state, delivery evidence, and final repair outcome without collapsing them into one misleading success badge. For communication repair, the settlement must also cite the current `MessageDispatchEnvelope`, `MessageDeliveryEvidenceBundle`, `ThreadExpectationEnvelope`, `ThreadResolutionGate`, and the current governing thread or subthread tuple so support-local receipt wording cannot outrun patient-visible, evidence-bound delivery truth or silently switch to a different reminder, callback, or reply branch.

**SupportActionWorkbenchProjection**
`supportActionWorkbenchProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `ticketVersionRef`, `dominantActionRef`, `secondaryActionRefs[]`, `supportActionLeaseRef`, `supportReachabilityPostureProjectionRef`, `supportMutationAttemptRef`, `governingThreadRef`, `governingSubthreadRef`, `governingThreadTupleHash`, `governingSubthreadTupleHash`, `messageDispatchEnvelopeRef`, `latestDeliveryEvidenceBundleRef`, `latestThreadResolutionGateRef`, `consequencePreviewRef`, `activeSettlementRef`, `supportReplayCheckpointRef`, `supportObserveSessionRef`, `supportReadOnlyFallbackProjectionRef`, `actionPosture = writable | provisional | observe_only | recovery_required | blocked`, `renderedAt`

`SupportActionWorkbenchProjection` makes one dominant mutating or recoverable action explicit. All other actions stay quiet, preview-only, or disabled until the current lease, mutation attempt, dispatch or evidence chain, governing thread or subthread tuple, and restore posture prove that a second action is safe. When the dominant action is not communication repair, the message-thread refs may remain empty.

**SupportResolutionSnapshot**
`supportResolutionSnapshotId`, `supportTicketId`, `supportLineageBindingRef`, `ticketVersionRef`, `resolutionCode`, `summaryRef`, `channelOutcomeRefs[]`, `handoffSummaryRef`, `supportLineageArtifactBindingRefs[]`, `confirmationState = draft | awaiting_external | accepted_transfer | durable`, `supportPresentationArtifactRef`, `createdAt`

`SupportResolutionSnapshot` is the summary-first outcome artifact shown in the same ticket shell. It may be reused for repeat contacts, but it may not appear as durable truth until the linked action settlement or transfer-acceptance settlement is authoritative and any cited summary or note has one current `SupportLineageArtifactBinding`.

**SupportOwnershipTransferRecord**
`supportOwnershipTransferId`, `supportTicketId`, `supportLineageBindingRef`, `fromOwnerRef`, `toOwnerRef`, `targetQueueKey`, `reasonCode`, `handoffSummaryRef`, `acceptBy`, `autoReturnAt`, `acceptedAt`, `fallbackOwnerRef`, `acceptanceSettlementRef`, `transferState = pending_acceptance | accepted | auto_returned | escalated | cancelled | expired`, `returnedAt`

**SupportTransferAcceptanceSettlement**
`supportTransferAcceptanceSettlementId`, `supportOwnershipTransferRef`, `supportTicketId`, `supportLineageBindingRef`, `ticketVersionRef`, `nextOwnerRef`, `result = accepted | auto_returned | escalated | cancelled | expired`, `recoveryRouteRef`, `recordedAt`

`SupportTransferAcceptanceSettlement` is the authority for when `waiting-on-other-owner`, auto-return, or escalation wording becomes final. The queue row and ticket shell must remain provisional until this settlement exists or final resolution supersedes the transfer.

**SupportReplayCheckpoint**
`supportReplayCheckpointId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `supportReplaySessionId`, `auditQuerySessionRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `originOpsReturnTokenRef`, `investigationQuestionHash`, `ticketVersionRef`, `supportRouteIntentTokenRef`, `timelineWatermarkRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `maskedSnapshotRef`, `maskScopeRef`, `disclosureCeilingRef`, `supportReplayEvidenceBoundaryRef`, `projectionVersionRefs`, `supportSurfaceRuntimeBindingRef`, `supportContinuityEvidenceProjectionRef`, `queueAnchorRef`, `draftHoldRef`, `checkpointHash`, `checkpointState = active | invalidated | released`, `createdAt`, `releasedAt`

**SupportReplayEvidenceBoundary**
`supportReplayEvidenceBoundaryId`, `supportReplayCheckpointRef`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `ticketVersionRef`, `authoritativeEventCutoffRef`, `selectedTimelineAnchorTupleHashRef`, `includedEventRefs[]`, `includedArtifactRefs[]`, `artifactBindingRefs[]`, `excludedDraftRefs[]`, `excludedOutboundAttemptRefs[]`, `latestActionSettlementRef`, `latestMutationAttemptRef`, `externalConfirmationFenceRef`, `maskScopeRef`, `disclosureCeilingRef`, `boundaryHash`, `createdAt`

`SupportReplayEvidenceBoundary` defines the frozen evidence set for replay. Drafts, in-flight outbound attempts, later confirmations, and wider disclosure remain outside the replay proof unless revalidated on release, so investigation cannot silently absorb mutable or post-checkpoint state or restore with a looser mask scope than the checkpoint allowed.

`SupportReplaySession` is the replay chronology contract defined in `phase-9-the-assurance-ledger.md`. In the support shell it must stay bound to the same `InvestigationScopeEnvelope`, `InvestigationTimelineReconstruction`, and originating `OpsReturnToken` while the operator is answering the same investigative question; replay may narrow into safer posture, but it may not silently widen subject context or swap to a different diagnostic basis.

**SupportReplayDeltaReview**
`supportReplayDeltaReviewId`, `supportReplayCheckpointId`, `deltaBufferRef`, `reviewState = pending | reviewed | superseded`, `deltaSeverity = informational | review_required | freeze_required`, `affectedLeaseRefs[]`, `affectedRouteIntentRefs[]`, `maskScopeDriftState = none | narrowed | widened_blocked | expired`, `draftRestoreState = resumable | summary_only_hold | discard_required`, `pendingExternalState = none | awaiting_external | disputed`, `recommendedRestoreResult = live_restored | awaiting_external_hold | stale_reacquire | read_only_recovery | escalate_recovery`, `requiresEscalation`, `reviewedByRef`, `reviewedAt`

`SupportReplayDeltaReview` is the explicit merge boundary between frozen replay evidence and queued live change. It must classify whether replay may safely resume live work, must remain provisional because external confirmation is still pending, or must degrade to stale reacquire or read-only recovery.

**SupportReplayEscalationIntent**
`supportReplayEscalationIntentId`, `supportReplayCheckpointId`, `targetSurfaceRef`, `routeIntentTokenRef`, `maskScopeRef`, `observeOnly`, `returnCheckpointRef`, `intentState = armed | used | stale | superseded`, `issuedAt`, `expiresAt`

**SupportReplayDraftHold**
`supportReplayDraftHoldId`, `supportTicketId`, `composerDraftRefs`, `attachmentDraftRefs`, `selectedActionRef`, `maskScopeRef`, `supportRouteIntentTokenRef`, `selectedTimelineAnchorTupleHashRef`, `restoreDisposition = resumable | summary_only_hold | discarded`, `heldAt`, `restoredAt`, `holdState = held | restored | discarded`

**SupportObserveSession**
`supportObserveSessionId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `entryRef`, `entryReasonCode`, `ticketVersionRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `supportRouteIntentTokenRef`, `maskScopeRef`, `disclosureCeilingRef`, `subjectContextBindingRef`, `knowledgeBindingRef`, `supportSurfaceRuntimeBindingRef`, `supportContinuityEvidenceProjectionRef`, `stepUpState`, `observeState = active | step_up_required | stale | released`, `createdAt`, `releasedAt`

`SupportObserveSession` is the read-only elevated-inspection contract for a live ticket shell. It may widen governed detail within the current disclosure ceiling, but it may not arm resend, reissue, identity-correction, or resolution controls until restore law revalidates live posture.

**SupportReplayReleaseDecision**
`supportReplayReleaseDecisionId`, `supportReplayCheckpointId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `supportObserveSessionRef`, `deltaReviewRef`, `auditQuerySessionRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `originOpsReturnTokenRef`, `ticketVersionRef`, `currentMaskScopeRef`, `selectedTimelineAnchorTupleHashRef`, `routeIntentState`, `leaseReacquireState`, `draftRestoreState = resumed | summary_only_hold | discarded`, `pendingExternalState = none | awaiting_external | disputed`, `continuityEvidenceState = trusted | degraded | stale | blocked`, `runtimeBindingState = live | recovery_only | blocked`, `decision = resume_live | reopen_replay | read_only_recovery | escalate_recovery`, `decisionBasisRef`, `decidedByRef`, `decidedAt`

`SupportReplayReleaseDecision` is the final replay-exit verdict before restore settlement. It must make the draft disposition, mask-scope state, pending-external posture, continuity-evidence state, and runtime-binding state explicit rather than inferring a safe resume from ticket recency alone.

**SupportReplayRestoreSettlement**
`supportReplayRestoreSettlementId`, `supportReplayReleaseDecisionRef`, `supportReplayCheckpointRef`, `supportReplayEvidenceBoundaryRef`, `supportObserveSessionRef`, `supportTransferAcceptanceSettlementRef`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `auditQuerySessionRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `originOpsReturnTokenRef`, `investigationQuestionHash`, `timelineHash`, `ticketVersionRef`, `restoreSource = replay_exit | observe_return | deep_link_restore | transfer_return`, `supportRouteIntentTokenRef`, `routeIntentTupleHash`, `currentMaskScopeRef`, `disclosureCeilingRef`, `selectedTimelineAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `checkpointHash`, `boundaryHash`, `supportActionLeaseRef`, `activeMutationAttemptRef`, `activeActionSettlementRef`, `supportReplayDraftHoldRef`, `draftRestoreState = resumed | summary_only_hold | discarded`, `pendingExternalState = none | awaiting_external | disputed`, `continuityValidationState = trusted | degraded | stale | blocked`, `experienceContinuityEvidenceRef`, `supportReadOnlyFallbackProjectionRef`, `result = live_restored | awaiting_external_hold | stale_reacquire | read_only_recovery | escalate_recovery`, `recoveryRouteRef`, `recordedAt`

`SupportReplayRestoreSettlement` remains the canonical support-shell restore receipt for replay exit, observe return, deep-link re-entry, and transfer return. Its legacy name stays for compatibility, but live controls may reopen only when the recorded restore source, route-intent tuple, selected timeline anchor tuple, replay checkpoint hash, evidence-boundary hash, current mask scope, current support-lineage binding hash, held-draft disposition, continuity evidence, and, when present, the originating `InvestigationScopeEnvelope.scopeHash`, `InvestigationTimelineReconstruction.timelineHash`, and `OpsReturnToken` all support the same ticket anchor, the same actionable scope member, and the same diagnostic question.

**SupportContinuityEvidenceProjection**
`supportContinuityEvidenceProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `patientOrSubjectRef`, `controlCode = support_replay_restore`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `supportSurfaceRuntimeBindingRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `experienceContinuityEvidenceRef`, `latestReplayCheckpointRef`, `latestReplayBoundaryHash`, `latestRestoreSettlementRef`, `latestActionSettlementRef`, `currentMaskScopeRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`SupportContinuityEvidenceProjection` is the support-shell bridge into the assurance spine. Replay return, observe return, deep-link restore, and transfer return may not reopen live controls from local queue freshness or route reacquire alone; the ticket shell must consult the current `ExperienceContinuityControlEvidence` for support replay restore, the same selected timeline-anchor tuple, and the same live support publication tuple.

Support replay opened from `/ops/audit` or another governed investigation route must preserve one current `InvestigationScopeEnvelope` and one current `InvestigationTimelineReconstruction`. Replay may narrow masking or fall to read-only recovery, but it may not widen purpose of use, selected anchor, or investigative question without superseding the originating envelope and forcing a new reviewable pivot.

**SupportRouteIntentToken**
`supportRouteIntentTokenId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `intent`, `actionRef`, `ticketVersionRef`, `routeFamilyRef`, `selectedAnchorRef`, `selectedTimelineAnchorTupleHashRef`, `returnRouteRef`, `scopeClass`, `maskScopeRef`, `observeOnly`, `issuedToRef`, `requiresStepUp`, `policyVersionRef`, `supportSurfaceRuntimeBindingRef`, `supportContinuityEvidenceProjectionRef`, `expiresAt`, `usedAt`, `tokenState = live | used | stale | blocked`

**SupportSurfaceRuntimeBinding**
`supportSurfaceRuntimeBindingId`, `routeFamilyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `frontendContractManifestRef`, `projectionContractVersionSetRef`, `projectionCompatibilityDigestRef`, `projectionQueryContractRefs[]`, `mutationCommandContractRefs[]`, `liveUpdateChannelContractRefs[]`, `clientCachePolicyRef`, `requiredTrustRefs[]`, `requiredChannelFreezeRefs[]`, `releaseRecoveryDispositionRef`, `bindingState = live | recovery_only | blocked`, `validatedAt`

**SupportReadOnlyFallbackProjection**
`supportReadOnlyFallbackProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageBindingHash`, `primaryScopeMemberRef`, `triggerRef`, `ticketVersionRef`, `currentMaskScopeRef`, `preservedAnchorRef`, `preservedArtifactRef`, `preservedDraftRef`, `supportReplayCheckpointRef`, `supportReplayDraftHoldRef`, `supportReplayRestoreSettlementRef`, `heldSupportMutationAttemptRef`, `heldMessageDispatchEnvelopeRef`, `heldDeliveryEvidenceBundleRef`, `heldThreadResolutionGateRef`, `mode = stale_reacquire | observe_only | awaiting_external_hold | transfer_pending | blocked_scope`, `explanationRef`, `reacquireActionRef`, `renderedAt`

`SupportReadOnlyFallbackProjection` is the same-shell fallback when route intent, masking, continuity evidence, or runtime publication can no longer support live controls. It preserves the last trusted anchor, strongest confirmed artifact, any held repair attempt chain, and next safe reacquire action instead of blanking the workspace. When the interrupted action was not communication repair, the held thread-linked refs may remain empty.

**SupportPresentationArtifact**
`supportPresentationArtifactId`, `supportTicketId`, `supportLineageBindingRef`, `supportLineageArtifactBindingRefs[]`, `artifactPresentationContractRef`, `artifactSurfaceFrameRef`, `artifactSurfaceContextRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `supportSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `maskScopeRef`, `visibilityTier`, `summarySafetyTier`, `artifactParityDigestRef`, `placeholderContractRef`, `artifactState = summary_only | inline_renderable | external_handoff_ready | recovery_only`, `createdAt`

**SupportSurfacePosture**
`supportSurfacePostureId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `surfacePostureFrameRef`, `supportActionLeaseRef`, `supportReplayCheckpointRef`, `supportObserveSessionRef`, `supportReplayRestoreSettlementRef`, `supportReadOnlyFallbackProjectionRef`, `selectedAnchorRef`, `layoutTopology = two_plane | three_plane | mission_stack`, `surfaceMode = live | replay | observe_only | provisional | read_only_recovery`, `dominantQuestionRef`, `dominantActionRef`, `recoveryActionRef`, `renderedAt`

Rules:

- queue-open, live ticket, replay, observe-only, awaiting-external hold, stale reacquire, and read-only recovery must all resolve through `SurfacePostureFrame`; support chrome may not invent a second competing blocker or success posture
- once a ticket is known, loading or refresh must keep ticket summary, current composer or recovery form, and selected timeline anchor visible
- reply, resend, reissue, attachment recovery, identity correction, escalation, transfer, and resolution flows must use `SurfacePostureFrame(postureState = settled_pending_confirmation)` or the corresponding blocked posture until `SupportActionSettlement` or `SupportReplayRestoreSettlement` becomes authoritative
- support artifacts continue to use `SupportPresentationArtifact`, now bound to `ArtifactSurfaceFrame`, `ArtifactTransferSettlement`, and `ArtifactFallbackDisposition`, so inline summary remains primary and browser, print, export, or cross-app handoff stays secondary, grant-bound, and same-shell truthful
- `mission_stack` must fold the same `SupportSurfacePosture`, current composer, and replay or observe state instead of creating a detached mobile support path

## Support start-of-day and queue contract

Support landing should show:

- one personal or team queue with SLA, severity, and changed-since-seen ordering
- recovery-needed work such as secure-link failure, delivery failure, attachment-access failure, or identity mismatch
- tickets awaiting subject reply or internal handoff
- escalations awaiting governance, clinical, or domain-owner action
- a slim dependency health strip for messaging, telephony, auth, and attachment services
- saved views for repeat operational modes such as `link repair`, `message recovery`, `identity correction`, and `observe only`

Queue cards should show:

- subject or requester summary
- linked request, booking, pharmacy, callback, or message refs where present
- latest inbound or outbound event
- current channel mix
- next recommended action
- time-to-breach
- repeat-contact signal when the same subject has contacted support recently

Queue state may be dense, but it should stay scan-first. Opening a ticket must preserve the current queue view, keyboard position, filter set, and pinned working set.

## Support workspace contract

The support shell should default to one high-throughput workspace, not disconnected tabs and tools.

Desktop composition should be:

- left workboard: search, saved views, queue, SLA buckets, and pinned ticket return
- center mission frame: ticket summary, omnichannel timeline, and the active response or recovery form
- right contextual rail: exactly one promoted support region chosen from knowledge, subject history, policy, or replay diff

Rules:

- default to `two_plane` composition with workboard plus mission frame
- allow `three_plane` only for replay, diff-heavy investigation, or explicit pin
- keep one dominant action at a time: reply, reissue, recover attachment, correct identity, escalate, or resolve
- only the active composer or recovery form and the latest relevant timeline cluster may start expanded; subject history, knowledge, policy, and replay detail remain summary-level unless promoted
- one shared status strip owns freshness, replay mode, awaiting-external posture, and recovery posture; local forms may acknowledge locally, but they may not duplicate shell state with extra banner stacks
- support freshness must resolve through the current `ProjectionFreshnessEnvelope` for the shell, timeline, and promoted knowledge or replay regions; queue recency, websocket health, or restored-tab activity may not by themselves return the ticket to calm or writable posture
- the dominant mutating action must always be backed by a live `SupportActionLease`; if the lease expires or the ticket version changes, the form morphs to a bounded refresh or recovery state instead of silently submitting stale intent
- preserve drafts per ticket and per channel when the agent scans other tickets
- buffer queue churn through `QueueChangeBatch`; the active ticket remains pinned
- queue churn may not revoke the current owner or action scope in place; ownership or permission changes must land through a visible ticket-state transition and lease refresh
- keep the ticket header compact and operational, with owner, SLA state, governing lineage refs, and current macro state visible without scrolling
- never require a page swap to open the timeline, linked objects, or support actions for the same ticket continuity key
- entering replay must suspend mutating controls, bind the shell to `SupportReplayCheckpoint`, and keep any pending drafts outside the replay snapshot until the agent explicitly returns to live mode; entering observe mode must suspend mutating controls, bind the shell to `SupportObserveSession`, and preserve the current disclosure ceiling until the agent explicitly returns to live mode
- every live support ticket shell must materialize beneath one `StaffWorkspaceConsistencyProjection`, one `WorkspaceSliceTrustProjection`, and one published `SupportSurfaceRuntimeBinding`; stale or withdrawn publication, parity drift, release freeze, or trust degradation must preserve the same shell and degrade through `ReleaseRecoveryDisposition`
- every live support ticket shell must also bind one current `WorkspaceTrustEnvelope(workspaceFamily = support_ticket)` so reply, reissue, escalation, recovery, interruption pacing, and completion calmness derive from the same consistency tuple, trust tuple, action lease, selected-anchor tuple, and settlement chain rather than from route-local form state
- any reply, reissue, attachment recovery, identity correction, escalation, transfer, or resolution compose flow must hold one canonical `ReviewActionLease` plus `WorkspaceFocusProtectionLease` and `ProtectedCompositionState`; disruptive deltas may freeze or downgrade the form, but they may not silently replace the active ticket intent, current draft, or selected anchor
- identity correction must run through one live `IdentityCorrectionRequest` plus canonical command settlement; support tools may not directly edit `Request.patientRef`, `Episode.patientRef`, session subject binding, or grant ownership outside the authority-settled binding chain
- when `IdentityRepairFreezeRecord(freezeState = active)` is attached to the ticket, the dominant workspace action must become correction, compensation, or governed handoff; reply, resend, secure-link reissue, ordinary resolution, and calm completion posture must stay suppressed until the relevant downstream `IdentityRepairBranchDisposition` or `IdentityRepairReleaseSettlement` explicitly reopens them
- secure-link reissue must run through one live `SecureLinkReissueRecord`, one fresh `AccessGrantScopeEnvelope`, and one authoritative `AccessGrantSupersessionRecord`; support tools may not copy or resend an older PHI-bearing URL token as if it were still valid
- closing, transferring, or launching next work from a support ticket must settle one `TaskCompletionSettlementEnvelope`; local acknowledgement is not enough to collapse the active ticket or release the pinned anchor
- the center mission frame must bind to `PrimaryRegionBinding`, shell-level cues must flow only through `StatusStripAuthority`, the dominant response or recovery path must hold `DecisionDockFocusLease`, and externally consequential mutation must stay inside `QuietSettlementEnvelope`; returning to calm is forbidden until `SupportReplayRestoreSettlement`, `SupportActionSettlement`, and current continuity evidence all agree
- support queue and saved-view empty states must explain why the queue is quiet, what usually appears here, and the fastest safe next action; do not backfill with dashboard filler or duplicated ticket summaries
- narrow `mission_stack` fold and unfold must preserve the active ticket, composer draft, blocker visibility, and return anchor

## Support responsive and narrow-screen contract

Support must preserve one ticket shell on narrow layouts; it may not fork into a second mobile toolset.

Rules:

- narrow layouts must realize the same support continuity key through `mission_stack`
- `stackOrder = ticket_summary_and_status -> active_timeline_and_action -> queue_workboard -> contextual_rail`
- if no ticket is open, `queue_workboard` is the default expanded region; if a ticket is open, `active_timeline_and_action` is the default expanded region
- the queue fold must retain the current saved view, search term, SLA bucket, and pinned ticket-return stub so the agent can scan without losing place
- the contextual fold may expose only the single promoted region chosen by attention budget; knowledge, subject history, policy, and replay diff may not each claim their own persistent tab or banner
- replay, observe-only, transfer-pending, and step-up recovery states must pin a blocker or mode stub at the top of the stack until resolved
- fold and unfold must preserve `SupportReplayCheckpoint`, `SupportObserveSession`, `SupportActionLease`, drafts, selected channel, scroll position, and keyboard return target
- narrow layouts may summarize secondary detail, but they may not hide the dominant action, current lease state, awaiting-external posture, or current recovery path

## Cohesive single-view ticket contract

The active ticket view should unify:

- a `CasePulse`-style ticket header with status, severity, owner, time-to-breach, and linked lineage
- one merged omnichannel timeline for email, SMS, secure message, callback, telephony summary, workflow events, and internal notes
- one active composer or recovery form
- a compact `SupportSubject360Projection` for identity, contact-route health, open objects, and recent outcomes
- a `SupportKnowledgeStackProjection` with articles, playbooks, macros, and policy notes
- a `SupportActionWorkbenchProjection` for reversible recovery actions
- a `SupportResolutionSnapshot` that captures outcome, handoff summary, and reusable resolution notes

The visual order should answer these questions in sequence:

1. who is this and what is broken
2. what happened last
3. what is the safest next action
4. what supporting knowledge or history matters now

Do not force the agent to jump across pages to see communication history, linked requests, or prior tickets for the same subject or request lineage.

Every live or recovery-bound ticket shell must materialize one `SupportTicketWorkspaceProjection`, one `SupportOmnichannelTimelineProjection`, one `SupportReachabilityPostureProjection`, and one `SupportActionWorkbenchProjection` from the same `ticketVersionRef`, `effectiveMaskScopeRef`, `selectedTimelineAnchorRef`, and `SupportSurfaceRuntimeBinding`; if those projections disagree, the mission frame must keep the current anchor but downgrade the workbench to provisional or `SupportReadOnlyFallbackProjection` posture in place.

Every active ticket shell must expose:

- current `ticketVersionRef`
- current `SupportActionLease` state
- whether a `SupportMutationAttempt` is unsettled
- whether the current shell is live, replay-bound, observe-only, or waiting on transfer acceptance

No support view may show a green resolved or sent state while the governing mutation attempt is still awaiting external confirmation or ownership acceptance.

## Omnichannel communication contract

Support communication should be merged into one timeline-first surface.

The timeline should combine:

- inbound and outbound email
- SMS and secure-message events
- callback attempts and outcomes
- telephony summaries or call-log events
- appointment, pharmacy, or workflow notifications
- internal notes, handoff notes, and escalation events

Rules:

- cluster events by causal exchange, not only by channel
- keep one active composer or action form expanded at a time
- preserve channel drafts when the agent switches from email to SMS or to callback follow-up
- show delivery, read, bounce, retry, and replay states inline on the relevant event
- surface suggested fallback channels only when policy and contact-route health allow them
- new inbound subject events may promote the conversation region, but they may not auto-expand knowledge, history, and replay at the same time
- resend, reissue, callback reschedule, channel change, and attachment recovery must all execute through one `SupportMutationAttempt`; duplicate submissions with the same idempotency key must return the live attempt instead of creating a second external side effect
- every controlled resend or repair exchange must bind one `SupportMutationAttempt`, one governing `MessageDispatchEnvelope`, the latest `MessageDeliveryEvidenceBundle`, and one `SupportActionSettlement`; provider callbacks, fallback decisions, and operator receipts must render beneath that same exchange instead of forking into detached timeline truth
- if `SupportMutationAttempt.attemptState = awaiting_external` or the linked `ThreadResolutionGate` has not yet authorized retry, the workbench must refuse a second resend, reissue, channel change, or attachment recovery and return the existing attempt in provisional posture
- `SupportActionSettlement.result = awaiting_external` may acknowledge local or processing progress, but `sent`, `delivered`, `resolved`, `transferred`, or `repaired` wording requires `authoritativeOutcomeState = settled`, the linked `MessageDeliveryEvidenceBundle`, or explicit authoritative fallback on the same governing chain
- communication mutations that are externally consequential must render a bounded `ConsequencePreview` before commit and stay visibly provisional until delivery, acknowledgement, or governed fallback is recorded
- every rendered thread must materialize one `SupportOmnichannelTimelineProjection`; if timeline freshness, masking, or replay boundary drifts, the same timeline anchor stays visible but the shell must downgrade to provisional, observe-only, or `SupportReadOnlyFallbackProjection` posture
- masked events must keep their original chronological slot, actor class, and delivery-state stub through labelled placeholders; the shell may hide bytes, but it may not reorder the investigation story by deleting redacted rows

## Controlled resend and delivery-repair contract

Support repair tooling must resolve one authoritative communication chain across operator intent, provider evidence, and patient-facing thread truth.

Rules:

- before arming resend, reissue, channel change, or attachment recovery, `SupportActionWorkbenchProjection` must load the current `SupportActionLease`, `SupportReachabilityPostureProjection`, `MessageDispatchEnvelope`, latest `MessageDeliveryEvidenceBundle`, `ThreadExpectationEnvelope`, and `ThreadResolutionGate`
- if the same ticket, governing thread version, and repair kind already have a live `SupportMutationAttempt` or the linked dispatch envelope is still awaiting authoritative evidence, the system must return that same attempt, preserve the selected timeline anchor, and refuse a second external side effect
- a fresh controlled resend may mint a new `MessageDispatchEnvelope` only after the current `ThreadResolutionGate` authorizes `repair_route | reopen` or the current `MessageDeliveryEvidenceBundle` settled `failed | expired | disputed`; otherwise the workbench stays provisional or falls to read-only recovery
- every provider receipt, webhook replay, manual attestation, or fallback handoff must reconcile through `AdapterReceiptCheckpoint` back onto the linked `MessageDispatchEnvelope` and then refresh `SupportActionSettlement` from that evidence chain
- `SupportOmnichannelTimelineProjection`, the action workbench, and patient conversation receipts must all read provisional versus authoritative state from the same dispatch, evidence, expectation, and resolution refs; support-local acknowledgement or accepted-for-processing state is never sufficient to imply final delivery or repair success
- replay exit, deep-link restore, masking drift, or runtime publication drift may preserve the current anchor and strongest confirmed artifact, but they must downgrade to `SupportReadOnlyFallbackProjection` until the same repair chain is safely restored

## Support shell anatomy, layout, and signal contract

The support workspace must preserve one legible ticket instrument even when data is stale, partially masked, or waiting on external systems.

Desktop layout should be governed explicitly:

- default to `two_plane` within one `PersistentShell`: workboard `320px` to `360px`, mission frame `min 720px`, contextual rail `320px` to `384px` only when promoted; otherwise the rail collapses to a narrow peek
- `three_plane` is legal only for replay diff, governance review, or explicit pin, never as the default quiet posture
- the ticket header must stay sticky at `72px` to `88px` tall with one `32px` to `40px` shared status strip directly beneath it; action bars remain inside the mission frame
- use `16px` plane gaps, `12px` cluster gaps, `8px` inline-chip spacing, and `24px` separation between header, timeline, and recovery-form groups

Typography and density should stay operational:

- subject and dominant ticket title: `18/24`, semibold, maximum two lines
- timeline body, recovery-form labels, and knowledge summaries: `14/20`
- metadata, timestamps, IDs, and SLA labels: `12/16` with tabular numerals; no critical meaning may live only in truncated microcopy
- queue rows may be dense, but interactive rows must remain at least `44px` high and dominant action rows at least `48px` high

Color and signal semantics must fail closed:

- neutral surfaces stay primary; severity, replay, observe, awaiting-external, and blocked states render as labelled chips, accent rails, and icons instead of full-panel color wash
- replay uses violet or indigo accent, observe uses slate outline, awaiting external uses amber, blocked or recovery uses coral, and calm success may use green only after authoritative settlement
- no state may rely on color alone; text, iconography, and posture copy are required in every severity or mode shift

Promotion and freshness math must be explicit:

- define `SupportProminenceScore_r = blockerWeight_r + actionabilityWeight_r + continuityRiskWeight_r + evidenceNoveltyWeight_r + manualPinBoost_r - compositionLockPenalty_r`
- auto-promote a contextual region only when its score is at least `70` and at least `12` points above the current promoted region; demote only when it falls below `56` across two consecutive evaluations or when the user closes or replaces it
- define `SupportFreshnessBand = live (<= 60s) | review_soon (> 60s and <= 300s) | stale (> 300s) | replay_frozen`; the ticket header, timeline, and action workbench must render the same band
- timeline clustering uses `causalExchangeRef` first and falls back to `(channel, 15-minute bucket, deliveryAttemptRef)`; delivery receipts and local echoes may not outrank the authoritative event they settle

Motion, responsiveness, and accessibility must preserve continuity:

- use `120ms` to `180ms` directional motion only for handoff, replay enter or exit, diff reveal, and bounded restore; recovery states may fade or outline, but they may not slide the ticket away
- reduced-motion mode must keep the same settlement, replay, and blocker markers without directional animation
- `mission_stack` must keep the sticky mode stub, selected timeline anchor, and disabled or writable action bar at the top of the stack; only one secondary fold may start expanded
- keyboard order is `status strip -> ticket header -> timeline cluster list -> active composer or workbench -> promoted support region -> queue return stub`
- named landmarks, live-region announcements only from the shared status strip, and focus restoration to the preserved anchor are required after replay release, observe return, or read-only reacquire

## Masking, artifact, and read-only fallback contract

Masked support states must preserve chronology, confidence, and the operator's place instead of collapsing or widening unpredictably.

Rules:

- ticket header, timeline clusters, subject summary, knowledge cards, and presentation artifacts must all render the current `effectiveMaskScopeRef`; refresh or deep-link restore may narrow that scope in place, but it may never widen without a fresh disclosure or step-up event
- quoted reply previews, resend previews, and resolution summaries may include only tokens permitted by the active `maskScopeRef`; when quoted source bytes are no longer allowed, the preview must degrade to governed summary tokens instead of stale raw text
- attachment previews, secure-link proof, resolution summaries, and history snippets must show `summary_only`, `inline_renderable`, `recovery_only`, or parity-warning posture directly in the `ArtifactSurfaceFrame`; full-fidelity preview may not be implied by thumbnail or filename alone
- when `SupportRouteIntentToken`, `SupportObserveSession`, `SupportSurfaceRuntimeBinding`, or disclosure scope expires, the shell must instantiate one `SupportReadOnlyFallbackProjection`, preserve the selected timeline anchor and strongest confirmed artifact, and offer only the shortest safe reacquire route
- read-only fallback and observe-only states must keep the current queue return stub, pinned draft summary, and transfer or replay breadcrumb visible; agents may explain, compare, or capture notes, but they may not commit new external side effects
- held drafts from `SupportReplayDraftHold` may resume live editing only when `SupportReplayRestoreSettlement.draftRestoreState = resumed`; otherwise the shell must keep a summary-only draft hold or explicit discard state instead of silently merging replay-era drafts into live mutation

## Contextual knowledge and playbook contract

The support desk should surface knowledge in context rather than as a detached portal.

High-priority context defects in this seam:

1. surfaced knowledge recommendations are ranked, but not yet bound to the active ticket version, mask scope, policy version, or runtime publication tuple, so stale or over-scoped guidance could remain live
2. macro apply, playbook launch, and knowledge-gap capture still behave like local UI affordances rather than fenced support actions, so stale context could leak into the active recovery path
3. subject-history expansion is compact by intent, but there is no first-class disclosure record for widening from summary into deeper linked context or break-glass-supported detail
4. articles, macros, playbook previews, and subject-history views are still described as inline content, not governed support artifacts with bounded external handoff
5. knowledge and subject-context interactions still do not explicitly require canonical UI observability and disclosure fencing at the point of use

Suggested context objects:

**SupportKnowledgeStackProjection**
`supportKnowledgeStackProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `ticketVersionRef`, `selectedTimelineAnchorRef`, `supportReachabilityPostureProjectionRef`, `supportActionWorkbenchProjectionRef`, `supportKnowledgeBindingRef`, `supportSubjectContextBindingRef`, `dominantRecommendationRef`, `secondaryRecommendationRefs[]`, `relevanceReasonRefs[]`, `recommendedActionRef`, `knowledgeGapState = not_needed | capturable | captured | follow_up_required`, `promotionState = summary_only | promoted`, `freshnessState = live | stale | observe_only | runtime_blocked`, `renderedAt`

`SupportKnowledgeStackProjection` is the sole authority for recommendation ordering, promotion, explanation, and freshness in the contextual rail. UI-local reordering, stale pinning, or detached knowledge tabs are forbidden; the current stack must be recomputed from the live ticket, current anchor, and governing publication posture.

**SupportKnowledgeBinding**
`supportKnowledgeBindingId`, `supportTicketId`, `supportLineageBindingRef`, `primaryScopeMemberRef`, `knowledgeStackProjectionRef`, `ticketVersionRef`, `policyVersionRef`, `maskScopeRef`, `routeFamilyRef`, `selectedTimelineAnchorRef`, `supportReachabilityPostureProjectionRef`, `supportActionWorkbenchProjectionRef`, `supportSurfaceRuntimeBindingRef`, `publicationDigestRef`, `projectionCompatibilityDigestRef`, `bindingHash`, `releaseRecoveryDispositionRef`, `bindingState = live | observe_only | stale | blocked`

`SupportKnowledgeBinding` is the context fence for surfaced guidance. The same recommendation card, article, macro, playbook, or outage note may remain live only while ticket version, selected anchor, current support-lineage binding, policy, mask scope, runtime publication, and projection compatibility all still match the bound digest.

**SupportKnowledgeAssistLease**
`supportKnowledgeAssistLeaseId`, `supportTicketId`, `supportKnowledgeBindingRef`, `supportActionLeaseRef`, `selectedRecommendationRef`, `selectedMacroRef`, `selectedPlaybookRef`, `selectedTemplateRef`, `assistIntent = open_article | preview_macro | apply_macro | launch_playbook | launch_fallback_channel | capture_knowledge_gap`, `ticketVersionRef`, `policyVersionRef`, `maskScopeRef`, `supportSurfaceRuntimeBindingRef`, `supportContextDisclosureRecordRef`, `reasonCode`, `issuedAt`, `expiresAt`, `leaseState = executable | preview_only | stale | blocked`

`SupportKnowledgeAssistLease` is the only authority for moving from preview into executable assist posture. Macro apply, playbook launch, fallback-channel suggestion launch, and knowledge-gap capture may not mutate the active response or recovery path without a live lease bound to the current knowledge binding and current support action lease.

**SupportSubject360Projection**
`supportSubject360ProjectionId`, `supportTicketId`, `supportLineageBindingRef`, `scopeMemberRefs[]`, `ticketVersionRef`, `subjectRef`, `visibilityTier`, `maskScopeRef`, `reachabilityPostureProjectionRef`, `openObjectRefs[]`, `repeatFailureSignalRefs[]`, `recentOutcomeRefs[]`, `summaryState = summary_only | expanded | stale | blocked`, `renderedAt`

`SupportSubject360Projection` is the compact, support-safe summary of identity, contact health, open objects, and repeat-failure context. It must remain summary-first and may widen only through the active context binding, disclosure record, and current support-lineage scope members.

**SupportSubjectContextBinding**
`supportSubjectContextBindingId`, `supportTicketId`, `supportLineageBindingRef`, `scopeMemberRefs[]`, `subject360ProjectionRef`, `supportKnowledgeBindingRef`, `ticketVersionRef`, `selectedTimelineAnchorRef`, `maskScopeRef`, `visibilityTier`, `supportSurfaceRuntimeBindingRef`, `contextWindowHash`, `releaseRecoveryDispositionRef`, `bindingState = summary_only | expanded | stale | blocked`

**SupportContextDisclosureRecord**
`supportContextDisclosureRecordId`, `supportTicketId`, `supportSubjectContextBindingRef`, `supportKnowledgeAssistLeaseRef`, `openedFromRef`, `requestedScope = summary | expanded_history | linked_object_detail | break_glass_context`, `requiredDisclosureClass`, `reasonCode`, `maskScopeRef`, `jitScopeRef`, `decisionRef`, `openedAt`, `expiresAt`, `closedAt`, `disclosureState = active | expired | revoked | closed`

`SupportContextDisclosureRecord` is the only authority for widening from governed summary into deeper history, linked-object detail, or break-glass-supported context. Expiry, revocation, or mask narrowing must collapse the reveal in place rather than leaving stale detail visible.

**SupportKnowledgeGapRecord**
`supportKnowledgeGapRecordId`, `supportTicketId`, `supportKnowledgeBindingRef`, `supportKnowledgeAssistLeaseRef`, `selectedTimelineAnchorRef`, `gapClass = no_match | stale_match | over_scoped_match | blocked_apply | abandoned_guidance | missing_policy_note | outage_unmodeled`, `reasonCode`, `ticketVersionRef`, `policyVersionRef`, `maskScopeRef`, `routeFamilyRef`, `recommendedOwnerRef`, `recommendedArtifactClass = article | macro | playbook | policy_note | outage_note | subject_context`, `linkedOutcomeRef`, `recordedByRef`, `recordedAt`, `closureState = open | merged | resolved`

`SupportKnowledgeGapRecord` is the canonical capture for missing, stale, blocked, or abandoned guidance. It must stay attached to the active ticket context and eventual outcome so recommendation failures become learnable system input rather than forgotten operator frustration.

The contextual rail should rank and show:

- matched knowledge-base articles
- channel-specific macros and templates
- policy notes and permission caveats
- similar resolved incident patterns
- active outage or dependency notices relevant to the ticket

Ranking inputs should include:

- reason category and origin channel
- linked lineage state
- recent action failures or retries
- identity, access, or attachment state
- tenant configuration and support role scope
- current `SupportReachabilityPostureProjection`, `SupportActionWorkbenchProjection`, and selected timeline anchor

Rank the rail through one explicit score:

- `SupportKnowledgeScore_k = relevanceWeight_k + consequenceFitWeight_k + freshnessWeight_k + ownerTrustWeight_k + recentSuccessWeight_k - scopePenalty_k - driftPenalty_k - promotionPenalty_k`

Rules:

- `SupportKnowledgeStackProjection` is the only source for recommendation ordering, promoted-region choice, explanation metadata, and `knowledgeGapState`; local UI caches may not keep a card armed after the bound stack drifts
- show only the top 1 to 3 recommendations as quiet cards by default
- explain why each recommendation is relevant
- show freshness, owner, and last-reviewed metadata
- expose applicability scope, governing ticket anchor, and whether deeper disclosure or executable assist is required before action
- open the full article, macro, or playbook inline or in a bounded side panel
- capture `knowledge_gap` through one `SupportKnowledgeGapRecord` when no suitable guidance exists or when the agent abandons surfaced guidance because it is stale, over-scoped, blocked, or ineffective
- every surfaced article, macro, policy note, outage notice, or similar-pattern card must bind one `SupportKnowledgeBinding`; if ticket version, policy version, `maskScopeRef`, `SupportSurfaceRuntimeBinding`, publication posture, or projection compatibility posture drifts, the rail must remain in the same shell and degrade through `ReleaseRecoveryDisposition` to summary-only, observe-only, or refresh-required posture rather than leaving stale guidance armed
- `SupportKnowledgeBinding` and `SupportKnowledgeAssistLease` must both invalidate when the selected timeline anchor, current action workbench posture, policy version, mask scope, or runtime publication tuple drifts; the current ticket shell stays open, but executable knowledge posture collapses in place
- macro apply, template apply, playbook launch, fallback-channel suggestion launch, and `knowledge_gap` capture must require one live `SupportKnowledgeAssistLease`; if the lease is stale or preview-only, the rail may explain or preview the action, but it may not mutate the active composer, recovery form, or ticket state
- if applying surfaced guidance changes the active recovery or response path, the action must resolve through one canonical `SupportActionRecord`, one `SupportActionSettlement`, and the active `TransitionEnvelope`; local macro insertion acknowledgement is not authoritative support progress
- articles, macros, playbook previews, and outage explainers are governed support artifacts. They must render through `SupportPresentationArtifact` bound to `ArtifactSurfaceFrame` plus one `ArtifactPresentationContract`; any print, export, browser, or cross-app handoff must consume `OutboundNavigationGrant` tied to the current ticket, mask scope, and return path
- any reveal from recommendation summary into deeper history, linked-object detail, or break-glass-supported context must create one `SupportContextDisclosureRecord`; expiry or revocation must collapse the reveal back to governed summary without losing the current ticket anchor
- every `SupportKnowledgeGapRecord` must classify the miss, cite the abandoned or missing recommendation context, and stay linked to eventual support outcome so gap backlogs can be deduplicated, routed, and closed from real ticket evidence
- every visible knowledge interaction, including recommendation reveal, inline article open, macro preview, playbook launch, and `knowledge_gap` capture, must emit one `UIEventEnvelope`, one `UITransitionSettlementRecord` where local acknowledgement can diverge from authoritative settlement or recovery posture, and one `UITelemetryDisclosureFence`

## Subject history and linked-context contract

The support desk should surface a compact `SupportSubject360Projection` rather than a sprawling dossier.

It should summarize:

- identity and verification state
- contact preferences and route health
- active requests, appointments, callbacks, pharmacy cases, and message threads
- the last few relevant support tickets and their outcomes
- repeated delivery, attachment, or access failures
- repeat-contact or recent-resolution signals where permitted

Rules:

- default to a summary stack, not a full profile page
- expand in place without leaving the ticket shell
- highlight anomalies and repeat patterns before raw chronology
- suppress unrelated historical detail until explicitly requested
- preserve the current ticket anchor when the agent opens subject history
- subject history and replay must render from masked support-safe projections, not from raw adapter payloads or unrestricted audit traces, and the active `maskScopeRef` must survive deep-link or refresh
- active contact-route, callback, secure-link, reminder, or pharmacy follow-up posture in subject history must render from `SupportReachabilityPostureProjection` over the current `ReachabilityAssessmentRecord` rows; support-local route health copies and stale demographic assumptions are forbidden
- every subject-summary and linked-context view must bind one `SupportSubjectContextBinding`; if ticket version, lineage scope, `maskScopeRef`, or `SupportSurfaceRuntimeBinding` drifts, the view must remain in the same shell and degrade through `ReleaseRecoveryDisposition` to summary-only or blocked posture rather than silently widening or disappearing
- any reveal beyond the default summary stack must create one `SupportContextDisclosureRecord` with reason, mask scope, and any JIT or break-glass scope needed for that reveal; expired or revoked disclosure must collapse back to the governed summary rather than leaving expanded context open
- subject-history snapshots, linked-object previews, prior-ticket summaries, and repeat-contact explainers are governed support artifacts. They must render through `SupportPresentationArtifact` bound to `ArtifactSurfaceFrame` plus one `ArtifactPresentationContract`; exports or external handoff must consume `OutboundNavigationGrant`
- subject-history reveal, collapse, linked-object preview, break-glass-supported context reveal, and history refresh must each emit one `UIEventEnvelope`, one `UITransitionSettlementRecord` when local expansion can diverge from authoritative scope, and one `UITelemetryDisclosureFence`

## Support user flows

### 1. Rapid triage and first response

1. The agent lands on a saved queue or search result.
2. Opening a ticket keeps the queue pinned and loads the workspace in the same shell.
3. The system auto-focuses the latest unresolved subject event, issues a `SupportRouteIntentToken`, and acquires a `SupportActionLease` for the safest next action.
4. `SupportKnowledgeStackProjection` renders only the top relevant recommendations under a live `SupportKnowledgeBinding`, with freshness, owner, and applicability cues visible before any macro or playbook can be armed.
5. Before the agent submits, the platform revalidates ticket version, owner scope, policy version, and mask scope against that lease.
6. The agent replies, reissues, or begins a recovery action without leaving the workspace, and the resulting `SupportMutationAttempt` appears in the timeline as provisional until the downstream system confirms or rejects it.

### 2. Communication failure recovery

1. A ticket opens on failed delivery, expired secure link, or attachment-access failure.
2. `SupportActionWorkbenchProjection` preselects the allowed recovery action from a live `SupportActionLease` and current `SupportReachabilityPostureProjection`, not from a static action list.
3. `SupportKnowledgeStackProjection` surfaces the relevant playbook only if policy, consequence preview, or channel nuance matters, and any executable follow-through must mint one live `SupportKnowledgeAssistLease`.
4. The agent executes controlled resend, reissue, channel change, or attachment recovery through one idempotent `SupportMutationAttempt` bound to the current `MessageDispatchEnvelope`, latest `MessageDeliveryEvidenceBundle`, and current `ThreadResolutionGate`.
5. If the surfaced guidance is stale, over-scoped, blocked, or abandoned, the same shell must capture one `SupportKnowledgeGapRecord` tied to the lease and ticket outcome before the rail returns to quiet posture.
6. The ticket stays open until the linked evidence bundle, governed fallback, or explicit handoff is recorded, and duplicate retry clicks resolve back into the same mutation attempt and same provisional timeline exchange.

### 3. Complex investigation and replay

The `Complex investigation and replay` requires five corrections:

1. replay entry now freezes one checkpoint hash, mask scope, and projection-version set instead of relying on a generic masked snapshot
2. live deltas now land in an explicit `SupportReplayDeltaReview` with severity and lease-impact classification instead of a raw buffer
3. escalation and evidence pivots from replay now use `SupportReplayEscalationIntent` so masked scope and return path cannot drift
4. active drafts now move into `SupportReplayDraftHold` and stay outside replay evidence so investigation cannot contaminate pending replies or recovery forms
5. replay exit, observe return, and ticket-level recovery now settle through `SupportReplayReleaseDecision`, `SupportReplayRestoreSettlement`, and explicit continuity evidence so lease reacquire, route-intent validity, pending external confirmations, quiet-posture restore, and live-control re-enable all happen only after live revalidation

1. The agent enters replay or diff mode from the active ticket.
2. The shell may upgrade to `three_plane`, with replay or diff becoming the only promoted support region, and the platform creates `SupportReplayCheckpoint` with the current `SupportLineageBinding`, actionable scope member, masked snapshot, `maskScopeRef`, disclosure ceiling, route-intent token, projection versions, selected timeline anchor tuple, queue anchor, timeline watermark, one `SupportReplayEvidenceBoundary`, and one `SupportReplayDraftHold`.
3. Live updates pause automatically while replay is active and accumulate into `SupportReplayDeltaReview`; informative deltas may wait, but lease-affecting, ownership-affecting, route-intent-affecting, mask-affecting, or pending-external-affecting deltas immediately invalidate replay mutation posture.
4. The agent can inspect the timeline, compare versions, and pivot into escalation or policy review only through `SupportReplayEscalationIntent`, which preserves the checkpoint, masked scope, and bounded return path without losing queue position.
5. Pending composers, attachment drafts, and recovery forms remain outside replay evidence under `SupportReplayDraftHold`, and mutating controls stay disabled until replay is released and live state is reconciled; replay may not silently absorb draft edits or provisional repair choices into the frozen evidence boundary.
6. Exiting replay requires `SupportReplayReleaseDecision`, visible delta review, fresh ticket version, valid route intent, reacquired `SupportActionLease`, current `SupportContinuityEvidenceProjection`, and the same current `SupportLineageBinding`; the shell may reopen live controls only after `SupportReplayRestoreSettlement.result = live_restored` and the linked `experienceContinuityEvidenceRef` validates the same ticket anchor and actionable scope member.
7. `SupportReplayRestoreSettlement.result = live_restored` is legal only when `checkpointHash`, `boundaryHash`, `routeIntentTupleHash`, `selectedTimelineAnchorTupleHashRef`, `currentMaskScopeRef`, `supportLineageBindingHash`, `draftRestoreState`, and the held mutation or settlement chain all reconcile to the same ticket anchor and the same actionable scope member; otherwise the shell must remain in `awaiting_external_hold`, `stale_reacquire`, or read-only recovery against that same anchor.

### 4. Handoff and resolution

1. The agent adds an internal summary or structured resolution code.
2. The handoff target or escalation path is selected from allowed lineage-aware destinations and written into `SupportOwnershipTransferRecord` with `acceptBy`, fallback owner, and structured handoff summary.
3. The ticket remains accountable to the current owner until the target accepts; if acceptance does not arrive by `acceptBy`, the ticket auto-returns or escalates according to policy rather than lingering unowned.
4. Once acceptance, auto-return, escalation, or final resolution is durable, `SupportTransferAcceptanceSettlement` determines whether the ticket closes, returns, or moves to `waiting-on-other-owner` with visible next-step wording and ownership evidence in the timeline; pre-settlement optimistic handoff wording is forbidden.
5. The resulting `SupportResolutionSnapshot` becomes reusable context for future repeat contacts.

## Support route contract

Suggested route family:

- `/ops/support`
- `/ops/support/inbox/:viewKey`
- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/conversation`
- `/ops/support/tickets/:supportTicketId/history`
- `/ops/support/tickets/:supportTicketId/knowledge`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`
- `/ops/support/tickets/:supportTicketId/handoff/:supportOwnershipTransferId`
- `/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId`
- `/ops/support/replay/:supportReplaySessionId`

Core support capabilities:

- search by request, patient, appointment, pharmacy case, callback case, clinician message thread, or support ticket
- open one ticket-centric workspace with omnichannel timeline, subject 360, and the governed `SupportLineageBinding`
- controlled resend, reissue, attachment recovery, and identity correction actions
- masked support replay and diff
- observe-only mode
- structured internal notes, handoff, escalation, and resolution capture
- contextual knowledge-base surfacing and knowledge-gap capture

Support routes must:

- reuse the same support shell while the `SupportTicket` continuity key is unchanged
- open conversation, history, knowledge, and action surfaces as child views, tabs, or drawers rather than detached pages
- restore the last quiet posture after replay, observe, escalation review, or policy inspection ends
- deep-link to the exact ticket cluster or action intent without bypassing policy checks
- require a live `SupportRouteIntentToken`, one current `SupportLineageBinding`, and one active actionable scope member before rendering mutating action controls, replay controls, or observe-only projections with elevated detail
- reopen expired, used, or scope-mismatched route intents in one `SupportReadOnlyFallbackProjection` with an explicit reacquire path rather than a generic access error
- preserve `maskScopeRef`, observe-only state, and step-up posture across refresh, deep-link entry, and child-route transitions
- `/ops/support/tickets/:supportTicketId/knowledge` and `/ops/support/tickets/:supportTicketId/history` must resolve one live `SupportKnowledgeBinding` or `SupportSubjectContextBinding` before showing anything beyond governed summary state; stale bindings degrade in place through the bound `ReleaseRecoveryDisposition`
- the `/knowledge` child route must preserve the selected timeline anchor, current promoted recommendation, and any active `SupportKnowledgeAssistLease`; if binding or assist posture drifts, the same shell must degrade to summary-only or refresh-required posture instead of reopening a stale macro or playbook
- deep-link entry into `/ops/support/replay/:supportReplaySessionId` must restore only from a live `SupportReplayCheckpoint` or fall back to one `SupportReadOnlyFallbackProjection` with replay reacquire guidance
- deep-link entry into `/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId` must restore only from a live `SupportObserveSession` or fall back to one `SupportReadOnlyFallbackProjection` with observe reacquire guidance
- observe child routes may widen detail only within `SupportObserveSession.disclosureCeilingRef`; they may never arm composer, reissue, resend, or identity-correction controls
- returning from replay, observe, diff, or escalation review must use `SupportReplayReleaseDecision`, `SupportReplayRestoreSettlement`, or `SupportReplayEscalationIntent`; browser back alone is not an authoritative restore path
- replay, observe, and action returns may restore live work only after `SupportReplayRestoreSettlement` proves the current replay checkpoint or observe session, route-intent tuple, selected timeline anchor tuple, current mask scope, current `SupportLineageBinding`, held-draft disposition, and pending external-confirmation posture still match the same support ticket anchor and actionable scope member
- if a replay exit finds an unsettled `SupportMutationAttempt` or `SupportActionSettlement.result = awaiting_external`, the same ticket shell must hold the action region in provisional state and refuse a second live recovery action until `SupportReplayRestoreSettlement` records whether work was safely restored or must re-acquire
- replay, observe, and action child routes must also validate `SupportContinuityEvidenceProjection`; if support continuity evidence is stale, blocked, or degraded, the shell may preserve the current ticket anchor and timeline, but it must not reopen live repair, resend, or identity-correction controls until same-shell restore posture is re-proven
- every support route that can render mutating or export-capable controls must validate the active `SupportSurfaceRuntimeBinding`; if `surfacePublicationRef`, `RuntimePublicationBundle`, or exact parity drift, the shell stays on the same ticket anchor and downgrades through the bound `ReleaseRecoveryDisposition` instead of raising a generic access failure
- every support route must also materialize the `FrontendContractManifest` named by `SupportSurfaceRuntimeBinding`, the bound `ProjectionContractVersionSet`, and the current `projectionCompatibilityDigestRef`; conversation, history, knowledge, replay, observe, and action surfaces may read only through declared `ProjectionQueryContract` refs, mutate only through declared `MutationCommandContract` refs, consume live deltas only through declared `LiveUpdateChannelContract` refs, and preserve cached ticket state only through the declared `ClientCachePolicy`
- ticket chronology shape, macro metadata, and cached action context may not imply writable repair posture, export readiness, or restore semantics when the active support manifest or runtime binding has degraded
- replay evidence, attachment previews, resolution summaries, secure-link proof, and ticket export bundles must render through one `SupportPresentationArtifact` bound to `ArtifactSurfaceFrame` plus one `ArtifactPresentationContract`; any external browser, print, or cross-app handoff must consume one short-lived `OutboundNavigationGrant` tied to the current ticket, mask scope, and return path
- deep-link entry into knowledge or history child routes may not bypass disclosure or assist-lease checks. If the route requests expanded history, linked-object detail, macro apply, or playbook launch without a live `SupportContextDisclosureRecord` or `SupportKnowledgeAssistLease`, the shell must reopen in summary-only mode with an explicit reacquire path

## Support empty, loading, degraded, and recovery posture

Support states must stay calm without becoming misleading.

Rules:

- inbox, queue, and saved-view empty states must explain why nothing is shown, what normally appears here, and the fastest safe next action such as clearing a filter, returning to the pinned ticket, or widening the queue scope
- on hydration or refresh, keep the current workboard chrome, ticket header, and dominant action region visible; render skeletons only for missing panels rather than blanking the shell
- if `SupportMutationAttempt` or `SupportActionSettlement` is still awaiting external confirmation, keep the initiating action region, strongest confirmed artifact, and governing ticket anchor visible in provisional posture; do not show `sent`, `resolved`, or `transferred` as final shell truth yet
- if `SupportSurfaceRuntimeBinding`, `SupportActionLease`, `ReviewActionLease`, or `WorkspaceFocusProtectionLease` drifts, preserve the same ticket shell and downgrade the affected form into bounded read-only recovery with an explicit reacquire path
- if replay exit, observe return, or handoff acceptance is still unsettled, hold the shell in provisional or read-only restore posture and keep the replay or transfer breadcrumb visible until the governing restore or acceptance record settles
- if mask scope narrows, disclosure expires, or route intent falls out of scope, preserve the current chronology with labelled masked placeholders and fall to `SupportReadOnlyFallbackProjection` instead of blanking the ticket
- stale messaging, telephony, auth, or attachment dependencies may disable the specific affected actions, but they must not discard the active ticket, current timeline context, or queued draft text
- export, print, and external handoff states must stay summary-first inside the same ticket shell until `SupportPresentationArtifact` and `OutboundNavigationGrant` truth are ready; recovery-only artifacts must never masquerade as full-fidelity previews

## Support verification contract

Ship Playwright and contract coverage for:

- same-shell reuse across ticket child routes for conversation, history, knowledge, handoff, replay, observe, and action work
- queue churn buffering while the active ticket anchor, composer draft, and `SupportActionLease` remain pinned
- `mission_stack` fold and unfold preserving the active ticket, dominant action, blocker or mode stub, and single promoted support region
- replay entry and replay exit preserving drafts, enforcing provisional or read-only restore posture, and refusing premature live mutation
- replay exit requiring matching checkpoint hash, evidence-boundary hash, route-intent tuple, selected timeline anchor tuple, and mask scope before live mutation resumes
- observe deep-link entry preserving disclosure ceiling, refusing mutation, and restoring the same selected timeline anchor on exit
- observe and replay restore keeping held drafts summary-only whenever mask scope, route intent, or ticket version drift blocks safe resume
- masked timeline clusters and artifact placeholders preserving chronology, actor class, and reply-summary integrity when scope narrows or disclosure expires
- handoff acceptance, auto-return, and escalation remaining provisional until `SupportTransferAcceptanceSettlement` authorizes final shell and queue wording
- runtime-binding, lease, or continuity-evidence drift degrading the current ticket shell in place rather than ejecting the agent to a generic access or error page
- awaiting-external posture preventing premature `sent`, `resolved`, `transferred`, or `done` wording in the shell, queue row, and action region
- duplicate resend clicks, worker replay, and out-of-order provider receipts collapsing to one `SupportMutationAttempt`, one `MessageDispatchEnvelope`, and one `SupportActionSettlement`
- support timeline, action workbench, and patient conversation receipt agreeing on `awaiting_external`, `repair_required`, `delivered`, `disputed`, and `settled` posture for the same communication chain
- read-only fallback preserving the held repair refs and refusing a second resend until restore or authoritative fallback settles
- read-only fallback preserving replay breadcrumb, checkpoint ref, draft hold, and strongest confirmed artifact while restore remains unresolved
- ticket-version, mask-scope, policy-version, or runtime-publication drift degrading `SupportKnowledgeStackProjection` and invalidating `SupportKnowledgeAssistLease` in place rather than leaving stale recommendations armed
- macro apply, playbook launch, fallback-channel suggestion launch, and `knowledge_gap` capture requiring one live `SupportKnowledgeAssistLease` and, when they alter the active path, one authoritative `SupportActionRecord` plus `SupportActionSettlement`
- `SupportKnowledgeGapRecord` classification, dedupe, and outcome linkage covering no-match, stale-match, over-scoped, blocked-apply, and abandoned-guidance cases
- `SupportContextDisclosureRecord` expiry or revocation collapsing expanded history or linked-object detail back to governed summary without losing the current ticket anchor

Stable, PHI-safe automation anchors must exist for:

- `support-shell`
- `support-workboard`
- `support-ticket-frame`
- `support-status-strip`
- `support-decision-dock`
- `support-context-rail`
- `support-ticket-anchor`
- `support-replay-state`
- `support-observe-state`
- `support-read-only-fallback`
- `support-transfer-state`
- `support-recovery-state`

## Governance requirements

Support actions must be:

- policy-checked
- reason-coded
- role-scoped
- routed through `ScopedMutationGate` with one governing `SupportTicket`, one governing object descriptor, one governing object, one current governing-object version or fence, one exact route-intent tuple, and the current lineage fence epoch before any resend, replay, reissue, identity correction, or access-affecting change is executed
- just-in-time scoped for actions that can widen visibility, rotate active contact routes, reissue PHI-bearing links, or alter identity binding
- dual-controlled where policy marks the action as access-affecting, irreversible, or cross-organisational
- auditable
- reversible where possible
- bound to a governing `SupportTicket` and visible lineage context
- rendered back into the ticket timeline and `SupportResolutionSnapshot`
- bound to one current `SupportLineageBinding`, one explicit actionable `SupportLineageScopeMember`, and source-bound `SupportLineageArtifactBinding` records for any durable summaries, notes, transcripts, or exports
- backed by a live `SupportActionLease` and, when externally consequential, by a `SupportMutationAttempt` whose `ownershipEpochRef` and `fencingToken` still match the current support and workspace ownership chain
- blocked from final success wording until external confirmation, `SupportTransferAcceptanceSettlement`, or governed fallback is durable
- returned as `SupportActionSettlement` inside the same ticket shell rather than as detached toast-only confirmation
- forced into same-shell stale recovery or manual handoff when the ticket view, governing object, governing-object version, route-intent tuple, or permitted scope changed before settlement
- if a support-side action, override, or structured capture introduces evidence that could alter clinical safety, contact-safety, chronology, or contradiction burden, it must route through canonical `EvidenceAssimilationCoordinator`, settle `EvidenceAssimilationRecord` plus `MaterialDeltaAssessment`, and fail into same-shell safety interruption rather than persisting as a local ticket note
- if replay, observe return, deep-link restore, transfer return, or escalation return crosses ticket-version, mask-scope, or external-confirmation drift, `SupportReplayRestoreSettlement` must be the authority on whether the shell resumes live work, holds awaiting-external posture, or stays read-only
- supervisor takeover, transfer acceptance, or replay-driven reacquire may not reuse the previous owner's live mutation posture; they must rotate `SupportActionLease` through audited stale-owner recovery before resend, reissue, identity correction, or resolution commit becomes writable again
- support governance and restore decisions must also emit or consume the current `SupportContinuityEvidenceProjection` so support replay restore can be attested, diagnosed, and wave-gated from the same assurance spine as patient continuity controls
- if macro apply, playbook launch, fallback-channel suggestion launch, or `knowledge_gap` capture can alter the active response, recovery path, or governed context, it must be reason-coded, bound to one live `SupportKnowledgeAssistLease`, and when mutating must settle through `SupportActionRecord` plus `SupportActionSettlement` instead of remaining local rail state
- safe under replay, observe-only, and deep-link re-entry semantics
- resolved from one `RouteIntentBinding`, one exact target tuple, one canonical `CommandActionRecord`, and one authoritative `CommandSettlementRecord`; `SupportActionSettlement` is a support-shell receipt derived from those canonical mutation objects plus the active `TransitionEnvelope`
- once `RouteIntentBinding` exists, ticket deep links, copied macros, prior ticket tabs, and local sidebar state may not retarget a support mutation to a sibling `SupportTicket`, older ticket version, different `SupportLineageBinding`, or different linked governing object
- blocked from live action when the current `SupportSurfaceRuntimeBinding`, `SupportActionLease`, `ReviewActionLease`, or `WorkspaceFocusProtectionLease` has expired, drifted, downgraded, or opened `StaleOwnershipRecoveryRecord`; same-shell `ReleaseRecoveryDisposition` is mandatory when writable posture is no longer valid

All PHI-bearing support and staff-support transitions must also emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative settlement, external confirmation, replay restore, or release-recovery posture
- one `UITelemetryDisclosureFence` proving that ticket refs, route params, subject identifiers, message fragments, and artifact payloads were redacted to the permitted disclosure class

Analytics, replay traces, and automation may observe publication, trust, settlement, and recovery posture, but they may not leak protected data into traces, selectors, or event payloads.

## Cross-domain queue rules

Operational lists should be lineage-aware.

- callback and message work should appear with triage context
- hub and pharmacy exceptions should appear with request lineage
- repeat contacts should cluster around the active `SupportTicket`, current `SupportLineageBinding`, or latest `SupportResolutionSnapshot` when the same subject and lineage are involved
- support actions should never bypass clinical workflow ownership
