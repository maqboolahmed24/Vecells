# 204 Auth Replay And Logout Matrix

## Callback Replay And Integrity

| Case                                      | Input                                       | Expected transaction                 | Expected session                      | Same-shell posture                          | Log and counter                                                     |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------ | ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `AUTH204_VALID_CALLBACK_EXACT_ONCE`       | Valid code, state, nonce, and return intent | Consumed once and settled success    | Fresh live session created            | Request detail resumes with selected anchor | `identity.auth.callback.accepted.v1`, callback accepted             |
| `AUTH204_DUPLICATE_SAME_CODE_STATE`       | Same browser callback submitted again       | Maps to existing settled transaction | No second session minted              | Recovery explanation remains in shell       | `identity.auth.callback.replay_blocked.v1`, callback replay blocked |
| `AUTH204_REPLAY_AFTER_SUCCESS`            | Replay after success and session creation   | Existing success settlement returned | Existing epoch retained, no rotation  | Mutable CTA suppressed until revalidated    | `identity.auth.callback.mapped_to_settlement.v1`                    |
| `AUTH204_MUTATED_STATE`                   | State differs from transaction              | Rejected as integrity failure        | Session denied                        | Bounded recovery in same shell              | `identity.auth.callback.integrity_failed.v1`                        |
| `AUTH204_MUTATED_NONCE`                   | Nonce is mutated or missing                 | Rejected as nonce failure            | Session denied                        | Recovery keeps lawful summary only          | `identity.auth.callback.nonce_failed.v1`                            |
| `AUTH204_STALE_POST_AUTH_RETURN_INTENT`   | Return intent no longer current             | Settled to stale-return recovery     | No writable route restored            | Same-shell recovery frame opens             | `identity.auth.return_intent_stale.v1`                              |
| `AUTH204_EXPIRED_TRANSACTION`             | Callback lands after transaction expiry     | Settled expired                      | Session denied                        | Signed-out recovery posture                 | `identity.auth.transaction_expired.v1`                              |
| `AUTH204_CALLBACK_AFTER_LOGOUT`           | Callback lands after local logout           | Rejected because logout is absorbing | Session remains terminated            | Same shell shows signed-out recovery        | `identity.auth.callback.after_logout_denied.v1`                     |
| `AUTH204_DUPLICATE_BROWSER_SUBMISSION`    | Double-click or duplicate browser submit    | One accepted, duplicate collapsed    | Only one epoch is created             | Duplicate warning appears without PHI       | `identity.auth.callback.duplicate_submit_collapsed.v1`              |
| `AUTH204_STALE_TAB_AFTER_SUPERSEDED_AUTH` | Older tab lands after newer auth flow       | Older transaction superseded         | Newer session epoch remains authority | Stale tab can only recover                  | `identity.auth.callback.superseded_tab_denied.v1`                   |

## Logout And Invalidation

| Case                                      | Input                                             | Expected session                                                    | Browser effect                             | Cache and PHI rule                  |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------- |
| `AUTH204_LOGOUT_HOME`                     | Logout from authenticated home                    | Live epoch terminated                                               | Signed-out same-shell posture              | No writable home CTA survives       |
| `AUTH204_LOGOUT_DETAIL_ANCHOR`            | Logout from request detail with selected anchor   | Epoch terminated and anchor preserved only as lawful return context | Request detail becomes recovery frame      | Detail PHI reduced to summary tier  |
| `AUTH204_LOGOUT_AFTER_SECURE_LINK_UPLIFT` | Logout after secure-link auth uplift              | Uplift scope revoked                                                | Recovery route remains bounded             | Secure-link seeded data not widened |
| `AUTH204_LOGOUT_BROWSER_BACK`             | Browser back after logout                         | Stale route read rejected                                           | Back button cannot resurrect mutable shell | Cached fragments masked             |
| `AUTH204_LOGOUT_REFRESH`                  | Refresh after logout                              | No live session restored                                            | Signed-out recovery posture                | Mutable CTA suppressed              |
| `AUTH204_LOGOUT_STALE_CALLBACK_REPLAY`    | Stale callback after logout                       | Callback denied                                                     | Same-shell explanation                     | No second session                   |
| `AUTH204_LOGOUT_DEEP_LINK_REVISIT`        | Secure-link or recovery link revisit after logout | Requires fresh auth or bounded grant                                | Same shell preserves route lineage         | Summary only until proof returns    |
| `AUTH204_LOGOUT_PENDING_READS`            | Logout while background reads pending             | Reads cancelled or downgraded                                       | No PHI flash after settlement              | Pending fragments discarded         |

## Mock-Now Versus Live-Provider-Later

The matrix is mock-backed now through local fixtures, repository-owned integration tests, and Playwright browser proof in the lab. Live-provider-later execution must reuse the same callback IDs, settlement classes, session epoch rules, and logout absorbing-state semantics.
