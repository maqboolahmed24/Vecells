# Governance/Admin console frontend blueprint

## Purpose

Define the complete front-end contract for the Governance and Admin Shell that controls tenant configuration, authority links, access policy, communications governance, compliance evidence, and release promotion.

This shell translates the platform's RBAC plus ABAC model, compiled policy bundle gate, immutable audit spine, and assurance evidence model into calm, high-control operational surfaces. It may configure the canonical rules from `phase-0-the-foundation-protocol.md`, `platform-admin-and-config-blueprint.md`, and `phase-9-the-assurance-ledger.md`, but it may not bypass them.

This specialization governs the shell, route, screen, diff, simulation, evidence, and approval behavior for governance-heavy routes. It complements rather than replaces the live Operations Console in `operations-console-frontend-blueprint.md`; control-room diagnosis stays in the operations shell, while governed mutation and approval work belongs here.

## Release-guardrail priorities

High-priority release-governance gaps in this shell:

1. governance continuity is bound to scope and diff objects, but not yet to the runtime guardrail snapshot, active channel freezes, and recovery dispositions that determine whether promoted behavior is still safe to widen
2. shell consistency freezes on tuple drift, but it does not yet serialize the full runtime publication state and `AudienceSurfaceRuntimeBinding` needed to stop governance surfaces from appearing greener than published route contracts
3. approval and release tuple cards still center bundle and schema evidence more clearly than channel manifests, bridge floors, route-contract publication, and recovery dispositions
4. post-promotion watch remains hash-bound, but not yet to one exact published `ReleaseWatchEvidenceCockpit` that binds `ReleaseWatchTuple`, `WaveGuardrailSnapshot`, `WaveActionSettlement`, runtime publication parity, and rollback readiness together
5. governance read and mutation contracts still understate the runtime wave-action, observation-window, and recovery-settlement path, which risks allowing dashboards or shell affordances to outrun the authoritative rollout result and evidence cockpit

## Governance operating law

The governance shell should make scope, impact, and approval state explicit before any consequential change.

High-priority governance-control gaps in this layer:

1. scope is visible but not tokenized, so tenant, organisation, environment, policy plane, elevation, or purpose-of-use can drift between edit, approval, and promotion
2. the draft path lacks an immutable baseline snapshot, so diff, simulation, and approval can be reviewing moving live state
3. concurrent editors and approvers are not lease-bound, so stale drafts can still be approved or promoted after material change
4. approval is procedural but not baseline-package-bound, so approvers are not guaranteed to inspect the exact same diff, impact, evidence set, and release tuple the editor saw
5. post-promotion monitoring is a principle rather than a first-class watch object, so rollback readiness and drift review can detach from the same governance continuity lineage instead of staying on one evidence-bound cockpit
6. diff, impact, simulation, tuple verification, and approval still lack one package-bound `GovernanceReviewContext` carrying the immutable baseline tuple and approval tuple, so adjacent panes can appear aligned while reading different freshness or settlement truth

Every high-impact flow should follow the same visible shape:

1. select scope
2. mint `GovernanceScopeToken` for tenant, organisation, environment, policy plane, acting role, purpose-of-use, and elevation state
3. inspect live state, inheritance path, and current evidence from an immutable `ChangeBaselineSnapshot`
4. open or continue a draft `ChangeEnvelope` bound to that scope token and baseline snapshot
5. review the human-readable diff plus affected tenants, users, routes, and controls
6. run simulation, compile, and policy-invariant checks against the same baseline and draft
7. collect the required approvals through one `ApprovalEvidenceBundle`
8. promote with an explicit `effectiveAt` boundary and attach a `PromotionWatchWindow` bound to the published `ReleaseWatchTuple` and current `ReleaseWatchEvidenceCockpit`
9. monitor drift, failures, rollback readiness, and tuple supersession inside that same watch window until the release stabilizes, is superseded by a later wave step, or is rolled back, always through that same cockpit

The operating rules are:

- explicit scope before action
- tokenized scope before draft
- draft before live
- immutable baseline before diff
- diff before save
- simulate before promote
- evidence before approval
- approval bundle before promote
- live lease before edit, approve, or promote
- immutable audit after commit
- no hidden inheritance
- no graph-only admin surfaces without a list or table fallback
- no production mutation without a visible rollback or compensating-change path
- one dominant risk question and one dominant action per screen

This shell must also inherit the canonical Phase 0 front-end law. Governance routes are not exempt from `PersistentShell` continuity, one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, one current `DecisionDock`, `AttentionBudget` promotion limits, `SelectedAnchor` preservation, `QueueChangeBatch` buffering for disruptive live queue changes, or `VisibilityProjectionPolicy` enforcement before projections materialize. Calm governance UI may compress density, but it may not regain calmness by breaking continuity, hiding trust state, or widening read scope after projection.

## Visual posture and token inheritance

The Governance and Admin Shell inherits `design-token-foundation.md` through `profile.governance_admin`.

- matrices and effective-access previews may use `dense_data` only for non-editable cells; approval, promotion, rollback, and recertification decisions return to `balanced` density for comprehension and consequence review
- `ScopeRibbon`, `ChangeEnvelope`, `ImpactPreview`, `ApprovalStepper`, and evidence rails use the same surface-role, spacing, type, stroke, and focus tokens as the other shells
- local admin-console colors, floating-card stacks, and shadow-heavy panels are forbidden; risk and policy state must resolve through the shared semantic-color and trust/freshness roles

## Shell and route topology

The Governance and Admin Shell should own these route families:

- `/ops/governance`
- `/ops/governance/tenants`
- `/ops/governance/tenants/:tenantId`
- `/ops/governance/authority-links`
- `/ops/governance/compliance`
- `/ops/governance/records`
- `/ops/governance/records/holds`
- `/ops/governance/records/disposition`
- `/ops/access`
- `/ops/access/users`
- `/ops/access/roles`
- `/ops/access/reviews`
- `/ops/access/elevation`
- `/ops/config`
- `/ops/config/tenants`
- `/ops/config/bundles`
- `/ops/config/promotions`
- `/ops/comms`
- `/ops/comms/templates`
- `/ops/comms/policies`
- `/ops/release`

Cross-shell launches into `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` may open evidence drawers, read-only side stages, or linked detail tabs, but they must not discard the active governance continuity key when the user is still working the same draft, approval, promotion, tenant, or access-review object.

Cross-shell evidence pivots from active governance work must preserve `GovernanceScopeToken`, `ChangeBaselineSnapshot`, and the active approval or watch object reference through one `GovernanceReturnIntentToken`. Evidence drawers may become read-only, but returning must never widen, narrow, or silently refresh the active governance scope.

Governance shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = governance)` over `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*` route families that share the same governance continuity law
- every governance route family must publish one `RouteFamilyOwnershipClaim`; diff, matrix, review, impact, simulation, approval, promotion, rollback, and watch routes are same-shell child or same-shell peer members of the governance shell, not detached CRUD pages or second consoles
- config, access, communications, release, and compliance domains may contribute route families, projections, and artifacts, but shell ownership remains with the governance shell family while the same governed object, scope token, and continuity frame remain active
- `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` may contribute read-only pivots or bounded side stages, but they may not silently take ownership of an in-progress governance route family or reopen writable context outside the current governance shell contract
- every governance route family must also materialize one live `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`; diff, matrix, review, impact, simulation, approval, promotion, rollback, and watch surfaces may read only through declared `ProjectionQueryContract` refs, approve or promote only through declared `MutationCommandContract` refs, and preserve cached draft or watch state only through the declared `ClientCachePolicy`
- scope checksum similarity, route naming, and stale governance projections may not imply writable review, promotion watch, or rollback posture when the active manifest or `AudienceSurfaceRuntimeBinding` has degraded

## Primary governance personas

The shell must support at least these personas:

- `platform_root_admin`
- `tenant_governance_admin`
- `organisation_authority_admin`
- `access_reviewer`
- `compliance_officer`
- `release_manager`
- `security_responder`

Role presentation should never begin with raw scope strings or policy IDs alone. The first visible layer must translate access into operational language such as who can act, on what tenant or organisation, against which data audience, under what purpose-of-use, for how long, and with what approval burden.

## Governance-specific interaction primitives

### 1. GovernanceShell

The opening `GovernanceShell` continuity layer requires five corrections:

1. shell identity now derives from one `GovernanceContinuityFrame` instead of an overloaded continuity key that can drift between draft, approval, and watch work
2. cross-shell evidence pivots now mint a governed `GovernanceReturnIntentToken` instead of relying on ambient browser history
3. disruptive live updates now flow through one `GovernanceLiveDeltaWindow` rather than silently rebasing visible governance data
4. blocked or read-only posture now resolves through one `GovernanceFreezeDisposition` so the shell, status strip, and action dock cannot disagree
5. the inspected tenant, approval, role, or rollout item now stays bound to a `GovernanceAnchorLease` instead of drifting under list refresh or sort change

Fields:

- `shellId`
- `entityContinuityKey`
- `continuityFrameRef`
- `routeCluster = governance | access | config | comms | release`
- `scopeTokenRef`
- `selectedTenantRef`
- `selectedOrganisationRef`
- `selectedEnvironmentRef`
- `activeDraftRef`
- `baselineSnapshotRef`
- `activeApprovalRef`
- `activeApprovalBundleRef`
- `activeReviewContextRef`
- `activeReleaseApprovalFreezeRef`
- `activeCompatibilityEvidenceRef`
- `activeReadPathCompatibilityDigestRef`
- `activeProjectionCompatibilityDigestRefs[]`
- `activeBackfillExecutionLedgerRefs[]`
- `activeMigrationCutoverCheckpointRef`
- `activeMigrationExecutionBindingRef`
- `activeMigrationActionSettlementRef`
- `activeMigrationObservationWindowRef`
- `activeReleaseWatchTupleRef`
- `activeReleaseWatchEvidenceCockpitRef`
- `activeGuardrailSnapshotRef`
- `activeWaveObservationPolicyRef`
- `activeChannelFreezeRefs[]`
- `activeRecoveryDispositionRefs[]`
- `activeRouteContractRefs[]`
- `activeSurfaceRuntimeBindingRefs[]`
- `activePublicationParityRef`
- `activeWatchTupleHash`
- `activeWatchEvidenceCockpitHash`
- `activeWaveActionSettlementRef`
- `activeWaveActionObservationWindowRef`
- `activeActionLeaseRef`
- `activeSettlementRef`
- `activeEvidenceRef`
- `activeContinuityEvidenceBundleRef`
- `activeWatchWindowRef`
- `shellConsistencyRef`
- `anchorLeaseRef`
- `returnIntentTokenRef`
- `liveDeltaWindowRef`
- `freezeDispositionRef`
- `attentionBudgetRef`
- `selectedAnchorRef`
- `scopeRibbonState`
- `statusStripState`
- `projectionTrustState = trusted | degraded | partial | blocked`
- `rightRailMode = none | impact | evidence | audit | simulation | approvals`
- `centerPaneMode = overview | matrix | detail | diff | review`
- `liveContextState = live | draft | compare`
- `releaseTupleVerificationState = verified | stale | conflict | blocked`
- `runtimePublicationState = published | stale | missing | conflict`

Semantics:

- is the durable shell for one governance task, draft, approval, or investigation lineage
- must derive `entityContinuityKey` from `GovernanceContinuityFrame` so route changes, right-rail pivots, and watch-mode transitions cannot silently swap the governed object lineage
- must default to `two_plane`
- may enter `three_plane` only for compare, diff, or approval-heavy work
- must preserve tenant, organisation, environment, and acting-context selections while the user moves between adjacent governance child views
- must never force a full page swap between matrix, diff, evidence, and approval work that belongs to the same continuity key
- must render the canonical shared status strip and keep it in sync with shell freshness, trust, and freeze posture rather than introducing a second independent governance status system
- must preserve the active `selectedAnchorRef` for the currently inspected tenant row, approval package, affected role, authority link, or rollout wave whenever the continuity key remains unchanged
- any `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, or `/ops/release/*` child route that can approve, promote, narrow, widen, or export must also resolve one published `AudienceSurfaceRuntimeBinding`; if runtime publication parity drifts, the same shell must preserve the current scope and anchor while `GovernanceFreezeDisposition` suppresses live controls in place
- must keep `anchorLeaseRef` aligned with `selectedAnchorRef` so list refresh, sort change, or live reprioritisation cannot silently move the inspected object to a different row
- must apply `AttentionBudget` so only one support region auto-promotes at full prominence during routine governance review
- must inherit and publish the current `QuietClarityBinding`, `QuietClarityEligibilityGate`, `EssentialShellFrame`, `PrimaryRegionBinding`, `StatusStripAuthority`, `DecisionDockFocusLease`, `MissionStackFoldPlan`, and any active `QuietSettlementEnvelope`; matrix, diff, approval, and watch surfaces may not appear calmer, greener, or more writable than those contracts allow
- must freeze edit, approval, and promote controls if `scopeTokenRef`, `baselineSnapshotRef`, or `activeActionLeaseRef` becomes stale, revoked, or inconsistent with the visible draft
- must keep diff, impact, simulation, tuple verification, and approval lanes bound to `activeReviewContextRef`; if any pane resolves a different package, freshness stamp, or settlement lineage, the same shell must freeze and surface revalidation instead of silently swapping context
- must also freeze approval and promotion if `activeReleaseApprovalFreezeRef`, `activeCompatibilityEvidenceRef`, `activeReadPathCompatibilityDigestRef`, `activeProjectionCompatibilityDigestRefs[]`, `activeBackfillExecutionLedgerRefs[]`, `activeMigrationCutoverCheckpointRef`, `activeMigrationExecutionBindingRef`, `activeMigrationActionSettlementRef`, `activeMigrationObservationWindowRef`, or `releaseTupleVerificationState` drifts from the visible release package
- must also freeze watch, widen, rollback, or stabilization decisions if `activeReleaseWatchTupleRef`, `activeReleaseWatchEvidenceCockpitRef`, `activeGuardrailSnapshotRef`, `activeWaveObservationPolicyRef`, `activeWatchTupleHash`, `activeWatchEvidenceCockpitHash`, `activeChannelFreezeRefs[]`, `runtimePublicationState`, route-readiness digests, backfill execution ledgers, the active migration cutover checkpoint, or the current migration observation posture no longer match the promoted runtime tuple
- must keep `activePublicationParityRef` visible wherever tuple posture is shown so the shell cannot present a verified release tuple while runtime publication, channel freeze, recovery disposition, or continuity proof has already drifted
- must buffer disruptive live changes through `liveDeltaWindowRef`; silent baseline or approval rebases inside an active draft, approval, or watch session are forbidden
- must expose only one authoritative blocked or read-only explanation through `freezeDispositionRef`, and every CTA, ribbon, and status surface must render from that same disposition
- must expose only one authoritative in-flight mutation or recovery posture through `activeSettlementRef`; optimistic draft banners, approval ticks, or promotion copy may not outrun settled governance action truth
- must keep `activeReleaseWatchTupleRef`, `activeReleaseWatchEvidenceCockpitRef`, `activeWaveActionSettlementRef`, and `activeWaveActionObservationWindowRef` visible beside rollout controls so governance screens cannot imply widen, pause, rollback, kill-switch, or stabilization success before the runtime settlement says so
- inbound launches from operations must resolve one immutable `GovernanceOpsHandoffContext`; governance may reuse the current shell only while the linked ops handoff, scope token, publication parity, release watch tuple, and freeze tuple still agree
- must use `returnIntentTokenRef` for cross-shell evidence pivots so returning from audit, assurance, or incident surfaces can re-enter the same continuity frame only while scope, baseline, and watch fences are still valid
- if a governance frame originated from operations, evidence pivots, recovery guides, and post-settlement return must preserve the originating `OpsReturnToken` through the active `GovernanceOpsHandoffContext`; ambient browser back is not a governed restore path
- must preserve `activeWatchWindowRef` and `activeReleaseWatchEvidenceCockpitRef` after promotion so the same shell can shift from draft review into live watch and rollback-readiness review without breaking continuity

### 1D. GovernanceShellConsistencyProjection

Fields:

- `governanceShellConsistencyId`
- `scopeTokenRef`
- `bundleVersion`
- `audienceTier`
- `governingObjectVersionRefs`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `reviewContextRef`
- `approvalTupleHash`
- `continuityFrameRef`
- `anchorLeaseRef`
- `liveDeltaWindowRef`
- `freezeDispositionRef`
- `releaseApprovalFreezeRef`
- `releaseWatchTupleRef`
- `releaseWatchEvidenceCockpitRef`
- `channelManifestSetRef`
- `requiredAssuranceSliceRefs[]`
- `watchTupleHash`
- `watchEvidenceCockpitHash`
- `publicationParityRef`
- `readPathCompatibilityDigestRef`
- `backfillExecutionLedgerRefs[]`
- `migrationCutoverCheckpointRef`
- `guardrailSnapshotRef`
- `waveObservationPolicyRef`
- `activeChannelFreezeRefs[]`
- `recoveryDispositionRefs[]`
- `continuityEvidenceBundleRef`
- `requiredContinuityControlRefs[]`
- `lastWaveActionObservationWindowRef`
- `watchTupleState = active | stale | superseded | closed`
- `opsHandoffContextRef`
- `opsHandoffState = none | diagnostic_only | review_ready | stale | blocked`
- `runtimePublicationState = published | stale | missing | conflict`
- `readPathDigestState = exact | constrained | blocked`
- `guardrailState = green | constrained | frozen | rollback_review_required`
- `computedAt`
- `staleAt`
- `causalConsistencyState = consistent | refreshing | stale | conflict`
- `projectionTrustState = trusted | degraded | partial | blocked`
- `reviewContextState = verified | stale | conflict | blocked`
- `completenessState = complete | partial | blocked`
- `returnIntentValidityState = valid | stale | blocked`

Semantics:

- is the read-side truth envelope for scope ribbon, diff, approval, simulation, compliance, and watch surfaces inside one governance continuity key
- must be materialized under `VisibilityProjectionPolicy` before governance data reaches the browser
- must ensure `ScopeRibbon`, center-pane data, shared status strip, and `DecisionDock` all speak from the same bundle and governing-object version set
- must also ensure `GovernanceReviewContext`, `ReleaseFreezeTupleCard`, `ImpactPreview`, `ApprovalStepper`, and `PromotionWatchWindow` resolve the same package hash, published `ReleaseWatchTuple`, `ReleaseWatchEvidenceCockpit`, tuple parity verdict, observation policy, and settlement lineage before any surface can render writable or approved posture
- must also ensure `ChangeBaselineSnapshot.baselineTupleHash`, `ApprovalEvidenceBundle.approvalTupleHash`, and the current `ReleaseWatchTuple.watchTupleHash` all still match the visible package before any surface can render writable, approved, or stabilized posture
- if `causalConsistencyState != consistent` or `projectionTrustState != trusted`, mutating controls must freeze and the shell must enter bounded refresh or recovery posture rather than displaying contradictory approval or promotion certainty
- must surface degraded or partial assurance slices explicitly instead of flattening them into ordinary success or ready states
- must also surface missing, stale, or conflicting `ExperienceContinuityControlEvidence` when the draft or promoted tuple can affect patient navigation, record-continuation, more-info reply, conversation-settlement, support-replay behavior, intake resume, booking manage posture, hub booking-manage posture, assistive-session continuity, workspace task completion, or pharmacy-console settlement
- must also surface route-scoped read-path compatibility, backfill convergence, lag budget, and cutover posture whenever the candidate or promoted tuple changes projection contracts, rebuild plans, or schema evolution
- must serialize the same release-freeze, watch-tuple, watch cockpit, guardrail, and recovery-disposition posture consumed by runtime and operations surfaces so restored governance views cannot return greener than the system now is
- when `opsHandoffContextRef` is present, the projection must also prove the linked `OpsGovernanceHandoff`, `OpsReturnToken`, `GovernanceScopeToken`, and `AudienceSurfaceRuntimeBinding` still point to the same governed object, policy plane, publication tuple, and release watch tuple before writable posture is exposed
- if `runtimePublicationState != published`, `guardrailState != green`, or `watchTupleState != active`, the shell may preserve continuity and diagnostics, but approval, widen, and stabilization claims must remain frozen
- if `runtimePublicationState != published`, `guardrailState != green`, or `readPathDigestState = blocked`, the shell may preserve continuity and diagnostics, but approval, widen, and stabilization claims must remain frozen
- must publish the current `GovernanceFreezeDisposition`, `GovernanceLiveDeltaWindow`, and `GovernanceAnchorLease` state so shell chrome, drawers, and list panes cannot disagree about whether work is live, buffered, stale, or blocked

### Governance surface posture and evidence artifacts

Every draft, diff, approval, promotion-watch, and read-only recovery state must derive one stable posture from `SurfacePostureFrame` so governance never loses scope, selected diff anchor, or active guardrail context while runtime truth refreshes.

Add these governance adapters:

**GovernanceSurfacePosture**
`governanceSurfacePostureId`, `continuityFrameRef`, `scopeTokenRef`, `opsHandoffContextRef`, `surfacePostureFrameRef`, `selectedAnchorRef`, `dominantQuestionRef`, `dominantActionRef`, `recoveryActionRef`, `renderedAt`

**GovernanceEvidenceArtifact**
`governanceEvidenceArtifactId`, `continuityFrameRef`, `scopeTokenRef`, `changeEnvelopeRef`, `controlOrBundleRef`, `artifactSurfaceFrameRef`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `continuityEvidenceBundleRef`, `watchTupleHashRef`, `selectedControlRefs[]`, `selectedAnchorRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `returnIntentTokenRef`, `artifactState = summary_only | governed_preview | transfer_ready | external_handoff_ready | recovery_only`, `generatedAt`

`GovernanceEvidenceArtifact` binds compliance evidence, approval bundles, simulation packs, and release-watch evidence to the same scope, tuple, and selected row the shell is currently reviewing. Inline summary is primary; richer preview, transfer, print, and browser handoff remain secondary and must preserve the same return-safe governance context under one live `ArtifactModeTruthProjection`.

Rules:

- draft, diff, approval, promotion watch, and read-only recovery must each render through one `GovernanceSurfacePosture`; shell chrome, right rail, and status strip may not invent competing primary questions
- operations-originated governance entry must derive the initial `GovernanceSurfacePosture` from `GovernanceOpsHandoffContext.entryPosture`; local route chrome may not silently promote `diagnostic_only` or `review_only` entry into approval-ready posture
- `no_diff` is a valid calm state. When a candidate matches baseline, `SurfacePostureFrame` must keep scope, verification time, and next safe action visible rather than rendering a fake compare canvas
- compile, approval, promotion, rollback, and stabilization transitions must use `SurfacePostureFrame(postureState = settled_pending_confirmation)` or the governing blocked posture inside the same shell until `GovernanceActionSettlement` or `WaveActionSettlement` becomes authoritative
- compliance packs, diff packets, print bundles, and cross-shell evidence handoffs must render through `GovernanceEvidenceArtifact` plus `ArtifactSurfaceFrame`; pack generation must start from the currently visible scope and selected controls, not a detached export-only workflow
- evidence artifacts must remain bound to the same scope token, change envelope, selected anchor, and watch tuple visible in the shell; if any of those drift, preview degrades in place and print or export controls freeze
- `mission_stack` must preserve the same `GovernanceSurfacePosture`, `ScopeRibbon`, selected diff anchor, and active `DecisionDock` lease on narrow widths

### 1E. GovernanceContinuityFrame

Fields:

- `governanceContinuityFrameId`
- `scopeTokenRef`
- `governingObjectRefs`
- `workObjectRef`
- `taskPhase = browse | draft | approval | promotion_watch | rollback_review`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `approvalBundleRef`
- `approvalTupleHash`
- `watchWindowRef`
- `watchTupleHash`
- `opsHandoffContextRef`
- `originOpsReturnTokenRef`
- `continuityChecksum`
- `openedAt`
- `supersededAt`

Semantics:

- is the authoritative lineage frame for one governance task across center pane, right rail, cross-shell pivots, and post-promotion watch
- must supersede only when the governed object set, scope token, or task phase changes materially; route or layout changes alone must not mint a new frame
- must be the source of truth for shell restoration, watch continuation, stale-return rejection, and any safe return back to the originating operations board

### GovernanceOpsHandoffContext

Fields:

- `governanceOpsHandoffContextId`
- `opsGovernanceHandoffRef`
- `opsReturnTokenRef`
- `continuityFrameRef`
- `scopeTokenRef`
- `requiredScopeChecksum`
- `targetRouteRef`
- `targetPolicyPlane`
- `baselineSnapshotRef`
- `publicationParityRef`
- `audienceSurfaceRuntimeBindingRef`
- `releaseApprovalFreezeRef`
- `releaseWatchTupleRef`
- `activeChannelFreezeRefs[]`
- `guardrailSnapshotRef`
- `waveObservationPolicyRef`
- `recoveryDispositionRefs[]`
- `lastWaveActionSettlementRef`
- `watchTupleHash`
- `originBriefingArtifactRef`
- `entryPosture = diagnostic_only | review_only | approval_ready | promotion_watch | rollback_review | blocked`
- `handoffState = entered | stale | blocked | returned | superseded`
- `acceptedAt`
- `returnedAt`

Semantics:

- is the only legal ingress contract when the operations console hands a governed anomaly, rollout, or access issue into the governance shell
- binds the originating `OpsGovernanceHandoff`, `OpsReturnToken`, `GovernanceScopeToken`, `ChangeBaselineSnapshot`, and current publication or freeze tuple into one continuity-safe review context
- may open writable review only while the linked scope checksum, policy plane, runtime binding, publication parity, release watch tuple, observation policy, and freeze posture still match the originating handoff; otherwise the shell must degrade to `diagnostic_only` or `blocked`
- must remain visible in the shell state so approval, promotion, rollback, evidence pivots, and return-to-board actions can be replayed without ambient browser-history assumptions

### 1F. GovernanceReturnIntentToken

Fields:

- `governanceReturnIntentTokenId`
- `continuityFrameRef`
- `originRouteRef`
- `targetSurfaceRef`
- `scopeTokenRef`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `approvalBundleRef`
- `approvalTupleHash`
- `watchWindowRef`
- `releaseWatchTupleRef`
- `watchTupleHash`
- `opsHandoffContextRef`
- `opsReturnTokenRef`
- `publicationParityRef`
- `activeChannelFreezeRefs[]`
- `expiresAt`
- `returnState = armed | used | stale | superseded`

Semantics:

- binds temporary pivots into audit, assurance, incident, or resilience surfaces back to one approved governance continuity frame
- must fail closed if scope, `baselineTupleHash`, `approvalTupleHash`, watch tuple, watch window, or any linked operations handoff tuple drifted while the user was away from the shell
- may restore read-only evidence context, but must not silently restore expired mutation posture

### 1G. GovernanceLiveDeltaWindow

Fields:

- `governanceLiveDeltaWindowId`
- `continuityFrameRef`
- `baseBaselineTupleHash`
- `baseApprovalTupleHash`
- `baseProjectionVersionRefs`
- `bufferedDeltaRefs`
- `affectedPackageMemberRefs[]`
- `deltaSeverity = informational | review_required | freeze_required`
- `windowState = live | buffering | frozen | rebase_required`
- `openedAt`
- `closedAt`

Semantics:

- batches disruptive live changes while a governance draft, approval, or watch posture is open
- must distinguish informative background changes from deltas that require re-review, approval invalidation, or immediate freeze
- must force explicit operator acknowledgement before buffered deltas are merged back into the visible governance frame
- if a buffered delta changes `baseBaselineTupleHash`, `baseApprovalTupleHash`, the current watch tuple, or any required guardrail member, the shell must reopen in revalidation posture rather than silently rebasing the reviewed package

### 1H. GovernanceFreezeDisposition

Fields:

- `governanceFreezeDispositionId`
- `continuityFrameRef`
- `trigger = scope_drift | baseline_drift | baseline_tuple_drift | lease_expired | approval_bundle_drift | approval_tuple_drift | watch_tuple_drift | tuple_drift | live_delta | visibility_reduced`
- `allowedActions`
- `requiredRecoveryAction`
- `messageVariantRef`
- `setAt`
- `clearedAt`

Semantics:

- is the single authoritative explanation for why the governance shell is blocked, read-only, or forcing revalidation
- must drive `DecisionDock`, shared status strip, inline CTA posture, and recovery copy from the same trigger and recovery action
- must clear only after the shell has recomputed consistency against the current continuity frame and governing objects

### 1I. GovernanceAnchorLease

Fields:

- `governanceAnchorLeaseId`
- `continuityFrameRef`
- `anchorType = tenant_row | approval_row | role_row | authority_link | rollout_wave`
- `anchorRef`
- `sourceListVersionRef`
- `sortKeySnapshot`
- `leaseState = active | stale | recovered`
- `issuedAt`
- `staleAt`

Semantics:

- keeps the currently inspected object stable while list order, filtering, or live ranking changes around it
- must enter `stale` instead of silently moving focus when the anchored row disappears, merges, or is superseded
- must support bounded recovery that explains what changed before the shell selects a replacement anchor

### 1J. GovernanceReviewContext

**GovernanceReviewPackage**

Fields:

- `governanceReviewPackageId`
- `scopeTokenRef`
- `actingScopeTupleRef`
- `changeEnvelopeRef`
- `baselineSnapshotRef`
- `configWorkspaceContextRef`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `standardsDependencyWatchlistRef`
- `communicationsGovernanceWorkspaceRef`
- `communicationsSimulationEnvelopeRef`
- `templatePolicyImpactDigestRef`
- `impactPreviewRef`
- `continuityControlImpactDigestRef`
- `governanceContinuityEvidenceBundleRef`
- `approvalEvidenceBundleRef`
- `releaseApprovalFreezeRef`
- `releaseWatchTupleRef`
- `baselineTupleHash`
- `scopeTupleHash`
- `compilationTupleHash`
- `approvalTupleHash`
- `standardsWatchlistHash`
- `watchTupleHash`
- `reviewPackageHash`
- `packageState = current | stale | superseded | blocked`
- `settlementLineageRef`
- `assembledAt`

Semantics:

- is the immutable review package for one governance review cycle
- is the only legal package object for diff, impact, simulation, standards watchlist, continuity evidence, approval, and release-freeze verification inside the shell
- must freeze config simulation, communications simulation, standards watchlist, blast-radius preview, continuity evidence, and settlement lineage to one exact freshness epoch; adjacent panes may not silently advance one member while another pane still renders the old package
- any drift in baseline, scope, compiled package, standards watchlist, communications candidate, continuity impact, approval bundle, release watch tuple, or authoritative settlement must supersede the current package and force the shell into buffered-delta or revalidation posture instead of patching support regions in place

Fields:

- `governanceReviewContextId`
- `continuityFrameRef`
- `governanceReviewPackageRef`
- `scopeTokenRef`
- `staffIdentityContextRef`
- `actingContextRef`
- `actingScopeTupleRef`
- `changeEnvelopeRef`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `configWorkspaceContextRef`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `standardsDependencyWatchlistRef`
- `communicationsGovernanceWorkspaceRef`
- `communicationsSimulationEnvelopeRef`
- `templatePolicyImpactDigestRef`
- `continuityControlImpactDigestRef`
- `configDriftFenceRef`
- `approvalEvidenceBundleRef`
- `approvalTupleHash`
- `compiledPolicyBundleRef`
- `releaseApprovalFreezeRef`
- `releasePublicationParityRef`
- `releaseWatchTupleRef`
- `watchTupleHash`
- `waveGuardrailSnapshotRef`
- `migrationExecutionBindingRef`
- `migrationImpactPreviewRef`
- `readPathCompatibilityDigestRef`
- `projectionCompatibilityDigestRefs[]`
- `backfillExecutionLedgerRefs[]`
- `migrationCutoverCheckpointRef`
- `migrationActionSettlementRef`
- `migrationObservationWindowRef`
- `opsHandoffContextRef`
- `originOpsReturnTokenRef`
- `impactPreviewRef`
- `simulationEvidenceRef`
- `governanceContinuityEvidenceBundleRef`
- `selectedAnchorRef`
- `selectedDiffAnchorRef`
- `liveDeltaWindowRef`
- `freezeDispositionRef`
- `currentSettlementRef`
- `compilationTupleHash`
- `scopeTupleHash`
- `reviewPackageHash`
- `standardsWatchlistHash`
- `packageVerificationState = verified | stale | conflict | blocked`
- `reviewFreshnessState = current | buffered_delta | revalidation_required`
- `assembledAt`

Semantics:

- is the shell-local continuity, anchor, and freeze owner for one exact `GovernanceReviewPackage`
- must prove that package members and scope members resolve the same current `ActingScopeTuple`; package alignment without scope alignment is not sufficient for writable posture
- must also prove that `ChangeBaselineSnapshot.baselineTupleHash`, `ApprovalEvidenceBundle.approvalTupleHash`, `ReleaseWatchTuple.watchTupleHash`, the current `WaveGuardrailSnapshot`, and `GovernanceReviewPackage.reviewPackageHash` still point at the same immutable review unit; compilation alignment without baseline, watch, or package alignment is not sufficient for writable posture
- for `changeType = config | template | release_gate`, must be assembled from one immutable `ChangeBaselineSnapshot`, one `ConfigWorkspaceContext`, one `ConfigCompilationRecord`, one `ConfigSimulationEnvelope`, one `StandardsDependencyWatchlist`, one `CommunicationsGovernanceWorkspace`, one `CommunicationsSimulationEnvelope`, one `TemplatePolicyImpactDigest`, one `ContinuityControlImpactDigest`, one `ConfigDriftFence`, one `ChangeEnvelope`, one `ApprovalEvidenceBundle`, one `ReleasePublicationParityRecord`, one `MigrationExecutionBinding`, one `MigrationImpactPreview`, one `ReadPathCompatibilityDigest`, the current `projectionCompatibilityDigestRefs[]`, the current `ProjectionBackfillExecutionLedger` set, the current `MigrationCutoverCheckpoint`, and the latest applicable migration settlement plus observation window; adjacent panes may not mix package members from different freshness or settlement epochs
- when `opsHandoffContextRef` is present, it must also prove the operations-originated anomaly, briefing artifact, publication tuple, and `OpsReturnToken` still line up with the visible governance package before the shell may claim writable authority
- must keep `selectedDiffAnchorRef` and `selectedAnchorRef` stable across pane swaps, evidence drill-ins, and `mission_stack` fold or unfold while `packageVerificationState = verified`
- when `liveDeltaWindowRef.windowState != live`, `reviewFreshnessState` must degrade to `buffered_delta` or `revalidation_required`; the shell may summarize incoming change, but it may not patch the visible diff or approval context in place
- if the active `ConfigDriftFence.approvalInvalidationState != current`, or if `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, `reviewPackageHash`, `standardsWatchlistHash`, compilation tuple, approval bundle hash, simulation evidence, communications simulation evidence, standards watchlist posture, continuity impact, continuity evidence, route-readiness digest, projection compatibility digest, backfill ledger, cutover checkpoint, migration execution binding, migration observation posture, settlement truth, or `scopeTupleHash` drifts, `packageVerificationState` must become `stale | conflict | blocked` and every dependent CTA must freeze inside the same shell

### 1K. GovernanceDiffReviewWorkspace

Fields:

- `governanceDiffReviewWorkspaceId`
- `reviewContextRef`
- `governanceReviewPackageRef`
- `changeEnvelopeRef`
- `selectedDiffAnchorRef`
- `anchorLeaseRef`
- `diffMode = summary_first | side_by_side | inline`
- `filterSetRef`
- `collapsedSectionRefs[]`
- `liveDeltaWindowRef`
- `bufferedDeltaCount`
- `rebaseRequirementState = none | acknowledgement_required | revalidation_required`
- `reviewPackageHash`
- `workspaceState = no_diff | reviewing | settlement_pending | blocked`

Semantics:

- is the canonical diff and review surface for configuration, access, communications, and release mutation work
- must render one exact `GovernanceReviewPackage`; diff rows, counts, and compare anchors may not patch to a fresher package while impact, simulation, or approval still shows the older one
- must default to `summary_first`; `side_by_side` is reserved for explicit compare, blocker-heavy review, or pinned investigation, not for routine calm inspection
- must preserve `selectedDiffAnchorRef` through filter changes, right-rail swaps, export preview, settlement pending posture, and `mission_stack` fold or unfold
- when `liveDeltaWindowRef.windowState != live`, the workspace must freeze the compare canvas and surface a buffered-delta sheet with explicit rebase choice instead of silently rewriting visible lines
- `workspaceState = no_diff` is a valid steady state and must still show package verification time, baseline capture time, and the next safe governed action rather than a blank comparison pane

### 1A. GovernanceScopeToken

Fields:

- `governanceScopeTokenId`
- `staffIdentityContextRef`
- `actingContextRef`
- `actingScopeTupleRef`
- `tenantRef`
- `tenantRefs[]`
- `organisationRef`
- `organisationRefs[]`
- `scopeMode = tenant | organisation | multi_tenant | platform`
- `environmentRef`
- `policyPlane`
- `actingRoleRef`
- `purposeOfUseRef`
- `audienceTierRef`
- `elevationState`
- `requiredVisibilityCoverageRefs[]`
- `requiredRuntimeBindingRefs[]`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `scopeState = current | stale | blocked | superseded`
- `scopeTupleHash`
- `scopeChecksum`
- `issuedAt`
- `expiresAt`
- `revokedAt`

Semantics:

- is the authoritative scope contract for edit, approval, promotion, and compensating rollback
- is the governance-specialized serialization of the current `ActingScopeTuple`, not a second independent scope model
- must be reissued whenever tenant, organisation, environment, policy plane, acting role, purpose-of-use, or elevation state changes
- must also be reissued whenever the source `ActingScopeTuple`, required visibility coverage, runtime binding, or multi-tenant blast radius changes
- must be rendered in human-readable form and used as the machine-checkable fence for every consequential governance action

### 1B. ChangeBaselineSnapshot

Fields:

- `changeBaselineSnapshotId`
- `scopeTokenRef`
- `governingObjectRefs`
- `sourceBundleRef`
- `inheritanceLineageRefs`
- `projectionVersionRefs`
- `evidenceRefs`
- `releaseApprovalFreezeRef`
- `releasePublicationParityRef`
- `releaseWatchTupleRef`
- `waveGuardrailSnapshotRef`
- `continuityEvidenceRefs[]`
- `baselineTupleHash`
- `snapshotState = current | stale | superseded | blocked`
- `capturedAt`

Semantics:

- is the immutable live-state basis for diff, simulation, compile, approval, promotion, and rollback comparison
- `baselineTupleHash` must cover the exact scope token, governing object set, source bundle, inheritance lineage, projection versions, visible evidence, current release freeze, publication parity, watch tuple, guardrail snapshot, and continuity evidence used to define the reviewed baseline
- must remain stable for one review cycle; if the live basis changes materially, the shell must force a rebase rather than silently updating the reviewed draft

### 1C. GovernanceActionLease

Fields:

- `governanceActionLeaseId`
- `changeEnvelopeRef`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `scopeTokenRef`
- `actingScopeTupleRef`
- `scopeTupleHash`
- `approvalEvidenceBundleRef`
- `approvalTupleHash`
- `leaseType = edit | approve | promote`
- `holderRef`
- `issuedAt`
- `expiresAt`
- `supersededByRef`
- `leaseState`

Semantics:

- is required before a user may edit, approve, or promote a consequential governance draft
- prevents stale approval or promotion after another user has materially changed the same draft, baseline package, or scope
- becomes read-only immediately when the bound `ActingScopeTuple` or `GovernanceScopeToken` is superseded by organisation switching, purpose-of-use change, elevation expiry, or blast-radius drift
- may degrade to read-only review while preserving shell continuity if the lease expires

### 2. ScopeRibbon

The `ScopeRibbon` requires seven corrections:

1. scope context is now version-bound to the active governance object instead of being a loose header
2. live, draft, and scheduled policy boundaries are now separated explicitly instead of overloading one `effectiveAt`
3. elevation context now carries expiry, approver, and assurance burden rather than a bare state chip
4. multi-tenant and platform-wide blast radius is now explicit instead of implied by route or role alone
5. stale or conflicting scope context now freezes mutation and approval paths until the ribbon is revalidated
6. review package freshness, release tuple parity, and buffered live-delta posture now surface in the ribbon itself instead of being split across distant cards
7. organisation switching, purpose-of-use drift, and multi-tenant blast-radius widening now surface in the ribbon before any downstream pane can remain writable

Fields:

- `tenantRef`
- `organisationRef`
- `staffIdentityContextRef`
- `actingContextRef`
- `actingScopeTupleRef`
- `environmentRef`
- `scopeMode = tenant | organisation | multi_tenant | platform`
- `scopeSnapshotVersionRef`
- `reviewContextRef`
- `changeEnvelopeRef`
- `baselineTupleHash`
- `bundleRef`
- `liveBundleRef`
- `draftBundleRef`
- `compilationTupleHash`
- `approvalTupleHash`
- `watchTupleHash`
- `policyPlane = access | routing | visibility | messaging | release | authority_link`
- `actingRoleRef`
- `purposeOfUseRef`
- `elevationState = none | eligible | requested | active | expiring`
- `elevationExpiresAt`
- `elevationApproverRef`
- `scopeTupleHash`
- `effectiveAt`
- `effectiveBoundaryState = live_now | scheduled | pending_compile | pending_promotion | promoted`
- `releasePublicationParityRef`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `visibilityTierSummary`
- `scopeVerificationState = verified | inherited | stale | conflict | blocked`
- `guardrailVisibilityState = calm | review_required | blocked`
- `liveDeltaState = none | buffered | rebase_required`
- `currentSettlementState = idle | pending | settled | recovery_only`
- `approvalInvalidationState = current | invalidated | regeneration_required`
- `dataSensitivitySummary`

Semantics:

- is always visible on governance mutation screens
- must answer six questions without opening another screen: who is acting, under which role, for which tenant or organisation, in which environment, on which policy plane, and whether elevated access is active
- must make draft-versus-live state unmistakable
- must warn when the user is viewing inherited state rather than a local override
- must bind to the active `ChangeEnvelope` or approval object through `scopeSnapshotVersionRef`; if tenant, organisation, environment, bundle, purpose context, or `scopeTupleHash` drifts underneath the user, `scopeVerificationState` becomes `stale` or `conflict`
- must show live bundle, proposed draft bundle, current `baselineTupleHash`, current `compilationTupleHash`, current `approvalTupleHash`, and scheduled `effectiveAt` boundary separately whenever the screen is preparing promotion or approval
- must show elevation expiry, approver, and purpose-of-use burden together so exceptional access is understandable without opening a second pane
- platform-wide or multi-tenant actions must render an explicit blast-radius summary using `scopeMode`, `affectedTenantCount`, and `affectedOrganisationCount`; route position alone is not enough
- when `scopeVerificationState != verified`, compile, approval, and promote controls must freeze and the ribbon must surface the revalidation path inside the same shell
- cross-shell evidence drawers or read-only side stages may not replace or hide the active `ScopeRibbon`; the same verified scope context must remain visible while the user inspects evidence or audit detail
- must render as four fixed groups in order: scope identity, acting context, package and tuple, then freeze and watch. Wide layouts should size those groups from the canonical grid and pane tokens in `design-token-foundation.md`, and narrow layouts must stack the same groups without horizontal-only scrolling
- hashes, bundle IDs, tuple digests, and timestamps inside the ribbon must use tabular or monospace figures while actor, tenant, and policy labels remain plain-language text. Verification data may differentiate itself typographically, but machine IDs may not become the visual headline
- success styling is legal only when `scopeVerificationState = verified`, tuple parity is exact, runtime publication remains published, and no freeze or buffered-delta posture is active; informational, review, and blocked states must remain distinct without relying on color alone

### 3. TenantConfigMatrix

Fields:

- `matrixId`
- `tenantRefs[]`
- `environmentRefs[]`
- `policyDomainRefs[]`
- `cellState = inherited | overridden | draft_changed | pending_approval | compile_blocked | promoted`
- `effectiveBundleRefs[]`
- `standardsDependencyWatchlistRef`
- `blockingFindingRefs[]`
- `advisoryFindingRefs[]`
- `watchlistGateState = pass | review_required | blocked`
- `simulationState`
- `selectedCellRef`

Semantics:

- is the primary overview for tenant-by-domain configuration
- must default to live state with a clear draft toggle, never the reverse
- must expose inheritance lineage per cell so operators can see whether a value comes from platform default, organisation policy, tenant override, or pending draft
- the visible hygiene posture for each cell must come from the current `StandardsDependencyWatchlist`; passive dependency badges or stale warning counts are not sufficient evidence for compile or promotion
- editing a cell must open a bounded detail stage that keeps the live value and inherited chain visible alongside the proposed change
- matrix coloring may support scanning, but every state must also be text-labelled and keyboard navigable

### 4. AuthorityMap

Fields:

- `authorityMapId`
- `linkRefs[]`
- `sourceOrganisationRef`
- `targetOrganisationRef`
- `affectedScopeTupleRefs[]`
- `crossOrganisationVisibilityEnvelopeRefs[]`
- `linkType = delegation | coverage | support_admin | directory_override | managed_service`
- `policyScopeRefs[]`
- `precedenceOrder`
- `effectiveFrom`
- `effectiveTo`
- `approvalState`
- `conflictRefs[]`
- `dependentGrantRefs[]`

Semantics:

- must render as a sortable list or table first, with an optional graph lens for relationship discovery
- must make source, target, link type, scope, provenance, dates, and approval state visible in one scan line
- must surface overlap, precedence, orphaning, and circular-governance conflicts before save, not after promotion
- unlink or supersede flows must show downstream grants, queues, and visibility rules that would be affected

### 5. RoleScopeStudio

Fields:

- `roleRef`
- `capabilityGroups[]`
- `attributeConstraints[]`
- `visibilityTierRefs[]`
- `tenantScopeRefs[]`
- `organisationScopeRefs[]`
- `purposeOfUseRefs[]`
- `sessionConstraintRefs[]`
- `breakGlassEligibilityState`
- `cloneFromRoleRef`

Semantics:

- is the authoring and review surface for RBAC plus ABAC policy
- must group permissions by operational domain such as intake, booking, messaging, hub, pharmacy, support, and governance rather than presenting one flat scope dump
- must show attribute constraints and visibility tiers beside capability grants so a reviewer can understand the real effective boundary
- cloning or editing a role must always produce a readable diff grouped by domain and risk level

### 6. EffectiveAccessPreview

Fields:

- `subjectRef = user | service_account | group | role`
- `tenantRef`
- `organisationRef`
- `staffIdentityContextRef`
- `actingContextRef`
- `actingScopeTupleRef`
- `scopeTupleHash`
- `policyPlaneRef`
- `objectTypeRef`
- `purposeOfUseRef`
- `elevationState`
- `decision = allow | deny | conditional`
- `decisionReasonRefs[]`
- `expiringGrantRefs[]`
- `visibilityImpactSummary`
- `breakGlassPolicyRef`
- `reviewBurdenState = none | attestation_required | peer_review_required | governance_review_required`
- `activeExceptionalAccessRef`
- `relatedAuditRefs[]`

Semantics:

- must be available on the same screen as any role, grant, or elevation change
- must answer the question "what can this subject do right now and why" without sending the admin to raw audit tables
- must answer that question for one exact current scope tuple; widening or narrowing inferred from ambient session state is invalid
- denied or conditional access must show the blocking rule, missing attribute, expired grant, or higher-assurance requirement explicitly
- must show audience widening, break-glass posture, expiry, and mandatory review burden before any exceptional-access decision can be committed

### 7. ChangeEnvelope

Fields:

- `changeEnvelopeId`
- `changeType = config | role | grant | authority_link | template | release_gate`
- `scopeTokenRef`
- `baselineSnapshotRef`
- `scopeRefs[]`
- `reasonCode`
- `riskLevel = low | medium | high | critical`
- `draftState = collecting | validating | awaiting_approval | approved | scheduled | promoted | superseded | cancelled`
- `baselineCausalTokenRef`
- `reviewContextRef`
- `baselineTupleHash`
- `governingObjectVersionRefs`
- `changeIntentHash`
- `mutationFenceEpoch`
- `bundleHash`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `configDriftFenceRef`
- `compiledPolicyBundleRef`
- `compilationTupleHash`
- `simulationEvidenceRef`
- `rollbackPlanRef`
- `approverRefs[]`
- `effectiveAt`
- `releaseApprovalFreezeRef`
- `approvalTupleHash`
- `releaseWatchTupleRef`
- `watchTupleHash`

Semantics:

- is the canonical unit of admin change
- must keep proposed values, live values, human-readable diff, compiled bundle identity, simulation results, and required approvals together in one object
- must survive route changes inside the same governance continuity key
- must never permit silent live mutation outside its draft and approval path
- must bind diff, compile, simulation, approval, and promotion to the same `baselineCausalTokenRef`, `baselineTupleHash`, `governingObjectVersionRefs`, `changeIntentHash`, `bundleHash`, `compilationTupleHash`, `approvalTupleHash`, `watchTupleHash`, and `mutationFenceEpoch`
- must invalidate approval readiness if `scopeTokenRef`, `baselineSnapshotRef`, `baselineTupleHash`, `bundleHash`, `approvalTupleHash`, or `compilationTupleHash` changes after reviewer acknowledgement
- must also invalidate approval or promotion readiness if the causal token, object-version set, or mutation fence changes after reviewer acknowledgement, even when the human-readable diff text appears unchanged

### 8. ImpactPreview

Fields:

- `reviewContextRef`
- `governanceReviewPackageRef`
- `configSimulationEnvelopeRef`
- `communicationsSimulationEnvelopeRef`
- `templatePolicyImpactDigestRef`
- `continuityControlImpactDigestRef`
- `impactedTenantCount`
- `impactedOrganisationCount`
- `impactedUserCount`
- `impactedRouteCount`
- `impactedObjectTypeRefs[]`
- `blastRadiusBand = local | scoped | multi_tenant | platform`
- `scopeRiskScore`
- `visibilityRiskScore`
- `continuityRiskScore`
- `runtimeRiskScore`
- `reversibilityRiskScore`
- `aggregateRiskBand = low | medium | high | critical`
- `controlRiskRefs[]`
- `continuityControlImpactRefs[]`
- `breakingChangeRefs[]`
- `visibilityWideningState = none | narrowed | widened`
- `settlementDependencyRefs[]`
- `reviewPackageHash`
- `safeDefaultFallbackRefs[]`

Semantics:

- must describe impact in operator language, not only JSON or policy syntax
- must foreground breakage, scope widening, visibility widening, approval changes, continuity risk, and user lockout risk
- must be derived from the same `GovernanceReviewPackage` and `GovernanceReviewContext` as diff, config simulation, communications simulation, and approval; impact may not be recomputed against a fresher or broader package while the user is still reviewing the current one
- `aggregateRiskBand` must be computed from the weighted vector `(3 × scopeRiskScore) + (3 × visibilityRiskScore) + (4 × continuityRiskScore) + (2 × runtimeRiskScore) + (2 × reversibilityRiskScore)`; any widened visibility or missing safe rollback floor raises the band to at least `high`, and blocked continuity or runtime publication floors it at `critical`
- must provide drill-ins to the exact tenants, roles, users, routes, templates, or continuity controls affected

### 8A. StandardsDependencyWatchlist

Fields:

- `reviewContextRef`
- `governanceReviewPackageRef`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `candidateBundleHash`
- `liveBundleHash`
- `standardsBaselineMapRef`
- `dependencyLifecycleRecordRefs[]`
- `legacyReferenceFindingRefs[]`
- `policyCompatibilityAlertRefs[]`
- `standardsExceptionRecordRefs[]`
- `affectedRouteFamilyRefs[]`
- `affectedTenantScopeRefs[]`
- `affectedSurfaceSchemaRefs[]`
- `affectedLiveChannelRefs[]`
- `affectedSimulationRefs[]`
- `compileGateState = pass | review_required | blocked`
- `promotionGateState = pass | review_required | blocked`
- `watchlistState = current | stale | superseded | blocked`
- `watchlistHash`

Semantics:

- is the single candidate-bound hygiene surface for standards baselines, dependency lifecycle posture, legacy references, compatibility alerts, and approved exceptions
- must keep owner, replacement path, remediation deadline, tenant scope, live-channel blast radius, and linked route or simulation refs visible for every finding; passive “upgrade later” notes are forbidden
- must be derived from the same `GovernanceReviewPackage` and exact `candidateBundleHash` as diff, simulation, approval, and release freeze; the watchlist may not silently evaluate a fresher or different candidate while the current package remains open
- `compileGateState` and `promotionGateState` must be the only visible hygiene verdicts consumed by config, approval, and release lanes; a blocked finding may not appear as advisory in one lane and gating in another
- approved `StandardsExceptionRecord` rows must remain visible in-line with expiry, approver, and linked findings, and expiry or revocation must immediately degrade the watchlist to `stale | blocked` instead of waiting for manual refresh

### 9. ApprovalStepper

Fields:

- `reviewContextRef`
- `governanceReviewPackageRef`
- `standardsDependencyWatchlistRef`
- `compileState`
- `simulationState`
- `peerReviewState`
- `securityReviewState`
- `complianceReviewState`
- `releaseGateState`
- `promotionState`
- `postPromotionWatchState`
- `approvalBundleRef`
- `requiredSignerMatrixRef`
- `actionLeaseRef`
- `freezeTupleState`
- `baselineTupleState = exact | stale | missing | blocked`
- `compilationTupleState = exact | stale | missing | blocked`
- `approvalTupleState = exact | stale | missing | blocked`
- `watchTupleState = exact | stale | missing | blocked`
- `packageVerificationState`
- `reviewPackageHash`
- `standardsGateState = pass | review_required | blocked`
- `standardsWatchlistHash`
- `decisionPosture = ready | review_required | frozen | blocked`
- `approvalInvalidationState = current | invalidated | regeneration_required`
- `compatibilityEvidenceState`
- `assuranceTrustState`
- `settlementState = idle | pending | settled | recovery_only`
- `watchReadinessState = ready | attestation_required | blocked`

Semantics:

- is the visible state machine for high-risk governance change
- must make missing evidence or incomplete approval lanes obvious before the promote action becomes available
- must allow approvers to inspect the same diff, impact preview, and evidence the editor saw
- every lane must resolve the same `reviewContextRef`, `governanceReviewPackageRef`, `reviewPackageHash`, `standardsDependencyWatchlistRef`, `standardsWatchlistHash`, `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, `compilationTupleHash`, tuple parity verdict, and current settlement lineage; a lane may not remain visually complete if any of those inputs have drifted
- must show when approvals are stale because the approval bundle, action lease, or review context has been superseded
- `decisionPosture = ready` is legal only while `baselineTupleState = exact`, `compilationTupleState = exact`, `approvalTupleState = exact`, `watchTupleState = exact`, `approvalInvalidationState = current`, `standardsGateState != blocked`, and `GovernanceReviewPackage.packageState = current`
- may use quiet outline or pending posture for local acknowledgement, but solid success styling is legal only after authoritative settlement or fresher projection truth confirms the reviewed lane still belongs to the current package

### 9A. ApprovalEvidenceBundle

Fields:

- `approvalEvidenceBundleId`
- `changeEnvelopeRef`
- `reviewContextRef`
- `governanceReviewPackageRef`
- `standardsDependencyWatchlistRef`
- `scopeTokenRef`
- `actingScopeTupleRef`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `humanReadableDiffRef`
- `impactPreviewRef`
- `simulationEvidenceRef`
- `compileResultRef`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `communicationsSimulationEnvelopeRef`
- `templatePolicyImpactDigestRef`
- `continuityControlImpactDigestRef`
- `configDriftFenceRef`
- `compiledPolicyBundleRef`
- `requiredApprovalRefs`
- `changeIntentHash`
- `bundleHash`
- `compilationTupleHash`
- `scopeTupleHash`
- `assembledAt`
- `releaseApprovalFreezeRef`
- `channelManifestSetRef`
- `minimumBridgeCapabilitySetRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `compatibilityEvidenceRef`
- `requiredAssuranceSliceRefs[]`
- `releaseWatchTupleRef`
- `waveGuardrailSnapshotRef`
- `waveObservationPolicyRef`
- `watchTupleHash`
- `recoveryDispositionRefs[]`
- `runtimePublicationRef`
- `releasePublicationParityRef`
- `governanceContinuityEvidenceBundleRef`
- `reviewPackageHash`
- `standardsWatchlistHash`
- `approvalTupleHash`

Semantics:

- is the exact approval package every approver must inspect
- `approvalTupleHash` must be derived from at least `scopeTupleHash`, `baselineTupleHash`, `changeIntentHash`, `bundleHash`, `compilationTupleHash`, `reviewPackageHash`, `standardsWatchlistHash`, `releaseApprovalFreezeRef`, `releaseWatchTupleRef`, `waveGuardrailSnapshotRef`, `waveObservationPolicyRef`, `runtimePublicationRef`, `releasePublicationParityRef`, `recoveryDispositionRefs[]`, and the current continuity evidence bundle
- must be hash-stable for the approval cycle; changing the diff, impact, `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `CommunicationsSimulationEnvelope`, `StandardsDependencyWatchlist`, continuity impact, compile result, route-contract publication, `baselineTupleHash`, `compilationTupleHash`, `scopeTupleHash`, `watchTupleHash`, `reviewPackageHash`, `standardsWatchlistHash`, or any frozen release tuple member invalidates outstanding approvals and requires bundle regeneration

### 9B. ReleaseFreezeTupleCard

Fields:

- `reviewContextRef`
- `governanceReviewPackageRef`
- `standardsDependencyWatchlistRef`
- `releaseApprovalFreezeRef`
- `releaseCandidateRef`
- `baselineTupleHash`
- `approvalTupleHash`
- `configCompilationRecordRef`
- `configSimulationEnvelopeRef`
- `communicationsSimulationEnvelopeRef`
- `templatePolicyImpactDigestRef`
- `continuityControlImpactDigestRef`
- `configDriftFenceRef`
- `compiledPolicyBundleRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `compatibilityEvidenceRef`
- `migrationExecutionBindingRef`
- `migrationImpactPreviewRef`
- `readPathCompatibilityDigestRef`
- `projectionCompatibilityDigestRefs[]`
- `backfillExecutionLedgerRefs[]`
- `migrationCutoverCheckpointRef`
- `migrationActionSettlementRef`
- `migrationObservationWindowRef`
- `channelManifestSetRef`
- `minimumBridgeCapabilitySetRef`
- `affectedAssuranceSliceRefs[]`
- `tenantScopeMode`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `tenantScopeTupleHash`
- `watchTupleHash`
- `reviewPackageHash`
- `standardsWatchlistHash`
- `guardrailSnapshotRef`
- `releasePublicationParityRef`
- `releaseWatchTupleRef`
- `activeChannelFreezeRefs[]`
- `waveObservationPolicyRef`
- `recoveryDispositionRefs[]`
- `compilationTupleHash`
- `runtimePublicationState = published | stale | missing | conflict`
- `publicationParityState = exact | stale | missing | conflict | withdrawn`
- `readPathDigestState = exact | constrained | blocked`
- `cutoverReadinessState = not_ready | ready | blocked`
- `guardrailVisibilityState = calm | review_required | blocked`
- `tupleVerificationState = verified | stale | conflict | blocked`
- `watchReadinessState = ready | constrained | blocked`
- `approvedAt`
- `lastVerifiedAt`
- `staleReasonRefs[]`

Semantics:

- is the visible approval anchor for `/ops/config/promotions` and `/ops/release`
- must show the exact immutable tuple the approver is authorizing, including route-contract publication and recovery posture, not a summary that can drift after review
- must stay visible beside diff, simulation, and rollout wave data while the user is approving or promoting
- must also prove that the visible tuple is still the tuple belonging to the current `GovernanceReviewPackage`; release-freeze verification may not silently advance after a package supersession
- must also surface the current `StandardsDependencyWatchlist` and its blocking or excepted findings beside compile and publication posture; standards drift may not hide behind a generic “static checks passed” label
- must render tuple groups in fixed order: config compilation and bundle, behavior and schema, migration and backfill, channel and bridge, publication and recovery, then guardrail and watch. Tuple digests should remain scannable in tabular form, with plain-language labels explaining why any member is constrained or blocked
- must render `MigrationImpactPreview` beside migration and backfill tuple members so the reviewer can see the exact affected route families and declared surface posture before approving, promoting, or cutting over
- `tupleVerificationState = verified` is legal only while `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, `reviewPackageHash`, `standardsWatchlistHash`, and `publicationParityState = exact`, runtime publication remains `published`, the bound `ConfigSimulationEnvelope` still matches `compiledPolicyBundleRef` and `compilationTupleHash`, the bound `CommunicationsSimulationEnvelope`, standards watchlist, and continuity-impact inputs still match the same review package, the bound `ConfigDriftFence.approvalInvalidationState = current`, the bound `MigrationExecutionBinding` is current, the bound `ReadPathCompatibilityDigest` and `projectionCompatibilityDigestRefs[]` are current, the latest migration settlement is not pending observation or rollback-required, and any constrained backfill or cutover posture is explicitly attached to the visible tuple rather than deferred to a hidden operator note
- if any member of the tuple, any required assurance slice trust state, or the runtime publication posture drifts, the same shell must remain open in read-only recovery posture with a revalidate path

### 10. ComplianceLedgerPanel

Fields:

- `controlRef`
- `controlFamily`
- `status = satisfied | warning | missing | exception | expired`
- `ownerRef`
- `evidenceAge`
- `artifactRefs[]`
- `exceptionRef`
- `nextReviewAt`

Semantics:

- is the audit-friendly control view for compliance and operational governance
- must support control-by-control inspection without forcing the user into a separate BI workflow
- every warning, missing, or exception state must deep-link to the relevant evidence, change envelope, audit trail, or attestation task

## Navigation model and default layout

The left navigation should group work by governance intent, not by technical subsystem names alone:

- Posture
- Tenants
- Authority links
- Access and elevation
- Communications governance
- Compliance and evidence
- Policy bundles and promotions
- Release governance

The default page composition should be:

- left navigation for route family and saved views
- center pane for the dominant task or matrix
- right rail for impact preview, standards watchlist, evidence, simulation, or approvals

The right rail should never start with multiple competing panels expanded. The shell must promote only the single most relevant support region for the active governance task.
The shell must also keep one shared status strip beneath `ScopeRibbon` for draft save, compile, publication, pending-settlement, and recovery posture; local controls may acknowledge inline, but they may not compete with their own full-width banners.

## Governance visual control grammar

The governance shell must present mutation risk as structured review work, not as dashboard noise.

Rules:

- desktop composition should use the canonical grid and pane tokens from `design-token-foundation.md`, keeping left navigation on the shared rail widths, the primary work region dominant, and the support rail on the shared support-pane widths; `three_plane` is reserved for pinned compare, evidence-heavy approval, or explicit watch investigation
- spacing must resolve through the canonical 4, 8, 12, 16, 24 ramp. `ScopeRibbon` groups and tuple cards should use the shared compact governance rhythm so dense metadata remains scannable without collapsing into walls of chips
- `ScopeRibbon` plus the shared status strip remain the only sticky shell header stack. Secondary banners, duplicate warning bars, or route-local success strips are forbidden
- labels for tenant, organisation, actor, policy plane, approval lane, and dominant action remain plain-language sans-serif text; hashes, digests, timestamps, and tuple IDs use tabular or monospace figures and never become the visual headline
- semantic color use is constrained: neutral for read-only context, informative for simulation or evidence pending, amber for review or revalidation, red for blocked or frozen posture, and green only for fully verified, published, unfrozen runtime truth. Local submission acknowledgement and pending observation may not use final-success green
- motion must use anchored `reveal` or `morph` cues from the changed row, diff anchor, or tuple section, using the shared motion tokens from `design-token-foundation.md`; shell-wide slide, success wipe, auto-scroll flourish, or stacked celebratory motion is forbidden
- live freshness, tuple parity, and settlement drift must first change label, iconography, and CTA posture, then color; trust and freshness are semantic states, not decorative tones

## Responsive and narrow-screen contract

Governance shells are desktop-first, but responsive minimums must preserve the same shell continuity rather than degrading into hidden tables, detached dialogs, or horizontal-scroll-only workflows.

Rules:

- narrow layouts must use `mission_stack` inside the same shell, with `ScopeRibbon` remaining visible as a summary header
- the default expanded region must stay the dominant task, such as the active matrix row, diff, approval stepper, or watch window; the right rail becomes a single folded support region chosen by attention budget
- matrix-heavy screens must collapse into a row-first inspector so inherited, live, and proposed values remain visible together without relying on horizontal scroll as the only access path
- `ChangeEnvelope`, `ReleaseFreezeTupleCard`, and the current approval or promote posture must remain visible as stacked anchors while the user is reviewing high-risk change
- narrow layouts may summarize secondary evidence, simulation, or impact detail, but they may not hide scope, risk tier, compile or publication state, active freeze posture, or rollback path
- fold and unfold must preserve the selected row, scroll position, active right-rail region, and current decision target

## Screen contracts

### Governance landing: `/ops/governance`

This is the control posture page, not a vanity dashboard.

It should show:

- pending approvals by risk tier
- compile or simulation failures blocking promotion
- expiring grants, access reviews, and authority links
- compliance controls with missing or stale evidence
- recent production promotions and rollback watch windows
- tenant drift and environment drift summaries

Critical cards must open directly into the relevant `ChangeEnvelope`, `AuthorityMap`, `RoleScopeStudio`, or `ComplianceLedgerPanel` without losing shell context.

If there are no pending approvals, drift items, failures, or expiring grants above the quiet threshold, the landing surface must render one quiet-control state that explains why the console is calm, what normally appears here, and the fastest safe next action such as reviewing recent promotions or inspecting tenant posture. Do not backfill the state with vanity charts, duplicated metrics, or second-order trend wallpaper.

### Tenant configuration matrix: `/ops/governance/tenants` and `/ops/config/tenants`

This is the main screen for tenant-by-domain governance.

Rules:

1. start in live-state view with environment and tenant selectors pinned in `ScopeRibbon`
2. expose matrix rows by policy domain and optional subdomain, not by raw key-value store order
3. keep inherited value, current live value, and proposed draft value visible together when editing
4. require a reason code for any override that narrows or widens visibility, routing, messaging, or release behavior
5. block promotion when simulation or compile checks fail and land the user on the failing cells first
6. on narrow layouts, collapse the matrix into a row-first inspector so inherited, live, and draft values stay visible together without forcing lateral scroll as the only comprehension path

### Authority-link management: `/ops/governance/authority-links`

This is the authoritative UI for cross-organisation delegation and coverage relationships.

Rules:

1. default to the table view with filters for source, target, link type, and state
2. allow an optional graph or map lens for discovery, but never as the only interaction mode
3. creating or editing a link must show precedence, overlap, and orphan-risk checks before save
4. retiring a link must preview dependent grants, memberships, directory paths, and tenant views that would change
5. high-risk link changes must require approval before they become effective

### Access and role studio: `/ops/access`, `/ops/access/users`, and `/ops/access/roles`

This is where security policy becomes administratively understandable.

Rules:

1. express every access change through the grammar of subject, capability, scope, condition, expiry, and evidence
2. group capabilities by operational domain and risk instead of alphabetic permission strings
3. pair role editing with `EffectiveAccessPreview` on the same screen
4. show inherited grants, temporary grants, and break-glass eligibility as separate chips with different expiry semantics
5. deactivation, grant removal, and scope narrowing must preview lockout, orphaned ownership, and approval impacts before commit
6. role, grant, and deactivation review must keep one `GovernanceReviewContext`, one `EffectiveAccessPreview`, and one impact digest visible together so reviewers can see the exact package, blast radius, and settlement posture they are approving

### Elevation and access review: `/ops/access/reviews` and `/ops/access/elevation`

This is the exceptional-access surface.

Rules:

1. break-glass, just-in-time elevation, and periodic recertification must be separate workflows with separate evidence burdens
2. every exceptional access request must show reason code, duration, requesting context, affected scope, and prior usage history
3. reviewers must be able to approve, narrow, or deny without leaving the current shell
4. active elevation must remain visible in `ScopeRibbon` until expiry or revocation
5. break-glass review must show the exact visibility widening, object classes, expiry boundary, mandatory follow-up review burden, the governing `InvestigationScopeEnvelope.scopeHash`, and the bound `InvestigationTimelineReconstruction.timelineHash` before approval can settle
6. break-glass review may search or summarize through `AccessEventIndex`, but approval, narrowing, denial, follow-up, and export posture must resolve from the current `BreakGlassReviewRecord`, `InvestigationScopeEnvelope`, `InvestigationTimelineReconstruction`, and `DataSubjectTrace`; raw audit rows are not authoritative governance review
7. an exceptional-access decision may not remain `approved` if the linked `GovernanceActionLease`, break-glass policy, expiry posture, investigation scope, or deterministic timeline posture has drifted; the same shell must switch to revalidation or revocation review
8. the subject summary, affected scope, expiry boundary, and current settlement posture must remain pinned while a reviewer narrows, revokes, or compensates an elevation decision; switching tabs or drawers may not orphan the decision context

### Communications governance: `/ops/comms` and `/ops/comms/templates`

This is the policy-aware communications control room.

Rules:

1. template editing must always show channel, audience, fallback, suppression, and tenant scope together
2. preview must be matrix-based by tenant, channel, journey state, and quiet-hours policy
3. content diff, approval, and promotion should reuse the same `ChangeEnvelope` and `ApprovalStepper` pattern as config changes
4. template suppression, quiet-hours, fallback, localization coverage, and tenant exemptions must appear as first-class diff rows and impact drill-ins inside the same `GovernanceReviewContext`; hidden fallback branches are forbidden
5. preview must separate live, draft, and scheduled send posture and must show any active channel freeze, publication drift, or recovery disposition beside the edited template set
6. template approval or promotion may not appear settled until `GovernanceActionSettlement` confirms the same reviewed package, tuple, and runtime publication posture still hold

### Compliance and evidence: `/ops/governance/compliance`

This is the operational compliance surface for auditors and governance leads.

Rules:

1. controls must render as a list with status, owner, last attestation, evidence age, and exception state
2. evidence drill-ins must open in a side stage or right rail, not in a shell-breaking tab maze
3. pack generation should start from visible controls and evidence links, not a separate export-only workflow
4. exceptions must carry owner, expiry, mitigation, and linked approvals
5. controls that can change patient-home actionability, record-follow-up recovery, more-info reply posture, thread-settlement posture, support replay restore, intake resume, booking manage posture, hub booking-manage posture, assistive-session continuity, workspace task completion, or pharmacy-console settlement must surface one `GovernanceContinuityEvidenceBundle` with linked `ExperienceContinuityControlEvidence`, validation state, and the exact release or approval object that would be affected
6. evidence bundles, pack previews, certificates, and exported control packs must resolve through one `ArtifactStage` backed by `GovernanceEvidencePackArtifact` plus the applicable `ArtifactPresentationContract`; print, export, and external handoff remain explicit secondary actions with deterministic return to the same control list and selected exception
7. the same surface must also render one `CrossPhaseConformanceScorecard` over `PhaseConformanceRow` rows whenever a release, approval, or BAU sign-off claims a phase or cross-phase control family is complete; governance may not sign off a greener planning statement than the canonical contracts, runtime tuple, ops proof, and Phase 9 end-state proof currently allow

High-priority evidence-delivery defects in this slice:

1. evidence drill-in, pack preview, export, and print are described as capabilities, but not yet bound to one artifact surface context and transfer settlement
2. watch-window, baseline, or scope drift can still leave a generated pack detached from the exact tuple being reviewed
3. external browser, overlay, or print handoff does not yet require a governed return to the same scope ribbon, selected control row, and watch lineage
4. operator reassurance can still collapse local export acknowledgement into final pack availability
5. automation and screen-reader semantics for evidence artifacts are not yet explicit enough for high-risk release review

`GovernanceContinuityEvidenceBundle` should carry:

- `governanceContinuityEvidenceBundleId`
- `governanceReviewPackageRef`
- `scopeTokenRef`
- `changeEnvelopeRef`
- `continuityControlImpactDigestRef`
- `assuranceEvidenceGraphSnapshotRef`
- `assuranceGraphCompletenessVerdictRef`
- `graphHash`
- `affectedContinuityControlCodes[]`
- `affectedRouteFamilyRefs[]`
- `experienceContinuityEvidenceRefs[]`
- `supportingAssuranceSliceRefs[]`
- `supportingAuditRefs[]`
- `supportingRuntimePublicationRefs[]`
- `supportingRecoveryDispositionRefs[]`
- `validationState = complete | stale | missing | blocked`
- `requiredAttestationRefs[]`
- `reviewPackageHash`
- `generatedAt`

**GovernanceEvidencePackArtifact**
`governanceEvidencePackArtifactId`, `governanceEvidenceArtifactRef`, `scopeTokenRef`, `changeEnvelopeRef`, `releaseWatchEvidenceCockpitRef`, `watchEvidenceCockpitHash`, `governanceContinuityEvidenceBundleRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `artifactPresentationContractRef`, `artifactSurfaceContextRef`, `artifactSurfaceFrameRef`, `artifactModeTruthProjectionRef`, `artifactParityDigestRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `redactionPolicyRef`, `summaryProjectionRef`, `sourceArtifactRefs[]`, `artifactState = summary_only | governed_preview | export_ready | handoff_ready | recovery_only`, `generatedAt`

`GovernanceEvidencePackArtifact` specializes `GovernanceEvidenceArtifact` for compliance packs, approval bundles, and promotion-watch reports. Inline summary is primary; governed preview, print, export, and cross-app handoff are secondary and must remain scoped, redacted, return-safe, and consistent with the current `ArtifactSurfaceFrame`, `ArtifactModeTruthProjection`, `ArtifactTransferSettlement`, and `ArtifactFallbackDisposition`.

**GovernanceEvidencePackTransfer**
`governanceEvidencePackTransferId`, `evidenceArtifactRef`, `artifactTransferSettlementRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `generationState = preparing | ready | stale | blocked`, `returnIntentTokenRef`, `scopeTokenRef`, `selectedAnchorRef`, `watchTupleHashRef`, `transferState = inline | handoff_pending | returned | recovery_only`

`GovernanceEvidencePackTransfer` keeps generation and handoff truthful. Local pack-generation acknowledgement, browser download start, or print dialog launch is never the final availability state on its own.

Additional rules:

- compliance packs and reports must start from visible controls, evidence links, and inline summaries; export-only dead ends and raw document URLs are not valid governance UX
- evidence drill-ins and pack preview must open summary-first inside the same shell, using the existing side stage, right rail, or bounded secondary plane before export is offered
- any print, export, overlay, or browser handoff must use `ArtifactPresentationContract`, `ArtifactSurfaceContext`, `ArtifactModeTruthProjection`, `ArtifactTransferSettlement`, and `OutboundNavigationGrant` bound to the current scope token, redaction policy, return intent, and watch tuple where applicable
- the selected control row, evidence tab, and watch window must remain visible through `selectedAnchorRef` and `returnIntentTokenRef` before departure, during pending transfer, and on return
- the shell may show local export acknowledgement, but pack readiness, external availability, and successful return must follow `ArtifactTransferSettlement.authoritativeTransferState` rather than a toast or optimistic button state
- preview, print, export, or browser-handoff posture may remain live only while the current `ArtifactModeTruthProjection` still confirms the same `graphHash`, redaction policy, masking posture, and return-safe tuple; stale browser or PDF state may not outrun that projection
- generated packs, release-watch evidence, and continuity bundles must reflect the same baseline snapshot, approval bundle, runtime publication refs, recovery dispositions, release tuple, current `ReleaseWatchEvidenceCockpit`, and current assurance-evidence graph visible in the shell; stale or conflicting proof downgrades the artifact to `recovery_only`
- `GovernanceContinuityEvidenceBundle` must also remain attached to the same `GovernanceReviewPackage` and `reviewPackageHash` as the visible diff, impact, simulation, approval stepper, and release tuple card; continuity proof may not lag or outrun the package it is being used to justify
- stale scope, missing publication, or blocked redaction must freeze handoff and keep the inline summary open with bounded recovery through `ArtifactFallbackDisposition` instead of detaching the operator into a failed export path
- print, export, sign-off, and handoff controls may arm only while the bound `AssuranceGraphCompletenessVerdict.verdictState = complete` and the visible `graphHash`, continuity bundle, redaction policy, and watch tuple still match the current review scope

### Records lifecycle governance: `/ops/governance/records`, `/ops/governance/records/holds`, and `/ops/governance/records/disposition`

This is the restricted records-governance surface for retention class review, legal hold, freeze lineage, archive posture, and delete approval.

Rules:

1. every reviewed row must show one current `RetentionLifecycleBinding`, one current `RetentionDecision`, any active `RetentionFreezeRecord`, any active `LegalHoldRecord`, and the current `DispositionEligibilityAssessment` together; lifecycle truth may not be reconstructed from storage metadata or batch logs
2. hold placement, hold widening, hold release, and freeze-linked preservation review must stay in the same shell with the current `LegalHoldScopeManifest.scopeHash`, `RetentionFreezeRecord.freezeScopeHash`, selected artifact or scope anchor, and any blocking dependency summary pinned in place
3. `DispositionJob` queues must be assembled from current `DispositionEligibilityAssessment` rows only; preview, approval, and execution posture may not imply that a raw batch candidate is safe to archive or delete
4. WORM, hash-chained, and replay-critical artifacts must appear as preserved or archive-only posture with explicit dependency or immutability explainers; they may never render a live delete-ready control
5. deletion certificates, archive manifests, hold notices, and blocked-disposition explainers must open summary-first in the current shell through one `ArtifactStage` backed by `GovernanceEvidenceArtifact` plus the applicable `ArtifactPresentationContract`; print, export, and external handoff remain secondary actions with deterministic return to the same lifecycle row and scope ribbon
6. releasing a hold or freeze may not restore delete-ready posture until a superseding `DispositionEligibilityAssessment` proves the same lifecycle binding, dependency graph, and assurance-evidence graph still allow disposition
7. if hold scope, freeze lineage, dependency posture, graph completeness, redaction policy, or selected anchor drifts while the operator is reviewing a lifecycle decision, the same shell must freeze action controls in place and require revalidation instead of quietly refreshing the queue

### Policy bundles and release gate: `/ops/config/bundles`, `/ops/config/promotions`, and `/ops/release`

This is where draft governance becomes live system behavior.

Rules:

1. show compile status, policy diff, simulation evidence, the current `StandardsDependencyWatchlist`, `ReleaseFreezeTupleCard`, route-contract publication state, `MigrationExecutionBinding`, `ReadPathCompatibilityDigest`, `projectionCompatibilityDigestRefs[]`, `ProjectionBackfillExecutionLedger`, `MigrationCutoverCheckpoint`, latest migration settlement or observation posture, guardrail snapshot, current `ReleaseWatchTuple`, and rollout wave on one continuous screen
2. the promote action must remain unavailable until compile, simulation, the current standards watchlist, required approvals, frozen release-tuple verification, machine-readable runtime publication, current route-readiness and backfill ledgers, any required cutover checkpoint, current migration execution binding, any in-scope migration action settlement has already converged, any required degraded-slice attestation, and any required `GovernanceContinuityEvidenceBundle` validation are complete
3. post-promotion watch state must remain attached to the same shell with evidence of drift, failures, channel freezes, recovery dispositions, or rollback need
4. rollback should be represented as a compensating change or governed wave action, never as a silent hidden button that bypasses audit
5. widen, pause, resume, rollback, kill-switch, or rollforward controls may not advance visually until the linked `WaveActionSettlement`, `WaveActionObservationWindow`, and watch-tuple state are authoritative in the same shell

Promotion watch reports, rollback packs, and release handoff bundles are also `GovernanceEvidencePackArtifact` surfaces. They must open summary-first in the current shell, and print, export, or cross-app handoff may proceed only through the same scoped artifact plus the current `OutboundNavigationGrant` posture. Local export acknowledgement remains provisional until the linked `ArtifactTransferSettlement` confirms availability, return, or recovery.

The release gate must also show whether the promoted tuple changes `intake_resume`, `booking_manage`, `assistive_session`, `workspace_task_completion`, or `pharmacy_console_settlement` continuity controls. If any of those controls are in scope, the watch window must carry the matching evidence bundle and fail closed on stale or conflicting continuity proof even when the broader rollout guardrail remains green.

If the promoted tuple remains in dual-read, partial-backfill, or constrained compatibility posture, the same release surface must list the exact route families that are `live`, `summary_only`, `recovery_only`, or `blocked`. A generic “migration running” badge is not enough.

If the promoted tuple still carries standards exceptions, deprecated dependencies, legacy references, or compatibility alerts, the same release surface must show the exact owner, replacement path, remediation deadline, affected routes, and exception expiry from the current `StandardsDependencyWatchlist`. A generic hygiene badge is not enough.

If a migration or backfill action is merely accepted but not yet observed as converged, the same surface must stay in settlement-pending posture and show the exact migration action lineage, observation window, and affected route posture. Local job-start acknowledgement is not a release truth source.

`PromotionWatchWindow` should carry:

- `promotionWatchWindowId`
- `reviewContextRef`
- `changeEnvelopeRef`
- `scopeTokenRef`
- `approvalEvidenceBundleRef`
- `standardsDependencyWatchlistRef`
- `promotionIntentRef`
- `promotedBundleRef`
- `candidateBundleHash`
- `liveBundleHash`
- `baselineTupleHash`
- `approvalTupleHash`
- `standardsWatchlistHash`
- `releaseApprovalFreezeRef`
- `releaseWatchTupleRef`
- `releaseWatchEvidenceCockpitRef`
- `watchTupleHash`
- `watchEvidenceCockpitHash`
- `migrationExecutionBindingRef`
- `waveEligibilitySnapshotRef`
- `guardrailSnapshotRef`
- `waveObservationPolicyRef`
- `waveControlFenceRef`
- `guardrailPolicyRef`
- `killSwitchCapabilityRef`
- `routeContractSetRef`
- `readPathCompatibilityDigestRef`
- `projectionBackfillExecutionLedgerRefs[]`
- `migrationCutoverCheckpointRef`
- `migrationImpactPreviewRef`
- `migrationActionSettlementRef`
- `migrationObservationWindowRef`
- `continuityEvidenceBundleRef`
- `runtimePublicationRef`
- `releasePublicationParityRef`
- `activeChannelFreezeRefs[]`
- `recoveryDispositionRefs[]`
- `stabilizationCriteriaRef`
- `effectiveAt`
- `watchState = scheduled | active | stabilized | rollback_recommended | rolled_back`
- `guardrailState = green | constrained | frozen | rollback_review_required`
- `watchPublicationState = published | stale | missing | conflict`
- `publicationParityState = exact | stale | missing | conflict | withdrawn`
- `guardrailVisibilityState = calm | review_required | blocked`
- `continuityEvidenceState = complete | stale | missing | conflict`
- `standardsWatchState = current | stale | superseded | blocked`
- `readPathState = exact | constrained | blocked`
- `cutoverReadinessState = not_ready | ready | blocked`
- `activeWaveActionImpactPreviewRef`
- `activeWaveActionExecutionReceiptRef`
- `activeWaveActionLineageRef`
- `lastWaveActionSettlementRef`
- `lastWaveActionObservationWindowRef`
- `watchTupleState = active | stale | superseded | closed`
- `watchEvidenceCockpitState = active | stale | superseded | closed`
- `rollbackReadinessRef`
- `affectedAssuranceSliceTrustState`
- `degradedSliceAttestationRefs[]`
- `activeStandardsExceptionRefs[]`
- `driftEvidenceRefs`
- `openedAt`
- `closedAt`

Semantics:

- must remain hash-bound to the promoted release tuple so the watch window is proving the exact thing that was approved and promoted
- must remain bound to the same `baselineTupleHash` and `approvalTupleHash` the approver accepted so post-promotion watch cannot silently inherit a rebased review package
- must remain bound to the same `StandardsDependencyWatchlist`, `candidateBundleHash`, `liveBundleHash`, and `standardsWatchlistHash` the approver accepted so post-promotion watch cannot silently replace excepted or blocking hygiene posture after promotion
- must resolve the same published `ReleaseWatchTuple` consumed by runtime publication, operations handoff, and live wave settlement so post-promotion watch cannot be reconstructed from adjacent fields or a bare hash
- must resolve one exact `ReleaseWatchEvidenceCockpit` so previewed blast radius, control-plane acceptance, observed live convergence, current rollback target, rollback runbook posture, and generated watch packs remain on one machine-readable causality chain instead of adjacent cards
- must carry the same `releasePublicationParityRef` the release tuple card used at approval time so post-promotion watch cannot quietly compare a different publication or recovery surface than the one that was authorized
- must expose guardrail thresholds, kill-switch availability, and stabilization criteria on the same continuity path as rollout and rollback decisions
- must also expose the active `WaveGuardrailSnapshot`, route-contract publication posture, channel freezes, and recovery dispositions so operators can see the exact runtime constraint being applied
- must also expose the active standards exceptions, owners, replacement paths, remediation deadlines, affected routes, affected live channels, and affected simulations from the current `StandardsDependencyWatchlist`; a generic hygiene badge is not enough once a candidate is live
- must also expose the current route-scoped read-path compatibility digest, backfill convergence ledgers, lag budget posture, and migration cutover checkpoint so operators can see whether any audience surface is still riding summary-only, recovery-only, or rollback-only truth
- must also expose the current `MigrationExecutionBinding`, latest `MigrationActionSettlement`, and latest `MigrationActionObservationWindow` so operators can tell whether a migration step is merely accepted, actually converged, rollback-required, or stale
- must also expose the current `GovernanceContinuityEvidenceBundle` so watch and rollback review can prove how patient navigation, record follow-up, more-info reply, thread settlement, support replay, intake resume, booking manage posture, hub booking-manage posture, assistive-session continuity, workspace task completion, and pharmacy-console settlement behavior are actually behaving under the promoted tuple
- every widen, pause, resume, rollback, kill-switch, or rollforward decision must remain visibly bound to `releaseWatchEvidenceCockpitRef`, `activeWaveActionLineageRef`, and `lastWaveActionSettlementRef`; dashboards, metrics, or operator intent alone are not enough to mark the watch state advanced
- `watchState = stabilized` is legal only when `publicationParityState = exact`, `baselineTupleHash`, `approvalTupleHash`, and `standardsWatchlistHash` still match the promoted release package, `continuityEvidenceState = complete`, `standardsWatchState = current`, `readPathState = exact`, every linked `ProjectionBackfillExecutionLedger.coverageState = converged`, any in-scope migration settlement plus migration observation window have already converged, `guardrailState = green`, `watchTupleState = active`, `watchEvidenceCockpitState = active`, and the last applicable `WaveActionSettlement` plus `WaveActionObservationWindow` have already settled without pending observation
- must show degraded assurance slices and any required attestations explicitly before the shell can treat the release as stabilized
- if a later widening or resumed rollout step publishes a superseding `ReleaseWatchTuple`, the same watch window must stay open and show the lineage from the prior tuple to the current one rather than mutating the old tuple in place
- if watch evidence, cockpit hash, tuple hash, standards-watchlist posture, exception expiry, continuity evidence, route-readiness digest, backfill ledger, cutover checkpoint, guardrail state, or runtime publication posture drifts materially, the same shell must remain open in rollback or compensating-change posture instead of quietly downgrading into historical read-only status
- if migration settlement or observation posture drifts materially from the visible tuple, the same shell must remain open in bounded migration-recovery posture rather than treating cutover or backfill work as already complete

## Error-proofing rules

The governance shell must bias toward safe configuration under pressure.

Mandatory safeguards:

- no direct live edit in a matrix cell
- no hidden inherited value that only appears after save
- no destructive unlink, deactivation, or scope widening without an impact preview
- no production promotion without visible environment, tenant, and `effectiveAt` context
- no approval checkbox without access to the same diff, evidence, and simulation seen by the editor
- no exception record without owner, expiry, and mitigation
- no graph or heatmap without a filterable list or table fallback
- no role change without immediate effective-access preview
- no time-bound grant without displayed expiry and renewal posture
- no cross-tenant action without an explicit tenant or platform-level scope badge
- no exceptional-access approval without visible visibility widening, expiry, and follow-up review burden
- no release stabilization claim without visible guardrail policy, assurance-slice trust, rollback readiness, and route-readiness compatibility

## Read and mutation contract

Suggested read projections:

- `GovernanceOverviewProjection`
- `GovernanceShellConsistencyProjection`
- `TenantConfigMatrixProjection`
- `AuthorityLinkProjection`
- `RoleCatalogProjection`
- `EffectiveAccessPreviewProjection`
- `ExceptionalAccessReviewProjection`
- `ComplianceControlProjection`
- `RecordsLifecycleProjection`
- `LegalHoldReviewProjection`
- `DispositionQueueProjection`
- `ChangeEnvelopeProjection`
- `PromotionGateProjection`
- `PromotionWatchProjection`
- `WaveGuardrailSnapshotProjection`
- `WaveActionObservationWindowProjection`
- `MigrationImpactPreviewProjection`
- `MigrationActionSettlementProjection`
- `MigrationActionObservationWindowProjection`
- `ReadPathCompatibilityDigestProjection`
- `ProjectionBackfillExecutionLedgerProjection`
- `MigrationCutoverCheckpointProjection`
- `ReleaseRecoveryDispositionProjection`
- `GovernanceEvidenceProjection`
- `GovernanceContinuityEvidenceProjection`
- `CrossPhaseConformanceScorecardProjection`

Suggested mutation contracts:

- `AdminDraftMutationCommand`
- `AuthorityLinkMutationCommand`
- `RoleAssignmentMutationCommand`
- `ScopedElevationDecisionCommand`
- `LegalHoldDecisionCommand`
- `DispositionJobDecisionCommand`
- `TemplatePromotionCommand`
- `PolicyBundlePromotionCommand`
- `GovernanceLeaseRefreshCommand`
- `ApprovalBundleAcknowledgeCommand`
- `PromotionWatchDecisionCommand`
- `WaveActionDecisionCommand`

Suggested settlement contracts:

- `GovernanceActionRecord`
- `GovernanceActionSettlement`
- `WaveActionRecord`
- `WaveActionSettlement`

`GovernanceActionRecord` should capture the exact scope token, baseline snapshot, `baselineTupleHash`, work object, action lease, approval bundle, `approvalTupleHash`, release freeze tuple, published `ReleaseWatchTuple` where watch posture is in scope, guardrail snapshot, runtime publication reference, any active `GovernanceOpsHandoffContext`, the originating `OpsReturnToken` where present, and the idempotency key that initiated the mutation.

`GovernanceActionSettlement` should capture the authoritative shell-visible result:

- `draft_saved`
- `compile_running`
- `approval_invalidated`
- `promotion_pending_wave`
- `watch_decision_pending`
- `guardrail_frozen`
- `recovery_disposition_active`
- `publication_stale`
- `stale_revalidate`
- `blocked_tuple`
- `denied_scope`
- `failed`

When the visible work originated from operations, `GovernanceActionSettlement` must also remain linked to the active `GovernanceOpsHandoffContext` so the originating board can settle to `handoff_active`, `read_only_diagnostic`, or bounded recovery from authoritative governance truth rather than from local navigation state.

The browser should read only from audience-safe governance projections. It must not bind directly to raw transactional stores or raw audit append logs.

Every governance mutation command must carry:

- `scopeTokenRef`
- `baselineSnapshotRef`
- `baselineTupleHash`
- `baselineCausalTokenRef`
- `changeEnvelopeRef`
- `changeIntentHash`
- `mutationFenceEpoch`
- `actionLeaseRef`
- `approvalEvidenceBundleRef` where approval or promotion is in scope
- `approvalTupleHash` where approval or promotion is in scope
- `releaseApprovalFreezeRef` where release approval or promotion is in scope
- `releaseWatchTupleRef` where watch, widening, rollback, or stabilization is in scope
- `expectedWaveActionSettlementRef` where a wave action depends on the current causal predecessor
- `migrationExecutionBindingRef` where migration or backfill control is in scope
- `expectedMigrationActionSettlementRef` where cutover or backfill action depends on the current migration lineage
- `continuityEvidenceBundleRef` where affected patient, support, or workflow continuity controls are in scope
- `opsHandoffContextRef` where the review originated from operations
- `opsReturnTokenRef` where the originating board must remain return-safe
- idempotency key

Every governance mutation command must also mint one `GovernanceActionRecord` and settle through one `GovernanceActionSettlement`. The shell may acknowledge local submission, but diff views, approval steppers, promote controls, and rollback posture may advance only from that settled result or fresher command-following projection truth.

No edit, approval, promotion, or rollback action may commit if any of those references are stale, revoked, or inconsistent with the visible shell state.

## Accessibility and comprehension rules

Governance screens are high-risk productivity surfaces, so accessibility is also a safety property and must implement `accessibility-and-content-system-contract.md`.

Required rules:

- every matrix, graph, and heat map must have a semantic table or list fallback
- every matrix, graph, and heat map must bind one `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection`, so scope, risk, tuple drift, and selection meaning remain identical across visual, summary, and tabular views
- scope, risk, and status may not rely on color alone
- sticky headers, side rails, drawers, and `mission_stack` folds must preserve keyboard focus order
- diff views must support screen-reader-friendly before and after summaries
- evidence pack previews, transfer states, and watch windows must announce tuple, generation state, sensitivity, and return posture before action buttons
- scope ribbon, approval stepper, evidence pack preview, continuity bundle, and promotion watch window must expose stable semantic headings plus deterministic DOM anchors such as `data-scope-token`, `data-watch-tuple`, `data-artifact-state`, and `data-transfer-state`
- `ScopeRibbon`, `TenantConfigMatrix`, diff review, approval stepper, evidence artifact preview, and watch windows must each declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, and `FreshnessAccessibilityContract`
- each governance route family must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; compile, approve, promote, rollback, and watch posture may not remain live if semantic coverage drifts under `mission_stack`, host resize, reduced motion, or replayed watch evidence
- compile, simulation, approval, promotion, export, rollback, and watch-return announcements must resolve through one `AssistiveAnnouncementTruthProjection`; local export acknowledgement, compile acceptance, and authoritative pack or release posture may not reuse the same wording or urgency, and restore may emit only the current review blocker once
- approval, compile, simulation, promotion, rollback, and revocation forms must implement `FormErrorSummaryContract` and `TimeoutRecoveryContract`; stale lease or scope expiry may not eject the reviewer from the current diff or evidence artifact
- before and after summaries must state changed object, changed risk or publication posture, and next decision consequence in text before any color key, sparkline, or matrix detail
- all dangerous actions must use explicit verb labels rather than ambiguous `save` or `apply` text

## Calm empty, loading, stale, and recovery posture

Governance calmness must preserve truth under drift and review pressure.

Rules:

- empty states for approvals, compliance controls, drift summaries, and watch windows must explain why nothing is shown, what usually appears here, and the fastest safe next action such as widening scope, clearing a filter, or opening the latest `ChangeEnvelope`
- on hydration or refresh, keep `ScopeRibbon`, the active task anchor, and the dominant action region visible; render skeletons only for missing matrix rows, diff panels, or evidence cards rather than blanking the shell
- if compile, simulation, publication, continuity evidence, approval bundle, or release-freeze truth drifts, preserve the same shell and downgrade the affected task into bounded read-only or revalidation posture; do not eject the user to a generic access or historical page
- pending draft save, compile, approval, promotion, watch, rollback, or compensating-change decisions must keep the initiating `ChangeEnvelope`, strongest confirmed artifact, and current `ReleaseFreezeTupleCard` or `PromotionWatchWindow` visible until authoritative settlement arrives
- promotion, rollback, widen, pause, resume, or rollforward controls may not show quiet success or stabilized posture while `GovernanceActionSettlement`, `WaveActionSettlement`, runtime publication, or continuity evidence still disagrees
- evidence-pack generation, simulation export, and cross-app handoff must stay summary-first and same-shell until the governing artifact and permission grant are ready; recovery-only artifacts may not masquerade as full-fidelity previews

## Verification and automation contract

Ship Playwright and contract coverage for:

- one `ScopeRibbon`, one shared status strip, one dominant primary action, and at most one promoted support region per active governance shell epoch
- same-shell reuse across diff, approval, simulation, watch, rollback, and evidence drill-in work within the same continuity key
- `mission_stack` fold and unfold preserving scope, selected row, active right-rail region, `ChangeEnvelope`, and current decision target
- stale scope token, approval bundle, release-freeze tuple, publication state, or continuity evidence downgrading the current shell in place rather than forcing a detached error or historical view
- baseline-tuple drift, approval-tuple drift, or watch-tuple supersession freezing compile, approve, promote, and stabilize posture in place rather than silently reusing prior approval
- pending draft, compile, approval, promotion, or rollback settlement preventing premature `approved`, `promoted`, `stabilized`, or `rolled back` wording in the shell
- release-watch drift keeping `ReleaseFreezeTupleCard`, `PromotionWatchWindow`, and rollback posture visible on the same continuity path

Stable, scope-safe automation anchors must exist for:

- `governance-shell`
- `scope-ribbon`
- `governance-status-strip`
- `governance-primary-region`
- `governance-support-region`
- `governance-change-envelope`
- `governance-review-context`
- `governance-approval-stepper`
- `governance-release-tuple`
- `governance-recovery-state`

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `operations-console-frontend-blueprint.md`
- `accessibility-and-content-system-contract.md`
- `phase-0-the-foundation-protocol.md`
- `phase-9-the-assurance-ledger.md`
- `staff-operations-and-support-blueprint.md`
- `platform-runtime-and-release-blueprint.md`
