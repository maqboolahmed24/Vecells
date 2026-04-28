# 383 External Reference Notes

Reference material checked on 2026-04-27:

- NHS App developer documentation, Web Integration Overview: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/
  - The NHS App hosts supplier pages in Android and iOS webviews, uses a custom user agent, supports NHS-App-specific JS API actions, and exposes supplier journeys through jump-off points.
- NHS App developer documentation, Web Integration Guidance: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/
  - Used as the source for treating bridge/API behavior as evidence that must be resolved rather than assumed.
- NHS digital service manual accessibility testing guidance: https://service-manual.nhs.uk/accessibility/testing
  - NHS services must account for WCAG 2.2 and define semantic regions such as banner, navigation, main, and contentinfo.
- NHS digital service manual WCAG 2.2 criteria guidance: https://service-manual.nhs.uk/accessibility/new-criteria-in-wcag-2-2
  - Used for the route verifier requirement that mobile and patient-facing services meet WCAG 2.2 AA expectations before promotion.
- W3C WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
  - Used as the normative baseline for `WCAG2.2-AA` in `AccessibleContentVariant`.
- W3C WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/
  - Used for route semantic pattern refs in accessibility evidence.
- Playwright ARIA snapshot documentation: https://playwright.dev/docs/aria-snapshots
  - Used to align executable semantic snapshot evidence with manual audit references without treating snapshots as complete accessibility approval.

Implementation note: the backend stores source URLs only as evidence provenance. Readiness remains based on local release refs and audit states so route promotion is deterministic and auditable.
