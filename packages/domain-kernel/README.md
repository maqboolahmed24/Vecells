# Domain Kernel

## Purpose

Only legal shared-kernel home for canonical identifiers, invariants, and cross-context primitives.

## Ownership

- Package: `@vecells/domain-kernel`
- Artifact id: `package_domain_kernel`
- Owner lane: `Shared Domain Kernel` (`shared_domain_kernel`)
- Canonical object families: `39`
- Shared contract families: `1`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS, CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS, CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL
- Consumer selectors: packages/domains/\*, services/command-api, services/projection-worker

## Allowed Dependencies

- none

## Forbidden Dependencies

- `apps/*`
- `services/*`
- `packages/domains/*`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Foundation primitives and lineage aggregates`

## Family Coverage

- Dominant kinds: aggregate=4, artifact=2, bundle=3, descriptor=2, lease=3, manifest=2, other=17, policy=2, projection=1, record=2, settlement=1
- Representative object families: BinaryArtifactDelivery, BridgeActionLease, BridgeCapabilityMatrix, CLOSE, CallSession, EmbeddedShell, EmbeddedShellConsistencyProjection, Home, HubContinuationLease, IdentityAssertionBinding, IdentityContext, IntakeOutcomePresentationArtifact

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
