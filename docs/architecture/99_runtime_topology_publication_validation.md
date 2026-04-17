# 99 Runtime Topology Publication Validation

`par_099` turns the `RuntimeTopologyManifest` into a publication gate instead of a documentation-only artifact. The validator walks one graph from the active `RuntimePublicationBundle` to gateway surfaces, route publications, frontend manifests, audience-surface runtime bindings, surface publications, and design publication bundles. Publication now fails closed when any member of that graph stops matching the approved runtime tuple.

## Scope

- Input artifacts:
  - `data/analysis/runtime_topology_manifest.json`
  - `data/analysis/gateway_surface_manifest.json`
  - `data/analysis/frontend_contract_manifests.json`
  - `data/analysis/design_contract_publication_bundles.json`
  - `data/analysis/runtime_publication_bundles.json`
  - `data/analysis/release_publication_parity_records.json`
- Machine-readable outputs:
  - `data/analysis/runtime_topology_publication_matrix.csv`
  - `data/analysis/runtime_topology_drift_catalog.json`
  - `data/analysis/gateway_surface_publication_matrix.json`
- Runtime-control implementation:
  - `packages/release-controls/src/runtime-topology-publication.ts`
  - `tools/runtime-topology-publication/run-runtime-topology-publication-rehearsal.ts`
  - `tools/runtime-topology-publication/verify-runtime-topology-publication.ts`

## Validation Graph

1. Start from the current `RuntimePublicationBundle`.
2. Resolve the approved topology tuple:
   - `runtimeTopologyManifestRef`
   - `topologyTupleHash`
   - declared workload families
   - declared trust-boundary rows
   - declared assurance slices
3. Walk outward to every published gateway surface and route publication.
4. Verify each frontend manifest, audience runtime binding, and surface publication still points at the same runtime bundle.
5. Verify each design publication bundle is still bound to the same runtime bundle and topology tuple.

## Fail-Closed Rules

- Missing refs are blocked as `MISSING_MANIFEST_BINDING`.
- Gateway or route widening outside the tuple is blocked as `GATEWAY_TO_UNDECLARED_WORKLOAD`.
- Trust-boundary drift is blocked as `UNDECLARED_TRUST_BOUNDARY_CROSSING`.
- Route-to-surface tenant mode drift is blocked as `TENANT_ISOLATION_MISMATCH`.
- Planned or stale audience/runtime refs are blocked as `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING`.
- Design publication tuple drift is blocked as `DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE`.
- Withdrawn or blocked route publications are blocked as `ROUTE_PUBLICATION_WITHDRAWN`.

The validator also checks two topology details that earlier artifacts exposed but did not yet enforce:

- Gateway-required assurance slices must exist in the topology manifest.
- Downstream workload service identities must still be permitted by the declared trust-boundary rows.

Those additional checks intentionally map back into the existing blocked categories so pipeline consumers only need one canonical drift vocabulary.

## Mock-Now Execution

- Local and non-production rehearsal run through the same validator core as the pipeline.
- Clean scenarios are published for `local`, `ci-preview`, `integration`, `preprod`, and `production`.
- Intentional drift scenarios cover each canonical blocked category.
- The current repo snapshot is published as a blocked drift record so operators can inspect real drift without mutating the rehearsal scenarios.

## Pipeline Integration

- `pnpm validate:runtime-topology-publication`
- `pnpm ci:rehearse-runtime-topology-publication`
- `pnpm ci:verify-runtime-topology-publication`

These run after runtime publication but before later provenance, governance, and readiness layers consume the tuple. The graph is therefore shared control-plane law, not an optional report.

## Gap Handling

- `GAP_RESOLUTION_TOPOLOGY_ARTIFACT_RUNTIME_PUBLICATION_MATRIX_V1`
  - par_099 publishes one resolved topology-publication matrix instead of leaving tuple membership implicit across separate artifacts.
- `GAP_RESOLUTION_TOPOLOGY_ARTIFACT_DESIGN_TOPOLOGY_BINDING_V1`
  - par_099 derives a topology binding for design bundles without mutating the earlier bundle identity contract.
- `FOLLOW_ON_DEPENDENCY_PARITY_SURFACE_GOVERNANCE_COCKPIT_V1`
  - later governance surfaces may add richer presentation, but they must reuse this exact machine-readable graph and drift law.
