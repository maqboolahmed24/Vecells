# 16 System Context and Container Model

        These views freeze the outer system context and the inner workload-family baseline chosen in seq_011.

        ## System Context

                Current baseline serves 20 route families and 22 gateway surfaces through one published gateway layer between browsers and runtime services.

                ### Linked ADRs

                | ADR | Title | Status |
| --- | --- | --- |
| ADR-016-001 | Vecells-first domain truth with FHIR only at the representation boundary | accepted |
| ADR-016-003 | Shared platform with tenant-scoped runtime slices and governed ActingScopeTuple | accepted |
| ADR-016-004 | Dual-UK-region runtime topology with trust zones and browser-to-gateway boundaries | accepted |
| ADR-016-005 | Audience-specific gateway surfaces with route-family publication instead of one generic BFF | accepted |
| ADR-016-009 | Integrations remain adapter-seamed, capability-matrix bound, and proof-settled | accepted |
| ADR-016-010 | Persistent shell law, design-contract publication, and same-shell continuity are core architecture | accepted |
| ADR-016-016 | Embedded NHS App channel remains deferred and non-authoritative in the current baseline | deferred |

                ### Nodes

                | Node | Kind | Primary ADR |
| --- | --- | --- |
| Patient surfaces | audience | ADR-016-010 |
| Clinician and support surfaces | audience | ADR-016-010 |
| Operations and governance surfaces | audience | ADR-016-012 |
| Published gateway surfaces | gateway | ADR-016-005 |
| Vecells runtime core | runtime | ADR-016-001 |
| External dependencies (20) | integration | ADR-016-009 |
| Deferred embedded NHS App channel | deferred | ADR-016-016 |

                ### Edges

                | From | To | Meaning |
| --- | --- | --- |
| sys_patient | sys_gateways | typed browser authority |
| sys_staff | sys_gateways | bounded shells |
| sys_ops | sys_gateways | diagnostic and governance flows |
| sys_gateways | sys_runtime | published contracts only |
| sys_runtime | sys_dependencies | adapter seams and proof settlement |
| sys_deferred | sys_gateways | compatibility seam only |
## Container and Workload Model

                The chosen topology publishes 49 workload families across seven trust zones and routes browser traffic only through public edge and gateway workloads.

                ### Linked ADRs

                | ADR | Title | Status |
| --- | --- | --- |
| ADR-016-002 | Modular pnpm plus Nx monorepo with bounded-context package law | accepted |
| ADR-016-003 | Shared platform with tenant-scoped runtime slices and governed ActingScopeTuple | accepted |
| ADR-016-004 | Dual-UK-region runtime topology with trust zones and browser-to-gateway boundaries | accepted |
| ADR-016-005 | Audience-specific gateway surfaces with route-family publication instead of one generic BFF | accepted |
| ADR-016-011 | ReleaseApprovalFreeze and publication tuples freeze writable posture | accepted |
| ADR-016-015 | Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane | accepted |

                ### Nodes

                | Node | Kind | Primary ADR |
| --- | --- | --- |
| Modular workspace and package graph | repository | ADR-016-002 |
| Public edge | topology | ADR-016-004 |
| Gateway families | gateway | ADR-016-005 |
| Runtime services | runtime | ADR-016-004 |
| Domain, projection, and ledger stores | storage | ADR-016-006 |
| Release and publication control | control | ADR-016-011 |
| Tenant and acting scope | control | ADR-016-003 |
| Watch, readiness, and recovery | control | ADR-016-012 |

                ### Edges

                | From | To | Meaning |
| --- | --- | --- |
| ct_edge | ct_gateway | browser traffic |
| ct_gateway | ct_services | typed contracts |
| ct_services | ct_stores | authoritative writes |
| ct_repo | ct_gateway | published contract packages |
| ct_release | ct_gateway | runtime publication |
| ct_scope | ct_services | acting tuple fences |
| ct_resilience | ct_release | watch and readiness parity |
