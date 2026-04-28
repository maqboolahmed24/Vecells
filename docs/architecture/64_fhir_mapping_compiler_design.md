# 64 FHIR Mapping Compiler Design

## Outcome

Seq_064 turns the seq_049 contract catalog into a real runtime compiler and append-only persistence seam. Domain aggregates remain authoritative while the compiler materializes replay-safe `FhirRepresentationSet`, `FhirResourceRecord`, and `FhirExchangeBundle` rows only from published `FhirRepresentationContract` definitions.

## Runtime Homes

- Shared package compiler: `packages/fhir-mapping/src/representation-compiler.ts`
- Shared package schemas: `packages/fhir-mapping/schemas/*.schema.json`
- Command API seam: `services/command-api/src/fhir-mapping.ts`
- Persistence migration: `services/command-api/migrations/064_fhir_mapping_compiler.sql`

## Coverage

- Published representation contracts: `13`
- Governing aggregate types: `10`
- Canonical resource types: `8`
- Persistence tables: `4`
- Schemas: `3`

## Compiler Law

- Contracts are validated before runtime use; unsupported resource types, profile drift, or unpublished rows fail closed.
- Deterministic ids and hashes are derived from contract, aggregate ref, aggregate version, and policy refs.
- Replay returns the existing representation set instead of minting silent forks.
- Aggregate version advance supersedes prior set, resource, and bundle rows append-only.
- Adapter consumption is guarded by declared contract refs and allowed bundle types.
