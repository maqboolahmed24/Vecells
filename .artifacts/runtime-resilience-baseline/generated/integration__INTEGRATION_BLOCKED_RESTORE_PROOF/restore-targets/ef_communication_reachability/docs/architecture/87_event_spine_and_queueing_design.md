# 87 Event Spine And Queueing Design

        `par_087` turns the canonical event registry into a concrete broker and queueing substrate.

        ## Frozen Outcome

        - namespace streams: 22
        - canonical transport mappings: 192
        - queue groups: 7
        - subscription bindings: 100
        - outbox and inbox policies: 12

        The transport subject remains the canonical event name. Namespace streams group events for durability and replay, but no transport alias replaces the event contract.

        ## Queue Groups

        | Queue Ref | Queue Class | Consumer Group | Retry Posture | DLQ |
        | --- | --- | --- | --- | --- |
        | `q_event_projection_live` | projection_live | `cg_projection_live` | `checkpoint_resume` | `dlq_projection_live` |
| `q_event_projection_replay` | projection_replay | `cg_projection_replay` | `resume_from_checkpoint_only` | `dlq_projection_replay` |
| `q_event_integration_effects` | integration_effect_dispatch | `cg_integration_dispatch` | `dependency_profile_bound_retry` | `dlq_integration_effects` |
| `q_event_notification_effects` | notification_dispatch | `cg_notification_dispatch` | `delivery_receipt_window` | `dlq_notification_effects` |
| `q_event_callback_correlation` | callback_checkpoint | `cg_callback_receipt_ingest` | `correlation_checkpoint_retry` | `dlq_callback_correlation` |
| `q_event_assurance_audit` | assurance_observe | `cg_assurance_observe` | `audit_append_then_alert` | `dlq_assurance_audit` |
| `q_event_replay_quarantine` | replay_quarantine | `cg_replay_quarantine_review` | `manual_resume_only` | `dlq_replay_quarantine` |

        ## Runtime Law

        - Browsers and published gateway surfaces do not publish directly to the broker.
        - Command and integration services publish only from durable outbox checkpoints.
        - Consumers settle only from durable inbox checkpoints and preserved callback-correlation windows.
        - DLQ and quarantine routes preserve `edgeCorrelationId`, `causalToken`, and effect-key lineage.
        - Projection rebuild and replay consume the same canonical events as live apply.

        ## Follow-on Dependencies

        - `FOLLOW_ON_DEPENDENCY_088_CACHE_LIVE_UPDATE_OVERLAYS` owned by `par_088`: Cache invalidation and live-update fan-out overlays consume the same event spine later.
- `FOLLOW_ON_DEPENDENCY_093_CORRELATION_AND_OBSERVABILITY_EXPORT` owned by `par_093`: Distributed tracing and correlation telemetry may extend these checkpoints but not change queue law.
- `FOLLOW_ON_DEPENDENCY_095_MIGRATION_AND_BACKFILL_EXECUTION` owned by `par_095`: Migration and projection backfill runners consume the published replay queue and checkpoint manifests.
