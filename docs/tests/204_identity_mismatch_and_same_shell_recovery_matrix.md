# 204 Identity Mismatch And Same-Shell Recovery Matrix

## Identity Mismatch And Wrong-Patient Hold

| Case                                      | Trigger                                                | Binding or hold effect                                | Browser posture                                  | PHI and CTA rule                         |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `AUTH204_WRONG_SUBJECT_SECURE_LINK`       | Auth subject differs from secure-link expected subject | Binding denied                                        | Identity-hold route opens in shell               | PHI suppressed, mutable CTA hidden       |
| `AUTH204_SESSION_A_LINK_B`                | Browser session for patient A opens patient B link     | Subject fence blocks action                           | Same-shell recovery explains mismatch            | Patient B seeded data never appears      |
| `AUTH204_BINDING_SUPERSEDES_OPEN_SESSION` | Authoritative binding supersedes during open session   | Session epoch invalidated                             | Read-only recovery until current binding returns | Stale binding CTAs removed               |
| `AUTH204_REPAIR_FREEZE_DETAIL_OPEN`       | Wrong-patient repair freeze arrives on detail route    | Hold entered                                          | Detail route degrades in place                   | Last safe summary only                   |
| `AUTH204_RELEASE_AFTER_CURRENT_BINDING`   | Repair release occurs                                  | Hold released only after resulting binding is current | Action routing re-enters same shell              | CTA returns only with current binding    |
| `AUTH204_IDENTITY_HOLD_SUPPRESSES_PHI`    | Identity-hold route requested                          | Hold remains active                                   | Identity-hold surface renders                    | Detail PHI and seeded identifiers hidden |
| `AUTH204_HOME_AND_DETAIL_DEGRADE_ON_HOLD` | Hold starts while home and detail are cached           | Both surfaces downgrade                               | Home spotlight and detail header show hold       | CTAs suppressed across both surfaces     |

## Same-Shell Continuity

| Case                                     | Trigger                                    | Preserved continuity                                             | Next-safe action                    |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------- |
| `AUTH204_CALLBACK_TO_REQUEST_DETAIL`     | Auth callback returns to request detail    | `PatientNavReturnContract`, selected anchor, and request lineage | Resume detail in live session       |
| `AUTH204_SESSION_TIMEOUT_ON_DETAIL`      | Idle timeout while viewing detail          | Last safe summary and selected anchor                            | Re-authenticate in same shell       |
| `AUTH204_LOGOUT_FROM_DETAIL`             | Logout from request detail                 | Request lineage only, not PHI-bearing detail                     | Sign in again or return home        |
| `AUTH204_WRONG_PATIENT_HOLD_FROM_DETAIL` | Wrong-patient hold arrives on detail       | Request lineage plus hold case ID                                | Resolve identity hold               |
| `AUTH204_CLAIM_STEP_UP_RETURN_DETAIL`    | Claim step-up returns                      | Selected anchor and claim context                                | Continue claim after epoch rotation |
| `AUTH204_RECOVERY_FROM_HOME_OR_DETAIL`   | Recovery route entered from home or detail | Valid route lineage and safe summary                             | Recover account or restart auth     |

## Evidence Rules

Every mismatch and recovery fixture must prove that same-shell continuity is bounded by lawful context. The shell may preserve route lineage, selected anchor, and last safe summary; it may not preserve mutable CTAs, stale patient detail, seeded identifiers for the wrong subject, or cached fragments after logout or hold entry.

The matrix is mock-now and mock-backed through local fixtures, repository-owned integration tests, and Playwright browser proof. Live-provider-later execution must keep these same-shell continuity fences unchanged when live credentials are enabled, including replay and logout paths that try to reuse stale identity context.
