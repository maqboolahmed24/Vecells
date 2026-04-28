# 67 Idempotency And Collision Review Design

Captured on `2026-04-12` for `par_067`.

## Authority Split

`IdempotencyRecord` is the durable replay authority. It owns canonical command hashes, replay keys, effect-scope uniqueness, and the accepted action-settlement chain.

`ReplayCollisionReview` is the only legal holding area for semantically divergent identifier reuse or callback scope drift. It never quietly converts back into ordinary mutation.

`AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` are the callback-safe support objects. They bind one externally consequential effect key to one dispatch chain and one receipt checkpoint ledger.

## Canonical Homes

- `packages/domains/identity_access/src/replay-collision-backbone.ts`
- `services/command-api/src/replay-collision-authority.ts`
- `services/command-api/src/replay-collision-simulator.ts`
- `services/command-api/migrations/067_idempotency_and_replay_collision.sql`

## Summary

- Idempotency records: `5`
- Replay collision reviews: `2`
- Dispatch attempts: `2`
- Receipt checkpoints: `4`

## Control Guarantees

1. Canonical hashing strips transport-only noise but preserves actor-, scope-, lineage-, and intent-bearing content.
2. Replay recognition runs under compare-and-set and never depends on browser debouncing or queue retries.
3. Exact and semantic replay return the same authoritative settlement chain.
4. Divergent identifier reuse opens explicit `ReplayCollisionReview` and blocks automatic mutation.
5. Callback dedupe can advance or ignore the same chain, but it cannot create a second business result.
