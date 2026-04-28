# 420 Confidence Rationale And Provenance Spec

Visual mode: `Assistive_Confidence_Provenance_Prism`

## Purpose

Task 420 adds the reusable confidence, rationale, freshness, and provenance language for staff-visible Phase 8 assistive artifacts. The surface is not a generic AI confidence panel. It renders from `AssistiveConfidenceDigest.displayBand`, `AssistiveProvenanceEnvelope`, current trust posture, and the artifact presentation contract.

The primary rule is conservative: confidence is informative, not decisive. The UI does not show raw probabilities, success-green certainty, or final workflow truth.

## Rail Integration

The component family mounts inside the 418 assistive rail before the 419 draft deck when the route includes `assistiveConfidence`.

Supported fixtures:

- `assistiveConfidence=healthy`: supported draft aid with always-visible provenance footer.
- `assistiveConfidence=suppressed-degraded`: source digest was supportable but visible confidence is suppressed by degraded trust.
- `assistiveConfidence=abstention`: insufficient support with abstention posture and factor rows.
- `assistiveConfidence=rationale-open`: bounded rationale disclosure starts open.
- `assistiveConfidence=provenance-open`: provenance drawer starts open.
- `assistiveConfidence=narrow-folded`: compact same-shell folded rail proof.

The fixture can be combined with `assistiveRail=shadow-summary` and any `assistiveDraft` fixture. Existing 418 and 419 routes stay unchanged unless `assistiveConfidence` is present.

## Component Contract

- `AssistiveConfidenceBand` renders one primary token from the effective `AssistiveConfidenceDigest.displayBand`.
- `AssistiveConfidenceBandCluster` owns the rail card composition for compact summary, rail card, and future stage card placements.
- `AssistiveRationaleDigest` renders the one-line summary-first rationale.
- `AssistiveRationaleExplainer` exposes bounded factor rows and evidence coverage only after explicit disclosure.
- `AssistiveFactorRowList` renders evidence coverage, expected harm, uncertainty, abstention, trust, or freshness factors as structured rows.
- `AssistiveEvidenceCoverageMiniMap` gives a compact evidence coverage summary without decorative charting.
- `AssistiveFreshnessLine` keeps generated-against and checked-against context visible.
- `AssistiveProvenanceFooter` always shows freshness, trust, and source lineage in compact form.
- `AssistiveProvenanceDrawer` expands lineage refs without becoming a modal or external handoff.
- `AssistiveConfidenceSuppressionState` explains why visible confidence was suppressed.
- `AssistiveConfidenceStateAdapter` maps route fixture, runtime scenario, task ref, and selected anchor into a narrowable UI state.

## Authority Rules

- Raw percentages, logits, posterior values, and calibration internals are forbidden in primary staff chrome.
- The browser may narrow confidence to `suppressed`; it may not widen actionability or confidence beyond the envelope.
- Degraded trust, stale continuity, stale publication, missing calibration, or a limited presentation contract suppresses visible confidence.
- The provenance footer must render before any richer rationale or lineage detail.
- Factor rows are disclosure-only and remain bounded to the current artifact presentation contract.
- Confidence and provenance do not make insert, accept, completion, export, or browser handoff actions legal.

## Layout

The rail card follows the existing 418 and 419 8px radius language. Showcase dimensions:

- confidence band chip height: `24px`
- rationale digest max width inside rail: `296px`
- factor row list max width inside rail: `320px`
- provenance footer min height: `28px`
- explainer drawer max width in rail: `344px`
- inline chip gap: `8px`
- stacked block gap: `10px`

The component supports compact summary stub, full rail card, and future bounded stage card placements through the `placement` prop and `data-placement` attribute.

## Motion And Accessibility

Disclosure reveal uses 120ms ease-out opacity/position motion. Provenance drawer reveal uses 140ms. Chip state changes use 100ms. `prefers-reduced-motion` removes all non-essential motion.

Rationale and provenance use native buttons with `aria-expanded` and `aria-controls`. `Enter` and `Space` toggle through native button behavior. `Escape` closes the open rationale or provenance detail while focus is inside the confidence surface.
