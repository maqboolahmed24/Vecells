# 198 Mobile SMS Continuation Flow For Callers

Task: `par_198`
Visual mode: `Mobile_Continuation_Pulse`

## Purpose

The mobile SMS continuation surface lets a caller continue a request from a phone call without creating a phone-only intake schema. Every writable route converges into the canonical Phase 1 request semantics: request questions, evidence upload, review, submit, receipt, status, and re-safety.

## Resolver Contract

`MobileContinuationResolver` consumes a projection family that mirrors the Phase 2 telephony and identity contracts:

- `AccessGrant` describes the seeded or challenge grant family and handset verification state.
- `AccessGrantScopeEnvelope` gates upload and canonical submission capability.
- `AccessGrantRedemptionRecord` maps fresh, duplicate, stale, and blocked redemption states.
- `AccessGrantSupersessionRecord` forbids second paths for replay and stale links.
- `RouteIntentBinding` keeps the route in `rf_mobile_sms_continuation`.
- `RecoveryContinuationToken` stores only a safe pointer, never a raw token.
- `PatientSecureLinkSessionProjection` decides whether safe seeded context may be visible.
- `PatientActionRecoveryProjection` forbids generic home redirects for recoverable same-lineage flows.
- `PatientRequestReturnBundle` preserves selected mobile step, save state, request summary, and return target.
- `TelephonyContinuationContext` distinguishes current, challenge, stale, replayed, recovery, and manual-only call context.

## Privacy Rules

Seeded verified continuation may show “we have already captured some details” after eligibility is settled and handset verification is true. It shows only safe context: call origin, callback request, and general next-step guidance.

Challenge continuation shows no pre-existing patient or request data before success. The challenge landing and question step render only generic safety copy, the challenge input, save/progress affordances, and manual support escape.

Replay and stale links never create a second continuation path. Duplicate replay maps to the same settled receipt; stale or superseded links use `ContinuationRecoveryBridge` in the same mobile shell.

Manual-only and no-access outcomes are routing outcomes, not redeemable surfaces. They expose no captured context and center practice support.

## Mobile Shell

The shell is intentionally one column on all sizes. The phone viewport maxes at 430px with 16px side padding, a 56px `ContinuationHeaderBand`, persistent `MobileProgressStrip`, visible `ContinuationSaveStateChip`, and a 68px sticky action dock.

## Same-Shell Recovery

Refresh, stale-link recovery, sign-in uplift, and step-up interruptions preserve:

- selected mobile step
- request summary
- save state
- return target
- recovery pointer
- canonical Phase 1 handoff

The implementation stores only the selected step, detail text, and uploaded file names in session storage. It does not store raw SMS tokens, callback signatures, full phone numbers, webhook payloads, or identifiers.

## Screen Families

- `SeededContinuationLanding`
- `ChallengeContinuationLanding`
- `ChallengeQuestionStep`
- `CapturedSoFarReview`
- `AddMoreDetailStep`
- `UploadEvidenceStep`
- `ReviewBeforeSubmitStep`
- `ReplayMappedOutcome`
- `StaleLinkRecoveryBridge`
- `ManualOnlyOutcome`

## Interface Gap

Sibling frontend tasks `par_199` and `par_201` are not complete in this checkout, so `data/analysis/PARALLEL_INTERFACE_GAP_PHASE2_SMS_CONTINUATION.json` records the temporary fallback: the SMS continuation shell publishes its return bundle and settled receipt projection locally, ready to bind to saved-context restore and cross-channel receipt parity when those sibling surfaces land.
