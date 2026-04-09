# 16 Architecture Decision Matrix

        ## Decision Matrix

        | ADR | Family | Status | Scope | Primary upstream task | Follow-on tasks |
| --- | --- | --- | --- | --- | --- |
| ADR-016-001 | product_shape | accepted | platform | seq_005 | seq_017, seq_019, seq_020, seq_040 |
| ADR-016-002 | repository_shape | accepted | platform | seq_011 | seq_017, seq_019, seq_020, seq_041 |
| ADR-016-003 | tenant_acting_scope | accepted | cross_phase | seq_009 | seq_017, seq_018, seq_019, seq_020 |
| ADR-016-004 | runtime_topology | accepted | platform | seq_011 | seq_017, seq_018, seq_020 |
| ADR-016-005 | gateway_bff | accepted | audience_surface | seq_011 | seq_017, seq_019, seq_020 |
| ADR-016-006 | state_and_event | accepted | cross_phase | seq_007 | seq_017, seq_018, seq_019, seq_020 |
| ADR-016-007 | evidence_and_artifact | accepted | cross_phase | seq_005 | seq_017, seq_018, seq_020 |
| ADR-016-008 | lifecycle_control | accepted | cross_phase | seq_005 | seq_017, seq_019, seq_020 |
| ADR-016-009 | integration | accepted | integration | seq_008 | seq_017, seq_018, seq_040 |
| ADR-016-010 | frontend_shell | accepted | audience_surface | seq_004 | seq_017, seq_019, seq_020 |
| ADR-016-011 | release_and_trust | accepted | release | seq_011 | seq_017, seq_018, seq_020 |
| ADR-016-012 | assurance_and_resilience | accepted | assurance | seq_009 | seq_017, seq_018, seq_020 |
| ADR-016-013 | data_privacy_disclosure | accepted | assurance | seq_008 | seq_017, seq_018, seq_019, seq_020 |
| ADR-016-014 | bounded_assistive | accepted | cross_phase | seq_003 | seq_017, seq_018, seq_020 |
| ADR-016-015 | architecture_control_plane | accepted | cross_phase | seq_011 | seq_017, seq_018, seq_019, seq_020 |
| ADR-016-016 | deferred_phase7_channel | deferred | audience_surface | seq_003 | seq_017, seq_018, seq_020, seq_029, seq_030, seq_040 |

        ## Contract Binding Matrix

        | Contract | Plane | Primary ADR | View | Status |
| --- | --- | --- | --- | --- |
| RuntimeTopologyManifest | runtime_topology | ADR-016-004 | view_container_topology | accepted |
| GatewayBffSurface | gateway_boundary | ADR-016-005 | view_frontend_gateway_design_contract | accepted |
| FrontendContractManifest | browser_authority | ADR-016-005 | view_frontend_gateway_design_contract | accepted |
| AudienceSurfaceRuntimeBinding | browser_authority | ADR-016-010 | view_frontend_gateway_design_contract | accepted |
| DesignContractPublicationBundle | browser_authority | ADR-016-010 | view_frontend_gateway_design_contract | accepted |
| RouteIntentBinding | lifecycle_control | ADR-016-008 | view_domain_runtime_control_plane | accepted |
| CommandSettlementRecord | lifecycle_control | ADR-016-008 | view_data_event_storage_integration | accepted |
| ReleaseApprovalFreeze | release_authority | ADR-016-011 | view_release_assurance_resilience | accepted |
| ChannelReleaseFreezeRecord | release_authority | ADR-016-011 | view_release_assurance_resilience | accepted |
| AssuranceSliceTrustRecord | assurance | ADR-016-012 | view_release_assurance_resilience | accepted |
| ReleaseWatchTuple | release_authority | ADR-016-011 | view_release_assurance_resilience | accepted |
| WaveObservationPolicy | release_authority | ADR-016-011 | view_release_assurance_resilience | accepted |
| OperationalReadinessSnapshot | resilience | ADR-016-012 | view_release_assurance_resilience | accepted |
| RecoveryControlPosture | resilience | ADR-016-012 | view_release_assurance_resilience | accepted |
| RuntimePublicationBundle | publication_control | ADR-016-011 | view_container_topology | accepted |
| ReleasePublicationParityRecord | publication_control | ADR-016-011 | view_frontend_gateway_design_contract | accepted |
| LifecycleCoordinator | lifecycle_control | ADR-016-008 | view_domain_runtime_control_plane | accepted |
| FhirRepresentationContract | data_and_integration | ADR-016-001 | view_data_event_storage_integration | accepted |
| ActingScopeTuple | governed_scope | ADR-016-003 | view_container_topology | accepted |
| VisibilityProjectionPolicy | data_and_disclosure | ADR-016-013 | view_data_event_storage_integration | accepted |
| BuildProvenanceRecord | publication_control | ADR-016-011 | view_release_assurance_resilience | accepted |

        ## Mandatory Closures

        - Freeze scattered baseline decisions into explicit ADRs.
- Treat the Phase 0 control plane as shared programme architecture, not a phase-local convention.
- Keep design-contract publication inside the runtime publication tuple.
- Unify operations and governance continuity and resilience authority.
- Keep the Phase 7 embedded NHS App channel deferred.
- Bound assistive capability as optional and non-central.
- Prevent tenant and acting-scope drift.
- Treat artifact preview and handoff mode truth as contractual runtime truth.
- Prevent patient degraded mode, continuity proof, and shell continuity from becoming route-local behavior.

        ## Gap Register Summary

        | Issue | Status | Severity | Title | ADRs |
| --- | --- | --- | --- | --- |
| GAP_016_SCATTERED_DECISION_FREEZE | resolved | high | Baseline architecture decisions existed only as scattered prior-task prose | ADR-016-001, ADR-016-015 |
| GAP_016_PHASE0_CONTROL_PLANE_LOCALITY | resolved | high | The Phase 0 control plane could still look phase-local | ADR-016-008, ADR-016-011, ADR-016-015 |
| GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT | resolved | high | Design-contract publication could drift outside runtime publication | ADR-016-010, ADR-016-011, ADR-016-015 |
| GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT | resolved | high | Operations and governance continuity and resilience authority were separate mental models | ADR-016-011, ADR-016-012, ADR-016-015 |
| GAP_016_ASSISTIVE_CENTRALITY | resolved | medium | Assistive capability could appear mandatory or architecturally central | ADR-016-014 |
| GAP_016_TENANT_SCOPE_DRIFT | resolved | high | Tenant and acting-scope drift risk remained open | ADR-016-003 |
| GAP_016_ARTIFACT_MODE_TRUTH | resolved | high | Artifact preview and handoff mode truth could remain implementation detail | ADR-016-007, ADR-016-013 |
| GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY | resolved | high | Patient degraded mode, continuity proof, and shell continuity could become route-local | ADR-016-010, ADR-016-012, ADR-016-015 |
| GAP_016_PHASE7_DEFERRED_CHANNEL | deferred | medium | Phase 7 embedded NHS App channel remains outside the current accepted baseline | ADR-016-016 |
| GAP_015_HSM_SIGNING_KEY_PROVISIONING | open | medium | HSM-backed signing keys are still a provisioning seam | ADR-016-011 |
| GAP_015_ALERT_DESTINATION_BINDING | open | medium | Concrete on-call destinations still need tenant and service-owner binding | ADR-016-011, ADR-016-012 |
