# 309 External Reference Notes

Reviewed on 2026-04-22 for `seq_309_phase4_local_booking_e2e_suite`.

The local blueprint and repository models remained authoritative. The sources below were used only to sharpen browser-proof method, accessibility coverage, transactional wording, and performance reporting.

## Playwright

- Borrowed: [Isolation](https://playwright.dev/docs/browser-contexts)
  - Used the BrowserContext-per-scenario model because the docs describe isolated clean-slate contexts as the default way to avoid state leakage across tests and multi-user flows.
- Borrowed: [Pages](https://playwright.dev/docs/pages)
  - Used multiple pages and multiple contexts in one scenario for patient and staff parity checks because the docs describe each context as able to host multiple active pages without manual foreground juggling.
- Borrowed: [Accessibility testing](https://playwright.dev/docs/accessibility-testing)
  - Kept axe checks plus manual assertions together because the docs explicitly recommend combining automated accessibility testing with manual assessment rather than treating automation as complete coverage.
- Borrowed: [ARIA snapshots](https://playwright.dev/docs/aria-snapshots)
  - Used ARIA snapshots for the highest-risk status surfaces because the docs present them as structural accessibility-tree assertions that complement fine-grained assertions.
- Borrowed: [Visual comparisons](https://playwright.dev/docs/test-snapshots)
  - Kept the caution that screenshot baselines are host-environment sensitive. This is why the suite uses repeat-capture stability hashes instead of OS-bound golden snapshots. That is an implementation inference from the Playwright guidance, not a direct requirement from the local algorithm.
- Borrowed: [Trace viewer](https://playwright.dev/docs/trace-viewer)
  - Kept trace capture on the major browser proofs because the docs call traces the primary debugging surface for CI failures and visual attachment review.

## WCAG 2.2 And W3C Understanding Docs

- Borrowed: [Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
  - Applied the sticky-footer and scroll-padding examples to booking sticky trays and mobile action bars. The suite checks that focusable controls remain visible above the sticky reserve.
- Borrowed: [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
  - Used the 24 by 24 CSS pixel minimum and the note that zoom does not change the underlying CSS-pixel target size. This shaped the explicit target-size assertions for patient and staff mutation controls.
- Borrowed: [Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)
  - Treated return binders, selected anchors, and previously entered continuity data as first-class proof targets so the suite checks that transactional continuity is reused instead of re-entered within one process.
- Rejected as primary authority:
  - WCAG mobile and input criteria were used to improve the suite, but none were allowed to override the repository’s booking continuity law, same-shell selected-anchor law, or local waitlist and reconciliation truth objects.

## NHS Service Manual

- Borrowed: [Question pages](https://service-manual.nhs.uk/design-system/patterns/question-pages)
  - Used the guidance that question pages should include a back link and must not break the browser back button. This reinforced the history and quiet-return checks on booking entry and route-family navigation.
- Borrowed: [Check answers](https://service-manual.nhs.uk/design-system/patterns/check-answers)
  - Reused the transactional principle that users need one clear review point with obvious change affordances before sending data. This influenced the booking review, confirmation, and manage evidence framing.
- Borrowed: [Confirmation page](https://service-manual.nhs.uk/design-system/patterns/confirmation-page)
  - Applied the requirement that confirmation surfaces explain what happened and what happens next, and avoided confirmation-page calmness on pending or disputed booking states.
- Reviewed then mostly rejected: [Mini-hub](https://service-manual.nhs.uk/design-system/patterns/mini-hub)
  - The page-navigation pattern was not adopted for the booking evidence board or booking routes because this task is transactional, not topic navigation. Only the emphasis on clear page identity was retained.

## Performance Guidance

- Borrowed: [Web Vitals](https://web.dev/articles/vitals)
  - Used the current Core Web Vitals thresholds as support targets in reporting: LCP within 2.5 seconds, INP within 200 milliseconds, and CLS within 0.1.
- Borrowed: [Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)
  - Used the guidance to report responsiveness at the 75th percentile across device classes. The local harness reports interaction latency as an INP-style support measure for booking transitions.
- Rejected as primary authority:
  - Green performance numbers were explicitly not allowed to override a failed continuity contract, failed truth projection, or blocked recovery posture. The blueprint remained authoritative.
