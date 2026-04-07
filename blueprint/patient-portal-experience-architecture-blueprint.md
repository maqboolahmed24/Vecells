# Patient portal experience architecture blueprint

## Purpose

Define the patient portal as a calm, task-first, accessibility-maximal experience for three high-value jobs:

- booking and managing appointments
- viewing and understanding personal health records
- communicating directly with the care team

This document specializes `platform-frontend-blueprint.md`, `patient-account-and-communications-blueprint.md`, `callback-and-clinician-messaging-loop.md`, and `phase-4-the-booking-engine.md` so the patient portal behaves like one coherent service rather than a collection of adjacent workflows.

It complements rather than replaces the typed request-lineage and child-route contracts already defined elsewhere. The portal remains one signed-in patient shell with stable navigation, while request, booking, message, callback, and record entities keep their existing canonical ownership.

## Executive evaluation

### Strengths to preserve

- durable request lineage and shell continuity
- strong typed child-route ownership for booking, callback, and messaging
- explicit trust, freshness, and audit semantics
- a calm-by-default front-end philosophy through `PersistentShell`, `CasePulse`, `DecisionDock`, and `AttentionBudget`

### Gaps to close

1. The current information architecture is lineage-strong but portal-light, so navigation still needs a patient-facing task model.
2. Secure health record access is mentioned as a capability, but record visualization is not yet a first-class patient surface.
3. Booking flows are operationally mature, but appointment tasks still need a more explicit portal entry contract.
4. Messaging lifecycles are modeled, but the portal still needs an inbox-level conversation contract that shows `reply needed`, `awaiting review`, and `closed` states clearly.
5. Accessibility is cross-cutting, but the patient portal still needs component-level rules for navigation, charts, tables, documents, focus order, timeout recovery, and plain-language translation of clinical data.

## Control priorities

Close these five high-priority architectural gaps before expanding the portal surface area:

1. Bind every patient route to the canonical shell law so continuity does not fracture across home, detail, booking, record, and message views.
2. Materialize portal read models under one visibility and consistency envelope so audience tier, freshness, and action truth stay aligned.
3. Govern partial visibility explicitly so delayed-release records, step-up-gated messages, and recovery states render safe placeholders instead of leaking or disappearing.
4. Promote contact-route failure, delivery dispute, and consent expiry into first-class patient blockers rather than burying them in account settings or secondary disclosure.
5. Tie NHS App embedded mode to the hardened manifest, trusted context, and bridge-capability contract so embedded routes do not drift from the normal patient shell.

## Overarching conceptual design strategy

### Design promise

The portal should make patients feel four things in order:

1. I know where I am.
2. I understand what needs my attention.
3. I can do the next safe thing.
4. I can open more detail only if I need it.

The governing design law is:

**reassure first, orient second, act third, explain always**

### Portal entry and shell topology

Add the entry, utility-navigation, and section-header contracts:

**PatientPortalEntryProjection**
`entryProjectionId`, `entryChannel = direct_sign_in | notification_deep_link | secure_link | nhs_app_embedded | browser_return`, `requestedRouteRef`, `resolvedSectionRef`, `resolvedAnchorRef`, `patientDegradedModeProjectionRef`, `identityStatementRef`, `orientationHeadlineRef`, `orientationSummaryRef`, `trustCueRef`, `dominantActionRef`, `recoveryActionRef`, `entryState = orienting | ready | read_only | recovery_required`, `renderedAt`

**PatientUtilityNavManifest**
`manifestId`, `bundleVersion`, `utilityOrder`, `accountSummaryRef`, `helpRouteRef`, `accessibilityRouteRef`, `languageAndCommunicationRouteRef`, `securityRouteRef`, `subjectSwitchRouteRef`, `manifestState`

**PatientSectionHeaderFrame**
`sectionHeaderFrameId`, `sectionRef`, `eyebrowRef`, `titleRef`, `orientationSummaryRef`, `trustCueRef`, `attentionCueRef`, `dominantActionRef`, `secondaryActionRefs[]`, `renderedAt`

**PatientAttentionCuePolicy**
`policyId`, `surfaceType = shell | section | card | row`, `allowedCueTones = quiet | note | action_needed | urgent`, `maxProminentCueCount`, `maxBadgeCount`, `maxStickyAlerts`, `badgeMode = count_only | count_plus_label`, `cooldownMs`, `motionIntentRef`, `policyState`

**PatientTrustCueContract**
`trustCueContractId`, `scope = shell | section | card | row`, `freshnessState`, `visibilityState`, `sourceLabelRef`, `lastMeaningfulUpdateAt`, `explanationRef`, `actionImpact = none | caution | read_only | blocked`, `renderMode = header_meta | card_footer | inline_row_meta`, `generatedAt`

Portal layout, spacing, typography, motion, and surface posture must continue to resolve through `design-token-foundation.md` under `profile.patient_portal`. Patient-shell limits on CTA count, promoted cues, compact-card density, and quiet-motion budget are governed by `PatientCalmBudgetProfile` in `ux-quiet-clarity-redesign.md`, not by a second route-local token table.

Rules:

- every signed-in, secure-link, notification, embedded, and browser-return entry resolves through one `PatientPortalEntryProjection` backed by one current `PatientDegradedModeProjection`; the first settled frame must state where the patient is, what changed most recently, whether anything is blocked, and the next safe action before detailed content expands
- the shell is always organized into five regions in this order: identity plus utility bar, primary navigation, `PatientSectionHeaderFrame`, primary content region, and `DecisionDock`; on wide layouts, the primary content region owns the spotlight or active detail and the secondary summary region stays subordinate, while mobile folds the same order into one column without changing section identity or return behavior
- utility navigation is persistent but visually subordinate. It may contain only `Help and support`, `Accessibility`, `Language and communication`, `Account and security`, and `Switch person` when policy allows; sign-out belongs inside `Account and security`, not beside task navigation
- section headers must remain scan-safe at `200%` zoom: title up to 2 lines, orientation summary up to 3 lines, one trust-cue metadata line, and no more than one dominant CTA plus two text-level secondary actions
- `PatientAttentionCuePolicy` must cap patient-visible escalation. In `clarityMode = essential`, each viewport may show at most one prominent `urgent` or `action_needed` cue, one badge per nav item or card, and one sticky alert at most; all other signals demote to quiet metadata or the shared status strip
- badges may communicate counts only. State meaning must remain in plain text such as `Reply needed`, `Awaiting review`, `Read only`, or `Updated 2 hours ago`
- patient cue tones must resolve through the shared semantic roles from `design-token-foundation.md`; saturated caution or urgent fills may appear only on the single promoted cue selected by `PatientAttentionCuePolicy`, and all other state must remain legible through iconography, text, outline, and trust copy
- `PatientTrustCueContract` is mandatory on section headers, home cards, request rows, appointment summaries, record detail headers, and message thread headers. Freshness and source cues must sit next to the headline or CTA they govern, never buried in a global footer
- motion is semantic only. Section entry may use small shared-token reveal and settle cues from the changed region, but looping animation, flashing urgency, and full-page skeleton replacement are forbidden; reduced-motion mode collapses these cues to static emphasis and text
- all interactive controls must respect the canonical patient minimum target, the content column must respect the canonical reading measure, and compact cards may not exceed three content lines before truncation or expansion

### Visual token profile

Patient routes inherit `design-token-foundation.md` through `profile.patient_portal`.

- shell density is `relaxed`; record tables may step down to `balanced` but never `dense_data`
- default interactive controls are 48px tall with a 44px minimum target; patient routes may never use workspace-compact heights
- cards, forms, lists, tables, and drawers use the same surface-role tokens as the rest of the platform; the portal may not invent a separate consumer gradient, radius, or shadow scale
- long-form explanations, results, and consent copy must respect the canonical reading measure and typography roles rather than shrinking into dashboard tiles

### Primary navigation model

Use one stable primary navigation with no more than five task-first sections:

- `Home`
- `Requests`
- `Appointments`
- `Health record`
- `Messages`

Keep utility routes in one persistent `PatientUtilityNavManifest`. It may expose `Help and support`, `Accessibility`, `Language and communication`, `Account and security`, and `Switch person` when policy allows.

Close five high-priority navigation defects before treating this model as canonical:

1. the top-level sections are named, but not yet pinned to one versioned manifest shared across browser and embedded channel variants
2. section visibility does not yet distinguish fully available, blocked, read-only, and governed-placeholder states
3. urgency and unread badges are mentioned, but not tied to one authoritative digest with partial-visibility and blocker semantics
4. the promise of a route back to the active object is not yet backed by a typed continuity and return contract
5. NHS App embedded parity is implied rather than constrained by section-level eligibility and bridge-capability requirements

Add the navigation contracts:

**PatientPrimaryNavManifest**
`manifestId`, `bundleVersion`, `audienceTier`, `channelProfile = browser | embedded`, `sectionOrder`, `utilitySectionOrder`, `defaultSectionRef`, `manifestState`

**PatientNavSectionEligibility**
`eligibilityId`, `sectionRef`, `visibilityState = available | read_only | blocked | placeholder_only`, `blockingReasonCodes[]`, `minimumCapabilitiesRef`, `stepUpRequirementRef`, `placeholderContractRef`, `computedAt`

**PatientNavUrgencyDigest**
`digestId`, `sectionRef`, `patientShellConsistencyRef`, `activeEntityContinuityKey`, `spotlightDecisionRef`, `decisionUseWindowRef`, `selectedCapabilityLeaseRef`, `selectedWritableEligibilityFenceRef`, `actionNeededCount`, `unreadCount`, `blockedTaskCount`, `partialVisibilityCount`, `dominantUrgencyReasonRef`, `safestNextActionRef`, `governingSettlementRef`, `settlementState = live | pending | recovery_required | read_only`, `returnContractRef`, `continuityEvidenceRef`, `continuityValidationState = live | degraded | blocked`, `releaseTrustFreezeVerdictRef`, `selectionTupleHash`, `digestState`

**PatientNavReturnContract**
`returnContractId`, `patientShellContinuityKey`, `sectionRef`, `sourceRouteFamilyRef`, `entityContinuityKey`, `originSpotlightDecisionRef`, `originSelectionTupleHash`, `decisionUseWindowRef`, `selectedAnchorRef`, `expandedDisclosureRef`, `filterStateRef`, `scrollStateRef`, `surfacePostureFrameRef`, `returnRouteRef`, `returnReasonCode`, `governingSettlementRef`, `patientShellConsistencyRef`, `continuityEvidenceRef`, `routeAdjacencyRef`, `restoreState = ready | degraded | recovery_only | blocked`

`PatientNavReturnContract` is the portal's authoritative same-shell return memory. It preserves which section, anchor, disclosure state, filter state, scroll state, bounded posture, and spotlight decision tuple the patient should return to while the same portal shell remains valid. Browser history may replay this contract, but it may not replace it.

**PatientSpotlightDecisionProjection**
`patientSpotlightDecisionProjectionId`, `patientShellConsistencyRef`, `candidateDigestRefs[]`, `candidateSetHash`, `selectedEntityContinuityKey`, `selectedAnchorRef`, `selectedCapabilityLeaseRef`, `selectedWritableEligibilityFenceRef`, `releaseTrustFreezeVerdictRef`, `experienceContinuityEvidenceRef`, `selectedReturnContractRef`, `decisionTier = urgent_safety | patient_action | dependency_repair | watchful_attention | quiet_home`, `decisionUseWindowRef`, `selectionTupleHash`, `decisionState = live | pinned_pending | pinned_recovery | read_only | quiet_home | blocked`, `computedAt`, `staleAt`

**PatientSpotlightDecisionUseWindow**
`patientSpotlightDecisionUseWindowId`, `patientShellConsistencyRef`, `selectedEntityContinuityKey`, `candidateSetHash`, `enteredAt`, `revalidateAt`, `expiresAt`, `supersedingTriggerRefs[]`, `windowState = live | revalidate_only | expired | superseded`

**PatientQuietHomeDecision**
`patientQuietHomeDecisionId`, `patientShellConsistencyRef`, `eligibilityGateRef`, `supportingCandidateDigestRefs[]`, `highestSuppressedTier = none | watchful_attention | quiet_only`, `gentleNextActionRef`, `blockedByRecoveryRefs[]`, `decisionState = eligible | recovery_only | blocked`, `computedAt`

**PatientEmbeddedNavEligibility**
`patientEmbeddedNavEligibilityId`, `sectionRef`, `routeFamilyRef`, `patientEmbeddedSessionProjectionRef`, `manifestVersionRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `currentBridgeCapabilityMatrixRef`, `minimumBridgeCapabilitiesRef`, `requiredBridgeActionRefs[]`, `routeFreezeDispositionRef`, `experienceContinuityEvidenceRef`, `eligibilityState = live | read_only | placeholder_only | safe_browser_handoff | recovery_required | blocked`

**PatientPortalContinuityEvidenceBundle**
`bundleId`, `patientShellConsistencyRef`, `navContinuityEvidenceRef`, `bookingContinuityEvidenceRef`, `recordContinuityEvidenceRef`, `conversationContinuityEvidenceRef`, `embeddedContinuityEvidenceRefs[]`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`PatientPortalContinuityEvidenceBundle` is the portal-level proof bundle for continuity-sensitive shells. `Home`, booking workspace, appointment manage, record follow-up, thread actionability, and embedded recovery may not improvise continuity posture from local projection freshness when the assurance spine already has explicit `ExperienceContinuityControlEvidence` for those controls.
For `Home`, `navContinuityEvidenceRef` must validate the same governing entity, selected anchor, publication tuple, and spotlight `selectionTupleHash` currently carried by `PatientSpotlightDecisionProjection` or `PatientQuietHomeDecision`.

**PatientSectionSurfaceState**
`patientSectionSurfaceStateId`, `sectionRef`, `surfacePostureFrameRef`, `selectedAnchorRef`, `patientDegradedModeProjectionRef`, `surfaceState = loading | empty | partial | read_only | recovery_required | settled`, `governingDigestRef`, `headlineRef`, `explanationRef`, `trustCueRef`, `attentionCueRef`, `dominantActionRef`, `secondaryActionRefs[]`, `placeholderContractRef`, `lastKnownGoodSummaryRef`, `announcementModeRef`, `renderedAt`

`PatientSectionSurfaceState` is the calm section-entry posture contract for `Home`, `Requests`, `Appointments`, `Health record`, and `Messages`. It derives from the route family's `PatientRoutePosture`, `SurfacePostureFrame`, and current `PatientDegradedModeProjection`, keeping each section inside the same shell while loading, degrading, or recovering instead of dropping the patient into generic banners, detached empty pages, or optimistic re-entry. Each settled or recovering section state must resolve one `PatientSectionHeaderFrame` before the section body paints.

**PatientPortalNavigationLedger**
`ledgerId`, `patientShellContinuityKey`, `manifestRef`, `selectedSectionRef`, `selectedRouteFamilyRef`, `lastStableRouteFamilyRef`, `activeEntityContinuityKey`, `spotlightDecisionRef`, `selectionTupleHash`, `quietHomeDecisionRef`, `selectedAnchorRef`, `selectedDisclosureRef`, `returnContractRef`, `filterStateRef`, `scrollStateRef`, `lastStableSurfacePostureRef`, `pendingRecoveryContinuationRef`, `utilityOverlayRefs[]`, `restoreEpoch`, `historyEpoch`, `ledgerState = live | stale | recovery_required | blocked`

`PatientPortalNavigationLedger` is the patient shell's authoritative navigation memory. Section selection, utility overlays, last safe anchor, disclosure state, last safe posture, and refresh or back-forward restore must all resolve through it rather than through browser-history guesswork.

**PatientRouteAdjacency**
`patientRouteAdjacencyId`, `fromRouteFamilyRef`, `toRouteFamilyRef`, `adjacencyType = same_object_child | same_section_object_switch | same_shell_section_switch | hard_boundary`, `shellReuseDisposition = must_reuse | may_replace`, `historyPolicy = push | replace | none`, `selectedSectionDispositionRef`, `selectedAnchorDispositionRef`, `dominantActionDispositionRef`, `returnContractDisposition = preserve | mint_child_contract | consume_recovery`, `ledgerRestoreDisposition = preserve | update_anchor | clear_on_boundary`, `recoveryFallbackRef`, `contractVersionRef`

`PatientRouteAdjacency` declares how a patient route morphs. It decides whether the portal keeps the same section, switches section inside the same shell, changes the active object in place, or crosses a true shell boundary.

**PatientSelectedAnchorPolicy**
`patientSelectedAnchorPolicyId`, `routeFamilyRef`, `primaryAnchorSlotRef`, `invalidationPresentationRef`, `replacementRequirementRef`, `releaseRuleRefs[]`, `refreshRestoreOrderRef`, `fallbackAnchorRef`, `policyVersionRef`

`PatientSelectedAnchorPolicy` defines which card, appointment, slot, result, document, or thread anchor is the route family's primary continuity target and how it should survive invalidation, refresh, and recovery.

**PatientDominantActionHierarchy**
`patientDominantActionHierarchyId`, `routeFamilyRef`, `shellDominantActionRef`, `primaryRegionDominantActionRef`, `competingActionRefs[]`, `demotionRuleRefs[]`, `blockedFallbackActionRef`, `quietReturnActionRef`, `hierarchyVersionRef`

`PatientDominantActionHierarchy` ensures one dominant action per section or child route. Summary cards, inline links, and secondary utilities may not compete with the current safest next step.

**PatientStatusPresentationContract**
`patientStatusPresentationContractId`, `routeFamilyRef`, `statusStripSentenceRef`, `freshnessChipMode`, `cardLocalStateRefs[]`, `bannerEscalationRef`, `settlementPresentationRef`, `recoveryPresentationRef`, `duplicationFenceRef`, `contractVersionRef`

`PatientStatusPresentationContract` is the calm status grammar for each patient route family. It keeps the shell strip, card-level cues, child-route pending states, and recovery copy aligned so the portal speaks with one status voice.

Portal shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = patient)` over `Home`, `Requests`, `Appointments`, `Health record`, `Messages`, and their governed child route families
- every patient route family must publish one `RouteFamilyOwnershipClaim`; request detail, booking manage, callback, message thread, record detail, consent, repair, and recovery routes are `same_shell_child`, `same_section_object_switch`, or `bounded_stage` members of the patient shell, not detached mini-products
- `PatientRouteAdjacency`, `PatientSelectedAnchorPolicy`, `PatientDominantActionHierarchy`, and `PatientStatusPresentationContract` must all resolve the same ownership claim before a child route can render live
- section summaries may be contributed by booking, callback, messaging, record, or pharmacy domains, but those domains do not own the shell; they contribute child work inside the patient shell continuity envelope
- deep links, notification links, secure links, and embedded resumes into child routes must resolve through the owning patient shell and current `PatientNavReturnContract`; if shell ownership or adjacency no longer validates, the same shell must fall to bounded recovery instead of opening a detached fallback page

Rules:

- navigation stays stable across desktop, mobile web, and NHS App embedded webview through one `PatientPrimaryNavManifest`; sections may degrade, but they may not silently disappear outside policy-governed manifest changes
- every top-level section landing in `Home`, `Requests`, `Appointments`, `Health record`, and `Messages` must render from one `PatientSectionSurfaceState`
- each destination opens with one dominant action, one short orientation summary, and one localized trust cue derived from the current `PatientNavUrgencyDigest`, `PatientNavSectionEligibility`, and `PatientSectionSurfaceState`
- the entry frame, section summary, child-route recovery state, and any same-shell artifact fallback must consume the same `PatientDegradedModeProjection`; route-local warning copy may narrow language, but it may not invent a calmer degraded mode or suppress the preserved anchor and next safe action
- loading posture uses region skeletons only; it may not replace the shell with a generic spinner once the current section is known
- empty posture must explain what usually appears in the section and offer one safe next action
- partial and `recovery_required` posture must preserve the last safe summary or selected anchor rather than bouncing the patient to a generic home state
- if step-up, release drift, or embedded mismatch downgrades a section, the same section stays open with its governed placeholder and repair action in place
- badges may show unread or action-needed counts, but never as the only urgency cue; partial visibility, blocked tasks, and governed placeholders must remain explicit in the section summary
- `PatientNavUrgencyDigest.safestNextActionRef` may resolve to a live CTA only while `settlementState = live`; if the linked patient action, conversation, or embedded route is pending, stale, or in recovery, the same section must keep `returnContractRef` stable and surface bounded pending or recovery guidance instead of a fresh CTA
- `Home` spotlight ownership must resolve through `PatientSpotlightDecisionProjection`; same-tier freshness churn may refresh summary copy, but it may not replace the selected spotlight while the linked `PatientSpotlightDecisionUseWindow` is still live
- section-level actionability must also validate `PatientPortalContinuityEvidenceBundle.navContinuityEvidenceRef`; if patient-navigation continuity evidence is stale, blocked, or degraded, the section summary remains visible but the dominant CTA must fall back to recovery or read-only posture in place
- any appointments or manage-oriented entry point must also validate `PatientPortalContinuityEvidenceBundle.bookingContinuityEvidenceRef`; if booking continuity evidence is stale, blocked, or degraded, the section may still orient the patient to the appointment but it must not expose calm manage posture in place of bounded recovery
- the portal always exposes a route back to the active request, appointment, record item, or message thread through `PatientNavReturnContract`, preserving the active `SelectedAnchor` where continuity is unchanged
- if `patientShellContinuityKey` is unchanged, `PatientNavUrgencyDigest`, `PatientNavReturnContract`, `PatientPortalNavigationLedger`, and the relevant `PatientRouteAdjacency` must agree before any route family becomes live; browser history, alias parsing, or route-local cache may not invent a second shell or a fresh anchor
- `patientShellContinuityKey` is the stable signed-in shell identity for `Home`, `Requests`, `Appointments`, `Health record`, and `Messages`; section switches may change the active object, but they may not replace the shell while `PatientPortalNavigationLedger` and `PatientRouteAdjacency` still validate the move
- browser back or forward, hard refresh, and post-step-up return must restore selected section, filters, scroll, and anchor from `PatientPortalNavigationLedger` before live hydration starts
- every same-shell patient route transition must publish one `PatientRouteAdjacency`; booking-step progress, request-detail messaging, thread open, result open, and document open may not improvise their own history or focus behavior
- every patient route family must publish one `PatientSelectedAnchorPolicy`, one `PatientDominantActionHierarchy`, and one `PatientStatusPresentationContract`
- `PatientRouteAdjacency.historyPolicy = replace` is mandatory for provisional booking steps and quiet recovery, while `push` is reserved for user-meaningful section or object changes
- in NHS App embedded mode, a section may render live only when `PatientEmbeddedNavEligibility` confirms manifest parity, session lineage, subject binding, current bridge capability, and continuity evidence for the current route family; otherwise the same section degrades to read-only, placeholder, safe-browser handoff, or blocked guidance in place
- any timeout, expired link, stale capability lease, denied-scope mutation, or blocked-policy action must reopen through the same `PatientActionRecoveryProjection`, active `PatientNavReturnContract`, and any live `PatientRequestReturnBundle`; detached recovery routes and generic home redirects are invalid while the same shell remains recoverable
- global search is optional; task-first navigation is mandatory

Patient shell continuity resolution is authoritative:

1. On route entry, refresh, back-forward restore, deep-link resolution, step-up return, or recovery-token consume, resolve the current `patientShellContinuityKey`, `PatientShellConsistencyProjection`, `PatientPortalNavigationLedger`, active `PatientNavReturnContract`, and applicable `PatientRouteAdjacency` before any live CTA or calm status renders.
2. If `patientShellContinuityKey` is unchanged and `PatientRouteAdjacency.adjacencyType != hard_boundary`, reuse the existing `PersistentShell`, restore section, anchor, disclosure, filter, safe scroll, and any still-valid spotlight `selectionTupleHash` from `PatientPortalNavigationLedger`, and morph only the child route.
3. If shell consistency, continuity evidence, release posture, or route intent drifts, keep the same shell and render `SurfacePostureFrame(postureState = blocked_recovery | read_only)` over the last safe summary or anchor; generic expired-link pages, detached receipts, or home resets are invalid while the same shell remains recoverable.
4. Child-route launch from home, requests, records, messages, callback, consent, pharmacy, or appointments must mint or refresh `PatientNavReturnContract` and any `PatientRequestReturnBundle` or `RecordOriginContinuationEnvelope` before the child route becomes live.
5. If a child route becomes stale, expired, denied-scope, blocked-policy, or step-up-bound before settlement, keep the same shell and reopen the active `PatientActionRecoveryProjection` over the prior anchor, last safe summary, and dominant recovery action instead of dropping to a generic recovery landing.
6. When recovery, step-up, or embedded downgrade resolves, return through the active return contract and restore the prior quiet section posture only after typed routing, continuity evidence, and the governing settlement chain revalidate the same action tuple; otherwise remain read-only or recovery-bound in place.

Rollout and backfill for patient shell continuity:

- backfill `PatientPortalNavigationLedger.selectedDisclosureRef`, `lastStableRouteFamilyRef`, `lastStableSurfacePostureRef`, and `pendingRecoveryContinuationRef` for live sessions where route state is still reconstructible
- backfill `PatientNavReturnContract` for active home, request, booking, record, message, callback, pharmacy, and recovery routes from current section, anchor, route family, and live continuity evidence; when reconstruction is incomplete, degrade to same-shell recovery or read-only return instead of a generic section reset
- backfill `PatientActionRecoveryProjection` and the recovery tuple for live stale-action, expired-link, step-up-bound, and denied-scope routes wherever the governing request, booking, callback, thread, or pharmacy lineage can still be resolved safely
- backfill request-child journeys with `PatientRequestReturnBundle` whenever a request detail projection and child route can be paired unambiguously; ambiguous legacy returns must reopen the request shell in bounded recovery with lineage chips still visible
- until backfill is complete, browser-history-only restore may reopen summary posture, but it may not show calm live CTA truth until `PatientPortalNavigationLedger`, `PatientNavReturnContract`, and continuity evidence converge again

### Home surface contract

`Home` should behave like a calm personal triage board, not a generic dashboard.

Render only:

- one `TaskSpotlightCard` for the single most important next action
- a compact `ActiveRequestsCard`
- a compact `UpcomingAppointmentsCard`
- a compact `LatestRecordUpdatesCard`
- a compact `UnreadMessagesCard`
- one persistent `Need help right now?` safety route for urgent or inappropriate-to-message concerns

Do not start with dense metrics, multiple banners, or full historical feeds.

The layout is one spotlight block followed by a compact 2x2 secondary grid on wide layouts and a single stacked column on mobile. `TaskSpotlightCard` owns the primary span; `ActiveRequestsCard`, `UpcomingAppointmentsCard`, `LatestRecordUpdatesCard`, and `UnreadMessagesCard` occupy equal compact spans. Each compact card may show one 2-line headline, one 1-line state label, one trust-cue line, and one text or button CTA. Charts, meters, multi-action footers, and auto-rotating carousels are forbidden.

`Home` must assemble under the same `PatientShellConsistencyProjection` used by the linked request, booking, record, and message surfaces. `TaskSpotlightCard`, `ActiveRequestsCard`, `UpcomingAppointmentsCard`, `LatestRecordUpdatesCard`, and `UnreadMessagesCard` may only render live CTAs when `bundleVersion`, `audienceTier`, and governing-object versions still match the current shell envelope.

`Home` must resolve one current `PatientSpotlightDecisionProjection`, one current `PatientSpotlightDecisionUseWindow`, and one current `PatientQuietHomeDecision` before the primary spotlight region renders. The spotlight region may not choose a different owning entity from home-card freshness, partial hydration order, or a locally recomputed score once those contracts exist.

`TaskSpotlightCard` must render only the entity selected by `PatientSpotlightDecisionProjection`. Its dominant CTA must bind to the same `selectedCapabilityLeaseRef`, `selectedWritableEligibilityFenceRef`, `PatientNavUrgencyDigest.governingSettlementRef`, and `PatientNavReturnContract`. If the latest authoritative settlement is pending review, stale recovery, embedded read-only downgrade, or blocked repair, the card must stay pinned in place and expose that bounded posture rather than re-offering the last optimistic book, reply, or view action.

If the spotlight's governing entity remains the same but its capability lease, trust verdict, continuity evidence, or writable fence downgrades, `TaskSpotlightCard` must keep the same `selectionTupleHash`, preserve the same home-card anchor, and morph through `pinned_pending`, `pinned_recovery`, or `read_only` posture in place. A fresh request, message, record, or appointment may not steal the spotlight until the linked `PatientSpotlightDecisionUseWindow` expires or an explicit higher-tier superseding trigger invalidates the current tuple.

`Home` must also consume `PatientPortalContinuityEvidenceBundle`. If `navContinuityEvidenceRef`, `bookingContinuityEvidenceRef`, `recordContinuityEvidenceRef`, or `conversationContinuityEvidenceRef` is stale or blocked for the card that currently owns the spotlight, the portal may keep the card visible but it must downgrade the CTA to the safest bounded recovery or read-only route instead of assuming the last digest is still trustworthy.

`ActiveRequestsCard` must summarize the highest-ranked request that is not already occupying the spotlight plus total counts for `Needs attention` and `In progress`. Its CTA may resolve only to `/requests` or the governing request detail selected by the current `PatientNavReturnContract`; it may not deep-link to a child booking, callback, or message route without showing the owning request lineage first.

If the highest-priority patient task is blocked by reachability failure, delivery dispute, consent expiry, or step-up requirements, the dominant card must switch to the blocker-repair route instead of showing a stale book, reply, or view CTA. If the underlying entity contributes urgency but is not fully visible, `Home` must show a governed placeholder with the safest next step.

When the portal is running in NHS App embedded mode, `Home` must also validate `PatientEmbeddedSessionProjection` before showing a live CTA. If session epoch, subject binding, manifest version, release tuple, or channel rollout state drifts, the same card stays visible but downgrades to bounded recovery or read-only guidance instead of launching the stale action.

When the patient has no urgent task, no active request above the quiet threshold, no upcoming appointment requiring attention, no unread message, and no record update above the significance threshold, `Home` must resolve the center of the page through the current `PatientQuietHomeDecision` and one `SurfaceStateFrame(stateClass = empty | sparse)` that reassures the patient that nothing needs action right now, keeps the urgent-help route visible, and offers only one gentle next step such as start a request, view records, or book routine care according to the current `PatientNavUrgencyDigest`. Decorative empty cards, historical dashboards, and filler analytics are not valid calm states.

If `PatientQuietHomeDecision.decisionState = recovery_only | blocked`, the primary region must stay devoted to repair or recovery guidance instead of rendering a decorative quiet-home empty state.

If only one summary card is stale, blocked, or in recovery, keep the other cards live and localize the issue to that card's state frame. `Home` may not promote a shell-wide banner unless the entire portal shell loses trustworthy actionability.

### Requests surface contract

`/requests` is the patient's case browser. It should explain request state and lineage without forcing the patient into every detail page.

Add the request-browsing contracts:

**PatientRequestsIndexProjection**
`patientRequestsIndexProjectionId`, `patientRef`, `defaultBucket = needs_attention`, `visibleBuckets[]`, `activeFilterSetRef`, `selectedAnchorRef`, `selectedAnchorTupleHash`, `dominantActionRef`, `trustCueRef`, `requestSummaryRefs[]`, `requestLineageRefs[]`, `bucketMembershipDigestRef`, `lineageOrderingDigestRef`, `computedAt`

**PatientRequestLineageProjection**
`patientRequestLineageProjectionId`, `requestRef`, `requestLineageRef`, `summaryProjectionRef`, `detailProjectionRef`, `currentStageRef`, `childObjects[]`, `downstreamProjectionRefs[]`, `visiblePlaceholderRefs[]`, `awaitingParty`, `safestNextActionRef`, `nextExpectedStepRef`, `lastConfirmedStepAt`, `selectedChildAnchorRef`, `selectedChildAnchorTupleHash`, `lineageTupleHash`, `visibilityState = full | partial | placeholder_only`, `computedAt`

Rules:

- `/requests` opens on `Needs attention`. `In progress` and `Complete` are peer buckets, not decorative tabs. If the patient has any blocked or action-needed request, `Complete` may not open by default
- the requests header must explain what the list contains right now, the count of requests needing action, and the safest next action. Search is optional; bucket selection is mandatory
- persistent filters are limited to `Status`, `Care type`, and `Updated`. Any broader refinement belongs in a secondary drawer so the primary list remains readable on mobile and at `200%` zoom
- each row must render from `PatientRequestSummaryProjection` and show request label, current state, who is waiting on whom, last meaningful update, next safe action or `No action needed`, localized trust cue, and lineage chips for downstream booking, callback, pharmacy, or message children
- `PatientRequestsIndexProjection.bucketMembershipDigestRef` and `lineageOrderingDigestRef` must be derived from the same `PatientRequestSummaryProjection` and `PatientRequestLineageProjection` set shown on screen; local regroup or cache may not silently change downstream chip order or branch visibility
- rows sort lexicographically by blocker severity, patient-owed action, authoritative due time, and latest meaningful update. Local UI sort preferences may not hide a higher-risk request above the fold unless the patient explicitly switches bucket or search
- each row may expose exactly one live CTA. Secondary actions live inside request detail only
- `PatientRequestLineageProjection` must render immediately below the request summary on detail pages and as compact chips on list rows. Child objects that are delayed, read-only, or step-up-gated must remain visible as governed placeholder chips rather than disappearing, and detail may not disclose a different downstream order or calmer child posture than the list row for the same request
- selecting a row must preserve `SelectedAnchor` through refresh, filter, regroup, and same-shell return. If the request reorders while open, the anchor stays on the same request, `selectedAnchorTupleHash` remains stable, and the list scroll position may not jump to a sibling item
- list, row, and detail CTA truth must bind to the current `PatientNavUrgencyDigest`, `PatientNavReturnContract`, and `PatientPortalContinuityEvidenceBundle.navContinuityEvidenceRef`; stale rows may stay readable but must downgrade to `View details` or recovery posture in place
- request detail, child booking, callback, pharmacy, and conversation work launched from the list must reuse the same request shell through the active `PatientNavReturnContract` and `PatientRequestReturnBundle`; returning to a generic bucket or recomputed row is forbidden while the same request lineage remains active
- request rows, request detail, and child-route return must also agree on `lineageTupleHash`, downstream ordering digest, governed placeholder set, and selected child anchor tuple for the same request lineage; if those drift, the shell must preserve the last safe lineage strip and downgrade to bounded recovery rather than silently switching branch context
- in `clarityMode = essential`, mobile may expand only one row summary or one filter drawer at a time. Desktop may pin the selected request detail beside the list only while the same `entityContinuityKey` remains active

### Accessibility and empathy contract

The portal must treat accessibility and empathy as structural rules and must implement `accessibility-and-content-system-contract.md` with patient-authenticated copy and recovery posture.

1. Build to WCAG 2.2 AA as the minimum release bar for all patient surfaces.[1][2]
2. Follow NHS accessibility and content guidance so page titles, headings, links, forms, and health language remain understandable for people with different cognitive, visual, motor, and technical needs.[2][3]
3. Default every patient view to `clarityMode = essential` with one dominant action and one expanded support region at most.
4. Use plain language before medical language. When technical terms are needed, pair them with a short explanation on first use.
5. Never rely on color alone to communicate abnormality, urgency, success, or selection.
6. Charts and visual trends must always have an equivalent data table, summary sentence, and screen-reader-compatible narrative.
7. Any timeout, lock, expired link, or step-up authentication boundary must preserve the current context and explain what happens next.
8. If the source content is a PDF or uploaded document, provide an accessible HTML summary first whenever the content is patient-visible; downloadable files are secondary, not primary.[4]
9. In the NHS App webview, keep the same task model and accessibility quality while respecting embedded navigation and header rules.[5]
10. Every section landing, detail view, manage flow, record view, and message thread must declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, and `AssistiveTextPolicy(audienceTier = patient_authenticated)` so the announced order remains heading -> current state -> actionability -> dominant action.
10A. Each patient route family must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; home, requests, booking, appointments, records, and messages may not stay calm or interactive while that coverage is `degraded` or `blocked`.
10B. Patient accessibility coverage must explicitly include `compact` through `wide`, embedded host resize and safe-area changes, `mission_stack` folds, `400%` zoom, reduced motion, and live-update or reconnect buffering; if any mode drifts, the same route must fall back to summary-first, list-first, table-first, or recovery posture rather than leaving semantically partial controls armed.
11. Patient forms, reply composers, booking steps, and account-repair flows must declare `FieldAccessibilityContract`, `FormErrorSummaryContract`, and `TimeoutRecoveryContract`; failed submit must keep the patient’s answers, focus the error summary, and expose field-linked repair text in plain language.
12. Result trends, medication tables, slot selectors, and document or letter summaries must declare `VisualizationFallbackContract` with explicit units, non-colour cues, and a table-first fallback that preserves the current `PatientNavReturnContract`.
13. Session timeout, step-up expiry, and expired-link recovery must preserve the current `PatientNavReturnContract`, any active `PatientRequestReturnBundle`, and the same `PatientActionRecoveryProjection`, explain whether draft content is still safe, and expose one clear recovery action before any secondary help.
14. Screen-reader-only helper text may clarify control purpose, units, or consequence, but it may not hide clinically important facts that the visible interface omits.
15. Patient lists, detail views, manage flows, and message threads must resolve live narration through one `AssistiveAnnouncementTruthProjection` bound to the active anchor, current `UIEventEmissionCheckpoint`, freshness posture, and recovery contract; restore, reconnect, resend, and autosave may emit one current-state summary, but they may not replay historical acknowledgements or delivery cues as fresh activity.

## Frontend architectural blueprint

### 1. Shell and route map

Use `Patient Web Shell` as the single portal shell, with these canonical route families:

- `/home`
- `/requests`
- `/requests/:requestId`
- `/requests/:requestId/conversation`
- `/appointments`
- `/bookings/:bookingCaseId`
- `/bookings/:bookingCaseId/select`
- `/bookings/:bookingCaseId/confirm`
- `/appointments/:appointmentId`
- `/appointments/:appointmentId/manage`
- `/records`
- `/records/results`
- `/records/results/:resultId`
- `/records/medications`
- `/records/documents`
- `/records/documents/:documentId`
- `/messages`
- `/messages/:clusterId`
- `/messages/:clusterId/thread/:threadId`
- `/messages/:clusterId/callback/:callbackCaseId`
- `/messages/:clusterId/repair`
- `/contact-repair/:repairCaseId`
- `/recovery/:recoveryToken`
- `/identity-hold/:identityRepairCaseId`

Deep-link aliases may exist, but `/requests/:requestId/messages`, `/messages/:threadId`, secure callback-entry grants, and recovery resumes must resolve into the owning request or conversation-cluster shell and preserve the same `entityContinuityKey` when the active entity is unchanged.

All route families above bind one signed-in `patientShellContinuityKey = patient_signed_in + subjectRef + channelProfile + bundleVersion`. The active `entityContinuityKey` may change as the patient moves between request, booking, appointment, result, document, conversation-cluster, thread, callback, and recovery objects, but the same portal shell remains while `PatientPortalNavigationLedger` and the relevant `PatientRouteAdjacency` still validate the move. The default topology is `focus_frame`; narrow mobile routes may collapse into `mission_stack`; `embedded_strip` is allowed only when the route is entered through a trusted NHS App embedded context. Hard page reloads, detached success pages, and generic fallback redirects are not valid continuity mechanisms for ordinary state transitions.

Use these patient route-adjacency rules as canonical:

- `/home` -> spotlight target uses `PatientRouteAdjacency(adjacencyType = same_shell_section_switch, historyPolicy = push)` and must preserve a deterministic `PatientNavReturnContract` back to the originating home card anchor plus the same spotlight `selectionTupleHash`
- `/requests` -> `/requests/:requestId`, `/messages` -> `/messages/:clusterId`, `/records/results` -> `/records/results/:resultId`, and `/records/documents` -> `/records/documents/:documentId` are `same_section_object_switch` transitions that keep the selected top-level section stable
- `/requests/:requestId` -> `/requests/:requestId/conversation`, `/appointments/:appointmentId` -> `/appointments/:appointmentId/manage`, and `/bookings/:bookingCaseId` -> `/bookings/:bookingCaseId/select` or `/confirm` are `same_object_child` transitions inside the same shell
- `/messages/:clusterId` -> `/messages/:clusterId/thread/:threadId`, `/messages/:clusterId/callback/:callbackCaseId`, and `/messages/:clusterId/repair` are `same_object_child` transitions that keep the active conversation cluster and return path stable
- `/bookings/:bookingCaseId/select` -> `/bookings/:bookingCaseId/confirm` must use `historyPolicy = replace` until authoritative settlement so the patient can back out of the task without stepping through provisional machine states
- browser back or forward, hard refresh, and recovery return must reopen the owning section, object anchor, and last safe scroll position from `PatientPortalNavigationLedger` before a live CTA is shown again

Every patient route family must render one stable `CasePulse`, one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, one current `DecisionDock`, and a `StateBraid` summary stub or panel where history, freshness, or trust affect action safety. Child routes such as `/bookings/:bookingCaseId/confirm`, `/appointments/:appointmentId/manage`, `/records/results/:resultId`, `/messages/:clusterId/thread/:threadId`, `/messages/:clusterId/callback/:callbackCaseId`, and `/recovery/:recoveryToken` must preserve `SelectedAnchor`, disclosure posture, and focus where safe when continuity is unchanged.

### 1A. Calm route posture and artifact delivery

Every patient route family must derive one calm route posture from the shared `SurfacePostureFrame` so loading, empty, pending-confirmation, governed-placeholder, and recovery states stay inside the same shell and section mental model.

Add these patient-route adapters:

**PatientRoutePosture**
`patientRoutePostureId`, `routeFamilyRef`, `sectionRef`, `entityContinuityKey`, `surfacePostureFrameRef`, `continuityEvidenceBundleRef`, `patientDegradedModeProjectionRef`, `selectedWritableEligibilityFenceRef`, `selectedAnchorRef`, `dominantQuestionRef`, `dominantActionRef`, `placeholderContractRef`, `recoveryActionRef`, `renderedAt`

**PatientArtifactFrame**
`patientArtifactFrameId`, `recordOrMessageArtifactRef`, `artifactSurfaceFrameRef`, `returnContractRef`, `structuredSummaryRef`, `stepUpRequirementRef`, `governedPlaceholderRef`, `renderedAt`

Rules:

- `Home`, `Requests`, `Appointments`, `Health record`, and `Messages` must each open through one `PatientRoutePosture`; section-level loading, empty, blocked, or pending states may not invent detached cards, dashboard filler, or extra full-width banners
- `PatientRoutePosture` must carry the current `PatientDegradedModeProjection` plus the governing `WritableEligibilityFence` for the dominant action; route-local summaries may not keep a CTA live after the shared degraded projection has withdrawn writable posture
- when the active request, booking, record, conversation cluster, callback child, or thread is already known, `SurfacePostureFrame` must keep the current `CasePulse`, selected anchor, and section summary visible under `loading_summary`, `stale_review`, `blocked_recovery`, or `read_only`; full-screen blank loaders are forbidden
- `empty_actionable` and `empty_informational` must be distinct. No upcoming appointment, filtered-no-results, and governed-placeholder states must each explain why the section is empty and what safe next step, if any, is available
- booking confirmation, appointment-management mutations, message send, and record-origin follow-up must use `SurfacePostureFrame(postureState = settled_pending_confirmation)` inside the same shell until authoritative settlement arrives; quiet success copy may not appear early
- any patient-visible result attachment, document, message export, or recovery artifact must render through `PatientArtifactFrame` backed by `ArtifactSurfaceFrame`; structured summary is primary, and download or external handoff remains secondary and grant-bound
- `mission_stack` must fold the same `PatientRoutePosture`, dominant question, dominant action, and selected anchor rather than introducing a separate mobile-only journey

### 2. Required patient projections

Add these read models so portal navigation and summary surfaces do not over-fetch unrelated detail:

- `PatientPortalEntryProjection`
- `PatientDegradedModeProjection`
- `PatientPortalHomeProjection`
- `PatientPortalNavigationProjection`
- `PatientPortalContinuityEvidenceBundle`
- `PatientShellConsistencyProjection`
- `PatientTaskSpotlightProjection`
- `PatientRequestSummaryProjection`
- `PatientRequestsIndexProjection`
- `PatientRequestDetailProjection`
- `PatientRequestLineageProjection`
- `PatientRequestDownstreamProjection`
- `PatientRequestReturnBundle`
- `PatientAppointmentListProjection`
- `PatientAppointmentWorkspaceProjection`
- `PatientAppointmentManageProjection`
- `PatientAppointmentArtifactProjection`
- `PatientRecordOverviewProjection`
- `PatientResultInsightProjection`
- `PatientMedicationProjection`
- `PatientDocumentLibraryProjection`
- `PatientCommunicationVisibilityProjection`
- `PatientConversationCluster`
- `PatientCallbackStatusProjection`
- `PatientMessageCenterProjection`
- `PatientThreadSummaryProjection`
- `PatientReachabilitySummaryProjection`
- `PatientContactRepairProjection`
- `PatientConsentCheckpointProjection`
- `PatientEmbeddedSessionProjection`
- `PatientAccessibilityPreferenceProjection`

Every projection must carry `lastMeaningfulUpdateAt`, `freshnessState`, and `actionRequiredState`.

Every projection in this blueprint must be materialized under the canonical `VisibilityProjectionPolicy` and assembled beneath one `PatientShellConsistencyProjection` carrying at least `bundleVersion`, `audienceTier`, `computedAt`, `staleAt`, `governingObjectRefs`, `entityVersionRefs`, and `causalConsistencyState`. Portal surfaces may not stitch together unrelated reads outside that envelope.

Where records, documents, conversations, reminders, or recovery states can be partially visible, the owning projection must also carry `releaseState`, `visibilityTier`, `summarySafetyTier`, and `placeholderContractRef`. If the request header, status strip, and `DecisionDock` no longer share the same `bundleVersion` or governing-object version, mutating CTAs must freeze in place and the shell must show bounded refresh or recovery guidance instead of contradictory reassurance.

`PatientDegradedModeProjection` is mandatory for portal entry, section landings, child-route recovery, and same-shell artifact fallback. `Home`, `Requests`, `Appointments`, `Health record`, and `Messages` may vary copy and explanation by route family, but they must normalize degraded posture to the same `currentMode`, preserved anchor, and next safe action before any calmer or richer shell state is shown.

`PatientEmbeddedSessionProjection` is required whenever `channelType = embedded`. It must carry at least `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `minimumBridgeCapabilitiesRef`, `currentBridgeCapabilityMatrixRef`, `recoveryRouteRef`, and `computedAt`. Embedded task CTAs may only render live when this projection, `PatientEmbeddedNavEligibility`, and `PatientShellConsistencyProjection` agree on the same subject, session lineage, manifest tuple, route entitlement, and current bridge capability.

### 3. Appointment scheduling workspace

The booking experience should feel like a guided decision, not a scheduling system.

Entry from `Home`, `Requests`, or `Appointments` must converge into one `PatientAppointmentWorkspaceProjection` with appointment purpose, timeframe, modality, accessibility needs, travel preferences, continuity preference, and fallback routes.

The default slot surface is a ranked list grouped by day. Each card should show only day and date, time, location or remote label, clinician type or name where appropriate, accessibility or travel hints, and one short reason cue such as `soonest` or `best match`. That cue must come from the current `CapacityRankExplanation.patientReasonCueRefs[]` under the bound `CapacityRankDisclosurePolicy`; grouped-day view, compare mode, and filter changes may not invent new ordering or cue text locally.

In `clarityMode = essential`:

- only one slot card may expand at a time
- only one compare surface may be open at a time
- filters belong in a `Refine options` drawer
- the selected slot stays pinned during confirm and recovery states

The confirmation surface must always answer what was chosen, what happens after confirmation, how the patient will be contacted, and what to do if the slot no longer works.

The selected slot card and any waitlist-offer accept card must also render one current `ReservationTruthProjection`. `Held for you until ...` is legal only when that projection says the reservation is actually held and the countdown is a real hold expiry; otherwise the portal must use truthful nonexclusive or checking-availability wording and may not imply the slot is reserved simply because it is selected or the response window is still open.

The confirmation child state, any in-shell booked summary, and any manage, reminder, or export affordance must also bind one current `BookingConfirmationTruthProjection`. Until that projection reaches `confirmationTruthState = confirmed` and exposes the relevant manage or artifact state, the portal may show only the selected slot plus provisional receipt or recovery guidance; it may not surface final booked reassurance, reminder success, calendar export, directions, or manage links from `AppointmentRecord` presence, provider acceptance, or local success toasts alone.

`Manage appointment` should foreground appointment summary, attendance instructions, reminder settings, cancel, reschedule, update details, and a visible assisted path. Destructive actions should use short, consequence-aware confirmation copy and preserve a visible route back to the booked state.

Booking workspace and `Manage appointment` actionability must render from the current domain-owned `BookingCapabilityProjection`, not from supplier-name heuristics, cached entry state, or prior appointment status alone. When `BookingCapabilityProjection.surfaceState = assisted_only | linkage_required | local_component_required | degraded_manual | recovery_required | blocked`, the portal must keep the selected slot or appointment anchor visible, swap the dominant action to the governed fallback from that projection, and suppress stale self-service or manage controls in place.

The booking workspace and `Manage appointment` routes must also validate `PatientPortalContinuityEvidenceBundle.bookingContinuityEvidenceRef`. If the current booking continuity evidence no longer points at the active booking or appointment lineage, manage settlement chain, or embedded release posture, the portal may keep the appointment summary, selected slot, or booked-state anchor visible, but it must not expose calm cancel, reschedule, reminder, or confirmation posture until booking continuity is re-proven.

Booking entry from `Home`, `Requests`, `Appointments`, record follow-up, or message follow-up must mint or refresh `PatientNavReturnContract` before slot selection becomes live. Confirmation, quiet receipt, and recovery must morph inside the same shell and restore the launching section, anchor, and quiet posture through that contract rather than through detached success pages or generic appointment landings.

Booking confirmation receipts, calendar export, attendance summary, print view, and directions handoff must resolve through `ArtifactPresentationContract` plus the current `PatientArtifactFrame` backed by `ArtifactSurfaceFrame`. The primary presentation is the in-shell summary bound to the current appointment anchor. Download, print, calendar, and browser handoff remain secondary actions and must consume `OutboundNavigationGrant`. Unsupported embedded, frozen, or stale routes must degrade to summary or bounded recovery instead of detached artifact navigation.

### 4. Secure health record visualization

The records area should translate medical data into safe understanding without flattening clinical truth.

`/records` opens with a summary-first overview grouped into latest updates, test results, medicines and allergies, conditions and care plans, letters and documents, and action-needed follow-up.

Every result detail view must present information in this order:

1. what this test is
2. what the latest result says
3. what changed since last time
4. what the patient may need to do next
5. when to get urgent help
6. technical details

`PatientResultInsightProjection` must include a patient-safe title, plain-language summary, measured value, unit, reference range, specimen date, comparison against prior result when available, abnormal or borderline explanation in words, source metadata, and related actions such as message, follow-up, or book.

Charts are optional. One `VisualizationFallbackContract`, one `VisualizationTableContract`, and one current `VisualizationParityProjection` are required, and users must be able to switch to a table-first view without losing context, current selection, units, filter context, or freshness posture.

Sensitive or delayed-release results must still show that the record exists, why detail is not yet visible, when or how access becomes available, and the safest next action. Letters and documents should prefer structured in-browser summaries, with file download as a secondary action.

Result summaries, letter views, document previews, downloads, print flows, and browser handoff must resolve through `ArtifactPresentationContract` plus the current `PatientArtifactFrame` backed by `ArtifactSurfaceFrame`, one current `ArtifactParityDigest`, and one current `RecordArtifactParityWitness`. Leaving the shell or embedded context requires `OutboundNavigationGrant` bound to the current route family, session lineage, and safe return contract. If release, visibility, step-up, record-parity, or channel posture no longer supports handoff, the patient stays in the same record shell with verified summary, provisional summary, source-only summary, placeholder, or bounded recovery rather than falling into a raw file exit.

Record overview and detail routes must never silently omit delayed-release, step-up-required, wrong-patient-held, or audience-restricted items. Instead, they must render a governed placeholder tied to `releaseState`, `visibilityTier`, and `summarySafetyTier`, and they must keep the current record anchor intact while the patient steps up, waits for release, or enters recovery. If a result or document can only contribute urgency and not full detail, the portal may surface urgency plus next-step explanation, but it may not synthesize a body preview beyond the granted summary tier.

If a result trend, comparison chart, or structured record visual cannot keep parity with the current summary, table, selection, release, or freshness tuple, the portal must degrade in place to `table_only`, `summary_only`, or governed placeholder posture. A chart may not remain the dominant meaning surface once `VisualizationParityProjection.parityState != visual_and_table`.

Any record-origin follow-up action into booking, messaging, callback, request-detail repair, or artifact recovery must mint one `RecordActionContextToken`, one `RecordOriginContinuationEnvelope`, preserve the current `PatientNavReturnContract`, and issue a `RecoveryContinuationToken` before leaving the record shell. If release state, visibility envelope, step-up checkpoint, session lineage, or the linked continuation envelope drifts before the child route settles, the portal must keep the result or document anchor visible and resume through bounded in-shell recovery rather than opening the target route as if the old record context were still valid.

Record overview, detail, and child-route recovery must also validate `PatientPortalContinuityEvidenceBundle.recordContinuityEvidenceRef`. If the current continuity evidence no longer points at the active anchor, continuation envelope, continuation token, or release gate, the result or document anchor stays open in the same shell and the follow-up CTA freezes until record-continuation posture is re-proven.

### 5. Direct communication with providers

The message center should feel like one calm correspondence system.

`/messages` groups `PatientConversationCluster` summaries by care episode or governing request and surfaces unread, `reply needed`, `awaiting review`, callback-window risk, and `closed` states before the full cluster shell is opened.

Inside a conversation cluster:

- show one pinned `next action` area
- keep only the active composer or the most recent history cluster expanded in essential mode
- preserve callback expectations, clinician replies, and instruction acknowledgements in the same conversation grammar
- preserve reminder notices, reminder delivery failure, and callback fallback in that same conversation grammar instead of detaching them into appointment-only banners
- keep `/messages/:clusterId/thread/:threadId`, `/messages/:clusterId/callback/:callbackCaseId`, and `/messages/:clusterId/repair` inside the same cluster shell with one shared selected anchor and bounded return path
- show local acknowledgement, transport acceptance, delivery evidence, callback-window truth, and authoritative reply or callback receipts in-shell instead of toast-only confirmation
- keep urgent diversion guidance visible whenever asynchronous messaging is not appropriate for the concern being described

Conversation summaries, callback cards, and thread previews must be governed by `PatientCommunicationVisibilityProjection`, `PatientConversationPreviewDigest`, and `PatientCallbackStatusProjection`. Previews may only render content at or below the current audience tier and step-up posture; otherwise the patient sees a placeholder, reason, and safe continuation route. Delivery failures, bounced reminders, unreachable contact paths, and provider-channel disputes must remain visible in the active cluster shell and in list summaries until repaired.

If the patient cannot safely reply, await a callback, or continue because identity repair, consent renewal, or contact-route repair is outstanding, the dominant in-shell action must become that repair path. The portal must not present a live composer, callback response, or success reassurance while the dependency remains unresolved. Contact-route repair must stay inside the same shell through the current `ContactRouteRepairJourney`, keeping the blocked action summary and selected anchor visible until verification and dependency rebind complete.

`/messages` list state and cluster-level actionability must derive from `ConversationThreadProjection`, `ConversationSubthreadProjection`, `CommunicationEnvelope`, `PatientConversationPreviewDigest`, `PatientComposerLease`, `PatientReceiptEnvelope`, `PatientCallbackStatusProjection`, any active `NetworkReminderPlan`, and the latest `ConversationCommandSettlement`, not from local draft or toast state. A local acknowledgement or transport acceptance may appear immediately, but `reply needed`, `awaiting review`, callback-window reassurance, reminder reassurance, `reviewed`, `settled`, and recovery copy may advance only from the authoritative receipt, delivery-evidence, callback-expectation, reminder-plan, and settlement chain. If repair, review, reminder failure, or stale-route recovery is active, the same cluster stays open with the selected anchor and bounded return path instead of collapsing back to a quiet success summary.

The message list row, thread masthead, callback card, reminder notice, and active composer must also read the same `PatientCommunicationVisibilityProjection`, `threadId`, `threadTupleHash`, `receiptGrammarVersionRef`, and `monotoneRevision`. If preview content is governed above the current audience tier, the portal must keep the cluster visible as a governed placeholder instead of hiding it. If receipt, settlement, callback, reminder, visibility, or continuity evidence revisions drift, the shell must freeze send and quiet-success posture, preserve the current anchor and draft, and recover in place rather than reopening a generic inbox or a fresh composer.

The message center must also consume `PatientPortalContinuityEvidenceBundle.conversationContinuityEvidenceRef`. If that evidence is stale, blocked, or degraded below the cluster's required trust posture, the list and cluster shell may still show the current anchor and receipt history, but they must not present fresh send, callback-response, quiet-success, or `reviewed` posture until continuity evidence is refreshed.

### 6. Security, privacy, and trust presentation

- show source system and last update time on records and appointments
- explain step-up requests before triggering them
- preserve non-sensitive shell context during re-authentication
- suppress PHI in notification previews, recovery routes, and expired-link surfaces
- keep audit-heavy details behind secondary disclosure unless they change the next action
- never mix patients, households, or proxies in one visible shell without an explicit subject switch and renewed context statement

Embedded NHS App entry must inherit the hardened Phase 7 controls. Portal routes shown inside the NHS App must be pinned to an approved `manifestVersion`, validated against trusted `ChannelContext` evidence, and checked against the route's `minimumBridgeCapabilitiesRef` through one current `PatientEmbeddedNavEligibility` before embedded-only actions are offered.

Embedded routes must also validate the current `sessionEpochRef`, `subjectBindingVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState`, and negotiated `BridgeCapabilityMatrix` before mutating controls, downloads, native back, or embedded-only navigation become available. Session drift, subject switch, frozen rollout, release-tuple conflict, or bridge-capability drift must leave the patient inside the same shell with explicit recovery guidance rather than silently reopening a stale route.

Embedded entry and recovery must also validate the relevant `PatientPortalContinuityEvidenceBundle.embeddedContinuityEvidenceRefs[]`. If embedded continuity proof for the route family is stale, blocked, or missing under the active manifest tuple, the portal must degrade in place to supported browser or read-only recovery instead of exposing a bridge-backed CTA whose embedded continuity can no longer be proved.

If embedded trust, manifest entitlement, runtime bridge capability, or channel rollout state is insufficient, the same patient shell must downgrade safely to a supported browser or read-only posture using governed placeholders and explicit next-step guidance. It must not expose a route variant, file action, or deep link that the approved embedded contract cannot support.

### 7. Validation and release gate

The redesign is not ready until all of the following are true:

- keyboard-only users can complete booking, review a result, and reply to a message
- screen-reader users receive equivalent orientation, change, and action cues across all three journeys
- 200% zoom, narrow mobile width, and reduced-motion modes preserve full task completion
- abnormal, delayed, or gated results remain understandable without color, hover, or chart literacy
- no patient journey requires raw medical codes to understand the next action
- booking, records, and messages preserve shell continuity through sign-in recovery, stale-link recovery, and asynchronous updates
- NHS App embedded mode preserves the same portal IA and task outcomes as the normal browser experience
- blocker states such as contact-route repair, consent renewal, and delivery dispute become the dominant CTA when they gate the current patient task
- partial-visibility routes render governed placeholders rather than leaking PHI or silently removing clinically relevant items
- embedded release profiles prove route-manifest parity, trusted context resolution, and bridge-capability fallback for every NHS App-enabled task
- embedded task routes fail closed on session-epoch, subject-binding, release-tuple, or channel-freeze drift without losing shell continuity or surfacing stale CTAs
- portal validation proves `PatientPortalContinuityEvidenceBundle` parity for navigation, booking manage, record follow-up, conversation settlement, and embedded continuity-sensitive routes before release
- section-entry `loading`, `empty`, `partial`, and `recovery_required` states remain calm, explicit, and same-shell across `Home`, `Requests`, `Appointments`, `Health record`, and `Messages`
- portal entry from sign-in, notification, secure link, and NHS App embedded return always lands on a visible `PatientSectionHeaderFrame` with identity, trust cue, and next safe action before detailed content loads
- home renders exactly one spotlight and no more than four compact secondary cards, each with one localized trust cue and one CTA at most
- requests list rows show awaiting party, last meaningful update, and downstream lineage without requiring the patient to open detail first
- appointment receipts, calendar exports, record documents, print flows, and browser handoff prove `ArtifactPresentationContract` plus `OutboundNavigationGrant` parity before release
- failed submit in booking, messaging, and account-repair flows exposes `FormErrorSummaryContract` with field-linked repair guidance and preserved answers
- patient timeout or step-up expiry proves `TimeoutRecoveryContract` by preserving context, draft state, and one clear recovery CTA in the same shell
- result trends, slot selectors, and record summaries prove `VisualizationFallbackContract`, `VisualizationTableContract`, and `VisualizationParityProjection` with summary text, accessible table parity, explicit units, current selection, filter context where applicable, and non-colour selection cues

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `patient-account-and-communications-blueprint.md`
- `callback-and-clinician-messaging-loop.md`
- `phase-4-the-booking-engine.md`
- `accessibility-and-content-system-contract.md`
- `ux-quiet-clarity-redesign.md`

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://service-manual.nhs.uk/accessibility "NHS digital service manual accessibility guidance"
[3]: https://service-manual.nhs.uk/accessibility/content "NHS digital service manual content accessibility guidance"
[4]: https://service-manual.nhs.uk/content/pdfs-and-other-non-html-documents "NHS guidance on PDFs and other non-HTML documents"
[5]: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ "NHS App web integration guidance"
