# 97 Wave Observation And Watch Tuple Pipeline

`par_097` turns `ReleaseWatchTuple` and `WaveObservationPolicy` into executable release-control objects instead of leaving watch posture in dashboards or runbooks. The authoritative machine-readable payload is [release_watch_pipeline_catalog.json](/Users/test/Code/V/data/analysis/release_watch_pipeline_catalog.json), with schemas in [release_watch_tuple_schema.json](/Users/test/Code/V/data/analysis/release_watch_tuple_schema.json) and [wave_observation_policy_schema.json](/Users/test/Code/V/data/analysis/wave_observation_policy_schema.json).

The runtime seam lives in [release-watch-pipeline.ts](/Users/test/Code/V/packages/release-controls/src/release-watch-pipeline.ts). It separates tuple assembly, policy assembly, publication and supersession, observation-window evaluation, rollback-trigger evaluation, and wave-action eligibility checks. The coordinator enforces one active tuple per `releaseRef` and `waveRef`, preserves append-only timeline events, and fails closed when the bound runtime publication or observation evidence drifts.

The generated catalog publishes six rehearsal scenarios:

- `LOCAL_SATISFIED` proves exact local publication can satisfy dwell and close safely.
- `LOCAL_ACCEPTED` proves accepted control intent is not yet stabilized authority.
- `LOCAL_BLOCKED` proves incomplete dwell or sample coverage blocks close-out.
- `CI_PREVIEW_STALE` proves a stale preview tuple remains inspectable but not widenable.
- `INTEGRATION_STALE` proves tuple-member drift marks the watch stale immediately.
- `PREPROD_ROLLBACK_REQUIRED` proves rollback triggers are data-driven and auditable.

Mock-now execution:

- rehearsal scripts in [/Users/test/Code/V/tools/runtime-release-watch](</Users/test/Code/V/tools/runtime-release-watch>) hydrate the generated watch catalog and rerun the control logic locally
- the local rehearsal stays schema-compatible with later non-production or production hardening
- every stored result includes the tuple, policy, observation window, trigger evaluations, action eligibility, and timeline output

Actual production strategy later:

- `FOLLOW_ON_DEPENDENCY_097_RELEASE_WATCH_EVIDENCE_COCKPIT` layers richer governance and operations presentation over the same tuple and policy contract
- `FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT` replaces the current placeholder readiness ref without changing watch hashes or observation semantics
- stronger schedulers, alerting, and blast-radius feeds may attach later, but the authoritative tuple remains the same published record

Bounded defaults are explicit in policy data:

- `GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT`
- `GAP_RESOLUTION_WAVE_POLICY_PROBE_STALENESS_BUDGET`
