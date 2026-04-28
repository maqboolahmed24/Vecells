# API Contracts

## Purpose

Published browser and runtime contract surface; shells and services must consume this layer instead of sibling package internals.

## Ownership

- Package: `@vecells/api-contracts`
- Artifact id: `package_api_contracts`
- Owner lane: `Shared Contracts` (`shared_contracts`)
- Canonical object families: `221`
- Shared contract families: `3`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_SHELLS_TO_API_CONTRACTS, CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS
- Consumer selectors: apps/\*, services/adapter-simulators, services/api-gateway, services/projection-worker, tools/assistive-control-lab

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/release-controls`

## Forbidden Dependencies

- `apps/* truth owners`
- `services/* deep imports`
- `packages/domains/* private internals`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Browser and runtime surface contracts`
- `Projection and presentation contracts`
- `Assistive and visualization surfaces`

## Family Coverage

- Dominant kinds: artifact=8, bundle=5, checkpoint=4, contract=22, descriptor=25, gate=5, grant=1, lease=6, manifest=5, other=73, policy=9, projection=28, record=24, settlement=5, tuple=1
- Representative object families: AbstentionRecord, AccessibleSurfaceContract, ArtifactExperienceCoordinator, ArtifactModePresentationProfile, ArtifactPresentationContract, ArtifactSurfaceBinding, ArtifactSurfaceContext, ArtifactSurfaceFrame, ArtifactTransferSettlement, AssistiveAnnouncementContract, AssistiveAnnouncementIntent, AssistiveAnnouncementTruthProjection

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
