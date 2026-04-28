# 11 Trust Zone Decision Log

This decision log records the baseline runtime topology choices, the grounded assumptions used to stay provider-neutral, and the residual topology risks carried forward for later infrastructure work.

## Decisions

| Decision | Title | Status | Rationale | Source refs |
| --- | --- | --- | --- | --- |
| DEC_RUNTIME_011_01 | Adopt provider-neutral dual-UK-region roles | accepted | The bootstrap requires UK-hosted cloud infrastructure, and resilience work requires explicit primary and secondary UK roles without speculative vendor SKU names. | blueprint-init.md#12. Practical engineering shape, phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme |
| DEC_RUNTIME_011_02 | Choose hybrid shared platform services with tenant-scoped runtime and data slices | accepted | This keeps release, assurance, and edge controls shared while making tenant blast radius machine-readable in command, projection, and data paths. | platform-runtime-and-release-blueprint.md#Runtime topology contract, phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene |
| DEC_RUNTIME_011_03 | Treat gateway surfaces as explicit per-surface contracts, not one generic BFF | accepted | The blueprint forbids one broad BFF whenever tenant isolation, trust-zone boundary, downstream family set, or recovery profile changes. | platform-runtime-and-release-blueprint.md#GatewayBffSurface |
| DEC_RUNTIME_011_04 | Forbid browser-to-integration direct reachability in the baseline | accepted | Although the runtime blueprint names integration as a downstream family type, this baseline keeps browser routes off the adapter plane to preserve control-plane clarity and validator simplicity. | platform-runtime-and-release-blueprint.md#Runtime rules, platform-runtime-and-release-blueprint.md#AdapterContractProfile |
| DEC_RUNTIME_011_05 | Bind restore and failover authority to resilience tuples, not dashboards | accepted | Restore authority was called out as fragmented; the baseline therefore keeps operations drilldown and resilience controls tuple-bound and gateway-split from general boards. | forensic-audit-findings.md#Finding 112 - restore authority fragmenting across runbooks and dashboards, phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme |
| DEC_RUNTIME_011_06 | Normalize topology drift into published recovery dispositions | accepted | Browser shells, staff workspaces, support replay, and governance controls all keep context but freeze or degrade through the declared recovery contracts rather than generic errors. | phase-0-the-foundation-protocol.md#1.39 ReleaseRecoveryDisposition, forensic-audit-findings.md#Finding 120 - degraded-mode fragmentation across shells and channels |

## Assumptions

| Assumption | Summary | Source refs |
| --- | --- | --- |
| ASSUMPTION_011_01 | Provider-neutral region labels remain the canonical baseline because the repository does not pin a cloud vendor or region code. | blueprint-init.md#12. Practical engineering shape, platform-runtime-and-release-blueprint.md#Runtime topology contract |
| ASSUMPTION_011_02 | The local ring remains `nonprod_local`; all managed production, disaster-recovery, and restore-proof paths stay UK-hosted. | blueprint-init.md#12. Practical engineering shape |
| ASSUMPTION_011_03 | Deferred Phase 7 embedded surfaces and future-optional standalone assistive controls still need topology rows now so later work cannot invent hidden boundaries. | phase-7-inside-the-nhs-app.md, phase-8-the-assistive-layer.md |

## Risks

| Risk | Summary | Source refs |
| --- | --- | --- |
| RISK_011_01 | Exceptional tenancy or regulator demands may still force a later tenant-specific deployment variant, so this baseline keeps that option visible but not default. | phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene |
| RISK_011_02 | Support, operations, and governance surfaces depend on exact tuple refresh discipline; stale local shells would re-open the acting-scope drift defects the forensic audit closed. | forensic-audit-findings.md#Finding 114 - tenant and acting context drift, platform-admin-and-config-blueprint.md#Change control rules |
