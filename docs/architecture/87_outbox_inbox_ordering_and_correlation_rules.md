# 87 Outbox Inbox Ordering And Correlation Rules

        The outbox and inbox substrate is authoritative runtime law. Handler-local retries or callback heuristics are forbidden.

        ## Non-negotiable Rules

        - Canonical event names remain canonical subjects on the broker.
        - Every external effect requires an outbox checkpoint and effect key before dispatch.
        - Every consumer requires an inbox receipt checkpoint and dedupe key before it can settle.
        - Callback or webhook consumers bind to explicit correlation keys and ordered receipt windows.
        - Quarantine and DLQ routes remain identity preserving; they do not erase event, settlement, or causal lineage.

        ## Policy Matrix

        | Policy Ref | Kind | Queue | Ordering Scope | Correlation Formula | Replay Posture |
        | --- | --- | --- | --- | --- | --- |
        | `OP_087_COMMAND_CANONICAL_OUTBOX` | outbox | `q_event_integration_effects` | `tenantId|requestLineageRef` | `edgeCorrelationId|causalToken` | `return_existing_or_resume` |
| `OP_087_CONFIRMATION_GATE_OUTBOX` | outbox | `q_event_callback_correlation` | `tenantId|confirmationGateRef` | `edgeCorrelationId|callbackCorrelationKey` | `resume_same_gate_chain` |
| `OP_087_COMMUNICATION_DELIVERY_OUTBOX` | outbox | `q_event_notification_effects` | `tenantId|communicationChainRef` | `edgeCorrelationId|deliveryReceiptRef` | `resume_or_manual_reissue` |
| `OP_087_REACHABILITY_EFFECT_OUTBOX` | outbox | `q_event_callback_correlation` | `tenantId|dependencyRef` | `edgeCorrelationId|dependencyRef|callbackCorrelationKey` | `gap_review_then_resume` |
| `OP_087_ASSURANCE_REVIEW_OUTBOX` | outbox | `q_event_assurance_audit` | `tenantId|causalToken` | `edgeCorrelationId|causalToken` | `append_only` |
| `OP_087_REPLAY_QUARANTINE_OUTBOX` | outbox | `q_event_replay_quarantine` | `tenantId|eventName|causalToken` | `edgeCorrelationId|causalToken|effectKey` | `manual_review_required` |
| `IP_087_PROJECTION_LIVE_INBOX` | inbox | `q_event_projection_live` | `tenantId|namespaceStream` | `edgeCorrelationId|causalToken` | `exact_sequence_resume` |
| `IP_087_PROJECTION_REPLAY_INBOX` | inbox | `q_event_projection_replay` | `tenantId|namespaceStream` | `edgeCorrelationId|causalToken` | `deterministic_rebuild_resume` |
| `IP_087_CALLBACK_RECEIPT_INBOX` | inbox | `q_event_callback_correlation` | `tenantId|callbackCorrelationKey` | `edgeCorrelationId|callbackCorrelationKey|causalToken` | `receipt_window_enforced` |
| `IP_087_NOTIFICATION_RECEIPT_INBOX` | inbox | `q_event_notification_effects` | `tenantId|recipientRef|routeFamilyRef` | `edgeCorrelationId|causalToken|deliveryReceiptRef` | `dedupe_then_manual_reissue` |
| `IP_087_ASSURANCE_OBSERVER_INBOX` | inbox | `q_event_assurance_audit` | `tenantId|causalToken` | `edgeCorrelationId|causalToken` | `append_only` |
| `IP_087_REPLAY_QUARANTINE_INBOX` | inbox | `q_event_replay_quarantine` | `tenantId|eventName|causalToken` | `edgeCorrelationId|causalToken|effectKey` | `manual_reconcile_then_resume` |

        ## Flow Guarantees

        - `q_event_projection_live` and `q_event_projection_replay` preserve namespace ordering and checkpoint on every accepted apply.
        - `q_event_callback_correlation` enforces callback ordering windows and opens replay review on gaps.
        - `q_event_replay_quarantine` is manual-resume-only and preserves the original canonical subject.
