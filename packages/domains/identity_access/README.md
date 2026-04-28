# Identity Access Domain

## Purpose

Canonical package home for the Identity Access bounded context.

## Ownership

- Package: `@vecells/domain-identity-access`
- Artifact id: `package_domains_identity_access`
- Owning context: `Identity Access` (`identity_access`)
- Source contexts covered: foundation_identity_access
- Canonical object families: `136`
- Versioning posture: `workspace-private domain boundary with explicit public exports`

## Source Refs

- `prompt/044.md`
- `blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor`

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/authz-policy`
- `packages/observability`

## Forbidden Dependencies

- `packages/domains/* sibling internals`
- `apps/*`
- `services/*`
- `packages/design-system`

## Public API

- `ownedObjectFamilies`
- `aggregateFamilies` (11)
- `domainServiceFamilies` (12)
- `eventFamilies` (0)
- `policyFamilies` (13)
- `projectionFamilies` (13)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: aggregate=3, artifact=1, blocker=1, bundle=4, case=2, checkpoint=2, contract=5, descriptor=8, digest=2, gate=3, lease=3, manifest=1, other=35, policy=1, projection=11, record=41, settlement=8, token=2, witness=3
- Representative families: AccessGrantRedemptionRecord, AccessGrantService, AccessGrantSupersessionRecord, AdapterDispatchAttempt, AdapterReceiptCheckpoint, AdminResolutionExperienceProjection, AdminResolutionSettlement, AdviceAdminDependencySet, AdviceRenderSettlement, ArtifactModeTruthProjection, AssistiveCapabilityTrustEnvelope, AssistiveFeedbackChain

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
