# 95 Expand Migrate Contract And Readiness Rules

`par_095` turns migration and backfill posture into governed runtime truth. These are the non-negotiable rules the runner, readiness matrix, and control room enforce.

## Expand Migrate Contract

1. Every schema change starts with an additive `expand` step and a declared rollback mode.
2. Projection rebuild and backfill happen in a separate `migrate` step with explicit checkpoints, lag budgets, and dual-read or partial-read posture when required.
3. `contract` is never inferred from a completed job. It is allowed only after the observation window is satisfied and the route verdict is explicitly `ready`.

## Readiness Law

1. A route is `ready` only when publication authority is exact enough to publish, backfill convergence is complete, lag is within budget, comparison proof matches, rollback posture matches, and the observation window is satisfied.
2. A route is `constrained` when migration evidence exists but is incomplete. Typical examples are open observation windows, partial read posture, or still-guarded dual-read periods.
3. A route is `blocked` when publication parity drifts, rollback proof diverges, compatibility is incompatible, or the environment tuple is stale, conflict, or withdrawn.

## Fail-Closed Conditions

- stale or conflict publication parity
- withdrawn publication bundle
- missing or failed dual-read comparison proof
- rollback-mode mismatch
- missing observation probes
- lag budget breach
- projection compatibility marked incompatible

## Rebuild And Resume

1. Backfill runners must resume from checkpoints and may not silently restart from zero if a checkpoint exists.
2. Duplicate event application is tolerated only through the projection worker’s idempotent replay ledger.
3. A resumed rebuild still needs new observation evidence after replay converges.

## Surface Posture Mapping

- `ready` maps to `live`
- `constrained` maps to `summary_only` or `recovery_only`
- `blocked` maps to `blocked`

The shell does not improvise these states from local cache, row counts, or websocket health. It consumes explicit route verdicts.

## Rehearsal Rules

1. Preview, local, and seeded rehearsal use the same plan schema and settlement semantics as later production work.
2. Rehearsal output must be machine-readable and re-verifiable.
3. Operator-facing migration explainers, evidence tables, and recovery posture remain derived views over governed artifacts, not a second source of truth.

## Current Catalog States

`/Users/test/Code/V/data/analysis/migration_backfill_control_catalog.json` currently publishes:

- `1` ready scenario
- `1` constrained scenario
- `4` blocked scenarios
- explicit blocked cases for stale, conflict, withdrawn, and rollback-required posture

That mix is intentional. The repository now proves that the runner can authorize a seeded local rehearsal while also refusing to treat broken publication tuples as safe execution targets.
