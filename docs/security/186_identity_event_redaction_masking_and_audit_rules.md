# Identity Event Redaction, Masking, And Audit Rules

Identity audit disclosure follows least-necessary disclosure. Default operator logs and metrics are masked; raw values remain inside their owning evidence vault or quarantine boundary.

## Never Log In Plain Text

The following values must not appear in event payloads, logs, traces, metric labels, URLs, screenshots, queue names, or alert text:

- NHS numbers
- full phone numbers
- email addresses
- OAuth access, refresh, ID, authorization-code, nonce, PKCE, or grant token values
- raw OIDC claims or JWT payload material
- access-grant opaque values
- evidence blobs, raw PDS demographic payloads, file bytes, voice recordings, transcript text, or vendor identifiers that are directly identifying

The allowed substitutes are stable refs, masked fragments, digest refs, and governed artifact refs.

## Policy Rules

`phase2_identity_masking_policy_rules` publishes the central masking policy. The operational-log posture is deny-by-default: every sensitive rule has `operational_log_allowed = false`.

The transform is deterministic so replay, audit comparison, and regression tests can prove the same input class always maps to the same safe output class without exposing the raw value.

## Observability Scrubbing

`scrubLogRecord`, `scrubTraceAttributes`, and `scrubMetricLabels` use the same rules as event payload publication. Scrubbed records store:

- source ref
- surface: `log`, `trace`, or `metric`
- redacted field paths
- masking rule refs
- payload hash
- reason codes

This prevents PHI leakage through structured logs, tracing baggage, exception fields, route query strings, and high-cardinality metric labels.

## Audit And Replay

Canonical events are idempotent by `effectKeyRef`. First publication appends the envelope, outbox entry, and audit hash-chain record. Replays append a duplicate receipt instead of creating a second logical event.

The append-only sink supports OWASP-aligned security logging: authorization and session events tie to `edgeCorrelationId`, `causalToken`, route, policy, session, decision, grant, repair, and reason-code refs. Audit history remains immutable and reconstructable without default access to raw evidence.

## Required Controls

- `auth.login.started`, `auth.callback.received`, session lifecycle, patient matching, capability, age, grant, claim, repair, and optional PDS events must publish through `IdentityAuditAndMaskingService`.
- `CanonicalEventEnvelope.payload` must contain redacted payload fields only.
- `payloadHash` is computed after redaction.
- `AuditRecord` and FHIR `AuditEvent` companion exports must derive from the same envelope and audit row; FHIR companion records do not replace the internal audit spine.
- Break-glass, support, or governance exports need explicit purpose and disclosure tier; default operational observability remains masked.
