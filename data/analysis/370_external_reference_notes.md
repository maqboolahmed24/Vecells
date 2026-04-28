# 370 External Reference Notes

Reviewed on 2026-04-27.

These references are support only. The local Phase 6 and Phase 0 blueprints remain authoritative if there is any conflict.

## Borrowed Guidance

### Pharmacy First urgent escalation and referral handling

Source: [Community pharmacy advanced service specification: NHS Pharmacy First Service](https://www.england.nhs.uk/wp-content/uploads/2023/11/PRN00936-i-Community-pharmacy-advanced-service-specification-NHS-pharmacy-first-service-November-2023.pdf)

Borrowed:

- Referrals are sent through an NHS assured Pharmacy First IT system and/or NHSmail shared mailbox.
- Pharmacies must check the service system and shared mailbox regularly during opening hours.
- When additional advice or higher-acuity escalation is needed, the pharmacist uses clinical judgement to choose urgency and route.

Applied in 370:

- urgent return and loop-risk scenarios keep direct professional routing and monitored safety-net posture visible
- shared-mailbox or monitored-route presence is not treated as outcome truth
- provider and transport failures remain exception rows, not quiet background retries

### Update Record boundary for urgent actions

Source: [GP Connect: Update Record](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record)

Borrowed:

- Update Record carries Pharmacy First consultation summaries into GP practice workflow.
- Update Record is not used for urgent actions or referrals to general practice.
- If Update Record is off or unavailable, consultation summaries may fall back to NHSmail or letter.

Applied in 370:

- Update Record rows are asserted as `urgent_return_forbidden`
- urgent returns require direct GP-local communication routes such as NHSmail or telephone
- outcome observation and urgent-return communication stay separate in tests and evidence

### Playwright isolation and trace discipline

Sources:

- [Playwright Isolation](https://playwright.dev/docs/browser-contexts)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright Tracing API](https://playwright.dev/docs/api/class-tracing)

Borrowed:

- use isolated browser contexts for each browser proof family
- retain traces only for failure or controlled debugging surfaces
- when not using the Playwright test runner, use context-scoped tracing if traces are needed

Applied in 370:

- standalone browser scripts create fresh contexts per patient/staff proof path
- PHI-safe deterministic case IDs are used
- no persistent browser state or live credentials are written to source control

## Rejected Or Not Adopted

- We did not adopt any interpretation that turns Update Record into an urgent-return channel.
- We did not treat live NHSmail or GP Connect onboarding as repo-local proof.
- We did not let missing transport, missing acknowledgement, or missing outcome evidence imply completion.
- We did not replace the local recovery, exception, and provider-health contracts with external process copy.

