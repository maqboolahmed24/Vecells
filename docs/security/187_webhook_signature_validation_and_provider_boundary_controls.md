# Webhook Signature Validation And Provider Boundary Controls

Telephony ingress follows a deny-by-default provider boundary. Provider payloads are authenticated before normalization and quarantined before worker processing.

## Signature Validation

`TelephonyEdgeService` requires `x-vecells-simulator-signature` and `x-vecells-simulator-timestamp`.

The simulator adapter computes HMAC-SHA256 over `<timestamp>.<rawBody>`, compares with `timingSafeEqual`, and enforces timestamp skew. Invalid callbacks are stored as raw receipts with `validationState = signature_failed` but do not create `NormalizedTelephonyEvent`, idempotency, outbox, or `CallSession` side effects.

This closes `PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_EDGE_UNSIGNED_CALLBACK_TRUST_V1`.

## Raw Receipt Quarantine

`phase2_telephony_raw_webhook_receipts` stores only edge-layer receipt metadata plus a quarantine ref. Runtime tests use in-memory raw bodies to prove quarantine isolation; domain-facing records expose only:

- `rawPayloadQuarantineRef`
- `payloadDigest`
- `headerDigest`
- `retentionClass = edge_quarantine_short_retention`
- `disclosureBoundary = provider_payload_shape_stops_at_normalizer`

The broader platform never consumes raw provider JSON directly.

## No Provider Payload Leakage

Normalized events must not include full phone numbers, provider recording URLs, raw caller IDs, or vendor field names. The edge converts them to:

- `maskedCallerRef`
- `maskedCallerFragment`
- `recordingArtifactRef`
- `recordingJobRef`
- `providerErrorRef`

`IdentityAuditAndMaskingService` provides the caller masking transform. Operational logs, traces, metric labels, and worker payloads must use these refs and fragments only.

## Idempotency And Replay

Every normalized event settles one `TelephonyIngestionIdempotencyRecord`. Exact duplicates are collapsed as `TEL_EDGE_187_DUPLICATE_REPLAY_COLLAPSED`. Same idempotency key with a different payload digest is rejected as `TEL_EDGE_187_IDEMPOTENCY_COLLISION_REJECTED`.

## Disorder Controls

Provider callbacks can arrive late or out of order. The worker buffers events that arrive before `call_started` and replays them after bootstrap. Late recording events after a terminal provider call state may add recording refs but must not reopen or corrupt terminal state.

## Required Controls

- Validated callbacks only.
- Empty fast acknowledgement for accepted callbacks.
- Raw receipts isolated at the edge.
- Provider-neutral normalized event vocabulary below the edge.
- Idempotent worker side effects.
- Replayable receipt-to-event-to-call-session lineage.
