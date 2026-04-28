# 395 Embedded Design Convergence Accessibility Notes

## What Changed

The embedded routes now publish one design convergence bundle around the shared accessibility layer from task 394. The bundle does not replace route-owned `main` landmarks or business state. It publishes state copy, semantic labels, automation anchors, icon rules, and visualization fallback tables from one source.

## Accessibility Contracts

- Visual summaries have a text summary and table fallback through `EmbeddedVisualizationFallbackAdapter`.
- Fallback tables use captions, row headers, and explicit parity references.
- Semantic grammar is published per route family through `EmbeddedSemanticGrammarRegistry`.
- Automation anchors are aligned with visible roots and action reserves through `EmbeddedAutomationAnchorRegistry`.
- State copy and CTA grammar are normalized through `EmbeddedStateCopyRegistry`.
- Icon rules are explicit: status text stays primary and icons may only support scanning.

## Review Anchors

- Entry progress, intake progress, request timeline, booking comparison, pharmacy status, artifact progress, and shell semantic strips all have fallback table contracts.
- The route-owned `main` count remains one per embedded route.
- The design linter reports `data-linter-state="pass"` only after the route root, action anchor, visual mode, and fallback table are present.
- Body copy remains at or above `14px / 21px`.

## Playwright Proof

The 395 Playwright suite checks:

- state labels, CTA grammar, and forbidden copy drift
- fallback table parity for all published visual summaries
- ARIA snapshots for the design bundle and route roots
- narrow mobile screenshots and computed token values

