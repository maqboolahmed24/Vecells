# 231 Lease Fencing And Stale Owner Recovery

Task: `par_231`

This note records the concrete safety rules implemented by the Phase 3 triage kernel and its command-api seam.

## Mutation authority

Mutation authority is no longer inferred from route presence or selected UI state.

A write is authoritative only when all of the following agree:

1. the task snapshot tuple presented by the caller
2. the current lease tuple held by control-plane authority
3. the command action recorded against that tuple
4. the authoritative command settlement for that action

The tuple is:

- `ownershipEpoch`
- `fencingToken`
- `lineageFenceEpoch`

## Stale write behavior

The implementation fails closed in two layers:

1. `LeaseFenceCommandAuthorityService` rejects stale leaseId, ownership epoch, owner session, or fencing token and opens a `StaleOwnershipRecoveryRecord`
2. `Phase3TriageTransitionGuard` rejects stale task tuples before the domain aggregate mutates

That means a stale worker cannot keep mutating by luck after:

- browser restart
- tab duplication
- supervisor takeover
- missed heartbeats
- release then re-claim

## Release and stale-owner rules

The implemented sequence is:

1. register the command action against the current active lease
2. record authoritative command settlement
3. rotate the control-plane lineage fence
4. advance the domain task `currentLineageFenceEpoch`
5. keep the prior owner visible until the workflow leaves the active review state

That last rule matters. Releasing or breaking a lease does not silently erase who previously held responsibility. The shell can still present explicit stale-owner recovery and takeover provenance.

## Supervisor takeover

Supervisor takeover is explicit and append-only:

1. break or expire the prior lease
2. materialize or reuse one open `StaleOwnershipRecoveryRecord`
3. create one committed `LeaseTakeoverRecord`
4. create one replacement lease with a higher `ownershipEpoch`
5. append a triage transition journal row with reason `supervisor_takeover_committed`

No history row is rewritten away.

## Temporary seams

Two seams remain intentionally explicit until later tracks land:

1. unowned states use synthetic command witnesses because there is no live lease yet
2. consequence-bearing transitions accept typed placeholder refs from `228` to `242` rather than weakening guard law

Those seams are recorded in `data/analysis/PARALLEL_INTERFACE_GAP_PHASE3_TRIAGE_KERNEL.json`.
