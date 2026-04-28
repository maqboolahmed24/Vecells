
        # 46 Runtime Topology Manifest Strategy

        `seq_046` converts runtime topology into machine-readable law by freezing workload families, trust-zone boundaries, failure domains, and release/publication placeholders in one deterministic contract set.

        ## Outcome

        - Runtime workload family catalog: `9`
        - Runtime workload instances: `59`
        - Environment manifests: `5`
        - Explicit failure domains: `59`
        - Declared blocked browser/runtime crossings: `10`

        ## Environment Manifests

        | Ring | Display | Families | Publication state | Tuple hash |
        | --- | --- | --- | --- | --- |
        | `local` | Local development | 9 | `declared_internal_contract` | `d72ab3af8a8923a4` |
| `ci-preview` | Preview / ephemeral | 9 | `declared_internal_contract` | `57e2b872eedab4e4` |
| `integration` | Integration / staging | 9 | `declared_internal_contract` | `2848305b9a588e0a` |
| `preprod` | Pre-production | 16 | `pending_release_binding` | `94728acd97f0913b` |
| `production` | Production | 16 | `pending_release_binding` | `f2a1a973d6123f1e` |

        ## Canonical Service Placement

        | Service | Runtime family | Family code | Owner context |
        | --- | --- | --- | --- |
        | `service_api_gateway` | `wf_shell_delivery_published_gateway` | `shell_delivery` | `platform_runtime` |
| `service_command_api` | `wf_command_orchestration` | `command` | `platform_runtime` |
| `service_projection_worker` | `wf_projection_read_models` | `projection` | `platform_runtime` |
| `service_notification_worker` | `wf_integration_dispatch` | `integration` | `platform_integration` |
| `service_adapter_simulators` | `wf_integration_simulation_lab` | `integration` | `platform_integration` |

        ## Dependency Fallout Budgets

        | Dependency | Allowed affected families | Explicit spillover block list |
        | --- | --- | --- |
        | `dep_email_notification_provider` | `wf_integration_dispatch` | `wf_assurance_security_control`, `wf_command_orchestration`, `wf_data_stateful_plane`, `wf_integration_simulation_lab` ... |
| `dep_nhs_login_rail` | `wf_command_orchestration`, `wf_shell_delivery_published_gateway` | `wf_assurance_security_control`, `wf_data_stateful_plane`, `wf_integration_dispatch`, `wf_integration_simulation_lab` ... |
| `dep_pds_fhir_enrichment` | `wf_command_orchestration`, `wf_projection_read_models` | `wf_assurance_security_control`, `wf_data_stateful_plane`, `wf_integration_dispatch`, `wf_integration_simulation_lab` ... |
| `dep_sms_notification_provider` | `wf_integration_dispatch` | `wf_assurance_security_control`, `wf_command_orchestration`, `wf_data_stateful_plane`, `wf_integration_simulation_lab` ... |

        ## Runtime Contract Law

        - Browser traffic terminates at `wf_public_edge_ingress`, shell publication, or the published gateway family only.
        - `wf_shell_delivery_published_gateway` is the only browser-addressable compute bridge beyond the edge.
        - `wf_command_orchestration`, `wf_projection_read_models`, `wf_integration_dispatch`, `wf_integration_simulation_lab`, `wf_data_stateful_plane`, and `wf_assurance_security_control` are never directly browser-reachable.
        - `service_adapter_simulators` stays explicit but non-authoritative and is absent from preprod and production manifests.
        - Release approval, channel manifest, and minimum bridge capability refs are placeholders now so later tasks must bind them instead of inventing them.
