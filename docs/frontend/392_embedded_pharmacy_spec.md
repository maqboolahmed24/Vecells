# Embedded Pharmacy Route Family

Task: `par_392_phase7_track_Playwright_or_other_appropriate_tooling_frontend_build_embedded_pharmacy_choice_instructions_status_and_return_journeys`

Visual mode: `NHSApp_Embedded_Pharmacy`

## Route Family

- `/nhs-app/pharmacy/:pharmacyCaseId/choice`
- `/nhs-app/pharmacy/:pharmacyCaseId/instructions`
- `/nhs-app/pharmacy/:pharmacyCaseId/status`
- `/nhs-app/pharmacy/:pharmacyCaseId/outcome`
- `/nhs-app/pharmacy/:pharmacyCaseId/recovery`
- `/embedded-pharmacy/:pharmacyCaseId/:route` remains as a local fallback alias.

## Source Bindings

- Provider order, warning disclosure, and selected-provider provenance come from `PharmacyChoiceTruthProjection`.
- Dispatch status and calm status wording come from `PharmacyDispatchTruthProjection`.
- Instruction, status, outcome, contact repair, and urgent return copy come from `PharmacyPatientStatusProjection` and `PharmacyOutcomeTruthProjection`.
- Same-shell continuity is published through `EmbeddedPharmacyContinuityEvidence`.

## Route Behavior

- Choice is list-first. Distance, travel, and opening hours stay secondary metadata.
- Instructions and status remain inside the same embedded shell and keep the chosen provider summary above them.
- Outcome copy is shown only from completed outcome truth.
- Urgent return, bounce-back, reopen, and proof-refresh states suppress live provider-change controls and show recovery cards.
- Dispatch drift, choice proof drift, and outcome drift keep the previous provider visible as provenance.

## Components

- `EmbeddedPharmacyChooser`
- `EmbeddedPharmacyChoiceRow`
- `EmbeddedChosenPharmacyCard`
- `EmbeddedPharmacyInstructionsPanel`
- `EmbeddedReferralStatusSurface`
- `EmbeddedPharmacyOutcomeCard`
- `EmbeddedUrgentReturnRecoveryCard`
- `EmbeddedPharmacyRecoveryBanner`
- `EmbeddedChoiceDisclosurePanel`
- `EmbeddedPharmacyDistanceMeta`
- `EmbeddedPharmacyActionReserve`

