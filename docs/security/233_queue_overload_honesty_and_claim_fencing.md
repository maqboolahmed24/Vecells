# 233 Queue Overload Honesty And Claim Fencing

Task: `par_233`

This note records the concrete safety rules implemented by the Phase 3 queue engine.

## Overload honesty

The runtime now computes overload from the frozen guard:

```text
rho_crit = lambdaHat_crit * mean(expectedService_i | escalated_i = 1 or slaClass_i = 3) / (m * muHat)
```

When `rho_crit >= rho_guard`:

1. `QueueRankSnapshot.overloadState` becomes `overload_critical`
2. fairness promise state becomes `suppressed_overload`
3. routine ETA and starvation-free reassurance are no longer implied by the queue snapshot

This is intentionally honest. The queue still ranks work, but it does not promise service behavior the runtime cannot support.

## Fail-closed rank inputs

Ranking does not accept "close enough" facts.

The implementation now blocks queue recompute when:

- `trustInputRefs` are missing for a plan that requires trusted fact cuts
- a task references an unsupported fairness band
- the plan attempts to enable reviewer-order rewrite

That keeps queue output deterministic and prevents silent drift across workers.

## Claim fencing

Queue-originated claim is not a UI-local convenience anymore.

`softClaimTask(...)` now requires:

1. the presented `rankSnapshotRef` to match the latest committed queue snapshot
2. the target row to remain `eligible`
3. workspace mutation authority to remain `live`
4. the Phase 3 triage kernel to accept the claim through the current lease fence

Because claim flows through `claimTask(...)` in the Phase 3 triage kernel, the active compare-and-set tuple is still:

- `ownershipEpoch`
- `fencingToken`
- `lineageFenceEpoch`

Two operators cannot both keep a live claim through queue-race timing. One claim wins the lease; the other fails closed on stale task state.

## Suggestion isolation

Reviewer fit is advisory only.
In operational terms, reviewer fit is advisory only and cannot rewrite queue truth.

The runtime validates that `QueueAssignmentSuggestionSnapshot` cannot mutate:

- canonical ordinals
- tie-break keys
- explanation payload refs

That prevents hidden reordering through staffing heuristics.

## Temporary seams

The queue engine still accepts two typed seams explicitly:

1. duplicate-review truth remains a fact-cut input until `par_234`
2. more-info return and continuity handoff inputs remain typed queue facts until `par_236` and `par_242`

Those seams are recorded in `PARALLEL_INTERFACE_GAP_PHASE3_QUEUE_ENGINE.json` so they are visible and bounded rather than implicit.
