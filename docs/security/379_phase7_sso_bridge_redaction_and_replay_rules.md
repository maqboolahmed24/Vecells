# 379 SSO Bridge Redaction And Replay Rules

## Raw Token Handling

`assertedLoginIdentity` is allowed only as transient function input during `captureAndAuthorize`. The bridge immediately:

- hashes the value into `assertedIdentityHash`
- removes `assertedLoginIdentity` from the supplier URL
- creates `SSOEntryGrant`
- emits `Cache-Control: no-store`
- emits `Referrer-Policy: no-referrer`
- records only redacted audit rows

The raw value is not written to `SSOEntryGrant`, `AuthBridgeTransaction`, `ReturnIntent`, `IdentityAssertionBinding`, `SessionMergeDecision`, `SSOReturnDisposition`, audit records, logging query strings, or fixtures that model persistent state.

## Single Redemption

`SSOEntryGrant.maxRedemptions` is always `1`. Callback settlement calls the grant store before identity binding or session merge. If the grant is already consumed, denied, expired, or superseded, the callback returns `safe_reentry_required` and no new session decision is emitted.

## Callback Fences

`AuthBridgeTransaction` stores hashes for state, nonce, and PKCE verifier. Callback handling requires:

- known state
- transaction still awaiting callback
- transaction not expired
- nonce hash match
- PKCE hash match
- code present for success path
- current embedded context still matching the pinned manifest, route family, bridge floor, and live eligibility posture

Replay, late callback, invalid nonce, invalid PKCE, and missing code fail closed.

## Identity And Session Conflict

`IdentityAssertionBinding` must match the entry grant hash, returned NHS login subject, and local binding target. If the returned subject differs from the frozen return intent, the bridge emits a mismatched binding, `terminate_and_reenter`, and `session_conflict`.

Existing local sessions are reused only for the same active subject and binding. Same subject with advanced binding rotates. Different subject terminates and re-enters.

## Return Intent Fences

`ReturnIntent` validation checks subject, session epoch, subject-binding version, manifest version, route family, bridge floor, embedded eligibility, and draft promotion state. A promoted draft cannot reopen mutable draft state; it returns `safe_reentry_required`.
