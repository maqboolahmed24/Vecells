# 192 Telephony Continuation Grant And Redemption Contract

## Internal Eligibility

`POST /internal/telephony/call-sessions/{callSessionRef}/continuation-eligibility` settles `TelephonyContinuationEligibilityContract`.

Required inputs are the latest `TelephonyEvidenceReadinessAssessment`, the telephony verification decision refs, destination posture, authority binding posture, and route-fence tuple. The result contains `grantFamilyRecommendation`, `eligibilityState`, `lineageScope`, exact downgrade reason codes, and the governing refs used for audit.

## Dispatch

`POST /internal/telephony/call-sessions/{callSessionRef}/continuation-dispatches` accepts a settled eligibility record. It returns:

- `TelephonyContinuationContext`: the non-redeemable issuance and fence record.
- `ContinuationDispatchIntent`: the SMS dispatch command with masked destination and no PHI body.
- `ContinuationMessageManifest`: the template and body copy code. It must set `containsPhi = false` and `includesSignedUrl = false`.
- `AccessGrant` refs only for seeded or challenge continuation. `manual_only` returns no token and no grant ref.

## Redemption

`POST /patient/secure-link/telephony-continuation/redeem` accepts the presented opaque grant token plus the current route tuple and idempotency key. The route handler must call `AccessGrantService.redeemGrant` first.

The response is `ContinuationRedemptionOutcomeContract`:

- `session_established`: first successful redemption; a fresh `SecureLinkSessionProjection` and CSRF ref are created.
- `replay_returned`: repeated click or refresh; the original settled outcome is returned.
- `step_up_interrupted`: challenge, NHS login uplift, contact-route repair, subject conflict, or session expiry interrupted the flow; a `RecoveryContinuationToken` is returned.
- `stale_link_recovery`: expiry, route drift, release drift, lineage drift, or recoverable scope drift.
- `superseded_recovery`: a resend, promotion, urgent diversion, binding drift, or repair event superseded the older link.
- `denied`: no same-lineage recovery is lawful.

## Recovery Resume

`POST /patient/secure-link/telephony-continuation/recovery` consumes `RecoveryContinuationEnvelopeContract`. It preserves same-shell continuity by carrying route family, request seed, return contract ref, patient shell consistency ref, selected mobile step, and recovery reason code.

## Session Projection

`GET /internal/telephony/continuation-sessions/{secureLinkSessionRef}` returns `SecureLinkSessionProjectionContract`. The projection explicitly distinguishes `seeded_verified`, `challenge_minimal`, and `recovery_only` disclosure posture. The URL grant is never reusable after this projection exists.
