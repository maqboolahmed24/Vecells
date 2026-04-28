# 73 Queue Rank Model Design

`par_073` implements the shared queue-ordering substrate for later staff workspace, next-task, and operations drill-down work. The core law is now published through `QueueRankPlan`, `QueueRankSnapshot`, `QueueRankEntry`, and downstream `QueueAssignmentSuggestionSnapshot`.

## Core law

- `QueueRankPlan` is the only versioned source of canonical queue ordering.
- `QueueRankSnapshot` is the replayable canonical ordering cut and must exist before queue rows, preview, or next-task candidates are published.
- `QueueRankEntry` is the authoritative explanation for one ordinal.
- `QueueAssignmentSuggestionSnapshot` is derived after canonical order is committed and may not rewrite ordinals or explanation payload refs.

## Snapshot discipline

Every scenario in the frozen manifest carries one `rowOrderHash`, one `sourceFactCutRef`, one fairness-cycle reference, and one overload posture. Held rows stay explicit through `eligibilityState` rather than disappearing into browser-local heuristics.

## Downstream consequences

- later staff launch, prefetch, and completion work can bind one committed snapshot ref
- operations queue views can show pressure honestly without re-sorting stale rows
- reviewer fit can optimize assignment windows without corrupting shared queue truth
