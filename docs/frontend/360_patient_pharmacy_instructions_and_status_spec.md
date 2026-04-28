# 360 Patient Pharmacy Instructions And Status Spec

## Scope

`par_360` replaces the generic instruction/status host region on the patient pharmacy shell with route-aware patient pages that read from the Phase 6 status truth.

It covers:

- chosen-pharmacy confirmation and next-step guidance
- contact and opening-state support cards
- referral reference presentation
- status tracking
- completed outcome, review-next-step, urgent, and contact-repair states

## Authoritative UI surfaces

- `ChosenPharmacyConfirmationPage`
- `PharmacyNextStepPage`
- `PharmacyContactCard`
- `PharmacyOpeningStateChip`
- `PharmacyReferralReferenceCard`
- `PharmacyStatusTracker`
- `PharmacyOutcomePage`
- `PharmacyReviewNextStepPage`
- `PharmacyContactRouteRepairState`

## Truth sources

The browser-facing preview layer binds the patient route to:

- `PharmacyPatientStatusProjection`
- `PharmacyPatientInstructionPanel`
- `PharmacyPatientProviderSummary`
- `PharmacyPatientReferralReferenceSummary`
- `PharmacyPatientReachabilityRepairProjection`
- `PharmacyOutcomeTruthProjection`

The browser may compose those facts for presentation. It may not infer calmness, completion, or repair closure from local click state.

## Patient content law

- keep the wording factual, plain, and active
- do not use transport or integration jargon
- do not turn the pharmacy route into appointment-booking language
- keep “what happens next” and “if symptoms get worse” visible together
- explain referral references in context, including whether they need to be kept

## Surface law

- `choose` remains owned by the chooser work from `358`
- `instructions` and `status` now prefer the `360` preview layer
- when no `360` preview exists, the shell may still fall back to the `359` dispatch surface
- the chosen pharmacy anchor remains visible across instructions, status, repair, review, urgent, and completed states

## Scenario seeds

- `PHC-2057`: pending referral confirmation, no calmness
- `PHC-2090`: review-next-step route, no routine pharmacy progress
- `PHC-2103`: urgent review and non-calm recovery posture
- `PHC-2184`: referral-confirmed instruction/status route
- `PHC-2188`: contact-route repair in the same shell
- `PHC-2196`: completed outcome with lawful calm copy

## Proof expectations

Playwright must prove that:

1. referral-confirmed routes show confirmation, next-step, contact, and reference content together
2. completed routes show the status tracker plus a completed outcome page
3. review and urgent states remain explicit and do not reuse the completed outcome language
4. contact-repair states stay visible with alert semantics and without losing the chosen pharmacy anchor
5. mobile reduced-motion routes do not overflow horizontally
