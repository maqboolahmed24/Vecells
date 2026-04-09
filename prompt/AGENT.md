# AGENT Operating Protocol

This file defines how autonomous agents coordinate work in this repository.

The only live task board is `/Users/test/Code/V/prompt/checklist.md`.
Do not track task status in `AGENT.md`.
Do not duplicate or reorder tasks outside the checklist.

## Status Markers

- `[ ]` Unclaimed and eligible when allowed by the protocol.
- `[-]` Claimed and currently in progress.
- `[X]` Completed and verified.

## Source Of Truth

1. Read `AGENT.md` first.
2. Read `/Users/test/Code/V/prompt/checklist.md` second.
3. Use `/Users/test/Code/V/prompt/checklist.md` as the only file for claiming and completing work.
4. Use the numbered prompt file referenced by each checklist item for task-specific implementation details.

## Sequential Protocol

If any `seq_` task in `/Users/test/Code/V/prompt/checklist.md` is marked `[-]`, all other agents must wait.
No later `seq_` or `par_` task may be claimed until that active sequential task is marked `[X]`.

## Parallel Protocol

`par_` tasks may run concurrently only when there is no active `seq_` task marked `[-]`.
Agents may claim tasks only from the current contiguous `par_` block.
Agents must not skip forward past the next blocked `seq_` gate.

## Eligibility Rules

1. Scan `/Users/test/Code/V/prompt/checklist.md` from top to bottom.
2. Find the first task that is not `[X]`.
3. If that task is `seq_`, it is the only claimable task.
4. If that task is `par_`, then every consecutive `par_` task until the next `seq_` task is claimable if still `[ ]`.
5. A later `seq_` task is not claimable until every earlier task in the active `par_` block is `[X]`.

## Claim Workflow

1. Read `AGENT.md`.
2. Read `/Users/test/Code/V/prompt/checklist.md`.
3. Identify the next eligible task under the rules above.
4. Change that task from `[ ]` to `[-]`.
5. Save and re-read `/Users/test/Code/V/prompt/checklist.md` to confirm the claim still holds.
6. Execute the task using its referenced prompt file.
7. Change the task from `[-]` to `[X]` only after successful implementation and verification.
8. Before implementing read back and forth promtps of the assigned promtp for better idea what you are building.

## Concurrency Guardrails

1. Claim exactly one task at a time.
2. Never change another agent's `[-]` task unless a takeover policy has been explicitly established.
3. If the checklist changes while you are claiming work, stop, re-read it, and recompute eligibility.
4. If a task is blocked, leave it at `[-]` only if active work is ongoing. Otherwise reset it according to team policy before releasing it.
