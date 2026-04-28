# 385 Algorithm Alignment Notes

## Upstream Inputs

- 383 supplies `PromotionReadinessResult`, `RouteReadinessResult`, continuity evidence refs, accessibility audit refs, and compatibility audit refs.
- 384 supplies `NHSAppEnvironmentProfile`, `ChannelTelemetryPlan`, telemetry event contract refs, and `SCALBundle` refs.

## Live Cohort Evaluation

The cohort evaluator checks one manifest tuple:

1. validate environment profile parity
2. verify route promotion readiness for the cohort journeys
3. evaluate `ReleaseGuardrailPolicy`
4. reject active freeze records under the same tuple
5. emit an auditable decision

## Freeze Triggers

The freeze manager opens `ChannelReleaseFreezeRecord` for:

- telemetry missing
- threshold breach
- assurance slice degraded or quarantined
- compatibility drift
- continuity evidence degraded, stale, or missing

`sample_size_below_minimum` blocks expansion without creating a freeze by itself.

## Route Freeze Disposition

`RouteFreezeDisposition` is derived only from an active freeze record. The same manifest and release approval refs are copied onto the route disposition so the patient-facing mode cannot drift from the release freeze.

## Monthly Pack

The monthly pack generator uses the 384 `ChannelTelemetryPlan` and event contract refs. Aggregated rates come from `GuardrailObservationWindow`; raw identity material is out of contract.

## Journey Change Notice

Minor changes need 30 days (`P1M`). Significant and new journey changes need 90 days (`P3M`). The notice is still recorded when blocked so the Integration Manager workflow has audit evidence.
