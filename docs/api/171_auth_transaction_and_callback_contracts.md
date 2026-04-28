# Auth Transaction And Callback Contracts

Status: frozen for Phase 2 auth bridge consumers  
Primary artifacts: `171_auth_transaction.schema.json`, `171_callback_outcome_matrix.csv`

## Endpoint Contract

The auth bridge exposes one conceptual server-side flow:

| Endpoint family                | Contract role                                                             | Route-local code may do                                                    | Route-local code may not do                                            |
| ------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `POST /auth/nhs-login/start`   | Creates `AuthTransaction`, `AuthScopeBundle`, and `PostAuthReturnIntent`. | Pass a route family, lineage, selected anchor, and requested auth purpose. | Construct arbitrary return URLs or raw OIDC parameters.                |
| `GET /auth/nhs-login/callback` | Consumes callback once and emits callback outcome plus session decision.  | Render the returned projection posture.                                    | Validate tokens, create sessions directly, or mutate identity binding. |
| `POST /auth/session/logout`    | Emits `SessionTerminationSettlement`.                                     | Request logout.                                                            | Treat cookie deletion as the only settlement.                          |
| `POST /auth/session/refresh`   | Evaluates reuse, rotate, re-auth, or bounded recovery.                    | Request session projection refresh.                                        | Promote trust without a session decision.                              |

## Authorization-Code Transaction Requirements

Every `AuthTransaction` must include:

| Required input            | Contract rule                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `stateDigest`             | Generated server side, bound to transaction, compared on callback.                                    |
| `nonceDigest`             | Generated server side and checked against validated token evidence.                                   |
| `pkceChallengeDigest`     | Generated server side with method `S256`; code verifier never leaves server-side transaction storage. |
| `issuerRef`               | Must match configured NHS login or simulator issuer.                                                  |
| `audienceRef`             | Must match configured client/audience reference.                                                      |
| `redirectUriRef`          | Must be an allowlisted callback reference, not a user string.                                         |
| `scopeBundleRef`          | Must match the frozen authorize request and callback validation bundle.                               |
| `postAuthReturnIntentRef` | Must bind the later return route without arbitrary redirect widening.                                 |

## Callback Consumption Fence

Callbacks are consumed through a compare-and-swap fence:

1. Load `AuthTransaction` by server-side transaction reference.
2. Reject if TTL expired before callback consumption.
3. Compare state, nonce, PKCE, issuer, audience, redirect URI, and scope bundle.
4. Atomically move `callbackFence.consumptionState` from `unconsumed` to `consumed`.
5. If the callback was already consumed, emit `replayed_callback`.
6. Validate token evidence and store only a vaulted evidence reference.
7. Emit exactly one `SessionEstablishmentDecision`.

Callback replay, expired transaction, and token validation failure are explicit outcomes. They are never treated as generic errors.

## Callback Outcome Matrix

The matrix is authoritative and must have a row for every callback outcome.

| Outcome                    | Fallback disposition        | Session decision   | Projection posture |
| -------------------------- | --------------------------- | ------------------ | ------------------ |
| `success`                  | `bind_current_route_intent` | `create_fresh`     | `signed_in`        |
| `consent_declined`         | `same_shell_recovery`       | `bounded_recovery` | `consent_declined` |
| `insufficient_assurance`   | `re_auth_required`          | `bounded_recovery` | `re_auth_required` |
| `expired_transaction`      | `stale_return`              | `bounded_recovery` | `stale_return`     |
| `replayed_callback`        | `deny_replay`               | `deny`             | `bounded_recovery` |
| `token_validation_failure` | `deny_validation`           | `deny`             | `bounded_recovery` |
| `linkage_unavailable`      | `claim_or_read_only`        | `bounded_recovery` | `claim_pending`    |
| `internal_fallback`        | `bounded_safe_options`      | `bounded_recovery` | `bounded_recovery` |

## Return Intent Validation

`PostAuthReturnIntent` can degrade only through serialized dispositions:

`redirectMode` is fixed to `route_intent_binding_only`; callbacks may resolve only a stored route intent binding, never a free URL or browser-supplied redirect target.

| Validation failure                | Allowed disposition                                |
| --------------------------------- | -------------------------------------------------- |
| Stale lineage or binding version  | `stale_return` or `bounded_recovery`.              |
| Subject mismatch                  | `subject_conflict` and no patient-specific reveal. |
| Stale session epoch               | `re_auth_required` or `bounded_recovery`.          |
| Route family mismatch             | `deny` or safe signed-out entry.                   |
| Stale channel or manifest posture | `read_only` or `bounded_recovery`.                 |

The bridge must not use `window.location`, browser memory, a query parameter, or a referrer as return authority. Only `routeIntentBindingRef` can become a route.

## Security Event Shape

Security logging records:

| Field family     | Allowed form                                                      |
| ---------------- | ----------------------------------------------------------------- |
| Transaction refs | `authTransactionId`, `scopeBundleRef`, `postAuthReturnIntentRef`. |
| Outcome          | Matrix outcome and reason code.                                   |
| Provider detail  | Issuer/audience references, not raw claims or tokens.             |
| Evidence         | Vault evidence envelope reference and digest.                     |
| Patient shell    | Projection posture and copy key.                                  |

Raw tokens, claims, NHS numbers, callback query payloads, and PHI-rich values are forbidden in logs, metrics labels, DOM attributes, URLs, screenshots, and telemetry.
