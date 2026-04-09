# 11 Cloud Region And Residency Decision

Vecells now has one explicit UK-hosted region baseline: a provider-neutral dual-region posture with one `uk_primary_region` and one `uk_secondary_region`, shared platform control services, and tenant-scoped runtime and data slices.

## Region Scorecard

| Option | Region posture | Tenant model | Blast radius | Recovery | Auditability | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Single UK region with same-region recovery only | One UK region, backup in the same region, no second live-ready region role. | Shared runtime, shared control plane, shared storage partitions. | 1 | 1 | 2 | rejected |
| Dual UK region, shared control plane, shared runtime | Primary and secondary UK regions with largely shared compute tiers and shared data partitions. | Shared runtime and shared storage partitions with strong logical fences. | 2 | 4 | 3 | rejected |
| Shared control plane and shared runtime with strong tenant isolation | Dual UK region, but tenant work stays inside the same compute fleet. | Shared compute fleet, strict tenant tuple and cache partitioning. | 3 | 4 | 3 | rejected |
| Fully isolated per-tenant deployment baseline | Dual UK regions per tenant with fully isolated runtime stacks. | Per-tenant deploy, per-tenant stores, per-tenant control surfaces. | 5 | 5 | 5 | rejected |
| Hybrid baseline with shared platform services and tenant-scoped runtime/data slices | Dual UK region provider-neutral baseline with one primary and one secondary region role. | Shared edge, shell-delivery, assurance, and release control planes plus tenant-scoped command/projection/data slices. | 5 | 5 | 5 | chosen |

## Environment Ring Binding

| Environment | Allowed regions | Default write region | Notes |
| --- | --- | --- | --- |
| local | local_nonprod | local_nonprod | Local builds may emulate topology but are never production authority. |
| ci-preview | uk_primary_region | uk_primary_region | Ephemeral preview posture in the primary UK role only. |
| integration | uk_primary_region | uk_primary_region | Simulator-backed verification ring before restore rehearsal. |
| preprod | uk_primary_region, uk_secondary_region | uk_primary_region | Restore rehearsal and failover validation ring. |
| production | uk_primary_region, uk_secondary_region | uk_primary_region | Secondary region stays warm and promotable only under declared authority. |

## Residency Rules

- All production, preprod restore, and disaster-recovery data paths stay UK-hosted.
- The local ring may emulate topology but is never authority for production or DR truth.
- Promotion or failover to any non-UK region is outside the baseline and must fail governance review.

## Rejected Alternatives

- Single-region recovery was rejected because it hides disaster-recovery blast radius.
- Fully isolated per-tenant stacks were rejected because they duplicate assurance, release, and simulator controls too aggressively for the current baseline.
- Shared-runtime-only multi-tenant options were rejected because tenant blast radius remains too implicit for support, governance, and release watch posture.
