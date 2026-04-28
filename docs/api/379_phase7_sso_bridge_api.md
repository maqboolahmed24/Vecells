# 379 Phase 7 SSO Bridge API

## Service

`createDefaultPhase7NhsAppSsoBridgeApplication()` returns the local deterministic application service.

Primary exports:

```ts
import {
  createDefaultPhase7NhsAppSsoBridgeApplication,
  createPhase7SsoLocalSession,
  createPhase7SsoVerifiedBridge,
} from "./phase7-nhs-app-sso-bridge-service";
```

## Routes

The command API route catalog includes:

| Route ID                                 | Method | Path                                                   | Contract                            |
| ---------------------------------------- | ------ | ------------------------------------------------------ | ----------------------------------- |
| `phase7_nhs_app_sso_entry_capture`       | POST   | `/internal/v1/nhs-app/sso/entry:capture`               | `SSOEntryGrantCaptureContract`      |
| `phase7_nhs_app_sso_authorize`           | POST   | `/internal/v1/nhs-app/sso/authorize`                   | `NHSAppSsoAuthorizeRequestContract` |
| `phase7_nhs_app_sso_callback`            | POST   | `/internal/v1/nhs-app/sso/callback`                    | `NHSAppSsoCallbackContract`         |
| `phase7_nhs_app_identity_assertion_bind` | POST   | `/internal/v1/nhs-app/sso/identity-assertion:bind`     | `IdentityAssertionBindingContract`  |
| `phase7_nhs_app_sso_return_disposition`  | POST   | `/internal/v1/nhs-app/sso/return-disposition:evaluate` | `SSOReturnDispositionContract`      |

## `captureAndAuthorize`

Input:

- `environment`
- `journeyPathId`
- `routePath`
- `rawUrl`
- raw `assertedLoginIdentity`
- expected subject and binding fences
- session epoch and subject-binding version refs
- optional embedded context or embedded context input
- optional draft and promotion refs

Output:

- `SSOEntryGrant`
- `AuthBridgeTransaction`
- `ReturnIntent`
- NHS login authorize request with `prompt=none` and `asserted_login_identity`
- redacted supplier redirect URL
- no-store/no-referrer response headers
- callback fixture for deterministic local tests
- audit records

## `handleCallback`

Input:

- `state`
- `nonce`
- `pkceVerifier`
- `code` or NHS login error
- returned NHS login subject and binding refs
- optional existing local session
- optional current embedded context from `378`

Output:

- redeemed `SSOEntryGrant`
- settled `AuthBridgeTransaction`
- `IdentityAssertionBinding`
- `SessionMergeDecision`
- `ReturnIntentValidation`
- `SSOReturnDisposition`
- no-store/no-referrer response headers
- audit records

## Error Outcomes

`access_denied` with `ConsentNotGiven` returns `consent_denied`. Replayed grants or replayed callback transactions return `safe_reentry_required`. State, nonce, PKCE, expiry, subject mismatch, promoted draft, manifest drift, or embedded context drift fail closed into deterministic dispositions.

## Redaction

Persistent stores, audits, logging query strings, and return dispositions never contain raw `assertedLoginIdentity`. The redacted supplier redirect removes the raw parameter and response headers include `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
