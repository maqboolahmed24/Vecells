# Authz Policy

## Purpose

Published scope, acting-context, and authorization fences; no app may mint local policy truth.

## Ownership

- Package: `@vecells/authz-policy`
- Artifact id: `package_authz_policy`
- Owner lane: `Identity Access` (`identity_access`)
- Canonical object families: `22`
- Shared contract families: `1`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_API_GATEWAY_TO_IDENTITY_POLICY, CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS, CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY
- Consumer selectors: packages/domains/\*, services/api-gateway, services/command-api

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/release-controls`

## Forbidden Dependencies

- `apps/* policy mutations`
- `services/* private domain models`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Acting scope and authorization fences`

## Family Coverage

- Dominant kinds: bundle=1, contract=1, gate=1, grant=4, other=11, record=1, token=2, tuple=1
- Representative object families: AccessGrant, AccessGrantScopeEnvelope, ActingContextGovernor, ActingScopeTuple, ArtifactByteGrant, AssistiveInvocationGrant, AudienceSurfacePublicationRef, AudienceSurfaceRouteContract, AudienceVisibilityCoverage, AuthBridge, AuthBridgeTransaction, AuthScopeBundle

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
