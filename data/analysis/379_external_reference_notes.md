# 379 External Reference Notes

Recorded: 2026-04-27

## Official References Reviewed

- NHS App developer web integration guidance: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/
- NHS login Single Sign On developer documentation: https://nhsconnect.github.io/nhslogin/single-sign-on/
- NHS login overview and partner responsibilities: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works
- NHS App web integration process: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration

## Borrowed Into 379

- NHS App SSO launches with `assertedLoginIdentity`; the bridge captures it, hashes it, removes it from the supplier URL, and converts it to `asserted_login_identity` for NHS login.
- NHS login SSO uses `prompt=none`; the authorize builder fixes that parameter and does not let route code choose a weaker mode.
- `ConsentNotGiven` is handled as `consent_denied` with safe return posture.
- NHS login session management remains the partner service's responsibility, so local `SessionMergeDecision` remains explicit and auditable.
- The NHS App integration process requires Sandpit/AOS evidence and operational readiness; this implementation remains deterministic local backend evidence only.

## Rejected Or Deferred Claims

- Rejected: raw `assertedLoginIdentity` can be stored for debugging. Persistent state receives only hashes or redacted markers.
- Rejected: a valid NHS login callback automatically creates or reuses a Vecells session. Session reuse or rotation requires `SessionMergeDecision`.
- Rejected: callback controllers can redirect to arbitrary URLs. `ReturnIntent` is a governed contract with manifest, session, route, and bridge fences.
- Rejected: duplicate callbacks are harmless. `SSOEntryGrant` and `AuthBridgeTransaction` are single-settlement fences.
- Deferred: live NHS login credentials, issuer-key validation, and production SSO configuration. The local adapter preserves the production contract shape.

## Local Source Of Truth

The local blueprints and contracts from `375`, `377`, and `378` remain authoritative. Official references sharpen parameter handling, consent-denial posture, and partner-session responsibility only.
