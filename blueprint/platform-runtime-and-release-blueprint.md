# Platform runtime and release blueprint

## Purpose

Define the production runtime, trust boundaries, release system, and verification ladder for Vecells.

This document closes the delivery gap between the canonical domain runtime in `phase-0-the-foundation-protocol.md`, the shell contracts in `platform-frontend-blueprint.md`, the admin promotion rules in `platform-admin-and-config-blueprint.md`, and the restore and assurance controls in `phase-9-the-assurance-ledger.md`. The phase documents already define what Vecells must do; this blueprint defines how it is allowed to ship, change, recover, and prove safety in production.

## Cross-layer control priorities

High-priority runtime and release gaps in this layer:

1. audience gateway surfaces are projection-safe, but not yet explicitly bound to release or channel freeze posture and governed recovery modes before writable state is exposed
2. the promoted release tuple still centers artifacts and schemas more clearly than the frozen release or channel posture that patient, staff, and embedded surfaces must validate at runtime
3. staged rollout objects freeze tenant scope, but not one assurance-aware guardrail snapshot that can halt widening when slice trust or channel posture degrades
4. the verification ladder proves gates and rollback posture, but not yet the exact release-freeze, channel-manifest, and recovery-disposition contract that live shells will rely on under freeze or drift
5. operational readiness names deploy and rollback runbooks, but not the bounded patient or staff recovery modes that must activate when release, channel, or assurance posture fails closed
6. governance, operations, and runtime consumers still lack one machine-readable watch tuple proving that the approved release tuple, published route contracts, rollout scope, observation duty, recovery dispositions, provenance state, and continuity evidence still match in production watch mode

## Runtime topology contract

Use one governed entry plane and separate internal workload planes.

Suggested workload families:

- public edge
- shell delivery plane
- command plane
- projection plane
- integration plane
- data plane
- assurance and security plane

Suggested runtime objects:

- `RuntimeWorkloadFamily`
- `TrustZoneBoundary`
- `RuntimeTopologyManifest`
- `GatewayBffSurface`
- `FrontendContractManifest`
- `ProjectionContractFamily`
- `ProjectionContractVersion`
- `ProjectionContractVersionSet`
- `ProjectionQueryContract`
- `MutationCommandContract`
- `LiveUpdateChannelContract`
- `ClientCachePolicy`
- `AudienceSurfaceRouteContract`
- `DependencyDegradationProfile`
- `AdapterContractProfile`
- `BuildProvenanceRecord`
- `RuntimePublicationBundle`
- `ReleasePublicationParityRecord`
- `ReleaseCandidate`
- `DeploymentWave`
- `WaveGuardrailSnapshot`
- `ReleaseWatchTuple`
- `WaveObservationPolicy`
- `WaveActionRecord`
- `WaveActionSettlement`
- `ReleaseRecoveryDisposition`
- `SchemaMigrationPlan`
- `ProjectionBackfillPlan`
- `ReadPathCompatibilityWindow`
- `ProjectionReadinessVerdict`
- `MigrationExecutionBinding`
- `MigrationImpactPreview`
- `MigrationActionRecord`
- `MigrationActionSettlement`
- `MigrationActionObservationWindow`
- `ReleaseGateEvidence`

High-priority topology defects in this layer:

1. workload families are named, but not yet published as typed runtime contracts, so public edge, gateway, command, projection, and integration responsibilities can still blur
2. trust zones, service identities, tenant transfer, and egress allowlists are declared only as loose manifest refs, so route exposure can still depend on deployment folklore rather than published runtime truth
3. gateway surfaces do not yet declare the exact downstream workload families, data classes, and trust boundaries they are allowed to cross, so one generic BFF can silently become too broad
4. degraded dependencies and degraded assurance slices can still spread across unrelated planes because containment scope is not part of the topology contract
5. projection contracts still version mostly by digest and deploy order, so additive evolution, breaking cuts, backfill lag, and rollback can leave mixed-version route families under-governed
5. route publication and writable posture still depend on topology facts that are not fully published as part of the runtime bundle consumed by shells and operators
6. browser-facing query, command, live-channel, and cache contracts are still implied by route code generation and gateway implementation rather than one published manifest per route family, so shells can reconstruct writability or recovery semantics from convention

### `RuntimeWorkloadFamily`

Required fields:

- `runtimeWorkloadFamilyId`
- `familyCode = public_edge | shell_delivery | command | projection | integration | data | assurance_security`
- `trustZoneRef`
- `ownedBoundedContextRefs[]`
- `ownedServiceRefs[]`
- `ingressMode = browser | service | async | none`
- `allowedDownstreamFamilyRefs[]`
- `allowedDataClassificationRefs[]`
- `tenantContextMode = required | brokered | prohibited`
- `assuranceTrustMode = consume | publish | isolate`
- `egressAllowlistRef`
- `serviceIdentityRef`
- `failureDomainRef`
- `declaredAt`

`RuntimeWorkloadFamily` is the machine-readable ownership contract for one runtime plane. If ingress mode, tenant context, bounded-context ownership, data classification, assurance trust handling, or egress policy differs materially, the workload must split into a different family rather than relying on internal convention.

### `TrustZoneBoundary`

Required fields:

- `trustZoneBoundaryId`
- `sourceTrustZoneRef`
- `targetTrustZoneRef`
- `sourceWorkloadFamilyRefs[]`
- `targetWorkloadFamilyRefs[]`
- `allowedProtocolRefs[]`
- `allowedIdentityRefs[]`
- `allowedDataClassificationRefs[]`
- `tenantTransferMode = same_tenant_only | brokered_subject | platform_controlled | forbidden`
- `assuranceTrustTransferMode = preserve | downgrade | strip | forbidden`
- `egressAllowlistRef`
- `boundaryFailureMode = isolate | degrade_origin | halt_target | blocked`
- `boundaryState = active | constrained | blocked`
- `validatedAt`

`TrustZoneBoundary` is the only legal declaration of cross-plane reachability. Hostnames, VPC diagrams, or service-mesh policy may implement the boundary, but they do not replace the published contract that shells, operators, and release tooling consume.

### `RuntimeTopologyManifest`

Required fields:

- `manifestId`
- `environment`
- `workloadFamilyRefs[]`
- `trustZoneBoundaryRefs[]`
- `gatewaySurfaceRefs[]`
- `ingressRefs`
- `serviceIdentityRefs`
- `dataStoreRefs`
- `queueRefs`
- `egressAllowlistRefs`
- `tenantIsolationMode`
- `releaseApprovalFreezeRef`
- `channelManifestSetRef`
- `minimumBridgeCapabilitySetRef`
- `requiredAssuranceSliceRefs`
- `topologyTupleHash`
- `publicationState = approved | stale | withdrawn`
- `approvedAt`

Rules:

- one `RuntimeTopologyManifest` is the authoritative runtime and trust-zone contract for one environment, release-freeze posture, and channel-manifest posture
- every `GatewayBffSurface`, `AudienceSurfacePublicationRef`, `AudienceSurfaceRuntimeBinding`, and `BuildProvenanceRecord` must point back to the current `RuntimeTopologyManifest`; topology may not live only in deployment docs or infra code comments
- if workload-family membership, trust-zone boundaries, service identities, tenant isolation mode, required assurance slices, or egress allowlists drift from the approved manifest, set `publicationState = stale | withdrawn` and freeze writable posture until a fresh manifest is approved and republished
- `public_edge` and `shell_delivery` may terminate browser traffic and deliver static shell assets, but only a published `GatewayBffSurface` may bridge browser-facing traffic into command, projection, assurance, or integration workloads
- deployment-unit sharing is allowed only when the shared services remain inside one declared `RuntimeWorkloadFamily` and failure domain; if ingress mode, tenant context, egress policy, or trust zone differs, the topology must split the workload family explicitly

### `GatewayBffSurface`

Required fields:

- `surfaceId`
- `audience`
- `routeFamilies`
- `servedBoundedContextRefs[]`
- `mutatingBoundedContextRefs[]`
- `requiredContextBoundaryRefs[]`
- `entryWorkloadFamilyRef`
- `downstreamWorkloadFamilyRefs[]`
- `trustZoneBoundaryRefs[]`
- `tenantIsolationMode`
- `openApiRef`
- `asyncChannelRef`
- `projectionSchemaRefs`
- `commandSettlementSchemaRefs`
- `sessionPolicyRef`
- `cachePolicyRef`
- `releaseApprovalFreezeRef`
- `channelGuardrailProfileRef`
- `recoveryDispositionProfileRef`
- `requiredAssuranceSliceRefs[]`
- `frontendContractManifestRefs[]`
- `projectionQueryContractRefs[]`
- `mutationCommandContractRefs[]`
- `liveUpdateChannelContractRefs[]`
- `clientCachePolicyRefs[]`
- `surfaceAuthorityTupleHash`
- `runtimePublicationBundleRef`

Rules:

- one `GatewayBffSurface` is the only browser-addressable compute boundary for one audience family or one explicitly declared combined audience surface
- if two route families require different tenant isolation, trust-zone boundaries, downstream workload sets, recovery-disposition profiles, or owning bounded contexts, they must split into different `GatewayBffSurface` objects rather than branching inside one generic BFF
- a gateway surface may read projections, dispatch commands, and subscribe to live channels only through its declared downstream workload families and trust-zone boundaries; direct adapter egress, raw data-plane access, or undeclared cross-zone fanout is forbidden
- browser-facing mutation may target only the contexts named in `mutatingBoundedContextRefs[]`, and any non-owning contributor context must be justified by `requiredContextBoundaryRefs[]`; a generic BFF may not silently become the write facade for unrelated domains
- patient and staff or admin gateway surfaces may share infrastructure only when their published `GatewayBffSurface` contracts still keep session policy, cache scope, tenant isolation, and assurance-trust requirements separate and auditable
- a gateway surface may expose browser-callable reads, mutations, streams, and cache semantics only through the published `FrontendContractManifest` rows it names; undocumented passthrough endpoints, route-local aliases, and undeclared fallback BFFs are forbidden
- `surfaceAuthorityTupleHash` must prove that gateway exposure, route contracts, design-contract publication, projection queries, mutation commands, live channels, cache policy, runtime publication, and recovery posture were published together rather than stitched from mixed snapshots

### `FrontendContractManifest`

Required fields:

- `frontendContractManifestId`
- `audienceSurface`
- `routeFamilyRefs[]`
- `gatewaySurfaceRef`
- `surfaceRouteContractRef`
- `surfacePublicationRef`
- `audienceSurfaceRuntimeBindingRef`
- `designContractPublicationBundleRef`
- `tokenKernelLayeringPolicyRef`
- `profileSelectionResolutionRefs[]`
- `surfaceStateKernelBindingRefs[]`
- `projectionContractVersionSetRef`
- `runtimePublicationBundleRef`
- `projectionQueryContractRefs[]`
- `mutationCommandContractRefs[]`
- `liveUpdateChannelContractRefs[]`
- `clientCachePolicyRef`
- `commandSettlementSchemaRef`
- `transitionEnvelopeSchemaRef`
- `releaseRecoveryDispositionRef`
- `routeFreezeDispositionRef`
- `browserPostureState = publishable_live | read_only | recovery_only | blocked`
- `frontendContractDigestRef`
- `designContractDigestRef`
- `designContractLintVerdictRef`
- `profileLayeringDigestRef`
- `kernelPropagationDigestRef`
- `accessibilitySemanticCoverageProfileRefs[]`
- `automationAnchorProfileRefs[]`
- `surfaceStateSemanticsProfileRefs[]`
- `accessibilityCoverageDigestRef`
- `accessibilityCoverageState = complete | degraded | blocked`
- `projectionCompatibilityDigestRef`
- `surfaceAuthorityTupleHash`
- `generatedAt`

Rules:

- one `FrontendContractManifest` is the only browser-consumable authority contract for one audience surface and one declared route family set
- the manifest must be generated from one current `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, `AudienceSurfaceRuntimeBinding`, and `DesignContractPublicationBundle`; browsers, gateways, support tools, and shell code may not reassemble browser authority from those fragments independently
- every browser-visible read, mutation, stream, settlement envelope, cache policy, recovery posture, and design-contract bundle reachable from the route family must be enumerated in the manifest; projection shape, route names, UI flags, token constants, and optimistic transport state are not substitute authority
- every manifest must also enumerate the current `TokenKernelLayeringPolicy`, `ProfileSelectionResolution`, and `SurfaceStateKernelBinding` set for the route families it publishes; browsers, gateways, and shell code may not infer token layering or state propagation from CSS variables, component stories, local selectors, or ad hoc aria labels
- every manifest must also enumerate the current `AccessibilitySemanticCoverageProfile`, `AutomationAnchorProfile`, and `SurfaceStateSemanticsProfile` set for the route families it publishes; browsers, gateways, and shell code may not infer semantic coverage from CSS, route-local ARIA, or local test selectors
- the manifest must also bind one exact `ProjectionContractVersionSet`; query-local digests, route-local handler code, and cached payload shape are not enough to prove mixed-version safety
- if runtime publication, topology, design-contract publication, design-contract lint posture, profile layering, kernel propagation, accessibility coverage, parity, provenance, read-path readiness, channel freeze, or assurance posture drifts, regenerate the manifest with `browserPostureState = read_only | recovery_only | blocked`; stale manifests may not remain silently live
- gateways may remain thin, but they must be authoritative about refusal: if a browser call is not present in the active manifest, the gateway must reject it rather than forwarding to an internal API and hoping the shell never asks

### `ProjectionContractFamily`

Required fields:

- `projectionContractFamilyId`
- `audienceSurface`
- `routeFamilyRefs[]`
- `queryCode`
- `projectionFamilyRefs[]`
- `canonicalObjectDescriptorRefs[]`
- `compatibilityPolicyRef`
- `currentProjectionContractVersionRef`
- `defaultRecoveryDispositionRef`
- `familyState = active | deprecated | withdrawn`
- `publishedAt`

Rules:

- one `ProjectionContractFamily` defines the semantically stable browser read purpose for one query; if governing object, purpose of use, or route-facing recovery meaning changes materially, publish a new family rather than mutating the old one in place
- endpoint names, component imports, and deploy order are not the version boundary; the family is
- every browser-visible projection read must belong to exactly one active family

### `ProjectionContractVersion`

Required fields:

- `projectionContractVersionId`
- `projectionContractFamilyRef`
- `versionOrdinal`
- `responseSchemaRef`
- `contractDigestRef`
- `changeClass = additive | additive_with_placeholder | breaking | withdrawal_only`
- `supersedesProjectionContractVersionRef`
- `compatiblePredecessorRefs[]`
- `minimumConsumerManifestRef`
- `summaryFallbackDispositionRef`
- `introducedInReleaseRef`
- `deprecatedAfterReleaseRef`
- `publishedAt`

Rules:

- projection response shape may not change in place; every material schema change must publish a new `ProjectionContractVersion`
- `changeClass = additive | additive_with_placeholder` may coexist with older versions only when the bound compatibility policy and active version set still allow it
- `changeClass = breaking | withdrawal_only` requires a superseding manifest, updated route contract tuple, and declared same-shell fallback; best-effort consumer tolerance is not a versioning strategy
- deprecated versions may remain readable only while the active compatibility window and removal guard still permit them

### `ProjectionContractVersionSet`

Required fields:

- `projectionContractVersionSetId`
- `audienceSurface`
- `routeFamilyRef`
- `projectionContractFamilyRefs[]`
- `requiredProjectionContractVersionRefs[]`
- `allowedAdditiveCompatibilityRefs[]`
- `routeContractDigestRef`
- `frontendContractManifestRef`
- `readPathCompatibilityWindowRef`
- `compatibilityState = exact | additive_compatible | constrained | recovery_only | blocked`
- `projectionCompatibilityDigestRef`
- `generatedAt`

Rules:

- one route family must resolve one `ProjectionContractVersionSet` proving the exact combination of projection contract versions it is allowed to consume
- mixed-version reads are legal only when the version set declares them `additive_compatible` and the bound `ReadPathCompatibilityWindow` plus recovery posture still allow the same combination
- if any required projection contract family is missing, withdrawn, or outside the declared compatibility policy, the version set must degrade to `constrained | recovery_only | blocked`
- caches, readiness verdicts, live-channel downgrades, and shell honesty fences must key off `projectionCompatibilityDigestRef`; individual query digests are insufficient for route truth

### `ProjectionQueryContract`

Required fields:

- `projectionQueryContractId`
- `audienceSurface`
- `routeFamilyRef`
- `gatewaySurfaceRef`
- `queryCode`
- `projectionContractFamilyRef`
- `projectionContractVersionRef`
- `projectionContractVersionSetRef`
- `projectionSourceRef`
- `responseSchemaRef`
- `visibilityCoverageRefs[]`
- `allowedPurposeOfUseRefs[]`
- `requiredReadPathCompatibilityWindowRef`
- `requiredProjectionReadinessRefs[]`
- `zeroResultDisposition = authoritative_empty | summary_only | recovery_only`
- `freshnessContractRef`
- `clientCachePolicyRef`
- `artifactModeRefs[]`
- `contractDigestRef`
- `generatedAt`

Rules:

- every browser-origin read that hydrates shell, child-route, artifact, or reassurance state must publish one `ProjectionQueryContract`
- the query contract must bind one `ProjectionContractFamily` and one `ProjectionContractVersion`; handler code may not mutate response shape behind a stable query code or route digest
- the contract must declare whether zero rows mean authoritative emptiness, summary-only posture, or recovery-only posture; shells may not infer that from JSON shape, HTTP status, or local cache alone
- query contracts may expose only audience-safe projection fields; raw domain records, adapter payloads, and accidental overfetch are boundary defects even if the shell ignores the extra data
- a gateway may compose multiple internal reads behind one query contract, but it may not let composition leak into browser-visible trust, freshness, or recovery semantics that differ from the published contract
- every query contract must participate in the active `ProjectionContractVersionSet` for its route family; standalone query digests may not bypass the route-level compatibility tuple

### `MutationCommandContract`

Required fields:

- `mutationCommandContractId`
- `audienceSurface`
- `routeFamilyRef`
- `gatewaySurfaceRef`
- `commandCode`
- `allowedActionScopeRefs[]`
- `requestSchemaRef`
- `requiredRouteIntentState`
- `idempotencyPolicyRef`
- `freshnessFencePolicyRef`
- `commandSettlementSchemaRef`
- `transitionEnvelopeSchemaRef`
- `releaseRecoveryDispositionRef`
- `declinedScopeDispositionRef`
- `contractDigestRef`
- `generatedAt`

Rules:

- every browser-origin mutation must publish one `MutationCommandContract`
- the gateway must reject undeclared mutations, stale scope, stale route intent, or unsupported recovery posture before internal command dispatch; shells may not discover those failures only after calling a broad internal endpoint
- transport acceptance, queued dispatch, or HTTP success are never authoritative mutation truth; the contract must pin the exact settlement schema and recovery envelope the browser is allowed to consume
- if two route families differ in allowed action scope, recovery semantics, or settlement schema, they must split into different contracts rather than branching in shell-only code

### `LiveUpdateChannelContract`

Required fields:

- `liveUpdateChannelContractId`
- `audienceSurface`
- `routeFamilyRef`
- `gatewaySurfaceRef`
- `channelCode`
- `messageSchemaRef`
- `reconnectPolicyRef`
- `stalenessDisclosureRef`
- `downgradeDispositionRef`
- `requiredProjectionReadinessRefs[]`
- `requiredAssuranceSliceTrustRefs[]`
- `contractDigestRef`
- `generatedAt`

Rules:

- every browser stream, websocket, SSE feed, or equivalent live delta surface must publish one `LiveUpdateChannelContract`
- reconnect, downgrade, stale-read disclosure, and freeze behavior must be declared here rather than improvised inside shell hooks or route-local channel helpers
- a live channel may not imply writability, settlement, or read completeness beyond the active runtime binding and manifest that reference it

### `ClientCachePolicy`

Required fields:

- `clientCachePolicyId`
- `audienceSurface`
- `routeFamilyRefs[]`
- `cacheScope = shell | route_family | entity | query_result`
- `ttlPolicyRef`
- `revalidationTriggerRefs[]`
- `mutationInvalidationRefs[]`
- `staleWhileRevalidateMode = forbidden | bounded | summary_only`
- `offlineReuseDisposition = forbidden | read_only | recovery_only`
- `sensitiveFieldHandlingRef`
- `contractDigestRef`
- `generatedAt`

Rules:

- every published browser query and channel contract must resolve one `ClientCachePolicy`
- browser caches may preserve continuity, but they may not preserve writable posture beyond the active manifest, runtime binding, or freeze posture
- stale cached data may be reused only according to the declared read-only or recovery disposition; calm success, writable controls, or green freshness copy may not be reconstructed from cached payload shape alone

### `DependencyDegradationProfile`

Required fields:

- `profileId`
- `dependencyCode`
- `failureModes`
- `patientFallbackState`
- `staffFallbackState`
- `impactedWorkloadFamilyRefs[]`
- `maximumEscalationFamilyRefs[]`
- `assuranceTrustEffect = none | slice_degraded | slice_quarantined | plane_blocked`
- `topologyFallbackMode = local_placeholder | gateway_read_only | command_halt | projection_stale | integration_queue_only`
- `retryPolicyRef`
- `alertThresholdRef`

Rules:

- every dependency failure mode must declare which workload families it may affect and the maximum family set it is allowed to escalate into; unbounded cross-plane fallout is a topology defect
- if a dependency is isolated to integration or projection work, the profile must degrade the dependent bindings through the declared `topologyFallbackMode` rather than implying whole-platform outage
- assurance degradation must remain slice-bounded unless the profile explicitly declares `assuranceTrustEffect = plane_blocked`

### `AdapterContractProfile`

Required fields:

- `adapterContractProfileId`
- `adapterCode`
- `effectFamilies`
- `capabilityMatrixRef`
- `outboxCheckpointPolicyRef`
- `receiptOrderingPolicyRef`
- `callbackCorrelationPolicyRef`
- `idempotencyWindowRef`
- `duplicateDispositionRef`
- `collisionDispositionRef`
- `retryPolicyRef`
- `dependencyDegradationProfileRef`
- `integrationWorkloadFamilyRef`
- `requiredTrustZoneBoundaryRef`
- `updatedAt`

Rules:

- every external dependency boundary must publish one `AdapterContractProfile`; worker code, webhooks, and callbacks may not invent replay or ordering rules ad hoc
- adapters execute only from their declared `integrationWorkloadFamilyRef` across the declared `requiredTrustZoneBoundaryRef`; gateway, shell-delivery, command, or projection workloads may not become side-door integration runtimes
- every adapter contract must name the published `FhirRepresentationContract` rows and accepted `FhirExchangeBundle.bundleType` values it is allowed to consume; vendor packs, local serializers, or webhook handlers may not infer resource shapes or identifier rules from code defaults
- booking-capable integrations must also publish one `BookingProviderAdapterBinding` per live supplier, integration-mode, deployment-type, audience, and action-scope context; shells and workers may not reconstruct that tuple locally from vendor names, feature flags, or copied CTA state
- any binding revision that changes search normalization, revalidation, reservation semantics, commit proof, or manage support must supersede the older `bindingHash` and freeze stale booking CTAs until capability resolution is recomputed
- outbox delivery must be resumable from a durable checkpoint that links back to the owning `CommandActionRecord` and canonical `effectKey`
- duplicate or reordered callbacks must resolve through the profile's receipt-ordering and correlation policy so exactly one authoritative settlement chain can emerge for a given external effect
- transport acceptance, webhook arrival, or queue dequeue are never authoritative success by themselves; the profile must declare what proof upgrades the effect from dispatched to confirmed, disputed, or failed

### `WaveGuardrailSnapshot`

Required fields:

- `guardrailSnapshotId`
- `waveRef`
- `promotionIntentRef`
- `approvalEvidenceBundleRef`
- `waveEligibilitySnapshotRef`
- `baselineTupleHash`
- `approvalTupleHash`
- `runtimePublicationBundleRef`
- `waveObservationPolicyRef`
- `releaseApprovalFreezeRef`
- `tenantScopeMode`
- `tenantScopeRef`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `tenantScopeTupleHash`
- `watchTupleHash`
- `publicationParityRef`
- `requiredAssuranceSliceRefs`
- `requiredReleaseTrustFreezeVerdictRefs[]`
- `requiredContinuityControlRefs[]`
- `continuityEvidenceDigestRefs[]`
- `activeChannelFreezeRefs`
- `recoveryDispositionRefs`
- `guardrailState = green | constrained | frozen | rollback_review_required`
- `evaluatedAt`

`requiredContinuityControlRefs[]` must be specific enough to freeze a wave on affected continuity families, not just on patient-facing navigation controls. If a candidate changes patient-home actionability, record-continuation recovery, more-info reply posture, conversation settlement, support replay restore, intake autosave or resume, booking manage posture, hub booking-manage posture, visible assistive writeback, workspace task completion, or pharmacy-console settlement posture, the snapshot must name `patient_nav`, `record_continuation`, `more_info_reply`, `conversation_settlement`, `support_replay_restore`, `intake_resume`, `booking_manage`, `hub_booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement` explicitly where relevant.
`guardrailState = green` is legal only while `publicationParityRef.parityState = exact` and every linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`; stale or conflicting route publication, recovery disposition, continuity evidence, degraded trust, or active channel freeze must constrain or freeze the wave even if operational metrics look healthy.
`WaveGuardrailSnapshot` must evaluate one exact wave step. It must stay bound to the same `baselineTupleHash` and `approvalTupleHash` the release was approved against. If eligibility scope, tenant blast radius, runtime publication, observation duty, active channel freezes, recovery dispositions, or the reviewed baseline package changes, publish a fresh snapshot and supersede the live watch tuple rather than mutating this snapshot in place.

### `ReleaseWatchTuple`

Required fields:

- `releaseWatchTupleId`
- `releaseRef`
- `promotionIntentRef`
- `approvalEvidenceBundleRef`
- `baselineTupleHash`
- `approvalTupleHash`
- `releaseApprovalFreezeRef`
- `runtimePublicationBundleRef`
- `releasePublicationParityRef`
- `waveRef`
- `waveEligibilitySnapshotRef`
- `waveGuardrailSnapshotRef`
- `waveObservationPolicyRef`
- `waveControlFenceRef`
- `tenantScopeMode`
- `tenantScopeRef`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `tenantScopeTupleHash`
- `requiredAssuranceSliceRefs[]`
- `releaseTrustFreezeVerdictRefs[]`
- `requiredContinuityControlRefs[]`
- `continuityEvidenceDigestRefs[]`
- `activeChannelFreezeRefs[]`
- `recoveryDispositionRefs[]`
- `watchTupleHash`
- `tupleState = proposed | active | stale | superseded | closed`
- `publishedAt`

Rules:

- one `ReleaseWatchTuple` is the only published machine-readable rollout tuple for one live wave step; governance, operations, incident, and runtime shells must consume this tuple and its bound `releaseTrustFreezeVerdictRefs[]` instead of reconstructing rollout truth from `watchTupleHash` plus adjacent records
- `watchTupleHash` must be derived from at least `baselineTupleHash`, `approvalTupleHash`, `releaseApprovalFreezeRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `waveEligibilitySnapshotRef`, `waveGuardrailSnapshotRef`, `waveObservationPolicyRef`, `waveControlFenceRef`, `tenantScopeTupleHash`, `activeChannelFreezeRefs[]`, `recoveryDispositionRefs[]`, `requiredAssuranceSliceRefs[]`, `releaseTrustFreezeVerdictRefs[]`, `requiredContinuityControlRefs[]`, and `continuityEvidenceDigestRefs[]`
- if any member of the tuple drifts, set `tupleState = stale` and block widening, stabilization, calm watch posture, and governed cross-shell handoff until a fresh tuple is published
- `multi_tenant` and `platform` tuples must surface `affectedTenantCount` and `affectedOrganisationCount` explicitly; route naming or cohort labels alone are not enough blast-radius proof
- canary start, widening, and resume after a halted or superseded wave step must publish a new `ReleaseWatchTuple`; waves may narrow in place only while the remaining eligible scope still matches the bound `WaveEligibilitySnapshot.selectionDigest` and the tuple remains exact for that reduced scope
- `tupleState = closed` is legal only after the final applicable `WaveActionSettlement.result = applied`, its observation window satisfied the bound `WaveObservationPolicy`, and no later tuple for the same wave step superseded it

### `WaveObservationPolicy`

Required fields:

- `waveObservationPolicyId`
- `releaseRef`
- `waveRef`
- `promotionIntentRef`
- `releaseApprovalFreezeRef`
- `waveEligibilitySnapshotRef`
- `watchTupleHash`
- `minimumDwellDuration`
- `requiredProbeRefs[]`
- `requiredContinuityControlRefs[]`
- `requiredContinuityEvidenceDigestRefs[]`
- `requiredPublicationParityState = exact`
- `requiredRoutePostureState = converged`
- `requiredProvenanceState = verified`
- `stabilizationCriteriaRef`
- `rollbackTriggerRefs[]`
- `policyState = armed | satisfied | blocked | superseded`
- `publishedAt`

Rules:

- one `WaveObservationPolicy` defines the post-promotion observation contract for one wave step; operators may not shorten, extend, or replace dwell, probe, or continuity obligations by convention or dashboard commentary alone
- every canary or widening step must publish one `WaveObservationPolicy` together with its `WaveEligibilitySnapshot`, `WaveGuardrailSnapshot`, and `ReleaseWatchTuple`
- if required probes, continuity evidence, rollback triggers, or stabilization criteria change, publish a new policy and supersede the prior tuple; the current wave may not silently inherit a different observation duty in place

### `ReleaseRecoveryDisposition`

Required fields:

- `recoveryDispositionId`
- `surfaceRef`
- `audienceSurface`
- `routeFamilyRefs[]`
- `triggerType = release_freeze | channel_freeze | assurance_degraded | compatibility_drift | baseline_drift | guardrail_constrained | rollback_review_required`
- `allowedMode = diagnostic_read_only | read_only | placeholder_only | redirect_safe_route | governance_handoff`
- `calmTruthMode = suppressed | diagnostic_copy_only | placeholder_only`
- `patientMessageRef`
- `operatorRunbookRef`
- `placeholderContractRef`
- `safeRouteRef`
- `dispositionState = published | stale | withdrawn`
- `activatedAt`

Rules:

- `ReleaseRecoveryDisposition` must be audience- and route-family-specific enough that patient, staff, governance, audit, assurance, and resilience shells do not share one vague fallback while their authority ceilings differ
- a disposition that preserves diagnostics or calm explanatory copy for operators may not be reused for patient-facing routes unless the resulting visibility, action, and placeholder posture is still exact for that audience surface
- if the runbook, placeholder contract, or safe route bound to a disposition becomes stale or withdrawn for the current release tuple, the disposition itself becomes stale and the consuming verdict or binding must degrade to `blocked`

### `BuildProvenanceRecord`

High-priority provenance gaps in this layer:

1. provenance names the build system and commit, but not the trusted builder identity, invocation, or workspace cleanliness that produced the artifacts
2. artifact digests and SBOM are present, but the build still lacks one first-class material-input contract for base images, toolchains, resolved dependencies, and policy-bearing build parameters
3. provenance is not yet explicitly bound to the runtime topology, surface schema set, and workload scope the artifacts are intended to serve
4. signing exists as a timestamp and verifier only, so attestation chain, quarantine, revocation, and supersession are under-specified
5. release promotion requires signed provenance, but the provenance record itself does not yet prove reproducibility posture, rebuild challenge outcome, or promotion invalidation on drift

Required fields:

- `provenanceId`
- `buildSystemRef`
- `builderIdentityRef`
- `buildInvocationRef`
- `sourceTreeState = clean_tagged | clean_commit | dirty_rejected`
- `sourceCommitRef`
- `buildRecipeRef`
- `buildEnvironmentRef`
- `ephemeralWorkerRef`
- `artifactDigests`
- `baseImageDigests`
- `toolchainDigests`
- `dependencyLockRefs`
- `resolvedDependencySetRef`
- `buildParameterEnvelopeRef`
- `sbomRef`
- `targetRuntimeManifestRefs`
- `targetSurfaceSchemaSetRef`
- `targetWorkloadFamilyRefs`
- `targetTrustZoneBoundaryRefs[]`
- `targetGatewaySurfaceRefs[]`
- `targetTopologyTupleHash`
- `reproducibilityClass = reproducible | replayable_with_attestation | non_reproducible_blocked`
- `rebuildChallengeEvidenceRef`
- `attestationEnvelopeRefs`
- `verificationState = pending | verified | quarantined | revoked | superseded`
- `runtimeConsumptionState = publishable | blocked | withdrawn`
- `signedAt`
- `verifiedBy`

Rules:

- one `BuildProvenanceRecord` must cover the exact artifact set promoted by one `ReleaseCandidate`; artifact digests may not be re-signed, re-packed, or partially replaced after provenance verification
- `sourceTreeState != dirty_rejected` is mandatory for promotable artifacts; emergency fixes still require a clean committed source state and explicit invocation trace
- `buildParameterEnvelopeRef` must include every behavior-shaping input that is not already captured in source, lockfiles, or policy bundles, including feature-build toggles, compile-time tenancy partitions, and schema-generation switches
- `targetRuntimeManifestRefs`, `targetSurfaceSchemaSetRef`, `targetWorkloadFamilyRefs`, `targetTrustZoneBoundaryRefs[]`, and `targetGatewaySurfaceRefs[]` must make the intended runtime scope explicit so provenance cannot be reused for a different ingress, audience surface, trust boundary, or workload family without re-verification
- if any attestation is revoked, any rebuild challenge fails, or any target runtime or schema binding drifts, set `verificationState = quarantined | revoked` and `runtimeConsumptionState = blocked | withdrawn`, then block promotion, route-contract publication, wave widening, and rollback reuse until fresh provenance is verified

### `RuntimePublicationBundle`

Required fields:

- `runtimePublicationBundleId`
- `releaseRef`
- `releaseApprovalFreezeRef`
- `runtimeTopologyManifestRef`
- `workloadFamilyRefs[]`
- `trustZoneBoundaryRefs[]`
- `gatewaySurfaceRefs[]`
- `routeContractDigestRefs`
- `frontendContractManifestRefs[]`
- `frontendContractDigestRefs[]`
- `designContractPublicationBundleRefs[]`
- `designContractDigestRefs[]`
- `designContractLintVerdictRefs[]`
- `projectionContractFamilyRefs[]`
- `projectionContractVersionRefs[]`
- `projectionContractVersionSetRefs[]`
- `projectionCompatibilityDigestRefs[]`
- `projectionQueryContractDigestRefs[]`
- `mutationCommandContractDigestRefs[]`
- `liveUpdateChannelDigestRefs[]`
- `clientCachePolicyDigestRefs[]`
- `releaseContractVerificationMatrixRef`
- `releaseContractMatrixHash`
- `commandSettlementSchemaSetRef`
- `transitionEnvelopeSchemaSetRef`
- `recoveryDispositionSetRef`
- `routeFreezeDispositionRefs[]`
- `continuityEvidenceContractRefs[]`
- `surfacePublicationRefs`
- `surfaceRuntimeBindingRefs[]`
- `publicationParityRef`
- `topologyTupleHash`
- `bundleTupleHash`
- `buildProvenanceRef`
- `provenanceVerificationState = verified | quarantined | revoked`
- `provenanceConsumptionState = publishable | blocked | withdrawn`
- `publicationState = pending | published | stale | conflict | withdrawn`
- `publishedAt`

Rules:

- one `RuntimePublicationBundle` is the machine-readable runtime contract consumed by shells, gateways, operations, and governance for one promoted `ReleaseCandidate`
- topology is part of that machine-readable runtime contract; workload families, trust-zone boundaries, and published gateway surfaces may not be held outside the bundle as deployment side knowledge
- governance and runtime watch surfaces should compare the published contract against the approved tuple through `ReleasePublicationParityRecord` rather than ad hoc field-by-field inference in the browser or dashboard layer
- if route contracts, design-contract bundles, design-contract lint verdicts, settlement schemas, transition envelopes, recovery dispositions, continuity-evidence contracts, topology tuple, runtime bindings, parity verdicts, or provenance state drift after publication, set `publicationState = stale | conflict | withdrawn` and block writable posture, wave widening, and release stabilization until a fresh bundle is published
- frontend contract manifests, design-contract bundles, projection contract families and versions, projection version sets, query contracts, mutation contracts, live-channel contracts, and cache policies are part of the runtime contract; they may not live only in generated client packages, token-export sidecars, snapshot fixtures, or gateway code comments
- route contracts may not be considered live merely because source files compiled; they become runtime truth only once included in a `RuntimePublicationBundle` whose provenance remains `verified` and whose `surfaceRuntimeBindingRefs[]` still validate against exact parity
- route contracts, frontend manifests, query and mutation contracts, client-cache policy, settlement schemas, transition envelopes, recovery dispositions, and continuity evidence contracts may not be published as unrelated sub-tuples; the current `RuntimePublicationBundle` must resolve one exact `ReleaseContractVerificationMatrix` and `releaseContractMatrixHash`
- `continuityEvidenceContractRefs[]` must include every affected continuity family that live shells depend on, including `patient_nav`, `record_continuation`, `more_info_reply`, `conversation_settlement`, `support_replay_restore`, `intake_resume`, `booking_manage`, `hub_booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement` whenever those behaviors are present in the promoted tuple

### `ReleasePublicationParityRecord`

Required fields:

- `publicationParityRecordId`
- `releaseRef`
- `releaseApprovalFreezeRef`
- `promotionIntentRef`
- `watchTupleHash`
- `waveEligibilitySnapshotRef`
- `runtimePublicationBundleRef`
- `releaseContractVerificationMatrixRef`
- `releaseContractMatrixHash`
- `routeContractDigestRefs[]`
- `frontendContractDigestRefs[]`
- `projectionCompatibilityDigestRefs[]`
- `surfacePublicationRefs[]`
- `surfaceRuntimeBindingRefs[]`
- `activeChannelFreezeRefs[]`
- `recoveryDispositionRefs[]`
- `continuityEvidenceDigestRefs[]`
- `provenanceVerificationState = verified | quarantined | revoked`
- `provenanceConsumptionState = publishable | blocked | withdrawn`
- `bundleTupleHash`
- `parityState = exact | stale | missing | conflict | withdrawn`
- `routeExposureState = converged | constrained | frozen | withdrawn`
- `evaluatedAt`

Rules:

- one `ReleasePublicationParityRecord` is the machine-readable parity verdict consumed by governance, operations, incident, and release-watch shells when they need to know whether the approved tuple still matches live publication truth
- parity must fail closed if any published route contract, frontend contract manifest digest, projection compatibility digest, `ReleaseContractVerificationMatrix`, surface publication, surface runtime binding, recovery disposition, channel freeze, continuity evidence digest, or provenance state drifts from the approved release tuple or watch tuple
- `ReleasePublicationParityRecord` is one constituent of the live `ReleaseWatchTuple`; consumers that need rollout authority must resolve the published tuple rather than relying on parity or `watchTupleHash` in isolation
- widen, stabilize, rollback-readiness, and post-promotion calm posture are invalid unless the active parity record remains `exact`

### `ReleaseCandidate`

Required fields:

- `releaseId`
- `gitRef`
- `artifactDigests`
- `bundleHashRefs`
- `bundleFreezeDigestRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `releaseContractVerificationMatrixRef`
- `releaseContractMatrixHash`
- `environmentCompatibilityRef`
- `schemaMigrationPlanRef`
- `projectionBackfillPlanRef`
- `compatibilityEvidenceRef`
- `runtimeTopologyManifestRef`
- `topologyTupleHash`
- `releaseApprovalFreezeRef`
- `channelManifestSetRef`
- `minimumBridgeCapabilitySetRef`
- `requiredAssuranceSliceRefs`
- `watchTupleHash`
- `publicationParityRef`
- `activeReleaseWatchTupleRefs[]`
- `recoveryDispositionSetRef`
- `continuityEvidenceContractRefs[]`
- `runtimePublicationBundleRef`
- `promotionIntentRefs`
- `sbomRef`
- `provenanceRef`
- `emergencyExceptionRef`
- `approvalRefs`
- `waveState`

### `DeploymentWave`

Required fields:

- `waveId`
- `releaseRef`
- `promotionIntentRef`
- `environment`
- `baselineFingerprintRef`
- `runtimePublicationBundleRef`
- `tenantScope`
- `tenantScopeMode`
- `affectedTenantCount`
- `affectedOrganisationCount`
- `cohortScope`
- `eligibilitySnapshotRef`
- `guardrailSnapshotRef`
- `releaseWatchTupleRef`
- `waveObservationPolicyRef`
- `waveFreezeEpoch`
- `waveControlFenceRef`
- `lastWaveActionSettlementRef`
- `startedAt`
- `completedAt`
- `resultState`

### `SchemaMigrationPlan`

Required fields:

- `migrationPlanId`
- `storeScope`
- `changeType = additive | backfill | contractive | rollforward_only`
- `releaseApprovalFreezeRef`
- `sourceSchemaVersionRefs[]`
- `targetSchemaVersionRefs[]`
- `compatibilityWindow`
- `executionOrder`
- `affectedAudienceSurfaceRefs[]`
- `affectedRouteFamilyRefs[]`
- `routeContractDigestRefs[]`
- `sourceProjectionContractVersionSetRefs[]`
- `targetProjectionContractVersionSetRefs[]`
- `sourceProjectionCompatibilityDigestRefs[]`
- `targetProjectionCompatibilityDigestRefs[]`
- `readPathCompatibilityWindowRef`
- `runtimePublicationBundleRef`
- `releasePublicationParityRef`
- `preCutoverPublicationBundleRef`
- `targetPublicationBundleRef`
- `rollbackPublicationBundleRef`
- `requiredRecoveryDispositionRefs[]`
- `requiredContinuityControlRefs[]`
- `environmentBaselineFingerprintRef`
- `compatibilityEvidenceRef`
- `contractRemovalGuardRef`
- `migrationExecutionBindingRef`
- `verificationRefs`
- `rollbackMode`

### `ProjectionBackfillPlan`

Required fields:

- `backfillPlanId`
- `projectionFamilies`
- `releaseApprovalFreezeRef`
- `sourceEventWindow`
- `expectedLagBudget`
- `rebuildStrategy`
- `affectedAudienceSurfaceRefs[]`
- `routeImpactRefs[]`
- `routeContractDigestRefs[]`
- `projectionContractVersionSetRefs[]`
- `projectionCompatibilityDigestRefs[]`
- `readPathCompatibilityWindowRef`
- `runtimePublicationBundleRef`
- `releasePublicationParityRef`
- `requiredRecoveryDispositionRefs[]`
- `stopResumeFenceRef`
- `syntheticRecoveryCoverageRefs[]`
- `projectionReadinessVerdictRefs[]`
- `lagVisibilityEvidenceRef`
- `cutoverReadinessState = not_ready | ready | blocked`
- `rollbackReadModelRef`
- `migrationExecutionBindingRef`
- `successEvidenceRef`

### `ReadPathCompatibilityWindow`

Required fields:

- `readPathCompatibilityWindowId`
- `migrationPlanRef`
- `projectionBackfillPlanRef`
- `releaseApprovalFreezeRef`
- `releasePublicationParityRef`
- `releaseWatchTupleRef`
- `affectedAudienceSurfaceRefs[]`
- `affectedRouteFamilyRefs[]`
- `sourceRouteContractDigestRefs[]`
- `targetRouteContractDigestRefs[]`
- `sourceProjectionContractVersionSetRefs[]`
- `targetProjectionContractVersionSetRefs[]`
- `sourceProjectionCompatibilityDigestRefs[]`
- `targetProjectionCompatibilityDigestRefs[]`
- `preCutoverPublicationBundleRef`
- `targetPublicationBundleRef`
- `rollbackPublicationBundleRef`
- `requiredRecoveryDispositionRefs[]`
- `requiredContinuityControlRefs[]`
- `windowState = expand_only | dual_read | cutover_ready | constrained | rollback_only | blocked`
- `openedAt`
- `closesAt`

`ReadPathCompatibilityWindow` is the only machine-readable contract proving which route-contract digests and projection-version tuples may read which storage and projection shapes during expand, migrate, rebuild, cutover, and rollback. Scripts, release notes, or operator memory are not authority for mixed-version safety.
The window must bind the same live release tuple, publication parity, recovery posture, and continuity-control obligations that affected shells will actually consume during the change window. A compatibility window that is detached from the live runtime tuple is invalid.

### `ProjectionReadinessVerdict`

Required fields:

- `projectionReadinessVerdictId`
- `backfillPlanRef`
- `migrationExecutionBindingRef`
- `projectionBackfillExecutionLedgerRef`
- `audienceSurfaceRef`
- `routeFamilyRef`
- `projectionFamilyRefs[]`
- `requiredRouteContractDigestRef`
- `requiredProjectionContractVersionSetRef`
- `requiredProjectionCompatibilityDigestRef`
- `readModelVersionSetRef`
- `coverageState = empty | partial | converged | stale | incompatible`
- `lagState = within_budget | breached | rebuild_required | blocked`
- `contractCompatibilityState = exact | additive_compatible | stale | incompatible`
- `freshnessCeilingRef`
- `allowedSurfaceState = live | summary_only | recovery_only | blocked`
- `lastMigrationObservationWindowRef`
- `lastVerifiedAt`

`ProjectionReadinessVerdict` is the route-scoped read truth generated during migration and rebuild work. A surface may keep the shell and last safe summary, but it may not imply calm completeness, no-results truth, or writable follow-through unless the current verdict still allows `live` and the required projection version tuple remains compatible.

### `ReleaseGateEvidence`

Required fields:

- `evidenceId`
- `releaseRef`
- `environment`
- `gateType`
- `result = pass | fail | waived`
- `evidenceRef`
- `recordedAt`
- `ownerRef`

### `AudienceSurfacePublicationRef`

Required fields:

- `surfacePublicationId`
- `audienceSurface`
- `runtimePublicationBundleRef`
- `runtimeTopologyManifestRef`
- `gatewaySurfaceRef`
- `routeContractDigestRef`
- `frontendContractManifestRef`
- `projectionContractVersionSetRef`
- `projectionCompatibilityDigestRef`
- `projectionQueryContractDigestRef`
- `mutationCommandContractDigestRef`
- `liveUpdateChannelDigestRef`
- `clientCachePolicyDigestRef`
- `commandSettlementSchemaRef`
- `transitionEnvelopeSchemaRef`
- `releasePublicationParityRef`
- `tenantIsolationMode`
- `topologyTupleHash`
- `surfaceTupleHash`
- `provenanceConsumptionState = publishable | blocked | withdrawn`
- `publicationState = published | stale | conflict | withdrawn`
- `publishedAt`
- `withdrawnAt`

### `AudienceSurfaceRouteContract`

Required fields:

- `surfaceRouteContractId`
- `audienceSurface`
- `routeFamilyRefs`
- `owningBoundedContextRef`
- `contributingBoundedContextRefs[]`
- `requiredContextBoundaryRefs[]`
- `gatewaySurfaceRef`
- `requiredRuntimeTopologyManifestRef`
- `requiredWorkloadFamilyRefs[]`
- `requiredTenantIsolationMode`
- `allowedActionScopeRefs`
- `projectionSchemaSetRef`
- `visibilityCoverageRefs[]`
- `allowedPurposeOfUseRefs[]`
- `allowedPreviewModes[]`
- `allowedArtifactModes[]`
- `requiredRouteIntentState`
- `requiredReleaseApprovalFreezeRef`
- `requiredChannelFreezeRefs[]`
- `requiredAssuranceSliceTrustRefs[]`
- `requiredPublicationParityState = exact`
- `settlementContractRef`
- `commandSettlementSchemaRef`
- `transitionEnvelopeSchemaRef`
- `sameShellRecoveryPolicyRef`
- `declaredReleaseRecoveryDispositionRef`
- `declaredRouteFreezeDispositionRef`
- `requiredReadPathCompatibilityWindowRef`
- `requiredProjectionReadinessRefs[]`
- `frontendContractManifestRef`
- `requiredProjectionContractVersionSetRef`
- `requiredProjectionCompatibilityDigestRef`
- `projectionQueryContractRefs[]`
- `mutationCommandContractRefs[]`
- `liveUpdateChannelContractRefs[]`
- `clientCachePolicyRef`
- `quietClarityEligibilityGateRef`
- `missionStackFoldPlanRef`
- `emptyStateContractRef`
- `requiredProfileSelectionResolutionRefs[]`
- `requiredSurfaceStateKernelBindingRefs[]`
- `requiredProfileLayeringDigestRef`
- `requiredKernelPropagationDigestRef`
- `requiredAccessibilitySemanticCoverageProfileRefs[]`
- `requiredAutomationAnchorProfileRefs[]`
- `requiredSurfaceStateSemanticsProfileRefs[]`
- `requiredAccessibilityCoverageState = complete`
- `requiredAccessibilityCoverageDigestRef`
- `routeContractDigestRef`
- `surfacePublicationRef`
- `generatedAt`

Rules:

- every mutating browser-facing route family must declare one `AudienceSurfaceRouteContract`
- the contract must bind the affected audience surface to the current `RouteIntentBinding`, published gateway surface, owning bounded context, any declared contributor contexts, required context boundaries, required workload families, tenant-isolation mode, required release tuple, channel freeze posture, assurance-trust requirements, authoritative settlement mode, quiet-posture eligibility, narrow-screen fold plan, and empty-state contract
- the contract must also bind the exact browser-facing query, mutation, live-channel, and cache contracts that route-family code is allowed to consume; shells may not infer those surfaces from component imports, route names, or projection payload shape
- the contract must also bind the exact route-family profile-selection and surface-state-kernel tuple that the shell is allowed to expose; route-local token themes, aria patches, marker aliases, and telemetry names are not substitute authority
- the contract must also bind the exact route-family accessibility coverage, automation-anchor, and surface-state semantics tuple that the shell is allowed to expose; route-local ARIA repairs, selector aliases, or component stories are not substitute authority
- the contract must also bind the active `ProjectionContractVersionSet`; route families may not consume a newer or older projection shape merely because the query code still exists
- every preview, timeline, receipt, artifact, and mutation posture reachable through the route must map to `visibilityCoverageRefs[]`; route-local masking or post-hydration widening cannot substitute for a published coverage row
- the gateway or BFF may not reveal writable posture unless the route family resolves one current `AudienceSurfaceRuntimeBinding`; route contracts, publication refs, runtime bundles, and parity verdicts are inputs to that binding, not independent authority
- contributor contexts may enrich or advise the route, but only `owningBoundedContextRef` may own lifecycle mutation truth, and every cross-context dependency must be declared in `requiredContextBoundaryRefs[]`
- `commandSettlementSchemaRef` and `transitionEnvelopeSchemaRef` must make the authoritative mutation and same-shell recovery posture explicit to runtime consumers; shells may not infer those contracts from route family names alone
- `frontendContractManifestRef` must enumerate the exact `ProjectionQueryContract`, `MutationCommandContract`, `LiveUpdateChannelContract`, and `ClientCachePolicy` refs the route family may consume; undeclared browser surfaces are invalid even if the gateway could technically serve them
- route publication may not imply that a different hostname, service mesh path, or undeclared fallback BFF is safe; the contract is valid only on the published `gatewaySurfaceRef` under the published topology manifest
- route contracts may not treat a non-empty projection, a zero-row result, or an old digest as authoritative completeness when the bound `ReadPathCompatibilityWindow` or `ProjectionReadinessVerdict` says the read model is partial, incompatible, summary-only, or recovery-only
- if migration or backfill posture requires `summary_only | recovery_only | blocked`, the route contract must publish that posture directly; shells may not improvise calm empty states, stale success copy, or writable affordances from local cache alone
- route publication may not advertise calm, writable, verified, or visual-dominant posture when `quietClarityEligibilityGateRef` requires expanded, diagnostic, placeholder, or recovery-only posture or when `requiredAccessibilityCoverageState != complete`
- narrow or embedded variants must degrade through `missionStackFoldPlanRef` and `emptyStateContractRef` rather than ad hoc blank screens, detached success pages, or shell-breaking recovery views

### `AudienceSurfaceRuntimeBinding`

Required fields:

- `audienceSurfaceRuntimeBindingId`
- `audienceSurface`
- `routeFamilyRef`
- `runtimeTopologyManifestRef`
- `gatewaySurfaceRef`
- `surfaceRouteContractRef`
- `surfacePublicationRef`
- `runtimePublicationBundleRef`
- `releasePublicationParityRef`
- `frontendContractManifestRef`
- `projectionContractVersionSetRef`
- `visibilityCoverageRefs[]`
- `coverageState = exact | stale | blocked`
- `profileSelectionResolutionRefs[]`
- `surfaceStateKernelBindingRefs[]`
- `requiredProfileLayeringDigestRef`
- `requiredKernelPropagationDigestRef`
- `profileLayeringState = exact | drifted | blocked`
- `kernelPropagationState = exact | drifted | blocked`
- `accessibilitySemanticCoverageProfileRefs[]`
- `automationAnchorProfileRefs[]`
- `surfaceStateSemanticsProfileRefs[]`
- `requiredAccessibilityCoverageDigestRef`
- `accessibilityCoverageState = complete | degraded | blocked`
- `requiredContextBoundaryRefs[]`
- `contextBoundaryState = exact | stale | blocked`
- `requiredTopologyTupleHash`
- `requiredPublicationParityState = exact`
- `releaseApprovalFreezeRef`
- `requiredChannelFreezeRefs[]`
- `requiredAssuranceSliceTrustRefs[]`
- `releaseTrustFreezeVerdictRef`
- `readPathCompatibilityWindowRef`
- `projectionReadinessVerdictRefs[]`
- `tenantIsolationState = verified | stale | blocked`
- `topologyState = aligned | stale | blocked`
- `routeFreezeDispositionRef`
- `releaseRecoveryDispositionRef`
- `requiredProjectionCompatibilityDigestRef`
- `projectionQueryContractDigestRef`
- `mutationCommandContractDigestRef`
- `liveUpdateChannelDigestRef`
- `clientCachePolicyDigestRef`
- `browserBoundaryState = exact | stale | blocked`
- `projectionCompatibilityState = exact | additive_compatible | stale | blocked`
- `bindingState = publishable_live | recovery_only | read_only | blocked`
- `surfaceTupleHash`
- `validatedAt`

Rules:

- every writable or calmly trustworthy audience surface must resolve one `AudienceSurfaceRuntimeBinding` before any live controls, success language, or action-capable route shell is exposed
- the binding is the single machine-readable verdict for route writability; gateways, shells, operations, governance, and support tooling may not separately infer truth from route contract, publication ref, runtime bundle, or parity fragments
- the binding is also the single machine-readable verdict for browser boundary authority; query, command, channel, and cache contracts may not be stitched together from a different publication snapshot than the active route contract
- the binding is also the single machine-readable verdict for projection compatibility; shells may not recompute mixed-version safety from query digests, read-model row counts, or migration status badges
- `bindingState = publishable_live` is legal only while the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`, `RuntimePublicationBundle.publicationState = published`, `releasePublicationParityRef.parityState = exact`, `coverageState = exact`, `profileLayeringState = exact`, `kernelPropagationState = exact`, `accessibilityCoverageState = complete`, `contextBoundaryState = exact`, `topologyState = aligned`, `tenantIsolationState = verified`, provenance consumption remains `publishable`, the bound `ReadPathCompatibilityWindow.windowState` remains compatible with the current route digest, and every linked `ProjectionReadinessVerdict.allowedSurfaceState = live`
- `browserBoundaryState = exact` is legal only while the linked manifest and all bound query, mutation, live-channel, and cache digests match the published bundle and the current `GatewayBffSurface.surfaceAuthorityTupleHash`
- `projectionCompatibilityState = exact | additive_compatible` is legal only while the linked `ProjectionContractVersionSet` and `requiredProjectionCompatibilityDigestRef` still match the published bundle and the current `ReadPathCompatibilityWindow`
- `bindingState = read_only` is mandatory when `ReleaseTrustFreezeVerdict.surfaceAuthorityState = diagnostic_only`; shells may preserve continuity and diagnostics, but they may not imply calm live or writable posture
- if publication, parity, profile layering, kernel propagation, accessibility coverage, context-boundary evidence, topology, tenant-isolation, provenance, channel freeze, assurance posture, read-path compatibility, projection readiness, projection compatibility, or browser-boundary digests drift, the binding must degrade to `recovery_only | read_only | blocked` and carry the governing `ReleaseRecoveryDisposition` or `RouteFreezeDisposition`; generic error fall-through is invalid
- `surfaceTupleHash` must prove that the bound route contract digest, manifest digest, profile-layering digest, kernel-propagation digest, accessibility coverage digest, projection compatibility digest, query or command digests, visibility coverage hashes, context-boundary tuple, publication tuple, topology tuple, recovery dispositions, `ReleaseTrustFreezeVerdict`, and watch tuple were validated together rather than stitched from mixed snapshots

### `WaveActionRecord`

High-priority wave-control defects in this layer:

1. wave actions bind to `releaseRef` and `waveRef`, but not yet to the frozen eligibility, guardrail, and audience-surface scope they are meant to change
2. concurrent control actions can still race because the record does not require expected wave state, predecessor state, or fence-epoch matching before execution
3. operator intent is compressed into `actingContextRef`, so destructive actions do not yet prove which approval package, runbook, or emergency exception authorized them
4. settlement treats control success as a single moment, but does not separate control-plane acceptance from observed rollout convergence across probes and surface posture
5. rollback, rollforward, pause, resume, and kill-switch actions are not yet chained through one causal lineage, so later actions cannot reliably supersede or reverse earlier ones

Add the supporting wave-control contracts:

**ReleaseWatchEvidenceCockpit**
`releaseWatchEvidenceCockpitId`, `governanceReviewPackageRef`, `releaseApprovalFreezeRef`, `releaseWatchTupleRef`, `watchTupleHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `waveGuardrailSnapshotRef`, `waveObservationPolicyRef`, `waveControlFenceRef`, `operationalReadinessSnapshotRef`, `activeWaveActionImpactPreviewRef`, `activeWaveActionExecutionReceiptRef`, `activeWaveActionObservationWindowRef`, `activeWaveActionLineageRef`, `activeWaveActionSettlementRef`, `rollbackTargetPublicationBundleRef`, `rollbackRunbookBindingRefs[]`, `rollbackReadinessEvidenceRefs[]`, `governanceContinuityEvidenceBundleRef`, `governanceEvidencePackArtifactRef`, `activeChannelFreezeRefs[]`, `recoveryDispositionRefs[]`, `previewState = exact | stale | missing`, `executionState = none | accepted | rejected | deduplicated | stale`, `observationState = pending | satisfied | constrained | rollback_required | freeze_conflict | stale`, `rollbackReadinessState = ready | constrained | blocked | stale`, `cockpitState = active | stale | superseded | closed`, `cockpitHash`, `publishedAt`, `supersededAt`

`ReleaseWatchEvidenceCockpit` is the single runtime and governance evidence cockpit for one promoted wave step. It binds the exact published watch tuple, current publication parity, current guardrail snapshot, current action lineage, current observation result, and current rollback readiness to one machine-readable hash so watch and rollback can no longer depend on dashboards, chat, or operator memory.

Rules:

- each canary start, widen, resume, rollback, kill-switch, or rollforward step must publish or supersede one `ReleaseWatchEvidenceCockpit` over the current `GovernanceReviewPackage`, `ReleaseApprovalFreeze`, `ReleaseWatchTuple`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `WaveGuardrailSnapshot`, `WaveObservationPolicy`, `WaveControlFence`, and `OperationalReadinessSnapshot` before control surfaces may advertise live authority
- `cockpitState = active` is legal only while the bound tuple, publication bundle, parity verdict, guardrail snapshot, continuity evidence, runbook bindings, and last applicable `WaveActionSettlement` all still agree on one current `cockpitHash`
- `executionState = accepted` proves control-plane acceptance only; any surface that implies live convergence, rollback safety, or stabilization must also prove `observationState = satisfied` and a non-blocked `rollbackReadinessState` from the same cockpit
- rollback target, rollback runbooks, and rollback evidence must remain visible from the same cockpit before and after action acceptance; hidden rollback targets, stale runbooks, or inferred reversal posture are invalid
- if action preview, action receipt, action lineage, observation result, rollback target, publication parity, channel freeze posture, or recovery disposition changes, supersede the cockpit and keep shells on bounded revalidation rather than mutating watch truth in place

**WaveActionImpactPreview**
`impactPreviewId`, `waveRef`, `releaseWatchEvidenceCockpitRef`, `releaseWatchTupleRef`, `eligibilitySnapshotRef`, `guardrailSnapshotRef`, `waveObservationPolicyRef`, `releaseApprovalFreezeRef`, `watchTupleHash`, `watchEvidenceCockpitHash`, `publicationParityRef`, `audienceSurfaceContractRefs[]`, `runtimePublicationBundleRef`, `continuityEvidenceDigestRefs[]`, `tenantCount`, `cohortCount`, `routeFamilyRefs[]`, `predictedRecoveryDispositionRefs[]`, `blockingDependencyRefs[]`, `previewedAt`

`WaveActionImpactPreview` freezes the blast radius and expected audience consequences of a wave action before execution. It must preview the exact published watch tuple, cockpit hash, publication parity, recovery posture, continuity evidence, and observation duty the operator expects to remain true after the action settles.

**WaveActionExecutionReceipt**
`executionReceiptId`, `waveActionRecordRef`, `releaseWatchEvidenceCockpitRef`, `releaseWatchTupleRef`, `controlPlaneTxRef`, `executionFenceEpoch`, `acceptedWatchTupleHash`, `acceptedWatchEvidenceCockpitHash`, `acceptedState = accepted | rejected | deduplicated`, `acceptedAt`, `acceptedByRef`, `downstreamDispatchRefs[]`

`WaveActionExecutionReceipt` proves whether the control plane actually accepted the action under the expected fence epoch and exact cockpit hash.

**WaveActionObservationWindow**
`observationWindowId`, `waveActionRecordRef`, `releaseWatchEvidenceCockpitRef`, `releaseWatchTupleRef`, `waveObservationPolicyRef`, `watchEvidenceCockpitHash`, `startsAt`, `closesAt`, `requiredProbeRefs[]`, `observedWaveState`, `observedEligibilitySnapshotRef`, `observedGuardrailSnapshotRef`, `observedRuntimePublicationBundleRef`, `observedPublicationParityRef`, `observedContinuityEvidenceRefs[]`, `observedRecoveryDispositionRefs[]`, `observedRollbackReadinessState = ready | constrained | blocked | stale`, `observedProvenanceState = verified | quarantined | revoked`, `routePostureState = converged | constrained | rollback_required | freeze_conflict`, `observationState = open | extended | satisfied | expired | superseded`, `closedAt`

`WaveActionObservationWindow` distinguishes accepted control intent from observed live convergence. Publication parity, continuity evidence, recovery posture, rollback readiness, and minimum dwell obligations must be observed explicitly rather than inferred from rollout metrics alone.

**WaveActionLineage**
`waveActionLineageId`, `releaseWatchEvidenceCockpitRef`, `watchEvidenceCockpitHash`, `rootWaveActionRef`, `predecessorWaveActionRef`, `reversalTargetWaveActionRef`, `supersededActionRefs[]`, `emergencyExceptionRef`, `lineageState = active | superseded | reversed | completed`

`WaveActionLineage` makes wave-control causality explicit across pause, resume, rollback, rollforward, widen, and kill-switch sequences.

Required fields:

- `waveActionRecordId`
- `releaseRef`
- `waveRef`
- `actionType = widen | pause | resume | rollback | kill_switch | rollforward`
- `verificationScenarioRef`
- `releaseWatchEvidenceCockpitRef`
- `releaseWatchTupleRef`
- `watchEvidenceCockpitHash`
- `waveEligibilitySnapshotRef`
- `guardrailSnapshotRef`
- `runtimePublicationBundleRef`
- `publicationParityRef`
- `audienceSurfaceContractRefs[]`
- `waveObservationPolicyRef`
- `waveControlFenceRef`
- `expectedWaveState`
- `expectedWaveFenceEpoch`
- `expectedPredecessorSettlementRef`
- `releaseApprovalFreezeRef`
- `actingContextRef`
- `approvalBundleRef`
- `impactPreviewRef`
- `waveActionLineageRef`
- `idempotencyKey`
- `createdAt`
- `settledAt`

### `WaveActionSettlement`

Required fields:

- `waveActionSettlementId`
- `waveActionRecordRef`
- `result = pending_probe | accepted_pending_observation | applied | blocked_guardrail | stale_wave | denied_scope | evidence_required | superseded | failed`
- `releaseWatchEvidenceCockpitRef`
- `releaseWatchTupleRef`
- `watchEvidenceCockpitHash`
- `evidenceRef`
- `executionReceiptRef`
- `observationWindowRef`
- `waveObservationPolicyRef`
- `observedWaveState`
- `observedEligibilitySnapshotRef`
- `observedGuardrailSnapshotRef`
- `observedRuntimePublicationBundleRef`
- `observedPublicationParityRef`
- `observedContinuityEvidenceRefs[]`
- `observedRecoveryDispositionRefs[]`
- `observedRollbackReadinessState`
- `observedProvenanceState`
- `observationState`
- `recoveryActionRef`
- `supersededByWaveActionRef`
- `recordedAt`

Rules:

- every `WaveActionRecord` must bind one exact `releaseWatchTupleRef`, which in turn binds the exact `waveEligibilitySnapshotRef`, `guardrailSnapshotRef`, `waveObservationPolicyRef`, and audience-surface scope for that wave step; wave controls may not operate against a moving target or an inferred blast radius
- every `WaveActionRecord`, `WaveActionImpactPreview`, `WaveActionExecutionReceipt`, `WaveActionObservationWindow`, `WaveActionLineage`, and `WaveActionSettlement` must bind one exact `releaseWatchEvidenceCockpitRef` and `watchEvidenceCockpitHash`; partial joins over tuple hash, dashboards, or incident notes are not an authoritative wave-control path
- execution is valid only when `expectedWaveState`, `expectedWaveFenceEpoch`, `expectedPredecessorSettlementRef`, `releaseApprovalFreezeRef`, `publicationParityRef`, `runtimePublicationBundleRef`, `releaseWatchEvidenceCockpitRef`, `watchEvidenceCockpitHash`, and `waveActionLineageRef.predecessorWaveActionRef` still match live wave truth under `releaseWatchTupleRef.tupleState = active`; stale buttons, scripts, or duplicated retries must settle as `stale_wave` or `superseded`
- `approvalBundleRef` must prove the allowed action scope, required runbook or operator guidance, and any active `EmergencyReleaseException`; `actingContextRef` alone is not sufficient authorization for pause, rollback, kill-switch, or rollforward
- `WaveActionSettlement.result = applied` is allowed only after `executionReceiptRef.acceptedState = accepted`, `observationWindowRef.observationState = satisfied`, `observationWindowRef.routePostureState = converged`, `observedRuntimePublicationBundleRef` matches the previewed publication bundle, `observedPublicationParityRef.parityState = exact`, the observed continuity and recovery sets match the previewed watch tuple, `observedRollbackReadinessState != blocked`, and `observedProvenanceState = verified`; control-plane acceptance without live convergence must remain `accepted_pending_observation` or `pending_probe`
- rollback, rollforward, resume, and kill-switch actions must reference the prior causal chain through `waveActionLineageRef`; when one action supersedes another, the earlier settlement must point at `supersededByWaveActionRef` rather than remaining ambiguously final
- if observed eligibility, guardrail posture, audience-surface recovery disposition, publication bundle, publication parity, continuity evidence, rollback readiness, provenance state, cockpit hash, or active watch tuple differs from the action preview, the settlement must attach corrective evidence and surface `blocked_guardrail`, `pending_probe`, `stale_wave`, or rollback-oriented recovery instead of reporting clean success

## Runtime rules

- `public_edge` may terminate TLS, enforce origin policy, rate limits, and attack-surface filtering, but it may not assemble PHI, call adapters, or bypass the published gateway boundary.
- `shell_delivery` may serve compiled shells, static assets, and published bridge or manifest metadata, but it may not execute patient or staff mutations, projection joins, or supplier egress.
- `GatewayBffSurface` is the only browser-facing compute plane; it may call only the command, projection, assurance, and integration families declared by the current `RuntimeTopologyManifest`.
- `command` workloads execute mutations, leases, and outbox initiation, but they do not serve browser reads or bypass declared integration boundaries for side effects.
- `projection` workloads assemble audience-safe reads and live deltas, but they do not become a second mutation or adapter plane.
- `integration` workloads own external egress, callback ingress, and transport correlation under `AdapterContractProfile`; they do not host browser sessions, calm user-facing projection reads, or ad hoc admin scripts.
- `data` workloads are never browser-addressable and may be reached only through the declared command, projection, integration, or assurance families under published trust-zone boundaries.
- `assurance_security` workloads publish trust, redaction, policy, and detection verdicts, and degraded assurance slices may only affect the dependent bindings and workload families named by the active profile rather than blacking out unrelated planes.
- Browsers terminate only at the public edge and gateway or BFF layer.
- No browser may call GP-system, telephony, messaging, pharmacy, MESH, workflow, or audit services directly.
- All mutations enter through command routes protected by `ScopedMutationGate`.
- All patient and staff list or detail views read from projection contracts, not transactional stores.
- Every storage record, object prefix, cache key, and emitted event must carry `tenantId`; cross-tenant access is allowed only through explicit acting context and immutable audit.
- All service-to-service traffic must use workload identity and mutual authentication.
- Object storage remains private; downloads use short-lived signed URLs created only after authz and visibility checks.
- External dependencies must publish through explicit outbox and inbox boundaries with retry policy and dead-letter handling.
- Each dependency must declare a `DependencyDegradationProfile` so the UI and queue logic know how to fail soft instead of inventing silent partial success.
- Every writable gateway surface must validate the pinned `ReleaseApprovalFreeze`, any required `ChannelReleaseFreezeRecord`, current assurance posture, and one exact `ReleaseTrustFreezeVerdict(surfaceAuthorityState = live)` before revealing mutable affordances.
- Every writable gateway surface must validate one current `AudienceSurfaceRuntimeBinding(bindingState = publishable_live)`; route contracts, surface publication refs, runtime bundles, and parity fragments may not be checked independently in different layers.
- Gateways, automation paths, and shell-side caches may not reconstruct live authority from raw trust rows, channel manifests, or guardrail fragments when the published `ReleaseTrustFreezeVerdict` disagrees; the verdict wins.
- Every writable gateway surface must also validate that the linked `RuntimePublicationBundle.publicationState = published`, `ReleasePublicationParityRecord.parityState = exact`, and `BuildProvenanceRecord.runtimeConsumptionState = publishable`; shells may not rely on unpublished, withdrawn, provenance-blocked, or parity-drifted contracts.
- If release, channel, or assurance posture fails, the surface must apply one governed `ReleaseRecoveryDisposition` rather than falling through to generic `unknown_failure`.

## Environment ring and promotion contract

High-priority promotion defects in this layer:

1. ring progression assumes environments are equivalent, but there is no explicit baseline fingerprint proving the target ring still matches the approved runtime and policy shape
2. `ReleaseCandidate` freezes behavior artifacts, but not yet through one promotion-intent envelope that expires if gate evidence, manifests, or compatibility drift before advancement
3. staged tenant and cohort rollout is named, but not bound to one frozen eligibility snapshot, so a wave can silently change who is eligible while it is in flight
4. wave pause, rollback, and resume are implied operationally, but not modeled as one control fence with explicit halt criteria and resumption evidence
5. emergency release exists in prose only, which leaves compensating controls, expiry, reconciliation, and rollback discipline under-specified

Use one promotion path:

- `local`
- `ci-preview`
- `integration`
- `preprod`
- `production`

Add the supporting promotion contracts:

**EnvironmentBaselineFingerprint**
`baselineFingerprintId`, `environment`, `runtimeManifestRef`, `topologyTupleHash`, `infrastructureModuleSetRef`, `policyTemplateSetRef`, `networkBoundaryRef`, `secretClassSetRef`, `manifestDigest`, `channelManifestSetRef`, `minimumBridgeCapabilitySetRef`, `releaseApprovalFreezeRef`, `driftState = aligned | drift_detected | quarantined`, `capturedAt`

`EnvironmentBaselineFingerprint` proves that the target ring still matches the approved runtime shape. Promotion into a ring with `driftState != aligned` is blocked until the drift is reconciled or a new approved release intent is issued. Channel manifests, bridge floors, and frozen release posture are part of that baseline, not optional sidecars.

**PromotionIntentEnvelope**
`promotionIntentId`, `releaseRef`, `sourceRing`, `targetRing`, `environmentBaselineFingerprintRef`, `bundleFreezeDigestRef`, `environmentCompatibilityRef`, `runtimeTopologyManifestRef`, `topologyTupleHash`, `compiledPolicyBundleRef`, `configCompilationRecordRef`, `configSimulationEnvelopeRef`, `approvalEvidenceBundleRef`, `standardsDependencyWatchlistRef`, `baselineTupleHash`, `approvalTupleHash`, `compilationTupleHash`, `standardsWatchlistHash`, `releaseApprovalFreezeRef`, `channelManifestSetRef`, `minimumBridgeCapabilitySetRef`, `requiredAssuranceSliceRefs`, `watchTupleHash`, `gateEvidenceRefs`, `migrationPlanRefs`, `backfillPlanRefs`, `waveObservationPolicyTemplateRef`, `approvedByRefs`, `expiresAt`

`PromotionIntentEnvelope` is the only authority for advancing a `ReleaseCandidate` from one ring to the next. If compatibility evidence, bundle freeze, config compilation record, config simulation envelope, approval bundle, standards watchlist, `baselineTupleHash`, `approvalTupleHash`, compilation tuple, baseline fingerprint, runtime topology tuple, release freeze, channel manifest set, bridge floors, watch tuple, wave-observation policy template, or gate evidence changes after approval, the intent expires and the release must be re-approved before promotion continues.

**WaveEligibilitySnapshot**
`eligibilitySnapshotId`, `releaseRef`, `promotionIntentRef`, `environment`, `runtimePublicationBundleRef`, `publicationParityRef`, `tenantScopeRef`, `tenantScopeMode`, `affectedTenantCount`, `affectedOrganisationCount`, `tenantScopeTupleHash`, `cohortScopeRef`, `policyBundleRef`, `dependencyPostureRef`, `releaseApprovalFreezeRef`, `requiredAssuranceSliceRefs`, `watchTupleHash`, `selectionDigest`, `frozenAt`

`WaveEligibilitySnapshot` freezes who is included in a staged rollout and under which dependency, assurance, and policy posture. Operators may pause or narrow a wave, but they may not widen or silently reshuffle eligibility without generating a new snapshot and linked promotion intent.

**WaveControlFence**
`waveControlFenceId`, `waveRef`, `guardrailSnapshotRef`, `waveObservationPolicyRef`, `activeReleaseWatchEvidenceCockpitRef`, `watchEvidenceCockpitHash`, `haltConditionRefs`, `rollbackEntryCriteriaRef`, `rollbackMode = none | cohort_rewind | environment_revert | rollforward_only`, `resumeEvidenceRefs`, `lastWaveActionSettlementRef`, `state = armed | halted | resumed | completed`

`WaveControlFence` governs wave pause, rollback, and resume. A halted wave may not resume until the specific blocking evidence is attached, rollback posture must be declared before the wave starts rather than improvised during an incident, and the current fence state must stay bound to the active `ReleaseWatchEvidenceCockpit` rather than a dashboard-local control banner.

**EmergencyReleaseException**
`emergencyExceptionId`, `releaseRef`, `incidentRef`, `allowedDeltaScope`, `compensatingControlRefs`, `temporaryRiskOwnerRef`, `expiresAt`, `reconciliationDueAt`, `closureEvidenceRef`

`EmergencyReleaseException` makes emergency promotion explicit and temporary. Emergency releases still move through the same rings and artifacts, but they carry narrower allowed scope, stronger compensating controls, and a mandatory reconciliation deadline that blocks silent normalization into BAU.

Rules:

- Every environment must be created from the same infrastructure modules and policy templates.
- Production-only manual configuration is forbidden; environment differences must be declared in versioned manifests.
- Promotion moves immutable artifact digests and approved bundle hashes forward; it does not rebuild from source separately in each environment.
- A `ReleaseCandidate` that changes behavior must freeze `bundleHashRefs`, `compilationTupleHash`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, `runtimeTopologyManifestRef`, `topologyTupleHash`, and `projectionBackfillPlanRef` as one approval unit; none of them may drift independently after approval.
- every ring advancement must be backed by one live `PromotionIntentEnvelope` and one aligned `EnvironmentBaselineFingerprint`
- every ring advancement must also prove that `compiledPolicyBundleRef`, `configCompilationRecordRef`, `configSimulationEnvelopeRef`, `approvalEvidenceBundleRef`, `standardsDependencyWatchlistRef`, and `releaseApprovalFreezeRef` still resolve the same `baselineTupleHash`, `approvalTupleHash`, `compilationTupleHash`, `candidateBundleHash`, and `standardsWatchlistHash`
- Tenant rollout may be staged by organisation, cohort, or capability, but the runtime artifact remains identical across waves.
- each staged rollout must use one `WaveEligibilitySnapshot` so eligibility, dependency posture, and policy bundle are frozen for the duration of that wave
- `PromotionIntentEnvelope`, `WaveGuardrailSnapshot`, and `ReleaseWatchTuple` must all agree on `baselineTupleHash` and `approvalTupleHash`; waves may not widen, stabilize, or roll back against a rebased review package
- `PromotionIntentEnvelope`, `ReleaseApprovalFreeze`, and `VerificationScenario` must all agree on `standardsDependencyWatchlistRef` and `standardsWatchlistHash`; promotion tooling may not downgrade blocked hygiene findings into advisory notes between compile, approval, and ring advancement
- `WaveEligibilitySnapshot`, `WaveGuardrailSnapshot`, and `ReleaseWatchTuple` must all agree on tenant scope mode, affected-tenant count, affected-organisation count, and `tenantScopeTupleHash`; mixed blast-radius generations are forbidden
- each canary or widening step must also publish one `WaveObservationPolicy` and one `ReleaseWatchTuple` over the current promotion intent, `WaveEligibilitySnapshot`, `WaveGuardrailSnapshot`, `WaveControlFence`, runtime publication bundle, and parity record before live rollout starts
- each canary or widening step must also publish one `ReleaseWatchEvidenceCockpit` over the current review package, watch tuple, runtime publication bundle, observation policy, fence, and operational readiness snapshot before live watch, rollback, or export surfaces may arm
- every `DeploymentWave` must start with an armed `WaveControlFence`; halt, rollback, and resume behavior may not depend on operator folklore or ad hoc runbooks
- every promoted release must also pin one `ReleaseApprovalFreeze`; embedded or channel-specific rollout may not widen if manifest, bridge-floor, or freeze posture no longer matches that tuple
- every live wave must materialize one `WaveGuardrailSnapshot`; if any required `AssuranceSliceTrustRecord` is `degraded` or `quarantined`, or any linked `ChannelReleaseFreezeRecord` becomes active, widening is blocked and the wave may only narrow, halt, or roll back under the declared fence
- if eligibility scope, tenant blast radius, publication parity, continuity evidence, recovery disposition, or observation duty changes, the current `ReleaseWatchTuple` must be superseded; wave actions may not operate against mixed generations of those facts
- if action preview, execution receipt, observation result, rollback target, runbook binding, or evidence-pack generation changes for the live tuple, the current `ReleaseWatchEvidenceCockpit` must be superseded; watch and rollback may not operate against mixed generations of those facts
- stabilization is illegal until the active `ReleaseWatchTuple.tupleState = active`, the last applicable `WaveActionSettlement.result = applied`, and the bound `WaveObservationPolicy.policyState = satisfied`
- Emergency changes still create a `ReleaseCandidate`; shell access, SQL consoles, or ad hoc script execution must not become the real change path.
- any release promoted under emergency conditions must carry `EmergencyReleaseException`; expiry or missed reconciliation automatically blocks further widening, reuse, or subsequent promotion until closure evidence is attached

## Frontend and backend integration contract

Use a governed gateway or backend-for-frontend boundary for each audience family:

- patient surface
- workspace surface
- hub surface
- operations and admin surface

Rules:

- Read contracts must be projection-first and audience-safe. The browser never assembles PHI by joining raw services.
- Mutation contracts must require idempotency keys, freshness tokens, acting context, and the current `RouteIntentBinding` where the action scope demands them.
- Every gateway ingress, callback adapter, queue consumer, projection applier, and audit writer must preserve one immutable `edgeCorrelationId`; transport-local correlation or trace IDs may supplement it, but they may not replace the end-to-end causality spine.
- Every mutating route family must publish one `AudienceSurfaceRouteContract` and return an authoritative `CommandSettlementRecord`; optimistic UI state, transport success, or stale projection drift are not valid substitutes for settled command truth.
- Every mutating route family must also declare which proof class closes user-visible settlement: `projection_visible`, `external_confirmation`, `review_disposition`, or `recovery_disposition`. `ui.transition.server_accepted` is never a terminal proof class.
- Embedded or channel-specific write surfaces must validate the current `ReleaseApprovalFreeze`, any required `ChannelReleaseFreezeRecord`, required `AssuranceSliceTrustRecord` rows, and the shared `ReleaseTrustFreezeVerdict(surfaceAuthorityState = live)` before writable posture is exposed.
- Embedded or channel-specific route families must also publish one route-scoped embedded eligibility contract generated from the current manifest, minimum bridge capabilities, recovery disposition, and continuity evidence requirements; shells may not infer that contract from user-agent heuristics or raw bridge availability.
- Live updates should default to one typed stream contract per surface, with deterministic reconnect, stale-state, and downgrade behavior, and command-following surfaces must materialize one `UIProjectionVisibilityReceipt` or equivalent visibility proof when the awaited token becomes visible, stale, superseded, or blocked.
- Every sync route must have a generated schema, typed client, and contract test.
- Every async stream or webhook must have a versioned channel contract and compatibility test.
- each audience family must resolve one published `GatewayBffSurface` from the active `RuntimeTopologyManifest`; hostnames, DNS paths, ingress rules, or client environment variables are not the authority contract
- if a route family requires a different tenant-isolation mode, trust-zone boundary, or downstream workload set, split it into a different `GatewayBffSurface` instead of branching inside one broad BFF
- No behavior-changing release may promote unless `compatibilityEvidenceRef` proves that approved bundle hashes remain compatible with the target surface schemas, projection rebuild plans, and typed live-stream contracts for the affected audiences.
- Release-wave actions such as widen, pause, rollback, kill-switch, or rollforward must execute through `WaveActionRecord` and return `WaveActionSettlement`; shell buttons, dashboards, or scripts may not bypass that settlement path.
- Every writable route family exposed through a gateway must declare whether it depends on channel manifests, minimum bridge capabilities, or release freezes; those dependencies must be generated into the typed contract rather than held as side knowledge in the shell.
- If a route family is blocked by release, channel, or assurance posture, the generated contract must also declare the corresponding `ReleaseRecoveryDisposition` so bounded read-only, placeholder, redirect, or governance handoff behavior is testable before rollout.
- Error families must be typed at minimum as `validation`, `auth`, `scope`, `stale_view`, `conflict`, `dependency_degraded`, `safety_blocked`, and `unknown_failure`.

## Data persistence and migration contract

The migration and backfill control seam requires five corrections:

1. schema and backfill plans still described storage change, but not the exact runtime-publication, route-contract, and audience recovery tuple they would disturb
2. operator-triggered migration and backfill control still had no canonical route-intent and settlement chain, so local execution acknowledgement could outrun authoritative posture
3. migration windows must include one explicit same-shell recovery contract for affected audiences when rollout, publication, or compatibility drift failed mid-change
4. migration explainers, backfill status views, compatibility reports, and recovery guides were still loose operational files rather than governed artifacts
5. operator-facing migration and backfill actions still did not explicitly require canonical UI observability and disclosure fencing

Keep the data model explicit:

- transactional domain aggregates and control-plane writes in the authoritative relational store
- versioned `FhirRepresentationSet` and `FhirResourceRecord` rows in the clinical representation or FHIR-capable store, materialized only from published mapping contracts
- immutable events on the event spine
- audience projections in dedicated read stores
- binary artifacts in object storage
- immutable audit in the WORM ledger

Runtime, rollout, and migration controls must preserve the domain and FHIR layers separately. A storage migration may move, reindex, or reprofile FHIR artifacts, but it may not repurpose aggregate identifiers as resource identifiers, backfill raw FHIR rows directly into audience projections, or let adapters infer new mapping behavior without a published contract revision.

Add the migration control objects:

**MigrationExecutionBinding**
`migrationExecutionBindingId`, `migrationPlanRef`, `projectionBackfillPlanRef`, `verificationScenarioRef`, `environmentBaselineFingerprintRef`, `releaseApprovalFreezeRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `runtimePublicationBundleRef`, `audienceSurfaceRuntimeBindingRefs[]`, `routeContractDigestRefs[]`, `projectionContractVersionSetRefs[]`, `projectionCompatibilityDigestRefs[]`, `readPathCompatibilityWindowRef`, `readPathCompatibilityDigestRef`, `projectionReadinessVerdictRefs[]`, `projectionBackfillExecutionLedgerRef`, `migrationCutoverCheckpointRef`, `preCutoverPublicationBundleRef`, `targetPublicationBundleRef`, `rollbackPublicationBundleRef`, `requiredRecoveryDispositionRefs[]`, `requiredContinuityControlRefs[]`, `bindingTupleHash`, `provenanceState`, `cutoverState = staging | dual_read | cutover_ready | contract_pending | rollback_only | blocked`, `bindingState = ready | stale | blocked | withdrawn`, `lastMigrationActionSettlementRef`, `validatedAt`

**MigrationImpactPreview**
`migrationImpactPreviewId`, `migrationExecutionBindingRef`, `releaseWatchTupleRef`, `readPathCompatibilityDigestRef`, `projectionCompatibilityDigestRefs[]`, `projectionBackfillExecutionLedgerRef`, `migrationCutoverCheckpointRef`, `affectedAudienceSurfaceRefs[]`, `affectedRouteFamilyRefs[]`, `expectedLiveRouteRefs[]`, `expectedSummaryOnlyRouteRefs[]`, `expectedRecoveryOnlyRouteRefs[]`, `expectedBlockedRouteRefs[]`, `requiredRecoveryDispositionRefs[]`, `requiredContinuityControlRefs[]`, `previewedAt`

`MigrationImpactPreview` freezes the exact route and recovery blast radius of a migration or backfill action before execution. Operators may not launch start, pause, resume, cutover, or abort actions from a generic progress banner or shell-local understanding of affected routes.

**MigrationExecutionReceipt**
`migrationExecutionReceiptId`, `migrationActionRecordRef`, `migrationExecutionBindingRef`, `controlPlaneTxRef`, `executionFenceEpoch`, `acceptedBindingTupleHash`, `acceptedState = accepted | rejected | deduplicated`, `acceptedAt`, `acceptedByRef`

`MigrationExecutionReceipt` proves whether the control plane accepted the migration action against the expected execution tuple.

**MigrationActionObservationWindow**
`migrationObservationWindowId`, `migrationActionRecordRef`, `migrationExecutionBindingRef`, `releaseWatchTupleRef`, `startsAt`, `closesAt`, `requiredProbeRefs[]`, `observedRuntimePublicationBundleRef`, `observedPublicationParityRef`, `observedReadPathCompatibilityWindowRef`, `observedReadPathCompatibilityDigestRef`, `observedProjectionCompatibilityDigestRefs[]`, `observedProjectionReadinessVerdictRefs[]`, `observedProjectionBackfillExecutionLedgerRef`, `observedMigrationCutoverCheckpointRef`, `observedAudienceSurfaceRuntimeBindingRefs[]`, `observedRecoveryDispositionRefs[]`, `routePostureState = converged | constrained | rollback_required | freeze_conflict`, `observationState = open | satisfied | stale | rollback_required | superseded`, `closedAt`

`MigrationActionObservationWindow` distinguishes accepted migration control intent from observed route-state convergence. Backfill progress, cutover readiness, and route recovery posture must be observed explicitly rather than inferred from job logs, row counts, or operator memory.

**MigrationActionRecord**
`migrationActionRecordId`, `routeIntentBindingRef`, `migrationExecutionBindingRef`, `releaseWatchTupleRef`, `releasePublicationParityRef`, `readPathCompatibilityDigestRef`, `projectionBackfillExecutionLedgerRef`, `migrationCutoverCheckpointRef`, `audienceSurfaceRuntimeBindingRefs[]`, `actionType = start_migration | pause_backfill | resume_backfill | complete_migration | abort_migration`, `expectedBindingState`, `expectedCutoverState`, `impactPreviewRef`, `environmentRef`, `storeScopeRef`, `backfillPlanRef`, `submittedBy`, `submittedAt`, `idempotencyKey`, `commandActionRecordRef`

**MigrationActionSettlement**
`migrationActionSettlementId`, `migrationActionRecordRef`, `commandSettlementRecordRef`, `transitionEnvelopeRef`, `result = applied | accepted_pending_observation | stale_recoverable | blocked_policy | rollback_required | failed`, `executionReceiptRef`, `observationWindowRef`, `observedPublicationParityRef`, `observedReadPathCompatibilityDigestRef`, `observedProjectionBackfillExecutionLedgerRef`, `observedMigrationCutoverCheckpointRef`, `observedProjectionReadinessVerdictRefs[]`, `observationState`, `releaseRecoveryDispositionRef`, `compatibilityEvidenceRef`, `supersededByMigrationActionRef`, `settledAt`

**MigrationPresentationArtifact**
`migrationPresentationArtifactId`, `artifactType = migration_explainer | backfill_status_report | compatibility_window_report | migration_recovery_guide`, `migrationExecutionBindingRef`, `summaryRef`, `artifactPresentationContractRef`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `maskingPolicyRef`, `summarySafetyTier`, `artifactState = summary_only | governed_preview | external_handoff_ready | recovery_only`

Migration rules:

- Use expand-migrate-contract for all schema evolution that touches live traffic.
- Do not drop or repurpose a field in the same release that introduces a new read path.
- Projection schema changes must ship with deterministic rebuild logic from raw event history.
- Backfills run as explicit release work with lag budgets, monitoring, and stop or resume controls; they are not hidden inside request handlers.
- Event schemas are backward-compatible by default. Any intentional break requires a new published `CanonicalEventContract`, a new namespace only when the semantics truly fork, and replay proof for every affected consumer.
- Rollback mode must be declared up front as `binary_safe`, `flag_only`, or `rollforward_only`; unknown rollback posture blocks promotion.
- every `SchemaMigrationPlan` and `ProjectionBackfillPlan` must bind one `MigrationExecutionBinding` proving the exact `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `ReleaseWatchTuple`, route-contract digests, projection version sets, projection compatibility digests, `ReadPathCompatibilityWindow`, route-scoped `ProjectionReadinessVerdict` set, admin read-path digest, backfill execution ledger, cutover checkpoint, environment baseline, continuity-control set, provenance state, and `ReleaseRecoveryDisposition` set that the live audiences will rely on during the change window
- schema or backfill control may not execute from scripts, consoles, or dashboards alone; every start, pause, resume, completion, or abort must resolve one `RouteIntentBinding`, persist one `CommandActionRecord`, write one `MigrationActionRecord`, and settle one authoritative `MigrationActionSettlement`
- every `MigrationActionRecord` must bind one exact `MigrationExecutionBinding`, `MigrationImpactPreview`, and current route-scope recovery tuple; migration control may not operate against a moving read-path digest, backfill ledger, or cutover checkpoint
- execution is valid only while `MigrationExecutionBinding.bindingState = ready`, `releaseWatchTupleRef.tupleState = active`, `releasePublicationParityRef.parityState = exact`, and `expectedBindingState` plus `expectedCutoverState` still match live migration truth
- `MigrationActionSettlement.result = applied` is legal only after `MigrationExecutionReceipt.acceptedState = accepted`, `MigrationActionObservationWindow.observationState = satisfied`, the observed read-path digest, projection compatibility digests, projection readiness verdicts, backfill ledger, and cutover checkpoint match the previewed migration tuple, and affected route families expose the declared `live | summary_only | recovery_only | blocked` posture in place
- contractive cutover may not begin until the bound `ReadPathCompatibilityWindow.windowState = cutover_ready`, every affected `ProjectionReadinessVerdict` permits the intended surface posture, the declared rollback publication bundle has been verified against the current environment baseline, and the latest backfill or resume action already settled with an observation window that converged
- if publication parity, provenance state, route-contract digest, compatibility evidence, or environment baseline drifts during a migration or backfill window, the affected audience surfaces must remain in the same shell and degrade through the declared `ReleaseRecoveryDisposition` rather than falling through to generic stale or maintenance behavior
- migration-triggered degradation must localize to the affected route families and audience surfaces; unrelated patient, workspace, operations, governance, hub, or pharmacy routes may not be frozen merely because another read model is rebuilding
- backfill lag, coverage, and route compatibility must remain machine-readable and visible to shells, governance, and operations through `ProjectionReadinessVerdict`; no surface may infer completeness from non-empty projections, old counts, or the absence of transport errors alone
- old code with new data and new code with old projections must resolve only through the declared pre-cutover, target, or rollback publication bundles; silent calmness from accidental mixed-version compatibility is forbidden
- if observed route posture, backfill convergence, or cutover checkpoint differs from the action preview, the settlement must surface `accepted_pending_observation`, `stale_recoverable`, or `rollback_required` rather than reporting clean success
- migration explainers, compatibility-window reports, backfill status views, and recovery guides are governed operator artifacts. They must render through `MigrationPresentationArtifact` and one `ArtifactPresentationContract`; governed preview, export, print, browser, or cross-app handoff may remain live only while the current `ArtifactModeTruthProjection` still validates masking, route posture, and return-safe continuity, and any external movement must consume `OutboundNavigationGrant`
- all visible migration and backfill transitions must emit canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence`; route params, tenant identifiers, artifact fragments, and operational notes may not leak beyond the permitted disclosure class

## Security baseline contract

Production hardening rules:

- Public ingress must enforce rate limiting, origin policy, TLS, and attack-surface filtering before traffic reaches the gateway.
- Patient and staff sessions use separate cookie scopes, HTTP-only secure cookies, CSRF protection, and strict session-expiry behavior.
- Browser-delivered surfaces must define CSP, frame-ancestor, referrer, and download-handling policy explicitly.
- Secrets must come from a managed secret store or KMS-backed mechanism, never from source control or long-lived CI variables.
- Encryption at rest must cover transactional stores, backups, object storage, queue persistence where applicable, and audit exports.
- Logs, traces, and metrics must carry correlation IDs but must not emit raw PHI beyond approved redaction policy.
- Service identities must follow least privilege, and egress must be allowlisted per workload family.
- Break-glass, support replay, and tenant-switch actions must emit heightened audit and alerting signals.

## Verification ladder contract

Every release candidate must pass a layered gate set.

The verification ladder requires five corrections:

1. every gate now runs against one pinned release-and-policy verification scenario rather than loosely related artifacts
2. migration and backfill verification now depends on declared rollback posture instead of generic happy-path testing
3. dependency lifecycle, legacy reference, and standards-drift hygiene now block the ladder explicitly
4. assurance and observability degradation now require slice-bounded rehearsal so one bad producer cannot black out trust globally
5. live-wave proof now records exact wave decisions, observed artifact identity, and emergency-path evidence rather than a generic post-deploy check

Create these verification objects:

**VerificationScenario**
`verificationScenarioId`, `releaseRef`, `artifactDigests`, `bundleHashRefs`, `compiledPolicyBundleRef`, `configCompilationRecordRef`, `configSimulationEnvelopeRef`, `standardsDependencyWatchlistRef`, `standardsWatchlistHash`, `approvalEvidenceBundleRef`, `compilationTupleHash`, `releaseApprovalFreezeRef`, `channelManifestSetRef`, `requiredAssuranceSliceRefs`, `requiredContinuityControlRefs[]`, `releaseWatchTupleRef`, `watchTupleHash`, `routeFamilyRefs`, `routeContractDigestRefs`, `frontendContractManifestRefs[]`, `frontendContractDigestRefs[]`, `designContractPublicationBundleRefs[]`, `designContractDigestRefs[]`, `designContractLintVerdictRefs[]`, `projectionContractVersionSetRefs[]`, `projectionQueryContractDigestRefs[]`, `mutationCommandContractDigestRefs[]`, `liveUpdateChannelDigestRefs[]`, `clientCachePolicyDigestRefs[]`, `commandSettlementSchemaSetRef`, `transitionEnvelopeSchemaSetRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `writableRouteContractCoverageRefs[]`, `continuityContractCoverageRefs[]`, `embeddedSurfaceContractCoverageRefs[]`, `runtimePublicationBundleRef`, `continuityEvidenceContractRefs[]`, `recoveryDispositionRefs`, `crossPhaseConformanceScorecardRef`, `phaseConformanceRowRefs[]`, `schemaMigrationPlanRef`, `projectionBackfillPlanRef`, `migrationExecutionBindingRef`, `waveObservationPolicyRef`, `rollbackMode`, `referenceCaseRefs`, `frameworkVersionRefs`, `requiredGateSet`, `createdAt`

**ReleaseContractVerificationMatrix**
`releaseContractVerificationMatrixId`, `compiledPolicyBundleRef`, `configCompilationRecordRef`, `configSimulationEnvelopeRef`, `candidateBundleHash`, `baselineTupleHash`, `compilationTupleHash`, `routeFamilyRefs[]`, `routeContractDigestRefs[]`, `frontendContractManifestRefs[]`, `frontendContractDigestRefs[]`, `designContractPublicationBundleRefs[]`, `designContractDigestRefs[]`, `designContractLintVerdictRefs[]`, `projectionContractVersionSetRefs[]`, `projectionQueryContractDigestRefs[]`, `mutationCommandContractDigestRefs[]`, `liveUpdateChannelDigestRefs[]`, `clientCachePolicyDigestRefs[]`, `commandSettlementSchemaSetRef`, `transitionEnvelopeSchemaSetRef`, `recoveryDispositionRefs[]`, `requiredContinuityControlRefs[]`, `continuityEvidenceContractRefs[]`, `writableRouteContractCoverageRefs[]`, `continuityContractCoverageRefs[]`, `embeddedSurfaceContractCoverageRefs[]`, `crossPhaseConformanceScorecardRef`, `phaseConformanceRowRefs[]`, `matrixState = exact | stale | blocked`, `matrixHash`, `generatedAt`

`ReleaseContractVerificationMatrix` is the single machine-readable cross-layer contract tuple for one candidate. Compile, simulation, contract gates, runtime publication, and live-wave proof must consume this exact matrix rather than proving local subsets of route, frontend, query, mutation, settlement, recovery, and continuity artifacts independently.

**WritableRouteContractCoverageRecord**
`writableRouteContractCoverageRecordId`, `releaseContractVerificationMatrixRef`, `routeFamilyRef`, `audienceSurfaceRefs[]`, `routeContractDigestRef`, `frontendContractDigestRef`, `projectionQueryContractDigestRef`, `mutationCommandContractDigestRef`, `clientCachePolicyDigestRef`, `commandSettlementSchemaSetRef`, `transitionEnvelopeSchemaSetRef`, `requiredReleaseRecoveryDispositionRefs[]`, `requiredRouteFreezeDispositionRefs[]`, `requiredRouteIntentBindingState = verified | missing | stale`, `requiredCommandSettlementState = verified | missing | stale`, `evidenceRefs[]`, `coverageState = exact | stale | blocked`, `recordedAt`

`WritableRouteContractCoverageRecord` proves that one writable route family is covered end-to-end. OpenAPI or adapter proof alone is insufficient; the same record must show route-intent, release-freeze, command-settlement, transition-envelope, recovery-disposition, and browser-contract alignment for the exact release tuple under test.

**ContinuityContractCoverageRecord**
`continuityContractCoverageRecordId`, `releaseContractVerificationMatrixRef`, `continuityControlCode`, `routeFamilyRefs[]`, `requiredContinuityControlRef`, `continuityEvidenceContractRef`, `simulationEvidenceRef`, `publicationEvidenceRef`, `syntheticRecoveryCoverageRefs[]`, `recoveryDispositionRefs[]`, `coverageState = exact | stale | blocked`, `recordedAt`

`ContinuityContractCoverageRecord` proves that continuity-sensitive workflows stay aligned across simulation, publication, and degraded-mode proof. Naming a control in `requiredContinuityControlRefs[]` is incomplete unless the same record also binds its continuity evidence contract and its synthetic recovery coverage.

**EmbeddedSurfaceContractCoverageRecord**
`embeddedSurfaceContractCoverageRecordId`, `releaseContractVerificationMatrixRef`, `routeFamilyRef`, `audienceSurfaceRef`, `channelFamilyRef`, `channelManifestSetRef`, `minimumBridgeCapabilitySetRef`, `releaseRecoveryDispositionRef`, `routeFreezeDispositionRef`, `compatibilityEvidenceRefs[]`, `coverageState = exact | stale | blocked`, `recordedAt`

`EmbeddedSurfaceContractCoverageRecord` proves that channel-manifest, bridge-capability, and recovery-disposition compatibility for embedded or channel-specific surfaces belongs to the same release tuple as the route and browser contracts. Generic channel schema checks are not sufficient.

**MigrationVerificationRecord**
`migrationVerificationRecordId`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `migrationExecutionBindingRef`, `migrationPlanRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `commandSettlementSchemaSetRef`, `transitionEnvelopeSchemaSetRef`, `requiredContinuityControlRefs[]`, `continuityEvidenceContractRefs[]`, `writableRouteContractCoverageRefs[]`, `continuityContractCoverageRefs[]`, `embeddedSurfaceContractCoverageRefs[]`, `rollbackMode`, `dryRunEvidenceRef`, `backfillConvergenceRef`, `compatibilityWindowEvidenceRef`, `readPathCompatibilityEvidenceRef`, `routeReadinessEvidenceRefs[]`, `rollbackPublicationEvidenceRef`, `migrationObservationEvidenceRef`, `routeRecoveryEvidenceRefs[]`, `restoreCompatibilityState`, `recordedAt`

**AssuranceSliceProbe**
`assuranceSliceProbeId`, `verificationScenarioRef`, `releaseWatchTupleRef`, `sliceRef`, `producerScopeRef`, `watchTupleHash`, `expectedTrustState`, `degradedModeRef`, `executedAt`, `resultState`, `evidenceRef`

**WaveVerificationRecord**
`waveVerificationRecordId`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `releaseWatchTupleRef`, `waveRef`, `waveActionSettlementRef`, `observationWindowRef`, `observedArtifactDigests`, `observedBundleHashRefs`, `observedRouteContractDigestRefs[]`, `observedFrontendContractDigestRefs[]`, `observedDesignContractDigestRefs[]`, `observedDesignContractLintVerdictRefs[]`, `observedProjectionQueryContractDigestRefs[]`, `observedMutationCommandContractDigestRefs[]`, `observedClientCachePolicyDigestRefs[]`, `observedCommandSettlementSchemaSetRef`, `observedTransitionEnvelopeSchemaSetRef`, `observedReleaseApprovalFreezeRef`, `observedWatchTupleHash`, `observedRuntimePublicationBundleRef`, `observedPublicationParityRef`, `observedRequiredContinuityControlRefs[]`, `observedContinuityEvidenceContractRefs[]`, `observedContinuityEvidenceRefs[]`, `syntheticRecoveryCoverageRefs[]`, `observedProvenanceState`, `guardrailSnapshotRef`, `probeRefs`, `recoveryDispositionEvidenceRefs`, `alertAttachmentRefs`, `decisionState = widen | pause | rollback | kill_switch | rollforward`, `decisionBy`, `decisionAt`, `evidenceRef`

Rules:

- all gates for one release must bind to one `VerificationScenario`; if artifact digests, approved bundle hashes, `compiledPolicyBundleRef`, `configCompilationRecordRef`, `configSimulationEnvelopeRef`, `standardsDependencyWatchlistRef`, `standardsWatchlistHash`, `approvalEvidenceBundleRef`, `compilationTupleHash`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, design-contract bundle refs, design-contract digests, design-contract lint verdict refs, or framework versions drift between gates, the ladder restarts
- immutable gate evidence must reference the exact `VerificationScenario`
- every `VerificationScenario` must also pin one exact `ReleaseContractVerificationMatrix`; route contracts, frontend manifests, projection query and mutation contracts, client cache policy, settlement schemas, transition envelopes, recovery dispositions, and continuity evidence contracts may not be verified as unrelated sidecars
- every `VerificationScenario` must also pin one exact `CrossPhaseConformanceScorecard` plus the required `PhaseConformanceRow` set for the phases and cross-phase control families touched by the release; release proof is incomplete if runtime tuples are exact but the planning summaries or Phase 9 proof rows for the same change are stale, blocked, or contradictory
- `rollforward_only` releases must prove their forward-corrective and feature-disable paths; they may not inherit binary-rollback evidence from another posture
- legacy reference findings, unsupported dependency state, unreviewed standards-version impact, or expired standards exceptions in the pinned `StandardsDependencyWatchlist` are release blockers, not advisory warnings
- every writable route family in scope must resolve one `WritableRouteContractCoverageRecord.coverageState = exact`; missing route-intent or command-settlement contract proof for one route family blocks Gate 1, Gate 2, and Gate 5 even if surrounding OpenAPI or adapter checks pass
- every continuity-sensitive workflow in scope must resolve one `ContinuityContractCoverageRecord.coverageState = exact` and later one exact `SyntheticRecoveryCoverageRecord`; simulation, runtime publication, and degraded-mode proof may not drift across separate tuples
- every affected embedded or channel-specific surface must resolve one `EmbeddedSurfaceContractCoverageRecord.coverageState = exact`; channel-manifest or minimum-bridge-capability proof may not pass in a different tuple from route recovery or browser contract proof
- migration and backfill verification must prove partial-read, dual-read, cutover, rollback, and post-action observation behavior for every affected audience surface; patient, workspace, hub, pharmacy, operations, and governance routes may not be treated as safe merely because rebuild jobs are running or a projection returns rows
- any live-wave action taken during Gate 5 must reference one `WaveActionRecord` and one `WaveActionSettlement` bound to the same `VerificationScenario` and `ReleaseWatchTuple`; dashboards and incident tooling may observe those actions, but they may not become the source of truth for whether a wave actually widened, paused, or rolled back
- if `releaseApprovalFreezeRef`, `channelManifestSetRef`, `ReleaseWatchTuple`, `watchTupleHash`, `runtimePublicationBundleRef`, `MigrationExecutionBinding`, route-contract digests, frontend contract digests, design-contract digests, design-contract lint verdict refs, projection compatibility digests, projection query or mutation digests, client-cache policy digests, settlement schemas, transition-envelope schemas, `WaveObservationPolicy`, continuity-evidence contracts, provenance state, declared recovery dispositions, the pinned `StandardsDependencyWatchlist`, the release contract matrix, or the approved config `compilationTupleHash` drift between gates, the ladder restarts because the patient or staff runtime contract has changed
- `requiredContinuityControlRefs[]` and `continuityEvidenceContractRefs[]` must cover the exact continuity-sensitive workflow families touched by the release. A scenario that changes patient navigation, record continuation, more-info reply, conversation settlement, support replay restore, intake resume, booking manage, hub booking manage, assistive session posture, workspace task completion, or pharmacy-console settlement is incomplete unless those control refs and their evidence contracts are pinned into the same verification tuple
- `crossPhaseConformanceScorecardRef` and `phaseConformanceRowRefs[]` must cover the exact programme phases and cross-phase families touched by the release. A scenario that changes runtime publication, continuity evidence, governance proof, ops diagnostics, or BAU readiness is incomplete unless the same tuple proves the affected summary rows still align with canonical contracts and end-state criteria

### Gate 0 - static and unit

- formatting, linting, types
- unit tests
- `CompiledPolicyBundle` compilation, `ConfigCompilationRecord`, compatibility validation, and reference-case simulation pinned to the exact `bundleHashRefs` and `compilationTupleHash`
- build one exact `ReleaseContractVerificationMatrix` for the candidate and fail the gate if frontend manifests, query or mutation contracts, client-cache policy, settlement schemas, transition envelopes, recovery dispositions, or continuity evidence contracts are missing from the same matrix
- build one exact `StandardsDependencyWatchlist` for the candidate and fail the gate if its `watchlistState != current`, if required baseline evidence is missing, or if any blocking finding lacks owner, replacement path, remediation deadline, affected tenant scope, affected live channel, or affected route and simulation refs
- release-manifest completeness check for artifact digests, bundle hashes, migration posture, and framework-version inputs
- dependency lifecycle and legacy-reference scans for retired endpoints, archived documentation, and unsupported runtime assumptions
- `DesignTokenExportArtifact` generation plus `DesignContractPublicationBundle` compilation pinned to the exact `designContractDigestRefs[]`
- `TokenKernelLayeringPolicy` plus `ProfileSelectionResolution` proof that every affected shell and route family is selecting only published density, topology, surface-role, motion, and semantic-color variations from the shared token graph
- `DesignContractLintVerdict` proving token-lattice, mode-resolution, state-semantics, automation-telemetry vocabulary, artifact-mode, and surface-role conformity
- `SurfaceStateKernelBinding` proof that every newly visible state propagates into accessibility, automation, telemetry, and artifact posture without route-local aliases
- design-system snapshot or structural tests covering token-role mapping, state frames, automation markers, telemetry vocabulary, surface-role usage, and route-family accessibility coverage tuples

### Gate 1 - contract and component

- OpenAPI and channel schema compatibility
- behavior-contract and bundle-hash compatibility for affected audience surfaces
- adapter contract tests
- component tests for shells and workspace primitives
- consumer tests for generated client packages
- contract compatibility checks proving changed routes, channels, and projections still honor the declared `VerificationScenario`
- `ReleaseContractVerificationMatrix` parity proving route contracts, frontend manifests, projection query and mutation contracts, client-cache policy, settlement schemas, transition envelopes, recovery dispositions, and continuity evidence contracts all still belong to the same candidate tuple
- design-contract compatibility checks proving changed routes, DOM markers, UI event names, state semantics, and artifact posture still honor the published `DesignContractPublicationBundle`
- `AccessibilitySemanticCoverageProfile` proof for every affected route family, including `mission_stack`, host resize, safe-area, `400%` zoom or equivalent reflow, reduced motion, buffered live-update, replay, and restore posture in the same candidate tuple
- `WritableRouteContractCoverageRecord` proof for every writable route family, including route-intent, release-freeze, and command-settlement contract tests against the same candidate tuple
- channel-manifest and minimum-bridge-capability compatibility checks for affected embedded or channel-specific surfaces
- `EmbeddedSurfaceContractCoverageRecord` proof for affected embedded or channel-specific surfaces, including recovery-disposition compatibility in the same gate
- route-scoped embedded-eligibility parity checks proving generated route contracts, bridge-action policies, and recovery dispositions still match the published manifest and runtime tuple
- runtime-publication parity checks proving generated route contracts, frontend contract manifests, accessibility coverage digests, projection contract families and versions, projection version sets, query contracts, mutation contracts, live-channel contracts, cache policies, settlement schemas, transition-envelope schemas, recovery dispositions, and `AudienceSurfaceRuntimeBinding` tuples match the published `RuntimePublicationBundle`
- topology-publication checks proving `RuntimeTopologyManifest`, `RuntimeWorkloadFamily`, `TrustZoneBoundary`, and `GatewayBffSurface` tuples match the published route and runtime bindings for the affected audiences
- `ContinuityContractCoverageRecord` parity proving the published runtime contract still references the expected continuity controls and evidence digests for affected patient, support, and workflow journeys
- `ContinuityContractCoverageRecord` parity proving any affected `intake_resume`, `booking_manage`, `assistive_session`, `workspace_task_completion`, or `pharmacy_console_settlement` contract still matches the published runtime tuple and its declared recovery modes

### Gate 2 - integration and end-to-end

- end-to-end browser journeys
- accessibility checks
- webhook and callback replay tests
- projection freshness and stale-view recovery tests
- reference-case simulation replay against the exact release candidate, approved bundle set, and approved config `compilationTupleHash`
- cross-layer browser or runtime journeys proving rendered frontend contracts, `RouteIntentBinding`, `CommandSettlementRecord`, settlement schemas, transition envelopes, and recovery dispositions remain aligned with the current `ReleaseContractVerificationMatrix`
- freeze-blocked mutation recovery tests proving shells degrade through the declared `ReleaseRecoveryDisposition` rather than generic failure
- embedded/browser handoff and bridge-incompatibility recovery tests whenever affected route families declare channel dependencies

### Gate 3 - performance and security

- load, soak, and latency-budget tests on critical paths
- dependency, container, and IaC scans
- secret-leak and redaction verification
- abuse, rate-limit, and session-hardening tests
- tenant-isolation, service-identity, and egress-allowlist conformance tests for every affected workload family and trust-zone boundary
- standards-drift, dependency-hygiene, and legacy-reference findings must be reviewed and resolved or explicitly waived through the pinned `StandardsDependencyWatchlist` with immutable evidence

### Gate 4 - resilience and recovery

- projection rebuild from raw events
- bundle-hash and projection-schema replay against the exact `ReleaseCandidate`
- backup restore into a clean environment
- dependency degraded-mode rehearsal
- migration dry-run, compatibility-window proof, backfill convergence checks, and route-recovery observation evidence recorded in `MigrationVerificationRecord`
- `SyntheticRecoveryCoverageRecord` proof bound to the same `VerificationScenario`, `ReleaseWatchTuple`, `RuntimePublicationBundle`, and continuity evidence contracts for affected ordinary-live and constrained recovery journeys
- assurance producer-quarantine rehearsal proving slice-bounded degraded trust instead of global observability blackout
- canary rollback rehearsal, or forward-corrective and kill-switch rehearsal when `rollbackMode = rollforward_only`

### Gate 5 - live wave proof

- synthetic production probes green
- exact wave artifacts and approved bundle hashes match the pinned `VerificationScenario`
- exact `ReleaseContractVerificationMatrix` and `releaseContractMatrixHash` match the pinned `VerificationScenario`
- exact `StandardsDependencyWatchlist` and `standardsWatchlistHash` match the pinned `VerificationScenario`, and no linked exception has expired or been revoked during live-wave proof
- exact `ReleaseApprovalFreeze`, `ReleaseWatchTuple`, `watchTupleHash`, `WaveGuardrailSnapshot`, and `WaveObservationPolicy` match the pinned `VerificationScenario`
- exact `RuntimePublicationBundle`, route-contract digests, projection compatibility digests, and provenance-consumption state match the pinned `VerificationScenario`
- exact frontend contract digests, projection query and mutation digests, client-cache policy digests, settlement schemas, transition envelopes, and synthetic recovery coverage refs match the pinned `VerificationScenario`
- exact `DesignContractPublicationBundle`, `designContractDigestRefs[]`, and `DesignContractLintVerdict.result = pass` match the pinned `VerificationScenario`
- exact `ReleasePublicationParityRecord` remains `parityState = exact` for the pinned watch tuple and published runtime contract
- exact continuity-evidence contracts and observed continuity-evidence refs match the pinned `VerificationScenario`
- alerting and dashboards attached to the wave
- rollback path verified for the exact migration posture
- every widen, pause, resume, rollback, kill-switch, or rollforward decision references `WaveActionSettlement.result` and any required guardrail evidence before operator attribution is accepted as complete
- widen, pause, rollback, kill-switch, or rollforward decision captured in `WaveVerificationRecord` with operator attribution
- governed recovery posture for frozen or degraded cohorts proven on at least one affected patient or staff journey before widening
- post-deploy evidence appended to immutable release history

## CI/CD and supply-chain pipeline contract

The delivery-to-operations handoff seam requires six corrections:

1. pipeline runs must include one immutable execution and stage-settlement chain, so published artifacts could drift from the verified release tuple actually promoted
2. manual hotfix and emergency handling was still expressed as prohibition and policy, not one bounded exception object with expiry, compensating controls, and declared recovery scope
3. operational readiness was still link-based instead of snapshot-based, so stale dashboards, unrehearsed runbooks, or missing recovery coverage could be mistaken for a ready release
4. runbooks, handoff packs, and recovery guides were still treated as loose links rather than governed artifacts with bounded external navigation
5. operator-facing deploy, publish, and readiness actions still did not explicitly require canonical settlement and PHI-safe UI observability, so local acknowledgement could outrun authoritative activation
6. operations-to-governance control handoff still depended on loosely coordinated route checks rather than one published tuple proving both shells are looking at the same writable target and recovery posture

Create these handoff objects:

**PipelineExecutionRecord**
`pipelineExecutionRecordId`, `releaseRef`, `verificationScenarioRef`, `targetRingRef`, `artifactDigests`, `bundleHashRefs`, `runtimePublicationBundleRef`, `releaseWatchTupleRef`, `operationalReadinessSnapshotRef`, `emergencyExceptionRef`, `executionState = running | blocked | ready_for_canary | canary_live | completed | failed`, `startedAt`, `completedAt`

**PipelineStageSettlement**
`pipelineStageSettlementId`, `pipelineExecutionRecordRef`, `stageCode = dependency_resolve | static_gate | sbom_sign | runtime_publish | preview_validate | integration_validate | preprod_validate | canary_promote | wave_control | history_append`, `routeIntentBindingRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `transitionEnvelopeRef`, `expectedArtifactRefs[]`, `observedArtifactRefs[]`, `result = applied | accepted_pending_observation | blocked_policy | stale_recoverable | failed`, `releaseRecoveryDispositionRef`, `settledAt`

**PipelineEmergencyException**
`pipelineEmergencyExceptionId`, `releaseRef`, `scope = publish | canary | widen | rollback | recovery_activation`, `reasonCode`, `compensatingControlRefs[]`, `approvalBundleRef`, `expiresAt`, `requiredFollowUpRef`, `permittedRecoveryDispositionRefs[]`, `exceptionState = requested | approved | expired | reconciled`

**OperationalReadinessSnapshot**
`operationalReadinessSnapshotId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `waveObservationPolicyRef`, `requiredAssuranceSliceRefs[]`, `releaseTrustFreezeVerdictRefs[]`, `dashboardBundleRefs[]`, `runbookBindingRefs[]`, `syntheticCoverageRefs[]`, `essentialFunctionRefs[]`, `essentialFunctionHealthEnvelopeRefs[]`, `recoveryTierRefs[]`, `backupSetManifestRefs[]`, `resilienceSurfaceRuntimeBindingRefs[]`, `recoveryControlPostureRefs[]`, `recoveryEvidencePackRefs[]`, `latestRecoveryEvidencePackRef`, `latestRestoreRunRefs[]`, `latestFailoverRunRefs[]`, `latestChaosRunRefs[]`, `latestJourneyRecoveryProofRefs[]`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHash`, `ownerCoverageState`, `verdictCoverageState = exact | stale | blocked`, `freshnessState = fresh | stale | incomplete`, `rehearsalFreshnessState = fresh | stale | blocked`, `readinessState = ready | constrained | blocked`, `capturedAt`

`OperationalReadinessSnapshot` is the current resilience-readiness tuple for the live release. Restore, failover, chaos, runbook, and evidence-pack posture may not be reconstructed from separate dashboards or stale exercise history once the bound `verificationScenarioRef`, `ReleaseContractVerificationMatrix`, publication parity, watch tuple, backup manifests, or resilience settlements drift.

**RunbookBindingRecord**
`runbookBindingRecordId`, `runbookRef`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `audienceScope`, `routeFamilyRefs[]`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `releaseRecoveryDispositionRefs[]`, `watchTupleHash`, `requiredBackupSetManifestRefs[]`, `requiredRecoveryEvidencePackRefs[]`, `requiredSyntheticRecoveryCoverageRefs[]`, `versionHash`, `lastRehearsedAt`, `lastRehearsalSettlementRef`, `latestRecoveryEvidenceArtifactRefs[]`, `latestResilienceActionSettlementRefs[]`, `resilienceTupleHash`, `bindingHash`, `bindingState = published | stale | rehearsal_required | withdrawn`

`RunbookBindingRecord` is publishable only while its latest rehearsal, required backup manifests, required evidence pack, required synthetic recovery coverage, and current runtime tuple still agree. A runbook may stay visible when stale, but it may not authorize restore, failover, chaos, or recovery activation after tuple drift.

**SyntheticRecoveryCoverageRecord**
`syntheticRecoveryCoverageRecordId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `releaseWatchTupleRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `watchTupleHash`, `audienceScope`, `journeyCode`, `routeFamilyRef`, `requiredContinuityControlRefs[]`, `continuityEvidenceContractRefs[]`, `recoveryDispositionRefs[]`, `routeIntentEvidenceRefs[]`, `commandSettlementEvidenceRefs[]`, `postureType = ordinary_live | constrained | frozen | read_only_recovery | placeholder_recovery`, `coverageState = exact | stale | blocked`, `evidenceRef`, `resultState`, `executedAt`

`SyntheticRecoveryCoverageRecord` is the candidate-bound proof that ordinary-live and constrained recovery journeys still work under the exact release tuple being widened or stabilized. Recovery coverage may not be treated as a late-stage extra once a workflow is named in `requiredContinuityControlRefs[]`.

**ReadinessArtifact**
`readinessArtifactId`, `artifactType = runbook_bundle | dashboard_pack | release_handoff_summary | recovery_activation_guide`, `operationalReadinessSnapshotRef`, `summaryRef`, `artifactPresentationContractRef`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `maskingPolicyRef`, `summarySafetyTier`, `artifactState = summary_only | governed_preview | external_handoff_ready | recovery_only`

**GovernedControlHandoffBinding**
`governedControlHandoffBindingId`, `originSurfaceRef`, `originRouteRef`, `originAudienceSurfaceRuntimeBindingRef`, `originPublicationParityRef`, `originReleaseTrustFreezeVerdictRef`, `targetSurfaceRef`, `targetRouteRef`, `targetAudienceSurfaceRuntimeBindingRef`, `targetPublicationParityRef`, `targetReleaseTrustFreezeVerdictRef`, `releaseApprovalFreezeRef`, `releaseWatchTupleRef`, `activeChannelFreezeRefs[]`, `guardrailSnapshotRef`, `waveObservationPolicyRef`, `recoveryDispositionRefs[]`, `lastWaveActionSettlementRef`, `watchTupleHash`, `bindingState = publishable_live | diagnostic_only | recovery_only | blocked`, `validatedAt`

`GovernedControlHandoffBinding` is the published cross-shell tuple for operations-to-governance control transfer. It proves that both shells are looking at the same writable target, publication parity, release watch tuple, observation policy, freeze posture, `ReleaseTrustFreezeVerdict`, last applicable wave settlement, and bounded recovery mode before governed handoff may advertise live authority.
`bindingState = publishable_live` is legal only while both linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`. If either side downgrades to `diagnostic_only`, `recovery_only`, or `blocked`, handoff must degrade immediately instead of leaving a stale live transfer CTA armed.

The pipeline should run in this order:

1. open one `PipelineExecutionRecord` bound to the pinned `VerificationScenario`, target ring, artifact digests, approved bundle hashes, the exact `ReleaseContractVerificationMatrix`, and expected `RuntimePublicationBundle`
2. resolve pinned dependencies and build immutable artifacts
3. run static, unit, and contract gates
4. generate SBOM, dependency report, and vulnerability decision record
5. sign artifacts and attach provenance to the `ReleaseCandidate`
6. generate and publish one `RuntimePublicationBundle`, the derived `AudienceSurfacePublicationRef` set, one `FrontendContractManifest` per live route-family surface, the active `ProjectionContractFamily`, `ProjectionContractVersion`, and `ProjectionContractVersionSet` rows, one `AudienceSurfaceRuntimeBinding` per live audience surface, one published `RuntimeTopologyManifest` with its `RuntimeWorkloadFamily`, `TrustZoneBoundary`, and `GatewayBffSurface` tuples, one exact `ReleaseContractVerificationMatrix`, and one `ReleasePublicationParityRecord` with route-contract, frontend-contract, accessibility-coverage, projection-compatibility, settlement-schema, transition-envelope, recovery-disposition, continuity-contract, and topology digests
7. record one `PipelineStageSettlement` for runtime publication proving expected and observed publication artifacts, route contracts, frontend manifests, accessibility coverage digests, topology tuples, runtime bindings, parity state, and provenance state still match
8. create preview environments and run smoke plus accessibility checks
9. deploy to integration and execute simulator-backed flows and webhook tests
10. deploy to preprod, run schema migration dry-runs, projection backfill rehearsal, performance tests, and restore proof
11. capture one `OperationalReadinessSnapshot` with current dashboards, runbook bindings, backup manifests, recovery coverage, latest recovery evidence pack, latest resilience settlements, current resilience control posture, and required assurance slices before canary
12. create one `WaveEligibilitySnapshot`, one `WaveObservationPolicy`, one `WaveGuardrailSnapshot`, and one published `ReleaseWatchTuple` for the production canary step, then promote to the canary with synthetic monitoring and guarded feature exposure
13. widen, pause, rollback, or kill-switch only by settling `WaveActionRecord` and `WaveActionSettlement` against the current `ReleaseWatchTuple`; any widening or resume that changes scope or observation duty must publish a superseding tuple before the action can settle as `applied`
14. append immutable release decision, evidence links, operator attribution, and the final watch-tuple lineage
15. publish any required `GovernedControlHandoffBinding` rows for operations-to-governance routes before those shells can advertise governed handoff as a writable path

Rules:

- A `CompiledPolicyBundle` hash and a `ReleaseCandidate` must be approved together when the release changes behavior.
- Artifact signing, provenance, and SBOM generation are mandatory, not optional report attachments.
- every pipeline stage that changes live posture, publishes runtime contracts, or advances release state must settle through one `PipelineStageSettlement`; console progress, transport success, or CI job completion alone are not authoritative release state
- no manual hotfix may bypass release recording, migration posture declaration, rollback evidence, or runtime publication. Emergency movement requires one approved `PipelineEmergencyException` with expiry, compensating controls, and declared `permittedRecoveryDispositionRefs[]`
- If a release is `rollforward_only`, binary rollback is blocked and the approved emergency path is feature disablement or forward corrective release.
- Pipelines must publish the frozen release tuple, the current `ReleaseWatchTuple`, its `watchTupleHash`, the published `ReleaseTrustFreezeVerdict` rows, and active recovery dispositions as machine-readable artifacts for operations and shell consumers; hidden CI-only state is not an acceptable runtime source of truth.
- Pipelines must also publish the active `RuntimePublicationBundle`, published `RuntimeTopologyManifest`, derived `AudienceSurfacePublicationRef` rows, `FrontendContractManifest` rows, `ProfileSelectionResolution` rows, `SurfaceStateKernelBinding` rows, `AccessibilitySemanticCoverageProfile` rows, `ProjectionContractFamily` rows, `ProjectionContractVersion` rows, `ProjectionContractVersionSet` rows, active `CanonicalEventNamespace` rows, active `CanonicalEventContract` rows, active `FhirRepresentationContract` rows, `AudienceSurfaceRuntimeBinding` rows, `ReleaseTrustFreezeVerdict` rows, and `ReleasePublicationParityRecord`; route contracts, frontend manifests, profile-selection tuples, state-kernel bindings, accessibility coverage tuples, projection version tuples, event contracts, FHIR mapping contracts, query or mutation contracts, settlement schemas, transition envelopes, recovery dispositions, topology tuples, continuity-evidence contracts, trust or freeze verdicts, and route writability are not considered live until publication succeeds with `BuildProvenanceRecord.runtimeConsumptionState = publishable`.
- any operations-to-governance control handoff that can open draft, approval, promotion, rollback, or stabilization posture must also publish one `GovernedControlHandoffBinding`; operations and governance may not derive handoff writability from separate route checks, frozen tuples, or shell-local heuristics
- if `RuntimePublicationBundle`, `ReleaseWatchTuple`, `ReleaseTrustFreezeVerdict`, `WaveObservationPolicy`, `routeContractDigestRefs`, `watchTupleHash`, `releaseRecoveryDispositionRefs`, or `OperationalReadinessSnapshot` freshness drifts after preprod or canary, the pipeline must halt or recover in place rather than widening on stale handoff state
- if `ReleaseContractVerificationMatrix`, any `WritableRouteContractCoverageRecord`, any `ContinuityContractCoverageRecord`, or any `EmbeddedSurfaceContractCoverageRecord` drifts after preprod or canary, the pipeline must halt or recover in place rather than widening on stale cross-layer contract proof
- if any required resilience control posture falls below `live_control`, any required runbook binding becomes `stale | rehearsal_required | withdrawn`, or the latest restore, failover, or chaos proof no longer matches the live tuple, canary start, widen, resume, and recovery activation must halt or recover in place rather than widening on stale resilience authority
- if `OperationalReadinessSnapshot.rehearsalFreshnessState != fresh`, if the snapshot `resilienceTupleHash` drifts from the current `verificationScenarioRef`, `ReleaseContractVerificationMatrix`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, or `ReleaseWatchTuple`, or if the latest `RecoveryEvidencePack.packState != current`, canary start, widen, resume, and recovery activation must halt or recover in place rather than treating stale rehearsal evidence as live authority
- any canary start, widen, or resume that publishes a new `ReleaseWatchTuple` must also mint a fresh `OperationalReadinessSnapshot` and republish affected `GovernedControlHandoffBinding` rows before the action may settle as `applied`
- operator-facing deploy approve, emergency exception attach, publish acknowledge, and readiness activation flows must resolve one `RouteIntentBinding`, persist one `CommandActionRecord`, return one authoritative `CommandSettlementRecord`, emit one `UIEventEnvelope`, one `UITransitionSettlementRecord`, one `UIProjectionVisibilityReceipt`, and one `UITelemetryDisclosureFence`, and append the matching `AuditRecord` before the action may settle as authoritative; local acknowledgement is not authoritative production posture

## Operational readiness contract

No production capability is complete until it also has:

- named service owner and on-call path
- named release guardrail owner for wave halt, rollback, kill-switch, and recovery-disposition activation
- SLO and alert thresholds for each essential function
- dashboard links for patient, workspace, booking, hub, pharmacy, and communication health
- dashboard links for active `WaveGuardrailSnapshot`, published `ReleaseTrustFreezeVerdict` rows, required `AssuranceSliceTrustRecord` rows, and any active `ChannelReleaseFreezeRecord`
- machine-readable `EssentialFunctionHealthEnvelope` rows for every essential function in scope, including fallback sufficiency, inline operator constraints, freeze-constrained mitigation posture, and current blast radius
- dashboard links for the active `RuntimePublicationBundle`, route-contract publication state, and any provenance quarantine or revocation affecting live runtime consumption
- dashboard links for the continuity-evidence digests and proofs currently governing affected patient, support, and workflow journeys
- current resilience posture for restore, failover, and chaos controls, including the live `RecoveryControlPosture` set, latest settled recovery runs, and open journey-proof debt for every essential function in scope
- dependency degradation profile and fallback behavior
- runbook links for deploy, rollback, restore, incident triage, and audience-specific `ReleaseRecoveryDisposition` activation
- synthetic journeys covering at least one patient and one staff path per critical domain
- synthetic journeys covering at least one constrained or frozen recovery path when release, channel, or assurance posture blocks ordinary mutation

The readiness layer must materialize one current `OperationalReadinessSnapshot` for every release before canary and again before widening whenever the published runtime tuple, `ReleaseWatchTuple`, `ReleaseTrustFreezeVerdict` rows, `WaveObservationPolicy`, runbooks, or required assurance slices change. A release may not be treated as ready on stale links or human memory.

`OperationalReadinessSnapshot` must stay bound to one exact `VerificationScenario`, one exact `ReleaseContractVerificationMatrix`, one exact `ReleasePublicationParityRecord`, the current `ReleaseWatchTuple`, the current `BackupSetManifest` set, and the current `RecoveryEvidencePack` set through one `resilienceTupleHash`. Restore, failover, chaos, and recovery activation are not current authority once those tuple members diverge, even if dashboards or runbook pages still look healthy.

`OperationalReadinessSnapshot` must also publish one current `EssentialFunctionHealthEnvelope` per essential function in scope, each joining required assurance trust, release and channel freeze posture, fallback sufficiency, and current resilience control posture. Dashboard packs, ops boards, and governed handoff summaries may not derive healthier function state from partial links or stale dashboard memory.

`OperationalReadinessSnapshot.readinessState = ready` is legal only while `verdictCoverageState = exact` and every required `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live` for the audience surfaces in scope. Constrained, diagnostic-only, frozen, or stale verdict coverage must downgrade readiness before widening proceeds.

The readiness layer must also consume current resilience proof rather than loose rehearsal references. `OperationalReadinessSnapshot.readinessState = ready` is legal only while required `RunbookBindingRecord` rows are `published`, required recovery-control posture is still `live_control`, and the latest restore, failover, and chaos evidence remains fresh enough for the current runtime tuple and essential functions in scope.

`RunbookBindingRecord.bindingState = published` is legal only while its `resilienceTupleHash` still matches the current `OperationalReadinessSnapshot.resilienceTupleHash`, every required backup manifest remains `current`, every required `RecoveryEvidencePack.packState = current`, and every required `SyntheticRecoveryCoverageRecord.coverageState = exact` for the affected recovery posture.

Every deploy, rollback, restore, incident-triage, and audience-specific recovery runbook must bind through one `RunbookBindingRecord` to the current `RuntimePublicationBundle`, `ReleaseWatchTuple`, `watchTupleHash`, and declared `ReleaseRecoveryDisposition` set for the affected audiences. If a runbook is unrehearsed, stale, or withdrawn for the live tuple, readiness becomes `constrained | blocked` rather than silently green.

Restore, failover, and chaos evidence must feed readiness directly. Latest `RestoreRun`, `FailoverRun`, `ChaosRun`, journey-proof artifacts, and recovery-pack attestations must either match the current live tuple or explicitly downgrade readiness and governed handoff posture instead of remaining as detached operator history.

Patient, staff, support, and embedded recovery coverage must be explicit. `SyntheticRecoveryCoverageRecord` must prove at least one ordinary-live journey and one constrained or frozen recovery journey for each affected critical domain before widening continues, and it must stay bound to the same `VerificationScenario`, `ReleaseContractVerificationMatrix`, `ReleaseWatchTuple`, and `RuntimePublicationBundle` the live wave is consuming.

Runbook bundles, dashboard packs, release handoff summaries, and recovery activation guides are governed operator artifacts. They must render through `ReadinessArtifact` and one `ArtifactPresentationContract`; governed preview, print, export, browser, or cross-app handoff may remain live only while the current `ArtifactModeTruthProjection` still validates masking, route posture, and return-safe continuity, and any external movement must consume `OutboundNavigationGrant` rather than using loose document URLs.

## Linked documents

This blueprint is intended to be used with:

- `phase-0-the-foundation-protocol.md`
- `platform-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `phase-7-inside-the-nhs-app.md`
- `phase-8-the-assistive-layer.md`
- `phase-9-the-assurance-ledger.md`
