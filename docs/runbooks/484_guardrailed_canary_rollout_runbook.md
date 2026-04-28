# Guardrailed Canary Rollout Runbook

Generated: 2026-04-28T00:00:00.000Z

## Authority

Use data/release/484_wave_widening_evidence.json and data/release/484_canary_wave_settlements.json as the canary rollout authority. Do not widen from route labels, dashboards, or informal feature flags.

## Widening sequence

1. Confirm Wave 1 stability is exact.
2. Confirm the canary selector hash has not expanded.
3. Confirm blast-radius proof is exact for tenant, channel, and route scope.
4. Submit the CanaryWaveActionRecord with role authorization, purpose binding, idempotency key, injected clock, and WORM audit ref.
5. Treat accepted control-plane state as pending until CanaryWaveSettlement and the bound observation policy are satisfied.

## Stop conditions

Pause after any post-settlement guardrail breach before dwell completion. Roll back or block when channel embedding recovery is not exact. Supersede stale actions when observation policy changes after approval.
