# 378 Algorithm Alignment Notes

## Upstream Inputs

- `373` marks `par_378` ready under `open_phase7_with_constraints`.
- `375` freezes `ChannelContext`, `ChannelContextEvidence`, `EmbeddedEntryToken`, `ShellPolicy`, `PatientEmbeddedSessionProjection`, `PatientEmbeddedNavEligibility`, bridge floor, and navigation behavior contracts.
- `377` provides immutable manifest lookup, journey metadata, continuity evidence, release tuple, and route-freeze refs.
- Blueprint `7B` requires backend-owned embedded context resolution, no query-trust shortcut, and same-shell recovery continuity.

## Implementation Alignment

- `ChannelContextResolver`: `resolve()`
- `ChannelContextEvidence` verifier: `ChannelContextEvidenceVerifier`
- `EmbeddedEntryToken` service: `EmbeddedEntryTokenService`
- `ShellPolicyResolver`: `buildShellPolicy`
- `EmbeddedShellConsistencyProjection` builder: `embeddedShellConsistencyProjection`
- `PatientEmbeddedSessionProjection` builder: `patientEmbeddedSessionProjection`
- `PatientEmbeddedNavEligibility` evaluator: `chooseEligibilityState`
- Context-resolution audit emitters: `ContextResolutionAuditStore`
- SSR/request middleware contract: `hydrationBinding` with server-only rehydration

## Gap Closures

| Gap | Closure |
| --- | --- |
| Query hint unlocks trust | `from=nhsApp` yields `hinted_embedded`, `embedded_styling_only`, and `placeholder_only`; it cannot produce live actions |
| SSR/hydration split brain | server result emits `rehydrateFromServerOnly` and downgrades conflicting hydration context with `hydration_conflict` |
| Stale embedded session still shows live actions | manifest drift, inactive or missing session, stale bridge, and route freeze alter `PatientEmbeddedSessionProjection.eligibilityState` |
| Shell policy lives in route components | `ShellPolicy` is resolved from backend context and included with every result |
| Same entity opens second shell | `patientShellContinuityKey` and `entityContinuityKey` are preserved in `EmbeddedShellConsistencyProjection` |

## Downgrade Matrix

`PatientEmbeddedNavEligibility` is deliberately conservative:

- invalid signed evidence, invalid entry token, replayed token, standalone context, or kill switch returns `blocked`
- hint-only context returns `placeholder_only`
- bridge unavailable or route frozen returns `read_only`
- manifest drift, degraded continuity, missing session, inactive session, stale bridge, or missing bridge actions returns `recovery_required`
- only fully trusted current context returns `live`

## Downstream Contract

Tasks `379`, `380`, `381`, and `383` must consume this resolver and its projection outputs. They must not reconstruct channel trust from browser URL parameters, user agent, bridge probes, or route-local state.
