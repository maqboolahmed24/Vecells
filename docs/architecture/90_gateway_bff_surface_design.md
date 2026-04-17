# 90 Gateway BFF Surface Design

## Mission

`par_090` provisions audience-specific gateway services for Vecells so browser traffic resolves through one published `GatewayBffSurface` authority chain instead of a generic mega-BFF.

The machine-readable runtime authority now lives in:

- `data/analysis/gateway_surface_manifest.json`
- `data/analysis/audience_route_family_to_gateway_matrix.csv`
- `data/analysis/gateway_downstream_boundary_matrix.csv`

## Design Summary

The gateway runtime keeps one shared binary in `services/api-gateway`, but authority is split into seven audience-scoped gateway services:

- `agws_patient_web`
- `agws_clinical_workspace`
- `agws_support_workspace`
- `agws_hub_desk`
- `agws_pharmacy_console`
- `agws_ops_console`
- `agws_governance_console`

Each gateway service publishes:

- exact `routeFamilyRefs`
- exact `gatewaySurfaceRefs`
- `sessionPolicyRefs`
- `tenantIsolationModes`
- `allowedDownstreamWorkloadFamilyRefs`
- `trustZoneBoundaryRefs`
- `openApiPublicationRef`
- `deploymentDescriptorRef`
- `localBootstrapRef`

The `api-gateway` runtime exposes the authority layer through:

- `GET /authority/surfaces`
- `GET /authority/openapi`
- `POST /authority/evaluate`

## Runtime Rules

`GatewayBffSurface` remains the only browser-addressable compute boundary.

The runtime evaluator fails closed when:

- a route family is undeclared for the selected audience gateway service
- a session policy does not match the published surface
- a downstream workload family is not on the allowlist
- direct adapter egress is requested
- raw data-plane access is requested
- live-channel or cache semantics are not published
- route publication is blocked or missing

## Mock-Now Posture

The current gateway surfaces bind to mock projections, simulator-backed commands, and seeded runtime tuples while preserving the same audience split and refusal posture the live system will require later.

This lets later shell and route implementation work bind to the real gateway boundaries now without redesigning the authority model during cutover.

## Parallel Gaps

The manifest preserves upstream contract gaps rather than guessing through them. The most important new bounded gap is:

- `PARALLEL_INTERFACE_GAP_090_ASSISTIVE_ROUTE_REGISTRY_PENDING`

That gap keeps `rf_assistive_control_shell` visible in the clinical workspace authority graph while blocking publication until the missing route bundle is published by the owning later tracks.

## Source Traceability

Primary source anchors:

- `blueprint/platform-runtime-and-release-blueprint.md#GatewayBffSurface`
- `blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest`
- `blueprint/platform-frontend-blueprint.md#Browser boundary and BFF law`
- `data/analysis/gateway_bff_surfaces.json`
- `data/analysis/frontend_contract_manifests.json`
- `data/analysis/api_contract_registry_manifest.json`
