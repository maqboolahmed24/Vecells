# 84 Runtime Topology And Trust Boundary Realization

## Trust boundary realization

`TrustZoneBoundary` stays the only legal declaration of cross-plane reachability. `par_084` realizes that law in two machine-readable layers:

- `runtime_topology_manifest.json` now includes `network_foundation`
- `trust_zone_boundary_matrix.csv` expands both declared boundaries and explicitly blocked crossings across every environment ring

The realized boundary classes are:

- declared boundary: legal traffic under workload identity and mTLS-ready posture
- blocked crossing: forbidden path that must fail closed in local emulation and cloud policy

## Boundary enforcement matrix

The boundary matrix publishes, per environment ring:

- source and target trust zones
- source and target workload families
- allowed protocols and workload identities for legal crossings
- the governing egress allowlist ref
- browser path posture
- enforcement refs that tie the rule back to Terraform/OpenTofu modules and local policy

This makes it impossible for browser-accessible families to drift toward `integration`, `data`, or assurance-only controls without a visible contract change.

## Browser exclusion

Browser ingress remains constrained to:

- `wf_public_edge_ingress`
- `wf_shell_delivery_static_publication`
- `wf_shell_delivery_published_gateway`

Everything else is internal-only. The blocked matrix rows make the forbidden paths explicit:

- `block_public_edge_to_command`
- `block_public_edge_to_projection`
- `block_public_edge_to_integration`
- `block_public_edge_to_data`
- `block_gateway_to_live_integration`
- `block_gateway_to_simulator`
- `block_gateway_to_data`

## Follow-on dependencies

The network layer deliberately publishes seams instead of stealing later runtime ownership:

- object storage private endpoints remain with `par_086`
- event bus and durable queue transport remain with `par_087`
- cache and live-update overlays remain with `par_088`
- concrete secret and workload-identity issuance remain with `par_089`
- audience-specific published ingress attachments remain with `par_090`

The result is a concrete trust substrate that later runtime tasks can layer onto without redefining topology law.
