# 336 External Reference Notes

Reviewed on `2026-04-23` in `Europe/London`.

The local blueprint and the frozen 317/318/319 contracts remained authoritative. External material was used only to keep non-production feed setup, environment separation, browser proof, and secret handling aligned with current official practice.

## Borrowed

- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
  Borrowed the current prerequisites and environment framing: HSCN access, local RBAC, JWT carriage of user and ODS context, and the existence of integration testing posture for appointment-management work. Rejected letting the public guidance override the repo’s stronger trust-admission and quarantine law.

- [Testing APIs](https://digital.nhs.uk/developer/guides-and-documentation/testing)
  Borrowed the current distinction between sandbox and integration environments, the current DEV and INT base URLs, and the advice not to share one application between environments. Rejected treating sandbox-style canned responses as sufficient proof for capacity truth.

- [Foundations FHIR](https://digital.nhs.uk/services/gp-connect/develop-gp-connect-services/development/foundations)
  Borrowed the current SDS and ODS endpoint-lookup requirement. This reinforced the 336 rule that every feed row must bind endpoint identity, ODS code, site, and service references explicitly.

- [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
  Borrowed the fail-closed safety posture for stale, wrong-site, or wrongly trusted capacity data. Rejected any design that would let a degraded or quarantined feed appear equivalent to ordinary bookable truth.

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
  Borrowed the emphasis on isolated tests, resilient selectors, and trace-first debugging. That directly informed the separate runtime directories and local-only harness pattern.

- [Playwright Authentication](https://playwright.dev/docs/auth)
  Borrowed the warning that browser state files can contain sensitive cookies and should not be checked in. That reinforced the rule that 336 does not persist authenticated state under `playwright/.auth`.

- [Playwright Isolation](https://playwright.dev/docs/browser-contexts)
  Borrowed the clean-slate browser-context model. That directly informed the local portal proofs so they do not leak state across setup and verification runs.

## Rejected Or Contained

- Rejected representing supplier-admin portal visibility as equivalent to verified capacity truth.
- Rejected storing environment keys, private keys, or supplier passwords in tracked files or browser artifacts.
- Rejected making supported-test or INT application setup the source of truth. The manifests remain authoritative and browser state stays ephemeral.

## Implementation Consequences

- current supplier-admin limits are explicit `manual_bridge_required` rows, not hidden caveats
- unsupported feeds are explicit typed rows, not missing configuration
- trusted, degraded, and quarantined postures are represented before ingestion, not inferred after runtime surprises
- Playwright proof uses local-only masked twins and trace capture without persisting reusable auth state
