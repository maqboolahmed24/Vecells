# 54 Tenant Isolation Strategy

        `seq_054` publishes one current tenant-isolation and acting-scope authority model for Vecells. Runtime topology, gateway exposure, browser route authority, purpose-of-use, and blast radius are explicitly bound together instead of being reconstructed from remembered selectors, ambient roles, or detached governance scope.

        ## Summary

        - Tenant isolation modes: 12
        - Runtime-browser authority bindings: 9
        - Route scope requirement rows: 23
        - Broad-scope routes: 5

        ## Isolation modes

        | Mode ID | Tenant isolation mode | Scope modes | Default tenant count | Default organisation count |
        | --- | --- | --- | --- | --- |
        | `TIM_HUB_CROSS_ORG` | `explicit_cross_org_subject_scope` | `organisation_group` | `1` | `4` |
| `TIM_SUPPORT_DELEGATE` | `explicit_support_delegate_scope` | `tenant` | `1` | `1` |
| `TIM_SUPPORT_INVESTIGATION` | `explicit_support_investigation_scope` | `tenant` | `1` | `1` |
| `TIM_ASSISTIVE_ADJUNCT` | `inherited_scope_no_standalone_tenant_widening` | `organisation` | `1` | `1` |
| `TIM_GOVERNANCE_PLATFORM` | `platform_control_plane_with_explicit_blast_radius` | `platform` | `8` | `32` |
| `TIM_OPERATIONS_MULTI_TENANT` | `platform_observation_aggregate` | `multi_tenant` | `4` | `8` |
| `TIM_PHARMACY_SERVICING` | `servicing_site_partition` | `organisation` | `1` | `1` |
| `TIM_PUBLIC_PRE_IDENTITY` | `shared_public_pre_tenant` | `tenant` | `0` | `0` |
| `TIM_TENANT_STAFF_SINGLE_ORG` | `tenant_org_partition` | `organisation` | `1` | `1` |
| `TIM_GRANT_SCOPED_RECOVERY` | `tenant_scoped_lineage_grant` | `tenant` | `1` | `1` |
| `TIM_PATIENT_SELF_SERVICE` | `tenant_scoped_subject` | `tenant` | `1` | `1` |
| `TIM_PATIENT_EMBEDDED` | `tenant_scoped_subject_embedded` | `tenant` | `1` | `1` |

        ## Runtime/browser binding law

        - Runtime topology and browser authority now meet at one generated runtime-browser authority binding for every published audience surface.
        - A route cannot remain writable if tenant isolation, trust-zone boundaries, runtime binding, visibility coverage, minimum-necessary contract, route intent, and governing object version no longer resolve the same tuple.
        - Governance, support, hub, servicing-site, and cross-organisation work require one current `ActingScopeTuple`; governance also requires one current `GovernanceScopeToken`.

        ## Broad-scope surfaces

        - `gws_governance_shell` surfaces `8` tenants and `32` organisations before mutation may settle.
- `gws_hub_case_management` surfaces `1` tenants and `4` organisations before mutation may settle.
- `gws_hub_queue` surfaces `1` tenants and `4` organisations before mutation may settle.
- `gws_operations_board` surfaces `4` tenants and `8` organisations before mutation may settle.
- `gws_operations_drilldown` surfaces `4` tenants and `8` organisations before mutation may settle.

        ## Mandatory gap closures

        - Finding 114 is closed by deriving governance scope tokens, hub work, support replay, and release blast radius from one shared tuple hash.
        - Organisation switching, purpose-of-use drift, environment drift, policy-plane drift, elevation expiry, break-glass revocation, and visibility drift now supersede the tuple and freeze same-shell mutation.
        - Browser surfaces no longer tell a different isolation story than gateways and runtime topology; the route matrix and authority bindings point back to the same tenant-isolation contract.
        - Multi-tenant and platform-scoped work can no longer imply blast radius from a route family name, watch cohort, or dashboard label; affected counts are explicit fields.

        ## Source anchors

        - `prompt/054.md`
        - `blueprint/phase-0-the-foundation-protocol.md#StaffIdentityContext`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple`
        - `blueprint/phase-0-the-foundation-protocol.md#23A`
        - `blueprint/phase-0-the-foundation-protocol.md#23B`
        - `blueprint/phase-0-the-foundation-protocol.md#44D`
        - `blueprint/phase-0-the-foundation-protocol.md#44E`
        - `blueprint/platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest`
        - `blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding`
        - `blueprint/forensic-audit-findings.md#Finding 114`
