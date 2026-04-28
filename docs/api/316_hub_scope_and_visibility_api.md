# 316 Hub Scope and Visibility API

The 316 backend API is exported from [phase5-acting-context-visibility-kernel.ts](/Users/test/Code/V/packages/domains/hub_coordination/src/phase5-acting-context-visibility-kernel.ts).

## Service factory

- `createPhase5ActingScopeVisibilityService({ repositories?, hubCaseService?, idGenerator? })`

The service can run standalone with the in-memory store or compose an injected 315 `hubCaseService` for production-shaped ownership checks.

## Write-side APIs

- `bootstrapActingContextFromAuthenticatedStaff(input)`
  - Resolves CIS2-backed identity into durable `StaffIdentityContext`, `ActingContext`, and `ActingScopeTuple`.
- `reissueActingContext(input)`
  - Switches organisation, tenant scope, purpose of use, audience tier, or visibility coverage without losing tuple history.
- `requestElevation(input)`
  - Moves `elevationState` to `requested`.
- `grantElevation(input)`
  - Activates or expires elevated acting authority against an explicit expiry time.
- `activateBreakGlass(input)`
  - Requires a reason code and justification, binds the promotion to the current tuple, and records activation audit.
- `revokeBreakGlass(input)`
  - Immediately blocks writable posture and records revocation audit.
- `materializeCurrentCrossOrganisationVisibilityEnvelope(input)`
  - Materializes the current server-side envelope for origin-practice, hub-desk, or servicing-site audiences.

## Read/preflight APIs

- `detectActingScopeDrift(input)`
  - Detects organisation, tenant, environment, policy-plane, purpose-of-use, elevation, break-glass, and visibility drift.
- `applyMinimumNecessaryProjection(visibilityEnvelopeId, projectionFields)`
  - Filters a field map to the exact visible fields allowed by the current envelope.
- `materializeHubCaseAudienceProjection(input)`
  - Builds a flat field record from a `HubCaseBundle` and filters it through the current envelope.
- `validateCurrentHubCommandScope(input)`
  - Returns typed `allowed`, `stale`, or `denied` authority results and appends authority evidence.
- `assertCurrentHubCommandScope(input)`
  - Throws on any non-allowed decision and is intended for command-path preflight.

## Core inputs

`HubCommandAuthorityInput` carries:

- `staffIdentityContextId`
- `actingContextId`
- `commandId`
- `routeId`
- `hubCoordinationCaseId`
- `crossOrganisationVisibilityEnvelopeId`
- `presentedScopeTupleHash`
- `presentedPurposeOfUse`
- `presentedAudienceTierRef`
- `presentedMinimumNecessaryContractRef`
- `expectedOwnershipEpoch`
- `expectedOwnershipFenceToken`
- current environment and policy-plane observations

This is the minimum contract required to close the “role check only” and “late redaction” gaps.
