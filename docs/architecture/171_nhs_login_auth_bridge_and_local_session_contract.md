# NHS Login Auth Bridge And Local Session Contract

Status: frozen for Phase 2 implementation planning  
Task: `seq_171_phase2_freeze_nhs_login_auth_transaction_and_local_session_contracts`

This document freezes the Phase 2 NHS login bridge and local session contract. It consumes the trust kernel from task `170` and keeps authentication, patient linkage, ownership claim, access grant, and local session posture separate.

Live NHS login credentials can replace simulator-backed provider evidence later, but they must preserve this contract shape: server-side authorization-code flow, `AuthTransaction` lifecycle, callback outcome matrix, governed `PostAuthReturnIntent`, explicit `SessionEstablishmentDecision`, and `SessionTerminationSettlement`.

## Contract Stack

| Contract | Purpose | Non-negotiable boundary |
| --- | --- | --- |
| `AuthTransaction` | Server-side NHS login authorization transaction with PKCE, state, nonce, issuer/audience validation, and callback-consumption fencing. | No raw tokens, claims, callback payloads, or user-supplied return URLs in hot rows. |
| `AuthScopeBundle` | Frozen requested-scope, assurance, consent-copy, and disclosure bundle. | The authorize request and callback validation must reference the same bundle version. |
| `PostAuthReturnIntent` | Governed post-auth return model. | Converts to exactly one `RouteIntentBinding`; never stores an arbitrary redirect URL. |
| `SessionEstablishmentDecision` | Local Vecells session decision emitted after callback validation. | Identity-provider success is only an input; it is not a session. |
| `SessionTerminationSettlement` | Settlement for logout, idle timeout, absolute timeout, revocation, downgrade, and stale return. | Cookie disappearance is not the authority. |
| `SessionProjectionContract` | Patient-shell posture grammar for signed-in and recovery states. | No PHI-rich or writable reveal before trust and session fences succeed. |

## Auth Bridge Lifecycle

The auth bridge owns OIDC transaction state and callback consumption. Route handlers may initiate a transaction request but must not implement OIDC validation locally.

| Lifecycle | Meaning | Required fence |
| --- | --- | --- |
| `initialized` | Server created an auth transaction and bound scope bundle plus return intent. | State, nonce, PKCE, and callback route references exist. |
| `authorize_redirect_issued` | Browser was sent to NHS login or simulator. | Transaction TTL and state digest are active. |
| `callback_received` | Callback reached the bridge. | No session exists yet. |
| `callback_consumed` | Compare-and-swap consumed the callback once. | Replays deny or bounded-recover. |
| `token_validated` | Issuer, audience, nonce, PKCE, and token envelope validation passed. | Raw values remain vaulted. |
| `session_decision_emitted` | Local session decision was emitted. | Grant ceiling and projection posture are explicit. |
| `settled_success` | Session and return intent were settled safely. | RouteIntentBinding controls navigation. |
| `settled_recovery` | Same-shell recovery is shown. | No arbitrary redirect or PHI reveal. |
| `settled_denied` | Callback cannot proceed. | Security event is logged with redacted details. |
| `expired`, `replayed`, `failed_validation` | Fail-closed callback outcomes. | Fallback disposition is matrix-driven. |

## Callback Outcomes

The callback outcome matrix in `data/analysis/171_callback_outcome_matrix.csv` is authoritative. It serializes every required outcome:

| Callback outcome | Default session decision | Patient-shell projection |
| --- | --- | --- |
| `success` | `create_fresh` | `signed_in` |
| `consent_declined` | `bounded_recovery` | `consent_declined` |
| `insufficient_assurance` | `bounded_recovery` | `re_auth_required` |
| `expired_transaction` | `bounded_recovery` | `stale_return` |
| `replayed_callback` | `deny` | `bounded_recovery` |
| `token_validation_failure` | `deny` | `bounded_recovery` |
| `linkage_unavailable` | `bounded_recovery` | `claim_pending` |
| `internal_fallback` | `bounded_recovery` | `bounded_recovery` |

## Return Intent Is Not A URL

`PostAuthReturnIntent` is bound to:

| Bound input | Why it matters |
| --- | --- |
| `routeIntentBindingRef` | Converts to exactly one allowed route binding. |
| `lineageRef` | Preserves draft/request lineage and selected-anchor continuity. |
| `routeFamilyRef` | Prevents route widening after auth. |
| `subjectRef` | Prevents cross-subject return after sign-in. |
| `bindingVersionRef` | Detects stale identity fences. |
| `sessionEpochRef` | Detects stale local-session epoch. |
| `channelManifestRef` | Prevents stale channel or publication posture. |
| `selectedAnchorRef` | Preserves same-shell continuity where allowed. |

The redirect mode is frozen to `route_intent_binding_only`. Local browser memory may help restore presentation context, but it cannot widen the return destination.

## Local Session Decision Vocabulary

`SessionEstablishmentDecision.decision` is frozen to:

| Decision | Meaning |
| --- | --- |
| `create_fresh` | Create a new local session epoch and secure HTTP-only cookie after successful callback validation. |
| `rotate_existing` | Rotate an existing local session because privilege, subject, or trust posture changed. |
| `reuse_existing` | Reuse an existing valid session for read-only or equivalent posture. |
| `deny` | Do not create or preserve a session. |
| `bounded_recovery` | Preserve same-shell recovery affordances without writable authority. |

The session decision emits `writableAuthorityState`, cookie action, CSRF action, grant ceiling, projection posture, and reason codes. It does not append or supersede `IdentityBinding`.

## Mock Now, Production Later

Mock-now behavior uses simulator-backed NHS login/OIDC evidence with production-shaped objects. Live production later may replace simulator issuer, keys, and claim evidence, but must keep:

| Preserved contract | Production substitution allowed |
| --- | --- |
| `AuthTransaction` lifecycle and callback fence | Live issuer keys and token validation material. |
| `AuthScopeBundle` versioning | Live configured scopes and consent copy references. |
| `PostAuthReturnIntent` route binding | No arbitrary redirect widening. |
| Session TTL/rotation matrix | Environment-tuned timeouts if serialized and policy-versioned. |
| Session projection grammar | Copy can be localized, but posture meaning cannot change. |

## Reference Alignment

This contract aligns with NHS login no-consent handling, OpenID Connect Core authorization-code validation, PKCE, and OAuth security best-current-practice guidance while preserving Vecells-specific trust boundaries.

Primary implementation evidence:

| Artifact | Role |
| --- | --- |
| `data/contracts/171_auth_transaction.schema.json` | Auth transaction and callback fence. |
| `data/contracts/171_auth_scope_bundle.schema.json` | Scope/assurance/consent bundle. |
| `data/contracts/171_post_auth_return_intent.schema.json` | Governed return intent. |
| `data/contracts/171_session_establishment_decision.schema.json` | Local session decision path. |
| `data/contracts/171_session_termination_settlement.schema.json` | Termination settlement. |
| `data/analysis/171_callback_outcome_matrix.csv` | Callback outcome matrix. |
| `data/analysis/171_session_ttl_and_rotation_matrix.csv` | TTL and rotation matrix. |
