# Task 460 Cross-Phase Conformance Scorecard Frontend Spec

Route: `/ops/conformance`

Visual mode: `Service_Owner_Conformance_Ledger`

The route is a service-owner proof ledger for `CrossPhaseConformanceScorecard` and `PhaseConformanceRow` state. It is not a roadmap, executive RAG, or release checklist. The first-order surface is the phase proof table, supported by the scorecard hash card, runtime tuple coverage band, cross-phase control-family matrix, governance/ops proof rail, BAU blocker queue, source trace drawer, and summary alignment diff panel.

## Projection Contract

The route consumes `CrossPhaseConformanceScorecardProjection`, built by `createCrossPhaseConformanceScorecardProjection`. The projection contains:

- `PhaseConformanceRowProjection`
- `ConformanceBlockerQueueProjection`
- `BAUSignoffReadinessProjection`
- `ConformanceSourceTraceProjection`
- `ConformanceRowDiffProjection`
- `RuntimeTupleCoverageBandProjection`
- `GovernanceOpsProofRailProjection`
- `CrossPhaseControlFamilyMatrixProjection`

The adapter reads task 449 canonical conformance rows and scorecards only. The interface gap is recorded in `data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_460_CONFORMANCE_PROJECTION.json`.

## Route Behavior

- Exact scorecards enable the BAU signoff button only when no row blocker remains.
- Stale scorecards are diagnostic-only.
- Summary drift, missing verification, stale runtime tuples, missing operations proof, blocked rows, and permission-denied metadata states disable BAU signoff.
- Phase 7 deferred-channel state is shown as an explicit scoped row rather than flattened into live completion.
- Same-shell handoffs carry return tokens for assurance, governance, operations, resilience, incident, records, and release targets.
- Raw artifact URLs are not exposed in text or attributes; handoffs use route refs and return-token refs.

## Automation Anchors

- `conformance-scorecard-shell`
- `phase-row-proof-table`
- `cross-phase-control-family-matrix`
- `runtime-tuple-coverage-band`
- `governance-ops-proof-rail`
- `bau-signoff-blocker-queue`
- `conformance-source-trace-drawer`
- `scorecard-hash-card`
- `summary-alignment-diff-panel`

## Filters

The filter bar exposes phase, dimension, owner, blocker, and row-state filters. Row selection persists across drawer open and close. If a filter hides the selected row, the source trace remains bound to the selected row until another row is selected.
