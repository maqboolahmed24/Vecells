# 420 Confidence Provenance Accessibility Notes

## Semantic Structure

The confidence surface is a labelled `section` inside the existing 418 `aside[role=complementary]`. It keeps the heading sequence below the rail heading: rail `h2`, summary and mode `h3`, confidence card `h3`, disclosure detail `h4`.

The visible confidence label is derived from `AssistiveConfidenceDigest.displayBand`; screen-reader text does not expose raw model math as a confidence substitute.

The rationale and provenance controls are native buttons with `aria-expanded` and `aria-controls`. Factor rows use a definition list so screen readers hear label, posture, and explanatory detail together. The provenance drawer is inline, not modal, because it does not make the rest of the shell inert.

## Keyboard Model

- `Tab` reaches the confidence band disclosure controls in source order.
- `Enter` and `Space` toggle rationale and provenance through native button behavior.
- `Escape` closes open rationale or provenance detail while focus is inside the confidence surface.
- Focus returns to the disclosure control that opened the current detail.

## Content And Contrast

Button names are specific: `Why this appears` and `Show source lineage`. Confidence states are text labels, not color-only status. Suppression reasons are visible as a `role="note"` block. The UI avoids raw model math, ambiguous "AI explained" copy, and success-green certainty.

## Motion

Disclosure motion is limited to 120ms, provenance drawer reveal to 140ms, and chip state color changes to 100ms. `prefers-reduced-motion: reduce` disables these transitions and animations.

## Playwright Coverage

The 420 Playwright suites assert landmark visibility, heading structure, disclosure controls, Escape behavior, ARIA snapshots for compact and expanded states, no raw percentages in the confidence surface, and visual snapshots for healthy, suppressed, and narrow folded states.
