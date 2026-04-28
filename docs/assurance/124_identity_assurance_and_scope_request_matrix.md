# 124 Identity Assurance And Scope Request Matrix

This document is the human-readable counterpart to [`nhs_login_scope_claim_matrix.csv`](../../data/assurance/nhs_login_scope_claim_matrix.csv).

## Section A — `Mock_now_execution`

The current request set is intentionally narrow and tied to route families already present in the local bridge.

| Bundle | Requested scopes | Main routes | Assurance assumption | Current status |
| --- | --- | --- | --- | --- |
| `sb_auth_contact_minimum` | `openid email phone` | intake upgrade, settings-link return | `P0` sign-in is sufficient for bounded read-only continuation | seeded in mock pack |
| `sb_patient_profile` | `openid profile email phone` | patient home, requests, messages, secure-link recovery | `P5` or `P9` identity proof, but write posture still remains bounded | seeded in mock pack |
| `sb_patient_profile_extended` | `openid profile profile_extended email phone` | appointments and health record | `P9` for strongest continuity path; write still depends on local capability | seeded in mock pack |
| `sb_gp_im1_pairing` | `openid profile email phone gp_integration_credentials` | IM1 pairing only | `P9` plus explicit IM1 readiness and later external approval | blocked outside mock gate |

Scope and claim rules:

- `openid` is mandatory on every path.
- `profile` is used instead of `basic_demographics`.
- contact claims are candidate inputs only and may not override local preference, GP truth, or PDS truth.
- IM1-linked scopes and claims remain blocked until external prerequisites become real.

## Section B — `Actual_production_strategy_later`

The later request dossier must keep the same bundle names and route references, but it must add:

- named product-purpose justification for each approved environment
- confirmed assurance-level and vector-of-trust expectations per feature family
- actual onboarding-stage approval state for any IM1-dependent request
- evidence that contact claims are handled as candidate data rather than authority

## Current Sensitive Rows

| Ref | Why it is sensitive | Current rule |
| --- | --- | --- |
| `profile_extended` | wider patient detail surface for appointments and health record | still bounded by local capability and route-intent law |
| `gp_integration_credentials` | external interoperability dependency and IM1 gate | blocked until actual IM1 pairing and NHS approval are real; [`par_123`](./123_im1_prerequisite_readiness_pack.md) now supplies the companion readiness pack |
| `nhs_number` | direct patient identifier | may support matching and continuity, but must not imply automatic feature access |
| `email`, `phone_number` | user contact claims | may not overwrite patient preference or authoritative contact route records |
