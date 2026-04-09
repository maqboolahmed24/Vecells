# 12 Workspace Layout And Boundary Rules

The repo baseline now turns the Phase 0 skeleton into an explicit workspace graph: apps and services are thin shells over published domain and contract packages, every bounded context gets one owned package namespace, and generated artifacts live only in explicit `packages/generated/*` lanes.

## Canonical Layout

```text
apps/
  assistive-control/
  clinical-workspace/
  governance-admin/
  hub-desk/
  ops-console/
  patient-web/
  pharmacy-console/
  support-console/
services/
  adapter-simulators/
  api-gateway/
  assurance-worker/
  command-api/
  integration-worker/
  notification-worker/
  projection-worker/
  timer-orchestrator/
packages/
  accessibility-contracts/
  api-contracts/
  authz-policy/
  design-contracts/
  design-system/
  domain-kernel/
  event-contracts/
  fhir-mapping/
  live-channel-contracts/
  migrations/
  observability/
  release-controls/
  runtime-publication/
  test-fixtures/
  domains/
    assistive/
    assurance-and-governance/
    booking/
    callback-messaging/
    foundation-control-plane/
    foundation-identity-access/
    foundation-runtime-experience/
    hub-coordination/
    patient-experience/
    pharmacy/
    platform-configuration/
    runtime-release/
    self-care-admin-resolution/
    staff-support-operations/
    triage-human-checkpoint/
  generated/
    api-clients/
    design-contract-bindings/
    event-bindings/
    live-channel-clients/
    migration-fixtures/
tools/
  analysis/
  codegen/
  dev-bootstrap/
  validators/
infra/
  environments/
ops/
  runbooks/
```

## Package Class Counts

| Package tag class | Count |
| --- | --- |
| app_shell | 8 |
| contract_package | 3 |
| delivery_control_artifact | 2 |
| design_contract_package | 3 |
| domain_context | 15 |
| generated_contract_package | 5 |
| platform_shared_package | 8 |
| service_gateway | 1 |
| service_runtime | 7 |
| tooling_package | 4 |

## Boundary Law

- No app can own truth; browser shells consume generated clients, design contracts, and runtime publication bundles only.
- Services may compose multiple domain packages, but only through published entrypoints and shared contracts.
- Domain packages may depend on the shared kernel and published contracts, never sibling domain internals.
- Generated packages are read-only derivatives with source digests and generator manifests.
- Tools, infra, and ops artifacts may orchestrate delivery but may not silently become runtime truth owners.
