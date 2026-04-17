# Support Domain

## Purpose

Canonical package home for the Support bounded context.

## Ownership

- Package: `@vecells/domain-support`
- Artifact id: `package_domains_support`
- Owning context: `Support` (`support`)
- Source contexts covered: self_care_admin_resolution, staff_support_operations
- Canonical object families: `88`
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
- `policyFamilies` (6)
- `projectionFamilies` (15)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: artifact=2, case=1, checkpoint=1, contract=2, descriptor=7, digest=8, grant=1, lease=3, other=32, policy=1, projection=15, record=10, settlement=3, token=2
- Representative families: AdminResolutionActionRecord, AdminResolutionCase, AdminResolutionCompletionArtifact, AdminResolutionDigest, AdminResolutionSubtypeProfile, AdviceAdminReleaseWatch, AdviceBundleVersion, AdviceEligibilityGrant, AdviceFollowUpWatchWindow, AdviceSettlementDigest, AdviceVariantSet, ApprovalReviewFrame

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
