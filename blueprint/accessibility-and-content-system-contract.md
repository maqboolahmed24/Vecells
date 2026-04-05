# Accessibility and content system contract

## Purpose

This document is the cross-shell source of truth for accessibility semantics, keyboard behavior, focus management, screen-reader announcements, timeout recovery, chart fallbacks, and calm content design across Vecells.

It complements `platform-frontend-blueprint.md`, `uiux-skill.md`, `patient-portal-experience-architecture-blueprint.md`, `staff-workspace-interface-architecture.md`, `operations-console-frontend-blueprint.md`, `pharmacy-console-frontend-architecture.md`, `governance-admin-console-frontend-blueprint.md`, and `phase-7-inside-the-nhs-app.md`. If a local component or workflow contract conflicts with this document, the stricter accessibility rule wins.

## Control priorities

Close these cross-cutting defects before treating any new shell, component, or route as production-ready:

1. accessibility intent exists, but the platform still lacks one typed semantic layer for landmarks, headings, live announcements, and focus recovery
2. form guidance, field errors, timeout states, and session-expiry recovery are not yet governed by one explicit repair grammar
3. charts, heat maps, and forecast visuals must resolve through one reusable parity contract for summary text, table fallback, selection, filters, units, freshness, and keyboard behavior
4. assistive-only text is implied rather than governed, which risks hidden meaning diverging from visible meaning
5. calmness and low-noise posture are strong visually, but the accessibility tree still needs the same discipline around announcement budgeting, duplicate chrome suppression, freshness or trust messaging, and replay-safe emission order
6. route families still declare individual accessibility primitives, but not yet one coverage profile proving those primitives stay aligned with kernel state semantics, automation anchors, responsive folds, reduced motion, and live-update buffering

## Canonical accessibility and content objects

**AccessibleSurfaceContract**  
`accessibleSurfaceContractId`, `surfaceRef`, `landmarkRole = banner | navigation | main | region | complementary | contentinfo | search | form`, `headingRef`, `accessibleNameRef`, `stateSummaryRef`, `dominantActionRef`, `describedByRefs[]`, `readingOrderRef`, `chromeSuppressionRef`, `freshnessAccessibilityContractRef`, `renderedAt`

`AccessibleSurfaceContract` binds a visible surface to the accessibility tree. Every patient, staff, operations, governance, pharmacy, and embedded shell must expose one stable landmark or labeled region, one stable heading, one concise state summary, and one dominant-action relationship before secondary chrome or instrumentation is encountered.

**KeyboardInteractionContract**  
`keyboardInteractionContractId`, `surfaceRef`, `navigationModel = tab_ring | roving_tabindex | grid | treegrid | toolbar | tabs | listbox`, `entryRef`, `selectionModel = selection_independent | selection_follows_focus | explicit_commit`, `shortcutScopeRef`, `shortcutDisclosureRef`, `escapeBehaviorRef`, `restoreTargetRef`, `selectedAnchorRef`, `declaredAt`

`KeyboardInteractionContract` declares how a surface is entered, traversed, dismissed, and restored. Surfaces may not invent bespoke key behavior without naming the model here.

**FocusTransitionContract**  
`focusTransitionContractId`, `surfaceRef`, `trigger = open | close | inline_expand | same_shell_refresh | invalidation | timeout_warning | timeout_expired | settlement | restore | browser_return`, `fromTargetRef`, `toTargetRef`, `fallbackTargetRef`, `selectedAnchorRef`, `scrollPolicy = preserve | reveal_without_jump | top_reset_forbidden`, `announcementRef`, `focusReasonRef`, `transitionState`

`FocusTransitionContract` prevents focus theft and unexplained jumps. When truth changes or UI topology morphs inside the same shell, focus must either remain where it is or move according to one explicit contract.

**AssistiveAnnouncementContract**  
`assistiveAnnouncementContractId`, `surfaceRef`, `channel = polite | assertive | off`, `announcementClass = surface_summary | local_acknowledgement | routine_status | authoritative_settlement | blocker | recovery | form_error_summary | timeout_warning | timeout_expired | freshness_actionability`, `sourceSettlementClass = none | local_acknowledgement | processing_acceptance | external_observation | authoritative_outcome`, `messageRef`, `sourceStateRef`, `selectedAnchorRef`, `dominantActionRef`, `statusAcknowledgementScopeRef`, `emissionCheckpointRef`, `governingTupleHash`, `batchWindowMs`, `dedupeWindowMs`, `focusImpact = none | advisory | required`, `escalationRuleRef`, `publishedAt`

`AssistiveAnnouncementContract` controls live-region use so screen readers hear meaningful state changes without toast spam or duplicated shell narration. It is the emitted announcement contract only; local cues must first resolve through one typed arbitration layer.

**AssistiveAnnouncementIntent**  
`assistiveAnnouncementIntentId`, `surfaceRef`, `continuityFrameRef`, `announcementClass = surface_summary | local_acknowledgement | routine_status | authoritative_settlement | blocker | recovery | form_error_summary | timeout_warning | timeout_expired | freshness_actionability`, `announcementPriority = silent | polite | assertive`, `messageRef`, `messageHash`, `sourceSettlementClass = none | local_acknowledgement | processing_acceptance | external_observation | authoritative_outcome`, `selectedAnchorRef`, `dominantActionRef`, `focusTransitionRef`, `freshnessAccessibilityContractRef`, `statusAcknowledgementScopeRef`, `emissionCheckpointRef`, `governingTupleHash`, `intentState = proposed | coalesced | emitted | suppressed | invalidated`, `createdAt`

`AssistiveAnnouncementIntent` is the typed candidate cue generated from one surface summary, local acknowledgement, buffered batch digest, form error summary, timeout posture, freshness actionability change, blocker, recovery, or authoritative settlement. Components may propose intents, but they may not publish speech directly.

**AssistiveAnnouncementTruthProjection**  
`assistiveAnnouncementTruthProjectionId`, `surfaceRef`, `continuityFrameRef`, `activeIntentRef`, `coalescedIntentRefs[]`, `lowestEventSequence`, `highestEventSequence`, `announcementTupleHash`, `deliveryDisposition = emit | suppress | deduplicate | replay_current_state | invalidate`, `publishedChannel = off | polite | assertive`, `publishedMessageRef`, `focusImpact = none | advisory | required`, `projectionState = collecting | sealed | emitted | superseded`, `publishedAt`

`AssistiveAnnouncementTruthProjection` is the only authority allowed to turn candidate intents into one calm audible stream for the active surface. It binds batching, dedupe, urgency, acknowledgement scope, focus posture, freshness truth, and event ordering to the same continuity frame so restore and replay cannot sound like fresh user activity.

**FieldAccessibilityContract**  
`fieldAccessibilityContractId`, `fieldRef`, `labelRef`, `hintRef`, `exampleRef`, `autocompleteToken`, `inputMode`, `requiredState`, `validationState = untouched | incomplete | valid | invalid | warning`, `errorRef`, `describedByOrderRef`, `redundantEntrySourceRef`, `assistiveTextPolicyRef`

`FieldAccessibilityContract` is the typed label-hint-example-error envelope for any input, upload, picker, or reply composer. It ensures the same field remains understandable through entry, validation, save failure, and recovery.

**FormErrorSummaryContract**  
`formErrorSummaryContractId`, `formRef`, `headlineRef`, `summaryRef`, `errorCount`, `errorItemRefs[]`, `firstInvalidFieldRef`, `submissionState = idle | blocked | retryable | sent`, `announcementMode = polite | assertive`, `recoveryActionRef`, `renderedAt`

`FormErrorSummaryContract` is the only allowed top-of-form error summary. It must link to invalid fields, describe what must be fixed in text, and preserve the user’s entered values.

**TimeoutRecoveryContract**  
`timeoutRecoveryContractId`, `surfaceRef`, `timeoutClass = inactivity | auth_expiry | link_expiry | lease_expiry | stale_settlement | retry_backoff`, `warningAt`, `expiresAt`, `timeRemainingRef`, `preservedContextRefs[]`, `draftPreservationRef`, `primaryRecoveryActionRef`, `secondaryHelpActionRef`, `returnContractRef`, `announcementModeRef`, `postExpiryState = recovery_required | read_only`

`TimeoutRecoveryContract` governs countdown warnings, expired sessions, stale leases, and dead links. It prevents raw token errors, silent data loss, and unexplained ejection to sign-in or home.

**VisualizationFallbackContract**  
`visualizationFallbackContractId`, `surfaceRef`, `visualizationRef`, `summarySentenceRef`, `summaryStateRef`, `tableRef`, `tableContractRef`, `downloadRef`, `nonColorCueRefs[]`, `unitLabelRef`, `currentSelectionRef`, `filterContextRef`, `sortStateRef`, `comparisonMode = none | primary_vs_prior | ranked | matrix | time_series`, `keyboardModelRef`, `emptyVisualizationContractRef`, `surfaceStateContractRef`, `freshnessAccessibilityContractRef`, `parityTupleHash`, `parityState = visual_and_table | table_only | summary_only | placeholder_only | blocked`

`VisualizationFallbackContract` is the chart and heat-surface parity contract. Every visualization must declare what the user should understand in text, where the equivalent table lives, how current selection, filters, sort state, units, and freshness are announced, and when the visual must degrade to table-first, summary-only, or placeholder posture.

**VisualizationTableContract**  
`visualizationTableContractId`, `surfaceRef`, `tableRef`, `rowIdentityRefs[]`, `columnSchemaRef`, `sortStateRef`, `filterContextRef`, `unitLabelRefs[]`, `selectionModelRef`, `currentSelectionRef`, `emptyStateContractRef`, `renderedAt`

`VisualizationTableContract` is the authoritative tabular grammar for a visualization surface. The table is not a convenience export; it is the parity-safe primary fallback that must preserve stable headers, row identity, units, current filters, sort state, and selection semantics.

**VisualizationParityProjection**  
`visualizationParityProjectionId`, `surfaceRef`, `visualizationFallbackContractRef`, `visualizationTableContractRef`, `summarySentenceRef`, `selectionSummaryRef`, `filterSummaryRef`, `trustSummaryRef`, `lastStableTableRef`, `parityTupleHash`, `parityState = visual_and_table | table_only | summary_only | placeholder_only | blocked`, `generatedAt`

`VisualizationParityProjection` is the single truth projection for what the visualization means right now. Visual, summary, and table views must derive from the same parity tuple so a chart, matrix, heat map, or sparkline never carries extra meaning that the summary sentence or table fallback cannot reproduce.

**AssistiveTextPolicy**  
`assistiveTextPolicyId`, `audienceTier`, `tone = calm | directive | clinical | operational`, `readingAgeBand`, `firstUseExplanationPolicy`, `abbreviationPolicy`, `numeracyPolicy`, `ctaPolicy = one_primary`, `emptyStateFormulaRef`, `errorStateFormulaRef`, `translationFallbackRef`, `reviewCadenceRef`

`AssistiveTextPolicy` keeps visible copy, helper text, and screen-reader-only text aligned. Assistive-only text may clarify purpose, units, or consequences, but it may not introduce decision-critical meaning absent from the visual UI.

**FreshnessAccessibilityContract**  
`freshnessAccessibilityContractId`, `surfaceRef`, `freshnessChipRef`, `freshnessEnvelopeRef`, `trustState = fresh | stale | degraded | blocked | unknown`, `transportState = live | reconnecting | disconnected | paused`, `lastKnownGoodAt`, `assistiveSummaryRef`, `actionabilityState = live | bounded | read_only | recovery_required`, `nextSafeActionRef`, `announcementModeRef`, `publishedAt`

`FreshnessAccessibilityContract` prevents stale, degraded, or blocked truth from being announced as ordinary readiness. Every surface that can freeze, degrade, or become read-only must express the same posture visually and semantically, and it must derive that posture from the current `ProjectionFreshnessEnvelope` rather than from transport health alone.

**AccessibilitySemanticCoverageProfile**
`accessibilitySemanticCoverageProfileId`, `routeFamilyRef`, `shellType`, `audienceTier`, `semanticSurfaceRefs[]`, `accessibleSurfaceContractRefs[]`, `keyboardInteractionContractRefs[]`, `focusTransitionContractRefs[]`, `assistiveAnnouncementContractRefs[]`, `freshnessAccessibilityContractRefs[]`, `assistiveTextPolicyRef`, `fieldAccessibilityContractRefs[]`, `formErrorSummaryContractRefs[]`, `timeoutRecoveryContractRefs[]`, `visualizationFallbackContractRefs[]`, `visualizationTableContractRefs[]`, `visualizationParityProjectionRefs[]`, `automationAnchorProfileRef`, `automationAnchorMapRef`, `surfaceStateSemanticsProfileRefs[]`, `designContractPublicationBundleRef`, `requiredBreakpointClassRefs[]`, `missionStackCoverageRef`, `hostResizeCoverageRef`, `embeddedSafeAreaCoverageRef`, `reducedMotionEquivalenceRef`, `bufferedUpdateCoverageRefs[]`, `coverageTupleHash`, `coverageState = complete | degraded | blocked`, `verifiedAt`

`AccessibilitySemanticCoverageProfile` is the route-family proof that visible state, accessibility semantics, and automation markers still agree under the current design-contract bundle. It binds landmarks, headings, keyboard models, focus transitions, assistive announcements, freshness posture, repair grammar, visualization parity, assistive text, and route-family automation anchors to the same kernel vocabulary, breakpoint coverage, reduced-motion equivalence, and buffered-update posture. If this profile is degraded or blocked, the route must fail closed into the last safe summary, list-first, table-first, placeholder, or recovery-first posture rather than exposing semantically partial interactivity.

## Route-family semantic coverage

1. Every route family must publish exactly one `AccessibilitySemanticCoverageProfile` for the active audience, shell, and channel posture.
2. `AccessibilitySemanticCoverageProfile.coverageState = complete` is required before a route may render calm, writable, verified, or visual-dominant posture. `degraded` or `blocked` coverage requires same-shell downgrade to summary-first, table-first, list-first, placeholder, or recovery posture.
3. `AccessibilitySemanticCoverageProfile` must bind `AutomationAnchorProfile`, `AutomationAnchorMap`, `SurfaceStateSemanticsProfile`, and the current `DesignContractPublicationBundle` to the same `coverageTupleHash`; accessibility trees, DOM markers, emitted telemetry, and visible state may not drift independently.
4. Coverage must explicitly include `compact`, `narrow`, `medium`, `expanded`, and `wide`, `mission_stack` fold and unfold where applicable, `400%` zoom, host resize, safe-area changes, reduced motion, and buffered live-update, replay, or restore posture. Uncovered modes are blocked modes, not best-effort variants.
5. Every stale, degraded, blocked, pending, placeholder, read-only, and recovery surface must remain semantically equivalent to the visible posture from the same `FreshnessAccessibilityContract` and `SurfaceStateSemanticsProfile`.
6. Chart, matrix, heat-surface, and comparison-heavy routes may remain visual-first only while `VisualizationParityProjection.parityState = visual_and_table` under the current accessibility coverage tuple.
7. Assistive-only text, state summaries, dominant-action labels, and automation markers must resolve from the same kernel vocabulary without widening PHI disclosure.
8. The active `AudienceSurfaceRouteContract`, `FrontendContractManifest`, and `AudienceSurfaceRuntimeBinding` must reference the same `AccessibilitySemanticCoverageProfile.coverageTupleHash`, `AutomationAnchorProfile`, and `SurfaceStateSemanticsProfile` set; accessibility coverage may not live only in component docs, local ARIA patches, or test harness configuration.
9. If route publication, manifest publication, or runtime binding drifts away from the current accessibility coverage tuple, the surface must downgrade in place to summary-first, table-first, list-first, placeholder, or recovery posture rather than staying calmly interactive on stale semantic coverage.

## Landmark, heading, and ARIA strategy

1. Native HTML comes first. Use semantic HTML elements and associated labels before adding ARIA roles, states, or properties.
2. ARIA may extend semantics only when native HTML cannot represent the component or state. ARIA must never override a native role or contradict the visible UI.
3. Every shell must expose one `main` region. Additional `navigation`, `search`, `form`, `complementary`, and `region` landmarks must have unique accessible names.
4. Heading levels must descend in order without skipping levels for styling convenience.
5. Hidden helper text is allowed only when it clarifies control purpose, units, state, or consequence. It may not contain clinically, operationally, or legally meaningful facts that sighted users cannot also discover.
6. Use `aria-current`, `aria-expanded`, `aria-selected`, `aria-controls`, `aria-describedby`, `aria-errormessage`, `aria-invalid`, and `aria-busy` only while the matching visible state is true and current.
7. `role = status` or a polite live region is the default for local save, progress, and settled summaries. `role = alert` or `alertdialog` is reserved for blockers, destructive confirmation, timeout expiry, or review-required interruptions.
8. Compound widgets such as tabs, grids, treegrids, toolbars, listboxes, and dialogs must follow one declared `KeyboardInteractionContract` and the corresponding authoring-practice pattern. Do not improvise hybrid semantics.

## Keyboard behavior and focus management

1. `Tab` and `Shift + Tab` move between components. Arrow keys move within a compound component only when `KeyboardInteractionContract.navigationModel` declares that behavior.
2. Queue rows, grid rows, and comparison cards must keep focus and selection distinct unless `selectionModel` explicitly says selection follows focus.
3. Hover-only disclosure is forbidden. Anything revealed on hover must also be reachable and dismissible by keyboard.
4. Same-shell refresh, background patching, and live resort may not move focus. If the active target becomes invalid, keep a preserved stub or move focus according to `FocusTransitionContract`; never jump to a sibling item silently.
5. Modal dialogs must move focus into the dialog on open, keep the tab sequence inside the dialog while it is modal, and return focus to the invoker or declared fallback target on close.
6. Non-modal drawers, side stages, and compare panels must not trap focus. They need a reachable heading, a clear close control, and a stable return target.
7. Sticky headers, bottom action bars, drawers, and embedded app chrome must not obscure the focused element. Reveal the target in view without resetting scroll to the document top.
8. Hotkeys are optional accelerators, not exclusive controls. Every hotkey must have a standard control alternative and a discoverable disclosure path inside the current surface.
9. Focus indicators must remain visible at 200% zoom, reflow, and narrow widths. Decorative overlays, box-shadows, or scroll masks may not erase them.

## Screen-reader announcements and state messaging

1. Each primary surface must announce in this order: heading, current state summary, current actionability, and dominant action. Duplicate shell chrome should be suppressed through `AccessibleSurfaceContract.chromeSuppressionRef`.
2. `AssistiveAnnouncementContract.batchWindowMs` must batch routine updates before they are announced. Identical messages inside `dedupeWindowMs` must be suppressed.
3. Polite announcements are for save state, progress, refresh completion, non-blocking freshness updates, and calm settlement messages.
4. Assertive announcements are for blocking validation, timeout expiry, destructive confirmation, critical safety blockers, and review-required invalidation.
5. Local acknowledgement, transport acceptance, and authoritative settlement must not all announce with equal urgency. The wording must distinguish them.
6. Success or failure toasts may visually appear, but the authoritative explanation must remain in the owning surface, receipt, or error summary so assistive technology users do not depend on toast timing.
7. Every emitted live-region message must resolve through `AssistiveAnnouncementTruthProjection`; local components, charts, and toast systems may propose intents, but they may not publish independently.
8. Dedupe is legal only when `announcementClass`, `sourceSettlementClass`, `governingTupleHash`, `selectedAnchorRef`, `dominantActionRef`, `focusTransitionRef`, and the governing `UIEventEmissionCheckpoint` sequence window still match. Shared text alone is not sufficient.
9. On restore, reconnect, queue flush, or replay, emit at most one current-state summary for the active surface and restore epoch. Historical acknowledgements, buffered patches, and old settled messages may not replay as fresh activity.
10. Focus and announcement must agree. If `FocusTransitionContract` moves the user, the surviving announcement must describe the same target or recovery action. If focus remains anchored, repeated heading or shell-chrome narration must be suppressed.
11. `FormErrorSummaryContract` may emit one assertive blocked-submit summary per submission epoch. Subsequent field repair cues must be polite or silent until a new submit attempt occurs.
12. `TimeoutRecoveryContract` warnings may announce only at meaningful thresholds or posture changes. Per-second countdown narration is forbidden.
13. `FreshnessAccessibilityContract` announcements must describe changed trust or actionability, not transport chatter. Autosave, trivial refresh, and low-risk list churn stay silent unless the next safe action, dominant action, or selected anchor changed.

## Forms, validation, and error communication

1. Every field, picker, upload control, and reply composer must implement `FieldAccessibilityContract`.
2. `FieldAccessibilityContract.describedByOrderRef` must keep support text in this order: hint, format example, then error. The order may not reshuffle between idle, invalid, and recovery states.
3. Labels are mandatory. Placeholder text may support an example, but it may not replace the label.
4. Use plain-language repair text that tells the user what is wrong, how to fix it, and any consequence that matters now.
5. Inline validation may be polite and local when it is actionable, but it must not fire on every keystroke in a way that causes repeated announcements or cognitive pressure.
6. On blocked submit, move focus to `FormErrorSummaryContract`, preserve the entered values, and provide links or references back to each invalid field.
7. Set `aria-invalid` and `aria-errormessage` only when the field is actually invalid and the repair text is present.
8. Warning states must remain distinct from error states. Warnings may advise caution, but they may not prevent submission unless the visible state and dominant action also change.
9. Redundant entry is forbidden when the platform already knows the answer and can safely reuse it. If confirmation is legally or clinically required, explain why the repeat is needed.

## Timeout, freshness, and same-shell recovery

1. Any expiring session, step-up checkpoint, command fence, or signed link must warn before it expires and must state what will be preserved.
2. On expiry, keep the current shell, selected anchor, last safe summary, and any preserved draft visible whenever policy allows. Do not replace the surface with a raw auth, token, or network error.
3. Long-running pending states may not spin forever. When the governing settlement window expires, transition to `recovery_required` or bounded read-only posture with explicit next steps.
4. `FreshnessAccessibilityContract` must announce both trust state and actionability. `stale`, `degraded`, and `blocked` are not cosmetic chip changes, and `transportState = live` is not enough to announce readiness.
5. Browser return, reconnect, and restore flows must resolve through `FocusTransitionContract` so the user returns to the prior anchor, preserved composer, or dominant recovery action rather than the document top.

## Charts, tables, color independence, and empty states

1. Every chart, heat map, sparkline, or trend surface must implement `VisualizationFallbackContract`.
2. Every chart, heat map, sparkline, or trend surface must also publish one `VisualizationTableContract` plus one current `VisualizationParityProjection`; the visual, summary, and table views must agree on row set, column meaning, units, current filters, sort state, selection, and freshness.
3. The summary sentence must explain the point of the visualization before the user reaches the table or control cluster, and it must derive from the same `VisualizationParityProjection` as the visual and tabular views.
4. The fallback table must use proper row and column headers, sort state, units, and current filter context. Download-only parity is forbidden when the user is expected to understand the current state in shell.
5. Color may support scanning, but not encode severity, selection, success, or comparison alone. Use labels, icons, patterns, position, or text to preserve meaning without color.
6. Hover, tooltip, or cell-intensity detail may not carry unique meaning. If a point, bar, band, heat cell, or matrix row can be selected visually, the same selection must exist through keyboard and table semantics with one shared summary.
7. Dense data tables and grids must expose stable headers, current position cues, and readable numeric alignment. If a surface is visually card-based but semantically tabular, it still needs a true tabular or list equivalent.
8. Empty, stale, masked, partially visible, or blocked charts are not neutral placeholders. They must resolve through the owning `EmptyStateContract`, `SurfaceStateContract`, and `FreshnessAccessibilityContract`, explain why the visual is degraded, what usually appears here, and the safest next action, and downgrade to `table_only`, `summary_only`, or `placeholder_only` when parity cannot be proven.
9. Narrow-layout, keyboard-first, reduced-trust, or reduced-motion use may make the table or ranked list the dominant view. The visual may remain available, but it may not remain the only place where trend direction, comparison, severity, confidence, or current selection can be understood.

## Content clarity and calm-task completion

1. `AssistiveTextPolicy(audienceTier = patient_public | patient_authenticated)` should target a reading age of roughly 9 to 11 where the topic allows. If medical language is necessary, explain it on first use.
2. `AssistiveTextPolicy(audienceTier = staff | pharmacy | operations | governance)` may be denser, but action labels must still be verb-led, object-specific, and consequence-aware.
3. Titles answer where the user is. State summaries answer whether they can act. Action labels answer what will happen.
4. Empty-state copy follows one formula: why nothing is shown now, what usually appears here, and the safest next step.
5. Error copy follows one formula: what happened, what it means for the current task, and how to recover.
6. Only one dominant CTA is allowed per active surface state unless a higher-priority blocker legally preempts it.
7. Help entry points must stay in a consistent location for a given shell family.
8. Do not hide critical instructions behind `Learn more`, tooltip-only help, or hover-revealed copy.

## Token and verification rules

Introduce these cross-platform minimums:

- `minFocusRingWidthPx = 2`
- `minFocusRingOffsetPx = 2`
- `minInteractiveTargetPx = 24`
- `minCriticalActionTargetPx = 44`
- `patientReadingMeasureCh = 45..75`
- `professionalReadingMeasureCh = 60..90`
- `announcementBatchWindowMs = 800`
- `announcementDedupeWindowMs = 5000`

A route or component is not release-ready until verification proves all of the following:

- keyboard-only completion for the dominant task path
- focus is never obscured or silently reset during shell morph, refresh, timeout warning, or recovery
- live announcements are meaningful, deduplicated, and severity-correct
- restore, reconnect, batch-flush, and replay paths emit at most one current-state summary per active surface and never replay stale acknowledgements as fresh activity
- local acknowledgement, processing acceptance, authoritative settlement, blocker, and recovery announcements remain distinct in wording and urgency
- form errors preserve user input, expose repair text, and return focus predictably
- timeout warnings and blocked-submit summaries deduplicate cleanly across repeated ticks, retries, and keystrokes
- session or lease expiry preserves context and offers a same-shell recovery path
- every chart or heat surface has a summary sentence plus accessible table parity
- chart, matrix, and heat-surface tests prove `VisualizationParityProjection` parity across summary sentence, table fallback, current selection, filter context, sort state, and units
- empty, stale, masked, blocked, and partially visible visualization states degrade to `table_only`, `summary_only`, or placeholder posture without leaving extra meaning in color, hover, or shape alone
- stale, degraded, blocked, and read-only truth are semantically exposed as such
- route-family semantic coverage proves `AccessibilitySemanticCoverageProfile.coverageState = complete` across keyboard-only use, reduced motion, `mission_stack`, host resize, safe-area shifts, `400%` zoom, and buffered live-update or replay posture
- assistive-only text never introduces material meaning that the visible UI omits
