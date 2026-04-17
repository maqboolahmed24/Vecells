# 205 Continuation Access Grant Scope And Supersession Matrix

## Evidence Readiness And Continuation Grants

| Case                                              | Trigger                                                 | Grant outcome          | Visibility posture            | Redemption rule            |
| ------------------------------------------------- | ------------------------------------------------------- | ---------------------- | ----------------------------- | -------------------------- |
| `TEL205_VERIFICATION_SUFFICIENT_SEEDED_ALLOWED`   | Safety-usable readiness and high-confidence destination | seeded grant issued    | scoped PHI permitted by tuple | one-time redemption        |
| `TEL205_INSUFFICIENT_VERIFICATION_CHALLENGE_ONLY` | Destination or binding not strong enough                | challenge grant issued | public-safe summary           | seeded data not leaked     |
| `TEL205_MANUAL_ONLY_DISPOSITION`                  | Readiness requires manual review                        | no grant               | manual-only                   | recovery path only         |
| `TEL205_REDEEMED_SEEDED_GRANT`                    | Valid seeded token redeemed                             | grant consumed         | scoped resume                 | second redemption blocked  |
| `TEL205_REDEEMED_CHALLENGE_GRANT`                 | Valid challenge token redeemed                          | challenge consumed     | public-safe challenge         | challenge proof required   |
| `TEL205_REPLAY_ALREADY_USED_GRANT`                | Used token replayed                                     | replay blocked         | no widened visibility         | recovery only              |
| `TEL205_SUPERSEDED_GRANT_AFTER_NEWER_ISSUANCE`    | Older grant after newer one                             | superseded blocked     | no stale route                | use newest lawful grant    |
| `TEL205_EXPIRED_GRANT`                            | Token after expiry                                      | expired blocked        | summary only                  | request a new link         |
| `TEL205_WRONG_SUBJECT_REDEEM_ATTEMPT`             | Wrong subject attempts redemption                       | denied                 | no PHI                        | same-lineage recovery      |
| `TEL205_LINEAGE_MISMATCH_REDEMPTION`              | Token targets different lineage                         | denied                 | no PHI                        | restart from valid lineage |

## Separation Rule

Seeded and challenge grants are not interchangeable. A challenge path may carry only public-safe summary and verification prompts. It may not leak seeded facts, destination confidence, raw caller identifiers, full request detail, or hidden tokens.

## Mock-Now Versus Live-Later

This matrix is mock-now and supported by local continuation/access-grant services plus Playwright browser proof. Live-provider-later SMS dispatch must keep the same webhook evidence chain, recording readiness dependency, grant family, expiry, replay, supersession, and lineage fence semantics.
