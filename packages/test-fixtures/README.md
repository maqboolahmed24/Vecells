# Test Fixtures

## Purpose

Shared non-authoritative fixture builders; cannot become a dumping ground for runtime behavior.

## Ownership

- Package: `@vecells/test-fixtures`
- Artifact id: `package_test_fixtures`
- Owner lane: `Test Fixtures` (`test_fixtures`)
- Canonical object families: `0`
- Shared contract families: `1`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `prompt/044.md`
- `data/analysis/import_boundary_rules.json`

## Consumers

- Boundary contracts: CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES
- Consumer selectors: services/adapter-simulators

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/api-contracts`
- `packages/domains/* (public test seams only)`

## Forbidden Dependencies

- `apps/* runtime truth`
- `services/* private internals`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `Contract-safe fixture builders`

## Family Coverage

- Dominant kinds: none; package is contract-only
- Representative object families: none; this package remains non-authoritative

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.
