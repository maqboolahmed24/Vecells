# 153 Notification Observability And Alerting

## Metrics Spine

The Phase 1 confirmation pipeline publishes one bounded metrics snapshot: `PHASE1_CONFIRMATION_NOTIFICATION_METRICS_V1`.

Required metrics:

- `dispatch_queued_rate`
- `provider_acceptance_rate`
- `delivery_evidence_rate`
- `bounce_failure_rate`
- `queue_depth`
- `queue_blockage`
- `end_to_end_confirmation_latency_p95_ms`
- `receipt_recovery_required_count`

These metrics come from the authoritative queue and evidence records, not from vendor SDK callbacks alone.

## Telemetry Redaction

The worker path uses structured telemetry only and keeps everything behind `UITelemetryDisclosureFence`.

Allowed fields:

- `maskedContactField`
- `maskedRouteField`
- `auditLinkField`
- `controlPlaneField`
- `publicDescriptor`

Forbidden telemetry content:

- raw contact destinations
- raw provider payload fragments
- patient free text
- unsafe webhook bodies

The worker records:

- trace span `notification.confirmation.dispatch`
- log `notification_confirmation_dispatch_settled`
- log `notification_confirmation_webhook_recorded`
- metric samples `notification.provider_acceptance_rate` and `notification.delivery_evidence_rate`

## Alerting

The alert family stays bound to `ALERT_COMMUNICATION_AND_CALLBACK_HEALTH`.

Page-worthy conditions:

- queue blockage remains open for 15 minutes
- delivery evidence gaps widen beyond the callback latency window
- receipt bridges remain `recovery_required` after queueing

Warning conditions:

- provider acceptance drops below the declared floor
- bounce or failure rate spikes above the allowed band

## Operator Interpretation

Operators must read the chain in this order:

1. local acknowledgement
2. transport settlement
3. delivery evidence
4. authoritative receipt posture

That order matters because Phase 1 is not allowed to infer calm delivery from a transport acknowledgement. `recovery_required` is the correct public truth whenever route truth is stale, blocked, disputed, or callback evidence never closes the loop.

## Simulator-First Coverage

The worker and its tests explicitly cover:

- accepted
- delayed retry after timeout
- delivered
- bounced
- expired
- suppressed
- disputed

These scenarios keep the exact same queueing, settlement, evidence, and observability contract that later live SMS or email providers must satisfy.
