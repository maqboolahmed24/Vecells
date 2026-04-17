# Telephony Edge And Webhook Ingestion Design

`TelephonyEdgeService` owns the provider-facing boundary for Phase 2 telephony. Provider webhooks terminate at `/internal/telephony/webhooks/{providerRef}` and become `NormalizedTelephonyEvent` records before any call-session, recording, readiness, continuation, or convergence worker sees them.

The service consumes the `TelephonyProviderEvent` seam from task `173`, the `telephony_normalized_event_envelope` ownership rule from task `174`, and the masking posture from `IdentityAuditAndMaskingService`. No fallback gap artifact is required.

## Boundary

The provider adapter may parse simulator or vendor-shaped callback payloads, but the platform stores and publishes only:

- `providerPayloadRef` pointing to raw receipt quarantine
- `payloadDigest` and header digest
- `providerCallRef`, `providerEventRef`, `callSessionRef`, and `edgeCorrelationId`
- canonical event types such as `call_started`, `menu_selection_captured`, `recording_expected`, `recording_available`, `call_abandoned`, `provider_error_recorded`, and `continuation_sent`
- normalized payload refs such as `maskedCallerRef`, `recordingArtifactRef`, and `providerErrorRef`

Raw payload bodies, full phone numbers, provider recording URLs, and provider-specific field names do not cross into worker or domain logic.

## Services

`TelephonyEdgeService.receiveProviderWebhook` performs the fast path:

- validate `x-vecells-simulator-signature` using HMAC-SHA256 over timestamp plus raw body
- persist `TelephonyRawWebhookReceipt` in edge quarantine with `edge_quarantine_short_retention`
- normalize to `NormalizedTelephonyEvent`
- settle `TelephonyIngestionIdempotencyRecord`
- enqueue `TelephonyWebhookWorkerOutboxEntry`
- return an empty fast acknowledgement without waiting for business processing

`TelephonyWebhookWorker.processPending` performs the slow path:

- consume provider-neutral normalized events only
- create early `TelephonyEdgeCallSession` on `call_started`
- open one urgent-live assessment ref at bootstrap
- advance early states into `menu_selected`, `recording_expected`, `recording_available`, `provider_error`, `abandoned`, or `continuation_sent`
- preserve terminal call state if late recording callbacks arrive
- buffer out-of-order events until call-start bootstrap exists

## Replay And Disorder

Duplicate provider callbacks collapse by `idempotencyKey`. Exact replays increment duplicate count and do not enqueue a second worker side effect. Same idempotency key with a different payload digest is rejected as `TEL_EDGE_187_IDEMPOTENCY_COLLISION_REJECTED`.

Out-of-order events are stored in `phase2_telephony_disorder_buffer_entries`. When `call_started` later arrives, buffered events replay against the provider-neutral call-session projection in deterministic recorded order.

## CallSession Bootstrap

This task publishes only the early bootstrap/update seam needed by task `188`. It does not redefine the full `CallSession` state machine. The worker can safely produce:

- `initiated`
- `menu_selected`
- `recording_expected`
- `recording_available`
- `provider_error`
- `abandoned`
- `continuation_sent`

Later task `188` remains owner of full transition law, rebuild from complete event history, and durable menu-correction semantics.

## Gap Closures

- `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_VENDOR_PAYLOAD_LEAKAGE_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_UNSIGNED_CALLBACK_TRUST_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_DUPLICATE_CALLBACK_SIDE_EFFECTS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_OUT_OF_ORDER_BLINDNESS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_REPLAY_PATH_V1`
