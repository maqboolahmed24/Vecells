# 11 Trust Zone And Workload Family Strategy

The topology baseline defines 7 trust zones and 49 workload rows across the canonical runtime family codes.

## Trust Zones

| Zone | Display name | Browser traffic | Primary controls |
| --- | --- | --- | --- |
| tz_public_edge | Public edge | yes | Origin allowlist, Rate-limit and bot fencing, No PHI assembly, No adapter egress |
| tz_shell_delivery | Shell delivery | yes | RuntimePublicationBundle exact, No mutation or adapter egress, No PHI assembly, Static publication parity only |
| tz_published_gateway | Published gateway | yes | Published GatewayBffSurface only, Route-intent and session policy enforcement, No direct adapter or raw data access, SurfaceAuthorityTupleHash parity |
| tz_application_core | Application core | no | ScopedMutationGate, Projection-first reads, Outbox initiation only, Minimum-necessary query surfaces |
| tz_integration_perimeter | Integration perimeter | no | AdapterContractProfile only, Dependency degradation profiles, Durable checkpoints, Callback idempotency and correlation |
| tz_stateful_data | Stateful data | no | Tenant tuple on every key or stronger scope tuple, Store-class-specific replication policy, No browser reachability, Restore proof before live authority |
| tz_assurance_security | Assurance and security | no | AssuranceSupervisor, RuntimeContractPublisher, Release watch tuple parity, Immutable evidence and trust freeze verdicts |

## Workload Families

| Workload id | Family code | Ring | Region role | Trust zone | Browser reachable |
| --- | --- | --- | --- | --- | --- |
| rwf_local_nonprod_local_public_edge | public_edge | local | nonprod_local | tz_public_edge | yes |
| rwf_local_nonprod_local_shell_delivery | shell_delivery | local | nonprod_local | tz_shell_delivery | yes |
| rwf_local_nonprod_local_command | command | local | nonprod_local | tz_application_core | no |
| rwf_local_nonprod_local_projection | projection | local | nonprod_local | tz_application_core | no |
| rwf_local_nonprod_local_integration | integration | local | nonprod_local | tz_integration_perimeter | no |
| rwf_local_nonprod_local_data | data | local | nonprod_local | tz_stateful_data | no |
| rwf_local_nonprod_local_assurance_security | assurance_security | local | nonprod_local | tz_assurance_security | no |
| rwf_ci_preview_primary_public_edge | public_edge | ci-preview | primary | tz_public_edge | yes |
| rwf_ci_preview_primary_shell_delivery | shell_delivery | ci-preview | primary | tz_shell_delivery | yes |
| rwf_ci_preview_primary_command | command | ci-preview | primary | tz_application_core | no |
| rwf_ci_preview_primary_projection | projection | ci-preview | primary | tz_application_core | no |
| rwf_ci_preview_primary_integration | integration | ci-preview | primary | tz_integration_perimeter | no |
| rwf_ci_preview_primary_data | data | ci-preview | primary | tz_stateful_data | no |
| rwf_ci_preview_primary_assurance_security | assurance_security | ci-preview | primary | tz_assurance_security | no |
| rwf_integration_primary_public_edge | public_edge | integration | primary | tz_public_edge | yes |
| rwf_integration_primary_shell_delivery | shell_delivery | integration | primary | tz_shell_delivery | yes |
| rwf_integration_primary_command | command | integration | primary | tz_application_core | no |
| rwf_integration_primary_projection | projection | integration | primary | tz_application_core | no |
| rwf_integration_primary_integration | integration | integration | primary | tz_integration_perimeter | no |
| rwf_integration_primary_data | data | integration | primary | tz_stateful_data | no |
| rwf_integration_primary_assurance_security | assurance_security | integration | primary | tz_assurance_security | no |
| rwf_preprod_primary_public_edge | public_edge | preprod | primary | tz_public_edge | yes |
| rwf_preprod_primary_shell_delivery | shell_delivery | preprod | primary | tz_shell_delivery | yes |
| rwf_preprod_primary_command | command | preprod | primary | tz_application_core | no |
| rwf_preprod_primary_projection | projection | preprod | primary | tz_application_core | no |
| rwf_preprod_primary_integration | integration | preprod | primary | tz_integration_perimeter | no |
| rwf_preprod_primary_data | data | preprod | primary | tz_stateful_data | no |
| rwf_preprod_primary_assurance_security | assurance_security | preprod | primary | tz_assurance_security | no |
| rwf_preprod_secondary_public_edge | public_edge | preprod | secondary | tz_public_edge | yes |
| rwf_preprod_secondary_shell_delivery | shell_delivery | preprod | secondary | tz_shell_delivery | yes |
| rwf_preprod_secondary_command | command | preprod | secondary | tz_application_core | no |
| rwf_preprod_secondary_projection | projection | preprod | secondary | tz_application_core | no |
| rwf_preprod_secondary_integration | integration | preprod | secondary | tz_integration_perimeter | no |
| rwf_preprod_secondary_data | data | preprod | secondary | tz_stateful_data | no |
| rwf_preprod_secondary_assurance_security | assurance_security | preprod | secondary | tz_assurance_security | no |
| rwf_production_primary_public_edge | public_edge | production | primary | tz_public_edge | yes |
| rwf_production_primary_shell_delivery | shell_delivery | production | primary | tz_shell_delivery | yes |
| rwf_production_primary_command | command | production | primary | tz_application_core | no |
| rwf_production_primary_projection | projection | production | primary | tz_application_core | no |
| rwf_production_primary_integration | integration | production | primary | tz_integration_perimeter | no |
| rwf_production_primary_data | data | production | primary | tz_stateful_data | no |
| rwf_production_primary_assurance_security | assurance_security | production | primary | tz_assurance_security | no |
| rwf_production_secondary_public_edge | public_edge | production | secondary | tz_public_edge | yes |
| rwf_production_secondary_shell_delivery | shell_delivery | production | secondary | tz_shell_delivery | yes |
| rwf_production_secondary_command | command | production | secondary | tz_application_core | no |
| rwf_production_secondary_projection | projection | production | secondary | tz_application_core | no |
| rwf_production_secondary_integration | integration | production | secondary | tz_integration_perimeter | no |
| rwf_production_secondary_data | data | production | secondary | tz_stateful_data | no |
| rwf_production_secondary_assurance_security | assurance_security | production | secondary | tz_assurance_security | no |

## Cross-Zone Boundaries

| Boundary | Source zone | Target zone | Protocols | Tenant transfer mode | Failure mode |
| --- | --- | --- | --- | --- | --- |
| tzb_public_edge_to_shell_delivery | tz_public_edge | tz_shell_delivery | https | tenant_hint_only | static_placeholder_or_cached_shell_only |
| tzb_public_edge_to_published_gateway | tz_public_edge | tz_published_gateway | https, sse, websocket | runtime_binding_and_session_policy_only | same_shell_recovery_or_blocked |
| tzb_published_gateway_to_application_core | tz_published_gateway | tz_application_core | https, grpc, queue_dispatch | tenant_tuple_and_route_intent_preserved | command_halt_or_projection_recovery_only |
| tzb_published_gateway_to_assurance_security | tz_published_gateway | tz_assurance_security | https, grpc | explicit_scope_tuple_or_platform_scope_only | controls_frozen_same_shell_context_preserved |
| tzb_application_core_to_stateful_data | tz_application_core | tz_stateful_data | sql_tls, object_api_tls, queue_tls, cache_tls | tenant_tuple_on_every_key_or_record | read_only_or_blocked_until_restore_proof |
| tzb_application_core_to_integration_perimeter | tz_application_core | tz_integration_perimeter | queue_dispatch, outbox_checkpoint | effect_scope_and_tenant_tuple_preserved | integration_queue_only |
| tzb_application_core_to_assurance_security | tz_application_core | tz_assurance_security | grpc, https, audit_append | tenant_tuple_plus_scope_hash_required | writable_freeze_same_shell_context_preserved |
| tzb_integration_perimeter_to_stateful_data | tz_integration_perimeter | tz_stateful_data | queue_tls, sql_tls, object_api_tls | effect_scope_and_supplier_correlation_only | checkpoint_and_retry_or_dispute |
| tzb_integration_perimeter_to_assurance_security | tz_integration_perimeter | tz_assurance_security | audit_append, https | tenant_tuple_plus_dependency_code_only | slice_degraded_or_queue_only |
| tzb_assurance_security_to_stateful_data | tz_assurance_security | tz_stateful_data | sql_tls, object_api_tls, append_only_api | platform_control_with_explicit_tenant_projection_only | controls_frozen_or_restore_only |

## Non-negotiable Rules

- `data` workloads are never browser-addressable.
- Gateway surfaces may call only their declared command, projection, or assurance families and may not jump directly to raw stores or adapters.
- `TrustZoneBoundary` rows are the only legal source of cross-plane reachability.
