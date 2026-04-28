# 80 Identity Repair And Reachability Governor Design

Task: `par_080`

Mode: `Identity_Repair_Reachability_Command_Center`

Primary source traceability:

- `blueprint/phase-0-the-foundation-protocol.md#1.4I IdentityRepairSignal`
- `blueprint/phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase`
- `blueprint/phase-0-the-foundation-protocol.md#1.5A IdentityRepairFreezeRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.5B IdentityRepairBranchDisposition`
- `blueprint/phase-0-the-foundation-protocol.md#1.5C IdentityRepairReleaseSettlement`
- `blueprint/phase-0-the-foundation-protocol.md#1.8D ContactRouteSnapshot`
- `blueprint/phase-0-the-foundation-protocol.md#1.8F ReachabilityAssessmentRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney`
- `blueprint/phase-0-the-foundation-protocol.md#2.4A ReachabilityGovernor`
- `blueprint/phase-0-the-foundation-protocol.md#2.5 IdentityRepairOrchestrator`
- `blueprint/phase-0-the-foundation-protocol.md#5.6 Wrong-patient correction algorithm`
- `blueprint/phase-0-the-foundation-protocol.md#7.1.2 Reachability-risk function`
- `prompt/shared_operating_contract_076_to_085.md#For task 080`

## Intent

`IdentityRepairOrchestrator` owns wrong-patient suspicion, freeze, branch quarantine, and governed release without rewriting `Request.workflowState`.

`ReachabilityGovernor` owns current route-health truth. Transport acceptance, mutable profile rows, or operator notes may inform it, but they may not replace the append-only assessment chain.

The two services meet on one continuity rule: patient or staff recovery must stay in the same lineage shell until either a release settlement or a verified reachability rebound says otherwise.

## Backend shape

New identity-repair substrate in `packages/domains/identity_access/src/identity-repair-backbone.ts`:

- `IdentityRepairSignalDocument`
- `IdentityRepairCaseDocument`
- `IdentityRepairFreezeRecordDocument`
- `IdentityRepairBranchDispositionDocument`
- `IdentityRepairReleaseSettlementDocument`
- `InMemoryIdentityRepairStore`
- `IdentityRepairOrchestratorService`
- repair-impact planner and surface projection helpers
- route-verification and repair-journey evaluator helpers

Existing reachability substrate in `packages/domains/identity_access/src/reachability-backbone.ts` was hardened for task `080` by:

- exact replay of duplicate observations
- assessment reuse when posture does not materially change
- event-hook emission for route supersession, reachability changes, repair start, verification success, and repair-journey close

## Authority decisions

Identity repair:

- A wrong-patient hint records one immutable `IdentityRepairSignal`.
- Signals on the same frozen binding reuse one active `IdentityRepairCase`.
- `commitFreeze` advances the lineage fence, supersedes matching live grants, captures route-intent supersession hooks, opens audience holds, and materializes branch dispositions.
- `markCorrected` records supervisor and independent review refs and issues a projection rebuild hook.
- `settleRelease` is the only path that releases the freeze, clears request and episode blockers, and resumes continuity through an explicit `IdentityRepairReleaseSettlement`.

Reachability:

- `freezeContactRouteSnapshot` keeps route versions append-only and marks supersession explicitly.
- `recordObservation` now short-circuits on exact replay.
- `refreshDependencyAssessment` only appends a new assessment when dependency posture materially changes.
- `openRepairJourney` and `settleVerificationCheckpoint` preserve same-shell recovery and emit deterministic event hooks.

## Hook surfaces

The prompt required bounded seams where sibling tracks are not yet published. This task ships the hook refs and records the gaps explicitly:

- `PARALLEL_INTERFACE_GAP_ROUTE_INTENT_SUPERSESSION_SETTLEMENT`
- `PARALLEL_INTERFACE_GAP_PROJECTION_REBUILD_WORKER`
- `PARALLEL_INTERFACE_GAP_COMMS_FREEZE_RUNTIME`
- `PARALLEL_INTERFACE_GAP_SESSION_TERMINATION_SETTLEMENTS`

Each gap is exposed through the repair projection and route authority manifest so later runtime/provider tasks can replace the hook ref with a concrete worker or adapter without rewriting the control model.

## Event posture

Canonical event entries published by this task:

- `identity.repair_case.opened`
- `identity.repair_case.freeze_committed`
- `identity.repair_branch.quarantined`
- `identity.repair_release.settled`
- `reachability.route_snapshot.superseded`
- `reachability.changed`
- `reachability.repair.started`
- `reachability.verification_checkpoint.verified`
- `reachability.repair_journey.closed`

The package stores these as append-only envelopes for validator and UI consumption.

## Validation

Package validation for this task is expected to cover:

- package `typecheck`
- package `test`
- artifact validator: `tools/analysis/validate_identity_repair_and_reachability.py`
- browser validation: `tests/playwright/identity-repair-reachability-command-center.spec.js --run`

The package tests intentionally pin:

- repair signal replay reuse
- exact-once repair freeze
- grant supersession under repair
- branch-release gating before repair release
- duplicate reachability observation replay
- same-shell verification rebound semantics
