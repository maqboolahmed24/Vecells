# Observability

## Purpose

Published telemetry and trust-slice vocabulary for shells, services, and release controls; never a shadow write model.

## Ownership

- Package: `@vecells/observability`
- Artifact id: `package_observability`
- Owner lane: `Analytics Assurance` (`analytics_assurance`)
- Canonical object families: `31`
- Shared contract families: `2`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/platform-runtime-and-release-blueprint.md#AssuranceSliceTrustRecord`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES, CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY, CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS
- Consumer selectors: packages/domains/\*, packages/release-controls, services/adapter-simulators, services/api-gateway, tools/assistive-control-lab

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/release-controls`

## Forbidden Dependencies

- `apps/* truth writes`
- `packages/domains/* private internals`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Telemetry and trust vocabulary`
- `Continuity and lineage signals`

## Family Coverage

- Dominant kinds: bundle=3, contract=2, descriptor=2, digest=1, gate=1, other=11, projection=5, record=5, tuple=1
- Representative object families: AssistiveCapabilityTrustProjection, AssistiveCapabilityWatchTuple, AssistiveConfidenceDigest, AssistiveContinuityEvidenceProjection, AssistiveIncidentLink, AssistiveProvenanceEnvelope, AuditEvidenceReference, CasePulse, ChannelContextEvidence, ChannelTelemetryPlan, ContinuityOrchestrator, DraftContinuityEvidenceProjection

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
