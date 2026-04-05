# Canonical UI contract kernel

## Purpose

This document closes the remaining cross-surface gaps that were still too implicit in `platform-frontend-blueprint.md`, `phase-0-the-foundation-protocol.md`, and the shell specializations. It is the single product-wide binding layer for visual token math, responsive layout metrics, semantic color roles, state-priority resolution, artifact-mode behavior, accessibility floors, telemetry bindings, and automation anchors.

Raw visual primitives still originate in `design-token-foundation.md`. Shell reuse, continuity, state primitives, and artifact lifecycle rules still originate in `platform-frontend-blueprint.md` and Phase 0. This kernel binds those sources into one shared surface grammar so route families cannot reinterpret the same token, state, or marker differently.

Route families may specialize workflow logic, information density, and shell topology, but they may not fork the token lattice, breakpoint classes, state-precedence equation, or DOM-state vocabulary defined here.
Any newly visible state must enter this kernel before it reaches rendering, accessibility, automation, telemetry, or artifact posture.

## Canonical contracts

**VisualTokenProfile**
`visualTokenProfileId`, `shellType`, `routeFamilyRef`, `designTokenFoundationRef`, `designTokenExportArtifactRef`, `tokenKernelLayeringPolicyRef`, `profileSelectionResolutionRef`, `shellVisualProfileRef`, `breakpointClass`, `densityProfileRef`, `spaceScaleRef`, `sizeScaleRef`, `typeScaleRef`, `radiusScaleRef`, `semanticColorProfileRef`, `topologyMetricRef`, `motionProfileRef`, `profileDigestRef`, `effectiveAt`

`VisualTokenProfile` binds one shell or route family to the canonical token lattice. It resolves through `DesignTokenFoundation`, the current `TokenKernelLayeringPolicy`, one published `ProfileSelectionResolution`, and any active `ShellVisualProfile`; it may choose among kernel-approved density or topology options, but it may not redefine raw spacing, size, typography, radius, motion, breakpoint, or semantic-color meaning.

**SurfaceStateSemanticsProfile**
`surfaceStateSemanticsProfileId`, `surfaceRef`, `visualTokenProfileRef`, `surfacePostureFrameRef`, `surfaceStateFrameRef`, `artifactStageRef`, `statusOwnerRef`, `effectiveSeverity`, `effectiveDisplayState`, `effectiveTone`, `ariaLiveMode`, `motionIntentRef`, `designContractVocabularyTupleRef`, `telemetryBindingProfileRef`, `automationAnchorMapRef`, `surfaceStateKernelBindingRef`, `stateSemanticsDigestRef`, `resolvedAt`

`SurfaceStateSemanticsProfile` is the single cross-surface mapping from route truth to visible state. Every loading, empty, sparse, stale, degraded, recovery, blocked, settled, and artifact-mode posture must resolve through it before the shell can render, and that state meaning must propagate downstream only through the linked `SurfaceStateKernelBinding`.

**SurfaceStateKernelBinding**
`surfaceStateKernelBindingId`, `routeFamilyRef`, `surfaceRef`, `visualTokenProfileRef`, `surfaceStateSemanticsProfileRef`, `accessibilitySemanticCoverageProfileRef`, `automationAnchorMapRef`, `telemetryBindingProfileRef`, `artifactModePresentationProfileRef`, `designContractVocabularyTupleRef`, `bindingState = exact | stale | blocked`, `kernelPropagationDigestRef`, `resolvedAt`

`SurfaceStateKernelBinding` is the authoritative proof that visible state has entered the kernel and propagated consistently into accessibility, automation, telemetry, and artifact posture. A route family may not render a new tone, state badge, motion cue, DOM marker, aria summary, or emitted UI event unless the same binding proves that all of those meanings still agree.

**AutomationAnchorMap**
`automationAnchorMapId`, `surfaceRef`, `requiredDomMarkers[]`, `dominantActionMarkerRef`, `selectedAnchorMarkerRef`, `artifactMarkerRef`, `continuityMarkerRef`, `designContractVocabularyTupleRef`, `domMarkerSchemaRef`, `telemetryBindingProfileRef`, `anchorMapDigestRef`, `publishedAt`

`AutomationAnchorMap` is the authoritative DOM-state vocabulary for Playwright, support replay, and production diagnostics. It is the kernel-level map consumed by route-family `AutomationAnchorProfile`; local test ids may supplement it for repeated component instances, but they may not replace the stable surface markers required here.

**TelemetryBindingProfile**
`telemetryBindingProfileId`, `surfaceRef`, `requiredUiEventRefs[]`, `designContractVocabularyTupleRef`, `requiredDomMarkerSchemaRef`, `redactionProfileRef`, `bindingDigestRef`, `publishedAt`

`TelemetryBindingProfile` binds DOM markers and `UIEventEnvelope` fields to the same vocabulary. Analytics, operational telemetry, and automation must not invent parallel names for the same surface, state, anchor, artifact mode, or breakpoint class.

**ArtifactModePresentationProfile**
`artifactModePresentationProfileId`, `artifactSurfaceFrameRef`, `artifactStageRef`, `summaryPolicyRef`, `previewPolicyRef`, `printPolicyRef`, `downloadPolicyRef`, `exportPolicyRef`, `handoffPolicyRef`, `returnAnchorRef`, `designContractVocabularyTupleRef`, `presentationDigestRef`, `effectiveAt`

`ArtifactModePresentationProfile` is the single source of truth for summary-first artifact behavior, print readiness, export posture, and governed external handoff.

**DesignContractVocabularyTuple**
`designContractVocabularyTupleId`, `surfaceRef`, `stateClassVocabularyRef`, `stateReasonVocabularyRef`, `artifactModeVocabularyRef`, `breakpointVocabularyRef`, `selectedAnchorVocabularyRef`, `dominantActionVocabularyRef`, `automationMarkerVocabularyRef`, `telemetryEventVocabularyRef`, `tupleHash`, `publishedAt`

`DesignContractVocabularyTuple` is the shared vocabulary spine for DOM state, assistive narration, Playwright assertions, and telemetry. A surface may specialize workflow meaning, but it may not rename state classes, reasons, artifact modes, breakpoint classes, selected anchors, dominant actions, or emitted event keys outside this tuple.

**DesignContractPublicationBundle**
`designContractPublicationBundleId`, `audienceSurface`, `routeFamilyRefs[]`, `shellType`, `breakpointCoverageRefs[]`, `modeTupleCoverageRef`, `designTokenExportArtifactRef`, `tokenKernelLayeringPolicyRef`, `profileSelectionResolutionRefs[]`, `visualTokenProfileRefs[]`, `surfaceStateSemanticsProfileRefs[]`, `surfaceStateKernelBindingRefs[]`, `accessibilitySemanticCoverageProfileRefs[]`, `automationAnchorMapRefs[]`, `telemetryBindingProfileRefs[]`, `artifactModePresentationProfileRefs[]`, `designContractVocabularyTupleRefs[]`, `designContractDigestRef`, `structuralSnapshotRefs[]`, `lintVerdictRef`, `publicationState = published | stale | blocked | withdrawn`, `publishedAt`

`DesignContractPublicationBundle` is the canonical machine-readable product contract joining token export, profile selection, state semantics, state-kernel propagation, accessibility semantic coverage, automation anchors, telemetry bindings, and artifact presentation for one audience surface and route-family set. Route-local constants, CSS overrides, profile packs, marker aliases, analytics names, or route-local accessibility vocabularies are not authoritative once a bundle exists.

**DesignContractLintVerdict**
`designContractLintVerdictId`, `designContractPublicationBundleRef`, `tokenLatticeState = exact | drifted | blocked`, `profileLayeringState = exact | drifted | blocked`, `modeResolutionState = exact | drifted | blocked`, `surfaceSemanticsState = exact | drifted | blocked`, `kernelStatePropagationState = exact | drifted | blocked`, `accessibilitySemanticCoverageState = exact | drifted | blocked`, `automationTelemetryParityState = exact | drifted | blocked`, `artifactModeParityState = exact | drifted | blocked`, `surfaceRoleUsageState = exact | drifted | blocked`, `structuralSnapshotState = exact | stale | missing`, `result = pass | blocked`, `recordedAt`

`DesignContractLintVerdict` is the fail-closed release verdict for design-contract publication. Meaning-bearing token drift, profile-layer drift, missing mode coverage, stale kernel propagation, stale or missing accessibility semantic coverage, mismatched automation and telemetry vocabulary, stale state semantics, broken artifact posture, or missing structural evidence block publication rather than landing as advisory warnings.

## 1. Token lattice

This kernel adopts the mathematical base from `design-token-foundation.md`:

- atomic spatial quantum `q = 4px`
- structural grid quantum `g = 8px`

Every spacing, control dimension, radius, outline, icon box, and motion distance must resolve to those shared quanta. Fractional-pixel token systems and local one-off nudges are forbidden.

### 1.1 Spacing aliases

Canonical spacing aliases are bindings over the existing design-token ramp:

- `space-0 = 0`
- `space-1 = 4px`
- `space-2 = 8px`
- `space-3 = 12px`
- `space-4 = 16px`
- `space-6 = 24px`
- `space-8 = 32px`
- `space-10 = 40px`
- `space-12 = 48px`
- `space-16 = 64px`
- `space-20 = 80px`

Usage rules:

- icon-label, chip-cluster, and inline metadata gaps use `space-2` or `space-3`
- form-row and card-internal stacking gaps default to `space-4`
- section gaps inside a surface default to `space-6`
- shell-plane gaps must snap to the structural grid and usually use `space-4` on narrow shells, `space-6` on medium shells, and `space-8` or above on large or control-room shells
- dense expert regions may compress internal row rhythm to `space-3`, but shell chrome, decision docks, and shared status surfaces may not compress below `space-4`
- negative spacing and sub-token micro-adjustments are invalid

### 1.2 Size, radius, and outline bindings

Canonical size bindings:

- `control-staff-compact = 40px`
- `control-default = 44px`
- `control-public = 48px`
- `row-passive = 40px`
- `row-interactive = 44px`
- `icon-sm = 16px`
- `icon-md = 20px`
- `icon-lg = 24px`

Canonical radius bindings:

- `radius-sm = 4px`
- `radius-md = 8px`
- `radius-lg = 12px`
- `radius-xl = 16px`
- `radius-pill = 999px`

Canonical outline bindings:

- `stroke-subtle = 1px`
- `stroke-strong = 2px`
- `focus-ring-width = 2px`
- `focus-ring-offset = 2px`

Rules:

- standalone or dominant interactive elements must offer at least a `44px x 44px` hit target
- dense inline controls may render at `40px` only when the interactive hit area still resolves to at least `44px x 44px` and an equivalent row or section action exists
- chips, pills, and status tokens use `radius-pill`; tables and dense input wells may use `radius-sm`; cards, grouped regions, and summary stubs use `radius-md`; drawers, sheets, and side stages use `radius-lg` or `radius-xl` according to the current shell profile
- no surface may communicate hierarchy primarily through heavy shadow; quiet hierarchy comes from spacing, keylines, contrast, and topology first

### 1.3 Breakpoints and topology metrics

Canonical breakpoint classes remain those defined in `design-token-foundation.md`:

- `xs = 320-479`
- `sm = 480-767`
- `md = 768-1023`
- `lg = 1024-1439`
- `xl = 1440-1919`
- `2xl = 1920+`

Behavioral groupings may collapse those classes into shell-level bands such as `compact = xs | sm`, `medium = md`, `expanded = lg`, and `wide = xl | 2xl`, but the underlying breakpoint vocabulary must stay canonical.

Canonical shell metrics:

- narrow-shell gutter = `16px`
- medium-shell gutter = `24px`
- wide-shell gutter = `32px`
- `support-region-width = clamp(320px, 28vw, 400px)`
- `inline-side-stage-width = clamp(360px, 33vw, 480px)`
- `focus-frame-readable-width = min(72ch, 100%)`
- `patient-form-max-width = 640px`
- `internal-form-max-width = 720px`

Rules:

- `mission_stack` is the only legal narrow-screen fold; route meaning, dominant action, and selected anchor must survive breakpoint changes
- desktop density may not be preserved on narrow widths by shrinking type, hit areas, or semantic spacing below the token floors above
- compare, provenance, and support regions must collapse in this order: optional context first, chronology second, dense evidence third, primary action region last
- the promoted support region may be sequential on `xs`, `sm`, and `md`, but it must remain explicitly recoverable through the same `SelectedAnchor` and `DecisionDock` vocabulary

## 2. Typography and readable measure

Canonical type roles are direct bindings over `design-token-foundation.md`:

- `type-display = display`
- `type-headline = headline`
- `type-title = title`
- `type-section = section`
- `type-body-lg = body.lg`
- `type-body = body`
- `type-body-sm = body.sm`
- `type-label = label`
- `type-mono-sm = mono.sm`

Rules:

- patient-facing prose should stay within `60-72ch`; internal explanatory prose should stay within `36-56ch` unless the shell explicitly needs wider operational measure
- times, dates, SLA values, counts, IDs, and clinical measurements must use tabular numerals
- uppercase is reserved for short metadata labels, not sentence-length copy
- density problems must be solved by topology, disclosure, or collapse rules rather than by shrinking below the canonical body roles for primary reading surfaces

## 3. Semantic color roles and trust or freshness posture

Use the existing palette families and semantic ladders from `design-token-foundation.md` and `uiux-skill.md` as semantic roles, not decorative branding:

- `neutral` for ordinary structure, inactive chrome, and calm loading
- `accent-active` for live current activity and safe in-progress acknowledgement
- `accent-review` for review-needed, pending external confirmation, and stale-but-recoverable posture
- `accent-insight` for compare, diff, provenance, and newly revealed evidence
- `accent-success` for authoritative completion or verified availability
- `accent-danger` for blocked, denied, identity-held, urgent, or failed posture

Rules:

- stale or read-only posture must lead with neutral structure and concise text; review or danger tones are secondary signals, not page washes
- `accent-success` is forbidden while any downstream child surface is still `awaiting_external`, `review_required`, `reconciliation_required`, or identity-held
- semantic accent may dominate only one primary affordance per component in calm posture: icon, keyline, chip, or focus ring
- all text and interactive boundaries must preserve accessible contrast under both default and high-contrast modes; color alone may never carry the only meaning

## 4. State-severity equation and display precedence

For each surface compute:

- `P = posturePriority(surfacePostureFrame.postureState)`
- `C = stateClassPriority(surfaceStateFrame.stateClass)`
- `F = freshnessPriority(freshnessState)`
- `T = trustPriority(trustState)`
- `S = settlementPriority(acknowledgementOrSettlementState)`
- `W = writablePriority(writableState)`
- `A = artifactPriority(artifactParityState or artifactModeState)`

Then resolve `effectiveSeverity = max(P, C, F, T, S, W, A)`.

Priority maps:

- `posturePriority`: `ready = 0`, `empty_actionable = 1`, `empty_informational = 1`, `loading_summary = 2`, `settled_pending_confirmation = 3`, `stale_review = 4`, `read_only = 4`, `blocked_recovery = 5`
- `stateClassPriority`: `settled = 0`, `loading = 1`, `empty = 1`, `sparse = 1`, `stale = 3`, `degraded = 4`, `recovery = 5`, `blocked = 5`
- `freshnessPriority`: `fresh = 0`, `aging = 1`, `stale = 4`, `disconnected = 5`
- `trustPriority`: `trusted = 0`, `partial = 2`, `degraded = 4`, `blocked = 5`
- `settlementPriority`: `none = 0`, `settled = 0`, `local_ack = 1`, `server_accepted = 2`, `awaiting_external = 3`, `projection_seen = 3`, `review_required = 4`, `reverted = 4`, `failed = 5`, `expired = 5`
- `writablePriority`: `writable = 0`, `read_only = 3`, `recovery_only = 4`, `blocked = 5`
- `artifactPriority`: `preview_verified = 0`, `summary_only = 2`, `handoff_only = 3`, `preview_degraded = 4`, `blocked = 5`

Tie-break order for visible state is:

`blocked > recovery > degraded > stale > settled_pending_confirmation > loading > empty > sparse > ready`

Mapping rules:

- `blocked` or `recovery` resolve `SurfacePostureFrame.postureState = blocked_recovery`
- `settled_pending_confirmation` resolves when the dominant user action is locally or remotely acknowledged but not yet authoritative
- `degraded` and `stale` resolve `SurfacePostureFrame.postureState = stale_review` unless writable posture has already fallen to `blocked_recovery`
- `empty` resolves to `empty_actionable` only when one safe dominant action is available; otherwise it resolves to `empty_informational`
- `read_only` is a posture, not a fake disabled variant of `ready`; it must explain why mutation is frozen and what recovery path, if any, is available

State-ownership rules:

- the shared status strip owns cross-surface freshness, sync, pause-live, and command-following progress
- the local `SurfaceStateFrame` owns loading, empty, sparse, stale, degraded, recovery, blocked, and settled explanation for one surface
- promoted banners are reserved for urgent risk, cross-shell freeze, or a new user decision that cannot safely fit in the status strip or local surface frame

## 5. Motion and transition mapping

Use the timing bands and intent vocabulary from `platform-frontend-blueprint.md` together with the shared motion tokens from `design-token-foundation.md`.

Canonical travel distances are:

- `distance-none = 0px`
- `distance-local = 4px`
- `distance-card = 8px`
- `distance-surface = 12px`

State-to-motion rules:

- `loading -> reveal` with static skeleton or low-amplitude shimmer only inside the affected region
- `same-object adjacent state change -> morph` with `distance-surface`
- `authoritative settlement -> settle` with `distance-local` or `distance-card`
- `awaiting_external` and `projection_seen` -> `pending` once, then static pending treatment; infinite ornamental looping is forbidden
- `blocked` or `recovery` -> `escalate` through keyline, tone, and focus-restoring emphasis, never through shake or large-viewport motion
- `stale`, `disconnected`, or `preview_degraded` -> `degrade` through muted tone, icon change, and local summary replacement
- `changed-since-seen` and `new evidence` -> `diff` from the affected anchor only

Reduced-motion rules:

- the same causal order must remain visible through tone, iconography, focus, and live-region copy when animation is reduced or disabled
- when motion is reduced, durations may shorten, but state order may not change
- if performance instability threatens clarity, downgrade to static transitions rather than dropping causality or focus restoration

## 6. Accessibility, telemetry, and automation anchors

Accessibility floors:

- every primary region and artifact surface must expose one labeled region, one concise state summary, and one explicit dominant action relationship
- primary and standalone interactive targets use at least `44px x 44px`; dense expert controls may render smaller only with a `44px x 44px` interactive hit box
- focus indication uses the canonical focus ring tokens and may not be clipped by sticky chrome, overflow containers, or transform stacking
- `aria-live = polite` is the default for loading, stale, settled-pending-confirmation, and ordinary artifact progress; `assertive` is reserved for blocked, urgent, or review-required changes
- placeholder, sparse, empty, and read-only surfaces must explain reason, actionability, and next safe step without relying on color

Required DOM markers:

- `data-shell-type`
- `data-channel-profile`
- `data-route-family`
- `data-design-contract-digest`
- `data-design-contract-state`
- `data-design-contract-lint-state`
- `data-layout-topology`
- `data-breakpoint-class`
- `data-density-profile`
- `data-surface-state`
- `data-state-owner`
- `data-state-reason`
- `data-writable-state`
- `data-dominant-action`
- `data-anchor-id`
- `data-anchor-state`
- `data-artifact-stage`
- `data-artifact-mode`
- `data-transfer-state`
- `data-continuity-key`
- `data-return-anchor`

Rules:

- every route root and artifact-bearing surface must expose the governing `designContractDigestRef`, publication state, and lint state so automation, support replay, and operators can prove which contract actually rendered
- DOM markers and `UIEventEnvelope` fields must share the same `surfaceRef`, `stateClass`, `artifactMode`, `breakpointClass`, and `selectedAnchor` vocabulary
- route-level telemetry must not collapse artifact transfer, state morph, or recovery posture into generic click analytics
- responsive fold, unfold, breakpoint, and restore behavior is not compliant unless both DOM markers and UI events prove that the same continuity frame and selected anchor survived

### 6.1 Design contract export and lint

Rules:

- every shell family and route-family set must publish one current `DesignContractPublicationBundle` derived from one current `DesignTokenExportArtifact`; bespoke token JSON, Storybook fixtures, browser constants, or visual snapshots alone are insufficient
- every `VisualTokenProfile` must cite one current `TokenKernelLayeringPolicy` and one current `ProfileSelectionResolution`; shell-local density tables, route-level motion presets, and semantic-color remaps outside that tuple are contract defects
- `SurfaceStateSemanticsProfile`, `AccessibilitySemanticCoverageProfile`, `AutomationAnchorMap`, `TelemetryBindingProfile`, and `ArtifactModePresentationProfile` are compliant only when they are reachable from the same published bundle, the same `DesignContractVocabularyTuple`, and the same `SurfaceStateKernelBinding`
- `DesignContractLintVerdict.result = pass` is required before a design contract may be published or reused as live runtime truth; if the verdict falls to `blocked`, shells may preserve the last safe summary and anchor, but they may not continue to present calm, writable, or verified posture from stale design state
- every newly visible state must first extend `SurfaceStateSemanticsProfile` and regenerate the affected `SurfaceStateKernelBinding`; component-local badges, aria summaries, DOM markers, and telemetry events may not invent state meaning outside the kernel
- `structuralSnapshotRefs[]` must prove token-role mapping, surface-role usage, DOM marker coverage, accessible role coverage, state-frame posture, and artifact-mode cues across supported breakpoint and mode tuples; visual screenshot approval without structural coverage is insufficient
- route-local px values, hex values, radius ladders, motion timings, state labels, marker aliases, or event names that are absent from the active bundle are contract defects even when the rendered UI still looks acceptable

## 7. Artifact, export, print, and handoff presentation

Artifact-mode precedence is:

`structured_summary > contract_permitted_preview > print_ready > byte_download or export > external_handoff`

Rules:

- the same shell must show structured summary first whenever policy permits
- `print_ready` may render only from verified preview or a verified summary template; print may never outrun parity or disclosure fences
- `byte_download`, `export`, and `external_handoff` are secondary actions and must preserve the same `returnAnchorRef`
- if parity, grant validity, or channel capability drifts mid-session, degrade in place to governed summary or recovery copy instead of launching blank pages or stale previews
- artifact-mode changes must emit the canonical artifact UI events and preserve the active `SelectedAnchor` unless the user explicitly leaves the shell
