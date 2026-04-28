# Telephony Provider Webhook Contract

## Endpoint

`POST /internal/telephony/webhooks/{providerRef}`

Initial provider adapter: `telephony_provider_simulator`.

The endpoint is internal and provider-facing. It validates the callback, persists a raw receipt in quarantine, normalizes one provider-neutral event, and returns a fast empty acknowledgement.

## Required Headers

- `x-vecells-simulator-timestamp`: ISO timestamp used in the signature base string.
- `x-vecells-simulator-signature`: `v1=` plus HMAC-SHA256 of `<timestamp>.<rawBody>`.

The signature policy is `telephony-edge-signature-hmac-sha256-v1`. A missing, stale, or mismatched signature returns `401` and does not enqueue worker processing.

## Simulator Payload

The simulator adapter accepts provider-shaped JSON only inside the edge:

- `eventId`
- `providerCallId`
- `eventType`
- `occurredAt`
- `sequence`
- `callerNumber`
- `menuSelection` or `dtmfDigits`
- `recordingId` or `recordingUrl`
- `errorCode`
- `status`

These names are not downstream DTO fields. They are normalized into `NormalizedTelephonyEvent` with stable refs and safe disclosure fields.

## Canonical Mapping

| Provider callback class                             | Canonical event type      | Call-session effect                                                         |
| --------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| `call.started`, `call.ringing`, `call.answered`     | `call_started`            | Bootstrap `initiated`                                                       |
| `menu.selected`, `ivr.branch`                       | `menu_selection_captured` | Advance `menu_selected`                                                     |
| `recording.expected`                                | `recording_expected`      | Advance `recording_expected`                                                |
| `recording.available`, `recording.status.available` | `recording_available`     | Store `recordingArtifactRef` and advance `recording_available`              |
| `call.completed`, `call.abandoned`, `call.hangup`   | `call_abandoned`          | Mark provider-side call terminal without treating platform `closed` as done |
| `provider.error`, `delivery.failed`                 | `provider_error_recorded` | Advance `provider_error`                                                    |
| `continuation.delivery`                             | `continuation_sent`       | Preserve continuation-dispatch signal                                       |

## Fast Acknowledgement

Valid callbacks return:

```json
{
  "statusCode": 204,
  "body": null,
  "queuedForWorker": true,
  "responseMode": "empty_fast_ack"
}
```

Duplicate callbacks return the same empty acknowledgement with `queuedForWorker = false`. Business processing is handled by `POST /internal/telephony/webhook-worker/drain`, which consumes `TelephonyWebhookWorkerOutboxEntry` records.

## Domain Contract

Downstream workers consume `NormalizedTelephonyEvent` only. The event carries `providerPayloadRef`, `payloadDigest`, `providerCallRef`, `providerEventRef`, `callSessionRef`, canonical type, normalized refs, reason codes, and timestamps. The raw receipt is never a domain input.
