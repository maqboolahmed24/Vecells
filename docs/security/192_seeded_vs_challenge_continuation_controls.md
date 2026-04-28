# 192 Seeded Vs Challenge Continuation Controls

## Token Hygiene

SMS continuation uses canonical `AccessGrantService` tokens. Tokens are opaque, non-enumerable, stored only as hashes, and redeemed exactly once through `AccessGrantRedemptionRecord`. `TelephonyContinuationContext`, `ContinuationDispatchIntent`, and `ContinuationMessageManifest` never store the raw token or signed URL.

## Message Manifest Masking

The SMS body contains no PHI, no seeded patient detail, no request narrative, no NHS number, no full phone number, and no signed URL. The message manifest records a template ref, copy code, body preview, and link placeholder only. Provider dispatch receives a delivery intent, not authority to decide seeded versus challenge continuation.

## Seeded Gating

Seeded continuation requires all current fences: settled `eligible_seeded`, destination verified for the intended patient, high-assurance current binding, current route family, current lineage fence, current release and channel posture, and an immutable `AccessGrantScopeEnvelope`. If any seeded fence is absent but bounded continuation remains lawful, the service downgrades to `continuation_challenge` with exact reason codes.

## Challenge Posture

Challenge continuation exposes no seeded patient data before the fresh challenge succeeds. Its session projection uses `challenge_minimal`, public-safe visibility, and `patientDataDisclosureAllowed = false` until a later governed challenge and capability decision allow more.

## Recovery And Supersession

Step-up, NHS login uplift, contact-route repair, subject conflict, session expiry, stale-link recovery, expired links, promotion, urgent diversion, and resend supersession create bounded `RecoveryContinuationToken` outcomes. Recovery is tied to the same request seed, route authority, patient shell continuity key, `PatientNavReturnContract`, and `PatientActionRecoveryEnvelope`; it may not redirect to a generic landing page or widen scope.

## Prohibited Patterns

The invariant is literal: manual_only creates no redeemable grant.

- `manual_only` must never be represented as an `AccessGrant` family.
- Dispatch code must never infer seeded continuation from identity score, caller ID, or SMS delivery acceptance.
- A redeemed URL grant must never be reused as the session credential.
- Replay must not mint another session, route intent, mutation path, or replacement link.
- Stale or superseded links must not show PHI-bearing seeded detail.
