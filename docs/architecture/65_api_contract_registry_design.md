# 65 API Contract Registry Design

`par_065` hardens the seq_050 frontend contract outputs into one backend-published lookup registry.
The registry is the authoritative source for browser-facing:
- `ProjectionQueryContract`
- `MutationCommandContract`
- `LiveUpdateChannelContract`
- `ClientCachePolicy`

## Outcome

The generated registry currently publishes:
- 19 route-family bundles
- 9 manifest-ready route-family sets
- 19 projection query contracts
- 19 mutation command contracts
- 15 live-update channel contracts
- 21 client-cache policies
- 74 digest lookup rows

## Registry Law

1. Browser authority may not be reconstructed from route code, route-local hooks, or shell-local cache behavior.
2. Every browser-visible route family resolves through exactly one manifest-ready route bundle.
3. Query contracts stay bound to published projection family, version, and version-set refs.
4. Mutation contracts stay bound to route-intent, settlement, and recovery law. Where the shared decision table has not yet expanded to the published alias ref, the registry records a bounded `PARALLEL_INTERFACE_GAP_*` warning instead of inventing route-local semantics.
5. Live-channel contracts may not imply writable or complete truth beyond their trust-boundary and readiness refs.
6. Cache policies remain backend-published tuples grouped to exact query and live-channel membership.

## Parallel Gaps

The current registry records 16 bounded parallel interface gaps for route-intent alias expansion and 4 allowed live-channel absences where the published browser posture is recovery-only or summary-only by law.
