# 399 External Reference Notes

Captured on 2026-04-27. These references support proof technique and current NHS integration posture only; local blueprint and repository contracts remain the source of truth.

| Source | URL | Borrowed | Rejected |
| --- | --- | --- | --- |
| Playwright browser contexts | https://playwright.dev/docs/browser-contexts | Each proof creates a fresh browser context so storage, cookies, and session state cannot leak between scenarios. | Do not reuse state between SSO branches. |
| Playwright authentication | https://playwright.dev/docs/auth | Authentication state is sensitive and must not be checked into the repo; this suite uses synthetic PHI-safe state instead. | Do not persist real auth storage. |
| Playwright trace viewer | https://playwright.dev/docs/trace-viewer | PHI-safe traces are captured around proof scenarios to debug failures. | Do not upload traces to external services. |
| Playwright ARIA snapshots | https://playwright.dev/docs/aria-snapshots | The suite keeps ARIA snapshot capability available for visible status/error surfaces. | Do not replace interaction proof with snapshots alone. |
| Playwright visual comparisons | https://playwright.dev/docs/test-snapshots | Browser-visible proof records deterministic screenshots/traces where visual regressions matter. | Do not use screenshot pass/fail as the only release signal. |
| Playwright assertions | https://playwright.dev/docs/test-assertions | Assertions wait on role and test-id locators rather than brittle timing. | Do not assert hidden implementation details where a semantic locator exists. |
| NHS App web integration | https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration | Embedded entry and post-live service-management obligations are treated as proof requirements. | Do not infer release readiness from a single happy-path jump-off. |
| NHS login partner guidance | https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works | The proof respects the browser redirect, callback, and token-handling shape of an OIDC NHS login flow. | Do not persist raw identity tokens or asserted identities in traces. |
| NHS service-manual accessibility | https://service-manual.nhs.uk/accessibility | Recovery copy and status states remain understandable and keyboard reachable. | Do not make error recovery color-only. |
| NHS service-manual error summary | https://service-manual.nhs.uk/design-system/components/error-summary | Intake and more-info validation keeps a clear error summary path. | Do not hide validation in inline-only copy. |
