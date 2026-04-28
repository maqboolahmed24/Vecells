# External Reference Notes For Track 381

References were checked on 2026-04-27.

## NHS App JS API v2

The official NHS App JavaScript API v2 specification says embedded web integrations can use a limited JavaScript interface, that the script should be loaded inline rather than bundled, and that a query string can invalidate cached script versions when adopting newer functionality. The wrapper implements an explicit script URL plus `scriptVersionHint`.

The same specification documents the runtime functions used by the wrapper: `isOpenInNHSApp`, `getAppPlatform`, `setBackAction`, `clearBackAction`, `goToHomePage`, `goToPage`, `openBrowserOverlay`, `openExternalBrowser`, `addEventToCalendar`, and `downloadFromBytes`.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/

## NHS App Web Integration Guidance

The web integration guidance describes hiding supplier headers under NHS App chrome, recognizing NHS App traffic, using `from=nhsApp` as a journey hint, and webview limitations around download and print. The wrapper treats hints as display context only and uses negotiated runtime capability for behavior.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/

## Playwright

The Playwright docs describe separate browser contexts, trace viewer artifacts, auto-retrying assertions, visual comparisons, accessibility testing, and ARIA snapshots. The 381 proof uses separate contexts for embedded, standalone, and degraded states; starts traces for browser flows; captures screenshots; and verifies the diagnostics surface through ARIA snapshot/readback.

Sources:
- https://playwright.dev/docs/browser-contexts
- https://playwright.dev/docs/trace-viewer
- https://playwright.dev/docs/test-assertions
- https://playwright.dev/docs/test-snapshots
- https://playwright.dev/docs/accessibility-testing
- https://playwright.dev/docs/aria-snapshots
