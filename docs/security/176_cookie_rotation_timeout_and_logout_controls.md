# Cookie, Rotation, Timeout, and Logout Controls

Task: `par_176_phase2_track_identity_build_session_governor_for_session_establishment_rotation_and_logout`

## Security Invariants

1. `SessionGovernor` is the only authority allowed to create, rotate, reuse, downgrade, revoke, or terminate a local Vecells session.
2. A successful auth callback is not a local session.
3. A local session remains distinct from upstream auth proof, patient link, identity binding, ownership claim, and access-grant scope.
4. Session identifiers, CSRF secrets, and `sessionEpochRef` rotate on subject, binding, privilege, or capability posture changes.
5. Timeout, logout, downgrade, revocation, and subject-switch teardown settle through `SessionTerminationSettlement`.
6. Missing cookies are not a complete explanation of session posture.
7. The phrase "missing cookies are not authority" is the operator shorthand for this invariant.

## Cookie Policy

The cookie name is `__Host-vecells.sid`. It is issued with:

| Attribute  | Value           |
| ---------- | --------------- |
| `Path`     | `/`             |
| `HttpOnly` | `true`          |
| `Secure`   | `true`          |
| `SameSite` | `Lax`           |
| `Max-Age`  | `43200` seconds |

The browser receives the opaque cookie value. Persistence stores only `cookieDigest`; logs and projections must not include session cookie values.

## CSRF Policy

CSRF material is server-owned and stored only as `csrfSecretDigest`. Mutating requests must present the current CSRF token. A mismatch causes a `downgrade` settlement and projection to `restricted`, preventing silent writable continuation.

The CSRF secret rotates whenever `SessionEstablishmentDecision.cookieRotationAction = rotate_secure_http_only` or `set_secure_http_only`.

## Timeout and Re-auth Policy

| Control                    | Duration           | Settlement                                                                          |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Idle timeout               | `1800` seconds     | `SessionTerminationSettlement(idle_timeout)` and `expired_idle` projection.         |
| Absolute timeout / re-auth | `43200` seconds    | `SessionTerminationSettlement(absolute_timeout)` and `expired_absolute` projection. |
| Logout                     | Immediate          | `SessionTerminationSettlement(logout)` and clear-cookie action.                     |
| Subject switch             | Immediate teardown | `SessionTerminationSettlement(subject_conflict)` and recovery-only projection.      |
| Revocation                 | Immediate          | `SessionTerminationSettlement(revocation)` and revoked projection.                  |
| Downgrade                  | Immediate          | `SessionTerminationSettlement(downgrade)` and restricted projection.                |

Timeout checks are deterministic from server-side timestamps. Browser refresh or missing cookies alone never become the only source of truth.

## Rotation Rules

| Trigger                                        | Required action                                              |
| ---------------------------------------------- | ------------------------------------------------------------ |
| New settled identity with no existing session  | Create new session id, CSRF secret, and session epoch.       |
| Same subject, changed `bindingVersionRef`      | Rotate session id, CSRF secret, and session epoch.           |
| Same subject, changed `identityBindingRef`     | Rotate session id, CSRF secret, and session epoch.           |
| Same subject, changed `capabilityDecisionRef`  | Rotate session id, CSRF secret, and session epoch.           |
| Same subject, changed writable-authority state | Rotate session id, CSRF secret, and session epoch.           |
| Different subject on existing cookie           | Terminate previous session and refuse writable continuation. |

## Logging and Storage Rules

Allowed in logs: session refs, epoch refs, settlement ids, posture names, decision names, and reason codes.

Forbidden in logs: cookie values, CSRF tokens, raw auth claims, patient identifiers, phone identifiers, and PHI.

## External Security Alignment

The controls follow the local Vecells Phase 2 contract and are refined by OWASP session-management and CSRF guidance: use server-side sessions, rotate identifiers after privilege changes, mark cookies `Secure` and `HttpOnly`, scope cookies narrowly, enforce timeouts server-side, and use CSRF protection for state-changing requests. NHS login remains upstream authentication; local session lifecycle remains the partner application's responsibility.
