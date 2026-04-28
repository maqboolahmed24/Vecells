# 400 External Reference Notes

Captured on 2026-04-27. These references support proof technique and current NHS integration posture only; local blueprint and repository contracts remain the source of truth.

| Source | URL | Borrowed | Rejected |
| --- | --- | --- | --- |
| Playwright browser contexts | https://playwright.dev/docs/browser-contexts | Each browser proof creates a fresh context so cookies, storage, link state, and bridge probes cannot leak across scenarios. | Do not reuse one context to prove replay or cross-patient denial. |
| Playwright emulation | https://playwright.dev/docs/emulation | Mobile-class proofs set viewport, touch, locale, timezone, and NHS App user-agent strings explicitly. | Do not infer embedded behavior from desktop-only viewports. |
| Playwright trace viewer | https://playwright.dev/docs/trace-viewer | Proofs capture traces with screenshots and snapshots for failure diagnosis. | Do not upload PHI-like traces to external trace hosting. |
| Playwright screenshots | https://playwright.dev/docs/screenshots | Targeted screenshots are used for manifest and bridge diagnostics where visual proof is useful. | Do not treat screenshots as a substitute for state and contract assertions. |
| NHS App web integration | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration | The suite treats responsive web-in-NHS-App integration and post-live support obligations as release-gating behavior. | Do not mark a standalone browser success as proof of NHS App readiness. |
| NHS App web integration guidance | https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ | Site links, NHS App traffic recognition, SSO return handling, and file/print limitations inform the scenario matrix. | Do not rely on query hints alone to unlock trusted embedded state. |
| NHS App JavaScript API | https://nhsconnect.github.io/nhsapp-developer-documentation/js-api-specification/ | Bridge methods for back action, app-page navigation, browser overlay/external browser, calendar, and byte downloads shape the proof boundaries. | Do not bundle or spoof native bridge availability as a release signal. |
| NHS accessibility testing | https://service-manual.nhs.uk/accessibility/testing | Recovery and fallback states must remain keyboard reachable, text based, and not color-only. | Do not hide webview limitations in inline-only or visually ambiguous copy. |
| NHS non-HTML documents | https://service-manual.nhs.uk/content/pdfs-and-other-non-html-documents | Artifact handling keeps summary-first HTML and governed download/fallback paths instead of assuming PDFs are always accessible. | Do not make a PDF or print action the only route to complete a patient task. |
| NHS error summary | https://service-manual.nhs.uk/design-system/components/error-summary | Recovery and validation surfaces keep a clear "There is a problem" style path when action is blocked. | Do not leave blocked actions without a same-shell recovery route. |
