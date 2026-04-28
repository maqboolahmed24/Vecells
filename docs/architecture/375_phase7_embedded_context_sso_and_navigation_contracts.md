# 375 Phase 7 Embedded Context SSO And Navigation Contracts

## Contract Boundary

This pack freezes the `par_375` embedded-channel contract family. It defines trusted embedded context, embedded shell consistency, NHS App SSO bridge fencing, return-intent law, deep-link resolution, site-link metadata, bridge capability floors, navigation contracts, and bridge action leases.

It does not implement the resolver, SSO bridge, deep-link runtime, or bridge wrapper. Those are owned by `par_378`, `par_379`, `par_380`, and `par_381`.

The current release posture remains `open_phase7_with_constraints`. `par_374` froze the route and manifest truth; this pack freezes how an NHS App entry becomes trusted enough to act on that truth.

## Trust Model

`ChannelContext` has four trust tiers:

- `trusted_embedded`: signed `ChannelContextEvidence`, valid `EmbeddedEntryToken`, or successfully validated NHS App SSO handoff is present and current.
- `verified_sso_embedded`: SSO is valid and the request is awaiting or completing local session merge.
- `hinted_embedded`: user-agent markers, bridge-object presence, or query hints suggest NHS App styling, but there is no server-trusted evidence.
- `standalone_or_unknown`: ordinary browser, conflicting signals, expired evidence, or unsupported context.

Query hints such as `from=nhsApp` may request embedded styling or recovery copy only. They never unlock PHI-bearing views, bridge-backed actions, file delivery, mutation, or `trusted_embedded` posture.

The authoritative resolution order is:

1. signed `ChannelContextEvidence` or unexpired `EmbeddedEntryToken`
2. validated NHS App SSO handoff and `SSOEntryGrant`
3. NHS App user-agent markers and client bridge detection
4. query hints
5. safe downgrade to standalone or recovery

If server-side rendering and hydration disagree, the stricter trust tier wins and the shell moves through `RouteFreezeDisposition:nhs-app-freeze-in-place-v1` rather than leaving stale embedded actionability live.

## Embedded Session And Shell

`PatientEmbeddedSessionProjection` is mandatory before any embedded route exposes live actionability. It binds:

- `subjectRef`
- `identityBindingRef`
- `sessionEpochRef`
- `subjectBindingVersionRef`
- `manifestVersionRef`
- `releaseApprovalFreezeRef`
- `channelReleaseFreezeState`
- `minimumBridgeCapabilitiesRef`
- `currentBridgeCapabilityMatrixRef`
- `routeFreezeDispositionRef`
- `experienceContinuityEvidenceRef`
- `eligibilityState`

`PatientEmbeddedNavEligibility` is the route-scoped authority for embedded navigation, native back handling, app-page intents, overlays, external browser handoff, calendar actions, and download actions. Components may not infer capability from user-agent strings, query hints, or raw bridge-object presence.

## SSO Bridge

The SSO bridge family includes:

- `SSOEntryGrant`
- `AuthBridgeTransaction`
- `IdentityAssertionBinding`
- `SessionMergeDecision`
- `ReturnIntent`
- `SSOReturnDisposition`

The raw `assertedLoginIdentity` query value is captured only at the edge or auth gateway, hashed immediately, redacted from the URL, and never written to logs, analytics, referrers, replay tooling, or long-lived storage.

`SSOEntryGrant` is single-redemption under `consumptionFenceEpoch`. Replay, duplicate callback, late return, overlapping callback, expired state, failed nonce, failed PKCE, manifest drift, context drift, or subject mismatch settles into exactly one `SSOReturnDisposition`.

Silent subject merge is forbidden. `IdentityAssertionBinding` mismatch must deny the merge and route to repair or bounded re-entry.

## Deep Links And Site Links

`SiteLinkManifest` and `LinkResolutionAudit` provide launch metadata and audit, but they do not create a second grant model. Deep links, site links, secure links, resumed journeys, and post-auth returns must keep using canonical `AccessGrantService` and `RouteIntentBinding`.

Launch metadata can identify target route, journey step, shell preference, and app environment. Scope, PHI exposure, redemption budget, subject binding, revocation, and mutation authority remain owned by canonical access grants and route-intent law.

## Navigation And Bridge Leases

`NavigationContract` and `BridgeCapabilityMatrix` declare which bridge-backed actions may be attempted for a route. `BridgeActionLease` installs a route-scoped bridge action such as native back behavior, app-page intent, overlay, external browser exit, calendar, or byte download.

A lease remains live only while all of these fences still match:

- `manifestVersionRef`
- `routeFamilyRef`
- `sessionEpochRef`
- `lineageFenceEpoch`
- `selectedAnchorRef`
- `bridgeCapabilityMatrixRef`
- `patientEmbeddedNavEligibilityRef`
- `continuityEvidenceRef`

If any fence drifts, the lease clears and the patient stays in the owning shell through the governed route-freeze disposition.

`OutboundNavigationGrant` remains the only authority for browser overlay, external browser, and app-page handoff. In embedded mode it must also bind `bridgeCapabilityMatrixRef`, `patientEmbeddedNavEligibilityRef`, `manifestVersionRef`, `sessionEpochRef`, `lineageFenceEpoch`, a scrubbed destination, and an explicit return contract.

## Gap Closures

| Gap | Freeze rule |
| --- | --- |
| Query hint equals trusted embedded | query evidence can request styling only; signed evidence or validated SSO is required for trust |
| SSR and hydration disagree | resolution order is fixed and stricter trust wins on conflict |
| Single redemption only in prose | `SSOEntryGrant` has `maxRedemptions = 1`, `consumptionFenceEpoch`, and exact-once callback settlement |
| Asserted identity silently merges to wrong subject | `IdentityAssertionBinding.bindingState = mismatched` forces repair or denied re-entry |
| Stale navigation lease survives shell drift | every `BridgeActionLease` carries route, manifest, session, lineage, capability, eligibility, anchor, and continuity fences |
| Deep links invent a second resume system | `SiteLinkManifest` is launch metadata only; `AccessGrantService` and `RouteIntentBinding` remain authoritative |

## Downstream Handoff

`par_378` must implement context resolution from `ChannelContext`, `ChannelContextEvidence`, `EmbeddedEntryToken`, `ShellPolicy`, `EmbeddedShellConsistencyProjection`, and `PatientEmbeddedNavEligibility`.

`par_379` must implement SSO from `SSOEntryGrant`, `AuthBridgeTransaction`, `IdentityAssertionBinding`, `SessionMergeDecision`, `ReturnIntent`, and `SSOReturnDisposition`.

`par_380` and `par_381` must implement deep-link, bridge, and navigation behavior from `SiteLinkManifest`, `LinkResolutionAudit`, `NavigationContract`, `AppPageIntent`, `BridgeCapabilityMatrix`, `BridgeActionLease`, and embedded `OutboundNavigationGrant` rules.
