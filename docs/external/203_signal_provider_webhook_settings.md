# 203 Signal Provider Webhook Settings

Task `seq_203` freezes the browser-automation configuration pack for telephony, SMS, and email provider callbacks. The authoritative machine-readable source is `data/contracts/203_signal_provider_manifest.json`; this document explains the intended operator posture.

## Configuration Rule

Provider consoles may register only typed edge callbacks:

| Family | Edge callback | Provider candidates | Required posture |
| --- | --- | --- | --- |
| Telephony | `/edge/signal/telephony/provider-callback` | Twilio Voice, Vonage Voice, Vecells voice twin | Signed callback, 300 second replay window, call-status and recording-status coverage |
| SMS | `/edge/signal/sms/status-callback` | Twilio Messaging, Vonage SMS, Vecells SMS twin | Signed callback, 300 second replay window, delivery-status coverage |
| Email | `/edge/signal/email/event-webhook` | Mailgun, Twilio SendGrid, Vecells email twin | Signed or public-key verified event webhook, 300 second replay window, delivery/failure/complaint coverage |

The callback target must not point to workers, queue consumers, private admin pages, or provider-specific internal routes. Provider payload names stop at the edge and are normalized before downstream services see them.

## Official Provider Guidance Applied

The configuration model reflects the current official guidance checked for this task:

- Twilio webhook requests are validated with Twilio's request-validation mechanisms: <https://www.twilio.com/docs/usage/webhooks/webhooks-security>.
- Twilio Voice status callbacks and recording callbacks are modeled as separate coverage obligations: <https://www.twilio.com/docs/voice/api/call-resource>.
- Twilio Messaging delivery status callbacks are modeled as SMS event subscriptions: <https://www.twilio.com/docs/messaging/guides/track-outbound-message-status>.
- Vonage callback authenticity follows the official signing-message posture: <https://developer.vonage.com/en/getting-started/concepts/signing-messages>.
- Vonage Voice separates answer and event webhook URLs: <https://developer.vonage.com/en/getting-started/concepts/webhooks>.
- Mailgun event webhooks use timestamp, token, and signature validation: <https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks>.
- SendGrid signed event webhooks use timestamped raw-payload verification: <https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features>.

## Endpoint Inventory

The endpoint inventory is versioned in `data/analysis/203_webhook_endpoint_matrix.csv`. Each row binds a provider family, environment, provider candidate, signature scheme, replay key, and live mutation gate.

The local twin supports four environments now:

| Environment | Purpose | Provider mutation |
| --- | --- | --- |
| `local` | static control-board and local harness proof | blocked |
| `sandbox_twin` | full dry-run provider-console simulation | blocked |
| `provider_candidate` | later selector capture and candidate configuration rehearsal | blocked |
| `live_candidate` | later live provider console mutation under approval | blocked by default |

## Event Coverage

Exact event coverage is in `data/analysis/203_event_subscription_matrix.csv`.

Telephony coverage is mandatory for call status, IVR gather/menu capture, and recording status. The IVR callback posture keeps menu selection as a call-session event; it does not close the request lineage.

SMS coverage is mandatory for acceptance, progress, delivered, failed, undelivered, and expired states.

Email coverage is mandatory for acceptance, delivered, deferred, dropped, bounced, and complaint/spam-report states. Open and click events are non-authoritative engagement hints only.

## Security Defaults

Every family requires:

- provider-authenticity verification before normalization
- timestamp or equivalent replay-window enforcement
- idempotency keys that include provider, event identity, event type, and occurrence time
- quarantine without normalized downstream event when signature or replay checks fail
- redacted evidence capture for browser automation

The signature and replay matrix lives in `data/analysis/203_signature_rotation_and_replay_matrix.csv`.

## Output Links

- Mock-now twin: `docs/external/203_mock_now_signal_configuration_twin.md`
- Live strategy and gates: `docs/external/203_actual_provider_strategy_and_live_gates.md`
- Signature and replay runbook: `docs/external/203_webhook_signature_and_replay_runbook.md`
- Control board: `docs/frontend/203_signal_edge_control_board.html`
