# 378 Phase 7 Context Resolver And Embedded Session Projection

## Boundary

`Phase7EmbeddedContextResolverAndSessionProjection` is the executable backend kernel for trusted NHS App embedded context. It consumes the frozen `375` embedded context contracts and the `377` manifest service, then returns one server-owned `ChannelContext` plus the `ShellPolicy`, `EmbeddedShellConsistencyProjection`, `PatientEmbeddedSessionProjection`, and `PatientEmbeddedNavEligibility` that route code must consume.

The implementation lives in `services/command-api/src/phase7-embedded-context-service.ts`. It is deterministic local backend code. It does not claim live NHS App approval, a production bridge capability matrix, or completed SSO binding work from `379`.

## Owned Capabilities

- `ChannelContextResolver` for one exact server context per request.
- `ChannelContextEvidence` verification with signature, TTL, route, and cohort checks.
- `EmbeddedEntryTokenService` with HMAC signature, TTL, nonce, replay, route, and cohort validation.
- `ShellPolicyResolver` that binds route components to server-owned shell policy instead of query heuristics.
- `EmbeddedShellConsistencyProjection` preserving `patientShellContinuityKey` and `entityContinuityKey`.
- `PatientEmbeddedSessionProjection` binding manifest, release freeze, bridge floor, route-freeze posture, session, and recovery route.
- `PatientEmbeddedNavEligibility` for route-scoped live/read-only/placeholder/recovery/blocked posture.
- Audit records for context resolution, shell policy resolution, session projection, nav eligibility, and SSR hydration binding.

## Trust Resolution Law

Evidence is processed in this order:

1. signed `ChannelContextEvidence`
2. signed `EmbeddedEntryToken`
3. validated SSO handoff state
4. NHS App user-agent marker
5. `from=nhsApp` query hint

Signed evidence and embedded entry tokens must pass TTL, signature, expected route, release cohort, and token replay checks before the request can become `trusted_embedded`. A validated SSO handoff can produce `verified_sso_embedded` but remains fenced by local session, manifest, bridge, continuity, and route-freeze checks.

`from=nhsApp` is presentation-only. A query hint can produce `hinted_embedded` styling posture, but it cannot unlock live actions, bridge grants, downloads, outbound navigation, or embedded CTAs. The same rule applies to user-agent detection: it is evidence, not authority.

## SSR And Hydration

The resolver emits a hydration binding with `rehydrateFromServerOnly: true` and `clientMayRecomputeTrust: false`. If the client sends a hydration context that conflicts with server resolution, the resolver adds `hydration_conflict`, downgrades to `standalone_or_unknown`, returns `bounded_recovery`, and sets the consistency projection to `conflict`.

This closes the SSR/hydration split-brain gap: route components hydrate the server envelope and do not recompute embedded trust from query parameters, user agent, or browser-only state.

## Downgrade Rules

`PatientEmbeddedNavEligibility` is route-scoped. It returns:

- `live` only when context trust is embedded or verified SSO, manifest tuple is current, continuity evidence is trusted, local session is active, bridge capability is verified, required bridge actions are present, and route freeze is not active.
- `read_only` when a trusted embedded session lacks bridge capability or the route is frozen.
- `placeholder_only` for hint-only embedded traffic and inventory routes that need adaptation.
- `recovery_required` for manifest drift, stale bridge capability, missing bridge actions, inactive session, missing session, or degraded continuity.
- `blocked` for invalid evidence, token replay, standalone context, kill switch, or subject-binding failure.

`RouteFreezeDisposition` and manifest drift are surfaced in `PatientEmbeddedSessionProjection` so stale embedded sessions cannot continue showing live actions.

## Same Shell Continuity

The projection preserves both `patientShellContinuityKey` and `entityContinuityKey`. If a patient opens the same entity from a second shell, downstream recovery can compare those keys and keep the user in the same shell or bounded recovery posture rather than creating a second entity session.

## Non-Production Safety

The bridge matrix currently has a deterministic unavailable fallback (`BridgeCapabilityMatrix:future-381-unavailable`) until `381` supplies the real bridge capability runtime. The seed remains local non-production evidence and does not assert an externally approved NHS App integration.
