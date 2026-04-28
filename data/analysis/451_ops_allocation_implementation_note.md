# Task 451 Operations Allocation Implementation Note

`/ops/queues` and `/ops/capacity` now share a deterministic task-451 projection adapter for BottleneckRadar, CapacityAllocator, CohortImpactMatrix, and InterventionWorkbench.

BottleneckRadar renders a ranked ladder instead of a dense chart: rank, affected scope, consequence, leverage, persistence, trust, guardrail drag, trend, and the ranking reason all have visual and table parity.

CapacityAllocator starts from the selected bottleneck and shows current capacity, proposed delta, breach impact, dependency constraints, confidence interval, calibration age, owner, and proposal state in compact bars plus table fallback.

CohortImpactMatrix is sample-gated. Low-sample cohorts remain context-only and cannot become dominant even when the point estimate is high.

InterventionWorkbench is driven by `InterventionCandidateLease` and `OpsActionEligibilityFence`. Executable, observe-only, stale-reacquire, read-only-recovery, handoff-required, blocked, and settlement-pending postures are explicit, with governance handoff preserved by the existing return-token shell.

Playwright evidence is written to `.artifacts/operations-allocation-451` for queues/capacity routes, normal, empty, stale, degraded, quarantined, blocked, permission-denied, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.
