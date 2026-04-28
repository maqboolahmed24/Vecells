# Wave 1 Monitoring And Pause Runbook

Generated: 2026-04-28T00:00:00.000Z

## Operating rule

Use data/release/483_wave1_stability_verdict.json as the Wave 1 observation authority. Do not widen from dashboard labels, raw logs, or informal feature flags.

## Stable path

1. Confirm the active WaveStabilityVerdict is stable.
2. Confirm wideningEligibility.wideningEnabled is true.
3. Confirm dwell evidence is complete for 24 hours with 288 approved five-minute samples.
4. Confirm pauseRecommendationRefs and rollbackRecommendationRefs are empty.
5. Hand task 484 the active verdict and eligibility refs.

## Pause path

Open a typed WaveActionRecord pause command when a guardrail evaluation carries severity pause. Preserve the tenant, cohort, channel, idempotency key, purpose binding, injected clock, and WORM audit refs from the WavePauseRecommendation.

## Rollback path

Open the rollback command when runtime publication parity is stale after promotion. Do not widen until parity is exact and a fresh stability verdict is published.

## Blocked path

Missing channel monthly-data evidence for an active channel cohort blocks stability. Keep Wave 1 active only in the already approved scope and resolve the channel obligation before any wider or channel-specific action.
