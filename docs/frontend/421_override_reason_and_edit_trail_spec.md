# 421 Override Reason And Edit Trail Spec

Visual mode: `Assistive_Override_Trail_Review`

## Purpose

Task 421 adds the visible human-edit and override seam for Phase 8 assistive artifacts. The final product truth is the `FinalHumanArtifact`, not the original assistive suggestion. The surface shows when a clinician accepted content unchanged, accepted it after edit, rejected it to an alternative, abstained, or regenerated and superseded it.

The component is intentionally bounded to the frontend projection. The 403 registry still marks this track blocked until the authoritative 413 feedback-chain linkage, so the UI references 413 refs and preserves a gap note instead of claiming live backend settlement.

## Rail Integration

The component family mounts inside the 418 assistive rail when the route includes `assistiveOverride`. It sits after the 420 confidence/provenance cluster and before the 419 draft deck, so the clinician sees confidence and source lineage before reason capture.

Supported fixtures:

- `assistiveOverride=accepted-unchanged`: final artifact matches assistive source and no coded reason is required.
- `assistiveOverride=accepted-edited`: material human edit with progressive reason capture.
- `assistiveOverride=rejected-mandatory`: rejected assistive source with mandatory reason sheet open.
- `assistiveOverride=abstained`: human abstention preserves the chain without promoting assistive text.
- `assistiveOverride=regenerated`: superseded source remains visible in the trail.
- `assistiveOverride=policy-exception`: policy exception plus low support requires reason capture and approval burden.
- `assistiveOverride=completed-trail`: completed coded reason trail with free-text notes disclosure-fenced.
- `assistiveOverride=reason-open`: material edit with the reason sheet initially open.

The fixture can be combined with `assistiveRail=shadow-summary`, `assistiveConfidence=healthy`, and 419 draft fixtures.

## Component Contract

- `AssistiveEditedByClinicianTrail` owns the composition, visual mode, keyboard close model, and feedback-chain refs.
- `AssistiveHumanArtifactSummary` makes the final clinician-authored artifact visually primary.
- `AssistiveEditDeltaSummary` gives a compact four-line maximum summary of material change.
- `AssistiveEditDeltaDrawer` expands bounded before/after detail at the capture moment.
- `AssistiveApprovalBurdenNotice` states whether coded reason capture or dual review is required.
- `AssistiveOverrideReasonSheet` exposes progressive reason capture and completed reason state.
- `AssistiveOverrideReasonCodeGroup` renders coded reasons as labelled native checkboxes.
- `AssistiveOverrideReasonValidationState` shows validation without relying on color alone.
- `AssistiveOverrideTrailEventRow` renders the assistive source, human action, reason, and final artifact events.
- `AssistiveOverrideStateAdapter` maps route fixture, runtime scenario, route kind, selected anchor, and task refs into UI state.

## Authority Rules

- Accepted after edit is distinct from accepted unchanged.
- Material edits, policy exceptions, low-confidence acceptance, rejected alternatives, abstentions, trust recovery, and high-burden flows require deterministic coded reason capture.
- Free-text override notes are optional only where allowed and are disclosure-fenced. Routine telemetry carries reason codes and refs, not raw note content.
- The final human artifact is visually primary; the assistive source remains bounded context.
- Current 420 confidence digest and provenance envelope refs remain visible at capture time.
- Assistive acceptance alone does not settle a workflow. Settlement is represented only as a final human artifact posture.

## Layout

The rail card follows the existing 418/419/420 8px radius language. Showcase dimensions:

- summary padding: `14px`
- reason sheet width in rail: `320px`
- future full dialog stage width: `560px`
- event row min height: `32px`
- diff snippet max visible lines: `4`
- section gap: `12px`

Palette:

- card: `#ffffff`
- inset: `#EEF2F7`
- border: `#D7DFE8`
- heading: `#0F172A`
- body: `#334155`
- muted: `#64748B`
- human-authored: `#0F766E`
- mandatory caution: `#B7791F`
- policy exception: `#B42318`
- assistive origin: `#2457FF`

## Motion And Accessibility

Reason sheet reveal uses 140ms ease-out motion. Diff expansion uses 120ms. Validation hints use 100ms. `prefers-reduced-motion` removes non-essential motion.

The reason code group uses native checkbox inputs with visible labels. The diff drawer and reason sheet use native disclosure buttons with `aria-expanded` and `aria-controls`. `Escape` closes an open diff or reason sheet while focus is inside the override surface and returns focus to the invoking control.
