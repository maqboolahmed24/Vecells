# Operations Domain

## Purpose

Canonical package home for the Operations bounded context.

## Ownership

- Package: `@vecells/domain-operations`
- Artifact id: `package_domains_operations`
- Owning context: `Operations` (`operations`)
- Source contexts covered: staff_support_operations
- Canonical object families: `44`
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
- `aggregateFamilies` (0)
- `domainServiceFamilies` (2)
- `eventFamilies` (0)
- `policyFamilies` (7)
- `projectionFamilies` (4)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=1, descriptor=4, digest=2, gate=4, lease=2, other=17, policy=2, projection=4, record=6, settlement=1, token=1
- Representative families: CohortActionBridge, CohortDriverPath, CohortImpactCellProjection, CohortVisibilityGuard, ContinuityEvidenceDrillPath, DecisionCommitEnvelope, EvidenceDeltaPacket, FallbackReadinessDigest, HealthActionPosture, HealthDrillPath, InterruptionDigestProjection, InventoryComparisonCandidateProjection

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
