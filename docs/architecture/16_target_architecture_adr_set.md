# 16 Target Architecture ADR Set

        ## Baseline

        - Current baseline: phases 0-6, 8, and 9
        - Deferred baseline: phase 7 embedded NHS App channel
        - Non-negotiable rules: 9
        - Mandatory closures: 9

        ## Non-Negotiable Rules

        - No app owns truth.
- No browser or shell talks directly to adapters.
- No child domain directly derives canonical closure.
- No calm or writable posture may outrun the current release, trust, and continuity tuples.
- No external-success transport event becomes business truth without authoritative settlement and proof objects.
- No generic fallback may replace the audience-specific ReleaseRecoveryDisposition.
- No standards, config, publication, runtime, or watch posture may live only in dashboards or prose.
- No route family may claim shell ownership without an explicit ownership contract.
- No supplier-specific booking, hub, pharmacy, telephony, or notification logic may live in the core model.

        ## Accepted and Deferred Decisions

        ## ADR-016-001 Vecells-first domain truth with FHIR only at the representation boundary

                - Family: `product_shape`
                - Status: `accepted`
                - Scope: `platform`
                - Upstream tasks: seq_005, seq_006, seq_013, seq_016
                - Views: view_system_context, view_domain_runtime_control_plane, view_data_event_storage_integration
                - Contracts: FhirRepresentationContract, FhirRepresentationSet, FhirExchangeBundle, RuntimePublicationBundle
                - Requirements: REQ-SRC-phase-0-the-foundation-protocol-md

                **Problem**

                The platform needs one canonical request, lineage, evidence, task, and closure model. If FHIR resources, route payloads, or partner-specific shapes become the hidden write model, state truth fragments across phases and integrations.

                **Decision**

                Freeze the Vecells-first domain model as canonical truth. FHIR remains a governed representation and interchange boundary through FhirRepresentationContract, FhirRepresentationSet, and FhirExchangeBundle, never the internal lifecycle owner.

                **Why Now**

                Tasks 005, 006, and 013 already established lineage, object, and backend runtime law. Seq_016 must stop later work from relitigating canonical truth ownership.

                **Consequences**

                Positive:
                - Canonical closure, lifecycle, and replay behavior remain domain-owned and testable.
- Supplier, channel, and FHIR variance stays outside the core write model.
- Later tasks can trace partner exchange back to one governing aggregate and evidence chain.

                Negative:
                - FHIR mapping and projection code remains an explicit maintenance surface.
- Teams must resist convenience shortcuts that treat partner payloads as domain truth.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-001A_OPTIONAL_PDS_ENRICHMENT_BEHIND_ADAPTER_SEAM`
- `ALT-016-001B_DERIVED_FHIR_REPRESENTATIONS_FOR_INTEROPERABILITY`

                Rejected alternatives:
                - `ALT-016-001R_FHIR_AS_CANONICAL_WRITE_MODEL`
- `ALT-016-001S_CHANNEL_SPECIFIC_REQUEST_MODELS`

                **Validation**

                - Prove FHIR resources are emitted only from the governed representation boundary.
- Reject any design, gateway, or adapter work that writes request truth directly through FHIR payloads.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#0B. Canonical domain kernel and state machine
- forensic-audit-findings.md#Finding 57
- 13_fhir_representation_and_projection_boundary.md
- 05_request_lineage_model.md
- 06_object_catalog.md

                **Notes**

                This ADR freezes the product shape described in the blueprint corpus and prevents later integration work from turning a representation contract into the lifecycle owner.
## ADR-016-002 Modular pnpm plus Nx monorepo with bounded-context package law

                - Family: `repository_shape`
                - Status: `accepted`
                - Scope: `platform`
                - Upstream tasks: seq_011, seq_012, seq_014, seq_016
                - Views: view_container_topology, view_frontend_gateway_design_contract
                - Contracts: RuntimePublicationBundle, DesignContractPublicationBundle, AudienceSurfaceRuntimeBinding
                - Requirements: REQ-OBJ-designcontractpublicationbundle, REQ-INV-059, REQ-INV-061, REQ-CTRL-phase-cards-md-010-extended-summary-layer-alignment, REQ-SRC-vecells-complete-end-to-end-flow-md, GAP-FINDING-118, REQ-CTRL-uiux-skill-md-001-control-priorities

                **Problem**

                The platform spans multiple shells, services, contracts, and control-plane packages. If repository shape follows framework convenience or app ownership, sibling contexts will reach through one another and hidden truth owners will emerge.

                **Decision**

                Freeze the repository as a modular pnpm plus Nx monorepo. Bounded-context packages, published contracts, design-contract packages, and generated artifacts remain the only legal cross-context integration surfaces.

                **Why Now**

                Tasks 011-015 already depend on the workspace graph and boundary rules. Seq_016 turns that baseline into architecture law for all later implementation work.

                **Consequences**

                Positive:
                - Cross-context truth remains machine-checkable through import rules and code owners.
- Typed contracts, design contracts, and release publication artifacts can be generated and verified consistently.

                Negative:
                - Teams must work within stricter package boundaries and explicit publication points.
- Nx graph and export-map discipline become mandatory developer workflow requirements.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-002A_GENERATED_ARTIFACTS_UNDER_PACKAGES_GENERATED`
- `ALT-016-002B_TOOLING_ONLY_PYTHON_UNDER_TOOLS_ANALYSIS`

                Rejected alternatives:
                - `ALT-016-002R_POLYREPO_PER_SURFACE`
- `ALT-016-002S_FRAMEWORK_SLICED_DIRECTORY_OWNERSHIP`

                **Validation**

                - Fail CI when apps or services import sibling domain internals.
- Keep generated artifacts derivative-only and traceable to source contract digests.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#0A. Delivery skeleton and repository architecture
- 12_monorepo_build_system_decision.md
- 12_workspace_layout_and_boundary_rules.md
- 12_import_boundary_and_codeowners_policy.md

                **Notes**

                This ADR codifies the baseline already chosen in seq_012 and keeps repo topology aligned with no-app-owns-truth and design-contract publication law.
## ADR-016-003 Shared platform with tenant-scoped runtime slices and governed ActingScopeTuple

                - Family: `tenant_acting_scope`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_009, seq_011, seq_015, seq_016
                - Views: view_system_context, view_container_topology, view_release_assurance_resilience
                - Contracts: ActingScopeTuple, AssuranceSliceTrustRecord, AudienceSurfaceRuntimeBinding
                - Requirements: REQ-OBJ-actingcontextgovernor, REQ-INV-023, REQ-INV-044, REQ-TEST-phase-4-the-booking-engine-md-007, REQ-TEST-phase-8-the-assistive-layer-md-115, REQ-TEST-phase-9-the-assurance-ledger-md-139, REQ-TEST-phase-9-the-assurance-ledger-md-017, REQ-TEST-phase-9-the-assurance-ledger-md-116

                **Problem**

                Vecells needs tenant isolation without losing shared platform economics and cross-organisation operations. Ambient session scope, route prefixes, or role names cannot safely represent blast radius.

                **Decision**

                Freeze the runtime as a shared platform with tenant-scoped runtime and data slices. All cross-organisation, support, governance, and elevated actions must bind an explicit ActingScopeTuple backed by StaffIdentityContext and ActingContext.

                **Why Now**

                Seq_011 established the runtime model and seq_009 plus forensic Finding 114 established the governance drift risk. Seq_016 must make tuple-bound scope non-optional.

                **Consequences**

                Positive:
                - Blast radius, purpose-of-use, and elevation become machine-checkable rather than ambient UI posture.
- Governance, support, and cross-organisation work can remain same-shell while still freezing drifted tuples.

                Negative:
                - Operators must refresh or reissue scope tuples when organisation, purpose, or elevation changes.
- Some convenience cross-tenant workflows remain blocked until exact tuple coverage is published.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-003A_PUBLIC_PATIENT_FLOWS_WITHOUT_ACTING_SCOPE_TUPLES`
- `ALT-016-003B_SINGLE_TENANT_ACTIONS_WITH_EXACT_SCOPE_HASHES`

                Rejected alternatives:
                - `ALT-016-003R_SESSION_ROLE_NAME_AS_SCOPE`
- `ALT-016-003S_PLATFORM_WIDE_AMBIENT_MUTATION_SCOPE`

                **Validation**

                - Require exact tuple hashes on governance, support, hub, and cross-organisation actions.
- Freeze writable posture when scope tuples or visibility coverage drift.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#StaffIdentityContext
- phase-0-the-foundation-protocol.md#ActingScopeTuple
- forensic-audit-findings.md#Finding 114 - Tenant and acting context could still drift between governance scope and live cross-organisation work
- 11_tenant_model_and_acting_scope_strategy.md
- 11_gateway_surface_and_runtime_topology_baseline.md

                **Notes**

                Patient public intake remains a valid non-tuple posture, but any privileged or cross-tenant surface must bind the full tuple.
## ADR-016-004 Dual-UK-region runtime topology with trust zones and browser-to-gateway boundaries

                - Family: `runtime_topology`
                - Status: `accepted`
                - Scope: `platform`
                - Upstream tasks: seq_011, seq_013, seq_015, seq_016
                - Views: view_system_context, view_container_topology, view_release_assurance_resilience
                - Contracts: RuntimeTopologyManifest, GatewayBffSurface, ReleaseWatchTuple, OperationalReadinessSnapshot
                - Requirements: REQ-INV-040, REQ-INV-045, REQ-INV-054, REQ-CTRL-phase-4-the-booking-engine-md-006-booking-surface-control-priorities, REQ-TEST-phase-4-the-booking-engine-md-122, REQ-TEST-phase-7-inside-the-nhs-app-md-016, REQ-TEST-phase-7-inside-the-nhs-app-md-033, REQ-TEST-phase-7-inside-the-nhs-app-md-049

                **Problem**

                The runtime needs UK residency, predictable failover, and strict trust-zone behavior. Allowing browsers, shells, or public edges to infer or bypass internal topology would break the residency, release, and resilience model.

                **Decision**

                Freeze the runtime topology as a dual-UK-region shared platform with trust zones, published gateway surfaces, and no browser reachability beyond the public edge and declared gateway workloads.

                **Why Now**

                Seq_011 already selected the topology. Seq_016 must make its trust-zone and egress law authoritative before implementation begins.

                **Consequences**

                Positive:
                - UK residency, trust zones, and failover posture are explicit and consistent across teams.
- Gateway and browser law remains aligned with release, continuity, and resilience tuples.

                Negative:
                - All egress and callback paths must use the declared workload families and outbox discipline.
- Secondary-region promotion requires stricter parity and readiness evidence than ad hoc infrastructure failover.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-004A_REGION_LOCAL_NON_AUTHORITATIVE_CACHE`
- `ALT-016-004B_SECONDARY_REGION_WARM_STANDBY_WITH_EXACT_PROMOTION_GATES`

                Rejected alternatives:
                - `ALT-016-004R_SINGLE_REGION_NO_FAILOVER`
- `ALT-016-004S_BROWSER_DIRECT_TO_DOMAIN_OR_ADAPTER`

                **Validation**

                - Verify every browser-callable route resolves through a published gateway surface.
- Fail release when topology, publication parity, or resilience tuples drift.

                **Source Refs**

                - platform-runtime-and-release-blueprint.md#Runtime topology contract
- platform-runtime-and-release-blueprint.md#RuntimeTopologyManifest
- 11_cloud_region_and_residency_decision.md
- 11_trust_zone_and_workload_family_strategy.md
- 11_region_resilience_and_failover_posture.md

                **Notes**

                This ADR formalizes the runtime posture already selected in seq_011 and keeps the public edge, trust zones, and egress law visible in every later phase.
## ADR-016-005 Audience-specific gateway surfaces with route-family publication instead of one generic BFF

                - Family: `gateway_bff`
                - Status: `accepted`
                - Scope: `audience_surface`
                - Upstream tasks: seq_011, seq_014, seq_015, seq_016
                - Views: view_system_context, view_container_topology, view_frontend_gateway_design_contract
                - Contracts: GatewayBffSurface, FrontendContractManifest, AudienceSurfaceRuntimeBinding, ReleaseRecoveryDisposition
                - Requirements: REQ-OBJ-audiencesurfaceruntimebinding, REQ-INV-044, REQ-INV-059, REQ-INV-061, REQ-INV-062, REQ-CTRL-phase-1-the-red-flag-gate-md-001-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-001-control-priorities, REQ-TEST-phase-4-the-booking-engine-md-018

                **Problem**

                Vecells exposes multiple shells, trust postures, and recovery behaviors. A single generic BFF or framework-hidden server boundary would blur route authority and mix audience contracts.

                **Decision**

                Freeze route-family and audience-specific published gateway surfaces. Browsers consume FrontendContractManifest and GatewayBffSurface publications, not framework-local server actions or direct service calls.

                **Why Now**

                Seq_014 selected the browser runtime and route-family split. Seq_016 needs to turn that published surface split into architecture law.

                **Consequences**

                Positive:
                - Browser authority, gateway responsibility, and release recovery posture remain explicit.
- Different audiences can diverge safely in trust posture without restitching hidden server logic.

                Negative:
                - The platform maintains more published gateway surfaces than a single-BFF design.
- Route-family changes require synchronized contract publication and parity checks.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-005A_ROUTE_FAMILY_SPLIT_WITH_TYPED_CLIENTS`
- `ALT-016-005B_SUMMARY_ONLY_RECOVERY_VIA_RELEASE_RECOVERY_DISPOSITION`

                Rejected alternatives:
                - `ALT-016-005R_ONE_GENERIC_BFF`
- `ALT-016-005S_FRAMEWORK_OWNED_SERVER_ACTION_BOUNDARIES`

                **Validation**

                - Block direct browser-to-adapter or browser-to-domain calls.
- Keep every route family inside the current FrontendContractManifest and AudienceSurfaceRuntimeBinding tuple.

                **Source Refs**

                - platform-runtime-and-release-blueprint.md#GatewayBffSurface
- platform-runtime-and-release-blueprint.md#FrontendContractManifest
- 14_gateway_bff_pattern_and_surface_split.md
- 14_shell_and_route_runtime_architecture.md

                **Notes**

                This ADR closes the temptation to hide mutating or trust-bearing behavior in framework routing.
## ADR-016-006 Append-only state transition and event spine with projection-first browser reads

                - Family: `state_and_event`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_007, seq_013, seq_014, seq_016
                - Views: view_domain_runtime_control_plane, view_data_event_storage_integration, view_frontend_gateway_design_contract
                - Contracts: CommandSettlementRecord, RouteIntentBinding, RuntimePublicationBundle
                - Requirements: REQ-OBJ-conversationsubthreadprojection, REQ-OBJ-conversationthreadprojection, REQ-OBJ-projectionfreshnessenvelope, REQ-OBJ-projectionsubscription, REQ-OBJ-adminresolutionexperienceprojection, REQ-OBJ-artifactmodetruthprojection, REQ-OBJ-bookingconfirmationtruthprojection, REQ-OBJ-commandsettlementrecord

                **Problem**

                The platform must survive replay, retries, partner callbacks, and shell refreshes without letting direct table reads or optimistic UI state become canonical truth.

                **Decision**

                Freeze append-only domain events, durable outbox and inbox handling, idempotent commands, and projection-first browser reads. CommandSettlementRecord, not local optimistic state, is the authoritative post-submit outcome bridge.

                **Why Now**

                Seq_007 and seq_013 already defined the machine and backend baseline. Seq_016 must bind the state spine to shell, gateway, and release authority.

                **Consequences**

                Positive:
                - Replay, callback repair, and projection rebuild stay deterministic across phases.
- Browser state remains explainable through projections and command settlement instead of stale local caches.

                Negative:
                - Teams must maintain read models, settlement envelopes, and replay-safe dedupe strategies.
- User-visible updates may remain locally acknowledged but not authoritative until settlement or projection catches up.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-006A_READ_MODELS_REBUILT_FROM_EVENT_SPINE`
- `ALT-016-006B_PENDING_OR_REVIEW_SETTLEMENT_WITH_SAME_SHELL_RECOVERY`

                Rejected alternatives:
                - `ALT-016-006R_DIRECT_TABLE_READS_AS_BROWSER_TRUTH`
- `ALT-016-006S_TRANSPORT_ACK_AS_BUSINESS_SUCCESS`

                **Validation**

                - Require durable outbox or queue positions for consequential mutations.
- Require CommandSettlementRecord or command-following projection truth before user-visible finality.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#RequestLifecycleLease
- phase-0-the-foundation-protocol.md#CommandSettlementRecord
- 13_event_spine_and_namespace_baseline.md
- 13_outbox_inbox_callback_replay_and_idempotency.md
- 07_state_machine_atlas.md

                **Notes**

                This ADR covers the event spine, state machine atlas, and browser truth law in one frozen decision.
## ADR-016-007 Immutable evidence and artifact pipeline with parity proof, redaction, and mode truth

                - Family: `evidence_and_artifact`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_005, seq_010, seq_013, seq_016
                - Views: view_data_event_storage_integration, view_frontend_gateway_design_contract
                - Contracts: DesignContractPublicationBundle, AudienceSurfaceRuntimeBinding, ReleasePublicationParityRecord
                - Requirements: REQ-OBJ-artifactsurfaceframe

                **Problem**

                The platform handles cross-channel evidence, transcripts, artifacts, and patient-safe summaries. If raw uploads, previews, or handoff copies become mutable or route-local, safety and disclosure drift.

                **Decision**

                Freeze immutable EvidenceCaptureBundle, EvidenceDerivationPackage, EvidenceRedactionTransform, EvidenceSummaryParityRecord, and artifact-mode truth as runtime contracts. Artifact preview, handoff, and constrained-channel posture must resolve through published contracts, not implementation detail.

                **Why Now**

                Seq_010 fixed classification and seq_013 fixed storage boundaries. Seq_016 now binds evidence, redaction, and artifact posture into architecture law.

                **Consequences**

                Positive:
                - Safety review, dispute resolution, and patient-safe copies all trace back to immutable evidence.
- Artifact posture remains consistent across shells, exports, and constrained channels.

                Negative:
                - The evidence pipeline carries more explicit objects and parity checks.
- Surfaces may degrade to summary-only or handoff-ready posture when parity or disclosure proof drifts.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-007A_SUMMARY_ONLY_ARTIFACT_POSTURE_WHEN_PARITY_OR_DISCLOSURE_DRIFTS`
- `ALT-016-007B_CHANNEL_SPECIFIC_ARTIFACT_EXPOSURE_ONLY_THROUGH_PUBLISHED_POLICY`

                Rejected alternatives:
                - `ALT-016-007R_MUTABLE_UPLOADS_OR_SUMMARIES_AS_TRUTH`
- `ALT-016-007S_ROUTE_LOCAL_ARTIFACT_MODE_LABELS`

                **Validation**

                - Prove every user-visible summary or artifact copy can cite the current parity and redaction contract.
- Fail closed when artifact posture is not reachable from the current runtime publication tuple.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#EvidenceCaptureBundle
- phase-0-the-foundation-protocol.md#EvidenceSummaryParityRecord
- phase-0-the-foundation-protocol.md#VisibilityProjectionPolicy
- forensic-audit-findings.md#Finding 115 - Artifact preview and handoff still lacked one live mode-truth contract for constrained channels
- 10_data_classification_model.md
- 13_storage_and_persistence_baseline.md

                **Notes**

                The architecture now treats artifact mode truth as a cross-phase contract, not a frontend rendering choice.
## ADR-016-008 LifecycleCoordinator, route intent, and command settlement are the only legal cross-domain mutation spine

                - Family: `lifecycle_control`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_005, seq_007, seq_013, seq_016
                - Views: view_domain_runtime_control_plane, view_frontend_gateway_design_contract, view_data_event_storage_integration
                - Contracts: LifecycleCoordinator, RouteIntentBinding, CommandSettlementRecord
                - Requirements: REQ-OBJ-commandsettlementrecord, REQ-OBJ-requestclosurerecord, REQ-OBJ-routeintentbinding, REQ-OBJ-lifecyclecoordinator, REQ-INV-012, REQ-INV-025, REQ-INV-035, REQ-INV-036

                **Problem**

                Without one lifecycle authority, child domains or routes can directly write Request.workflowState, derive closure, or widen mutation scope from stale local context.

                **Decision**

                Freeze LifecycleCoordinator as the sole cross-domain lifecycle owner. Every post-submit mutation must bind a live RouteIntentBinding, settle through CommandActionRecord and CommandSettlementRecord, and leave request-level closure or reopen decisions to the coordinator.

                **Why Now**

                Forensic Findings 91 and the earlier booking, hub, pharmacy, and triage findings already forced this separation. Seq_016 makes it architecture law rather than a pattern hidden in phase prose.

                **Consequences**

                Positive:
                - Canonical closure and governed reopen behavior become consistent across booking, hub, pharmacy, messaging, and support paths.
- Stale or ambiguous mutations can recover in place instead of mutating the wrong object.

                Negative:
                - Mutation pathways must carry more explicit target-tuple, settlement, and fence metadata.
- Legacy convenience CTAs that cannot emit exact route intent remain recovery-only until replaced.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-008A_CHILD_DOMAINS_EMIT_MILESTONES_ONLY`
- `ALT-016-008B_SAME_SHELL_RECOVERY_ON_STALE_ROUTE_INTENT`

                Rejected alternatives:
                - `ALT-016-008R_CHILD_DOMAIN_DIRECT_REQUEST_STATE_WRITES`
- `ALT-016-008S_URL_OR_LOCAL_CACHE_AS_MUTATION_AUTHORITY`

                **Validation**

                - Reject writable routes without a live RouteIntentBinding.
- Reject any path where a child domain writes canonical request closure directly.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#LifecycleCoordinator
- phase-0-the-foundation-protocol.md#RequestClosureRecord
- phase-0-the-foundation-protocol.md#RouteIntentBinding
- phase-0-the-foundation-protocol.md#CommandSettlementRecord
- forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions
- forensic-audit-findings.md#Findings 48-50

                **Notes**

                LifecycleCoordinator and settlement law are what prevent route-local shortcuts from becoming platform truth.
## ADR-016-009 Integrations remain adapter-seamed, capability-matrix bound, and proof-settled

                - Family: `integration`
                - Status: `accepted`
                - Scope: `integration`
                - Upstream tasks: seq_008, seq_013, seq_015, seq_016
                - Views: view_system_context, view_data_event_storage_integration
                - Contracts: AdapterContractProfile, CommandSettlementRecord, AssuranceSliceTrustRecord
                - Requirements: REQ-OBJ-adapterdispatchattempt, REQ-OBJ-adapterreceiptcheckpoint, REQ-OBJ-bookingprovideradapterbinding, REQ-OBJ-pharmacycorrelationrecord, REQ-INV-005, REQ-INV-008, REQ-INV-025, REQ-CTRL-phase-4-the-booking-engine-md-003-booking-surface-control-priorities

                **Problem**

                Identity, telephony, messaging, booking, hub, and pharmacy integrations vary by tenant and supplier. If supplier logic leaks into the core model or transport success is treated as business success, the platform loses deterministic truth and safe degraded behavior.

                **Decision**

                Freeze integrations behind adapter contracts, supplier capability matrices, and proof-based settlement. Transport acknowledgements, weak provider receipts, or mailbox delivery alone never become business truth.

                **Why Now**

                Seq_008 and seq_013 already chose adapter seams and proof discipline. Seq_016 must make them the only legal integration baseline before external provisioning work begins.

                **Consequences**

                Positive:
                - The core model stays stable while tenant capability variance remains explicit at the edge.
- Degraded and recovery behavior can be expressed consistently across partner types.

                Negative:
                - Adapter and proof objects add latency and more explicit asynchronous state.
- Some partner flows remain pending or reconciliation-required for longer before patient-final reassurance is legal.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-009A_SUPPLIER_VARIANCE_BEHIND_DECLARED_ADAPTER_PROFILES`
- `ALT-016-009B_OPTIONAL_PDS_ENRICHMENT_THROUGH_NON_AUTHORITATIVE_ADAPTER`

                Rejected alternatives:
                - `ALT-016-009R_SUPPLIER_SPECIFIC_CORE_MODEL_BRANCHES`
- `ALT-016-009S_TRANSPORT_SUCCESS_EQUALS_BUSINESS_SETTLEMENT`

                **Validation**

                - Require authoritative proof state or settlement object before route-final or patient-final truth is published.
- Keep supplier-specific capability branches out of shared kernel and lifecycle ownership code.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#FhirExchangeBundle
- phase-0-the-foundation-protocol.md#PharmacyCorrelationRecord
- 08_external_dependency_inventory.md
- 08_dependency_truth_and_fallback_matrix.md
- 13_async_workflow_timer_and_effect_processing.md
- 13_outbox_inbox_callback_replay_and_idempotency.md

                **Notes**

                This ADR covers every current baseline integration while leaving future provisioning work for later roadmap tasks.
## ADR-016-010 Persistent shell law, design-contract publication, and same-shell continuity are core architecture

                - Family: `frontend_shell`
                - Status: `accepted`
                - Scope: `audience_surface`
                - Upstream tasks: seq_004, seq_010, seq_014, seq_016
                - Views: view_system_context, view_frontend_gateway_design_contract, view_release_assurance_resilience
                - Contracts: AudienceSurfaceRuntimeBinding, DesignContractPublicationBundle, FrontendContractManifest, RouteIntentBinding
                - Requirements: REQ-OBJ-audiencesurfaceruntimebinding, REQ-OBJ-designcontractpublicationbundle, REQ-INV-044, REQ-INV-059, REQ-INV-061, REQ-INV-062, REQ-CTRL-phase-1-the-red-flag-gate-md-001-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-001-control-priorities

                **Problem**

                Shell continuity, selected anchors, artifact posture, and DOM contract markers can still drift into route-local behavior if they are treated as frontend styling rather than architecture.

                **Decision**

                Freeze the frontend architecture as persistent shells governed by ShellContinuityFrame, ContinuityFrame, ContinuityTransitionCheckpoint, ShellBoundaryDecision, and published DesignContractPublicationBundle plus AudienceSurfaceRuntimeBinding tuples.

                **Why Now**

                Seq_014 chose the shell runtime, while forensic Findings 107-120 proved that continuity proof and degraded posture must stay cross-phase. Seq_016 makes that law explicit.

                **Consequences**

                Positive:
                - Shell continuity, degraded posture, and automation markers remain stable across all current baseline surfaces.
- Frontend runtime and release posture stay synchronized through published design-contract bundles.

                Negative:
                - Route families must carry explicit shell ownership claims and DOM contract markers.
- Mixed token exports, stale design digests, or missing lint verdicts now force visible downgrade instead of permissive rendering.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-010A_SAME_SHELL_OBJECT_SWITCH_WITH_EXACT_CHECKPOINTS`
- `ALT-016-010B_SUMMARY_ONLY_OR_RECOVERY_ONLY_POSTURE_WHEN_PUBLICATION_DRIFTS`

                Rejected alternatives:
                - `ALT-016-010R_ROUTE_LOCAL_SHELL_OWNERSHIP`
- `ALT-016-010S_UNPUBLISHED_TOKEN_OR_MARKER_VOCABULARY`

                **Validation**

                - Keep every writable or calmly trustworthy surface bound to current design and runtime publication tuples.
- Preserve same-shell recovery rather than hard navigation when continuity proof is still valid.

                **Source Refs**

                - platform-frontend-blueprint.md#0.2 Continuity key and shell law
- platform-frontend-blueprint.md#1. Required experience topology and primitives
- platform-frontend-blueprint.md#12A. The active DesignContractPublicationBundle and DesignContractLintVerdict must remain current
- forensic-audit-findings.md#Findings 107-120
- 14_shell_and_route_runtime_architecture.md
- 14_design_system_and_contract_publication_strategy.md

                **Notes**

                Frontend architecture is treated as cross-phase law, not an app-local implementation preference.
## ADR-016-011 ReleaseApprovalFreeze and publication tuples freeze writable posture

                - Family: `release_and_trust`
                - Status: `accepted`
                - Scope: `release`
                - Upstream tasks: seq_011, seq_014, seq_015, seq_016
                - Views: view_container_topology, view_frontend_gateway_design_contract, view_release_assurance_resilience
                - Contracts: ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, RuntimePublicationBundle, ReleasePublicationParityRecord, ReleaseWatchTuple, WaveObservationPolicy
                - Requirements: REQ-OBJ-channelreleasefreezerecord, REQ-OBJ-releaseapprovalfreeze, REQ-OBJ-releaserecoverydisposition, REQ-OBJ-runtimepublicationbundle, REQ-EDGE-RELEASE-CHANNEL-TRUST-FENCE, REQ-INV-038, REQ-INV-048, REQ-CTRL-phase-1-the-red-flag-gate-md-002-control-priorities

                **Problem**

                Compiled artifacts, route contracts, design contracts, and recovery posture can drift if release authority is reduced to CI status or dashboard interpretation.

                **Decision**

                Freeze release authority around ReleaseApprovalFreeze, ChannelReleaseFreezeRecord, RuntimePublicationBundle, ReleasePublicationParityRecord, ReleaseWatchTuple, WaveObservationPolicy, and audience-specific ReleaseRecoveryDisposition.

                **Why Now**

                Seq_015 selected the release tooling baseline and forensic Findings 91 and 95 proved the gap. Seq_016 makes publication and trust tuples architectural rather than operational folklore.

                **Consequences**

                Positive:
                - Writable and calm posture freeze automatically when release, parity, or trust tuples drift.
- Operations and governance read the same release tuple that shells and gateways enforce.

                Negative:
                - Release promotion now depends on stricter parity, provenance, and publication evidence.
- Stale or missing audience-specific recovery dispositions block permissive fallbacks.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-011A_AUDIENCE_SPECIFIC_RELEASE_RECOVERY_DISPOSITIONS`
- `ALT-016-011B_WATCH_AND_PUBLICATION_PARITY_IN_ONE_RELEASE_TUPLE`

                Rejected alternatives:
                - `ALT-016-011R_CI_GREEN_EQUALS_RUNTIME_AUTHORITY`
- `ALT-016-011S_GENERIC_FALLBACK_POSTURE_FOR_ALL_AUDIENCES`

                **Validation**

                - Require exact publication parity and passing provenance before live writable posture.
- Reject any generic fallback that does not cite the current audience-specific ReleaseRecoveryDisposition.

                **Source Refs**

                - phase-0-the-foundation-protocol.md#ReleaseApprovalFreeze
- phase-0-the-foundation-protocol.md#ChannelReleaseFreezeRecord
- phase-0-the-foundation-protocol.md#RuntimePublicationBundle
- phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding
- platform-runtime-and-release-blueprint.md#ReleaseWatchTuple
- platform-runtime-and-release-blueprint.md#WaveObservationPolicy
- 15_release_and_supply_chain_tooling_baseline.md
- forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight

                **Notes**

                This ADR is what binds release tooling outputs back into runtime truth and browser authority.
## ADR-016-012 Assurance evidence, readiness, and recovery posture share one operational authority model

                - Family: `assurance_and_resilience`
                - Status: `accepted`
                - Scope: `assurance`
                - Upstream tasks: seq_009, seq_011, seq_015, seq_016
                - Views: view_domain_runtime_control_plane, view_release_assurance_resilience
                - Contracts: AssuranceSliceTrustRecord, OperationalReadinessSnapshot, RecoveryControlPosture, ReleaseWatchTuple
                - Requirements: REQ-OBJ-assuranceslicetrustrecord, REQ-OBJ-operationalreadinesssnapshot, REQ-OBJ-recoverycontrolposture, REQ-OBJ-resilienceactionrecord, REQ-OBJ-resilienceactionsettlement, REQ-OBJ-resiliencesurfaceruntimebinding, REQ-OBJ-restorerun, REQ-OBJ-supportreplayrestoresettlement

                **Problem**

                Operations, governance, and resilience surfaces can drift into separate mental models if runbooks, dashboards, and evidence packs are treated as loosely related references.

                **Decision**

                Freeze assurance and resilience authority around AssuranceSliceTrustRecord, OperationalReadinessSnapshot, RecoveryControlPosture, ResilienceActionSettlement, and shared release-watch tuple consumption across operations and governance.

                **Why Now**

                Seq_009 and seq_015 already defined the workstreams and tooling. Seq_016 must close the residual split identified in Findings 95 and 104-120.

                **Consequences**

                Positive:
                - Restore, failover, chaos, and cross-programme assurance use one tuple-bound authority model.
- Operations and governance boards can stay informative under drift without pretending to remain action-authoritative.

                Negative:
                - Recovery actions now require fresher readiness, runbook, and settlement evidence.
- Some diagnostic surfaces remain visible but control-frozen more often under degraded trust posture.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-012A_DIAGNOSTIC_VISIBILITY_WITH_FROZEN_CONTROLS_WHEN_POSTURE_DRIFTS`
- `ALT-016-012B_EVIDENCE_GRAPH_AS_THE_ONLY_ADMISSIBILITY_BACKBONE`

                Rejected alternatives:
                - `ALT-016-012R_RUNBOOKS_AND_DASHBOARDS_AS_LIVE_AUTHORITY`
- `ALT-016-012S_OPS_AND_GOVERNANCE_WITH_SEPARATE_CONTINUITY_MODELS`

                **Validation**

                - Block restore or failover actions when RecoveryControlPosture is stale, blocked, or diagnostic-only.
- Require operations and governance views to consume the same trust and readiness tuples.

                **Source Refs**

                - phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts
- phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme
- phase-0-the-foundation-protocol.md#OperationalReadinessSnapshot
- phase-0-the-foundation-protocol.md#RecoveryControlPosture
- forensic-audit-findings.md#Findings 104-120
- 09_regulatory_workstreams.md
- 15_operational_readiness_and_resilience_tooling.md

                **Notes**

                This ADR explicitly closes the split between operational diagnosis and authoritative resilience control.
## ADR-016-013 Data classification, masking, and audit disclosure are runtime disclosure controls, not reporting policy only

                - Family: `data_privacy_disclosure`
                - Status: `accepted`
                - Scope: `assurance`
                - Upstream tasks: seq_008, seq_010, seq_015, seq_016
                - Views: view_frontend_gateway_design_contract, view_data_event_storage_integration, view_release_assurance_resilience
                - Contracts: VisibilityProjectionPolicy, AudienceSurfaceRuntimeBinding, DesignContractPublicationBundle
                - Requirements: REQ-OBJ-visibilityprojectionpolicy, REQ-EDGE-VISIBILITY-PROJECTION-BEFORE-MATERIALIZATION, REQ-INV-044, REQ-INV-062, REQ-TEST-phase-3-the-human-checkpoint-md-117, REQ-TEST-phase-3-the-human-checkpoint-md-087, REQ-TEST-phase-6-the-pharmacy-loop-md-045, REQ-TEST-phase-6-the-pharmacy-loop-md-061

                **Problem**

                PHI boundaries, break-glass behavior, support replay, and audit disclosure can drift if classification and masking remain document-only policies instead of runtime enforcement.

                **Decision**

                Freeze data classification, redaction, masking, disclosure fences, break-glass scope rules, and artifact sensitivity classes as runtime contracts consumed by shells, exports, support replay, and audit.

                **Why Now**

                Seq_010 already produced the classification and disclosure model. Seq_016 must now anchor it in the architecture so no later task treats it as adjacent compliance prose.

                **Consequences**

                Positive:
                - Disclosure, masking, and break-glass become testable runtime behaviors rather than policy claims.
- Support and audit surfaces can stay useful without exceeding minimum necessary posture.

                Negative:
                - More surfaces can degrade to summary-only, recovery-only, or masked replay under classification drift.
- New fields and artifact families require explicit classification and disclosure mappings before publication.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-013A_MINIMUM_NECESSARY_SUPPORT_REPLAY_WITH_DISCLOSURE_FENCES`
- `ALT-016-013B_SUMMARY_ONLY_DISCLOSURE_WHEN_PARITY_OR_CLASSIFICATION_DRIFTS`

                Rejected alternatives:
                - `ALT-016-013R_SURFACE_LOCAL_MASKING_OVERRIDES`
- `ALT-016-013S_AUDIT_EXPORT_WITHOUT_RUNTIME_DISCLOSURE_BINDINGS`

                **Validation**

                - Keep support replay, exports, and patient-safe copies inside classified disclosure envelopes.
- Fail any audit or replay pathway that cannot cite the current masking, redaction, and disclosure contract.

                **Source Refs**

                - 10_data_classification_model.md
- 10_phi_masking_and_redaction_policy.md
- 10_audit_posture_and_event_disclosure.md
- 10_break_glass_and_investigation_scope_rules.md
- phase-0-the-foundation-protocol.md#VisibilityProjectionPolicy
- forensic-audit-findings.md#Finding 116 - Accessibility announcements could still spam, replay stale cues, or blur provisional and authoritative meaning

                **Notes**

                This ADR makes seq_010 a first-class architecture baseline instead of a documentation sidecar.
## ADR-016-014 Assistive capability stays optional, sidecar-bound, human-controlled, and kill-switchable

                - Family: `bounded_assistive`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_003, seq_004, seq_009, seq_016
                - Views: view_domain_runtime_control_plane, view_release_assurance_resilience
                - Contracts: AssuranceSliceTrustRecord, ReleaseRecoveryDisposition
                - Requirements: REQ-OBJ-assistivecapabilitytrustenvelope, REQ-OBJ-assistivefeedbackchain, REQ-INV-039, REQ-INV-051, REQ-INV-052, REQ-INV-053, REQ-TEST-phase-3-the-human-checkpoint-md-080, REQ-TEST-phase-3-the-human-checkpoint-md-081

                **Problem**

                Assistive capability can reappear as a mandatory stage or central control-plane owner if its insertion limits are not frozen explicitly.

                **Decision**

                Freeze assistive capability as an optional sidecar with human-controlled outputs, bounded insertion points, artifact-only semantics unless a later explicit intended-use ADR says otherwise, and an immediate kill-switch posture.

                **Why Now**

                The earlier forensic work already removed mandatory AI. Seq_009 bounded the regulatory posture and seq_004 kept standalone assistive control surfaces conditional. Seq_016 must keep that boundary stable.

                **Consequences**

                Positive:
                - Core request progression remains human-governed and operationally resilient when assistive services are absent.
- The platform can still experiment with bounded assistive rollout cohorts safely.

                Negative:
                - Any assistive feature beyond sidecar artifacts requires later architecture and regulatory review.
- Some automation opportunities remain deliberately unavailable in the current baseline.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-014A_ASSISTIVE_DISABLED_BY_DEFAULT`
- `ALT-016-014B_ASSISTIVE_ARTIFACTS_VISIBLE_WITH_HUMAN_REVIEW_ONLY`

                Rejected alternatives:
                - `ALT-016-014R_ASSISTIVE_AS_MANDATORY_REVIEW_STAGE`
- `ALT-016-014S_ASSISTIVE_WRITES_CANONICAL_REQUEST_TRUTH`

                **Validation**

                - Prevent assistive outputs from bypassing human control or command settlement.
- Ensure kill-switch posture leaves the rest of the baseline operationally intact.

                **Source Refs**

                - forensic-audit-findings.md#Finding 17 - AI assistance was modeled as a mandatory linear stage
- 04_surface_conflict_and_gap_report.md
- 09_regulatory_workstreams.md
- 03_deferred_and_conditional_scope.md

                **Notes**

                The architecture explicitly treats assistive capability as bounded optionality rather than a foundation dependency.
## ADR-016-015 Publication, continuity proof, watch tuples, and resilience controls are one cross-phase architecture control plane

                - Family: `architecture_control_plane`
                - Status: `accepted`
                - Scope: `cross_phase`
                - Upstream tasks: seq_011, seq_014, seq_015, seq_016
                - Views: view_container_topology, view_domain_runtime_control_plane, view_frontend_gateway_design_contract, view_release_assurance_resilience
                - Contracts: RouteIntentBinding, DesignContractPublicationBundle, RuntimePublicationBundle, ReleaseWatchTuple, OperationalReadinessSnapshot, RecoveryControlPosture
                - Requirements: REQ-OBJ-audiencesurfaceruntimebinding, REQ-OBJ-designcontractpublicationbundle, REQ-OBJ-operationalreadinesssnapshot, REQ-OBJ-recoverycontrolposture, REQ-INV-044, REQ-INV-053, REQ-INV-059, REQ-INV-061

                **Problem**

                The corpus still had scattered control-plane concepts: route intent, design-contract publication, release tuples, watch tuples, continuity proof, readiness, and resilience authority could look like adjacent systems.

                **Decision**

                Freeze one cross-phase architecture control plane that binds RouteIntentBinding, design-contract publication, runtime publication, release freeze, watch tuples, continuity evidence, readiness, and resilience posture into one programme-wide authority model. None of these concepts may remain phase-local conventions.

                **Why Now**

                This is the exact seq_016 closure: the prior tasks produced the pieces, but not yet one explicit architecture decision that ties them together.

                **Consequences**

                Positive:
                - Later autonomous agents can cite one control-plane law instead of restitching five prior task outputs.
- Ops, governance, browser shells, and release tooling now share one mental model for live authority.

                Negative:
                - The control-plane object set is larger and more explicit than a minimal runtime-only architecture.
- Teams must keep more tuple-bound evidence current before promoting writable posture.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-015A_SUMMARY_FIRST_CONTROL_PLANE_VIEWS_WITH_DIAGNOSTIC_DRILLDOWN`
- `ALT-016-015B_SHARED_TUPLE_HASHES_ACROSS_PUBLICATION_CONTINUITY_AND_RESILIENCE`

                Rejected alternatives:
                - `ALT-016-015R_PHASE_LOCAL_CONTROL_CONVENTIONS`
- `ALT-016-015S_DESIGN_CONTRACT_OR_CONTINUITY_PROOF_AS_ADJACENT_DOCUMENTATION`

                **Validation**

                - Keep every control-plane tuple discoverable through published contracts and runtime markers.
- Reject any architecture view or task output that treats continuity proof, publication, or resilience authority as separate optional commentary.

                **Source Refs**

                - forensic-audit-findings.md#Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions
- forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight
- forensic-audit-findings.md#Findings 104-120
- phase-0-the-foundation-protocol.md#RuntimePublicationBundle
- phase-0-the-foundation-protocol.md#AudienceSurfaceRuntimeBinding
- phase-0-the-foundation-protocol.md#OperationalReadinessSnapshot
- phase-0-the-foundation-protocol.md#RecoveryControlPosture

                **Notes**

                This ADR is the canonical seq_016 freeze that binds the architecture pack together.
## ADR-016-016 Embedded NHS App channel remains deferred and non-authoritative in the current baseline

                - Family: `deferred_phase7_channel`
                - Status: `deferred`
                - Scope: `audience_surface`
                - Upstream tasks: seq_003, seq_004, seq_008, seq_009, seq_016
                - Views: view_system_context, view_frontend_gateway_design_contract
                - Contracts: ChannelReleaseFreezeRecord, AudienceSurfaceRuntimeBinding, ReleaseApprovalFreeze
                - Requirements: REQ-OBJ-channelreleasefreezerecord, REQ-OBJ-patientembeddedsessionprojection, REQ-EDGE-RELEASE-CHANNEL-TRUST-FENCE, REQ-INV-010, REQ-INV-036, REQ-INV-038, REQ-INV-045, REQ-INV-048

                **Problem**

                The current corpus includes embedded-channel compatibility contracts, but the product scope baseline explicitly defers Phase 7. Without an explicit deferred ADR, later tasks could silently pull it back in.

                **Decision**

                Keep the embedded NHS App channel and any standalone assistive-control shell outside the accepted baseline. Current work may preserve compatibility contracts and deferred onboarding seams only.

                **Why Now**

                Seq_003, seq_004, seq_008, and seq_009 all preserved this deferral. Seq_016 must freeze it so later tasks cannot reinterpret compatibility work as live baseline scope.

                **Consequences**

                Positive:
                - Current baseline delivery remains focused on phases 0-6, 8, and 9 without hidden embedded-channel drift.
- Compatibility seams can mature without implying live release authority or current regulatory blockers.

                Negative:
                - Embedded-channel user journeys remain unavailable in the current baseline.
- Later Phase 7 work will need its own promotion, assurance, and release tuple review.

                **Alternatives**

                Accepted bounded alternatives:
                - `ALT-016-016A_COMPATIBILITY_CONTRACTS_ONLY_UNTIL_PHASE_7_REOPENED`
- `ALT-016-016B_NON_AUTHORITATIVE_SIMULATION_OR_PLACEHOLDER_ONLY`

                Rejected alternatives:
                - `ALT-016-016R_EMBEDDED_WRITABLE_BASELINE_NOW`
- `ALT-016-016S_PHASE7_SCOPE_REINTRODUCED_THROUGH_ROUTE_OR_DESIGN_WORK`

                **Validation**

                - Reject any accepted ADR or release view that treats embedded NHS App as a live baseline audience surface.
- Keep embedded compatibility work non-authoritative until a later explicit architecture decision changes status.

                **Source Refs**

                - 03_product_scope_boundary.md
- 03_deferred_and_conditional_scope.md
- 04_surface_conflict_and_gap_report.md
- 08_external_dependency_inventory.md
- 09_regulatory_workstreams.md
- prompt/016.md

                **Notes**

                This ADR exists specifically to stop silent scope re-entry from bridge or compatibility work.
