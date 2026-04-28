# 76 Request Closure And Exception Case Design

## Source Traceability

- `prompt/076.md`
- `prompt/shared_operating_contract_076_to_085.md`
- `blueprint/phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.20 FallbackReviewCase`
- `blueprint/phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator`
- `blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm`
- `blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers`
- `docs/architecture/55_lifecycle_coordinator_strategy.md`
- `docs/architecture/55_closure_blocker_ledger.md`

## Core Law

`RequestClosureRecord` is the authoritative close-or-defer artifact. It is append-only, bound to one `requiredLineageEpoch`, and illegal to mint as `decision = close` unless the materialized blocker and confirmation sets are both empty.

`FallbackReviewCase` is the canonical same-lineage degraded-handling artifact. It preserves accepted user progress while ingest, safety, artifact, or dependency recovery is handled. It is never a detached ticket.

## Model Surface

### RequestClosureRecord

- Canonical blocker families stay explicit: lease, preemption, approval, reconciliation, confirmation, lineage branch, duplicate, fallback, identity repair, grant, reachability, and degraded promise.
- `currentClosureBlockerRefs[]` and `currentConfirmationGateRefs[]` stay materialized on the record with `materializedBlockerSetHash` so stale blocker sets cannot be hand-waved away.
- `closedByMode = not_closed` is mandatory for defer verdicts.
- `terminalOutcomeRef`, consumed command-following proof, and empty blocker sets are all required before close.

### FallbackReviewCase

- `lineageScope` is bounded to `envelope | request | episode`.
- `patientVisibleState` preserves accepted progress using `draft_recoverable | submitted_degraded | under_manual_review | recovered | closed`.
- `caseState` is `open | recovered | closed`; `closureBasis` records whether closure happened by recovery, supersession, or governed manual settlement.
- `governedRecoveryFamily = wrong_patient_repair` is rejected so wrong-patient work cannot leak into fallback review.

## Persistence And Query Surface

- `request_closure_records` persists immutable close/defer verdicts.
- `fallback_review_cases` persists the latest canonical case snapshot while the in-memory adapter preserves versioned history.
- Repositories support queries by request, episode, lineage, blocker class, and required epoch so `LifecycleCoordinator` can consume them without reinventing storage semantics in task `077`.

## Event Boundary

- Reused event contracts: `request.close.evaluated`, `request.closed`, `request.closure_blockers.changed`, `exception.review_case.opened`, `exception.review_case.recovered`.
- Parallel-interface stubs published now: `request.close.deferred`, `exception.review_case.advanced`, `exception.review_case.closed`.
- These stubs are recorded as `PARALLEL_INTERFACE_GAP_*` entries so task `077` can integrate them cleanly without flattening closure history into local prose.

## Query And Validation Rules

- Any persisted blocker ref must appear in the corresponding current materialized blocker set.
- `decision = close` rejects any blocker, confirmation, missing terminal outcome, or missing command-following proof.
- `decision = defer` rejects blocker-free folklore: it must have explicit blocker truth, missing terminal proof, or explicit defer reason codes.
- `FallbackReviewCase` may close only through recovery, supersession, or governed manual settlement.

## Simulator Cases

- legal close with no blockers
- defer for duplicate review
- defer for fallback review after degraded progress
- defer for identity repair
- defer for unresolved confirmation
- defer for PHI grant and reachability debt
- defer for stale materialized blocker refs
