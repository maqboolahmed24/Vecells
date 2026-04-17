# 192 Telephony SMS Continuation Grant Design

`TelephonyContinuationGrantService` is the Phase 2 orchestration layer between settled phone evidence and canonical patient access. It does not mint a telephony-local token. It settles one `TelephonyContinuationEligibility`, records one non-redeemable `TelephonyContinuationContext`, and then either calls `AccessGrantService` for `continuation_seeded_verified` or `continuation_challenge`, or routes `manual_only` with no redeemable grant.

## Decision Order

1. Load the latest `TelephonyEvidenceReadinessAssessment`.
2. Load the current telephony verification decision, identity confidence ref, destination confidence ref, authority-settled binding fence, and route or lineage fence.
3. Settle `TelephonyContinuationEligibility` as `eligible_seeded`, `eligible_challenge`, `manual_only`, or `not_eligible`.
4. Create `TelephonyContinuationContext` as the immutable issuance and fence record.
5. Issue a canonical `AccessGrant` only when eligibility is seeded or challenge.
6. Create `ContinuationDispatchIntent` and `ContinuationMessageManifest`; dispatch does not decide grant family.
7. Redeem through `AccessGrantService` and settle `ContinuationRedemptionOutcome`.
8. On success, create `SecureLinkSessionProjection` with fresh session and CSRF refs. On interruption, create `RecoveryContinuationToken`.

## Grant Families

`continuation_seeded_verified` is allowed only when the settled eligibility state is `eligible_seeded`, destination posture is verified for the intended patient, a high-assurance current binding exists, and the scope envelope can freeze route family, request seed, route intent, release freeze, channel posture, session epoch, subject binding version, and lineage fence.

`continuation_challenge` is allowed when bounded continuation is safe but seeded disclosure is not. It explicitly carries `challenge_before_disclosure`, public-safe visibility, and no seeded patient data before the fresh challenge succeeds.

`manual_only` creates no redeemable grant. It is the required outcome for `urgent_live_only`, `manual_review_only`, `unusable_terminal`, blocked channel posture, or explicit not-eligible continuation.

## Exact-Once Redemption

Redemption first settles the canonical `AccessGrantRedemptionRecord`. Duplicate clicks, refreshes, parallel browser opens, and delayed SMS clicks return the same settled `ContinuationRedemptionOutcome`; they do not create a second session, second route intent, widened scope, or second mutation path.

## Same-Shell Recovery

Step-up, NHS login uplift, contact-route repair, subject conflict, session expiry, stale-link recovery, and superseded-link recovery create `RecoveryContinuationToken` rows bound to the same request seed, route family, shell continuity key, `PatientNavReturnContract`, and `PatientActionRecoveryEnvelope`. The recovery route must reopen the same continuation shell rather than a generic home route.

## Supersession

Resend issues a fresh canonical grant and supersedes the previous grant through `AccessGrantSupersessionRecord`. Later clicks on the old link resolve to bounded same-lineage recovery. Promotion, urgent diversion, binding drift, session epoch drift, route drift, release drift, and expiry use the same supersession or recovery path rather than silently preserving stale links.
