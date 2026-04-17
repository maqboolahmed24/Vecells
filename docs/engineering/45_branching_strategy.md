# 45 Branching Strategy

The branch model exists to reinforce `prompt/checklist.md`, not replace it. Branch names express task scope; the checklist remains the authority on what may start next.

## Checklist Serialization First

- Claim the next eligible `seq_` item before you edit code.
- A `seq_` branch may cover one sequential task only.
- A `par_` branch is allowed only when the checklist already marks the work as parallel-safe.
- Branch names never authorize skipping earlier unchecked sequential work.

## Allowed Branch Forms

- `dev`
- `codex/seq-045-engineering-standards`
- `codex/par-046a-runtime-topology`
- `user/seq-052-patient-home-route-family`
- `release/2026-04-11-foundation-cut`
- `hotfix/recover-route-freeze-evidence`

Prefer the `codex/` namespace for agent-created branches. Human contributors may use `user/`. Automation may use `automation/`.

## Branch Rules

- Keep one concern per branch.
- Do not stack multiple unrelated prompt tasks into one branch just because they touch nearby files.
- `dev` is the current integration branch. Rebase or merge from it frequently enough to avoid hidden generator or topology drift.
- Release and hotfix branches are exceptions and require explicit reviewer acknowledgement because they may bypass the normal prompt ordering.

## Force-Push Policy

- Force-push is allowed only on your own unpublished branch while you are still cleaning local history.
- Do not force-push a branch once review has started, once CI or automations are attached, or when another contributor is collaborating on it.
- If a history rewrite would hide evidence, keep the history and make a follow-up commit instead.

## Merge Posture

- Prefer preserving intentional task-scoped commits over collapsing everything into one anonymous squash.
- If you squash, the resulting commit title and body must still follow the commit taxonomy and required footers.
