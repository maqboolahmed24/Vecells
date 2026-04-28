# Task 464 Algorithm Alignment

## Source Blocks Applied

- Phase 9 9A: browser surfaces bind `AudienceSurfaceRuntimeBinding`, projection health, slice trust, graph verdict, and last stable diagnostic views before live posture.
- Phase 9 9B: live operations board updates preserve selected anchors, use delta gates, and downgrade stale projections without reordering the operator context.
- Phase 9 9C: audit and support replay return tokens preserve question, scope, and timeline hashes; tuple drift returns read-only recovery instead of resetting.
- Phase 9 9D and 9I: graph completeness drift blocks assurance export and conformance signoff.
- Phase 9 9F and 9G: resilience and incident settlements replace pending local state; quarantined incident producers affect incident-dependent slices only.
- Phase 9 9H: tenant, access, standards watchlist, migration, and backfill drift fail closed through governance-shell routes.
- Platform runtime and Phase 0: live channels carry safe read projections, settlement refs, runtime bundle refs, and telemetry disclosure fence refs. Raw domain events and PHI-bearing payloads remain outside browser truth.

## Implementation Shape

`LivePhase9ProjectionGateway` is a small domain integration layer in `packages/domains/operations/src/phase9-live-projection-gateway.ts`. It publishes:

- typed live-channel contracts for every Phase 9 surface;
- deterministic fixture projections for normal, stale, quarantined, blocked, diagnostic-only, reconnecting, and recovery-only states;
- fail-closed subscription checks for projection version mismatch and missing runtime binding;
- test fixtures for projection patch, graph drift, producer quarantine, settlement replacement, delta gate, and return-token drift.

The ops and governance shells render the same gateway strip through route-derived `selectedSurfaceCode` and URL-driven `liveState`, then expose automation anchors for Playwright evidence.

## Gap Closures

- Raw event browser join gap: `rawEventBrowserJoinAllowed` and `rawDomainEventPayloadAllowed` are always `false` at contract, projection, DOM, and test levels.
- Global blackout gap: `quarantined_incident_producer` downgrades only operations overview, assurance center, and incident desk while records, tenant governance, access, compliance, conformance, audit, and resilience remain current.
- Optimistic state gap: action state comes from `latestSettlementRef` and `actionSettlementState`, not from a local button click.
- Delta context gap: queued delta fixtures preserve `selectedAnchorRef` and set focus protection active.
- Cross-surface drift gap: `return_token_drift` renders `partial_restore` and read-only recovery copy on the selected route.
