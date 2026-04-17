# 124 NHS Login Onboarding Evidence Pack

This pack creates one truthful NHS login onboarding scaffold with two separate lanes:

- a local, simulator-backed evidence lane that supports MVP engineering now
- an actual onboarding lane that maps the later NHS login application, environment-request, conformance, and change-control path without pretending Vecells is already ready to submit

The current stage names and forms were re-verified on 2026-04-14 against:

- [Apply for NHS login](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/apply-for-nhs-login)
- [Forms and documents](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/nhs-login-forms-and-documents)
- [Discovery](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/discovery)
- [Integrate](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/integrate)
- [Session management](https://nhsconnect.github.io/nhslogin/session-management/)
- [User Journeys required for assurance](https://digital.nhs.uk/binaries/content/assets/website-assets/services/nhs-login/nhs-login-user-journeys-required-for-assurance-v1.0-20240730.pdf)

## Section A — `Mock_now_execution`

The current repo-owned pack is intentionally non-submittable. It exists to prove the identity architecture, callback/session boundaries, journey inventory, scope rationale, and accessibility posture before real onboarding gates are open.

| Evidence family | Current evidence refs | Current state | Owner | Notes |
| --- | --- | --- | --- | --- |
| product and use-case summary | `EVID_124_MOCK_PRODUCT_SUMMARY` | seeded in repo | `ROLE_IDENTITY_DOMAIN_LEAD` | documents that NHS login is the patient authentication rail and not clinical authorisation |
| user journeys and callback evidence | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS`, `EVID_124_MOCK_CALLBACK_BOUNDARY_RULES` | seeded in repo | `ROLE_IDENTITY_DOMAIN_LEAD` | covers sign-in, consent, callback, local session, logout, and expiry/recovery |
| scope and claim rationale | `EVID_124_MOCK_SCOPE_CLAIM_MATRIX` | seeded in repo | `ROLE_PRODUCT_AND_ASSURANCE_LEAD` | binds every requested scope or claim to an explicit product use |
| accessibility and usability proof | `EVID_124_MOCK_ACCESSIBILITY_PROOF` | seeded in repo | `ROLE_FRONTEND_ACCESSIBILITY_LEAD` | browser evidence covers headings, reduced motion, and narrow viewports |
| environment progression model | `EVID_124_ENVIRONMENT_PROGRESSION_PLAN` | seeded in repo | `ROLE_PROGRAMME_ASSURANCE_LEAD` | separates local rehearsal from sandpit, integration, and production gates |

Mock-now rules:

- Every simulator artifact stays labeled `non_submittable_local_simulator`.
- Callback success may end in `auth_read_only`, `claim_pending`, `local_capability_review`, `writable_candidate`, or recovery. It never implies immediate write authority.
- Session creation, session expiry, and logout stay local Vecells responsibilities even when the upstream identity proof succeeds.
- NHS login email or phone claims are candidate contact inputs only. They do not replace patient preference, GP-held contact truth, or PDS truth.

## Section B — `Actual_production_strategy_later`

The later onboarding lane stays stage-based and blocked until non-simulator prerequisites are real. That later lane follows the current official NHS login path:

1. eligibility, commissioning, sponsorship, and use-case approval
2. Digital Onboarding Service application and discovery preparation
3. sandpit proof-of-concept via the Sandpit Environment Request path
4. integration-environment evidence via the Integration Environment Request path
5. technical conformance and required user-journey capture
6. SCAL, clinical-safety, and connection-agreement progression
7. production environment request and live smoke progression
8. post-live change control through the Live Partner Change Request process

Current actual-later blockers:

- `GAP_NHS_LOGIN_IM1_DEPENDENT_SCOPE_APPROVAL_PENDING`
- `GAP_NHS_LOGIN_COMMISSIONING_AND_SPONSORSHIP_PENDING`
- `GAP_NHS_LOGIN_DOS_APPLICATION_VALUES_PLACEHOLDER_ONLY`
- `GAP_NHS_LOGIN_INTEGRATION_AND_TECHNICAL_CONFORMANCE_PENDING`
- `GAP_NHS_LOGIN_CONNECTION_AGREEMENT_AND_PRODUCTION_PENDING`

## Non-Negotiable Boundary Rules

- NHS login authenticates and verifies the patient identity rail. It does not grant clinical authorisation.
- Callback success may not itself imply claim, writable resume, or PHI-bearing continuation.
- Local session creation must be decided through the governed callback-to-session seam described by `AuthBridge`, `AuthTransaction`, `SessionEstablishmentDecision`, and `RouteIntentBinding`.
- Dependent scopes, especially `gp_integration_credentials`, stay blocked until the external IM1 and onboarding prerequisites are real and approved.
- The local simulator pack can be reused inside the later dossier, but it cannot be submitted as if it were sandpit, integration, or production evidence.

## Pack Verdict

- The mock lane is usable now for architecture review, internal readiness, and feature-boundary rehearsal.
- The actual lane is intentionally withheld and blocker-driven until commissioning, sponsorship, environment access, and dependent integration approvals become real.
