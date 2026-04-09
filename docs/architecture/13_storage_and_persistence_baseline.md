# 13 Storage And Persistence Baseline

        Vecells should keep domain transactions, FHIR representations, canonical events, projection reads, object artifacts, timer state, and WORM audit as separate store classes with different ownership and replay rules.

        ## Decision

        Chosen baseline: `OPT_SEPARATE_DOMAIN_EVENT_PROJECTION_AUDIT`.

        ## Scorecard

        | Option | Domain Separation | Projection Safety | Interop Fit | Operator Clarity | Decision |
| --- | --- | --- | --- | --- | --- |
| FHIR-first relational store with direct UI reads | 1 | 1 | 4 | 2 | rejected |
| Separate domain, FHIR, event, projection, object, timer, and audit classes | 5 | 5 | 5 | 5 | chosen |
| Domain and projection tables in one mixed relational schema | 2 | 2 | 3 | 3 | rejected |

        ## Store Matrix

        | Store | Class | Truth Role | Rebuild Source | Baseline Scope |
| --- | --- | --- | --- | --- |
| Transactional domain and settlement store | transactional_domain | Vecells-first lifecycle, blocker, lease, and settlement truth | authoritative source | baseline |
| FHIR representation store | fhir_representation | Derived interoperability representation only | published mapping contracts plus canonical events | baseline |
| Immutable canonical event spine | event_log | Replay and rebuild witness | authoritative source | baseline |
| Audience projection read store | projection_read | Derived audience-safe query materialization only | canonical event history plus projection contract versions | baseline |
| Artifact object store | object_artifact | Binary artifact payload home only | authoritative source for bytes only | baseline |
| Artifact quarantine prefix | object_artifact | Unsafe artifact holding area pending governed review | authoritative source for quarantined bytes only | baseline |
| WORM audit ledger | worm_audit | Tamper-evident evidence witness | authoritative source | baseline |
| Route/session/cache plane | cache | Ephemeral acceleration only | published contracts and current sessions | baseline |
| Timer checkpoint store | timer_state | Deadline and wakeup checkpoint persistence | recompute from canonical settlements where feasible | baseline |
| Feature store for assistive work | feature_store | Deferred assistive derivation only | derived from non-authoritative feature pipelines | deferred |

        ## Storage Law

        - `transactional_domain` is the only store class that owns canonical request, blocker, settlement, and closure truth.
        - `fhir_representation` is one-way derived from domain settlements and published mapping contracts.
        - `event_log` is immutable and replay-authoritative for rebuilds and analytics.
        - `projection_read` is always derived and contract-versioned.
        - `object_artifact` holds bytes, not business meaning.
        - `worm_audit` is append-only witness, not mutable case truth.
        - `feature_store` stays deferred and non-authoritative.

        ## Rejection Notes

        - A FHIR-first primary store was rejected because it would invert the Vecells-first domain boundary.
        - A shared domain-plus-projection schema was rejected because it would let projections masquerade as truth during rebuilds or drift.
