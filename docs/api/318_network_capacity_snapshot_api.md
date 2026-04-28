# 318 Network Capacity Snapshot API

## Public Service

The package export is
`createPhase5NetworkCapacityPipelineService` from
[phase5-network-capacity-pipeline.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts).

## Main Commands

### `buildCandidateSnapshotForCase`

Input:

- `hubCoordinationCaseId`
- `evaluatedAt`
- `adapterBindings[]`
- optional tuple presentation and ledger inputs:
  - `presentedPolicyTupleHash`
  - `adjustedPopulation`
  - `deliveredMinutes`
  - `availableMinutes`
  - `cancelledMinutes`
  - `replacementMinutes`
  - `commissionerExceptionRef`
  - `minimumNecessaryContractRef`
  - `weekStartAt`
  - `weekEndAt`
  - `cancellationServiceDate`

Output:

- `adapterRuns[]`
- `sourceAdmissions[]`
- `candidates[]`
- `snapshot`
- `rankProof`
- `rankExplanations[]`
- `decisionPlan`
- `minutesLedger`
- `cancellationMakeUpLedger`
- `supplyExceptions[]`
- `policyResult`
- `replayFixture`

## Adapter Contract

Every binding is already production-shaped even when the repo uses staged fixtures:

- `native_api_feed`
- `partner_schedule_sync`
- `manual_capacity_board`
- `batched_capacity_import`

Each binding must carry:

- identity
- version
- fetch timestamp
- trust evidence
- normalized-capable row payload

## Canonical Candidate Fields

The pipeline persists the 312 contract fields that later tracks need:

- site identity
- modality
- clinician type
- start and end
- `requiredWindowFit`
- `manageCapabilityState`
- accessibility fit
- freshness and trust state
- canonical capacity-unit ref
- `baseUtility`
- `uncertaintyRadius`
- `robustFit`
- linked explanation and proof refs

## Replay

`replayCandidateSnapshot({ snapshotId })` rebuilds the ranked surface from the stored replay fixture and reports semantic drift. This is the authoritative regression seam for later tracks.
