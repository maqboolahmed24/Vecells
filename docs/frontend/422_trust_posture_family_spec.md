# 422 Trust Posture Family Spec

Visual mode: `Assistive_Trust_Posture_Ladder`

## Purpose

Task 422 adds one visible posture grammar for the Phase 8 assistive layer. The UI is not simply on or off. It distinguishes `shadow_only`, `observe_only`, `degraded`, `quarantined`, `frozen`, and `blocked_by_policy`, each with a posture name, governing reason, current actionability, dominant safe next action, allowed actions, suppressed actions, and trust-envelope refs.

This is a frontend projection over the 415 monitoring and 416 freeze contracts. The 403 readiness registry currently stops at `par_421`, so this implementation publishes `PHASE8_BATCH_420_427_INTERFACE_GAP_TRUST_POSTURE_FAMILY.json` rather than claiming a 422 launch packet exists.

## Rail Integration

The family mounts inside the 418 assistive rail when the route includes `assistiveTrust`.

Supported fixtures:

- `assistiveTrust=shadow-only`
- `assistiveTrust=observe-only`
- `assistiveTrust=degraded`
- `assistiveTrust=quarantined`
- `assistiveTrust=frozen`
- `assistiveTrust=blocked-by-policy`
- `assistiveTrust=detail-open`
- `assistiveTrust=narrow-folded`

The fixture can be combined with `assistiveRail=shadow-summary`, `assistiveConfidence`, `assistiveOverride`, and `assistiveDraft`. The frame renders after confidence and override surfaces so provenance and human-edit truth remain visible when policy allows.

## Component Contract

- `AssistiveTrustStateFrame` owns the visual mode, role semantics, compact rail composition, detail drawer, and refs.
- `AssistiveTrustStateChip` renders the posture label and severity tone.
- `AssistiveShadowOnlyNotice` distinguishes shadow-only from broken or hidden states.
- `AssistiveObserveOnlyNotice` distinguishes read-only context from degraded recovery.
- `AssistiveDegradedStatePanel` shows trust loss with bounded recovery still available.
- `AssistiveQuarantinedStatePanel` constrains the surface to provenance-only containment.
- `AssistiveFrozenStatePanel` preserves text and freezes actions rather than showing a generic unavailable banner.
- `AssistiveBlockedByPolicyPanel` renders a hard stop with no local workaround.
- `AssistiveRecoveryActionPanel` exposes the dominant safe next action or explicitly states that no local assistive action is available.
- `AssistiveTrustStateAdapter` maps route fixtures, runtime scenario, route kind, task ref, and selected anchor into one posture state.

## Authority Rules

- Degraded must not look healthy. The frame uses amber caution styling plus reason copy and suppressed-action rows.
- Quarantined and frozen are distinct. Quarantine is containment; frozen is preservation in place.
- Blocked by policy must not leave nearby controls that imply the user can proceed locally.
- State changes patch in place; the rail is not remounted or replaced by a dashboard-like warning board.
- Confidence and provenance can remain readable only where policy allows. The posture frame does not invent new confidence or provenance grammar.
- The browser may narrow trust posture, but it may not widen beyond the current `AssistiveCapabilityTrustEnvelope`.

## Layout

Showcase dimensions:

- posture frame padding: `16px`
- chip height: `24px`
- reason line max width in rail: `300px`
- action panel min height: `36px`
- stacked trust section gap: `10px`
- optional detail drawer width in rail: `320px`

Palette:

- neutral card background: `#FFFFFF`
- neutral inset: `#EEF2F7`
- border: `#D7DFE8`
- text primary: `#0F172A`
- text secondary: `#334155`
- muted text: `#64748B`
- shadow-only accent: `#6B7280`
- observe-only accent: `#8B5E00`
- degraded accent: `#B7791F`
- quarantined accent: `#B42318`
- frozen accent: `#1D4ED8`
- blocked-by-policy accent: `#7F1D1D`

## Motion And Accessibility

In-place posture changes use 120ms opacity, border-color, and background-color transitions. Recovery detail reveal uses 120ms. `prefers-reduced-motion` removes non-essential motion.

The frame uses `role="status"` for non-interruptive postures and `role="alert"` for quarantined and blocked-by-policy severe states. Detail reveal uses a native button with `aria-expanded` and `aria-controls`; `Escape` closes the detail drawer when focus is inside the trust frame.
