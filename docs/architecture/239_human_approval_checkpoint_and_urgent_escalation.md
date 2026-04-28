# 239 Human Approval Checkpoint And Urgent Escalation

Task: `par_239`

This task implements the executable Phase 3 human checkpoint and urgent escalation rail on top of the existing `DecisionEpoch` and triage lease stack from `231` and `238`.

## What is authoritative now

- `ApprovalCheckpoint`
- governed approval requirement evaluation
- stale approval invalidation
- `DutyEscalationRecord`
- `UrgentContactAttempt`
- `UrgentEscalationOutcome`

The core rule is unchanged: every approval and urgent path binds to one current unsuperseded `DecisionEpoch`.

## ApprovalCheckpoint state machine

The checkpoint now persists the exact canonical state machine:

`not_required -> required -> pending -> approved | rejected -> superseded`

`ApprovalCheckpoint` is not a boolean and it is not queue chrome. It is one durable, epoch-bound record with its own lifecycle lease and its own fencing tuple.

## Governed approval evaluation

The approval evaluator now runs the frozen `228.approval-policy-matrix.v1` rules against:

- endpoint class
- pathway ref
- risk burden class
- assistive provenance
- sensitive override posture

The implementation keeps one durable `GovernedApprovalRequirementAssessment` tuple hash and then mints or reuses the matching checkpoint. When the epoch or material tuple changes, the old checkpoint is superseded instead of silently reused.

## Invalidation law

The implementation supports explicit approval invalidation for:

- `endpoint_changed`
- `payload_changed`
- `patient_reply`
- `duplicate_resolution`
- `publication_drift`
- `trust_drift`
- `epoch_superseded`
- `manual_replace`

That keeps approval provenance visible while ensuring stale approval cannot authorize new consequence work.

## separation-of-duties posture

The runtime blocks self-approval and requires at least one presented approver role that matches the governing policy rule. The missing centralized approver graph remains an explicit machine-readable gap, not an implicit self-approval loophole.

## Urgent escalation lane

The urgent branch is now first-class:

1. reviewer or system starts escalation
2. system creates one `DutyEscalationRecord`
3. triage task moves into `escalated`
4. `UrgentContactAttempt` rows append replay-safely by replay key
5. `UrgentEscalationOutcome` settles against the same live epoch
6. direct outcome routes to `resolved_without_appointment`
7. downstream handoff routes to `handoff_pending`
8. `return_to_triage` creates `TriageReopenRecord` lineage and requeues the task

## Epoch drift handling

Urgent outcome routing and contact mutation both fail closed on epoch drift. When a newer `DecisionSupersessionRecord` exists, the stale escalation is cancelled with the supersession ref attached rather than continuing quietly as if it still represented live truth.

## Runtime notes

- approval commands keep using the authoritative task command chain while the checkpoint owns the blocking lease
- urgent contact delivery remains simulator-backed, but the record, replay key, and outcome lineage are production-shaped
- `return_to_triage` explicitly calls back into `238` invalidation so the reopen path carries a real supersession record instead of a local-only note
