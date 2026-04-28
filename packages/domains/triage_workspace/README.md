# Triage Workspace Domain

## Purpose

Canonical package home for the Triage Workspace bounded context.

## Ownership

- Package: `@vecells/domain-triage-workspace`
- Artifact id: `package_domains_triage_workspace`
- Owning context: `Triage Workspace` (`triage_workspace`)
- Source contexts covered: triage_human_checkpoint
- Canonical object families: `18`
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
- `policyFamilies` (0)
- `projectionFamilies` (0)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=1, bundle=1, case=1, checkpoint=1, descriptor=2, lease=1, other=5, record=5, settlement=1
- Representative families: BookingIntent, DuplicateReviewSnapshot, InformationRequestWindow, MoreInfoCycle, MoreInfoReminderSchedule, MoreInfoReplyWindowCheckpoint, MoreInfoResponseDisposition, PharmacyIntent, ResponseAssimilationRecord, ReviewBaselineSnapshot, ReviewBundle, ReviewSession

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
