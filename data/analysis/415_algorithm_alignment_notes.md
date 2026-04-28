# 415 Algorithm Alignment Notes

## Local Sources

- `blueprint/phase-8-the-assistive-layer.md#8g-monitoring-drift-fairness-and-live-safety-controls`
- `blueprint/phase-0-the-foundation-protocol.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- validated outputs from `404`, `405`, `406`, `409`, `410`, `411`, and `414`

## Implementation Mapping

- `AssistiveCapabilityWatchTuple` is the immutable identity for a capability behavior. It pins model, prompt bundle hash, policy bundle, calibration bundle, conformal bundle, threshold set, route contracts, release cohort, and runtime publication bundle.
- `ReleaseGuardThreshold` records interval method and sequential detector policy so threshold decisions are reproducible.
- `DriftSignal` follows the blueprint requirement that a block-level drift alert needs both effect size and sequential evidence.
- `BiasSliceMetric` uses interval bounds and a shrinkage-aware posterior mean. Minimum-sample failure becomes `insufficient_evidence`, not green.
- `AssistiveCapabilityTrustProjection` implements the normalized penalty model and maps to `trusted`, `degraded`, `quarantined`, `shadow_only`, or `frozen`.
- `AssistiveCurrentPosture` and `AssistiveCapabilityRolloutVerdict` expose the exact route and cohort ceilings that `416`, `418`, `422`, `423`, `429`, and `430` must consume.

## Conservative Defaults

The implementation fails closed when visible evidence, calibration evidence, outcome evidence, runtime publication, current kill-switch state, disclosure-fence health, or publication state is incomplete. Missing evidence produces `shadow_only`; hard blockers and decisive threshold breaches produce `quarantined` or `frozen`.

## PHI Boundary

Monitoring records contain refs, hashes, counts, intervals, state tokens, and blocker codes. Prompt fragments, transcript text, free-text clinician edits, and patient context stay outside the monitoring plane.
