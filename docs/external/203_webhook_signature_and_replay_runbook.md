# 203 Webhook Signature And Replay Runbook

This runbook defines how each signal provider family is admitted at the edge. It extends the Phase 2 edge boundary established in `docs/security/187_webhook_signature_validation_and_provider_boundary_controls.md`.

## Universal Admission Flow

1. Receive provider callback only on `/edge/signal/*`.
2. Preserve raw body and raw URL/form fields for signature verification.
3. Resolve provider-family signature scheme from `data/contracts/203_signal_provider_manifest.json`.
4. Verify provider authenticity before parsing into a normalized event.
5. Enforce the replay window and idempotency collision law.
6. Redact or quarantine raw receipt data before evidence capture.
7. Emit only normalized domain events downstream.

If signature verification or replay checks fail, the edge returns a bounded rejection and quarantines the raw receipt. No normalized event is emitted.

## Telephony

Telephony must cover call status, IVR gather/menu selection, and recording status.

| Provider | Verification posture | Replay key |
| --- | --- | --- |
| Vecells voice twin | HMAC over timestamp and raw body | `provider|provider_event_id|provider_call_id|event_type|occurred_at` |
| Twilio Voice | official Twilio request-validation over URL and payload | `provider|provider_event_id|provider_call_id|event_type|occurred_at` |
| Vonage Voice | official signed request or equivalent provider authenticity field | `provider|provider_event_id|provider_call_id|event_type|occurred_at` |

The IVR gather callback creates `menu_selection_captured`; it does not imply request closure. Recording callbacks create `recording_available` or provider error/degraded readiness states.

## SMS

SMS status callbacks must cover accepted, queued/sent, delivered, failed, undelivered, and expired outcomes.

| Provider | Verification posture | Replay key |
| --- | --- | --- |
| Vecells SMS twin | HMAC over timestamp and raw body | `provider|provider_message_id|recipient_route_hash|status|occurred_at` |
| Twilio SMS | official Twilio request-validation over URL and payload | `provider|provider_message_id|recipient_route_hash|status|occurred_at` |
| Vonage SMS | official signature validation with timestamp or nonce where exposed | `provider|provider_message_id|recipient_route_hash|status|occurred_at` |

Failure and expiry do not delete lineage. They create reachability repair or continuation-expiry state.

## Email

Email event webhooks must cover accepted, delivered, deferred, dropped, bounced, and complaint states. Open and click events are optional and non-authoritative.

| Provider | Verification posture | Replay key |
| --- | --- | --- |
| Vecells email twin | HMAC over timestamp and raw body | `provider|message_id|event_type|event_timestamp|recipient_route_hash` |
| Mailgun | timestamp, token, signature HMAC validation | `provider|message_id|event_type|event_timestamp|recipient_route_hash` |
| SendGrid | signed event webhook verification using timestamp and raw body | `provider|message_id|event_type|event_timestamp|recipient_route_hash` |

Complaint or spam-report events suppress the channel until review. Delivery events settle only the notification delivery fact, not the request state.

## Rotation

Credential references use `credential://` placeholders and are never raw values. Rotation is a provider-approved operation and requires the live mutation gate. After rotation, operators must replay one signed positive callback and one stale timestamp callback before clearing the gate.

## Replay Window

The initial replay window is 300 seconds across all families. Exact duplicates collapse by idempotency key and digest. Same key with different digest rejects as a collision.
