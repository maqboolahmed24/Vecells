# Phase 8 Monitoring And Trust Projection

Task `par_415` adds the backend monitoring plane for assistive capabilities.

## Owned Services

- `ShadowComparisonRunService` records offline, shadow, and post-visible comparison runs by refs and metric-window identifiers.
- `AssistiveDriftDetectionOrchestrator` records drift signals only when detector family, effect size, and sequential evidence are explicit.
- `FairnessSliceMetricService` materializes subgroup metrics with Wilson intervals, shrinkage-aware posterior means, and minimum-sample behavior.
- `ReleaseGuardThresholdService` owns interval and sequential detector thresholds for visible, insert, commit, and release levels.
- `AssistiveIncidentLinkService` links assistive sessions to incident systems without copying clinical text.
- `AssistiveCapabilityWatchTupleRegistry` materializes the immutable operational identity for one capability behavior.
- `AssistiveCapabilityTrustProjectionEngine` computes the normalized penalty model and current trust floor from current evidence, not historical command memory.
- `AssistiveCurrentPostureResolver` publishes exact route and cohort ceilings for later freeze and UI consumers.

## Watch Tuple Identity

`AssistiveCapabilityWatchTuple` binds capability code, release candidate, rollout ladder, model version, prompt bundle hash, policy bundle, calibration bundle, uncertainty selector, conformal bundle, threshold set, route contracts, release cohort, and runtime publication bundle.

The tuple is immutable. If a model, prompt, policy, threshold, route contract, or runtime bundle changes, a new tuple must be published rather than mutating the current one.

## Evidence Levels

The plane ingests three evidence levels:

- offline gold or replay evidence from evaluation and provenance tasks
- live shadow comparison against settled clinician outcomes
- post-visible monitoring across route families, tenants, cohorts, and configured subgroup slices

Monitoring records store refs, hashes, counts, intervals, window refs, and blocker codes. They do not store transcript text, prompt fragments, free-text edits, or patient context.

## Interval Thresholds

Binary and rate metrics use Wilson or Beta-Binomial interval methods. A fairness slice with too little evidence becomes `insufficient_evidence`; it does not become green. For `higher_is_better` metrics, the lower interval bound governs downgrade. For `lower_is_better` harm metrics, the upper interval bound governs downgrade.

Drift signals require both an effect-size floor and a sequential evidence boundary. A high effect with weak evidence remains `watch`, and a strong p-value-like evidence value without a meaningful effect also remains non-blocking.

## Trust Projection

`AssistiveCapabilityTrustProjectionEngine` computes:

`P(t) = sum(weight_i * severity_i)`

and then:

`trustScore = published * runtime_current * no_hard_freeze * exp(-P(t))`

The score is mapped monotonically:

- `trusted` only when the score is above the trusted threshold and there are no hard blockers
- `degraded` when the score is below trusted but above quarantine
- `quarantined` when the score is below quarantine, a block threshold fires, a current kill switch blocks, a disclosure fence fails, or a high-severity incident remains active
- `shadow_only` when calibration, uncertainty, visible, or outcome evidence is incomplete
- `frozen` when a release freeze is active

The projection exposes threshold breaches, incident links, blocking reason codes, fallback mode, visibility ceiling, insert ceiling, approval ceiling, and rollout ceiling.

## Current Posture

`AssistiveCurrentPostureResolver` turns the capability-wide projection into a route and cohort posture. It also writes `AssistiveCapabilityRolloutVerdict` so downstream tasks can ask one exact question: what can this route and cohort legally show or do now?

Visible rendering requires in-slice membership, exact policy, published surface, complete visible evidence, and a projection that allows visible posture. Insert and approval ceilings require stricter rung-specific evidence. Missing or stale evidence fails closed to `observe_only`, `shadow_only`, or `blocked`.

## PHI Boundary

The monitoring plane is PHI-safe by construction: it stores refs, hashes, counts, intervals, and blocker codes rather than clinical text.
