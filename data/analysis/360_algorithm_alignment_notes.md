# 360 Algorithm Alignment Notes

`par_360` keeps the patient route family aligned to the existing Phase 6 status engine rather than introducing a separate frontend-only state machine.

## Source-to-surface mapping

- `PharmacyPatientStatusProjection.currentMacroState`
  - drives `data-patient-status-macro-state`
  - drives `SharedStatusStrip`
  - drives `CasePulse`
  - selects which dominant patient page is shown
- `PharmacyPatientStatusProjection.staleOrBlockedPosture`
  - drives `data-patient-status-posture`
  - widens the shell into stale, repair, or urgent posture
- `PharmacyPatientInstructionPanel`
  - provides the headline, next-step, who-or-where, when, warning, review, and calm copy blocks
- `PharmacyPatientProviderSummary`
  - drives `PharmacyContactCard`
  - drives `PharmacyOpeningStateChip`
- `PharmacyPatientReferralReferenceSummary`
  - drives `PharmacyReferralReferenceCard`
- `PharmacyPatientReachabilityRepairProjection`
  - drives `PharmacyContactRouteRepairState`
- `PharmacyOutcomeTruthProjection`
  - drives `PharmacyOutcomePage`
  - distinguishes pending, review, reopened, and completed outcome posture

## Shell law

- `/pharmacy/:pharmacyCaseId/choose` remains owned by the chooser work from `358`
- `/pharmacy/:pharmacyCaseId/instructions` and `/status` now prefer the `360` preview layer
- if no `360` preview exists for a case, the shell falls back to the `359` dispatch surface

## Content law

- no appointment framing is used for pharmacy status or outcome pages
- calm completion copy is allowed only when `currentMacroState=completed` and `calmCopyAllowed=true`
- review and urgent states stay explicit and do not reuse the completed outcome language
- contact-repair states keep the chosen pharmacy and referral reference visible while the patient repairs the route
