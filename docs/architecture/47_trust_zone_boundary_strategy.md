# 47 Trust-Zone Boundary Strategy

        `seq_047` hardens seq_046's runtime topology into the exact trust-boundary law that gateway surfaces must consume. The resulting machine-readable boundary pack publishes **20** trust-zone rows: **10** allowed boundaries and **10** fail-closed blocked crossings.

        The gateway pack declares **22** gateway/BFF surfaces across **9** audience candidates, with **20** primary route owners and **3** explicit secondary variants. Browser-visible route coverage is **100%**.

        ## Boundary Law

        - `tz_public_edge` and `tz_shell_delivery` may terminate browser traffic, but only `tz_published_gateway` may bridge browser-facing traffic into compute.
        - `wf_shell_delivery_published_gateway` may call only `wf_projection_read_models`, `wf_command_orchestration`, and, where explicitly declared, `wf_assurance_security_control`.
        - Direct gateway access to `wf_integration_dispatch`, `wf_integration_simulation_lab`, or `wf_data_stateful_plane` is blocked.
        - Tenant transfer, assurance trust transfer, and boundary failure mode are now explicit per crossing rather than implied by service topology.

        ## Trust-Zone Matrix

        | Boundary | State | Source zone | Target zone | Source families | Target families |
        | --- | --- | --- | --- | --- | --- |
        | `tzb_application_core_to_assurance_security` | `allowed` | `tz_application_core` | `tz_assurance_security` | `wf_command_orchestration; wf_projection_read_models` | `wf_assurance_security_control` |
| `tzb_application_core_to_integration_perimeter` | `allowed` | `tz_application_core` | `tz_integration_perimeter` | `wf_command_orchestration` | `wf_integration_dispatch; wf_integration_simulation_lab` |
| `tzb_application_core_to_stateful_data` | `allowed` | `tz_application_core` | `tz_stateful_data` | `wf_command_orchestration; wf_projection_read_models` | `wf_data_stateful_plane` |
| `tzb_assurance_security_to_stateful_data` | `allowed` | `tz_assurance_security` | `tz_stateful_data` | `wf_assurance_security_control` | `wf_data_stateful_plane` |
| `tzb_integration_perimeter_to_assurance_security` | `allowed` | `tz_integration_perimeter` | `tz_assurance_security` | `wf_integration_dispatch; wf_integration_simulation_lab` | `wf_assurance_security_control` |
| `tzb_integration_perimeter_to_stateful_data` | `allowed` | `tz_integration_perimeter` | `tz_stateful_data` | `wf_integration_dispatch; wf_integration_simulation_lab` | `wf_data_stateful_plane` |
| `tzb_public_edge_to_published_gateway` | `allowed` | `tz_public_edge` | `tz_published_gateway` | `wf_public_edge_ingress` | `wf_shell_delivery_published_gateway` |
| `tzb_public_edge_to_shell_delivery` | `allowed` | `tz_public_edge` | `tz_shell_delivery` | `wf_public_edge_ingress` | `wf_shell_delivery_static_publication` |
| `tzb_published_gateway_to_application_core` | `allowed` | `tz_published_gateway` | `tz_application_core` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration; wf_projection_read_models` |
| `tzb_published_gateway_to_assurance_security` | `allowed` | `tz_published_gateway` | `tz_assurance_security` | `wf_shell_delivery_published_gateway` | `wf_assurance_security_control` |
| `block_browser_to_assurance_without_gateway` | `blocked` | `tz_public_edge` | `tz_assurance_security` | `wf_public_edge_ingress` | `wf_assurance_security_control` |
| `block_gateway_to_data` | `blocked` | `tz_published_gateway` | `tz_stateful_data` | `wf_shell_delivery_published_gateway` | `wf_data_stateful_plane` |
| `block_gateway_to_live_integration` | `blocked` | `tz_published_gateway` | `tz_integration_perimeter` | `wf_shell_delivery_published_gateway` | `wf_integration_dispatch` |
| `block_gateway_to_simulator` | `blocked` | `tz_published_gateway` | `tz_integration_perimeter` | `wf_shell_delivery_published_gateway` | `wf_integration_simulation_lab` |
| `block_public_edge_to_command` | `blocked` | `tz_public_edge` | `tz_application_core` | `wf_public_edge_ingress` | `wf_command_orchestration` |
| `block_public_edge_to_data` | `blocked` | `tz_public_edge` | `tz_stateful_data` | `wf_public_edge_ingress` | `wf_data_stateful_plane` |
| `block_public_edge_to_integration` | `blocked` | `tz_public_edge` | `tz_integration_perimeter` | `wf_public_edge_ingress` | `wf_integration_dispatch` |
| `block_public_edge_to_projection` | `blocked` | `tz_public_edge` | `tz_application_core` | `wf_public_edge_ingress` | `wf_projection_read_models` |
| `block_shell_publication_to_command` | `blocked` | `tz_shell_delivery` | `tz_application_core` | `wf_shell_delivery_static_publication` | `wf_command_orchestration` |
| `block_shell_publication_to_projection` | `blocked` | `tz_shell_delivery` | `tz_application_core` | `wf_shell_delivery_static_publication` | `wf_projection_read_models` |

        ## Consequences

        - No hidden browser-reachable service remains. All browser compute resolves through one published gateway surface contract.
        - Gateway surfaces now declare the exact downstream workload families and trust boundaries they may use.
        - Blocked crossings are part of the published contract, not a silent assumption inside network or service code.
