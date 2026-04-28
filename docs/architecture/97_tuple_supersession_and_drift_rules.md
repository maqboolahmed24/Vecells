# 97 Tuple Supersession And Drift Rules

`ReleaseWatchTuple` supersession is mandatory whenever scope, observation duty, guardrail inputs, recovery posture, or continuity evidence changes. The coordinator does not mutate active tuple meaning in place: it marks the prior tuple and policy `superseded`, records lineage, and publishes a fresh active tuple for the same wave step.

The stale rules are intentionally fail-closed:

- runtime publication or release parity drift marks the watch stale
- continuity evidence or active channel freeze drift marks the watch stale
- missing assurance slices or frozen trust posture marks the watch stale
- expired windows or incomplete probe coverage block stabilization even when the tuple itself is still exact

The action gate is tuple-aware:

- `widen`, `resume`, and `close` require `tupleState = active`, `policyState = satisfied`, `watchState = satisfied`, and a satisfied observation window
- `pause` stays available for live tuples because recovery can still require narrowing posture
- `rollback` is available when the tuple is stale or any rollback trigger is armed

The preview scenario in [release_watch_pipeline_catalog.json](/Users/test/Code/V/data/analysis/release_watch_pipeline_catalog.json) includes explicit lineage proving a prior watch tuple was superseded after scope and continuity duty changed. That publication history is the seam the later `ReleaseWatchEvidenceCockpit` will consume.

This task keeps later resilience and cockpit work explicit instead of implicit:

- `FOLLOW_ON_DEPENDENCY_097_RELEASE_WATCH_EVIDENCE_COCKPIT`
- `FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT`
