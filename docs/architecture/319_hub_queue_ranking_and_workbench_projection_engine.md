# 319 Hub Queue Ranking And Workbench Projection Engine

`par_319` makes the hub desk authoritative for ordering, posture, and timer truth. The implementation lives in `/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-hub-queue-engine.ts`.

## Scope

- deterministic queue ranking over `HubCoordinationCase`
- fixed-point risk ordering over breach probability
- service-cost-aware fairness merge inside non-critical bands only
- typed timer rows for candidate refresh, patient choice expiry, required-window breach, too-urgent-for-network, and practice-notification overdue
- projection materialization for `HubQueueWorkbenchProjection`, `HubConsoleConsistencyProjection`, `HubCaseConsoleProjection`, `HubOptionCardProjection`, `HubPostureProjection`, and `HubEscalationBannerProjection`
- `QueueChangeBatch` continuity inputs for later shells

## Ranking Model

The engine persists the declared 5D terms for every ranked case:

- `expectedService_i = max(s_hub_min, expectedCoordinationMinutes_i)`
- `d_clin_i(t)` and `d_sla_i(t)` as remaining minutes to the clinical and SLA deadlines
- `laxity_clin_i` and `laxity_sla_i`
- workload-ahead and wait-to-start terms
- coordination and dependency-delay terms
- `P_clin_breach`, `P_sla_breach`, and `P_breach`
- `riskBand_i`
- `secondaryScore_i`

The stable key is exactly:

1. `riskBand` descending
2. `urgencyCarry` descending
3. `P_breach` descending
4. originating clinical priority descending
5. `secondaryScore` descending
6. `queueEnteredAt` ascending
7. `hubCoordinationCaseId` ascending

The engine performs fixed-point ordering over the risk-only sort first. Fairness is layered after convergence, and only inside non-critical bands.

## Fairness And Overload

The fairness pass uses service-cost-aware deficit round robin keyed by origin practice. Credits are persisted in `HubFairnessCycleStateSnapshot`.

- band `3` is never fairness-merged
- if critical-load ratio breaches the configured guard threshold, fairness is suppressed and the queue posture is `overload_critical`
- otherwise the engine applies deficit round robin using practice credit, service cost, and age debt

If convergence cannot be trusted inside the governed cap, the queue publishes a deterministic fail-closed order with `convergenceState = failed_closed` and the consistency projection freezes mutating controls.

## Projection Assembly

The queue engine assembles all 5D surfaces under one consistency tuple:

- `HubQueueWorkbenchProjection` carries visible rows, selected-anchor continuity, and the active `QueueChangeBatch`
- `HubCaseConsoleProjection` carries dominant action, blocker stubs, timers, and card refs for one case
- `HubOptionCardProjection` binds `CrossSiteDecisionPlan`, `NetworkCandidateSnapshot`, `CapacityRankProof`, `CapacityRankExplanation`, and the local reservation-binding seam
- `HubPostureProjection` carries overload, stale-owner, acknowledgement debt, and callback block posture
- `HubEscalationBannerProjection` is the only banner-capable escalation surface
- `HubConsoleConsistencyProjection` freezes the console if bundle truth drifts or the queue fails closed

## QueueChangeBatch

Every disruptive queue movement is published through `QueueChangeBatchSnapshot`:

- `sourceRankSnapshotRef`
- `targetRankSnapshotRef`
- `preservedAnchorRef`
- `preservedAnchorTupleHash`
- inserted, updated, and priority-shift refs
- apply and impact classes
- invalidated anchor refs when continuity cannot be preserved

The engine never silently substitutes the active anchor.

## Typed Seams

Two later-owned inputs are closed as typed seams instead of implicit nulls:

- `/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json`
- `/Users/test/Code/V/data/contracts/PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_CAPACITY_RESERVATION_BINDING.json`

Those files constrain how `320` and `321` must feed expiry and reservation truth into the queue spine.
