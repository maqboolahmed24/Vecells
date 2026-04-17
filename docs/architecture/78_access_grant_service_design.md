# 78 Access Grant Service Design

`par_078` freezes one canonical `AccessGrantService` around the append-only grant, scope-envelope,
redemption, and supersession models already implemented in
`packages/domains/identity_access/src/identity-access-backbone.ts` and exercised through
`services/command-api/src/access-grant.ts`.

## Frozen Scope

- Grant families: 7
- Use-case registry rows: 11
- Runtime tuples: 14
- Casebook scenarios: 14
- Bounded ports: 2
- Parallel interface gaps: 2

## Canonical Service Responsibilities

- Issue one immutable `AccessGrantScopeEnvelope` for every redeemable grant.
- Materialize opaque signed tokens through `OpaqueAccessGrantTokenMaterializer` with key-version support.
- Settle one exact-once `AccessGrantRedemptionRecord` before any session creation, callback re-entry, or replacement issuance occurs.
- Delegate bounded session posture decisions to `SessionGovernor`, never to channel-local code.
- Delegate auth uplift and post-auth return freezing to `AuthBridge`, never to grant consumers.
- Return the current settlement on exact replay instead of producing a second side effect.
- Supersede older grants on promotion, rotation, logout, wrong-patient repair, reissue, and route-drift invalidation.
- Publish explicit `recover_only` and `manual_only` outcomes instead of minting misleading links.

## Bounded Runtime Law

The service binds every grant to a route family, governing object, governing version, action scope,
subject-binding rule, lineage fence epoch, token key version, and route-intent posture. That closes the
previously observed gaps where authentication success was treated as permission, channel-specific links
invented their own replay rules, or stale links survived after tuple drift and repair.

## Scenario Baseline

- Live grants after scenario execution: 2
- Redeemed settlements: 7
- Supersession-bearing cases: 5
- Replay-block or replay-return incidents: 4
- Explicit non-grant outcomes: 2
- Auth-bridge cases: 1

## Remaining Parallel Gaps

- `PARALLEL_INTERFACE_GAP_AUTH_BRIDGE_CALLBACK_PROVIDER`
- `PARALLEL_INTERFACE_GAP_SESSION_COOKIE_RUNTIME`

Both gaps are intentionally bounded. Live providers may later change proof collection, callback delivery,
or cookie/runtime wiring, but they must still call the same grant authority and may not bypass scope
envelope validation, route-intent checks, exact-once redemption settlement, or supersession chains.
