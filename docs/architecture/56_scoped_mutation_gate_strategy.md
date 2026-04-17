# 56 Scoped Mutation Gate Strategy

            ## Summary

            - Route-intent rows: 16
            - Action scopes: 14
            - Route families covered: 9
            - Binding states modeled: 4
            - Same-shell recovery envelopes: 16

            `ScopedMutationGate` is the sole gateway for post-submit mutation. Every writable route resolves one exact `RouteIntentBinding`, validates one current runtime publication tuple, writes one immutable `CommandActionRecord`, and advances one authoritative `CommandSettlementRecord`. Calm success is legal only when `authoritativeOutcomeState = settled`.

            ## Gate Evaluation Order

            | Step | Operation | Fail-closed effect |
| --- | --- | --- |
| 1 | Resolve audience surface and route family | Never infer writable authority from URL shape or cached shell state. |
| 2 | Resolve acting context and acting-scope tuple | Patient routes use subject-bound requirements; staff routes require the current seq_054 tuple. |
| 3 | Resolve current route intent and runtime binding | Both the route-intent tuple and published runtime binding must agree before writable state loads. |
| 4 | Validate release, channel, trust, parity, provenance, and recovery posture | Drift degrades to same-shell recovery, read-only, or blocked. |
| 5 | Validate grant family, session epoch, subject binding, and fence epoch | Capability or login success alone is never enough. |
| 6 | Resolve exactly one governing object and version | Ambiguous or superseded targets fail closed into disambiguation or reissue. |
| 7 | Validate safety epoch and urgent or preemption posture | Safety drift downgrades before dispatch. |
| 8 | Validate reachability dependencies where applicable | Message, callback, waitlist, alternative, pharmacy, and repair actions require current reachability authority. |
| 9 | Write immutable CommandActionRecord | Every post-submit mutation persists the exact route-intent tuple and governing target. |
| 10 | Advance one authoritative CommandSettlementRecord | Transport or HTTP success does not authorize calm success. |

            ## Gap Closures

            | Gap | State | Control |
| --- | --- | --- |
| Route authority is local UI concern | Closed | Decision-table rows publish the full tuple and the validator recomputes tuple hashes. |
| Capability or login success implies writability | Closed | Every row requires grant family, session epoch, subject binding version, runtime binding, and release freeze. |
| Transport success stands in for business settlement | Closed | Settlement rows separate processing acceptance, observation, and authoritative outcome. |
| Parent anchor and governing version are optional | Closed | Both are mandatory tuple members and hash inputs. |
| Cross-context action can infer authority from launch source | Closed | requiredContextBoundaryRefs[] is mandatory on every route row. |
| Safety or reachability drift leaves stale CTA live | Closed | Decision rows execute safety and reachability validation before dispatch. |
| Recovery is a detached error page | Closed | Every recoverable or denied result maps to one same-shell recovery envelope. |

            ## Assumptions

            | Assumption | Statement |
| --- | --- |
| ASSUMPTION_056_PATIENT_SUBJECT_BOUND_REQUIREMENT | Patient-originated routes use one declared subject-bound acting-scope requirement instead of seq_054 staff acting-scope tuples. The mutable authority tuple still includes subject binding version and session epoch. |
| ASSUMPTION_056_DECISION_ROWS_INCLUDE_LIVE_AND_DEGRADED_VARIANTS | The decision table publishes both live and degraded route-intent variants for the same action scope so binding-state filters can prove downgrade law without inventing a second sidecar matrix. |
