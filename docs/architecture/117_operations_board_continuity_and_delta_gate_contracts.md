# Operations board continuity and delta-gate contracts

## OpsBoardStateSnapshot

The board snapshot binds the selected anomaly, current delta gate, current selection lease, service-health rows, cohort rows, and the same-shell child-route intent into one published view model.

## OpsSelectionLease

The selected anomaly stays pinned while the delta gate is `buffered`, `stale`, or `table_only`. Fresh deltas may update secondary summaries, but they do not steal the promoted anomaly.

## OpsDeltaGate

- `live`: chart-plus-table visuals and bounded intervention eligibility
- `buffered`: new deltas queue behind the current lease and the workbench is guarded
- `stale`: the board preserves the last safe explanation and freezes the workbench
- `table_only`: visualization parity has degraded, so the shell falls back to table-first evidence

## OpsReturnToken

The return token records the origin path, selected anomaly, lens, and time horizon. Child routes and governance stubs must use it when returning to board state.
