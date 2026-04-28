# 354 Pharmacy Operations and Visibility API

## Authoritative module

`/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-operations-engine.ts`

## Factory

### `createPhase6PharmacyOperationsService(input?)`

Returns a service bundle containing:

- `repositories`
- `operationsProjectionBuilder`
- `practiceVisibilityProjectionBuilder`
- `exceptionClassifier`
- `providerHealthProjectionBuilder`
- `worklistDeltaService`
- `queryService`

The default wiring composes the existing Phase 6 pharmacy stores. Tests may inject custom repositories.

## Refresh entrypoint

### `refreshOperationsProjections({ recordedAt? })`

Purpose:

- load the current pharmacy case set
- rebuild case-level exception evidence
- rebuild minimum-necessary practice visibility models
- persist all six current projection families
- rebuild provider health and queue audit history

Returns:

- `activeCases`
- `waitingForChoice`
- `waitingOutcome`
- `bounceBack`
- `exceptions`
- `providerHealth`

## Query service

### `fetchActiveCasesWorklist(input?)`

Returns:

- `rows: PharmacyActiveCasesProjectionSnapshot[]`
- `summary: PharmacyWorklistSummary`

Filters:

- provider key
- minimum queue age
- minimum severity
- exception classes
- continuity states
- review debt state
- deterministic sort and seen-row delta support

### `fetchWaitingForChoiceWorklist(input?)`

Returns:

- `rows: PharmacyWaitingForChoiceProjectionSnapshot[]`
- `summary`

Key fields per row:

- `visibleChoiceCount`
- `recommendedFrontierSummaryRef`
- `warnedChoiceSummaryRef`
- `staleDirectoryPosture`
- `selectedProviderState`
- `patientOverrideRequired`

### `fetchDispatchedWaitingOutcomeWorklist(input?)`

Returns:

- `rows: PharmacyDispatchedWaitingOutcomeProjectionSnapshot[]`
- `summary`

Key fields per row:

- `transportMode`
- `authoritativeProofState`
- `proofRiskState`
- `proofDeadlineAt`
- `outcomeTruthState`
- `noOutcomeWindowBreached`

### `fetchBounceBackWorklist(input?)`

Returns:

- `rows: PharmacyBounceBackProjectionSnapshot[]`
- `summary`

Key fields per row:

- `bounceBackType`
- `reopenedCaseStatus`
- `gpActionRequired`
- `triageReentryState`
- `urgentReturnState`
- `reachabilityRepairState`
- `supervisorReviewState`
- `loopRisk`

### `fetchDispatchExceptionWorklist(input?)`

Returns:

- `rows: PharmacyDispatchExceptionProjectionSnapshot[]`
- `summary`

Key fields per row:

- `primaryExceptionClass`
- `activeExceptionClasses`
- `exceptionEvidence`
- `continuityState`
- `freshnessState`
- `reviewDebtState`

### `fetchProviderHealthSummary(input?)`

Returns:

- `rows: PharmacyProviderHealthProjectionSnapshot[]`
- `summary`

Key fields per row:

- `providerKey`
- `providerDisplayName`
- `discoveryAvailabilityState`
- `dispatchHealthState`
- operational counters for failures, debt, and backlog
- `transportSummaries`
- `lastGoodEvidenceAt`
- `latestEvidenceAt`

### `fetchProviderHealthDetail(providerKey, { recordedAt? })`

Returns:

- `projection`
- `historySummary`

`historySummary` is a filtered `PharmacyOperationsAuditEventSnapshot[]` for that provider scope.

### `fetchPracticeVisibilityModel(pharmacyCaseId, { recordedAt? })`

Returns a `PharmacyPracticeVisibilityModelSnapshot | null`.

The shape is audience-safe and includes:

- provider selection and dispatch posture
- patient instruction and outcome refs
- GP action, re-entry, urgent return, and reachability repair posture
- close blockers and confirmation gates
- continuity and freshness posture
- minimum-necessary timestamps and refs
- active exception classes

### `fetchQueueCountsAndAgeingSummaries({ recordedAt?, seenRowsByWorklist? })`

Returns one `PharmacyWorklistSummary` per projection family.

This is the canonical source for start-of-day counts, urgency totals, queue ageing, and changed-since-seen counters.

### `fetchChangedSinceSeenDeltas({ recordedAt?, worklistFamily, seenRows })`

Returns:

- `addedCount`
- `changedCount`
- `removedCount`
- `unchangedCount`
- `deltaEntries`

This endpoint is intentionally version-based. It does not depend on live transport or browser session state.

## Mandatory exception classes

The API surfaces only the normalized machine-readable taxonomy:

- `discovery_unavailable`
- `no_eligible_providers_returned`
- `dispatch_failed`
- `acknowledgement_missing`
- `outcome_unmatched`
- `no_outcome_within_configured_window`
- `conflicting_outcomes`
- `reachability_repair_required`
- `consent_revoked_after_dispatch`
- `dispatch_proof_stale`

## Module boundary

- Later UIs may filter, sort, and render these responses.
- Later UIs may not invent queue membership, provider health, or practice visibility semantics client-side.
- `355`, `356`, and `357` must consume this backend truth family rather than recomputing it from raw pharmacy events.
