# 401 External Reference Notes

Reviewed on 2026-04-27. Local blueprints remain the source of truth.

## Official Sources Used

- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- Playwright ARIA snapshots: https://playwright.dev/docs/aria-snapshots
- Playwright visual comparisons and snapshots: https://playwright.dev/docs/test-snapshots
- Playwright emulation: https://playwright.dev/docs/emulation
- Playwright browser isolation: https://playwright.dev/docs/browser-contexts
- WCAG 2.2 reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WCAG 2.2 focus not obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- WCAG 2.2 target size minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG 2.2 focus visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- WAI-ARIA APG keyboard interface: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- WAI-ARIA APG dialog modal pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- WAI-ARIA APG tabs pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- WAI-ARIA APG disclosure pattern: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
- NHS service manual accessibility: https://service-manual.nhs.uk/accessibility
- NHS service manual accessibility testing: https://service-manual.nhs.uk/accessibility/testing
- NHS design system error summary: https://service-manual.nhs.uk/design-system/components/error-summary
- NHS App web integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration
- NHS App integration standards: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration

## Borrowed Into The Suite

- Use Playwright browser contexts for isolated phone, tablet, and desktop proofs.
- Use Playwright emulation and reduced-motion media settings for embedded webview-like contexts.
- Use ARIA snapshots for route-family semantic state evidence.
- Use screenshots and trace capture as release evidence, while keeping deterministic DOM assertions as the pass/fail authority.
- Treat automated accessibility checks as partial evidence only; keyboard, focus, reflow, and semantics are directly asserted.
- Treat 320 CSS px and 640 CSS px viewport classes as deterministic reflow pressure for 400 percent and 200 percent equivalents.
- Check focused elements against sticky controls so focus is not visually obscured.
- Require target-size checks through the embedded accessibility helper.
- Apply APG keyboard expectations through Tab traversal, Escape behavior, tab panels, drawers, and disclosure-style controls already declared by the route surfaces.
- Keep NHS App evidence tied to WCAG 2.2 AA, service standard, accessibility audit readiness, SCAL posture, limited release, monthly data, annual assurance, and change-notice obligations.

## Rejected Or Bounded

- A one-device screenshot-only smoke test was rejected because it cannot prove keyboard, reflow, safe-area, route-freeze, or disclosure behavior.
- A synthetic accessibility widget or post-render ARIA patch was rejected because NHS and local rules require built-in accessible behavior.
- Browser-only monthly pack proof was rejected because redaction, telemetry contracts, and rollback posture are release-control model responsibilities.
- Visual snapshots are treated as supporting evidence, not the final authority, because the local blueprint requires machine-readable proof.

