# Operations mock projection strategy

The seed routes are backed by truthful mock projections that preserve the production shell topology. The board seeds one promoted anomaly at a time, keeps lower-noise watchpoints visible, and downgrades visuals without changing shells when parity or freshness drift.

## Seeded anomaly families

- Backlog surge
- Dependency degradation
- Continuity breakage
- Confirmation drift
- Release freeze
- Restore debt
- Supplier ambiguity

## Projection examples

- `OPS_OVERVIEW_LIVE` at `/ops/overview` (`live`) :: Desktop overview keeps one dominant backlog anomaly and a live intervention workbench.
- `OPS_QUEUES_BUFFERED` at `/ops/queues` (`buffered`) :: Queue lens buffers new deltas instead of re-ranking away from the preserved backlog selection.
- `OPS_DEPENDENCIES_TABLE_ONLY` at `/ops/dependencies` (`table_only`) :: Dependency lens downgrades visualization parity to table-only posture while preserving the same shell.
- `OPS_AUDIT_INVESTIGATION` at `/ops/audit/investigations/ops-route-12` (`stale`) :: Audit investigation keeps preserved proof basis visible and action posture frozen under stale continuity truth.
- `OPS_INCIDENT_COMPARE` at `/ops/incidents/compare/ops-route-15` (`buffered`) :: Incident compare route opens the only allowed three-plane posture and preserves the same anomaly selection.
- `OPS_RESILIENCE_HEALTH` at `/ops/resilience/health/ops-route-18` (`live`) :: Resilience health drill keeps essential-function health visible beside restore debt context.

## Recorded future gaps

- `GAP_FUTURE_OPS_METRIC_QUEUE_DENSITY_V1`
- `GAP_FUTURE_OPS_METRIC_DEPENDENCY_TRACES_V1`
- `GAP_FUTURE_OPS_CHILD_ROUTE_CONTINUITY_GRAPH_V1`
- `GAP_BOUNDARY_OPS_GOV_HANDOFF_RELEASE_EXCEPTION_V1`
