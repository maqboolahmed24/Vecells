# 355 Pharmacy Console Support Region and Stock Truth API

## Authoritative module

`/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-console-engine.ts`

## Factories

### `createPhase6PharmacyConsoleStore()`

Returns the repository bundle for:

- medication line state
- inventory support records
- inventory comparison fences
- supply computations
- all 355 projection families

### `createPhase6PharmacyConsoleBackendService(input?)`

Returns the service bundle that composes the default pharmacy console stores and builders. Tests may inject repositories and builders explicitly.

## Refresh entrypoint

### `refreshConsoleCase(pharmacyCaseId, { recordedAt? })`

Purpose:

- load the current case and line-level support state
- rebuild summary, worklist, workbench, mission, validation, inventory, comparison, handoff, continuity, settlement, and assurance projections
- persist fresh fence and supply-derived posture

Returns a bundle containing the current 355 projection family for that case.

## Query surface

### `fetchConsoleSummaryProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyConsoleSummaryProjectionSnapshot | null`.

Key fields:

- queue and case refs
- checkpoint and severity summaries
- verified-line counts
- active-fence counts
- dominant support-region and validation mode
- handoff readiness
- continuity and assurance posture

### `fetchConsoleWorklist({ recordedAt?, handoffReadinessState?, dominantPromotedRegion? })`

Returns `PharmacyConsoleWorklistProjectionSnapshot[]`.

Each row carries:

- case ref
- queue posture
- dominant checkpoint
- dominant promoted support region
- freshness, settlement, continuity, and assurance posture
- same-shell continuity metadata

### `fetchCaseWorkbenchProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyCaseWorkbenchProjectionSnapshot | null`.

Key fields:

- active line item and checkpoint refs
- current validation board posture
- promoted support-region summary
- active fence refs by line
- supply refs by line
- command and settlement posture

### `fetchMissionProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyMissionProjectionSnapshot | null`.

Key fields:

- mission token and continuity tuple
- dominant promoted region
- command fence posture
- action settlement posture
- focus-protection and resume-target refs

### `fetchMedicationValidationProjection(pharmacyCaseId, { recordedAt? })`

Returns `MedicationValidationProjectionSnapshot | null`.

Key fields:

- checkpoint state per line
- blocker and supervisor posture
- cross-line impact digest refs
- handoff consequence summaries

### `fetchInventoryTruthProjection(pharmacyCaseId, lineItemRef, { recordedAt? })`

Returns `InventoryTruthProjectionSnapshot | null`.

Key fields:

- inventory record rows
- dominant freshness state
- hard-stop posture
- freshness confidence and trust state
- governed stock and quarantine posture

### `fetchInventoryComparisonProjection(pharmacyCaseId, lineItemRef, { recordedAt? })`

Returns `InventoryComparisonProjectionSnapshot | null`.

Key fields:

- candidate rows with equivalence classes
- rank and rank-reason refs
- supply consequence refs
- active fence ref
- preserved read-only fence ref
- dominant compare state

### `fetchSupplyComputation(pharmacyCaseId, lineItemRef, candidateRef, { recordedAt? })`

Returns `SupplyComputationSnapshot | null`.

Key fields:

- selected pack count
- selected base units
- coverage ratio
- remaining base units
- quantity and substitution deltas
- patient communication and handoff consequence refs

### `fetchHandoffProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyHandoffProjectionSnapshot | null`.

Key fields:

- handoff readiness state
- blocking reason codes
- supplied and excluded line summaries
- communication-preview posture
- release basis summaries

### `fetchHandoffWatchProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyHandoffWatchProjectionSnapshot | null`.

Key fields:

- watch-window id
- watch reason
- close-after timestamp
- reopen trigger set
- external signal refs

### `fetchActionSettlementProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyActionSettlementProjectionSnapshot | null`.

Key fields:

- `canonicalSettlementType`
- `canonicalSettlementRef`
- `mutationGateRef`
- `fenceEpoch`
- agreement state
- blocking reason codes

### `fetchConsoleContinuityEvidenceProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyConsoleContinuityEvidenceProjectionSnapshot | null`.

Key fields:

- linked continuity evidence ref
- validation state
- queue-anchor and mission binding status
- settlement-chain agreement posture

### `fetchAssuranceProjection(pharmacyCaseId, { recordedAt? })`

Returns `PharmacyAssuranceProjectionSnapshot | null`.

Key fields:

- assurance state
- dominant blocker family
- blocking reason codes
- same-shell recovery posture

## Fence mutations

### `createInventoryComparisonFence(command)`

Creates or replays one `InventoryComparisonFenceSnapshot`.

Required command inputs:

- `pharmacyCaseId`
- `lineItemRef`
- `candidateRef`
- `recordedAt`

Semantics:

- idempotent for the same reviewed candidate snapshot
- returns the current active fence when no material comparison input has drifted

### `refreshInventoryComparisonFence(command)`

Refreshes the active fence against current inventory truth.

Semantics:

- returns the active fence when still valid
- invalidates the fence when availability, freshness, expiry, quarantine, or policy posture drifts materially
- preserves the previous fence as read-only evidence

### `invalidateInventoryComparisonFence(command)`

Forces invalidation of one fence with a durable reason code.

## Pass-through truth surface

The console backend also exposes the upstream frozen authorities without reshaping their semantics:

- `fetchChoiceTruthProjection(pharmacyCaseId)`
- `fetchDispatchTruthProjection(pharmacyCaseId)`
- `fetchOutcomeTruthProjection(pharmacyCaseId)`
- `fetchConsentCheckpointProjection(pharmacyCaseId)`

This keeps console, operations, and later patient-facing tracks aligned on one choice, dispatch, outcome, and consent truth family.

## Module boundary

- Later frontend tracks may render, cluster, and focus this data.
- Later frontend tracks may not invent detached compare workflows, quiet completion posture, or local release success.
- Stock-sensitive actions must continue to use `inventoryComparisonFenceId`, the current mutation-gate envelope, and the current fence epoch from this backend surface.
