# 124 NHS Login Actual Onboarding Strategy Later

This document defines the later real onboarding path and keeps it separate from the current simulator-backed pack.

## Section A — `Mock_now_execution`

The current mock-now lane is the preparation substrate only:

- it proves the current route, callback, session, and claim-boundary design
- it gives engineering and assurance owners one stable artifact structure to extend later
- it does not claim eligibility, sponsorship, sandpit access, integration access, or production readiness

## Section B — `Actual_production_strategy_later`

### Staged Path

| Stage | Official path | What must be true before entering | Current status |
| --- | --- | --- | --- |
| application and eligibility | `Apply for NHS login` and Digital Onboarding Service | commissioned or sponsored service, England-only patient use case, product fit, non-UK hosting review complete | blocked |
| discovery and DOS preparation | DOS product onboarding, preparation for application review call and product demo | named commissioner or sponsor, first product summary, scope rationale, route summary | blocked |
| sandpit request and proof of concept | Sandpit Environment Request plus discovery-stage proof of concept | approved use case and developer account, client metadata, redirect pack, public key, scoped proof-of-concept plan | blocked |
| integration request | Integration Environment Request | sandpit proof-of-concept complete, environment-specific redirect plan, named contact and test plan | blocked |
| technical conformance and journey assurance | Technical Conformance Report and required user-journey evidence | integration environment access, route-specific journey capture, policy-complete callback/session evidence | blocked |
| SCAL and safety alignment | SCAL plus clinical-safety companion evidence | integration evidence, assurance-level signoff, dependent interoperability pack maturity | blocked |
| production progression | Connection Agreement plus Production Environment Request | successful conformance, legal and operational approval, live smoke-test plan | blocked |
| post-live change control | Live Partner Change Request | live partner configuration exists and changes are governed | blocked |

### Current Official Facts Anchoring The Plan

- As of the `Apply for NHS login` page verified on 2026-04-14, NHS login eligibility still depends on an England-only patient service, health or social care benefit, free-at-point-of-delivery posture, and commissioning or sponsorship by an NHS organisation or local authority.
- The same official page still states that NHS login does not cover clinical authorisation.
- The `Forms and documents` page verified on 2026-04-14 still exposes the Digital Onboarding Service, Sandpit Environment Request Form, Integration Environment Request Form, Technical Conformance Report, User Journeys Required for Assurance, Clinical Safety Requirements, SCAL, Connection Agreement, Production Environment Request Form, and Live Partner Change Request Form as distinct onboarding artifacts.
- The `Discovery` page still requires a proof of concept in sandpit and points partners to the Sandpit Environment Request Form.
- The `Integrate` page still states that SCAL evidence must come from the integration environment rather than sandpit.

### Conversion Rules

1. Keep the route-binding, callback, and scope matrix identifiers stable across mock and actual lanes.
2. Replace placeholder application answers only when a real commissioner or sponsor, environment host, and product deployment posture exist.
3. Treat `gp_integration_credentials` and any IM1-dependent claim as blocked until the IM1 and SCAL companion lane is real.
4. Preserve the architectural rule that session management and logout remain partner responsibilities in every environment.
5. Replace simulator journey captures with environment-specific captures only after the corresponding official gate is open.

### Explicit Non-Claims

- The current repo does not claim that Vecells is already approved by the NHS login Partner Integration Board.
- The current repo does not claim that sandpit, integration, or production credentials exist.
- The current repo does not claim that actual SCAL or connection-agreement evidence is complete.
