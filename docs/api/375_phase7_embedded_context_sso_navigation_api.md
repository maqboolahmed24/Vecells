# 375 Phase 7 Embedded Context SSO Navigation API

## API Posture

This document freezes the API surface that later runtime tasks must implement. The endpoints are contract targets, not a live API claim.

## Context APIs

### POST `/internal/nhs-app/channel-context:resolve`

Resolves a request into one `ChannelContext`.

Required inputs:

- request URL and route family
- user-agent evidence
- query evidence
- optional signed context evidence
- optional embedded entry token
- optional SSO handoff state

Required behavior:

- evaluate signed context and embedded entry token before user-agent or query hints
- treat query evidence as shell hint only
- return `trustTier`, `resolutionDisposition`, `channelConfidence`, and `ShellPolicy`
- emit `ChannelContextEvidence` and downgrade conflicts through `RouteFreezeDisposition`

### POST `/internal/nhs-app/embedded-session:evaluate`

Materializes `PatientEmbeddedSessionProjection` and `PatientEmbeddedNavEligibility`.

Required behavior:

- require current session, subject, identity binding, manifest version, release approval freeze, bridge capability matrix, route freeze disposition, and continuity evidence
- return `eligibilityState`
- block bridge-backed actions when evidence is missing, stale, conflicting, or hint-only

## SSO APIs

### POST `/internal/nhs-app/sso-entry`

Captures an NHS App entry carrying `assertedLoginIdentity`.

Required behavior:

- hash and redact raw asserted identity immediately
- redirect to the same route without the raw query value
- create one `SSOEntryGrant` with `maxRedemptions = 1`
- create one `AuthBridgeTransaction`
- send `Cache-Control: no-store` and no-referrer protections

### GET `/auth/nhs-app/callback`

Settles the NHS login callback.

Required behavior:

- validate state, nonce, PKCE, issuer, audience, transaction expiry, and single-redemption fence
- re-check manifest, bridge capability, and context fences
- create `IdentityAssertionBinding`
- create `SessionMergeDecision`
- create one `SSOReturnDisposition`
- convert the still-valid `ReturnIntent` into one `RouteIntentBinding`
- deny silent merge on subject mismatch

### POST `/internal/nhs-app/return-intents:validate`

Validates a `ReturnIntent` before redirect.

Required behavior:

- verify session epoch, subject binding version, manifest version, release approval freeze, route family, minimum bridge capability, lineage fence, and continuity evidence
- verify draft resume has not already promoted
- return bounded recovery when any fence drifts

## Link And Navigation APIs

### POST `/internal/nhs-app/site-links:resolve`

Resolves site-link and deep-link launches.

Required behavior:

- load `SiteLinkManifest`
- validate canonical access grant through `AccessGrantService`
- validate `RouteIntentBinding`
- emit `LinkResolutionAudit`
- route to placeholder, summary, or recovery tier when full route authority is not available

### POST `/internal/nhs-app/navigation-contracts:resolve`

Returns the route's `NavigationContract` and allowed bridge actions.

Required behavior:

- load `BridgeCapabilityMatrix`
- require `PatientEmbeddedNavEligibility`
- return only route-allowed bridge methods
- require `OutboundNavigationGrant` for overlay, external browser, and app-page handoff

### POST `/internal/nhs-app/bridge-action-leases`

Installs a route-scoped `BridgeActionLease`.

Required behavior:

- bind manifest, route family, session epoch, lineage fence, selected anchor, bridge matrix, nav eligibility, and continuity evidence
- set short expiry
- clear the lease on route exit, shell transition, manifest drift, session drift, lineage drift, capability drift, eligibility drift, or continuity drift

## Error Codes

| Code                          | Meaning                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `QUERY_HINT_NOT_TRUSTED`      | query hint asked for embedded styling but lacked signed context or valid SSO                     |
| `CHANNEL_CONTEXT_CONFLICT`    | SSR, user-agent, bridge, SSO, or query signals disagree                                          |
| `SSO_ENTRY_REPLAYED`          | `SSOEntryGrant` redemption budget or fence is already consumed                                   |
| `ASSERTED_IDENTITY_REDACTED`  | raw asserted identity was captured and stripped from URL                                         |
| `IDENTITY_ASSERTION_MISMATCH` | asserted identity, NHS login subject, and local subject binding do not agree                     |
| `RETURN_INTENT_DRIFT`         | session, subject, manifest, route, or continuity fence drifted before redirect                   |
| `LINK_GRANT_REQUIRED`         | deep-link metadata attempted to bypass canonical access grant law                                |
| `BRIDGE_LEASE_STALE`          | bridge action lease no longer matches route, session, manifest, capability, or continuity fences |
| `OUTBOUND_GRANT_REQUIRED`     | overlay, external browser, or app-page handoff lacks a current `OutboundNavigationGrant`         |
