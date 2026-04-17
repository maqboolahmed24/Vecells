# Session Rotation, Timeout, And Logout Rules

Status: frozen for Phase 2 local-session engine  
Primary artifacts: `171_session_ttl_and_rotation_matrix.csv`, `171_session_establishment_decision.schema.json`, `171_session_termination_settlement.schema.json`

## Local Session Ownership

Vecells owns local session establishment, rotation, timeout, downgrade, and termination. NHS login confirms external authentication evidence; it does not own Vecells session posture, route return, access grants, or patient-link authority.

## Session Establishment

`SessionEstablishmentDecision` is emitted only after callback validation and return-intent validation. It must include:

| Decision field           | Security purpose                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `decision`               | `create_fresh`, `rotate_existing`, `reuse_existing`, `deny`, or `bounded_recovery`. |
| `writableAuthorityState` | Explicit write/read/block posture.                                                  |
| `sessionEpochAction`     | Create, rotate, reuse, terminate, or no-session.                                    |
| `cookieRotationAction`   | Set, rotate, preserve read-only, clear, or no action.                               |
| `csrfRotationAction`     | Issue, rotate, preserve read-only, clear, or no action.                             |
| `maxGrantCeiling`        | Access grant ceiling at or below the trust contract from task `170`.                |
| `projectionPosture`      | Patient-shell state shown after settlement.                                         |

## TTL And Rotation Matrix

The TTL matrix is serialized and policy-versioned. It binds idle timeout, absolute timeout, re-auth timing, session epoch action, cookie action, CSRF action, access grant action, and writable authority.

| Posture                    | Idle  | Absolute | Rotation posture                                       |
| -------------------------- | ----- | -------- | ------------------------------------------------------ |
| `anonymous_pre_auth`       | 900s  | 1800s    | No session, CSRF issue only.                           |
| `auth_transaction_pending` | 300s  | 600s     | No session, rotate CSRF.                               |
| `signed_in`                | 1800s | 28800s   | Create secure HTTP-only cookie and issue CSRF.         |
| `rotate_existing`          | 1800s | 28800s   | Rotate session epoch, cookie, and CSRF.                |
| `reuse_existing`           | 1200s | 21600s   | Preserve read-only posture only.                       |
| `claim_pending`            | 900s  | 7200s    | Rotate epoch but keep read-only/write-blocked posture. |
| `re_auth_required`         | 300s  | 900s     | Clear session and require re-auth.                     |
| `session_expired`          | 0s    | 0s       | Terminate and supersede grants.                        |
| `subject_conflict`         | 0s    | 0s       | Terminate and block reveal.                            |
| `bounded_recovery`         | 600s  | 1800s    | No session; continuation recovery only.                |
| `logout`                   | 0s    | 0s       | Clear cookie/CSRF and supersede all grants.            |

## Cookie And Storage Rules

| Storage surface       | Rule                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Session cookie        | Secure, HTTP-only, SameSite, server-side session backing.                                              |
| CSRF token            | Rotated on auth transaction start, session creation, session rotation, logout, and forced termination. |
| Browser local storage | May store presentation hints only; never raw tokens, claims, route authority, or return authority.     |
| URL/query string      | Must not contain raw identity evidence, token material, PHI, or free-form post-auth return targets.    |
| DOM attributes        | May contain deterministic test IDs, not identity values or callback payloads.                          |

## Termination Settlement

`SessionTerminationSettlement` is authoritative for:

| Termination type     | Required action                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| `logout`             | Clear cookie and CSRF; supersede all grants.                           |
| `idle_timeout`       | Clear or rotate down; project `session_expired` or `re_auth_required`. |
| `absolute_timeout`   | Terminate epoch and require re-auth.                                   |
| `revocation`         | Supersede grants and block writable authority.                         |
| `downgrade`          | Rotate down to read-only or bounded recovery.                          |
| `forced_termination` | Clear session and project safe recovery.                               |
| `subject_conflict`   | Clear session and no patient-specific reveal.                          |
| `stale_return`       | Reject stale return intent and preserve only last-safe anchor.         |

## Security Invariants

The validator fails if:

1. Session decisions use vocabulary outside `create_fresh | rotate_existing | reuse_existing | deny | bounded_recovery`.
2. TTL or rotation policy is prose-only instead of serialized.
3. Callback outcomes lack fallback disposition.
4. Return intent can become an arbitrary redirect URL.
5. Patient projection allows PHI-rich or writable reveal before trust/session fences succeed.
6. Raw token or claim field names appear in the auth transaction schema.
