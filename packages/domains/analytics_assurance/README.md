# Analytics Assurance Domain

## Purpose

Canonical package home for the Analytics Assurance bounded context.

## Ownership

- Package: `@vecells/domain-analytics-assurance`
- Artifact id: `package_domains_analytics_assurance`
- Owning context: `Analytics Assurance` (`analytics_assurance`)
- Source contexts covered: assurance_and_governance
- Canonical object families: `65`
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
- `aggregateFamilies` (3)
- `domainServiceFamilies` (0)
- `eventFamilies` (0)
- `policyFamilies` (4)
- `projectionFamilies` (2)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=1, bundle=5, case=1, checkpoint=1, descriptor=4, lease=1, manifest=1, other=24, projection=1, record=23, settlement=1, witness=2
- Representative families: ArtifactDependencyLink, AssuranceControlRecord, AssuranceEvidenceGraphEdge, AssuranceEvidenceGraphSnapshot, AssuranceGraphCompletenessVerdict, AssuranceIngestCheckpoint, AssuranceLedgerEntry, AssurancePack, AssurancePackActionRecord, AssurancePackSettlement, AssuranceSliceTrustRecord, AssuranceSurfaceRuntimeBinding

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
