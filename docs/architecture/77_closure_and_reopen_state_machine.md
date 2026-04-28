# 77 Closure And Reopen State Machine

## Core Law

Closure is an explicit coordinator-owned decision, not a passive terminal state. Reopen is an explicit coordinator-owned recovery transition, not a side effect of child-domain mutation.

## Request Milestone Path

| Stage | Meaning | Writer |
| --- | --- | --- |
| `submitted` | canonical request exists | domain kernel |
| `triage_ready` | ready for active review | lifecycle coordinator |
| `triage_active` | active work is underway | lifecycle coordinator |
| `handoff_active` | downstream casework is now primary | lifecycle coordinator |
| `outcome_recorded` | terminal outcome evidence exists | lifecycle coordinator |
| `closed` | legal closure persisted and committed | lifecycle coordinator only |

## Close Transition

`outcome_recorded -> closed` is legal only when all of the following are true:

- current blocker refs are empty
- current confirmation gate refs are empty
- command-following projection refs are empty
- terminal outcome evidence is present
- the presented lineage epoch equals the current fence epoch
- the close verdict is persisted as `RequestClosureRecord(decision = close)`

If any gate fails, the result is `decision = defer`.

## Defer Transition

Defer keeps workflow truth orthogonal from blocker truth.

The coordinator persists:

- blocker family refs
- current materialized blocker refs
- current confirmation refs
- defer reason codes
- required lineage epoch
- consumed causal token ref

This closes the gap where blockers existed only in prose.

## Reopen Transition

Canonical reopen starts from a closed or near-terminal request and requires:

- a canonical reopen trigger family
- threshold-satisfying reopen pressure
- a current fence epoch
- append-only reopen history

Typical reopen families:

- materially new evidence
- urgent bounce-back
- pharmacy unable to complete
- callback escalation
- wrong-patient correction
- booking dispute
- hub return
- contact dependency failure
- manual support recovery

## State Machine Notes

- Child domains may emit reopen pressure but may not directly force request workflow backward.
- Repair, reconciliation, grant, duplicate, fallback, and reachability states remain blocker truth, not workflow aliases.
- Stale close attempts and stale signal writes fail closed at the fence boundary.
- Exact replay of an already-recorded signal is idempotent when the digest matches.

## Practical Outcomes

- Close-vs-blocker-open races collapse to the fence rule.
- Close-vs-reopen races produce explicit history instead of contradictory snapshots.
- Historical closure records remain immutable even when a later reopen is legal.
