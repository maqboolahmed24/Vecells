# Hub Coordination Domain

## Purpose

Canonical package home for the Hub Coordination bounded context.

## Ownership

- Package: `@vecells/domain-hub-coordination`
- Artifact id: `package_domains_hub_coordination`
- Owning context: `Hub Coordination` (`hub_coordination`)
- Source contexts covered: hub_coordination
- Canonical object families: `49`
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
- `domainServiceFamilies` (1)
- `eventFamilies` (0)
- `policyFamilies` (7)
- `projectionFamilies` (9)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: bundle=1, case=1, descriptor=1, other=17, policy=6, projection=9, record=11, settlement=3
- Representative families: ActingContext, AlternativeOfferEntry, AlternativeOfferFallbackCard, AlternativeOfferOptimisationPlan, AlternativeOfferRegenerationSettlement, AlternativeOfferSession, CallbackFallbackRecord, CancellationMakeUpLedger, CoordinationOwnership, CrossOrganisationVisibilityEnvelope, CrossSiteDecisionPlan, EnhancedAccessMinutesLedger

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
