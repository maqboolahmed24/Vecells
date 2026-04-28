# 95 Schema Migration And Projection Backfill Design

`par_095` adds the governed migration and projection-backfill runner to `/Users/test/Code/V/packages/release-controls/src/migration-backfill.ts` and binds it to the already-published runtime-publication and projection-rebuild seams.

## Intent

The runner closes four Phase 0 control gaps:

1. Schema change is no longer an ad hoc DBA action. Every change resolves through a machine-readable `SchemaMigrationPlan`, one `MigrationExecutionBinding`, one `MigrationImpactPreview`, explicit `MigrationActionRecord` objects, and an authoritative `MigrationActionSettlement`.
2. Projection rebuild success no longer implies audience safety. Route posture is decided by route-scoped `ProjectionReadinessVerdict` output plus observation-window evidence, not by green job status.
3. Backfill resume is restart-safe. The runner delegates replay and checkpoints to the existing projection worker and preserves that ledger inside the migration settlement chain.
4. Preview and seeded rehearsal use the same semantics as later production work. The rehearsal CLIs consume the same plan, binding, and verdict catalog that the control room visualizes.

## Control Objects

The new runtime-control module publishes these authoritative objects:

- `SchemaMigrationPlan`
- `GovernedProjectionBackfillPlan`
- `MigrationExecutionBinding`
- `MigrationImpactPreview`
- `MigrationExecutionReceipt`
- `MigrationActionObservationWindow`
- `MigrationActionRecord`
- `MigrationActionSettlement`
- `MigrationRouteReadinessVerdict`
- `InMemoryMigrationControlStore`
- `MigrationBackfillRunner`

The runner does not invent a second projection system. It consumes the existing `ProjectionRebuildWorker`, `ProjectionBackfillPlan`, and `ProjectionReadinessVerdict` logic from `/Users/test/Code/V/packages/release-controls/src/projection-rebuild.ts`, then binds those outputs to publication parity, rollback posture, and observation proof.

## Execution Flow

1. Validate `SchemaMigrationPlan` and `GovernedProjectionBackfillPlan`.
2. Evaluate runtime publication authority against the bound `RuntimePublicationBundle` and `ReleasePublicationParityRecord`.
3. Create a deterministic `MigrationImpactPreview` that freezes affected routes, expected surface states, and required recovery controls before execution.
4. Persist the start action and execution receipt.
5. Run the projection worker in `dry_run`, `rebuild`, or `catch_up` mode against the governed backfill target.
6. Open an observation window and compute route-scoped readiness from convergence, lag, comparison proof, rollback posture, and publication drift.
7. Persist the contract action and settle as `applied`, `accepted_pending_observation`, `stale_recoverable`, `blocked_policy`, or `rollback_required`.

## Rehearsal Path

The rehearsal surface lives under `/Users/test/Code/V/tools/runtime-migration-backfill`.

- `run-migration-backfill-rehearsal.ts` hydrates a governed record from `/Users/test/Code/V/data/analysis/migration_backfill_control_catalog.json`, executes a dry run, and writes machine-readable output under `.artifacts/runtime-migration-backfill/...`.
- `verify-migration-backfill.ts` reruns the same bound record and fails if settlement or verdict drift from the saved rehearsal artifact.

Current default CI rehearsal uses the `local` seeded tuple. This is intentional: the current `ci-preview` publication tuple in `/Users/test/Code/V/data/analysis/runtime_publication_bundles.json` is already stale, so the authoritative runner correctly blocks it. The control plane therefore proves both sides of the contract now:

- a clean seeded rehearsal path that can pass under one exact publication tuple
- explicit blocked settlements for stale, conflict, or withdrawn publication tuples

## Generated Artifacts

Machine-readable deliverables:

- `/Users/test/Code/V/data/analysis/schema_migration_plan_schema.json`
- `/Users/test/Code/V/data/analysis/projection_backfill_plan_schema.json`
- `/Users/test/Code/V/data/analysis/migration_readiness_matrix.csv`
- `/Users/test/Code/V/data/analysis/migration_backfill_control_catalog.json`

Browser and validation deliverables:

- `/Users/test/Code/V/docs/architecture/95_expand_migrate_contract_and_readiness_rules.md`
- `/Users/test/Code/V/docs/architecture/95_migration_and_backfill_control_room.html`
- `/Users/test/Code/V/tests/playwright/migration-and-backfill-control-room.spec.js`
- `/Users/test/Code/V/tools/analysis/validate_migration_and_backfill_runner.py`

## Boundaries

- Projection backfill never becomes business-truth authority.
- Publication drift, rollback mismatch, missing comparison proof, or incomplete observation fail closed.
- Contractive cutover remains blocked unless the observation window is satisfied and the route verdict is explicitly `ready`.
- Later release-specific migrations can attach new manifests to this seam without changing the plan, settlement, or readiness object model.
