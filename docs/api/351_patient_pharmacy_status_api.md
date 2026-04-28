# 351 Patient Pharmacy Status API

The canonical service surface is `Phase6PharmacyPatientStatusService` from `packages/domains/pharmacy/src/phase6-pharmacy-patient-status-engine.ts`.

## Constructors

- `createPhase6PharmacyPatientStatusStore()`
- `createPhase6PharmacyPatientStatusService(dependencies?)`

## Command API

### `projectPatientStatus`

Input:

- `pharmacyCaseId`
- `patientShellConsistencyProjectionId`
- `recordedAt`

Returns `PharmacyPatientStatusBundle` containing:

- `pharmacyCase`
- `patientStatusProjection`
- `providerSummary`
- `referralReferenceSummary`
- `reachabilityRepairProjection`
- `continuityProjection`
- `instructionPanel`
- `outcomeTruthProjection`
- `reachabilityPlan`

This is the only server-side entrypoint later patient UIs need to build the pharmacy request surface.

## Read API

### `getPatientPharmacyStatus(pharmacyCaseId)`

Returns the current `PharmacyPatientStatusProjection` or `null`.

### `getPatientInstructionPanel(pharmacyCaseId)`

Returns the current `PharmacyPatientInstructionPanel` or `null`.

### `getPatientContactRouteRepairEntry(pharmacyCaseId)`

Returns the current `PharmacyPatientReachabilityRepairProjection` or `null`.

### `getPatientReferralReferenceSummary(pharmacyCaseId)`

Returns the current `PharmacyPatientReferralReferenceSummary` or `null`.

## Response-law highlights

- Patient APIs must not imply a booked appointment unless a future partner contract explicitly supports that model.
- `completed` is illegal while outcome review, urgent return, reachability repair, or identity freeze remains open.
- Provider and reference summaries remain visible as provenance during review, but identity freeze suppresses ordinary live detail.
- Reachability repair always carries anchor and continuation bindings so UI can preserve same-shell context.
