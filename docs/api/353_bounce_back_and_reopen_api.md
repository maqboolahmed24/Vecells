# 353 Bounce-Back and Reopen API

## Authoritative module

`/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-engine.ts`

## Commands

### `previewNormalizedBounceBack(input)`

Purpose:
- classify inbound evidence into one of the seven frozen bounce-back types
- compute reopen posture without mutating the case

Required inputs:
- `pharmacyCaseId`
- `sourceKind`
- `evidenceSummaryRef`
- `receivedAt`
- `recordedAt`

Optional sources:
- `sourceOutcomeOrDispatchRef`
- `explicitBounceBackType`
- delta and severity overrides

Returns:
- `normalizedEnvelope`
- `bounceBackType`
- `urgencyCarryFloor`
- `materialChange`
- `loopRisk`
- `reopenSignal`
- `reopenPriorityBand`
- `reopenedCaseStatus`
- `gpActionRequired`
- `supervisorReviewRequired`
- `reopenByAt`
- `directUrgentRouteRequired`

### `ingestBounceBackEvidence(input)`

Purpose:
- persist the bounce-back envelope and record
- reopen the case truth if the current case is still in a mutable outcome stage
- create reachability, practice, patient, and supervisor artifacts

Additional required inputs:
- authority tuple from `346`
- `patientShellConsistencyProjectionId`
- `patientContactRouteRef` unless a current reachability plan already exists

Returns:
- `pharmacyCase`
- `bounceBackRecord`
- `bounceBackTruthProjection`
- `practiceVisibilityProjection`
- `patientStatusProjection`
- `notificationTrigger`
- `supervisorReview`
- `reachabilityPlan`
- `replayed`

### `reopenCaseFromBounceBack(input)`

Purpose:
- reopen a supervised or settled bounce-back into the allowed target case state

Rules:
- rejects while supervisor review is still `required` or `in_review`
- refreshes practice visibility and bounce-back truth to point at the latest patient and practice projections

### `resolveSupervisorReview(input)`

Supported resolutions:
- `resolved_allow_redispatch`
- `resolved_keep_block`
- `dismiss_as_material_change`

Effect:
- closes the active supervisor review
- updates redispatch block posture
- republishes current bounce-back truth

## Queries

### `getActiveBounceBackSummary(pharmacyCaseId)`

Returns the current `PharmacyBounceBackTruthProjection` or `null`.

### `getLoopRiskAndSupervisorPosture(pharmacyCaseId)`

Returns queue-facing posture:
- `materialChange`
- `loopRisk`
- `reopenPriorityBand`
- `supervisorReviewState`
- `autoRedispatchBlocked`
- `autoCloseBlocked`

### `getReturnSpecificPatientMessagePreview(pharmacyCaseId)`

Returns the current `PharmacyReturnNotificationTrigger` or `null`.

## Frozen bounce-back vocabulary

- `urgent_gp_return`
- `routine_gp_return`
- `patient_not_contactable`
- `patient_declined`
- `pharmacy_unable_to_complete`
- `referral_expired`
- `safeguarding_concern`
