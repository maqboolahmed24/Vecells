# Pharmacy Domain

## Purpose

Canonical package home for the Pharmacy bounded context.

## Ownership

- Package: `@vecells/domain-pharmacy`
- Artifact id: `package_domains_pharmacy`
- Owning context: `Pharmacy` (`pharmacy`)
- Source contexts covered: pharmacy
- Canonical object families: `39`
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
- `aggregateFamilies` (2)
- `domainServiceFamilies` (1)
- `eventFamilies` (0)
- `policyFamilies` (5)
- `projectionFamilies` (4)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: bundle=3, case=1, checkpoint=1, descriptor=2, gate=1, manifest=1, other=9, policy=1, projection=4, record=14, settlement=2
- Representative families: DispatchAdapterBinding, DispatchProofEnvelope, EligibilityExplanationBundle, ManualDispatchAssistanceRecord, OutcomeEvidenceEnvelope, PathwayDefinition, PathwayEligibilityEvaluation, PathwayTimingGuardrail, PharmacyBounceBackRecord, PharmacyCase, PharmacyChoiceDisclosurePolicy, PharmacyChoiceExplanation

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
