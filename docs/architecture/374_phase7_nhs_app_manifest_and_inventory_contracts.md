# 374 Phase 7 NHS App Manifest And Inventory Contracts

## Contract Boundary

This pack freezes the first Phase 7 NHS App manifest and route inventory contract for `par_374`. It does not claim NHS App partner approval, SCAL sign-off, connection agreement completion, or live release. The current posture remains `open_phase7_with_constraints`, inherited from `seq_373`.

The manifest is the only source of truth for NHS App route exposure. A patient-facing route may exist in the product and still be hidden from the NHS App if its `JourneyPathDefinition`, `JumpOffMapping`, continuity evidence, or release tuple is incomplete.

## Frozen Objects

### NHSAppIntegrationManifest

`NHSAppIntegrationManifest` freezes the route and release tuple that later runtime work must serve unchanged:

- `manifestId`
- `manifestVersion`
- `baseUrlsByEnvironment`
- `allowedJourneyPaths`
- `jumpOffMappings`
- `requiresNhsLogin`
- `supportsEmbeddedMode`
- `minimumBridgeCapabilitiesRef`
- `telemetryContractRef`
- `cohortRules`
- `serviceDeskProfileRef`
- `evidencePackRef`
- `configFingerprint`
- `releaseCandidateRef`
- `releaseApprovalFreezeRef`
- `behaviorContractSetRef`
- `surfaceSchemaSetRef`
- `compatibilityEvidenceRef`
- `approvedAt`
- `supersedesManifestId`
- `changeNoticeRef`
- `currentReleaseState`

`approvedAt` in the example fixture means local contract-freeze approval only. External NHS App approval remains a future gate, and `currentReleaseState` stays `contract_frozen_not_promoted`.

### JourneyPathDefinition

Each `JourneyPathDefinition` classifies one Phase 1-6 patient route family and binds it to the embedded, continuity, artifact, and intake contracts it must obey:

- `journeyPathId`
- `routePattern`
- `journeyType`
- `requiresAuth`
- `minimumAssuranceLevel`
- `supportsResume`
- `supportsDeepLink`
- `embeddedReadinessState`
- `minimumBridgeCapabilitiesRef`
- `embeddedNavEligibilityContractRef`
- `fallbackRoute`
- `routeOwner`
- `changeClass`
- `channelFallbackBehaviour`
- `shellConsistencyProfileRef`
- `visibilityTierRef`
- `summarySafetyTier`
- `placeholderContractRef`
- `requiresStepUpForFullDetail`
- `continuityControlCode`
- `continuityEvidenceContractRef`
- `intakeConvergenceContractRef`
- `outboundNavigationPolicyRef`
- `artifactPresentationContractRef`
- `routeFreezeDispositionRef`

The inventory groups every Phase 1-6 patient-facing route into exactly one classification:

- `safe_for_nhs_app_now`
- `needs_embedded_adaptation_first`
- `not_suitable_in_phase7`

`safe_for_nhs_app_now` means the route is eligible for first-wave manifest inclusion after downstream implementation and partner assurance. It does not mean the route is live in the NHS App.

### JumpOffMapping

`JumpOffMapping` binds NHS App placement and ODS visibility to a safe journey path:

- `mappingId`
- `nhsAppPlacement`
- `odsVisibilityRule`
- `journeyPathId`
- `copyVariantRef`
- `releaseCohortRef`

Partial visibility is explicit. A route can be present in the registry but absent from jump-off mappings until its classification and cohort policy allow exposure.

### Evidence And Promotion

`IntegrationEvidencePack`, `ManifestPromotionBundle`, `NHSAppContinuityEvidenceBundle`, and `ServiceDeskProfile` are frozen as schema contracts. They require:

- demo environment URL, UX audit, clinical safety, privacy, SCAL, incident runbook evidence, and service desk profile before partner-facing assurance
- one immutable promotion tuple containing `manifestVersion`, `environment`, `configFingerprint`, `releaseCandidateRef`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, and `compatibilityEvidenceRef`
- one continuity evidence bundle for each promoted journey path, with `validationState` constrained to `trusted`, `degraded`, `stale`, or `blocked`

## Route Inventory Decisions

The registry in `data/contracts/374_phase7_journey_path_registry.json` closes the five Phase 7 gaps:

| Gap | Freeze rule |
| --- | --- |
| Route exists does not imply NHS App eligibility | each route has a required `classification` and only safe routes appear in `allowedJourneyPaths` |
| No environment drift under one release label | all environments share one `manifestVersion` and `configFingerprint`; drift requires a superseding manifest |
| Partial visibility is included in the manifest | jump-off mappings carry `odsVisibilityRule` and `releaseCohortRef` rather than relying on route existence |
| Continuity evidence is required at promotion | every promoted route requires `NHSAppContinuityEvidenceBundle` and a `releaseApprovalFreezeRef` |
| Embedded intake binds the same intake contract | medical, admin, and draft routes all bind the same `IntakeConvergenceContract` as browser intake |

## Environment Tuple

`data/contracts/374_phase7_environment_base_url_registry.json` defines `local_preview`, `sandpit`, `aos`, `limited_release`, and `full_release`. Every environment row carries the same manifest tuple until a future change notice creates a superseding manifest.

The first valid runtime implementation for `par_377` must serve the manifest from this registry and must fail closed if any environment attempts to publish the same release label with a different `configFingerprint`.

## Downstream Handoff

This pack unblocks `par_377` for the manifest and jump-off mapping service. It leaves the following work out of scope:

- SSO bridge and embedded context behavior, owned by `par_375`, `par_378`, and `par_379`
- webview file handling, bridge limits, SCAL evidence capture, and release guardrails, owned by `par_376` and later assurance tracks
- Sandpit, AOS, limited release, full release, and external NHS App team approval, which remain constrained future launch controls
