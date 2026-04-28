
        # 46 Failure Domain And Egress Policy

        Seq_046 closes the gap where failure-domain and egress posture lived only in deployment folklore. The CSV and JSON artifacts now make every workload family declare its blast-radius shape and egress law.

        ## Egress Allowlist Posture

        | Allowlist | Families | Allowed targets | Explicitly blocked targets |
        | --- | --- | --- | --- |
        | `eal_public_edge_internal_only` | `wf_public_edge_ingress` | `wf_shell_delivery_static_publication`, `wf_shell_delivery_published_gateway` | `wf_command_orchestration`, `wf_projection_read_models`, `wf_integration_dispatch`, `wf_data_stateful_plane` |
| `eal_shell_publication_none` | `wf_shell_delivery_static_publication` | none | `wf_command_orchestration`, `wf_projection_read_models`, `wf_integration_dispatch`, `wf_data_stateful_plane` |
| `eal_gateway_internal_only` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration`, `wf_projection_read_models`, `wf_assurance_security_control` | `wf_integration_dispatch`, `wf_integration_simulation_lab`, `wf_data_stateful_plane` |
| `eal_command_to_internal_planes_only` | `wf_command_orchestration` | `wf_data_stateful_plane`, `wf_integration_dispatch`, `wf_integration_simulation_lab`, `wf_assurance_security_control` | `public_internet`, `browser`, `wf_public_edge_ingress` |
| `eal_projection_to_internal_planes_only` | `wf_projection_read_models` | `wf_data_stateful_plane`, `wf_assurance_security_control` | `public_internet`, `wf_integration_dispatch`, `browser` |
| `eal_declared_external_dependencies_only` | `wf_integration_dispatch` | `provider_dependencies_named_in_manifest`, `wf_data_stateful_plane`, `wf_assurance_security_control` | `undeclared_provider_endpoints`, `browser`, `wf_public_edge_ingress` |
| `eal_integration_simulator_internal_only` | `wf_integration_simulation_lab` | `wf_command_orchestration`, `wf_assurance_security_control` | `live_provider_endpoints`, `wf_data_stateful_plane`, `browser` |
| `eal_data_internal_only` | `wf_data_stateful_plane` | none | `browser`, `public_internet`, `provider_endpoints` |
| `eal_assurance_to_internal_planes_only` | `wf_assurance_security_control` | `wf_data_stateful_plane` | `browser`, `provider_endpoints`, `wf_public_edge_ingress` |

        ## Failure Domain Sample

        The full machine-readable inventory is in `data/analysis/runtime_failure_domains.csv`. A representative slice:

        | Failure domain | Family | Ring | Region role | User posture |
        | --- | --- | --- | --- | --- |
        | `fd_local_nonprod_local_public_edge_ingress` | `wf_public_edge_ingress` | `local` | `nonprod_local` | `placeholder_only or blocked` |
| `fd_local_nonprod_local_shell_delivery_static_publication` | `wf_shell_delivery_static_publication` | `local` | `nonprod_local` | `same-shell recovery or read-only` |
| `fd_local_nonprod_local_shell_delivery_published_gateway` | `wf_shell_delivery_published_gateway` | `local` | `nonprod_local` | `same-shell recovery or read-only` |
| `fd_local_nonprod_local_command_orchestration` | `wf_command_orchestration` | `local` | `nonprod_local` | `command_halt_or_named_review` |
| `fd_local_nonprod_local_projection_read_models` | `wf_projection_read_models` | `local` | `nonprod_local` | `summary_only or projection_stale` |
| `fd_local_nonprod_local_integration_dispatch` | `wf_integration_dispatch` | `local` | `nonprod_local` | `queue_only or receipt_review` |
| `fd_local_nonprod_local_integration_simulation_lab` | `wf_integration_simulation_lab` | `local` | `nonprod_local` | `queue_only or receipt_review` |
| `fd_local_nonprod_local_data_stateful_plane` | `wf_data_stateful_plane` | `local` | `nonprod_local` | `restore_only` |
| `fd_local_nonprod_local_assurance_security_control` | `wf_assurance_security_control` | `local` | `nonprod_local` | `diagnostic_visible_controls_frozen` |
| `fd_ci_preview_primary_public_edge_ingress` | `wf_public_edge_ingress` | `ci-preview` | `primary` | `placeholder_only or blocked` |
| `fd_ci_preview_primary_shell_delivery_static_publication` | `wf_shell_delivery_static_publication` | `ci-preview` | `primary` | `same-shell recovery or read-only` |
| `fd_ci_preview_primary_shell_delivery_published_gateway` | `wf_shell_delivery_published_gateway` | `ci-preview` | `primary` | `same-shell recovery or read-only` |

        ## Policy Law

        - Browser-facing families may not egress to providers or raw stores.
        - Live integration dispatch has an explicit provider-neutral allowlist placeholder and cannot widen without later onboarding evidence.
        - Simulator egress is internal-only and never reaches live-provider endpoints.
        - Restore proof, release watch tuple, and assurance slices govern when any warm-standby family may claim live authority.
