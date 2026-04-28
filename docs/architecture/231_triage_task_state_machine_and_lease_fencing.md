# 231 Triage Task State Machine And Lease Fencing

Task: `par_231`

This task implements the executable Phase 3 triage kernel that `226` only froze as a contract pack.

## Runtime surfaces

- domain aggregate and executor: `packages/domains/triage_workspace/src/phase3-triage-kernel.ts`
- domain public export: `packages/domains/triage_workspace/src/index.ts`
- shared lease-fence witness types: `packages/domain-kernel/src/phase3-triage-fencing.ts`
- command-api seam: `services/command-api/src/phase3-triage-kernel.ts`
- migration: `services/command-api/migrations/110_phase3_triage_task_kernel.sql`
- domain tests: `packages/domains/triage_workspace/tests/phase3-triage-kernel.test.ts`
- command-api integration: `services/command-api/tests/triage-task-state-machine.integration.test.js`

## Implemented kernel objects

The executable kernel now owns these repository-backed documents:

| Object | Runtime responsibility |
| --- | --- |
| `Phase3TriageTaskDocument` | frozen workflow state, ownership tuple, freshness tuple, launch-context binding, endpoint refs |
| `Phase3ReviewSessionDocument` | active-review shell state, selected anchor, trust refs, lease refs |
| `Phase3TaskLaunchContextDocument` | queue-to-task continuity, selected anchor durability, next-task hints |
| `Phase3TaskCommandSettlementDocument` | workspace-facing settlement witness for each material mutation |
| `Phase3TaskTransitionJournalEntryDocument` | append-only transition audit for material state changes |

## State and guard law

The legal workflow graph matches the `226` freeze exactly:

```text
triage_ready -> queued
queued -> claimed
claimed -> queued | in_review
in_review -> queued | awaiting_patient_info | endpoint_selected | escalated
awaiting_patient_info -> review_resumed
review_resumed -> queued | claimed
endpoint_selected -> resolved_without_appointment | handoff_pending | escalated
escalated -> resolved_without_appointment | handoff_pending | reopened
resolved_without_appointment -> closed
handoff_pending -> closed
closed -> reopened
reopened -> queued
```

The guard layer separates:

- workflow state
- ownership state
- review freshness state
- buffered review session state

No command path is allowed to collapse those into one status flag.

## Lease tuple enforcement

The domain executor now validates the current compare-and-set tuple on every material mutation:

- `ownershipEpoch`
- `fencingToken`
- `currentLineageFenceEpoch`

Additional rules implemented in `phase3-triage-kernel.ts`:

1. claim must advance `ownershipEpoch` and `currentLineageFenceEpoch`
2. release must advance `currentLineageFenceEpoch`
3. stale-owner detection must advance `currentLineageFenceEpoch`
4. supervisor takeover must advance both `ownershipEpoch` and `currentLineageFenceEpoch`
5. stale tuple mismatches fail closed before state mutation

## Command-api composition

`services/command-api/src/phase3-triage-kernel.ts` composes the triage kernel with the existing:

- `RequestLifecycleLease`
- `CommandActionRecord`
- `CommandSettlementRecord`
- `StaleOwnershipRecoveryRecord`
- `LeaseTakeoverRecord`

Active-owner transitions use real lease and settlement backbones. Unowned states such as `triage_ready -> queued`, `review_resumed -> queued`, and `closed -> reopened` use explicit synthetic command witnesses because there is no live lease to validate yet. That temporary seam is recorded in `data/analysis/PARALLEL_INTERFACE_GAP_PHASE3_TRIAGE_KERNEL.json`.

## Consequence-bearing states

The full workflow graph is executable now, but downstream consequence-bearing states remain guarded:

- `awaiting_patient_info` requires `moreInfoContractRef`
- `endpoint_selected` requires current endpoint and decision epoch refs
- `escalated` requires current decision epoch plus escalation contract ref
- `resolved_without_appointment` and `handoff_pending` require consequence hook refs
- `reopened` requires a reopen contract ref
- `closed` requires a lifecycle-coordinator signal ref

That keeps the state machine whole without weakening fail-closed behavior while `238` to `242` are still separate tracks.

## Persistence

`110_phase3_triage_task_kernel.sql` creates the production-shaped tables for:

- `phase3_triage_tasks`
- `phase3_review_sessions`
- `phase3_task_launch_contexts`
- `phase3_task_command_settlements`
- `phase3_task_transition_journal`

The migration also adds a live-session uniqueness index so one task cannot hold two concurrent active review sessions.
