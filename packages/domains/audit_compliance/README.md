# Audit Compliance Domain

## Purpose

Canonical package home for the Audit Compliance bounded context.

## Ownership

- Package: `@vecells/domain-audit-compliance`
- Artifact id: `package_domains_audit_compliance`
- Owning context: `Audit Compliance` (`audit_compliance`)
- Source contexts covered: assurance_and_governance
- Canonical object families: `6`
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
- `aggregateFamilies` (1)
- `domainServiceFamilies` (0)
- `eventFamilies` (1)
- `policyFamilies` (0)
- `projectionFamilies` (0)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: manifest=1, other=2, record=3
- Representative families: AccessEventIndex, ArchiveManifest, AttestationRecord, AuditQuerySession, BreachRiskRecord, BreakGlassReviewRecord

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
