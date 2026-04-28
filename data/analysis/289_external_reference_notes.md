# 289 External Reference Notes

Accessed on 2026-04-18.

## Sources reviewed

- [Twilio: Track the Message Status of Outbound Messages](https://www.twilio.com/docs/messaging/guides/track-outbound-message-status)
- [Twilio: Webhooks security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Twilio Verify: Developer best practices](https://www.twilio.com/docs/verify/developer-best-practices)
- [Mailgun: Webhooks](https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks)
- [Mailgun: Secure Your Webhooks](https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks)
- [Node.js Timers API](https://nodejs.org/api/timers.html)

## Borrowed

- Borrowed: Twilio outbound message-status guidance reinforces that provider callbacks are asynchronous delivery evidence, may arrive out of order, and may not be treated as the same thing as local reminder truth.
- Borrowed: Twilio webhook-security guidance reinforces validating provider signatures server-side before reminder evidence is accepted into the authoritative chain.
- Borrowed: Twilio Verify best-practice guidance reinforces that route verification and replay defense remain explicit trust steps rather than a byproduct of successful message transport.
- Borrowed: Mailgun webhook and secure-webhook guidance reinforces token or signature validation plus replay defense for delivery evidence ingestion.
- Borrowed: Node.js timers guidance reinforces that runtime timers are wake-up hints only; durable reminder state must live in repository objects that survive restarts.

## Rejected

- Rejected: treating provider acceptance or provider callback arrival as proof that a patient-safe reminder was delivered.
- Rejected: accepting unsigned or non-deduplicated webhook traffic as authoritative delivery evidence.
- Rejected: using process-local timers or worker memory as reminder truth instead of a durable `ReminderPlan`.
- Rejected: treating route verification as optional once a message has been accepted for transport.

## Notes

The local Phase 0 and Phase 4 blueprints remained authoritative throughout implementation. These sources were used to harden callback authenticity, replay safety, delivery-evidence handling, and timer semantics without relaxing the repository's booking-truth law.
