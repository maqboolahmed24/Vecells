# FHIR Mapping

## Purpose

Canonical FHIR representation authority for replay-safe clinical persistence, external interchange, partner callback correlation, and audit companion output.

## Ownership

- Package: `@vecells/fhir-mapping`
- Artifact id: `package_fhir_mapping`
- Owner lane: `Shared Contracts` (`shared_contracts`)
- Canonical object families: `4`
- Shared contract families: `2`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract`
- `blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet`
- `blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord`
- `blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle`
- `blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile`
- `prompt/049.md`

## Consumers

- Boundary contracts: `CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING`, `CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES`
- Consumer selectors: `services/adapter-simulators`, `services/projection-worker`

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/domains/* (representation-only entrypoints)`

## Forbidden Dependencies

- `apps/*`
- `services/* raw-store writes`

## Public API

- `foundationFhirMappings`
- `fhirRepresentationContracts`
- `fhirRepresentationSetPolicies`
- `fhirExchangeBundlePolicies`
- `fhirIdentifierPolicies`
- `fhirStatusMappingPolicies`
- `blockedFhirLifecycleOwners`
- `fhirContractCatalog`
- `bootstrapSharedPackage()`

## Contract Families

- `FHIR representation authority`
- `FHIR exchange bundle law`

## Family Coverage

- Active representation contracts: `13`
- Exchange bundle policies: `7`
- Identifier policies: `7`
- Blocked lifecycle owners: `8`

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public exports and that seq_049 contract counts remain aligned with the generated FHIR authority catalogs.
