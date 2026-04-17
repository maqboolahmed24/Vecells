# 73 Deterministic Queue Ranking Rules

## Ranking law

Canonical order is not one unconstrained weighted sum. The frozen plan separates:

1. lexicographic precedence for escalations, SLA class, priority, maximum risk band, duplicate-review ambiguity, and urgency carry
2. normalized within-tier urgency for time pressure and patient-risk dimensions
3. deterministic fair merge for routine non-critical bands

## Suggestion isolation

Reviewer-fit and governed auto-claim logic execute only over the committed top window from a source `QueueRankSnapshot`. Suggestion rows must repeat source ordinals, tie-break keys, and explanation refs unchanged.

## Overload honesty

When `overloadState = overload_critical`, fairness promises are suppressed. The studio and validators must surface that posture explicitly instead of leaving stale starvation guarantees visible.

## Mixed-snapshot prohibition

Queue rows, queue preview, next-task candidates, and continuity evidence must agree on the same committed queue snapshot ref unless the consumer degrades explicitly to stale or recovery posture.
