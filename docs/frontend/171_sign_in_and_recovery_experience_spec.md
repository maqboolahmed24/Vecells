# Sign-In And Recovery Experience Spec

Status: frozen for Phase 2 frontend implementation  
Board: `docs/frontend/171_auth_return_journey_board.html`

## Experience Principle

The auth experience stays inside the premium patient shell. It uses one dominant action, short bounded helper text, and exact recovery states. It must not look like a generic identity-provider error screen or a technical callback page.

## Sign-In Entry

| Element           | Rule                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Primary action    | Use standard NHS login button placement. Do not restyle, fragment, or embellish the button. |
| Trust note        | One short note explaining that Vecells uses sign-in to protect account access.              |
| Surrounding frame | Quiet patient shell, generous whitespace, no security-theatre badges or alert stacks.       |
| Return intent     | Created server side before redirect; not stored as a browser URL.                           |
| Copy key          | `AUTH_171_COPY_SIGN_IN_ENTRY`                                                               |

## Callback Holding Screen

The holding screen is not a spinner-only page. It says the system is confirming sign-in details inside a governed frame.

| Slot     | Rule                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| Title    | "Confirming your sign-in" or approved localized equivalent.                                    |
| Body     | One sentence; no issuer, subject, token, NHS number, or callback details.                      |
| Motion   | Interstitial updates within `140ms`; reduced-motion removes movement without changing meaning. |
| Copy key | `AUTH_171_COPY_CALLBACK_HOLDING`                                                               |

## Recovery Pages

| Projection posture | Dominant action                   | Explanation boundary                                           |
| ------------------ | --------------------------------- | -------------------------------------------------------------- |
| `consent_declined` | Continue without sharing details. | Explain that sign-in was not completed; do not blame the user. |
| `re_auth_required` | Sign in again.                    | Explain stronger or fresher sign-in is needed.                 |
| `session_expired`  | Return to sign in.                | Preserve last safe summary only.                               |
| `subject_conflict` | Get help with this account.       | No patient-specific reveal.                                    |
| `stale_return`     | Start from the latest safe step.  | Explain the previous return point is no longer current.        |
| `bounded_recovery` | Choose a safe next step.          | Offer safe navigation without writable authority.              |

## Account Chip And Header Behavior

| State              | Header behavior                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `signed_in`        | Show masked account chip and safe account navigation.                                    |
| `claim_pending`    | Show claim-pending chip with no patient-specific reveal until authority accepts binding. |
| `read_only`        | Show read-only chip and suppress write actions.                                          |
| `re_auth_required` | Replace account actions with re-auth action.                                             |
| `session_expired`  | Show signed-out or expired chip with safe re-entry.                                      |
| `subject_conflict` | Show identity-hold state and support action only.                                        |

## Same-Shell Continuity

The UI must preserve selected anchor and last-safe summary when the contract allows recovery. It must not redirect to detached error islands. Generic browser redirects are forbidden because `PostAuthReturnIntent` is the only return authority.

## Copy And Disclosure Rules

| Forbidden in patient copy                                           | Required replacement                         |
| ------------------------------------------------------------------- | -------------------------------------------- |
| Token, nonce, state, code, issuer, audience, callback query details | "We could not confirm this sign-in safely."  |
| NHS number or raw claim value                                       | Masked account or no reveal.                 |
| Patient-specific content before binding and session fences          | Last safe summary or neutral support action. |
| Technical fault stacks                                              | Short bounded recovery instruction.          |

## Board Parity

`171_auth_return_journey_board.html` is the contract atlas for implementation. It includes:

1. Auth transaction ladder.
2. Return-intent braid.
3. Session-state ring.
4. Sign-in/recovery page atlas.
5. Adjacent parity tables and text-only fallbacks for every visual.
