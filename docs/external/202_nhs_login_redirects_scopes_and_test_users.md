# 202 NHS Login Redirects, Scopes, And Test Users

Task: `seq_202`  
Visual mode: `Identity_Config_Control_Board`  
Primary contract: `data/contracts/202_nhs_login_client_config_manifest.json`

## Outcome

This pack defines the Vecells NHS login client configuration without mutating NHS login provider state. It gives operators one versioned source for redirect URIs, scope bundles, `PostAuthReturnIntent` routing, test-user coverage, environment gates, redaction, and rollback posture.

The implementation is mock-first. Local and sandpit-like twin lanes are executable now in `dry_run`; sandpit and integration provider-console mutation remain blocked until explicit gates pass and redaction is enabled.

## Source Rules

- NHS login product entry must keep the standard NHS login button visible and unmodified.
- Requested data must be minimum necessary for the route family and transaction.
- Vecells owns local session management, logout, cookie rotation, CSRF, and post-auth route authorization.
- Provider callbacks may not carry arbitrary return URLs. They must resolve through `PostAuthReturnIntent`.
- Redirect inventory is governed through opaque `state` routing so callback sprawl does not exceed the NHS login redirect URI ceiling.
- Sandpit, integration, and future production are separate postures with different evidence expectations.
- Test users are personas bound to coverage, environment, and secret references. Raw credentials are not stored in the repository.

Official guidance references are recorded in the manifest:

- NHS login integration toolkit: `https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works`
- Multiple redirect URIs: `https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/`
- Environment comparison: `https://nhsconnect.github.io/nhslogin/compare-environments/`
- Test data: `https://nhsconnect.github.io/nhslogin/test-data/`

## Redirect Strategy

The manifest intentionally registers one patient portal callback path and one recovery callback path per environment. Route-specific return is handled by `statePrefix` and `PostAuthReturnIntent` patterns, not by registering one redirect URI per patient surface.

This closes redirect sprawl:

- `redirect_patient_portal_callback` owns normal patient route families.
- `redirect_recovery_bridge_callback` owns recovery and contact-repair return families.
- Every route family has exactly one owner, one `statePrefix`, and one `PostAuthReturnIntent` pattern.
- `arbitraryReturnUrlAllowed` is always `false`.

See `data/analysis/202_redirect_uri_matrix.csv` and `data/analysis/202_redirect_state_routing_plan.csv`.

## Scope Strategy

The scope bundle matrix is deliberately narrow:

- `scope_auth_contact_minimum` requests `openid email` for sign-in uplift and recovery where profile data is not needed.
- `scope_patient_profile` requests `openid profile email` only where patient identity candidate resolution is needed.
- `scope_im1_pairing_disabled` proves `gp_integration_credentials` is blocked for this phase unless future IM1 approval exists.

Forbidden by this pack:

- `offline_access`
- `gp_integration_credentials` unless an explicit future IM1 gate is approved
- any broad profile extension without route-family justification

Vecells local capability rules still decide whether an authenticated user can view or mutate anything after callback validation.

## Test User Strategy

Test users are coverage personas, not ad hoc QA notes:

- `persona_auth_read_only` covers repeat sign-in and read-only portal entry.
- `persona_claim_pending` covers request claim and patient-link candidate resolution.
- `persona_recover_only` covers stale state and expired transaction handling.
- `persona_high_assurance` covers higher-assurance request-detail and identity-hold paths.
- `persona_consent_denied` proves no local session is created when share consent is denied.

Credential values live outside the repository through `secret://` references. The matrix stores no passwords, OTPs, raw NHS numbers, or provider-issued identifiers.

## Validation

Run:

```bash
pnpm validate:nhs-login-client-config
pnpm exec tsx tests/playwright/202_nhs_login_config_control_board.spec.ts --run
pnpm exec tsx tools/playwright/202_nhs_login_console_harness.ts --run
```

The validator blocks duplicate redirects, route-family gaps, over-broad scopes, raw secrets, missing evidence gates, missing rollback rules, and missing browser proof anchors.
