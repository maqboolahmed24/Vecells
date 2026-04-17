# 77 Lifecycle Coordinator Service Design

## Source Traceability

- `prompt/077.md`
- `prompt/shared_operating_contract_076_to_085.md`
- `packages/domains/identity_access/src/lifecycle-coordinator-backbone.ts`
- `packages/domains/identity_access/src/request-closure-backbone.ts`
- `blueprint/phase-0-the-foundation-protocol.md#1.11 LineageFence`
- `blueprint/phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord`
- `blueprint/phase-0-the-foundation-protocol.md#2.1 LifecycleCoordinator`
- `blueprint/phase-0-the-foundation-protocol.md#9.4 Workflow state ownership`
- `blueprint/phase-0-the-foundation-protocol.md#9.6 Closure evaluation algorithm`
- `blueprint/phase-0-the-foundation-protocol.md#9.7 Reopen triggers`

## Authority Boundary

`LifecycleCoordinatorService` is the sole cross-domain writer for canonical request milestone progression, blocker materialization, close/defer verdicts, governed reopen, and lineage-fence epoch advancement.

Child domains only contribute evidence:

- milestone hints
- blocker and confirmation refs
- terminal-outcome evidence
- lineage-case-link deltas
- reopen pressure vectors

They may not write `Request.workflowState = closed` directly and may not mint coordinator-owned events such as `request.closed`.

## Partition Model

- Partition key: `episodeId`
- Ordering law: `partitionSequence` within each episode partition
- Concurrency guard: `LineageFence.currentEpoch`
- Replay law: exact same `signalId` plus digest is idempotent, even after later epoch advancement

Every invariant-changing mutation is evaluated against the current fence. If the presented epoch is stale, the mutation fails closed.

## Materialization Pipeline

1. `recordLifecycleSignal()` validates request scope and signal shape.
2. The signal is stored append-only with a deterministic digest.
3. The coordinator materializes effective truth by taking the latest signal per `domainObjectRef`.
4. Active lineage links are folded into blocker and gate truth.
5. `Request.currentClosureBlockerRefs[]`, `Request.currentConfirmationGateRefs[]`, and episode-level operational refs are refreshed together.
6. If blocker truth or the derived milestone changed, the lineage fence advances and coordinator events are appended.

## Milestone Derivation

The coordinator owns the milestone ladder:

- `submitted`
- `triage_ready`
- `triage_active`
- `handoff_active`
- `outcome_recorded`
- `closed`

Signals may only suggest non-terminal milestones. Terminal outcome evidence can raise the derived milestone to `outcome_recorded`, but only a persisted close decision can move the request to `closed`.

## Close / Defer Path

`evaluateRequestClosure()` materializes current truth, persists a `LifecycleClosureRecordDocument`, and then performs the canonical mutation:

- `decision = defer`
  - persists explicit defer reason codes
  - keeps `closedByMode = not_closed`
  - leaves request workflow open
- `decision = close`
  - requires empty blocker refs
  - requires empty confirmation refs
  - requires empty command-following projection refs
  - requires a real terminal outcome ref
  - forces request workflow to `closed`
  - optionally resolves the episode when sibling requests are also closed

Closure history is append-only. The coordinator never mutates old closure artifacts in place.

## Governed Reopen

Reopen is explicit and fenced. A signal may reopen only when:

- the request is already closed or effectively terminal
- the signal declares a canonical reopen trigger family
- the reopen pressure meets the threshold law

The reopen algorithm persists a `GovernedReopenRecordDocument`, reactivates the request lineage, reopens the episode if required, advances the fence, and emits `request.reopened`.

## Simulation Coverage

The in-package simulation harness covers:

- normal closure
- late-reply reopen after an earlier legal close
- booking confirmation debt then clearance
- hub return with practice-visibility debt
- pharmacy weak-match review then reconciled outcome
- wrong-patient repair hold then explicit release
- duplicate-review hold
- fallback-review hold
- reachability-repair hold

## Parallel Interface Gaps

- `PARALLEL_INTERFACE_GAP_077_CHILD_DOMAIN_SIGNAL_ADAPTERS`
- `PARALLEL_INTERFACE_GAP_077_REQUEST_CLOSURE_MODEL_SEAM`

These gaps keep the coordinator bounded while sibling tracks finish their live emitters.
