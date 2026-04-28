# 481 Go-Live Smoke And Recovery Runbook

## Before Running

Confirm the release candidate, runtime publication bundle, wave manifest, restore point, release watch tuple, and owner rota match the current Wave 1 scope. Use synthetic data only.

## Smoke Order

1. Verify backup manifest health, restore point freshness, immutable evidence-store reachability, and restore report channel delivery.
2. Run clean-environment restore and failover probes against production-like topology.
3. Run patient start/status, staff task, booking, operations, governance, release, alert, audit, and rollback smoke checks.
4. Confirm recovery communications are delivered and owner rota is present.
5. Keep destructive recovery rehearsal controls disabled outside scoped synthetic rehearsal.

## Fail-Closed Decisions

- Missing restore report channel: pause promotion.
- Stale audit replay after restore: keep restore evidence diagnostic only.
- Failover parity mismatch: stand down failover and republish parity.
- Staff queue lag breach: hold widening and keep Wave 1 constrained.
- Missing owner rota: assign incident owner before promotion.
- Broken embedded/mobile route: keep NHS App channel deferred.
- Assistive insert visible after freeze: keep assistive visible mode disabled.
