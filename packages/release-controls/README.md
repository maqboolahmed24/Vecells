# Release Controls

## Purpose

Single package family for publication tuples, approval freezes, watch posture, and runtime parity law.

## Ownership

- Package: `@vecells/release-controls`
- Artifact id: `package_release_controls`
- Owner lane: `Release Control` (`release_control`)
- Canonical object families: `39`
- Shared contract families: `3`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_SHELLS_TO_RELEASE_CONTROLS, CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS
- Consumer selectors: apps/\*, services/api-gateway, services/notification-worker, tools/assistive-control-lab

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/api-contracts`
- `packages/observability`

## Forbidden Dependencies

- `apps/* release authority`
- `packages/domains/* private internals`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Publication, freeze, and parity controls`
- `Degraded-mode and recovery controls`
- `Assistive release safeguards`

## Family Coverage

- Dominant kinds: bundle=1, contract=4, descriptor=3, digest=1, lease=1, other=13, policy=2, projection=1, record=10, settlement=2, witness=1
- Representative object families: ArtifactFallbackDisposition, ArtifactParityDigest, AssistiveCapabilityRolloutVerdict, AssistiveFreezeDisposition, AssistiveFreezeFrame, AssistiveKillSwitch, AssistiveKillSwitchState, AssistiveReleaseActionRecord, AssistiveReleaseActionSettlement, AssistiveReleaseCandidate, AssistiveReleaseFreezeRecord, AssistiveReleaseState

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
