# Auth Bridge Authorize and Callback Contract

Task: `par_175_phase2_track_identity_build_auth_bridge_service_with_oidc_transaction_tracking`

## Routes

| Route                          | Method | Contract                      | Idempotency                                                                                 |
| ------------------------------ | ------ | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `/identity/auth/nhs/authorize` | `POST` | `AuthBridgeAuthorizeContract` | Required. The command may be retried before the browser redirect is issued.                 |
| `/identity/auth/nhs/callback`  | `POST` | `AuthBridgeCallbackContract`  | Not required. The `AuthTransaction` state digest and CAS version are the idempotency fence. |

These routes are published in `services/command-api/src/service-definition.ts`. The testable service implementation is `createAuthBridgeApplication()` in `services/command-api/src/auth-bridge.ts`.

## Authorize Request

```json
{
  "routeIntentBindingRef": "RIB_175_SIGNED_IN_TRACK_REQUEST_V1",
  "lineageRef": "lineage_phase2_auth_bridge_175",
  "routeFamilyRef": "rf_signed_in_track_request",
  "subjectRef": null,
  "bindingVersionRef": null,
  "sessionEpochRef": null,
  "channelManifestRef": "manifest_phase2_patient_web_v1",
  "selectedAnchorRef": "track-request",
  "allowedNextSurface": "signed_in_track_request",
  "staleDisposition": "recover_with_same_route_family",
  "requestedScopes": ["openid", "profile", "email", "nhs_login_identity"],
  "assuranceRequirement": "nhs_p9"
}
```

## Authorize Response

```json
{
  "authorizeUrl": "https://auth.login.nhs.uk/authorize?...",
  "stateToken": "auth_state_redacted_for_browser",
  "transaction": {
    "flow": "server_authorization_code_pkce",
    "consumptionState": "unconsumed",
    "callbackOutcome": "pending"
  },
  "scopeBundle": {
    "requestedScopes": ["openid", "profile", "email", "nhs_login_identity"],
    "rawClaimStorageRule": "vault_reference_only",
    "offlineAccessPolicy": "offline_access_forbidden"
  },
  "returnIntent": {
    "redirectMode": "route_intent_binding_only",
    "routeIntentBindingRef": "RIB_175_SIGNED_IN_TRACK_REQUEST_V1"
  }
}
```

The authorize URL carries the raw state and nonce for the browser flow. Persistence stores digests only. `AuthScopeBundle` is the sole requested-scope source after this point, and `PostAuthReturnIntent` is the sole return target source.

## Callback Request

```json
{
  "state": "auth_state_from_provider_callback",
  "code": "provider_authorization_code",
  "redirectUri": "https://patient.vecells.local/auth/nhs/callback"
}
```

Provider error callbacks use the same state and redirect URI with `error` and optional `errorDescription` instead of `code`.

## Callback Response

```json
{
  "settlement": {
    "outcome": "success",
    "lifecycleAfter": "settled_success",
    "evidenceVaultRef": "auth_claim_snapshot_auth_txn_1",
    "bindingIntentRef": "identity_binding_intent_auth_txn_1",
    "capabilityIntentRef": "capability_intent_auth_txn_1",
    "sessionGovernorDecisionRef": "session_governor_decision_auth_txn_1"
  },
  "replayed": false,
  "sideEffects": {
    "evidenceVaultWrite": true,
    "bindingIntentWrite": true,
    "capabilityIntentWrite": true,
    "sessionGovernorCall": true,
    "directSessionWrite": false,
    "requestPatientReferenceWrite": false,
    "episodePatientReferenceWrite": false
  }
}
```

## Callback Outcomes

| Outcome                    | Trigger                                                                                                | Downstream side effects                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `success`                  | Fresh state, exact redirect URI, valid code, valid token, matching nonce, sufficient assurance.        | Evidence vault, binding-intent, capability-intent, and session-governor port calls. |
| `consent_declined`         | Provider returns `access_denied` or `consent_declined`.                                                | None.                                                                               |
| `insufficient_assurance`   | Provider error or validated token assurance below `AuthScopeBundle.assuranceRequirement`.              | None.                                                                               |
| `expired_transaction`      | Callback observed after `AuthTransaction.expiresAt`.                                                   | None.                                                                               |
| `replayed_callback`        | Duplicate, stale, or already-consumed callback.                                                        | None; the existing settlement is referenced.                                        |
| `token_validation_failure` | Missing code, redirect mismatch, invalid issuer, audience, nonce, expiry, signature, or PKCE verifier. | None.                                                                               |
| `linkage_unavailable`      | Provider or future binding authority indicates link continuation is unavailable.                       | None in this slice.                                                                 |
| `internal_fallback`        | Unknown state or unsupported provider error.                                                           | None.                                                                               |

## Idempotency and Replay

The callback endpoint does not accept a client idempotency key because replay authority is the transaction itself. A fresh callback must CAS from `unconsumed` to `consumed`, `expired`, or `invalid`. A duplicate callback returns a derived `replayed_callback` response and does not write a second `AuthCallbackSettlement`.

## Contract Data

- `data/analysis/175_callback_state_matrix.csv` enumerates callback states, lifecycle transitions, port side effects, and recovery outcomes.
- `data/analysis/175_auth_replay_and_recovery_cases.json` enumerates replay, redirect, token, evidence-vault, and session-governor cases.

## Port and Reference Notes

Successful callbacks write raw NHS login claims only through `IdentityEvidenceVaultPort`, then hand evidence and subject refs to `IdentityBindingAuthorityPort`, `CapabilityDecisionPort`, and `SessionGovernorPort`. The bridge follows RFC 9700 redirect and PKCE guidance and OWASP logging guidance by not logging state tokens, authorization codes, raw claims, raw token envelopes, or session identifiers.
