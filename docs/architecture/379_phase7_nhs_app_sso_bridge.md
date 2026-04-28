# 379 Phase 7 NHS App SSO Bridge

## Boundary

`Phase7NhsAppSsoBridge` is the executable backend kernel for NHS App SSO handoff and local session continuity. It consumes the `375` SSO contracts, manifest truth from `377`, and embedded context/session truth from `378`.

The implementation lives in `services/command-api/src/phase7-nhs-app-sso-bridge-service.ts`. It is production-shaped deterministic backend code with local fixtures. Live NHS login credentials, issuer keys, and externally approved production configuration can replace the local adapter later without changing the contract shape.

## Owned Capabilities

- raw `assertedLoginIdentity` capture, hash, and immediate URL redaction
- `SSOEntryGrantStore` with single-redemption fencing
- `AuthBridgeTransactionStore` with state, nonce, PKCE, expiry, and callback-consumption checks
- NHS login authorize request builder using `prompt=none` and `asserted_login_identity`
- callback handler for silent success, `ConsentNotGiven`, replay, expiry, and validation failure
- `IdentityAssertionBinding` creation
- `SessionMergeDecision` resolution for reuse, rotate, terminate-and-re-enter, or deny
- `ReturnIntent` validation against subject, session epoch, subject binding, manifest version, route family, bridge floor, and embedded eligibility
- `SSOReturnDisposition` for `silent_success`, `consent_denied`, `silent_failure`, `manifest_drift`, `context_drift`, `session_conflict`, and `safe_reentry_required`
- audit-safe event records and no-store/no-referrer response headers

## Flow

1. NHS App launches a journey with `assertedLoginIdentity`.
2. The bridge captures the raw value only in memory, hashes it, removes it from the supplier URL, emits no-store/no-referrer headers, and creates one `SSOEntryGrant`.
3. The bridge creates one `AuthBridgeTransaction` and one governed `ReturnIntent` pinned to manifest, session, route family, bridge floor, release freeze, continuity, and route-freeze refs.
4. The authorize request uses `prompt=none` and the converted `asserted_login_identity` parameter. Persistent rows store only redacted or hashed values.
5. Callback processing validates state, nonce, PKCE, expiry, grant redemption, context fences, assertion binding, session merge, and return intent before any session is reused or rotated.
6. Non-success outcomes return one `SSOReturnDisposition` instead of raw controller redirects.

## Return Intent Law

`ReturnIntent` is not a URL. It carries the post-auth route plus fences:

- `subjectRef`
- `sessionEpochRef`
- `subjectBindingVersionRef`
- `manifestVersionRef`
- `routeFamilyRef`
- `minimumBridgeCapabilitiesRef`
- `releaseApprovalFreezeRef`
- `continuityEvidenceRef`
- `routeFreezeDispositionRef`

If a submission promotion record exists, the bridge refuses mutable draft resume and returns `safe_reentry_required`. If manifest or embedded context posture drifts, it returns `manifest_drift` or `context_drift`.

## Session Merge Law

NHS login success is not a local session. `SessionMergeDecision` is emitted before local-session reuse or rotation:

- same active subject and binding: `reuse`
- no session, stale session, or same subject with advanced binding: `rotate`
- different subject or mismatched assertion: `terminate_and_reenter`
- invalid callback or denied assertion: `deny`

No existing local session may hide a subject conflict.

## Non-Production Safety

The local authorize adapter records `asserted_login_identity` as a redacted forwarding value and never stores the raw token. Production must replace the adapter with live NHS login configuration while preserving `SSOEntryGrant`, `AuthBridgeTransaction`, `IdentityAssertionBinding`, `SessionMergeDecision`, `ReturnIntent`, and `SSOReturnDisposition` semantics.
