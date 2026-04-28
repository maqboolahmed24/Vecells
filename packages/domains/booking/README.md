# Booking Domain

## Purpose

Canonical package home for the Booking bounded context.

## Ownership

- Package: `@vecells/domain-booking`
- Artifact id: `package_domains_booking`
- Owning context: `Booking` (`booking`)
- Source contexts covered: booking
- Canonical object families: `33`
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
- `aggregateFamilies` (5)
- `domainServiceFamilies` (0)
- `eventFamilies` (0)
- `policyFamilies` (1)
- `projectionFamilies` (7)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=1, case=1, descriptor=3, other=15, policy=1, projection=7, record=4, settlement=1
- Representative families: AdapterContractProfile, AppointmentManageCommand, AppointmentPresentationArtifact, AppointmentRecord, AssistedBookingSession, BookingCapabilityProjection, BookingCapabilityResolution, BookingCase, BookingContinuityEvidenceProjection, BookingException, BookingExceptionQueue, BookingManageSettlement

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
