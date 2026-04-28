# Auth Bridge Replay, Redirect, and Token Validation Rules

Task: `par_175_phase2_track_identity_build_auth_bridge_service_with_oidc_transaction_tracking`

## Security Invariants

1. `AuthTransaction` is the only callback fence.
2. `AuthScopeBundle` is the only requested scopes source once authorize begins.
3. `PostAuthReturnIntent` is the only post-auth return target source.
4. The bridge must not create a live session or write patient-reference fields on request or episode records.
5. Raw provider claims and raw token envelopes are passed only to `IdentityEvidenceVaultPort` with `vault_reference_only`.
6. Duplicate or stale callbacks must not repeat evidence, binding, capability, or session-governor effects.

## Replay Rules

| Rule                                      | Enforcement                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| State is persisted as a digest.           | `settleCallback` hashes the callback state and loads `AuthTransaction` by `stateDigest`.    |
| A fresh callback must win CAS.            | `compareAndSetTransaction` requires expected version and `unconsumed` consumption state.    |
| Duplicate callback is not a new callback. | Existing or consumed transactions return `replayed_callback` and no new downstream effects. |
| Expired callback is terminal.             | Callback observed after `expiresAt` settles as `expired_transaction`.                       |
| Unknown state cannot create state.        | Unknown state settles as `internal_fallback` without persistence or port calls.             |

## Redirect Rules

The callback `redirectUri` must exactly match the URI persisted on `AuthTransaction`. The bridge never accepts an arbitrary browser target. Post-auth navigation is derived only from `PostAuthReturnIntent.redirectMode = route_intent_binding_only` and `routeIntentBindingRef`.

The simulator adapter refuses authorize URL construction if the transaction redirect URI is not allowlisted. This follows the OAuth security posture in RFC 9700: redirect targets must be exact and not attacker-controlled.

## Token Validation Rules

| Check                                                                          | Failure outcome            |
| ------------------------------------------------------------------------------ | -------------------------- |
| PKCE verifier digest matches the transaction digest.                           | `token_validation_failure` |
| Provider key id is in the simulator JWKS set and signature is simulator-valid. | `token_validation_failure` |
| `iss` matches provider discovery metadata.                                     | `token_validation_failure` |
| `aud` matches the configured client id.                                        | `token_validation_failure` |
| Token nonce hashes to the transaction nonce digest.                            | `token_validation_failure` |
| `exp` is after callback observation time.                                      | `token_validation_failure` |
| Assurance is at least the frozen `AuthScopeBundle.assuranceRequirement`.       | `insufficient_assurance`   |
| Subject claim exists.                                                          | `token_validation_failure` |

The simulator-backed adapter deliberately models discovery, authorize URL creation, token exchange, and JWKS-style validation as a replaceable provider adapter. A live NHS login adapter must satisfy the same `NhsLoginOidcAdapter` interface and may not change the bridge callback semantics.

## Logging and Storage Rules

The bridge has no token logging path. Application logs may include transaction refs, lifecycle states, outcome codes, and evidence refs, but must not include state tokens, nonce tokens, authorization codes, raw provider claims, raw token envelopes, or session identifiers.

Raw claims move directly into `IdentityEvidenceVaultPort`. Session establishment moves only through `SessionGovernorPort`. `AuthTransaction`, `AuthCallbackSettlement`, and `auth_provider_token_exchanges` store only evidence refs and reason codes.

## Gap Closure Register

| Gap                                                           | Security rule                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_BRIDGE_ISOLATED_OIDC_V1`  | OIDC behavior is adapter-bound and replaceable.                      |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_TRANSACTION_FENCE_CAS_V1` | CAS prevents duplicate callback side effects.                        |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_RETURN_INTENT_ONLY_V1`    | No arbitrary post-auth redirects.                                    |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_SESSION_GOVERNOR_PORT_V1` | Session work is a port call only.                                    |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_EVIDENCE_VAULT_ONLY_V1`   | Raw claim custody is evidence-vault-only.                            |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_REPLAY_EXACT_ONCE_V1`     | Replay returns existing settlement context without repeating writes. |

## References

- NHS login API catalogue: https://digital.nhs.uk/developer/api-catalogue/nhs-login
- NHS mock authorization service: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/testing-with-our-mock-authorisation-service-using-nhs-login---separate-authentication
- RFC 9700 OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
