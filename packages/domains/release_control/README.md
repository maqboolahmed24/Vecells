# Release Control Domain

## Purpose

Canonical package home for the Release Control bounded context.

## Ownership

- Package: `@vecells/domain-release-control`
- Artifact id: `package_domains_release_control`
- Owning context: `Release Control` (`release_control`)
- Source contexts covered: runtime_release
- Canonical object families: `29`
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
- `domainServiceFamilies` (0)
- `eventFamilies` (0)
- `policyFamilies` (2)
- `projectionFamilies` (1)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=2, descriptor=3, gate=1, manifest=1, other=13, record=7, settlement=2
- Representative families: AssuranceSliceProbe, BuildProvenanceRecord, EmergencyReleaseException, GovernedControlHandoffBinding, MigrationActionObservationWindow, MigrationActionRecord, MigrationActionSettlement, MigrationExecutionBinding, MigrationExecutionReceipt, MigrationImpactPreview, MigrationPresentationArtifact, MigrationVerificationRecord

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
