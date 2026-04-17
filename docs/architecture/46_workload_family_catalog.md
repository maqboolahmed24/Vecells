
        # 46 Workload Family Catalog

        The catalog keeps the minimum blueprint family codes (`public_edge`, `shell_delivery`, `command`, `projection`, `integration`, `data`, `assurance_security`) while making the materially different runtime planes explicit.

        ## Family Catalog

        | Runtime family | Family code | Trust zone | Owned services | Tenant mode | Assurance mode | Egress posture |
        | --- | --- | --- | --- | --- | --- | --- |
        | `wf_public_edge_ingress` | `public_edge` | `tz_public_edge` | `svc_public_edge_proxy`, `svc_origin_policy`, `svc_rate_limit` | `tenant_hint_then_runtime_binding` | `consume_release_and_runtime_publication_verdicts` | `eal_public_edge_internal_only` |
| `wf_shell_delivery_static_publication` | `shell_delivery` | `tz_shell_delivery` | `svc_shell_publication_bundle`, `svc_static_asset_delivery` | `publication_bundle_only` | `publication_parity_only` | `eal_shell_publication_none` |
| `wf_shell_delivery_published_gateway` | `shell_delivery` | `tz_published_gateway` | `service_api_gateway` | `route_scoped_session_and_audience_binding` | `surface_authority_tuple_enforced` | `eal_gateway_internal_only` |
| `wf_command_orchestration` | `command` | `tz_application_core` | `service_command_api`, `svc_timer_orchestrator` | `acting_scope_tuple_and_route_intent` | `scoped_mutation_gate_and_assurance_slice_verdicts` | `eal_command_to_internal_planes_only` |
| `wf_projection_read_models` | `projection` | `tz_application_core` | `service_projection_worker` | `tenant_scoped_projection_read` | `projection_freshness_and_release_watch_bound` | `eal_projection_to_internal_planes_only` |
| `wf_integration_dispatch` | `integration` | `tz_integration_perimeter` | `service_notification_worker`, `svc_provider_callback_ingress` | `effect_scope_and_supplier_correlation` | `checkpoint_and_receipt_bound` | `eal_declared_external_dependencies_only` |
| `wf_integration_simulation_lab` | `integration` | `tz_integration_perimeter` | `service_adapter_simulators` | `simulator_seed_and_named_test_tuple_only` | `proof_twin_non_authoritative` | `eal_integration_simulator_internal_only` |
| `wf_data_stateful_plane` | `data` | `tz_stateful_data` | `store_relational_fhir`, `store_projection_read`, `store_object_artifact`, `store_append_only_audit`, `store_cache`, `queue_runtime_bus` | `tenant_tuple_on_every_key_or_record` | `restore_proof_before_live_authority` | `eal_data_internal_only` |
| `wf_assurance_security_control` | `assurance_security` | `tz_assurance_security` | `svc_assurance_supervisor`, `svc_runtime_contract_publisher`, `svc_release_watch_publisher`, `svc_kms_envelope_policy` | `explicit_scope_tuple_or_platform_blast_radius` | `authoritative_assurance_slice_publication` | `eal_assurance_to_internal_planes_only` |

        ## Explicit Split Decisions

        - `wf_shell_delivery_static_publication`: Split from the published gateway because static publication, release freeze linkage, and no-runtime-egress posture differ materially from browser-addressable compute.
- `wf_shell_delivery_published_gateway`: Separated from static shell delivery because differing session policy, tenant isolation, bridge authority, and release-freeze posture would make one combined family unsafe.
- `wf_integration_dispatch`: Split from simulator work because live-provider dispatch has materially different egress, approval, and receipt-settlement posture than the local proof twin backplane.
- `wf_integration_simulation_lab`: Non-authoritative simulator seams stay out of preprod and production because proof-twin behavior must never be misread as live provider confirmation.

        ## Context Runtime Homes

        | Context | Shell home | Primary authority home | Other runtime homes |
        | --- | --- | --- | --- |
        | `patient_experience` | `wf_shell_delivery_published_gateway` | `wf_projection_read_models` | `wf_command_orchestration` |
| `triage_workspace` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration` | `wf_projection_read_models`, `wf_assurance_security_control` |
| `hub_coordination` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration` | `wf_projection_read_models`, `wf_integration_dispatch` |
| `pharmacy` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration` | `wf_projection_read_models`, `wf_integration_dispatch` |
| `support` | `wf_shell_delivery_published_gateway` | `wf_assurance_security_control` | `wf_command_orchestration`, `wf_projection_read_models` |
| `operations` | `wf_shell_delivery_published_gateway` | `wf_assurance_security_control` | `wf_projection_read_models`, `wf_command_orchestration` |
| `governance_admin` | `wf_shell_delivery_published_gateway` | `wf_assurance_security_control` | `wf_command_orchestration`, `wf_projection_read_models` |
| `intake_safety` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration` | `wf_projection_read_models` |
| `identity_access` | `wf_shell_delivery_published_gateway` | `wf_command_orchestration` | `wf_assurance_security_control` |
| `booking` | `none` | `wf_command_orchestration` | `wf_projection_read_models`, `wf_integration_dispatch` |
| `communications` | `none` | `wf_integration_dispatch` | `wf_command_orchestration`, `wf_projection_read_models` |
| `analytics_assurance` | `none` | `wf_assurance_security_control` | `wf_projection_read_models`, `wf_data_stateful_plane` |
| `audit_compliance` | `none` | `wf_assurance_security_control` | `wf_data_stateful_plane` |
| `release_control` | `wf_shell_delivery_static_publication` | `wf_assurance_security_control` | `wf_public_edge_ingress` |
| `platform_runtime` | `wf_public_edge_ingress` | `wf_command_orchestration` | `wf_projection_read_models`, `wf_data_stateful_plane` |
| `platform_integration` | `none` | `wf_integration_dispatch` | `wf_integration_simulation_lab` |
| `shared_domain_kernel` | `none` | `wf_command_orchestration` | `wf_projection_read_models` |
| `shared_contracts` | `wf_shell_delivery_static_publication` | `wf_assurance_security_control` | `wf_command_orchestration`, `wf_projection_read_models`, `wf_integration_dispatch` |
| `design_system` | `wf_shell_delivery_static_publication` | `wf_shell_delivery_static_publication` | none |
| `test_fixtures` | `none` | `wf_integration_simulation_lab` | `wf_projection_read_models` |
| `analysis_validation` | `none` | `wf_assurance_security_control` | `wf_shell_delivery_static_publication` |
| `assistive_lab` | `wf_shell_delivery_published_gateway` | `wf_assurance_security_control` | `wf_command_orchestration` |

        ## Notes

        - The gateway family stays under `family_code = shell_delivery` so the family-code inventory remains compatible with the earlier baseline, while the separate trust zone and workload-family ID make the compute bridge explicit.
        - The simulator family also stays under `family_code = integration`, but only the nonprod rings receive runtime instances for it.
        - Support, operations, governance, analytics, audit, and release now have declared runtime homes instead of implicit sidecar assumptions.
