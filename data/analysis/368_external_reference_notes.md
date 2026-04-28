# 368 External Reference Notes

Reviewed on `2026-04-24` before implementation. These references were support only; the local blueprints remained authoritative.

| Source | Borrowed | Rejected |
| --- | --- | --- |
| [NHS writing NHS messages](https://service-manual.nhs.uk/content/writing-nhs-messages) | Kept short patient-safe messages, led with the most important information, and avoided multiple competing calls to action in pharmacy notification summaries. | Rejected channel-specific sender-name rules as implementation authority inside the merge adapter because sender configuration is not owned by this repo. |
| [Playwright best practices](https://playwright.dev/docs/best-practices) | Kept three browser-visible proof journeys focused on user-visible behavior and explicit test contracts instead of brittle DOM walks. | Rejected generated or CSS-chain locators for the merge proofs because the repo already exposes explicit route and status contracts. |
| [Playwright browser contexts](https://playwright.dev/docs/browser-contexts) | Used separate browser contexts for patient, staff-entry, ops, and pharmacy-console surfaces so the proof simulates independent actors without state bleed. | Rejected sharing a single context across all surfaces because that would weaken the cross-surface continuity proof. |
| [Playwright trace viewer](https://playwright.dev/docs/trace-viewer-intro) | Used trace-aware proof structure as the baseline for debugging if a merge journey regressed. | Rejected turning trace output into product truth or validation logic. |
| [Playwright locators](https://playwright.dev/docs/locators) | Preferred resilient `data-testid`, role, and explicit state attributes in the new tests. | Rejected XPath / implementation-detail selectors for merged request, message, and ops surfaces. |
| [WCAG 2.2 understanding status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Kept status and notification surfaces explicit through live-region-compatible, browser-visible state labels. | Rejected using hidden-only status changes as sufficient proof; the merge keeps visible status lines too. |
| [WAI-ARIA APG alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) | Reserved alert-style urgency for urgent-return and recovery-required states only. | Rejected promoting settled or pending pharmacy states to alert posture, because that would overstate urgency. |

## Summary

- Borrowed: concise patient messaging, resilient multi-context Playwright proof, explicit status semantics.
- Rejected: any external pattern that would create a second truth source, overstate urgency, or replace the repository’s request-led continuity law.
