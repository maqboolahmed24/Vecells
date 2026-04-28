# FHIR Mapping Contracts

## Purpose

Machine-readable contract artifacts that define how Vecells domain aggregates materialize replay-safe FHIR representations.

## Coverage

- Representation contracts: `13`
- Exchange bundle policies: `7`
- Identifier policies: `7`
- Blocked lifecycle owners: `8`

## Files

- `representation-contracts.json`
- `exchange-bundle-policies.json`
- `identifier-and-status-policies.json`
- `catalog.json`
- `contracts/*.json` per active representation contract

## Law

- Domain aggregates stay authoritative.
- `FhirRepresentationSet` remains the replay atom.
- `FhirExchangeBundle` is the only adapter-boundary payload family.
- Raw payloads and control-plane truth never escape through ad hoc FHIR serializers.
