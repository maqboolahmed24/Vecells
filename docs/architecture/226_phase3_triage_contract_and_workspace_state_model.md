# 226 Phase 3 Triage Contract And Workspace State Model

Task: `seq_226`

Visual mode: `Triage_Workspace_State_Atlas`

This task freezes the first Phase 3 workspace contract pack. It does not implement the full production workspace. It publishes the exact kernel that later Phase 3 tasks must consume without inventing local meanings for queue, review, ownership, trust, or settlement.

## Machine-readable sources

- `data/contracts/226_triage_task.schema.json`
- `data/contracts/226_review_session.schema.json`
- `data/contracts/226_review_bundle_contract.json`
- `data/contracts/226_task_launch_context.schema.json`
- `data/contracts/226_task_command_settlement.schema.json`
- `data/contracts/226_workspace_trust_and_focus_rules.json`
- `data/contracts/226_workspace_route_family_registry.yaml`
- `data/analysis/226_triage_state_transition_matrix.csv`
- `data/analysis/226_workspace_event_catalog.csv`
- `data/analysis/226_triage_workspace_gap_log.json`

## Frozen kernel objects

| Contract object | Purpose | Why it exists now |
| --- | --- | --- |
| `TriageTask` | Operational review aggregate for one request lineage | Prevents Phase 3 from smuggling workflow, freshness, trust, and ownership through ad hoc queue-row state |
| `ReviewSession` | Active-review shell contract | Preserves selected anchor, trust tuple, route publication tuple, and action lease inside the same shell |
| `ReviewBundle` | Summary-first read model | Gives staff one authoritative evidence basis and one summary-parity fence instead of mixed local reads |
| `TaskLaunchContext` | Queue-to-task and task-to-next-task continuity | Replaces browser-history restore with durable continuity truth |
| `TaskCommandSettlement` | Workspace-facing mutation receipt | Separates optimistic acknowledgement from authoritative settlement |
| `WorkspaceTrustEnvelope` family | Trust, focus protection, and calm-completion authority | Forces writable posture to fail closed on drift |

## Orthogonal control facts

These states are deliberately separate and must not be collapsed:

| Concern | Authoritative field |
| --- | --- |
| Workflow | `TriageTask.status` |
| Ownership | `TriageTask.ownershipState` |
| Review freshness | `TriageTask.reviewFreshnessState` |
| Buffered update posture | `ReviewSession.bufferState` |
| Workspace trust | `WorkspaceTrustEnvelope.envelopeState` |
| Mutation authority | `WorkspaceTrustEnvelope.mutationAuthorityState` |
| Focus protection | `WorkspaceFocusProtectionLease.leaseState` |
| Protected composition validity | `ProtectedCompositionState.stateValidity` |
| Command outcome | `TaskCommandSettlement.authoritativeOutcomeState` |
| Calm completion | `TaskCompletionSettlementEnvelope.authoritativeSettlementState` |

The practical effect is simple: a task can remain `claimed` or `in_review` while freshness is `review_required`, while trust is `stale_recoverable`, and while mutation authority is `frozen`. That is the desired behavior. Phase 3 must not flatten those facts into a single status chip.

## Workflow state model

The executable task workflow is frozen in `data/analysis/226_triage_state_transition_matrix.csv`.

Canonical flow:

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

Key interpretation rules:

1. `review_required` is not a workflow state. It is freshness and decision-validity drift.
2. Stale ownership is not a workflow state. It is `ownershipState = expired | broken` plus a live stale-owner recovery artifact.
3. Writable calmness is not a workflow state. It is derived from `WorkspaceTrustEnvelope` plus the settlement chain.

## Same-shell workspace laws

The route-family registry freezes the Phase 3 workspace shell as one family, not a collection of detached flows.

Non-negotiable laws:

1. `/workspace/task/:taskId/more-info` and `/workspace/task/:taskId/decision` are `same_task_child`.
2. Queue changes, approvals, escalations, changed-since-seen, and search stay inside the same workspace continuity key while the family remains valid.
3. Queue-to-task open, browser-back restore, reopen, and next-task movement rehydrate through `TaskLaunchContext`.
4. Deep links do not bypass the route family. They still bind the same shell continuity tuple, selected-anchor law, and release/recovery disposition.

## Command-settlement chain

Every mutating workspace action must pass through this exact chain:

1. `RouteIntentBinding`
2. `CommandActionRecord`
3. `CommandSettlementRecord`
4. `TaskCommandSettlement`
5. `TransitionEnvelope`
6. `ReleaseRecoveryDisposition`

This closes the optimistic-success gap. A shell may show click feedback quickly, but only authoritative settlement may claim that a task, approval, escalation, handoff, or closure consequence is truly settled.

## Canonical request lifecycle boundary

`TriageTask` owns review-local truth only.

The canonical request lifecycle remains coordinator-owned:

- triage emits signals
- triage emits command records
- coordinator derives request lifecycle truth

That keeps Phase 3 from reopening the earlier forensic finding where queue-local or task-local code could write competing lifecycle milestones directly.

## Gap closures

The mandatory Phase 3 gap set is closed in `data/analysis/226_triage_workspace_gap_log.json`.

- direct canonical request mutation: closed
- ambiguous workspace state flag: closed
- writable-after-drift: closed
- browser-history restore: closed
- optimistic success equals settlement: closed
- child routes as mini-apps: closed

## What later tasks may extend

Later Phase 3 tasks may extend this pack, but they may not replace it.

- `seq_227` can freeze queue ranking, fairness, duplicate-cluster formulas, and more-info detail semantics.
- `seq_228` can freeze endpoint, approval, and escalation semantics.
- `seq_229` can freeze callback, clinician messaging, and bounded admin-resolution semantics.

Those later freezes must still use the state fields, lease fences, route laws, and settlement chain defined here.
