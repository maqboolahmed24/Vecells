# 203 Actual Provider Strategy And Live Gates

Real provider-console mutation is deliberately out of the default execution path. The repository now contains the strategy, selectors, redaction posture, rollback checklist, and validation layer needed to run later when credentials and approvals exist.

## Provider Strategy

| Provider lane | Console target | Mandatory fields | Mandatory callbacks |
| --- | --- | --- | --- |
| Twilio Voice | phone-number or TwiML app webhook settings | voice URL, status callback, recording status callback | `/edge/signal/telephony/provider-callback` |
| Vonage Voice | voice application and number callback settings | answer URL, event URL, optional number status callback | `/edge/signal/telephony/provider-callback` |
| Twilio SMS | messaging service or sender status callback | status callback URL | `/edge/signal/sms/status-callback` |
| Vonage SMS | application or account SMS callback settings | status URL, inbound URL if required, signature method | `/edge/signal/sms/status-callback` |
| Mailgun Email | domain event webhook settings | event webhook URL, signing validation | `/edge/signal/email/event-webhook` |
| SendGrid Email | event webhook settings | event webhook URL, signed webhook toggle/public key | `/edge/signal/email/event-webhook` |

Provider-specific selector placeholders are in `data/contracts/203_signal_provider_selector_manifests.json`. They are intentionally isolated from internal contract names so provider candidates can be swapped without changing domain event semantics.

## Live Mutation Gate

Live mutation remains blocked unless all preconditions pass:

- `ALLOW_SIGNAL_PROVIDER_MUTATION=true`
- target environment is declared as `SIGNAL_PROVIDER_TARGET_ENVIRONMENT`
- provider family is declared as `SIGNAL_PROVIDER_FAMILY`
- credential references resolve from approved secret management
- named approver is recorded as `SIGNAL_PROVIDER_APPROVAL_REF`
- signature preflight passes
- replay preflight passes
- rollback snapshot is captured
- redaction plan is enabled

Even with the flag present, this task does not authorize buying numbers, verifying senders, changing DNS, or enabling billable provider features. Those remain separate gated tasks.

## Rollback

Before any real provider mutation:

1. Capture a redacted before-state screenshot.
2. Save previous callback URL, event set, signature setting, and selector snapshot.
3. Apply only the edge endpoint and only the intended event bundle.
4. Run signed callback and replay probes.
5. If a probe fails, restore the previous callback URL and event bundle before leaving the console.
6. Capture a redacted after-state screenshot and evidence JSON.

The rollback checklist is machine-readable in `data/analysis/203_live_gate_and_rollback_checklist.json`.

## Mutation Prohibitions

Provider consoles must never be pointed at internal workers, queue consumers, private admin routes, raw object storage, or provider-specific shim routes. The live strategy uses `/edge/signal/*` endpoints only, then relies on the edge handler to normalize provider payloads into local contracts.

## Evidence Rules

Evidence must not contain raw provider credentials, signing material, full callback hosts from live environments, raw phone numbers, email recipients, or raw authorization headers. The harness writes redacted screenshots and JSON to `output/playwright/`.
