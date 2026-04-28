# Task 450 Operations Overview Implementation Note

The `/ops/overview` frontend now consumes a deterministic task-450 projection adapter for NorthStarBand, ServiceHealthGrid, freshness/trust/freeze strip, stable service digest, and return-token continuity state.

The visual hierarchy keeps NorthStarBand as compact operational vitals, ServiceHealthGrid as the primary essential-function map, BottleneckRadar as the promoted anomaly field, and the right rail as selected-service detail plus a return-safe drill affordance. Stable-service posture renders one OpsStableServiceDigest instead of a wall of healthy charts.

Fail-closed states preserve the same OperationsConsoleShell. Stale, degraded, quarantined, blocked, permission-denied, freeze, and settlement-pending scenarios keep the last stable context visible while downgrading affected controls to observe-only, read-only, diagnostic, blocked, or governance-only posture.

The route publishes semantic automation anchors for `ops-overview`, `north-star-band`, `service-health-grid`, `ops-freshness-strip`, `ops-stable-service-digest`, `ops-health-cell`, and `ops-return-token-target`.

Playwright evidence is written to `.artifacts/operations-overview-450` for normal, stable service, stale, degraded, quarantined, blocked, permission-denied, freeze, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow states.
