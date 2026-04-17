# 205 IVR Webhook Audio Integrity Suite

## Purpose

Task `seq_205` publishes the repeatable Phase 2 telephony integrity suite. It proves that telephony webhook ingress, IVR gather capture, recording custody, transcript readiness, and continuation-grant redemption remain governed parts of the canonical intake model rather than a side channel.

## Mock-Now Execution

This run is mock-now and simulator-backed. It uses repository-owned provider webhook fixtures, deterministic signed payloads, staged audio assets, local quarantine/readiness rules, and the current continuation-grant implementation. It does not require live calls, purchased numbers, production SMS, or real provider credentials.

The mock-now lane proves:

- invalid, missing, replayed, malformed, duplicate, disordered, and burst webhook callbacks fail closed or collapse idempotently
- DTMF, speech, mixed input, timeout, retry, urgent, non-urgent, restart, hangup, and duplicate gather paths preserve the canonical call-session state machine
- missing, late, duplicate, corrupt, truncated, unsupported, hash-mismatched, quarantined, storage-failed, and retrying audio cannot become ready evidence prematurely
- seeded and challenge continuation grants remain separate across issue, redemption, replay, supersession, expiry, wrong-subject, and lineage-mismatch paths

## Live-Provider-Later Strategy

Actual-provider-later execution must reuse the same event family names, replay keys, custody states, readiness verdicts, grant families, and same-lineage recovery semantics. If Twilio, Vonage, SendGrid, or another provider behaves differently, the adapter must normalize the provider behavior into the local contract. The suite must not be weakened to match a provider console quirk.

## Provider Hardening References

The implementation records current provider-hardening ideas from:

- Twilio request validation: `https://www.twilio.com/docs/usage/security#validating-requests`. Adapted idea: every inbound callback must be verifiable before business processing.
- Twilio Voice status callbacks: `https://www.twilio.com/docs/voice/api/call-resource#statuscallback`. Adapted idea: call lifecycle callbacks are event evidence, not final platform truth.
- Twilio recording callbacks: `https://www.twilio.com/docs/voice/api/recording#recordingstatuscallback`. Adapted idea: recording availability must enter custody and readiness assessment before promotion.
- Vonage webhook/signature guidance: `https://developer.vonage.com/en/getting-started/concepts/webhooks`. Adapted idea: provider webhook transport and signature policy stays outside the internal canonical model.
- SendGrid event webhook security: `https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features`. Adapted idea: signed event webhooks should publish key-bound verification posture and replay metadata.

## Design Research References

The lab borrows composition discipline, not branding, from:

- Carbon dashboard guidance: `https://v10.carbondesignsystem.com/data-visualization/dashboards/`. Borrowed idea: reduce the command surface to high-signal state, trend, and exception context.
- Carbon status indicator pattern: `https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/`. Borrowed idea: statuses must be textual and color is only reinforcement.
- GOV.UK type scale: `https://design-system.service.gov.uk/styles/type-scale/`. Borrowed idea: predictable type hierarchy and zoom resilience are mandatory for regulated surfaces.
- NHS Service Manual typography: `https://service-manual.nhs.uk/design-system/styles/typography`. Borrowed idea: restrained copy and spacing make safety-critical information easier to scan.

## Repository-Owned Defect Evidence

No 205-scoped repository-owned defect was found in the current telephony integrity boundary. The targeted service run passed:

```bash
pnpm --filter @vecells/command-api exec vitest run tests/telephony-edge-ingestion.integration.test.js tests/telephony-call-session-state-machine.integration.test.js tests/telephony-recording-ingest-pipeline.integration.test.js tests/telephony-readiness-pipeline.integration.test.js tests/telephony-continuation-grants.integration.test.js tests/telephony-convergence-pipeline.integration.test.js tests/telephony-verification-pipeline.integration.test.js
```

Observed result: 7 test files passed, 55 tests passed, latest duration 2.23s.

## Deliverable Map

| Artifact                                                  | Role                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `data/test/205_webhook_event_cases.csv`                   | Webhook integrity plus IVR/call-session state fixtures                         |
| `data/test/205_audio_integrity_cases.csv`                 | Recording custody and readiness fixtures                                       |
| `data/test/205_continuation_grant_cases.csv`              | Seeded/challenge grant issuance, redemption, replay, and supersession fixtures |
| `data/test/205_expected_readiness_and_settlements.json`   | Required counters, events, readiness, and settlement rules                     |
| `data/test/205_suite_results.json`                        | Machine-readable verdict with mock-now/live-later separation                   |
| `docs/frontend/205_telephony_integrity_lab.html`          | Browser-visible `Telephony_Integrity_Grant_Lab`                                |
| `tests/playwright/205_telephony_integrity_lab.spec.ts`    | Playwright structural and browser proof                                        |
| `tools/test/validate_phase2_telephony_integrity_suite.py` | Repository validator and chain guard                                           |

## Commands

```bash
pnpm validate:phase2-telephony-integrity-suite
pnpm exec tsx tests/playwright/205_telephony_integrity_lab.spec.ts
pnpm exec tsx tests/playwright/205_telephony_integrity_lab.spec.ts --run
```
