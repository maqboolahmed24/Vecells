# External Reference Notes For Track 380

References were checked on 2026-04-27.

## NHS App Web Integration

Official NHS App web integration guidance describes recognizing NHS App traffic with a `from=nhsApp` query parameter, NHS login SSO through an `assertedLoginIdentity` query parameter, and supplier-provided base URLs and journey paths. The 380 service keeps these as entry signals only; it converts them into local route and grant fences before releasing data.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/

## Site Links

The same guidance states that Android site links use `/.well-known/assetlinks.json` and iOS site links use `/.well-known/apple-app-site-association`, with package names, certificate fingerprints, app IDs, and paths varying by environment. The 380 association exports are therefore generated from environment manifest truth instead of static copies.

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/#site-links

## NHS Login And Session Responsibility

NHS login returns users to the partner service after authentication and the partner service remains responsible for session management. The 380 resolver therefore treats NHS login identity and link entry as inputs to local subject-binding, session-epoch, and assurance fences, not as a replacement for local session state.

Source: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works

## Recovery Copy

NHS service manual guidance for error messages says to explain what went wrong and how to fix it, while avoiding permission/eligibility errors as inline validation. The 380 resolver returns explicit recovery and placeholder states so UI copy can tell users the next action without implying hidden access to protected data.

Sources:
- https://service-manual.nhs.uk/design-system/components/error-message
- https://service-manual.nhs.uk/content/how-we-write
