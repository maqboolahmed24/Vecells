# 100 Supply-Chain Provenance, SBOM, and Signature Design

## Intent

`par_100` upgrades the earlier `par_091` provenance baseline into the authoritative supply-chain integrity layer for release publication. The publish path now treats build provenance, SBOM scope, attestation lineage, runtime binding, and runtime-consumption blocking as one coherent contract instead of separate CI sidecars.

## Canonical Record

The canonical record is `BuildProvenanceRecord`, implemented in `/Users/test/Code/V/packages/release-controls/src/supply-chain-provenance.ts` and schema-published in `/Users/test/Code/V/data/analysis/build_provenance_record_schema.json`.

The record binds:

- builder identity, invocation, recipe, environment, and ephemeral worker refs
- artifact digests for the exact promoted artifact set
- base-image, toolchain, dependency-lock, resolved-dependency, parameter-envelope, policy, and runtime-binding material inputs
- one deterministic CycloneDX 1.6 JSON SBOM digest
- one explicit target runtime scope:
  `targetRuntimeManifestRefs`, `targetSurfaceSchemaSetRef`, `targetWorkloadFamilyRefs`, `targetTrustZoneBoundaryRefs`, `targetGatewaySurfaceRefs`, and `targetTopologyTupleHash`
- one attestation chain and one canonical subject digest
- mutable lifecycle state:
  `verificationState` and `runtimeConsumptionState`

The canonical subject digest excludes mutable lifecycle fields so revocation or supersession can append operational history without pretending the artifact tuple itself changed.

## Verification Law

Verification is fail-closed and tuple-bound.

Checks include:

- canonical digest and signature integrity
- attestation presence, subject binding, and signature integrity
- dirty-source rejection
- dependency-policy and gate-evidence success
- SBOM digest continuity
- required material-input completeness
- runtime-binding proof equality against the current `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, and topology tuple
- revocation and supersession lineage

The resulting state machine is:

- `pending -> verified`
- `pending -> quarantined`
- `verified -> revoked`
- `verified -> superseded`
- `quarantined -> verified` is forbidden in place; a fresh record is required

## Formats and Trust Model

`GAP_RESOLUTION_PROVENANCE_FORMAT_CYCLONEDX_JSON_V1`

- SBOM artifact: CycloneDX 1.6 JSON
- attestation artifact: mock-safe DSSE-style HMAC envelope
- canonical runtime binding: deterministic JSON digest over runtime publication, parity, topology tuple, workload families, trust boundaries, and gateway surfaces

`GAP_RESOLUTION_BUILDER_IDENTITY_WORKLOAD_IDENTITY_V1`

- mock-now builder identity is the release-attestation workload
- signing still resolves through `RELEASE_PROVENANCE_SIGNING_KEY_REF`
- production hardening can replace the signing backend without changing record shape or verification rules

## Output Surfaces

Machine-readable:

- `/Users/test/Code/V/data/analysis/build_provenance_record_schema.json`
- `/Users/test/Code/V/data/analysis/provenance_policy_matrix.csv`
- `/Users/test/Code/V/data/analysis/sbom_scope_catalog.json`
- `/Users/test/Code/V/data/analysis/build_provenance_integrity_catalog.json`

Runtime and pipeline:

- `/Users/test/Code/V/tools/release-provenance/run-build-provenance-rehearsal.ts`
- `/Users/test/Code/V/tools/release-provenance/verify-build-provenance.ts`
- `/Users/test/Code/V/tools/release-provenance/promote-build-artifact.ts`

Inspection surface:

- `/Users/test/Code/V/docs/architecture/100_build_provenance_cockpit.html`

## Follow-On Boundary

`FOLLOW_ON_DEPENDENCY_SUPPLY_CHAIN_SURFACE_ASSURANCE_EXPORT_V1`

Later assurance or governance tasks may render richer export flows or attestable evidence packs, but they must consume the `par_100` record, SBOM, policy matrix, and integrity catalog as the source of truth.
