# UX quiet clarity redesign strategy

## Purpose

Evaluate the current Vecells blueprint through the lens of cognitive clarity, minimalist aesthetics, and friction removal, then translate the resulting design strategy into enforceable front-end algorithm changes.

## Executive diagnosis

The repository already has unusually strong foundations for continuity, trust, causality, and real-time stability. The main remaining UX risk is not missing capability but **attention saturation**. The current blueprint allows rich primitives such as `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `ContextConstellation`, queue metadata, assistive suggestions, and live delta cues to coexist without a strict enough admission control model. Without that control, the experience can drift from calm operational instrument to expert-only density.

### Current strengths worth preserving

- stable shell continuity and object permanence
- explicit freshness, trust, and lineage semantics
- list-first thinking and progressive disclosure principles
- strong async acknowledgement and selected-anchor preservation
- clear avoidance of generic enterprise dashboard patterns

### Primary confusion vectors to remove

1. **Too many simultaneous focal regions.** The platform can still place history, evidence, context, and action surfaces in competition with the current task.
2. **Quiet mode is defined but not budgeted.** `clarityMode` exists, but the blueprint did not fully specify how many surfaces may be promoted at once or which one wins.
3. **Support surfaces can over-escalate.** Evidence, chronology, AI assistance, and contextual policy notes all have legitimate value, but not all at the same time.
4. **Status duplication can reappear at runtime.** The design prohibits duplicate status chrome, but the rendering algorithm needed a stronger suppression rule.
5. **Edge cases preserve context but not always quiet posture.** After blocker resolution, conflict review, or compare work, the shell needs an explicit return-to-calm rule.
6. **Rapid async change can still create support-region thrash.** Under live deltas, stale rechecks, or compare moments, the current contract needed explicit hysteresis so the promoted region does not swap every few seconds.
7. **Phase-level docs still permit legacy high-noise patterns.** Some downstream blueprints still describe wizard-first intake, banner-first escalation, or page-like booking separation that undermines the quieter shell law.

## Control priorities

Close these five high-priority gaps before treating the redesign as canonical:

1. Reconcile the redesign vocabulary with the canonical frontend language so quiet-mode guidance does not drift from the shell primitives already defined elsewhere.
2. Bind the calm-layout concept to `PersistentShell`, route topology, and `SelectedAnchor` preservation so quietness cannot be implemented by breaking continuity.
3. Tie status suppression to the actual truth envelope so `CasePulse`, the shared status strip, and `DecisionDock` cannot disagree under stale or cross-version projections.
4. Make blocker and partial-visibility handling explicit so quiet UI never hides reachability repair, consent renewal, step-up requirements, or governed placeholders behind aesthetic minimalism.
5. Govern real-time and queue behavior with the canonical batching and automation contracts so calmness survives disruptive deltas and remains testable.

## Additional control priorities

The quiet-redesign layer requires five corrections:

1. Quiet Clarity still read like a rendering style rather than a projection-binding rule, so teams could compose calm screens from locally convenient reads instead of the canonical visibility and shell-consistency envelopes.
2. The redesign defaulted to calmness without an explicit eligibility gate, so blocker-heavy, compare-heavy, degraded, or diagnostic routes could remain artificially compressed and hide legally required detail.
3. Calm degradation was underspecified, which risked flattening route freezes, degraded assurance slices, or partial-trust states into aesthetically quiet but operationally misleading screens.
4. Composition protection existed as a design principle but not as a typed contract, so typing, compare, confirm, and delta-review moments could still suffer promotion churn under live updates.
5. Return-to-calm behavior covered blocker resolution but not command settlement, which left a gap where shells could collapse back to calm before authoritative confirmation, dispute, or recovery state was known.

## Redesign concept

Name: **Signal Atlas Live / Quiet Clarity**

Compatibility bridge:

- `Mission Frame` remains a descriptive posture for the default calm shell, not a separate design system
- `Signal Atlas Quiet` is a legacy label and should be treated as a compatibility alias for `Signal Atlas Live` running with the `Quiet Clarity` overlay

Mission Frame turns each surface into a single, legible operating moment. The interface should answer four questions in order:

1. What am I looking at?
2. What changed that matters?
3. What is the safest next action?
4. What extra detail is available if I need it?

Anything that does not help answer one of those questions should stay collapsed, summary-level, or hidden until requested.

Quiet Clarity is a rendering discipline, not a second read model. Every calm surface must reuse the canonical audience, visibility, and shell-consistency contracts defined in the owning blueprint instead of inventing local projection shortcuts for aesthetic convenience.

## Design principles applied

### 1. Attention budget over feature density
Every shell gets an explicit budget for how many support regions may be promoted simultaneously. The default budget is one primary work region plus one promoted support region at most.

### 2. Progressive disclosure by consequence
Surface the detail required for the next safe decision, not all possible detail. Evidence expands before history when trust is blocking. History expands before context when chronology changed. Context opens only when policy, linkage, or blocker resolution requires it.

### 3. Object permanence before cleverness
Selected items, pending actions, and invalidated options remain visible in place long enough to preserve causality and reduce mental reset cost.

Close five high-priority permanence defects before treating this principle as safe:

1. selected entities are described visually, but not yet bound to one stable identity contract that survives resort, regroup, or projection refresh
2. in-flight commands can still replace or eject their initiating object before authoritative settlement is known
3. invalidated or withdrawn options are meant to remain visible, but the redesign does not yet define how they persist without looking selectable
4. continuity across refresh, reconnect, and embedded-shell resume is implied rather than governed through an explicit restore plan
5. local list transformations can still break causal orientation by moving the user to a neighboring object when the active item degrades, disappears, or changes rank

Add the permanence contracts:

**SelectedObjectAnchor**
`anchorId`, `entityContinuityKey`, `governingObjectRef`, `projectionVersionRef`, `listContextRef`, `groupKey`, `rankOrdinal`, `selectionState = active | invalidated | restored | released`, `anchoredAt`

`SelectedObjectAnchor` is the stable identity for the object currently in focus. Sorting, filtering, regrouping, or projection refresh may change where the object renders, but they may not silently switch focus to a sibling object while the anchor remains active.

**PendingActionRetention**
`retentionId`, `selectedAnchorRef`, `governingActionRef`, `routeIntentRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `experienceContinuityEvidenceRef`, `lineageFenceEpoch`, `preActionArtifactRef`, `provisionalArtifactRef`, `settlementEnvelopeRef`, `retentionState = visible | frozen | superseded | recovered`, `releaseConditionRef`

`PendingActionRetention` keeps the initiating object and its strongest confirmed artifact visible while a command is pending. A shell may add bounded provisional state, but it may not replace the initiating object with generic success, disappearance, or optimistic resort until the current `RouteIntentBinding`, authoritative `CommandSettlementRecord`, and linked `ExperienceContinuityControlEvidence` all still justify that continuity posture.

**InvalidatedOptionStub**
`stubId`, `selectedAnchorRef`, `supersededObjectRef`, `invalidatedReasonCode`, `replacementObjectRef`, `selectableState = false`, `recoveryActionRef`, `expiresAt`

`InvalidatedOptionStub` preserves withdrawn or stale options in place as non-selectable stubs with an explicit reason and nearest safe recovery. Invalidated options therefore remain causally legible without pretending they are still actionable.

**ContinuityRestorePlan**
`restorePlanId`, `entityContinuityKey`, `selectedAnchorRef`, `routeIntentRef`, `shellTopologyRef`, `scrollAnchorRef`, `focusTargetRef`, `embeddedSessionProjectionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `assuranceSliceTrustRefs[]`, `experienceContinuityEvidenceRefs[]`, `resumeReasonCode`, `restoreState = ready | partial | blocked | read_only_only | recovery_required`

`ContinuityRestorePlan` governs refresh, reconnect, resume, and embedded return behavior. When the shell rehydrates, it must attempt to restore the same anchor, topology, and local focus target before offering fallback navigation, but it must revalidate the active `RouteIntentBinding`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, required `AssuranceSliceTrustRecord` rows, and any bound `ExperienceContinuityControlEvidence` before restoring mutable posture. If full restoration is impossible, it must explain why, preserve the nearest safe causal breadcrumb, and fall back to read-only or governed recovery rather than replaying stale mutating affordances.

**NeighborSubstitutionPolicy**
`policyId`, `selectedAnchorRef`, `substitutionState = forbidden | explicit_only`, `allowedFallbackClassRefs[]`, `degradeDisposition = keep_stub | recovery_route | empty_explained`, `reviewRequiredState`

`NeighborSubstitutionPolicy` forbids silent focus drift. If the active object disappears, loses trust, or drops out of the current ranking, the shell must keep the anchor in place as a stub, recovery state, or explicitly acknowledged replacement decision rather than auto-selecting the next nearby row or card.

### 4. List-first, compare-by-intent
Lists and tables remain the default operational surfaces. Rich comparison modes are explicit user choices, not the resting state.

### 5. Interruptibility-aware real-time behavior
Live updates must respect composition, reading, compare, and decision moments. Changes queue quietly, then settle in an order that protects the active region first.

### 6. Calm error and blocker handling
Errors, stale state, conflicts, and disconnects should not explode the layout. They should tighten focus onto the single region that now needs attention.

### 7. Semantic motion with minimal amplitude
Motion explains reveal, morph, pending, invalidation, diff, reopen, degradation, settlement, and recovery states. It never substitutes for structure. Urgency must come from state meaning and contrast, not from larger travel, bounce, or stacked animation.

### 8. Accessibility and automation as structural constraints
Low-noise UI must remain fully navigable by keyboard, explicit in the DOM, and stable under Playwright assertions.

## Conceptual redesign strategy

### 0. Canonical truth and posture eligibility
Close five high-priority calm-posture defects before treating this overlay as safe:

1. calm shells are described as composition rules, but not yet as bindings to canonical visibility and consistency projections
2. `clarityMode = essential` remains the default, but the redesign does not yet define when it is prohibited by route class, trust state, or operational posture
3. degraded or frozen states can still appear visually quiet without an explicit contract for what reassurance must be suppressed
4. composition locks are implied through `AttentionBudget`, but the redesign does not yet define the persisted lease that keeps promoted regions stable while the user is actively working
5. return-to-calm is defined around blocker resolution, but not around authoritative settlement, dispute, or recovery after a command

Add the cross-cutting calm-posture contracts:

**QuietClarityBinding**
`bindingId`, `entityContinuityKey`, `visibilityPolicyRef`, `consistencyProjectionRef`, `audienceTier`, `projectionTrustState`, `assuranceSliceTrustRefs[]`, `partialVisibilityRefs[]`, `routeIntentRef`, `embeddedSessionProjectionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `routeFreezeDispositionRef`, `dominantSettlementRef`, `boundAt`

`QuietClarityBinding` says which canonical envelope the calm shell is allowed to render from. For patient routes, `consistencyProjectionRef` must point to the owning `PatientShellConsistencyProjection`; governance, support, and other specialist shells must point to their shell-specific consistency projection. Calm surfaces may summarize or defer detail, but they may not widen read scope beyond `VisibilityProjectionPolicy`, stitch together unrelated reads outside the bound consistency projection, outlive the current `RouteIntentBinding`, or restyle release-freeze, channel-freeze, settlement, or embedded-session mismatch as ordinary calm content.

**QuietClarityEligibilityGate**
`gateId`, `routeClass`, `audienceTier`, `defaultTopology`, `defaultClarityMode`, `forcedExpandedTriggers[]`, `forcedDiagnosticTriggers[]`, `suppressionExceptions[]`, `eligibilityState = essential_allowed | expanded_required | diagnostic_required | blocked`

`QuietClarityEligibilityGate` decides whether a route may stay quiet at all. Blocker-heavy review, active compare, incident-command, step-up recovery, wrong-patient repair, degraded trust, or route-freeze recovery may still render inside the same shell, but they must elevate to `expanded` or `diagnostic` posture when quiet suppression would hide governing truth or actionability. The shell may downgrade back to `essential` only after the trigger resolves and the user has not explicitly pinned a richer posture.

### A. Essential shell composition
Close five high-priority composition defects before treating this shell law as canonical:

1. the shell inventory is described visually, but not yet as a typed frame contract that child routes must inherit
2. the primary work region is not explicitly bound to one governing object and projection epoch, so quiet shells can still swap the center of attention under live drift
3. ownership of shell-level status is implied rather than singular, which allows duplicate or contradictory shell feedback to reappear
4. `DecisionDock` exists as a primitive, but not yet as the exclusive dominant-action locus, so compare, assistive, or contextual regions can compete with it
5. `mission_stack` is named as a narrow-screen fallback without a fold and restore contract, which risks hidden blockers, lost anchors, or accidental page-like resets on mobile

The default shell should render only:

- `CasePulse`
- one shared status strip
- one primary work region
- one `DecisionDock`

`StateBraid`, `EvidencePrism`, `ContextConstellation`, and assistive surfaces remain collapsed or summary-level unless the attention budget promotes one of them.

This composition must be implemented inside one `PersistentShell`, not by switching between detached page types. Patient and lightweight surfaces default to `focus_frame`; staff, support, hub, and operations surfaces default to `two_plane`; `three_plane` is justified only for active compare, blocker, or explicit pinning moments; `mission_stack` is the narrow-screen fallback. Quietness may not be achieved by discarding continuity, replacing the shell, or clearing the active `SelectedAnchor`.

Add the supporting shell-composition contracts:

**EssentialShellFrame**
`shellFrameId`, `entityContinuityKey`, `quietBindingRef`, `eligibilityGateRef`, `layoutTopology = focus_frame | two_plane | three_plane | mission_stack`, `allowedRegionSet = case_pulse | status_strip | primary_region | decision_dock | promoted_support_region`, `supportRegionBudget = 0 | 1`, `placeholderPolicyRef`, `compositionEpoch`

`EssentialShellFrame` is the immutable inventory for the active shell epoch. Child routes may restyle or summarize within those regions, but they may not introduce extra shell rails, detached success pages, or second-class status bands outside the frame.

**PrimaryRegionBinding**
`bindingId`, `governingObjectRef`, `projectionRef`, `projectionVersionRef`, `selectedAnchorRefs[]`, `invalidatedState = fresh | review_required | blocked | placeholder`, `returnTargetRef`

`PrimaryRegionBinding` keeps the center of attention attached to one governing object and one reviewed projection version. If live deltas invalidate that object, the region stays in place, marks itself `review_required` or `blocked`, and offers the nearest safe recovery path without swapping to a sibling object or blank intermediate state.

**StatusStripAuthority**
`authorityId`, `macroStateRef`, `bundleVersion`, `audienceTier`, `projectionTrustState`, `ownedSignalClasses[]`, `localSignalSuppressionRef`, `degradeMode = quiet_pending | refresh_required | recovery_required`

`StatusStripAuthority` is the only shell-level owner for save, sync, freshness, pending, and recovery cues. `CasePulse`, local controls, and `DecisionDock` may expose scoped state, but they may not restate shell-level truth outside the authority contract.

**DecisionDockFocusLease**
`leaseId`, `governingActionRef`, `policyBundleRef`, `supportRegionRef`, `competingCtaPolicy = suppress | summarize | blocker_preempts`, `expiresAt`

`DecisionDockFocusLease` makes one dominant action explicit. While the lease is active, compare drawers, assistive rails, context surfaces, and local tools may inform the decision, but they may not surface a second competing primary CTA unless a higher-priority blocker legally preempts the current action.

**MissionStackFoldPlan**
`foldPlanId`, `stackOrder`, `defaultExpandedRegion`, `promotedSupportRegionRef`, `blockerStubRef`, `selectedAnchorRef`, `returnTargetRef`

`MissionStackFoldPlan` defines how the same shell collapses for narrow screens. Fold and unfold operations must preserve the active `SelectedAnchor`, dominant blocker visibility, and current `DecisionDock` state, so the mobile shell remains a folded version of the same continuity key rather than a separate page journey.

### B. Deterministic promotion rules
Only one support region may auto-promote at a time. Promotion priority:

1. blocker or trust conflict -> `EvidencePrism`
2. reopen or materially changed chronology -> `StateBraid`
3. active compare task -> bounded comparison side stage
4. safe-action policy dependency -> context drawer
5. assistive review -> assistive side stage only when requested or directly under review

### B1. Patient-shell quantitative quiet budget

Patient-facing shells need a stricter numerical budget than staff surfaces.

Add the patient budget contract:

**PatientCalmBudgetProfile**
`profileId`, `surfaceType = home | section_entry | requests_index | request_detail | appointment_workspace | record_detail | message_thread`, `maxPrimaryCtas = 1`, `maxProminentCards`, `maxExpandedItems`, `maxUrgentCueCount = 1`, `maxBadgeCountPerRegion = 1`, `maxStickyRegions = 2`, `summaryLineClamp = 3`, `metaLineClamp = 2`, `quietMotionBudgetMs = 180`, `reentryCooldownMs = 1200`

This contract limits quantity, prominence, and motion in patient shells; it does not replace `design-token-foundation.md` or introduce a second patient-only visual scale.

Rules:

- `home` may render exactly one spotlight card, up to four compact summary cards, and one persistent urgent-help route; anything else collapses into the Requests, Appointments, Record, or Messages section instead of expanding home density
- `section_entry` may render one `PatientSectionHeaderFrame`, one primary region, and at most one promoted support region
- `requests_index` may pin the selected row and one filter drawer, but may not auto-expand more than one row or surface multiple row-level primary buttons in the same viewport
- only one `urgent` or `action_needed` tone may use saturated emphasis in a viewport; all other cues demote to quiet metadata, outline treatment, or shared status-strip language
- badges are count supplements only and may not encode state without accompanying text
- line clamps, CTA count, and cue limits still apply at `200%` zoom and in `mission_stack`; overflow must collapse to disclosure, never to clipped or overlapping UI
- `quietMotionBudgetMs` caps patient-facing semantic motion; if the route cannot express the change within that budget, it must prefer static emphasis, text, and anchor preservation

### C. Status-noise suppression
All save, sync, freshness, pending, and review-required signals must be deduplicated before render. The shared status strip owns shell-level feedback. Local control acknowledgement stays local. Banners are reserved for truly blocking or urgent states.

Deduplication must preserve truth, not merely reduce chrome. `CasePulse`, the shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, and `DecisionDock` must all derive from the same `bundleVersion`, `audienceTier`, and authoritative `MacroStateMapper` result. If those surfaces do not share a common consistency envelope, mutating CTAs freeze and the shell falls into bounded refresh or recovery instead of showing contradictory reassurance.

### C1. Bounded degraded and frozen calm states
Calmness may compress noise, but it may not flatten untrusted or frozen state into a visually healthy shell.

Add the governing degradation contract:

**CalmDegradedStateContract**
`contractId`, `trustState = trusted | degraded | quarantined | unknown`, `completenessState = complete | partial | blocked`, `blockingSliceRefs[]`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `routeFreezeDispositionRef`, `experienceContinuityEvidenceRefs[]`, `settlementSuppressionState = normal | provisional_only | suppress_success`, `fallbackMode = inline_notice | placeholder | read_only | recovery_route | diagnostic_required`, `dominantRecoveryActionRef`, `allowedReassuranceClasses[]`, `lastReviewedAt`

`CalmDegradedStateContract` applies when an `AssuranceSliceTrustRecord` is degraded or quarantined, an embedded route enters a governed `RouteFreezeDisposition`, `ReleaseApprovalFreeze` or `ChannelReleaseFreezeRecord` blocks the current route, bridge capability falls below minimum, the current audience may only receive partial visibility, or the route's continuity evidence is stale or blocked. In those states, the shell must stay bounded and legible, but it may not imply actionability or success through ordinary calm chrome. Reassurance that depends on trusted, unfrozen, complete, or continuity-validated state must be suppressed, `settlementSuppressionState` must stop calm success language where route or trust posture is no longer authoritative, the dominant recovery path must stay visible in `DecisionDock`, and the route may resolve only to inline notice, governed placeholder, read-only view, recovery route, or diagnostic posture as allowed by policy.

This same degraded-calm law also applies to the continuity-sensitive workflow families. More-info reply calmness must remain subordinate to `PatientExperienceContinuityEvidenceProjection`; draft autosave and resume calmness to `DraftContinuityEvidenceProjection`; appointment-manage calmness to `BookingContinuityEvidenceProjection`; hub booking-manage calmness to `HubContinuityEvidenceProjection`; visible assistive calmness to `AssistiveContinuityEvidenceProjection`; task-completion and next-task calmness to `WorkspaceContinuityEvidenceProjection`; and pharmacy release, reopen, or closure calmness to `PharmacyConsoleContinuityEvidenceProjection`. If any of those continuity proofs are stale or blocked, the shell may preserve the anchor and latest safe artifact, but it may not cosmetically return to ordinary success or writable posture.

### D. Quiet return behavior
After blocker resolution, compare completion, or conflict acknowledgement, the shell must fall back to the last user-approved quiet posture unless the user explicitly pinned a richer view.

Quiet return must also respect route eligibility and settlement truth. The shell may not drop back to `essential` while the `QuietClarityEligibilityGate` still requires `expanded` or `diagnostic` posture, or while a dominant action remains in provisional or disputed settlement.
Quiet return must also respect continuity evidence. If the current same-shell route, continuation, or settlement posture has stale or blocked `ExperienceContinuityControlEvidence`, the shell must stay in bounded recovery or degraded calm posture rather than cosmetically returning to ordinary essential mode.

Return-to-calm is therefore family-specific, not generic. More-info reply may not collapse to ordinary answer-and-done reassurance while `PatientExperienceContinuityEvidenceProjection` is stale; intake resume may not collapse to `Saved` while `DraftContinuityEvidenceProjection` is stale; appointment manage may not collapse to ordinary booked reassurance while `BookingContinuityEvidenceProjection` is stale; hub booking-manage may not collapse to ordinary confirmed reassurance while `HubContinuityEvidenceProjection` is stale; assistive rails may not return to quiet acceptance while `AssistiveContinuityEvidenceProjection` is stale; workspace completion may not roll into next-task calmness while `WorkspaceContinuityEvidenceProjection` is stale; and pharmacy shells may not return to quiet release or closure while `PharmacyConsoleContinuityEvidenceProjection` is stale.

### D1. Settlement before return-to-calm
Submission calmness must preserve causal confirmation, not shortcut it.

**QuietSettlementEnvelope**
`envelopeId`, `governingActionRef`, `routeIntentRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `experienceContinuityEvidenceRef`, `lineageFenceEpoch`, `selectedAnchorRef`, `localAckState = none | shown`, `authoritativeConfirmationState = pending | settled | superseded | disputed | recovery_required`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `confirmedArtifactRefs[]`, `provisionalArtifactRefs[]`, `returnClarityMode`, `releaseConditionRef`

`QuietSettlementEnvelope` holds the shell steady after a command starts. The initiating `SelectedAnchor`, any prior confirmed artifact, and the current `DecisionDock` consequence preview must remain visible until authoritative settlement lands or policy explicitly allows a provisional confirmation posture. Quiet return is legal only after the envelope says the action is `settled`, the bound `CommandSettlementRecord` no longer requires review or recovery, the linked `experienceContinuityEvidenceRef` still validates the same shell truth, and the active route still passes `RouteIntentBinding`, `ReleaseApprovalFreeze`, and `ChannelReleaseFreezeRecord` checks; otherwise the shell must remain in bounded provisional, read-only, or recovery posture. A calm design may not use detached success pages, generic “done” banners, or silent card swaps to mask external confirmation lag, dispute, replay uncertainty, route-freeze drift, or evidence drift.

For continuity-sensitive workflow families, `QuietSettlementEnvelope` must also preserve the domain-appropriate artifact while proof catches up: question summary and pending reply stub for `more_info_reply`, draft text for `intake_resume`, booked-state summary or selected slot for `booking_manage`, selected candidate and acknowledgement summary for `hub_booking_manage`, visible provenance artifact for `assistive_session`, closure summary and queue anchor for `workspace_task_completion`, and the current line-item or case summary for `pharmacy_console_settlement`.

### E. Minimalist form and conversation behavior
Patient flows expand one question, one short rationale, and one next action at a time. Conversation surfaces keep either the active composer or the latest relevant history cluster expanded in essential mode, not both.

Minimalism must not hide governing blockers. If reachability repair, consent renewal, step-up, delayed release, wrong-patient recovery, or external confirmation dispute blocks the current task, the dominant action must become that repair or recovery route. If an item contributes urgency without granting full detail, the shell must render a governed placeholder tied to `releaseState`, `visibilityTier`, `summarySafetyTier`, and `placeholderContractRef` instead of dropping the item or leaking extra content.

Quiet patient-home and section-entry shells must treat `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientQuietHomeDecision`, and `PatientNavUrgencyDigest` as the only allowed source of cross-route CTA truth. In essential mode, the shell may summarize urgency, awaited party, or next action tersely, but it may not keep a card actionable once the active spotlight tuple has been superseded or `PatientNavUrgencyDigest.governingSettlementRef` has moved into pending, recovery, stale, or read-only posture. When the user drills in, `PatientNavReturnContract` must preserve the same-shell route back to the originating calm surface rather than resetting to a generic home refresh.

Record-origin action launches must stay causally legible. If a user leaves a record, result, or document surface to book, message, repair contact route, or respond to follow-up, the calm shell must carry `RecordActionContextToken` and `RecoveryContinuationToken` through step-up, release drift, and recovery so the original record anchor remains visible in the return path and any bounded recovery copy.

Conversation calmness must also stay authoritative. Thread previews, unread posture, and reply affordances may compress into one quiet summary, but they must derive from `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`; local composer acknowledgement or transport delivery is not enough to return the shell to calm completion.

### F. Staff and support workspace simplification
When a case is active, the review canvas becomes dominant. Secondary queue summaries, board widgets, and AI rails collapse to slim indices, tabs, or stubs until requested.

Support work follows the same rule. The active ticket timeline and the current response or recovery action own the center of the screen. Knowledge, subject history, replay, and policy surfaces may exist, but only one of them may auto-promote at a time; the rest stay in a single quiet contextual rail.

Support replay exit, observe return, and support deep-link restore must obey the same calm law. Leaving replay or investigation mode may preserve the current ticket shell and breadcrumb trail, but live controls must remain frozen until `SupportReplayRestoreSettlement` proves the target work object, latest settlement, mask scope, and required revalidation state are safe to restore. Until then, the shell may render `awaiting_external_hold`, `stale_reacquire`, or read-only recovery, but it may not quietly resume live mutation.

Queue and workboard calmness must be implemented through the canonical live-update controls. Reordering, insertion, and priority shifts during active use must flow through `QueueChangeBatch`; disruptive deltas must respect composition locks and `AttentionBudget` cooldowns; and the active task or selected card must remain pinned through `SelectedAnchor` until the user accepts or dismisses the change.

Add the explicit calm-work lease:

**QuietWorkProtectionLease**
`leaseId`, `entityContinuityKey`, `lockReason = composing | comparing | confirming | reading_delta`, `selectedAnchorRef`, `protectedRegionRef`, `decisionDockLeaseRef`, `deferredDeltaRef`, `queueChangeBatchRef`, `startedAt`, `releaseConditionRef`

`QuietWorkProtectionLease` persists the active calm posture during focused work. While the lease is active, `AttentionBudget.promotionLockReason` must remain set, disruptive projection changes must buffer through `DeferredUIDelta` or `QueueChangeBatch`, and the promoted support region may change only when blocker severity strictly increases. Compose sessions, compare targets, confirmation fences, and highlighted-delta reviews must therefore stay causally stable even when live data continues to move around them.

## Edge-case handling rules

### Live invalidation while a user is deciding
Keep the selected anchor visible, mark it invalidated, explain the reason inline, and show nearest safe alternatives without removing the original choice first.

### Stale or disconnected state
Freeze the last stable shell, downgrade freshness in the shared status strip, disable only actions that require fresh truth, and preserve draft input.

If the stale or disconnected condition also degrades trust, completeness, or route availability below the current `QuietClarityEligibilityGate`, resolve through `CalmDegradedStateContract` rather than a generic quiet-pending posture.

### New evidence during active review
Compute diff against the last acknowledged snapshot, mark review as `review_required`, and promote only the changed evidence region. Do not auto-scroll or open multiple panels.

### Permission expansion or contraction
Reveal or hide only the affected regions. Preserve shell continuity and working context whenever the continuity key stays the same.

### Duplicate or same-episode submission
Preserve lineage and explain whether the action is a retry, continuation, or new work. Do not create parallel shells for what users perceive as the same request.

### Empty and sparse states
Every empty state must explain why nothing is shown, what usually appears here, and the fastest safe next action.

### Authoritative settlement pending or disputed
Keep the initiating anchor, consequence preview, and strongest confirmed artifact visible in place. Show local acknowledgement if available, but do not collapse back to calm completion until `QuietSettlementEnvelope` confirms settled, or switches the shell into the correct provisional or recovery state.

## Translation into algorithm changes

The redesign is implemented by the patch set in this repository through eleven architectural shifts:

1. Add `QuietClarityBinding` so the overlay reuses canonical `VisibilityProjectionPolicy` and shell-consistency projections rather than creating a second truth envelope.
2. Add `QuietClarityEligibilityGate` so calm posture is derived from route class, audience, blockers, trust state, and operational freeze state before render.
3. Add `EssentialShellFrame` and `PrimaryRegionBinding` to the shell model so quiet composition is a typed contract instead of descriptive prose.
4. Extend `CognitiveLoadGovernor` so it chooses the single support region that may auto-promote without violating `DecisionDockFocusLease`.
5. Add `StatusStripAuthority` and status-suppression algorithms to the canonical rendering rules.
6. Add `CalmDegradedStateContract` so degraded trust, partial visibility, bridge-capability loss, and route freezes stay explicit without breaking continuity.
7. Add `QuietWorkProtectionLease`, promotion hysteresis, and status-cue cooldowns so live deltas cannot keep re-shuffling the interface during composition, comparison, confirmation, or delta review.
8. Add `MissionStackFoldPlan` so narrow-screen composition preserves shell continuity, blocker visibility, and anchor restoration.
9. Add `QuietSettlementEnvelope` so return-to-calm waits for authoritative or policy-governed provisional settlement instead of cosmetic completion.
10. Replace wizard-style and banner-first patterns in phase blueprints with stable mission-frame child states that preserve one dominant question and one dominant action.
11. Add `PatientCalmBudgetProfile` so patient home, section-entry, and request-browsing shells obey explicit CTA, card, cue, and motion limits instead of inheriting staff-density defaults.

## Validation expectations

The redesign should ship with Playwright coverage for:

- quiet default render of patient, review, queue, and booking shells
- one `EssentialShellFrame`, one `StatusStripAuthority`, and one dominant `DecisionDock` action per active shell epoch
- blocker-driven promotion of exactly one support region
- `PatientCalmBudgetProfile` enforcing one spotlight, up to four compact home cards, one urgent cue, and one row-level CTA on patient home and requests shells
- return-to-quiet after blocker resolution
- quiet posture eligibility forcing `expanded` or `diagnostic` when blockers, compare posture, degraded trust, or route freeze make `essential` unsafe
- duplicate-status suppression across strip, banner, and local control states
- no support-region thrash while the user is typing, comparing, or confirming
- non-blocking pending and stale states staying inline or in the shared status strip rather than escalating to full-width banners
- invalidated anchor preservation during live changes
- `PrimaryRegionBinding` staying attached to the same governing object through live invalidation until the user accepts recovery or navigation
- `QuietClarityBinding` reusing the owning shell-consistency projection and never widening audience scope outside `VisibilityProjectionPolicy`
- `CalmDegradedStateContract` suppressing false reassurance and preserving the dominant recovery path under degraded or frozen routes
- `QuietWorkProtectionLease` holding the promoted region stable while `DeferredUIDelta` and `QueueChangeBatch` buffer disruptive changes
- `QuietSettlementEnvelope` preventing detached success or false-final calmness before authoritative or governed provisional settlement
- `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientQuietHomeDecision`, `PatientNavUrgencyDigest`, and `PatientNavReturnContract` keeping home or section-entry calm shells aligned with authoritative settlement, bounded spotlight hysteresis, and same-shell return posture
- `RecordActionContextToken` and `RecoveryContinuationToken` preserving the originating record breadcrumb across step-up, release drift, and recovery
- `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement` preventing unread or reply calmness from outrunning authoritative receipt and settlement truth
- `SupportReplayRestoreSettlement` keeping replay exit, observe return, and deep-link restore in pending, stale reacquire, or read-only posture until live work is safely revalidated
- keyboard-only operation across collapsed and promoted regions
- `mission_stack` fold and unfold preserving `SelectedAnchor`, blocker stub visibility, and `DecisionDock` focus on narrow screens
- shared truth between `CasePulse`, `AmbientStateRibbon` plus `FreshnessChip`, and `DecisionDock` under stale, pending, and recovery states
- governed placeholder rendering for delayed-release, step-up-gated, and limited-visibility patient content
- `QueueChangeBatch` buffering and selected-anchor preservation during queue reorder or mid-review delta arrival
- stable automation anchors for `CasePulse`, `StateBraid`, `DecisionDock`, and active `SelectedAnchor` surfaces
