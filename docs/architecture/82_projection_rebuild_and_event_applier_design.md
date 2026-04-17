# 82 Projection Rebuild And Event Applier Design

## Purpose

Task `par_082` adds the deterministic replay substrate for audience-safe projections inside `@vecells/release-controls`. The implementation makes two runtime authorities explicit:

- `EventApplier` is the only path that may transform immutable canonical events into projection state.
- `ProjectionRebuildWorker` is the checkpointed replay controller that rebuilds, resumes, dry-runs, and evaluates publication posture.

The projection substrate does not create a second source of truth. Domain truth remains the immutable event spine plus published contracts. Projection state is derived audience truth only.

## Runtime Model

The worker persists five machine-readable records during replay:

- `ProjectionDocument`: the current read-model snapshot for one family/version/key tuple
- `ProjectionApplyReceipt`: idempotency evidence for one applied event
- `ProjectionCheckpoint`: last durable replay boundary for one family/version/key tuple
- `ProjectionRebuildCursor`: restart state and next stream position
- `ProjectionRebuildLedger`: operator-facing replay progress and outcome summary

Read-path honesty is enforced by explicit verdicts:

- `ProjectionCompatibilityVerdict` blocks unsupported schema or version windows before publication
- `ProjectionReadinessVerdict` tells shells whether the projection is `live`, `recovering`, `stale`, or `blocked`

## Apply Semantics

`EventApplier` is bound to the canonical registry from `@vecells/event-contracts` via a concrete dispatch table. Each handler declaration names:

- projection family and projection version
- route family and published manifest
- canonical event name
- accepted `schemaVersionRef` values
- deterministic reducer

The applier fails closed when:

- the event name and schema version are not published in the canonical registry
- the projection family consumes the event name but not the supplied schema version

The applier is idempotent because every applied effect writes a `ProjectionApplyReceipt` keyed by projection tuple plus event id. If a restart replays an already applied event, the receipt is reused and the worker advances without duplicating state mutation.

## Worker Semantics

`ProjectionRebuildWorker` enforces:

- immutable-event-only replay
- deterministic stream ordering by stream position then event id
- per-event checkpoints for restart safety
- bounded parallelism across projection families only
- serial apply order within a family
- dry-run shadow rebuild for compare-before-cutover

The mock replay lab covers:

- cold rebuild from an empty store
- partial replay from a saved checkpoint
- crash followed by replay-safe resume
- contract mismatch blocking publication
- additive dual-read rebuild comparison
- stale posture downgrade to `summary_only`

## Route And Publication Binding

The implemented projection families bind to published route/manifests already declared elsewhere in the repo:

- `PRCF_082_PATIENT_REQUESTS` -> `PCF_050_RF_PATIENT_REQUESTS_V1` / `FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1`
- `PRCF_082_STAFF_WORKSPACE` -> `PCF_050_RF_STAFF_WORKSPACE_V1` / `FCM_050_CLINICAL_WORKSPACE_V1`
- `PRCF_082_OPERATIONS_BOARD` -> `PCF_050_RF_OPERATIONS_BOARD_V1` / `FCM_050_OPERATIONS_CONSOLE_V1`
- `PRCF_082_SUPPORT_REPLAY` -> `PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1` / `FCM_050_SUPPORT_WORKSPACE_V1`

## Parallel Gaps

The task publishes bounded fallbacks for later production wiring:

- `PARALLEL_INTERFACE_GAP_082_LIVE_EVENT_BUS_BINDING`
- `PARALLEL_INTERFACE_GAP_082_MIGRATION_RUNNER`
- `PARALLEL_INTERFACE_GAP_082_PROJECTION_STORE_DRIVER`
- `PARALLEL_INTERFACE_GAP_082_PUBLICATION_GATE`

These gaps do not change deterministic apply rules. They only defer transport, storage, and promotion plumbing.
