# 366 External Reference Notes

These sources were reviewed on 2026-04-24 before implementing 366.
They inform setup hygiene, current onboarding posture, and browser-automation practice.
They do not override the local Vecells blueprint.

## Borrowed and rejected

### 1. Directory of Healthcare Services (Service Search) API

- URL: <https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services>
- Borrowed:
  - version 3 is the current production route
  - versions 1 and 2 are deprecated on 2 February 2026
  - new integrations should be oriented around the current Service Search route
- Rejected:
  - any implication that legacy versions should remain the default just because they still run before deprecation

### 2. Choosing an Organisation Data Service API

- URL: <https://digital.nhs.uk/services/organisation-data-service/organisation-data-service-apis/choosing-an-organisation-data-service-api>
- Borrowed:
  - ODS mapping should be explicit and API-backed
  - newer FHIR-oriented ODS access is preferred where available
- Rejected:
  - treating ODS lookup as optional metadata rather than a governed provider-identity input

### 3. DoHS API guide to FHIR mappings

- URL: <https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/version-3/dohs-api-guide-to-fhir-mappings>
- Borrowed:
  - DoHS field mapping should stay explicit when we normalize provider records
- Rejected:
  - any assumption that DoHS becomes a full FHIR service contract by itself

### 4. Migrating from the ETP Web Services SOAP API to the Directory of Healthcare Services (Service Search) API

- URL: <https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api>
- Borrowed:
  - strategic discovery should move to DoHS rather than old dispenser lookup mechanisms
  - pharmacy search should stay explicit about organization subtype filters
- Rejected:
  - any posture where legacy dispenser search remains the forever-primary route

### 5. Booking and Referral - FHIR API

- URL: <https://digital.nhs.uk/developer/api-catalogue/booking-and-referral-fhir>
- Borrowed:
  - BaRS is the current strategic referral and booking transport standard
  - environment onboarding and service-identifier discipline matter for transport bindings
- Rejected:
  - collapsing all dispatch-provider bindings into one generic transport row without explicit service and adapter identity

### 6. Booking and Referral Standard

- URL: <https://digital.nhs.uk/services/booking-and-referral-standard>
- Borrowed:
  - BaRS is the strategic interoperability direction for booking and referral flows
- Rejected:
  - any inference that an enabled standard automatically means a non-production provider tuple is configured and ready

### 7. MESH API catalogue entry

- URL: <https://digital.nhs.uk/developer/api-catalogue/Taxonomies/rest/Taxonomies/mesh>
- Borrowed:
  - MESH remains a live transport or infrastructure capability with onboarding implications
  - sandbox and onboarding posture must stay explicit
- Rejected:
  - treating MESH enablement as a simple checkbox without mailbox or endpoint evidence

### 8. NHSmail shared mailbox guidance

- URL: <https://support.nhs.net/knowledge-base/shared-mailbox-guide-for-nhsmail/>
- Borrowed:
  - shared mailboxes are team-owned and administrator-controlled
  - mailbox ownership and access control should remain explicit
- Rejected:
  - using shared mailboxes as if they were generic app credentials to be copied into automation

### 9. Playwright Isolation

- URL: <https://playwright.dev/docs/browser-contexts>
- Borrowed:
  - one clean browser context per environment profile
  - no shared state across environment rehearsals
- Rejected:
  - a single shared browser session for all environment targets

### 10. Playwright Authentication

- URL: <https://playwright.dev/docs/auth>
- Borrowed:
  - storage state can be reused, but sensitive auth state must not be committed
  - auth files belong outside source control
- Rejected:
  - checking privileged browser state into the repository

### 11. Playwright Trace Viewer

- URL: <https://playwright.dev/docs/trace-viewer-intro>
- Borrowed:
  - traces are useful evidence after a run
  - traces should be captured deliberately rather than by default on secret-bearing steps
- Rejected:
  - blanket tracing across credential-entry boundaries

### 12. Playwright Best Practices

- URL: <https://playwright.dev/docs/best-practices>
- Borrowed:
  - keep tests isolated
  - prefer user-visible assertions
  - use traces intentionally for debugging and proof
- Rejected:
  - brittle selector chains or evidence capture that depends on implementation details

## Resulting implementation posture

The 366 implementation uses:

- DoHS as the strategic directory path
- bounded legacy compatibility only
- explicit ODS-coded provider mapping
- explicit transport profile binding for BaRS, MESH, NHSmail, supplier interop, and manual assisted dispatch
- environment-isolated Playwright contexts
- safe evidence only after the secret boundary

The implementation does not claim that manual-bridge environments are approved merely because the manifest exists or the harness can navigate to a rehearsal page.
