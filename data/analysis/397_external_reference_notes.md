# 397 External Reference Notes

References checked on 2026-04-27.

| Source | Used for |
| --- | --- |
| https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration | NHS App web integration flow, including agreed limited release to a small group, full release with the NHS App team, monthly post-live data, annual assurance, incident protocol, and journey-change notice timing. |
| https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration | Required integration standards: WCAG 2.2 AA, NHS service standard, clinical safety standards, data privacy, and SCAL evidence posture. |
| https://service-manual.nhs.uk/accessibility | Accessibility and inclusive service obligations used for patient-safe freeze dispositions and degradation messaging. |
| https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ | Developer guidance for NHS App web integration traffic, hiding headers, SSO query handling, journey paths, site links, and webview limitations. |
| https://playwright.dev/docs/browser-contexts | Browser automation isolation through separate browser contexts for reproducible operator rehearsals. |
| https://playwright.dev/docs/trace-viewer | Trace capture and review pattern for operator evidence, with traces limited to redaction-safe local pages. |

Implementation consequences:

- Limited release is governed by `ChannelReleaseCohort` manifests with ODS and patient-population slices agreed with the NHS App implementation team.
- Monthly performance packs are aggregate only and explicitly reject raw `assertedLoginIdentity`, bearer tokens, JWTs, grant identifiers, patient identifiers, NHS numbers, and PHI query strings.
- Route freezes degrade to read-only, placeholder-only, or redirect-to-safe-route states with WCAG 2.2 AA-compatible recovery copy.
- Playwright scripts use isolated browser contexts and optional traces rather than persistent logged-in browser profiles.
