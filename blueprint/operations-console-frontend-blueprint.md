# Operations console front-end blueprint

## Purpose

This document defines the canonical front-end strategy for the Vecells Operations Console.

It is the source of truth for:

- macro operational oversight
- dynamic resource allocation
- real-time system health monitoring
- continuity-preserving drill-down across `/ops/*`

The console must let an operational leader answer, within seconds:

- what is breaking, slowing, or drifting
- where finite capacity should move next
- which essential functions or dependencies are at risk
- which queue, site, partner, or cohort is absorbing the pressure
- what intervention has the highest safe operational leverage

The console is not a generic BI dashboard. It is a live control surface built on the same continuity, freshness, and projection rules as the rest of the platform.

This specialization governs the shared operations shell, masthead, board composition, live-update pacing, and return-to-board behavior for the live control-room routes under `/ops/*`. It does not replace the domain semantics defined in `phase-9-the-assurance-ledger.md`, and it does not override approval, promotion, or policy-editing rules from `platform-admin-and-config-blueprint.md` or the Governance and Admin Shell contract in `governance-admin-console-frontend-blueprint.md`.

## 1. Operating stance

1. Dense by design, quiet by default.
2. One dominant anomaly, one dominant intervention surface, one preserved board context.
3. Actionability outranks volume.
4. Recommendations may accelerate decisions, but operators remain the allocator of ownership, capacity, and escalation.
5. Every board state must declare freshness, confidence, and scope.
6. Drill-down must preserve filters, horizon, selected anomaly, and return path.
7. Real-time motion must explain change without making the board feel unstable.
8. The console must remain useful during degraded or partially stale states.

## 1A. Visual token profile

The console inherits `design-token-foundation.md` through `profile.operations_console`.

- shell chrome, masthead, `NorthStarBand`, and `InterventionWorkbench` stay in `balanced` density; only ranked grids, heat cells, and non-editable telemetry tables may use `dense_data`
- operational boards must use the shared surface roles for board, card, list, table, and drawer surfaces; do not invent dashboard-specific radii, shadows, or local accent palettes
- chart, matrix, and heat-cell emphasis must come from semantic state, boundary contrast, iconography, and copy before saturation or elevation
- drawers, compare panes, and investigation surfaces use the same pane widths, spacing rhythm, and motion tokens as other shells so drill-down feels continuous rather than like a second application

## 1B. Design language: Quiet Operations Mission Control

The operations console should feel like a calm control room rather than a BI dashboard wall.

- surfaces should read as graphite, slate, and fog planes with separators and pinned rails rather than floating card mosaics
- typography should use compact section titles, restrained numerics, and tabular numerics for rates, queue ages, SLAs, timestamps, and forecast intervals; do not introduce poster-size KPI hero figures
- density should stay high where operators compare ranked rows, health cells, and scenario tables, but quiet in the masthead, shared status strip, and action dock
- spacing uses one disciplined scale `8 | 12 | 16 | 24 | 32`; dense rows may compress to `8`, ordinary controls to `12` or `16`, plane gutters to `24`, and only pinned anomaly or blocker frames may claim `32`
- semantic tone belongs to anomaly state, readiness, freshness, and freeze posture, not decorative surface backgrounds; neutral planes should dominate and accents should remain sparse
- motion should stay causal and short for selection pin, batch apply, restore, threshold-cross acknowledgement, and settlement; ambient animation, count-up theatre, and decorative chart motion are forbidden
- shell freshness and freeze cues belong in one shared strip first, surface badges second, and banners only for blockers, freezes, or recovery-required posture

Instantiate the calm-density contracts as:

- `DensityProfile(routeClass = operations_control_room, defaultInformationDensity = dense, maxSimultaneousDenseRegions = 2, primaryScanDepth = anomaly_then_action, supportsTableFirst = true)`
- `RegionBreathingMap(mastheadDensity = sparse, primaryWorkRegionDensity = dense, supportRegionDensity = balanced, spacingBands = 8_12_16_24_32, collapseOrder = cohort | health | capacity | context)`
- `CompressionFallbackPlan(breakpointClass = ops_wide | ops_laptop | ops_folded, fallbackTopology = two_plane | mission_stack, requiredPinnedElements = selected_anomaly | intervention_workbench | freshness_strip | queued_delta_digest)`

## 2. Shell, continuity, and routes

High-priority shell gaps in this layer:

1. `entityContinuityKey` is overloaded for both shell reuse and exact board restoration, which risks either unnecessary shell churn or restoration into the wrong scoped state
2. `selectedAnomalyRef`, `selectedInterventionRef`, and `selectedHealthNodeRef` are not tuple-bound, so operators can act on stale projections after live drift
3. `pausedDeltaBatchRef` exists, but compare, diagnostic, and incident-command freezes do not define a stable base snapshot, exact queued tuple drift, or safe delta re-entry path
4. `OpsReturnToken` is referenced but not hardened with board tuple, selection lease, runtime publication parity, freeze posture, expiry, permission, or stale-selection rules, so cross-shell return can restore invalid operational context
5. the route family lacks deep-link intent contracts for investigation, intervention, compare, and health drill-down, so child routes can bypass continuity and policy checks
6. `InterventionWorkbench` has readiness rules, but not one explicit action-eligibility fence, so stale board snapshots, stale leases, open delta gates, or drifted trust posture can leave live controls armed
7. continuity-rooted investigations still depend too much on the latest symptom view, so an `InvestigationDrawer` or return path can silently rebase from the preserved proof basis to fresher evidence without naming the drift

For the operations console, split shell identity from board state:

- `shellContinuityKey = operations + boardScopeRef + timeHorizon + scopePolicyRef`
- `boardStateDigestRef = opsLens + globalFilterSetRef + selectedAnomalyTupleHash + selectedInterventionTupleHash + selectedHealthNodeTupleHash + compareScenarioState + investigationDrawerState + actionEligibilityFenceDigestRef`

`shellContinuityKey` governs whether the same `OperationsConsoleShell` is reused. `boardStateDigestRef` governs exact restoration within that shell.

Add these shell contracts:

**OpsBoardStateSnapshot**
`opsBoardStateSnapshotId`, `shellContinuityKey`, `boardStateDigestRef`, `boardTupleHash`, `opsLens`, `boardScopeRef`, `timeHorizon`, `globalFilterSetRef`, `selectedAnomalyRef`, `selectedAnomalyTupleHash`, `selectedInterventionRef`, `selectedInterventionTupleHash`, `selectedHealthNodeRef`, `selectedHealthNodeTupleHash`, `investigationDrawerState`, `interventionWorkbenchState`, `compareScenarioState`, `activeRouteIntentRef`, `selectionLeaseRefs[]`, `actionEligibilityFenceRef`, `deltaGateRef`, `deltaGateState = closed | buffering | reconcile_required | released`, `assuranceSliceTrustRefs[]`, `continuityControlHealthRefs[]`, `continuityEvidenceRefs[]`, `continuitySetHashes[]`, `continuityQuestionHashRefs[]`, `investigationDrawerSessionRefs[]`, `auditQuerySessionRefs[]`, `investigationScopeEnvelopeRefs[]`, `investigationQuestionHashRefs[]`, `timelineReconstructionRefs[]`, `breakGlassReviewRefs[]`, `dataSubjectTraceRefs[]`, `operationalReadinessSnapshotRefs[]`, `runbookBindingRefs[]`, `recoveryControlPostureRefs[]`, `recoveryEvidencePackRefs[]`, `recoveryEvidenceArtifactRefs[]`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHashes[]`, `releaseFreezeRefs[]`, `releaseWatchTupleRefs[]`, `releaseTrustFreezeVerdictRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `lastWaveActionSettlementRefs[]`, `scrollAnchorRef`, `capturedAt`

**OpsSelectionLease**
`opsSelectionLeaseId`, `shellContinuityKey`, `opsBoardStateSnapshotRef`, `boardTupleHash`, `selectionType`, `entityRef`, `entityTupleHash`, `projectionVersionRef`, `routeIntentRef`, `routeIntentTupleHash`, `guardrailSummaryRef`, `trustRecordRef`, `continuityEvidenceRef`, `releaseGuardrailStateRef`, `releaseTrustFreezeVerdictRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `issuedAt`, `expiresAt`, `scopePolicyRef`, `leaseState = live | stale_review | invalidated | released`, `staleReasonRefs[]`

**OpsDeltaGate**
`opsDeltaGateId`, `shellContinuityKey`, `gateReason`, `baseSnapshotRef`, `baseBoardTupleHash`, `baseSelectionLeaseRefs[]`, `baseRouteIntentRefs[]`, `baseProjectionVersionRefs`, `queuedDeltaBatchRefs`, `queuedTupleDriftRefs[]`, `materialDeltaCount`, `eligibilityState = frozen_diagnostic | reconcile_required | safe_apply | stale_reacquire | read_only_recovery`, `openedAt`, `reconcileMode`, `releasedAt`

**OpsReturnToken**
`opsReturnTokenId`, `shellContinuityKey`, `boardStateSnapshotRef`, `boardTupleHash`, `requiredSelectionLeaseRefs[]`, `requiredSelectionLeaseTupleHashes[]`, `requiredRouteIntentRefs[]`, `requiredDeltaGateState = closed | released`, `requiredActionEligibilityFenceRef`, `requiredReleaseTrustFreezeVerdictRef`, `requiredSurfacePublicationRef`, `requiredRuntimePublicationBundleRef`, `assuranceSliceTrustRefs[]`, `continuityControlHealthRefs[]`, `continuityEvidenceRefs[]`, `continuitySetHashes[]`, `continuityQuestionHashRefs[]`, `investigationDrawerSessionRefs[]`, `auditQuerySessionRefs[]`, `investigationScopeEnvelopeRefs[]`, `investigationQuestionHashRefs[]`, `timelineReconstructionRefs[]`, `breakGlassReviewRefs[]`, `dataSubjectTraceRefs[]`, `operationalReadinessSnapshotRefs[]`, `runbookBindingRefs[]`, `recoveryControlPostureRefs[]`, `recoveryEvidencePackRefs[]`, `recoveryEvidenceArtifactRefs[]`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHashes[]`, `releaseFreezeRefs[]`, `releaseWatchTupleRef`, `lastWaveActionSettlementRef`, `originAudienceSurfaceRuntimeBindingRef`, `originPublicationParityRef`, `governanceHandoffRef`, `requiredGovernanceScopeChecksum`, `requiredGovernanceAudienceSurfaceRuntimeBindingRef`, `requiredGovernancePublicationParityRef`, `scopePolicyRef`, `issuedToRef`, `issuedAt`, `expiresAt`, `fallbackLens`, `fallbackReason`, `usedAt`

**OpsGovernanceHandoff**
`opsGovernanceHandoffId`, `opsReturnTokenRef`, `boardStateSnapshotRef`, `selectionLeaseRefs`, `opsInterventionActionRecordRef`, `opsBriefingArtifactRef`, `targetGovernanceRouteRef`, `targetPolicyPlane`, `requiredGovernanceScopeChecksum`, `requiredGovernanceAudienceSurfaceRuntimeBindingRef`, `requiredGovernancePublicationParityRef`, `requiredReleaseApprovalFreezeRef`, `requiredReleaseWatchTupleRef`, `requiredWaveObservationPolicyRef`, `requiredLastWaveActionSettlementRef`, `requiredChannelFreezeRefs[]`, `requiredGuardrailSnapshotRef`, `requiredRecoveryDispositionRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `handoffReasonCode`, `originDiagnosticPosture = observe_only | advisory | blocked`, `requiredGovernancePosture = review_only | approval_ready | promotion_watch | rollback_review | blocked`, `handoffState = armed | entered | stale | superseded | returned`, `issuedAt`, `expiresAt`, `usedAt`, `returnedAt`

**OpsRouteIntent**
`opsRouteIntentId`, `shellContinuityKey`, `boardStateSnapshotRef`, `boardTupleHash`, `intentType`, `targetRef`, `canonicalObjectDescriptorRef`, `targetVersionRef`, `targetTupleHash`, `selectedAnomalyTupleHash`, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, `parentAnchorRef`, `routeIntentTupleHash`, `requiresSelectionLease`, `requiredSelectionLeaseRef`, `requiredDeltaGateState = closed | released`, `requiresStepUp`, `trustFenceRef`, `continuityEvidenceFenceRef`, `operationalReadinessSnapshotRef`, `recoveryControlPostureRef`, `recoveryEvidencePackRef`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHash`, `releaseFreezeRef`, `releaseTrustFreezeVerdictRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseWatchTupleRef`, `lastWaveActionSettlementRef`, `maskScopeRef`, `issuedAt`, `expiresAt`, `usedAt`

**OpsActionEligibilityFence**
`opsActionEligibilityFenceId`, `opsBoardStateSnapshotRef`, `boardTupleHash`, `selectedEntityTupleHash`, `selectionLeaseRef`, `routeIntentRef`, `deltaGateRef`, `requiredAssuranceSliceTrustRefs[]`, `requiredContinuityEvidenceRefs[]`, `requiredReleaseTrustFreezeVerdictRef`, `requiredSurfacePublicationRef`, `requiredRuntimePublicationBundleRef`, `eligibilityState = live_commit | observe_only | stale_reacquire | read_only_recovery | governance_handoff_only | blocked`, `reacquireActionRef`, `lastValidatedAt`

**OpsInterventionActionRecord**
`opsInterventionActionRecordId`, `shellContinuityKey`, `boardStateSnapshotRef`, `boardTupleHash`, `routeIntentRef`, `selectionLeaseRef`, `selectionLeaseState`, `deltaGateRef`, `actionEligibilityFenceRef`, `targetRef`, `canonicalObjectDescriptorRef`, `targetVersionRef`, `targetTupleHash`, `selectedAnomalyTupleHash`, `routeIntentTupleHash`, `actionType`, `trustFenceRef`, `continuityEvidenceFenceRef`, `releaseFreezeRef`, `releaseTrustFreezeVerdictRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `returnTokenRef`, `idempotencyKey`, `createdAt`, `settledAt`

**OpsInterventionSettlement**
`opsInterventionSettlementId`, `opsInterventionActionRecordRef`, `result = pending_effect | handoff_required | handoff_active | read_only_diagnostic | applied | stale_reacquire | blocked_guardrail | denied_scope | failed`, `diagnosticPosture = live_commit_capable | read_only_diagnostic | blocked`, `boardTupleHash`, `targetTupleHash`, `selectionLeaseRef`, `selectionLeaseState`, `deltaGateEligibilityState`, `routeIntentTupleHash`, `releaseTrustFreezeVerdictRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `opsGovernanceHandoffRef`, `governanceScopeState = not_needed | pending | accepted | stale | blocked`, `governanceReturnIntentTokenRef`, `governanceActionSettlementRef`, `releaseWatchTupleRef`, `waveActionSettlementRef`, `publicationParityRef`, `freezeDispositionRef`, `recoveryActionRef`, `staleReasonRefs[]`, `recordedAt`

`OperationsConsoleShell` extends `PersistentShell` with:

- `shellContinuityKey`
- `boardStateDigestRef`
- `opsLens = overview | queues | capacity | dependencies | audit | assurance | incidents | resilience`
- `boardScopeRef`
- `timeHorizon`
- `globalFilterSetRef`
- `selectedAnomalyRef`
- `selectedInterventionRef`
- `selectedHealthNodeRef`
- `investigationDrawerState`
- `interventionWorkbenchState`
- `compareScenarioState`
- `opsReturnTokenRef`
- `selectionLeaseRef`
- `deltaGateRef`
- `boardStateSnapshotRef`
- `routeIntentRef`
- `actionEligibilityFenceRef`
- `pausedDeltaBatchRef`

Rules:

1. `/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies` should normally reuse one shell when `shellContinuityKey` remains stable.
2. Default layout is `two_plane`: anomaly field in the main plane and `InterventionWorkbench` in the secondary plane.
3. `three_plane` is reserved for explicit compare, diagnostic, or incident-command work.
4. Narrow widths must fall back to `mission_stack`.
5. Changing only `opsLens`, filter state, selected anomaly, investigation drawer, or compare state must morph inside the same shell and capture a fresh `OpsBoardStateSnapshot`; changing `boardScopeRef`, `timeHorizon`, or `scopePolicyRef` must fork a new shell.
6. Any promoted anomaly, intervention, or health node must hold a live `OpsSelectionLease` bound to the current `OpsBoardStateSnapshot.boardTupleHash`, exact target tuple, and current runtime publication and freeze posture; if the lease expires, tuple drift appears, or the backing projection version changes, the promoted surface stays visible but mutating controls freeze until the selection is reacquired.
7. Entering compare, diagnostic, or incident-command freeze must open `OpsDeltaGate` against a captured base snapshot. Live deltas queue against the gate, preserve queued tuple drift, and may not silently mutate the frozen comparison basis.
8. Releasing `OpsDeltaGate` must present a bounded re-entry outcome: apply queued deltas in place, keep the frozen view as read-only if reconciliation fails, or reacquire the active selection lease before allowing commit. `InterventionWorkbench` may not render `commit_ready` while `OpsDeltaGate.eligibilityState != safe_apply`.
9. Cross-shell launches into workspace, hub, pharmacy, or governance surfaces must emit a hardened `OpsReturnToken` so the operator can return to the same board state.
10. Governed mutation handoffs from these routes must mint one `OpsGovernanceHandoff` plus the corresponding `OpsReturnToken`; the operations shell must not grow a second independent config, access, or promotion workflow, and browser history is not an acceptable substitute for that handoff contract.
11. Returning with an expired token, invalid scope, stale board snapshot, drifted board tuple, stale selection lease tuple, or degraded runtime publication bundle must restore the nearest valid shell and show an explicit restore report rather than a blank reset or silent context drift.
12. Deep links into investigation, compare, intervention, or health drill-down must require `OpsRouteIntent`; if the intent is expired, out of scope, missing the current target tuple, bound to a stale board tuple, or points to a vanished or superseded entity, open the same shell in read-only recovery posture with a reacquire path.
13. `/ops/overview`, `/ops/assurance`, and `/ops/audit` must serialize visible `AssuranceSliceTrustRecord`, `ContinuityControlHealthProjection`, `ExperienceContinuityControlEvidence`, any active `continuityQuestionHash`, any active `InvestigationDrawerSession`, any active `AuditQuerySession`, any active `InvestigationScopeEnvelope`, any active `InvestigationTimelineReconstruction`, any active `BreakGlassReviewRecord`, any active `DataSubjectTrace`, any active channel `ChannelReleaseFreezeRecord`, the current `ReleaseTrustFreezeVerdict`, and any active `ReleaseWatchTuple` plus its last settled wave action into board snapshots, return tokens, route intents, and `OpsActionEligibilityFence` so restored boards cannot come back greener than the system now is.
13A. `/ops/resilience` must also serialize visible `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `RecoveryControlPosture`, current `RecoveryEvidencePack`, current `ResilienceActionSettlement`, current `resilienceTupleHash`, and `RecoveryEvidenceArtifact` refs into board snapshots, return tokens, route intents, and `OpsActionEligibilityFence` so restore, failover, and chaos controls cannot come back greener than the current runtime tuple now allows.
14. If the selected slice becomes `quarantined`, `OpsActionEligibilityFence` falls below `live_commit`, or a linked rollout enters freeze, preserve the same shell, pin the last stable board as context, and switch only the affected action regions to read-only diagnostic posture or stale-reacquire posture with a governance handoff when needed.
15. Any intervention-ready action launched from `InterventionWorkbench` must validate `OpsActionEligibilityFence.eligibilityState = live_commit`, write `OpsInterventionActionRecord`, and settle through `OpsInterventionSettlement`; advisory copy, handoff banners, local deep-link success, or optimistic button state may not stand in for authoritative outcome.
15A. `InterventionWorkbench`, compare freeze, governance handoff, and same-board recovery must also bind one current `WorkspaceTrustEnvelope(workspaceFamily = ops_intervention)` so selection lease truth, action eligibility, buffered deltas, and completion calmness derive from the same authoritative envelope; board-local badges, warmed drill paths, or detached settlement chips may not imply commit-ready posture on their own.
16. The dominant anomaly field must bind one `PrimaryRegionBinding` and `InterventionWorkbench` must hold one `DecisionDockFocusLease`; no other tile may surface a competing commit-ready CTA while that lease remains active.
17. `mission_stack` must derive from one `MissionStackFoldPlan` that preserves the selected anomaly, paused-live posture, queued-delta summary, and governance-handoff return target through fold and unfold.
18. Entering governance from `InterventionWorkbench` is legal only when `OpsGovernanceHandoff.requiredGovernanceAudienceSurfaceRuntimeBindingRef` is current, `requiredGovernancePublicationParityRef.parityState = exact`, and `requiredReleaseWatchTupleRef.tupleState = active`; otherwise `OpsInterventionSettlement` must fall to `read_only_diagnostic` or `blocked_guardrail` and preserve the same board.
19. Once `OpsInterventionSettlement.result = handoff_active`, operations may preserve anomaly context and diagnostics, but it may not present a second writable draft, approval, promotion, rollback, or stabilization path for that same governed object until the linked governance settlement, bounded return, or a superseding `ReleaseWatchTuple` makes the prior handoff stale.
20. Returning from governance must validate both `OpsReturnToken` and the linked `OpsGovernanceHandoff`; if scope, parity, release-watch tuple, observation policy, freeze posture, selected-object lineage, board tuple, or selection lease drifted while the operator was away, restore the nearest valid board in `read_only_diagnostic` posture and explain the downgrade through `OpsRestoreReport`.

Canonical route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`
- `/ops/:opsLens/investigations/:opsRouteIntentId`
- `/ops/:opsLens/interventions/:opsRouteIntentId`
- `/ops/:opsLens/compare/:opsRouteIntentId`
- `/ops/:opsLens/health/:opsRouteIntentId`

Operations shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = operations)` over the board, investigation, intervention, compare, health, audit, assurance, incidents, and resilience route families that share one operations shell scope
- every operations route family must publish one `RouteFamilyOwnershipClaim`; investigation, intervention, compare, and health drill-down are same-shell child or bounded-stage members of the operations shell, while true governance work remains a cross-shell handoff rather than a hidden second operations route family
- assurance, release-watch, and incident domains may contribute dense regions, diagnostics, or handoff artifacts, but they may not replace board ownership or turn the current anomaly lifecycle into detached pages
- deep links, refresh, browser back or forward, and post-governance return must resolve through the owning operations shell contract plus the current `OpsRouteIntent`, `OpsReturnToken`, and `OpsGovernanceHandoff`; if ownership no longer validates, the same shell degrades to read-only diagnostic posture instead of silently reconstructing a fresh board
- every operations route family must also materialize one live `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`; board, investigation, intervention, compare, health, assurance, and incident surfaces may read only through declared `ProjectionQueryContract` refs, issue interventions only through declared `MutationCommandContract` refs, consume live deltas only through declared `LiveUpdateChannelContract` refs, and preserve cached boards only through the declared `ClientCachePolicy`
- chart shape, stale anomaly rows, and route-local control flags may not imply live intervention posture, release-watch calm, or recovery semantics when the active manifest or `AudienceSurfaceRuntimeBinding` has degraded

Continuity verification for this section must cover:

- shell reuse only across stable `shellContinuityKey`
- board restoration from `OpsBoardStateSnapshot` without losing selected anomaly, filters, or scroll anchor, while still revalidating `boardTupleHash`, bound selection leases, and the current runtime publication bundle
- `/ops/audit` restore and return preserving the same `investigationQuestionHash`, `InvestigationScopeEnvelope.scopeHash`, `InvestigationTimelineReconstruction.timelineHash`, selected anchor, and break-glass review context while still downgrading on publication, trust, or scope drift
- stale or tuple-drifted `OpsSelectionLease` freezing mutation controls without discarding operator context
- `OpsDeltaGate` release after compare or incident freeze without silent focus theft, scenario drift, or reopening `commit_ready` before `eligibilityState = safe_apply`
- expired or scope-mismatched `OpsReturnToken` and `OpsRouteIntent`, plus drifted runtime or freeze posture, falling back to bounded read-only recovery instead of broken deep links
- `OpsActionEligibilityFence` preventing live interventions whenever board context, lease tuple, continuity evidence, trust verdict, or return posture goes stale
- ops-to-governance handoff proving one `OpsGovernanceHandoff` governs writable transition, parity drift forcing `read_only_diagnostic | blocked_guardrail`, and return restoring only the nearest still-valid board

## 2A. Calm board posture and briefing artifacts

Every operations lens must derive one stable board posture from `SurfacePostureFrame` so live refresh, pause gates, no-results states, and intervention settlement all stay inside the same shell and preserve the current anomaly context.

Add these operations adapters:

**OpsBoardPosture**
`opsBoardPostureId`, `opsLens`, `shellContinuityKey`, `boardStateSnapshotRef`, `surfacePostureFrameRef`, `opsProminenceDecisionRef`, `attentionBudgetRef`, `selectedAnomalyRef`, `dominantSurfaceRef`, `secondarySummarySurfaceRefs[]`, `dominantQuestionRef`, `dominantActionRef`, `recoveryActionRef`, `activeFocusProtectionFenceRef`, `activeCooldownWindowRefs[]`, `activeMotionEnvelopeRef`, `renderedAt`

**OpsBriefingArtifact**
`opsBriefingArtifactId`, `opsLens`, `boardStateSnapshotRef`, `artifactPresentationContractRef`, `artifactSurfaceFrameRef`, `artifactParityDigestRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `maskScopeRef`, `returnTokenRef`, `generatedAt`

`OpsBriefingArtifact` keeps board snapshots, incident briefs, and governed export material attached to the visible board scope rather than a detached export-only path.

Rules:

- quiet system health is a first-class posture. If there is no material anomaly, the board must still answer the current dominant question through `SurfacePostureFrame` instead of filling the screen with decorative all-green chrome
- filtered-no-results, mask-suppressed views, and paused-live states must preserve filters, horizon, selected anomaly, and last stable board context rather than resetting charts or clearing the workbench
- when `OpsDeltaGate` is open or a selection lease is stale, keep the last stable board visible under `SurfacePostureFrame(postureState = loading_summary | stale_review | blocked_recovery | read_only)` and freeze only the affected intervention controls
- `OpsBoardPosture` must derive `dominantSurfaceRef`, `dominantQuestionRef`, `dominantActionRef`, and `secondarySummarySurfaceRefs[]` from exactly one current `OpsProminenceDecision` plus the current `AttentionBudget`; child surfaces may request elevation, but they may not mint a second dominant anomaly narrative
- `BottleneckRadar` may own dominant visual weight only while `dominantSurfaceRef = bottleneck_radar`, and `InterventionWorkbench` remains the only dominant action surface for the same posture even when `ServiceHealthGrid` or `CohortImpactMatrix` is the promoted anomaly driver
- while the linked `OpsFocusProtectionFence.fenceState = active`, live deltas may patch values in place but may not reorder ranked anomalies, transfer highlight, change `dominantSurfaceRef`, or widen a secondary summary into a competing dominant surface
- demotion or dominant-surface replacement must wait for every relevant `activeCooldownWindowRefs[]` to become `releasable | released` and must settle through `activeMotionEnvelopeRef` with the same causal copy and reduced-motion meaning
- board snapshots, incident briefs, CSV exports, and governance handoff packs must originate from `OpsBriefingArtifact` plus `ArtifactSurfaceFrame`; export-only detached flows are forbidden, and readiness or return must follow `artifactTransferSettlementRef` plus `artifactFallbackDispositionRef` rather than optimistic export chrome
- `mission_stack` must fold the same `OpsBoardPosture`, selected anomaly, and intervention context instead of launching a second reduced console

## 2B. Restore reporting and board-frame discipline

High-priority board-frame gaps in this layer:

1. restore behavior requires an explicit report, but the report schema is missing, so partial restore can still look like silent context loss
2. board composition names the right surfaces, but it does not yet define a stable shell footprint, so implementations can still drift into equal-weight card walls
3. semantic tone is implied rather than typed, which lets quiet, watch, stale, and blocked states collapse into inconsistent color usage
4. laptop, zoomed, and high-text-scale states can still over-compress type before changing topology

Add these shell adapters:

**OpsRestoreReport**
`opsRestoreReportId`, `opsReturnTokenRef`, `restoreState = full_restore | partial_restore | fallback_restore | read_only_recovery`, `restoredShellContinuityKey`, `restoredBoardStateSnapshotRef`, `restoredSelectionRefs[]`, `droppedFilterRefs[]`, `droppedDrillRefs[]`, `staleReasonRefs[]`, `fallbackLens`, `reacquireActionRef`, `governanceHandoffRef`, `announcedAt`

**OpsSemanticTonePolicy**
`opsSemanticTonePolicyId`, `surfaceRef`, `stateClass = neutral | watch | promoted | action_ready | degraded | blocked | stable_service`, `accentBudget = none | restrained | dominant`, `iconTreatmentRef`, `copyPriorityRef`, `motionAllowanceRef`, `evaluatedAt`

Rules:

- when return-to-board is anything other than `full_restore`, render one inline `OpsRestoreReport` inside the shared status strip and preserve the last stable board beneath it; do not silently clear filters, replace the selected anomaly, or widen scope
- `stable_service` must use neutral confirmation tone and watch copy, not all-green celebration; `action_ready` is reserved for the live `InterventionWorkbench`; `blocked` and `degraded` must stay explicit through icon, copy, and shape as well as hue
- on wide desktop, use one 12-column board frame with `8:4` main-to-workbench split; on laptop widths or 125%+ zoom, compress the secondary plane before collapsing to `mission_stack`; do not preserve density by shrinking type, hit area, or semantic spacing below safe shell defaults
- `NorthStarBand` and the shared status strip must remain scan-line surfaces; analytical density belongs in the ranked anomaly field and summary tables, not in oversized numerals or multi-row masthead tiles

## 3. Front-end data architecture

Read models must be denormalized, scope-aware, and keyed for in-place live patching. The browser must never build operational truth by joining raw audit feeds, raw event streams, or multi-domain stores client-side.

Create these front-end read contracts:

- `OpsOverviewProjection`: north-star metrics, ranked bottlenecks, dependency summary, equity summary, active interventions, freshness summary, and source rank-snapshot refs for any promoted queue anomaly
- `OpsQueuePressureProjection`: queue depth, median age, breach risk, arrival and clear rates, ranked entities, constraints, `queueRankPlanRef`, `rankSnapshotRef`, `overloadGuardState`, and rank-explanation drill refs
- `OpsResourceAllocationProjection`: capacity by lane, demand by lane, transferable pools, recommended scenarios, policy guardrails, and `CapacityRankProof` or `CapacityRankExplanation` drill refs when one capacity choice is being preferred over another
- `OpsDependencyHealthProjection`: essential functions, dependencies, health state, fallback state, restore readiness
- `OpsEquityImpactProjection`: channel variance, cohort variance, access risk, trend drivers
- `OpsInterventionProjection`: candidate actions, predicted relief median, predicted relief interval, calibration age, confidence band, owner, consequence previews
- `OpsInvestigationProjection`: origin context, causal chain, linked queues and entities, dependency touches, continuity evidence pivots, audit pivots, timeline
- `OpsAuditExplorerProjection`: search scope, current `AuditQuerySession`, `InvestigationScopeEnvelope`, `AccessEventIndex` result clusters, `InvestigationTimelineReconstruction`, `BreakGlassReviewRecord` drill refs, `DataSubjectTrace` drill refs, replay pivots, and governed export posture
- `OpsBreakGlassReviewProjection`: pending and expiring `BreakGlassReviewRecord` rows, reason-adequacy state, visibility-widening summary, expiry boundary, follow-up burden, queue state, and governance drill refs
- `OpsAssuranceTrustProjection`: assurance slices, trust state, completeness state, blocking producers, blocking namespaces
- `OpsContinuityEvidenceProjection`: patient-nav, record-continuation, more-info-reply, conversation-settlement, support-replay, intake-resume, booking-manage, hub-booking-manage, assistive-session, workspace-task-completion, and pharmacy-console-settlement continuity evidence slices with validation and drill paths
- `OpsPharmacyDispatchProofProjection`: overdue proof deadlines, contradictory receipts, superseded attempts, provider and transport clusters, `PharmacyDispatchTruthProjection` drill refs, and current recovery owners
- `OpsPharmacyOutcomeReconciliationProjection`: open `PharmacyOutcomeReconciliationGate` debt, contradictory outcome evidence, weak-match versus unmatched splits, `PharmacyOutcomeTruthProjection` drill refs, closure blockers, and current review owners
- `OpsResilienceReadinessProjection`: essential functions, current `OperationalReadinessSnapshot`, stale or unrehearsed `RunbookBindingRecord` rows, backup-manifest freshness, dependency-order coverage, journey-proof debt, current `RecoveryControlPosture`, current `RecoveryEvidencePack`, current resilience tuple hash, and control blockers
- `OpsRecoveryRunProjection`: current and recent `RestoreRun`, `FailoverRun`, and `ChaosRun` rows with tuple hash, scope, posture at settlement time, recovery evidence-pack refs, authoritative settlement refs, evidence artifact refs, and supersession state
- `OpsReleaseGuardrailProjection`: active rollout freezes, affected journeys, cohorts, fallback posture, required approvals
- `OpsLiveDeltaChannel`: surface ref, scope ref, delta type, severity, patch payload, published time

Rules:

1. All board surfaces must bind to one published `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one typed live channel declared through that manifest.
2. Every tile, row, and chart datum must have a stable identity so updates can patch in place.
3. Live channels must ship grouped settlement batches, not per-event render storms.
4. Filter state must be canonical, serializable, and sharable in the URL.
5. Projection freshness must be first-class data, not inferred from websocket state alone.
6. If one projection goes stale, only that region degrades unless a safe global interpretation is no longer possible.
7. Ranked queue entities and bottlenecks must originate from committed `QueueRankSnapshot` or another versioned rank snapshot for that lens; client-side resort of partially stale rows is forbidden.
8. Pharmacy dispatch anomalies must aggregate from current `PharmacyDispatchTruthProjection` and `DispatchProofEnvelope` refs; transport acceptance alone may not clear missing-proof debt, downgrade contradictory-receipt severity, or be summarized as confirmed dispatch.
9. Pharmacy outcome anomalies must aggregate from `PharmacyOutcomeTruthProjection` and `PharmacyOutcomeReconciliationGate`; raw resolved counts, mailbox wording, or reopen tallies may not hide open weak-match review debt, contradictory evidence, or closure blockers.
10. Resilience diagnosis must aggregate from current `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `RecoveryControlPosture`, and current recovery-run evidence. Dashboard cards, calendar reminders, or loose runbook links may not imply live restore or failover authority on their own.
11. Historical restore, failover, and chaos runs must remain visible, but stale or superseded runs may not clear current blockers, satisfy restore-validation freshness, or re-arm resilience controls.
12. `/ops/audit` may search through `AccessEventIndex`, but any detail, diff, replay, trace, or export view must pivot immediately into one current `AuditQuerySession`, one `InvestigationScopeEnvelope`, and one `InvestigationTimelineReconstruction`; raw index rows and client-side joins are not authoritative investigation truth.
13. Board snapshots, route intents, and `OpsReturnToken` must preserve `auditQuerySessionRefs[]`, `investigationScopeEnvelopeRefs[]`, `investigationQuestionHashRefs[]`, `timelineReconstructionRefs[]`, `breakGlassReviewRefs[]`, and `dataSubjectTraceRefs[]` so audit pivots can return to the same diagnostic question and evidence basis instead of silently rebasing on fresher scope.
14. Any pivot from `/ops/audit` into support replay, governance break-glass review, assurance evidence, or investigation export must preserve the same `InvestigationScopeEnvelope.scopeHash`, `InvestigationTimelineReconstruction.timelineHash`, and selected-anchor tuple. If any of those tuples drift, the destination route may stay diagnostic, but it must not reopen writable or export-ready posture until a superseding investigation scope is issued.
15. `OpsBreakGlassReviewProjection` must surface reason adequacy, exact visibility widening, expiry boundary, and follow-up burden as first-class board data. Hidden review debt, expired visibility, or scope drift may not be collapsed into generic access badges or audit-count tiles.

### 3.1 Live cadence and stale-slice posture

High-priority pacing gaps in this layer:

1. live channels are batch-oriented, but the board still lacks a per-surface cadence contract, so values, ranks, and dominant regions can update on the same schedule and feel noisy
2. freshness exists, but stale-slice posture is not yet normalized into one local state machine, so stale data can either over-freeze the whole board or remain too writable
3. delta buffering is defined for pause-live and compare, but not for ordinary operator focus, so high-churn surfaces can still create avoidable resort pressure
4. selected-anomaly and intervention regions need stronger pacing than passive summaries, but the current model does not yet declare that hierarchy

Add these live-state adapters:

**OpsSliceFreshnessState**
`opsSliceFreshnessStateId`, `surfaceRef`, `projectionRef`, `expectedCadenceMs`, `observedAgeMs`, `freshnessRatio`, `freshnessState = fresh | watch | stale_review | read_only`, `lastStableSnapshotRef`, `nextSafeActionRef`, `evaluatedAt`

**OpsLiveCadencePolicy**
`opsLiveCadencePolicyId`, `surfaceRef`, `expectedCadenceMs`, `patchWindowMs`, `resortIdleMs`, `prominenceReviewIdleMs`, `maxBufferedBatchCount`, `bufferDisclosureState`, `effectiveAt`

Let `freshnessRatio_s(t) = observedAgeMs_s(t) / max(1, expectedCadenceMs_s)`.

Rules:

- render `freshnessState = fresh` when `freshnessRatio <= 1.5`, `watch` when `1.5 < freshnessRatio <= 3`, `stale_review` when `3 < freshnessRatio <= 6`, and `read_only` when `freshnessRatio > 6` or any required trust or continuity input is blocked
- `OpsSliceFreshnessState` must feed the current `ProjectionFreshnessEnvelope` for that board region; websocket liveness, heartbeat arrival, or chart animation alone may not clear `stale_review` or `read_only`
- `OpsSliceFreshnessState` must localize stale posture: preserve the last stable snapshot, freeze only affected mutating controls, and keep unrelated surfaces live whenever global interpretation remains safe
- `OpsLiveCadencePolicy` must patch values inside `patchWindowMs <= expectedCadenceMs`, may resort only when the operator has been idle for `max(8000, 2 * expectedCadenceMs)` or after explicit batch apply, and may reevaluate dominant-surface promotion only when no `OpsFocusProtectionFence` is active and `max(12000, 3 * expectedCadenceMs)` has elapsed since the last promote or demote
- the selected anomaly and `InterventionWorkbench` may update freshness, timestamps, and bounded relief estimates in place, but they may not auto-swap owner, clear reason capture, or drop pre-commit context under live drift
- once buffered batches exceed `maxBufferedBatchCount` or a required slice enters `stale_review`, surface a queued-delta digest or recovery cue in the same shell instead of silently continuing to animate stale data

## 4. Canonical overview composition

The default `/ops/overview` screen must render six disciplined surfaces:

1. `NorthStarBand`
2. `BottleneckRadar`
3. `CapacityAllocator`
4. `ServiceHealthGrid`
5. `CohortImpactMatrix`
6. `InterventionWorkbench`

**OpsSurfaceFootprintPlan**
`opsSurfaceFootprintPlanId`, `viewportClass`, `layoutTopology`, `mainPlaneColumns`, `secondaryPlaneColumns`, `dominantSurfaceRef`, `dominantSurfaceMinBlockSize`, `expandedSummarySurfaceRefs[]`, `collapsedSummarySurfaceRefs[]`, `stickyWorkbenchOffsetRef`, `surfaceOrderRefs[]`, `evaluatedAt`

Rules:

- default desktop overview must render one 12-column `OpsSurfaceFootprintPlan` with `NorthStarBand` full width, `BottleneckRadar` as the top block of an 8-column main plane, and `InterventionWorkbench` as a sticky 4-column decision plane
- `BottleneckRadar` must own at least `max(22rem, 40vh)` of visible board height when an anomaly is promoted; `CapacityAllocator`, `ServiceHealthGrid`, and `CohortImpactMatrix` begin as compact summary surfaces below it
- only one of `CapacityAllocator`, `ServiceHealthGrid`, or `CohortImpactMatrix` may expand beyond summary height at a time, and only when it is the current anomaly driver or the operator explicitly pins compare or diagnostic posture
- in calm stable-service posture, the secondary plane must collapse from commit-ready controls to recent-intervention and watchpoint review; an empty or speculative action dock is forbidden

`InvestigationDrawer` is the canonical drill-down surface across all six.

When no anomaly or intervention currently dominates, `/ops/overview` must not backfill the screen with decorative density. The main plane should resolve through one `SurfaceStateFrame(stateClass = sparse)` backed by the current `OpsBoardSurfaceState` that summarizes current system posture, top watchpoints, and the single recommended next lens while the six surfaces collapse to disciplined summary slices.

If no anomaly currently outranks the quiet threshold or the active lens has no visible entities after filters, masking, or release freezes, `/ops/overview` must render one calm board state explaining why the board is quiet, what usually appears here, and the fastest safe next action such as widening scope, clearing filters, or reviewing recent interventions. Do not replace this with decorative chart wallpaper or a cluster of equal-priority metric cards.

If a previously selected anomaly clears, preserve the operator’s `SelectedAnchor` and show an in-place settled frame with causal explanation and nearest next watchpoint rather than dropping abruptly to an unrelated board default.

When no anomaly merits dominant escalation, `/ops/overview` must switch to a calm stable-service posture instead of expanding every healthy surface at once.

**OpsStableServiceDigest**
`opsStableServiceDigestId`, `scopeRef`, `timeHorizon`, `healthEnvelopeRefs[]`, `topHealthySignals[]`, `watchItems[]`, `guardedFunctionRefs[]`, `recentResolvedInterventionRefs[]`, `nextRecommendedCheckRef`, `generatedAt`

`OpsStableServiceDigest` is the summary-first stable-state artifact for the overview. It acknowledges what is healthy, what still deserves watchfulness, what recently resolved, and what the operator should check next without forcing a green chart wall.

**OpsBoardSurfaceState**
`opsBoardSurfaceStateId`, `surfaceRef`, `surfacePostureFrameRef`, `selectedEntityRef`, `state = loading | stable | no_material_anomaly | partial | degraded | recovery_required`, `headlineRef`, `explanationRef`, `dominantActionRef`, `lastStableSnapshotRef`, `renderedAt`

`OpsBoardSurfaceState` is the required posture contract for every overview board. It derives from `OpsBoardPosture` and `SurfacePostureFrame`, keeping the last stable board visible through loading, degradation, recovery, and anomaly resolution without replacing the operator's mental model.

**OpsSelectedAnomalyState**
`opsSelectedAnomalyStateId`, `selectedAnomalyRef`, `selectedAnomalyTupleHash`, `sourceSurfaceRef`, `sourceRankOrdinal`, `selectionLeaseRef`, `boardStateSnapshotRef`, `pinState = pinned | pinned_resolved | stale_review | invalidated | released`, `rankDriftRef`, `replacementCandidateRefs[]`, `lastStableSnapshotRef`, `acceptedAt`, `updatedAt`

`OpsSelectedAnomalyState` is the local permanence record for the dominant anomaly. It keeps the primary region attached to one concrete anomaly while the rest of the board continues to update.

Rules:

- when no bottleneck, cohort slice, or health anomaly crosses the promotion threshold, render one `OpsStableServiceDigest`, expand at most one watch summary, and collapse healthy surfaces to compact confirmation instead of a green chart wall
- `OpsStableServiceDigest.topHealthySignals[]` may include only essential functions whose current `EssentialFunctionHealthEnvelope.overlayState = live_trusted`; time-bounded fallback, constrained mitigation, degraded trust, or active freeze must remain in `watchItems[]` or `guardedFunctionRefs[]`
- every overview surface must publish one `OpsBoardSurfaceState`; loading and degraded states preserve the last stable board and exact scope, and `no_material_anomaly` must explain what is being monitored plus the next recommended check
- `OpsSelectedAnomalyState` is the only object allowed to hold both the dominant `PrimaryRegionBinding` and the current workbench focus; higher-ranked siblings may be summarized, but they may not steal the primary region while the selected anomaly remains pinned and in scope
- if the selected anomaly changes rank, show the new ordinal, delta direction, and any queued competing anomalies without moving the operator to them
- if the selected anomaly resolves while the operator is focused on it, keep its summary visible as `pinned_resolved`, `stable`, or `no_material_anomaly` until the operator accepts a new selection or returns to the overview; never silently replace it with a different anomaly
- if filtering, masking, release freeze, or entity deletion invalidates the selected anomaly, preserve an invalidated stub with causal reason and reacquire action instead of resetting the board

### 4.1 NorthStarBand

- Show 5 to 7 operator metrics only.
- Every metric tile must show current value, delta, freshness, and direct drill-in.
- Only the single most actionable abnormal metric may elevate its tone above the base band.

### 4.2 BottleneckRadar

- Is the dominant anomaly field for the overview.
- Must default to a ranked list or matrix with optional heat overlay, not a chart wall.
- Must rank by operational consequence and intervention leverage, not raw count alone.
- Let `anomalyRankScore_i = consequence_i * leverage_i * persistence_i * trustLowerBound_i * freshnessMultiplier_i * max(0.1, 1 - guardrailDrag_i)`.
- `BottleneckRadar` must sort by `anomalyRankScore_i`, surface the top contributing factors inline, and show guardrail drag when a severe anomaly is not yet safely actionable.
- Selecting a bottleneck must create one `OpsSelectedAnomalyState` bound to the current `OpsSelectionLease`; live deltas may patch its values in place, but sibling anomalies may not silently steal dominance while the state remains pinned.
- High-churn items may update values live, but resort only when the operator is idle, after explicit batch apply, or when `OpsDeltaGate` release has reconciled the current rank basis.
- If no anomaly qualifies for dominance, `BottleneckRadar` must yield prominence to `OpsStableServiceDigest` rather than forcing a ranked list of healthy items.

### 4.3 CapacityAllocator

- Is the canonical dynamic resource allocation surface.
- Must show current state, recommended state, and predicted outcome together.
- Must distinguish advisory scenarios from ready-to-commit actions.
- Must surface safety, skill, and ownership guardrails before commit.
- Scenario comparison is explicit; do not auto-open multi-scenario compare by default.

### 4.4 ServiceHealthGrid

High-priority health-grid gaps in this layer:

1. health tiles are not yet pinned to one essential-function truth envelope, so stale or quarantined evidence can still look healthier than it really is
2. fallback is treated as present or absent, but not as a governed sufficiency posture with explicit coverage, duration, and exhaustion risk
3. dependency drill-down is underspecified, so operators can lose causal path and blast-radius context while traversing from function to dependency chain
4. active rollout freezes, release guardrails, and policy-imposed mitigation limits are not yet rendered as first-class health modifiers
5. the grid does not yet define bounded action posture for `degraded_but_operating`, `fallback_active`, `blocked`, or `unknown_or_stale`, which risks overcommitting or freezing the wrong controls

Build `ServiceHealthGrid` from these read contracts:

**EssentialFunctionHealthEnvelope**
`essentialFunctionHealthEnvelopeId`, `functionCode`, `sourceSliceEnvelopeRef`, `requiredAssuranceSliceTrustRefs[]`, `requiredChannelFreezeRefs[]`, `releaseTrustFreezeVerdictRef`, `fallbackReadinessRef`, `currentOperationalReadinessSnapshotRef`, `recoveryControlPostureRef`, `blockingDependencyRefs[]`, `blockingNamespaceRefs[]`, `blastRadiusRef`, `healthState = healthy | degraded_but_operating | fallback_active | blocked | unknown_or_stale`, `overlayState = live_trusted | constrained_fallback | diagnostic_only | recovery_only | blocked`, `mitigationAuthorityState = enabled | constrained | observe_only | blocked`, `watchReasonRefs[]`, `actionPostureRef`, `drillPathRef`, `evaluatedAt`

**ServiceHealthCellProjection**
`functionCode`, `displayName`, `healthEnvelopeRef`, `state = healthy | degraded_but_operating | fallback_active | blocked | unknown_or_stale`, `overlayState = live_trusted | constrained_fallback | diagnostic_only | recovery_only | blocked`, `mitigationAuthorityState = enabled | constrained | observe_only | blocked`, `severityBand`, `projectionVersionRefs`, `fallbackReadinessRef`, `releaseGuardrailRef`, `blastRadiusRef`, `lastStableSnapshotRef`, `drillPathRef`, `actionPostureRef`, `lastMeaningfulChangeAt`

**FallbackReadinessDigest**
`fallbackReadinessDigestId`, `functionCode`, `fallbackMode`, `fallbackState = inactive | available | active | exhausted`, `coverageScopeRef`, `sufficiencyState = sufficient | time_bounded | partial | unsafe`, `capacityLimitRef`, `exhaustionRiskRef`, `safeUntil`, `operatorConstraintRefs[]`, `supportingEvidenceRefs[]`, `validatedAt`

**HealthDrillPath**
`healthDrillPathId`, `functionCode`, `healthEnvelopeRef`, `rootDependencyRef`, `blockingDependencyRefs[]`, `blockingProducerRefs[]`, `blockingNamespaceRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `fallbackReadinessRef`, `releaseGuardrailRef`, `currentOperationalReadinessSnapshotRef`, `recoveryControlPostureRef`, `blastRadiusRef`, `operatorConstraintRefs[]`, `operatorMessageRef`, `recommendedNextCheckRef`, `generatedAt`

**ReleaseGuardrailDigest**
`releaseGuardrailDigestId`, `functionCode`, `releaseTrustFreezeVerdictRef`, `activeFreezeRefs[]`, `channelFreezeRefs[]`, `rollbackMode`, `guardrailState = live | constrained | frozen | rollback_review_required`, `safeMitigationModes`, `blockedMitigationModes`, `guardrailReasonRefs[]`, `operatorMessageRef`, `evaluatedAt`

**HealthActionPosture**
`healthActionPostureId`, `functionCode`, `healthEnvelopeRef`, `actionAuthorityState = enabled | constrained | observe_only | blocked`, `allowedActions`, `governedRecoveryActionRefs[]`, `readOnlyActions`, `blockedActions`, `handoffRouteRef`, `operatorMessageRef`, `evaluatedAt`

Rules:

- every `ServiceHealthCellProjection`, `HealthDrillPath`, and `HealthActionPosture` must derive from one current `EssentialFunctionHealthEnvelope`; they may not independently merge trust, fallback, freeze, or resilience fragments
- `ServiceHealthCellProjection.state`, `overlayState`, and `mitigationAuthorityState` may never appear greener or calmer than the bound `EssentialFunctionHealthEnvelope`
- `fallback_active` and `degraded_but_operating` must show whether fallback exists, whether it is active, whether it is sufficient, how long it remains safe before exhaustion or policy breach, and which operator constraints now apply
- `FallbackReadinessDigest.sufficiencyState = time_bounded | partial | unsafe` must surface `safeUntil`, `capacityLimitRef`, `exhaustionRiskRef`, and `operatorConstraintRefs[]` directly in the cell and drill path rather than only in secondary diagnostics
- drill-down from an essential function must open one deterministic `HealthDrillPath` with exact blocking producers, namespaces, trust refs, fallback sufficiency, release-guardrail reasons, and blast radius while preserving the same board state and selected health node
- `ReleaseGuardrailDigest` must inherit the current `ReleaseTrustFreezeVerdict` plus any active `ChannelReleaseFreezeRecord` rows; cells may not hide constrained or frozen mitigation posture in side panels while the tile itself stays visually healthy
- `HealthActionPosture.actionAuthorityState = enabled` is legal only while `EssentialFunctionHealthEnvelope.mitigationAuthorityState = enabled`; constrained posture may surface bounded recovery or handoff actions, but it may not inherit ordinary mitigation weight
- when trust is degraded or stale, keep the last stable board visible, mark the affected cells `unknown_or_stale` or `degraded_but_operating` explicitly, and require tabular fallback with timestamps, operator message, and bounded next actions rather than decorative charts

### 4.5 CohortImpactMatrix

High-priority cohort-variance gaps in this layer:

1. cohort variance can render without a governed comparison basis, so operators may act on differences caused by mismatched windows, denominators, or normalization versions rather than real service disparity
2. small cohorts, masked cohorts, and privacy-limited slices are not yet distinguished from genuinely healthy slices, which risks false reassurance or overexposure
3. materiality thresholds are too simple on their own; variance needs confidence, persistence, and hysteresis rules so the matrix does not oscillate on noise
4. cohort drill-down does not yet define a causal driver path, so operators can see disparity without knowing whether the cause is channel design, capacity imbalance, dependency failure, or release guardrail
5. the matrix does not yet define when cohort variance may promote into the dominant anomaly and intervention flow versus staying as read-only context

Build `CohortImpactMatrix` from these read contracts:

**CohortImpactCellProjection**
`sliceRef`, `dimensionType = channel | geography | demographic | pathway`, `displayLabel`, `varianceState = normal | elevated | material | masked | unknown`, `comparisonBasisRef`, `trustEnvelopeRef`, `sampleSizeBand`, `effectiveSampleSize`, `scoreIntervalRef`, `materialityEvaluationRef`, `driverPathRef`, `actionBridgeRef`, `lastMeaningfulChangeAt`

**VarianceComparisonBasis**
`comparisonBasisId`, `metricDefinitionRef`, `periodWindowRef`, `denominatorRef`, `normalizationVersionRef`, `baselineSliceRef`, `comparisonMethod`, `generatedAt`

**CohortVisibilityGuard**
`cohortVisibilityGuardId`, `sliceRef`, `minimumCellPolicyRef`, `maskReasonRefs`, `releaseState`, `audienceTier`, `safeSummaryRef`, `detailAccessState`

**MaterialityEvaluation**
`materialityEvaluationId`, `sliceRef`, `varianceMagnitude`, `confidenceBand`, `effectiveSampleSize`, `scoreIntervalRef`, `persistenceState = transient | sustained | escalating`, `hysteresisState`, `entryThresholdRef`, `exitThresholdRef`, `thresholdPolicyRef`, `evaluatedAt`

**CohortDriverPath**
`cohortDriverPathId`, `sliceRef`, `driverType = demand | capacity | dependency | policy | release_guardrail | unknown`, `blockingRefs[]`, `blastRadiusRef`, `recommendedNextCheckRef`, `generatedAt`

**CohortActionBridge**
`cohortActionBridgeId`, `sliceRef`, `promotionState = context_only | anomaly_candidate | intervention_ready`, `linkedBottleneckRef`, `linkedInterventionRef`, `handoffRouteRef`, `evaluatedAt`

Rules:

- every cohort cell must bind to one `VarianceComparisonBasis`; mismatched time windows, denominator sets, or normalization versions must render as `unknown` or recovery-needed rather than implying valid comparison
- every weighted cohort comparison must compute `effectiveSampleSize = (sum w)^2 / max(1e-6, sum w^2)` before interval or threshold evaluation; nominal counts may never be used as if all weights were equal
- for rate-like metrics, `scoreIntervalRef` must be a Wilson or score interval on the normalized denominator under the current `VarianceComparisonBasis`; a cohort may not promote if its interval still overlaps the tolerated baseline band or if `effectiveSampleSize` is below policy minimum
- masked, sparse, or audience-limited cohorts must stay visible through `CohortVisibilityGuard` with safe summary and reason text; they may not disappear, flatten to normal, or leak detail beyond policy
- promote a cohort slice above summary level only when `MaterialityEvaluation` shows sufficient magnitude plus sustained or escalating persistence and the entry threshold exceeds the exit threshold by policy-defined hysteresis; transient or weakly supported variance may remain visible but must not seize dominant anomaly weight
- drill-down from a cohort cell must open one deterministic `CohortDriverPath` and preserve the same board scope, so operators can trace disparity to demand, capacity, dependency, policy, or rollout guardrail causes without losing context
- `CohortActionBridge` is the only route by which cohort variance may compete with `BottleneckRadar` or `InterventionWorkbench`; if the bridge is `context_only`, the matrix stays calm and read-only even when variance is visible

### 4.6 InterventionWorkbench

**OpsInterventionReadiness**
`opsInterventionReadinessId`, `interventionRef`, `boardStateSnapshotRef`, `selectedAnomalyRef`, `selectedAnomalyTupleHash`, `selectionLeaseRef`, `projectionVersionRef`, `actionEligibilityFenceRef`, `trustLowerBound`, `confidenceLowerBound`, `calibrationAgeMs`, `guardrailClearanceState`, `continuityState`, `predictedReliefMedianRef`, `predictedReliefLowerBoundRef`, `requiredReasonCaptureState`, `readinessState = observe_only | advisory | commit_ready | handoff_only | blocked | stale_reacquire`, `evaluatedAt`

Let `calibrationFreshness_i = clamp(1 - calibrationAgeMs_i / T_calibration_max_i, 0, 1)`.
Let `guardrailClearance_i = 1` when the current route intent, board tuple, selection lease, delta gate, scope, release, and policy guardrails all permit direct commit, otherwise `0`.
Let `readinessScore_i = trustLowerBound_i * confidenceLowerBound_i * calibrationFreshness_i * guardrailClearance_i`.

- Is the single promoted action region for the active anomaly.
- Must remain stable while the rest of the board updates.
- Must show `readinessState` before any CTA: `observe_only`, `advisory`, `commit_ready`, `handoff_only`, `blocked`, or `stale_reacquire`.
- Must show why the action is recommended, what it changes, what it costs, and who owns it.
- Predicted relief must render as median plus bounded interval, calibration age, and trust-lower-bound gate; low-confidence or stale-calibration candidates remain advisory even when nominal relief is large.
- `commit_ready` is legal only when the active `OpsSelectedAnomalyState` remains pinned, `predictedReliefLowerBoundRef` is positive, `readinessScore_i >= rho_commit`, `OpsActionEligibilityFence.eligibilityState = live_commit`, and no required continuity or release fence is stale or blocked.
- `advisory` is the highest allowed posture when `0 < predictedReliefMedianRef` but `readinessScore_i < rho_commit`; advisory actions may explain consequences, owners, and handoff targets, but they may not inherit commit-ready accent, stickiness, or button weight.
- `observe_only` is mandatory when any required `OpsSliceFreshnessState` is `stale_review` or `read_only`, when `OpsActionEligibilityFence.eligibilityState = observe_only | read_only_recovery`, or when trust or continuity evidence falls below direct-action policy.
- `observe_only` is also mandatory when the active continuity investigation for the selected anomaly has `InvestigationDrawerSession.deltaState = drifted | superseded | blocked`, or when the current `continuityQuestionHash` or `continuitySetHash` no longer matches the preserved continuity proof basis bound to the selected anomaly.
- Commit must use explicit `ConsequencePreview` and reason capture where policy requires it.
- The workbench must retain pre-commit context until authoritative settlement arrives.
- Any intervention commit must validate the active `OpsBoardStateSnapshot`, `OpsSelectionLease`, `OpsRouteIntent`, `OpsDeltaGate`, exact target tuple, trust envelope, and release guardrail before the action becomes writable.
- `OpsInterventionSettlement` is the only authority for whether the workbench shows `pending_effect`, `applied`, `handoff_required`, `handoff_active`, `read_only_diagnostic`, `blocked_guardrail`, or `stale_reacquire` posture.
- When no anomaly is dominant, collapse `InterventionWorkbench` to watch-only recent-settlement and next-check posture rather than leaving empty or disabled commit chrome behind.
- If the selected anomaly drifts, the authoritative target tuple no longer matches the bound `OpsRouteIntent`, queued deltas reopen `OpsDeltaGate`, a return token no longer validates the current board tuple, trust degrades, or a rollout freeze blocks the action mid-flight, preserve the same shell and pin the workbench in recovery posture instead of dropping the intervention or pretending success.

### 4.7 InvestigationDrawer

- Opens in place from any overview surface.
- Preserves the selected anomaly and board scope.
- May expand to pinned or split-view mode for deeper diagnosis.
- Is preferred over modal stacks or route-breaking detail pages for same-scope investigation.

**OpsDrillContextAnchor**
`opsDrillContextAnchorId`, `sourceSurfaceRef`, `selectedEntityRef`, `selectedEntityTupleHash`, `sourceRankOrdinal`, `sourceScrollAnchorRef`, `drillQuestionRef`, `continuityQuestionHash`, `continuityControlHealthProjectionRef`, `opsContinuityEvidenceSliceRef`, `investigationDrawerSessionRef`, `returnFocusTargetRef`, `boardStateSnapshotRef`, `boardTupleHash`, `selectionLeaseRef`, `routeIntentRef`, `returnTokenRef`, `createdAt`

Rules:

- `InvestigationDrawer` and any same-scope child route must originate from one `OpsDrillContextAnchor`
- return from drill-down must restore the same surface, row or cell, and keyboard focus target where still valid; if that target is no longer valid, restore the nearest valid shell and explain the downgrade through `OpsRestoreReport`
- drill-down may deepen the current diagnostic question, but it may not silently widen global filters, clear the selected anomaly, or mutate board scope without an explicit reversible operator action
- when the active question is continuity-rooted, opening `InvestigationDrawer` must also mint one `InvestigationDrawerSession` pinned to the current `OpsBoardStateSnapshot`, `ContinuityControlHealthProjection`, `OpsContinuityEvidenceSlice`, and required `AssuranceSliceTrustRecord` rows before any audit, assurance, workspace, governance, or workflow-specific pivot opens
- continuity pivots may deepen from shell summary into audit, assurance, or workflow-specific evidence, but they must preserve the same `continuityQuestionHash`, `continuitySetHash`, and governing settlement or restore refs until the operator explicitly reacquires a new question
- if fresher continuity proof arrives while the drawer is open, the drawer must render delta from the preserved session base and keep the previous blocker set visible as provenance; it may not silently replace the diagnostic question, selected shell, or operator posture with the newest evidence cut

### 4.8 Continuity evidence and assurance drill-down

Operational diagnosis must also explain when a patient or support surface is degraded because its continuity controls are no longer authoritative, not just because a queue or dependency looks unhealthy.

Build the continuity-evidence slice from these read contracts:

**OpsContinuityEvidenceSlice**
`opsContinuityEvidenceSliceId`, `scopeRef`, `controlCode = patient_nav | record_continuation | conversation_settlement | more_info_reply | support_replay_restore | intake_resume | booking_manage | hub_booking_manage | assistive_session | workspace_task_completion | pharmacy_console_settlement`, `routeFamilyRefs[]`, `producerFamilyRefs[]`, `routeContinuityEvidenceContractRefs[]`, `continuityControlHealthProjectionRef`, `audienceTier`, `requiredAssuranceSliceTrustRefs[]`, `experienceContinuityEvidenceRefs[]`, `continuityTupleHashes[]`, `continuitySetHash`, `continuityQuestionHash`, `latestSettlementOrRestoreRef`, `latestReturnOrContinuationRef`, `supportingSymptomRefs[]`, `trustLowerBound`, `validationBasisHash`, `validationState = trusted | degraded | stale | blocked`, `blockingProducerRefs[]`, `operatorPostureRef`, `drillPathRef`, `lastValidatedAt`

**ContinuityEvidenceDrillPath**
`continuityEvidenceDrillPathId`, `controlCode`, `continuityQuestionHash`, `governingObjectRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `supportingAssuranceSliceRefs[]`, `supportingAuditRefs[]`, `supportingSymptomRefs[]`, `continuitySetHash`, `blockingRefs[]`, `recommendedNextCheckRef`, `handoffRouteRef`, `generatedAt`

Rules:

- continuity proof is a first-class operations lens alongside queue, dependency, cohort, and incident drill-down; it may not appear only as a footer, tooltip, or appendix to generic health metrics
- when an anomaly or complaint is rooted in patient-home CTA drift, record-follow-up recovery, more-info reply blockage, thread-settlement lag, replay-restore uncertainty, intake resume failure, booking-manage recovery drift, hub booking-manage drift, stale assistive-session posture, workspace completion stall, or pharmacy-console settle mismatch, `InvestigationDrawer` must pivot to `OpsContinuityEvidenceSlice` instead of showing only generic queue or delivery metrics
- when an anomaly is rooted in stale hub alternative offers, selected-candidate supersession, confirmation drift, practice-ack generation mismatch, or callback-transfer linkage debt, `InvestigationDrawer` must pivot to the current `HubOfferToConfirmationTruthProjection` and show `offerState`, `confirmationTruthState`, `practiceVisibilityState`, `fallbackLinkState`, `closureState`, `truthTupleHash`, and the refs currently blocking closure instead of inferring progress from queue timestamps or local notification state
- when an anomaly is rooted in overdue pharmacy proof deadlines, contradictory provider receipts, or stale redispatch evidence, `InvestigationDrawer` must pivot to `OpsPharmacyDispatchProofProjection` and show the active proof lane, deadline, superseded-attempt refs, and current owner rather than a generic delivery metric
- when an anomaly is rooted in open pharmacy outcome reconciliation debt, contradictory outcome evidence, or weak-match review backlog, `InvestigationDrawer` must pivot to `OpsPharmacyOutcomeReconciliationProjection` and show `outcomeTruthState`, confidence band, blocking-close posture, gate owner, and candidate-versus-runner-up evidence rather than a generic resolved-count trend
- `OpsContinuityEvidenceSlice` must bind the current `ContinuityControlHealthProjection`, exact `continuitySetHash`, required `AssuranceSliceTrustRecord` rows, and authoritative settlement, continuation, or restore refs for the affected shell; queue age, dependency latency, backlog, or delivery signals may appear only through `supportingSymptomRefs[]` after the governing continuity proof is named
- `OpsContinuityEvidenceSlice.validationState` must derive from linked `ExperienceContinuityControlEvidence`, dependent assurance-slice trust, and the latest authoritative settlement, continuation, or restore reference; the slice may never appear healthier than the least-trusted required input
- continuity-rooted drill-down must preserve one `continuityQuestionHash` from board summary through `InvestigationDrawerSession`, audit, assurance, governance, workspace, or workflow-specific pivots; the operator may compare newer evidence against that question, but may not silently switch to a different question because fresher proof arrived
- if continuity evidence is `stale` or `blocked`, `InterventionWorkbench` may explain or hand off the issue, but it must fall to `observe_only` or governance-handoff posture rather than arming a live mitigation from incomplete proof
- if the active `InvestigationDrawerSession.deltaState = drifted | superseded | blocked`, or if the current slice no longer matches the preserved `continuityQuestionHash`, `continuitySetHash`, or required trust rows captured in the session, `InterventionWorkbench` must degrade to `observe_only`, `stale_reacquire`, or governance handoff; healthy generic board metrics may not override proof drift
- board snapshots, route intents, and return tokens must preserve visible continuity-evidence refs, `continuityQuestionHash`, `continuitySetHash`, and any active `InvestigationDrawerSession` so audit, assurance, workspace, and governance pivots can return to the same diagnostic question
- slice copy and drill paths must identify which shell or mission frame is degraded. Intake, booking, assistive, workspace, and pharmacy-console incidents may share producers, but they may not collapse into one generic continuity warning if the governing settlement chains differ

### 4.8A Resilience readiness and restore control

Operational diagnosis must also explain whether the platform is actually restore-capable under the current runtime tuple, not just whether dashboards and runbook links exist.

Build the resilience lens from these read contracts:

**OpsResilienceReadinessSlice**
`opsResilienceReadinessSliceId`, `scopeRef`, `essentialFunctionRefs[]`, `operationalReadinessSnapshotRef`, `resilienceSurfaceRuntimeBindingRef`, `recoveryControlPostureRef`, `runbookBindingRefs[]`, `backupManifestRefs[]`, `latestRestoreRunRef`, `latestFailoverRunRef`, `latestChaosRunRef`, `journeyProofArtifactRefs[]`, `latestRecoveryEvidencePackRef`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHash`, `journeyRecoveryCoverageState`, `evidencePackState`, `controlState = live_control | diagnostic_only | recovery_only | blocked`, `blockingRefs[]`, `lastValidatedAt`

**OpsRecoveryRunTimeline**
`opsRecoveryRunTimelineId`, `scopeRef`, `operationalReadinessSnapshotRef`, `releaseWatchTupleRef`, `watchTupleHash`, `restoreRunRefs[]`, `failoverRunRefs[]`, `chaosRunRefs[]`, `activeRunRef`, `supersededRunRefs[]`, `recoveryEvidencePackRefs[]`, `resilienceActionSettlementRefs[]`, `evidenceArtifactRefs[]`, `resilienceTupleHash`, `timelineHash`, `timelineState = exact | stale | blocked`, `generatedAt`

Rules:

- `/ops/resilience` must show the current `OperationalReadinessSnapshot`, stale or unrehearsed `RunbookBindingRecord` rows, backup-manifest freshness, dependency-order coverage, journey-proof debt, and current `RecoveryControlPosture` for the selected essential function in one same-shell lens
- `OpsResilienceReadinessSlice.controlState = live_control` is legal only while the linked `ResilienceSurfaceRuntimeBinding.bindingState = live`, the linked `RecoveryControlPosture.postureState = live_control`, the bound `OperationalReadinessSnapshot.readinessState = ready`, the slice `evidencePackState = current`, and the slice `resilienceTupleHash` still matches the linked binding, posture, readiness snapshot, and latest recovery settlement set
- when publication, trust, freeze, readiness, or runbook posture drifts, keep the current restore, failover, and chaos evidence visible in place and downgrade only the affected controls; do not clear context or hide the latest blocking proof
- restore, failover, and chaos command affordances may not re-arm from `OpsRecoveryRunTimeline` alone. Historical or superseded runs remain visible as evidence, but only the current `RecoveryControlPosture` and current `ResilienceActionSettlement` set may authorize live controls; if the timeline `timelineState != exact`, it is evidence-only
- board snapshots, route intents, and return tokens must preserve visible readiness, runbook-binding, posture, current evidence-pack refs, latest resilience settlements, and `resilienceTupleHash` so audit, assurance, governance, and release pivots can return to the same resilience question
- resilience copy must name the blocking tuple component directly: stale publication, frozen release, withdrawn runbook binding, expired restore validation, missing journey proof, stale backup manifest, stale evidence pack, scope-tuple drift, or missing approved failover or chaos proof are distinct blockers and may not collapse into one generic degraded banner

## 5. Visual hierarchy and motion rules

High-priority visual-orchestration gaps in this layer:

1. the page names dominant regions, but there is no deterministic prominence contract for deciding which abnormal surface actually owns the viewport when multiple candidates compete
2. motion rules describe isolated behaviors, but they do not classify change causes, animation budgets, or restore semantics, so live updates and shell restoration can still feel arbitrary
3. hover and keyboard-protection are mentioned only for sorting, leaving no general fence that protects active focus, compare work, or drawer investigation from layout or emphasis thrash
4. accessibility requires table fallbacks, but reduced-motion parity is not yet defined, so critical state changes could disappear or over-animate depending on preference
5. elevated states may pulse once, but no cooldown or hysteresis rule prevents rapid promote-demote oscillation when anomalies sit near threshold boundaries

Build the visual layer around these contracts:

**OpsProminenceDecision**
`opsProminenceDecisionId`, `shellContinuityKey`, `boardPostureRef`, `candidateSurfaceRefs`, `promotedSurfaceRef`, `secondarySummaryRefs`, `decisionBasisRef`, `attentionBudgetRef`, `focusProtectionFenceRef`, `cooldownWindowRef`, `pinnedSurfaceRef`, `decidedAt`

**OpsMotionEnvelope**
`opsMotionEnvelopeId`, `shellContinuityKey`, `prominenceDecisionRef`, `boardPostureRef`, `changeCause = live_delta | threshold_cross | batch_apply | route_morph | restore | degraded_mode | manual_pin`, `affectedSurfaceRefs`, `focusProtectionFenceRef`, `cooldownWindowRef`, `animationClass`, `durationBudgetMs`, `settleBudgetMs`, `reducedMotionVariantRef`, `causalCopyRef`, `emittedAt`

**OpsFocusProtectionFence**
`opsFocusProtectionFenceId`, `shellContinuityKey`, `protectedSurfaceRef`, `interactionMode = hover | keyboard | compare | compose | investigate`, `protectedEntityRef`, `attentionBudgetRef`, `lockedSurfaceRefs[]`, `openedAt`, `expiresAt`, `fenceState = active | stale | released`

**OpsReducedMotionProfile**
`opsReducedMotionProfileId`, `preferenceSource`, `motionPolicy = full | reduced | essential_only`, `equivalentSignalRulesRef`, `numericUpdateMode`, `thresholdCrossMode`, `batchApplyMode`, `effectiveAt`

**OpsEscalationCooldownWindow**
`opsEscalationCooldownWindowId`, `prominenceDecisionRef`, `surfaceRef`, `triggerRef`, `enteredAt`, `minimumHoldMs`, `demotionCriteriaRef`, `cooldownState = active | releasable | released`

Let `prominenceScore_s(t) = actionability_s(t) * severity_s(t) * trustLowerBound_s(t) * confidenceLowerBound_s(t) * persistenceMultiplier_s(t)`.

`OpsProminenceDecision` may promote surface `s` only when `prominenceScore_s(t) >= theta_enter_s`, `support_s(t) >= n_min_s`, and either no surface is pinned or `prominenceScore_s(t)` exceeds the current winner by `delta_promote_s`. Demotion requires `prominenceScore_s(t) < theta_exit_s` for `m_hold_s` consecutive evaluations, with `theta_exit_s < theta_enter_s`.

1. The masthead owns scope, horizon, search, global filters, live mode, and pause-live controls.
2. `NorthStarBand` communicates the system state in one scan line.
3. `BottleneckRadar` owns the dominant visual weight of the page.
4. `InterventionWorkbench` owns the dominant action weight of the page.
5. `ServiceHealthGrid` and `CohortImpactMatrix` stay calmer unless their state becomes the selected anomaly driver.
6. One escalated region per viewport. If multiple regions are abnormal, `OpsProminenceDecision` must promote the most actionable one and summarize the rest through stable secondary surfaces.
7. Use color, iconography, shape, copy, and motion together; never rely on color alone, and every motion cue must have an equivalent non-motion signal under `OpsReducedMotionProfile`.
8. Prefer compact trend strips, heat cells, and ranked grids over oversized chart walls.
9. Numeric metrics must morph in place through `OpsMotionEnvelope`; do not animate theatrical count-ups, and batch-apply updates must declare their cause before they animate.
10. Threshold crossings may pulse once and then rest in a stable elevated state, but demotion must respect `OpsEscalationCooldownWindow` so borderline anomalies cannot thrash the board.
11. Resorting lists, emphasis changes, or drawer-driven layout shifts while the operator is hovered, keyboard-focused, comparing, composing, or investigating is forbidden unless `OpsFocusProtectionFence` has been released.
12. When live updates are paused, new deltas must collect in a visible batch queue and apply only on resume or explicit accept, with one `OpsMotionEnvelope` that distinguishes restore-from-pause from ordinary live drift.

Additional rules:

- `OpsProminenceDecision` is the only contract allowed to change which overview surface owns dominant weight; individual widgets may request elevation, but they may not self-promote
- `AttentionBudget.dominantQuestionRef`, `AttentionBudget.dominantActionRef`, and `OpsBoardPosture.dominantSurfaceRef` must resolve from the same `OpsProminenceDecision`; local tile urgency, local pulse state, or hover emphasis may not override the shell decision
- `OpsMotionEnvelope` must classify whether change came from live telemetry, route restore, manual pin, degraded-mode transition, or explicit batch apply so operators can distinguish causality at a glance
- `OpsMotionEnvelope`, `OpsReducedMotionProfile`, and causal copy must agree on why a surface changed prominence; threshold-cross, restore, batch-apply, degraded-mode, and manual-pin changes may not collapse into one generic highlight
- `OpsFocusProtectionFence` must freeze not only resorting but also auto-collapse, auto-expand, highlight transfer, and dominant-region swaps while the protected interaction is active
- while `OpsFocusProtectionFence.fenceState = active`, `BottleneckRadar`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` must preserve current ordering, expansion, and dominant emphasis; competing anomalies may appear only as queued secondary summaries or buffered delta digests
- `OpsReducedMotionProfile` must preserve all meaning through static badges, copy, and state chips when motion is reduced or essential-only; preference may lower animation, but never information
- `OpsEscalationCooldownWindow` must hold the promoted state long enough for human recognition and require explicit demotion criteria, not just the absence of the triggering spike for one frame
- `OpsEscalationCooldownWindow` must survive restore, pause-live resume, and reduced-motion mode; a promoted anomaly may not demote merely because animation was suppressed or a restore replay re-emitted the last threshold-cross copy

## 6. Drill-down, allocation, and degraded-mode algorithms

For any board interaction:

1. Selecting a metric, bottleneck, health node, or cohort slice must open `InvestigationDrawer` or deepen the existing split view inside the same shell, and it must mint one `OpsDrillContextAnchor` for source surface, ordinal, focus target, and return path.
2. The originating board state must be serialized into `OpsReturnToken` plus `OpsDrillContextAnchor` with exact board tuple, selected tuple, selection lease, delta gate state, and runtime publication posture before any cross-shell launch or child-route deepening.
3. The selected anomaly must remain pinned while related surfaces refresh.
4. Cross-filtering is allowed only when it is reversible in one step and visible in the masthead.
5. Launching from the operations console into workspace, hub, pharmacy, audit, or incident detail must preserve the originating `OpsReturnToken`.
6. Returning from a child surface must restore filters, horizon, pinned anomaly, selected tab, source row or cell, and keyboard focus target where still valid; otherwise, or when `OpsReturnToken`, `OpsSelectionLease`, `OpsDeltaGate`, or `OpsActionEligibilityFence` no longer validates, restore the nearest valid shell and explain the downgrade through `OpsRestoreReport`.
7. Compare mode is explicit. Opening a second or third scenario, queue, or dependency path must not happen automatically.
8. When the reason for expanded diagnosis resolves, the shell must return to its prior quiet posture unless the operator pinned the richer layout.

For capacity and allocation work:

1. Start from the active bottleneck or lane, not from a blank planner.
2. Show current demand, current capacity, and predicted shortfall before any recommendation.
3. Rank candidate reallocations by expected safe relief, time-to-effect, confidence, and policy compatibility.
4. Distinguish human staffing moves, automation fallback, routing changes, supplier failover, and threshold adjustments as separate action types.
5. Every candidate action must show target scope, expected relief, implementation lag, owner, downside or displaced risk, and applicable guardrails.
6. If a recommendation depends on one booking or hub option being ordered above another, show the governing `CapacityRankProof`, current `CapacityRankExplanation`, and audience-safe disclosure mode rather than replaying browser-local score calculations.
7. If a recommendation, ack-risk alert, or route exposure depends on Enhanced Access policy, show the current compiled hub policy tuple and `NetworkCoordinationPolicyEvaluation` rather than inferring it from queue timing, admin notes, or raw slot fields.
8. Scenario compare must use `current | proposed | impact` with a shared metric basis.
9. Committing an allocation plan must show `pending_effect` until authoritative telemetry confirms the change, and commit-ready posture may not return after compare, pause, or handoff until `OpsActionEligibilityFence.eligibilityState = live_commit`.
10. The transition into `pending_effect`, `handoff_required`, `stale_reacquire`, or blocked posture must come from `OpsInterventionSettlement`, not from a local optimistic state guess.
11. Low-confidence recommendations must stay advisory and may not inherit the same visual weight as ready-to-commit interventions.

For real-time system health and degraded mode:

1. Essential function health outranks infrastructure detail on the default board.
2. Every health state must express both severity and operability: `healthy`, `degraded_but_operating`, `fallback_active`, `blocked`, or `unknown_or_stale`.
3. Shell-level freshness must reflect whether the operator can trust the whole board.
4. Component-level staleness must remain local where safe.
5. Entering degraded mode must preserve the last stable board and annotate affected regions rather than replacing the whole console with an outage page.
6. Incident command may temporarily promote the relevant health or bottleneck surface, but it must not erase allocation or queue context that operators still need.
7. The resilience lens is a specialist child view of the same shell, not a separate disconnected admin product.
8. Degraded or quarantined assurance slices must stay visible with exact blocking producer or namespace detail and may only downgrade the affected action surfaces, not the entire board.
9. Active channel rollout freezes must render as first-class operational state with affected journeys, cohorts, fallback mode, and direct governance handoff rather than as a generic warning banner.

## 7. Accessibility, responsiveness, and verification

The console must implement `accessibility-and-content-system-contract.md` with operations-grade `AssistiveTextPolicy`, chart parity, and buffered live announcements.

1. The console is desktop-first, but all views must remain operable on laptop widths and readable in `mission_stack`.
2. Every visual matrix, chart, or heat surface must have a keyboard-accessible table or list fallback, and that fallback must be first-class rather than a secondary export path.
3. Hotkeys are encouraged for scope changes, pause-live, search, and return-to-board, but every action must also be available through standard controls.
4. Use virtualization for large worklists and entity tables.
5. First stable overview render must prefer summary projections first, then hydrate deeper boards progressively without layout thrash.
6. Live updates must be rate-limited at the surface level so render cost stays bounded during event spikes.
7. Automation selectors must key off stable semantic identifiers such as `data-surface`, `data-scope`, and `data-entity-ref`.
8. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` must each declare `AccessibleSurfaceContract` and `FreshnessAccessibilityContract` so stale or blocked truth is announced before the operator reaches chart details.
8A. Each operations route family must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; the board may not remain calm, chart-dominant, or `commit_ready` while semantic coverage is degraded by `mission_stack`, host resize, reduced motion, or buffered anomaly replay.
9. `BottleneckRadar`, `CohortImpactMatrix`, `ServiceHealthGrid`, and any forecast or calibration visual must implement `VisualizationFallbackContract`, `VisualizationTableContract`, and `VisualizationParityProjection` with summary sentence, explicit units, confidence or interval language, current filter context, current selection, and one shared parity tuple. If parity degrades, the table, summary, or placeholder becomes authoritative and the visual may not keep the dominant meaning.
10. `pause_live`, anomaly promotion, return-from-drill, and buffered anomaly replay must use one `AssistiveAnnouncementTruthProjection` over `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, and `UIEventEmissionCheckpoint`; threshold jitter, restore, or queue flush may not create repeated assertive announcements or replay stale calmness as fresh activity.
11. When tables or matrices use arrow-key navigation, the surface must declare `KeyboardInteractionContract(navigationModel = grid | treegrid)` and keep selection independent from focus until drill-in, compare, or commit is explicit.
12. Inline intervention forms, scope changes, and rollback or recovery commands must implement `FormErrorSummaryContract` and `TimeoutRecoveryContract`; blocked or expired actions keep the current anomaly and proposed intervention visible in place.
13. At 125% browser zoom, elevated text scale, or constrained laptop width, collapse summary surfaces and compress the secondary plane before reducing type or hit area; the workbench may shrink in span, but not in semantic priority.
14. `OpsRestoreReport`, queued-delta digests, and stale-slice transitions must announce through polite live regions without stealing focus; keyboard users need direct shortcuts to the selected anomaly, the workbench, and the last drill return anchor, and restore may emit at most one current-state digest per active anomaly scope.
15. governance handoff, handoff return, and parity-drift downgrade must announce the settled `OpsInterventionSettlement.result`, not local navigation success, so assistive users hear the same authoritative posture as sighted operators.
15. Every semantic state must pair icon or text with color and maintain contrast in neutral and elevated tones; `stable_service` may not depend on green alone.

Ship the console with verification for:

- stable shell reuse across `/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies`
- pause-live with buffered batch apply
- pinned anomaly preservation during live patching
- one dominant anomaly and one dominant intervention region at a time
- `OpsSemanticTonePolicy` limiting dominant accent to the selected anomaly and current action dock while keeping stable-service posture neutral
- deterministic `OpsProminenceDecision` behavior when multiple abnormal surfaces compete
- `OpsSurfaceFootprintPlan` enforcing one 8:4 overview split, one expanded anomaly driver beside `BottleneckRadar`, and no empty speculative action dock in stable-service posture
- `OpsSelectedAnomalyState` preventing sibling focus theft while still surfacing rank drift and invalidation reasons
- `anomalyRankScore_i` explanation rendering consequence, leverage, persistence, freshness, and guardrail drag inline rather than raw count alone
- forecast-interval and calibration-age rendering tests for `OpsInterventionProjection`
- `OpsInterventionReadiness` preventing advisory, stale, or handoff-only candidates from inheriting commit-ready emphasis
- `OpsActionEligibilityFence` freezing `InterventionWorkbench` when board tuple, selection lease, delta gate, or runtime publication posture drifts
- effective-sample-size and score-interval gating tests for cohort promotion
- `OpsFocusProtectionFence` preventing focus theft, resort, and dominance swap during hover, keyboard compare, and investigation flows
- `OpsLiveCadencePolicy` keeping patch cadence, resort cadence, and dominance-review cadence distinct under high-churn telemetry
- `OpsReducedMotionProfile` parity proving threshold crossings, batch apply, and degraded-mode transitions remain comprehensible without animated emphasis
- `OpsEscalationCooldownWindow` holding elevation through threshold jitter without hiding real sustained escalation
- scenario compare without auto-resort or focus theft
- return-from-drill restoration via `OpsReturnToken`
- `OpsRestoreReport` and `OpsDrillContextAnchor` restoring the same row, cell, and focus target after drill-down, child-route return, or partial recovery
- stale board tuple, invalid return token, or drifted release-trust posture downgrading the workbench to `stale_reacquire | read_only_diagnostic` without hiding the last stable anomaly context
- ops-to-governance handoff and return proving `OpsGovernanceHandoff`, `OpsReturnToken`, and `OpsInterventionSettlement` keep one authoritative split between diagnostic posture and governed control
- degraded-mode preservation of the last stable board
- `OpsSliceFreshnessState` thresholds localizing stale posture, downgrading only affected controls, and surfacing queued-delta digests before silent drift
- no-material-anomaly overview collapsing to one calm `OpsStableServiceDigest` instead of a green chart wall
- quarantined assurance slices remaining visible and read-only through restore, pause-live, and return flows
- continuity-evidence slices staying aligned with `ExperienceContinuityControlEvidence` through assurance, audit, workspace, governance, and workflow-specific pivots for more-info reply, intake resume, booking manage, hub booking manage, assistive session, workspace completion, and pharmacy-console settlement
- continuity-rooted investigations preserving one `continuityQuestionHash` through `OpsBoardStateSnapshot`, `InvestigationDrawerSession`, `OpsReturnToken`, and child-route pivots, with newer proof rendered as diff against the preserved base rather than silently rebasing the question
- stale or blocked continuity evidence forcing `observe_only` or handoff posture instead of live intervention
- `/ops/resilience` preserving `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `RecoveryControlPosture`, and recovery-evidence refs through deep links, return, and partial restore
- stale or unrehearsed runbook bindings forcing resilience controls to `diagnostic_only | recovery_only | blocked` without hiding the latest evidence set
- restore, failover, and chaos controls remaining pending or blocked until the matching `ResilienceActionSettlement` confirms current posture and evidence
- active rollout freeze state surviving deep links and board restoration without silently widening actions
- accessible table fallback and `VisualizationParityProjection` parity for every chart, matrix, or heat surface
- `MissionStackFoldPlan` preserving the selected anomaly, queued-delta summary, and `DecisionDock` through narrow-layout fold and unfold
- `PrimaryRegionBinding`, `CalmDegradedStateContract`, and `EmptyStateContract` behavior proving that quiet or filter-exhausted boards never hide blocked, frozen, or masked truth
- performance under high-churn metric updates

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `phase-9-the-assurance-ledger.md`
- `staff-operations-and-support-blueprint.md`
- `governance-admin-console-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `accessibility-and-content-system-contract.md`
- `ux-quiet-clarity-redesign.md`
