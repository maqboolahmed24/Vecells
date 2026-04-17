# Auth Bridge Service Design

Task: `par_175_phase2_track_identity_build_auth_bridge_service_with_oidc_transaction_tracking`

## Purpose

The auth bridge is the only phase-2 command-api component that owns NHS login OIDC authorize and callback settlement. It creates a frozen `AuthScopeBundle`, a frozen `PostAuthReturnIntent`, and an `AuthTransaction` callback fence before redirecting the browser. Callback handling consumes the transaction with compare-and-set semantics and emits only port calls to future identity owners.

## Authoritative Objects

| Object | Owner in this slice | Rule |
| --- | --- | --- |
| `AuthTransaction` | `services/command-api/src/auth-bridge.ts` | The only callback fence. State, nonce, PKCE, redirect URI, lifecycle, callback outcome, and CAS version live here. |
| `AuthScopeBundle` | `services/command-api/src/auth-bridge.ts` | The sole requested scopes source after authorize begins. It freezes `openid profile email nhs_login_identity`, assurance requirement, and `vault_reference_only`. |
| `PostAuthReturnIntent` | `services/command-api/src/auth-bridge.ts` | The sole post-auth return target source. It stores route-intent binding, lineage, route family, session epoch ref, channel manifest, selected anchor, and `route_intent_binding_only`. |
| `AuthCallbackSettlement` | `services/command-api/src/auth-bridge.ts` | The callback result record. It points at evidence, binding, capability, and session-governor refs but never creates those objects directly. |

The bridge does not write request or episode patient-reference fields and does not create live sessions. It forwards subject and evidence refs to dedicated ports only.

## Flow

1. `beginAuthorize` receives route context and desired assurance.
2. The service creates `AuthScopeBundle`, `PostAuthReturnIntent`, and `AuthTransaction`.
3. The simulator-backed `NhsLoginOidcAdapter` discovers metadata, creates an authorize URL, uses `server_authorization_code_pkce`, and binds S256 PKCE, state, nonce, issuer, and exact redirect URI.
4. `settleCallback` hashes incoming state and loads the matching `AuthTransaction`.
5. A stale, duplicate, or already-settled callback returns `replayed_callback` without repeated evidence, binding, capability, or session-governor effects.
6. A fresh callback CAS-consumes the transaction before exchanging the code.
7. Successful validation writes raw claims only to `IdentityEvidenceVaultPort`, then emits `IdentityBindingAuthorityPort`, `CapabilityDecisionPort`, and `SessionGovernorPort` calls.
8. Failure paths settle as `consent_declined`, `insufficient_assurance`, `expired_transaction`, `token_validation_failure`, `linkage_unavailable`, or `internal_fallback`.

## Persistence

Migration `services/command-api/migrations/090_phase2_auth_bridge.sql` adds:

| Table | Purpose |
| --- | --- |
| `auth_scope_bundles` | Frozen requested scopes and assurance requirements. |
| `post_auth_return_intents` | Frozen route-intent-bound post-auth return targets. |
| `auth_transactions` | Callback fence, digest state, digest nonce, digest verifier, lifecycle, CAS version, and settlement refs. |
| `auth_callback_settlements` | Exact-once callback settlement records. |
| `auth_provider_token_exchanges` | Token validation audit without raw tokens or raw claims. |

The migration adds `idx_auth_transactions_callback_fence` over transaction id, version, and consumption state so a live adapter can implement the same compare-and-set rule with database locking.

## Ports

| Port | Boundary |
| --- | --- |
| `IdentityEvidenceVaultPort` | Receives raw claims and token envelope with `vault_reference_only`; returns an evidence ref. |
| `IdentityBindingAuthorityPort` | Receives subject, evidence, assurance, and route-intent binding refs; returns a binding-intent ref. |
| `CapabilityDecisionPort` | Receives the scope bundle and return-intent refs; returns a capability-intent ref. |
| `SessionGovernorPort` | Receives refs and the frozen `PostAuthReturnIntent`; returns a session-governor decision ref. |

These are phase-2 shared seams, not local implementations of identity vault, session governance, binding authority, or capability policy.

## Parallel Interface Gaps Closed

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_BRIDGE_ISOLATED_OIDC_V1` | OIDC discovery, authorize URL, token exchange, and JWKS-style validation are isolated behind `NhsLoginOidcAdapter`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_TRANSACTION_FENCE_CAS_V1` | `AuthTransaction` state digest and CAS version are the only callback fence. |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_RETURN_INTENT_ONLY_V1` | `PostAuthReturnIntent` is the only post-auth target source. No arbitrary callback return URL is accepted. |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_SESSION_GOVERNOR_PORT_V1` | The bridge emits a session-governor port call and performs no local session write. |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_EVIDENCE_VAULT_ONLY_V1` | Raw claims are passed only to the evidence vault port and stored as refs elsewhere. |
| `PARALLEL_INTERFACE_GAP_PHASE2_AUTH_REPLAY_EXACT_ONCE_V1` | Duplicate callbacks return a replay settlement and do not repeat downstream side effects. |

## External References

NHS login is documented by NHS England Digital as an OpenID Connect integration, and the NHS mock authorization service guidance requires a standard OIDC authorization code flow and browser redirect to the registered callback endpoint. RFC 9700 guides the exact redirect and PKCE stance used here. OWASP logging guidance is applied by keeping tokens, session identifiers, and sensitive personal data out of application logs.

References:

- NHS login API catalogue: https://digital.nhs.uk/developer/api-catalogue/nhs-login
- NHS mock authorization service: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/testing-with-our-mock-authorisation-service-using-nhs-login---separate-authentication
- NHS login interface specification index: https://nhsconnect.github.io/nhslogin/interface-spec-doc/
- RFC 9700 OAuth 2.0 Security Best Current Practice: https://www.rfc-editor.org/rfc/rfc9700.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
