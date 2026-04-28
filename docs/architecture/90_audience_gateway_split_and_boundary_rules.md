# 90 Audience Gateway Split And Boundary Rules

## Authority Rules

One `GatewayBffSurface` is the only browser-addressable compute boundary for one audience family or one explicitly justified combined audience shell.

Audience and channel isolation may not be reconstructed from route names alone.

Gateway services may access only declared downstream workload families from the runtime manifest.

Gateway services may not:

- call partner adapters directly
- read raw transactional or FHIR data planes
- expose undeclared reads, mutations, streams, or cache semantics
- widen tenant isolation or session posture inside route-local conditionals

## Split Rules

The audience split in `par_090` is:

- patient web
- clinical workspace
- support workspace
- hub desk
- pharmacy console
- operations console
- governance console

The shared runtime binary is acceptable only because each audience gateway service still publishes its own:

- authority tuple
- route-family set
- entrypoint base path
- downstream workload allowlist
- refusal policy set

## Boundary Matrix Law

`gateway_downstream_boundary_matrix.csv` is authoritative for gateway-to-runtime boundary posture.

Allowed rows cover:

- browser ingress through `tzb_public_edge_to_published_gateway`
- application-core access through `tzb_published_gateway_to_application_core`
- assurance access through `tzb_published_gateway_to_assurance_security`

Blocked rows explicitly publish:

- `GR_090_NO_DIRECT_ADAPTER_EGRESS`
- `GR_090_NO_RAW_DATA_PLANE_ACCESS`

## Refusal Policies

Published refusal policies include:

- `RP_090_UNDECLARED_ROUTE`
- `RP_090_UNDECLARED_DOWNSTREAM`
- `RP_090_DIRECT_ADAPTER_EGRESS`
- `RP_090_RAW_DATA_PLANE_ACCESS`
- `RP_090_UNDECLARED_STREAM`
- `RP_090_UNDECLARED_CACHE`
- `RP_090_SESSION_POLICY_MISMATCH`
- `RP_090_PUBLICATION_BLOCKED`

## Runtime Publication Notes

OpenAPI publication is generated per audience gateway service from the manifest and the API contract registry.

The OpenAPI layer publishes authority and contract binding now; later runtime-publication work will bind these tuples into full `RuntimePublicationBundle` and release parity evidence.
