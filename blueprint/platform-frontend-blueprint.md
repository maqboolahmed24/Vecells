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

### 0.2 Continuity key and shell law

Define `entityContinuityKey = audienceTier + canonicalEntityRef + lineageScope`.

Where:

* `canonicalEntityRef` is the stable object the user is meaningfully working
* `lineageScope` is the minimal downstream scope that may share one shell without confusing object identity

Rules:

1. If the incoming surface resolves to the same `entityContinuityKey`, reuse the existing `PersistentShell`.
2. If only child view, access scope, sub-task, or downstream phase changes within the same `entityContinuityKey`, morph the child surface in place.
3. When the same continuity key remains active, preserve `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, open side stages where still valid, scroll where safe, focus where safe, and any active `SelectedAnchor`.
4. Only replace the shell when one of the allowed hard-boundary conditions in this segment is met.
5. Route changes within the same `entityContinuityKey` must never imply loss of object identity or blank-page reset.
6. Access expansion after claim, sign-in, verification, or embedded deep-link validation must reveal newly authorized detail progressively inside the same shell whenever the continuity key is unchanged.
7. A continuity-preserving transition must also preserve the current disclosure posture unless a blocker, conflict, or explicit user action requires more detail.
8. When a temporary blocker, conflict, or compare posture resolves, restore the prior quiet posture unless the user explicitly pinned a richer layout.

### 1. Required experience topology and primitives

#### 1.1 PersistentShell

Fields:

* `shellId`
* `shellType = patient | staff | hub | pharmacy | support | operations | embedded`
* `audienceTier`
* `entityContinuityKey`
* `layoutTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `clarityMode = essential | expanded | diagnostic`
* `attentionBudgetRef`
* `activeEntityRef`
* `activeChildView`
* `childSurfaceRef`
* `promotedSupportRegionRef`
* `suppressedRegionRefs[]`
* `signalRailState`
* `caseSpineState`
* `contextConstellationState = closed | peek | open | pinned`
* `pinnedContextRefs[]`
* `selectedAnchorRefs[]`
* `preservedPanels`
* `lastQuietPostureRef`
* `preservedScrollOffsets`
* `preservedFocusRef`
* `liveMode = live | buffered | paused`
* `liveProtectionMode = normal | buffered | composition_protected`
* `freshnessSummary`
* `shellHydrationState = partial | hydrated | degraded`
* `reducedMotionEnabled`

Semantics:

* is the durable visual container for a single active entity or tightly related lineage cluster

* must survive adjacent state changes of the same continuity key

* must preserve context across soft route changes

* must render the canonical Vecells layout topology:

  * patient and lightweight flows default to `focus_frame`
  * staff, hub, support, and operations flows default to `two_plane`
  * `three_plane` is reserved for comparison-heavy, blocker-heavy, or explicitly pinned context states
  * mobile and narrow tablet default to `mission_stack`
  * embedded surfaces may use `embedded_strip`

* must start in `clarityMode = essential` unless a blocker, conflict, or diagnostic task requires more detail

* must carry the active `AttentionBudget` for the shell and respect its surface-promotion limits

* in `clarityMode = essential`, must promote at most one support region in addition to the primary work surface unless a true blocker, compare mode, or explicit user pin justifies more

* must preserve active command context, open side stage, and pinned comparison context where still valid

* must preserve any active `SelectedAnchor` unless an explicit release rule is met

* must restore the last user-approved quiet posture after a temporary blocker, conflict, or compare promotion ends unless the user explicitly pinned a richer layout

#### 1.1A AttentionBudget

Fields:

* `budgetId`
* `entityContinuityKey`
* `clarityMode`
* `dominantQuestionRef`
* `dominantActionRef`
* `promotedSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `maxPromotedRegions = 0 | 1 | 2`
* `allowedPlaneCount = 1 | 2 | 3`
* `promotionReason = none | blocker | conflict | reopen | compare | explicit_user_request | urgent`
* `promotionLockReason = none | composing | comparing | confirming | reading_delta`
* `suppressionWindowMs`
* `promotionCooldownMs`
* `lastPromotionAt`
* `suppressedSignalRefs[]`
* `returnToQuietPolicy = on_resolve | on_commit | manual_only`

Semantics:

* is the explicit cognitive contract emitted by `CognitiveLoadGovernor`
* constrains simultaneous promoted surfaces, status cues, and plane count for the current shell
* must default patient and routine staff work to `maxPromotedRegions <= 1`
* must allow `allowedPlaneCount = 3` only for blocker-heavy, compare-heavy, pinned, or diagnostic work
* must prefer demotion to summary stubs before introducing new banners, rails, or panels
* must freeze auto-promotion while the user is composing, comparing, confirming, or reading a materially changed delta unless blocker severity increases
* must rate-limit repeated shell-level cue promotion and demotion so the interface does not thrash under live change
* when a temporary promotion resolves, must restore the last quiet posture unless the user pinned a richer view

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
* `diffFirstTargetRef`

Semantics:

* is the canonical evidence surface
* must distinguish user-entered facts, system-derived inference, third-party confirmation, ambiguous evidence, stale evidence, and conflicting evidence
* must support inline source inspection without leaving the current task
* must support diff-first rendering against the last acknowledged evidence snapshot
* must default to a summary posture in `clarityMode = essential`
* must auto-expand only when conflict, staleness, a blocking review requirement, or explicit user intent makes more detail necessary
* must remain explicit when new evidence invalidates an in-progress decision

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
* `saveState = idle | saving | saved | failed`
* `syncState = fresh | updating | stale | disconnected | paused`
* `pendingExternalState = none | awaiting_confirmation | awaiting_reply | awaiting_ack`
* `bufferState = none | queued_updates | review_required`
* `localAckState = none | acknowledged | pending | reconciled | failed`
* `attentionTone = quiet | caution | urgent`
* `renderMode = integrated_status_strip | promoted_banner`
* `message`
* `lastChangedAt`

Semantics:

* provides lightweight always-available feedback for save, sync, freshness, pending external work, and buffered live updates
* must replace silent waiting
* must visually merge with `FreshnessChip` into one shared status strip on routine surfaces
* must not dominate the viewport unless an urgent action or blocking trust state exists
* must communicate live buffering and re-check requirements without breaking shell continuity

#### 1.7 FreshnessChip

Fields:

* `chipId`
* `projectionRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `freshnessState = fresh | updating | stale | disconnected | paused`
* `renderMode = integrated_status_strip | standalone`
* `freshnessAgeMs`
* `requiredForCurrentAction`
* `degradeReason`
* `lastProjectionVersion`
* `lastCausalTokenApplied`

Semantics:

* declares how trustworthy the visible data currently is
* must be available on all projection-backed detail, list, board, and spatial-comparison surfaces
* must render inside the shared status strip in `clarityMode = essential`
* may promote to standalone only when freshness is directly decision-blocking or when dense operational boards need per-surface trust signaling
* must be visible at shell level when freshness loss affects safe action
* must make freshness loss explicit before any unsafe follow-up action is allowed

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

#### 1.9 TransitionEnvelope

Fields:

* `transitionId`
* `entityRef`
* `commandRef`
* `affectedAnchorRef`
* `originState`
* `targetIntent`
* `ackState = queued | local_ack | optimistic_applied | server_accepted | awaiting_external | projection_seen | review_required | settled | reverted | failed | expired`
* `causalToken`
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
* `reasonBuffered`
* `summaryMessage`
* `invalidatesCurrentAction`
* `announcementPriority = silent | polite | assertive`
* `bufferedAt`
* `applyWhen = immediate | idle | explicit_user_apply | after_edit_commit`

Semantics:

* holds live updates that would otherwise steal focus or destabilize the layout
* must be used when the user is typing, reading deeply, comparing options, composing a reply, or working a focused case
* must communicate when buffered deltas materially change the safety or validity of the current decision

#### 1.11 QueueChangeBatch

Fields:

* `batchId`
* `queueRef`
* `insertedRefs[]`
* `updatedRefs[]`
* `priorityShiftRefs[]`
* `applyPolicy = idle_only | explicit_apply | immediate_if_safe`
* `focusProtectedRef`
* `summaryMessage`
* `batchState = available | applied | dismissed`
* `createdAt`

Semantics:

* is the only allowed mechanism for introducing disruptive live queue changes while a queue is in active use
* protects staff cognition and focus
* must preserve the currently pinned row or card while exposing queued changes in a reviewable way

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

#### 1.14 ConversationThreadProjection

Fields:

* `threadId`
* `requestRef`
* `audienceTier`
* `messageRefs[]`
* `callbackRefs[]`
* `moreInfoRefs[]`
* `instructionRefs[]`
* `intentGroupRefs[]`
* `pendingReplyRefs[]`
* `reviewMarkerRefs[]`
* `lastSeenCursor`
* `currentActionRef`
* `replyCapabilityState`
* `surfaceMode = unified_request_thread`

Semantics:

* unifies messages, follow-up questions, callback expectations, and actionable instructions into one request-centered communication surface
* must prevent siloed communication experiences
* must support live insertion, reply pending states, changed-since-seen cues, and smooth return-to-review transitions

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

* `intent = reveal | morph | commit | pending | escalate | diff | reopen | degrade | handoff`
* `timingBand = instant | standard | deliberate | urgent`
* `sourceOriginRef`
* `amplitude = silent | low | medium | urgent`
* `movementProfile`
* `interruptionPolicy`
* `motionBudgetMs`
* `settleHint`
* `reducedMotionFallback`

Semantics:

* encodes motion meaning
* motion must represent state change, not decoration
* motion must originate from the changed object, command source, or selected anchor rather than from a generic page container
* motion budgets must remain subordinate to responsiveness and comprehension

#### 1.17 SelectedAnchor

Fields:

* `anchorId`
* `entityRef`
* `anchorType = slot | provider | pharmacy | queue_row | message | evidence_cluster | comparison_candidate | action_card`
* `hostSurfaceRef`
* `stabilityState = stable | validating | pending | invalidated | replaced`
* `fallbackAlternativesRef[]`
* `preserveUntil = settle | explicit_dismiss | entity_switch`
* `lastKnownLabel`
* `lastKnownPositionRef`

Semantics:

* is the visual object-permanence contract for the user’s current selection or focus anchor
* selected objects must not disappear during async work or remote revalidation
* invalidated anchors must remain visible long enough to preserve causality and explain the change
* must be used for selected slot, chosen provider, selected pharmacy, focused queue row, compare target, or any equivalently important user choice

### 2. Required frontend services

#### 2.1 LiveProjectionBridge

Responsibilities:

* subscribe to scoped projections
* apply in-place patches
* buffer disruptive deltas
* expose freshness state
* reconcile optimistic UI and server-confirmed state

#### 2.2 TransitionCoordinator

Responsibilities:

* create and advance `TransitionEnvelope`
* control soft route changes
* preserve shell, case pulse, state braid, decision dock, and selected anchors
* decide when a transition settles, reverts, expires, or remains pending
* convert conflicting projection truth into `review_required` rather than silent overwrite

#### 2.3 MotionSemanticRegistry

Responsibilities:

* map `MotionIntentToken` to actual motion rules
* enforce consistent motion meaning across patient and staff surfaces
* enforce reduced-motion fallbacks
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
* prevent live updates from moving the active case, active row, active slot, or active draft unexpectedly
* preserve cursor, selection, and scroll position where safe

#### 2.7 EvidenceLineageResolver

Responsibilities:

* classify evidence into fact, inference, third-party confirmation, ambiguous, stale, and conflicting layers
* compute diff against the last acknowledged review snapshot
* attach source lineage and freshness to each evidence cluster

#### 2.8 InteractionContractRegistry

Responsibilities:

* guarantee stable semantic roles and accessible names for critical controls and regions
* ensure custom components remain keyboard-operable and automation-verifiable
* expose explicit success, warning, locked, stale, failed, invalidated, and reconciled DOM states

#### 2.9 ContinuityOrchestrator

Responsibilities:

* derive `entityContinuityKey`
* decide shell reuse versus shell replacement
* prevent same-entity reloads and same-entity shell churn
* coordinate child-surface morphs, access-expansion reveals, and return-to-context behavior

#### 2.10 SelectedAnchorPreserver

Responsibilities:

* create, update, and release `SelectedAnchor`
* keep selected row, card, provider, or slot visible through validation, pending, settlement, and failure
* represent invalidation without disappearance
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
* detect same-entity reload regressions
* support automation assertions for local acknowledgement, projection settlement, and focus integrity
* measure perceived responsiveness as speed of stable feedback and comprehension, not only page load time

#### 2.13 CognitiveLoadGovernor

Responsibilities:

* derive and update `AttentionBudget`
* set `PersistentShell.clarityMode`
* choose the single auto-promoted support region for the current task
* cap simultaneously promoted support regions and other expanded secondary surfaces
* collapse secondary context, history, and explanation by default
* auto-promote only the specific hidden region required by a blocker, conflict, reopen delta, compare task, or explicit user request
* restore the last quiet posture once a temporary promotion resolves unless the user pinned richer context
* prevent duplicated status presentation across header, banner, chip, toast, and side rail
* apply promotion hysteresis so live deltas cannot repeatedly switch the promoted support region during active decision moments
* keep non-blocking pending, stale, and acknowledgement states inline or in the shared status strip unless a new user decision is required

### 3. Non-negotiable invariants

1. The same `entityContinuityKey` must reuse the same `PersistentShell`.
2. Adjacent lifecycle states of the same entity must render within the same `PersistentShell`.
3. Any route transition within the same continuity key must use soft navigation and preserve shell context.
4. Patient and lightweight shells must default to `focus_frame`; staff, hub, support, and operations shells must default to `two_plane`; `three_plane` is allowed only when comparison, blockers, or explicit pinning justify the extra noise; mobile and narrow-tablet shells must default to `mission_stack`; only true embedded surfaces may use `embedded_strip`.
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
13. Every asynchronous action must create a `TransitionEnvelope`.
14. Every irreversible, externally consequential, or high-risk action must render a `ConsequencePreview` before commit.
15. Live updates must not steal focus, reset scroll, collapse open context, or discard partially entered user input.
16. Selected staff work items must remain visually pinned while the user is actively working them.
17. Patient-visible statuses across request, booking, hub, pharmacy, callback, and messaging views must derive from one shared `MacroStateMapper`.
18. Messages, follow-up questions, callback expectations, and actionable patient communications for a request must be unified inside one `ConversationThreadProjection`.
19. Waiting and in-review states must remain living shells with visible continuity, not dead status pages.
20. Evidence origin and trust class must never be flattened into a single undifferentiated content block.
21. Spatial comparison surfaces such as booking orbit or network lattice must always have an accessible list or table fallback and may not displace the calmer list-first default.
22. All critical controls and regions must expose stable semantic roles and accessible names.
23. Color is a secondary signal only; state meaning must also be conveyed by text, iconography, layout, or motion.
24. Reduced-motion mode must preserve all state meaning without requiring spatial animation.
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
32. Route change alone is not an acceptable representation of state change; the relevant object state must also be reflected in the DOM.
33. Same-entity async completion must not create history-stack spam or navigate to a visually unrelated page.
34. Duplicating the same status across multiple simultaneous banners, chips, and toasts is forbidden unless the duplicated state is blocking and the duplication is localized to the active action.
35. Continuity, anchor preservation, focus integrity, and avoidable noise regressions are product defects, not cosmetic issues.
36. Auto-promotion may not switch support regions while the user is composing, comparing, confirming, or actively reading a highlighted delta unless urgency or blocker severity strictly increases.
37. Non-blocking pending, stale, acknowledgement, and capability states must stay local to the active card or the shared status strip; they may not escalate to persistent full-width banners by default.

### 4. Canonical real-time rendering algorithm

#### 4.0 Continuity resolution algorithm

On route entry, route update, projection apply, sign-in change, claim completion, or access-scope change:

1. Resolve `canonicalEntityRef`, `lineageScope`, `audienceTier`, and `entityContinuityKey`.

2. Compare the resolved `entityContinuityKey` to the current shell.

3. If the key is unchanged:

   * reuse the existing `PersistentShell`
   * preserve current `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, the current disclosure posture, and active `SelectedAnchor`
   * morph only the child surface that changed

4. If the key is unchanged but authorization expands:

   * reveal newly authorized regions in place
   * do not discard currently visible safe context

5. If the key changes because of an explicit entity switch, workspace switch, true auth boundary, permission boundary, or unrecoverable schema divergence:

   * create a new shell
   * preserve safe return context where possible

6. Emit continuity telemetry for reuse, preservation, or boundary replacement.

7. Never blank the whole screen solely because a child phase or downstream status changed for the same continuity key.

#### 4.1 Initial mount algorithm

On entry to an entity-backed route:

1. Resolve the active entity scope, continuity key, audience tier, device breakpoint, and access grant posture.

2. Choose `PersistentShell.layoutTopology`:

   * `focus_frame` for patient and lightweight task surfaces on desktop and wide tablet
   * `two_plane` for routine staff, hub, support, and operations surfaces
   * `three_plane` only when the opening task already requires pinned comparison or blocking context
   * `mission_stack` for mobile and narrow-tablet surfaces
   * `embedded_strip` only for intentionally embedded experiences

3. Set `PersistentShell.clarityMode = essential` unless a blocker, conflict, or diagnostic route contract requires a higher detail posture.

4. Ask `CognitiveLoadGovernor` to derive the initial `AttentionBudget` from route class, blocker state, compare posture, and explicit user pins.

5. Create or reuse `PersistentShell`.

6. Render shell chrome immediately:

   * compact `GlobalSignalRail` or mission anchor
   * `CaseSpine`
   * `ContextConstellation` as closed or peeked by default, or stacked context drawer on narrow surfaces unless `AttentionBudget` explicitly promotes it

7. If a current projection snapshot exists:

   * render `CasePulse`
   * render `DecisionDock`
   * render one shared status strip using `AmbientStateRibbon` plus `FreshnessChip`
   * render the budget-approved primary work region at full prominence
   * render non-promoted `StateBraid`, `EvidencePrism`, assistive surfaces, and context as summary stubs, tabs, or closed drawers
   * restore any valid `SelectedAnchor`
   * subscribe in background

8. If only a last-stable snapshot exists for the same continuity key:

   * hydrate the shell from that last-stable snapshot
   * mark freshness as `updating`
   * do not show a blank reset

9. If no snapshot exists:

   * render bounded skeleton regions only for missing panels
   * do not block shell creation

10. Establish `ProjectionSubscription` for all required projections.

11. Mark freshness as `updating` until the first authoritative snapshot arrives.

12. When the snapshot arrives:

* patch missing or stale regions in place
* use `MotionIntentToken(intent = reveal)`
* do not blank the shell
* do not rebuild unaffected regions
* do not auto-expand secondary context unless safe action requires it

13. If the entity was already visible in an adjacent state, morph the child work surface rather than recreating the shell.
14. If verification or claim expands access during mount, reveal newly authorized detail progressively inside the current shell.

#### 4.1A Attention budget algorithm

On shell mount, route morph, blocker change, compare request, reopen, or explicit pin toggle:

1. Start from `clarityMode = essential` and assume the lowest viable surface count.
2. Set `maxPromotedRegions = 0` for simple patient intake, receipt, and quiet status-tracking views.
3. Set `maxPromotedRegions = 1` for routine review, conversation, booking selection, and ordinary staff operational work.
4. Raise to `maxPromotedRegions = 2` and allow `allowedPlaneCount = 3` only when:

   * a blocking trust conflict and comparison task are both present
   * the user explicitly pins context while compare mode is active
   * diagnostic or support replay mode is requested

5. Choose `promotedSupportRegionRef` by decision priority:

   * blocker, stale-trust, or conflict resolution -> `evidence_prism`
   * reopen, return, or materially changed chronology -> `state_braid`
   * active compare task -> `inline_side_stage`
   * policy note or linked context needed for safe action -> `context_constellation`
   * assistive suggestion review -> `inline_side_stage` only when the user requests it or when the suggestion itself is the current review subject

6. If `promotionLockReason != none`, freeze the current promoted support region unless the incoming signal is urgent or blocking with strictly higher severity.
7. Apply `promotionCooldownMs` before switching auto-promoted regions for the same continuity key unless the current promoted region no longer explains the active blocker or conflict.
8. Demote all non-promoted support regions to summary stubs, tabs, closed drawers, or quiet badges.
9. Never auto-promote more than one support region at a time.
10. When the promotion reason resolves, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.1B Status suppression algorithm

At render and on every delta apply:

1. Collect candidate status cues from save, sync, freshness, review-required, pending external work, SLA risk, and active `TransitionEnvelope` objects.
2. Collapse equivalent cues by semantic meaning and entity scope before rendering chrome.
3. Hash each remaining cue by `entityScope + semanticState + blockingReason + actionScope` and suppress repeats inside `suppressionWindowMs` unless severity increases or the user initiates a new action.
4. Route one shell-level message to the shared status strip.
5. Keep control-specific acknowledgement on the initiating control or affected card only.
6. Promote to banner only when the state is blocking, urgent, or requires a new user decision.
7. Suppress routine toasts for save success, fresh projection arrival, and low-risk queue churn.
8. When a blocking or urgent state resolves, demote it back to the shared status strip or local control state.

#### 4.1C Reference implementation shape

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
  const nextRegion = selectPromotedRegion({
    rankedSignals,
    currentRegion: current?.promotedSupportRegionRef ?? 'none',
    promotionLockReason: input.promotionLockReason,
    cooldownMs: current?.promotionCooldownMs ?? 1200,
    now: input.now,
  });

  return {
    ...current,
    clarityMode: input.requiresDiagnostic ? 'expanded' : 'essential',
    maxPromotedRegions: input.routeClass === 'quiet_patient' ? 0 : nextRegion.allowCompare ? 2 : 1,
    promotedSupportRegionRef: nextRegion.region,
    promotionLockReason: input.promotionLockReason,
    suppressionWindowMs: 2500,
    promotionCooldownMs: 1200,
    lastPromotionAt: nextRegion.changed ? input.now : current?.lastPromotionAt ?? input.now,
  };
}
```

#### 4.2 Soft navigation algorithm

When navigating between adjacent views of the same entity:

1. Reuse the existing `PersistentShell`.

2. Preserve:

   * `CasePulse`
   * the shared status strip
   * `DecisionDock`
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
   * use minimal `reveal` or `commit` motion
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
   * update the shared status strip
   * update `DecisionDock` blockers or re-check messaging
   * let `CognitiveLoadGovernor` update `AttentionBudget` and auto-promote only the single hidden evidence or context region needed to resolve the blocker
   * demote other support regions to summary posture unless the user pinned them
   * mark the active review surface as `review_required` if policy requires a fresh human check

8. If `macroStateImpact = macro_state_change` and the continuity key is unchanged:

   * update `CasePulse`
   * append the change to `StateBraid`
   * update the shared status strip
   * keep the shell stable

9. Never force-scroll the viewport to the changed area.

10. Never discard local draft input because of remote updates.

11. Never silently replace a focused decision surface with an unacknowledged remote state.

12. Never mutate browser history or route solely because a live delta arrived.

13. When buffered deltas are waiting, expose a subtle count and summary in the shared status strip or local queue badge without breaking concentration.

14. Live announcements must be bounded and prioritized by `announcementPriority`.
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

3. Create `TransitionEnvelope(ackState = local_ack)` or `TransitionEnvelope(ackState = queued)` if dispatch is intentionally deferred.

4. If the action is anchor-specific:

   * bind the envelope to the relevant `SelectedAnchor`
   * create the anchor if it does not already exist

5. Within the local acknowledgement budget:

   * apply bounded control-level or card-level acknowledgement
   * prefer low-amplitude button compression, label change, or card settle on the initiating element
   * do not show a generic full-screen spinner

6. If the action is safe for optimistic feedback:

   * apply bounded local visual acknowledgement
   * set `ackState = optimistic_applied`

7. Send the command.

8. On server acceptance:

   * store returned `causalToken`
   * set `ackState = server_accepted`
   * keep the user in the same shell

9. If further external completion is required:

   * set `ackState = awaiting_external`
   * morph the affected anchor or action region into a provisional pending state
   * update the shared status strip
   * keep prior confirmed artifacts visible but clearly subordinate to pending truth

10. When the corresponding projection consumes the `causalToken` or an authoritative completion event arrives:

* set `ackState = projection_seen`
* patch the UI in place
* append the result to `StateBraid`
* update `CasePulse`
* settle or release the relevant `SelectedAnchor` according to policy
* set `ackState = settled`

11. If returned projection truth materially conflicts with the optimistic or assumed path:

* set `ackState = review_required`
* keep the current context visible
* surface diff-first explanation
* block unsafe follow-up actions until the user re-checks

12. On failure or governed expiry:

* revert only the affected local region
* set `ackState = failed`, `reverted`, or `expired`
* preserve shell and selected anchor context where possible
* expose a recovery action in `DecisionDock`

13. Under no circumstance may async completion move the user to a visually unrelated page without an explicit entity change.

#### 4.5 Command-following read rule

For components marked `command_following`:

1. After a successful command, wait for a projection version that includes the relevant `causalToken`.

2. Until it arrives:

   * keep the old stable entity visible
   * show provisional transition state locally
   * do not hard refresh

3. If the token does not arrive within policy threshold:

   * mark component `stale`
   * show bounded fallback messaging
   * keep context intact

4. Destructive follow-up actions must remain blocked when required command-following freshness is absent.

5. If a conflicting authoritative state arrives before the awaited token, convert the transition to `review_required` or `failed`; do not silently settle.

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

then disruptive projection deltas must be buffered into `DeferredUIDelta` or `QueueChangeBatch` until:

* idle state is reached
* the draft is saved or submitted
* the comparison is closed
* the user explicitly applies updates

While buffered:

* show a subtle available-update indicator
* preserve current focus and selection
* preserve current queue position and active row
* preserve current draft text
* preserve current comparison anchors
* preserve the current `SelectedAnchor`

If buffered updates invalidate the current action:

* mark the relevant region as `review_required`
* keep the current context visible until the user acknowledges the change
* land re-check emphasis on the changed region first, not on a generic page top

When the user explicitly applies updates:

* settle the active anchor region first
* then settle peripheral regions
* do not reorder the entire shell before the focused region is stable
* once the focused region is stable and no blocker remains, restore the last quiet posture unless the user pinned a richer view

#### 4.7 Degraded and disconnected algorithm

On transient subscription loss or backend lag:

1. Keep the last stable UI state visible.
2. Change the shared status strip to `stale`, `disconnected`, or `paused` by updating `FreshnessChip` and `AmbientStateRibbon` together.
3. Disable only those actions that require fresh authoritative state.
4. Continue local draft capture where safe.
5. Keep `DecisionDock`, `CasePulse`, `StateBraid`, and any current `SelectedAnchor` visible.
6. Allow manual refresh or resume where appropriate without destroying shell context.
7. Resume live patching automatically when the connection recovers.
8. Do not clear the page or destroy the active shell.
9. Only on unrecoverable projection or schema divergence may the shell be replaced with a bounded recovery surface.

#### 4.8 Inline side-stage algorithm

When a user opens a related row, candidate, message, or compare target:

1. Open an `InlineSideStage` attached to the host surface.
2. Keep the originating working set visible.
3. Preserve keyboard focus order and return focus to the invoker on close.
4. Support compare mode for multiple related candidates where relevant.
5. Preserve draft or partially entered text within the side stage until explicit discard or commit.
6. Do not replace the whole entity shell for adjacent inspection or compare work unless a true entity switch is requested.
7. If the side-stage subject shares the same continuity key, inherit the shell and anchor-preservation rules.

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

1. Create or update a `SelectedAnchor`.

2. Preserve the anchor’s label, local position reference, and visual identity throughout validation and async work.

3. While the anchor is being validated or is awaiting external completion:

   * set `stabilityState = validating` or `pending`
   * morph the anchor in place
   * keep it visibly connected to the command that caused the transition

4. If the anchor becomes invalid:

   * set `stabilityState = invalidated`
   * keep the anchor visible
   * explain the invalidation in context
   * present nearest safe alternatives without removing the original anchor first

5. Release or replace the anchor only when:

   * the transition settles with a confirmed replacement
   * the user explicitly dismisses it
   * a true entity switch occurs

6. If the anchor is referenced in a receipt, timeline event, or downstream status card, preserve lineage wording so the user can recognize the same object across states.

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

   * use `MotionIntentToken(intent = commit, timingBand = instant or standard)`
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
3. Reveal newly authorized sections progressively after verification succeeds.
4. Do not reveal patient-linked detail before the relevant access grant or challenge completes.
5. Use a `reveal` or `morph` semantic transition, not a disruptive redirect, unless a true auth boundary requires shell replacement.
6. If the continuity key is unchanged, do not reset the request, receipt, or active conversation thread.

#### 5.5 Unified care conversation algorithm

For every patient request:

1. Render one `ConversationThreadProjection`.

2. The thread must unify:

   * clinician messages
   * follow-up questions
   * callback expectations and outcomes
   * patient replies
   * actionable instructions linked to the same request

3. The current required action must be pinned above or within the thread.

4. Show the latest relevant items first in quiet mode, with full history available on demand.

5. New thread items must insert in place with changed-since-seen markers.

6. Reply submission must remain in the same shell and create a `TransitionEnvelope`.

7. If the reply returns the case to review, the UI must morph to `in_review` without page reload.

8. Callback prompts, more-info questions, and instruction acknowledgements must not fork to unrelated pages or disconnected mini-flows for the same request.
9. In `clarityMode = essential`, keep either the current required action composer or the latest relevant history cluster expanded, not both; older history stays collapsed until requested.

#### 5.5A Patient record and results visualization algorithm

1. Patient record routes must open inside the signed-in patient shell with the same primary navigation and the same quiet posture as requests, appointments, and messages.
2. The record overview must foreground latest changes, action-needed items, and last-updated metadata before full chronology.
3. Each result detail must render a patient-safe title, plain-language summary, measured value and range, trend or comparison, next step, and source metadata in that order.
4. Charts are optional compare surfaces only; an equivalent accessible table and screen-reader summary are required.
5. When detail is sensitivity-gated, explain why, preserve shell context, and surface the safest next action instead of a blank or generic access-denied state.
6. Documents and letters should prefer structured in-browser rendering with file download as a secondary action when policy allows.
7. In `clarityMode = essential`, expand one record card, one result detail, or one document summary at a time; technical detail stays behind a clearly labeled disclosure.
8. Record routes linked to an active request, appointment, or message thread must preserve lineage links and return paths without changing the owning shell unless the canonical entity changes.

#### 5.6 Booking, waitlist, hub, and pharmacy continuity algorithm

1. Booking, waitlist, hub alternatives, and pharmacy progression for the same request must reuse the same request shell.

2. Selected option cards must persist through `SelectedAnchor`.

3. The default booking and routing surface should be a calm ranked list or table. Spatial views such as booking orbit or network lattice are optional compare modes and must have an accessible list or table fallback.

4. Slot selection, confirmation, alternative selection, or pharmacy choice may have distinct route contracts, but they must render as adjacent child states inside the same shell and expand inline or in a bounded sheet or drawer rather than resetting the page.

5. Confirmation pending must render as a provisional in-place state on the selected card.

6. If no true hold exists:

   * do not show hold countdown
   * do not imply exclusivity

7. Waitlist and hub offers must reuse the same action language and card grammar as booking.

8. Pharmacy instructions and status must keep the chosen provider card visually persistent.

9. If a selected option becomes invalidated, keep it visible, mark it invalidated, and present nearest safe alternatives in context without losing the request shell.
10. In `clarityMode = essential`, only one candidate detail or compare surface may be expanded at a time; opening another must collapse the previous one unless the user explicitly enters compare mode.

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
2. The mission frame must unify ticket summary, omnichannel timeline, and one active response or recovery form without route-breaking context switches.
3. `SupportSubject360Projection`, `SupportKnowledgeStackProjection`, policy notes, and replay controls must enter as summary cards, tabs, or quiet chips by default; `AttentionBudget` may auto-promote only one of them at a time.
4. In `clarityMode = essential`, keep either the active composer or recovery form, or the latest unresolved history cluster expanded; older history stays collapsed until requested.
5. Switching from conversation to recovery, escalation, or resolution must preserve draft state, scroll position, and the selected message or event anchor.
6. Knowledge-base articles, macros, and playbooks must open inline or in a bounded side stage with freshness and applicability cues; they must not navigate the agent away from the ticket.
7. Replay and timeline inspection must occur within a stable shell.
8. Live updates must be pausable.
9. Pausing live updates must preserve current context while new events queue in the background.
10. Resuming live updates must apply queued changes in an ordered, reviewable way.
11. Support actions such as link reissue, communication replay, attachment recovery, identity correction, or access review must open in bounded side panels or drawers, not context-destroying page swaps.
12. Replay surfaces must provide event grouping, diff markers, explicit freshness state, and a clear return-to-ticket control.
13. Re-entering the queue from an active ticket must restore the previous working set, filter state, and keyboard position.

#### 6.6 Operations board algorithm

For real-time operational boards:

1. Tiles, tables, and strip metrics must update in place and retain stable object identity.
2. Operations shells must default to `two_plane` composition with a dominant anomaly field in the main plane and a persistent `InterventionWorkbench` in the secondary plane.
3. `three_plane` is allowed only for explicit compare, incident-command, or deep diagnostic work; it may not be the resting state of `/ops/overview`.
4. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` are the canonical overview surfaces; no operations landing page may substitute a wall of unrelated charts for that structure.
5. Only one board region may hold escalated visual priority at a time; the highest-actionability bottleneck wins and other abnormal regions must summarize rather than compete.
6. Operators must be able to pause live updates during diagnosis, planning, or incident command.
7. Staleness must be visible at shell, board, and component level.
8. Critical threshold breaches may elevate presentation tone, but must not hijack the user’s viewport.
9. Resource reallocation proposals must present current state, projected relief, confidence, and policy guardrails before commit.
10. Drill-in from the board must open an `InvestigationDrawer` or continuity-preserving split view and must serialize an `OpsReturnToken` so the operator can return without losing filters, scroll, selected anomaly, or horizon.
11. Batched board changes must animate as grouped settlement rather than as jittery per-tile motion.
12. High-churn metrics must favor calm value morphs or number updates over repeated resorting that breaks scanability.
13. Launching from an operations board into a request, incident, audit trace, queue entity, or specialist workspace must preserve originating board context and support one-step return.
14. Full operations-console interaction, hierarchy, and drill-down rules are defined in `operations-console-frontend-blueprint.md`.

### 7. Canonical motion, accessibility, and verification system

#### 7.1 Motion intent meanings

Required semantic intents:

* `reveal`: disclose new content or freshly available detail
* `morph`: transform the same object into a new adjacent state
* `commit`: settle a completed action into the timeline or card
* `pending`: indicate that work is in progress elsewhere
* `escalate`: signal urgent or high-attention transition
* `diff`: draw attention to what changed
* `reopen`: communicate reversal from settled to active
* `degrade`: communicate stale, offline, or fallback mode
* `handoff`: shift emphasis between closely related child panels without breaking shell continuity

Typical domain mappings:

* autosave success -> `commit`
* submit-to-receipt -> `morph`
* selected option validation -> `pending`
* authoritative confirmation -> `commit`
* evidence change requiring re-check -> `diff`
* request returned to active work -> `reopen`
* stale or disconnected state -> `degrade`

#### 7.2 Motion timing bands

Recommended platform timing bands:

* `instant = 90ms to 140ms`
* `standard = 140ms to 220ms`
* `deliberate = 220ms to 320ms`
* `urgent = 100ms to 160ms`

Rules:

1. `instant` is for acknowledgements and save feedback.
2. `standard` is for normal reveals and commits.
3. `deliberate` is for handoffs and panel morphs.
4. `urgent` is for high-attention state changes without dramatic flourish.

#### 7.3 Motion application rules

1. Motion must originate from the element, object, or `SelectedAnchor` that changed.

2. Page-wide or shell-wide motion is forbidden when the object is already known and the shell remains stable.

3. Selected-anchor motion takes precedence over peripheral motion in the same region.

4. Local acknowledgement should begin as low-amplitude control or card feedback on the initiating element before any broader timeline or header update.

5. Only one primary motion intent may dominate a region at a time.

6. Pending indicators must be low amplitude, local, and non-blocking.

7. Diff highlighting must fade to a passive state after attention is established.

8. Motion must support causality:

   * action starts in `DecisionDock` or the initiating control
   * provisional state appears on the affected object or `SelectedAnchor`
   * final state settles into `CasePulse`, `StateBraid`, or the affected card

9. Motion must be interruptible and reversible where the business action is reversible.

10. Motion must not delay readiness, focus availability, or actionability.

11. Repeated live deltas must batch into calm settlements rather than stack multiple competing animations.

12. Motion must reduce, not increase, cognitive load.

#### 7.4 Reduced-motion rule

When reduced motion is enabled:

1. Replace spatial transitions with opacity, emphasis, and static state changes.
2. Preserve all sequencing and meaning.
3. Remove non-essential looping motion.
4. Never require motion perception to understand urgency, completion, invalidation, or failure.
5. Preserve diff-first emphasis through layout, iconography, and text when motion is reduced.

#### 7.5 Accessibility and interaction contract

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

#### 7.6 Verification and Playwright contract

1. Prefer semantic HTML and accessible roles before test IDs.
2. Every critical workflow must expose deterministic success and failure markers in the DOM.
3. Loading, stale, locked, processing, empty, warning, failed, invalidated, review-required, and reconciled states must be explicit in the DOM and visually distinct.
4. Do not use animation to hide readiness or delay actionability.
5. `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor` surfaces must have stable automation anchors.
6. Route change alone is not an acceptable assertion of state change; the relevant object state must also be reflected in the DOM.
7. Continuity reuse, selected-anchor preservation, freshness state, and re-check state must all be observable in automation without relying on visual timing guesses.

#### 7.7 Responsiveness budgets and continuity measures

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

Rules:

1. Optimize for time to stable local acknowledgement and time to stable comprehension, not only network completion.

2. Target budgets for core flows:

   * local acknowledgement should normally occur within 150ms of interaction
   * non-disruptive projection deltas should normally patch visibly within 250ms of receipt
   * same-entity full reload count must be `0` by design
   * focus loss rate for protected workflows must be `0` by design

3. Regressions in continuity, anchor preservation, or focus integrity are product defects.

4. Responsiveness must be judged by whether the user can understand what is happening without losing context, not by whether a new page loaded quickly.

### 8. Required UI events

Emit the following events where applicable:

* `ui.shell.created`
* `ui.shell.reused`
* `ui.continuity.resolved`
* `ui.continuity.preserved`
* `ui.continuity.broken`
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
* `ui.selected_anchor.preserved`
* `ui.selected_anchor.invalidated`
* `ui.selected_anchor.released`
* `ui.transition.started`
* `ui.transition.server_accepted`
* `ui.transition.awaiting_external`
* `ui.transition.projection_seen`
* `ui.transition.settled`
* `ui.transition.reverted`
* `ui.transition.failed`
* `ui.transition.expired`
* `ui.consequence.previewed`
* `ui.projection.subscribed`
* `ui.projection.delta_received`
* `ui.projection.delta_buffered`
* `ui.projection.delta_applied`
* `ui.freshness.changed`
* `ui.queue.batch_available`
* `ui.queue.batch_applied`
* `ui.queue.focus_pinned`
* `ui.side_stage.opened`
* `ui.side_stage.closed`
* `ui.live.paused`
* `ui.live.resumed`
* `ui.buffer.state_changed`
* `ui.buffer.flushed`
* `ui.diff.revealed`
* `ui.review.required`
* `ui.motion.reduced_enabled`

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
7. Assistive Control Surfaces
8. Governance and Admin Shell

Each route is owned by one shell only. Cross-shell navigation should always land on canonical object pages, not transient views.

## Governance and Admin Shell contract

The Governance and Admin Shell should own these route clusters:

- `/ops/governance/*`
- `/ops/access/*`
- `/ops/config/*`
- `/ops/comms/*`
- `/ops/release/*`

This shell must default to `two_plane`, keep a visible scope ribbon for tenant, organisation, environment, and elevation state, and treat impact preview, evidence, simulation, and approval lanes as support regions rather than detached destination pages. Moving between tenant matrix, authority-link review, role editing, effective-access preview, config diff, and promotion review for the same governance object must preserve shell continuity.

## Canonical object language

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

Each transactional route must declare:

- governing object type and ref
- mapped `actionScope`
- whether it is view-only or mutating
- required step-up boundary
- expiry or stale-link fallback
- parent request-shell anchor

Unsupported or expired routes must recover into the parent request shell with an explicit reason state; they must not collapse into a generic `continue` page that posts back to triage.

## Patient secure record route contract

The patient shell must expose signed-in or step-up-aware routes for:

- record overview
- result detail
- medications and allergies
- document detail

Each record route must declare:

- owning projection
- source system and freshness metadata
- sensitivity class and step-up policy
- accessible non-visual fallback for charts or structured data
- related action surfaces such as message, follow-up, or book

Unavailable, delayed-release, or scope-gated record routes must recover in place with an explicit reason state; they must not fail to a generic home redirect.

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

- governing object type and ref: `SupportTicket`, `SupportReplaySession`, or `SupportActionRecord`
- parent support-shell anchor
- default `AttentionBudget` posture
- whether the route is queue-preserving, diagnostic, or mutating
- required reason code, step-up boundary, and role scope
- replay masking contract where applicable
- stale-link or permission-fallback state

Rules:

- queue focus and the active ticket must share the same support shell whenever the continuity key is unchanged
- conversation, history, knowledge, and action surfaces are child views of the same ticket, not independent pages
- opening replay may upgrade the shell to `three_plane` or a bounded side stage, but it must preserve ticket context, queue context, and draft state
- support deep links must land on the ticket workspace with the relevant cluster or action highlighted, not on detached logs or raw audit pages

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
- minimum auth state
- patient-data exposure level
- deep-linkable yes or no
- mobile support level
- fallback page
- analytics event family
- `bffSurface`
- `readContractRef`
- `mutationContractRefs`
- `liveChannelRef`
- `cachePolicyRef`
- `errorContractRef`

## Shared IA rules

All shells should follow one IA rulebook.

- consistent breadcrumb patterns by shell
- deterministic back-navigation behaviour
- one status dictionary per audience: patient and staff
- drawer versus full-page decision rules
- standard empty/loading/error patterns
- standard degraded-mode banners
- standard changed-since-last-seen indicators for staff
- standard saved views and shared filter-link behaviour

## Cross-object linking

Cross-links must follow lineage-first rules:

- request pages can link to all downstream objects on lineage
- downstream pages must always link back to canonical request context
- links should preserve object identity and auditability
- links should never expose data that exceeds current role scope

## Deep-link and recovery rules

Deep-link handling should be explicit:

- validate link grant and auth state before PHI route resolution
- enforce subject binding where required
- route mismatches to safe recovery pages
- show no PHI on unauthenticated recovery pages

Recovery behaviour should be consistent:

- session expired
- access denied
- object not found
- object moved or closed
- stale link

## Responsive and composition rules

Desktop and mobile behaviours should be defined per shell.

- Patient shell: mobile-first, low cognitive load
- Workspace shell: dense and keyboard-optimized on desktop
- Pharmacy shell: checkpoint-oriented and low-noise on desktop, with bounded mobile-safe fallback
- Hub shell: dense coordination layout, mobile-safe fallback
- Support shell: dense omnichannel workspace on desktop with `mission_stack` fallback on narrow layouts
- Ops/admin shells: desktop-first with responsive minimums

Layout composition rules should stay stable across shells.

- list + detail split where operational scanning is primary
- full-page flow where patient action is primary
- drawer only for bounded, reversible actions

### Clinical Workspace specialization

The detailed route family, workboard topology, interruption digest, rapid-entry contract, and alert-budgeting rules for the staff shell are defined in `staff-workspace-interface-architecture.md`. All Phase 3+ workspace routes must implement that contract inside this shell model rather than inventing local queue-detail layouts.

### Pharmacy Console specialization

The dedicated route family, checkpoint rail, inventory truth panel, command-fence behavior, and stock-aware validation rules for the pharmacy shell are defined in `pharmacy-console-frontend-architecture.md`. All Phase 6+ pharmacy console routes must implement that contract inside this shell model rather than inventing detached inventory or assurance pages. This specialization complements, rather than replaces, the referral-first boundary in `phase-6-the-pharmacy-loop.md`.

### Operations Console specialization

The dedicated route family, board composition, intervention workbench behavior, live-update pacing, and continuity-preserving drill-down rules for the operations shell are defined in `operations-console-frontend-blueprint.md`. The live control-room routes `/ops/overview`, `/ops/queues`, `/ops/capacity`, `/ops/dependencies`, `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` must implement that contract inside this shell model rather than fragmenting into unrelated BI pages, detached investigation flows, or a second console for resilience and assurance work.

### Governance/Admin specialization

The dedicated route family, scope ribbon, matrix and diff workflow, impact preview, approval stepper, and evidence-rail rules for the Governance and Admin Shell are defined in `governance-admin-console-frontend-blueprint.md`. All `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release/*` routes must implement that contract inside this shell model rather than behaving like detached CRUD pages or raw policy editors.

## Frontend/backend integration boundary contract

The front end must integrate through a governed gateway or backend-for-frontend boundary rather than binding directly to internal domain services.

Suggested objects:

- `FrontendContractManifest`
- `GatewayBffSurface`
- `ProjectionQueryContract`
- `MutationCommandContract`
- `LiveUpdateChannelContract`
- `ClientCachePolicy`

Core rules:

- patient, workspace, pharmacy, hub, support, operations, and admin shells talk only to the gateway or BFF boundary
- browser reads come from audience-safe projection contracts, not transactional stores or raw audit feeds
- support replay, omnichannel timeline, and subject-history reads must come from support-safe projections rather than client-side stitching of raw audit events, telephony traces, or adapter payloads
- browser mutations carry an idempotency key and the current entity or lineage freshness token where applicable
- live updates use one typed stream contract per surface with explicit reconnect, staleness, and downgrade behaviour
- no browser-origin call may reach GP, telephony, messaging, pharmacy, MESH, or workflow adapters directly
- every contract change ships with generated client types, consumer tests, and backward-compatibility notes

## Governance and change control

Changes to shell contracts, route contracts, and IA rules require:

- versioned change record
- design and product sign-off
- accessibility regression check
- migration notes for affected phases

## Linked documents

This blueprint is intended to be used with:

- `patient-portal-experience-architecture-blueprint.md`
- `patient-account-and-communications-blueprint.md`
- `staff-operations-and-support-blueprint.md`
- `operations-console-frontend-blueprint.md`
- `staff-workspace-interface-architecture.md`
- `pharmacy-console-frontend-architecture.md`
- `platform-admin-and-config-blueprint.md`
- `governance-admin-console-frontend-blueprint.md`
- `platform-runtime-and-release-blueprint.md`
- `callback-and-clinician-messaging-loop.md`
- `self-care-content-and-admin-resolution-blueprint.md`
- `ux-quiet-clarity-redesign.md`
