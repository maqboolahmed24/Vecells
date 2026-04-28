# Phase 9 Operational Projection Engine Algorithm Alignment

The engine composes the frozen task 433 operational contracts and the task 436 graph verdict posture. It does not calculate queue health from UI state.

Projection replay is deterministic: events are validated by typed adapters, deduped by declared dedupe keys, ordered by domain timestamp, ordering key, sequence, and event id, then hashed through the Phase 9 assurance canonical hash helpers.

Breach risk uses the frozen working-minute slack, effective workload, conservative capacity, service time, dependency delay, Gamma survival, calibration, Wilson bounds, and queue aggregate formulas.

Continuity-control health requires exact settlement or restore refs, return or continuation refs, experience continuity evidence refs, continuity hashes, and required AssuranceSliceTrustRecord rows. Queue age and dependency delay remain supporting symptoms only.

Dashboard DTOs carry freshness, trust, completeness, blockers, drill-in scope, graph verdict refs, projection health refs, and risk bounds so stale, untrusted, or incomplete projections fail closed.
