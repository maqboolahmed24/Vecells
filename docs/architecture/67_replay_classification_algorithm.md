# 67 Replay Classification Algorithm

## Canonicalization Steps

1. Compute `h_raw = H(raw_bytes)` from the transport payload exactly as received.
2. Compute `h_sem = H(Canon_sem(payload))`, where canonical semantic payload:
   - removes trace and transport-only fields
   - sorts object keys
   - collapses duplicate whitespace
   - preserves actor, scope, lineage, and intent fields
3. Compute `expectedEffectSetHash` from the sorted expected-effect list.
4. Compute `scopeFingerprint` from action scope, governing lineage, governing object, route tuple, route contract digest, runtime binding, and release-trust posture.
5. Compute `replayKey = H(actionScope || governingLineageRef || effectiveActorRef || h_sem || causalParentRef || intentGeneration)`.

## Classification Order

1. If the exact replay composite already exists, classify `exact_replay` when `h_raw` matches and `semantic_replay` when only `h_sem` matches.
2. If source command or transport correlation resolves to an existing record with matching semantic hash and matching scope fingerprint, classify replay against that same authoritative chain.
3. If source command, transport correlation, or callback correlation resolves to an existing record but semantic payload or scope diverges, open `ReplayCollisionReview`.
4. If the effect scope key is already owned by another accepted chain, fail closed into governed collision review instead of accepting a second side effect.
5. Otherwise persist a new `IdempotencyRecord(decisionClass = distinct)` and allow one canonical mutation path.

## Callback Rules

1. Every effect key owns one live `AdapterDispatchAttempt`.
2. `AdapterReceiptCheckpoint` accepts new receipts, returns exact or semantic replay, ignores stale out-of-order receipts, or opens callback-scope collision review.
3. Receipt checkpoints may confirm or repeat the same settlement chain; they may not fork it.
