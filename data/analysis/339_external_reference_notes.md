# 339 External Reference Notes

Accessed on 2026-04-23. These references informed the browser-proof technique, accessibility review posture, MESH realism, and confirmation or recovery wording. The repository blueprints and validated outputs from `321`, `322`, `323`, `324`, `329`, `330`, `331`, `334`, `335`, `337`, and `338` remained the source of truth whenever an external pattern was broader than the local algorithm.

## Official references adopted

### Playwright

- [Isolation | Playwright](https://playwright.dev/docs/browser-contexts)
  - Borrowed: use clean `BrowserContext` boundaries and explicit context setup to keep browser proofs deterministic.
  - Applied in 339: each browser suite creates its own context with explicit locale, timezone, and viewport so commit, practice, patient, and recovery proofs do not bleed state across scenarios.
- [Best Practices | Playwright](https://playwright.dev/docs/best-practices)
  - Borrowed: assert user-visible behavior and durable contracts rather than implementation details.
  - Applied in 339: the suites assert route markers, visible labels, acknowledgement states, and recovery anchors instead of private component internals.
- [Snapshot testing | Playwright](https://playwright.dev/docs/aria-snapshots)
  - Borrowed: ARIA snapshots are appropriate evidence for accessibility-tree stability when the state model is as important as the rendered pixels.
  - Applied in 339: the recovery diff strip, manual proof modal, and continuity drawer publish ARIA evidence alongside screenshots.
- [Trace viewer | Playwright](https://playwright.dev/docs/trace-viewer-intro)
  - Borrowed: trace zip artifacts are the primary replay aid when a browser proof fails or becomes flaky in CI.
  - Applied in 339: every browser suite emits a trace zip, screenshot, and JSON sidecar for the evidence bundle.
- [Accessibility testing | Playwright](https://playwright.dev/docs/next/accessibility-testing)
  - Borrowed: accessibility assertions belong inside the same end-to-end flow rather than as a detached afterthought.
  - Applied in 339: the proof spine keeps accessibility evidence in the same routes that render commit truth, acknowledgement debt, and reopen recovery.
- [Debugging Tests | Playwright](https://playwright.dev/docs/debug)
  - Borrowed: direct trace and locator debugging should be preferred over brittle retry heuristics.
  - Applied in 339: failures were fixed by tightening route waits and authoritative locators, not by adding sleeps or broad retries.

### WCAG 2.2 and WAI-ARIA APG

- [Understanding Success Criterion 4.1.3: Status Messages | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)
  - Borrowed: status changes that do not take focus still need to be programmatically exposed to assistive technology.
  - Applied in 339: practice informed, acknowledgement pending, reopened-by-drift, and reminder-failure states remain explicit status changes instead of silent text swaps.
- [Understanding Success Criterion 1.4.10: Reflow | WAI | W3C](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
  - Borrowed: high-zoom and narrow layouts should preserve equivalent meaning without forcing unnecessary two-dimensional scrolling.
  - Applied in 339: the lab and browser evidence keep recovery, practice, and confirmation meaning available without hover-only disclosure.
- [Dialog (Modal) Pattern | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
  - Borrowed: modal flows need explicit focus placement, visible close affordance, and contained keyboard travel.
  - Applied in 339: the manual proof modal is reviewed as a dominant state rather than a cosmetic overlay.

### Messaging and NHS wording support

- [Message Exchange for Social Care and Health - NHS England Digital](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)
  - Borrowed: MESH is an asynchronous, tracked, governed delivery boundary with discrete upload, retrieval, acknowledgement, and non-delivery behavior.
  - Applied in 339: transport reachability, delivery to practice, and explicit acknowledgement remain separate facts; the suite does not collapse them into one generic “sent” state.
- [Interaction methods - NHS England Digital](https://digital.nhs.uk/developer/nhs-digital-architecture/integration-patterns-book/interaction-methods)
  - Borrowed: asynchronous interaction boundaries need explicit receipt and delivery posture rather than synchronous certainty assumptions.
  - Applied in 339: MESH-backed continuity stays distinct from booking truth, and route failures reopen debt explicitly.
- [Confirmation page – NHS digital service manual](https://service-manual.nhs.uk/design-system/patterns/confirmation-page)
  - Borrowed: confirmation pages should clearly tell users what they completed and what happens next, without overwhelming them.
  - Applied in 339: patient confirmation surfaces keep “Appointment confirmed”, “Practice informed”, and “Practice acknowledged” as separate, calm, summary-first disclosures.
- [Interruption page – NHS digital service manual](https://service-manual.nhs.uk/design-system/patterns/interruption-page)
  - Borrowed: interruption wording should make unusual or risky posture explicit without pretending the user has completed the task.
  - Applied in 339: recovery and reopen wording stays direct about blocked calmness, callback transfer, urgent return, or reminder-route failure.

## References considered but not allowed to override the local algorithm

- Playwright guidance informed isolation, trace capture, ARIA evidence, and debugging posture, but it did not replace the repository’s existing tsx-driven harness or local route contracts.
- WCAG and APG guidance informed status exposure, reflow, and modal handling, but it did not soften the repository’s stricter truth, acknowledgement, or reopen laws.
- NHS and MESH materials informed wording and asynchronous realism only. They did not override the repository distinction between booking truth, practice informed posture, and current-generation acknowledgement.

## Rejected or intentionally not imported

- I did not import generic toast or banner conventions that would allow transport-side progress to masquerade as booked calmness.
- I did not import generic help-desk or dashboard recovery patterns that hide fallback linkage debt, provenance, or exception selection state.
- I did not use external retry heuristics to hide route locator drift. The harness was corrected to wait on the authoritative desktop exceptions view instead.
