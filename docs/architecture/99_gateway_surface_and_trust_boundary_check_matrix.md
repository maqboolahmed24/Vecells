# 99 Gateway Surface And Trust Boundary Check Matrix

This document describes the exact checks published by `par_099` for gateway surfaces, route publications, and browser/runtime bindings.

## Surface Checks

| Check | Input rows | Block code | Why it blocks |
| --- | --- | --- | --- |
| Gateway surface points at the wrong runtime bundle | `gateway_surfaces.runtimePublicationBundleRef` | `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING` | Browser and gateway truth must stay on one published tuple. |
| Gateway surface points at the wrong topology manifest | `gateway_surfaces.runtimeTopologyManifestRef` | `MISSING_MANIFEST_BINDING` | A stale topology ref means publication is no longer source-traceable. |
| Gateway surface references a missing frontend manifest, runtime binding, or surface publication | `frontendContractManifestRef`, `audienceSurfaceRuntimeBindingRef`, `surfacePublicationRef` | `MISSING_MANIFEST_BINDING` | Publication cannot continue when graph members are absent. |
| Gateway surface widens into an undeclared workload family | `allowedDownstreamWorkloadFamilyRefs` | `GATEWAY_TO_UNDECLARED_WORKLOAD` | Downstream family reachability must remain tuple-bounded. |
| Gateway surface crosses an undeclared trust boundary | `trustZoneBoundaryRefs` | `UNDECLARED_TRUST_BOUNDARY_CROSSING` | Cross-zone reachability may not become implicit knowledge. |
| Gateway-required assurance slice is absent from topology | `requiredAssuranceSliceRefs` | `MISSING_MANIFEST_BINDING` | Required assurance proof cannot float outside the topology tuple. |
| Gateway boundary no longer permits downstream service identity | trust-boundary `allowed_identity_refs` versus workload `service_identity_ref` | `UNDECLARED_TRUST_BOUNDARY_CROSSING` | Boundary law applies to identities, not just family names. |

## Route Checks

| Check | Input rows | Block code | Why it blocks |
| --- | --- | --- | --- |
| Route publication points at a missing primary surface | `primaryGatewaySurfaceRef` | `MISSING_MANIFEST_BINDING` | Route intent cannot be evaluated without its authoritative gateway surface. |
| Route tenant mode drifts from the primary gateway surface | `tenantIsolationMode` | `TENANT_ISOLATION_MISMATCH` | Tenant posture must stay exact across route and surface publication. |
| Route widens into an undeclared workload family | `allowedDownstreamWorkloadFamilyRefs` | `GATEWAY_TO_UNDECLARED_WORKLOAD` | Route publication may not expand past the approved topology. |
| Route publication is stale, blocked, or withdrawn | `publicationState` | `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING`, `ROUTE_PUBLICATION_WITHDRAWN` | Writable or reassuring truth may not survive withdrawn route authority. |

## Browser Publication Checks

| Check | Input rows | Block code | Why it blocks |
| --- | --- | --- | --- |
| Frontend manifest points at a stale runtime bundle | `frontendContractManifests.runtimePublicationBundleRef` | `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING` | Browser publication must follow the active tuple exactly. |
| Frontend manifest points at missing surface members | `gatewaySurfaceRef`, `audienceSurfaceRuntimeBindingRef`, `surfacePublicationRef`, `designContractPublicationBundleRef` | `MISSING_MANIFEST_BINDING` | Missing browser graph members are hard publication failures. |
| Audience runtime binding is not `publishable_live` on the active bundle | `audienceSurfaceRuntimeBindings.bindingState` | `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING` | Planned, recovery-only, or stale bindings may not publish as live truth. |
| Surface publication is not `published_exact` on the active bundle | `surfacePublications.publicationState` | `STALE_AUDIENCE_SURFACE_RUNTIME_BINDING` | Browser exposure must fail closed when the publication row drifts. |
| Design publication bundle points at the wrong runtime bundle or topology hash | `designContractPublicationBundles.runtimePublicationBundleRef`, `topologyTupleHash` | `DESIGN_BUNDLE_WRONG_TOPOLOGY_TUPLE` | Design truth must remain bound to the same runtime tuple as the route. |

## Current Repo Posture

The current repo snapshot remains blocked, primarily because gateway surfaces, browser publications, and design bundles still reference planned audience-scoped runtime bundle ids rather than the one authoritative runtime tuple now published by `par_099`. That real blocked snapshot is preserved in `runtime_topology_drift_catalog.json` so the atlas, CI rehearsal, and later governance surfaces all inspect the same drift truth.
