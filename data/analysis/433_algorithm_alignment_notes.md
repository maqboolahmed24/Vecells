# 433 Phase 9 Operational Algorithm Alignment Notes

- Source algorithm: `blueprint/phase-9-the-assurance-ledger.md#9B`.
- Breach risk freezes working-minute slack, effective workload, conservative capacity lower bound, estimated wait, service time, dependency delay, Gamma moments, calibrated probability, Wilson interval bounds, queue-level aggregate probability, and priority.
- Anomaly state freezes expected value source, standardized residual, EWMA, positive and negative CUSUM, minimum support, hysteresis, alert states, and de-escalation holds.
- Essential-function metrics are versioned definitions over operational source projections, not UI-local counters.
- Trust and completeness boundaries require freshness, trust, completeness, affected scope, graph or verdict refs where assurance-derived, blockers, and permitted dashboard posture.
- Dashboard contracts expose `stateLabel`, `stateReason`, `primaryValue`, `confidenceOrBound`, `lastUpdated`, `trustState`, `blockingRefs`, `allowedDrillIns`, and `investigationScopeSeed`.
- Unsupported metric normalization, cross-tenant aggregation, missing trust/completeness state, stale projection, or low-support equity data fail closed.
