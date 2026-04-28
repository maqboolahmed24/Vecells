# 367 External Reference Notes

Reviewed on 2026-04-24.

These references are support only. The local blueprint and validated repo contracts remain authoritative where there is any tension.

## Borrowed guidance

### GP Connect: Update Record

Source: [GP Connect: Update Record](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record)

Borrowed:

- Update Record carries consultation summaries for Pharmacy First, Blood Pressure Check, and Pharmacy Contraception.
- Update Record is not the route for urgent actions or referrals to general practice.
- If Update Record is unavailable, pharmacy summary traffic may fall back to NHSmail or letter for filing.

Applied in 367:

- observation rows are modelled separately from transport rows
- urgent return remains forbidden on Update Record rows
- deployment observation stays blocked until evidence exists

### Path to Live and mailbox onboarding

Sources:

- [Connect to a Path to Live environment](https://digital.nhs.uk/services/path-to-live-environments/connect-to-a-path-to-live-environment)
- [Apply for a MESH mailbox](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox)
- [MESH User Interface (UI)](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui)
- [MESH Workflow Groups and Workflow IDs](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids)

Borrowed:

- Path to Live environments and mailbox creation are explicit onboarding steps, not something the repo can silently assume.
- MESH mailbox requests and workflow IDs need environment-specific detail.
- The MESH UI and mailbox issuance remain externally controlled even when browser guidance exists.

Applied in 367:

- MESH request packs stay environment-bound
- `transport_367_mesh_training_mailbox` is requestable and rehearsable, but approval remains external
- the interface gap stays explicit instead of pretending mailbox issuance is complete

### Referral transport API guidance

Sources:

- [Booking and Referral - FHIR API](https://digital.nhs.uk/developer/api-catalogue/booking-and-referral-fhir)
- [Booking and Referral Standard](https://digital.nhs.uk/services/booking-and-referral-standard)
- [DAPB4060: Booking and Referral Standard (BaRS)](https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dapb4060-booking-and-referral-standard-bars)

Borrowed:

- the live BaRS family uses digital onboarding, API platform, and a sandbox-capable service posture
- the transport stack needs to stay aligned with the enabled BaRS transport family and not drift into retired booking interfaces

Applied in 367:

- `transport_367_bars_deployment_preflight` is treated as a request-pack and preflight problem only
- 367 does not widen the enabled transport set beyond the repo-owned dispatch bindings

### Monitored mailbox and urgent return support

Sources:

- [Changes to the GP Contract in 2026/27](https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/)
- [Practices referring patients to Pharmacy First for lower acuity minor illnesses and clinical pathway consultations](https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/)
- [Community pharmacy advanced service specification: NHS Pharmacy First Service](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-%20specification-nhs-pharmacy-first-service/)

Borrowed:

- monitored email and secure referral routes remain part of the operational safety-net around pharmacy communication
- urgent follow-up uses direct communication routes and cannot be quietly reclassified as routine observation

Applied in 367:

- `transport_367_nhsmail_deployment_safetynet` stays `urgent_return_safety_net`
- the request harness and runbook keep monitored mailbox evidence separate from outcome truth

### Playwright guidance

Sources:

- [Playwright Isolation](https://playwright.dev/docs/browser-contexts)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Tracing](https://playwright.dev/docs/api/class-tracing)

Borrowed:

- use isolated browser contexts
- keep storage state local and out of source control
- capture traces as explicit artifacts
- avoid unnecessary external dependencies in harness-driven tests

Applied in 367:

- each browser proof uses local-only contexts
- storage state lives under `output/playwright`
- screenshots and traces are written only after secret-safe checks

## Rejected or not adopted

- We did not adopt any interpretation that lets Update Record become an urgent return or referral transport channel.
- We did not adopt any interpretation that mailbox presence equals dispatch success or outcome truth.
- We did not adopt the retired NHS Booking API as a transport target; 367 stays aligned to BaRS-era transport surfaces already enabled in the repo.
- We did not store real onboarding credentials, live cookies, or external approval artifacts in source control.
- We did not turn external NHS or supplier approvals into repo-local completion claims.
