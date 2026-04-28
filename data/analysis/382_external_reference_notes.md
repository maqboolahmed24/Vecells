# External Reference Notes For Track 382

References were checked on 2026-04-27.

## NHS App Web Integration Guidance

The NHS App web integration guidance says conventional file download does not work in web integrations because of webview limitations, while browser print is not planned. The implementation therefore treats byte delivery as a governed bridge action and always keeps a summary-first fallback.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/

## NHS App JS API v2

The NHS App JS API v2 specification includes `downloadFromBytes(base64data, filename, mimeType)` and says native controls prompt the user to select a location. It also exposes `getAppPlatform`, which sharpens the platform-aware byte-delivery posture without allowing user-agent-only trust.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/

## NHS Service Manual Error Guidance

The NHS service manual distinguishes validation errors from cases where a user cannot proceed. For non-eligibility or permission cases, it says to explain why the action cannot be accepted, tell the user what to do next, and include a way to leave the transaction. `EmbeddedErrorContract` follows that recovery shape inside the same shell.

Source: https://service-manual.nhs.uk/design-system/components/error-message

## Borrowed And Rejected

Borrowed:

- explicit avoidance of ordinary browser download and browser print in NHS App webview
- bridge byte download as the only byte transport path
- recovery copy that tells the patient what happened and what to do next

Rejected:

- treating `from=nhsApp` or user-agent markers as artifact delivery authority
- route-local blob URLs or print buttons
- generic error pages that discard selected anchor and return context
