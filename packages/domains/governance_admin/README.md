# Governance Admin Domain

## Purpose

Canonical package home for the Governance Admin bounded context.

## Ownership

- Package: `@vecells/domain-governance-admin`
- Artifact id: `package_domains_governance_admin`
- Owning context: `Governance Admin` (`governance_admin`)
- Source contexts covered: assurance_and_governance, platform_configuration
- Canonical object families: `34`
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
- `policyFamilies` (6)
- `projectionFamilies` (1)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=2, checkpoint=1, digest=7, gate=1, other=14, record=8, settlement=1
- Representative families: AccessAdministrationWorkspace, AccessFreezeDisposition, AccessImpactDigest, AdminActionRecord, AdminActionSettlement, BoundedContextImpactDigest, CAPAAction, ChaosExperiment, CommunicationsFreezeDisposition, CommunicationsGovernanceWorkspace, CommunicationsSimulationEnvelope, ConfigBlastRadiusDigest

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
