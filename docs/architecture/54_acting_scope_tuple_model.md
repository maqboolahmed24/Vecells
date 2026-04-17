# 54 Acting Scope Tuple Model

        The `ActingScopeTuple` is the machine-checkable fence that binds staff identity, acting context, tenant scope, organisation scope, environment, policy plane, purpose-of-use, elevation, break-glass posture, required visibility coverage, runtime binding, trust, and blast radius into one authority row.

        ## Hash semantics

        - `tupleHashAlgorithm = sha256:c14n_json_scope_tuple`
        - The hash covers staff identity ref, acting context ref, scope mode, tenant refs, organisation refs, environment, policy plane, purpose-of-use, elevation state, break-glass state, required visibility coverage refs, required runtime binding refs, required trust refs, and affected counts.
        - Tuple supersession is append-only. Drift does not mutate the old tuple; it writes `ActingContextDriftRecord`, freezes writable posture, and requires a fresh tuple.

        ## Sample tuples

        | Tuple | Scope mode | Tenant count | Organisation count | Tuple hash |
        | --- | --- | --- | --- | --- |
        | `AST_054_CLINICAL_WORKSPACE_V1` | `organisation` | `1` | `1` | `73cad8ba0da50364` |
| `AST_054_PRACTICE_OPS_V1` | `organisation` | `1` | `1` | `d471653722e56084` |
| `AST_054_SUPPORT_WORKSPACE_V1` | `tenant` | `1` | `1` | `5aaca3f4a7c67c3e` |
| `AST_054_SUPPORT_ASSISTED_CAPTURE_V1` | `tenant` | `1` | `1` | `256b580719add154` |
| `AST_054_SUPPORT_REPLAY_V1` | `tenant` | `1` | `1` | `e57a5baa9652c937` |
| `AST_054_HUB_COORDINATION_V1` | `organisation_group` | `1` | `4` | `9a08a8b731f8656b` |
| `AST_054_PHARMACY_SERVICING_V1` | `organisation` | `1` | `1` | `1758717a0359e5bc` |
| `AST_054_OPERATIONS_WATCH_V1` | `multi_tenant` | `4` | `8` | `98bde84ef9eeb71f` |
| `AST_054_GOVERNANCE_PLATFORM_V1` | `platform` | `8` | `32` | `1ab1f4b033de412a` |

        ## Drift and freeze

        | Drift trigger | Same-shell freeze disposition | Fresh tuple required |
        | --- | --- | --- |
        | `organisation_switch` | `stale_recoverable` | `yes` |
| `tenant_scope_change` | `stale_recoverable` | `yes` |
| `environment_change` | `denied_scope` | `yes` |
| `policy_plane_change` | `handoff_only` | `yes` |
| `purpose_of_use_change` | `read_only_same_shell` | `yes` |
| `elevation_expired` | `controls_frozen_same_shell` | `yes` |
| `break_glass_revoked` | `masked_read_only` | `yes` |
| `visibility_contract_drift` | `summary_only` | `yes` |

        ## Route law

        - Any writable governance, support, hub, servicing-site, or cross-organisation route must bind the same current tuple across `AudienceVisibilityCoverage`, `MinimumNecessaryContract`, runtime binding, route intent, and governing object version.
        - Assistive adjunct routes inherit the owner shell tuple and must freeze whenever the owner tuple or rollout cohort drifts.
        - Patient and public routes remain browser-authority-bound rather than staff-tuple-bound, but they still fail closed on runtime, grant, or channel drift.

        ## Source anchors

        - `prompt/054.md`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingContext`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple`
        - `blueprint/phase-0-the-foundation-protocol.md#ActingContextDriftRecord`
        - `blueprint/phase-0-the-foundation-protocol.md#2.6A ActingContextGovernor`
        - `blueprint/phase-0-the-foundation-protocol.md#44D`
        - `blueprint/governance-admin-console-frontend-blueprint.md#1A. GovernanceScopeToken`
