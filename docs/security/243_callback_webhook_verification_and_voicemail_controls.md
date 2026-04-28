# 243 Callback Webhook Verification And Voicemail Controls

The callback ingress stays fail-closed.

## Webhook verification

`recordProviderReceipt` accepts provider evidence only after `verifyCallbackWebhookSignature` validates the signed payload under `phase3-callback-hmac-sha256-simulator.v1`.

Current behavior:

- missing timestamp header -> reject
- missing signature header -> reject
- mismatched signature -> `CALLBACK_WEBHOOK_SIGNATURE_REJECTED`

Unsigned or ambiguous callbacks do not mutate callback truth. They do not advance `CallbackAttemptRecord`, `CallbackOutcomeEvidenceBundle`, or `CallbackResolutionGate`.

## Receipt replay posture

Provider callbacks are evidence inputs, not closure truth. Exact replay and semantic replay collapse onto the current `AdapterReceiptCheckpoint`. Divergent same-fence evidence opens canonical replay-collision review instead of emitting a second callback outcome.

## Voicemail controls

`voicemail_left` is governed by explicit policy, not transport optimism.

The resolver must answer:

- whether voicemail is allowed for the pathway and tenant policy
- what completion disposition applies
- which evidence refs are mandatory

Safe default posture:

- if policy is missing or ambiguous, voicemail is not treated as sufficient
- `CALLBACK_VOICEMAIL_POLICY_BLOCKED` is raised
- callback remains unresolved until a stricter policy and evidence chain are present

The current implementation defaults ambiguous voicemail to `evidence_only`. Allowed voicemail still requires the expected capture and script evidence refs before `CallbackOutcomeEvidenceBundle.outcome = voicemail_left` can settle.

## Privacy boundary

Provider disposition and route evidence are stored as durable refs on `CallbackOutcomeEvidenceBundle`. Raw telephony payloads are not treated as patient-visible truth, and closure guidance stays derived from `CallbackExpectationEnvelope` rather than leaking transport detail into patient-facing copy.
