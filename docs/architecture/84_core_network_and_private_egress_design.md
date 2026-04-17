# 84 Core Network And Private Egress Design

## Cloud and IaC baseline

`ASSUMPTION_IAC_TOOL = terraform_or_opentofu`

The Phase 0 runtime network baseline stays provider-neutral and UK-region-role-aware. `par_084` turns the `seq_046` runtime topology contract into concrete network realization data without rebinding the repository to vendor-specific VPC, firewall, or load-balancer SKU names.

The resulting artifacts live in:

- `data/analysis/runtime_topology_manifest.json`
- `data/analysis/trust_zone_boundary_matrix.csv`
- `data/analysis/private_egress_allowlist_manifest.json`
- `infra/runtime-network/`

Source traceability:

- `docs/architecture/11_cloud_region_and_residency_decision.md#Environment Ring Binding`
- `docs/architecture/11_trust_zone_and_workload_family_strategy.md#Cross-Zone Boundaries`
- `docs/architecture/11_gateway_surface_and_runtime_topology_baseline.md#Browser Boundary Law`
- `blueprint/platform-runtime-and-release-blueprint.md#Runtime topology contract`
- `blueprint/platform-runtime-and-release-blueprint.md#TrustZoneBoundary`

## Network modules

The Terraform/OpenTofu substrate is intentionally provider-neutral:

- `terraform/modules/core_network` publishes region placements, network refs, route domains, and trust-zone membership.
- `terraform/modules/workload_segments` publishes one subnet and network-policy ref per realized runtime workload instance.
- `terraform/modules/private_egress` publishes one default-deny allowlist object per workload family plus one overlay per environment ring.

The design keeps `public_edge`, `shell_delivery`, `command`, `projection`, `integration`, `data`, and `assurance_security` distinct even when later deployment units share hosts or clusters.

## Private egress posture

Every workload family is now bound to one explicit allowlist:

- `wf_public_edge_ingress` may only reach shell delivery and the published gateway.
- `wf_shell_delivery_static_publication` has no runtime egress.
- `wf_shell_delivery_published_gateway` may bridge only to declared command, projection, and assurance families.
- `wf_command_orchestration` and `wf_projection_read_models` remain internal-plane only.
- `wf_integration_dispatch` is the sole family allowed to declare external dependency classes, and even that path remains default-deny until an explicit sandbox or cutover mode is named per environment ring.
- `wf_data_stateful_plane` and `wf_assurance_security_control` remain internal-only and never browser-addressable.

This closes the default-open outbound gap and makes follow-on runtime ownership explicit instead of silently provisioning unrelated resources early.

## Local emulation and cutover seams

Local and CI use the same workload-family vocabulary and trust-boundary law through:

- `infra/runtime-network/local/runtime-network-emulator.compose.yaml`
- `infra/runtime-network/local/network-policy.json`
- `infra/runtime-network/tests/runtime-network-smoke.test.mjs`

Cutover remains bounded:

- `FOLLOW_ON_DEPENDENCY_086_OBJECT_STORAGE_PRIVATE_ENDPOINTS`
- `FOLLOW_ON_DEPENDENCY_087_EVENT_BUS_PRIVATE_DISPATCH`
- `FOLLOW_ON_DEPENDENCY_088_CACHE_LIVE_UPDATE_SEGMENTS`
- `FOLLOW_ON_DEPENDENCY_089_SECRETS_KMS_WORKLOAD_IDENTITY`
- `FOLLOW_ON_DEPENDENCY_090_PUBLISHED_GATEWAY_EDGE_ATTACHMENTS`

`par_084` owns the network seam, not the downstream runtime resource itself.
