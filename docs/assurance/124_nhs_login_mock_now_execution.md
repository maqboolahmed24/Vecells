# 124 NHS Login Mock Now Execution

This document is the repo-owned evidence narrative for the current local NHS-login-like bridge. It is the usable pack for engineering now, and it stays visibly distinct from any future submission dossier.

## Section A — `Mock_now_execution`

### Boundary

- NHS login is modeled here as the patient authentication rail only.
- Vecells still owns local session issue, session expiry, logout, route-intent return, contact-source separation, and post-auth feature authorisation.
- The local mock bridge is evidence for architecture and UX rehearsal only.

### Current Evidence Set

| Evidence ref | What it proves | Current artifact |
| --- | --- | --- |
| `EVID_124_MOCK_PRODUCT_SUMMARY` | product purpose, patient-facing use case, and non-clinical-auth boundary | [`124_nhs_login_onboarding_evidence_pack.md`](./124_nhs_login_onboarding_evidence_pack.md) |
| `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | sign-in entry, callback handling, local session outcomes, logout, and expiry recovery | [`nhs-login-mock-onboarding-evidence.spec.js`](../../tests/playwright/nhs-login-mock-onboarding-evidence.spec.js) |
| `EVID_124_MOCK_CALLBACK_BOUNDARY_RULES` | callback outcomes stay bounded and route-family specific | [`124_nhs_login_user_journeys_and_callback_evidence.md`](./124_nhs_login_user_journeys_and_callback_evidence.md) |
| `EVID_124_MOCK_SCOPE_CLAIM_MATRIX` | every requested scope or claim has one product justification | [`nhs_login_scope_claim_matrix.csv`](../../data/assurance/nhs_login_scope_claim_matrix.csv) |
| `EVID_124_MOCK_ACCESSIBILITY_PROOF` | reduced motion, headings, and mobile viewport continuity | [`nhs-login-mock-onboarding-evidence.spec.js`](../../tests/playwright/nhs-login-mock-onboarding-evidence.spec.js) |

### Journey Inventory In Scope Today

| Journey | Route binding | Scenario | Expected local outcome |
| --- | --- | --- | --- |
| patient sign-in entry | `rb_patient_home` | `happy_path` | `auth_read_only` |
| patient continuation with later local widening check | `rb_patient_requests` | `happy_path` | `local_capability_review` |
| patient action route with strongest current candidate posture | `rb_patient_appointments` | `happy_path` | `writable_candidate` |
| consent denial | `rb_patient_home` | `consent_denied` | `consent_denied` |
| session expiry and recovery | `rb_patient_health_record` | `expired_session` | `re_auth_required` |
| settings-link return | `rb_patient_settings_link` | `settings_return` | `auth_read_only` |
| local logout | any previously returned session | local action | local session cleared and route reopened at sign-in |

### Mock-Only Safety Notes

- `writable_candidate` is still not writable authority by itself. It proves only that a later local capability review may continue.
- `auth_read_only` and `local_capability_review` are positive evidence that the simulator preserves the blueprint fence between identity proof and write permission.
- The IM1 pathway is rehearsed as a blocked or gated route today. It is not a claim that Vecells can request or use `gp_integration_credentials` in actual onboarding now.

## Section B — `Actual_production_strategy_later`

When real onboarding becomes possible, reuse this same pack structure but replace simulator evidence with:

- Digital Onboarding Service application outputs
- sandpit request approval and proof-of-concept walkthrough evidence
- integration-environment request evidence
- technical-conformance output from the integration environment
- actual SCAL, clinical-safety, and connection-agreement evidence

The mock pack is preserved as early architectural rationale, not as fake production evidence.
