# Platform front-end blueprint

## Purpose

This document is the cross-phase front-end source of truth for the normal Vecells web platform when NHS App integration is deferred.

It defines:

- shell ownership
- route ownership
- information architecture rules
- cross-object linking rules
- deep-link and recovery behaviour
- shared status language and presentation rules
- canonical visual token math, state-severity precedence, and breakpoint vocabulary
- artifact, export, print, and handoff presentation rules
- automation-anchor and telemetry vocabulary for cross-surface verification

## Canonical real-time interaction, motion, and live-projection experience algorithm

### 0. Purpose

This segment defines the mandatory UI and interaction algorithm for all patient, staff, hub, pharmacy, support, operations, and embedded surfaces.

It codifies the **Signal Atlas Live** interaction model. Vecells must behave as a continuous case system with stable object identity, local asynchronous acknowledgement, calm real-time projection updates, and explicit trust signaling rather than as a set of detached pages, CRUD detail views, or generic enterprise dashboards.

This revision adds the **Quiet Clarity** overlay: keep continuity, safety, and trust cues intact while reducing simultaneous surface count, duplicated status chrome, and unnecessary visual escalation.

The platform-wide continuity law is:

**same object, same shell**

The low-noise operating law is:

**one screen, one question, one dominant action, one promoted support region**

Every major surface must default to a single focal task region. History, evidence, context, and assistive surfaces may remain available, but only one of them may be promoted automatically at a time unless a true blocker, compare task, or explicit user pin justifies more.

If the user is still working the same canonical request, booking case, hub case, pharmacy case, callback case, support investigation, or tightly related lineage object, the shell must remain stable while child states morph in place.

The experience must be:

* state-driven
* projection-backed
* real-time where safe
* locally acknowledged before remotely settled
* shell-stable across adjacent child states
* selected-anchor-preserving across validation, pending, settlement, invalidation, and failure
* explicit about freshness, trust, causality, ownership, and next action
* quiet by default with progressive disclosure
* list-first with visualization on demand
* soft-transitioned between adjacent lifecycle states
* calm under asynchronous change
* keyboard-first and accessibility-safe
* verifiable in browser automation without brittle selectors
* free of disruptive full-page reloads except at true shell, security, permission, or schema-divergence boundaries

Any local rule that implies hard navigation, contradictory status presentation, silent freshness loss, focus theft, selected-object disappearance, spinner-led waiting for an already-known entity, or multiple competing primary signals in the same viewport is invalid unless it matches an explicit exception in this segment.

### 0.1 Compatibility bridge

This segment upgrades the visual and interaction model while preserving downstream terminology compatibility.

Compatibility aliases:

* `AnchorCard` maps to `CasePulse`
* `LiveTimeline` maps to `StateBraid`
* `ActionDock` maps to `DecisionDock`
* `AmbientStateRibbon` and `FreshnessChip` render as one shared status strip in quiet mode
* `ContextConstellation` may render as a closed or peeked context drawer in quiet mode

Any existing phase or screen contract that still uses the compatibility names inherits the semantics defined here.

### 0.1A Canonical design-token and visual-language foundation

All patient, staff, hub, pharmacy, support, operations, governance, and embedded surfaces must resolve visual values from one shared token source: `design-token-foundation.md`.

Cross-surface state-severity precedence, artifact-mode behavior, breakpoint vocabulary, automation anchors, and telemetry naming must then bind through `canonical-ui-contract-kernel.md` so the same visual primitives resolve to one product-wide UI grammar instead of route-local reinterpretation.

Add the binding contracts:

**DesignTokenFoundation**
`designTokenFoundationId`, `version`, `themeMode = light | dark`, `contrastMode = standard | high`, `densityMode = relaxed | balanced | compact`, `motionMode = full | reduced | essential_only`, `primitiveTokenRefs[]`, `semanticTokenRefs[]`, `componentTokenRefs[]`, `breakpointProfileRef`, `interpolationRuleRef`

**ShellVisualProfile**
`shellVisualProfileId`, `shellType`, `routeClass`, `profileTokenRef`, `tokenKernelLayeringPolicyRef`, `profileSelectionResolutionRef`, `densityMode`, `surfaceRoleRefs[]`, `surfaceDensityOverrideRefs[]`, `allowedTopologyMetricRefs[]`, `paneWidthRef`, `controlSizeRef`, `tableDensityRef`, `componentRhythmRef`, `derivedAt`

**BreakpointInterpolationRule**
`breakpointInterpolationRuleId`, `breakpointClassRefs[]`, `fluidTokenRefs[]`, `interpolationFormulaRef`, `snappingQuantumRef`, `clampRangeRef`

Rules:

1. shells, boards, cards, rails, drawers, forms, lists, tables, and task surfaces may choose only from the shared primitive, semantic, component, and profile token layers; route-local hex values, px values, shadow stacks, or radius ladders are forbidden
2. `ShellVisualProfile` may change density, pane width, allowed topology metrics, and allowed surface-role mixes by shell, but it may not fork typography, spacing, color semantics, icon sizing, stroke hierarchy, or motion meaning
3. only gutters, display-scale typography, and non-critical pane widths may use `BreakpointInterpolationRule`; hit targets, control heights, icon buckets, focus indicators, and state boundaries must remain discrete
4. `dense_data` is allowed only through `surfaceDensityOverrideRefs[]` on non-editable operations and governance tables, matrices, and telemetry boards; it may not shrink patient-facing controls or any editable control below the current shell minimum
5. local design proposals must reference the canonical token role they consume rather than describing a surface as "card-like", "dashboard-like", "subtle blue", or similar informal styling
6. every shell and route class must resolve exactly one current `ProfileSelectionResolution` from the active `DesignTokenExportArtifact`; feature CSS bundles, local semantic-color maps, and route-specific breakpoint tables are invalid substitutes

### 0.2 Continuity key and shell law

Define two continuity keys and do not conflate them:

- `shellContinuityKey` from one `ShellContinuityFrame`, with at least `audienceTier + shellType + shellScopeRef + channelProfile + shellNavigationManifestRef`
- `entityContinuityKey` from one `ContinuityFrame`, with at least `canonicalObjectDescriptorRef + canonicalEntityRef + lineageScopeRef + shellType`

`ShellContinuityFrame` owns outer chrome, section memory, compact-navigation behavior, responsive fold state, and refresh or restore posture. `ContinuityFrame` owns the currently active governed object inside that shell. Patient signed-in routes, staff workspaces, operations boards, and support workbenches may keep one `shellContinuityKey` while the active `entityContinuityKey` changes through an allowed same-shell object switch.

Where:

* `shellScopeRef` is the typed scope within which navigation, utility surfaces, responsive fold behavior, and restore memory may stay stable
* `canonicalObjectDescriptorRef` is the typed object contract that owns the active route family and object-scoped shell expectations
* `canonicalEntityRef` is the stable governed object the user is meaningfully working
* `lineageScopeRef` is the minimal downstream scope that may share one object-continuity frame without confusing object identity
* `shellType` distinguishes continuity that may look similar but must not share the same shell contract

High-priority continuity defects in this law:

1. shell continuity and active-object continuity are still conflated, so routes that should remain in the same shell can be forced into full replacement while some object switches can look calmer than their identity change warrants
2. the continuity key is currently formulaic and does not yet require typed shell and object continuity frames, so adjacent routes can reuse a shell even when shell scope, object contract, or shell expectations differ
3. `lineageScopeRef` is described conceptually, but not yet governed through explicit supersession, merge, or replacement rules for downstream objects
4. shell reuse does not yet require route-intent, route-adjacency, governing-version, session-lineage, visibility-grant, or embedded-channel agreement before mutating or PHI-bearing child views render
5. the law references hard boundaries, but not yet a deterministic boundary decision that explains why the shell is reused, an object is morphed in place, a same-shell object switch is allowed, or recovery is required
6. context preservation is listed, but not yet governed by a typed carry-forward plan that separates shell-scoped state from object-scoped state under drift, refresh, or recovery
7. shell ownership is still inferred from route prefix or feature area instead of one explicit shell-family ownership contract, so adjacent route families can still appear to belong to more than one shell
8. route ownership and bounded-context ownership are still blurred, so booking, messaging, callback, artifact, or audit features can accidentally behave like standalone shells even when they only contribute child routes inside a governed parent shell

Add the supporting continuity contracts:

**ShellScopeDescriptor**
`shellScopeDescriptorId`, `shellType`, `audienceTier`, `shellNavigationManifestRef`, `allowedRouteGroupRefs[]`, `utilitySurfacePolicyRef`, `sameShellObjectSwitchPolicyRef`, `scopeState = active | recovery | superseded`

`ShellScopeDescriptor` defines the legal scope of one persistent shell. A shell may keep navigation, utility affordances, and restore memory only while the next route remains inside this descriptor.

**ShellContinuityFrame**
`shellContinuityFrameId`, `shellScopeDescriptorRef`, `shellNavigationManifestRef`, `shellType`, `audienceTier`, `channelProfile`, `shellConsistencyRef`, `visibilityPolicyRef`, `frameState = active | recovery | superseded`

`ShellContinuityFrame` is the authoritative source of shell identity. `shellContinuityKey` must derive from it, and adjacent routes may not claim the same shell by matching URL shape or layout resemblance alone.

**ContinuityFrame**
`continuityFrameId`, `shellContinuityFrameRef`, `canonicalObjectDescriptorRef`, `canonicalEntityRef`, `lineageScopeRef`, `audienceTier`, `shellType`, `shellConsistencyRef`, `visibilityPolicyRef`, `frameState = active | preserved | recovery | superseded`

`ContinuityFrame` is the authoritative source of active object identity inside the shell. `entityContinuityKey` must derive from it, and adjacent routes may not claim object continuity by matching loose URL shape or nearby entity refs alone.

**LineageScopeDescriptor**
`lineageScopeDescriptorId`, `lineageAnchorRef`, `allowedChildObjectTypes[]`, `governingVersionRef`, `supersessionPolicy`, `mergeDisposition`, `replacementRecoveryRef`

`LineageScopeDescriptor` defines how far one active-object frame may legitimately stretch. If a child object is superseded, merged, or replaced outside the descriptor's allowed scope, continuity must degrade to governed recovery instead of silently treating the new object as the old one.

**ContinuityTransitionCheckpoint**
`checkpointId`, `currentShellFrameRef`, `candidateShellFrameRef`, `currentFrameRef`, `candidateRouteIntentRef`, `candidateRouteFamilyOwnershipClaimRef`, `candidateRouteAdjacencyContractRef`, `candidateGoverningVersionRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `visibilityGrantRef`, `channelContextRef`, `transitionState = reuse | morph_in_place | recovery_required | hard_boundary`

`ContinuityTransitionCheckpoint` is the gate for shell reuse and same-shell object switches. Reusing a shell requires more than a matching key: the shell scope, route-family ownership claim, route intent, route adjacency, governing version, session lineage, visibility grant, and any embedded channel context must still be valid for the next child surface.

**ShellBoundaryDecision**
`shellBoundaryDecisionId`, `checkpointRef`, `reasonCode`, `targetShellType`, `recoveryRouteRef`, `boundaryState = same_shell | replace_shell | preserve_read_only | blocked`

`ShellBoundaryDecision` makes hard boundaries explicit. When continuity cannot be preserved, the shell must know whether to keep the shell, replace it, preserve bounded read-only state, or block and recover; hidden fallback redirects are forbidden.

**ContinuityCarryForwardPlan**
`carryForwardPlanId`, `checkpointRef`, `navigationStateLedgerRef`, `selectedAnchorRefs[]`, `sideStageRefs[]`, `disclosurePostureRef`, `scrollRestoreRef`, `focusRestoreRef`, `statusStripDispositionRef`, `primaryRegionResetRef`, `freezeDispositionRef`, `releaseRuleRefs[]`

`ContinuityCarryForwardPlan` governs what survives a continuity-preserving transition. Shell-scoped navigation, utility state, and quiet posture may carry forward differently from object-scoped anchors, side stages, scroll, and focus; anything that cannot safely continue must freeze, demote, or degrade explicitly rather than vanishing or jumping to a sibling object.

Rules:

1. If the incoming surface resolves to the same `shellContinuityKey`, reuse the existing `PersistentShell` only when `ContinuityTransitionCheckpoint.transitionState = reuse` or `morph_in_place`.
2. If both `shellContinuityKey` and `entityContinuityKey` are unchanged, morph only the child surface that changed.
3. If `shellContinuityKey` is unchanged but `entityContinuityKey` changes, preserve the shell only when `candidateRouteAdjacencyContractRef` allows `same_shell_object_switch`, `same_object_child`, or `same_object_peer`, and the target route remains inside the allowed `ShellScopeDescriptor` and `LineageScopeDescriptor`.
4. When the shell stays the same across an object switch, preserve shell-level navigation, utility state, the shared status strip, and any valid pinned context through `NavigationStateLedger` and `ContinuityCarryForwardPlan`, but reset, demote, or preserve object-scoped anchors, focus leases, and promoted regions exactly as the carry-forward plan specifies.
5. When the same object continuity frame remains active, preserve `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, open side stages where still valid, scroll where safe, focus where safe, and any active `SelectedAnchor` according to `ContinuityCarryForwardPlan`.
6. Only replace the shell when `ShellBoundaryDecision.boundaryState = replace_shell` or `shellContinuityKey` changes; otherwise recover, freeze, or preserve read-only posture inside the same shell as directed.
7. Route changes within the same shell and same object must never imply loss of object identity or blank-page reset, and superseded or merged objects must recover through lineage-aware replacement rather than silent sibling substitution.
8. Access expansion after claim, sign-in, verification, embedded deep-link validation, or governed same-shell object switch must reveal newly authorized detail progressively inside the same shell only after `ContinuityTransitionCheckpoint` confirms shell scope, route intent, route adjacency, session lineage, visibility grant, and channel context are still valid.
9. A continuity-preserving transition must also preserve the current disclosure posture unless a blocker, conflict, explicit user action, or `freezeDispositionRef` requires more detail or less visibility.
10. When a temporary blocker, conflict, or compare posture resolves, restore the prior quiet posture unless the user explicitly pinned a richer layout and no carry-forward release rule blocks restoration.
11. Embedded, constrained-browser, or browser-handoff posture may change `channelProfile`, shell chrome, or governed delivery options inside the current shell, but it must not change `shellType` while the same shell continuity frame, active object, and audience tier remain valid.

### 1. Required experience topology and primitives

#### 1.1 PersistentShell

Fields:

* `shellId`
* `shellType = patient | staff | hub | pharmacy | support | operations | governance | assistive`
* `audienceTier`
* `channelProfile = browser | embedded | constrained_browser`
* `shellContinuityKey`
* `shellContinuityFrameRef`
* `shellFamilyOwnershipContractRef`
* `entityContinuityKey`
* `continuityFrameRef`
* `activeRouteFamilyOwnershipClaimRef`
* `layoutTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `clarityMode = essential | expanded | diagnostic`
* `designTokenFoundationRef`
* `shellVisualProfileRef`
* `surfaceDensityOverrideRefs[]`
* `themeMode = light | dark`
* `contrastMode = standard | high`
* `quietClarityBindingRef`
* `quietClarityEligibilityGateRef`
* `attentionBudgetRef`
* `essentialShellFrameRef`
* `shellConsistencyRef`
* `visibilityPolicyRef`
* `activeEntityRef`
* `activeChildView`
* `childSurfaceRef`
* `surfaceStateFrameRefs[]`
* `artifactStageRefs[]`
* `primaryRegionBindingRef`
* `statusStripAuthorityRef`
* `navigationStateLedgerRef`
* `selectedAnchorPolicyRef`
* `dominantActionHierarchyRef`
* `statusPresentationContractRef`
* `routeIntentRef`
* `mutationFenceEpoch`
* `sessionEpochRef`
* `subjectBindingVersionRef`
* `channelContextRef`
* `promotedSupportRegionRef`
* `suppressedRegionRefs[]`
* `signalRailState`
* `caseSpineState`
* `contextConstellationState = closed | peek | open | pinned`
* `pinnedContextRefs[]`
* `selectedAnchorRefs[]`
* `decisionDockLeaseRef`
* `workProtectionLeaseRef`
* `preservedPanels`
* `lastQuietPostureRef`
* `preservedScrollOffsets`
* `preservedFocusRef`
* `restorePlanRef`
* `responsiveViewportProfileRef`
* `responsiveProfileRef`
* `narrowScreenContinuityPlanRef`
* `embeddedStripContractRef`
* `stickyActionDockContractRef`
* `missionStackFoldPlanRef`
* `liveMode = live | buffered | paused`
* `liveProtectionMode = normal | buffered | composition_protected`
* `freshnessSummary`
* `shellHydrationState = partial | hydrated | degraded`
* `degradedStateContractRef`
* `freezeDispositionRef`
* `motionModeRef`
* `reducedMotionEnabled`

High-priority shell defects in this primitive:

1. the shell has a continuity key, but not yet one authoritative continuity frame and consistency envelope, so adjacent routes can look continuous while rendering mismatched truth
2. soft-route transitions do not yet require route-intent, mutation-fence, session-lineage, or channel-context agreement before mutating child states render
3. preserved panels, scroll, and focus are listed, but not yet governed by an explicit restore plan for refresh, reconnect, resume, or `mission_stack` fold and unfold
4. degraded, frozen, or embedded states are not yet explicit shell-law inputs, so the shell can appear calm while trust, visibility, or channel viability has already failed
5. dominant-action and composition protection live partly in `AttentionBudget`, but not yet as shell-level bindings that hold the primary region and `DecisionDock` stable under live change

Semantics:

* is the durable visual container for one shell scope and its current active object

* must survive adjacent state changes of the same `shellContinuityKey` and any allowed same-shell object switches
* may render only route families admitted by `shellFamilyOwnershipContractRef`; similarity of layout, feature origin, or URL prefix is not enough to claim shell residency
* must treat `activeRouteFamilyOwnershipClaimRef` as authoritative for whether the current child route is a shell root, same-shell child, same-shell peer, side stage, or hard-boundary launch

* must distinguish shell-scoped continuity from object-scoped continuity so queue switches, section switches, and next-item launches can preserve the shell without falsely implying the same governed object

* must preserve context across soft route changes

* must treat embedded or otherwise constrained channel posture as a channel adaptation of the owning shell rather than as a second shell identity; when the same continuity frame remains valid, the shell may morph `channelProfile`, chrome, and governed delivery options without changing `shellType`

* must derive `shellContinuityKey` from `shellContinuityFrameRef` and `entityContinuityKey` from `continuityFrameRef`, rendering both from one `shellConsistencyRef` plus `visibilityPolicyRef`; if either envelope drifts, mutating controls must freeze and the shell must resolve through `freezeDispositionRef` or bounded recovery instead of rendering contradictory state

* must not enter a mutating child state unless `routeIntentRef`, `mutationFenceEpoch`, and any required `sessionEpochRef`, `subjectBindingVersionRef`, or `channelContextRef` still match the current route contract and shell lineage

* must render the canonical Vecells layout topology:

  * patient and lightweight flows default to `focus_frame`
  * staff, hub, support, operations, governance, and standalone assistive control shells default to `two_plane`
  * `three_plane` is reserved for comparison-heavy, blocker-heavy, or explicitly pinned context states
  * mobile and narrow tablet default to `mission_stack`
  * `embedded_strip` is reserved for `channelProfile = embedded` or another constrained channel profile when the owning shell must retain continuity with reduced chrome

* must derive `layoutTopology` from `ResponsiveViewportProfile`, `ShellResponsiveProfile`, current `AttentionBudget`, and measured shell-container space; raw device labels alone are insufficient because embedded and constrained channels may be narrower than the host window while still preserving the same shell identity

* may use `shellType = assistive` only for standalone evaluation, replay, monitoring, or release-control work; assistive suggestion rails, provenance panels, and insert flows attached to patient, staff, hub, pharmacy, or support work remain bounded companions inside the owning shell

* must bind `designTokenFoundationRef` and `shellVisualProfileRef` before any child surface renders writable, reassuring, or state-coded posture; shell-local chrome may choose from permitted surface roles and density overrides, but it may not mint local visual primitives

* must bind `quietClarityBindingRef` to the current visibility policy, shell-consistency projection, route intent, continuity evidence, and any active release or channel freeze before the shell presents writable or reassuring posture

* must derive `quietClarityEligibilityGateRef` on mount, route morph, trust drift, compare entry, replay or recovery posture, and freeze changes; `clarityMode = essential` is allowed only while that gate says quiet suppression will not hide governing truth or actionability

* must carry the active `AttentionBudget` for the shell and respect its surface-promotion limits

* must materialize one `EssentialShellFrame`, one `PrimaryRegionBinding`, one `StatusStripAuthority`, one `NavigationStateLedger`, and one resolved `DominantActionHierarchy` for each shell epoch; shell-level status, navigation memory, primary-region ownership, and essential-region inventory may not be improvised independently by local chrome outside those contracts

* in `clarityMode = essential`, must promote at most one support region in addition to the primary work surface unless a true blocker, compare mode, or explicit user pin justifies more

* must keep the center of attention bound through `primaryRegionBindingRef` and keep the dominant action bound through `decisionDockLeaseRef`; `workProtectionLeaseRef` must hold those bindings stable while the user is composing, comparing, confirming, or reading a critical delta

* must preserve active command context, open side stage, and pinned comparison context where still valid

* must preserve any active `SelectedAnchor` unless an explicit release rule is met

* may materialize localized `SurfaceStateFrame` adapters derived from active `SurfacePostureFrame` instances; shell chrome may promote those states only after status arbitration determines that a new shell-level decision is required

* must keep any active `ArtifactStage` in the same shell whenever the current continuity frame, `ArtifactSurfaceFrame`, and presentation contract still allow it, preserving return context across refresh, reconnect, and `mission_stack` fold and unfold

* must restore preserved panels, scroll offsets, focus, selected anchors, narrow-screen fold state, and any still-valid artifact return anchor through `restorePlanRef` and `missionStackFoldPlanRef`; refresh, reconnect, resume, or fold and unfold may not silently drop the user into a sibling object or a freshly composed shell

* when trust, completeness, or channel viability degrades, must render from `degradedStateContractRef` and `freezeDispositionRef`; calm chrome may compress noise, but it may not imply actionability or visibility that those contracts no longer permit

* must restore the last user-approved quiet posture after a temporary blocker, conflict, or compare promotion ends unless the user explicitly pinned a richer layout

#### 1.1A AttentionBudget

Fields:

* `budgetId`
* `entityContinuityKey`
* `clarityMode`
* `dominantQuestionRef`
* `dominantActionRef`
* `promotedSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `lastQuietSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `maxPromotedRegions = 0 | 1 | 2`
* `allowedPlaneCount = 1 | 2 | 3`
* `promotionReason = none | blocker | conflict | reopen | compare | explicit_user_request | urgent`
* `promotionLockReason = none | composing | comparing | confirming | reading_delta`
* `deltaPriorityMode = summary_first | diff_first`
* `suppressionWindowMs`
* `promotionCooldownMs`
* `lastPromotionAt`
* `suppressedSignalRefs[]`
* `quietReturnTokenRef`
* `returnToQuietPolicy = on_resolve | on_commit | manual_only`

Semantics:

* is the explicit cognitive contract emitted by `CognitiveLoadGovernor`
* constrains simultaneous promoted surfaces, status cues, and plane count for the current shell
* must default patient and routine staff work to `maxPromotedRegions <= 1`
* must allow `allowedPlaneCount = 3` only for blocker-heavy, compare-heavy, pinned, or diagnostic work
* must prefer demotion to summary stubs before introducing new banners, rails, or panels
* must prefer localized `SurfaceStateFrame` resolution and summary stubs before promoting shell-wide banners, rails, or detached recovery pages
* must freeze auto-promotion while the user is composing, comparing, confirming, or reading a materially changed delta unless blocker severity increases
* reopen, return, and materially changed review flows must set `deltaPriorityMode = diff_first` until the authoritative delta packet is acknowledged or recommitted
* when temporary promotion clears, must restore `lastQuietSupportRegionRef` through `quietReturnTokenRef` unless the user pinned richer context
* must rate-limit repeated shell-level cue promotion and demotion so the interface does not thrash under live change
* on operations routes, `dominantQuestionRef`, `dominantActionRef`, and any promoted support region must resolve from the current `OpsBoardPosture` and `OpsProminenceDecision`; only the promoted anomaly surface plus `InterventionWorkbench` may remain elevated, and other abnormal surfaces must collapse to stable secondary summaries
* when a temporary promotion resolves, must restore the last quiet posture unless the user pinned a richer view

#### 1.1B QuietClarityBinding

Fields:

* `bindingId`
* `entityContinuityKey`
* `visibilityPolicyRef`
* `consistencyProjectionRef`
* `audienceTier`
* `projectionTrustState = trusted | degraded | stale | blocked`
* `assuranceSliceTrustRefs[]`
* `partialVisibilityRefs[]`
* `routeIntentRef`
* `embeddedSessionProjectionRef`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `routeFreezeDispositionRef`
* `dominantSettlementRef`
* `boundAt`

Semantics:

* binds the shell's quiet posture to one authoritative visibility and consistency envelope
* must point to the owning shell-consistency projection for the active route family rather than stitching together unrelated reads
* may summarize or defer detail, but may not widen read scope beyond `VisibilityProjectionPolicy`
* must fail closed into bounded refresh, recovery, or read-only posture when route intent, trust, release freeze, channel freeze, or continuity evidence no longer supports ordinary calm actionability

#### 1.1C QuietClarityEligibilityGate

Fields:

* `gateId`
* `entityContinuityKey`
* `routeClass`
* `audienceTier`
* `defaultTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `defaultClarityMode = essential | expanded | diagnostic`
* `forcedExpandedTriggers[]`
* `forcedDiagnosticTriggers[]`
* `suppressionExceptions[]`
* `eligibilityState = essential_allowed | expanded_required | diagnostic_required | blocked`

Semantics:

* decides whether the current route may stay quiet at all
* must escalate the shell to `expanded` or `diagnostic` posture when blocker-heavy review, active compare, degraded trust, route freeze, recovery, or diagnostic workflow would make `essential` misleading
* may downgrade back to `essential` only after the trigger resolves and the user has not pinned a richer posture

#### 1.1D EssentialShellFrame

Fields:

* `shellFrameId`
* `entityContinuityKey`
* `quietBindingRef`
* `eligibilityGateRef`
* `layoutTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `allowedRegionSet = case_pulse | status_strip | primary_region | decision_dock | promoted_support_region`
* `supportRegionBudget = 0 | 1`
* `placeholderPolicyRef`
* `compositionEpoch`

Semantics:

* is the immutable shell inventory for the current shell epoch
* child routes may restyle or summarize within the frame, but they may not add extra shell rails, detached success pages, or second-class status bands outside it
* in `clarityMode = essential`, only `CasePulse`, the shared status strip, one primary work region, and one `DecisionDock` may remain fully prominent unless blocker or compare posture lawfully expands the frame

#### 1.1E PrimaryRegionBinding

Fields:

* `bindingId`
* `governingObjectRef`
* `projectionRef`
* `projectionVersionRef`
* `selectedAnchorRefs[]`
* `invalidatedState = fresh | review_required | blocked | placeholder`
* `returnTargetRef`

Semantics:

* keeps the center of attention attached to one governing object and one reviewed projection version
* if live deltas invalidate that object, the region must stay in place, mark itself `review_required` or `blocked`, and expose the nearest safe recovery path without swapping to a sibling object or blank intermediate state

#### 1.1F StatusStripAuthority

Fields:

* `authorityId`
* `macroStateRef`
* `bundleVersion`
* `audienceTier`
* `shellFreshnessEnvelopeRef`
* `projectionTrustState`
* `ownedSignalClasses[]`
* `localSignalSuppressionRef`
* `degradeMode = quiet_pending | refresh_required | recovery_required`

Semantics:

* is the only shell-level owner for save, sync, freshness, pending, and recovery cues
* `CasePulse`, local controls, and `DecisionDock` may expose scoped state, but they may not restate shell-level truth outside this authority contract
* must render from the same bundle version and trust envelope as the visible shell so quiet chrome cannot contradict current truth
* must consume one current shell-scope `ProjectionFreshnessEnvelope`; shell chrome may not derive freshness or readiness directly from transport health, recent patch arrival, or local optimistic state

#### 1.1G DecisionDockFocusLease

Fields:

* `leaseId`
* `governingActionRef`
* `policyBundleRef`
* `supportRegionRef`
* `competingCtaPolicy = suppress | summarize | blocker_preempts`
* `expiresAt`

Semantics:

* backs `PersistentShell.decisionDockLeaseRef` and makes one dominant action explicit for the current shell epoch
* while the lease is active, compare drawers, assistive rails, context surfaces, and local tools may inform the decision, but they may not surface a second competing primary CTA unless a higher-priority blocker legally preempts the current action

#### 1.1H QuietWorkProtectionLease

Fields:

* `leaseId`
* `entityContinuityKey`
* `lockReason = composing | comparing | confirming | reading_delta`
* `selectedAnchorRef`
* `compareAnchorRefs[]`
* `protectedRegionRef`
* `priorQuietRegionRef`
* `preservedDraftRef`
* `decisionDockLeaseRef`
* `deferredDeltaRef`
* `queueChangeBatchRef`
* `startedAt`
* `leaseState = active | invalidated | release_pending | released`
* `invalidatingDriftState = none | ownership | lineage | publication | trust | anchor_invalidated | compare_target_invalidated | settlement_drift`
* `releaseRequestedAt`
* `releaseConditionRef`

Semantics:

* backs `PersistentShell.workProtectionLeaseRef` and persists the active calm posture during focused work
* while the lease is active, `AttentionBudget.promotionLockReason` must remain set and disruptive projection changes must buffer through `DeferredUIDelta` or `QueueChangeBatch`
* invalidating drift may not silently retarget the current draft, comparison subject, or selected anchor; the shell must freeze mutating controls in place and keep the protected region plus `priorQuietRegionRef` visible until explicit apply or governed recovery settles
* release must restore the prior quiet region, current `SelectedAnchor`, and any preserved draft or reading target when safe; generic reset is forbidden
* the promoted support region may change only when blocker severity strictly increases

#### 1.1I ContinuityRestorePlan

Fields:

* `restorePlanId`
* `entityContinuityKey`
* `selectedAnchorRef`
* `routeIntentRef`
* `shellTopologyRef`
* `responsiveViewportProfileRef`
* `responsiveProfileRef`
* `scrollAnchorRef`
* `focusTargetRef`
* `embeddedSessionProjectionRef`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `assuranceSliceTrustRefs[]`
* `experienceContinuityEvidenceRefs[]`
* `resumeReasonCode`
* `restoreState = ready | partial | blocked | read_only_only | recovery_required`

Semantics:

* backs `PersistentShell.restorePlanRef` and governs refresh, reconnect, resume, and embedded return behavior
* must attempt to restore the same anchor, topology, and local focus target before offering fallback navigation
* must revalidate route intent, release freeze, channel freeze, assurance slice trust, and continuity evidence before restoring mutable posture
* if full restoration is impossible, must preserve the nearest safe causal breadcrumb and fall back to read-only or governed recovery rather than replaying stale mutating affordances

#### 1.1J MissionStackFoldPlan

Fields:

* `foldPlanId`
* `stackOrder`
* `foldHierarchyRefs[]`
* `defaultExpandedRegion`
* `collapsedRegionRefs[]`
* `promotedSupportRegionRef`
* `supportFallbackMode = drawer | sheet | stacked_panel`
* `compareFallbackRef`
* `blockerStubRef`
* `selectedAnchorRef`
* `preservedScrollAnchorRef`
* `preservedFocusTargetRef`
* `stickyActionDockContractRef`
* `recoveryStubRef`
* `returnTargetRef`

Semantics:

* backs `PersistentShell.missionStackFoldPlanRef` and defines how the same shell collapses for narrow screens
* must declare one deterministic fold hierarchy so tertiary context, compare, chronology, and evidence regions collapse in a stable order before the dominant task or selected anchor is displaced
* fold and unfold operations must preserve the active `SelectedAnchor`, dominant blocker visibility, sticky action reserve, and current `DecisionDock` state so the mobile shell remains a folded version of the same `shellContinuityKey` rather than a separate page journey
* compare, context, and support regions may demote only through the declared `supportFallbackMode` and `compareFallbackRef`; silent disappearance or modal-on-modal fallback is forbidden

#### 1.1K CalmDegradedStateContract

Fields:

* `contractId`
* `trustState = trusted | degraded | quarantined | unknown`
* `completenessState = complete | partial | blocked`
* `blockingSliceRefs[]`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `routeFreezeDispositionRef`
* `experienceContinuityEvidenceRefs[]`
* `settlementSuppressionState = normal | provisional_only | suppress_success`
* `fallbackMode = inline_notice | placeholder | read_only | recovery_route | diagnostic_required`
* `dominantRecoveryActionRef`
* `allowedReassuranceClasses[]`
* `lastReviewedAt`

Semantics:

* backs `PersistentShell.degradedStateContractRef` and governs calm degraded and frozen states when trust, visibility, continuity evidence, or channel viability no longer support ordinary reassuring chrome
* must suppress success language, writable posture, and misleading completion cues whenever the current route is partial, frozen, blocked, or no longer continuity-validated
* must keep the dominant recovery path visible in `DecisionDock`

#### 1.1L QuietSettlementEnvelope

Fields:

* `envelopeId`
* `governingActionRef`
* `routeIntentRef`
* `commandActionRecordRef`
* `commandSettlementRecordRef`
* `experienceContinuityEvidenceRef`
* `lineageFenceEpoch`
* `selectedAnchorRef`
* `localAckState = none | shown`
* `authoritativeConfirmationState = pending | settled | superseded | disputed | recovery_required`
* `releaseApprovalFreezeRef`
* `channelReleaseFreezeRef`
* `confirmedArtifactRefs[]`
* `provisionalArtifactRefs[]`
* `returnClarityMode`
* `releaseConditionRef`

Semantics:

* holds the shell steady after a dominant action starts
* the initiating `SelectedAnchor`, the strongest confirmed artifact, and the current consequence preview must remain visible until authoritative settlement or policy-governed provisional completion allows quiet return
* may not resolve to detached success pages, silent card swaps, or generic done banners while settlement, external confirmation, route freeze, or continuity evidence remains unsettled

#### 1.2 CasePulse

Fields:

* `entityRef`
* `entityType`
* `macroState`
* `stateAxes.lifecycle`
* `stateAxes.ownership`
* `stateAxes.trust`
* `stateAxes.urgency`
* `stateAxes.interaction`
* `headline`
* `subheadline`
* `primaryNextActionRef`
* `statusTone`
* `freshnessState`
* `ownershipOrActorSummary`
* `urgencyBand`
* `confirmationPosture`
* `slaArc`
* `lastMeaningfulUpdateAt`
* `changedSinceSeen`
* `secondaryMetaState = collapsed | expanded`
* `pendingTransitionRefs[]`

Semantics:

* is the stable identity surface for the active object
* is the compact truth layer for the case
* must remain visually present while child states change
* must expose one shared `macroState` plus the five secondary `stateAxes`
* must foreground headline, macro state, and next best action cue before any secondary metadata
* must be shared across adjacent views of the same request, booking, hub case, pharmacy case, callback case, or support investigation
* must never contradict the authoritative patient-safe or staff-precise state mapping supplied by `MacroStateMapper`

#### 1.3 StateBraid

Fields:

* `timelineId`
* `entityRef`
* `audienceTier`
* `businessStateEventRefs[]`
* `communicationEventRefs[]`
* `externalConfirmationEventRefs[]`
* `exceptionRecoveryEventRefs[]`
* `reviewRequiredRefs[]`
* `returnEventRefs[]`
* `unseenEventRefs[]`
* `highlightedDeltaRefs[]`
* `currentTaskRef`
* `defaultWindow = latest_relevant | full_history`
* `collapsedEventCount`
* `liveInsertMode = immediate | buffered`
* `resumeMode = normal | diff_first`

Semantics:

* is the continuity spine for state change, communication, external confirmation, recovery, and re-check requirements
* replaces simplistic single-lane activity feeds
* must update in place
* must support changed-since-seen cues
* must preserve chronology while making causality legible
* must default to the latest relevant events in `clarityMode = essential`
* must support diff-first emphasis on reopen, return, and materially changed review flows

#### 1.4 EvidencePrism

Fields:

* `prismId`
* `entityRef`
* `factRefs[]`
* `inferredRefs[]`
* `thirdPartyConfirmationRefs[]`
* `ambiguousRefs[]`
* `staleRefs[]`
* `conflictRefs[]`
* `reviewRequiredReasonRefs[]`
* `sourceOpenState`
* `freshnessState`
* `defaultDensity = summary | expanded`
* `autoExpandReason = none | conflict | stale | blocker | requested`
* `reviewVersion`
* `lastAcknowledgedSnapshotRef`
* `authoritativeDeltaPacketRef`
* `changedSinceSeenRefs[]`
* `supersededContextRefs[]`
* `deltaAcknowledgementState = none | pending_review | acknowledged | recommit_required`
* `quietReturnEligibility = blocked | on_ack | on_resolve`
* `diffFirstTargetRef`

Semantics:

* is the canonical evidence surface
* must distinguish user-entered facts, system-derived inference, third-party confirmation, ambiguous evidence, stale evidence, and conflicting evidence
* must support inline source inspection without leaving the current task
* must support diff-first rendering against the last acknowledged evidence snapshot through one authoritative delta packet
* must default to a summary posture in `clarityMode = essential`
* must auto-expand only when conflict, staleness, a blocking review requirement, or explicit user intent makes more detail necessary
* must remain explicit when new evidence invalidates an in-progress decision
* must keep superseded endpoint, ownership, duplicate-lineage, and approval context visible with explicit markers until the operator rechecks and recommits intentionally
* decisive and consequential delta cues may decay from initial emphasis, but they may not disappear before `deltaAcknowledgementState` advances

#### 1.5 DecisionDock

Fields:

* `dockId`
* `entityRef`
* `location = bottom | side`
* `primaryActionRef`
* `secondaryActionRefs[]`
* `secondaryActionMode = inline | overflow`
* `recommendationReasonRef`
* `confidenceLevel`
* `consequencePreviewRef`
* `transitionEnvelopeRef`
* `anchorPersistenceRef`
* `stateStability = stable | pending | blocked | invalidated | reconciled`
* `blockingReason`
* `isSticky`

Semantics:

* is the single bounded action zone for the current moment
* must remain stable during live updates
* must expose asynchronous progress without moving the user to a different page
* must surface the dominant next action while keeping secondary actions subordinate or overflowed
* must show consequence and confidence before irreversible or externally consequential action
* must explain why an action is blocked, stale, invalidated, or awaiting re-check

#### 1.6 AmbientStateRibbon

Fields:

* `ribbonId`
* `entityRef`
* `freshnessEnvelopeRef`
* `saveState = idle | saving | saved | failed`
* `syncState = fresh | updating | stale | disconnected | paused`
* `transportState = live | reconnecting | disconnected | paused`
* `pendingExternalState = none | awaiting_confirmation | awaiting_reply | awaiting_ack`
* `bufferState = none | queued_updates | review_required`
* `localFeedbackState = none | shown | queued | superseded`
* `processingAcceptanceState = none | accepted_for_processing | awaiting_external_confirmation | rejected | timed_out`
* `authoritativeOutcomeState = none | pending | review_required | recovery_required | settled | failed`
* `attentionTone = quiet | caution | urgent`
* `renderMode = integrated_status_strip | promoted_banner`
* `message`
* `lastChangedAt`

Semantics:

* provides lightweight always-available feedback for save, sync, freshness, pending external work, and buffered live updates
* `syncState` is the rendered shell-level verdict from `ProjectionFreshnessEnvelope`; `transportState` is transport health only and may not stand in for projection truth, freshness, or actionability
* `localFeedbackState`, `processingAcceptanceState`, and `authoritativeOutcomeState` summarize the governing settlement chain for the current shell; the ribbon may explain provisional progress, but it may not mint final success independently
* must replace silent waiting
* must visually merge with `FreshnessChip` into one shared status strip on routine surfaces
* must not dominate the viewport unless an urgent action or blocking trust state exists
* must communicate live buffering and re-check requirements without breaking shell continuity
* local acknowledgement, reconnect, queue drain, or worker acceptance may widen pending explanation, but quiet completion copy requires `authoritativeOutcomeState = settled` from the governing settlement source
* reconnect, poll success, or queued delta arrival may widen transport explanation, but they may not clear stale, blocked, or recovery posture until the bound freshness envelope proves the current projection truth is fresh enough again

#### 1.7 FreshnessChip

Fields:

* `chipId`
* `projectionRef`
* `freshnessEnvelopeRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `scope = shell | region | anchor | command_following`
* `freshnessState = fresh | updating | stale | disconnected | paused`
* `transportState = live | reconnecting | disconnected | paused`
* `renderMode = integrated_status_strip | standalone`
* `freshnessAgeMs`
* `staleAfterAt`
* `requiredForCurrentAction`
* `actionabilityState = live | guarded | frozen | recovery_only`
* `degradeReasonRefs[]`
* `lastKnownGoodSnapshotRef`
* `lastProjectionVersion`
* `lastCausalTokenApplied`

Semantics:

* declares how trustworthy the visible data currently is
* derives from `ProjectionFreshnessEnvelope`, not directly from socket health, poll success, or cursor movement
* must be available on all projection-backed detail, list, board, and spatial-comparison surfaces
* must render inside the shared status strip in `clarityMode = essential`
* may promote to standalone only when freshness is directly decision-blocking or when dense operational boards need per-surface trust signaling
* must be visible at shell level when freshness loss affects safe action
* must make freshness loss explicit before any unsafe follow-up action is allowed
* `transportState = live` is not enough to render `fresh`, and `freshnessState = fresh` is illegal while `actionabilityState = frozen | recovery_only` or while awaited command-following truth is past `staleAfterAt`
* shell-level freshness may stay calmer than a localized region only when the current envelope proves the dominant action, selected anchor, and shell interpretation remain safe

#### 1.7A ProjectionFreshnessEnvelope

Fields:

* `projectionFreshnessEnvelopeId`
* `continuityKey`
* `entityScope`
* `surfaceRef`
* `selectedAnchorRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `scope = shell | region | anchor | command_following`
* `projectionFreshnessState = fresh | updating | stale_review | blocked_recovery`
* `transportState = live | reconnecting | disconnected | paused`
* `actionabilityState = live | guarded | frozen | recovery_only`
* `lastProjectionVersionRef`
* `lastCausalTokenApplied`
* `lastKnownGoodSnapshotRef`
* `lastKnownGoodAt`
* `staleAfterAt`
* `reasonRefs[]`
* `localizedDegradationRefs[]`
* `derivedFromRefs[]`
* `evaluatedAt`

Semantics:

* is the sole freshness authority for `AmbientStateRibbon`, `FreshnessChip`, `SurfacePostureFrame`, `WritableEligibilityFence`, and `FreshnessAccessibilityContract`
* separates projection-truth freshness from transport health so connected channels cannot masquerade as current truth and disconnected transport cannot by itself overstate stale severity
* may localize degradation to shell, region, anchor, or command-following scope, but the shell-level envelope may stay calm only when the dominant action, selected anchor, and global interpretation remain safe
* command-following scopes must remain `guarded | frozen | recovery_only` until the awaited causal token, governed pending disposition, or authoritative recovery path satisfies the current freshness contract
* legacy surfaces that expose only `syncState`, websocket health, or poll success without a current `ProjectionFreshnessEnvelope` are `read_only | recovery_only` for calm or writable posture until the envelope is emitted or backfilled

#### 1.8 ProjectionSubscription

Fields:

* `subscriptionId`
* `projectionRef`
* `entityScope`
* `entityContinuityKey`
* `audienceTier`
* `consistencyClass`
* `applyMode = live_patch | batch_when_idle | manual_apply`
* `pauseReason`
* `transportState = live | reconnecting | disconnected | paused`
* `lastEventCursor`
* `lastVersion`
* `lastCausalToken`
* `bufferedDeltaCount`
* `impactProfilePolicyRef`
* `deltaPolicyRef`

Semantics:

* is the real-time data-binding contract between UI state and projection state
* must support in-place patching, buffering, manual apply, and pause-live behavior
* must preserve continuity while still surfacing trust-impacting changes quickly
* exposes transport and delta-delivery facts to `ProjectionFreshnessEnvelope`, but it is not itself the freshness authority for shell calmness, region posture, or CTA actionability

#### 1.9 TransitionEnvelope

Fields:

* `transitionId`
* `entityRef`
* `commandRef`
* `affectedAnchorRef`
* `originState`
* `targetIntent`
* `localAckState = queued | local_ack | optimistic_applied | superseded`
* `processingAcceptanceState = not_sent | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`
* `externalObservationState = unobserved | projection_visible | external_effect_observed | review_disposition_observed | recovery_observed | disputed | failed | expired`
* `authoritativeOutcomeState = pending | review_required | recovery_required | reconciliation_required | settled | reverted | failed | expired`
* `causalToken`
* `settlementRevisionRef`
* `settlementPolicy = projection_token | external_ack | manual_review`
* `userVisibleMessage`
* `visibleScope = local_component | active_card | active_shell`
* `startedAt`
* `updatedAt`
* `failureReason`
* `recoveryActionRef`
* `invalidateOnConflict`

Semantics:

* is the required bridge state for every asynchronous command or meaningful user action
* prevents dead spinners and page resets
* keeps local acknowledgement, processing acceptance, external observation, and authoritative outcome separate so the UI cannot silently collapse `accepted`, `seen`, and `settled` into one misleading success posture
* makes async progress explicit and local to the affected object
* must persist until authoritative settlement, explicit failure, or governed expiry
* must be able to enter `review_required` when optimistic assumptions are invalidated by later evidence or projection truth

#### 1.10 DeferredUIDelta

Fields:

* `deltaId`
* `entityRef`
* `projectionRef`
* `targetRegionRef`
* `deltaClass = non_disruptive | contextual | disruptive`
* `impactClass = bufferable | review_required | non_bufferable`
* `reasonBuffered`
* `summaryMessage`
* `invalidatesCurrentAction`
* `announcementPriority = silent | polite | assertive`
* `bufferedAt`
* `flushDeadlineAt`
* `causalTokenBoundary`
* `applyWhen = immediate | idle | explicit_user_apply | after_edit_commit`

Semantics:

* holds live updates that would otherwise steal focus or destabilize the layout
* must be used when the user is typing, reading deeply, comparing options, composing a reply, or working a focused case
* `impactClass = non_bufferable` is mandatory when the delta changes safety, identity, ownership, lease validity, lineage fence, route writability, or invalidates the currently selected candidate or action with no safe equivalent
* every buffered delta must carry an explicit `flushDeadlineAt`; indefinite buffering is forbidden
* must communicate when buffered deltas materially change the safety or validity of the current decision

#### 1.11 QueueChangeBatch

Fields:

* `batchId`
* `queueRef`
* `sourceRankSnapshotRef`
* `targetRankSnapshotRef`
* `preservedAnchorRef`
* `preservedAnchorTupleHash`
* `insertedRefs[]`
* `updatedRefs[]`
* `priorityShiftRefs[]`
* `rankPlanVersion`
* `applyPolicy = idle_only | explicit_apply | immediate_if_safe`
* `batchImpactClass = bufferable | review_required`
* `focusProtectedRef`
* `invalidatedAnchorRefs[]`
* `replacementAnchorRefs[]`
* `anchorApplyState = preserved | invalidated | replaced | released`
* `summaryMessage`
* `firstBufferedAt`
* `flushDeadlineAt`
* `batchState = available | applied | dismissed`
* `createdAt`

Semantics:

* is the only allowed mechanism for introducing disruptive live queue changes while a queue is in active use
* protects staff cognition and focus
* must bridge one committed canonical queue order to another; mixed-snapshot reorder is forbidden
* must preserve the exact currently pinned row or card through `preservedAnchorRef` plus `preservedAnchorTupleHash`; row label, ordinal, scroll position, highlight, or DOM focus alone are not proof of continuity
* if the target snapshot cannot preserve that same anchor tuple, the batch must publish invalidation or explicit replacement before apply; silent neighbor substitution is forbidden
* must apply in stable order: focused item first, then background rows in canonical ranked order for the active `rankPlanVersion`
* batches may coalesce only while `now < flushDeadlineAt`; after that deadline they must either apply or escalate to `review_required`

#### 1.12 QueueLens

Fields:

* `lensId`
* `queueRef`
* `focusedItemRef`
* `densityHorizonRef`
* `priorityLayers[]`
* `ownershipGhostRefs[]`
* `changedSinceSeenRefs[]`
* `burstIndicatorState`
* `bulkActionRailState`
* `queuedUpdateBadgeState`
* `liveGuardState = live | buffered | paused`
* `viewMode = list | board | compact`

Semantics:

* is the canonical worklist surface for staff-facing operational work
* is not a passive table
* must support scan, compare, inline inspect, inline act, bulk act, and pivot to the active case without losing the working set
* must keep the focused item visually pinned while open

#### 1.13 InlineSideStage

Fields:

* `stageId`
* `hostSurfaceRef`
* `subjectRef`
* `subjectContinuityKey`
* `openState`
* `comparisonSubjectRefs[]`
* `returnFocusRef`
* `preservedDraftRef`
* `widthMode = narrow | standard | wide`

Semantics:

* is the bounded inline expansion surface for inspecting a related object, comparison target, or compose action
* replaces most modal stacks and detached detail pages
* must preserve the working set and restore focus on close
* must inherit continuity semantics when inspecting tightly related child objects

#### 1.13C CommunicationEnvelope

Fields:

* `communicationEnvelopeId`
* `threadId`
* `clusterRef`
* `subthreadRef`
* `governingObjectRef`
* `communicationKind = clinician_message | callback_expectation | callback_outcome | more_info_request | reminder | instruction | patient_reply | delivery_repair_notice | outcome_notice`
* `channel = sms | email | portal | push | voice | internal_task | none`
* `payloadRef`
* `payloadChecksum`
* `transportAckState = none | accepted | rejected | timed_out`
* `deliveryEvidenceState = pending | delivered | disputed | failed | expired | suppressed`
* `deliveryRiskState = on_track | at_risk | likely_failed | disputed`
* `authoritativeOutcomeState = awaiting_delivery_truth | awaiting_reply | callback_scheduled | awaiting_review | reviewed | settled | recovery_required | suppressed`
* `latestReceiptEnvelopeRef`
* `latestConversationSettlementRef`
* `latestCallbackStatusRef`
* `latestReminderPlanRef`
* `reachabilityAssessmentRef`
* `experienceContinuityEvidenceRef`
* `causalToken`
* `monotoneRevision`
* `recordedAt`

Semantics:

* is the sole request-centered communication row authority across message sends, callback promises or outcomes, reminders, more-info asks, instructions, repair notices, and patient replies
* keeps `transportAckState`, `deliveryEvidenceState`, `deliveryRiskState`, and `authoritativeOutcomeState` explicit so patient and staff surfaces can acknowledge transport progress without manufacturing calm conversational success
* must be emitted or refreshed by `MessageDispatchEnvelope`, `CallbackExpectationEnvelope`, `NetworkReminderPlan`, reply or callback settlements, and delivery-repair flows rather than by route-local timeline joins or toast state
* all thread lists, preview rows, callback cards, reminder notices, and open-thread history must cite the current `CommunicationEnvelope` for the same `threadId` and `subthreadRef`; local draft state or callback receipts are descriptive only until reflected through the envelope

#### 1.13D ConversationSubthreadProjection

Fields:

* `subthreadProjectionId`
* `threadId`
* `clusterRef`
* `subthreadType = clinician_message | callback | more_info | reminder | instruction`
* `governingObjectRef`
* `ownerRef`
* `replyTargetRef`
* `replyWindowRef`
* `latestCommunicationEnvelopeRef`
* `latestReceiptEnvelopeRef`
* `latestSettlementRef`
* `latestReminderPlanRef`
* `latestThreadExpectationEnvelopeRef`
* `latestThreadResolutionGateRef`
* `latestCallbackStatusRef`
* `selectedAnchorRef`
* `deliveryRiskState`
* `authoritativeOutcomeState`
* `replyCapabilityState = live | blocked_route_repair | blocked_visibility | blocked_safety | expired | review_only | none`
* `subthreadState = active | awaiting_reply | awaiting_review | reminder_pending | repair_required | closed | superseded`
* `continuityEvidenceRef`
* `receiptGrammarVersionRef`
* `subthreadTupleHash`
* `computedAt`

Semantics:

* preserves typed semantics inside the unified conversation surface so callback promises, reminders, follow-up asks, replies, and clinician messages do not collapse into one generic timeline row
* must retain owner, reply target, reply validity, expiry, and workflow-branch meaning for the active subthread even when the parent thread is rendered in compact or quiet mode
* must carry the current expectation, resolution, and callback-status chain for the active branch so reminder fallback, callback repair, or support resend can widen guidance without rewriting the subthread's owner, reply target, or expiry semantics
* reminder and callback fallback behavior must remain visible as typed subthreads in the same cluster instead of detaching into unrelated appointment, callback, or repair mini-flows

#### 1.14 ConversationThreadProjection

Fields:

* `threadId`
* `clusterRef`
* `requestRef`
* `audienceTier`
* `selectedAnchorRef`
* `typedSubthreadRefs[]`
* `communicationEnvelopeRefs[]`
* `messageRefs[]`
* `callbackRefs[]`
* `reminderRefs[]`
* `moreInfoRefs[]`
* `instructionRefs[]`
* `intentGroupRefs[]`
* `pendingReplyRefs[]`
* `reviewMarkerRefs[]`
* `latestPreviewDigestRef`
* `latestReceiptEnvelopeRef`
* `latestConversationSettlementRef`
* `latestCallbackStatusRef`
* `activeComposerLeaseRef`
* `latestThreadExpectationEnvelopeRef`
* `latestThreadResolutionGateRef`
* `visibilityProjectionRef`
* `placeholderContractRef`
* `requestReturnBundleRef`
* `recoveryContinuationRef`
* `latestContinuityEvidenceRef`
* `lastSeenCursor`
* `currentActionRef`
* `replyCapabilityState`
* `receiptGrammarVersionRef`
* `threadTupleHash`
* `threadState = active | pending | review_required | repair_required | settled | recovery_only`
* `surfaceMode = unified_request_thread`

Semantics:

* unifies messages, follow-up questions, callback expectations, reminder notices, patient replies, and actionable instructions into one request-centered communication surface
* must prevent siloed communication experiences
* must support live insertion, reply pending states, changed-since-seen cues, reminder or callback fallback morphs, and smooth return-to-review transitions without dropping the active anchor, draft, or typed subthread into a detached mini-flow
* must resolve one current communication tuple for the active `threadId`: the ordered `CommunicationEnvelope` set, ordered `ConversationSubthreadProjection` set, current preview digest, current receipt envelope, current settlement, current callback status, current composer lease, current visibility posture, and current continuity evidence for the same `selectedAnchorRef`, `receiptGrammarVersionRef`, and `threadTupleHash`
* transport acknowledgement, delivery evidence, and delivery risk may widen or block guidance, but they may not rewrite authoritative conversational outcome or typed subthread meaning; if thread, subthread, visibility, or continuity posture drifts, the same shell must freeze mutating controls and recover the active anchor rather than reopening a generic messages landing page

#### 1.15 ConsequencePreview

Fields:

* `previewId`
* `actionRef`
* `entityRef`
* `immediateEffects[]`
* `downstreamEffects[]`
* `blockingConditions[]`
* `fallbackActionRefs[]`
* `projectedMacroState`
* `projectedStateAxes`
* `requiresExplicitConfirm`

Semantics:

* is the required disclosure surface for irreversible, externally consequential, or high-risk actions
* must appear before commit for actions that can change downstream ownership, patient-visible status, capacity, messaging, or pharmacy/network execution
* must clarify what state language and trust posture will change after commit

#### 1.16 MotionIntentToken

Fields:

* `intent = reveal | morph | settle | pending | invalidate | diff | reopen | degrade | recover | handoff | escalate`
* `legacyIntentAlias = commit -> settle`
* `timingBand = instant | standard | deliberate | urgent`
* `sourceOriginRef`
* `amplitude = silent | low | medium | urgent`
* `movementProfile = none | opacity_only | anchored_translate | anchored_morph | outline_emphasis | status_pulse`
* `easingFamily = standard_enter | standard_exit | anchored_morph_spring | deterministic_linear`
* `interruptionPolicy = replace_by_higher_priority | merge_same_target | finish_then_static | preserve_until_authoritative`
* `motionBudgetMs`
* `delayMs`
* `settleHint`
* `reducedMotionFallback`
* `staticEquivalentRef`

Semantics:

* encodes motion meaning
* `commit` is a deprecated compatibility alias and must normalize to `settle` before render
* motion must represent state change, not decoration
* motion must originate from the changed object, command source, or selected anchor rather than from a generic page container
* urgency is expressed through timing, contrast, and explicit state language, not through larger travel or decorative flourish
* motion budgets must remain subordinate to responsiveness and comprehension

#### 1.17 SelectedAnchor

Fields:

* `anchorId`
* `entityRef`
* `anchorType = slot | provider | pharmacy | queue_row | message | evidence_cluster | comparison_candidate | action_card`
* `hostSurfaceRef`
* `continuityFrameRef`
* `governingObjectVersionRef`
* `anchorTupleHash`
* `visualIdentityRef`
* `stabilityState = stable | validating | pending | invalidated | recovered | replaced`
* `fallbackAlternativesRef[]`
* `invalidatingReasonRefs[]`
* `replacementAnchorRef`
* `compareAnchorRefs[]`
* `preserveUntil = settle | review_acknowledged | explicit_dismiss | entity_switch`
* `lastKnownLabel`
* `lastKnownPositionRef`
* `lastValidatedAt`

Semantics:

* is the visual object-permanence contract for the user’s current selection or focus anchor
* `anchorTupleHash` is the canonical identity for continuity; label, list position, highlight, or focus ring alone are not proof that the user is still acting on the same object
* selected objects must not disappear during async work or remote revalidation
* in-place patching is legal only while `anchorTupleHash`, `continuityFrameRef`, and governing-object continuity still match; otherwise the anchor must become `invalidated` or `replaced` explicitly
* invalidated anchors must remain visible until explicit re-check, causal replacement, or dismissal
* recovered anchors may resolve in place without a shell jump or neighbor substitution
* compare targets and side-by-side candidates must carry durable anchor identity as well; compare mode may not silently swap one candidate for another under a preserved card shell
* must be used for selected slot, chosen provider, selected pharmacy, focused queue row, compare target, or any equivalently important user choice

#### 1.18 SurfacePostureFrame

Fields:

* `surfacePostureFrameId`
* `hostShellRef`
* `surfaceRef`
* `entityContinuityKey`
* `freshnessEnvelopeRef`
* `dominantQuestionRef`
* `dominantActionRef`
* `postureState = loading_summary | ready | empty_actionable | empty_informational | stale_review | blocked_recovery | settled_pending_confirmation | read_only`
* `lastStableSnapshotRef`
* `selectedAnchorRef`
* `placeholderContractRef`
* `recoveryActionRef`
* `promotedSupportRegionRef`
* `skeletonPolicyRef`
* `statusOwnershipRef`
* `renderedAt`

Semantics:

* is the only allowed posture frame for primary-region loading, empty, stale, blocked, pending-confirmation, and read-only states
* must keep the same shell, dominant question, dominant action, and selected anchor visible while truth changes
* must prefer a last-stable summary or anchor over a blank reset whenever the entity is already known
* empty states must explain why the surface is empty and what safe action, if any, comes next
* locally acknowledged but unsettled actions must remain inside the same surface posture rather than navigating to a detached success page
* `postureState = ready` is illegal while the bound freshness envelope is `stale_review | blocked_recovery` or its `actionabilityState = frozen | recovery_only`, even if transport remains live

#### 1.18A SurfaceStateFrame

Fields:

* `surfaceStateFrameId`
* `surfacePostureFrameRef`
* `hostShellRef`
* `hostSurfaceRef`
* `subjectRef`
* `stateClass = loading | empty | sparse | blocked | stale | degraded | recovery | settled`
* `summaryRef`
* `dominantQuestionRef`
* `dominantActionRef`
* `secondaryActionRefs[]`
* `supportReasonRef`
* `renderMode = inline_card | primary_region | shell_notice`
* `stateOwner = local_surface | shared_status_strip | promoted_banner`
* `anchorCarryForwardRef`
* `placeholderContractRef`
* `recoveryTokenRef`
* `enteredAt`

Semantics:

* is the localized calm-state ownership frame derived from the governing `SurfacePostureFrame`
* must preserve the same shell and object anchor whenever continuity is unchanged
* must lead with one short summary, one dominant question, and one dominant action
* loading after first entity resolution must stay regional and bounded
* empty and sparse states must reassure, orient, and propose the safest useful next step rather than mimicking failure
* stale, degraded, and blocked states must keep the last trusted content visible whenever policy allows and explain which actions are frozen
* recovery and settled states must preserve return context and causality; success may not exist only as a transient toast if the user still needs orientation or a next step
* may not duplicate a state already owned by the shared status strip unless localized actionability or policy differs

#### 1.19 ArtifactSurfaceFrame

Fields:

* `artifactSurfaceFrameId`
* `artifactRef`
* `entityContinuityKey`
* `artifactSurfaceBindingRef`
* `artifactSurfaceContextRef`
* `artifactPresentationContractRef`
* `artifactModeTruthProjectionRef`
* `artifactParityDigestRef`
* `sourceArtifactRef`
* `summaryRef`
* `summaryVersionRef`
* `sourceArtifactHash`
* `parityTupleHash`
* `sourceAuthorityState = source_authoritative | summary_verified | summary_provisional | source_only | recovery_only`
* `summarySafetyTier`
* `selectedAnchorRef`
* `currentSafeMode`
* `sourceParityState = verified | provisional | stale | blocked`
* `primaryPresentation = summary | inline_preview | placeholder`
* `secondaryDeliveryModes[] = download | print | export | external_handoff`
* `deliveryGrantRefs[]`
* `artifactTransferSettlementRef`
* `artifactFallbackDispositionRef`
* `returnTargetRef`
* `freshnessState`
* `renderedAt`

Semantics:

* is the frontend rendering contract for any artifact-bearing surface or export-capable workflow
* must be materialized only from the current `ArtifactSurfaceBinding`, `ArtifactSurfaceContext`, current `ArtifactModeTruthProjection`, and `ArtifactParityDigest`
* must present source, summary, freshness, and parity before secondary delivery actions
* must also present whether the current summary is verified, provisional, or source-only for the same `parityTupleHash`; the source artifact remains authoritative even when the derivative is verified
* download, print, export, and external handoff are always secondary and may execute only while grants, scope, parity, channel viability, and return continuity remain valid on the same `truthTupleHash`
* must keep the selected anchor, last safe summary, and deterministic return target visible while transfer is pending or fallback is promoted
* local acknowledgement of download, print, or handoff may not imply completion; visible readiness and completion must follow `ArtifactTransferSettlement.authoritativeTransferState`
* stale or blocked artifact parity must degrade in place rather than launching detached artifact routes or misleading previews

#### 1.19A ArtifactStage

Fields:

* `artifactStageId`
* `artifactSurfaceFrameRef`
* `artifactSurfaceContextRef`
* `artifactRef`
* `hostShellRef`
* `hostSurfaceRef`
* `lineageAnchorRef`
* `artifactPresentationContractRef`
* `artifactModeTruthProjectionRef`
* `artifactParityDigestRef`
* `artifactTransferSettlementRef`
* `artifactFallbackDispositionRef`
* `outboundNavigationGrantRef`
* `currentMode = structured_summary | contract_permitted_preview | print_ready | byte_download | external_handoff`
* `permittedModes[]`
* `parityState = summary_only | preview_verified | preview_degraded | handoff_only`
* `provenanceSummaryRef`
* `returnAnchorRef`
* `enteredAt`

Semantics:

* is the operational stage layered on top of `ArtifactSurfaceFrame` for letters, documents, result files, receipts, evidence bundles, export packs, and similar governed artifacts
* must default to structured summary in the same shell whenever the contract permits
* preview, print, download, or external handoff must remain subordinate to the same shell and continuity context until explicitly invoked
* current mode must never exceed `artifactPresentationContractRef`, current `ArtifactModeTruthProjection.currentSafeMode`, or any active disclosure, masking, channel, or grant fence
* mode transitions that leave the shell must resolve one `ArtifactTransferSettlement`; provisional clicks or print-dialog launch are not authoritative completion states
* if preview parity degrades, must render the governed summary and provenance message in place rather than dropping to raw bytes or blank failure
* when fallback is required, `artifactFallbackDispositionRef` must keep the dominant action and return anchor inside the same shell rather than replacing the artifact with a detached failure path
* any external exit must consume `outboundNavigationGrantRef` and preserve a deterministic return anchor into the same shell whenever policy allows

#### 1.19B Canonical UI contract kernel

The product-wide visual, state, artifact, and verification kernel lives in `canonical-ui-contract-kernel.md`. Every shell, route family, component family, and artifact surface in this blueprint must bind to it through:

* `visualTokenProfileRef`
* `surfaceStateSemanticsProfileRef`
* `automationAnchorMapRef`
* `telemetryBindingProfileRef`
* `artifactModePresentationProfileRef`

Rules:

* route families may specialize density, task topology, and domain components, but they may not fork spacing scale, type scale, semantic color roles, breakpoint classes, or DOM-state vocabulary
* `SurfacePostureFrame`, `SurfaceStateFrame`, `FreshnessChip`, `AmbientStateRibbon`, `ArtifactSurfaceFrame`, `ArtifactStage`, and `UIEventEnvelope` must resolve from the same kernel vocabulary for severity, tone, state ownership, and automation markers
* if a local component needs a new visible state, that state must be added to the kernel and mapped across shell, motion, accessibility, artifact, telemetry, and automation semantics before release

### 2. Required frontend services

#### 2.1 LiveProjectionBridge

Responsibilities:

* subscribe to scoped projections
* apply in-place patches
* buffer disruptive deltas
* expose freshness state
* expose delta-rate, buffer pressure, and reconnect health so motion and batching can downgrade safely
* reconcile optimistic UI and server-confirmed state

#### 2.2 TransitionCoordinator

Responsibilities:

* create and advance `TransitionEnvelope`
* create and advance `QuietSettlementEnvelope` for dominant actions that must hold calm posture steady until settlement
* control soft route changes
* preserve shell, case pulse, state braid, decision dock, and selected anchors
* update `ContinuityRestorePlan` and `MissionStackFoldPlan` on same-shell route morphs so restore and fold state remain current
* decide when a transition settles, reverts, expires, or remains pending
* merge or cancel superseded cues when invalidation, recovery, or reopen truth outranks an in-flight local cue
* convert conflicting projection truth into `review_required` rather than silent overwrite

#### 2.3 MotionSemanticRegistry

Responsibilities:

* normalize legacy intent aliases such as `commit -> settle`
* map `MotionIntentToken` to deterministic timing, delay, easing, amplitude, and static-equivalent rules
* arbitrate one dominant cue per region and one animated region per continuity key except for a declared handoff follower
* enforce consistent motion meaning across patient and staff surfaces
* enforce reduced-motion, low-power, low-frame-stability, and live-churn fallbacks
* ensure motion originates from the changed object or initiating control

#### 2.4 FreshnessSupervisor

Responsibilities:

* classify projections as fresh, updating, stale, disconnected, or paused
* block unsafe destructive actions when required freshness is not met
* surface freshness at component and shell level

#### 2.5 MacroStateMapper

Responsibilities:

* translate internal workflow states into canonical audience-facing macro states
* ensure request, booking, hub, pharmacy, callback, and communication surfaces never contradict each other at top level
* provide patient-safe and staff-precise state language without divergence of underlying truth

#### 2.6 FocusIntegrityGuard

Responsibilities:

* enforce pinned focus law
* create and release `QuietWorkProtectionLease` while the user is composing, comparing, confirming, or reading a critical delta
* prevent live updates from moving the active case, active row, active slot, active compare target, or active draft unexpectedly
* preserve cursor, selection, scroll position, and the current `PrimaryRegionBinding` where safe
* preserve the current quiet-return target until the protected region or governed recovery explicitly releases it
* keep `DecisionDockFocusLease` stable until the protected work region or confirmation fence legally releases it

#### 2.7 EvidenceLineageResolver

Responsibilities:

* classify evidence into fact, inference, third-party confirmation, ambiguous, stale, and conflicting layers
* compute diff against the last acknowledged review snapshot
* attach source lineage and freshness to each evidence cluster

#### 2.8 InteractionContractRegistry

Responsibilities:

* guarantee stable semantic roles and accessible names for critical controls and regions
* ensure custom components remain keyboard-operable and automation-verifiable
* expose stable automation anchors for `EssentialShellFrame`, `PrimaryRegionBinding`, `StatusStripAuthority`, active degraded or recovery posture, and any `MissionStackFoldPlan` fold toggle
* expose explicit success, warning, locked, stale, failed, invalidated, reconciled, surface-state, and artifact-stage DOM states

#### 2.9 ContinuityOrchestrator

Responsibilities:

* derive `entityContinuityKey`
* decide shell reuse versus shell replacement
* bind `QuietClarityBinding` and `ContinuityRestorePlan` to the current route intent, visibility policy, and continuity evidence
* derive `MissionStackFoldPlan` for narrow shells and preserve same-shell return targets during fold and unfold
* prevent same-entity reloads and same-entity shell churn
* coordinate child-surface morphs, access-expansion reveals, and return-to-context behavior

#### 2.10 SelectedAnchorPreserver

Responsibilities:

* create, update, and release `SelectedAnchor`
* preserve `anchorTupleHash`, governing-object version, and compare-anchor membership through validation, buffered deltas, refresh, restore, and settlement
* keep selected row, card, provider, or slot visible through validation, pending, settlement, and failure
* represent invalidation without disappearance
* publish invalidation or replacement stubs before any sibling object can occupy the released anchor slot
* surface nearest safe alternatives without losing causality

#### 2.11 LiveAnnouncementGovernor

Responsibilities:

* bound live region noise
* turn batched updates into concise, prioritized announcements
* escalate only blocking, urgent, or review-required changes
* prevent repetitive announcements for routine autosave, trivial freshness refreshes, or low-risk list churn

#### 2.12 ResponsivenessLedger

Responsibilities:

* emit continuity, acknowledgement, settle, focus-loss, and anchor-preservation telemetry
* emit breakpoint-class, effective-inline-size, fold-state, compare-fallback, sticky-dock, and embedded-strip telemetry for resize, rotate, zoom, host-resize, and safe-area transitions
* detect same-entity reload regressions
* support automation assertions for local acknowledgement, projection settlement, and focus integrity
* measure perceived responsiveness as speed of stable feedback and comprehension, not only page load time

#### 2.13 CognitiveLoadGovernor

Responsibilities:

* derive and update `AttentionBudget`
* derive `QuietClarityEligibilityGate` and the active `EssentialShellFrame` from route class, compare posture, blocker state, trust posture, and shell topology
* set `PersistentShell.clarityMode`
* choose the single auto-promoted support region for the current task without violating `DecisionDockFocusLease`
* cap simultaneously promoted support regions and other expanded secondary surfaces
* collapse secondary context, history, and explanation by default
* auto-promote only the specific hidden region required by a blocker, conflict, reopen delta, compare task, or explicit user request
* restore the last quiet posture once a temporary promotion resolves unless the user pinned richer context
* keep `CalmDegradedStateContract` authoritative whenever trust or freeze posture suppresses ordinary calm reassurance
* prevent duplicated status presentation across header, banner, chip, toast, and side rail
* apply promotion hysteresis so live deltas cannot repeatedly switch the promoted support region during active decision moments
* require spotlight- or summary-promotion surfaces to resolve one typed decision owner plus bounded use window before the promoted entity can change; local freshness may refresh the summary, but it may not replace the owning entity while that window is still live
* keep non-blocking pending, stale, and acknowledgement states inline or in the shared status strip unless a new user decision is required
* keep settled confirmation attached to the affected object, `DecisionDock`, or a localized `SurfaceStateFrame` rather than promoting a second competing shell cue

#### 2.14 SurfacePostureGovernor

Responsibilities:

* derive `SurfacePostureFrame` from projection completeness, continuity evidence, and settlement state
* preserve the last stable snapshot or selected anchor during refresh, stale review, and blocked recovery
* choose actionable versus informational empty posture without adding duplicate shell chrome
* keep one dominant question and one dominant action visible in the primary region

#### 2.14A SurfaceStateGovernor

Responsibilities:

* resolve `SurfaceStateFrame` for each primary and promoted support region from the governing `SurfacePostureFrame`
* arbitrate between localized state frames, the shared status strip, and promoted banners
* preserve last trusted content and selected anchors through loading, stale, degraded, recovery, and settled posture changes
* ensure empty and sparse states remain purposeful, low-noise, and action-oriented

#### 2.15 ArtifactExperienceCoordinator

Responsibilities:

* derive `ArtifactSurfaceFrame` from `ArtifactPresentationContract`, current grants, and summary parity
* enforce summary-first artifact rendering and same-shell return targets
* keep print, export, download, and external handoff in secondary action zones
* fail closed to placeholder or in-place recovery when parity, grant, or scope posture drifts

#### 2.15A ArtifactHandoffCoordinator

Responsibilities:

* instantiate and update `ArtifactStage` from the governing `ArtifactSurfaceFrame`
* enforce `ArtifactPresentationContract` and `OutboundNavigationGrant` at render and handoff time
* preserve return context, lineage labels, and explicit print, download, or external-exit intent
* degrade artifact preview in place when parity, permission, or channel viability changes

#### 2.15B DesignContractRegistry

Responsibilities:

* publish the active `VisualTokenProfile`, `SurfaceStateSemanticsProfile`, `AutomationAnchorMap`, `TelemetryBindingProfile`, and `ArtifactModePresentationProfile` for the current shell, route family, and breakpoint class
* publish the current `ProfileSelectionResolution` and `SurfaceStateKernelBinding` alongside those profiles so shell variation and visible-state propagation are machine-readable
* generate and publish one `DesignContractPublicationBundle` plus one `DesignContractLintVerdict` for every audience surface and route-family set from the current `DesignTokenExportArtifact`
* prevent component-local token, breakpoint, tone, artifact-mode, or automation drift
* expose the same bundle ref, digest, vocabulary tuple, and lint state to rendering, accessibility, telemetry, Playwright, and runtime publication layers
* fail closed to preserved-summary, read-only, or recovery posture when the active bundle is stale, blocked, or no longer matches the route family's published runtime tuple

### 3. Non-negotiable invariants

1. The same `shellContinuityKey` must reuse the same `PersistentShell`.
2. Adjacent lifecycle states of the same entity must render within the same `PersistentShell`.
3. Any route transition within the same `shellContinuityKey` must use soft navigation and preserve shell context; when `entityContinuityKey` changes inside that shell, the switch must still resolve through a typed same-shell adjacency contract.
4. Patient and lightweight shells must default to `focus_frame`; staff, hub, support, operations, governance, and standalone assistive shells must default to `two_plane`; `three_plane` is allowed only when comparison, blockers, or explicit pinning justify the extra noise; mobile and narrow-tablet shells must default to `mission_stack`; only true embedded or constrained-channel surfaces may use `embedded_strip`.
   * `mission_stack` is the same shell folded for narrow width; fold, unfold, rotate, and breakpoint changes must preserve the dominant action, current `SelectedAnchor`, promoted support region, and return path.
5. Every major entity surface must include a `CasePulse`, one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, and a single current `DecisionDock`.
6. Every major entity surface must expose one shared `macroState` plus the five `stateAxes`.
7. `StateBraid` and `EvidencePrism` must exist where history or trust matter, but they may open as summary stubs or collapsed panels until the user requests more detail or a blocker, conflict, or reopen flow requires it.
8. At most one dominant primary action and one expanded support region may compete for attention within the same viewport.
   * `AttentionBudget` must be computed for every major entity surface.
   * In `clarityMode = essential`, only `CasePulse`, one shared status strip, one primary work region, and one `DecisionDock` may remain at full prominence by default.
   * `StateBraid`, `EvidencePrism`, `ContextConstellation`, and assistive surfaces must stay collapsed, summary-level, or closed unless explicitly promoted or needed for safe action.
   * When a temporary promotion resolves, the shell must return to the last quiet posture unless the user pinned a richer view.
9. Every anchor-bearing selection or focus-critical choice must create or update a `SelectedAnchor`.
10. Selected anchors must remain visible through validation, pending, settlement, invalidation, and failure unless the user dismisses them or a true entity switch occurs.
11. Projection-backed state changes must patch in place; they must not trigger full-page reloads.
12. A full-screen loading state is forbidden once the active entity is known and at least one viable projection snapshot exists.
   * Subsequent loading, empty, sparse, blocked, stale, degraded, recovery, and post-settlement states must resolve through localized `SurfaceStateFrame` instances backed by the relevant `SurfacePostureFrame`.
   * Those frames must preserve the same shell, dominant question, and any valid `SelectedAnchor` whenever continuity is unchanged.
13. Every asynchronous action must create a `TransitionEnvelope`.
14. Every irreversible, externally consequential, or high-risk action must render a `ConsequencePreview` before commit.
15. Live updates must not steal focus, reset scroll, collapse open context, or discard partially entered user input.
16. Selected staff work items must remain visually pinned while the user is actively working them.
17. Patient-visible statuses across request, booking, hub, pharmacy, callback, and messaging views must derive from one shared `MacroStateMapper`.
18. Messages, follow-up questions, callback expectations, reminder notices, and actionable patient communications for a request must be unified inside one `ConversationThreadProjection` built from typed `ConversationSubthreadProjection` rows and their current `CommunicationEnvelope` chain.
19. Waiting and in-review states must remain living shells with visible continuity, not dead status pages.
   * Receipts, document outcomes, evidence bundles, and comparable governed artifacts must remain summary-first inside one `ArtifactStage` backed by `ArtifactSurfaceFrame` until contract-permitted preview, print, download, or external handoff is explicitly invoked.
20. Evidence origin and trust class must never be flattened into a single undifferentiated content block.
21. Spatial comparison surfaces such as booking orbit or network lattice must always have an accessible list or table fallback and may not displace the calmer list-first default.
22. All critical controls and regions must expose stable semantic roles and accessible names.
   * `SurfaceStateFrame` and `ArtifactStage` surfaces must expose stable labels, state markers, provenance or blocker summaries, and return anchors in the DOM.
23. Color is a secondary signal only; state meaning must also be conveyed by text, iconography, layout, or motion.
24. Reduced-motion mode must preserve all state meaning without requiring spatial animation.
24A. Every surface must resolve typography, spacing, grid, sizing, iconography, radius, stroke, elevation, density, semantic color, contrast, and motion from `design-token-foundation.md` plus the active `ShellVisualProfile`; local styling drift is forbidden.
24B. Every active shell and route family must resolve visible state semantics, automation markers, telemetry vocabulary, and artifact posture from one current `DesignContractPublicationBundle` backed by `DesignContractLintVerdict.result = pass`; route-local aliases, hidden token files, and unexported event names are forbidden.
24C. Every active shell and route family must resolve one current `ProfileSelectionResolution`; route-local theme packs, semantic-color remaps, breakpoint tables, or surface-role mixes that are not allowed by that resolution are invalid even if they visually resemble the canonical shell.
24D. Any newly visible state, tone, motion cue, landmark, DOM marker, assistive summary, or emitted UI event must first extend `SurfaceStateSemanticsProfile` and publish one current `SurfaceStateKernelBinding`; components may not invent local state meaning that accessibility, automation, telemetry, or artifact posture cannot prove from the same binding.
25. Countdown or exclusivity language must not appear unless the underlying business state genuinely supports it.
26. Hard navigation is allowed only for:

* initial shell load
* explicit entity switch
* explicit workspace switch
* true authentication boundary
* permission boundary
* unrecoverable projection or schema divergence

27. Assistive suggestions must remain supplementary and must never displace primary clinical or operational content without user intent.
28. Modal-on-modal stacks are forbidden for adjacent inspection, comparison, or compose flows that can be handled by `InlineSideStage`.
29. Queue reorder, queue insertion, and queue priority shift while a queue is in active use must flow through `QueueChangeBatch`.
30. A live update that materially invalidates an in-progress review must mark that review as `review_required`; it must not silently overwrite or auto-submit the user’s current decision context.
31. Staleness, disconnection, and paused-live mode must be visible when they affect safe action.
   * The last trusted content should remain visible beneath the relevant `SurfaceStateFrame` whenever policy allows; trust loss may not masquerade as absence.
32. Route change alone is not an acceptable representation of state change; the relevant object state must also be reflected in the DOM.
33. Same-entity async completion must not create history-stack spam or navigate to a visually unrelated page.
   * When completion materially changes what the user should do next, render an in-shell settled posture through the affected object or `SurfaceStateFrame(stateClass = settled)`, not through toast-only success.
34. Duplicating the same status across multiple simultaneous banners, chips, and toasts is forbidden unless the duplicated state is blocking and the duplication is localized to the active action.
   * A localized `SurfaceStateFrame` may coexist with the shared status strip only when the frame owns a different action consequence than the strip.
35. Continuity, anchor preservation, focus integrity, and avoidable noise regressions are product defects, not cosmetic issues.
36. Auto-promotion may not switch support regions while the user is composing, comparing, confirming, or actively reading a highlighted delta unless urgency or blocker severity strictly increases.
37. Non-blocking pending, stale, acknowledgement, and capability states must stay local to the active card or the shared status strip; they may not escalate to persistent full-width banners by default.
38. Every primary region must resolve through one `SurfacePostureFrame`; loading, empty, stale, blocked, pending-confirmation, and read-only states may not each invent competing shell chrome.
39. Once the active entity is known, refresh and settlement must preserve the last stable summary or selected anchor in place; generic blank resets and detached success pages are forbidden.
40. Every artifact-bearing surface and export-capable workflow must resolve through one `ArtifactSurfaceFrame`; summary-first presentation is mandatory when policy allows, and download, print, export, or external handoff remain secondary, grant-bound actions.
41. Narrow-screen folds must preserve the same `SurfacePostureFrame`, dominant question, dominant action, and promoted support region rather than inventing a separate mobile-only journey.
42. Every major shell must bind one `QuietClarityBinding`, one `QuietClarityEligibilityGate`, one `EssentialShellFrame`, one `PrimaryRegionBinding`, and one `StatusStripAuthority` before it presents writable or reassuring posture.
43. Every shell epoch may have at most one active `DecisionDockFocusLease`; competing primary CTAs must be suppressed, summarized, or blocker-preempted by policy rather than rendered side by side.
44. `QuietWorkProtectionLease` is mandatory whenever the user is composing, comparing, confirming, or reading a highlighted delta; while active, disruptive changes must buffer, support-region auto-promotion may not thrash, and invalidating drift must freeze the protected region in place rather than retarget it.
45. Every `mission_stack` shell must materialize `MissionStackFoldPlan`; fold and unfold may not drop the active anchor, dominant blocker, or `DecisionDock` state.
46. Return to ordinary calm posture is legal only when the active `QuietSettlementEnvelope` is settled and the current `CalmDegradedStateContract`, route intent, and continuity evidence all still permit reassuring or writable state.

### 4. Canonical real-time rendering algorithm

#### 4.0 Continuity resolution algorithm

On route entry, route update, projection apply, sign-in change, claim completion, access-scope change, or explicit same-shell object switch:

1. Resolve `shellContinuityKey`, `entityContinuityKey`, `canonicalEntityRef`, `lineageScopeRef`, `audienceTier`, the active `NavigationStateLedger`, and any governing `RouteAdjacencyContract`.

2. Compare the resolved `shellContinuityKey` to the current shell and the resolved `entityContinuityKey` to the current active object, then run `ContinuityTransitionCheckpoint`.

3. If both keys are unchanged:

   * reuse the existing `PersistentShell`
   * preserve current `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, the current disclosure posture, active `SelectedAnchor`, `PrimaryRegionBinding`, and any active `DecisionDockFocusLease` or `QuietWorkProtectionLease` where still valid
   * morph only the child surface that changed

4. If `shellContinuityKey` is unchanged but `entityContinuityKey` changes and `RouteAdjacencyContract.adjacencyType` allows a same-shell object switch:

   * reuse the existing `PersistentShell` chrome, navigation manifest state, utility state, shared status strip, and any pinned context that still validates
   * demote, preserve, or reset object-scoped anchors, side stages, disclosure posture, and focus exactly as `ContinuityCarryForwardPlan` requires
   * instantiate the new active `ContinuityFrame` inside the current shell
   * keep a return stub or preserved anchor for the departing object whenever the route's `SelectedAnchorPolicy` requires causality or safe return

5. If the shell key is unchanged but authorization expands or the checkpoint returns `recovery_required`:

   * reveal newly authorized regions in place only after the checkpoint validates route intent, visibility, and channel context
   * otherwise keep the existing shell in read-only or recovery posture with the last safe summary and nearest safe anchor visible

6. If the shell key changes because of an explicit shell-scope switch, true auth boundary, permission boundary, or unrecoverable schema divergence:

   * create a new shell
   * preserve safe return context where possible

7. Update `NavigationStateLedger`, `ContinuityRestorePlan`, and telemetry for reuse, same-shell object switch, preservation, or boundary replacement.

8. Never blank the whole screen solely because a child phase, downstream status, or same-shell object switch changed for the current shell scope.

#### 4.0A Shell-managed navigation and restore algorithm

On explicit navigation, browser back or forward, hard refresh, or post-recovery return:

1. Resolve the target route entry, owning `ShellNavigationManifest`, current `NavigationStateLedger`, and any governing `RouteAdjacencyContract`.
2. For explicit same-shell navigation, update `NavigationStateLedger` first and then write browser history according to `RouteAdjacencyContract.historyPolicy`; `push` is allowed only for user-meaningful object or mode changes, `replace` for provisional child phases and quiet recovery, and `none` for projection-only or status-only change.
3. On browser back or forward, restore selected nav group, route family, filters, scroll, and anchor from the target ledger epoch before child-surface hydration begins.
4. On hard refresh, if `shellContinuityKey`, manifest, and route intent remain valid, recreate the shell from the last valid ledger snapshot plus the last stable summary or anchor, then resume live hydration in place.
5. If route intent, continuity evidence, or ledger freshness is insufficient, keep the same shell and fall into bounded recovery with the nearest safe anchor rather than dropping to a generic default section or queue.
6. Projection arrival, settlement confirmation, stale-review demotion, and live delta may patch the current surface, but they may not create browser-history entries.

#### 4.1 Initial mount algorithm

On entry to an entity-backed route:

1. Resolve the active entity scope, `shellContinuityKey`, `entityContinuityKey`, audience tier, channel profile, access grant posture, current route intent, and any active release, channel, or embedded freeze posture, then derive `ResponsiveViewportProfile` from layout viewport size, shell-container size, dynamic viewport height, safe-area insets, zoom band, text-scale band, and pointer precision.

2. Derive `QuietClarityEligibilityGate` from route class, audience tier, blocker state, compare posture, trust posture, recovery posture, and `ResponsiveViewportProfile.breakpointClass`.

3. Choose `PersistentShell.layoutTopology` from `ResponsiveViewportProfile`, `ShellResponsiveProfile`, and `AttentionBudget`:

   * `three_plane` only when the opening task already requires pinned comparison or blocking context and `usableInlinePx >= 1280`
   * `two_plane` for routine staff, hub, support, operations, governance, and standalone assistive control surfaces only when `usableInlinePx >= 960`
   * `focus_frame` for patient and lightweight task surfaces when `usableInlinePx >= 600` and no lawful split-plane promotion is active
   * `mission_stack` for any same-shell surface below its split-plane threshold or whenever zoom, text scale, or focus protection makes split planes unsafe
   * `embedded_strip` only for intentionally embedded or constrained-channel experiences that remain on the same shell continuity and whose `EmbeddedStripContract` requires compressed chrome, especially below `usableInlinePx = 840`

4. Set `PersistentShell.clarityMode` from `QuietClarityEligibilityGate`; start at `essential` only while the gate says quiet suppression remains safe.

5. Ask `CognitiveLoadGovernor` to derive the initial `AttentionBudget`, `EssentialShellFrame`, and initial `DecisionDockFocusLease` from route class, blocker state, compare posture, degraded posture, and explicit user pins.

6. Create or reuse `PersistentShell`.

7. Bind `QuietClarityBinding` to the current visibility policy, shell-consistency projection, route intent, continuity evidence, and any active release or channel freeze.

8. Create `StatusStripAuthority`, `PrimaryRegionBinding`, `NavigationStateLedger`, and `ContinuityRestorePlan`, resolve the current `SelectedAnchorPolicy`, `DominantActionHierarchy`, `StatusPresentationContract`, `ShellResponsiveProfile`, and `StickyActionDockContract`, and, when `layoutTopology = mission_stack`, also create `MissionStackFoldPlan` plus `NarrowScreenContinuityPlan`, and, when `layoutTopology = embedded_strip`, create `EmbeddedStripContract` before any writable or reassuring posture is rendered.

9. Render shell chrome immediately:

   * compact `GlobalSignalRail` or mission anchor
   * `CaseSpine`
   * `ContextConstellation` as closed or peeked by default, or stacked context drawer on narrow surfaces unless `AttentionBudget` explicitly promotes it

10. If a current projection snapshot exists:

   * render `CasePulse`
   * render `DecisionDock`
   * render one shared status strip using `AmbientStateRibbon` plus `FreshnessChip` from `StatusStripAuthority`
   * render the budget-approved primary work region at full prominence
   * resolve any already-known blocker, empty, sparse, or settled posture through local `SurfaceStateFrame` ownership within that primary region
   * render non-promoted `StateBraid`, `EvidencePrism`, assistive surfaces, and context as summary stubs, tabs, or closed drawers
   * restore any valid `SelectedAnchor`
   * subscribe in background

11. If only a last-stable snapshot exists for the same shell and object continuity envelope:

   * hydrate the shell from that last-stable snapshot
   * mark freshness as `updating`
   * keep the current `PrimaryRegionBinding`, `DecisionDockFocusLease`, and last quiet posture visible where still safe
   * keep any region-level stale, blocked, or recovery posture localized through `SurfaceStateFrame` instead of replaying a shell reset
   * do not show a blank reset

12. If no snapshot exists:

   * render bounded skeleton regions only for missing panels
   * attach `SurfaceStateFrame(stateClass = loading)` to unresolved primary or promoted support regions
   * do not block shell creation

13. Establish `ProjectionSubscription` for all required projections.

14. Mark freshness as `updating` until the first authoritative snapshot arrives.

15. When the snapshot arrives:

* patch missing or stale regions in place
* resolve each primary and promoted support region to live content or `SurfaceStateFrame(stateClass = empty | sparse | blocked | settled)` as applicable rather than swapping to a detached page
* use `MotionIntentToken(intent = reveal)`
* do not blank the shell
* do not rebuild unaffected regions
* do not auto-expand secondary context unless safe action requires it
* do not promote calm success or writable posture if `CalmDegradedStateContract` still suppresses it

16. If the entity was already visible in an adjacent state, morph the child work surface rather than recreating the shell.
17. If verification or claim expands access during mount, reveal newly authorized detail progressively inside the current shell.

#### 4.1A Attention budget algorithm

On shell mount, route morph, blocker change, compare request, reopen, or explicit pin toggle:

1. Start from `QuietClarityEligibilityGate.defaultClarityMode` and assume the lowest viable surface count that still satisfies the gate.
2. Set `maxPromotedRegions = 0` for simple patient intake, receipt, and quiet status-tracking views.
3. Set `maxPromotedRegions = 1` for routine review, conversation, booking selection, and ordinary staff operational work.
4. Raise to `maxPromotedRegions = 2` and allow `allowedPlaneCount = 3` only when:

   * a blocking trust conflict and comparison task are both present
   * the user explicitly pins context while compare mode is active
   * diagnostic or support replay mode is requested

5. Choose `promotedSupportRegionRef` by decision priority within the bounds of `EssentialShellFrame.supportRegionBudget` and `StatusStripAuthority.degradeMode`:

   * blocker, stale-trust, or conflict resolution -> `evidence_prism`
   * reopen, return, or materially changed chronology -> `state_braid`
   * active compare task -> `inline_side_stage`
   * policy note or linked context needed for safe action -> `context_constellation`
   * assistive suggestion review -> `inline_side_stage` only when the user requests it or when the suggestion itself is the current review subject

6. If `promotionLockReason != none`, `QuietWorkProtectionLease` is active, or the current `DecisionDockFocusLease` is still protecting a dominant action, freeze the current promoted support region unless the incoming signal is urgent or blocking with strictly higher severity.
7. Apply `promotionCooldownMs` before switching auto-promoted regions for the same `shellContinuityKey` unless the current promoted region no longer explains the active blocker or conflict.
8. Demote all non-promoted support regions to summary stubs, tabs, closed drawers, quiet badges, or localized `SurfaceStateFrame` instances when the region itself is not action-dominant.
9. Never auto-promote more than one support region at a time.
10. When the promotion reason resolves, restore `lastQuietPostureRef` only if the eligibility gate again allows that posture, the current `QuietSettlementEnvelope` is not pending or disputed, and the active `CalmDegradedStateContract` permits ordinary calm reassurance.

#### 4.1B Status suppression algorithm

High-priority suppression gaps in this layer:

1. status cues are compared by surface meaning only, not by causal lineage, so stale transition or save messages can suppress newer blockers from the same entity scope
2. the shared status strip is chosen implicitly, so shell-level, banner-level, and local-control cues can disagree about which state currently owns operator attention
3. suppression windows do not reset on shell restore, continuity fork, or settlement-class change, so a recovered shell can hide newly relevant status
4. acknowledgement is not scoped tightly enough, so dismissing one local cue can accidentally silence a broader blocker or replay the wrong reassurance later
5. resolution and demotion are not bound to one settlement contract, so provisional success, authoritative confirmation, and superseded blockers can collapse into misleading quietness

Build status suppression around these contracts:

**StatusCueRecord**
`statusCueId`, `continuityKey`, `entityScope`, `semanticState`, `blockingReason`, `actionScope`, `severityBand`, `freshnessEnvelopeRef`, `sourceSurfaceRef`, `sourceTransitionEnvelopeRef`, `causalToken`, `cueEpoch`, `createdAt`, `resolvedAt`

**StatusSuppressionLedger**
`statusSuppressionLedgerId`, `continuityKey`, `cueHash`, `lastRenderedCueRef`, `lastRenderedAt`, `lastAcknowledgementRef`, `lastRestoreEpoch`, `suppressionState = active | expired | invalidated`

**StatusArbitrationDecision**
`statusArbitrationDecisionId`, `continuityKey`, `shellFreshnessEnvelopeRef`, `candidateCueRefs`, `statusStripCueRef`, `promotedBannerCueRef`, `localCueRefs`, `surfaceStateFrameRefs[]`, `decisionBasisRef`, `decidedAt`

**StatusAcknowledgementScope**
`statusAcknowledgementScopeId`, `continuityKey`, `statusCueRef`, `ackMode = strip | banner | local_control | batch_apply`, `ackEntityScope`, `ackActionScope`, `ackEpoch`, `createdByActionRef`, `expiresAt`

**StatusCueSettlement**
`statusCueSettlementId`, `statusCueRef`, `settlementState = provisional | authoritative | superseded | resolved | disputed`, `resolutionCueRef`, `settlementToken`, `settledAt`

`StatusPresentationContract` must run before suppression and arbitration so each route family declares which meaning belongs in the shared strip, which stays local to a region, and which may lawfully escalate to banner.

At render and on every delta apply:

1. Resolve the current shell, region, anchor, and any active command-following `ProjectionFreshnessEnvelope` objects before collecting status cues.
2. Collect candidate status cues from save, sync, freshness envelopes, review-required, pending external work, SLA risk, and active `TransitionEnvelope` objects, normalizing each one into `StatusCueRecord` with continuity key, causal token, cue epoch, freshness envelope, and source surface.
3. Collapse equivalent cues only when `semanticState`, `entityScope`, `blockingReason`, `actionScope`, `freshnessEnvelopeRef`, and `StatusCueSettlement.settlementState` all match; provisional and authoritative cues are never equivalent.
4. Hash each remaining cue by `continuityKey + entityScope + semanticState + blockingReason + actionScope + cueEpoch`, consult `StatusSuppressionLedger`, and suppress repeats inside `suppressionWindowMs` only while continuity, restore epoch, settlement class, and freshness-envelope verdict remain unchanged.
5. Run one `StatusArbitrationDecision` to choose exactly one shared-status-strip cue, zero or one promoted banner cue, any remaining local control cues, and any localized `SurfaceStateFrame` owner for the affected region; write the strip outcome into `StatusStripAuthority` and do not let chrome improvise its own independent winner.
6. If the dominant region, selected anchor, or current command-following envelope is `stale_review | blocked_recovery` with `actionabilityState = frozen | recovery_only`, the shared status strip may not render `fresh` or routine quietness even when unrelated regions remain live.
7. Keep control-specific acknowledgement on the initiating control or affected card only, and bind it through `StatusAcknowledgementScope`; local acknowledgement may not silence a broader shell cue unless entity scope, action scope, cue epoch, and freshness envelope all match.
8. Promote to banner only when the state is blocking, urgent, or requires a new user decision and cannot be safely resolved by the shared status strip plus a localized `SurfaceStateFrame`, and only while `StatusCueSettlement.settlementState != resolved`.
9. Suppress routine toasts for save success, fresh projection arrival, and low-risk queue churn, but never suppress a cue whose severity increased, whose settlement changed from provisional to authoritative, whose freshness envelope degraded in actionability, or whose continuity was restored from a different epoch.
10. When a blocking or urgent state resolves, supersedes, or downgrades, emit `StatusCueSettlement` first and then demote it back to the shared status strip or local control state through one stable render pass rather than disappearing abruptly.
11. On shell restore, deep-link re-entry, or continuity-key fork, invalidate stale `StatusSuppressionLedger` rows and recompute `StatusArbitrationDecision` before any prior quiet state is replayed.

Verification for this slice must cover:

- stale suppression ledger invalidation on continuity fork, restore, and route re-entry
- provisional-versus-authoritative cue transitions not collapsing into one suppressed success cue
- local acknowledgement not silencing broader shell-level blockers or unrelated entity scopes
- banner demotion after `StatusCueSettlement` without double-rendering competing strip messages
- repeated low-risk save or sync cues suppressing cleanly while a higher-severity blocker still renders

#### 4.1C Assistive announcement batching and dedupe algorithm

High-priority announcement failures in this layer:

1. surface-local live regions can still speak before shell-level status, focus, and freshness arbitration settle, so users can hear duplicate or contradictory narration
2. batching and dedupe are still too message-text-centric, which lets local acknowledgement, processing acceptance, and authoritative settlement collapse into the same cue
3. restore, reconnect, queue flush, and replay can still sound like fresh user-driven activity because announcement delivery is not explicitly tied to `UIEventEmissionCheckpoint`
4. focus restore and announcement wording can still drift apart, leaving assistive users on one anchor while the announcement describes another
5. timeout and validation surfaces can still repeat their full message on every tick, keystroke, or retry instead of speaking one stable repair state

Build live announcements around these contracts:

**AssistiveAnnouncementIntent**
`assistiveAnnouncementIntentId`, `surfaceRef`, `continuityFrameRef`, `announcementClass = surface_summary | local_acknowledgement | routine_status | authoritative_settlement | blocker | recovery | form_error_summary | timeout_warning | timeout_expired | freshness_actionability`, `announcementPriority = silent | polite | assertive`, `messageRef`, `messageHash`, `sourceSettlementClass = none | local_acknowledgement | processing_acceptance | external_observation | authoritative_outcome`, `selectedAnchorRef`, `dominantActionRef`, `focusTransitionRef`, `freshnessAccessibilityContractRef`, `statusAcknowledgementScopeRef`, `emissionCheckpointRef`, `governingTupleHash`, `intentState = proposed | coalesced | emitted | suppressed | invalidated`, `createdAt`

**AssistiveAnnouncementTruthProjection**
`assistiveAnnouncementTruthProjectionId`, `surfaceRef`, `continuityFrameRef`, `activeIntentRef`, `coalescedIntentRefs[]`, `lowestEventSequence`, `highestEventSequence`, `announcementTupleHash`, `deliveryDisposition = emit | suppress | deduplicate | replay_current_state | invalidate`, `publishedChannel = off | polite | assertive`, `publishedMessageRef`, `focusImpact = none | advisory | required`, `projectionState = collecting | sealed | emitted | superseded`, `publishedAt`

At render, delta apply, restore, recovery, and submit-result time:

1. Resolve the current `SelectedAnchor`, `FocusTransitionContract`, `StatusArbitrationDecision`, `FreshnessAccessibilityContract`, any active `FormErrorSummaryContract`, any active `TimeoutRecoveryContract`, and the latest committed `UIEventEmissionCheckpoint` window before building live announcements.
2. Let each surface contribute `AssistiveAnnouncementIntent` objects only for surface summary, local acknowledgement, routine status, authoritative settlement, blocker, recovery, form error summary, timeout warning or expiry, and freshness actionability changes.
3. Normalize every intent with `announcementClass`, `sourceSettlementClass`, `selectedAnchorRef`, `dominantActionRef`, `governingTupleHash`, and `emissionCheckpointRef`; if a local component cannot provide those fields, it may not publish a live announcement.
4. Batch only `local_acknowledgement`, `routine_status`, and non-blocking `freshness_actionability` intents whose `announcementPriority != assertive` and whose checkpoint window remains inside one continuity frame. `blocker`, `recovery`, `form_error_summary`, and `timeout_expired` bypass routine batching but may still supersede lower-priority queued text.
5. Coalesce candidate intents only when `announcementClass`, `sourceSettlementClass`, `selectedAnchorRef`, `dominantActionRef`, `governingTupleHash`, `StatusAcknowledgementScope`, focus target, and checkpoint sequence window all match. Shared wording alone is never sufficient.
6. `local_acknowledgement` may announce only on the initiating control or affected card unless the pending state outlives the local acknowledgement budget and the shared status strip is now the dominant explanation. It may never reuse the wording or urgency reserved for authoritative settlement.
7. `processing_acceptance` or transport-level progress may widen pending explanation, but it must stay `announcementPriority = polite` and may not emit the same message hash as `authoritative_settlement`, `review_required`, or `recovery_required`.
8. When `FocusTransitionContract` moves focus, the surviving announcement must reference the same target or recovery action. If focus remains anchored, suppress repeated heading or shell-chrome narration and emit only the changed summary.
9. On restore, reconnect, replay, queue batch apply, or buffer flush, do not replay historical intents. Recompute one current `AssistiveAnnouncementTruthProjection` from current truth and emit at most one `replay_current_state` summary per surface and restore epoch.
10. `FormErrorSummaryContract` may emit one assertive summary per blocked-submit epoch; field-level validation after that stays local, polite, or silent until a new submission epoch begins.
11. `TimeoutRecoveryContract` warnings may emit only at declared thresholds or posture changes. Per-second countdown announcements are forbidden; expiry or new loss of writability may escalate once.
12. `FreshnessAccessibilityContract` announcements must describe changed trust or actionability, not raw transport chatter. Autosave, trivial resort, and low-risk list churn stay silent unless the next safe action, dominant action, or selected anchor changed.
13. `AssistiveAnnouncementTruthProjection` is the only source allowed to publish `AssistiveAnnouncementContract`; toasts, local widgets, and chart chrome may render visuals but may not speak independently.
14. Verification must cover restore-epoch dedupe, local-ack versus authoritative-settlement wording, threshold-based timeout warnings, form-error-summary dedupe, and buffered-queue-digest ordering against the preserved anchor.

#### 4.1D Reference implementation shape

Use reducer-style, deterministic front-end code so quiet-mode decisions stay inspectable in review and testable in automation. A TypeScript-style shape is sufficient:

```ts
export type PromotionLockReason =
  | 'none'
  | 'composing'
  | 'comparing'
  | 'confirming'
  | 'reading_delta';

export function deriveAttentionBudget(input: AttentionBudgetInput): AttentionBudget {
  const current = input.currentBudget;
  const rankedSignals = rankSignals(input.signals);
  const clarityMode =
    input.eligibilityGate.eligibilityState === 'diagnostic_required'
      ? 'diagnostic'
      : input.requiresDiagnostic || input.eligibilityGate.eligibilityState === 'expanded_required'
        ? 'expanded'
        : input.eligibilityGate.defaultClarityMode;
  const derivedLockReason: PromotionLockReason =
    input.promotionLockReason !== 'none'
      ? input.promotionLockReason
      : input.hasQuietWorkProtectionLease
        ? 'reading_delta'
        : input.hasDecisionDockFocusLease
          ? 'confirming'
          : 'none';
  const nextRegion = selectPromotedRegion({
    rankedSignals,
    currentRegion: current?.promotedSupportRegionRef ?? 'none',
    promotionLockReason: derivedLockReason,
    cooldownMs: current?.promotionCooldownMs ?? 1200,
    now: input.now,
  });

  return {
    ...current,
    clarityMode,
    maxPromotedRegions:
      input.routeClass === 'quiet_patient' ? 0 : nextRegion.allowCompare && clarityMode !== 'essential' ? 2 : 1,
    promotedSupportRegionRef: nextRegion.region,
    promotionLockReason: derivedLockReason,
    suppressionWindowMs: 2500,
    promotionCooldownMs: 1200,
    lastPromotionAt: nextRegion.changed ? input.now : current?.lastPromotionAt ?? input.now,
  };
}
```

#### 4.1E Surface posture algorithm

For every primary region on mount, refresh, settlement transition, or recovery entry:

1. Create or update one `ProjectionFreshnessEnvelope` for the current shell, region, selected anchor, and any active command-following scope from projection versions, causal tokens, continuity evidence, and transport state before status or CTA render occurs.
2. Create or update one `SurfacePostureFrame` bound to the current shell, active shell and object continuity keys, dominant question, dominant action, the governing freshness envelope, and any valid `SelectedAnchor`.
3. If the active entity is known and a last-stable snapshot exists:

   * keep `CasePulse`, the shared status strip, and the last-stable summary or anchor visible
   * set `postureState = loading_summary`, `stale_review`, `blocked_recovery`, or `read_only` as appropriate
   * explain why live truth is incomplete, stale, or blocked without clearing the primary region

4. If the entity is known but no stable snapshot exists yet:

   * render bounded skeletons inside the existing shell
   * keep shell chrome, route identity, and the primary-region question visible
   * do not replace the whole surface with a full-page loader

5. If the current projection resolves to no results:

   * choose `postureState = empty_actionable` when a safe next step exists
   * choose `postureState = empty_informational` when calm observation is the correct answer
   * preserve filter context, scope context, and any valid anchor rather than swapping in generic empty-state decoration

6. If a command is locally acknowledged but authoritative settlement is still pending:

   * set `postureState = settled_pending_confirmation`
   * preserve the initiating object, consequence summary, and recovery path in place
   * suppress detached success pages, celebratory banners, and history-stack churn

7. If transport disconnects or pauses while projection truth is still within budget, keep the last stable snapshot visible, render transport change through the shared status strip, and degrade the region only if the bound freshness envelope says actionability is no longer safe.
8. On narrow surfaces, fold the same `SurfacePostureFrame` into `mission_stack`; do not compute a second dominant question or competing CTA for mobile.
9. Bind automation and accessibility state from `SurfacePostureFrame.postureState`, `dominantQuestionRef`, `dominantActionRef`, and the current freshness envelope so loading, empty, stale, blocked, and pending states remain testable and screen-reader legible.

#### 4.2 Soft navigation algorithm

When navigating between adjacent views of the same entity:

1. Reuse the existing `PersistentShell`.

2. Preserve:

   * `CasePulse`
   * the shared status strip
   * `DecisionDock`
   * active `PrimaryRegionBinding`, `StatusStripAuthority`, and `DecisionDockFocusLease` where still valid
   * active `QuietWorkProtectionLease` and current `MissionStackFoldPlan` fold state where still valid
   * open `InlineSideStage` where still valid
   * open drawers where still valid
   * current `clarityMode`
   * scroll and focus where safe
   * selected option cards, chosen provider cards, active queue rows, and active comparison context where still valid

3. Update URL by client-side route transition only.

4. Replace or morph only the child work surface in `CaseSpine`.

5. Use `MotionIntentToken(intent = morph or handoff)` for the child surface.

6. Do not blank the whole screen.

7. Do not re-fetch unrelated projections if the current subscription is still valid.

8. Do not detach the user from the working set to inspect a closely related child object if that inspection can be satisfied by `InlineSideStage`.

9. Do not swap to a different shell for booking, messaging, hub, pharmacy, callback, or review work that still belongs to the same request continuity key.

10. Update `QuietClarityEligibilityGate`, `PrimaryRegionBinding.returnTargetRef`, `NavigationStateLedger`, `ContinuityRestorePlan`, and `MissionStackFoldPlan.returnTargetRef` in place rather than resetting the shell epoch.

#### 4.3 Projection delta classification algorithm

For each live delta from `ProjectionSubscription`:

1. Compute an impact profile:

   * `surfaceScope = local | regional | shell`
   * `focusImpact = none | soft | disruptive`
   * `anchorImpact = preserves_anchor | updates_anchor | invalidates_anchor`
   * `trustImpact = none | caution | blocking`
   * `macroStateImpact = none | secondary_axis_only | macro_state_change`
   * `routeImpact = none | child_surface_change | boundary_change`
   * `announcementPriority = silent | polite | assertive`

2. Map the impact profile to one of:

   * `non_disruptive`
   * `contextual`
   * `disruptive`

3. `non_disruptive` deltas:

   * patch immediately
   * use minimal `reveal` or `settle` motion
   * do not disturb the active anchor or focused region

4. `contextual` deltas:

   * patch non-focused areas immediately
   * mark changed sections with changed-since-seen cues
   * if the changed area is currently focused, buffer via `DeferredUIDelta`

5. `disruptive` deltas:

   * buffer if the user is editing, reading a selected case, comparing options, composing a reply, or in a decision-critical step
   * otherwise apply through a controlled `QueueChangeBatch` or explicit patch

6. If `anchorImpact = invalidates_anchor`:

   * keep the prior `SelectedAnchor` visible
   * mark it `invalidated`
   * preserve its label and spatial anchor where possible
   * surface nearest safe alternatives in context
   * do not silently remove the anchor from the user’s mental model

7. If `trustImpact = caution` or `trustImpact = blocking`:

   * update `EvidencePrism`
   * create a diff against the last acknowledged snapshot
   * update `CasePulse.stateAxes.trust`
   * update the shared status strip through `StatusStripAuthority`
   * update `CalmDegradedStateContract` and suppress quiet success language if the current trust or continuity proof no longer supports it
   * update `DecisionDock` blockers or re-check messaging
   * let `CognitiveLoadGovernor` update `AttentionBudget` and auto-promote only the single hidden evidence or context region needed to resolve the blocker
   * demote other support regions to summary posture unless the user pinned them
   * mark the active review surface as `review_required` if policy requires a fresh human check

8. If `macroStateImpact = macro_state_change` and both shell and object continuity remain unchanged:

   * update `CasePulse`
   * append the change to `StateBraid`
   * update the shared status strip through `StatusStripAuthority`
   * keep the shell stable

9. Never force-scroll the viewport to the changed area.

10. Never discard local draft input because of remote updates.

11. Never silently replace a focused decision surface with an unacknowledged remote state.

12. Never mutate browser history or route solely because a live delta arrived.

13. When buffered deltas are waiting, expose a subtle count and summary in the shared status strip or local queue badge without breaking concentration.

14. Live announcements must be bounded and prioritized by `announcementPriority` through the current `AssistiveAnnouncementTruthProjection`; buffered or replayed deltas may emit at most one batch digest for the active surface and continuity frame.
15. When the reason for a temporary promotion clears, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.4 Command and async transition algorithm

For any user action that changes state:

1. Classify the action as:

   * reversible local
   * externally consequential
   * policy-sensitive
   * freshness-sensitive
   * anchor-specific

2. If the action is irreversible, externally consequential, or policy-sensitive:

   * construct `ConsequencePreview`
   * disclose immediate effects, downstream effects, blockers, and fallback actions
   * disclose projected `macroState` and state-axis changes
   * require explicit confirm where policy says so

3. Create `TransitionEnvelope(localAckState = local_ack)` or `TransitionEnvelope(localAckState = queued)` if dispatch is intentionally deferred. If the action owns the dominant shell decision, also create or update `QuietSettlementEnvelope` bound to the current route intent, selected anchor, continuity evidence, and any active release or channel freeze.

4. If the action is anchor-specific:

   * bind the envelope to the relevant `SelectedAnchor`
   * create the anchor if it does not already exist

5. Within the local acknowledgement budget:

   * apply bounded control-level or card-level acknowledgement
   * prefer low-amplitude button compression, label change, or card settle on the initiating element
   * keep the initiating `SelectedAnchor`, current consequence preview, and strongest confirmed artifact visible in place according to `QuietSettlementEnvelope`
   * do not show a generic full-screen spinner

6. If the action is safe for optimistic feedback:

   * apply bounded local visual acknowledgement
   * set `localAckState = optimistic_applied`

7. Send the command.

8. On server acceptance:

   * store returned `causalToken`
   * set `processingAcceptanceState = accepted_for_processing`
   * keep the user in the same shell

9. If further external completion is required:

   * set `processingAcceptanceState = awaiting_external_confirmation`
   * set `QuietSettlementEnvelope.authoritativeConfirmationState = pending`
   * morph the affected anchor or action region into a provisional pending state
   * update the shared status strip
   * keep prior confirmed artifacts visible but clearly subordinate to pending truth

10. When the corresponding projection consumes the `causalToken` or an authoritative completion event arrives:

* set `externalObservationState = projection_visible` at minimum, or the richer observed state carried by the current `CommandSettlementRecord`
* patch the UI in place
* append the result to `StateBraid`
* update `CasePulse`
* resolve the affected region to ordinary live content or `SurfaceStateFrame(stateClass = settled)` only when the current `CommandSettlementRecord.authoritativeOutcomeState = settled` and the user still needs bounded confirmation or a next step
* settle or release the relevant `SelectedAnchor` according to policy
* if the current `CommandSettlementRecord.authoritativeOutcomeState = settled`, set `QuietSettlementEnvelope.authoritativeConfirmationState = settled`
* if the current `CommandSettlementRecord.authoritativeOutcomeState = settled`, set `authoritativeOutcomeState = settled`

11. If returned projection truth materially conflicts with the optimistic or assumed path:

* set `authoritativeOutcomeState = review_required`
* set `QuietSettlementEnvelope.authoritativeConfirmationState = disputed`
* keep the current context visible
* surface diff-first explanation
* block unsafe follow-up actions until the user re-checks

12. On failure or governed expiry:

* revert only the affected local region
* set `authoritativeOutcomeState = failed`, `reverted`, or `expired`
* set `QuietSettlementEnvelope.authoritativeConfirmationState = recovery_required`
* preserve shell and selected anchor context where possible
* resolve the affected region through `SurfaceStateFrame(stateClass = recovery | blocked)` when a retry, repair, or reacquire step is required
* expose a recovery action in `DecisionDock`

13. Under no circumstance may async completion move the user to a visually unrelated page without an explicit entity change.
14. Quiet return after the command is legal only when the bound `QuietSettlementEnvelope` is settled and the current `CalmDegradedStateContract` still permits ordinary reassuring or writable posture.

#### 4.5 Command-following read rule

For components marked `command_following`, define `t_warn = p95_command_following + delta_net`, `t_stale = p99_command_following + delta_net + delta_proj`, and `t_quiet = clamp(k_quiet * emaPatchInterarrivalMs(region), t_quiet_min, t_quiet_max)` from per-surface telemetry and use them to derive `quietEligibleAt` and `staleAfterAt` on authoritative settlement.

1. After a successful command, wait for a projection version that includes the relevant `causalToken`.

2. Until it arrives:

   * keep the old stable entity visible
   * show provisional transition state locally
   * set the bound `ProjectionFreshnessEnvelope(scope = command_following).projectionFreshnessState = updating` and `actionabilityState = guarded`
   * do not hard refresh

3. If the token has not arrived by `t_warn`, keep the shell stable but elevate the local transition to `pending`.

4. If the token has not arrived by `staleAfterAt` when present, otherwise by `t_stale`:

   * set the bound `ProjectionFreshnessEnvelope(scope = command_following).projectionFreshnessState = stale_review`
   * set `actionabilityState = frozen | recovery_only` according to the declared route recovery contract
   * show bounded fallback messaging
   * keep context intact

5. Destructive follow-up actions must remain blocked when required command-following freshness is absent; transport reconnect, cursor movement, or unrelated patch arrival may not clear that block.

6. If transport disconnects before the awaited token arrives, update `transportState = disconnected | reconnecting` on the same freshness envelope without clearing the stale-review or guarded truth posture.
7. If a conflicting authoritative state arrives before the awaited token, convert the transition to `review_required` or `failed`; do not silently settle.

8. Quiet return under this rule is legal only when the awaited token has arrived or a governed pending state has become authoritative, the bound freshness envelope has returned to `projectionFreshnessState = fresh | updating` with `actionabilityState = live | guarded`, `now >= quietEligibleAt`, and no blocker or recovery path remains.

#### 4.6 Focus and composition protection algorithm

If the user is:

* typing
* editing a draft
* composing a reply
* selecting a slot
* comparing hub candidates
* reviewing a focused case
* reading an audit trail or diff
* using keyboard navigation inside a queue
* examining evidence lineage or consequences

then create `QuietWorkProtectionLease(lockReason = composing | comparing | confirming | reading_delta, priorQuietRegionRef = lastQuietPostureRef)` for the active protected region and classify disruptive projection deltas against that protected region `r`:

* `impact(delta,r) = non_bufferable` when `delta` changes safety, identity, lease ownership or validity, lineage fence, route writability, or invalidates the selected candidate or current action with no safe equivalent
* `impact(delta,r) = review_required` when `delta` materially changes evidence or consequence in the protected region but can preserve context long enough for explicit re-check
* `impact(delta,r) = bufferable` otherwise

Apply `non_bufferable` deltas immediately in place and freeze mutating controls. Buffer `review_required` and `bufferable` deltas into `DeferredUIDelta` or `QueueChangeBatch` until:

* idle state is reached
* the draft is saved or submitted
* the comparison is closed
* the user explicitly applies updates

If a `non_bufferable` or `review_required` delta invalidates the current anchor, compare target, writable fence, or protected draft semantics, mark `QuietWorkProtectionLease.leaseState = invalidated`, keep the current draft or compare subject visible as stale-recoverable provenance, and require explicit re-check or governed recovery before mutation resumes.

For every buffered delta set `flushDeadlineAt = min(bufferedAt + T_buffer_max[impactClass], nextKnownActionBoundaryAt)`, where `nextKnownActionBoundaryAt` is the earliest concrete settle boundary implied by `QuietWorkProtectionLease.releaseConditionRef`, the active `QuietSettlementEnvelope`, or the current route recovery contract.

While buffered:

* show a subtle available-update indicator
* preserve current focus and selection
* preserve current queue position and active row
* preserve current draft text
* preserve current comparison anchors
* preserve the current `SelectedAnchor`
* preserve `priorQuietRegionRef` so calm return is deterministic once the protection window ends
* preserve the active `DecisionDockFocusLease`, `PrimaryRegionBinding`, and any visible `MissionStackFoldPlan` blocker stub

If buffered updates invalidate the current action, or if `now >= flushDeadlineAt` and the pending batch is not purely `bufferable`:

* mark the relevant region as `review_required`
* keep the current context visible until the user acknowledges the change
* land re-check emphasis on the changed region first, not on a generic page top

When the user explicitly applies updates, or when a purely `bufferable` batch reaches `flushDeadlineAt`:

* settle the active anchor region first
* then settle peripheral regions
* coalesce patches within `delta_batch_calm` so the user sees one calm settlement rather than jittery micro-refreshes
* do not reorder the entire shell before the focused region is stable
* release `QuietWorkProtectionLease` only after the focused region is stable and the active `DecisionDockFocusLease` or `QuietSettlementEnvelope` no longer requires protection
* once the focused region is stable and no blocker remains, restore the last quiet posture unless the user pinned a richer view

#### 4.7 Degraded and disconnected algorithm

On transient subscription loss, backend lag, or partial capability failure:

1. Keep the last stable UI state visible and bind or update `CalmDegradedStateContract` for the current trust, completeness, and freeze posture.
2. Resolve `SurfaceStateFrame(stateClass = stale | degraded | recovery)` for each affected primary or promoted support region and update the shared status strip in the same render pass through `StatusStripAuthority`.
3. Suppress quiet success language or writable reassurance whenever `CalmDegradedStateContract.settlementSuppressionState != normal`.
4. Disable only those actions that require fresh authoritative state or a still-valid capability grant.
5. Continue local draft capture where safe.
6. Keep `DecisionDock`, `CasePulse`, `StateBraid`, any current `SelectedAnchor`, and the current `ContinuityRestorePlan` visible.
7. If only artifact parity, preview capability, or handoff eligibility degrades, downgrade the current `ArtifactStage` in place to governed summary or read-only provenance rather than dropping the user out of the shell.
8. Allow manual refresh, resume, re-auth, or reacquire where appropriate without destroying shell context.
9. Resume live patching automatically when the connection or capability recovers, health remains good for `T_resume_stable`, and the current route intent, continuity evidence, and freeze posture revalidate; then apply queued deltas as one calm batch.
10. Do not clear the page or destroy the active shell.
11. Only on unrecoverable projection or schema divergence may the shell be replaced with a bounded recovery surface, and that surface must preserve the active anchor, restore plan, and nearest safe return target.

#### 4.8 Inline side-stage algorithm

When a user opens a related row, candidate, message, or compare target:

1. Open an `InlineSideStage` attached to the host surface.
2. Keep the originating working set visible.
3. Preserve keyboard focus order and return focus to the invoker on close.
4. Support compare mode for multiple related candidates where relevant.
5. Preserve draft or partially entered text within the side stage until explicit discard or commit.
6. Do not replace the whole entity shell for adjacent inspection or compare work unless a true entity switch is requested.
7. If the side-stage subject shares the same shell continuity and allowed object adjacency, inherit the shell and anchor-preservation rules.

#### 4.9 Evidence and diff algorithm

Whenever new material evidence enters an active case:

1. Classify it through `EvidenceLineageResolver`.

2. Insert it into `EvidencePrism` with source, freshness, and trust class.

3. Compute diff against the last acknowledged evidence snapshot.

4. Surface the changed regions first on reopen or resume flows.

5. If the new evidence conflicts with a previously confirmed fact:

   * keep the prior fact visible
   * mark the conflict explicitly
   * do not silently overwrite the prior fact

6. If a pending action depends on evidence that is now stale, conflicted, or superseded:

   * block unsafe commit
   * explain the reason in `DecisionDock`
   * mark the relevant review path as `review_required`

#### 4.10 Selected anchor lifecycle algorithm

When a user selects a slot, provider, pharmacy, queue row, comparison candidate, or equivalent focal object:

1. Resolve the active route family's `SelectedAnchorPolicy`, create or update the primary `SelectedAnchor`, and write it into `NavigationStateLedger`.

2. Preserve the anchor’s `anchorTupleHash`, label, local position reference, visual identity, and policy-defined return role throughout validation and async work.

3. While the anchor is being validated or is awaiting external completion:

   * set `stabilityState = validating` or `pending`
   * morph the anchor in place
   * keep it visibly connected to the command that caused the transition
   * do not let a competing anchor, neighbor row, or secondary CTA replace the current primary anchor slot

4. If the anchor becomes invalid:

   * set `stabilityState = invalidated`
   * keep the anchor visible as an invalidation stub or return stub according to `SelectedAnchorPolicy.invalidationPresentationRef`
   * explain the invalidation in context
   * present nearest safe alternatives without removing the original anchor first or recycling its card shell for a different tuple

5. If the route performs a same-shell object switch, demote or preserve the departing primary anchor exactly as `RouteAdjacencyContract.anchorDispositionRef` and `SelectedAnchorPolicy.replacementRequirementRef` require, and bind the departing and replacement tuple hashes explicitly before the new object becomes dominant.

6. Release or replace the anchor only when:

   * the transition settles with a confirmed replacement and any acknowledgement required by `SelectedAnchorPolicy.replacementAckRequirementRef`
   * the user explicitly dismisses it
   * a true shell-boundary entity switch occurs

7. On refresh, browser back or forward, and same-shell recovery, restore anchors in the order named by `SelectedAnchorPolicy.refreshRestoreOrderRef`; restore the exact `anchorTupleHash` first and degrade to invalidation or return stub when that tuple is no longer available.

8. If the anchor is referenced in a receipt, timeline event, or downstream status card, preserve lineage wording so the user can recognize the same object across states.

#### 4.11 Artifact rendering and handoff algorithm

On entry to an artifact-bearing route, inline artifact open, print or export request, or governed external handoff:

1. Resolve the active `ArtifactPresentationContract`, `ArtifactSurfaceBinding`, visibility tier, summary safety tier, shell and object continuity envelopes, current `ArtifactParityDigest`, and any required delivery or `OutboundNavigationGrant`.
2. Create or update one `ArtifactSurfaceContext`, one current `ArtifactModeTruthProjection`, and one `ArtifactSurfaceFrame` bound to the current shell, source artifact hash, parity state, selected anchor, return target, and `truthTupleHash`, then open or reuse one `ArtifactStage` inside the same shell.
3. Render in this order:

   * artifact title, provenance, freshness, and trust or parity state
   * structured summary or governed placeholder as the default `ArtifactStage.currentMode`
   * inline preview only when `primaryPresentation = inline_preview`, the contract permits richer preview, `ArtifactModeTruthProjection.currentSafeMode = governed_preview`, and the user explicitly requested it
   * secondary delivery actions in overflow or subordinate controls only

4. If `sourceParityState = provisional`, `stale`, or `blocked`, or if `ArtifactModeTruthProjection.previewTruthState = preview_provisional | preview_blocked`:

   * keep the summary visible
   * annotate the provisional or blocked state explicitly
   * downgrade the `ArtifactStage` in place to governed summary, read-only provenance, or handoff-only posture as required
   * promote the current `ArtifactFallbackDisposition` whenever preview, print, or handoff is no longer lawful
   * freeze preview, print, export, or handoff actions that require verified parity

5. Download, print, export, and external handoff may execute only through the resolved grants, one live `ArtifactTransferSettlement`, and only while continuity, scope, route lineage, session posture, and the relevant `ArtifactModeTruthProjection` transfer state still match.
6. Embedded or constrained-browser shells may not attempt unsupported print, oversized byte delivery, or browser-only preview. If `ArtifactModeTruthProjection.currentSafeMode = structured_summary | secure_send_later | placeholder_only | recovery_only`, the shell must stay summary-first and promote the declared fallback in place.
7. Grant expiry, mask-scope drift, parity failure, byte-grant supersession, bridge-capability drift, or stale return continuity must return the surface to in-place recovery with the last safe summary still visible through `ArtifactFallbackDisposition`; raw artifact URLs and detached download-success pages are forbidden.
8. When the artifact closes or a handoff returns, read final readiness from `ArtifactTransferSettlement.authoritativeTransferState`, then restore focus to the initiating anchor or the stable return target recorded in `ArtifactSurfaceFrame.returnTargetRef` or `ArtifactStage.returnAnchorRef` only while the current `ArtifactModeTruthProjection.returnTruthState` still keeps that return path lawful.

### 5. Patient lifecycle experience algorithm

#### 5.1 Patient macro-state mapping

All patient-visible request surfaces must map internal state into one of:

* `drafting`
* `received`
* `in_review`
* `we_need_you`
* `choose_or_confirm`
* `action_in_progress`
* `reviewing_next_steps`
* `completed`
* `urgent_action`

Rules:

1. `CasePulse.macroState` is the single top-level state language for patients.
2. Booking, hub, pharmacy, callback, and messaging states must map into this same set.
3. Detailed internal state may appear in timeline entries, but must not contradict the top-level macro state.
4. Patient wording must be calm, explicit, and consequence-aware.
5. `received`, `in_review`, `action_in_progress`, and `reviewing_next_steps` must remain living shells with visible last meaningful update, next expected step, and freshness state; they must not collapse into dead status pages.
6. `stateAxes` may provide secondary cues for urgency, trust, ownership, and interaction posture, but must remain subordinate to the shared patient macro state.
7. Patient shells must foreground one next step and one current status at a time; secondary detail belongs in progressive disclosure.

#### 5.2 Intake and draft algorithm

During intake:

1. Render the draft in one continuous shell.

2. On mobile and narrow surfaces, use `mission_stack`.

3. Form progression must behave like a structured interview, not a paperwork dump.

4. Patient and public flows should default to one question or one tightly related decision at a time unless repeat-use evidence shows that a merged step is faster and clearer.

5. Conditional questions must reveal in place from the control or section that triggered them.

6. Autosave must update the shared status strip as:

   * `saving`
   * `saved`
   * `failed`

7. On autosave success:

   * use `MotionIntentToken(intent = settle, timingBand = instant or standard)`
   * do not show disruptive toast if the save is routine

8. Attachment upload must remain inside the same shell as a persistent tray or panel.

9. If a sync conflict occurs:

   * keep the current draft visible
   * show a bounded merge or review layer
   * never dump the user to a generic error page

10. Field-level validation, upload retry, and partial save failure must remain local to the affected region and must not reset scroll.

11. Bounded help, hints, or supporting detail should open in side stages, drawers, or in-place reveals rather than full navigation.

12. Inline summaries, previous answers, and saved details should support recognition over recall and must not duplicate the full form unless the user requests review mode.
13. In `clarityMode = essential`, only the current question, one short rationale or help region, and one next action may be expanded at once; additional explanation must replace the current helper region rather than stack beneath it.

#### 5.3 Submission to receipt morph algorithm

On successful submission:

1. Do not navigate to an unrelated receipt page with a blank reset.
2. Transform the draft review surface into the receipt surface in place.
3. Preserve the summary of what was just submitted, including attachment references where relevant.
4. Append a receipt event to `StateBraid`.
5. Update `CasePulse.macroState` to `received` or `in_review`.
6. Surface next steps immediately in the same shell.
7. If downstream triage status or acknowledgement arrives shortly after submit, patch the current shell in place; do not perform a second page transition solely to show that change.

#### 5.4 Claim, secure-link, and embedded access algorithm

When access scope changes because of sign-in, claim, verified continuation, or embedded deep link:

1. Preserve the current shell and active request where possible.
2. Keep the same `CasePulse`.
3. Verify the current `SessionEstablishmentDecision`, `CapabilityDecision`, `subjectRef`, `sessionEpoch`, `subjectBindingVersion`, and `routeIntentRef` before any newly authorized detail is revealed. Signed-in state alone is not enough: `auth_read_only`, `claim_pending`, and `writable` are distinct post-auth outcomes. If the route was reached through a secure link, continuation `AccessGrant`, or NHS App embedded path, also verify the applicable grant fence: `visibilityGrantRef` for embedded or public visibility routes, or the current secure-link session posture (`accessGrantRef`, `grantScopeEnvelopeRef`, `accessGrantRedemptionRef`, `grantSupersessionRef`, `tokenKeyVersionRef`, `fenceState`, and `proofState`) for secure-link recovery and continuation routes.
4. For embedded routes, also verify the current `manifestVersionRef`, `releaseApprovalFreezeRef`, any active `channelReleaseFreezeRef`, the current `BridgeCapabilityMatrix`, and `PatientEmbeddedNavEligibility` carried by the route contract before enabling embedded-only actions or file delivery.
5. Reveal newly authorized sections progressively only after the applicable session-establishment, access, grant, and embedded-continuity fences succeed. If `writableAuthorityState = auth_read_only | claim_pending`, reveal only that narrower posture and keep mutation affordances suppressed.
6. Do not reveal patient-linked detail before the relevant access grant or challenge completes.
7. If any fence drifted or the active embedded channel is frozen, keep the same shell and morph to bounded recovery or read-only posture; do not redirect through a generic `continue` page.
8. Use a `reveal` or `morph` semantic transition, not a disruptive redirect, unless a true auth boundary requires shell replacement.
9. If the shell continuity key is unchanged and the active object adjacency still validates, do not reset the request, receipt, or active conversation thread.

#### 5.5 Unified care conversation algorithm

For every patient request:

1. Render one `ConversationThreadProjection`.

2. Build that thread from the current `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, `PatientCallbackStatusProjection`, current `PatientComposerLease`, and the ordered `ConversationSubthreadProjection` plus `CommunicationEnvelope` tuples bound to one `threadTupleHash`.

3. The thread must unify:

   * clinician messages
   * follow-up questions
   * callback expectations and outcomes
   * reminder notices and callback fallback
   * patient replies
   * actionable instructions linked to the same request

4. Each visible item must preserve its typed subthread meaning, including owner, reply target, expiry, and governing branch, even when the UI renders a calmer unified chronology.

5. The current required action must be pinned above or within the thread.

6. Show the latest relevant items first in quiet mode, with full history available on demand.

7. New thread items and typed subthread state changes must insert in place through `CommunicationEnvelope` with changed-since-seen markers.

8. Reply submission must remain in the same shell and create a `TransitionEnvelope`.

9. If the reply returns the case to review, the UI must morph to `in_review` without page reload.

10. Callback prompts, reminder failures, more-info questions, and instruction acknowledgements must not fork to unrelated pages or disconnected mini-flows for the same request.
11. In `clarityMode = essential`, keep either the current required action composer or the latest relevant history cluster expanded, not both; older history stays collapsed until requested.
12. If `threadTupleHash`, the selected `subthreadTupleHash`, visibility posture, or continuity evidence drifts, the shell must freeze mutating controls and recover the same anchor in place rather than resetting to a generic message center.

#### 5.5A Patient record and results visualization algorithm

1. Patient record routes must open inside the signed-in patient shell with the same primary navigation and the same quiet posture as requests, appointments, and messages.
2. The record overview must foreground latest changes, action-needed items, and last-updated metadata before full chronology.
3. Each result detail must render a patient-safe title, plain-language summary, measured value and range, trend or comparison, next step, and source metadata in that order.
4. Charts are optional compare surfaces only; one `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection` are required, and the visual, summary, and table views must agree on row set, units, comparison meaning, current selection, and freshness posture.
5. When detail is sensitivity-gated, explain why, preserve shell context, and surface the safest next action instead of a blank or generic access-denied state.
6. Documents and letters should prefer structured in-browser rendering with file download as a secondary action when policy allows.
7. In `clarityMode = essential`, expand one record card, one result detail, or one document summary at a time; technical detail stays behind a clearly labeled disclosure.
8. Record routes linked to an active request, appointment, or message thread must preserve lineage links and return paths without changing the owning shell unless the canonical entity changes.
9. If release, visibility, or freshness posture degrades below parity-safe detail, the same result anchor must remain visible but the visualization must degrade in place to `table_only`, `summary_only`, or governed placeholder posture; a chart may not continue implying trend or comparison meaning that the current table or summary cannot lawfully reproduce.

#### 5.6 Booking, waitlist, hub, and pharmacy continuity algorithm

1. Booking, waitlist, hub alternatives, and pharmacy progression for the same request must reuse the same request shell.

2. Selected option cards must persist through `SelectedAnchor`.

3. The default booking and routing surface should be a calm ranked list or table. Spatial views such as booking orbit or network lattice are optional compare modes and must have an accessible list or table fallback.

4. Slot selection, confirmation, alternative selection, or pharmacy choice may have distinct route contracts, but they must render as adjacent child states inside the same shell and expand inline or in a bounded sheet or drawer rather than resetting the page.

5. Confirmation pending must render as a provisional in-place state on the selected card.

6. Selected slot, waitlist-offer, and alternative-offer cards that render reservation language or urgency must bind one current `ReservationTruthProjection`; selection state, interaction TTL, or offer expiry alone may not imply reservation truth.

7. Confirmation-pending, booked-summary, reminder-ready, manage-ready, receipt, export, print, and browser-handoff posture must bind one current `BookingConfirmationTruthProjection`; any live booking or manage CTA on the same surface must also bind the same current `BookingCapabilityProjection` and `BookingProviderAdapterBinding`, so local acknowledgement, provider acceptance, raw appointment-object presence, notification dispatch, or supplier badges alone may not imply final booking truth.

8. If no true hold exists:

   * do not show hold countdown
   * do not imply exclusivity

9. Waitlist and hub offers must reuse the same action language and card grammar as booking.

10. Pharmacy instructions and status must keep the chosen provider card visually persistent.

11. If a selected option becomes invalidated, keep it visible, mark it invalidated, and present nearest safe alternatives in context without losing the request shell.
12. In `clarityMode = essential`, only one candidate detail or compare surface may be expanded at a time; opening another must collapse the previous one unless the user explicitly enters compare mode.

#### 5.7 Reopen and bounce-back algorithm

When a request reopens or a downstream path returns work:

1. Keep prior confirmed artifacts visible but visually superseded.
2. Change `CasePulse.macroState` to `reviewing_next_steps` or `urgent_action` as appropriate.
3. Insert the return event into `StateBraid`.
4. Surface the new next action in the existing `DecisionDock`.
5. Use `MotionIntentToken(intent = reopen)` to signal reversal without disorientation.
6. Land the user on the changed evidence, changed instructions, or changed options first rather than forcing a full re-read.
7. If reopening was triggered by new external information or a conflicting confirmation, present a diff-first summary before expanding the full history.

### 6. Staff, hub, support, and operations experience algorithm

#### 6.1 Staff queue algorithm

For active worklists:

1. `QueueLens` is the default queue surface; simple table rendering is a fallback mode, not the only mode.

2. The selected row or card must remain pinned while open.

3. New work must enter through `QueueChangeBatch`.

4. Priority changes for the focused item must appear as local signals, not forced list jumps.

5. Background items may reorder only when:

   * the user is idle
   * the user applies queued updates
   * the queue is not in active focused use

6. Keyboard position and focus must be preserved.

7. Bulk action controls must remain stable while the queue updates.

8. Queue surfaces may enter buffered or paused mode while the user is reading, typing, or deciding; queued changes must remain visible as a count and summary without displacing the current item.

9. Opening a case must not destroy or forget the current working set.
10. When a case is active, demote secondary queue summaries, charts, and board widgets to a slim index or collapsed stubs; the review canvas must remain the dominant surface.

#### 6.2 Case review algorithm

On opening a case:

1. Keep queue, review canvas, and decision surface within one stable shell.

2. Default to `two_plane` composition:

   * context and patient or request summary in the main review canvas
   * `DecisionDock`

3. Reveal `EvidencePrism` as a summary by default and expand it only when conflict, staleness, blocker state, or explicit reviewer intent requires deeper inspection.

4. New evidence must land as highlighted deltas wherever possible.

5. If a case reopens with new material:

   * default to diff-first presentation
   * do not force full case re-reading without highlighting changes

6. Assistive suggestions must appear in a supplementary rail or drawer and must not reflow the primary content unexpectedly.

7. Any material change to evidence, endpoint, approval state, or merge lineage must invalidate stale decision assumptions and require explicit re-check before commit.

8. If endpoint, ownership, or merge lineage changes while a review is open, keep the prior judgment context visible with explicit supersession markers rather than silently replacing it.
9. In routine review, `EvidencePrism`, `StateBraid`, `ContextConstellation`, and assistive suggestions may not all remain fully expanded together; `AttentionBudget` must promote only the single support region most relevant to the current decision.
10. When a conflict, blocker, or compare posture resolves, the review shell must return to the last quiet posture unless the reviewer explicitly pinned more detail.

#### 6.3 Booking and network comparison algorithm

For booking and network decision surfaces:

1. Start with a ranked list or table. Spatial comparison views may be used for slots, candidates, or routes, but must always have an accessible fallback representation and may not be the only first view.

2. The selected candidate must remain visually persistent through validation, provisional pending, and confirmation.

3. Constraint changes must reshape the visible option field without losing the selected anchor where still valid.

4. Alternatives should remain visible before the current route fully fails, when policy allows.

5. If a chosen option becomes invalid during review:

   * keep it visible
   * mark it invalidated
   * present nearest safe alternatives in context

6. Comparison surfaces may patch non-focused candidates live but must buffer changes that would reflow the selected candidate under pointer or keyboard focus.
7. In `clarityMode = essential`, only one candidate detail or comparison side stage may be expanded automatically; multi-candidate compare is an explicit mode, not the resting state.

#### 6.4 Hub and pharmacy desk algorithm

For hub and pharmacy operational surfaces:

1. Ranking changes must use low-amplitude, non-jarring motion.
2. Time-sensitive states must be represented through ambient urgency cues, not flashing or aggressive motion.
3. Practice acknowledgement pending, dispatch pending, or confirmation pending must remain local to the active card or pane.
4. Returning work must reopen in the same shell with clear diff and status cues.
5. Chain-of-custody or acknowledgement events must enter `StateBraid` rather than disappear into detached logs.
6. Chosen practice, provider, or pharmacy cards must persist as `SelectedAnchor` objects through pending, invalidation, failure, and settlement.

#### 6.4A Pharmacy console mission-frame algorithm

For prescription-validation, stock-aware fulfilment, and pharmacy assurance surfaces:

1. The console must render through the existing pharmacy shell with `layoutTopology = two_plane` and `clarityMode = essential` by default.
2. Only one medication line item or checkpoint may be expanded automatically at a time unless compare or supervisor-review mode is explicitly entered.
3. The active medication line, selected stock lot, and chosen intervention path must persist as `SelectedAnchor` objects through pending, invalidation, failure, refresh, and settlement.
4. Hard-stop safety failures, expired or quarantined stock, identity or prescriber mismatch, and governed override requirements must promote exactly one blocker-focused support region and suppress non-essential chrome.
5. Inventory freshness must be explicit; stale stock truth must disable release actions until refreshed or routed through a governed override path.
6. Irreversible actions such as substitution, partial supply, handoff release, or case reopen must render through an inline `DecisionDock` fence with `ConsequencePreview`, not modal stacks that break continuity.
7. When blocker, compare, or assurance work resolves, the shell must return to the last quiet posture with the active line item and checkpoint preserved.

#### 6.5 Support and replay algorithm

For support and investigation surfaces:

1. Default to `two_plane` composition with queue or workboard context on one side and the active `SupportTicket` mission frame in the main plane.
2. The mission frame must unify ticket summary, one current `SupportLineageBinding`, omnichannel timeline, and one active response or recovery form without route-breaking context switches.
3. `SupportSubject360Projection`, `SupportKnowledgeStackProjection`, policy notes, and replay controls must enter as summary cards, tabs, or quiet chips by default; `AttentionBudget` may auto-promote only one of them at a time.
4. In `clarityMode = essential`, keep either the active composer or recovery form, or the latest unresolved history cluster expanded; older history stays collapsed until requested.
5. Switching from conversation to recovery, escalation, or resolution must preserve draft state, scroll position, and the selected message or event anchor.
6. Knowledge-base articles, macros, and playbooks must open inline or in a bounded side stage with freshness and applicability cues; they must not navigate the agent away from the ticket.
7. The promoted knowledge region must be backed by a live `SupportKnowledgeStackProjection` and `SupportKnowledgeBinding`; if ticket version, selected anchor, policy version, mask scope, or runtime publication drifts, the rail must degrade in place to summary-only, observe-only, or refresh-required posture instead of leaving stale guidance armed.
8. Macro apply, playbook launch, fallback-channel suggestion launch, and `knowledge_gap` capture must require a live `SupportKnowledgeAssistLease`; if the action changes the active response or recovery path, it must settle through `SupportActionRecord`, `SupportActionSettlement`, and the active `TransitionEnvelope`.
9. Any reveal from summary into deeper history, linked-object detail, or break-glass-supported subject context must create a reason-coded `SupportContextDisclosureRecord`; expiry or revocation must collapse that reveal back into governed summary without ejecting the agent from the ticket.
10. Replay and timeline inspection must occur within a stable shell.
11. Live updates must be pausable.
12. Pausing live updates must preserve current context while new events queue in the background.
13. Resuming live updates must apply queued changes in an ordered, reviewable way.
14. Replay exit, observe return, and support deep-link restore must revalidate the current replay checkpoint or observe session, mask scope, selected anchor, current `SupportLineageBinding`, held draft disposition, and latest settlement chain before any live control re-arms.
14A. If support replay was opened from `/ops/audit` or another governed investigation route, restore must also preserve the same `InvestigationScopeEnvelope.scopeHash`, `InvestigationTimelineReconstruction.timelineHash`, and diagnostic question until a superseding investigation scope is explicitly issued; replay may not quietly reframe the case while reopening live controls.
15. If restore proof fails or any linked action is still awaiting external confirmation, the shell must remain on the same ticket in provisional or read-only recovery posture with the replay breadcrumb and draft summary still visible.
16. Support actions such as link reissue, communication replay, attachment recovery, identity correction, or access review must open in bounded side panels or drawers, not context-destroying page swaps.
17. Replay surfaces must provide event grouping, diff markers, explicit freshness state, and a clear return-to-ticket control.
18. Re-entering the queue from an active ticket must restore the previous working set, filter state, and keyboard position.

#### 6.6 Operations board algorithm

For real-time operational boards:

1. Tiles, tables, and strip metrics must update in place and retain stable object identity.
2. Operations shells must default to `two_plane` composition with a dominant anomaly field in the main plane and a persistent `InterventionWorkbench` in the secondary plane.
3. `three_plane` is allowed only for explicit compare, incident-command, or deep diagnostic work; it may not be the resting state of `/ops/overview`.
4. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` are the canonical overview surfaces; no operations landing page may substitute a wall of unrelated charts for that structure.
5. One current `OpsBoardPosture` plus one `OpsProminenceDecision` must decide `dominantQuestionRef`, `dominantActionRef`, promoted surface, and secondary summaries for the shell; individual tiles may request elevation but may not self-promote.
6. Only one board region may hold escalated visual priority at a time; `BottleneckRadar` owns dominant visual weight while `InterventionWorkbench` owns dominant action weight, and `ServiceHealthGrid` or `CohortImpactMatrix` may expand beyond summary posture only when the same decision promotes them or the operator explicitly pins compare or diagnostic context.
7. Operators must be able to pause live updates during diagnosis, planning, or incident command.
8. Active hover, keyboard focus, compare, compose, or investigation on an operations surface must mint one `OpsFocusProtectionFence`; while the fence is active, resorting, dominant-region swaps, auto-expand or collapse, and highlight transfer must freeze and live deltas must patch in place or buffer into queued summaries.
9. Threshold-cross promotion and demotion must use `OpsEscalationCooldownWindow` with explicit entry and exit criteria so borderline anomalies cannot thrash the board.
10. Staleness must be visible at shell, board, and component level.
11. Critical threshold breaches may elevate presentation tone, but must not hijack the user’s viewport.
12. Resource reallocation proposals must present current state, projected relief, confidence, and policy guardrails before commit.
13. Drill-in from the board must open an `InvestigationDrawer` or continuity-preserving split view and must serialize an `OpsReturnToken` so the operator can return without losing filters, scroll, selected anomaly, or horizon.
13A. `ServiceHealthGrid`, health drill paths, health action posture, and calm stable-service posture must resolve one current `EssentialFunctionHealthEnvelope` per essential function in scope; no health surface may appear healthier, calmer, or more actionable than the bound envelope.
13B. Time-bounded fallback, constrained mitigation, active channel freeze, degraded trust, or recovery-only posture for an essential function must render directly in the affected health cell and in stable-service watch posture; hidden side panels, tooltip-only warnings, or decorative green summaries are invalid.
13C. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, and `CohortImpactMatrix` must each bind one `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection`; heat cells, trend strips, confidence bands, and matrices may not carry severity, ranking, comparison direction, or selection meaning that the summary and table fallback cannot reproduce from the same parity tuple.
13D. If freshness, masking, release, or trust posture degrades, the board must keep the last safe summary and selected scope visible but downgrade the affected surface to `table_only`, `summary_only`, or placeholder posture with timestamps and next safe action; chart or heat intensity alone may not imply live authority.
14. Promoted anomalies, intervention targets, and health nodes must hold explicit selection leases bound to the current board snapshot tuple; when the tuple, trust posture, release posture, or governing prominence inputs drift, actions degrade in place to `stale_reacquire`, `observe_only`, or read-only recovery rather than silently retargeting a live CTA.
15. Paused-live, compare, diagnostic, and incident-command modes must open a delta gate against a preserved board basis; queued deltas may inform diagnostics, but they may not re-arm commit-ready controls or trigger a new dominant surface until the gate resolves to deterministic apply or explicit reacquire.
16. Batched board changes must animate as grouped settlement through `OpsMotionEnvelope`; `changeCause` must distinguish live delta, threshold cross, batch apply, route morph, restore, degraded mode, and manual pin, and reduced-motion equivalents must preserve the same causal meaning.
17. High-churn metrics must favor calm value morphs or number updates over repeated resorting that breaks scanability.
18. Launching from an operations board into a request, incident, audit trace, queue entity, or specialist workspace must preserve originating board context and support one-step return, but return may restore writable posture only after the current board tuple, route intent, selection lease, trust-freeze verdict, governing prominence inputs, and, for audit pivots, the preserved `InvestigationScopeEnvelope.scopeHash`, `InvestigationTimelineReconstruction.timelineHash`, and selected-anchor tuple all revalidate.
19. Full operations-console interaction, hierarchy, and drill-down rules are defined in `operations-console-frontend-blueprint.md`.

### 7. Canonical motion, accessibility, and verification system

High-priority motion-system defects in this layer:

1. motion intents overload action submission and authoritative settlement under `commit`, so invalidation, recovery, and settlement cues can collapse into one ambiguous animation
2. region-level motion competition is under-specified, so shell, card, ribbon, and local-control motion can still animate at the same time without one authoritative winner
3. timing bands are ranges only; there is no deterministic duration, delay, easing, or amplitude model to keep controls, cards, queues, and shell strips aligned
4. reduced-motion rules cover visual simplification, but not explicit keyboard, screen-reader, and sequencing equivalence
5. the system does not yet define degraded-performance fallback when churn, low power, or frame instability make semantic motion unsafe
6. verification is implied, but the motion layer does not yet produce deterministic traces that tests can assert against

Add the supporting motion and verification contracts:

**MotionCueEnvelope**
`motionCueEnvelopeId`, `continuityKey`, `motionIntent`, `causalToken`, `targetAnchorRef`, `targetRegionRef`, `targetScope = initiating_control | selected_anchor | local_region | shell_status_strip | recovery_region`, `settlementPhase = local_ack | provisional | authoritative | invalidated | recovered | superseded | resolved`, `delayMs`, `durationMs`, `easingTokenRef`, `amplitudePx`, `staticEquivalentRef`, `suppressionState = active | merged | deferred | static_only | cancelled`, `createdAt`

`MotionCueEnvelope` is the source of truth for visible motion. Every animation, emphasis pulse, or static degraded equivalent must derive from one cue envelope that knows what changed, where it changed, and whether the change is local acknowledgement, provisional truth, authoritative truth, invalidation, or recovery.

**MotionRegionArbitration**
`motionRegionArbitrationId`, `continuityKey`, `targetRegionRef`, `candidateCueRefs[]`, `dominantCueRef`, `mergedCueRefs[]`, `deferredCueRefs[]`, `staticCueRefs[]`, `arbitrationWindowMs`, `dominantUntilAt`, `decisionReasonRef`, `decidedAt`

`MotionRegionArbitration` prevents motion pile-up. A region may have many candidate updates, but only one dominant cue may animate at full emphasis at a time; the others must merge, defer, or settle statically according to policy.

**ReducedMotionProfile**
`reducedMotionProfileId`, `profileState = full | reduced | minimal | static_only`, `triggerClassRefs[] = user_preference | low_power | low_frame_stability | live_churn | assistive_context`, `maxAnimatedRegions`, `maxTransformPx`, `maxScaleDelta`, `maxOpacityDelta`, `loopAllowanceState = never | determinate_only`, `keyboardSequencingMode`, `screenReaderAnnouncementMode`, `staticEquivalentPolicyRef`, `effectiveUntil`

`ReducedMotionProfile` makes accessibility and runtime degradation explicit. It is the runtime clamp over the active design-token `motionMode`. Reducing motion must not alter the causal order of announcements, focus movement, or interaction readiness, and users must still understand provisional, authoritative, invalidated, recovered, and failed states without perceiving animation.

**AccessibilityEquivalenceCheck**
`accessibilityEquivalenceCheckId`, `motionCueRef`, `focusPathRef`, `announcementSequenceRef`, `nonVisualOutcomeRef`, `equivalenceState = verified | degraded | blocked`, `checkedAt`

`AccessibilityEquivalenceCheck` proves that non-visual and reduced-motion users receive the same operational meaning as full-motion users. Motion is not considered valid if focus, announcement order, or meaning diverges.

**MotionVerificationTrace**
`motionVerificationTraceId`, `uiEventRef`, `motionCueRefs[]`, `arbitrationRefs[]`, `reducedMotionProfileRef`, `staticEquivalentRefs[]`, `renderOutcomeRef`, `overlapCount`, `traceState = complete | incomplete | mismatch`

`MotionVerificationTrace` is the deterministic test artifact for motion behavior. Playwright and runtime diagnostics must be able to inspect what cue fired, what region won arbitration, what accessibility or degradation mode was active, whether any overlap occurred, and whether the rendered outcome matched policy.

#### 7.1 Motion intent meanings and hierarchy

Canonical visible phases for one causal token:

1. `local_ack` belongs on the initiating control only.
2. `provisional` belongs on the affected object or `SelectedAnchor`.
3. `authoritative`, `invalidated`, or `recovered` lands on the affected object first, then mirrors statically into `CasePulse`, `StateBraid`, or the shared status strip.
4. `resolved` is static only. Once resolved, the same cue may not continue animating.

Required semantic intents:

* `reveal`: disclose new content or newly available detail from the triggering control or anchor
* `morph`: transform the same object into an adjacent state while preserving identity
* `settle`: confirm authoritative convergence of a previously pending or provisional change
* `pending`: indicate that work is in progress elsewhere without implying final success
* `invalidate`: mark a previously actionable or selected object as no longer valid while keeping it visible
* `diff`: draw attention to what changed relative to the last acknowledged snapshot
* `reopen`: communicate reversal from settled to active work
* `degrade`: communicate stale, disconnected, read-only, or fallback mode
* `recover`: guide attention from degraded or blocked posture to the next recovery path or restored readiness
* `handoff`: shift emphasis between closely related child panels without breaking shell continuity
* `escalate`: signal urgent or high-attention transition when the state itself is urgent

Intent law:

* `commit` is deprecated and must normalize to `settle` before any cue is emitted.
* `invalidate` is not a synonym for `reopen`; invalidation preserves the current anchor and freezes unsafe action, while reopen reactivates the workflow.
* `recover` is not a synonym for `reveal`; recovery must point to the bounded next safe action after degradation, conflict, or freeze.
* `pending` must never outrank `invalidate`, `recover`, `reopen`, or `escalate` for the same anchor.

Typical domain mappings:

* autosave success -> `settle`
* submit-to-receipt -> `morph`
* selected option validation -> `pending`
* evidence change requiring re-check -> `diff` or `invalidate` depending on whether the current action remains legal
* request returned to active work -> `reopen`
* stale or disconnected state -> `degrade`
* reconnect or same-shell recovery completion -> `recover`
* authoritative confirmation -> `settle`

#### 7.2 Motion timing, delay, and easing model

All durations, delays, amplitudes, and travel distances must resolve through the shared motion tokens from `design-token-foundation.md`; the model below selects deterministic outcomes from canonical duration and distance buckets rather than minting route-local animation values.

Use the following deterministic timing model:

* canonical duration tokens are `120ms`, `180ms`, `240ms`, and `320ms`
* canonical distance tokens are `0px`, `4px`, `8px`, and `12px`
* `baseDuration[intent] = { reveal: 180, morph: 240, settle: 120, pending: 120, invalidate: 120, diff: 120, reopen: 240, degrade: 120, recover: 180, handoff: 240, escalate: 120 }`
* `durationMs` must snap to one canonical duration token according to `intent`, `timingBand`, and whether the cue stays local, follows the selected anchor, or performs an anchor-preserving handoff
* `delayMs = 0` for the initiating control, selected anchor, invalidation, or recovery cue; otherwise exactly one causal follower may use `delayMs = 40`

Rules:

1. `instant` is for acknowledgements, invalidation freezes, and fast settle feedback.
2. `standard` is for ordinary reveal, settle, degrade, and diff cues.
3. `deliberate` is reserved for anchor-preserving morphs, handoffs, and reopen transitions where continuity would otherwise be lost.
4. `urgent` is for high-attention state changes without dramatic flourish; it shortens time, not distance.
5. Secondary shell-strip acknowledgement may trail a dominant object cue by `delayMs`, but shell and anchor motion may not start together.

Use these easing families:

* `standard_enter = cubic-bezier(0.2, 0.0, 0, 1.0)`
* `standard_exit = cubic-bezier(0.3, 0, 1, 1)`
* `deterministic_linear = linear` for determinate progress only
* `anchored_morph_spring`: critically damped, no-overshoot interpolation `x(t) = 1 - e^(-ωt) (1 + ωt)` with `ω = 4.74 / durationMs`

Easing law:

* use `anchored_morph_spring` only for `morph`, `handoff`, or `reopen` when connected-object continuity matters
* use `standard_enter` for `reveal`, `settle`, `recover`, `diff`, and most `degrade` cues
* use `standard_exit` only for the leaving leg of a bounded handoff or collapse
* bounce, elastic, overshoot, parallax, rotation, blur-zoom, and multi-axis motion are forbidden

#### 7.3 Amplitude and movement profiles

Amplitude law:

* `silent`: `0px` translation, `0` scale delta, static state change only
* `low`: `4px` translation or `<= 0.01` scale delta
* `medium`: `8px` translation or `<= 0.02` scale delta and is allowed only for `morph`, `reopen`, or `handoff`
* `urgent`: `<= 8px` translation, no extra scale, no extra travel beyond the matching `low` or `medium` profile; urgency comes from timing, contrast, and explicit wording
* absolute caps in `profileState = full` are `12px` translation, `0.02` scale delta, and `0.16` opacity delta

Movement-profile law:

1. `reveal` and `recover` may use anchored fade plus `4px` rise or lateral reveal from the initiating control.
2. `morph`, `handoff`, and `reopen` may use connected-object interpolation or single-axis slide inside the local region only.
3. `settle` must be a short confirmatory settle on the target object and may not become a celebratory bounce or shell-wide flourish.
4. `pending` must not move the object through space. Use determinate progress where available; otherwise allow at most two low-amplitude pulses before freezing to a static busy state.
5. `invalidate` must not displace or remove the current anchor. Freeze unsafe controls, preserve the object, and express invalidation through outline, badge, icon, text, or low-amplitude emphasis.
6. `diff` must use localized wash, outline, or emphasis fade and must not reorder or translate the active object to make the point.
7. `degrade` must prefer static state shifts in the affected card, control, or shared status strip; it may not fake ordinary calmness through decorative animation.
8. Shell-wide motion is forbidden when the active object is already known and continuity is unchanged.

#### 7.4 Arbitration, interruptibility, and live-churn suppression

Use the following arbitration constants:

* `W_merge = 80ms`
* `priority(intent) = { invalidate: 90, recover: 80, reopen: 70, settle: 60, morph: 50, reveal: 40, diff: 30, pending: 20, degrade: 10, handoff: 50, escalate: 95 }`
* `scopePriority = { selected_anchor: 4, focused_region: 3, local_card: 2, shell_status_strip: 1, peripheral_region: 0 }`
* `score = 100 * scopePriority + priority(intent)`

Arbitration law:

1. Merge candidate cues for the same target anchor or region when they arrive within `W_merge`.
2. The dominant cue is the candidate with the greatest `score`; ties break by the most recent authoritative or invalidating cue.
3. At any moment, `animatedRegions(entityContinuityKey) <= 1`. A second animated region is allowed only as one declared handoff follower that begins after the primary cue has passed `70%` progress.
4. Non-dominant shell, banner, or status-strip cues for the same causal token must resolve as static equivalents while the dominant cue is active.
5. `invalidate`, `recover`, `reopen`, and `escalate` may interrupt lower-priority cues immediately. `settle` may finish the final `30%` of an active local acknowledgement, then must resolve the older cue statically.
6. Reversible business actions must use reversible motion: a pending or provisional cue may be replaced by invalidate, recover, reopen, or settle without visual discontinuity.
7. Lists, queues, and boards may not animate resorting while a `SelectedAnchor`, composition lease, or focused queue position is active. Preserve position, patch values in place, and batch reorder only on explicit apply or idle.

Churn-suppression law:

* `delta_batch_calm = 120ms`
* if `candidateCueRatePerSecond > 3` over the trailing `2s`, or `frameDropRatio > 0.10`, downgrade to `profileState = minimal`
* if `candidateCueRatePerSecond > 6` over the trailing `2s`, or `frameDropRatio > 0.20`, downgrade to `profileState = static_only`
* urgent non-bufferable invalidation and recovery still bypass buffering, but peripheral motion remains suppressed
* repeated low-risk deltas must coalesce inside `delta_batch_calm` and settle the active anchor region first, peripheral regions second, and the shared status strip last

#### 7.4A Operations-board prominence and motion parity

1. Any operations-shell change in dominant anomaly, dominant action emphasis, or secondary-summary expansion must originate from the current `OpsProminenceDecision` and emit one `OpsMotionEnvelope`; widget-local pulses or tile-level resorting without the shell decision are invalid.
2. `OpsMotionEnvelope.changeCause`, causal copy, DOM markers, and reduced-motion or static equivalents must agree on whether the board changed because of live delta, threshold cross, batch apply, restore, degraded mode, or manual pin.
3. While `OpsFocusProtectionFence.fenceState = active` or `AttentionBudget.promotionLockReason != none`, `MotionRegionArbitration` must keep the currently promoted operations surface and `InterventionWorkbench` stable; competing anomalies may surface only as secondary summaries or queued-delta digests.
4. Threshold-cross promote and demote flows for operations boards must record the governing `OpsEscalationCooldownWindow` in `MotionVerificationTrace` so automation can prove hysteresis, cooldown release, and reduced-motion parity.

#### 7.5 Reduced-motion rule and accessibility equivalence

When reduced motion or runtime degradation is active:

1. `prefers-reduced-motion: reduce` or an equivalent user setting must force at least `profileState = reduced`.
2. `reduced` allows `<= 4px` translation, no scale, no multi-axis motion, and no looping; use fades, highlights, iconography, and explicit text.
3. `minimal` allows no translation and only short opacity or outline emphasis up to `120ms`.
4. `static_only` allows `0ms` motion; state, focus, icon, text, and DOM markers still change.
5. `loopAllowanceState = never` for `reduced`, `minimal`, and `static_only`; determinate progress is the only allowed moving indicator.
6. Keyboard, screen-reader, and pointer readiness must be equivalent across `full`, `reduced`, `minimal`, and `static_only` according to `AccessibilityEquivalenceCheck`.

Intent-specific reduced-motion fallbacks:

* `reveal` -> instant expand or short fade with updated disclosure semantics
* `morph` -> same-box crossfade or static replace while preserving anchor and focus
* `settle` -> static settle badge, icon, or text on the affected object
* `pending` -> inline busy text or determinate progressbar, then static busy state
* `invalidate` -> persistent invalidated badge, explanation text, frozen CTA, no movement
* `diff` -> static diff chip, outline, or changed-since-seen marker
* `reopen` -> in-place state copy change plus anchor preservation, no reverse travel
* `degrade` -> shared strip and local card state change plus disabled unsafe actions
* `recover` -> focus-compatible recovery callout or restored-ready marker, no flourish
* `handoff` -> static emphasis swap between local panels
* `escalate` -> higher-contrast state plus assertive wording, not larger motion

#### 7.6 Feedback timing and microinteraction contract

Use these timing constants:

* pressed, focus, and hover feedback must render within `50ms` or the next paint, whichever is sooner
* `TransitionEnvelope.localAckState = local_ack | queued` must produce visible acknowledgement within `120ms`
* if authoritative progress is still unknown at `150ms`, render `pending` on the initiating control or selected anchor
* `T_strip_mirror = min(96ms, 0.5 * durationMs)`
* `T_pending_motion_max = 1200ms` or two pulses, whichever comes first
* `T_diff_dwell = 1600ms`
* `T_invalidation_hold_min = 4000ms`
* `T_settle_dwell = 800ms`
* `T_recovery_callout = 1200ms`
* `T_buffer_max[bufferable] = 1500ms`
* `T_buffer_max[review_required] = 250ms`
* `T_resume_stable = 1200ms`

Microinteraction law:

1. Local acknowledgement starts on the initiating control first, then on the affected anchor or card, then mirrors statically into shell status if the action remains pending.
2. Status-strip mirrors must never pre-empt a dominant local cue.
3. Pending visuals must become static after `T_pending_motion_max`; indefinite looping spinners are forbidden.
4. Diff emphasis decays to passive state after `T_diff_dwell`, but the changed-since-seen marker remains until acknowledged.
5. Invalidation freezes the unsafe action within `100ms` of the authoritative delta and keeps the invalidated anchor visible for at least `T_invalidation_hold_min` or until explicit re-check, replacement, or dismissal.
6. Settlement may animate once for up to `T_settle_dwell`, then must resolve to static evidence in the object, `StateBraid`, or shared status strip.
7. Recovery may animate once for up to `T_recovery_callout`, then must remain as a stable recovery or restored-ready state.
8. Field-level validation must stay local to the field or field group; shell strips and banners are reserved for cross-field or cross-surface consequences.
9. Motion may not delay focus availability, keyboard readiness, pointer cancellation, or the next safe action.

#### 7.7 Accessibility and interaction contract

The canonical cross-shell semantic, keyboard, focus, form-repair, timeout-recovery, freshness, visualization, and assistive-copy rules are defined in `accessibility-and-content-system-contract.md`. Every route family must bind to those contracts before local component work is considered complete.

1. All core workflows must be fully operable by keyboard.
2. Focus indicators must be visible, high-contrast, and never hidden behind sticky chrome.
3. Every custom control must expose a semantic role and stable accessible name.
4. Every spatial comparison surface must have a semantic fallback.
5. No state may rely on color alone.
6. Reflow, zoom, and narrow-width rendering must preserve the primary action path.
7. Live regions must be bounded and must not create noisy repeated announcements for routine updates.
8. Assertive announcements are reserved for blocking, urgent, or review-required changes.
9. Buffered update announcements must summarize batches rather than narrate every individual patch.
10. Drag-only interaction patterns are forbidden unless a full keyboard and screen-reader alternative exists.
11. Focus restore after same-shell recovery, placeholder clearance, or browser return must target the current `SelectedAnchor`, the dominant recovery action, or the preserved composer rather than the document top.
12. Loading, placeholder, and empty states must expose concise accessible summaries that state reason, current actionability, and whether more content is still loading.
13. Virtualized lists, dense grids, and queue workboards must preserve keyboard position, row or column semantics, and current-set or current-position cues for assistive technology.
14. Sticky status strips, decision docks, drawers, and side stages must not create tab-order loops, obscured focus, or reading-order jumps at `200%` zoom, reflow, or narrow widths.
15. Any artifact preview, governed download, print preview, or browser handoff must announce progress and return state without requiring sighted interpretation.
16. Every `SurfaceStateFrame` must expose a labeled region, concise state summary, and explicit dominant-action relationship that screen readers can traverse without hearing duplicate shell chrome first.
17. Every `ArtifactStage` must expose artifact title, current mode, provenance summary, and return target in a stable reading order before any print, download, or external handoff controls.
18. Reduced-motion, minimal, and static-only modes must preserve the same causal order of focus, announcement, and action readiness as full motion.
19. Every shell and primary region must declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, and `FreshnessAccessibilityContract`; any input, upload, or response workflow must also declare `FieldAccessibilityContract`, `FormErrorSummaryContract`, and `TimeoutRecoveryContract`.
19A. Every route family must publish one `AccessibilitySemanticCoverageProfile` bound to the current `DesignContractPublicationBundle`, its required `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, `AutomationAnchorProfile`, and the relevant `SurfaceStateSemanticsProfile`.
20. Native HTML is the default semantic strategy. ARIA may extend, but never mask or contradict, the visible contract state or native widget behavior.
21. `aria-busy`, `aria-current`, `aria-expanded`, `aria-selected`, `aria-describedby`, `aria-errormessage`, and `aria-invalid` may appear only while the matching visible state is true and current.
22. No route may leave a blocking spinner, pending toast, or silent stale state unbounded; once the governing settlement window or freshness lease expires, the same shell must fall to bounded recovery with preserved context and explicit next step.
23. `FieldAccessibilityContract.describedByOrderRef` and `FormErrorSummaryContract` must keep hint, example, and repair text stable across validation so users do not lose the repair path when a field changes state.
24. Every chart, heat surface, forecast band, and matrix must implement `VisualizationFallbackContract`, `VisualizationTableContract`, `VisualizationParityProjection`, and `AssistiveTextPolicy` so summary text, units, interval meaning, current selection, filter context, sort state, and non-color encodings stay equivalent across visual and assistive paths.
25. Ordinary vertical workflows must remain operable at `usableInlinePx >= 320` and at `400%` zoom without horizontal scrolling; if a surface truly requires two-dimensional layout, it must publish a ranked-list, row-first inspector, or accessible data-table fallback before collapse.
26. Primary, sticky, or touch-first controls must target `comfortableTargetMinPx = 44`; controls between `24` and `43` CSS px are allowed only for dense inline utilities when spacing or equivalent-control rules still preserve accuracy.
27. Sticky action docks must reserve scroll padding equal to the rendered dock height plus safe-area inset and must unstick, raise, or locally reflow when a focused input would otherwise be obscured.
28. Embedded and constrained-browser shells must evaluate responsive state from the shell container and host safe area, not from the top-level window width alone.
29. Each active shell and primary region must resolve live narration through one `AssistiveAnnouncementTruthProjection` bound to the current `UIEventEmissionCheckpoint`, `StatusAcknowledgementScope`, `FocusTransitionContract`, `FreshnessAccessibilityContract`, `FormErrorSummaryContract`, and `TimeoutRecoveryContract`; local components may propose intent but may not publish standalone live regions.
30. Restore, reconnect, queue flush, and buffer replay may emit at most one current-state summary per surface and restore epoch; historical acknowledgements, autosave ticks, and low-risk batch replays may not sound like fresh activity.
31. Local acknowledgement, processing acceptance, authoritative settlement, blocker, and recovery copy must stay semantically distinct in wording and urgency; identical announcement reuse across those classes is forbidden.
32. When `VisualizationParityProjection.parityState != visual_and_table`, the downgraded table, summary, or placeholder posture becomes the authoritative view; the visual may not continue as the dominant meaning surface.
32A. `AccessibilitySemanticCoverageProfile.coverageState = complete` is required before the route may remain calm, writable, visual-dominant, or fully interactive. Breakpoint, `mission_stack`, host-resize, safe-area, reduced-motion, or buffered-update drift must demote the same shell into summary-first, table-first, placeholder, or recovery posture rather than leaving semantically partial controls armed.
32B. `AutomationAnchorProfile`, `AutomationAnchorMap`, `TelemetryBindingProfile`, and route-level accessibility semantics must use one shared kernel vocabulary. DOM markers and accessible summaries may not disagree on state class, dominant action, selected anchor, or recovery posture.
32C. Stale, degraded, blocked, pending, placeholder, read-only, and recovery surfaces must remain semantically equivalent to the current `SurfaceStateSemanticsProfile` and `FreshnessAccessibilityContract`; visible calmness without matching accessible calmness is invalid.

#### 7.8 Verification and Playwright contract

1. Prefer semantic HTML and accessible roles before test IDs.
2. Every critical workflow must expose deterministic success and failure markers in the DOM.
3. Loading, stale, locked, processing, empty, warning, failed, invalidated, recovered, review-required, and reconciled states must be explicit in the DOM and visually distinct.
4. Do not use animation to hide readiness or delay actionability.
5. `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor` surfaces must have stable automation anchors.
6. `EssentialShellFrame`, `PrimaryRegionBinding`, `StatusStripAuthority`, active degraded or recovery posture, and any active `MissionStackFoldPlan` fold toggle must also be observable through deterministic DOM markers or semantic attributes.
7. Route change alone is not an acceptable assertion of state change; the relevant object state must also be reflected in the DOM.
8. Continuity reuse, selected-anchor preservation, freshness state, re-check state, quiet-settlement pending or disputed posture, and restore readiness must all be observable in automation without relying on visual timing guesses.
9. Active shells and dominant action regions must expose stable `data-shell-type`, `data-channel-profile`, `data-route-family`, `data-layout-topology`, `data-breakpoint-class`, `data-density-profile`, `data-writable-state`, and `data-anchor-state` markers.
10. `SurfaceStateFrame`, placeholder, hydration, artifact-transfer, and restore surfaces must expose stable automation anchors plus deterministic `data-surface-state`, `data-state-owner`, `data-state-reason`, `data-dominant-action`, `data-artifact-stage`, `data-artifact-mode`, `data-transfer-state`, and `data-return-anchor` or equivalent contract-safe markers.
10A. Visualization surfaces must expose stable `data-visualization-parity-state`, `data-visualization-selection`, `data-visualization-filter-context`, `data-visualization-sort-state`, and `data-visualization-authority` markers or equivalent contract-safe semantics so automation can prove when the chart, table, summary, or placeholder is the authoritative meaning surface.
10B. Active route roots must expose stable `data-design-contract-digest`, `data-design-contract-state`, and `data-design-contract-lint-state` markers or equivalent contract-safe semantics so automation can prove which `DesignContractPublicationBundle` and lint verdict govern the rendered token, state, marker, and telemetry contract.
10C. Active route roots must also expose stable `data-accessibility-coverage-state`, `data-semantic-surface`, `data-keyboard-model`, `data-focus-transition-scope`, and `data-live-announce-state` markers or equivalent contract-safe semantics so automation can prove which `AccessibilitySemanticCoverageProfile` governs the rendered route family and whether the current shell is allowed to remain calm or interactive.
11. `mission_stack` fold, unfold, rotate, restore, and breakpoint transitions must be observable in automation without relying on visual timing guesses.
12. DOM markers and emitted UI event fields must resolve from the same `AutomationAnchorMap` and `TelemetryBindingProfile`; parallel naming schemes for the same state are invalid.
12A. DOM markers, emitted UI event fields, and active `SurfaceStateSemanticsProfile` plus `ArtifactModePresentationProfile` posture must resolve through one current `DesignContractPublicationBundle`; stale bundles or blocked lint verdicts must downgrade the surface in place rather than silently rendering mixed-vocabulary truth.
13. Active motion targets must expose stable `data-motion-intent`, `data-motion-phase`, `data-motion-profile`, `data-motion-region`, and `data-motion-suppressed` markers or contract-safe equivalents.
14. Automation must be able to assert `animated_region_overlap_count = 0` for a continuity key unless the route explicitly declares one causal handoff follower.
15. Buffered live-apply windows must expose `data-batch-window-ms`, `data-buffer-impact`, and `data-motion-suppression-state` or equivalent contract-safe markers.
16. Invalidated anchors must expose `data-anchor-state = invalidated` until explicit re-check, replacement, or dismissal; disappearance is a defect.
17. `MotionVerificationTrace` must record the winning cue, suppressed cues, effective reduced-motion profile, rendered static equivalent, and overlap count for every animated or suppressed transition.
18. Active shells must expose `data-breakpoint-class`, `data-layout-topology`, `data-compare-fallback`, and any active `data-embedded-strip-state` or equivalent contract-safe markers.
19. Responsive coverage must include host resize, rotate, `320px` reflow, `400%` zoom, safe-area occlusion, sticky-dock keyboard avoidance, and compare-fallback transitions.
20. Operations boards must expose stable `data-ops-prominence-state`, `data-ops-promoted-surface`, `data-ops-secondary-summaries`, `data-ops-focus-fence-state`, `data-ops-cooldown-state`, and `data-ops-motion-cause` markers or equivalent contract-safe markers whenever anomaly arbitration is active.
21. Automation must be able to assert that exactly one operations surface is dominant, that the visible dominant surface matches `OpsProminenceDecision.promotedSurfaceRef`, that `InterventionWorkbench` remains the sole dominant action region, and that non-promoted surfaces stay summary-level.
22. `MotionVerificationTrace` for operations boards must join the winning cue to the governing `OpsProminenceDecision`, `OpsMotionEnvelope`, `OpsFocusProtectionFence`, and `OpsEscalationCooldownWindow`, including the reduced-motion or static-equivalent outcome.
23. Operations health surfaces must expose stable `data-health-state`, `data-health-overlay-state`, `data-fallback-sufficiency-state`, `data-guardrail-state`, and `data-mitigation-authority-state` markers or equivalent contract-safe markers whenever `ServiceHealthGrid` is present.
24. Automation must be able to assert that `OpsStableServiceDigest.topHealthySignals[]` include only `EssentialFunctionHealthEnvelope.overlayState = live_trusted` functions and that time-bounded fallback, freeze-constrained, or degraded-trust functions remain visible as watch or guarded items rather than calm healthy tiles.

#### 7.9 Responsiveness budgets and continuity measures

Required measures:

* `interaction_to_local_ack_ms`
* `interaction_to_server_accept_ms`
* `interaction_to_projection_seen_ms`
* `delta_to_visible_patch_ms`
* `same_entity_shell_reuse_rate`
* `selected_anchor_preservation_rate`
* `focus_loss_rate`
* `same_entity_full_reload_count`
* `buffered_delta_apply_lag_ms`
* `mission_stack_restore_success_rate`
* `breakpoint_anchor_preservation_rate`
* `topology_change_restore_ms`
* `artifact_stage_return_success_rate`
* `breakpoint_topology_mismatch_rate`
* `compare_fallback_success_rate`
* `embedded_strip_recovery_rate`
* `sticky_dock_occlusion_rate`
* `animated_region_overlap_count`
* `motion_downgrade_rate`
* `invalidation_to_freeze_ms`

Rules:

1. Optimize for time to stable local acknowledgement and time to stable comprehension, not only network completion.

2. Target budgets for core flows:

   * local acknowledgement should normally occur within `150ms` of interaction
   * invalidation freeze should normally occur within `100ms` of the authoritative delta reaching the client
   * non-disruptive projection deltas should normally patch visibly within `250ms` of receipt
   * same-entity full reload count must be `0` by design
   * focus loss rate for protected workflows must be `0` by design
   * breakpoint and topology changes should normally restore the preserved dominant action and selected anchor within `250ms` of layout settlement
   * animated-region overlap count must be `0` by design

3. Regressions in continuity, anchor preservation, focus integrity, invalidation latency, or motion arbitration are product defects.

4. Responsiveness must be judged by whether the user can understand what is happening without losing context, not by whether a new page loaded quickly.

### 8. Required UI events

High-priority event-contract defects in this layer:

1. the section currently lists event names, but not one typed emission envelope carrying continuity, route, shell, audience, and contract-version context
2. lifecycle siblings such as `started/settled`, `delta_received/delta_applied`, and `created/invalidated/released` are not yet bound through one causal frame, so traces can be ambiguous
3. replay, buffering, restore, and batch-apply order are not yet governed by an emission checkpoint, so required events can double-fire or arrive out of sequence
4. event privacy boundaries are not yet explicit, so embedded, unauthenticated, or support-safe routes can leak more object detail than the current audience or channel should see
5. the blueprint does not yet declare a route-family coverage matrix for required versus optional events, so critical observability can regress silently
6. announcement batching, dedupe, and replay are not emitted as first-class event families, so assistive behaviour cannot be reconstructed or tested against causal truth

Build required UI events around these contracts:

Reuse the canonical `UIEventEnvelope` from Phase 0. Frontend routes must populate at minimum `contractVersionRef`, `continuityFrameRef`, `canonicalObjectDescriptorRef`, `canonicalEntityRef`, `routeIntentRef`, `shellInstanceRef`, `surfaceRef`, `channelContextRef`, `edgeCorrelationId`, `eventClass`, and `eventState`; the name alone is not a complete contract, and this section must not fork a second envelope schema.

Reuse the canonical `UIEventCausalityFrame` from Phase 0. Frontend routes may extend it with route-local sequencing detail, but they must not fork a second causality-frame schema or rename the continuity-sequencing primitive.

Reuse the canonical `UIProjectionVisibilityReceipt` from Phase 0. Frontend routes must write it whenever a projection delta, restore, recovery, stale downgrade, or selected-anchor change becomes visible so replay can answer what the user actually saw without reading raw payloads.

**UIEventEmissionCheckpoint**
`uiEventEmissionCheckpointId`, `envelopeHash`, `continuityFrameRef`, `eventSequence`, `restoreEpoch`, `bufferEpoch`, `deliveryState = pending | emitted | deduplicated | replayed | rejected`, `emissionSinkRef`, `emittedAt`

`UIEventEmissionCheckpoint` guarantees deterministic ordering and idempotent replay across reconnect, restore, queue batch apply, announcement batching, and buffer flush.

**UIEventVisibilityProfile**
`uiEventVisibilityProfileId`, `eventName`, `channelContextRef`, `audienceTier`, `redactionClass`, `allowedIdentifierRefs[]`, `forbiddenFieldRefs[]`, `telemetrySinkClass = local_debug | operational | audit`, `visibilityState = full | redacted | blocked`

`UIEventVisibilityProfile` keeps required UI events PHI-safe. Embedded, unauthenticated, or support-safe surfaces may emit the event name and contract metadata without leaking patient-linked detail. The profile must be derived from the governing `UITelemetryDisclosureFence` plus the published `AudienceVisibilityCoverage` row so PHI-bearing routes can still emit canonical descriptor hashes, route-family hashes, shell-decision classes, anchor-change classes, and causal tokens without leaking patient-linked titles, route params, or payload fragments.

**UIEventCoverageAssertion**
`uiEventCoverageAssertionId`, `routeFamilyRef`, `shellType`, `requiredEventNames[]`, `optionalEventNames[]`, `forbiddenEventNames[]`, `assertionState = draft | verified | failed`, `lastVerifiedAt`

`UIEventCoverageAssertion` is the testable matrix for event completeness. Every route family and shell type must declare which events are required, optional, or forbidden before release.

Emit the following events where applicable:

* `ui.shell.created`
* `ui.shell.reused`
* `ui.shell.restore_requested`
* `ui.shell.restore_applied`
* `ui.shell.restore_failed`
* `ui.shell.recovery_reused`
* `ui.continuity.resolved`
* `ui.continuity.preserved`
* `ui.continuity.broken`
* `ui.continuity.recovered`
* `ui.continuity.superseded`
* `ui.recovery.entered`
* `ui.recovery.resolved`
* `ui.freeze.entered`
* `ui.freeze.cleared`
* `ui.case_pulse.rendered`
* `ui.attention_budget.changed`
* `ui.support_region.promoted`
* `ui.support_region.demoted`
* `ui.status_suppressed`
* `ui.state_axes.changed`
* `ui.state_braid.rendered`
* `ui.evidence_prism.rendered`
* `ui.decision_dock.rendered`
* `ui.selected_anchor.created`
* `ui.selected_anchor.changed`
* `ui.selected_anchor.preserved`
* `ui.selected_anchor.invalidated`
* `ui.selected_anchor.released`
* `ui.transition.started`
* `ui.transition.server_accepted`
* `ui.transition.awaiting_external`
* `ui.transition.projection_seen`
* `ui.transition.settled`
* `ui.transition.disputed`
* `ui.transition.reverted`
* `ui.transition.failed`
* `ui.transition.expired`
* `ui.consequence.previewed`
* `ui.projection.subscribed`
* `ui.projection.delta_received`
* `ui.projection.delta_buffered`
* `ui.projection.delta_applied`
* `ui.freshness.changed`
* `ui.freshness.stale_entered`
* `ui.freshness.stale_cleared`
* `ui.queue.batch_available`
* `ui.queue.batch_applied`
* `ui.queue.focus_pinned`
* `ui.side_stage.opened`
* `ui.side_stage.closed`
* `ui.live.paused`
* `ui.live.resumed`
* `ui.buffer.state_changed`
* `ui.buffer.flushed`
* `ui.announcement.queued`
* `ui.announcement.emitted`
* `ui.announcement.deduplicated`
* `ui.announcement.replayed`
* `ui.announcement.invalidated`
* `ui.diff.revealed`
* `ui.review.required`
* `ui.motion.reduced_enabled`
* `ui.layout.topology_changed`
* `ui.breakpoint.changed`
* `ui.artifact.mode_changed`
* `ui.artifact.preview_degraded`
* `ui.artifact.print_requested`
* `ui.artifact.download_requested`
* `ui.artifact.export_requested`
* `ui.artifact.handoff_started`
* `ui.artifact.handoff_returned`

The names above are canonical event keys. Their use is only compliant when these rules also hold:

1. Every emitted event name must be wrapped in one `UIEventEnvelope` bound to the active `contractVersionRef`, `continuityFrameRef`, `canonicalObjectDescriptorRef`, `shellInstanceRef`, and `edgeCorrelationId`.
2. Paired lifecycle events must share one `UIEventCausalityFrame`; if the sequence is superseded, recovered, or expired, emit the terminal event from that same frame rather than starting an unrelated trace, and if the visible shell or selected-anchor posture changed, bind the same sequence to one `UIProjectionVisibilityReceipt`.
3. `UIEventEmissionCheckpoint.eventSequence` must order shell, transition, projection, queue, live, announcement, anchor, and recovery emissions deterministically inside one continuity frame; replayed or deduplicated events must never look like fresh user activity.
4. Before leaving the frontend, every event must pass through `UIEventVisibilityProfile`; refs that are not allowed for the current audience or channel must be redacted or blocked.
5. `UIEventCoverageAssertion` must be verified in tests for every route family before release; removing a required event or emitting a forbidden event is a contract failure.
6. `ui.transition.server_accepted`, `ui.transition.awaiting_external`, `ui.transition.projection_seen`, and `ui.transition.settled` may only be emitted in causal order unless `UIEventCoverageAssertion` explicitly marks an intermediate stage not applicable for that route family, and `ui.transition.settled` may only fire after `UITransitionSettlementRecord.authoritativeSource != not_yet_authoritative`, `UITransitionSettlementRecord.authoritativeOutcomeState = settled`, plus any required `UIProjectionVisibilityReceipt` and `AuditRecord` join.
7. `ui.projection.delta_received`, `ui.projection.delta_buffered`, `ui.projection.delta_applied`, `ui.live.paused`, `ui.live.resumed`, `ui.buffer.state_changed`, and `ui.buffer.flushed` must share one buffer or live-state causal token so degraded buffering never masquerades as ordinary quietness.
8. `ui.announcement.*` events must share one `AssistiveAnnouncementTruthProjection`, `announcementTupleHash`, and `UIEventEmissionCheckpoint` sequence window; `deduplicated` or `replayed` announcement events may not be emitted as fresh `queued` or `emitted` events.
9. Recovery, freeze, stale, or read-only morphs defined elsewhere in this blueprint must emit the relevant `ui.recovery.*`, `ui.freeze.*`, or `ui.freshness.stale_*` events through the same continuity frame and must update `UIProjectionVisibilityReceipt` instead of changing posture silently.
10. `ui.layout.topology_changed` and `ui.breakpoint.changed` must carry the same `continuityFrameRef`, previous and next topology markers, and whether `SelectedAnchor` plus `DecisionDock` were preserved.
11. Artifact-mode events must share one `UIEventCausalityFrame` with the active `ArtifactStage`; preview degradation, print, download, export, and external handoff must never emit as detached generic click analytics.
12. `AutomationAnchorMap` and `TelemetryBindingProfile` must use the same `surfaceRef`, `stateClass`, `artifactMode`, `breakpointClass`, and `selectedAnchor` vocabulary; mismatched names are contract failures.
12A. The active `DesignContractPublicationBundle` and `DesignContractLintVerdict` must remain current for the rendered route family; if token export, state semantics, automation anchors, or telemetry bindings drift out of that bundle, the shell must preserve context but fall to read-only, summary-only, or recovery posture instead of continuing under mixed contract meaning.
13. Shell reuse, restore, recovery, stale downgrade, and selected-anchor changes must emit redacted events that still preserve `edgeCorrelationId`, `causalToken`, `shellDecisionClass`, and `selectedAnchorChangeClass`; PHI-safe telemetry must remain sufficient for deterministic replay.

### 9. Forbidden behaviors

The following behaviors are explicitly forbidden:

1. hard reloading the page for a projection-backed adjacent state change
2. showing a blank or full-screen loading state when the active entity is already known
3. replacing the whole request surface when only a child panel, evidence cluster, selected card, or status has changed
4. resetting focus or scroll because a live update arrived
5. reordering or removing the currently open staff item while it is being worked
6. splitting messages, callback expectations, and follow-up questions into unrelated silo pages for the same request
7. showing fake exclusivity, fake hold countdown, or fake real-time confidence
8. using generic endless spinners instead of explicit bridge states
9. allowing live updates to overwrite partially entered user text
10. using animation that flashes, bounces, or dramatizes urgent states
11. relying on route changes alone to communicate state change
12. presenting contradictory top-level status across patient-facing surfaces for the same request
13. hiding staleness or disconnection when fresh data is required for safe action
14. using assistive suggestions in a way that displaces primary clinical or operational content without user intent
15. stacking modal on top of modal for adjacent compare, inspect, or compose work that can be served by `InlineSideStage`
16. flattening evidence origin, confidence, and freshness into one undifferentiated content block
17. exposing irreversible or externally consequential actions without `ConsequencePreview`
18. relying on color-only severity or urgency signalling
19. shipping bespoke controls that are not keyboard-operable or lack stable semantic naming
20. presenting a spatial-only selection surface without an accessible fallback representation
21. removing a `SelectedAnchor` during validation, pending, invalidation, or failure without explicit replacement or dismissal
22. sending the user to a different shell for messaging, booking, hub, callback, pharmacy, or review work that still belongs to the same request continuity key
23. using transient toast alone as the only evidence that a state change occurred
24. force-scrolling to new timeline entries or live deltas while the user is reading, typing, or deciding
25. treating `received`, `in_review`, or `action_in_progress` as dead static pages
26. silently settling a transition when later projection truth conflicts with the optimistic path
27. applying high-churn board updates as jittery per-item resort loops that break scanability
28. hiding buffered live changes until they silently apply without user awareness
29. duplicating the same status across header, banner, chip, toast, and side rail when one shared status strip would do
30. auto-expanding more than one support region for the same state change unless diagnostic mode or an explicit user pin justifies it
31. leaving blocker-only evidence, context, or compare chrome expanded after the reason has resolved when the user did not pin it
32. defaulting a routine task into `three_plane` layout when `focus_frame` or `two_plane` would preserve clarity
33. creating browser-history noise for every async sub-state or projection refresh
34. measuring speed only by page load while ignoring continuity loss, focus loss, anchor loss, or avoidable noise
35. stacking persistent full-width banners for pending, stale, assistive, or capability states that could remain local to the active card or the shared status strip

## Shell model

Vecells should run through these shells:

1. Patient Web Shell
2. Clinical Workspace Shell
3. Pharmacy Console Shell
4. Hub Desk Shell
5. Support Desk Shell
6. Operations Console Shell
7. Assistive Control Shell
8. Governance and Admin Shell

Each route is owned by one shell only. Cross-shell navigation should always land on canonical object pages, not transient views.

`embedded` is not a shell in this model. It is a `channelProfile` applied to the owning shell when the same continuity frame remains valid. Likewise, assistive suggestion rails, provenance panels, and insert flows attached to active casework do not mint a new shell; `shellType = assistive` is reserved for standalone evaluation, replay, monitoring, and release-control work.

## Governance and Admin Shell contract

The Governance and Admin Shell should own these route clusters:

- `/ops/governance/*`
- `/ops/access/*`
- `/ops/config/*`
- `/ops/comms/*`
- `/ops/release/*`

This shell must default to `two_plane`, keep a visible scope ribbon for tenant, organisation, environment, and elevation state, and treat impact preview, evidence, simulation, and approval lanes as support regions rather than detached destination pages. Moving between tenant matrix, authority-link review, role editing, effective-access preview, config diff, and promotion review for the same governance object must preserve shell continuity.

High-priority governance-shell defects in this layer:

1. the route clusters are named, but not yet bound to one typed governance continuity frame carrying scope, baseline, draft, approval, or watch lineage
2. the visible scope ribbon is not yet required to stay package-bound to the active scope token, baseline snapshot, change envelope, and release-approval tuple
3. impact, evidence, simulation, and approval lanes are called support regions, but not yet constrained to one authoritative shell-consistency envelope and one dominant action locus
4. cross-shell evidence pivots are allowed conceptually, but not yet required to preserve governance return intent and same-scope re-entry
5. inspected tenant, role, authority link, or promotion wave state can still drift under refresh, reprioritisation, or freeze unless anchor, live-delta, and blocked-posture contracts are explicit

This shell contract is only satisfied when it also guarantees:

- every `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*` route that belongs to the same governance task derives its `entityContinuityKey` from one `GovernanceContinuityFrame` and preserves the current `GovernanceScopeToken`, `ActingScopeTuple`, and `scopeTupleHash`
- the active `ScopeRibbon` remains bound to the same `ChangeBaselineSnapshot`, `baselineTupleHash`, `ChangeEnvelope`, `ApprovalEvidenceBundle`, `approvalTupleHash`, `ReleaseApprovalFreeze`, current `ReleaseWatchTuple`, compatibility evidence tuple, and current blast-radius counts the user is reviewing; stale or conflicting bindings must freeze compile, approve, promote, and stabilize controls in place
- release-watch, rollback, export, and handoff support regions must all consume the same `ReleaseWatchEvidenceCockpit` and `watchEvidenceCockpitHash`; no watch card, rollback CTA, or evidence pack may render from fresher runtime truth than the visible tuple and package
- diff, impact, simulation, continuity evidence, approval, and release-freeze support regions must all consume the same current `GovernanceReviewPackage` and `reviewPackageHash`; no support region may render from fresher workspace or publication truth while the rest of the shell still shows the older package
- standards, dependency, legacy-reference, and compatibility posture must also consume the same current `StandardsDependencyWatchlist` and `standardsWatchlistHash`; compile and promotion hygiene may not be a side rail that evaluates a different candidate than the visible diff and approval package
- impact, evidence, simulation, and approval lanes render as support regions from the same `GovernanceShellConsistencyProjection`, while `DecisionDock` remains the only dominant action locus for the current draft, approval, or promotion task
- any pivot into audit, assurance, incidents, or resilience must mint and honor `GovernanceReturnIntentToken`, so return lands back in the same scope, acting tuple, baseline, approval, and watch lineage rather than a generic admin landing view
- the currently inspected tenant row, role, authority link, approval package, or rollout wave remains bound to `GovernanceAnchorLease`; disruptive live changes buffer through `GovernanceLiveDeltaWindow`; and blocked or read-only posture resolves through one `GovernanceFreezeDisposition`

## Assistive companion and control-surface contract

The assistive layer has two allowed UI postures only:

1. **same-shell companion posture** for live patient, staff, support, hub, or pharmacy work
2. **standalone assistive control posture** for internal evaluation, replay, monitoring, and release-control routes that do not belong inside another active task shell

Rules:

- same-shell assistive posture must render through the phase-defined `AssistiveSurfaceBinding` contract and remain inside the owning `PersistentShell` as `InlineSideStage`, a bounded drawer, or the single promoted support region selected by `AttentionBudget`
- same-shell assistive posture must also resolve one current `AssistiveCapabilityRolloutVerdict`; summary visibility, insert affordance, and any governed commit-adjacent posture may not outrun the active rollout rung for that route family, audience tier, and cohort slice
- every same-shell assistive surface must also resolve one current `AssistiveCapabilityTrustEnvelope`, one `AssistivePresentationContract`, one `AssistiveProvenanceEnvelope`, one `AssistiveConfidenceDigest`, and one `AssistiveFreezeFrame`; trust, freshness, rollout, and publication posture must therefore remain legible even when richer artifact body is suppressed
- non-promoted assistive content must default to a summary stub with fixed order: capability label, bounded rationale, confidence or abstention band, provenance or freeze footer, and dominant safe action; full rail expansion is legal only on explicit user request or when the assistive artifact itself is the current review subject
- same-shell assistive posture may not displace `CasePulse`, the shared status strip, `DecisionDock`, or the current `SelectedAnchor`; assistive controls may summarize, draft, explain, or compare, but they may not become a second dominant action locus
- assistive confidence may use conservative bands only on live companion surfaces, and only while `AssistiveCapabilityTrustEnvelope.confidencePostureState = conservative_band`; raw probabilities or success-green cues may not act as the primary label for probabilistic support
- `AssistiveCapabilityTrustEnvelope` is the sole frontend authority for assistive `interactive`, `observe_only`, `provenance_only`, `placeholder_only`, `hidden`, `enabled`, `regenerate_only`, `blocked_by_policy`, and `blocked` posture; local rail badges, rollout labels, or model-return text may not imply healthier state on their own
- when `AssistiveSurfaceBinding`, runtime publication, trust slice, policy freshness, continuity evidence, selected-anchor ownership, insertion-target validity, or the owning `WorkspaceTrustEnvelope` drifts, the shell must preserve the current anchor and degrade the assistive region in place through the current `AssistiveCapabilityTrustEnvelope` to observe-only, provenance-only, placeholder, or bounded recovery posture rather than opening a detached modal, second rail, or fresh shell
- when `AssistiveCapabilityRolloutVerdict` drifts, becomes out-of-slice, or is superseded by a narrower rung, the same shell must preserve the current anchor and downgrade the assistive region in place to `shadow_only`, observe-only provenance, placeholder, or bounded recovery posture rather than leaving stale visible or insert controls armed
- accepting, inserting, regenerating, dismissing, exporting, or showing completion-adjacent assistive content must bind to the current `DecisionDock`, `workProtectionLeaseRef`, active anchor, any live `AssistiveDraftInsertionPoint`, and the current `AssistiveCapabilityTrustEnvelope`; assistive affordances may not commit draft or completion-adjacent posture against a superseded task context or a hidden editor instance
- standalone assistive control routes may use `shellType = assistive` and default to `two_plane`, but any launch from or return to another shell must preserve the originating object, scope, and selected anchor through the governing return-intent and continuity contracts rather than relying on ambient browser history
- assistive exports, transcript previews, evaluation bundles, and cross-app handoffs must follow the shared artifact and browser-handoff rules in this blueprint; raw artifact URLs, detached print routes, and ungoverned overlay launches are invalid

## Canonical object language

High-priority object-and-route gaps in this layer:

1. the current object language is only a naming list, so shells and route families can drift without a typed canonical-object contract
2. patient transaction routes are missing governing-object version and mutation-gate bindings, so stale links can act on the wrong live entity
3. secure record routes describe step-up and freshness, but not explicit visibility grants, release states, or governed placeholders
4. support transaction routes do not carry replay checkpoint, observe-only, or action-lease semantics despite those controls existing elsewhere in the architecture
5. the route inventory lacks canonical object, continuity, return, and recovery descriptors, so deep-link and fallback behaviour can diverge across shells

All front-end surfaces should use these object names consistently:

- Request
- Triage task
- Booking case
- Appointment
- Health record workspace
- Result detail
- Clinical document
- Hub coordination case
- Pharmacy case
- Callback case
- Clinician message thread
- Support ticket
- Support replay session
- Incident
- Audit record

Canonical object language is not only copy guidance. Every named object above must resolve to one `CanonicalObjectDescriptor` carrying:

- `objectType`
- `canonicalRefPattern`
- `lineageAnchorType`
- `owningShell`
- `owningShellFamilyContractRef`
- `owningBoundedContextRef`
- `contributingBoundedContextRefs[]`
- `requiredContextBoundaryRefs[]`
- `defaultRouteFamily`
- `primaryRouteFamilyOwnershipClaimRef`
- `primaryProjectionRef`
- `visibilityClass`
- `continuitySeed`
- `mutationGateClass`
- `recoveryContractRef`

Governed child workflow objects must also use stable names and may not be collapsed back into parent labels when they own route semantics:

- More-info cycle
- Waitlist offer
- Alternative offer session
- Contact-route repair
- Identity repair case
- Reachability dependency
- Support action record

Rules:

- one canonical object name maps to one descriptor only; UI synonyms may soften copy, but the route and projection contracts must bind to the canonical descriptor
- shell ownership must be derived from `CanonicalObjectDescriptor.owningShell` plus `CanonicalObjectDescriptor.owningShellFamilyContractRef`, not from ad hoc route prefixes
- bounded-context ownership must be derived from `CanonicalObjectDescriptor.owningBoundedContextRef`; feature adjacency, side stages, or historical source channels may not redefine which context owns lifecycle truth for the object
- the default route for a canonical object must also resolve through `primaryRouteFamilyOwnershipClaimRef`; child-route bounded contexts may contribute surfaces, but they may not silently replace the shell family that owns the object's lifecycle
- if a canonical object depends on another context's evidence, preview, or recovery action, the descriptor must name the active `requiredContextBoundaryRefs[]`; informal reach-through to sibling context state is invalid
- cross-shell launches must land on the canonical object page or child surface for that descriptor, not on transient task pages or raw audit views
- downstream objects may link back to lineage anchors, but they may not rename or hide the governing descriptor that owns the current route

## Typed patient transaction route contract

<!-- Architectural correction: every patient action must stay inside the same request shell and resolve to the owning domain object, preventing booking, callback, message, pharmacy, and contact-repair actions from bouncing through unrelated triage pages. -->

The patient shell must expose distinct child routes for:

- respond to more-info
- callback status and callback response
- clinician message thread and reply
- waitlist offer
- network alternative offer
- appointment manage
- pharmacy status or choice
- contact-route repair

**RouteContinuityEvidenceContract**
`contractId`, `routeFamilyRef`, `governingContractRef`, `controlCodeRefs[]`, `producerFamilyRefs[]`, `sourceProjectionRefs[]`, `experienceContinuityEvidenceRefs[]`, `canonicalObjectDescriptorRef`, `governingObjectRef`, `governingObjectVersionRef`, `selectedAnchorPolicyRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `requiredSettlementOrContinuationRefs[]`, `requiredSurfacePublicationRef`, `requiredRuntimePublicationBundleRef`, `requiredReleasePublicationParityRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `lastValidatedAt`

`RouteContinuityEvidenceContract` is the canonical frontend bridge into the assurance spine for continuity-sensitive routes. A route may preserve shell shape on local projection freshness alone, but it may not claim actionable, settled, or recoverable posture unless the current `ExperienceContinuityControlEvidence` still validates the same route family, governing contract, canonical object, selected anchor tuple, and publication tuple. The contract must name which continuity-control families and producer families it depends on through `controlCodeRefs[]` and `producerFamilyRefs[]`; examples include `patient_nav`, `record_continuation`, `conversation_settlement`, `more_info_reply`, `support_replay_restore`, `intake_resume`, `booking_manage`, `hub_booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement` when those route families are in scope.

Each transactional route must declare:

- `canonicalObjectDescriptorRef`
- `routeContractDigestRef`
- `projectionCompatibilityDigestRef`
- governing object type and ref
- governing object version or fence epoch
- `subjectRef` where the route or grant is subject-bound
- `sessionEpochRef` and `subjectBindingVersionRef` where the route depends on the current authenticated session lineage
- mapped `actionScope`
- whether it is view-only or mutating
- required step-up boundary
- `routeIntentRef`
- `mutationGateRef`
- `manifestVersionRef`, `releaseApprovalFreezeRef`, and `channelReleaseFreezeRef` where the route may run inside an NHS App embedded cohort
- `minimumBridgeCapabilitiesRef` and `patientEmbeddedNavEligibilityRef` where the route exposes bridge-backed embedded actions
- `bridgeActionLeaseRef` where the route installs native back, app-page navigation, overlay, external-browser, calendar, or byte-delivery behaviour
- `idempotencyKeyTemplate`
- `visibilityGrantRef` where the route can expose PHI-bearing context
- `capabilityRequirementRef` where provider, supplier, integration-mode, or provider-adapter capability can change live actionability or fallback posture
- `continuityEvidenceContractRef`
- `projectionReadinessFenceRef`
- `requiredContinuityControlCodes[]`
- `settlementContractRef`
- `returnContractRef`
- `continuationTokenContractRef`
- `recordActionContextTokenRef` where the route originates from a record surface
- `recordOriginContinuationRef` where the route continues from a record surface
- `contactRepairJourneyRef` where the route continues from a blocked contact dependency
- expiry or stale-link fallback
- recovery route and placeholder contract
- parent request-shell anchor

Unsupported or expired routes must recover into the parent request shell with an explicit reason state; they must not collapse into a generic `continue` page that posts back to triage.

Rules:

- every mutating patient route must submit through the canonical `ScopedMutationGate` using the declared `actionScope`, `canonicalObjectDescriptorRef`, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, current governing-object version, current parent request-shell anchor, and idempotency key template
- the route may expose a live mutate, confirm, or reply control only while `routeIntentRef`, `settlementContractRef`, `returnContractRef`, any active `continuationTokenContractRef`, and `continuityEvidenceContractRef` still bind to the same governing object, governing-object version or fence, `canonicalObjectDescriptorRef`, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, parent request-shell anchor, and current continuity frame
- when `capabilityRequirementRef` exists, the route may expose live actionability only while that capability contract still binds the same governing object, governing-object version or fence, route tuple, selected anchor, current `BookingProviderAdapterBinding` where applicable, and current publication or trust posture; component-local supplier checks, cached capability booleans, old adapter hashes, or last-known appointment status are descriptive only
- if the governing object version, `sessionEpochRef`, `subjectBindingVersionRef`, route intent, target tuple, or visibility grant is stale, the route must remain in the same request shell and morph to governed recovery rather than submitting optimistically
- once `RouteIntentBinding` exists, URL params, list-row snapshots, detached projection fragments, and local selected-card state are descriptive only; they may not retarget mutation authority away from the bound governing object or current parent anchor
- if `continuityEvidenceContractRef.validationState = stale | blocked`, the route may preserve read-only context, the current selected anchor, and causal receipts, but it must not expose fresh mutate or quiet-success posture until current continuity evidence is revalidated
- if `projectionReadinessFenceRef.presentationState != live`, the route may preserve read-only context, the current selected anchor, and causal receipts, but it must not imply that booking, callback, message, waitlist, alternative-offer, or pharmacy state is fully refreshed, empty-by-truth, or writable until the bound projection readiness returns to `live`
- any route whose calm or writable posture depends on same-shell continuity must declare `requiredContinuityControlCodes[]`; leaving `controlCodeRefs[]` implicit is invalid for draft resume, appointment-manage, assistive-session, workspace-task-completion, and pharmacy-console-settlement families
- if an embedded route's `manifestVersionRef`, `releaseApprovalFreezeRef`, or `channelReleaseFreezeRef` is stale, conflicting, or frozen, the route may preserve read-only context but must freeze file actions and mutations until recovery succeeds
- if a route runs embedded, live bridge-backed or mutating actions may render only while `PatientEmbeddedNavEligibility` still validates the current `PatientEmbeddedSessionProjection`, `BridgeCapabilityMatrix`, route contract, and continuity evidence; component-local user-agent checks or raw bridge-object checks are invalid substitutes
- any embedded native-back, app-page, overlay, external-browser, calendar, or byte-delivery behavior must install or consume `BridgeActionLease` or `OutboundNavigationGrant` under the current `PatientEmbeddedNavEligibility`; stale bridge leases and stale grants must clear in place and downgrade through `RouteFreezeDisposition`
- child routes may not upgrade from view-only to mutating posture without reissuing the route intent and step-up boundary where required
- if the route was entered from a records surface, `recordActionContextTokenRef` and `recordOriginContinuationRef` must stay active and any repair, re-auth, artifact handoff, or stale-child recovery must issue or consume `RecoveryContinuationToken` so the patient can return to the same record or request anchor safely
- if a self-care or admin-resolution route is active, the current `SelfCareBoundaryDecision`, `SelfCareExperienceProjection` or `AdminResolutionExperienceProjection`, and any live `AdviceAdminDependencySet` must agree on `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, and the selected anchor before advice issue, notify, or complete controls stay live; wording, subtype labels, and last-known child state are descriptive only
- if `clinicalMeaningState = clinician_reentry_required`, `boundaryReopenState != stable`, or the current boundary tuple drifts from shell consistency or publication posture, the route may preserve the last safe summary and request anchor, but it must freeze bounded admin and ordinary self-care calmness in place through governed recovery rather than continuing writable posture
- if callback, message, booking, waitlist, alternative-offer, pharmacy, or admin-resolution work depends on a degraded contact path, the active `ReachabilityDependency` and `ContactRouteRepairJourney` must stay attached; the route may preserve the blocked-action summary and selected anchor, but it must morph in place to same-shell repair until the linked verification checkpoint rebounds under the current return and continuity contracts
- callback, message, booking, waitlist, alternative-offer, pharmacy, and contact-repair child routes may acknowledge local progress, but they may not imply final reassurance until the authoritative settlement contract for that route family has advanced under the current shell consistency envelope
- callback, message, booking, waitlist, alternative-offer, pharmacy, and contact-repair flows must preserve the same parent request anchor even when recovery or placeholder state replaces the active action form
- legacy route contracts, child-route resumes, or cached CTA payloads that do not carry the current target tuple may render summary-only context, but they must reissue route intent before any live mutation control becomes writable

## Patient secure record route contract

The patient shell must expose signed-in or step-up-aware routes for:

- record overview
- result detail
- medications and allergies
- document detail

High-priority secure-record defects in this layer:

1. routes declare a visibility grant, but not one authoritative envelope for field, section, attachment, and summary exposure, so partial visibility can drift between views
2. delayed-release posture is named, but not bound to one release gate with cursor, policy version, and re-evaluation rules, so a refresh can reveal or suppress the wrong record version
3. step-up is required conceptually, but not emitted as one checkpoint tied to the current record version, visibility tier, and session lineage
4. placeholder behavior exists, but not as a first-class governed projection that proves what may still be shown when urgency exists without full visibility
5. cross-links into message, follow-up, or booking flows carry visibility grant context in prose only, not through one action-context token that preserves the same release and redaction posture

Build secure record routing around these contracts:

**RecordVisibilityEnvelope**
`recordVisibilityEnvelopeId`, `canonicalObjectDescriptorRef`, `recordRef`, `visibilityGrantRef`, `summarySafetyTier`, `minimumNecessaryContractRef`, `summaryVisibilityContractRef`, `sectionVisibilityContractRefs[]`, `artifactPresentationContractRefs[]`, `visibleFieldRefs`, `visibleSectionRefs`, `attachmentVisibilityState`, `redactionPolicyRef`, `evaluatedAt`, `expiresAt`

**RecordReleaseGate**
`recordReleaseGateId`, `recordRef`, `recordVersionRef`, `releaseCursorRef`, `releaseState = visible | delayed_release | withheld | superseded`, `releasePolicyVersionRef`, `nextEligibleRevealAt`, `evaluatedAt`

**RecordStepUpCheckpoint**
`recordStepUpCheckpointId`, `recordRef`, `recordVersionRef`, `visibilityEnvelopeRef`, `requiredStepUpLevel`, `sessionEpochRef`, `subjectBindingVersionRef`, `checkpointState = satisfied | required | stale | denied`, `evaluatedAt`

**RecordPlaceholderProjection**
`recordPlaceholderProjectionId`, `recordRef`, `visibilityEnvelopeRef`, `releaseGateRef`, `summarySafetyTier`, `urgencySignalRef`, `allowedNextActionRefs`, `placeholderCopyRef`, `placeholderState = safe_summary | delayed_release_notice | identity_hold_notice | blocked`

**RecordActionContextToken**
`recordActionContextTokenId`, `recordRef`, `recordVersionRef`, `selectedAnchorRef`, `oneExpandedItemGroupRef`, `visibilityEnvelopeRef`, `releaseGateRef`, `stepUpCheckpointRef`, `summarySafetyTier`, `artifactPresentationContractRef`, `patientNavReturnContractRef`, `continuityEvidenceContractRef`, `experienceContinuityEvidenceRefs[]`, `relatedActionRef`, `recordOriginContinuationRef`, `issuedAt`, `expiresAt`, `tokenState = active | consumed | stale | superseded | blocked`

**RecordOriginContinuationEnvelope**
`recordOriginContinuationId`, `recordActionContextTokenRef`, `recoveryContinuationTokenRef`, `recordRef`, `recordVersionRef`, `sourceRouteFamilyRef`, `targetRouteFamilyRef`, `sourceSurfaceContextRef`, `selectedAnchorRef`, `oneExpandedItemGroupRef`, `visibilityEnvelopeRef`, `releaseGateRef`, `stepUpCheckpointRef`, `summarySafetyTier`, `artifactPresentationContractRef`, `patientNavReturnContractRef`, `requestReturnBundleRef`, `continuityEvidenceContractRef`, `experienceContinuityEvidenceRefs[]`, `continuationState = armed | consumed | stale | blocked | recovery_only | returned`, `issuedAt`, `expiresAt`, `usedAt`, `returnedAt`

Each record route must declare:

- `canonicalObjectDescriptorRef`
- owning projection
- source system and freshness metadata
- record version or release cursor
- `visibilityGrantRef`
- `releaseState`
- `placeholderContractRef`
- `summarySafetyTier`
- sensitivity class and step-up policy
- accessible non-visual fallback for charts or structured data
- related action surfaces such as message, follow-up, or book

Unavailable, delayed-release, or scope-gated record routes must recover in place with an explicit reason state; they must not fail to a generic home redirect.

Rules:

- secure record routes must distinguish `visible`, `step_up_required`, `delayed_release`, `suppressed_recovery_only`, and `identity_hold_limited` through one current `RecordVisibilityEnvelope`, `RecordReleaseGate`, and `RecordStepUpCheckpoint` rather than using one generic gated state
- `RecordVisibilityEnvelope` must carry the same minimum-necessary, summary, section, and artifact contracts that govern overview, detail, trend, document summary, attachment, and cross-link surfaces; record routes may not materialize one broad payload and rely on local component hiding
- if a record contributes urgency but not full visibility, the shell may surface `RecordPlaceholderProjection` and next steps, but it may not synthesize a body preview, field label, chart point, or attachment detail beyond the granted `summarySafetyTier`
- delayed release must be evaluated against `RecordReleaseGate.recordVersionRef` and `releaseCursorRef`; a refresh, reconnect, or deep link may not reveal a newer cursor until the release gate says it is visible
- step-up satisfaction is valid only for the checked `recordVersionRef`, `visibilityEnvelopeRef`, `sessionEpochRef`, and `subjectBindingVersionRef`; if any of those drift, the record must remain in the same shell and degrade to checkpoint recovery rather than showing stale elevated detail
- any record route that renders a structured summary plus a source artifact must also bind one current `PatientRecordArtifactProjection`, one current `ArtifactSurfaceBinding`, one current `ArtifactParityDigest`, and one current `RecordArtifactParityWitness`; overview, detail, trend, document summary, attachment, preview, and download controls may not mix summary and source posture from different parity tuples or witnesses
- record summaries may look verified only while `ArtifactParityDigest.authorityState = summary_verified`, `RecordArtifactParityWitness.sourceAuthorityState = summary_verified`, `RecordArtifactParityWitness.recordGateState = visible`, the bound `RecordVisibilityEnvelope`, `RecordReleaseGate`, and `RecordStepUpCheckpoint` still match the same record version, and the active `ArtifactModeTruthProjection` still permits the visible mode
- cross-links from records into message, callback, request-detail recovery, follow-up, booking, or artifact handoff surfaces must carry one `RecordOriginContinuationEnvelope` built over the active `RecordActionContextToken`; if the envelope, release gate, visibility envelope, or continuity evidence is stale, the target route must degrade to a bounded recovery child surface in the same shell
- stale freshness metadata may degrade chart or table detail locally, but it may not invalidate the record route identity itself unless the governing visibility envelope or release gate has changed

Verification for this slice must cover:

- field and section redaction parity across overview, detail, and attachment views under the same `RecordVisibilityEnvelope`
- delayed-release cursor changes not leaking newer record versions on refresh, reconnect, or deep-link restore
- `RecordStepUpCheckpoint` invalidation on session-epoch, subject-binding, or record-version drift
- urgency-safe `RecordPlaceholderProjection` rendering without body-preview leakage
- `RecordOriginContinuationEnvelope` preserving the same record anchor, expanded group, release posture, visibility tier, and continuity evidence across message, callback, request-detail recovery, follow-up, booking, and artifact cross-links

## Typed support transaction route contract

The support shell must expose distinct child routes for:

- inbox and saved queue views
- support ticket workspace
- conversation focus
- subject-history focus
- knowledge focus
- replay and diff
- controlled action drawers
- handoff and escalation review
- resolution summary

Each support route must declare:

- `canonicalObjectDescriptorRef`
- governing object type and ref: `SupportTicket`, `SupportLineageBinding`, `SupportReplaySession`, or `SupportActionRecord`
- governing object version or fence epoch
- `supportLineageBindingRef`
- `supportLineageBindingHash`
- `primaryScopeMemberRef`
- parent support-shell anchor
- default `AttentionBudget` posture
- whether the route is queue-preserving, diagnostic, or mutating
- required reason code, step-up boundary, and role scope
- `routeIntentRef`
- `actionLeaseRef` where mutation is possible
- `replayCheckpointRef` where replay or diff is active
- `observeModeRef`
- `mutationGateRef`
- replay masking contract where applicable
- `maskScopeRef`
- `activeActionSettlementRef`
- `restoreSettlementRef`
- `continuationTokenContractRef`
- stale-link or permission-fallback state

Rules:

- queue focus and the active ticket must share the same support shell whenever the `shellContinuityKey` is unchanged
- conversation, history, knowledge, and action surfaces are child views of the same ticket, not independent pages
- opening replay may upgrade the shell to `three_plane` or a bounded side stage, but it must preserve ticket context, queue context, and draft state
- support deep links must land on the ticket workspace with the relevant cluster or action highlighted, not on detached logs or raw audit pages
- replay, observe-only, and mutating postures must be mutually explicit; a support route may not inherit mutation controls while a replay checkpoint or observe-only scope is active
- action drawers and escalation review routes must reacquire `actionLeaseRef` if the ticket version or route intent has changed before rendering commit controls
- replay return, observe return, and escalation return may reopen live controls only after `restoreSettlementRef` proves the current route intent, mask scope, current `SupportLineageBinding`, actionable scope member, lease posture, and any externally consequential pending work have been safely reconciled
- if `activeActionSettlementRef` or `restoreSettlementRef` indicates pending confirmation, stale reacquire, or read-only recovery, the same ticket shell must hold provisional posture and refuse a second live recovery or resend action until the authoritative restore chain settles
- permission fallback must preserve ticket context and masking scope in read-only mode rather than ejecting the operator to a generic inbox or access error

## Route inventory contract

Route inventory should be maintained as part of this file and include:

- patient public routes
- patient signed-in routes
- workspace routes
- hub routes
- operations routes
- support routes
- governance/admin routes
- deep-link entry routes
- auth recovery routes

Every route entry should carry:

- owning shell
- `shellFamilyOwnershipContractRef`
- `routeFamilyOwnershipClaimRef`
- `canonicalObjectDescriptorRef`
- `owningBoundedContextRef`
- `contributingBoundedContextRefs[]`
- `requiredContextBoundaryRefs[]`
- minimum auth state
- patient-data exposure level
- deep-linkable yes or no
- `shellContinuityKeySeed`
- `shellScopeRef`
- `shellNavigationManifestRef`
- `routeMorphologyDescriptorRef`
- `routeAdjacencyContractRefs[]`
- `dominantQuestionRef`
- `dominantActionRef`
- `dominantActionHierarchyRef`
- `selectedAnchorPolicyRef`
- `surfaceStateContractRef`
- `statusPresentationContractRef`
- `artifactSurfaceBindingRef` where the route can preview, download, print, export, or hand off an artifact
- `outboundNavigationGrantPolicyRef` where the route can leave the current shell or channel
- `automationAnchorProfileRef`
- mobile support level
- fallback page
- analytics event family
- `routeIntentContractRef`
- `settlementContractRef`
- `bffSurface`
- `readContractRef`
- `mutationContractRefs`
- `visibilityGrantContractRef`
- `returnContractRef` where same-shell resume is supported
- `returnTokenContractRef` where cross-shell return is supported
- `continuationTokenContractRef` where repair, re-auth, or replay-resume is supported
- `restoreSettlementContractRef` where replay or other governed restore is supported
- `continuityControlCodeRefs[]` where same-shell recovery, calm settlement, or resume posture depends on explicit continuity proof
- `continuityEvidenceProducerRefs[]` where the route depends on named continuity producer families
- `continuityEvidenceContractRef` where actionable, settled, or recoverable posture depends on `RouteContinuityEvidenceContract`
- `recoveryContractRef`
- `liveChannelRef`
- `cachePolicyRef`
- `errorContractRef`

Verification for this layer must cover:

- every route resolving to exactly one `CanonicalObjectDescriptor`
- every route family resolving to exactly one `RouteFamilyOwnershipClaim` and one `ShellFamilyOwnershipContract`
- every route family resolving through its shell family's `ShellNavigationManifest` plus one `RouteMorphologyDescriptor`, one `RouteAdjacencyContract`, one `SelectedAnchorPolicy`, one `DominantActionHierarchy`, one `StatusPresentationContract`, and one `SurfaceStateContract`
- browser back or forward and hard refresh restoring the correct selected nav group, selected anchor, and dominant action from `NavigationStateLedger` when shell continuity is unchanged
- no provisional child phase, settlement confirmation, stale-review demotion, or live delta creating history-stack spam
- cross-shell launches restoring the correct canonical object page rather than transient intermediary views
- stale patient transaction links degrading into in-shell recovery without bypassing `ScopedMutationGate`
- patient transaction routes preserving settlement, return, and continuation bindings so home, records, and thread entry points cannot reopen stale CTAs after repair or re-auth
- embedded patient transaction routes failing closed on session-epoch, subject-binding, manifest-version, or channel-freeze drift without ejecting the user from the owning shell
- secure record routes preserving placeholder and release semantics under delayed release, step-up, and identity-hold states
- support deep links preserving replay checkpoint hash, evidence-boundary hash, replay masking, observe-only scope, action-lease safety, held-draft disposition, and `SupportReplayRestoreSettlement` posture on refresh and re-entry
- every continuity-sensitive route family resolving exactly one `RouteContinuityEvidenceContract`, one named producer-family set, and one control-code set; local cache, anchor memory, or projection freshness alone may not satisfy that verification
- empty, partial, read-only, blocked, and recovery postures preserving the nearest safe shell anchor and exposing that posture in both DOM state and telemetry
- artifact-capable routes refusing raw file, browser, print, or cross-app exits unless the current `ArtifactSurfaceBinding` and `OutboundNavigationGrant` posture are valid for the same route family and continuity envelope
- route-family `AutomationAnchorProfile` coverage proving shell continuity reuse, dominant action anchoring, selected-anchor continuity, artifact posture, and recovery posture

## Shared IA rules

All shells must implement one IA rulebook anchored by continuity, summary-first hierarchy, and calm exception handling.

High-priority IA gaps in this layer:

1. shells name common navigation patterns, but not yet through one typed manifest that can prove section order, utility order, blocked sections, and compact-nav behavior across browser, embedded, and operational variants
2. route families still describe content, but not yet one shared dominant question, dominant action, and shell morphology contract that prevents shell drift between summary, detail, compare, and recovery states
3. empty, partial, read-only, and recovery states are mentioned generically, but not yet represented as one typed surface-state contract that keeps the shell calm and explicit under degraded truth
4. automation and accessibility anchors are expected, but route families do not yet publish one explicit coverage profile for required semantic regions, state attributes, disclosure fences, keyboard posture, focus restore, and live-announcement authority
5. route-family shell ownership is still mostly conventional, so child routes and side stages can drift into detached mini-products or borrow the wrong shell grammar
6. contributor bounded contexts can supply projections, actions, or artifacts, but the IA layer does not yet explicitly prevent those contributions from claiming shell ownership or inventing a second route family for the same lifecycle state

Add the shared IA contracts:

**ShellNavigationManifest**
`manifestId`, `shellType`, `primaryGroupOrder`, `utilityGroupOrder`, `defaultGroupRef`, `visibleGroupRefs[]`, `selectedGroupRef`, `compactNavMode = rail | tabs | sheet`, `blockedGroupRefs[]`, `manifestVersionRef`, `manifestState`

`ShellNavigationManifest` is the canonical navigation map for one shell family. Section order, selected section, utility navigation, compact navigation mode, and blocked-group posture must derive from this manifest rather than from route-local layout choices.

**ShellFamilyOwnershipContract**
`shellFamilyOwnershipContractId`, `shellType`, `shellNavigationManifestRef`, `shellScopeDescriptorRef`, `ownedCanonicalObjectDescriptorRefs[]`, `ownedRouteFamilyRefs[]`, `allowedAdjacencyRefs[]`, `boundedSideStageRouteRefs[]`, `crossShellLaunchPolicyRefs[]`, `defaultBoundaryRef`, `contractVersionRef`

`ShellFamilyOwnershipContract` is the authoritative shell-ownership map for one audience shell family. A route may look visually similar to another shell or be served from the same feature area, but it may not claim residency in that shell unless the current contract lists its route family explicitly.

**RouteFamilyOwnershipClaim**
`routeFamilyOwnershipClaimId`, `routeFamilyRef`, `canonicalObjectDescriptorRef`, `owningShellType`, `shellFamilyOwnershipContractRef`, `owningBoundedContextRef`, `contributingBoundedContextRefs[]`, `requiredContextBoundaryRefs[]`, `ownershipMode = shell_root | same_shell_child | same_shell_peer | side_stage_only | cross_shell_entry_only`, `allowedAdjacencyRefs[]`, `requiredMorphologyRef`, `requiredSelectedAnchorPolicyRef`, `requiredDominantActionHierarchyRef`, `requiredStatusPresentationContractRef`, `artifactPostureMode = none | inline | bounded_stage | governed_handoff`, `boundaryEscalationRef`, `claimVersionRef`

`RouteFamilyOwnershipClaim` is the single authoritative declaration of who owns a route family. It separates shell ownership from bounded-context ownership: booking, record, messaging, callback, artifact, audit, and governance contributors may provide data, evidence, or child tasks, but they do not get to re-home the route outside the shell family that owns continuity or outside the bounded context that owns lifecycle truth for that route's governing object.

**RouteMorphologyDescriptor**
`routeMorphologyDescriptorId`, `routeFamilyRef`, `routeFamilyOwnershipClaimRef`, `canonicalObjectDescriptorRef`, `shellType`, `ownershipMode = shell_root | same_shell_child | same_shell_peer | side_stage_only | cross_shell_entry_only`, `navGroupRef`, `dominantQuestionRef`, `dominantActionRef`, `defaultTopology`, `sameShellChildRouteRefs[]`, `allowedSupportRegionRefs[]`, `successMorphDispositionRef`, `recoveryMorphDispositionRef`

`RouteMorphologyDescriptor` defines how one route family should feel and behave across summary, detail, compare, success, and recovery states. It prevents the same object from jumping between unrelated shells or incompatible layout grammars, and it must remain compatible with the route family's ownership claim rather than inventing an alternative shell posture.

**SurfaceStateContract**
`surfaceStateContractId`, `routeFamilyRef`, `selectedAnchorRef`, `state = loading | refreshing | empty | partial | read_only | recovery_required | pending_confirmation | settled`, `headlineRef`, `explanationRef`, `dominantActionRef`, `placeholderContractRef`, `lastKnownGoodSummaryRef`, `announcementModeRef`, `stateVersionRef`

`SurfaceStateContract` is the route-family declaration for every user-facing surface that can load, refresh, settle, degrade, or recover. Runtime rendering still resolves through `SurfacePostureFrame`; this contract declares the allowed calm-state grammar and preserves the nearest safe summary and dominant action without forcing shell replacement.

**AutomationAnchorProfile**
`automationAnchorProfileId`, `routeFamilyRef`, `profileSelectionResolutionRef`, `surfaceStateKernelBindingRef`, `accessibilitySemanticCoverageProfileRef`, `requiredSurfaceRefs[]`, `requiredSemanticRegionRefs[]`, `requiredStateAttributeRefs[]`, `requiredFocusMarkerRefs[]`, `requiredAnnouncementMarkerRefs[]`, `requiredVisualizationAuthorityRefs[]`, `semanticLocatorStrategyRef`, `disclosureFenceRef`, `profileVersionRef`

`AutomationAnchorProfile` is the verification contract for semantic regions, shell continuity cues, selected anchors, state posture, focus restore, live-announcement authority, visualization authority, and disclosure fences. It makes calmness, continuity, recovery, and accessibility posture testable without depending on brittle cosmetic selectors or route-local naming drift, and it must cite the same `ProfileSelectionResolution` plus `SurfaceStateKernelBinding` that govern the rendered route.

Route-family `AutomationAnchorProfile` coverage must publish or reference the governing `AutomationAnchorMap` and `TelemetryBindingProfile` from `canonical-ui-contract-kernel.md`; route-local alias vocabularies are invalid.

**AccessibilitySemanticCoverageProfile**
`accessibilitySemanticCoverageProfileId`, `routeFamilyRef`, `shellType`, `audienceTier`, `profileSelectionResolutionRef`, `semanticSurfaceRefs[]`, `accessibleSurfaceContractRefs[]`, `keyboardInteractionContractRefs[]`, `focusTransitionContractRefs[]`, `assistiveAnnouncementContractRefs[]`, `freshnessAccessibilityContractRefs[]`, `assistiveTextPolicyRef`, `fieldAccessibilityContractRefs[]`, `formErrorSummaryContractRefs[]`, `timeoutRecoveryContractRefs[]`, `visualizationFallbackContractRefs[]`, `visualizationTableContractRefs[]`, `visualizationParityProjectionRefs[]`, `automationAnchorProfileRef`, `automationAnchorMapRef`, `surfaceStateSemanticsProfileRefs[]`, `surfaceStateKernelBindingRefs[]`, `designContractPublicationBundleRef`, `requiredBreakpointClassRefs[]`, `missionStackCoverageRef`, `hostResizeCoverageRef`, `embeddedSafeAreaCoverageRef`, `reducedMotionEquivalenceRef`, `bufferedUpdateCoverageRefs[]`, `coverageTupleHash`, `coverageState = complete | degraded | blocked`, `verifiedAt`

`AccessibilitySemanticCoverageProfile` is the route-family declaration that accessibility is complete as a system contract, not a component checklist. It proves the route's surfaces, keyboard models, focus transitions, live-announcement rules, freshness semantics, repair grammar, visualization parity, assistive text, automation anchors, profile selection, and kernel state semantics all resolve through the same current `DesignContractPublicationBundle`. If coverage drifts under breakpoint, host resize, safe-area, reduced-motion, or buffered-update conditions, the route must fail closed into the last safe summary, table, list, placeholder, or recovery posture instead of leaving semantically partial interactivity armed.

**NavigationStateLedger**
`navigationStateLedgerId`, `shellContinuityKey`, `manifestRef`, `selectedGroupRef`, `selectedRouteFamilyRef`, `activeEntityContinuityKey`, `routeStackRefsByGroup[]`, `utilityOverlayRefs[]`, `selectedAnchorRef`, `filterStateRef`, `scrollStateRef`, `sideStageRef`, `restoreEpoch`, `historyMode = browser_aligned | shell_managed`, `ledgerState = live | stale | recovery_required`

`NavigationStateLedger` is the shell's authoritative navigation memory. Browser back or forward, hard refresh, same-shell recovery, and compact-nav restore must all resolve through this ledger instead of relying on ambient browser history or route-local component state.

**RouteAdjacencyContract**
`routeAdjacencyContractId`, `fromRouteFamilyRef`, `toRouteFamilyRef`, `fromRouteFamilyOwnershipClaimRef`, `toRouteFamilyOwnershipClaimRef`, `shellFamilyOwnershipContractRef`, `adjacencyType = same_object_child | same_object_peer | same_shell_object_switch | cross_shell_return | hard_boundary`, `historyPolicy = push | replace | none`, `selectedGroupDispositionRef`, `anchorDispositionRef`, `focusTargetRef`, `dominantActionDispositionRef`, `recoveryFallbackRef`, `continuityEvidenceContractRef`, `contractVersionRef`

`RouteAdjacencyContract` is the typed morph contract between two route families. It decides whether navigation keeps the shell, keeps the object, changes the active object inside the shell, or crosses a true shell boundary; it also owns history, focus, anchor, and recovery behavior. A same-shell adjacency is valid only while both route-family ownership claims still resolve through the same shell-family ownership contract.

**SelectedAnchorPolicy**
`selectedAnchorPolicyId`, `routeFamilyRef`, `primaryAnchorSlotRef`, `secondaryAnchorSlotRefs[]`, `anchorIdentityContractRef`, `patchEquivalenceRuleRef`, `invalidationPresentationRef`, `replacementRequirementRef`, `replacementAckRequirementRef`, `releaseRuleRefs[]`, `refreshRestoreOrderRef`, `stubRetentionRuleRef`, `compareAnchorPolicyRef`, `fallbackAnchorRef`, `policyVersionRef`

`SelectedAnchorPolicy` defines which object or choice is the route family's primary continuity anchor, how tuple identity is computed, when in-place patching is legal, how invalidation is explained, when a replacement requires explicit acknowledgement, how long stubs must survive, how compare anchors relate to the primary anchor, and what should restore first on refresh, re-entry, or recovery. The policy belongs to the owning route-family claim and may not be silently swapped because a feature-specific child surface wants different anchor behavior.

**DominantActionHierarchy**
`dominantActionHierarchyId`, `routeFamilyRef`, `shellDominantActionRef`, `primaryRegionDominantActionRef`, `competingActionRefs[]`, `preemptionOrderRef`, `demotionRuleRefs[]`, `blockedFallbackActionRef`, `quietReturnActionRef`, `hierarchyVersionRef`

`DominantActionHierarchy` prevents CTA drift. It defines the single dominant action for the shell and route family, the legal supporting actions, the order in which blockers may preempt them, and the quiet return action after settlement or recovery.

**StatusPresentationContract**
`statusPresentationContractId`, `routeFamilyRef`, `macroStateRef`, `sharedStripSentenceRef`, `freshnessChipPolicyRef`, `localStateOwnerRefs[]`, `bannerEscalationRef`, `settlementPresentationRef`, `recoveryPresentationRef`, `duplicationFenceRef`, `contractVersionRef`

`StatusPresentationContract` is the route-family grammar for shell status. It decides which meaning belongs in the shared strip, which stays local to a card or region, when banner escalation is legal, and how freshness, settlement, and recovery must read as one coherent sentence.

Rules:

- one `ShellNavigationManifest` governs each shell family, including compact and embedded variants
- one `ShellFamilyOwnershipContract` governs each shell family, and only the route families named by that contract may render as resident members of the shell
- one `NavigationStateLedger` must exist for each shell epoch; browser back or forward, hard refresh, same-shell restore, and compact-nav resume must rehydrate from it before child-surface rendering begins
- every route family must publish exactly one `RouteFamilyOwnershipClaim`; a route family may not belong to multiple shells just because multiple domains contribute data, actions, or artifacts to it
- every same-shell route pair must publish one `RouteAdjacencyContract`; route-local component logic may not invent its own shell-reuse, history, or focus behavior
- every route family must publish one dominant question and one dominant action through `RouteMorphologyDescriptor`
- every route family must also publish one `SelectedAnchorPolicy`, one `DominantActionHierarchy`, and one `StatusPresentationContract`
- every route family must also publish or reference one current `ProfileSelectionResolution` and one current `SurfaceStateKernelBinding`
- every route family must also publish exactly one `AccessibilitySemanticCoverageProfile` and one `AutomationAnchorProfile`
- `RouteFamilyOwnershipClaim.ownershipMode = same_shell_child | same_shell_peer | side_stage_only` must resolve into the owning shell on deep link, refresh, recovery, and browser navigation; those modes may not spawn detached pages or substitute a second shell because of implementation convenience
- contributing bounded contexts may supply projections, child actions, artifacts, and side stages through `contributingBoundedContextRefs[]`, but they may not override the shell family, lifecycle owner, ownership mode, or boundary rules named by the route-family claim
- if a route consumes another context's milestone, projection, or governance decision, that seam must appear in `requiredContextBoundaryRefs[]`; shell-local component code may not invent direct sibling-context mutation paths
- same-shell navigation must restore selected section, selected anchor, disclosure state, filters, and scroll position whenever the `shellContinuityKey` is unchanged
- `RouteAdjacencyContract.historyPolicy = replace` is mandatory for provisional child phases, quiet recovery, and non-final settlement states; `push` is reserved for user-meaningful object or mode changes, and `none` is required for projection-only or status-only change
- loading, refreshing, empty, partial, read-only, pending-confirmation, and recovery states must be declared through `SurfaceStateContract` and rendered through one `SurfacePostureFrame`; generic banners or detached error pages are not sufficient
- `SurfaceStateContract.state = settled` must map to the strongest confirmed object or artifact summary first and defer secondary detail until requested
- status strip, banner, and local state ownership must derive from `StatusPresentationContract` plus `StatusArbitrationDecision`; no route family may improvise a second conflicting status grammar
- `AccessibilitySemanticCoverageProfile.coverageState = complete` is required before a route family may present calm, writable, verified, or visual-dominant posture; degraded or blocked coverage must downgrade the same shell to summary-first, table-first, placeholder, or recovery posture
- `AccessibilitySemanticCoverageProfile` must explicitly cover `compact | narrow | medium | expanded | wide`, `mission_stack` fold states, host resize, safe-area shifts, `400%` zoom or equivalent reflow floors, reduced motion, and buffered live-update or replay posture; unsupported modes are blocked modes, not best-effort variants
- `AutomationAnchorProfile` must expose landmarks, state summary, dominant action, selected anchor, focus restore state, live-announcement authority, visualization authority, artifact posture, and recovery posture in the DOM and telemetry without widening PHI disclosure
- route-family automation and telemetry assertions must use the same kernel vocabulary published through `AutomationAnchorMap` and `TelemetryBindingProfile`
- route-family automation, telemetry, and accessibility assertions must also agree with the same `ProfileSelectionResolution`, `SurfaceStateKernelBinding`, `AccessibilitySemanticCoverageProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; route-local ARIA or marker aliases are invalid
- the published `AudienceSurfaceRouteContract`, `FrontendContractManifest`, and `AudienceSurfaceRuntimeBinding` for a route family must reference the same `ProfileSelectionResolution`, `SurfaceStateKernelBinding`, `AccessibilitySemanticCoverageProfile.coverageTupleHash`, `AutomationAnchorProfile`, and `SurfaceStateSemanticsProfile` tuple; route-local accessibility patches or test-only selectors are invalid substitutes for browser authority
- route-family automation and telemetry assertions must also cite the governing `DesignContractPublicationBundle` and fail when the current `DesignContractLintVerdict` is blocked, stale, or missing
### 1. Dominant question and orientation

- every route family resolves one dominant question, one dominant action, and one primary region through `AttentionBudget`
- orientation belongs at shell level once: shell title or breadcrumb, object label, and one short status summary; the same summary must not reappear as a banner and again as the first card
- a second promoted region requires an explicit blocker, compare, or user-pin reason
- one status dictionary per audience remains mandatory: patient-safe language for patients and staff-precise language for internal operators

### 2. Standard surface-state contract

- every primary region and every promoted support region must resolve loading, empty, sparse, blocked, stale, degraded, recovery, and settled posture through `SurfaceStateFrame` backed by the governing `SurfacePostureFrame`
- once the entity or board scope is known, those states stay local to the affected region rather than replacing the shell
- empty and sparse states reassure first, explain why the surface is quiet, and offer one safest useful next step
- settled states confirm outcome in place and preserve a clear next step or return path; toast-only settlement is invalid

### 3. Status ownership and duplication suppression

- the shared status strip owns cross-surface save, sync, freshness, and queued-update posture
- `SurfaceStateFrame` owns localized actionability, missing content, recovery, or settlement for one region
- promoted banners are reserved for blockers, urgent risk, or a new user decision that cannot be safely conveyed by the strip or local frame
- the same semantic state may not appear simultaneously in banner, strip, card, and toast unless one representation carries a materially different action consequence

### 4. Navigation, return, and changed-since-seen

- breadcrumbs, back affordances, and cross-shell returns must be deterministic per shell and continuity token, not dependent on fragile browser history
- same-entity route morphs preserve scroll, focus, selected anchor, filters, and the last quiet posture where safe
- changed-since-seen markers come from `StateBraid`, queue deltas, or review-required evidence; badges may not improvise their own private status language
- saved views and shared filter links must restore the same object set, filter explanation, and return path across desktop and narrow layouts

### 5. Side-stage, drawer, and full-surface decision rules

- use `InlineSideStage` for adjacent inspect, compare, and compose work that should preserve the origin surface
- use drawers only for bounded, reversible, non-primary tasks that do not become the dominant question
- use a full surface only when the primary task changes materially, when the artifact itself becomes the primary reading surface, or when policy requires a dedicated recovery posture

### 6. Artifact rendering and handoff

- every document, receipt, attachment, export bundle, print surface, and external handoff must resolve through one `ArtifactStage` plus the applicable `ArtifactPresentationContract`
- structured summary is the default when allowed; richer preview is progressive disclosure, not a separate product
- route families must prove one `ArtifactSurfaceBinding`, one live `ArtifactSurfaceContext`, and one live `ArtifactModeTruthProjection` before artifact bytes, print, overlay, or external handoff controls can arm
- byte download, print, and external handoff are explicit secondary actions and must preserve a deterministic return anchor through `OutboundNavigationGrant`
- transfer-ready, delivered, returned, or recovery-needed posture must come from `ArtifactTransferSettlement.authoritativeTransferState`, not from optimistic button state or browser events
- constrained-channel viability, byte ceilings, parity, masking posture, and return continuity must also come from `ArtifactModeTruthProjection`; route-local browser checks or component-local bridge assumptions are invalid substitutes
- if preview, parity, or grant validity changes mid-session, the artifact degrades in place through `ArtifactFallbackDisposition` to governed summary or read-only provenance instead of failing closed into a blank page

## Shared visibility, hydration, and empty-state rules

High-priority IA defects in this layer:

1. empty, loading, partial-visibility, and read-only placeholder states are referenced generically, but not yet bound to one shared contract that preserves shell continuity and selected anchor
2. routes with known governing objects can still imply whole-page loading or blank-state reset instead of region-level hydration inside the current shell
3. partial visibility can collapse into omission or contradictory writable posture because placeholder, summary-safety, and CTA rules are not centralized
4. empty states are not yet required to distinguish never-created, filtered, completed, gated, unavailable, and no-results conditions
5. screen-reader and automation semantics for hydration, placeholder, and empty states are not yet explicit enough for verification under real operational drift

Add the shared state contracts:

**SurfaceHydrationContract**
`surfaceHydrationContractId`, `routeFamilyRef`, `canonicalObjectDescriptorRef`, `knownEntityStrategy = preserve_shell | summary_first | recovery_first`, `regionHydrationRefs[]`, `statusStripMode`, `selectedAnchorRef`, `hydrationAnnouncementRef`, `hydrationState = partial | hydrated | degraded`

`SurfaceHydrationContract` governs how a known object hydrates. Runtime rendering still resolves through `SurfacePostureFrame` plus localized `SurfaceStateFrame`; if the shell already knows the canonical object, refresh, reconnect, restore, or deep-link re-entry must preserve shell chrome, `CasePulse`, the shared status strip, and any valid `SelectedAnchor` while regions hydrate in place.

**RegionPlaceholderContract**
`regionPlaceholderContractId`, `surfaceRef`, `placeholderContractRef`, `reasonCode`, `summarySafetyTier`, `selectedAnchorRef`, `preserveFootprintMode = compact | stable_height | row_stub`, `dominantRecoveryActionRef`, `announcementPriority`, `placeholderState = loading | gated | partial_visibility | stale_recovery | empty | blocked`

`RegionPlaceholderContract` makes placeholders structural. A placeholder must explain why detail is limited, what remains safely visible, and the next safe action without dropping the user's anchor, overstating writable posture, or faking completeness.

**EmptyStateContract**
`emptyStateContractId`, `routeFamilyRef`, `emptyReason = never_created | completed | filtered_out | temporarily_unavailable | gated | no_results`, `expectedObjectTypeRef`, `whyNothingIsShownRef`, `typicalContentsRef`, `safestNextActionRef`, `returnIntentRef`, `emptyState = calm | recovery | action_needed`

`EmptyStateContract` prevents decorative empties. It feeds `SurfaceStateContract` and `SurfacePostureFrame` so a route can tell the user why nothing is shown now, what normally appears here, and what the safest next move is.
Routes with governed spotlight or dominant-card selection may not infer calm empty posture from an empty candidate array produced during partial hydration, projection lag, or stale local cache; the empty reason must still be backed by the route's typed decision contract or recovery posture.

**ProjectionReadinessFence**
`projectionReadinessFenceId`, `surfaceRef`, `audienceSurfaceRuntimeBindingRef`, `migrationExecutionBindingRef`, `requiredReadPathCompatibilityWindowRef`, `requiredReadPathCompatibilityDigestRef`, `requiredProjectionContractVersionSetRef`, `requiredProjectionCompatibilityDigestRef`, `requiredProjectionReadinessRefs[]`, `requiredProjectionBackfillExecutionLedgerRefs[]`, `requiredMigrationCutoverCheckpointRef`, `requiredMigrationObservationWindowRef`, `selectedAnchorRef`, `presentationState = live | summary_only | recovery_only | blocked`, `evaluatedAt`

`ProjectionReadinessFence` is the read-model honesty gate for shells. When a route depends on a partially migrated or partially backfilled projection, this fence decides whether the surface may stay live, must degrade to summary-only, must enter governed recovery, or must block outright while preserving shell continuity and anchor context.

**WritableEligibilityFence**
`writableEligibilityFenceId`, `surfaceRef`, `routeIntentRef`, `shellConsistencyRef`, `visibilityPolicyRef`, `freshnessRequirementRef`, `settlementRequirementRef`, `publicationRequirementRef`, `capabilityRequirementRef`, `audienceSurfaceRuntimeBindingRef`, `releaseTrustFreezeVerdictRef`, `projectionReadinessFenceRef`, `publicationParityRequirementRef`, `continuityEvidenceRequirementRef`, `eligibilityState = writable | read_only | recovery_only | blocked`

`WritableEligibilityFence` is the final gate on calm actionability. Partial hydration, local cache, optimistic summaries, stale read models, stale capability projections, or a stale published contract may not reopen dominant CTAs until the visible shell, visibility, runtime publication binding, shared `ReleaseTrustFreezeVerdict`, projection-readiness fence, parity verdict, freshness, settlement, capability requirement, and continuity evidence are all still valid for that route.

Rules:

- if the canonical object is already known, the shell must never blank itself to communicate loading; use `SurfaceHydrationContract` plus region-level skeletons or placeholders instead
- shell hydration may promote at most one placeholder to full explanation; other incomplete regions must stay as quiet stubs so the dominant question and action remain stable
- partial visibility, delayed release, role scope, publication drift, stale continuity, or frozen channel posture must preserve the item's location with `RegionPlaceholderContract`; silent omission is forbidden unless policy disallows awareness itself
- partial migration, dual-read, or rebuild lag must resolve through `ProjectionReadinessFence` and `RegionPlaceholderContract`; a non-empty row set, zero-result response, or locally cached count is not enough to claim the route is fully current
- `ProjectionReadinessFence` must be computed from the current `MigrationExecutionBinding`, `ReadPathCompatibilityWindow`, `ReadPathCompatibilityDigest`, `ProjectionContractVersionSet`, `projectionCompatibilityDigest`, `ProjectionBackfillExecutionLedger`, `MigrationCutoverCheckpoint`, and latest migration observation window where applicable; shells may not infer route honesty from a job label or digest fragment alone
- `WritableEligibilityFence` must gate the dominant CTA and every mutating control; partial hydration or optimistic local acknowledgement alone may not recreate writable posture
- if `capabilityRequirementRef` exists, `WritableEligibilityFence` must fail closed whenever the bound capability contract is not in its route-declared live state; booking-style states such as `assisted_only`, `linkage_required`, `local_component_required`, `degraded_manual`, `recovery_only`, or `blocked` may preserve the current anchor and strongest safe summary, but they may not keep the stale self-service, superseded-binding, or wrong-adapter CTA armed
- `freshnessRequirementRef` must resolve through the current `ProjectionFreshnessEnvelope`; transport health, websocket liveness, recent polling, or cursor advance alone may not satisfy writable freshness
- `WritableEligibilityFence` must also fail closed when the bound `ReleaseTrustFreezeVerdict.surfaceAuthorityState != live`; shells may not reconstruct calm or writable posture from locally cached trust rows, watch-tuple fragments, or old channel manifests
- no surface may infer writable posture from route family, compiled component state, `surfacePublicationRef`, `RuntimePublicationBundle`, `DesignContractPublicationBundle`, supplier label, integration-mode badge, or appointment-status shortcut alone when the linked `AudienceSurfaceRuntimeBinding`, `ProjectionReadinessFence`, capability contract, design-contract verdict, or parity verdict is stale, missing, summary-only, recovery-only, or blocked
- if `ProjectionReadinessFence.presentationState = summary_only | recovery_only | blocked`, the surface must preserve the same anchor and strongest safe summary but suppress calm empty states, no-results certainty, and mutation-capable controls until readiness returns
- if the latest migration action is accepted but its observation window has not yet converged, the fence must remain `summary_only | recovery_only | blocked` as declared by the bound recovery posture; command acceptance alone may not restore calm live or writable presentation
- empty states must name the specific `emptyReason`, say what usually lives there, and surface the fastest safe next action; celebratory empty states are allowed only after authoritative settlement or confirmed completion
- route-level loading and placeholder announcements must be bounded; assistive technology should hear one concise summary first, then only region-level updates that change the dominant action, anchor, or recovery path
- every placeholder, empty, partial, and recovery state must expose deterministic DOM markers for state, reason, and writable eligibility so automation can verify the same calm posture the user sees

## Cross-object linking

Cross-links must follow lineage-first rules:

- request pages can link to all downstream objects on lineage
- downstream pages must always link back to canonical request context
- links should preserve object identity and auditability
- links should never expose data that exceeds current role scope

## Artifact rendering, preview, export, download, print, and handoff rules

High-priority artifact-surface gaps in this layer:

1. routes can already expose documents, letters, appointment outputs, evidence packs, and print or browser handoff, but the platform layer does not yet require one shared binding from shell route to artifact presentation posture
2. summary-first artifact presentation is implied in specialist blueprints, but the platform route inventory still allows routes to behave as raw download or detached-browser exits
3. parity between an inline summary and the source artifact is not yet surfaced as one typed trust digest, which weakens user confidence under stale extraction or delayed bytes
4. narrow, embedded, frozen, and degraded routes do not yet share one platform rule for how artifact preview and external handoff should fall back without breaking shell continuity

Add the artifact-surface contracts:

`ArtifactPresentationContract` and `OutboundNavigationGrant` are canonical cross-phase contracts defined in Phase 0. This layer is responsible for binding them to route families, shell continuity, parity signaling, and same-shell recovery so artifact UX cannot devolve into raw file delivery or detached browser flows.

**ArtifactPresentationContract**
`artifactPresentationContractId`, `artifactRefPattern`, `audienceSurface`, `visibilityCoverageRef`, `minimumNecessaryContractRef`, `primaryMode = structured_summary | byte_download | external_delivery`, `previewVisibility = hidden | awareness_only | summary_only | governed_preview`, `fullBodyMode = forbidden | step_up_required | allowed`, `summarySafetyTier`, `summaryContractRef`, `inlinePreviewContractRef`, `downloadContractRef`, `printContractRef`, `handoffContractRef`, `placeholderContractRef`, `redactionPolicyRef`, `maxInlineBytes`, `requiresStepUpForFullBody`, `allowedFallbackModes`, `channelSpecificNoticeRef`

`ArtifactPresentationContract` is the summary-first law for any document, receipt, attachment, export, reminder, transcript, or other governed artifact. Artifact awareness, structured summary, governed preview, byte delivery, print, and external handoff are separate permissions. A route may never infer richer artifact access from filename, mime type, byte availability, or optimistic browser capability.

**ArtifactSurfaceBinding**
`artifactSurfaceBindingId`, `routeFamilyRef`, `artifactPresentationContractRef`, `minimumNecessaryContractRef`, `summaryContractRef`, `inlinePreviewContractRef`, `downloadContractRef`, `printContractRef`, `handoffContractRef`, `artifactParityPolicyRef`, `artifactTransferPolicyRef`, `artifactFallbackPolicyRef`, `outboundNavigationGrantPolicyRef`, `artifactLineageRef`, `summaryProjectionRef`, `selectedAnchorRef`, `returnContractRef`, `embeddedFallbackRef`, `requiredSourceAuthorityState = summary_verified | source_only | recovery_only`, `artifactState = summary_first | bytes_available | external_handoff | recovery_only`

`ArtifactSurfaceBinding` is the required binding between a route family and its artifact posture. Runtime rendering still resolves through `ArtifactSurfaceFrame`; this binding proves how the shell should render the summary, which mode-specific contracts govern inline preview, download, print, and handoff, which parity, transfer, and fallback policies apply, whether summary verification is required or source-only posture is acceptable, how the current anchor and return path are preserved, and how embedded or frozen channels must fall back.

**ArtifactParityDigest**
`artifactParityDigestId`, `artifactSurfaceBindingRef`, `summaryVersionRef`, `summaryArtifactRef`, `summaryArtifactHash`, `sourceArtifactRef`, `sourceArtifactHash`, `derivationPackageRef`, `maskingState = current | stale | blocked`, `authorityState = source_authoritative | summary_verified | summary_provisional | source_only | recovery_only`, `parityState = verified | provisional | stale | unavailable | blocked`, `blockingRefs[]`, `parityTupleHash`, `lastVerifiedAt`

`ArtifactParityDigest` is the truth-visible parity marker between the in-shell summary and the source artifact bytes. It feeds `ArtifactSurfaceFrame.sourceParityState`; if parity is provisional, stale, unavailable, or blocked, the artifact surface must say so before a user assumes the inline summary is authoritative. `authorityState` makes explicit whether the shell is showing a verified derivative, a provisional summary, or source-only posture for the current tuple.

**ArtifactSurfaceContext**
`artifactSurfaceContextId`, `canonicalObjectDescriptorRef`, `artifactPresentationContractRef`, `artifactModeContractRef`, `minimumNecessaryContractRef`, `redactionPolicyRef`, `artifactRef`, `sourceObjectRef`, `entityContinuityKey`, `routeFamilyRef`, `selectedAnchorRef`, `recordOriginContinuationRef`, `visibilityTier`, `summarySafetyTier`, `artifactParityDigestRef`, `sourceAuthorityState`, `parityTupleHash`, `binaryArtifactDeliveryRef`, `artifactByteGrantRef`, `bridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, `channelProfile = browser | embedded | constrained_browser`, `artifactModeTruthProjectionRef`, `presentationMode = structured_summary | governed_preview | governed_download | print_preview | external_handoff | placeholder_only | recovery_only`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantRef`, `releaseRecoveryDispositionRef`, `routeFreezeDispositionRef`, `continuityEvidenceRef`, `contextTupleHash`, `contextState = live | pending_transfer | recovery_only | blocked`

`ArtifactSurfaceContext` binds preview, export, and handoff to the same shell, anchor, parity digest, source-authority state, visibility ceiling, minimum-necessary contract, byte-delivery posture, channel capability, and recovery posture that already govern the source object. It feeds the runtime `ArtifactSurfaceFrame`, `ArtifactModeTruthProjection`, and `ArtifactStage` rather than replacing them.

**ArtifactTransferSettlement**
`artifactTransferSettlementId`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `recordOriginContinuationRef`, `selectedAnchorRef`, `binaryArtifactDeliveryRef`, `artifactByteGrantRef`, `transferIntent = inline_open | download | print | overlay | browser_handoff | cross_app_handoff | secure_send_later`, `localAckState = none | shown`, `authoritativeTransferState = pending | available | delivered | returned | recovery_required | blocked`, `outboundNavigationGrantRef`, `governingSettlementRef`, `recoveryContinuationTokenRef`, `sameShellReturnRef`, `displayDisposition = inline_pending | ready | fallback_promoted | blocked`

`ArtifactTransferSettlement` keeps delivery truth explicit. Local click acknowledgement, browser download start, or overlay launch is never the final success state on its own.

**ArtifactFallbackDisposition**
`artifactFallbackDispositionId`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `reasonCode = unsupported_channel | size_limit | print_forbidden | grant_expired | byte_grant_unavailable | visibility_limited | publication_stale | preview_parity_drift | bridge_capability_missing | browser_only_preview_forbidden | return_contract_stale | handoff_blocked`, `allowedFallbackMode = structured_summary | read_only_placeholder | secure_send_later | external_handoff | support_recovery`, `dominantActionRef`, `preserveAnchorMode`, `resumeAnchorRef`, `sameShellReturnRef`, `noticeCopyRef`, `dispositionState`

`ArtifactFallbackDisposition` is the calm escape hatch for artifact work. Unsupported print, expired grants, embedded limits, stale publication, or parity drift must degrade in place rather than throwing the user into a dead-end browser path.

**OutboundNavigationGrant**
Use the canonical `OutboundNavigationGrant` from Phase 0. In the frontend layer, the active grant must remain route-family-scoped, destination-scrubbed, continuity-bound, and return-safe for the same `ArtifactSurfaceContext`, selected anchor, and shell posture that armed the handoff. Grant installation is permission to attempt handoff, not proof that the handoff completed.

Rules:

- any route that renders or launches documents, letters, results, appointment confirmations, receipts, evidence packs, print views, downloads, calendar exports, or browser handoff must declare `ArtifactSurfaceBinding`
- `ArtifactPresentationContract` governs inline summary, placeholder, byte delivery, print, and external handoff posture; structured same-shell summary is the default experience and runtime rendering still resolves through `ArtifactSurfaceFrame` plus `ArtifactStage`
- summary, inline preview, download, print, and handoff actions must each resolve the matching contract on `ArtifactSurfaceBinding` and `ArtifactSurfaceContext`; a shell may not grant print or handoff simply because summary or inline preview is allowed
- summary, inline preview, download, print, and handoff actions must also resolve the current `ArtifactModeTruthProjection`; a shell may not keep richer artifact posture live from static contract permission alone
- when both inline summary and source bytes are available, the shell must expose one `ArtifactParityDigest` near the artifact summary or shared status strip
- the shell must also expose whether the current summary is `summary_verified`, `summary_provisional`, or `source_only`; source bytes remain authoritative even when parity is verified
- record, result, document, letter, and attachment routes that mix structured summary with source bytes must also expose one current `RecordArtifactParityWitness`; delayed-release, step-up, identity-hold, or redaction drift may not hide behind generic freshness or byte-availability cues
- the initiating card, row, or document anchor must remain visible through `ArtifactSurfaceContext.selectedAnchorRef` before departure, during pending transfer, and on return
- any patient record-origin preview, download, print, or browser handoff must also carry one live `RecordOriginContinuationEnvelope`; artifact recovery may not bypass the same anchor, release, visibility, and continuity fence that governs record follow-up actions
- print, download, export, calendar, and cross-app or browser handoff actions are secondary actions and must consume the current `OutboundNavigationGrant`
- any artifact action that leaves the shell must consume one short-lived `OutboundNavigationGrant`; raw blob URLs, unsanitized query strings, detached print routes, and browser history alone are forbidden handoff mechanisms
- any shell-visible download, print, overlay, or browser acknowledgement must also materialize one `ArtifactTransferSettlement`; local button feedback, browser events, or spawned tabs do not satisfy authoritative availability or successful return on their own
- print is allowed only when the active `ArtifactPresentationContract`, the bound `printContractRef`, and current channel posture permit `print_preview`; otherwise the shell must promote `ArtifactFallbackDisposition` instead of exposing a dead-end print affordance
- embedded or constrained-browser channels must also prove byte-size viability and bridge capability on the current `ArtifactModeTruthProjection`; unsupported print, oversized download, or browser-only preview must degrade to summary, secure-send-later, or bounded recovery without leaving the shell
- local acknowledgement of download, print, or handoff must render as provisional through `ArtifactTransferSettlement`; the shell may look complete only after authoritative availability, governed return, or recovery is known
- unsupported embedded, frozen, partial-visibility, or degraded routes must fall back to same-shell summary, governed placeholder, or bounded recovery through `ArtifactFallbackDisposition`; raw artifact URLs and detached export-only journeys are forbidden
- if grant, publication, channel, byte-delivery ceiling, masking posture, or continuity evidence drifts between preview and transfer, preserve the same shell and downgrade through `ArtifactFallbackDisposition`, `ReleaseRecoveryDisposition`, or `RouteFreezeDisposition` rather than opening detached failure pages
- patient, support, governance, operations, and assistive exports must suppress conflicting dominant actions while artifact or handoff work is the current focus; returning from the artifact must restore the prior quiet posture unless the governing settlement requires follow-up
- artifact posture, parity state, and handoff-grant state must be explicit in DOM and telemetry through the route family's `AutomationAnchorProfile`

## Deep-link and recovery rules

Deep-link handling should be explicit:

- validate link grant and auth state before PHI route resolution
- enforce subject binding where required
- route mismatches to safe recovery pages
- show no PHI on unauthenticated recovery pages

High-priority deep-link defects in this layer:

1. deep links are validated generically, but not yet bound to one typed route intent, canonical object descriptor, and governing version fence
2. grant and auth checks do not yet prove session epoch, subject-binding version, or embedded-channel continuity before PHI routes resolve
3. moved, closed, or superseded objects are listed as recovery cases, but not yet mapped through lineage-aware recovery instead of generic not-found handling
4. recovery pages are mentioned, but not yet governed as same-shell dispositions that preserve continuity context and selected anchor where safe
5. no-PHI recovery is named, but not yet enforced through an explicit redaction fence and typed `RecoveryContinuationToken` contract

Add the deep-link contracts:

**DeepLinkIntentEnvelope**
`envelopeId`, `canonicalObjectDescriptorRef`, `routeFamilyRef`, `routeIntentRef`, `governingObjectRef`, `governingVersionRef`, `visibilityGrantRef`, `continuityEvidenceContractRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `channelFreezeRef`, `issuedAt`, `expiresAt`

`DeepLinkIntentEnvelope` is the typed claim carried by a deep link. Frontend routing may not resolve a PHI-bearing route unless the envelope still matches the current canonical object, intended route family, subject lineage, and any embedded-channel constraints.

**DeepLinkResolutionCheckpoint**
`checkpointId`, `intentEnvelopeRef`, `authState`, `grantState`, `intentMatchState`, `objectExistenceState`, `lineageResolutionRef`, `resolutionState = live | recovery_required | blocked`

`DeepLinkResolutionCheckpoint` is the only authority for deciding whether the link resolves live, morphs to recovery, or blocks. Generic route parsing is not enough; the checkpoint must prove the intent, grant, object, and lineage still agree.

**LineageRecoveryDisposition**
`dispositionId`, `checkpointRef`, `reasonCode`, `replacementObjectRef`, `parentAnchorRef`, `sameShellState`, `selectedAnchorRef`, `recoveryRouteRef`, `dispositionState = redirect_in_shell | placeholder | blocked`

`LineageRecoveryDisposition` handles moved, closed, superseded, or merged objects through lineage-aware recovery. If a request, appointment, thread, or record moved to a new canonical object, the shell must recover to that lineage target or governed placeholder rather than collapsing to a generic 404.

**RecoveryContinuationToken**
`tokenId`, `checkpointRef`, `sameShellRouteRef`, `patientShellContinuityKey`, `returnContractRef`, `requestReturnBundleRef`, `patientActionRecoveryEnvelopeRef`, `shellConsistencyRef`, `surfacePostureFrameRef`, `selectedAnchorRef`, `oneExpandedItemGroupRef`, `summarySafetyTier`, `returnIntentRef`, `supportEscalationRef`, `recordOriginContinuationRef`, `recordReleaseGateRef`, `recordVisibilityEnvelopeRef`, `continuityEvidenceContractRef`, `experienceContinuityEvidenceRefs[]`, `recoveryTupleHash`, `expiresAt`, `tokenState`

`RecoveryContinuationToken` preserves causal recovery. Session-expired, step-up, or repair-required flows must be able to return the user to the intended shell, section, anchor, expanded group, and recovery state after the prerequisite completes. The token must also carry the relevant continuity-evidence contract, the active same-shell return contract, any request-return bundle or patient-action recovery envelope, the last safe surface posture, and any linked `RecordOriginContinuationEnvelope` so resumed routes cannot quietly skip back into writable or calm posture if the governing record fence, shell consistency, continuity evidence, or stale-action tuple is now stale or blocked.

**RecoveryRedactionFence**
`fenceId`, `checkpointRef`, `audienceTier`, `maxVisibleFields`, `placeholderContractRef`, `telemetryDisclosureClass`, `fenceState = enforced | review_required`

`RecoveryRedactionFence` is the no-PHI contract for unauthenticated or under-authorized recovery. Recovery routes may expose only the minimum placeholder, reason, and next step allowed by policy, and telemetry may not leak raw route identifiers or object payloads beyond the declared disclosure class.

Recovery behaviour should be consistent:

- session expired
- access denied
- object not found
- object moved or closed
- stale link

Rules:

- deep links may resolve live only after `DeepLinkResolutionCheckpoint` proves the current `DeepLinkIntentEnvelope`, auth state, grant state, and lineage all still match
- deep links may resolve into writable or final-settled posture only while the carried `continuityEvidenceContractRef` still validates the current route family and same-shell anchor; otherwise they must fall into bounded recovery even if the object still exists
- stale governing version, route intent mismatch, session-epoch drift, subject-binding drift, or embedded-channel freeze must keep the user in bounded recovery rather than falling through to generic route handling
- moved, closed, or superseded objects must prefer `LineageRecoveryDisposition` with same-shell continuity over detached error pages
- any recovery that requires re-auth, step-up, repair, or support escalation must issue a `RecoveryContinuationToken` so the user can return to the intended shell and anchor safely, with the same continuity-evidence contract and latest evidence refs revalidated before ordinary CTA truth resumes
- when the recovering audience is `patient_authenticated` and the same patient shell continuity key still applies, recovery must also preserve the active section, last safe posture, and authoritative return contract rather than reopening generic home, list, or receipt routes
- stale, expired, denied-scope, or blocked-policy patient actions must also preserve the same `patientActionRecoveryEnvelopeRef`, `requestReturnBundleRef` where present, and `recoveryTupleHash`; route handlers may not silently invent a second recovery posture from URL state or browser history
- record-origin child routes may recover as live only while the linked `RecordOriginContinuationEnvelope` still matches the current record version, release gate, visibility envelope, selected anchor, and expanded group; otherwise they must resume in bounded same-shell recovery at the record surface
- patient transaction deep links must re-enter with the same `settlementContractRef`, `returnContractRef`, and `patientActionRecoveryEnvelopeRef` still bound, otherwise they must degrade into in-shell recovery before a live CTA is shown again
- support replay, observe, or action deep links may restore live work only after the relevant `SupportReplayRestoreSettlement` or equivalent restore settlement proves the current ticket, selected anchor, replay checkpoint or observe session, current `SupportLineageBinding`, actionable scope member, current mask scope, held-draft disposition, and pending external-confirmation posture are still valid
- when `RecoveryRedactionFence` is active, recovery surfaces, titles, and telemetry must remain PHI-safe even if the original deep link targeted a PHI-bearing route

## Responsive and composition rules

Desktop and narrow-width behavior must be variations of the same shell rather than separate workflows.

High-priority responsive gaps in this layer:

1. shell guidance names preferred desktop and mobile layouts, but not yet one measured viewport contract that normalizes browser, embedded, and constrained-container width before topology is chosen
2. `mission_stack` is named as a fallback, but not yet as one fold hierarchy with explicit collapse order, compare fallback, sticky action reserve, and same-shell recovery rules
3. compact navigation, compare surfaces, embedded variants, and artifact handoff do not yet publish one shared width-to-layout mapping, which risks hidden current tasks, detached compare flows, or host-specific regressions on narrow screens

Add the responsive contracts:

**ResponsiveViewportProfile**
`responsiveViewportProfileId`, `layoutViewportInlinePx`, `layoutViewportBlockPx`, `containerInlinePx`, `containerBlockPx`, `dynamicViewportBlockPx`, `safeAreaInsetInlineStartPx`, `safeAreaInsetInlineEndPx`, `safeAreaInsetBlockStartPx`, `safeAreaInsetBlockEndPx`, `zoomBand = default | zoomed | reflow_floor`, `textScaleBand = default | elevated | large`, `pointerPrecision = coarse | fine | mixed`, `effectiveInlinePx`, `effectiveBlockPx`, `usableInlinePx`, `usableBlockPx`, `breakpointClass = compact | narrow | medium | expanded | wide`, `reflowState = pass | fallback_required`

`ResponsiveViewportProfile` is the measured responsive truth for one shell epoch. It must derive from the shell container rather than raw device labels so nested browsing contexts, embedded hosts, and constrained browser shells respond to the space they actually have. These responsive layout bands are behavioral groupings over the canonical kernel breakpoint vocabulary. Use:

- `effectiveInlinePx = min(layoutViewportInlinePx, containerInlinePx)`
- `effectiveBlockPx = min(dynamicViewportBlockPx, containerBlockPx)`
- `usableInlinePx = effectiveInlinePx - safeAreaInsetInlineStartPx - safeAreaInsetInlineEndPx - (2 * shellInsetInlinePx)`
- `usableBlockPx = effectiveBlockPx - safeAreaInsetBlockStartPx - safeAreaInsetBlockEndPx - stickyActionReservePx`

**ResponsiveDimensionTokenSet**
`responsiveDimensionTokenSetId`, `shellInsetInlinePx = clamp(16px, 2vi, 32px)`, `shellInsetBlockPx = clamp(12px, 1.5vb, 24px)`, `regionGapPx = clamp(12px, 2vi, 32px)`, `primaryRegionMinPx = 640`, `supportRegionMinPx = 288`, `queueRegionMinPx = 256`, `contextRegionMinPx = 320`, `comfortableTargetMinPx = 44`, `minimumTargetFloorPx = 24`, `stickyActionMinHeightPx = 56`, `stickyActionReservePx`, `tokenState = active | override_required`

`ResponsiveDimensionTokenSet` is the shared sizing law for shells. Route teams may densify within the primary region, but they may not preserve desktop topology by shrinking type, target size, spacing, or status chrome below these bounds.

**ShellResponsiveProfile**
`responsiveProfileId`, `shellType`, `channelProfile`, `breakpointClass`, `defaultTopology`, `topologyThresholds = { focusFrameMinPx, twoPlaneMinPx = 960, threePlaneMinPx = 1280, embeddedStripMaxPx = 840 }`, `pinnedRegionRefs[]`, `collapsedRegionRefs[]`, `collapsePriorityRefs[]`, `stickyActionRegionRef`, `navCompressionMode`, `supportFallbackMode = drawer | sheet | stacked_panel`, `compareFallbackRef`, `artifactFallbackRef`, `recoveryFallbackRef`, `effectiveAt`

`ShellResponsiveProfile` is the canonical responsive contract for one shell, channel profile, and breakpoint class. It defines which regions stay pinned, which collapse first, where the dominant action moves, how navigation compresses, and how compare or artifact surfaces degrade while shell identity stays the same.

**CompareFallbackContract**
`compareFallbackId`, `baselineAnchorRef`, `candidateAnchorRefs[]`, `fallbackMode = side_by_side | serial_compare | drawer_compare | sheet_compare | ranked_delta_list`, `pinnedSummaryRef`, `diffAnchorRefs[]`, `returnTargetRef`, `fallbackState = ready | blocked | recovery`

`CompareFallbackContract` prevents compare work from disappearing on narrow surfaces. When `side_by_side` is no longer safe, the shell must preserve the baseline choice, show the active compare subject in the primary region or fallback stage, and keep the diff anchored to the same `SelectedAnchor` set.

**EmbeddedStripContract**
`embeddedStripContractId`, `shellType`, `channelProfile`, `hostChromeBudget = none | minimal | standard`, `bridgeCapabilityRef`, `visibleStripRefs[]`, `collapsedStripRefs[]`, `artifactMode = summary_only | summary_then_handoff`, `navigationMode = inline | tabs | sheet`, `capabilityLossFallbackRef`, `returnTargetRef`, `stripState = active | frozen | recovery`

`EmbeddedStripContract` governs same-shell continuity inside trusted embedded or constrained-browser hosts. `embedded_strip` is not a miniature product; it is the owning shell with reduced chrome, governed capability loss, and summary-first artifact behavior.

**StickyActionDockContract**
`stickyActionDockContractId`, `dockRef`, `minimumHeightPx = 56`, `comfortableTargetMinPx = 44`, `minimumTargetFloorPx = 24`, `safeAreaPolicyRef`, `scrollPaddingReservePx`, `keyboardAvoidanceMode = unstick | raise | local_reflow`, `dockState = visible | hidden | inline`

`StickyActionDockContract` keeps sticky actions operable without obscuring content. The dock must reserve scroll padding equal to its rendered height plus safe-area inset, and it must unstick, raise, or locally reflow when a focused field would otherwise be covered.

**NarrowScreenContinuityPlan**
`narrowScreenContinuityPlanId`, `entityContinuityKey`, `missionStackFoldPlanRef`, `selectedAnchorRef`, `visibleBlockerRef`, `dominantActionRef`, `returnTargetRef`, `focusRestoreRef`, `promotedSupportRegionRef`, `compareFallbackRef`, `recoveryStubRef`, `planState = folded | expanded | recovery`

`NarrowScreenContinuityPlan` preserves object continuity while shells fold into drawers, sheets, and stacked views. It keeps the user oriented to the same object, blocker, and next action rather than silently changing task posture.

Rules:

- topology must derive from `ResponsiveViewportProfile` plus `ShellResponsiveProfile`, not from a raw mobile, tablet, or desktop label
- use breakpoint classes for measurement only:
  - `compact = 320 to 479`
  - `narrow = 480 to 767`
  - `medium = 768 to 959`
  - `expanded = 960 to 1279`
  - `wide = 1280 and above`
- use width-to-layout mapping:
  - `three_plane` only when the shell family allows three planes, `AttentionBudget.allowedPlaneCount = 3`, and `usableInlinePx >= 1280`
  - `two_plane` only when the shell family is multi-plane by default and `usableInlinePx >= 960`
  - `focus_frame` for patient or lightweight wide-shell work when `usableInlinePx >= 600` and no lawful multi-plane promotion is active
  - `mission_stack` for any shell below its split-plane threshold or whenever zoom, text scale, or focus protection makes split planes unsafe
  - `embedded_strip` only when `channelProfile = embedded | constrained_browser` and `EmbeddedStripContract` requires compressed chrome or capability-governed fallback, especially below `usableInlinePx = 840`
- `mission_stack` is a same-shell fold, not a separate journey; the current object, dominant action, blocker summary, and selected anchor must remain recoverable through `NarrowScreenContinuityPlan`
- fold hierarchy must be deterministic: preserve `CasePulse`, shared status strip, selected-anchor summary, and `DecisionDock` first; collapse tertiary context next; collapse non-promoted compare or evidence next; collapse navigation or queue rails last
- active section, shared status strip, dominant action, and current blocker must remain reachable without horizontal scroll
- compact navigation may compress to tabs, inline rail, or sheet, but it may not silently reorder sections or hide the current task
- compare, context, and support regions must fall back to one sequential drawer, sheet, or stacked panel at a time rather than modal-on-modal composition
- use drawers only while the origin region can stay visible at or above `primaryRegionMinPx`; otherwise use a sheet or stacked panel
- artifact preview, print, download, export, and handoff must follow the declared `artifactFallbackRef`; if the current shell or channel cannot support safe handoff, the user stays on summary or recovery
- sticky action docks must respect `StickyActionDockContract`, safe-area insets, and focused-field clearance; dense inline utility controls may use `minimumTargetFloorPx = 24` only when spacing or equivalent-control rules still hold
- narrow-screen recovery must stay same-shell: when route intent, release posture, trust, or embedded capability drifts, replace the affected region with a recovery stub above the sticky action dock and preserve the same selected anchor and return target
Shell defaults:

- Patient shell: `focus_frame` on wide screens, `mission_stack` below `usableInlinePx = 600`, and `embedded_strip` for trusted embedded contexts whose host contract narrows chrome or capability
- Workspace shell: `two_plane` from `usableInlinePx >= 960`, `three_plane` from `usableInlinePx >= 1280` only for compare or blocker posture, and `mission_stack` below `960` with queue, task, and support folded rather than rewritten
- Pharmacy shell: `two_plane` from `usableInlinePx >= 960`, `mission_stack` below `960`, and a bounded `embedded_strip` only when the host must keep the same case shell with reduced chrome and governed handoff
- Hub and support shells: `two_plane` from `usableInlinePx >= 960`, optional `three_plane` from `1280` for compare-heavy coordination, and `mission_stack` below `960` preserving the selected conversation, task, or replay anchor
- Ops and governance shells: `two_plane` from `usableInlinePx >= 960`; below that threshold they may enter `mission_stack` only for governed recovery, read-mostly work, or explicitly narrow-ready flows that still preserve the same scope and decision target
- Assistive control shell: desktop-first provenance or replay workbench with same-shell side-stage launch back into the owning task where applicable

Embedded mode is a `channelProfile`, not a separate shell. It may switch the owning shell to `embedded_strip` or `mission_stack`, suppress or compress chrome, and narrow delivery options, but it must preserve shell identity while the same continuity frame remains valid.

Composition rules:

- `mission_stack` is a fold of the active shell, not a second mobile IA; fold, unfold, rotate, and breakpoint changes must preserve `SelectedAnchor`, `DecisionDock`, the promoted support region, and return context
- when columns collapse, preserve the primary region first, then the currently selected support region, then chronology, evidence, and context as summary stubs
- on narrow widths, expand at most one support region at a time unless a blocker or compare contract requires more
- sticky action docks must remain visible without obscuring focused inputs, system status, or safe-area insets
- list-plus-detail layouts must retain an accessible list-first recovery path when the detail pane is hidden
- charts, maps, lattices, and matrices must downgrade to ranked lists or data tables before they disappear
- critical actions, blockers, and recovery steps must never hide below an off-screen secondary rail or require horizontal scrolling
- restoring from narrow to wide must reopen the same folded regions and scroll context through `missionStackFoldPlanRef` and `NarrowScreenContinuityPlan` rather than resetting to a default desktop layout

### Clinical Workspace specialization

The detailed route family, workboard topology, interruption digest, rapid-entry contract, and alert-budgeting rules for the staff shell are defined in `staff-workspace-interface-architecture.md`. All Phase 3+ workspace routes must implement that contract inside this shell model rather than inventing local queue-detail layouts. Any staff, support, hub, governance, or operations workspace route that can present a dominant action, buffered live updates, or calm completion must also bind one current `WorkspaceTrustEnvelope`; `PrimaryRegionBinding`, `DecisionDock`, interruption pacing, and next-task or handoff posture may not appear calmer or more writable than that envelope allows.

### Pharmacy Console specialization

The dedicated route family, checkpoint rail, inventory truth panel, command-fence behavior, and stock-aware validation rules for the pharmacy shell are defined in `pharmacy-console-frontend-architecture.md`. All Phase 6+ pharmacy console routes must implement that contract inside this shell model rather than inventing detached inventory or assurance pages. This specialization complements, rather than replaces, the referral-first boundary in `phase-6-the-pharmacy-loop.md`.

### Operations Console specialization

The dedicated route family, board composition, intervention workbench behavior, live-update pacing, and continuity-preserving drill-down rules for the operations shell are defined in `operations-console-frontend-blueprint.md`. The live control-room routes `/ops/overview`, `/ops/queues`, `/ops/capacity`, `/ops/dependencies`, `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` must implement that contract inside this shell model rather than fragmenting into unrelated BI pages, detached investigation flows, or a second console for resilience and assurance work.

### Governance/Admin specialization

The dedicated route family, scope ribbon, frozen `GovernanceReviewPackage`, matrix and diff workflow, impact preview, approval stepper, and evidence-rail rules for the Governance and Admin Shell are defined in `governance-admin-console-frontend-blueprint.md`. All `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*` routes must implement that contract inside this shell model rather than behaving like detached CRUD pages or raw policy editors.

## Frontend/backend integration boundary contract

The front end must integrate through a governed gateway or backend-for-frontend boundary rather than binding directly to internal domain services.

Suggested objects:

- `FrontendContractManifest`
- `ProjectionContractFamily`
- `ProjectionContractVersion`
- `ProjectionContractVersionSet`
- `RuntimeTopologyManifest`
- `GatewayBffSurface`
- `AudienceSurfaceRouteContract`
- `AudienceSurfaceRuntimeBinding`
- `ProjectionQueryContract`
- `MutationCommandContract`
- `LiveUpdateChannelContract`
- `ClientCachePolicy`

### `FrontendContractManifest`

Fields:

* `frontendContractManifestId`
* `audienceSurface`
* `routeFamilyRefs[]`
* `gatewaySurfaceRef`
* `surfaceRouteContractRef`
* `audienceSurfaceRuntimeBindingRef`
* `designContractPublicationBundleRef`
* `projectionContractVersionSetRef`
* `projectionQueryContractRefs[]`
* `mutationCommandContractRefs[]`
* `liveUpdateChannelContractRefs[]`
* `clientCachePolicyRef`
* `commandSettlementSchemaRef`
* `transitionEnvelopeSchemaRef`
* `releaseRecoveryDispositionRef`
* `routeFreezeDispositionRef`
* `browserPostureState = publishable_live | read_only | recovery_only | blocked`
* `frontendContractDigestRef`
* `designContractDigestRef`
* `designContractLintVerdictRef`
* `projectionCompatibilityDigestRef`
* `generatedAt`

Semantics:

* is the only browser-consumable contract manifest for one audience surface and route family set
* binds the exact reads, writes, streams, cache rules, settlement envelopes, design-contract bundle, and recovery posture the shell may use
* must be consumed as one unit with the current `AudienceSurfaceRuntimeBinding` and current `DesignContractPublicationBundle`; shells may not rebuild browser truth from route names, component imports, projection shape, token constants, or feature flags
* must also bind one exact `ProjectionContractVersionSet`; route-local query digests or cached payload shape are not enough to prove mixed-version safety

### `ProjectionContractFamily`

Fields:

* `projectionContractFamilyId`
* `routeFamilyRefs[]`
* `queryCode`
* `projectionFamilyRefs[]`
* `compatibilityPolicyRef`
* `currentProjectionContractVersionRef`
* `familyState = active | deprecated | withdrawn`

Semantics:

* is the stable browser read purpose for one governed query
* prevents query meaning from drifting behind a familiar route or endpoint label

### `ProjectionContractVersion`

Fields:

* `projectionContractVersionId`
* `projectionContractFamilyRef`
* `versionOrdinal`
* `responseSchemaRef`
* `contractDigestRef`
* `changeClass = additive | additive_with_placeholder | breaking | withdrawal_only`
* `supersedesProjectionContractVersionRef`
* `compatiblePredecessorRefs[]`
* `summaryFallbackDispositionRef`

Semantics:

* is the explicit version boundary for one browser projection shape
* forbids in-place response mutation; a materially changed payload means a new version

### `ProjectionContractVersionSet`

Fields:

* `projectionContractVersionSetId`
* `routeFamilyRef`
* `projectionContractFamilyRefs[]`
* `requiredProjectionContractVersionRefs[]`
* `allowedAdditiveCompatibilityRefs[]`
* `readPathCompatibilityWindowRef`
* `compatibilityState = exact | additive_compatible | constrained | recovery_only | blocked`
* `projectionCompatibilityDigestRef`

Semantics:

* is the exact projection version tuple the current route family may read
* is the contract shells use to decide whether a mixed-version route remains live, summary-only, recovery-only, or blocked

### `ProjectionQueryContract`

Fields:

* `projectionQueryContractId`
* `routeFamilyRef`
* `queryCode`
* `projectionContractFamilyRef`
* `projectionContractVersionRef`
* `projectionContractVersionSetRef`
* `responseSchemaRef`
* `visibilityCoverageRefs[]`
* `zeroResultDisposition = authoritative_empty | summary_only | recovery_only`
* `requiredProjectionReadinessRefs[]`
* `requiredReadPathCompatibilityWindowRef`
* `freshnessContractRef`
* `clientCachePolicyRef`
* `contractDigestRef`

Semantics:

* is the exact browser read contract for one route-family query
* must explain whether empty data is authoritative, degraded summary, or recovery posture rather than leaving the shell to guess from payload shape
* may expose only audience-safe projection fields and the declared freshness or recovery semantics
* must participate in the active `ProjectionContractVersionSet` for the route family; standalone query digests are not enough for route-level truth

### `MutationCommandContract`

Fields:

* `mutationCommandContractId`
* `routeFamilyRef`
* `commandCode`
* `requestSchemaRef`
* `allowedActionScopeRefs[]`
* `requiredRouteIntentState`
* `idempotencyPolicyRef`
* `commandSettlementSchemaRef`
* `transitionEnvelopeSchemaRef`
* `releaseRecoveryDispositionRef`
* `contractDigestRef`

Semantics:

* is the exact browser mutation contract for one route-family action
* must pin the authoritative settlement and same-shell recovery envelope rather than leaving the shell to infer success from HTTP transport or stale projection refresh

### `LiveUpdateChannelContract`

Fields:

* `liveUpdateChannelContractId`
* `routeFamilyRef`
* `channelCode`
* `messageSchemaRef`
* `reconnectPolicyRef`
* `stalenessDisclosureRef`
* `downgradeDispositionRef`
* `contractDigestRef`

Semantics:

* is the exact browser stream contract for one route-family live channel
* must declare reconnect, stale disclosure, and downgrade behavior explicitly; route-local socket helpers may not improvise those semantics

### `ClientCachePolicy`

Fields:

* `clientCachePolicyId`
* `routeFamilyRefs[]`
* `cacheScope = shell | route_family | entity | query_result`
* `ttlPolicyRef`
* `revalidationTriggerRefs[]`
* `mutationInvalidationRefs[]`
* `staleWhileRevalidateMode = forbidden | bounded | summary_only`
* `offlineReuseDisposition = forbidden | read_only | recovery_only`
* `contractDigestRef`

Semantics:

* is the only declared browser cache and reuse policy for the published route-family contracts
* may preserve continuity, but it may not preserve writable posture, calm success language, or apparent freshness after the active runtime binding, publication, or freeze posture has drifted

Core rules:

- patient, workspace, pharmacy, hub, support, operations, and admin shells talk only to the gateway or BFF boundary
- each audience family resolves that boundary through the published `RuntimeTopologyManifest` and `GatewayBffSurface`; hostnames, environment variables, or deployment notes are not the authority contract
- browser reads come from audience-safe projection contracts, not transactional stores or raw audit feeds
- support replay, omnichannel timeline, and subject-history reads must come from support-safe projections rather than client-side stitching of raw audit events, telephony traces, or adapter payloads
- browser mutations carry an idempotency key and the current entity or lineage freshness token where applicable
- live updates use one typed stream contract per surface with explicit reconnect, staleness, and downgrade behaviour
- if a route family requires a different tenant-isolation mode, trust-zone boundary, or downstream workload set, it must publish through a different `GatewayBffSurface` rather than hiding that split in client-side conditionals
- no browser-origin call may reach GP, telephony, messaging, pharmacy, MESH, or workflow adapters directly
- no browser-origin feature may infer writable posture from raw route availability alone; it must consume the current `AudienceSurfaceRouteContract` and `AudienceSurfaceRuntimeBinding` published for that gateway surface
- no shell may hydrate from an undeclared query, mutation, stream, or cache surface; every browser call must appear in the active `FrontendContractManifest`
- no shell may reconstruct token meaning, state semantics, marker vocabulary, or telemetry event names from route-local constants when the active `DesignContractPublicationBundle` says otherwise; the published design contract is the only browser authority for those meanings
- no shell may treat a newer payload shape, additional field, or cached legacy field as implicitly compatible; the active `ProjectionContractVersionSet` and `projectionCompatibilityDigestRef` are the only browser authority for mixed-version read safety
- no shell may reconstruct writable posture, settlement wording, or same-shell recovery semantics from projection shape, empty-state heuristics, route names, or feature flags when the active manifest or runtime binding says `read_only | recovery_only | blocked`
- gateway handlers may remain thin composition layers, but they may not become a second domain layer or a bag of hidden internal APIs; browser authority lives in the published manifest and the route-scoped contracts it names
- every contract change ships with generated client types, consumer tests, and backward-compatibility notes

## Governance and change control

Changes to shell contracts, route contracts, and IA rules require:

- versioned change record
- design and product sign-off
- accessibility regression check
- migration notes for affected phases

## Linked documents

This blueprint is intended to be used with:

- `canonical-ui-contract-kernel.md`
- `design-token-foundation.md`
- `patient-portal-experience-architecture-blueprint.md`
- `patient-account-and-communications-blueprint.md`
- `staff-operations-and-support-blueprint.md`
- `operations-console-frontend-blueprint.md`
- `governance-admin-console-frontend-blueprint.md`
- `phase-7-inside-the-nhs-app.md`
- `phase-8-the-assistive-layer.md`
- `staff-workspace-interface-architecture.md`
- `pharmacy-console-frontend-architecture.md`
- `accessibility-and-content-system-contract.md`
- `platform-admin-and-config-blueprint.md`
- `platform-runtime-and-release-blueprint.md`
- `callback-and-clinician-messaging-loop.md`
- `self-care-content-and-admin-resolution-blueprint.md`
- `ux-quiet-clarity-redesign.md`
