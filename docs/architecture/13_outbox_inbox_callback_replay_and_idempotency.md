# 13 Outbox Inbox Callback Replay And Idempotency

        The outbox/inbox/effect-key ledger is baseline law, not an implementation detail. Every external effect must tie back to canonical action records, durable queue position, receipt checkpoints, and a single settlement chain.

        ## Idempotency Strategies

        | Strategy | Formula | Duplicate Result |
| --- | --- | --- |
| Command action dedupe | commandActionId or canonical mutation tuple hash | return existing CommandSettlementRecord |
| Canonical adapter effect key | H(actionRecordId \|\| actionScope \|\| governingObjectRef \|\| expectedEffectSetHash \|\| intentGeneration) | reuse the live AdapterDispatchAttempt |
| Receipt checkpoint replay key | adapter correlation key plus ordering policy tuple | update the existing attempt or open ReplayCollisionReview |
| Booking commit idempotency | BookingTransaction.idempotencyKey plus selected candidate hash | reuse the current BookingTransaction or authoritative confirmation gate |
| Pharmacy dispatch idempotency | dispatchPlanHash plus packageHash plus provider scope | reuse the current PharmacyDispatchAttempt |
| Pharmacy outcome evidence replay key | rawPayloadHash \|\| semanticPayloadHash \|\| replayKey | duplicate_ignored or collision review |
| Timer wakeup cursor | checkpointRef plus dueAt plus monotone revision | recompute current checkpoint and no-op if unchanged |
| Restore and assurance action gate | selected anchor tuple plus restore intent hash | return the current restore or review settlement |

        ## Replay Rules

        | Replay Rule | Legal Outcomes | Collision Posture |
| --- | --- | --- |
| Canonical event append-only replay | append_only; observational | quarantine or publish new contract version |
| Command settlement replay | return existing settlement; supersede with governed settlement | open assurance review and do not mint second result |
| Adapter receipt checkpoint replay | exact_replay; semantic_replay; stale_ignore | ReplayCollisionReview |
| Projection rebuild from immutable event history | route-safe rebuild; summary_only cutover; recovery_only cutover | block publication until compatibility digest matches |
| FHIR rematerialization from published mapping contracts | derived version refresh; superseding derivative | publish new mapping contract and replay proof |
| Pharmacy outcome replay classification | duplicate_ignored; review_required; reopened_for_safety | case-local reconciliation gate blocks closure |
| Support replay and restore scope replay | masked_read_only; restore_allowed | restore gate remains closed until current scope tuple matches |
| Timer checkpoint recompute | no_change; new_deadline_revision; fallback_required | preserve latest monotone checkpoint only |

        ## Non-Negotiable Rules

        - Dispatch only from `queue_command_outbox` or an equivalent durable queue position linked to `CommandActionRecord`.
        - Replayed jobs, duplicate workers, duplicate taps, and duplicate receipts return or widen the existing chain; they may not create a second external effect or second business result.
        - Callback and clinician messaging use the same canonical effect ledger as every other adapter boundary.
        - Pharmacy outcome ingest classifies replay before any case mutation and keeps weak or conflicting evidence inside a case-local reconciliation gate.
        - Support replay and restore never bypass the current scope envelope, restore gate, or owning settlement chain.
