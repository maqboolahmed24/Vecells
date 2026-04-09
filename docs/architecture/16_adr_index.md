# 16 ADR Index

        ## Mission

        Freeze the Vecells target architecture as one authoritative ADR set plus one coherent architecture-view pack for the current baseline of phases 0-6, 8, and 9.

        ## Freeze Summary

        - Architecture freeze id: `vecells_architecture_freeze_v1`
        - Current baseline: phases 0-6, 8, and 9
        - Deferred baseline: phase 7 embedded NHS App channel
        - ADRs: 16
        - Accepted: 15
        - Deferred: 1
        - Superseded: 0
        - Decision families: 16
        - Contract bindings: 21
        - Views: 6
        - Source digest: `a556a3629e87`

        ## ADR Matrix

        | ADR | Family | Status | Title | Views | Key contracts |
| --- | --- | --- | --- | --- | --- |
| ADR-016-001 | product_shape | accepted | Vecells-first domain truth with FHIR only at the representation boundary | view_system_context, view_domain_runtime_control_plane, view_data_event_storage_integration | FhirRepresentationContract, FhirRepresentationSet, FhirExchangeBundle |
| ADR-016-002 | repository_shape | accepted | Modular pnpm plus Nx monorepo with bounded-context package law | view_container_topology, view_frontend_gateway_design_contract | RuntimePublicationBundle, DesignContractPublicationBundle, AudienceSurfaceRuntimeBinding |
| ADR-016-003 | tenant_acting_scope | accepted | Shared platform with tenant-scoped runtime slices and governed ActingScopeTuple | view_system_context, view_container_topology, view_release_assurance_resilience | ActingScopeTuple, AssuranceSliceTrustRecord, AudienceSurfaceRuntimeBinding |
| ADR-016-004 | runtime_topology | accepted | Dual-UK-region runtime topology with trust zones and browser-to-gateway boundaries | view_system_context, view_container_topology, view_release_assurance_resilience | RuntimeTopologyManifest, GatewayBffSurface, ReleaseWatchTuple |
| ADR-016-005 | gateway_bff | accepted | Audience-specific gateway surfaces with route-family publication instead of one generic BFF | view_system_context, view_container_topology, view_frontend_gateway_design_contract | GatewayBffSurface, FrontendContractManifest, AudienceSurfaceRuntimeBinding |
| ADR-016-006 | state_and_event | accepted | Append-only state transition and event spine with projection-first browser reads | view_domain_runtime_control_plane, view_data_event_storage_integration, view_frontend_gateway_design_contract | CommandSettlementRecord, RouteIntentBinding, RuntimePublicationBundle |
| ADR-016-007 | evidence_and_artifact | accepted | Immutable evidence and artifact pipeline with parity proof, redaction, and mode truth | view_data_event_storage_integration, view_frontend_gateway_design_contract | DesignContractPublicationBundle, AudienceSurfaceRuntimeBinding, ReleasePublicationParityRecord |
| ADR-016-008 | lifecycle_control | accepted | LifecycleCoordinator, route intent, and command settlement are the only legal cross-domain mutation spine | view_domain_runtime_control_plane, view_frontend_gateway_design_contract, view_data_event_storage_integration | LifecycleCoordinator, RouteIntentBinding, CommandSettlementRecord |
| ADR-016-009 | integration | accepted | Integrations remain adapter-seamed, capability-matrix bound, and proof-settled | view_system_context, view_data_event_storage_integration | AdapterContractProfile, CommandSettlementRecord, AssuranceSliceTrustRecord |
| ADR-016-010 | frontend_shell | accepted | Persistent shell law, design-contract publication, and same-shell continuity are core architecture | view_system_context, view_frontend_gateway_design_contract, view_release_assurance_resilience | AudienceSurfaceRuntimeBinding, DesignContractPublicationBundle, FrontendContractManifest |
| ADR-016-011 | release_and_trust | accepted | ReleaseApprovalFreeze and publication tuples freeze writable posture | view_container_topology, view_frontend_gateway_design_contract, view_release_assurance_resilience | ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, RuntimePublicationBundle |
| ADR-016-012 | assurance_and_resilience | accepted | Assurance evidence, readiness, and recovery posture share one operational authority model | view_domain_runtime_control_plane, view_release_assurance_resilience | AssuranceSliceTrustRecord, OperationalReadinessSnapshot, RecoveryControlPosture |
| ADR-016-013 | data_privacy_disclosure | accepted | Data classification, masking, and audit disclosure are runtime disclosure controls, not reporting policy only | view_frontend_gateway_design_contract, view_data_event_storage_integration, view_release_assurance_resilience | VisibilityProjectionPolicy, AudienceSurfaceRuntimeBinding, DesignContractPublicationBundle |
| ADR-016-014 | bounded_assistive | accepted | Assistive capability stays optional, sidecar-bound, human-controlled, and kill-switchable | view_domain_runtime_control_plane, view_release_assurance_resilience | AssuranceSliceTrustRecord, ReleaseRecoveryDisposition |
| ADR-016-015 | architecture_control_plane | accepted | Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane | view_container_topology, view_domain_runtime_control_plane, view_frontend_gateway_design_contract, view_release_assurance_resilience | RouteIntentBinding, DesignContractPublicationBundle, RuntimePublicationBundle |
| ADR-016-016 | deferred_phase7_channel | deferred | Embedded NHS App channel remains deferred and non-authoritative in the current baseline | view_system_context, view_frontend_gateway_design_contract | ChannelReleaseFreezeRecord, AudienceSurfaceRuntimeBinding, ReleaseApprovalFreeze |
