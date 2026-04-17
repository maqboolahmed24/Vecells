# 219 Controlled Resend Replay Webhook And Metadata Controls

Task: `par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations`

## Provider Webhook Verification

Provider callbacks never become delivery truth until a provider-supported verification mechanism succeeds.

For Twilio callbacks, the control plane expects `X-Twilio-Signature` verification over the callback URL and request parameters before accepting a status callback. Twilio documents that it cryptographically signs webhook requests and sends the signature in the `X-Twilio-Signature` header. The 219 stack records failed checks as `AdapterReceiptCheckpoint.webhookSignatureState = quarantined_invalid_signature` and does not mutate `SupportActionSettlement`.

For SendGrid event webhooks, the control plane expects either signed event webhook verification or the provider-supported OAuth event webhook flow. SendGrid documents the `X-Twilio-Email-Event-Webhook-Signature` and `X-Twilio-Email-Event-Webhook-Timestamp` headers, public-key verification, raw-byte payload handling, and OAuth client-credentials option. The stack records successful callbacks as `SUPPORT_219_REPAIR_PROVIDER_CALLBACK_SIGNATURE_VALIDATED`.

## Provider Metadata Hygiene

Provider metadata is not a PHI store. `ProviderSafeMetadataBundle` allows only correlation hashes and local lookup refs:

- `category = support_repair_notice`
- `customArgs.correlation_id`
- `customArgs.dispatch_ref_hash`
- `customArgs.support_attempt_ref_hash`
- `uniqueArgs.correlation_id`
- `uniqueArgs.chain_ref_hash`
- `localLookupRef`

Forbidden examples include direct patient identifiers, NHS subject refs, phone numbers, email addresses, date of birth, postcode, appointment details, clinical text, request descriptions, or PHI-bearing excerpts in:

- SendGrid categories
- SendGrid `unique_args`
- SendGrid v3 `custom_args`
- Twilio callback URLs or equivalent provider-side non-PII metadata

SendGrid documents that categories and unique arguments/custom arguments are stored as non-PII, are not generally redactable, can be visible to employees, and may persist long-term. The 219 validator checks these rules through `219_provider_metadata_and_webhook_hygiene.json` and the source-level `SUPPORT_REPAIR_REPLAY_FORBIDDEN_PROVIDER_METADATA_FIELDS` list.

## Logging Discipline

Structured repair logs must contain enough to reconstruct the repair chain without raw sensitive content:

- `correlationId`
- `causalToken`
- `supportMutationAttemptRef`
- `messageDispatchEnvelopeRef`
- `deliveryEvidenceBundleRef`
- `threadResolutionGateRef`
- `supportLineageBindingRef`
- `governingThreadTupleHash`
- `governingSubthreadTupleHash`
- route-intent and mask-scope event refs

Logs must keep session, route-intent, mask-scope, provider signature, and delivery evidence events distinct. Raw provider payloads are represented by redacted storage refs, not inline payload dumps.

## Failure Posture

Invalid webhook signatures, route drift, stale lineage, mask-scope drift, pending external confirmation, and replay publication drift all fail closed. The operator remains in the same support shell with `SupportReadOnlyFallbackProjection`; they are not ejected to a generic access-error page.

References:

- Twilio request validation: https://www.twilio.com/docs/usage/security#validating-requests
- SendGrid Event Webhook security: https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features
- SendGrid unique arguments and custom arguments: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/unique-arguments
- SendGrid categories non-PII warning: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/categories
- OWASP Logging: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
