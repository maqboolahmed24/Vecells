# 379 Algorithm Alignment Notes

## Upstream Inputs

- `373` marks `par_379` ready under `open_phase7_with_constraints`.
- `375` freezes `SSOEntryGrant`, `AuthBridgeTransaction`, `IdentityAssertionBinding`, `SessionMergeDecision`, `ReturnIntent`, and `SSOReturnDisposition`.
- `377` provides immutable manifest and route truth.
- `378` provides server-owned embedded context, shell policy, session projection, and route-scoped nav eligibility.
- Phase 2 identity law requires governed auth transactions, explicit local-session decisions, and non-arbitrary post-auth return intents.

## Implementation Alignment

- Raw asserted identity capture and redaction: `captureAndAuthorize`
- `SSOEntryGrantStore`: `SSOEntryGrantStore`
- `AuthBridgeTransactionStore`: `AuthBridgeTransactionStore`
- Authorize request builder: `buildAuthorizeRequest`
- Callback handler and verifier: `handleCallback`
- `IdentityAssertionBinding` service: `createIdentityAssertionBinding`
- `SessionMergeDecision` resolver: `resolveSessionMergeDecision`
- `ReturnIntent` validator: `validateReturnIntent`
- `SSOReturnDisposition` builder: `buildDisposition`
- Audit-safe emitters: `NhsAppSsoBridgeRecordStore.recordAudit`

## Gap Closures

| Gap | Closure |
| --- | --- |
| Raw asserted identity leaks into the platform | raw input is hashed, supplier URL is redacted, no-store/no-referrer headers are emitted, persistent stores use hashes only |
| Single redemption exists only in prose | `SSOEntryGrant.maxRedemptions = 1`, callback redemption is fenced, replay returns `safe_reentry_required` |
| Asserted identity and local subject silently diverge | `IdentityAssertionBinding` mismatches return `session_conflict` and no silent merge |
| Existing session hides a subject conflict | `SessionMergeDecision` terminates and re-enters on different subject |
| Stale return intent reopens wrong journey | `ReturnIntent` validates subject, session epoch, binding version, manifest, route family, bridge floor, embedded eligibility, and draft promotion |

## Disposition Coverage

The implementation emits all required outcomes:

- `silent_success`
- `consent_denied`
- `silent_failure`
- `manifest_drift`
- `context_drift`
- `session_conflict`
- `safe_reentry_required`

Downstream frontend and testing tracks must consume these outcomes rather than reconstructing callback edge cases in the browser.
